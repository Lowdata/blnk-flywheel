import { randomBytes } from "node:crypto";
import { verifyMessage } from "viem";
import { db, HttpError, normalizeWallet } from "./db";

const NONCE_TTL_MINUTES = 10;

/** The exact text a holder signs. Every token is named in it, so the signature
 *  authorises *these* tokens and nothing else: a tampered tokenIds list on the
 *  way to /stake rebuilds a different message and fails verification. */
export function buildMessage(
  wallet: string,
  nonce: string,
  action: string,
  items: string[],
  /** Noun for what `items` are. A whitelist claim names a project, not tokens,
   *  and the holder should see that in the wallet prompt. */
  subject: string = "Tokens"
): string {
  return [
    "BLNK Holder Hub",
    "",
    `Action: ${action}`,
    `Wallet: ${wallet}`,
    `${subject} (${items.length}): ${items.map((id) => `#${id}`).join(", ")}`,
    `Nonce: ${nonce}`,
    "",
    "Signing this proves you control this wallet. It costs no gas and moves no funds.",
  ].join("\n");
}

export async function issueNonce(wallet: string): Promise<string> {
  const nonce = randomBytes(16).toString("hex");
  await db().query(
    `INSERT INTO auth_nonces (nonce, wallet) VALUES ($1, $2)`,
    [nonce, wallet]
  );
  return nonce;
}

/** Verifies the signature, then burns the nonce so the same signature can't be
 *  replayed. Both halves matter — a valid signature reused forever is not auth. */
export async function consumeSignature(params: {
  wallet: unknown;
  nonce: unknown;
  signature: unknown;
  action: string;
  tokenIds: string[];
  subject?: string;
}): Promise<string> {
  const wallet = normalizeWallet(params.wallet);

  if (typeof params.nonce !== "string" || typeof params.signature !== "string") {
    throw new HttpError(400, "Missing nonce or signature");
  }

  const { rows } = await db().query<{ wallet: string; used_at: Date | null; issued_at: Date }>(
    `SELECT wallet, used_at, issued_at FROM auth_nonces WHERE nonce = $1`,
    [params.nonce]
  );

  const record = rows[0];
  if (!record) throw new HttpError(401, "Unknown nonce");
  if (record.used_at) throw new HttpError(401, "Nonce already used");
  if (record.wallet !== wallet) throw new HttpError(401, "Nonce was issued to a different wallet");

  const ageMinutes = (Date.now() - record.issued_at.getTime()) / 60_000;
  if (ageMinutes > NONCE_TTL_MINUTES) throw new HttpError(401, "Nonce expired");

  const valid = await verifyMessage({
    address: wallet as `0x${string}`,
    message: buildMessage(wallet, params.nonce, params.action, params.tokenIds, params.subject),
    signature: params.signature as `0x${string}`,
  });

  if (!valid) throw new HttpError(401, "Signature does not match wallet");

  const burned = await db().query(
    `UPDATE auth_nonces SET used_at = now() WHERE nonce = $1 AND used_at IS NULL`,
    [params.nonce]
  );
  if (burned.rowCount === 0) throw new HttpError(401, "Nonce already used");

  return wallet;
}
