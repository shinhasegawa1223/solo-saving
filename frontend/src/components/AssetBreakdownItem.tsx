import type { ReactNode } from "react";

interface AssetBreakdownItemProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  value: string;
  percentage: string;
  color: "indigo" | "amber" | "emerald" | "slate";
}

export const AssetBreakdownItem = ({
  icon,
  title,
  subtitle,
  value,
  percentage,
  color,
}: AssetBreakdownItemProps) => {
  const colorStyles = {
    indigo: {
      bg: "bg-indigo-500",
      containerBg: "bg-gradient-to-r from-indigo-500/10 to-indigo-500/5",
      border: "border-indigo-500/20",
      text: "text-indigo-500",
    },
    amber: {
      bg: "bg-amber-500",
      containerBg: "bg-gradient-to-r from-amber-500/10 to-amber-500/5",
      border: "border-amber-500/20",
      text: "text-amber-500",
    },
    emerald: {
      bg: "bg-emerald-500",
      containerBg: "bg-gradient-to-r from-emerald-500/10 to-emerald-500/5",
      border: "border-emerald-500/20",
      text: "text-emerald-500",
    },
    slate: {
      bg: "bg-slate-500",
      containerBg: "bg-gradient-to-r from-slate-500/10 to-slate-500/5",
      border: "border-slate-500/20",
      text: "text-slate-500",
    },
  };

  const styles = colorStyles[color];

  return (
    <div
      className={`p-4 rounded-xl border ${styles.containerBg} ${styles.border}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg ${styles.bg} flex items-center justify-center`}
          >
            <span className="text-white text-lg">{icon}</span>
          </div>
          <div>
            <p className="font-semibold text-[#1e293b] dark:text-white">
              {title}
            </p>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-[#1e293b] dark:text-white">{value}</p>
          <p className={`text-sm font-medium ${styles.text}`}>{percentage}</p>
        </div>
      </div>
    </div>
  );
};
