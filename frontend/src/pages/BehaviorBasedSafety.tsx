import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Eye, Users, TrendingUp, CheckCircle2, AlertTriangle,
  Clock, MapPin, Shield, Brain, Target, Award, MessageSquare,
  ThumbsUp, ThumbsDown, Search, Filter, BarChart3, Activity,
  Plus, Calendar, ChevronRight, Star, Heart, Zap
} from 'lucide-react';
import { useBBSObservations, useCreateBBSObservation } from '../api/hooks/useAPIHooks';

interface Observation {
  id: string;
  observer: string;
  date: string;
  location: string;
  type: 'safe' | 'at_risk';
  category: string;
  behavior: string;
  feedback: string;
  status: 'open' | 'coached' | 'resolved';
  priority: 'low' | 'medium' | 'high';
}

const mockObservations: Observation[] = [
  { id: 'BBS-001', observer: 'Mike Rodriguez', date: '2026-02-22', location: 'Warehouse A', type: 'at_risk', category: 'PPE Usage', behavior: 'Worker not wearing safety goggles during grinding', feedback: 'Coaching provided on PPE requirements for grinding operations', status: 'coached', priority: 'high' },
  { id: 'BBS-002', observer: 'Sarah Chen', date: '2026-02-21', location: 'Assembly Line B', type: 'safe', category: 'Lockout/Tagout', behavior: 'Proper LOTO procedure followed before machine maintenance', feedback: 'Positive recognition given for exemplary safety behavior', status: 'resolved', priority: 'low' },
  { id: 'BBS-003', observer: 'James Wilson', date: '2026-02-21', location: 'Loading Dock', type: 'at_risk', category: 'Body Position', behavior: 'Improper lifting technique observed for 50lb boxes', feedback: 'Referred to ergonomics training program', status: 'open', priority: 'medium' },
  { id: 'BBS-004', observer: 'Lisa Park', date: '2026-02-20', location: 'Chemical Storage', type: 'safe', category: 'Housekeeping', behavior: 'Excellent organization and labeling of chemical containers', feedback: 'Team recognized in safety meeting', status: 'resolved', priority: 'low' },
  { id: 'BBS-005', observer: 'Tom Anderson', date: '2026-02-20', location: 'Plant C - Welding', type: 'at_risk', category: 'PPE Usage', behavior: 'Welding without proper face shield in designated area', feedback: 'Immediate coaching provided, near-miss filed', status: 'coached', priority: 'high' },
  { id: 'BBS-006', observer: 'Anna Martinez', date: '2026-02-19', location: 'Office Area', type: 'safe', category: 'Ergonomics', behavior: 'Workstation properly adjusted with monitor at eye level', feedback: 'Shared as example in ergonomics newsletter', status: 'resolved', priority: 'low' },
  { id: 'BBS-007', observer: 'David Kim', date: '2026-02-19', location: 'Parking Lot', type: 'at_risk', category: 'Walking/Working Surface', behavior: 'Running on wet surface near entrance', feedback: 'Additional signage requested for slip hazard', status: 'open', priority: 'medium' },
  { id: 'BBS-008', observer: 'Maria Garcia', date: '2026-02-18', location: 'Lab D', type: 'safe', category: 'Chemical Handling', behavior: 'Proper use of fume hood and gloves during titration', feedback: 'Commended for consistent safety behavior', status: 'resolved', priority: 'low' },
];

const categories = ['All', 'PPE Usage', 'Body Position', 'Lockout/Tagout', 'Housekeeping', 'Chemical Handling', 'Ergonomics', 'Walking/Working Surface'];

