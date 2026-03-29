import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Plus,
  Trash2,
  Play,
  Pause,
  Settings,
  ArrowUpRight,
  Clock,
  Filter,
  CheckCircle2,
  Brain,
  Bell,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import {
  useAutomationRules,
  useCreateAutomationRule,
  useDeleteAutomationRule,
  useTriggerAutomationRule,
  useUpdateAutomationRule,
} from '../api/hooks/useAPIHooks';
import type { AutomationRuleRecord, CreateAutomationRulePayload } from '../api/services/apiService';

type RuleFilter = 'all' | 'active' | 'inactive';

const TRIGGER_OPTIONS = [
  { value: 'incident_created', label: 'Incident Created', icon: ShieldAlert },
  { value: 'inspection_completed', label: 'Inspection Completed', icon: CheckCircle2 },
  { value: 'capa_due', label: 'CAPA Due Soon', icon: Clock },
  { value: 'training_gap_identified', label: 'Training Gap Identified', icon: Brain },
  { value: 'schedule', label: 'Scheduled Time', icon: Settings },
];

const ACTION_OPTIONS = [
  { value: 'generate_report', label: 'Generate Report', icon: FileText },
  { value: 'send_notification', label: 'Send Notification', icon: Bell },
  { value: 'create_capa', label: 'Create CAPA', icon: CheckCircle2 },
  { value: 'generate_ai_summary', label: 'Generate AI Summary', icon: Brain },
  { value: 'webhook', label: 'Trigger Webhook', icon: Zap },
];

const formatTimestamp = (value?: number | null) => {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
};

const prettyJson = (value: Record<string, unknown>) => JSON.stringify(value, null, 2);

