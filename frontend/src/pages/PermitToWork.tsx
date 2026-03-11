import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  FileCheck,
  MapPin,
  Plus,
  ShieldAlert,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import {
  useApprovePermitToWork,
  useCreatePermitToWork,
  useDeletePermitToWork,
  usePermitToWorkPermit,
  usePermitToWorkPermits,
  usePermitToWorkStats,
  useRejectPermitToWork,
  useUpdatePermitToWork,
} from '../api/hooks/useAPIHooks';
import type { CreatePermitToWorkPayload, PermitToWorkRecord } from '../api/services/apiService';

type PermitStatusFilter = 'all' | PermitToWorkRecord['status'];
type PermitRiskFilter = 'all' | PermitToWorkRecord['riskLevel'];
type PermitTypeFilter = 'all' | PermitToWorkRecord['permitType'];

const PERMIT_TYPES: Array<{ value: PermitToWorkRecord['permitType']; label: string }> = [
  { value: 'hot-work', label: 'Hot Work' },
  { value: 'confined-space', label: 'Confined Space' },
  { value: 'working-at-height', label: 'Working at Height' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'excavation', label: 'Excavation' },
  { value: 'general', label: 'General' },
];

const RISK_LEVELS: PermitToWorkRecord['riskLevel'][] = ['low', 'medium', 'high', 'critical'];
const STATUS_OPTIONS: PermitStatusFilter[] = ['all', 'draft', 'pending-approval', 'approved', 'active', 'closed', 'cancelled'];

const initialForm: CreatePermitToWorkPayload = {
  permitType: 'hot-work',
  title: '',
  location: '',
  workArea: '',
  description: '',
  riskLevel: 'medium',
  requestedBy: '',
  startDate: '',
  endDate: '',
  ppeRequired: [],
  precautions: [],
  emergencyProcedure: '',
  iotSensorIds: [],
  department: '',
  notes: '',
};

const getPermitTypeLabel = (value: string) =>
  PERMIT_TYPES.find((type) => type.value === value)?.label ?? value;

const formatStatus = (value: string) =>
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
    case 'approved':
    case 'closed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'pending-approval':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-surface-50 text-surface-600 border-surface-200';
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'critical':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'high':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'medium':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
};

const formatDate = (value?: string | number | null) => {
  if (!value) return 'Not set';

  const parsed = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleString();
};

