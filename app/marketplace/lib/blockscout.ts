import { BLNK_CONTRACT, EXPLORER_URL } from "../chain/robinhood";

/** Client-side holdings read.
 *
 *  BLNK is not ERC721Enumerable, so a wallet's tokens cannot come from the
 *  contract. Blockscout indexes them and serves `access-control-allow-origin: *`,
 *  so the browser can ask it directly — which means real NFTs render even when
 *  the soft-staking API is unavailable. */

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

export async function fetchHoldings(
  wallet: string,
  maxPages = 12
): Promise<HeldToken[]> {
  const held: HeldToken[] = [];
  let next: PageParams = null;

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({ type: "ERC-721", ...(next ?? {}) });
    const res = await fetch(
      `${EXPLORER_URL}/api/v2/addresses/${wallet}/nft?${params.toString()}`,
      { headers: { accept: "application/json" } }
    );
    if (!res.ok) throw new Error(`Blockscout returned ${res.status}`);

    const data = (await res.json()) as NftPage;
    for (const item of data.items ?? []) {
      const contract = (item.token?.address ?? item.token?.address_hash ?? "").toLowerCase();
      if (contract !== BLNK_CONTRACT.toLowerCase() || !item.id) continue;
      // Prefer the raw ipfs:// URI so the gateway cascade can choose a host;
      // Blockscout's baked-in gateway is frequently unreachable.
      held.push({ tokenId: item.id, image: item.media_url || item.image_url || undefined });
    }

    next = data.next_page_params;
    if (!next) break;
  }

  return held;
}
