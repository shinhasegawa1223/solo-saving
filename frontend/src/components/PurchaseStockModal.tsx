"use client";

import { Search, X } from "lucide-react";
import { useCallback, useState } from "react";

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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm w-full h-full cursor-default"
        onClick={handleClose}
        aria-label="Close modal"
      />

      {/* モーダル本体 */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e2e8f0] dark:border-[#334155]">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-[#e2e8f0] dark:border-[#334155]">
          <h2 className="text-xl font-bold text-[#1e293b] dark:text-white">
            銘柄を購入
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#334155] transition-colors"
          >
            <X className="w-5 h-5 text-[#64748b]" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* カテゴリ選択 */}
          <div>
            <div className="block text-sm font-medium text-[#64748b] dark:text-[#94a3b8] mb-2">
              カテゴリ
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    categoryId === cat.id
                      ? "bg-[#1e3a5f] text-white"
                      : "bg-[#f8fafc] dark:bg-[#0f172a] text-[#1e293b] dark:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b]"
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="block text-xs mt-1">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* シンボル検索 */}
          <div>
            <label
              htmlFor="ticker-symbol"
              className="block text-sm font-medium text-[#64748b] dark:text-[#94a3b8] mb-2"
            >
              ティッカーシンボル
              <span className="text-xs ml-2 text-[#94a3b8]">
                {categoryId === 1 ? "(例: 7203)" : "(例: AAPL)"}
              </span>
            </label>
            <div className="flex gap-2">
              <input
                id="ticker-symbol"
                type="text"
                value={tickerSymbol}
                onChange={(e) => setTickerSymbol(e.target.value.toUpperCase())}
                placeholder={categoryId === 1 ? "証券コード" : "ティッカー"}
                className="flex-1 px-4 py-3 rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] text-[#1e293b] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching || !tickerSymbol.trim()}
                className="px-4 py-3 rounded-xl bg-[#1e3a5f] text-white hover:bg-[#2d4a7c] disabled:opacity-50 transition-colors"
              >
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </div>
            {searchError && (
              <p className="mt-2 text-sm text-red-500">{searchError}</p>
            )}
          </div>

          {/* 銘柄名 */}
          <div>
            <label
              htmlFor="stock-name"
              className="block text-sm font-medium text-[#64748b] dark:text-[#94a3b8] mb-2"
            >
              銘柄名
            </label>
            <input
              id="stock-name"
              type="text"
              value={stockName}
              onChange={(e) => setStockName(e.target.value)}
              placeholder="検索結果が表示されます"
              className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] text-[#1e293b] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>

          {/* 購入日 */}
          <div>
            <label
              htmlFor="purchase-date"
              className="block text-sm font-medium text-[#64748b] dark:text-[#94a3b8] mb-2"
            >
              購入日
            </label>
            <input
              id="purchase-date"
              type="date"
              value={purchaseDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] text-[#1e293b] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>

          {/* 購入数量・単価 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-[#64748b] dark:text-[#94a3b8] mb-2"
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
                placeholder="100"
                className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] text-[#1e293b] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
            </div>
            <div>
              <label
                htmlFor="purchase-price"
                className="block text-sm font-medium text-[#64748b] dark:text-[#94a3b8] mb-2"
              >
                購入単価 {categoryId === 2 ? "(USD)" : "(JPY)"}
              </label>
              <input
                id="purchase-price"
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder={categoryId === 2 ? "150.00" : "2500"}
                className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] text-[#1e293b] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
            </div>
          </div>

          {/* ドル円レート（米国株のみ） */}
          {categoryId === 2 && (
            <div>
              <label
                htmlFor="usd-jpy-rate"
                className="block text-sm font-medium text-[#64748b] dark:text-[#94a3b8] mb-2"
              >
                ドル円レート（購入時）
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]">
                  ¥
                </span>
                <input
                  id="usd-jpy-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={usdJpyRate}
                  onChange={(e) => setUsdJpyRate(e.target.value)}
                  placeholder="150.25"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] text-[#1e293b] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>
            </div>
          )}

          {submitError && (
            <p className="text-sm text-red-500 text-center">{submitError}</p>
          )}

          {/* 購入ボタン */}
          <button
            type="submit"
            disabled={isSubmitting || !stockName || !quantity || !purchasePrice}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#1e3a5f] to-[#2d4a7c] text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? "購入処理中..." : "購入する"}
          </button>
        </form>
      </div>
    </div>
  );
};
