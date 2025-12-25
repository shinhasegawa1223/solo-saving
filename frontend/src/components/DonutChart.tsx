"use client";

import type { CustomTooltipProps } from "@tremor/react";
import { DonutChart as TremorDonutChart } from "@tremor/react";

interface DonutChartData {
  name: string;
  value: number;
}

interface DonutChartProps {
  className?: string;
  data: DonutChartData[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showAnimation?: boolean;
  variant?: "pie" | "donut";
  label?: string;
}

// カラーマッピング（AreaChartと統一）
const colorMap: Record<string, string> = {
  indigo: "#6366f1",
  amber: "#f59e0b",
  emerald: "#10b981",
  slate: "#64748b",
  cyan: "#06b6d4",
};

// カスタムツールチップコンポーネント（AreaChartと統一したスタイル）
const CustomTooltip = ({ payload, active }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  const entryColor = String(entry.color || "");
  const color = colorMap[entryColor] || entryColor || "#6366f1";
  const name = String(entry.name || "");
  const value = Number(entry.value || 0);

  return (
    <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-4 shadow-2xl">
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm text-white font-medium">{name}</span>
        </div>
        <span className="text-sm font-bold text-white">
          ¥{value.toLocaleString("ja-JP")}
        </span>
      </div>
    </div>
  );
};

export function DonutChart({
  className,
  data,
  colors = ["indigo", "amber", "emerald", "slate"],
  valueFormatter,
  showAnimation = true,
  variant = "donut",
  label,
}: DonutChartProps) {
  return (
    <div className={`flex items-center justify-center ${className || ""}`}>
      <TremorDonutChart
        data={data}
        category="value"
        index="name"
        colors={colors}
        valueFormatter={valueFormatter}
        showAnimation={showAnimation}
        variant={variant}
        label={label}
        className="h-64 w-64"
        customTooltip={CustomTooltip}
      />
    </div>
  );
}
