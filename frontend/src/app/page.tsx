"use client";

import { useState } from "react";
import { AreaChart } from "@/components/AreaChart";
import { DonutChart } from "@/components/DonutChart";
import { ThemeToggle } from "@/components/ThemeToggle";

// 月次データ
const monthlyDataRaw = [
  {
    date: "1月",
    日本株: 890000,
    米国株: 1200000,
    投資信託: 800000,
    現金: 500000,
  },
  {
    date: "2月",
    日本株: 920000,
    米国株: 1150000,
    投資信託: 820000,
    現金: 510000,
  },
  {
    date: "3月",
    日本株: 980000,
    米国株: 1300000,
    投資信託: 850000,
    現金: 520000,
  },
  {
    date: "4月",
    日本株: 1050000,
    米国株: 1280000,
    投資信託: 880000,
    現金: 530000,
  },
  {
    date: "5月",
    日本株: 1100000,
    米国株: 1350000,
    投資信託: 900000,
    現金: 540000,
  },
  {
    date: "6月",
    日本株: 1080000,
    米国株: 1400000,
    投資信託: 920000,
    現金: 550000,
  },
  {
    date: "7月",
    日本株: 1150000,
    米国株: 1450000,
    投資信託: 950000,
    現金: 560000,
  },
  {
    date: "8月",
    日本株: 1120000,
    米国株: 1380000,
    投資信託: 970000,
    現金: 570000,
  },
  {
    date: "9月",
    日本株: 1180000,
    米国株: 1420000,
    投資信託: 990000,
    現金: 580000,
  },
  {
    date: "10月",
    日本株: 1220000,
    米国株: 1500000,
    投資信託: 1010000,
    現金: 590000,
  },
  {
    date: "11月",
    日本株: 1280000,
    米国株: 1550000,
    投資信託: 1030000,
    現金: 600000,
  },
  {
    date: "12月",
    日本株: 1350000,
    米国株: 1600000,
    投資信託: 1050000,
    現金: 610000,
  },
];

// 年次データ
const yearlyDataRaw = [
  {
    date: "2020",
    日本株: 650000,
    米国株: 800000,
    投資信託: 500000,
    現金: 400000,
  },
  {
    date: "2021",
    日本株: 780000,
    米国株: 950000,
    投資信託: 620000,
    現金: 450000,
  },
  {
    date: "2022",
    日本株: 850000,
    米国株: 1100000,
    投資信託: 720000,
    現金: 480000,
  },
  {
    date: "2023",
    日本株: 1100000,
    米国株: 1350000,
    投資信託: 880000,
    現金: 550000,
  },
  {
    date: "2024",
    日本株: 1350000,
    米国株: 1600000,
    投資信託: 1050000,
    現金: 610000,
  },
];

// 日次データ（直近30日）
const dailyDataRaw = [
  {
    date: "12/1",
    日本株: 1300000,
    米国株: 1550000,
    投資信託: 1020000,
    現金: 600000,
  },
  {
    date: "12/5",
    日本株: 1310000,
    米国株: 1560000,
    投資信託: 1025000,
    現金: 602000,
  },
  {
    date: "12/10",
    日本株: 1320000,
    米国株: 1555000,
    投資信託: 1030000,
    現金: 604000,
  },
  {
    date: "12/15",
    日本株: 1335000,
    米国株: 1580000,
    投資信託: 1040000,
    現金: 606000,
  },
  {
    date: "12/20",
    日本株: 1340000,
    米国株: 1590000,
    投資信託: 1045000,
    現金: 608000,
  },
  {
    date: "12/25",
    日本株: 1350000,
    米国株: 1600000,
    投資信託: 1050000,
    現金: 610000,
  },
];

// 合計を追加する関数
const addTotal = (data: typeof monthlyDataRaw) => {
  return data.map((item) => ({
    ...item,
    合計: item.日本株 + item.米国株 + item.投資信託 + item.現金,
  }));
};

const monthlyData = addTotal(monthlyDataRaw);
const yearlyData = addTotal(yearlyDataRaw);
const dailyData = addTotal(dailyDataRaw);

const categoryConfig = {
  合計: {
    color: "cyan",
    bgColor: "bg-cyan-500",
    borderColor: "border-cyan-500",
  },
  日本株: {
    color: "indigo",
    bgColor: "bg-indigo-500",
    borderColor: "border-indigo-500",
  },
  米国株: {
    color: "amber",
    bgColor: "bg-amber-500",
    borderColor: "border-amber-500",
  },
  投資信託: {
    color: "emerald",
    bgColor: "bg-emerald-500",
    borderColor: "border-emerald-500",
  },
  現金: {
    color: "slate",
    bgColor: "bg-slate-500",
    borderColor: "border-slate-500",
  },
};

type CategoryKey = keyof typeof categoryConfig;
type TimePeriod = "year" | "month" | "day";

