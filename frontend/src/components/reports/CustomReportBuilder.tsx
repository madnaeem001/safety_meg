import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  FileText,
  Download,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  BarChart3,
  Table,
  PieChart,
  LineChart,
  Type,
  CheckSquare,
  Calendar,
  X,
  ChevronDown,
  Settings,
  Copy,
  Sparkles,
  AlertTriangle,
  Shield,
  Users,
  Activity,
  Target,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Radar,
  Gauge,
  AreaChart,
  Filter,
  Layers,
  Circle,
  Trophy,
  Flag,
  Clock,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  ArrowRight,
  Bell,
  BellOff,
  Mail,
  MessageSquare,
  Zap,
  Leaf,
  GraduationCap,
  ClipboardCheck,
  Building2,
  Heart,
  Edit3,
  XCircle,
  AlertOctagon,
  Briefcase,
  Send,
  Reply,
  ThumbsUp,
  MoreVertical,
  AlarmClock,
  CalendarDays,
  Repeat,
  LayoutDashboard,
  TrendingDown,
  Award,
  Percent
} from 'lucide-react';

// Section types for report builder
type SectionType = 'kpi' | 'chart' | 'table' | 'text' | 'checklist' | 'summary' | 'goals';

interface ReportSection {
  id: string;
  type: SectionType;
  title: string;
  config: Record<string, any>;
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  createdAt: string;
  updatedAt: string;
}

// Safety Goal interface
interface SafetyGoal {
  id: string;
  title: string;
  description: string;
  category: 'incident' | 'compliance' | 'training' | 'audit' | 'environmental' | 'culture';
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: 'not-started' | 'in-progress' | 'on-track' | 'at-risk' | 'completed' | 'overdue';
  milestones: Milestone[];
  owner: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTeam?: TeamMember[];
  progressHistory?: ProgressEntry[];
}

interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
  completedDate?: string;
  notes?: string;
}

// Progress tracking entry
interface ProgressEntry {
  id: string;
  date: string;
  previousValue: number;
  newValue: number;
  updatedBy: string;
  notes: string;
}

// Comment interface for goal discussions
interface GoalComment {
  id: string;
  goalId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  timestamp: string;
  likes: number;
  likedBy: string[];
  replies: GoalComment[];
  isEdited: boolean;
}

// Reminder interface for goal alerts
interface GoalReminder {
  id: string;
  goalId: string;
  title: string;
  type: 'milestone' | 'deadline' | 'progress' | 'custom';
  date: string;
  time: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  notifyVia: ('email' | 'push' | 'sms')[];
  isActive: boolean;
  createdBy: string;
}

// Team member for assignment
interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
}

// Available section templates
const sectionTemplates: { type: SectionType; label: string; icon: React.ElementType; description: string }[] = [
  { type: 'kpi', label: 'KPI Cards', icon: Target, description: 'Display key performance indicators' },
  { type: 'chart', label: 'Chart', icon: BarChart3, description: 'Visualize data with charts' },
  { type: 'table', label: 'Data Table', icon: Table, description: 'Show data in tabular format' },
  { type: 'text', label: 'Text Block', icon: Type, description: 'Add narrative or notes' },
  { type: 'checklist', label: 'Checklist', icon: CheckSquare, description: 'Track action items' },
  { type: 'summary', label: 'Summary', icon: FileText, description: 'Executive summary section' },
  { type: 'goals', label: 'Goals & Targets', icon: Trophy, description: 'Track safety goals and milestones' },
];

// Available KPI options
const kpiOptions = [
  { id: 'trir', label: 'TRIR', value: 2.8, icon: Activity },
  { id: 'dart', label: 'DART Rate', value: 1.2, icon: Target },
  { id: 'lti', label: 'Days Since LTI', value: 45, icon: Shield },
  { id: 'incidents', label: 'Open Incidents', value: 7, icon: AlertTriangle },
  { id: 'compliance', label: 'Compliance Rate', value: 97, icon: CheckSquare },
  { id: 'training', label: 'Training Completion', value: 94, icon: Users },
  { id: 'nearMiss', label: 'Near Misses', value: 28, icon: TrendingUp },
  { id: 'observations', label: 'Safety Observations', value: 156, icon: Eye },
];

// Enhanced chart type options
const chartTypes = [
  { id: 'bar', label: 'Bar Chart', icon: BarChart3, description: 'Compare values across categories' },
  { id: 'line', label: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
  { id: 'pie', label: 'Pie Chart', icon: PieChart, description: 'Show proportions of a whole' },
  { id: 'area', label: 'Area Chart', icon: AreaChart, description: 'Highlight volume over time' },
  { id: 'radar', label: 'Radar Chart', icon: Radar, description: 'Compare multiple metrics' },
  { id: 'gauge', label: 'Gauge Chart', icon: Gauge, description: 'Display progress to target' },
  { id: 'funnel', label: 'Funnel Chart', icon: Filter, description: 'Show process stages' },
  { id: 'stacked', label: 'Stacked Bar', icon: Layers, description: 'Show composition of totals' },
  { id: 'donut', label: 'Donut Chart', icon: Circle, description: 'Pie chart with center space' },
];

// Sample safety goals for demo
const sampleSafetyGoals: SafetyGoal[] = [
  {
    id: 'goal-1',
    title: 'Reduce TRIR to Below 2.5',
    description: 'Achieve Total Recordable Incident Rate below industry benchmark',
    category: 'incident',
    targetValue: 2.5,
    currentValue: 2.8,
    unit: 'incidents per 200k hours',
    startDate: '2026-01-01',
    targetDate: '2026-06-30',
    status: 'in-progress',
    owner: 'Safety Director',
    priority: 'high',
    milestones: [
      { id: 'm1', title: 'Complete hazard assessment', targetDate: '2026-02-15', completed: true, completedDate: '2026-02-10' },
      { id: 'm2', title: 'Implement new safety protocols', targetDate: '2026-03-31', completed: false },
      { id: 'm3', title: 'Mid-year review', targetDate: '2026-04-15', completed: false },
      { id: 'm4', title: 'Final target achievement', targetDate: '2026-06-30', completed: false },
    ]
  },
  {
    id: 'goal-2',
    title: '100% Training Compliance',
    description: 'Ensure all employees complete mandatory safety training',
    category: 'training',
    targetValue: 100,
    currentValue: 94,
    unit: '%',
    startDate: '2026-01-01',
    targetDate: '2026-03-31',
    status: 'on-track',
    owner: 'Training Manager',
    priority: 'critical',
    milestones: [
      { id: 'm1', title: 'Identify training gaps', targetDate: '2026-01-31', completed: true, completedDate: '2026-01-25' },
      { id: 'm2', title: 'Schedule makeup sessions', targetDate: '2026-02-15', completed: true, completedDate: '2026-02-12' },
      { id: 'm3', title: 'Complete all training', targetDate: '2026-03-31', completed: false },
    ]
  },
  {
    id: 'goal-3',
    title: 'Zero Lost Time Incidents',
    description: 'Achieve 90 consecutive days without lost time incidents',
    category: 'incident',
    targetValue: 90,
    currentValue: 45,
    unit: 'days',
    startDate: '2026-01-01',
    targetDate: '2026-04-01',
    status: 'in-progress',
    owner: 'Operations Manager',
    priority: 'high',
    milestones: [
      { id: 'm1', title: '30 days without LTI', targetDate: '2026-01-31', completed: true, completedDate: '2026-01-31' },
      { id: 'm2', title: '60 days without LTI', targetDate: '2026-03-01', completed: false },
      { id: 'm3', title: '90 days without LTI', targetDate: '2026-04-01', completed: false },
    ]
  },
  {
    id: 'goal-4',
    title: 'Improve Compliance Score to 98%',
    description: 'Achieve regulatory compliance score of 98% or higher',
    category: 'compliance',
    targetValue: 98,
    currentValue: 97,
    unit: '%',
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    status: 'on-track',
    owner: 'Compliance Officer',
    priority: 'medium',
    milestones: [
      { id: 'm1', title: 'Q1 audit completion', targetDate: '2026-03-31', completed: false },
      { id: 'm2', title: 'Address audit findings', targetDate: '2026-05-31', completed: false },
      { id: 'm3', title: 'Q2 re-assessment', targetDate: '2026-06-30', completed: false },
      { id: 'm4', title: 'Final compliance verification', targetDate: '2026-12-31', completed: false },
    ]
  },
];

// Goal Templates
interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: SafetyGoal['category'];
  icon: React.ElementType;
  defaultTarget: number;
  unit: string;
  suggestedMilestones: string[];
  color: string;
}

