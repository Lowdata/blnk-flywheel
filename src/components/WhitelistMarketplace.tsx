import { useState } from "react";
import { Ticket, X, Lock, Check } from "lucide-react";
import { PALETTE, GRADIENT } from "../theme/palette";
import type { WlListing } from "../contracts/types";
import { GradientButton, GhostButton, Pill } from "./Primitives";

interface Props {
  balls: number;
  disabled: boolean;
  projects: WlListing[];
  claiming: boolean;
  onClaim: (project: WlListing) => void;
}

export function WhitelistMarketplace({
  balls,
  disabled,
  projects,
  claiming,
  onClaim,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-full rounded-2xl p-3 flex items-center gap-3 overflow-hidden text-left transition-colors shrink-0"
        style={{ backgroundColor: PALETTE.panel, border: `1px solid ${PALETTE.lime}33` }}
      >
        <div
          className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.14] blur-2xl transition-opacity group-hover:opacity-30"
          style={{ backgroundColor: PALETTE.lime }}
        />
        <div
          className="relative w-10 h-10 shrink-0 rounded-xl flex items-center justify-center"
          style={{ background: GRADIENT }}
        >
          <Ticket size={18} color="#000" />
        </div>
        <div className="relative flex-1 min-w-0">
          <p className="text-[13px] font-bold" style={{ color: PALETTE.paper }}>
            Whitelist Marketplace
          </p>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: PALETTE.grey2 }}>
            Spend Colour Balls on upcoming drops
          </p>
        </div>
        <span
          className="relative blnk-pixel text-[10px] shrink-0 px-2 py-1 rounded-full"
          style={{ color: PALETTE.lime, border: `1px solid ${PALETTE.lime}33` }}
        >
          {balls}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-lg max-h-[80vh] rounded-2xl flex flex-col overflow-hidden"
            style={{
              background: `linear-gradient(160deg, ${PALETTE.panel} 0%, ${PALETTE.panelHi} 100%)`,
              border: `1px solid ${PALETTE.borderHi}`,
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Whitelist Marketplace"
          >
            <div
              className="flex items-start justify-between gap-3 p-4 shrink-0"
              style={{ borderBottom: `1px solid ${PALETTE.border}` }}
            >
              <div>
                <h2 className="blnk-display text-lg font-black" style={{ color: PALETTE.paper }}>
                  Whitelist Marketplace
                </h2>
                <p className="text-[11px] mt-1" style={{ color: PALETTE.grey2 }}>
                  Trade Colour Balls for allowlist spots on upcoming drops.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="blnk-pixel text-[10px] px-2.5 py-1.5 rounded-full"
                  style={{ color: PALETTE.lime, border: `1px solid ${PALETTE.lime}33` }}
                >
                  {balls} balls
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-full p-1.5 opacity-50 hover:opacity-100 hover:bg-white/5"
                >
                  <X size={14} color={PALETTE.grey2} />
                </button>
              </div>
            </div>

            {/* The drops aren't real yet, so the list is held back behind a blur:
                the shape of the thing is visible, none of the detail is. `inert`
                does the rest — no clicks, no tab stops, nothing for a screen
                reader to read out. Delete this wrapper to ship it. */}
            <div className="relative flex-1 min-h-0 overflow-hidden">
              <div
                className="p-4 flex flex-col gap-3 select-none"
                style={{ filter: "blur(14px)", opacity: 0.6 }}
                inert
                aria-hidden="true"
              >
              {projects.map((project) => {
                const affordable = balls >= project.cost;
                const soldOut = project.spotsLeft === 0;
                const claimable = affordable && !soldOut && !disabled && !project.claimed;
                const filled = 1 - project.spotsLeft / project.spotsTotal;

                return (
                  <div
                    key={project.name}
                    className="rounded-xl p-3"
                    style={{
                      backgroundColor: PALETTE.bg,
                      border: `1px solid ${claimable ? `${project.accent}33` : PALETTE.border}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-[13px] font-bold truncate"
                            style={{ color: PALETTE.paper }}
                          >
                            {project.name}
                          </p>
                          <Pill color={project.accent}>{project.closesIn} left</Pill>
                        </div>
                        <p className="text-[11px] mt-1 leading-relaxed" style={{ color: PALETTE.grey2 }}>
                          {project.blurb}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className="blnk-display text-xl font-black leading-none"
                          style={{ color: affordable ? PALETTE.lime : PALETTE.grey1 }}
                        >
                          {project.cost}
                        </p>
                        <p className="text-[9px] mt-0.5" style={{ color: PALETTE.grey1 }}>
                          balls
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <div
                        className="flex-1 h-1 rounded-full overflow-hidden"
                        style={{ backgroundColor: PALETTE.border }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round(filled * 100)}%`,
                            backgroundColor: project.accent,
                          }}
                        />
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: PALETTE.grey1 }}>
                        {project.spotsLeft}/{project.spotsTotal} left
                      </span>

                      {project.claimed ? (
                        <GhostButton disabled color={PALETTE.green} className="!py-1 !text-[9px]">
                          <Check size={9} /> Claimed
                        </GhostButton>
                      ) : soldOut ? (
                        <GhostButton disabled color={PALETTE.grey1} className="!py-1 !text-[9px]">
                          <Check size={9} /> Sold out
                        </GhostButton>
                      ) : claimable ? (
                        <GradientButton
                          onClick={() => onClaim(project)}
                          disabled={claiming}
                          className="!py-1 !px-3 !text-[9px]"
                        >
                          {claiming ? "Claiming…" : "Claim spot"}
                        </GradientButton>
                      ) : (
                        <GhostButton
                          disabled
                          color={PALETTE.grey1}
                          className="!py-1 !text-[9px]"
                          title={
                            disabled
                              ? "Connect your wallet to claim"
                              : `Need ${project.cost - balls} more balls`
                          }
                        >
                          <Lock size={9} />
                          {disabled ? "Connect" : `Need ${project.cost - balls}`}
                        </GhostButton>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>

              <div
                className="absolute inset-0 flex items-center justify-center p-6"
                style={{ backgroundColor: "rgba(10,10,12,0.45)" }}
              >
                <span
                  className="blnk-pixel text-[12px] px-4 py-2 rounded-full"
                  style={{
                    color: PALETTE.lime,
                    border: `1px solid ${PALETTE.lime}44`,
                    backgroundColor: `${PALETTE.lime}0d`,
                  }}
                >
                  Coming soon
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
