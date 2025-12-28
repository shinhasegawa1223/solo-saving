/**
 * 共通の型定義とカラー設定
 */

/** チャートで使用可能な色名 */
export type ChartColor =
  | "indigo"
  | "amber"
  | "emerald"
  | "slate"
  | "cyan"
  | "violet"
  | "rose"
  | "blue";

/** 資産カテゴリ */
export type AssetCategory = "日本株" | "米国株" | "投資信託" | "現金" | "合計";

/** チャートカラーの16進数マッピング */
export const chartColorMap: Record<ChartColor, string> = {
  indigo: "#6366f1",
  amber: "#f59e0b",
  emerald: "#10b981",
  slate: "#64748b",
  cyan: "#06b6d4",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  blue: "#3b82f6",
} as const;

/** カテゴリごとのカラー設定 */
export const categoryColors: Record<
  AssetCategory,
  { color: ChartColor; bgColor: string; borderColor: string }
> = {
  合計: {
    color: "cyan",
    bgColor: "bg-cyan-500",
    borderColor: "border-cyan-500",
  },
  日本株: {
    color: "indigo",
    bgColor: "bg-indigo-500",
    borderColor: "border-indigo-500",
  },
  米国株: {
    color: "amber",
    bgColor: "bg-amber-500",
    borderColor: "border-amber-500",
  },
  投資信託: {
    color: "emerald",
    bgColor: "bg-emerald-500",
    borderColor: "border-emerald-500",
  },
  現金: {
    color: "slate",
    bgColor: "bg-slate-500",
    borderColor: "border-slate-500",
  },
} as const;
