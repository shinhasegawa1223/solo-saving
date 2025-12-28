import appConfigData from "@/config/appConfig.json";
import { formatCurrency } from "@/lib/formatters";

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

// formatCurrency を re-export
export { formatCurrency };

export const formatStatValue = (stat: StatConfig): string => {
  if (stat.unit === "銘柄") {
    return `${stat.value}${stat.unit}`;
  }
  if (stat.unit === "%") {
    return `${stat.value}%`;
  }
  return formatCurrency(stat.value);
};
