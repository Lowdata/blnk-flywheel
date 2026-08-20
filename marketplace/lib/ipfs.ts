/** BLNK's artwork lives at `ipfs://<dir-cid>/<tokenId>`. The directory is
 *  healthy — all 3,444 entries list instantly — but individual files are cold:
 *  the first request for a given token triggers a slow DHT lookup and often
 *  times out, while the same token loads in under a second once the gateway has
 *  cached it. Roughly a third of cold tokens succeed within 10s.
 *
 *  Two consequences for this module:
 *
 *  1. Failures are per FILE, not per gateway. An earlier version blacklisted a
 *     gateway after three errors, which meant three cold tokens could disable a
 *     gateway that was working perfectly well for everything else.
 *  2. Retrying the same gateway is worthwhile, because the failed request is
 *     what warms the cache for the next one.
 *
 *  A CDN URL (OpenSea's, supplied by the API) is passed through untouched and
 *  is always preferred — it has none of these problems.
 */
const GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://w3s.link/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
] as const;

/** Reduce any gateway URL or ipfs:// URI back to its bare `<cid>/<path>`. */
export function toIpfsPath(url: string): string | null {
  if (url.startsWith("ipfs://")) return url.slice("ipfs://".length).replace(/^ipfs\//, "");
  const match = url.match(/\/ipfs\/(.+)$/);
  return match ? match[1] : null;
}

/** Candidate URLs for one image, best-first. Non-IPFS URLs — notably OpenSea's
 *  CDN — are returned as-is, since they need no fallback. The list ends with a
 *  second pass at the first gateway: by then the earlier attempts have usually
 *  warmed its cache. */
export function imageCandidates(url?: string): string[] {
  if (!url) return [];
  const path = toIpfsPath(url);
  if (!path) return [url];
  return [...GATEWAYS.map((gateway) => `${gateway}${path}`), `${GATEWAYS[0]}${path}`];
}
