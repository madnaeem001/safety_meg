import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileSearch,
  Target,
  GitBranch,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Plus,
  Save,
  ArrowLeft,
  FileText,
  Users,
  Calendar,
  MessageSquare,
  Paperclip,
  Send,
  Filter,
  Download,
  BarChart3
} from 'lucide-react';
import { SMButton } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { FishboneDiagram } from './FishboneDiagram';
import { FiveWhysAnalysis } from './FiveWhysAnalysis';
import { LessonsLearnedPanel } from './LessonsLearnedPanel';

type InvestigationPhase = 'overview' | 'investigation' | 'root-cause' | 'fishbone' | 'five-whys' | 'corrective-action' | 'lessons-learned';

interface Investigation {
  id: string;
  incidentId: string;
  title: string;
  status: 'pending' | 'in-progress' | 'review' | 'completed';
  phase: InvestigationPhase;
  assignee: string;
  dueDate: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

const mockInvestigations: Investigation[] = [
  {
    id: 'INV-2026-001',
    incidentId: 'INC-2026-045',
    title: 'Hand laceration from machinery',
    status: 'in-progress',
    phase: 'root-cause',
    assignee: 'John Smith',
    dueDate: '2026-02-15',
    severity: 'high',
    createdAt: '2026-01-28'
  },
  {
    id: 'INV-2026-002',
    incidentId: 'INC-2026-042',
    title: 'Forklift near miss in warehouse',
    status: 'review',
    phase: 'corrective-action',
    assignee: 'Emily Chen',
    dueDate: '2026-02-10',
    severity: 'medium',
    createdAt: '2026-01-25'
  },
  {
    id: 'INV-2026-003',
    incidentId: 'INC-2026-039',
    title: 'Chemical spill in Lab 102',
    status: 'completed',
    phase: 'lessons-learned',
    assignee: 'Mike Davis',
    dueDate: '2026-02-05',
    severity: 'high',
    createdAt: '2026-01-20'
  },
  {
    id: 'INV-2026-004',
    incidentId: 'INC-2026-048',
    title: 'Slip and fall in break room',
    status: 'pending',
    phase: 'investigation',
    assignee: 'Sarah Johnson',
    dueDate: '2026-02-20',
    severity: 'low',
    createdAt: '2026-02-01'
  },
];

const phaseConfig: Record<InvestigationPhase, { label: string; icon: React.ElementType; color: string }> = {
  'overview': { label: 'Overview', icon: FileSearch, color: 'from-slate-500 to-gray-500' },
  'investigation': { label: 'Investigation', icon: Search, color: 'from-blue-500 to-cyan-500' },
  'root-cause': { label: 'Root Cause', icon: GitBranch, color: 'from-purple-500 to-indigo-500' },
  'fishbone': { label: 'Fishbone Diagram', icon: GitBranch, color: 'from-amber-500 to-orange-500' },
  'five-whys': { label: '5 Whys Analysis', icon: HelpCircle, color: 'from-pink-500 to-rose-500' },
  'corrective-action': { label: 'Corrective Action', icon: Target, color: 'from-emerald-500 to-green-500' },
  'lessons-learned': { label: 'Lessons Learned', icon: Lightbulb, color: 'from-yellow-500 to-amber-500' },
};

interface CorrectiveAction {
  id: string;
  description: string;
  type: 'immediate' | 'short-term' | 'long-term';
  responsible: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
}

const mockCorrectiveActions: CorrectiveAction[] = [
  {
    id: 'CA-001',
    description: 'Install machine guard on conveyor belt',
    type: 'immediate',
    responsible: 'Maintenance Team',
    dueDate: '2026-02-05',
    status: 'completed',
    priority: 'high'
  },
  {
    id: 'CA-002',
    description: 'Update SOP for machine operation',
    type: 'short-term',
    responsible: 'Safety Manager',
    dueDate: '2026-02-15',
    status: 'in-progress',
    priority: 'medium'
  },
  {
    id: 'CA-003',
    description: 'Conduct refresher training for all operators',
    type: 'short-term',
    responsible: 'Training Dept',
    dueDate: '2026-02-20',
    status: 'pending',
    priority: 'high'
  },
  {
    id: 'CA-004',
    description: 'Implement preventive maintenance schedule',
    type: 'long-term',
    responsible: 'Maintenance Manager',
    dueDate: '2026-03-15',
    status: 'pending',
    priority: 'medium'
  },
];

interface UnifiedInvestigationProps {
  onBack?: () => void;
}

export const UnifiedInvestigation: React.FC<UnifiedInvestigationProps> = ({ onBack }) => {
  const toast = useToast();
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [activePhase, setActivePhase] = useState<InvestigationPhase>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>(mockCorrectiveActions);
  const [showAddAction, setShowAddAction] = useState(false);

  const phases: InvestigationPhase[] = ['investigation', 'root-cause', 'fishbone', 'five-whys', 'corrective-action', 'lessons-learned'];

  const filteredInvestigations = mockInvestigations.filter(inv => {
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
    if (searchQuery && !inv.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-surface-overlay text-text-muted border-surface-border';
      case 'in-progress': return 'bg-accent/20 text-accent border-accent/30';
      case 'review': return 'bg-warning/20 text-warning border-warning/30';
      case 'completed': return 'bg-success/20 text-success border-success/30';
      case 'overdue': return 'bg-danger/20 text-danger border-danger/30';
      default: return 'bg-surface-overlay text-text-muted border-surface-border';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-success/20 text-success';
      case 'medium': return 'bg-warning/20 text-warning';
      case 'high': return 'bg-warning/20 text-warning';
      case 'critical': return 'bg-danger/20 text-danger';
      default: return 'bg-surface-overlay text-text-muted';
    }
  };

  const renderPhaseContent = () => {
    if (!selectedInvestigation) return null;

    switch (activePhase) {
      case 'investigation':
        return (
          <div className="space-y-6">
            <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border">
              <h3 className="text-lg font-bold text-text-primary mb-4">Investigation Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Investigation Lead</label>
                  <input
                    type="text"
                    defaultValue={selectedInvestigation.assignee}
                    className="w-full bg-surface-sunken border border-surface-border rounded-xl px-4 py-3 text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Investigation Date</label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full bg-surface-sunken border border-surface-border rounded-xl px-4 py-3 text-text-primary"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-muted mb-2">Sequence of Events</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the sequence of events leading to the incident..."
                    className="w-full bg-surface-sunken border border-surface-border rounded-xl px-4 py-3 text-text-primary resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-muted mb-2">Evidence Collected</label>
                  <textarea
                    rows={3}
                    placeholder="Photos, witness statements, documents, etc..."
                    className="w-full bg-surface-sunken border border-surface-border rounded-xl px-4 py-3 text-text-primary resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-muted mb-2">Contributing Factors</label>
                  <textarea
                    rows={3}
                    placeholder="Environmental conditions, equipment issues, human factors..."
                    className="w-full bg-surface-sunken border border-surface-border rounded-xl px-4 py-3 text-text-primary resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Witness Statements */}
            <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-primary">Witness Statements</h3>
                <SMButton variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Add Witness</SMButton>
              </div>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-surface-sunken rounded-xl p-4 border border-surface-border">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-surface-overlay rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-text-muted" />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Witness name"
                          className="w-full bg-transparent border-none text-text-primary font-medium placeholder:text-text-muted focus:outline-none mb-2"
                        />
                        <textarea
                          placeholder="Enter witness statement..."
                          rows={2}
                          className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-text-secondary resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'root-cause':
        return (
          <div className="space-y-6">
            <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border">
              <h3 className="text-lg font-bold text-text-primary mb-4">Root Cause Identification</h3>
              <p className="text-sm text-text-muted mb-6">
                Use the Fishbone Diagram and 5 Whys analysis tools below to systematically identify root causes.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setActivePhase('fishbone')}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl hover:from-amber-500/30 hover:to-orange-500/30 transition-colors"
                >
                  <div className="w-12 h-12 bg-warning/20 rounded-xl flex items-center justify-center">
                    <GitBranch className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-text-primary font-semibold">Fishbone Diagram</h4>
                    <p className="text-sm text-text-muted">Ishikawa cause-and-effect analysis</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted ml-auto" />
                </button>
                <button
                  onClick={() => setActivePhase('five-whys')}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-ai/20 to-ai/10 border border-ai/30 rounded-xl hover:from-ai/30 hover:to-ai/20 transition-colors"
                >
                  <div className="w-12 h-12 bg-ai/20 rounded-xl flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-ai" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-text-primary font-semibold">5 Whys Analysis</h4>
                    <p className="text-sm text-text-muted">Iterative interrogative technique</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted ml-auto" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Identified Root Cause(s)</label>
                <textarea
                  rows={4}
                  placeholder="Document the root cause(s) identified through your analysis..."
                  className="w-full bg-surface-sunken border border-surface-border rounded-xl px-4 py-3 text-text-primary resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 'fishbone':
        return (
          <div className="space-y-4">
            <button
              onClick={() => setActivePhase('root-cause')}
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Root Cause
            </button>
            <FishboneDiagram
              problemStatement={selectedInvestigation.title}
              onSave={() => toast.success('Fishbone analysis saved.')}
            />
          </div>
        );

      case 'five-whys':
        return (
          <div className="space-y-4">
            <button
              onClick={() => setActivePhase('root-cause')}
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Root Cause
            </button>
            <FiveWhysAnalysis
              problemStatement={selectedInvestigation.title}
              onComplete={() => toast.success('5 Whys analysis completed.')}
            />
          </div>
        );

      case 'corrective-action':
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Actions', value: correctiveActions.length, color: 'from-blue-500 to-cyan-500' },
                { label: 'Completed', value: correctiveActions.filter(a => a.status === 'completed').length, color: 'from-emerald-500 to-green-500' },
                { label: 'In Progress', value: correctiveActions.filter(a => a.status === 'in-progress').length, color: 'from-amber-500 to-orange-500' },
                { label: 'Pending', value: correctiveActions.filter(a => a.status === 'pending').length, color: 'from-slate-500 to-gray-500' },
              ].map((stat) => (
                <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-text-onAccent`}>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm opacity-90">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Actions List */}
            <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-primary">Corrective Actions (CAPA)</h3>
                <SMButton variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddAction(true)}>Add Action</SMButton>
              </div>

              <div className="space-y-4">
                {correctiveActions.map((action) => (
                  <motion.div
                    key={action.id}
                    layout
                    className="bg-surface-sunken rounded-xl p-4 border border-surface-border"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${
                            action.type === 'immediate' ? 'bg-danger/20 text-danger' :
                            action.type === 'short-term' ? 'bg-warning/20 text-warning' :
                            'bg-accent/20 text-accent'
                          }`}>
                            {action.type}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${getStatusColor(action.status)}`}>
                            {action.status}
                          </span>
                        </div>
                        <p className="text-text-primary font-medium mb-2">{action.description}</p>
                        <div className="flex items-center gap-4 text-sm text-text-muted">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {action.responsible}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Due: {action.dueDate}
                          </span>
                        </div>
                      </div>
                      {action.status !== 'completed' && (
                        <button
                          onClick={() => setCorrectiveActions(prev =>
                            prev.map(a => a.id === action.id ? { ...a, status: 'completed' } : a)
                          )}
                          className="px-3 py-1.5 bg-success hover:bg-success/80 rounded-lg text-text-onAccent text-sm font-medium transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'lessons-learned':
        return (
          <LessonsLearnedPanel
            incidentId={selectedInvestigation.incidentId}
            incidentTitle={selectedInvestigation.title}
            onSave={() => toast.success('Lessons learned saved.')}
          />
        );

      default:
        return null;
    }
  };

  if (selectedInvestigation) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedInvestigation(null);
              setActivePhase('overview');
            }}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-raised border border-surface-border hover:bg-surface-overlay transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-primary">{selectedInvestigation.id}</h1>
              <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${getStatusColor(selectedInvestigation.status)}`}>
                {selectedInvestigation.status}
              </span>
              <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${getSeverityColor(selectedInvestigation.severity)}`}>
                {selectedInvestigation.severity}
              </span>
            </div>
            <p className="text-sm text-text-muted">{selectedInvestigation.title}</p>
          </div>
          <SMButton variant="primary" leftIcon={<Save className="w-4 h-4" />}>Save Progress</SMButton>
        </div>

        {/* Phase Navigation */}
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          {phases.map((phase, index) => {
            const config = phaseConfig[phase];
            const isActive = activePhase === phase;
            const phaseIndex = phases.indexOf(selectedInvestigation.phase);
            const isCompleted = index < phaseIndex;
            const isCurrent = phase === selectedInvestigation.phase;

            return (
              <button
                key={phase}
                onClick={() => setActivePhase(phase)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${config.color} text-text-onAccent`
                    : isCompleted
                    ? 'bg-success/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-surface-raised text-text-muted border border-surface-border hover:bg-surface-overlay'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <config.icon className="w-4 h-4" />
                )}
                {config.label}
                {isCurrent && !isCompleted && (
                  <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Phase Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePhase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderPhaseContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Incident Investigation</h2>
          <p className="text-text-muted">Unified investigation workflow with root cause analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search investigations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-surface-raised border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-surface-raised border border-surface-border rounded-xl px-4 py-2.5 text-text-secondary text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Under Review</option>
            <option value="completed">Completed</option>
          </select>
          <SMButton variant="primary" leftIcon={<Plus className="w-4 h-4" />}>New Investigation</SMButton>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open Investigations', value: 12, icon: FileSearch, color: 'from-blue-500 to-cyan-500', trend: '+2 this week' },
          { label: 'Pending CAPAs', value: 28, icon: Target, color: 'from-amber-500 to-orange-500', trend: '8 overdue' },
          { label: 'Avg. Resolution', value: '5.2d', icon: Clock, color: 'from-purple-500 to-indigo-500', trend: '-1.5d vs target' },
          { label: 'Completion Rate', value: '94%', icon: CheckCircle2, color: 'from-emerald-500 to-green-500', trend: '+6% this month' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-text-onAccent relative overflow-hidden`}
          >
            <div className="relative z-10">
              <stat.icon className="w-6 h-6 opacity-80 mb-2" />
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-sm opacity-90">{stat.label}</div>
              <div className="text-xs opacity-70 mt-1">{stat.trend}</div>
            </div>
            <stat.icon className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
          </motion.div>
        ))}
      </div>

      {/* Investigation List */}
      <div className="bg-surface-raised rounded-2xl border border-surface-border overflow-hidden">
        <div className="p-4 border-b border-surface-border">
          <h3 className="text-lg font-bold text-text-primary">Active Investigations</h3>
        </div>
        <div className="divide-y divide-surface-border/50">
          {filteredInvestigations.map((investigation) => {
            const phaseConfig_ = phaseConfig[investigation.phase];
            return (
              <motion.div
                key={investigation.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.3)' }}
                onClick={() => {
                  setSelectedInvestigation(investigation);
                  setActivePhase(investigation.phase);
                }}
                className="p-4 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${phaseConfig_.color} flex items-center justify-center`}>
                    <phaseConfig_.icon className="w-6 h-6 text-text-onAccent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-text-primary">{investigation.id}</span>
                      <span className="text-xs text-text-muted">•</span>
                      <span className="text-xs text-text-muted">{investigation.incidentId}</span>
                    </div>
                    <p className="text-sm text-text-secondary truncate">{investigation.title}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${getStatusColor(investigation.status)}`}>
                        {investigation.status}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${getSeverityColor(investigation.severity)}`}>
                        {investigation.severity}
                      </span>
                      <span className="text-xs text-text-muted">
                        Phase: {phaseConfig_.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
                      <Users className="w-4 h-4" />
                      {investigation.assignee}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Calendar className="w-3 h-3" />
                      Due: {investigation.dueDate}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UnifiedInvestigation;
