import React, { useState, useEffect } from 'react';
import {
  Award,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Sliders,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Info,
  Clock,
} from 'lucide-react';

interface FactorDetail {
  name: string;
  code: string;
  weight: number;
  score: number;
  contribution: number;
  description: string;
}

interface PriorityResult {
  task_id?: string;
  priority_score: number;
  priority_band: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  safety_override: boolean;
  factors: FactorDetail[];
  weights_used: Record<string, number>;
  recommendation: {
    action: string;
    window_hint: string;
    escalation_reason?: string;
    top_contributor: string;
  };
}

export const PriorityEngineView: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<string>('MT-001');
  const [priorityData, setPriorityData] = useState<PriorityResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sandbox sliders
  const [safetyRisk, setSafetyRisk] = useState<number>(96);
  const [failureProb, setFailureProb] = useState<number>(84);
  const [assetCrit, setAssetCrit] = useState<number>(78);
  const [maintUrg, setMaintUrg] = useState<number>(72);
  const [trafficImp, setTrafficImp] = useState<number>(65);
  const [defectSev, setDefectSev] = useState<number>(83);
  const [safetyCriticalFlag, setSafetyCriticalFlag] = useState<boolean>(false);

  // Custom weights
  const [wSafety, setWSafety] = useState<number>(0.30);
  const [wFailure, setWFailure] = useState<number>(0.20);
  const [wCrit, setWCrit] = useState<number>(0.15);
  const [wUrg, setWUrg] = useState<number>(0.15);
  const [wTraffic, setWTraffic] = useState<number>(0.10);
  const [wDefect, setWDefect] = useState<number>(0.10);

  const [sandboxResult, setSandboxResult] = useState<PriorityResult | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Fetch task priority
  const fetchTaskPriority = async (taskId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/priority/${taskId}`);
      if (res.ok) {
        const data: PriorityResult = await res.json();
        setPriorityData(data);
        // Sync sandbox to selected task
        if (data.factors) {
          data.factors.forEach((f) => {
            if (f.code === 'S') setSafetyRisk(f.score);
            if (f.code === 'P_f') setFailureProb(f.score);
            if (f.code === 'C_a') setAssetCrit(f.score);
            if (f.code === 'U_m') setMaintUrg(f.score);
            if (f.code === 'I_o') setTrafficImp(f.score);
            if (f.code === 'D_s') setDefectSev(f.score);
          });
          setSafetyCriticalFlag(data.safety_override);
        }
      }
    } catch (err) {
      console.error('Failed to fetch priority:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run recalculation in sandbox
  const runRecalculation = async () => {
    setSimulating(true);
    try {
      const payload = {
        task_id: selectedTask,
        safety_risk: safetyRisk,
        failure_probability: failureProb,
        asset_criticality: assetCrit,
        maintenance_urgency: maintUrg,
        traffic_impact: trafficImp,
        defect_severity: defectSev,
        has_safety_critical_defect: safetyCriticalFlag,
        weights: {
          safety_risk: wSafety,
          failure_probability: wFailure,
          asset_criticality: wCrit,
          maintenance_urgency: wUrg,
          traffic_impact: wTraffic,
          defect_severity: wDefect,
        },
      };
      const res = await fetch('/api/priority/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setSandboxResult(data);
      }
    } catch (err) {
      console.error('Failed to recalculate priority:', err);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchTaskPriority(selectedTask);
  }, [selectedTask]);

  useEffect(() => {
    runRecalculation();
  }, [safetyRisk, failureProb, assetCrit, maintUrg, trafficImp, defectSev, safetyCriticalFlag, wSafety, wFailure, wCrit, wUrg, wTraffic, wDefect]);

  const resetWeights = () => {
    setWSafety(0.30);
    setWFailure(0.20);
    setWCrit(0.15);
    setWUrg(0.15);
    setWTraffic(0.10);
    setWDefect(0.10);
  };

  const getBandBadge = (band: string) => {
    switch (band) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-100">AI Priority Engine</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
              6-Factor Dynamic Model
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1 font-mono">
            Score = 0.30·S + 0.20·P_f + 0.15·C_a + 0.15·U_m + 0.10·I_o + 0.10·D_s
          </p>
        </div>

        {/* Task Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 font-medium">Select Task:</label>
          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="MT-001">MT-001: Track 7A Rail Fracture Risk (Engineering)</option>
            <option value="MT-002">MT-002: Signal Point 12 Interlocking (S&T)</option>
            <option value="MT-003">MT-003: OHE Catenary Tensioning (Electrical)</option>
            <option value="MT-004">MT-004: Bridge 42 Pier Inspection (Engineering)</option>
            <option value="MT-005">MT-005: Axle Counter Sensor Calibration (S&T)</option>
          </select>
        </div>
      </div>

      {/* Safety Override Alert Banner */}
      {priorityData?.safety_override && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-4 flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-200 text-sm tracking-wide">
                SAFETY OVERRIDE ACTIVE
              </span>
              <span className="text-xs bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded border border-rose-500/40">
                CRITICAL THRESHOLD (S ≥ 90)
              </span>
            </div>
            <p className="text-xs text-rose-300/90 mt-1">
              Safety risk score is {priorityData.factors.find(f => f.code === 'S')?.score}/100.
              This task has bypassed normal priority queuing and is escalated directly to the next immediate block window (48h ceiling).
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Priority Engine Card (recreating concept image) + Interactive Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Priority Engine Concept Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  Priority Calculation: {selectedTask}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Normalized weighted sum across 6 railway operational dimensions
                </p>
              </div>

              {/* Priority Band Score */}
              <div className="text-right">
                <div className="text-3xl font-extrabold text-indigo-400 tracking-tight">
                  {priorityData ? priorityData.priority_score.toFixed(1) : '--'}
                  <span className="text-xs text-slate-500 font-normal ml-1">/100</span>
                </div>
                {priorityData && (
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded border mt-1 ${getBandBadge(
                      priorityData.priority_band
                    )}`}
                  >
                    {priorityData.priority_band} PRIORITY
                  </span>
                )}
              </div>
            </div>

            {/* Factors Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                    <th className="py-2.5 px-3">Factor</th>
                    <th className="py-2.5 px-2 text-center">Code</th>
                    <th className="py-2.5 px-2 text-right">Weight</th>
                    <th className="py-2.5 px-3 text-right">Raw Score</th>
                    <th className="py-2.5 px-3 text-right">Contribution</th>
                    <th className="py-2.5 px-3">Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {priorityData?.factors.map((f) => (
                    <tr key={f.code} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-medium text-slate-200">
                        {f.name}
                        <div className="text-[10px] text-slate-500 font-normal">{f.description}</div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-indigo-300 font-semibold">
                        {f.code}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-slate-400">
                        {(f.weight * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                        {f.score.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-400 font-semibold">
                        +{f.contribution.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 w-28">
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, f.score)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI Recommendation Box */}
            {priorityData && (
              <div className="mt-6 bg-indigo-950/30 border border-indigo-500/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                  <TrendingUp className="w-4 h-4" />
                  AI Recommendation & Scheduling Window
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {priorityData.recommendation.action}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1 border-t border-indigo-500/20">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Optimal Window: <strong className="text-slate-200">{priorityData.recommendation.window_hint}</strong>
                  </span>
                  <span>
                    Dominant Factor: <strong className="text-slate-200">{priorityData.recommendation.top_contributor}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Interactive Sandbox / Weights Tuner */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-200">Interactive Priority Sandbox</h3>
              </div>
              <button
                onClick={resetWeights}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                title="Reset to Indian Railways Standard Weights"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Weights
              </button>
            </div>

            {/* Sandbox Recalculated Score */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between mb-5">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400">Sandbox Recalculated</span>
                <div className="text-2xl font-bold text-cyan-400">
                  {sandboxResult ? sandboxResult.priority_score.toFixed(1) : '--'}
                  <span className="text-xs text-slate-500 font-normal ml-1">/100</span>
                </div>
              </div>
              {sandboxResult && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded border ${getBandBadge(
                    sandboxResult.priority_band
                  )}`}
                >
                  {sandboxResult.priority_band}
                </span>
              )}
            </div>

            {/* Factor Score Sliders */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider">
                Factor Raw Scores (0–100)
              </h4>

              {/* Safety Risk */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Safety Risk (S)</span>
                  <span className="font-mono text-cyan-300">{safetyRisk}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={safetyRisk}
                  onChange={(e) => setSafetyRisk(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Failure Prob */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Failure Probability (P_f)</span>
                  <span className="font-mono text-cyan-300">{failureProb}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={failureProb}
                  onChange={(e) => setFailureProb(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Asset Criticality */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Asset Criticality (C_a)</span>
                  <span className="font-mono text-cyan-300">{assetCrit}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={assetCrit}
                  onChange={(e) => setAssetCrit(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Maintenance Urgency */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Maintenance Urgency (U_m)</span>
                  <span className="font-mono text-cyan-300">{maintUrg}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={maintUrg}
                  onChange={(e) => setMaintUrg(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Traffic Impact */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Traffic Impact (I_o)</span>
                  <span className="font-mono text-cyan-300">{trafficImp}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={trafficImp}
                  onChange={(e) => setTrafficImp(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Defect Severity */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Defect Severity (D_s)</span>
                  <span className="font-mono text-cyan-300">{defectSev}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={defectSev}
                  onChange={(e) => setDefectSev(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Safety Critical Defect Toggle */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Safety Critical Defect Flag</span>
                <button
                  onClick={() => setSafetyCriticalFlag(!safetyCriticalFlag)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    safetyCriticalFlag
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {safetyCriticalFlag ? 'ACTIVE (S=100)' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
