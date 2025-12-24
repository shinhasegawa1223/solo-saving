"use client";

import { AreaChart } from "@/components/AreaChart";
import { ThemeToggle } from "@/components/ThemeToggle";

const chartdata = [
  { date: "Jan 23", SolarPanels: 2890, Inverters: 2338 },
  { date: "Feb 23", SolarPanels: 2756, Inverters: 2103 },
  { date: "Mar 23", SolarPanels: 3322, Inverters: 2194 },
  { date: "Apr 23", SolarPanels: 3470, Inverters: 2108 },
  { date: "May 23", SolarPanels: 3475, Inverters: 1812 },
  { date: "Jun 23", SolarPanels: 3129, Inverters: 1726 },
  { date: "Jul 23", SolarPanels: 3490, Inverters: 1982 },
  { date: "Aug 23", SolarPanels: 2903, Inverters: 2012 },
  { date: "Sep 23", SolarPanels: 2643, Inverters: 2342 },
  { date: "Oct 23", SolarPanels: 2837, Inverters: 2473 },
  { date: "Nov 23", SolarPanels: 2954, Inverters: 3848 },
  { date: "Dec 23", SolarPanels: 3239, Inverters: 3736 },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-300">
      {/* Header with subtle gradient */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-[#0f172a]/80 border-b border-[#e2e8f0] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d4a7c] flex items-center justify-center shadow-lg shadow-[#1e3a5f]/20">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">
                Solo Saving
              </h1>
              <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                Premium Finance Dashboard
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards - Color balanced: 紺60%, 金30%, ニュートラル10% */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 - Primary Navy Gradient (Main Color) */}
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#2d4a7c] text-white shadow-xl shadow-[#1e3a5f]/20 card-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-white/80">
                  Total Revenue
                </p>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                  Monthly
                </span>
              </div>
              <p className="text-4xl font-bold tracking-tight">$45,231</p>
              <div className="flex items-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1 text-[#c9a227] text-sm font-semibold">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="上昇トレンド"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  +20.1%
                </span>
                <span className="text-sm text-white/60">from last month</span>
              </div>
            </div>
          </div>

          {/* Card 2 - Gold Accent (Sub Color) */}
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-[#c9a227] to-[#dab842] text-[#1e293b] shadow-xl shadow-[#c9a227]/20 card-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-[#1e293b]/80">
                  Active Users
                </p>
                <span className="text-xs px-2 py-1 rounded-full bg-white/20">
                  Live
                </span>
              </div>
              <p className="text-4xl font-bold tracking-tight">2,350</p>
              <div className="flex items-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1 text-[#1e3a5f] text-sm font-bold">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="上昇トレンド"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  +15.3%
                </span>
                <span className="text-sm text-[#1e293b]/60">
                  from last month
                </span>
              </div>
            </div>
          </div>

          {/* Card 3 - Neutral/Glass Card */}
          <div className="group p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] shadow-lg card-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1e3a5f]/5 dark:bg-[#c9a227]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-[#64748b] dark:text-[#94a3b8]">
                  Conversion Rate
                </p>
                <span className="text-xs px-2 py-1 rounded-full bg-[#1e3a5f]/10 dark:bg-[#c9a227]/10 text-[#1e3a5f] dark:text-[#c9a227]">
                  Avg
                </span>
              </div>
              <p className="text-4xl font-bold tracking-tight text-[#1e293b] dark:text-white">
                3.24%
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1 text-[#c9a227] text-sm font-semibold">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="上昇トレンド"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  +4.5%
                </span>
                <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                  from last month
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Chart Section - Clean and spacious */}
        <section className="p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#c9a227] to-[#dab842]" />
              <div>
                <h2 className="text-xl font-bold text-[#1e293b] dark:text-white">
                  Monthly Performance
                </h2>
                <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                  Revenue trends over the past year
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#1e3a5f]" />
                <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                  Solar Panels
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#c9a227]" />
                <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                  Inverters
                </span>
              </div>
            </div>
          </div>
          <div className="chart-container">
            <AreaChart
              className="h-80"
              data={chartdata}
              index="date"
              categories={["SolarPanels", "Inverters"]}
              colors={["indigo", "amber"]}
              valueFormatter={(number: number) =>
                `$${Intl.NumberFormat("us").format(number).toString()}`
              }
              onValueChange={(v) => console.log(v)}
              showLegend={false}
            />
          </div>
        </section>

        {/* Environment Info - More subtle design */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#1e3a5f] to-[#2d4a7c]" />
            <h2 className="text-xl font-bold text-[#1e293b] dark:text-white">
              Tech Stack
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-lg bg-[#c9a227]/10 flex items-center justify-center">
                  <span className="text-[#c9a227] font-bold text-sm">FE</span>
                </span>
                <span className="text-sm font-medium text-[#1e293b] dark:text-white">
                  Frontend
                </span>
              </div>
              <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                Next.js + Bun + Biome + Tremor
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                  <span className="text-[#1e3a5f] dark:text-[#94a3b8] font-bold text-sm">
                    BE
                  </span>
                </span>
                <span className="text-sm font-medium text-[#1e293b] dark:text-white">
                  Backend
                </span>
              </div>
              <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                FastAPI + uv + Ruff
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-lg bg-[#64748b]/10 flex items-center justify-center">
                  <span className="text-[#64748b] font-bold text-sm">DB</span>
                </span>
                <span className="text-sm font-medium text-[#1e293b] dark:text-white">
                  Database
                </span>
              </div>
              <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                PostgreSQL + pgAdmin
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-[#e2e8f0] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-center text-sm text-[#64748b] dark:text-[#94a3b8]">
            © 2024 Solo Saving. Crafted with{" "}
            <span className="text-[#c9a227]">✦</span> Premium Design
          </p>
        </div>
      </footer>
    </div>
  );
}
