import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IncidentList } from '../components/dashboard/IncidentList';
import { SafetyChecklist } from '../components/dashboard/SafetyChecklist';
import { GamificationStats } from '../components/dashboard/GamificationStats';
import { KPIDashboard } from '../components/dashboard/KPICharts';
import { DashboardSkeleton } from '../components/dashboard/Skeleton';
import { Incident, ChecklistItem } from '../components/dashboard/types';
import { Brain, ArrowRight, Sparkles, ShieldCheck, AlertCircle, CalendarDays, Book, Activity, ClipboardCheck, Shield, AlertTriangle, ShieldAlert, FileSearch, Globe, Clock, TrendingUp, Zap, GraduationCap, Car, Heart, ChevronRight, Scale, Bot, Beaker, LayoutGrid, FileCheck, Moon, Sun, Monitor, Kanban, FileText, Webhook, Link, XCircle, Eye, Wifi, Server, Cpu, Signal, Radio, Database, Cloud, Lock, BarChart3, Flame, KeyRound, Thermometer, Layers, Fingerprint, Siren, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import FadeContent from '../components/animations/FadeContent';
import BlurText from '../components/animations/BlurText';
import { useTheme } from '../components/ThemeProvider';
import { SMCard, SMCardBody, SMCardFooter, SMCardHeader, SMSkeleton, SMStatCard, SMStatusDot } from '../components/ui';
import { ComplianceAlerts } from '../components/dashboard/ComplianceAlerts';
import { FeatureGrid } from '../components/dashboard/FeatureGrid';
import { SafetyAutoPilot } from '../components/safety/SafetyAutoPilot';
import { useDashboardOverview, useDashboardLiveStats } from '../api/hooks/useAPIHooks';
import type { BackendIncidentRecord, DashboardFunnelStage, DashboardSystemHealth, DashboardAIEngine, DashboardLiveEvent, DashboardBusinessMetric } from '../api/services/apiService';
import type { RiskForecast } from '../services/aiService';

const MOCK_INCIDENTS: Incident[] = [
  {
    id: '1',
    title: 'Spill in Chemical Storage',
    location: 'Warehouse B, Zone 4',
    severity: 'High',
    status: 'Open',
    date: '2026-01-04 09:30 AM'
  },
  {
    id: '2',
    title: 'Broken Guardrail',
    location: 'Loading Dock 2',
    severity: 'Medium',
    status: 'In Progress',
    date: '2026-01-03 02:15 PM'
  },
  {
    id: '3',
    title: 'Fire Extinguisher Inspection Due',
    location: 'Main Office Hallway',
    severity: 'Low',
    status: 'Resolved',
    date: '2026-01-02 11:00 AM'
  }
];

const MOCK_CHECKLIST: ChecklistItem[] = [
  { id: '1', text: 'Inspect personal protective equipment (PPE)', completed: true },
  { id: '2', text: 'Check emergency exits for obstructions', completed: false },
  { id: '3', text: 'Verify fire extinguisher pressure gauges', completed: false },
  { id: '4', text: 'Inspect machinery guards', completed: true },
  { id: '5', text: 'Ensure spill kits are fully stocked', completed: false },
];

const formatIncidentDate = (incident: BackendIncidentRecord) => {
  const rawValue = incident.createdAt ?? `${incident.incidentDate}T${incident.incidentTime}`;
  const parsedDate = typeof rawValue === 'number' ? new Date(rawValue) : new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return `${incident.incidentDate} ${incident.incidentTime}`;
  }

  return parsedDate.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const mapDashboardIncident = (incident: BackendIncidentRecord): Incident => ({
  id: String(incident.id),
  title: incident.incidentType || 'Incident',
  location: incident.location,
  severity: incident.severity,
  status:
    incident.status === 'closed'
      ? 'Resolved'
      : incident.status === 'open'
        ? 'Open'
        : 'In Progress',
  date: formatIncidentDate(incident),
});

// Animation variants for orchestrated reveals
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.12
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 48, scale: 0.97 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

// Icon map for AI Platform engines (icon name string → Lucide component)
const AI_ENGINE_ICON_MAP: Record<string, React.ElementType> = {
  Eye, Brain, Shield, TrendingUp, Bot, Cpu, UserCheck, Thermometer,
};

function MessageSquareIcon({ className }: { className?: string }) {
  return <Bot className={className} />;
}

// Fallback EHS metrics shown when backend is unavailable
const FALLBACK_BUSINESS_METRICS: DashboardBusinessMetric[] = [
  { label: 'Training Rate', value: '94.7%', change: '+2.1%', trend: 'up', icon: 'GraduationCap', color: 'cyan', subtext: 'Worker training compliance' },
  { label: 'CAPA Rate', value: '87.3%', change: '+5.6%', trend: 'up', icon: 'ClipboardCheck', color: 'emerald', subtext: 'Corrective Action Resolution' },
  { label: 'Incident Rate', value: '7', change: '-14.2%', trend: 'down', icon: 'AlertTriangle', color: 'amber', subtext: 'Incidents this month' },
  { label: 'ESG Metrics', value: '312', change: '+8.9%', trend: 'up', icon: 'Leaf', color: 'purple', subtext: 'Sustainability records' },
];

// Fallback conversion funnel shown when backend is unavailable
const FALLBACK_FUNNEL_STAGES: DashboardFunnelStage[] = [
  { stage: 'Total Workers', value: 1240, pct: 100, color: 'from-cyan-500 to-cyan-400' },
  { stage: 'Registered Users', value: 1185, pct: 96, color: 'from-blue-500 to-blue-400' },
  { stage: 'Active Users', value: 1043, pct: 84, color: 'from-purple-500 to-purple-400' },
  { stage: 'Training Enrolled', value: 918, pct: 74, color: 'from-violet-500 to-violet-400' },
  { stage: 'Training Completed', value: 864, pct: 70, color: 'from-emerald-500 to-emerald-400' },
];

// Fallback system health shown when backend is unavailable
const FALLBACK_HEALTH_SERVICES: DashboardSystemHealth[] = [
  { name: 'API Gateway', status: 'healthy', uptime: '99.98%', latency: '18ms', icon: 'Server' },
  { name: 'Database', status: 'healthy', uptime: '99.95%', latency: '4ms', icon: 'Database' },
  { name: 'AI Processing', status: 'healthy', uptime: '99.91%', latency: '22ms', icon: 'Brain' },
  { name: 'CDN / Edge', status: 'healthy', uptime: '100%', latency: '9ms', icon: 'Cloud' },
  { name: 'Auth Service', status: 'healthy', uptime: '99.99%', latency: '11ms', icon: 'Lock' },
  { name: 'IoT Ingestion', status: 'degraded', uptime: '97.3%', latency: '64ms', icon: 'Cpu' },
];

// Icon map for system health (icon name string → Lucide component)
const HEALTH_ICON_MAP: Record<string, React.ElementType> = {
  Server, Database, Brain, Cloud, Lock, Cpu,
};

// Business Metric Icon map (icon name string → Lucide component)
const BUSINESS_ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap, ClipboardCheck, AlertTriangle, Leaf: Globe, BarChart3, TrendingUp, Zap, Activity,
};

