import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  GripVertical, User, Filter, Search, Plus, ChevronDown, ArrowRight,
  Zap, BookOpen, Bug, CheckSquare, Layers, Target, Calendar, AlertCircle
} from 'lucide-react';
import type { ProjectTask, TaskStatus, TaskPriority, IssueType } from '../../types/project';
import { useProjectSprints, useProjectEpics } from '../../api/hooks/useAPIHooks';
import { SprintRecord, EpicRecord } from '../../api/services/apiService';
import { hapticFeedback } from '../../utils/mobileFeatures';
import { SMCard } from '../../components/ui';

interface BacklogManagementProps {
  tasks: ProjectTask[];
  onTaskUpdate: (task: ProjectTask) => void;
  onOpenTask: (task: ProjectTask) => void;
  onMoveToSprint: (taskId: string, sprintId: string) => void;
}

const ISSUE_TYPE_ICONS: Record<IssueType, { icon: typeof Target; color: string }> = {
  epic: { icon: Zap, color: 'text-purple-600 bg-purple-500/10' },
  story: { icon: BookOpen, color: 'text-success bg-success/10' },
  task: { icon: CheckSquare, color: 'text-accent bg-accent/10' },
  subtask: { icon: Layers, color: 'text-cyan-400 bg-cyan-500/10' },
  bug: { icon: Bug, color: 'text-danger bg-danger/10' },
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  highest: 'bg-danger/10 text-danger border-danger/20',
  high: 'bg-warning/10 text-warning border-orange-200',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-accent/10 text-accent border-accent/20',
  lowest: 'bg-surface-sunken text-text-muted border-surface-border',
};

