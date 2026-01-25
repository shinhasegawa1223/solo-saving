"use client";

import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Footer, Header } from "@/components";
import { formatCurrency } from "@/config";
import {
  type Asset,
  getAsset,
  getAssetPriceHistory,
  getAssetTransactions,
  type PriceHistoryData,
  refreshAssets,
  type TransactionData,
} from "@/lib/api";

function EnhancedPriceChart({
  priceData,
  transactions,
  averageCost,
  currency = "JPY",
  isLoading = false,
}: {
  priceData: PriceHistoryData[];
  transactions: TransactionData[];
  averageCost: number | null;
  currency?: string;
  isLoading?: boolean;
}) {
  const [hoveredTransaction, setHoveredTransaction] =
    useState<TransactionData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // 終値を使用してチャートを描画
  const values = priceData.map((d) => Number(d.close));

  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  // Y軸のラベルを生成（5段階）
  const yLabels = [];
  for (let i = 0; i <= 4; i++) {
    const value = minValue + (range * (4 - i)) / 4;
    yLabels.push(value);
  }

  // Y軸ラベルのフォーマット
  const formatYLabel = (value: number): string => {
    const symbol = currency === "USD" ? "$" : "¥";

    if (currency === "USD") {
      return `${symbol}${value.toFixed(2)}`;
    }

    if (value >= 10000000) {
      return `${symbol}${(value / 1000000).toFixed(0)}M`;
    }
    if (value >= 1000000) {
      return `${symbol}${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 10000) {
      return `${symbol}${(value / 10000).toFixed(1)}万`;
    }
    return `${symbol}${Math.round(value).toLocaleString()}`;
  };

  // X軸のラベルを生成（最初、中間、最後）
  const xLabels = [
    priceData[0]?.date,
    priceData[Math.floor(priceData.length / 2)]?.date,
    priceData[priceData.length - 1]?.date,
  ];

  // 購入ポイントの座標を計算
  const getPurchasePointPosition = useCallback(
    (transactionDate: string) => {
      // 日付文字列を YYYY-MM-DD 形式で UTC タイムスタンプに変換して比較
      const toUtcTime = (dateStr: string) => {
        const datePart = dateStr.split("T")[0];
        // YYYY-MM-DD を直接パースすると UTC ミッドナイトになる
        return new Date(datePart).getTime();
      };

      const targetTime = toUtcTime(transactionDate);

      // 最も近い日付のインデックスを探す
      let closestIndex = -1;
      let minDiff = Infinity;

      priceData.forEach((d, idx) => {
        const currentTime = toUtcTime(d.date);
        const diff = Math.abs(currentTime - targetTime);

        // 5日以内の誤差なら許容（土日休み、祝日、データ遅延を考慮して少し広げる）
        if (diff < minDiff && diff <= 5 * 24 * 60 * 60 * 1000) {
          minDiff = diff;
          closestIndex = idx;
        }
      });

      if (closestIndex === -1) return null;

      const x = (closestIndex / (priceData.length - 1 || 1)) * 100;
      const price = priceData[closestIndex].close;
      const y = 100 - ((Number(price) - minValue) / range) * 100;

      return { x, y, price };
    },
    [priceData, minValue, range]
  );

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (priceData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        この期間の価格データがありません
      </div>
    );
  }

  return (
    <div className="w-full relative">
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
        <div className="flex-1 relative" style={{ height: "280px" }}>
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

            {/* 平均取得単価ライン（削除済み） */}

            {/* チャートエリア(Area) */}
            <path
              d={`M ${priceData
                .map((d, i) => {
                  const x = (i / (priceData.length - 1 || 1)) * 100;
                  const y = 100 - ((Number(d.close) - minValue) / range) * 100;
                  return `${x},${y}`;
                })
                .join(" L ")} L 100,100 L 0,100 Z`}
              fill="url(#areaGradient)"
            />

            {/* チャートエリア(Line) */}
            <path
              d={`M ${priceData
                .map((d, i) => {
                  const x = (i / (priceData.length - 1 || 1)) * 100;
                  const y = 100 - ((Number(d.close) - minValue) / range) * 100;
                  return `${x},${y}`;
                })
                .join(" L ")}`}
              fill="none"
              stroke="#6366f1"
              strokeWidth="0.8"
              strokeLinecap="round"
            />

            {/* 購入ポイントマーカー */}
            {(() => {
              // 描画済みのポイントを管理して重なりを防ぐ
              const renderedPoints: { x: number; y: number }[] = [];

              return transactions.map((transaction) => {
                const basePosition = getPurchasePointPosition(transaction.date);
                if (!basePosition) return null;

                let { x, y } = basePosition;

                // 重なりチェックと補正
                // 既存のポイントと重なる場合、位置をずらして再試行
                let retry = 0;
                const threshold = 2.5; // 重なり判定の閾値（%）

                while (retry < 10) {
                  const collision = renderedPoints.find((p) => {
                    const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                    return dist < threshold;
                  });

                  if (!collision) break;

                  // 重なっている場合、上方向に大きくずらし、左右に散らす
                  y -= 2.5;
                  // 奇数回目は右、偶数回目は左
                  x += (retry % 2 === 0 ? 1 : -1) * 1.5;
                  retry++;
                }

                renderedPoints.push({ x, y });

                return (
                  // biome-ignore lint/a11y/noStaticElementInteractions: tooltip interaction only
                  <circle
                    key={`${transaction.date}-${transaction.quantity}-${retry}`}
                    cx={x}
                    cy={y}
                    r={hoveredTransaction === transaction ? "2" : "1.5"}
                    fill="#6366f1"
                    stroke="#fff"
                    strokeWidth="0.5"
                    className="cursor-pointer transition-all hover:r-2"
                    onMouseEnter={(e) => {
                      setHoveredTransaction(transaction);
                      const rect = e.currentTarget.getBoundingClientRect();
                      // ツールチップをマーカーの上に表示
                      setTooltipPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredTransaction(null)}
                  />
                );
              });
            })()}
          </svg>

          {/* ツールチップ */}
          {hoveredTransaction && (
            <div
              className="fixed z-50 bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y - 8}px`,
              }}
            >
              <div className="font-semibold mb-1">購入情報</div>
              <div>日付: {hoveredTransaction.date}</div>
              <div>
                数量:{" "}
                {Number(hoveredTransaction.quantity) % 1 === 0
                  ? Math.floor(Number(hoveredTransaction.quantity))
                  : Number(hoveredTransaction.quantity)}
              </div>
              <div>
                単価: {currency === "USD" ? "$" : "¥"}
                {hoveredTransaction.price.toLocaleString()}
              </div>
              <div>合計: ¥{hoveredTransaction.total_cost.toLocaleString()}</div>
            </div>
          )}
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

