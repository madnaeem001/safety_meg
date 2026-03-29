import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Home,
  ClipboardList,
  AlertTriangle,
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  User,
  Bell,
  Settings,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Calendar,
  FileText,
  HardHat,
  Wrench,
  Shield,
  Zap,
  RefreshCw,
  Upload,
  Download,
  Mic,
  Image,
  Send,
  Menu,
  X,
  Activity,
  ThermometerSun,
  Wind,
  Droplets,
  Eye,
  MessageSquare,
  Phone,
  QrCode,
  Scan,
  Smartphone,
  Cloud,
  CloudOff
} from 'lucide-react';
import {
  useWorkerTasks,
  useWorkerTaskStats,
  useSeedWorkerTasks,
  useUpdateWorkerTaskStatus,
  useToggleChecklistItem,
  useWorkerReports,
  useCreateWorkerReport,
  useWorkerEnvironmental,
} from '../api/hooks/useAPIHooks';

// Types
interface Task {
  id: string;
  title: string;
  type: 'inspection' | 'maintenance' | 'safety_check' | 'permit' | 'training';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  location: string;
  dueTime: string;
  assignedBy: string;
  description: string;
  checklist?: ChecklistItem[];
  syncStatus: 'synced' | 'pending' | 'failed';
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  required: boolean;
}

interface QuickReport {
  id: string;
  type: 'hazard' | 'near_miss' | 'unsafe_condition' | 'suggestion';
  title: string;
  description: string;
  location: string;
  photo?: string;
  timestamp: string;
  syncStatus: 'synced' | 'pending' | 'failed';
}

interface EnvironmentalReading {
  type: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'danger';
  icon: React.ElementType;
}

// Mock Data
const mockTasks: Task[] = [
  {
    id: 'TASK-001',
    title: 'Pre-shift Safety Inspection',
    type: 'inspection',
    priority: 'high',
    status: 'pending',
    location: 'Production Floor A',
    dueTime: '08:00 AM',
    assignedBy: 'Safety Manager',
    description: 'Complete daily pre-shift safety walkthrough',
    checklist: [
      { id: 'C1', text: 'Check emergency exits are clear', completed: false, required: true },
      { id: 'C2', text: 'Verify fire extinguishers are accessible', completed: false, required: true },
      { id: 'C3', text: 'Inspect PPE storage area', completed: false, required: true },
      { id: 'C4', text: 'Check first aid kit supplies', completed: false, required: false },
      { id: 'C5', text: 'Review safety board postings', completed: false, required: false }
    ],
    syncStatus: 'synced'
  },
  {
    id: 'TASK-002',
    title: 'Forklift Daily Inspection',
    type: 'maintenance',
    priority: 'high',
    status: 'pending',
    location: 'Warehouse B',
    dueTime: '08:30 AM',
    assignedBy: 'Maintenance Lead',
    description: 'Complete forklift FL-003 daily inspection checklist',
    checklist: [
      { id: 'C1', text: 'Check fluid levels', completed: false, required: true },
      { id: 'C2', text: 'Inspect tires and wheels', completed: false, required: true },
      { id: 'C3', text: 'Test horn and lights', completed: false, required: true },
      { id: 'C4', text: 'Check brake operation', completed: false, required: true },
      { id: 'C5', text: 'Inspect forks for damage', completed: false, required: true }
    ],
    syncStatus: 'synced'
  },
  {
    id: 'TASK-003',
    title: 'Hot Work Permit Verification',
    type: 'permit',
    priority: 'critical',
    status: 'in_progress',
    location: 'Welding Bay 2',
    dueTime: '09:00 AM',
    assignedBy: 'Safety Officer',
    description: 'Verify hot work permit conditions before welding begins',
    syncStatus: 'synced'
  },
  {
    id: 'TASK-004',
    title: 'Toolbox Talk - Fall Protection',
    type: 'training',
    priority: 'medium',
    status: 'pending',
    location: 'Break Room',
    dueTime: '10:00 AM',
    assignedBy: 'Training Coordinator',
    description: 'Conduct 15-minute toolbox talk on fall protection requirements',
    syncStatus: 'pending'
  },
  {
    id: 'TASK-005',
    title: 'Scaffolding Inspection',
    type: 'safety_check',
    priority: 'high',
    status: 'pending',
    location: 'West Wing Exterior',
    dueTime: '11:00 AM',
    assignedBy: 'Site Supervisor',
    description: 'Daily scaffolding inspection before work at height',
    syncStatus: 'synced'
  }
];

