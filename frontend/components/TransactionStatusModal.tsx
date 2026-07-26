"use client";
import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export type TransactionStatus = "pending" | "success" | "error";

export interface TransactionStatusModalProps {
  isOpen: boolean;
  status: TransactionStatus;
  txHash?: string | null;
  errorMessage?: string | null;
  onClose: () => void;
}

const COPY: Record<TransactionStatus, { title: string; body: string }> = {
  pending: {
    title: "Confirming transaction",
    body: "Waiting for the Stellar network to confirm your bet. This usually takes a few seconds.",
  },
  success: {
    title: "Bet placed!",
    body: "Your transaction was confirmed and your bet has been recorded.",
  },
  error: {
    title: "Transaction failed",
    body: "Something went wrong while submitting your bet.",
  },
};

/**
 * Blocking modal shown while a bet transaction is in flight and once it settles.
 * Cannot be dismissed while pending — only success/error states allow closing.
 */
export function TransactionStatusModal({
  isOpen,
  status,
  txHash,
  errorMessage,
  onClose,
}: TransactionStatusModalProps): JSX.Element | null {
  const canDismiss = status !== "pending";

  const handleClose = useCallback(() => {
    if (canDismiss) onClose();
  }, [canDismiss, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const copy = COPY[status];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={handleClose}>
      <div
        className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-sm mx-4 space-y-4 text-center"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-status-modal-title"
        aria-describedby="tx-status-modal-body"
      >
        <div className="flex justify-center" aria-hidden="true">
          {status === "pending" && (
            <svg className="animate-spin h-8 w-8 text-amber-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {status === "success" && <span className="text-4xl text-green-400">✓</span>}
          {status === "error" && <span className="text-4xl text-red-400">✕</span>}
        </div>

        <h2 id="tx-status-modal-title" className="text-lg font-semibold text-white">
          {copy.title}
        </h2>
        <p id="tx-status-modal-body" className="text-sm text-gray-400">
          {status === "error" && errorMessage ? errorMessage : copy.body}
        </p>

        {status === "success" && txHash && (
          <p className="text-xs text-gray-500 font-mono truncate">Tx: {txHash}</p>
        )}

        {canDismiss && (
          <button
            type="button"
            onClick={handleClose}
            className="w-full h-10 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            Close
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
