"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Wallet, PackageOpen, Network } from "lucide-react";
import { PALETTE } from "../theme/palette";
import { GradientButton } from "./Primitives";

interface Props {
  icon: "wallet" | "empty" | "error" | "network";
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
}

const ICONS = {
  wallet: { Icon: Wallet, color: PALETTE.lime },
  empty: { Icon: PackageOpen, color: PALETTE.grey2 },
  error: { Icon: AlertTriangle, color: PALETTE.red },
  network: { Icon: Network, color: PALETTE.gold },
} as const;

/** Every non-happy path renders through here, so disconnected, empty, and error
 *  all sit in the same shape language as the rest of the page. */
export function StateFrame({ icon, title, body, action, children }: Props) {
  const { Icon, color } = ICONS[icon];

  return (
    <div
      className="h-full min-h-[280px] lg:min-h-0 rounded-2xl flex flex-col items-center justify-center gap-4 p-8 text-center"
      style={{
        background: `linear-gradient(160deg, ${PALETTE.panel} 0%, ${PALETTE.panelHi} 100%)`,
        border: `1px dashed ${PALETTE.borderHi}`,
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: `${color}14`, border: `1px solid ${color}33` }}
      >
        <Icon size={22} color={color} />
      </div>
      <div>
        <p className="blnk-display text-lg font-black" style={{ color: PALETTE.paper }}>
          {title}
        </p>
        <p
          className="text-[12px] mt-2 max-w-xs leading-relaxed mx-auto"
          style={{ color: PALETTE.grey2 }}
        >
          {body}
        </p>
      </div>
      {action && <GradientButton onClick={action.onClick}>{action.label}</GradientButton>}
      {children}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="h-full min-h-[280px] lg:min-h-0 grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="blnk-skeleton rounded-2xl p-2 flex flex-col gap-2 h-full min-h-0"
          style={{
            background: `linear-gradient(160deg, ${PALETTE.panel} 0%, ${PALETTE.panelHi} 100%)`,
            border: `1px solid ${PALETTE.border}`,
          }}
        >
          <div className="w-full flex-1 min-h-0 rounded-xl" style={{ backgroundColor: PALETTE.ink }} />
          <div className="h-3 w-2/3 rounded-full shrink-0" style={{ backgroundColor: PALETTE.ink }} />
          <div className="h-4 w-1/2 rounded-full shrink-0" style={{ backgroundColor: PALETTE.ink }} />
        </div>
      ))}
    </div>
  );
}
