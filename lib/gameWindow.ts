/**
 * lib/gameWindow.ts
 *
 * Single source of truth for the game window schedule.
 *
 * Env vars (set in Vercel / .env.local — no redeploy needed):
 *   GAME_WINDOW_START          ISO-8601 UTC  e.g. "2026-08-20T18:00:00Z"
 *   GAME_WINDOW_DURATION_HOURS positive num  e.g. "48"
 *
 * Security / correctness notes:
 *  - Defaults to isOpen=false if env vars are absent or invalid → locked by default
 *  - All computation is server-side; client only receives derived booleans + timestamps
 *  - No Math.random, no user-supplied values → no injection surface
 */

export interface GameWindowInfo {
  isOpen: boolean;
  start: Date | null;
  end: Date | null;
  durationHours: number | null;
  /** ms until window opens (only set when window hasn't started yet) */
  msUntilOpen: number | null;
  /** ms remaining in the window, null if closed */
  msRemaining: number | null;
}

export function getGameWindow(): GameWindowInfo {
  const rawStart = process.env.GAME_WINDOW_START;
  const rawDuration = process.env.GAME_WINDOW_DURATION_HOURS;

  // --- Parse & validate -------------------------------------------------------
  let start: Date | null = null;
  let durationHours: number | null = null;

  if (rawStart) {
    const parsed = new Date(rawStart);
    if (!isNaN(parsed.getTime())) start = parsed;
  }

  if (rawDuration) {
    const parsed = parseFloat(rawDuration);
    if (isFinite(parsed) && parsed > 0) durationHours = parsed;
  }

  // --- Derive end & open state ------------------------------------------------
  const end: Date | null =
    start && durationHours
      ? new Date(start.getTime() + durationHours * 3_600_000)
      : null;

  const now = Date.now();
  const isOpen = start && end
    ? now >= start.getTime() && now <= end.getTime()
    : false;

  const msUntilOpen =
    start && !isOpen && now < start.getTime() ? start.getTime() - now : null;

  const msRemaining = isOpen && end ? end.getTime() - now : null;

  return { isOpen, start, end, durationHours, msUntilOpen, msRemaining };
}

/**
 * Returns a lightweight serialisable snapshot safe to send to the client.
 * Omits internal Date objects — only ISO strings + booleans.
 */
export function getGameWindowPublic() {
  const { isOpen } = getGameWindow();
  return {
    isOpen,
  };
}
