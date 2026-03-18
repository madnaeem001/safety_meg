import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, Target, Activity, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, Users, FileText, ArrowLeft, Plus, Search,
  ChevronRight, ChevronDown, ChevronUp, Calendar, Shield, RefreshCw,
  Eye, Edit2, Trash2, BarChart3, Award, Settings, BookOpen
} from 'lucide-react';
import { SMButton } from '../../ui';

// PDCA Phase definitions
const PDCA_PHASES = [
  { id: 'plan', label: 'Plan', description: 'Establish quality objectives and processes', color: 'bg-blue-500', lightColor: 'bg-blue-100 text-blue-700' },
  { id: 'do', label: 'Do', description: 'Implement the processes', color: 'bg-green-500', lightColor: 'bg-green-100 text-green-700' },
  { id: 'check', label: 'Check', description: 'Monitor and measure processes', color: 'bg-amber-500', lightColor: 'bg-amber-100 text-amber-700' },
  { id: 'act', label: 'Act', description: 'Take corrective actions for improvement', color: 'bg-purple-500', lightColor: 'bg-purple-100 text-purple-700' },
];

// Quality standards
const QUALITY_STANDARDS = [
  { id: 'iso9001', label: 'ISO 9001:2015', description: 'Quality Management System' },
  { id: 'iso45001', label: 'ISO 45001:2018', description: 'Occupational Health & Safety' },
  { id: 'iso14001', label: 'ISO 14001:2015', description: 'Environmental Management' },
  { id: 'fda', label: 'FDA 21 CFR', description: 'FDA Quality Regulations' },
  { id: 'as9100', label: 'AS9100D', description: 'Aerospace Quality Management' },
];

// Process status types
type ProcessStatus = 'active' | 'under-review' | 'needs-improvement' | 'new';

// Mock quality processes
const mockQualityProcesses = [
  {
    id: 'QP-2026-001',
    title: 'Document Control Procedure',
    standard: 'ISO 9001:2015',
    department: 'Quality',
    owner: 'Sarah Chen',
    status: 'active' as ProcessStatus,
    lastReview: '2025-12-15',
    nextReview: '2026-06-15',
    pdcaPhase: 'check',
    effectiveness: 92,
    nonConformances: 2,
  },
  {
    id: 'QP-2026-002',
    title: 'Corrective Action Process',
    standard: 'ISO 9001:2015',
    department: 'Quality',
    owner: 'Mike Johnson',
    status: 'active' as ProcessStatus,
    lastReview: '2025-11-20',
    nextReview: '2026-05-20',
    pdcaPhase: 'act',
    effectiveness: 88,
    nonConformances: 5,
  },
  {
    id: 'QP-2026-003',
    title: 'Supplier Quality Management',
    standard: 'ISO 9001:2015',
    department: 'Procurement',
    owner: 'Lisa Wong',
    status: 'under-review' as ProcessStatus,
    lastReview: '2025-10-01',
    nextReview: '2026-04-01',
    pdcaPhase: 'plan',
    effectiveness: 75,
    nonConformances: 8,
  },
  {
    id: 'QP-2026-004',
    title: 'Internal Audit Program',
    standard: 'ISO 9001:2015',
    department: 'Quality',
    owner: 'Robert Taylor',
    status: 'active' as ProcessStatus,
    lastReview: '2026-01-10',
    nextReview: '2026-07-10',
    pdcaPhase: 'do',
    effectiveness: 95,
    nonConformances: 1,
  },
  {
    id: 'QP-2026-005',
    title: 'Training & Competence',
    standard: 'ISO 45001:2018',
    department: 'HR',
    owner: 'Jennifer Lee',
    status: 'needs-improvement' as ProcessStatus,
    lastReview: '2025-09-15',
    nextReview: '2026-03-15',
    pdcaPhase: 'act',
    effectiveness: 68,
    nonConformances: 12,
  },
];