const BacklogItem: React.FC<{
  task: ProjectTask;
  epics: EpicRecord[];
  sprints: SprintRecord[];
  onOpen: (task: ProjectTask) => void;
  onMoveToSprint: (taskId: string, sprintId: string) => void;
  isSelected: boolean;
  onSelect: (taskId: string) => void;
}> = ({ task, epics, sprints, onOpen, onMoveToSprint, isSelected, onSelect }) => {
  const [showSprintMenu, setShowSprintMenu] = useState(false);
  const issueType = task.issueType || 'task';
  const IssueIcon = ISSUE_TYPE_ICONS[issueType]?.icon || CheckSquare;
  const epic = task.epicId ? epics.find(e => String(e.id) === task.epicId || e.key === task.epicId) : null;
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`bg-surface-raised p-4 rounded-xl border transition-all group ${
        isSelected ? 'border-accent ring-2 ring-brand-100' : 'border-surface-border hover:border-brand-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Drag handle */}
        <div className="drag-handle cursor-grab active:cursor-grabbing p-1 rounded hover:bg-surface-base touch-none">
          <GripVertical className="w-4 h-4 text-text-muted" />
        </div>

        {/* Checkbox */}
        <button
          onClick={() => onSelect(task.id)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected ? 'bg-accent/10 border-accent' : 'border-surface-border hover:border-accent'
          }`}
        >
          {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
        </button>

        {/* Issue type icon */}
        <span className={`p-1.5 rounded ${ISSUE_TYPE_ICONS[issueType]?.color || 'text-accent bg-accent/10'}`}>
          <IssueIcon className="w-4 h-4" />
        </span>

        {/* Main content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpen(task)}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-text-muted">{task.key || task.id}</span>
            {epic && (
              <span 
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${epic.color}15`, color: epic.color }}
              >
                {epic.name}
              </span>
            )}
            {isOverdue && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-danger/10 text-danger flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Overdue
              </span>
            )}
          </div>
          <h4 className="font-medium text-text-primary text-sm line-clamp-1">{task.title}</h4>
        </div>

        {/* Metadata */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          {/* Priority */}
          <span className={`px-2 py-1 rounded border font-medium ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>

          {/* Story points */}
          {task.storyPoints && (
            <span className="px-2 py-1 bg-accent/10 text-accent rounded font-bold">
              {task.storyPoints} SP
            </span>
          )}

          {/* Due date */}
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-text-muted'}`}>
            <Calendar className="w-3.5 h-3.5" />
            {task.dueDate}
          </span>

          {/* Assignee */}
          <div className="flex items-center gap-1 text-text-muted">
            <User className="w-3.5 h-3.5" />
            {task.assignee.split(' ')[0]}
          </div>
        </div>

        {/* Move to sprint dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSprintMenu(!showSprintMenu)}
            className="p-2 rounded-lg hover:bg-surface-base transition-colors text-text-muted hover:text-accent"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          
          {showSprintMenu && (
            <div className="absolute right-0 top-10 bg-surface-raised rounded-xl shadow-lg border border-surface-border py-2 z-20 min-w-[180px]">
              <div className="px-3 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Move to Sprint
              </div>
              {sprints.filter(s => s.status !== 'completed').map(sprint => (
                <button
                  key={sprint.id}
                  onClick={() => {
                    onMoveToSprint(task.id, String(sprint.id));
                    setShowSprintMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-base flex items-center gap-2"
                >
                  {sprint.status === 'active' && <Target className="w-3.5 h-3.5 text-emerald-500" />}
                  {sprint.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const BacklogManagement: React.FC<BacklogManagementProps> = ({
  tasks,
  onTaskUpdate,
  onOpenTask,
  onMoveToSprint,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEpic, setFilterEpic] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'storyPoints'>('priority');

  // Backend data
  const { data: backendSprints } = useProjectSprints();
  const { data: backendEpics } = useProjectEpics();
  const sprints: SprintRecord[] = backendSprints ?? [];
  const epics: EpicRecord[] = backendEpics ?? [];

  // Filter backlog tasks (status = backlog or no sprint)
  const backlogTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'backlog' || (!t.sprintId && t.status !== 'completed'));
  }, [tasks]);

  // Apply filters and search
  const filteredTasks = useMemo(() => {
    let result = backlogTasks.filter(task => {
      const matchesSearch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.key?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesEpic = filterEpic === 'all' || task.epicId === filterEpic;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      
      return matchesSearch && matchesEpic && matchesPriority;
    });

    // Sort
    const priorityOrder: Record<TaskPriority, number> = { highest: 0, high: 1, medium: 2, low: 3, lowest: 4 };
    result.sort((a, b) => {
      if (sortBy === 'priority') {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else {
        return (b.storyPoints || 0) - (a.storyPoints || 0);
      }
    });

    return result;
  }, [backlogTasks, searchQuery, filterEpic, filterPriority, sortBy]);

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(t => t.id));
    }
  };

  const handleBulkMoveToSprint = (sprintId: string) => {
    selectedTasks.forEach(taskId => onMoveToSprint(taskId, sprintId));
    setSelectedTasks([]);
  };

  const handleReorder = (newOrder: ProjectTask[]) => {
    hapticFeedback('medium');
    newOrder.forEach(task => onTaskUpdate(task));
  };

  // Calculate totals
  const totalPoints = backlogTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const highPriorityCount = backlogTasks.filter(t => t.priority === 'highest' || t.priority === 'high').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <SMCard className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-text-primary">Backlog Management</h3>
            <p className="text-sm text-text-muted mt-1">Prioritize and plan upcoming work</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-surface-base px-3 py-1.5 rounded-lg text-sm">
              <span className="font-bold text-accent">{backlogTasks.length}</span>
              <span className="text-text-muted ml-1">items</span>
            </div>
            <div className="bg-accent/10 px-3 py-1.5 rounded-lg text-sm">
              <span className="font-bold text-accent">{totalPoints}</span>
              <span className="text-indigo-500 ml-1">points</span>
            </div>
            <div className="bg-danger/10 px-3 py-1.5 rounded-lg text-sm">
              <span className="font-bold text-danger">{highPriorityCount}</span>
              <span className="text-red-500 ml-1">high priority</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search backlog..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-border focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
            />
          </div>
          
          {/* Epic Filter */}
          <select
            value={filterEpic}
            onChange={e => setFilterEpic(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-surface-border focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm bg-surface-raised"
          >
            <option value="all">All Epics</option>
            {epics.map(epic => (
              <option key={epic.id} value={String(epic.id)}>{epic.name}</option>
            ))}
          </select>
          
          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as TaskPriority | 'all')}
            className="px-4 py-2.5 rounded-xl border border-surface-border focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm bg-surface-raised"
          >
            <option value="all">All Priorities</option>
            <option value="highest">Highest</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="lowest">Lowest</option>
          </select>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2.5 rounded-xl border border-surface-border focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm bg-surface-raised"
          >
            <option value="priority">Sort by Priority</option>
            <option value="dueDate">Sort by Due Date</option>
            <option value="storyPoints">Sort by Story Points</option>
          </select>
        </div>
      </SMCard>

      {/* Bulk actions */}
      {selectedTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-accent/10 border border-brand-200 p-4 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="font-medium text-accent">{selectedTasks.length} selected</span>
            <button
              onClick={() => setSelectedTasks([])}
              className="text-sm text-accent hover:text-accent"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-accent mr-2">Move to sprint:</span>
            {sprints.filter(s => s.status !== 'completed').map(sprint => (
              <button
                key={sprint.id}
                onClick={() => handleBulkMoveToSprint(String(sprint.id))}
                className="px-3 py-1.5 bg-surface-raised text-sm font-medium text-accent rounded-lg border border-brand-200 hover:bg-accent/10 transition-colors"
              >
                {sprint.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Select all */}
      <div className="flex items-center gap-3 px-4">
        <button
          onClick={handleSelectAll}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            selectedTasks.length === filteredTasks.length && filteredTasks.length > 0
              ? 'bg-accent/10 border-accent' 
              : 'border-surface-border hover:border-accent'
          }`}
        >
          {selectedTasks.length === filteredTasks.length && filteredTasks.length > 0 && (
            <CheckSquare className="w-3.5 h-3.5 text-white" />
          )}
        </button>
        <span className="text-sm text-text-muted">
          {selectedTasks.length === filteredTasks.length && filteredTasks.length > 0 
            ? 'Deselect all' 
            : 'Select all'}
        </span>
      </div>

      {/* Backlog list */}
      <Reorder.Group
        axis="y"
        values={filteredTasks}
        onReorder={handleReorder}
        className="space-y-2"
      >
        <AnimatePresence>
          {filteredTasks.map(task => (
            <Reorder.Item
              key={task.id}
              value={task}
              onDragStart={() => hapticFeedback('light')}
            >
              <BacklogItem
                task={task}
                epics={epics}
                sprints={sprints}
                onOpen={onOpenTask}
                onMoveToSprint={onMoveToSprint}
                isSelected={selectedTasks.includes(task.id)}
                onSelect={handleSelectTask}
              />
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <div className="text-lg font-medium mb-2">No backlog items found</div>
          <p className="text-sm">Try adjusting your filters or add new items to the backlog</p>
        </div>
      )}
    </div>
  );
};

export default BacklogManagement;
