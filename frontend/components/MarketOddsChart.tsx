"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { OddsSnapshot } from "@/lib/api";

export interface MarketOddsChartProps {
  marketId: string;
  historicalOdds: OddsSnapshot[];
}

export function MarketOddsChart({ historicalOdds }: MarketOddsChartProps): JSX.Element {
  if (historicalOdds.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-800 rounded-xl text-gray-500 text-sm">
        No odds data yet
      </div>
    );
  }

  const data = historicalOdds.map((s) => ({
    t: new Date(s.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    A: s.oddsA,
    B: s.oddsB,
  }));

  // For a single data point render dots; for multiple render lines without dots
  const isSinglePoint = data.length === 1;

  return (
    <div className="w-full h-48 bg-gray-800 rounded-xl p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="t" tick={{ fill: "#9ca3af", fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: "#1f2937", border: "none", fontSize: 12 }}
            formatter={(value: number, name: string) => [`${value}%`, name]}
          />
          <Line
            type="monotone"
            dataKey="A"
            stroke="#3b82f6"
            dot={isSinglePoint}
            strokeWidth={2}
            name="Fighter A"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="B"
            stroke="#ef4444"
            dot={isSinglePoint}
            strokeWidth={2}
            name="Fighter B"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
