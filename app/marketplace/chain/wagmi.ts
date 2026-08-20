import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { robinhood, RPC_URL } from "./robinhood";

/** RainbowKit throws at startup without a WalletConnect projectId, and several
 *  of its wallets (MetaMask, Rainbow) use WalletConnect for mobile deep-links
 *  even on desktop. So the wallet list depends on whether a project id exists:
 *
 *  - with one  → the full set, including mobile QR pairing
 *  - without   → injected + Coinbase only, which need no relay
 *
 *  Get a free id at https://cloud.reown.com and set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.
 */
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export const HAS_WALLETCONNECT = Boolean(projectId);

const wallets = projectId
  ? [
      { groupName: "Recommended", wallets: [injectedWallet, metaMaskWallet, rainbowWallet] },
      { groupName: "More", wallets: [coinbaseWallet, walletConnectWallet] },
    ]
  : [{ groupName: "Installed", wallets: [injectedWallet, coinbaseWallet] }];

const connectors = connectorsForWallets(wallets, {
  appName: "BLNK Holder Hub",
  // Unused when no WalletConnect wallet is in the list, but the argument is
  // required and validated eagerly.
  projectId: projectId || "blnk-local-dev",
});

export const wagmiConfig = createConfig({
  chains: [robinhood],
  connectors,
  transports: { [robinhood.id]: http(RPC_URL) },
  ssr: false,
});