const timePeriodConfig = {
  year: { label: "年", data: yearlyData },
  month: { label: "月", data: monthlyData },
  day: { label: "日", data: dailyData },
};

export default function Home() {
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-300">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-[#0f172a]/80 border-b border-[#e2e8f0] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d4a7c] flex items-center justify-center shadow-lg shadow-[#1e3a5f]/20">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">
              Solo Saving
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* 統計カード */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* カード1 - 総資産額 */}
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#2d4a7c] text-white shadow-xl shadow-[#1e3a5f]/20 card-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-white/80">総資産額</p>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                  月次
                </span>
              </div>
              <p className="text-4xl font-bold tracking-tight">¥4,610,000</p>
              <div className="flex items-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1 text-[#c9a227] text-sm font-semibold">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="上昇トレンド"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  +8.5%
                </span>
                <span className="text-sm text-white/60">先月比</span>
              </div>
            </div>
          </div>

          {/* カード2 - 保有銘柄数 */}
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-[#c9a227] to-[#dab842] text-[#1e293b] shadow-xl shadow-[#c9a227]/20 card-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-[#1e293b]/80">
                  保有銘柄数
                </p>
                <span className="text-xs px-2 py-1 rounded-full bg-white/20">
                  現在
                </span>
              </div>
              <p className="text-4xl font-bold tracking-tight">12銘柄</p>
              <div className="flex items-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1 text-[#1e3a5f] text-sm font-bold">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="上昇トレンド"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  +3銘柄
                </span>
                <span className="text-sm text-[#1e293b]/60">先月比</span>
              </div>
            </div>
          </div>

          {/* カード3 - 利回り */}
          <div className="group p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] shadow-lg card-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1e3a5f]/5 dark:bg-[#c9a227]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-[#64748b] dark:text-[#94a3b8]">
                  利回り
                </p>
                <span className="text-xs px-2 py-1 rounded-full bg-[#1e3a5f]/10 dark:bg-[#c9a227]/10 text-[#1e3a5f] dark:text-[#c9a227]">
                  年率
                </span>
              </div>
              <p className="text-4xl font-bold tracking-tight text-[#1e293b] dark:text-white">
                3.24%
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1 text-[#c9a227] text-sm font-semibold">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="上昇トレンド"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  +0.45%
                </span>
                <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                  先月比
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* チャートセクション */}
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
                        : `bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600`
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
              onValueChange={(v) => console.log(v)}
              showLegend={false}
              yAxisWidth={70}
            />
          </div>
        </section>

        {/* ポートフォリオ構成（円グラフ） */}
        <section className="p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#6366f1] to-[#8b5cf6]" />
            <div>
              <h2 className="text-xl font-bold text-[#1e293b] dark:text-white">
                ポートフォリオ構成
              </h2>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                資産カテゴリ別の配分比率
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* 円グラフ */}
            <div className="w-full lg:w-1/2 h-80">
              <DonutChart
                data={[
                  { name: "日本株", value: 1350000 },
                  { name: "米国株", value: 1600000 },
                  { name: "投資信託", value: 1050000 },
                  { name: "現金", value: 610000 },
                ]}
                colors={["indigo", "amber", "emerald", "slate"]}
                valueFormatter={(value: number) => `¥${value.toLocaleString()}`}
                variant="donut"
                label="¥4,610,000"
              />
            </div>

            {/* 詳細情報 */}
            <div className="w-full lg:w-1/2 space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                      <span className="text-white text-lg">🇯🇵</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#1e293b] dark:text-white">
                        日本株
                      </p>
                      <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                        国内株式
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#1e293b] dark:text-white">
                      ¥1,350,000
                    </p>
                    <p className="text-sm text-indigo-500 font-medium">29.3%</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                      <span className="text-white text-lg">🇺🇸</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#1e293b] dark:text-white">
                        米国株
                      </p>
                      <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                        米国株式
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#1e293b] dark:text-white">
                      ¥1,600,000
                    </p>
                    <p className="text-sm text-amber-500 font-medium">34.7%</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <span className="text-white text-lg">📊</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#1e293b] dark:text-white">
                        投資信託
                      </p>
                      <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                        ファンド
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#1e293b] dark:text-white">
                      ¥1,050,000
                    </p>
                    <p className="text-sm text-emerald-500 font-medium">
                      22.8%
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-500/10 to-slate-500/5 border border-slate-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-500 flex items-center justify-center">
                      <span className="text-white text-lg">💵</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#1e293b] dark:text-white">
                        現金
                      </p>
                      <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                        預金・現金
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#1e293b] dark:text-white">
                      ¥610,000
                    </p>
                    <p className="text-sm text-slate-500 font-medium">13.2%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="mt-12 border-t border-[#e2e8f0] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-center text-sm text-[#64748b] dark:text-[#94a3b8]">
            © 2025 Solo Saving
          </p>
        </div>
      </footer>
    </div>
  );
}
