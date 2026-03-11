// Mock data for navigation, notifications, and user profile

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp?: string; // ISO date string for grouping
  type: 'warning' | 'success' | 'info' | 'error';
  read: boolean;
  category: 'safety' | 'training' | 'compliance' | 'system' | 'audit';
}

export type NotificationGroupKey = 'today' | 'yesterday' | 'thisWeek' | 'earlier';

export interface NotificationGroup {
  key: NotificationGroupKey;
  label: string;
  notifications: Notification[];
}

export type NotificationSoundType = 'chime' | 'bell' | 'ping' | 'ding' | 'swoosh' | 'alert' | 'drop' | 'soft' | 'none';

export interface NotificationSettings {
  safetyAlerts: boolean;
  trainingReminders: boolean;
  complianceUpdates: boolean;
  auditNotifications: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  soundType: NotificationSoundType;
  badgeAnimationSpeed: number; // 0.5 to 2.0 multiplier
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  avatar?: string;
  certifications: string[];
  joinDate: string;
}

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  safetyAlerts: true,
  trainingReminders: true,
  complianceUpdates: true,
  auditNotifications: true,
  systemAlerts: true,
  emailNotifications: false,
  pushNotifications: true,
  soundEnabled: true,
  soundType: 'chime',
  badgeAnimationSpeed: 1.0,
};

// Sound definitions with various tones - expanded for more options
export const NOTIFICATION_SOUNDS: { id: NotificationSoundType; label: string; frequencies: [number, number] | null; waveform?: OscillatorType; description?: string }[] = [
  { id: 'chime', label: 'Chime', frequencies: [880, 1174.66], waveform: 'sine', description: 'Classic two-tone chime' },
  { id: 'bell', label: 'Bell', frequencies: [659.25, 783.99], waveform: 'sine', description: 'Gentle bell ring' },
  { id: 'ping', label: 'Ping', frequencies: [1318.51, 1567.98], waveform: 'sine', description: 'High-pitched ping' },
  { id: 'ding', label: 'Ding', frequencies: [1046.50, 1318.51], waveform: 'triangle', description: 'Soft triangle wave' },
  { id: 'swoosh', label: 'Swoosh', frequencies: [400, 800], waveform: 'sawtooth', description: 'Sweeping transition' },
  { id: 'alert', label: 'Alert', frequencies: [523.25, 659.25], waveform: 'square', description: 'Attention-grabbing alert' },
  { id: 'drop', label: 'Drop', frequencies: [987.77, 523.25], waveform: 'sine', description: 'Descending water drop' },
  { id: 'soft', label: 'Soft', frequencies: [440, 554.37], waveform: 'sine', description: 'Subtle soft tone' },
  { id: 'none', label: 'None', frequencies: null, description: 'Silent notifications' },
];

// Default user profile
export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'usr-001',
  firstName: 'Alex',
  lastName: 'Johnson',
  email: 'alex.johnson@megsafe.com',
  role: 'Safety Manager',
  department: 'EHS Operations',
  phone: '+1 (555) 123-4567',
  certifications: ['CSP', 'OSHA 30', 'ISO 45001 Lead Auditor'],
  joinDate: '2023-06-15',
};

// Mock notifications with timestamps for grouping
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    title: 'Safety Audit Due',
    message: 'Warehouse B audit scheduled for today at 2:00 PM',
    time: '10 min ago',
    timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    type: 'warning',
    read: false,
    category: 'audit',
  },
  {
    id: 'notif-2',
    title: 'Incident Resolved',
    message: 'Chemical spill in Lab A has been resolved and documented',
    time: '1 hour ago',
    timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    type: 'success',
    read: false,
    category: 'safety',
  },
  {
    id: 'notif-3',
    title: 'Training Reminder',
    message: 'PPE training certification expires in 5 days',
    time: '2 hours ago',
    timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    type: 'info',
    read: true,
    category: 'training',
  },
  {
    id: 'notif-4',
    title: 'CAPA Overdue',
    message: 'Corrective action CA-2026-003 is overdue by 2 days',
    time: 'Yesterday',
    timestamp: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000).toISOString(),
    type: 'error',
    read: false,
    category: 'compliance',
  },
  {
    id: 'notif-5',
    title: 'New Regulation Update',
    message: 'OSHA 1910.134 has been updated with new requirements',
    time: 'Yesterday',
    timestamp: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000).toISOString(),
    type: 'info',
    read: true,
    category: 'compliance',
  },
  {
    id: 'notif-6',
    title: 'System Maintenance',
    message: 'Scheduled maintenance completed successfully',
    time: '3 days ago',
    timestamp: twoDaysAgo.toISOString(),
    type: 'info',
    read: true,
    category: 'system',
  },
  {
    id: 'notif-7',
    title: 'Sensor Alert',
    message: 'Gas sensor in Tank Farm exceeded warning threshold',
    time: '5 days ago',
    timestamp: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'warning',
    read: true,
    category: 'safety',
  },
  {
    id: 'notif-8',
    title: 'Audit Completed',
    message: 'Q4 compliance audit finished with 98% score',
    time: '1 week ago',
    timestamp: oneWeekAgo.toISOString(),
    type: 'success',
    read: true,
    category: 'audit',
  },
  {
    id: 'notif-9',
    title: 'Training Milestone',
    message: 'Team achieved 100% completion on Fire Safety training',
    time: '2 weeks ago',
    timestamp: twoWeeksAgo.toISOString(),
    type: 'success',
    read: true,
    category: 'training',
  },
];

