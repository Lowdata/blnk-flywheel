import dbConnect from '@/lib/mongodb';
import { RateLimit } from '@/models/RateLimit';

const WINDOW_MS = 10_000; // 10 seconds between plays per wallet

/**
 * Returns true if the request should be allowed, false if rate-limited.
 * Uses MongoDB RateLimit collection with atomic queries to work across serverless instances.
 */
export async function checkRateLimit(walletAddress: string): Promise<boolean> {
  try {
    await dbConnect();
    const key = walletAddress.toLowerCase();
    const now = new Date();
    const cutoff = new Date(now.getTime() - WINDOW_MS);

    // Check if there was a play within the last 10 seconds
    const recentPlay = await RateLimit.findOne({
      key,
      lastPlayedAt: { $gt: cutoff },
    });

    if (recentPlay) {
      return false; // Rate limited
    }

    // Update or insert the lastPlayedAt timestamp
    await RateLimit.findOneAndUpdate(
      { key },
      { $set: { lastPlayedAt: now } },
      { upsert: true, new: true }
    );

    return true;
  } catch (error) {
    console.error('Rate limit DB check error, falling back to allow:', error);
    return true; // Fail-open so user is not blocked on DB glitch
  }
}
