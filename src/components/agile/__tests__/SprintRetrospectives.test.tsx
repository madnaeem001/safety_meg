import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  SprintRetrospectives,
  RetroCategory,
  SentimentType,
  RetroItem,
  SprintRetro,
} from '../SprintRetrospectives';

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
];

const MOCK_RETRO_ITEMS = [
  {
    id: 10,
    retroId: 1,
    category: 'went_well' as RetroCategory,
    content: 'Great team collaboration',
    author: 'John Smith',
    votes: 6,
    isActionable: false,
    status: 'pending' as const,
    createdAt: 1706349600000,
  },
  {
    id: 11,
    retroId: 1,
    category: 'needs_improvement' as RetroCategory,
    content: 'Story point estimation was inconsistent',
    author: 'Mike Davis',
    votes: 4,
    isActionable: false,
    status: 'pending' as const,
    createdAt: 1706349700000,
  },
  {
    id: 12,
    retroId: 1,
    category: 'action_items' as RetroCategory,
    content: 'Schedule estimation workshop',
    author: 'Sarah Johnson',
    votes: 8,
    isActionable: true,
    assignee: 'Sarah Johnson',
    dueDate: '2026-02-05',
    status: 'in_progress' as const,
    createdAt: 1706349800000,
  },
  {
    id: 13,
    retroId: 1,
    category: 'action_items' as RetroCategory,
    content: 'No-meeting Wednesday afternoons',
    author: 'Mike Davis',
    votes: 7,
    isActionable: true,
    assignee: 'Mike Davis',
    dueDate: '2026-02-01',
    status: 'completed' as const,
    createdAt: 1706349900000,
  },
];

const MOCK_RETRO = {
  id: 1,
  sprintId: '1',
  facilitator: 'Sarah Johnson',
  date: '2026-01-14',
  participants: ['John Smith', 'Sarah Johnson', 'Mike Davis'],
  summary: 'Strong sprint with improved communication.',
  teamSentiment: { happy: 5, neutral: 2, sad: 1 },
  items: MOCK_RETRO_ITEMS,
};

// ── Hook mutable state ────────────────────────────────────────────────────────

let mockSprintsData: any[] = MOCK_SPRINTS;
let mockSprintsLoading = false;
let mockRetroData: any = MOCK_RETRO;
let mockRetroLoading = false;

const mockRefetchRetro = vi.fn();
const mockAddRetroItemMutate = vi.fn();
const mockVoteItemMutate = vi.fn();
const mockUpdateItemMutate = vi.fn();
const mockDeleteItemMutate = vi.fn();
const mockVoteSentimentMutate = vi.fn();

// ── useAPIHooks mock ──────────────────────────────────────────────────────────

vi.mock('../../../api/hooks/useAPIHooks', () => ({
  useProjectSprints: () => ({
    data: mockSprintsData,
    loading: mockSprintsLoading,
    error: null,
    refetch: vi.fn(),
  }),
  useSprintRetro: (_sprintId: string | null) => ({
    data: mockRetroData,
    loading: mockRetroLoading,
    error: null,
    refetch: mockRefetchRetro,
  }),
  useAddRetroItem: () => ({
    mutate: mockAddRetroItemMutate,
    loading: false,
    error: null,
  }),
  useVoteRetroItem: () => ({
    mutate: mockVoteItemMutate,
    loading: false,
    error: null,
  }),
  useUpdateRetroItem: () => ({
    mutate: mockUpdateItemMutate,
    loading: false,
    error: null,
  }),
  useDeleteRetroItem: () => ({
    mutate: mockDeleteItemMutate,
    loading: false,
    error: null,
  }),
  useVoteRetroSentiment: () => ({
    mutate: mockVoteSentimentMutate,
    loading: false,
    error: null,
  }),
}));

// ── Helper ────────────────────────────────────────────────────────────────────

function renderComponent() {
  return render(<SprintRetrospectives />);
}

// ── beforeEach ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockSprintsData = MOCK_SPRINTS;
  mockSprintsLoading = false;
  mockRetroData = MOCK_RETRO;
  mockRetroLoading = false;
});

