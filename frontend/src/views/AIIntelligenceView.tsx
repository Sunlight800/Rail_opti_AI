import React, { useState, useEffect } from 'react';
import {
  Brain,
  AlertTriangle,
  Activity,
  ShieldAlert,
  Sparkles,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { fetchWithAuth } from '../services/api';

interface RiskProfile {
  task_id: string;
  safety_risk: number;
  failure_probability: number;
  operational_impact: number;
  risk_category: string;
  confidence_score: number;
  health_score: number;
  urgency_level: string;
  evidence: string[];
  explanation: string;
}

export const AIIntelligenceView: React.FC = () => {
  // Spotlight on Track Section 7A (MT-001)
  const [spotlightRisk, setSpotlightRisk] = useState<RiskProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Interactive sensitivity simulator state
  const [simAge, setSimAge] = useState<number>(8);
  const [simGmt, setSimGmt] = useState<number>(68.5);
  const [simOverdue, setSimOverdue] = useState<number>(42);
  const [simSpeed, setSimSpeed] = useState<number>(130);
  const [simSeverity, setSimSeverity] = useState<string>('CRITICAL');
  const [simResult, setSimResult] = useState<RiskProfile | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Fetch baseline risk for MT-001
  const fetchBaseline = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/risk/MT-001');
      if (res.ok) {
        setSpotlightRisk(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch baseline risk:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run dynamic sensitivity evaluation
  const runSensitivityTest = async () => {
    setSimulating(true);
    try {
      const res = await fetchWithAuth('/api/risk/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: 'MT-SIM-LIVE',
          asset_type: 'TRACK',
          severity: simSeverity,
          section_speed_kmh: simSpeed,
          cumulative_gmt: simGmt,
          overdue_days: simOverdue,
          age_years: simAge,
          defect_severities: [simSeverity],
        }),
      });
      if (res.ok) {
        setSimResult(await res.json());
      }
    } catch (err) {
      console.error('Sensitivity evaluation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchBaseline();
    runSensitivityTest();
  }, []);

  useEffect(() => {
    runSensitivityTest();
  }, [simAge, simGmt, simOverdue, simSpeed, simSeverity]);

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/60 via-railnavy-900 to-railnavy-900 border border-purple-800/40 rounded-2xl p-5 shadow">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              AI Risk & Operations Intelligence
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
              PREDICTIVE ASSET HEALTH
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Multi-dimensional risk assessment evaluating failure probabilities, safety risks, and operational impacts
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Model Confidence: 94.2%
        </div>
      </div>

      {/* Spotlight: High-Risk Asset Detected */}
      <div className="bg-gradient-to-br from-railnavy-900 to-railnavy-950 border border-railnavy-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-railnavy-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500 text-white flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> CRITICAL RISK DETECTED
              </span>
              <span className="text-xs font-mono text-cyan-400 font-bold">MT-001 / AST-TRK-7A</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Track Section 7A (Km 142/10-18) — New Delhi - Prayagraj
            </h2>
            <p className="text-xs text-slate-400">
              Civil Engineering (Track) • 68.5 GMT Cumulative Traffic • 130 km/h Sectional Speed
            </p>
          </div>

          {/* Large Failure Probability Display */}
          <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-railnavy-950 border border-rose-500/30">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-rose-500 font-mono">
                {spotlightRisk?.failure_probability ? Math.round(spotlightRisk.failure_probability * 100) : 84}%
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Failure Prob.</div>
            </div>
            <div className="h-10 w-px bg-railnavy-800" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400 font-mono">
                {spotlightRisk?.safety_risk || 96.0}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Safety Risk</div>
            </div>
            <div className="h-10 w-px bg-railnavy-800" />
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 font-mono">
                {spotlightRisk?.operational_impact || 88.0}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Impact Score</div>
            </div>
          </div>
        </div>

        {/* Evidence & Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> Key Contributing Evidence Factors
            </h3>
            <div className="space-y-2 font-mono text-xs">
              {spotlightRisk?.evidence.map((ev, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-railnavy-950/80 border border-railnavy-800/80 text-slate-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span className="font-sans text-[11px] leading-relaxed">{ev}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" /> Natural Language AI Explanation
            </h3>
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs text-slate-200 leading-relaxed font-sans space-y-2">
              <p>{spotlightRisk?.explanation}</p>
              <p className="text-[11px] text-purple-300">
                Recommended Action: Mandatory maintenance block allocation within next 48 hours to prevent potential rail break under express coaching traffic.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Sensitivity Testing (What-If Risk Playground) */}
      <div className="bg-railnavy-900/80 border border-railnavy-800 rounded-2xl p-6 shadow space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Interactive Risk Sensitivity Simulator
            </h2>
            <p className="text-[11px] text-slate-400">
              Simulate how varying asset age, traffic load, overdue days, and speed impact failure probability in real-time
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-semibold">Live Model Recalculation</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sliders (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Age */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Asset Age: <b className="text-white font-mono">{simAge} years</b></span>
                <span className="text-slate-400 text-[11px]">Design life: 20 years</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={simAge}
                onChange={(e) => setSimAge(Number(e.target.value))}
                className="w-full h-1.5 bg-railnavy-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Cumulative GMT */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Cumulative Traffic: <b className="text-white font-mono">{simGmt} GMT</b></span>
                <span className="text-slate-400 text-[11px]">High density threshold: 50 GMT</span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="2.5"
                value={simGmt}
                onChange={(e) => setSimGmt(Number(e.target.value))}
                className="w-full h-1.5 bg-railnavy-950 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>

            {/* Overdue Days */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Overdue Days: <b className="text-rose-400 font-mono">{simOverdue} days</b></span>
                <span className="text-slate-400 text-[11px]">Regulatory grace: 15 days</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                value={simOverdue}
                onChange={(e) => setSimOverdue(Number(e.target.value))}
                className="w-full h-1.5 bg-railnavy-950 rounded-lg appearance-none cursor-pointer accent-rose-400"
              />
            </div>

            {/* Section Speed */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Section Speed: <b className="text-white font-mono">{simSpeed} km/h</b></span>
                <span className="text-slate-400 text-[11px]">Track standard: 130 km/h</span>
              </div>
              <input
                type="range"
                min="80"
                max="160"
                step="5"
                value={simSpeed}
                onChange={(e) => setSimSpeed(Number(e.target.value))}
                className="w-full h-1.5 bg-railnavy-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* Defect Severity Selector */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs text-slate-300 block">Defect Severity Level:</span>
              <div className="flex items-center gap-2">
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSimSeverity(sev)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      simSeverity === sev
                        ? sev === 'CRITICAL' ? 'bg-rose-500 text-white' :
                          sev === 'HIGH' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
                        : 'bg-railnavy-950 border border-railnavy-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Simulator Output (4 cols) */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-railnavy-950 border border-railnavy-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Simulated AI Output
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-railnavy-900 border border-railnavy-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300">Failure Probability:</span>
                  <span className="text-xl font-bold font-mono text-rose-400">
                    {simResult ? Math.round(simResult.failure_probability * 100) : '--'}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-railnavy-900 border border-railnavy-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300">Safety Risk Score:</span>
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {simResult?.safety_risk || '--'} / 100
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-railnavy-900 border border-railnavy-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300">Health Index:</span>
                  <span className="text-xl font-bold font-mono text-cyan-400">
                    {simResult?.health_score || '--'}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-railnavy-900 border border-railnavy-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300">Recommended Urgency:</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    simResult?.urgency_level === 'IMMEDIATE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                    simResult?.urgency_level === 'URGENT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {simResult?.urgency_level || 'ROUTINE'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              Demonstrates real-time mathematical risk evaluation connecting telemetry to priority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
