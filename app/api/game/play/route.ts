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
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / (0xFFFFFFFF + 1);
}

export async function POST() {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

        if (!session.siwe) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        const walletAddress: string = session.siwe.address;

        // ── Anti-spam: rate limit per wallet ──────────────────────────────
        if (!checkRateLimit(walletAddress)) {
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

        // ── Atomic coin deduction ─────────────────────────────────────────
        // findOneAndUpdate with $inc and a minimum check prevents race conditions
        const updated = await User.findOneAndUpdate(
            { walletAddress, coins: { $gte: COINS_PER_PLAY } },
            { $inc: { coins: -COINS_PER_PLAY } },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json(
                { ok: false, message: 'Coin deduction failed. Please try again.' },
                { status: 409 }
            );
        }

        // ── Server-side RNG (crypto — never Math.random) ──────────────────
        // Odds: GTD 5%, FCFS 30%, LOSS 65%
        const rand = secureRandom();
        let outcome: 'GTD' | 'FCFS' | 'LOSS' = 'LOSS';
        if (rand < 0.05) {
            outcome = 'GTD';
        } else if (rand < 0.35) {
            outcome = 'FCFS';
        }

        // Record win
        if (outcome !== 'LOSS') {
            await User.updateOne(
                { _id: updated._id },
                {
                    $push: {
                        rewards: {
                            type: outcome,
                            claimed: false,
                            createdAt: new Date(),
                        },
                    },
                }
            );
        }

        return NextResponse.json({
            ok: true,
            outcome,
            coinsLeft: updated.coins,
        });
    } catch (e: any) {
        console.error('[/api/game/play]', e);
        return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
    }
}
