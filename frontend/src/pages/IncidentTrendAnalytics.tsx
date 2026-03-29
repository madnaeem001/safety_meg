import React, { useState, useMemo, useEffect } from 'react';
import { incidentAnalyticsService } from '../api/services/apiService';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  LineChart as LineChartIcon,
  AlertTriangle,
  Activity,
  Clock,
  Target,
  Building2,
  Flame,
  Eye,
  Layers,
  ChevronDown,
  Download,
  RefreshCw,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import { SMButton } from '../components/ui';

// ============================================
// HISTORICAL INCIDENT DATA
// ============================================

// Monthly incident data for trends
const monthlyTrendData = [
  { month: 'Aug 2025', injuries: 8, nearMisses: 12, propertyDamage: 3, environmental: 1, fire: 0, vehicle: 2, total: 26 },
  { month: 'Sep 2025', injuries: 6, nearMisses: 15, propertyDamage: 4, environmental: 2, fire: 1, vehicle: 1, total: 29 },
  { month: 'Oct 2025', injuries: 9, nearMisses: 11, propertyDamage: 2, environmental: 1, fire: 0, vehicle: 3, total: 26 },
  { month: 'Nov 2025', injuries: 5, nearMisses: 18, propertyDamage: 5, environmental: 0, fire: 1, vehicle: 2, total: 31 },
  { month: 'Dec 2025', injuries: 7, nearMisses: 14, propertyDamage: 3, environmental: 2, fire: 0, vehicle: 1, total: 27 },
  { month: 'Jan 2026', injuries: 4, nearMisses: 16, propertyDamage: 2, environmental: 1, fire: 1, vehicle: 2, total: 26 },
  { month: 'Feb 2026', injuries: 3, nearMisses: 19, propertyDamage: 4, environmental: 1, fire: 0, vehicle: 1, total: 28 },
];

// Weekly data for detailed view
const weeklyTrendData = [
  { week: 'Week 1', injuries: 2, nearMisses: 4, total: 8 },
  { week: 'Week 2', injuries: 1, nearMisses: 5, total: 7 },
  { week: 'Week 3', injuries: 0, nearMisses: 6, total: 9 },
  { week: 'Week 4', injuries: 0, nearMisses: 4, total: 4 },
];

// Incident by type for pie chart
const incidentsByType = [
  { name: 'Injuries', value: 42, color: '#ef4444' },
  { name: 'Near Misses', value: 105, color: '#f59e0b' },
  { name: 'Property Damage', value: 23, color: '#3b82f6' },
  { name: 'Environmental', value: 8, color: '#22c55e' },
  { name: 'Fire', value: 3, color: '#f97316' },
  { name: 'Vehicle', value: 12, color: '#8b5cf6' },
];

// Incident by severity
const incidentsBySeverity = [
  { name: 'Critical', value: 5, color: '#dc2626' },
  { name: 'High', value: 28, color: '#f97316' },
  { name: 'Medium', value: 87, color: '#eab308' },
  { name: 'Low', value: 73, color: '#22c55e' },
];

// Department breakdown
const incidentsByDepartment = [
  { department: 'Production', incidents: 68, injuries: 18, nearMisses: 35, trend: 'down' },
  { department: 'Logistics', incidents: 52, injuries: 12, nearMisses: 28, trend: 'up' },
  { department: 'Maintenance', incidents: 34, injuries: 8, nearMisses: 18, trend: 'stable' },
  { department: 'R&D', incidents: 18, injuries: 3, nearMisses: 12, trend: 'down' },
  { department: 'Administration', incidents: 12, injuries: 1, nearMisses: 8, trend: 'stable' },
  { department: 'General', incidents: 9, injuries: 0, nearMisses: 4, trend: 'down' },
];

// Day of week analysis
const incidentsByDayOfWeek = [
  { day: 'Mon', incidents: 32, average: 4.6 },
  { day: 'Tue', incidents: 38, average: 5.4 },
  { day: 'Wed', incidents: 35, average: 5.0 },
  { day: 'Thu', incidents: 41, average: 5.9 },
  { day: 'Fri', incidents: 28, average: 4.0 },
  { day: 'Sat', incidents: 12, average: 1.7 },
  { day: 'Sun', incidents: 7, average: 1.0 },
];

