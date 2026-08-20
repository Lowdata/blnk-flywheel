import { normalizeWallet } from "./_lib/db";
import { loadHolder } from "./_lib/holder";
import { route } from "./_lib/http";

/** GET /api/holder?wallet=0x...
 *  Returns holdings joined with soft-stake state, and the ball totals.
 *  Also runs reconciliation, so this is the endpoint that closes out stakes on
 *  tokens that have been sold or transferred away. */
export default route(["GET"], async (req, res) => {
  const wallet = normalizeWallet(req.query.wallet);
  const snapshot = await loadHolder(wallet);

  const stakedAtByToken = new Map(snapshot.active.map((s) => [s.tokenId, s.stakedAt]));

  const nfts = snapshot.held.map((token) => {
    const stakedAt = stakedAtByToken.get(token.tokenId);
    return {
      tokenId: token.tokenId,
      image: token.image,
      status: stakedAt ? "soft" : "unstaked",
      since: stakedAt ? Math.floor(stakedAt.getTime() / 1000) : 0,
    };
  });

  res.status(200).json({
    wallet,
    nfts,
    balls: {
      accrued: snapshot.accrued,
      credited: snapshot.credited,
      spent: snapshot.spent,
      total: snapshot.accrued + snapshot.credited - snapshot.spent,
    },
  });
});