const mockReports: QuickReport[] = [
  {
    id: 'RPT-001',
    type: 'hazard',
    title: 'Wet floor near entrance',
    description: 'Water leak from ceiling causing slippery surface',
    location: 'Building A - Main Entrance',
    timestamp: '2026-02-06T07:45:00Z',
    syncStatus: 'synced'
  },
  {
    id: 'RPT-002',
    type: 'near_miss',
    title: 'Forklift near-miss with pedestrian',
    description: 'Forklift operator had to brake suddenly to avoid pedestrian at intersection',
    location: 'Warehouse B - Aisle 4',
    timestamp: '2026-02-05T14:30:00Z',
    syncStatus: 'synced'
  }
];

const environmentalIconMap: Record<string, React.ElementType> = {
  'Temperature': ThermometerSun,
  'Humidity':    Droplets,
  'Noise Level': Activity,
  'Air Quality': Wind,
};

const FALLBACK_ENVIRONMENTAL: EnvironmentalReading[] = [
  { type: 'Temperature', value: 24, unit: '°C', status: 'normal',  icon: ThermometerSun },
  { type: 'Humidity',    value: 65, unit: '%',  status: 'normal',  icon: Droplets },
  { type: 'Noise Level', value: 78, unit: 'dB', status: 'warning', icon: Activity },
  { type: 'Air Quality', value: 42, unit: 'AQI', status: 'normal', icon: Wind },
];

