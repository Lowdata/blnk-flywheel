import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, normalizeWallet } from "./_lib/db";
import { closesIn, WL_PROJECTS } from "./_lib/whitelist";
import { route } from "./_lib/http";

/** GET /api/whitelist?wallet=0x…
 *
 *  The catalogue, plus how many spots are gone and which the wallet already
 *  holds. Costs come from here rather than the client so they can't be forged. */
export default route(["GET"], async (req: VercelRequest, res: VercelResponse) => {
  const wallet = req.query.wallet ? normalizeWallet(req.query.wallet) : null;

  const { rows: claims } = await db().query<{ ref: string; wallet: string }>(
    `SELECT ref, wallet FROM ball_spends WHERE reason = 'whitelist' AND ref IS NOT NULL`
  );

  const takenByProject = new Map<string, number>();
  const mine = new Set<string>();
  for (const claim of claims) {
    takenByProject.set(claim.ref, (takenByProject.get(claim.ref) ?? 0) + 1);
    if (wallet && claim.wallet === wallet) mine.add(claim.ref);
  }

  res.status(200).json({
    projects: WL_PROJECTS.map((p) => {
      const taken = p.spotsSeeded + (takenByProject.get(p.id) ?? 0);
      return {
        id: p.id,
        name: p.name,
        blurb: p.blurb,
        cost: p.cost,
        accent: p.accent,
        spotsTotal: p.spotsTotal,
        spotsLeft: Math.max(0, p.spotsTotal - taken),
        closesIn: closesIn(p.closesAt),
        claimed: mine.has(p.id),
      };
    }),
  });
});
