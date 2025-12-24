"use client";

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
}

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
    />
  );
}
