import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Calendar, Clock, CheckCircle, AlertTriangle,
  FileText, ClipboardList, Wrench, Shield, TrendingUp, Award,
  Bell, Settings, ChevronRight, MapPin, Briefcase, Star,
  BarChart3, Target, Zap, Users, Activity, Timer, Plus,
  Camera, Mic, Send, Eye, RefreshCw, Filter, Search, Sparkles, Brain,
  XCircle, CheckCircle2, Circle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorker, useWorkerPerformance, useWorkerTrainings } from '../api/hooks/useAPIHooks';
import { useAuthStore } from '../store/authStore';
import { SMButton, SMBadge } from '../components/ui';

// Worker Profile
interface WorkerProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  employeeId: string;
  certifications: Certification[];
  safetyScore: number;
  daysWithoutIncident: number;
  tasksCompleted: number;
  avatar?: string;
}

interface Certification {
  id: string;
  name: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
}

interface Task {
  id: string;
  title: string;
  type: 'inspection' | 'training' | 'permit' | 'jsa' | 'audit' | 'capa';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  dueTime?: string;
  location: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  description?: string;
}

interface RecentActivity {
  id: string;
  type: 'task_completed' | 'incident_reported' | 'training_passed' | 'observation' | 'jsa_submitted';
  title: string;
  timestamp: string;
  points?: number;
}

interface SafetyMetric {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

// Mock data
const mockWorkerProfile: WorkerProfile = {
  id: 'W-001',
  name: 'John Martinez',
  role: 'Safety Technician',
  department: 'Operations',
  employeeId: 'EMP-12345',
  certifications: [
    { id: 'C-1', name: 'OSHA 30-Hour', expiryDate: '2026-06-15', status: 'valid' },
    { id: 'C-2', name: 'First Aid/CPR', expiryDate: '2025-03-20', status: 'expiring' },
    { id: 'C-3', name: 'Confined Space Entry', expiryDate: '2025-08-10', status: 'valid' },
    { id: 'C-4', name: 'Fall Protection', expiryDate: '2024-12-01', status: 'expired' },
  ],
  safetyScore: 94,
  daysWithoutIncident: 187,
  tasksCompleted: 342
};

const mockTasks: Task[] = [
  { id: 'T-1', title: 'Daily Equipment Inspection', type: 'inspection', priority: 'high', dueDate: '2026-02-06', dueTime: '08:00', location: 'Production Floor A', status: 'pending', description: 'Complete pre-shift inspection checklist for all equipment' },
  { id: 'T-2', title: 'Hot Work Permit Review', type: 'permit', priority: 'urgent', dueDate: '2026-02-06', dueTime: '10:00', location: 'Welding Bay 3', status: 'pending', description: 'Review and approve hot work permit for welding operations' },
  { id: 'T-3', title: 'JSA - Scaffold Erection', type: 'jsa', priority: 'high', dueDate: '2026-02-06', dueTime: '13:00', location: 'Building C', status: 'in_progress', description: 'Complete Job Safety Analysis for scaffold setup' },
  { id: 'T-4', title: 'Forklift Safety Training', type: 'training', priority: 'medium', dueDate: '2026-02-07', location: 'Training Room 2', status: 'pending', description: 'Attend refresher training on forklift operations' },
  { id: 'T-5', title: 'CAPA Follow-up: Guardrail Install', type: 'capa', priority: 'high', dueDate: '2026-02-08', location: 'Mezzanine Level', status: 'in_progress', description: 'Verify guardrail installation as corrective action' },
  { id: 'T-6', title: 'Monthly Safety Audit', type: 'audit', priority: 'medium', dueDate: '2026-02-10', location: 'Entire Facility', status: 'pending', description: 'Conduct monthly safety walkthrough audit' },
];

const mockRecentActivity: RecentActivity[] = [
  { id: 'A-1', type: 'task_completed', title: 'Fire Extinguisher Inspection', timestamp: '2026-02-05T16:30:00', points: 10 },
  { id: 'A-2', type: 'observation', title: 'Reported wet floor hazard in cafeteria', timestamp: '2026-02-05T12:15:00', points: 15 },
  { id: 'A-3', type: 'training_passed', title: 'Hazard Communication Training', timestamp: '2026-02-04T14:00:00', points: 25 },
  { id: 'A-4', type: 'jsa_submitted', title: 'JSA - Crane Operations', timestamp: '2026-02-04T09:30:00', points: 20 },
  { id: 'A-5', type: 'task_completed', title: 'PPE Inventory Check', timestamp: '2026-02-03T15:45:00', points: 10 },
];

const mockSafetyMetrics: SafetyMetric[] = [
  { label: 'Safety Score', value: 94, unit: '%', trend: 'up', change: 3 },
  { label: 'Tasks This Week', value: 12, unit: '', trend: 'stable', change: 0 },
  { label: 'Observations', value: 8, unit: '', trend: 'up', change: 2 },
  { label: 'Training Hours', value: 24, unit: 'hrs', trend: 'up', change: 4 },
];

type ViewMode = 'overview' | 'tasks' | 'activity' | 'profile';
type TaskFilter = 'all' | 'today' | 'overdue' | 'completed';

export const WorkerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // ── Real API Data ──────────────────────────────────────────────────────────
  const workerId = user?.id ?? null;
  const { data: backendWorker } = useWorker(workerId);
  const { data: backendPerformance } = useWorkerPerformance(workerId);
  const { data: backendTrainings } = useWorkerTrainings(workerId);