const getTimeRemaining = (endDate?: string | null) => {
  if (!endDate) return 'Open-ended';

  const deadline = new Date(endDate).getTime();
  if (Number.isNaN(deadline)) return endDate;

  const diff = deadline - Date.now();
  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d remaining`;
  return `${hours}h remaining`;
};

export const PermitToWork = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPermitId, setSelectedPermitId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<PermitStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<PermitTypeFilter>('all');
  const [riskFilter, setRiskFilter] = useState<PermitRiskFilter>('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [formState, setFormState] = useState<CreatePermitToWorkPayload>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const permitParams = useMemo(
    () => ({
      status: statusFilter === 'all' ? undefined : statusFilter,
      permitType: typeFilter === 'all' ? undefined : typeFilter,
      riskLevel: riskFilter === 'all' ? undefined : riskFilter,
      department: departmentFilter.trim() || undefined,
    }),
    [departmentFilter, riskFilter, statusFilter, typeFilter]
  );

  const { data: stats, loading: statsLoading } = usePermitToWorkStats();
  const { data: permitsData, loading, refetch } = usePermitToWorkPermits(permitParams);
  const permits = permitsData ?? [];
  const { data: selectedPermit, loading: detailLoading, refetch: refetchSelected } = usePermitToWorkPermit(selectedPermitId);

  const { mutate: createPermit, loading: creatingPermit } = useCreatePermitToWork();
  const { mutate: updatePermit, loading: updatingPermit } = useUpdatePermitToWork();
  const { mutate: approvePermit, loading: approvingPermit } = useApprovePermitToWork();
  const { mutate: rejectPermit, loading: rejectingPermit } = useRejectPermitToWork();
  const { mutate: deletePermit, loading: deletingPermit } = useDeletePermitToWork();

  useEffect(() => {
    if (!permits.length) {
      setSelectedPermitId(null);
      return;
    }

    if (!selectedPermitId || !permits.some((permit) => permit.id === selectedPermitId)) {
      setSelectedPermitId(permits[0].id);
    }
  }, [permits, selectedPermitId]);

  const departments = useMemo(
    () => Array.from(new Set(permits.map((permit) => permit.department).filter(Boolean) as string[])).sort(),
    [permits]
  );

  const refreshData = async (nextSelectedId?: number | null) => {
    await refetch();
    if (nextSelectedId) {
      setSelectedPermitId(nextSelectedId);
    }
    if (nextSelectedId || selectedPermitId) {
      await refetchSelected();
    }
  };

  const parseCommaSeparated = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const handleCreatePermit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formState.title.trim() || !formState.location.trim()) {
      setFormError('Title and location are required.');
      return;
    }

    setFormError(null);
    const created = await createPermit({
      ...formState,
      title: formState.title.trim(),
      location: formState.location.trim(),
      workArea: formState.workArea?.trim() || undefined,
      description: formState.description?.trim() || undefined,
      requestedBy: formState.requestedBy?.trim() || undefined,
      department: formState.department?.trim() || undefined,
      emergencyProcedure: formState.emergencyProcedure?.trim() || undefined,
      notes: formState.notes?.trim() || undefined,
    });

    if (!created) return;

    setFormState(initialForm);
    setShowCreateForm(false);
    await refreshData(created.id);
  };

  const handleStatusUpdate = async (permit: PermitToWorkRecord, status: PermitToWorkRecord['status']) => {
    const updated = await updatePermit({
      id: permit.id,
      data: {
        status,
        actualStart: status === 'active' ? new Date().toISOString() : undefined,
        actualEnd: status === 'closed' ? new Date().toISOString() : undefined,
      },
    });

    if (!updated) return;
    await refreshData(updated.id);
  };

  const handleApprove = async (permitId: number) => {
    const updated = await approvePermit({
      id: permitId,
      data: {
        approverName: 'Safety Manager',
        approverRole: 'Approver',
        comments: 'Approved from live permit workflow',
      },
    });

    if (!updated) return;
    await refreshData(updated.id);
  };

  const handleReject = async (permitId: number) => {
    const updated = await rejectPermit({
      id: permitId,
      data: {
        approverName: 'Safety Manager',
        approverRole: 'Approver',
        comments: 'Rejected from live permit workflow',
      },
    });

    if (!updated) return;
    await refreshData(updated.id);
  };

  const handleDelete = async (permitId: number) => {
    const deleted = await deletePermit(permitId);
    if (!deleted) return;

    const nextPermit = permits.find((permit) => permit.id !== permitId);
    setSelectedPermitId(nextPermit?.id ?? null);
    await refetch();
  };

  const actionBusy = creatingPermit || updatingPermit || approvingPermit || rejectingPermit || deletingPermit;

  return (
    <div className="min-h-screen bg-surface-50 pb-20">
      <header className="sticky top-[72px] z-40 border-b border-surface-200/70 bg-white/85 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="rounded-full p-2 transition-colors hover:bg-surface-100">
              <ArrowLeft className="h-6 w-6 text-surface-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-surface-900">Permit to Work</h1>
              <p className="text-sm text-surface-500">Live backend workflow for permit creation, approval, activation, and closure.</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-all hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            {showCreateForm ? 'Hide Form' : 'New Permit'}
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Total Permits',
              value: stats?.total ?? 0,
              icon: ClipboardCheck,
              tone: 'bg-blue-50 text-blue-700 border-blue-200',
            },
            {
              title: 'Active Work',
              value: stats?.active ?? 0,
              icon: FileCheck,
              tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            },
            {
              title: 'Pending Approval',
              value: stats?.pendingApproval ?? 0,
              icon: ShieldAlert,
              tone: 'bg-amber-50 text-amber-700 border-amber-200',
            },
            {
              title: 'Expiring Soon',
              value: stats?.expiringSoon ?? 0,
              icon: Clock,
              tone: 'bg-rose-50 text-rose-700 border-rose-200',
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-surface-200 bg-white p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-surface-500">{card.title}</p>
                  <p className="mt-3 text-3xl font-bold text-surface-900">{statsLoading ? '...' : card.value}</p>
                </div>
                <div className={`rounded-2xl border p-3 ${card.tone}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        <AnimatePresence>
          {showCreateForm && (
            <motion.section
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-[2rem] border border-surface-200 bg-white p-6 shadow-soft"
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-surface-900">Create Permit</h2>
                  <p className="text-sm text-surface-500">New permits are created as drafts and can then move through approval and activation.</p>
                </div>
              </div>

              <form onSubmit={handleCreatePermit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-2 text-sm font-medium text-surface-700">
                  Permit Type
                  <select
                    value={formState.permitType}
                    onChange={(event) => setFormState((current) => ({ ...current, permitType: event.target.value as PermitToWorkRecord['permitType'] }))}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                  >
                    {PERMIT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-surface-700">
                  Title
                  <input
                    value={formState.title}
                    onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                    placeholder="Hot work on boiler pipe"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-surface-700">
                  Location
                  <input
                    value={formState.location}
                    onChange={(event) => setFormState((current) => ({ ...current, location: event.target.value }))}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                    placeholder="Plant 2"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-surface-700">
                  Work Area
                  <input
                    value={formState.workArea}
                    onChange={(event) => setFormState((current) => ({ ...current, workArea: event.target.value }))}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                    placeholder="Boiler Room A"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-surface-700">
                  Requested By
                  <input
                    value={formState.requestedBy}
                    onChange={(event) => setFormState((current) => ({ ...current, requestedBy: event.target.value }))}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                    placeholder="Site Supervisor"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-surface-700">
                  Department
                  <input
                    value={formState.department}
                    onChange={(event) => setFormState((current) => ({ ...current, department: event.target.value }))}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                    placeholder="Maintenance"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-surface-700">
                  Risk Level
                  <select
                    value={formState.riskLevel}
                    onChange={(event) => setFormState((current) => ({ ...current, riskLevel: event.target.value as PermitToWorkRecord['riskLevel'] }))}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                  >
                    {RISK_LEVELS.map((risk) => (
                      <option key={risk} value={risk}>{formatStatus(risk)}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-surface-700">
                  Start Date
                  <input
                    type="datetime-local"
                    value={formState.startDate}
                    onChange={(event) => setFormState((current) => ({ ...current, startDate: event.target.value }))}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-surface-700">
                  End Date
                  <input
                    type="datetime-local"
                    value={formState.endDate}
                    onChange={(event) => setFormState((current) => ({ ...current, endDate: event.target.value }))}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-surface-700 md:col-span-2 xl:col-span-3">
                  Description
                  <textarea
                    value={formState.description}
                    onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                    rows={3}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                    placeholder="Describe the task, hazards, and site conditions."
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-surface-700">
                  PPE Required
                  <input
                    value={formState.ppeRequired?.join(', ') ?? ''}
                    onChange={(event) => setFormState((current) => ({ ...current, ppeRequired: parseCommaSeparated(event.target.value) }))}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                    placeholder="Helmet, gloves, face shield"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-surface-700">
                  Precautions
                  <input
                    value={formState.precautions?.join(', ') ?? ''}
                    onChange={(event) => setFormState((current) => ({ ...current, precautions: parseCommaSeparated(event.target.value) }))}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                    placeholder="Gas test, isolate power, barricades"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-surface-700">
                  IoT Sensor IDs
                  <input
                    value={formState.iotSensorIds?.join(', ') ?? ''}
                    onChange={(event) => setFormState((current) => ({ ...current, iotSensorIds: parseCommaSeparated(event.target.value) }))}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                    placeholder="SEN-101, SEN-204"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-surface-700 md:col-span-2 xl:col-span-3">
                  Emergency Procedure
                  <textarea
                    value={formState.emergencyProcedure}
                    onChange={(event) => setFormState((current) => ({ ...current, emergencyProcedure: event.target.value }))}
                    rows={2}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                    placeholder="Shutdown path, rescue steps, emergency contacts."
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-surface-700 md:col-span-2 xl:col-span-3">
                  Notes
                  <textarea
                    value={formState.notes}
                    onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
                    rows={2}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                    placeholder="Shift notes, contractor details, extra restrictions."
                  />
                </label>

                <div className="flex items-center justify-between gap-4 pt-2 md:col-span-2 xl:col-span-3">
                  <div className="text-sm text-rose-600">{formError}</div>
                  <button
                    type="submit"
                    disabled={creatingPermit}
                    className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-button transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {creatingPermit ? 'Creating...' : 'Create Permit'}
                  </button>
                </div>
              </form>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="rounded-[2rem] border border-surface-200 bg-white p-5 shadow-soft">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm font-medium text-surface-700">
              Status
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as PermitStatusFilter)}
                  className="w-full appearance-none rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status === 'all' ? 'All Statuses' : formatStatus(status)}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-surface-400" />
              </div>
            </label>

            <label className="space-y-2 text-sm font-medium text-surface-700">
              Permit Type
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as PermitTypeFilter)}
                  className="w-full appearance-none rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                >
                  <option value="all">All Permit Types</option>
                  {PERMIT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-surface-400" />
              </div>
            </label>

            <label className="space-y-2 text-sm font-medium text-surface-700">
              Risk Level
              <div className="relative">
                <select
                  value={riskFilter}
                  onChange={(event) => setRiskFilter(event.target.value as PermitRiskFilter)}
                  className="w-full appearance-none rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                >
                  <option value="all">All Risk Levels</option>
                  {RISK_LEVELS.map((risk) => (
                    <option key={risk} value={risk}>{formatStatus(risk)}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-surface-400" />
              </div>
            </label>

            <label className="space-y-2 text-sm font-medium text-surface-700">
              Department
              <input
                list="ptw-departments"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="w-full rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                placeholder="Filter by department"
              />
              <datalist id="ptw-departments">
                {departments.map((department) => (
                  <option key={department} value={department} />
                ))}
              </datalist>
            </label>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-surface-900">Live Permit Queue</h2>
              <p className="text-sm text-surface-500">{loading ? 'Loading permits...' : `${permits.length} permits matched`}</p>
            </div>

            {permits.map((permit) => (
              <motion.button
                key={permit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedPermitId(permit.id)}
                className={`w-full rounded-[2rem] border p-5 text-left shadow-soft transition-all ${
                  selectedPermitId === permit.id
                    ? 'border-brand-300 bg-brand-50/40'
                    : 'border-surface-200 bg-white hover:border-brand-200 hover:bg-surface-50'
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-surface-900">{permit.title}</h3>
                      <span className="text-xs font-semibold text-surface-400">{permit.permitNumber}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-surface-500">
                      <span className="inline-flex items-center gap-1"><ClipboardCheck className="h-4 w-4" />{getPermitTypeLabel(permit.permitType)}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{permit.location}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{getTimeRemaining(permit.endDate)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(permit.status)}`}>
                      {formatStatus(permit.status)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRiskColor(permit.riskLevel)}`}>
                      {formatStatus(permit.riskLevel)} Risk
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}

            {!loading && permits.length === 0 && (
              <div className="rounded-[2rem] border border-dashed border-surface-300 bg-white p-10 text-center shadow-soft">
                <h3 className="text-lg font-semibold text-surface-900">No permits found</h3>
                <p className="mt-2 text-sm text-surface-500">Adjust the filters or create the first live permit.</p>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-surface-200 bg-white p-6 shadow-soft">
            {!selectedPermitId || !selectedPermit ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <FileCheck className="h-12 w-12 text-surface-300" />
                <h3 className="mt-4 text-lg font-semibold text-surface-900">Select a permit</h3>
                <p className="mt-2 max-w-sm text-sm text-surface-500">Choose a permit from the queue to review details, approvals, PPE, and status transitions.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 border-b border-surface-200 pb-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-400">{selectedPermit.permitNumber}</p>
                      <h2 className="mt-2 text-2xl font-bold text-surface-900">{selectedPermit.title}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(selectedPermit.status)}`}>
                        {formatStatus(selectedPermit.status)}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRiskColor(selectedPermit.riskLevel)}`}>
                        {formatStatus(selectedPermit.riskLevel)} Risk
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm text-surface-600 md:grid-cols-2">
                    <div className="inline-flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-surface-400" />{getPermitTypeLabel(selectedPermit.permitType)}</div>
                    <div className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-surface-400" />{selectedPermit.location}</div>
                    <div className="inline-flex items-center gap-2"><User className="h-4 w-4 text-surface-400" />{selectedPermit.requestedBy || 'Unassigned requester'}</div>
                    <div className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-surface-400" />{selectedPermit.department || 'No department'}</div>
                    <div className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-surface-400" />Start: {formatDate(selectedPermit.startDate)}</div>
                    <div className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-surface-400" />End: {formatDate(selectedPermit.endDate)}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {selectedPermit.status === 'draft' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedPermit, 'pending-approval')}
                      disabled={actionBusy}
                      className="rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Submit For Approval
                    </button>
                  )}

                  {selectedPermit.status === 'pending-approval' && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedPermit.id)}
                        disabled={actionBusy}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" />Approve
                      </button>
                      <button
                        onClick={() => handleReject(selectedPermit.id)}
                        disabled={actionBusy}
                        className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />Reject
                      </button>
                    </>
                  )}

                  {selectedPermit.status === 'approved' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedPermit, 'active')}
                      disabled={actionBusy}
                      className="rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Activate Permit
                    </button>
                  )}

                  {selectedPermit.status === 'active' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedPermit, 'closed')}
                      disabled={actionBusy}
                      className="rounded-2xl bg-surface-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-surface-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Close Permit
                    </button>
                  )}

                  {!['closed', 'cancelled'].includes(selectedPermit.status) && (
                    <button
                      onClick={() => handleStatusUpdate(selectedPermit, 'cancelled')}
                      disabled={actionBusy}
                      className="rounded-2xl border border-surface-200 px-4 py-2.5 text-sm font-semibold text-surface-700 transition hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel Permit
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(selectedPermit.id)}
                    disabled={actionBusy}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />Delete
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-surface-50 p-4">
                    <h3 className="text-sm font-semibold text-surface-900">Description</h3>
                    <p className="mt-2 text-sm leading-6 text-surface-600">{selectedPermit.description || 'No description provided.'}</p>
                  </div>

                  <div className="rounded-[1.5rem] bg-surface-50 p-4">
                    <h3 className="text-sm font-semibold text-surface-900">Emergency Procedure</h3>
                    <p className="mt-2 text-sm leading-6 text-surface-600">{selectedPermit.emergencyProcedure || 'No emergency procedure recorded.'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <h3 className="text-sm font-semibold text-surface-900">PPE Required</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedPermit.ppeRequired.length ? selectedPermit.ppeRequired.map((item) => (
                        <span key={item} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{item}</span>
                      )) : <span className="text-sm text-surface-500">No PPE listed</span>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-surface-900">Precautions</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedPermit.precautions.length ? selectedPermit.precautions.map((item) => (
                        <span key={item} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{item}</span>
                      )) : <span className="text-sm text-surface-500">No precautions listed</span>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-surface-900">Linked Sensors</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedPermit.iotSensorIds.length ? selectedPermit.iotSensorIds.map((item) => (
                        <span key={item} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item}</span>
                      )) : <span className="text-sm text-surface-500">No sensors linked</span>}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-surface-200 p-4">
                  <h3 className="text-sm font-semibold text-surface-900">Approval Trail</h3>
                  <div className="mt-4 space-y-3">
                    {selectedPermit.approvals?.length ? selectedPermit.approvals.map((approval) => (
                      <div key={approval.id} className="rounded-2xl bg-surface-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-surface-900">{approval.approverName}</p>
                            <p className="text-xs text-surface-500">{approval.approverRole || 'Reviewer'} • {formatDate(approval.approvedAt || approval.createdAt)}</p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${approval.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {formatStatus(approval.status)}
                          </span>
                        </div>
                        {approval.comments && <p className="mt-3 text-sm text-surface-600">{approval.comments}</p>}
                      </div>
                    )) : <p className="text-sm text-surface-500">No approvals recorded yet.</p>}
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-surface-50 p-4 text-sm text-surface-600">
                  <p><span className="font-semibold text-surface-900">Created:</span> {formatDate(selectedPermit.createdAt)}</p>
                  <p className="mt-2"><span className="font-semibold text-surface-900">Updated:</span> {detailLoading ? 'Refreshing...' : formatDate(selectedPermit.updatedAt)}</p>
                  <p className="mt-2"><span className="font-semibold text-surface-900">Notes:</span> {selectedPermit.notes || 'No notes recorded.'}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PermitToWork;
