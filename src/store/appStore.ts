// Global App Store - handles notifications, UI state, app-wide settings
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ── TYPES ────────────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  actionUrl?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  dateFormat: string;
  timezone: string;
  sidebarCollapsed: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  denseMode: boolean;
}

export interface AppState {
  // Notifications
  notifications: AppNotification[];
  unreadCount: number;

  // UI State
  isOnline: boolean;
  isMobileDrawerOpen: boolean;
  globalSearchQuery: string;

  // App Settings
  settings: AppSettings;

  // Loading states
  globalLoading: boolean;
}

export interface AppActions {
  // Notifications
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // UI
  setMobileDrawerOpen: (open: boolean) => void;
  setGlobalSearch: (query: string) => void;
  setOnlineStatus: (online: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

type AppStore = AppState & AppActions;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timezone: 'UTC',
  sidebarCollapsed: false,
  notificationsEnabled: true,
  soundEnabled: true,
  denseMode: false,
};

// ── ZUSTAND STORE ─────────────────────────────────────────────────────────────
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ────────────────────────────────────────────────────
      notifications: [],
      unreadCount: 0,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isMobileDrawerOpen: false,
      globalSearchQuery: '',
      settings: DEFAULT_SETTINGS,
      globalLoading: false,

      // ── Notification Actions ──────────────────────────────────────────────
      addNotification: (notif) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newNotif: AppNotification = {
          ...notif,
          id,
          timestamp: Date.now(),
          read: false,
        };
        set((state) => ({
          notifications: [newNotif, ...state.notifications].slice(0, 100), // max 100
          unreadCount: state.unreadCount + 1,
        }));
      },

      markNotificationRead: (id) => {
        set((state) => {
          const notifs = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications: notifs,
            unreadCount: notifs.filter((n) => !n.read).length,
          };
        });
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const notifs = state.notifications.filter((n) => n.id !== id);
          return {
            notifications: notifs,
            unreadCount: notifs.filter((n) => !n.read).length,
          };
        });
      },

      clearAllNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      // ── UI Actions ────────────────────────────────────────────────────────
      setMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),

      setGlobalSearch: (query) => set({ globalSearchQuery: query }),

      setOnlineStatus: (online) => set({ isOnline: online }),

      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      // ── Settings Actions ──────────────────────────────────────────────────
      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
      },
    }),
    {
      name: 'safetymeg-app',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        notifications: state.notifications.slice(0, 50), // persist last 50
        unreadCount: state.unreadCount,
      }),
    }
  )
);

// ── TOAST NOTIFICATION HELPER ─────────────────────────────────────────────────
export function toast(
  type: AppNotification['type'],
  title: string,
  message: string,
  actionUrl?: string
) {
  useAppStore.getState().addNotification({ type, title, message, actionUrl });
}
