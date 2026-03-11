// Push Notification Service for Mobile Workers
// Handles web push notifications, in-app notifications, and notification preferences

export interface PushNotification {
  id: string;
  type: 'safety_alert' | 'task_assigned' | 'task_reminder' | 'incident_update' | 'permit_status' | 'training_due' | 'system' | 'emergency';
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, unknown>;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requiresAction?: boolean;
  actionUrl?: string;
  actions?: NotificationAction[];
  read: boolean;
  dismissed: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  categories: {
    safety_alert: boolean;
    task_assigned: boolean;
    task_reminder: boolean;
    incident_update: boolean;
    permit_status: boolean;
    training_due: boolean;
    system: boolean;
    emergency: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
  };
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
}

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  deviceId: string;
  createdAt: Date;
  lastActive: Date;
}

// Default notification preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  sound: true,
  vibration: true,
  categories: {
    safety_alert: true,
    task_assigned: true,
    task_reminder: true,
    incident_update: true,
    permit_status: true,
    training_due: true,
    system: true,
    emergency: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
  },
  channels: {
    push: true,
    email: true,
    sms: false,
    inApp: true,
  },
};

// In-memory notification store (would be IndexedDB in production)
let notifications: PushNotification[] = [];
let preferences: NotificationPreferences = { ...DEFAULT_PREFERENCES };

// Check if browser supports push notifications
export const isPushSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

// Get current permission status
export const getPermissionStatus = (): NotificationPermission => {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
};

// Request notification permission
export const requestPermission = async (): Promise<NotificationPermission> => {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

// Subscribe to push notifications
export const subscribeToPush = async (): Promise<NotificationSubscription | null> => {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // VAPID public key would come from environment in production
    const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const subscriptionJson = subscription.toJSON();
    
    return {
      endpoint: subscriptionJson.endpoint || '',
      keys: {
        p256dh: subscriptionJson.keys?.p256dh || '',
        auth: subscriptionJson.keys?.auth || '',
      },
      userId: 'current-user', // Would come from auth context
      deviceId: generateDeviceId(),
      createdAt: new Date(),
      lastActive: new Date(),
    };
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return null;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return await subscription.unsubscribe();
    }
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
};

// Show a notification (local, not from push)
export const showNotification = async (notification: Omit<PushNotification, 'id' | 'timestamp' | 'read' | 'dismissed'>): Promise<PushNotification | null> => {
  const newNotification: PushNotification = {
    ...notification,
    id: generateNotificationId(),
    timestamp: new Date(),
    read: false,
    dismissed: false,
  };

  // Add to local store
  notifications.unshift(newNotification);

  // Check preferences
  if (!shouldShowNotification(newNotification)) {
    return newNotification;
  }

  // Show browser notification if permission granted and push enabled
  if (Notification.permission === 'granted' && preferences.channels.push) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/logo.png',
        badge: notification.badge || '/logo.png',
        image: notification.image,
        tag: notification.tag || newNotification.id,
        data: {
          ...notification.data,
          notificationId: newNotification.id,
          url: notification.actionUrl,
        },
        actions: notification.actions,
        requireInteraction: notification.requiresAction || notification.priority === 'urgent',
        silent: !preferences.sound,
        vibrate: preferences.vibration ? [200, 100, 200] : undefined,
      });

      // Haptic feedback for mobile
      if (preferences.vibration && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  return newNotification;
};

// Check if notification should be shown based on preferences
const shouldShowNotification = (notification: PushNotification): boolean => {
  if (!preferences.enabled) return false;
  
  // Emergency notifications always go through
  if (notification.type === 'emergency') return true;
  
  // Check category preference
  if (!preferences.categories[notification.type]) return false;
  
  // Check quiet hours
  if (preferences.quietHours.enabled) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { start, end } = preferences.quietHours;
    
    // Handle overnight quiet hours
    if (start > end) {
      if (currentTime >= start || currentTime < end) {
        return notification.priority === 'urgent';
      }
    } else {
      if (currentTime >= start && currentTime < end) {
        return notification.priority === 'urgent';
      }
    }
  }
  
  return true;
};

