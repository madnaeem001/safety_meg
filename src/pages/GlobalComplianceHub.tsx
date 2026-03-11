import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FadeContent from '../components/animations/FadeContent';
import {
  Globe,
  Search,
  Filter,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  ChevronRight,
  Building2,
  Scale,
  Shield,
  Calendar,
} from 'lucide-react';
import { useComplianceFrameworks } from '../api/hooks/useAPIHooks';

interface ComplianceFramework {
  id: string;
  name: string;
  shortName: string;
  region: string;
  category: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-applicable';
  score: number;
  lastAudit: Date;
  nextDue: Date;
  requirements: number;
  completed: number;
}

const FALLBACK_FRAMEWORKS: ComplianceFramework[] = [
  { id: 'osha', name: 'OSHA General Industry Standards', shortName: 'OSHA', region: 'United States', category: 'Occupational Safety', status: 'compliant', score: 96, lastAudit: new Date('2026-01-15'), nextDue: new Date('2026-07-15'), requirements: 124, completed: 119 },
  { id: 'iso45001', name: 'ISO 45001:2018', shortName: 'ISO 45001', region: 'International', category: 'Management Systems', status: 'compliant', score: 94, lastAudit: new Date('2025-11-20'), nextDue: new Date('2026-11-20'), requirements: 87, completed: 82 },
  { id: 'iso14001', name: 'ISO 14001:2015', shortName: 'ISO 14001', region: 'International', category: 'Environmental', status: 'partial', score: 82, lastAudit: new Date('2025-10-01'), nextDue: new Date('2026-10-01'), requirements: 56, completed: 46 },
  { id: 'eu-reach', name: 'EU REACH Regulation', shortName: 'REACH', region: 'European Union', category: 'Chemical Safety', status: 'compliant', score: 91, lastAudit: new Date('2025-12-05'), nextDue: new Date('2026-12-05'), requirements: 43, completed: 39 },
  { id: 'gdpr', name: 'GDPR Data Protection', shortName: 'GDPR', region: 'European Union', category: 'Data Privacy', status: 'compliant', score: 98, lastAudit: new Date('2026-01-10'), nextDue: new Date('2027-01-10'), requirements: 32, completed: 31 },
  { id: 'china-whs', name: 'China Work Safety Law', shortName: 'China WHS', region: 'China', category: 'Occupational Safety', status: 'partial', score: 78, lastAudit: new Date('2025-09-15'), nextDue: new Date('2026-09-15'), requirements: 68, completed: 53 },
  { id: 'psm', name: 'OSHA Process Safety Management', shortName: 'PSM', region: 'United States', category: 'Process Safety', status: 'compliant', score: 92, lastAudit: new Date('2025-08-22'), nextDue: new Date('2026-02-22'), requirements: 14, completed: 13 },
  { id: 'seveso', name: 'EU Seveso III Directive', shortName: 'Seveso III', region: 'European Union', category: 'Major Hazards', status: 'non-compliant', score: 65, lastAudit: new Date('2025-07-10'), nextDue: new Date('2026-01-10'), requirements: 28, completed: 18 },
  { id: 'iso9001', name: 'ISO 9001:2015', shortName: 'ISO 9001', region: 'International', category: 'Quality Management', status: 'compliant', score: 97, lastAudit: new Date('2025-12-01'), nextDue: new Date('2026-12-01'), requirements: 45, completed: 44 },
  { id: 'nfpa', name: 'NFPA Fire Safety Standards', shortName: 'NFPA', region: 'United States', category: 'Fire Safety', status: 'partial', score: 85, lastAudit: new Date('2025-11-15'), nextDue: new Date('2026-05-15'), requirements: 52, completed: 44 },
  { id: 'ghs', name: 'GHS Chemical Classification', shortName: 'GHS', region: 'International', category: 'Chemical Safety', status: 'compliant', score: 99, lastAudit: new Date('2026-01-20'), nextDue: new Date('2027-01-20'), requirements: 18, completed: 18 },
  { id: 'epa-rmp', name: 'EPA Risk Management Plan (RMP)', shortName: 'EPA RMP', region: 'United States', category: 'Environmental', status: 'compliant', score: 95, lastAudit: new Date('2025-12-10'), nextDue: new Date('2026-12-10'), requirements: 45, completed: 43 },
  { id: 'niosh-pocket', name: 'NIOSH Pocket Guide to Chemical Hazards', shortName: 'NIOSH', region: 'United States', category: 'Occupational Health', status: 'compliant', score: 97, lastAudit: new Date('2026-01-05'), nextDue: new Date('2027-01-05'), requirements: 12, completed: 12 },
  { id: 'ncr-tracking', name: 'Non-Conformance Report (NCR) Tracking', shortName: 'NCR', region: 'Internal', category: 'Quality Management', status: 'partial', score: 88, lastAudit: new Date('2026-02-01'), nextDue: new Date('2026-03-01'), requirements: 24, completed: 21 },
  { id: 'sds-ghs', name: 'GHS Safety Data Sheet (SDS) Compliance', shortName: 'SDS', region: 'International', category: 'Chemical Safety', status: 'compliant', score: 100, lastAudit: new Date('2026-01-20'), nextDue: new Date('2027-01-20'), requirements: 16, completed: 16 },
  { id: 'asme-b30', name: 'ASME B30 Safety Standard for Cableways, Cranes, Derricks, Hoists, Hooks, Jacks, and Slings', shortName: 'ASME B30', region: 'United States', category: 'Technical & Engineering', status: 'compliant', score: 94, lastAudit: new Date('2025-12-05'), nextDue: new Date('2026-06-05'), requirements: 42, completed: 39 },
  { id: 'api-rp-54', name: 'API RP 54 Occupational Safety for Oil and Gas Well Drilling and Servicing Operations', shortName: 'API RP 54', region: 'United States', category: 'Sector-Specific', status: 'compliant', score: 91, lastAudit: new Date('2025-11-15'), nextDue: new Date('2026-05-15'), requirements: 38, completed: 35 },
  { id: 'brazil-nr', name: 'Brazil NR Regulatory Standards', shortName: 'Brazil NR', region: 'Brazil', category: 'Occupational Safety', status: 'partial', score: 76, lastAudit: new Date('2025-06-30'), nextDue: new Date('2026-06-30'), requirements: 36, completed: 27 },
];

