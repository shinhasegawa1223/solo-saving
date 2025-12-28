import { appConfig } from "@/config";

const { app } = appConfig;

export const Footer = () => {
  return (
    <footer className="mt-12 border-t border-[#e2e8f0] dark:border-[#334155]">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <p className="text-center text-sm text-[#64748b] dark:text-[#94a3b8]">
          © {app.year} {app.name}
        </p>
      </div>
    </footer>
  );
};
