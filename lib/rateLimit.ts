/**
 * Simple in-memory token bucket rate limiter.
 * Limits each wallet to 1 play request per WINDOW_MS.
 * NOTE: This is per-instance; use Redis for multi-replica deployments.
 */

const WINDOW_MS = 10_000; // 10 seconds between plays per wallet
const store = new Map<string, number>(); // wallet → last allowed timestamp

/**
 * Returns true if the request should be allowed, false if rate-limited.
 */
export function checkRateLimit(walletAddress: string): boolean {
    const now = Date.now();
    const last = store.get(walletAddress.toLowerCase()) ?? 0;
    if (now - last < WINDOW_MS) return false;
    store.set(walletAddress.toLowerCase(), now);
    return true;
}

// Prune old entries every minute to prevent memory growth
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const cutoff = Date.now() - WINDOW_MS * 2;
        for (const [key, ts] of store.entries()) {
            if (ts < cutoff) store.delete(key);
        }
    }, 60_000);
}