const regions = ['All Regions', 'International', 'United States', 'European Union', 'China', 'Brazil'];
const categories = ['All Categories', 'Occupational Safety', 'Environmental', 'Chemical Safety', 'Management Systems', 'Process Safety', 'Fire Safety', 'Quality Management', 'Data Privacy', 'Major Hazards'];
const statuses = ['All Status', 'Compliant', 'Partial', 'Non-Compliant'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

export const GlobalComplianceHub: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [showFilters, setShowFilters] = useState(false);

  const { data: apiFrameworks } = useComplianceFrameworks();

  const allFrameworks: ComplianceFramework[] = useMemo(() => {
    if (!apiFrameworks || apiFrameworks.length === 0) return FALLBACK_FRAMEWORKS;
    return apiFrameworks.map(f => ({
      id: f.id,
      name: f.name,
      shortName: f.shortName,
      region: f.region,
      category: f.category,
      status: f.status,
      score: f.score,
      lastAudit: new Date(f.lastAudit),
      nextDue: new Date(f.nextDue),
      requirements: f.requirements,
      completed: f.completed,
    }));
  }, [apiFrameworks]);

  const filteredFrameworks = useMemo(() => {
    return allFrameworks.filter(fw => {
      const matchesSearch = fw.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           fw.shortName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = selectedRegion === 'All Regions' || fw.region === selectedRegion;
      const matchesCategory = selectedCategory === 'All Categories' || fw.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All Status' || 
                           fw.status === selectedStatus.toLowerCase().replace('-', '');
      return matchesSearch && matchesRegion && matchesCategory && matchesStatus;
    });
  }, [allFrameworks, searchQuery, selectedRegion, selectedCategory, selectedStatus]);

  const complianceStats = useMemo(() => {
    const total = allFrameworks.length;
    const compliant = allFrameworks.filter(fw => fw.status === 'compliant').length;
    const partial = allFrameworks.filter(fw => fw.status === 'partial').length;
    const nonCompliant = allFrameworks.filter(fw => fw.status === 'non-compliant').length;
    const avgScore = total > 0
      ? Math.round(allFrameworks.reduce((sum, fw) => sum + fw.score, 0) / total)
      : 0;
    return { total, compliant, partial, nonCompliant, avgScore };
  }, [allFrameworks]);

  const handleExport = () => {
    const exportData = allFrameworks.map(fw => ({
      id: fw.id,
      name: fw.name,
      shortName: fw.shortName,
      region: fw.region,
      category: fw.category,
      status: fw.status,
      score: fw.score,
      lastAudit: fw.lastAudit.toISOString().split('T')[0],
      nextDue: fw.nextDue.toISOString().split('T')[0],
      requirements: fw.requirements,
      completed: fw.completed,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compliance-frameworks.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusConfig = (status: ComplianceFramework['status']) => {
    switch (status) {
      case 'compliant': return { color: 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Compliant' };
      case 'partial': return { color: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock, label: 'Partial' };
      case 'non-compliant': return { color: 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle, label: 'Non-Compliant' };
      default: return { color: 'text-surface-500 bg-surface-100 dark:bg-surface-700', icon: FileText, label: 'N/A' };
    }
  };

  return (
    <FadeContent blur duration={400} delay={0}>
      <div className="min-h-screen pb-24 bg-surface-50 dark:bg-surface-900">
        {/* Header */}
        <header className="sticky top-[72px] z-40 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-surface-900 dark:text-white">Global Compliance Hub</h1>
                  <p className="text-xs text-surface-500">Multi-Jurisdictional Compliance Management</p>
                </div>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-brand-600 font-medium hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {/* Search */}
            <div className="mt-3 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search frameworks..."
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-100 dark:bg-surface-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl transition-colors ${
                  showFilters ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="px-3 py-2 text-sm bg-surface-100 dark:bg-surface-700 rounded-lg border-none focus:ring-2 focus:ring-brand-500"
                    >
                      {regions.map(r => <option key={r}>{r}</option>)}
                    </select>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 text-sm bg-surface-100 dark:bg-surface-700 rounded-lg border-none focus:ring-2 focus:ring-brand-500"
                    >
                      {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-2 text-sm bg-surface-100 dark:bg-surface-700 rounded-lg border-none focus:ring-2 focus:ring-brand-500"
                    >
                      {statuses.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="p-4 pb-24 space-y-6">
          {/* Stats Overview */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-surface-500">Frameworks</span>
              </div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{complianceStats.total}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-xs text-surface-500">Compliant</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{complianceStats.compliant}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-xs text-surface-500">Gaps</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{complianceStats.nonCompliant}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-brand-500" />
                <span className="text-xs text-surface-500">Avg Score</span>
              </div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{complianceStats.avgScore}%</p>
            </motion.div>
          </motion.div>

          {/* Frameworks List */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide">
                Compliance Frameworks ({filteredFrameworks.length})
              </h2>
            </motion.div>
            <motion.div variants={containerVariants} className="space-y-2">
              {filteredFrameworks.map((framework) => {
                const statusConfig = getStatusConfig(framework.status);
                const progress = Math.round((framework.completed / framework.requirements) * 100);
                const daysUntilDue = Math.ceil((framework.nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                
                return (
                  <motion.button
                    key={framework.id}
                    variants={itemVariants}
                    className="w-full text-left p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-brand-400 dark:hover:border-brand-500 transition-all"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-surface-900 dark:text-white">{framework.shortName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                            <statusConfig.icon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-surface-500">{framework.name}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {framework.region}
                          </span>
                          <span className="flex items-center gap-1">
                            <Scale className="w-3 h-3" /> {framework.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          framework.score >= 90 ? 'text-green-600' :
                          framework.score >= 70 ? 'text-amber-600' : 'text-red-600'
                        }`}>{framework.score}%</p>
                        <p className="text-xs text-surface-500">Score</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-surface-500">{framework.completed}/{framework.requirements} requirements</span>
                        <span className="text-surface-600 dark:text-surface-400 font-medium">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            framework.status === 'compliant' ? 'bg-green-500' :
                            framework.status === 'partial' ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-surface-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Last: {framework.lastAudit.toLocaleDateString()}
                        </span>
                        <span className={`flex items-center gap-1 ${daysUntilDue <= 30 ? 'text-red-500' : ''}`}>
                          <Clock className="w-3 h-3" />
                          Due: {daysUntilDue}d
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-surface-400" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.section>

          {/* Quick Actions */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2 variants={itemVariants} className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-3">
              Quick Actions
            </motion.h2>
            <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3">
              {[
                { icon: '📋', label: 'Run Gap Analysis', path: '/gap-analysis' },
                { icon: '📊', label: 'Generate Report', path: '/report-dashboard' },
                { icon: '🗓️', label: 'Schedule Audit', path: '/inspection-scheduling' },
                { icon: '🌍', label: 'Add Region', path: '/organization' },
              ].map((action) => (
                <motion.button
                  key={action.label}
                  variants={itemVariants}
                  onClick={() => navigate(action.path)}
                  className="flex items-center gap-3 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-brand-400 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{action.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.section>
        </main>
      </div>
    </FadeContent>
  );
};

export default GlobalComplianceHub;
