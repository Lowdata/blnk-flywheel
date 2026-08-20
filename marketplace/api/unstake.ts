import { consumeSignature } from "./_lib/auth";
import { ballsBetween, db, normalizeTokenIds } from "./_lib/db";
import { route } from "./_lib/http";

/** POST /api/unstake { wallet, tokenIds, nonce, signature }
 *
 *  Closes the stake and banks the balls earned so far. No ownership check —
 *  a holder must always be able to stop their own stake, even if the token has
 *  already moved on.
 *
 *  Balls are computed with ballsBetween() rather than in SQL so the accrual rule
 *  has exactly one definition; a second copy in SQL would be free to drift. */
export default route(["POST"], async (req, res) => {
  const tokenIds = normalizeTokenIds(req.body?.tokenIds);
  const wallet = await consumeSignature({
    wallet: req.body?.wallet,
    nonce: req.body?.nonce,
    signature: req.body?.signature,
    action: "Unstake BLNK",
    tokenIds,
  });

  const client = await db().connect();
  try {
    await client.query("BEGIN");

    // FOR UPDATE so a concurrent reconciliation can't close the same rows and
    // credit the balls twice.
    const { rows } = await client.query<{ id: string; token_id: string; staked_at: Date }>(
      `SELECT id, token_id, staked_at FROM soft_stakes
        WHERE wallet = $1 AND token_id = ANY($2::text[]) AND ended_at IS NULL
        FOR UPDATE`,
      [wallet, tokenIds]
    );

    const endedAt = new Date();
    let ballsBanked = 0;

    for (const row of rows) {
      const balls = ballsBetween(row.staked_at, endedAt);
      ballsBanked += balls;
      await client.query(
        `UPDATE soft_stakes
            SET ended_at = $1, ended_reason = 'unstaked', balls_credited = $2
          WHERE id = $3`,
        [endedAt, balls, row.id]
      );
    }

    await client.query("COMMIT");
    res.status(200).json({ unstaked: rows.map((r) => r.token_id), ballsBanked });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
