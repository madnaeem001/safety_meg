import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, TrendingDown, Target, Activity, BarChart3, PieChart,
  Calendar, Filter, Download, ChevronDown, AlertTriangle, CheckCircle2, Clock,
  Users, Shield, Zap, Award, LineChart, ArrowUpRight, ArrowDownRight, Info,
  FileText, Bell, Settings, Eye, MessageSquare, ClipboardCheck, HardHat
} from 'lucide-react';
import { buildWeeklySafetyReportData, exportWeeklyReportPDF, exportWeeklyReportExcel } from '../utils/exports/weeklySafetyReport';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, BarChart, Bar, Legend, RadialBarChart, RadialBar, LineChart as ReLineChart, Line } from 'recharts';
import { useKPIDashboard, useKPIDepartmentComparison, useKPIIncidentBreakdown } from '../api/hooks/useAPIHooks';

// Leading Indicators (Proactive measures)
const LEADING_INDICATORS = [
  {
    id: 'safety_observations',
    name: 'Safety Observations',
    description: 'Number of safety observations reported',
    category: 'leading',
    target: 100,
    current: 87,
    unit: 'observations',
    trend: 'up',
    change: '+12%',
    period: 'This Month',
    data: [
      { month: 'Aug', value: 65 },
      { month: 'Sep', value: 72 },
      { month: 'Oct', value: 78 },
      { month: 'Nov', value: 82 },
      { month: 'Dec', value: 80 },
      { month: 'Jan', value: 87 },
    ],
  },
  {
    id: 'near_miss_reports',
    name: 'Near Miss Reports',
    description: 'Proactive near miss reporting rate',
    category: 'leading',
    target: 50,
    current: 43,
    unit: 'reports',
    trend: 'up',
    change: '+8%',
    period: 'This Month',
    data: [
      { month: 'Aug', value: 28 },
      { month: 'Sep', value: 32 },
      { month: 'Oct', value: 35 },
      { month: 'Nov', value: 38 },
      { month: 'Dec', value: 40 },
      { month: 'Jan', value: 43 },
    ],
  },
  {
    id: 'training_completion',
    name: 'Training Completion Rate',
    description: 'Percentage of required training completed',
    category: 'leading',
    target: 100,
    current: 94,
    unit: '%',
    trend: 'up',
    change: '+3%',
    period: 'Current Quarter',
    data: [
      { month: 'Aug', value: 85 },
      { month: 'Sep', value: 88 },
      { month: 'Oct', value: 90 },
      { month: 'Nov', value: 91 },
      { month: 'Dec', value: 92 },
      { month: 'Jan', value: 94 },
    ],
  },
  {
    id: 'inspection_completion',
    name: 'Inspection Completion',
    description: 'Scheduled inspections completed on time',
    category: 'leading',
    target: 100,
    current: 96,
    unit: '%',
    trend: 'up',
    change: '+2%',
    period: 'This Month',
    data: [
      { month: 'Aug', value: 88 },
      { month: 'Sep', value: 90 },
      { month: 'Oct', value: 92 },
      { month: 'Nov', value: 93 },
      { month: 'Dec', value: 95 },
      { month: 'Jan', value: 96 },
    ],
  },
  {
    id: 'hazard_id',
    name: 'Hazards Identified',
    description: 'New hazards identified proactively',
    category: 'leading',
    target: 30,
    current: 28,
    unit: 'hazards',
    trend: 'up',
    change: '+5%',
    period: 'This Month',
    data: [
      { month: 'Aug', value: 18 },
      { month: 'Sep', value: 20 },
      { month: 'Oct', value: 22 },
      { month: 'Nov', value: 24 },
      { month: 'Dec', value: 26 },
      { month: 'Jan', value: 28 },
    ],
  },
  {
    id: 'toolbox_talks',
    name: 'Toolbox Talk Participation',
    description: 'Average attendance at daily toolbox talks',
    category: 'leading',
    target: 95,
    current: 91,
    unit: '%',
    trend: 'up',
    change: '+4%',
    period: 'This Month',
    data: [
      { month: 'Aug', value: 82 },
      { month: 'Sep', value: 84 },
      { month: 'Oct', value: 86 },
      { month: 'Nov', value: 88 },
      { month: 'Dec', value: 89 },
      { month: 'Jan', value: 91 },
    ],
  },
];

