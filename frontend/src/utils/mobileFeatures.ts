/**
 * Mobile device features for WebView and web environments
 *
 * This module provides a unified API for accessing mobile device features
 * with native-first, web-fallback strategy for optimal compatibility.
 */

/**
 * Detects if running inside a React Native WebView environment
 *
 * @returns {boolean} True if inside WebView, false if regular web browser
 *
 * Use cases:
 * - Feature detection before calling native APIs
 * - Conditional UI rendering for WebView vs web
 * - Analytics tracking for different environments
 *
 * @example
 * if (isInWebView()) {
 *   // Use native features
 *   await callNative('hapticFeedback', { type: 'medium' });
 * } else {
 *   // Use web fallbacks
 *   console.log('Running in regular browser');
 * }
 */
export const isInWebView = () => !!(window as any).inAppWebview;

/**
 * Calls native React Native methods from WebView
 *
 * @param {string} type - The native method name to call
 * @param {any} [data] - Optional data to pass to native method
 * @returns {Promise<any>} Promise that resolves with native response
 *
 * Use cases:
 * - Requesting device permissions (camera, motion, etc.)
 * - Accessing native-only features (haptic feedback, advanced vibration)
 * - Getting device information not available in web APIs
 * - Triggering native UI components (alerts, pickers, etc.)
 *
 * @example
 * // Request native haptic feedback
 * await callNative('hapticFeedback', { type: 'heavy' });
 *
 * // Get device info
 * const deviceInfo = await callNative('getDeviceInfo');
 *
 * // Request camera permission without user prompt
 * const result = await callNative('requestCameraPermission');
 */
