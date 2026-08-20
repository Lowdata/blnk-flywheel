import { Pool } from "pg";

/** One pool per warm lambda. Serverless spins up many instances, so DATABASE_URL
 *  should be a *pooled* connection string (pgBouncer / Neon pooler) or Postgres
 *  will run out of connections under load. */
let pool: Pool | undefined;

export function db(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    // A missing connection string is a deployment problem, not a bug — say so
    // instead of surfacing an opaque 500 in the holder's toast.
    if (!connectionString) {
      throw new HttpError(503, "Soft-staking is offline: the ledger database is not configured");
    }
    pool = new Pool({
      connectionString,
      max: 3,
      idleTimeoutMillis: 10_000,
      ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export const DAY_SECONDS = 86_400;

/** Colour Balls earned per soft-staked NFT per day. */
export const BALLS_PER_DAY = 3;

/** Accrual ticks continuously rather than dumping 3 balls at midnight — one
 *  ball every 8 hours — so the daily total lands exactly on 3 while a holder
 *  still sees progress within hours of filling. */
export const SECONDS_PER_BALL = DAY_SECONDS / BALLS_PER_DAY;

/** The single accrual definition the API trusts. */
export function ballsBetween(from: Date, to: Date): number {
  const seconds = Math.floor((to.getTime() - from.getTime()) / 1000);
  return Math.max(0, Math.floor(seconds / SECONDS_PER_BALL));
}

export function normalizeWallet(wallet: unknown): string {
  if (typeof wallet !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    throw new HttpError(400, "Invalid wallet address");
  }
  return wallet.toLowerCase();
}

export function normalizeTokenIds(tokenIds: unknown): string[] {
  if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
    throw new HttpError(400, "tokenIds must be a non-empty array");
  }
  if (tokenIds.length > 200) {
    throw new HttpError(400, "Too many tokens in one request (max 200)");
  }
  const clean = tokenIds.map((id) => {
    if (typeof id !== "string" || !/^\d+$/.test(id)) {
      throw new HttpError(400, `Invalid token id: ${String(id)}`);
    }
    return id;
  });

  // Canonical form: deduped and numerically sorted. The signed message quotes
  // this list, and /nonce and /stake derive it independently — they only agree
  // if both normalize the same way, whatever order the client sent.
  return [...new Set(clean)].sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0));
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}
