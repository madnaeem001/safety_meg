import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Send, Clock, CheckCircle2, AlertCircle, Users, FileText,
  Zap, Settings, Eye, BarChart3, Edit3, Plus, Trash2, Copy,
  Bell, UserPlus, ShieldCheck, Calendar, Target, TrendingUp,
  ChevronRight, Play, Pause, RefreshCw
} from 'lucide-react';
import {
  useEmailNotificationStats,
  useEmailTemplates,
  useAutomationWorkflows,
  useCreateEmailCampaign,
} from '../api/hooks/useAPIHooks';

// Icon lookup for templates (backend stores icon name as string)
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  UserPlus, Eye, BarChart3, ShieldCheck, AlertCircle, RefreshCw, Calendar, FileText, Mail, Send,
};

const MOCK_EMAIL_TEMPLATES = [
  { 
    id: 1, name: 'Welcome Email', category: 'Onboarding', status: 'active',
    subject: 'Welcome to SafetyMEG — Your Safety Command Center',
    openRate: 68.4, clickRate: 32.1, sentCount: 1420,
    description: 'Sent immediately after user signup. Introduces key features and first steps.',
    icon: UserPlus, color: 'cyan'
  },
  {
    id: 2, name: 'Onboarding Day 3', category: 'Onboarding', status: 'active',
    subject: 'Have you tried AI Visual Audits yet?',
    openRate: 54.2, clickRate: 24.8, sentCount: 1180,
    description: 'Nudge users toward key activation features on day 3.',
    icon: Eye, color: 'purple'
  },
  {
    id: 3, name: 'Weekly Safety Digest', category: 'Engagement', status: 'active',
    subject: 'Your Weekly Safety Report — 3 New Insights',
    openRate: 45.6, clickRate: 18.3, sentCount: 4200,
    description: 'Weekly summary of incidents, compliance status, and AI predictions.',
    icon: BarChart3, color: 'blue'
  },
  {
    id: 4, name: 'Compliance Deadline', category: 'Alerts', status: 'active',
    subject: '⚠️ OSHA Audit Due in 7 Days — Action Required',
    openRate: 78.9, clickRate: 45.2, sentCount: 340,
    description: 'Automated alert triggered by upcoming compliance deadlines.',
    icon: ShieldCheck, color: 'amber'
  },
  {
    id: 5, name: 'Incident Alert', category: 'Alerts', status: 'active',
    subject: '🚨 Critical Incident Reported — Immediate Review',
    openRate: 92.1, clickRate: 67.4, sentCount: 86,
    description: 'Real-time notification when critical incidents are filed.',
    icon: AlertCircle, color: 'red'
  },
  {
    id: 6, name: 'Re-engagement', category: 'Retention', status: 'active',
    subject: 'We miss you! Here\'s what\'s new in SafetyMEG',
    openRate: 38.7, clickRate: 15.2, sentCount: 620,
    description: 'Sent to users inactive for 14+ days with feature updates.',
    icon: RefreshCw, color: 'emerald'
  },
  {
    id: 7, name: 'Training Reminder', category: 'Training', status: 'active',
    subject: 'Certification Expiring — Complete Your Safety Training',
    openRate: 62.3, clickRate: 38.9, sentCount: 290,
    description: 'Automated reminder for expiring certifications.',
    icon: Calendar, color: 'violet'
  },
  {
    id: 8, name: 'Monthly Report', category: 'Reports', status: 'paused',
    subject: 'January 2026 — Your Monthly Safety Performance Report',
    openRate: 51.8, clickRate: 22.4, sentCount: 1100,
    description: 'Comprehensive monthly summary of safety metrics and KPIs.',
    icon: FileText, color: 'indigo'
  },
];

const MOCK_AUTOMATION_WORKFLOWS = [
  { name: 'New User Welcome Sequence', trigger: 'User signs up', emails: 5, status: 'active', deliveryRate: 99.2 },
  { name: 'Onboarding Drip Campaign', trigger: 'First login', emails: 7, status: 'active', deliveryRate: 98.8 },
  { name: 'Compliance Alert Pipeline', trigger: 'Deadline approaching', emails: 3, status: 'active', deliveryRate: 99.5 },
  { name: 'Incident Escalation Chain', trigger: 'Critical incident', emails: 4, status: 'active', deliveryRate: 99.9 },
  { name: 'Win-Back Campaign', trigger: 'Inactive 30 days', emails: 4, status: 'testing', deliveryRate: 97.6 },
  { name: 'Training Renewal Series', trigger: 'Cert expires in 30d', emails: 3, status: 'active', deliveryRate: 98.4 },
];

