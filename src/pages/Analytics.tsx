import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, PieChart as PieChartIcon, BarChart3, Award, Shield, CheckCircle2, AlertTriangle, Target, Clock, Sparkles, Brain, ShieldAlert, Zap, FileCheck, Star, ChevronRight, Users, Building2, AlertCircle, GraduationCap, ChevronDown, ChevronUp, Filter, X, SlidersHorizontal, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, RadialBarChart, RadialBar, Legend, LineChart, Line } from 'recharts';
import { kpiData, incidentsByMonth, incidentsByCategory, inspectionCompletionData, qualityMetrics, qualityEvents, complianceSummary, performanceBenchmarks, departmentComparison } from '../data/mockAnalytics';
import {
  useKPIMetricsAnalytics,
  useIncidentTrends,
  useDepartmentMetrics,
  useSeverityBreakdown,
} from '../api/hooks/useAPIHooks';

// Colors used per department in backend-driven cards
const DEPT_COLORS = ['#14b8a6','#6366f1','#f59e0b','#ef4444','#10b981','#8b5cf6','#0ea5e9','#f97316'];

const KPICard = ({ data, index }: { data: any, index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white p-4 rounded-2xl shadow-soft border border-surface-100"
  >
    <div className="flex justify-between items-start mb-2">
      <span className="text-surface-500 text-sm font-medium">{data.label}</span>
      <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${
        data.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
      }`}>
        {data.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {data.change}
      </div>
    </div>
    <div className="text-2xl font-bold text-brand-900">{data.value}</div>
    <div className="text-xs text-surface-400 mt-1">{data.period}</div>
  </motion.div>
);

const QualityScoreGauge = ({ score, previousScore }: { score: number, previousScore: number }) => {
  const data = [{ name: 'Score', value: score, fill: score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444' }];
  const diff = score - previousScore;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-brand-900 to-brand-950 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
            <Award className="w-7 h-7 text-brand-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Quality Score</h3>
            <p className="text-brand-300 text-xs">Overall Performance</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${
          diff > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
        }`}>
          {diff > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {diff > 0 ? '+' : ''}{diff}%
        </div>
      </div>
      
      <div className="flex items-center justify-center relative">
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
            <RadialBar
              background={{ fill: 'rgba(255,255,255,0.1)' }}
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold">{score}</span>
          <span className="text-brand-300 text-sm">out of 100</span>
        </div>
      </div>
      
      <div className="absolute right-[-30px] bottom-[-30px] w-40 h-40 bg-white/5 rounded-full blur-2xl" />
    </motion.div>
  );
};