// Lagging Indicators (Reactive measures)
const LAGGING_INDICATORS = [
  {
    id: 'trir',
    name: 'TRIR',
    fullName: 'Total Recordable Incident Rate',
    description: 'OSHA recordable incidents per 200,000 hours',
    category: 'lagging',
    target: 1.0,
    current: 1.2,
    unit: '',
    trend: 'down',
    change: '-15%',
    period: 'Rolling 12 Months',
    benchmark: 2.8,
    data: [
      { month: 'Aug', value: 1.8 },
      { month: 'Sep', value: 1.6 },
      { month: 'Oct', value: 1.5 },
      { month: 'Nov', value: 1.4 },
      { month: 'Dec', value: 1.3 },
      { month: 'Jan', value: 1.2 },
    ],
  },
  {
    id: 'dart',
    name: 'DART Rate',
    fullName: 'Days Away, Restricted, or Transferred',
    description: 'DART incidents per 200,000 hours worked',
    category: 'lagging',
    target: 0.5,
    current: 0.8,
    unit: '',
    trend: 'down',
    change: '-20%',
    period: 'Rolling 12 Months',
    benchmark: 1.4,
    data: [
      { month: 'Aug', value: 1.2 },
      { month: 'Sep', value: 1.1 },
      { month: 'Oct', value: 1.0 },
      { month: 'Nov', value: 0.9 },
      { month: 'Dec', value: 0.85 },
      { month: 'Jan', value: 0.8 },
    ],
  },
  {
    id: 'ltir',
    name: 'LTIR',
    fullName: 'Lost Time Incident Rate',
    description: 'Lost time incidents per 200,000 hours',
    category: 'lagging',
    target: 0.3,
    current: 0.4,
    unit: '',
    trend: 'down',
    change: '-25%',
    period: 'Rolling 12 Months',
    benchmark: 0.9,
    data: [
      { month: 'Aug', value: 0.7 },
      { month: 'Sep', value: 0.65 },
      { month: 'Oct', value: 0.55 },
      { month: 'Nov', value: 0.5 },
      { month: 'Dec', value: 0.45 },
      { month: 'Jan', value: 0.4 },
    ],
  },
  {
    id: 'severity_rate',
    name: 'Severity Rate',
    fullName: 'Days Lost per Incident',
    description: 'Average days lost per recordable incident',
    category: 'lagging',
    target: 5,
    current: 7.2,
    unit: 'days',
    trend: 'down',
    change: '-10%',
    period: 'YTD',
    benchmark: 12,
    data: [
      { month: 'Aug', value: 9.5 },
      { month: 'Sep', value: 9.0 },
      { month: 'Oct', value: 8.5 },
      { month: 'Nov', value: 8.0 },
      { month: 'Dec', value: 7.5 },
      { month: 'Jan', value: 7.2 },
    ],
  },
  {
    id: 'first_aid',
    name: 'First Aid Cases',
    fullName: 'First Aid Only Incidents',
    description: 'Minor incidents requiring first aid only',
    category: 'lagging',
    target: 10,
    current: 12,
    unit: 'cases',
    trend: 'down',
    change: '-8%',
    period: 'This Month',
    benchmark: 20,
    data: [
      { month: 'Aug', value: 18 },
      { month: 'Sep', value: 16 },
      { month: 'Oct', value: 15 },
      { month: 'Nov', value: 14 },
      { month: 'Dec', value: 13 },
      { month: 'Jan', value: 12 },
    ],
  },
  {
    id: 'days_without_incident',
    name: 'Days Without LTI',
    fullName: 'Days Without Lost Time Incident',
    description: 'Consecutive days since last lost time incident',
    category: 'lagging',
    target: 365,
    current: 127,
    unit: 'days',
    trend: 'up',
    change: '+127',
    period: 'Current Streak',
    benchmark: 90,
    data: [
      { month: 'Aug', value: 45 },
      { month: 'Sep', value: 76 },
      { month: 'Oct', value: 0 }, // Reset
      { month: 'Nov', value: 30 },
      { month: 'Dec', value: 61 },
      { month: 'Jan', value: 127 },
    ],
  },
];

// Incident breakdown by type
const INCIDENT_BREAKDOWN = [
  { name: 'Slips/Trips/Falls', value: 28, color: '#ef4444' },
  { name: 'Struck By/Against', value: 22, color: '#f97316' },
  { name: 'Caught In/Between', value: 15, color: '#eab308' },
  { name: 'Overexertion', value: 18, color: '#22c55e' },
  { name: 'Chemical Exposure', value: 10, color: '#3b82f6' },
  { name: 'Other', value: 7, color: '#8b5cf6' },
];