// Time of day analysis
const incidentsByTimeOfDay = [
  { time: '6-9 AM', incidents: 28, percentage: 14.5 },
  { time: '9-12 PM', incidents: 52, percentage: 26.9 },
  { time: '12-3 PM', incidents: 48, percentage: 24.9 },
  { time: '3-6 PM', incidents: 38, percentage: 19.7 },
  { time: '6-9 PM', incidents: 18, percentage: 9.3 },
  { time: '9-12 AM', incidents: 9, percentage: 4.7 },
];

// Root cause categories
const rootCauseData = [
  { cause: 'Human Error', count: 72, percentage: 37 },
  { cause: 'Equipment Failure', count: 38, percentage: 20 },
  { cause: 'Process Gap', count: 31, percentage: 16 },
  { cause: 'Environmental', count: 24, percentage: 12 },
  { cause: 'Training Gap', count: 18, percentage: 9 },
  { cause: 'Other', count: 10, percentage: 5 },
];

// Leading indicators
const leadingIndicators = [
  { name: 'Near Miss Ratio', current: 2.5, target: 3.0, trend: 'up', unit: 'per injury' },
  { name: 'Training Completion', current: 94, target: 100, trend: 'up', unit: '%' },
  { name: 'Inspection Rate', current: 87, target: 95, trend: 'stable', unit: '%' },
  { name: 'Hazard Close Rate', current: 72, target: 85, trend: 'down', unit: '%' },
];

// ============================================
// COMPONENT
// ============================================

