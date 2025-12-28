"use client";

import { AssetTrendsSection } from "@/components/AssetTrendsSection";
import { PortfolioSection } from "@/components/PortfolioSection";
import { ProgressBarHero } from "@/components/ProgressBarHero";
import { StatsCard } from "@/components/StatsCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { appConfig, formatStatValue } from "@/config";

const { app, dashboard } = appConfig;
const { stats } = dashboard;

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-300">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-[#0f172a]/80 border-b border-[#e2e8f0] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d4a7c] flex items-center justify-center shadow-lg shadow-[#1e3a5f]/20">
              <span className="text-white font-bold text-xl">
                {app.name.charAt(0)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">
              {app.name}
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* 統計カード */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title={stats.totalAssets.title}
            tag={stats.totalAssets.tag}
            value={formatStatValue(stats.totalAssets)}
            trend={stats.totalAssets.trend}
            trendLabel={stats.totalAssets.trendLabel}
            variant={stats.totalAssets.variant}
          />
          <StatsCard
            title={stats.holdings.title}
            tag={stats.holdings.tag}
            value={formatStatValue(stats.holdings)}
            trend={stats.holdings.trend}
            trendLabel={stats.holdings.trendLabel}
            variant={stats.holdings.variant}
          />
          <StatsCard
            title={stats.yield.title}
            tag={stats.yield.tag}
            value={formatStatValue(stats.yield)}
            trend={stats.yield.trend}
            trendLabel={stats.yield.trendLabel}
            variant={stats.yield.variant}
          />
        </section>

        {/* 目標設定プログレス */}
        <ProgressBarHero />

        {/* チャートセクション */}
        <AssetTrendsSection />

        {/* ポートフォリオ構成（円グラフ） */}
        <PortfolioSection />
      </main>

      {/* フッター */}
      <footer className="mt-12 border-t border-[#e2e8f0] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-center text-sm text-[#64748b] dark:text-[#94a3b8]">
            © {app.year} {app.name}
          </p>
        </div>
      </footer>
    </div>
  );
}
