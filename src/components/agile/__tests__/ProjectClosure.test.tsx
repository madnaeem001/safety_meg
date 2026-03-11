import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectClosure } from '../ProjectClosure';

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

// ── Static mock data (inline — safe in vi.mock factory) ───────────────────────

vi.mock('../../../api/hooks/useAPIHooks', () => {
  const CLOSURE = {
    id: 1,
    name: 'Safety Management System V2',
    projectId: 'SMS-V2',
    status: 'In Progress' as const,
    archivedAt: null,
    reportGeneratedAt: null,
    createdAt: 1000000,
    updatedAt: 1000000,
    deliverables: [
      {
        id: 1,
        closureId: 1,
        name: 'Safety Management System V2 Codebase',
        status: 'Accepted' as const,
        approver: 'CTO',
        date: '2026-02-01',
        createdAt: 1000000,
      },
      {
        id: 2,
        closureId: 1,
        name: 'User Documentation & Manuals',
        status: 'Accepted' as const,
        approver: 'Product Owner',
        date: '2026-02-03',
        createdAt: 1000001,
      },
      {
        id: 3,
        closureId: 1,
        name: 'Training Materials',
        status: 'Pending' as const,
        approver: 'HR Director',
        date: '-',
        createdAt: 1000002,
      },
      {
        id: 4,
        closureId: 1,
        name: 'Final Security Audit Report',
        status: 'Accepted' as const,
        approver: 'CISO',
        date: '2026-01-28',
        createdAt: 1000003,
      },
    ],
    lessons: [
      {
        id: 1,
        closureId: 1,
        category: 'Process' as const,
        description: 'Daily standups were too long',
        impact: 'Negative' as const,
        recommendation: 'Strict 15min timebox',
        createdAt: 1000000,
      },
      {
        id: 2,
        closureId: 1,
        category: 'Technology' as const,
        description: 'React Query significantly improved data fetching',
        impact: 'Positive' as const,
        recommendation: 'Adopt as standard',
        createdAt: 1000001,
      },
      {
        id: 3,
        closureId: 1,
        category: 'People' as const,
        description: 'QA team involved too late in sprint',
        impact: 'Negative' as const,
        recommendation: 'Shift left testing',
        createdAt: 1000002,
      },
    ],
  };

  const makeMutate = () => vi.fn().mockResolvedValue({ id: 99 });
  const makeMutation = () => ({
    mutate: makeMutate(),
    loading: false,
    error: null,
    data: null,
    reset: vi.fn(),
  });

  return {
    useProjectClosures: () => ({
      data: [CLOSURE],
      loading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    }),
    useClosureDetail: (_id: number | null) => ({
      data: CLOSURE,
      loading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    }),
    useAddClosureDeliverable:    () => makeMutation(),
    useUpdateClosureDeliverable: () => makeMutation(),
    useDeleteClosureDeliverable: () => makeMutation(),
    useAddClosureLesson:         () => makeMutation(),
    useDeleteClosureLesson:      () => makeMutation(),
    useArchiveClosure:           () => makeMutation(),
    useGenerateClosureReport: () => ({
      mutate: vi.fn().mockResolvedValue({
        closure: CLOSURE,
        summary: {
          totalDeliverables: 4,
          accepted: 3,
          pending: 1,
          rejected: 0,
          acceptanceRate: 75,
          totalLessons: 3,
          positiveLessons: 1,
          negativeLessons: 2,
        },
        deliverables: CLOSURE.deliverables,
        lessons: CLOSURE.lessons,
        generatedAt: 1700000000000,
      }),
      loading: false,
      error: null,
      data: null,
      reset: vi.fn(),
    }),
  };
});

// ── Helper ────────────────────────────────────────────────────────────────────

function renderClosure() {
  return render(<ProjectClosure />);
}

// =============================================================================

