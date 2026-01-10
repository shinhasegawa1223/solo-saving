import type { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  tag: string;
  value: string;
  trend: string;
  trendLabel: string;
  variant: "primary" | "accent" | "neutral";
  icon?: ReactNode;
  subTrend?: string;
}

export const StatsCard = ({
  title,
  tag,
  value,
  trend,
  subTrend,
  trendLabel,
  variant,
  icon,
}: StatsCardProps) => {
  const styles = {
    primary: {
      container:
        "bg-gradient-to-br from-[#1e3a5f] to-[#2d4a7c] text-white shadow-[#1e3a5f]/20",
      tag: "bg-white/10 text-white",
      subText: "text-white/80",
      trendText: "text-[#c9a227]",
      trendLabel: "text-white/60",
      decoration: "bg-white/5",
    },
    accent: {
      container:
        "bg-gradient-to-br from-[#c9a227] to-[#dab842] text-[#1e293b] shadow-[#c9a227]/20",
      tag: "bg-white/20 text-[#1e293b]",
      subText: "text-[#1e293b]/80",
      trendText: "text-[#1e3a5f]",
      trendLabel: "text-[#1e293b]/60",
      decoration: "bg-white/10",
    },
    neutral: {
      container:
        "bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] text-[#1e293b] dark:text-white",
      tag: "bg-[#1e3a5f]/10 dark:bg-[#c9a227]/10 text-[#1e3a5f] dark:text-[#c9a227]",
      subText: "text-[#64748b] dark:text-[#94a3b8]",
      trendText: "text-[#c9a227]",
      trendLabel: "text-[#64748b] dark:text-[#94a3b8]",
      decoration: "bg-[#1e3a5f]/5 dark:bg-[#c9a227]/5",
    },
  };

  const currentStyle = styles[variant];

  return (
    <div
      className={`group p-6 rounded-2xl shadow-xl card-hover relative overflow-hidden ${currentStyle.container}`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 ${currentStyle.decoration}`}
      />
      {variant !== "neutral" && (
        <div
          className={`absolute bottom-0 left-0 w-24 h-24 rounded-full translate-y-1/2 -translate-x-1/2 ${currentStyle.decoration}`}
        />
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <p className={`text-sm font-medium ${currentStyle.subText}`}>
            {title}
          </p>
          <span
            className={`text-xs px-2 py-1 rounded-full ${currentStyle.tag}`}
          >
            {tag}
          </span>
        </div>
        <p className="text-4xl font-bold tracking-tight">{value}</p>
        <div className="flex items-center gap-2 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span
              className={`inline-flex items-center gap-1 text-sm font-bold ${currentStyle.trendText}`}
            >
              {icon || (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="trend icon"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              )}
              {trend}
              {subTrend && (
                <span className="opacity-80 font-normal ml-1">
                  ({subTrend})
                </span>
              )}
            </span>
            <span className={`text-sm ${currentStyle.trendLabel}`}>
              {trendLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
