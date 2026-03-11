import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, ArrowLeft, Settings, Check, Trash2,
  AlertTriangle, CheckCircle, Info, XCircle,
  Shield, GraduationCap, Scale, Server, ClipboardCheck,
  BellOff, BellRing, Volume2, Play, Gauge, ChevronDown,
  Search, X, Filter, CheckSquare, Square, Keyboard
} from 'lucide-react';
import type {
  Notification,
  NotificationSettings as NotificationSettingsType,
  NotificationSoundType,
  NotificationGroup,
} from '../data/mockNavigation';
import {
  NOTIFICATION_SOUNDS,
  loadNotifications,
  saveNotifications,
  loadNotificationSettings,
  saveNotificationSettings,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  playNotificationSound,
  groupNotificationsByDate,
} from '../data/mockNavigation';
import {
  useBackendNotifications,
  useNotificationSettings,
  useUpdateNotificationSettings,
  useMarkNotificationsRead,
} from '../api/hooks/useAPIHooks';

const NotificationIcon: Record<Notification['type'], React.ElementType> = {
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
  error: XCircle,
};

const NotificationColor: Record<Notification['type'], string> = {
  warning: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  success: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  error: 'text-red-500 bg-red-50 dark:bg-red-900/20',
};

const CategoryIcon: Record<Notification['category'], React.ElementType> = {
  safety: Shield,
  training: GraduationCap,
  compliance: Scale,
  system: Server,
  audit: ClipboardCheck,
};

// Filter options
type ReadFilter = 'all' | 'read' | 'unread';
type TypeFilter = 'all' | Notification['type'];
type CategoryFilter = 'all' | Notification['category'];

// Keyboard shortcuts configuration
const KEYBOARD_SHORTCUTS = [
  { key: '/', description: 'Focus search', action: 'search' },
  { key: 's', description: 'Toggle selection mode', action: 'select', meta: true },
  { key: 'a', description: 'Select all visible', action: 'selectAll', meta: true },
  { key: 'r', description: 'Mark selected as read', action: 'markRead', meta: true },
  { key: 'Backspace', description: 'Delete selected', action: 'delete', meta: true },
  { key: 'Escape', description: 'Exit selection / Clear search', action: 'escape' },
  { key: 'f', description: 'Toggle filters', action: 'filters' },
] as const;

