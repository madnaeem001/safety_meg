import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  Play,
  Pause,
  Settings,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Filter,
  Search,
  BarChart3,
  Zap,
  Users,
  ChevronDown,
  ChevronRight,
  History,
  Mail,
  Trash2,
  Edit,
  Copy,
  MoreVertical,
  Sparkles
} from 'lucide-react';
import {
  automatedReportScheduler,
  ScheduledReport,
  ReportRun,
  AutomationRule,
  ReportType,
  ReportFrequency,
} from '../services/automatedReportScheduler';
import { useScheduledReports, useScheduleReport } from '../api/hooks/useAPIHooks';
import { AIAutomatedReporting } from '../components/safety/AIAutomatedReporting';

// Report type labels and icons
const REPORT_TYPE_CONFIG: Record<ReportType, { label: string; color: string }> = {
  'injury-summary': { label: 'Injury Summary', color: 'bg-red-100 text-red-700' },
  'incident-summary': { label: 'Incident Summary', color: 'bg-orange-100 text-orange-700' },
  'near-miss-summary': { label: 'Near Miss Summary', color: 'bg-amber-100 text-amber-700' },
  'investigation-status': { label: 'Investigation Status', color: 'bg-purple-100 text-purple-700' },
  'capa-status': { label: 'CAPA Status', color: 'bg-blue-100 text-blue-700' },
  'epa-compliance': { label: 'EPA Compliance', color: 'bg-green-100 text-green-700' },
  'nfpa-compliance': { label: 'NFPA Compliance', color: 'bg-rose-100 text-rose-700' },
  'training-status': { label: 'Training Status', color: 'bg-indigo-100 text-indigo-700' },
  'inspection-summary': { label: 'Inspection Summary', color: 'bg-cyan-100 text-cyan-700' },
  'risk-assessment': { label: 'Risk Assessment', color: 'bg-yellow-100 text-yellow-700' },
  'audit-summary': { label: 'Audit Summary', color: 'bg-slate-100 text-slate-700' },
  'kpi-dashboard': { label: 'KPI Dashboard', color: 'bg-emerald-100 text-emerald-700' },
  'environmental-metrics': { label: 'Environmental Metrics', color: 'bg-teal-100 text-teal-700' },
};

const FREQUENCY_LABELS: Record<ReportFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
};

