import React, { useState, useMemo } from 'react';
import { SMButton } from '../../ui';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, CheckCircle2, AlertTriangle, XCircle, Clock, TrendingUp, 
  TrendingDown, Calendar, FileText, Users, Building2, ChevronRight,
  Download, Filter, Search, RefreshCw, Eye, ExternalLink, BarChart3,
  PieChart, Activity, Target, Award, AlertCircle, ClipboardCheck, FileDown
} from 'lucide-react';
import { 
  exportComplianceReportPDF, 
  exportComplianceReportCSV, 
  exportComplianceReportJSON,
  ComplianceReportData 
} from '../../../utils/exports/complianceExport';

// Compliance categories
const COMPLIANCE_CATEGORIES = [
  { id: 'safety', label: 'Safety', icon: Shield, color: 'blue' },
  { id: 'environmental', label: 'Environmental', icon: Building2, color: 'green' },
  { id: 'training', label: 'Training', icon: Users, color: 'purple' },
  { id: 'permits', label: 'Permits & Licenses', icon: FileText, color: 'amber' },
  { id: 'inspections', label: 'Inspections', icon: ClipboardCheck, color: 'teal' },
  { id: 'documentation', label: 'Documentation', icon: FileText, color: 'indigo' },
];

// Mock compliance data
const mockComplianceData = {
  overallScore: 94.2,
  trend: 2.5,
  categories: [
    { 
      id: 'safety', 
      name: 'Safety Compliance', 
      score: 96.5, 
      trend: 1.2, 
      items: 145, 
      compliant: 140, 
      pending: 3, 
      overdue: 2,
      lastAudit: '2026-01-15',
      nextAudit: '2026-04-15',
    },
    { 
      id: 'environmental', 
      name: 'Environmental', 
      score: 92.8, 
      trend: -0.5, 
      items: 78, 
      compliant: 72, 
      pending: 4, 
      overdue: 2,
      lastAudit: '2026-01-10',
      nextAudit: '2026-02-10',
    },
    { 
      id: 'training', 
      name: 'Training', 
      score: 95.8, 
      trend: 3.2, 
      items: 847, 
      compliant: 812, 
      pending: 28, 
      overdue: 7,
      lastAudit: '2026-01-20',
      nextAudit: '2026-02-20',
    },
    { 
      id: 'permits', 
      name: 'Permits & Licenses', 
      score: 100, 
      trend: 0, 
      items: 23, 
      compliant: 23, 
      pending: 0, 
      overdue: 0,
      lastAudit: '2026-01-05',
      nextAudit: '2026-07-05',
    },
    { 
      id: 'inspections', 
      name: 'Inspections', 
      score: 91.3, 
      trend: -1.8, 
      items: 46, 
      compliant: 42, 
      pending: 2, 
      overdue: 2,
      lastAudit: '2026-01-18',
      nextAudit: '2026-01-25',
    },
    { 
      id: 'documentation', 
      name: 'Documentation', 
      score: 88.5, 
      trend: 4.5, 
      items: 312, 
      compliant: 276, 
      pending: 24, 
      overdue: 12,
      lastAudit: '2026-01-12',
      nextAudit: '2026-02-12',
    },
  ],
  recentActivities: [
    { id: 1, action: 'Training Completed', item: 'HAZWOPER Refresher', user: 'John Smith', date: '2026-01-25', status: 'completed' },
    { id: 2, action: 'Inspection Passed', item: 'Fire Extinguisher Monthly', user: 'Sarah Johnson', date: '2026-01-24', status: 'completed' },
    { id: 3, action: 'Permit Renewed', item: 'Air Quality Permit', user: 'Mike Davis', date: '2026-01-23', status: 'completed' },
    { id: 4, action: 'Document Updated', item: 'Emergency Response Plan', user: 'Emily Chen', date: '2026-01-22', status: 'completed' },
    { id: 5, action: 'Training Overdue', item: 'Confined Space Entry', user: 'Tom Anderson', date: '2026-01-21', status: 'overdue' },
    { id: 6, action: 'Inspection Scheduled', item: 'OSHA Walkthrough', user: 'Safety Team', date: '2026-01-28', status: 'pending' },
  ],
  upcomingDeadlines: [
    { id: 1, item: 'EPA Quarterly Report', category: 'environmental', dueDate: '2026-01-31', daysRemaining: 6, priority: 'high' },
    { id: 2, item: 'OSHA 300A Posting', category: 'safety', dueDate: '2026-02-01', daysRemaining: 7, priority: 'high' },
    { id: 3, item: 'Fire Drill', category: 'safety', dueDate: '2026-02-05', daysRemaining: 11, priority: 'medium' },
    { id: 4, item: 'Hazmat Training - 5 employees', category: 'training', dueDate: '2026-02-10', daysRemaining: 16, priority: 'medium' },
    { id: 5, item: 'Air Permit Renewal', category: 'permits', dueDate: '2026-02-28', daysRemaining: 34, priority: 'low' },
  ],
  regulatoryFrameworks: [
    { id: 'osha', name: 'OSHA', status: 'compliant', score: 97, items: 89 },
    { id: 'epa', name: 'EPA', status: 'compliant', score: 93, items: 45 },
    { id: 'iso45001', name: 'ISO 45001', status: 'compliant', score: 95, items: 156 },
    { id: 'iso14001', name: 'ISO 14001', status: 'review', score: 88, items: 78 },
    { id: 'nfpa', name: 'NFPA', status: 'compliant', score: 100, items: 34 },
  ],
};

