"use client";

import {
  Building2,
  ChevronRight,
  Globe,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AssetBreakdownItem,
  DonutChart,
  PurchaseStockModal,
} from "@/components";
import {
  type Asset,
  getAssets,
  getPortfolio,
  type PortfolioItem,
} from "@/lib/api";

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

// カテゴリカラーのマッピング
const categoryColorMap: Record<number, string> = {
  1: "bg-indigo-500",
  2: "bg-amber-500",
  3: "bg-emerald-500",
  4: "bg-slate-500",
};

interface PortfolioSectionProps {
  initialPortfolio?: PortfolioItem[];
  initialAssets?: Asset[];
  onAssetChange?: () => void;
}

export const PortfolioSection = ({
  initialPortfolio,
  initialAssets,
  onAssetChange,
}: PortfolioSectionProps) => {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(
    initialPortfolio || []
  );
  const [assets, setAssets] = useState<Asset[]>(
    initialAssets ? initialAssets.filter((a) => a.category_id !== 4) : []
  );
  const [isLoading, setIsLoading] = useState(!initialPortfolio);
  const [error, setError] = useState<string | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // initialデータがない場合のみAPIから取得
  useEffect(() => {
    if (initialPortfolio !== undefined) return; // propsで渡された場合はスキップ

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [portfolioData, assetsData] = await Promise.all([
          getPortfolio(),
          getAssets(),
        ]);
        setPortfolio(portfolioData);
        // 現金を除外してソート
        setAssets(assetsData.filter((a) => a.category_id !== 4));
      } catch (err) {
        console.error("Failed to fetch portfolio:", err);
        setError("データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [initialPortfolio]);

  // props が更新されたら state も更新
  useEffect(() => {
    if (initialPortfolio) {
      setPortfolio(initialPortfolio);
    }
    if (initialAssets) {
      setAssets(initialAssets.filter((a) => a.category_id !== 4));
    }
  }, [initialPortfolio, initialAssets]);

  const handlePurchaseSuccess = () => {
    setIsPurchaseModalOpen(false);
    if (onAssetChange) {
      onAssetChange();
    }
    // 従来の router.refresh() も念のため呼ぶ
    router.refresh();
  };

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
    <section className="space-y-6">
      {/* カテゴリ別構成 */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#262626] border border-[#e2e8f0] dark:border-[#404040] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
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
          {/* 銘柄追加ボタン */}
          <button
            type="button"
            onClick={() => setIsPurchaseModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#1e3a5f] to-[#2d4a7c] text-white font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            銘柄を追加
          </button>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* 円グラフ */}
          <div className="w-full lg:w-1/2 h-80">
            <DonutChart
              data={donutData}
              colors={donutColors}
              valueFormatter={(value: number) =>
                `¥${Math.round(value).toLocaleString()}`
              }
              variant="donut"
              label={`¥${Math.round(totalValue).toLocaleString()}`}
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
                value={`¥${Math.round(Number(item.value)).toLocaleString()}`}
                percentage={`${Number(item.percentage).toFixed(1)}%`}
                color={item.color as "indigo" | "amber" | "emerald" | "slate"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 個別銘柄リスト */}
      {assets.length > 0 && (
        <div
          id="holdings"
          className="p-6 rounded-xl bg-white dark:bg-[#262626] border border-[#e2e8f0] dark:border-[#404040] shadow-sm scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#10b981] to-[#059669]" />
            <div>
              <h2 className="text-xl font-bold text-[#1e293b] dark:text-white">
                保有銘柄
              </h2>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                個別銘柄をクリックして詳細を確認
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {assets.map((asset) => (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2 h-10 rounded-full ${categoryColorMap[asset.category_id] || "bg-gray-500"}`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1e293b] dark:text-white">
                        {asset.name}
                      </span>
                      {asset.ticker_symbol && (
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          ({asset.ticker_symbol})
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {Number(asset.quantity) % 1 === 0
                        ? `${Math.floor(Number(asset.quantity))}株`
                        : `${Number(asset.quantity).toFixed(2)}株`}{" "}
                      × {asset.currency === "USD" ? "$" : "¥"}
                      {Number(asset.current_price || 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits:
                            asset.currency === "USD" ? 2 : 0,
                          maximumFractionDigits:
                            asset.currency === "USD" ? 2 : 0,
                        }
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#1e293b] dark:text-white">
                    ¥
                    {Math.round(
                      Number(asset.current_value || 0)
                    ).toLocaleString()}
                  </span>
                  <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-[#6366f1] transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 購入モーダル */}
      <PurchaseStockModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onSuccess={handlePurchaseSuccess}
      />
    </section>
  );
};