export const ReportDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'history' | 'automation' | 'ai'>('scheduled');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFrequency, setFilterFrequency] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // ── Real API Data ─────────────────────────────────────────────────────
  const { data: backendScheduledReports } = useScheduledReports();
  const scheduleReportMutation = useScheduleReport();

  // Get data from local scheduler (used for rich offline functionality)
  const localScheduledReports = automatedReportScheduler.getScheduledReports();
  const automationRules = automatedReportScheduler.getAutomationRules();
  const reportRuns = automatedReportScheduler.getReportRuns();
  const schedulerStatus = automatedReportScheduler.getStatus();

  // Merge backend + local reports (backend takes precedence by id)
  const scheduledReports = useMemo<ScheduledReport[]>(() => {
    if (!backendScheduledReports || backendScheduledReports.length === 0) return localScheduledReports;
    const backendConverted: ScheduledReport[] = backendScheduledReports.map((r: any) => ({
      id: String(r.id || r.reportId),
      name: r.name || r.reportName || 'Untitled Report',
      type: (r.type || 'incident-summary') as ReportType,
      description: r.description || '',
      frequency: (r.frequency || 'monthly') as ReportFrequency,
      enabled: r.enabled ?? r.active ?? true,
      nextRun: r.nextRun || r.scheduledAt || new Date().toISOString(),
      lastRun: r.lastRun || r.lastRunAt,
      recipients: Array.isArray(r.recipients) ? r.recipients : [],
      format: r.format || 'pdf',
      filters: r.filters || {},
      createdAt: r.createdAt || new Date().toISOString(),
      createdBy: r.createdBy || 'system',
    }));
    const backendIds = new Set(backendConverted.map(r => r.id));
    return [...backendConverted, ...localScheduledReports.filter(r => !backendIds.has(r.id))];
  }, [backendScheduledReports, localScheduledReports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return scheduledReports.filter(report => {
      const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFrequency = filterFrequency === 'all' || report.frequency === filterFrequency;
      return matchesSearch && matchesFrequency;
    });
  }, [scheduledReports, searchTerm, filterFrequency]);

  // Stats
  const stats = useMemo(() => {
    const enabled = scheduledReports.filter(r => r.enabled).length;
    const completed = reportRuns.filter(r => r.status === 'completed').length;
    const failed = reportRuns.filter(r => r.status === 'failed').length;
    return { enabled, total: scheduledReports.length, completed, failed };
  }, [scheduledReports, reportRuns]);

  const handleToggleReport = (id: string) => {
    automatedReportScheduler.toggleReport(id);
    // Force re-render
    setActiveTab(activeTab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-100 pb-24">
      {/* Header */}
      <header className="sticky top-[72px] z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-surface-600" />
              </button>
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="SafetyMEG" className="w-8 h-8 object-contain" />
                <div>
                  <h1 className="text-xl font-semibold text-surface-900 flex items-center gap-2">
                    Report Automation Dashboard
                  </h1>
                  <p className="text-sm text-surface-500">Manage scheduled reports and automation rules</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                schedulerStatus.running ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-600'
              }`}>
                <span className={`w-2 h-2 rounded-full ${schedulerStatus.running ? 'bg-green-500 animate-pulse' : 'bg-surface-400'}`} />
                {schedulerStatus.running ? 'Scheduler Active' : 'Scheduler Stopped'}
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-xl shadow-button hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                New Schedule
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-brand-100 rounded-xl">
                <Calendar className="w-5 h-5 text-brand-600" />
              </div>
              <span className="text-sm font-medium text-surface-600">Scheduled</span>
            </div>
            <div className="text-3xl font-bold text-surface-900">{stats.enabled}/{stats.total}</div>
            <p className="text-sm text-surface-500 mt-1">active reports</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-surface-600">Completed</span>
            </div>
            <div className="text-3xl font-bold text-emerald-600">{stats.completed}</div>
            <p className="text-sm text-surface-500 mt-1">runs this month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm font-medium text-surface-600">Failed</span>
            </div>
            <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-sm text-surface-500 mt-1">requires attention</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-surface-600">Active Rules</span>
            </div>
            <div className="text-3xl font-bold text-purple-600">{schedulerStatus.automationRules}</div>
            <p className="text-sm text-surface-500 mt-1">automation rules</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-surface-200">
          {[
            { id: 'scheduled', label: 'Scheduled Reports', icon: Calendar },
            { id: 'history', label: 'Run History', icon: History },
            { id: 'automation', label: 'Automation Rules', icon: Zap },
            { id: 'ai', label: 'AI Report Engine', icon: Sparkles },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'ai' ? (
            <motion.div
              key="ai-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AIAutomatedReporting />
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Scheduled Reports Tab */}
              {activeTab === 'scheduled' && (
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                      <input
                        type="text"
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <select
                      value={filterFrequency}
                      onChange={(e) => setFilterFrequency(e.target.value)}
                      className="px-4 py-2.5 bg-white border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="all">All Frequencies</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {/* Reports List */}
                  <div className="grid grid-cols-1 gap-4">
                    {filteredReports.map((report) => (
                      <ReportCard 
                        key={report.id} 
                        report={report} 
                        onToggle={() => handleToggleReport(report.id)}
                        isExpanded={expandedReportId === report.id}
                        onExpand={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-50 border-b border-surface-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Report Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Run Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Recipients</th>
                        <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {reportRuns.map((run) => (
                        <tr key={run.id} className="hover:bg-surface-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-surface-900">{run.reportName}</div>
                            <div className="text-xs text-surface-500">{run.type}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-surface-600">
                            {new Date(run.runDate).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              run.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {run.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {run.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-surface-600">
                            {run.recipients.length} users
                          </td>
                          <td className="px-6 py-4">
                            <button className="p-2 hover:bg-surface-100 rounded-lg text-surface-400 hover:text-brand-600 transition-colors">
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Automation Rules Tab */}
              {activeTab === 'automation' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-surface-900">Automation Rules</h2>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 text-surface-700 rounded-xl hover:bg-surface-50 transition-all text-sm font-bold">
                      <Plus className="w-4 h-4" />
                      Add Rule
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {automationRules.map((rule) => (
                      <div key={rule.id} className="bg-white p-5 rounded-2xl border border-surface-200 shadow-soft">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-purple-50 rounded-xl">
                            <Zap className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            rule.enabled ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'
                          }`}>
                            {rule.enabled ? 'Active' : 'Disabled'}
                          </div>
                        </div>
                        <h3 className="font-bold text-surface-900 mb-1">{rule.name}</h3>
                        <p className="text-sm text-surface-500 mb-4">{rule.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                          <div className="text-xs text-surface-400">
                            Trigger: <span className="font-medium text-surface-600">{rule.trigger}</span>
                          </div>
                          <button className="text-xs font-bold text-brand-600 hover:text-brand-700">Edit Rule</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// Helper Components
const ReportCard: React.FC<{ 
  report: ScheduledReport; 
  onToggle: () => void;
  isExpanded: boolean;
  onExpand: () => void;
}> = ({ report, onToggle, isExpanded, onExpand }) => {
  const config = REPORT_TYPE_CONFIG[report.type];
  
  return (
    <div className={`bg-white rounded-2xl border transition-all ${isExpanded ? 'border-brand-300 shadow-md' : 'border-surface-200 shadow-soft'}`}>
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={onExpand}>
          <div className={`p-3 rounded-xl ${config.color}`}>
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-surface-900">{report.name}</h3>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${config.color}`}>
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-surface-500">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {FREQUENCY_LABELS[report.frequency]}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {report.recipients.length} recipients</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Next: {new Date(report.nextRun).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              report.enabled ? 'bg-brand-600' : 'bg-surface-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                report.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <button className="p-2 hover:bg-surface-100 rounded-lg text-surface-400 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5 border-t border-surface-100"
          >
            <div className="pt-4 space-y-4">
              <p className="text-sm text-surface-600">{report.description}</p>
              <div className="flex flex-wrap gap-2">
                {report.recipients.map((email, i) => (
                  <span key={i} className="px-2 py-1 bg-surface-50 border border-surface-100 rounded-lg text-xs text-surface-500 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> {email}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-surface-900 text-white rounded-xl text-xs font-bold hover:bg-surface-800 transition-all">
                  <Play className="w-3 h-3" /> Run Now
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 text-surface-700 rounded-xl text-xs font-bold hover:bg-surface-50 transition-all">
                  <Edit className="w-3 h-3" /> Edit Schedule
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
