"use client";

import { AssetTrendsSection } from "@/components/AssetTrendsSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PortfolioSection } from "@/components/PortfolioSection";
import { ProgressBarHero } from "@/components/ProgressBarHero";
import { StatsCard } from "@/components/StatsCard";
import { appConfig, formatStatValue } from "@/config";

const { dashboard } = appConfig;
const { stats } = dashboard;

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-300">
      <Header />

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

      <Footer />
    </div>
  );
}
