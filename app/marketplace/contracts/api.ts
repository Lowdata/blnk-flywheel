import { colorForToken } from "../theme/palette";
import { fetchHoldings } from "../lib/blockscout";
import type { BlnkAdapter, SignMessage } from "./adapter";
import {
  NotDeployedError,
  type BallBalance,
  type BlnkNft,
  type StakeStatus,
  type WlListing,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/marketplace";

interface HolderResponse {
  nfts: Array<{ tokenId: string; image?: string; status: StakeStatus; since: number }>;
  balls: BallBalance;
}

/** OpenSea's CDN copies, keyed by token id. Artwork resolution is independent
 *  of the ledger — BLNK's IPFS images are ~78% unretrievable, so holders need
 *  these whether or not soft-staking is configured. Never fatal: a failure just
 *  leaves the IPFS URI in place and the card falls back to its colour swatch. */
async function fetchArtwork(owner: string): Promise<Record<string, string>> {
  try {
    const data = await request<{ images: Record<string, string> }>(`/images?wallet=${owner}`);
    return data.images ?? {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

/** Soft-staking is an opt-in we record ourselves, so every write is gated by a
 *  fresh signed nonce: prove the wallet, then act. The tokens go up with the
 *  nonce request because the server names them in the message being signed —
 *  the signature then authorises this exact set and expires with the nonce. */
async function signedPost(
  path: string,
  owner: string,
  tokenIds: string[],
  action: "stake" | "unstake",
  signMessage: SignMessage
): Promise<void> {
  const { nonce, message } = await request<{ nonce: string; message: string }>("/nonce", {
    method: "POST",
    body: JSON.stringify({ wallet: owner, action, tokenIds }),
  });

  const signature = await signMessage(message);

  await request(path, {
    method: "POST",
    body: JSON.stringify({ wallet: owner, tokenIds, nonce, signature }),
  });
}

export function createApiAdapter(signMessage: SignMessage): BlnkAdapter {
  // The holder route answers holdings and balls in one round trip; caching the
  // ball totals avoids a second call from getBallBalance.
  let lastBalls: BallBalance | undefined;

  return {
    kind: "live",

    async getOwnedNfts(owner) {
      try {
        const data = await request<HolderResponse>(`/holder?wallet=${owner}`);
        lastBalls = data.balls;

        return data.nfts.map(
          (n): BlnkNft => ({
            tokenId: n.tokenId,
            name: `BLNK #${n.tokenId}`,
            image: n.image,
            color: colorForToken(n.tokenId),
            status: n.status,
            since: n.since,
          })
        );
      } catch {
        // The API needs a database; Blockscout doesn't. Falling back keeps the
        // wallet's real NFTs on screen instead of an error page over a read
        // path that works. A failed Fill surfaces in the toast, where the user
        // actually took the action.
        lastBalls = { accrued: 0, credited: 0, spent: 0, total: 0 };

        const [held, artwork] = await Promise.all([fetchHoldings(owner), fetchArtwork(owner)]);
        return held.map(
          (t): BlnkNft => ({
            tokenId: t.tokenId,
            name: `BLNK #${t.tokenId}`,
            image: artwork[t.tokenId] ?? t.image,
            color: colorForToken(t.tokenId),
            status: "unstaked",
            since: 0,
          })
        );
      }
    },

    async getBallBalance() {
      return lastBalls ?? { accrued: 0, credited: 0, spent: 0, total: 0 };
    },

    async stake(owner, tokenIds) {
      await signedPost("/stake", owner, tokenIds, "stake", signMessage);
    },

    async unstake(owner, tokenIds) {
      await signedPost("/unstake", owner, tokenIds, "unstake", signMessage);
    },

    async redeem() {
      throw new NotDeployedError("The Colour Machine");
    },

    async getWhitelist(owner) {
      const query = owner ? `?wallet=${owner}` : "";
      const data = await request<{ projects: WlListing[] }>(`/whitelist${query}`);
      return data.projects ?? [];
    },

    async claimWhitelist(owner, projectId) {
      const { nonce, message } = await request<{ nonce: string; message: string }>("/nonce", {
        method: "POST",
        body: JSON.stringify({ wallet: owner, action: "whitelist", projectId }),
      });
      const signature = await signMessage(message);
      await request("/claim-whitelist", {
        method: "POST",
        body: JSON.stringify({ wallet: owner, projectId, nonce, signature }),
      });
    },
  };
}
