import { Market, MarketStatus } from "@/lib/api";
import MarketCard from "./MarketCard";
import { LoadingSkeleton } from "./LoadingSkeleton";

export interface MarketListProps {
  markets: Market[];
  isLoading: boolean;
  /** Optional status filter — when set, only markets matching this status are shown */
  filter?: MarketStatus;
}

const EMPTY_STATE_MESSAGES: Record<MarketStatus, string> = {
  Open: "No open markets right now. Check back soon!",
  Locked: "No locked markets at the moment.",
  Resolved: "No resolved markets yet.",
  Cancelled: "No cancelled markets.",
  Disputed: "No disputed markets.",
};

const EMPTY_STATE_ICONS: Record<MarketStatus, string> = {
  Open: "🥊",
  Locked: "🔒",
  Resolved: "🏆",
  Cancelled: "❌",
  Disputed: "⚠️",
};

export function MarketList({ markets, isLoading, filter }: MarketListProps): JSX.Element {
  // Show skeleton cards while fetching
  if (isLoading) {
    return <LoadingSkeleton variant="card" count={6} />;
  }

  // Apply filter client-side when provided
  const filtered = filter ? markets.filter((m) => m.status === filter) : markets;

  // Empty state — message and icon vary by active filter
  if (filtered.length === 0) {
    const icon = filter ? EMPTY_STATE_ICONS[filter] : "🥊";
    const message = filter
      ? EMPTY_STATE_MESSAGES[filter]
      : "No markets available yet. Be the first to create one!";

    return (
      <div
        role="status"
        aria-label="No markets found"
        className="text-center py-16 text-gray-500"
      >
        <p className="text-4xl mb-3" aria-hidden="true">{icon}</p>
        <p className="text-base">{message}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((m) => (
        <MarketCard key={m.id} market={m} showOdds={m.status === "Open"} />
      ))}
    </div>
  );
}
