"use client";

import { useEffect, useState } from "react";
import { AreaChart } from "@/components";
import { type ChartData, getChartData } from "@/lib/api";
import { type CategoryKey, categoryConfig } from "@/lib/constants";

type TimePeriod = "year" | "month" | "day";

const timePeriodConfig = {
  year: { label: "年" },
  month: { label: "月" },
  day: { label: "日" },
};

interface AssetTrendsSectionProps {
  initialData?: ChartData[];
}

export const AssetTrendsSection = ({
  initialData,
}: AssetTrendsSectionProps) => {
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>([
    "合計",
    "日本株",
    "米国株",
    "投資信託",
    "現金",
  ]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [chartData, setChartData] = useState<ChartData[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [initialPeriod] = useState<TimePeriod>("month"); // 初期データの期間を記録

  // 期間変更時のみAPIから取得（初期データと同じ期間の場合はスキップ）
  useEffect(() => {
    // 初期データがあり、かつ期間がmonth（初期値）の場合は、
    // initialDataをそのまま使用する（親から渡された最新データを反映）
    if (initialData && timePeriod === initialPeriod) {
      setChartData(initialData);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getChartData(timePeriod);
        setChartData(data);
      } catch (err) {
        console.error("Failed to fetch chart data:", err);
        setError("データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timePeriod, initialData, initialPeriod]);

  const toggleCategory = (category: CategoryKey) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== category);
      }
      return [...prev, category];
    });
  };

  const selectedColors = selectedCategories.map(
    (cat) => categoryConfig[cat].color
  );

  // Y軸の上限を計算（5等分できるきれいな数字に）
  const calculateMaxValue = () => {
    if (chartData.length === 0) return undefined;

    let maxVal = 0;
    for (const item of chartData) {
      for (const cat of selectedCategories) {
        const val = Number(item[cat]) || 0;
        if (val > maxVal) maxVal = val;
      }
    }

    // 余裕を持たせる（+25%）
    const withMargin = maxVal * 1.25;

    // 5で割り切れるきれいな数字を選ぶ
    // 目盛りが 0, 5万, 10万, 15万, 20万 のようになる
    const niceIntervals = [
      50000, // 5万刻み → 最大25万まで
      100000, // 10万刻み → 最大50万まで
      200000, // 20万刻み → 最大100万まで
      500000, // 50万刻み → 最大250万まで
      1000000, // 100万刻み
    ];

    for (const interval of niceIntervals) {
      const maxValue = Math.ceil(withMargin / interval) * interval;
      if (maxValue >= withMargin) {
        return maxValue;
      }
    }

    // デフォルト: 100万刻み
    return Math.ceil(withMargin / 1000000) * 1000000;
  };

  const chartMaxValue = calculateMaxValue();

  return (
    <section className="p-6 rounded-xl bg-white dark:bg-[#262626] border border-[#e2e8f0] dark:border-[#404040] shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#c9a227] to-[#dab842]" />
          <div>
            <h2 className="text-xl font-bold text-[#1e293b] dark:text-white">
              資産推移
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              期間とカテゴリを選択して表示
            </p>
          </div>
        </div>

        {/* 期間切り替えタブ */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          {(Object.keys(timePeriodConfig) as TimePeriod[]).map((period) => (
            <button
              type="button"
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${
                  timePeriod === period
                    ? "bg-white dark:bg-[#1e3a5f] text-[#1e3a5f] dark:text-white shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                }
              `}
            >
              {timePeriodConfig[period].label}
            </button>
          ))}
        </div>
      </div>

      {/* カテゴリ切り替えボタン */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(categoryConfig) as CategoryKey[]).map((category) => {
          const isSelected = selectedCategories.includes(category);
          const config = categoryConfig[category];
          return (
            <button
              type="button"
              key={category}
              onClick={() => toggleCategory(category)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${
                  isSelected
                    ? `${config.bgColor} text-white shadow-lg`
                    : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                }
              `}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${isSelected ? "bg-white" : config.bgColor}`}
                />
                {category}
              </span>
            </button>
          );
        })}
      </div>

      <div className="chart-container">
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] dark:border-[#c9a227]" />
          </div>
        ) : error ? (
          <div className="h-80 flex items-center justify-center text-red-500">
            {error}
          </div>
        ) : (
          <AreaChart
            className="h-80"
            data={chartData}
            index="date"
            categories={selectedCategories}
            colors={selectedColors}
            valueFormatter={(number: number) => {
              if (number >= 1000000) {
                // 100万以上は "¥1M"
                return `¥${(number / 1000000).toFixed(0)}M`;
              }
              if (number >= 10000) {
                // 1万以上は "¥10万"
                return `¥${(number / 10000).toFixed(0)}万`;
              }
              return `¥${number.toLocaleString()}`;
            }}
            showLegend={false}
            yAxisWidth={80}
            maxValue={chartMaxValue}
            minValue={0}
          />
        )}
      </div>
    </section>
  );
};
