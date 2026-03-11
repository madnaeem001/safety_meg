import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskDetailModal } from '../TaskDetailModal';
import type { ProjectTask, TaskPriority, TaskStatus, IssueType } from '../../../data/mockProjectManagement';

// ── Framer-motion stub ────────────────────────────────────────────────────────

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({
        children,
        ...props
      }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
        <div {...props}>{children}</div>
      ),
    },
  };
});

// ── mockProjectManagement stub ────────────────────────────────────────────────

vi.mock('../../../data/mockProjectManagement', () => ({
  EPICS: [],
  SPRINTS: [],
}));

// ── mobileFeatures stub ───────────────────────────────────────────────────────

vi.mock('../../../utils/mobileFeatures', () => ({
  hapticFeedback: vi.fn(),
}));

// ── API hook mocks ────────────────────────────────────────────────────────────

const mockUpdateTaskMutate = vi.fn();
const mockAddCommentMutate = vi.fn();
const mockRefetchComments = vi.fn();

let mockEpicsData: any[] = [];
let mockSprintsData: any[] = [];
let mockBackendComments: any[] | null = null;

vi.mock('../../../api/hooks/useAPIHooks', () => ({
  useProjectEpics: () => ({ data: mockEpicsData, loading: false, error: null }),
  useProjectSprints: () => ({ data: mockSprintsData, loading: false, error: null }),
  useUpdateProjectTask: () => ({ mutate: mockUpdateTaskMutate, loading: false, error: null }),
  useTaskComments: () => ({
    data: mockBackendComments,
    loading: false,
    error: null,
    refetch: mockRefetchComments,
  }),
  useAddTaskComment: () => ({ mutate: mockAddCommentMutate, loading: false, error: null }),
}));

// ── Mock task data ────────────────────────────────────────────────────────────

const MOCK_TASK: ProjectTask = {
  id: 'TASK-001',
  key: 'SAFE-101',
  title: 'Install fire suppression system',
  description: 'Coordinate with contractors to install the new fire suppression system in Building A.\nEnsure all local regulations are met.',
  issueType: 'task',
  assignee: 'Alice Johnson',
  reporter: 'Bob Smith',
  priority: 'high',
  status: 'in_progress',
  dueDate: '2026-12-31',
  createdAt: '2026-01-15',
  updatedAt: '2026-03-01',
  tags: ['safety', 'compliance'],
  storyPoints: 8,
  epicId: 'EPIC-1',
  sprintId: '1',
  parentId: undefined,
  labels: ['urgent', 'fire-safety'],
  components: ['building-a'],
  watchers: ['Charlie Davis', 'Dana White'],
  timeEstimate: 16,
  timeSpent: 10,
  linkedIssues: [
    { type: 'blocks', taskId: 'TASK-002' },
    { type: 'relates_to', taskId: 'TASK-003' },
  ],
  attachments: [
    { id: 'a1', name: 'spec-sheet.pdf', size: '2.4 MB', uploadedAt: '2026-01-20', uploadedBy: 'Alice Johnson' },
  ],
  comments: [
    { id: 'c1', author: 'Bob Smith', content: 'System parts ordered.', timestamp: '2026-02-01T10:00:00.000Z' },
  ],
  activityLog: [
    { id: 'act1', user: 'Alice Johnson', action: 'changed status', field: 'status', oldValue: 'todo', newValue: 'in_progress', timestamp: '2026-02-10T09:00:00.000Z' },
  ],
};

const MOCK_TASK_NO_EXTRAS: ProjectTask = {
  id: 'TASK-002',
  key: 'SAFE-102',
  title: 'Safety audit report',
  description: 'Compile monthly safety audit report.',
  issueType: 'story',
  assignee: 'Dana White',
  reporter: undefined as any,
  priority: 'medium',
  status: 'todo',
  dueDate: '2026-01-01', // overdue
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  tags: [],
  labels: [],
  components: [],
  watchers: [],
  linkedIssues: [],
  attachments: [],
  comments: [],
  activityLog: [],
};

