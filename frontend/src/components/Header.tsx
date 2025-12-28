"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { appConfig } from "@/config";

const { app } = appConfig;

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-[#0f172a]/80 border-b border-[#e2e8f0] dark:border-[#334155]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d4a7c] flex items-center justify-center shadow-lg shadow-[#1e3a5f]/20">
            <span className="text-white font-bold text-xl">
              {app.name.charAt(0)}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">
            {app.name}
          </h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
};
