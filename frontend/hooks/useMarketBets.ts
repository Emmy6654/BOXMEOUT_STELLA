"use client";

import { useEffect, useState } from "react";
import { fetchMarketBets } from "@/lib/api";
import { Bet } from "@/lib/api";

export interface UseMarketBetsResult {
  bets: Bet[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches the bet history for a market and polls every 15 seconds for new bets.
 */
export function useMarketBets(market_id: string): UseMarketBetsResult {
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMarketBets(market_id);
      setBets(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [market_id]);

  return { bets, isLoading, error, refetch: fetch };
}
