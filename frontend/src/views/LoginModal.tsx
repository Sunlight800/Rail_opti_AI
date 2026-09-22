import React, { useState } from 'react';
import { X, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { UserProfileData } from '../types/dashboard';
import { setAuthToken, setStoredUser, getApiBaseUrl } from '../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfileData) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (targetUsername?: string, targetPassword?: string) => {
    setLoading(true);
    setError(null);
    const uname = targetUsername || username;
    const pwd = targetPassword || password;

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname, password: pwd }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || 'Authentication failed');
      }

      const data = await res.json();
      if (data.access_token) {
        setAuthToken(data.access_token);
      }
      if (data.user) {
        setStoredUser(data.user);
        onLoginSuccess(data.user);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickRoles = [
    { label: 'Control Office / SrDOM', username: 'control_office', password: 'control123', role: 'CONTROL_OFFICE' },
    { label: 'Engineering (Civil)', username: 'engineering', password: 'eng123', role: 'ENGINEERING' },
    { label: 'TRD (Electrical)', username: 'trd', password: 'trd123', role: 'TRD' },
    { label: 'S&T (Signals)', username: 'snt', password: 'snt123', role: 'SNT' },
    { label: 'System Admin', username: 'admin', password: 'admin123', role: 'ADMIN' },
    { label: 'Demo User (Sandbox)', username: 'demo_user', password: 'demo123', role: 'DEMO_USER' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-railnavy-900 border border-railnavy-800 rounded-2xl shadow-2xl p-6 text-left overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-railnavy-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6 space-y-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/20">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="16" height="16" x="4" y="3" rx="2" />
              <path d="M4 11h16" />
              <circle cx="8" cy="15" r="1" />
              <circle cx="16" cy="15" r="1" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">RAILOPT AI</h2>
          <p className="text-xs text-cyan-400 font-medium">
            AI-Powered Automatic Maintenance Block Planning
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Sign In</h3>
          <p className="text-xs text-slate-400">Welcome back! Please sign in to continue.</p>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Email / Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="demo@railopt.ai"
                className="w-full bg-railnavy-950 border border-railnavy-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-railnavy-950 border border-railnavy-800 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={() => handleLogin()}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/20 mt-1 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </div>

        {/* Quick Role Selectors */}
        <div className="mt-5 pt-4 border-t border-railnavy-800">
          <div className="text-[10px] text-slate-400 text-center uppercase tracking-wider font-semibold mb-2.5">
            Or continue with role
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {quickRoles.map((role) => (
              <button
                key={role.role}
                onClick={() => handleLogin(role.username, role.password)}
                className="px-2 py-1.5 rounded-lg border border-railnavy-800 bg-railnavy-950/60 hover:bg-railnavy-800 text-[11px] text-slate-300 hover:text-white text-center transition"
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2">
          <span>Secure</span>
          <span>•</span>
          <span>Role Based Access</span>
          <span>•</span>
          <span>Demo Mode</span>
        </div>
      </div>
    </div>
  );
};
