import { NextResponse } from 'next/server';
import { getGameWindowPublic } from '@/lib/gameWindow';

/**
 * GET /api/game/window
 *
 * Public endpoint — no auth required.
 * Returns the current game window state for the frontend to drive
 * countdown timers and locked states.
 *
 * Cache-Control: max-age=30 so CDN/browser caches for 30s.
 * This means the client gets near-real-time data without hammering the server.
 * The game/play route is the authoritative server-side gate.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const window = getGameWindowPublic();

  return NextResponse.json(window, {
    status: 200,
    headers: {
      // Cache for 30s at the edge — reduces load, still close to real-time
      'Cache-Control': 'public, max-age=30, s-maxage=30',
    },
  });
}
