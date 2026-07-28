import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Reward } from '@/models/Reward';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (!session.siwe) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ walletAddress: session.siwe.address });

    if (!user) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    if (user.coins < 1) {
      return NextResponse.json({ ok: false, message: 'Not enough coins' }, { status: 400 });
    }

    // Deduct coin
    user.coins -= 1;
    await user.save();

    // Determine win based on RNG (e.g., 20% GTD, 30% FCFS, 50% LOSS)
    const rand = Math.random();
    let outcome: 'GTD' | 'FCFS' | 'LOSS' = 'LOSS';

    if (rand < 0.2) {
      outcome = 'GTD';
    } else if (rand < 0.5) {
      outcome = 'FCFS';
    }

    if (outcome !== 'LOSS') {
      await Reward.create({
        userId: user._id,
        type: outcome,
        claimed: false,
      });
    }

    return NextResponse.json({ ok: true, outcome, coinsLeft: user.coins });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
