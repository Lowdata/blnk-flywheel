"use client";

import type { LucideIcon } from "lucide-react";
import { PALETTE } from "../theme/palette";
import { Pill } from "./Primitives";

export interface MarketItem {
  name: string;
  icon: LucideIcon;
  /** One line on where the colour actually goes. */
  blurb: string;
  /** The line the site uses to sell it. */
  tagline: string;
  accent: string;
  /** Paragraphs shown in the expanded view. */
  detail: string[];
  /** What holding and filling actually gets you. */
  unlocks: string[];
}

/** Each destination gets its own accent, so the column reads as a set of places
 *  BLNK travels to rather than three identical "coming soon" rows. */
export function MarketCard({ item, onOpen }: { item: MarketItem; onOpen: (item: MarketItem) => void }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={`Read more about ${item.name}`}
      className="group relative rounded-2xl p-4 flex flex-col h-full min-h-0 overflow-hidden text-left transition-colors hover:border-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
      style={{
        background: `linear-gradient(160deg, ${PALETTE.panel} 0%, ${PALETTE.panelHi} 100%)`,
        border: `1px solid ${PALETTE.border}`,
      }}
    >
      {/* Accent wash — the only colour in an otherwise grey card. */}
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-[0.13] blur-2xl transition-opacity group-hover:opacity-25"
        style={{ backgroundColor: item.accent }}
      />

      <div className="relative flex items-start gap-3 shrink-0">
        <div
          className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${item.accent}1f`, border: `1px solid ${item.accent}3d` }}
        >
          <Icon size={19} color={item.accent} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold truncate" style={{ color: PALETTE.paper }}>
              {item.name}
            </p>
            <Pill color={PALETTE.grey2}>Soon</Pill>
          </div>
          <p
            className="text-[10px] uppercase tracking-wide mt-1 truncate"
            style={{ color: item.accent }}
          >
            {item.tagline}
          </p>
        </div>
      </div>

      <p
        className="relative text-[11px] leading-relaxed mt-3 flex-1 line-clamp-3"
        style={{ color: PALETTE.grey2 }}
      >
        {item.blurb}
      </p>
    </button>
  );
}
