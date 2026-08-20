import { createContext, useContext, useMemo, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, useSignMessage } from "wagmi";
import { wagmiConfig } from "../chain/wagmi";
import { BLNK_MODE } from "../chain/robinhood";
import { PALETTE } from "../theme/palette";
import { devMockCount, devState } from "../lib/devState";
import type { BlnkAdapter } from "./adapter";
import { createMockAdapter } from "./mock";
import { createApiAdapter } from "./api";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 } },
});

/** RainbowKit's modal, wearing BLNK's palette rather than its own purple. */
const blnkTheme = {
  ...darkTheme({
    accentColor: PALETTE.lime,
    accentColorForeground: "#000000",
    borderRadius: "large",
    overlayBlur: "small",
  }),
};
blnkTheme.colors.modalBackground = PALETTE.panel;
blnkTheme.colors.modalText = PALETTE.paper;
blnkTheme.colors.modalTextSecondary = PALETTE.grey2;
blnkTheme.colors.profileForeground = PALETTE.panelHi;
blnkTheme.colors.connectButtonBackground = PALETTE.panel;
blnkTheme.fonts.body = "Inter, ui-sans-serif, system-ui, sans-serif";

const AdapterContext = createContext<BlnkAdapter | null>(null);

/** Forces the empty / error / loading branches without needing a matching wallet. */
function withDevState(adapter: BlnkAdapter): BlnkAdapter {
  if (devState === "empty") return { ...adapter, getOwnedNfts: async () => [] };
  if (devState === "error") {
    return {
      ...adapter,
      getOwnedNfts: async () => {
        throw new Error("Blockscout request failed: 503 Service Unavailable");
      },
    };
  }
  if (devState === "loading") {
    return { ...adapter, getOwnedNfts: () => new Promise<never>(() => {}) };
  }
  return adapter;
}

function AdapterProvider({ children }: { children: ReactNode }) {
  const { signMessageAsync } = useSignMessage();

  const adapter = useMemo(() => {
    const base =
      BLNK_MODE === "live"
        ? createApiAdapter((message) => signMessageAsync({ message }))
        : createMockAdapter(devMockCount);
    return withDevState(base);
  }, [signMessageAsync]);

  return <AdapterContext.Provider value={adapter}>{children}</AdapterContext.Provider>;
}

export function BlnkProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={blnkTheme} modalSize="compact" appInfo={{ appName: "BLNK Holder Hub" }}>
          <AdapterProvider>{children}</AdapterProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useAdapter(): BlnkAdapter {
  const adapter = useContext(AdapterContext);
  if (!adapter) throw new Error("useAdapter must be used inside <BlnkProvider>");
  return adapter;
}
