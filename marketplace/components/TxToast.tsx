"use client";
import { useEffect } from "react";
import { CheckCircle2, Loader2, PenLine, X, XCircle } from "lucide-react";
import { PALETTE } from "../theme/palette";
import type { TxState } from "../contracts/types";

interface Props {
  tx: TxState;
  onDismiss: () => void;
}

export function TxToast({ tx, onDismiss }: Props) {
  const done = tx.status === "success" || tx.status === "error";

  useEffect(() => {
    if (tx.status !== "success") return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [tx.status, onDismiss]);

  if (tx.status === "idle") return null;

  const color =
    tx.status === "error" ? PALETTE.red : tx.status === "success" ? PALETTE.green : PALETTE.lime;

  const message =
    tx.status === "signing"
      ? "Sign the message in your wallet — no gas, no funds moved"
      : tx.status === "pending"
        ? "Saving"
        : tx.status === "success"
          ? "Done"
          : (tx.error ?? "Failed");

  return (
    <div
      role="status"
      className="fixed bottom-5 right-5 z-50 flex items-start gap-2.5 rounded-2xl px-4 py-3 max-w-sm"
      style={{
        background: `linear-gradient(160deg, ${PALETTE.panel} 0%, ${PALETTE.panelHi} 100%)`,
        border: `1px solid ${color}44`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <span className="mt-0.5 shrink-0">
        {tx.status === "success" ? (
          <CheckCircle2 size={13} color={color} />
        ) : tx.status === "error" ? (
          <XCircle size={13} color={color} />
        ) : tx.status === "signing" ? (
          <PenLine size={13} color={color} />
        ) : (
          <Loader2 size={13} color={color} className="blnk-spin" />
        )}
      </span>

      <div className="min-w-0">
        <p className="text-[11px] font-bold truncate" style={{ color: PALETTE.paper }}>
          {tx.label}
        </p>
        <p className="text-[10px] mt-1 break-words leading-relaxed" style={{ color: PALETTE.grey2 }}>
          {message}
        </p>
      </div>

      {done && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-full p-1 opacity-40 hover:opacity-100 hover:bg-white/5"
        >
          <X size={12} color={PALETTE.grey2} />
        </button>
      )}
    </div>
  );
}