  // Merge backend worker profile with mock
  const workerProfile = useMemo<WorkerProfile>(() => {
    if (!backendWorker) return mockWorkerProfile;
    return {
      ...mockWorkerProfile,
      id: String((backendWorker as any).id || mockWorkerProfile.id),
      name: (backendWorker as any).name || user?.fullName || mockWorkerProfile.name,
      role: user?.role || mockWorkerProfile.role,
      department: (backendWorker as any).department || user?.department || mockWorkerProfile.department,
      safetyScore: (backendPerformance as any)?.safetyScore ?? mockWorkerProfile.safetyScore,
      daysWithoutIncident: (backendPerformance as any)?.daysWithoutIncident ?? mockWorkerProfile.daysWithoutIncident,
      tasksCompleted: (backendPerformance as any)?.tasksCompleted ?? mockWorkerProfile.tasksCompleted,
    };
  }, [backendWorker, backendPerformance, user]);

  // Filter tasks based on selected filter
  const filteredTasks = mockTasks.filter(task => {
    if (taskFilter === 'today') {
      return task.dueDate === '2026-02-06';
    }
    if (taskFilter === 'overdue') {
      return task.status === 'overdue';
    }
    if (taskFilter === 'completed') {
      return task.status === 'completed';
    }
    return true;
  }).filter(task => 
    searchQuery === '' || 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayTasks = mockTasks.filter(t => t.dueDate === '2026-02-06' && t.status !== 'completed');
  const overdueTasks = mockTasks.filter(t => t.status === 'overdue');
  const expiringCerts = workerProfile.certifications.filter(c => c.status === 'expiring' || c.status === 'expired');

  const getTaskIcon = (type: Task['type']) => {
    switch (type) {
      case 'inspection': return ClipboardList;
      case 'training': return Award;
      case 'permit': return FileText;
      case 'jsa': return Shield;
      case 'audit': return Eye;
      case 'capa': return Wrench;
      default: return FileText;
    }
  };

  const getPriorityVariant = (priority: Task['priority']): 'danger' | 'warning' | 'neutral' | 'success' => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'neutral';
      case 'low': return 'success';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'in_progress': return <Activity className="w-5 h-5 text-accent animate-pulse" />;
      case 'overdue': return <XCircle className="w-5 h-5 text-danger" />;
      default: return <Circle className="w-5 h-5 text-surface-400" />;
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'task_completed': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'incident_reported': return <AlertTriangle className="w-4 h-4 text-danger" />;
      case 'training_passed': return <Award className="w-4 h-4 text-purple-500" />;
      case 'observation': return <Eye className="w-4 h-4 text-accent" />;
      case 'jsa_submitted': return <Shield className="w-4 h-4 text-accent" />;
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="bg-primary text-text-inverted sticky top-[var(--nav-height)] z-50 safe-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <SMButton variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-5 h-5" />} onClick={() => navigate(-1)} className="-ml-2 text-text-inverted hover:bg-white/10" aria-label="Go back" />
            <div className="flex items-center gap-2">
              <div className="relative">
                <SMButton variant="ghost" size="sm" leftIcon={<Bell className="w-5 h-5" />} className="text-text-inverted hover:bg-white/10" aria-label="Notifications" />
                {(todayTasks.length > 0 || expiringCerts.length > 0) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full pointer-events-none" />
                )}
              </div>
              <SMButton variant="ghost" size="sm" leftIcon={<Settings className="w-5 h-5" />} onClick={() => setViewMode('profile')} className="text-text-inverted hover:bg-white/10" aria-label="Settings" />
            </div>
          </div>

          {/* Worker Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{workerProfile.name}</h1>
              <p className="text-white/80 text-sm">{workerProfile.role}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{workerProfile.department}</span>
                <span className="text-xs text-white/60">ID: {workerProfile.employeeId}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{workerProfile.safetyScore}%</p>
              <p className="text-xs text-white/70">Safety Score</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{workerProfile.daysWithoutIncident}</p>
              <p className="text-xs text-white/70">Days Incident Free</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{todayTasks.length}</p>
              <p className="text-xs text-white/70">Tasks Today</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pb-2 gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'tasks', label: 'My Tasks', icon: ClipboardList },
            { id: 'activity', label: 'Activity', icon: Activity },
            { id: 'profile', label: 'Profile', icon: User },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as ViewMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                viewMode === tab.id
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        <AnimatePresence mode="wait">
          {/* Overview View */}
          {viewMode === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Alerts */}
              {(expiringCerts.length > 0 || overdueTasks.length > 0) && (
                <div className="space-y-2">
                  {expiringCerts.map(cert => (
                    <div 
                      key={cert.id}
                      className={`p-4 rounded-2xl flex items-center gap-3 ${
                        cert.status === 'expired' 
                          ? 'bg-red-50 border border-red-200' 
                          : 'bg-orange-50 border border-orange-200'
                      }`}
                    >
                      <AlertCircle className={`w-5 h-5 ${cert.status === 'expired' ? 'text-red-500' : 'text-orange-500'}`} />
                      <div className="flex-1">
                        <p className={`font-medium ${cert.status === 'expired' ? 'text-red-700' : 'text-orange-700'}`}>
                          {cert.name} {cert.status === 'expired' ? 'has expired' : 'expiring soon'}
                        </p>
                        <p className="text-sm text-surface-600">
                          {cert.status === 'expired' ? 'Expired' : 'Expires'}: {new Date(cert.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-surface-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* AI Safety Coach Widget */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-brand-600 to-violet-700 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl group"
              >
                <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">AI Safety Coach</h3>
                      <p className="text-xs text-brand-100 uppercase tracking-widest font-medium">Personalized Insights</p>
                    </div>
                  </div>
                  <p className="text-sm text-brand-50 leading-relaxed mb-6">
                    "John, you've completed 12 days of safe work! Based on your upcoming task in Zone B, remember to double-check your fall arrest harness. High winds are predicted for this afternoon."
                  </p>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white text-brand-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-50 transition-colors">
                      View Risk Analysis
                    </button>
                    <button className="px-4 py-2 bg-brand-500/30 backdrop-blur-md text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-500/50 transition-colors border border-white/10">
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Safety Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                {mockSafetyMetrics.map((metric, index) => (
                  <div key={index} className="bg-white p-4 rounded-2xl border border-surface-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-surface-500">{metric.label}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        metric.trend === 'up' ? 'bg-green-100 text-green-700' :
                        metric.trend === 'down' ? 'bg-red-100 text-red-700' :
                        'bg-surface-100 text-surface-600'
                      }`}>
                        {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}{metric.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-brand-900">{metric.value}{metric.unit}</p>
                  </div>
                ))}
              </div>

              {/* Today's Tasks */}
              <div className="bg-white rounded-3xl border border-surface-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-surface-100 flex items-center justify-between">
                  <h2 className="font-bold text-brand-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-600" />
                    Today's Tasks
                  </h2>
                  <button 
                    onClick={() => setViewMode('tasks')}
                    className="text-sm text-brand-600 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-surface-100">
                  {todayTasks.slice(0, 3).map(task => {
                    const TaskIcon = getTaskIcon(task.type);
                    return (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="w-full p-4 flex items-center gap-3 hover:bg-surface-50 transition-colors text-left"
                      >
                        {getStatusIcon(task.status)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-surface-900 truncate">{task.title}</p>
                          <div className="flex items-center gap-2 text-sm text-surface-500">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{task.location}</span>
                            {task.dueTime && (
                              <>
                                <span className="text-surface-300">•</span>
                                <Clock className="w-3 h-3" />
                                <span>{task.dueTime}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <SMBadge variant={getPriorityVariant(task.priority)}>{task.priority}</SMBadge>
                      </button>
                    );
                  })}
                  {todayTasks.length === 0 && (
                    <div className="p-8 text-center text-surface-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>All tasks completed for today!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-3xl border border-surface-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-surface-100 flex items-center justify-between">
                  <h2 className="font-bold text-brand-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand-600" />
                    Recent Activity
                  </h2>
                  <button 
                    onClick={() => setViewMode('activity')}
                    className="text-sm text-brand-600 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-surface-100">
                  {mockRecentActivity.slice(0, 4).map(activity => (
                    <div key={activity.id} className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-surface-100 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-surface-900 text-sm truncate">{activity.title}</p>
                        <p className="text-xs text-surface-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {activity.points && (
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                          +{activity.points} pts
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tasks View */}
          {viewMode === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
                <button className="p-3 bg-white border border-surface-200 rounded-xl hover:bg-surface-50">
                  <Filter className="w-5 h-5 text-surface-600" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {[
                  { id: 'all', label: 'All Tasks' },
                  { id: 'today', label: 'Today' },
                  { id: 'overdue', label: 'Overdue' },
                  { id: 'completed', label: 'Completed' },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setTaskFilter(filter.id as TaskFilter)}
                    className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                      taskFilter === filter.id
                        ? 'bg-brand-600 text-white'
                        : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Task List */}
              <div className="space-y-3">
                {filteredTasks.map(task => {
                  const TaskIcon = getTaskIcon(task.type);
                  return (
                    <motion.button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="w-full bg-white p-4 rounded-2xl border border-surface-100 shadow-sm hover:shadow-md transition-all text-left"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(task.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                          <SMBadge variant={getPriorityVariant(task.priority)}>{task.priority}</SMBadge>
                            <span className="text-xs text-surface-500 bg-surface-100 px-2 py-0.5 rounded-full capitalize">
                              {task.type}
                            </span>
                          </div>
                          <p className="font-medium text-surface-900">{task.title}</p>
                          <div className="flex items-center gap-3 mt-2 text-sm text-surface-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {task.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                            {task.dueTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.dueTime}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-surface-400" />
                      </div>
                    </motion.button>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <div className="bg-white p-8 rounded-2xl text-center text-surface-500">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No tasks found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Activity View */}
          {viewMode === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-3xl border border-surface-100 shadow-sm p-4">
                <h2 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Points Summary
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-surface-50 rounded-xl">
                    <p className="text-2xl font-bold text-brand-600">485</p>
                    <p className="text-xs text-surface-500">This Month</p>
                  </div>
                  <div className="text-center p-3 bg-surface-50 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">2,340</p>
                    <p className="text-xs text-surface-500">Total Points</p>
                  </div>
                  <div className="text-center p-3 bg-surface-50 rounded-xl">
                    <p className="text-2xl font-bold text-purple-600">#12</p>
                    <p className="text-xs text-surface-500">Rank</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-surface-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-surface-100">
                  <h2 className="font-bold text-brand-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand-600" />
                    Activity History
                  </h2>
                </div>
                <div className="divide-y divide-surface-100">
                  {mockRecentActivity.map(activity => (
                    <div key={activity.id} className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface-100 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-surface-900">{activity.title}</p>
                        <p className="text-sm text-surface-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {activity.points && (
                        <span className="text-sm text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">
                          +{activity.points}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Profile View */}
          {viewMode === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Certifications */}
              <div className="bg-white rounded-3xl border border-surface-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-surface-100">
                  <h2 className="font-bold text-brand-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-brand-600" />
                    My Certifications
                  </h2>
                </div>
                <div className="divide-y divide-surface-100">
                  {workerProfile.certifications.map(cert => (
                    <div key={cert.id} className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        cert.status === 'valid' ? 'bg-green-100' :
                        cert.status === 'expiring' ? 'bg-orange-100' :
                        'bg-red-100'
                      }`}>
                        {cert.status === 'valid' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : cert.status === 'expiring' ? (
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-surface-900">{cert.name}</p>
                        <p className={`text-sm ${
                          cert.status === 'valid' ? 'text-surface-500' :
                          cert.status === 'expiring' ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {cert.status === 'expired' ? 'Expired' : 'Expires'}: {new Date(cert.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                        cert.status === 'valid' ? 'bg-green-100 text-green-700' :
                        cert.status === 'expiring' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {cert.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Career Stats */}
              <div className="bg-white rounded-3xl border border-surface-100 shadow-sm p-4">
                <h2 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-600" />
                  Career Stats
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-surface-50 rounded-xl">
                    <p className="text-2xl font-bold text-brand-600">{workerProfile.tasksCompleted}</p>
                    <p className="text-sm text-surface-500">Tasks Completed</p>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">98%</p>
                    <p className="text-sm text-surface-500">On-Time Rate</p>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-xl">
                    <p className="text-2xl font-bold text-purple-600">47</p>
                    <p className="text-sm text-surface-500">Training Hours</p>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-xl">
                    <p className="text-2xl font-bold text-teal-600">23</p>
                    <p className="text-sm text-surface-500">Observations</p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-2">
                {[
                  { icon: Bell, label: 'Notification Settings', path: '/notifications' },
                  { icon: Shield, label: 'Safety Training', path: '/training' },
                  { icon: FileText, label: 'My Reports', path: '/report-dashboard' },
                  { icon: Users, label: 'Team Leaderboard', path: '/kpi-indicators' },
                ].map((link, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(link.path)}
                    className="w-full bg-white p-4 rounded-2xl border border-surface-100 flex items-center gap-3 hover:bg-surface-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                      <link.icon className="w-5 h-5 text-brand-600" />
                    </div>
                    <span className="flex-1 font-medium text-surface-900 text-left">{link.label}</span>
                    <ChevronRight className="w-5 h-5 text-surface-400" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Quick Actions FAB */}
      <button
        onClick={() => setShowQuickActions(!showQuickActions)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-700 transition-colors z-40"
      >
        <Plus className={`w-6 h-6 transition-transform ${showQuickActions ? 'rotate-45' : ''}`} />
      </button>

      {/* Quick Actions Menu */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 bg-white rounded-2xl shadow-xl border border-surface-100 overflow-hidden z-40"
          >
            {[
              { icon: AlertTriangle, label: 'Report Hazard', color: 'text-orange-500', path: '/voice-hazard' },
              { icon: Camera, label: 'Safety Observation', color: 'text-blue-500', path: '/near-miss' },
              { icon: Shield, label: 'Start JSA', color: 'text-teal-500', path: '/risk-assessment' },
              { icon: ClipboardList, label: 'Quick Inspection', color: 'text-purple-500', path: '/risk-checklists' },
            ].map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  setShowQuickActions(false);
                  navigate(action.path);
                }}
                className="w-full p-4 flex items-center gap-3 hover:bg-surface-50 transition-colors border-b border-surface-100 last:border-0"
              >
                <action.icon className={`w-5 h-5 ${action.color}`} />
                <span className="font-medium text-surface-900">{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-4"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <SMBadge variant={getPriorityVariant(selectedTask.priority)}>{selectedTask.priority} priority</SMBadge>
                  <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-surface-100 rounded-full">
                    <XCircle className="w-5 h-5 text-surface-500" />
                  </button>
                </div>
                
                <h2 className="text-xl font-bold text-brand-900 mb-2">{selectedTask.title}</h2>
                
                <div className="flex flex-wrap gap-3 mb-4 text-sm text-surface-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedTask.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedTask.dueDate).toLocaleDateString()}
                  </span>
                  {selectedTask.dueTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedTask.dueTime}
                    </span>
                  )}
                </div>
                
                {selectedTask.description && (
                  <p className="text-surface-600 mb-6">{selectedTask.description}</p>
                )}
                
                <div className="flex gap-3">
                  <SMButton variant="primary" className="flex-1">{selectedTask.status === 'in_progress' ? 'Continue Task' : 'Start Task'}</SMButton>
                  <button className="px-4 py-3 bg-surface-100 text-surface-700 rounded-xl font-medium hover:bg-surface-200 transition-colors">
                    View Details
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

export default WorkerDashboard;
