import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Calendar,
  User,
  Building2,
  FileText,
  Target,
  ChevronDown,
  ClipboardList,
  Sparkles,
  Brain,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  useAudit,
  useAudits,
  useAuditStats,
  useOpenAuditFindings,
  useCreateAudit,
  useCreateAuditFinding,
} from '../api/hooks/useAPIHooks';
import {
  aiAssistantService,
} from '../api/services/apiService';
import type { AuditFinding, AuditRecord, CreateAuditFindingPayload, CreateAuditPayload, AISuggestionPayload, AISuggestionResult } from '../api/services/apiService';

type AuditTab = 'overview' | 'audits' | 'findings';
type AuditType = CreateAuditPayload['auditType'];
type FindingSeverity = CreateAuditFindingPayload['severity'];

const AUDIT_TYPES: AuditType[] = ['Safety', 'Environmental', 'Quality', 'Compliance', 'Process'];
const FINDING_SEVERITIES: FindingSeverity[] = ['Critical', 'Major', 'Minor', 'Observation'];
const AUDIT_STATUSES = ['All', 'Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Overdue'] as const;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
    case 'Closed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'In Progress':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Scheduled':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Overdue':
    case 'Critical':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Major':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Minor':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    default:
      return 'bg-surface-50 text-surface-600 border-surface-200';
  }
};

