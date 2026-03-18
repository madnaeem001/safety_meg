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
import { SMAlert, SMBadge, SMButton, SMCard, SMInput, SMSelect, SMStatCard } from '../components/ui';
import PageContainer from '../layouts/PageContainer';

type AuditTab = 'overview' | 'audits' | 'findings';
type AuditType = CreateAuditPayload['auditType'];
type FindingSeverity = CreateAuditFindingPayload['severity'];

const AUDIT_TYPES: AuditType[] = ['Safety', 'Environmental', 'Quality', 'Compliance', 'Process'];
const FINDING_SEVERITIES: FindingSeverity[] = ['Critical', 'Major', 'Minor', 'Observation'];
const AUDIT_STATUSES = ['All', 'Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Overdue'] as const;

const getStatusBadgeVariant = (status: string): 'success' | 'teal' | 'warning' | 'danger' | 'neutral' => {
  switch (status) {
    case 'Completed':
    case 'Closed':
      return 'success';
    case 'In Progress':
      return 'teal';
    case 'Scheduled':
      return 'warning';
    case 'Overdue':
    case 'Critical':
      return 'danger';
    case 'Major':
      return 'warning';
    case 'Minor':
      return 'warning';
    default:
      return 'neutral';
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
      variant: 'default' as const,
    },
    {
      label: 'In Progress',
      value: auditStats?.audits.inProgress ?? 0,
      icon: Clock,
      variant: 'accent' as const,
    },
    {
      label: 'Open Findings',
      value: auditStats?.findings.open ?? 0,
      icon: ShieldAlert,
      variant: 'danger' as const,
    },
    {
      label: 'Average Score',
      value: auditStats?.audits.avgScore ?? 0,
      suffix: '%',
      icon: Target,
      variant: 'success' as const,
    },
  ];

  return (
    <PageContainer title="Safety Audit" subtitle="Backend-backed audit planning, open findings tracking, and detail drill-down for operational compliance workflows." maxWidth="xl">
      <div className="space-y-8">

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: ClipboardList },
            { id: 'audits', label: 'Audits', icon: FileText },
            { id: 'findings', label: 'Open Findings', icon: ShieldAlert },
          ].map((tab) => (
            <SMButton
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab(tab.id as AuditTab)}
              leftIcon={<tab.icon className="w-4 h-4" />}
            >
              {tab.label}
            </SMButton>
          ))}
        </div>
              {tab.label}
            </button>
          ))}
        </div>

        {createAuditMessage && (
          <SMAlert variant={createAudit.error ? 'danger' : 'success'} onDismiss={() => setCreateAuditMessage(null)}>
            {createAuditMessage}
          </SMAlert>
        )}
        {createFindingMessage && (
          <SMAlert variant={createAuditFinding.error ? 'danger' : 'success'} onDismiss={() => setCreateFindingMessage(null)}>
            {createFindingMessage}
          </SMAlert>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {auditCards.map((card) => (
                  <SMStatCard
                    key={card.label}
                    label={card.label}
                    value={statsLoading ? '...' : `${card.value}${card.suffix || ''}`}
                    icon={<card.icon className="w-5 h-5" />}
                    variant={card.variant}
                    loading={statsLoading}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
                <SMCard className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-text-primary">Recent Audits</h3>
                      <p className="text-sm text-text-muted">Live data from audit scheduling backend.</p>
                    </div>
                    <SMButton variant="primary" size="sm" onClick={() => setActiveTab('audits')}>View All</SMButton>
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
                              <span className="text-xs font-bold text-accent-600">{audit.auditNumber || `Audit #${audit.id}`}</span>
                              <SMBadge variant={getStatusBadgeVariant(audit.status)} size="sm">
                                {audit.status}
                              </SMBadge>
                            </div>
                            <h4 className="font-semibold text-text-primary">{audit.title}</h4>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-muted">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(audit.scheduledDate)}</span>
                              <span className="flex items-center gap-1"><User className="w-3 h-3" />{audit.leadAuditor}</span>
                              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{audit.location}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-text-primary">{formatScore(audit.overallScore)}</div>
                            <div className="text-xs text-text-muted uppercase">{audit.auditType}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {!auditsLoading && audits.length === 0 && (
                      <div className="text-sm text-text-muted">No audits available yet.</div>
                    )}
                  </div>
                </SMCard>

                <SMCard className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-text-primary">Schedule Audit</h3>
                      <p className="text-sm text-text-muted">Create a live audit record in backend.</p>
                    </div>
                    <button
                      onClick={() => setShowCreateAuditForm((current) => !current)}
                      aria-label="Toggle create audit form"
                      className="p-2 rounded-xl bg-surface-100 text-surface-600"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showCreateAuditForm ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {showCreateAuditForm && (
                    <form onSubmit={handleCreateAudit} className="space-y-3">
                      <SMInput
                        value={auditForm.auditNumber}
                        onChange={(event) => setAuditForm((current) => ({ ...current, auditNumber: event.target.value }))}
                        placeholder="Audit number"
                        required
                      />
                      <SMInput
                        value={auditForm.title}
                        onChange={(event) => setAuditForm((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Audit title"
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <SMSelect
                          value={auditForm.auditType}
                          onChange={(event) => setAuditForm((current) => ({ ...current, auditType: event.target.value as AuditType }))}
                          options={AUDIT_TYPES.map((type) => ({ value: type, label: type }))}
                        />
                        <SMInput
                          type="date"
                          value={auditForm.scheduledDate}
                          onChange={(event) => setAuditForm((current) => ({ ...current, scheduledDate: event.target.value }))}
                          required
                        />
                      </div>
                      <SMInput
                        value={auditForm.location}
                        onChange={(event) => setAuditForm((current) => ({ ...current, location: event.target.value }))}
                        placeholder="Location"
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <SMInput
                          value={auditForm.department || ''}
                          onChange={(event) => setAuditForm((current) => ({ ...current, department: event.target.value }))}
                          placeholder="Department"
                        />
                        <SMInput
                          value={auditForm.industry || ''}
                          onChange={(event) => setAuditForm((current) => ({ ...current, industry: event.target.value }))}
                          placeholder="Industry"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <SMInput
                          value={auditForm.leadAuditor}
                          onChange={(event) => setAuditForm((current) => ({ ...current, leadAuditor: event.target.value }))}
                          placeholder="Lead auditor"
                          required
                        />
                        <SMInput
                          value={auditForm.auditee || ''}
                          onChange={(event) => setAuditForm((current) => ({ ...current, auditee: event.target.value }))}
                          placeholder="Auditee"
                        />
                      </div>
                      <SMInput
                        type="date"
                        value={auditForm.dueDate || ''}
                        onChange={(event) => setAuditForm((current) => ({ ...current, dueDate: event.target.value }))}
                        label="Due date"
                      />
                      <SMButton variant="primary" type="submit" disabled={createAudit.loading} className="w-full" leftIcon={createAudit.loading ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} loading={createAudit.loading}>
                        {createAudit.loading ? 'Creating...' : 'Create Audit'}
                      </SMButton>
                    </form>
                  )}
                </SMCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'audits' && (
            <motion.div key="audits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
              <SMCard className="p-6 space-y-4">
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
                      className={`w-full text-left p-4 rounded-2xl border transition-colors ${selectedAuditId === audit.id ? 'border-accent-300 bg-accent-50' : 'border-surface-100 bg-surface-50 hover:bg-surface-100'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-accent-600">{audit.auditNumber || `Audit #${audit.id}`}</span>
                            <SMBadge variant={getStatusBadgeVariant(audit.status)} size="sm">
                              {audit.status}
                            </SMBadge>
                          </div>
                          <h4 className="font-semibold text-text-primary">{audit.title}</h4>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-muted">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(audit.scheduledDate)}</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{audit.leadAuditor}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-text-primary">{formatScore(audit.overallScore)}</div>
                          <div className="text-xs text-text-muted uppercase">{audit.auditType}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {!auditsLoading && audits.length === 0 && <div className="text-sm text-text-muted">No audits found.</div>}
                </div>
              </SMCard>

              <SMCard className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-text-primary">Audit Detail</h3>
                    <p className="text-sm text-text-muted">Selected audit detail and finding creation.</p>
                  </div>
                  <SMButton
                    variant="primary"
                    size="sm"
                    onClick={() => setShowFindingForm((current) => !current)}
                    disabled={!selectedAuditId}
                  >
                    Add Finding
                  </SMButton>
                </div>

                {showFindingForm && (
                  <form onSubmit={handleCreateFinding} className="space-y-3 rounded-2xl border border-surface-100 bg-surface-50 p-4">
                    <SMInput
                      value={findingForm.category}
                      onChange={(event) => setFindingForm((current) => ({ ...current, category: event.target.value }))}
                      placeholder="Category"
                      required
                    />
                    <SMInput
                      as="textarea"
                      value={findingForm.finding}
                      onChange={(event) => setFindingForm((current) => ({ ...current, finding: event.target.value }))}
                      rows={3}
                      placeholder="Finding detail"
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <SMSelect
                        value={findingForm.severity}
                        onChange={(event) => setFindingForm((current) => ({ ...current, severity: event.target.value as FindingSeverity }))}
                        options={FINDING_SEVERITIES.map((severity) => ({ value: severity, label: severity }))}
                      />
                      <SMInput
                        type="date"
                        value={findingForm.dueDate || ''}
                        onChange={(event) => setFindingForm((current) => ({ ...current, dueDate: event.target.value }))}
                      />
                    </div>
                    <SMInput
                      value={findingForm.responsiblePerson || ''}
                      onChange={(event) => setFindingForm((current) => ({ ...current, responsiblePerson: event.target.value }))}
                      placeholder="Responsible person"
                    />
                    <SMInput
                      value={findingForm.regulatoryRef || ''}
                      onChange={(event) => setFindingForm((current) => ({ ...current, regulatoryRef: event.target.value }))}
                      placeholder="Regulatory reference"
                    />
                    <SMInput
                      as="textarea"
                      value={findingForm.recommendation || ''}
                      onChange={(event) => setFindingForm((current) => ({ ...current, recommendation: event.target.value }))}
                      rows={2}
                      placeholder="Recommendation"
                    />
                    <button
                      type="button"
                      onClick={handleAISuggestRecommendation}
                      disabled={aidSuggestLoading}
                      className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50"
                    >
                      {aidSuggestLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Brain className="h-3.5 w-3.5" />
                      )}
                      AI Suggest
                    </button>
                    {aidSuggestions.length > 0 && (
                      <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                          <Sparkles className="h-3 w-3" />
                          AI Suggestions - click to apply
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
                              className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <SMButton
                      variant="primary"
                      type="submit"
                      disabled={createAuditFinding.loading || !selectedAuditId}
                      className="w-full"
                      loading={createAuditFinding.loading}
                      leftIcon={createAuditFinding.loading ? <Clock className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    >
                      {createAuditFinding.loading ? 'Saving...' : 'Save Finding'}
                    </SMButton>
                  </form>
                )}

                {auditDetailLoading && <div className="text-sm text-text-muted">Loading audit details...</div>}
                {!selectedAuditId && <div className="text-sm text-text-muted">Select an audit from the left to inspect live details.</div>}
                {selectedAudit && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-surface-100 bg-surface-50 p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-accent-600">{selectedAudit.auditNumber || `Audit #${selectedAudit.id}`}</span>
                        <SMBadge variant={getStatusBadgeVariant(selectedAudit.status)} size="sm">
                          {selectedAudit.status}
                        </SMBadge>
                      </div>
                      <h4 className="text-xl font-bold text-text-primary">{selectedAudit.title}</h4>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl border border-surface-100 bg-white p-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Lead Auditor</div>
                          <div className="mt-1 font-semibold text-text-primary">{selectedAudit.leadAuditor}</div>
                        </div>
                        <div className="rounded-xl border border-surface-100 bg-white p-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Location</div>
                          <div className="mt-1 font-semibold text-text-primary">{selectedAudit.location}</div>
                        </div>
                        <div className="rounded-xl border border-surface-100 bg-white p-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Scheduled</div>
                          <div className="mt-1 font-semibold text-text-primary">{formatDate(selectedAudit.scheduledDate)}</div>
                        </div>
                        <div className="rounded-xl border border-surface-100 bg-white p-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Score</div>
                          <div className="mt-1 font-semibold text-text-primary">{formatScore(selectedAudit.overallScore)}</div>
                        </div>
                      </div>
                      {selectedAudit.summary && <div className="mt-4 text-sm text-text-secondary">{selectedAudit.summary}</div>}
                    </div>

                    <div>
                      <h4 className="mb-3 font-bold text-text-primary">Audit Findings</h4>
                      <div className="space-y-3">
                        {(selectedAudit.findings || []).map((finding) => (
                          <div key={finding.id} className="rounded-2xl border border-surface-100 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="mb-1 flex items-center gap-2">
                                  <SMBadge variant={getStatusBadgeVariant(finding.severity)} size="sm">{finding.severity}</SMBadge>
                                  <SMBadge variant={getStatusBadgeVariant(finding.status)} size="sm">{finding.status}</SMBadge>
                                </div>
                                <div className="font-semibold text-text-primary">{finding.category}</div>
                                <p className="mt-1 text-sm text-text-secondary">{finding.finding}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                                  {finding.responsiblePerson && (
                                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{finding.responsiblePerson}</span>
                                  )}
                                  {finding.dueDate && (
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(finding.dueDate)}</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleFindingAI(finding)}
                                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-500 transition-colors hover:text-blue-700"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  AI Root Cause &amp; Action Suggestion
                                  <ChevronRight className={`h-3 w-3 transition-transform ${findingAI[String(finding.id)]?.open ? 'rotate-90' : ''}`} />
                                </button>
                                {findingAI[String(finding.id)]?.open && (
                                  <div className="mt-2 space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                                    {findingAI[String(finding.id)]?.loading ? (
                                      <div className="flex items-center gap-2 text-xs text-blue-500">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Analysing with AI...
                                      </div>
                                    ) : (
                                      <ul className="space-y-1.5">
                                        {(findingAI[String(finding.id)]?.suggestions ?? []).map((suggestion, index) => (
                                          <li key={index} className="flex items-start gap-2 text-xs text-slate-700">
                                            <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 font-bold text-blue-700">{index + 1}</span>
                                            {suggestion}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )}
                              </div>
                              {finding.regulatoryRef && (
                                <span className="text-xs uppercase text-text-muted">{finding.regulatoryRef}</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {selectedAudit.findings?.length === 0 && (
                          <div className="text-sm text-text-muted">No findings recorded for this audit yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </SMCard>
            </motion.div>
          )}

          {activeTab === 'findings' && (
            <motion.div key="findings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-text-primary">Open Findings</h3>
                  <p className="text-sm text-text-muted">Cross-audit findings directly from backend.</p>
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
                  <SMCard key={`${finding.auditId || 'audit'}-${finding.id}`} className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <SMBadge variant={getStatusBadgeVariant(finding.severity)} size="sm">{finding.severity}</SMBadge>
                          <SMBadge variant={getStatusBadgeVariant(finding.status)} size="sm">{finding.status}</SMBadge>
                        </div>
                        <h4 className="font-bold text-text-primary">{finding.category}</h4>
                        <p className="text-xs text-text-muted mt-1">{finding.auditNumber || `Audit #${finding.auditId}`}</p>
                      </div>
                      {finding.auditId && (
                        <SMButton
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedAuditId(finding.auditId || null);
                            setActiveTab('audits');
                          }}
                        >
                          Open Audit
                        </SMButton>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">{finding.finding}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-text-muted">
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
                  </SMCard>
                ))}
                {!findingsLoading && openFindings.length === 0 && (
                  <div className="text-sm text-text-muted">No open findings found for the selected severity filter.</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-xs text-text-muted">
          Current live scope: audit stats, audit list, audit details, open findings, audit creation, and finding creation are backend-driven.
        </div>
      </div>
    </PageContainer>
  );
};

export default SafetyAudit;
