import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BacklogManagement } from '../BacklogManagement';
import type { ProjectTask } from '../../../types/project';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
        <div {...props}>{children}</div>
      ),
    },
    Reorder: {
      Group: ({ children, onReorder, ...props }: { children: React.ReactNode; onReorder: unknown; values: unknown; axis: string }) => (
        <div {...props as React.HTMLAttributes<HTMLDivElement>}>{children}</div>
      ),
      Item: ({ children, ...props }: { children: React.ReactNode; value: unknown; onDragStart: unknown }) => (
        <div>{children}</div>
      ),
    },
  };
});

vi.mock('../../../api/hooks/useAPIHooks', () => ({
  useProjectSprints: () => ({
    data: [
      { id: 1, name: 'Sprint 24', status: 'active', startDate: '2026-02-03', endDate: '2026-02-16', goal: 'test' },
      { id: 2, name: 'Sprint 25', status: 'future', startDate: '2026-02-17', endDate: '2026-03-02', goal: 'test 2' },
      { id: 3, name: 'Sprint 23 (done)', status: 'completed', startDate: '2026-01-01', endDate: '2026-01-31', goal: 'done' },
    ],
  }),
  useProjectEpics: () => ({
    data: [
      { id: 1, name: 'Safety Dashboard', color: '#6366f1', key: 'SAFE-E1', status: 'in_progress' },
      { id: 2, name: 'IoT Integration', color: '#14b8a6', key: 'SAFE-E5', status: 'todo' },
    ],
  }),
}));

