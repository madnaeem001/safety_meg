import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Car, Building2, FileSearch, Heart, Target, 
  ChevronRight, Plus, Search, LayoutGrid, List, Users, CheckCircle2, 
  TrendingUp, Clock, Activity, FileText, ClipboardCheck, Brain, Sparkles,
  BarChart3, ExternalLink, ArrowRight, Filter, Calendar, Zap, Shield
} from 'lucide-react';
import { 
  ExtendedKPIGrid, IncidentsTrendChart, InspectionCompletionChart, 
  IncidentCategoriesChart, SafetyScoreTrendChart, GeminiAIPanel, PowerBIPanel, AIChatAssistant 
} from './KPICharts';
import { PullToRefresh } from '../animations/PullToRefresh';

// DNA Icon SVG Component for SafetyMEG branding
const DNAIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 15c6.667-6 13.333 0 20-6" />
    <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
    <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
    <path d="M17 6l-2.5-2.5" />
    <path d="M14 8l-1-1" />
    <path d="M7 18l2.5 2.5" />
    <path d="M3.5 14.5l.5.5" />
    <path d="M20 9l.5.5" />
    <path d="M6.5 12.5l1 1" />
    <path d="M16.5 10.5l1 1" />
    <path d="M10 16l-1-1" />
  </svg>
);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

// Mock data for unified reports
const mockUnifiedReports = [
  { id: 'INC-2026-001', type: 'incident', title: 'Slip hazard in warehouse', severity: 'medium', status: 'open', date: '2026-01-05', assignee: 'John Smith', department: 'Operations' },
  { id: 'VEH-2026-002', type: 'vehicle', title: 'Forklift collision with rack', severity: 'high', status: 'investigating', date: '2026-01-04', assignee: 'Sarah Johnson', department: 'Logistics' },
  { id: 'PROP-2026-003', type: 'property', title: 'Chemical spill in lab', severity: 'critical', status: 'resolved', date: '2026-01-03', assignee: 'Mike Davis', department: 'R&D' },
  { id: 'INJ-2026-004', type: 'injury', title: 'Hand laceration from equipment', severity: 'high', status: 'capa-pending', date: '2026-01-02', assignee: 'Emily Chen', department: 'Manufacturing' },
  { id: 'INC-2026-005', type: 'incident', title: 'Near miss - falling object', severity: 'low', status: 'closed', date: '2026-01-01', assignee: 'Robert Wilson', department: 'Maintenance' },
  { id: 'VEH-2026-006', type: 'vehicle', title: 'Truck backing incident', severity: 'medium', status: 'open', date: '2025-12-30', assignee: 'Lisa Brown', department: 'Shipping' },
];

// Quick stats for hero section
const quickStats = {
  safetyScore: 94,
  openIncidents: 3,
  daysSafe: 42,
  complianceRate: 96.5,
  pendingCAPAs: 2,
  upcomingInspections: 5
};

interface UnifiedSafetyHubProps {
  onNavigate?: (route: string) => void;
}

