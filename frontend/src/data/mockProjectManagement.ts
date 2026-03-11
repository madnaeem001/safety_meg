export interface ScheduleTask {
  id: string;
  task: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'On Track' | 'Delayed' | 'Completed';
}

export interface RFI {
  id: string;
  subject: string;
  from: string;
  to: string;
  dateSubmitted: string;
  dueDate: string;
  status: 'Open' | 'Closed' | 'Overdue';
}

// Legacy PROJECT_SCHEDULE and RFI_REGISTER exports for backward compatibility
export const PROJECT_SCHEDULE: ScheduleTask[] = [
  { id: 'SCH-001', task: 'Site Safety Plan Development', startDate: '2026-01-06', endDate: '2026-01-20', progress: 100, status: 'Completed' },
  { id: 'SCH-002', task: 'OSHA Training Program', startDate: '2026-01-15', endDate: '2026-02-15', progress: 60, status: 'On Track' },
  { id: 'SCH-003', task: 'Environmental Monitoring Setup', startDate: '2026-02-01', endDate: '2026-03-01', progress: 25, status: 'On Track' },
  { id: 'SCH-004', task: 'IoT Sensor Installation', startDate: '2026-02-15', endDate: '2026-03-15', progress: 10, status: 'Delayed' },
];

export const RFI_REGISTER: RFI[] = [
  { id: 'RFI-001', subject: 'Foundation reinforcement specs', from: 'Site Superintendent', to: 'Structural Engineer', dateSubmitted: '2026-01-15', dueDate: '2026-01-22', status: 'Closed' },
  { id: 'RFI-002', subject: 'HVAC duct routing conflict', from: 'MEP Contractor', to: 'MEP Engineer', dateSubmitted: '2026-01-28', dueDate: '2026-02-04', status: 'Open' },
  { id: 'RFI-003', subject: 'Crane load calculations', from: 'Rigging Supervisor', to: 'Safety Manager', dateSubmitted: '2026-02-01', dueDate: '2026-02-08', status: 'Open' },
];

// Project Task Management interfaces - Jira-like
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
  key: string; // e.g., "SAFE-123"
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
  // Jira-like fields
  storyPoints?: number;
  epicId?: string;
  sprintId?: string;
  parentId?: string; // For subtasks
  labels: string[];
  components: string[];
  watchers: string[];
  timeEstimate?: number; // in hours
  timeSpent?: number; // in hours
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

// Sprint Retrospective Types
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

// Velocity History for Forecasting
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

export const VELOCITY_HISTORY: VelocityRecord[] = [
  { sprintId: 'SP-001', sprintName: 'Sprint 18', startDate: '2025-11-01', endDate: '2025-11-14', plannedPoints: 42, completedPoints: 38, teamSize: 6, carryOver: 4, addedMidSprint: 3 },
  { sprintId: 'SP-002', sprintName: 'Sprint 19', startDate: '2025-11-15', endDate: '2025-11-28', plannedPoints: 40, completedPoints: 40, teamSize: 6, carryOver: 0, addedMidSprint: 2 },
  { sprintId: 'SP-003', sprintName: 'Sprint 20', startDate: '2025-12-01', endDate: '2025-12-14', plannedPoints: 45, completedPoints: 42, teamSize: 6, carryOver: 3, addedMidSprint: 5 },
  { sprintId: 'SP-004', sprintName: 'Sprint 21', startDate: '2025-12-15', endDate: '2025-12-28', plannedPoints: 38, completedPoints: 35, teamSize: 5, carryOver: 3, addedMidSprint: 0 },
  { sprintId: 'SP-005', sprintName: 'Sprint 22', startDate: '2026-01-06', endDate: '2026-01-19', plannedPoints: 44, completedPoints: 46, teamSize: 6, carryOver: 0, addedMidSprint: 4 },
  { sprintId: 'SP-006', sprintName: 'Sprint 23', startDate: '2026-01-20', endDate: '2026-02-02', plannedPoints: 48, completedPoints: 44, teamSize: 6, carryOver: 4, addedMidSprint: 2 },
];

export const SPRINT_RETROSPECTIVES: SprintRetrospective[] = [
  {
    id: 'RETRO-001',
    sprintId: 'SP-006',
    sprintName: 'Sprint 23',
    date: '2026-02-02',
    facilitator: 'John Smith',
    participants: ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Chen', 'Robert Wilson', 'Emily Chen'],
    items: [
      { id: 'RI-001', content: 'Great collaboration on the IoT integration', author: 'Lisa Chen', votes: 5, category: 'went_well' },
      { id: 'RI-002', content: 'Daily standups were efficient and focused', author: 'Sarah Johnson', votes: 4, category: 'went_well' },
      { id: 'RI-003', content: 'Need better documentation for new features', author: 'Mike Davis', votes: 3, category: 'to_improve' },
      { id: 'RI-004', content: 'Too many mid-sprint scope changes', author: 'Robert Wilson', votes: 6, category: 'to_improve' },
      { id: 'RI-005', content: 'Create documentation template for features', author: 'Emily Chen', votes: 4, category: 'action_item', actionOwner: 'Mike Davis', actionDueDate: '2026-02-10', actionStatus: 'pending' },
      { id: 'RI-006', content: 'Implement change request process', author: 'John Smith', votes: 5, category: 'action_item', actionOwner: 'John Smith', actionDueDate: '2026-02-15', actionStatus: 'in_progress' },
    ],
    overallMood: 'good',
    teamVelocity: 44,
    completedPoints: 44,
    plannedPoints: 48
  },
  {
    id: 'RETRO-002',
    sprintId: 'SP-005',
    sprintName: 'Sprint 22',
    date: '2026-01-19',
    facilitator: 'Sarah Johnson',
    participants: ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Chen', 'Robert Wilson', 'Emily Chen'],
    items: [
      { id: 'RI-007', content: 'Exceeded sprint goals - great team effort!', author: 'John Smith', votes: 6, category: 'went_well' },
      { id: 'RI-008', content: 'Code review process improved significantly', author: 'Lisa Chen', votes: 4, category: 'went_well' },
      { id: 'RI-009', content: 'Some blockers took too long to resolve', author: 'Emily Chen', votes: 3, category: 'to_improve' },
      { id: 'RI-010', content: 'Set up escalation path for blockers', author: 'Robert Wilson', votes: 4, category: 'action_item', actionOwner: 'Sarah Johnson', actionDueDate: '2026-01-25', actionStatus: 'completed' },
    ],
    overallMood: 'great',
    teamVelocity: 46,
    completedPoints: 46,
    plannedPoints: 44
  }
];

// Gantt Chart Data Structures
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

export const GANTT_TASKS: GanttTask[] = [
  { id: 'G-001', name: 'Q1 Safety Training Program', startDate: '2026-01-06', endDate: '2026-03-31', progress: 45, dependencies: [], assignee: 'Mike Davis', color: '#6366f1' },
  { id: 'G-002', name: 'OSHA Compliance Review', startDate: '2026-01-06', endDate: '2026-01-31', progress: 100, dependencies: [], assignee: 'John Smith', color: '#22c55e', parentId: 'G-001' },
  { id: 'G-003', name: 'Training Material Development', startDate: '2026-01-15', endDate: '2026-02-15', progress: 75, dependencies: ['G-002'], assignee: 'Mike Davis', color: '#3b82f6', parentId: 'G-001' },
  { id: 'G-004', name: 'Instructor Certification', startDate: '2026-02-01', endDate: '2026-02-28', progress: 30, dependencies: ['G-003'], assignee: 'Emily Chen', color: '#f59e0b', parentId: 'G-001' },
  { id: 'G-005', name: 'Pilot Training Sessions', startDate: '2026-02-15', endDate: '2026-03-15', progress: 0, dependencies: ['G-004'], assignee: 'Mike Davis', color: '#8b5cf6', parentId: 'G-001' },
  { id: 'G-006', name: 'Q1 Training Complete', startDate: '2026-03-31', endDate: '2026-03-31', progress: 0, dependencies: ['G-005'], assignee: 'John Smith', color: '#ef4444', milestone: true },
  
  { id: 'G-010', name: 'IoT Safety Monitoring System', startDate: '2026-01-20', endDate: '2026-04-30', progress: 25, dependencies: [], assignee: 'Lisa Chen', color: '#ec4899' },
  { id: 'G-011', name: 'Sensor Network Design', startDate: '2026-01-20', endDate: '2026-02-10', progress: 100, dependencies: [], assignee: 'Lisa Chen', color: '#14b8a6', parentId: 'G-010' },
  { id: 'G-012', name: 'Hardware Procurement', startDate: '2026-02-01', endDate: '2026-02-28', progress: 60, dependencies: ['G-011'], assignee: 'Robert Wilson', color: '#f97316', parentId: 'G-010' },
  { id: 'G-013', name: 'System Integration', startDate: '2026-02-15', endDate: '2026-03-31', progress: 10, dependencies: ['G-012'], assignee: 'Lisa Chen', color: '#84cc16', parentId: 'G-010' },
  { id: 'G-014', name: 'Testing & Validation', startDate: '2026-03-15', endDate: '2026-04-15', progress: 0, dependencies: ['G-013'], assignee: 'Sarah Johnson', color: '#06b6d4', parentId: 'G-010' },
  { id: 'G-015', name: 'Go-Live', startDate: '2026-04-30', endDate: '2026-04-30', progress: 0, dependencies: ['G-014'], assignee: 'Lisa Chen', color: '#ef4444', milestone: true },
  
  { id: 'G-020', name: 'Environmental Compliance Audit', startDate: '2026-02-01', endDate: '2026-03-15', progress: 35, dependencies: [], assignee: 'Sarah Johnson', color: '#10b981' },
  { id: 'G-021', name: 'Document Collection', startDate: '2026-02-01', endDate: '2026-02-14', progress: 100, dependencies: [], assignee: 'Sarah Johnson', color: '#a855f7', parentId: 'G-020' },
  { id: 'G-022', name: 'Site Inspections', startDate: '2026-02-10', endDate: '2026-02-28', progress: 50, dependencies: ['G-021'], assignee: 'Robert Wilson', color: '#0ea5e9', parentId: 'G-020' },
  { id: 'G-023', name: 'Report Generation', startDate: '2026-02-25', endDate: '2026-03-10', progress: 0, dependencies: ['G-022'], assignee: 'Emily Chen', color: '#f43f5e', parentId: 'G-020' },
  { id: 'G-024', name: 'Audit Complete', startDate: '2026-03-15', endDate: '2026-03-15', progress: 0, dependencies: ['G-023'], assignee: 'Sarah Johnson', color: '#ef4444', milestone: true },
];

