import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target, Users, Flag, Award,
  CheckCircle2, Plus, Trash2, Save, Edit2,
  Rocket, Loader2, AlertCircle, X,
} from 'lucide-react';
import {
  useProjectCharters,
  useCharterDetail,
  useUpdateCharter,
  useAddCharterStakeholder,
  useDeleteCharterStakeholder,
  useAddCharterGoal,
  useDeleteCharterGoal,
} from '../../api/hooks/useAPIHooks';
import { SMCard } from '../../components/ui';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StakeholderFormState {
  name: string;
  role: string;
  influence: 'High' | 'Medium' | 'Low';
  interest: 'High' | 'Medium' | 'Low';
}

interface GoalFormState {
  description: string;
  metric: string;
  priority: 'High' | 'Medium' | 'Low';
}

// ── Sub-components ────────────────────────────────────────────────────────────

const LevelBadge: React.FC<{ value: string; colorMap: Record<string, string> }> = ({ value, colorMap }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorMap[value] ?? 'bg-slate-100 text-slate-600'}`}>
    {value}
  </span>
);

const influenceColors: Record<string, string> = {
  High: 'bg-purple-100 text-purple-700',
  Medium: 'bg-slate-100 text-slate-600',
  Low: 'bg-slate-100 text-slate-500',
};
const interestColors: Record<string, string> = {
  High: 'bg-blue-100 text-blue-700',
  Medium: 'bg-slate-100 text-slate-600',
  Low: 'bg-slate-100 text-slate-500',
};
const priorityColors: Record<string, string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-blue-100 text-blue-700',
};

// ── Add Stakeholder Modal ─────────────────────────────────────────────────────

interface AddStakeholderModalProps {
  onClose: () => void;
  onAdd: (data: StakeholderFormState) => void;
  isLoading: boolean;
}

const AddStakeholderModal: React.FC<AddStakeholderModalProps> = ({ onClose, onAdd, isLoading }) => {
  const [form, setForm] = useState<StakeholderFormState>({
    name: '', role: '', influence: 'Medium', interest: 'Medium',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) return;
    onAdd(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" role="dialog" aria-label="Add stakeholder dialog">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Add Stakeholder</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Sarah Chen"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
            <input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Product Owner"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Influence</label>
              <select
                value={form.influence}
                onChange={(e) => setForm({ ...form, influence: e.target.value as 'High' | 'Medium' | 'Low' })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interest</label>
              <select
                value={form.interest}
                onChange={(e) => setForm({ ...form, interest: e.target.value as 'High' | 'Medium' | 'Low' })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Add Goal Modal ────────────────────────────────────────────────────────────

interface AddGoalModalProps {
  onClose: () => void;
  onAdd: (data: GoalFormState) => void;
  isLoading: boolean;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ onClose, onAdd, isLoading }) => {
  const [form, setForm] = useState<GoalFormState>({ description: '', metric: '', priority: 'Medium' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || !form.metric.trim()) return;
    onAdd(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" role="dialog" aria-label="Add goal dialog">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Add Strategic Goal</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Reduce incident reporting time"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Success Metric *</label>
            <input
              value={form.metric}
              onChange={(e) => setForm({ ...form, metric: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. < 2 minutes"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const ProjectCharter: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddStakeholder, setShowAddStakeholder] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);

  // ── Backend: fetch list then use the first charter ──
  const {
    data: charterList,
    loading: listLoading,
    error: listError,
    refetch: refetchList,
  } = useProjectCharters();

  const charterId = charterList && charterList.length > 0 ? charterList[0].id : null;

  const {
    data: charter,
    loading: detailLoading,
    error: detailError,
    refetch: refetchDetail,
  } = useCharterDetail(charterId);

  // ── Edit form local state (mirrors the backend values) ──
  const [editForm, setEditForm] = useState({
    name: '',
    vision: '',
    mission: '',
    budget: '',
    sponsor: '',
  });

  // Sync edit form when charter detail loads
  useEffect(() => {
    if (charter) {
      setEditForm({
        name: charter.name,
        vision: charter.vision,
        mission: charter.mission,
        budget: charter.budget,
        sponsor: charter.sponsor,
      });
    }
  }, [charter]);

  // ── Mutations ──
  const updateCharter = useUpdateCharter();
  const addStakeholder = useAddCharterStakeholder();
  const deleteStakeholder = useDeleteCharterStakeholder();
  const addGoal = useAddCharterGoal();
  const deleteGoal = useDeleteCharterGoal();

  // ── Handlers ──
  const handleSave = async () => {
    if (!charterId) return;
    await updateCharter.mutate({ id: charterId, data: editForm });
    await refetchDetail();
    await refetchList();
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    if (charter) {
      setEditForm({
        name: charter.name,
        vision: charter.vision,
        mission: charter.mission,
        budget: charter.budget,
        sponsor: charter.sponsor,
      });
    }
    setIsEditing(false);
  };

  const handleAddStakeholder = async (data: StakeholderFormState) => {
    if (!charterId) return;
    await addStakeholder.mutate({ charterId, data });
    await refetchDetail();
    setShowAddStakeholder(false);
  };

  const handleDeleteStakeholder = async (stakeholderId: number) => {
    if (!charterId) return;
    await deleteStakeholder.mutate({ charterId, stakeholderId });
    await refetchDetail();
  };

  const handleAddGoal = async (data: GoalFormState) => {
    if (!charterId) return;
    await addGoal.mutate({ charterId, data });
    await refetchDetail();
    setShowAddGoal(false);
  };

  const handleDeleteGoal = async (goalId: number) => {
    if (!charterId) return;
    await deleteGoal.mutate({ charterId, goalId });
    await refetchDetail();
  };

  // ── Loading state ──
  if (listLoading || (charterId !== null && detailLoading && !charter)) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        <span>Loading project charter…</span>
      </div>
    );
  }

  // ── Error state ──
  if (listError || detailError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 gap-3">
        <AlertCircle className="w-6 h-6" />
        <span>Failed to load charter. Please refresh.</span>
      </div>
    );
  }

  const stakeholders = charter?.stakeholders ?? [];
  const goals = charter?.goals ?? [];
  const displayName = isEditing ? editForm.name : (charter?.name ?? '');
  const displayVision = isEditing ? editForm.vision : (charter?.vision ?? '');
  const displayMission = isEditing ? editForm.mission : (charter?.mission ?? '');
  const displayBudget = isEditing ? editForm.budget : (charter?.budget ?? '');
  const displaySponsor = isEditing ? editForm.sponsor : (charter?.sponsor ?? '');

  return (
    <>
      {showAddStakeholder && (
        <AddStakeholderModal
          onClose={() => setShowAddStakeholder(false)}
          onAdd={handleAddStakeholder}
          isLoading={addStakeholder.loading}
        />
      )}
      {showAddGoal && (
        <AddGoalModal
          onClose={() => setShowAddGoal(false)}
          onAdd={handleAddGoal}
          isLoading={addGoal.loading}
        />
      )}

      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="flex justify-between items-start gap-4">
          <div>
            {isEditing ? (
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="text-2xl font-bold text-slate-900 border-b-2 border-blue-400 bg-transparent outline-none w-full max-w-sm"
                aria-label="Project name"
              />
            ) : (
              <h2 className="text-2xl font-bold text-slate-900">{displayName}</h2>
            )}
            <p className="text-slate-500 mt-1">Project Initiation &amp; Definition Document</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateCharter.loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                  aria-label="Save charter"
                >
                  {updateCharter.loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
                aria-label="Edit charter"
              >
                <Edit2 className="w-4 h-4" /> Edit Charter
              </button>
            )}
          </div>
        </div>

        {/* ── Vision & Mission Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Rocket className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-blue-900">Project Vision</h3>
            </div>
            {isEditing ? (
              <textarea
                value={editForm.vision}
                onChange={(e) => setEditForm({ ...editForm, vision: e.target.value })}
                className="w-full h-24 p-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 bg-white/50 text-sm resize-none"
                aria-label="Project vision"
              />
            ) : (
              <p className="text-blue-800 leading-relaxed">{displayVision}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900">Mission Statement</h3>
            </div>
            {isEditing ? (
              <textarea
                value={editForm.mission}
                onChange={(e) => setEditForm({ ...editForm, mission: e.target.value })}
                className="w-full h-24 p-3 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 bg-white/50 text-sm resize-none"
                aria-label="Mission statement"
              />
            ) : (
              <p className="text-emerald-800 leading-relaxed">{displayMission}</p>
            )}
          </motion.div>
        </div>

        {/* ── Key Information Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SMCard className="p-6">
            <div className="flex items-center gap-3 mb-4 text-slate-600">
              <Award className="w-5 h-5" />
              <h4 className="font-semibold">Project Sponsor</h4>
            </div>
            {isEditing ? (
              <input
                value={editForm.sponsor}
                onChange={(e) => setEditForm({ ...editForm, sponsor: e.target.value })}
                className="w-full border-b border-slate-300 focus:border-blue-500 outline-none text-sm py-1"
                aria-label="Project sponsor"
              />
            ) : (
              <p className="text-lg font-medium text-slate-900">{displaySponsor}</p>
            )}
          </SMCard>

          <SMCard className="p-6">
            <div className="flex items-center gap-3 mb-4 text-slate-600">
              <Users className="w-5 h-5" />
              <h4 className="font-semibold">Key Stakeholders</h4>
            </div>
            <p className="text-lg font-medium text-slate-900">{stakeholders.length} Identified</p>
          </SMCard>

          <SMCard className="p-6">
            <div className="flex items-center gap-3 mb-4 text-slate-600">
              <Flag className="w-5 h-5" />
              <h4 className="font-semibold">Success Metrics</h4>
            </div>
            {isEditing ? (
              <input
                value={editForm.budget}
                onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                className="w-full border-b border-slate-300 focus:border-blue-500 outline-none text-sm py-1"
                aria-label="Project budget"
                placeholder="e.g. $1.2M"
              />
            ) : (
              <p className="text-lg font-medium text-slate-900">{goals.length} Defined Goals</p>
            )}
          </SMCard>
        </div>

        {/* ── Strategic Goals ── */}
        <SMCard className="overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Strategic Goals</h3>
            {isEditing && (
              <button
                onClick={() => setShowAddGoal(true)}
                className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700"
                aria-label="Add goal"
              >
                <Plus className="w-4 h-4" /> Add Goal
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {goals.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                No goals defined yet. {isEditing && 'Click "Add Goal" to get started.'}
              </div>
            ) : (
              goals.map((goal) => (
                <div key={goal.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <LevelBadge value={`${goal.priority} Priority`} colorMap={{
                        'High Priority': priorityColors.High,
                        'Medium Priority': priorityColors.Medium,
                        'Low Priority': priorityColors.Low,
                      }} />
                      <h5 className="font-medium text-slate-900">{goal.description}</h5>
                    </div>
                    <p className="text-sm text-slate-500 ml-2">Success Metric: {goal.metric}</p>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      disabled={deleteGoal.loading}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      aria-label={`Delete goal: ${goal.description}`}
                    >
                      {deleteGoal.loading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </SMCard>

        {/* ── Stakeholder Register ── */}
        <SMCard className="overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Stakeholder Register</h3>
            {isEditing && (
              <button
                onClick={() => setShowAddStakeholder(true)}
                className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700"
                aria-label="Add stakeholder"
              >
                <Plus className="w-4 h-4" /> Add Stakeholder
              </button>
            )}
          </div>
          {stakeholders.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              No stakeholders registered. {isEditing && 'Click "Add Stakeholder" to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Influence</th>
                    <th className="px-6 py-3 font-medium">Interest</th>
                    {isEditing && <th className="px-6 py-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stakeholders.map((stakeholder) => (
                    <tr key={stakeholder.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-900">{stakeholder.name}</td>
                      <td className="px-6 py-3 text-slate-600">{stakeholder.role}</td>
                      <td className="px-6 py-3">
                        <LevelBadge value={stakeholder.influence} colorMap={influenceColors} />
                      </td>
                      <td className="px-6 py-3">
                        <LevelBadge value={stakeholder.interest} colorMap={interestColors} />
                      </td>
                      {isEditing && (
                        <td className="px-6 py-3">
                          <button
                            onClick={() => handleDeleteStakeholder(stakeholder.id)}
                            disabled={deleteStakeholder.loading}
                            className="text-slate-400 hover:text-red-500 disabled:opacity-50"
                            aria-label={`Delete stakeholder: ${stakeholder.name}`}
                          >
                            {deleteStakeholder.loading
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SMCard>
      </div>
    </>
  );
};

