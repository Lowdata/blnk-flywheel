import { BLNK_CONTRACT } from "./chain";

/** BLNK's artwork is unreachable over IPFS — the image directory is pinned but
 *  its content blocks aren't served, so every public gateway 504s. OpenSea
 *  indexed the collection while the art was still available and now serves it
 *  from its own CDN, so that cache is the only working source.
 *
 *  Two things make this usable:
 *   - i2c.seadn.io is public, CORS-open, and cached for a year, so the browser
 *     loads those URLs directly once it has them.
 *   - the URLs are content-hashed, so they can't be derived — only the API
 *     hands them out, and that needs a key.
 *
 *  The key is server-side only. Results are cached in Postgres so a page load
 *  never depends on OpenSea being up or on its rate limit.
 */
const API_KEY = process.env.OPENSEA_API_KEY || "";
const CHAIN = "robinhood";
const BASE = "https://api.opensea.io/api/v2";

export const HAS_OPENSEA = Boolean(API_KEY);

interface OpenSeaNft {
  identifier?: string;
  image_url?: string;
  display_image_url?: string;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { accept: "application/json", "x-api-key": API_KEY },
  });
  if (!res.ok) throw new Error(`OpenSea ${res.status} for ${url}`);
  return (await res.json()) as T;
}

/** Every BLNK the wallet holds, as OpenSea sees it: tokenId -> CDN image URL.
 *  Paginated at 50; capped so one huge wallet can't hang the request. */
export async function fetchImagesForOwner(
  wallet: string,
  maxPages = 12
): Promise<Map<string, string>> {
  const images = new Map<string, string>();
  if (!API_KEY) return images;

  let next: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({ limit: "50" });
    if (next) params.set("next", next);

    const data = await getJson<{ nfts: OpenSeaNft[]; next?: string }>(
      `${BASE}/chain/${CHAIN}/account/${wallet}/nfts?${params.toString()}`
    );

    for (const nft of data.nfts ?? []) {
      const url = nft.display_image_url || nft.image_url;
      if (nft.identifier && url) images.set(nft.identifier, url);
    }

    next = data.next;
    if (!next) break;
  }

  return images;
}

/** Single-token lookup, for backfilling anything the owner sweep missed. */
export async function fetchImageForToken(tokenId: string): Promise<string | undefined> {
  if (!API_KEY) return undefined;
  try {
    const data = await getJson<{ nft?: OpenSeaNft }>(
      `${BASE}/chain/${CHAIN}/contract/${BLNK_CONTRACT}/nfts/${tokenId}`
    );
    return data.nft?.display_image_url || data.nft?.image_url;
  } catch {
    return undefined;
  }
}