// Milestones
export const MILESTONES: Milestone[] = [
  { id: 'M-001', title: 'Safety Dashboard MVP', description: 'Complete core dashboard with all key metrics', dueDate: '2026-02-16', status: 'in_progress', taskIds: ['PT-001', 'PT-007'], owner: 'John Smith' },
  { id: 'M-002', title: 'OSHA Compliance Ready', description: 'All OSHA 300 log features complete', dueDate: '2026-02-28', status: 'pending', taskIds: ['PT-002'], owner: 'Sarah Johnson' },
  { id: 'M-003', title: 'Training System Launch', description: 'Contractor orientation and training features live', dueDate: '2026-03-15', status: 'pending', taskIds: ['PT-003', 'PT-011'], owner: 'Mike Davis' },
];

// Sprints
export const SPRINTS: Sprint[] = [
  { id: 'sprint-1', name: 'Sprint 24', startDate: '2026-02-03', endDate: '2026-02-16', goal: 'Complete core safety dashboard features', status: 'active' },
  { id: 'sprint-2', name: 'Sprint 25', startDate: '2026-02-17', endDate: '2026-03-02', goal: 'Environmental monitoring integration', status: 'future' },
  { id: 'sprint-3', name: 'Sprint 26', startDate: '2026-03-03', endDate: '2026-03-16', goal: 'Mobile app enhancements', status: 'future' },
];

// Epics
export const EPICS: Epic[] = [
  { id: 'epic-1', key: 'SAFE-E1', name: 'Safety Dashboard', summary: 'Comprehensive safety metrics dashboard', color: '#6366f1', status: 'in_progress' },
  { id: 'epic-2', key: 'SAFE-E2', name: 'Incident Management', summary: 'End-to-end incident tracking system', color: '#22c55e', status: 'in_progress' },
  { id: 'epic-3', key: 'SAFE-E3', name: 'Environmental Monitoring', summary: 'Real-time environmental data tracking', color: '#f59e0b', status: 'todo' },
  { id: 'epic-4', key: 'SAFE-E4', name: 'Training & Compliance', summary: 'Training management and compliance tracking', color: '#ec4899', status: 'in_progress' },
  { id: 'epic-5', key: 'SAFE-E5', name: 'IoT Integration', summary: 'Safety sensor network integration', color: '#14b8a6', status: 'todo' },
  { id: 'epic-6', key: 'SAFE-E6', name: 'AI Workflow Automation', summary: 'AI-powered safety workflow orchestration — auto-assignment, risk scoring, predictive scheduling', color: '#06b6d4', status: 'in_progress' },
  { id: 'epic-7', key: 'SAFE-E7', name: 'Emergency Response AI', summary: 'AI emergency action plans, automated muster notifications, drill scheduling AI', color: '#ef4444', status: 'in_progress' },
  { id: 'epic-8', key: 'SAFE-E8', name: 'Ergonomics & Behavioral AI', summary: 'AI-powered ergonomic assessments, posture analysis, worker behavior coaching', color: '#d424ff', status: 'todo' },
  { id: 'epic-9', key: 'SAFE-E9', name: 'LOTO & Confined Space AI', summary: 'Digital lockout/tagout procedures with AI verification, confined space atmospheric AI monitoring', color: '#f59e0b', status: 'todo' },
];

