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
    cache: "no-store",
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
  total_assets_diff: string; // "+¥123,000"
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
 * 貯金目標を作成
 */
export async function createGoal(
  data: Pick<SavingsGoal, "label" | "target_amount" | "current_amount">
): Promise<SavingsGoal> {
  return fetchApi<SavingsGoal>("/api/goals", {
    method: "POST",
    body: JSON.stringify(data),
  });
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

/** ダッシュボード全データ */
export interface DashboardAllData {
  stats: DashboardStats;
  chartData: ChartData[];
  portfolio: PortfolioItem[];
  assets: Asset[];
  goals: SavingsGoal[];
}

/**
 * ダッシュボードの全データを並列取得
 * @param chartPeriod - チャートの集計期間
 */
export async function getDashboardAllData(
  chartPeriod: "day" | "month" | "year" = "month"
): Promise<DashboardAllData> {
  const [stats, chartData, portfolio, assets, goals] = await Promise.all([
    getDashboardStats(),
    getChartData(chartPeriod),
    getPortfolio(),
    getAssets(),
    getGoals(true),
  ]);

  return { stats, chartData, portfolio, assets, goals };
}

// ============================================
// 資産（銘柄）関連
// ============================================

/** 資産カテゴリ */
export interface AssetCategory {
  id: number;
  name: string;
  name_en: string;
  color: string;
  icon: string | null;
}

/** 資産（銘柄） */
export interface Asset {
  id: string;
  category_id: number;
  name: string;
  ticker_symbol: string | null;
  quantity: number;
  average_cost: number | null;
  current_price: number | null;
  current_value: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
  category: AssetCategory | null;
}

/** 資産履歴（チャート用） */
export interface AssetHistoryData {
  date: string;
  price: number | null;
  value: number;
}

/**
 * 資産一覧を取得
 * @param categoryId - カテゴリIDで絞り込み（オプション）
 */
export async function getAssets(categoryId?: number): Promise<Asset[]> {
  const params = categoryId ? `?category_id=${categoryId}` : "";
  return fetchApi<Asset[]>(`/api/assets${params}`);
}

/**
 * 個別資産を取得
 * @param assetId - 資産ID
 */
export async function getAsset(assetId: string): Promise<Asset> {
  return fetchApi<Asset>(`/api/assets/${assetId}`);
}

/**
 * 資産の価格履歴を取得
 * @param assetId - 資産ID
 * @param days - 取得日数（デフォルト30日）
 */
export async function getAssetHistory(
  assetId: string,
  days = 30
): Promise<AssetHistoryData[]> {
  return fetchApi<AssetHistoryData[]>(
    `/api/assets/${assetId}/history?days=${days}`
  );
}

/**
 * 資産価格を更新（最新の市場価格を取得）
 */
export async function refreshAssets(): Promise<{
  message: string;
  updated_count: number;
  usd_jpy_rate: number;
}> {
  return fetchApi("/api/assets/refresh", {
    method: "POST",
  });
}

// ============================================
// 現金管理関連
// ============================================

/** 現金入出金リクエスト */
export interface CashTransactionRequest {
  amount: number;
  transaction_type: "deposit" | "withdraw";
  note?: string;
}

/**
 * 現金を入金
 * @param amount - 金額
 * @param note - メモ（任意）
 */
export async function depositCash(
  amount: number,
  note?: string
): Promise<Asset> {
  return fetchApi<Asset>("/api/cash/transaction", {
    method: "POST",
    body: JSON.stringify({
      amount,
      transaction_type: "deposit",
      note,
    } as CashTransactionRequest),
  });
}

/**
 * 現金を出金
 * @param amount - 金額
 * @param note - メモ（任意）
 */
export async function withdrawCash(
  amount: number,
  note?: string
): Promise<Asset> {
  return fetchApi<Asset>("/api/cash/transaction", {
    method: "POST",
    body: JSON.stringify({
      amount,
      transaction_type: "withdraw",
      note,
    } as CashTransactionRequest),
  });
}

/**
 * 現金残高を取得
 */
export async function getCashBalance(): Promise<{
  balance: number;
  currency: string;
}> {
  return fetchApi<{ balance: number; currency: string }>("/api/cash/balance");
}

// ============================================
// 価格履歴・トランザクション関連 (yfinance)
// ============================================

/** 価格履歴データ（yfinanceから取得） */
export interface PriceHistoryData {
  date: string; // YYYY-MM-DD format
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** トランザクション（購入履歴）データ */
export interface TransactionData {
  date: string; // YYYY-MM-DD format
  quantity: number;
  price: number; // Purchase price per unit
  usd_jpy_rate: number | null; // Exchange rate if USD asset
  total_cost: number; // Total cost in JPY
}

/**
 * yfinanceから資産の価格履歴を取得
 * @param assetId - 資産ID
 * @param period - 取得期間 (7d, 1mo, 3mo, 1y, max)
 */
export async function getAssetPriceHistory(
  assetId: string,
  period: string = "1mo"
): Promise<PriceHistoryData[]> {
  return fetchApi<PriceHistoryData[]>(
    `/api/assets/${assetId}/price-history?period=${period}`
  );
}

/**
 * 資産の購入履歴（トランザクション）を取得
 * @param assetId - 資産ID
 */
export async function getAssetTransactions(
  assetId: string
): Promise<TransactionData[]> {
  return fetchApi<TransactionData[]>(`/api/assets/${assetId}/transactions`);
}
