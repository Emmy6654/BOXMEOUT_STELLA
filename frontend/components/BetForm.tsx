"use client";
import { useId, useState } from "react";
import { Bet, BetSide, Market } from "@/lib/api";
import { BetAmountInput } from "./BetAmountInput";
import { TransactionStatusModal, TransactionStatus } from "./TransactionStatusModal";
import { usePlaceBet } from "@/hooks/usePlaceBet";

const MIN_AMOUNT_XLM = 1;
const MAX_AMOUNT_XLM = 10000;

export interface BetFormProps {
  market: Market;
  onBetPlaced?: (bet: Bet) => void;
}

/** Amount input + side toggle wired to usePlaceBet, with modal transaction feedback. */
export function BetForm({ market, onBetPlaced }: BetFormProps): JSX.Element {
  const headingId = useId();
  const sideGroupId = useId();
  const [side, setSide] = useState<BetSide | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [txStatus, setTxStatus] = useState<TransactionStatus | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const { placeBet, isLoading } = usePlaceBet(market.id);

  const isLocked = market.status !== "Open";
  const numericAmount = parseFloat(amount);
  const isAmountValid =
    amount.trim() !== "" &&
    !isNaN(numericAmount) &&
    numericAmount > 0 &&
    numericAmount >= MIN_AMOUNT_XLM &&
    numericAmount <= MAX_AMOUNT_XLM;

  const allDisabled = isLocked || isLoading;
  const canSubmit = !allDisabled && !!side && isAmountValid;

  async function handleSubmit() {
    if (!canSubmit || !side) return;

    const stroops = BigInt(Math.round(numericAmount * 1e7));
    setTxStatus("pending");
    setTxError(null);
    setTxHash(null);

    try {
      const bet = await placeBet(side, stroops);
      setTxStatus("success");
      setTxHash(bet.id);
      onBetPlaced?.(bet);
      setSide(null);
      setAmount("");
    } catch (e) {
      setTxStatus("error");
      setTxError(e instanceof Error ? e.message : "Transaction failed.");
    }
  }

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800";

  return (
    <section aria-labelledby={headingId} className="bg-gray-800 rounded-xl p-4 w-full space-y-4">
      <h2 id={headingId} className="text-base font-semibold text-white">
        Place Bet
      </h2>

      {isLocked && (
        <p role="status" className="text-sm text-yellow-400">
          Betting is {market.status.toLowerCase()}.
        </p>
      )}

      <div role="group" aria-labelledby={sideGroupId} className="space-y-2">
        <span id={sideGroupId} className="block text-sm text-gray-400">
          Pick a side
        </span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSide("FighterA")}
            disabled={allDisabled}
            aria-pressed={side === "FighterA"}
            aria-label={`Bet on ${market.fighterA.name}`}
            className={`h-11 rounded-lg text-sm font-medium transition-colors ${
              side === "FighterA" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            } ${focusRing} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {market.fighterA.name}
          </button>
          <button
            type="button"
            onClick={() => setSide("FighterB")}
            disabled={allDisabled}
            aria-pressed={side === "FighterB"}
            aria-label={`Bet on ${market.fighterB.name}`}
            className={`h-11 rounded-lg text-sm font-medium transition-colors ${
              side === "FighterB" ? "bg-red-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            } ${focusRing} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {market.fighterB.name}
          </button>
        </div>
      </div>

      <BetAmountInput
        value={amount}
        onChange={(v) => {
          if (!allDisabled) setAmount(v);
        }}
        min={MIN_AMOUNT_XLM}
        max={MAX_AMOUNT_XLM}
        estimatedPayout={null}
        disabled={allDisabled}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full h-11 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors ${focusRing}`}
      >
        {isLoading ? "Processing…" : "Confirm Bet"}
      </button>

      {txStatus && (
        <TransactionStatusModal
          isOpen
          status={txStatus}
          txHash={txHash}
          errorMessage={txError}
          onClose={() => setTxStatus(null)}
        />
      )}
    </section>
  );
}
