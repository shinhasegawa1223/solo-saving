"use client";

import { Building2, Globe, TrendingUp, Wallet } from "lucide-react";
import { AssetBreakdownItem, DonutChart } from "@/components";

export const PortfolioSection = () => {
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
          <AssetBreakdownItem
            icon={<Building2 className="w-5 h-5" />}
            title="日本株"
            subtitle="国内株式"
            value="¥1,350,000"
            percentage="29.3%"
            color="indigo"
          />
          <AssetBreakdownItem
            icon={<Globe className="w-5 h-5" />}
            title="米国株"
            subtitle="米国株式"
            value="¥1,600,000"
            percentage="34.7%"
            color="amber"
          />
          <AssetBreakdownItem
            icon={<TrendingUp className="w-5 h-5" />}
            title="投資信託"
            subtitle="ファンド"
            value="¥1,050,000"
            percentage="22.8%"
            color="emerald"
          />
          <AssetBreakdownItem
            icon={<Wallet className="w-5 h-5" />}
            title="現金"
            subtitle="預金・現金"
            value="¥610,000"
            percentage="13.2%"
            color="slate"
          />
        </div>
      </div>
    </section>
  );
};
