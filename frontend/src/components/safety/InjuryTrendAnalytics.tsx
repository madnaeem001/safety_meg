import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  Heart,
  Clock,
  Users,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';

// Mock data for injury trends
const monthlyTrendData = [
  { month: 'Jan', injuries: 12, nearMisses: 24, severity: 2.8, daysLost: 18 },
  { month: 'Feb', injuries: 8, nearMisses: 28, severity: 2.2, daysLost: 12 },
  { month: 'Mar', injuries: 15, nearMisses: 22, severity: 3.1, daysLost: 28 },
  { month: 'Apr', injuries: 6, nearMisses: 32, severity: 1.8, daysLost: 8 },
  { month: 'May', injuries: 10, nearMisses: 26, severity: 2.4, daysLost: 15 },
  { month: 'Jun', injuries: 4, nearMisses: 38, severity: 1.5, daysLost: 5 },
  { month: 'Jul', injuries: 7, nearMisses: 30, severity: 2.0, daysLost: 10 },
  { month: 'Aug', injuries: 9, nearMisses: 25, severity: 2.3, daysLost: 14 },
  { month: 'Sep', injuries: 5, nearMisses: 35, severity: 1.6, daysLost: 6 },
  { month: 'Oct', injuries: 8, nearMisses: 29, severity: 2.1, daysLost: 11 },
  { month: 'Nov', injuries: 3, nearMisses: 40, severity: 1.2, daysLost: 3 },
  { month: 'Dec', injuries: 6, nearMisses: 33, severity: 1.9, daysLost: 8 },
];

const injuryByTypeData = [
  { type: 'Laceration', count: 28, color: '#ef4444' },
  { type: 'Strain/Sprain', count: 22, color: '#f97316' },
  { type: 'Contusion', count: 18, color: '#eab308' },
  { type: 'Fracture', count: 8, color: '#22c55e' },
  { type: 'Burn', count: 6, color: '#3b82f6' },
  { type: 'Other', count: 11, color: '#8b5cf6' },
];

const injuryByBodyPartData = [
  { part: 'Hands/Fingers', count: 35, percentage: 28 },
  { part: 'Back', count: 24, percentage: 19 },
  { part: 'Feet/Ankles', count: 18, percentage: 14 },
  { part: 'Head/Neck', count: 12, percentage: 10 },
  { part: 'Arms/Shoulders', count: 16, percentage: 13 },
  { part: 'Legs/Knees', count: 14, percentage: 11 },
  { part: 'Eyes', count: 6, percentage: 5 },
];

const injuryByDepartmentData = [
  { department: 'Production', injuries: 32, rate: 4.2 },
  { department: 'Warehouse', injuries: 24, rate: 3.8 },
  { department: 'Maintenance', injuries: 18, rate: 5.1 },
  { department: 'Shipping', injuries: 12, rate: 2.9 },
  { department: 'Quality', injuries: 6, rate: 1.5 },
  { department: 'Admin', injuries: 3, rate: 0.8 },
];

const injuryByShiftData = [
  { shift: 'Day (6AM-2PM)', injuries: 38, percentage: 41 },
  { shift: 'Swing (2PM-10PM)', injuries: 32, percentage: 34 },
  { shift: 'Night (10PM-6AM)', injuries: 23, percentage: 25 },
];

const rootCauseData = [
  { cause: 'Improper PPE Use', count: 22 },
  { cause: 'Inadequate Training', count: 18 },
  { cause: 'Equipment Malfunction', count: 15 },
  { cause: 'Housekeeping Issues', count: 12 },
  { cause: 'Fatigue', count: 10 },
  { cause: 'Rushing', count: 9 },
  { cause: 'Distraction', count: 7 },
];

interface InjuryTrendAnalyticsProps {
  dateRange?: { start: string; end: string };
}

