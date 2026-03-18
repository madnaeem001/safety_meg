import React from 'react';
import { useThemeStore } from '../store/useThemeStore';

// ─────────────────────────────────────────────────────────────────────────────
// ThemeToggle
//
// A self-contained button that cycles: dark ↔ light.
// Reads / writes via the Zustand store so state is always in sync
// with the ThemeProvider — no prop-drilling needed.
//
// Tokens used:
//   bg-surface-raised   → button background
//   text-text-primary   → icon colour
//   border-surface-border → ring/border
//   accent-DEFAULT      → focus ring
// ─────────────────────────────────────────────────────────────────────────────

interface ThemeToggleProps {
  /** Optional extra classes (e.g. "ml-auto") */
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      className={[
        // Layout
        'relative inline-flex items-center justify-center',
        'h-9 w-9 rounded-lg',
        // Colours — fully token-based
        'bg-surface-raised text-text-primary',
        'border border-surface-border',
        // Focus
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base',
        // Interaction
        'transition-colors duration-normal ease-smooth',
        'hover:bg-surface-overlay',
        className,
      ].join(' ')}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
};

// ── Inline SVG icons — no external dependency needed ────────────────────────

const SunIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default ThemeToggle;
