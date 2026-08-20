import type { VercelRequest, VercelResponse } from "@vercel/node";
import { consumeSignature } from "./_lib/auth";
import { verifyOwnership } from "./_lib/chain";
import { db, HttpError, normalizeTokenIds } from "./_lib/db";
import { route } from "./_lib/http";

/** POST /api/stake { wallet, tokenIds, nonce, signature }
 *
 *  Two gates, both required: the signature proves control of the wallet, and an
 *  on-chain ownerOf check proves the wallet actually holds the tokens. The
 *  client's claim about what it owns is never trusted. */
export default route(["POST"], async (req: VercelRequest, res: VercelResponse) => {
  const tokenIds = normalizeTokenIds(req.body?.tokenIds);
  const wallet = await consumeSignature({
    wallet: req.body?.wallet,
    nonce: req.body?.nonce,
    signature: req.body?.signature,
    action: "Soft-stake BLNK",
    tokenIds,
  });

  const { owned, notOwned } = await verifyOwnership(wallet, tokenIds);
  if (owned.length === 0) {
    throw new HttpError(403, "None of those tokens are held by this wallet");
  }

  // ON CONFLICT covers the unique partial index on active stakes: re-staking a
  // token that is already active is a no-op, not an error or a duplicate row.
  const { rows } = await db().query<{ token_id: string }>(
    `INSERT INTO soft_stakes (wallet, token_id)
     SELECT $1, unnest($2::text[])
     ON CONFLICT (token_id) WHERE ended_at IS NULL DO NOTHING
     RETURNING token_id`,
    [wallet, owned]
  );

  res.status(200).json({
    staked: rows.map((r) => r.token_id),
    alreadyStaked: owned.filter((id) => !rows.some((r) => r.token_id === id)),
    rejected: notOwned,
  });
});
