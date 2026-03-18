import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Calendar, Clock, Tag, Link2, Paperclip, MessageSquare, 
  Activity, ChevronDown, Plus, Send, Flag, Zap, BookOpen, Target,
  AlertTriangle, Bug, CheckSquare, Layers, Edit3, Trash2, MoreHorizontal,
  Eye, ArrowUpRight, ArrowDownRight, Timer, Users
} from 'lucide-react';
import { ProjectTask, TaskPriority, TaskStatus, IssueType, Comment } from '../../data/mockProjectManagement';
import { hapticFeedback } from '../../utils/mobileFeatures';
import {
  useProjectEpics,
  useProjectSprints,
  useUpdateProjectTask,
  useTaskComments,
  useAddTaskComment,
} from '../../api/hooks/useAPIHooks';
import { SMButton } from '../../components/ui';

interface TaskDetailModalProps {
  task: ProjectTask;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: ProjectTask) => void;
  allTasks: ProjectTask[];
  /** Numeric DB id of this task (from ProjectTaskRecord.id) — enables API persistence */
  taskDbId?: number;
  /** Numeric DB id of the parent project — enables API persistence */
  projectDbId?: number;
}

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; icon: typeof ArrowUpRight; label: string }> = {
  highest: { color: 'text-red-600 bg-red-50 border-red-200', icon: ArrowUpRight, label: 'Highest' },
  high: { color: 'text-orange-600 bg-orange-50 border-orange-200', icon: ArrowUpRight, label: 'High' },
  medium: { color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Flag, label: 'Medium' },
  low: { color: 'text-blue-600 bg-blue-50 border-blue-200', icon: ArrowDownRight, label: 'Low' },
  lowest: { color: 'text-slate-600 bg-slate-50 border-slate-200', icon: ArrowDownRight, label: 'Lowest' },
};

const STATUS_CONFIG: Record<TaskStatus, { color: string; label: string }> = {
  backlog: { color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Backlog' },
  todo: { color: 'bg-surface-100 text-surface-700 border-surface-200', label: 'To Do' },
  in_progress: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'In Progress' },
  review: { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'In Review' },
  completed: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Done' },
};

