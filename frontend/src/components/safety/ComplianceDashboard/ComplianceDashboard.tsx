import React, { useState, useMemo } from 'react';
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
      case 'compliant': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'review': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'overdue': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'review': return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
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
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/80 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Compliance Dashboard</h1>
              <p className="text-sm text-slate-500">Track regulatory compliance and requirements</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm">
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 py-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Export as PDF
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export as JSON
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* View Tabs */}
        <div className="flex gap-2 bg-white/60 p-1 rounded-xl w-fit">
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
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-slate-600 hover:bg-white/50'
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
          className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Overall Score */}
            <div className="md:col-span-1">
              <p className="text-blue-200 text-sm mb-2">Overall Compliance Score</p>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold">{mockComplianceData.overallScore}%</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${
                  mockComplianceData.trend >= 0 ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
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
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                  style={{ width: `${mockComplianceData.overallScore}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Items', value: summaryStats.total, icon: ClipboardCheck, color: 'bg-blue-500/20' },
                { label: 'Compliant', value: summaryStats.compliant, icon: CheckCircle2, color: 'bg-green-500/20' },
                { label: 'Pending', value: summaryStats.pending, icon: Clock, color: 'bg-amber-500/20' },
                { label: 'Overdue', value: summaryStats.overdue, icon: XCircle, color: 'bg-red-500/20' },
              ].map((stat, idx) => (
                <div key={idx} className={`${stat.color} rounded-xl p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-5 h-5 text-white/80" />
                  </div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-blue-200 text-sm">{stat.label}</p>
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
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-800">{category.name}</h3>
                      <p className="text-sm text-slate-500">{category.items} items tracked</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                      category.trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {category.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(category.trend)}%
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xl font-bold text-slate-800">{category.score}%</span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          category.score >= 95 ? 'bg-green-500' : 
                          category.score >= 85 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${category.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Item Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 rounded-lg p-2">
                      <p className="text-lg font-semibold text-green-700">{category.compliant}</p>
                      <p className="text-xs text-green-600">Compliant</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2">
                      <p className="text-lg font-semibold text-amber-700">{category.pending}</p>
                      <p className="text-xs text-amber-600">Pending</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                      <p className="text-lg font-semibold text-red-700">{category.overdue}</p>
                      <p className="text-xs text-red-600">Overdue</p>
                    </div>
                  </div>

                  {/* Audit Dates */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Regulatory Frameworks
                  </h3>
                </div>
                <div className="space-y-3">
                  {mockComplianceData.regulatoryFrameworks.map((framework) => (
                    <div
                      key={framework.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          framework.status === 'compliant' ? 'bg-green-500' : 'bg-amber-500'
                        }`} />
                        <div>
                          <p className="font-medium text-slate-800">{framework.name}</p>
                          <p className="text-xs text-slate-500">{framework.items} requirements</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(framework.status)}`}>
                          {framework.status.charAt(0).toUpperCase() + framework.status.slice(1)}
                        </span>
                        <span className="font-semibold text-slate-800">{framework.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Upcoming Deadlines */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Upcoming Deadlines
                  </h3>
                  <button className="text-blue-600 text-sm hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {mockComplianceData.upcomingDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          deadline.daysRemaining <= 7 ? 'bg-red-100' : 
                          deadline.daysRemaining <= 14 ? 'bg-amber-100' : 'bg-green-100'
                        }`}>
                          <Clock className={`w-4 h-4 ${
                            deadline.daysRemaining <= 7 ? 'text-red-600' : 
                            deadline.daysRemaining <= 14 ? 'text-amber-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{deadline.item}</p>
                          <p className="text-xs text-slate-500">Due: {deadline.dueDate}</p>
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
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Recent Activity
                </h3>
              </div>
              <div className="space-y-3">
                {mockComplianceData.recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(activity.status)}
                      <div>
                        <p className="font-medium text-slate-800">{activity.action}</p>
                        <p className="text-sm text-slate-600">{activity.item}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">{activity.user}</p>
                      <p className="text-xs text-slate-400">{activity.date}</p>
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
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search compliance items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {COMPLIANCE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="compliant">Compliant</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* Items List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">ID</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Title</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Category</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Due Date</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Responsible</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.id}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-800">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.notes}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 capitalize">{item.category}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.dueDate}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.responsible}</td>
                        <td className="px-4 py-3">
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-slate-600" />
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
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Compliance Calendar</h3>
              <p className="text-slate-500">Interactive calendar view coming soon</p>
              <p className="text-sm text-slate-400 mt-2">Track deadlines, inspections, and audits</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ComplianceDashboard;
