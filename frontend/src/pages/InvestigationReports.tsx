import React, { useState } from 'react';
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
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'High':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'Medium':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'Low':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    default:
      return { bg: 'bg-surface-50', text: 'text-surface-600', border: 'border-surface-200' };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
    case 'Closed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'In Progress':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Open':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-surface-50 text-surface-600 border-surface-200';
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
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100 pb-32">


      <main className="max-w-5xl mx-auto px-5 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            <FileSearch className="w-4 h-4" />
            Incident Investigation
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-900 tracking-tight">Investigation Reports</h1>
          <p className="text-surface-500 max-w-2xl">
            Backend-backed investigation list with RCCA details, exports, and direct drill-down into analysis.
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportAll}
            disabled={exportingAll || listViewModels.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
              exportingAll ? 'bg-green-100 text-green-700' : 'bg-primary-600 hover:bg-primary-700 text-white'
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
          <div className="bg-white p-4 rounded-2xl shadow-soft border border-surface-100">
            <div className="text-2xl font-bold text-brand-900">{listViewModels.length}</div>
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Active Investigations</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-soft border border-surface-100">
            <div className="text-2xl font-bold text-amber-600">{openCount}</div>
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Open Status</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-soft border border-surface-100">
            <div className="text-2xl font-bold text-red-600">{reportableCount}</div>
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Regulatory Reportable</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-soft border border-surface-100">
            <div className="text-2xl font-bold text-emerald-600">{totalCorrectiveActions}</div>
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Corrective Actions</div>
          </div>
        </motion.div>

        {loading && (
          <div className="bg-white rounded-3xl shadow-soft border border-surface-100 p-6 text-surface-500">
            Loading investigations from backend...
          </div>
        )}

        {error && (
          <div className="bg-red-50 rounded-3xl border border-red-200 p-6 text-red-700">
            Failed to load investigations from backend.
          </div>
        )}

        {!loading && !error && listViewModels.length === 0 && (
          <div className="bg-white rounded-3xl shadow-soft border border-surface-100 p-6 text-surface-500">
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
                className="bg-white rounded-3xl shadow-soft border border-surface-100 overflow-hidden"
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
                  className="w-full p-5 text-left flex items-start gap-4 hover:bg-surface-50/50 transition-colors cursor-pointer"
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${severityColors.bg} border ${severityColors.border} flex items-center justify-center`}>
                    <AlertTriangle className={`w-5 h-5 ${severityColors.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-brand-600">{item.id}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          {item.regulatoryReportable && (
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-red-50 text-red-600 border border-red-200">
                              OSHA
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-brand-900 text-base leading-tight">{item.incident}</h3>
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
                              : 'bg-surface-100 hover:bg-primary-100 text-surface-500 hover:text-primary-600'
                          }`}
                          title="Export to Excel"
                        >
                          {exportingId === item.id ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                        </motion.button>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-5 h-5 text-surface-300" />
                        </motion.div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-surface-400">
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
                      <div className="px-5 pb-5 space-y-5 border-t border-surface-100">
                        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Findings Summary</h4>
                            <p className="text-sm text-brand-800 leading-relaxed">{detailModel.findings}</p>
                          </div>
                          <button
                            onClick={() => navigate(`/root-cause?type=incident&id=${detailModel.incidentId}`)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
                          >
                            Open Analysis
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-accent-50 rounded-2xl border border-accent-100">
                            <h4 className="text-xs font-bold text-accent-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4" />Root Causes
                            </h4>
                            {detailModel.rootCauses.length > 0 ? (
                              <ul className="space-y-2">
                                {detailModel.rootCauses.map((cause, causeIndex) => (
                                  <li key={`${detailModel.id}-cause-${causeIndex}`} className="text-sm text-accent-800 flex items-start gap-2">
                                    <span className="text-accent-500 font-bold">{causeIndex + 1}.</span>
                                    {cause}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-accent-800">No root causes saved yet.</p>
                            )}
                          </div>

                          <div className="p-4 bg-surface-50 rounded-2xl border border-surface-200">
                            <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />Contributing Factors
                            </h4>
                            {detailModel.contributingFactors.length > 0 ? (
                              <ul className="space-y-2">
                                {detailModel.contributingFactors.map((factor, factorIndex) => (
                                  <li key={`${detailModel.id}-factor-${factorIndex}`} className="text-sm text-surface-600 flex items-start gap-2">
                                    <span className="text-surface-400">•</span>
                                    {factor}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-surface-600">No contributing factors saved yet.</p>
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100">
                          <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" />Corrective Actions ({detailModel.correctiveActions.length})
                          </h4>
                          {detailModel.correctiveActions.length > 0 ? (
                            <div className="space-y-3">
                              {detailModel.correctiveActions.map((action) => (
                                <div key={action.id} className="bg-white p-4 rounded-xl border border-brand-100">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-brand-900">{action.action}</p>
                                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-surface-500">
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
                            <p className="text-sm text-brand-800">No corrective actions saved yet.</p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <History className="w-4 h-4" />Backend Activity
                          </h4>
                          {detailModel.auditTrail.length > 0 ? (
                            <div className="space-y-2">
                              {detailModel.auditTrail.map((event, auditIndex) => (
                                <div key={event.id} className="flex items-start gap-3 relative">
                                  {auditIndex < detailModel.auditTrail.length - 1 && (
                                    <div className="absolute left-3 top-6 w-px h-full bg-surface-200" />
                                  )}
                                  <div className="w-6 h-6 rounded-full bg-surface-100 flex items-center justify-center flex-shrink-0 z-10">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-surface-500" />
                                  </div>
                                  <div className="flex-1 pb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-xs text-brand-900">{event.action}</span>
                                      <span className="text-[10px] text-surface-400">by {event.user}</span>
                                    </div>
                                    <p className="text-xs text-surface-500 mt-0.5">{event.details}</p>
                                    <p className="text-[10px] text-surface-300 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-surface-500">No backend timeline events are available yet.</p>
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
