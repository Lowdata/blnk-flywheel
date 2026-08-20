"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSignMessage } from "wagmi";
import { BLNK_MODE } from "../chain/robinhood";
import { devMockCount, devState } from "../lib/devState";
import type { BlnkAdapter } from "./adapter";
import { createMockAdapter } from "./mock";
import { createApiAdapter } from "./api";

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

/** Wagmi, React Query and RainbowKit are mounted once in the root layout
 *  (`app/providers.tsx`), so here we only add the adapter on top of them. */
export function BlnkProvider({ children }: { children: ReactNode }) {
  return <AdapterProvider>{children}</AdapterProvider>;
}

export function useAdapter(): BlnkAdapter {
  const adapter = useContext(AdapterContext);
  if (!adapter) throw new Error("useAdapter must be used inside <BlnkProvider>");
  return adapter;
}
