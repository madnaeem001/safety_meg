import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Bell, Send, CheckCircle, AlertTriangle, Users, Settings,
  Plus, X, Clock, FileText, Shield, Trash2, Edit2, Save, User,
  Building2, Zap, ChevronDown, Info
} from 'lucide-react';

// Email notification types
type NotificationType = 'immediate' | 'daily' | 'weekly';
type IncidentSeverity = 'all' | 'critical' | 'high' | 'medium' | 'low';

interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: 'new_incident' | 'status_change' | 'severity' | 'overdue' | 'custom';
  severity: IncidentSeverity;
  notificationType: NotificationType;
  recipients: string[];
  departments: string[];
  includeDetails: boolean;
  createdAt: string;
}

interface EmailRecipient {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  notifyOn: ('critical' | 'high' | 'medium' | 'low')[];
}

// Mock notification rules
const mockRules: NotificationRule[] = [
  {
    id: 'RULE-001',
    name: 'Critical Incident Alert',
    enabled: true,
    triggerType: 'severity',
    severity: 'critical',
    notificationType: 'immediate',
    recipients: ['safety.manager@company.com', 'ceo@company.com', 'legal@company.com'],
    departments: ['All Departments'],
    includeDetails: true,
    createdAt: '2025-12-01'
  },
  {
    id: 'RULE-002',
    name: 'Daily Incident Summary',
    enabled: true,
    triggerType: 'new_incident',
    severity: 'all',
    notificationType: 'daily',
    recipients: ['safety.team@company.com', 'hr@company.com'],
    departments: ['All Departments'],
    includeDetails: false,
    createdAt: '2025-12-01'
  },
  {
    id: 'RULE-003',
    name: 'Overdue CAPA Reminder',
    enabled: true,
    triggerType: 'overdue',
    severity: 'all',
    notificationType: 'immediate',
    recipients: ['compliance@company.com', 'safety.manager@company.com'],
    departments: ['Manufacturing', 'Operations'],
    includeDetails: true,
    createdAt: '2025-12-15'
  },
  {
    id: 'RULE-004',
    name: 'Weekly Safety Report',
    enabled: false,
    triggerType: 'custom',
    severity: 'all',
    notificationType: 'weekly',
    recipients: ['executives@company.com'],
    departments: ['All Departments'],
    includeDetails: true,
    createdAt: '2026-01-01'
  }
];

// Mock recipients
const mockRecipients: EmailRecipient[] = [
  { id: 'REC-001', name: 'Robert Henderson', email: 'r.henderson@company.com', role: 'Safety Manager', department: 'EHS', notifyOn: ['critical', 'high'] },
  { id: 'REC-002', name: 'Sarah Connor', email: 's.connor@company.com', role: 'EHS Director', department: 'EHS', notifyOn: ['critical', 'high', 'medium'] },
  { id: 'REC-003', name: 'Mike Ross', email: 'm.ross@company.com', role: 'Compliance Officer', department: 'Legal', notifyOn: ['critical'] },
  { id: 'REC-004', name: 'Jane Smith', email: 'j.smith@company.com', role: 'Operations Manager', department: 'Operations', notifyOn: ['critical', 'high', 'medium', 'low'] },
  { id: 'REC-005', name: 'Tom Anderson', email: 't.anderson@company.com', role: 'HR Director', department: 'Human Resources', notifyOn: ['critical', 'high'] },
];

// Notification log for sent emails
interface NotificationLog {
  id: string;
  ruleName: string;
  sentAt: string;
  recipients: number;
  incidentId: string;
  status: 'sent' | 'failed' | 'pending';
}

const mockNotificationLog: NotificationLog[] = [
  { id: 'LOG-001', ruleName: 'Critical Incident Alert', sentAt: '2026-01-25 14:30', recipients: 3, incidentId: 'CHEM-2026-020', status: 'sent' },
  { id: 'LOG-002', ruleName: 'Daily Incident Summary', sentAt: '2026-01-25 08:00', recipients: 2, incidentId: 'Multiple', status: 'sent' },
  { id: 'LOG-003', ruleName: 'Overdue CAPA Reminder', sentAt: '2026-01-24 16:00', recipients: 2, incidentId: 'INJ-2026-004', status: 'sent' },
  { id: 'LOG-004', ruleName: 'Critical Incident Alert', sentAt: '2026-01-19 11:15', recipients: 3, incidentId: 'ELEC-2026-024', status: 'sent' },
];