const goalTemplates: GoalTemplate[] = [
  {
    id: 'tpl-trir',
    name: 'Reduce TRIR',
    description: 'Track and reduce Total Recordable Incident Rate',
    category: 'incident',
    icon: AlertTriangle,
    defaultTarget: 2.5,
    unit: 'per 200k hours',
    suggestedMilestones: ['Baseline assessment', 'Implement controls', 'Mid-point review', 'Target achievement'],
    color: 'from-red-500 to-orange-500'
  },
  {
    id: 'tpl-training',
    name: 'Training Compliance',
    description: 'Achieve 100% mandatory training completion',
    category: 'training',
    icon: GraduationCap,
    defaultTarget: 100,
    unit: '%',
    suggestedMilestones: ['Training needs analysis', 'Schedule sessions', 'Track completions', 'Verify compliance'],
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'tpl-lti',
    name: 'Lost Time Incident Free',
    description: 'Maintain consecutive days without LTI',
    category: 'incident',
    icon: Shield,
    defaultTarget: 90,
    unit: 'days',
    suggestedMilestones: ['30 days LTI-free', '60 days LTI-free', '90 days LTI-free'],
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'tpl-compliance',
    name: 'Regulatory Compliance',
    description: 'Achieve target compliance score',
    category: 'compliance',
    icon: ClipboardCheck,
    defaultTarget: 98,
    unit: '%',
    suggestedMilestones: ['Gap analysis', 'Remediation plan', 'Implementation', 'Audit verification'],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'tpl-audit',
    name: 'Audit Findings Closure',
    description: 'Close all open audit findings',
    category: 'audit',
    icon: Briefcase,
    defaultTarget: 100,
    unit: '% closed',
    suggestedMilestones: ['Prioritize findings', 'Assign owners', 'Track progress', 'Verify closures'],
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'tpl-environmental',
    name: 'Environmental Target',
    description: 'Reduce environmental impact metrics',
    category: 'environmental',
    icon: Leaf,
    defaultTarget: 15,
    unit: '% reduction',
    suggestedMilestones: ['Baseline measurement', 'Implement changes', 'Monitor progress', 'Verify reduction'],
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'tpl-culture',
    name: 'Safety Culture Score',
    description: 'Improve safety culture assessment score',
    category: 'culture',
    icon: Heart,
    defaultTarget: 85,
    unit: '% positive',
    suggestedMilestones: ['Baseline survey', 'Action planning', 'Implementation', 'Follow-up survey'],
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'tpl-observations',
    name: 'Safety Observations',
    description: 'Increase safety observation submissions',
    category: 'culture',
    icon: Eye,
    defaultTarget: 500,
    unit: 'observations',
    suggestedMilestones: ['Launch campaign', 'Monthly targets', 'Recognition program', 'Goal achievement'],
    color: 'from-amber-500 to-yellow-500'
  },
];

// Notification Settings Interface
interface NotificationSettings {
  milestoneReminders: boolean;
  deadlineAlerts: boolean;
  progressUpdates: boolean;
  atRiskAlerts: boolean;
  completionNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderDays: number;
}

// Category filter chips data
const categoryFilters = [
  { id: 'all', label: 'All Goals', icon: Target, color: 'bg-slate-600' },
  { id: 'incident', label: 'Incident Reduction', icon: AlertTriangle, color: 'bg-red-500' },
  { id: 'compliance', label: 'Compliance', icon: ClipboardCheck, color: 'bg-blue-500' },
  { id: 'training', label: 'Training', icon: GraduationCap, color: 'bg-purple-500' },
  { id: 'audit', label: 'Audit', icon: Briefcase, color: 'bg-cyan-500' },
  { id: 'environmental', label: 'Environmental', icon: Leaf, color: 'bg-emerald-500' },
  { id: 'culture', label: 'Safety Culture', icon: Heart, color: 'bg-pink-500' },
];

// Sample team members for assignment
const sampleTeamMembers: TeamMember[] = [
  { id: 'tm-1', name: 'John Smith', role: 'Safety Director', email: 'john.smith@company.com' },
  { id: 'tm-2', name: 'Sarah Johnson', role: 'HSE Manager', email: 'sarah.johnson@company.com' },
  { id: 'tm-3', name: 'Mike Chen', role: 'Safety Coordinator', email: 'mike.chen@company.com' },
  { id: 'tm-4', name: 'Emily Davis', role: 'Training Manager', email: 'emily.davis@company.com' },
  { id: 'tm-5', name: 'Robert Wilson', role: 'Compliance Officer', email: 'robert.wilson@company.com' },
  { id: 'tm-6', name: 'Lisa Thompson', role: 'Operations Lead', email: 'lisa.thompson@company.com' },
  { id: 'tm-7', name: 'David Brown', role: 'Site Supervisor', email: 'david.brown@company.com' },
  { id: 'tm-8', name: 'Anna Martinez', role: 'Environmental Specialist', email: 'anna.martinez@company.com' },
];

// Sample comments for goals
const sampleComments: GoalComment[] = [
  {
    id: 'cmt-1',
    goalId: 'goal-1',
    authorId: 'tm-1',
    authorName: 'John Smith',
    authorRole: 'Safety Director',
    content: 'Great progress on the hazard assessment. Let\'s ensure we maintain momentum through Q1.',
    timestamp: '2026-01-24T10:30:00',
    likes: 3,
    likedBy: ['tm-2', 'tm-3', 'tm-4'],
    replies: [
      {
        id: 'cmt-1-1',
        goalId: 'goal-1',
        authorId: 'tm-2',
        authorName: 'Sarah Johnson',
        authorRole: 'HSE Manager',
        content: 'Agreed! The team has been doing excellent work on the new protocols.',
        timestamp: '2026-01-24T11:15:00',
        likes: 2,
        likedBy: ['tm-1', 'tm-3'],
        replies: [],
        isEdited: false
      }
    ],
    isEdited: false
  },
  {
    id: 'cmt-2',
    goalId: 'goal-2',
    authorId: 'tm-4',
    authorName: 'Emily Davis',
    authorRole: 'Training Manager',
    content: 'We\'ve scheduled additional makeup sessions for February. Should help close the gap on training compliance.',
    timestamp: '2026-01-23T14:45:00',
    likes: 5,
    likedBy: ['tm-1', 'tm-2', 'tm-3', 'tm-5', 'tm-6'],
    replies: [],
    isEdited: true
  }
];

// Sample reminders for goals
const sampleReminders: GoalReminder[] = [
  {
    id: 'rem-1',
    goalId: 'goal-1',
    title: 'Weekly TRIR Progress Check',
    type: 'progress',
    date: '2026-01-31',
    time: '09:00',
    repeat: 'weekly',
    notifyVia: ['email', 'push'],
    isActive: true,
    createdBy: 'John Smith'
  },
  {
    id: 'rem-2',
    goalId: 'goal-2',
    title: 'Training Deadline Alert',
    type: 'deadline',
    date: '2026-03-25',
    time: '08:00',
    repeat: 'none',
    notifyVia: ['email', 'push', 'sms'],
    isActive: true,
    createdBy: 'Emily Davis'
  }
];

