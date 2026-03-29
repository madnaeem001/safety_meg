import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Settings,
  LayoutGrid,
  BarChart3,
  Puzzle,
  Workflow,
  FileText,
  ClipboardCheck,
  Wrench,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Eye,
  Bell,
  Search,
  Plus,
  ChevronRight,
  Code2,
  Palette,
  Database,
  Globe,
  Lock,
  Users,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
  Brain,
  Gauge,
  PenLine,
  ToggleLeft,
  Cog,
  MonitorSmartphone,
  Blocks,
  Rocket,
  Terminal
} from 'lucide-react';

/* ================================================================
   SELF-ADMIN PLATFORM
   Empowers teams with self-deployment, self-administration,
   and self-configuration capabilities.
   ================================================================ */

type TabType = 'overview' | 'config' | 'insights' | 'appbuilder';

// ── MOCK DATA ────────────────────────────────────────────────────

const configModules = [
  {
    id: 'forms',
    title: 'Form Builder',
    desc: 'Drag & drop safety forms, checklists, and inspections — zero coding required.',
    icon: FileText,
    route: '/form-configurator',
    status: 'active' as const,
    itemCount: 14,
    lastEdited: '2 hours ago',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'workflows',
    title: 'Workflow Engine',
    desc: 'Automate approval chains, escalation rules, and notification triggers.',
    icon: Workflow,
    route: '/automation-rule-builder',
    status: 'active' as const,
    itemCount: 8,
    lastEdited: '1 day ago',
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'reports',
    title: 'Report Designer',
    desc: 'Build custom compliance & KPI reports with live data connections.',
    icon: BarChart3,
    route: '/custom-report-builder',
    status: 'active' as const,
    itemCount: 22,
    lastEdited: '3 hours ago',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'checklists',
    title: 'Checklist Studio',
    desc: 'Create configurable inspection checklists with scoring and photos.',
    icon: ClipboardCheck,
    route: '/checklist-builder',
    status: 'active' as const,
    itemCount: 31,
    lastEdited: '5 hours ago',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'dashboards',
    title: 'Dashboard Composer',
    desc: 'Design personalized dashboards with drag-and-drop widgets.',
    icon: LayoutGrid,
    route: '',
    status: 'active' as const,
    itemCount: 6,
    lastEdited: '1 hour ago',
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'notifications',
    title: 'Alert Manager',
    desc: 'Configure real-time alerts, escalation paths, and notification channels.',
    icon: Bell,
    route: '/notifications',
    status: 'active' as const,
    itemCount: 19,
    lastEdited: '30 min ago',
    color: 'from-cyan-500 to-blue-600',
  },
];

const realTimeMetrics = [
  { label: 'Active Hazards', value: 7, change: -2, trend: 'down' as const, severity: 'warning' as const },
  { label: 'Open CAPAs', value: 12, change: +3, trend: 'up' as const, severity: 'danger' as const },
  { label: 'Compliance Score', value: 94.2, change: +1.8, trend: 'up' as const, severity: 'success' as const, unit: '%' },
  { label: 'Near-Miss Rate', value: 0.8, change: -0.3, trend: 'down' as const, severity: 'success' as const, unit: '/1k hrs' },
  { label: 'Training Compliance', value: 97, change: +2, trend: 'up' as const, severity: 'success' as const, unit: '%' },
  { label: 'Overdue Inspections', value: 3, change: -1, trend: 'down' as const, severity: 'warning' as const },
];

const riskAlerts = [
  { id: 1, title: 'Elevated H₂S Levels — Area 4B', priority: 'critical' as const, time: '12 min ago', assigned: 'M. Garcia', status: 'active' },
  { id: 2, title: 'Scaffolding Inspection Overdue — Bldg C', priority: 'high' as const, time: '45 min ago', assigned: 'R. Chen', status: 'investigating' },
  { id: 3, title: 'PPE Non-Compliance Trend — Night Shift', priority: 'medium' as const, time: '2 hrs ago', assigned: 'S. Williams', status: 'monitoring' },
  { id: 4, title: 'Near-Miss Cluster — Loading Dock 2', priority: 'high' as const, time: '3 hrs ago', assigned: 'J. Park', status: 'active' },
  { id: 5, title: 'Fire Suppression Test Due — Warehouse A', priority: 'medium' as const, time: '4 hrs ago', assigned: 'L. Brown', status: 'scheduled' },
];

