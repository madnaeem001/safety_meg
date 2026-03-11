import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Calendar, Target, Play, Check, ChevronDown, GripVertical, User, 
  Plus, ArrowRight, Clock, Zap, BookOpen, Bug, CheckSquare, Layers,
  AlertTriangle, TrendingUp, BarChart3
} from 'lucide-react';
import { ProjectTask, Sprint, TaskStatus, IssueType } from '../../data/mockProjectManagement';
import { hapticFeedback } from '../../utils/mobileFeatures';
import { useProjectSprints, useProjectEpics } from '../../api/hooks/useAPIHooks';

interface EpicDisplay {
  id: string;
  name: string;
  color: string;
}

interface SprintPlanningViewProps {
  tasks: ProjectTask[];
  onTaskUpdate: (task: ProjectTask) => void;
  onOpenTask: (task: ProjectTask) => void;
}

const ISSUE_TYPE_ICONS: Record<IssueType, { icon: typeof Target; color: string }> = {
  epic: { icon: Zap, color: 'text-purple-600 bg-purple-50' },
  story: { icon: BookOpen, color: 'text-green-600 bg-green-50' },
  task: { icon: CheckSquare, color: 'text-blue-600 bg-blue-50' },
  subtask: { icon: Layers, color: 'text-cyan-600 bg-cyan-50' },
  bug: { icon: Bug, color: 'text-red-600 bg-red-50' },
};

const SPRINT_STATUS_COLORS = {
  future: 'bg-slate-100 text-slate-600 border-slate-200',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
};

