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
import { SMAlert, SMBadge, SMButton, SMCard, SMInput, SMSelect, SMStatCard } from '../components/ui';
import PageContainer from '../layouts/PageContainer';
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

const getRiskBadgeVariant = (level: string): 'danger' | 'warning' | 'neutral' | 'success' => {
  switch (level) {
    case 'Critical': return 'danger';
    case 'High': return 'warning';
    case 'Medium': return 'warning';
    default: return 'success';
  }
};

const getStatusBadgeVariant = (status: string): 'success' | 'neutral' | 'teal' | 'warning' => {
  switch (status) {
    case 'Mitigated': return 'success';
    case 'Closed': return 'neutral';
    case 'Monitoring': return 'teal';
    default: return 'warning';
  }
};

const formatDate = (value?: string | number | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const buildRiskCode = () => `R-${Date.now().toString().slice(-6)}`;

const rowLabels = ['Very High', 'High', 'Medium', 'Low', 'Very Low'];
const colLabels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

const RiskMatrix: React.FC = () => {
  const { data, loading } = useRiskMatrix();

  return (
    <SMCard className="p-6">
      <h3 className="text-xl font-bold text-text-primary tracking-tight mb-6">Risk Matrix (5x5)</h3>
      {loading && <div className="text-sm text-text-muted">Loading matrix...</div>}
      {data && (
        <div className="overflow-x-auto">
          <div className="flex gap-2">
            {/* Y-axis label */}
            <div className="flex flex-col items-center justify-center w-6 shrink-0 mt-8 mb-10">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest rotate-[-90deg] whitespace-nowrap">Severity</span>
            </div>

            <div className="flex-1">
              {/* Matrix rows with row labels */}
              <div className="flex flex-col gap-1.5">
                {data.matrix.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-1.5">
                    {/* Row label */}
                    <div className="w-[72px] shrink-0 text-right">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide leading-tight">{rowLabels[rowIndex]}</span>
                    </div>
                    {/* Cells */}
                    {row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`flex-1 h-14 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-sm ${
                          cell.level === 'Critical'
                            ? 'bg-danger'
                            : cell.level === 'High'
                              ? 'bg-warning'
                              : cell.level === 'Medium'
                                ? 'bg-amber-500'
                                : 'bg-success'
                        }`}
                      >
                        <span className="text-base leading-none">{cell.score}</span>
                        <span className="text-[10px] uppercase tracking-wide opacity-90 mt-0.5">{cell.level}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Column labels */}
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-[72px] shrink-0" />
                {colLabels.map((label) => (
                  <div key={label} className="flex-1 text-center">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              {/* X-axis label */}
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-[72px] shrink-0" />
                <div className="flex-1 text-center">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Likelihood</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SMCard>
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
    <PageContainer
      title="Risk Register"
      subtitle="Live risk matrix, register records, and mitigation workflow backed by the risk service."
      maxWidth="xl"
      actions={
        <SMButton variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateForm((current) => !current)}>Add Risk Item</SMButton>
      }
    >
      <div className="space-y-8">
        {message && (
          <SMAlert
            variant={message.toLowerCase().includes('failed') ? 'danger' : 'success'}
            onDismiss={() => setMessage(null)}
          >
            {message}
          </SMAlert>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SMStatCard label="Register Total" value={statsLoading ? '...' : String(stats?.register.total ?? 0)} loading={statsLoading} />
          <SMStatCard label="Open Risks" value={statsLoading ? '...' : String(stats?.register.open ?? 0)} variant="warning" loading={statsLoading} />
          <SMStatCard label="Mitigated" value={statsLoading ? '...' : String(stats?.register.mitigated ?? 0)} variant="success" loading={statsLoading} />
          <SMStatCard label="Critical Assessments" value={statsLoading ? '...' : String(stats?.assessments.critical ?? 0)} variant="danger" loading={statsLoading} />
        </div>

        <AnimatePresence>
          {showCreateForm && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleCreateRisk}
              className="bg-surface-raised p-6 rounded-2xl shadow-soft border border-surface-border grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <SMInput value={createForm.riskCode} onChange={(event) => setCreateForm((current) => ({ ...current, riskCode: event.target.value }))} placeholder="Risk code" required />
              <SMInput value={createForm.hazard} onChange={(event) => setCreateForm((current) => ({ ...current, hazard: event.target.value }))} placeholder="Hazard" required />
              <SMInput as="textarea" value={createForm.consequence} onChange={(event) => setCreateForm((current) => ({ ...current, consequence: event.target.value }))} className="md:col-span-2" rows={2} placeholder="Consequence" required />
              <div className="grid grid-cols-2 gap-3">
                <SMInput type="number" label="Likelihood" min={1} max={5} value={String(createForm.likelihood)} onChange={(event) => setCreateForm((current) => ({ ...current, likelihood: Number(event.target.value) }))} />
                <SMInput type="number" label="Severity" min={1} max={5} value={String(createForm.severity)} onChange={(event) => setCreateForm((current) => ({ ...current, severity: Number(event.target.value) }))} />
              </div>
              <SMSelect value={createForm.controlType} onChange={(event) => setCreateForm((current) => ({ ...current, controlType: event.target.value as CreateRiskRegisterPayload['controlType'] }))} options={CONTROL_TYPES.map((type) => ({ value: type, label: type }))} placeholder="Control type" />
              <SMInput value={createForm.responsiblePerson} onChange={(event) => setCreateForm((current) => ({ ...current, responsiblePerson: event.target.value }))} placeholder="Responsible person" />
              <SMInput value={createForm.department} onChange={(event) => setCreateForm((current) => ({ ...current, department: event.target.value }))} placeholder="Department" />
              <SMInput value={createForm.location} onChange={(event) => setCreateForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
              <SMInput type="date" label="Target Date" value={createForm.targetDate} onChange={(event) => setCreateForm((current) => ({ ...current, targetDate: event.target.value }))} />
              <SMInput as="textarea" value={createForm.mitigation} onChange={(event) => setCreateForm((current) => ({ ...current, mitigation: event.target.value }))} className="md:col-span-2" rows={3} placeholder="Mitigation plan" />
              <SMButton variant="primary" type="submit" className="md:col-span-2 w-full" loading={createRisk.loading} leftIcon={<Plus className="w-4 h-4" />}>
                {createRisk.loading ? 'Saving...' : 'Create Risk Item'}
              </SMButton>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <RiskMatrix />
          </div>

          <div className="lg:col-span-3 space-y-6">
            <SMCard className="p-8 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-bold text-text-primary tracking-tight">Active Risks</h3>
                  <p className="text-sm text-text-muted mt-1">Backend register items sorted by current risk score.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-raised border border-surface-border text-sm text-text-muted">
                    <Filter className="w-4 h-4" />
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as RiskStatusFilter)} className="bg-transparent outline-none">
                      <option value="all">All Statuses</option>
                      <option value="Open">Open</option>
                      <option value="Mitigated">Mitigated</option>
                      <option value="Closed">Closed</option>
                      <option value="Monitoring">Monitoring</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-raised border border-surface-border text-sm text-text-muted">
                    <select value={riskLevelFilter} onChange={(event) => setRiskLevelFilter(event.target.value as RiskLevelFilter)} className="bg-transparent outline-none">
                      <option value="all">All Levels</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <SMButton variant="ghost" size="sm" onClick={() => refetch()} rightIcon={<ArrowUpRight className="w-3 h-3" />}>
                    Refresh
                  </SMButton>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="pb-4 text-xs font-semibold text-text-muted uppercase tracking-widest">Hazard</th>
                      <th className="pb-4 text-xs font-semibold text-text-muted uppercase tracking-widest text-center">L x S</th>
                      <th className="pb-4 text-xs font-semibold text-text-muted uppercase tracking-widest text-center">Score</th>
                      <th className="pb-4 text-xs font-semibold text-text-muted uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {items.map((risk, index) => (
                      <motion.tr
                        key={risk.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`group transition-colors cursor-pointer ${selectedRiskId === risk.id ? 'bg-accent/10' : 'hover:bg-surface-overlay/50'}`}
                        onClick={() => setSelectedRiskId(risk.id)}
                      >
                        <td className="py-4">
                          <div className="font-bold text-text-primary text-sm">{risk.hazard}</div>
                          <div className="text-xs text-text-muted mt-0.5">{risk.consequence}</div>
                        </td>
                        <td className="py-4 text-center text-xs font-medium text-text-secondary">
                          {risk.likelihood} x {risk.severity}
                        </td>
                        <td className="py-4 text-center">
                          <SMBadge variant={getRiskBadgeVariant(risk.riskLevel)} size="sm">
                            {risk.riskScore}
                          </SMBadge>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                            {risk.status === 'Mitigated' || risk.status === 'Closed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-orange-500" />}
                            {risk.status}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {!itemsLoading && items.length === 0 && <div className="text-sm text-text-muted py-6">No risk register items found for current filters.</div>}
              </div>
            </SMCard>

            <SMCard className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-text-primary tracking-tight">Risk Detail</h3>
                  <p className="text-sm text-text-muted mt-1">Selected register item detail from backend.</p>
                </div>
                {selectedRisk && (
                  <div className="flex gap-2">
                    {(['Monitoring', 'Mitigated', 'Closed'] as RiskRegisterItem['status'][]).map((status) => (
                      <SMButton
                        key={status}
                        size="sm"
                        variant={selectedRisk.status === status ? 'primary' : 'secondary'}
                        onClick={() => handleStatusUpdate(status)}
                      >
                        {status}
                      </SMButton>
                    ))}
                  </div>
                )}
              </div>

              {detailLoading && <div className="text-sm text-text-muted">Loading risk detail...</div>}
              {!selectedRiskId && <div className="text-sm text-text-muted">Select a risk to view full backend detail.</div>}

              {selectedRisk && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <SMBadge variant={getRiskBadgeVariant(selectedRisk.riskLevel)}>{selectedRisk.riskLevel}</SMBadge>
                    <SMBadge variant={getStatusBadgeVariant(selectedRisk.status)}>{selectedRisk.status}</SMBadge>
                    <SMBadge variant="neutral">{selectedRisk.riskCode}</SMBadge>
                  </div>

                  <div>
                    <h4 className="text-2xl font-bold text-text-primary">{selectedRisk.hazard}</h4>
                    <p className="text-text-muted mt-2">{selectedRisk.consequence}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-surface-raised border border-surface-border">
                      <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-widest font-semibold"><Activity className="w-3 h-3" />Likelihood</div>
                      <div className="text-xl font-bold text-text-primary mt-2">{selectedRisk.likelihood}</div>
                      <div className="text-xs text-text-muted">{selectedRisk.likelihoodLabel || 'Risk likelihood'}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-raised border border-surface-border">
                      <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-widest font-semibold"><ShieldAlert className="w-3 h-3" />Severity</div>
                      <div className="text-xl font-bold text-text-primary mt-2">{selectedRisk.severity}</div>
                      <div className="text-xs text-text-muted">{selectedRisk.severityLabel || 'Risk severity'}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-raised border border-surface-border">
                      <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-widest font-semibold"><Target className="w-3 h-3" />Owner</div>
                      <div className="text-xl font-bold text-text-primary mt-2">{selectedRisk.responsiblePerson || 'Unassigned'}</div>
                      <div className="text-xs text-text-muted">{selectedRisk.controlType || 'No control type'}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-raised border border-surface-border">
                      <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-widest font-semibold"><Clock className="w-3 h-3" />Target Date</div>
                      <div className="text-xl font-bold text-text-primary mt-2">{formatDate(selectedRisk.targetDate)}</div>
                      <div className="text-xs text-text-muted">Due for mitigation review</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-surface-raised border border-surface-border">
                      <div className="flex items-center gap-2 text-text-primary font-bold mb-2"><MapPin className="w-4 h-4" />Location</div>
                      <div className="text-sm text-text-secondary">{selectedRisk.location || 'No location assigned'}</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-surface-raised border border-surface-border">
                      <div className="flex items-center gap-2 text-text-primary font-bold mb-2"><User className="w-4 h-4" />Department</div>
                      <div className="text-sm text-text-secondary">{selectedRisk.department || 'No department assigned'}</div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-surface-raised border border-surface-border">
                    <div className="text-text-primary font-bold mb-2">Mitigation Strategy</div>
                    <div className="text-sm text-text-secondary whitespace-pre-wrap">{selectedRisk.mitigation || 'No mitigation plan recorded yet.'}</div>
                  </div>
                </div>
              )}
            </SMCard>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default RiskRegister;