export default function IncidentTrendAnalytics() {
  const navigate = useNavigate();
  
  // State
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '6months' | 'year'>('6months');
  const [chartView, setChartView] = useState<'trends' | 'breakdown' | 'analysis'>('trends');
  const [showComparison, setShowComparison] = useState(true);

  // API-driven chart data (initialized to static fallbacks for instant first render)
  const [monthlyData, setMonthlyData] = useState(monthlyTrendData);
  const [weeklyData, setWeeklyData] = useState(weeklyTrendData);
  const [typeData, setTypeData] = useState(incidentsByType);
  const [severityData, setSeverityData] = useState(incidentsBySeverity);
  const [deptData, setDeptData] = useState(incidentsByDepartment);
  const [dowData, setDowData] = useState(incidentsByDayOfWeek);
  const [todData, setTodData] = useState(incidentsByTimeOfDay);
  const [rcData, setRcData] = useState(rootCauseData);
  const [liData, setLiData] = useState(leadingIndicators);
  const [apiStats, setApiStats] = useState<null | {
    totalIncidents: number; totalInjuries: number;
    incidentChange: number; injuryChange: number;
    trir: number; trirChange: number; nearMissRatio: string;
  }>(null);

  // Fetch all analytics data whenever timeRange changes
  useEffect(() => {
    const params = { timeRange };
    Promise.all([
      incidentAnalyticsService.getKPIs(params),
      incidentAnalyticsService.getMonthlyTrend({ months: 7 }),
      incidentAnalyticsService.getWeeklyTrend(),
      incidentAnalyticsService.getByType(params),
      incidentAnalyticsService.getBySeverity(params),
      incidentAnalyticsService.getByDepartment(params),
      incidentAnalyticsService.getByDayOfWeek(params),
      incidentAnalyticsService.getByTimeOfDay(params),
      incidentAnalyticsService.getRootCauses(params),
      incidentAnalyticsService.getLeadingIndicators(params),
    ]).then(([kpisRes, monthlyRes, weeklyRes, typeRes, sevRes, deptRes, dowRes, todRes, rcRes, liRes]) => {
      if (kpisRes.success && kpisRes.data) {
        const k = kpisRes.data;
        setApiStats({
          totalIncidents: k.totalIncidents,
          totalInjuries: k.totalInjuries,
          incidentChange: k.incidentChange,
          injuryChange: k.injuryChange,
          trir: k.trir,
          trirChange: k.trirChange,
          nearMissRatio: String(k.nearMissRatio),
        });
      }
      if (monthlyRes.success && monthlyRes.data?.length) setMonthlyData(monthlyRes.data as typeof monthlyTrendData);
      if (weeklyRes.success  && weeklyRes.data?.length)  setWeeklyData(weeklyRes.data as typeof weeklyTrendData);
      if (typeRes.success    && typeRes.data?.length)    setTypeData(typeRes.data as typeof incidentsByType);
      if (sevRes.success     && sevRes.data?.length)     setSeverityData(sevRes.data as typeof incidentsBySeverity);
      if (deptRes.success    && deptRes.data?.length)    setDeptData(deptRes.data as typeof incidentsByDepartment);
      if (dowRes.success     && dowRes.data?.length)     setDowData(dowRes.data as typeof incidentsByDayOfWeek);
      if (todRes.success     && todRes.data?.length)     setTodData(todRes.data as typeof incidentsByTimeOfDay);
      if (rcRes.success      && rcRes.data?.length)      setRcData(rcRes.data as typeof rootCauseData);
      if (liRes.success      && liRes.data?.length)      setLiData(liRes.data as typeof leadingIndicators);
    }).catch(() => { /* keep fallback static data on network error */ });
  }, [timeRange]);

  // Static fallback stats (computed once)
  const staticStats = useMemo(() => {
    const current = monthlyTrendData[monthlyTrendData.length - 1];
    const previous = monthlyTrendData[monthlyTrendData.length - 2];
    const totalIncidents = incidentsByType.reduce((sum, item) => sum + item.value, 0);
    const totalInjuries = incidentsByType.find(i => i.name === 'Injuries')?.value || 0;
    return {
      totalIncidents,
      totalInjuries,
      incidentChange: parseFloat(((current.total - previous.total) / previous.total * 100).toFixed(1)),
      injuryChange: parseFloat(((current.injuries - previous.injuries) / previous.injuries * 100).toFixed(1)),
      trir: 2.1,
      trirChange: -0.3,
      nearMissRatio: (105 / 42).toFixed(1),
    };
  }, []);

  const stats = apiStats ?? staticStats;
  
  // Trend icon helper
  const getTrendIcon = (trend: string | number) => {
    if (typeof trend === 'number') {
      if (trend > 0) return <ArrowUpRight className="w-4 h-4 text-danger" />;
      if (trend < 0) return <ArrowDownRight className="w-4 h-4 text-success" />;
      return <Minus className="w-4 h-4 text-text-muted" />;
    }
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-warning" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-success" />;
    return <Minus className="w-4 h-4 text-text-muted" />;
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-raised/95 backdrop-blur p-3 rounded-xl shadow-lg border border-surface-border">
          <p className="text-sm font-semibold text-text-primary mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-text-muted">{entry.name}:</span>
              <span className="font-medium text-text-primary">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-surface-base">

      
      {/* Header */}
      <header className="bg-surface-raised/80 backdrop-blur-xl border-b border-surface-border sticky top-[var(--nav-height)] z-40">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <SMButton
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                leftIcon={<ArrowLeft className="w-5 h-5" />}
              />
              <div>
                <h1 className="text-xl font-bold text-text-primary">Incident Trend Analytics</h1>
                <p className="text-sm text-text-muted">Analyze patterns and identify improvement areas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Time Range */}
              <div className="flex items-center bg-surface-sunken rounded-xl p-1">
                {[
                  { value: 'week', label: 'Week' },
                  { value: 'month', label: 'Month' },
                  { value: '6months', label: '6 Months' },
                  { value: 'year', label: 'Year' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value as any)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      timeRange === option.value
                        ? 'bg-surface-raised text-text-primary shadow-sm'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              {/* Export */}
              <button className="flex items-center gap-2 px-4 py-2 bg-accent text-text-onAccent rounded-xl hover:opacity-90 transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* KPI Stats */}
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-raised rounded-2xl p-5 border border-surface-border shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted">Total Incidents</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{stats.totalIncidents}</p>
                <div className="flex items-center gap-1 mt-2">
                  {getTrendIcon(stats.incidentChange)}
                  <span className={`text-sm font-medium ${stats.incidentChange > 0 ? 'text-danger' : 'text-success'}`}>
                    {Math.abs(stats.incidentChange)}%
                  </span>
                  <span className="text-xs text-text-muted">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-accent/10 rounded-xl">
                <Activity className="w-6 h-6 text-accent" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-raised rounded-2xl p-5 border border-surface-border shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted">Recordable Injuries</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{stats.totalInjuries}</p>
                <div className="flex items-center gap-1 mt-2">
                  {getTrendIcon(stats.injuryChange)}
                  <span className={`text-sm font-medium ${stats.injuryChange > 0 ? 'text-danger' : 'text-success'}`}>
                    {Math.abs(stats.injuryChange)}%
                  </span>
                  <span className="text-xs text-text-muted">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-danger/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-danger" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-raised rounded-2xl p-5 border border-surface-border shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted">TRIR</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{stats.trir}</p>
                <div className="flex items-center gap-1 mt-2">
                  {getTrendIcon(stats.trirChange)}
                  <span className={`text-sm font-medium ${stats.trirChange > 0 ? 'text-danger' : 'text-success'}`}>
                    {Math.abs(stats.trirChange)}
                  </span>
                  <span className="text-xs text-text-muted">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-warning/10 rounded-xl">
                <Target className="w-6 h-6 text-warning" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-raised rounded-2xl p-5 border border-surface-border shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted">Near Miss Ratio</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{stats.nearMissRatio}:1</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">Good</span>
                  <span className="text-xs text-text-muted">target: 3:1</span>
                </div>
              </div>
              <div className="p-3 bg-success/10 rounded-xl">
                <Eye className="w-6 h-6 text-success" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* View Tabs */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 border-b border-surface-border">
          {[
            { value: 'trends', label: 'Trend Analysis', icon: LineChartIcon },
            { value: 'breakdown', label: 'Breakdown', icon: PieChart },
            { value: 'analysis', label: 'Deep Analysis', icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setChartView(tab.value as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                chartView === tab.value
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <main className="mx-auto max-w-[1440px] px-4 py-6 pb-24 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {/* Trends View */}
          {chartView === 'trends' && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Main Trend Chart */}
              <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-text-primary">Incident Trends</h3>
                    <p className="text-sm text-text-muted">Monthly incident breakdown by type</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showComparison}
                        onChange={(e) => setShowComparison(e.target.checked)}
                        className="rounded border-surface-border text-accent focus:ring-accent"
                      />
                      <span className="text-text-muted">Show comparison</span>
                    </label>
                  </div>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                      <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="total"
                        fill="#00A89D"
                        fillOpacity={0.1}
                        stroke="#00A89D"
                        strokeWidth={2}
                        name="Total"
                      />
                      <Bar dataKey="injuries" fill="#EF4444" name="Injuries" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="nearMisses" fill="#F59E0B" name="Near Misses" radius={[4, 4, 0, 0]} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#00A89D"
                        strokeWidth={2}
                        dot={{ fill: '#00A89D', r: 4 }}
                        name="Trend Line"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Weekly Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-sm p-6">
                  <h3 className="font-semibold text-text-primary mb-4">This Month's Weekly Trend</h3>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                        <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="injuries"
                          stackId="1"
                          fill="#EF4444"
                          stroke="#EF4444"
                          name="Injuries"
                        />
                        <Area
                          type="monotone"
                          dataKey="nearMisses"
                          stackId="1"
                          fill="#F59E0B"
                          stroke="#F59E0B"
                          name="Near Misses"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Leading Indicators */}
                <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-sm p-6">
                  <h3 className="font-semibold text-text-primary mb-4">Leading Indicators</h3>
                  <div className="space-y-4">
                    {liData.map((indicator, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-surface-sunken rounded-xl">
                        <div className="flex items-center gap-3">
                          {getTrendIcon(indicator.trend)}
                          <div>
                            <p className="text-sm font-medium text-text-primary">{indicator.name}</p>
                            <p className="text-xs text-text-muted">Target: {indicator.target}{indicator.unit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-text-primary">
                            {indicator.current}
                            <span className="text-sm font-normal text-text-muted">{indicator.unit}</span>
                          </p>
                          <div className="w-24 h-2 bg-surface-border rounded-full mt-1">
                            <div
                              className={`h-full rounded-full ${
                                indicator.current >= indicator.target ? 'bg-success' : 'bg-warning'
                              }`}
                              style={{ width: `${Math.min(100, (indicator.current / indicator.target) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Breakdown View */}
          {chartView === 'breakdown' && (
            <motion.div
              key="breakdown"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Type */}
                <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-sm p-6">
                  <h3 className="font-semibold text-text-primary mb-4">Incidents by Type</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* By Severity */}
                <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-sm p-6">
                  <h3 className="font-semibold text-text-primary mb-4">Incidents by Severity</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={severityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {severityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* By Department */}
              <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-sm p-6">
                <h3 className="font-semibold text-text-primary mb-4">Incidents by Department</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                      <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                      <YAxis dataKey="department" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="injuries" fill="#EF4444" name="Injuries" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="nearMisses" fill="#F59E0B" name="Near Misses" stackId="a" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Department cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                  {deptData.map((dept, idx) => (
                    <div key={idx} className="p-4 bg-surface-sunken rounded-xl text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {getTrendIcon(dept.trend)}
                        <span className="text-xs text-text-muted">{dept.trend}</span>
                      </div>
                      <p className="text-2xl font-bold text-text-primary">{dept.incidents}</p>
                      <p className="text-xs text-text-muted mt-1">{dept.department}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Deep Analysis View */}
          {chartView === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Day of Week */}
                <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-sm p-6">
                  <h3 className="font-semibold text-text-primary mb-4">Incidents by Day of Week</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dowData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                        <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="incidents" fill="#00A89D" name="Incidents" radius={[4, 4, 0, 0]}>
                          {dowData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.incidents > 35 ? '#EF4444' : entry.incidents > 25 ? '#F59E0B' : '#16A34A'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success" /> Low (under 26)</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning" /> Medium (26-35)</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-danger" /> High (over 35)</span>
                  </div>
                </div>
                
                {/* Time of Day */}
                <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-sm p-6">
                  <h3 className="font-semibold text-text-primary mb-4">Incidents by Time of Day</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={todData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                        <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="incidents"
                          fill="#8B5CF6"
                          fillOpacity={0.3}
                          stroke="#8B5CF6"
                          strokeWidth={2}
                          name="Incidents"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-text-muted text-center mt-4">
                    Peak incident times: 9 AM - 3 PM (51.8% of all incidents)
                  </p>
                </div>
              </div>
              
              {/* Root Cause Analysis */}
              <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-sm p-6">
                <h3 className="font-semibold text-text-primary mb-4">Root Cause Analysis</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rcData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                        <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                        <YAxis dataKey="cause" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} width={120} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#8B5CF6" name="Incidents" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-3">
                    {rcData.map((cause, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-text-primary">{cause.cause}</span>
                            <span className="text-sm text-text-muted">{cause.percentage}%</span>
                          </div>
                          <div className="w-full h-2 bg-surface-sunken rounded-full">
                            <div
                              className="h-full bg-ai rounded-full transition-all duration-500"
                              style={{ width: `${cause.percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-bold text-text-primary w-12 text-right">{cause.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Insights */}
                <div className="mt-6 p-4 bg-accent/5 rounded-xl border border-accent/20">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <h4 className="font-medium text-accent">Key Insights</h4>
                      <ul className="text-sm text-text-primary mt-2 space-y-1">
                        <li>• <strong>Human Error</strong> accounts for 37% of incidents - focus on training and awareness</li>
                        <li>• <strong>Thursday</strong> has the highest incident rate - consider mid-week safety briefings</li>
                        <li>• <strong>9 AM - 3 PM</strong> is the peak incident window - increase supervision during these hours</li>
                        <li>• <strong>Near Miss Ratio</strong> is improving (2.5:1) - good leading indicator</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