const MOCK_EMAIL_STATS = [
  { label: 'Emails Sent (30d)', value: '12,480', change: '+18.2%', icon: Send, color: 'cyan' },
  { label: 'Avg Open Rate', value: '61.4%', change: '+4.8%', icon: Eye, color: 'emerald' },
  { label: 'Avg Click Rate', value: '28.7%', change: '+3.1%', icon: Target, color: 'purple' },
  { label: 'Delivery Rate', value: '99.2%', change: '+0.1%', icon: CheckCircle2, color: 'green' },
  { label: 'Active Workflows', value: '5', change: '+1', icon: Zap, color: 'amber' },
  { label: 'Subscriber Count', value: '1,420', change: '+142', icon: Users, color: 'blue' },
];

const tabs = ['Dashboard', 'Templates', 'Automations', 'Campaign Builder'];

export const EmailNotificationSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [campaignName, setCampaignName] = useState('');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignSegment, setCampaignSegment] = useState('All Users');
  const [campaignBody, setCampaignBody] = useState('');

  // Live data hooks
  const { data: statsData } = useEmailNotificationStats();
  const { data: templatesData } = useEmailTemplates();
  const { data: workflowsData } = useAutomationWorkflows();
  const createCampaign = useCreateEmailCampaign();

  // Map live template data to display shape, falling back to mock
  const allTemplates = templatesData
    ? templatesData.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        status: t.status,
        subject: t.subject,
        description: t.description,
        icon: ICON_MAP[t.iconName] ?? Mail,
        color: t.color,
        openRate: t.openRate,
        clickRate: t.clickRate,
        sentCount: t.sentCount,
      }))
    : MOCK_EMAIL_TEMPLATES;

  const automationWorkflows = workflowsData
    ? workflowsData.map(w => ({
        name: w.name,
        trigger: w.triggerEvent,
        emails: w.emailsCount,
        status: w.status,
        deliveryRate: w.deliveryRate,
      }))
    : MOCK_AUTOMATION_WORKFLOWS;

  // Build stats array from live data with mock fallback
  const emailStats = [
    { label: 'Emails Sent (30d)', value: statsData ? statsData.sentCount30d.toLocaleString() : MOCK_EMAIL_STATS[0].value, change: MOCK_EMAIL_STATS[0].change, icon: Send, color: 'cyan' },
    { label: 'Avg Open Rate',     value: statsData?.avgOpenRate ?? MOCK_EMAIL_STATS[1].value,   change: MOCK_EMAIL_STATS[1].change, icon: Eye,          color: 'emerald' },
    { label: 'Avg Click Rate',    value: statsData?.avgClickRate ?? MOCK_EMAIL_STATS[2].value,  change: MOCK_EMAIL_STATS[2].change, icon: Target,        color: 'purple' },
    { label: 'Delivery Rate',     value: statsData?.deliveryRate ?? MOCK_EMAIL_STATS[3].value,  change: MOCK_EMAIL_STATS[3].change, icon: CheckCircle2,  color: 'green' },
    { label: 'Active Workflows',  value: statsData ? String(statsData.activeWorkflows) : MOCK_EMAIL_STATS[4].value, change: MOCK_EMAIL_STATS[4].change, icon: Zap, color: 'amber' },
    { label: 'Subscriber Count',  value: statsData ? statsData.subscriberCount.toLocaleString() : MOCK_EMAIL_STATS[5].value, change: MOCK_EMAIL_STATS[5].change, icon: Users, color: 'blue' },
  ];

  const categories = ['All', 'Onboarding', 'Engagement', 'Alerts', 'Retention', 'Training', 'Reports'];
  const filteredTemplates = selectedCategory === 'All' ? allTemplates : allTemplates.filter(t => t.category === selectedCategory);

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    cyan:    { bg: 'bg-accent/10',   text: 'text-accent',   border: 'border-accent/20'   },
    purple:  { bg: 'bg-ai/10',       text: 'text-ai',       border: 'border-ai/20'       },
    blue:    { bg: 'bg-accent/10',   text: 'text-accent',   border: 'border-accent/20'   },
    amber:   { bg: 'bg-warning/10',  text: 'text-warning',  border: 'border-warning/20'  },
    red:     { bg: 'bg-danger/10',   text: 'text-danger',   border: 'border-danger/20'   },
    emerald: { bg: 'bg-success/10',  text: 'text-success',  border: 'border-success/20'  },
    violet:  { bg: 'bg-ai/10',       text: 'text-ai',       border: 'border-ai/20'       },
    indigo:  { bg: 'bg-accent/10',   text: 'text-accent',   border: 'border-accent/20'   },
    green:   { bg: 'bg-success/10',  text: 'text-success',  border: 'border-success/20'  },
  };

  return (
    <div className="page-wrapper">

      <main className="relative z-10 max-w-7xl mx-auto pt-8 md:pt-12 px-5 md:px-8 lg:px-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-accent" />
            <span className="text-[13px] font-bold text-accent uppercase tracking-[0.3em] font-display">Communications</span>
          </div>
          <h1 className="page-title">Email Notification System</h1>
          <p className="text-text-muted text-sm mt-2">Automated email campaigns, alerts, and transactional messaging</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-surface-sunken text-text-muted border border-surface-border hover:border-accent/20'
              }`}>{tab}</button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'Dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {emailStats.map((stat, i) => {
                const c = colorMap[stat.color] || colorMap.cyan;
                return (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`p-4 rounded-2xl bg-surface-raised backdrop-blur-xl border ${c.border} hover:scale-[1.02] transition-all`}>
                    <div className={`p-2 rounded-lg w-fit mb-3 ${c.bg}`}>
                      <stat.icon className={`w-4 h-4 ${c.text}`} />
                    </div>
                    <p className="text-xl font-black text-text-primary">{stat.value}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mt-0.5">{stat.label}</p>
                    <span className="text-[10px] font-bold text-success mt-1 inline-flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {stat.change}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="bg-surface-raised backdrop-blur-xl rounded-2xl border border-accent/15 overflow-hidden">
              <div className="p-5 border-b border-accent/10">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" /> Recent Email Activity
                </h3>
              </div>
              <div className="divide-y divide-surface-border/50">
                {[
                  { time: '2m ago', event: 'Incident Alert sent to Zone B supervisors', type: 'alert', count: 4 },
                  { time: '15m ago', event: 'Welcome email delivered to new user', type: 'onboarding', count: 1 },
                  { time: '1h ago', event: 'Weekly Safety Digest campaign completed', type: 'campaign', count: 1420 },
                  { time: '3h ago', event: 'Compliance deadline reminder sent', type: 'alert', count: 12 },
                  { time: '6h ago', event: 'Training renewal reminders dispatched', type: 'training', count: 34 },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                    className="flex items-center justify-between p-4 hover:bg-surface-overlay transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.type === 'alert' ? 'bg-danger' : item.type === 'onboarding' ? 'bg-accent' : item.type === 'campaign' ? 'bg-ai' : 'bg-success'}`} />
                      <div>
                        <p className="text-xs text-text-secondary font-medium">{item.event}</p>
                        <p className="text-[10px] text-text-muted">{item.time} · {item.count} recipient{item.count > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Templates Tab */}
        {activeTab === 'Templates' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    selectedCategory === cat ? 'bg-ai/20 text-ai border border-ai/30' : 'bg-surface-sunken text-text-muted border border-surface-border hover:text-text-secondary'
                  }`}>{cat}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((tmpl, i) => {
                const c = colorMap[tmpl.color] || colorMap.cyan;
                return (
                  <motion.div key={tmpl.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className={`p-5 rounded-2xl bg-surface-raised backdrop-blur-xl border ${c.border} hover:scale-[1.01] transition-all group`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${c.bg}`}>
                          <tmpl.icon className={`w-5 h-5 ${c.text}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">{tmpl.name}</p>
                          <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">{tmpl.category}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                        tmpl.status === 'active' ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'
                      }`}>{tmpl.status}</span>
                    </div>
                    <p className="text-xs text-text-secondary mb-3 line-clamp-1">Subject: {tmpl.subject}</p>
                    <p className="text-[11px] text-text-muted mb-4">{tmpl.description}</p>
                    <div className="flex items-center gap-4 text-[10px] font-bold">
                      <span className="text-accent">{tmpl.openRate}% open</span>
                      <span className="text-ai">{tmpl.clickRate}% click</span>
                      <span className="text-text-muted">{tmpl.sentCount.toLocaleString()} sent</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Automations Tab */}
        {activeTab === 'Automations' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-surface-raised backdrop-blur-xl rounded-2xl border border-ai/15 overflow-hidden">
            <div className="p-5 border-b border-ai/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Zap className="w-4 h-4 text-ai" /> Email Automation Workflows
              </h3>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ai/10 text-ai text-[11px] font-bold border border-ai/20 hover:bg-ai/20 transition-all">
                <Plus className="w-3 h-3" /> New Workflow
              </button>
            </div>
            <div className="divide-y divide-surface-border/50">
              {automationWorkflows.map((wf, i) => (
                <motion.div key={wf.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between p-5 hover:bg-surface-overlay transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-ai/10">
                      <Zap className="w-4 h-4 text-ai" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{wf.name}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">Trigger: {wf.trigger} · {wf.emails} emails in sequence</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-text-muted">{wf.deliveryRate}%</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                      wf.status === 'active' ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'
                    }`}>{wf.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Campaign Builder Tab */}
        {activeTab === 'Campaign Builder' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-surface-raised backdrop-blur-xl rounded-2xl border border-accent/15 p-6">
              <h3 className="text-sm font-bold text-text-primary mb-6 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-accent" /> Create New Campaign
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="text-xs text-text-muted font-bold uppercase tracking-wider mb-2 block">Campaign Name</label>
                  <input type="text" placeholder="e.g., February Safety Update" value={campaignName} onChange={e => setCampaignName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-surface-sunken border border-surface-border text-text-primary text-sm placeholder:text-text-muted focus:border-accent/40 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-text-muted font-bold uppercase tracking-wider mb-2 block">Subject Line</label>
                  <input type="text" placeholder="Your compelling subject line..." value={campaignSubject} onChange={e => setCampaignSubject(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-surface-sunken border border-surface-border text-text-primary text-sm placeholder:text-text-muted focus:border-accent/40 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-text-muted font-bold uppercase tracking-wider mb-2 block">Audience Segment</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['All Users', 'Active Users', 'At-Risk Users', 'Admins Only'].map(seg => (
                      <button key={seg} onClick={() => setCampaignSegment(seg)} className={`px-3 py-2.5 rounded-xl bg-surface-sunken border border-surface-border text-xs font-medium transition-all ${campaignSegment === seg ? 'border-accent/30 text-accent' : 'text-text-muted hover:border-accent/30 hover:text-accent'}`}>{seg}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted font-bold uppercase tracking-wider mb-2 block">Email Body</label>
                  <textarea rows={6} placeholder="Write your email content here... Supports markdown formatting." value={campaignBody} onChange={e => setCampaignBody(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-surface-sunken border border-surface-border text-text-primary text-sm placeholder:text-text-muted focus:border-accent/40 focus:outline-none transition-colors resize-none" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-text-onAccent text-sm font-bold shadow-lg shadow-accent/25 hover:bg-accent/80 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!campaignName.trim() || !campaignSubject.trim() || createCampaign.loading}
                    onClick={() => {
                      if (!campaignName.trim() || !campaignSubject.trim()) return;
                      createCampaign.mutate({
                        name: campaignName.trim(),
                        subject: campaignSubject.trim(),
                        audienceSegment: campaignSegment,
                        body: campaignBody.trim(),
                        status: 'sent',
                      });
                      setCampaignName('');
                      setCampaignSubject('');
                      setCampaignBody('');
                    }}
                  >
                    <Send className="w-4 h-4" /> {createCampaign.loading ? 'Sending...' : 'Send Campaign'}
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-sunken border border-surface-border text-text-muted text-sm font-medium hover:text-text-primary transition-all">
                    <Clock className="w-4 h-4" /> Schedule
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

    </div>
  );
};

export default EmailNotificationSystem;
