/**
 * Real-Time Notification Service
 * Provides live push notifications with WebSocket-like behavior
 * Supports toast notifications, badges, sound alerts, and notification center
 */

export interface RealTimeNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timestamp: Date;
  read: boolean;
  dismissed: boolean;
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export type NotificationType = 
  | 'incident_reported'
  | 'incident_updated'
  | 'permit_pending'
  | 'permit_approved'
  | 'permit_rejected'
  | 'jsa_submitted'
  | 'jsa_approved'
  | 'jsa_rejected'
  | 'capa_assigned'
  | 'capa_due'
  | 'capa_overdue'
  | 'training_reminder'
  | 'training_completed'
  | 'inspection_due'
  | 'inspection_overdue'
  | 'observation_reported'
  | 'near_miss'
  | 'safety_alert'
  | 'emergency'
  | 'system'
  | 'mention'
  | 'approval_needed'
  | 'task_assigned';

export interface NotificationListener {
  id: string;
  callback: (notification: RealTimeNotification) => void;
  types?: NotificationType[];
}

export interface NotificationSound {
  enabled: boolean;
  volume: number;
  type: 'default' | 'subtle' | 'urgent' | 'none';
}

export interface NotificationBadge {
  count: number;
  hasUrgent: boolean;
  categories: Record<NotificationType, number>;
}

// Simulated real-time events for demo
const SIMULATED_EVENTS: Array<Omit<RealTimeNotification, 'id' | 'timestamp' | 'read' | 'dismissed'>> = [
  {
    type: 'incident_reported',
    title: 'New Incident Reported',
    message: 'A near-miss incident was reported at Production Floor B involving forklift operations.',
    priority: 'high',
    actionUrl: '/report-incident',
    actionLabel: 'View Incident',
    sender: { id: 'U-123', name: 'Mike Johnson', role: 'Operator' }
  },
  {
    type: 'permit_pending',
    title: 'Permit Awaiting Approval',
    message: 'Hot Work Permit #HWP-2026-089 requires your approval for Welding Bay 3.',
    priority: 'high',
    actionUrl: '/contractor-permits',
    actionLabel: 'Review Permit',
    sender: { id: 'U-456', name: 'Sarah Chen', role: 'Contractor' }
  },
  {
    type: 'jsa_submitted',
    title: 'JSA Submitted for Review',
    message: 'Job Safety Analysis for "Scaffold Installation" has been submitted by your team.',
    priority: 'normal',
    actionUrl: '/risk-assessment',
    actionLabel: 'Review JSA',
    sender: { id: 'U-789', name: 'Tom Wilson', role: 'Technician' }
  },
  {
    type: 'capa_due',
    title: 'CAPA Due Tomorrow',
    message: 'Corrective action "Install additional guardrails" is due in 24 hours.',
    priority: 'high',
    actionUrl: '/root-cause',
    actionLabel: 'View CAPA'
  },
  {
    type: 'training_reminder',
    title: 'Training Reminder',
    message: 'Your "Confined Space Entry" certification expires in 7 days. Complete refresher training.',
    priority: 'normal',
    actionUrl: '/training',
    actionLabel: 'View Training'
  },
  {
    type: 'observation_reported',
    title: 'Safety Observation',
    message: 'A positive safety observation was reported: "Proper lockout/tagout procedure followed".',
    priority: 'low',
    sender: { id: 'U-321', name: 'Lisa Park', role: 'Safety Lead' }
  },
  {
    type: 'inspection_due',
    title: 'Inspection Due',
    message: 'Monthly fire extinguisher inspection is due for Building A.',
    priority: 'normal',
    actionUrl: '/inspection-scheduling',
    actionLabel: 'Start Inspection'
  },
  {
    type: 'approval_needed',
    title: 'Approval Required',
    message: '3 items require your approval: 2 permits and 1 JSA.',
    priority: 'high',
    actionUrl: '/supervisor-approvals',
    actionLabel: 'View All'
  }
];

class RealTimeNotificationService {
  private notifications: RealTimeNotification[] = [];
  private listeners: NotificationListener[] = [];
  private isConnected: boolean = false;
  private simulationInterval: NodeJS.Timeout | null = null;
  private soundSettings: NotificationSound = {
    enabled: true,
    volume: 0.5,
    type: 'default'
  };

  constructor() {
    this.loadFromStorage();
  }

