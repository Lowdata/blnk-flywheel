import type { BallBalance, BlnkNft, WlListing } from "./types";

/** The seam. Every piece of UI reaches data through this and nothing else.
 *
 *  There is no staking contract: soft-staking is an opt-in recorded in our own
 *  database, so `stake`/`unstake` are signed API calls, not transactions. They
 *  return nothing — there is no hash to show. */
export interface BlnkAdapter {
  readonly kind: "mock" | "live";

  /** Every BLNK the wallet holds, with its soft-stake state. */
  getOwnedNfts(owner: `0x${string}`): Promise<BlnkNft[]>;

  /** Live accrual plus balls banked from ended stakes. */
  getBallBalance(owner: `0x${string}`, nfts: BlnkNft[]): Promise<BallBalance>;

  /** Opt these tokens into soft-staking. Prompts a wallet signature. */
  stake(owner: `0x${string}`, tokenIds: string[]): Promise<void>;

  /** Stop soft-staking. Balls earned so far are banked, not lost. */
  unstake(owner: `0x${string}`, tokenIds: string[]): Promise<void>;

  /** Burn balls in the Colour Machine. Throws NotDeployedError until it exists. */
  redeem(owner: `0x${string}`, ballCount: number): Promise<void>;

  /** The allowlist catalogue, with spots left and what this wallet already holds.
   *  Costs come from the server so they can't be forged. */
  getWhitelist(owner?: `0x${string}`): Promise<WlListing[]>;

  /** Spend balls on an allowlist spot. Prompts a wallet signature; the server
   *  re-derives the balance and the cost before writing to the spend ledger. */
  claimWhitelist(owner: `0x${string}`, projectId: string, cost: number): Promise<void>;
}

export type SignMessage = (message: string) => Promise<string>;
