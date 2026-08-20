import { defineChain } from "viem";

/** Robinhood Chain — an Arbitrum L2 on Ethereum, ETH as native gas token.
 *  https://docs.robinhood.com/chain/connecting/
 *
 *  The chain is only used for wallet connection and the network check. All
 *  reads go through our API (which uses Blockscout, because the BLNK contract
 *  is not ERC721Enumerable), and soft-staking is a signature, never a tx. */

const env = import.meta.env;

/** Live by default: real wallet, real holdings. Set VITE_BLNK_MODE=mock for
 *  the offline fixture mode used during design work. */
export const BLNK_MODE = (env.VITE_BLNK_MODE ?? "live") as "mock" | "live";

export const CHAIN_NAME = "Robinhood Chain";
export const EXPLORER_URL = "https://robinhoodchain.blockscout.com";
export const PUBLIC_RPC_URL = "https://rpc.mainnet.chain.robinhood.com";

/** The verified BLNK collection: name "BLNK", symbol "$BLNK", supply 3,444. */
export const BLNK_CONTRACT = "0xa4598B513341CBeb37901e5f579cDa39E204077a" as const;

export const RPC_URL: string = env.VITE_RPC_URL || PUBLIC_RPC_URL;
export const USING_PUBLIC_RPC = RPC_URL === PUBLIC_RPC_URL;

export const robinhood = defineChain({
  id: 4663,
  name: CHAIN_NAME,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: "Blockscout", url: EXPLORER_URL } },
  contracts: {
    multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" },
  },
});

export function collectionUrl(): string {
  return `${EXPLORER_URL}/token/${BLNK_CONTRACT}`;
}

/** The collection's public market page. OpenSea indexes Robinhood Chain, so
 *  this is where a holder goes to buy, sell, or browse the full 3,444. */
export const OPENSEA_URL = "https://opensea.io/collection/blnkonrobinhood";
