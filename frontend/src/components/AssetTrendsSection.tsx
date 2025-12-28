"use client";

import { useState } from "react";
import { AreaChart } from "@/components";
import {
  type CategoryKey,
  categoryConfig,
  dailyDataRaw,
  monthlyDataRaw,
  yearlyDataRaw,
} from "@/lib/mockData";

// Helper to add total to each data item
const addTotal = (data: typeof monthlyDataRaw) => {
  return data.map((item) => ({
    ...item,
    合計: item.日本株 + item.米国株 + item.投資信託 + item.現金,
  }));
};

const monthlyData = addTotal(monthlyDataRaw);
const yearlyData = addTotal(yearlyDataRaw);
const dailyData = addTotal(dailyDataRaw);

type TimePeriod = "year" | "month" | "day";

const timePeriodConfig = {
  year: { label: "年", data: yearlyData },
  month: { label: "月", data: monthlyData },
  day: { label: "日", data: dailyData },
};

export const AssetTrendsSection = () => {
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>([
    "合計",
    "日本株",
    "米国株",
    "投資信託",
    "現金",
  ]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");

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
  const currentChartData = timePeriodConfig[timePeriod].data;

  return (
    <section className="p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#c9a227] to-[#dab842]" />
          <div>
            <h2 className="text-xl font-bold text-[#1e293b] dark:text-white">
              資産推移
            </h2>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
              期間とカテゴリを選択して表示
            </p>
          </div>
        </div>

        {/* 期間切り替えタブ */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
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
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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
        <AreaChart
          className="h-80"
          data={currentChartData}
          index="date"
          categories={selectedCategories}
          colors={selectedColors}
          valueFormatter={(number: number) => {
            if (number >= 1000000) {
              return `¥${(number / 1000000).toFixed(1)}M`;
            }
            return `¥${(number / 1000).toFixed(0)}K`;
          }}
          showLegend={false}
          yAxisWidth={70}
        />
      </div>
    </section>
  );
};