// Initial Tasks
export const INITIAL_TASKS: ProjectTask[] = [
  {
    id: 'PT-001',
    key: 'SAFE-101',
    title: 'Implement real-time safety score widget',
    description: 'Create a widget that displays the current safety score with trend indicators and drill-down capability.',
    issueType: 'story',
    assignee: 'John Smith',
    reporter: 'Sarah Johnson',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-02-10',
    createdAt: '2026-01-28T09:00:00Z',
    updatedAt: '2026-02-03T14:30:00Z',
    tags: ['dashboard', 'metrics'],
    storyPoints: 8,
    epicId: 'epic-1',
    sprintId: 'sprint-1',
    labels: ['frontend', 'high-visibility'],
    components: ['Dashboard'],
    watchers: ['Mike Davis', 'Emily Chen'],
    timeEstimate: 16,
    timeSpent: 8,
    linkedIssues: [],
    attachments: [],
    comments: [
      { id: 'C-001', author: 'Sarah Johnson', content: 'Please include the 7-day trend line', timestamp: '2026-01-29T10:00:00Z' },
      { id: 'C-002', author: 'John Smith', content: 'Added trend visualization. Ready for review.', timestamp: '2026-02-02T16:00:00Z' }
    ],
    activityLog: [
      { id: 'AL-001', user: 'John Smith', action: 'created issue', timestamp: '2026-01-28T09:00:00Z' },
      { id: 'AL-002', user: 'John Smith', action: 'changed', field: 'status', oldValue: 'To Do', newValue: 'In Progress', timestamp: '2026-01-30T08:00:00Z' }
    ]
  },
  {
    id: 'PT-002',
    key: 'SAFE-102',
    title: 'Add OSHA 300 log export functionality',
    description: 'Enable exporting incident data in OSHA 300 log format for regulatory compliance.',
    issueType: 'story',
    assignee: 'Sarah Johnson',
    reporter: 'John Smith',
    priority: 'highest',
    status: 'review',
    dueDate: '2026-02-08',
    createdAt: '2026-01-25T11:00:00Z',
    updatedAt: '2026-02-04T09:00:00Z',
    tags: ['compliance', 'export'],
    storyPoints: 5,
    epicId: 'epic-2',
    sprintId: 'sprint-1',
    labels: ['backend', 'compliance'],
    components: ['Reports', 'Compliance'],
    watchers: ['Emily Chen'],
    timeEstimate: 10,
    timeSpent: 9,
    linkedIssues: [{ type: 'relates_to', taskId: 'PT-007' }],
    attachments: [{ id: 'A-001', name: 'OSHA_300_template.xlsx', size: '45KB', uploadedAt: '2026-01-26T10:00:00Z', uploadedBy: 'Sarah Johnson' }],
    comments: [],
    activityLog: []
  },
  {
    id: 'PT-003',
    key: 'SAFE-103',
    title: 'Create contractor orientation checklist',
    description: 'Build a digital checklist for contractor safety orientation with sign-off capability.',
    issueType: 'task',
    assignee: 'Mike Davis',
    reporter: 'Robert Wilson',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-02-12',
    createdAt: '2026-01-30T14:00:00Z',
    updatedAt: '2026-01-30T14:00:00Z',
    tags: ['training', 'contractors'],
    storyPoints: 3,
    epicId: 'epic-4',
    sprintId: 'sprint-1',
    labels: ['mobile'],
    components: ['Training'],
    watchers: [],
    linkedIssues: [],
    attachments: [],
    comments: [],
    activityLog: []
  },
  {
    id: 'PT-004',
    key: 'SAFE-104',
    title: 'Fix sensor data sync delay',
    description: 'IoT sensors showing 5-minute delay in dashboard updates. Should be real-time.',
    issueType: 'bug',
    assignee: 'Lisa Chen',
    reporter: 'John Smith',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-02-06',
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-02-03T11:00:00Z',
    tags: ['iot', 'bug', 'performance'],
    storyPoints: 5,
    epicId: 'epic-5',
    sprintId: 'sprint-1',
    labels: ['critical', 'backend'],
    components: ['IoT', 'Dashboard'],
    watchers: ['John Smith', 'Robert Wilson'],
    linkedIssues: [{ type: 'blocks', taskId: 'PT-010' }],
    attachments: [],
    comments: [
      { id: 'C-003', author: 'Lisa Chen', content: 'Found the issue - WebSocket connection pooling problem', timestamp: '2026-02-03T10:00:00Z' }
    ],
    activityLog: []
  },
  {
    id: 'PT-005',
    key: 'SAFE-105',
    title: 'Design near-miss reporting workflow',
    description: 'Create user flow and wireframes for the new near-miss reporting feature.',
    issueType: 'story',
    assignee: 'Emily Chen',
    reporter: 'Sarah Johnson',
    priority: 'medium',
    status: 'completed',
    dueDate: '2026-02-05',
    createdAt: '2026-01-22T10:00:00Z',
    updatedAt: '2026-02-04T15:00:00Z',
    tags: ['design', 'ux'],
    storyPoints: 5,
    epicId: 'epic-2',
    sprintId: 'sprint-1',
    labels: ['design'],
    components: ['Incident Management'],
    watchers: [],
    linkedIssues: [],
    attachments: [{ id: 'A-002', name: 'near_miss_wireframes.fig', size: '2.3MB', uploadedAt: '2026-02-04T14:00:00Z', uploadedBy: 'Emily Chen' }],
    comments: [],
    activityLog: []
  },
  {
    id: 'PT-006',
    key: 'SAFE-106',
    title: 'Implement critical lift JSA template',
    description: 'Create a specialized Job Safety Analysis template for critical lift operations.',
    issueType: 'story',
    assignee: 'Robert Wilson',
    reporter: 'John Smith',
    priority: 'high',
    status: 'todo',
    dueDate: '2026-02-14',
    createdAt: '2026-02-02T09:00:00Z',
    updatedAt: '2026-02-02T09:00:00Z',
    tags: ['jsa', 'construction'],
    storyPoints: 8,
    epicId: 'epic-1',
    sprintId: 'sprint-1',
    labels: ['safety-critical'],
    components: ['JSA', 'Templates'],
    watchers: ['Sarah Johnson'],
    linkedIssues: [],
    attachments: [],
    comments: [],
    activityLog: []
  },
  {
    id: 'PT-007',
    key: 'SAFE-107',
    title: 'Add DART rate calculation to KPI dashboard',
    description: 'Display Days Away, Restricted, or Transferred rate alongside TRIR.',
    issueType: 'task',
    assignee: 'Emily Chen',
    reporter: 'John Smith',
    priority: 'medium',
    status: 'in_progress',
    dueDate: '2026-02-11',
    createdAt: '2026-01-29T15:00:00Z',
    updatedAt: '2026-02-03T10:00:00Z',
    tags: ['kpi', 'metrics'],
    storyPoints: 3,
    epicId: 'epic-1',
    sprintId: 'sprint-1',
    labels: ['analytics'],
    components: ['Dashboard', 'KPI'],
    watchers: [],
    linkedIssues: [{ type: 'relates_to', taskId: 'PT-002' }],
    attachments: [],
    comments: [],
    activityLog: []
  },
  {
    id: 'PT-008',
    key: 'SAFE-108',
    title: 'Environmental sensor calibration alert system',
    description: 'Implement automated alerts when environmental sensors need calibration.',
    issueType: 'story',
    assignee: 'Sarah Johnson',
    reporter: 'Lisa Chen',
    priority: 'low',
    status: 'backlog',
    dueDate: '2026-03-01',
    createdAt: '2026-01-20T11:00:00Z',
    updatedAt: '2026-01-20T11:00:00Z',
    tags: ['environmental', 'sensors', 'alerts'],
    storyPoints: 5,
    epicId: 'epic-3',
    labels: ['backend', 'iot'],
    components: ['Environmental', 'Alerts'],
    watchers: [],
    linkedIssues: [],
    attachments: [],
    comments: [],
    activityLog: []
  },
  {
    id: 'PT-009',
    key: 'SAFE-109',
    title: 'Mobile offline mode for inspections',
    description: 'Enable inspectors to complete checklists offline and sync when connected.',
    issueType: 'epic',
    assignee: 'John Smith',
    reporter: 'Robert Wilson',
    priority: 'high',
    status: 'backlog',
    dueDate: '2026-03-15',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-15T09:00:00Z',
    tags: ['mobile', 'offline', 'pwa'],
    storyPoints: 21,
    labels: ['mobile', 'infrastructure'],
    components: ['Mobile App'],
    watchers: ['Lisa Chen', 'Mike Davis'],
    linkedIssues: [],
    attachments: [],
    comments: [],
    activityLog: []
  },
  {
    id: 'PT-010',
    key: 'SAFE-110',
    title: 'Real-time hazard zone mapping',
    description: 'Display live sensor data on facility map showing hazard zones.',
    issueType: 'story',
    assignee: 'Lisa Chen',
    reporter: 'John Smith',
    priority: 'medium',
    status: 'backlog',
    dueDate: '2026-03-10',
    createdAt: '2026-01-18T14:00:00Z',
    updatedAt: '2026-01-18T14:00:00Z',
    tags: ['iot', 'visualization', 'mapping'],
    storyPoints: 13,
    epicId: 'epic-5',
    labels: ['frontend', 'iot'],
    components: ['Dashboard', 'IoT'],
    watchers: [],
    linkedIssues: [{ type: 'blocked_by', taskId: 'PT-004' }],
    attachments: [],
    comments: [],
    activityLog: []
  },
  {
    id: 'PT-011',
    key: 'SAFE-111',
    title: 'Training completion reminder automation',
    description: 'Send automated reminders for upcoming and overdue training requirements.',
    issueType: 'task',
    assignee: 'Mike Davis',
    reporter: 'Emily Chen',
    priority: 'medium',
    status: 'backlog',
    dueDate: '2026-02-28',
    createdAt: '2026-01-25T16:00:00Z',
    updatedAt: '2026-01-25T16:00:00Z',
    tags: ['training', 'automation', 'notifications'],
    storyPoints: 5,
    epicId: 'epic-4',
    labels: ['backend', 'automation'],
    components: ['Training', 'Notifications'],
    watchers: [],
    linkedIssues: [],
    attachments: [],
    comments: [],
    activityLog: []
  },
  {
    id: 'PT-012',
    key: 'SAFE-112',
    title: 'SWPPP inspection form enhancement',
    description: 'Add photo capture and GPS tagging to stormwater inspection forms.',
    issueType: 'story',
    assignee: 'Robert Wilson',
    reporter: 'Sarah Johnson',
    priority: 'low',
    status: 'backlog',
    dueDate: '2026-03-20',
    createdAt: '2026-01-28T10:00:00Z',
    updatedAt: '2026-01-28T10:00:00Z',
    tags: ['environmental', 'mobile', 'forms'],
    storyPoints: 8,
    epicId: 'epic-3',
    labels: ['mobile', 'environmental'],
    components: ['Environmental', 'Forms'],
    watchers: [],
    linkedIssues: [],
    attachments: [],
    comments: [],
    activityLog: []
  }
];

// Construction Schedule Phases
export const CONSTRUCTION_PHASES: { id: string; name: string; description: string; startDate: string; endDate: string; progress: number; status: 'completed' | 'in_progress' | 'not_started'; deliverables: string[]; dependencies: string[]; risks: string[] }[] = [
  {
    id: 'PH-001',
    name: 'Preconstruction',
    description: 'Planning, permits, and site preparation',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    progress: 100,
    status: 'completed',
    deliverables: ['Approved permits', 'Signed contracts', 'Site safety plan'],
    dependencies: [],
    risks: ['Permit delays', 'Contract negotiations']
  },
  {
    id: 'PH-002',
    name: 'Site Work',
    description: 'Grading, utilities, and foundation prep',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    progress: 45,
    status: 'in_progress',
    deliverables: ['Grading completion report', 'Utility connections certified'],
    dependencies: ['PH-001'],
    risks: ['Soil conditions may require additional reinforcement', 'Weather delays possible']
  },
  {
    id: 'PH-003',
    name: 'Structural',
    description: 'Steel erection and concrete structure',
    startDate: '2026-03-01',
    endDate: '2026-04-30',
    progress: 0,
    status: 'not_started',
    deliverables: ['Structural inspection reports', 'Steel erection certification'],
    dependencies: ['PH-002'],
    risks: ['Critical lift operations require coordination', 'Material lead times']
  },
  {
    id: 'PH-004',
    name: 'MEP Rough-In',
    description: 'Mechanical, electrical, and plumbing rough installation',
    startDate: '2026-04-15',
    endDate: '2026-06-15',
    progress: 0,
    status: 'not_started',
    deliverables: ['MEP inspection reports', 'Fire suppression test reports'],
    dependencies: ['PH-003'],
    risks: ['Coordination between trades', 'Equipment delivery schedules']
  },
  {
    id: 'PH-005',
    name: 'Finishes & Commissioning',
    description: 'Interior finishes, systems testing, and handover',
    startDate: '2026-06-01',
    endDate: '2026-07-31',
    progress: 0,
    status: 'not_started',
    deliverables: ['Certificate of occupancy', 'Commissioning report', 'O&M manuals'],
    dependencies: ['PH-004'],
    risks: ['Punch list completion timeline', 'Final inspections scheduling']
  }
];

