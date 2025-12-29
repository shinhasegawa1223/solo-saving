/**
 * カテゴリ設定
 * チャートやバッジの色分けに使用
 */
export const categoryConfig = {
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

export type CategoryKey = keyof typeof categoryConfig;