// Get all notifications
export const getNotifications = (): PushNotification[] => {
  return [...notifications];
};

// Get unread notification count
export const getUnreadCount = (): number => {
  return notifications.filter(n => !n.read && !n.dismissed).length;
};

// Mark notification as read
export const markAsRead = (notificationId: string): void => {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
  }
};

// Mark all notifications as read
export const markAllAsRead = (): void => {
  notifications.forEach(n => { n.read = true; });
};

// Dismiss notification
export const dismissNotification = (notificationId: string): void => {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.dismissed = true;
  }
};

// Clear all notifications
export const clearAllNotifications = (): void => {
  notifications = [];
};

// Get notification preferences
export const getPreferences = (): NotificationPreferences => {
  return { ...preferences };
};

// Update notification preferences
export const updatePreferences = (updates: Partial<NotificationPreferences>): NotificationPreferences => {
  preferences = {
    ...preferences,
    ...updates,
    categories: {
      ...preferences.categories,
      ...(updates.categories || {}),
    },
    quietHours: {
      ...preferences.quietHours,
      ...(updates.quietHours || {}),
    },
    channels: {
      ...preferences.channels,
      ...(updates.channels || {}),
    },
  };
  
  // Persist to localStorage
  try {
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
  
  return { ...preferences };
};

// Load preferences from localStorage
export const loadPreferences = (): NotificationPreferences => {
  try {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
  return { ...preferences };
};

// Helper: Convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper: Generate device ID
function generateDeviceId(): string {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

// Helper: Generate notification ID
function generateNotificationId(): string {
  return 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

// Pre-built notification templates for common EHS scenarios
export const NotificationTemplates = {
  taskAssigned: (taskName: string, assignedBy: string) => ({
    type: 'task_assigned' as const,
    title: 'New Task Assigned',
    body: `${assignedBy} assigned you: ${taskName}`,
    priority: 'normal' as const,
    icon: '/icons/task.png',
    actions: [
      { action: 'view', title: 'View Task' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }),

  safetyAlert: (message: string, location: string) => ({
    type: 'safety_alert' as const,
    title: '⚠️ Safety Alert',
    body: `${location}: ${message}`,
    priority: 'high' as const,
    icon: '/icons/warning.png',
    requiresAction: true,
    actions: [
      { action: 'acknowledge', title: 'Acknowledge' },
      { action: 'report', title: 'Report Issue' },
    ],
  }),

  emergency: (message: string) => ({
    type: 'emergency' as const,
    title: '🚨 EMERGENCY ALERT',
    body: message,
    priority: 'urgent' as const,
    icon: '/icons/emergency.png',
    requiresAction: true,
    actions: [
      { action: 'acknowledge', title: 'I\'m Safe' },
      { action: 'help', title: 'Need Help' },
    ],
  }),

  permitStatus: (permitId: string, status: string) => ({
    type: 'permit_status' as const,
    title: 'Permit Status Update',
    body: `Permit ${permitId} is now ${status}`,
    priority: 'normal' as const,
    icon: '/icons/permit.png',
    actions: [
      { action: 'view', title: 'View Permit' },
    ],
  }),

  trainingDue: (courseName: string, daysUntilDue: number) => ({
    type: 'training_due' as const,
    title: 'Training Reminder',
    body: `${courseName} is due in ${daysUntilDue} days`,
    priority: daysUntilDue <= 3 ? 'high' as const : 'normal' as const,
    icon: '/icons/training.png',
    actions: [
      { action: 'start', title: 'Start Now' },
      { action: 'remind', title: 'Remind Later' },
    ],
  }),

  incidentUpdate: (incidentId: string, update: string) => ({
    type: 'incident_update' as const,
    title: 'Incident Update',
    body: `${incidentId}: ${update}`,
    priority: 'normal' as const,
    icon: '/icons/incident.png',
    actions: [
      { action: 'view', title: 'View Details' },
    ],
  }),
};

// Export types
export type { NotificationPermission };
