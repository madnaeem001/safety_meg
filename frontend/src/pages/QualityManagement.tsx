import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ClipboardCheck, FileText, CheckCircle2, XCircle, Clock,
  AlertTriangle, Users, Calendar, Search, Filter, Plus, ChevronRight,
  BarChart3, TrendingUp, Shield, AlertCircle, Activity, Target,
  Eye, RefreshCw, Download, Star, Brain, Settings, Zap, Award
} from 'lucide-react';
import { useQualityMetrics, useNonConformities, useCreateNonConformity } from '../api/hooks/useAPIHooks';

// ── Types ──
interface QualityRecord {
  id: string;
  type: 'ncr' | 'capa' | 'audit_finding' | 'change_request' | 'deviation';
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending_review' | 'closed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  department: string;
  dueDate: string;
  createdDate: string;
  rootCause?: string;
  standard: string;
}

// ── Mock Data ──
const mockRecords: QualityRecord[] = [
  { id: 'NCR-2026-001', type: 'ncr', title: 'Out-of-spec weld on pressure vessel PV-204', description: 'Weld penetration below minimum spec in ASME Section IX', status: 'in_progress', priority: 'critical', assignee: 'J. Martinez', department: 'Fabrication', dueDate: '2026-02-28', createdDate: '2026-02-10', rootCause: 'Incorrect welding parameters', standard: 'ISO 9001:2015' },
  { id: 'CAPA-2026-003', type: 'capa', title: 'Recurring PPE storage non-conformance', description: 'PPE lockers found open and unorganized in 3 consecutive audits', status: 'open', priority: 'high', assignee: 'S. Chen', department: 'Operations', dueDate: '2026-03-05', createdDate: '2026-02-15', standard: 'ISO 45001:2018' },
  { id: 'AF-2026-012', type: 'audit_finding', title: 'Document control gap in SOP revision process', description: 'SOPs in Lab C found to be 2 revisions behind current standard', status: 'pending_review', priority: 'medium', assignee: 'K. Wilson', department: 'Quality', dueDate: '2026-03-01', createdDate: '2026-02-12', standard: 'ISO 9001:2015' },
  { id: 'CR-2026-007', type: 'change_request', title: 'Update chemical handling procedure for new reagent', description: 'New solvent introduced requires updated SDS and handling SOP', status: 'in_progress', priority: 'medium', assignee: 'L. Park', department: 'R&D', dueDate: '2026-03-10', createdDate: '2026-02-18', standard: 'ISO 14001:2015' },
  { id: 'DEV-2026-002', type: 'deviation', title: 'Temperature excursion in cold storage unit #3', description: 'Temperature exceeded 8°C for 45 minutes during power fluctuation', status: 'closed', priority: 'high', assignee: 'R. Patel', department: 'Warehouse', dueDate: '2026-02-20', createdDate: '2026-02-17', rootCause: 'UPS battery degradation', standard: 'ISO 9001:2015' },
  { id: 'NCR-2026-004', type: 'ncr', title: 'Calibration certificate expired for CMM #2', description: 'Coordinate measuring machine calibration lapsed by 15 days', status: 'overdue', priority: 'critical', assignee: 'A. Thompson', department: 'Quality Lab', dueDate: '2026-02-15', createdDate: '2026-02-01', standard: 'ISO/IEC 17025' },
  { id: 'CAPA-2026-005', type: 'capa', title: 'Customer complaint #CC-892 root cause corrective', description: 'Dimensional out-of-tolerance on shipment batch #B-4422', status: 'in_progress', priority: 'high', assignee: 'M. Garcia', department: 'Production', dueDate: '2026-03-08', createdDate: '2026-02-20', rootCause: 'Tool wear not detected', standard: 'ISO 9001:2015' },
  { id: 'AF-2026-015', type: 'audit_finding', title: 'Management review meeting minutes incomplete', description: 'Q4 2025 management review did not document all required inputs', status: 'open', priority: 'medium', assignee: 'D. Kim', department: 'Management', dueDate: '2026-03-15', createdDate: '2026-02-22', standard: 'ISO 9001:2015' },
];

const typeConfig = {
  ncr: { label: 'NCR', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: XCircle },
  capa: { label: 'CAPA', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: Target },
  audit_finding: { label: 'Audit Finding', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Eye },
  change_request: { label: 'Change Request', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: RefreshCw },
  deviation: { label: 'Deviation', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: AlertTriangle },
};