// Config
const priorityConfig = {
  low: { color: 'bg-green-100 text-green-700', label: 'Low' },
  medium: { color: 'bg-yellow-100 text-yellow-700', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-700', label: 'High' },
  critical: { color: 'bg-danger/10 text-danger', label: 'Critical' }
};

const taskTypeConfig = {
  inspection: { icon: Eye, color: 'bg-blue-500' },
  maintenance: { icon: Wrench, color: 'bg-purple-500' },
  safety_check: { icon: Shield, color: 'bg-green-500' },
  permit: { icon: FileText, color: 'bg-orange-500' },
  training: { icon: HardHat, color: 'bg-amber-500' }
};

const reportTypeConfig = {
  hazard: { icon: AlertTriangle, color: 'bg-red-500', label: 'Hazard' },
  near_miss: { icon: Eye, color: 'bg-orange-500', label: 'Near Miss' },
  unsafe_condition: { icon: Shield, color: 'bg-yellow-500', label: 'Unsafe Condition' },
  suggestion: { icon: MessageSquare, color: 'bg-blue-500', label: 'Suggestion' }
};

type ViewMode = 'home' | 'tasks' | 'report' | 'task_detail' | 'profile' | 'environmental';

export const MobileWorkerApp: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [isOnline, setIsOnline] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showQuickReport, setShowQuickReport] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [environmentalReadings, setEnvironmentalReadings] =
    useState<EnvironmentalReading[]>(FALLBACK_ENVIRONMENTAL);

  // ── Backend hooks ────────────────────────────────────────────────────────
  const { data: tasksData, loading: tasksLoading, refetch: refetchTasks } = useWorkerTasks();
  const { data: reportsData, refetch: refetchReports }                    = useWorkerReports();
  const { data: envData }                                                  = useWorkerEnvironmental();
  const { mutate: seedMutate }               = useSeedWorkerTasks();
  const { mutate: updateStatusMutate }       = useUpdateWorkerTaskStatus();
  const { mutate: toggleChecklistMutate }    = useToggleChecklistItem();
  const { mutate: createReportMutate }       = useCreateWorkerReport();

  const tasks: Task[]          = (tasksData  ?? []) as Task[];
  const reports: QuickReport[] = (reportsData ?? []) as QuickReport[];
  const pendingSyncCount       = tasks.filter(t => t.syncStatus === 'pending').length;

  // Merge environmental values from backend, keep icon mapping in frontend
  useEffect(() => {
    if (envData && Array.isArray(envData) && envData.length > 0) {
      setEnvironmentalReadings(
        (envData as Array<{ type: string; value: number; unit: string; status: 'normal' | 'warning' | 'danger' }>)
          .map(r => ({ ...r, icon: environmentalIconMap[r.type] ?? Activity }))
      );
    }
  }, [envData]);

  // Seed default tasks on first load for this user
  useEffect(() => {
    if (!tasksLoading && tasks.length === 0) {
      seedMutate(undefined).then(() => refetchTasks());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksLoading]);

  // Keep selectedTask in sync with refreshed tasks list
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated as Task);
    }
  }, [tasks]);

  // Online/offline events
  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update clock every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleChecklistItem = async (taskId: string, itemId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const item = task?.checklist?.find(i => i.id === itemId);
    if (!item) return;
    await toggleChecklistMutate({ taskId, itemId, completed: !item.completed });
    refetchTasks();
  };

  const completeTask = async (taskId: string) => {
    await updateStatusMutate({ taskId, status: 'completed' });
    await refetchTasks();
    setSelectedTask(null);
    setViewMode('home');
  };

  const handleQuickReportType = async (type: QuickReport['type']) => {
    const titleMap: Record<QuickReport['type'], string> = {
      hazard:           'Hazard Identified',
      near_miss:        'Near Miss Reported',
      unsafe_condition: 'Unsafe Condition Noted',
      suggestion:       'Safety Suggestion',
    };
    await createReportMutate(
      { type, title: titleMap[type], description: '', location: 'Field' }
    );
    refetchReports();
    setShowQuickReport(false);
  };

  const renderStatusBar = () => (
    <div className="fixed top-0 left-0 right-0 z-50 bg-surface-900 text-white px-4 py-2 flex items-center justify-between text-xs safe-area-top">
      <span className="font-medium">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      <div className="flex items-center gap-3">
        {pendingSyncCount > 0 && (
          <span className="flex items-center gap-1 text-amber-400">
            <Cloud className="w-3 h-3" />
            {pendingSyncCount}
          </span>
        )}
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-400" />
        )}
        <Signal className="w-4 h-4" />
        <Battery className="w-4 h-4" />
      </div>
    </div>
  );

  const renderHome = () => {
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const completedToday = tasks.filter(t => t.status === 'completed').length;
    
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-80">Good morning,</p>
              <h2 className="text-xl font-bold">John Worker</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-white/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{pendingTasks.length}</p>
              <p className="text-xs opacity-80">Pending</p>
            </div>
            <div className="flex-1 bg-white/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{completedToday}</p>
              <p className="text-xs opacity-80">Completed</p>
            </div>
            <div className="flex-1 bg-white/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs opacity-80">Overdue</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: AlertTriangle, label: 'Report', color: 'bg-red-500', action: () => setShowQuickReport(true) },
            { icon: Camera, label: 'Photo', color: 'bg-blue-500', action: () => {} },
            { icon: QrCode, label: 'Scan', color: 'bg-purple-500', action: () => {} },
            { icon: Mic, label: 'Voice', color: 'bg-green-500', action: () => {} }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.95 }}
                onClick={item.action}
                className="flex flex-col items-center gap-2 p-4 bg-surface-raised rounded-2xl shadow-sm border border-surface-border"
              >
                <div className={`p-3 rounded-xl ${item.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-text-secondary">{item.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
            <CloudOff className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-800 dark:text-amber-200">Working Offline</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">{pendingSyncCount} items pending sync</p>
            </div>
            <button className="p-2 bg-amber-200 dark:bg-amber-800 rounded-lg">
              <RefreshCw className="w-4 h-4 text-amber-700 dark:text-amber-300" />
            </button>
          </div>
        )}

        {/* Environmental Readings */}
        <div className="bg-surface-raised rounded-2xl shadow-sm border border-surface-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Environmental</h3>
            <button 
              onClick={() => setViewMode('environmental')}
              className="text-xs text-brand-600"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {environmentalReadings.slice(0, 4).map((reading) => {
              const Icon = reading.icon;
              return (
                <div 
                  key={reading.type} 
                  className={`p-3 rounded-xl ${
                    reading.status === 'danger' ? 'bg-red-50 dark:bg-red-900/20' :
                    reading.status === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' :
                    'bg-surface-overlay'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${
                      reading.status === 'danger' ? 'text-red-500' :
                      reading.status === 'warning' ? 'text-amber-500' :
                      'text-text-muted'
                    }`} />
                    <span className="text-xs text-text-muted">{reading.type}</span>
                  </div>
                  <p className={`text-lg font-bold ${
                    reading.status === 'danger' ? 'text-red-600' :
                    reading.status === 'warning' ? 'text-amber-600' :
                    'text-text-primary'
                  }`}>
                    {reading.value}{reading.unit}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-surface-raised rounded-2xl shadow-sm border border-surface-border">
          <div className="p-4 border-b border-surface-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">Today's Tasks</h3>
              <button 
                onClick={() => setViewMode('tasks')}
                className="text-xs text-brand-600 flex items-center gap-1"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-700">
            {pendingTasks.slice(0, 3).map((task) => {
              const typeConf = taskTypeConfig[task.type];
              const prioConf = priorityConfig[task.priority];
              const TypeIcon = typeConf.icon;
              
              return (
                <motion.button
                  key={task.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedTask(task);
                    setViewMode('task_detail');
                  }}
                  className="w-full p-4 flex items-center gap-4 text-left active:bg-surface-overlay"
                >
                  <div className={`p-3 rounded-xl ${typeConf.color}`}>
                    <TypeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-text-primary truncate">{task.title}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${prioConf.color}`}>
                        {prioConf.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {task.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.dueTime}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderTasks = () => (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'Pending', 'In Progress', 'Completed'].map((filter) => (
          <button
            key={filter}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'All' 
                ? 'bg-brand-500 text-white' 
                : 'bg-surface-overlay text-text-muted'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const typeConf = taskTypeConfig[task.type];
          const prioConf = priorityConfig[task.priority];
          const TypeIcon = typeConf.icon;
          
          return (
            <motion.button
              key={task.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedTask(task);
                setViewMode('task_detail');
              }}
              className="w-full bg-surface-raised rounded-2xl shadow-sm border border-surface-border p-4 text-left active:bg-surface-overlay"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${typeConf.color}`}>
                  <TypeIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-primary">{task.title}</span>
                    {task.syncStatus === 'pending' && (
                      <Cloud className="w-3 h-3 text-amber-500" />
                    )}
                  </div>
                  <p className="text-sm text-text-muted mb-2">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${prioConf.color}`}>
                      {prioConf.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <MapPin className="w-3 h-3" />
                      {task.location}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock className="w-3 h-3" />
                      {task.dueTime}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 text-xs rounded-lg ${
                    task.status === 'completed' ? 'bg-green-100 text-green-700' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const renderTaskDetail = () => {
    if (!selectedTask) return null;
    
    const typeConf = taskTypeConfig[selectedTask.type];
    const prioConf = priorityConfig[selectedTask.priority];
    const TypeIcon = typeConf.icon;
    const completedItems = selectedTask.checklist?.filter(i => i.completed).length || 0;
    const totalItems = selectedTask.checklist?.length || 0;
    
    return (
      <div className="space-y-4">
        {/* Task Header */}
        <div className="bg-surface-raised rounded-2xl shadow-sm border border-surface-border p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-4 rounded-xl ${typeConf.color}`}>
              <TypeIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-text-primary">{selectedTask.title}</h2>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2 py-0.5 text-xs rounded-full ${prioConf.color}`}>
                  {prioConf.label} Priority
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  selectedTask.status === 'completed' ? 'bg-green-100 text-green-700' :
                  selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {selectedTask.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-text-muted">{selectedTask.description}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-surface-border">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <MapPin className="w-4 h-4" />
              {selectedTask.location}
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Clock className="w-4 h-4" />
              Due: {selectedTask.dueTime}
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <User className="w-4 h-4" />
              {selectedTask.assignedBy}
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              {selectedTask.syncStatus === 'synced' ? (
                <>
                  <Cloud className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Synced</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-600">Pending</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Checklist */}
        {selectedTask.checklist && (
          <div className="bg-surface-raised rounded-2xl shadow-sm border border-surface-border">
            <div className="p-4 border-b border-surface-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-text-primary">Checklist</h3>
                <span className="text-sm text-text-muted">{completedItems}/{totalItems} completed</span>
              </div>
              <div className="mt-2 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {selectedTask.checklist.map((item) => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleChecklistItem(selectedTask.id, item.id)}
                  className="w-full p-4 flex items-center gap-4 text-left active:bg-surface-overlay"
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    item.completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-surface-border'
                  }`}>
                    {item.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm ${item.completed ? 'text-text-muted line-through' : 'text-text-secondary'}`}>
                      {item.text}
                    </span>
                    {item.required && !item.completed && (
                      <span className="ml-2 text-xs text-red-500">Required</span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center gap-2 p-4 bg-surface-raised rounded-2xl shadow-sm border border-surface-border">
            <Camera className="w-6 h-6 text-blue-500" />
            <span className="text-xs text-text-muted">Add Photo</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-surface-raised rounded-2xl shadow-sm border border-surface-border">
            <MessageSquare className="w-6 h-6 text-green-500" />
            <span className="text-xs text-text-muted">Add Note</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-surface-raised rounded-2xl shadow-sm border border-surface-border">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <span className="text-xs text-text-muted">Flag Issue</span>
          </button>
        </div>

        {/* Complete Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => completeTask(selectedTask.id)}
          disabled={selectedTask.checklist?.some(i => i.required && !i.completed)}
          className={`w-full py-4 rounded-2xl font-medium text-white flex items-center justify-center gap-2 ${
            selectedTask.checklist?.some(i => i.required && !i.completed)
              ? 'bg-surface-300 dark:bg-surface-600 cursor-not-allowed'
              : 'bg-green-500 active:bg-green-600'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          Complete Task
        </motion.button>
      </div>
    );
  };

  const renderQuickReportModal = () => (
    <AnimatePresence>
      {showQuickReport && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-end"
          onClick={() => setShowQuickReport(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-surface-overlay rounded-t-3xl p-6 safe-area-bottom"
          >
            <div className="w-12 h-1 bg-surface-300 dark:bg-surface-600 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-bold text-text-primary mb-4">Quick Report</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {Object.entries(reportTypeConfig).map(([key, conf]) => {
                const Icon = conf.icon;
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickReportType(key as QuickReport['type'])}
                    className="p-4 bg-surface-overlay rounded-xl flex flex-col items-center gap-2"
                  >
                    <div className={`p-3 rounded-xl ${conf.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-secondary">{conf.label}</span>
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={() => setShowQuickReport(false)}
              className="w-full py-3 bg-surface-overlay rounded-xl text-text-muted font-medium"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-surface-raised border-t border-surface-border safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {[
          { icon: Home, label: 'Home', view: 'home' as ViewMode },
          { icon: ClipboardList, label: 'Tasks', view: 'tasks' as ViewMode },
          { icon: Plus, label: 'Report', view: null, action: () => setShowQuickReport(true) },
          { icon: Bell, label: 'Alerts', view: 'home' as ViewMode },
          { icon: User, label: 'Profile', view: 'profile' as ViewMode }
        ].map((item, idx) => {
          const Icon = item.icon;
          const isActive = viewMode === item.view;
          const isCenter = idx === 2;
          
          return (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.9 }}
              onClick={() => item.action ? item.action() : item.view && setViewMode(item.view)}
              className={`flex flex-col items-center gap-1 p-2 min-w-[64px] ${
                isCenter ? '' : ''
              }`}
            >
              {isCenter ? (
                <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center -mt-6 shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <Icon className={`w-6 h-6 ${isActive ? 'text-brand-500' : 'text-text-muted'}`} />
              )}
              <span className={`text-xs ${isActive ? 'text-accent font-medium' : 'text-text-muted'}`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const getViewTitle = () => {
    switch (viewMode) {
      case 'tasks': return 'My Tasks';
      case 'task_detail': return selectedTask?.title || 'Task Details';
      case 'environmental': return 'Environmental';
      case 'profile': return 'Profile';
      default: return '';
    }
  };

  return (
    <div className="page-wrapper">
      {renderStatusBar()}
      
      {/* Header */}
      <div className="sticky top-8 z-40 bg-surface-base px-4 py-3">
        <div className="flex items-center justify-between">
          {viewMode !== 'home' ? (
            <button
              onClick={() => {
                if (viewMode === 'task_detail') {
                  setSelectedTask(null);
                  setViewMode('tasks');
                } else {
                  setViewMode('home');
                }
              }}
              className="p-2 -ml-2 active:bg-surface-200 dark:active:bg-surface-700 rounded-xl"
            >
              <ArrowLeft className="w-6 h-6 text-text-secondary" />
            </button>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 active:bg-surface-200 dark:active:bg-surface-700 rounded-xl"
            >
              <ArrowLeft className="w-6 h-6 text-text-secondary" />
            </button>
          )}
          
          <h1 className="page-title">
            {getViewTitle() || 'Mobile Worker'}
          </h1>
          
          <button className="p-2 -mr-2 active:bg-surface-200 dark:active:bg-surface-700 rounded-xl relative">
            <Bell className="w-6 h-6 text-text-secondary" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-24 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'home' && renderHome()}
            {viewMode === 'tasks' && renderTasks()}
            {viewMode === 'task_detail' && renderTaskDetail()}
          </motion.div>
        </AnimatePresence>
      </div>

      {renderBottomNav()}
      {renderQuickReportModal()}
    </div>
  );
};

export default MobileWorkerApp;