// Global Standards Compliance (All 21 International Standards)
const GLOBAL_STANDARDS_COMPLIANCE = [
  { id: 'osha', name: 'OSHA', fullName: 'Occupational Safety & Health Administration', region: 'USA', compliance: 96, target: 100, trend: '+2%', color: '#ef4444', audits: 12, lastAudit: '2026-01-15' },
  { id: 'iso', name: 'ISO 45001', fullName: 'Occupational Health & Safety Management', region: 'International', compliance: 94, target: 100, trend: '+3%', color: '#3b82f6', audits: 8, lastAudit: '2026-01-20' },
  { id: 'cal_osha', name: 'Cal/OSHA', fullName: 'California OSHA Standards', region: 'California, USA', compliance: 95, target: 100, trend: '+1%', color: '#eab308', audits: 6, lastAudit: '2026-01-18' },
  { id: 'bsee', name: 'BSEE', fullName: 'Bureau of Safety & Environmental Enforcement', region: 'USA', compliance: 91, target: 100, trend: '+4%', color: '#06b6d4', audits: 4, lastAudit: '2026-01-10' },
  { id: 'asme', name: 'ASME', fullName: 'American Society of Mechanical Engineers', region: 'USA', compliance: 93, target: 100, trend: '+2%', color: '#f59e0b', audits: 5, lastAudit: '2026-01-12' },
  { id: 'ansi', name: 'ANSI', fullName: 'American National Standards Institute', region: 'USA', compliance: 97, target: 100, trend: '+1%', color: '#8b5cf6', audits: 10, lastAudit: '2026-01-22' },
  { id: 'nfpa', name: 'NFPA', fullName: 'National Fire Protection Association', region: 'USA', compliance: 98, target: 100, trend: '+1%', color: '#f97316', audits: 7, lastAudit: '2026-01-19' },
  { id: 'api', name: 'API', fullName: 'American Petroleum Institute', region: 'USA', compliance: 92, target: 100, trend: '+3%', color: '#ec4899', audits: 6, lastAudit: '2026-01-14' },
  { id: 'eu', name: 'EU-OSHA', fullName: 'European Agency for Safety & Health', region: 'European Union', compliance: 89, target: 100, trend: '+5%', color: '#4f46e5', audits: 5, lastAudit: '2026-01-08' },
  { id: 'msha', name: 'MSHA', fullName: 'Mine Safety & Health Administration', region: 'USA', compliance: 94, target: 100, trend: '+2%', color: '#78716c', audits: 4, lastAudit: '2026-01-11' },
  { id: 'imo', name: 'IMO', fullName: 'International Maritime Organization', region: 'International', compliance: 90, target: 100, trend: '+4%', color: '#0ea5e9', audits: 3, lastAudit: '2026-01-05' },
  { id: 'iata', name: 'IATA', fullName: 'International Air Transport Association', region: 'International', compliance: 93, target: 100, trend: '+2%', color: '#2563eb', audits: 4, lastAudit: '2026-01-09' },
  { id: 'who', name: 'WHO', fullName: 'World Health Organization Guidelines', region: 'International', compliance: 91, target: 100, trend: '+3%', color: '#14b8a6', audits: 3, lastAudit: '2026-01-07' },
  { id: 'haccp', name: 'HACCP', fullName: 'Hazard Analysis Critical Control Points', region: 'International', compliance: 96, target: 100, trend: '+1%', color: '#84cc16', audits: 5, lastAudit: '2026-01-16' },
  { id: 'dot', name: 'DOT', fullName: 'Department of Transportation', region: 'USA', compliance: 95, target: 100, trend: '+2%', color: '#f43f5e', audits: 6, lastAudit: '2026-01-13' },
  { id: 'csa', name: 'CSA', fullName: 'Canadian Standards Association', region: 'Canada', compliance: 93, target: 100, trend: '+3%', color: '#dc2626', audits: 4, lastAudit: '2026-01-06' },
  { id: 'asnzs', name: 'AS/NZS', fullName: 'Australian/New Zealand Standards', region: 'Australia/NZ', compliance: 88, target: 100, trend: '+6%', color: '#16a34a', audits: 3, lastAudit: '2026-01-04' },
  { id: 'nebosh', name: 'NEBOSH', fullName: 'National Examination Board in OSH', region: 'UK/International', compliance: 92, target: 100, trend: '+3%', color: '#c026d3', audits: 5, lastAudit: '2026-01-17' },
  { id: 'gcc', name: 'GCC', fullName: 'Gulf Cooperation Council Standards', region: 'Middle East', compliance: 87, target: 100, trend: '+5%', color: '#d97706', audits: 3, lastAudit: '2026-01-03' },
  { id: 'epa', name: 'EPA', fullName: 'Environmental Protection Agency', region: 'USA', compliance: 94, target: 100, trend: '+2%', color: '#22c55e', audits: 8, lastAudit: '2026-01-21' },
  { id: 'niosh', name: 'NIOSH', fullName: 'National Institute for Occupational Safety', region: 'USA', compliance: 95, target: 100, trend: '+1%', color: '#a855f7', audits: 6, lastAudit: '2026-01-19' },
];

// Risk Scoring Per Standard
const RISK_SCORING: { standardId: string; name: string; likelihood: number; severity: number; riskScore: number; riskLevel: string; mitigation: string; gaps: number; color: string }[] = GLOBAL_STANDARDS_COMPLIANCE.map(s => {
  const likelihood = Math.max(1, Math.round((100 - s.compliance) / 10) + 1);
  const severity = s.compliance < 88 ? 5 : s.compliance < 92 ? 4 : s.compliance < 95 ? 3 : s.compliance < 98 ? 2 : 1;
  const riskScore = likelihood * severity;
  const riskLevel = riskScore >= 15 ? 'Critical' : riskScore >= 10 ? 'High' : riskScore >= 5 ? 'Medium' : 'Low';
  const gaps = Math.round((100 - s.compliance) * s.audits / 10);
  const mitigation = riskScore >= 15 ? 'Immediate action required' : riskScore >= 10 ? 'Priority remediation' : riskScore >= 5 ? 'Scheduled review' : 'Monitor & maintain';
  return { standardId: s.id, name: s.name, likelihood, severity, riskScore, riskLevel, mitigation, gaps, color: s.color };
});

// Compliance Gap Trend Data (12 months)
const COMPLIANCE_GAP_TRENDS = [
  { month: 'Mar', osha: 91, iso: 88, epa: 85, nfpa: 93, euOsha: 82, avg: 87.8 },
  { month: 'Apr', osha: 92, iso: 89, epa: 86, nfpa: 94, euOsha: 83, avg: 88.8 },
  { month: 'May', osha: 92, iso: 90, epa: 87, nfpa: 94, euOsha: 84, avg: 89.4 },
  { month: 'Jun', osha: 93, iso: 90, epa: 88, nfpa: 95, euOsha: 85, avg: 90.2 },
  { month: 'Jul', osha: 93, iso: 91, epa: 89, nfpa: 96, euOsha: 85, avg: 90.8 },
  { month: 'Aug', osha: 94, iso: 91, epa: 89, nfpa: 96, euOsha: 86, avg: 91.2 },
  { month: 'Sep', osha: 94, iso: 92, epa: 90, nfpa: 97, euOsha: 87, avg: 92.0 },
  { month: 'Oct', osha: 95, iso: 93, epa: 91, nfpa: 97, euOsha: 87, avg: 92.6 },
  { month: 'Nov', osha: 95, iso: 93, epa: 92, nfpa: 98, euOsha: 88, avg: 93.2 },
  { month: 'Dec', osha: 96, iso: 93, epa: 93, nfpa: 98, euOsha: 88, avg: 93.6 },
  { month: 'Jan', osha: 96, iso: 94, epa: 94, nfpa: 98, euOsha: 89, avg: 94.2 },
  { month: 'Feb', osha: 96, iso: 94, epa: 94, nfpa: 98, euOsha: 89, avg: 94.2 },
];