export const UnifiedSafetyHub: React.FC<UnifiedSafetyHubProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleNav = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      navigate(route);
    }
  };

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  }, []);

  // Filter reports
  const filteredReports = useMemo(() => {
    let reports = mockUnifiedReports;
    if (typeFilter !== 'all') {
      reports = reports.filter(r => r.type === typeFilter);
    }
    if (searchQuery) {
      reports = reports.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return reports;
  }, [typeFilter, searchQuery]);

  // Helper functions
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/30';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30';
      case 'low': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30';
      default: return 'bg-surface-100 text-surface-600 border-surface-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'investigating': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'resolved': case 'closed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'capa-pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-surface-100 text-surface-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incident': return AlertTriangle;
      case 'vehicle': return Car;
      case 'property': return Building2;
      case 'injury': return Heart;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'incident': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'vehicle': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'property': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      case 'injury': return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
      default: return 'bg-surface-100 text-surface-600';
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="h-full">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 md:space-y-8"
      >
        {/* Hero Section with Key Stats */}
        <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-3xl p-6 md:p-8 text-white">
          {/* Subtle gradient orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-brand-600/15 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
          </div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 backdrop-blur-sm border border-brand-400/20">
                  <DNAIcon className="w-12 h-12 text-brand-400" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">SafetyMEG</h1>
                  <p className="text-slate-400 text-sm md:text-base">Intelligent Safety Management</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                  Live Data
                </span>
              </div>
            </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-brand-500/30 transition-colors cursor-default"
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-brand-400" />
                <span className="text-xs text-slate-400 font-medium">Safety Score</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">{quickStats.safetyScore}%</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-amber-500/30 transition-colors cursor-default"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400 font-medium">Open Issues</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">{quickStats.openIncidents}</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-emerald-500/30 transition-colors cursor-default"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400 font-medium">Days Safe</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">{quickStats.daysSafe}</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-cyan-500/30 transition-colors cursor-default"
            >
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400 font-medium">Compliance</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">{quickStats.complianceRate}%</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-orange-500/30 transition-colors cursor-default"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-slate-400 font-medium">Pending CAPAs</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">{quickStats.pendingCAPAs}</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-purple-500/30 transition-colors cursor-default"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-400 font-medium">Inspections Due</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">{quickStats.upcomingInspections}</p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Extended KPI Metrics */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white tracking-tight">Performance Metrics</h2>
          <button className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1 transition-colors">
            View Details <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <ExtendedKPIGrid />
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <IncidentsTrendChart />
        <SafetyScoreTrendChart />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <InspectionCompletionChart />
        <IncidentCategoriesChart />
      </motion.div>

      {/* AI & Analytics Section */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            AI & Analytics
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <GeminiAIPanel />
          <PowerBIPanel />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white tracking-tight mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Report Incident', icon: AlertTriangle, color: 'bg-red-50 hover:bg-red-100 border-red-200/60 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-800/30 dark:text-red-400', iconColor: 'text-red-500 dark:text-red-400', route: '/report-incident' },
            { label: 'Injury Report', icon: Heart, color: 'bg-rose-50 hover:bg-rose-100 border-rose-200/60 text-rose-700 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 dark:border-rose-800/30 dark:text-rose-400', iconColor: 'text-rose-500 dark:text-rose-400', route: '/injury-report' },
            { label: 'Vehicle Incident', icon: Car, color: 'bg-slate-50 hover:bg-slate-100 border-slate-200/60 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700/50 dark:text-slate-300', iconColor: 'text-slate-500 dark:text-slate-400', route: '/vehicle-incident' },
            { label: 'Safety Audit', icon: ClipboardCheck, color: 'bg-brand-50 hover:bg-brand-100 border-brand-200/60 text-brand-700 dark:bg-brand-900/20 dark:hover:bg-brand-900/30 dark:border-brand-800/30 dark:text-brand-400', iconColor: 'text-brand-500 dark:text-brand-400', route: '/safety-audit' },
          ].map((action, i) => (
            <motion.button
              key={action.label}
              onClick={() => handleNav(action.route)}
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98 }}
              className={`${action.color} border p-4 md:p-5 rounded-2xl transition-all duration-300 group flex flex-col items-center gap-3 shadow-subtle hover:shadow-soft`}
            >
              <action.icon className={`w-6 h-6 md:w-7 md:h-7 ${action.iconColor} group-hover:scale-110 transition-transform duration-300`} />
              <span className="text-xs md:text-sm font-bold text-center">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Unified Reports Section */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800/90 rounded-2xl md:rounded-3xl border border-surface-200/50 dark:border-slate-700/50 shadow-card overflow-hidden backdrop-blur-sm">
        <div className="p-4 md:p-6 border-b border-surface-100 dark:border-slate-700/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white tracking-tight">All Reports</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Unified view of all safety reports</p>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              {/* Search */}
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-48 pl-9 pr-3 py-2 text-sm bg-surface-50 dark:bg-slate-700 border border-surface-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
              {/* Filter */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl border transition-colors ${showFilters ? 'bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-900/30 dark:border-brand-800/30 dark:text-brand-400' : 'bg-surface-50 border-surface-200 text-surface-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400'}`}
              >
                <Filter className="w-4 h-4" />
              </button>
              {/* View Toggle */}
              <div className="flex bg-surface-100 dark:bg-slate-700 rounded-lg p-1">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow text-brand-600 dark:text-brand-400' : 'text-surface-400 dark:text-slate-500'}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow text-brand-600 dark:text-brand-400' : 'text-surface-400 dark:text-slate-500'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 mt-4 overflow-hidden"
              >
                {['all', 'incident', 'vehicle', 'property', 'injury'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors capitalize ${
                      typeFilter === type
                        ? 'bg-brand-600 text-white'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {type === 'all' ? 'All Types' : type}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reports List/Grid */}
        <div className="p-4 md:p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.map((report, i) => {
                const TypeIcon = getTypeIcon(report.type);
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2 }}
                    onClick={() => handleNav('/report-incident')}
                    className="group bg-surface-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 p-4 md:p-5 rounded-2xl border border-surface-100 dark:border-slate-600/50 hover:border-brand-200 dark:hover:border-brand-700/50 hover:shadow-card cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(report.type)}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-surface-800 dark:text-white text-sm">{report.id}</p>
                          <p className="text-xs text-surface-400 dark:text-slate-400">{report.date}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${getSeverityColor(report.severity)}`}>
                        {report.severity}
                      </span>
                    </div>
                    <h4 className="font-bold text-surface-800 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">{report.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-surface-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                          <Users className="w-3 h-3 text-surface-500 dark:text-slate-400" />
                        </div>
                        <span className="text-xs text-surface-500 dark:text-slate-400">{report.assignee}</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${getStatusColor(report.status)}`}>
                        {report.status.replace('-', ' ')}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReports.map((report, i) => {
                const TypeIcon = getTypeIcon(report.type);
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleNav('/report-incident')}
                    className="flex items-center justify-between p-4 bg-surface-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-surface-100 dark:border-slate-600/50 hover:border-brand-200 dark:hover:border-brand-700/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(report.type)}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-surface-800 dark:text-white">{report.id}</p>
                        <p className="text-sm text-surface-500 dark:text-slate-400">{report.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-surface-400 dark:text-slate-500 hidden md:block">{report.date}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${getSeverityColor(report.severity)}`}>{report.severity}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${getStatusColor(report.status)}`}>{report.status.replace('-', ' ')}</span>
                      <ChevronRight className="w-4 h-4 text-surface-400 dark:text-slate-500" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-surface-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-surface-500 dark:text-slate-400 font-medium">No reports found</p>
              <p className="text-xs text-surface-400 dark:text-slate-500 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Footer Action */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <motion.button
          onClick={() => handleNav('/report-incident')}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 dark:from-brand-600 dark:to-brand-700 dark:hover:from-brand-500 dark:hover:to-brand-600 text-white font-bold rounded-2xl shadow-premium hover:shadow-soft-xl transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          New Safety Report
        </motion.button>
      </motion.div>

      {/* AI Chat Assistant */}
      <AIChatAssistant />
      </motion.div>
    </PullToRefresh>
  );
};

export default UnifiedSafetyHub;