// Compliance item details
const mockComplianceItems = [
  { id: 'CI-001', title: 'Annual Safety Training', category: 'training', status: 'compliant', dueDate: '2026-03-15', lastCompleted: '2026-01-10', responsible: 'HR Department', notes: 'All employees completed' },
  { id: 'CI-002', title: 'Fire Extinguisher Inspection', category: 'inspections', status: 'compliant', dueDate: '2026-02-01', lastCompleted: '2026-01-01', responsible: 'Facilities', notes: 'Monthly inspection' },
  { id: 'CI-003', title: 'Air Quality Permit', category: 'permits', status: 'compliant', dueDate: '2026-06-15', lastCompleted: '2025-06-15', responsible: 'Environmental', notes: 'Annual renewal' },
  { id: 'CI-004', title: 'HAZWOPER Certification', category: 'training', status: 'pending', dueDate: '2026-01-31', lastCompleted: '2025-01-31', responsible: 'Safety', notes: '5 employees pending' },
  { id: 'CI-005', title: 'Emergency Response Plan', category: 'documentation', status: 'overdue', dueDate: '2026-01-15', lastCompleted: '2025-01-15', responsible: 'Safety', notes: 'Annual review required' },
  { id: 'CI-006', title: 'Confined Space Permit', category: 'permits', status: 'compliant', dueDate: '2026-08-01', lastCompleted: '2025-08-01', responsible: 'Safety', notes: 'Annual renewal' },
  { id: 'CI-007', title: 'Forklift Certification', category: 'training', status: 'overdue', dueDate: '2026-01-20', lastCompleted: '2023-01-20', responsible: 'Operations', notes: '3 operators need recert' },
  { id: 'CI-008', title: 'SWPPP Inspection', category: 'inspections', status: 'pending', dueDate: '2026-01-28', lastCompleted: '2025-12-28', responsible: 'Environmental', notes: 'Monthly inspection' },
];

interface ComplianceDashboardProps {
  onBack?: () => void;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'overview' | 'items' | 'calendar'>('overview');
  const [showFilters, setShowFilters] = useState(false);

  // Filter compliance items
  const filteredItems = useMemo(() => {
    return mockComplianceItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.responsible.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [selectedCategory, selectedStatus, searchQuery]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = mockComplianceItems.length;
    const compliant = mockComplianceItems.filter(i => i.status === 'compliant').length;
    const pending = mockComplianceItems.filter(i => i.status === 'pending').length;
    const overdue = mockComplianceItems.filter(i => i.status === 'overdue').length;
    return { total, compliant, pending, overdue };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'overdue': return 'bg-danger/10 text-danger border-danger/20';
      case 'review': return 'bg-accent/10 text-accent border-accent/20';
      default: return 'bg-surface-sunken text-text-muted border-surface-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'pending': return <Clock className="w-4 h-4 text-warning" />;
      case 'overdue': return <XCircle className="w-4 h-4 text-danger" />;
      case 'review': return <AlertCircle className="w-4 h-4 text-accent" />;
      default: return <AlertTriangle className="w-4 h-4 text-text-muted" />;
    }
  };

