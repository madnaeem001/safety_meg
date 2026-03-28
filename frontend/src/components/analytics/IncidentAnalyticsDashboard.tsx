import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Calendar,
  Filter,
  Download,
  ChevronDown,
  Clock,
  Users,
  MapPin,
  Target,
  Shield,
  Flame,
  Car,
  Building2,
  Heart,
  Factory,
  Zap,
  Eye,
  FileText,
  PieChart,
  LineChart,
  BarChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Maximize2,
  Settings,
  Info,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { SMButton } from '../ui';

// Types
interface IncidentData {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  date: string;
  location: string;
  department: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  daysToResolve?: number;
  cost?: number;
}

interface AnalyticsMetric {
  label: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  isPositive: boolean;
}

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

// Mock data generator
const generateMockIncidents = (): IncidentData[] => {
  const types = ['slip', 'fall', 'vehicle', 'chemical', 'fire', 'electrical', 'ergonomic', 'equipment'];
  const severities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
  const locations = ['Building A', 'Building B', 'Warehouse', 'Lab', 'Office', 'Parking', 'Production Floor'];
  const departments = ['Operations', 'Maintenance', 'R&D', 'Logistics', 'Admin', 'Safety'];
  const statuses: ('open' | 'investigating' | 'resolved' | 'closed')[] = ['open', 'investigating', 'resolved', 'closed'];

  return Array.from({ length: 150 }, (_, i) => ({
    id: `INC-2026-${String(i + 1).padStart(3, '0')}`,
    type: types[Math.floor(Math.random() * types.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    location: locations[Math.floor(Math.random() * locations.length)],
    department: departments[Math.floor(Math.random() * departments.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    daysToResolve: Math.floor(Math.random() * 30) + 1,
    cost: Math.floor(Math.random() * 50000) + 500
  }));
};

const mockIncidents = generateMockIncidents();

// KPI Cards Component
const KPICard: React.FC<{
  metric: AnalyticsMetric;
  icon: React.ElementType;
  color: string;
}> = ({ metric, icon: Icon, color }) => {
  const changePercent = metric.previousValue 
    ? ((metric.value - metric.previousValue) / metric.previousValue * 100).toFixed(1)
    : '0';

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          metric.isPositive 
            ? metric.trend === 'down' ? 'text-emerald-600' : 'text-red-600'
            : metric.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {metric.trend === 'up' ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : metric.trend === 'down' ? (
            <ArrowDownRight className="w-4 h-4" />
          ) : null}
          {changePercent}%
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
        {metric.value.toLocaleString()}{metric.unit}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {metric.label}
      </div>
      <div className="mt-3 text-xs text-slate-400">
        vs. {metric.previousValue.toLocaleString()}{metric.unit} last period
      </div>
    </motion.div>
  );
};

// Bar Chart Component (Custom SVG)
const BarChartComponent: React.FC<{
  data: ChartData[];
  height?: number;
  title: string;
}> = ({ data, height = 200, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = 100 / data.length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <BarChart className="w-4 h-4 text-slate-400" />
      </div>
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={100 - y}
              x2="100"
              y2={100 - y}
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-slate-200 dark:text-slate-700"
            />
          ))}
          
          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = (d.value / maxValue) * 80;
            const x = i * barWidth + barWidth * 0.15;
            const width = barWidth * 0.7;
            
            return (
              <motion.rect
                key={d.label}
                initial={{ height: 0, y: 100 }}
                animate={{ height: barHeight, y: 100 - barHeight }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                x={`${x}%`}
                width={`${width}%`}
                rx="2"
                className="fill-brand-500"
              />
            );
          })}
        </svg>
      </div>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        {data.map((d) => (
          <div key={d.label} className="text-center" style={{ width: `${barWidth}%` }}>
            <div className="truncate px-1">{d.label}</div>
            <div className="font-medium text-slate-700 dark:text-slate-300">{d.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Line Chart Component (Custom SVG)
const LineChartComponent: React.FC<{
  data: ChartData[];
  height?: number;
  title: string;
  color?: string;
}> = ({ data, height = 200, title, color = '#14b8a6' }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <LineChart className="w-4 h-4 text-slate-400" />
      </div>
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-slate-200 dark:text-slate-700"
            />
          ))}
          
          {/* Area fill */}
          <motion.polygon
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 0.5 }}
            points={areaPoints}
            fill={color}
          />
          
          {/* Line */}
          <motion.polyline
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d.value - minValue) / range) * 80 - 10;
            return (
              <motion.circle
                key={d.label}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                cx={x}
                cy={y}
                r="1.5"
                fill={color}
              />
            );
          })}
        </svg>
      </div>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map((d) => (
          <div key={d.label}>{d.label}</div>
        ))}
      </div>
    </div>
  );
};

