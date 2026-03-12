import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ChevronDown, ChevronRight, Plus, X, 
  MoreHorizontal, Clock, Calendar, MessageSquare, Paperclip,
  Zap, Bug, BookOpen, CheckSquare, Layers, 
  ArrowUp, ArrowDown, Minus, ExternalLink, Share2,
  BarChart3, Archive, Play, Target, GripVertical,
  TrendingDown, AlertTriangle, CheckCircle2, Timer, Flame,
  Users, Sparkles, Brain, Lightbulb, Map, Settings2,
  UserPlus, CalendarRange, GanttChartSquare, AlertCircle,
  Rocket, FileQuestion, DollarSign, Link2, Shuffle,
  ClipboardList, TrendingUp, Wand2, Scale,
  ThumbsUp, ThumbsDown, MessageCircle, RefreshCw, Calendar as CalendarIcon,
  History, Smile, Meh, Frown, Star, GitBranch, Network, Eye, Shield,
  Zap as ZapIcon, Activity, CircleAlert, Bell, HeartPulse, Gauge, Flag
} from 'lucide-react';
import { 
  INITIAL_TASKS, SPRINTS, EPICS, ProjectTask, TaskStatus, TaskPriority, IssueType, 
  Sprint, Epic, TEAM_MEMBERS, TeamMember 
} from '../data/mockProjectManagement';
import { 
  TaskDetailModal, SprintPlanningView, BacklogManagement, 
  VelocityCharts, SprintRetrospectives, ReleasePlanningView, 
  SprintSettings, WorkflowAutomation, ProjectCharter, ProjectClosure 
} from '../components/agile';
import { hapticFeedback } from '../utils/mobileFeatures';
import { useProjects, useProjectTasks } from '../api/hooks/useAPIHooks';

// --- Constants ---

const COLUMNS: { id: TaskStatus; label: string; color: string; dotColor: string; bgGradient: string; defaultWipLimit: number }[] = [
  { id: 'todo', label: 'TO DO', color: 'bg-slate-100', dotColor: 'bg-slate-400', bgGradient: 'from-slate-50 to-slate-100', defaultWipLimit: 10 },
  { id: 'in_progress', label: 'IN PROGRESS', color: 'bg-blue-50', dotColor: 'bg-blue-500', bgGradient: 'from-blue-50 to-blue-100', defaultWipLimit: 5 },
  { id: 'review', label: 'IN REVIEW', color: 'bg-purple-50', dotColor: 'bg-purple-500', bgGradient: 'from-purple-50 to-purple-100', defaultWipLimit: 3 },
  { id: 'completed', label: 'DONE', color: 'bg-green-50', dotColor: 'bg-green-500', bgGradient: 'from-green-50 to-green-100', defaultWipLimit: 0 },
];

const PRIORITY_CONFIG: Record<TaskPriority, { icon: typeof ArrowUp; color: string; label: string }> = {
  highest: { icon: ArrowUp, color: 'text-red-600', label: 'Highest' },
  high: { icon: ArrowUp, color: 'text-orange-500', label: 'High' },
  medium: { icon: Minus, color: 'text-amber-500', label: 'Medium' },
  low: { icon: ArrowDown, color: 'text-blue-500', label: 'Low' },
  lowest: { icon: ArrowDown, color: 'text-slate-400', label: 'Lowest' },
};