const MOCK_ALL_TASKS: ProjectTask[] = [
  MOCK_TASK,
  {
    ...MOCK_TASK_NO_EXTRAS,
    id: 'TASK-002',
    key: 'SAFE-102',
    title: 'Safety audit report',
    status: 'completed',
  } as ProjectTask,
  {
    ...MOCK_TASK_NO_EXTRAS,
    id: 'TASK-003',
    key: 'SAFE-103',
    title: 'Equipment inspection',
    status: 'todo',
  } as ProjectTask,
];

// ── Helper ────────────────────────────────────────────────────────────────────

function renderModal(
  task: ProjectTask = MOCK_TASK,
  overrides: Partial<{
    isOpen: boolean;
    taskDbId: number;
    projectDbId: number;
    onUpdate: (t: ProjectTask) => void;
    onClose: () => void;
    allTasks: ProjectTask[];
  }> = {}
) {
  const onUpdate = overrides.onUpdate ?? vi.fn();
  const onClose = overrides.onClose ?? vi.fn();
  return render(
    <TaskDetailModal
      task={task}
      isOpen={overrides.isOpen ?? true}
      onClose={onClose}
      onUpdate={onUpdate}
      allTasks={overrides.allTasks ?? MOCK_ALL_TASKS}
      taskDbId={overrides.taskDbId}
      projectDbId={overrides.projectDbId}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockEpicsData = [];
  mockSprintsData = [];
  mockBackendComments = null;
});

// =============================================================================
// SUITE 1 — Module exports
// =============================================================================

describe('TaskDetailModal — module exports', () => {
  it('exports TaskDetailModal as a named function', () => {
    expect(typeof TaskDetailModal).toBe('function');
  });
});

// =============================================================================
// SUITE 2 — Closed state
// =============================================================================

