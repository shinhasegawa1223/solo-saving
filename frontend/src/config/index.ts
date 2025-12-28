import appConfigData from "@/config/appConfig.json";

// 型定義
export interface AppConfig {
  app: {
    name: string;
    version: string;
    year: number;
  };
  savingsGoal: {
    targetAmount: number;
    currentAmount: number;
    label: string;
  };
  dashboard: {
    stats: {
      totalAssets: StatConfig;
      holdings: StatConfig;
      yield: StatConfig;
    };
  };
}

export interface StatConfig {
  title: string;
  tag: string;
  value: number;
  unit?: string;
  trend: string;
  trendLabel: string;
  variant: "primary" | "accent" | "neutral";
}

// 型付きでエクスポート
export const appConfig: AppConfig = appConfigData as AppConfig;

// 便利なヘルパー関数
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatStatValue = (stat: StatConfig): string => {
  if (stat.unit === "銘柄") {
    return `${stat.value}${stat.unit}`;
  }
  if (stat.unit === "%") {
    return `${stat.value}%`;
  }
  return formatCurrency(stat.value);
};