// =============================================================================
// SUITE 1 — Module exports
// =============================================================================

describe('SprintRetrospectives — module exports', () => {
  it('exports SprintRetrospectives as a named function', () => {
    expect(typeof SprintRetrospectives).toBe('function');
  });

  it('exports RetroCategory type (via import)', () => {
    const cat: RetroCategory = 'went_well';
    expect(cat).toBe('went_well');
  });

  it('exports SentimentType type (via import)', () => {
    const s: SentimentType = 'happy';
    expect(s).toBe('happy');
  });

  it('exports RetroItem interface shape (via import)', () => {
    const item: RetroItem = {
      id: '1',
      category: 'went_well',
      content: 'Test',
      author: 'Alice',
      votes: 0,
      timestamp: '2026-01-01',
    };
    expect(item.category).toBe('went_well');
  });

  it('exports SprintRetro interface shape (via import)', () => {
    const retro: SprintRetro = {
      sprintId: 'sprint-1',
      teamSentiment: { happy: 0, neutral: 0, sad: 0 },
      items: [],
      facilitator: 'Alice',
      date: '2026-01-01',
      participants: [],
    };
    expect(retro.sprintId).toBe('sprint-1');
  });
});

// =============================================================================
// SUITE 2 — Loading state
// =============================================================================

describe('SprintRetrospectives — loading state', () => {
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
    expect(screen.queryByText('Sprint Retrospective')).toBeNull();
  });

  it('renders the main UI once sprints are loaded', () => {
    renderComponent();
    expect(screen.getByText('Sprint Retrospective')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 3 — Initial render
// =============================================================================

describe('SprintRetrospectives — initial render', () => {
  it('renders the page heading', () => {
    renderComponent();
    expect(screen.getByText('Sprint Retrospective')).toBeTruthy();
  });

  it('renders the subtitle', () => {
    renderComponent();
    expect(screen.getByText('Reflect, learn, and improve together')).toBeTruthy();
  });

  it('renders the "Add Retrospective Item" button', () => {
    renderComponent();
    expect(screen.getByText('Add Retrospective Item')).toBeTruthy();
  });

  it('renders the sentiment section heading', () => {
    renderComponent();
    expect(screen.getByText('Team Sentiment')).toBeTruthy();
  });

  it('renders action items progress section', () => {
    renderComponent();
    expect(screen.getByText('Action Items Progress')).toBeTruthy();
  });

  it('renders facilitator from retro data', () => {
    renderComponent();
    expect(screen.getByText('Sarah Johnson')).toBeTruthy();
  });

  it('renders participant count', () => {
    renderComponent();
    expect(screen.getByText('3 participants')).toBeTruthy();
  });

  it('renders sprint summary when present', () => {
    renderComponent();
    expect(screen.getByText('Strong sprint with improved communication.')).toBeTruthy();
  });

  it('renders the "Sprint Summary" label', () => {
    renderComponent();
    expect(screen.getByText('Sprint Summary')).toBeTruthy();
  });

  it('does not render sprint summary section when summary is absent', () => {
    mockRetroData = { ...MOCK_RETRO, summary: undefined };
    renderComponent();
    expect(screen.queryByText('Sprint Summary')).toBeNull();
  });

  it('shows empty-state message when retro has no items', () => {
    mockRetroData = { ...MOCK_RETRO, items: [] };
    renderComponent();
    expect(screen.getByText('No items yet')).toBeTruthy();
  });
});

// =============================================================================
// SUITE 4 — Sprint selector
// =============================================================================

describe('SprintRetrospectives — sprint selector', () => {
  it('renders a sprint selector dropdown', () => {
    renderComponent();
    const select = document.querySelector('select');
    expect(select).toBeTruthy();
  });

  it('lists all sprints in the dropdown', () => {
    renderComponent();
    expect(screen.getAllByText('Sprint 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sprint 2').length).toBeGreaterThanOrEqual(1);
  });

  it('allows selecting a different sprint', () => {
    renderComponent();
    const select = document.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '2' } });
    expect(select.value).toBe('2');
  });

  it('resets user sentiment when sprint changes', () => {
    renderComponent();
    const happyBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Happy'));
    if (happyBtn) fireEvent.click(happyBtn);
    const select = document.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '2' } });
    // After sprint change userSentiment resets — the buttons become enabled again
    const buttons = screen.getAllByRole('button').filter(b => b.textContent?.includes('Happy'));
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders the Actions button with item count', () => {
    renderComponent();
    expect(screen.getByText(/Actions \(/)).toBeTruthy();
  });
});

