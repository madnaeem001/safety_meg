/**
 * VehicleIncidentReport — Test Suite
 *
 * Covers:
 *   - Module export
 *   - Page header and navigation
 *   - Form sections render
 *   - Required field validation (location, driverName, description)
 *   - Successful submission + navigate to /incidents
 *   - API error display
 *   - Loading state (button disabled while submitting)
 *   - Boolean flag inputs (policeReport, dotRecordable)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { VehicleIncidentReport } from '../VehicleIncidentReport';

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

// ── API service mock (hoisted) ────────────────────────────────────────────────
const { mockVehicleCreate } = vi.hoisted(() => ({
  mockVehicleCreate: vi.fn(),
}));

vi.mock('../../api/services/apiService', () => ({
  vehicleIncidentApiService: {
    create: mockVehicleCreate,
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPage() {
  return render(<VehicleIncidentReport />);
}

/** Fill in the three required fields so the form can submit */
function fillRequiredFields() {
  // Location
  const locationInput = screen.getByPlaceholderText('Street address or GPS coordinates');
  fireEvent.change(locationInput, { target: { value: 'Main St & 5th Ave' } });

  // Driver Name
  const driverInput = screen.getByPlaceholderText('Full Name');
  fireEvent.change(driverInput, { target: { value: 'Jane Doe' } });

  // Description
  const descTextarea = screen.getByPlaceholderText('Describe what happened...');
  fireEvent.change(descTextarea, { target: { value: 'Rear-end collision at low speed.' } });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VehicleIncidentReport', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockVehicleCreate.mockClear();
  });

  // Always restore real timers so fake-timer tests don't cascade into siblings
  afterEach(() => { vi.useRealTimers(); });

  // 1. Module export
  describe('module export', () => {
    it('exports VehicleIncidentReport as a named export', async () => {
      const mod = await import('../VehicleIncidentReport');
      expect(typeof mod.VehicleIncidentReport).toBe('function');
    });
  });

  // 2. Header
  describe('header', () => {
    it('renders Vehicle Incident Report title', () => {
      renderPage();
      expect(screen.getByText('Vehicle Incident Report')).toBeInTheDocument();
    });

    it('back button calls navigate(-1)', () => {
      renderPage();
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  // 3. Form sections
  describe('form sections render', () => {
    it('renders Incident Information section', () => {
      renderPage();
      expect(screen.getByText('Incident Information')).toBeInTheDocument();
    });

    it('renders Driver Information section', () => {
      renderPage();
      expect(screen.getByText('Driver Information')).toBeInTheDocument();
    });

    it('renders Road & Weather Conditions section', () => {
      renderPage();
      expect(screen.getByText('Road & Weather Conditions')).toBeInTheDocument();
    });

    it('renders Incident Description section', () => {
      renderPage();
      expect(screen.getByText('Incident Description')).toBeInTheDocument();
    });

    it('renders Key form inputs', () => {
      renderPage();
      expect(screen.getByPlaceholderText('Street address or GPS coordinates')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Describe what happened...')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /submit vehicle incident report/i })).toBeInTheDocument();
    });

    it('renders Police Report and DOT Recordable checkboxes', () => {
      renderPage();
      expect(screen.getByLabelText('Police Report Filed')).toBeInTheDocument();
      expect(screen.getByLabelText('DOT Recordable')).toBeInTheDocument();
    });
  });

  // 4. Validation
  describe('required field validation', () => {
    it('shows error when location is empty on submit', async () => {
      renderPage();
      // Only fill driver and description, leave location empty
      const driverInput = screen.getByPlaceholderText('Full Name');
      fireEvent.change(driverInput, { target: { value: 'Jane Doe' } });
      const descTextarea = screen.getByPlaceholderText('Describe what happened...');
      fireEvent.change(descTextarea, { target: { value: 'Some description' } });

      const form = screen.getByRole('button', { name: /submit vehicle incident report/i }).closest('form')!;
      await act(async () => { fireEvent.submit(form); });

      await waitFor(() => {
        expect(screen.getByText('Location is required.')).toBeInTheDocument();
      });
      expect(mockVehicleCreate).not.toHaveBeenCalled();
    });

    it('shows error when driverName is empty on submit', async () => {
      renderPage();
      const locationInput = screen.getByPlaceholderText('Street address or GPS coordinates');
      fireEvent.change(locationInput, { target: { value: 'Somewhere' } });
      const descTextarea = screen.getByPlaceholderText('Describe what happened...');
      fireEvent.change(descTextarea, { target: { value: 'Some description' } });

      const form = screen.getByRole('button', { name: /submit vehicle incident report/i }).closest('form')!;
      await act(async () => { fireEvent.submit(form); });

      await waitFor(() => {
        expect(screen.getByText('Driver name is required.')).toBeInTheDocument();
      });
      expect(mockVehicleCreate).not.toHaveBeenCalled();
    });

    it('shows error when description is empty on submit', async () => {
      renderPage();
      const locationInput = screen.getByPlaceholderText('Street address or GPS coordinates');
      fireEvent.change(locationInput, { target: { value: 'Somewhere' } });
      const driverInput = screen.getByPlaceholderText('Full Name');
      fireEvent.change(driverInput, { target: { value: 'Jane Doe' } });

      const form = screen.getByRole('button', { name: /submit vehicle incident report/i }).closest('form')!;
      await act(async () => { fireEvent.submit(form); });

      await waitFor(() => {
        expect(screen.getByText('Description is required.')).toBeInTheDocument();
      });
      expect(mockVehicleCreate).not.toHaveBeenCalled();
    });
  });

  // 5. Successful submission
  describe('successful submission', () => {
    beforeEach(() => {
      mockVehicleCreate.mockResolvedValue({ id: 42, reportNumber: 'VEH-00042', status: 'submitted' });
    });

    it('calls vehicleIncidentApiService.create with correct payload', async () => {
      renderPage();
      fillRequiredFields();

      const form = screen.getByRole('button', { name: /submit vehicle incident report/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockVehicleCreate).toHaveBeenCalledOnce();
      });

      const callArg = mockVehicleCreate.mock.calls[0][0];
      expect(callArg.location).toBe('Main St & 5th Ave');
      expect(callArg.driverName).toBe('Jane Doe');
      expect(callArg.description).toBe('Rear-end collision at low speed.');
    });

    it('passes boolean flags correctly', async () => {
      renderPage();
      fillRequiredFields();

      // Toggle police report and DOT recordable
      fireEvent.click(screen.getByLabelText('Police Report Filed'));
      fireEvent.click(screen.getByLabelText('DOT Recordable'));

      const form = screen.getByRole('button', { name: /submit vehicle incident report/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockVehicleCreate).toHaveBeenCalledOnce();
      });

      const callArg = mockVehicleCreate.mock.calls[0][0];
      expect(callArg.policeReport).toBe(true);
      expect(callArg.dotRecordable).toBe(true);
    });

    it('shows success screen after submit', async () => {
      renderPage();
      fillRequiredFields();

      const form = screen.getByRole('button', { name: /submit vehicle incident report/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Report Submitted')).toBeInTheDocument();
      });
    });

    it('navigates to /incidents after 2 seconds', async () => {
      // Use fake timers with auto-advance so waitFor still polls,
      // but we can also manually jump past the 2s navigate timeout
      vi.useFakeTimers({ shouldAdvanceTime: true });
      renderPage();
      fillRequiredFields();

      const form = screen.getByRole('button', { name: /submit vehicle incident report/i }).closest('form')!;
      fireEvent.submit(form);

      // Success screen appears (mock resolves immediately)
      await waitFor(() => {
        expect(screen.getByText('Report Submitted')).toBeInTheDocument();
      });

      // Jump past the 2s navigation delay
      await act(async () => { vi.advanceTimersByTime(2000); });
      expect(mockNavigate).toHaveBeenCalledWith('/incidents');
    });
  });

  // 6. Error handling
  describe('error handling', () => {
    it('shows error message on API failure', async () => {
      mockVehicleCreate.mockRejectedValue(new Error('Network error: server unavailable'));
      renderPage();
      fillRequiredFields();

      const form = screen.getByRole('button', { name: /submit vehicle incident report/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Network error: server unavailable')).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('shows fallback error message when error has no message', async () => {
      mockVehicleCreate.mockRejectedValue({});
      renderPage();
      fillRequiredFields();

      const form = screen.getByRole('button', { name: /submit vehicle incident report/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Failed to submit vehicle incident report.')).toBeInTheDocument();
      });
    });

    it('clears error and re-enables form on a second successful submit', async () => {
      // First attempt fails
      mockVehicleCreate.mockRejectedValueOnce(new Error('Server down'));
      // Second attempt succeeds
      mockVehicleCreate.mockResolvedValueOnce({ id: 1, status: 'submitted' });

      renderPage();
      fillRequiredFields();

      const form = screen.getByRole('button', { name: /submit vehicle incident report/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Server down')).toBeInTheDocument();
      });

      // Submit again (success)
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Report Submitted')).toBeInTheDocument();
      });
    });
  });

  // 7. Loading state
  describe('loading state', () => {
    it('disables submit button while submitting', async () => {
      let resolveCreate!: (v: any) => void;
      mockVehicleCreate.mockReturnValue(new Promise((res) => { resolveCreate = res; }));

      renderPage();
      fillRequiredFields();

      const submitBtn = screen.getByRole('button', { name: /submit vehicle incident report/i });
      expect(submitBtn).not.toBeDisabled();

      const form = submitBtn.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
      });

      // Resolve the promise to allow cleanup
      await act(async () => { resolveCreate({ id: 1 }); });
    });
  });
});
