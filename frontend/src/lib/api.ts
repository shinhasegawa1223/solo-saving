/**
 * API クライアント
 *
 * バックエンド API との通信を行うためのユーティリティ関数
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * API リクエストの基本関数
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// 型定義
// ============================================

/** チャートデータ */
export interface ChartData {
  date: string;
  日本株: number;
  米国株: number;
  投資信託: number;
  現金: number;
  合計: number;
  [key: string]: string | number; // インデックスシグネチャ（AreaChart 対応）
}

/** ポートフォリオアイテム */
export interface PortfolioItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
  icon: string | null;
}

/** ダッシュボード統計 */
export interface DashboardStats {
  total_assets: number;
  total_assets_trend: string;
  holding_count: number;
  holding_count_trend: string;
  yield_rate: number | null;
  yield_rate_trend: string;
}

/** 貯金目標 */
export interface SavingsGoal {
  id: string;
  label: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** スナップショット */
export interface AssetSnapshot {
  id: string;
  snapshot_date: string;
  total_assets: number;
  japanese_stocks: number;
  us_stocks: number;
  investment_trusts: number;
  cash: number;
  holding_count: number;
  yield_rate: number | null;
  created_at: string;
}

// ============================================
// API 関数
// ============================================

/**
 * チャートデータを取得
 * @param period - 集計期間 (day, month, year)
 */
export async function getChartData(
  period: "day" | "month" | "year" = "month"
): Promise<ChartData[]> {
  const data = await fetchApi<ChartData[]>(
    `/api/snapshots/chart?period=${period}`
  );
  // 合計を追加（API からは含まれない場合があるため）
  return data.map((item) => ({
    ...item,
    合計: item.合計 || item.日本株 + item.米国株 + item.投資信託 + item.現金,
  }));
}

/**
 * ポートフォリオ構成を取得
 */
export async function getPortfolio(): Promise<PortfolioItem[]> {
  return fetchApi<PortfolioItem[]>("/api/dashboard/portfolio");
}

/**
 * ダッシュボード統計を取得
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchApi<DashboardStats>("/api/dashboard/stats");
}

/**
 * 貯金目標一覧を取得
 * @param activeOnly - アクティブな目標のみ取得
 */
export async function getGoals(activeOnly = true): Promise<SavingsGoal[]> {
  return fetchApi<SavingsGoal[]>(`/api/goals?active_only=${activeOnly}`);
}

/**
 * 貯金目標を更新
 */
export async function updateGoal(
  goalId: string,
  data: Partial<
    Pick<
      SavingsGoal,
      "label" | "target_amount" | "current_amount" | "target_date" | "is_active"
    >
  >
): Promise<SavingsGoal> {
  return fetchApi<SavingsGoal>(`/api/goals/${goalId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * 最新スナップショットを取得
 */
export async function getLatestSnapshot(): Promise<AssetSnapshot | null> {
  return fetchApi<AssetSnapshot | null>("/api/snapshots/latest");
}