const SprintTaskCard: React.FC<{
  task: ProjectTask;
  onOpen: (task: ProjectTask) => void;
  epics: EpicDisplay[];
}> = ({ task, onOpen, epics }) => {
  const issueType = task.issueType || 'task';
  const IssueIcon = ISSUE_TYPE_ICONS[issueType]?.icon || CheckSquare;
  const epic = task.epicId ? epics.find(e => e.id === task.epicId) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onOpen(task)}
      className="bg-white p-3 rounded-xl border border-surface-100 hover:border-brand-200 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-2">
        <div className="drag-handle cursor-grab active:cursor-grabbing p-1 rounded hover:bg-surface-50 touch-none opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3.5 h-3.5 text-surface-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`p-1 rounded ${ISSUE_TYPE_ICONS[issueType]?.color || 'text-blue-600 bg-blue-50'}`}>
              <IssueIcon className="w-3 h-3" />
            </span>
            <span className="text-[10px] font-mono text-surface-500">{task.key || task.id}</span>
            {epic && (
              <span 
                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${epic.color}15`, color: epic.color }}
              >
                {epic.name}
              </span>
            )}
          </div>
          <h4 className="text-sm font-medium text-brand-900 line-clamp-1">{task.title}</h4>
          <div className="flex items-center gap-3 mt-2 text-[10px]">
            {task.storyPoints && (
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-bold">
                {task.storyPoints} SP
              </span>
            )}
            <div className="flex items-center gap-1 text-surface-400">
              <User className="w-3 h-3" />
              {task.assignee.split(' ')[0]}
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
              task.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
              task.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
              'bg-surface-50 text-surface-500'
            }`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SprintColumn: React.FC<{
  sprint: Sprint;
  tasks: ProjectTask[];
  onTaskUpdate: (task: ProjectTask) => void;
  onOpenTask: (task: ProjectTask) => void;
  onReorder: (newTasks: ProjectTask[]) => void;
  epics: EpicDisplay[];
}> = ({ sprint, tasks, onTaskUpdate, onOpenTask, onReorder, epics }) => {
  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const completedPoints = tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);
  const today = new Date();
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="bg-surface-50/50 rounded-2xl border border-surface-100 p-4 min-w-[320px] flex-shrink-0">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SPRINT_STATUS_COLORS[sprint.status]}`}>
              {sprint.status === 'active' && <Play className="w-3 h-3 inline mr-1" />}
              {sprint.status === 'completed' && <Check className="w-3 h-3 inline mr-1" />}
              {sprint.status.toUpperCase()}
            </span>
          </div>
          <h3 className="font-semibold text-brand-900 text-sm">{sprint.name}</h3>
          <p className="text-[10px] text-surface-500 mt-0.5">{sprint.goal}</p>
        </div>
      </div>

      {/* Sprint stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white p-2 rounded-lg border border-surface-100 text-center">
          <div className="text-lg font-bold text-brand-700">{tasks.length}</div>
          <div className="text-[9px] text-surface-500 uppercase">Issues</div>
        </div>
        <div className="bg-white p-2 rounded-lg border border-surface-100 text-center">
          <div className="text-lg font-bold text-indigo-600">{totalPoints}</div>
          <div className="text-[9px] text-surface-500 uppercase">Points</div>
        </div>
        <div className="bg-white p-2 rounded-lg border border-surface-100 text-center">
          <div className="text-lg font-bold text-emerald-600">{progressPercent}%</div>
          <div className="text-[9px] text-surface-500 uppercase">Done</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-surface-500">{completedPoints}/{totalPoints} points</span>
          <span className="text-surface-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {daysRemaining} days left
          </span>
        </div>
        <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"
          />
        </div>
      </div>

      {/* Sprint dates */}
      <div className="flex items-center gap-2 text-[10px] text-surface-500 mb-4 bg-white p-2 rounded-lg border border-surface-100">
        <Calendar className="w-3.5 h-3.5" />
        <span>{sprint.startDate}</span>
        <ArrowRight className="w-3 h-3" />
        <span>{sprint.endDate}</span>
      </div>

      {/* Tasks list */}
      <Reorder.Group
        axis="y"
        values={tasks}
        onReorder={onReorder}
        className="space-y-2 max-h-[400px] overflow-y-auto pr-1"
      >
        <AnimatePresence>
          {tasks.map(task => (
            <Reorder.Item
              key={task.id}
              value={task}
              onDragStart={() => hapticFeedback('light')}
            >
              <SprintTaskCard task={task} onOpen={onOpenTask} epics={epics} />
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {tasks.length === 0 && (
        <div className="text-center py-8 text-surface-400 text-sm">
          No issues in this sprint
        </div>
      )}
    </div>
  );
};

export const SprintPlanningView: React.FC<SprintPlanningViewProps> = ({
  tasks,
  onTaskUpdate,
  onOpenTask,
}) => {
  const [selectedSprint, setSelectedSprint] = useState<string>('all');

  const { data: sprintsData, loading: sprintsLoading, error: sprintsError } = useProjectSprints();
  const { data: epicsData } = useProjectEpics();

  // Map backend SprintRecord (numeric id) to Sprint-compatible shape (string id for task comparison)
  const sprints: Sprint[] = useMemo(
    () =>
      (sprintsData ?? []).map((s: any) => ({
        id: String(s.id),
        name: s.name,
        startDate: s.startDate ?? '',
        endDate: s.endDate ?? '',
        goal: s.goal ?? '',
        status: s.status as 'future' | 'active' | 'completed',
      })),
    [sprintsData]
  );

  // Map backend EpicRecord (numeric id) to display-compatible shape (string id for task comparison)
  const epics: EpicDisplay[] = useMemo(
    () =>
      (epicsData ?? []).map((e: any) => ({
        id: String(e.id),
        name: e.name,
        color: e.color ?? '#6366f1',
      })),
    [epicsData]
  );

  // Group tasks by sprint
  const tasksBySprint = useMemo(() => {
    const grouped: Record<string, ProjectTask[]> = {
      backlog: tasks.filter(t => !t.sprintId || t.status === 'backlog'),
    };
    sprints.forEach(sprint => {
      grouped[sprint.id] = tasks.filter(t => t.sprintId === sprint.id && t.status !== 'backlog');
    });
    return grouped;
  }, [tasks, sprints]);

  const handleReorder = (sprintId: string, newOrder: ProjectTask[]) => {
    hapticFeedback('medium');
    newOrder.forEach(task => onTaskUpdate(task));
  };

  // Calculate overall velocity stats
  const activeSprint = sprints.find(s => s.status === 'active');
  const completedSprints = sprints.filter(s => s.status === 'completed');
  const averageVelocity = completedSprints.length > 0 
    ? Math.round(completedSprints.reduce((sum, s) => {
        const sprintTasks = tasks.filter(t => t.sprintId === s.id && t.status === 'completed');
        return sum + sprintTasks.reduce((pts, t) => pts + (t.storyPoints || 0), 0);
      }, 0) / completedSprints.length)
    : 0;

  if (sprintsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (sprintsError) {
    return (
      <div className="flex items-center gap-3 p-6 bg-red-50 border border-red-200 rounded-2xl">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-700">Failed to load sprints. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sprint Overview Header */}
      <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-brand-900">Sprint Planning</h3>
            <p className="text-sm text-surface-500 mt-1">Plan and manage your sprint cycles</p>
          </div>
          
          {/* Sprint selector */}
          <div className="flex items-center gap-3">
            <select
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              className="px-4 py-2 rounded-xl border border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm bg-white"
            >
              <option value="all">All Sprints</option>
              {sprints.map(sprint => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name} {sprint.status === 'active' && '(Active)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sprint stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 p-4 rounded-xl border border-brand-100">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-brand-600" />
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Active Sprint</span>
            </div>
            <div className="text-lg font-bold text-brand-900">{activeSprint?.name || 'None'}</div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Avg Velocity</span>
            </div>
            <div className="text-lg font-bold text-indigo-900">{averageVelocity} pts/sprint</div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Completed</span>
            </div>
            <div className="text-lg font-bold text-emerald-900">{completedSprints.length} sprints</div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Backlog</span>
            </div>
            <div className="text-lg font-bold text-amber-900">{tasksBySprint.backlog?.length || 0} items</div>
          </div>
        </div>
      </div>

      {/* Sprint columns */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4 min-w-min">
          {/* Backlog column */}
          <SprintColumn
            sprint={{ id: 'backlog', name: 'Backlog', startDate: '', endDate: '', goal: 'Unplanned items', status: 'future' as const }}
            tasks={tasksBySprint.backlog || []}
            onTaskUpdate={onTaskUpdate}
            onOpenTask={onOpenTask}
            onReorder={(newTasks) => handleReorder('backlog', newTasks)}
            epics={epics}
          />
          
          {/* Sprint columns */}
          {(selectedSprint === 'all' ? sprints : sprints.filter(s => s.id === selectedSprint)).map(sprint => (
            <SprintColumn
              key={sprint.id}
              sprint={sprint}
              tasks={tasksBySprint[sprint.id] || []}
              onTaskUpdate={onTaskUpdate}
              onOpenTask={onOpenTask}
              onReorder={(newTasks) => handleReorder(sprint.id, newTasks)}
              epics={epics}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SprintPlanningView;
