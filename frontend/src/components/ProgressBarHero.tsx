"use client";

import { useEffect, useState } from "react";
import { ProgressBar } from "@/components";
import { appConfig } from "@/config";
import { getGoals, type SavingsGoal, updateGoal } from "@/lib/api";
import { formatCurrency, formatShortCurrency } from "@/lib/formatters";

interface ProgressBarHeroProps {
  className?: string;
}

export const ProgressBarHero = ({ className }: ProgressBarHeroProps) => {
  const [goal, setGoal] = useState<SavingsGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTarget, setEditTarget] = useState("");
  const [editCurrent, setEditCurrent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // フォールバック値（API がエラーの場合に使用）
  const fallbackTarget = appConfig.savingsGoal.targetAmount;
  const fallbackCurrent = appConfig.savingsGoal.currentAmount;
  const fallbackLabel = appConfig.savingsGoal.label;

  // 表示用の値
  const target = goal ? Number(goal.target_amount) : fallbackTarget;
  const current = goal ? Number(goal.current_amount) : fallbackCurrent;
  const targetLabel = goal ? goal.label : fallbackLabel;

  useEffect(() => {
    const fetchGoals = async () => {
      setIsLoading(true);
      try {
        const goals = await getGoals(true);
        if (goals.length > 0) {
          setGoal(goals[0]);
          setEditTarget(goals[0].target_amount.toString());
          setEditCurrent(goals[0].current_amount.toString());
        }
      } catch (err) {
        console.error("Failed to fetch goals:", err);
        // フォールバック値を使用
        setEditTarget(fallbackTarget.toString());
        setEditCurrent(fallbackCurrent.toString());
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, [fallbackTarget, fallbackCurrent]);

  const percentage = target > 0 ? (current / target) * 100 : 0;
  const remaining = Math.max(target - current, 0);

  const handleSave = async () => {
    const newTarget = Number.parseInt(editTarget.replace(/,/g, ""), 10);
    const newCurrent = Number.parseInt(editCurrent.replace(/,/g, ""), 10);

    if (Number.isNaN(newTarget) || newTarget <= 0) return;
    if (Number.isNaN(newCurrent) || newCurrent < 0) return;

    setIsSaving(true);
    try {
      if (goal) {
        const updated = await updateGoal(goal.id, {
          target_amount: newTarget,
          current_amount: newCurrent,
        });
        setGoal(updated);
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update goal:", err);
      // ローカルで更新（オフライン対応）
      if (goal) {
        setGoal({
          ...goal,
          target_amount: newTarget,
          current_amount: newCurrent,
        });
      }
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditTarget(target.toString());
    setEditCurrent(current.toString());
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div
        className={`p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] shadow-xl ${className || ""}`}
      >
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] dark:border-[#c9a227]" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] shadow-xl ${className || ""}`}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d4a7c] flex items-center justify-center shadow-lg shadow-[#1e3a5f]/20">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="target icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1e293b] dark:text-white">
              {targetLabel}
            </h3>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
              目標達成まであと {formatShortCurrency(remaining)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isEditing) {
              handleCancel();
            } else {
              setIsEditing(true);
            }
          }}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[#1e3a5f]/10 dark:bg-[#c9a227]/10 text-[#1e3a5f] dark:text-[#c9a227] hover:bg-[#1e3a5f]/20 dark:hover:bg-[#c9a227]/20 transition-colors"
        >
          {isEditing ? "キャンセル" : "編集"}
        </button>
      </div>

      {/* 編集モード */}
      {isEditing ? (
        <div className="space-y-4 mb-6">
          <div>
            <label
              htmlFor="target-amount"
              className="block text-sm font-medium text-[#64748b] dark:text-[#94a3b8] mb-1"
            >
              目標金額
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] dark:text-[#94a3b8]">
                ¥
              </span>
              <input
                id="target-amount"
                type="text"
                value={editTarget}
                onChange={(e) =>
                  setEditTarget(e.target.value.replace(/[^0-9]/g, ""))
                }
                className="w-full pl-8 pr-4 py-2 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] dark:focus:ring-[#c9a227]"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="current-amount"
              className="block text-sm font-medium text-[#64748b] dark:text-[#94a3b8] mb-1"
            >
              現在の貯金額
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] dark:text-[#94a3b8]">
                ¥
              </span>
              <input
                id="current-amount"
                type="text"
                value={editCurrent}
                onChange={(e) =>
                  setEditCurrent(e.target.value.replace(/[^0-9]/g, ""))
                }
                className="w-full pl-8 pr-4 py-2 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] dark:focus:ring-[#c9a227]"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-[#1e3a5f] to-[#2d4a7c] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? "保存中..." : "保存"}
          </button>
        </div>
      ) : (
        <>
          {/* 金額表示 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a]">
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mb-1">
                現在の貯金額
              </p>
              <p className="text-2xl font-bold text-[#1e293b] dark:text-white">
                {formatCurrency(current)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a]">
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mb-1">
                目標金額
              </p>
              <p className="text-2xl font-bold text-[#1e3a5f] dark:text-[#c9a227]">
                {formatCurrency(target)}
              </p>
            </div>
          </div>
        </>
      )}

      {/* プログレスバー */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-[#1e293b] dark:text-white">
            達成率
          </span>
          <span className="text-2xl font-bold text-[#c9a227]">
            {percentage.toFixed(1)}%
          </span>
        </div>
        <ProgressBar value={current} max={target} showLabel={false} size="lg" />
        <div className="flex justify-between text-xs text-[#64748b] dark:text-[#94a3b8]">
          <span>¥0</span>
          <span>{formatShortCurrency(target / 2)}</span>
          <span>{formatShortCurrency(target)}</span>
        </div>
      </div>
    </div>
  );
};
