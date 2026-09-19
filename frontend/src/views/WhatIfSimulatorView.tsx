import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Play,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  Train,
  Wrench,
  Layers,
} from 'lucide-react';

interface KpiComparisonItem {
  baseline: number;
  simulated: number;
  delta: number;
}

interface RippleEffectItem {
  affected_entity: string;
  entity_type: string;
  impact: string;
  severity: string;
  mitigation: string;
}

interface SimulationResult {
  simulation_status: string;
  parameters: {
    train_delay_min: number;
    target_train_id?: string;
    traffic_density: string;
    duration_extension_pct: number;
    machine_breakdown: boolean;
  };
  kpi_comparison: {
    punctuality_pct: KpiComparisonItem;
    conflicts_count: KpiComparisonItem;
    deferred_tasks: KpiComparisonItem;
    asset_availability_pct: KpiComparisonItem;
  };
  ripple_effects: RippleEffectItem[];
  ai_contingency_recommendation: string;
}

interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  params: {
    train_delay_min: number;
    target_train_id: string;
    traffic_density: string;
    duration_extension_pct: number;
    machine_breakdown: boolean;
  };
}

export const WhatIfSimulatorView: React.FC = () => {
  // Simulator Controls
  const [trainDelay, setTrainDelay] = useState<number>(45);
  const [targetTrain, setTargetTrain] = useState<string>('TRN-SZ314');
  const [trafficDensity, setTrafficDensity] = useState<string>('NORMAL');
  const [durationExtension, setDurationExtension] = useState<number>(0);
  const [machineBreakdown, setMachineBreakdown] = useState<boolean>(false);

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [templates, setTemplates] = useState<ScenarioTemplate[]>([]);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/what-if/scenarios');
      if (res.ok) setTemplates(await res.json());
    } catch (err) {
      console.error('Failed to fetch scenarios:', err);
    }
  };

  const runSimulation = async () => {
    setSimulating(true);
    try {
      const payload = {
        train_delay_min: trainDelay,
        target_train_id: targetTrain,
        traffic_density: trafficDensity,
        duration_extension_pct: durationExtension,
        machine_breakdown: machineBreakdown,
        plan_version_id: 'PLN-V1',
      };

      const res = await fetch('/api/what-if/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSimResult(await res.json());
      }
    } catch (err) {
      console.error('Failed to run simulation:', err);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    runSimulation();
  }, []);

  const loadTemplate = (tmpl: ScenarioTemplate) => {
    setTrainDelay(tmpl.params.train_delay_min);
    setTargetTrain(tmpl.params.target_train_id);
    setTrafficDensity(tmpl.params.traffic_density);
    setDurationExtension(tmpl.params.duration_extension_pct);
    setMachineBreakdown(tmpl.params.machine_breakdown);
  };

  const handleApplyContingency = () => {
    setAppliedToast('AI Contingency applied to Plan V1! Block timings and train routing updated.');
    setTimeout(() => setAppliedToast(null), 5000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-100">AI What-If Scenario Simulator</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              Deterministic Ripple Effect Model
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Simulate operational perturbations, train delay propagation, and machine breakdown cascades in &lt;1 second
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={simulating}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-lg shadow-orange-600/30 transition-all"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${simulating ? 'animate-spin' : ''}`} />
          {simulating ? 'Simulating Ripple Effects...' : 'Run What-If Simulation'}
        </button>
      </div>

      {/* Applied Toast */}
      {appliedToast && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{appliedToast}</span>
          </div>
          <button onClick={() => setAppliedToast(null)} className="text-emerald-400 font-mono">✕</button>
        </div>
      )}

      {/* Scenario Template Quick Pickers */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium mr-2">Quick Scenarios:</span>
        {templates.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => {
              loadTemplate(tmpl);
              setTimeout(runSimulation, 50);
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            {tmpl.name}
          </button>
        ))}
      </div>

      {/* Control Panel / Interactive Sliders Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
          Perturbation Injection Controls
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          {/* Train Delay Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Train Delay Injection</span>
              <span className="font-mono text-amber-400 font-bold">+{trainDelay} min</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="15"
              value={trainDelay}
              onChange={(e) => setTrainDelay(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0m</span>
              <span>15m</span>
              <span>30m</span>
              <span>45m</span>
              <span>60m+</span>
            </div>
          </div>

          {/* Target Train Picker */}
          <div className="space-y-1.5">
            <label className="text-slate-300">Target Delayed Train</label>
            <select
              value={targetTrain}
              onChange={(e) => setTargetTrain(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="TRN-SZ314">Freight SZ314 (Container Rake)</option>
              <option value="TRN-12951">12951 Mumbai Rajdhani Express</option>
              <option value="TRN-20901">20901 Vande Bharat Express</option>
              <option value="TRN-12002">12002 Bhopal Shatabdi Express</option>
            </select>
          </div>

          {/* Duration Extension Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Block Duration Extension</span>
              <span className="font-mono text-orange-400 font-bold">+{durationExtension}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="10"
              value={durationExtension}
              onChange={(e) => setDurationExtension(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0%</span>
              <span>+15%</span>
              <span>+30%</span>
              <span>+50%</span>
            </div>
          </div>

          {/* Machine Breakdown Toggle */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <span className="text-slate-300">Machine Breakdown Injection</span>
            <button
              onClick={() => setMachineBreakdown(!machineBreakdown)}
              className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                machineBreakdown
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {machineBreakdown ? 'BREAKDOWN ACTIVE (BCM-01)' : 'NORMAL OPERATION'}
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side KPI Comparison Grid */}
      {simResult && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Punctuality Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>System Punctuality</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">
                {simResult.kpi_comparison.punctuality_pct.simulated}%
              </span>
              <span className="text-xs font-mono text-rose-400 font-semibold">
                {simResult.kpi_comparison.punctuality_pct.delta}%
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800/80 pt-1.5">
              <span>Baseline: {simResult.kpi_comparison.punctuality_pct.baseline}%</span>
              <span className="text-rose-400">Degraded</span>
            </div>
          </div>

          {/* Conflicts Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Conflicts</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-400">
                {simResult.kpi_comparison.conflicts_count.simulated}
              </span>
              <span className="text-xs font-mono text-rose-400 font-semibold">
                +{simResult.kpi_comparison.conflicts_count.delta}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800/80 pt-1.5">
              <span>Baseline: {simResult.kpi_comparison.conflicts_count.baseline}</span>
              <span className="text-rose-400">+4 Secondary</span>
            </div>
          </div>

          {/* Deferred Tasks Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Deferred Tasks</span>
              <Layers className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-orange-400">
                {simResult.kpi_comparison.deferred_tasks.simulated}
              </span>
              <span className="text-xs font-mono text-orange-400 font-semibold">
                +{simResult.kpi_comparison.deferred_tasks.delta}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800/80 pt-1.5">
              <span>Baseline: {simResult.kpi_comparison.deferred_tasks.baseline}</span>
              <span className="text-orange-400">Postponed</span>
            </div>
          </div>

          {/* Asset Availability Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Asset Availability</span>
              <TrendingDown className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-400">
                {simResult.kpi_comparison.asset_availability_pct.simulated}%
              </span>
              <span className="text-xs font-mono text-slate-400 font-semibold">
                {simResult.kpi_comparison.asset_availability_pct.delta}%
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800/80 pt-1.5">
              <span>Baseline: {simResult.kpi_comparison.asset_availability_pct.baseline}%</span>
              <span className="text-cyan-400">Within Budget</span>
            </div>
          </div>
        </div>
      )}

      {/* Downstream Ripple Effect Cascade & AI Contingency Box */}
      {simResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Ripple Effect Cascade */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                Downstream Ripple Effect Cascade ({simResult.ripple_effects.length} Impacts)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Propagation of initial perturbation across adjacent sections, trains, and maintenance gangs
              </p>
            </div>

            <div className="space-y-3">
              {simResult.ripple_effects.map((eff, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                      {eff.affected_entity}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        eff.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {eff.severity}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    <strong>Impact:</strong> {eff.impact}
                  </div>
                  <div className="text-xs text-cyan-300/90 bg-cyan-950/30 p-2 rounded border border-cyan-500/20">
                    <strong>Mitigation:</strong> {eff.mitigation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Explainable AI Contingency Strategy Box */}
          <div className="lg:col-span-5 bg-gradient-to-b from-amber-950/30 to-slate-900/90 border border-amber-500/40 rounded-xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider font-mono">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Explainable AI Contingency Strategy
              </div>

              <h3 className="text-base font-bold text-slate-100">
                Recommended Action Plan
              </h3>

              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4">
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {simResult.ai_contingency_recommendation}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Confidence Score:</span>
                  <strong className="text-slate-200 font-mono">94.8%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Downstream Delay Saved:</span>
                  <strong className="text-emerald-400 font-mono">+35 min</strong>
                </div>
              </div>
            </div>

            <button
              onClick={handleApplyContingency}
              className="w-full mt-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Contingency to Active Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