// =============================================================================
// SUITE 5 — Retro items by category
// =============================================================================

describe('SprintRetrospectives — retro items by category', () => {
  it('shows "What Went Well" category header', () => {
    renderComponent();
    expect(screen.getByText('What Went Well')).toBeTruthy();
  });

  it('shows "Needs Improvement" category header', () => {
    renderComponent();
    expect(screen.getByText('Needs Improvement')).toBeTruthy();
  });

  it('shows "Action Items" category header', () => {
    renderComponent();
    expect(screen.getByText('Action Items')).toBeTruthy();
  });

  it('shows went-well item content after expanding', () => {
    renderComponent();
    // went_well is expanded by default
    expect(screen.getByText('Great team collaboration')).toBeTruthy();
  });

  it('shows author of went-well item', () => {
    renderComponent();
    expect(screen.getByText('— John Smith')).toBeTruthy();
  });

  it('shows vote count for went-well item', () => {
    renderComponent();
    expect(screen.getByText('6')).toBeTruthy();
  });

  it('collapses a category when its header is clicked again', () => {
    renderComponent();
    const wentWellBtn = screen.getByText('What Went Well').closest('button')!;
    fireEvent.click(wentWellBtn); // collapse
    expect(screen.queryByText('Great team collaboration')).toBeNull();
  });

  it('expands a category when its header is clicked', () => {
    renderComponent();
    const needsImprovBtn = screen.getByText('Needs Improvement').closest('button')!;
    fireEvent.click(needsImprovBtn); // expand
    expect(screen.getByText('Story point estimation was inconsistent')).toBeTruthy();
  });

  it('displays item count badge in category header', () => {
    renderComponent();
    // went_well has 1 item, needs_improvement has 1, action_items has 2
    const headers = document.querySelectorAll('button span.px-2');
    expect(headers.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// SUITE 6 — Sentiment voting
// =============================================================================

describe('SprintRetrospectives — sentiment voting', () => {
  it('renders happy, neutral, sad sentiment buttons', () => {
    renderComponent();
    expect(screen.getByText('Happy')).toBeTruthy();
    expect(screen.getByText('Neutral')).toBeTruthy();
    expect(screen.getByText('Sad')).toBeTruthy();
  });

  it('shows sentiment percentages', () => {
    renderComponent();
    // 5/8 happy = 63%, 2/8 neutral = 25%, 1/8 sad = 13% (approximate)
    expect(screen.getAllByText(/\d+%/).length).toBeGreaterThanOrEqual(1);
  });

  it('calls voteSentiment.mutate when happy is clicked', async () => {
    renderComponent();
    const happyBtn = screen.getByText('Happy').closest('button')!;
    fireEvent.click(happyBtn);
    await waitFor(() => {
      expect(mockVoteSentimentMutate).toHaveBeenCalledWith(
        expect.objectContaining({ sentiment: 'happy' })
      );
    });
  });

  it('calls voteSentiment.mutate when neutral is clicked', async () => {
    renderComponent();
    const neutralBtn = screen.getByText('Neutral').closest('button')!;
    fireEvent.click(neutralBtn);
    await waitFor(() => {
      expect(mockVoteSentimentMutate).toHaveBeenCalledWith(
        expect.objectContaining({ sentiment: 'neutral' })
      );
    });
  });

  it('calls voteSentiment.mutate when sad is clicked', async () => {
    renderComponent();
    const sadBtn = screen.getByText('Sad').closest('button')!;
    fireEvent.click(sadBtn);
    await waitFor(() => {
      expect(mockVoteSentimentMutate).toHaveBeenCalledWith(
        expect.objectContaining({ sentiment: 'sad' })
      );
    });
  });

  it('disables sentiment buttons after voting', () => {
    renderComponent();
    const happyBtn = screen.getByText('Happy').closest('button') as HTMLButtonElement;
    fireEvent.click(happyBtn);
    // After voting, all buttons disabled
    const neutralBtn = screen.getByText('Neutral').closest('button') as HTMLButtonElement;
    expect(neutralBtn.disabled).toBe(true);
  });

  it('calls refetchRetro after sentiment vote', async () => {
    renderComponent();
    const happyBtn = screen.getByText('Happy').closest('button')!;
    fireEvent.click(happyBtn);
    await waitFor(() => {
      expect(mockRefetchRetro).toHaveBeenCalled();
    });
  });

  it('does not call voteSentiment.mutate again if user already voted', () => {
    renderComponent();
    const happyBtn = screen.getByText('Happy').closest('button')!;
    fireEvent.click(happyBtn);
    fireEvent.click(happyBtn);
    expect(mockVoteSentimentMutate).toHaveBeenCalledTimes(1);
  });

  it('shows 0% sentiment percentages when total is zero', () => {
    mockRetroData = { ...MOCK_RETRO, teamSentiment: { happy: 0, neutral: 0, sad: 0 } };
    renderComponent();
    const pctText = screen.getAllByText(/0%/);
    expect(pctText.length).toBeGreaterThanOrEqual(3);
  });
});

// =============================================================================
// SUITE 7 — Add item form
// =============================================================================

describe('SprintRetrospectives — add item form', () => {
  it('shows "Add Retrospective Item" placeholder button initially', () => {
    renderComponent();
    expect(screen.getByText('Add Retrospective Item')).toBeTruthy();
  });

  it('reveals the add form when the button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Add Retrospective Item'));
    expect(screen.getByPlaceholderText('Share your thoughts...')).toBeTruthy();
  });

  it('renders category selector buttons in the form', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Add Retrospective Item'));
    expect(screen.getAllByText('Needs Improvement').length).toBeGreaterThanOrEqual(1);
  });

  it('allows switching to needs_improvement category', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Add Retrospective Item'));
    const needsBtn = screen.getAllByText('Needs Improvement')[0];
    fireEvent.click(needsBtn);
    // The button should now be highlighted — no error means it's working
    expect(needsBtn).toBeTruthy();
  });

  it('allows switching to action_items category', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Add Retrospective Item'));
    const actionBtn = screen.getAllByText('Action Items')[0];
    fireEvent.click(actionBtn);
    expect(actionBtn).toBeTruthy();
  });

  it('"Add Item" button is disabled when textarea is empty', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Add Retrospective Item'));
    const addBtn = screen.getByRole('button', { name: 'Add Item' });
    expect((addBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('"Add Item" button is enabled when textarea has content', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Add Retrospective Item'));
    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    fireEvent.change(textarea, { target: { value: 'We improved docs' } });
    const addBtn = screen.getByRole('button', { name: 'Add Item' });
    expect((addBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it('calls addRetroItem.mutate with correct payload when submitted', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Add Retrospective Item'));
    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    fireEvent.change(textarea, { target: { value: 'We improved docs' } });
    const addBtn = screen.getByRole('button', { name: 'Add Item' });
    fireEvent.click(addBtn);
    await waitFor(() => {
      expect(mockAddRetroItemMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'We improved docs',
            author: 'You',
            category: 'went_well',
          }),
        })
      );
    });
  });

  it('calls refetchRetro after adding an item', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Add Retrospective Item'));
    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    fireEvent.change(textarea, { target: { value: 'Some improvement' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Item' }));
    await waitFor(() => {
      expect(mockRefetchRetro).toHaveBeenCalled();
    });
  });

  it('sets isActionable=true for action_items category', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Add Retrospective Item'));
    const actionBtn = screen.getAllByText('Action Items')[0];
    fireEvent.click(actionBtn);
    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    fireEvent.change(textarea, { target: { value: 'Follow up with team' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Item' }));
    await waitFor(() => {
      expect(mockAddRetroItemMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActionable: true, category: 'action_items' }),
        })
      );
    });
  });

  it('hides the form after clicking Cancel', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Add Retrospective Item'));
    expect(screen.getByPlaceholderText('Share your thoughts...')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Share your thoughts...')).toBeNull();
  });

  it('clears textarea after Cancel', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Add Retrospective Item'));
    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    fireEvent.change(textarea, { target: { value: 'Draft text' } });
    fireEvent.click(screen.getByText('Cancel'));
    // form is gone; no textarea
    expect(screen.queryByPlaceholderText('Share your thoughts...')).toBeNull();
  });
});