export const AutomationRuleBuilder: React.FC = () => {
  const [filter, setFilter] = useState<RuleFilter>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedRuleId, setExpandedRuleId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'incident_created',
    actionType: 'send_notification',
    triggerJson: '{\n  "severity": ["high", "critical"]\n}',
    actionJson: '{\n  "channels": ["in-app", "email"],\n  "priority": "high"\n}',
    active: true,
  });

  const { data: rulesData, loading, refetch } = useAutomationRules();
  const rules = rulesData ?? [];
  const createRule = useCreateAutomationRule();
  const updateRule = useUpdateAutomationRule();
  const deleteRule = useDeleteAutomationRule();
  const triggerRule = useTriggerAutomationRule();

  const filteredRules = useMemo(() => {
    if (filter === 'all') return rules;
    return rules.filter((rule) => (filter === 'active' ? rule.active : !rule.active));
  }, [filter, rules]);

  const stats = useMemo(() => ({
    total: rules.length,
    active: rules.filter((rule) => rule.active).length,
    inactive: rules.filter((rule) => !rule.active).length,
    executions: rules.reduce((sum, rule) => sum + (rule.executionCount ?? 0), 0),
  }), [rules]);

  const buildPayload = (): CreateAutomationRulePayload => {
    const triggerDetails = JSON.parse(formData.triggerJson || '{}') as Record<string, unknown>;
    const actionDetails = JSON.parse(formData.actionJson || '{}') as Record<string, unknown>;

    return {
      name: formData.name,
      description: formData.description || undefined,
      triggerCondition: { type: formData.triggerType, ...triggerDetails },
      action: { type: formData.actionType, ...actionDetails },
      active: formData.active,
      createdBy: 'frontend-ui',
    };
  };

  const handleCreateRule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    try {
      const created = await createRule.mutate(buildPayload());
      if (!created) {
        setFeedback(createRule.error?.message || 'Failed to create automation rule.');
        return;
      }
      setFeedback('Automation rule created successfully.');
      setShowCreateForm(false);
      setExpandedRuleId(created.id);
      setFormData({
        name: '',
        description: '',
        triggerType: 'incident_created',
        actionType: 'send_notification',
        triggerJson: '{\n  "severity": ["high", "critical"]\n}',
        actionJson: '{\n  "channels": ["in-app", "email"],\n  "priority": "high"\n}',
        active: true,
      });
      await refetch();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to create automation rule.');
    }
  };

  const handleToggleRule = async (rule: AutomationRuleRecord) => {
    const updated = await updateRule.mutate({
      id: rule.id,
      data: {
        name: rule.name,
        description: rule.description || undefined,
        triggerCondition: rule.triggerCondition,
        action: rule.action,
        active: !rule.active,
      },
    });

    if (!updated) {
      setFeedback(updateRule.error?.message || 'Failed to update automation rule.');
      return;
    }

    setFeedback(`Rule ${updated.active ? 'enabled' : 'disabled'} successfully.`);
    await refetch();
  };

  const handleTriggerRule = async (ruleId: number) => {
    const triggered = await triggerRule.mutate(ruleId);
    if (!triggered) {
      setFeedback(triggerRule.error?.message || 'Failed to trigger rule.');
      return;
    }

    setFeedback(`Rule triggered at ${new Date(triggered.triggeredAt).toLocaleString()}.`);
    await refetch();
  };

  const handleDeleteRule = async (ruleId: number) => {
    const deleted = await deleteRule.mutate(ruleId);
    if (!deleted) {
      setFeedback(deleteRule.error?.message || 'Failed to delete rule.');
      return;
    }

    setFeedback('Automation rule deleted successfully.');
    if (expandedRuleId === ruleId) setExpandedRuleId(null);
    await refetch();
  };

  return (
    <div className="page-wrapper">


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
              <Zap className="w-4 h-4" />
              Workflow Automation
            </div>
            <h1 className="page-title">Automation Rule Builder</h1>
            <p className="page-subtitle mt-3 max-w-2xl">
              Live automation rules powered by backend rule storage and trigger endpoints.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm((current) => !current)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-900 text-white font-bold shadow-button"
          >
            <Plus className="w-4 h-4" />
            Create Rule
          </button>
        </div>

        {feedback && (
          <div className={`rounded-2xl px-4 py-3 text-sm border ${feedback.toLowerCase().includes('failed') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft">
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Total Rules</div>
            <div className="text-3xl font-bold text-surface-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft">
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Active</div>
            <div className="text-3xl font-bold text-emerald-600">{stats.active}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft">
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Inactive</div>
            <div className="text-3xl font-bold text-surface-600">{stats.inactive}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft">
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Executions</div>
            <div className="text-3xl font-bold text-brand-700">{stats.executions}</div>
          </div>
        </div>

        <AnimatePresence>
          {showCreateForm && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleCreateRule}
              className="bg-white p-6 rounded-[2rem] border border-surface-100 shadow-soft space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Rule name"
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:border-brand-400"
                  required
                />
                <input
                  type="text"
                  value={formData.description}
                  onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Description"
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:border-brand-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={formData.triggerType}
                  onChange={(event) => setFormData((current) => ({ ...current, triggerType: event.target.value }))}
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:border-brand-400"
                >
                  {TRIGGER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select
                  value={formData.actionType}
                  onChange={(event) => setFormData((current) => ({ ...current, actionType: event.target.value }))}
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:border-brand-400"
                >
                  {ACTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Trigger Details JSON</label>
                  <textarea
                    value={formData.triggerJson}
                    onChange={(event) => setFormData((current) => ({ ...current, triggerJson: event.target.value }))}
                    rows={8}
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:border-brand-400 font-mono text-xs resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Action Details JSON</label>
                  <textarea
                    value={formData.actionJson}
                    onChange={(event) => setFormData((current) => ({ ...current, actionJson: event.target.value }))}
                    rows={8}
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:border-brand-400 font-mono text-xs resize-none"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-3 text-sm text-surface-600">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(event) => setFormData((current) => ({ ...current, active: event.target.checked }))}
                  className="rounded border-surface-300"
                />
                Create as active rule
              </label>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-5 py-3 rounded-xl border border-surface-200 text-surface-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRule.loading}
                  className="px-5 py-3 rounded-xl bg-brand-900 text-white font-bold disabled:opacity-60"
                >
                  {createRule.loading ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-surface-200 text-sm text-surface-500">
            <Filter className="w-4 h-4" />
            <select value={filter} onChange={(event) => setFilter(event.target.value as RuleFilter)} className="bg-transparent outline-none">
              <option value="all">All Rules</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          <button onClick={() => refetch()} className="text-[10px] font-bold text-brand-600 uppercase tracking-widest hover:text-brand-700 transition-colors flex items-center gap-1">
            Refresh <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading && <div className="text-sm text-surface-500">Loading automation rules...</div>}
          {!loading && filteredRules.length === 0 && (
            <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft text-sm text-surface-500">
              No automation rules found for the current filter.
            </div>
          )}

          {filteredRules.map((rule, index) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-surface-900">{rule.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${rule.active ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-surface-600'}`}>
                        {rule.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {rule.description && <p className="text-sm text-surface-500 mt-1">{rule.description}</p>}
                  </div>
                  <button
                    onClick={() => setExpandedRuleId(expandedRuleId === rule.id ? null : rule.id)}
                    className="px-3 py-2 rounded-xl border border-surface-200 text-xs font-bold text-surface-600"
                  >
                    {expandedRuleId === rule.id ? 'Hide' : 'Details'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                    <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Executions</div>
                    <div className="text-lg font-bold text-surface-900 mt-1">{rule.executionCount ?? 0}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                    <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Last Triggered</div>
                    <div className="text-sm font-semibold text-surface-900 mt-1">{formatTimestamp(rule.lastTriggered)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                    <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Updated</div>
                    <div className="text-sm font-semibold text-surface-900 mt-1">{formatTimestamp(rule.updatedAt)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleTriggerRule(rule.id)}
                    disabled={triggerRule.loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-bold disabled:opacity-60"
                  >
                    <Play className="w-4 h-4" />
                    Trigger
                  </button>
                  <button
                    onClick={() => handleToggleRule(rule)}
                    disabled={updateRule.loading}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${rule.active ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                  >
                    {rule.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {rule.active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    disabled={deleteRule.loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-bold disabled:opacity-60"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedRuleId === rule.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-surface-100 bg-surface-50 overflow-hidden"
                  >
                    <div className="p-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Trigger Condition</div>
                        <pre className="p-4 rounded-xl bg-white border border-surface-200 text-xs text-surface-700 overflow-auto">{prettyJson(rule.triggerCondition)}</pre>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Action</div>
                        <pre className="p-4 rounded-xl bg-white border border-surface-200 text-xs text-surface-700 overflow-auto">{prettyJson(rule.action)}</pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AutomationRuleBuilder;
