// Global Auth Store using Zustand
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ── TYPES ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: 'worker' | 'supervisor' | 'manager' | 'safety_officer' | 'admin';
  department?: string;
  organization?: string;
  isActive: boolean;
  lastLogin?: number;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  updateProfile: (data: Partial<Pick<AuthUser, 'fullName' | 'department' | 'organization'>>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  loadCurrentUser: () => Promise<void>;
  clearError: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role?: AuthUser['role'];
  department?: string;
  organization?: string;
}

type AuthStore = AuthState & AuthActions;

// ── API BASE URL ─────────────────────────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';

async function apiCall<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  return data;
}

// ── ZUSTAND STORE ─────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ────────────────────────────────────────────────────
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ── Actions ───────────────────────────────────────────────────────────
      clearError: () => set({ error: null }),

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await apiCall<{
            accessToken: string;
            refreshToken: string;
            user: AuthUser;
          }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });

          if (result.success && result.data) {
            set({
              user: result.data.user,
              accessToken: result.data.accessToken,
              refreshToken: result.data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({ error: result.error || 'Login failed', isLoading: false });
            return false;
          }
        } catch (err: any) {
          set({ error: err.message || 'Network error', isLoading: false });
          return false;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const result = await apiCall<{
            accessToken: string;
            refreshToken: string;
            user: AuthUser;
          }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
          });

          if (result.success && result.data) {
            set({
              user: result.data.user,
              accessToken: result.data.accessToken,
              refreshToken: result.data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({ error: result.error || 'Registration failed', isLoading: false });
            return false;
          }
        } catch (err: any) {
          set({ error: err.message || 'Network error', isLoading: false });
          return false;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          await apiCall('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });
        } catch {
          // Ignore logout errors
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const result = await apiCall<{
            accessToken: string;
            refreshToken: string;
            user: AuthUser;
          }>('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });

          if (result.success && result.data) {
            set({
              user: result.data.user,
              accessToken: result.data.accessToken,
              refreshToken: result.data.refreshToken,
              isAuthenticated: true,
            });
            return true;
          } else {
            // Refresh failed - force logout
            set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            return false;
          }
        } catch {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          return false;
        }
      },

      loadCurrentUser: async () => {
        const { accessToken } = get();
        if (!accessToken) return;

        try {
          const result = await apiCall<AuthUser>('/auth/me', { token: accessToken });
          if (result.success && result.data) {
            set({ user: result.data, isAuthenticated: true });
          } else {
            // Token may be expired - try refresh
            const refreshed = await get().refreshAccessToken();
            if (!refreshed) {
              set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            }
          }
        } catch {
          // Ignore
        }
      },

      updateProfile: async (data) => {
        const { accessToken } = get();
        if (!accessToken) return false;

        set({ isLoading: true, error: null });
        try {
          const result = await apiCall<AuthUser>('/auth/me', {
            method: 'PUT',
            token: accessToken,
            body: JSON.stringify(data),
          });

          if (result.success && result.data) {
            set({ user: result.data, isLoading: false });
            return true;
          } else {
            set({ error: result.error || 'Update failed', isLoading: false });
            return false;
          }
        } catch (err: any) {
          set({ error: err.message || 'Network error', isLoading: false });
          return false;
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        const { accessToken } = get();
        if (!accessToken) return false;

        set({ isLoading: true, error: null });
        try {
          const result = await apiCall('/auth/change-password', {
            method: 'POST',
            token: accessToken,
            body: JSON.stringify({ currentPassword, newPassword }),
          });

          if (result.success) {
            set({ isLoading: false });
            // Force re-login since all tokens are revoked
            await get().logout();
            return true;
          } else {
            set({ error: result.error || 'Password change failed', isLoading: false });
            return false;
          }
        } catch (err: any) {
          set({ error: err.message || 'Network error', isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'safetymeg-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ── RBAC HELPERS ─────────────────────────────────────────────────────────────
export const ROLES = {
  WORKER: 'worker',
  SUPERVISOR: 'supervisor',
  MANAGER: 'manager',
  SAFETY_OFFICER: 'safety_officer',
  ADMIN: 'admin',
} as const;

export const ROLE_HIERARCHY: Record<string, number> = {
  worker: 1,
  supervisor: 2,
  manager: 3,
  safety_officer: 3,
  admin: 4,
};

export function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

export function canPerform(userRole: string, action: string): boolean {
  const permissions: Record<string, string[]> = {
    'view:incidents': ['worker', 'supervisor', 'manager', 'safety_officer', 'admin'],
    'create:incidents': ['worker', 'supervisor', 'manager', 'safety_officer', 'admin'],
    'edit:incidents': ['supervisor', 'manager', 'safety_officer', 'admin'],
    'delete:incidents': ['manager', 'safety_officer', 'admin'],
    'view:reports': ['supervisor', 'manager', 'safety_officer', 'admin'],
    'create:reports': ['supervisor', 'manager', 'safety_officer', 'admin'],
    'manage:users': ['admin', 'manager'],
    'view:analytics': ['supervisor', 'manager', 'safety_officer', 'admin'],
    'manage:settings': ['admin'],
    'approve:permits': ['supervisor', 'manager', 'safety_officer', 'admin'],
    'manage:training': ['safety_officer', 'manager', 'admin'],
  };

  const allowed = permissions[action] || [];
  return allowed.includes(userRole);
}
