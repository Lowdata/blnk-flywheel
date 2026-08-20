/** Dev-only overrides. Real wallets are a poor way to reach the empty, error,
 *  and loading branches on demand, so query params force them:
 *
 *    ?state=disconnected|loading|empty|error|wrongnet
 *    ?mock=200          whale wallet, to prove the layout holds
 *    ?wallet=0x…        read-only: load any address's real holdings without
 *                       connecting. Writes stay disabled — you can't sign for
 *                       someone else's wallet.
 *
 *  All stripped from production builds.
 */

export type DevState = "disconnected" | "loading" | "empty" | "error" | "wrongnet" | null;

const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;

export const devState: DevState = process.env.NODE_ENV === 'development'
  ? ((params?.get("state") as DevState) ?? null)
  : null;

export const devMockCount: number | undefined = process.env.NODE_ENV === 'development'
  ? Number(params?.get("mock")) || undefined
  : undefined;

const rawWallet = process.env.NODE_ENV === 'development' ? (params?.get("wallet") ?? "") : "";

export const devViewWallet: `0x${string}` | undefined = /^0x[a-fA-F0-9]{40}$/.test(rawWallet)
  ? (rawWallet as `0x${string}`)
  : undefined;