const formatDate = (value?: string | number | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const formatScore = (value?: number | null) => (typeof value === 'number' ? `${value}%` : 'N/A');

export const SafetyAudit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AuditTab>('overview');
  const [statusFilter, setStatusFilter] = useState<(typeof AUDIT_STATUSES)[number]>('All');
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const [severityFilter, setSeverityFilter] = useState<FindingSeverity | 'All'>('All');
  const [showCreateAuditForm, setShowCreateAuditForm] = useState(false);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [createAuditMessage, setCreateAuditMessage] = useState<string | null>(null);
  const [createFindingMessage, setCreateFindingMessage] = useState<string | null>(null);
  const [auditForm, setAuditForm] = useState<CreateAuditPayload>({
    auditNumber: `AUD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    title: '',
    auditType: 'Safety',
    location: '',
    department: '',
    industry: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    leadAuditor: '',
    auditTeam: [],
    auditee: '',
  });
  const [findingForm, setFindingForm] = useState<CreateAuditFindingPayload>({
    category: '',
    finding: '',
    severity: 'Major',
    recommendation: '',
    responsiblePerson: '',
    dueDate: '',
    regulatoryRef: '',
  });

  const auditParams = useMemo(
    () => ({ status: statusFilter === 'All' ? undefined : statusFilter }),
    [statusFilter]
  );

  const { data: auditStats, loading: statsLoading } = useAuditStats();
  const { data: auditsData, loading: auditsLoading, refetch: refetchAudits } = useAudits(auditParams);
  const audits = auditsData ?? [];
  const { data: selectedAudit, loading: auditDetailLoading } = useAudit(selectedAuditId);
  const { data: openFindingsData, loading: findingsLoading, refetch: refetchFindings } = useOpenAuditFindings(
    severityFilter === 'All' ? undefined : severityFilter
  );
  const openFindings = openFindingsData ?? [];
  const createAudit = useCreateAudit();
  const createAuditFinding = useCreateAuditFinding();

  // ── AI ────────────────────────────────────────────────
  const [aidSuggestions, setAidSuggestions] = useState<string[]>([]);
  const [aidSuggestLoading, setAidSuggestLoading] = useState(false);
  // per-finding root cause AI state: findingId -> { open, loading, suggestions }
  const [findingAI, setFindingAI] = useState<Record<string, { open: boolean; loading: boolean; suggestions: string[] }>>({});

  const handleAISuggestRecommendation = async () => {
    setAidSuggestLoading(true);
    setAidSuggestions([]);
    try {
      const response = await aiAssistantService.getSuggestions({
        industry: selectedAudit?.industry || auditForm.industry || 'General',
        category: findingForm.category || 'Safety',
        checklistItems: findingForm.finding ? [findingForm.finding] : [],
      });
      setAidSuggestions(response.data?.suggestions ?? []);
    } catch {
      setAidSuggestions([]);
    } finally {
      setAidSuggestLoading(false);
    }
  };

  const handleFindingAI = async (finding: AuditFinding) => {
    const key = String(finding.id);
    setFindingAI((prev) => ({
      ...prev,
      [key]: { open: true, loading: true, suggestions: [] },
    }));
    try {
      const response = await aiAssistantService.getSuggestions({
        industry: (selectedAudit as any)?.industry || 'General',
        category: finding.category || 'Safety',
        checklistItems: [finding.finding, finding.recommendation || ''].filter(Boolean),
      });
      setFindingAI((prev) => ({
        ...prev,
        [key]: { open: true, loading: false, suggestions: response.data?.suggestions ?? [] },
      }));
    } catch {
      setFindingAI((prev) => ({
        ...prev,
        [key]: { open: true, loading: false, suggestions: [] },
      }));
    }
  };

  const toggleFindingAI = (finding: AuditFinding) => {
    const key = String(finding.id);
    if (findingAI[key]?.open) {
      setFindingAI((prev) => ({ ...prev, [key]: { ...prev[key], open: false } }));
    } else {
      void handleFindingAI(finding);
    }
  };
  // ─────────────────────────────────────────────────────

  const handleCreateAudit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateAuditMessage(null);

    try {
      const payload: CreateAuditPayload = {
        ...auditForm,
        department: auditForm.department || undefined,
        industry: auditForm.industry || undefined,
        dueDate: auditForm.dueDate || undefined,
        auditee: auditForm.auditee || undefined,
        auditTeam: auditForm.auditTeam?.filter(Boolean).length ? auditForm.auditTeam : undefined,
      };

      const created = await createAudit.mutate(payload);
      setCreateAuditMessage('Audit created successfully.');
      setSelectedAuditId(created.id);
      setShowCreateAuditForm(false);
      await refetchAudits();
    } catch (error) {
      setCreateAuditMessage(error instanceof Error ? error.message : 'Failed to create audit.');
    }
  };

  const handleCreateFinding = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAuditId) {
      setCreateFindingMessage('Select an audit first.');
      return;
    }

    setCreateFindingMessage(null);

    try {
      await createAuditFinding.mutate({
        auditId: selectedAuditId,
        data: {
          ...findingForm,
          recommendation: findingForm.recommendation || undefined,
          responsiblePerson: findingForm.responsiblePerson || undefined,
          dueDate: findingForm.dueDate || undefined,
          regulatoryRef: findingForm.regulatoryRef || undefined,
        },
      });
      setCreateFindingMessage('Finding added successfully.');
      setShowFindingForm(false);
      setFindingForm({
        category: '',
        finding: '',
        severity: 'Major',
        recommendation: '',
        responsiblePerson: '',
        dueDate: '',
        regulatoryRef: '',
      });
      await Promise.all([refetchFindings(), refetchAudits()]);
    } catch (error) {
      setCreateFindingMessage(error instanceof Error ? error.message : 'Failed to add finding.');
    }
  };

  const auditCards = [
    {
      label: 'Total Audits',
      value: auditStats?.audits.total ?? 0,
      icon: ClipboardCheck,
      tone: 'text-brand-900',
    },
    {
      label: 'In Progress',
      value: auditStats?.audits.inProgress ?? 0,
      icon: Clock,
      tone: 'text-blue-600',
    },
    {
      label: 'Open Findings',
      value: auditStats?.findings.open ?? 0,
      icon: ShieldAlert,
      tone: 'text-red-600',
    },
    {
      label: 'Average Score',
      value: auditStats?.audits.avgScore ?? 0,
      suffix: '%',
      icon: Target,
      tone: 'text-emerald-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100 pb-32">


      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            <ClipboardCheck className="w-4 h-4" />
            Audit Operations
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-900 tracking-tight">Safety Audit</h1>
          <p className="text-surface-500 max-w-3xl">
            Backend-backed audit planning, open findings tracking, and detail drill-down for operational compliance workflows.
          </p>
        </motion.div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: ClipboardList },
            { id: 'audits', label: 'Audits', icon: FileText },
            { id: 'findings', label: 'Open Findings', icon: ShieldAlert },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AuditTab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand-900 text-white shadow-lg'
                  : 'bg-white text-brand-700 border border-surface-200 hover:bg-surface-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {createAuditMessage && (
          <div className={`rounded-2xl px-4 py-3 text-sm border ${createAudit.error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {createAuditMessage}
          </div>
        )}
        {createFindingMessage && (
          <div className={`rounded-2xl px-4 py-3 text-sm border ${createAuditFinding.error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {createFindingMessage}
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {auditCards.map((card) => (
                  <div key={card.label} className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
                    <div className="flex items-center gap-2 mb-2">
                      <card.icon className="w-5 h-5 text-brand-500" />
                      <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">{card.label}</span>
                    </div>
                    <div className={`text-2xl font-bold ${card.tone}`}>
                      {statsLoading ? '...' : `${card.value}${card.suffix || ''}`}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-brand-900">Recent Audits</h3>
                      <p className="text-sm text-surface-500">Live data from audit scheduling backend.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('audits')}
                      className="px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-bold"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {audits.slice(0, 5).map((audit) => (
                      <button
                        key={audit.id}
                        onClick={() => {
                          setSelectedAuditId(audit.id);
                          setActiveTab('audits');
                        }}
                        className="w-full text-left p-4 rounded-2xl border border-surface-100 bg-surface-50 hover:bg-surface-100 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-brand-600">{audit.auditNumber || `Audit #${audit.id}`}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(audit.status)}`}>
                                {audit.status}
                              </span>
                            </div>
                            <h4 className="font-semibold text-brand-900">{audit.title}</h4>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-surface-500">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(audit.scheduledDate)}</span>
                              <span className="flex items-center gap-1"><User className="w-3 h-3" />{audit.leadAuditor}</span>
                              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{audit.location}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-brand-900">{formatScore(audit.overallScore)}</div>
                            <div className="text-[10px] text-surface-400 uppercase">{audit.auditType}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {!auditsLoading && audits.length === 0 && (
                      <div className="text-sm text-surface-500">No audits available yet.</div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-brand-900">Schedule Audit</h3>
                      <p className="text-sm text-surface-500">Create a live audit record in backend.</p>
                    </div>
                    <button
                      onClick={() => setShowCreateAuditForm((current) => !current)}
                      className="p-2 rounded-xl bg-surface-100 text-surface-600"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showCreateAuditForm ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {showCreateAuditForm && (
                    <form onSubmit={handleCreateAudit} className="space-y-3">
                      <input
                        value={auditForm.auditNumber}
                        onChange={(event) => setAuditForm((current) => ({ ...current, auditNumber: event.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                        placeholder="Audit number"
                        required
                      />
                      <input
                        value={auditForm.title}
                        onChange={(event) => setAuditForm((current) => ({ ...current, title: event.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                        placeholder="Audit title"
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={auditForm.auditType}
                          onChange={(event) => setAuditForm((current) => ({ ...current, auditType: event.target.value as AuditType }))}
                          className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                        >
                          {AUDIT_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={auditForm.scheduledDate}
                          onChange={(event) => setAuditForm((current) => ({ ...current, scheduledDate: event.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                          required
                        />
                      </div>
                      <input
                        value={auditForm.location}
                        onChange={(event) => setAuditForm((current) => ({ ...current, location: event.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                        placeholder="Location"
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={auditForm.department || ''}
                          onChange={(event) => setAuditForm((current) => ({ ...current, department: event.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                          placeholder="Department"
                        />
                        <input
                          value={auditForm.industry || ''}
                          onChange={(event) => setAuditForm((current) => ({ ...current, industry: event.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                          placeholder="Industry"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={auditForm.leadAuditor}
                          onChange={(event) => setAuditForm((current) => ({ ...current, leadAuditor: event.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                          placeholder="Lead auditor"
                          required
                        />
                        <input
                          value={auditForm.auditee || ''}
                          onChange={(event) => setAuditForm((current) => ({ ...current, auditee: event.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                          placeholder="Auditee"
                        />
                      </div>
                      <input
                        type="date"
                        value={auditForm.dueDate || ''}
                        onChange={(event) => setAuditForm((current) => ({ ...current, dueDate: event.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                        placeholder="Due date"
                      />
                      <button
                        type="submit"
                        disabled={createAudit.loading}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-900 text-white text-sm font-bold disabled:opacity-60"
                      >
                        {createAudit.loading ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {createAudit.loading ? 'Creating...' : 'Create Audit'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'audits' && (
            <motion.div key="audits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-brand-900">Audit Register</h3>
                    <p className="text-sm text-surface-500">Live audits from backend list endpoint.</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-500">
                    <Search className="w-4 h-4" />
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as (typeof AUDIT_STATUSES)[number])}
                      className="bg-transparent outline-none"
                    >
                      {AUDIT_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-3 max-h-[720px] overflow-auto pr-1">
                  {audits.map((audit) => (
                    <button
                      key={audit.id}
                      onClick={() => setSelectedAuditId(audit.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-colors ${selectedAuditId === audit.id ? 'border-brand-300 bg-brand-50' : 'border-surface-100 bg-surface-50 hover:bg-surface-100'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-brand-600">{audit.auditNumber || `Audit #${audit.id}`}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(audit.status)}`}>
                              {audit.status}
                            </span>
                          </div>
                          <h4 className="font-semibold text-brand-900">{audit.title}</h4>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-surface-500">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(audit.scheduledDate)}</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{audit.leadAuditor}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-brand-900">{formatScore(audit.overallScore)}</div>
                          <div className="text-[10px] text-surface-400 uppercase">{audit.auditType}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {!auditsLoading && audits.length === 0 && <div className="text-sm text-surface-500">No audits found.</div>}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-brand-900">Audit Detail</h3>
                    <p className="text-sm text-surface-500">Selected audit detail and finding creation.</p>
                  </div>
                  <button
                    onClick={() => setShowFindingForm((current) => !current)}
                    disabled={!selectedAuditId}
                    className="px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-bold disabled:opacity-50"
                  >
                    Add Finding
                  </button>
                </div>

                {showFindingForm && (
                  <form onSubmit={handleCreateFinding} className="space-y-3 p-4 rounded-2xl border border-surface-100 bg-surface-50">
                    <input
                      value={findingForm.category}
                      onChange={(event) => setFindingForm((current) => ({ ...current, category: event.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400"
                      placeholder="Category"
                      required
                    />
                    <textarea
                      value={findingForm.finding}
                      onChange={(event) => setFindingForm((current) => ({ ...current, finding: event.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400 resize-none"
                      placeholder="Finding detail"
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={findingForm.severity}
                        onChange={(event) => setFindingForm((current) => ({ ...current, severity: event.target.value as FindingSeverity }))}
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400"
                      >
                        {FINDING_SEVERITIES.map((severity) => (
                          <option key={severity} value={severity}>{severity}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={findingForm.dueDate || ''}
                        onChange={(event) => setFindingForm((current) => ({ ...current, dueDate: event.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400"
                      />
                    </div>
                    <input
                      value={findingForm.responsiblePerson || ''}
                      onChange={(event) => setFindingForm((current) => ({ ...current, responsiblePerson: event.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400"
                      placeholder="Responsible person"
                    />
                    <input
                      value={findingForm.regulatoryRef || ''}
                      onChange={(event) => setFindingForm((current) => ({ ...current, regulatoryRef: event.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400"
                      placeholder="Regulatory reference"
                    />
                    <textarea
                      value={findingForm.recommendation || ''}
                      onChange={(event) => setFindingForm((current) => ({ ...current, recommendation: event.target.value }))}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400 resize-none"
                      placeholder="Recommendation"
                    />
                    {/* AI Suggest Button */}
                    <button
                      type="button"
                      onClick={handleAISuggestRecommendation}
                      disabled={aidSuggestLoading}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      {aidSuggestLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Brain className="w-3.5 h-3.5" />
                      )}
                      AI Suggest
                    </button>
                    {aidSuggestions.length > 0 && (
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                          <Sparkles className="w-3 h-3" />
                          AI Suggestions — click to apply
                        </div>
                        <div className="space-y-1.5">
                          {aidSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setFindingForm((current) => ({ ...current, recommendation: suggestion }));
                                setAidSuggestions([]);
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg bg-white border border-blue-100 text-xs text-slate-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={createAuditFinding.loading || !selectedAuditId}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-900 text-white text-sm font-bold disabled:opacity-60"
                    >
                      {createAuditFinding.loading ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {createAuditFinding.loading ? 'Saving...' : 'Save Finding'}
                    </button>
                  </form>
                )}

                {auditDetailLoading && <div className="text-sm text-surface-500">Loading audit details...</div>}
                {!selectedAuditId && <div className="text-sm text-surface-500">Select an audit from the left to inspect live details.</div>}
                {selectedAudit && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-brand-600">{selectedAudit.auditNumber || `Audit #${selectedAudit.id}`}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(selectedAudit.status)}`}>
                          {selectedAudit.status}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold text-brand-900">{selectedAudit.title}</h4>
                      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                        <div className="p-3 rounded-xl bg-white border border-surface-100">
                          <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Lead Auditor</div>
                          <div className="font-semibold text-brand-900 mt-1">{selectedAudit.leadAuditor}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-surface-100">
                          <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Location</div>
                          <div className="font-semibold text-brand-900 mt-1">{selectedAudit.location}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-surface-100">
                          <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Scheduled</div>
                          <div className="font-semibold text-brand-900 mt-1">{formatDate(selectedAudit.scheduledDate)}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-surface-100">
                          <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Score</div>
                          <div className="font-semibold text-brand-900 mt-1">{formatScore(selectedAudit.overallScore)}</div>
                        </div>
                      </div>
                      {selectedAudit.summary && (
                        <div className="mt-4 text-sm text-surface-600">{selectedAudit.summary}</div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-brand-900 mb-3">Audit Findings</h4>
                      <div className="space-y-3">
                        {(selectedAudit.findings || []).map((finding) => (
                          <div key={finding.id} className="p-4 rounded-2xl border border-surface-100 bg-white">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(finding.severity)}`}>
                                    {finding.severity}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(finding.status)}`}>
                                    {finding.status}
                                  </span>
                                </div>
                                <div className="font-semibold text-brand-900">{finding.category}</div>
                                <p className="text-sm text-surface-600 mt-1">{finding.finding}</p>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-surface-500">
                                  {finding.responsiblePerson && <span className="flex items-center gap-1"><User className="w-3 h-3" />{finding.responsiblePerson}</span>}
                                  {finding.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(finding.dueDate)}</span>}
                                </div>
                                {/* AI Root Cause & Action Suggestion */}
                                <button
                                  type="button"
                                  onClick={() => toggleFindingAI(finding)}
                                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  AI Root Cause &amp; Action Suggestion
                                  <ChevronRight className={`w-3 h-3 transition-transform ${findingAI[String(finding.id)]?.open ? 'rotate-90' : ''}`} />
                                </button>
                                {findingAI[String(finding.id)]?.open && (
                                  <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-100 space-y-2">
                                    {findingAI[String(finding.id)]?.loading ? (
                                      <div className="flex items-center gap-2 text-xs text-blue-500">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Analysing with AI...
                                      </div>
                                    ) : (
                                      <ul className="space-y-1.5">
                                        {(findingAI[String(finding.id)]?.suggestions ?? []).map((s, i) => (
                                          <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                            <span className="mt-0.5 w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                                            {s}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )}
                              </div>
                              {finding.regulatoryRef && <span className="text-[10px] text-surface-400 uppercase">{finding.regulatoryRef}</span>}
                            </div>
                          </div>
                        ))}
                        {selectedAudit.findings?.length === 0 && <div className="text-sm text-surface-500">No findings recorded for this audit yet.</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'findings' && (
            <motion.div key="findings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-brand-900">Open Findings</h3>
                  <p className="text-sm text-surface-500">Cross-audit findings directly from backend.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-500">
                  <AlertTriangle className="w-4 h-4" />
                  <select
                    value={severityFilter}
                    onChange={(event) => setSeverityFilter(event.target.value as FindingSeverity | 'All')}
                    className="bg-transparent outline-none"
                  >
                    <option value="All">All Severities</option>
                    {FINDING_SEVERITIES.map((severity) => (
                      <option key={severity} value={severity}>{severity}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {openFindings.map((finding: AuditFinding) => (
                  <div key={`${finding.auditId || 'audit'}-${finding.id}`} className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(finding.severity)}`}>
                            {finding.severity}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(finding.status)}`}>
                            {finding.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-brand-900">{finding.category}</h4>
                        <p className="text-xs text-surface-400 mt-1">{finding.auditNumber || `Audit #${finding.auditId}`}</p>
                      </div>
                      {finding.auditId && (
                        <button
                          onClick={() => {
                            setSelectedAuditId(finding.auditId || null);
                            setActiveTab('audits');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-surface-100 text-surface-600 text-xs font-bold"
                        >
                          Open Audit
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-surface-600">{finding.finding}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-surface-500">
                      {finding.responsiblePerson && <span className="flex items-center gap-1"><User className="w-3 h-3" />{finding.responsiblePerson}</span>}
                      {finding.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(finding.dueDate)}</span>}
                      {finding.regulatoryRef && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{finding.regulatoryRef}</span>}
                    </div>
                    {/* AI Root Cause & Action Suggestion */}
                    <button
                      type="button"
                      onClick={() => toggleFindingAI(finding)}
                      className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Root Cause &amp; Action Suggestion
                      <ChevronRight className={`w-3 h-3 transition-transform ${findingAI[String(finding.id)]?.open ? 'rotate-90' : ''}`} />
                    </button>
                    {findingAI[String(finding.id)]?.open && (
                      <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-100 space-y-2">
                        {findingAI[String(finding.id)]?.loading ? (
                          <div className="flex items-center gap-2 text-xs text-blue-500">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Analysing with AI...
                          </div>
                        ) : (
                          <ul className="space-y-1.5">
                            {(findingAI[String(finding.id)]?.suggestions ?? []).map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                <span className="mt-0.5 w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {!findingsLoading && openFindings.length === 0 && (
                  <div className="text-sm text-surface-500">No open findings found for the selected severity filter.</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-xs text-surface-400">
          Current live scope: audit stats, audit list, audit details, open findings, audit creation, and finding creation are backend-driven.
        </div>
      </main>
    </div>
  );
};

export default SafetyAudit;