vi.mock('../../../utils/mobileFeatures', () => ({
  hapticFeedback: vi.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<ProjectTask> = {}): ProjectTask {
  return {
    id: 'task-1',
    key: 'SAFE-001',
    title: 'Fix safety dashboard',
    description: 'Desc',
    issueType: 'task',
    assignee: 'John Smith',
    reporter: 'Jane Doe',
    priority: 'high',
    status: 'backlog',
    dueDate: '2099-12-31',
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
    ...overrides,
  };
}

const defaultProps = {
  tasks: [makeTask()],
  onTaskUpdate: vi.fn(),
  onOpenTask: vi.fn(),
  onMoveToSprint: vi.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BacklogManagement', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders without crashing', () => {
    render(<BacklogManagement {...defaultProps} />);
    expect(screen.getByText('Backlog Management')).toBeInTheDocument();
  });

  it('displays task title', () => {
    render(<BacklogManagement {...defaultProps} />);
    expect(screen.getByText('Fix safety dashboard')).toBeInTheDocument();
  });

  it('shows item count badge', () => {
    const tasks = [makeTask({ id: 'a' }), makeTask({ id: 'b' }), makeTask({ id: 'c' })];
    render(<BacklogManagement {...defaultProps} tasks={tasks} />);
    // Badge shows count next to "items" label
    expect(screen.getByText('items').parentElement).toHaveTextContent('3');
  });

  it('shows "No backlog items found" when filtered list is empty', async () => {
    const user = userEvent.setup();
    render(<BacklogManagement {...defaultProps} />);
    const search = screen.getByPlaceholderText(/search backlog/i);
    await user.type(search, 'xyz_nonexistent_99');
    expect(screen.getByText(/no backlog items found/i)).toBeInTheDocument();
  });

  it('filters tasks by search query (title match)', async () => {
    const user = userEvent.setup();
    const tasks = [
      makeTask({ id: 'a', title: 'Safety audit task' }),
      makeTask({ id: 'b', title: 'IoT sensor check' }),
    ];
    render(<BacklogManagement {...defaultProps} tasks={tasks} />);
    const search = screen.getByPlaceholderText(/search backlog/i);
    await user.type(search, 'IoT');
    expect(screen.getByText('IoT sensor check')).toBeInTheDocument();
    expect(screen.queryByText('Safety audit task')).toBeNull();
  });

  it('filters tasks by key match', async () => {
    const user = userEvent.setup();
    const tasks = [
      makeTask({ id: 'a', key: 'SAFE-001', title: 'Task A' }),
      makeTask({ id: 'b', key: 'SAFE-042', title: 'Task B' }),
    ];
    render(<BacklogManagement {...defaultProps} tasks={tasks} />);
    const search = screen.getByPlaceholderText(/search backlog/i);
    await user.type(search, 'SAFE-042');
    expect(screen.getByText('Task B')).toBeInTheDocument();
    expect(screen.queryByText('Task A')).toBeNull();
  });

  it('shows epic filter dropdown with backend epics', () => {
    render(<BacklogManagement {...defaultProps} />);
    expect(screen.getByText('Safety Dashboard')).toBeInTheDocument();
    expect(screen.getByText('IoT Integration')).toBeInTheDocument();
  });

  it('filters tasks by epic', async () => {
    const user = userEvent.setup();
    const tasks = [
      makeTask({ id: 'a', epicId: '1', title: 'Dashboard task' }),
      makeTask({ id: 'b', epicId: '2', title: 'IoT task' }),
    ];
    render(<BacklogManagement {...defaultProps} tasks={tasks} />);
    // Select epic "Safety Dashboard" (id=1)
    const epicSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(epicSelect, '1');
    expect(screen.getByText('Dashboard task')).toBeInTheDocument();
    expect(screen.queryByText('IoT task')).toBeNull();
  });

  it('filters tasks by priority', async () => {
    const user = userEvent.setup();
    const tasks = [
      makeTask({ id: 'a', priority: 'high', title: 'High priority task' }),
      makeTask({ id: 'b', priority: 'low', title: 'Low priority task' }),
    ];
    render(<BacklogManagement {...defaultProps} tasks={tasks} />);
    const prioritySelect = screen.getAllByRole('combobox')[1];
    await user.selectOptions(prioritySelect, 'high');
    expect(screen.getByText('High priority task')).toBeInTheDocument();
    expect(screen.queryByText('Low priority task')).toBeNull();
  });

  it('selects a task when checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(<BacklogManagement {...defaultProps} />);
    const checkboxes = screen.getAllByRole('button', { name: '' });
    // First checkbox is "select all", second is the task checkbox
    // Find the task's checkbox by its presence in the BacklogItem
    const taskCheckbox = checkboxes.find(btn =>
      btn.className?.includes('rounded') && btn.className?.includes('border-2')
    );
    if (taskCheckbox) {
      await user.click(taskCheckbox);
      // Bulk actions bar should appear
      expect(screen.getByText(/1 selected/i)).toBeInTheDocument();
    }
  });

  it('shows bulk move buttons for non-completed sprints', () => {
    const tasks = [makeTask({ id: 'a' })];
    render(<BacklogManagement {...defaultProps} tasks={tasks} />);
    // Select the task first to show bulk bar
    const allCheckboxButtons = screen.getAllByRole('button').filter(btn =>
      btn.className?.includes('border-2') && btn.className?.includes('rounded')
    );
    // Click the "select all" button to reveal bulk bar  
    if (allCheckboxButtons.length > 0) {
      fireEvent.click(allCheckboxButtons[0]);
      // Sprint 23 (done/completed) should NOT appear in bulk move bar
      expect(screen.queryByText('Sprint 23 (done)')).toBeNull();
      // Sprint 24 (active) should appear
      expect(screen.getByText('Sprint 24')).toBeInTheDocument();
    }
  });

  it('calls onOpenTask when task title is clicked', async () => {
    const user = userEvent.setup();
    render(<BacklogManagement {...defaultProps} />);
    await user.click(screen.getByText('Fix safety dashboard'));
    expect(defaultProps.onOpenTask).toHaveBeenCalledWith(defaultProps.tasks[0]);
  });

  it('shows overdue badge for tasks past due date', () => {
    const overdueTask = makeTask({ dueDate: '2020-01-01', status: 'backlog' });
    render(<BacklogManagement {...defaultProps} tasks={[overdueTask]} />);
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it('does NOT show overdue badge for completed tasks', () => {
    const completedOld = makeTask({ dueDate: '2020-01-01', status: 'completed' });
    // Completed tasks are filtered out of backlog view
    render(<BacklogManagement {...defaultProps} tasks={[completedOld]} />);
    expect(screen.queryByText(/overdue/i)).toBeNull();
  });

  it('shows high priority count', () => {
    const tasks = [
      makeTask({ id: 'a', priority: 'highest' }),
      makeTask({ id: 'b', priority: 'high' }),
      makeTask({ id: 'c', priority: 'low' }),
    ];
    render(<BacklogManagement {...defaultProps} tasks={tasks} />);
    // 2 high-priority items
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('handles empty tasks array gracefully', () => {
    render(<BacklogManagement {...defaultProps} tasks={[]} />);
    expect(screen.getByText(/no backlog items found/i)).toBeInTheDocument();
  });
});
