"use client";

import type { CustomTooltipProps } from "@tremor/react";
import { AreaChart as TremorAreaChart } from "@tremor/react";

interface AreaChartProps {
  className?: string;
  data: Record<string, string | number>[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  onValueChange?: (value: unknown) => void;
  showLegend?: boolean;
  showGridLines?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  yAxisWidth?: number;
}

// カスタムツールチップコンポーネント
const CustomTooltip = ({ payload, active, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-4 shadow-2xl">
      <p className="text-sm font-medium text-[#94a3b8] mb-3">{label}</p>
      <div className="space-y-2">
        {payload.map((entry) => {
          const colorMap: Record<string, string> = {
            indigo: "#6366f1",
            amber: "#f59e0b",
            emerald: "#10b981",
            slate: "#64748b",
            cyan: "#06b6d4",
          };
          const entryColor = String(entry.color || "");
          const color = colorMap[entryColor] || entryColor || "#6366f1";
          const keyValue = String(entry.dataKey ?? entry.name ?? "");
          return (
            <div
              key={keyValue}
              className="flex items-center justify-between gap-8"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-white font-medium">
                  {keyValue}
                </span>
              </div>
              <span className="text-sm font-bold text-white">
                ¥{Number(entry.value).toLocaleString("ja-JP")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function AreaChart({
  className,
  data,
  index,
  categories,
  colors = ["blue", "cyan"],
  valueFormatter,
  onValueChange,
  showLegend = true,
  showGridLines = true,
  showXAxis = true,
  showYAxis = true,
  yAxisWidth = 80,
}: AreaChartProps) {
  return (
    <TremorAreaChart
      className={className}
      data={data}
      index={index}
      categories={categories}
      colors={colors}
      valueFormatter={valueFormatter}
      onValueChange={onValueChange}
      showLegend={showLegend}
      showGridLines={showGridLines}
      showXAxis={showXAxis}
      showYAxis={showYAxis}
      yAxisWidth={yAxisWidth}
      customTooltip={CustomTooltip}
    />
  );
}