// Business Metric Card
const BusinessMetricCard: React.FC<{ metric: DashboardBusinessMetric; index: number }> = ({ metric, index }) => {
  const colorMap: Record<string, { border: string; bg: string; text: string; glow: string }> = {
    cyan: { border: 'border-cyan-500/20', bg: 'bg-cyan-500/10', text: 'text-cyan-400', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.1)]' },
    emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]' },
    purple: { border: 'border-purple-500/20', bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.1)]' },
    amber: { border: 'border-amber-500/20', bg: 'bg-amber-500/10', text: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.1)]' },
  };
  const c = colorMap[metric.color] || colorMap.cyan;
  const isPositive = metric.trend === 'up';
  const IconComponent = BUSINESS_ICON_MAP[metric.icon] ?? ShieldCheck;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`relative overflow-hidden p-5 rounded-2xl bg-surface-raised backdrop-blur-xl border border-surface-border ${c.glow} group hover:scale-[1.02] transition-all duration-300`}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent animate-scan-line" />
      </div>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${c.bg}`}>
          <IconComponent className={`w-5 h-5 ${c.text}`} />
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${
          isPositive ? 'text-emerald-400 bg-emerald-500/10' : metric.trend === 'neutral' ? 'text-text-muted bg-surface-sunken' : 'text-red-400 bg-red-500/10'
        }`}>
          <TrendingUp className={`w-3 h-3 ${metric.trend === 'down' ? 'rotate-180' : ''}`} /> {metric.change}
        </span>
      </div>
      <p className="text-2xl font-black text-text-primary tracking-tight mb-0.5 font-display">{metric.value}</p>
      <p className="text-[10px] text-text-muted font-medium">{metric.subtext}</p>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent ${c.text.replace('text-', 'via-')}/30 to-transparent`} />
    </motion.div>
  );
};

// Conversion Funnel Widget
const ConversionFunnel: React.FC<{ stages?: DashboardFunnelStage[] }> = ({ stages }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.2 }}
    className="bg-surface-raised backdrop-blur-xl rounded-2xl border border-surface-border overflow-hidden"
  >
    <div className="p-5 border-b border-surface-border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary">Workforce Funnel</h3>
          <p className="text-[10px] text-purple-400/60 font-mono uppercase tracking-wider">Real-time</p>
        </div>
      </div>
      {stages?.length ? (
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
          {stages[stages.length - 1]?.value} trained
        </span>
      ) : (
        <span className="text-[10px] font-bold text-text-muted bg-surface-sunken px-2 py-1 rounded-lg">Loading…</span>
      )}
    </div>
    <div className="p-5 space-y-3">
      {stages?.length ? stages.map((stage, i) => (
        <motion.div
          key={stage.stage}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.08 }}
          className="space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">{stage.stage}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-primary">{stage.value.toLocaleString()}</span>
              <span className="text-[10px] text-text-muted font-mono">{stage.pct}%</span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-sunken overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stage.pct}%` }}
              transition={{ duration: 1, delay: 0.5 + i * 0.15 }}
              className={`h-full rounded-full bg-gradient-to-r ${stage.color}`}
            />
          </div>
        </motion.div>
      )) : (
        // Loading skeleton
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-3 w-32 rounded bg-surface-sunken animate-pulse" />
              <div className="h-3 w-14 rounded bg-surface-sunken animate-pulse" />
            </div>
            <div className="w-full h-2 rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full bg-surface-border animate-pulse"
                style={{ width: `${85 - i * 10}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  </motion.div>
);

// System Health Monitor
const SystemHealthMonitor: React.FC<{
  services?: DashboardSystemHealth[];
  summary?: { healthyCount: number; degradedCount: number; total: number };
}> = ({ services, summary }) => {
  const healthyCount = summary?.healthyCount ?? services?.filter(s => s.status === 'healthy').length ?? 0;
  const degradedCount = summary?.degradedCount ?? (services ? services.filter(s => s.status !== 'healthy').length : 0);
  const totalCount = summary?.total ?? services?.length ?? 0;
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.35 }}
    className=""
  >
    <SMCard className="overflow-hidden rounded-2xl">
      <SMCardHeader action={<SMStatusDot variant="active" label="Live" pulse size="sm" />}>System Health</SMCardHeader>
      <SMCardBody className="space-y-2">
        {services?.length ? services.map((svc, i) => {
          const SvcIcon = HEALTH_ICON_MAP[svc.icon] ?? Server;
          return (
            <motion.div
              key={svc.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-3 rounded-xl bg-surface-sunken px-3 py-3"
            >
              <SvcIcon className="h-4 w-4 shrink-0 text-text-muted" />
              <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{svc.name}</span>
              <span className="text-xs font-mono text-text-muted">{svc.latency}</span>
              <span className="text-xs font-mono text-text-muted">{svc.uptime}</span>
              <SMStatusDot variant={svc.status === 'healthy' ? 'success' : 'warning'} size="sm" pulse={svc.status !== 'healthy'} />
            </motion.div>
          );
        }) : Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-surface-sunken px-3 py-3">
            <SMSkeleton className="h-4 w-4 rounded-full" />
            <SMSkeleton className="h-4 flex-1 rounded-md" />
            <SMSkeleton className="h-3 w-10 rounded-md" />
            <SMSkeleton className="h-3 w-12 rounded-md" />
            <SMSkeleton className="h-2 w-2 rounded-full" />
          </div>
        ))}
      </SMCardBody>
      <SMCardFooter align="between">
        <span className="text-[10px] font-mono text-text-muted">{totalCount} SERVICES MONITORED</span>
        <span className="text-[10px] font-mono text-text-muted">{healthyCount} HEALTHY{degradedCount > 0 ? ` • ${degradedCount} DEGRADED` : ''}</span>
      </SMCardFooter>
    </SMCard>
  </motion.div>
  );
};

// Fallback system metrics shown when backend is unavailable
const FALLBACK_SYSTEM_METRICS = [
  { label: 'Active Sensors', value: '142', change: '+3.1%', icon: Signal, color: 'cyan' },
  { label: 'AI Predictions', value: '2,847', change: '+12.4%', icon: Brain, color: 'purple' },
  { label: 'Compliance Rate', value: '96.3%', change: '+1.2%', icon: ShieldCheck, color: 'green' },
  { label: 'Threats Blocked', value: '38', change: '-8.5%', icon: Lock, color: 'red' },
];

const QuickActionCard: React.FC<{ icon: any; title: string; subtitle: string; onClick: () => void }> = ({ icon: Icon, title, subtitle, onClick }) => (
  <motion.button
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex flex-col items-start p-5 rounded-2xl bg-surface-raised backdrop-blur-sm border border-surface-border hover:border-cyan-500/30 shadow-soft hover:shadow-glow transition-all text-left group"
  >
    <div className="p-3 rounded-xl bg-cyan-500/10 mb-4 group-hover:bg-cyan-500/20 transition-colors">
      <Icon className="w-6 h-6 text-cyan-400" />
    </div>
    <h3 className="font-bold text-text-primary text-sm mb-1">{title}</h3>
    <p className="text-xs text-text-muted">{subtitle}</p>
  </motion.button>
);

// Futuristic Stat Card
const FuturisticStatCard: React.FC<{ label: string; value: string; change: string; icon: any; color: string; delay?: number }> = ({ label, value, change, icon: Icon, color, delay = 0 }) => {
  const variantMap: Record<string, 'default' | 'accent' | 'success' | 'danger'> = {
    cyan: 'default',
    purple: 'accent',
    green: 'success',
    red: 'danger',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="transition-all duration-300 hover:scale-[1.02]"
    >
      <SMStatCard
        label={label}
        value={value}
        change={change}
        trend="up"
        icon={<Icon className="h-5 w-5" />}
        variant={variantMap[color] ?? 'default'}
      />
    </motion.div>
  );
};

// AI Platform Sync Widget
const AIPlatformSync: React.FC<{ platforms?: DashboardAIEngine[]; summary?: { onlineCount: number; total: number } }> = ({ platforms, summary }) => {
  const onlineCount = summary?.onlineCount ?? platforms?.filter(p => p.status === 'online').length ?? 0;
  const total = summary?.total ?? platforms?.length ?? 0;
  const allOnline = total > 0 && onlineCount === total;
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.3 }}
    className=""
  >
    <SMCard className="overflow-hidden rounded-2xl">
      <SMCardHeader action={<SMStatusDot variant={allOnline ? 'success' : 'warning'} label="Live" pulse size="sm" />}>AI Platform Sync</SMCardHeader>
      <SMCardBody className="space-y-2">
        {platforms?.length ? platforms.map((platform, i) => {
          const PlatformIcon = AI_ENGINE_ICON_MAP[platform.icon] ?? Brain;
          const loadBarClass = platform.load > 90 ? 'bg-danger' : platform.load > 70 ? 'bg-warning' : 'bg-accent';
          return (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-3 rounded-xl bg-surface-sunken px-3 py-3"
            >
              <PlatformIcon className="h-4 w-4 shrink-0 text-text-muted" />
              <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{platform.name}</span>
              <span className="text-xs font-mono text-text-muted">{platform.latency}</span>
              <div className="w-16 overflow-hidden rounded-full bg-surface-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${platform.load}%` }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                  className={`h-1.5 rounded-full ${loadBarClass}`}
                />
              </div>
              <SMStatusDot variant={platform.status === 'online' ? 'success' : 'warning'} size="sm" pulse={platform.status !== 'online'} />
            </motion.div>
          );
        }) : Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-surface-sunken px-3 py-3">
            <SMSkeleton className="h-4 w-4 rounded-full" />
            <SMSkeleton className="h-4 flex-1 rounded-md" />
            <SMSkeleton className="h-3 w-8 rounded-md" />
            <SMSkeleton className="h-1.5 w-16 rounded-full" />
            <SMSkeleton className="h-2 w-2 rounded-full" />
          </div>
        ))}
      </SMCardBody>
      <SMCardFooter align="between">
        <span className="text-[10px] font-mono text-text-muted">{platforms?.length ? `${onlineCount}/${total} AI ENGINES SYNCHRONIZED` : 'LOADING…'}</span>
        <span className="text-[10px] font-mono text-text-muted">{platforms?.length ? `${total} ENGINES • 99.97%` : ''}</span>
      </SMCardFooter>
    </SMCard>
  </motion.div>
  );
};