const miniApps = [
  { id: 1, name: 'PPE Kiosk Check-In', icon: Shield, status: 'deployed', users: 134, color: 'bg-blue-500' },
  { id: 2, name: 'Toolbox Talk Logger', icon: Users, status: 'deployed', users: 89, color: 'bg-green-500' },
  { id: 3, name: 'Visitor Safety Briefing', icon: Globe, status: 'testing', users: 12, color: 'bg-amber-500' },
  { id: 4, name: 'Equipment Tag-Out Scanner', icon: Wrench, status: 'deployed', users: 56, color: 'bg-purple-500' },
  { id: 5, name: 'Confined Space Permit App', icon: Lock, status: 'draft', users: 0, color: 'bg-red-500' },
];

const appTemplates = [
  { id: 'safety-checklist-app', name: 'Safety Checklist App', icon: ClipboardCheck, desc: 'Mobile-first inspection app with offline sync.', complexity: 'Starter' },
  { id: 'incident-kiosk', name: 'Incident Reporting Kiosk', icon: AlertTriangle, desc: 'Touch-screen kiosk for quick incident entry.', complexity: 'Intermediate' },
  { id: 'training-portal', name: 'Training Portal', icon: Sparkles, desc: 'Self-service training assignment and tracking.', complexity: 'Advanced' },
  { id: 'iot-monitor', name: 'IoT Sensor Monitor', icon: Activity, desc: 'Real-time sensor dashboard for field devices.', complexity: 'Advanced' },
  { id: 'permit-app', name: 'Digital Permit System', icon: FileText, desc: 'Electronic permit-to-work with approval chain.', complexity: 'Intermediate' },
  { id: 'audit-app', name: 'Field Audit App', icon: Eye, desc: 'Offline-capable audit tool with photo evidence.', complexity: 'Starter' },
];

// ── ANIMATION VARIANTS ──────────────────────────────────────────

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 140, damping: 20 } },
};

// ── HELPER COMPONENTS ───────────────────────────────────────────

