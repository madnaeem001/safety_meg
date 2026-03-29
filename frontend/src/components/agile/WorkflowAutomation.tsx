import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Bell, CheckCircle, AlertTriangle, Clock, Settings, 
  Plus, Trash2, Play, Pause, Mail, MessageSquare, 
  Users, FileText, AlertCircle as AlertCircleIcon, Calendar,
  ChevronRight, ToggleLeft, ToggleRight, RefreshCw
} from 'lucide-react';
import {
  useAutomationRules,
  useUpdateAutomationRule,
  useDeleteAutomationRule,
  useAutomationEvents,
} from '../../api/hooks/useAPIHooks';
import type { AutomationRuleRecord, NotificationEventRecord } from '../../api/services/apiService';

// Automation Types
export type TriggerType = 
  | 'hazard_reported' 
  | 'incident_created' 
  | 'training_due' 
  | 'inspection_scheduled'
  | 'audit_failed'
  | 'permit_expired'
  | 'sensor_alert'
  | 'compliance_deadline';

export type ActionType = 
  | 'send_email'
  | 'send_sms'
  | 'create_task'
  | 'assign_user'
  | 'update_status'
  | 'generate_report'
  | 'notify_manager'
  | 'escalate';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: TriggerType;
    conditions: { field: string; operator: string; value: string }[];
  };
  actions: {
    type: ActionType;
    config: Record<string, string>;
  }[];
  enabled: boolean;
  lastTriggered?: string;
  triggerCount: number;
  createdAt: string;
  createdBy: string;
}

export interface NotificationEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerType: TriggerType;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  details: string;
  recipient?: string;
}

const triggerConfig: Record<TriggerType, { label: string; icon: typeof Bell; color: string }> = {
  hazard_reported: { label: 'Hazard Reported', icon: AlertTriangle, color: 'red' },
  incident_created: { label: 'Incident Created', icon: AlertCircleIcon, color: 'orange' },
  training_due: { label: 'Training Due', icon: Calendar, color: 'blue' },
  inspection_scheduled: { label: 'Inspection Scheduled', icon: CheckCircle, color: 'emerald' },
  audit_failed: { label: 'Audit Failed', icon: AlertTriangle, color: 'red' },
  permit_expired: { label: 'Permit Expired', icon: Clock, color: 'amber' },
  sensor_alert: { label: 'Sensor Alert', icon: Zap, color: 'purple' },
  compliance_deadline: { label: 'Compliance Deadline', icon: Calendar, color: 'indigo' },
};

const actionConfig: Record<ActionType, { label: string; icon: typeof Bell }> = {
  send_email: { label: 'Send Email', icon: Mail },
  send_sms: { label: 'Send SMS', icon: MessageSquare },
  create_task: { label: 'Create Task', icon: FileText },
  assign_user: { label: 'Assign User', icon: Users },
  update_status: { label: 'Update Status', icon: RefreshCw },
  generate_report: { label: 'Generate Report', icon: FileText },
  notify_manager: { label: 'Notify Manager', icon: Bell },
  escalate: { label: 'Escalate', icon: AlertTriangle },
};

// Adapters: convert backend records → component types
function mapToRule(r: AutomationRuleRecord): AutomationRule {
  const tc = r.triggerCondition as any;
  const ac = r.action as any;
  return {
    id: String(r.id),
    name: r.name,
    description: r.description ?? '',
    trigger: {
      type: (tc?.type ?? 'hazard_reported') as TriggerType,
      conditions: Array.isArray(tc?.conditions) ? tc.conditions : [],
    },
    actions: Array.isArray(ac?.actions)
      ? ac.actions
      : ac?.type
        ? [{ type: ac.type, config: ac.config ?? {} }]
        : [],
    enabled: r.active,
    lastTriggered: r.lastTriggered ? new Date(r.lastTriggered).toISOString() : undefined,
    triggerCount: r.executionCount ?? 0,
    createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    createdBy: r.createdBy ?? 'System',
  };
}