interface EmailNotificationProps {
  onSendTestEmail?: (rule: NotificationRule) => void;
}

export const EmailNotification: React.FC<EmailNotificationProps> = ({
  onSendTestEmail
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'recipients' | 'log'>('rules');
  const [rules, setRules] = useState<NotificationRule[]>(mockRules);
  const [recipients, setRecipients] = useState<EmailRecipient[]>(mockRecipients);
  const [showAddRule, setShowAddRule] = useState(false);
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [testEmailSent, setTestEmailSent] = useState<string | null>(null);

  // New rule form state
  const [newRule, setNewRule] = useState<Partial<NotificationRule>>({
    name: '',
    enabled: true,
    triggerType: 'new_incident',
    severity: 'all',
    notificationType: 'immediate',
    recipients: [],
    departments: ['All Departments'],
    includeDetails: true
  });

  // New recipient form state
  const [newRecipient, setNewRecipient] = useState<Partial<EmailRecipient>>({
    name: '',
    email: '',
    role: '',
    department: '',
    notifyOn: ['critical', 'high']
  });

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
  };

  const handleSendTestEmail = (rule: NotificationRule) => {
    if (onSendTestEmail) {
      onSendTestEmail(rule);
    }
    setTestEmailSent(rule.id);
    setTimeout(() => setTestEmailSent(null), 3000);
  };

  const addNewRule = () => {
    if (!newRule.name) return;
    const rule: NotificationRule = {
      id: `RULE-${String(rules.length + 1).padStart(3, '0')}`,
      name: newRule.name || '',
      enabled: newRule.enabled ?? true,
      triggerType: newRule.triggerType || 'new_incident',
      severity: newRule.severity || 'all',
      notificationType: newRule.notificationType || 'immediate',
      recipients: newRule.recipients || [],
      departments: newRule.departments || ['All Departments'],
      includeDetails: newRule.includeDetails ?? true,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setRules([...rules, rule]);
    setShowAddRule(false);
    setNewRule({
      name: '',
      enabled: true,
      triggerType: 'new_incident',
      severity: 'all',
      notificationType: 'immediate',
      recipients: [],
      departments: ['All Departments'],
      includeDetails: true
    });
  };

  const addNewRecipient = () => {
    if (!newRecipient.name || !newRecipient.email) return;
    const recipient: EmailRecipient = {
      id: `REC-${String(recipients.length + 1).padStart(3, '0')}`,
      name: newRecipient.name || '',
      email: newRecipient.email || '',
      role: newRecipient.role || '',
      department: newRecipient.department || '',
      notifyOn: newRecipient.notifyOn || ['critical', 'high']
    };
    setRecipients([...recipients, recipient]);
    setShowAddRecipient(false);
    setNewRecipient({
      name: '',
      email: '',
      role: '',
      department: '',
      notifyOn: ['critical', 'high']
    });
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'new_incident': return 'New Incident';
      case 'status_change': return 'Status Change';
      case 'severity': return 'Severity Level';
      case 'overdue': return 'Overdue Items';
      case 'custom': return 'Scheduled Report';
      default: return type;
    }
  };

  const getNotificationTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'immediate': return <Zap className="w-4 h-4 text-red-500" />;
      case 'daily': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'weekly': return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-brand-500" />
            Email Notifications
          </h2>
          <p className="text-sm text-surface-500">Configure automated email alerts for incidents</p>
        </div>
        
        <div className="flex gap-2">
          {activeTab === 'rules' && (
            <button
              onClick={() => setShowAddRule(true)}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Rule
            </button>
          )}
          {activeTab === 'recipients' && (
            <button
              onClick={() => setShowAddRecipient(true)}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Recipient
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white rounded-2xl p-2 border border-surface-100 shadow-soft">
        {[
          { id: 'rules', label: 'Notification Rules', icon: Settings, count: rules.filter(r => r.enabled).length },
          { id: 'recipients', label: 'Recipients', icon: Users, count: recipients.length },
          { id: 'log', label: 'Notification Log', icon: FileText, count: mockNotificationLog.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'rules' | 'recipients' | 'log')}
            className={`flex-1 px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'bg-brand-500 text-white'
                : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === tab.id ? 'bg-white/20' : 'bg-surface-200'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {rules.map(rule => (
            <motion.div
              key={rule.id}
              layout
              className={`bg-white rounded-2xl border ${rule.enabled ? 'border-brand-200' : 'border-surface-100'} shadow-soft overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`mt-1 w-12 h-6 rounded-full transition-colors relative ${
                        rule.enabled ? 'bg-brand-500' : 'bg-surface-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        rule.enabled ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                    <div>
                      <h3 className="font-bold text-surface-800">{rule.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-surface-500">
                        {getNotificationTypeIcon(rule.notificationType)}
                        <span className="capitalize">{rule.notificationType}</span>
                        <span>•</span>
                        <span>{getTriggerTypeLabel(rule.triggerType)}</span>
                        {rule.severity !== 'all' && (
                          <>
                            <span>•</span>
                            <span className={`capitalize font-medium ${
                              rule.severity === 'critical' ? 'text-red-600' :
                              rule.severity === 'high' ? 'text-orange-600' :
                              'text-amber-600'
                            }`}>
                              {rule.severity} only
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Mail className="w-3 h-3 text-surface-400" />
                        <span className="text-xs text-surface-400">
                          {rule.recipients.length} recipient{rule.recipients.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendTestEmail(rule)}
                      disabled={testEmailSent === rule.id}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        testEmailSent === rule.id
                          ? 'bg-green-100 text-green-700'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                    >
                      {testEmailSent === rule.id ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Sent!
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Test
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {rules.length === 0 && (
            <div className="text-center py-12 bg-surface-50 rounded-2xl">
              <Bell className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500">No notification rules configured</p>
              <button
                onClick={() => setShowAddRule(true)}
                className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
              >
                Create First Rule
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recipients Tab */}
      {activeTab === 'recipients' && (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr>
                  <th className="text-left p-3 font-bold text-surface-600">Name</th>
                  <th className="text-left p-3 font-bold text-surface-600">Email</th>
                  <th className="text-left p-3 font-bold text-surface-600">Role</th>
                  <th className="text-left p-3 font-bold text-surface-600">Department</th>
                  <th className="text-left p-3 font-bold text-surface-600">Notify On</th>
                  <th className="text-center p-3 font-bold text-surface-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((recipient, index) => (
                  <tr key={recipient.id} className={index % 2 === 0 ? 'bg-white' : 'bg-surface-50'}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-brand-600" />
                        </div>
                        <span className="font-medium">{recipient.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-surface-600">{recipient.email}</td>
                    <td className="p-3 text-surface-600">{recipient.role}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-surface-100 rounded-full text-xs font-medium">
                        {recipient.department}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {recipient.notifyOn.map(level => (
                          <span
                            key={level}
                            className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                              level === 'critical' ? 'bg-red-100 text-red-700' :
                              level === 'high' ? 'bg-orange-100 text-orange-700' :
                              level === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}
                          >
                            {level}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button className="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Tab */}
      {activeTab === 'log' && (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden">
          <div className="p-4 border-b border-surface-100 bg-surface-50">
            <h3 className="font-bold text-surface-800">Recent Notifications</h3>
            <p className="text-sm text-surface-500">History of sent email notifications</p>
          </div>
          <div className="divide-y divide-surface-100">
            {mockNotificationLog.map(log => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-surface-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    log.status === 'sent' ? 'bg-green-100' :
                    log.status === 'failed' ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    {log.status === 'sent' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : log.status === 'failed' ? (
                      <X className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-surface-800">{log.ruleName}</p>
                    <p className="text-sm text-surface-500">
                      Incident: {log.incidentId} • {log.recipients} recipient{log.recipients !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-surface-600">{log.sentAt}</p>
                  <span className={`text-xs font-bold uppercase ${
                    log.status === 'sent' ? 'text-green-600' :
                    log.status === 'failed' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      <AnimatePresence>
        {showAddRule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddRule(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-surface-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-brand-900">Add Notification Rule</h3>
                <button
                  onClick={() => setShowAddRule(false)}
                  className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-surface-600 mb-1">Rule Name</label>
                  <input
                    type="text"
                    value={newRule.name || ''}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="e.g., Critical Incident Alert"
                    className="w-full px-4 py-2 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-surface-600 mb-1">Trigger Type</label>
                  <select
                    value={newRule.triggerType}
                    onChange={(e) => setNewRule({ ...newRule, triggerType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="new_incident">New Incident Created</option>
                    <option value="status_change">Status Change</option>
                    <option value="severity">Severity Level</option>
                    <option value="overdue">Overdue Items</option>
                    <option value="custom">Scheduled Report</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-surface-600 mb-1">Severity Filter</label>
                    <select
                      value={newRule.severity}
                      onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as IncidentSeverity })}
                      className="w-full px-4 py-2 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical Only</option>
                      <option value="high">High & Above</option>
                      <option value="medium">Medium & Above</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-surface-600 mb-1">Frequency</label>
                    <select
                      value={newRule.notificationType}
                      onChange={(e) => setNewRule({ ...newRule, notificationType: e.target.value as NotificationType })}
                      className="w-full px-4 py-2 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="daily">Daily Digest</option>
                      <option value="weekly">Weekly Summary</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-surface-600 mb-1">Recipients (comma-separated emails)</label>
                  <input
                    type="text"
                    value={newRule.recipients?.join(', ') || ''}
                    onChange={(e) => setNewRule({ ...newRule, recipients: e.target.value.split(',').map(s => s.trim()) })}
                    placeholder="safety@company.com, manager@company.com"
                    className="w-full px-4 py-2 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="includeDetails"
                    checked={newRule.includeDetails}
                    onChange={(e) => setNewRule({ ...newRule, includeDetails: e.target.checked })}
                    className="w-5 h-5 rounded border-surface-300"
                  />
                  <label htmlFor="includeDetails" className="text-sm text-surface-600">
                    Include full incident details in email
                  </label>
                </div>
              </div>

              <div className="p-4 border-t border-surface-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddRule(false)}
                  className="px-4 py-2 text-surface-600 hover:bg-surface-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewRule}
                  disabled={!newRule.name}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Rule
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Recipient Modal */}
      <AnimatePresence>
        {showAddRecipient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddRecipient(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-surface-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-brand-900">Add Recipient</h3>
                <button
                  onClick={() => setShowAddRecipient(false)}
                  className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-surface-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={newRecipient.name || ''}
                      onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-surface-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={newRecipient.email || ''}
                      onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                      placeholder="john@company.com"
                      className="w-full px-4 py-2 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-surface-600 mb-1">Role</label>
                    <input
                      type="text"
                      value={newRecipient.role || ''}
                      onChange={(e) => setNewRecipient({ ...newRecipient, role: e.target.value })}
                      placeholder="Safety Manager"
                      className="w-full px-4 py-2 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-surface-600 mb-1">Department</label>
                    <input
                      type="text"
                      value={newRecipient.department || ''}
                      onChange={(e) => setNewRecipient({ ...newRecipient, department: e.target.value })}
                      placeholder="EHS"
                      className="w-full px-4 py-2 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-surface-600 mb-2">Notify On Severity</label>
                  <div className="flex gap-2">
                    {(['critical', 'high', 'medium', 'low'] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => {
                          const current = newRecipient.notifyOn || [];
                          const updated = current.includes(level)
                            ? current.filter(l => l !== level)
                            : [...current, level];
                          setNewRecipient({ ...newRecipient, notifyOn: updated });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold uppercase transition-colors ${
                          newRecipient.notifyOn?.includes(level)
                            ? level === 'critical' ? 'bg-red-500 text-white' :
                              level === 'high' ? 'bg-orange-500 text-white' :
                              level === 'medium' ? 'bg-amber-500 text-white' :
                              'bg-green-500 text-white'
                            : 'bg-surface-100 text-surface-500'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-surface-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddRecipient(false)}
                  className="px-4 py-2 text-surface-600 hover:bg-surface-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewRecipient}
                  disabled={!newRecipient.name || !newRecipient.email}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Add Recipient
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmailNotification;
