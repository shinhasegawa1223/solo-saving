"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  AssetTrendsSection,
  Footer,
  Header,
  PortfolioSection,
  ProgressBarHero,
  StatsCard,
} from "@/components";
import { formatCurrency } from "@/config";
import { type DashboardAllData, getDashboardAllData } from "@/lib/api";

// スクロール処理を担当するコンポーネント
function ScrollHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const scrollTo = searchParams.get("scrollTo");
    if (scrollTo) {
      // データロード後にスクロール
      const timer = setTimeout(() => {
        const el = document.getElementById(scrollTo);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // パラメータがない場合はページトップへ
      window.scrollTo(0, 0);
    }
  }, [searchParams]);

  return null;
}

// ダッシュボードコンテンツ
function DashboardContent() {
  const [data, setData] = useState<DashboardAllData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 全データを並列取得
        const allData = await getDashboardAllData("month");
        setData(allData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // 全体ローディング状態
  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* 統計カードスケルトン */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 rounded-xl bg-white dark:bg-[#1e293b] animate-pulse" />
          <div className="h-32 rounded-xl bg-white dark:bg-[#1e293b] animate-pulse" />
          <div className="h-32 rounded-xl bg-white dark:bg-[#1e293b] animate-pulse" />
        </section>
        {/* プログレスバースケルトン */}
        <div className="h-48 rounded-2xl bg-white dark:bg-[#1e293b] animate-pulse" />
        {/* チャートスケルトン */}
        <div className="h-96 rounded-2xl bg-white dark:bg-[#1e293b] animate-pulse" />
        {/* ポートフォリオスケルトン */}
        <div className="h-80 rounded-2xl bg-white dark:bg-[#1e293b] animate-pulse" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center text-gray-500 py-16">
          データの取得に失敗しました
        </div>
      </main>
    );
  }

  const { stats, chartData, portfolio, assets, goals } = data;

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* 統計カード */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </section>

      {/* 目標設定プログレス */}
      <ProgressBarHero initialGoal={goals[0] || null} />

      {/* チャートセクション */}
      <AssetTrendsSection initialData={chartData} />

      {/* ポートフォリオ構成（円グラフ） */}
      <PortfolioSection initialPortfolio={portfolio} initialAssets={assets} />
    </main>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-300">
      <Header />

      {/* Suspense境界でuseSearchParamsをラップ */}
      <Suspense fallback={null}>
        <ScrollHandler />
      </Suspense>

      <DashboardContent />

      <Footer />
    </div>
  );
}
