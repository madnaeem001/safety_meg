import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCharter } from '../ProjectCharter';

// ── Framer‑motion stub ────────────────────────────────────────────────────────

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
  };
});

// ── Static mock data (no external references — safe in vi.mock factory) ──────

vi.mock('../../../api/hooks/useAPIHooks', () => {
  const CHARTER = {
    id: 1,
    name: 'Safety Management System V2',
    vision: 'Vision text here.',
    mission: 'Mission statement here.',
    budget: '$1.2M',
    sponsor: 'Executive Safety Committee',
    createdAt: 1000000,
    updatedAt: 1000000,
    stakeholders: [
      { id: 1, charterId: 1, name: 'Sarah Chen', role: 'Product Owner', influence: 'High', interest: 'High', createdAt: 1000000 },
      { id: 2, charterId: 1, name: 'Mike Ross', role: 'Safety Director', influence: 'High', interest: 'Medium', createdAt: 1000001 },
    ],
    goals: [
      { id: 1, charterId: 1, description: 'Reduce incident reporting time', metric: '< 2 minutes', priority: 'High', createdAt: 1000000 },
      { id: 2, charterId: 1, description: 'Increase mobile adoption', metric: '80%', priority: 'Medium', createdAt: 1000001 },
    ],
  };

  const makeMutate = () => vi.fn().mockResolvedValue({ id: 99 });
  const makeMutation = () => ({ mutate: makeMutate(), loading: false, error: null, data: null, reset: vi.fn() });

  return {
    useProjectCharters: () => ({ data: [CHARTER], loading: false, error: null, refetch: vi.fn().mockResolvedValue(undefined) }),
    useCharterDetail: (_id: number | null) => ({ data: CHARTER, loading: false, error: null, refetch: vi.fn().mockResolvedValue(undefined) }),
    useUpdateCharter: () => makeMutation(),
    useAddCharterStakeholder: () => makeMutation(),
    useDeleteCharterStakeholder: () => makeMutation(),
    useAddCharterGoal: () => makeMutation(),
    useDeleteCharterGoal: () => makeMutation(),
  };
});

// ── Helper ────────────────────────────────────────────────────────────────────

