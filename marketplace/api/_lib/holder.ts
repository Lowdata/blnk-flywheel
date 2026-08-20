import { db, ballsBetween, HttpError } from "./db";
import { bankedBalls } from "./balance";
import { fetchHoldings, findTransferOutTime, type HeldToken } from "./blockscout";
import { fetchImagesForOwner, HAS_OPENSEA } from "./opensea";

export interface ActiveStake {
  tokenId: string;
  stakedAt: Date;
}

export interface HolderSnapshot {
  held: HeldToken[];
  active: ActiveStake[];
  accrued: number;
  /** Banked from ended stakes, plus manual grants. */
  credited: number;
  /** Already spent on allowlist spots and the Colour Machine. */
  spent: number;
}

/** Reads holdings, then reconciles them against the ledger.
 *
 *  The rule: soft-staking stops when the token leaves the wallet, but balls
 *  already earned are kept. So a stake on a token the wallet no longer holds is
 *  closed and credited up to the *transfer* time — not to now, which would pay
 *  out for time the holder didn't hold it. */
export async function loadHolder(wallet: string): Promise<HolderSnapshot> {
  const held = await resolveArtwork(await fetchHoldings(wallet), wallet);
  const heldIds = new Set(held.map((t) => t.tokenId));

  const { rows: active } = await db().query<{ token_id: string; staked_at: Date }>(
    `SELECT token_id, staked_at FROM soft_stakes
      WHERE wallet = $1 AND ended_at IS NULL`,
    [wallet]
  );

  const departed = active.filter((row) => !heldIds.has(row.token_id));

  for (const row of departed) {
    const leftAt = (await findTransferOutTime(wallet, row.token_id)) ?? new Date();
    // Guard against a clock/index skew putting the transfer before the stake.
    const endedAt = leftAt > row.staked_at ? leftAt : row.staked_at;
    await db().query(
      `UPDATE soft_stakes
          SET ended_at = $1, balls_credited = $2, ended_reason = 'transferred'
        WHERE wallet = $3 AND token_id = $4 AND ended_at IS NULL`,
      [endedAt, ballsBetween(row.staked_at, endedAt), wallet, row.token_id]
    );
  }

  const stillActive = active
    .filter((row) => heldIds.has(row.token_id))
    .map((row) => ({ tokenId: row.token_id, stakedAt: row.staked_at }));

  const now = new Date();
  const accrued = stillActive.reduce((sum, s) => sum + ballsBetween(s.stakedAt, now), 0);




  const { credited, spent } = await bankedBalls(wallet);

  return { held, active: stillActive, accrued, credited, spent };
}

export function requireWallet(value: unknown): string {
  if (typeof value !== "string") throw new HttpError(400, "wallet is required");
  return value;
}

/** Swap unreachable IPFS image URIs for OpenSea's CDN copies.
 *
 *  Cache first, so a page load costs no OpenSea calls once warm. Anything still
 *  missing triggers one sweep of the wallet, and whatever that returns is
 *  written back. A failure here must never break the holdings read — the UI
 *  falls back to its colour swatch, which is a far better outcome than an error
 *  page because a third-party CDN is down.
 */
async function resolveArtwork(held: HeldToken[], wallet: string): Promise<HeldToken[]> {
  if (held.length === 0) return held;

  try {
    const ids = held.map((t) => t.tokenId);
    const { rows } = await db().query<{ token_id: string; image_url: string }>(
      `SELECT token_id, image_url FROM nft_images WHERE token_id = ANY($1::text[])`,
      [ids]
    );

    const images = new Map(rows.map((r) => [r.token_id, r.image_url]));
    const missing = ids.filter((id) => !images.has(id));

    if (missing.length > 0 && HAS_OPENSEA) {
      const fetched = await fetchImagesForOwner(wallet);
      for (const [tokenId, url] of fetched) {
        if (!ids.includes(tokenId)) continue;
        images.set(tokenId, url);
        await db().query(
          `INSERT INTO nft_images (token_id, image_url) VALUES ($1, $2)
           ON CONFLICT (token_id) DO UPDATE SET image_url = EXCLUDED.image_url, fetched_at = now()`,
          [tokenId, url]
        );
      }
    }

    return held.map((token) => ({ ...token, image: images.get(token.tokenId) ?? token.image }));
  } catch (error) {
    console.error("Artwork resolution failed, falling back to metadata URIs:", error);
    return held;
  }
}

/** Live accrual for a wallet's still-held, actively staked tokens.
 *
 *  Shared with the claim endpoint so affordability is judged by exactly the
 *  same number the dashboard shows. */
export async function loadActiveAccrual(wallet: string, held: HeldToken[]): Promise<number> {
  const heldIds = new Set(held.map((t) => t.tokenId));
  const { rows } = await db().query<{ token_id: string; staked_at: Date }>(
    `SELECT token_id, staked_at FROM soft_stakes WHERE wallet = $1 AND ended_at IS NULL`,
    [wallet]
  );
  const now = new Date();
  return rows
    .filter((row) => heldIds.has(row.token_id))
    .reduce((sum, row) => sum + ballsBetween(row.staked_at, now), 0);
}
