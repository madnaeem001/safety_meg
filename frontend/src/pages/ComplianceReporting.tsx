import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Users,
  Shield,
  Activity,
  RefreshCw,
  Send,
  Printer,
  Settings,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Search,
  Mail,
  Bell,
  Globe,
  Gauge,
  Target,
  Award,
  Leaf,
  Factory,
  HardHat,
  ClipboardList,
  FileCheck,
  Zap
} from 'lucide-react';
import {
  useComplianceReports,
  useComplianceMetrics,
  useRegulatoryRequirements,
  useScheduledReports,
} from '../api/hooks/useAPIHooks';
import type {
  ComplianceReportRecord,
  ComplianceMetricRecord,
  RegulatoryRequirementRecord,
} from '../api/services/apiService';

// Type aliases matching component interface names
type ComplianceReport = ComplianceReportRecord;
type ComplianceMetric = ComplianceMetricRecord;
type RegulatoryRequirement = RegulatoryRequirementRecord;
type ScheduledReport = {
  id: string;
  reportId: string;
  reportName: string;
  schedule: string;
  nextRun: string;
  recipients: string[];
  format: string;
  enabled: boolean;
};

// Config
const reportTypeConfig = {
  regulatory: { icon: Globe, color: 'bg-blue-500', label: 'Regulatory' },
  internal: { icon: Building2, color: 'bg-purple-500', label: 'Internal' },
  audit: { icon: ClipboardList, color: 'bg-indigo-500', label: 'Audit' },
  incident: { icon: AlertTriangle, color: 'bg-orange-500', label: 'Incident' },
  training: { icon: Users, color: 'bg-teal-500', label: 'Training' },
  environmental: { icon: Leaf, color: 'bg-green-500', label: 'Environmental' },
  safety: { icon: Shield, color: 'bg-red-500', label: 'Safety' }
};

const statusConfig = {
  current: { color: 'bg-green-100 text-green-700', label: 'Current' },
  due_soon: { color: 'bg-amber-100 text-amber-700', label: 'Due Soon' },
  overdue: { color: 'bg-red-100 text-red-700', label: 'Overdue' },
  draft: { color: 'bg-gray-100 text-gray-600', label: 'Draft' }
};

const metricStatusConfig = {
  compliant: { color: 'text-green-600', bg: 'bg-green-100' },
  at_risk: { color: 'text-amber-600', bg: 'bg-amber-100' },
  non_compliant: { color: 'text-red-600', bg: 'bg-red-100' }
};

type ViewMode = 'dashboard' | 'reports' | 'metrics' | 'requirements' | 'schedules' | 'report_detail';

