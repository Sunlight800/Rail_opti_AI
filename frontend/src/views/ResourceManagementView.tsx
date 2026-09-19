import React, { useState, useEffect } from 'react';
import {
  Layers,
  Wrench,
  Zap,
  Users,
  Power,
  Radio,
  AlertCircle,
  ShieldCheck,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface CategoryData {
  category: string;
  label: string;
  description: string;
  total_capacity: number;
  allocated_count: number;
  available_count: number;
  availability_pct: number;
  resource_count: number;
}

interface AvailabilitySummary {
  overall_availability_pct: number;
  total_units: number;
  allocated_units: number;
  available_units: number;
  categories: Record<string, CategoryData>;
}

interface ActiveMachine {
  id: string;
  name: string;
  type: string;
  department_id: string;
  section_id: string;
  status: 'ACTIVE_BLOCK' | 'IDLE_DEPOT';
  current_block_id?: string;
  shift_window: string;
  operator_crew: string;
  maintenance_health_pct: number;
}

interface FeasibilityResult {
  feasible: boolean;
  task_id: string;
  section_id: string;
  satisfied_requirements: Array<{
    requirement_id: string;
    resource_id: string;
    resource_name: string;
    resource_type: string;
    requested_qty: number;
    available_qty: number;
    status: string;
  }>;
  shortages: Array<{
    requirement_id: string;
    resource_type: string;
    required_quantity: number;
    mandatory: boolean;
    reason: string;
  }>;
  alternatives_suggested: Array<{
    resource_id: string;
    name: string;
    resource_type: string;
    depot_section: string;
    transit_time_buffer_min: number;
    recommendation: string;
  }>;
  feasibility_score: number;
}

export const ResourceManagementView: React.FC = () => {
  const [summary, setSummary] = useState<AvailabilitySummary | null>(null);
  const [activeMachines, setActiveMachines] = useState<ActiveMachine[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Feasibility Checker State
  const [selectedTask, setSelectedTask] = useState<string>('MT-001');
  const [feasibility, setFeasibility] = useState<FeasibilityResult | null>(null);
  const [checkingFeasibility, setCheckingFeasibility] = useState<boolean>(false);

  const fetchResourcesData = async () => {
    setLoading(true);
    try {
      const [availRes, trackRes] = await Promise.all([
        fetch('/api/resources/availability'),
        fetch('/api/resources/active-tracking'),
      ]);
      if (availRes.ok) {
        setSummary(await availRes.json());
      }
      if (trackRes.ok) {
        setActiveMachines(await trackRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch resources data:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkTaskFeasibility = async (taskId: string) => {
    setCheckingFeasibility(true);
    try {
      const res = await fetch('/api/resources/feasibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      });
      if (res.ok) {
        setFeasibility(await res.json());
      }
    } catch (err) {
      console.error('Failed to check feasibility:', err);
    } finally {
      setCheckingFeasibility(false);
    }
  };

  useEffect(() => {
    fetchResourcesData();
    checkTaskFeasibility(selectedTask);
  }, []);

  const handleTaskChange = (taskId: string) => {
    setSelectedTask(taskId);
    checkTaskFeasibility(taskId);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'TRACK_MACHINES':
        return <Wrench className="w-5 h-5 text-indigo-400" />;
      case 'TOWER_WAGONS':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'CREW_DEPOTS':
        return <Users className="w-5 h-5 text-cyan-400" />;
      case 'POWER_DISCONNECT':
        return <Power className="w-5 h-5 text-rose-400" />;
      case 'TRAFFIC_CONTROLLERS':
        return <Radio className="w-5 h-5 text-purple-400" />;
      case 'SPEED_RESTRICTION_BOARDS':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'SAFETY_GEAR':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'ESCORTS':
        return <Shield className="w-5 h-5 text-blue-400" />;
      default:
        return <Layers className="w-5 h-5 text-slate-400" />;
    }
  };

  const filteredMachines = activeMachines.filter((m) => {
    const matchesCat = selectedCategory === 'ALL' || m.type === selectedCategory;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.section_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-100">Resource Planning & Capacity Engine</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
              8 Categories Tracked
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Real-time availability, shift scheduling, shortage detection & alternative substitution
          </p>
        </div>

        <button
          onClick={fetchResourcesData}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Top Banner: Overall Radial Gauge (76% Available) + Capacity Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Overall Availability Radial Gauge Card (Recreating Concept Image) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            System Resource Availability
          </h3>

          {/* Radial Gauge Simulation */}
          <div className="relative w-44 h-44 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className="text-cyan-400"
                strokeDasharray="251.2"
                strokeDashoffset={
                  251.2 - (251.2 * (summary?.overall_availability_pct || 76)) / 100
                }
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-cyan-400 tracking-tight">
                {summary ? summary.overall_availability_pct.toFixed(0) : '76'}%
              </span>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Available
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-4 border-t border-slate-800/80 text-xs">
            <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
              <span className="text-slate-500">Allocated Units</span>
              <div className="text-lg font-bold text-slate-200 mt-0.5">
                {summary?.allocated_units ?? 18}
              </div>
            </div>
            <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
              <span className="text-slate-500">Available Units</span>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">
                {summary?.available_units ?? 68}
              </div>
            </div>
          </div>
        </div>

        {/* 8 Categories Capacity Grid */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {summary &&
            Object.values(summary.categories).map((cat) => (
              <div
                key={cat.category}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-1.5 bg-slate-800 rounded-lg">
                      {getCategoryIcon(cat.category)}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {cat.availability_pct.toFixed(0)}%
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 truncate">
                    {cat.label}
                  </h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Avail: <strong className="text-slate-200">{cat.available_count}</strong>/{cat.total_capacity}</span>
                    <span>Alloc: <strong className="text-amber-400">{cat.allocated_count}</strong></span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.availability_pct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Interactive Resource Feasibility Checker & Alternative Substitution */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Task Resource Feasibility & Alternative Suggester
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify if scheduled task requirements can be satisfied by current depot capacity
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Check Task:</span>
            <select
              value={selectedTask}
              onChange={(e) => handleTaskChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="MT-001">MT-001: Track 7A Rail Fracture (Requires 5 resource types)</option>
              <option value="MT-002">MT-002: Signal Point 12 (Requires S&T Crew)</option>
              <option value="MT-003">MT-003: OHE Catenary (Requires Tower Wagon)</option>
              <option value="MT-004">MT-004: Bridge 42 Pier (Requires Inspection Team)</option>
            </select>
          </div>
        </div>

        {/* Feasibility Result Overview */}
        {feasibility && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Feasibility Status Card */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              feasibility.feasible
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {feasibility.feasible ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                )}
                <span className="font-bold text-sm">
                  {feasibility.feasible ? 'FEASIBILITY CONFIRMED' : 'RESOURCE SHORTAGE DETECTED'}
                </span>
              </div>
              <p className="text-xs mt-2 text-slate-300">
                {feasibility.feasible
                  ? 'All mandatory machines, gangmen, and safety gear are available for the selected task.'
                  : 'Critical resource constraints cannot be met from the local depot. Mobilize alternatives.'}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 text-xs font-mono">
                Feasibility Score: <strong>{feasibility.feasibility_score}%</strong>
              </div>
            </div>

            {/* Satisfied Requirements */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Satisfied Resources ({feasibility.satisfied_requirements.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {feasibility.satisfied_requirements.map((sat) => (
                  <div key={sat.requirement_id} className="text-xs flex items-center justify-between bg-slate-900/60 p-1.5 rounded">
                    <span className="text-slate-200 truncate">{sat.resource_name}</span>
                    <span className="text-emerald-400 font-mono text-[10px] font-bold">✓ QTY: {sat.requested_qty}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alternatives Suggested */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                AI Suggested Alternative Mobilization
              </span>
              {feasibility.alternatives_suggested.length > 0 ? (
                <div className="space-y-2">
                  {feasibility.alternatives_suggested.map((alt) => (
                    <div key={alt.resource_id} className="text-xs bg-indigo-950/40 border border-indigo-500/30 p-2 rounded-lg">
                      <div className="font-bold text-indigo-300 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        {alt.name}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">
                        {alt.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic mt-2">
                  No inter-depot substitution required. Local depot resources are fully sufficient.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Machine & Equipment Tracking Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            Active Machine & Equipment Fleet Tracking
          </h3>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search machine, ID, depot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-48"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Categories</option>
              <option value="TRACK_MACHINES">Track Machines</option>
              <option value="TOWER_WAGONS">Tower Wagons</option>
              <option value="CREW_DEPOTS">Crew Depots</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                <th className="py-2.5 px-3">Resource ID</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-3">Base Depot</th>
                <th className="py-2.5 px-3">Shift Window</th>
                <th className="py-2.5 px-3">Operator Crew</th>
                <th className="py-2.5 px-2 text-center">Health</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredMachines.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-cyan-400">
                    {m.id}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    {m.name}
                  </td>
                  <td className="py-3 px-2 font-mono text-[11px] text-slate-400">
                    {m.type}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {m.section_id}
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {m.shift_window}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {m.operator_crew}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-[11px] font-mono font-bold text-emerald-400">
                      {m.maintenance_health_pct}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        m.status === 'ACTIVE_BLOCK'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {m.status === 'ACTIVE_BLOCK' ? 'IN BLOCK' : 'STANDBY'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