describe('ProjectClosure', () => {

  // ── Module export ───────────────────────────────────────────────────────────
  describe('Module exports', () => {
    it('is exported as a named export function', () => {
      expect(typeof ProjectClosure).toBe('function');
    });
  });

  // ── Initial render ──────────────────────────────────────────────────────────
  describe('Initial render', () => {
    it('renders without crashing', () => {
      renderClosure();
      expect(screen.getByRole('heading', { name: /project closure/i })).toBeDefined();
    });

    it('shows the project name in subtitle', () => {
      renderClosure();
      expect(screen.getByText('Safety Management System V2')).toBeDefined();
    });

    it('shows "Export Report" button', () => {
      renderClosure();
      expect(screen.getByRole('button', { name: /export report/i })).toBeDefined();
    });

    it('shows "Archive Project" button when not archived', () => {
      renderClosure();
      expect(screen.getByRole('button', { name: /archive project/i })).toBeDefined();
    });

    it('shows three tab buttons', () => {
      renderClosure();
      expect(screen.getByText('Deliverables Checklist')).toBeDefined();
      expect(screen.getByText('Lessons Learned')).toBeDefined();
      expect(screen.getByText('Final Report')).toBeDefined();
    });

    it('defaults to Deliverables Checklist tab', () => {
      renderClosure();
      expect(screen.getByRole('heading', { name: /final deliverables acceptance/i })).toBeDefined();
    });

    it('shows accepted count badge', () => {
      renderClosure();
      expect(screen.getByText('3 / 4 Accepted')).toBeDefined();
    });

    it('shows all deliverable names', () => {
      renderClosure();
      expect(screen.getByText('Safety Management System V2 Codebase')).toBeDefined();
      expect(screen.getByText('User Documentation & Manuals')).toBeDefined();
      expect(screen.getByText('Training Materials')).toBeDefined();
      expect(screen.getByText('Final Security Audit Report')).toBeDefined();
    });

    it('shows approver info for each deliverable', () => {
      renderClosure();
      expect(screen.getByText(/Approver: CTO/)).toBeDefined();
      expect(screen.getByText(/Approver: HR Director/)).toBeDefined();
    });

    it('shows status selects for each deliverable', () => {
      renderClosure();
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(4);
    });

    it('shows Add button on checklist tab', () => {
      renderClosure();
      expect(screen.getByRole('button', { name: /add deliverable/i })).toBeDefined();
    });
  });

  // ── Tab navigation ──────────────────────────────────────────────────────────
  describe('Tab navigation', () => {
    it('switches to Lessons Learned tab', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByText('Lessons Learned'));
      expect(screen.getByRole('heading', { name: /retrospective & lessons learned/i })).toBeDefined();
    });

    it('shows lesson descriptions on Lessons tab', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByText('Lessons Learned'));
      expect(screen.getByText('Daily standups were too long')).toBeDefined();
      expect(screen.getByText('React Query significantly improved data fetching')).toBeDefined();
      expect(screen.getByText('QA team involved too late in sprint')).toBeDefined();
    });

    it('shows recommendations on Lessons tab', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByText('Lessons Learned'));
      expect(screen.getByText(/Strict 15min timebox/)).toBeDefined();
      expect(screen.getByText(/Adopt as standard/)).toBeDefined();
    });

    it('shows category badges on Lessons tab', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByText('Lessons Learned'));
      expect(screen.getByText('Process')).toBeDefined();
      expect(screen.getByText('Technology')).toBeDefined();
      expect(screen.getByText('People')).toBeDefined();
    });

    it('shows "Add Item" button on Lessons tab', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByText('Lessons Learned'));
      expect(screen.getByRole('button', { name: /add lesson/i })).toBeDefined();
    });

    it('switches to Final Report tab', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByText('Final Report'));
      expect(screen.getByRole('heading', { name: /project closure report/i })).toBeDefined();
    });

    it('shows Generate Final Report button on Report tab', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByText('Final Report'));
      expect(screen.getByRole('button', { name: /generate final report/i })).toBeDefined();
    });

    it('can switch back to checklist from lessons', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByText('Lessons Learned'));
      await user.click(screen.getByText('Deliverables Checklist'));
      expect(screen.getByRole('heading', { name: /final deliverables acceptance/i })).toBeDefined();
    });
  });

  // ── Add Deliverable Modal ───────────────────────────────────────────────────
  describe('Add Deliverable Modal', () => {
    it('opens when Add button is clicked', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByRole('button', { name: /add deliverable/i }));
      const dialog = screen.getByRole('dialog', { name: /add deliverable dialog/i });
      expect(dialog).toBeDefined();
    });

    it('shows Name and Approver inputs', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByRole('button', { name: /add deliverable/i }));
      const dialog = screen.getByRole('dialog', { name: /add deliverable dialog/i });
      expect(within(dialog).getByLabelText(/deliverable name/i)).toBeDefined();
      expect(within(dialog).getByLabelText(/approver/i)).toBeDefined();
    });

    it('shows Status and Date inputs', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByRole('button', { name: /add deliverable/i }));
      const dialog = screen.getByRole('dialog', { name: /add deliverable dialog/i });
      expect(within(dialog).getByLabelText(/deliverable status/i)).toBeDefined();
      expect(within(dialog).getByLabelText(/deliverable date/i)).toBeDefined();
    });

    it('closes when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByRole('button', { name: /add deliverable/i }));
      const dialog = screen.getByRole('dialog', { name: /add deliverable dialog/i });
      await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
      expect(screen.queryByRole('dialog', { name: /add deliverable dialog/i })).toBeNull();
    });

    it('does not submit with empty fields', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByRole('button', { name: /add deliverable/i }));
      const dialog = screen.getByRole('dialog', { name: /add deliverable dialog/i });
      const submitBtn = within(dialog).getByRole('button', { name: /add deliverable/i });
      expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('submits with valid data and closes modal', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByRole('button', { name: /add deliverable/i }));
      const dialog = screen.getByRole('dialog', { name: /add deliverable dialog/i });
      await user.type(within(dialog).getByLabelText(/deliverable name/i), 'New Report');
      await user.type(within(dialog).getByLabelText(/approver/i), 'Manager');
      await user.click(within(dialog).getByRole('button', { name: /add deliverable/i }));
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /add deliverable dialog/i })).toBeNull();
      });
    });
  });

  // ── Add Lesson Modal ────────────────────────────────────────────────────────
  describe('Add Lesson Modal', () => {
    const goToLessonsAndClickAdd = async (user: ReturnType<typeof userEvent.setup>) => {
      renderClosure();
      await user.click(screen.getByText('Lessons Learned'));
      await user.click(screen.getByRole('button', { name: /add lesson/i }));
    };

    it('opens when Add Item is clicked', async () => {
      const user = userEvent.setup();
      await goToLessonsAndClickAdd(user);
      expect(screen.getByRole('dialog', { name: /add lesson dialog/i })).toBeDefined();
    });

    it('shows Description and Recommendation textareas', async () => {
      const user = userEvent.setup();
      await goToLessonsAndClickAdd(user);
      const dialog = screen.getByRole('dialog', { name: /add lesson dialog/i });
      expect(within(dialog).getByLabelText(/description/i)).toBeDefined();
      expect(within(dialog).getByLabelText(/recommendation/i)).toBeDefined();
    });

    it('shows Category and Impact selects', async () => {
      const user = userEvent.setup();
      await goToLessonsAndClickAdd(user);
      const dialog = screen.getByRole('dialog', { name: /add lesson dialog/i });
      expect(within(dialog).getByLabelText(/category/i)).toBeDefined();
      expect(within(dialog).getByLabelText(/impact/i)).toBeDefined();
    });

    it('closes when Cancel is clicked', async () => {
      const user = userEvent.setup();
      await goToLessonsAndClickAdd(user);
      const dialog = screen.getByRole('dialog', { name: /add lesson dialog/i });
      await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
      expect(screen.queryByRole('dialog', { name: /add lesson dialog/i })).toBeNull();
    });

    it('submit button disabled when fields empty', async () => {
      const user = userEvent.setup();
      await goToLessonsAndClickAdd(user);
      const dialog = screen.getByRole('dialog', { name: /add lesson dialog/i });
      const submitBtn = within(dialog).getByRole('button', { name: /add lesson/i });
      expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('submits with valid data and closes modal', async () => {
      const user = userEvent.setup();
      await goToLessonsAndClickAdd(user);
      const dialog = screen.getByRole('dialog', { name: /add lesson dialog/i });
      await user.type(within(dialog).getByLabelText(/description/i), 'New finding');
      await user.type(within(dialog).getByLabelText(/recommendation/i), 'Do better');
      await user.click(within(dialog).getByRole('button', { name: /add lesson/i }));
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /add lesson dialog/i })).toBeNull();
      });
    });
  });

  // ── Delete actions ──────────────────────────────────────────────────────────
  describe('Delete actions', () => {
    it('shows delete buttons for each deliverable', () => {
      renderClosure();
      const deleteButtons = screen.getAllByRole('button', { name: /delete deliverable/i });
      expect(deleteButtons.length).toBe(4);
    });

    it('delete deliverable buttons have descriptive aria-labels', () => {
      renderClosure();
      expect(
        screen.getByRole('button', { name: /delete deliverable Safety Management System V2 Codebase/i })
      ).toBeDefined();
    });

    it('shows delete buttons for each lesson', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByText('Lessons Learned'));
      const deleteButtons = screen.getAllByRole('button', { name: /delete lesson/i });
      expect(deleteButtons.length).toBe(3);
    });

    it('delete lesson buttons have descriptive aria-labels', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByText('Lessons Learned'));
      expect(
        screen.getByRole('button', { name: /delete lesson Daily standups were too long/i })
      ).toBeDefined();
    });
  });

  // ── Status select ───────────────────────────────────────────────────────────
  describe('Deliverable status selects', () => {
    it('each deliverable has a status select with correct value', () => {
      renderClosure();
      const select = screen.getByLabelText('Status for Safety Management System V2 Codebase') as HTMLSelectElement;
      expect(select.value).toBe('Accepted');
    });

    it('pending deliverable shows Pending in select', () => {
      renderClosure();
      const select = screen.getByLabelText('Status for Training Materials') as HTMLSelectElement;
      expect(select.value).toBe('Pending');
    });
  });

  // ── Final Report generation ─────────────────────────────────────────────────
  describe('Final Report', () => {
    it('shows report summary stats after generating', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByText('Final Report'));
      await user.click(screen.getByRole('button', { name: /generate final report/i }));
      await waitFor(() => {
        expect(screen.getByText('75% rate')).toBeDefined();
      });
    });

    it('shows deliverables breakdown in report', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByText('Final Report'));
      await user.click(screen.getByRole('button', { name: /generate final report/i }));
      await waitFor(() => {
        expect(screen.getByText(/Deliverables Summary/i)).toBeDefined();
      });
    });
  });

  // ── Accessibility ───────────────────────────────────────────────────────────
  describe('Accessibility', () => {
    it('Export Report button has aria-label', () => {
      renderClosure();
      expect(screen.getByRole('button', { name: /export report/i })).toBeDefined();
    });

    it('Archive Project button has aria-label', () => {
      renderClosure();
      expect(screen.getByRole('button', { name: /archive project/i })).toBeDefined();
    });

    it('Add deliverable button has aria-label', () => {
      renderClosure();
      expect(screen.getByRole('button', { name: /add deliverable/i })).toBeDefined();
    });

    it('Add lesson button has aria-label', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByText('Lessons Learned'));
      expect(screen.getByRole('button', { name: /add lesson/i })).toBeDefined();
    });

    it('Generate Final Report button has aria-label', async () => {
      const user = userEvent.setup();
      renderClosure();
      await user.click(screen.getByText('Final Report'));
      expect(screen.getByRole('button', { name: /generate final report/i })).toBeDefined();
    });

    it('status selects have aria-labels containing deliverable names', () => {
      renderClosure();
      expect(screen.getByLabelText(/status for Training Materials/i)).toBeDefined();
    });
  });
});
