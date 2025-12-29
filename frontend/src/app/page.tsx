"use client";

import { useEffect, useState } from "react";
import {
  AssetTrendsSection,
  Footer,
  Header,
  PortfolioSection,
  ProgressBarHero,
  StatsCard,
} from "@/components";
import { formatCurrency } from "@/config";
import { type DashboardStats, getDashboardStats } from "@/lib/api";

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-300">
      <Header />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* 統計カード */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              <div className="h-32 rounded-xl bg-white dark:bg-[#1e293b] animate-pulse" />
              <div className="h-32 rounded-xl bg-white dark:bg-[#1e293b] animate-pulse" />
              <div className="h-32 rounded-xl bg-white dark:bg-[#1e293b] animate-pulse" />
            </>
          ) : stats ? (
            <>
              <StatsCard
                title="総資産"
                tag="Total Assets"
                value={formatCurrency(Number(stats.total_assets))}
                trend={stats.total_assets_trend}
                subTrend={stats.total_assets_diff}
                trendLabel="前日比"
                variant="primary"
              />

              <StatsCard
                title="保有銘柄"
                tag="Holdings"
                value={`${stats.holding_count}銘柄`}
                trend={stats.holding_count_trend}
                trendLabel="前日比"
                variant="accent"
              />
              <StatsCard
                title="利回り"
                tag="Yield"
                value={stats.yield_rate ? `${stats.yield_rate}%` : "-%"}
                trend={stats.yield_rate_trend}
                trendLabel="前日比"
                variant="neutral"
              />
            </>
          ) : (
            <div className="col-span-3 text-center text-gray-500">
              データの取得に失敗しました
            </div>
          )}
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
