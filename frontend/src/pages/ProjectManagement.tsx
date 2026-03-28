import React, { useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { INITIAL_TASKS, EPICS, ProjectTask, TaskStatus, TaskPriority, Milestone, IssueType, Epic, ScheduleTask, RFI } from '../data/mockProjectManagement';
import { Calendar, FileText, Clock, AlertCircle, CheckCircle2, ArrowUpRight, Plus, X, User, ListTodo, Loader2, MoreVertical, Trash2, Search, Filter, Target, Flag, GripVertical, Zap, Bug, BookOpen, CheckSquare, Layers, Eye, Play, Archive, BarChart3, Brain } from 'lucide-react';
import { hapticFeedback } from '../utils/mobileFeatures';
import { TaskDetailModal, SprintPlanningView, BacklogManagement, VelocityCharts, SprintRetrospectives, ReleasePlanningView, SprintSettings, WorkflowAutomation } from '../components/agile';
import { Repeat, Settings, Workflow, Package } from 'lucide-react';
import { PhotoUpload } from '../components/safety/PhotoUpload';
import { AIMalwareSecurity } from '../components/safety/AIMalwareSecurity';
import { RealTimeThreatAlerts } from '../components/safety/RealTimeThreatAlerts';
import { useProjects, useProjectTasks, useCreateProjectTask, useUpdateProjectTask, useProjectEpics, useProjectMilestones, useProjectRFI, useProjectSchedule } from '../api/hooks/useAPIHooks';

// Map backend status to frontend TaskStatus
const BACKEND_TO_FRONTEND_STATUS: Record<string, TaskStatus> = {
  todo: 'todo', in_progress: 'in_progress', completed: 'completed', blocked: 'review',
};
// Map frontend TaskStatus to backend status
const FRONTEND_TO_BACKEND_STATUS: Record<TaskStatus, string> = {
  backlog: 'todo', todo: 'todo', in_progress: 'in_progress', review: 'in_progress', completed: 'completed',
};
import { SecurityIncidentResponse } from '../components/safety/SecurityIncidentResponse';

// Task status columns configuration
const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'bg-slate-50 border-slate-200' },
  { id: 'todo', label: 'To Do', color: 'bg-surface-100 border-surface-200' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50 border-blue-100' },
  { id: 'review', label: 'In Review', color: 'bg-purple-50 border-purple-100' },
  { id: 'completed', label: 'Done', color: 'bg-emerald-50 border-emerald-100' },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  highest: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  lowest: 'bg-slate-100 text-slate-700 border-slate-200',
};

const ISSUE_TYPE_ICONS: Record<IssueType, { icon: typeof Target; color: string }> = {
  epic: { icon: Zap, color: 'text-purple-600 bg-purple-50' },
  story: { icon: BookOpen, color: 'text-green-600 bg-green-50' },
  task: { icon: CheckSquare, color: 'text-blue-600 bg-blue-50' },
  subtask: { icon: Layers, color: 'text-cyan-600 bg-cyan-50' },
  bug: { icon: Bug, color: 'text-red-600 bg-red-50' },
};