function mapToEvent(e: NotificationEventRecord): NotificationEvent {
  return {
    id: String(e.id),
    ruleId: String(e.ruleId),
    ruleName: e.ruleName,
    triggerType: (e.triggerType as TriggerType) in triggerConfig
      ? (e.triggerType as TriggerType)
      : 'hazard_reported',
    timestamp: new Date(e.createdAt).toISOString(),
    status: e.status,
    details: e.details ?? '',
    recipient: e.recipient ?? undefined,
  };
}

export function WorkflowAutomation() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [view, setView] = useState<'rules' | 'history' | 'create'>('rules');
  const [isCreating, setIsCreating] = useState(false);

  const { data: apiRulesData, refetch: refetchRules } = useAutomationRules();
  const { data: apiEventsData, refetch: refetchEvents } = useAutomationEvents({ limit: 50 });
  const { mutate: updateRule } = useUpdateAutomationRule();
  const { mutate: deleteRule } = useDeleteAutomationRule();

  // Sync rules from API
  useEffect(() => {
    if (apiRulesData) {
      setRules(apiRulesData.map(mapToRule));
    }
  }, [apiRulesData]);

  // Sync events from API
  useEffect(() => {
    if (apiEventsData) {
      setEvents(apiEventsData.map(mapToEvent));
    }
  }, [apiEventsData]);

  // Periodic refresh (every 30s) to pick up background automation activity
  useEffect(() => {
    const interval = setInterval(() => {
      refetchRules();
      refetchEvents();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchRules, refetchEvents]);

  const handleToggleRule = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    const nextEnabled = !rule.enabled;
    // Optimistic update
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: nextEnabled } : r));
    if (selectedRule?.id === ruleId) setSelectedRule(prev => prev ? { ...prev, enabled: nextEnabled } : null);
    updateRule({ id: Number(ruleId), data: { active: nextEnabled } });
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
    if (selectedRule?.id === ruleId) setSelectedRule(null);
    deleteRule(Number(ruleId));
  };

  const stats = {
    totalRules: rules.length,
    activeRules: rules.filter(r => r.enabled).length,
    totalTriggers: rules.reduce((sum, r) => sum + r.triggerCount, 0),
    recentEvents: events.filter(e => new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-warning/10 rounded-lg">
            <Zap className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary text-text-primary">Workflow Automation</h2>
            <p className="text-sm text-text-muted">Automate notifications and actions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-surface-sunken rounded-lg p-1">
            {[
              { id: 'rules', label: 'Rules', icon: Settings },
              { id: 'history', label: 'History', icon: Clock },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id as 'rules' | 'history')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  view === id
                    ? 'bg-surface-raised text-text-primary text-text-primary shadow-sm'
                    : 'text-text-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            New Rule
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Rules', value: stats.totalRules, icon: Settings, color: 'gray' },
          { label: 'Active Rules', value: stats.activeRules, icon: Play, color: 'emerald' },
          { label: 'Total Triggers', value: stats.totalTriggers, icon: Zap, color: 'amber' },
          { label: 'Last 24h', value: stats.recentEvents, icon: Clock, color: 'blue' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-raised rounded-xl border border-surface-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">{stat.label}</span>
              <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
            </div>
            <p className="text-2xl font-bold text-text-primary text-text-primary mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {view === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rules List */}
          <div className="lg:col-span-2 space-y-4">
            {rules.map(rule => {
              const trigger = triggerConfig[rule.trigger.type];
              const TriggerIcon = trigger.icon;

              return (
                <motion.div
                  key={rule.id}
                  layout
                  onClick={() => setSelectedRule(rule)}
                  className={`bg-surface-raised rounded-xl border p-4 cursor-pointer transition-all ${
                    selectedRule?.id === rule.id
                      ? 'border-amber-500 ring-1 ring-amber-500'
                      : 'border-surface-border hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-surface-sunken`}>
                        <TriggerIcon className={`w-5 h-5 text-text-secondary`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary text-text-primary">{rule.name}</h4>
                        <p className="text-sm text-text-muted">{rule.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {rule.triggerCount} triggers
                          </span>
                          {rule.lastTriggered && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last: {new Date(rule.lastTriggered).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRule(rule.id);
                        }}
                        className={`p-1 rounded ${rule.enabled ? 'text-success' : 'text-text-muted'}`}
                      >
                        {rule.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                      </button>
                    </div>
                  </div>

                  {/* Actions Preview */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-text-muted">Actions:</span>
                    {rule.actions.slice(0, 3).map((action, idx) => {
                      const ActionIcon = actionConfig[action.type].icon;
                      return (
                        <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-surface-sunken rounded text-xs">
                          <ActionIcon className="w-3 h-3" />
                          {actionConfig[action.type].label}
                        </div>
                      );
                    })}
                    {rule.actions.length > 3 && (
                      <span className="text-xs text-text-muted">+{rule.actions.length - 3} more</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Rule Details */}
          <div className="bg-surface-raised rounded-xl border border-surface-border p-4 h-fit sticky top-4">
            {selectedRule ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-text-primary text-text-primary">Rule Details</h3>
                  <button
                    onClick={() => handleDeleteRule(selectedRule.id)}
                    className="p-1.5 text-text-muted hover:text-red-500 rounded hover:bg-danger/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Trigger */}
                  <div>
                    <span className="text-xs font-medium text-text-muted uppercase">Trigger</span>
                    <div className={`mt-1 p-3 rounded-lg bg-surface-sunken`}>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const TIcon = triggerConfig[selectedRule.trigger.type].icon;
                          return <TIcon className={`w-4 h-4 text-${triggerConfig[selectedRule.trigger.type].color}-600`} />;
                        })()}
                        <span className="font-medium text-text-primary text-text-primary">
                          {triggerConfig[selectedRule.trigger.type].label}
                        </span>
                      </div>
                      {selectedRule.trigger.conditions.length > 0 && (
                        <div className="mt-2 text-sm text-text-secondary">
                          {selectedRule.trigger.conditions.map((cond, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <span className="text-xs bg-surface-sunken px-1.5 py-0.5 rounded">
                                {cond.field} {cond.operator} {cond.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <span className="text-xs font-medium text-text-muted uppercase">Actions</span>
                    <div className="mt-1 space-y-2">
                      {selectedRule.actions.map((action, idx) => {
                        const ActionIcon = actionConfig[action.type].icon;
                        return (
                          <div key={idx} className="p-3 bg-surface-sunken rounded-lg">
                            <div className="flex items-center gap-2">
                              <ActionIcon className="w-4 h-4 text-text-secondary" />
                              <span className="font-medium text-sm text-text-primary text-text-primary">
                                {actionConfig[action.type].label}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-text-muted">
                              {Object.entries(action.config).map(([key, value]) => (
                                <span key={key} className="mr-2">{key}: {value}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="pt-3 border-t border-surface-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Created</span>
                      <span className="text-text-primary text-text-primary">{selectedRule.createdAt}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-text-muted">Total Triggers</span>
                      <span className="font-medium text-warning">{selectedRule.triggerCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-text-muted">
                <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select a rule to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="bg-surface-raised rounded-xl border border-surface-border overflow-hidden">
          <div className="p-4 border-b border-surface-border">
            <h3 className="font-semibold text-text-primary text-text-primary">Automation History</h3>
            <p className="text-sm text-text-muted">Recent automated actions and notifications</p>
          </div>
          <div className="divide-y divide-surface-border">
            {events.map(event => {
              const trigger = triggerConfig[event.triggerType];
              const TriggerIcon = trigger.icon;

              return (
                <div key={event.id} className="p-4 hover:bg-surface-sunken">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg bg-surface-sunken`}>
                      <TriggerIcon className={`w-4 h-4 text-text-secondary`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary text-text-primary">{event.ruleName}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          event.status === 'success' 
                            ? 'bg-success/10 text-success'
                            : 'bg-danger/10 text-danger'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{event.details}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                        {event.recipient && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.recipient}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