export const InjuryTrendAnalytics: React.FC<InjuryTrendAnalyticsProps> = ({
  dateRange
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('year');
  const [showFilters, setShowFilters] = useState(false);

  const kpiCards = [
    {
      title: 'Total Injuries (YTD)',
      value: 93,
      trend: -18,
      trendLabel: 'vs last year',
      icon: Heart,
      color: 'from-red-500 to-pink-500',
      positive: true
    },
    {
      title: 'Average Severity',
      value: '2.1',
      trend: -0.5,
      trendLabel: 'vs last quarter',
      icon: Activity,
      color: 'from-amber-500 to-orange-500',
      positive: true
    },
    {
      title: 'Days Lost',
      value: 138,
      trend: -24,
      trendLabel: 'vs last year',
      icon: Clock,
      color: 'from-blue-500 to-indigo-500',
      positive: true
    },
    {
      title: 'TRIR',
      value: '2.8',
      trend: -0.6,
      trendLabel: 'vs last year',
      icon: TrendingDown,
      color: 'from-emerald-500 to-green-500',
      positive: true
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Injury Trend Analytics</h2>
          <p className="text-slate-400">Analyze injury patterns, trends, and root causes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
            {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl text-white font-medium transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-gradient-to-br ${kpi.color} rounded-2xl p-5 text-white relative overflow-hidden`}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className="w-5 h-5 opacity-80" />
                <span className="text-sm font-medium opacity-90">{kpi.title}</span>
              </div>
              <div className="text-3xl font-bold">{kpi.value}</div>
              <div className="flex items-center gap-1 mt-1 text-sm opacity-90">
                {kpi.positive ? (
                  <ArrowDownRight className="w-4 h-4" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
                <span>{Math.abs(kpi.trend)} {kpi.trendLabel}</span>
              </div>
            </div>
            <kpi.icon className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
          </motion.div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Injury Trend Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Injury Trend Over Time</h3>
              <p className="text-sm text-slate-400">Monthly injuries vs near misses</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-400">Injuries</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-400">Near Misses</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                }}
                labelStyle={{ color: '#f8fafc' }}
              />
              <Area
                type="monotone"
                dataKey="nearMisses"
                fill="#f59e0b"
                fillOpacity={0.2}
                stroke="#f59e0b"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="injuries"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Injury by Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Injuries by Type</h3>
              <p className="text-sm text-slate-400">Distribution of injury types</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RePieChart>
              <Pie
                data={injuryByTypeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
              >
                {injuryByTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                }}
              />
            </RePieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {injuryByTypeData.map((type) => (
              <div key={type.type} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-slate-400">{type.type}</span>
                <span className="text-white font-medium ml-auto">{type.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Body Part & Department Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Injuries by Body Part */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Injuries by Body Part</h3>
              <p className="text-sm text-slate-400">Most affected areas</p>
            </div>
          </div>
          <div className="space-y-4">
            {injuryByBodyPartData.map((item) => (
              <div key={item.part} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{item.part}</span>
                  <span className="text-white font-medium">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-brand-500 to-brand-400 h-2 rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Injuries by Department */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Injuries by Department</h3>
              <p className="text-sm text-slate-400">With incident rate per 100 workers</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={injuryByDepartmentData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis dataKey="department" type="category" stroke="#64748b" fontSize={12} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="injuries" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row - Shift Analysis & Root Causes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shift Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
        >
          <h3 className="text-lg font-bold text-white mb-4">Injuries by Shift</h3>
          <div className="space-y-4">
            {injuryByShiftData.map((shift) => (
              <div key={shift.shift} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{shift.shift}</p>
                  <p className="text-xs text-slate-400">{shift.injuries} injuries ({shift.percentage}%)</p>
                </div>
                <div className="w-16 bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full"
                    style={{ width: `${shift.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Root Cause Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Top Root Causes</h3>
              <p className="text-sm text-slate-400">Most common contributing factors</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rootCauseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="cause" stroke="#64748b" fontSize={10} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Days Lost Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Days Lost & Severity Trend</h3>
            <p className="text-sm text-slate-400">Monthly lost time days and average severity</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={monthlyTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
            <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
              }}
              labelStyle={{ color: '#f8fafc' }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="daysLost" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Days Lost" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="severity"
              stroke="#f97316"
              strokeWidth={3}
              dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
              name="Avg Severity"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default InjuryTrendAnalytics;
