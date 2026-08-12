import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import '@/models/Task'; // register Task schema for populate
import { NextResponse } from 'next/server';

// Rate limit: max 1 call per 2 seconds per session (zero extra DB calls)
const RATE_LIMIT_MS = 2_000;

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.siwe) {
    return NextResponse.json({ ok: false, message: 'Not logged in', user: null }, { status: 200 });
  }

  // ── Session-based rate limit (no DB) ──────────────────────────────────────
  const now = Date.now();
  if (session.lastMeAt && now - session.lastMeAt < RATE_LIMIT_MS) {
    return NextResponse.json(
      { ok: false, message: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '2' } }
    );
  }
  session.lastMeAt = now;
  await session.save();

  await dbConnect();

  // Use .lean() — returns plain JS object (no Mongoose Document overhead).
  // Don't populate completedTasks: client already has the full task list from
  // /api/tasks and can match IDs client-side — no need to re-fetch full Task docs.
  const user = await User.findOne({ walletAddress: session.siwe.address })
    .select('-__v')
    .lean();

  if (!user) {
    session.destroy();
    return NextResponse.json({ ok: false, message: 'User not found in DB', user: null }, { status: 200 });
  }

  return NextResponse.json(
    {
      ok: true,
      address: session.siwe.address,
      user,
    },
    {
      headers: { 'Cache-Control': 'private, no-store' },
    }
  );
}
