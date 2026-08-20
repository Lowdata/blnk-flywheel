"use client";
import { useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { PALETTE } from "../theme/palette";
import { StatusBadge } from "./StatusBadge";
import { GradientButton, GhostButton } from "./Primitives";
import { accruedBalls } from "../lib/balls";
import { imageCandidates } from "../lib/ipfs";
import type { BlnkNft } from "../contracts/types";

interface Props {
  nft: BlnkNft;
  selected: boolean;
  disabled: boolean;
  onToggle: (tokenId: string) => void;
  onAction: (nft: BlnkNft) => void;
  pending: boolean;
}

export function NftCard({ nft, selected, disabled, onToggle, onAction, pending }: Props) {
  // IPFS gateways for this collection are unreliable, so step through them on
  // error instead of dropping straight to the swatch.
  const candidates = useMemo(() => imageCandidates(nft.image), [nft.image]);
  const [attempt, setAttempt] = useState(0);
  const src = candidates[attempt];
  const showImage = Boolean(src);
  const balls = accruedBalls(nft);
  const filling = nft.status === "soft";

  return (
    <div
      className="rounded-2xl p-2 flex flex-col gap-2 h-full min-h-0 transition-all"
      style={{
        background: `linear-gradient(160deg, ${PALETTE.panel} 0%, ${PALETTE.panelHi} 100%)`,
        border: `1px solid ${selected ? PALETTE.lime : PALETTE.border}`,
        boxShadow: selected ? `0 0 0 3px ${PALETTE.lime}22` : "none",
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(nft.tokenId)}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={`Select ${nft.name}`}
        className="w-full flex-1 min-h-0 rounded-xl flex items-center justify-center relative overflow-hidden disabled:cursor-not-allowed"
        style={{ backgroundColor: showImage ? PALETTE.ink : nft.color }}
      >
        {/* Grey until it's filling — the site's own premise, applied to holdings. */}
        <span
          className={`absolute inset-0 flex items-center justify-center ${filling ? "blnk-filled" : "blnk-drained"}`}
          style={{ backgroundColor: showImage ? "transparent" : nft.color }}
        >
          {showImage ? (
            <img
              src={src}
              alt={nft.name}
              loading="lazy"
              onError={() => setAttempt((i) => i + 1)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="blnk-pixel text-[10px] text-black/50">{nft.tokenId}</span>
          )}
        </span>

        {selected && (
          <span
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: PALETTE.lime }}
          >
            <Check size={11} color="#000" strokeWidth={4} />
          </span>
        )}
      </button>

      <div className="flex items-center justify-between gap-1 shrink-0 px-0.5">
        <p className="text-[11px] font-bold truncate" style={{ color: PALETTE.paper }}>
          {nft.name}
        </p>
        {balls > 0 && (
          <span className="blnk-pixel text-[9px] shrink-0" style={{ color: PALETTE.lime }}>
            {balls}
          </span>
        )}
      </div>

      <div className="shrink-0 px-0.5">
        <StatusBadge status={nft.status} />
      </div>

      {filling ? (
        <GhostButton
          onClick={() => onAction(nft)}
          disabled={disabled || pending}
          color={PALETTE.grey2}
          className="w-full !py-1 !text-[9px] shrink-0"
        >
          {pending && <Loader2 size={9} className="blnk-spin" />}
          Stop
        </GhostButton>
      ) : (
        <GradientButton
          onClick={() => onAction(nft)}
          disabled={disabled || pending}
          className="w-full !py-1 !px-2 !text-[9px] shrink-0"
        >
          {pending && <Loader2 size={9} className="blnk-spin" />}
          Fill
        </GradientButton>
      )}
    </div>
  );
}
