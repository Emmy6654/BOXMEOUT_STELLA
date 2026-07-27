"use client";

import { useEffect, useState } from "react";
import { fetchMarketStats } from "@/lib/api";
import { MarketStats } from "@/lib/api";

export interface UseMarketEventsResult {
  poolA: bigint | null;
  poolB: bigint | null;
  impliedOddsA: number | null;
  impliedOddsB: number | null;
  isLoading: boolean;
  error: Error | null;
}

const POLL_INTERVAL_MS = 4000;

/**
 * Live-updates a market's pool totals by polling the lightweight stats endpoint
 * at a much tighter interval than the full market fetch, so the odds/pool split
 * on the detail page tracks new bets close to real time.
 */
export function useMarketEvents(market_id: string): UseMarketEventsResult {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await fetchMarketStats(market_id);
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [market_id]);

  return {
    poolA: stats ? BigInt(stats.poolA) : null,
    poolB: stats ? BigInt(stats.poolB) : null,
    impliedOddsA: stats?.impliedOddsA ?? null,
    impliedOddsB: stats?.impliedOddsB ?? null,
    isLoading,
    error,
  };
}