// Mock CAPA items
const mockCAPAItems = [
  {
    id: 'CAPA-2026-001',
    type: 'corrective',
    title: 'Document revision control gaps',
    rootCause: 'Inconsistent version numbering',
    status: 'open',
    priority: 'high',
    dueDate: '2026-02-15',
    owner: 'Quality Team',
    processId: 'QP-2026-001',
  },
  {
    id: 'CAPA-2026-002',
    type: 'preventive',
    title: 'Supplier audit frequency',
    rootCause: 'Risk-based approach not implemented',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2026-03-01',
    owner: 'Procurement',
    processId: 'QP-2026-003',
  },
  {
    id: 'CAPA-2026-003',
    type: 'corrective',
    title: 'Training record gaps',
    rootCause: 'Manual tracking system',
    status: 'open',
    priority: 'critical',
    dueDate: '2026-01-31',
    owner: 'HR Department',
    processId: 'QP-2026-005',
  },
];

// Mock audit schedule
const mockAudits = [
  { id: 'AUD-2026-001', type: 'Internal', area: 'Manufacturing', date: '2026-02-05', status: 'scheduled', auditor: 'John Smith' },
  { id: 'AUD-2026-002', type: 'Supplier', area: 'Raw Materials Vendor', date: '2026-02-12', status: 'scheduled', auditor: 'Lisa Wong' },
  { id: 'AUD-2026-003', type: 'Internal', area: 'Document Control', date: '2026-02-20', status: 'scheduled', auditor: 'Sarah Chen' },
  { id: 'AUD-2026-004', type: 'External', area: 'ISO 9001 Certification', date: '2026-03-15', status: 'planned', auditor: 'TÜV Rheinland' },
];

interface QualityManagementProps {
  onNavigate?: (route: string) => void;
  onBack?: () => void;
}

