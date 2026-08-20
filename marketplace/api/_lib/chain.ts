import { createPublicClient, http, defineChain } from "viem";

/** Server-side chain access. Kept separate from src/chain so the API has no
 *  dependency on Vite's import.meta.env. */
export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.RPC_URL || "https://rpc.mainnet.chain.robinhood.com"] },
  },
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
});

export const publicClient = createPublicClient({ chain: robinhood, transport: http() });

export const BLNK_CONTRACT = (process.env.NFT_ADDRESS ??
  "0xa4598B513341CBeb37901e5f579cDa39E204077a") as `0x${string}`;

const ownerOfAbi = [
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "address" }],
  },
] as const;

/** Authoritative ownership check. The client claims which tokens it holds; this
 *  is what decides. Anything not owned by `wallet` is returned as rejected. */
export async function verifyOwnership(
  wallet: string,
  tokenIds: string[]
): Promise<{ owned: string[]; notOwned: string[] }> {
  const results = await publicClient.multicall({
    contracts: tokenIds.map((id) => ({
      address: BLNK_CONTRACT,
      abi: ownerOfAbi,
      functionName: "ownerOf" as const,
      args: [BigInt(id)] as const,
    })),
    allowFailure: true,
  });

  const owned: string[] = [];
  const notOwned: string[] = [];

  results.forEach((result, i) => {
    const holder = result.status === "success" ? String(result.result).toLowerCase() : null;
    if (holder && holder === wallet.toLowerCase()) owned.push(tokenIds[i]);
    else notOwned.push(tokenIds[i]);
  });

  return { owned, notOwned };
}