// Team Members for Capacity Planning
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  department: string;
  skills: string[];
  availableHoursPerWeek: number;
  allocatedHours: number; // Current sprint allocation
  maxCapacity: number; // Maximum hours per week
  currentLoad: number; // Percentage 0-100
  assignedTasks: string[];
  vacationDays: string[]; // ISO date strings
}

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'TM-001', name: 'John Smith', role: 'Safety Manager', department: 'EHS', skills: ['OSHA Compliance', 'Risk Assessment', 'Training'], availableHoursPerWeek: 40, allocatedHours: 32, maxCapacity: 40, currentLoad: 80, assignedTasks: ['PT-001', 'PT-009'], vacationDays: [] },
  { id: 'TM-002', name: 'Sarah Johnson', role: 'Environmental Lead', department: 'Environmental', skills: ['EPA Compliance', 'Audit Management', 'Sustainability'], availableHoursPerWeek: 40, allocatedHours: 24, maxCapacity: 40, currentLoad: 60, assignedTasks: ['PT-002', 'PT-006', 'PT-008'], vacationDays: ['2026-02-14', '2026-02-15'] },
  { id: 'TM-003', name: 'Mike Davis', role: 'Training Coordinator', department: 'HR', skills: ['Curriculum Development', 'OSHA Training', 'Contractor Orientation'], availableHoursPerWeek: 40, allocatedHours: 40, maxCapacity: 40, currentLoad: 100, assignedTasks: ['PT-003', 'PT-011'], vacationDays: [] },
  { id: 'TM-004', name: 'Lisa Chen', role: 'IoT Specialist', department: 'IT', skills: ['Sensor Networks', 'Data Analytics', 'System Integration', 'Bug Fixing'], availableHoursPerWeek: 32, allocatedHours: 20, maxCapacity: 40, currentLoad: 50, assignedTasks: ['PT-004', 'PT-007', 'PT-010'], vacationDays: [] },
  { id: 'TM-005', name: 'Robert Wilson', role: 'Rigging Supervisor', department: 'Operations', skills: ['Critical Lifts', 'JSA', 'SWPPP'], availableHoursPerWeek: 40, allocatedHours: 30, maxCapacity: 40, currentLoad: 75, assignedTasks: ['PT-006', 'PT-012'], vacationDays: ['2026-02-20'] },
  { id: 'TM-006', name: 'Emily Chen', role: 'Compliance Officer', department: 'EHS', skills: ['OSHA 300 Log', 'Incident Reporting', 'ISO 45001'], availableHoursPerWeek: 40, allocatedHours: 36, maxCapacity: 40, currentLoad: 90, assignedTasks: ['PT-007'], vacationDays: [] },
];

// WIP Limits Configuration
export interface WIPLimitConfig {
  columnId: string;
  limit: number;
  warningThreshold: number; // Percentage of limit to show warning
  enabled: boolean;
}

export const DEFAULT_WIP_LIMITS: WIPLimitConfig[] = [
  { columnId: 'todo', limit: 10, warningThreshold: 80, enabled: true },
  { columnId: 'in_progress', limit: 5, warningThreshold: 80, enabled: true },
  { columnId: 'review', limit: 3, warningThreshold: 80, enabled: true },
  { columnId: 'completed', limit: 0, warningThreshold: 100, enabled: false }, // No limit for done
];

// Resource allocation for project management
export interface Resource {
  id: string;
  name: string;
  role: string;
  department: string;
  availability: number; // percentage
  allocatedTasks: string[];
  skills: string[];
}

export const PROJECT_RESOURCES: Resource[] = [
  { id: 'R-001', name: 'John Smith', role: 'Safety Manager', department: 'EHS', availability: 80, allocatedTasks: ['PT-001', 'PT-009'], skills: ['OSHA Compliance', 'Risk Assessment', 'Training'] },
  { id: 'R-002', name: 'Sarah Johnson', role: 'Environmental Lead', department: 'Environmental', availability: 60, allocatedTasks: ['PT-002', 'PT-008'], skills: ['EPA Compliance', 'Audit Management', 'Sustainability'] },
  { id: 'R-003', name: 'Mike Davis', role: 'Training Coordinator', department: 'HR', availability: 100, allocatedTasks: ['PT-003', 'PT-011'], skills: ['Curriculum Development', 'OSHA Training', 'Contractor Orientation'] },
  { id: 'R-004', name: 'Lisa Chen', role: 'IoT Specialist', department: 'IT', availability: 50, allocatedTasks: ['PT-004', 'PT-010'], skills: ['Sensor Networks', 'Data Analytics', 'System Integration'] },
  { id: 'R-005', name: 'Robert Wilson', role: 'Rigging Supervisor', department: 'Operations', availability: 75, allocatedTasks: ['PT-006', 'PT-012'], skills: ['Critical Lifts', 'JSA', 'SWPPP'] },
  { id: 'R-006', name: 'Emily Chen', role: 'Compliance Officer', department: 'EHS', availability: 90, allocatedTasks: ['PT-007'], skills: ['OSHA 300 Log', 'Incident Reporting', 'ISO 45001'] },
];

// Budget tracking for project management
export interface BudgetItem {
  id: string;
  category: string;
  description: string;
  allocated: number;
  spent: number;
  committed: number;
  forecast: number;
}

export const PROJECT_BUDGET: BudgetItem[] = [
  { id: 'B-001', category: 'Safety Equipment', description: 'PPE, signage, barriers', allocated: 45000, spent: 32500, committed: 8000, forecast: 42000 },
  { id: 'B-002', category: 'Training', description: 'OSHA certifications, contractor orientation', allocated: 28000, spent: 12000, committed: 5500, forecast: 26500 },
  { id: 'B-003', category: 'Environmental Compliance', description: 'Monitoring, permits, testing', allocated: 35000, spent: 18000, committed: 7000, forecast: 33000 },
  { id: 'B-004', category: 'IoT Systems', description: 'Sensors, software, integration', allocated: 55000, spent: 42000, committed: 8500, forecast: 54000 },
  { id: 'B-005', category: 'Consultants', description: 'External safety auditors', allocated: 20000, spent: 8000, committed: 6000, forecast: 18500 },
  { id: 'B-006', category: 'Contingency', description: 'Emergency/unexpected costs', allocated: 15000, spent: 2500, committed: 0, forecast: 8000 },
];

// Risk register for project management
export interface ProjectRisk {
  id: string;
  title: string;
  description: string;
  category: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  status: 'identified' | 'mitigating' | 'closed';
  owner: string;
  mitigationPlan: string;
}

export const PROJECT_RISKS: ProjectRisk[] = [
  { id: 'PR-001', title: 'Critical lift weather delay', description: 'Adverse weather may delay crane operations', category: 'Schedule', probability: 'medium', impact: 'high', status: 'mitigating', owner: 'Robert Wilson', mitigationPlan: 'Monitor weather forecasts, have backup dates identified' },
  { id: 'PR-002', title: 'OSHA inspection findings', description: 'Potential citations during OSHA inspection', category: 'Compliance', probability: 'low', impact: 'high', status: 'mitigating', owner: 'John Smith', mitigationPlan: 'Pre-inspection audits, documentation review' },
  { id: 'PR-003', title: 'Contractor training gaps', description: 'Contractors may not meet safety training requirements', category: 'Safety', probability: 'medium', impact: 'medium', status: 'identified', owner: 'Mike Davis', mitigationPlan: 'Implement mandatory orientation program' },
  { id: 'PR-004', title: 'Sensor integration issues', description: 'IoT sensors may have compatibility problems', category: 'Technical', probability: 'low', impact: 'medium', status: 'closed', owner: 'Lisa Chen', mitigationPlan: 'Vendor certification, pilot testing completed' },
  { id: 'PR-005', title: 'Environmental permit delays', description: 'Regulatory approval timeline uncertainty', category: 'Compliance', probability: 'medium', impact: 'high', status: 'mitigating', owner: 'Sarah Johnson', mitigationPlan: 'Early application, agency relationship management' },
];