const statusConfig = {
  open: { label: 'Open', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  pending_review: { label: 'Pending Review', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  closed: { label: 'Closed', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  overdue: { label: 'Overdue', color: 'text-red-400', bg: 'bg-red-500/10' },
};

const priorityColors = {
  low: 'text-emerald-400 bg-emerald-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  high: 'text-orange-400 bg-orange-500/10',
  critical: 'text-red-400 bg-red-500/10',
};

export const QualityManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'records' | 'metrics' | 'standards' | 'audits'>('records');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ── Real API Data ──────────────────────────────────────────────────────
  const { data: backendNCRs } = useNonConformities({ status: filterStatus !== 'all' ? filterStatus : undefined });
  const { data: qualityMetricsData } = useQualityMetrics();

  const allRecords = React.useMemo(() => {
    const backendConverted = (backendNCRs || []).map((nc: any) => ({
      id: `QM-API-${nc.id}`,
      type: 'ncr',
      title: nc.title,
      description: nc.description,
      department: nc.department || 'Operations',
      raisedBy: nc.detectedBy || 'System',
      assignedTo: nc.correctiveAction ? nc.department : 'Unassigned',
      status: (['open', 'in_progress', 'closed', 'overdue'].includes(nc.status) ? nc.status : 'open'),
      priority: nc.severity || 'medium',
      dueDate: '',
      createdAt: nc.detectionDate || new Date().toISOString().split('T')[0],
      resolvedAt: nc.closedDate || null,
      cost: 0,
      tags: [],
    }));
    return [...mockRecords, ...backendConverted];
  }, [backendNCRs]);

  const filteredRecords = allRecords.filter((r: any) => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || r.type === filterType;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: allRecords.length,
    open: allRecords.filter((r: any) => r.status === 'open' || r.status === 'in_progress').length,
    overdue: allRecords.filter((r: any) => r.status === 'overdue').length,
    closed: allRecords.filter((r: any) => r.status === 'closed').length,
    ncrs: allRecords.filter((r: any) => r.type === 'ncr').length,
    capas: allRecords.filter((r: any) => r.type === 'capa').length,
  };

  const tabs = [
    { id: 'records', label: 'Quality Records', icon: ClipboardCheck },
    { id: 'metrics', label: 'Quality Metrics', icon: BarChart3 },
    { id: 'standards', label: 'Standards', icon: Shield },
    { id: 'audits', label: 'Audit Schedule', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-32">

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-[10px] uppercase tracking-[0.3em]">
              <ClipboardCheck className="w-4 h-4" /> Quality Management System
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">QMS Dashboard</h1>
          </div>
          <button className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-sm font-medium hover:bg-cyan-500/30 transition-colors">
            <Plus className="w-4 h-4" /> New Record
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Records', value: stats.total, icon: FileText, color: 'text-cyan-400' },
            { label: 'Active Items', value: stats.open, icon: Activity, color: 'text-blue-400' },
            { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-400' },
            { label: 'Closed', value: stats.closed, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'NCRs', value: stats.ncrs, icon: XCircle, color: 'text-orange-400' },
            { label: 'CAPAs', value: stats.capas, icon: Target, color: 'text-purple-400' },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mb-2 ${kpi.color}`}><kpi.icon className="w-4 h-4" /></div>
              <p className="text-2xl font-black text-white">{kpi.value}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{kpi.label}</p>
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
              <h3 className="text-sm font-bold text-white mb-1">AI Quality Insight</h3>
              <p className="text-xs text-slate-300">Pattern detected: 3 NCRs in Fabrication dept this quarter relate to welding parameters. Recommend systemic review of welder qualification records and WPS validation per ASME Section IX. CAPA trend analysis suggests training gap.</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'records' && (
            <motion.div key="records" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Search & Filter */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search records..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'ncr', 'capa', 'audit_finding', 'deviation'].map(type => (
                    <button key={type} onClick={() => setFilterType(type)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filterType === type ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                      {type === 'all' ? 'All' : type === 'audit_finding' ? 'Findings' : type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Records List */}
              {filteredRecords.map((rec, i) => {
                const tc = typeConfig[rec.type];
                const TypeIcon = tc.icon;
                return (
                  <motion.div key={rec.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/[0.07] transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.color.split(' ').slice(1).join(' ')}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono text-slate-500">{rec.id}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tc.color}`}>{tc.label}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusConfig[rec.status].bg} ${statusConfig[rec.status].color}`}>{statusConfig[rec.status].label}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColors[rec.priority]}`}>{rec.priority.toUpperCase()}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white mt-1">{rec.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{rec.description}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {rec.assignee}</span>
                            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {rec.standard}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due: {rec.dueDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'metrics' && (
            <motion.div key="metrics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'NCR Closure Rate', value: '78%', target: '90%', trend: '+5%', color: 'text-orange-400', data: [60, 65, 70, 68, 72, 75, 78] },
                  { title: 'CAPA Effectiveness', value: '85%', target: '95%', trend: '+3%', color: 'text-purple-400', data: [72, 75, 78, 80, 82, 84, 85] },
                  { title: 'Audit Conformance', value: '92%', target: '95%', trend: '+1%', color: 'text-emerald-400', data: [86, 88, 89, 90, 91, 91, 92] },
                  { title: 'Customer Complaints', value: '3', target: '<5', trend: '-2', color: 'text-cyan-400', data: [8, 7, 6, 5, 5, 4, 3] },
                ].map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm font-bold text-white">{m.title}</h3>
                      <span className="text-emerald-400 text-xs font-bold">{m.trend}</span>
                    </div>
                    <div className="flex items-end gap-2 mb-3">
                      <span className={`text-3xl font-black ${m.color}`}>{m.value}</span>
                      <span className="text-xs text-slate-500 pb-1">Target: {m.target}</span>
                    </div>
                    <div className="h-10 bg-white/5 rounded-lg flex items-end gap-0.5 px-1 overflow-hidden">
                      {m.data.map((val, j) => (
                        <div key={j} className={`flex-1 rounded-t-sm ${m.color.replace('text-', 'bg-')}`}
                          style={{ height: `${(val / Math.max(...m.data)) * 100}%`, opacity: 0.6 }} />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Cost of Quality */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-400" /> Cost of Quality (CoQ)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Prevention', value: '$45K', pct: '35%', color: 'text-emerald-400' },
                    { label: 'Appraisal', value: '$32K', pct: '25%', color: 'text-blue-400' },
                    { label: 'Internal Failure', value: '$28K', pct: '22%', color: 'text-amber-400' },
                    { label: 'External Failure', value: '$23K', pct: '18%', color: 'text-red-400' },
                  ].map((coq, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{coq.label}</p>
                      <p className={`text-xl font-black ${coq.color}`}>{coq.value}</p>
                      <p className="text-xs text-slate-400">{coq.pct} of total</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'standards' && (
            <motion.div key="standards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'ISO 9001:2015', desc: 'Quality Management Systems', status: 'Certified', nextAudit: '2026-06-15', coverage: 95 },
                  { name: 'ISO 14001:2015', desc: 'Environmental Management', status: 'Certified', nextAudit: '2026-07-20', coverage: 92 },
                  { name: 'ISO 45001:2018', desc: 'OH&S Management', status: 'Certified', nextAudit: '2026-05-10', coverage: 90 },
                  { name: 'ISO/IEC 17025', desc: 'Lab Competence', status: 'In Progress', nextAudit: '2026-09-01', coverage: 68 },
                  { name: 'IATF 16949', desc: 'Automotive Quality', status: 'Planned', nextAudit: '2026-12-01', coverage: 35 },
                  { name: 'AS9100D', desc: 'Aerospace Quality', status: 'Planned', nextAudit: '2027-03-01', coverage: 20 },
                ].map((std, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">{std.name}</h3>
                        <p className="text-xs text-slate-400">{std.desc}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${std.status === 'Certified' ? 'bg-emerald-500/10 text-emerald-400' : std.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'}`}>
                        {std.status}
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Coverage</span><span className="font-bold text-white">{std.coverage}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${std.coverage >= 85 ? 'bg-emerald-400' : std.coverage >= 50 ? 'bg-amber-400' : 'bg-slate-400'}`}
                          style={{ width: `${std.coverage}%` }} />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500">Next Audit: {std.nextAudit}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'audits' && (
            <motion.div key="audits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {[
                { title: 'ISO 9001 Surveillance Audit', auditor: 'BSI Group', date: '2026-06-15', type: 'External', status: 'Scheduled', dept: 'All' },
                { title: 'Internal Process Audit — Fabrication', auditor: 'K. Wilson', date: '2026-03-10', type: 'Internal', status: 'Upcoming', dept: 'Fabrication' },
                { title: 'Supplier Quality Audit — Vendor #V-012', auditor: 'A. Thompson', date: '2026-03-20', type: 'Supplier', status: 'Scheduled', dept: 'Procurement' },
                { title: 'Lab ISO 17025 Gap Assessment', auditor: 'QA Team', date: '2026-04-05', type: 'Internal', status: 'Planning', dept: 'Quality Lab' },
                { title: 'ISO 14001 Recertification', auditor: 'DNV', date: '2026-07-20', type: 'External', status: 'Scheduled', dept: 'Environmental' },
              ].map((audit, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/[0.07] transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white">{audit.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${audit.type === 'External' ? 'bg-purple-500/10 text-purple-400' : audit.type === 'Supplier' ? 'bg-amber-500/10 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                          {audit.type}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{audit.status}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {audit.auditor}</span>
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {audit.dept}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500">Date</p>
                      <p className="text-sm font-bold text-white">{audit.date}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
};

export default QualityManagement;
