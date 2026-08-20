import { buildMessage, issueNonce } from "./_lib/auth";
import { HttpError, normalizeTokenIds, normalizeWallet } from "./_lib/db";
import { findProject } from "./_lib/whitelist";
import { route } from "./_lib/http";

/** POST /api/nonce { wallet, action, tokenIds | projectId } -> { nonce, message }
 *
 *  Whatever the action operates on is quoted in the message the holder signs,
 *  so the nonce is bound to that exact subject and cannot be re-aimed. */
export default route(["POST"], async (req, res) => {
  const wallet = normalizeWallet(req.body?.wallet);
  const nonce = await issueNonce(wallet);

  if (req.body?.action === "whitelist") {
    const project = findProject(req.body?.projectId);
    if (!project) throw new HttpError(400, "Unknown project");
    const action = "Claim whitelist spot";
    return res.status(200).json({
      nonce,
      message: buildMessage(wallet, nonce, action, [project.id], "Project"),
      action,
    });
  }

  const tokenIds = normalizeTokenIds(req.body?.tokenIds);
  const action = req.body?.action === "unstake" ? "Unstake BLNK" : "Soft-stake BLNK";
  res.status(200).json({ nonce, message: buildMessage(wallet, nonce, action, tokenIds), action });
});