// Storage keys
export const STORAGE_KEYS = {
  NOTIFICATION_SETTINGS: 'megsafe_notification_settings',
  USER_PROFILE: 'megsafe_user_profile',
  NOTIFICATIONS: 'megsafe_notifications',
};

// Helper functions
export const loadNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    return stored ? JSON.parse(stored) : DEFAULT_NOTIFICATION_SETTINGS;
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

export const saveNotificationSettings = (settings: NotificationSettings): void => {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
};

export const loadUserProfile = (): UserProfile => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return stored ? JSON.parse(stored) : DEFAULT_USER_PROFILE;
  } catch {
    return DEFAULT_USER_PROFILE;
  }
};

export const saveUserProfile = (profile: UserProfile): void => {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
};

export const loadNotifications = (): Notification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return stored ? JSON.parse(stored) : MOCK_NOTIFICATIONS;
  } catch {
    return MOCK_NOTIFICATIONS;
  }
};

export const saveNotifications = (notifications: Notification[]): void => {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

export const getUnreadCount = (notifications: Notification[]): number => {
  return notifications.filter(n => !n.read).length;
};

export const markAsRead = (notifications: Notification[], id: string): Notification[] => {
  return notifications.map(n => n.id === id ? { ...n, read: true } : n);
};

export const markAllAsRead = (notifications: Notification[]): Notification[] => {
  return notifications.map(n => ({ ...n, read: true }));
};

// Group notifications by date
export const groupNotificationsByDate = (notifications: Notification[]): NotificationGroup[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups: Record<NotificationGroupKey, Notification[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  notifications.forEach(notification => {
    const notifDate = notification.timestamp 
      ? new Date(notification.timestamp) 
      : parseRelativeTime(notification.time);
    
    if (notifDate >= today) {
      groups.today.push(notification);
    } else if (notifDate >= yesterday) {
      groups.yesterday.push(notification);
    } else if (notifDate >= oneWeekAgo) {
      groups.thisWeek.push(notification);
    } else {
      groups.earlier.push(notification);
    }
  });

  const groupLabels: Record<NotificationGroupKey, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    earlier: 'Earlier',
  };

  return (['today', 'yesterday', 'thisWeek', 'earlier'] as NotificationGroupKey[])
    .filter(key => groups[key].length > 0)
    .map(key => ({
      key,
      label: groupLabels[key],
      notifications: groups[key],
    }));
};

// Parse relative time strings for fallback
const parseRelativeTime = (time: string): Date => {
  const now = new Date();
  const lowerTime = time.toLowerCase();
  
  if (lowerTime.includes('min')) {
    const mins = parseInt(lowerTime) || 10;
    return new Date(now.getTime() - mins * 60 * 1000);
  }
  if (lowerTime.includes('hour')) {
    const hours = parseInt(lowerTime) || 1;
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }
  if (lowerTime === 'yesterday') {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  if (lowerTime.includes('day')) {
    const days = parseInt(lowerTime) || 1;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
  if (lowerTime.includes('week')) {
    const weeks = parseInt(lowerTime) || 1;
    return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
  }
  return now;
};

// Notification sound effect using Web Audio API
export const playNotificationSound = (forcePlay?: boolean, soundType?: NotificationSoundType): void => {
  const settings = loadNotificationSettings();
  if (!forcePlay && !settings.soundEnabled) return;
  
  const currentSoundType = soundType ?? settings.soundType;
  const soundDef = NOTIFICATION_SOUNDS.find(s => s.id === currentSoundType);
  
  if (!soundDef || !soundDef.frequencies) return;

  try {
    // Create a simple notification sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Create oscillator for the tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure the sound based on selected type
    oscillator.frequency.setValueAtTime(soundDef.frequencies[0], audioContext.currentTime);
    oscillator.frequency.setValueAtTime(soundDef.frequencies[1], audioContext.currentTime + 0.1);
    oscillator.type = soundDef.waveform || 'sine';
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.11);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log('Audio playback not supported:', error);
  }
};

// Get badge animation duration based on speed setting
export const getBadgeAnimationDuration = (): number => {
  const settings = loadNotificationSettings();
  // Base duration is 1.5s, speed multiplier inversely affects duration
  return 1.5 / settings.badgeAnimationSpeed;
};
