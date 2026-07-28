import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { handle } = await request.json();
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (!session.siwe) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!handle || handle.length < 2) {
      return NextResponse.json({ ok: false, message: 'Invalid Twitter handle' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ walletAddress: session.siwe.address });

    if (!user) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    if (user.twitterLinked) {
      return NextResponse.json({ ok: false, message: 'Twitter already linked' }, { status: 400 });
    }

    // Link Twitter and grant 10 coins
    user.twitterHandle = handle.startsWith('@') ? handle : `@${handle}`;
    user.twitterLinked = true;
    user.coins += 10;
    
    await user.save();

    return NextResponse.json({ ok: true, coins: user.coins, handle: user.twitterHandle });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
