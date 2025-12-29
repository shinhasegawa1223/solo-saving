"use client";

import { Building2, Globe, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { AssetBreakdownItem, DonutChart } from "@/components";
import { getPortfolio, type PortfolioItem } from "@/lib/api";

// アイコンのマッピング
const iconMap: Record<string, React.ReactNode> = {
  Building2: <Building2 className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  Wallet: <Wallet className="w-5 h-5" />,
};

// サブタイトルのマッピング
const subtitleMap: Record<string, string> = {
  日本株: "国内株式",
  米国株: "米国株式",
  投資信託: "ファンド",
  現金: "預金・現金",
};

export const PortfolioSection = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPortfolio();
        setPortfolio(data);
      } catch (err) {
        console.error("Failed to fetch portfolio:", err);
        setError("データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 総資産額を計算
  const totalValue = portfolio.reduce(
    (sum, item) => sum + Number(item.value),
    0
  );

  // ドーナツチャート用データ
  const donutData = portfolio.map((item) => ({
    name: item.name,
    value: Number(item.value),
  }));

  // ドーナツチャート用カラー
  const donutColors = portfolio.map((item) => item.color);

  if (isLoading) {
    return (
      <section className="p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] shadow-lg">
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] dark:border-[#c9a227]" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] shadow-lg">
        <div className="h-80 flex items-center justify-center text-red-500">
          {error}
        </div>
      </section>
    );
  }

  return (
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
            data={donutData}
            colors={donutColors}
            valueFormatter={(value: number) => `¥${value.toLocaleString()}`}
            variant="donut"
            label={`¥${totalValue.toLocaleString()}`}
          />
        </div>

        {/* 詳細情報 */}
        <div className="w-full lg:w-1/2 space-y-4">
          {portfolio.map((item) => (
            <AssetBreakdownItem
              key={item.name}
              icon={
                iconMap[item.icon || ""] || <Building2 className="w-5 h-5" />
              }
              title={item.name}
              subtitle={subtitleMap[item.name] || item.name}
              value={`¥${Number(item.value).toLocaleString()}`}
              percentage={`${Number(item.percentage).toFixed(1)}%`}
              color={item.color as "indigo" | "amber" | "emerald" | "slate"}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