const ISSUE_TYPE_CONFIG: Record<IssueType, { color: string; icon: typeof Target; label: string }> = {
  epic: { color: 'text-purple-600 bg-purple-50', icon: Zap, label: 'Epic' },
  story: { color: 'text-green-600 bg-green-50', icon: BookOpen, label: 'Story' },
  task: { color: 'text-blue-600 bg-blue-50', icon: CheckSquare, label: 'Task' },
  subtask: { color: 'text-cyan-600 bg-cyan-50', icon: Layers, label: 'Sub-task' },
  bug: { color: 'text-red-600 bg-red-50', icon: Bug, label: 'Bug' },
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  onUpdate,
  allTasks,
  taskDbId,
  projectDbId,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description);

  // ── API hooks ──────────────────────────────────────────────────────────
  const { data: epicsData } = useProjectEpics();
  const { data: sprintsData } = useProjectSprints();
  const updateTaskMutation = useUpdateProjectTask();
  const {
    data: backendComments,
    refetch: refetchComments,
  } = useTaskComments(projectDbId, taskDbId);
  const addCommentMutation = useAddTaskComment();

  // ── Derived data ───────────────────────────────────────────────────────
  const epic = useMemo(() => {
    if (!task.epicId) return null;
    // prefer API-fetched epics; fall back gracefully
    if (epicsData && epicsData.length > 0) {
      return epicsData.find(e => String(e.id) === String(task.epicId) || e.key === task.epicId) ?? null;
    }
    return null;
  }, [epicsData, task.epicId]);

  const sprint = useMemo(() => {
    if (!task.sprintId) return null;
    if (sprintsData && sprintsData.length > 0) {
      return sprintsData.find(s => String(s.id) === String(task.sprintId) || s.name === task.sprintId) ?? null;
    }
    return null;
  }, [sprintsData, task.sprintId]);

  // Merged comments: backend (if available) + local task.comments as fallback
  const displayComments: Comment[] = useMemo(() => {
    if (backendComments && backendComments.length > 0) {
      return backendComments.map(c => ({
        id: String(c.id),
        author: c.author,
        content: c.content,
        timestamp: new Date(c.createdAt).toISOString(),
      }));
    }
    return task.comments || [];
  }, [backendComments, task.comments]);

  const linkedTasks = (task.linkedIssues || []).map(link => ({
    ...link,
    task: allTasks.find(t => t.id === link.taskId)
  })).filter(l => l.task);

  // Sync edit fields when task prop changes
  useEffect(() => {
    setEditedTitle(task.title);
    setEditedDescription(task.description);
  }, [task.id]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    hapticFeedback('light');
    if (taskDbId && projectDbId) {
      await updateTaskMutation.mutate({ projectId: projectDbId, taskId: taskDbId, data: { status: newStatus } });
    }
    onUpdate({ ...task, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] });
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    hapticFeedback('light');
    if (taskDbId && projectDbId) {
      await updateTaskMutation.mutate({ projectId: projectDbId, taskId: taskDbId, data: { priority: newPriority } });
    }
    onUpdate({ ...task, priority: newPriority, updatedAt: new Date().toISOString().split('T')[0] });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    hapticFeedback('success');
    if (taskDbId && projectDbId) {
      await addCommentMutation.mutate({ projectId: projectDbId, taskId: taskDbId, author: 'Current User', content: newComment });
      refetchComments();
    }
    // Also update parent local state for immediate UI feedback
    const comment: Comment = {
      id: `c-${Date.now()}`,
      author: 'Current User',
      content: newComment,
      timestamp: new Date().toISOString()
    };
    onUpdate({ 
      ...task, 
      comments: [...(task.comments || []), comment],
      updatedAt: new Date().toISOString().split('T')[0]
    });
    setNewComment('');
  };

  const handleSaveEdit = async () => {
    if (taskDbId && projectDbId) {
      await updateTaskMutation.mutate({
        projectId: projectDbId,
        taskId: taskDbId,
        data: { title: editedTitle, description: editedDescription },
      });
    }
    onUpdate({ 
      ...task, 
      title: editedTitle, 
      description: editedDescription,
      updatedAt: new Date().toISOString().split('T')[0]
    });
    setIsEditing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  const IssueIcon = ISSUE_TYPE_CONFIG[task.issueType || 'task'].icon;
  const PriorityIcon = PRIORITY_CONFIG[task.priority].icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-surface-100 p-4 lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Issue Type & Key */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`p-1.5 rounded-lg ${ISSUE_TYPE_CONFIG[task.issueType || 'task'].color}`}>
                  <IssueIcon className="w-4 h-4" />
                </span>
                <span className="text-sm font-mono text-brand-600 hover:underline cursor-pointer">
                  {task.key || task.id}
                </span>
                {epic && (
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${epic.color}20`, color: epic.color }}
                  >
                    {epic.name}
                  </span>
                )}
              </div>
              
              {/* Title */}
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  className="text-xl font-bold text-brand-900 w-full px-3 py-2 border border-brand-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  autoFocus
                />
              ) : (
                <h2 className="text-xl lg:text-2xl font-bold text-brand-900 leading-tight">
                  {task.title}
                </h2>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 hover:bg-surface-50 rounded-xl transition-colors"
              >
                <Edit3 className="w-5 h-5 text-surface-400" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-surface-400" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {/* Status Dropdown */}
            <div className="relative group">
              <button className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${STATUS_CONFIG[task.status].color} flex items-center gap-2`}>
                {STATUS_CONFIG[task.status].label}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-surface-100 py-1 min-w-[140px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status as TaskStatus)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-surface-50 ${task.status === status ? 'font-semibold' : ''}`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="relative group">
              <button className={`px-3 py-1.5 rounded-lg text-sm font-semibold border flex items-center gap-2 ${PRIORITY_CONFIG[task.priority].color}`}>
                <PriorityIcon className="w-3.5 h-3.5" />
                {PRIORITY_CONFIG[task.priority].label}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-surface-100 py-1 min-w-[140px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={priority}
                      onClick={() => handlePriorityChange(priority as TaskPriority)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-surface-50 flex items-center gap-2 ${task.priority === priority ? 'font-semibold' : ''}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Story Points */}
            {task.storyPoints !== undefined && (
              <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold border border-indigo-200 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                {task.storyPoints} pts
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Left Panel - Content */}
          <div className="flex-1 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-surface-100">
            {/* Tabs */}
            <div className="flex gap-1 bg-surface-50 p-1 rounded-xl mb-4">
              {[
                { id: 'details', label: 'Details' },
                { id: 'comments', label: `Comments (${displayComments.length})` },
                { id: 'activity', label: 'Activity' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white shadow-soft text-brand-700' 
                      : 'text-surface-500 hover:text-brand-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Description</h4>
                  {isEditing ? (
                    <textarea
                      value={editedDescription}
                      onChange={e => setEditedDescription(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm resize-none"
                    />
                  ) : (
                    <div className="prose prose-sm max-w-none text-surface-700 bg-surface-50 p-4 rounded-xl">
                      {task.description.split('\n').map((line, i) => (
                        <p key={i} className="mb-2 last:mb-0">{line}</p>
                      ))}
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-2">
                    <SMButton
                      variant="primary"
                      size="sm"
                      onClick={handleSaveEdit}
                    >
                      Save Changes
                    </SMButton>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedTitle(task.title);
                        setEditedDescription(task.description);
                      }}
                      className="px-4 py-2 bg-surface-100 text-surface-700 rounded-xl text-sm font-semibold hover:bg-surface-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Linked Issues */}
                {linkedTasks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5" />
                      Linked Issues
                    </h4>
                    <div className="space-y-2">
                      {linkedTasks.map((link, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                          <span className="text-xs text-surface-500 capitalize">{link.type.replace('_', ' ')}</span>
                          <span className="text-sm font-mono text-brand-600">{link.task?.key}</span>
                          <span className="text-sm text-surface-700 flex-1 truncate">{link.task?.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_CONFIG[link.task?.status || 'todo'].color}`}>
                            {STATUS_CONFIG[link.task?.status || 'todo'].label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {task.attachments && task.attachments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5" />
                      Attachments ({task.attachments.length})
                    </h4>
                    <div className="space-y-2">
                      {task.attachments.map(att => (
                        <div key={att.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl hover:bg-surface-100 cursor-pointer">
                          <Paperclip className="w-4 h-4 text-surface-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-900 truncate">{att.name}</p>
                            <p className="text-xs text-surface-500">{att.size} • {att.uploadedBy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* Comment Input */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full px-4 py-3 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <SMButton
                        variant="primary"
                        size="sm"
                        leftIcon={<Send className="w-4 h-4" />}
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                      >
                        Send
                      </SMButton>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {displayComments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-surface-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-brand-900">{comment.author}</span>
                          <span className="text-xs text-surface-400">{formatTimestamp(comment.timestamp)}</span>
                        </div>
                        <p className="text-sm text-surface-700 bg-surface-50 p-3 rounded-xl">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {(displayComments.length === 0) && (
                    <div className="text-center py-8 text-surface-400">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No comments yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-3">
                {(task.activityLog || []).map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 py-2">
                    <div className="w-6 h-6 rounded-full bg-surface-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Activity className="w-3 h-3 text-surface-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-surface-700">
                        <span className="font-semibold text-brand-900">{activity.user}</span>
                        {' '}{activity.action}
                        {activity.field && (
                          <span className="text-surface-500"> {activity.field}</span>
                        )}
                        {activity.oldValue && activity.newValue && (
                          <>
                            <span className="text-surface-400"> from </span>
                            <span className="line-through text-surface-400">{activity.oldValue}</span>
                            <span className="text-surface-400"> to </span>
                            <span className="font-medium text-brand-700">{activity.newValue}</span>
                          </>
                        )}
                        {!activity.oldValue && activity.newValue && (
                          <span className="font-medium text-brand-700"> {activity.newValue}</span>
                        )}
                      </p>
                      <p className="text-xs text-surface-400 mt-0.5">{formatTimestamp(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
                {(!task.activityLog || task.activityLog.length === 0) && (
                  <div className="text-center py-8 text-surface-400">
                    <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity recorded</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Details */}
          <div className="w-full lg:w-72 p-4 lg:p-6 bg-surface-50/50 space-y-4">
            {/* Assignee */}
            <div>
              <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2 block">Assignee</label>
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-surface-200">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-brand-600" />
                </div>
                <span className="text-sm font-medium text-brand-900">{task.assignee}</span>
              </div>
            </div>

            {/* Reporter */}
            {task.reporter && (
              <div>
                <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2 block">Reporter</label>
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-surface-200">
                  <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-surface-500" />
                  </div>
                  <span className="text-sm text-surface-700">{task.reporter}</span>
                </div>
              </div>
            )}

            {/* Sprint */}
            {sprint && (
              <div>
                <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2 block">Sprint</label>
                <div className="p-3 bg-white rounded-xl border border-surface-200">
                  <p className="text-sm font-medium text-brand-900">{sprint.name}</p>
                  <p className="text-xs text-surface-500 mt-1">{sprint.startDate} - {sprint.endDate}</p>
                </div>
              </div>
            )}

            {/* Due Date */}
            <div>
              <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2 block">Due Date</label>
              <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-surface-200">
                <Calendar className="w-4 h-4 text-surface-400" />
                <span className={`text-sm font-medium ${
                  new Date(task.dueDate) < new Date() && task.status !== 'completed' 
                    ? 'text-red-600' 
                    : 'text-brand-900'
                }`}>
                  {formatDate(task.dueDate)}
                </span>
              </div>
            </div>

            {/* Time Tracking */}
            {(task.timeEstimate || task.timeSpent) && (
              <div>
                <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2 block">Time Tracking</label>
                <div className="p-3 bg-white rounded-xl border border-surface-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Logged</span>
                    <span className="font-medium text-brand-900">{task.timeSpent || 0}h</span>
                  </div>
                  <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${Math.min(((task.timeSpent || 0) / (task.timeEstimate || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-surface-400">
                    <span>Estimated: {task.timeEstimate || 0}h</span>
                    <span>{task.timeEstimate ? Math.round(((task.timeSpent || 0) / task.timeEstimate) * 100) : 0}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <div>
                <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2 block">Labels</label>
                <div className="flex flex-wrap gap-1.5">
                  {task.labels.map(label => (
                    <span key={label} className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-surface-600 border border-surface-200">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Watchers */}
            {task.watchers && task.watchers.length > 0 && (
              <div>
                <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Watchers ({task.watchers.length})
                </label>
                <div className="flex flex-wrap gap-1">
                  {task.watchers.map(watcher => (
                    <span key={watcher} className="px-2 py-1 bg-white rounded-lg text-xs text-surface-600 border border-surface-200">
                      {watcher.split(' ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="pt-4 border-t border-surface-200 space-y-2 text-xs text-surface-400">
              <div className="flex justify-between">
                <span>Created</span>
                <span>{formatDate(task.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span>{formatDate(task.updatedAt || task.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TaskDetailModal;
