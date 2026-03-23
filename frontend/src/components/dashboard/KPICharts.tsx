import React from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, ShieldCheck, AlertTriangle, 
  ClipboardCheck, Clock, Target, Users, Zap, Award, Shield,
  Brain, Sparkles, ExternalLink, BarChart3, Send, MessageCircle, X, Minimize2, Maximize2
} from 'lucide-react';
import { 
  kpiData, extendedKpiData, incidentsByMonth, incidentsByCategory, 
  inspectionCompletionData, safetyScoreTrend, geminiInsights, powerBIDashboards 
} from '../../data/mockAnalytics';
import { useKPIMetricsAnalytics } from '../../api/hooks/useAPIHooks';
import type { DashboardIncidentTrend, DashboardInspectionTrend, DashboardSeverityBreakdown } from '../../api/services/apiService';

// Animation variants with enhanced transitions
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

const chartAnimationProps = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
};

// Get icon for extended KPIs
const getKpiIcon = (id: string) => {
  switch (id) {
    case 'mttr': return Clock;
    case 'near-misses': return AlertTriangle;
    case 'compliance-rate': return ClipboardCheck;
    case 'training-completion': return Users;
    case 'audit-score': return Award;
    case 'days-safe': return Shield;
    case 'trir': return Activity;
    case 'capa-closure': return Target;
    default: return Activity;
  }
};