export const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettingsType>(loadNotificationSettings());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // ── Real API Hooks ───────────────────────────────────────────────────────
  const { data: backendNotifs, refetch: refetchNotifs } = useBackendNotifications({ limit: 50 });
  const { data: notifSettings } = useNotificationSettings();
  const { mutate: markReadMutation } = useMarkNotificationsRead();
  const { mutate: updateSettingsMutation } = useUpdateNotificationSettings();

  // Tracks which notification IDs originated from the backend (stringified numeric ids)
  const [backendIdSet, setBackendIdSet] = useState<Set<string>>(new Set());

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Keyboard shortcuts state
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mockNotifs = loadNotifications();
    if (backendNotifs && backendNotifs.length > 0) {
      // Convert backend notifications to local format and merge
      const VALID_CATEGORIES = new Set(['safety', 'training', 'compliance', 'system', 'audit']);
      const convertedBackend: Notification[] = backendNotifs.map((n: any) => {
        const rawCategory = n.notificationType || 'system';
        const category = VALID_CATEGORIES.has(rawCategory) ? rawCategory : 'system';
        const ts = n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString();
        return {
          id: String(n.id),
          title: n.title,
          message: n.message,
          type: n.severity === 'critical' ? 'error' : n.severity === 'warning' ? 'warning' : n.severity === 'success' ? 'success' : 'info',
          category: category as Notification['category'],
          time: ts,
          timestamp: ts,
          read: n.isRead,
        };
      });
      setBackendIdSet(new Set(convertedBackend.map(n => n.id)));
      setNotifications([...convertedBackend, ...mockNotifs].slice(0, 100));
    } else {
      setNotifications(mockNotifs);
    }
  }, [backendNotifs]);

  // Sync backend notification preferences into local settings on load
  useEffect(() => {
    if (!notifSettings?.preferences) return;
    const prefs = notifSettings.preferences;
    setSettings(prev => ({
      ...prev,
      ...(prefs.emailNotifications !== undefined && { emailNotifications: prefs.emailNotifications }),
      ...(prefs.inAppNotifications !== undefined && { pushNotifications: prefs.inAppNotifications }),
      ...(prefs.preferences && {
        safetyAlerts: prefs.preferences['safetyAlerts'] ?? prev.safetyAlerts,
        trainingReminders: prefs.preferences['trainingReminders'] ?? prev.trainingReminders,
        complianceUpdates: prefs.preferences['complianceUpdates'] ?? prev.complianceUpdates,
        auditNotifications: prefs.preferences['auditNotifications'] ?? prev.auditNotifications,
        systemAlerts: prefs.preferences['systemAlerts'] ?? prev.systemAlerts,
      }),
    }));
  }, [notifSettings]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Search filter
      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase();
        if (!n.title.toLowerCase().includes(search) && 
            !n.message.toLowerCase().includes(search)) {
          return false;
        }
      }
      // Read filter
      if (readFilter === 'read' && !n.read) return false;
      if (readFilter === 'unread' && n.read) return false;
      // Type filter
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      // Category filter
      if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
      return true;
    });
  }, [notifications, debouncedSearch, readFilter, typeFilter, categoryFilter]);

  // Group filtered notifications by date
  const groupedNotifications = useMemo(() => 
    groupNotificationsByDate(filteredNotifications),
    [filteredNotifications]
  );

  // Get all visible notification IDs for bulk select
  const visibleIds = useMemo(() => 
    filteredNotifications.map(n => n.id),
    [filteredNotifications]
  );

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(visibleIds));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleIds.length) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  // Bulk actions
  const handleBulkDelete = useCallback(() => {
    const updated = notifications.filter(n => !selectedIds.has(n.id));
    setNotifications(updated);
    saveNotifications(updated);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }, [notifications, selectedIds]);

  const handleBulkMarkAsRead = useCallback(() => {
    const updated = notifications.map(n => 
      selectedIds.has(n.id) ? { ...n, read: true } : n
    );
    setNotifications(updated);
    saveNotifications(updated);
    const backendIds = [...selectedIds]
      .filter(id => backendIdSet.has(id))
      .map(id => parseInt(id, 10));
    if (backendIds.length > 0) markReadMutation(backendIds);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }, [notifications, selectedIds, backendIdSet, markReadMutation]);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setReadFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
  }, []);

  const hasActiveFilters = searchQuery || readFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all';

  // Keyboard shortcuts handler
  useEffect(() => {
    if (activeTab !== 'notifications') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs (except for Escape)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      
      // Escape always works
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isSelectionMode) {
          exitSelectionMode();
        } else if (searchQuery) {
          setSearchQuery('');
          searchInputRef.current?.blur();
        } else if (showShortcutsHelp) {
          setShowShortcutsHelp(false);
        }
        return;
      }
      
      // Other shortcuts don't work when in input
      if (isInput) return;
      
      // / to focus search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      
      // f to toggle filters
      if (e.key === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowFilters(prev => !prev);
        return;
      }
      
      // ? to show shortcuts help
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowShortcutsHelp(prev => !prev);
        return;
      }
      
      // Meta/Ctrl shortcuts
      const metaKey = e.metaKey || e.ctrlKey;
      
      // Cmd/Ctrl + S to toggle selection mode
      if (metaKey && e.key === 's') {
        e.preventDefault();
        setIsSelectionMode(prev => !prev);
        if (isSelectionMode) {
          setSelectedIds(new Set());
        }
        return;
      }
      
      // Cmd/Ctrl + A to select all (only in selection mode)
      if (metaKey && e.key === 'a' && isSelectionMode) {
        e.preventDefault();
        if (selectedIds.size === visibleIds.length) {
          setSelectedIds(new Set());
        } else {
          setSelectedIds(new Set(visibleIds));
        }
        return;
      }
      
      // Cmd/Ctrl + R to mark selected as read (only in selection mode with selection)
      if (metaKey && e.key === 'r' && isSelectionMode && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkMarkAsRead();
        return;
      }
      
      // Cmd/Ctrl + Backspace to delete selected (only in selection mode with selection)
      if (metaKey && e.key === 'Backspace' && isSelectionMode && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkDelete();
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isSelectionMode, searchQuery, selectedIds, visibleIds, exitSelectionMode, handleBulkMarkAsRead, handleBulkDelete, showShortcutsHelp]);

  const handleMarkAsRead = (id: string) => {
    const updated = markAsRead(notifications, id);
    setNotifications(updated);
    saveNotifications(updated);
    if (backendIdSet.has(id)) markReadMutation([parseInt(id, 10)]);
  };

  const handleMarkAllAsRead = () => {
    const updated = markAllAsRead(notifications);
    setNotifications(updated);
    saveNotifications(updated);
    const unreadBackendIds = notifications
      .filter(n => backendIdSet.has(n.id) && !n.read)
      .map(n => parseInt(n.id, 10));
    if (unreadBackendIds.length > 0) markReadMutation(unreadBackendIds);
  };

  const handleDeleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    saveNotifications(updated);
  };

  const handleSettingChange = (key: keyof NotificationSettingsType) => {
    const newValue = !settings[key];
    const updated = { ...settings, [key]: newValue };
    setSettings(updated);
    saveNotificationSettings(updated);
    // Notify other components (e.g. NavigationBar) in the same tab
    window.dispatchEvent(new CustomEvent('notificationSettingsChanged'));

    if (key === 'soundEnabled' && newValue) {
      setTimeout(() => playNotificationSound(), 100);
    }

    // Request browser Push Notification permission when enabled
    if (key === 'pushNotifications' && newValue) {
      if (typeof Notification === 'undefined') {
        // Browser doesn't support push — revert silently
        const reverted = { ...updated, pushNotifications: false };
        setSettings(reverted);
        saveNotificationSettings(reverted);
        window.dispatchEvent(new CustomEvent('notificationSettingsChanged'));
      } else if (Notification.permission === 'denied') {
        // Permission was previously denied — revert and inform user
        const reverted = { ...updated, pushNotifications: false };
        setSettings(reverted);
        saveNotificationSettings(reverted);
        window.dispatchEvent(new CustomEvent('notificationSettingsChanged'));
        alert('Push notification permission was denied. Please enable it in your browser settings.');
      } else if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(perm => {
          if (perm !== 'granted') {
            const reverted = { ...updated, pushNotifications: false };
            setSettings(reverted);
            saveNotificationSettings(reverted);
            window.dispatchEvent(new CustomEvent('notificationSettingsChanged'));
          }
        });
      }
    }

    // Persist delivery preferences to backend
    if (key === 'emailNotifications') {
      updateSettingsMutation({ userId: 'default', emailNotifications: newValue as boolean });
    } else if (key === 'pushNotifications') {
      updateSettingsMutation({ userId: 'default', inAppNotifications: newValue as boolean });
    } else if (['safetyAlerts', 'trainingReminders', 'complianceUpdates', 'auditNotifications', 'systemAlerts'].includes(key)) {
      updateSettingsMutation({
        userId: 'default',
        preferences: {
          safetyAlerts: updated.safetyAlerts,
          trainingReminders: updated.trainingReminders,
          complianceUpdates: updated.complianceUpdates,
          auditNotifications: updated.auditNotifications,
          systemAlerts: updated.systemAlerts,
        },
      });
    }
  };

  const unreadCount = getUnreadCount(notifications);

  const settingItems = [
    { key: 'safetyAlerts' as const, label: 'Safety Alerts', description: 'Incidents, hazards, and safety warnings', icon: Shield },
    { key: 'trainingReminders' as const, label: 'Training Reminders', description: 'Certification expirations and course deadlines', icon: GraduationCap },
    { key: 'complianceUpdates' as const, label: 'Compliance Updates', description: 'Regulatory changes and CAPA notifications', icon: Scale },
    { key: 'auditNotifications' as const, label: 'Audit Notifications', description: 'Scheduled audits and inspection reminders', icon: ClipboardCheck },
    { key: 'systemAlerts' as const, label: 'System Alerts', description: 'Maintenance and system updates', icon: Server },
  ];

  const deliverySettings = [
    { key: 'emailNotifications' as const, label: 'Email Notifications', description: 'Receive notifications via email' },
    { key: 'pushNotifications' as const, label: 'Push Notifications', description: 'Show push notifications on device' },
    { key: 'soundEnabled' as const, label: 'Sound', description: 'Play sound for notifications' },
  ];

  // Test notification sound with specific type
  const handleTestSound = (soundType?: NotificationSoundType) => {
    playNotificationSound(true, soundType ?? settings.soundType);
  };

  // Handle sound type change
  const handleSoundTypeChange = (soundType: NotificationSoundType) => {
    const updated = { ...settings, soundType };
    setSettings(updated);
    saveNotificationSettings(updated);
    window.dispatchEvent(new CustomEvent('notificationSettingsChanged'));
    // Preview the selected sound
    if (soundType !== 'none') {
      playNotificationSound(true, soundType);
    }
  };

  // Handle animation speed change
  const handleAnimationSpeedChange = (speed: number) => {
    const updated = { ...settings, badgeAnimationSpeed: speed };
    setSettings(updated);
    saveNotificationSettings(updated);
    window.dispatchEvent(new CustomEvent('notificationSettingsChanged'));
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-slate-900 pb-24">

      
      {/* Keyboard Shortcuts Help Modal */}
      <AnimatePresence>
        {showShortcutsHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowShortcutsHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full overflow-hidden"
            >
              <div className="p-4 border-b border-surface-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-brand-500" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">Keyboard Shortcuts</h3>
                  </div>
                  <button
                    onClick={() => setShowShortcutsHelp(false)}
                    className="p-1.5 hover:bg-surface-100 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <X className="w-4 h-4 text-surface-500" />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {KEYBOARD_SHORTCUTS.map((shortcut) => (
                  <div key={shortcut.action} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-surface-600 dark:text-surface-300">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {'meta' in shortcut && shortcut.meta && (
                        <kbd className="px-1.5 py-0.5 text-xs font-medium bg-surface-100 dark:bg-slate-700 text-surface-600 dark:text-surface-300 rounded border border-surface-200 dark:border-slate-600">
                          ⌘
                        </kbd>
                      )}
                      <kbd className="px-1.5 py-0.5 text-xs font-medium bg-surface-100 dark:bg-slate-700 text-surface-600 dark:text-surface-300 rounded border border-surface-200 dark:border-slate-600">
                        {shortcut.key === 'Backspace' ? '⌫' : shortcut.key}
                      </kbd>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-surface-600 dark:text-surface-300">Show this help</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-medium bg-surface-100 dark:bg-slate-700 text-surface-600 dark:text-surface-300 rounded border border-surface-200 dark:border-slate-600">
                    ?
                  </kbd>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header */}
      <div className="sticky top-14 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-surface-200/60 dark:border-slate-700/60">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors touch-target"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-surface-500 dark:text-surface-400">{unreadCount} unread</p>
              )}
            </div>
            {/* Keyboard shortcuts help button */}
            <button
              onClick={() => setShowShortcutsHelp(true)}
              className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors touch-target hidden md:flex"
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="w-5 h-5 text-surface-500 dark:text-surface-400" />
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'notifications' ? 'settings' : 'notifications')}
              className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors touch-target"
              aria-label="Toggle settings"
            >
              <Settings className={`w-5 h-5 transition-colors ${activeTab === 'settings' ? 'text-brand-500' : 'text-surface-500 dark:text-surface-400'}`} />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 mt-3 p-1 bg-surface-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'notifications'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-surface-500 dark:text-surface-400'
              }`}
            >
              <Bell className="w-4 h-4 inline mr-2" />
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-surface-500 dark:text-surface-400'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {activeTab === 'notifications' ? (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Search and Filter Bar */}
              <div className="mb-4 space-y-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notifications... (press / to focus)"
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-surface-200/60 dark:border-slate-700/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-100 dark:hover:bg-slate-700 rounded-full"
                    >
                      <X className="w-4 h-4 text-surface-400" />
                    </button>
                  )}
                </div>

                {/* Filter Toggle & Selection Mode */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showFilters || hasActiveFilters
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                        : 'bg-surface-100 dark:bg-slate-800 text-surface-600 dark:text-surface-300'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                    {hasActiveFilters && (
                      <span className="w-2 h-2 rounded-full bg-brand-500" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isSelectionMode
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                        : 'bg-surface-100 dark:bg-slate-800 text-surface-600 dark:text-surface-300'
                    }`}
                  >
                    {isSelectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    Select
                  </button>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="ml-auto text-xs text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {/* Filter Options */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-2 pt-2">
                        {/* Read Filter */}
                        <select
                          value={readFilter}
                          onChange={(e) => setReadFilter(e.target.value as ReadFilter)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-surface-200/60 dark:border-slate-700/60 rounded-lg text-sm text-slate-900 dark:text-white"
                        >
                          <option value="all">All Status</option>
                          <option value="unread">Unread</option>
                          <option value="read">Read</option>
                        </select>

                        {/* Type Filter */}
                        <select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-surface-200/60 dark:border-slate-700/60 rounded-lg text-sm text-slate-900 dark:text-white"
                        >
                          <option value="all">All Types</option>
                          <option value="warning">Warning</option>
                          <option value="success">Success</option>
                          <option value="info">Info</option>
                          <option value="error">Error</option>
                        </select>

                        {/* Category Filter */}
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-surface-200/60 dark:border-slate-700/60 rounded-lg text-sm text-slate-900 dark:text-white capitalize"
                        >
                          <option value="all">All Categories</option>
                          <option value="safety">Safety</option>
                          <option value="training">Training</option>
                          <option value="compliance">Compliance</option>
                          <option value="audit">Audit</option>
                          <option value="system">System</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bulk Actions Bar */}
                <AnimatePresence>
                  {isSelectionMode && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-between p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-200/60 dark:border-brand-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={toggleSelectAll}
                          className="flex items-center gap-2 text-sm font-medium text-brand-700 dark:text-brand-300"
                        >
                          {selectedIds.size === visibleIds.length && visibleIds.length > 0 ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                          {selectedIds.size === visibleIds.length && visibleIds.length > 0 ? 'Deselect All' : 'Select All'}
                        </button>
                        <span className="text-sm text-brand-600 dark:text-brand-400">
                          {selectedIds.size} selected
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleBulkMarkAsRead}
                          disabled={selectedIds.size === 0}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Check className="w-4 h-4 inline mr-1" />
                          Mark Read
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          disabled={selectedIds.size === 0}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 inline mr-1" />
                          Delete
                        </button>
                        <button
                          onClick={exitSelectionMode}
                          className="p-1.5 hover:bg-brand-100 dark:hover:bg-brand-900/40 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions Bar */}
              {unreadCount > 0 && !isSelectionMode && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="mb-4 flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Mark all as read
                </button>
              )}

              {/* Notifications List */}
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <BellOff className="w-8 h-8 text-surface-400 dark:text-surface-500" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                    {hasActiveFilters ? 'No matching notifications' : 'No notifications'}
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {hasActiveFilters ? 'Try adjusting your filters' : "You're all caught up!"}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-3 text-sm text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedNotifications.map((group) => (
                    <div key={group.key} className="space-y-2">
                      {/* Group Header */}
                      <button
                        onClick={() => toggleGroupCollapse(group.key)}
                        className="w-full flex items-center justify-between py-2 px-1 group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                            {group.label}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-surface-100 dark:bg-slate-700 text-surface-600 dark:text-surface-300">
                            {group.notifications.length}
                          </span>
                        </div>
                        <ChevronDown 
                          className={`w-4 h-4 text-surface-400 transition-transform ${
                            collapsedGroups.has(group.key) ? '-rotate-90' : ''
                          }`} 
                        />
                      </button>
                      
                      {/* Group Notifications */}
                      <AnimatePresence>
                        {!collapsedGroups.has(group.key) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                          >
                            {group.notifications.map((notification, index) => {
                              const TypeIcon = NotificationIcon[notification.type] ?? Info;
                              const CategoryIconComponent = CategoryIcon[notification.category] ?? Info;
                              const isSelected = selectedIds.has(notification.id);
                              
                              return (
                                <motion.div
                                  key={notification.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.03 }}
                                  onClick={isSelectionMode ? () => toggleSelection(notification.id) : undefined}
                                  className={`
                                    relative rounded-2xl border overflow-hidden transition-all
                                    ${!notification.read
                                      ? 'bg-cyan-500/5 dark:bg-cyan-500/8 border-cyan-500/25 dark:border-cyan-500/20 shadow-md'
                                      : 'bg-white dark:bg-slate-800 border-surface-200/60 dark:border-slate-700/60 shadow-sm opacity-70'}
                                    ${isSelectionMode ? 'cursor-pointer' : ''}
                                    ${isSelected ? 'ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-900/20' : ''}
                                  `}
                                >
                                  {/* Selection Checkbox */}
                                  {isSelectionMode && (
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                                      {isSelected ? (
                                        <CheckSquare className="w-5 h-5 text-brand-500" />
                                      ) : (
                                        <Square className="w-5 h-5 text-surface-400" />
                                      )}
                                    </div>
                                  )}

                                  {/* Unread left bar */}
                                  {!notification.read && !isSelectionMode && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-cyan-400 to-cyan-600" />
                                  )}

                                  {/* Unread pulsing dot — top right */}
                                  {!notification.read && !isSelectionMode && (
                                    <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                                    </span>
                                  )}

                                  <div className={`p-4 ${isSelectionMode ? 'pl-12' : 'pl-5'}`}>
                                    <div className="flex gap-3">
                                      {/* Type Icon */}
                                      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${NotificationColor[notification.type]}`}>
                                        <TypeIcon className="w-5 h-5" />
                                      </div>

                                      {/* Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <h3 className={`text-sm ${!notification.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}>
                                            {notification.title}
                                          </h3>
                                          <span className="shrink-0 text-xs text-surface-400 dark:text-surface-500">
                                            {notification.time}
                                          </span>
                                        </div>
                                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2">
                                          {notification.message}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                          {/* Category Badge */}
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-100 dark:bg-slate-700 text-xs text-surface-600 dark:text-surface-300 capitalize">
                                            <CategoryIconComponent className="w-3 h-3" />
                                            {notification.category}
                                          </span>
                                          
                                          {/* Actions */}
                                          {!isSelectionMode && (
                                            <div className="flex items-center gap-2 ml-auto">
                                              {!notification.read && (
                                                <button
                                                  onClick={() => handleMarkAsRead(notification.id)}
                                                  className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-slate-700 text-surface-400 hover:text-brand-500 transition-colors"
                                                  title="Mark as read"
                                                >
                                                  <Check className="w-4 h-4" />
                                                </button>
                                              )}
                                              <button
                                                onClick={() => handleDeleteNotification(notification.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-colors"
                                                title="Delete"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Notification Types */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-brand-500" />
                  Notification Types
                </h3>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-surface-200/60 dark:border-slate-700/60 divide-y divide-surface-100 dark:divide-slate-700">
                  {settingItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <label
                        key={item.key}
                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-50 dark:hover:bg-slate-750 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 dark:text-white">{item.label}</p>
                          <p className="text-xs text-surface-500 dark:text-surface-400">{item.description}</p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={settings[item.key]}
                            onChange={() => handleSettingChange(item.key)}
                            className="sr-only peer"
                          />
                          <div className={`
                            w-11 h-6 rounded-full transition-colors
                            ${settings[item.key] ? 'bg-brand-500' : 'bg-surface-300 dark:bg-slate-600'}
                          `}>
                            <div className={`
                              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform
                              ${settings[item.key] ? 'translate-x-5' : 'translate-x-0'}
                            `} />
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Settings */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  Delivery Preferences
                </h3>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-surface-200/60 dark:border-slate-700/60 divide-y divide-surface-100 dark:divide-slate-700">
                  {deliverySettings.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-50 dark:hover:bg-slate-750 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">{item.description}</p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={settings[item.key]}
                          onChange={() => handleSettingChange(item.key)}
                          className="sr-only peer"
                        />
                        <div className={`
                          w-11 h-6 rounded-full transition-colors
                          ${settings[item.key] ? 'bg-brand-500' : 'bg-surface-300 dark:bg-slate-600'}
                        `}>
                          <div className={`
                            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform
                            ${settings[item.key] ? 'translate-x-5' : 'translate-x-0'}
                          `} />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Test Sound Button */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  Test Sound
                </h3>
                <motion.button
                  onClick={() => handleTestSound()}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-surface-200/60 dark:border-slate-700/60 hover:bg-surface-50 dark:hover:bg-slate-750 transition-colors"
                >
                  <Volume2 className="w-5 h-5 text-brand-500" />
                  <span className="font-medium text-sm text-slate-900 dark:text-white">Play Notification Sound</span>
                </motion.button>
                <p className="mt-2 text-xs text-surface-500 dark:text-surface-400 text-center">
                  Tap to preview the notification chime
                </p>
              </div>

              {/* Sound Type Selection */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-brand-500" />
                  Notification Sound
                </h3>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-surface-200/60 dark:border-slate-700/60 divide-y divide-surface-100 dark:divide-slate-700">
                  {NOTIFICATION_SOUNDS.map((sound) => (
                    <label
                      key={sound.id}
                      className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                        settings.soundType === sound.id 
                          ? 'bg-brand-50 dark:bg-brand-900/20' 
                          : 'hover:bg-surface-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      <input
                        type="radio"
                        name="soundType"
                        value={sound.id}
                        checked={settings.soundType === sound.id}
                        onChange={() => handleSoundTypeChange(sound.id)}
                        className="w-4 h-4 text-brand-500 border-surface-300 focus:ring-brand-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-sm text-slate-900 dark:text-white block">{sound.label}</span>
                        {'description' in sound && sound.description && (
                          <span className="text-xs text-surface-500 dark:text-surface-400">{sound.description}</span>
                        )}
                      </div>
                      {sound.frequencies && (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); handleTestSound(sound.id); }}
                          className={`p-2 rounded-lg transition-colors ${
                            settings.soundType === sound.id 
                              ? 'bg-brand-100 dark:bg-brand-800/30 text-brand-600' 
                              : 'hover:bg-surface-100 dark:hover:bg-slate-700 text-brand-500'
                          }`}
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Badge Animation Speed */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-brand-500" />
                  Badge Animation Speed
                </h3>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-surface-200/60 dark:border-slate-700/60 p-4">
                  {/* Live Preview Badge */}
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-slate-700 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-surface-500 dark:text-surface-400" />
                      </div>
                      <span 
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse"
                        style={{ 
                          animationDuration: `${1.5 / settings.badgeAnimationSpeed}s`,
                        }}
                      >
                        3
                      </span>
                      <span 
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"
                        style={{ 
                          animationDuration: `${1.5 / settings.badgeAnimationSpeed}s`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-surface-500 dark:text-surface-400 text-center mb-4">Live Preview</p>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-surface-500 w-8">0.5x</span>
                    <input
                      type="range"
                      min={0.5}
                      max={2}
                      step={0.25}
                      value={settings.badgeAnimationSpeed}
                      onChange={(e) => handleAnimationSpeedChange(Number(e.target.value))}
                      className="flex-1 h-2 bg-surface-200 dark:bg-slate-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
                    />
                    <span className="text-xs text-surface-500 w-8">2x</span>
                  </div>
                  <div className="flex justify-between mt-3">
                    <span className="text-xs text-surface-400">Slower</span>
                    <span className="text-sm font-medium text-brand-600 dark:text-brand-400">{settings.badgeAnimationSpeed}x</span>
                    <span className="text-xs text-surface-400">Faster</span>
                  </div>
                  <p className="mt-3 text-xs text-surface-500 dark:text-surface-400 text-center">
                    Adjusts the pulse animation speed of notification badges
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


    </div>
  );
};

export default NotificationSettings;
