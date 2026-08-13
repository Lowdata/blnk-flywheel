import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getGameWindow } from '@/lib/gameWindow';

const COINS_PER_PLAY = 3;

/**
 * Cryptographically secure random float in [0, 1).
 * Uses crypto.getRandomValues which is available in the Node.js
 * Edge and server runtimes — no Math.random() for game outcomes.
 */
function secureRandom(): number {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / 0x100000000;
}

export async function POST(request: Request) {
    try {
        // -- Game window gate (no I/O — pure env var computation) ---------------
        // Must be the FIRST check: cheapest possible rejection for invalid timing.
        const { isOpen, end: windowEnd } = getGameWindow();
        if (!isOpen) {
            return NextResponse.json(
                { ok: false, message: 'The game window is currently closed.', windowClosed: true },
                { status: 403 }
            );
        }

        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

        if (!session.siwe) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }


        const walletAddress: string = session.siwe.address;

        // -- Anti-spam: rate limit per wallet (MongoDB backed) -------------
        const allowed = await checkRateLimit(walletAddress);
        if (!allowed) {
            return NextResponse.json(
                { ok: false, message: 'Too many requests. Please wait before playing again.' },
                { status: 429 }
            );
        }

        await dbConnect();
        const user = await User.findOne({ walletAddress });

        if (!user) {
            return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
        }

        if (user.coins < COINS_PER_PLAY) {
            return NextResponse.json(
                { ok: false, message: `Not enough coins. You need ${COINS_PER_PLAY} coins to play.` },
                { status: 400 }
            );
        }

        // ── Server-side RNG (crypto — never Math.random) ──────────────────
        // Odds: GTD 0.1%, FCFS 2%, LOSS 97.9%
        const rand = secureRandom();
        let outcome: 'GTD' | 'FCFS' | 'LOSS' = 'LOSS';
        if (rand < 0.001) {
            outcome = 'GTD';
        } else if (rand < 0.021) {
            outcome = 'FCFS';
        }

        // ── Block GTD on first 2 spins ────────────────────────────────────
        // totalPlays is 0-indexed at this point (before this play is recorded).
        // So plays 0 and 1 (i.e. the 1st and 2nd spin) cannot yield GTD.
        const playsBeforeThis = user.totalPlays ?? 0;
        if (outcome === 'GTD' && playsBeforeThis < 2) {
            // Downgrade to FCFS or LOSS based on a re-roll among remaining odds.
            // After removing GTD (0.1%) from pool: FCFS 2% / 99.9% remaining = ~2.002%
            outcome = secureRandom() < 0.02002 ? 'FCFS' : 'LOSS';
        }

        // ── Cap: user may only hold 1 unclaimed reward per type ───────────
        if (outcome !== 'LOSS') {
            const unclaimedCount = (user.rewards ?? []).filter(
                (r: any) => r.type === outcome && r.claimed === false
            ).length;
            if (unclaimedCount >= 1) {
                outcome = 'LOSS';
            }
        }

        // -- Single atomic update: Coin deduction + Reward creation + play count
        const updateOp: any = {
            $inc: { coins: -COINS_PER_PLAY, totalPlays: 1 }
        };
        if (outcome !== 'LOSS') {
            updateOp.$push = {
                rewards: {
                    type: outcome,
                    claimed: false,
                    createdAt: new Date(),
                }
            };
        }

        const updated = await User.findOneAndUpdate(
            { walletAddress, coins: { $gte: COINS_PER_PLAY } },
            updateOp,
            { new: true }
        );

        if (!updated) {
            return NextResponse.json(
                { ok: false, message: 'Coin deduction failed. Please try again.' },
                { status: 409 }
            );
        }

        return NextResponse.json({
            ok: true,
            outcome,
            coinsLeft: updated.coins,
        });
    } catch (e: any) {
        console.error('[/api/game/play]', e);
        return NextResponse.json(
            { ok: false, message: e.message || 'Internal error' },
            { status: 500 }
        );
    }
}
