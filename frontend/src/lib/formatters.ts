/**
 * 通貨フォーマット関連のユーティリティ関数
 */

/**
 * 金額を日本円形式でフォーマット
 * @example formatCurrency(1000000) => "¥1,000,000"
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * 金額を省略形式でフォーマット（億・万単位）
 * @example formatShortCurrency(100000000) => "1.0億円"
 * @example formatShortCurrency(10000000) => "1000万円"
 */
export const formatShortCurrency = (value: number): string => {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}億円`;
  }
  if (value >= 10000) {
    return `${Math.floor(value / 10000)}万円`;
  }
  return `${value}円`;
};

/**
 * チャート用の金額フォーマット（M/K単位）
 * @example formatChartValue(1000000) => "¥1.0M"
 * @example formatChartValue(1000) => "¥1K"
 */
export const formatChartValue = (value: number): string => {
  if (value >= 1000000) {
    return `¥${(value / 1000000).toFixed(1)}M`;
  }
  return `¥${(value / 1000).toFixed(0)}K`;
};
