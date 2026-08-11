import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

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
        // Odds: GTD 15%, FCFS 35%, LOSS 50%
        const rand = secureRandom();
        let outcome: 'GTD' | 'FCFS' | 'LOSS' = 'LOSS';
        if (rand < 0.15) {
            outcome = 'GTD';
        } else if (rand < 0.50) {
            outcome = 'FCFS';
        }

        // -- Single atomic update: Coin deduction + Reward creation --------
        const updateOp: any = {
            $inc: { coins: -COINS_PER_PLAY }
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
