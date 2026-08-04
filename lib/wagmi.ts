import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  phantomWallet,
  rainbowWallet,
  coinbaseWallet,
  trustWallet,
  injectedWallet,
  safeWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, polygon, base } from 'wagmi/chains';
import { QueryClient } from '@tanstack/react-query';

const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '825bf3f8e5b4cb58cb1bd3e00db75f4d';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular Wallets',
      wallets: [
        metaMaskWallet,
        phantomWallet,
        rainbowWallet,
        coinbaseWallet,
        trustWallet,
        injectedWallet,
        safeWallet,
      ],
    },
  ],
  {
    appName: 'BLNK Claw Machine',
    projectId: WALLETCONNECT_PROJECT_ID,
  }
);

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, polygon, base],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
  },
  ssr: true, // Required for Next.js SSR
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});