const MILESTONE_STATUS_COLORS = {
  pending: 'bg-surface-100 text-surface-600 border-surface-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

interface DraggableTaskCardProps {
  task: ProjectTask;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onOpen: (task: ProjectTask) => void;
  isDragging?: boolean;
  epics?: Epic[];
}

const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({ task, onStatusChange, onDelete, onOpen, isDragging, epics = EPICS }) => {
  const [showMenu, setShowMenu] = useState(false);
  const issueType = task.issueType || 'task';
  const IssueIcon = ISSUE_TYPE_ICONS[issueType]?.icon || CheckSquare;
  const epic = task.epicId ? epics.find(e => e.id === task.epicId) : null;
  
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle') || (e.target as HTMLElement).closest('.menu-button')) return;
    hapticFeedback('light');
    onOpen(task);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.8 : 1, y: 0, scale: isDragging ? 1.02 : 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white p-4 rounded-2xl shadow-soft border border-surface-100 cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg ring-2 ring-brand-300' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="drag-handle cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-surface-50 touch-none">
            <GripVertical className="w-4 h-4 text-surface-300" />
          </div>
          <span className={`p-1 rounded ${ISSUE_TYPE_ICONS[issueType]?.color || 'text-blue-600 bg-blue-50'}`}>
            <IssueIcon className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-mono text-surface-500">{task.key || task.id}</span>
        </div>
        <div className="relative menu-button">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 rounded-lg hover:bg-surface-50 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-surface-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 bg-white rounded-xl shadow-lg border border-surface-100 py-1 z-10 min-w-[120px]">
              <button 
                onClick={(e) => { e.stopPropagation(); onOpen(task); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm text-surface-700 hover:bg-surface-50 flex items-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" /> View
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Epic badge */}
      {epic && (
        <div 
          className="text-[10px] px-2 py-0.5 rounded-full font-medium inline-block mb-2"
          style={{ backgroundColor: `${epic.color}15`, color: epic.color }}
        >
          {epic.name}
        </div>
      )}
      
      <h4 className="font-semibold text-brand-900 text-sm mb-2 line-clamp-2">{task.title}</h4>
      
      <div className="flex items-center justify-between text-[10px] mt-3">
        <div className="flex items-center gap-2">
          <span className={`px-1.5 py-0.5 rounded border font-bold ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority.charAt(0).toUpperCase()}
          </span>
          {task.storyPoints && (
            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-bold">
              {task.storyPoints}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-surface-400">
            <User className="w-3 h-3" />
            {task.assignee.split(' ')[0]}
          </div>
        </div>
      </div>
      
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.labels.slice(0, 2).map(label => (
            <span key={label} className="text-[9px] px-1.5 py-0.5 bg-surface-50 text-surface-500 rounded-md">
              {label}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: Partial<ProjectTask>) => void;
  epics?: Epic[];
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAdd, epics = EPICS }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [issueType, setIssueType] = useState<IssueType>('task');
  const [dueDate, setDueDate] = useState('');
  const [storyPoints, setStoryPoints] = useState<string>('');
  const [epicId, setEpicId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    hapticFeedback('success');
    onAdd({
      title,
      description,
      assignee: assignee || 'Unassigned',
      reporter: 'Current User',
      priority,
      issueType,
      status: 'todo',
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      storyPoints: storyPoints ? parseInt(storyPoints) : undefined,
      epicId: epicId || undefined,
      labels: [],
      components: [],
      watchers: [],
      linkedIssues: [],
      attachments: [],
      comments: [],
      activityLog: [],
      tags: []
    });
    
    setTitle('');
    setDescription('');
    setAssignee('');
    setPriority('medium');
    setIssueType('task');
    setDueDate('');
    setStoryPoints('');
    setEpicId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-brand-900">Add New Task</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-50 rounded-xl transition-colors">
            <X className="w-5 h-5 text-surface-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm resize-none"
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1 block">Assignee</label>
              <input
                type="text"
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
              >
                <option value="lowest">Lowest</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="highest">Highest</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1 block">Issue Type</label>
              <select
                value={issueType}
                onChange={e => setIssueType(e.target.value as IssueType)}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
              >
                <option value="task">Task</option>
                <option value="story">Story</option>
                <option value="bug">Bug</option>
                <option value="subtask">Sub-task</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1 block">Story Points</label>
              <input
                type="number"
                value={storyPoints}
                onChange={e => setStoryPoints(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1 block">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1 block">Epic</label>
              <select
                value={epicId}
                onChange={e => setEpicId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
              >
                <option value="">None</option>
                {EPICS.map(epic => (
                  <option key={epic.id} value={epic.id}>{epic.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-br from-brand-600 to-brand-700 text-white font-semibold rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all shadow-button"
          >
            Create Issue
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Filter bar component
interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priorityFilter: TaskPriority | 'all';
  onPriorityChange: (priority: TaskPriority | 'all') => void;
  assigneeFilter: string;
  onAssigneeChange: (assignee: string) => void;
  assignees: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  assigneeFilter,
  onAssigneeChange,
  assignees,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl shadow-soft border border-surface-100">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
        />
      </div>
      
      {/* Priority Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-surface-400" />
        <select
          value={priorityFilter}
          onChange={e => onPriorityChange(e.target.value as TaskPriority | 'all')}
          className="px-3 py-2.5 rounded-xl border border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm bg-white"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      
      {/* Assignee Filter */}
      <select
        value={assigneeFilter}
        onChange={e => onAssigneeChange(e.target.value)}
        className="px-3 py-2.5 rounded-xl border border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm bg-white"
      >
        <option value="all">All Assignees</option>
        {assignees.map(a => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  );
};

// Milestone Card component
const MilestoneCard: React.FC<{ milestone: Milestone; tasks: ProjectTask[] }> = ({ milestone, tasks }) => {
  const linkedTasks = tasks.filter(t => milestone.taskIds.includes(t.id));
  const completedCount = linkedTasks.filter(t => t.status === 'completed').length;
  const progress = linkedTasks.length > 0 ? Math.round((completedCount / linkedTasks.length) * 100) : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${milestone.status === 'completed' ? 'bg-emerald-50' : milestone.status === 'in_progress' ? 'bg-blue-50' : 'bg-surface-50'}`}>
            <Target className={`w-5 h-5 ${milestone.status === 'completed' ? 'text-emerald-600' : milestone.status === 'in_progress' ? 'text-blue-600' : 'text-surface-400'}`} />
          </div>
          <div>
            <h4 className="font-semibold text-brand-900 text-sm">{milestone.title}</h4>
            <p className="text-[10px] text-surface-500 mt-0.5">{milestone.description}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${MILESTONE_STATUS_COLORS[milestone.status]}`}>
          {milestone.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-surface-500">
            <User className="w-3.5 h-3.5" />
            {milestone.owner}
          </div>
          <div className="flex items-center gap-1 text-surface-500">
            <Calendar className="w-3.5 h-3.5" />
            {milestone.dueDate}
          </div>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-surface-500">Progress</span>
            <span className="font-bold text-brand-700">{progress}%</span>
          </div>
          <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${milestone.status === 'completed' ? 'bg-emerald-500' : 'bg-brand-500'}`}
            />
          </div>
        </div>
        
        {linkedTasks.length > 0 && (
          <div className="pt-3 border-t border-surface-100">
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-2">Linked Tasks ({completedCount}/{linkedTasks.length})</div>
            <div className="space-y-1.5">
              {linkedTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 text-xs">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-surface-300" />
                  )}
                  <span className={task.status === 'completed' ? 'text-surface-400 line-through' : 'text-brand-800'}>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const ProjectManagement: React.FC = () => {
  const [localTasks, setLocalTasks] = useState<ProjectTask[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = (searchParams.get('view') ?? 'kanban') as 'kanban' | 'sprint' | 'backlog' | 'velocity' | 'schedule' | 'rfi' | 'milestones' | 'retrospectives' | 'releases' | 'settings' | 'automation' | 'ai-workflows' | 'ai-task-analysis' | 'ai-security' | 'ai-resource-planning' | 'ai-risk-matrix' | 'ai-dependency-analyzer' | 'photo-docs';
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  // ── Real backend project & tasks data ──────────────────────────────────
  const { data: backendProjects } = useProjects({ status: 'active' });
  const activeProjectId = backendProjects?.[0]?.id ?? null;
  const { data: backendTasks, refetch: refetchTasks } = useProjectTasks(activeProjectId);
  const createTask = useCreateProjectTask();
  const updateTask = useUpdateProjectTask();
  const activeProjectName = (backendProjects?.[0] as any)?.title ?? (backendProjects?.[0] as any)?.name ?? 'Active Project';

  // ── Epics (backend with mock fallback) ─────────────────────────────────
  const { data: backendEpics } = useProjectEpics();
  const activeEpics: Epic[] = useMemo(() => {
    if (backendEpics && backendEpics.length > 0) {
      return backendEpics.map((e: any) => ({
        id: String(e.id),
        key: e.key,
        name: e.name,
        summary: e.summary ?? '',
        color: e.color ?? '#6366f1',
        status: e.status as TaskStatus,
      }));
    }
    return [];
  }, [backendEpics]);

  // ── Milestones (backend-owned) ──────────────────────────────────────────
  const { data: backendMilestones } = useProjectMilestones(activeProjectId ? { projectId: activeProjectId } : undefined);
  const milestones: Milestone[] = useMemo(() => {
    return (backendMilestones ?? []).map((milestone) => ({
      id: String(milestone.id),
      title: milestone.title,
      description: milestone.description ?? '',
      dueDate: milestone.dueDate,
      status: milestone.status,
      owner: milestone.owner || 'Unassigned',
      taskIds: milestone.taskIds ?? [],
    }));
  }, [backendMilestones]);

  // ── RFI Register (backend-owned) ───────────────────────────────────────
  const { data: backendRFI } = useProjectRFI(activeProjectId ? { projectId: activeProjectId } : undefined);
  const rfiRegister: RFI[] = useMemo(() => (
    (backendRFI ?? []).map((rfi) => ({
      id: String(rfi.id),
      subject: rfi.subject,
      from: rfi.from,
      to: rfi.to,
      dateSubmitted: rfi.dateSubmitted,
      dueDate: rfi.dueDate,
      status: rfi.status,
    }))
  ), [backendRFI]);

  // ── Project Schedule (backend-owned) ───────────────────────────────────
  const { data: scheduleData } = useProjectSchedule(activeProjectId);
  const projectSchedule: ScheduleTask[] = useMemo(() => {
    return (scheduleData?.data?.timeline ?? []).map((timelineItem: any) => ({
      id: String(timelineItem.id),
      task: timelineItem.task,
      startDate: timelineItem.startDate ?? '',
      endDate: timelineItem.endDate ?? '',
      progress: timelineItem.progress ?? 0,
      status: timelineItem.status === 'completed' ? 'Completed' : timelineItem.status === 'blocked' ? 'Delayed' : 'On Track',
    }));
  }, [scheduleData]);

  // Merge backend tasks with mock fallback
  const tasks: ProjectTask[] = useMemo(() => {
    if (backendTasks && backendTasks.length > 0) {
      const backendMapped: ProjectTask[] = backendTasks.map((t: any) => ({
        id: String(t.id),
        key: `SAFE-${t.id}`,
        title: t.title,
        description: t.description ?? '',
        status: (BACKEND_TO_FRONTEND_STATUS[t.status] ?? 'todo') as TaskStatus,
        priority: (t.priority as TaskPriority) ?? 'medium',
        assignee: t.assignedTo ?? 'Unassigned',
        reporter: 'System',
        dueDate: t.dueDate ?? new Date().toISOString().split('T')[0],
        createdAt: t.dueDate ?? new Date().toISOString().split('T')[0],
        updatedAt: t.completedDate ?? new Date().toISOString().split('T')[0],
        labels: t.safetyRequirements ?? [],
        components: [],
        watchers: [],
        linkedIssues: [],
        attachments: [],
        comments: [],
        activityLog: [],
        tags: [],
        issueType: 'task' as IssueType,
      }));
      return backendMapped;
    }
    return localTasks;
  }, [backendTasks, localTasks]);

  // Get unique assignees
  const assignees = useMemo(() => {
    const unique = [...new Set(tasks.map(t => t.assignee))];
    return unique.filter(a => a !== 'Unassigned');
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.labels && task.labels.some(label => label.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (task.key && task.key.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === 'all' || task.assignee === assigneeFilter;
      
      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchQuery, priorityFilter, assigneeFilter]);

  const handleAddTask = async (taskData: Partial<ProjectTask>) => {
    const newTask: ProjectTask = {
      ...taskData as ProjectTask,
      id: `PT-${String(tasks.length + 1).padStart(3, '0')}`,
      key: `SAFE-${100 + tasks.length + 1}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    // Optimistic update
    setLocalTasks(prev => [...prev, newTask]);
    // Persist to backend
    if (activeProjectId) {
      await createTask.mutate({
        projectId: activeProjectId,
        data: {
          title: newTask.title,
          description: newTask.description,
          status: FRONTEND_TO_BACKEND_STATUS[newTask.status] ?? 'todo',
          priority: newTask.priority,
          assignedTo: newTask.assignee,
          dueDate: newTask.dueDate,
        },
      });
      refetchTasks();
    }
  };

  const handleUpdateTask = (updatedTask: ProjectTask) => {
    setLocalTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    // Optimistic update
    setLocalTasks(prev => prev.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString().split('T')[0] } : t));
    // Persist to backend
    if (activeProjectId && !id.startsWith('PT-')) {
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId)) {
        await updateTask.mutate({
          projectId: activeProjectId,
          taskId: numericId,
          data: { status: FRONTEND_TO_BACKEND_STATUS[status] ?? 'todo' },
        });
      }
    }
  };

  const handleDeleteTask = (id: string) => {
    hapticFeedback('error');
    setLocalTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleOpenTask = (task: ProjectTask) => {
    hapticFeedback('light');
    setSelectedTask(task);
  };

  const handleReorder = (status: TaskStatus, newOrder: ProjectTask[]) => {
    hapticFeedback('medium');
    setLocalTasks(prev => {
      const otherTasks = prev.filter(t => t.status !== status);
      return [...otherTasks, ...newOrder];
    });
  };

  const getTasksByStatus = (status: TaskStatus) => filteredTasks.filter(t => t.status === status);

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length;

  return (
    <div className="min-h-screen bg-surface-50 pb-32">

      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
              <ListTodo className="w-4 h-4" />
              Project Workflow
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-900 tracking-tighter leading-none">Project Management</h1>
            <p className="text-surface-500 mt-3 max-w-xl text-base">
              Task management, schedule tracking, and RFI register for enterprise projects.
            </p>
          </motion.div>
          
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => { hapticFeedback('light'); setShowAddModal(true); }}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-brand-600 to-brand-700 text-white font-semibold rounded-2xl hover:from-brand-700 hover:to-brand-800 transition-all shadow-button"
          >
            <Plus className="w-5 h-5" /> Add Task
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Tasks', value: totalTasks, icon: ListTodo, color: 'brand' },
            { label: 'Completed', value: completedTasks, icon: CheckCircle2, color: 'emerald' },
            { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, icon: Loader2, color: 'blue' },
            { label: 'Overdue', value: overdueTasks, icon: AlertCircle, color: 'red' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-4 rounded-2xl shadow-soft border border-surface-100"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-${stat.color}-50`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-900">{stat.value}</div>
                  <div className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 bg-surface-100/50 p-1 rounded-2xl w-fit overflow-x-auto">
          {[
            { id: 'kanban', label: 'Board', icon: ListTodo },
            { id: 'sprint', label: 'Sprint Planning', icon: Play },
            { id: 'backlog', label: 'Backlog', icon: Archive },
            { id: 'velocity', label: 'Velocity', icon: BarChart3 },
            { id: 'retrospectives', label: 'Retrospectives', icon: Repeat },
            { id: 'releases', label: 'Releases', icon: Package },
            { id: 'milestones', label: 'Milestones', icon: Target },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'rfi', label: 'RFI Register', icon: FileText },
            { id: 'ai-workflows', label: 'AI Workflows', icon: Zap },
            { id: 'ai-task-analysis', label: 'AI Task Analysis', icon: Brain },
            { id: 'ai-security', label: 'AI Security', icon: Eye },
            { id: 'ai-resource-planning', label: 'AI Resource Planner', icon: Brain },
            { id: 'ai-risk-matrix', label: 'AI Risk Matrix', icon: Target },
            { id: 'ai-dependency-analyzer', label: 'AI Dependencies', icon: Zap },
            { id: 'photo-docs', label: 'Photo Docs', icon: Calendar },
            { id: 'automation', label: 'Automation', icon: Workflow },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { hapticFeedback('light'); setSearchParams({ view: tab.id }); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeView === tab.id 
                  ? 'bg-white shadow-soft text-brand-700' 
                  : 'text-surface-500 hover:text-brand-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Bar - Only show for Kanban */}
        {activeView === 'kanban' && (
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            assigneeFilter={assigneeFilter}
            onAssigneeChange={setAssigneeFilter}
            assignees={assignees}
          />
        )}

        {/* Kanban View with Drag & Drop */}
        {activeView === 'kanban' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map(column => {
              const columnTasks = getTasksByStatus(column.id);
              return (
                <div key={column.id} className={`p-4 rounded-2xl ${column.color} border min-h-[200px]`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-brand-900 text-sm">{column.label}</h3>
                    <span className="text-xs font-bold text-surface-500 bg-white px-2 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                  <Reorder.Group
                    axis="y"
                    values={columnTasks}
                    onReorder={(newOrder) => handleReorder(column.id, newOrder)}
                    className="space-y-3"
                  >
                    <AnimatePresence>
                      {columnTasks.map(task => (
                        <Reorder.Item
                          key={task.id}
                          value={task}
                          onDragStart={() => hapticFeedback('light')}
                        >
                          <DraggableTaskCard
                            task={task}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteTask}
                            onOpen={handleOpenTask}
                            epics={activeEpics}
                          />
                        </Reorder.Item>
                      ))}
                    </AnimatePresence>
                  </Reorder.Group>
                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-surface-400 text-sm">
                      No tasks
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Sprint Planning View */}
        {activeView === 'sprint' && (
          <SprintPlanningView
            tasks={tasks}
            onTaskUpdate={handleUpdateTask}
            onOpenTask={handleOpenTask}
          />
        )}

        {/* Backlog Management View */}
        {activeView === 'backlog' && (
          <BacklogManagement
            tasks={tasks}
            onTaskUpdate={handleUpdateTask}
            onOpenTask={handleOpenTask}
            onMoveToSprint={(taskId, sprintId) => {
              hapticFeedback('success');
              setLocalTasks(prev => prev.map(t => 
                t.id === taskId 
                  ? { ...t, sprintId, status: 'todo' as TaskStatus, updatedAt: new Date().toISOString().split('T')[0] }
                  : t
              ));
            }}
          />
        )}

        {/* Velocity Charts View */}
        {activeView === 'velocity' && (
          <VelocityCharts tasks={tasks} />
        )}

        {/* Sprint Retrospectives View */}
        {activeView === 'retrospectives' && (
          <SprintRetrospectives />
        )}

        {/* Release Planning View */}
        {activeView === 'releases' && (
          <ReleasePlanningView />
        )}

        {/* Workflow Automation View */}
        {activeView === 'automation' && (
          <WorkflowAutomation />
        )}

        {/* Sprint Settings View */}
        {activeView === 'settings' && (
          <SprintSettings />
        )}

        {/* Milestones View */}
        {activeView === 'milestones' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-brand-900">Project Milestones</h3>
                <p className="text-sm text-surface-500 mt-1">Backend-owned milestones for {activeProjectName}</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-surface-600">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-surface-600">In Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-surface-300" />
                  <span className="text-surface-600">Pending</span>
                </div>
              </div>
            </div>
            
            {/* Timeline visualization */}
            {milestones.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-surface-200 p-8 text-center text-surface-500">
                No backend milestones are currently available for this project.
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-surface-200" />
                <div className="space-y-6">
                  {milestones.slice().sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((milestone) => (
                    <div key={milestone.id} className="relative pl-14">
                      <div className={`absolute left-4 w-5 h-5 rounded-full border-4 border-white ${
                        milestone.status === 'completed' ? 'bg-emerald-500' : 
                        milestone.status === 'in_progress' ? 'bg-blue-500' : 'bg-surface-300'
                      }`} />
                      <MilestoneCard milestone={milestone} tasks={tasks} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schedule View */}
        {activeView === 'schedule' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 sm:p-8 rounded-3xl shadow-soft border border-surface-100"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-brand-900 tracking-tight">Project Schedule</h3>
                <p className="text-sm text-surface-500 mt-1">Timeline generated from backend project tasks for {activeProjectName}</p>
              </div>
              <button className="text-[10px] font-bold text-brand-600 uppercase tracking-widest hover:text-brand-700 transition-colors flex items-center gap-1">
                Gantt View <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            {projectSchedule.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-surface-200 p-8 text-center text-surface-500">
                No scheduled backend task timeline is available for this project yet.
              </div>
            ) : (
              <div className="space-y-6">
                {projectSchedule.map((task, index) => (
                  <div key={task.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-sm font-bold text-brand-900">{task.task}</div>
                        <div className="text-[10px] text-surface-400 font-medium uppercase tracking-wider">{task.startDate} — {task.endDate}</div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : task.status === 'Delayed' ? 'bg-accent-50 text-accent-600 border-accent-100' : 'bg-brand-50 text-brand-600 border-brand-100'}`}>
                          {task.status}
                        </span>
                        <div className="text-xs font-bold text-brand-900 mt-1">{task.progress}%</div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-50 rounded-full overflow-hidden border border-surface-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${task.progress}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={`h-full rounded-full ${task.status === 'Completed' ? 'bg-emerald-500' : task.status === 'Delayed' ? 'bg-accent-500' : 'bg-brand-500'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* RFI View */}
        {activeView === 'rfi' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 sm:p-8 rounded-3xl shadow-soft border border-surface-100"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-brand-900 tracking-tight">RFI Register</h3>
                <p className="text-sm text-surface-500 mt-1">Backend-owned RFIs for {activeProjectName}</p>
              </div>
              <button className="text-[10px] font-bold text-brand-600 uppercase tracking-widest hover:text-brand-700 transition-colors flex items-center gap-1">
                New RFI <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            {rfiRegister.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-surface-200 p-8 text-center text-surface-500">
                No backend RFIs are currently available for this project.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-surface-50">
                      <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest">Subject</th>
                      <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest text-center">Status</th>
                      <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest text-right">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {rfiRegister.map(rfi => (
                      <tr key={rfi.id} className="group hover:bg-surface-50/50 transition-colors">
                        <td className="py-4">
                          <div className="text-sm font-bold text-brand-900">{rfi.subject}</div>
                          <div className="text-[10px] text-surface-500 mt-0.5">From: {rfi.from}</div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-xs font-medium text-surface-600">
                            {rfi.status === 'Overdue' ? <AlertCircle className="w-4 h-4 text-accent-500" /> : rfi.status === 'Closed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-brand-500" />}
                            {rfi.status}
                          </div>
                        </td>
                        <td className="py-4 text-right text-xs font-medium text-surface-500">{rfi.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* AI Workflows View */}
        {activeView === 'ai-workflows' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* AI Intelligence Summary */}
            <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">AI Project Intelligence</h3>
                    <p className="text-xs text-text-muted font-mono">8 AI ENGINES • REAL-TIME ANALYSIS</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-600">LIVE</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-surface-overlay p-4 rounded-xl border border-surface-border">
                  <p className="text-3xl font-black text-text-primary">94%</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Health Score</p>
                </div>
                <div className="bg-surface-overlay p-4 rounded-xl border border-surface-border">
                  <p className="text-3xl font-black text-text-primary">142h</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Hours Saved</p>
                </div>
                <div className="bg-surface-overlay p-4 rounded-xl border border-surface-border">
                  <p className="text-3xl font-black text-text-primary">1,247</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Tasks AI-Touched</p>
                </div>
                <div className="bg-surface-overlay p-4 rounded-xl border border-surface-border">
                  <p className="text-3xl font-black text-accent">97%</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Sprint Completion</p>
                </div>
              </div>
              <div className="bg-accent/5 p-3 rounded-xl border border-accent/20">
                <p className="text-xs text-accent font-medium flex items-center gap-2"><Zap className="w-3 h-3" /> AI Recommendations:</p>
                <ul className="mt-2 space-y-1">
                  <li className="text-xs text-text-secondary">• Split SAFE-105 (Environmental Dashboard) into 2 stories to reduce risk</li>
                  <li className="text-xs text-text-secondary">• Sarah Johnson has 40% capacity — assign IoT integration research</li>
                  <li className="text-xs text-text-secondary">• Schedule OSHA 1910.147 (LOTO) training before confined space rollout</li>
                  <li className="text-xs text-text-secondary">• 3 duplicate near-miss reports detected — consolidate into single investigation</li>
                </ul>
              </div>
            </div>
            
            {/* AI Workflow Stages */}
            <h3 className="text-lg font-bold text-brand-900 dark:text-white tracking-tight">AI Workflow Stages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Auto Risk Scoring', engine: 'Predictive Risk Engine', status: 'active', confidence: 94.1, automation: 'Full Auto', tasks: 4823, trigger: '2m ago' },
                { name: 'Smart Task Assignment', engine: 'NLP Safety Engine', status: 'active', confidence: 91.7, automation: 'AI Suggest', tasks: 2156, trigger: '5m ago' },
                { name: 'Predictive Scheduling', engine: 'Predictive Risk Engine', status: 'active', confidence: 88.3, automation: 'AI Suggest', tasks: 1847, trigger: '12m ago' },
                { name: 'Compliance Auto-Check', engine: 'Compliance AI', status: 'active', confidence: 99.2, automation: 'Full Auto', tasks: 6291, trigger: '1m ago' },
                { name: 'Sprint Health AI', engine: 'Behavioral Analytics', status: 'active', confidence: 86.5, automation: 'Monitoring', tasks: 892, trigger: '30m ago' },
                { name: 'Incident-to-Task Pipeline', engine: 'Visual Audit AI', status: 'active', confidence: 96.8, automation: 'Full Auto', tasks: 3412, trigger: '8m ago' },
                { name: 'Emergency Response AI', engine: 'IoT Neural Network', status: 'active', confidence: 98.5, automation: 'Full Auto', tasks: 147, trigger: '2h ago' },
                { name: 'Ergonomic Risk Detector', engine: 'Behavioral Analytics', status: 'learning', confidence: 82.1, automation: 'AI Suggest', tasks: 534, trigger: '45m ago' },
              ].map((stage, i) => (
                <motion.div key={stage.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-surface-200 dark:border-slate-700/50 hover:border-cyan-500/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-brand-900 dark:text-white">{stage.name}</h4>
                      <p className="text-[10px] text-surface-500 dark:text-slate-400">{stage.engine}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${stage.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${stage.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}`}>{stage.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-lg font-black text-brand-900 dark:text-white">{stage.confidence}%</p>
                      <p className="text-[9px] text-surface-400 dark:text-slate-500 uppercase">Accuracy</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-brand-900 dark:text-white">{stage.tasks.toLocaleString()}</p>
                      <p className="text-[9px] text-surface-400 dark:text-slate-500 uppercase">Processed</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-900 dark:text-white mt-0.5">{stage.trigger}</p>
                      <p className="text-[9px] text-surface-400 dark:text-slate-500 uppercase">Last Run</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-slate-700/50">
                    <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 px-2 py-1 bg-cyan-50 dark:bg-cyan-500/10 rounded-lg">{stage.automation}</span>
                    <div className="w-20 h-1.5 rounded-full bg-surface-100 dark:bg-slate-700/50 overflow-hidden">
                      <div className="h-full rounded-full bg-cyan-500" style={{ width: `${stage.confidence}%` }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Task Analysis View */}
        {activeView === 'ai-task-analysis' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">AI Task Intelligence Engine</h3>
                  <p className="text-xs text-text-muted font-mono">DEEP ANALYSIS • 8 AI MODELS ACTIVE</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Tasks Analyzed', value: '2,847', color: 'text-purple-600' },
                  { label: 'Bottlenecks Found', value: '12', color: 'text-red-600' },
                  { label: 'Auto-Assigned', value: '847', color: 'text-accent' },
                  { label: 'Risk Predictions', value: '23', color: 'text-amber-600' },
                ].map((m, i) => (
                  <div key={i} className="bg-surface-overlay rounded-xl p-3 border border-surface-border">
                    <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                    <p className="text-[9px] text-text-muted uppercase tracking-wider">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Sprint Risk Forecast', desc: 'AI predicts 94% sprint completion probability. 2 stories at risk of delay.', risk: 'medium', action: 'Split SAFE-105 into sub-tasks to reduce complexity' },
                { title: 'Resource Optimization', desc: 'Sarah Johnson at 40% capacity. AI recommends assigning IoT integration research.', risk: 'low', action: 'Auto-assign 3 backlog items to Sarah' },
                { title: 'Dependency Chain Alert', desc: 'Critical path identified: LOTO Training → Confined Space Permits → Field Deployment.', risk: 'high', action: 'Schedule LOTO training before Feb 28' },
                { title: 'Duplicate Detection', desc: '3 near-miss reports share similar root causes. AI recommends consolidation.', risk: 'medium', action: 'Merge duplicate investigations' },
                { title: 'Velocity Anomaly', desc: 'Team velocity dropped 15% this sprint. AI correlates with 2 new team members.', risk: 'low', action: 'Add pair programming sessions for new members' },
                { title: 'Compliance Blocker', desc: 'OSHA 1910.147 training required before confined space feature rollout.', risk: 'critical', action: 'Block deployment until training complete' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-bold text-brand-900">{item.title}</h4>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase ${item.risk === 'critical' ? 'bg-red-50 text-red-600' : item.risk === 'high' ? 'bg-orange-50 text-orange-600' : item.risk === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>{item.risk}</span>
                  </div>
                  <p className="text-xs text-surface-600 mb-3">{item.desc}</p>
                  <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                    <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="text-[10px] text-indigo-700 font-semibold">{item.action}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Security View */}
        {activeView === 'ai-security' && (
          <AIMalwareSecurity />
        )}

        {/* AI Resource Planning View */}
        {activeView === 'ai-resource-planning' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">AI Resource Planning Engine</h3>
                  <p className="text-xs text-text-muted font-mono">PREDICTIVE ALLOCATION • LOAD BALANCING • CAPACITY FORECASTING</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                {[
                  { label: 'Team Utilization', value: '87%', trend: '+3%', color: 'emerald' },
                  { label: 'Optimal Allocation Score', value: '94/100', trend: '+7', color: 'cyan' },
                  { label: 'Bottleneck Risk', value: 'Low', trend: '-15%', color: 'green' },
                  { label: 'Sprint Capacity', value: '142 pts', trend: '+12', color: 'teal' },
                ].map((metric, i) => (
                  <div key={i} className="bg-surface-overlay rounded-xl p-4 border border-surface-border">
                    <p className="text-xs text-text-muted mb-1">{metric.label}</p>
                    <p className="text-xl font-black text-text-primary">{metric.value}</p>
                    <p className="text-[10px] text-emerald-600 font-mono mt-1">↑ {metric.trend}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Resource Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Sarah Chen', role: 'Lead Engineer', allocation: 95, tasks: 8, sprint: 'Sprint 14', risk: 'Over-allocated', riskColor: 'red', skills: ['React', 'Node.js', 'Python'], aiSuggestion: 'Redistribute 2 tasks to Mike to balance load' },
                { name: 'Mike Thompson', role: 'Senior Developer', allocation: 62, tasks: 4, sprint: 'Sprint 14', risk: 'Under-utilized', riskColor: 'yellow', skills: ['Java', 'AWS', 'Docker'], aiSuggestion: 'Can absorb 2 additional tasks from Sarah' },
                { name: 'Emily Park', role: 'QA Engineer', allocation: 78, tasks: 6, sprint: 'Sprint 14', risk: 'Optimal', riskColor: 'green', skills: ['Selenium', 'Cypress', 'Jest'], aiSuggestion: 'On track for sprint completion by deadline' },
                { name: 'Robert Kim', role: 'DevOps Engineer', allocation: 88, tasks: 7, sprint: 'Sprint 14', risk: 'Near capacity', riskColor: 'orange', skills: ['Kubernetes', 'Terraform', 'CI/CD'], aiSuggestion: 'Monitor closely - infrastructure tasks may spike mid-sprint' },
                { name: 'Lisa Wang', role: 'Full-Stack Developer', allocation: 72, tasks: 5, sprint: 'Sprint 14', risk: 'Optimal', riskColor: 'green', skills: ['TypeScript', 'GraphQL', 'PostgreSQL'], aiSuggestion: 'Good candidate for the upcoming API refactor' },
                { name: 'David Martinez', role: 'UX Designer', allocation: 55, tasks: 3, sprint: 'Sprint 14', risk: 'Available', riskColor: 'blue', skills: ['Figma', 'Prototyping', 'Research'], aiSuggestion: 'Has bandwidth for design system component library work' },
              ].map((person, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-brand-900">{person.name}</h4>
                      <p className="text-xs text-surface-500">{person.role}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${person.riskColor === 'red' ? 'bg-red-50 text-red-700' : person.riskColor === 'yellow' ? 'bg-yellow-50 text-yellow-700' : person.riskColor === 'green' ? 'bg-emerald-50 text-emerald-700' : person.riskColor === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{person.risk}</span>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-surface-500">Allocation</span>
                      <span className="font-bold text-brand-900">{person.allocation}%</span>
                    </div>
                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${person.allocation > 90 ? 'bg-red-500' : person.allocation > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${person.allocation}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap mb-3">
                    {person.skills.map(s => (<span key={s} className="px-2 py-0.5 bg-surface-50 text-surface-600 rounded text-[10px] font-medium">{s}</span>))}
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2 flex items-start gap-2">
                    <Brain className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-700 font-medium">{person.aiSuggestion}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Risk Matrix View */}
        {activeView === 'ai-risk-matrix' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center">
                  <Target className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">AI Risk Matrix Engine</h3>
                  <p className="text-xs text-text-muted font-mono">REAL-TIME RISK SCORING • PROBABILITY ANALYSIS • IMPACT ASSESSMENT</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                {[
                  { label: 'Critical Risks', value: '3', trend: '+1 this week', color: 'red' },
                  { label: 'Risk Score', value: '72/100', trend: 'Medium-High', color: 'orange' },
                  { label: 'Mitigated', value: '14', trend: '+4 resolved', color: 'green' },
                  { label: 'AI Predictions', value: '6 alerts', trend: 'Next 2 sprints', color: 'yellow' },
                ].map((m, i) => (
                  <div key={i} className="bg-surface-overlay rounded-xl p-4 border border-surface-border">
                    <p className="text-xs text-text-muted mb-1">{m.label}</p>
                    <p className="text-xl font-black text-text-primary">{m.value}</p>
                    <p className="text-[10px] text-red-600 font-mono mt-1">{m.trend}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* 5x5 Risk Matrix Grid */}
            <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
              <h4 className="font-bold text-brand-900 mb-4">Probability vs. Impact Matrix (AI-Scored)</h4>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-6 gap-1 min-w-[500px]">
                  <div className="p-2 text-[10px] font-bold text-surface-400"></div>
                  {['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'].map(h => (
                    <div key={h} className="p-2 text-[10px] font-bold text-center text-surface-600">{h}</div>
                  ))}
                  {['Almost Certain', 'Likely', 'Possible', 'Unlikely', 'Rare'].map((prob, pi) => (
                    <React.Fragment key={prob}>
                      <div className="p-2 text-[10px] font-bold text-surface-600 flex items-center">{prob}</div>
                      {[1,2,3,4,5].map((impact) => {
                        const score = (5 - pi) * impact;
                        const risks = [
                          { prob: 0, impact: 3, name: 'API Outage', score: 12 },
                          { prob: 1, impact: 4, name: 'Data Breach', score: 20 },
                          { prob: 2, impact: 2, name: 'Scope Creep', score: 6 },
                          { prob: 0, impact: 4, name: 'Vendor Lock-in', score: 20 },
                          { prob: 3, impact: 1, name: 'UI Bug', score: 2 },
                          { prob: 1, impact: 3, name: 'Team Turnover', score: 12 },
                          { prob: 2, impact: 4, name: 'Security Vuln', score: 12 },
                          { prob: 4, impact: 0, name: 'License Issue', score: 1 },
                        ].filter(r => r.prob === pi && r.impact === impact - 1);
                        const bg = score >= 15 ? 'bg-red-500' : score >= 10 ? 'bg-orange-400' : score >= 5 ? 'bg-yellow-400' : 'bg-green-400';
                        return (
                          <div key={impact} className={`${bg} bg-opacity-20 rounded-lg p-2 min-h-[60px] border border-surface-100 relative`}>
                            <span className="text-[8px] font-bold text-surface-400 absolute top-1 right-1">{score}</span>
                            {risks.map(r => (
                              <div key={r.name} className={`text-[9px] font-bold px-1 py-0.5 rounded ${bg} text-white mb-0.5`}>{r.name}</div>
                            ))}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            {/* Risk Register */}
            <div className="space-y-3">
              {[
                { id: 'RISK-001', name: 'Critical API Dependency Failure', probability: 'Almost Certain', impact: 'Major', score: 20, status: 'Active', owner: 'Sarah Chen', mitigation: 'Implement circuit breaker pattern and fallback services', aiPrediction: '78% chance of occurrence in next 30 days based on historical vendor outage patterns', category: 'Technical' },
                { id: 'RISK-002', name: 'Data Breach via Third-Party Integration', probability: 'Likely', impact: 'Catastrophic', score: 20, status: 'Mitigating', owner: 'Robert Kim', mitigation: 'Implement zero-trust architecture and encrypt all data at rest/transit', aiPrediction: '45% risk reduction after implementing proposed security controls', category: 'Security' },
                { id: 'RISK-003', name: 'Sprint Scope Creep', probability: 'Possible', impact: 'Moderate', score: 9, status: 'Monitoring', owner: 'Emily Park', mitigation: 'Strict change request process, daily standups for scope alignment', aiPrediction: 'Trending downward - 23% less scope changes vs last 3 sprints', category: 'Process' },
                { id: 'RISK-004', name: 'Critical Security Vulnerability in Dependencies', probability: 'Possible', impact: 'Major', score: 12, status: 'Active', owner: 'Mike Thompson', mitigation: 'Automated dependency scanning with Snyk, weekly patch cycle', aiPrediction: '2 new CVEs expected in current dependency tree within 14 days', category: 'Security' },
                { id: 'RISK-005', name: 'Key Team Member Departure', probability: 'Likely', impact: 'Major', score: 16, status: 'Monitoring', owner: 'Project Manager', mitigation: 'Knowledge sharing sessions, documentation initiative, cross-training program', aiPrediction: 'Retention risk elevated for 2 team members based on engagement metrics', category: 'People' },
              ].map((risk, idx) => (
                <motion.div key={risk.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-surface-400">{risk.id}</span>
                      <h4 className="font-bold text-brand-900 text-sm">{risk.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${risk.score >= 15 ? 'bg-red-50 text-red-700' : risk.score >= 10 ? 'bg-orange-50 text-orange-700' : risk.score >= 5 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                        Score: {risk.score}
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${risk.status === 'Active' ? 'bg-red-50 text-red-700' : risk.status === 'Mitigating' ? 'bg-blue-50 text-blue-700' : 'bg-surface-50 text-surface-600'}`}>{risk.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
                    <div><span className="text-surface-400">Probability:</span> <span className="font-bold">{risk.probability}</span></div>
                    <div><span className="text-surface-400">Impact:</span> <span className="font-bold">{risk.impact}</span></div>
                    <div><span className="text-surface-400">Category:</span> <span className="font-bold">{risk.category}</span></div>
                    <div><span className="text-surface-400">Owner:</span> <span className="font-bold">{risk.owner}</span></div>
                  </div>
                  <div className="bg-surface-50 rounded-lg p-3 mb-2">
                    <p className="text-xs text-surface-600"><span className="font-bold">Mitigation:</span> {risk.mitigation}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 flex items-start gap-2">
                    <Brain className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 font-medium">AI Prediction: {risk.aiPrediction}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Dependency Analyzer View */}
        {activeView === 'ai-dependency-analyzer' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">AI Dependency Analyzer</h3>
                  <p className="text-xs text-text-muted font-mono">DEPENDENCY GRAPH • CRITICAL PATH • BLOCKER DETECTION</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                {[
                  { label: 'Total Dependencies', value: '47', trend: '12 cross-team' },
                  { label: 'Critical Path Items', value: '8', trend: '3 at risk' },
                  { label: 'Blocked Tasks', value: '4', trend: '2 auto-resolved' },
                  { label: 'AI Optimizations', value: '11', trend: 'This sprint' },
                ].map((m, i) => (
                  <div key={i} className="bg-surface-overlay rounded-xl p-4 border border-surface-border">
                    <p className="text-xs text-text-muted mb-1">{m.label}</p>
                    <p className="text-xl font-black text-text-primary">{m.value}</p>
                    <p className="text-[10px] text-violet-600 font-mono mt-1">{m.trend}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Dependency Chain Cards */}
            <div className="space-y-4">
              {[
                { chain: 'AUTH-API → USER-SERVICE → DASHBOARD → ANALYTICS', status: 'At Risk', criticalPath: true, blockers: 1, tasks: 12, eta: '3 days delayed', aiInsight: 'AUTH-API migration is blocking 3 downstream services. Recommend parallel development with feature flags to unblock USER-SERVICE.', teams: ['Backend', 'Frontend', 'Data'], health: 35 },
                { chain: 'DATABASE-MIGRATION → API-V2 → MOBILE-APP → RELEASE', status: 'On Track', criticalPath: true, blockers: 0, tasks: 8, eta: 'On schedule', aiInsight: 'Migration scripts tested successfully. API v2 can begin integration testing tomorrow. Mobile team pre-positioned for quick turnaround.', teams: ['DevOps', 'Backend', 'Mobile'], health: 88 },
                { chain: 'DESIGN-SYSTEM → COMPONENT-LIB → FEATURE-PAGES → QA', status: 'Blocked', criticalPath: false, blockers: 2, tasks: 15, eta: '5 days delayed', aiInsight: 'Design tokens not finalized is causing component library delays. Recommend using temporary tokens with automated migration script for later update.', teams: ['Design', 'Frontend', 'QA'], health: 22 },
                { chain: 'CI/CD-PIPELINE → STAGING → LOAD-TEST → PRODUCTION', status: 'On Track', criticalPath: true, blockers: 0, tasks: 6, eta: '2 days ahead', aiInsight: 'Pipeline optimizations reduced build time by 40%. Staging environment is stable. Load testing can begin early.', teams: ['DevOps', 'SRE'], health: 95 },
                { chain: 'SECURITY-AUDIT → PENETRATION-TEST → COMPLIANCE → SIGN-OFF', status: 'At Risk', criticalPath: false, blockers: 1, tasks: 9, eta: '1 day delayed', aiInsight: 'Penetration test vendor rescheduled. Recommend using automated DAST tools as interim measure to maintain compliance timeline.', teams: ['Security', 'Compliance'], health: 52 },
              ].map((dep, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-mono text-violet-600 mb-1">{dep.chain}</p>
                      <div className="flex items-center gap-2">
                        {dep.criticalPath && <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[9px] font-bold">CRITICAL PATH</span>}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${dep.status === 'Blocked' ? 'bg-red-50 text-red-700' : dep.status === 'At Risk' ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>{dep.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-brand-900">{dep.tasks} tasks</p>
                      <p className="text-[10px] text-surface-500">{dep.eta}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-surface-500">Health Score</span>
                      <span className="font-bold">{dep.health}%</span>
                    </div>
                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${dep.health >= 75 ? 'bg-emerald-500' : dep.health >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${dep.health}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap mb-3">
                    {dep.teams.map(t => (<span key={t} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-[10px] font-medium">{t}</span>))}
                    {dep.blockers > 0 && <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-bold">{dep.blockers} Blocker{dep.blockers > 1 ? 's' : ''}</span>}
                  </div>
                  <div className="bg-violet-50 rounded-lg p-2 flex items-start gap-2">
                    <Brain className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-violet-700 font-medium">{dep.aiInsight}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Photo Documentation View */}
        {activeView === 'photo-docs' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <PhotoUpload
              title="Project Photo Documentation"
              description="Upload project photos, site progress images, and safety documentation. AI auto-tags and analyzes all uploads."
              maxFiles={30}
              acceptVideo={true}
              showAIAnalysis={true}
              darkMode={false}
            />
          </motion.div>
        )}
      </main>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddTaskModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddTask}
            epics={activeEpics}
          />
        )}
      </AnimatePresence>

      {/* Task Detail Modal (Jira-like) */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleUpdateTask}
            allTasks={tasks}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectManagement;
