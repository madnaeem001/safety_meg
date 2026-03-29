import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  Car, 
  Building2, 
  FileSearch, 
  Heart, 
  Target, 
  ArrowLeft,
  ChevronRight,
  Plus,
  Search,
  LayoutGrid,
  List,
  Leaf,
  CloudRain,
  Droplets,
  ClipboardCheck,
  BarChart3,
  Brain,
  Bell,
  Settings,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Zap,
  Activity,
  FileText,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  ChevronDown,
  ExternalLink,
  Flame,
  Factory,
  Wind,
  Thermometer,
  Gauge,
  Volume2,
  Radio,
  X,
  Fingerprint,
  History,
  Home,
  Printer,
  Download,
  Eye,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PenLine,
  Lock,
  Terminal,
  Globe
} from 'lucide-react';
import { EHSWorkflowDashboard } from '../components/safety/EHSWorkflow';
import { UnifiedSafetyHub } from '../components/dashboard/UnifiedSafetyHub';
import { CombinedIncidentInjuryReport } from '../components/safety/CombinedIncidentInjuryReport';
import { PropertyDamageReport } from '../components/safety/PropertyDamageReport';
import { UniversalJSA } from '../components/safety/UniversalJSA';
import { EHSAIAssistant } from '../components/safety/AIAssistant/EHSAIAssistant';
import { IncidentAnalytics } from '../components/safety/IncidentAnalytics/IncidentAnalytics';
import { QualityManagement } from '../components/safety/QualityManagement/QualityManagement';
import { OSHAISOWorkflow } from '../components/safety/OSHAISOWorkflow/OSHAISOWorkflow';
import { OSHALogGenerator } from '../components/safety/OSHALogGenerator/OSHALogGenerator';
import { AuditTrail } from '../components/safety/AuditTrail';
import { ComplianceDashboard } from '../components/safety/ComplianceDashboard';
import { ESignatureCertificate } from '../components/safety/ESignatureCertificate';
import { RealTimeNotifications } from '../components/safety/RealTimeNotifications';
import { QRCodeFeature } from '../components/safety/QRCodeFeature';
import { NotificationEmailTemplates } from '../components/safety/EmailTemplates';
import { PushNotifications } from '../components/safety/PushNotifications';
import { OfflineSyncManager } from '../utils/offline';
import { VoiceCommands } from '../components/voice';
import { CollaborationPanel } from '../components/collaboration';
import { DashboardWidgets } from '../components/widgets';
import { BiometricAuth } from '../components/auth';
import { IncidentAnalyticsDashboard } from '../components/analytics';
import { SafetyReportTemplates, SafetyGoalsTargets } from '../components/reports';
import { TeamLeaderboard } from '../components/leaderboard';
import { OpenAPIIntegration } from '../components/safety/OpenAPIIntegration';
import { QRCodeAudit } from '../components/safety/QRCodeAudit';
import { MobileDataCollection } from '../components/safety/MobileDataCollection';
import { AIRiskAnalysis } from '../components/safety/AIRiskAnalysis';
import { RealTimeAlerts } from '../components/dashboard/RealTimeAlerts';
import { UnifiedInvestigation } from '../components/safety/UnifiedInvestigation';
import { InjuryTrendAnalytics } from '../components/safety/InjuryTrendAnalytics';
import { EnhancedInjuryReport } from '../components/safety/EnhancedInjuryReport';
import { NotificationProvider, NotificationBell } from '../components/safety/NotificationService';
import { CAPAReminder } from '../components/safety/CAPAReminder';
import { AIAnalyticsDashboard, AIChat } from '../components/safety/AIAnalyticsEngine';
import { PhotoUpload } from '../components/safety/PhotoUpload';
import { AIMalwareSecurity } from '../components/safety/AIMalwareSecurity';
import InternationalStandards from './InternationalStandards';
import { RealTimeThreatAlerts } from '../components/safety/RealTimeThreatAlerts';
import { SecurityIncidentResponse } from '../components/safety/SecurityIncidentResponse';
import {
  useDashboardOverview,
  useDashboardLiveStats,
  useIncidentStats,
  useCapaRecords,
  useInspectionSchedule,
} from '../api/hooks/useAPIHooks';

// Simplified section types
type MainSectionType = 'dashboard' | 'incidents' | 'compliance' | 'analytics' | 'tools';

// Metric configuration for customization
interface MetricConfig {
  id: string;
  label: string;
  value: number | string;
  trend?: number;
  target?: number;
  icon: React.ElementType;
  color: string;
  unit?: string;
  visible: boolean;
  order: number;
}

