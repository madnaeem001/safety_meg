import React, { useState } from 'react';
import { SMButton, SMBadge, SMCard } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileSearch,
  CheckCircle2,
  ChevronDown,
  Calendar,
  User,
  Building2,
  BookOpen,
  Target,
  ClipboardList,
  TrendingUp,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  ArrowUpRight,
  History,
} from 'lucide-react';
import {
  exportInvestigationToExcel,
  exportInvestigationsListToExcel,
  type InvestigationExcelData,
} from '../utils/exports/excelExport';
import {
  useInvestigations,
  useInvestigation,
  useInvestigationRcca,
} from '../api/hooks/useAPIHooks';

interface InvestigationViewModel {
  id: string;
  incident: string;
  incidentId: string;
  date: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Closed';
  industry: string;
  investigator: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  findings: string;
  rootCauses: string[];
  contributingFactors: string[];
  correctiveActions: {
    id: string;
    action: string;
    assignedTo: string;
    assigneeEmail: string;
    dueDate: string;
    status: string;
    sendEmailNotification: boolean;
  }[];
  isoClause: string;
  regulatoryReportable: boolean;
  auditTrail: {
    id: string;
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }[];
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'Critical':
      return { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20' };
    case 'High':
      return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' };
    case 'Medium':
      return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-surface-border' };
    case 'Low':
      return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' };
    default:
      return { bg: 'bg-surface-raised', text: 'text-text-muted', border: 'border-surface-border' };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
    case 'Closed':
      return 'bg-success/10 text-success border-success/20';
    case 'In Progress':
      return 'bg-accent/10 text-accent border-accent/20';
    case 'Open':
      return 'bg-warning/10 text-warning border-warning/20';
    default:
      return 'bg-surface-100 text-text-muted border-surface-border';
  }
};