  // Handle export
  const handleExport = (format: 'pdf' | 'csv' | 'json') => {
    const reportData: ComplianceReportData = {
      title: 'Compliance Report',
      generatedDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      generatedBy: 'Safety Officer',
      overallScore: mockComplianceData.overallScore,
      categories: mockComplianceData.categories.map(c => ({
        name: c.name,
        score: c.score,
        compliant: c.compliant,
        pending: c.pending,
        overdue: c.overdue,
      })),
      upcomingDeadlines: mockComplianceData.upcomingDeadlines.map(d => ({
        item: d.item,
        category: d.category,
        dueDate: d.dueDate,
        priority: d.priority,
      })),
      regulatoryFrameworks: mockComplianceData.regulatoryFrameworks.map(f => ({
        name: f.name,
        status: f.status,
        score: f.score,
      })),
      recentActivities: mockComplianceData.recentActivities.map(a => ({
        action: a.action,
        item: a.item,
        user: a.user,
        date: a.date,
      })),
    };

    switch (format) {
      case 'pdf':
        exportComplianceReportPDF(reportData);
        break;
      case 'csv':
        exportComplianceReportCSV(reportData);
        break;
      case 'json':
        exportComplianceReportJSON(reportData);
        break;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-danger/10 text-danger';
      case 'medium': return 'bg-warning/10 text-warning';
      case 'low': return 'bg-success/10 text-success';
      default: return 'bg-surface-sunken text-text-muted';
    }
  };

