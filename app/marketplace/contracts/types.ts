/** Domain types. Deliberately chain-free — nothing here imports viem or wagmi,
 *  so the UI can be built and tested without a node or a database. */

/** With no staking contract, a token is either opted into soft-staking (earning
 *  while the wallet still holds it) or it isn't. */
export type StakeStatus = "soft" | "unstaked";

export interface BlnkNft {
  /** Decimal token id as a string — token ids are uint256 and overflow `number`. */
  tokenId: string;
  name: string;
  /** Artwork resolved by the indexer. Undefined falls back to the swatch. */
  image?: string;
  /** Deterministic fallback swatch color. */
  color: string;
  status: StakeStatus;
  /** Unix seconds this token started earning. 0 when not soft-staked. */
  since: number;
}

export interface BallBalance {
  /** Earning right now, derived from `since` on active stakes. */
  accrued: number;
  /** Banked from ended stakes, plus manual grants. */
  credited: number;
  /** Already spent on allowlist spots. */
  spent: number;
  /** accrued + credited − spent. What's actually available to spend. */
  total: number;
}

export type TxStatus = "idle" | "signing" | "pending" | "success" | "error";

export interface TxState {
  status: TxStatus;
  label?: string;
  error?: string;
}

/** Thrown by adapter methods whose backing feature doesn't exist yet. The UI
 *  catches this specifically to render "Soon" rather than a failure. */
export class NotDeployedError extends Error {
  constructor(what: string) {
    super(`${what} is not available yet`);
    this.name = "NotDeployedError";
  }
}

/** One allowlist project as the server describes it. */
export interface WlListing {
  id: string;
  name: string;
  blurb: string;
  cost: number;
  accent: string;
  spotsTotal: number;
  spotsLeft: number;
  closesIn: string;
  /** True when this wallet already holds a spot. */
  claimed: boolean;
}
