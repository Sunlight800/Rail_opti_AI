import React from 'react';
import {
  Brain,
  ShieldCheck,
  Calendar,
  Layers,
  AlertTriangle,
  GitMerge,
  Sliders,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LandingPageViewProps {
  onEnterDashboard: () => void;
  onOpenLogin: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onEnterDashboard,
  onOpenLogin,
}) => {
  const features = [
    {
      icon: Brain,
      title: 'AI Risk & Health Intelligence',
      description: 'Calculates asset degradation, failure probabilities, and predictive maintenance urgency from inspection logs and traffic load.',
      color: 'text-purple-400',
    },
    {
      icon: Layers,
      title: '6-Factor Priority Engine',
      description: 'Normalized 0–100 multi-criteria scoring combining safety risk, failure probability, asset criticality, and defect severity.',
      color: 'text-rose-400',
    },
    {
      icon: Calendar,
      title: 'Automatic Block Planning',
      description: 'Powered by Google OR-Tools CP-SAT to automatically generate conflict-free maintenance windows across busy corridors.',
      color: 'text-blue-400',
    },
    {
      icon: GitMerge,
      title: 'Multi-Dept Consolidation',
      description: 'Integrates Engineering, TRD, and S&T tasks into unified shadow blocks, saving hours of train disruption.',
      color: 'text-emerald-400',
    },
    {
      icon: Sliders,
      title: 'What-If Operational Simulator',
      description: 'Simulate train delays, sudden equipment outages, or freight surges and observe real-time AI re-optimization.',
      color: 'text-cyan-400',
    },
    {
      icon: ShieldCheck,
      title: 'Human-in-the-Loop Governance',
      description: 'Strict authorization gates: human controllers review, modify, or reject plans with structured feedback.',
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="min-h-screen bg-railnavy-950 text-slate-100 py-12 px-6 max-w-6xl mx-auto text-left space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          SIH26027 — Ministry of Railways
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          AI-Powered Automatic Block Planning for Smarter Railway Maintenance
        </h1>
        <p className="text-sm md:text-base text-slate-300">
          Maximize asset availability, minimize train disruption, optimize maintenance resources, and streamline inter-departmental block coordination.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={onEnterDashboard}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition"
          >
            Launch Control Center <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenLogin}
            className="px-6 py-3 rounded-xl border border-railnavy-700 bg-railnavy-900/80 hover:bg-railnavy-800 text-slate-200 font-semibold text-sm transition"
          >
            Sign In with Role
          </button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-railnavy-900/70 border border-railnavy-800 hover:border-railnavy-700 transition space-y-2.5"
            >
              <div className={`p-2.5 rounded-xl bg-railnavy-950 w-fit ${f.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          );
        })}
      </div>

      {/* Architecture Highlights */}
      <div className="p-8 rounded-2xl bg-railnavy-900/50 border border-railnavy-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h2 className="text-xl font-bold text-white">
            Engineered for Enterprise Railway Operations
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Built with FastAPI, Google OR-Tools CP-SAT, and React. Delivers deterministic constraint satisfaction, immutable plan versioning, complete audit trails, and explainable AI recommendations.
          </p>
        </div>
        <button
          onClick={onEnterDashboard}
          className="px-5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-bold transition whitespace-nowrap"
        >
          Explore Live Demo →
        </button>
      </div>
    </div>
  );
};
