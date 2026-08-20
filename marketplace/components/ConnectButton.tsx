"use client";
import { Wallet } from "lucide-react";
import { PALETTE } from "../theme/palette";
import { GradientButton } from "./Primitives";
import { shortAddress, type WalletState } from "../hooks/useWallet";

/** Trigger is ours so it matches the site's pill language; the modal behind it
 *  is RainbowKit's — wallet discovery, deep links, and the account sheet. */
export function ConnectButton({ wallet }: { wallet: WalletState }) {
  if (!wallet.isConnected) {
    return (
      <GradientButton onClick={wallet.connect} disabled={wallet.isConnecting}>
        <Wallet size={12} />
        {wallet.isConnecting ? "Connecting" : "Connect Wallet"}
      </GradientButton>
    );
  }

  return (
    <button
      type="button"
      onClick={wallet.openAccount}
      className="flex items-center gap-2 rounded-full pl-3 pr-3.5 py-1.5 transition-colors hover:bg-white/5"
      style={{ backgroundColor: PALETTE.panel, border: `1px solid ${PALETTE.borderHi}` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: wallet.wrongNetwork ? PALETTE.gold : PALETTE.green }}
      />
      <span className="text-[11px] font-semibold" style={{ color: PALETTE.grey3 }}>
        {shortAddress(wallet.address)}
      </span>
    </button>
  );
}
