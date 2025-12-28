"use client";

import clsx from "clsx";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export const ProgressBar = ({
  value,
  max = 100,
  className,
  showLabel = true,
  size = "md",
}: ProgressBarProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeStyles = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  return (
    <div className={clsx("w-full", className)}>
      <div
        className={clsx(
          "w-full rounded-full bg-[#e2e8f0] dark:bg-[#334155] overflow-hidden",
          sizeStyles[size]
        )}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#1e3a5f] to-[#c9a227] transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-end mt-1">
          <span className="text-sm font-medium text-[#64748b] dark:text-[#94a3b8]">
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};