export const callNative = (type: string, data?: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!isInWebView()) {
      reject(new Error("Not in WebView"));
      return;
    }

    const requestId = `${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Store callback for async response handling
    (window as any)._nativeCallbacks = (window as any)._nativeCallbacks || {};
    (window as any)._nativeCallbacks[requestId] = { resolve, reject };

    // Send message to React Native bridge
    (window as any).inAppWebview.postMessage(
      JSON.stringify({ type, data, requestId })
    );

    // Timeout after 3 seconds to prevent hanging promises
    setTimeout(() => {
      if ((window as any)._nativeCallbacks[requestId]) {
        delete (window as any)._nativeCallbacks[requestId];
        reject(new Error("Native call timeout"));
      }
    }, 3000);
  });
};

/**
 * Handles responses from native React Native code
 * This is automatically called by the WebView bridge - do not call directly
 *
 * @internal
 */
if (typeof window !== "undefined") {
  (window as any).handleNativeResponse = (response: {
    requestId: string;
    success: boolean;
    data?: any;
    error?: string;
  }) => {
    const callback = (window as any)._nativeCallbacks?.[response.requestId];
    if (callback) {
      if (response.success) {
        callback.resolve(response.data);
      } else {
        callback.reject(new Error(response.error || "Native call failed"));
      }
      delete (window as any)._nativeCallbacks[response.requestId];
    }
  };
}

// ============================================================================
// MOBILE PUSH NOTIFICATION SYSTEM
// ============================================================================

/**
 * Push notification configuration types
 */
export interface PushNotificationConfig {
  enabled: boolean;
  categories: {
    incidents: boolean;
    nearMisses: boolean;
    compliance: boolean;
    training: boolean;
    permits: boolean;
    audits: boolean;
    emergencies: boolean;
    toolboxTalks: boolean;
  };
  preferences: {
    sound: boolean;
    vibration: boolean;
    badge: boolean;
    quietHours: {
      enabled: boolean;
      start: string; // HH:MM format
      end: string;
    };
  };
}

export interface PushNotificationPayload {
  id: string;
  title: string;
  body: string;
  category: keyof PushNotificationConfig['categories'];
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  data?: Record<string, any>;
  actions?: {
    id: string;
    title: string;
    route?: string;
  }[];
}

/**
 * Default notification configuration
 */
export const defaultNotificationConfig: PushNotificationConfig = {
  enabled: true,
  categories: {
    incidents: true,
    nearMisses: true,
    compliance: true,
    training: true,
    permits: true,
    audits: true,
    emergencies: true,
    toolboxTalks: true,
  },
  preferences: {
    sound: true,
    vibration: true,
    badge: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
    },
  },
};

/**
 * Mobile Push Notification Manager
 * Handles push notifications for mobile devices with web fallback
 */
export class MobilePushNotificationManager {
  private config: PushNotificationConfig;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private notificationQueue: PushNotificationPayload[] = [];

  constructor(config?: Partial<PushNotificationConfig>) {
    this.config = { ...defaultNotificationConfig, ...config };
    this.init();
  }

  /**
   * Initialize the notification manager
   */
  private async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Register service worker for web push
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
      } catch (error) {
        console.warn('Service worker not available:', error);
      }
    }

    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('pushNotificationConfig');
    if (savedConfig) {
      try {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      } catch (e) {
        console.warn('Failed to parse saved notification config');
      }
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    // For native WebView, use native permission request
    if (isInWebView()) {
      try {
        const result = await callNative('requestNotificationPermission');
        return result.granted ? 'granted' : 'denied';
      } catch (error) {
        console.warn('Native notification permission failed, falling back to web');
      }
    }

    // Web fallback
    return Notification.requestPermission();
  }

  /**
   * Check if we're in quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.config.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = this.config.preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.config.preferences.quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Send a push notification
   */
  async sendNotification(payload: PushNotificationPayload): Promise<boolean> {
    // Check if notifications are enabled globally
    if (!this.config.enabled) {
      console.log('Notifications are disabled');
      return false;
    }

    // Check if this category is enabled
    if (!this.config.categories[payload.category]) {
      console.log(`Notifications for ${payload.category} are disabled`);
      return false;
    }

    // Check quiet hours (except for critical/emergency)
    if (this.isQuietHours() && payload.priority !== 'critical' && payload.category !== 'emergencies') {
      // Queue the notification for later
      this.notificationQueue.push(payload);
      console.log('Notification queued (quiet hours)');
      return false;
    }

    // For native WebView
    if (isInWebView()) {
      try {
        await callNative('sendPushNotification', {
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sound: this.config.preferences.sound,
          vibration: this.config.preferences.vibration,
          badge: this.config.preferences.badge,
          priority: payload.priority,
        });
        return true;
      } catch (error) {
        console.warn('Native notification failed, falling back to web');
      }
    }

    // Web notification fallback
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: '/icons/safety-icon-192.png',
        badge: '/icons/safety-badge-72.png',
        tag: payload.id,
        data: payload.data,
        vibrate: this.config.preferences.vibration ? [200, 100, 200] : undefined,
        silent: !this.config.preferences.sound,
        requireInteraction: payload.priority === 'critical' || payload.priority === 'high',
      });

      notification.onclick = () => {
        window.focus();
        if (payload.actions?.[0]?.route) {
          window.location.href = payload.actions[0].route;
        }
        notification.close();
      };

      return true;
    }

    return false;
  }

  /**
   * Send safety-specific notifications
   */
  async sendSafetyAlert(
    type: 'incident' | 'nearMiss' | 'emergency' | 'compliance' | 'training' | 'toolboxTalk',
    details: {
      id: string;
      title: string;
      message: string;
      location?: string;
      severity?: string;
      route?: string;
    }
  ): Promise<boolean> {
    const categoryMap: Record<string, keyof PushNotificationConfig['categories']> = {
      incident: 'incidents',
      nearMiss: 'nearMisses',
      emergency: 'emergencies',
      compliance: 'compliance',
      training: 'training',
      toolboxTalk: 'toolboxTalks',
    };

    const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      incident: 'high',
      nearMiss: 'medium',
      emergency: 'critical',
      compliance: 'medium',
      training: 'low',
      toolboxTalk: 'low',
    };

    const payload: PushNotificationPayload = {
      id: details.id,
      title: details.title,
      body: details.message,
      category: categoryMap[type],
      priority: priorityMap[type],
      timestamp: new Date(),
      data: {
        type,
        location: details.location,
        severity: details.severity,
      },
      actions: details.route
        ? [{ id: 'view', title: 'View Details', route: details.route }]
        : undefined,
    };

    return this.sendNotification(payload);
  }

  /**
   * Process queued notifications (call when quiet hours end)
   */
  async processQueue(): Promise<void> {
    if (this.isQuietHours()) return;

    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      if (notification) {
        await this.sendNotification(notification);
        // Small delay between notifications
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  /**
   * Update notification configuration
   */
  updateConfig(newConfig: Partial<PushNotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('pushNotificationConfig', JSON.stringify(this.config));
  }

  /**
   * Get current configuration
   */
  getConfig(): PushNotificationConfig {
    return { ...this.config };
  }

  /**
   * Schedule a notification for later
   */
  async scheduleNotification(
    payload: PushNotificationPayload,
    scheduleTime: Date
  ): Promise<string> {
    const delay = scheduleTime.getTime() - Date.now();

    if (delay <= 0) {
      await this.sendNotification(payload);
      return payload.id;
    }

    // Use native scheduling if available
    if (isInWebView()) {
      try {
        await callNative('scheduleNotification', {
          ...payload,
          scheduleTime: scheduleTime.toISOString(),
        });
        return payload.id;
      } catch (error) {
        console.warn('Native scheduling failed, using web timeout');
      }
    }

    // Web fallback with setTimeout
    setTimeout(() => {
      this.sendNotification(payload);
    }, delay);

    return payload.id;
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(notificationId: string): Promise<boolean> {
    if (isInWebView()) {
      try {
        await callNative('cancelNotification', { id: notificationId });
        return true;
      } catch (error) {
        console.warn('Failed to cancel native notification');
      }
    }

    // Remove from queue if present
    this.notificationQueue = this.notificationQueue.filter(n => n.id !== notificationId);
    return true;
  }

  /**
   * Subscribe to push notifications (for web push via VAPID)
   */
  async subscribeToPush(vapidPublicKey?: string): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      console.warn('Service worker not available');
      return null;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey ? this.urlBase64ToUint8Array(vapidPublicKey) : undefined,
      });

      console.log('Push subscription:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  /**
   * Helper to convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Singleton instance for easy access
export const mobilePushNotifications = new MobilePushNotificationManager();

// ============================================================================
// DEVICE FEATURE UTILITIES
// ============================================================================

/**
 * Check if device supports vibration
 */
export const supportsVibration = (): boolean => {
  return 'vibrate' in navigator;
};

/**
 * Trigger device vibration pattern
 */
export const vibrate = (pattern: number | number[]): boolean => {
  if (!supportsVibration()) return false;

  if (isInWebView()) {
    callNative('vibrate', { pattern }).catch(() => {
      // Fallback to web vibration
      navigator.vibrate(pattern);
    });
    return true;
  }

  return navigator.vibrate(pattern);
};

/**
 * Safety-specific vibration patterns
 */
export const safetyVibrationPatterns = {
  success: [100, 50, 100],
  warning: [200, 100, 200, 100, 200],
  error: [300, 100, 300, 100, 300, 100, 300],
  emergency: [500, 250, 500, 250, 500, 250, 500, 250, 500],
  notification: [150, 75, 150],
};

/**
 * Trigger haptic feedback (native-first, web fallback)
 */
export const hapticFeedback = async (
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium'
): Promise<void> => {
  if (isInWebView()) {
    try {
      await callNative('hapticFeedback', { type });
      return;
    } catch (error) {
      // Fall through to web vibration
    }
  }

  // Web fallback with vibration
  const patterns: Record<string, number[]> = {
    light: [10],
    medium: [25],
    heavy: [50],
    success: [10, 50, 10],
    warning: [25, 50, 25],
    error: [50, 50, 50],
  };

  vibrate(patterns[type] || [25]);
};

/**
 * Request camera access (for incident photos)
 */
export const requestCameraAccess = async (): Promise<MediaStream | null> => {
  if (isInWebView()) {
    try {
      const result = await callNative('requestCameraPermission');
      if (!result.granted) return null;
    } catch (error) {
      console.warn('Native camera permission failed, trying web');
    }
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
  } catch (error) {
    console.error('Camera access failed:', error);
    return null;
  }
};

/**
 * Get device location (for incident reporting)
 */
export const getDeviceLocation = async (): Promise<GeolocationPosition | null> => {
  if (isInWebView()) {
    try {
      const location = await callNative('getLocation');
      return {
        coords: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy || 0,
          altitude: location.altitude || null,
          altitudeAccuracy: location.altitudeAccuracy || null,
          heading: location.heading || null,
          speed: location.speed || null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition;
    } catch (error) {
      console.warn('Native location failed, trying web');
    }
  }

  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        console.error('Location error:', error);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};

/**
 * Check if device is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Get device info
 */
export const getDeviceInfo = async (): Promise<{
  platform: string;
  userAgent: string;
  isWebView: boolean;
  isMobile: boolean;
  isStandalone: boolean;
  supportsNotifications: boolean;
  supportsVibration: boolean;
  supportsCamera: boolean;
  supportsLocation: boolean;
}> => {
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  return {
    platform: navigator.platform,
    userAgent: ua,
    isWebView: isInWebView(),
    isMobile,
    isStandalone,
    supportsNotifications: 'Notification' in window,
    supportsVibration: supportsVibration(),
    supportsCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    supportsLocation: 'geolocation' in navigator,
  };
};
