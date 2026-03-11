import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Filter,
  Plus,
  Clock,
  User,
  MapPin,
  Activity,
  Target,
} from 'lucide-react';
import {
  useCreateRiskRegisterItem,
  useRiskMatrix,
  useRiskRegister,
  useRiskRegisterItem,
  useRiskStats,
  useUpdateRiskRegisterItem,
} from '../api/hooks/useAPIHooks';
import type { CreateRiskRegisterPayload, RiskRegisterItem } from '../api/services/apiService';

type RiskStatusFilter = 'all' | 'Open' | 'Mitigated' | 'Closed' | 'Monitoring';
type RiskLevelFilter = 'all' | 'Low' | 'Medium' | 'High' | 'Critical';

const CONTROL_TYPES: Array<NonNullable<CreateRiskRegisterPayload['controlType']>> = [
  'Elimination',
  'Substitution',
  'Engineering',
  'Administrative',
  'PPE',
];

const getRiskTone = (level: string) => {
  switch (level) {
    case 'Critical':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'High':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Medium':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
};

const getStatusTone = (status: string) => {
  switch (status) {
    case 'Mitigated':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Closed':
      return 'bg-surface-100 text-surface-700 border-surface-200';
    case 'Monitoring':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-orange-50 text-orange-700 border-orange-200';
  }
};

const formatDate = (value?: string | number | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const buildRiskCode = () => `R-${Date.now().toString().slice(-6)}`;

const RiskMatrix: React.FC = () => {
  const { data, loading } = useRiskMatrix();

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-surface-100">
      <h3 className="text-xl font-bold text-brand-900 tracking-tight mb-6">Risk Matrix (5x5)</h3>
      {loading && <div className="text-sm text-surface-500">Loading matrix...</div>}
      {data && (
        <div className="grid grid-cols-6 gap-2">
          <div className="col-span-1 flex flex-col justify-between py-8 text-[10px] font-bold text-surface-400 uppercase tracking-widest">
            <span>High</span>
            <span>Severity</span>
            <span>Low</span>
          </div>
          <div className="col-span-5 grid grid-cols-5 gap-2">
            {data.matrix.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-sm ${
                    cell.level === 'Critical'
                      ? 'bg-accent-500'
                      : cell.level === 'High'
                        ? 'bg-orange-500'
                        : cell.level === 'Medium'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                  }`}
                >
                  <span className="text-lg leading-none">{cell.score}</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-80">{cell.level}</span>
                </div>
              ))
            ))}
          </div>
          <div className="col-start-2 col-span-5 flex justify-between px-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest mt-2">
            <span>Low</span>
            <span>Likelihood</span>
            <span>High</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const RiskRegister: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<RiskStatusFilter>('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState<RiskLevelFilter>('all');
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateRiskRegisterPayload>({
    riskCode: buildRiskCode(),
    hazard: '',
    consequence: '',
    likelihood: 3,
    severity: 3,
    mitigation: '',
    controlType: 'Engineering',
    responsiblePerson: '',
    targetDate: '',
    department: '',
    location: '',
  });

  const filters = useMemo(
    () => ({
      status: statusFilter === 'all' ? undefined : statusFilter,
      riskLevel: riskLevelFilter === 'all' ? undefined : riskLevelFilter,
    }),
    [statusFilter, riskLevelFilter]
  );

  const { data: stats, loading: statsLoading } = useRiskStats();
  const { data: itemsData, loading: itemsLoading, refetch } = useRiskRegister(filters);
  const items = itemsData ?? [];
  const { data: selectedRisk, loading: detailLoading, refetch: refetchSelected } = useRiskRegisterItem(selectedRiskId);
  const createRisk = useCreateRiskRegisterItem();
  const updateRisk = useUpdateRiskRegisterItem();

  const handleCreateRisk = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const created = await createRisk.mutate({
      ...createForm,
      mitigation: createForm.mitigation || undefined,
      responsiblePerson: createForm.responsiblePerson || undefined,
      targetDate: createForm.targetDate || undefined,
      department: createForm.department || undefined,
      location: createForm.location || undefined,
    });

    if (!created) {
      setMessage(createRisk.error?.message || 'Failed to create risk item.');
      return;
    }

    setMessage('Risk register item created successfully.');
    setSelectedRiskId(created.id);
    setShowCreateForm(false);
    setCreateForm({
      riskCode: buildRiskCode(),
      hazard: '',
      consequence: '',
      likelihood: 3,
      severity: 3,
      mitigation: '',
      controlType: 'Engineering',
      responsiblePerson: '',
      targetDate: '',
      department: '',
      location: '',
    });
    await refetch();
  };

  const handleStatusUpdate = async (status: RiskRegisterItem['status']) => {
    if (!selectedRiskId) return;

    const updated = await updateRisk.mutate({ id: selectedRiskId, data: { status } });
    if (!updated) {
      setMessage(updateRisk.error?.message || 'Failed to update risk item.');
      return;
    }

    setMessage(`Risk item marked as ${status}.`);
    await Promise.all([refetch(), refetchSelected()]);
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-32">


      <main className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
              <ShieldAlert className="w-4 h-4" />
              Enterprise Risk Management
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-900 tracking-tighter leading-none">Risk Register</h1>
            <p className="text-surface-500 mt-4 max-w-xl text-lg">
              Live risk matrix, register records, and mitigation workflow backed by the risk service.
            </p>
          </motion.div>
          <button
            onClick={() => setShowCreateForm((current) => !current)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-900 text-white font-bold shadow-button"
          >
            <Plus className="w-4 h-4" />
            Add Risk Item
          </button>
        </div>

        {message && (
          <div className={`rounded-2xl px-4 py-3 text-sm border ${message.toLowerCase().includes('failed') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Register Total</div>
            <div className="text-2xl font-bold text-brand-900">{statsLoading ? '...' : stats?.register.total ?? 0}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Open Risks</div>
            <div className="text-2xl font-bold text-orange-600">{statsLoading ? '...' : stats?.register.open ?? 0}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Mitigated</div>
            <div className="text-2xl font-bold text-emerald-600">{statsLoading ? '...' : stats?.register.mitigated ?? 0}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Critical Assessments</div>
            <div className="text-2xl font-bold text-red-600">{statsLoading ? '...' : stats?.assessments.critical ?? 0}</div>
          </div>
        </div>

        <AnimatePresence>
          {showCreateForm && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleCreateRisk}
              className="bg-white p-6 rounded-[2.5rem] shadow-soft border border-surface-100 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <input value={createForm.riskCode} onChange={(event) => setCreateForm((current) => ({ ...current, riskCode: event.target.value }))} className="px-4 py-3 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-400" placeholder="Risk code" required />
              <input value={createForm.hazard} onChange={(event) => setCreateForm((current) => ({ ...current, hazard: event.target.value }))} className="px-4 py-3 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-400" placeholder="Hazard" required />
              <textarea value={createForm.consequence} onChange={(event) => setCreateForm((current) => ({ ...current, consequence: event.target.value }))} className="md:col-span-2 px-4 py-3 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-400 resize-none" rows={2} placeholder="Consequence" required />
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-surface-500">
                  <span className="block mb-2">Likelihood</span>
                  <input type="number" min={1} max={5} value={createForm.likelihood} onChange={(event) => setCreateForm((current) => ({ ...current, likelihood: Number(event.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 outline-none focus:border-brand-400" />
                </label>
                <label className="text-sm text-surface-500">
                  <span className="block mb-2">Severity</span>
                  <input type="number" min={1} max={5} value={createForm.severity} onChange={(event) => setCreateForm((current) => ({ ...current, severity: Number(event.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 outline-none focus:border-brand-400" />
                </label>
              </div>
              <select value={createForm.controlType} onChange={(event) => setCreateForm((current) => ({ ...current, controlType: event.target.value as CreateRiskRegisterPayload['controlType'] }))} className="px-4 py-3 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-400">
                {CONTROL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <input value={createForm.responsiblePerson} onChange={(event) => setCreateForm((current) => ({ ...current, responsiblePerson: event.target.value }))} className="px-4 py-3 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-400" placeholder="Responsible person" />
              <input value={createForm.department} onChange={(event) => setCreateForm((current) => ({ ...current, department: event.target.value }))} className="px-4 py-3 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-400" placeholder="Department" />
              <input value={createForm.location} onChange={(event) => setCreateForm((current) => ({ ...current, location: event.target.value }))} className="px-4 py-3 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-400" placeholder="Location" />
              <input type="date" value={createForm.targetDate} onChange={(event) => setCreateForm((current) => ({ ...current, targetDate: event.target.value }))} className="px-4 py-3 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-400" />
              <textarea value={createForm.mitigation} onChange={(event) => setCreateForm((current) => ({ ...current, mitigation: event.target.value }))} className="md:col-span-2 px-4 py-3 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-400 resize-none" rows={3} placeholder="Mitigation plan" />
              <button type="submit" disabled={createRisk.loading} className="md:col-span-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-900 text-white font-bold disabled:opacity-60">
                <Plus className="w-4 h-4" />
                {createRisk.loading ? 'Saving...' : 'Create Risk Item'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <RiskMatrix />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-surface-100 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-bold text-brand-900 tracking-tight">Active Risks</h3>
                  <p className="text-sm text-surface-500 mt-1">Backend register items sorted by current risk score.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-500">
                    <Filter className="w-4 h-4" />
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as RiskStatusFilter)} className="bg-transparent outline-none">
                      <option value="all">All Statuses</option>
                      <option value="Open">Open</option>
                      <option value="Mitigated">Mitigated</option>
                      <option value="Closed">Closed</option>
                      <option value="Monitoring">Monitoring</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-500">
                    <select value={riskLevelFilter} onChange={(event) => setRiskLevelFilter(event.target.value as RiskLevelFilter)} className="bg-transparent outline-none">
                      <option value="all">All Levels</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <button onClick={() => refetch()} className="text-[10px] font-bold text-brand-600 uppercase tracking-widest hover:text-brand-700 transition-colors flex items-center gap-1">
                    Refresh <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-surface-50">
                      <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest">Hazard</th>
                      <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest text-center">L x S</th>
                      <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest text-center">Score</th>
                      <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {items.map((risk, index) => (
                      <motion.tr
                        key={risk.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`group transition-colors cursor-pointer ${selectedRiskId === risk.id ? 'bg-brand-50/70' : 'hover:bg-surface-50/50'}`}
                        onClick={() => setSelectedRiskId(risk.id)}
                      >
                        <td className="py-4">
                          <div className="font-bold text-brand-900 text-sm">{risk.hazard}</div>
                          <div className="text-[10px] text-surface-500 mt-0.5">{risk.consequence}</div>
                        </td>
                        <td className="py-4 text-center text-xs font-medium text-surface-600">
                          {risk.likelihood} x {risk.severity}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getRiskTone(risk.riskLevel)}`}>
                            {risk.riskScore}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2 text-xs font-medium text-surface-600">
                            {risk.status === 'Mitigated' || risk.status === 'Closed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-orange-500" />}
                            {risk.status}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {!itemsLoading && items.length === 0 && <div className="text-sm text-surface-500 py-6">No risk register items found for current filters.</div>}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-surface-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-brand-900 tracking-tight">Risk Detail</h3>
                  <p className="text-sm text-surface-500 mt-1">Selected register item detail from backend.</p>
                </div>
                {selectedRisk && (
                  <div className="flex gap-2">
                    {(['Monitoring', 'Mitigated', 'Closed'] as RiskRegisterItem['status'][]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(status)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border ${selectedRisk.status === status ? getStatusTone(status) : 'bg-white text-surface-600 border-surface-200'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {detailLoading && <div className="text-sm text-surface-500">Loading risk detail...</div>}
              {!selectedRiskId && <div className="text-sm text-surface-500">Select a risk to view full backend detail.</div>}

              {selectedRisk && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskTone(selectedRisk.riskLevel)}`}>{selectedRisk.riskLevel}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusTone(selectedRisk.status)}`}>{selectedRisk.status}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold border bg-surface-50 text-surface-700 border-surface-200">{selectedRisk.riskCode}</span>
                  </div>

                  <div>
                    <h4 className="text-2xl font-bold text-brand-900">{selectedRisk.hazard}</h4>
                    <p className="text-surface-500 mt-2">{selectedRisk.consequence}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                      <div className="flex items-center gap-2 text-surface-400 text-[10px] uppercase tracking-widest font-bold"><Activity className="w-3 h-3" />Likelihood</div>
                      <div className="text-xl font-bold text-brand-900 mt-2">{selectedRisk.likelihood}</div>
                      <div className="text-xs text-surface-500">{selectedRisk.likelihoodLabel || 'Risk likelihood'}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                      <div className="flex items-center gap-2 text-surface-400 text-[10px] uppercase tracking-widest font-bold"><ShieldAlert className="w-3 h-3" />Severity</div>
                      <div className="text-xl font-bold text-brand-900 mt-2">{selectedRisk.severity}</div>
                      <div className="text-xs text-surface-500">{selectedRisk.severityLabel || 'Risk severity'}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                      <div className="flex items-center gap-2 text-surface-400 text-[10px] uppercase tracking-widest font-bold"><Target className="w-3 h-3" />Owner</div>
                      <div className="text-xl font-bold text-brand-900 mt-2">{selectedRisk.responsiblePerson || 'Unassigned'}</div>
                      <div className="text-xs text-surface-500">{selectedRisk.controlType || 'No control type'}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                      <div className="flex items-center gap-2 text-surface-400 text-[10px] uppercase tracking-widest font-bold"><Clock className="w-3 h-3" />Target Date</div>
                      <div className="text-xl font-bold text-brand-900 mt-2">{formatDate(selectedRisk.targetDate)}</div>
                      <div className="text-xs text-surface-500">Due for mitigation review</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-surface-50 border border-surface-100">
                      <div className="flex items-center gap-2 text-brand-900 font-bold mb-2"><MapPin className="w-4 h-4" />Location</div>
                      <div className="text-sm text-surface-600">{selectedRisk.location || 'No location assigned'}</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-surface-50 border border-surface-100">
                      <div className="flex items-center gap-2 text-brand-900 font-bold mb-2"><User className="w-4 h-4" />Department</div>
                      <div className="text-sm text-surface-600">{selectedRisk.department || 'No department assigned'}</div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-surface-50 border border-surface-100">
                    <div className="text-brand-900 font-bold mb-2">Mitigation Strategy</div>
                    <div className="text-sm text-surface-600 whitespace-pre-wrap">{selectedRisk.mitigation || 'No mitigation plan recorded yet.'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RiskRegister;
