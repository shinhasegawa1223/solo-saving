"use client";

import { ArrowDownCircle, ArrowUpCircle, X } from "lucide-react";
import { useState } from "react";
import { depositCash, withdrawCash } from "@/lib/api";

interface CashManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance?: number;
}

export const CashManagementModal = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance = 0,
}: CashManagementModalProps) => {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const numericAmount = Number(amount.replace(/,/g, ""));
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError("有効な金額を入力してください");
      setIsSubmitting(false);
      return;
    }

    if (activeTab === "withdraw" && numericAmount > currentBalance) {
      setError("残高不足です");
      setIsSubmitting(false);
      return;
    }

    try {
      if (activeTab === "deposit") {
        await depositCash(numericAmount, "Manual deposit");
      } else {
        await withdrawCash(numericAmount, "Manual withdraw");
      }
      onSuccess();
      onClose();
      setAmount("");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "処理に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e2e8f0] dark:border-[#334155] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0] dark:border-[#334155]">
          <h2 className="text-lg font-bold text-[#1e293b] dark:text-white">
            現金管理
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-[#64748b] dark:text-[#94a3b8]" />
          </button>
        </div>

        {/* タブ切り替え */}
        <div className="flex p-2 gap-2 bg-[#f8fafc] dark:bg-[#0f172a]">
          <button
            type="button"
            onClick={() => setActiveTab("deposit")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "deposit"
                ? "bg-white dark:bg-[#1e293b] text-[#1e3a5f] dark:text-[#c9a227] shadow-sm"
                : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#1e3a5f] dark:hover:text-white"
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            入金
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("withdraw")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "withdraw"
                ? "bg-white dark:bg-[#1e293b] text-[#1e3a5f] dark:text-[#c9a227] shadow-sm"
                : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#1e3a5f] dark:hover:text-white"
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            出金
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a]">
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mb-1">
                現在の現金残高
              </p>
              <p className="text-xl font-bold text-[#1e293b] dark:text-white">
                ¥{Math.floor(currentBalance).toLocaleString()}
              </p>
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-[#64748b] dark:text-[#94a3b8] mb-1.5"
              >
                {activeTab === "deposit" ? "入金額" : "出金額"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] dark:text-[#94a3b8]">
                  ¥
                </span>
                <input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setAmount(val ? Number(val).toLocaleString() : "");
                  }}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-white placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] dark:focus:ring-[#c9a227] transition-all"
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-[#64748b] dark:text-[#94a3b8] bg-[#f1f5f9] dark:bg-[#1e293b] hover:bg-[#e2e8f0] dark:hover:bg-[#334155] transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg shadow-[#1e3a5f]/20 transition-all ${
                isSubmitting
                  ? "opacity-50 cursor-not-allowed bg-gray-500"
                  : activeTab === "deposit"
                    ? "bg-gradient-to-r from-[#1e3a5f] to-[#2d4a7c] hover:opacity-90"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:opacity-90"
              }`}
            >
              {isSubmitting
                ? "処理中..."
                : activeTab === "deposit"
                  ? "入金する"
                  : "出金する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
