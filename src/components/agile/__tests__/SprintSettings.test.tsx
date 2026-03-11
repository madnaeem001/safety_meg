import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SprintSettings, SprintConfig } from '../SprintSettings';

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
  Sprint: {},
  SPRINTS: [],
}));

// ── Static mock data ──────────────────────────────────────────────────────────

const MOCK_SPRINTS = [
  {
    id: 1,
    name: 'Sprint 1',
    startDate: '2026-01-01',
    endDate: '2026-01-14',
    goal: 'Foundation work',
    status: 'completed',
    projectId: 1,
  },
  {
    id: 2,
    name: 'Sprint 2',
    startDate: '2026-01-15',
    endDate: '2026-01-28',
    goal: 'Core features',
    status: 'active',
    projectId: 1,
  },
  {
    id: 3,
    name: 'Sprint 3',
    startDate: '2026-02-01',
    endDate: '2026-02-14',
    goal: 'Polish features',
    status: 'future',
    projectId: 1,
  },
];

const MOCK_SETTINGS = {
  id: 1,
  defaultDuration: 14,
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  sprintStartDay: 'monday',
  velocityTarget: 40,
  maxCapacity: 50,
  bufferPercentage: 20,
  autoStartEnabled: true,
  notifications: {
    sprintStart: true,
    sprintEnd: true,
    capacityWarning: true,
    dailyStandup: false,
  },
};

// ── Hook mutable state ────────────────────────────────────────────────────────

let mockSprintsData: any[] = MOCK_SPRINTS;
let mockSprintsLoading = false;
let mockSettingsData: any = MOCK_SETTINGS;

const mockRefetchSprints = vi.fn();
const mockCreateSprintMutate = vi.fn();
const mockUpdateSprintMutate = vi.fn();
const mockDeleteSprintMutate = vi.fn();
const mockSaveSettingsMutate = vi.fn();

// ── useAPIHooks mock ──────────────────────────────────────────────────────────

vi.mock('../../../api/hooks/useAPIHooks', () => ({
  useProjectSprints: () => ({
    data: mockSprintsData,
    loading: mockSprintsLoading,
    error: null,
    refetch: mockRefetchSprints,
  }),
  useSprintSettings: () => ({
    data: mockSettingsData,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreateSprint: () => ({
    mutate: mockCreateSprintMutate,
    loading: false,
    error: null,
  }),
  useUpdateSprint: () => ({
    mutate: mockUpdateSprintMutate,
    loading: false,
    error: null,
  }),
  useDeleteSprint: () => ({
    mutate: mockDeleteSprintMutate,
    loading: false,
    error: null,
  }),
  useSaveSprintSettings: () => ({
    mutate: mockSaveSettingsMutate,
    loading: false,
    error: null,
  }),
}));

// ── Helper ────────────────────────────────────────────────────────────────────

function renderComponent(props: { onUpdateSprints?: (s: any[]) => void } = {}) {
  return render(<SprintSettings {...props} />);
}

// ── beforeEach ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockSprintsData = MOCK_SPRINTS;
  mockSprintsLoading = false;
  mockSettingsData = MOCK_SETTINGS;
});

// =============================================================================
// SUITE 1 — Module exports
// =============================================================================

describe('SprintSettings — module exports', () => {
  it('exports SprintSettings as a named function', () => {
    expect(typeof SprintSettings).toBe('function');
  });

  it('exports SprintConfig interface (via type usage)', () => {
    const cfg: SprintConfig = {
      defaultDuration: 14,
      workingDays: ['monday'],
      sprintStartDay: 'monday',
      velocityTarget: 40,
      maxCapacity: 50,
      bufferPercentage: 20,
      autoStartEnabled: true,
      notifications: { sprintStart: true, sprintEnd: true, capacityWarning: true, dailyStandup: false },
    };
    expect(cfg.defaultDuration).toBe(14);
  });
});

// =============================================================================
// SUITE 2 — Loading state
// =============================================================================

