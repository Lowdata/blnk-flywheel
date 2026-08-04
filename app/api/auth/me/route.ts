import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import '@/models/Task'; // Import to register schema
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.siwe) {
    return NextResponse.json({ ok: false, message: 'Not logged in', user: null }, { status: 200 });
  }

  await dbConnect();
  const user = await User.findOne({ walletAddress: session.siwe.address }).populate('completedTasks');

  if (!user) {
    // If user has a cookie but isn't in DB (e.g. from a past error), force logout
    session.destroy();
    return NextResponse.json({ ok: false, message: 'User not found in DB', user: null }, { status: 200 });
  }

  return NextResponse.json({
    ok: true,
    address: session.siwe.address,
    user: user,
  });
}
