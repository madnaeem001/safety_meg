import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Clock,
  User,
  MapPin,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ClipboardCheck,
  Radio,
  ShieldAlert,
} from 'lucide-react';
import {
  useInspection,
  useInspectionSchedule,
  useInspectionSensors,
  useInspectionStats,
  useCreateInspection,
} from '../api/hooks/useAPIHooks';
import { SMCard, SMButton } from '../components/ui';
import type { CreateInspectionPayload } from '../api/services/apiService';

type InspectionTab = 'schedule' | 'sensors';
type InspectionStatus = 'all' | 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
type InspectionType = 'all' | 'swppp' | 'stormwater' | 'safety-audit' | 'epa' | 'sensor-check' | 'permit';
type InspectionPriority = 'all' | 'low' | 'medium' | 'high' | 'critical';

const INSPECTION_TYPES: Array<{ value: Exclude<InspectionType, 'all'>; label: string }> = [
  { value: 'swppp', label: 'SWPPP' },
  { value: 'stormwater', label: 'Stormwater' },
  { value: 'safety-audit', label: 'Safety Audit' },
  { value: 'epa', label: 'EPA' },
  { value: 'sensor-check', label: 'Sensor Check' },
  { value: 'permit', label: 'Permit' },
];

const RECURRENCES: NonNullable<CreateInspectionPayload['recurrence']>[] = ['once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annual'];
const SENSOR_STATUSES = ['normal', 'warning', 'critical', 'offline', 'maintenance'] as const;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
    case 'normal':
      return 'bg-success/10 text-success border-success/20';
    case 'scheduled':
      return 'bg-accent/10 text-accent border-accent/20';
    case 'in_progress':
    case 'warning':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'critical':
    case 'overdue':
      return 'bg-danger/10 text-danger border-danger/20';
    case 'offline':
    case 'cancelled':
    case 'maintenance':
      return 'bg-surface-sunken text-text-muted border-surface-border';
    default:
      return 'bg-surface-sunken text-text-muted border-surface-border';
  }
};