// Default metrics configuration
const defaultMetrics: MetricConfig[] = [
  { id: 'safetyScore', label: 'Safety Score', value: 94, trend: 5, icon: Shield, color: 'bg-success', unit: '%', visible: true, order: 0 },
  { id: 'openIncidents', label: 'Open Incidents', value: 7, trend: -2, icon: AlertTriangle, color: 'bg-surface-raised', visible: true, order: 1 },
  { id: 'daysWithoutLTI', label: 'Days Without LTI', value: 42, target: 90, icon: CheckCircle2, color: 'bg-surface-raised', visible: true, order: 2 },
  { id: 'complianceRate', label: 'Compliance Rate', value: 97, trend: 3, icon: ClipboardCheck, color: 'bg-surface-raised', unit: '%', visible: true, order: 3 },
  { id: 'trir', label: 'TRIR', value: 2.8, trend: -0.5, icon: Activity, color: 'bg-surface-raised', visible: false, order: 4 },
  { id: 'nearMisses', label: 'Near Misses (MTD)', value: 24, trend: 8, icon: Eye, color: 'bg-surface-raised', visible: false, order: 5 },
  { id: 'trainingCompletion', label: 'Training Completion', value: 92, unit: '%', icon: Users, color: 'bg-surface-raised', visible: false, order: 6 },
  { id: 'auditsCompleted', label: 'Audits Completed', value: 12, icon: ClipboardCheck, color: 'bg-surface-raised', visible: false, order: 7 },
  { id: 'correctiveActions', label: 'Open CAPAs', value: 8, icon: Target, color: 'bg-surface-raised', visible: false, order: 8 },
  { id: 'riskScore', label: 'Risk Score', value: 'Low', icon: Gauge, color: 'bg-surface-raised', visible: false, order: 9 },
];

// Quick stats mock data (backward compatible)
const quickStats = {
  safetyScore: 94,
  safetyTrend: 5,
  openIncidents: 7,
  incidentTrend: -2,
  daysWithoutLTI: 42,
  daysTarget: 90,
  complianceRate: 97,
  complianceTrend: 3,
  pendingActions: 12,
  upcomingInspections: 3,
  trainingDue: 8,
  activePermits: 4
};

// Recent incidents data
const recentIncidents = [
  { id: 'INC-2026-001', type: 'incident', title: 'Near miss - falling object', severity: 'medium', status: 'open', date: '2026-01-25', location: 'Warehouse A', assignee: 'John Smith' },
  { id: 'INJ-2026-002', type: 'injury', title: 'Hand laceration from equipment', severity: 'high', status: 'investigating', date: '2026-01-24', location: 'Production Line 4', assignee: 'Emily Chen' },
  { id: 'VEH-2026-003', type: 'vehicle', title: 'Forklift collision with rack', severity: 'high', status: 'capa-pending', date: '2026-01-23', location: 'Loading Dock', assignee: 'Sarah Johnson' },
  { id: 'ENV-2026-004', type: 'environmental', title: 'Minor chemical spill', severity: 'medium', status: 'resolved', date: '2026-01-22', location: 'Lab 102', assignee: 'Mike Davis' },
];

// Quick action items
const quickActions = [
  { id: 'new-incident', label: 'Report Incident', icon: AlertTriangle, color: 'bg-danger', route: '/report-incident' },
  { id: 'near-miss', label: 'Near Miss', icon: Eye, color: 'bg-warning', route: '/near-miss' },
  { id: 'toolbox-talks', label: 'Toolbox Talk', icon: MessageSquare, color: 'bg-accent', route: '/toolbox-talks' },
  { id: 'kpi-dashboard', label: 'KPI Dashboard', icon: BarChart3, color: 'bg-primary', route: '/kpi-indicators' },
  { id: 'jsa', label: 'New JSA', icon: ClipboardCheck, color: 'bg-success', route: '/hazard-assessment' },
  { id: 'audit', label: 'Safety Audit', icon: Shield, color: 'bg-accent', route: '/safety-audit' },
];

// Module cards for dashboard
const moduleCards = [
  { 
    id: 'incidents', 
    title: 'Incident Management', 
    description: 'Report and track all types of incidents, injuries, and near misses',
    icon: AlertTriangle, 
    color: 'bg-danger',
    stats: { label: 'Open', value: 7 },
    route: null,
    section: 'incidents' as MainSectionType
  },
  { 
    id: 'compliance', 
    title: 'Compliance & OSHA', 
    description: 'OSHA logs, ISO forms, audit trails, and regulatory compliance',
    icon: ClipboardCheck, 
    color: 'bg-accent',
    stats: { label: 'Score', value: '97%' },
    route: null,
    section: 'compliance' as MainSectionType
  },
  { 
    id: 'analytics', 
    title: 'Analytics & AI', 
    description: 'AI-powered insights, risk analysis, and predictive safety metrics',
    icon: Brain, 
    color: 'bg-primary',
    stats: { label: 'Insights', value: 24 },
    route: null,
    section: 'analytics' as MainSectionType
  },
  { 
    id: 'environmental', 
    title: 'Environmental', 
    description: 'ESG reporting, emissions tracking, and environmental compliance',
    icon: Leaf, 
    color: 'bg-success',
    stats: { label: 'Status', value: 'Good' },
    route: '/esg-reporting',
    section: null
  },
  { 
    id: 'training', 
    title: 'Training', 
    description: 'Safety training management, certifications, and compliance tracking',
    icon: Users, 
    color: 'bg-warning',
    stats: { label: 'Due', value: 8 },
    route: '/training',
    section: null
  },
  { 
    id: 'tools', 
    title: 'Tools & Settings', 
    description: 'Collaboration, voice commands, offline sync, and system settings',
    icon: Settings, 
    color: 'bg-text-muted',
    stats: { label: 'Active', value: 5 },
    route: null,
    section: 'tools' as MainSectionType
  },
];