// Department comparison
const DEPT_COMPARISON = [
  { dept: 'Operations', leading: 92, lagging: 1.1 },
  { dept: 'Maintenance', leading: 88, lagging: 1.4 },
  { dept: 'Construction', leading: 85, lagging: 1.8 },
  { dept: 'Warehouse', leading: 90, lagging: 1.2 },
  { dept: 'Admin', leading: 95, lagging: 0.5 },
];

// Risk Heat Map Data
const RISK_HEAT_MAP = [
  { region: 'North America', riskScore: 12, riskLevel: 'Medium', compliance: 94, trend: 'stable' },
  { region: 'Europe', riskScore: 8, riskLevel: 'Low', compliance: 96, trend: 'improving' },
  { region: 'Asia Pacific', riskScore: 18, riskLevel: 'High', compliance: 88, trend: 'degrading' },
  { region: 'Middle East', riskScore: 15, riskLevel: 'Medium', compliance: 90, trend: 'stable' },
  { region: 'Latin America', riskScore: 22, riskLevel: 'Critical', compliance: 82, trend: 'improving' },
  { region: 'Africa', riskScore: 20, riskLevel: 'Critical', compliance: 85, trend: 'stable' }
];

export const KPIIndicators: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'leading' | 'lagging' | 'comparison' | 'compliance' | 'weekly'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  // ── Real API Data ─────────────────────────────────────────────────────
  const { data: kpiDashboardData } = useKPIDashboard();
  const { data: deptComparisonRaw } = useKPIDepartmentComparison();
  const { data: incidentBreakdownRaw } = useKPIIncidentBreakdown();

  // Merge API leading indicators (API takes precedence over hardcoded defaults)
  const leadingIndicators = useMemo(() => {
    const apiItems = (kpiDashboardData as any[] || []).filter((d: any) => d.category === 'leading');
    return LEADING_INDICATORS.map(ind => {
      const api = apiItems.find((d: any) => d.kpiCode === ind.id);
      if (!api || api.latestValue === null) return ind;
      return {
        ...ind,
        current: api.latestValue,
        trend: (api.trendVsPrev ?? ind.trend) as 'up' | 'down',
        change: api.changePct ?? ind.change,
        data: api.history?.length >= 2 ? api.history : ind.data,
      };
    });
  }, [kpiDashboardData]);

  // Merge API lagging indicators
  const laggingIndicators = useMemo(() => {
    const apiItems = (kpiDashboardData as any[] || []).filter((d: any) => d.category === 'lagging');
    return LAGGING_INDICATORS.map(ind => {
      const api = apiItems.find((d: any) => d.kpiCode === ind.id);
      if (!api || api.latestValue === null) return ind;
      return {
        ...ind,
        current: api.latestValue,
        trend: (api.trendVsPrev ?? ind.trend) as 'up' | 'down',
        change: api.changePct ?? ind.change,
        data: api.history?.length >= 2 ? api.history : ind.data,
      };
    });
  }, [kpiDashboardData]);

  // Overview summary stats from API (falls back to hardcoded defaults)
  const overviewStats = useMemo(() => {
    const allKpis = kpiDashboardData as any[] || [];
    const leadings = allKpis.filter((d: any) => d.category === 'leading' && d.latestValue !== null && d.target);
    const leadingScore = leadings.length
      ? Math.round(leadings.reduce((s: number, d: any) => s + Math.min((d.latestValue / d.target) * 100, 100), 0) / leadings.length)
      : 91;
    const trirApi   = allKpis.find((d: any) => d.kpiCode === 'trir');
    const daysApi   = allKpis.find((d: any) => d.kpiCode === 'days_without_incident');
    const trainApi  = allKpis.find((d: any) => d.kpiCode === 'training_completion');
    return {
      leadingScore,
      trir:           trirApi?.latestValue  ?? 1.2,
      daysWithoutLTI: daysApi?.latestValue  ?? 127,
      training:       trainApi?.latestValue ?? 94,
    };
  }, [kpiDashboardData]);

  // Department comparison — use API data when available
  const deptComparison = useMemo(() =>
    (deptComparisonRaw as any[] || []).length >= 2
      ? (deptComparisonRaw as any[])
      : DEPT_COMPARISON
  , [deptComparisonRaw]);

  // Incident breakdown — use API data when available
  const incidentBreakdown = useMemo(() =>
    (incidentBreakdownRaw as any[] || []).length >= 2
      ? (incidentBreakdownRaw as any[])
      : INCIDENT_BREAKDOWN
  , [incidentBreakdownRaw]);

  const previousLeadingScore = useMemo(() => {
    const priorValues = leadingIndicators
      .map((indicator) => {
        const priorPoint = indicator.data?.[indicator.data.length - 2];
        return priorPoint ? Math.min((priorPoint.value / indicator.target) * 100, 100) : null;
      })
      .filter((value): value is number => value !== null);

    if (priorValues.length === 0) {
      return overviewStats.leadingScore;
    }

    return Math.round(priorValues.reduce((sum, value) => sum + value, 0) / priorValues.length);
  }, [leadingIndicators, overviewStats.leadingScore]);

  const weeklyReportData = useMemo(() => buildWeeklySafetyReportData({
    overview: overviewStats,
    previousLeadingScore,
    leadingIndicators: leadingIndicators.slice(0, 6).map(indicator => ({
      name: indicator.name,
      current: indicator.current,
      target: indicator.target,
    })),
    laggingIndicators: laggingIndicators.slice(0, 6).map(indicator => ({
      name: indicator.name,
      current: indicator.current,
      target: indicator.target,
      benchmark: indicator.benchmark,
    })),
    incidentBreakdown: incidentBreakdown.map(item => ({
      name: item.name,
      value: item.value,
    })),
  }), [incidentBreakdown, laggingIndicators, leadingIndicators, overviewStats, previousLeadingScore]);

  const weeklyReportSections = useMemo(() => {
    const toolboxSnapshot = weeklyReportData.toolboxTalks[0];
    const trainingSnapshot = weeklyReportData.trainingRecords[0];
    const inspectionSnapshot = weeklyReportData.inspections[0];

    return [
      { icon: Shield, title: 'Executive Summary', desc: `${weeklyReportData.summary.safetyScore}% safety score, TRIR ${weeklyReportData.summary.trir}, DART ${weeklyReportData.summary.dart}` },
      { icon: AlertTriangle, title: 'Incident Summary', desc: `${weeklyReportData.summary.totalIncidents} live incident categories in the current reporting window` },
      { icon: Eye, title: 'Near Miss Reports', desc: `${weeklyReportData.summary.nearMisses} near-miss items represented in the current incident mix` },
      { icon: TrendingUp, title: 'KPI Analysis', desc: `${weeklyReportData.kpis.leadingIndicators.length} leading and ${weeklyReportData.kpis.laggingIndicators.length} lagging indicators included` },
      { icon: MessageSquare, title: 'Toolbox Talks', desc: toolboxSnapshot ? `${toolboxSnapshot.attendees}% participation snapshot from live KPI data` : 'No toolbox talk KPI snapshot available for this period' },
      { icon: Users, title: 'Training Records', desc: trainingSnapshot ? trainingSnapshot.status : 'No training compliance snapshot available for this period' },
      { icon: ClipboardCheck, title: 'Inspection Results', desc: inspectionSnapshot ? `${inspectionSnapshot.score}% inspection completion with ${inspectionSnapshot.findings} related findings` : 'No inspection KPI snapshot available for this period' },
      { icon: HardHat, title: 'CAPA Status', desc: `${weeklyReportData.summary.openCAPAs} open CAPA items represented in the current KPI dataset` },
    ];
  }, [weeklyReportData]);

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (current: number, target: number, isLagging: boolean) => {
    const ratio = current / target;
    if (isLagging) {
      // For lagging (lower is better)
      if (ratio <= 1) return 'bg-emerald-500';
      if (ratio <= 1.5) return 'bg-amber-500';
      return 'bg-red-500';
    } else {
      // For leading (higher is better)
      if (ratio >= 0.9) return 'bg-emerald-500';
      if (ratio >= 0.7) return 'bg-amber-500';
      return 'bg-red-500';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'leading', label: 'Leading', icon: TrendingUp },
    { id: 'lagging', label: 'Lagging', icon: TrendingDown },
    { id: 'comparison', label: 'Compare', icon: PieChart },
    { id: 'weekly', label: 'Weekly Report', icon: FileText },
    { id: 'compliance', label: 'Standards', icon: Shield },
  ];

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-950">

      
      {/* Header */}
      <header className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 sticky top-[72px] z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-300" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-brand-900 dark:text-white">KPI Dashboard</h1>
                  <p className="text-sm text-surface-500 dark:text-surface-400">Leading & Lagging Indicators</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white text-sm"
              >
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="12months">Last 12 Months</option>
                <option value="ytd">Year to Date</option>
              </select>
              <button 
                onClick={() => exportWeeklyReportPDF(weeklyReportData)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-8">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 opacity-80" />
                    <span className="text-sm font-medium opacity-80">Leading Score</span>
                  </div>
                  <div className="text-3xl font-bold">{overviewStats.leadingScore}%</div>
                  <div className="text-sm opacity-80 mt-1">+5% from last month</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 opacity-80" />
                    <span className="text-sm font-medium opacity-80">TRIR</span>
                  </div>
                  <div className="text-3xl font-bold">{overviewStats.trir}</div>
                  <div className="text-sm opacity-80 mt-1">-15% YoY improvement</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 opacity-80" />
                    <span className="text-sm font-medium opacity-80">Days w/o LTI</span>
                  </div>
                  <div className="text-3xl font-bold">{overviewStats.daysWithoutLTI}</div>
                  <div className="text-sm opacity-80 mt-1">Target: 365 days</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 opacity-80" />
                    <span className="text-sm font-medium opacity-80">Training</span>
                  </div>
                  <div className="text-3xl font-bold">{overviewStats.training}%</div>
                  <div className="text-sm opacity-80 mt-1">Completion rate</div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leading vs Lagging Trend */}
                <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                  <h3 className="font-semibold text-brand-900 dark:text-white mb-4">Performance Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={leadingIndicators[0]?.data || LEADING_INDICATORS[0].data}>
                      <defs>
                        <linearGradient id="colorLeading" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorLeading)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Incident Breakdown */}
                <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                  <h3 className="font-semibold text-brand-900 dark:text-white mb-4">Incident Types</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <RePieChart>
                      <Pie
                        data={incidentBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {incidentBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...leadingIndicators.slice(0, 3), ...laggingIndicators.slice(0, 3)].map((indicator, idx) => (
                  <div key={indicator.id} className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-soft border border-surface-100 dark:border-surface-700">
                    <div className="text-xs text-surface-500 dark:text-surface-400 mb-1">{indicator.name}</div>
                    <div className="text-2xl font-bold text-brand-900 dark:text-white">
                      {indicator.current}{indicator.unit && indicator.unit !== '%' ? '' : indicator.unit}
                    </div>
                    <div className={`text-xs font-medium flex items-center gap-1 mt-1 ${
                      indicator.trend === 'up' ? 'text-emerald-600' : 'text-emerald-600'
                    }`}>
                      {indicator.category === 'lagging' ? (
                        <ArrowDownRight className="w-3 h-3" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3" />
                      )}
                      {indicator.change}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Leading Indicators Tab */}
          {activeTab === 'leading' && (
            <motion.div
              key="leading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-900 dark:text-white">Leading Indicators</h2>
                  <p className="text-sm text-surface-500">Proactive safety measures that predict future performance</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leadingIndicators.map((indicator, idx) => (
                  <motion.div
                    key={indicator.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-soft border border-surface-100 dark:border-surface-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-brand-900 dark:text-white">{indicator.name}</h3>
                        <p className="text-xs text-surface-500 dark:text-surface-400">{indicator.description}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        indicator.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {indicator.change}
                      </span>
                    </div>

                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <div className="text-3xl font-bold text-brand-900 dark:text-white">{indicator.current}</div>
                        <div className="text-xs text-surface-500">Target: {indicator.target} {indicator.unit}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-surface-600 dark:text-surface-400">{Math.round(calculateProgress(indicator.current, indicator.target))}%</div>
                        <div className="text-xs text-surface-400">{indicator.period}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(indicator.current, indicator.target, false)}`}
                        style={{ width: `${calculateProgress(indicator.current, indicator.target)}%` }}
                      />
                    </div>

                    {/* Sparkline */}
                    <ResponsiveContainer width="100%" height={60}>
                      <AreaChart data={indicator.data}>
                        <defs>
                          <linearGradient id={`gradient-${indicator.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill={`url(#gradient-${indicator.id})`} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Lagging Indicators Tab */}
          {activeTab === 'lagging' && (
            <motion.div
              key="lagging"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-900 dark:text-white">Lagging Indicators</h2>
                  <p className="text-sm text-surface-500">Outcome-based metrics measuring historical safety performance</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {laggingIndicators.map((indicator, idx) => (
                  <motion.div
                    key={indicator.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-soft border border-surface-100 dark:border-surface-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-brand-900 dark:text-white">{indicator.name}</h3>
                        <p className="text-xs text-surface-500 dark:text-surface-400">{indicator.fullName}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        indicator.id === 'days_without_incident' 
                          ? (indicator.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')
                          : (indicator.trend === 'down' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')
                      }`}>
                        {indicator.change}
                      </span>
                    </div>

                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <div className="text-3xl font-bold text-brand-900 dark:text-white">{indicator.current}</div>
                        <div className="text-xs text-surface-500">Target: {indicator.target} {indicator.unit} • Industry: {indicator.benchmark}</div>
                      </div>
                    </div>

                    {/* Comparison Bar */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1">
                        <div className="text-[10px] text-surface-400 mb-1">Current vs Target</div>
                        <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              indicator.id === 'days_without_incident' 
                                ? getProgressColor(indicator.current, indicator.target, false)
                                : getProgressColor(indicator.current, indicator.target, true)
                            }`}
                            style={{ width: `${Math.min((indicator.current / Math.max(indicator.target, indicator.benchmark)) * 100, 100)}%` }}
                          />
                          <div 
                            className="absolute top-0 h-full w-0.5 bg-surface-400"
                            style={{ left: `${(indicator.target / Math.max(indicator.target, indicator.benchmark)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sparkline */}
                    <ResponsiveContainer width="100%" height={60}>
                      <AreaChart data={indicator.data}>
                        <defs>
                          <linearGradient id={`gradient-lag-${indicator.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill={`url(#gradient-lag-${indicator.id})`} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Weekly Report Tab */}
          {activeTab === 'weekly' && (
            <motion.div
              key="weekly"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-brand-900 dark:text-white">Weekly Safety Report</h2>
                    <p className="text-sm text-surface-500">Generate and export comprehensive weekly safety reports</p>
                  </div>
                </div>
              </div>

              {/* Report Summary */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <h3 className="font-semibold text-brand-900 dark:text-white mb-4">
                  Report Period: {weeklyReportData.reportPeriod.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {weeklyReportData.reportPeriod.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Safety Score</div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{weeklyReportData.summary.safetyScore}%</div>
                    <div className="text-xs text-emerald-600">Derived from live leading KPI performance</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Incidents</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{weeklyReportData.summary.totalIncidents}</div>
                    <div className="text-xs text-blue-600">Based on current incident breakdown dataset</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                    <div className="text-xs text-amber-600 dark:text-amber-400 mb-1">Near Misses</div>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{weeklyReportData.summary.nearMisses}</div>
                    <div className="text-xs text-amber-600">Pulled from current incident category mix</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                    <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Toolbox Talks</div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{weeklyReportData.toolboxTalks[0]?.attendees ?? 0}%</div>
                    <div className="text-xs text-purple-600">Live participation snapshot from KPI data</div>
                  </div>
                </div>

                {/* Report Sections */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-brand-900 dark:text-white">Report Includes:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {weeklyReportSections.map((section, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                          <section.icon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-brand-900 dark:text-white text-sm">{section.title}</div>
                          <div className="text-xs text-surface-500">{section.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                  <button
                    onClick={() => exportWeeklyReportPDF(weeklyReportData)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF Report
                  </button>
                  <button
                    onClick={() => exportWeeklyReportExcel(weeklyReportData)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export to Excel
                  </button>
                  <button
                    onClick={() => navigate('/near-miss')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-xl font-medium hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Near Miss Reports
                  </button>
                  <button
                    onClick={() => navigate('/toolbox-talks')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-xl font-medium hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Toolbox Talks
                  </button>
                </div>
              </div>

              {/* Scheduled Reports */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-brand-900 dark:text-white">Scheduled Reports</h3>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                    Configure
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Weekly Safety Summary', frequency: 'Every Monday 8:00 AM', recipients: 'Safety Team, Management', status: 'active' },
                    { name: 'Monthly KPI Report', frequency: '1st of each month', recipients: 'Executive Team', status: 'active' },
                    { name: 'Incident Digest', frequency: 'Daily 6:00 PM', recipients: 'Safety Manager', status: 'active' },
                  ].map((schedule, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-brand-900 dark:text-white">{schedule.name}</div>
                          <div className="text-xs text-surface-500">{schedule.frequency} • {schedule.recipients}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Active</span>
                        <button className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-600 rounded-lg transition-colors">
                          <Settings className="w-4 h-4 text-surface-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Compliance Standards Tab */}
          {activeTab === 'compliance' && (
            <motion.div
              key="compliance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-900 dark:text-white">Global Compliance Standards</h2>
                  <p className="text-sm text-surface-500">All 21 international safety & compliance standards with KPI tracking</p>
                </div>
              </div>

              {/* Summary Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
                  <div className="text-sm font-medium opacity-80">Avg Compliance</div>
                  <div className="text-3xl font-bold">{Math.round(GLOBAL_STANDARDS_COMPLIANCE.reduce((s, c) => s + c.compliance, 0) / GLOBAL_STANDARDS_COMPLIANCE.length)}%</div>
                  <div className="text-sm opacity-80 mt-1">Across 21 standards</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
                  <div className="text-sm font-medium opacity-80">Total Audits</div>
                  <div className="text-3xl font-bold">{GLOBAL_STANDARDS_COMPLIANCE.reduce((s, c) => s + c.audits, 0)}</div>
                  <div className="text-sm opacity-80 mt-1">This quarter</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
                  <div className="text-sm font-medium opacity-80">At Risk</div>
                  <div className="text-3xl font-bold">{GLOBAL_STANDARDS_COMPLIANCE.filter(s => s.compliance < 90).length}</div>
                  <div className="text-sm opacity-80 mt-1">Standards below 90%</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white">
                  <div className="text-sm font-medium opacity-80">Regions Covered</div>
                  <div className="text-3xl font-bold">{new Set(GLOBAL_STANDARDS_COMPLIANCE.map(s => s.region)).size}</div>
                  <div className="text-sm opacity-80 mt-1">Global reach</div>
                </div>
              </div>

              {/* Compliance Bar Chart */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <h3 className="font-semibold text-brand-900 dark:text-white mb-4">Compliance Rate by Standard</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={GLOBAL_STANDARDS_COMPLIANCE} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={75} />
                    <Tooltip formatter={(val: number) => [`${val}%`, 'Compliance']} />
                    <Bar dataKey="compliance" radius={[0, 4, 4, 0]}>
                      {GLOBAL_STANDARDS_COMPLIANCE.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Compliance Gap Trend Chart */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-brand-900 dark:text-white">Compliance Gap Trend (12 Months)</h3>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">↑ 6.4% overall improvement</span>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <ReLineChart data={COMPLIANCE_GAP_TRENDS}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val: number) => [`${val}%`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="osha" name="OSHA" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="iso" name="ISO 45001" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="epa" name="EPA" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="nfpa" name="NFPA" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="euOsha" name="EU-OSHA" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="avg" name="Average" stroke="#64748b" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                  </ReLineChart>
                </ResponsiveContainer>
              </div>

              {/* Risk Heat Map by Region */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-brand-900 dark:text-white">Global Risk Heat Map</h3>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-medium text-surface-600 dark:text-surface-400"><span className="w-2 h-2 rounded-full bg-red-500" />Critical</span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-surface-600 dark:text-surface-400"><span className="w-2 h-2 rounded-full bg-orange-500" />High</span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-surface-600 dark:text-surface-400"><span className="w-2 h-2 rounded-full bg-amber-500" />Medium</span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-surface-600 dark:text-surface-400"><span className="w-2 h-2 rounded-full bg-emerald-500" />Low</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {RISK_HEAT_MAP.map((region) => (
                    <div key={region.region} className={`p-4 rounded-xl border ${
                      region.riskLevel === 'Critical' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                      region.riskLevel === 'High' ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' :
                      region.riskLevel === 'Medium' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
                      'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-surface-900 dark:text-white">{region.region}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          region.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' :
                          region.riskLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                          region.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>{region.riskLevel}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-xs text-surface-500">Risk Score</div>
                          <div className="text-2xl font-black text-surface-900 dark:text-white">{region.riskScore}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-surface-500">Compliance</div>
                          <div className="text-lg font-bold text-surface-900 dark:text-white">{region.compliance}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Scoring Matrix */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-brand-900 dark:text-white">Risk Scoring per Standard</h3>
                    <p className="text-xs text-surface-500 mt-1">Likelihood × Severity = Risk Score (1-25 scale)</p>
                  </div>
                  <div className="flex gap-2">
                    {[{ label: 'Critical', color: 'bg-red-500' }, { label: 'High', color: 'bg-orange-500' }, { label: 'Medium', color: 'bg-amber-500' }, { label: 'Low', color: 'bg-emerald-500' }].map(l => (
                      <span key={l.label} className="flex items-center gap-1 text-[10px] font-medium text-surface-600 dark:text-surface-400">
                        <span className={`w-2 h-2 rounded-full ${l.color}`} />{l.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-600">
                        <th className="text-left py-3 px-3 text-xs font-bold text-surface-500 uppercase">Standard</th>
                        <th className="text-center py-3 px-2 text-xs font-bold text-surface-500 uppercase">Likelihood</th>
                        <th className="text-center py-3 px-2 text-xs font-bold text-surface-500 uppercase">Severity</th>
                        <th className="text-center py-3 px-2 text-xs font-bold text-surface-500 uppercase">Risk Score</th>
                        <th className="text-center py-3 px-2 text-xs font-bold text-surface-500 uppercase">Level</th>
                        <th className="text-center py-3 px-2 text-xs font-bold text-surface-500 uppercase">Gaps</th>
                        <th className="text-left py-3 px-3 text-xs font-bold text-surface-500 uppercase">Mitigation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RISK_SCORING.sort((a, b) => b.riskScore - a.riskScore).map((rs, idx) => (
                        <tr key={rs.standardId} className={`border-b border-surface-100 dark:border-surface-700 ${idx % 2 === 0 ? 'bg-surface-50/50 dark:bg-surface-700/20' : ''}`}>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rs.color }} />
                              <span className="font-semibold text-brand-900 dark:text-white">{rs.name}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                              rs.likelihood >= 4 ? 'bg-red-100 text-red-700' : rs.likelihood >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>{rs.likelihood}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                              rs.severity >= 4 ? 'bg-red-100 text-red-700' : rs.severity >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>{rs.severity}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-black ${
                              rs.riskLevel === 'Critical' ? 'bg-red-100 text-red-700 ring-2 ring-red-300' :
                              rs.riskLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                              rs.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>{rs.riskScore}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                              rs.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' :
                              rs.riskLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                              rs.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>{rs.riskLevel}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="font-semibold text-surface-700 dark:text-surface-300">{rs.gaps}</span>
                          </td>
                          <td className="py-3 px-3 text-xs text-surface-600 dark:text-surface-400">{rs.mitigation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Standards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {GLOBAL_STANDARDS_COMPLIANCE.map((standard, idx) => (
                  <motion.div
                    key={standard.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-soft border border-surface-100 dark:border-surface-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: standard.color + '20' }}>
                          <Shield className="w-5 h-5" style={{ color: standard.color }} />
                        </div>
                        <div>
                          <h4 className="font-bold text-brand-900 dark:text-white">{standard.name}</h4>
                          <p className="text-[10px] text-surface-500 dark:text-surface-400">{standard.region}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        standard.compliance >= 95 ? 'bg-emerald-100 text-emerald-700' :
                        standard.compliance >= 90 ? 'bg-blue-100 text-blue-700' :
                        standard.compliance >= 85 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {standard.trend}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-3 line-clamp-1">{standard.fullName}</p>
                    <div className="flex items-end justify-between mb-2">
                      <div className="text-2xl font-bold text-brand-900 dark:text-white">{standard.compliance}%</div>
                      <div className="text-xs text-surface-500">{standard.audits} audits</div>
                    </div>
                    <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${standard.compliance}%`, backgroundColor: standard.color }}
                      />
                    </div>
                    <div className="text-[10px] text-surface-400 mt-2">Last audit: {standard.lastAudit}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Comparison Tab */}
          {activeTab === 'comparison' && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-900 dark:text-white">Department Comparison</h2>
                  <p className="text-sm text-surface-500">Compare leading and lagging performance across departments</p>
                </div>
              </div>

              {/* Department Comparison Chart */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <h3 className="font-semibold text-brand-900 dark:text-white mb-4">Leading Score by Department</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deptComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="leading" fill="#10b981" name="Leading Score %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Department Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deptComparison.map((dept, idx) => (
                  <motion.div
                    key={dept.dept}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-soft border border-surface-100 dark:border-surface-700"
                  >
                    <h4 className="font-semibold text-brand-900 dark:text-white mb-3">{dept.dept}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-surface-500 mb-1">Leading Score</div>
                        <div className="text-2xl font-bold text-emerald-600">{dept.leading}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-surface-500 mb-1">TRIR</div>
                        <div className="text-2xl font-bold text-blue-600">{dept.lagging}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default KPIIndicators;
