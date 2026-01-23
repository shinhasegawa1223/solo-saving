"use client";

import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Footer, Header } from "@/components";
import { formatCurrency } from "@/config";
import {
  type Asset,
  type AssetHistoryData,
  getAsset,
  getAssetHistory,
  refreshAssets,
} from "@/lib/api";

// 簡易版AreaChart（銘柄詳細用）
function SimpleAreaChart({ data }: { data: AssetHistoryData[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        履歴データがありません
      </div>
    );
  }

  const values = data.map((d) => Number(d.value));
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  // Y軸のラベルを生成（5段階）
  const yLabels = [];
  for (let i = 0; i <= 4; i++) {
    const value = minValue + (range * (4 - i)) / 4;
    yLabels.push(Math.round(value));
  }

  // Y軸ラベルのフォーマット（メインチャートと同じ形式）
  const formatYLabel = (value: number): string => {
    if (value >= 10000000) {
      return `¥${(value / 1000000).toFixed(0)}M`;
    }
    if (value >= 1000000) {
      return `¥${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 10000) {
      return `¥${(value / 10000).toFixed(1)}万`;
    }
    return `¥${value.toLocaleString()}`;
  };

  // X軸のラベルを生成（最初、中間、最後）
  const xLabels = [
    data[0]?.date,
    data[Math.floor(data.length / 2)]?.date,
    data[data.length - 1]?.date,
  ];

  return (
    <div className="w-full">
      {/* Y軸ラベル + チャートエリア */}
      <div className="flex">
        {/* Y軸ラベル */}
        <div
          className="flex flex-col justify-between text-xs text-gray-400 pr-3 py-1"
          style={{ height: "280px" }}
        >
          {yLabels.map((label) => (
            <span key={`y-${label}`} className="text-right">
              {formatYLabel(label)}
            </span>
          ))}
        </div>

        {/* チャートエリア */}
        <div className="flex-1" style={{ height: "280px" }}>
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="none"
            role="img"
            aria-label="価格推移チャート"
          >
            <defs>
              <linearGradient
                id="areaGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* グリッド線 */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={`grid-${y}`}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="#334155"
                strokeWidth="0.2"
                strokeDasharray="1"
              />
            ))}

            {/* チャートエリア */}
            <path
              d={`M ${data
                .map((d, i) => {
                  const x = (i / (data.length - 1 || 1)) * 100;
                  const y = 100 - ((Number(d.value) - minValue) / range) * 100;
                  return `${x},${y}`;
                })
                .join(" L ")} L 100,100 L 0,100 Z`}
              fill="url(#areaGradient)"
            />
            <path
              d={`M ${data
                .map((d, i) => {
                  const x = (i / (data.length - 1 || 1)) * 100;
                  const y = 100 - ((Number(d.value) - minValue) / range) * 100;
                  return `${x},${y}`;
                })
                .join(" L ")}`}
              fill="none"
              stroke="#6366f1"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* X軸ラベル */}
      <div className="flex justify-between text-xs text-gray-400 mt-2 ml-12">
        <span>{xLabels[0]}</span>
        <span>{xLabels[1]}</span>
        <span>{xLabels[2]}</span>
      </div>
    </div>
  );
}

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<AssetHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. まず既存データを即時表示
        const [initialAsset, initialHistory] = await Promise.all([
          getAsset(assetId),
          getAssetHistory(assetId, 30),
        ]);
        setAsset(initialAsset);
        setHistory(initialHistory);
        setIsLoading(false);

        // 2. バックグラウンドで市場価格更新
        try {
          await refreshAssets();
          // 3. 更新完了後に再取得
          const [updatedAsset, updatedHistory] = await Promise.all([
            getAsset(assetId),
            getAssetHistory(assetId, 30),
          ]);
          setAsset(updatedAsset);
          setHistory(updatedHistory);
        } catch (e) {
          console.warn("Market update failed:", e);
        }
      } catch (err) {
        console.error("Failed to fetch asset:", err);
        setError("資産情報の取得に失敗しました");
        setIsLoading(false);
      }
    };

    fetchData();
  }, [assetId]);

  // 損益計算
  const calculateProfitLoss = () => {
    if (!asset || !asset.average_cost || !asset.current_value) return null;
    const cost = Number(asset.average_cost) * Number(asset.quantity);
    const profit = Number(asset.current_value) - cost;
    const percentage = (profit / cost) * 100;
    return { profit, percentage };
  };

  const profitLoss = calculateProfitLoss();

  // カテゴリの色を取得
  const getCategoryColor = (categoryId: number) => {
    const colors: Record<number, string> = {
      1: "bg-indigo-500",
      2: "bg-amber-500",
      3: "bg-emerald-500",
      4: "bg-slate-500",
    };
    return colors[categoryId] || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a]">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a]">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-indigo-500 hover:text-indigo-600 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            ダッシュボードに戻る
          </Link>
          <div className="text-center py-16 text-gray-500">
            {error || "資産が見つかりません"}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-300">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* 戻るリンク */}
        <Link
          href="/?scrollTo=holdings"
          className="inline-flex items-center gap-2 text-[#1e3a5f] dark:text-[#c9a227] hover:text-[#2d4a7c] dark:hover:text-[#dab842] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ダッシュボードに戻る
        </Link>

        {/* ヘッダー情報 */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`${getCategoryColor(asset.category_id)} text-white text-xs px-2 py-1 rounded`}
                >
                  {asset.category?.name || "不明"}
                </span>
                {asset.ticker_symbol && (
                  <span className="text-gray-400 text-sm">
                    {asset.ticker_symbol}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {asset.name}
              </h1>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(asset.current_value || 0)}
              </div>
              {profitLoss && (
                <div
                  className={`flex items-center justify-end gap-1 mt-1 ${
                    profitLoss.percentage === 0
                      ? "text-gray-500"
                      : profitLoss.profit >= 0
                        ? "text-emerald-500"
                        : "text-red-500"
                  }`}
                >
                  {profitLoss.percentage !== 0 &&
                    (profitLoss.profit >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    ))}
                  <span className="font-medium">
                    {profitLoss.percentage === 0
                      ? "±0"
                      : `${profitLoss.profit >= 0 ? "+" : ""}${formatCurrency(
                          profitLoss.profit
                        )}`}
                  </span>
                  <span className="text-sm">
                    {profitLoss.percentage === 0
                      ? "-"
                      : `(${profitLoss.percentage >= 0 ? "+" : ""}${profitLoss.percentage.toFixed(2)}%)`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 価格推移チャート */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            価格推移（過去30日）
          </h2>
          <SimpleAreaChart data={history} />
        </div>

        {/* 詳細情報 */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            保有詳細
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                保有数量
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {Number(asset.quantity) % 1 === 0
                  ? `${Math.floor(Number(asset.quantity))} 株`
                  : `${Number(asset.quantity).toFixed(2)} 株`}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                現在価格
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {asset.current_price
                  ? asset.currency === "USD"
                    ? `$${Number(asset.current_price).toFixed(2)}`
                    : `¥${Number(asset.current_price).toLocaleString()}`
                  : "-"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                平均取得単価
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {asset.average_cost
                  ? asset.currency === "USD"
                    ? `$${Number(asset.average_cost).toFixed(2)}`
                    : `¥${Number(asset.average_cost).toLocaleString()}`
                  : "-"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                通貨
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {asset.currency}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
