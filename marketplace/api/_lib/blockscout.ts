import { BLNK_CONTRACT } from "./chain";

/** The BLNK contract is not ERC721Enumerable — tokenOfOwnerByIndex reverts — so
 *  a wallet's holdings can't be read from the contract directly. Blockscout
 *  indexes them.
 *
 *  A Pro key (api.blockscout.com/<chainId>/...) lifts the rate limits. It is
 *  read ONLY here, server-side: a key shipped in the browser bundle is a public
 *  key, and anyone could spend the quota. The frontend uses the keyless public
 *  instance and never sees this value. */
const CHAIN_ID = 4663;
const PUBLIC_BASE = process.env.BLOCKSCOUT_URL || "https://robinhoodchain.blockscout.com";
const API_KEY = process.env.BLOCKSCOUT_API_KEY || "";
const PRO_BASE = `https://api.blockscout.com/${CHAIN_ID}`;

const BASE = API_KEY ? PRO_BASE : PUBLIC_BASE;

function withKey(url: string): string {
  if (!API_KEY) return url;
  return `${url}${url.includes("?") ? "&" : "?"}apikey=${API_KEY}`;
}

export interface HeldToken {
  tokenId: string;
  image?: string;
}

interface NftItem {
  id?: string;
  image_url?: string;
  media_url?: string;
  token?: { address?: string; address_hash?: string };
}

type PageParams = Record<string, string> | null;

interface NftPage {
  items: NftItem[];
  next_page_params: PageParams;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(withKey(url), { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Blockscout ${res.status} for ${url}`);
  return (await res.json()) as T;
}

/** Every BLNK the wallet currently holds. Paginated at 50/page; capped so one
 *  enormous wallet can't hang the request. */
export async function fetchHoldings(wallet: string, maxPages = 12): Promise<HeldToken[]> {
  const held: HeldToken[] = [];
  let next: PageParams = null;

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({ type: "ERC-721", ...(next ?? {}) });
    const data: NftPage = await getJson<NftPage>(
      `${BASE}/api/v2/addresses/${wallet}/nft?${params.toString()}`
    );

    for (const item of data.items ?? []) {
      const contract = (item.token?.address ?? item.token?.address_hash ?? "").toLowerCase();
      if (contract !== BLNK_CONTRACT.toLowerCase() || !item.id) continue;
      // Prefer the raw ipfs:// URI — the client picks its own gateway, since
      // the one Blockscout bakes in is frequently unreachable.
      held.push({ tokenId: item.id, image: item.media_url || item.image_url || undefined });
    }

    next = data.next_page_params;
    if (!next) break;
  }

  return held;
}

/** When a soft-staked token is gone, we credit balls up to the moment it left —
 *  not the moment we noticed. Returns the outbound transfer time, if findable. */
export async function findTransferOutTime(wallet: string, tokenId: string): Promise<Date | null> {
  try {
    const data = await getJson<{
      items: Array<{ timestamp?: string; from?: { hash?: string } }>;
    }>(`${BASE}/api/v2/tokens/${BLNK_CONTRACT}/instances/${tokenId}/transfers`);

    const outbound = (data.items ?? []).find(
      (t) => (t.from?.hash ?? "").toLowerCase() === wallet.toLowerCase()
    );
    return outbound?.timestamp ? new Date(outbound.timestamp) : null;
  } catch {
    return null;
  }
}
