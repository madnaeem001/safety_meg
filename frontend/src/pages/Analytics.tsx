import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  Award,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Target,
  Clock,
  Sparkles,
  Brain,
  ShieldAlert,
  Zap,
  FileCheck,
  Star,
  ChevronRight,
  ChevronDown,
  Users,
  Building2,
  Filter,
  X,
  SlidersHorizontal,
  Calendar,
  Database,
  GraduationCap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
} from 'recharts';
import {
  useKPIMetricsAnalytics,
  useIncidentTrends,
  useDepartmentMetrics,
  useSeverityBreakdown,
  useExecutiveKPIs,
  useLeadingIndicatorsArray,
  useLaggingIndicators,
  useMonthlyTrend,
} from '../api/hooks/useAPIHooks';

const DEPT_COLORS = ['#14b8a6', '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#0ea5e9', '#f97316'];
const CATEGORY_COLORS = ['#10b981', '#3b82f6', '#14b8a6', '#f59e0b'];

type DateRange = '7d' | '30d' | '90d' | '1y' | 'all';

type KpiCardData = {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  period: string;
};

type QualityCategory = {
  name: string;
  score: number;
  color: string;
};

type QualityTrendPoint = {
  month: string;
  score: number;
};

type ComplianceCategory = {
  category: string;
  compliant: number;
  total: number;
  rate: number;
};

type DepartmentViewModel = {
  id: string;
  name: string;
  color: string;
  summaryLabel: string;
  metrics: {
    safetyScore: number;
    incidents: number;
    highSeverityIncidents: number;
    openActions: number;
    closureRate: number;
    totalCapas: number;
  };
};

type BenchmarkItem = {
  metric: string;
  current: number;
  industryAvg: number;
  target: number;
  unit: string;
};

type ActivityEvent = {
  id: string;
  type: 'improvement' | 'alert' | 'achievement' | 'action';
  title: string;
  description: string;
  timestamp: string;
};