const normalizeDate = (value?: string | number | null) => {
  if (!value) return 'N/A';
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const buildAuditTrail = (investigator: string, createdAt?: string | number | null, updatedAt?: string | number | null, status?: string) => {
  const trail = [] as InvestigationViewModel['auditTrail'];

  if (createdAt) {
    trail.push({
      id: 'created',
      timestamp: typeof createdAt === 'number' ? new Date(createdAt).toISOString() : String(createdAt),
      action: 'Investigation Opened',
      user: investigator || 'System',
      details: 'Investigation record created in backend',
    });
  }

  if (updatedAt && updatedAt !== createdAt) {
    trail.push({
      id: 'updated',
      timestamp: typeof updatedAt === 'number' ? new Date(updatedAt).toISOString() : String(updatedAt),
      action: 'Investigation Updated',
      user: investigator || 'System',
      details: `Latest backend status: ${status || 'Updated'}`,
    });
  }

  return trail;
};

const toViewModel = (item: {
  id: number;
  incidentId: number;
  investigationDate: string;
  investigator: string;
  industry?: string | null;
  findings?: string | null;
  status: string;
  isoClause?: string | null;
  regulatoryReportable?: boolean | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
}, rcca?: {
  rootCauses: string[];
  fishboneFactors: Record<string, string[]>;
  correctiveActions: { action: string; assignedTo: string; dueDate: string; status: string }[];
} | null): InvestigationViewModel => {
  const rootCauses = rcca?.rootCauses ?? [];
  const contributingFactors = Object.values(rcca?.fishboneFactors ?? {}).flat();
  const correctiveActions = (rcca?.correctiveActions ?? []).map((action, index) => ({
    id: `CA-${item.id}-${index + 1}`,
    action: action.action,
    assignedTo: action.assignedTo,
    assigneeEmail: '',
    dueDate: action.dueDate,
    status: action.status,
    sendEmailNotification: false,
  }));

  return {
    id: `INV-${String(item.id).padStart(3, '0')}`,
    incident: item.findings || `Investigation for Incident #${item.incidentId}`,
    incidentId: String(item.incidentId),
    date: normalizeDate(item.investigationDate),
    status: (item.status as InvestigationViewModel['status']) || 'Open',
    industry: item.industry || 'General',
    investigator: item.investigator || 'Unassigned',
    severity: item.regulatoryReportable ? 'High' : 'Medium',
    findings: item.findings || 'No findings captured yet.',
    rootCauses,
    contributingFactors,
    correctiveActions,
    isoClause: item.isoClause || 'N/A',
    regulatoryReportable: Boolean(item.regulatoryReportable),
    auditTrail: buildAuditTrail(item.investigator, item.createdAt, item.updatedAt, item.status),
  };
};

export const InvestigationReports: React.FC = () => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);
  const { data: investigationsData, loading, error } = useInvestigations();
  const investigations = investigationsData ?? [];
  const { data: expandedInvestigation } = useInvestigation(expandedId);
  const { data: expandedRcca } = useInvestigationRcca(expandedId);

  const listViewModels = investigations.map((item) => toViewModel(item));
  const expandedViewModel = expandedInvestigation
    ? toViewModel(expandedInvestigation, expandedRcca ?? null)
    : null;

  const totalCorrectiveActions = listViewModels.reduce((sum, item) => sum + item.correctiveActions.length, 0);
  const openCount = listViewModels.filter((item) => item.status === 'Open').length;
  const reportableCount = listViewModels.filter((item) => item.regulatoryReportable).length;

  const toExportShape = (item: InvestigationViewModel): InvestigationExcelData => ({
    id: item.id,
    incident: item.incident,
    incidentId: item.incidentId,
    date: item.date,
    status: item.status,
    industry: item.industry,
    investigator: item.investigator,
    severity: item.severity,
    findings: item.findings,
    rootCauses: item.rootCauses,
    contributingFactors: item.contributingFactors,
    correctiveActions: item.correctiveActions.map((action) => ({
      id: action.id,
      action: action.action,
      assignedTo: action.assignedTo,
      dueDate: action.dueDate,
      status: action.status,
    })),
    isoClause: item.isoClause,
    regulatoryReportable: item.regulatoryReportable,
  });

  const handleExportSingle = (item: InvestigationViewModel) => {
    setExportingId(item.id);
    exportInvestigationToExcel(toExportShape(item));
    setExportingId(null);
  };

  const handleExportAll = () => {
    setExportingAll(true);
    exportInvestigationsListToExcel(listViewModels.map(toExportShape));
    setExportingAll(false);
  };

  return (
    <div className="min-h-screen bg-surface-base pb-32">


      <main className="mx-auto max-w-[1440px] space-y-8 px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-[0.3em]">
            <FileSearch className="w-4 h-4" />
            Incident Investigation
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Investigation Reports</h1>
          <p className="max-w-2xl text-text-muted">
            Backend-backed investigation list with RCCA details, exports, and direct drill-down into analysis.
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportAll}
            disabled={exportingAll || listViewModels.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
              exportingAll ? 'bg-success/10 text-success' : 'bg-primary text-text-inverted hover:opacity-90'
            } disabled:opacity-60`}
          >
            {exportingAll ? <CheckCircle2 className="w-4 h-4 animate-pulse" /> : <FileSpreadsheet className="w-4 h-4" />}
            {exportingAll ? 'Exporting...' : 'Export All to Excel'}
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="bg-surface-raised p-4 rounded-2xl shadow-soft border border-surface-border">
            <div className="text-2xl font-bold text-text-primary">{listViewModels.length}</div>
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Investigations</div>
          </div>
          <div className="bg-surface-raised p-4 rounded-2xl shadow-soft border border-surface-border">
            <div className="text-2xl font-bold text-warning">{openCount}</div>
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Open Status</div>
          </div>
          <div className="bg-surface-raised p-4 rounded-2xl shadow-soft border border-surface-border">
            <div className="text-2xl font-bold text-danger">{reportableCount}</div>
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Regulatory Reportable</div>
          </div>
          <div className="bg-surface-raised p-4 rounded-2xl shadow-soft border border-surface-border">
            <div className="text-2xl font-bold text-success">{totalCorrectiveActions}</div>
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Corrective Actions</div>
          </div>
        </motion.div>

        {loading && (
          <div className="bg-surface-raised rounded-3xl shadow-soft border border-surface-border p-6 text-text-muted">
            Loading investigations from backend...
          </div>
        )}

        {error && (
          <div className="bg-red-50 rounded-3xl border border-red-200 p-6 text-red-700">
            Failed to load investigations from backend.
          </div>
        )}

        {!loading && !error && listViewModels.length === 0 && (
          <div className="bg-surface-raised rounded-3xl shadow-soft border border-surface-border p-6 text-text-muted">
            No investigations are available yet.
          </div>
        )}

        <div className="space-y-4">
          {listViewModels.map((item, index) => {
            const isExpanded = expandedId === Number(item.id.replace('INV-', ''));
            const severityColors = getSeverityColor(item.severity);
            const detailModel = isExpanded && expandedViewModel ? expandedViewModel : item;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="bg-surface-raised rounded-3xl shadow-soft border border-surface-border overflow-hidden"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedId(isExpanded ? null : Number(item.id.replace('INV-', '')))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setExpandedId(isExpanded ? null : Number(item.id.replace('INV-', '')));
                    }
                  }}
                  className="w-full p-5 text-left flex items-start gap-4 hover:bg-surface-overlay/50 transition-colors cursor-pointer"
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${severityColors.bg} border ${severityColors.border} flex items-center justify-center`}>
                    <AlertTriangle className={`w-5 h-5 ${severityColors.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-accent">{item.id}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          {item.regulatoryReportable && (
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-danger/10 text-danger border border-danger/20">
                              OSHA
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-text-primary text-base leading-tight">{item.incident}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleExportSingle(detailModel);
                          }}
                          disabled={exportingId === item.id}
                          className={`p-2 rounded-lg transition-colors ${
                            exportingId === item.id
                              ? 'bg-green-100 text-green-600'
                              : 'bg-surface-raised hover:bg-accent/10 text-text-muted hover:text-accent'
                          }`}
                          title="Export to Excel"
                        >
                          {exportingId === item.id ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                        </motion.button>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-5 h-5 text-text-muted" />
                        </motion.div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{item.date}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.investigator}</span>
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{item.industry}</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />ISO {item.isoClause.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-5 border-t border-surface-border">
                        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Findings Summary</h4>
                            <p className="text-sm text-text-primary leading-relaxed">{detailModel.findings}</p>
                          </div>
                          <SMButton
                            variant="primary"
                            size="sm"
                            leftIcon={<ArrowUpRight className="w-4 h-4" />}
                            onClick={() => navigate(`/root-cause?type=incident&id=${detailModel.incidentId}`)}
                          >
                            Open Analysis
                          </SMButton>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-accent/5 rounded-2xl border border-accent/15">
                            <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4" />Root Causes
                            </h4>
                            {detailModel.rootCauses.length > 0 ? (
                              <ul className="space-y-2">
                                {detailModel.rootCauses.map((cause, causeIndex) => (
                                  <li key={`${detailModel.id}-cause-${causeIndex}`} className="text-sm text-text-primary flex items-start gap-2">
                                    <span className="text-accent font-bold">{causeIndex + 1}.</span>
                                    {cause}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-text-primary">No root causes saved yet.</p>
                            )}
                          </div>

                          <div className="p-4 bg-surface-50 rounded-2xl border border-surface-border">
                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />Contributing Factors
                            </h4>
                            {detailModel.contributingFactors.length > 0 ? (
                              <ul className="space-y-2">
                                {detailModel.contributingFactors.map((factor, factorIndex) => (
                                  <li key={`${detailModel.id}-factor-${factorIndex}`} className="text-sm text-text-secondary flex items-start gap-2">
                                    <span className="text-text-muted">•</span>
                                    {factor}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-text-secondary">No contributing factors saved yet.</p>
                            )}
                          </div>
                        </div>

                          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/15">
                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" />Corrective Actions ({detailModel.correctiveActions.length})
                          </h4>
                          {detailModel.correctiveActions.length > 0 ? (
                            <div className="space-y-3">
                              {detailModel.correctiveActions.map((action) => (
                                <div key={action.id} className="bg-surface-raised p-4 rounded-xl border border-surface-border">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-text-primary">{action.action}</p>
                                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-muted">
                                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{action.assignedTo}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Due: {action.dueDate}</span>
                                      </div>
                                    </div>
                                    <span className={`px-2 py-1 text-[9px] font-bold uppercase rounded-full ${getStatusColor(action.status)}`}>
                                      {action.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                              <p className="text-sm text-text-primary">No corrective actions saved yet.</p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                            <History className="w-4 h-4" />Backend Activity
                          </h4>
                          {detailModel.auditTrail.length > 0 ? (
                            <div className="space-y-2">
                              {detailModel.auditTrail.map((event, auditIndex) => (
                                <div key={event.id} className="flex items-start gap-3 relative">
                                  {auditIndex < detailModel.auditTrail.length - 1 && (
                                    <div className="absolute left-3 top-6 w-px h-full bg-surface-raised" />
                                  )}
                                  <div className="w-6 h-6 rounded-full bg-surface-raised flex items-center justify-center flex-shrink-0 z-10">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-text-muted" />
                                  </div>
                                  <div className="flex-1 pb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-xs text-text-primary">{event.action}</span>
                                      <span className="text-[10px] text-text-muted">by {event.user}</span>
                                    </div>
                                    <p className="text-xs text-text-muted mt-0.5">{event.details}</p>
                                    <p className="text-[10px] text-surface-300 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-text-muted">No backend timeline events are available yet.</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default InvestigationReports;
