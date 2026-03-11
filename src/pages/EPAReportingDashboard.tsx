import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  Calendar,
  Filter,
  Droplets,
  Wind,
  Trash2,
  Leaf,
  Target,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  mockEPAReportData,
  mockEPAMetrics,
  EPAReportData,
  EPAMetric,
  mockScheduledInspections,
} from '../data/mockScheduling';
import { useEnvironmentalMetrics, useInspectionSchedule, useInspectionStats } from '../api/hooks/useAPIHooks';

const categoryIcons: Record<string, React.ReactNode> = {
  'Air Quality': <Wind className="w-5 h-5" />,
  'Water Quality': <Droplets className="w-5 h-5" />,
  'Waste': <Trash2 className="w-5 h-5" />,
};

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  compliant: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  violation: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export const EPAReportingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2025-Q4');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // ── Real Backend Data ──────────────────────────────────────────────────
  const { data: envMetrics } = useEnvironmentalMetrics('quarter');
  const { data: inspectionStats } = useInspectionStats();
  const { data: scheduledInspections } = useInspectionSchedule();

  // ── Derived period data (prefer backend, fall back to mock) ────────────
  const currentPeriodData = useMemo(() => {
    if (envMetrics) {
      return {
        period: selectedPeriod,
        complianceRate: envMetrics.complianceRate ?? mockEPAReportData[0].complianceRate,
        inspectionsCompleted: inspectionStats?.inspections?.completed ?? mockEPAReportData[0].inspectionsCompleted,
        inspectionsPassed: inspectionStats?.inspections?.passed ?? mockEPAReportData[0].inspectionsPassed,
        inspectionsFailed: inspectionStats?.inspections?.failed ?? mockEPAReportData[0].inspectionsFailed,
        issuesIdentified: inspectionStats?.inspections?.overdue ?? mockEPAReportData[0].issuesIdentified,
        issuesResolved: inspectionStats?.inspections?.completed ?? mockEPAReportData[0].issuesResolved,
        avgResolutionDays: mockEPAReportData[0].avgResolutionDays,
      };
    }
    return mockEPAReportData.find(d => d.period === selectedPeriod) || mockEPAReportData[0];
  }, [envMetrics, inspectionStats, selectedPeriod]);

  const previousPeriodData = useMemo(() => {
    const idx = mockEPAReportData.findIndex(d => d.period === selectedPeriod);
    return idx < mockEPAReportData.length - 1 ? mockEPAReportData[idx + 1] : null;
  }, [selectedPeriod]);

  const filteredMetrics = useMemo(() => {
    if (categoryFilter === 'all') return mockEPAMetrics;
    return mockEPAMetrics.filter(m => m.category === categoryFilter);
  }, [categoryFilter]);

  const metricsByCategory = useMemo(() => {
    const grouped: Record<string, EPAMetric[]> = {};
    mockEPAMetrics.forEach(m => {
      if (!grouped[m.category]) grouped[m.category] = [];
      grouped[m.category].push(m);
    });
    return grouped;
  }, []);

  const overallCompliance = useMemo(() => {
    if (envMetrics?.complianceRate) return Math.round(envMetrics.complianceRate);
    const compliant = mockEPAMetrics.filter(m => m.status === 'compliant').length;
    return Math.round((compliant / mockEPAMetrics.length) * 100);
  }, [envMetrics]);

  const EPA_TYPES = new Set(['epa', 'swppp', 'stormwater']);
  // Blend backend scheduled inspections with mock EPA-specific ones
  const epaInspections = useMemo(() => {
    if (scheduledInspections && scheduledInspections.length > 0) {
      return scheduledInspections.filter(
        (i: any) => EPA_TYPES.has(i.type ?? i.inspectionType)
      );
    }
    return mockScheduledInspections.filter(i => EPA_TYPES.has(i.type));
  }, [scheduledInspections]);

  const calculateChange = (current: number, previous: number | undefined) => {
    if (!previous) return null;
    return ((current - previous) / previous) * 100;
  };

  const complianceChange = calculateChange(
    currentPeriodData.complianceRate,
    previousPeriodData?.complianceRate
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-100">
      {/* Header */}
      <header className="sticky top-[72px] z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-surface-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-surface-900">EPA Reporting Dashboard</h1>
                <p className="text-sm text-surface-500">Environmental compliance metrics and trends</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {mockEPAReportData.map(d => (
                  <option key={d.period} value={d.period}>{d.period}</option>
                ))}
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-xl shadow-button hover:shadow-lg transition-all">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              {complianceChange !== null && (
                <div className={`flex items-center gap-1 text-sm font-medium ${complianceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {complianceChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(complianceChange).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-surface-900">{currentPeriodData.complianceRate}%</div>
            <div className="text-sm text-surface-500 mt-1">Compliance Rate</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-surface-900">{currentPeriodData.inspectionsCompleted}</div>
            <div className="text-sm text-surface-500 mt-1">Inspections Completed</div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{currentPeriodData.inspectionsPassed} passed</span>
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{currentPeriodData.inspectionsFailed} failed</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-surface-900">{currentPeriodData.issuesIdentified}</div>
            <div className="text-sm text-surface-500 mt-1">Issues Identified</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${(currentPeriodData.issuesResolved / currentPeriodData.issuesIdentified) * 100}%` }}
                />
              </div>
              <span className="text-xs text-surface-600">{currentPeriodData.issuesResolved} resolved</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-surface-900">{currentPeriodData.avgResolutionDays}</div>
            <div className="text-sm text-surface-500 mt-1">Avg. Resolution (days)</div>
          </motion.div>
        </div>

        {/* Overall Compliance Gauge */}
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft"
          >
            <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-brand-600" />
              Real-Time Compliance
            </h3>
            <div className="relative w-40 h-40 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-surface-100"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(overallCompliance / 100) * 440} 440`}
                  strokeLinecap="round"
                  className={overallCompliance >= 90 ? 'text-green-500' : overallCompliance >= 75 ? 'text-amber-500' : 'text-red-500'}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-surface-900">{overallCompliance}%</span>
                <span className="text-sm text-surface-500">Compliant</span>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-surface-600">{mockEPAMetrics.filter(m => m.status === 'compliant').length} OK</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-surface-600">{mockEPAMetrics.filter(m => m.status === 'warning').length} Warn</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-surface-600">{mockEPAMetrics.filter(m => m.status === 'violation').length} Viol</span>
              </div>
            </div>
          </motion.div>

          {/* Trend Chart Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="md:col-span-2 bg-white rounded-2xl p-6 border border-surface-100 shadow-soft"
          >
            <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              Quarterly Compliance Trend
            </h3>
            <div className="h-48 flex items-end gap-4 px-4">
              {mockEPAReportData.slice().reverse().map((data, idx) => (
                <div key={data.period} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-full rounded-t-lg transition-all ${
                      data.complianceRate >= 92 ? 'bg-green-500' : data.complianceRate >= 90 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ height: `${(data.complianceRate / 100) * 150}px` }}
                  />
                  <div className="text-xs text-surface-600 mt-2 font-medium">{data.period}</div>
                  <div className="text-sm font-semibold text-surface-900">{data.complianceRate}%</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Metrics by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden"
        >
          <div className="p-4 border-b border-surface-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-surface-900">Environmental Metrics</h3>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-surface-500" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-surface-50 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Categories</option>
                <option value="Air Quality">Air Quality</option>
                <option value="Water Quality">Water Quality</option>
                <option value="Waste">Waste Management</option>
              </select>
            </div>
          </div>
          <div className="divide-y divide-surface-100">
            {Object.entries(metricsByCategory).filter(([cat]) => categoryFilter === 'all' || cat === categoryFilter).map(([category, metrics]) => (
              <div key={category} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-brand-100 rounded-lg text-brand-600">
                    {categoryIcons[category]}
                  </div>
                  <h4 className="font-medium text-surface-900">{category}</h4>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {metrics.map(metric => {
                    const percentage = (metric.value / metric.limit) * 100;
                    const colors = statusColors[metric.status];
                    return (
                      <div key={metric.metric} className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-surface-700">{metric.metric}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.text} ${colors.bg}`}>
                            {metric.status === 'compliant' ? 'OK' : metric.status === 'warning' ? 'Warning' : 'Violation'}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-surface-900">
                          {metric.value} <span className="text-sm font-normal text-surface-500">{metric.unit}</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-surface-500 mb-1">
                            <span>0</span>
                            <span>Limit: {metric.limit} {metric.unit}</span>
                          </div>
                          <div className="h-2 bg-white rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                metric.status === 'compliant' ? 'bg-green-500' :
                                metric.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-xs text-surface-500 mt-2">
                          Updated: {new Date(metric.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming EPA Inspections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft"
        >
          <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" />
            Upcoming Environmental Inspections
          </h3>
          <div className="space-y-3">
            {epaInspections.filter(i => i.status === 'scheduled').slice(0, 5).map(inspection => (
              <div key={inspection.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-10 rounded-full ${
                    ((inspection as any).type ?? (inspection as any).inspectionType) === 'epa' ? 'bg-emerald-500' :
                    ((inspection as any).type ?? (inspection as any).inspectionType) === 'swppp' ? 'bg-blue-500' : 'bg-cyan-500'
                  }`} />
                  <div>
                    <div className="font-medium text-surface-900">{inspection.title}</div>
                    <div className="text-sm text-surface-500">{inspection.zone} • {String((inspection as any).assignedTo || 'Unassigned')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-surface-900">
                    {new Date(inspection.scheduledDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-surface-500">{inspection.scheduledTime}</div>
                </div>
              </div>
            ))}
            {epaInspections.filter(i => i.status === 'scheduled').length === 0 && (
              <div className="text-center py-8 text-surface-500">
                No upcoming environmental inspections scheduled.
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/inspection-scheduling')}
            className="w-full mt-4 py-2.5 text-brand-600 font-medium hover:bg-brand-50 rounded-xl transition-colors"
          >
            View All Scheduled Inspections
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default EPAReportingDashboard;
