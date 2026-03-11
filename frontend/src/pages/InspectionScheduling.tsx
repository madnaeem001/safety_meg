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
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'scheduled':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'in_progress':
    case 'warning':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'critical':
    case 'overdue':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'offline':
    case 'cancelled':
    case 'maintenance':
      return 'bg-surface-50 text-surface-600 border-surface-200';
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
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100 pb-32">


      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            <ClipboardCheck className="w-4 h-4" />
            Inspection Operations
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-900 tracking-tight">Inspection Scheduling</h1>
          <p className="text-surface-500 max-w-3xl">
            Live inspection schedule and sensor status powered by backend inspection and monitoring routes.
          </p>
        </motion.div>

        {createMessage && (
          <div className={`rounded-2xl px-4 py-3 text-sm border ${createInspection.error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {createMessage}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
            <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Inspections</div>
            <div className="text-2xl font-bold text-brand-900">{statsLoading ? '...' : stats?.inspections.total ?? 0}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
            <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Scheduled</div>
            <div className="text-2xl font-bold text-blue-600">{statsLoading ? '...' : stats?.inspections.scheduled ?? 0}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
            <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">In Progress</div>
            <div className="text-2xl font-bold text-amber-600">{statsLoading ? '...' : stats?.inspections.inProgress ?? 0}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
            <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Overdue</div>
            <div className="text-2xl font-bold text-red-600">{statsLoading ? '...' : stats?.inspections.overdue ?? 0}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
            <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Sensors</div>
            <div className="text-2xl font-bold text-brand-900">{statsLoading ? '...' : stats?.sensors.total ?? 0}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
            <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Critical Sensors</div>
            <div className="text-2xl font-bold text-red-600">{statsLoading ? '...' : stats?.sensors.critical ?? 0}</div>
          </div>
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
                  ? 'bg-brand-900 text-white shadow-lg'
                  : 'bg-white text-brand-700 border border-surface-200 hover:bg-surface-50'
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
              <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-brand-900">Inspection Schedule</h3>
                    <p className="text-sm text-surface-500">Live inspections from backend schedule table.</p>
                  </div>
                  <button
                    onClick={() => setShowCreateForm((current) => !current)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    Schedule Inspection
                  </button>
                </div>

                {showCreateForm && (
                  <form onSubmit={handleCreateInspection} className="space-y-3 p-4 rounded-2xl border border-surface-100 bg-surface-50">
                    <input value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400" placeholder="Inspection title" required />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={formData.inspectionType} onChange={(event) => setFormData((current) => ({ ...current, inspectionType: event.target.value as CreateInspectionPayload['inspectionType'] }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400">
                        {INSPECTION_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                      </select>
                      <select value={formData.recurrence} onChange={(event) => setFormData((current) => ({ ...current, recurrence: event.target.value as CreateInspectionPayload['recurrence'] }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400">
                        {RECURRENCES.map((recurrence) => <option key={recurrence} value={recurrence}>{recurrence}</option>)}
                      </select>
                    </div>
                    <textarea value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} rows={2} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400 resize-none" placeholder="Description" />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={formData.zone} onChange={(event) => setFormData((current) => ({ ...current, zone: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400" placeholder="Zone" />
                      <input value={formData.location} onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400" placeholder="Location" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={formData.assignedTo} onChange={(event) => setFormData((current) => ({ ...current, assignedTo: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400" placeholder="Assigned to" />
                      <input value={formData.assigneeEmail} onChange={(event) => setFormData((current) => ({ ...current, assigneeEmail: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400" placeholder="Assignee email" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <input type="date" value={formData.scheduledDate} onChange={(event) => setFormData((current) => ({ ...current, scheduledDate: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400" required />
                      <input type="time" value={formData.scheduledTime} onChange={(event) => setFormData((current) => ({ ...current, scheduledTime: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400" />
                      <input type="number" min={15} value={formData.duration} onChange={(event) => setFormData((current) => ({ ...current, duration: Number(event.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400" />
                    </div>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high', 'critical'] as const).map((priority) => (
                        <button key={priority} type="button" onClick={() => setFormData((current) => ({ ...current, priority }))} className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border ${formData.priority === priority ? getStatusColor(priority) : 'bg-white border-surface-200 text-surface-600'}`}>
                          {priority}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input value={checklistDraft} onChange={(event) => setChecklistDraft(event.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400" placeholder="Checklist item" />
                        <button type="button" onClick={addChecklistItem} className="px-4 py-3 rounded-xl bg-surface-900 text-white text-sm font-bold">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(formData.checklist || []).map((item) => (
                          <span key={item} className="px-3 py-1 rounded-full bg-white border border-surface-200 text-xs text-surface-600">{item}</span>
                        ))}
                      </div>
                    </div>
                    <textarea value={formData.notes} onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))} rows={2} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-400 resize-none" placeholder="Notes" />
                    <button type="submit" disabled={createInspection.loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-900 text-white text-sm font-bold disabled:opacity-60">
                      {createInspection.loading ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {createInspection.loading ? 'Scheduling...' : 'Save Inspection'}
                    </button>
                  </form>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-500">
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
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-500">
                    <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as InspectionType)} className="bg-transparent outline-none">
                      <option value="all">All Types</option>
                      {INSPECTION_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-500">
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
                  {schedule.map((inspection) => (
                    <button key={inspection.id} onClick={() => setSelectedInspectionId(inspection.id)} className={`w-full text-left p-4 rounded-2xl border transition-colors ${selectedInspectionId === inspection.id ? 'border-brand-300 bg-brand-50' : 'border-surface-100 bg-surface-50 hover:bg-surface-100'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(inspection.status)}`}>{inspection.status.replace('_', ' ')}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(inspection.priority)}`}>{inspection.priority}</span>
                          </div>
                          <h4 className="font-semibold text-brand-900">{inspection.title}</h4>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-surface-500">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(inspection.scheduledDate)}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{inspection.scheduledTime || 'N/A'}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{inspection.zone || inspection.location || 'N/A'}</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{inspection.assignedTo || 'Unassigned'}</span>
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-surface-400" />
                      </div>
                    </button>
                  ))}
                  {!scheduleLoading && schedule.length === 0 && <div className="text-sm text-surface-500">No inspections found for current filters.</div>}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100 space-y-4">
                <div>
                  <h3 className="font-bold text-brand-900">Inspection Detail</h3>
                  <p className="text-sm text-surface-500">Selected inspection detail from backend.</p>
                </div>
                {detailLoading && <div className="text-sm text-surface-500">Loading inspection detail...</div>}
                {!selectedInspectionId && <div className="text-sm text-surface-500">Select an inspection to inspect live detail.</div>}
                {selectedInspection && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(selectedInspection.status)}`}>{selectedInspection.status.replace('_', ' ')}</span>
                        {selectedInspection.result && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(selectedInspection.result === 'fail' ? 'critical' : selectedInspection.result === 'partial' ? 'warning' : 'completed')}`}>{selectedInspection.result}</span>}
                      </div>
                      <h4 className="text-xl font-bold text-brand-900">{selectedInspection.title}</h4>
                      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                        <div className="p-3 rounded-xl bg-white border border-surface-100"><div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Type</div><div className="font-semibold text-brand-900 mt-1">{selectedInspection.inspectionType}</div></div>
                        <div className="p-3 rounded-xl bg-white border border-surface-100"><div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Recurrence</div><div className="font-semibold text-brand-900 mt-1">{selectedInspection.recurrence}</div></div>
                        <div className="p-3 rounded-xl bg-white border border-surface-100"><div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Assigned To</div><div className="font-semibold text-brand-900 mt-1">{selectedInspection.assignedTo || 'Unassigned'}</div></div>
                        <div className="p-3 rounded-xl bg-white border border-surface-100"><div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Next Scheduled</div><div className="font-semibold text-brand-900 mt-1">{formatDate(selectedInspection.nextScheduledDate)}</div></div>
                      </div>
                      {selectedInspection.description && <p className="mt-4 text-sm text-surface-600">{selectedInspection.description}</p>}
                    </div>

                    <div>
                      <h4 className="font-bold text-brand-900 mb-3">Checklist</h4>
                      <div className="space-y-2">
                        {(selectedInspection.checklist || []).map((item, index) => (
                          <div key={`${item.item}-${index}`} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 border border-surface-100">
                            {item.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ClipboardCheck className="w-4 h-4 text-surface-400" />}
                            <span className="text-sm text-surface-700">{item.item}</span>
                          </div>
                        ))}
                        {selectedInspection.checklist?.length === 0 && <div className="text-sm text-surface-500">No checklist configured.</div>}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-brand-900 mb-3">Findings</h4>
                      <div className="space-y-2">
                        {(selectedInspection.findings || []).map((finding, index) => (
                          <div key={`${finding}-${index}`} className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{finding}</div>
                        ))}
                        {selectedInspection.findings?.length === 0 && <div className="text-sm text-surface-500">No findings recorded.</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'sensors' && (
            <motion.div key="sensors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-brand-900">Sensor Status Board</h3>
                  <p className="text-sm text-surface-500">Live sensor configuration list from inspection backend.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-500">
                  <ShieldAlert className="w-4 h-4" />
                  <select value={sensorStatusFilter} onChange={(event) => setSensorStatusFilter(event.target.value as typeof SENSOR_STATUSES[number] | 'all')} className="bg-transparent outline-none">
                    <option value="all">All Sensors</option>
                    {SENSOR_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sensors.map((sensor) => (
                  <div key={sensor.sensorId} className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="text-xs font-bold text-brand-600 uppercase tracking-wider">{sensor.sensorId}</div>
                        <h4 className="font-bold text-brand-900 mt-1">{sensor.name}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(sensor.status)}`}>{sensor.status}</span>
                    </div>
                    <div className="space-y-2 text-sm text-surface-600">
                      <div className="flex items-center gap-2"><Radio className="w-4 h-4 text-surface-400" />{sensor.sensorType}</div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-surface-400" />{sensor.location}</div>
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-surface-400" />Calibration due: {formatDate(sensor.calibrationDue)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                      <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                        <div className="text-surface-400 uppercase tracking-wider">Threshold Min</div>
                        <div className="font-semibold text-brand-900 mt-1">{sensor.minThreshold ?? 'N/A'}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                        <div className="text-surface-400 uppercase tracking-wider">Threshold Max</div>
                        <div className="font-semibold text-brand-900 mt-1">{sensor.maxThreshold ?? 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {!sensorsLoading && sensors.length === 0 && <div className="text-sm text-surface-500">No sensors found for current filter.</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default InspectionScheduling;