// Enhanced RFI Register for Construction
export interface EnhancedRFI {
  id: string;
  number: string;
  subject: string;
  question: string;
  from: string;
  to: string;
  dateSubmitted: string;
  dateDue: string;
  dateResponded?: string;
  status: 'Draft' | 'Open' | 'Pending' | 'Closed' | 'Overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'Design' | 'Construction' | 'Safety' | 'Environmental' | 'Permits' | 'Other';
  costImpact?: number;
  scheduleImpact?: number; // days
  response?: string;
  attachments?: string[];
  relatedDrawings?: string[];
}

// Team Availability Calendar
export interface TeamAvailability {
  memberId: string;
  memberName: string;
  role: string;
  department: string;
  schedule: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  date: string;
  status: 'available' | 'busy' | 'vacation' | 'sick' | 'training' | 'partial';
  hours: number;
  notes?: string;
}

export const TEAM_AVAILABILITY: TeamAvailability[] = [
  {
    memberId: 'TM-001',
    memberName: 'John Smith',
    role: 'Safety Manager',
    department: 'EHS',
    schedule: [
      { date: '2026-02-03', status: 'available', hours: 8 },
      { date: '2026-02-04', status: 'available', hours: 8 },
      { date: '2026-02-05', status: 'partial', hours: 4, notes: 'OSHA training in afternoon' },
      { date: '2026-02-06', status: 'available', hours: 8 },
      { date: '2026-02-07', status: 'available', hours: 8 },
      { date: '2026-02-10', status: 'busy', hours: 0, notes: 'Site inspection' },
      { date: '2026-02-11', status: 'available', hours: 8 },
      { date: '2026-02-12', status: 'available', hours: 8 },
      { date: '2026-02-13', status: 'available', hours: 8 },
      { date: '2026-02-14', status: 'vacation', hours: 0, notes: 'PTO' },
    ]
  },
  {
    memberId: 'TM-002',
    memberName: 'Sarah Johnson',
    role: 'Environmental Lead',
    department: 'Environmental',
    schedule: [
      { date: '2026-02-03', status: 'available', hours: 8 },
      { date: '2026-02-04', status: 'training', hours: 0, notes: 'EPA certification' },
      { date: '2026-02-05', status: 'training', hours: 0, notes: 'EPA certification' },
      { date: '2026-02-06', status: 'available', hours: 8 },
      { date: '2026-02-07', status: 'available', hours: 8 },
      { date: '2026-02-10', status: 'available', hours: 8 },
      { date: '2026-02-11', status: 'partial', hours: 6, notes: 'Doctor appointment' },
      { date: '2026-02-12', status: 'available', hours: 8 },
      { date: '2026-02-13', status: 'vacation', hours: 0 },
      { date: '2026-02-14', status: 'vacation', hours: 0 },
    ]
  },
  {
    memberId: 'TM-003',
    memberName: 'Mike Davis',
    role: 'Training Coordinator',
    department: 'HR',
    schedule: [
      { date: '2026-02-03', status: 'available', hours: 8 },
      { date: '2026-02-04', status: 'available', hours: 8 },
      { date: '2026-02-05', status: 'available', hours: 8 },
      { date: '2026-02-06', status: 'busy', hours: 0, notes: 'Contractor orientation' },
      { date: '2026-02-07', status: 'busy', hours: 0, notes: 'Contractor orientation' },
      { date: '2026-02-10', status: 'available', hours: 8 },
      { date: '2026-02-11', status: 'available', hours: 8 },
      { date: '2026-02-12', status: 'sick', hours: 0 },
      { date: '2026-02-13', status: 'available', hours: 8 },
      { date: '2026-02-14', status: 'available', hours: 8 },
    ]
  },
  {
    memberId: 'TM-004',
    memberName: 'Lisa Chen',
    role: 'IoT Specialist',
    department: 'IT',
    schedule: [
      { date: '2026-02-03', status: 'available', hours: 8 },
      { date: '2026-02-04', status: 'available', hours: 8 },
      { date: '2026-02-05', status: 'available', hours: 8 },
      { date: '2026-02-06', status: 'available', hours: 8 },
      { date: '2026-02-07', status: 'partial', hours: 4, notes: 'Remote work' },
      { date: '2026-02-10', status: 'available', hours: 8 },
      { date: '2026-02-11', status: 'available', hours: 8 },
      { date: '2026-02-12', status: 'available', hours: 8 },
      { date: '2026-02-13', status: 'available', hours: 8 },
      { date: '2026-02-14', status: 'available', hours: 8 },
    ]
  },
  {
    memberId: 'TM-005',
    memberName: 'Robert Wilson',
    role: 'Rigging Supervisor',
    department: 'Operations',
    schedule: [
      { date: '2026-02-03', status: 'available', hours: 8 },
      { date: '2026-02-04', status: 'available', hours: 8 },
      { date: '2026-02-05', status: 'busy', hours: 0, notes: 'Critical lift planning' },
      { date: '2026-02-06', status: 'available', hours: 8 },
      { date: '2026-02-07', status: 'available', hours: 8 },
      { date: '2026-02-10', status: 'available', hours: 8 },
      { date: '2026-02-11', status: 'available', hours: 8 },
      { date: '2026-02-12', status: 'available', hours: 8 },
      { date: '2026-02-13', status: 'available', hours: 8 },
      { date: '2026-02-14', status: 'available', hours: 8 },
    ]
  },
  {
    memberId: 'TM-006',
    memberName: 'Emily Chen',
    role: 'Compliance Officer',
    department: 'EHS',
    schedule: [
      { date: '2026-02-03', status: 'available', hours: 8 },
      { date: '2026-02-04', status: 'available', hours: 8 },
      { date: '2026-02-05', status: 'available', hours: 8 },
      { date: '2026-02-06', status: 'available', hours: 8 },
      { date: '2026-02-07', status: 'available', hours: 8 },
      { date: '2026-02-10', status: 'vacation', hours: 0, notes: 'Family event' },
      { date: '2026-02-11', status: 'available', hours: 8 },
      { date: '2026-02-12', status: 'partial', hours: 6, notes: 'Audit prep' },
      { date: '2026-02-13', status: 'available', hours: 8 },
      { date: '2026-02-14', status: 'available', hours: 8 },
    ]
  },
];

// Risk Prediction AI Data
export interface RiskPrediction {
  id: string;
  taskId: string;
  taskTitle: string;
  riskType: 'delay' | 'blocker' | 'scope_creep' | 'resource' | 'quality' | 'dependency';
  probability: number; // 0-100
  impact: 'low' | 'medium' | 'high' | 'critical';
  predictedDate?: string;
  factors: string[];
  recommendations: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
  confidence: number; // 0-100
}

export const RISK_PREDICTIONS: RiskPrediction[] = [
  {
    id: 'RP-001',
    taskId: 'PT-004',
    taskTitle: 'Fix sensor data sync delay',
    riskType: 'blocker',
    probability: 75,
    impact: 'high',
    predictedDate: '2026-02-08',
    factors: ['WebSocket complexity', 'Dependency on PT-010', 'Limited testing time'],
    recommendations: ['Allocate additional debugging time', 'Pair programming with backend team', 'Set up automated testing'],
    trend: 'stable',
    confidence: 85
  },
  {
    id: 'RP-002',
    taskId: 'PT-006',
    taskTitle: 'Implement critical lift JSA template',
    riskType: 'delay',
    probability: 60,
    impact: 'medium',
    predictedDate: '2026-02-16',
    factors: ['High story points (8)', 'Dependencies on safety review', 'Complex approval workflow'],
    recommendations: ['Break into smaller subtasks', 'Get early stakeholder review', 'Prioritize core features first'],
    trend: 'increasing',
    confidence: 72
  },
  {
    id: 'RP-003',
    taskId: 'PT-003',
    taskTitle: 'Create contractor orientation checklist',
    riskType: 'scope_creep',
    probability: 45,
    impact: 'medium',
    factors: ['Vague requirements', 'Multiple stakeholders', 'Integration with training system'],
    recommendations: ['Define clear acceptance criteria', 'Lock requirements before sprint mid-point', 'Timebox feature additions'],
    trend: 'decreasing',
    confidence: 68
  },
  {
    id: 'RP-004',
    taskId: 'PT-010',
    taskTitle: 'Real-time hazard zone mapping',
    riskType: 'dependency',
    probability: 80,
    impact: 'high',
    predictedDate: '2026-02-10',
    factors: ['Blocked by PT-004', 'IoT integration complexity', 'Mapping library limitations'],
    recommendations: ['Resolve blocker PT-004 urgently', 'Consider alternative mapping solutions', 'Develop with mock data first'],
    trend: 'increasing',
    confidence: 90
  },
  {
    id: 'RP-005',
    taskId: 'PT-009',
    taskTitle: 'Mobile offline mode for inspections',
    riskType: 'resource',
    probability: 55,
    impact: 'high',
    factors: ['Large epic (21 SP)', 'Requires specialized mobile expertise', 'Sync complexity'],
    recommendations: ['Consider hiring mobile contractor', 'Phase implementation across 2 sprints', 'Leverage existing PWA capabilities'],
    trend: 'stable',
    confidence: 78
  },
  {
    id: 'RP-006',
    taskId: 'PT-007',
    taskTitle: 'Add DART rate calculation to KPI dashboard',
    riskType: 'quality',
    probability: 35,
    impact: 'low',
    factors: ['Complex calculations', 'Data validation requirements', 'Regulatory compliance'],
    recommendations: ['Add comprehensive unit tests', 'Cross-reference with OSHA guidelines', 'Peer review calculations'],
    trend: 'decreasing',
    confidence: 82
  },
];

