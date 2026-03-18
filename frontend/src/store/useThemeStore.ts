import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─────────────────────────────────────────────────────────────────────────────
// SafetyMEG — Theme Store
// Source of truth for the active colour scheme.
//
// 'system'  → follows OS preference (window.matchMedia)
// 'light'   → forces light palette  (:root CSS vars)
// 'dark'    → forces dark  palette  (.dark CSS vars)
//
// Persisted via Zustand's localStorage middleware so the choice survives
// page reloads AND navigation — no flicker on return visits because the
// anti-flicker script in index.html reads the same key before React mounts.
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  /** User-selected mode */
  theme: ThemeMode;
  /** The actually-applied value (never 'system') */
  resolvedTheme: ResolvedTheme;
}

interface ThemeActions {
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  /** Called internally to keep resolvedTheme in sync with OS preference */
  _setResolvedTheme: (resolved: ResolvedTheme) => void;
}

export type ThemeStore = ThemeState & ThemeActions;

/** Reads OS colour-scheme preference — safe to call in SSR-like environments */
const getSystemTheme = (): ResolvedTheme =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

const resolve = (mode: ThemeMode): ResolvedTheme =>
  mode === 'system' ? getSystemTheme() : mode;

export const THEME_STORAGE_KEY = 'safetymeg-theme';

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      resolvedTheme: 'light',

      setTheme: (mode) => {
        set({ theme: mode, resolvedTheme: resolve(mode) });
      },

      toggleTheme: () => {
        const next: ThemeMode =
          get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next, resolvedTheme: next });
      },

      _setResolvedTheme: (resolved) => {
        set({ resolvedTheme: resolved });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist the user-facing choice, not the derived resolved value
      partialize: (state) => ({ theme: state.theme }),
      // After rehydration, derive resolvedTheme from the persisted theme
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.resolvedTheme = resolve(state.theme);
        }
      },
    }
  )
);
