import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Play,
  Sliders,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Info,
  RefreshCw,
  Eye,
  Train,
} from 'lucide-react';

interface BlockItem {
  id: string;
  plan_version_id: string;
  section_id: string;
  section_name: string;
  block_type: string;
  start_time: string;
  end_time: string;
  duration_min: number;
  safety_status: string;
  ai_explanation: string;
  task_count: number;
  assigned_task_ids: string[];
  is_consolidated: boolean;
  consolidation_group_id?: string;
  hours_saved?: number;
}

interface GanttSection {
  section_id: string;
  section_name: string;
  track_type: string;
  blocks: Array<{
    id: string;
    type: string;
    block_type: string;
    title: string;
    start_time: string;
    end_time: string;
    start_hour: number;
    end_hour: number;
    duration_min: number;
    safety_status: string;
    task_count: number;
    is_consolidated: boolean;
  }>;
  trains: Array<{
    id: string;
    type: string;
    train_id: string;
    train_number: string;
    train_name: string;
    train_category: string;
    entry_time: string;
    exit_time: string;
    start_hour: number;
    end_hour: number;
    delay_minutes: number;
  }>;
}

interface GanttResponse {
  timeline_window: string;
  reference_date: string;
  sections: GanttSection[];
}

export const BlockPlannerView: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [ganttData, setGanttData] = useState<GanttResponse | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<BlockItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [optimizing, setOptimizing] = useState<boolean>(false);

  // Optimizer Parameters
  const [horizonDays, setHorizonDays] = useState<number>(3);
  const [priorityWeight, setPriorityWeight] = useState<number>(10.0);
  const [consolidationBonus, setConsolidationBonus] = useState<number>(5.0);
  const [disruptionPenalty, setDisruptionPenalty] = useState<number>(20.0);
  const [allowRerouting, setAllowRerouting] = useState<boolean>(true);

  // Solver telemetry state
  const [solverKpis, setSolverKpis] = useState<{
    scheduled_tasks_count?: number;
    total_blocks_count?: number;
    consolidated_blocks_count?: number;
    block_hours_saved?: number;
    solver_execution_time_ms?: number;
    objective_value?: number;
  } | null>(null);

  const fetchBlocksAndGantt = async () => {
    setLoading(true);
    try {
      const [blkRes, ganttRes] = await Promise.all([
        fetch('/api/blocks?plan_version_id=PLN-V1'),
        fetch('/api/blocks/gantt?plan_version_id=PLN-V1'),
      ]);

      if (blkRes.ok) {
        const blkData = await blkRes.json();
        setBlocks(blkData);
        if (blkData.length > 0) setSelectedBlock(blkData[0]);
      }
      if (ganttRes.ok) {
        setGanttData(await ganttRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const runOptimization = async () => {
    setOptimizing(true);
    try {
      const payload = {
        horizon_days: horizonDays,
        priority_weight: priorityWeight,
        consolidation_bonus: consolidationBonus,
        disruption_penalty: disruptionPenalty,
        allow_rerouting: allowRerouting,
        time_limit_seconds: 5.0,
      };

      const res = await fetch('/api/optimizer/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status in { OPTIMAL: 1, FEASIBLE: 1 } && data.blocks) {
          setSolverKpis(data.kpis);
          // Refresh blocks & Gantt
          fetchBlocksAndGantt();
        }
      }
    } catch (err) {
      console.error('Failed to run optimization:', err);
    } finally {
      setOptimizing(false);
    }
  };

  useEffect(() => {
    fetchBlocksAndGantt();
  }, []);

  const getBlockTypeColor = (btype: string) => {
    switch (btype) {
      case 'INTEGRATED_BLOCK':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'POWER_BLOCK':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'TRAFFIC_BLOCK':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const hoursArray = Array.from({ length: 13 }, (_, i) => i * 2); // 0, 2, 4, ... 24

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <CalendarDays className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-100">AI Automatic Block Planner & Gantt Schedule</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
              Google OR-Tools CP-SAT
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Combinatorial block window scheduling with hard safety constraints & multi-department consolidation
          </p>
        </div>

        <button
          onClick={runOptimization}
          disabled={optimizing}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${optimizing ? 'animate-spin' : ''}`} />
          {optimizing ? 'Solving CP-SAT Model...' : 'Run AI Block Optimization'}
        </button>
      </div>

      {/* Optimizer Parameters Sandbox Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Mathematical Solver Parameters & Weight Tuner
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Horizon: {horizonDays} Days | Workers: 4
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Priority Weight */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Priority Weight (w_t)</span>
              <span className="font-mono text-indigo-300 font-bold">{priorityWeight}</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={priorityWeight}
              onChange={(e) => setPriorityWeight(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>

          {/* Consolidation Bonus */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Consolidation Bonus (γ)</span>
              <span className="font-mono text-indigo-300 font-bold">+{consolidationBonus}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={consolidationBonus}
              onChange={(e) => setConsolidationBonus(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>

          {/* Disruption Penalty */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Disruption Penalty (μ)</span>
              <span className="font-mono text-indigo-300 font-bold">-{disruptionPenalty}</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={disruptionPenalty}
              onChange={(e) => setDisruptionPenalty(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>

          {/* Rerouting Toggle */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-slate-300">Allow Train Rerouting</span>
            <button
              onClick={() => setAllowRerouting(!allowRerouting)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                allowRerouting
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {allowRerouting ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Scheduled Tasks</span>
          <div className="text-xl font-bold text-slate-100 mt-0.5">
            {solverKpis?.scheduled_tasks_count ?? 84}
            <span className="text-xs text-slate-500 font-normal ml-1">/ 102</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow">
          <span className="text-[10px] text-indigo-400 uppercase font-mono">Block Windows</span>
          <div className="text-xl font-bold text-indigo-400 mt-0.5">
            {solverKpis?.total_blocks_count ?? blocks.length}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow">
          <span className="text-[10px] text-purple-400 uppercase font-mono">Consolidated</span>
          <div className="text-xl font-bold text-purple-400 mt-0.5">
            {solverKpis?.consolidated_blocks_count ?? blocks.filter((b) => b.is_consolidated).length}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow">
          <span className="text-[10px] text-cyan-400 uppercase font-mono">Hours Saved</span>
          <div className="text-xl font-bold text-cyan-400 mt-0.5">
            {solverKpis?.block_hours_saved ?? 124}h
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow">
          <span className="text-[10px] text-emerald-400 uppercase font-mono">Solve Time</span>
          <div className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">
            {solverKpis?.solver_execution_time_ms ?? 142}ms
          </div>
        </div>
      </div>

      {/* Gantt Chart Interactive Visualizer (Recreating Concept Image Layout) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-cyan-400" />
              24-Hour Corridor Gantt Schedule (Blocks vs Train Paths)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Visual timeline showing maintenance blocks alongside train paths on Delhi – Mumbai corridor
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-purple-300">
              <span className="w-3 h-3 rounded bg-purple-500/40 border border-purple-400" />
              Integrated Block
            </span>
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-3 h-3 rounded bg-cyan-500/40 border border-cyan-400" />
              Power Block
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-3 h-3 rounded bg-amber-500/40 border border-amber-400" />
              Train Path
            </span>
          </div>
        </div>

        {/* Gantt Timeline Grid */}
        <div className="overflow-x-auto py-2">
          <div className="min-w-[850px] space-y-3">
            {/* Hour Axis */}
            <div className="grid grid-cols-12 text-[10px] font-mono text-slate-500 pl-36 pr-4 border-b border-slate-800 pb-2">
              {hoursArray.slice(0, 12).map((hr) => (
                <div key={hr} className="text-left">
                  {hr.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Sections Rows */}
            {ganttData?.sections.map((sec) => (
              <div key={sec.section_id} className="flex items-center gap-3 group">
                {/* Row Header */}
                <div className="w-32 flex-shrink-0">
                  <div className="text-xs font-semibold text-slate-200 truncate" title={sec.section_name}>
                    {sec.section_name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {sec.section_id.replace('SEC-', '')}
                  </div>
                </div>

                {/* Timeline Bar Track */}
                <div className="flex-1 h-12 bg-slate-950/70 border border-slate-800/80 rounded-lg relative overflow-hidden flex items-center">
                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-12 pointer-events-none divide-x divide-slate-800/30" />

                  {/* Maintenance Blocks */}
                  {sec.blocks.map((b) => {
                    const leftPct = (b.start_hour / 24.0) * 100;
                    const widthPct = Math.max(4, (b.duration_min / (24 * 60)) * 100);

                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          const fullBlk = blocks.find((item) => item.id === b.id);
                          if (fullBlk) setSelectedBlock(fullBlk);
                        }}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        className={`absolute h-7 rounded-md border flex items-center justify-between px-2 cursor-pointer shadow transition-all hover:scale-105 z-10 ${
                          b.block_type === 'INTEGRATED_BLOCK'
                            ? 'bg-purple-900/60 border-purple-500/80 text-purple-200'
                            : b.block_type === 'POWER_BLOCK'
                            ? 'bg-cyan-900/60 border-cyan-500/80 text-cyan-200'
                            : 'bg-blue-900/60 border-blue-500/80 text-blue-200'
                        }`}
                        title={`${b.id}: ${b.start_time} - ${b.end_time} (${b.duration_min}m)`}
                      >
                        <span className="text-[10px] font-bold font-mono truncate">{b.id}</span>
                        <span className="text-[9px] font-mono hidden sm:inline">{b.duration_min}m</span>
                      </div>
                    );
                  })}

                  {/* Train Paths */}
                  {sec.trains.map((trn) => {
                    const leftPct = (trn.start_hour / 24.0) * 100;
                    const widthPct = Math.max(3, ((trn.end_hour - trn.start_hour) / 24.0) * 100);

                    return (
                      <div
                        key={trn.id}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        className="absolute h-5 top-7 rounded border border-amber-500/40 bg-amber-950/50 text-amber-300 text-[9px] font-mono px-1 flex items-center truncate z-0 pointer-events-none"
                        title={`${trn.train_name} (${trn.entry_time} - ${trn.exit_time})`}
                      >
                        {trn.train_number}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Split Grid: Selected Block Inspector & Block Windows Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Selected Block Detail Card */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold">
                Block Detail Inspector
              </span>
              <h3 className="text-base font-bold text-slate-100 mt-0.5 flex items-center gap-2">
                {selectedBlock?.id || 'Select Block'}
              </h3>
            </div>

            {selectedBlock && (
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded border ${getBlockTypeColor(
                  selectedBlock.block_type
                )}`}
              >
                {selectedBlock.block_type.replace('_', ' ')}
              </span>
            )}
          </div>

          {selectedBlock ? (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 text-[11px]">Section</span>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {selectedBlock.section_name}
                  </div>
                </div>
                <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 text-[11px]">Window Duration</span>
                  <div className="font-mono font-bold text-cyan-400 mt-0.5">
                    {selectedBlock.duration_min} min (3.0 hrs)
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-slate-400 font-medium text-[11px]">AI Optimization Rationale</span>
                <p className="text-slate-200 text-xs leading-relaxed mt-0.5">
                  {selectedBlock.ai_explanation}
                </p>
              </div>

              {/* Assigned Tasks */}
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Assigned Tasks ({selectedBlock.assigned_task_ids.length})</span>
                  {selectedBlock.is_consolidated && (
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-1.5 py-0.2 rounded border border-purple-500/30">
                      Consolidated
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedBlock.assigned_task_ids.map((tid) => (
                    <span
                      key={tid}
                      className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded"
                    >
                      {tid}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              Select a block from the schedule to inspect details.
            </div>
          )}
        </div>

        {/* Right: Blocks Table */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-200">Scheduled Blocks Table</h3>
            <span className="text-xs font-mono text-slate-400">{blocks.length} Blocks</span>
          </div>

          <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                  <th className="py-2.5 px-3">Block ID</th>
                  <th className="py-2.5 px-3">Section</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-2 text-center">Tasks</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {blocks.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBlock(b)}
                    className={`cursor-pointer transition-colors ${
                      selectedBlock?.id === b.id ? 'bg-indigo-950/30' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-indigo-400">
                      {b.id}
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      {b.section_name}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded border ${getBlockTypeColor(
                          b.block_type
                        )}`}
                      >
                        {b.block_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {b.duration_min} min
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-cyan-400">
                      {b.task_count}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {b.safety_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
