"use client";

import { Search, X } from "lucide-react";
import { useCallback, useState } from "react";
import { CustomDatePicker } from "@/components";

interface PurchaseStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// カテゴリID: 1=日本株, 2=米国株, 3=投資信託
const CATEGORY_OPTIONS = [
  { id: 1, name: "日本株", icon: "🇯🇵" },
  { id: 2, name: "米国株", icon: "🇺🇸" },
  { id: 3, name: "投資信託", icon: "📊" },
];

export const PurchaseStockModal = ({
  isOpen,
  onClose,
  onSuccess,
}: PurchaseStockModalProps) => {
  const [categoryId, setCategoryId] = useState<number>(1);
  const [tickerSymbol, setTickerSymbol] = useState("");
  const [stockName, setStockName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [usdJpyRate, setUsdJpyRate] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 検索実行
  const handleSearch = useCallback(async () => {
    if (!tickerSymbol.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setStockName("");

    try {
      const market = categoryId === 1 ? "jp" : categoryId === 2 ? "us" : "auto";
      const response = await fetch(
        `${API_BASE_URL}/api/stocks/search?symbol=${encodeURIComponent(tickerSymbol)}&market=${market}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setStockName(data.data.name);
        if (data.data.current_price) {
          setPurchasePrice(data.data.current_price.toString());
        }
        // 市場に応じてカテゴリを自動設定
        if (data.data.market === "JP" && categoryId !== 1) {
          setCategoryId(1);
        } else if (data.data.market === "US" && categoryId !== 2) {
          setCategoryId(2);
        }
      } else {
        setSearchError(data.error || "銘柄が見つかりません");
      }
    } catch (_error) {
      setSearchError("検索エラーが発生しました");
    } finally {
      setIsSearching(false);
    }
  }, [tickerSymbol, categoryId]);

  // 購入実行
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockName || !quantity || !purchasePrice) return;

    // 米国株の場合はドル円レートが必須
    if (categoryId === 2 && !usdJpyRate) {
      setSubmitError("米国株の場合はドル円レートを入力してください");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          ticker_symbol: tickerSymbol.toUpperCase(),
          name: stockName,
          quantity: Number.parseFloat(quantity),
          purchase_price: Number.parseFloat(purchasePrice),
          currency: categoryId === 2 ? "USD" : "JPY",
          usd_jpy_rate: categoryId === 2 ? Number.parseFloat(usdJpyRate) : null,
          purchase_date: purchaseDate,
        }),
      });

      if (!response.ok) {
        throw new Error("購入処理に失敗しました");
      }

      onSuccess();
      handleClose();
    } catch (_error) {
      setSubmitError("購入処理中にエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // モーダルを閉じる
  const handleClose = () => {
    setTickerSymbol("");
    setStockName("");
    setQuantity("");
    setPurchasePrice("");
    setUsdJpyRate("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setSearchError(null);
    setSubmitError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm w-full h-full cursor-default transition-opacity"
        onClick={handleClose}
        aria-label="Close modal"
      />

      {/* モーダル本体 */}
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-[#171717] rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              銘柄を購入
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              ポートフォリオに新しい資産を追加します
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* フォーム - スクロール可能エリア */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* カテゴリ選択 */}
            <div>
              <div className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                カテゴリ
              </div>
              <div className="grid grid-cols-3 gap-3">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-3 rounded-lg text-center transition-all border ${
                      categoryId === cat.id
                        ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white shadow-md"
                        : "bg-white dark:bg-[#262626] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span className="text-xl mb-1 block">{cat.icon}</span>
                    <span className="text-xs font-medium">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* シンボル検索 */}
            <div>
              <label
                htmlFor="ticker-symbol"
                className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2"
              >
                ティッカーシンボル / 証券コード
              </label>
              <div className="flex gap-2">
                <input
                  id="ticker-symbol"
                  type="text"
                  value={tickerSymbol}
                  onChange={(e) =>
                    setTickerSymbol(e.target.value.toUpperCase())
                  }
                  placeholder={categoryId === 1 ? "7203" : "AAPL"}
                  className="flex-1 px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#262626] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching || !tickerSymbol.trim()}
                  className="px-4 py-3 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center min-w-[3rem]"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white/30 dark:border-neutral-900/30 border-t-white dark:border-t-neutral-900 rounded-full animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>
              {searchError && (
                <p className="mt-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">
                  {searchError}
                </p>
              )}
            </div>

            {/* 銘柄名 */}
            <div>
              <label
                htmlFor="stock-name"
                className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2"
              >
                銘柄名
              </label>
              <input
                id="stock-name"
                type="text"
                value={stockName}
                onChange={(e) => setStockName(e.target.value)}
                placeholder="検索結果が表示されます"
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#262626] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
              />
            </div>

            {/* 購入日 - カスタムカレンダー */}
            <div>
              <label
                htmlFor="purchase-date"
                className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2"
              >
                購入日
              </label>
              <CustomDatePicker
                value={purchaseDate}
                onChange={setPurchaseDate}
                maxDate={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* 金額入力エリア - グリッドレイアウトで高さを安定化 */}
            <div className="bg-neutral-50 dark:bg-[#262626] rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
              <div className="grid grid-cols-2 gap-4">
                {/* 数量 */}
                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5"
                  >
                    購入数量
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-[#171717] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                  />
                </div>

                {/* 単価 */}
                <div>
                  <label
                    htmlFor="purchase-price"
                    className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5"
                  >
                    単価 {categoryId === 2 ? "(USD)" : "(JPY)"}
                  </label>
                  <input
                    id="purchase-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-[#171717] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                  />
                </div>

                {/* 為替レート (常時表示し、不要時はDisabledにする) */}
                <div className="col-span-2 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-700">
                  <label
                    htmlFor="usd-jpy-rate"
                    className={`flex items-center text-xs font-medium mb-1.5 transition-colors ${
                      categoryId === 2
                        ? "text-neutral-500 dark:text-neutral-400"
                        : "text-neutral-400 dark:text-neutral-600"
                    }`}
                  >
                    為替レート (USD/JPY)
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold transition-opacity ${
                        categoryId === 2 ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      必須
                    </span>
                  </label>
                  <div className="relative">
                    <span
                      className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs transition-colors ${
                        categoryId === 2
                          ? "text-neutral-400"
                          : "text-neutral-300 dark:text-neutral-600"
                      }`}
                    >
                      1ドル =
                    </span>
                    <input
                      id="usd-jpy-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={usdJpyRate}
                      onChange={(e) => setUsdJpyRate(e.target.value)}
                      placeholder={categoryId === 2 ? "150.00" : "-"}
                      disabled={categoryId !== 2}
                      className={`w-full pl-16 pr-3 py-2 rounded-lg border transition-all ${
                        categoryId === 2
                          ? "border-neutral-200 dark:border-neutral-600 bg-white dark:bg-[#171717] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                          : "border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
                      }`}
                    />
                    <span
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors ${
                        categoryId === 2
                          ? "text-neutral-400"
                          : "text-neutral-300 dark:text-neutral-600"
                      }`}
                    >
                      円
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {submitError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg text-center">
                {submitError}
              </p>
            )}

            {/* 購入ボタン */}
            <button
              type="submit"
              disabled={
                isSubmitting || !stockName || !quantity || !purchasePrice
              }
              className="w-full py-3.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-neutral-900/10"
            >
              {isSubmitting ? "処理中..." : "ポートフォリオに追加"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