// Generate unique ID
const generateId = () => `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Get status color
const getStatusColor = (status: SafetyGoal['status']) => {
  switch (status) {
    case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'on-track': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'in-progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'at-risk': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

// Get priority color
const getPriorityColor = (priority: SafetyGoal['priority']) => {
  switch (priority) {
    case 'critical': return 'bg-red-500/20 text-red-400';
    case 'high': return 'bg-orange-500/20 text-orange-400';
    case 'medium': return 'bg-amber-500/20 text-amber-400';
    case 'low': return 'bg-slate-500/20 text-slate-400';
  }
};

// Get category color
const getCategoryColor = (category: SafetyGoal['category']) => {
  switch (category) {
    case 'incident': return 'bg-red-500';
    case 'compliance': return 'bg-blue-500';
    case 'training': return 'bg-purple-500';
    case 'audit': return 'bg-cyan-500';
    case 'environmental': return 'bg-emerald-500';
    case 'culture': return 'bg-pink-500';
  }
};

// Section Editor Component
const SectionEditor: React.FC<{
  section: ReportSection;
  onUpdate: (section: ReportSection) => void;
  onDelete: () => void;
}> = ({ section, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateConfig = (key: string, value: any) => {
    onUpdate({
      ...section,
      config: { ...section.config, [key]: value }
    });
  };

  return (
    <Reorder.Item
      value={section}
      id={section.id}
      className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden"
    >
      <div className="flex items-center gap-3 p-4 cursor-move">
        <GripVertical className="w-5 h-5 text-slate-500" />
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdate({ ...section, title: e.target.value })}
            className="bg-transparent text-white font-semibold w-full focus:outline-none focus:ring-1 focus:ring-brand-500/50 rounded px-2 py-1 -ml-2"
          />
          <p className="text-xs text-slate-400 ml-0.5 mt-1 capitalize">{section.type} Section</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-700/50"
          >
            <div className="p-4 space-y-4">
              {/* KPI Section Config */}
              {section.type === 'kpi' && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">Select KPIs to display:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {kpiOptions.map((kpi) => (
                      <label
                        key={kpi.id}
                        className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                          section.config.selectedKpis?.includes(kpi.id)
                            ? 'bg-brand-500/20 border border-brand-500/50'
                            : 'bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={section.config.selectedKpis?.includes(kpi.id) || false}
                          onChange={(e) => {
                            const current = section.config.selectedKpis || [];
                            if (e.target.checked) {
                              updateConfig('selectedKpis', [...current, kpi.id]);
                            } else {
                              updateConfig('selectedKpis', current.filter((id: string) => id !== kpi.id));
                            }
                          }}
                          className="sr-only"
                        />
                        <kpi.icon className="w-4 h-4 text-brand-400" />
                        <span className="text-sm text-slate-200">{kpi.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Chart Section Config */}
              {section.type === 'chart' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-300 mb-3">Chart Type:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {chartTypes.map((chart) => (
                        <button
                          key={chart.id}
                          onClick={() => updateConfig('chartType', chart.id)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                            section.config.chartType === chart.id
                              ? 'bg-brand-500/20 border border-brand-500/50 text-brand-300'
                              : 'bg-slate-700/30 border border-slate-600/30 text-slate-400 hover:bg-slate-700/50'
                          }`}
                        >
                          <chart.icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{chart.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Data Source:</label>
                    <select
                      value={section.config.dataSource || 'incidents'}
                      onChange={(e) => updateConfig('dataSource', e.target.value)}
                      className="mt-1 w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    >
                      <option value="incidents">Incidents by Month</option>
                      <option value="departments">Incidents by Department</option>
                      <option value="types">Incidents by Type</option>
                      <option value="training">Training Completion</option>
                      <option value="compliance">Compliance Scores</option>
                      <option value="safety-score">Safety Score Trend</option>
                      <option value="near-misses">Near Misses Analysis</option>
                      <option value="risk-levels">Risk Level Distribution</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={section.config.showLegend !== false}
                        onChange={(e) => updateConfig('showLegend', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-brand-500"
                      />
                      <span className="text-sm text-slate-300">Show Legend</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={section.config.showGrid !== false}
                        onChange={(e) => updateConfig('showGrid', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-brand-500"
                      />
                      <span className="text-sm text-slate-300">Show Grid</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Table Section Config */}
              {section.type === 'table' && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">Table Data:</p>
                  <select
                    value={section.config.tableData || 'incidents'}
                    onChange={(e) => updateConfig('tableData', e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  >
                    <option value="incidents">Recent Incidents</option>
                    <option value="actions">Open Actions</option>
                    <option value="audits">Audit Findings</option>
                    <option value="training">Training Records</option>
                    <option value="inspections">Inspections</option>
                  </select>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-400">Show rows:</label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={section.config.rowLimit || 10}
                      onChange={(e) => updateConfig('rowLimit', parseInt(e.target.value))}
                      className="w-20 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-1 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>
                </div>
              )}

              {/* Text Section Config */}
              {section.type === 'text' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">Content:</label>
                  <textarea
                    value={section.config.content || ''}
                    onChange={(e) => updateConfig('content', e.target.value)}
                    placeholder="Enter your text content here..."
                    rows={4}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
                  />
                </div>
              )}

              {/* Checklist Section Config */}
              {section.type === 'checklist' && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">Checklist Items:</p>
                  <select
                    value={section.config.checklistType || 'actions'}
                    onChange={(e) => updateConfig('checklistType', e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  >
                    <option value="actions">Corrective Actions</option>
                    <option value="goals">Safety Goals</option>
                    <option value="tasks">Pending Tasks</option>
                    <option value="recommendations">Recommendations</option>
                  </select>
                </div>
              )}

              {/* Summary Section Config */}
              {section.type === 'summary' && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">Include in Summary:</p>
                  <div className="space-y-2">
                    {['highlights', 'risks', 'recommendations', 'nextSteps'].map((item) => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={section.config[item] !== false}
                          onChange={(e) => updateConfig(item, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-brand-500 focus:ring-brand-500/50"
                        />
                        <span className="text-sm text-slate-300 capitalize">{item.replace(/([A-Z])/g, ' $1')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals Section Config */}
              {section.type === 'goals' && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">Goals Display Options:</p>
                  <div className="space-y-2">
                    {['showMilestones', 'showProgress', 'showOwners', 'showDates'].map((item) => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={section.config[item] !== false}
                          onChange={(e) => updateConfig(item, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-brand-500 focus:ring-brand-500/50"
                        />
                        <span className="text-sm text-slate-300 capitalize">{item.replace(/([A-Z])/g, ' $1').replace('show ', '')}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Filter by Category:</label>
                    <select
                      value={section.config.goalCategory || 'all'}
                      onChange={(e) => updateConfig('goalCategory', e.target.value)}
                      className="mt-1 w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    >
                      <option value="all">All Categories</option>
                      <option value="incident">Incident Reduction</option>
                      <option value="compliance">Compliance</option>
                      <option value="training">Training</option>
                      <option value="audit">Audit</option>
                      <option value="environmental">Environmental</option>
                      <option value="culture">Safety Culture</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
};

// Report Preview Component
const ReportPreview: React.FC<{
  report: CustomReport;
  onClose: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
}> = ({ report, onClose, onExportPDF, onExportExcel }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
          <div>
            <h2 className="text-xl font-bold text-white">{report.name}</h2>
            <p className="text-sm text-slate-400">{report.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={onExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Printer className="w-5 h-5 text-slate-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-slate-900/50">
          <div className="space-y-6">
            {report.sections.map((section) => (
              <div key={section.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-brand-500 rounded-full" />
                  {section.title}
                </h3>

                {/* KPI Preview */}
                {section.type === 'kpi' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(section.config.selectedKpis || []).map((kpiId: string) => {
                      const kpi = kpiOptions.find(k => k.id === kpiId);
                      if (!kpi) return null;
                      return (
                        <div key={kpiId} className="bg-slate-700/50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <kpi.icon className="w-4 h-4 text-brand-400" />
                            <span className="text-xs text-slate-400">{kpi.label}</span>
                          </div>
                          <p className="text-2xl font-bold text-white">{kpi.value}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Enhanced Chart Preview */}
                {section.type === 'chart' && (
                  <div className="h-48 bg-slate-700/30 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      {section.config.chartType === 'bar' && <BarChart3 className="w-12 h-12 text-brand-400 mx-auto mb-2" />}
                      {section.config.chartType === 'line' && <LineChart className="w-12 h-12 text-brand-400 mx-auto mb-2" />}
                      {section.config.chartType === 'pie' && <PieChart className="w-12 h-12 text-brand-400 mx-auto mb-2" />}
                      {section.config.chartType === 'area' && <AreaChart className="w-12 h-12 text-brand-400 mx-auto mb-2" />}
                      {section.config.chartType === 'radar' && <Radar className="w-12 h-12 text-brand-400 mx-auto mb-2" />}
                      {section.config.chartType === 'gauge' && <Gauge className="w-12 h-12 text-brand-400 mx-auto mb-2" />}
                      {section.config.chartType === 'funnel' && <Filter className="w-12 h-12 text-brand-400 mx-auto mb-2" />}
                      {section.config.chartType === 'stacked' && <Layers className="w-12 h-12 text-brand-400 mx-auto mb-2" />}
                      {section.config.chartType === 'donut' && <Circle className="w-12 h-12 text-brand-400 mx-auto mb-2" />}
                      <p className="text-sm text-slate-400">
                        {chartTypes.find(c => c.id === section.config.chartType)?.label || 'Chart'} - {section.config.dataSource}
                      </p>
                    </div>
                  </div>
                )}

                {/* Table Preview */}
                {section.type === 'table' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {[1, 2, 3].map((row) => (
                          <tr key={row} className="hover:bg-slate-700/30">
                            <td className="px-4 py-3 text-sm text-slate-300">INC-2026-{row.toString().padStart(3, '0')}</td>
                            <td className="px-4 py-3 text-sm text-slate-300">Sample {section.config.tableData} record</td>
                            <td className="px-4 py-3"><span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">Active</span></td>
                            <td className="px-4 py-3 text-sm text-slate-400">Jan {20 + row}, 2026</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Text Preview */}
                {section.type === 'text' && (
                  <p className="text-slate-300 whitespace-pre-wrap">
                    {section.config.content || 'No content added yet.'}
                  </p>
                )}

                {/* Checklist Preview */}
                {section.type === 'checklist' && (
                  <div className="space-y-2">
                    {['Complete safety audit', 'Review incident reports', 'Update training records'].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${i === 0 ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-500'}`}>
                          {i === 0 && <CheckSquare className="w-3 h-3 text-emerald-400" />}
                        </div>
                        <span className="text-sm text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary Preview */}
                {section.type === 'summary' && (
                  <div className="space-y-4">
                    {section.config.highlights !== false && (
                      <div>
                        <h4 className="text-sm font-medium text-brand-400 mb-2">Key Highlights</h4>
                        <ul className="space-y-1">
                          <li className="text-sm text-slate-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full" />
                            Safety score improved by 5% this month
                          </li>
                          <li className="text-sm text-slate-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full" />
                            Zero lost-time incidents for 45 consecutive days
                          </li>
                        </ul>
                      </div>
                    )}
                    {section.config.recommendations !== false && (
                      <div>
                        <h4 className="text-sm font-medium text-amber-400 mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          <li className="text-sm text-slate-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                            Continue focus on slip/trip/fall prevention
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Goals Preview */}
                {section.type === 'goals' && (
                  <div className="space-y-4">
                    {sampleSafetyGoals.slice(0, 2).map((goal) => (
                      <div key={goal.id} className="bg-slate-700/30 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getCategoryColor(goal.category)}`} />
                            <div>
                              <h4 className="font-medium text-white">{goal.title}</h4>
                              <p className="text-xs text-slate-400">{goal.owner}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(goal.status)}`}>
                            {goal.status.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Progress</span>
                            <span>{Math.round((goal.currentValue / goal.targetValue) * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-600 rounded-full h-2">
                            <div
                              className="bg-brand-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        {section.config.showMilestones !== false && (
                          <div className="flex items-center gap-2 text-xs">
                            {goal.milestones.map((m, i) => (
                              <div key={m.id} className="flex items-center gap-1">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${m.completed ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                                  {m.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                {i < goal.milestones.length - 1 && <div className="w-6 h-0.5 bg-slate-600" />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Safety Goals & Targets Component
export const SafetyGoalsTargets: React.FC = () => {
  const [goals, setGoals] = useState<SafetyGoal[]>(sampleSafetyGoals);
  const [selectedGoal, setSelectedGoal] = useState<SafetyGoal | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showProgressUpdate, setShowProgressUpdate] = useState(false);
  const [showTeamAssignment, setShowTeamAssignment] = useState(false);
  const [showProgressHistory, setShowProgressHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showGoalDashboard, setShowGoalDashboard] = useState(false);
  const [selectedGoalForAction, setSelectedGoalForAction] = useState<SafetyGoal | null>(null);
  const [progressNote, setProgressNote] = useState('');
  const [newProgressValue, setNewProgressValue] = useState(0);
  const [comments, setComments] = useState<GoalComment[]>(sampleComments);
  const [reminders, setReminders] = useState<GoalReminder[]>(sampleReminders);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [newReminder, setNewReminder] = useState<Partial<GoalReminder>>({
    title: '',
    type: 'custom',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    repeat: 'none',
    notifyVia: ['email', 'push'],
    isActive: true
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    milestoneReminders: true,
    deadlineAlerts: true,
    progressUpdates: true,
    atRiskAlerts: true,
    completionNotifications: true,
    emailNotifications: true,
    pushNotifications: true,
    reminderDays: 3
  });
  const [newGoal, setNewGoal] = useState<Partial<SafetyGoal>>({
    title: '',
    description: '',
    category: 'incident',
    targetValue: 0,
    currentValue: 0,
    unit: '',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: '',
    status: 'not-started',
    owner: '',
    priority: 'medium',
    milestones: [],
    assignedTeam: [],
    progressHistory: []
  });

  const filteredGoals = goals.filter(goal => {
    if (filterStatus !== 'all' && goal.status !== filterStatus) return false;
    if (filterCategory !== 'all' && goal.category !== filterCategory) return false;
    return true;
  });

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id !== goalId) return goal;
      return {
        ...goal,
        milestones: goal.milestones.map(m => {
          if (m.id !== milestoneId) return m;
          return {
            ...m,
            completed: !m.completed,
            completedDate: !m.completed ? new Date().toISOString().split('T')[0] : undefined
          };
        })
      };
    }));
  };

  // Update progress for a goal
  const updateGoalProgress = () => {
    if (!selectedGoalForAction) return;
    
    const progressEntry: ProgressEntry = {
      id: `prog-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      previousValue: selectedGoalForAction.currentValue,
      newValue: newProgressValue,
      updatedBy: 'Current User',
      notes: progressNote
    };

    setGoals(prev => prev.map(goal => {
      if (goal.id !== selectedGoalForAction.id) return goal;
      const newHistory = [...(goal.progressHistory || []), progressEntry];
      const progress = (newProgressValue / goal.targetValue) * 100;
      let newStatus = goal.status;
      if (newProgressValue >= goal.targetValue) {
        newStatus = 'completed';
      } else if (progress >= 75) {
        newStatus = 'on-track';
      } else if (progress >= 25) {
        newStatus = 'in-progress';
      }
      return {
        ...goal,
        currentValue: newProgressValue,
        progressHistory: newHistory,
        status: newStatus
      };
    }));
    
    setShowProgressUpdate(false);
    setProgressNote('');
    setNewProgressValue(0);
    setSelectedGoalForAction(null);
  };

  // Assign team members to a goal
  const assignTeamToGoal = (teamMembers: TeamMember[]) => {
    if (!selectedGoalForAction) return;
    
    setGoals(prev => prev.map(goal => {
      if (goal.id !== selectedGoalForAction.id) return goal;
      return {
        ...goal,
        assignedTeam: teamMembers
      };
    }));
    
    setShowTeamAssignment(false);
    setSelectedGoalForAction(null);
  };

  // Add a comment to a goal
  const addComment = () => {
    if (!selectedGoalForAction || !newComment.trim()) return;
    
    const comment: GoalComment = {
      id: `cmt-${Date.now()}`,
      goalId: selectedGoalForAction.id,
      authorId: 'tm-1',
      authorName: 'Current User',
      authorRole: 'Safety Team',
      content: newComment,
      timestamp: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      replies: [],
      isEdited: false
    };
    
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  // Add a reply to a comment
  const addReply = (parentCommentId: string) => {
    if (!replyContent.trim()) return;
    
    const reply: GoalComment = {
      id: `cmt-${Date.now()}-reply`,
      goalId: selectedGoalForAction?.id || '',
      authorId: 'tm-1',
      authorName: 'Current User',
      authorRole: 'Safety Team',
      content: replyContent,
      timestamp: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      replies: [],
      isEdited: false
    };
    
    setComments(prev => prev.map(cmt => {
      if (cmt.id === parentCommentId) {
        return { ...cmt, replies: [...cmt.replies, reply] };
      }
      return cmt;
    }));
    
    setReplyingTo(null);
    setReplyContent('');
  };

  // Toggle like on a comment
  const toggleLike = (commentId: string, isReply: boolean = false, parentId?: string) => {
    const userId = 'current-user';
    
    setComments(prev => prev.map(cmt => {
      if (isReply && parentId === cmt.id) {
        return {
          ...cmt,
          replies: cmt.replies.map(reply => {
            if (reply.id === commentId) {
              const isLiked = reply.likedBy.includes(userId);
              return {
                ...reply,
                likes: isLiked ? reply.likes - 1 : reply.likes + 1,
                likedBy: isLiked 
                  ? reply.likedBy.filter(id => id !== userId)
                  : [...reply.likedBy, userId]
              };
            }
            return reply;
          })
        };
      }
      if (cmt.id === commentId) {
        const isLiked = cmt.likedBy.includes(userId);
        return {
          ...cmt,
          likes: isLiked ? cmt.likes - 1 : cmt.likes + 1,
          likedBy: isLiked 
            ? cmt.likedBy.filter(id => id !== userId)
            : [...cmt.likedBy, userId]
        };
      }
      return cmt;
    }));
  };

  // Add a reminder
  const addNewReminder = () => {
    if (!selectedGoalForAction || !newReminder.title) return;
    
    const reminder: GoalReminder = {
      id: `rem-${Date.now()}`,
      goalId: selectedGoalForAction.id,
      title: newReminder.title || '',
      type: newReminder.type || 'custom',
      date: newReminder.date || new Date().toISOString().split('T')[0],
      time: newReminder.time || '09:00',
      repeat: newReminder.repeat || 'none',
      notifyVia: newReminder.notifyVia || ['email'],
      isActive: true,
      createdBy: 'Current User'
    };
    
    setReminders(prev => [...prev, reminder]);
    setShowAddReminder(false);
    setNewReminder({
      title: '',
      type: 'custom',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      repeat: 'none',
      notifyVia: ['email', 'push'],
      isActive: true
    });
  };

  // Toggle reminder active state
  const toggleReminderActive = (reminderId: string) => {
    setReminders(prev => prev.map(rem => {
      if (rem.id === reminderId) {
        return { ...rem, isActive: !rem.isActive };
      }
      return rem;
    }));
  };

  // Delete a reminder
  const deleteReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(rem => rem.id !== reminderId));
  };

  // Export goals to PDF
  const exportGoalsToPDF = useCallback(() => {
    const content = `
SAFETY GOALS & TARGETS REPORT
=============================
Generated: ${new Date().toLocaleDateString()}
Total Goals: ${goals.length}

${goals.map((goal, index) => `
${index + 1}. ${goal.title}
   Category: ${goal.category}
   Status: ${goal.status}
   Progress: ${goal.currentValue}/${goal.targetValue} ${goal.unit} (${Math.round((goal.currentValue / goal.targetValue) * 100)}%)
   Owner: ${goal.owner}
   Priority: ${goal.priority}
   Start Date: ${goal.startDate}
   Target Date: ${goal.targetDate}
   
   Assigned Team: ${goal.assignedTeam?.map(t => t.name).join(', ') || 'Not assigned'}
   
   Milestones:
   ${goal.milestones.map((m, mi) => `   ${mi + 1}. ${m.title} - ${m.completed ? 'Completed' : 'Pending'} (Due: ${m.targetDate})`).join('\\n')}
   
   Progress History:
   ${goal.progressHistory?.map(p => `   - ${p.date}: ${p.previousValue} → ${p.newValue} by ${p.updatedBy}${p.notes ? ' - ' + p.notes : ''}`).join('\\n') || '   No updates recorded'}
`).join('\\n---\\n')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Safety_Goals_Report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [goals]);

  const createGoalFromTemplate = (template: GoalTemplate) => {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setMonth(targetDate.getMonth() + 6);
    
    const milestones: Milestone[] = template.suggestedMilestones.map((title, index) => {
      const milestoneDate = new Date(today);
      milestoneDate.setMonth(milestoneDate.getMonth() + Math.floor(((index + 1) / template.suggestedMilestones.length) * 6));
      return {
        id: `m-${Date.now()}-${index}`,
        title,
        targetDate: milestoneDate.toISOString().split('T')[0],
        completed: false
      };
    });

    const newGoalFromTemplate: SafetyGoal = {
      id: `goal-${Date.now()}`,
      title: template.name,
      description: template.description,
      category: template.category,
      targetValue: template.defaultTarget,
      currentValue: 0,
      unit: template.unit,
      startDate: today.toISOString().split('T')[0],
      targetDate: targetDate.toISOString().split('T')[0],
      status: 'not-started',
      owner: '',
      priority: 'medium',
      milestones,
      assignedTeam: [],
      progressHistory: []
    };

    setGoals(prev => [...prev, newGoalFromTemplate]);
    setShowTemplates(false);
  };

  const addCustomGoal = () => {
    if (!newGoal.title || !newGoal.targetDate) return;
    
    const goal: SafetyGoal = {
      id: `goal-${Date.now()}`,
      title: newGoal.title || '',
      description: newGoal.description || '',
      category: newGoal.category || 'incident',
      targetValue: newGoal.targetValue || 0,
      currentValue: newGoal.currentValue || 0,
      unit: newGoal.unit || '',
      startDate: newGoal.startDate || new Date().toISOString().split('T')[0],
      targetDate: newGoal.targetDate || '',
      status: 'not-started',
      owner: newGoal.owner || '',
      priority: newGoal.priority || 'medium',
      milestones: newGoal.milestones || [],
      assignedTeam: [],
      progressHistory: []
    };

    setGoals(prev => [...prev, goal]);
    setShowAddGoal(false);
    setNewGoal({
      title: '',
      description: '',
      category: 'incident',
      targetValue: 0,
      currentValue: 0,
      unit: '',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: '',
      status: 'not-started',
      owner: '',
      priority: 'medium',
      milestones: [],
      assignedTeam: [],
      progressHistory: []
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Safety Goals & Targets</h1>
              <p className="text-slate-400">Track progress and measure milestone achievements</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportGoalsToPDF}
              className="flex items-center gap-2 px-3 py-2.5 bg-green-600/20 text-green-400 rounded-xl hover:bg-green-600/30 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button
              onClick={() => setShowNotificationSettings(true)}
              className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </button>
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 px-3 py-2.5 bg-purple-600/20 text-purple-400 rounded-xl hover:bg-purple-600/30 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Templates
            </button>
            <button
              onClick={() => setShowAddGoal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Goal
            </button>
            <button
              onClick={() => setShowGoalDashboard(true)}
              className="flex items-center gap-2 px-3 py-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl hover:bg-indigo-600/30 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 min-w-max">
            {categoryFilters.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  filterCategory === cat.id
                    ? `${cat.color} text-white shadow-lg`
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                <span className="text-sm font-medium whitespace-nowrap">{cat.label}</span>
                {cat.id !== 'all' && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    filterCategory === cat.id ? 'bg-white/20' : 'bg-slate-700'
                  }`}>
                    {goals.filter(g => g.category === cat.id).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Row */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-slate-400">Status:</span>
          <div className="flex items-center gap-2">
            {['all', 'not-started', 'in-progress', 'on-track', 'at-risk', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  filterStatus === status
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{goals.length}</p>
                <p className="text-sm text-slate-400">Total Goals</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{goals.filter(g => g.status === 'on-track' || g.status === 'completed').length}</p>
                <p className="text-sm text-slate-400">On Track</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{goals.filter(g => g.status === 'at-risk').length}</p>
                <p className="text-sm text-slate-400">At Risk</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{goals.filter(g => g.status === 'completed').length}</p>
                <p className="text-sm text-slate-400">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {filteredGoals.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
              <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">No goals found</h3>
              <p className="text-sm text-slate-500 mb-4">
                {filterCategory !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your filters or create a new goal'
                  : 'Get started by creating your first safety goal'}
              </p>
              <button
                onClick={() => setShowTemplates(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create from Template
              </button>
            </div>
          ) : (
            filteredGoals.map((goal) => (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-4 h-4 rounded-full mt-1 ${getCategoryColor(goal.category)}`} />
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{goal.title}</h3>
                        <p className="text-sm text-slate-400 mb-2">{goal.description}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(goal.status)}`}>
                            {goal.status.replace('-', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(goal.priority)}`}>
                            {goal.priority} priority
                          </span>
                          <span className="text-xs text-slate-500">Owner: {goal.owner}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-white">
                        {goal.currentValue}<span className="text-lg text-slate-400">/{goal.targetValue}</span>
                      </p>
                      <p className="text-xs text-slate-400">{goal.unit}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-slate-400 mb-2">
                      <span>Progress</span>
                      <span>{Math.round((goal.currentValue / goal.targetValue) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          goal.status === 'completed' ? 'bg-emerald-500' :
                          goal.status === 'at-risk' ? 'bg-amber-500' :
                          goal.status === 'overdue' ? 'bg-red-500' :
                          'bg-brand-500'
                        }`}
                        style={{ width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Flag className="w-4 h-4" />
                        Milestones
                      </h4>
                      <span className="text-xs text-slate-500">
                        {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} completed
                      </span>
                    </div>
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-slate-700" />
                      
                      <div className="space-y-3">
                        {goal.milestones.map((milestone, index) => (
                          <div
                            key={milestone.id}
                            className={`flex items-start gap-4 p-3 rounded-xl transition-colors cursor-pointer ${
                              milestone.completed ? 'bg-emerald-500/10' : 'bg-slate-700/30 hover:bg-slate-700/50'
                            }`}
                            onClick={() => toggleMilestone(goal.id, milestone.id)}
                          >
                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                              milestone.completed ? 'bg-emerald-500' : 'bg-slate-600 border-2 border-slate-500'
                            }`}>
                              {milestone.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              ) : (
                                <span className="text-xs text-slate-300">{index + 1}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium ${milestone.completed ? 'text-emerald-400' : 'text-white'}`}>
                                {milestone.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span className="text-xs text-slate-500">
                                  Target: {milestone.targetDate}
                                  {milestone.completed && milestone.completedDate && (
                                    <span className="text-emerald-400 ml-2">• Completed: {milestone.completedDate}</span>
                                  )}
                                </span>
                              </div>
                            </div>
                            {!milestone.completed && (
                              <button className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors">
                                <PlayCircle className="w-5 h-5 text-slate-400" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
                    <span>Start: {goal.startDate}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span>Target: {goal.targetDate}</span>
                  </div>

                  {/* Action Buttons for Goal */}
                  <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedGoalForAction(goal);
                        setNewProgressValue(goal.currentValue);
                        setShowProgressUpdate(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-brand-600/20 text-brand-400 rounded-lg hover:bg-brand-600/30 transition-colors text-sm"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Update Progress
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGoalForAction(goal);
                        setShowTeamAssignment(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors text-sm"
                    >
                      <Users className="w-4 h-4" />
                      Assign Team
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGoalForAction(goal);
                        setShowProgressHistory(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-colors text-sm"
                    >
                      <Clock className="w-4 h-4" />
                      View History
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGoalForAction(goal);
                        setShowComments(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-cyan-600/20 text-cyan-400 rounded-lg hover:bg-cyan-600/30 transition-colors text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Comments
                      {comments.filter(c => c.goalId === goal.id).length > 0 && (
                        <span className="px-1.5 py-0.5 bg-cyan-500/30 text-cyan-300 text-xs rounded-full">
                          {comments.filter(c => c.goalId === goal.id).length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGoalForAction(goal);
                        setShowReminders(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-amber-600/20 text-amber-400 rounded-lg hover:bg-amber-600/30 transition-colors text-sm"
                    >
                      <AlarmClock className="w-4 h-4" />
                      Reminders
                      {reminders.filter(r => r.goalId === goal.id && r.isActive).length > 0 && (
                        <span className="px-1.5 py-0.5 bg-amber-500/30 text-amber-300 text-xs rounded-full">
                          {reminders.filter(r => r.goalId === goal.id && r.isActive).length}
                        </span>
                      )}
                    </button>
                    {goal.assignedTeam && goal.assignedTeam.length > 0 && (
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-xs text-slate-500">Team:</span>
                        <div className="flex -space-x-2">
                          {goal.assignedTeam.slice(0, 3).map((member) => (
                            <div
                              key={member.id}
                              className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-xs text-white border-2 border-slate-800"
                              title={member.name}
                            >
                              {member.name.charAt(0)}
                            </div>
                          ))}
                          {goal.assignedTeam.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white border-2 border-slate-800">
                              +{goal.assignedTeam.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Progress Update Modal */}
      <AnimatePresence>
        {showProgressUpdate && selectedGoalForAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowProgressUpdate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-700"
            >
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-400" />
                  Update Progress
                </h2>
                <p className="text-sm text-slate-400">{selectedGoalForAction.title}</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Current Progress</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={newProgressValue}
                      onChange={(e) => setNewProgressValue(parseFloat(e.target.value) || 0)}
                      className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                    <span className="text-slate-400">/ {selectedGoalForAction.targetValue} {selectedGoalForAction.unit}</span>
                  </div>
                  <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-brand-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((newProgressValue / selectedGoalForAction.targetValue) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-right">
                    {Math.round((newProgressValue / selectedGoalForAction.targetValue) * 100)}% complete
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Notes (optional)</label>
                  <textarea
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                    placeholder="Add context about this update..."
                    rows={3}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowProgressUpdate(false)}
                    className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateGoalProgress}
                    className="flex-1 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-colors"
                  >
                    Save Update
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Assignment Modal */}
      <AnimatePresence>
        {showTeamAssignment && selectedGoalForAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTeamAssignment(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700"
            >
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Assign Team Members
                </h2>
                <p className="text-sm text-slate-400">{selectedGoalForAction.title}</p>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div className="space-y-2">
                  {sampleTeamMembers.map((member) => {
                    const isAssigned = selectedGoalForAction.assignedTeam?.some(t => t.id === member.id);
                    return (
                      <label
                        key={member.id}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                          isAssigned ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-slate-700/30 hover:bg-slate-700/50 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGoalForAction(prev => prev ? {
                                ...prev,
                                assignedTeam: [...(prev.assignedTeam || []), member]
                              } : null);
                            } else {
                              setSelectedGoalForAction(prev => prev ? {
                                ...prev,
                                assignedTeam: prev.assignedTeam?.filter(t => t.id !== member.id) || []
                              } : null);
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500/50"
                        />
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-xs text-slate-400">{member.role}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="p-4 border-t border-slate-700 flex gap-3">
                <button
                  onClick={() => setShowTeamAssignment(false)}
                  className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => assignTeamToGoal(selectedGoalForAction.assignedTeam || [])}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors"
                >
                  Save Assignment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress History Modal */}
      <AnimatePresence>
        {showProgressHistory && selectedGoalForAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowProgressHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700"
            >
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Progress History
                </h2>
                <p className="text-sm text-slate-400">{selectedGoalForAction.title}</p>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {selectedGoalForAction.progressHistory && selectedGoalForAction.progressHistory.length > 0 ? (
                  <div className="space-y-3">
                    {selectedGoalForAction.progressHistory.slice().reverse().map((entry) => (
                      <div key={entry.id} className="bg-slate-700/30 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-300">{entry.date}</span>
                          </div>
                          <span className="text-xs text-slate-500">by {entry.updatedBy}</span>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg text-slate-400">{entry.previousValue}</span>
                          <ArrowRight className="w-4 h-4 text-brand-400" />
                          <span className="text-lg font-bold text-brand-400">{entry.newValue}</span>
                          <span className="text-xs text-slate-500">{selectedGoalForAction.unit}</span>
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-slate-400 bg-slate-700/50 rounded-lg p-2 mt-2">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-400 mb-2">No history yet</h3>
                    <p className="text-sm text-slate-500">Progress updates will appear here</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-700">
                <button
                  onClick={() => setShowProgressHistory(false)}
                  className="w-full py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700"
            >
              <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Copy className="w-5 h-5 text-purple-400" />
                    Goal Templates
                  </h2>
                  <p className="text-sm text-slate-400">Quick-start your safety goals with pre-configured templates</p>
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goalTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => createGoalFromTemplate(template)}
                      className="text-left bg-slate-700/30 hover:bg-slate-700/50 rounded-xl p-4 border border-slate-600/30 hover:border-brand-500/30 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${template.color}`}>
                          <template.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white group-hover:text-brand-400 transition-colors">{template.name}</h3>
                          <p className="text-xs text-slate-400 mt-1">{template.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 text-xs bg-slate-600/50 text-slate-300 rounded-full">
                              Target: {template.defaultTarget} {template.unit}
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-slate-600/50 text-slate-300 rounded-full capitalize">
                              {template.category}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center gap-1">
                            <span className="text-xs text-slate-500">Milestones:</span>
                            {template.suggestedMilestones.slice(0, 3).map((m, i) => (
                              <span key={i} className="w-2 h-2 rounded-full bg-slate-600" />
                            ))}
                            {template.suggestedMilestones.length > 3 && (
                              <span className="text-xs text-slate-500">+{template.suggestedMilestones.length - 3}</span>
                            )}
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-slate-500 group-hover:text-brand-400 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Settings Modal */}
      <AnimatePresence>
        {showNotificationSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNotificationSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-700"
            >
              <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-400" />
                    Notification Settings
                  </h2>
                  <p className="text-sm text-slate-400">Configure goal alerts and reminders</p>
                </div>
                <button
                  onClick={() => setShowNotificationSettings(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Notification Types */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Alert Types</h3>
                  {[
                    { key: 'milestoneReminders', label: 'Milestone Reminders', icon: Flag, desc: 'Get reminded before milestone due dates' },
                    { key: 'deadlineAlerts', label: 'Deadline Alerts', icon: Clock, desc: 'Alerts when goals are approaching deadline' },
                    { key: 'progressUpdates', label: 'Progress Updates', icon: TrendingUp, desc: 'Weekly progress summary notifications' },
                    { key: 'atRiskAlerts', label: 'At-Risk Alerts', icon: AlertOctagon, desc: 'Immediate alerts when goals become at-risk' },
                    { key: 'completionNotifications', label: 'Completion Notifications', icon: CheckCircle2, desc: 'Celebrate when goals are achieved' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={notifications[item.key as keyof NotificationSettings] as boolean}
                        onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-brand-500 focus:ring-brand-500/50"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-white">{item.label}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Delivery Methods */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Delivery Methods</h3>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={notifications.emailNotifications}
                        onChange={(e) => setNotifications(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-brand-500 focus:ring-brand-500/50"
                      />
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-white">Email</span>
                    </label>
                    <label className="flex-1 flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={notifications.pushNotifications}
                        onChange={(e) => setNotifications(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-brand-500 focus:ring-brand-500/50"
                      />
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-white">Push</span>
                    </label>
                  </div>
                </div>

                {/* Reminder Timing */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Reminder Timing</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">Remind me</span>
                    <select
                      value={notifications.reminderDays}
                      onChange={(e) => setNotifications(prev => ({ ...prev, reminderDays: parseInt(e.target.value) }))}
                      className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    >
                      <option value={1}>1 day</option>
                      <option value={3}>3 days</option>
                      <option value={5}>5 days</option>
                      <option value={7}>1 week</option>
                      <option value={14}>2 weeks</option>
                    </select>
                    <span className="text-sm text-slate-400">before deadline</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowNotificationSettings(false)}
                  className="w-full py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-colors font-medium"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Custom Goal Modal */}
      <AnimatePresence>
        {showAddGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddGoal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700"
            >
              <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Create New Goal</h2>
                  <p className="text-sm text-slate-400">Define a custom safety goal</p>
                </div>
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Goal Title</label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Reduce TRIR to below 2.0"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the goal objective..."
                    rows={2}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                    <select
                      value={newGoal.category}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value as SafetyGoal['category'] }))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    >
                      <option value="incident">Incident Reduction</option>
                      <option value="compliance">Compliance</option>
                      <option value="training">Training</option>
                      <option value="audit">Audit</option>
                      <option value="environmental">Environmental</option>
                      <option value="culture">Safety Culture</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                    <select
                      value={newGoal.priority}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value as SafetyGoal['priority'] }))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Value</label>
                    <input
                      type="number"
                      value={newGoal.targetValue}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, targetValue: parseFloat(e.target.value) }))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Current Value</label>
                    <input
                      type="number"
                      value={newGoal.currentValue}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, currentValue: parseFloat(e.target.value) }))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Unit</label>
                    <input
                      type="text"
                      value={newGoal.unit}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="%"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newGoal.startDate}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Date</label>
                    <input
                      type="date"
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Owner</label>
                  <input
                    type="text"
                    value={newGoal.owner}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, owner: e.target.value }))}
                    placeholder="e.g., Safety Director"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-700 flex gap-3">
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addCustomGoal}
                  disabled={!newGoal.title || !newGoal.targetDate}
                  className="flex-1 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Goal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Comments Modal */}
      <AnimatePresence>
        {showComments && selectedGoalForAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowComments(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700"
            >
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  Comments
                </h2>
                <p className="text-sm text-slate-400">{selectedGoalForAction.title}</p>
              </div>
              <div className="p-4 overflow-y-auto max-h-[50vh]">
                {comments.filter(c => c.goalId === selectedGoalForAction.id).length > 0 ? (
                  <div className="space-y-4">
                    {comments.filter(c => c.goalId === selectedGoalForAction.id).map((comment) => (
                      <div key={comment.id} className="bg-slate-700/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-medium shrink-0">
                            {comment.authorName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div>
                                <span className="font-medium text-white">{comment.authorName}</span>
                                <span className="text-xs text-slate-500 ml-2">{comment.authorRole}</span>
                              </div>
                              <span className="text-xs text-slate-500">
                                {new Date(comment.timestamp).toLocaleDateString()}
                                {comment.isEdited && <span className="ml-1 italic">(edited)</span>}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm mb-3">{comment.content}</p>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleLike(comment.id)}
                                className={`flex items-center gap-1 text-xs transition-colors ${
                                  comment.likedBy.includes('current-user')
                                    ? 'text-cyan-400'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                {comment.likes > 0 && comment.likes}
                              </button>
                              <button
                                onClick={() => setReplyingTo(comment.id)}
                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                              >
                                <Reply className="w-3.5 h-3.5" />
                                Reply
                              </button>
                            </div>

                            {/* Replies */}
                            {comment.replies.length > 0 && (
                              <div className="mt-3 pl-4 border-l-2 border-slate-600 space-y-3">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="bg-slate-700/50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs">
                                        {reply.authorName.split(' ').map(n => n[0]).join('')}
                                      </div>
                                      <span className="text-sm font-medium text-white">{reply.authorName}</span>
                                      <span className="text-xs text-slate-500">{new Date(reply.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-300 text-sm">{reply.content}</p>
                                    <button
                                      onClick={() => toggleLike(reply.id, true, comment.id)}
                                      className={`flex items-center gap-1 text-xs mt-2 transition-colors ${
                                        reply.likedBy.includes('current-user')
                                          ? 'text-cyan-400'
                                          : 'text-slate-500 hover:text-slate-300'
                                      }`}
                                    >
                                      <ThumbsUp className="w-3 h-3" />
                                      {reply.likes > 0 && reply.likes}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input */}
                            {replyingTo === comment.id && (
                              <div className="mt-3 flex gap-2">
                                <input
                                  type="text"
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder="Write a reply..."
                                  className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      addReply(comment.id);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => addReply(comment.id)}
                                  disabled={!replyContent.trim()}
                                  className="px-3 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyContent('');
                                  }}
                                  className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-400 mb-2">No comments yet</h3>
                    <p className="text-sm text-slate-500">Start the discussion!</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addComment();
                      }
                    }}
                  />
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-500 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Reminders Modal */}
      <AnimatePresence>
        {showReminders && selectedGoalForAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReminders(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700"
            >
              <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlarmClock className="w-5 h-5 text-amber-400" />
                    Goal Reminders
                  </h2>
                  <p className="text-sm text-slate-400">{selectedGoalForAction.title}</p>
                </div>
                <button
                  onClick={() => setShowAddReminder(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-600/20 text-amber-400 rounded-lg hover:bg-amber-600/30 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {reminders.filter(r => r.goalId === selectedGoalForAction.id).length > 0 ? (
                  <div className="space-y-3">
                    {reminders.filter(r => r.goalId === selectedGoalForAction.id).map((reminder) => (
                      <div
                        key={reminder.id}
                        className={`bg-slate-700/30 rounded-xl p-4 border ${
                          reminder.isActive ? 'border-amber-500/30' : 'border-slate-600/30 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${
                              reminder.type === 'milestone' ? 'bg-purple-500/20 text-purple-400' :
                              reminder.type === 'deadline' ? 'bg-red-500/20 text-red-400' :
                              reminder.type === 'progress' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {reminder.type === 'milestone' && <Flag className="w-4 h-4" />}
                              {reminder.type === 'deadline' && <Clock className="w-4 h-4" />}
                              {reminder.type === 'progress' && <TrendingUp className="w-4 h-4" />}
                              {reminder.type === 'custom' && <Bell className="w-4 h-4" />}
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{reminder.title}</h3>
                              <p className="text-xs text-slate-400 capitalize">{reminder.type} reminder</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleReminderActive(reminder.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                reminder.isActive
                                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                  : 'bg-slate-600/50 text-slate-500 hover:bg-slate-600'
                              }`}
                            >
                              {reminder.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => deleteReminder(reminder.id)}
                              className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-4 h-4" />
                            {reminder.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {reminder.time}
                          </div>
                          {reminder.repeat !== 'none' && (
                            <div className="flex items-center gap-1 text-amber-400">
                              <Repeat className="w-4 h-4" />
                              {reminder.repeat}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {reminder.notifyVia.map(method => (
                            <span
                              key={method}
                              className="px-2 py-0.5 bg-slate-600/50 text-slate-300 text-xs rounded-full capitalize"
                            >
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlarmClock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-400 mb-2">No reminders set</h3>
                    <p className="text-sm text-slate-500">Add a reminder to stay on track</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-700">
                <button
                  onClick={() => setShowReminders(false)}
                  className="w-full py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Reminder Modal */}
      <AnimatePresence>
        {showAddReminder && selectedGoalForAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddReminder(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-700"
            >
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <AlarmClock className="w-5 h-5 text-amber-400" />
                  Add Reminder
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reminder Title</label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Weekly progress check"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reminder Type</label>
                  <select
                    value={newReminder.type}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, type: e.target.value as GoalReminder['type'] }))}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="milestone">Milestone Reminder</option>
                    <option value="deadline">Deadline Alert</option>
                    <option value="progress">Progress Check</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                    <input
                      type="date"
                      value={newReminder.date}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
                    <input
                      type="time"
                      value={newReminder.time}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Repeat</label>
                  <select
                    value={newReminder.repeat}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, repeat: e.target.value as GoalReminder['repeat'] }))}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="none">No Repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Notify Via</label>
                  <div className="flex items-center gap-3">
                    {['email', 'push', 'sms'].map((method) => (
                      <label key={method} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newReminder.notifyVia?.includes(method as any) || false}
                          onChange={(e) => {
                            const current = newReminder.notifyVia || [];
                            if (e.target.checked) {
                              setNewReminder(prev => ({ ...prev, notifyVia: [...current, method as any] }));
                            } else {
                              setNewReminder(prev => ({ ...prev, notifyVia: current.filter(m => m !== method) }));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500/50"
                        />
                        <span className="text-sm text-slate-300 capitalize">{method}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddReminder(false)}
                    className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addNewReminder}
                    disabled={!newReminder.title}
                    className="flex-1 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-500 transition-colors disabled:opacity-50"
                  >
                    Add Reminder
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Dashboard Modal */}
      <AnimatePresence>
        {showGoalDashboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowGoalDashboard(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl border border-slate-700"
            >
              <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                    <LayoutDashboard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Goal Analytics Dashboard</h2>
                    <p className="text-sm text-slate-400">Comprehensive view of safety goal performance</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGoalDashboard(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="w-5 h-5 text-blue-400" />
                      <span className="text-xs text-blue-300">Total</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{goals.length}</p>
                    <p className="text-sm text-blue-300">Active Goals</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-4 border border-emerald-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs text-emerald-300">Completed</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{goals.filter(g => g.status === 'completed').length}</p>
                    <p className="text-sm text-emerald-300">Goals Achieved</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl p-4 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <Percent className="w-5 h-5 text-amber-400" />
                      <span className="text-xs text-amber-300">Average</span>
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {Math.round(goals.reduce((acc, g) => acc + (g.currentValue / g.targetValue) * 100, 0) / goals.length)}%
                    </p>
                    <p className="text-sm text-amber-300">Avg Progress</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl p-4 border border-red-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span className="text-xs text-red-300">At Risk</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{goals.filter(g => g.status === 'at-risk' || g.status === 'overdue').length}</p>
                    <p className="text-sm text-red-300">Need Attention</p>
                  </div>
                </div>

                {/* Progress by Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/50">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-brand-400" />
                      Goals by Category
                    </h3>
                    <div className="space-y-3">
                      {categoryFilters.filter(c => c.id !== 'all').map((cat) => {
                        const count = goals.filter(g => g.category === cat.id).length;
                        const percentage = goals.length > 0 ? (count / goals.length) * 100 : 0;
                        return (
                          <div key={cat.id} className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                            <span className="text-sm text-slate-300 flex-1">{cat.label}</span>
                            <span className="text-sm font-medium text-white">{count}</span>
                            <div className="w-24 bg-slate-600 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${cat.color}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/50">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-brand-400" />
                      Status Distribution
                    </h3>
                    <div className="space-y-3">
                      {[
                        { status: 'completed', label: 'Completed', color: 'bg-emerald-500' },
                        { status: 'on-track', label: 'On Track', color: 'bg-green-500' },
                        { status: 'in-progress', label: 'In Progress', color: 'bg-blue-500' },
                        { status: 'at-risk', label: 'At Risk', color: 'bg-amber-500' },
                        { status: 'overdue', label: 'Overdue', color: 'bg-red-500' },
                        { status: 'not-started', label: 'Not Started', color: 'bg-slate-500' },
                      ].map((item) => {
                        const count = goals.filter(g => g.status === item.status).length;
                        const percentage = goals.length > 0 ? (count / goals.length) * 100 : 0;
                        return (
                          <div key={item.status} className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="text-sm text-slate-300 flex-1">{item.label}</span>
                            <span className="text-sm font-medium text-white">{count}</span>
                            <div className="w-24 bg-slate-600 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${item.color}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Milestone Progress */}
                <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/50 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-brand-400" />
                    Milestone Completion
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {goals.map((goal) => {
                      const totalMilestones = goal.milestones.length;
                      const completedMilestones = goal.milestones.filter(m => m.completed).length;
                      const percentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
                      return (
                        <div key={goal.id} className="bg-slate-800/50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(goal.category)}`} />
                              <h4 className="font-medium text-white text-sm truncate max-w-[180px]">{goal.title}</h4>
                            </div>
                            <span className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(goal.status)}`}>
                              {goal.status.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 bg-slate-600 rounded-full h-2">
                              <div
                                className="bg-brand-500 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400">{completedMilestones}/{totalMilestones}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {goal.milestones.slice(0, 5).map((m) => (
                              <div
                                key={m.id}
                                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                  m.completed ? 'bg-emerald-500' : 'bg-slate-600'
                                }`}
                              >
                                {m.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                            ))}
                            {goal.milestones.length > 5 && (
                              <span className="text-xs text-slate-500">+{goal.milestones.length - 5}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Performers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/50">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      Top Progress Goals
                    </h3>
                    <div className="space-y-3">
                      {goals
                        .sort((a, b) => (b.currentValue / b.targetValue) - (a.currentValue / a.targetValue))
                        .slice(0, 5)
                        .map((goal, index) => {
                          const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
                          return (
                            <div key={goal.id} className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-amber-500 text-amber-950' :
                                index === 1 ? 'bg-slate-400 text-slate-950' :
                                index === 2 ? 'bg-amber-700 text-amber-100' :
                                'bg-slate-600 text-slate-300'
                              }`}>
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{goal.title}</p>
                                <p className="text-xs text-slate-400">{goal.owner}</p>
                              </div>
                              <span className={`text-sm font-bold ${
                                progress >= 100 ? 'text-emerald-400' :
                                progress >= 75 ? 'text-green-400' :
                                progress >= 50 ? 'text-amber-400' :
                                'text-slate-400'
                              }`}>
                                {progress}%
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/50">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      Goals Needing Attention
                    </h3>
                    <div className="space-y-3">
                      {goals
                        .filter(g => g.status === 'at-risk' || g.status === 'overdue' || (g.currentValue / g.targetValue) < 0.5)
                        .slice(0, 5)
                        .map((goal) => {
                          const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
                          return (
                            <div key={goal.id} className="flex items-center gap-3 bg-red-500/10 rounded-lg p-3">
                              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{goal.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(goal.status)}`}>
                                    {goal.status.replace('-', ' ')}
                                  </span>
                                  <span className="text-xs text-slate-400">Due: {goal.targetDate}</span>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-red-400">{progress}%</span>
                            </div>
                          );
                        })}
                      {goals.filter(g => g.status === 'at-risk' || g.status === 'overdue' || (g.currentValue / g.targetValue) < 0.5).length === 0 && (
                        <div className="text-center py-8">
                          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                          <p className="text-sm text-emerald-400">All goals are on track!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Custom Report Builder Component
export const CustomReportBuilder: React.FC = () => {
  const [report, setReport] = useState<CustomReport>({
    id: generateId(),
    name: 'Custom Safety Report',
    description: 'Create your own customized safety report',
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [showAddSection, setShowAddSection] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savedReports, setSavedReports] = useState<CustomReport[]>([]);

  // Add a new section
  const addSection = (type: SectionType) => {
    const template = sectionTemplates.find(t => t.type === type);
    const newSection: ReportSection = {
      id: generateId(),
      type,
      title: template?.label || 'New Section',
      config: type === 'kpi' ? { selectedKpis: [] } : 
              type === 'chart' ? { chartType: 'bar', dataSource: 'incidents', showLegend: true, showGrid: true } :
              type === 'table' ? { tableData: 'incidents', rowLimit: 10 } :
              type === 'summary' ? { highlights: true, risks: true, recommendations: true, nextSteps: true } :
              type === 'goals' ? { showMilestones: true, showProgress: true, showOwners: true, showDates: true, goalCategory: 'all' } :
              {}
    };
    setReport(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
      updatedAt: new Date().toISOString()
    }));
    setShowAddSection(false);
  };

  // Update a section
  const updateSection = (updatedSection: ReportSection) => {
    setReport(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === updatedSection.id ? updatedSection : s),
      updatedAt: new Date().toISOString()
    }));
  };

  // Delete a section
  const deleteSection = (sectionId: string) => {
    setReport(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
      updatedAt: new Date().toISOString()
    }));
  };

  // Reorder sections
  const reorderSections = (newOrder: ReportSection[]) => {
    setReport(prev => ({
      ...prev,
      sections: newOrder,
      updatedAt: new Date().toISOString()
    }));
  };

  // Save report
  const saveReport = () => {
    setSavedReports(prev => {
      const existing = prev.findIndex(r => r.id === report.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = report;
        return updated;
      }
      return [...prev, report];
    });
  };

  // Export to PDF (simulated)
  const exportToPDF = useCallback(() => {
    const content = `
CUSTOM SAFETY REPORT
====================
${report.name}
${report.description}
Generated: ${new Date().toLocaleDateString()}

${report.sections.map(s => `
--- ${s.title} ---
Type: ${s.type}
Configuration: ${JSON.stringify(s.config, null, 2)}
`).join('\n')}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  // Export to Excel (simulated as CSV)
  const exportToExcel = useCallback(() => {
    const headers = ['Section', 'Type', 'Title', 'Configuration'];
    const rows = report.sections.map(s => [
      s.id,
      s.type,
      s.title,
      JSON.stringify(s.config)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Custom Report Builder</h1>
              <p className="text-slate-400">Design your own safety reports with drag-and-drop sections</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(true)}
              disabled={report.sections.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={saveReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Report
            </button>
          </div>
        </div>

        {/* Report Settings */}
        <div className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-white">Report Settings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Report Name</label>
              <input
                type="text"
                value={report.name}
                onChange={(e) => setReport(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <input
                type="text"
                value={report.description}
                onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
          </div>
        </div>

        {/* Sections Builder */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-white">Report Sections</h2>
              <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs text-slate-400">
                {report.sections.length} sections
              </span>
            </div>
            <button
              onClick={() => setShowAddSection(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600/20 text-brand-400 rounded-xl hover:bg-brand-600/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>

          {/* Sections List with Drag & Drop */}
          {report.sections.length > 0 ? (
            <Reorder.Group
              axis="y"
              values={report.sections}
              onReorder={reorderSections}
              className="space-y-3"
            >
              {report.sections.map((section) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  onUpdate={updateSection}
                  onDelete={() => deleteSection(section.id)}
                />
              ))}
            </Reorder.Group>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-xl">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">No sections yet</h3>
              <p className="text-sm text-slate-500 mb-4">Start building your report by adding sections</p>
              <button
                onClick={() => setShowAddSection(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Your First Section
              </button>
            </div>
          )}
        </div>

        {/* Saved Reports */}
        {savedReports.length > 0 && (
          <div className="mt-8 bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-lg font-semibold text-white mb-4">Saved Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedReports.map((saved) => (
                <div key={saved.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="font-medium text-white mb-1">{saved.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">{saved.sections.length} sections</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReport(saved)}
                      className="flex-1 py-2 text-xs bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setReport(saved);
                        setShowPreview(true);
                      }}
                      className="flex-1 py-2 text-xs bg-brand-600/20 text-brand-400 rounded-lg hover:bg-brand-600/30 transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Section Modal */}
      <AnimatePresence>
        {showAddSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddSection(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-700"
            >
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white">Add Section</h2>
                <p className="text-sm text-slate-400">Choose a section type to add to your report</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {sectionTemplates.map((template) => (
                  <button
                    key={template.type}
                    onClick={() => addSection(template.type)}
                    className="flex flex-col items-center gap-3 p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl transition-colors text-left border border-slate-600/30 hover:border-brand-500/30"
                  >
                    <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center">
                      <template.icon className="w-6 h-6 text-brand-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-medium text-white text-sm">{template.label}</h3>
                      <p className="text-xs text-slate-400 mt-1">{template.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <ReportPreview
            report={report}
            onClose={() => setShowPreview(false)}
            onExportPDF={exportToPDF}
            onExportExcel={exportToExcel}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomReportBuilder;