type InsightItem = {
  label: string;
  value: string;
  icon: typeof Brain;
  color: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const parseDeltaNumber = (value?: string) => {
  const match = value?.match(/([+-]?\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
};

const formatKpiValue = (value: number | null, unit?: string) => {
  if (value === null || Number.isNaN(value)) {
    return 'N/A';
  }

  return `${value}${unit ?? ''}`;
};

const formatTrendLabel = (trend: 'good' | 'bad' | 'neutral') => {
  if (trend === 'good') {
    return '+Healthy';
  }

  if (trend === 'bad') {
    return '-Watch';
  }

  return 'Stable';
};

const scoreBucket = (score: number) => {
  if (score >= 95) {
    return 'high';
  }

  if (score >= 85) {
    return 'medium';
  }

  return 'low';
};

const SectionEmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-2xl border border-dashed border-surface-200 bg-white p-8 text-center">
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 text-surface-400">
      <Database className="h-5 w-5" />
    </div>
    <p className="font-medium text-surface-700">{title}</p>
    <p className="mt-1 text-sm text-surface-500">{description}</p>
  </div>
);

const KPICard = ({ data, index }: { data: KpiCardData; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
    className="rounded-2xl border border-surface-100 bg-white p-4 shadow-soft"
  >
    <div className="mb-2 flex items-start justify-between">
      <span className="text-sm font-medium text-surface-500">{data.label}</span>
      <div className={`flex items-center rounded-full px-2 py-1 text-xs font-bold ${
        data.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
      }`}>
        {data.trend === 'up' ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
        {data.change}
      </div>
    </div>
    <div className="text-2xl font-bold text-brand-900">{data.value}</div>
    <div className="mt-1 text-xs text-surface-400">{data.period}</div>
  </motion.div>
);

const QualityScoreGauge = ({ score, previousScore }: { score: number; previousScore: number }) => {
  const data = [{ name: 'Score', value: score, fill: score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444' }];
  const diff = score - previousScore;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 to-brand-950 p-6 text-white shadow-xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md">
            <Award className="h-7 w-7 text-brand-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Safety Score</h3>
            <p className="text-xs text-brand-300">Backend-derived executive KPI</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold ${
          diff >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
        }`}>
          {diff >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {diff >= 0 ? '+' : ''}
          {diff}
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={180}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            barSize={16}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar background={{ fill: 'rgba(255,255,255,0.1)' }} dataKey="value" cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold">{score}</span>
          <span className="text-sm text-brand-300">out of 100</span>
        </div>
      </div>

      <div className="absolute bottom-[-30px] right-[-30px] h-40 w-40 rounded-full bg-white/5 blur-2xl" />
    </motion.div>
  );
};

const QualityEventCard = ({ event, index }: { event: ActivityEvent; index: number }) => {
  const icons = {
    improvement: CheckCircle2,
    alert: AlertTriangle,
    achievement: Star,
    action: FileCheck,
  };

  const colors = {
    improvement: 'text-emerald-500 bg-emerald-50',
    alert: 'text-amber-500 bg-amber-50',
    achievement: 'text-purple-500 bg-purple-50',
    action: 'text-blue-500 bg-blue-50',
  };

  const Icon = icons[event.type];
  const colorClass = colors[event.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex items-start gap-3 rounded-2xl border border-surface-100 bg-white p-4 shadow-soft"
    >
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-brand-900">{event.title}</h4>
        <p className="mt-0.5 line-clamp-2 text-xs text-surface-500">{event.description}</p>
        <span className="mt-1 block text-xs text-surface-400">
          {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
};

const BenchmarkRow = ({ benchmark, index }: { benchmark: BenchmarkItem; index: number }) => {
  const isAboveTarget = benchmark.metric === 'TRIR' || benchmark.metric === 'LTIR'
    ? benchmark.current <= benchmark.target
    : benchmark.current >= benchmark.target;
  const isBetterThanIndustry = benchmark.metric === 'TRIR' || benchmark.metric === 'LTIR'
    ? benchmark.current < benchmark.industryAvg
    : benchmark.current > benchmark.industryAvg;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex items-center justify-between rounded-xl bg-surface-50 p-3"
    >
      <div className="flex items-center gap-3">
        <div className={`h-8 w-2 rounded-full ${isAboveTarget ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <div>
          <span className="text-sm font-medium text-brand-900">{benchmark.metric}</span>
          <div className="text-xs text-surface-500">{benchmark.unit || 'benchmark'}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-bold text-brand-900">{benchmark.current}</div>
          <div className={`text-xs ${isBetterThanIndustry ? 'text-emerald-600' : 'text-surface-500'}`}>
            vs {benchmark.industryAvg} avg
          </div>
        </div>
        <Target className={`h-5 w-5 ${isAboveTarget ? 'text-emerald-500' : 'text-amber-500'}`} />
      </div>
    </motion.div>
  );
};

const DepartmentCard = ({
  dept,
  isExpanded,
  onToggle,
  index,
}: {
  dept: DepartmentViewModel;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 95) {
      return 'text-emerald-600 bg-emerald-50';
    }

    if (score >= 90) {
      return 'text-blue-600 bg-blue-50';
    }

    if (score >= 85) {
      return 'text-amber-600 bg-amber-50';
    }

    return 'text-rose-600 bg-rose-50';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="overflow-hidden rounded-2xl border border-surface-100 bg-white shadow-soft"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-50"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${dept.color}15` }}
          >
            <Building2 className="h-5 w-5" style={{ color: dept.color }} />
          </div>
          <div>
            <h4 className="font-semibold text-brand-900">{dept.name}</h4>
            <span className="text-xs text-surface-500">{dept.summaryLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`rounded-full px-3 py-1.5 text-sm font-bold ${getScoreColor(dept.metrics.safetyScore)}`}>
            {dept.metrics.safetyScore}%
          </div>
          {isExpanded ? <ChevronDown className="h-5 w-5 rotate-180 text-surface-400" /> : <ChevronDown className="h-5 w-5 text-surface-400" />}
        </div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-surface-100"
        >
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-surface-50 p-2 text-center">
                <div className="text-lg font-bold text-brand-900">{dept.metrics.incidents}</div>
                <div className="text-xs text-surface-500">Incidents</div>
              </div>
              <div className="rounded-xl bg-surface-50 p-2 text-center">
                <div className="text-lg font-bold text-brand-900">{dept.metrics.highSeverityIncidents}</div>
                <div className="text-xs text-surface-500">High Severity</div>
              </div>
              <div className="rounded-xl bg-surface-50 p-2 text-center">
                <div className="text-lg font-bold text-brand-900">{dept.metrics.openActions}</div>
                <div className="text-xs text-surface-500">Open CAPAs</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-surface-600">
                    <Shield className="h-3 w-3" /> Safety score
                  </span>
                  <span className="font-medium text-brand-900">{dept.metrics.safetyScore}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-100">
                  <div className="h-full rounded-full" style={{ width: `${dept.metrics.safetyScore}%`, backgroundColor: dept.color }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-surface-600">
                    <GraduationCap className="h-3 w-3" /> CAPA closure
                  </span>
                  <span className="font-medium text-brand-900">{dept.metrics.closureRate}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-100">
                  <div className="h-full rounded-full" style={{ width: `${dept.metrics.closureRate}%`, backgroundColor: dept.color }} />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-surface-50 p-3 text-xs text-surface-600">
              {dept.metrics.totalCapas} total CAPAs tracked for this department, with {dept.metrics.highSeverityIncidents} high-severity incidents currently influencing the score.
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const [expandedDept, setExpandedDept] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedDepts, setSelectedDepts] = React.useState<string[]>([]);
  const [scoreFilter, setScoreFilter] = React.useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = React.useState<'score' | 'incidents' | 'name'>('score');
  const [dateRange, setDateRange] = React.useState<DateRange>('30d');

  const monthsByRange: Record<DateRange, number> = {
    '7d': 1,
    '30d': 1,
    '90d': 3,
    '1y': 12,
    all: 24,
  };

  const months = monthsByRange[dateRange];
  const indicatorPeriod = dateRange === '1y' || dateRange === 'all' ? 'year' : 'month';

  const { data: liveKPIs } = useKPIMetricsAnalytics();
  const { data: liveIncidentTrends } = useIncidentTrends({ months });
  const { data: liveDepartmentMetrics } = useDepartmentMetrics();
  const { data: liveSeverityBreakdown } = useSeverityBreakdown();
  const { data: executiveKpis } = useExecutiveKPIs();
  const { data: leadingIndicators } = useLeadingIndicatorsArray(indicatorPeriod);
  const { data: laggingIndicators } = useLaggingIndicators(indicatorPeriod);
  const { data: monthlyTrend } = useMonthlyTrend(months);

  const getDateRangeLabel = () => {
    const labels: Record<DateRange, string> = {
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      '1y': 'Last Year',
      all: 'All Time',
    };

    return labels[dateRange];
  };

  const previousSafetyScore = React.useMemo(() => {
    const score = executiveKpis?.safetyScore ?? 0;
    const delta = parseDeltaNumber(executiveKpis?.safetyScoreDelta);
    return clamp(Math.round(score - delta), 0, 100);
  }, [executiveKpis]);

  const kpiCards = React.useMemo<KpiCardData[]>(() => {
    return (liveKPIs ?? []).map((kpi) => ({
      id: kpi.id,
      label: kpi.label,
      value: formatKpiValue(kpi.value, kpi.unit),
      change: formatTrendLabel(kpi.trend),
      trend: kpi.trend === 'bad' ? 'down' : 'up',
      period: getDateRangeLabel(),
    }));
  }, [liveKPIs, dateRange]);

  const incidentTrendData = React.useMemo(() => {
    return (liveIncidentTrends ?? []).map((item) => ({
      name: item.month,
      incidents: item.total,
      nearMisses: item.nearMisses,
      critical: item.critical,
      resolved: Math.max(item.total - item.critical, 0),
    }));
  }, [liveIncidentTrends]);

  const severityBreakdown = React.useMemo(() => {
    const colors: Record<string, string> = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#f59e0b',
      low: '#10b981',
      CRITICAL: '#ef4444',
      HIGH: '#f97316',
      MEDIUM: '#f59e0b',
      LOW: '#10b981',
    };

    return (liveSeverityBreakdown ?? []).map((item) => ({
      name: item.severity,
      value: item.count,
      percentage: item.percentage,
      color: colors[item.severity] || '#6366f1',
    }));
  }, [liveSeverityBreakdown]);

  const qualityCategories = React.useMemo<QualityCategory[]>(() => {
    const totalIncidents = incidentTrendData.reduce((sum, item) => sum + item.incidents, 0);
    const highSeverityIncidents = (liveDepartmentMetrics ?? []).reduce((sum, item) => sum + item.highSeverityIncidents, 0);
    const avgClosureRate = (liveDepartmentMetrics ?? []).length > 0
      ? Math.round((liveDepartmentMetrics ?? []).reduce((sum, item) => sum + (item.capaClosureRate ?? 0), 0) / (liveDepartmentMetrics ?? []).length)
      : 0;
    const incidentControl = totalIncidents > 0
      ? clamp(Math.round(100 - (highSeverityIncidents / totalIncidents) * 100), 0, 100)
      : 100;

    return [
      { name: 'Safety Score', score: Math.round(executiveKpis?.safetyScore ?? 0), color: CATEGORY_COLORS[0] },
      { name: 'Compliance Readiness', score: Math.round(executiveKpis?.compliancePct ?? 0), color: CATEGORY_COLORS[1] },
      { name: 'CAPA Closure', score: avgClosureRate, color: CATEGORY_COLORS[2] },
      { name: 'Incident Control', score: incidentControl, color: CATEGORY_COLORS[3] },
    ].filter((category) => category.score > 0);
  }, [executiveKpis, incidentTrendData, liveDepartmentMetrics]);

  const qualityTrend = React.useMemo<QualityTrendPoint[]>(() => {
    return (monthlyTrend ?? []).map((item) => ({
      month: item.month,
      score: clamp(Math.round(100 - item.incidents * 4 + item.inspections * 0.6 + item.observations * 0.4), 40, 100),
    }));
  }, [monthlyTrend]);

  const complianceSummary = React.useMemo(() => {
    const departments = liveDepartmentMetrics ?? [];
    const healthy = departments.filter((item) => (item.capaClosureRate ?? 0) >= 80 && item.highSeverityIncidents === 0).length;
    const watch = departments.filter((item) => (item.capaClosureRate ?? 0) < 80 || item.highSeverityIncidents > 0).length;
    const overdue = executiveKpis?.overdueActions ?? 0;
    const byCategory: ComplianceCategory[] = departments.map((item) => ({
      category: item.department,
      compliant: Math.max(item.totalCapas - item.openCapas, 0),
      total: Math.max(item.totalCapas, 1),
      rate: Math.round(item.capaClosureRate ?? 0),
    }));

    return {
      rate: Math.round(executiveKpis?.compliancePct ?? 0),
      healthy,
      watch,
      overdue,
      byCategory,
    };
  }, [executiveKpis, liveDepartmentMetrics]);

  const baseDepartments = React.useMemo<DepartmentViewModel[]>(() => {
    return (liveDepartmentMetrics ?? []).map((department, index) => {
      const closureRate = Math.round(department.capaClosureRate ?? 0);
      const safetyScore = clamp(
        Math.round(100 - department.incidents * 5 - department.highSeverityIncidents * 8 - department.openCapas * 2 + closureRate * 0.25),
        55,
        99,
      );

      return {
        id: department.department,
        name: department.department,
        color: DEPT_COLORS[index % DEPT_COLORS.length],
        summaryLabel: `${department.totalCapas} backend CAPAs tracked`,
        metrics: {
          safetyScore,
          incidents: department.incidents,
          highSeverityIncidents: department.highSeverityIncidents,
          openActions: department.openCapas,
          closureRate,
          totalCapas: department.totalCapas,
        },
      };
    });
  }, [liveDepartmentMetrics]);

  const benchmarks = React.useMemo<BenchmarkItem[]>(() => {
    const benchmarkMap: Record<string, { industryAvg: number; target: number; unit: string }> = {
      trir: { industryAvg: 1.2, target: 0.8, unit: '' },
      ltir: { industryAvg: 0.25, target: 0.1, unit: '' },
      training: { industryAvg: 80, target: 90, unit: '%' },
      compliance: { industryAvg: 85, target: 90, unit: '%' },
      'audit-score': { industryAvg: 80, target: 85, unit: '/100' },
      'capa-closure': { industryAvg: 75, target: 80, unit: '%' },
    };

    return (liveKPIs ?? [])
      .filter((kpi) => kpi.value !== null && benchmarkMap[kpi.id])
      .map((kpi) => ({
        metric: kpi.label,
        current: Number(kpi.value),
        industryAvg: benchmarkMap[kpi.id].industryAvg,
        target: benchmarkMap[kpi.id].target,
        unit: benchmarkMap[kpi.id].unit || kpi.unit || '',
      }));
  }, [liveKPIs]);

  const monthlyActivity = React.useMemo(() => {
    return (monthlyTrend ?? []).map((item) => ({
      period: item.month,
      completed: item.inspections,
      observations: item.observations,
    }));
  }, [monthlyTrend]);

  const activityFeed = React.useMemo<ActivityEvent[]>(() => {
    const now = new Date();
    const topDepartment = [...baseDepartments].sort((a, b) => b.metrics.safetyScore - a.metrics.safetyScore)[0];
    const topSeverity = [...severityBreakdown].sort((a, b) => b.value - a.value)[0];
    const latestTrend = qualityTrend[qualityTrend.length - 1];

    return [
      executiveKpis && {
        id: 'exec-score',
        type: executiveKpis.overdueActions > 0 ? 'alert' : 'achievement',
        title: executiveKpis.overdueActions > 0 ? 'Overdue actions require follow-up' : 'Executive score remains on track',
        description: executiveKpis.overdueActions > 0
          ? `${executiveKpis.overdueActions} backend actions are overdue in the current analytics snapshot.`
          : `Safety score is holding at ${executiveKpis.safetyScore} with ${executiveKpis.openActions} open actions in flight.`,
        timestamp: now.toISOString(),
      },
      topDepartment && {
        id: 'top-dept',
        type: 'improvement',
        title: `${topDepartment.name} leads department performance`,
        description: `${topDepartment.name} is currently scoring ${topDepartment.metrics.safetyScore}% with ${topDepartment.metrics.openActions} open CAPAs.`,
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      },
      topSeverity && {
        id: 'severity-mix',
        type: topSeverity.name.toLowerCase().includes('critical') ? 'alert' : 'action',
        title: `${topSeverity.name} is the primary incident severity bucket`,
        description: `${topSeverity.value} incidents are currently grouped under ${topSeverity.name.toLowerCase()} severity in the live breakdown.`,
        timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      },
      latestTrend && {
        id: 'trend-snapshot',
        type: 'action',
        title: `${latestTrend.month} operational trend updated`,
        description: `Composite operational score for ${latestTrend.month} is ${latestTrend.score} based on inspections, observations, and incident totals.`,
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ].filter((event): event is ActivityEvent => Boolean(event));
  }, [baseDepartments, executiveKpis, qualityTrend, severityBreakdown]);

  const aiInsights = React.useMemo<InsightItem[]>(() => {
    const totalIncidents = incidentTrendData.reduce((sum, item) => sum + item.incidents, 0);
    const highSeverityIncidents = baseDepartments.reduce((sum, item) => sum + item.metrics.highSeverityIncidents, 0);
    const riskLevel = highSeverityIncidents === 0
      ? 'Low'
      : highSeverityIncidents <= Math.max(1, Math.round(totalIncidents * 0.2))
        ? 'Moderate'
        : 'High';
    const flaggedDepartments = baseDepartments.filter((item) => item.metrics.highSeverityIncidents > 0 || item.metrics.openActions > 3).length;
    const optimizationGap = clamp(100 - Math.round(executiveKpis?.compliancePct ?? 0), 0, 100);
    const indicatorCoverage = (leadingIndicators?.length ?? 0) + (laggingIndicators?.length ?? 0);

    return [
      { label: 'Predictive Risk Score', value: riskLevel, icon: Brain, color: riskLevel === 'High' ? 'text-red-400' : riskLevel === 'Moderate' ? 'text-yellow-400' : 'text-green-400' },
      { label: 'Flagged Departments', value: `${flaggedDepartments}`, icon: ShieldAlert, color: flaggedDepartments > 0 ? 'text-yellow-400' : 'text-green-400' },
      { label: 'Signal Coverage', value: `${indicatorCoverage} feeds`, icon: Zap, color: 'text-brand-400' },
    ];
  }, [baseDepartments, executiveKpis, incidentTrendData, laggingIndicators, leadingIndicators]);

  const toggleDepartment = (deptId: string) => {
    setExpandedDept(expandedDept === deptId ? null : deptId);
  };

  const toggleDeptSelection = (deptId: string) => {
    setSelectedDepts((current) => (
      current.includes(deptId)
        ? current.filter((id) => id !== deptId)
        : [...current, deptId]
    ));
  };

  const clearFilters = () => {
    setSelectedDepts([]);
    setScoreFilter('all');
    setSortBy('score');
    setDateRange('30d');
  };

  const hasActiveFilters = selectedDepts.length > 0 || scoreFilter !== 'all' || sortBy !== 'score' || dateRange !== '30d';

  const filteredDepartments = React.useMemo(() => {
    let result = [...baseDepartments];

    if (selectedDepts.length > 0) {
      result = result.filter((department) => selectedDepts.includes(department.id));
    }

    if (scoreFilter !== 'all') {
      result = result.filter((department) => scoreBucket(department.metrics.safetyScore) === scoreFilter);
    }

    if (sortBy === 'score') {
      result.sort((a, b) => b.metrics.safetyScore - a.metrics.safetyScore);
    } else if (sortBy === 'incidents') {
      result.sort((a, b) => b.metrics.incidents - a.metrics.incidents);
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [baseDepartments, scoreFilter, selectedDepts, sortBy]);

  const sortedDepartments = React.useMemo(
    () => [...baseDepartments].sort((a, b) => b.metrics.safetyScore - a.metrics.safetyScore),
    [baseDepartments],
  );

  const hasAnyAnalyticsData = kpiCards.length > 0 || incidentTrendData.length > 0 || baseDepartments.length > 0 || severityBreakdown.length > 0;

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      <div className="safe-top sticky top-[72px] z-50 flex h-16 items-center gap-3 border-b border-surface-200 bg-white/80 px-4 shadow-sm backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="-ml-2 rounded-full p-2 transition-colors hover:bg-surface-100">
          <ArrowLeft className="h-6 w-6 text-surface-600" />
        </button>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-brand-900">
          <Activity className="h-6 w-6 text-brand-600" />
          Analytics & KPIs
        </h1>
      </div>

      <main className="mx-auto max-w-md space-y-6 px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-surface-100 bg-white p-4 shadow-soft"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-500" />
              <span className="text-sm font-semibold text-brand-900">Date Range</span>
            </div>
            <span className="text-xs text-surface-500">{getDateRangeLabel()}</span>
          </div>
          <div className="flex gap-2">
            {[
              { value: '7d', label: '7D' },
              { value: '30d', label: '30D' },
              { value: '90d', label: '90D' },
              { value: '1y', label: '1Y' },
              { value: 'all', label: 'All' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value as DateRange)}
                className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
                  dateRange === option.value
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.div>

        {!hasAnyAnalyticsData && (
          <SectionEmptyState
            title="No backend analytics data is currently available"
            description="This page now depends on backend analytics endpoints. Populate KPI, incident, or department records to restore the dashboard."
          />
        )}

        {executiveKpis ? (
          <QualityScoreGauge score={Math.round(executiveKpis.safetyScore)} previousScore={previousSafetyScore} />
        ) : (
          <SectionEmptyState
            title="Executive analytics are unavailable"
            description="The backend executive KPI endpoint did not return a current safety score snapshot."
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-surface-100 bg-white p-5 shadow-soft"
        >
          <h3 className="mb-4 flex items-center gap-2 font-bold text-brand-900">
            <Shield className="h-5 w-5 text-brand-500" />
            Backend Quality Breakdown
          </h3>
          {qualityCategories.length > 0 ? (
            <div className="space-y-3">
              {qualityCategories.map((category, index) => (
                <div key={category.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-surface-700">{category.name}</span>
                    <span className="font-bold text-brand-900">{category.score}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${category.score}%` }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <SectionEmptyState
              title="No derived quality categories are available"
              description="Add backend KPI, incident, and department analytics data to populate the quality breakdown."
            />
          )}
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          {kpiCards.length > 0 ? (
            kpiCards.map((kpi, index) => <KPICard key={kpi.id} data={kpi} index={index} />)
          ) : (
            <div className="col-span-2">
              <SectionEmptyState
                title="No KPI cards are available"
                description="The backend KPI metrics endpoint returned no business metrics for the current range."
              />
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl border border-surface-100 bg-white p-5 shadow-soft"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-brand-900">
              <TrendingUp className="h-5 w-5 text-brand-500" />
              Operational Trend
            </h3>
            <span className="rounded-full bg-surface-100 px-2 py-1 text-xs font-medium text-surface-500">{getDateRangeLabel()}</span>
          </div>
          {qualityTrend.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qualityTrend}>
                  <defs>
                    <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis domain={[40, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="score" stroke="#14b8a6" fill="url(#colorQuality)" strokeWidth={0} />
                  <Line type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={3} dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#14b8a6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <SectionEmptyState
              title="No operational trend is available"
              description="The backend monthly trend endpoint returned no inspection, observation, or incident history for this range."
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-3xl border border-surface-100 bg-white p-5 shadow-soft"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-brand-900">
              <FileCheck className="h-5 w-5 text-brand-500" />
              Compliance & Action Status
            </h3>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${
              complianceSummary.rate >= 95 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {complianceSummary.rate}%
            </span>
          </div>

          {executiveKpis || complianceSummary.byCategory.length > 0 ? (
            <>
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{complianceSummary.healthy}</div>
                  <div className="text-xs text-emerald-700">Healthy</div>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">{complianceSummary.watch}</div>
                  <div className="text-xs text-amber-700">Watchlist</div>
                </div>
                <div className="rounded-xl bg-rose-50 p-3 text-center">
                  <div className="text-2xl font-bold text-rose-600">{complianceSummary.overdue}</div>
                  <div className="text-xs text-rose-700">Overdue Actions</div>
                </div>
              </div>

              <div className="space-y-2">
                {complianceSummary.byCategory.length > 0 ? (
                  complianceSummary.byCategory.map((category) => (
                    <div key={category.category} className="flex items-center justify-between rounded-lg bg-surface-50 p-2 text-sm">
                      <span className="font-medium text-surface-700">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-surface-500">{category.compliant}/{category.total}</span>
                        <span className={`font-bold ${category.rate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{category.rate}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <SectionEmptyState
                    title="No department compliance snapshot is available"
                    description="The backend department metrics endpoint returned no action-closure data."
                  />
                )}
              </div>
            </>
          ) : (
            <SectionEmptyState
              title="No compliance summary is available"
              description="The compliance status section depends on backend executive KPIs and department action metrics."
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          className="rounded-3xl border border-surface-100 bg-white p-5 shadow-soft"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-brand-900">
              <TrendingUp className="h-5 w-5 text-brand-500" />
              Incident Trend
            </h3>
            <span className="rounded-full bg-surface-100 px-2 py-1 text-xs font-medium text-surface-500">{getDateRangeLabel()}</span>
          </div>
          {incidentTrendData.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incidentTrendData}>
                  <defs>
                    <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="incidents" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIncidents)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <SectionEmptyState
              title="No incident trend data is available"
              description="The backend incident analytics endpoint returned no monthly incident history for this range."
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.54 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-brand-900">
              <Users className="h-5 w-5 text-brand-500" />
              Department Comparison
            </h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                hasActiveFilters ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                  {(selectedDepts.length > 0 ? 1 : 0) + (scoreFilter !== 'all' ? 1 : 0) + (sortBy !== 'score' ? 1 : 0) + (dateRange !== '30d' ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 rounded-2xl border border-surface-100 bg-white p-4 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-900">Filters</span>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                    <X className="h-3 w-3" /> Clear All
                  </button>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-surface-500">Select Departments</label>
                <div className="flex flex-wrap gap-2">
                  {baseDepartments.map((department) => (
                    <button
                      key={department.id}
                      onClick={() => toggleDeptSelection(department.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedDepts.includes(department.id)
                          ? 'text-white'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                      style={selectedDepts.includes(department.id) ? { backgroundColor: department.color } : {}}
                    >
                      {department.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-surface-500">Safety Score Range</label>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'high', label: '95%+' },
                    { value: 'medium', label: '85-94%' },
                    { value: 'low', label: '<85%' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setScoreFilter(option.value as 'all' | 'high' | 'medium' | 'low')}
                      className={`flex-1 rounded-xl px-2 py-2 text-xs font-medium transition-all ${
                        scoreFilter === option.value ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-surface-500">Sort By</label>
                <div className="flex gap-2">
                  {[
                    { value: 'score', label: 'Safety Score' },
                    { value: 'incidents', label: 'Incidents' },
                    { value: 'name', label: 'Name' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as 'score' | 'incidents' | 'name')}
                      className={`flex-1 rounded-xl px-2 py-2 text-xs font-medium transition-all ${
                        sortBy === option.value ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {sortedDepartments.length > 0 ? (
            <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-semibold text-brand-900">Top Performers</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sortedDepartments.slice(0, 3).map((department, index) => (
                  <div key={department.id} className="flex flex-shrink-0 items-center gap-2 rounded-xl border border-surface-100 bg-white px-3 py-2">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-surface-200 text-surface-600' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-brand-900">{department.name}</span>
                    <span className="text-xs font-bold text-emerald-600">{department.metrics.safetyScore}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <SectionEmptyState
              title="No department analytics are available"
              description="The department comparison section now depends entirely on backend department metrics."
            />
          )}

          {hasActiveFilters && baseDepartments.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-surface-500">
              <Filter className="h-3 w-3" />
              Showing {filteredDepartments.length} of {baseDepartments.length} departments
            </div>
          )}

          {filteredDepartments.length > 0 ? (
            filteredDepartments.map((department, index) => (
              <DepartmentCard
                key={department.id}
                dept={department}
                isExpanded={expandedDept === department.id}
                onToggle={() => toggleDepartment(department.id)}
                index={index}
              />
            ))
          ) : baseDepartments.length > 0 ? (
            <div className="rounded-2xl border border-surface-100 bg-white p-8 text-center shadow-soft">
              <Filter className="mx-auto mb-3 h-10 w-10 text-surface-300" />
              <p className="font-medium text-surface-600">No departments match your filters</p>
              <p className="mt-1 text-sm text-surface-400">Try adjusting your filter criteria.</p>
              <button onClick={clearFilters} className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600">
                Clear Filters
              </button>
            </div>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.56 }}
          className="rounded-3xl border border-surface-100 bg-white p-5 shadow-soft"
        >
          <h3 className="mb-4 flex items-center gap-2 font-bold text-brand-900">
            <Target className="h-5 w-5 text-brand-500" />
            Performance vs Industry
          </h3>
          {benchmarks.length > 0 ? (
            <div className="space-y-2">
              {benchmarks.map((benchmark, index) => (
                <BenchmarkRow key={`${benchmark.metric}-${index}`} benchmark={benchmark} index={index} />
              ))}
            </div>
          ) : (
            <SectionEmptyState
              title="No benchmark comparison is available"
              description="The benchmark section now reads directly from backend KPI metrics instead of mock industry cards."
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-3xl border border-surface-100 bg-white p-5 shadow-soft"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-brand-900">
              <PieChartIcon className="h-5 w-5 text-brand-500" />
              Incidents by Severity
            </h3>
          </div>
          {severityBreakdown.length > 0 ? (
            <>
              <div className="flex h-56 w-full items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {severityBreakdown.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {severityBreakdown.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-surface-600">{entry.name}</span>
                    <span className="ml-auto font-bold text-surface-900">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <SectionEmptyState
              title="No severity breakdown is available"
              description="The backend severity breakdown endpoint returned no incident severity distribution."
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="rounded-3xl border border-surface-100 bg-white p-5 shadow-soft"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-brand-900">
              <BarChart3 className="h-5 w-5 text-brand-500" />
              Inspection Throughput
            </h3>
          </div>
          {monthlyActivity.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <SectionEmptyState
              title="No inspection throughput is available"
              description="The throughput chart depends on backend monthly trend data instead of mock weekly inspection counts."
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-brand-900">
              <Clock className="h-5 w-5 text-brand-500" />
              Recent Activity
            </h3>
            <button className="flex items-center gap-1 text-sm font-medium text-brand-600">
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {activityFeed.length > 0 ? (
            activityFeed.map((event, index) => <QualityEventCard key={event.id} event={event} index={index} />)
          ) : (
            <SectionEmptyState
              title="No recent activity is available"
              description="Recent activity cards are now synthesized from backend analytics snapshots and require current KPI or incident data."
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-900 to-brand-950 p-6 text-white shadow-xl"
        >
          <div className="relative z-10">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md">
                <Sparkles className="h-6 w-6 text-brand-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold">AI Safety Insights</h3>
                <p className="text-xs text-brand-300">Derived from live analytics signals</p>
              </div>
            </div>

            {aiInsights.length > 0 ? (
              <div className="space-y-4">
                {aiInsights.map((insight) => (
                  <div key={insight.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <insight.icon className={`h-5 w-5 ${insight.color}`} />
                      <span className="text-sm font-medium text-brand-100">{insight.label}</span>
                    </div>
                    <span className="font-bold">{insight.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-brand-100">
                AI insights are waiting for backend analytics inputs before a summary can be generated.
              </div>
            )}

            <button className="mt-6 w-full rounded-xl bg-white py-3 text-sm font-bold text-brand-900 transition-all hover:bg-brand-50">
              Refresh AI Summary
            </button>
          </div>
          <Sparkles className="absolute bottom-[-20px] right-[-20px] h-48 w-48 rotate-12 text-white/5" />
        </motion.div>
      </main>
    </div>
  );
};
