import React from 'react';
import { Search, Bell, Moon, Sun, ShieldAlert } from 'lucide-react';
import { UserProfileData } from '../../types/dashboard';

interface TopBarProps {
  user: UserProfileData | null;
  onOpenLogin: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onSearch?: (query: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  onOpenLogin,
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header className="h-16 border-b border-railnavy-800 bg-railnavy-900/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Slogan */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Train silhouette SVG logo */}
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="16" height="16" x="4" y="3" rx="2" />
              <path d="M4 11h16" />
              <path d="M12 3v8" />
              <path d="m8 19-2 3" />
              <path d="m18 22-2-3" />
              <circle cx="8" cy="15" r="1" />
              <circle cx="16" cy="15" r="1" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
              RAILOPT AI
            </span>
            <div className="text-[10px] text-cyan-400/80 font-medium tracking-wide -mt-1 hidden sm:block">
              Smarter Maintenance. Higher Asset Availability. Better Operations.
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-xl mx-6 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assets, tasks, trains, sections, or anything..."
            className="w-full bg-railnavy-950/80 border border-railnavy-800 rounded-full pl-10 pr-12 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-railnavy-800 text-slate-400 px-1.5 py-0.5 rounded border border-railnavy-700">
            Ctrl K
          </span>
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Dark/Light Mode Toggle */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-railnavy-800 bg-railnavy-950/50 hover:bg-railnavy-800/60 text-slate-300 text-xs transition"
          title="Toggle Theme"
        >
          {isDarkMode ? (
            <>
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline text-[11px]">Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline text-[11px]">Light Mode</span>
            </>
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg border border-railnavy-800 bg-railnavy-950/50 hover:bg-railnavy-800/60 text-slate-300 transition">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-railnavy-900">
            3
          </span>
        </button>

        {/* User Profile */}
        <div
          onClick={onOpenLogin}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full border border-railnavy-800 bg-railnavy-950/60 hover:border-cyan-500/40 cursor-pointer transition"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow">
            {user?.avatar_initials || 'AD'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-slate-200 leading-tight">
              {user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Admin'}
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              {user?.role ? user.role.replace('_', ' ') : 'System Administrator'}
            </div>
          </div>
        </div>

        {/* Demo / Simulated Data Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[11px] font-medium tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          DEMO / SIMULATED DATA
        </div>
      </div>
    </header>
  );
};
