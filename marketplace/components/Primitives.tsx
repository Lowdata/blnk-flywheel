"use client";
import type { ReactNode } from "react";
import { GRADIENT, PALETTE, PANEL_GRADIENT } from "../theme/palette";

/** The site's shape language: pill buttons, soft-cornered panels, and one
 *  lime→green gradient reserved for the primary action on screen. */

export function Panel({
  children,
  className = "",
  padded = true,
  dashed = false,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  dashed?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl ${padded ? "p-3" : ""} ${className}`}
      style={{
        background: PANEL_GRADIENT,
        border: `1px ${dashed ? "dashed" : "solid"} ${PALETTE.border}`,
      }}
    >
      {children}
    </div>
  );
}

export function GradientButton({
  children,
  onClick,
  disabled,
  title,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-full px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide text-black inline-flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
      style={{ background: GRADIENT }}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  color = PALETTE.grey3,
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide inline-flex items-center justify-center gap-1.5 transition-colors hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
      style={{ color, border: `1px solid ${PALETTE.borderHi}` }}
    >
      {children}
    </button>
  );
}

export function Pill({
  children,
  color,
  className = "",
}: {
  children: ReactNode;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${className}`}
      style={{ color, border: `1px solid ${color}44`, backgroundColor: `${color}14` }}
    >
      {children}
    </span>
  );
}

/** "B L N K" as the site sets it: wide tracking, the inner letters in colour. */
export function Wordmark({ size = "text-lg" }: { size?: string }) {
  return (
    <span className={`blnk-display ${size} font-black tracking-[0.35em] leading-none`}>
      <span style={{ color: PALETTE.paper }}>B</span>
      <span style={{ color: PALETTE.lime }}>L</span>
      <span style={{ color: PALETTE.green }}>N</span>
      <span style={{ color: PALETTE.paper }}>K</span>
    </span>
  );
}
