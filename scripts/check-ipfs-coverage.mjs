#!/usr/bin/env node
/** Measure how much of the BLNK artwork is actually retrievable over IPFS.
 *
 *  Findings as of 2026-08-20: the image directory is healthy — all 3,444
 *  entries list in under a second — but only about 22% of the files themselves
 *  can be fetched. The rest time out.
 *
 *  This was originally written as a cache warmer, on the theory that the misses
 *  were cold-start DHT lookups. They are not: running it twice over the same
 *  range returns the identical 10 hits and 21 misses, so the missing blocks are
 *  simply not being served by the network. Warming cannot fix it.
 *
 *  Keep this as a diagnostic — re-run it to check whether re-pinning worked.
 *  For artwork that actually renders, use OpenSea's CDN (OPENSEA_API_KEY).
 *
 *    node scripts/check-ipfs-coverage.mjs           # all 3444
 *    node scripts/check-ipfs-coverage.mjs 1 200     # a sample
 */
const CID = "QmRM4suZ4qb8aUvnQi9wrmAbvEqcmHZpBCDdkTx7eo8a7E";
const GATEWAY = process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs/";
const CONCURRENCY = Number(process.env.WARM_CONCURRENCY || 12);
const TIMEOUT_MS = Number(process.env.WARM_TIMEOUT_MS || 30_000);

const from = Number(process.argv[2] || 1);
const to = Number(process.argv[3] || 3444);

const ids = Array.from({ length: to - from + 1 }, (_, i) => from + i);
let done = 0;
let warmed = 0;
let missed = 0;

async function warm(tokenId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // HEAD is enough to make the gateway retrieve and cache the blocks.
    const res = await fetch(`${GATEWAY}${CID}/${tokenId}`, {
      method: "HEAD",
      signal: controller.signal,
    });
    if (res.ok) warmed++;
    else missed++;
  } catch {
    missed++;
  } finally {
    clearTimeout(timer);
    done++;
    if (done % 25 === 0 || done === ids.length) {
      const pct = ((done / ids.length) * 100).toFixed(1);
      process.stdout.write(`\r  ${done}/${ids.length} (${pct}%)  warm=${warmed} cold=${missed}   `);
    }
  }
}

async function run() {
  console.log(`Checking ${ids.length} BLNK images via ${GATEWAY} (${CONCURRENCY} at a time)`);
  const queue = [...ids];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const id = queue.shift();
      if (id !== undefined) await warm(id);
    }
  });
  await Promise.all(workers);
  const pct = ((warmed / ids.length) * 100).toFixed(1);
  console.log(`\nDone. ${warmed}/${ids.length} retrievable (${pct}%), ${missed} unavailable.`);
  if (missed > 0) {
    console.log("Unavailable files are not a cold cache — repeat runs return the same misses.");
    console.log("Fix by re-pinning the CID, or serve artwork from OpenSea's CDN instead.");
  }
}

run();