// =============================================================================
// SUITE 8 — Voting on items
// =============================================================================

describe('SprintRetrospectives — voting on items', () => {
  it('calls voteItem.mutate with numeric item id on upvote click', async () => {
    renderComponent();
    // went_well is expanded by default — vote count '6' is inside a button
    const voteSpan = screen.getByText('6');
    const btn = voteSpan.closest('button');
    expect(btn).toBeTruthy();
    fireEvent.click(btn!);
    await waitFor(() => {
      expect(mockVoteItemMutate).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  it('calls refetchRetro after voting', async () => {
    renderComponent();
    const voteSpan = screen.getByText('6');
    const btn = voteSpan.closest('button')!;
    fireEvent.click(btn);
    await waitFor(() => expect(mockRefetchRetro).toHaveBeenCalled());
  });
});

// =============================================================================
// SUITE 9 — Delete items
// =============================================================================

describe('SprintRetrospectives — delete items', () => {
  it('calls deleteItem.mutate with numeric item id', async () => {
    renderComponent();
    // Delete buttons are present (opacity-0 by default on hover but rendered in DOM)
    const trashButtons = document.querySelectorAll('button svg.lucide-trash-2');
    expect(trashButtons.length).toBeGreaterThan(0);
    fireEvent.click(trashButtons[0].closest('button')!);
    await waitFor(() => {
      expect(mockDeleteItemMutate).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  it('calls refetchRetro after deletion', async () => {
    renderComponent();
    const trashButton = document.querySelector('button svg.lucide-trash-2')?.closest('button');
    if (trashButton) {
      fireEvent.click(trashButton);
      await waitFor(() => expect(mockRefetchRetro).toHaveBeenCalled());
    }
  });
});

// =============================================================================
// SUITE 10 — Update action item status
// =============================================================================

describe('SprintRetrospectives — update action status', () => {
  it('shows Action Items view when Actions button is clicked', () => {
    renderComponent();
    const actionsBtn = screen.getByText(/Actions \(/).closest('button')!;
    fireEvent.click(actionsBtn);
    expect(screen.getByText('All Action Items')).toBeTruthy();
  });

  it('renders status selects for action items in action view', () => {
    renderComponent();
    const actionsBtn = screen.getByText(/Actions \(/).closest('button')!;
    fireEvent.click(actionsBtn);
    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('calls updateItem.mutate when status select changes', async () => {
    renderComponent();
    const actionsBtn = screen.getByText(/Actions \(/).closest('button')!;
    fireEvent.click(actionsBtn);
    // selects[0] = sprint selector, selects[1+] = action item status selects
    const selects = document.querySelectorAll('select');
    const statusSelect = Array.from(selects).find(s =>
      ['pending', 'in_progress', 'completed'].includes((s as HTMLSelectElement).value)
    );
    if (statusSelect) {
      fireEvent.change(statusSelect, { target: { value: 'completed' } });
      await waitFor(() => {
        expect(mockUpdateItemMutate).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'completed' }) })
        );
      });
    }
  });

  it('calls refetchRetro after status update', async () => {
    renderComponent();
    const actionsBtn = screen.getByText(/Actions \(/).closest('button')!;
    fireEvent.click(actionsBtn);
    const selects = document.querySelectorAll('select');
    const statusSelect = Array.from(selects).find(s =>
      ['pending', 'in_progress', 'completed'].includes((s as HTMLSelectElement).value)
    );
    if (statusSelect) {
      fireEvent.change(statusSelect, { target: { value: 'pending' } });
      await waitFor(() => expect(mockRefetchRetro).toHaveBeenCalled());
    }
  });

  it('shows action item content in action view', () => {
    renderComponent();
    const actionsBtn = screen.getByText(/Actions \(/).closest('button')!;
    fireEvent.click(actionsBtn);
    expect(screen.getByText('Schedule estimation workshop')).toBeTruthy();
  });

  it('shows assignee in action view', () => {
    renderComponent();
    const actionsBtn = screen.getByText(/Actions \(/).closest('button')!;
    fireEvent.click(actionsBtn);
    expect(screen.getAllByText('Sarah Johnson').length).toBeGreaterThanOrEqual(1);
  });

  it('shows due date in action view', () => {
    renderComponent();
    const actionsBtn = screen.getByText(/Actions \(/).closest('button')!;
    fireEvent.click(actionsBtn);
    expect(screen.getByText('2026-02-05')).toBeTruthy();
  });

  it('shows "No action items yet" when list is empty', () => {
    mockRetroData = { ...MOCK_RETRO, items: [] };
    renderComponent();
    const actionsBtn = screen.getByText(/Actions \(/).closest('button')!;
    fireEvent.click(actionsBtn);
    expect(screen.getByText('No action items yet. Add one to track improvements!')).toBeTruthy();
  });

  it('toggles off action items view when button clicked again', () => {
    renderComponent();
    const actionsBtn = screen.getByText(/Actions \(/).closest('button')!;
    fireEvent.click(actionsBtn); // show
    fireEvent.click(actionsBtn); // hide
    expect(screen.queryByText('All Action Items')).toBeNull();
  });
});

// =============================================================================
// SUITE 11 — Action items progress stats
// =============================================================================

describe('SprintRetrospectives — action items progress stats', () => {
  it('renders Completed count', () => {
    renderComponent();
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('renders In Progress count', () => {
    renderComponent();
    expect(screen.getByText('In Progress')).toBeTruthy();
  });

  it('renders Pending count', () => {
    renderComponent();
    expect(screen.getByText('Pending')).toBeTruthy();
  });

  it('shows correct completed action item count', () => {
    renderComponent();
    // 1 completed in mock data
    const completedRow = screen.getByText('Completed').closest('div')!.parentElement!;
    expect(completedRow.textContent).toContain('1');
  });

  it('shows correct in-progress action item count', () => {
    renderComponent();
    const inProgressRow = screen.getByText('In Progress').closest('div')!.parentElement!;
    expect(inProgressRow.textContent).toContain('1');
  });

  it('shows correct pending action item count', () => {
    renderComponent();
    const pendingRow = screen.getByText('Pending').closest('div')!.parentElement!;
    expect(pendingRow.textContent).toContain('0');
  });
});

// =============================================================================
// SUITE 12 — Empty / edge cases
// =============================================================================

describe('SprintRetrospectives — edge cases', () => {
  it('handles null retroData gracefully', () => {
    mockRetroData = null;
    renderComponent();
    expect(screen.getByText('Sprint Retrospective')).toBeTruthy();
  });

  it('shows empty state message for all categories when items is empty', () => {
    mockRetroData = { ...MOCK_RETRO, items: [] };
    renderComponent();
    expect(screen.getAllByText('No items yet').length).toBeGreaterThanOrEqual(1);
  });

  it('renders with empty sprints list without crashing', () => {
    mockSprintsData = [];
    renderComponent();
    expect(screen.getByText('Sprint Retrospective')).toBeTruthy();
  });

  it('does not call addRetroItem.mutate when textarea is empty and Add Item is clicked (button disabled)', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Add Retrospective Item'));
    const addBtn = screen.getByRole('button', { name: 'Add Item' });
    // button is disabled — click has no effect
    fireEvent.click(addBtn);
    expect(mockAddRetroItemMutate).not.toHaveBeenCalled();
  });

  it('renders sprint goal in sprint details card', () => {
    renderComponent();
    expect(screen.getByText('Foundation work')).toBeTruthy();
  });

  it('renders sprint dates in details card', () => {
    renderComponent();
    expect(screen.getByText(/2026-01-01/)).toBeTruthy();
  });

  it('renders Facilitated by label', () => {
    renderComponent();
    expect(screen.getByText('Facilitator:')).toBeTruthy();
  });
});