// 期間の型定義
type TimePeriod = "7D" | "1M" | "3M" | "1Y";

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("1M");

  // 期間をyfinance形式に変換
  const getPeriodString = useCallback((period: TimePeriod): string => {
    const periodMap: Record<TimePeriod, string> = {
      "7D": "7d",
      "1M": "1mo",
      "3M": "3mo",
      "1Y": "1y",
    };
    return periodMap[period];
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: asset is excluded to avoid infinite loop
  useEffect(() => {
    const fetchData = async () => {
      try {
        const periodString = getPeriodString(timePeriod);

        // 初回ロード時のみ全体のローディング表示
        if (!asset) {
          setIsLoading(true);
        } else {
          // 期間切り替え時はチャートのみローディング
          setIsChartLoading(true);
        }

        // 1. 資産情報、価格履歴、トランザクション履歴を並列取得
        const [initialAsset, initialPriceHistory, initialTransactions] =
          await Promise.all([
            getAsset(assetId),
            getAssetPriceHistory(assetId, periodString),
            getAssetTransactions(assetId),
          ]);
        setAsset(initialAsset);
        setPriceHistory(initialPriceHistory);
        setTransactions(initialTransactions);
        setIsLoading(false);
        setIsChartLoading(false);

        // 2. バックグラウンドで市場価格更新
        try {
          await refreshAssets();
          // 3. 更新完了後に再取得
          const [updatedAsset, updatedPriceHistory] = await Promise.all([
            getAsset(assetId),
            getAssetPriceHistory(assetId, periodString),
          ]);
          setAsset(updatedAsset);
          setPriceHistory(updatedPriceHistory);
        } catch (e) {
          console.warn("Market update failed:", e);
        }
      } catch (err) {
        console.error("Failed to fetch asset:", err);
        setError("資産情報の取得に失敗しました");
        setIsLoading(false);
        setIsChartLoading(false);
      }
    };

    fetchData();
  }, [assetId, timePeriod, getPeriodString]);

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
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#171717]">
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
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#171717]">
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
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#171717] transition-colors duration-300">
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
              {asset.current_price && (
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {asset.currency === "USD"
                    ? `$${Number(asset.current_price).toFixed(2)}`
                    : `¥${Number(asset.current_price).toLocaleString()}`}
                  <span className="text-xs ml-1">/ 株</span>
                </div>
              )}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              価格推移
              {timePeriod === "7D" && "（過去7日）"}
              {timePeriod === "1M" && "（過去30日）"}
              {timePeriod === "3M" && "（過去3ヶ月）"}
              {timePeriod === "1Y" && "（過去1年）"}
            </h2>

            {/* 期間選択ボタン */}
            <div className="flex gap-2">
              {(["7D", "1M", "3M", "1Y"] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setTimePeriod(period)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    timePeriod === period
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <EnhancedPriceChart
            priceData={priceHistory}
            transactions={transactions}
            averageCost={Number(asset.average_cost || 0)}
            currency={asset?.currency}
            isLoading={isChartLoading}
          />
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