const ISSUE_TYPE_CONFIG: Record<IssueType, { icon: typeof Zap; color: string; bgColor: string }> = {
  epic: { icon: Zap, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  story: { icon: BookOpen, color: 'text-green-600', bgColor: 'bg-green-100' },
  task: { icon: CheckSquare, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  subtask: { icon: Layers, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  bug: { icon: Bug, color: 'text-red-600', bgColor: 'bg-red-100' },
};

const LIFECYCLE_PHASES = [
  { id: 'initiation', label: 'Initiation', icon: Flag, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { id: 'planning', label: 'Planning', icon: Map, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'execution', label: 'Execution', icon: Zap, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { id: 'monitoring', label: 'Monitoring', icon: Activity, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  { id: 'closure', label: 'Closure', icon: CheckCircle2, color: 'text-slate-600', bgColor: 'bg-slate-100' },
] as const;

type SwimLaneType = 'none' | 'assignee' | 'epic' | 'priority';
type ViewMode = 'initiation' | 'board' | 'backlog' | 'burndown' | 'roadmap' | 'capacity' | 'sprint-planning' | 'rfis' | 'gantt' | 'retrospective' | 'velocity' | 'availability' | 'risk-ai' | 'dependencies' | 'sprint-health' | 'alerts' | 'closure';

// --- Components ---

const LifecycleNavigation: React.FC<{
  currentPhase: string;
  onPhaseChange: (phase: string) => void;
}> = ({ currentPhase, onPhaseChange }) => {
  return (
    <div className="flex overflow-x-auto pb-2 mb-6 gap-2 no-scrollbar">
      {LIFECYCLE_PHASES.map((phase) => {
        const isActive = currentPhase === phase.id;
        const Icon = phase.icon;
        return (
          <button
            key={phase.id}
            onClick={() => onPhaseChange(phase.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all whitespace-nowrap relative ${
              isActive 
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : phase.bgColor}`}>
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : phase.color}`} />
            </div>
            <span className="font-semibold text-sm">{phase.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'md' }) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const colors = [
    'bg-gradient-to-br from-blue-400 to-blue-600', 
    'bg-gradient-to-br from-green-400 to-green-600', 
    'bg-gradient-to-br from-purple-400 to-purple-600', 
    'bg-gradient-to-br from-orange-400 to-orange-600', 
  ];
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-11 h-11 text-sm' };
  
  return (
    <div className={`${sizes[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-bold shadow-sm`}>
      {initials}
    </div>
  );
};

const DraggableIssueCard: React.FC<{ 
  task: ProjectTask; 
  onClick: () => void;
  epic?: Epic;
}> = ({ task, onClick, epic }) => {
  const issueType = task.issueType || 'task';
  const IssueIcon = ISSUE_TYPE_CONFIG[issueType]?.icon || CheckSquare;
  const PriorityIcon = PRIORITY_CONFIG[task.priority]?.icon || Minus;
  
  return (
    <motion.div
      layout
      layoutId={task.id}
      onClick={() => { hapticFeedback('light'); onClick(); }}
      className="bg-white p-4 rounded-2xl border border-slate-200 cursor-pointer hover:border-blue-300 active:border-blue-400 transition-all group touch-pan-y shadow-sm hover:shadow-md"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-lg ${ISSUE_TYPE_CONFIG[issueType]?.bgColor}`}>
            <IssueIcon className={`w-3.5 h-3.5 ${ISSUE_TYPE_CONFIG[issueType]?.color}`} />
          </span>
          <span className="text-xs text-slate-500 font-mono font-medium">{task.key}</span>
        </div>
        <PriorityIcon className={`w-4 h-4 ${PRIORITY_CONFIG[task.priority]?.color}`} />
      </div>
      
      {epic && (
        <div 
          className="text-[11px] px-2.5 py-1 rounded-lg font-semibold inline-block mb-2"
          style={{ backgroundColor: `${epic.color}15`, color: epic.color }}
        >
          {epic.name}
        </div>
      )}
      
      <p className="text-sm text-slate-800 font-semibold leading-snug mb-3 line-clamp-2 group-hover:text-blue-700">
        {task.title}
      </p>
      
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {task.storyPoints && (
            <span className="text-[11px] px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-bold">
              {task.storyPoints} SP
            </span>
          )}
        </div>
        <Avatar name={task.assignee} size="sm" />
      </div>
    </motion.div>
  );
};

const DroppableColumn: React.FC<{
  column: typeof COLUMNS[0];
  tasks: ProjectTask[];
  onTaskClick: (task: ProjectTask) => void;
  epics: Epic[];
}> = ({ column, tasks, onTaskClick, epics }) => {
  const getEpic = (epicId?: string) => epics.find(e => e.id === epicId);
  
  return (
    <div className="flex-1 min-w-[300px] max-w-[340px]">
      <div className={`bg-gradient-to-r ${column.bgGradient} rounded-t-2xl px-4 py-3 border-b-2 border-white/50`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${column.dotColor} shadow-sm`} />
            <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">{column.label}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60 text-slate-500">
              {tasks.length}
            </span>
          </div>
        </div>
      </div>
      
      <div className={`bg-gradient-to-b ${column.bgGradient} rounded-b-2xl p-3 min-h-[500px] space-y-3`}>
        <AnimatePresence>
          {tasks.map(task => (
            <DraggableIssueCard 
              key={task.id} 
              task={task} 
              onClick={() => onTaskClick(task)}
              epic={getEpic(task.epicId)}
            />
          ))}
        </AnimatePresence>
        
        <button className="w-full p-3 min-h-[48px] text-sm text-slate-400 hover:text-slate-600 bg-white/40 hover:bg-white/70 rounded-xl transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          Create issue
        </button>
      </div>
    </div>
  );
};

// --- Main Component ---

export const JiraBoard: React.FC = () => {
  const [tasks, setTasks] = useState<ProjectTask[]>(INITIAL_TASKS);
  const [lifecyclePhase, setLifecyclePhase] = useState<string>('execution');
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(SPRINTS.find(s => s.status === 'active') || null);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);

  // ── Real API Data ──────────────────────────────────────────────────────────
  const { data: backendProjects } = useProjects();
  const firstProjectId: number | null = backendProjects && (backendProjects as any[]).length > 0
    ? Number((backendProjects as any[])[0].id || (backendProjects as any[])[0].projectId) || null
    : null;
  const { data: backendTasks } = useProjectTasks(firstProjectId);

  useEffect(() => {
    if (backendTasks && (backendTasks as any[]).length > 0) {
      const converted: ProjectTask[] = (backendTasks as any[]).map((t: any) => ({
        id: String(t.id || t.taskId),
        key: t.key || `SAFE-${String(t.id || t.taskId).padStart(3, '0')}`,
        title: t.title,
        description: t.description || '',
        issueType: (t.issueType || 'task') as IssueType,
        status: t.status === 'done' ? 'completed' : t.status === 'in_progress' ? 'in_progress' : t.status === 'review' ? 'review' : t.status === 'backlog' ? 'backlog' : 'todo',
        priority: (t.priority || 'medium') as TaskPriority,
        assignee: t.assignee || '',
        reporter: '',
        sprintId: activeSprint?.id || '',
        storyPoints: t.storyPoints || 1,
        labels: t.labels || [],
        tags: [],
        epicId: t.epicId || '',
        comments: t.comments || [],
        attachments: t.attachments || [],
        components: [],
        watchers: [],
        linkedIssues: [],
        activityLog: [],
        createdAt: t.createdAt ? (typeof t.createdAt === 'number' ? new Date(t.createdAt).toISOString() : String(t.createdAt)) : new Date().toISOString(),
        updatedAt: t.updatedAt ? (typeof t.updatedAt === 'number' ? new Date(t.updatedAt).toISOString() : String(t.updatedAt)) : new Date().toISOString(),
        dueDate: t.dueDate || '',
      }));
      const existingIds = new Set(INITIAL_TASKS.map(t => t.id));
      const newTasks = converted.filter(c => !existingIds.has(c.id));
      if (newTasks.length > 0) {
        setTasks(prev => [...prev, ...newTasks]);
      }
    }
  }, [backendTasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhaseChange = (phase: string) => {
    setLifecyclePhase(phase);
    switch (phase) {
      case 'initiation': setViewMode('initiation'); break;
      case 'planning': setViewMode('roadmap'); break;
      case 'execution': setViewMode('board'); break;
      case 'monitoring': setViewMode('burndown'); break;
      case 'closure': setViewMode('closure'); break;
    }
  };

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => t.status !== 'backlog');
    if (activeSprint) {
      result = result.filter(t => t.sprintId === activeSprint.id);
    }
    return result;
  }, [tasks, activeSprint]);

  const getColumnTasks = (status: TaskStatus) => filteredTasks.filter(t => t.status === status);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-slate-100" style={{ paddingTop: 'env(safe-area-inset-top)' }}>

      
      <div className="pt-20 pb-8 px-4" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
        <LifecycleNavigation currentPhase={lifecyclePhase} onPhaseChange={handlePhaseChange} />
        
        <div className="mb-6 flex items-center gap-4">
          <img src="/logo.png" alt="SafetyMEG" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">SafetyMEG Project Management</h1>
            <p className="text-slate-500">Manage sprints, tasks, and safety initiatives</p>
          </div>
        </div>

        {/* View mode tabs - Filtered by Phase */}
        {lifecyclePhase !== 'initiation' && lifecyclePhase !== 'closure' && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4">
            {[
              // Planning
              { id: 'roadmap', label: 'Roadmap', icon: GanttChartSquare, phase: 'planning' },
              { id: 'backlog', label: 'Backlog', icon: Archive, phase: 'planning' },
              { id: 'sprint-planning', label: 'Sprint Plan', icon: Rocket, phase: 'planning' },
              { id: 'capacity', label: 'Capacity', icon: Users, phase: 'planning' },
              
              // Execution
              { id: 'board', label: 'Board', icon: BarChart3, phase: 'execution' },
              { id: 'rfis', label: 'RFIs', icon: FileQuestion, phase: 'execution' },
              { id: 'dependencies', label: 'Dependencies', icon: GitBranch, phase: 'execution' },
              
              // Monitoring
              { id: 'burndown', label: 'Burndown', icon: TrendingDown, phase: 'monitoring' },
              { id: 'velocity', label: 'Velocity', icon: TrendingUp, phase: 'monitoring' },
              { id: 'gantt', label: 'Gantt', icon: GanttChartSquare, phase: 'monitoring' },
              { id: 'risk-ai', label: 'Risk AI', icon: Brain, phase: 'monitoring' },
              { id: 'retrospective', label: 'Retro', icon: History, phase: 'monitoring' },
            ]
            .filter(mode => mode.phase === lifecyclePhase)
            .map(mode => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => { setViewMode(mode.id as ViewMode); hapticFeedback('light'); }}
                  className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl font-semibold text-sm whitespace-nowrap snap-start transition-all ${
                    viewMode === mode.id
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-white text-slate-600 border border-slate-200 active:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {mode.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Views */}
        {viewMode === 'initiation' && <ProjectCharter />}
        {viewMode === 'closure' && <ProjectClosure />}
        
        {viewMode === 'board' && (
          <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
            {COLUMNS.map(column => (
              <div key={column.id} className="snap-start">
                <DroppableColumn
                  column={column}
                  tasks={getColumnTasks(column.id)}
                  onTaskClick={setSelectedTask}
                  epics={EPICS}
                />
              </div>
            ))}
          </div>
        )}

        {viewMode === 'backlog' && (
          <BacklogManagement 
            tasks={tasks} 
            onTaskUpdate={() => {}} 
            onOpenTask={setSelectedTask}
            onMoveToSprint={() => {}}
          />
        )}

        {viewMode === 'sprint-planning' && (
          <SprintPlanningView 
            tasks={tasks} 
            onTaskUpdate={() => {}} 
            onOpenTask={setSelectedTask}
          />
        )}

        {viewMode === 'roadmap' && (
          <ReleasePlanningView />
        )}

        {viewMode === 'retrospective' && (
          <SprintRetrospectives />
        )}

        {viewMode === 'velocity' && (
          <VelocityCharts tasks={tasks} />
        )}

        {viewMode === 'risk-ai' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Brain className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Project Risk AI</h2>
                    <p className="text-slate-400 text-sm">Standard-Aligned Predictive Risk Analysis</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">OSHA Compliance</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-emerald-400">96%</span>
                      <span className="text-[10px] text-slate-500 mb-1">High</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">ISO 45001 Score</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-blue-400">92%</span>
                      <span className="text-[10px] text-slate-500 mb-1">Certified</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">EPA RMP Status</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-purple-400">Active</span>
                      <span className="text-[10px] text-slate-500 mb-1">Synced</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-black/20 backdrop-blur-xl rounded-3xl border border-white/5">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    AI Risk Forecast
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    AI analysis of current sprint tasks indicates a potential bottleneck in the "Safety Guard Installation" epic, which could impact **OSHA 1910.212** compliance. We recommend reallocating resources from the "Documentation" task to ensure timely completion.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-soft">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Regulatory Risks
                </h3>
                <div className="space-y-4">
                  {[
                    { standard: 'OSHA 1926.451', risk: 'High', status: 'Action Required' },
                    { standard: 'ISO 45001 Clause 8.1', risk: 'Medium', status: 'Monitoring' },
                    { standard: 'EPA 40 CFR 68', risk: 'Low', status: 'Compliant' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm font-bold text-slate-700">{item.standard}</span>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase ${item.risk === 'High' ? 'text-red-500' : item.risk === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>{item.risk} Risk</span>
                        <span className="text-[10px] text-slate-500 font-bold">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-soft">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-brand-600" />
                  AI Mitigation Strategies
                </h3>
                <div className="space-y-3">
                  {[
                    "Implement real-time PPE detection for high-risk tasks.",
                    "Automate ISO 45001 audit trail for all sprint changes.",
                    "Sync EPA RMP data with local emergency response teams.",
                  ].map((strategy, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-brand-50/50 rounded-xl border border-brand-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                      <p className="text-xs text-slate-700 leading-relaxed">{strategy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other views */}
        {['burndown', 'capacity', 'rfis', 'gantt', 'availability', 'dependencies', 'sprint-health', 'alerts'].includes(viewMode) && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wand2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Coming Soon</h3>
            <p className="text-slate-500 mt-2">This view is currently under development.</p>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailModal 
            task={selectedTask} 
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)} 
            onUpdate={(updatedTask) => setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))}
            allTasks={tasks}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
