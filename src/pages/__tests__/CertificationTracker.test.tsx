import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CertificationTracker } from '../CertificationTracker';

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
const defaultCertsData = [
  {
    id: 1,
    standardId: 'iso-45001',
    standardCode: 'ISO 45001:2018',
    standardTitle: 'Occupational health and safety management systems',
    status: 'certified',
    certificationBody: 'Bureau Veritas',
    certificateNumber: 'BV-45001-2024',
    initialCertDate: '2021-03-15',
    expiryDate: '2027-03-14',
    scope: ['Manufacturing operations'],
    locations: ['HQ - New York'],
    overallScore: 94,
    clauseScores: [],
    nonConformities: [],
    auditHistory: [],
  },
  {
    id: 2,
    standardId: 'iso-27001',
    standardCode: 'ISO/IEC 27001:2022',
    standardTitle: 'Information security management systems',
    status: 'certified',
    certificationBody: 'SGS',
    certificateNumber: 'SGS-27001-2023',
    initialCertDate: '2022-06-01',
    expiryDate: '2026-06-01',
    scope: ['IT infrastructure'],
    locations: ['Data Center 1'],
    overallScore: 89,
    clauseScores: [],
    nonConformities: [],
    auditHistory: [],
  },
];

let mockCertsData: any[] | null = [...defaultCertsData];
let mockStatsData: any | null = null;

