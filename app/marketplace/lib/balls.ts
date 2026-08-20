import type { BlnkNft } from "../contracts/types";

export const DAY_SECONDS = 86_400;

/** Colour Balls earned per soft-staked NFT per day. */
export const BALLS_PER_DAY = 3;

/** Accrual ticks continuously rather than dumping 3 balls at midnight, so a
 *  holder sees progress within hours of filling. At 3/day that's one ball every
 *  8 hours, and the daily total still lands exactly on 3. */
export const SECONDS_PER_BALL = DAY_SECONDS / BALLS_PER_DAY;

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function accruedBalls(nft: BlnkNft, now = nowSeconds()): number {
  if (nft.status === "unstaked" || nft.since <= 0) return 0;
  return Math.max(0, Math.floor((now - nft.since) / SECONDS_PER_BALL));
}

export function totalAccrued(nfts: BlnkNft[], now = nowSeconds()): number {
  return nfts.reduce((sum, nft) => sum + accruedBalls(nft, now), 0);
}

export function isEarning(nft: BlnkNft): boolean {
  return nft.status !== "unstaked";
}
