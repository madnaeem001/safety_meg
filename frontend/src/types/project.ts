// Shared project management types used across agile components and pages.
// These are frontend domain types; for backend database records see apiService.ts.

export type TaskPriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'completed';
export type IssueType = 'epic' | 'story' | 'task' | 'subtask' | 'bug';

export interface Comment {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  timestamp: string;
  edited?: boolean;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  goal: string;
  status: 'future' | 'active' | 'completed';
}

export interface Epic {
  id: string;
  key: string;
  name: string;
  summary: string;
  color: string;
  status: TaskStatus;
}

export interface ProjectTask {
  id: string;
  key: string;
  title: string;
  description: string;
  issueType: IssueType;
  assignee: string;
  assigneeAvatar?: string;
  reporter: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  storyPoints?: number;
  epicId?: string;
  sprintId?: string;
  parentId?: string;
  labels: string[];
  components: string[];
  watchers: string[];
  timeEstimate?: number;
  timeSpent?: number;
  linkedIssues: { type: 'blocks' | 'blocked_by' | 'relates_to' | 'duplicates'; taskId: string }[];
  attachments: { id: string; name: string; size: string; uploadedAt: string; uploadedBy: string }[];
  comments: Comment[];
  activityLog: ActivityLog[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  taskIds: string[];
  owner: string;
}

export interface RetroItem {
  id: string;
  content: string;
  author: string;
  votes: number;
  category: 'went_well' | 'to_improve' | 'action_item';
  actionOwner?: string;
  actionDueDate?: string;
  actionStatus?: 'pending' | 'in_progress' | 'completed';
}

export interface SprintRetrospective {
  id: string;
  sprintId: string;
  sprintName: string;
  date: string;
  facilitator: string;
  participants: string[];
  items: RetroItem[];
  overallMood: 'great' | 'good' | 'neutral' | 'concerned';
  teamVelocity: number;
  completedPoints: number;
  plannedPoints: number;
}

export interface VelocityRecord {
  sprintId: string;
  sprintName: string;
  startDate: string;
  endDate: string;
  plannedPoints: number;
  completedPoints: number;
  teamSize: number;
  carryOver: number;
  addedMidSprint: number;
}

export interface GanttTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  dependencies: string[];
  assignee: string;
  color: string;
  milestone?: boolean;
  parentId?: string;
  collapsed?: boolean;
}