// Sprint Risk Summary
export interface SprintRiskSummary {
  sprintId: string;
  overallRiskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  completionProbability: number; // 0-100
  projectedVelocity: number;
  blockedTasks: number;
  atRiskTasks: number;
  aiInsights: string[];
}

export const SPRINT_RISK_SUMMARY: SprintRiskSummary = {
  sprintId: 'sprint-1',
  overallRiskScore: 42,
  riskLevel: 'medium',
  completionProbability: 78,
  projectedVelocity: 38,
  blockedTasks: 1,
  atRiskTasks: 3,
  aiInsights: [
    'Dependency chain between PT-004 → PT-010 poses highest risk to sprint completion',
    'Team velocity trending upward - 15% improvement over last 3 sprints',
    'Consider re-assigning PT-003 due to Mike Davis at 100% capacity',
    'Early warning: Critical lift JSA may need requirements review by Feb 10'
  ]
};

// EHS Benchmarks
export interface EHSBenchmark {
  id: string;
  metric: string;
  category: 'safety' | 'environmental' | 'health' | 'compliance';
  currentValue: number;
  industryAverage: number;
  bestInClass: number;
  unit: string;
  trend: 'improving' | 'stable' | 'declining';
  percentile: number; // 0-100, where you stand vs industry
}

export const EHS_BENCHMARKS: EHSBenchmark[] = [
  { id: 'BM-001', metric: 'Total Recordable Incident Rate', category: 'safety', currentValue: 2.8, industryAverage: 3.4, bestInClass: 1.2, unit: 'per 100 workers', trend: 'improving', percentile: 72 },
  { id: 'BM-002', metric: 'Days Away Rate', category: 'safety', currentValue: 1.1, industryAverage: 1.8, bestInClass: 0.5, unit: 'per 100 workers', trend: 'improving', percentile: 68 },
  { id: 'BM-003', metric: 'Near Miss Reporting Rate', category: 'safety', currentValue: 12.5, industryAverage: 8.2, bestInClass: 18.0, unit: 'per month', trend: 'improving', percentile: 78 },
  { id: 'BM-004', metric: 'Safety Training Completion', category: 'compliance', currentValue: 92, industryAverage: 85, bestInClass: 99, unit: '%', trend: 'stable', percentile: 74 },
  { id: 'BM-005', metric: 'OSHA Compliance Score', category: 'compliance', currentValue: 97, industryAverage: 88, bestInClass: 100, unit: '%', trend: 'improving', percentile: 85 },
  { id: 'BM-006', metric: 'Carbon Emissions Intensity', category: 'environmental', currentValue: 42, industryAverage: 58, bestInClass: 28, unit: 'tCO2e/M$', trend: 'improving', percentile: 76 },
  { id: 'BM-007', metric: 'Waste Diversion Rate', category: 'environmental', currentValue: 78, industryAverage: 62, bestInClass: 92, unit: '%', trend: 'stable', percentile: 80 },
  { id: 'BM-008', metric: 'Water Usage Efficiency', category: 'environmental', currentValue: 85, industryAverage: 72, bestInClass: 95, unit: '% efficiency', trend: 'improving', percentile: 82 },
  { id: 'BM-009', metric: 'Contractor Safety Score', category: 'safety', currentValue: 88, industryAverage: 79, bestInClass: 96, unit: '%', trend: 'stable', percentile: 75 },
  { id: 'BM-010', metric: 'Incident Investigation Time', category: 'compliance', currentValue: 2.5, industryAverage: 4.2, bestInClass: 1.0, unit: 'days avg', trend: 'improving', percentile: 79 },
];

// EHS Benchmark History for Trend Charts
export interface BenchmarkHistoryPoint {
  date: string;
  value: number;
  industryAvg: number;
}

export interface EHSBenchmarkHistory {
  metricId: string;
  history: BenchmarkHistoryPoint[];
}

export const EHS_BENCHMARK_HISTORY: EHSBenchmarkHistory[] = [
  {
    metricId: 'BM-001', // TRIR
    history: [
      { date: '2025-09', value: 3.6, industryAvg: 3.5 },
      { date: '2025-10', value: 3.4, industryAvg: 3.5 },
      { date: '2025-11', value: 3.2, industryAvg: 3.4 },
      { date: '2025-12', value: 3.0, industryAvg: 3.4 },
      { date: '2026-01', value: 2.9, industryAvg: 3.4 },
      { date: '2026-02', value: 2.8, industryAvg: 3.4 },
    ]
  },
  {
    metricId: 'BM-005', // Compliance
    history: [
      { date: '2025-09', value: 88, industryAvg: 86 },
      { date: '2025-10', value: 90, industryAvg: 87 },
      { date: '2025-11', value: 93, industryAvg: 87 },
      { date: '2025-12', value: 94, industryAvg: 88 },
      { date: '2026-01', value: 96, industryAvg: 88 },
      { date: '2026-02', value: 97, industryAvg: 88 },
    ]
  },
  {
    metricId: 'BM-006', // Emissions
    history: [
      { date: '2025-09', value: 52, industryAvg: 60 },
      { date: '2025-10', value: 50, industryAvg: 59 },
      { date: '2025-11', value: 48, industryAvg: 59 },
      { date: '2025-12', value: 46, industryAvg: 58 },
      { date: '2026-01', value: 44, industryAvg: 58 },
      { date: '2026-02', value: 42, industryAvg: 58 },
    ]
  },
  {
    metricId: 'BM-003', // Near Miss
    history: [
      { date: '2025-09', value: 8.5, industryAvg: 7.8 },
      { date: '2025-10', value: 9.2, industryAvg: 8.0 },
      { date: '2025-11', value: 10.1, industryAvg: 8.1 },
      { date: '2025-12', value: 11.0, industryAvg: 8.1 },
      { date: '2026-01', value: 11.8, industryAvg: 8.2 },
      { date: '2026-02', value: 12.5, industryAvg: 8.2 },
    ]
  },
];

// Sprint Health Score Data
export interface SprintHealthMetric {
  id: string;
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  status: 'healthy' | 'warning' | 'critical';
  details: string;
}

