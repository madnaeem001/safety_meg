import React, { useEffect, ReactNode } from 'react';
import { useThemeStore, ThemeMode, ResolvedTheme } from '../store/useThemeStore';

// ─────────────────────────────────────────────────────────────────────────────
// ThemeProvider
//
// A pure-effects component: no state of its own.
// All theme state lives in the Zustand store (useThemeStore) so it is
// preserved across navigation without any Context drilling.
//
// Responsibilities:
//   1. Apply / remove the `.dark` class on <html> whenever resolvedTheme
//      changes.  The initial class was already stamped by the anti-flicker
//      inline script in index.html, so no first-paint FOUC occurs.
//   2. Keep resolvedTheme in sync when the OS preference changes and the
//      user has chosen 'system' mode.
//   3. Update the <meta name="theme-color"> for mobile browser chrome.
// ─────────────────────────────────────────────────────────────────────────────

// Re-export types so callers that imported from this file keep working
export type { ThemeMode as Theme, ResolvedTheme };

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

// Thin React Context — only consumed by legacy `useTheme()` callers.
// New code should import `useThemeStore` directly.
const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = (): ThemeContextValue => {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};

const META_COLORS: Record<ResolvedTheme, string> = {
  dark:  '#0D2137', // primary.800 — Deep Navy
  light: '#FFFFFF',
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme, _setResolvedTheme } =
    useThemeStore();

  // 1. Sync OS preference when theme === 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) =>
      _setResolvedTheme(e.matches ? 'dark' : 'light');

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, _setResolvedTheme]);

  // 2. Sync cross-tab changes (another tab toggled the theme)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== 'safetymeg-theme' || !e.newValue) return;
      try {
        const persisted = JSON.parse(e.newValue);
        const mode = persisted?.state?.theme as ThemeMode | undefined;
        if (mode && ['light', 'dark', 'system'].includes(mode)) {
          setTheme(mode);
        }
      } catch {
        // ignore malformed data
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [setTheme]);

  // 3. Apply .dark class and meta theme-color on every resolvedTheme change
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', META_COLORS[resolvedTheme]);
  }, [resolvedTheme]);

  const contextValue: ThemeContextValue = {
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;