// Live Data Stream Widget
const LiveDataStream: React.FC<{ events?: DashboardLiveEvent[]; isLoading?: boolean }> = ({ events, isLoading }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="bg-surface-raised backdrop-blur-xl rounded-2xl border border-surface-border overflow-hidden"
    >
      <div className="p-5 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Live Data Stream</h3>
            <p className="text-[10px] text-text-muted font-mono">REAL-TIME PLATFORM ACTIVITY</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400 animate-pulse'}`} />
          <span className="text-[10px] font-bold text-cyan-400 font-mono">{isLoading ? 'LOADING...' : 'STREAMING'}</span>
        </div>
      </div>
      <div className="p-3 space-y-1.5 max-h-56 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5">
              <SMSkeleton className="h-3 w-12 rounded-md shrink-0 mt-0.5" />
              <SMSkeleton className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0" />
              <SMSkeleton className="h-3 flex-1 rounded-md" />
            </div>
          ))
        ) : events && events.length > 0 ? (
          events.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-sunken transition-colors group"
            >
              <span className="text-[10px] font-mono text-text-muted mt-0.5 shrink-0">
                {item.timestamp ? new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                item.eventType === 'success' ? 'bg-emerald-400' : item.eventType === 'warning' ? 'bg-amber-400' : 'bg-cyan-400'
              }`} />
              <p className="text-xs text-text-muted group-hover:text-text-secondary transition-colors leading-relaxed">{item.message}</p>
            </motion.div>
          ))
        ) : (
          <div className="py-8 text-center text-text-muted text-xs font-mono">
            NO EVENTS YET
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const { data: dashboardOverview, refetch: refetchOverview } = useDashboardOverview();
  const { data: liveStats, refetch: refetchLiveStats } = useDashboardLiveStats();
  // AI Risk Forecast — derived from liveStats (no fake API call)
  const forecast = React.useMemo<RiskForecast | null>(() => {
    if (!liveStats) return null;
    const sev = liveStats.severityBreakdown ?? [];
    const totalSev = sev.reduce((s, r) => s + r.count, 0);
    const criticalPct = totalSev > 0 ? sev.filter(r => r.severity?.toUpperCase() === 'CRITICAL').reduce((s, r) => s + r.count, 0) / totalSev : 0;
    const highPct = totalSev > 0 ? sev.filter(r => ['HIGH','CRITICAL'].includes(r.severity?.toUpperCase?.() ?? '')).reduce((s, r) => s + r.count, 0) / totalSev : 0;
    const complianceVal = parseFloat(String(liveStats.platformStats?.complianceRate?.value ?? '100'));
    const overallRisk: RiskForecast['overallRisk'] =
      criticalPct > 0.3 ? 'Critical' :
      highPct > 0.4 || complianceVal < 50 ? 'High' :
      highPct > 0.2 || complianceVal < 75 ? 'Medium' : 'Low';
    const trends = liveStats.incidentTrends ?? [];
    const trendData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const match = trends.find(t => t.month === key);
      const base = match ? Math.min(95, Math.round((match.total / Math.max(totalSev, 1)) * 80 + 10)) : Math.round(10 + Math.random() * 20);
      return { date: d.toISOString().split('T')[0], riskLevel: base };
    });
    const topThreats = sev.slice(0, 3).map(r => ({
      threat: r.severity ? r.severity.charAt(0).toUpperCase() + r.severity.slice(1).toLowerCase() + ' Severity' : 'Unknown',
      probability: totalSev > 0 ? Math.round((r.count / totalSev) * 100) / 100 : 0,
      impact: r.severity?.toUpperCase() === 'CRITICAL' ? 'Critical' : r.severity?.toUpperCase() === 'HIGH' ? 'High' : 'Medium',
    }));
    if (topThreats.length === 0) topThreats.push({ threat: 'No incidents recorded', probability: 0, impact: 'Low' });
    return {
      overallRisk,
      topThreats,
      trendData,
      recommendations: [],
      forecastDate: new Date().toISOString(),
      confidence: complianceVal / 100,
    };
  }, [liveStats]);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const recentIncidents = (dashboardOverview?.incidents ?? []).map(mapDashboardIncident);

  // Derive live system metrics from backend data with fallback
  const systemMetrics = liveStats?.platformStats
    ? [
        {
          label: 'Active Sensors',
          value: String(liveStats.platformStats.activeSensors.value),
          change: liveStats.platformStats.activeSensors.change,
          icon: Signal,
          color: 'cyan',
        },
        {
          label: 'AI Predictions',
          value: String(liveStats.platformStats.aiPredictions.value),
          change: liveStats.platformStats.aiPredictions.change,
          icon: Brain,
          color: 'purple',
        },
        {
          label: 'Compliance Rate',
          value: String(liveStats.platformStats.complianceRate.value),
          change: liveStats.platformStats.complianceRate.change,
          icon: ShieldCheck,
          color: 'green',
        },
        {
          label: 'Risks Mitigated',
          value: String(liveStats.platformStats.threatsBlocked.value),
          change: liveStats.platformStats.threatsBlocked.change,
          icon: Lock,
          color: 'red',
        },
      ]
    : FALLBACK_SYSTEM_METRICS;

  const businessMetrics = liveStats?.businessMetrics ?? FALLBACK_BUSINESS_METRICS;
  const conversionFunnel = liveStats?.conversionFunnel;
  const systemHealth = liveStats?.systemHealth;
  const systemHealthSummary = liveStats?.systemHealthSummary;
  const liveEvents = liveStats?.liveEvents ?? [];
  const checklistItems: ChecklistItem[] = liveStats?.checklistItems
    ? liveStats.checklistItems.map(i => ({ id: i.id, text: i.text, completed: i.completed }))
    : MOCK_CHECKLIST;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Auto-refresh live stats every 30 seconds + retry once after 3s in case backend was starting up
  useEffect(() => {
    const retryTimer = setTimeout(() => {
      refetchLiveStats();
      refetchOverview();
    }, 3000);
    const pollInterval = setInterval(() => {
      refetchLiveStats();
    }, 30000);
    return () => {
      clearTimeout(retryTimer);
      clearInterval(pollInterval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="page-wrapper">

        <div className="pt-8 max-w-5xl mx-auto px-4 md:px-6">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper transition-colors duration-500">
      {/* Futuristic ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-[650px] h-[650px] bg-gradient-radial from-cyan-500/8 via-cyan-500/3 to-transparent rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 -left-40 w-[550px] h-[550px] bg-gradient-radial from-purple-500/6 via-purple-500/2 to-transparent rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-gradient-radial from-cyan-500/5 via-transparent to-transparent rounded-full blur-3xl" 
        />
        {/* Cyber grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ 
          backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        {/* Horizontal scan lines */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 182, 212, 0.3) 2px, rgba(6, 182, 212, 0.3) 3px)',
          backgroundSize: '100% 4px'
        }} />
      </div>



      <main className="relative z-10 max-w-7xl mx-auto pt-8 md:pt-12">
        <div className="px-5 md:px-8 lg:px-12 space-y-12">
          {/* Hero Section - Futuristic */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="h-px w-8 bg-cyan-500" />
                <span className="text-[13px] font-bold text-cyan-400 uppercase tracking-[0.3em] font-display">{today}</span>
              </motion.div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-4 mb-2">
                  <img src="/logo.png" alt="SafetyMEG Logo" className="w-12 h-12 object-contain" />
                  <BlurText 
                    text="Command Center" 
                    delay={100} 
                    animateBy="words"
                    direction="bottom"
                    className="text-[36px] md:text-[44px] lg:text-[52px] font-bold text-text-primary block leading-[1.1] tracking-tight font-display"
                  />
                </div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4"
              >
                {(() => {
                  const totalOperators = liveStats?.platformStats?.activeOperators ?? 16;
                  const avatarsToShow = Math.min(totalOperators, 4);
                  const remaining = totalOperators - avatarsToShow;
                  return (
                    <div className="flex -space-x-2">
                      {Array.from({ length: avatarsToShow }, (_, i) => (
                        <div key={i + 1} className="w-8 h-8 rounded-full border-2 border-surface-border bg-surface-sunken overflow-hidden shadow-sm">
                          <img src={`https://i.pravatar.cc/150?u=${i + 1}`} alt="User" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {remaining > 0 && (
                        <div className="w-8 h-8 rounded-full border-2 border-surface-border bg-cyan-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                          +{remaining}
                        </div>
                      )}
                    </div>
                  );
                })()}
                <p className="text-sm text-text-muted font-medium">
                  <span className="text-text-primary font-bold">{liveStats?.platformStats?.activeOperators ?? 16} operators</span> active on site
                </p>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="hidden md:flex items-center gap-4 bg-surface-raised backdrop-blur-xl p-5 rounded-3xl border border-surface-border shadow-glow-soft"
            >
              <div className="p-3 bg-cyan-500/10 rounded-2xl">
                <Activity className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-widest font-bold">Safety Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-text-primary">{liveStats?.platformStats?.safetyScore ?? 98.5}%</span>
                  <span className="text-xs text-emerald-400 font-bold flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3 mr-1" /> {liveStats?.platformStats?.safetyScoreChange ?? '+2.4%'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Futuristic System Metrics Row */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {systemMetrics.map((metric, i) => (
              <FuturisticStatCard key={metric.label} {...metric} delay={i * 0.1} />
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="px-5 md:px-0 space-y-6 md:space-y-8"
          >
            {/* EHS Performance Metrics (live from backend) */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <div className="flex items-center gap-5 mb-6">
                <h2 className="text-[13px] font-bold text-purple-400/70 uppercase tracking-[0.25em] font-display">EHS Performance</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 via-purple-500/5 to-transparent" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {businessMetrics.map((metric, i) => (
                  <BusinessMetricCard key={metric.label} metric={metric} index={i} />
                ))}
              </div>
            </motion.div>

            {/* KPI Dashboard Section */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <div className="flex items-center gap-5 mb-6">
                <h2 className="text-[13px] font-bold text-cyan-400/70 uppercase tracking-[0.25em] font-display">Analytics & KPIs</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 via-cyan-500/5 to-transparent" />
              </div>
              <KPIDashboard
                incidentTrends={liveStats?.incidentTrends}
                inspectionTrends={liveStats?.inspectionTrends}
                severityBreakdown={liveStats?.severityBreakdown}
              />
            </motion.div>

            {/* Funnel & Health Monitor Row */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <div className="flex items-center gap-5 mb-6">
                <h2 className="text-[13px] font-bold text-emerald-400/70 uppercase tracking-[0.25em] font-display">Monitoring & Funnels</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-transparent" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ConversionFunnel stages={conversionFunnel} />
                <SystemHealthMonitor services={systemHealth} summary={systemHealthSummary} />
              </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: AI Sync, Alerts & Auto-Pilot */}
              <div className="lg:col-span-1 space-y-8">
                {/* AI Platform Sync */}
                <motion.div variants={itemVariants}>
                  <AIPlatformSync platforms={liveStats?.aiPlatforms} summary={liveStats?.aiPlatformsSummary} />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <ComplianceAlerts />
                </motion.div>
                
                {/* AI Risk Forecast Widget */}
                <motion.div variants={itemVariants} className="bg-surface-raised backdrop-blur-xl rounded-2xl border border-surface-border shadow-cyber overflow-hidden">
                  <div className="p-5 border-b border-surface-border flex items-center justify-between bg-cyan-500/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-text-primary">AI Risk Forecast</h3>
                        <p className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-wider">Next 7 Days</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      forecast?.overallRisk === 'High' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {forecast?.overallRisk || 'Analyzing...'}
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="h-24 flex items-end gap-1.5">
                      {forecast?.trendData?.map((d, i) => (
                        <div key={i} className="flex-1 bg-cyan-500/5 rounded-t-lg relative group">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${d.riskLevel}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-lg"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-text-muted font-medium">Top Predicted Threat:</p>
                      <div className="flex items-center justify-between p-2 bg-surface-sunken rounded-xl border border-surface-border">
                        <span className="text-[11px] font-bold text-text-primary truncate mr-2">
                          {forecast?.topThreats?.[0]?.threat || 'Analyzing...'}
                        </span>
                        <span className="text-[10px] font-black text-red-400 whitespace-nowrap">
                          {forecast?.topThreats?.[0]?.probability ? `${forecast.topThreats[0].probability}%` : ''}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/predictive-safety')}
                      className="w-full py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-xl hover:bg-cyan-500/20 hover:border-cyan-500/30 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      View Full Analysis <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <SafetyAutoPilot liveStats={liveStats} />
                </motion.div>
              </div>

              {/* Right Column: Feature Grid, Live Data & Incidents */}
              <div className="lg:col-span-2 space-y-8">
                <motion.div variants={itemVariants}>
                  <FeatureGrid />
                </motion.div>

                {/* Live Data Stream */}
                <motion.div variants={itemVariants}>
                  <LiveDataStream events={liveEvents} isLoading={!liveStats} />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <IncidentList incidents={recentIncidents} isLoading={!dashboardOverview} />
                </motion.div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <div className="flex items-center gap-5 mb-6">
                <h2 className="text-[13px] font-bold text-cyan-400/70 uppercase tracking-[0.25em] font-display">Quick Access</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 via-cyan-500/5 to-transparent" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <QuickActionCard 
                  icon={ClipboardCheck}
                  title="Digital Audit"
                  subtitle="New Inspection"
                  onClick={() => navigate('/safety-audit')}
                />
                <QuickActionCard 
                  icon={Shield}
                  title="Safety Procedures"
                  subtitle="Safety Protocols"
                  onClick={() => navigate('/safety-procedures')}
                />
                <QuickActionCard 
                  icon={AlertTriangle}
                  title="Report Incident"
                  subtitle="Log Safety Event"
                  onClick={() => navigate('/report-incident')}
                />
                <QuickActionCard 
                  icon={ShieldCheck}
                  title="Risk Register"
                  subtitle="Matrix & Controls"
                  onClick={() => navigate('/risk-register')}
                />
                <QuickActionCard 
                  icon={FileSearch}
                  title="Investigations"
                  subtitle="Root Cause Analysis"
                  onClick={() => navigate('/investigation-reports')}
                />
                <QuickActionCard 
                  icon={Eye}
                  title="Visual Audit"
                  subtitle="AI Hazard Scan"
                  onClick={() => navigate('/visual-audit')}
                />
                <QuickActionCard 
                  icon={Globe}
                  title="ESG Reporting"
                  subtitle="Sustainability"
                  onClick={() => navigate('/esg-reporting')}
                />
                <QuickActionCard 
                  icon={Flame}
                  title="Emergency Response"
                  subtitle="Action Plans"
                  onClick={() => navigate('/safety-hub')}
                />
                <QuickActionCard 
                  icon={KeyRound}
                  title="Lockout/Tagout"
                  subtitle="LOTO Procedures"
                  onClick={() => navigate('/permit-to-work')}
                />
                <QuickActionCard 
                  icon={Layers}
                  title="Confined Space"
                  subtitle="Entry Permits"
                  onClick={() => navigate('/hazard-assessment')}
                />
                <QuickActionCard 
                  icon={Thermometer}
                  title="Ergonomics AI"
                  subtitle="Posture Analysis"
                  onClick={() => navigate('/predictive-safety')}
                />
                <QuickActionCard 
                  icon={GraduationCap}
                  title="AI Training"
                  subtitle="Auto-Generated"
                  onClick={() => navigate('/training')}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