export interface SprintHealth {
  sprintId: string;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: SprintHealthMetric[];
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export const SPRINT_HEALTH: SprintHealth = {
  sprintId: 'sprint-1',
  overallScore: 78,
  grade: 'B',
  metrics: [
    { id: 'SH-001', name: 'Velocity Consistency', score: 85, weight: 0.2, status: 'healthy', details: 'Team delivering within 10% of average velocity' },
    { id: 'SH-002', name: 'Scope Stability', score: 70, weight: 0.15, status: 'warning', details: '2 tasks added mid-sprint' },
    { id: 'SH-003', name: 'Blocker Resolution', score: 65, weight: 0.2, status: 'warning', details: '1 blocker open for 3+ days' },
    { id: 'SH-004', name: 'Code Quality', score: 90, weight: 0.15, status: 'healthy', details: 'All PRs passing quality gates' },
    { id: 'SH-005', name: 'Team Utilization', score: 75, weight: 0.15, status: 'warning', details: '1 team member at 100% capacity' },
    { id: 'SH-006', name: 'On-Time Delivery', score: 82, weight: 0.15, status: 'healthy', details: 'Projected to complete 85% of planned work' },
  ],
  trend: 'improving',
  recommendations: [
    'Address the PT-004 blocker to unblock dependent tasks',
    'Consider redistributing work from Mike Davis who is overloaded',
    'Lock sprint scope to prevent additional mid-sprint changes'
  ]
};

// Resource Capacity Alerts
export interface CapacityAlert {
  id: string;
  memberId: string;
  memberName: string;
  type: 'overloaded' | 'underutilized' | 'vacation_conflict' | 'skill_gap' | 'blocker';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: string;
  suggestedAction: string;
  relatedTasks: string[];
  createdAt: string;
}

export const CAPACITY_ALERTS: CapacityAlert[] = [
  {
    id: 'CA-001',
    memberId: 'TM-003',
    memberName: 'Mike Davis',
    type: 'overloaded',
    severity: 'high',
    message: 'Mike Davis is at 100% capacity',
    details: 'Allocated 40 hours with no buffer. Any new tasks will cause delays.',
    suggestedAction: 'Reassign PT-003 (3 SP) to another team member',
    relatedTasks: ['PT-003', 'PT-011'],
    createdAt: '2026-02-05T08:00:00Z'
  },
  {
    id: 'CA-002',
    memberId: 'TM-002',
    memberName: 'Sarah Johnson',
    type: 'vacation_conflict',
    severity: 'medium',
    message: 'Sarah Johnson has PTO during sprint end',
    details: 'Vacation scheduled Feb 13-14 may impact review cycle for PT-002',
    suggestedAction: 'Ensure PT-002 review is completed by Feb 12',
    relatedTasks: ['PT-002', 'PT-006'],
    createdAt: '2026-02-04T14:00:00Z'
  },
  {
    id: 'CA-003',
    memberId: 'TM-004',
    memberName: 'Lisa Chen',
    type: 'blocker',
    severity: 'critical',
    message: 'Lisa Chen blocked on PT-004',
    details: 'WebSocket issue blocking IoT sensor integration for 2+ days',
    suggestedAction: 'Escalate to tech lead or pair with backend developer',
    relatedTasks: ['PT-004', 'PT-010'],
    createdAt: '2026-02-05T10:00:00Z'
  },
  {
    id: 'CA-004',
    memberId: 'TM-005',
    memberName: 'Robert Wilson',
    type: 'skill_gap',
    severity: 'low',
    message: 'Robert Wilson may need support on PT-006',
    details: 'Critical lift JSA requires ISO 45001 knowledge',
    suggestedAction: 'Consider pairing with Sarah Johnson for compliance review',
    relatedTasks: ['PT-006'],
    createdAt: '2026-02-03T11:00:00Z'
  },
  {
    id: 'CA-005',
    memberId: 'TM-001',
    memberName: 'John Smith',
    type: 'underutilized',
    severity: 'low',
    message: 'John Smith has 8 hours buffer this sprint',
    details: 'Available capacity could absorb additional work if needed',
    suggestedAction: 'Consider assigning PT-003 from Mike Davis',
    relatedTasks: ['PT-001', 'PT-009'],
    createdAt: '2026-02-04T09:00:00Z'
  },
];

// Industrial Hygiene & Occupational Health Data
export interface SimilarExposureGroup {
  id: string;
  name: string;
  description: string;
  jobRoles: string[];
  exposureType: 'noise' | 'chemical' | 'air_quality' | 'radiation' | 'biological';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  samplingFrequency: string;
  lastSampled: string;
  nextSampling: string;
  averageExposure: number;
  exposureLimit: number;
  unit: string;
}

export const SIMILAR_EXPOSURE_GROUPS: SimilarExposureGroup[] = [
  { id: 'SEG-001', name: 'Production Line Workers', description: 'Workers on main assembly line', jobRoles: ['Assembler', 'Line Supervisor', 'Quality Inspector'], exposureType: 'noise', riskLevel: 'medium', samplingFrequency: 'Quarterly', lastSampled: '2025-11-15', nextSampling: '2026-02-15', averageExposure: 82, exposureLimit: 85, unit: 'dBA' },
  { id: 'SEG-002', name: 'Welding Team', description: 'Metal fabrication and welding operations', jobRoles: ['Welder', 'Fabricator', 'Grinder'], exposureType: 'air_quality', riskLevel: 'high', samplingFrequency: 'Monthly', lastSampled: '2026-01-10', nextSampling: '2026-02-10', averageExposure: 4.2, exposureLimit: 5, unit: 'mg/m³' },
  { id: 'SEG-003', name: 'Laboratory Technicians', description: 'Chemical testing and analysis', jobRoles: ['Lab Technician', 'Chemist', 'QC Analyst'], exposureType: 'chemical', riskLevel: 'medium', samplingFrequency: 'Quarterly', lastSampled: '2025-12-01', nextSampling: '2026-03-01', averageExposure: 12, exposureLimit: 50, unit: 'ppm' },
  { id: 'SEG-004', name: 'Painting Operations', description: 'Spray painting and coating', jobRoles: ['Painter', 'Coating Specialist'], exposureType: 'chemical', riskLevel: 'high', samplingFrequency: 'Monthly', lastSampled: '2026-01-20', nextSampling: '2026-02-20', averageExposure: 180, exposureLimit: 200, unit: 'ppm' },
];

export interface MedicalSurveillanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  examType: 'annual_physical' | 'audiogram' | 'pulmonary_function' | 'vision' | 'vaccination' | 'blood_test';
  status: 'current' | 'due_soon' | 'overdue' | 'scheduled';
  lastExam: string;
  nextDue: string;
  provider: string;
  notes?: string;
}

export const MEDICAL_SURVEILLANCE: MedicalSurveillanceRecord[] = [
  { id: 'MS-001', employeeId: 'EMP-101', employeeName: 'John Smith', examType: 'annual_physical', status: 'current', lastExam: '2025-08-15', nextDue: '2026-08-15', provider: 'Occupational Health Clinic' },
  { id: 'MS-002', employeeId: 'EMP-101', employeeName: 'John Smith', examType: 'audiogram', status: 'due_soon', lastExam: '2025-02-20', nextDue: '2026-02-20', provider: 'Hearing Conservation Center' },
  { id: 'MS-003', employeeId: 'EMP-102', employeeName: 'Sarah Johnson', examType: 'pulmonary_function', status: 'current', lastExam: '2025-11-10', nextDue: '2026-11-10', provider: 'Pulmonary Associates' },
  { id: 'MS-004', employeeId: 'EMP-103', employeeName: 'Mike Davis', examType: 'vaccination', status: 'overdue', lastExam: '2024-01-15', nextDue: '2025-01-15', provider: 'Employee Health Services', notes: 'Tetanus booster required' },
  { id: 'MS-005', employeeId: 'EMP-104', employeeName: 'Lisa Chen', examType: 'vision', status: 'scheduled', lastExam: '2025-06-01', nextDue: '2026-02-10', provider: 'Vision Care Center' },
];

export interface WellnessCheckIn {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  fatigueLevel: 1 | 2 | 3 | 4 | 5;
  stressLevel: 1 | 2 | 3 | 4 | 5;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  physicalDiscomfort: boolean;
  mentalHealthConcerns: boolean;
  notes?: string;
  followUpRequired: boolean;
}

export const WELLNESS_CHECKINS: WellnessCheckIn[] = [
  { id: 'WC-001', date: '2026-02-05', employeeId: 'EMP-101', employeeName: 'John Smith', fatigueLevel: 2, stressLevel: 3, sleepQuality: 4, physicalDiscomfort: false, mentalHealthConcerns: false, followUpRequired: false },
  { id: 'WC-002', date: '2026-02-05', employeeId: 'EMP-103', employeeName: 'Mike Davis', fatigueLevel: 4, stressLevel: 4, sleepQuality: 2, physicalDiscomfort: false, mentalHealthConcerns: true, notes: 'Feeling overwhelmed with workload', followUpRequired: true },
  { id: 'WC-003', date: '2026-02-05', employeeId: 'EMP-105', employeeName: 'Robert Wilson', fatigueLevel: 3, stressLevel: 2, sleepQuality: 4, physicalDiscomfort: true, mentalHealthConcerns: false, notes: 'Lower back pain from lifting', followUpRequired: true },
];

// Emissions Tracking
export interface EmissionsData {
  month: string;
  scope1: number; // Direct emissions
  scope2: number; // Indirect (electricity)
  scope3: number; // Value chain
  total: number;
  target: number;
}

export const EMISSIONS_TRACKING: EmissionsData[] = [
  { month: '2025-09', scope1: 120, scope2: 85, scope3: 210, total: 415, target: 450 },
  { month: '2025-10', scope1: 115, scope2: 82, scope3: 205, total: 402, target: 440 },
  { month: '2025-11', scope1: 112, scope2: 78, scope3: 198, total: 388, target: 430 },
  { month: '2025-12', scope1: 108, scope2: 75, scope3: 190, total: 373, target: 420 },
  { month: '2026-01', scope1: 105, scope2: 72, scope3: 185, total: 362, target: 410 },
  { month: '2026-02', scope1: 102, scope2: 70, scope3: 180, total: 352, target: 400 },
];

