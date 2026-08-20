"use client";
import { PALETTE } from "../theme/palette";
import { Modal } from "./Modal";
import { Pill } from "./Primitives";
import type { MarketItem } from "./MarketCard";

interface Props {
  item: MarketItem | null;
  onClose: () => void;
}

/** The expanded view behind each "Where BLNK travels" card.
 *
 *  Deliberately the same dialog as the Whitelist Marketplace — same panel,
 *  same header shape, same close affordance — so the column has one popup
 *  language rather than two. */
export function MarketDetail({ item, onClose }: Props) {
  if (!item) return null;
  const Icon = item.icon;

  return (
    <Modal
      open
      onClose={onClose}
      label={item.name}
      header={
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${item.accent}1f`, border: `1px solid ${item.accent}3d` }}
          >
            <Icon size={18} color={item.accent} />
          </div>
          <div className="min-w-0">
            <h2 className="blnk-display text-lg font-black" style={{ color: PALETTE.paper }}>
              {item.name}
            </h2>
            <p className="text-[11px] mt-1" style={{ color: PALETTE.grey2 }}>
              {item.tagline}
            </p>
          </div>
        </div>
      }
      headerAside={<Pill color={item.accent}>Soon</Pill>}
    >
      <div className="flex flex-col gap-4">
        {item.detail.map((paragraph) => (
          <p
            key={paragraph}
            className="text-[12px] leading-relaxed"
            style={{ color: PALETTE.grey2 }}
          >
            {paragraph}
          </p>
        ))}

        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: PALETTE.bg, border: `1px solid ${PALETTE.border}` }}
        >
          <p
            className="blnk-pixel text-[9px] uppercase tracking-wider mb-2.5"
            style={{ color: PALETTE.grey1 }}
          >
            What it unlocks
          </p>
          <ul className="flex flex-col gap-2">
            {item.unlocks.map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.accent }}
                />
                <span className="text-[12px] leading-relaxed" style={{ color: PALETTE.grey3 }}>
                  {line}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[10px] leading-relaxed" style={{ color: PALETTE.grey1 }}>
          Not live yet. Filled NFTs and the Colour Balls they earn are what will unlock it.
        </p>
      </div>
    </Modal>
  );
}
