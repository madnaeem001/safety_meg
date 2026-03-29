import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Beaker, Wind, Thermometer, Volume2, Eye, Activity,
  AlertTriangle, CheckCircle2, Clock, MapPin, Users, FileText,
  Plus, Search, Filter, Download, TrendingUp, Shield, BarChart3,
  Droplets, Gauge, Zap, Calendar, RefreshCw, ChevronRight, Brain
} from 'lucide-react';
import { useHygieneAssessments, useCreateHygieneAssessment, useHygieneSamplingPlans } from '../api/hooks/useAPIHooks';

interface ExposureAssessment {
  id: string;
  agent: string;
  type: 'chemical' | 'physical' | 'biological' | 'ergonomic';
  location: string;
  oel: string;
  measured: string;
  unit: string;
  status: 'below_oel' | 'near_oel' | 'above_oel';
  lastSampled: string;
  nextDue: string;
  workers: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface SamplingPlan {
  id: string;
  title: string;
  agent: string;
  method: string;
  frequency: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  assignee: string;
  dueDate: string;
}

const mockExposures: ExposureAssessment[] = [
  { id: 'EA-001', agent: 'Silica Dust (Respirable)', type: 'chemical', location: 'Plant A - Grinding', oel: '0.025 mg/m³', measured: '0.018 mg/m³', unit: 'mg/m³', status: 'near_oel', lastSampled: '2026-02-15', nextDue: '2026-03-15', workers: 12, riskLevel: 'high' },
  { id: 'EA-002', agent: 'Noise (8-hr TWA)', type: 'physical', location: 'Plant B - Assembly', oel: '85 dBA', measured: '82 dBA', unit: 'dBA', status: 'near_oel', lastSampled: '2026-02-10', nextDue: '2026-05-10', workers: 24, riskLevel: 'medium' },
  { id: 'EA-003', agent: 'Benzene', type: 'chemical', location: 'Lab C - Chemical Storage', oel: '0.5 ppm', measured: '0.12 ppm', unit: 'ppm', status: 'below_oel', lastSampled: '2026-02-18', nextDue: '2026-08-18', workers: 6, riskLevel: 'low' },
  { id: 'EA-004', agent: 'Lead (Inorganic)', type: 'chemical', location: 'Plant A - Paint Shop', oel: '0.05 mg/m³', measured: '0.062 mg/m³', unit: 'mg/m³', status: 'above_oel', lastSampled: '2026-02-20', nextDue: '2026-02-27', workers: 8, riskLevel: 'critical' },
  { id: 'EA-005', agent: 'Heat Stress (WBGT)', type: 'physical', location: 'Outdoor - Loading Dock', oel: '28°C WBGT', measured: '25.3°C', unit: '°C WBGT', status: 'below_oel', lastSampled: '2026-02-19', nextDue: '2026-03-19', workers: 15, riskLevel: 'low' },
  { id: 'EA-006', agent: 'Formaldehyde', type: 'chemical', location: 'Lab D - Histology', oel: '0.75 ppm', measured: '0.68 ppm', unit: 'ppm', status: 'near_oel', lastSampled: '2026-02-12', nextDue: '2026-03-12', workers: 4, riskLevel: 'high' },
  { id: 'EA-007', agent: 'Whole-Body Vibration', type: 'physical', location: 'Transport - Forklifts', oel: '0.5 m/s²', measured: '0.38 m/s²', unit: 'm/s²', status: 'below_oel', lastSampled: '2026-01-28', nextDue: '2026-04-28', workers: 10, riskLevel: 'low' },
  { id: 'EA-008', agent: 'Mold Spores', type: 'biological', location: 'Building E - Basement', oel: '500 CFU/m³', measured: '420 CFU/m³', unit: 'CFU/m³', status: 'near_oel', lastSampled: '2026-02-05', nextDue: '2026-03-05', workers: 3, riskLevel: 'medium' },
];

const mockSamplingPlans: SamplingPlan[] = [
  { id: 'SP-001', title: 'Quarterly Silica Monitoring', agent: 'Silica Dust', method: 'NIOSH 7500', frequency: 'Quarterly', status: 'scheduled', assignee: 'J. Martinez', dueDate: '2026-03-15' },
  { id: 'SP-002', title: 'Annual Noise Survey', agent: 'Noise', method: 'OSHA/NIOSH SLM', frequency: 'Annual', status: 'in_progress', assignee: 'A. Chen', dueDate: '2026-02-28' },
  { id: 'SP-003', title: 'Lead Follow-Up Sampling', agent: 'Lead', method: 'NIOSH 7300', frequency: 'Monthly', status: 'overdue', assignee: 'R. Patel', dueDate: '2026-02-20' },
  { id: 'SP-004', title: 'Indoor Air Quality Assessment', agent: 'Multiple', method: 'ASHRAE 62.1', frequency: 'Semi-annual', status: 'completed', assignee: 'K. Wilson', dueDate: '2026-01-31' },
  { id: 'SP-005', title: 'Formaldehyde Area Monitoring', agent: 'Formaldehyde', method: 'OSHA 52', frequency: 'Quarterly', status: 'scheduled', assignee: 'L. Johnson', dueDate: '2026-03-12' },
];

const statusConfig = {
  below_oel: { label: 'Below OEL', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  near_oel: { label: 'Near OEL', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  above_oel: { label: 'Above OEL', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const riskColors = {
  low: 'text-emerald-400 bg-emerald-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  high: 'text-orange-400 bg-orange-500/10',
  critical: 'text-red-400 bg-red-500/10',
};

const planStatusConfig = {
  scheduled: { label: 'Scheduled', color: 'text-accent', bg: 'bg-accent/10' },
  in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  overdue: { label: 'Overdue', color: 'text-red-400', bg: 'bg-red-500/10' },
};

const typeIcons: Record<string, React.ReactNode> = {
  chemical: <Beaker className="w-4 h-4" />,
  physical: <Volume2 className="w-4 h-4" />,
  biological: <Droplets className="w-4 h-4" />,
  ergonomic: <Activity className="w-4 h-4" />,
};

export const IndustrialHygiene: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'exposures' | 'sampling' | 'monitoring'>('exposures');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // ── Real API Data ──────────────────────────────────────────────────────
  const { data: backendAssessments } = useHygieneAssessments({ hazardType: filterType !== 'all' ? filterType : undefined });
  const { data: apiSamplingPlans } = useHygieneSamplingPlans();
  const [samplingPlans, setSamplingPlans] = useState<SamplingPlan[]>(mockSamplingPlans);

  useEffect(() => {
    if (apiSamplingPlans && apiSamplingPlans.length > 0) {
      setSamplingPlans(apiSamplingPlans.map((p: any) => ({
        id: String(p.id),
        title: p.title,
        agent: p.agent,
        method: p.method,
        frequency: p.frequency,
        status: p.status as SamplingPlan['status'],
        assignee: p.assignee || '',
        dueDate: p.dueDate || '',
      })));
    }
  }, [apiSamplingPlans]);

  const allExposures = React.useMemo(() => {
    const backendConverted = (backendAssessments || []).map((a: any) => ({
      id: `HYG-API-${a.id}`,
      agent: a.title || a.hazardType,
      type: (['chemical', 'physical', 'biological', 'ergonomic'].includes(a.hazardType)
        ? a.hazardType : 'chemical') as ExposureAssessment['type'],
      location: a.location,
      oel: '—',
      measured: a.exposureLevel ? `${a.exposureLevel} (level)` : '—',
      unit: '',
      workers: 1,
      status: (a.exposureLevel === 'extreme' || a.exposureLevel === 'high'
        ? 'above_oel' : a.exposureLevel === 'medium' ? 'near_oel' : 'below_oel') as ExposureAssessment['status'],
      lastSampled: a.assessedAt ? new Date(a.assessedAt).toISOString().split('T')[0] : '',
      nextDue: a.nextReviewDate || '',
      riskLevel: (a.exposureLevel === 'extreme' ? 'critical'
        : a.exposureLevel === 'high' ? 'high'
        : a.exposureLevel === 'medium' ? 'medium' : 'low') as ExposureAssessment['riskLevel'],
    }));
    return [...mockExposures, ...backendConverted];
  }, [backendAssessments]);

  const filteredExposures = allExposures.filter((e: ExposureAssessment) => {
    const matchesSearch = e.agent.toLowerCase().includes(searchTerm.toLowerCase()) || e.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || e.type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: allExposures.length,
    aboveOel: allExposures.filter((e: ExposureAssessment) => e.status === 'above_oel').length,
    nearOel: allExposures.filter((e: ExposureAssessment) => e.status === 'near_oel').length,
    belowOel: allExposures.filter((e: ExposureAssessment) => e.status === 'below_oel').length,
    totalWorkers: allExposures.reduce((sum: number, e: ExposureAssessment) => sum + (e.workers || 0), 0),
    overduePlans: samplingPlans.filter((p: SamplingPlan) => p.status === 'overdue').length,
  };

  const tabs = [
    { id: 'exposures', label: 'Exposure Assessments', icon: Wind },
    { id: 'sampling', label: 'Sampling Plans', icon: Beaker },
    { id: 'monitoring', label: 'Monitoring Data', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-32">


      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-surface-raised border border-surface-border hover:bg-surface-overlay transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-[0.3em]">
              <Beaker className="w-4 h-4" /> Industrial Hygiene
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">Exposure & Monitoring</h1>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Agents', value: stats.total, icon: Beaker, color: 'text-accent' },
            { label: 'Above OEL', value: stats.aboveOel, icon: AlertTriangle, color: 'text-red-400' },
            { label: 'Near OEL', value: stats.nearOel, icon: Shield, color: 'text-amber-400' },
            { label: 'Below OEL', value: stats.belowOel, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Workers Monitored', value: stats.totalWorkers, icon: Users, color: 'text-blue-400' },
            { label: 'Overdue Samples', value: stats.overduePlans, icon: Clock, color: 'text-orange-400' },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-surface-raised border border-surface-border rounded-2xl p-4">
              <div className={`w-8 h-8 rounded-xl bg-surface-sunken flex items-center justify-center mb-2 ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-text-primary">{kpi.value}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* AI Insight Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-1">AI Hygiene Alert</h3>
              <p className="text-xs text-text-secondary">Lead exposure in Paint Shop (EA-004) exceeds PEL by 24%. Immediate engineering controls and enhanced medical surveillance recommended per OSHA 29 CFR 1910.1025. 3 workers require blood lead level testing within 48 hours.</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-surface-raised text-text-muted border border-surface-border hover:bg-surface-overlay'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder="Search agents, locations..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-sunken border border-surface-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40" />
          </div>
          <div className="flex gap-2">
            {['all', 'chemical', 'physical', 'biological'].map(type => (
              <button key={type} onClick={() => setFilterType(type)}
                className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${filterType === type ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-surface-raised text-text-muted border border-surface-border hover:bg-surface-overlay'}`}>
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'exposures' && (
            <motion.div key="exposures" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {filteredExposures.map((exp, i) => (
                <motion.div key={exp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-surface-raised border border-surface-border rounded-2xl p-4 hover:bg-surface-overlay transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${riskColors[exp.riskLevel]}`}>
                        {typeIcons[exp.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-text-primary">{exp.agent}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig[exp.status].bg} ${statusConfig[exp.status].color}`}>
                            {statusConfig[exp.status].label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-text-muted flex items-center gap-1"><MapPin className="w-3 h-3" /> {exp.location}</span>
                          <span className="text-xs text-text-muted flex items-center gap-1"><Users className="w-3 h-3" /> {exp.workers} workers</span>
                          <span className="text-xs text-text-muted flex items-center gap-1"><Calendar className="w-3 h-3" /> Next: {exp.nextDue}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-text-muted">Measured / OEL</p>
                        <p className="text-sm font-bold text-text-primary">{exp.measured} <span className="text-text-muted">/ {exp.oel}</span></p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${riskColors[exp.riskLevel]}`}>
                        {exp.riskLevel}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'sampling' && (
            <motion.div key="sampling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {samplingPlans.map((plan, i) => (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-surface-raised border border-surface-border rounded-2xl p-4 hover:bg-surface-overlay transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-text-primary">{plan.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${planStatusConfig[plan.status].bg} ${planStatusConfig[plan.status].color}`}>
                          {planStatusConfig[plan.status].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-text-muted">
                        <span className="flex items-center gap-1"><Beaker className="w-3 h-3" /> {plan.agent}</span>
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {plan.method}</span>
                        <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> {plan.frequency}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {plan.assignee}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-text-muted">Due Date</p>
                      <p className="text-sm font-bold text-text-primary">{plan.dueDate}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'monitoring' && (
            <motion.div key="monitoring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Monitoring Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Real-Time Air Quality', desc: 'PM2.5, VOCs, CO₂ monitoring across 14 sensors', icon: Wind, value: 'AQI 42', status: 'Good', color: 'text-emerald-400' },
                  { title: 'Noise Dosimetry', desc: '8-hour TWA tracking for 24 workers in Assembly', icon: Volume2, value: '79.2 dBA', status: 'Below PEL', color: 'text-emerald-400' },
                  { title: 'Thermal Environment', desc: 'WBGT monitoring at 6 outdoor locations', icon: Thermometer, value: '25.3°C', status: 'Normal', color: 'text-accent' },
                  { title: 'Radiation Monitoring', desc: 'Personal dosimeters for 8 radiology staff', icon: Zap, value: '0.12 mSv', status: 'Well Below Limit', color: 'text-emerald-400' },
                ].map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-surface-raised border border-surface-border rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-surface-sunken flex items-center justify-center ${card.color}`}>
                        <card.icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-surface-sunken ${card.color}`}>{card.status}</span>
                    </div>
                    <h3 className="text-sm font-bold text-text-primary mb-1">{card.title}</h3>
                    <p className="text-xs text-text-muted mb-3">{card.desc}</p>
                    <p className="text-2xl font-black text-text-primary">{card.value}</p>
                    {/* Mini sparkline placeholder */}
                    <div className="mt-3 h-8 bg-surface-sunken rounded-lg flex items-end gap-0.5 px-1 overflow-hidden">
                      {Array.from({ length: 20 }, (_, j) => (
                        <div key={j} className={`flex-1 rounded-t-sm ${card.color.replace('text-', 'bg-')}`}
                          style={{ height: `${Math.random() * 80 + 20}%`, opacity: 0.6 }} />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Standards Reference */}
              <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-accent" /> Regulatory Standards Applied</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['OSHA PELs (29 CFR 1910.1000)', 'NIOSH RELs', 'ACGIH TLVs (2026)', 'AIHA WEELs'].map((std, i) => (
                    <div key={i} className="bg-surface-sunken rounded-xl p-3 border border-surface-border">
                      <p className="text-xs text-text-secondary font-medium">{std}</p>
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

export default IndustrialHygiene;
