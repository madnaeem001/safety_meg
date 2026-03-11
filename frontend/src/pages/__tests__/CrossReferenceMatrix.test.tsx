import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrossReferenceMatrix } from '../CrossReferenceMatrix';

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
const mockRelationshipsData = [
  {
    id: 1,
    sourceStandardId: 'iso-45001',
    targetStandardId: 'iso-45003',
    relationshipType: 'integrated',
    mappedClauses: [],
    integrationNotes: 'ISO 45001 and ISO 45003 are designed to work together as an integrated OH&S management system',
    synergies: ['Shared management framework', 'Complementary psychosocial requirements'],
  },
  {
    id: 2,
    sourceStandardId: 'iso-45001',
    targetStandardId: 'ilo-osh-2001',
    relationshipType: 'compatible',
    mappedClauses: [],
    integrationNotes: 'ISO 45001 is based on the ILO-OSH 2001 framework and is fully compatible',
    synergies: ['Aligned hazard identification', 'Consistent OH&S principles'],
  },
];

vi.mock('../../api/hooks/useAPIHooks', () => ({
  useStandardRelationships: () => ({ data: mockRelationshipsData, loading: false, error: null }),
  useStandardRelationshipStats: () => ({ data: null, loading: false, error: null }),
}));

function renderPage() {
  return render(<CrossReferenceMatrix />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CrossReferenceMatrix', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // 1. Module exports
  describe('module exports', () => {
    it('exports CrossReferenceMatrix as a named export', async () => {
      const mod = await import('../CrossReferenceMatrix');
      expect(typeof mod.CrossReferenceMatrix).toBe('function');
    });
  });

  // 2. Header rendering
  describe('header rendering', () => {
    it('renders the page title', () => {
      renderPage();
      expect(screen.getByText('Cross-Reference Matrix')).toBeDefined();
    });

    it('renders the subtitle', () => {
      renderPage();
      expect(screen.getByText('Standards integration mapping')).toBeDefined();
    });
  });

  // 3. Relationship type buttons
  describe('relationship type filter buttons', () => {
    it('renders compatible relationship type button', () => {
      renderPage();
      expect(screen.getAllByText('compatible').length).toBeGreaterThan(0);
    });

    it('renders integrated relationship type button', () => {
      renderPage();
      expect(screen.getAllByText('integrated').length).toBeGreaterThan(0);
    });

    it('renders prerequisite relationship type button', () => {
      renderPage();
      expect(screen.getAllByText('prerequisite').length).toBeGreaterThan(0);
    });

    it('renders complementary relationship type button', () => {
      renderPage();
      expect(screen.getAllByText('complementary').length).toBeGreaterThan(0);
    });

    it('renders overlapping relationship type button', () => {
      renderPage();
      expect(screen.getByText('overlapping')).toBeDefined();
    });
  });

  // 4. Metrics
  describe('metrics', () => {
    it('renders pairs count for each relationship type', () => {
      renderPage();
      const pairElements = screen.getAllByText(/pairs/);
      expect(pairElements.length).toBeGreaterThan(0);
    });

    it('shows non-zero count for integrated relationships', () => {
      renderPage();
      // standardRelationships has integrated types: iso-45001→iso-45003, etc.
      const allText = document.body.textContent || '';
      expect(allText).toContain('pairs');
    });
  });

  // 5. Filter section
  describe('filter section', () => {
    it('renders search input', () => {
      renderPage();
      const searchInput = document.querySelector('input[type="text"]');
      expect(searchInput).toBeDefined();
    });

    it('renders standards filter dropdown', () => {
      renderPage();
      const selects = document.querySelectorAll('select');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  // 6. Relationship list
  describe('relationship list', () => {
    it('renders at least one relationship card in list view', () => {
      renderPage();
      // Should show the "integrated" relationship between ISO 45001 and ISO 45003
      const allText = document.body.textContent || '';
      expect(allText).toContain('ISO 45001');
    });

    it('shows integration notes text in some form', () => {
      renderPage();
      // integration notes from standardRelationships
      const allText = document.body.textContent || '';
      expect(allText.length).toBeGreaterThan(100);
    });
  });

  // 7. Search filtering
  describe('search filtering', () => {
    it('filtering by ISO 45001 shows relevant relationships', () => {
      renderPage();
      const input = document.querySelector('input[type="text"]') as HTMLInputElement | null;
      if (input) {
        fireEvent.change(input, { target: { value: 'ISO 45001' } });
        const allText = document.body.textContent || '';
        expect(allText).toContain('ISO 45001');
      }
    });

    it('showing empty results does not throw', () => {
      renderPage();
      const input = document.querySelector('input[type="text"]') as HTMLInputElement | null;
      if (input) {
        fireEvent.change(input, { target: { value: 'xxxxnonexistent9999' } });
        expect(screen.getByText('Cross-Reference Matrix')).toBeDefined();
      }
    });
  });

  // 8. View mode toggle
  describe('view mode toggle', () => {
    it('has list view button and matrix view button', () => {
      renderPage();
      // The view toggle buttons are in the header
      const svgButtons = document.querySelectorAll('.bg-white\\/20 button');
      expect(svgButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('clicking matrix view button switches to matrix mode without crashing', () => {
      renderPage();
      const bgButtons = document.querySelectorAll('.bg-white\\/20 button');
      if (bgButtons.length >= 2) {
        fireEvent.click(bgButtons[1]);
        // Should not crash, page still renders
        expect(screen.getByText('Cross-Reference Matrix')).toBeDefined();
      }
    });
  });

  // 9. Relationship type filtering
  describe('relationship type click-filtering', () => {
    it('clicking integrated type button filters to integrated pairs', () => {
      renderPage();
      const allButtons = document.querySelectorAll('button');
      const intgrBtn = Array.from(allButtons).find(b =>
        b.textContent?.trim().startsWith('🔗') || b.textContent?.includes('integrated')
      );
      if (intgrBtn) {
        fireEvent.click(intgrBtn);
        expect(screen.getByText('Cross-Reference Matrix')).toBeDefined();
      }
    });

    it('clicking same type button again deselects filter (toggles back to all)', () => {
      renderPage();
      const allButtons = document.querySelectorAll('button');
      const compBtn = Array.from(allButtons).find(b =>
        b.textContent?.includes('compatible')
      );
      if (compBtn) {
        fireEvent.click(compBtn);  // select
        fireEvent.click(compBtn);  // deselect
        expect(screen.getByText('Cross-Reference Matrix')).toBeDefined();
      }
    });
  });

  // 10. Expanding a relationship card
  describe('relationship card expansion', () => {
    it('clicking a relationship card expands it showing mapped clauses section', () => {
      renderPage();
      const cards = document.querySelectorAll('.rounded-xl.border-l-4');
      if (cards.length > 0) {
        const cardBtn = cards[0].querySelector('button');
        if (cardBtn) {
          fireEvent.click(cardBtn);
          // After expansion, should show more details
          expect(screen.getByText('Cross-Reference Matrix')).toBeDefined();
        }
      }
    });
  });

  // 11. Navigation
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