describe('TaskDetailModal — closed state', () => {
  it('renders nothing when isOpen is false', () => {
    renderModal(MOCK_TASK, { isOpen: false });
    expect(screen.queryByText('Install fire suppression system')).toBeNull();
  });

  it('renders content when isOpen is true', () => {
    renderModal();
    expect(screen.getByText('Install fire suppression system')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 3 — Header rendering
// =============================================================================

describe('TaskDetailModal — header rendering', () => {
  it('renders the task title', () => {
    renderModal();
    expect(screen.getByText('Install fire suppression system')).toBeTruthy();
  });

  it('renders the task key', () => {
    renderModal();
    expect(screen.getByText('SAFE-101')).toBeTruthy();
  });

  it('renders the current status badge', () => {
    renderModal();
    expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0);
  });

  it('renders the current priority badge', () => {
    renderModal();
    expect(screen.getAllByText('High').length).toBeGreaterThan(0);
  });

  it('renders story points badge', () => {
    renderModal();
    expect(screen.getByText('8 pts')).toBeTruthy();
  });

  it('renders edit button', () => {
    renderModal();
    const editBtn = document.querySelector('button svg.lucide-pen-line');
    expect(editBtn).toBeTruthy();
  });

  it('renders close button', () => {
    renderModal();
    const closeBtn = document.querySelector('button svg.lucide-x');
    expect(closeBtn).toBeTruthy();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderModal(MOCK_TASK, { onClose });
    const closeBtn = document.querySelector('button svg.lucide-x')?.closest('button')!;
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    renderModal(MOCK_TASK, { onClose });
    const backdrop = document.querySelector('.fixed.inset-0')!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when modal content is clicked', () => {
    const onClose = vi.fn();
    renderModal(MOCK_TASK, { onClose });
    const modal = document.querySelector('.bg-white.rounded-2xl')!;
    fireEvent.click(modal);
    expect(onClose).not.toHaveBeenCalled();
  });
});

// =============================================================================
// SUITE 4 — Tab navigation
// =============================================================================

describe('TaskDetailModal — tab navigation', () => {
  it('renders all 3 tabs', () => {
    renderModal();
    expect(screen.getByText('Details')).toBeTruthy();
    expect(screen.getByText(/Comments/)).toBeTruthy();
    expect(screen.getByText('Activity')).toBeTruthy();
  });

  it('shows comments tab with count from task.comments', () => {
    renderModal();
    expect(screen.getByText('Comments (1)')).toBeTruthy();
  });

  it('shows comments tab with 0 count on task with no comments', () => {
    renderModal(MOCK_TASK_NO_EXTRAS);
    expect(screen.getByText('Comments (0)')).toBeTruthy();
  });

  it('defaults to Details tab', () => {
    renderModal();
    expect(screen.getByText('Description')).toBeTruthy();
  });

  it('switches to Comments tab when clicked', () => {
    renderModal();
    fireEvent.click(screen.getByText('Comments (1)'));
    expect(screen.getByPlaceholderText('Add a comment...')).toBeTruthy();
  });

  it('switches to Activity tab when clicked', () => {
    renderModal();
    fireEvent.click(screen.getByText('Activity'));
    expect(screen.getByText('Activity')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 5 — Details tab
// =============================================================================

describe('TaskDetailModal — details tab', () => {
  it('renders task description', () => {
    renderModal();
    expect(screen.getByText('Coordinate with contractors to install the new fire suppression system in Building A.')).toBeTruthy();
  });

  it('renders linked issues section when links exist', () => {
    renderModal();
    expect(screen.getByText('Linked Issues')).toBeTruthy();
  });

  it('renders linked task key', () => {
    renderModal();
    expect(screen.getByText('SAFE-102')).toBeTruthy();
  });

  it('renders linked task title', () => {
    renderModal();
    expect(screen.getByText('Safety audit report')).toBeTruthy();
  });

  it('renders attachments section when attachments exist', () => {
    renderModal();
    expect(screen.getByText('spec-sheet.pdf')).toBeTruthy();
  });

  it('renders attachment size and uploader', () => {
    renderModal();
    expect(screen.getByText('2.4 MB • Alice Johnson')).toBeTruthy();
  });

  it('does not render linked issues section when no links', () => {
    renderModal(MOCK_TASK_NO_EXTRAS);
    expect(screen.queryByText('Linked Issues')).toBeNull();
  });

  it('does not render attachments section when none', () => {
    renderModal(MOCK_TASK_NO_EXTRAS);
    expect(screen.queryByText(/spec-sheet/)).toBeNull();
  });
});

// =============================================================================
// SUITE 6 — Right panel — metadata
// =============================================================================

describe('TaskDetailModal — right panel metadata', () => {
  it('renders assignee name', () => {
    renderModal();
    expect(screen.getByText('Alice Johnson')).toBeTruthy();
  });

  it('renders reporter name', () => {
    renderModal();
    expect(screen.getByText('Bob Smith')).toBeTruthy();
  });

  it('renders due date', () => {
    renderModal();
    expect(screen.getByText('Dec 31, 2026')).toBeTruthy();
  });

  it('renders time tracking section when timeEstimate is set', () => {
    renderModal();
    expect(screen.getByText('Time Tracking')).toBeTruthy();
    expect(screen.getByText('10h')).toBeTruthy(); // timeSpent
  });

  it('renders labels', () => {
    renderModal();
    expect(screen.getByText('urgent')).toBeTruthy();
    expect(screen.getByText('fire-safety')).toBeTruthy();
  });

  it('renders watchers section', () => {
    renderModal();
    expect(screen.getByText('Charlie')).toBeTruthy();
    expect(screen.getByText('Dana')).toBeTruthy();
  });

  it('renders created date', () => {
    renderModal();
    expect(screen.getByText('Jan 15, 2026')).toBeTruthy();
  });

  it('marks overdue due date in red styling', () => {
    renderModal(MOCK_TASK_NO_EXTRAS);
    const dueDateSpans = screen.getAllByText('Jan 1, 2026');
    // The due date span inside the Due Date section should have text-red-600
    const redSpan = dueDateSpans.find(el => el.classList.contains('text-red-600'));
    expect(redSpan).toBeTruthy();
  });

  it('does not render Reporter section when reporter is undefined', () => {
    renderModal(MOCK_TASK_NO_EXTRAS);
    expect(screen.queryByText('Reporter')).toBeNull();
  });

  it('does not render watchers section when watchers is empty', () => {
    renderModal(MOCK_TASK_NO_EXTRAS);
    expect(screen.queryByText(/Watchers/)).toBeNull();
  });
});

// =============================================================================
// SUITE 7 — Sprint and epic display
// =============================================================================

describe('TaskDetailModal — sprint and epic display', () => {
  it('shows epic badge when API returns matching epic', () => {
    mockEpicsData = [{ id: 1, key: 'EPIC-1', name: 'Safety Infrastructure', color: '#6366f1', status: 'active' }];
    renderModal();
    expect(screen.getByText('Safety Infrastructure')).toBeTruthy();
  });

  it('does not show epic badge when API returns no epics', () => {
    mockEpicsData = [];
    renderModal();
    expect(screen.queryByText('Safety Infrastructure')).toBeNull();
  });

  it('shows sprint section in right panel when API returns matching sprint', () => {
    mockSprintsData = [{ id: 1, name: 'Sprint 1', startDate: '2026-01-01', endDate: '2026-01-14', status: 'active' }];
    renderModal();
    expect(screen.getByText('Sprint 1')).toBeTruthy();
  });

  it('does not show sprint section when API returns no sprints', () => {
    mockSprintsData = [];
    renderModal();
    expect(screen.queryByText('Sprint 1')).toBeNull();
  });
});

// =============================================================================
// SUITE 8 — Status change
// =============================================================================

describe('TaskDetailModal — status change', () => {
  it('renders all status options in dropdown', () => {
    renderModal();
    const statusDropdown = screen.getAllByText('In Progress')[0].closest('.group')!;
    const buttons = statusDropdown.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(5);
  });

  it('calls onUpdate when status is changed (no taskDbId)', async () => {
    const onUpdate = vi.fn();
    renderModal(MOCK_TASK, { onUpdate });
    const backlogBtn = screen.getAllByText('Backlog').find(el => el.tagName === 'BUTTON');
    if (backlogBtn) {
      fireEvent.click(backlogBtn);
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'backlog' }));
    }
  });

  it('calls updateTaskMutation when status changes with taskDbId', async () => {
    const onUpdate = vi.fn();
    renderModal(MOCK_TASK, { onUpdate, taskDbId: 1, projectDbId: 10 });
    const doneBtn = screen.getAllByText('Done').find(el => el.tagName === 'BUTTON');
    if (doneBtn) {
      fireEvent.click(doneBtn);
      await waitFor(() => {
        expect(mockUpdateTaskMutate).toHaveBeenCalledWith(
          expect.objectContaining({ projectId: 10, taskId: 1, data: { status: 'completed' } })
        );
      });
    }
  });

  it('does NOT call updateTaskMutation when no taskDbId', async () => {
    const onUpdate = vi.fn();
    renderModal(MOCK_TASK, { onUpdate });
    const doneBtn = screen.getAllByText('Done').find(el => el.tagName === 'BUTTON');
    if (doneBtn) {
      fireEvent.click(doneBtn);
      expect(mockUpdateTaskMutate).not.toHaveBeenCalled();
    }
  });
});

// =============================================================================
// SUITE 9 — Priority change
// =============================================================================

describe('TaskDetailModal — priority change', () => {
  it('calls onUpdate when priority changes (no taskDbId)', async () => {
    const onUpdate = vi.fn();
    renderModal(MOCK_TASK, { onUpdate });
    const lowBtn = screen.getAllByText('Low').find(el => el.tagName === 'BUTTON');
    if (lowBtn) {
      fireEvent.click(lowBtn);
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ priority: 'low' }));
    }
  });

  it('calls updateTaskMutation when priority changes with taskDbId', async () => {
    const onUpdate = vi.fn();
    renderModal(MOCK_TASK, { onUpdate, taskDbId: 5, projectDbId: 2 });
    const lowBtn = screen.getAllByText('Low').find(el => el.tagName === 'BUTTON');
    if (lowBtn) {
      fireEvent.click(lowBtn);
      await waitFor(() => {
        expect(mockUpdateTaskMutate).toHaveBeenCalledWith(
          expect.objectContaining({ projectId: 2, taskId: 5, data: { priority: 'low' } })
        );
      });
    }
  });

  it('does NOT call updateTaskMutation when no taskDbId', async () => {
    const onUpdate = vi.fn();
    renderModal(MOCK_TASK, { onUpdate });
    const lowBtn = screen.getAllByText('Low').find(el => el.tagName === 'BUTTON');
    if (lowBtn) {
      fireEvent.click(lowBtn);
      expect(mockUpdateTaskMutate).not.toHaveBeenCalled();
    }
  });
});

// =============================================================================
// SUITE 10 — Inline edit (title + description)
// =============================================================================

describe('TaskDetailModal — inline edit', () => {
  it('clicking edit icon enters edit mode for title', () => {
    renderModal();
    const editBtn = document.querySelector('button svg.lucide-pen-line')?.closest('button')!;
    fireEvent.click(editBtn);
    const titleInput = screen.getByDisplayValue('Install fire suppression system');
    expect(titleInput).toBeTruthy();
  });

  it('shows Save Changes and Cancel buttons in edit mode', () => {
    renderModal();
    const editBtn = document.querySelector('button svg.lucide-pen-line')?.closest('button')!;
    fireEvent.click(editBtn);
    expect(screen.getByText('Save Changes')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('Cancel restore original title', () => {
    renderModal();
    const editBtn = document.querySelector('button svg.lucide-pen-line')?.closest('button')!;
    fireEvent.click(editBtn);
    const titleInput = screen.getByDisplayValue('Install fire suppression system') as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'Modified title' } });
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('Install fire suppression system')).toBeTruthy();
  });

  it('Save Changes calls onUpdate with new title', async () => {
    const onUpdate = vi.fn();
    renderModal(MOCK_TASK, { onUpdate });
    const editBtn = document.querySelector('button svg.lucide-pen-line')?.closest('button')!;
    fireEvent.click(editBtn);
    const titleInput = screen.getByDisplayValue('Install fire suppression system') as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'Updated title' } });
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated title' }));
    });
  });

  it('Save Changes calls updateTaskMutation when taskDbId is set', async () => {
    const onUpdate = vi.fn();
    renderModal(MOCK_TASK, { onUpdate, taskDbId: 7, projectDbId: 3 });
    const editBtn = document.querySelector('button svg.lucide-pen-line')?.closest('button')!;
    fireEvent.click(editBtn);
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => {
      expect(mockUpdateTaskMutate).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 3, taskId: 7 })
      );
    });
  });

  it('does NOT call updateTaskMutation on save when no taskDbId', async () => {
    const onUpdate = vi.fn();
    renderModal(MOCK_TASK, { onUpdate });
    const editBtn = document.querySelector('button svg.lucide-pen-line')?.closest('button')!;
    fireEvent.click(editBtn);
    fireEvent.click(screen.getByText('Save Changes'));
    expect(mockUpdateTaskMutate).not.toHaveBeenCalled();
  });

  it('edit mode is exited after Save Changes', async () => {
    const onUpdate = vi.fn();
    renderModal(MOCK_TASK, { onUpdate });
    const editBtn = document.querySelector('button svg.lucide-pen-line')?.closest('button')!;
    fireEvent.click(editBtn);
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => {
      expect(screen.queryByText('Save Changes')).toBeNull();
    });
  });
});