// KPI Card component
const KPICard: React.FC<{
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  unit?: string;
  description?: string;
  compact?: boolean;
}> = ({ label, value, change, trend, icon: Icon, unit, description, compact }) => (
  <motion.div
    variants={cardVariants}
    whileHover={{ y: -4, scale: 1.012 }}
    className={`relative bg-surface-raised backdrop-blur-xl ${compact ? 'p-3.5 md:p-4' : 'p-4 md:p-5'} rounded-2xl flex-1 min-w-0 overflow-hidden transition-all duration-300 border border-surface-border`}
    style={{
      boxShadow: trend === 'up'
        ? '0 0 0 1px rgba(16,185,129,0.08), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)'
        : '0 0 0 1px rgba(239,68,68,0.08), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
    }}
  >
    {/* Accent bar */}
    <motion.div 
      initial={{ width: 0 }}
      whileInView={{ width: 40 }}
      viewport={{ once: true }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute top-0 left-0 h-[3px] rounded-br-md ${
        trend === 'up' 
          ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent' 
          : 'bg-gradient-to-r from-rose-500 via-rose-400 to-transparent'
      }`}
    />
    
    <div className="flex items-start justify-between mb-3">
      <motion.div 
        className={`${compact ? 'p-2' : 'p-2.5'} rounded-xl border ${
          trend === 'up' 
            ? 'bg-emerald-500/10 border-emerald-500/20' 
            : 'bg-rose-500/10 border-rose-500/20'
        }`}
        whileHover={{ scale: 1.1, rotate: 6 }}
        transition={{ type: 'spring', stiffness: 350, damping: 18 }}
      >
        <Icon className={`${compact ? 'w-4 h-4' : 'w-4 h-4 md:w-5 md:h-5'} ${
          trend === 'up' 
            ? 'text-emerald-400' 
            : 'text-rose-400'
        }`} strokeWidth={1.75} />
      </motion.div>
      <div className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
        trend === 'up'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      }`}>
        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span className="hidden sm:inline">{change}</span>
      </div>
    </div>
    <div className="flex items-baseline gap-1.5">
      <p className={`${compact ? 'text-2xl' : 'text-2xl md:text-[2rem]'} font-black text-text-primary tracking-tight leading-none`}>{value}</p>
      {unit && <span className={`text-xs font-semibold ${trend === 'up' ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>{unit}</span>}
    </div>
    <p className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-text-muted font-semibold mt-2 uppercase tracking-widest`}>{label}</p>
    {description && (
      <p className="text-[9px] text-text-muted mt-0.5 line-clamp-1">{description}</p>
    )}
  </motion.div>
);

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Build a full 12-slot timeline (last 12 calendar months ending at current month),
// filling every slot with 0 and placing real data values where they exist.
function buildTimelineSlots(cutoff: number, realData?: DashboardIncidentTrend[]) {
  // Current month index (0-based) — March 2026 = index 2
  const now = new Date();
  const slots: { name: string; incidents: number; live: boolean }[] = [];
  for (let i = cutoff - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = MONTH_ABBR[d.getMonth()];
    const match = realData?.find(rd => rd.month === key || rd.month.startsWith(key));
    slots.push({
      name: label,
      incidents: match ? match.total : 0,
      live: match != null,
    });
  }
  return slots;
}

export const IncidentsTrendChart: React.FC<{ timeRange?: string; data?: DashboardIncidentTrend[] }> = ({ timeRange: initialRange = '6M', data }) => {
  const [range, setRange] = React.useState(initialRange);

  const chartData = React.useMemo(() => {
    const cutoff = range === '3M' ? 3 : range === '6M' ? 6 : 12;
    return buildTimelineSlots(cutoff, data);
  }, [range, data]);

  const trend = chartData.length >= 2
    ? chartData[chartData.length - 1].incidents - chartData[0].incidents
    : 0;

  return (
  <motion.div
    variants={cardVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    className="min-w-0 overflow-hidden bg-surface-raised backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-surface-border"
    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
  >
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-bold text-text-primary tracking-tight">Incident Trends</h3>
        <p className="text-[10px] text-text-muted mt-0.5">
          {trend > 0 ? `▲ +${trend} vs period start` : trend < 0 ? `▼ ${trend} vs period start` : 'Stable vs period start'}
        </p>
      </div>
      <div className="flex items-center gap-1 bg-surface-sunken border border-surface-border rounded-lg p-0.5">
        {(['3M', '6M', '1Y'] as const).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${
              range === r
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
    <motion.div className="h-40 md:h-48 w-full min-w-0" {...chartAnimationProps}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="incidentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--surface-overlay)', 
              border: '1px solid rgba(20,184,166,0.2)', 
              borderRadius: '10px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              color: 'var(--text-primary)',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'var(--text-muted)', fontWeight: 600 }}
            itemStyle={{ color: '#14b8a6' }}
          />
          <Area 
            type="monotone" 
            dataKey="incidents" 
            stroke="#14b8a6" 
            strokeWidth={2}
            fill="url(#incidentGradient)"
            dot={(props: any) => {
              if (props.payload?.live) {
                // Real data point — solid bright dot
                return <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill="#14b8a6" stroke="transparent" strokeWidth={2} />;
              }
              // Empty/zero node — small hollow dim dot
              return <circle key={props.key} cx={props.cx} cy={props.cy} r={2.5} fill="none" stroke="var(--surface-border)" strokeWidth={1.5} />;
            }}
            activeDot={{ r: 5, fill: '#2dd4bf', stroke: 'transparent', strokeWidth: 2 }}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  </motion.div>
  );
};

// Safety Score Trend Chart
export const SafetyScoreTrendChart: React.FC = () => (
  <motion.div
    variants={cardVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    className="min-w-0 overflow-hidden bg-surface-raised rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-card border border-surface-border"
  >
    <div className="flex items-center justify-between mb-4 md:mb-6">
      <div>
        <h3 className="text-base md:text-lg font-bold text-text-primary tracking-tight">Safety Score Trend</h3>
        <p className="text-[10px] md:text-xs text-text-muted mt-0.5">6-month performance</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
        <TrendingUp className="w-3 h-3" />
        +7pts
      </div>
    </div>
    <motion.div className="h-36 md:h-44 w-full min-w-0" {...chartAnimationProps}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={144}>
        <LineChart data={safetyScoreTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          />
          <YAxis 
            domain={[80, 100]}
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--surface-overlay)', 
              border: '1px solid var(--surface-border)', 
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              color: 'var(--text-primary)',
            }}
            formatter={(value: number) => [`${value}%`, 'Score']}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="url(#scoreGradient)" 
            strokeWidth={3}
            dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#10b981' }}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  </motion.div>
);

// Inspection Completion Chart with animations
export const InspectionCompletionChart: React.FC<{ data?: DashboardInspectionTrend[] }> = ({ data }) => {
  const [range, setRange] = React.useState<'3M' | '6M' | '1Y'>('6M');

  const chartData = React.useMemo(() => {
    const cutoff = range === '3M' ? 3 : range === '6M' ? 6 : 12;
    const now = new Date();
    return Array.from({ length: cutoff }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (cutoff - 1 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = MONTH_ABBR[d.getMonth()];
      const match = data?.find(rd => rd.month === key || rd.month.startsWith(key));
      return {
        month: label,
        completed: match ? match.completed : 0,
        scheduled: match ? match.scheduled : 0,
        live: match != null,
      };
    });
  }, [range, data]);

  const totalCompleted = chartData.reduce((s, d) => s + d.completed, 0);
  const totalScheduled = chartData.reduce((s, d) => s + d.scheduled, 0);
  const completionPct = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  return (
  <motion.div
    variants={cardVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    className="min-w-0 overflow-hidden bg-surface-raised backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-surface-border"
    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
  >
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-bold text-text-primary tracking-tight">Inspections</h3>
        <p className="text-[10px] text-text-muted mt-0.5">
          {totalCompleted > 0
            ? `${totalCompleted} completed${totalScheduled > 0 ? ` of ${totalScheduled} scheduled` : ''}`
            : 'No data yet'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {completionPct > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            {completionPct}%
          </div>
        )}
        <div className="flex items-center gap-1 bg-surface-sunken border border-surface-border rounded-lg p-0.5">
          {(['3M', '6M', '1Y'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${
                range === r
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
    <motion.div className="h-36 md:h-44 w-full min-w-0" {...chartAnimationProps}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={144}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={3}>
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--surface-overlay)', 
              border: '1px solid rgba(20,184,166,0.2)', 
              borderRadius: '10px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'var(--text-muted)', fontWeight: 600 }}
            formatter={(value: number, name: string) => [value, name === 'scheduled' ? 'Scheduled' : 'Completed']}
          />
          <Bar
            dataKey="scheduled"
            name="scheduled"
            fill="rgba(20,184,166,0.12)"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="completed" 
            name="completed"
            radius={[4, 4, 0, 0]}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={entry.live ? (entry.scheduled > 0 && entry.completed >= entry.scheduled ? '#10b981' : '#14b8a6') : 'var(--surface-border)'}
                fillOpacity={entry.live ? 0.9 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  </motion.div>
  );
};

// Incident Categories Pie Chart with animations
// Severity → consistent color mapping
const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high:     '#ef4444',
  medium:   '#f59e0b',
  low:      '#10b981',
  minimal:  '#3b82f6',
  other:    '#6b7280',
};
function severityColor(label: string, fallbackIndex: number): string {
  const key = label.toLowerCase().trim();
  if (SEVERITY_COLORS[key]) return SEVERITY_COLORS[key];
  const fallbacks = ['#ef4444','#f59e0b','#3b82f6','#10b981','#8b5cf6','#6b7280'];
  return fallbacks[fallbackIndex % fallbacks.length];
}

export const IncidentCategoriesChart: React.FC<{ data?: DashboardSeverityBreakdown[] }> = ({ data }) => {
  // Normalise & deduplicate: merge same severity (case-insensitive)
  const chartData = React.useMemo(() => {
    if (!data?.length) return [];
    const merged: Record<string, number> = {};
    data.forEach(d => {
      const key = d.severity.trim().toLowerCase();
      merged[key] = (merged[key] || 0) + (d.percentage ?? 0);
    });
    return Object.entries(merged)
      .sort((a, b) => b[1] - a[1])
      .map(([key, pct], i) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: Math.round(pct),
        color: severityColor(key, i),
      }));
  }, [data]);

  const hasData = chartData.length > 0;
  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
  <motion.div
    variants={cardVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    className="min-w-0 overflow-hidden bg-surface-raised backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-surface-border"
    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
  >
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-bold text-text-primary tracking-tight">Incident Severity</h3>
        <p className="text-[10px] text-text-muted mt-0.5">
          {hasData ? `${total > 0 ? data!.reduce((s,d) => s + (d.count ?? 0), 0) : ''} incidents by severity` : 'No data yet'}
        </p>
      </div>
      {hasData && (
        <div className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Live
        </div>
      )}
    </div>

    {hasData ? (
      <div className="flex min-w-0 flex-col items-stretch gap-5 md:flex-row md:items-center">
        <motion.div className="mx-auto h-28 w-28 min-w-[7rem] flex-shrink-0 md:mx-0 md:h-32 md:w-32 md:min-w-[8rem]" {...chartAnimationProps}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={112}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                paddingAngle={2}
                dataKey="value"
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface-overlay)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '10px',
                  fontSize: '11px',
                }}
                labelStyle={{ color: 'var(--text-muted)' }}
                formatter={(value: number, name: string) => [`${value}%`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
        <div className="flex-1 min-w-0 space-y-2">
          {chartData.map((item, i) => (
            <motion.div
              key={item.name}
              className="flex items-center justify-between"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-[11px] text-text-secondary">{item.name}</span>
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-end gap-2 pl-3">
                <div className="h-1 w-20 min-w-0 rounded-full bg-surface-sunken overflow-hidden md:w-16">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
                <span className="w-9 flex-shrink-0 text-right text-[11px] font-bold text-text-primary">{item.value}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center h-28 gap-2 text-text-muted">
        <Activity className="w-8 h-8 opacity-30" />
        <p className="text-[11px]">No incident data recorded yet</p>
      </div>
    )}
  </motion.div>
  );
};

// Gemini AI Insights Panel
export const GeminiAIPanel: React.FC = () => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return AlertTriangle;
      case 'trend': return TrendingUp;
      case 'anomaly': return Zap;
      case 'recommendation': return Target;
      default: return Brain;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'prediction': return 'bg-amber-500/10 text-amber-500';
      case 'trend': return 'bg-emerald-500/10 text-emerald-500';
      case 'anomaly': return 'bg-red-500/10 text-red-500';
      case 'recommendation': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-purple-500/10 text-purple-500';
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="bg-surface-raised rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-card border border-surface-border"
    >
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-text-primary tracking-tight flex items-center gap-2">
              Gemini AI Insights
              <Sparkles className="w-4 h-4 text-brand-500" />
            </h3>
            <p className="text-[10px] md:text-xs text-text-muted">Real-time safety intelligence</p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 animate-pulse">
          Live
        </span>
      </div>

      <div className="space-y-3">
        {geminiInsights.map((insight, i) => {
          const InsightIcon = getInsightIcon(insight.type);
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.01 }}
              className="bg-surface-raised backdrop-blur-sm rounded-xl p-3 md:p-4 border border-surface-border cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                  <InsightIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-bold text-text-primary line-clamp-1">{insight.title}</h4>
                    <span className="text-[9px] font-semibold text-text-muted whitespace-nowrap">
                      {insight.confidence}% conf.
                    </span>
                  </div>
                  <p className="text-xs text-text-muted line-clamp-2 mb-2">{insight.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-500/10 text-brand-500">
                      {insight.action}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// Power BI Embedded Dashboard Panel
export const PowerBIPanel: React.FC = () => {
  const [selectedDashboard, setSelectedDashboard] = React.useState(powerBIDashboards[0]);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={`bg-surface-raised rounded-2xl md:rounded-3xl shadow-card border border-surface-border ${
        isFullscreen ? 'fixed inset-4 z-50 p-4' : 'p-4 md:p-6'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-text-primary tracking-tight">
              BI Dashboard
            </h3>
            <p className="text-[10px] md:text-xs text-text-muted">Embedded analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedDashboard.id}
            onChange={(e) => setSelectedDashboard(powerBIDashboards.find(d => d.id === e.target.value) || powerBIDashboards[0])}
            className="text-xs bg-surface-sunken border border-surface-border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            {powerBIDashboards.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-surface-sunken hover:bg-surface-overlay transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Embedded Dashboard Iframe */}
      <div className={`bg-surface-raised rounded-xl overflow-hidden border border-surface-border ${isFullscreen ? 'h-[calc(100%-80px)]' : 'h-64 md:h-80'}`}>
        <iframe
          title={selectedDashboard.name}
          src={selectedDashboard.embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>

      {/* Dashboard Links */}
      <div className="mt-4 flex flex-wrap gap-2">
        {powerBIDashboards.map((dashboard) => (
          <motion.a
            key={dashboard.id}
            href={dashboard.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedDashboard.id === dashboard.id
                ? 'bg-amber-500 text-white'
                : 'bg-surface-raised text-text-secondary hover:bg-amber-500/10'
            }`}
          >
            {dashboard.name}
            <ExternalLink className="w-3 h-3" />
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
};

// AI Chat Assistant Component
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your megSAFE AI assistant. I can help you with safety queries, compliance questions, incident analysis, and more. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    'What\'s our current safety score?',
    'Show open incidents',
    'Compliance status',
    'Training due soon'
  ];

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses: { [key: string]: string } = {
        'safety': 'Your current safety score is 94/100, which is excellent! This is a 3% improvement from last month. Key factors: 42 consecutive days without incidents, 96.5% compliance rate.',
        'incident': 'You have 3 open incidents: 1 slip hazard (medium), 1 forklift collision (high), and 1 pending investigation. Would you like details on any specific incident?',
        'compliance': 'Overall compliance rate is 96.5%. OSHA compliance: 98%, EPA compliance: 95%, Internal policies: 97%. 2 items need attention before the next audit.',
        'training': '5 employees have training expiring in the next 30 days: 2 for HAZWOPER, 2 for Confined Space, 1 for Fall Protection. Would you like to send reminders?',
        'default': 'I understand you\'re asking about safety management. Let me analyze that for you. Based on current data, here are some insights:\n\n• Safety score trending upward (+7pts over 6 months)\n• 2 pending CAPAs require attention\n• 5 upcoming inspections scheduled\n\nWould you like more specific information?'
      };

      let responseKey = 'default';
      const lowerInput = inputValue.toLowerCase();
      if (lowerInput.includes('safety') || lowerInput.includes('score')) responseKey = 'safety';
      else if (lowerInput.includes('incident')) responseKey = 'incident';
      else if (lowerInput.includes('compliance')) responseKey = 'compliance';
      else if (lowerInput.includes('training')) responseKey = 'training';

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[responseKey],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    setTimeout(() => {
      const input = document.getElementById('chat-input') as HTMLInputElement;
      input?.focus();
    }, 100);
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-[1.75rem] transition-all duration-300 hover:brightness-110"
        style={{ backgroundColor: '#00A89D', color: '#ffffff', border: '1px solid rgba(0,168,157,0.3)', boxShadow: '0 0 0 4px rgba(0,168,157,0.18), 0 8px 32px rgba(0,168,157,0.55)' }}
        aria-label="Open AI safety assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed z-50 bg-surface-overlay backdrop-blur-xl rounded-2xl shadow-2xl border border-surface-border overflow-hidden ${
        isMinimized 
          ? 'bottom-24 right-6 w-72 h-14' 
          : 'bottom-24 right-6 w-96 max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-100px)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-700 text-white">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-white/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">megSAFE AI</h3>
            {!isMinimized && (
              <p className="text-[10px] text-brand-200">Safety Intelligence Assistant</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100%-140px)]">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    message.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-md'
                      : 'bg-surface-sunken text-text-primary rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-[9px] mt-1 ${
                    message.role === 'user' ? 'text-brand-200' : 'text-text-muted'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-surface-sunken rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] text-text-muted mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => handleQuickAction(action)}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-surface-border">
            <div className="flex items-center gap-2">
              <input
                id="chat-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about safety, compliance, incidents..."
                className="flex-1 px-4 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/30 placeholder:text-text-muted"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="p-2.5 rounded-xl bg-brand-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 transition-colors"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

// Extended KPI Grid for Unified Hub
export const ExtendedKPIGrid: React.FC = () => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3"
  >
    {extendedKpiData.map((kpi, index) => (
      <motion.div
        key={kpi.id}
        variants={cardVariants}
        custom={index}
        transition={{ delay: index * 0.05 }}
      >
        <KPICard
          label={kpi.label}
          value={kpi.value}
          change={kpi.change}
          trend={kpi.trend as 'up' | 'down'}
          icon={getKpiIcon(kpi.id)}
          unit={kpi.unit}
          description={kpi.description}
          compact
        />
      </motion.div>
    ))}
  </motion.div>
);

// KPI Dashboard Grid
export const KPIDashboard: React.FC<{
  incidentTrends?: DashboardIncidentTrend[];
  inspectionTrends?: DashboardInspectionTrend[];
  severityBreakdown?: DashboardSeverityBreakdown[];
}> = ({ incidentTrends, inspectionTrends, severityBreakdown }) => {
  const { data: kpiMetrics } = useKPIMetricsAnalytics();

  // Build 4 KPI cards from live analytics or fall back to mock
  const liveKpiCards = kpiMetrics?.length
    ? [
        kpiMetrics.find(k => k.id === 'incidents') ?? null,
        kpiMetrics.find(k => k.id === 'capa-closure') ?? null,
        kpiMetrics.find(k => k.id === 'open-capas') ?? null,
        kpiMetrics.find(k => k.id === 'training') ?? null,
      ].filter(Boolean).map((k, i) => ({
        id: String(i + 1),
        label: k!.label,
        value: k!.value !== null ? String(k!.value) : 'N/A',
        unit: k!.unit ?? undefined,
        change: k!.trend === 'good' ? '▲ On Track' : k!.trend === 'bad' ? '▼ Needs Attention' : '→ Stable',
        trend: (k!.trend === 'good' ? 'up' : k!.trend === 'bad' ? 'down' : 'up') as 'up' | 'down',
      }))
    : null;

  const displayKpiCards = liveKpiCards ?? kpiData;

  const iconMap: { [key: string]: React.ElementType } = {
    '1': AlertTriangle,
    '2': ClipboardCheck,
    '3': Activity,
    '4': ShieldCheck,
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="space-y-4 md:space-y-6"
    >
      {/* KPI Cards - responsive grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {displayKpiCards.map((kpi, index) => (
          <motion.div
            key={kpi.id}
            variants={cardVariants}
            custom={index}
            transition={{ delay: index * 0.1 }}
          >
            <KPICard
              label={kpi.label}
              value={kpi.value}
              unit={(kpi as any).unit}
              change={kpi.change}
              trend={kpi.trend as 'up' | 'down'}
              icon={iconMap[kpi.id] || Activity}
            />
          </motion.div>
        ))}
      </div>

      {/* Charts - responsive layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <IncidentsTrendChart data={incidentTrends} />
        <InspectionCompletionChart data={inspectionTrends} />
      </div>
      
      {/* Category chart - full width on mobile, half on tablet */}
      <div className="w-full min-w-0 md:max-w-md">
        <IncidentCategoriesChart data={severityBreakdown} />
      </div>
    </motion.div>
  );
};

export default KPIDashboard;
