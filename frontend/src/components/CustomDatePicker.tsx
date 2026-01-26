"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  maxDate?: string;
}

export const CustomDatePicker = ({
  value,
  onChange,
  maxDate,
}: CustomDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // カレンダー表示用の年月（選択中の日付とは独立して動かせるように）
  const [displayDate, setDisplayDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });

  const calendarRef = useRef<HTMLDivElement>(null);

  // 外部クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 月の日数を取得
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // 月の初日の曜日を取得
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setDisplayDate(
      new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setDisplayDate(
      new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (day: number) => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    // 未来の日付制限チェック
    if (maxDate && dateStr > maxDate) return;

    onChange(dateStr);
    setIsOpen(false);
  };

  const currentYear = displayDate.getFullYear();
  const currentMonth = displayDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  // カレンダーの日付セル生成
  const renderCalendarDays = () => {
    const days = [];
    // 空白セル
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }
    // 日付セル
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const isSelected = value === dateStr;
      const isToday = new Date().toISOString().split("T")[0] === dateStr;
      const isDisabled = maxDate ? dateStr > maxDate : false;

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          disabled={isDisabled}
          className={`
            w-8 h-8 rounded-full text-sm flex items-center justify-center transition-colors relative
            ${
              isSelected
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold"
                : isDisabled
                  ? "text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
                  : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            }
            ${
              !isSelected && isToday
                ? "ring-1 ring-neutral-300 dark:ring-neutral-600"
                : ""
            }
          `}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="relative" ref={calendarRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#262626] text-left text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all flex items-center"
      >
        <span className="block truncate">{value.replace(/-/g, "/")}</span>
      </button>

      {/* カレンダーアイコン (absolute配置) */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-white dark:bg-[#262626] rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 w-[280px]">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-neutral-900 dark:text-white">
              {currentYear}年 {currentMonth + 1}月
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((d) => (
              <div
                key={d}
                className="w-8 text-center text-xs text-neutral-400 font-medium"
              >
                {d}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7 gap-y-1 justify-items-center">
            {renderCalendarDays()}
          </div>
        </div>
      )}
    </div>
  );
};
