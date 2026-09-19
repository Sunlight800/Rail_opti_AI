import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Shield,
  Bell,
  Database,
  RefreshCw,
  CheckCircle2,
  Lock,
  Cpu,
  Save,
  Server,
  Terminal,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [solverTimeLimit, setSolverTimeLimit] = useState<number>(30);
  const [priorityWeight, setPriorityWeight] = useState<number>(10.0);
  const [consolidationBonus, setConsolidationBonus] = useState<number>(5.0);
  const [disruptionPenalty, setDisruptionPenalty] = useState<number>(20.0);
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [criticalSmsAlerts, setCriticalSmsAlerts] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleSaveSettings = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReSeed = async () => {
    setIsResetting(true);
    setResetMessage(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/integration/sync/all', {
        method: 'POST',
      });
      if (res.ok) {
        setResetMessage('Database successfully synchronized with live TMS/SMMS/TDMS/COA feeds!');
      }
    } catch (err) {
      console.error('Failed to sync:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-railnavy-900 via-railnavy-850 to-slate-900 p-5 rounded-2xl border border-railnavy-700/80 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
              System Configuration
            </span>
            <span className="text-xs text-slate-400">RAILOPT AI v0.1.0</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            Platform Settings & Optimization Tuning
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Configure Google OR-Tools CP-SAT solver weights, notification thresholds, and role-based access governance.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition"
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              Settings Saved!
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Save Configuration
            </>
          )}
        </button>
      </div>

      {resetMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{resetMessage}</span>
          </div>
          <button onClick={() => setResetMessage(null)} className="text-emerald-400 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Solver Hyperparameters Tuning */}
      <div className="p-6 rounded-2xl bg-railnavy-900/90 border border-railnavy-800 shadow-lg space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-railnavy-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Google OR-Tools CP-SAT Solver Tuning
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Calibrate multi-objective trade-off weights between maintenance urgency, multi-department consolidation, and train delay penalties.
            </p>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-800/40">
            Engine: CP-SAT v9.8
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Priority Task Weight (W_p)</span>
              <strong className="text-cyan-400">{priorityWeight.toFixed(1)}</strong>
            </div>
            <input
              type="range"
              min="1.0"
              max="25.0"
              step="0.5"
              value={priorityWeight}
              onChange={(e) => setPriorityWeight(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 bg-railnavy-800 rounded-lg h-2"
            />
            <p className="text-[10px] text-slate-500">
              Higher value forces high-risk safety-critical tasks into earliest available blocks.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Consolidation Bonus (W_c)</span>
              <strong className="text-purple-400">{consolidationBonus.toFixed(1)}</strong>
            </div>
            <input
              type="range"
              min="1.0"
              max="15.0"
              step="0.5"
              value={consolidationBonus}
              onChange={(e) => setConsolidationBonus(parseFloat(e.target.value))}
              className="w-full accent-purple-500 bg-railnavy-800 rounded-lg h-2"
            />
            <p className="text-[10px] text-slate-500">
              Reward given to solver for aligning Civil, Electrical, and S&T tasks into single integrated blocks.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Train Disruption Penalty (W_d)</span>
              <strong className="text-rose-400">{disruptionPenalty.toFixed(1)}</strong>
            </div>
            <input
              type="range"
              min="5.0"
              max="50.0"
              step="1.0"
              value={disruptionPenalty}
              onChange={(e) => setDisruptionPenalty(parseFloat(e.target.value))}
              className="w-full accent-rose-500 bg-railnavy-800 rounded-lg h-2"
            />
            <p className="text-[10px] text-slate-500">
              Penalty cost applied per minute of delay imposed on coaching and freight paths.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Solver Time Limit (seconds)</span>
              <strong className="text-emerald-400">{solverTimeLimit}s</strong>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={solverTimeLimit}
              onChange={(e) => setSolverTimeLimit(parseInt(e.target.value))}
              className="w-full accent-emerald-500 bg-railnavy-800 rounded-lg h-2"
            />
            <p className="text-[10px] text-slate-500">
              Maximum execution ceiling before solver terminates with best-found feasible solution.
            </p>
          </div>
        </div>
      </div>

      {/* Role-Based Access Control (RBAC) Overview */}
      <div className="p-6 rounded-2xl bg-railnavy-900/90 border border-railnavy-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-railnavy-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Role-Based Access Control (RBAC) Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Active security governance configured for Indian Railways operational personnel.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-800/40">
            Enforced
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-railnavy-850/80 border border-railnavy-700/60 space-y-1">
            <span className="font-bold text-white">CONTROL_OFFICE / ADMIN</span>
            <p className="text-[11px] text-slate-400">Full plan authorization, CP-SAT solve execution, and live corridor lockdown.</p>
          </div>
          <div className="p-3 rounded-xl bg-railnavy-850/80 border border-railnavy-700/60 space-y-1">
            <span className="font-bold text-white">ENGINEERING / TRD / S&T</span>
            <p className="text-[11px] text-slate-400">Departmental sign-offs, maintenance task logging, and resource requisition.</p>
          </div>
          <div className="p-3 rounded-xl bg-railnavy-850/80 border border-railnavy-700/60 space-y-1">
            <span className="font-bold text-white">DEMO_USER</span>
            <p className="text-[11px] text-slate-400">Interactive sandbox mode for SIH evaluation with live simulation capabilities.</p>
          </div>
        </div>
      </div>

      {/* Database Maintenance & Synchronization */}
      <div className="p-6 rounded-2xl bg-railnavy-900/90 border border-railnavy-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-railnavy-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              External System Sync & Database Diagnostics
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Synchronize live data streams from TMS, SMMS, TDMS, and COA simulators.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-railnavy-850/80 border border-railnavy-700/60">
          <div>
            <span className="text-xs font-bold text-white">Trigger Comprehensive Feed Sync</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Re-polls all 4 railway integrations, ingests new defect logs, and recalibrates asset health metrics.
            </p>
          </div>
          <button
            onClick={handleReSeed}
            disabled={isResetting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            Sync All Feeds
          </button>
        </div>
      </div>
    </div>
  );
};
export default SettingsView;