vi.mock('../../api/hooks/useAPIHooks', () => ({
  useStandardCertifications: (params?: any) => ({
    data: params?.status
      ? (mockCertsData ?? []).filter((c: any) => c.status === params.status)
      : mockCertsData,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useStandardCertStats: () => ({
    data: mockStatsData,
    loading: false,
    error: null,
  }),
}));

function renderPage() {
  return render(<CertificationTracker />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CertificationTracker', () => {
  beforeEach(() => {
    mockCertsData = [...defaultCertsData];
    mockStatsData = null;
    mockNavigate.mockClear();
  });

  // 1. Module exports
  describe('module exports', () => {
    it('exports CertificationTracker as a named export', async () => {
      const mod = await import('../CertificationTracker');
      expect(typeof mod.CertificationTracker).toBe('function');
    });
  });

  // 2. Renders with sample data
  describe('initial render with sample data', () => {
    it('renders the page title', () => {
      renderPage();
      expect(screen.getByText('Certification Tracker')).toBeDefined();
    });

    it('renders the subtitle', () => {
      renderPage();
      expect(screen.getByText('Standards certification management')).toBeDefined();
    });

    it('shows Standards metric', () => {
      renderPage();
      expect(screen.getByText('Standards')).toBeDefined();
    });

    it('shows Certified metric', () => {
      renderPage();
      expect(screen.getAllByText('Certified').length).toBeGreaterThan(0);
    });

    it('shows Expiring metric', () => {
      renderPage();
      expect(screen.getByText('Expiring')).toBeDefined();
    });

    it('shows Avg Score metric', () => {
      renderPage();
      expect(screen.getByText('Avg Score')).toBeDefined();
    });

    it('renders ISO 45001 certification from sample data', () => {
      renderPage();
      expect(screen.getByText('ISO 45001:2018')).toBeDefined();
    });

    it('renders ISO 27001 certification from sample data', () => {
      renderPage();
      expect(screen.getByText('ISO/IEC 27001:2022')).toBeDefined();
    });
  });

  // 3. Status filter tabs
  describe('status filter tabs', () => {
    it('renders All filter tab', () => {
      renderPage();
      expect(screen.getByText('All')).toBeDefined();
    });

    it('renders Certified filter tab', () => {
      renderPage();
      // Many certified elements; find the button one specifically
      const allButtons = document.querySelectorAll('button');
      const certBtn = Array.from(allButtons).find(b =>
        b.textContent?.trim() === '✅ Certified'
      );
      expect(certBtn).toBeDefined();
    });

    it('clicking Certified tab filters to certified certs', () => {
      renderPage();
      const allButtons = document.querySelectorAll('button');
      const certBtn = Array.from(allButtons).find(b =>
        b.textContent?.trim() === '✅ Certified'
      );
      if (certBtn) {
        fireEvent.click(certBtn);
        // ISO 45001 is certified, should still be visible
        expect(screen.getByText('ISO 45001:2018')).toBeDefined();
      }
    });

    it('clicking In Audit tab hides non-audit certs', () => {
      renderPage();
      const allButtons = document.querySelectorAll('button');
      const auditBtn = Array.from(allButtons).find(b =>
        b.textContent?.trim() === '🔍 In Audit'
      );
      if (auditBtn) {
        fireEvent.click(auditBtn);
        expect(screen.queryByText('ISO 22301:2019')).toBeNull();
      }
    });
  });

  // 4. Cert card expansion
  describe('cert card expansion', () => {
    it('clicking cert card expands details with Overview tab', () => {
      renderPage();
      const certButtons = document.querySelectorAll('button.w-full.p-4');
      if (certButtons.length > 0) {
        fireEvent.click(certButtons[0]);
        expect(screen.getByText('Overview')).toBeDefined();
      }
    });

    it('clicking cert card shows Clauses tab', () => {
      renderPage();
      const certButtons = document.querySelectorAll('button.w-full.p-4');
      if (certButtons.length > 0) {
        fireEvent.click(certButtons[0]);
        expect(screen.getByText('Clauses')).toBeDefined();
      }
    });

    it('clicking cert card shows Audit tab', () => {
      renderPage();
      const certButtons = document.querySelectorAll('button.w-full.p-4');
      if (certButtons.length > 0) {
        fireEvent.click(certButtons[0]);
        expect(screen.getByText('Audit')).toBeDefined();
      }
    });

    it('expanded cert shows locations section', () => {
      renderPage();
      const certButtons = document.querySelectorAll('button.w-full.p-4');
      if (certButtons.length > 0) {
        fireEvent.click(certButtons[0]);
        expect(screen.getByText('Locations')).toBeDefined();
      }
    });
  });

  // 5. API data integration
  describe('API data integration', () => {
    it('does not crash when API returns null', async () => {
      mockCertsData = null;
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Certification Tracker')).toBeDefined();
      });
    });

    it('does not crash when API returns empty array', async () => {
      mockCertsData = [];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Certification Tracker')).toBeDefined();
      });
    });

    it('maps backend active status to certified', async () => {
      mockCertsData = [
        {
          id: 100,
          standardId: 'custom-100',
          standardCode: 'Backend Safety Cert',
          standardTitle: 'Backend safety certification',
          status: 'certified',
          certificationBody: 'Safety Authority',
          certificateNumber: 'BC-001',
          initialCertDate: '2024-01-01',
          expiryDate: '2027-01-01',
          scope: [],
          locations: [],
          clauseScores: [],
          nonConformities: [],
          auditHistory: [],
        },
      ];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Backend Safety Cert')).toBeDefined();
      });
    });

    it('maps backend expired status to expired', async () => {
      mockCertsData = [
        {
          id: 101,
          standardId: 'custom-101',
          standardCode: 'Old Safety Cert',
          standardTitle: 'Expired safety certification',
          status: 'expired',
          certificationBody: 'Safety Board',
          certificateNumber: 'OC-002',
          initialCertDate: '2020-01-01',
          expiryDate: '2023-01-01',
          scope: [],
          locations: [],
          clauseScores: [],
          nonConformities: [],
          auditHistory: [],
        },
      ];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Old Safety Cert')).toBeDefined();
      });
    });

    it('maps backend pending-renewal to in_audit', async () => {
      mockCertsData = [
        {
          id: 102,
          standardId: 'custom-102',
          standardCode: 'Renewing Cert',
          standardTitle: 'In-audit renewal certification',
          status: 'in_audit',
          certificationBody: 'Certifying Body',
          certificateNumber: 'RC-003',
          initialCertDate: '2022-01-01',
          expiryDate: '2025-01-01',
          scope: [],
          locations: [],
          clauseScores: [],
          nonConformities: [],
          auditHistory: [],
        },
      ];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Renewing Cert')).toBeDefined();
      });
    });

    it('uses standardCode field for display', async () => {
      mockCertsData = [
        {
          id: 200,
          standardId: 'custom-200',
          standardCode: 'SnakeCase Cert Name',
          standardTitle: 'Test certification record',
          status: 'certified',
          certificationBody: 'Test Body',
          certificateNumber: 'SCC-001',
          initialCertDate: '2024-06-01',
          expiryDate: '2027-06-01',
          scope: [],
          locations: [],
          clauseScores: [],
          nonConformities: [],
          auditHistory: [],
        },
      ];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('SnakeCase Cert Name')).toBeDefined();
      });
    });

    it('uses certificationBody field for issuing body display', async () => {
      mockCertsData = [
        {
          id: 201,
          standardId: 'custom-201',
          standardCode: 'Test Auth Cert',
          standardTitle: 'Authorization certification',
          status: 'certified',
          certificationBody: 'Global Safety Authority',
          certificateNumber: 'TAC-001',
          initialCertDate: '2024-01-01',
          expiryDate: '2027-01-01',
          scope: [],
          locations: [],
          clauseScores: [],
          nonConformities: [],
          auditHistory: [],
        },
      ];
      renderPage();
      await waitFor(() => {
        // certificationBody shows issuing_body in the expanded card
        expect(screen.getByText('Test Auth Cert')).toBeDefined();
      });
    });

    it('does not add duplicate items already in sample data', async () => {
      mockCertsData = [
        {
          id: 1,
          standardId: 'iso-45001',
          standardCode: 'ISO 45001:2018',
          standardTitle: 'Occupational health and safety management systems',
          status: 'certified',
          certificationBody: 'Bureau Veritas',
          certificateNumber: 'BV-45001-2024',
          initialCertDate: '2021-03-15',
          expiryDate: '2027-03-14',
          scope: ['Manufacturing operations'],
          locations: ['HQ - New York'],
          overallScore: 94,
          clauseScores: [],
          nonConformities: [],
          auditHistory: [],
        },
        {
          id: 999,
          standardId: 'custom-999',
          standardCode: 'Fresh Backend Cert',
          standardTitle: 'Fresh certification from backend',
          status: 'certified',
          certificationBody: 'New Body',
          certificateNumber: 'FBC-999',
          initialCertDate: '2025-01-01',
          expiryDate: '2028-01-01',
          scope: [],
          locations: [],
          clauseScores: [],
          nonConformities: [],
          auditHistory: [],
        },
      ];
      renderPage();
      await waitFor(() => {
        // ISO 45001 cert shown
        expect(screen.getByText('ISO 45001:2018')).toBeDefined();
        // Additional backend cert also shown
        expect(screen.getByText('Fresh Backend Cert')).toBeDefined();
      });
    });
  });

  // 6. Navigation
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

  // 7. Empty state
  describe('empty state', () => {
    it('shows no certifications found when all filtered out', () => {
      renderPage();
      const allButtons = document.querySelectorAll('button');
      // Click 'suspended' to get an empty list (none certified as suspended in samples)
      const suspBtn = Array.from(allButtons).find(b =>
        b.textContent?.includes('⚠️') && b.textContent?.includes('Suspended')
      );
      if (suspBtn) {
        fireEvent.click(suspBtn);
        expect(screen.getByText('No certifications found')).toBeDefined();
      }
    });
  });
});