  // Load notifications from localStorage
  private loadFromStorage(): void {
    const stored = localStorage.getItem('realTimeNotifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined
        }));
      } catch (e) {
        this.notifications = [];
      }
    }
  }

  // Save to localStorage
  private saveToStorage(): void {
    localStorage.setItem('realTimeNotifications', JSON.stringify(this.notifications));
  }

  // Connect to real-time service (simulated)
  connect(): void {
    if (this.isConnected) return;
    this.isConnected = true;
    console.log('[RealTimeNotification] Connected to notification service');
    
    // Start simulation for demo
    this.startSimulation();
  }

  // Disconnect
  disconnect(): void {
    this.isConnected = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    console.log('[RealTimeNotification] Disconnected from notification service');
  }

  // Start simulated notifications (for demo)
  private startSimulation(): void {
    // Send initial notification after 5 seconds
    setTimeout(() => {
      if (this.isConnected) {
        this.simulateNotification();
      }
    }, 5000);

    // Then every 30-60 seconds
    this.simulationInterval = setInterval(() => {
      if (this.isConnected && Math.random() > 0.3) {
        this.simulateNotification();
      }
    }, 30000 + Math.random() * 30000);
  }

  // Simulate a random notification
  private simulateNotification(): void {
    const template = SIMULATED_EVENTS[Math.floor(Math.random() * SIMULATED_EVENTS.length)];
    this.pushNotification({
      ...template,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      dismissed: false
    });
  }

  // Push a new notification
  pushNotification(notification: RealTimeNotification): void {
    this.notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
    
    this.saveToStorage();
    
    // Notify all listeners
    this.notifyListeners(notification);
    
    // Play sound if enabled
    this.playSound(notification.priority);
    
    // Show browser notification if permitted
    this.showBrowserNotification(notification);
  }

  // Add a listener
  addListener(callback: (notification: RealTimeNotification) => void, types?: NotificationType[]): string {
    const id = `listener-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.listeners.push({ id, callback, types });
    return id;
  }

  // Remove a listener
  removeListener(id: string): void {
    this.listeners = this.listeners.filter(l => l.id !== id);
  }

  // Notify listeners
  private notifyListeners(notification: RealTimeNotification): void {
    this.listeners.forEach(listener => {
      if (!listener.types || listener.types.includes(notification.type)) {
        try {
          listener.callback(notification);
        } catch (e) {
          console.error('[RealTimeNotification] Listener error:', e);
        }
      }
    });
  }

  // Play notification sound
  private playSound(priority: RealTimeNotification['priority']): void {
    if (!this.soundSettings.enabled || this.soundSettings.type === 'none') return;
    
    // Use Web Audio API for notification sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different tones for different priorities
      const frequencies = {
        low: 400,
        normal: 600,
        high: 800,
        critical: 1000
      };
      
      oscillator.frequency.value = frequencies[priority];
      oscillator.type = 'sine';
      
      gainNode.gain.value = this.soundSettings.volume * 0.1;
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // Audio not supported or blocked
    }
  }

  // Show browser notification
  private async showBrowserNotification(notification: RealTimeNotification): Promise<void> {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical'
      });
    }
  }

  // Get all notifications
  getNotifications(filter?: { unreadOnly?: boolean; types?: NotificationType[] }): RealTimeNotification[] {
    let result = [...this.notifications];
    
    if (filter?.unreadOnly) {
      result = result.filter(n => !n.read);
    }
    
    if (filter?.types && filter.types.length > 0) {
      result = result.filter(n => filter.types!.includes(n.type));
    }
    
    return result;
  }

  // Get notification badge info
  getBadge(): NotificationBadge {
    const unread = this.notifications.filter(n => !n.read && !n.dismissed);
    const categories: Record<NotificationType, number> = {} as any;
    
    unread.forEach(n => {
      categories[n.type] = (categories[n.type] || 0) + 1;
    });
    
    return {
      count: unread.length,
      hasUrgent: unread.some(n => n.priority === 'critical' || n.priority === 'high'),
      categories
    };
  }

  // Mark notification as read
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
    }
  }

  // Mark all as read
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveToStorage();
  }

  // Dismiss notification
  dismiss(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.dismissed = true;
      this.saveToStorage();
    }
  }

  // Clear all notifications
  clearAll(): void {
    this.notifications = [];
    this.saveToStorage();
  }

  // Update sound settings
  setSoundSettings(settings: Partial<NotificationSound>): void {
    this.soundSettings = { ...this.soundSettings, ...settings };
    localStorage.setItem('notificationSoundSettings', JSON.stringify(this.soundSettings));
  }

  // Get sound settings
  getSoundSettings(): NotificationSound {
    return { ...this.soundSettings };
  }

  // Request browser notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    
    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    
    return Notification.permission;
  }

  // Check connection status
  isServiceConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const realTimeNotificationService = new RealTimeNotificationService();

// React hook for real-time notifications
export function useRealTimeNotifications(types?: NotificationType[]) {
  const [notifications, setNotifications] = React.useState<RealTimeNotification[]>([]);
  const [badge, setBadge] = React.useState<NotificationBadge>({ count: 0, hasUrgent: false, categories: {} as any });
  const [latestNotification, setLatestNotification] = React.useState<RealTimeNotification | null>(null);

  React.useEffect(() => {
    // Load initial notifications
    setNotifications(realTimeNotificationService.getNotifications({ types }));
    setBadge(realTimeNotificationService.getBadge());

    // Connect to service
    realTimeNotificationService.connect();

    // Add listener for new notifications
    const listenerId = realTimeNotificationService.addListener((notification) => {
      setNotifications(realTimeNotificationService.getNotifications({ types }));
      setBadge(realTimeNotificationService.getBadge());
      setLatestNotification(notification);
      
      // Clear latest after 5 seconds
      setTimeout(() => setLatestNotification(null), 5000);
    }, types);

    return () => {
      realTimeNotificationService.removeListener(listenerId);
    };
  }, []);

  const markAsRead = (id: string) => {
    realTimeNotificationService.markAsRead(id);
    setNotifications(realTimeNotificationService.getNotifications({ types }));
    setBadge(realTimeNotificationService.getBadge());
  };

  const markAllAsRead = () => {
    realTimeNotificationService.markAllAsRead();
    setNotifications(realTimeNotificationService.getNotifications({ types }));
    setBadge(realTimeNotificationService.getBadge());
  };

  const dismiss = (id: string) => {
    realTimeNotificationService.dismiss(id);
    setNotifications(realTimeNotificationService.getNotifications({ types }));
    setBadge(realTimeNotificationService.getBadge());
  };

  return {
    notifications,
    badge,
    latestNotification,
    markAsRead,
    markAllAsRead,
    dismiss,
    isConnected: realTimeNotificationService.isServiceConnected()
  };
}

// Need to import React for the hook
import React from 'react';

export default realTimeNotificationService;
