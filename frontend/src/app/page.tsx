"use client";

import { AssetTrendsSection } from "@/components/AssetTrendsSection";
import { PortfolioSection } from "@/components/PortfolioSection";
import { StatsCard } from "@/components/StatsCard";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
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
          <StatsCard
            title="総資産額"
            tag="月次"
            value="¥4,610,000"
            trend="+8.5%"
            trendLabel="先月比"
            variant="primary"
          />
          <StatsCard
            title="保有銘柄数"
            tag="現在"
            value="12銘柄"
            trend="+3銘柄"
            trendLabel="先月比"
            variant="accent"
          />
          <StatsCard
            title="利回り"
            tag="年率"
            value="3.24%"
            trend="+0.45%"
            trendLabel="先月比"
            variant="neutral"
          />
        </section>

        {/* チャートセクション */}
        <AssetTrendsSection />

        {/* ポートフォリオ構成（円グラフ） */}
        <PortfolioSection />
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
