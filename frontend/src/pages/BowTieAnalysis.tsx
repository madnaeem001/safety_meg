import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBowTieScenarios, useBowTieStats } from '../api/hooks/useAPIHooks';
import { SMButton } from '../components/ui';
import {
  ArrowLeft, AlertTriangle, Shield, ShieldAlert, ChevronRight, ChevronDown,
  Plus, Search, Filter, Eye, Activity, Target, Zap, CheckCircle2,
  XCircle, Brain, TrendingUp, BarChart3, Users, MapPin, Calendar,
  AlertCircle, Layers, ArrowRight, ArrowDown, Flame, Wind,
  Droplets, Settings, RefreshCw, Clock, FileText, Download
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────
interface BowTieScenario {
  id: string;
  title: string;
  topEvent: string;
  hazard: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: Threat[];
  consequences: Consequence[];
  status: 'draft' | 'active' | 'review' | 'archived';
  lastUpdated: string;
  owner: string;
}

interface Threat {
  id: string;
  name: string;
  preventiveBarriers: Barrier[];
}

interface Consequence {
  id: string;
  name: string;
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
  mitigativeBarriers: Barrier[];
}

interface Barrier {
  id: string;
  name: string;
  type: 'engineering' | 'administrative' | 'ppe' | 'procedural';
  effectiveness: number; // 0-100
  status: 'active' | 'degraded' | 'failed';
}

const riskColors = {
  low: { text: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
  medium: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  high: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  critical: { text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20' },
};

const barrierTypeColors = {
  engineering: 'bg-accent/10 text-accent border-accent/20',
  administrative: 'bg-accent/10 text-accent border-accent/20',
  ppe: 'bg-warning/10 text-warning border-warning/20',
  procedural: 'bg-accent/10 text-accent border-accent/20',
};

const barrierStatusColors = {
  active: 'text-success',
  degraded: 'text-warning',
  failed: 'text-danger',
};

// ── Bow Tie Diagram Component ────────────────────────────────────
const BowTieDiagram: React.FC<{ scenario: BowTieScenario }> = ({ scenario }) => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 overflow-x-auto">
    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
      <Layers className="w-4 h-4 text-accent" /> Bow Tie Diagram — {scenario.title}
    </h3>
    <div className="flex items-center gap-2 min-w-[900px]">
      {/* Threats Column */}
      <div className="flex-1 space-y-2">
        <p className="text-[10px] font-bold text-danger uppercase tracking-wider text-center mb-2">Threats</p>
        {scenario.threats.map(t => (
          <div key={t.id} className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-xs text-danger font-medium text-center">
            {t.name}
          </div>
        ))}
      </div>

      {/* Preventive Barriers */}
      <div className="flex-1 space-y-2">
        <p className="text-[10px] font-bold text-accent uppercase tracking-wider text-center mb-2">Preventive Barriers</p>
        {scenario.threats.flatMap(t => t.preventiveBarriers).slice(0, 4).map(b => (
          <div key={b.id} className={`border rounded-xl p-2 text-[10px] font-medium text-center ${barrierTypeColors[b.type]}`}>
            {b.name}
            <div className="mt-1 w-full bg-white/10 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${b.effectiveness >= 85 ? 'bg-success' : b.effectiveness >= 70 ? 'bg-warning' : 'bg-danger'}`}
                style={{ width: `${b.effectiveness}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Arrow → */}
      <div className="flex items-center px-2">
        <ArrowRight className="w-6 h-6 text-text-muted" />
      </div>

      {/* Top Event (Center) */}
      <div className="flex-shrink-0 w-48">
        <div className={`${riskColors[scenario.riskLevel].bg} border ${riskColors[scenario.riskLevel].border} rounded-2xl p-4 text-center`}>
          <div className="w-12 h-12 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-2">
            <Flame className={`w-6 h-6 ${riskColors[scenario.riskLevel].text}`} />
          </div>
          <p className="text-xs font-bold text-white">{scenario.topEvent}</p>
          <p className={`text-[10px] mt-1 ${riskColors[scenario.riskLevel].text}`}>
            {scenario.hazard}
          </p>
        </div>
      </div>

      {/* Arrow → */}
      <div className="flex items-center px-2">
        <ArrowRight className="w-6 h-6 text-text-muted" />
      </div>

      {/* Mitigative Barriers */}
      <div className="flex-1 space-y-2">
        <p className="text-[10px] font-bold text-success uppercase tracking-wider text-center mb-2">Recovery Barriers</p>
        {scenario.consequences.flatMap(c => c.mitigativeBarriers).slice(0, 4).map(b => (
          <div key={b.id} className={`border rounded-xl p-2 text-[10px] font-medium text-center ${barrierTypeColors[b.type]}`}>
            {b.name}
            <div className="mt-1 w-full bg-white/10 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${b.effectiveness >= 85 ? 'bg-success' : b.effectiveness >= 70 ? 'bg-warning' : 'bg-danger'}`}
                style={{ width: `${b.effectiveness}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Consequences Column */}
      <div className="flex-1 space-y-2">
        <p className="text-[10px] font-bold text-warning uppercase tracking-wider text-center mb-2">Consequences</p>
        {scenario.consequences.map(c => (
          <div key={c.id} className="bg-warning/10 border border-warning/20 rounded-xl p-3 text-xs text-warning font-medium text-center">
            {c.name}
            <span className={`block text-[9px] mt-1 capitalize ${c.severity === 'catastrophic' ? 'text-danger' : c.severity === 'major' ? 'text-warning' : 'text-warning'}`}>
              {c.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Main Page Component ──────────────────────────────────────────
export const BowTieAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const { data: scenariosData } = useBowTieScenarios();
  const { data: statsData } = useBowTieStats();
  const scenarios: BowTieScenario[] = (scenariosData as BowTieScenario[] | null) ?? [];
  const [selectedScenario, setSelectedScenario] = useState<BowTieScenario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'diagram' | 'barriers' | 'matrix'>('diagram');

  // Auto-select first scenario once data loads
  useEffect(() => {
    if (!selectedScenario && scenarios.length > 0) {
      setSelectedScenario(scenarios[0]);
    }
  }, [scenarios, selectedScenario]);

  const filteredScenarios = scenarios.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.topEvent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allBarriers = selectedScenario ? [
    ...selectedScenario.threats.flatMap(t => t.preventiveBarriers.map(b => ({ ...b, side: 'preventive' as const }))),
    ...selectedScenario.consequences.flatMap(c => c.mitigativeBarriers.map(b => ({ ...b, side: 'mitigative' as const }))),
  ] : [];

  const stats = {
    total: statsData?.total ?? scenarios.length,
    critical: statsData?.critical ?? scenarios.filter(s => s.riskLevel === 'critical').length,
    totalBarriers: statsData?.totalBarriers ?? 0,
    degraded: statsData?.degradedBarriers ?? 0,
  };

  const tabs = [
    { id: 'diagram', label: 'Bow Tie Diagram', icon: Layers },
    { id: 'barriers', label: 'Barrier Health', icon: Shield },
    { id: 'matrix', label: 'Risk Matrix', icon: BarChart3 },
  ];

  return (
    <div className="page-wrapper">

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <SMButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          />
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-[10px] uppercase tracking-[0.3em]">
              <Layers className="w-4 h-4" /> Bow Tie Analysis
            </div>
            <h1 className="page-title">Risk Scenario Analysis</h1>
          </div>
          <button className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-sm font-medium hover:bg-cyan-500/30 transition-colors">
            <Plus className="w-4 h-4" /> New Scenario
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Scenarios', value: stats.total, icon: Layers, color: 'text-accent' },
            { label: 'Critical Risks', value: stats.critical, icon: AlertTriangle, color: 'text-danger' },
            { label: 'Active Barriers', value: stats.totalBarriers, icon: Shield, color: 'text-success' },
            { label: 'Degraded Barriers', value: stats.degraded, icon: AlertCircle, color: 'text-warning' },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mb-2 ${kpi.color}`}><kpi.icon className="w-4 h-4" /></div>
              <p className="text-2xl font-black text-white">{kpi.value}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Scenario Selector + Tabs */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder="Search scenarios..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-white/5 text-text-muted border border-white/10 hover:bg-white/10'}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {filteredScenarios.map(s => (
            <motion.button key={s.id} onClick={() => setSelectedScenario(s)}
              className={`text-left bg-white/5 backdrop-blur-sm border rounded-2xl p-4 transition-all ${selectedScenario?.id === s.id ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 hover:bg-white/[0.07]'}`}
              whileTap={{ scale: 0.98 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-text-muted">{s.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${riskColors[s.riskLevel].bg} ${riskColors[s.riskLevel].text} border ${riskColors[s.riskLevel].border}`}>
                  {s.riskLevel.toUpperCase()}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{s.title}</h3>
              <p className="text-xs text-text-muted">{s.topEvent}</p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-text-muted">
                <Users className="w-3 h-3" /> {s.owner}
                <span className="mx-1">·</span>
                <Clock className="w-3 h-3" /> {s.lastUpdated}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        {selectedScenario && (
          <AnimatePresence mode="wait">
            {activeTab === 'diagram' && (
              <motion.div key="diagram" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BowTieDiagram scenario={selectedScenario} />
              </motion.div>
            )}

            {activeTab === 'barriers' && (
              <motion.div key="barriers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-4">Barrier Health — {selectedScenario.title}</h3>
                  <div className="space-y-2">
                    {allBarriers.map((b, i) => (
                      <div key={b.id} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <div className={`w-2 h-2 rounded-full ${barrierStatusColors[b.status] === 'text-success' ? 'bg-success' : barrierStatusColors[b.status] === 'text-warning' ? 'bg-warning' : 'bg-danger'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{b.name}</p>
                          <p className="text-[10px] text-text-muted capitalize">{b.type} · {b.side}</p>
                        </div>
                        <div className="w-24">
                          <div className="w-full bg-white/10 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full transition-all ${b.effectiveness >= 85 ? 'bg-success' : b.effectiveness >= 70 ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${b.effectiveness}%` }} />
                          </div>
                        </div>
                        <span className="text-xs font-bold text-white w-10 text-right">{b.effectiveness}%</span>
                        <span className={`text-[10px] font-bold capitalize ${barrierStatusColors[b.status]}`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'matrix' && (
              <motion.div key="matrix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-4">5×5 Risk Matrix</h3>
                  <div className="grid grid-cols-6 gap-1.5">
                    <div className="col-span-1" />
                    {['Rare', 'Unlikely', 'Possible', 'Likely', 'Certain'].map(l => (
                      <div key={l} className={`text-center text-[9px] font-bold text-text-muted uppercase tracking-wider py-1`}>{l}</div>
                    ))}
                    {['Catastrophic', 'Major', 'Moderate', 'Minor', 'Negligible'].map((sev, si) => (
                      <React.Fragment key={sev}>
                        <div className="flex items-center justify-end pr-2 text-[9px] font-bold text-text-muted uppercase tracking-wider">{sev}</div>
                        {[1, 2, 3, 4, 5].map(li => {
                          const score = (5 - si) * li;
                          const hasScenario = mockScenarios.some(s => {
                            const sevMap: Record<string, number> = { critical: 5, high: 4, medium: 3, low: 2 };
                            return (sevMap[s.riskLevel] || 0) === (5 - si) && li === Math.min(s.threats.length + 1, 5);
                          });
                          return (
                            <div key={li} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                              score >= 15 ? 'bg-danger/20 text-danger' : score >= 8 ? 'bg-warning/20 text-warning' : score >= 4 ? 'bg-warning/10 text-warning' : 'bg-success/20 text-success'
                            } ${hasScenario ? 'ring-2 ring-surface-border' : ''}`}>
                              {hasScenario ? '●' : score}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex justify-center mt-3 text-[10px] text-text-muted font-bold uppercase tracking-wider">Likelihood →</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

    </div>
  );
};

export default BowTieAnalysis;
