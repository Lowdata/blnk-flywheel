import type { VercelRequest, VercelResponse } from "@vercel/node";
import { consumeSignature } from "./_lib/auth";
import { bankedBalls } from "./_lib/balance";
import { db, HttpError } from "./_lib/db";
import { fetchHoldings } from "./_lib/blockscout";
import { loadActiveAccrual } from "./_lib/holder";
import { findProject } from "./_lib/whitelist";
import { route } from "./_lib/http";

/** POST /api/claim-whitelist { wallet, projectId, nonce, signature }
 *
 *  Spends balls on an allowlist spot. Everything that decides the outcome is
 *  computed here — the cost comes from the server catalogue and the balance
 *  from the ledger, so the client can only nominate a project. */
export default route(["POST"], async (req: VercelRequest, res: VercelResponse) => {
  const project = findProject(req.body?.projectId);
  if (!project) throw new HttpError(400, "Unknown project");

  const wallet = await consumeSignature({
    wallet: req.body?.wallet,
    nonce: req.body?.nonce,
    signature: req.body?.signature,
    action: "Claim whitelist spot",
    tokenIds: [project.id],
    subject: "Project",
  });

  const client = await db().connect();
  try {
    await client.query("BEGIN");

    // Serialise this wallet's spends. Two concurrent claims would otherwise
    // both read the same balance and both pass the affordability check.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [wallet]);

    const held = await fetchHoldings(wallet);
    const accrued = await loadActiveAccrual(wallet, held);
    const { credited, spent } = await bankedBalls(wallet);
    const available = accrued + credited - spent;

    if (available < project.cost) {
      throw new HttpError(402, `Not enough balls — need ${project.cost - available} more`);
    }

    try {
      await client.query(
        `INSERT INTO ball_spends (wallet, balls, reason, ref) VALUES ($1, $2, 'whitelist', $3)`,
        [wallet, project.cost, project.id]
      );
    } catch (error) {
      // The unique index is the real guard against double-claiming.
      if ((error as { code?: string }).code === "23505") {
        throw new HttpError(409, "You already hold a spot on this project");
      }
      throw error;
    }

    await client.query("COMMIT");
    res.status(200).json({
      claimed: project.id,
      spent: project.cost,
      remaining: available - project.cost,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