const SeverityDot: React.FC<{ severity: string }> = ({ severity }) => {
  const colors: Record<string, string> = {
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[severity] ?? 'bg-gray-400'}`} />;
};

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const map: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 ring-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 ring-orange-500/30',
    medium: 'bg-amber-500/20 text-amber-300 ring-amber-500/30',
    low: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30',
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ring-1 ${map[priority] ?? ''}`}>
      {priority}
    </span>
  );
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    deployed: 'bg-emerald-500/20 text-emerald-400',
    testing: 'bg-amber-500/20 text-amber-300',
    draft: 'bg-surface-sunken text-text-muted',
    active: 'bg-blue-500/20 text-blue-400',
    investigating: 'bg-orange-500/20 text-orange-400',
    monitoring: 'bg-violet-500/20 text-violet-400',
    scheduled: 'bg-cyan-500/20 text-cyan-400',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${map[status] ?? 'bg-surface-sunken text-text-secondary'}`}>
      {status}
    </span>
  );
};

// ── TABS ─────────────────────────────────────────────────────────

const tabs: { key: TabType; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'config', label: 'Self-Configuration', icon: Cog },
  { key: 'insights', label: 'Real-Time Insights', icon: Activity },
  { key: 'appbuilder', label: 'App Builder', icon: Blocks },
];

// ── MAIN COMPONENT ──────────────────────────────────────────────

export const SelfAdminPlatform: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [search, setSearch] = useState('');

  return (
    <div className="page-wrapper">
      {/* ── HEADER ──────────────────────────────────────── */}
      <header className="sticky top-[72px] z-30 bg-surface-raised border-b border-surface-border">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="p-2 rounded-xl hover:bg-surface-sunken text-text-muted hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-text-primary leading-tight">Self-Admin Platform</h1>
                  <p className="text-[11px] text-text-muted leading-tight">Deploy · Administer · Configure</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-surface-raised border border-surface-border rounded-xl px-3 py-2 w-72">
              <Search className="w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search modules, apps, alerts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-text-primary placeholder-text-muted outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.4 }}
                className="p-2 rounded-xl hover:bg-surface-sunken text-text-muted hover:text-text-primary"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-brand-600/20"
              >
                <Plus className="w-4 h-4" />
                New Module
              </motion.button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive ? 'text-brand-400' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="selfadmin-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── CONTENT ─────────────────────────────────────── */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <OverviewSection key="overview" navigate={navigate} />}
          {activeTab === 'config' && <ConfigSection key="config" navigate={navigate} />}
          {activeTab === 'insights' && <InsightsSection key="insights" />}
          {activeTab === 'appbuilder' && <AppBuilderSection key="appbuilder" />}
        </AnimatePresence>
      </main>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════

const OverviewSection: React.FC<{ navigate: (p: string) => void }> = ({ navigate }) => (
  <motion.div key="overview" variants={stagger} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="space-y-8">
    {/* Hero */}
    <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600/20 via-violet-600/10 to-surface-900 border border-brand-500/20 p-6 sm:p-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl" />
      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="w-5 h-5 text-brand-400" />
          <span className="text-brand-400 text-sm font-semibold tracking-wide uppercase">Self-Admin Platform</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">Complete Control. Zero Dependencies.</h2>
        <p className="text-text-secondary leading-relaxed text-sm sm:text-base">
          Empower your team with self-deployment, self-administration, and self-configuration capabilities.
          Modify forms, workflows, and reports without coding — dramatically reducing costs and delays.
          Real-time insights enable proactive risk identification while custom app development ensures the platform evolves with your requirements.
        </p>
      </div>
    </motion.div>

    {/* Quick Stats */}
    <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {realTimeMetrics.map((m, i) => (
        <div key={i} className="bg-surface-raised border border-surface-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <SeverityDot severity={m.severity} />
            <span className="text-[11px] text-text-muted font-medium truncate">{m.label}</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-xl font-bold text-text-primary">{m.value}</span>
            {m.unit && <span className="text-xs text-text-muted mb-0.5">{m.unit}</span>}
          </div>
          <div className={`flex items-center gap-1 text-[11px] font-medium ${m.trend === 'up' && m.severity === 'success' ? 'text-emerald-400' : m.trend === 'down' && m.severity === 'success' ? 'text-emerald-400' : m.trend === 'up' ? 'text-red-400' : 'text-emerald-400'}`}>
            {m.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {m.change > 0 ? '+' : ''}{m.change}
          </div>
        </div>
      ))}
    </motion.div>

    {/* 3-Column Features */}
    <motion.div variants={fadeUp} className="grid md:grid-cols-3 gap-5">
      {/* Self-Configuration */}
      <div className="bg-surface-raised border border-surface-border rounded-2xl p-5 hover:border-brand-500/30 transition-colors group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
          <Cog className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-text-primary font-bold mb-2">Self-Configuration</h3>
        <p className="text-text-muted text-sm mb-4 leading-relaxed">
          Eliminate coding and third-party dependencies. Your team independently modifies forms, workflows, and reports.
        </p>
        <div className="space-y-2">
          {['Form Builder', 'Workflow Engine', 'Report Designer', 'Alert Manager'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {item}
            </div>
          ))}
        </div>
        <button onClick={() => setActiveTabGlobal?.('config')} className="mt-4 text-brand-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Configure Now <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Real-Time Insights */}
      <div className="bg-surface-raised border border-surface-border rounded-2xl p-5 hover:border-emerald-500/30 transition-colors group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-text-primary font-bold mb-2">Real-Time Insights</h3>
        <p className="text-text-muted text-sm mb-4 leading-relaxed">
          Proactive risk identification with live sensor data, AI predictions, and instant compliance alerts.
        </p>
        <div className="space-y-2">
          {['Live Risk Dashboard', 'AI-Powered Predictions', 'Compliance Alerts', 'Trend Analytics'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {item}
            </div>
          ))}
        </div>
        <button className="mt-4 text-emerald-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          View Insights <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Custom App Builder */}
      <div className="bg-surface-raised border border-surface-border rounded-2xl p-5 hover:border-violet-500/30 transition-colors group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
          <Blocks className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-text-primary font-bold mb-2">Custom App Builder</h3>
        <p className="text-text-muted text-sm mb-4 leading-relaxed">
          Build purpose-built safety apps from templates. Deploy to any device with your branding.
        </p>
        <div className="space-y-2">
          {['App Templates', 'Drag & Drop Builder', 'Offline Capable', 'Multi-Device Deploy'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {item}
            </div>
          ))}
        </div>
        <button className="mt-4 text-violet-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Build Apps <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>

    {/* Recent Activity */}
    <motion.div variants={fadeUp} className="bg-surface-raised border border-surface-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
        <h3 className="text-text-primary font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Live Risk Alerts
        </h3>
        <button className="text-sm text-brand-400 hover:text-brand-300 font-medium">View All</button>
      </div>
      <div className="divide-y divide-surface-border">
        {riskAlerts.map((alert) => (
          <div key={alert.id} className="px-5 py-3 flex items-center gap-4 hover:bg-surface-sunken transition-colors cursor-pointer">
            <div className={`w-2 h-2 rounded-full shrink-0 ${alert.priority === 'critical' ? 'bg-red-500 animate-pulse' : alert.priority === 'high' ? 'bg-orange-500' : 'bg-amber-400'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary font-medium truncate">{alert.title}</p>
              <p className="text-xs text-text-muted">Assigned to {alert.assigned} · {alert.time}</p>
            </div>
            <PriorityBadge priority={alert.priority} />
            <StatusPill status={alert.status} />
          </div>
        ))}
      </div>
    </motion.div>
  </motion.div>
);