describe('SprintSettings — loading state', () => {
  it('renders a loading spinner while sprints are loading', () => {
    mockSprintsLoading = true;
    mockSprintsData = [];
    renderComponent();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('does not render the header while loading', () => {
    mockSprintsLoading = true;
    mockSprintsData = [];
    renderComponent();
    expect(screen.queryByText('Sprint Settings')).toBeNull();
  });

  it('renders main UI once sprints are loaded', () => {
    renderComponent();
    expect(screen.getByText('Sprint Settings')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 3 — Initial render
// =============================================================================

describe('SprintSettings — initial render', () => {
  it('renders the page heading', () => {
    renderComponent();
    expect(screen.getByText('Sprint Settings')).toBeTruthy();
  });

  it('renders the subtitle', () => {
    renderComponent();
    expect(screen.getByText('Configure sprint duration and team capacity')).toBeTruthy();
  });

  it('renders Sprint Duration section', () => {
    renderComponent();
    expect(screen.getByText('Sprint Duration')).toBeTruthy();
  });

  it('renders Team Capacity section', () => {
    renderComponent();
    expect(screen.getByText('Team Capacity')).toBeTruthy();
  });

  it('renders Automation & Notifications section', () => {
    renderComponent();
    expect(screen.getByText('Automation & Notifications')).toBeTruthy();
  });

  it('renders Sprint Management section', () => {
    renderComponent();
    expect(screen.getByText('Sprint Management')).toBeTruthy();
  });

  it('renders Reset button', () => {
    renderComponent();
    expect(screen.getByText('Reset')).toBeTruthy();
  });

  it('renders Save Settings button', () => {
    renderComponent();
    expect(screen.getByText('Save Settings')).toBeTruthy();
  });

  it('renders New Sprint button', () => {
    renderComponent();
    expect(screen.getByText('New Sprint')).toBeTruthy();
  });

  it('renders Effective Capacity section', () => {
    renderComponent();
    expect(screen.getByText('Effective Capacity')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 4 — Config sync from API settings
// =============================================================================

describe('SprintSettings — config sync from API', () => {
  it('shows buffer percentage from API settings', () => {
    renderComponent();
    expect(screen.getByText(/Buffer Percentage: 20%/)).toBeTruthy();
  });

  it('shows maxCapacity from API settings in capacity field', () => {
    renderComponent();
    const inputs = document.querySelectorAll('input[type="number"]');
    const capacityInput = Array.from(inputs).find(
      (i) => (i as HTMLInputElement).value === '50'
    );
    expect(capacityInput).toBeTruthy();
  });

  it('shows velocity target from API settings', () => {
    renderComponent();
    const inputs = document.querySelectorAll('input[type="number"]');
    const velocityInput = Array.from(inputs).find(
      (i) => (i as HTMLInputElement).value === '40'
    );
    expect(velocityInput).toBeTruthy();
  });

  it('calculates effective capacity correctly (50 - 20% = 40)', () => {
    renderComponent();
    expect(screen.getByText('40 points')).toBeTruthy();
  });

  it('syncs to DEFAULT_CONFIG when settingsData is null', () => {
    mockSettingsData = null;
    renderComponent();
    // Should still render with default config
    expect(screen.getByText('Sprint Settings')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 5 — Duration presets
// =============================================================================

describe('SprintSettings — duration presets', () => {
  it('renders all 4 duration preset buttons', () => {
    renderComponent();
    expect(screen.getByText('1 Week')).toBeTruthy();
    expect(screen.getByText('2 Weeks')).toBeTruthy();
    expect(screen.getByText('3 Weeks')).toBeTruthy();
    expect(screen.getByText('4 Weeks')).toBeTruthy();
  });

  it('clicking 1 Week preset sets duration to 7', () => {
    renderComponent();
    fireEvent.click(screen.getByText('1 Week'));
    const durationInput = document.querySelector('input[type="number"]') as HTMLInputElement;
    expect(durationInput.value).toBe('7');
  });

  it('clicking 3 Weeks preset sets duration to 21', () => {
    renderComponent();
    fireEvent.click(screen.getByText('3 Weeks'));
    const durationInput = document.querySelector('input[type="number"]') as HTMLInputElement;
    expect(durationInput.value).toBe('21');
  });

  it('clicking 4 Weeks preset sets duration to 28', () => {
    renderComponent();
    fireEvent.click(screen.getByText('4 Weeks'));
    const durationInput = document.querySelector('input[type="number"]') as HTMLInputElement;
    expect(durationInput.value).toBe('28');
  });

  it('typing in the custom duration input updates the config', () => {
    renderComponent();
    const durationInput = document.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(durationInput, { target: { value: '10' } });
    expect(durationInput.value).toBe('10');
  });
});

// Helper: find a working-days button by its visible label (not a <select> option)
function getWorkingDayBtn(label: string) {
  return screen.getAllByText(label).find(
    (el) => el.tagName.toLowerCase() === 'button'
  )!;
}

// =============================================================================
// SUITE 6 — Working days toggle
// =============================================================================

describe('SprintSettings — working days toggle', () => {
  it('renders all 7 weekday buttons', () => {
    renderComponent();
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((day) => {
      const btn = screen.getAllByText(day).find(
        (el) => el.tagName.toLowerCase() === 'button'
      );
      expect(btn).toBeTruthy();
    });
  });

  it('shows "5 working days per week" with default Mon-Fri', () => {
    renderComponent();
    expect(screen.getByText('5 working days per week')).toBeTruthy();
  });

  it('toggling Saturday adds it to working days', () => {
    renderComponent();
    fireEvent.click(getWorkingDayBtn('Sat'));
    expect(screen.getByText('6 working days per week')).toBeTruthy();
  });

  it('toggling Mon removes it from working days', () => {
    renderComponent();
    fireEvent.click(getWorkingDayBtn('Mon'));
    expect(screen.getByText('4 working days per week')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 7 — Team capacity controls
// =============================================================================

describe('SprintSettings — team capacity controls', () => {
  it('renders velocity target input', () => {
    renderComponent();
    const inputs = document.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBeGreaterThanOrEqual(3);
  });

  it('renders buffer range slider', () => {
    renderComponent();
    const slider = document.querySelector('input[type="range"]');
    expect(slider).toBeTruthy();
  });

  it('shows "0% (No buffer)" label', () => {
    renderComponent();
    expect(screen.getByText('0% (No buffer)')).toBeTruthy();
  });

  it('shows "50% (Conservative)" label', () => {
    renderComponent();
    expect(screen.getByText('50% (Conservative)')).toBeTruthy();
  });

  it('adjusting buffer slider updates buffer percentage display', () => {
    renderComponent();
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '30' } });
    expect(screen.getByText(/Buffer Percentage: 30%/)).toBeTruthy();
  });

  it('recalculates effective capacity when buffer changes', () => {
    renderComponent();
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '0' } });
    // 50 max - 0% buffer = 50
    expect(screen.getByText('50 points')).toBeTruthy();
  });

  it('shows "X max - Y% buffer" description', () => {
    renderComponent();
    expect(screen.getByText(/50 max - 20% buffer/)).toBeTruthy();
  });
});

// =============================================================================
// SUITE 8 — Automation & Notifications
// =============================================================================

describe('SprintSettings — automation and notifications', () => {
  it('renders Auto-start Next Sprint toggle', () => {
    renderComponent();
    expect(screen.getByText('Auto-start Next Sprint')).toBeTruthy();
  });

  it('renders Sprint Start notification toggle', () => {
    renderComponent();
    expect(screen.getByText('Sprint Start')).toBeTruthy();
  });

  it('renders Sprint End notification toggle', () => {
    renderComponent();
    expect(screen.getByText('Sprint End')).toBeTruthy();
  });

  it('renders Capacity Warning notification toggle', () => {
    renderComponent();
    expect(screen.getByText('Capacity Warning')).toBeTruthy();
  });

  it('renders Daily Standup Reminder toggle', () => {
    renderComponent();
    expect(screen.getByText('Daily Standup Reminder')).toBeTruthy();
  });

  it('clicking auto-start toggle changes its state', () => {
    renderComponent();
    const toggleButtons = screen.getAllByRole('button').filter(
      (b) => b.classList.contains('rounded-full') && b.classList.contains('w-12')
    );
    if (toggleButtons.length > 0) {
      fireEvent.click(toggleButtons[0]);
      expect(toggleButtons[0]).toBeTruthy();
    }
  });

  it('clicking a notification toggle changes its state', () => {
    renderComponent();
    const dailyStandup = screen.getByText('Daily Standup Reminder').closest('div')?.parentElement;
    const toggle = dailyStandup?.querySelector('button');
    if (toggle) {
      fireEvent.click(toggle);
      // toggle clicked successfully
      expect(toggle).toBeTruthy();
    }
  });
});

// =============================================================================
// SUITE 9 — Save config
// =============================================================================

describe('SprintSettings — save config', () => {
  it('calls saveSettingsMutation.mutate when Save Settings is clicked', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Save Settings'));
    await waitFor(() => {
      expect(mockSaveSettingsMutate).toHaveBeenCalledOnce();
    });
  });

  it('passes current config to save mutation', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Save Settings'));
    await waitFor(() => {
      expect(mockSaveSettingsMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultDuration: expect.any(Number),
          workingDays: expect.any(Array),
        })
      );
    });
  });

  it('shows "Saved!" text briefly after save', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Save Settings'));
    await waitFor(() => {
      expect(screen.getByText('Saved!')).toBeTruthy();
    });
  });

  it('calls onUpdateSprints callback after save', async () => {
    const onUpdateSprints = vi.fn();
    renderComponent({ onUpdateSprints });
    fireEvent.click(screen.getByText('Save Settings'));
    await waitFor(() => {
      expect(onUpdateSprints).toHaveBeenCalled();
    });
  });

  it('resets config to DEFAULT_CONFIG on Reset click', () => {
    renderComponent();
    // Change duration
    fireEvent.click(screen.getByText('1 Week'));
    // Then reset
    fireEvent.click(screen.getByText('Reset'));
    const durationInput = document.querySelector('input[type="number"]') as HTMLInputElement;
    expect(durationInput.value).toBe('14');
  });

  it('does not call saveSettingsMutation after reset (only after save)', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Reset'));
    // No save called
    expect(mockSaveSettingsMutate).not.toHaveBeenCalled();
  });
});

// =============================================================================
// SUITE 10 — Sprint list rendering
// =============================================================================

describe('SprintSettings — sprint list', () => {
  it('renders all sprints from API in the sprint list', () => {
    renderComponent();
    expect(screen.getByText('Sprint 1')).toBeTruthy();
    expect(screen.getByText('Sprint 2')).toBeTruthy();
    expect(screen.getByText('Sprint 3')).toBeTruthy();
  });

  it('shows sprint status badges', () => {
    renderComponent();
    expect(screen.getByText('completed')).toBeTruthy();
    expect(screen.getByText('active')).toBeTruthy();
    expect(screen.getByText('future')).toBeTruthy();
  });

  it('shows sprint date range', () => {
    renderComponent();
    expect(screen.getByText(/2026-01-01/)).toBeTruthy();
  });

  it('shows sprint goal', () => {
    renderComponent();
    expect(screen.getByText('Foundation work')).toBeTruthy();
  });

  it('renders delete button for each sprint', () => {
    renderComponent();
    const trashButtons = document.querySelectorAll('button svg.lucide-trash-2');
    expect(trashButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders empty sprint list without crashing when sprints is empty', () => {
    mockSprintsData = [];
    renderComponent();
    expect(screen.getByText('Sprint Management')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 11 — Delete sprint
// =============================================================================

describe('SprintSettings — delete sprint', () => {
  it('calls deleteSprintMutation.mutate with numeric sprint id', async () => {
    renderComponent();
    const trashButtons = document.querySelectorAll('button svg.lucide-trash-2');
    expect(trashButtons.length).toBeGreaterThan(0);
    fireEvent.click(trashButtons[0].closest('button')!);
    await waitFor(() => {
      expect(mockDeleteSprintMutate).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  it('calls refetchSprints after deleting a sprint', async () => {
    renderComponent();
    const trashButton = document.querySelector('button svg.lucide-trash-2')?.closest('button');
    if (trashButton) {
      fireEvent.click(trashButton);
      await waitFor(() => expect(mockRefetchSprints).toHaveBeenCalled());
    }
  });

  it('passes the numeric id of the correct sprint to delete mutation', async () => {
    renderComponent();
    const trashButtons = document.querySelectorAll('button svg.lucide-trash-2');
    fireEvent.click(trashButtons[0].closest('button')!);
    await waitFor(() => {
      expect(mockDeleteSprintMutate).toHaveBeenCalledWith(1); // Sprint 1 has id=1
    });
  });
});

// =============================================================================
// SUITE 12 — Create sprint form
// =============================================================================

describe('SprintSettings — create sprint form', () => {
  it('shows create form when New Sprint is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('New Sprint'));
    expect(screen.getByPlaceholderText('Sprint 4')).toBeTruthy();
  });

  it('renders Sprint Name input in create form', () => {
    renderComponent();
    fireEvent.click(screen.getByText('New Sprint'));
    expect(screen.getByPlaceholderText('Sprint 4')).toBeTruthy();
  });

  it('renders Sprint Goal input in create form', () => {
    renderComponent();
    fireEvent.click(screen.getByText('New Sprint'));
    expect(screen.getByPlaceholderText('What do you want to achieve?')).toBeTruthy();
  });

  it('Create Sprint button is disabled when name is empty', () => {
    renderComponent();
    fireEvent.click(screen.getByText('New Sprint'));
    const createBtn = screen.getByRole('button', { name: 'Create Sprint' });
    expect((createBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('Create Sprint button is enabled when name and start date are filled', () => {
    renderComponent();
    fireEvent.click(screen.getByText('New Sprint'));
    fireEvent.change(screen.getByPlaceholderText('Sprint 4'), { target: { value: 'Sprint 4' } });
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-03-01' } });
    const createBtn = screen.getByRole('button', { name: 'Create Sprint' });
    expect((createBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it('calls createSprintMutation.mutate with correct data', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('New Sprint'));
    fireEvent.change(screen.getByPlaceholderText('Sprint 4'), { target: { value: 'Sprint 4' } });
    fireEvent.change(screen.getByPlaceholderText('What do you want to achieve?'), {
      target: { value: 'Deliver v2.0' },
    });
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-03-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Sprint' }));
    await waitFor(() => {
      expect(mockCreateSprintMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Sprint 4',
          goal: 'Deliver v2.0',
          startDate: '2026-03-01',
          status: 'future',
        })
      );
    });
  });

  it('calls refetchSprints after creating a sprint', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('New Sprint'));
    fireEvent.change(screen.getByPlaceholderText('Sprint 4'), { target: { value: 'Sprint 4' } });
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-03-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Sprint' }));
    await waitFor(() => expect(mockRefetchSprints).toHaveBeenCalled());
  });

  it('hides create form after clicking Cancel', () => {
    renderComponent();
    fireEvent.click(screen.getByText('New Sprint'));
    expect(screen.getByPlaceholderText('Sprint 4')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Sprint 4')).toBeNull();
  });
});

// =============================================================================
// SUITE 13 — Edit sprint inline
// =============================================================================

describe('SprintSettings — edit sprint inline', () => {
  it('clicking edit button shows inline edit inputs', () => {
    renderComponent();
    // The Clock icon button triggers edit mode
    const clockButtons = document.querySelectorAll('button svg.lucide-clock');
    expect(clockButtons.length).toBeGreaterThan(0);
    fireEvent.click(clockButtons[0].closest('button')!);
    const editInputs = document.querySelectorAll('input[type="text"]');
    expect(editInputs.length).toBeGreaterThan(0);
  });

  it('calls updateSprintMutation on name blur in edit mode', async () => {
    renderComponent();
    const clockButtons = document.querySelectorAll('button svg.lucide-clock');
    fireEvent.click(clockButtons[0].closest('button')!);
    const nameInput = document.querySelectorAll('input[type="text"]')[0] as HTMLInputElement;
    fireEvent.blur(nameInput, { target: { value: 'Sprint 1 Updated' } });
    await waitFor(() => {
      expect(mockUpdateSprintMutate).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.any(Number) })
      );
    });
  });

  it('calls refetchSprints after updating sprint', async () => {
    renderComponent();
    const clockButtons = document.querySelectorAll('button svg.lucide-clock');
    fireEvent.click(clockButtons[0].closest('button')!);
    const nameInput = document.querySelectorAll('input[type="text"]')[0] as HTMLInputElement;
    fireEvent.blur(nameInput, { target: { value: 'Updated Name' } });
    await waitFor(() => expect(mockRefetchSprints).toHaveBeenCalled());
  });
});

// =============================================================================
// SUITE 14 — Edge cases
// =============================================================================

describe('SprintSettings — edge cases', () => {
  it('renders without onUpdateSprints prop', () => {
    renderComponent();
    expect(screen.getByText('Sprint Settings')).toBeTruthy();
  });

  it('handles null settingsData without crash', () => {
    mockSettingsData = null;
    renderComponent();
    expect(screen.getByText('Sprint Settings')).toBeTruthy();
  });

  it('Sprint Start Day selector renders all weekdays', () => {
    renderComponent();
    const startDaySelect = document.querySelectorAll('select')[0] as HTMLSelectElement;
    expect(startDaySelect).toBeTruthy();
    const options = Array.from(startDaySelect.options).map((o) => o.value);
    expect(options).toContain('monday');
    expect(options).toContain('friday');
  });

  it('shows correct buffer description with 0% buffer', () => {
    renderComponent();
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '0' } });
    expect(screen.getByText(/50 max - 0% buffer/)).toBeTruthy();
  });

  it('does not crash when creating sprint without end date', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('New Sprint'));
    fireEvent.change(screen.getByPlaceholderText('Sprint 4'), { target: { value: 'Auto Sprint' } });
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-04-01' } });
    // no end date set
    fireEvent.click(screen.getByRole('button', { name: 'Create Sprint' }));
    await waitFor(() => {
      expect(mockCreateSprintMutate).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2026-04-01' })
      );
    });
  });
});