const QualityEventCard = ({ event, index }: { event: any, index: number }) => {
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
  const Icon = icons[event.type as keyof typeof icons] || CheckCircle2;
  const colorClass = colors[event.type as keyof typeof colors] || colors.improvement;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start gap-3 p-4 bg-white rounded-2xl shadow-soft border border-surface-100"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-brand-900 text-sm">{event.title}</h4>
        <p className="text-surface-500 text-xs mt-0.5 line-clamp-2">{event.description}</p>
        <span className="text-surface-400 text-xs mt-1 block">
          {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
};

const BenchmarkRow = ({ benchmark, index }: { benchmark: any, index: number }) => {
  const isAboveTarget = benchmark.current >= benchmark.target;
  const isBetterThanIndustry = benchmark.metric === 'TRIR' || benchmark.metric === 'LTIR' 
    ? benchmark.current < benchmark.industryAvg 
    : benchmark.current > benchmark.industryAvg;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex items-center justify-between p-3 bg-surface-50 rounded-xl"
    >
      <div className="flex items-center gap-3">
        <div className={`w-2 h-8 rounded-full ${isAboveTarget ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <div>
          <span className="font-medium text-brand-900 text-sm">{benchmark.metric}</span>
          <div className="text-xs text-surface-500">{benchmark.unit}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-bold text-brand-900">{benchmark.current}</div>
          <div className={`text-xs ${isBetterThanIndustry ? 'text-emerald-600' : 'text-surface-500'}`}>
            vs {benchmark.industryAvg} avg
          </div>
        </div>
        <Target className={`w-5 h-5 ${isAboveTarget ? 'text-emerald-500' : 'text-amber-500'}`} />
      </div>
    </motion.div>
  );
};

const DepartmentCard = ({ dept, isExpanded, onToggle, index }: { dept: any, isExpanded: boolean, onToggle: () => void, index: number }) => {
  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-emerald-600 bg-emerald-50';
    if (score >= 90) return 'text-blue-600 bg-blue-50';
    if (score >= 85) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-3 h-3 text-emerald-500" />;
    if (trend < 0) return <TrendingDown className="w-3 h-3 text-rose-500" />;
    return <span className="w-3 h-3 text-surface-400">—</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white rounded-2xl shadow-soft border border-surface-100 overflow-hidden"
    >
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-surface-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${dept.color}15` }}
          >
            <Building2 className="w-5 h-5" style={{ color: dept.color }} />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-brand-900">{dept.name}</h4>
            <span className="text-xs text-surface-500">{dept.employees} employees</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${getScoreColor(dept.metrics.safetyScore)}`}>
            {dept.metrics.safetyScore}%
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-surface-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-surface-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-surface-100"
        >
          <div className="p-4 space-y-4">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-surface-50 rounded-xl">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-lg font-bold text-brand-900">{dept.metrics.incidents}</span>
                  {getTrendIcon(dept.trend.incidents * -1)}
                </div>
                <div className="text-xs text-surface-500">Incidents</div>
              </div>
              <div className="text-center p-2 bg-surface-50 rounded-xl">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-lg font-bold text-brand-900">{dept.metrics.nearMisses}</span>
                </div>
                <div className="text-xs text-surface-500">Near Misses</div>
              </div>
              <div className="text-center p-2 bg-surface-50 rounded-xl">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-lg font-bold text-brand-900">{dept.metrics.openActions}</span>
                </div>
                <div className="text-xs text-surface-500">Open Actions</div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-surface-600 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Training
                  </span>
                  <span className="font-medium text-brand-900">{dept.metrics.trainingCompletion}%</span>
                </div>
                <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ width: `${dept.metrics.trainingCompletion}%`, backgroundColor: dept.color }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-surface-600 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Compliance
                  </span>
                  <span className="font-medium text-brand-900">{dept.metrics.complianceRate}%</span>
                </div>
                <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ width: `${dept.metrics.complianceRate}%`, backgroundColor: dept.color }}
                  />
                </div>
              </div>
            </div>

            {/* Mini Incident Trend */}
            <div className="pt-2">
              <div className="text-xs text-surface-500 mb-2">Incident Trend (5 months)</div>
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dept.monthlyIncidents}>
                    <Bar dataKey="count" fill={dept.color} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
  const [dateRange, setDateRange] = React.useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  // ── Real API Data ───────────────────────────────────────────────────────
  const { data: liveKPIs } = useKPIMetricsAnalytics();
  const { data: liveIncidentTrends } = useIncidentTrends({ months: 12 });
  const { data: liveDepartmentMetrics } = useDepartmentMetrics();
  const { data: liveSeverityBreakdown } = useSeverityBreakdown();

  // ── Merged Data (real API + mock fallback) ──────────────────────────────
  // KPI data: prefer live KPIs if available, else fallback to mock
  const mergedKPIData = React.useMemo(() => {
    if (liveKPIs && liveKPIs.length > 0) {
      return liveKPIs.map((kpi: any, idx: number) => ({
        label: kpi.label,
        value: kpi.value !== null ? String(kpi.value) + (kpi.unit ? kpi.unit : '') : 'N/A',
        change: kpi.trend === 'good' ? '+Improving' : kpi.trend === 'bad' ? '-Declining' : 'Stable',
        trend: kpi.trend === 'bad' ? 'down' : 'up',
        period: 'YTD',
        icon: kpiData[idx % kpiData.length]?.icon,
        color: kpiData[idx % kpiData.length]?.color,
      }));
    }
    return kpiData;
  }, [liveKPIs]);

  // Incident trends: prefer live data
  const mergedIncidentsByMonth = React.useMemo(() => {
    if (liveIncidentTrends && liveIncidentTrends.length > 0) {
      return liveIncidentTrends.map((item: any) => ({
        name: item.month,
        month: item.month,
        incidents: item.total,
        nearMisses: item.nearMisses,
        critical: item.critical,
        resolved: item.total - item.critical,
      }));
    }
    return incidentsByMonth;
  }, [liveIncidentTrends]);

  // Severity breakdown for pie chart
  const mergedIncidentsByCategory = React.useMemo(() => {
    if (liveSeverityBreakdown && liveSeverityBreakdown.length > 0) {
      const colors: Record<string, string> = {
        critical: '#ef4444', high: '#f97316', medium: '#f59e0b',
        low: '#10b981', CRITICAL: '#ef4444', HIGH: '#f97316',
        MEDIUM: '#f59e0b', LOW: '#10b981',
      };
      return liveSeverityBreakdown.map((item: any) => ({
        name: item.severity,
        value: item.count,
        color: colors[item.severity] || '#6366f1',
      }));
    }
    return incidentsByCategory;
  }, [liveSeverityBreakdown]);

  const toggleDepartment = (deptId: string) => {
    setExpandedDept(expandedDept === deptId ? null : deptId);
  };

  const toggleDeptSelection = (deptId: string) => {
    setSelectedDepts(prev => 
      prev.includes(deptId) 
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const clearFilters = () => {
    setSelectedDepts([]);
    setScoreFilter('all');
    setSortBy('score');
    setDateRange('30d');
  };

  const hasActiveFilters = selectedDepts.length > 0 || scoreFilter !== 'all' || sortBy !== 'score' || dateRange !== '30d';

  // Get date range label for display
  const getDateRangeLabel = () => {
    const labels: Record<string, string> = {
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      '1y': 'Last Year',
      'all': 'All Time'
    };
    return labels[dateRange];
  };

  // Filter and sort departments - prefer backend data, fall back to mock
  const baseDepartments = React.useMemo(() => {
    if (liveDepartmentMetrics && liveDepartmentMetrics.length > 0) {
      return liveDepartmentMetrics.map((d: any, idx: number) => ({
        id: d.department,
        name: d.department,
        color: DEPT_COLORS[idx % DEPT_COLORS.length],
        employees: 0,
        metrics: {
          safetyScore: typeof d.safetyScore === 'number' ? d.safetyScore : 90,
          incidents: d.incidents ?? 0,
          nearMisses: 0,
          openActions: (d.openCapas ?? 0),
          trainingCompletion: d.trainingCompletion ?? 0,
          complianceRate: d.complianceRate ?? 0,
        },
        trend: { incidents: 0, safetyScore: 0 },
        monthlyIncidents: [],
      }));
    }
    return departmentComparison;
  }, [liveDepartmentMetrics]);

  const filteredDepartments = React.useMemo(() => {
    let result = [...baseDepartments];
    
    // Filter by selected departments
    if (selectedDepts.length > 0) {
      result = result.filter(d => selectedDepts.includes(d.id));
    }
    
    // Filter by score range
    if (scoreFilter === 'high') {
      result = result.filter(d => d.metrics.safetyScore >= 95);
    } else if (scoreFilter === 'medium') {
      result = result.filter(d => d.metrics.safetyScore >= 85 && d.metrics.safetyScore < 95);
    } else if (scoreFilter === 'low') {
      result = result.filter(d => d.metrics.safetyScore < 85);
    }
    
    // Sort
    if (sortBy === 'score') {
      result.sort((a, b) => b.metrics.safetyScore - a.metrics.safetyScore);
    } else if (sortBy === 'incidents') {
      result.sort((a, b) => b.metrics.incidents - a.metrics.incidents);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return result;
  }, [baseDepartments, selectedDepts, scoreFilter, sortBy]);

  // Sort departments by safety score for ranking (always use full list)
  const sortedDepartments = React.useMemo(
    () => [...baseDepartments].sort((a, b) => b.metrics.safetyScore - a.metrics.safetyScore),
    [baseDepartments]
  );

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-[72px] z-50 px-4 h-16 flex items-center gap-3 safe-top border-b border-surface-200">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-surface-600" />
        </button>
        <h1 className="text-xl font-bold text-brand-900 flex items-center gap-2 tracking-tight">
          <Activity className="w-6 h-6 text-brand-600" />
          Analytics & KPIs
        </h1>
      </div>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Global Date Range Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-2xl shadow-soft border border-surface-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              <span className="font-semibold text-brand-900 text-sm">Date Range</span>
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
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value as any)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
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

        {/* Quality Score Hero */}
        <QualityScoreGauge score={qualityMetrics.overallScore} previousScore={qualityMetrics.previousScore} />

        {/* Quality Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-5 rounded-3xl shadow-soft border border-surface-100"
        >
          <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-500" />
            Quality Breakdown
          </h3>
          <div className="space-y-3">
            {qualityMetrics.categories.map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-surface-700 font-medium">{cat.name}</span>
                  <span className="font-bold text-brand-900">{cat.score}%</span>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.score}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-4">
          {mergedKPIData.map((kpi: any, index: number) => (
            <KPICard key={kpi.id || index} data={kpi} index={index} />
          ))}
        </div>

        {/* Quality Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-5 rounded-3xl shadow-soft border border-surface-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-brand-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              Quality Score Trend
            </h3>
            <span className="text-xs font-medium text-surface-500 bg-surface-100 px-2 py-1 rounded-full">{getDateRangeLabel()}</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qualityMetrics.monthlyTrend}>
                <defs>
                  <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="score" stroke="#14b8a6" fill="url(#colorQuality)" strokeWidth={0} />
                <Line type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={3} dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#14b8a6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Compliance Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-5 rounded-3xl shadow-soft border border-surface-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-brand-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-brand-500" />
              Compliance Status
            </h3>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              complianceSummary.rate >= 95 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {complianceSummary.rate}%
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-emerald-50 rounded-xl">
              <div className="text-2xl font-bold text-emerald-600">{complianceSummary.compliant}</div>
              <div className="text-xs text-emerald-700">Compliant</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl">
              <div className="text-2xl font-bold text-amber-600">{complianceSummary.inProgress}</div>
              <div className="text-xs text-amber-700">In Progress</div>
            </div>
            <div className="text-center p-3 bg-rose-50 rounded-xl">
              <div className="text-2xl font-bold text-rose-600">{complianceSummary.overdue}</div>
              <div className="text-xs text-rose-700">Overdue</div>
            </div>
          </div>
          
          <div className="space-y-2">
            {complianceSummary.byCategory.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-2 bg-surface-50 rounded-lg">
                <span className="font-medium text-surface-700">{cat.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-surface-500">{cat.compliant}/{cat.total}</span>
                  <span className={`font-bold ${cat.rate >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>{cat.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Incidents Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-5 rounded-3xl shadow-soft border border-surface-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-brand-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              Incidents Trend
            </h3>
            <span className="text-xs font-medium text-surface-500 bg-surface-100 px-2 py-1 rounded-full">{getDateRangeLabel()}</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mergedIncidentsByMonth}>
                <defs>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="incidents" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIncidents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Department Comparison - NEW SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-500" />
              Department Comparison
            </h3>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                hasActiveFilters 
                  ? 'bg-brand-500 text-white' 
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">
                  {(selectedDepts.length > 0 ? 1 : 0) + (scoreFilter !== 'all' ? 1 : 0) + (sortBy !== 'score' ? 1 : 0) + (dateRange !== '30d' ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white p-4 rounded-2xl shadow-soft border border-surface-100 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-900">Filters</span>
                {hasActiveFilters && (
                  <button 
                    onClick={clearFilters}
                    className="text-xs text-brand-600 font-medium flex items-center gap-1 hover:text-brand-700"
                  >
                    <X className="w-3 h-3" /> Clear All
                  </button>
                )}
              </div>
              
              {/* Department Selection */}
              <div>
                <label className="text-xs text-surface-500 font-medium mb-2 block">Select Departments</label>
                <div className="flex flex-wrap gap-2">
                  {departmentComparison.map(dept => (
                    <button
                      key={dept.id}
                      onClick={() => toggleDeptSelection(dept.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedDepts.includes(dept.id)
                          ? 'text-white'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                      style={selectedDepts.includes(dept.id) ? { backgroundColor: dept.color } : {}}
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Score Range Filter */}
              <div>
                <label className="text-xs text-surface-500 font-medium mb-2 block">Safety Score Range</label>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'high', label: '95%+', color: 'emerald' },
                    { value: 'medium', label: '85-94%', color: 'amber' },
                    { value: 'low', label: '<85%', color: 'rose' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setScoreFilter(option.value as any)}
                      className={`flex-1 px-2 py-2 rounded-xl text-xs font-medium transition-all ${
                        scoreFilter === option.value
                          ? option.value === 'high' ? 'bg-emerald-500 text-white'
                            : option.value === 'medium' ? 'bg-amber-500 text-white'
                            : option.value === 'low' ? 'bg-rose-500 text-white'
                            : 'bg-brand-500 text-white'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Sort By */}
              <div>
                <label className="text-xs text-surface-500 font-medium mb-2 block">Sort By</label>
                <div className="flex gap-2">
                  {[
                    { value: 'score', label: 'Safety Score' },
                    { value: 'incidents', label: 'Incidents' },
                    { value: 'name', label: 'Name' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as any)}
                      className={`flex-1 px-2 py-2 rounded-xl text-xs font-medium transition-all ${
                        sortBy === option.value
                          ? 'bg-brand-500 text-white'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Department Rankings Summary */}
          <div className="bg-gradient-to-br from-brand-50 to-white p-4 rounded-2xl border border-brand-100">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-brand-600" />
              <span className="text-sm font-semibold text-brand-900">Top Performers</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sortedDepartments.slice(0, 3).map((dept, i) => (
                <div 
                  key={dept.id}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-surface-100 flex-shrink-0"
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-surface-200 text-surface-600' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-brand-900">{dept.name}</span>
                  <span className="text-xs font-bold text-emerald-600">{dept.metrics.safetyScore}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Results Count */}
          {hasActiveFilters && (
            <div className="text-xs text-surface-500 flex items-center gap-2">
              <Filter className="w-3 h-3" />
              Showing {filteredDepartments.length} of {departmentComparison.length} departments
            </div>
          )}

          {/* Department Cards */}
          {filteredDepartments.length > 0 ? (
            filteredDepartments.map((dept, index) => (
              <DepartmentCard
                key={dept.id}
                dept={dept}
                isExpanded={expandedDept === dept.id}
                onToggle={() => toggleDepartment(dept.id)}
                index={index}
              />
            ))
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-soft border border-surface-100 text-center">
              <Filter className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-600 font-medium">No departments match your filters</p>
              <p className="text-surface-400 text-sm mt-1">Try adjusting your filter criteria</p>
              <button 
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </motion.div>

        {/* Performance Benchmarks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-white p-5 rounded-3xl shadow-soft border border-surface-100"
        >
          <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-500" />
            Performance vs Industry
          </h3>
          <div className="space-y-2">
            {performanceBenchmarks.map((benchmark, i) => (
              <BenchmarkRow key={i} benchmark={benchmark} index={i} />
            ))}
          </div>
        </motion.div>

        {/* Incidents by Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-5 rounded-3xl shadow-soft border border-surface-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-brand-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-brand-500" />
              Incidents by Type
            </h3>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mergedIncidentsByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mergedIncidentsByCategory.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {mergedIncidentsByCategory.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-surface-600">{entry.name}</span>
                <span className="font-bold text-surface-900 ml-auto">{entry.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Inspections Weekly */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="bg-white p-5 rounded-3xl shadow-soft border border-surface-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-brand-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-500" />
              Inspections (Weekly)
            </h3>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inspectionCompletionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Quality Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-500" />
              Recent Activity
            </h3>
            <button className="text-brand-600 text-sm font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {qualityEvents.map((event, index) => (
            <QualityEventCard key={event.id} event={event} index={index} />
          ))}
        </motion.div>

        {/* AI Advanced Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-brand-900 to-brand-950 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <Sparkles className="w-6 h-6 text-brand-300" />
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Safety Insights</h3>
                <p className="text-brand-300 text-xs">Advanced Pattern Recognition</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Predictive Risk Score', value: 'Low', icon: Brain, color: 'text-green-400' },
                { label: 'Anomaly Detection', value: '2 Flagged', icon: ShieldAlert, color: 'text-yellow-400' },
                { label: 'Optimization Potential', value: '+15%', icon: Zap, color: 'text-brand-400' },
              ].map((insight, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <insight.icon className={`w-5 h-5 ${insight.color}`} />
                    <span className="text-sm font-medium text-brand-100">{insight.label}</span>
                  </div>
                  <span className="font-bold">{insight.value}</span>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-3 bg-white text-brand-900 rounded-xl font-bold text-sm hover:bg-brand-50 transition-all">
              Generate Detailed AI Report
            </button>
          </div>
          <Sparkles className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/5 rotate-12" />
        </motion.div>
      </main>
    </div>
  );
};
