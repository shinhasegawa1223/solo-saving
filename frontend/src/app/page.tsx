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
    <div className="min-h-screen p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Solo Saving Dashboard</h1>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="space-y-8">
        {/* Chart Section */}
        <section className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">
            Monthly Performance Overview
          </h2>
          <AreaChart
            className="h-80"
            data={chartdata}
            index="date"
            categories={["SolarPanels", "Inverters"]}
            colors={["blue", "cyan"]}
            valueFormatter={(number: number) =>
              `$${Intl.NumberFormat("us").format(number).toString()}`
            }
            onValueChange={(v) => console.log(v)}
          />
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <p className="text-sm opacity-80">Total Revenue</p>
            <p className="text-3xl font-bold mt-2">$45,231</p>
            <p className="text-sm mt-2 opacity-80">+20.1% from last month</p>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg">
            <p className="text-sm opacity-80">Active Users</p>
            <p className="text-3xl font-bold mt-2">2,350</p>
            <p className="text-sm mt-2 opacity-80">+15.3% from last month</p>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <p className="text-sm opacity-80">Conversion Rate</p>
            <p className="text-3xl font-bold mt-2">3.24%</p>
            <p className="text-sm mt-2 opacity-80">+4.5% from last month</p>
          </div>
        </section>

        {/* Environment Info */}
        <section className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Environment</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Frontend: Next.js + Bun + Biome + Tremor</li>
            <li>Backend: FastAPI + uv + Ruff</li>
            <li>DB: Postgres + pgAdmin</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
