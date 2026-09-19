import React, { useState, useEffect } from 'react';
import {
  Activity,
  Train,
  MapPin,
  AlertTriangle,
  Clock,
  Gauge,
  CheckCircle2,
  Filter,
  Search,
  RefreshCw,
  Info,
  Navigation,
} from 'lucide-react';

interface TopologyNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
}

interface TopologyEdge {
  section_id: string;
  name: string;
  line_type: string;
  max_speed_kmh: number;
  length_km: number;
  start_km: number;
  end_km: number;
  status: string;
  gis_coordinates: number[][];
  active_blocks: string[];
  active_trains: string[];
  speed_restriction_kmh?: number | null;
}

interface CorridorTopology {
  corridor_id: string;
  corridor_name: string;
  total_length_km: number;
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

interface TrainRecord {
  id: string;
  train_number: string;
  train_name: string;
  train_category: string;
  priority_rank: number;
  current_section_id: string;
  scheduled_entry: string;
  scheduled_exit: string;
  delay_minutes: number;
  punctuality_status: 'ON_TIME' | 'DELAYED';
}

interface OperationsLiveStatus {
  total_trains_monitored: number;
  active_corridors: number;
  total_sections: number;
  active_blocks_count: number;
  active_speed_restrictions: Array<{
    section_id: string;
    location_km: string;
    restricted_speed_kmh: number;
    reason: string;
    imposed_date: string;
  }>;
  system_punctuality_pct: number;
  average_train_delay_min: number;
}

export const OperationsView: React.FC = () => {
  const [topology, setTopology] = useState<CorridorTopology | null>(null);
  const [trains, setTrains] = useState<TrainRecord[]>([]);
  const [liveStatus, setLiveStatus] = useState<OperationsLiveStatus | null>(null);
  const [selectedSection, setSelectedSection] = useState<TopologyEdge | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOperationsData = async () => {
    setLoading(true);
    try {
      const [topRes, trnRes, statRes] = await Promise.all([
        fetch('/api/operations/corridors/COR-DEL-BOM/topology'),
        fetch('/api/operations/trains'),
        fetch('/api/operations/live-status'),
      ]);

      if (topRes.ok) {
        const topData = await topRes.json();
        setTopology(topData);
        if (topData.edges && topData.edges.length > 0) {
          setSelectedSection(topData.edges[0]);
        }
      }
      if (trnRes.ok) setTrains(await trnRes.json());
      if (statRes.ok) setLiveStatus(await statRes.json());
    } catch (err) {
      console.error('Failed to fetch operations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationsData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WARNING':
        return 'border-amber-500/60 bg-amber-500/10 text-amber-300';
      case 'CRITICAL':
        return 'border-rose-500/60 bg-rose-500/10 text-rose-300';
      default:
        return 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300';
    }
  };

  const getTrainCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'COACHING_PREMIUM':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'COACHING_MAIL':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'PASSENGER':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'GOODS':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const filteredTrains = trains.filter((t) => {
    const matchesCat = selectedCategory === 'ALL' || t.train_category === selectedCategory;
    const matchesSearch =
      t.train_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.train_number.includes(searchQuery) ||
      t.current_section_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-100">Railway Operations & Network Topology</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
              Delhi – Mumbai Golden Quadrilateral
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Section occupancies, speed restrictions, live train paths, and corridor infrastructure
          </p>
        </div>

        <button
          onClick={fetchOperationsData}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Live Status
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Monitored Trains</span>
            <Train className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {liveStatus?.total_trains_monitored ?? 20}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Across 10 sections</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>System Punctuality</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {liveStatus?.system_punctuality_pct ?? 94.2}%
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Avg delay: 4.5 min</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Speed Restrictions</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {liveStatus?.active_speed_restrictions.length ?? 1}
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono">30 km/h caution (Track 7A)</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active Blocks</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {liveStatus?.active_blocks_count ?? 4}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Scheduled & integrated</span>
        </div>
      </div>

      {/* Speed Restriction Warning Banner */}
      {liveStatus?.active_speed_restrictions.map((sr, idx) => (
        <div
          key={idx}
          className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-200">
                  SPEED RESTRICTION IN EFFECT: {sr.restricted_speed_kmh} KM/H
                </span>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  {sr.section_id} ({sr.location_km})
                </span>
              </div>
              <p className="text-xs text-amber-300/80 mt-0.5">{sr.reason}</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
            Imposed: {sr.imposed_date}
          </span>
        </div>
      ))}

      {/* Main Grid: Interactive Network Topology Graph + Section Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Topological Visual Graph (Recreating Concept Image Layout) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-400" />
                Corridor Section Diagram: Delhi (NDLS) to Mumbai (MMCT)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any section node or line segment to inspect operational telemetry
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-500/30">
              1,384 km Track
            </span>
          </div>

          {/* SVG Railway Topology Schematic */}
          <div className="w-full overflow-x-auto py-4">
            <div className="min-w-[700px] flex items-center justify-between relative px-6 py-8">
              {/* Connecting Track Line */}
              <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-2 bg-slate-800 rounded-full" />

              {/* Schematic Stations & Segments */}
              {topology?.nodes.slice(0, 8).map((node, i) => {
                const associatedEdge = topology.edges[i];
                const isSelected = selectedSection?.section_id === associatedEdge?.section_id;

                return (
                  <div key={node.id} className="relative z-10 flex flex-col items-center group">
                    {/* Node Dot */}
                    <button
                      onClick={() => associatedEdge && setSelectedSection(associatedEdge)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-cyan-500 border-white scale-125 shadow-lg shadow-cyan-500/50'
                          : 'bg-slate-900 border-slate-600 hover:border-cyan-400'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-slate-100" />
                    </button>

                    {/* Station Name */}
                    <span className="text-[11px] font-bold text-slate-200 mt-2 tracking-wide font-mono">
                      {node.id}
                    </span>
                    <span className="text-[9px] text-slate-500 text-center max-w-[70px] truncate">
                      {node.name}
                    </span>

                    {/* Speed restriction caution indicator */}
                    {node.id === 'NDLS' && (
                      <span className="absolute -top-6 text-[9px] font-bold bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-mono animate-bounce">
                        30 km/h
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sections List Horizontal Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2 border-t border-slate-800">
            {topology?.edges.map((sec) => (
              <button
                key={sec.section_id}
                onClick={() => setSelectedSection(sec)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedSection?.section_id === sec.section_id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-slate-400">{sec.section_id.replace('SEC-', '')}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getStatusColor(
                      sec.status
                    )}`}
                  >
                    {sec.status}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-200 truncate">
                  {sec.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>{sec.length_km} km</span>
                  <span>{sec.max_speed_kmh} km/h</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Selected Section Inspector */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] font-mono uppercase text-slate-400">
              Section Telemetry & Constraints
            </span>
            <h3 className="text-base font-bold text-slate-100 mt-0.5">
              {selectedSection?.name || 'Select a Section'}
            </h3>
            <span className="text-xs font-mono text-blue-400">{selectedSection?.section_id}</span>
          </div>

          {selectedSection && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 text-[11px]">Track Configuration</span>
                  <div className="font-mono font-bold text-slate-200 mt-0.5">
                    {selectedSection.line_type}
                  </div>
                </div>
                <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 text-[11px]">Max Permissible Speed</span>
                  <div className="font-mono font-bold text-cyan-400 mt-0.5">
                    {selectedSection.max_speed_kmh} km/h
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 text-[11px]">Chainage Range</span>
                  <div className="font-mono text-slate-300 mt-0.5">
                    KM {selectedSection.start_km} – {selectedSection.end_km}
                  </div>
                </div>
                <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 text-[11px]">Section Length</span>
                  <div className="font-mono text-slate-300 mt-0.5">
                    {selectedSection.length_km} km
                  </div>
                </div>
              </div>

              {/* Active Blocks on Section */}
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-slate-400 font-medium text-[11px]">Active Maintenance Blocks</span>
                {selectedSection.active_blocks.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedSection.active_blocks.map((blk) => (
                      <span
                        key={blk}
                        className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded"
                      >
                        {blk}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic text-[11px]">No active blocks scheduled.</p>
                )}
              </div>

              {/* Speed Restriction Indicator */}
              {selectedSection.speed_restriction_kmh && (
                <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Caution Order Imposed
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Caution order in effect ({selectedSection.speed_restriction_kmh} km/h). Extra train transit time buffer added automatically to solver.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Train Traffic & Timetable Tracking Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Train className="w-4 h-4 text-blue-400" />
              Live Train Movement & Corridor Timetable
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Coaching and freight trains operating along Golden Quadrilateral route
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search train name or no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-48"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Categories</option>
              <option value="COACHING_PREMIUM">Premium (Rajdhani/VB)</option>
              <option value="COACHING_MAIL">Mail / Express</option>
              <option value="PASSENGER">Passenger</option>
              <option value="GOODS">Goods / Freight</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                <th className="py-2.5 px-3">Train No.</th>
                <th className="py-2.5 px-3">Train Name</th>
                <th className="py-2.5 px-2">Category</th>
                <th className="py-2.5 px-2 text-center">Priority</th>
                <th className="py-2.5 px-3">Current Section</th>
                <th className="py-2.5 px-3">Window</th>
                <th className="py-2.5 px-3 text-right">Punctuality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredTrains.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-blue-400">
                    {t.train_number}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    {t.train_name}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${getTrainCategoryBadge(
                        t.train_category
                      )}`}
                    >
                      {t.train_category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center font-mono font-bold text-slate-300">
                    Rank {t.priority_rank}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {t.current_section_id}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {t.scheduled_entry} – {t.scheduled_exit}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        t.punctuality_status === 'ON_TIME'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {t.punctuality_status === 'ON_TIME'
                        ? 'ON TIME'
                        : `+${t.delay_minutes}m DELAY`}
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
