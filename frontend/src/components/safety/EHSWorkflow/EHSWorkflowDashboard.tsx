import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Target,
  Activity,
  Shield,
  Download,
  FolderKanban
} from 'lucide-react';
import { StageStepper } from './StageStepper';
import { StageCard } from './StageCard';
import { ActionModal } from './ActionModal';
import { DetailModal } from './DetailModal';
import { ExportModal } from './ExportModal';
import { ProjectWorkflow } from './ProjectWorkflow';
import {
  WorkflowStage,
  workflowStages,
  mockObservations,
  mockIncidents,
  mockInvestigations,
  mockCAPAs,
  mockAudits,
  mockBBSObservations,
  mockComplianceObligations,
  mockMetrics,
  Observation,
  Incident,
  Investigation,
  CAPA,
  Audit,
  BBSObservation,
  ComplianceObligation
} from '../../../data/mockEHSWorkflow';

interface EHSWorkflowDashboardProps {
  onBack?: () => void;
}

type DashboardTab = 'ehs' | 'project';

export const EHSWorkflowDashboard: React.FC<EHSWorkflowDashboardProps> = ({ onBack }) => {
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('ehs');
  const [activeStage, setActiveStage] = useState<WorkflowStage>('observation');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<unknown>(null);
  const [selectedStage, setSelectedStage] = useState<WorkflowStage>('observation');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // In-memory state for dynamic data
  const [observations, setObservations] = useState<Observation[]>(mockObservations);
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [investigations, setInvestigations] = useState<Investigation[]>(mockInvestigations);
  const [capas, setCAPAs] = useState<CAPA[]>(mockCAPAs);
  const [audits, setAudits] = useState<Audit[]>(mockAudits);
  const [bbsObservations, setBBSObservations] = useState<BBSObservation[]>(mockBBSObservations);
  const [complianceObligations, setComplianceObligations] = useState<ComplianceObligation[]>(mockComplianceObligations);

  // Calculate stage counts
  const stageCounts = useMemo(() => ({
    observation: observations.length,
    incident: incidents.length,
    investigation: investigations.length,
    capa: capas.length,
    audit: audits.length,
    bbs: bbsObservations.length,
    compliance: complianceObligations.length,
    reporting: 0,
    improvement: 0
  }), [observations, incidents, investigations, capas, audits, bbsObservations, complianceObligations]);

  // Get items for current stage
  const getCurrentStageItems = () => {
    switch (activeStage) {
      case 'observation': return observations;
      case 'incident': return incidents;
      case 'investigation': return investigations;
      case 'capa': return capas;
      case 'audit': return audits;
      case 'bbs': return bbsObservations;
      case 'compliance': return complianceObligations;
      default: return [];
    }
  };

  // Handle item click
  const handleItemClick = (item: unknown, stage: WorkflowStage) => {
    setSelectedItem(item);
    setSelectedStage(stage);
    setDetailModalOpen(true);
  };

  // Handle action click
  const handleActionClick = (action: string, stage: WorkflowStage) => {
    setCurrentAction(action);
    setModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = (data: Record<string, unknown>) => {
    switch (currentAction) {
      case 'submit_observation':
        setObservations(prev => [data as unknown as Observation, ...prev]);
        break;
      case 'report_incident':
        setIncidents(prev => [data as unknown as Incident, ...prev]);
        break;
      case 'assign_capa':
        setCAPAs(prev => [data as unknown as CAPA, ...prev]);
        break;
      case 'schedule_audit':
        setAudits(prev => [data as unknown as Audit, ...prev]);
        break;
      case 'start_investigation':
        const newInvestigation: Investigation = {
          id: `INV-${Date.now()}`,
          incidentId: '',
          investigator: 'Current User',
          startDate: new Date().toISOString(),
          status: 'in_progress',
          fiveWhyAnalysis: [],
          rootCauses: [],
          contributingFactors: [],
          evidence: [],
          capaIds: []
        };
        setInvestigations(prev => [newInvestigation, ...prev]);
        break;
    }
    setModalOpen(false);
  };

  // Get current stage info
  const currentStageInfo = workflowStages.find(s => s.id === activeStage);

  // Calculate metrics
  const pendingItems = useMemo(() => {
    let count = 0;
    count += observations.filter(o => o.status === 'pending' || o.status === 'in_progress').length;
    count += incidents.filter(i => i.status === 'pending' || i.status === 'in_progress').length;
    count += capas.filter(c => c.status === 'pending' || c.status === 'in_progress').length;
    return count;
  }, [observations, incidents, capas]);

  const overdueItems = useMemo(() => {
    const now = new Date();
    return capas.filter(c => new Date(c.dueDate) < now && c.status !== 'completed').length +
           complianceObligations.filter(co => new Date(co.dueDate) < now && co.status !== 'completed').length;
  }, [capas, complianceObligations]);

  // Show Project Management workflow if that tab is active
  if (dashboardTab === 'project') {
    return (
      <>
        {/* Dashboard Tab Switcher */}
        <div className="bg-white border-b border-surface-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 py-3">
              <button
                onClick={() => setDashboardTab('ehs')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all bg-surface-100 text-surface-600 hover:bg-surface-200"
              >
                <Shield className="w-4 h-4" />
                EHS Workflow
              </button>
              <button
                onClick={() => setDashboardTab('project')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all bg-indigo-600 text-white shadow-lg"
              >
                <FolderKanban className="w-4 h-4" />
                Project Management
              </button>
            </div>
          </div>
        </div>
        <ProjectWorkflow />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-100">
      {/* Dashboard Tab Switcher */}
      <div className="bg-white border-b border-surface-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex gap-2">
              <button
                onClick={() => setDashboardTab('ehs')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all bg-brand-600 text-white shadow-lg"
              >
                <Shield className="w-4 h-4" />
                EHS Workflow
              </button>
              <button
                onClick={() => setDashboardTab('project')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
              >
                <FolderKanban className="w-4 h-4" />
                Project Management
              </button>
            </div>
            {/* Export Button */}
            <button
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-surface-200/60 sticky top-12 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-xl hover:bg-surface-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-surface-600" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-surface-800">Unified EHS Workflow</h1>
                <p className="text-xs text-surface-500">Standard workflow aligned with ISO 45001</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-surface-400 hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Stage Stepper */}
          <StageStepper
            activeStage={activeStage}
            onStageClick={setActiveStage}
            stageCounts={stageCounts}
            orientation="horizontal"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-surface-200 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-brand-100 rounded-lg">
                <Target className="w-4 h-4 text-brand-600" />
              </div>
              <span className="text-xs text-surface-500">TRIR</span>
            </div>
            <div className="text-2xl font-bold text-surface-800">{mockMetrics.trir}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-[10px] text-green-600">-0.3 vs last quarter</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-xl border border-surface-200 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs text-surface-500">Pending</span>
            </div>
            <div className="text-2xl font-bold text-surface-800">{pendingItems}</div>
            <div className="text-[10px] text-surface-400 mt-1">Items requiring action</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-surface-200 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs text-surface-500">Overdue</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{overdueItems}</div>
            <div className="text-[10px] text-surface-400 mt-1">Past due date</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl border border-surface-200 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-surface-500">Compliance</span>
            </div>
            <div className="text-2xl font-bold text-surface-800">{mockMetrics.complianceRate}%</div>
            <div className="text-[10px] text-green-600 mt-1">Regulatory compliance</div>
          </motion.div>
        </div>

        {/* Active Stage Header */}
        <motion.div
          key={activeStage}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-surface-800">{currentStageInfo?.name}</h2>
              <p className="text-xs text-surface-500">{currentStageInfo?.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-surface-400">
                {stageCounts[activeStage]} items
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stage Content */}
        {activeStage === 'reporting' ? (
          <ReportingDashboard metrics={mockMetrics} />
        ) : activeStage === 'improvement' ? (
          <ImprovementDashboard />
        ) : (
          <motion.div
            key={`content-${activeStage}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <StageCard
              stage={activeStage}
              items={getCurrentStageItems()}
              onItemClick={handleItemClick}
              onActionClick={handleActionClick}
            />
          </motion.div>
        )}
      </div>

      {/* Action Modal */}
      <ActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        actionType={currentAction}
        stage={activeStage}
        onSubmit={handleSubmit}
      />

      {/* Detail Modal */}
      <DetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        item={selectedItem}
        stage={selectedStage}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        stage={activeStage}
        data={{
          observations,
          incidents,
          capas,
          audits,
          bbsObservations,
          complianceObligations,
          metrics: mockMetrics
        }}
      />
    </div>
  );
};

// Reporting Dashboard Component
const ReportingDashboard: React.FC<{ metrics: typeof mockMetrics }> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-surface-200 p-4">
          <div className="text-xs text-surface-500 mb-1">Total Recordable Incident Rate</div>
          <div className="text-3xl font-bold text-surface-800">{metrics.trir}</div>
          <div className="h-1 bg-surface-100 rounded-full mt-3">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(metrics.trir / 5 * 100, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-surface-200 p-4">
          <div className="text-xs text-surface-500 mb-1">Lost Time Incident Rate</div>
          <div className="text-3xl font-bold text-surface-800">{metrics.ltir}</div>
          <div className="h-1 bg-surface-100 rounded-full mt-3">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(metrics.ltir / 2 * 100, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-surface-200 p-4">
          <div className="text-xs text-surface-500 mb-1">CAPA Closure Rate</div>
          <div className="text-3xl font-bold text-green-600">{metrics.capaClosureRate}%</div>
          <div className="h-1 bg-surface-100 rounded-full mt-3">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${metrics.capaClosureRate}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-surface-200 p-4">
          <div className="text-xs text-surface-500 mb-1">Compliance Rate</div>
          <div className="text-3xl font-bold text-brand-600">{metrics.complianceRate}%</div>
          <div className="h-1 bg-surface-100 rounded-full mt-3">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${metrics.complianceRate}%` }} />
          </div>
        </div>
      </div>

      {/* Leading Indicators */}
      <div className="bg-white rounded-xl border border-surface-200 p-4">
        <h3 className="text-sm font-semibold text-surface-800 mb-4">Leading Indicators (This Month)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics.leadingIndicators.observations}</div>
            <div className="text-xs text-surface-500">Observations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-600">{metrics.leadingIndicators.inspections}</div>
            <div className="text-xs text-surface-500">Inspections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{metrics.leadingIndicators.trainings}</div>
            <div className="text-xs text-surface-500">Training Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.leadingIndicators.audits}</div>
            <div className="text-xs text-surface-500">Audits</div>
          </div>
        </div>
      </div>

      {/* Incident Rate by Location */}
      <div className="bg-white rounded-xl border border-surface-200 p-4">
        <h3 className="text-sm font-semibold text-surface-800 mb-4">Incident Rate by Location</h3>
        <div className="space-y-3">
          {metrics.incidentRateByLocation.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-24 text-xs text-surface-600">{item.location}</div>
              <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.rate > 4 ? 'bg-red-500' :
                    item.rate > 2 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(item.rate / 5 * 100, 100)}%` }}
                />
              </div>
              <div className="w-10 text-xs text-surface-600 text-right">{item.rate}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="flex gap-3 justify-center">
        <button className="px-4 py-2 text-xs font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors">
          Export to Excel
        </button>
        <button className="px-4 py-2 text-xs font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors">
          Export to PDF
        </button>
        <button className="px-4 py-2 text-xs font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors">
          Generate Full Report
        </button>
      </div>
    </div>
  );
};

// Continuous Improvement Dashboard
const ImprovementDashboard: React.FC = () => {
  const improvementAreas = [
    { name: 'Audits', icon: Activity, linked: 8, color: 'teal' },
    { name: 'Incidents', icon: AlertTriangle, linked: 12, color: 'red' },
    { name: 'Observations', icon: Target, linked: 47, color: 'blue' },
    { name: 'Risk Assessments', icon: Shield, linked: 15, color: 'purple' },
    { name: 'Training', icon: BarChart3, linked: 156, color: 'green' },
    { name: 'Corrective Actions', icon: CheckCircle2, linked: 24, color: 'amber' }
  ];

  return (
    <div className="space-y-6">
      {/* ISO 45001 Alignment */}
      <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 rounded-xl border border-brand-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white rounded-xl shadow-soft">
            <RefreshCw className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-brand-800">Continuous Improvement Cycle</h3>
            <p className="text-xs text-brand-600">ISO 45001:2018 Aligned Management System</p>
          </div>
        </div>
        <p className="text-sm text-brand-700 mb-4">
          This workflow integrates all EHS modules into a unified continuous improvement loop, 
          ensuring compliance with ISO 45001 requirements for occupational health and safety management.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 text-xs bg-white/80 rounded-full text-brand-700">Plan</span>
          <span className="px-2 py-1 text-xs bg-white/80 rounded-full text-brand-700">Do</span>
          <span className="px-2 py-1 text-xs bg-white/80 rounded-full text-brand-700">Check</span>
          <span className="px-2 py-1 text-xs bg-white/80 rounded-full text-brand-700">Act</span>
        </div>
      </div>

      {/* Connected Modules */}
      <div className="bg-white rounded-xl border border-surface-200 p-4">
        <h3 className="text-sm font-semibold text-surface-800 mb-4">Connected Modules</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {improvementAreas.map((area, idx) => {
            const IconComponent = area.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl border border-${area.color}-200 bg-${area.color}-50/50 cursor-pointer`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className={`w-4 h-4 text-${area.color}-600`} />
                  <span className="text-sm font-medium text-surface-700">{area.name}</span>
                </div>
                <div className="text-2xl font-bold text-surface-800">{area.linked}</div>
                <div className="text-[10px] text-surface-500">Linked records</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-white rounded-xl border border-surface-200 p-4">
        <h3 className="text-sm font-semibold text-surface-800 mb-4">Improvement Opportunities</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <div className="flex-1">
              <div className="text-xs font-medium text-surface-700">High forklift near-miss rate in Warehouse</div>
              <div className="text-[10px] text-surface-500">3 incidents in last 30 days</div>
            </div>
            <button className="px-2 py-1 text-[10px] font-medium text-amber-700 bg-amber-100 rounded hover:bg-amber-200">
              Review
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Activity className="w-4 h-4 text-blue-600" />
            <div className="flex-1">
              <div className="text-xs font-medium text-surface-700">Observation rate increased 25%</div>
              <div className="text-[10px] text-surface-500">Employee engagement improving</div>
            </div>
            <button className="px-2 py-1 text-[10px] font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200">
              Celebrate
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <div className="flex-1">
              <div className="text-xs font-medium text-surface-700">CAPA closure rate at 82%</div>
              <div className="text-[10px] text-surface-500">Above 80% target</div>
            </div>
            <button className="px-2 py-1 text-[10px] font-medium text-green-700 bg-green-100 rounded hover:bg-green-200">
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EHSWorkflowDashboard;
