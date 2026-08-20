import { db } from "./db";

/** Artwork cache helpers that degrade to no-ops without a database.
 *
 *  The cache is an optimisation, not a dependency: images must still resolve
 *  before Postgres is provisioned, so every failure here is swallowed and the
 *  caller falls back to querying OpenSea directly. */
const HAS_DB = Boolean(process.env.DATABASE_URL);

export async function cachedImages(): Promise<Record<string, string>> {
  if (!HAS_DB) return {};
  try {
    const { rows } = await db().query<{ token_id: string; image_url: string }>(
      `SELECT token_id, image_url FROM nft_images`
    );
    return Object.fromEntries(rows.map((r) => [r.token_id, r.image_url]));
  } catch {
    return {};
  }
}

export async function cacheImages(images: Map<string, string>): Promise<void> {
  if (!HAS_DB || images.size === 0) return;
  try {
    const ids = [...images.keys()];
    const urls = ids.map((id) => images.get(id)!);
    await db().query(
      `INSERT INTO nft_images (token_id, image_url)
       SELECT * FROM unnest($1::text[], $2::text[])
       ON CONFLICT (token_id) DO UPDATE
         SET image_url = EXCLUDED.image_url, fetched_at = now()`,
      [ids, urls]
    );
  } catch (error) {
    console.error("Artwork cache write failed (non-fatal):", error);
  }
}
