import type { ReactNode } from "react";
import { BlnkProvider } from "./contracts/provider";
import "@rainbow-me/rainbowkit/styles.css";
import "./index.css";

export const metadata = {
  title: "BLNK Holder Hub",
  description: "NFT staking + Colour Machine dashboard on Robinhood Chain",
};

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return (
    <BlnkProvider>
      {children}
    </BlnkProvider>
  );
}
