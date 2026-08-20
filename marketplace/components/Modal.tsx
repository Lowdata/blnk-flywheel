"use client";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { PALETTE } from "../theme/palette";

interface Props {
  open: boolean;
  onClose: () => void;
  label: string;
  header: ReactNode;
  /** Sits left of the close button, where the marketplace puts its ball count. */
  headerAside?: ReactNode;
  children: ReactNode;
  /** Optional pinned footer. */
  footer?: ReactNode;
}

/** Shared overlay: escape to close, click-outside to close, and the page behind
 *  is locked so it can't scroll under the dialog. */
export function Modal({ open, onClose, label, header, headerAside, children, footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
      onClick={onClose}
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
        aria-label={label}
      >
        <div
          className="flex items-start justify-between gap-3 p-4 shrink-0"
          style={{ borderBottom: `1px solid ${PALETTE.border}` }}
        >
          <div className="min-w-0">{header}</div>
          <div className="flex items-center gap-2 shrink-0">
            {headerAside}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-1.5 opacity-50 hover:opacity-100 hover:bg-white/5"
            >
              <X size={14} color={PALETTE.grey2} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto blnk-scroll p-4">{children}</div>

        {footer && (
          <div className="shrink-0 p-4" style={{ borderTop: `1px solid ${PALETTE.border}` }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