function renderCharter() {
  return render(<ProjectCharter />);
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('ProjectCharter', () => {

  // ── Module exports ──────────────────────────────────────────────────────────

  describe('Module exports', () => {
    it('ProjectCharter is exported as a named export function', async () => {
      const mod = await import('../ProjectCharter');
      expect(typeof mod.ProjectCharter).toBe('function');
    });
  });

  // ── Initial render ──────────────────────────────────────────────────────────

  describe('Initial render', () => {
    it('renders without crashing', () => {
      expect(() => renderCharter()).not.toThrow();
    });

    it('shows the "Project Initiation" subtitle', () => {
      renderCharter();
      expect(screen.getByText(/Project Initiation/i)).toBeDefined();
    });

    it('shows the charter project name', () => {
      renderCharter();
      expect(screen.getByText('Safety Management System V2')).toBeDefined();
    });

    it('shows "Edit Charter" button in view mode', () => {
      renderCharter();
      expect(screen.getByRole('button', { name: /edit charter/i })).toBeDefined();
    });

    it('"Save Changes" is not shown in view mode', () => {
      renderCharter();
      expect(screen.queryByRole('button', { name: /save changes/i })).toBeNull();
    });

    it('shows "Project Vision" card', () => {
      renderCharter();
      expect(screen.getByText(/Project Vision/i)).toBeDefined();
    });

    it('shows "Mission Statement" card', () => {
      renderCharter();
      expect(screen.getByRole('heading', { name: 'Mission Statement' })).toBeDefined();
    });

    it('shows vision text from backend data', () => {
      renderCharter();
      expect(screen.getByText(/Vision text here/i)).toBeDefined();
    });

    it('shows mission text from backend data', () => {
      renderCharter();
      expect(screen.getByText(/Mission statement here/i)).toBeDefined();
    });

    it('shows "Strategic Goals" section', () => {
      renderCharter();
      expect(screen.getByText(/Strategic Goals/i)).toBeDefined();
    });

    it('shows "Stakeholder Register" section', () => {
      renderCharter();
      expect(screen.getByText(/Stakeholder Register/i)).toBeDefined();
    });

    it('shows "Project Sponsor" info card', () => {
      renderCharter();
      expect(screen.getByText(/Project Sponsor/i)).toBeDefined();
    });

    it('shows "Key Stakeholders" info card', () => {
      renderCharter();
      expect(screen.getByText(/Key Stakeholders/i)).toBeDefined();
    });

    it('shows stakeholder names from backend data', () => {
      renderCharter();
      expect(screen.getByText('Sarah Chen')).toBeDefined();
      expect(screen.getByText('Mike Ross')).toBeDefined();
    });

    it('shows stakeholder roles', () => {
      renderCharter();
      expect(screen.getByText('Product Owner')).toBeDefined();
      expect(screen.getByText('Safety Director')).toBeDefined();
    });

    it('shows goal descriptions', () => {
      renderCharter();
      expect(screen.getByText('Reduce incident reporting time')).toBeDefined();
      expect(screen.getByText('Increase mobile adoption')).toBeDefined();
    });

    it('shows goal metrics', () => {
      renderCharter();
      expect(screen.getByText(/Success Metric: < 2 minutes/i)).toBeDefined();
    });

    it('shows sponsor name from backend', () => {
      renderCharter();
      expect(screen.getByText('Executive Safety Committee')).toBeDefined();
    });

    it('shows correct stakeholder count', () => {
      renderCharter();
      expect(screen.getByText(/2 Identified/i)).toBeDefined();
    });

    it('shows goal count as defined goals', () => {
      renderCharter();
      expect(screen.getByText(/2 Defined Goals/i)).toBeDefined();
    });
  });

  // ── Edit mode ───────────────────────────────────────────────────────────────

  describe('Edit mode toggle', () => {
    it('enters edit mode on "Edit Charter" click', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      expect(screen.getByLabelText(/save charter/i)).toBeDefined();
    });

    it('shows Cancel button in edit mode', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDefined();
    });

    it('Cancel returns to view mode', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.getByRole('button', { name: /edit charter/i })).toBeDefined();
      expect(screen.queryByRole('button', { name: /save changes/i })).toBeNull();
    });

    it('shows "Add Goal" button only in edit mode', async () => {
      const user = userEvent.setup();
      renderCharter();
      expect(screen.queryByRole('button', { name: /add goal/i })).toBeNull();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      expect(screen.getByRole('button', { name: /add goal/i })).toBeDefined();
    });

    it('shows "Add Stakeholder" button only in edit mode', async () => {
      const user = userEvent.setup();
      renderCharter();
      expect(screen.queryByRole('button', { name: /add stakeholder/i })).toBeNull();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      expect(screen.getByRole('button', { name: /add stakeholder/i })).toBeDefined();
    });

    it('shows inline project name input in edit mode', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      expect(screen.getByRole('textbox', { name: /project name/i })).toBeDefined();
    });

    it('shows vision textarea in edit mode', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      expect(screen.getByRole('textbox', { name: /project vision/i })).toBeDefined();
    });

    it('shows mission textarea in edit mode', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      expect(screen.getByRole('textbox', { name: /mission statement/i })).toBeDefined();
    });

    it('shows delete buttons on goal rows in edit mode', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      const deleteGoalBtns = screen.getAllByRole('button').filter(
        (b) => b.getAttribute('aria-label')?.startsWith('Delete goal')
      );
      expect(deleteGoalBtns.length).toBe(2);
    });

    it('shows delete buttons on stakeholder rows in edit mode', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      const deleteBtns = screen.getAllByRole('button').filter(
        (b) => b.getAttribute('aria-label')?.startsWith('Delete stakeholder')
      );
      expect(deleteBtns.length).toBe(2);
    });
  });

  // ── Inline field editing ────────────────────────────────────────────────────

  describe('Inline field editing', () => {
    it('vision textarea starts with backend value', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      const ta = screen.getByRole('textbox', { name: /project vision/i }) as HTMLTextAreaElement;
      expect(ta.value).toBe('Vision text here.');
    });

    it('mission textarea starts with backend value', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      const ta = screen.getByRole('textbox', { name: /mission statement/i }) as HTMLTextAreaElement;
      expect(ta.value).toBe('Mission statement here.');
    });

    it('sponsor input starts with backend value', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      const input = screen.getByRole('textbox', { name: /project sponsor/i }) as HTMLInputElement;
      expect(input.value).toBe('Executive Safety Committee');
    });

    it('updates vision field on input', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      const ta = screen.getByRole('textbox', { name: /project vision/i }) as HTMLTextAreaElement;
      await user.clear(ta);
      await user.type(ta, 'New vision');
      expect(ta.value).toBe('New vision');
    });
  });

  // ── Add Stakeholder Modal ───────────────────────────────────────────────────

  describe('Add Stakeholder Modal', () => {
    async function openModal() {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      await user.click(screen.getByRole('button', { name: /add stakeholder/i }));
      return user;
    }

    it('opens the modal', async () => {
      await openModal();
      expect(screen.getByRole('dialog', { name: /add stakeholder dialog/i })).toBeDefined();
      expect(screen.getByPlaceholderText(/e.g. Sarah Chen/i)).toBeDefined();
    });

    it('shows Name and Role input fields', async () => {
      await openModal();
      expect(screen.getByPlaceholderText(/e.g. Sarah Chen/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/e.g. Product Owner/i)).toBeDefined();
    });

    it('shows Influence and Interest selects', async () => {
      await openModal();
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });

    it('closes when modal Cancel is clicked', async () => {
      const user = await openModal();
      const dialog = screen.getByRole('dialog', { name: /add stakeholder dialog/i });
      const cancelBtn = within(dialog).getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);
      expect(screen.queryByPlaceholderText(/e.g. Sarah Chen/i)).toBeNull();
    });

    it('does not submit with empty fields', async () => {
      const user = await openModal();
      await user.click(screen.getByRole('button', { name: /^Add$/i }));
      expect(screen.getByPlaceholderText(/e.g. Sarah Chen/i)).toBeDefined();
    });

    it('submits the form with valid data', async () => {
      const user = await openModal();
      await user.type(screen.getByPlaceholderText(/e.g. Sarah Chen/i), 'Alex Wong');
      await user.type(screen.getByPlaceholderText(/e.g. Product Owner/i), 'Tech Lead');
      await user.click(screen.getByRole('button', { name: /^Add$/i }));
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/e.g. Sarah Chen/i)).toBeNull();
      });
    });
  });

  // ── Add Goal Modal ──────────────────────────────────────────────────────────

  describe('Add Goal Modal', () => {
    async function openModal() {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      await user.click(screen.getByRole('button', { name: /add goal/i }));
      return user;
    }

    it('opens the modal', async () => {
      await openModal();
      expect(screen.getByText('Add Strategic Goal')).toBeDefined();
    });

    it('shows description and metric inputs', async () => {
      await openModal();
      expect(screen.getByPlaceholderText(/e.g. Reduce incident reporting time/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/e.g. < 2 minutes/i)).toBeDefined();
    });

    it('shows priority select', async () => {
      await openModal();
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(1);
    });

    it('closes on modal cancel click', async () => {
      const user = await openModal();
      const dialog = screen.getByRole('dialog', { name: /add goal dialog/i });
      const cancelBtn = within(dialog).getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);
      expect(screen.queryByText('Add Strategic Goal')).toBeNull();
    });

    it('does not submit with empty fields', async () => {
      const user = await openModal();
      await user.click(screen.getByRole('button', { name: /^Add$/i }));
      expect(screen.getByPlaceholderText(/e.g. Reduce incident reporting time/i)).toBeDefined();
    });

    it('submits the form with valid data', async () => {
      const user = await openModal();
      await user.type(screen.getByPlaceholderText(/e.g. Reduce incident reporting time/i), 'New Goal');
      await user.type(screen.getByPlaceholderText(/e.g. < 2 minutes/i), '100%');
      await user.click(screen.getByRole('button', { name: /^Add$/i }));
      await waitFor(() => {
        expect(screen.queryByText('Add Strategic Goal')).toBeNull();
      });
    });
  });

  // ── Accessibility ───────────────────────────────────────────────────────────

  describe('Accessibility', () => {
    it('edit button is accessible by role + name', () => {
      renderCharter();
      expect(screen.getByRole('button', { name: /edit charter/i })).toBeDefined();
    });

    it('save button has aria-label "Save charter" in edit mode', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      expect(screen.getByLabelText(/save charter/i)).toBeDefined();
    });

    it('add goal button has aria-label "Add goal"', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      expect(screen.getByLabelText(/add goal/i)).toBeDefined();
    });

    it('add stakeholder button has aria-label "Add stakeholder"', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      expect(screen.getByLabelText(/add stakeholder/i)).toBeDefined();
    });

    it('delete goal buttons each have an aria-label with goal description', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      expect(screen.getByLabelText(/Delete goal: Reduce incident reporting time/i)).toBeDefined();
    });

    it('delete stakeholder buttons have aria-label with stakeholder name', async () => {
      const user = userEvent.setup();
      renderCharter();
      await user.click(screen.getByRole('button', { name: /edit charter/i }));
      expect(screen.getByLabelText(/Delete stakeholder: Sarah Chen/i)).toBeDefined();
    });
  });
});

