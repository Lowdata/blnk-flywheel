import { db } from "./db";

/** The full ball balance for a wallet.
 *
 *  One definition, used by both the holder route and the claim endpoint — a
 *  second copy would eventually disagree with this one, and the claim endpoint
 *  is exactly where that must not happen. */
export interface Balance {
  accrued: number;
  credited: number;
  spent: number;
  total: number;
}

async function sum(query: string, wallet: string): Promise<number> {
  const { rows } = await db().query<{ total: string | null }>(query, [wallet]);
  return Number(rows[0]?.total ?? 0);
}

/** Everything except live accrual, which depends on current holdings and so is
 *  passed in by the caller. */
export async function bankedBalls(wallet: string): Promise<{ credited: number; spent: number }> {
  const [banked, granted, spent] = await Promise.all([
    sum(
      `SELECT SUM(balls_credited)::text AS total FROM soft_stakes
        WHERE wallet = $1 AND ended_at IS NOT NULL`,
      wallet
    ),
    sum(`SELECT SUM(balls)::text AS total FROM ball_grants WHERE wallet = $1`, wallet),
    sum(`SELECT SUM(balls)::text AS total FROM ball_spends WHERE wallet = $1`, wallet),
  ]);

  return { credited: banked + granted, spent };
}