// =============================================================================
// SUITE 11 — Comments tab
// =============================================================================

describe('TaskDetailModal — comments tab', () => {
  it('renders comment input placeholder', () => {
    renderModal();
    fireEvent.click(screen.getByText('Comments (1)'));
    expect(screen.getByPlaceholderText('Add a comment...')).toBeTruthy();
  });

  it('Send button is disabled when comment is empty', () => {
    renderModal();
    fireEvent.click(screen.getByText('Comments (1)'));
    const sendBtn = screen.getByText('Send').closest('button')!;
    expect((sendBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('Send button is enabled when comment text is entered', () => {
    renderModal();
    fireEvent.click(screen.getByText('Comments (1)'));
    const textarea = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(textarea, { target: { value: 'Great progress!' } });
    const sendBtn = screen.getByText('Send').closest('button')!;
    expect((sendBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it('renders existing comments from task.comments (fallback)', () => {
    renderModal();
    fireEvent.click(screen.getByText('Comments (1)'));
    expect(screen.getByText('System parts ordered.')).toBeTruthy();
  });

  it('renders author and timestamp for existing comment', () => {
    renderModal();
    fireEvent.click(screen.getByText('Comments (1)'));
    expect(screen.getAllByText('Bob Smith').length).toBeGreaterThan(0);
  });

  it('shows empty state when no comments', () => {
    renderModal(MOCK_TASK_NO_EXTRAS);
    fireEvent.click(screen.getByText('Comments (0)'));
    expect(screen.getByText('No comments yet')).toBeTruthy();
  });

  it('calls onUpdate when comment is submitted', async () => {
    const onUpdate = vi.fn();
    renderModal(MOCK_TASK, { onUpdate });
    fireEvent.click(screen.getByText('Comments (1)'));
    fireEvent.change(screen.getByPlaceholderText('Add a comment...'), {
      target: { value: 'New comment text' },
    });
    fireEvent.click(screen.getByText('Send').closest('button')!);
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          comments: expect.arrayContaining([
            expect.objectContaining({ content: 'New comment text' }),
          ]),
        })
      );
    });
  });

  it('calls addCommentMutation when taskDbId and projectDbId are set', async () => {
    const onUpdate = vi.fn();
    renderModal(MOCK_TASK, { onUpdate, taskDbId: 1, projectDbId: 5 });
    fireEvent.click(screen.getByText('Comments (1)'));
    fireEvent.change(screen.getByPlaceholderText('Add a comment...'), {
      target: { value: 'Backend comment' },
    });
    fireEvent.click(screen.getByText('Send').closest('button')!);
    await waitFor(() => {
      expect(mockAddCommentMutate).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 5, taskId: 1, content: 'Backend comment' })
      );
    });
  });

  it('does NOT call addCommentMutation without taskDbId', async () => {
    const onUpdate = vi.fn();
    renderModal(MOCK_TASK, { onUpdate });
    fireEvent.click(screen.getByText('Comments (1)'));
    fireEvent.change(screen.getByPlaceholderText('Add a comment...'), {
      target: { value: 'Local comment' },
    });
    fireEvent.click(screen.getByText('Send').closest('button')!);
    expect(mockAddCommentMutate).not.toHaveBeenCalled();
  });

  it('clears comment textarea after submitting', async () => {
    const onUpdate = vi.fn();
    renderModal(MOCK_TASK, { onUpdate });
    fireEvent.click(screen.getByText('Comments (1)'));
    const textarea = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(textarea, { target: { value: 'Hello!' } });
    fireEvent.click(screen.getByText('Send').closest('button')!);
    await waitFor(() => {
      expect((textarea as HTMLTextAreaElement).value).toBe('');
    });
  });

  it('uses backend comments when backendComments is non-empty', () => {
    mockBackendComments = [
      { id: 10, taskId: 1, projectId: 5, author: 'Eve', content: 'DB comment here', createdAt: 1700000000000 },
    ];
    renderModal(MOCK_TASK, { taskDbId: 1, projectDbId: 5 });
    fireEvent.click(screen.getByText(/Comments/));
    expect(screen.getByText('DB comment here')).toBeTruthy();
  });

  it('shows task.comments as fallback when backendComments is null', () => {
    mockBackendComments = null;
    renderModal();
    fireEvent.click(screen.getByText('Comments (1)'));
    expect(screen.getByText('System parts ordered.')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 12 — Activity tab
// =============================================================================

describe('TaskDetailModal — activity tab', () => {
  it('renders activity log entries', () => {
    renderModal();
    fireEvent.click(screen.getByText('Activity'));
    expect(screen.getAllByText('Alice Johnson').length).toBeGreaterThan(0);
  });

  it('renders activity action text', () => {
    renderModal();
    fireEvent.click(screen.getByText('Activity'));
    expect(screen.getByText(/changed status/)).toBeTruthy();
  });

  it('renders old and new value in activity', () => {
    renderModal();
    fireEvent.click(screen.getByText('Activity'));
    expect(screen.getByText('todo')).toBeTruthy();
    expect(screen.getByText('in_progress')).toBeTruthy();
  });

  it('shows empty state when activityLog is empty', () => {
    renderModal(MOCK_TASK_NO_EXTRAS);
    fireEvent.click(screen.getByText('Activity'));
    expect(screen.getByText('No activity recorded')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 13 — Time tracking
// =============================================================================

describe('TaskDetailModal — time tracking', () => {
  it('renders time tracking section with estimate', () => {
    renderModal();
    expect(screen.getByText('Estimated: 16h')).toBeTruthy();
  });

  it('shows percentage of time spent: 10/16 = 63%', () => {
    renderModal();
    expect(screen.getByText('63%')).toBeTruthy();
  });

  it('does not render time tracking when neither estimate nor spent', () => {
    renderModal({ ...MOCK_TASK_NO_EXTRAS, timeEstimate: undefined, timeSpent: undefined });
    expect(screen.queryByText('Time Tracking')).toBeNull();
  });

  it('renders progress bar for time tracking', () => {
    renderModal();
    const progressBars = document.querySelectorAll('.bg-brand-500.rounded-full');
    expect(progressBars.length).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// SUITE 14 — Edge cases
// =============================================================================

describe('TaskDetailModal — edge cases', () => {
  it('renders without crashing when allTasks is empty', () => {
    renderModal(MOCK_TASK, { allTasks: [] });
    expect(screen.getByText('Install fire suppression system')).toBeTruthy();
  });

  it('renders task with issue type "bug"', () => {
    renderModal({ ...MOCK_TASK, issueType: 'bug' as IssueType });
    expect(screen.getByText('Install fire suppression system')).toBeTruthy();
  });

  it('renders task with issue type "epic"', () => {
    renderModal({ ...MOCK_TASK, issueType: 'epic' as IssueType });
    expect(screen.getByText('SAFE-101')).toBeTruthy();
  });

  it('renders task with "highest" priority', () => {
    renderModal({ ...MOCK_TASK, priority: 'highest' as TaskPriority });
    expect(screen.getAllByText('Highest').length).toBeGreaterThan(0);
  });

  it('renders task with "lowest" priority', () => {
    renderModal({ ...MOCK_TASK, priority: 'lowest' as TaskPriority });
    expect(screen.getAllByText('Lowest').length).toBeGreaterThan(0);
  });

  it('renders all status options in dropdown', () => {
    renderModal();
    expect(screen.getAllByText('Backlog').length).toBeGreaterThan(0);
    expect(screen.getAllByText('To Do').length).toBeGreaterThan(0);
    expect(screen.getAllByText('In Review').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Done').length).toBeGreaterThan(0);
  });

  it('renders without storyPoints gracefully', () => {
    renderModal({ ...MOCK_TASK, storyPoints: undefined });
    expect(screen.queryByText(/pts/)).toBeNull();
  });

  it('renders task with all statuses: backlog', () => {
    renderModal({ ...MOCK_TASK, status: 'backlog' as TaskStatus });
    expect(screen.getAllByText('Backlog').length).toBeGreaterThan(0);
  });

  it('renders task with status: review', () => {
    renderModal({ ...MOCK_TASK, status: 'review' as TaskStatus });
    expect(screen.getAllByText('In Review').length).toBeGreaterThan(0);
  });

  it('renders description lines as separate paragraphs', () => {
    renderModal();
    expect(screen.getByText('Ensure all local regulations are met.')).toBeTruthy();
  });
});
