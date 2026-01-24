/**
 * Barrel Export パターン（バレルエクスポート）
 *
 * このファイルは「Barrel（樽）」と呼ばれる設計パターンを採用しています。
 *
 * 【なぜこのパターンを使うのか？】
 *
 * 1. インポートの簡略化
 *    - Before: import { Header } from "@/components/Header";
 *              import { Footer } from "@/components/Footer";
 *              import { StatsCard } from "@/components/StatsCard";
 *    - After:  import { Header, Footer, StatsCard } from "@/components";
 *
 * 2. リファクタリングの容易さ
 *    - コンポーネントのファイル構造を変更しても、このファイルだけ修正すれば
 *      他のファイルのインポートパスを変更する必要がない
 *
 * 3. 公開APIの明確化
 *    - このファイルにexportされているものだけが「公開コンポーネント」として扱われる
 *    - 内部でしか使わないヘルパーコンポーネントは非公開にできる
 *
 * 4. 一貫性のあるコード規約
 *    - チーム全体で統一されたインポート方法を採用できる
 *
 * 参考: https://basarat.gitbook.io/typescript/main-1/barrel
 */

// UI Components
export { AreaChart } from "./AreaChart";
export { AssetBreakdownItem } from "./AssetBreakdownItem";
export { AssetTrendsSection } from "./AssetTrendsSection";
export { CashManagementModal } from "./CashManagementModal";
export { CustomDatePicker } from "./CustomDatePicker";
export { DonutChart } from "./DonutChart";
export { Footer } from "./Footer";
// Layout Components
export { Header } from "./Header";
export { PortfolioSection } from "./PortfolioSection";
export { ProgressBar } from "./ProgressBar";
export { ProgressBarHero } from "./ProgressBarHero";
export { PurchaseStockModal } from "./PurchaseStockModal";
export { StatsCard } from "./StatsCard";
// Theme Components
export { ThemeProvider } from "./ThemeProvider";
export { ThemeToggle } from "./ThemeToggle";
