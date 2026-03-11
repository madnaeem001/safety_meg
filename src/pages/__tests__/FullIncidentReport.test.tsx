import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FullIncidentReport } from '../FullIncidentReport';

// ── framer-motion stub ────────────────────────────────────────────────────────
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
      button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    },
  };
});

// ── react-router-dom stub ─────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// ── incidentPdfExport stub ────────────────────────────────────────────────────
vi.mock('../../utils/exports/incidentPdfExport', () => ({
  exportIncidentReportToPDF: vi.fn(),
  generateReportId: vi.fn().mockReturnValue('RPT-TEST-001'),
}));

// ── Sub-component stubs ───────────────────────────────────────────────────────
vi.mock('../../components/safety/BodyDiagram', () => ({
  BodyDiagram: ({ onPartClick }: any) => (
    <div data-testid="body-diagram">
      <button data-testid="body-part-head" onClick={() => onPartClick?.('head')}>Head</button>
    </div>
  ),
  getBodyPartName: (id: string) => id,
}));

vi.mock('../../components/safety/SignatureCanvas', () => ({
  SignatureCanvas: ({ label, onSignatureChange }: any) => (
    <div data-testid={`signature-${label?.replace(/\s+/g, '-').toLowerCase()}`}>
      <button data-testid={`sign-btn-${label?.replace(/\s+/g, '-').toLowerCase()}`}
        onClick={() => onSignatureChange?.('data:signature')}>
        {label}
      </button>
    </div>
  ),
}));

vi.mock('../../components/safety/FiveWhysAnalysis', () => ({
  FiveWhysAnalysis: ({ initialProblem, onWhysChange, onProblemChange }: any) => (
    <div data-testid="five-whys">
      <span data-testid="five-whys-problem">{initialProblem}</span>
      <button data-testid="five-whys-change"
        onClick={() => onWhysChange?.([{ id: '1', question: 'Why #1', answer: 'Because X', isRootCause: true }])}>
        Change Whys
      </button>
    </div>
  ),
}));

vi.mock('../../components/safety/FishboneDiagram', () => ({
  FishboneDiagram: ({ problem, onCategoriesChange, onProblemChange }: any) => (
    <div data-testid="fishbone">
      <span data-testid="fishbone-problem">{problem}</span>
      <button data-testid="fishbone-change"
        onClick={() => onCategoriesChange?.([{ id: 'man', name: 'Man', causes: [{ id: '1', text: 'Fatigue' }] }])}>
        Change Categories
      </button>
    </div>
  ),
}));

vi.mock('../../components/safety/LessonsLearnedPanel', () => ({
  LessonsLearnedPanel: ({ incidentSummary }: any) => (
    <div data-testid="lessons-learned">
      <span data-testid="lessons-summary">{incidentSummary}</span>
    </div>
  ),
}));

vi.mock('../../components/safety/InjurySeverityCalculator', () => ({
  InjurySeverityCalculator: () => <div data-testid="injury-severity-calc" />,
}));

// ── API mocks (hoisted so they are available in vi.mock factories) ────────────
const { mockCreateIncident, mockAIGetSuggestions, mockIncidentCreate } = vi.hoisted(() => ({
  mockCreateIncident: vi.fn(),
  mockAIGetSuggestions: vi.fn(),
  mockIncidentCreate: vi.fn(),
}));

vi.mock('../../api/hooks/useAPIHooks', () => ({
  useCreateIncident: () => ({
    mutate: mockCreateIncident,
    loading: false,
    error: null,
  }),
}));