  return (
    <div className="min-h-screen bg-surface-base p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            {onBack && (
              <SMButton
                variant="ghost"
                size="sm"
                onClick={onBack}
                leftIcon={<ChevronRight className="w-5 h-5 rotate-180" />}
              />
            )}
            <div className="p-3 rounded-2xl bg-primary shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Compliance Dashboard</h1>
              <p className="text-sm text-text-muted">Track regulatory compliance and requirements</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-raised rounded-xl shadow-sm hover:shadow-md transition-all text-sm text-text-primary">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-accent text-text-onAccent rounded-xl shadow-sm hover:brightness-110 transition-all text-sm">
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <div className="absolute right-0 top-full mt-2 bg-surface-raised rounded-xl shadow-lg border border-surface-border py-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-sunken flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Export as PDF
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-sunken flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-sunken flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export as JSON
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* View Tabs */}
        <div className="flex gap-2 bg-surface-raised/60 p-1 rounded-xl w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'items', label: 'Compliance Items', icon: ClipboardCheck },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeView === tab.id
                  ? 'bg-surface-raised shadow-sm text-accent'
                  : 'text-text-muted hover:bg-surface-sunken'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Overall Score */}
            <div className="md:col-span-1">
              <p className="text-white/70 text-sm mb-2">Overall Compliance Score</p>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold">{mockComplianceData.overallScore}%</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${
                  mockComplianceData.trend >= 0 ? 'bg-white/20 text-white/90' : 'bg-white/20 text-white/90'
                }`}>
                  {mockComplianceData.trend >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(mockComplianceData.trend)}%
                </div>
              </div>
              <div className="mt-4 bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-success rounded-full"
                  style={{ width: `${mockComplianceData.overallScore}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Items', value: summaryStats.total, icon: ClipboardCheck, color: 'bg-white/10' },
                { label: 'Compliant', value: summaryStats.compliant, icon: CheckCircle2, color: 'bg-white/10' },
                { label: 'Pending', value: summaryStats.pending, icon: Clock, color: 'bg-white/10' },
                { label: 'Overdue', value: summaryStats.overdue, icon: XCircle, color: 'bg-white/10' },
              ].map((stat, idx) => (
                <div key={idx} className={`${stat.color} rounded-xl p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-5 h-5 text-white/80" />
                  </div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-white/70 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {activeView === 'overview' && (
          <>
            {/* Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockComplianceData.categories.map((category, idx) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-surface-raised rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border border-surface-border"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-text-primary">{category.name}</h3>
                      <p className="text-sm text-text-muted">{category.items} items tracked</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                      category.trend >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                    }`}>
                      {category.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(category.trend)}%
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xl font-bold text-text-primary">{category.score}%</span>
                    </div>
                    <div className="bg-surface-border rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          category.score >= 95 ? 'bg-success' : 
                          category.score >= 85 ? 'bg-warning' : 'bg-danger'
                        }`}
                        style={{ width: `${category.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Item Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-success/5 rounded-lg p-2">
                      <p className="text-lg font-semibold text-success">{category.compliant}</p>
                      <p className="text-xs text-success">Compliant</p>
                    </div>
                    <div className="bg-warning/5 rounded-lg p-2">
                      <p className="text-lg font-semibold text-warning">{category.pending}</p>
                      <p className="text-xs text-warning">Pending</p>
                    </div>
                    <div className="bg-danger/5 rounded-lg p-2">
                      <p className="text-lg font-semibold text-danger">{category.overdue}</p>
                      <p className="text-xs text-danger">Overdue</p>
                    </div>
                  </div>

                  {/* Audit Dates */}
                  <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between text-xs text-text-muted">
                    <span>Last: {category.lastAudit}</span>
                    <span>Next: {category.nextAudit}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Regulatory Frameworks & Upcoming Deadlines */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Regulatory Frameworks */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface-raised rounded-2xl p-5 shadow-soft border border-surface-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" />
                    Regulatory Frameworks
                  </h3>
                </div>
                <div className="space-y-3">
                  {mockComplianceData.regulatoryFrameworks.map((framework) => (
                    <div
                      key={framework.id}
                      className="flex items-center justify-between p-3 bg-surface-sunken/50 rounded-xl hover:bg-surface-sunken transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          framework.status === 'compliant' ? 'bg-success' : 'bg-warning'
                        }`} />
                        <div>
                          <p className="font-medium text-text-primary">{framework.name}</p>
                          <p className="text-xs text-text-muted">{framework.items} requirements</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(framework.status)}`}>
                          {framework.status.charAt(0).toUpperCase() + framework.status.slice(1)}
                        </span>
                        <span className="font-semibold text-text-primary">{framework.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Upcoming Deadlines */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface-raised rounded-2xl p-5 shadow-soft border border-surface-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    Upcoming Deadlines
                  </h3>
                  <button className="text-accent text-sm hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {mockComplianceData.upcomingDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between p-3 bg-surface-sunken/50 rounded-xl hover:bg-surface-sunken transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          deadline.daysRemaining <= 7 ? 'bg-danger/10' : 
                          deadline.daysRemaining <= 14 ? 'bg-warning/10' : 'bg-success/10'
                        }`}>
                          <Clock className={`w-4 h-4 ${
                            deadline.daysRemaining <= 7 ? 'text-danger' : 
                            deadline.daysRemaining <= 14 ? 'text-warning' : 'text-success'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{deadline.item}</p>
                          <p className="text-xs text-text-muted">Due: {deadline.dueDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(deadline.priority)}`}>
                          {deadline.daysRemaining} days
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-raised rounded-2xl p-5 shadow-soft border border-surface-border"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                  <Activity className="w-5 h-5 text-accent" />
                  Recent Activity
                </h3>
              </div>
              <div className="space-y-3">
                {mockComplianceData.recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-surface-sunken/50 rounded-xl hover:bg-surface-sunken transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(activity.status)}
                      <div>
                        <p className="font-medium text-text-primary">{activity.action}</p>
                        <p className="text-sm text-text-muted">{activity.item}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-muted">{activity.user}</p>
                      <p className="text-xs text-text-muted">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {activeView === 'items' && (
          <>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-surface-raised rounded-2xl p-4 shadow-soft">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search compliance items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/30 focus:border-accent bg-surface-sunken text-text-primary outline-none"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-surface-border rounded-xl text-sm focus:ring-2 focus:ring-accent/30 bg-surface-sunken text-text-primary outline-none"
                >
                  <option value="all">All Categories</option>
                  {COMPLIANCE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-surface-border rounded-xl text-sm focus:ring-2 focus:ring-accent/30 bg-surface-sunken text-text-primary outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="compliant">Compliant</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* Items List */}
            <div className="bg-surface-raised rounded-2xl shadow-soft border border-surface-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-sunken border-b border-surface-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-text-muted">ID</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-text-muted">Title</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-text-muted">Category</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-text-muted">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-text-muted">Due Date</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-text-muted">Responsible</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-sunken transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-text-primary">{item.id}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-text-primary">{item.title}</p>
                          <p className="text-xs text-text-muted">{item.notes}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-muted capitalize">{item.category}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-muted">{item.dueDate}</td>
                        <td className="px-4 py-3 text-sm text-text-muted">{item.responsible}</td>
                        <td className="px-4 py-3">
                          <button className="p-2 hover:bg-surface-sunken rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-text-muted" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeView === 'calendar' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-raised rounded-2xl p-6 shadow-soft border border-surface-border"
          >
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">Compliance Calendar</h3>
              <p className="text-text-muted">Interactive calendar view coming soon</p>
              <p className="text-sm text-text-muted/70 mt-2">Track deadlines, inspections, and audits</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ComplianceDashboard;
