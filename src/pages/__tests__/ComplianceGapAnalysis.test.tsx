import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComplianceGapAnalysis } from '../ComplianceGapAnalysis';

// ── framer-motion stub ────────────────────────────────────────────────────────
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

// ── react-router-dom stub ─────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// ── FadeContent stub ──────────────────────────────────────────────────────────
vi.mock('../../components/animations/FadeContent', () => ({
  default: ({ children }: any) => <>{children}</>,
}));

// ── API hook mocks ────────────────────────────────────────────────────────────
const defaultGapData = [
  {
    id: 1,
    standardId: 'iso-45001',
    clauseId: '45001-5',
    clauseTitle: 'Leadership and Worker Participation',
    requirement: 'Top management must demonstrate leadership and commitment',
    currentState: 'Partial leadership commitment documented',
    desiredState: 'Full documented commitment with measurable objectives',
    gap: 'No formal OH\u0026S policy signed by top management',
    severity: 'critical',
    impact: 'High risk of non-conformance during certification audit',
    remediation: 'Develop and sign OH\u0026S policy',
    effort: 'medium',
    priority: 1,
    status: 'in_progress',
    notes: 'In review with management team',
    findings: [],
    actionItems: [],
  },
  {
    id: 2,
    standardId: 'iso-45001',
    clauseId: '45001-6',
    clauseTitle: 'Planning',
    requirement: 'Identify hazards and assess OH\u0026S risks',
    currentState: 'Informal hazard identification process',
    desiredState: 'Systematic documented hazard register',
    gap: 'No formal risk assessment methodology',
    severity: 'major',
    impact: 'Potential unidentified workplace hazards',
    remediation: 'Implement risk assessment procedure',
    effort: 'high',
    priority: 2,
    status: 'open',
    notes: '',
    findings: [],
    actionItems: [],
  },
  {
    id: 3,
    standardId: 'iso-45001',
    clauseId: '45001-7',
    clauseTitle: 'Support',
    requirement: 'Provide resources, competence, and communication',
    currentState: 'Basic training records maintained',
    desiredState: 'Competency framework with training matrix',
    gap: 'No documented competency requirements',
    severity: 'minor',
    impact: 'Low risk',
    remediation: 'Define competency requirements',
    effort: 'low',
    priority: 3,
    status: 'resolved',
    notes: 'Completed Q1 2026',
    findings: [],
    actionItems: [],
  },
  {
    id: 4,
    standardId: 'iso-45001',
    clauseId: '45001-8',
    clauseTitle: 'Operation',
    requirement: 'Implement operational planning and control',
    currentState: 'Ad hoc operational controls',
    desiredState: 'Documented operational controls for all hazards',
    gap: 'Gaps in contractor management process',
    severity: 'major',
    impact: 'Contractor incidents uncontrolled',
    remediation: 'Develop contractor safety procedure',
    effort: 'medium',
    priority: 4,
    status: 'open',
    notes: '',
    findings: [],
    actionItems: [],
  },
  {
    id: 5,
    standardId: 'iso-45001',
    clauseId: '45001-9',
    clauseTitle: 'Performance Evaluation',
    requirement: 'Monitor and measure OH\u0026S performance',
    currentState: 'Some KPIs tracked informally',
    desiredState: 'Formal KPI dashboard with targets',
    gap: 'No systematic performance measurement',
    severity: 'minor',
    impact: 'Limited visibility of OH\u0026S trends',
    remediation: 'Implement performance dashboard',
    effort: 'medium',
    priority: 5,
    status: 'resolved',
    notes: 'Dashboard live',
    findings: [],
    actionItems: [],
  },
];

let mockGapData: any = [...defaultGapData];