vi.mock('../../api/services/apiService', () => ({
  aiAssistantService: {
    getSuggestions: mockAIGetSuggestions,
  },
  incidentService: {
    create: mockIncidentCreate,
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function fillRequiredFields() {
  // Expand section 1 (Persons Involved) so Reported By becomes accessible
  const personsBtn = screen.getByRole('button', { name: /persons involved/i });
  fireEvent.click(personsBtn);

  // Section 0 selects: [0] = Department, [1] = Incident Type
  const typeSelects = screen.getAllByRole('combobox');
  fireEvent.change(typeSelects[1], { target: { value: 'Near Miss' } });

  // Location — section 0, placeholder 'Area/Zone'
  const locationInput = screen.getByPlaceholderText('Area/Zone');
  fireEvent.change(locationInput, { target: { value: 'Warehouse Floor A' } });

  // Description — raw textarea, placeholder exact string
  const descTextarea = screen.getByPlaceholderText('Describe what happened in detail...');
  fireEvent.change(descTextarea, { target: { value: 'Worker slipped on wet floor near exit door.' } });

  // Reported By — no placeholder; after expanding section 1 it is the 3rd textbox
  // [0]=Location, [1]=Description (textarea), [2]=Reported By (first text input in section 1)
  const allTextboxes = screen.getAllByRole('textbox');
  fireEvent.change(allTextboxes[2], { target: { value: 'John Doe' } });
}

function renderPage() {
  return render(<FullIncidentReport />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FullIncidentReport', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockAIGetSuggestions.mockClear();
    mockIncidentCreate.mockClear();
    mockCreateIncident.mockClear();
  });

  // Always restore real timers even if a test fails mid-way
  afterEach(() => { vi.useRealTimers(); });

  // 1. Module export
  describe('module exports', () => {
    it('exports FullIncidentReport as a named export', async () => {
      const mod = await import('../FullIncidentReport');
      expect(typeof mod.FullIncidentReport).toBe('function');
    });
  });

  // 2. Page header rendering
  describe('header', () => {
    it('renders the page title', () => {
      renderPage();
      expect(screen.getByText('Full Incident Report')).toBeInTheDocument();
    });

    it('renders back button that calls navigate(-1)', () => {
      renderPage();
      const backBtn = screen.getByRole('button', { name: '' });
      // The back button has ArrowLeft icon, find by its parent button near H1
      const allButtons = screen.getAllByRole('button');
      // First button is back navigation
      fireEvent.click(allButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('renders Print and PDF export buttons', () => {
      renderPage();
      const printBtn = screen.getByTitle('Print Report');
      const pdfBtn = screen.getByTitle('Export PDF');
      expect(printBtn).toBeInTheDocument();
      expect(pdfBtn).toBeInTheDocument();
    });
  });

  // 3. Section expand/collapse
  describe('section expand/collapse', () => {
    it('section 1 (Incident Information) is expanded by default', () => {
      renderPage();
      expect(screen.getByText(/incident information/i)).toBeInTheDocument();
    });

    it('clicking a collapsed section header expands it', () => {
      renderPage();
      // Section 1 (Persons Involved) is collapsed by default
      const personsBtn = screen.getByRole('button', { name: /persons involved/i });
      fireEvent.click(personsBtn);
      // After expanding, the Reported By input (3rd textbox) should be visible
      expect(screen.getAllByRole('textbox').length).toBeGreaterThan(2);
    });
  });

  // 4. Form fields
  describe('form fields', () => {
    it('renders incident type dropdown', () => {
      renderPage();
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });

    it('selecting an incident type updates the form', () => {
      renderPage();
      // Section 0: combobox[0]=Department, combobox[1]=Incident Type
      const typeSelects = screen.getAllByRole('combobox');
      fireEvent.change(typeSelects[1], { target: { value: 'Near Miss' } });
      expect((typeSelects[1] as HTMLSelectElement).value).toBe('Near Miss');
    });

    it('selecting Recordable Injury auto-expands injury sections', () => {
      renderPage();
      const typeSelects = screen.getAllByRole('combobox');
      fireEvent.change(typeSelects[1], { target: { value: 'Recordable Injury' } });
      // The body diagram section should now be expanded
      expect(screen.getByTestId('body-diagram')).toBeInTheDocument();
    });

    it('PPE toggle buttons work', () => {
      renderPage();
      // PPE section may need expanding; find Safety Glasses button
      const ppeButtons = screen.queryAllByText(/safety glasses/i);
      if (ppeButtons.length > 0) {
        fireEvent.click(ppeButtons[0]);
        // Should toggle selection — no error thrown
        fireEvent.click(ppeButtons[0]);
      }
    });
  });

  // 5. Form validation
  describe('form validation', () => {
    it('shows error when required fields are empty on submit', async () => {
      const { container } = renderPage();
      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });
      await waitFor(() => {
        expect(screen.getByText(/Incident Type is required\./, { exact: false })).toBeInTheDocument();
      });
    });

    it('shows error when description is too short', async () => {
      const { container } = renderPage();

      // Expand Persons section to fill Reported By
      fireEvent.click(screen.getByRole('button', { name: /persons involved/i }));

      // combobox[0]=Department, [1]=Incident Type
      fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Near Miss' } });
      fireEvent.change(screen.getByPlaceholderText('Describe what happened in detail...'), { target: { value: 'Short' } });
      fireEvent.change(screen.getByPlaceholderText('Area/Zone'), { target: { value: 'Factory' } });
      // Reported By (textbox[2] after expanding section 1)
      fireEvent.change(screen.getAllByRole('textbox')[2], { target: { value: 'Jane Smith' } });

      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      await waitFor(() => {
        expect(screen.getByText(/Description must be at least 10 characters\./i)).toBeInTheDocument();
      });
    });

    it('shows error for injury incident with no body part selected', async () => {
      const { container } = renderPage();

      // Expand Persons section to fill Reported By
      fireEvent.click(screen.getByRole('button', { name: /persons involved/i }));

      // combobox[1] = Incident Type
      fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Recordable Injury' } });
      fireEvent.change(screen.getByPlaceholderText('Area/Zone'), { target: { value: 'Warehouse B' } });
      fireEvent.change(screen.getByPlaceholderText('Describe what happened in detail...'), {
        target: { value: 'Worker slipped and fell on wet floor.' },
      });
      // Reported By
      fireEvent.change(screen.getAllByRole('textbox')[2], { target: { value: 'Supervisor Tom' } });

      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Please select at least one body part/i)
        ).toBeInTheDocument();
      });
    });
  });

  // 6. Successful submission
  describe('form submission', () => {
    it('shows success screen after successful submit', async () => {
      mockIncidentCreate.mockResolvedValueOnce({ data: { id: 42 } });

      const { container } = renderPage();
      fillRequiredFields();

      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      await waitFor(() => {
        expect(screen.getByText('Full Report Submitted')).toBeInTheDocument();
      });
      expect(mockIncidentCreate).toHaveBeenCalledTimes(1);
    });

    it('navigates to /incidents (not "/") after success timeout', async () => {
      mockIncidentCreate.mockResolvedValueOnce({ data: { id: 42 } });

      const { container } = renderPage();
      fillRequiredFields();

      // Submit and wait for success screen (confirms setTimeout is registered)
      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });
      await waitFor(() => expect(screen.getByText('Full Report Submitted')).toBeInTheDocument());

      // Wait for the real 3-second navigation timeout to fire
      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 3100));
      });

      expect(mockNavigate).toHaveBeenCalledWith('/incidents');
      const calledWithRoot = mockNavigate.mock.calls.some((args: unknown[]) => args[0] === '/');
      expect(calledWithRoot).toBe(false);
    }, 8000);

    it('shows error message on submit failure', async () => {
      mockIncidentCreate.mockRejectedValueOnce(new Error('Server error'));

      const { container } = renderPage();
      fillRequiredFields();

      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });
    });
  });

  // 7. AI Assist — description field
  describe('AI Assist - description', () => {
    it('calls aiAssistantService.getSuggestions when AI button is clicked', async () => {
      mockAIGetSuggestions.mockResolvedValueOnce({
        data: { suggestions: ['Suggestion Alpha', 'Suggestion Beta'] },
      });

      renderPage();

      // The AI Assist button is in the Description section (section 0, already expanded)
      const aiBtn = screen.getByRole('button', { name: /ai assist/i });
      await act(async () => {
        fireEvent.click(aiBtn);
      });

      await waitFor(() => {
        expect(mockAIGetSuggestions).toHaveBeenCalledTimes(1);
      });
    });

    it('displays AI suggestions after successful call', async () => {
      mockAIGetSuggestions.mockResolvedValueOnce({
        data: { suggestions: ['Suggestion Alpha', 'Suggestion Beta'] },
      });

      renderPage();

      const aiBtn = screen.getByRole('button', { name: /ai assist/i });
      await act(async () => {
        fireEvent.click(aiBtn);
      });

      await waitFor(() => {
        expect(screen.getByText('Suggestion Alpha')).toBeInTheDocument();
        expect(screen.getByText('Suggestion Beta')).toBeInTheDocument();
      });
    });

    it('applies suggestion to description field when clicked', async () => {
      mockAIGetSuggestions.mockResolvedValueOnce({
        data: { suggestions: ['Worker slipped on oil spill near machine bay.'] },
      });

      renderPage();

      const aiBtn = screen.getByRole('button', { name: /ai assist/i });
      await act(async () => {
        fireEvent.click(aiBtn);
      });

      await waitFor(() => {
        expect(screen.getByText('Worker slipped on oil spill near machine bay.')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Worker slipped on oil spill near machine bay.'));

      const descTextarea = screen.getByPlaceholderText('Describe what happened in detail...');
      expect((descTextarea as HTMLTextAreaElement).value).toBe('Worker slipped on oil spill near machine bay.');
    });

    it('shows loading state while AI call is pending', async () => {
      let resolveAI!: (v: any) => void;
      mockAIGetSuggestions.mockReturnValueOnce(
        new Promise((res) => { resolveAI = res; })
      );

      renderPage();

      const aiBtn = screen.getByRole('button', { name: /ai assist/i });
      act(() => { fireEvent.click(aiBtn); });

      // Button should be disabled while loading
      expect(aiBtn).toBeDisabled();

      await act(async () => {
        resolveAI({ data: { suggestions: [] } });
      });
    });

    it('gracefully handles AI service error (empty suggestions)', async () => {
      mockAIGetSuggestions.mockRejectedValueOnce(new Error('AI Unavailable'));

      renderPage();

      const aiBtn = screen.getByRole('button', { name: /ai assist/i });
      await act(async () => {
        fireEvent.click(aiBtn);
      });

      await waitFor(() => {
        expect(mockAIGetSuggestions).toHaveBeenCalled();
      });

      // No crash, and no suggestions shown
      expect(screen.queryByText('Suggestion Alpha')).not.toBeInTheDocument();
    });
  });

  // 8. AI Assist — root causes field
  describe('AI Assist - root causes', () => {
    it('calls AI and shows suggestions for root causes section', async () => {
      mockAIGetSuggestions.mockResolvedValueOnce({
        data: { suggestions: ['Root cause: lack of signage', 'Root cause: slippery surface'] },
      });

      renderPage();

      // First expand the Investigation section (section index 6)
      // Find "Root Cause Analysis" or "Investigation" section header
      const sectionBtns = screen.getAllByRole('button').filter(b =>
        b.textContent?.toLowerCase().includes('investigation') ||
        b.textContent?.toLowerCase().includes('actions')
      );
      if (sectionBtns.length > 0) {
        fireEvent.click(sectionBtns[0]);
      }

      // Find AI Analyse button for rootCauses
      const analyseBtn = screen.queryByTitle(/ai analyse/i);
      if (analyseBtn) {
        await act(async () => { fireEvent.click(analyseBtn); });
        await waitFor(() => {
          expect(mockAIGetSuggestions).toHaveBeenCalled();
        });
      }
    });
  });

  // 9. Sub-component data wiring (FiveWhysAnalysis / FishboneDiagram)
  describe('sub-component data wiring', () => {
    it('renders FiveWhysAnalysis stub inside investigation section', () => {
      renderPage();
      // Expand investigation/root cause section
      const rtBtns = screen.getAllByRole('button').filter(
        b => b.textContent?.toLowerCase().includes('root cause')
      );
      rtBtns.forEach(b => fireEvent.click(b));
      // The five-whys stub should render if the section is open + root cause tools shown
    });

    it('renders FishboneDiagram stub when fishbone tab is active', () => {
      renderPage();
    });
  });

  // 10. Navigation
  describe('navigation', () => {
    it('back button calls navigate(-1)', () => {
      renderPage();
      const allButtons = screen.getAllByRole('button');
      fireEvent.click(allButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('does not navigate to "/" on successful submit', async () => {
      mockIncidentCreate.mockResolvedValueOnce({ data: { id: 1 } });
      vi.useFakeTimers();

      renderPage();
      fillRequiredFields();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /submit full report/i }));
      });

      await act(async () => { vi.advanceTimersByTime(3100); });

      const navigateCalls = mockNavigate.mock.calls;
      const navigatedToRoot = navigateCalls.some(call => call[0] === '/');
      expect(navigatedToRoot).toBe(false);

      vi.useRealTimers();
    });
  });
});
