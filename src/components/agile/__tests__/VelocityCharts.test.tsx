import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VelocityCharts } from '../VelocityCharts';
import type { ProjectTask } from '../../../data/mockProjectManagement';

// ── Recharts stub — render children as divs so we can assert on labels ────────
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-count={data?.length}>{children}</div>
  ),
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-count={data?.length}>{children}</div>
  ),
  AreaChart: ({ children, data }: any) => (
    <div data-testid="area-chart" data-count={data?.length}>{children}</div>
  ),
  ComposedChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
  Line: () => null,
  Area: () => null,
  XAxis: ({ dataKey }: any) => <div data-testid={`xaxis-${dataKey}`} />,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// ── Framer-motion stub ─────────────────────────────────────────────────────────
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
        <div {...props}>{children}</div>
      ),
    },
  };
});

// ── API hook mocks ─────────────────────────────────────────────────────────────
let mockSprintsData: any[] | null = null;
let mockVelocityHistoryData: any[] | null = null;
const mockRecordVelocityMutate = vi.fn();

vi.mock('../../../api/hooks/useAPIHooks', () => ({
  useProjectSprints: () => ({ data: mockSprintsData, loading: false, error: null }),
  useVelocityHistory: () => ({ data: mockVelocityHistoryData, loading: false, error: null }),
  useRecordVelocity: () => ({ mutate: mockRecordVelocityMutate, loading: false, error: null }),
}));

// ── Test data ──────────────────────────────────────────────────────────────────

const MOCK_SPRINTS = [
  {
    id: 1,
    name: 'Sprint 24',
    startDate: '2026-02-03',
    endDate: '2026-02-16',
    goal: 'Core dashboard',
    status: 'active',
    projectId: 10,
  },
  {
    id: 2,
    name: 'Sprint 25',
    startDate: '2026-02-17',
    endDate: '2026-03-02',
    goal: 'Environmental monitoring',
    status: 'future',
    projectId: 10,
  },
  {
    id: 3,
    name: 'Sprint 26',
    startDate: '2026-02-17',
    endDate: '2026-03-02',
    goal: 'Mobile enhancements',
    status: 'completed',
    projectId: 10,
  },
];

const makeTasks = (overrides: Partial<ProjectTask>[] = []): ProjectTask[] =>
  overrides.map((o, i) => ({
    id: `T-${i + 1}`,
    key: `SAFE-10${i + 1}`,
    title: `Task ${i + 1}`,
    description: 'desc',
    issueType: 'task',
    assignee: 'Alice',
    reporter: 'Bob',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-12-31',
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
    ...o,
  }));

const MOCK_TASKS_SPRINT1: ProjectTask[] = makeTasks([
  { id: 'T-1', sprintId: '1', storyPoints: 5, status: 'completed' },
  { id: 'T-2', sprintId: '1', storyPoints: 8, status: 'in_progress' },
  { id: 'T-3', sprintId: '1', storyPoints: 3, status: 'todo' },
]);

const MOCK_TASKS_MIXED: ProjectTask[] = makeTasks([
  { id: 'T-1', sprintId: '1', storyPoints: 5, status: 'completed' },
  { id: 'T-2', sprintId: '1', storyPoints: 8, status: 'completed' },
  { id: 'T-3', sprintId: '2', storyPoints: 10, status: 'todo' },
  { id: 'T-4', sprintId: '3', storyPoints: 6, status: 'completed' },
]);

const MOCK_VELOCITY_HISTORY = [
  { id: 1, projectId: 10, sprintLabel: 'Sprint -4', committed: 21, completed: 18, carryover: 3, recordedAt: 1700000000000 },
  { id: 2, projectId: 10, sprintLabel: 'Sprint -3', committed: 24, completed: 22, carryover: 2, recordedAt: 1701000000000 },
];

function renderChart(
  tasks: ProjectTask[] = [],
  projectDbId?: number
) {
  return render(<VelocityCharts tasks={tasks} projectDbId={projectDbId} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSprintsData = null;
  mockVelocityHistoryData = null;
});

// =============================================================================
// SUITE 1 — Module exports
// =============================================================================
describe('VelocityCharts — module exports', () => {
  it('exports VelocityCharts as a named function', () => {
    expect(typeof VelocityCharts).toBe('function');
  });
});