// Donut Chart Component
const DonutChart: React.FC<{
  data: ChartData[];
  title: string;
  size?: number;
}> = ({ data, title, size = 160 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ['#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981'];
  
  let cumulativePercent = 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <PieChart className="w-4 h-4 text-slate-400" />
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox="0 0 100 100">
            {data.map((d, i) => {
              const percent = (d.value / total) * 100;
              const startAngle = (cumulativePercent / 100) * 360 - 90;
              const endAngle = ((cumulativePercent + percent) / 100) * 360 - 90;
              
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              
              const x1 = 50 + 40 * Math.cos(startRad);
              const y1 = 50 + 40 * Math.sin(startRad);
              const x2 = 50 + 40 * Math.cos(endRad);
              const y2 = 50 + 40 * Math.sin(endRad);
              
              const largeArc = percent > 50 ? 1 : 0;
              
              const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
              
              cumulativePercent += percent;
              
              return (
                <motion.path
                  key={d.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  d={path}
                  fill={d.color || colors[i % colors.length]}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              );
            })}
            {/* Center circle */}
            <circle cx="50" cy="50" r="25" className="fill-white dark:fill-slate-800" />
            <text x="50" y="47" textAnchor="middle" className="fill-slate-900 dark:fill-white text-[8px] font-bold">
              {total}
            </text>
            <text x="50" y="56" textAnchor="middle" className="fill-slate-500 text-[5px]">
              Total
            </text>
          </svg>
        </div>
        
        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.map((d, i) => (
            <div key={d.label} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: d.color || colors[i % colors.length] }} 
              />
              <span className="flex-1 text-slate-600 dark:text-slate-400 truncate">{d.label}</span>
              <span className="font-medium text-slate-900 dark:text-white">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Heat Map Component
const HeatMap: React.FC<{
  title: string;
}> = ({ title }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['6am', '9am', '12pm', '3pm', '6pm', '9pm'];
  
  // Generate random heat data
  const heatData = days.map(() => hours.map(() => Math.floor(Math.random() * 10)));
  const maxValue = 10;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <Activity className="w-4 h-4 text-slate-400" />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-12"></th>
              {hours.map((hour) => (
                <th key={hour} className="text-xs text-slate-500 font-normal pb-2">{hour}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, dayIndex) => (
              <tr key={day}>
                <td className="text-xs text-slate-500 pr-2">{day}</td>
                {heatData[dayIndex].map((value, hourIndex) => {
                  const intensity = value / maxValue;
                  return (
                    <td key={hourIndex} className="p-0.5">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: (dayIndex * 6 + hourIndex) * 0.01 }}
                        className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium cursor-pointer hover:ring-2 hover:ring-brand-500"
                        style={{
                          backgroundColor: `rgba(20, 184, 166, ${intensity * 0.8 + 0.1})`,
                          color: intensity > 0.5 ? 'white' : '#64748b'
                        }}
                        title={`${day} ${hours[hourIndex]}: ${value} incidents`}
                      >
                        {value}
                      </motion.div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-slate-500">
        <span>Less</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity) => (
          <div
            key={intensity}
            className="w-4 h-4 rounded"
            style={{ backgroundColor: `rgba(20, 184, 166, ${intensity})` }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

// Main Analytics Dashboard Component
export const IncidentAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate metrics from mock data
  const metrics = useMemo(() => {
    const totalIncidents = mockIncidents.length;
    const openIncidents = mockIncidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
    const criticalIncidents = mockIncidents.filter(i => i.severity === 'critical').length;
    const avgResolutionTime = mockIncidents.reduce((sum, i) => sum + (i.daysToResolve || 0), 0) / totalIncidents;
    const totalCost = mockIncidents.reduce((sum, i) => sum + (i.cost || 0), 0);
    const trir = ((totalIncidents * 200000) / (1000 * 2080)).toFixed(2);

    return [
      { label: 'Total Incidents', value: totalIncidents, previousValue: 142, unit: '', trend: 'up' as const, isPositive: false },
      { label: 'Open Cases', value: openIncidents, previousValue: 38, unit: '', trend: 'down' as const, isPositive: false },
      { label: 'TRIR', value: parseFloat(trir), previousValue: 3.2, unit: '', trend: 'down' as const, isPositive: false },
      { label: 'Avg Resolution', value: Math.round(avgResolutionTime), previousValue: 12, unit: ' days', trend: 'down' as const, isPositive: false },
      { label: 'Critical Incidents', value: criticalIncidents, previousValue: 15, unit: '', trend: 'down' as const, isPositive: false },
      { label: 'Total Cost', value: Math.round(totalCost / 1000), previousValue: 245, unit: 'K', trend: 'up' as const, isPositive: false }
    ];
  }, []);

  // Chart data
  const incidentsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    mockIncidents.forEach(i => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, []);

  const incidentsBySeverity = useMemo(() => [
    { label: 'Low', value: mockIncidents.filter(i => i.severity === 'low').length, color: '#10b981' },
    { label: 'Medium', value: mockIncidents.filter(i => i.severity === 'medium').length, color: '#f59e0b' },
    { label: 'High', value: mockIncidents.filter(i => i.severity === 'high').length, color: '#f97316' },
    { label: 'Critical', value: mockIncidents.filter(i => i.severity === 'critical').length, color: '#ef4444' }
  ], []);

  const incidentsByStatus = useMemo(() => [
    { label: 'Open', value: mockIncidents.filter(i => i.status === 'open').length, color: '#ef4444' },
    { label: 'Investigating', value: mockIncidents.filter(i => i.status === 'investigating').length, color: '#f59e0b' },
    { label: 'Resolved', value: mockIncidents.filter(i => i.status === 'resolved').length, color: '#3b82f6' },
    { label: 'Closed', value: mockIncidents.filter(i => i.status === 'closed').length, color: '#10b981' }
  ], []);

  const monthlyTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((label) => ({
      label,
      value: Math.floor(Math.random() * 20) + 5
    }));
  }, []);

  const incidentsByDepartment = useMemo(() => {
    const counts: Record<string, number> = {};
    mockIncidents.forEach(i => {
      counts[i.department] = (counts[i.department] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const kpiIcons = [AlertTriangle, Activity, Shield, Clock, Flame, TrendingUp];
  const kpiColors = ['bg-amber-500', 'bg-blue-500', 'bg-brand-500', 'bg-purple-500', 'bg-red-500', 'bg-emerald-500'];

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-xl">
              <BarChart3 className="w-6 h-6 text-brand-600" />
            </div>
            Incident Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Comprehensive safety performance insights and trends
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  timeRange === range
                    ? 'bg-accent text-text-onAccent'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-colors ${
              showFilters
                ? 'bg-brand-50 border-brand-500 text-brand-600'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 
                     dark:border-slate-700 text-slate-600 dark:text-slate-400 
                     hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Export Button */}
          <SMButton variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />}><span className="hidden sm:inline">Export</span></SMButton>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 
                             dark:border-slate-600 rounded-lg text-sm"
                  >
                    <option value="all">All Departments</option>
                    <option value="operations">Operations</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="logistics">Logistics</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 
                             dark:border-slate-600 rounded-lg text-sm"
                  >
                    <option value="all">All Locations</option>
                    <option value="building-a">Building A</option>
                    <option value="building-b">Building B</option>
                    <option value="warehouse">Warehouse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Incident Type
                  </label>
                  <select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 
                             dark:border-slate-600 rounded-lg text-sm">
                    <option value="all">All Types</option>
                    <option value="slip">Slip/Trip/Fall</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="chemical">Chemical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Severity
                  </label>
                  <select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 
                             dark:border-slate-600 rounded-lg text-sm">
                    <option value="all">All Severities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {metrics.map((metric, i) => (
          <KPICard
            key={metric.label}
            metric={metric}
            icon={kpiIcons[i]}
            color={kpiColors[i]}
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {/* Monthly Trend */}
        <div className="xl:col-span-2">
          <LineChartComponent
            data={monthlyTrend}
            title="Incident Trend (Monthly)"
            height={220}
          />
        </div>

        {/* Severity Distribution */}
        <DonutChart
          data={incidentsBySeverity}
          title="By Severity"
        />

        {/* By Type */}
        <BarChartComponent
          data={incidentsByType.slice(0, 6)}
          title="By Incident Type"
          height={200}
        />

        {/* Status Distribution */}
        <DonutChart
          data={incidentsByStatus}
          title="By Status"
        />

        {/* By Department */}
        <BarChartComponent
          data={incidentsByDepartment}
          title="By Department"
          height={200}
        />
      </div>

      {/* Heat Map */}
      <div className="mb-6">
        <HeatMap title="Incident Frequency by Day & Time" />
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Recent Incidents
            </h3>
            <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              View All →
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {mockIncidents.slice(0, 8).map((incident) => (
                <motion.tr
                  key={incident.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-brand-600">{incident.id}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 capitalize">{incident.type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      incident.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      incident.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      incident.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{incident.location}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{incident.date}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-sm ${
                      incident.status === 'closed' ? 'text-emerald-600' :
                      incident.status === 'resolved' ? 'text-blue-600' :
                      incident.status === 'investigating' ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {incident.status === 'closed' ? <CheckCircle2 className="w-4 h-4" /> :
                       incident.status === 'open' ? <XCircle className="w-4 h-4" /> :
                       <Activity className="w-4 h-4" />}
                      <span className="capitalize">{incident.status}</span>
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IncidentAnalyticsDashboard;