// Navigation items for sub-sections
const incidentSubItems = [
  { id: 'all', label: 'All Incidents', icon: LayoutGrid, component: 'combined' },
  { id: 'photo-evidence', label: 'Photo Evidence', icon: Eye, component: 'photo-evidence' },
  { id: 'enhanced-injury', label: 'Enhanced Injury', icon: Heart, component: 'enhanced-injury' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, component: 'analytics' },
  { id: 'injury-trends', label: 'Injury Trends', icon: Activity, component: 'injury-trends' },
  { id: 'investigation', label: 'Investigation', icon: FileSearch, component: 'investigation' },
  { id: 'property', label: 'Property Damage', icon: Building2, component: 'property' },
  { id: 'jsa', label: 'JSA', icon: ClipboardCheck, component: 'jsa' },
  { id: 'workflow', label: 'EHS Workflow', icon: Activity, component: 'workflow' },
  { id: 'reports', label: 'Reports', icon: FileText, component: 'reports' },
  { id: 'goals', label: 'Goals & Targets', icon: Target, component: 'goals' },
  { id: 'leaderboard', label: 'Leaderboard', icon: Target, component: 'leaderboard' },
];

const complianceSubItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, component: 'dashboard' },
  { id: 'audit-photos', label: 'Audit Photos', icon: Eye, component: 'audit-photos' },
  { id: 'osha-iso', label: 'OSHA/ISO Forms', icon: FileText, component: 'osha-iso' },
  { id: 'osha-logs', label: 'OSHA Logs', icon: ClipboardCheck, component: 'osha-logs' },
  { id: 'audit-trail', label: 'Audit Trail', icon: History, component: 'audit-trail' },
  { id: 'e-signatures', label: 'E-Signatures', icon: Fingerprint, component: 'e-signatures' },
  { id: 'qr-codes', label: 'QR Code Audits', icon: Activity, component: 'qr-codes' },
  { id: 'api-integration', label: 'Open API', icon: ExternalLink, component: 'api-integration' },
  { id: 'international', label: 'Int\'l Standards', icon: Globe, component: 'international' },
];

const analyticsSubItems = [
  { id: 'dashboard', label: 'AI Dashboard', icon: Brain, component: 'ai-dashboard' },
  { id: 'ai-analytics', label: 'AI Analytics', icon: Sparkles, component: 'ai-analytics' },
  { id: 'analytics', label: 'Incident Analytics', icon: BarChart3, component: 'analytics' },
  { id: 'risk', label: 'AI Risk Analysis', icon: AlertTriangle, component: 'risk' },
  { id: 'quality', label: 'Quality Management', icon: CheckCircle2, component: 'quality' },
  { id: 'malware-security', label: 'AI Security', icon: Lock, component: 'malware-security' },
];

const toolsSubItems = [
  { id: 'collaboration', label: 'Collaboration', icon: Users, component: 'collaboration' },
  { id: 'photo-upload', label: 'Photo Hub', icon: Eye, component: 'photo-upload' },
  { id: 'voice', label: 'Voice Commands', icon: Radio, component: 'voice' },
  { id: 'widgets', label: 'Dashboard Widgets', icon: LayoutGrid, component: 'widgets' },
  { id: 'offline', label: 'Offline Sync', icon: Activity, component: 'offline' },
  { id: 'notifications', label: 'Notifications', icon: Bell, component: 'notifications' },
  { id: 'capa-reminders', label: 'CAPA Reminders', icon: Clock, component: 'capa-reminders' },
  { id: 'mobile-data', label: 'Mobile Data Collection', icon: Activity, component: 'mobile-data' },
  { id: 'alerts', label: 'Real-Time Alerts', icon: Bell, component: 'alerts' },
  { id: 'threat-alerts', label: 'Threat Alert Center', icon: Shield, component: 'threat-alerts' },
  { id: 'incident-response', label: 'Incident Response', icon: Fingerprint, component: 'incident-response' },
  { id: 'security', label: 'Malware Security', icon: Lock, component: 'security' },
];