export const QualityManagement: React.FC<QualityManagementProps> = ({ onNavigate, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'processes' | 'capa' | 'audits' | 'metrics'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProcess, setExpandedProcess] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalProcesses = mockQualityProcesses.length;
    const activeProcesses = mockQualityProcesses.filter(p => p.status === 'active').length;
    const avgEffectiveness = Math.round(mockQualityProcesses.reduce((sum, p) => sum + p.effectiveness, 0) / totalProcesses);
    const openCAPAs = mockCAPAItems.filter(c => c.status === 'open' || c.status === 'in-progress').length;
    const upcomingAudits = mockAudits.filter(a => a.status === 'scheduled').length;
    const totalNonConformances = mockQualityProcesses.reduce((sum, p) => sum + p.nonConformances, 0);
    
    return { totalProcesses, activeProcesses, avgEffectiveness, openCAPAs, upcomingAudits, totalNonConformances };
  }, []);

  const getStatusColor = (status: ProcessStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'under-review': return 'bg-amber-100 text-amber-700';
      case 'needs-improvement': return 'bg-red-100 text-red-700';
      case 'new': return 'bg-blue-100 text-blue-700';
      default: return 'bg-surface-100 text-surface-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-surface-100 text-surface-600';
    }
  };

  const filteredProcesses = useMemo(() => {
    let processes = mockQualityProcesses;
    if (searchQuery) {
      processes = processes.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedPhase) {
      processes = processes.filter(p => p.pdcaPhase === selectedPhase);
    }
    return processes;
  }, [searchQuery, selectedPhase]);

  // Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* PDCA Cycle Visualization */}
      <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
        <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-brand-500" />
          PDCA Cycle Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PDCA_PHASES.map((phase, index) => {
            const processCount = mockQualityProcesses.filter(p => p.pdcaPhase === phase.id).length;
            return (
              <motion.div
                key={phase.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedPhase === phase.id ? `${phase.lightColor} ring-2 ring-offset-2` : 'bg-surface-50 hover:bg-surface-100'
                }`}
              >
                <div className={`w-10 h-10 ${phase.color} rounded-full flex items-center justify-center text-white font-bold mb-3`}>
                  {index + 1}
                </div>
                <h4 className="font-bold text-surface-800">{phase.label}</h4>
                <p className="text-xs text-surface-500 mb-2">{phase.description}</p>
                <p className="text-lg font-bold text-surface-800">{processCount} processes</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-5 h-5 text-brand-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Processes</span>
          </div>
          <p className="text-2xl font-bold text-surface-800">{stats.totalProcesses}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Active</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.activeProcesses}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-purple-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Effectiveness</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.avgEffectiveness}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Open CAPAs</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.openCAPAs}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Audits</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.upcomingAudits}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-red-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">NCRs</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.totalNonConformances}</p>
        </div>
      </div>

      {/* Quality Standards */}
      <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
        <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-500" />
          Quality Standards & Certifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUALITY_STANDARDS.map(standard => (
            <div key={standard.id} className="p-4 bg-surface-50 rounded-xl border border-surface-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h4 className="font-bold text-surface-800">{standard.label}</h4>
                  <p className="text-xs text-surface-500">{standard.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Audits Preview */}
      <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-brand-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" />
            Upcoming Audits
          </h3>
          <button
            onClick={() => setActiveTab('audits')}
            className="text-sm text-brand-600 font-medium hover:underline"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {mockAudits.slice(0, 3).map(audit => (
            <div key={audit.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  audit.type === 'External' ? 'bg-purple-100' : audit.type === 'Internal' ? 'bg-blue-100' : 'bg-amber-100'
                }`}>
                  <ClipboardCheck className={`w-5 h-5 ${
                    audit.type === 'External' ? 'text-purple-600' : audit.type === 'Internal' ? 'text-blue-600' : 'text-amber-600'
                  }`} />
                </div>
                <div>
                  <h4 className="font-semibold text-surface-800">{audit.type} Audit</h4>
                  <p className="text-xs text-surface-500">{audit.area}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-surface-800">{audit.date}</p>
                <p className="text-xs text-surface-500">{audit.auditor}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Processes Tab
  const renderProcesses = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="Search processes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
          />
        </div>
        <SMButton variant="primary" size="sm" leftIcon={<Plus className="w-5 h-5" />}>New Process</SMButton>
      </div>

      {/* PDCA Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedPhase(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !selectedPhase ? 'bg-brand-500 text-white' : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
          }`}
        >
          All Phases
        </button>
        {PDCA_PHASES.map(phase => (
          <button
            key={phase.id}
            onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedPhase === phase.id ? phase.lightColor : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
            }`}
          >
            {phase.label}
          </button>
        ))}
      </div>

      {/* Process List */}
      <div className="space-y-3">
        {filteredProcesses.map((process, index) => {
          const phase = PDCA_PHASES.find(p => p.id === process.pdcaPhase);
          return (
            <motion.div
              key={process.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-surface-100 shadow-soft overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-surface-50 transition-colors"
                onClick={() => setExpandedProcess(expandedProcess === process.id ? null : process.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 ${phase?.color || 'bg-surface-200'} rounded-xl flex items-center justify-center text-white`}>
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-surface-400">{process.id}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${getStatusColor(process.status)}`}>
                        {process.status.replace('-', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${phase?.lightColor}`}>
                        {phase?.label}
                      </span>
                    </div>
                    <h4 className="font-semibold text-surface-800">{process.title}</h4>
                    <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        {process.standard}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {process.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        {process.effectiveness}% effective
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {process.nonConformances > 0 && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                        {process.nonConformances} NCRs
                      </span>
                    )}
                    {expandedProcess === process.id ? (
                      <ChevronUp className="w-5 h-5 text-surface-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-surface-400" />
                    )}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedProcess === process.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-surface-100 p-4 bg-surface-50"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-xs text-surface-400">Owner</span>
                        <p className="font-medium text-surface-800">{process.owner}</p>
                      </div>
                      <div>
                        <span className="text-xs text-surface-400">Last Review</span>
                        <p className="font-medium text-surface-800">{process.lastReview}</p>
                      </div>
                      <div>
                        <span className="text-xs text-surface-400">Next Review</span>
                        <p className="font-medium text-surface-800">{process.nextReview}</p>
                      </div>
                      <div>
                        <span className="text-xs text-surface-400">Effectiveness</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                process.effectiveness >= 80 ? 'bg-green-500' :
                                process.effectiveness >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${process.effectiveness}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold">{process.effectiveness}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-brand-100 text-brand-700 font-medium rounded-lg text-sm flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button className="px-3 py-1.5 bg-surface-100 text-surface-700 font-medium rounded-lg text-sm flex items-center gap-1">
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button className="px-3 py-1.5 bg-amber-100 text-amber-700 font-medium rounded-lg text-sm flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Create CAPA
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  // CAPA Tab
  const renderCAPA = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-brand-900">Corrective & Preventive Actions</h3>
        <SMButton variant="primary" size="sm" leftIcon={<Plus className="w-5 h-5" />}>New CAPA</SMButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-bold text-red-700">Open</span>
          </div>
          <p className="text-3xl font-bold text-red-700">{mockCAPAItems.filter(c => c.status === 'open').length}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-bold text-amber-700">In Progress</span>
          </div>
          <p className="text-3xl font-bold text-amber-700">{mockCAPAItems.filter(c => c.status === 'in-progress').length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm font-bold text-green-700">Closed</span>
          </div>
          <p className="text-3xl font-bold text-green-700">{mockCAPAItems.filter(c => c.status === 'closed').length}</p>
        </div>
      </div>

      <div className="space-y-3">
        {mockCAPAItems.map((capa, index) => (
          <motion.div
            key={capa.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft"
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                capa.type === 'corrective' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  capa.type === 'corrective' ? 'text-red-600' : 'text-blue-600'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-surface-400">{capa.id}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${getPriorityColor(capa.priority)}`}>
                    {capa.priority}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                    capa.type === 'corrective' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {capa.type}
                  </span>
                </div>
                <h4 className="font-semibold text-surface-800">{capa.title}</h4>
                <p className="text-sm text-surface-500 mt-1">Root Cause: {capa.rootCause}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Due: {capa.dueDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {capa.owner}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-surface-300" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Audits Tab
  const renderAudits = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-brand-900">Audit Schedule</h3>
        <SMButton variant="primary" size="sm" leftIcon={<Plus className="w-5 h-5" />}>Schedule Audit</SMButton>
      </div>

      <div className="space-y-3">
        {mockAudits.map((audit, index) => (
          <motion.div
            key={audit.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  audit.type === 'External' ? 'bg-purple-100' : audit.type === 'Internal' ? 'bg-blue-100' : 'bg-amber-100'
                }`}>
                  <ClipboardCheck className={`w-6 h-6 ${
                    audit.type === 'External' ? 'text-purple-600' : audit.type === 'Internal' ? 'text-blue-600' : 'text-amber-600'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-surface-400">{audit.id}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                      audit.status === 'scheduled' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {audit.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-surface-800">{audit.type} Audit - {audit.area}</h4>
                  <div className="flex items-center gap-4 mt-1 text-xs text-surface-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {audit.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {audit.auditor}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-surface-300" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Metrics Tab
  const renderMetrics = () => (
    <div className="space-y-6">
      <h3 className="font-bold text-brand-900">Quality Metrics & KPIs</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Effectiveness Trend */}
        <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
          <h4 className="font-bold text-surface-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            Process Effectiveness Trend
          </h4>
          <div className="space-y-3">
            {mockQualityProcesses.map(process => (
              <div key={process.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-600 truncate max-w-[200px]">{process.title}</span>
                  <span className={`font-bold ${
                    process.effectiveness >= 80 ? 'text-green-600' :
                    process.effectiveness >= 60 ? 'text-amber-600' : 'text-red-600'
                  }`}>{process.effectiveness}%</span>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      process.effectiveness >= 80 ? 'bg-green-500' :
                      process.effectiveness >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${process.effectiveness}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NCR by Department */}
        <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
          <h4 className="font-bold text-surface-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-500" />
            Non-Conformances by Department
          </h4>
          <div className="space-y-3">
            {['Quality', 'Procurement', 'HR'].map(dept => {
              const count = mockQualityProcesses
                .filter(p => p.department === dept)
                .reduce((sum, p) => sum + p.nonConformances, 0);
              const maxCount = 15;
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-600">{dept}</span>
                    <span className="font-bold text-surface-800">{count} NCRs</span>
                  </div>
                  <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-surface-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-surface-600" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-brand-900">Quality Management System</h2>
            <p className="text-sm text-surface-500">PDCA-based quality management and continuous improvement</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'processes', label: 'Processes', icon: ClipboardCheck },
          { id: 'capa', label: 'CAPA', icon: AlertTriangle },
          { id: 'audits', label: 'Audits', icon: Calendar },
          { id: 'metrics', label: 'Metrics', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-brand-100 text-brand-700 border border-brand-200'
                : 'bg-white text-surface-500 border border-surface-100 hover:bg-surface-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'processes' && renderProcesses()}
          {activeTab === 'capa' && renderCAPA()}
          {activeTab === 'audits' && renderAudits()}
          {activeTab === 'metrics' && renderMetrics()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default QualityManagement;