// We don't have a global setter in Overview — the buttons there are illustrative
let setActiveTabGlobal: ((t: TabType) => void) | undefined;

// ═══════════════════════════════════════════════════════════════
//  SELF-CONFIGURATION TAB
// ═══════════════════════════════════════════════════════════════

const ConfigSection: React.FC<{ navigate: (p: string) => void }> = ({ navigate }) => (
  <motion.div key="config" variants={stagger} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="space-y-6">
    {/* Header */}
    <motion.div variants={fadeUp}>
      <h2 className="text-xl font-bold text-text-primary mb-1">Self-Configuration Tools</h2>
      <p className="text-text-muted text-sm">Eliminate coding or third-party dependencies — your team owns every configuration.</p>
    </motion.div>

    {/* Module Grid */}
    <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {configModules.map((mod) => {
        const Icon = mod.icon;
        return (
          <motion.div
            key={mod.id}
            variants={scaleIn}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => mod.route && navigate(mod.route)}
            className="group bg-surface-raised border border-surface-border rounded-2xl p-5 cursor-pointer hover:border-brand-500/30 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <StatusPill status={mod.status} />
            </div>
            <h3 className="text-text-primary font-bold mb-1">{mod.title}</h3>
            <p className="text-text-muted text-sm leading-relaxed mb-4">{mod.desc}</p>
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>{mod.itemCount} items</span>
              <span>Edited {mod.lastEdited}</span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>

    {/* Permissions Info */}
    <motion.div variants={fadeUp} className="bg-surface-raised border border-surface-border rounded-2xl p-5">
      <h3 className="text-text-primary font-bold mb-3 flex items-center gap-2">
        <Lock className="w-4 h-4 text-amber-400" />
        Configuration Access Control
      </h3>
      <p className="text-text-muted text-sm mb-4">Manage who can create, modify, and publish configurations across your organization.</p>
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { role: 'Admin', perms: 'Full access to all config tools', count: 3, color: 'border-red-500/30 bg-red-500/5' },
          { role: 'Safety Manager', perms: 'Create & publish forms, workflows', count: 8, color: 'border-amber-500/30 bg-amber-500/5' },
          { role: 'Supervisor', perms: 'View & use published configs', count: 24, color: 'border-blue-500/30 bg-blue-500/5' },
        ].map((r) => (
          <div key={r.role} className={`border rounded-xl p-4 ${r.color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-primary font-semibold text-sm">{r.role}</span>
              <span className="text-text-muted text-xs">{r.count} users</span>
            </div>
            <p className="text-text-muted text-xs">{r.perms}</p>
          </div>
        ))}
      </div>
    </motion.div>

    {/* Deployment Pipeline */}
    <motion.div variants={fadeUp} className="bg-surface-raised border border-surface-border rounded-2xl p-5">
      <h3 className="text-text-primary font-bold mb-4 flex items-center gap-2">
        <Rocket className="w-4 h-4 text-brand-400" />
        Self-Deployment Pipeline
      </h3>
      <div className="flex flex-wrap gap-3">
        {[
          { step: 1, label: 'Draft', desc: 'Build & configure', icon: PenLine, color: 'border-surface-border' },
          { step: 2, label: 'Review', desc: 'Internal QA check', icon: Eye, color: 'border-amber-500/40' },
          { step: 3, label: 'Approve', desc: 'Manager sign-off', icon: CheckCircle2, color: 'border-blue-500/40' },
          { step: 4, label: 'Deploy', desc: 'Push to production', icon: Rocket, color: 'border-emerald-500/40' },
          { step: 5, label: 'Monitor', desc: 'Track adoption', icon: Gauge, color: 'border-violet-500/40' },
        ].map((s, i) => {
          const SIcon = s.icon;
          return (
            <React.Fragment key={s.step}>
              <div className={`flex-1 min-w-[130px] border ${s.color} rounded-xl p-3 bg-surface-sunken`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-text-muted">STEP {s.step}</span>
                </div>
                <div className="flex items-center gap-2">
                  <SIcon className="w-4 h-4 text-text-secondary" />
                  <span className="text-text-primary text-sm font-semibold">{s.label}</span>
                </div>
                <p className="text-text-muted text-xs mt-1">{s.desc}</p>
              </div>
              {i < 4 && <div className="hidden lg:flex items-center text-text-muted"><ChevronRight className="w-4 h-4" /></div>}
            </React.Fragment>
          );
        })}
      </div>
    </motion.div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════
//  REAL-TIME INSIGHTS TAB
// ═══════════════════════════════════════════════════════════════

const InsightsSection: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  return (
    <motion.div key="insights" variants={stagger} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">Real-Time Insights</h2>
          <p className="text-text-muted text-sm">Proactive risk management and compliance monitoring — live data, zero lag.</p>
        </div>
        <div className="flex bg-surface-raised border border-surface-border rounded-xl p-1">
          {(['1h', '24h', '7d', '30d'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timeRange === t ? 'bg-brand-600 text-white' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Live KPIs */}
      <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {realTimeMetrics.map((m, i) => (
          <motion.div
            key={i}
            variants={scaleIn}
            className="bg-surface-raised border border-surface-border rounded-xl p-4 hover:border-surface-border transition-colors"
          >
            <span className="text-[11px] text-text-muted font-medium">{m.label}</span>
            <div className="flex items-end gap-1 mt-1">
              <span className="text-2xl font-bold text-text-primary">{m.value}</span>
              {m.unit && <span className="text-xs text-text-muted mb-1">{m.unit}</span>}
            </div>
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
              (m.trend === 'down' && (m.severity === 'warning' || m.severity === 'success')) || (m.trend === 'up' && m.severity === 'success')
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}>
              {m.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {m.change > 0 ? '+' : ''}{m.change} vs prev
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Risk Heat & Alerts Split */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Risk Heatmap Placeholder */}
        <motion.div variants={fadeUp} className="lg:col-span-3 bg-surface-raised border border-surface-border rounded-2xl p-5">
          <h3 className="text-text-primary font-bold mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            AI Risk Prediction Matrix
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 25 }, (_, i) => {
              const risk = Math.random();
              const color = risk > 0.8 ? 'bg-red-500/60' : risk > 0.6 ? 'bg-orange-500/50' : risk > 0.4 ? 'bg-amber-500/40' : risk > 0.2 ? 'bg-yellow-500/20' : 'bg-emerald-500/20';
              return (
                <div key={i} className={`aspect-square rounded-lg ${color} flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-white/20 transition-all`}>
                  <span className="text-[9px] text-white/60 font-mono">{(risk * 100).toFixed(0)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-text-muted">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500/20" /> Low</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-500/40" /> Med</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-500/50" /> High</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500/60" /> Critical</div>
          </div>
        </motion.div>

        {/* Compliance Pulse */}
        <motion.div variants={fadeUp} className="lg:col-span-2 bg-surface-raised border border-surface-border rounded-2xl p-5">
          <h3 className="text-text-primary font-bold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Compliance Pulse
          </h3>
          <div className="space-y-4">
            {[
              { label: 'ISO 45001', score: 96, color: 'bg-emerald-500' },
              { label: 'OSHA 1910', score: 91, color: 'bg-blue-500' },
              { label: 'NFPA 70E', score: 88, color: 'bg-amber-500' },
              { label: 'GHS/SDS', score: 94, color: 'bg-violet-500' },
              { label: 'ISO 14001', score: 87, color: 'bg-teal-500' },
            ].map((c) => (
              <div key={c.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-secondary">{c.label}</span>
                  <span className="text-sm font-bold text-text-primary">{c.score}%</span>
                </div>
                <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.score}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    className={`h-full ${c.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Live Alerts */}
      <motion.div variants={fadeUp} className="bg-surface-raised border border-surface-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-text-primary font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Active Risk Alerts
            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{riskAlerts.length} active</span>
          </h3>
          <button className="text-sm text-brand-400 hover:text-brand-300 font-medium">Manage Alerts</button>
        </div>
        <div className="divide-y divide-surface-border">
          {riskAlerts.map((alert) => (
            <div key={alert.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-surface-sunken transition-colors cursor-pointer group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                alert.priority === 'critical' ? 'bg-red-500/20' : alert.priority === 'high' ? 'bg-orange-500/20' : 'bg-amber-500/20'
              }`}>
                <AlertTriangle className={`w-4 h-4 ${
                  alert.priority === 'critical' ? 'text-red-400' : alert.priority === 'high' ? 'text-orange-400' : 'text-amber-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary font-medium truncate">{alert.title}</p>
                <p className="text-xs text-text-muted">{alert.assigned} · {alert.time}</p>
              </div>
              <PriorityBadge priority={alert.priority} />
              <StatusPill status={alert.status} />
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-muted transition-colors" />
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  APP BUILDER TAB
// ═══════════════════════════════════════════════════════════════

const AppBuilderSection: React.FC = () => {
  const [view, setView] = useState<'apps' | 'templates'>('apps');

  return (
    <motion.div key="appbuilder" variants={stagger} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">Custom App Builder</h2>
          <p className="text-text-muted text-sm">Build, deploy, and manage purpose-built safety apps — no developers needed.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-raised border border-surface-border rounded-xl p-1">
            <button
              onClick={() => setView('apps')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'apps' ? 'bg-brand-600 text-white' : 'text-text-muted hover:text-text-primary'}`}
            >
              My Apps
            </button>
            <button
              onClick={() => setView('templates')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'templates' ? 'bg-brand-600 text-white' : 'text-text-muted hover:text-text-primary'}`}
            >
              Templates
            </button>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/app-builder')}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New App
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {view === 'apps' ? (
          <motion.div key="my-apps" variants={stagger} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="space-y-5">
            {/* My Apps Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {miniApps.map((app) => {
                const Icon = app.icon;
                return (
                  <motion.div
                    key={app.id}
                    variants={scaleIn}
                    whileHover={{ y: -3 }}
                    className="bg-surface-raised border border-surface-border rounded-2xl p-5 cursor-pointer hover:border-brand-500/30 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl ${app.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <StatusPill status={app.status} />
                    </div>
                    <h3 className="text-text-primary font-bold text-sm mb-1">{app.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Users className="w-3 h-3" />
                      {app.users} active users
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface-border">
                      <button className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
                        <PenLine className="w-3 h-3" /> Edit
                      </button>
                      <button className="text-xs text-text-muted hover:text-text-primary font-medium flex items-center gap-1">
                        <MonitorSmartphone className="w-3 h-3" /> Preview
                      </button>
                      <button className="text-xs text-text-muted hover:text-text-primary font-medium flex items-center gap-1 ml-auto">
                        <Settings className="w-3 h-3" /> Settings
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {/* Add New App Card */}
              <motion.div
                variants={scaleIn}
                onClick={() => navigate('/app-builder')}
                className="bg-surface-sunken border-2 border-dashed border-surface-border rounded-2xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-brand-500/40 hover:bg-surface-sunken transition-all min-h-[180px]"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-sunken flex items-center justify-center">
                  <Plus className="w-6 h-6 text-text-muted" />
                </div>
                <span className="text-text-muted text-sm font-medium">Create New App</span>
              </motion.div>
            </div>

            {/* Deployment Stats */}
            <motion.div variants={fadeUp} className="bg-surface-raised border border-surface-border rounded-2xl p-5">
              <h3 className="text-text-primary font-bold mb-4 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                Deployment Overview
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Apps', value: miniApps.length, icon: Blocks, color: 'text-brand-400' },
                  { label: 'Deployed', value: miniApps.filter(a => a.status === 'deployed').length, icon: Rocket, color: 'text-emerald-400' },
                  { label: 'In Testing', value: miniApps.filter(a => a.status === 'testing').length, icon: Terminal, color: 'text-amber-400' },
                  { label: 'Active Users', value: miniApps.reduce((sum, a) => sum + a.users, 0), icon: Users, color: 'text-cyan-400' },
                ].map((stat) => {
                  const SIcon = stat.icon;
                  return (
                    <div key={stat.label} className="text-center p-3 bg-surface-sunken rounded-xl">
                      <SIcon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                      <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
                      <div className="text-xs text-text-muted mt-1">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="templates" variants={stagger} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {appTemplates.map((tmpl) => {
                const Icon = tmpl.icon;
                return (
                  <motion.div
                    key={tmpl.id}
                    variants={scaleIn}
                    whileHover={{ y: -3 }}
                    className="bg-surface-raised border border-surface-border rounded-2xl p-5 cursor-pointer hover:border-brand-500/30 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-sunken flex items-center justify-center group-hover:bg-brand-600/20 transition-colors">
                        <Icon className="w-5 h-5 text-text-secondary group-hover:text-brand-400 transition-colors" />
                      </div>
                      <span className="text-[10px] font-semibold text-text-muted uppercase bg-surface-sunken px-2 py-0.5 rounded-full">
                        {tmpl.complexity}
                      </span>
                    </div>
                    <h3 className="text-text-primary font-bold text-sm mb-1">{tmpl.name}</h3>
                    <p className="text-text-muted text-xs leading-relaxed mb-4">{tmpl.desc}</p>
                    <button 
                      onClick={() => navigate('/app-builder')}
                      className="text-brand-400 text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                    >
                      Use Template <ChevronRight className="w-3 h-3" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SelfAdminPlatform;