// IoT Wearable & Sensor Data
export interface WearableAlert {
  id: string;
  workerId: string;
  workerName: string;
  deviceType: 'smart_hardhat' | 'vital_monitor' | 'gas_detector' | 'location_beacon';
  alertType: 'high_heart_rate' | 'fatigue_detected' | 'gas_exposure' | 'fall_detected' | 'restricted_zone' | 'high_temperature';
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  location: string;
  reading: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

export const WEARABLE_ALERTS: WearableAlert[] = [
  { id: 'WA-001', workerId: 'EMP-205', workerName: 'Carlos Garcia', deviceType: 'vital_monitor', alertType: 'high_heart_rate', severity: 'warning', timestamp: '2026-02-05T14:23:00Z', location: 'Production Floor A', reading: '142 BPM', acknowledged: true },
  { id: 'WA-002', workerId: 'EMP-312', workerName: 'Maria Santos', deviceType: 'gas_detector', alertType: 'gas_exposure', severity: 'critical', timestamp: '2026-02-05T11:45:00Z', location: 'Warehouse B - Loading Bay', reading: 'CO: 35 ppm', acknowledged: true, resolvedAt: '2026-02-05T11:52:00Z' },
  { id: 'WA-003', workerId: 'EMP-108', workerName: 'James Wilson', deviceType: 'location_beacon', alertType: 'restricted_zone', severity: 'warning', timestamp: '2026-02-05T09:30:00Z', location: 'Confined Space CS-04', reading: 'Unauthorized entry', acknowledged: true },
  { id: 'WA-004', workerId: 'EMP-422', workerName: 'Priya Patel', deviceType: 'smart_hardhat', alertType: 'high_temperature', severity: 'info', timestamp: '2026-02-05T13:15:00Z', location: 'Outdoor Site C', reading: '38.2°C body temp', acknowledged: false },
];

export const ENHANCED_RFI_REGISTER: EnhancedRFI[] = [
  {
    id: 'RFI-001',
    number: 'RFI-2026-001',
    subject: 'Foundation reinforcement specifications',
    question: 'Please clarify the rebar spacing requirements for the main foundation as shown on drawing S-101. The detail shows 12" OC but the notes indicate 8" OC.',
    from: 'Site Superintendent',
    to: 'Structural Engineer',
    dateSubmitted: '2026-01-15',
    dateDue: '2026-01-22',
    dateResponded: '2026-01-20',
    status: 'Closed',
    priority: 'high',
    category: 'Design',
    costImpact: 15000,
    scheduleImpact: 0,
    response: 'Use 8" OC spacing per structural notes. Drawing will be updated in next revision.',
    relatedDrawings: ['S-101', 'S-101A']
  },
  {
    id: 'RFI-002',
    number: 'RFI-2026-002',
    subject: 'HVAC duct routing conflict',
    question: 'HVAC supply duct conflicts with structural beam at grid line B-4. Please advise on preferred solution - lower duct or route around beam.',
    from: 'MEP Contractor',
    to: 'MEP Engineer',
    dateSubmitted: '2026-01-28',
    dateDue: '2026-02-04',
    status: 'Open',
    priority: 'medium',
    category: 'Construction',
    costImpact: 8500,
    scheduleImpact: 3,
    relatedDrawings: ['M-201', 'S-102']
  },
  {
    id: 'RFI-003',
    number: 'RFI-2026-003',
    subject: 'Crane load calculations for critical lift',
    question: 'Requesting verification of crane load calculations for the rooftop equipment lift scheduled for Feb 15. Current ground conditions may require matting.',
    from: 'Rigging Supervisor',
    to: 'Safety Manager',
    dateSubmitted: '2026-02-01',
    dateDue: '2026-02-08',
    status: 'Open',
    priority: 'urgent',
    category: 'Safety',
    scheduleImpact: 2,
    relatedDrawings: ['CL-001']
  },
  {
    id: 'RFI-004',
    number: 'RFI-2026-004',
    subject: 'Stormwater detention sizing',
    question: 'Per site survey, actual drainage area is 15% larger than design documents. Does detention pond need to be resized?',
    from: 'Civil Contractor',
    to: 'Civil Engineer',
    dateSubmitted: '2026-01-10',
    dateDue: '2026-01-17',
    status: 'Overdue',
    priority: 'high',
    category: 'Environmental',
    costImpact: 45000,
    scheduleImpact: 14
  },
  {
    id: 'RFI-005',
    number: 'RFI-2026-005',
    subject: 'Fire rated door hardware specification',
    question: 'Specification calls for Hager hardware but lead time is 16 weeks. Can we substitute equivalent Von Duprin hardware?',
    from: 'Door Subcontractor',
    to: 'Architect',
    dateSubmitted: '2026-02-03',
    dateDue: '2026-02-10',
    status: 'Pending',
    priority: 'medium',
    category: 'Design',
    scheduleImpact: 5
  }
];


// AI Workflow Stages for Project Management
export interface AIWorkflowStage {
  id: string;
  name: string;
  aiEngine: string;
  status: 'active' | 'pending' | 'completed' | 'learning';
  confidence: number;
  automationLevel: string;
  description: string;
  lastTrigger: string;
  tasksProcessed: number;
}

export const AI_WORKFLOW_STAGES: AIWorkflowStage[] = [
  {
    id: 'AIWS-001',
    name: 'Auto Risk Scoring',
    aiEngine: 'Predictive Risk Engine',
    status: 'active',
    confidence: 94.1,
    automationLevel: 'Full Auto',
    description: 'AI automatically scores every new task and incident by risk severity using historical patterns and real-time sensor data.',
    lastTrigger: '2 min ago',
    tasksProcessed: 4823
  },
  {
    id: 'AIWS-002',
    name: 'Smart Task Assignment',
    aiEngine: 'NLP Safety Engine',
    status: 'active',
    confidence: 91.7,
    automationLevel: 'AI Suggest',
    description: 'AI analyzes task requirements and team member expertise/availability to recommend optimal assignments.',
    lastTrigger: '5 min ago',
    tasksProcessed: 2156
  },
  {
    id: 'AIWS-003',
    name: 'Predictive Scheduling',
    aiEngine: 'Predictive Risk Engine',
    status: 'active',
    confidence: 88.3,
    automationLevel: 'AI Suggest',
    description: 'Forecasts task completion dates based on team velocity, dependencies, and historical sprint data.',
    lastTrigger: '12 min ago',
    tasksProcessed: 1847
  },
  {
    id: 'AIWS-004',
    name: 'Compliance Auto-Check',
    aiEngine: 'Compliance AI',
    status: 'active',
    confidence: 99.2,
    automationLevel: 'Full Auto',
    description: 'Automatically validates every safety deliverable against OSHA, ISO, EPA standards before approval.',
    lastTrigger: '1 min ago',
    tasksProcessed: 6291
  },
  {
    id: 'AIWS-005',
    name: 'Sprint Health AI',
    aiEngine: 'Behavioral Analytics',
    status: 'active',
    confidence: 86.5,
    automationLevel: 'Monitoring',
    description: 'Monitors sprint burndown, team load, and detects signs of scope creep or burnout risk.',
    lastTrigger: '30 min ago',
    tasksProcessed: 892
  },
  {
    id: 'AIWS-006',
    name: 'Incident-to-Task Pipeline',
    aiEngine: 'Visual Audit AI',
    status: 'active',
    confidence: 96.8,
    automationLevel: 'Full Auto',
    description: 'AI visual audit findings automatically create corrective action tasks with proper categorization.',
    lastTrigger: '8 min ago',
    tasksProcessed: 3412
  },
  {
    id: 'AIWS-007',
    name: 'Emergency Response Orchestrator',
    aiEngine: 'IoT Neural Network',
    status: 'active',
    confidence: 98.5,
    automationLevel: 'Full Auto',
    description: 'AI coordinates emergency response workflows — triggers notifications, muster tracking, resource allocation.',
    lastTrigger: '2 hours ago',
    tasksProcessed: 147
  },
  {
    id: 'AIWS-008',
    name: 'Ergonomic Risk Detector',
    aiEngine: 'Behavioral Analytics',
    status: 'learning',
    confidence: 82.1,
    automationLevel: 'AI Suggest',
    description: 'Analyzes workstation data and worker behavior to auto-generate ergonomic improvement tasks.',
    lastTrigger: '45 min ago',
    tasksProcessed: 534
  }
];

// AI Project Intelligence Summary
export interface AIProjectIntelligence {
  overallHealthScore: number;
  sprintPredictedCompletion: string;
  riskAlerts: { level: string; message: string }[];
  aiRecommendations: string[];
  automationsSaved: string;
  tasksTouched: number;
}

export const AI_PROJECT_INTELLIGENCE: AIProjectIntelligence = {
  overallHealthScore: 94,
  sprintPredictedCompletion: '97% chance of completing Sprint 24 on time',
  riskAlerts: [
    { level: 'warning', message: 'IoT sensor installation task at risk — dependency on vendor delivery' },
    { level: 'info', message: 'Team velocity trending 8% above 6-sprint average' },
    { level: 'success', message: 'Zero blockers detected across all active sprints' }
  ],
  aiRecommendations: [
    'Consider splitting SAFE-105 (Environmental Dashboard) into 2 stories to reduce risk',
    'Sarah Johnson has 40% capacity next sprint — assign IoT integration research',
    'Schedule OSHA 1910.147 (LOTO) training before confined space permit rollout',
    'AI detected 3 duplicate near-miss reports — consolidate into single investigation'
  ],
  automationsSaved: '142 hours this month',
  tasksTouched: 1247
};
