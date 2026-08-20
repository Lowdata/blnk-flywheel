import { colorForToken } from "../theme/palette";
import { DAY_SECONDS, nowSeconds, totalAccrued } from "../lib/balls";
import type { BlnkAdapter } from "./adapter";
import {
  NotDeployedError,
  type BallBalance,
  type BlnkNft,
  type StakeStatus,
  type WlListing,
} from "./types";

/** Fixtures carried over from the original mock so the dashboard still reads
 *  5 earning / 42 balls with no database and no wallet. */
const FIXTURES: Array<{ id: string; status: StakeStatus; days: number }> = [
  { id: "42", status: "soft", days: 12 },
  { id: "187", status: "soft", days: 4 },
  { id: "311", status: "soft", days: 12 },
  { id: "456", status: "unstaked", days: 0 },
  { id: "902", status: "soft", days: 2 },
  { id: "1120", status: "soft", days: 12 },
];

function build(): BlnkNft[] {
  const now = nowSeconds();
  return FIXTURES.map((f) => ({
    tokenId: f.id,
    name: `BLNK #${f.id}`,
    color: colorForToken(f.id),
    status: f.status,
    // Offset by a minute so floor() can't land a day short on a slow render.
    since: f.status === "unstaked" ? 0 : now - f.days * DAY_SECONDS - 60,
  }));
}

/** Stress fixture: ?mock=200 renders a whale wallet to prove the layout holds. */
function buildMany(count: number): BlnkNft[] {
  const now = nowSeconds();
  return Array.from({ length: count }, (_, i) => {
    const id = String(1000 + i * 7);
    const status: StakeStatus = i % 3 === 2 ? "unstaked" : "soft";
    return {
      tokenId: id,
      name: `BLNK #${id}`,
      color: colorForToken(id),
      status,
      since: status === "unstaked" ? 0 : now - ((i % 30) + 1) * DAY_SECONDS - 60,
    };
  });
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Mirrors the server catalogue in api/_lib/whitelist.ts. */
const MOCK_WHITELIST: Omit<WlListing, "claimed">[] = [
  {
    id: "colour-machine-s1",
    name: "Colour Machine: Season 1",
    blurb: "First capsule drop from the machine itself. Holders only.",
    cost: 90,
    accent: "#d4ff00",
    spotsTotal: 500,
    spotsLeft: 140,
    closesIn: "6d",
  },
  {
    id: "inkfields",
    name: "Inkfields",
    blurb: "Companion collection from the studio behind the BLNK animation.",
    cost: 45,
    accent: "#ff2e93",
    spotsTotal: 1000,
    spotsLeft: 320,
    closesIn: "12d",
  },
  {
    id: "greyscale-genesis",
    name: "Greyscale Genesis",
    blurb: "Pre-colour artefacts from before the boy found the machine.",
    cost: 150,
    accent: "#7b2ff7",
    spotsTotal: 200,
    spotsLeft: 18,
    closesIn: "3d",
  },
];

export function createMockAdapter(count?: number): BlnkAdapter {
  let nfts = count && count > 0 ? buildMany(count) : build();
  let banked = 0;
  let spent = 0;
  const claimed = new Set<string>();

  return {
    kind: "mock",

    async getOwnedNfts() {
      await delay(400);
      return nfts.map((n) => ({ ...n }));
    },

    async getBallBalance(_owner, list): Promise<BallBalance> {
      const accrued = totalAccrued(list);
      return { accrued, credited: banked, spent, total: accrued + banked - spent };
    },

    async stake(_owner, tokenIds) {
      await delay(700);
      const now = nowSeconds();
      nfts = nfts.map((n) =>
        tokenIds.includes(n.tokenId) ? { ...n, status: "soft", since: now } : n
      );
    },

    async unstake(_owner, tokenIds) {
      await delay(700);
      const now = nowSeconds();
      // Mirrors the real rule: ending a stake banks what it earned.
      for (const nft of nfts) {
        if (tokenIds.includes(nft.tokenId) && nft.status === "soft") {
          banked += Math.max(0, Math.floor((now - nft.since) / DAY_SECONDS));
        }
      }
      nfts = nfts.map((n) =>
        tokenIds.includes(n.tokenId) ? { ...n, status: "unstaked", since: 0 } : n
      );
    },

    async redeem() {
      throw new NotDeployedError("The Colour Machine");
    },

    async getWhitelist(): Promise<WlListing[]> {
      await delay(200);
      return MOCK_WHITELIST.map((p) => ({ ...p, claimed: claimed.has(p.id) }));
    },

    async claimWhitelist(_owner, projectId, cost) {
      await delay(600);
      spent += cost;
      claimed.add(projectId);
    },
  };
}
