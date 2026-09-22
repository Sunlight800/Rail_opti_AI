import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Moon,
  Sun,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  UserCheck,
  ChevronRight,
  X,
  Gauge,
  CalendarDays,
} from 'lucide-react';
import { UserProfileData } from '../../types/dashboard';

interface TopBarProps {
  user: UserProfileData | null;
  onOpenLogin: () => void;
  onLogout?: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onNavigate?: (view: string, param?: string) => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'task' | 'train' | 'section' | 'view';
  targetView: string;
}

const SEARCH_DATABASE: SearchItem[] = [
  { id: 'MT-001', title: 'MT-001: Track 7A Rail Fracture Risk', subtitle: 'Civil Engineering · Urgent Due Today', type: 'task', targetView: 'maintenance' },
  { id: 'MT-002', title: 'MT-002: Signal Point 12 Interlocking', subtitle: 'S&T · Electronic Interlocking Routine', type: 'task', targetView: 'maintenance' },
  { id: 'MT-003', title: 'MT-003: OHE Catenary Tensioning', subtitle: 'Electrical (TRD) · 25kV Power Block', type: 'task', targetView: 'maintenance' },
  { id: 'TRN-12951', title: '12951 Mumbai Rajdhani Express', subtitle: 'Coaching Premium · Priority Rank 1', type: 'train', targetView: 'operations' },
  { id: 'TRN-20901', title: '20901 Vande Bharat Express', subtitle: 'Coaching Premium · On Time', type: 'train', targetView: 'operations' },
  { id: 'TRN-SZ314', title: 'Freight SZ314 (Container Rake)', subtitle: 'Goods / Freight · Current SEC-NDLS-ALD', type: 'train', targetView: 'operations' },
  { id: 'SEC-NDLS-ALD', title: 'SEC-NDLS-ALD: New Delhi to Prayagraj', subtitle: '130 km/h · Speed Restriction 30 km/h in effect', type: 'section', targetView: 'operations' },
  { id: 'SEC-ALD-BPL', title: 'SEC-ALD-BPL: Prayagraj to Bhopal', subtitle: '120 km/h · 4 Active Maintenance Blocks', type: 'section', targetView: 'operations' },
  { id: 'PLN-V1', title: 'Plan Version PLN-V1', subtitle: 'Active Operating Schedule · 28 Blocks', type: 'view', targetView: 'plan-versions' },
  { id: 'OPT-SOLVER', title: 'OR-Tools CP-SAT Optimizer', subtitle: 'Combinatorial Block Window Scheduling', type: 'view', targetView: 'block-planning' },
];

export const TopBar: React.FC<TopBarProps> = ({
  user,
  onOpenLogin,
  onLogout,
  isDarkMode,
  onToggleTheme,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Critical Risk: Track Section 7A',
      desc: 'Failure probability at 84% under 68.5 GMT load. Immediate block required.',
      type: 'danger',
      time: '12m ago',
      targetView: 'ai-intelligence',
      unread: true,
    },
    {
      id: 'notif-2',
      title: 'Speed Restriction: 30 km/h Caution Order',
      desc: 'Active on SEC-NDLS-ALD (KM 142/10-18). Solver added transit buffer.',
      type: 'warning',
      time: '35m ago',
      targetView: 'operations',
      unread: true,
    },
    {
      id: 'notif-3',
      title: 'Statutory Sign-Off Required',
      desc: 'PLN-V1 awaiting Operating Branch consensus from SrDOM.',
      type: 'info',
      time: '1h ago',
      targetView: 'approval-center',
      unread: true,
    },
  ]);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSearchResults = searchQuery.trim()
    ? SEARCH_DATABASE.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectSearchResult = (item: SearchItem) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (onNavigate) {
      onNavigate(item.targetView);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="h-16 border-b border-railnavy-800 bg-railnavy-900/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Slogan */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          {/* Train silhouette SVG logo */}
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
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

      {/* Global Search Bar with Live Results Dropdown */}
      <div ref={searchRef} className="flex-1 max-w-xl mx-6 hidden md:block relative">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredSearchResults.length > 0) {
                handleSelectSearchResult(filteredSearchResults[0]);
              }
            }}
            placeholder="Search assets, tasks, trains, sections, or anything..."
            className="w-full bg-railnavy-950/80 border border-railnavy-800 rounded-full pl-10 pr-12 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-railnavy-800 text-slate-400 px-1.5 py-0.5 rounded border border-railnavy-700 pointer-events-none">
              Ctrl K
            </span>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-railnavy-900 border border-railnavy-700 rounded-xl shadow-2xl overflow-hidden z-50 text-left">
            <div className="p-2 border-b border-railnavy-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
              <span>Matching Operational Entities</span>
              <span className="font-mono">{filteredSearchResults.length} found</span>
            </div>
            {filteredSearchResults.length > 0 ? (
              <div className="max-h-72 overflow-y-auto divide-y divide-railnavy-800/50">
                {filteredSearchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSearchResult(item)}
                    className="p-3 hover:bg-railnavy-800/60 cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span className="font-mono text-cyan-400">{item.id}</span>
                        <span>{item.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-railnavy-950 text-slate-400 border border-railnavy-800">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching assets, tasks, or trains found for "{searchQuery}".
              </div>
            )}
          </div>
        )}
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

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-lg border border-railnavy-800 bg-railnavy-950/50 hover:bg-railnavy-800/60 text-slate-300 transition"
            title="System Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-railnavy-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-railnavy-900 border border-railnavy-700 rounded-2xl shadow-2xl overflow-hidden z-50 text-left">
              <div className="p-3 border-b border-railnavy-800 flex items-center justify-between bg-railnavy-950/60">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Active Operational Alerts</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-railnavy-800/60 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      if (onNavigate) onNavigate(n.targetView);
                    }}
                    className={`p-3 hover:bg-railnavy-800/60 cursor-pointer transition ${
                      n.unread ? 'bg-railnavy-950/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                      <div className="flex items-center gap-1.5">
                        {n.type === 'danger' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                        {n.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                        {n.type === 'info' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                        <span className={n.type === 'danger' ? 'text-rose-300' : 'text-slate-200'}>
                          {n.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">{n.desc}</p>
                    <div className="mt-2 text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                      <span>Investigate in {n.targetView}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-railnavy-800 bg-railnavy-950/60 text-center">
                <button
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    if (onNavigate) onNavigate('audit-log');
                  }}
                  className="text-xs text-slate-400 hover:text-white font-medium"
                >
                  View Complete Audit & Notification Log →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
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

          {/* Profile Menu Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-railnavy-900 border border-railnavy-700 rounded-2xl shadow-2xl overflow-hidden z-50 text-left">
              <div className="p-4 border-b border-railnavy-800 bg-railnavy-950/60">
                <div className="text-sm font-bold text-white">
                  {user?.full_name || 'Shri Rajesh Sharma'}
                </div>
                <div className="text-xs text-slate-400">{user?.email || 'admin@railopt.ai'}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {user?.role || 'ADMIN'}
                  </span>
                  <span className="text-[10px] text-slate-400">{user?.department || 'Operations'}</span>
                </div>
              </div>

              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-railnavy-800 hover:text-white transition"
                >
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span>Switch Role / Account</span>
                </button>

                {onLogout && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
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
export default TopBar;