const statusConfig = {
  open: { label: 'Open', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  coached: { label: 'Coached', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  resolved: { label: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

export const BehaviorBasedSafety: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'observations' | 'coaching' | 'analytics'>('observations');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterType, setFilterType] = useState<'all' | 'safe' | 'at_risk'>('all');

  // ── Real API Data ──────────────────────────────────────────────────────
  const { data: backendBBS } = useBBSObservations({ type: filterType !== 'all' ? filterType : undefined });
  const { mutate: createObservation } = useCreateBBSObservation();

  // Merge backend observations with mock data
  const allObservations = React.useMemo(() => {
    const backendConverted = (backendBBS || []).map((o: any) => ({
      id: `BBS-API-${o.id}`,
      observer: o.observerName,
      date: o.observationDate || new Date().toISOString().split('T')[0],
      location: `${o.workArea}, ${o.department}`,
      type: (o.observationType === 'safe' ? 'safe' : 'at_risk') as 'safe' | 'at_risk',
      category: o.category,
      behavior: o.behaviorObserved,
      feedback: o.feedback || '',
      status: (o.status === 'resolved' ? 'resolved' : o.acknowledged ? 'coached' : 'open') as 'open' | 'coached' | 'resolved',
      priority: 'medium' as 'low' | 'medium' | 'high',
    }));
    return [...mockObservations, ...backendConverted];
  }, [backendBBS]);

  const filteredObs = allObservations.filter(o => {
    const matchesSearch = o.behavior.toLowerCase().includes(searchTerm.toLowerCase()) || o.location.toLowerCase().includes(searchTerm.toLowerCase()) || o.observer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCategory === 'All' || o.category === filterCategory;
    const matchesType = filterType === 'all' || o.type === filterType;
    return matchesSearch && matchesCat && matchesType;
  });

  const stats = {
    totalObs: allObservations.length,
    safeObs: allObservations.filter(o => o.type === 'safe').length,
    atRiskObs: allObservations.filter(o => o.type === 'at_risk').length,
    coachingSessions: allObservations.filter(o => o.status === 'coached').length,
    safetyRate: allObservations.length > 0 ? Math.round((allObservations.filter(o => o.type === 'safe').length / allObservations.length) * 100) : 0,
    openActions: allObservations.filter(o => o.status === 'open').length,
  };

  const tabs = [
    { id: 'observations', label: 'Observations', icon: Eye },
    { id: 'coaching', label: 'Coaching Log', icon: MessageSquare },
    { id: 'analytics', label: 'Leading Indicators', icon: TrendingUp },
  ];

  return (
    <div className="page-wrapper">


      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-[10px] uppercase tracking-[0.3em]">
              <Eye className="w-4 h-4" /> Behavior-Based Safety
            </div>
            <h1 className="page-title">Observations & Coaching</h1>
          </div>
          <button className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-sm font-medium hover:bg-cyan-500/30 transition-colors">
            <Plus className="w-4 h-4" /> New Observation
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Observations', value: stats.totalObs, icon: Eye, color: 'text-cyan-400' },
            { label: 'Safe Behaviors', value: stats.safeObs, icon: ThumbsUp, color: 'text-emerald-400' },
            { label: 'At-Risk Behaviors', value: stats.atRiskObs, icon: ThumbsDown, color: 'text-red-400' },
            { label: 'Coaching Sessions', value: stats.coachingSessions, icon: MessageSquare, color: 'text-blue-400' },
            { label: 'Safety Rate', value: `${stats.safetyRate}%`, icon: Target, color: 'text-purple-400' },
            { label: 'Open Actions', value: stats.openActions, icon: Clock, color: 'text-amber-400' },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mb-2 ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-white">{kpi.value}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* AI Insight */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">AI Behavioral Pattern Detected</h3>
              <p className="text-xs text-text-secondary">PPE non-compliance increased 18% in the Welding & Grinding areas this month. Recommend targeted toolbox talks and supervisor walk-throughs. Historical data suggests a correlation with shift changeover times (2PM-3PM).</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-text-muted border border-white/10 hover:bg-white/10'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'observations' && (
            <motion.div key="observations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input type="text" placeholder="Search observations..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setFilterType('all')} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filterType === 'all' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-text-muted border border-white/10'}`}>All</button>
                  <button onClick={() => setFilterType('safe')} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filterType === 'safe' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-text-muted border border-white/10'}`}>Safe</button>
                  <button onClick={() => setFilterType('at_risk')} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filterType === 'at_risk' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-text-muted border border-white/10'}`}>At Risk</button>
                </div>
              </div>

              {/* Observations List */}
              {filteredObs.map((obs, i) => (
                <motion.div key={obs.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/[0.07] transition-colors">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${obs.type === 'safe' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {obs.type === 'safe' ? <ThumbsUp className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-white">{obs.category}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig[obs.status].bg} ${statusConfig[obs.status].color}`}>
                              {statusConfig[obs.status].label}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${obs.type === 'safe' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {obs.type === 'safe' ? 'Safe' : 'At Risk'}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-1">{obs.behavior}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-text-muted">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {obs.observer}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {obs.location}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {obs.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {obs.feedback && (
                      <div className="ml-13 pl-4 border-l-2 border-white/10">
                        <p className="text-xs text-text-muted"><span className="text-cyan-400 font-medium">Coaching Note:</span> {obs.feedback}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'coaching' && (
            <motion.div key="coaching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-cyan-400" /> Safety Champions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { name: 'Sarah Chen', obs: 28, coached: 12, rate: '96%', rank: 1 },
                    { name: 'Mike Rodriguez', obs: 24, coached: 10, rate: '92%', rank: 2 },
                    { name: 'Lisa Park', obs: 19, coached: 8, rate: '89%', rank: 3 },
                  ].map((champ, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-surface-border/20 text-text-secondary' : 'bg-orange-500/20 text-orange-400'}`}>
                          #{champ.rank}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{champ.name}</p>
                          <p className="text-[10px] text-text-muted">Safety Champion</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div><p className="text-lg font-bold text-white">{champ.obs}</p><p className="text-[9px] text-text-muted uppercase">Obs</p></div>
                        <div><p className="text-lg font-bold text-white">{champ.coached}</p><p className="text-[9px] text-text-muted uppercase">Coached</p></div>
                        <div><p className="text-lg font-bold text-cyan-400">{champ.rate}</p><p className="text-[9px] text-text-muted uppercase">Rate</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coaching Sessions */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cyan-400" /> Recent Coaching Sessions</h3>
                {mockObservations.filter(o => o.status === 'coached').map((obs, i) => (
                  <div key={i} className="py-3 border-b border-white/5 last:border-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{obs.category} — {obs.location}</p>
                        <p className="text-xs text-text-muted mt-0.5">{obs.feedback}</p>
                        <p className="text-[10px] text-text-muted mt-1">Coach: {obs.observer} • {obs.date}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Safe Behavior Trend', desc: 'Monthly safe behavior observations trending upward', icon: TrendingUp, value: '+12%', color: 'text-emerald-400', data: [35, 42, 38, 45, 52, 48, 56, 61, 58, 65, 72, 68] },
                  { title: 'At-Risk Categories', desc: 'Top categories requiring coaching interventions', icon: AlertTriangle, value: 'PPE #1', color: 'text-amber-400', data: [28, 22, 18, 15, 12, 8] },
                  { title: 'Participation Rate', desc: 'Percentage of workforce conducting observations', icon: Users, value: '73%', color: 'text-cyan-400', data: [45, 48, 52, 55, 60, 65, 68, 71, 73] },
                  { title: 'Coaching Effectiveness', desc: 'Reduction in repeat at-risk behaviors after coaching', icon: Target, value: '84%', color: 'text-purple-400', data: [60, 65, 72, 78, 80, 82, 84] },
                ].map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${card.color}`}>
                        <card.icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xl font-black ${card.color}`}>{card.value}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{card.title}</h3>
                    <p className="text-xs text-text-muted mb-3">{card.desc}</p>
                    <div className="h-10 bg-white/5 rounded-lg flex items-end gap-0.5 px-1 overflow-hidden">
                      {card.data.map((val, j) => (
                        <div key={j} className={`flex-1 rounded-t-sm ${card.color.replace('text-', 'bg-')}`}
                          style={{ height: `${(val / Math.max(...card.data)) * 100}%`, opacity: 0.6 }} />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Leading Indicators Summary */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400" /> Leading Indicators Dashboard</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Observations/Month', value: '142', target: '120', status: 'above' },
                    { label: 'Near-Miss Reports', value: '23', target: '15', status: 'above' },
                    { label: 'Toolbox Talks', value: '18', target: '20', status: 'below' },
                    { label: 'Training Completion', value: '91%', target: '95%', status: 'below' },
                  ].map((ind, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{ind.label}</p>
                      <p className="text-xl font-black text-white">{ind.value}</p>
                      <p className={`text-[10px] ${ind.status === 'above' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        Target: {ind.target} {ind.status === 'above' ? '✓' : '↑'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>


    </div>
  );
};

export default BehaviorBasedSafety;
