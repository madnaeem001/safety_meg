/**
 * Real-Time Data Sync Service
 * Provides WebSocket-like real-time synchronization with polling fallback
 */

import { SyncableRecord, STORES, StoreName, getDB } from './offline/offlineSync';

// Sync event types
export type SyncEventType = 
  | 'data_updated' 
  | 'data_created' 
  | 'data_deleted' 
  | 'sync_started' 
  | 'sync_completed' 
  | 'sync_error'
  | 'connection_changed';

export interface SyncEvent {
  type: SyncEventType;
  store?: StoreName;
  recordId?: string;
  data?: any;
  timestamp: Date;
  source: 'local' | 'remote';
}

export type SyncEventHandler = (event: SyncEvent) => void;

// Connection status
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'offline';

// Sync configuration
export interface SyncConfig {
  pollingInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number;
  enableAutoSync: boolean;
  syncOnReconnect: boolean;
  conflictResolution: 'client-wins' | 'server-wins' | 'last-write-wins';
}

const DEFAULT_CONFIG: SyncConfig = {
  pollingInterval: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 5000,
  enableAutoSync: true,
  syncOnReconnect: true,
  conflictResolution: 'last-write-wins'
};

// Real-time sync service class
class RealTimeSyncService {
  private config: SyncConfig;
  private eventHandlers: Map<SyncEventType, Set<SyncEventHandler>>;
  private connectionStatus: ConnectionStatus;
  private pollingTimer: ReturnType<typeof setInterval> | null;
  private lastSyncTime: Date | null;
  private pendingChanges: Map<string, SyncEvent>;
  private isOnline: boolean;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.eventHandlers = new Map();
    this.connectionStatus = 'disconnected';
    this.pollingTimer = null;
    this.lastSyncTime = null;
    this.pendingChanges = new Map();
    this.isOnline = navigator.onLine;

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  // Subscribe to sync events
  on(eventType: SyncEventType, handler: SyncEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }

  // Emit sync event
  private emit(event: SyncEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Sync event handler error:', error);
        }
      });
    }
  }

  // Handle online event
  private handleOnline(): void {
    this.isOnline = true;
    this.emit({
      type: 'connection_changed',
      timestamp: new Date(),
      source: 'local',
      data: { online: true }
    });

    if (this.config.syncOnReconnect) {
      this.syncAll();
    }
  }

  // Handle offline event
  private handleOffline(): void {
    this.isOnline = false;
    this.connectionStatus = 'offline';
    this.emit({
      type: 'connection_changed',
      timestamp: new Date(),
      source: 'local',
      data: { online: false }
    });
  }

  // Start real-time sync
  start(): void {
    if (this.pollingTimer) return;

    this.connectionStatus = 'connecting';
    
    // Initial sync
    this.syncAll().then(() => {
      this.connectionStatus = 'connected';
    });

    // Start polling
    if (this.config.enableAutoSync) {
      this.pollingTimer = setInterval(() => {
        if (this.isOnline) {
          this.pollForUpdates();
        }
      }, this.config.pollingInterval);
    }

    this.emit({
      type: 'sync_started',
      timestamp: new Date(),
      source: 'local'
    });
  }

  // Stop real-time sync
  stop(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.connectionStatus = 'disconnected';
  }

  // Poll for updates (simulated)
  private async pollForUpdates(): Promise<void> {
    // Simulate checking for remote updates
    const hasUpdates = Math.random() > 0.8; // 20% chance of updates

    if (hasUpdates) {
      const mockUpdate: SyncEvent = {
        type: 'data_updated',
        store: STORES.INCIDENTS,
        recordId: `INC-${Date.now()}`,
        data: {
          id: `INC-${Date.now()}`,
          type: 'Near Miss',
          status: 'Updated',
          updatedAt: new Date().toISOString()
        },
        timestamp: new Date(),
        source: 'remote'
      };

      this.emit(mockUpdate);
    }
  }

  // Sync all data
  async syncAll(): Promise<{ success: boolean; synced: number; errors: number }> {
    if (!this.isOnline) {
      return { success: false, synced: 0, errors: 1 };
    }

    this.emit({
      type: 'sync_started',
      timestamp: new Date(),
      source: 'local'
    });

    let synced = 0;
    let errors = 0;

    try {
      const db = await getDB();
      
      // Sync each store
      for (const storeName of Object.values(STORES)) {
        if (storeName === 'syncQueue' || storeName === 'settings') continue;

        try {
          await this.syncStore(db, storeName);
          synced++;
        } catch (error) {
          console.error(`Error syncing ${storeName}:`, error);
          errors++;
        }
      }

      this.lastSyncTime = new Date();

      this.emit({
        type: 'sync_completed',
        timestamp: new Date(),
        source: 'local',
        data: { synced, errors }
      });

      return { success: errors === 0, synced, errors };
    } catch (error) {
      this.emit({
        type: 'sync_error',
        timestamp: new Date(),
        source: 'local',
        data: { error }
      });

      return { success: false, synced, errors: errors + 1 };
    }
  }

  // Sync specific store
  private async syncStore(db: IDBDatabase, storeName: StoreName): Promise<void> {
    // Simulated sync - in real app would send/receive from server
    return new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  // Push local changes
  async pushChanges(store: StoreName, data: SyncableRecord): Promise<boolean> {
    if (!this.isOnline) {
      // Queue for later
      this.pendingChanges.set(data.id, {
        type: 'data_updated',
        store,
        recordId: data.id,
        data,
        timestamp: new Date(),
        source: 'local'
      });
      return false;
    }

    try {
      // Simulate push to server
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.emit({
        type: 'data_updated',
        store,
        recordId: data.id,
        data,
        timestamp: new Date(),
        source: 'local'
      });

      return true;
    } catch (error) {
      console.error('Push changes error:', error);
      return false;
    }
  }

  // Get connection status
  getStatus(): { status: ConnectionStatus; lastSync: Date | null; pendingChanges: number } {
    return {
      status: this.connectionStatus,
      lastSync: this.lastSyncTime,
      pendingChanges: this.pendingChanges.size
    };
  }

  // Get sync config
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  // Update config
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart polling if interval changed
    if (this.pollingTimer && newConfig.pollingInterval) {
      this.stop();
      this.start();
    }
  }
}

// Singleton instance
export const realTimeSyncService = new RealTimeSyncService();

// React hook for real-time sync
export const useRealTimeSync = () => {
  return realTimeSyncService;
};

export default realTimeSyncService;