const formatDate = (value?: string | number | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

export const InspectionScheduling: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InspectionTab>('schedule');
  const [statusFilter, setStatusFilter] = useState<InspectionStatus>('all');
  const [typeFilter, setTypeFilter] = useState<InspectionType>('all');
  const [priorityFilter, setPriorityFilter] = useState<InspectionPriority>('all');
  const [sensorStatusFilter, setSensorStatusFilter] = useState<typeof SENSOR_STATUSES[number] | 'all'>('all');
  const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateInspectionPayload>({
    title: '',
    inspectionType: 'swppp',
    description: '',
    zone: '',
    location: '',
    assignedTo: '',
    assigneeEmail: '',
    recurrence: 'weekly',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
    duration: 60,
    priority: 'medium',
    checklist: [],
    notes: '',
  });
  const [checklistDraft, setChecklistDraft] = useState('');

  const scheduleParams = useMemo(
    () => ({
      status: statusFilter === 'all' ? undefined : statusFilter,
      type: typeFilter === 'all' ? undefined : typeFilter,
      priority: priorityFilter === 'all' ? undefined : priorityFilter,
    }),
    [statusFilter, typeFilter, priorityFilter]
  );

  const sensorParams = useMemo(
    () => ({ status: sensorStatusFilter === 'all' ? undefined : sensorStatusFilter }),
    [sensorStatusFilter]
  );

  const { data: stats, loading: statsLoading } = useInspectionStats();
  const { data: schedule = [], loading: scheduleLoading, refetch: refetchSchedule } = useInspectionSchedule(scheduleParams);
  const { data: selectedInspection, loading: detailLoading } = useInspection(selectedInspectionId);
  const { data: sensors = [], loading: sensorsLoading } = useInspectionSensors(sensorParams);
  const createInspection = useCreateInspection();

  const scheduleItems = Array.isArray(schedule) ? schedule : [];
  const sensorItems = Array.isArray(sensors) ? sensors : [];

  const handleCreateInspection = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateMessage(null);

    try {
      const payload: CreateInspectionPayload = {
        ...formData,
        description: formData.description || undefined,
        zone: formData.zone || undefined,
        location: formData.location || undefined,
        assignedTo: formData.assignedTo || undefined,
        assigneeEmail: formData.assigneeEmail || undefined,
        notes: formData.notes || undefined,
        checklist: formData.checklist?.length ? formData.checklist : undefined,
      };
      const created = await createInspection.mutate(payload);
      setCreateMessage('Inspection scheduled successfully.');
      setSelectedInspectionId(created.id);
      setShowCreateForm(false);
      await refetchSchedule();
    } catch (error) {
      setCreateMessage(error instanceof Error ? error.message : 'Failed to schedule inspection.');
    }
  };

  const addChecklistItem = () => {
    const trimmed = checklistDraft.trim();
    if (!trimmed) return;
    setFormData((current) => ({ ...current, checklist: [...(current.checklist || []), trimmed] }));
    setChecklistDraft('');
  };

  return (
    <div className="min-h-screen bg-surface-base pb-32">


      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-[0.3em]">
            <ClipboardCheck className="w-4 h-4" />
            Inspection Operations
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Inspection Scheduling</h1>
          <p className="text-text-muted max-w-3xl">
            Live inspection schedule and sensor status powered by backend inspection and monitoring routes.
          </p>
        </motion.div>

        {createMessage && (
          <div className={`rounded-2xl px-4 py-3 text-sm border ${createInspection.error ? 'bg-danger/10 text-danger border-danger/20' : 'bg-success/10 text-success border-success/20'}`}>
            {createMessage}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
          <SMCard className="p-5">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Inspections</div>
            <div className="text-2xl font-bold text-text-primary">{statsLoading ? '...' : stats?.inspections.total ?? 0}</div>
          </SMCard>
          <SMCard className="p-5">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Scheduled</div>
            <div className="text-2xl font-bold text-accent">{statsLoading ? '...' : stats?.inspections.scheduled ?? 0}</div>
          </SMCard>
          <SMCard className="p-5">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">In Progress</div>
            <div className="text-2xl font-bold text-warning">{statsLoading ? '...' : stats?.inspections.inProgress ?? 0}</div>
          </SMCard>
          <SMCard className="p-5">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Overdue</div>
            <div className="text-2xl font-bold text-danger">{statsLoading ? '...' : stats?.inspections.overdue ?? 0}</div>
          </SMCard>
          <SMCard className="p-5">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Sensors</div>
            <div className="text-2xl font-bold text-text-primary">{statsLoading ? '...' : stats?.sensors.total ?? 0}</div>
          </SMCard>
          <SMCard className="p-5">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Critical Sensors</div>
            <div className="text-2xl font-bold text-danger">{statsLoading ? '...' : stats?.sensors.critical ?? 0}</div>
          </SMCard>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'sensors', label: 'Sensors', icon: Radio },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as InspectionTab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-accent text-text-onAccent shadow-lg'
                  : 'bg-surface-sunken text-text-secondary border border-surface-border hover:bg-surface-overlay'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'schedule' && (
            <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
              <SMCard className="p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-text-primary">Inspection Schedule</h3>
                    <p className="text-sm text-text-muted">Live inspections from backend schedule table.</p>
                  </div>
                  <SMButton variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateForm((current) => !current)}>Schedule Inspection</SMButton>
                </div>

                {showCreateForm && (
                  <form onSubmit={handleCreateInspection} className="space-y-3 p-4 rounded-2xl border border-surface-border bg-surface-sunken">
                    <input value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-overlay text-sm outline-none focus:border-accent" placeholder="Inspection title" required />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={formData.inspectionType} onChange={(event) => setFormData((current) => ({ ...current, inspectionType: event.target.value as CreateInspectionPayload['inspectionType'] }))} className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-overlay text-sm outline-none focus:border-accent">
                        {INSPECTION_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                      </select>
                      <select value={formData.recurrence} onChange={(event) => setFormData((current) => ({ ...current, recurrence: event.target.value as CreateInspectionPayload['recurrence'] }))} className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-overlay text-sm outline-none focus:border-accent">
                        {RECURRENCES.map((recurrence) => <option key={recurrence} value={recurrence}>{recurrence}</option>)}
                      </select>
                    </div>
                    <textarea value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} rows={2} className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-overlay text-sm outline-none focus:border-accent resize-none" placeholder="Description" />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={formData.zone} onChange={(event) => setFormData((current) => ({ ...current, zone: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-overlay text-sm outline-none focus:border-accent" placeholder="Zone" />
                      <input value={formData.location} onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-overlay text-sm outline-none focus:border-accent" placeholder="Location" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={formData.assignedTo} onChange={(event) => setFormData((current) => ({ ...current, assignedTo: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-overlay text-sm outline-none focus:border-accent" placeholder="Assigned to" />
                      <input value={formData.assigneeEmail} onChange={(event) => setFormData((current) => ({ ...current, assigneeEmail: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-overlay text-sm outline-none focus:border-accent" placeholder="Assignee email" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <input type="date" value={formData.scheduledDate} onChange={(event) => setFormData((current) => ({ ...current, scheduledDate: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-overlay text-sm outline-none focus:border-accent" required />
                      <input type="time" value={formData.scheduledTime} onChange={(event) => setFormData((current) => ({ ...current, scheduledTime: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-overlay text-sm outline-none focus:border-accent" />
                      <input type="number" min={15} value={formData.duration} onChange={(event) => setFormData((current) => ({ ...current, duration: Number(event.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-overlay text-sm outline-none focus:border-accent" />
                    </div>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high', 'critical'] as const).map((priority) => (
                        <button key={priority} type="button" onClick={() => setFormData((current) => ({ ...current, priority }))} className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border ${formData.priority === priority ? getStatusColor(priority) : 'bg-surface-overlay border-surface-border text-text-muted'}`}>
                          {priority}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input value={checklistDraft} onChange={(event) => setChecklistDraft(event.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-surface-border bg-surface-overlay text-sm outline-none focus:border-accent" placeholder="Checklist item" />
                        <button type="button" onClick={addChecklistItem} className="px-4 py-3 rounded-xl bg-accent text-text-onAccent text-sm font-bold">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(formData.checklist || []).map((item) => (
                          <span key={item} className="px-3 py-1 rounded-full bg-surface-overlay border border-surface-border text-xs text-text-muted">{item}</span>
                        ))}
                      </div>
                    </div>
                    <textarea value={formData.notes} onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))} rows={2} className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-overlay text-sm outline-none focus:border-accent resize-none" placeholder="Notes" />
                    <SMButton variant="primary" type="submit" className="w-full" loading={createInspection.loading} leftIcon={createInspection.loading ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}>
                      {createInspection.loading ? 'Scheduling...' : 'Save Inspection'}
                    </SMButton>
                  </form>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-sunken border border-surface-border text-sm text-text-muted">
                    <Filter className="w-4 h-4" />
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as InspectionStatus)} className="bg-transparent outline-none">
                      <option value="all">All Statuses</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-sunken border border-surface-border text-sm text-text-muted">
                    <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as InspectionType)} className="bg-transparent outline-none">
                      <option value="all">All Types</option>
                      {INSPECTION_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-sunken border border-surface-border text-sm text-text-muted">
                    <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as InspectionPriority)} className="bg-transparent outline-none">
                      <option value="all">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 max-h-[760px] overflow-auto pr-1">
                  {scheduleItems.map((inspection) => (
                    <button key={inspection.id} onClick={() => setSelectedInspectionId(inspection.id)} className={`w-full text-left p-4 rounded-2xl border transition-colors ${selectedInspectionId === inspection.id ? 'border-accent/30 bg-accent/5' : 'border-surface-border bg-surface-sunken hover:bg-surface-overlay'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(inspection.status)}`}>{inspection.status.replace('_', ' ')}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(inspection.priority)}`}>{inspection.priority}</span>
                          </div>
                          <h4 className="font-semibold text-text-primary">{inspection.title}</h4>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-muted">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(inspection.scheduledDate)}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{inspection.scheduledTime || 'N/A'}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{inspection.zone || inspection.location || 'N/A'}</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{inspection.assignedTo || 'Unassigned'}</span>
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-text-muted" />
                      </div>
                    </button>
                  ))}
                  {!scheduleLoading && scheduleItems.length === 0 && <div className="text-sm text-text-muted">No inspections found for current filters.</div>}
                </div>
              </SMCard>

              <SMCard className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-text-primary">Inspection Detail</h3>
                  <p className="text-sm text-text-muted">Selected inspection detail from backend.</p>
                </div>
                {detailLoading && <div className="text-sm text-text-muted">Loading inspection detail...</div>}
                {!selectedInspectionId && <div className="text-sm text-text-muted">Select an inspection to inspect live detail.</div>}
                {selectedInspection && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-surface-sunken border border-surface-border">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(selectedInspection.status)}`}>{selectedInspection.status.replace('_', ' ')}</span>
                        {selectedInspection.result && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(selectedInspection.result === 'fail' ? 'critical' : selectedInspection.result === 'partial' ? 'warning' : 'completed')}`}>{selectedInspection.result}</span>}
                      </div>
                      <h4 className="text-xl font-bold text-text-primary">{selectedInspection.title}</h4>
                      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                        <div className="p-3 rounded-xl bg-surface-overlay border border-surface-border"><div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Type</div><div className="font-semibold text-text-primary mt-1">{selectedInspection.inspectionType}</div></div>
                        <div className="p-3 rounded-xl bg-surface-overlay border border-surface-border"><div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Recurrence</div><div className="font-semibold text-text-primary mt-1">{selectedInspection.recurrence}</div></div>
                        <div className="p-3 rounded-xl bg-surface-overlay border border-surface-border"><div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Assigned To</div><div className="font-semibold text-text-primary mt-1">{selectedInspection.assignedTo || 'Unassigned'}</div></div>
                        <div className="p-3 rounded-xl bg-surface-overlay border border-surface-border"><div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Next Scheduled</div><div className="font-semibold text-text-primary mt-1">{formatDate(selectedInspection.nextScheduledDate)}</div></div>
                      </div>
                      {selectedInspection.description && <p className="mt-4 text-sm text-text-secondary">{selectedInspection.description}</p>}
                    </div>

                    <div>
                      <h4 className="font-bold text-text-primary mb-3">Checklist</h4>
                      <div className="space-y-2">
                        {(selectedInspection.checklist || []).map((item, index) => (
                          <div key={`${item.item}-${index}`} className="flex items-center gap-3 p-3 rounded-xl bg-surface-sunken border border-surface-border">
                            {item.completed ? <CheckCircle2 className="w-4 h-4 text-success" /> : <ClipboardCheck className="w-4 h-4 text-text-muted" />}
                            <span className="text-sm text-text-secondary">{item.item}</span>
                          </div>
                        ))}
                        {selectedInspection.checklist?.length === 0 && <div className="text-sm text-text-muted">No checklist configured.</div>}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-text-primary mb-3">Findings</h4>
                      <div className="space-y-2">
                        {(selectedInspection.findings || []).map((finding, index) => (
                          <div key={`${finding}-${index}`} className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">{finding}</div>
                        ))}
                        {selectedInspection.findings?.length === 0 && <div className="text-sm text-text-muted">No findings recorded.</div>}
                      </div>
                    </div>
                  </div>
                )}
              </SMCard>
            </motion.div>
          )}

          {activeTab === 'sensors' && (
            <motion.div key="sensors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-text-primary">Sensor Status Board</h3>
                  <p className="text-sm text-text-muted">Live sensor configuration list from inspection backend.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-sunken border border-surface-border text-sm text-text-muted">
                  <ShieldAlert className="w-4 h-4" />
                  <select value={sensorStatusFilter} onChange={(event) => setSensorStatusFilter(event.target.value as typeof SENSOR_STATUSES[number] | 'all')} className="bg-transparent outline-none">
                    <option value="all">All Sensors</option>
                    {SENSOR_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sensorItems.map((sensor) => (
                  <SMCard key={sensor.sensorId} className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="text-xs font-bold text-accent uppercase tracking-wider">{sensor.sensorId}</div>
                        <h4 className="font-bold text-text-primary mt-1">{sensor.name}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(sensor.status)}`}>{sensor.status}</span>
                    </div>
                    <div className="space-y-2 text-sm text-text-secondary">
                      <div className="flex items-center gap-2"><Radio className="w-4 h-4 text-text-muted" />{sensor.sensorType}</div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-text-muted" />{sensor.location}</div>
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-text-muted" />Calibration due: {formatDate(sensor.calibrationDue)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                      <div className="p-3 rounded-xl bg-surface-sunken border border-surface-border">
                        <div className="text-text-muted uppercase tracking-wider">Threshold Min</div>
                        <div className="font-semibold text-text-primary mt-1">{sensor.minThreshold ?? 'N/A'}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-sunken border border-surface-border">
                        <div className="text-text-muted uppercase tracking-wider">Threshold Max</div>
                        <div className="font-semibold text-text-primary mt-1">{sensor.maxThreshold ?? 'N/A'}</div>
                      </div>
                    </div>
                  </SMCard>
                ))}
                {!sensorsLoading && sensorItems.length === 0 && <div className="text-sm text-text-muted">No sensors found for current filter.</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default InspectionScheduling;