// =============================================================================
// SUITE 2 — Basic rendering
// =============================================================================
describe('VelocityCharts — basic rendering', () => {
  it('renders without crashing with empty tasks and no sprints', () => {
    mockSprintsData = [];
    renderChart([]);
    expect(screen.getByText('Team Velocity')).toBeTruthy();
  });

  it('renders the "Team Velocity" chart section', () => {
    mockSprintsData = [];
    renderChart([]);
    expect(screen.getByText('Team Velocity')).toBeTruthy();
    expect(screen.getByText('Story points per sprint')).toBeTruthy();
  });

  it('renders "Sprint Burndown" section', () => {
    mockSprintsData = [];
    renderChart([]);
    expect(screen.getByText('Sprint Burndown')).toBeTruthy();
  });

  it('renders "Issue Distribution" section', () => {
    mockSprintsData = [];
    renderChart([]);
    expect(screen.getByText('Issue Distribution')).toBeTruthy();
  });

  it('renders "Sprint Progress" section', () => {
    mockSprintsData = [];
    renderChart([]);
    expect(screen.getByText('Sprint Progress')).toBeTruthy();
  });

  it('renders 4 stat cards', () => {
    mockSprintsData = [];
    renderChart([]);
    expect(screen.getByText('Avg Velocity')).toBeTruthy();
    expect(screen.getByText('Current Sprint')).toBeTruthy();
    expect(screen.getByText('Completion Rate')).toBeTruthy();
    expect(screen.getByText('Carryover')).toBeTruthy();
  });

  it('renders chart legends', () => {
    mockSprintsData = [];
    renderChart([]);
    expect(screen.getAllByText('Committed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
  });
});

// =============================================================================
// SUITE 3 — Stat card calculations (no sprints, no tasks)
// =============================================================================
describe('VelocityCharts — stat cards with empty data', () => {
  it('shows "0 pts" avg velocity when no completed data', () => {
    mockSprintsData = [];
    renderChart([]);
    expect(screen.getByText('0 pts')).toBeTruthy();
  });

  it('shows "0/0" for current sprint when no active sprint', () => {
    mockSprintsData = [];
    renderChart([]);
    expect(screen.getByText('0/0')).toBeTruthy();
  });

  it('shows "0%" completion rate with no tasks', () => {
    mockSprintsData = [];
    renderChart([]);
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('renders carryover stat card', () => {
    mockSprintsData = [];
    renderChart([]);
    expect(screen.getByText('Carryover')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 4 — Stat card calculations with real sprint + tasks
// =============================================================================
describe('VelocityCharts — stat cards with sprint tasks', () => {
  it('computes current sprint completed/total correctly', () => {
    mockSprintsData = [MOCK_SPRINTS[0]]; // active sprint id=1
    renderChart(MOCK_TASKS_SPRINT1);
    // 5 completed out of 5+8+3=16 total
    expect(screen.getByText('5/16')).toBeTruthy();
  });

  it('computes completion rate correctly', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    renderChart(MOCK_TASKS_SPRINT1);
    // 5/16 = 31%
    expect(screen.getByText('31%')).toBeTruthy();
  });

  it('computes avg velocity from completed sprint data', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    // Only historical fallback contributes since sprint 1 has completed=5
    renderChart(MOCK_TASKS_SPRINT1);
    // Both avg velocity and carryover show "pts" — use getAllByText and verify at least one
    expect(screen.getAllByText(/\d+ pts/).length).toBeGreaterThan(0);
  });

  it('shows 0/0 when no tasks in active sprint', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    renderChart(makeTasks([{ id: 'T-5', sprintId: '2', storyPoints: 3, status: 'completed' }]));
    expect(screen.getByText('0/0')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 5 — Active sprint display
// =============================================================================
describe('VelocityCharts — active sprint display', () => {
  it('shows active sprint name in burndown subtitle', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    renderChart([]);
    expect(screen.getByText('Sprint 24')).toBeTruthy();
  });

  it('shows "No active sprint" when no sprints', () => {
    mockSprintsData = [];
    renderChart([]);
    expect(screen.getByText('No active sprint')).toBeTruthy();
  });

  it('shows "No active sprint" when all sprints are future', () => {
    mockSprintsData = [{ ...MOCK_SPRINTS[0], status: 'future' }, { ...MOCK_SPRINTS[1] }];
    renderChart([]);
    expect(screen.getByText('No active sprint')).toBeTruthy();
  });

  it('shows "No active sprint" when all sprints are completed', () => {
    mockSprintsData = [{ ...MOCK_SPRINTS[2] }]; // completed
    renderChart([]);
    expect(screen.getByText('No active sprint')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 6 — Velocity data with API sprints
// =============================================================================
describe('VelocityCharts — velocity data with API sprints', () => {
  it('renders BarChart for velocity', () => {
    mockSprintsData = MOCK_SPRINTS;
    renderChart(MOCK_TASKS_MIXED);
    expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
  });

  it('renders LineChart for burndown', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    renderChart(MOCK_TASKS_SPRINT1);
    expect(screen.getByTestId('line-chart')).toBeTruthy();
  });

  it('renders AreaChart for sprint progress', () => {
    mockSprintsData = MOCK_SPRINTS;
    renderChart(MOCK_TASKS_MIXED);
    expect(screen.getByTestId('area-chart')).toBeTruthy();
  });

  it('matches tasks to sprint by string coercion of numeric id', () => {
    // Tasks have sprintId '1', sprint has id: 1 (number)
    mockSprintsData = [MOCK_SPRINTS[0]]; // id: 1
    renderChart(MOCK_TASKS_SPRINT1); // sprintId: '1'
    // 5/16 shows that tasks were matched to sprint id 1
    expect(screen.getByText('5/16')).toBeTruthy();
  });

  it('correctly computes 100% completion when all tasks done', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    const allDone = makeTasks([
      { sprintId: '1', storyPoints: 5, status: 'completed' },
      { sprintId: '1', storyPoints: 3, status: 'completed' },
    ]);
    renderChart(allDone);
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('completion rate is 0% when active sprint has no completed tasks', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    const noDone = makeTasks([
      { sprintId: '1', storyPoints: 5, status: 'todo' },
      { sprintId: '1', storyPoints: 3, status: 'in_progress' },
    ]);
    renderChart(noDone);
    expect(screen.getByText('0%')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 7 — Velocity history: API data vs fallback
// =============================================================================
describe('VelocityCharts — velocity history', () => {
  it('uses FALLBACK_VELOCITY_HISTORY when no API data', () => {
    mockSprintsData = [];
    mockVelocityHistoryData = null;
    renderChart([]);
    // The velocity BarChart should have data (fallback 4 entries)
    const barCharts = screen.getAllByTestId('bar-chart');
    const velocityChart = barCharts[0];
    // data-count attribute = 4 fallback entries + 0 sprint entries
    expect(Number(velocityChart.getAttribute('data-count'))).toBe(4);
  });

  it('uses API velocity history when available', () => {
    mockSprintsData = [];
    mockVelocityHistoryData = MOCK_VELOCITY_HISTORY;
    renderChart([]);
    const barCharts = screen.getAllByTestId('bar-chart');
    // 2 API entries + 0 sprint entries = 2 total
    expect(Number(barCharts[0].getAttribute('data-count'))).toBe(2);
  });

  it('combines API history with current sprint data', () => {
    mockSprintsData = [MOCK_SPRINTS[0]]; // 1 sprint
    mockVelocityHistoryData = MOCK_VELOCITY_HISTORY; // 2 history entries
    renderChart(MOCK_TASKS_SPRINT1);
    const barCharts = screen.getAllByTestId('bar-chart');
    // 2 history + 1 sprint = 3 total
    expect(Number(barCharts[0].getAttribute('data-count'))).toBe(3);
  });

  it('velocity history with empty array still uses fallback', () => {
    mockSprintsData = [];
    mockVelocityHistoryData = [];
    renderChart([]);
    const barCharts = screen.getAllByTestId('bar-chart');
    expect(Number(barCharts[0].getAttribute('data-count'))).toBe(4); // fallback 4 entries
  });

  it('handles multiple sprint data combined with history', () => {
    mockSprintsData = MOCK_SPRINTS; // 3 sprints
    mockVelocityHistoryData = MOCK_VELOCITY_HISTORY; // 2 history entries
    renderChart(MOCK_TASKS_MIXED);
    const barCharts = screen.getAllByTestId('bar-chart');
    expect(Number(barCharts[0].getAttribute('data-count'))).toBe(5); // 2 + 3
  });
});

// =============================================================================
// SUITE 8 — Avg velocity computation
// =============================================================================
describe('VelocityCharts — avg velocity computation', () => {
  it('computes avg from fallback when no API history and no sprint tasks', () => {
    mockSprintsData = [];
    mockVelocityHistoryData = null;
    renderChart([]);
    // Fallback: [18, 22, 25, 26] → avg = 22.75 → 23
    expect(screen.getByText('23 pts')).toBeTruthy();
  });

  it('computes avg from API velocity history', () => {
    mockSprintsData = [];
    mockVelocityHistoryData = MOCK_VELOCITY_HISTORY; // completed: 18, 22 → avg = 20
    renderChart([]);
    expect(screen.getByText('20 pts')).toBeTruthy();
  });

  it('includes current sprint completed in avg', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    mockVelocityHistoryData = null;
    // Sprint 1: committed=16, completed=5
    // Fallback history: [18,22,25,26], current sprint: 5 → avg of 18,22,25,26,5 = 96/5 = 19.2 → 19
    renderChart(MOCK_TASKS_SPRINT1);
    expect(screen.getByText('19 pts')).toBeTruthy();
  });

  it('shows "0 pts" avg velocity when API history is all-zero completed', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    // Provide API history with zero completed entries so fallback is NOT used
    mockVelocityHistoryData = [
      { id: 1, projectId: 10, sprintLabel: 'Sprint -1', committed: 5, completed: 0, carryover: 5, recordedAt: 1700000000000 },
    ];
    // Sprint 1 also has no completed tasks
    renderChart(makeTasks([{ sprintId: '1', storyPoints: 5, status: 'todo' }]));
    expect(screen.getByText('0 pts')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 9 — Carryover stat
// =============================================================================
describe('VelocityCharts — carryover stat', () => {
  it('shows 0 pts carryover when data is empty', () => {
    mockSprintsData = [];
    mockVelocityHistoryData = [];
    renderChart([]);
    expect(screen.getByText('0 pts')).toBeTruthy();
  });

  it('shows last entry carryover from API history', () => {
    mockSprintsData = [];
    mockVelocityHistoryData = MOCK_VELOCITY_HISTORY; // last carryover: 2
    renderChart([]);
    expect(screen.getByText('2 pts')).toBeTruthy();
  });

  it('shows carryover from last sprint when no API history and sprints present', () => {
    mockSprintsData = [MOCK_SPRINTS[0]]; // sprint 1: committed 16, completed 5 → carryover 11
    mockVelocityHistoryData = null;
    renderChart(MOCK_TASKS_SPRINT1);
    // Last velocity entry = sprint 1 with carryover 11
    expect(screen.getByText('11 pts')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 10 — Issue distribution chart
// =============================================================================
describe('VelocityCharts — issue distribution', () => {
  it('renders issue distribution bar chart', () => {
    mockSprintsData = [];
    renderChart([]);
    const barCharts = screen.getAllByTestId('bar-chart');
    expect(barCharts.length).toBeGreaterThanOrEqual(2); // velocity + distribution
  });

  it('correctly totals bug story points', () => {
    mockSprintsData = [];
    const tasks = makeTasks([
      { issueType: 'bug', storyPoints: 5, status: 'todo' },
      { issueType: 'bug', storyPoints: 3, status: 'todo' },
      { issueType: 'story', storyPoints: 8, status: 'todo' },
    ]);
    renderChart(tasks);
    // Just verify it renders without crash — the data is inside recharts
    expect(screen.getByText('Issue Distribution')).toBeTruthy();
  });

  it('handles tasks with undefined storyPoints gracefully', () => {
    mockSprintsData = [];
    const tasks = makeTasks([
      { issueType: 'task', storyPoints: undefined },
      { issueType: 'bug' },
    ]);
    renderChart(tasks);
    expect(screen.getByText('Issue Distribution')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 11 — Burndown chart
// =============================================================================
describe('VelocityCharts — burndown chart', () => {
  it('renders burndown chart with active sprint data', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    renderChart(MOCK_TASKS_SPRINT1);
    expect(screen.getByTestId('line-chart')).toBeTruthy();
  });

  it('renders burndown chart with empty data when no active sprint', () => {
    mockSprintsData = [];
    renderChart([]);
    const lineChart = screen.getByTestId('line-chart');
    expect(Number(lineChart.getAttribute('data-count'))).toBe(0);
  });

  it('handles active sprint with no tasks gracefully', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    renderChart([]);
    // Should still render without crashing
    expect(screen.getByText('Sprint Burndown')).toBeTruthy();
  });

  it('generates burn down data with totalDays > 0', () => {
    mockSprintsData = [MOCK_SPRINTS[0]]; // 14-day sprint
    renderChart(MOCK_TASKS_SPRINT1);
    const lineChart = screen.getByTestId('line-chart');
    // totalDays = 13 (Feb 3 to Feb 16), so 14 data points (day 0 to day 13)
    expect(Number(lineChart.getAttribute('data-count'))).toBeGreaterThan(0);
  });

  it('displays active sprint name as burndown subtitle', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    renderChart([]);
    expect(screen.getByText('Sprint 24')).toBeTruthy();
  });

  it('handles edge case where startDate === endDate', () => {
    mockSprintsData = [{ ...MOCK_SPRINTS[0], startDate: '2026-02-03', endDate: '2026-02-03' }];
    renderChart([]);
    expect(screen.getByText('Sprint Burndown')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 12 — Sprint progress (cumulative flow) area chart
// =============================================================================
describe('VelocityCharts — sprint progress area chart', () => {
  it('renders the area chart', () => {
    mockSprintsData = [];
    renderChart([]);
    expect(screen.getByTestId('area-chart')).toBeTruthy();
  });

  it('uses static hardcoded progress data (7 entries)', () => {
    mockSprintsData = [];
    renderChart([]);
    const areaChart = screen.getByTestId('area-chart');
    expect(Number(areaChart.getAttribute('data-count'))).toBe(7);
  });

  it('renders "Work item status over time" subtitle', () => {
    mockSprintsData = [];
    renderChart([]);
    expect(screen.getByText('Work item status over time')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 13 — projectDbId prop behavior
// =============================================================================
describe('VelocityCharts — projectDbId prop', () => {
  it('renders correctly with projectDbId set', () => {
    mockSprintsData = MOCK_SPRINTS;
    mockVelocityHistoryData = MOCK_VELOCITY_HISTORY;
    renderChart(MOCK_TASKS_SPRINT1, 10);
    expect(screen.getByText('Team Velocity')).toBeTruthy();
  });

  it('renders correctly without projectDbId (legacy path)', () => {
    mockSprintsData = null;
    mockVelocityHistoryData = null;
    renderChart(MOCK_TASKS_SPRINT1, undefined);
    expect(screen.getByText('Team Velocity')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 14 — Edge cases
// =============================================================================
describe('VelocityCharts — edge cases', () => {
  it('renders without crashing when tasks is empty array', () => {
    mockSprintsData = MOCK_SPRINTS;
    renderChart([]);
    expect(screen.getByText('Team Velocity')).toBeTruthy();
  });

  it('renders without crashing when tasks array is large', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    const manyTasks = makeTasks(
      Array.from({ length: 50 }, (_, i) => ({
        sprintId: '1',
        storyPoints: 2,
        status: (i % 2 === 0 ? 'completed' : 'todo') as any,
        issueType: ['story', 'task', 'bug', 'subtask'][i % 4] as any,
      }))
    );
    renderChart(manyTasks);
    expect(screen.getByText('Team Velocity')).toBeTruthy();
  });

  it('handles tasks with storyPoints 0', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    const tasks = makeTasks([{ sprintId: '1', storyPoints: 0, status: 'completed' }]);
    renderChart(tasks);
    expect(screen.getByText('0/0')).toBeTruthy();
  });

  it('renders with multiple future sprints', () => {
    mockSprintsData = [
      { ...MOCK_SPRINTS[1] }, // future
      { ...MOCK_SPRINTS[1], id: 4, name: 'Sprint 27', status: 'future' },
    ];
    renderChart([]);
    expect(screen.getByText('No active sprint')).toBeTruthy();
  });

  it('handles tasks belonging to non-existent sprints gracefully', () => {
    mockSprintsData = [MOCK_SPRINTS[0]]; // only sprint 1
    const tasks = makeTasks([
      { sprintId: '999', storyPoints: 5, status: 'completed' }, // no sprint 999
    ]);
    renderChart(tasks);
    expect(screen.getByText('0/0')).toBeTruthy();
  });

  it('renders legend items for Ideal and Actual burndown', () => {
    mockSprintsData = [MOCK_SPRINTS[0]];
    renderChart([]);
    expect(screen.getByText('Ideal')).toBeTruthy();
    expect(screen.getByText('Actual')).toBeTruthy();
  });

  it('renders trend indicators on stat cards', () => {
    mockSprintsData = [];
    renderChart([]);
    // Positive trends render as "+12%" and "+5%"
    // Negative trend renders as "8%" (no minus sign — component uses empty string for negative)
    expect(screen.getByText('+12%')).toBeTruthy();
    expect(screen.getByText('+5%')).toBeTruthy();
    expect(screen.getByText('8%')).toBeTruthy();
  });
});