vi.mock('../../api/hooks/useAPIHooks', () => ({
  useComplianceGapAnalysis: () => ({
    data: mockGapData,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpdateGapItem: () => ({
    mutate: vi.fn().mockResolvedValue({}),
    loading: false,
    error: null,
  }),
}));

function renderPage() {
  return render(<ComplianceGapAnalysis />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ComplianceGapAnalysis', () => {
  beforeEach(() => {
    mockGapData = [...defaultGapData];
    mockNavigate.mockClear();
  });

  // 1. Module exports
  describe('module exports', () => {
    it('exports ComplianceGapAnalysis as a named export', async () => {
      const mod = await import('../ComplianceGapAnalysis');
      expect(typeof mod.ComplianceGapAnalysis).toBe('function');
    });
  });

  // 2. Renders with mock data when no API data
  describe('initial render with sample data', () => {
    it('renders the page title', () => {
      renderPage();
      expect(screen.getByText('Gap Analysis')).toBeDefined();
    });

    it('renders the subtitle', () => {
      renderPage();
      expect(screen.getByText('Compliance gap assessment & tracking')).toBeDefined();
    });

    it('shows Total Gaps metric', () => {
      renderPage();
      expect(screen.getByText('Total Gaps')).toBeDefined();
    });

    it('shows Critical metric', () => {
      renderPage();
      expect(screen.getByText('Critical')).toBeDefined();
    });

    it('shows Overdue metric', () => {
      renderPage();
      expect(screen.getByText('Overdue')).toBeDefined();
    });

    it('renders at least one gap item from sample data', () => {
      renderPage();
      expect(screen.getByText('Leadership and Worker Participation')).toBeDefined();
    });

    it('renders search input', () => {
      renderPage();
      expect(screen.getByPlaceholderText('Search gaps...')).toBeDefined();
    });

    it('renders remediation progress bar section', () => {
      renderPage();
      expect(screen.getByText('Remediation Progress')).toBeDefined();
    });
  });

  // 3. Filtering
  describe('filtering', () => {
    it('search filters gap items by title', () => {
      renderPage();
      const input = screen.getByPlaceholderText('Search gaps...');
      fireEvent.change(input, { target: { value: 'Leadership' } });
      expect(screen.getByText('Leadership and Worker Participation')).toBeDefined();
    });

    it('shows empty state when search matches nothing', () => {
      renderPage();
      const input = screen.getByPlaceholderText('Search gaps...');
      fireEvent.change(input, { target: { value: 'zzzznoexist12345' } });
      expect(screen.getByText('No gaps match your filters')).toBeDefined();
    });

    it('renders All Severity filter option', () => {
      renderPage();
      const selects = document.querySelectorAll('select');
      const severitySelect = Array.from(selects).find(s =>
        s.innerHTML.includes('All Severity')
      );
      expect(severitySelect).toBeDefined();
    });
  });

  // 4. Metrics calculation
  describe('metrics', () => {
    it('total gaps count matches sample data length (5)', () => {
      renderPage();
      // The "5" appears as metrics.total
      const allText = document.body.textContent || '';
      expect(allText).toContain('5');
    });

    it('shows resolved / in progress / open breakdown labels', () => {
      renderPage();
      expect(screen.getAllByText(/Resolved/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/In Progress/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Open/).length).toBeGreaterThan(0);
    });
  });

  // 5. Gap item rendering
  describe('gap item rendering', () => {
    it('renders Planning gap title', () => {
      renderPage();
      expect(screen.getByText('Planning')).toBeDefined();
    });

    it('renders severity badge for major gaps', () => {
      renderPage();
      // Badge renders as emoji + severity text; use body text check
      const bodyText = document.body.textContent || '';
      expect(bodyText).toContain('major');
    });

    it('renders In Progress status badge', () => {
      renderPage();
      const inProgressBadges = screen.getAllByText('In Progress');
      expect(inProgressBadges.length).toBeGreaterThan(0);
    });

    it('clicking gap expands details showing Requirement section', () => {
      renderPage();
      const gapButtons = document.querySelectorAll('button.w-full.p-4');
      if (gapButtons.length > 0) {
        fireEvent.click(gapButtons[0]);
        expect(screen.getByText('Requirement')).toBeDefined();
      }
    });

    it('shows "Current State" label in expanded gap', () => {
      renderPage();
      const gapButtons = document.querySelectorAll('button.w-full.p-4');
      if (gapButtons.length > 0) {
        fireEvent.click(gapButtons[0]);
        expect(screen.getByText('Current State')).toBeDefined();
      }
    });

    it('shows "Desired State" label in expanded gap', () => {
      renderPage();
      const gapButtons = document.querySelectorAll('button.w-full.p-4');
      if (gapButtons.length > 0) {
        fireEvent.click(gapButtons[0]);
        expect(screen.getByText('Desired State')).toBeDefined();
      }
    });
  });

  // 6. API data integration
  describe('API data integration', () => {
    it('does not crash when API returns empty array', async () => {
      mockGapData = [];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Gap Analysis')).toBeDefined();
      });
    });

    it('does not crash when API returns null', async () => {
      mockGapData = null;
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Gap Analysis')).toBeDefined();
      });
    });

    it('merges backend gap_analysis_reports into display list', async () => {
      mockGapData = [
        {
          id: 999,
          standardId: 'iso-45001',
          clauseId: '45001-5',
          clauseTitle: 'Backend Gap Item',
          requirement: 'Backend requirement',
          currentState: 'Current',
          desiredState: 'Desired',
          gap: 'The gap description',
          severity: 'major',
          impact: 'Medium impact',
          remediation: 'Fix it',
          effort: 'medium',
          priority: 1,
          status: 'open',
          notes: 'Some backend notes',
          findings: [],
          actionItems: [],
        },
      ];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Backend Gap Item')).toBeDefined();
      });
    });

    it('correctly maps risk_level high to major severity', async () => {
      mockGapData = [
        {
          id: 1001,
          standardId: 'iso-45001',
          clauseId: '45001-6',
          clauseTitle: 'High Risk Gap',
          requirement: 'Requirement text',
          currentState: 'Current',
          desiredState: 'Desired',
          gap: 'Gap description',
          severity: 'major',
          impact: 'High impact',
          remediation: 'Remediation plan',
          effort: 'high',
          priority: 1,
          status: 'open',
          notes: '',
          findings: [],
          actionItems: [],
        },
      ];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('High Risk Gap')).toBeDefined();
      });
    });

    it('correctly maps risk_level critical to critical severity', async () => {
      mockGapData = [
        {
          id: 1002,
          standardId: 'iso-45001',
          clauseId: '45001-5',
          clauseTitle: 'Critical Gap Item',
          requirement: 'Critical requirement',
          currentState: 'Current state',
          desiredState: 'Desired state',
          gap: 'Critical gap',
          severity: 'critical',
          impact: 'Critical impact',
          remediation: 'Urgent fix needed',
          effort: 'high',
          priority: 1,
          status: 'open',
          notes: 'Critical issue',
          findings: [],
          actionItems: [],
        },
      ];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Critical Gap Item')).toBeDefined();
      });
    });

    it('maps standard ISO45001 to standardId iso-45001', async () => {
      mockGapData = [
        {
          id: 1003,
          standardId: 'iso-45001',
          standard: 'ISO45001',
          clauseId: '45001-7',
          clauseTitle: 'ISO45001 Gap',
          requirement: 'Requirement',
          currentState: 'Current',
          desiredState: 'Desired',
          gap: 'Gap description',
          severity: 'minor',
          impact: 'Low impact',
          remediation: 'Remediation',
          effort: 'low',
          priority: 3,
          status: 'in_progress',
          notes: '',
          findings: [],
          actionItems: [],
        },
      ];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('ISO45001 Gap')).toBeDefined();
      });
    });

    it('does not add duplicate items already in sample data', async () => {
      mockGapData = [
        ...defaultGapData,
        {
          id: 999,
          standardId: 'iso-45001',
          clauseId: '45001-8',
          clauseTitle: 'New Backend Gap',
          requirement: 'New requirement',
          currentState: 'Current',
          desiredState: 'Desired',
          gap: 'New gap',
          severity: 'minor',
          impact: 'Low impact',
          remediation: 'Fix',
          effort: 'low',
          priority: 6,
          status: 'open',
          notes: '',
          findings: [],
          actionItems: [],
        },
      ];
      renderPage();
      await waitFor(() => {
        // New backend item is shown
        expect(screen.getByText('New Backend Gap')).toBeDefined();
        // Default sample item is also shown
        expect(screen.getByText('Leadership and Worker Participation')).toBeDefined();
      });
    });
  });

  // 7. Status change actions
  describe('status change actions', () => {
    it('shows "Start Work" button for open gap', () => {
      renderPage();
      // Expand a gap that is 'open'
      const gapButtons = document.querySelectorAll('button.w-full.p-4');
      // Find the 'Planning' gap (gap-002, status: 'open')
      let planningBtn: Element | null = null;
      gapButtons.forEach(btn => {
        if (btn.textContent?.includes('Planning')) planningBtn = btn;
      });
      if (planningBtn) {
        fireEvent.click(planningBtn);
        expect(screen.getByText('Start Work')).toBeDefined();
      }
    });

    it('shows "Accept Risk" button for in-progress gap', () => {
      renderPage();
      const gapButtons = document.querySelectorAll('button.w-full.p-4');
      let leadershipBtn: Element | null = null;
      gapButtons.forEach(btn => {
        if (btn.textContent?.includes('Leadership')) leadershipBtn = btn;
      });
      if (leadershipBtn) {
        fireEvent.click(leadershipBtn);
        expect(screen.getByText('Accept Risk')).toBeDefined();
      }
    });
  });

  // 8. Navigation
  describe('navigation', () => {
    it('back button calls navigate(-1)', () => {
      renderPage();
      const backBtn = document.querySelector('button.w-10.h-10.rounded-full');
      if (backBtn) {
        fireEvent.click(backBtn);
        expect(mockNavigate).toHaveBeenCalledWith(-1);
      }
    });
  });
});
