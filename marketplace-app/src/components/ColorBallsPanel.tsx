import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { PALETTE, SWATCH_COLORS } from "../theme/palette";
import { BALLS_PER_DAY } from "../lib/balls";
import { GradientButton } from "./Primitives";
import type { BallBalance } from "../contracts/types";

interface Props {
  balance?: BallBalance;
  nftsEarning: number;
  onRedeem: () => void;
  redeemDisabled: boolean;
  redeeming: boolean;
  loading: boolean;
}

const MAX_SHOWN = 36;

export function ColorBallsPanel({
  balance,
  nftsEarning,
  onRedeem,
  redeemDisabled,
  redeeming,
  loading,
}: Props) {
  const total = balance?.total ?? 0;

  const balls = useMemo(
    () =>
      Array.from(
        { length: Math.min(total, MAX_SHOWN) },
        (_, i) => SWATCH_COLORS[i % SWATCH_COLORS.length]
      ),
    [total]
  );
  const overflow = Math.max(total - MAX_SHOWN, 0);

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 h-full min-h-[420px] lg:min-h-0"
      style={{
        background: `linear-gradient(160deg, ${PALETTE.panel} 0%, ${PALETTE.panelHi} 100%)`,
        border: `1px solid ${PALETTE.border}`,
      }}
    >
      <div className="shrink-0">
        <p
          className="blnk-pixel text-[9px] uppercase tracking-wider"
          style={{ color: PALETTE.grey2 }}
        >
          Colour Balls
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <span
            className="blnk-display text-4xl font-black leading-none"
            style={{ color: loading ? PALETTE.grey1 : PALETTE.lime }}
          >
            {loading ? "—" : total}
          </span>
          <span className="text-[11px]" style={{ color: PALETTE.grey2 }}>
            collected
          </span>
        </div>
        <p className="text-[10px] mt-1.5" style={{ color: PALETTE.grey1 }}>
          {BALLS_PER_DAY} balls / day per NFT · {nftsEarning} filling
        </p>
      </div>

      <div
        className="flex-1 min-h-0 grid grid-cols-6 gap-2 p-3 content-start overflow-y-auto blnk-scroll rounded-xl"
        style={{ backgroundColor: PALETTE.bg, border: `1px solid ${PALETTE.border}` }}
      >
        {balls.map((color, i) => (
          <div
            key={i}
            className="w-full aspect-square rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}66, inset -2px -3px 4px rgba(0,0,0,0.35)`,
            }}
          />
        ))}
        {balls.length === 0 && !loading && (
          <p
            className="col-span-6 text-center text-[10px] mt-4 leading-relaxed"
            style={{ color: PALETTE.grey1 }}
          >
            Still grey.
            <br />
            Fill an NFT to start collecting colour.
          </p>
        )}
        {overflow > 0 && (
          <div
            className="col-span-6 text-center blnk-pixel text-[9px] mt-1"
            style={{ color: PALETTE.grey2 }}
          >
            +{overflow} more
          </div>
        )}
      </div>

      <GradientButton
        onClick={onRedeem}
        disabled={redeemDisabled || redeeming}
        title={redeemDisabled ? "The Colour Machine opens soon" : undefined}
        className="w-full shrink-0"
      >
        {redeeming && <Loader2 size={11} className="blnk-spin" />}
        Ride the Colour Machine →
      </GradientButton>
    </div>
  );
}
