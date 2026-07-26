"use client";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Market } from "@/lib/api";

const DISPUTE_WINDOW_SEC = 86400; // 24 hours

export interface DisputeModalProps {
  market: Market;
  isOpen: boolean;
  onDisputed: () => void;
  onClose: () => void;
}

export function DisputeModal({ market, isOpen, onDisputed, onClose }: DisputeModalProps): JSX.Element | null {
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check dispute window: only visible when Resolved AND within window
  const withinWindow = (() => {
    if (market.status !== "Resolved") return false;
    // Use scheduledAt as a proxy for resolvedAt since Market type lacks resolvedAt
    const resolvedAt = new Date(market.scheduledAt).getTime();
    return Date.now() - resolvedAt < DISPUTE_WINDOW_SEC * 1000;
  })();

  const handleClose = useCallback(() => {
    setReason("");
    setValidationError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen || !withinWindow) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 20) {
      setValidationError("Reason must be at least 20 characters.");
      return;
    }
    setValidationError(null);
    setIsSubmitting(true);
    try {
      // Dispute tx would be submitted here
      onDisputed();
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleClose}
    >
      <div
        className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-modal-title"
      >
        <h2 id="dispute-modal-title" className="text-lg font-semibold text-white">
          Dispute This Result
        </h2>
        <p className="text-sm text-gray-400">
          If you believe the reported outcome is incorrect, submit a dispute with a detailed reason.
          Disputes must be raised within 24 hours of resolution.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why this result is incorrect (min 20 characters)..."
              rows={4}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              disabled={isSubmitting}
            />
            {validationError && (
              <p className="mt-1 text-xs text-red-400">{validationError}</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md text-sm text-gray-300 hover:text-white hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit Dispute"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