export const SafetyManagementHub = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mainSection = (searchParams.get('section') as MainSectionType) ?? 'dashboard';
  const activeSubItem = searchParams.get('tab') ?? 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showMetricCustomizer, setShowMetricCustomizer] = useState(false);
  const [metrics, setMetrics] = useState<MetricConfig[]>(defaultMetrics);
  const [reorderMode, setReorderMode] = useState(false);

  // ── Live backend data hooks ──────────────────────────────────────────────
  const { data: liveStatsData } = useDashboardLiveStats();
  const { data: overviewData } = useDashboardOverview();
  const { data: incidentStatsData } = useIncidentStats();
  const { data: openCapas } = useCapaRecords({ status: 'open' });
  const { data: scheduledInspections } = useInspectionSchedule({ status: 'scheduled' });

  // Derive live stats with static fallbacks so the UI always has values
  const liveQuickStats = useMemo(() => {
    const safetyScore =
      liveStatsData?.platformStats.safetyScore ?? quickStats.safetyScore;
    const complianceRate =
      Math.round(Number(liveStatsData?.platformStats.complianceRate?.value)) ||
      quickStats.complianceRate;
    const openIncidents =
      incidentStatsData?.byStatus.find((s) => s.status === 'open')?.count ??
      quickStats.openIncidents;
    const pendingActions = openCapas?.length ?? quickStats.pendingActions;
    const upcomingInspections =
      scheduledInspections?.length ?? quickStats.upcomingInspections;
    const safetyTrendStr = liveStatsData?.platformStats.safetyScoreChange ?? '';
    const safetyTrend =
      parseFloat(safetyTrendStr.replace('%', '')) || quickStats.safetyTrend;
    return {
      ...quickStats,
      safetyScore,
      complianceRate,
      openIncidents,
      pendingActions,
      upcomingInspections,
      safetyTrend,
    };
  }, [liveStatsData, incidentStatsData, openCapas, scheduledInspections]);

  // Map backend incident records → display shape, fall back to static list
  const liveRecentIncidents = useMemo(() => {
    const backendIncidents = overviewData?.incidents;
    if (!backendIncidents?.length) return recentIncidents;
    return backendIncidents.slice(0, 4).map((inc) => ({
      id: `INC-${inc.id}`,
      type: inc.incidentType?.toLowerCase().includes('vehicle')
        ? 'vehicle'
        : inc.incidentType?.toLowerCase().includes('injury')
        ? 'injury'
        : inc.incidentType?.toLowerCase().includes('environ')
        ? 'environmental'
        : 'incident',
      title: inc.description,
      severity: inc.severity.toLowerCase(),
      status: inc.status,
      date: inc.incidentDate,
      location: inc.location,
      assignee: inc.assignedTo ?? 'Unassigned',
    }));
  }, [overviewData]);

  // Toggle metric visibility
  const toggleMetricVisibility = (metricId: string) => {
    setMetrics(prev => prev.map(m => 
      m.id === metricId ? { ...m, visible: !m.visible } : m
    ));
  };

  // Get visible metrics sorted by order
  const visibleMetrics = metrics.filter(m => m.visible).sort((a, b) => a.order - b.order);

  // Handle metric reorder
  const handleMetricReorder = (newOrder: MetricConfig[]) => {
    const updatedMetrics = metrics.map(m => {
      const newIndex = newOrder.findIndex(nm => nm.id === m.id);
      if (newIndex !== -1) {
        return { ...m, order: newIndex };
      }
      return m;
    });
    setMetrics(updatedMetrics);
  };

  // Get current sub-items based on section
  const getCurrentSubItems = () => {
    switch (mainSection) {
      case 'incidents': return incidentSubItems;
      case 'compliance': return complianceSubItems;
      case 'analytics': return analyticsSubItems;
      case 'tools': return toolsSubItems;
      default: return [];
    }
  };

  // Reset sub-item when section changes (only when no tab is specified in URL)
  useEffect(() => {
    if (searchParams.has('tab')) return;
    const items = getCurrentSubItems();
    if (items.length > 0) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('tab', items[0].id);
        return next;
      }, { replace: true });
    }
  }, [mainSection]);

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-danger/10 text-danger border-danger/20';
      case 'high': return 'bg-danger/10 text-danger border-danger/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-surface-overlay text-text-muted border-surface-border';
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-accent/10 text-accent';
      case 'investigating': return 'bg-primary/10 text-primary';
      case 'resolved': return 'bg-success/10 text-success';
      case 'capa-pending': return 'bg-warning/10 text-warning';
      default: return 'bg-surface-overlay text-text-muted';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incident': return AlertTriangle;
      case 'injury': return Heart;
      case 'vehicle': return Car;
      case 'environmental': return Leaf;
      case 'property': return Building2;
      default: return FileText;
    }
  };

  // Render dashboard content
  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="SafetyMEG Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="page-title">Safety Hub</h1>
            <p className="text-text-muted mt-1">Intelligent Safety Management & Compliance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-surface-raised border border-surface-border rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">AI Safety Score</span>
            </div>
            <div className="w-24 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${liveQuickStats.safetyScore}%` }}
                className="h-full bg-accent"
              />
            </div>
            <span className="text-[10px] font-bold text-accent">{liveQuickStats.safetyScore}%</span>
          </div>
        </div>
      </div>

      {/* AI Insights Banner */}
      <div className="bg-surface-raised border border-surface-border rounded-[2.5rem] p-8 relative overflow-hidden shadow-card">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Shield className="w-48 h-48 text-accent" />
        </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-accent border border-accent rounded-full text-[10px] font-black text-white uppercase tracking-widest">AI Predictive Insight</span>
              <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Updated 5m ago</span>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Facility-wide risk levels have decreased by 12% following the implementation of AI-guided PPE audits.</h2>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>342 Audits Completed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span>3 High-Risk Areas Identified</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end gap-4">
            <button 
              onClick={() => navigate('/visual-audit/template')}
              className="px-8 py-4 bg-accent text-text-onAccent rounded-2xl font-bold transition-all shadow-sm active:scale-95"
            >
              AI Standard Audit
            </button>
            <button 
              onClick={() => navigate('/safety-audit?mode=ai_insights')}
              className="px-8 py-4 bg-surface-sunken text-text-primary border border-surface-border rounded-2xl font-bold transition-all shadow-sm active:scale-95"
            >
              View AI Audit Report
            </button>
          </div>
        </div>
      </div>

      {/* EHS Benchmarks Section */}
      {/* EHS Benchmarks with Trend Charts */}
      <div className="bg-surface-raised rounded-2xl lg:rounded-3xl p-5 lg:p-6 border border-surface-border shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-text-primary">EHS Benchmarks</h2>
          </div>
          <span className="text-xs font-medium text-accent bg-accent/10 px-3 py-1 rounded-full">vs Industry</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-sunken rounded-xl p-4 border border-surface-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-muted">TRIR</span>
              <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded">72nd %ile</span>
            </div>
            <div className="text-2xl font-bold text-text-primary">2.8</div>
            {/* Mini Trend Chart */}
            <div className="flex items-end gap-1 mt-2 h-8">
              {[3.6, 3.4, 3.2, 3.0, 2.9, 2.8].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full bg-success rounded-t" style={{ height: `${(val / 4) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-text-muted">
              <span className="flex items-center gap-0.5"><TrendingDown className="w-3 h-3 text-success" />-22%</span>
              <span>6mo</span>
            </div>
          </div>
          <div className="bg-surface-sunken rounded-xl p-4 border border-surface-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-muted">Compliance</span>
              <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded">85th %ile</span>
            </div>
            <div className="text-2xl font-bold text-text-primary">97%</div>
            {/* Mini Trend Chart */}
            <div className="flex items-end gap-1 mt-2 h-8">
              {[88, 90, 93, 94, 96, 97].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full bg-success rounded-t" style={{ height: `${val}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-text-muted">
              <span className="flex items-center gap-0.5"><TrendingUp className="w-3 h-3 text-success" />+10%</span>
              <span>6mo</span>
            </div>
          </div>
          <div className="bg-surface-sunken rounded-xl p-4 border border-surface-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-muted">Emissions</span>
              <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded">76th %ile</span>
            </div>
            <div className="text-2xl font-bold text-text-primary">42</div>
            <div className="text-[10px] text-text-muted mt-0.5">tCO2e/M$</div>
            {/* Mini Trend Chart */}
            <div className="flex items-end gap-1 mt-1 h-6">
              {[52, 50, 48, 46, 44, 42].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full bg-success rounded-t" style={{ height: `${(val / 60) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-text-muted">
              <span className="flex items-center gap-0.5"><TrendingDown className="w-3 h-3 text-success" />-19%</span>
              <span>6mo</span>
            </div>
          </div>
          <div className="bg-surface-sunken rounded-xl p-4 border border-surface-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-muted">Security</span>
              <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded">99th %ile</span>
            </div>
            <div className="text-2xl font-bold text-text-primary">Active</div>
            <div className="text-[10px] text-text-muted mt-0.5">End-to-End Encrypted</div>
            {/* Mini Trend Chart */}
            <div className="flex items-end gap-1 mt-1 h-6">
              {[100, 100, 100, 100, 100, 100].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full bg-accent rounded-t" style={{ height: `${val}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-text-muted">
              <span className="flex items-center gap-0.5"><Shield className="w-3 h-3 text-accent" />Secure</span>
              <span>Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Standards Compliance Widget */}
      <div className="bg-surface-raised border border-surface-border rounded-[2.5rem] p-8 backdrop-blur-md shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-text-primary">International Standards Compliance</h3>
                <span className="px-2 py-0.5 rounded-full bg-primary border border-primary text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Integrated
                </span>
              </div>
              <p className="text-sm text-text-muted">All 21 global safety standards tracked in real-time</p>
            </div>
          </div>
          <button onClick={() => navigate('/international-standards')} className="px-4 py-2 bg-accent text-text-onAccent rounded-xl text-sm font-bold transition-colors">
            View All
          </button>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
          {[
            { name: 'OSHA', rate: 96, color: 'from-red-500 to-red-600' },
            { name: 'ISO 45001', rate: 94, color: 'from-blue-500 to-blue-600' },
            { name: 'EPA', rate: 91, color: 'from-green-500 to-green-600' },
            { name: 'NFPA', rate: 98, color: 'from-orange-500 to-orange-600' },
            { name: 'ANSI', rate: 95, color: 'from-purple-500 to-purple-600' },
            { name: 'EU-OSHA', rate: 89, color: 'from-indigo-500 to-indigo-600' },
            { name: 'CSA', rate: 92, color: 'from-red-600 to-red-700' },
            { name: 'NEBOSH', rate: 87, color: 'from-fuchsia-500 to-fuchsia-600' },
            { name: 'WHO', rate: 93, color: 'from-teal-500 to-teal-600' },
            { name: 'MSHA', rate: 97, color: 'from-gray-500 to-gray-600' },
            { name: 'DOT', rate: 94, color: 'from-rose-500 to-rose-600' },
            { name: 'IMO', rate: 88, color: 'from-sky-500 to-sky-600' },
            { name: 'IATA', rate: 90, color: 'from-blue-600 to-blue-700' },
            { name: 'HACCP', rate: 95, color: 'from-lime-500 to-lime-600' },
            { name: 'Cal/OSHA', rate: 93, color: 'from-yellow-500 to-yellow-600' },
            { name: 'BSEE', rate: 91, color: 'from-cyan-500 to-cyan-600' },
            { name: 'ASME', rate: 96, color: 'from-amber-500 to-amber-600' },
            { name: 'API', rate: 94, color: 'from-pink-500 to-pink-600' },
            { name: 'AS/NZS', rate: 89, color: 'from-emerald-500 to-emerald-600' },
            { name: 'GCC', rate: 86, color: 'from-yellow-600 to-yellow-700' },
            { name: 'NIOSH', rate: 92, color: 'from-violet-500 to-violet-600' },
          ].map(std => (
            <div key={std.name} className={`bg-gradient-to-br ${std.color} border border-white/15 rounded-xl p-3 text-center transition-transform cursor-pointer group shadow-sm hover:-translate-y-0.5`}>
              <div className="w-10 h-10 mx-auto rounded-lg bg-white/10 border border-white/20 flex items-center justify-center mb-2 backdrop-blur-sm group-hover:scale-110 transition-transform">
                <span className="text-[8px] font-black text-white leading-none">{std.name.split(' ')[0].slice(0, 4)}</span>
              </div>
              <p className="text-[10px] font-bold text-white truncate">{std.name}</p>
              <p className="text-xs font-black mt-0.5 text-white">{std.rate}%</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
          <span>Average Compliance: <span className="font-bold text-success">92.5%</span></span>
          <span>21 Standards · 12 Regions · Last Updated: Today</span>
        </div>
      </div>

      {/* Security & Integration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface-raised border border-surface-border rounded-[2.5rem] p-8 backdrop-blur-md shadow-card">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-text-primary">Security Protection</h3>
              <p className="text-sm text-text-muted">Enterprise-grade data security & privacy</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'End-to-End Encryption', status: 'Active', icon: Lock },
              { label: 'Multi-Factor Authentication', status: 'Enabled', icon: Fingerprint },
              { label: 'Secure Audit Trail', status: 'Synced', icon: History },
              { label: 'Access Control Monitoring', status: 'Live', icon: Eye },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-surface-sunken rounded-2xl border border-surface-border">
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-text-muted" />
                  <span className="text-sm font-bold text-text-primary">{item.label}</span>
                </div>
                <span className="text-[10px] font-black text-success uppercase tracking-widest bg-success/10 px-3 py-1 rounded-full border border-success/20">{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-raised border border-surface-border rounded-[2.5rem] p-8 backdrop-blur-md shadow-card">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-text-primary">Integration Ready</h3>
              <p className="text-sm text-text-muted">Connect with your existing EHS ecosystem</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'REST API', icon: Terminal },
              { label: 'Webhooks', icon: Radio },
              { label: 'IoT Hub', icon: Activity },
              { label: 'Cloud Sync', icon: CloudRain },
            ].map((item, i) => (
              <div key={i} className="p-6 bg-surface-sunken rounded-3xl border border-surface-border flex flex-col items-center justify-center text-center group hover:border-accent/40 hover:bg-surface-overlay transition-all cursor-pointer">
                <item.icon className="w-8 h-8 text-text-muted mb-3 group-hover:text-accent transition-colors" />
                <span className="text-xs font-bold text-text-primary">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Safety Score */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success rounded-2xl lg:rounded-3xl p-5 lg:p-6 text-text-onAccent relative overflow-hidden shadow-card"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Safety Score</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl lg:text-5xl font-bold">{liveQuickStats.safetyScore}</span>
              <span className="text-lg mb-1 opacity-80">%</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {liveQuickStats.safetyTrend > 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">+{liveQuickStats.safetyTrend}% this month</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4" />
                  <span className="text-sm font-medium">{liveQuickStats.safetyTrend}% this month</span>
                </>
              )}
            </div>
          </div>
          <Shield className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
        </motion.div>

        {/* Open Incidents */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-raised rounded-2xl lg:rounded-3xl p-5 lg:p-6 border border-surface-border shadow-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-danger/10 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
          </div>
          <span className="text-4xl lg:text-5xl font-bold text-text-primary">{liveQuickStats.openIncidents}</span>
          <p className="text-sm text-text-muted mt-1">Open Incidents</p>
          <div className="flex items-center gap-1 mt-2 text-success">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-medium">{Math.abs(liveQuickStats.incidentTrend)} less than last week</span>
          </div>
        </motion.div>

        {/* Days Without LTI */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-raised rounded-2xl lg:rounded-3xl p-5 lg:p-6 border border-surface-border shadow-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
          </div>
          <span className="text-4xl lg:text-5xl font-bold text-text-primary">{liveQuickStats.daysWithoutLTI}</span>
          <p className="text-sm text-text-muted mt-1">Days Without LTI</p>
          <div className="w-full bg-surface-sunken rounded-full h-2 mt-3">
            <div 
              className="bg-success h-2 rounded-full transition-all" 
              style={{ width: `${(liveQuickStats.daysWithoutLTI / liveQuickStats.daysTarget) * 100}%` }}
            />
          </div>
          <p className="text-xs text-text-muted mt-1">Goal: {liveQuickStats.daysTarget} days</p>
        </motion.div>

        {/* Compliance Rate */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface-raised rounded-2xl lg:rounded-3xl p-5 lg:p-6 border border-surface-border shadow-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-accent" />
            </div>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-4xl lg:text-5xl font-bold text-text-primary">{liveQuickStats.complianceRate}</span>
            <span className="text-xl text-text-muted mb-1">%</span>
          </div>
          <p className="text-sm text-text-muted mt-1">Compliance Rate</p>
          <div className="flex items-center gap-1 mt-2 text-success">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">+{liveQuickStats.complianceTrend}% this month</span>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(action.route)}
              className="group flex flex-col items-center gap-3 p-4 lg:p-6 bg-surface-raised rounded-2xl border border-surface-border hover:border-accent/30 hover:bg-surface-overlay transition-all shadow-card"
            >
              <div className={`w-12 h-12 lg:w-14 lg:h-14 ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <action.icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <span className="text-xs lg:text-sm font-semibold text-text-primary text-center">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Modules & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Modules - 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-text-primary">Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moduleCards.map((module, i) => {
              // Override stats for incident & compliance cards with live values
              const liveStats = module.id === 'incidents'
                ? { label: 'Open', value: liveQuickStats.openIncidents }
                : module.id === 'compliance'
                ? { label: 'Score', value: `${liveQuickStats.complianceRate}%` }
                : module.stats;
              return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => module.route ? navigate(module.route) : setSearchParams({ section: module.section! })}
                className="group cursor-pointer bg-surface-raised rounded-2xl lg:rounded-3xl p-5 lg:p-6 border border-surface-border hover:border-accent/30 hover:bg-surface-overlay transition-all shadow-card"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl ${module.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <module.icon className="w-6 h-6 lg:w-7 lg:h-7 text-text-onAccent" />
                  </div>
                  <div className="text-right">
                    <span className="page-title">{liveStats.value}</span>
                    <p className="text-xs text-text-muted">{liveStats.label}</p>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-1 group-hover:text-accent transition-colors">{module.title}</h3>
                <p className="text-sm text-text-muted line-clamp-2">{module.description}</p>
                <div className="mt-4 flex items-center text-sm font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  Open module <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary">Recent Activity</h2>
            <button 
              onClick={() => setSearchParams({ section: 'incidents' })}
              className="text-sm font-medium text-accent hover:opacity-80"
            >
              View all
            </button>
          </div>
          <div className="bg-surface-raised rounded-2xl lg:rounded-3xl border border-surface-border divide-y divide-surface-border overflow-hidden shadow-card">
            {liveRecentIncidents.map((incident, i) => {
              const TypeIcon = getTypeIcon(incident.type);
              return (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 hover:bg-surface-overlay cursor-pointer transition-colors"
                  onClick={() => navigate('/full-report')}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      incident.type === 'incident' ? 'bg-red-500/20 text-red-400' :
                      incident.type === 'injury' ? 'bg-pink-500/20 text-pink-400' :
                      incident.type === 'vehicle' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{incident.title}</p>
                      <p className="text-xs text-text-muted">{incident.id} • {incident.location}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Additional Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-warning/10 rounded-2xl p-4 border border-warning/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-warning" />
                <span className="text-sm font-medium text-warning">Pending</span>
              </div>
              <span className="text-2xl font-bold text-warning">{liveQuickStats.pendingActions}</span>
              <p className="text-xs text-warning/80">Actions due</p>
            </div>
            <div className="bg-accent/10 rounded-2xl p-4 border border-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-accent">Upcoming</span>
              </div>
              <span className="text-2xl font-bold text-accent">{liveQuickStats.upcomingInspections}</span>
              <p className="text-xs text-accent/80">Inspections</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render sub-section content
  const renderSubSectionContent = () => {
    if (mainSection === 'incidents') {
      switch (activeSubItem) {
        case 'all': return <CombinedIncidentInjuryReport onNavigate={navigate} />;
        case 'photo-evidence': return <PhotoUpload title="Incident Photo Evidence" description="Upload photos and videos of incidents, near misses, and property damage for AI-powered hazard analysis." showAIAnalysis={true} darkMode={true} />;
        case 'enhanced-injury': return <EnhancedInjuryReport />;
        case 'analytics': return <IncidentAnalytics />;
        case 'injury-trends': return <InjuryTrendAnalytics />;
        case 'investigation': return <UnifiedInvestigation />;
        case 'property': return <PropertyDamageReport onNavigate={navigate} />;
        case 'jsa': return <UniversalJSA onNavigate={navigate} />;
        case 'workflow': return <EHSWorkflowDashboard />;
        case 'reports': return <SafetyReportTemplates />;
        case 'goals': return <SafetyGoalsTargets />;
        case 'leaderboard': return <TeamLeaderboard />;
        default: return <CombinedIncidentInjuryReport onNavigate={navigate} />;
      }
    }

    if (mainSection === 'compliance') {
      switch (activeSubItem) {
        case 'dashboard': return <ComplianceDashboard onBack={() => navigate(-1)} />;
        case 'audit-photos': return <PhotoUpload title="Compliance Audit Photos" description="Upload audit evidence photos, inspection images, and compliance documentation for AI review and archival." showAIAnalysis={true} darkMode={true} />;
        case 'osha-iso': return <OSHAISOWorkflow />;
        case 'osha-logs': return <OSHALogGenerator />;
        case 'audit-trail': return <AuditTrail />;
        case 'e-signatures': return <ESignatureCertificate onBack={() => navigate(-1)} />;
        case 'qr-codes': return <QRCodeAudit />;
        case 'api-integration': return <OpenAPIIntegration />;
        case 'international': return <InternationalStandards isEmbedded />;
        default: return <ComplianceDashboard onBack={() => navigate(-1)} />;
      }
    }

    if (mainSection === 'analytics') {
      switch (activeSubItem) {
        case 'ai-dashboard': return <IncidentAnalyticsDashboard />;
        case 'ai-analytics': return <AIAnalyticsDashboard />;
        case 'analytics': return <IncidentAnalytics />;
        case 'risk': return <AIRiskAnalysis />;
        case 'quality': return <QualityManagement />;
        case 'malware-security': return <AIMalwareSecurity />;
        default: return <IncidentAnalyticsDashboard />;
      }
    }

    if (mainSection === 'tools') {
      switch (activeSubItem) {
        case 'collaboration': return <CollaborationPanel />;
        case 'photo-upload': return <PhotoUpload title="Safety Photo Hub" description="Central hub for all safety-related photo and video uploads. AI-powered hazard detection across all files." maxFiles={50} showAIAnalysis={true} darkMode={false} />;
        case 'voice': return <VoiceCommands onNavigate={navigate} />;
        case 'widgets': return <DashboardWidgets />;
        case 'offline': return <OfflineSyncManager />;
        case 'notifications': return <RealTimeNotifications onBack={() => navigate(-1)} />;
        case 'capa-reminders': return <CAPAReminder />;
        case 'mobile-data': return <MobileDataCollection />;
        case 'alerts': return <RealTimeAlerts />;
        case 'threat-alerts': return <RealTimeThreatAlerts />;
        case 'incident-response': return <SecurityIncidentResponse />;
        case 'security': return <AIMalwareSecurity />;
        default: return <CollaborationPanel />;
      }
    }

    return null;
  };

  // Render sub-section with navigation
  const renderSubSection = () => {
    const subItems = getCurrentSubItems();
    const sectionTitles: Record<MainSectionType, string> = {
      dashboard: 'Dashboard',
      incidents: 'Incident Management',
      compliance: 'Compliance & OSHA',
      analytics: 'Analytics & AI',
      tools: 'Tools & Settings'
    };

    return (
      <div className="space-y-6">
        {/* Sub-section Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-raised border border-surface-border hover:bg-surface-overlay transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">{sectionTitles[mainSection]}</h1>
            <p className="text-sm text-text-muted">Manage all {mainSection} related tasks and data</p>
          </div>
        </div>

        {/* Sub-navigation Pills */}
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          {subItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', item.id); return next; })}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeSubItem === item.id
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'bg-surface-raised text-text-muted border border-surface-border hover:bg-surface-overlay hover:text-text-primary'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Sub-section Content */}
        <div>
          {renderSubSectionContent()}
        </div>
      </div>
    );
  };

  return (
    <div className="page-wrapper transition-colors duration-300">
      {/* Main Container */}
      <main className="max-w-[1920px] mx-auto px-4 lg:px-8 py-6 lg:py-10 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={mainSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {mainSection === 'dashboard' ? renderDashboard() : renderSubSection()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {showAIAssistant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary-950/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4"
            onClick={() => setShowAIAssistant(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-surface-raised rounded-t-3xl lg:rounded-3xl max-h-[80vh] overflow-hidden border border-surface-border shadow-modal"
            >
              <div className="p-6 border-b border-surface-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-text-onAccent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">EHS AI Assistant</h3>
                      <p className="text-sm text-text-muted">How can I help you today?</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAIAssistant(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-overlay transition-colors"
                  >
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <EHSAIAssistant />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metric Customizer Modal with Drag & Drop */}
      <AnimatePresence>
        {showMetricCustomizer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary-950/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4"
            onClick={() => {
              setShowMetricCustomizer(false);
              setReorderMode(false);
            }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-surface-raised rounded-t-3xl lg:rounded-3xl max-h-[80vh] overflow-hidden border border-surface-border shadow-modal"
            >
              <div className="p-6 border-b border-surface-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                      <Settings className="w-6 h-6 text-text-onAccent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">Customize Dashboard</h3>
                      <p className="text-sm text-text-muted">Toggle visibility and drag to reorder</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setShowMetricCustomizer(false);
                      setReorderMode(false);
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-overlay transition-colors"
                  >
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-text-muted">Drag to reorder metrics:</p>
                  <button
                    onClick={() => setReorderMode(!reorderMode)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      reorderMode 
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'bg-surface-sunken text-text-primary border border-surface-border'
                    }`}
                  >
                    {reorderMode ? 'Done Reordering' : 'Reorder Mode'}
                  </button>
                </div>
                <Reorder.Group
                  axis="y"
                  values={visibleMetrics}
                  onReorder={handleMetricReorder}
                  className="space-y-2 max-h-64 overflow-y-auto"
                >
                  {visibleMetrics.map((metric) => (
                    <Reorder.Item
                      key={metric.id}
                      value={metric}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        reorderMode 
                          ? 'bg-surface-overlay border-accent/20 cursor-grab active:cursor-grabbing'
                          : 'bg-surface-sunken border-surface-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {reorderMode && (
                          <div className="text-text-muted">
                            <MoreHorizontal className="w-5 h-5" />
                          </div>
                        )}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10">
                          <metric.icon className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{metric.label}</p>
                          <p className="text-sm text-text-muted">
                            Current: {metric.value}{metric.unit || ''}
                          </p>
                        </div>
                      </div>
                      {!reorderMode && (
                        <button
                          onClick={() => toggleMetricVisibility(metric.id)}
                          className="w-6 h-6 rounded-full bg-accent flex items-center justify-center"
                        >
                          <CheckCircle2 className="w-4 h-4 text-text-onAccent" />
                        </button>
                      )}
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
              <div className="p-4 border-t border-surface-border">
                <p className="text-sm text-text-muted mb-3">Available metrics:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {metrics.filter(m => !m.visible).map((metric) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-surface-border bg-surface-sunken hover:bg-surface-overlay cursor-pointer transition-all"
                      onClick={() => toggleMetricVisibility(metric.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-overlay">
                          <metric.icon className="w-4 h-4 text-text-muted" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary text-sm">{metric.label}</p>
                          <p className="text-xs text-text-muted">Tap to add</p>
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-text-muted" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-surface-border bg-surface-overlay/60">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-muted">{visibleMetrics.length} metrics visible</p>
                  <button 
                    onClick={() => {
                      setShowMetricCustomizer(false);
                      setReorderMode(false);
                    }}
                    className="px-6 py-2.5 bg-accent text-text-onAccent rounded-xl font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
