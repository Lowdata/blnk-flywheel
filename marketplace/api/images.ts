import { normalizeWallet } from "./_lib/db";
import { fetchImagesForOwner, HAS_OPENSEA } from "./_lib/opensea";
import { cachedImages, cacheImages } from "./_lib/images";
import { route } from "./_lib/http";

/** GET /api/images?wallet=0x…  ->  { images: { [tokenId]: url } }
 *
 *  Artwork resolution is deliberately independent of the ledger: BLNK's IPFS
 *  images are ~78% unretrievable, so holders need OpenSea's CDN copies whether
 *  or not soft-staking is configured. This route works with no database. */
export default route(["GET"], async (req, res) => {
  const wallet = normalizeWallet(req.query.wallet);

  if (!HAS_OPENSEA) {
    return res.status(200).json({ images: {}, source: "none" });
  }

  const cached = await cachedImages();
  if (Object.keys(cached).length > 0) {
    // Cache is keyed by token, not wallet, so a warm cache still needs the
    // wallet's tokens — but any it already knows cost nothing.
    const fresh = await fetchImagesForOwner(wallet);
    const merged = { ...cached, ...Object.fromEntries(fresh) };
    await cacheImages(fresh);
    return res.status(200).json({ images: merged, source: "opensea" });
  }

  const fresh = await fetchImagesForOwner(wallet);
  await cacheImages(fresh);
  res.status(200).json({ images: Object.fromEntries(fresh), source: "opensea" });
});