export const ComplianceReporting: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Backend data
  const { data: reports } = useComplianceReports();
  const { data: metrics } = useComplianceMetrics();
  const { data: requirements } = useRegulatoryRequirements();
  const { data: scheduledReportsRaw } = useScheduledReports();

  const allReports: ComplianceReport[] = reports ?? [];
  const allMetrics: ComplianceMetric[] = metrics ?? [];
  const allRequirements: RegulatoryRequirement[] = requirements ?? [];
  const allScheduledReports: ScheduledReport[] = useMemo(() => {
    if (!scheduledReportsRaw) return [];
    return (scheduledReportsRaw as any[]).map((s: any) => ({
      id: String(s.id),
      reportId: String(s.template_id ?? s.templateId ?? ''),
      reportName: s.name ?? '',
      schedule: s.frequency ?? '',
      nextRun: s.next_generation_date ?? s.nextGenerationDate ?? '',
      recipients: Array.isArray(s.recipients) ? s.recipients : (s.recipients ? JSON.parse(s.recipients) : []),
      format: s.format ?? 'pdf',
      enabled: s.status === 'active',
    }));
  }, [scheduledReportsRaw]);

  // Calculations
  const stats = useMemo(() => ({
    totalReports: allReports.length,
    currentReports: allReports.filter(r => r.status === 'current').length,
    dueSoon: allReports.filter(r => r.status === 'due_soon').length,
    overdue: allReports.filter(r => r.status === 'overdue').length,
    automatedReports: allReports.filter(r => r.automationEnabled).length,
    complianceRate: allMetrics.length > 0
      ? Math.round((allMetrics.filter(m => m.status === 'compliant').length / allMetrics.length) * 100)
      : 0,
    upcomingRequirements: allRequirements.filter(r => r.status === 'upcoming' || r.status === 'in_progress').length
  }), [allReports, allMetrics, allRequirements]);

  const filteredReports = useMemo(() => {
    return allReports.filter(report => {
      const matchesType = typeFilter === 'all' || report.type === typeFilter;
      const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [allReports, typeFilter, searchQuery]);

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Compliance Rate', value: `${stats.complianceRate}%`, icon: Gauge, color: 'text-green-500', bg: 'bg-green-100' },
          { label: 'Reports Current', value: stats.currentReports, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-100' },
          { label: 'Due Soon', value: stats.dueSoon, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100' },
          { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' }
        ].map((stat) => {
          const StatIcon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface-800 rounded-xl p-5 shadow-sm border border-surface-200 dark:border-surface-700"
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <StatIcon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-surface-500">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Plus, label: 'New Report', color: 'bg-brand-500', action: () => {} },
          { icon: Download, label: 'Export All', color: 'bg-green-500', action: () => {} },
          { icon: Calendar, label: 'Schedule', color: 'bg-purple-500', action: () => setViewMode('schedules') },
          { icon: Settings, label: 'Configure', color: 'bg-gray-500', action: () => {} }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={item.action}
              className="flex items-center gap-3 p-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow"
            >
              <div className={`p-2 rounded-lg ${item.color}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-surface-700 dark:text-surface-300">{item.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Key Metrics */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-500" />
              Key Compliance Metrics
            </h3>
            <button
              onClick={() => setViewMode('metrics')}
              className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {allMetrics.slice(0, 4).map((metric) => {
            const statusConf = metricStatusConfig[metric.status];
            return (
              <div key={metric.id} className="p-4 bg-surface-50 dark:bg-surface-700 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-surface-500">{metric.name}</span>
                  {metric.trend === 'up' && <TrendingUp className={`w-4 h-4 ${metric.name.includes('Rate') || metric.name.includes('Compliance') ? 'text-green-500' : 'text-red-500'}`} />}
                  {metric.trend === 'down' && <TrendingDown className={`w-4 h-4 ${metric.name.includes('TRIR') || metric.name.includes('Emissions') ? 'text-green-500' : 'text-red-500'}`} />}
                </div>
                <p className={`text-2xl font-bold ${statusConf.color}`}>
                  {metric.currentValue}{metric.unit}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-surface-400">Target: {metric.targetValue}{metric.unit}</span>
                  <span className={`text-xs ${metric.trendValue < 0 ? 'text-green-600' : metric.trendValue > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Recent Reports
            </h3>
            <button
              onClick={() => setViewMode('reports')}
              className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="divide-y divide-surface-100 dark:divide-surface-700">
          {allReports.slice(0, 4).map((report) => {
            const typeConf = reportTypeConfig[report.type];
            const statConf = statusConfig[report.status];
            const TypeIcon = typeConf.icon;
            
            return (
              <motion.div
                key={report.id}
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                className="p-4 flex items-center gap-4 cursor-pointer"
                onClick={() => {
                  setSelectedReport(report);
                  setViewMode('report_detail');
                }}
              >
                <div className={`p-3 rounded-xl ${typeConf.color}`}>
                  <TypeIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-surface-900 dark:text-white truncate">{report.name}</span>
                    {report.automationEnabled && (
                      <Zap className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-surface-500">
                    <span>Last: {report.lastGenerated}</span>
                    <span>Next: {report.nextDue}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs rounded-full ${statConf.color}`}>
                  {statConf.label}
                </span>
                <ChevronRight className="w-5 h-5 text-surface-400" />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Regulatory Requirements */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-500" />
              Upcoming Regulatory Requirements
            </h3>
            <button
              onClick={() => setViewMode('requirements')}
              className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="divide-y divide-surface-100 dark:divide-surface-700">
          {allRequirements.filter(r => r.status !== 'compliant').slice(0, 3).map((req) => (
            <div key={req.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-surface-900 dark:text-white">{req.requirement}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      req.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      req.status === 'upcoming' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-surface-500">{req.regulation} • {req.agency}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-surface-900 dark:text-white">{req.dueDate}</p>
                  <p className="text-xs text-surface-500">Due Date</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-surface-500">
                <Users className="w-3 h-3" />
                {req.assignedTo}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:outline-none"
        >
          <option value="all">All Types</option>
          {Object.entries(reportTypeConfig).map(([key, conf]) => (
            <option key={key} value={key}>{conf.label}</option>
          ))}
        </select>
        <button className="px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-brand-600 transition-colors">
          <Plus className="w-4 h-4" />
          New Report
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.map((report) => {
          const typeConf = reportTypeConfig[report.type];
          const statConf = statusConfig[report.status];
          const TypeIcon = typeConf.icon;
          
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedReport(report);
                setViewMode('report_detail');
              }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl ${typeConf.color}`}>
                  <TypeIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-surface-900 dark:text-white">{report.name}</h4>
                    {report.automationEnabled && (
                      <span title="Automated"><Zap className="w-4 h-4 text-amber-500" /></span>
                    )}
                  </div>
                  <p className="text-sm text-surface-500 line-clamp-2">{report.description}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-surface-100 dark:border-surface-700">
                <div className="flex items-center gap-4 text-xs text-surface-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {report.frequency}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Next: {report.nextDue}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${statConf.color}`}>
                  {statConf.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allMetrics.map((metric) => {
          const statusConf = metricStatusConfig[metric.status];
          const progress = (metric.currentValue / metric.targetValue) * 100;
          
          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-surface-900 dark:text-white">{metric.name}</h4>
                  <p className="text-xs text-surface-500">{metric.category}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${statusConf.bg} ${statusConf.color}`}>
                  {metric.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-end gap-2 mb-3">
                <p className={`text-3xl font-bold ${statusConf.color}`}>
                  {metric.currentValue}{metric.unit}
                </p>
                <div className="flex items-center gap-1 mb-1">
                  {metric.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                  {metric.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                  <span className={`text-sm ${
                    metric.trendValue < 0 ? 'text-green-600' : 
                    metric.trendValue > 0 ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}%
                  </span>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between text-xs text-surface-500 mb-1">
                  <span>Progress to Target</span>
                  <span>{metric.targetValue}{metric.unit}</span>
                </div>
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      metric.status === 'compliant' ? 'bg-green-500' :
                      metric.status === 'at_risk' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
              
              <p className="text-xs text-surface-400">Last updated: {metric.lastUpdated}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderRequirements = () => (
    <div className="space-y-4">
      {allRequirements.map((req) => (
        <motion.div
          key={req.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-5"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-surface-900 dark:text-white">{req.requirement}</h4>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  req.status === 'compliant' ? 'bg-green-100 text-green-700' :
                  req.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  req.status === 'upcoming' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {req.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                {req.regulation} • {req.agency}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-surface-900 dark:text-white">{req.dueDate}</p>
              <p className="text-xs text-surface-500">Due Date</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-surface-100 dark:border-surface-700">
            <div>
              <p className="text-xs text-surface-500 mb-1">Frequency</p>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{req.frequency}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Assigned To</p>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{req.assignedTo}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Last Review</p>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{req.lastReview}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Evidence Required</p>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{req.evidence.length} items</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderSchedules = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-surface-900 dark:text-white">Scheduled Reports</h3>
        <button className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-brand-600 transition-colors">
          <Plus className="w-4 h-4" />
          Add Schedule
        </button>
      </div>
      
      {allScheduledReports.map((schedule) => (
        <motion.div
          key={schedule.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-5"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${schedule.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Clock className={`w-5 h-5 ${schedule.enabled ? 'text-green-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <h4 className="font-semibold text-surface-900 dark:text-white">{schedule.reportName}</h4>
                <p className="text-sm text-surface-500">{schedule.schedule}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {schedule.recipients.length} recipient(s)
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {schedule.format}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs rounded-full ${
                schedule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {schedule.enabled ? 'Active' : 'Paused'}
              </span>
              <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg">
                <Settings className="w-4 h-4 text-surface-500" />
              </button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700 flex items-center justify-between">
            <span className="text-sm text-surface-500">
              Next run: <span className="font-medium text-surface-700 dark:text-surface-300">{schedule.nextRun}</span>
            </span>
            <button className="px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 text-sm font-medium rounded-lg hover:bg-brand-100 transition-colors">
              Run Now
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderReportDetail = () => {
    if (!selectedReport) return null;
    
    const typeConf = reportTypeConfig[selectedReport.type];
    const statConf = statusConfig[selectedReport.status];
    const TypeIcon = typeConf.icon;
    
    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-4 rounded-xl ${typeConf.color}`}>
              <TypeIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-surface-900 dark:text-white">{selectedReport.name}</h2>
                <span className={`px-3 py-1 text-sm rounded-full ${statConf.color}`}>
                  {statConf.label}
                </span>
                {selectedReport.automationEnabled && (
                  <span className="px-3 py-1 text-sm rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Automated
                  </span>
                )}
              </div>
              <p className="text-surface-600 dark:text-surface-400">{selectedReport.description}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-surface-100 dark:border-surface-700">
            <div>
              <p className="text-xs text-surface-500 mb-1">Type</p>
              <p className="font-medium text-surface-700 dark:text-surface-300">{typeConf.label}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Frequency</p>
              <p className="font-medium text-surface-700 dark:text-surface-300 capitalize">{selectedReport.frequency}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Format</p>
              <p className="font-medium text-surface-700 dark:text-surface-300 uppercase">{selectedReport.format}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Recipients</p>
              <p className="font-medium text-surface-700 dark:text-surface-300">{selectedReport.recipients.length} email(s)</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Schedule</h3>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <p className="text-xs text-surface-500 mb-1">Last Generated</p>
              <p className="text-lg font-medium text-surface-900 dark:text-white">{selectedReport.lastGenerated}</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="h-px flex-1 bg-surface-200 dark:bg-surface-700" />
              <Clock className="w-5 h-5 mx-2 text-surface-400" />
              <div className="h-px flex-1 bg-surface-200 dark:bg-surface-700" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs text-surface-500 mb-1">Next Due</p>
              <p className="text-lg font-medium text-surface-900 dark:text-white">{selectedReport.nextDue}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow">
            <Download className="w-6 h-6 text-blue-500" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Download</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow">
            <Send className="w-6 h-6 text-green-500" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Send Now</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow">
            <Edit3 className="w-6 h-6 text-amber-500" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Edit</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow">
            <Printer className="w-6 h-6 text-purple-500" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Print</span>
          </button>
        </div>

        {/* Generate Button */}
        <button className="w-full py-4 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition-colors flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Generate Report Now
        </button>
      </div>
    );
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'reports': return 'All Reports';
      case 'metrics': return 'Compliance Metrics';
      case 'requirements': return 'Regulatory Requirements';
      case 'schedules': return 'Report Schedules';
      case 'report_detail': return selectedReport?.name || 'Report Details';
      default: return 'Compliance Reporting';
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="sticky top-[72px] z-50 bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (viewMode === 'dashboard') {
                    navigate(-1);
                  } else if (viewMode === 'report_detail') {
                    setViewMode('reports');
                    setSelectedReport(null);
                  } else {
                    setViewMode('dashboard');
                  }
                }}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-6 h-6 text-blue-500" />
                  {getViewTitle()}
                </h1>
                {viewMode === 'dashboard' && (
                  <p className="text-sm text-surface-500">Automated Compliance Management</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                className="px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:outline-none"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors">
                <Download className="w-5 h-5 text-surface-600 dark:text-surface-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      {viewMode !== 'dashboard' && viewMode !== 'report_detail' && (
        <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 overflow-x-auto py-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'reports', label: 'Reports', icon: FileText },
                { id: 'metrics', label: 'Metrics', icon: Gauge },
                { id: 'requirements', label: 'Requirements', icon: Globe },
                { id: 'schedules', label: 'Schedules', icon: Calendar }
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setViewMode(tab.id as ViewMode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
                      viewMode === tab.id
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'dashboard' && renderDashboard()}
            {viewMode === 'reports' && renderReports()}
            {viewMode === 'metrics' && renderMetrics()}
            {viewMode === 'requirements' && renderRequirements()}
            {viewMode === 'schedules' && renderSchedules()}
            {viewMode === 'report_detail' && renderReportDetail()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ComplianceReporting;
