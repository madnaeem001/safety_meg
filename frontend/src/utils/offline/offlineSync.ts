/**
 * Offline Data Sync System
 * Provides IndexedDB storage with sync queue and conflict resolution
 */

// Database configuration
const DB_NAME = 'safetyMEG_offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
  INCIDENTS: 'incidents',
  OBSERVATIONS: 'observations',
  JSA: 'jsa',
  INSPECTIONS: 'inspections',
  SYNC_QUEUE: 'syncQueue',
  SETTINGS: 'settings',
  AUDIT_LOG: 'auditLog',
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

// Sync status types
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'error';

// Base interface for syncable records
export interface SyncableRecord {
  id: string;
  localId?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  syncError?: string;
  version: number;
  deletedAt?: string;
}

// Sync queue item
export interface SyncQueueItem {
  id: string;
  store: StoreName;
  recordId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
  priority: 'high' | 'normal' | 'low';
}

// Conflict resolution strategy
export type ConflictStrategy = 'client-wins' | 'server-wins' | 'merge' | 'manual';

// Initialize IndexedDB
export const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          
          // Add indexes
          if (storeName !== STORES.SETTINGS) {
            store.createIndex('syncStatus', 'syncStatus', { unique: false });
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
          }
          
          if (storeName === STORES.SYNC_QUEUE) {
            store.createIndex('store', 'store', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('priority', 'priority', { unique: false });
          }
        }
      });
    };
  });
};

// Get database instance
let dbInstance: IDBDatabase | null = null;

export const getDB = async (): Promise<IDBDatabase> => {
  if (!dbInstance) {
    dbInstance = await initializeDB();
  }
  return dbInstance;
};

// Generic CRUD operations
export const saveRecord = async <T extends SyncableRecord>(
  storeName: StoreName,
  record: T,
  addToSyncQueue: boolean = true
): Promise<T> => {
  const db = await getDB();
  
  const updatedRecord: T = {
    ...record,
    localId: record.localId || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    updatedAt: new Date().toISOString(),
    syncStatus: 'pending' as SyncStatus,
    version: (record.version || 0) + 1,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName, STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const request = store.put(updatedRecord);

    request.onsuccess = async () => {
      if (addToSyncQueue) {
        await addToQueue(storeName, updatedRecord.id, record.id ? 'update' : 'create', updatedRecord);
      }
      resolve(updatedRecord);
    };

    request.onerror = () => reject(request.error);
  });
};

export const getRecord = async <T>(storeName: StoreName, id: string): Promise<T | undefined> => {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllRecords = async <T>(storeName: StoreName): Promise<T[]> => {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteRecord = async (storeName: StoreName, id: string): Promise<void> => {
  const db = await getDB();
  const record = await getRecord<SyncableRecord>(storeName, id);
  
  if (record) {
    // Soft delete - mark as deleted for sync
    const deletedRecord = {
      ...record,
      deletedAt: new Date().toISOString(),
      syncStatus: 'pending' as SyncStatus,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName, STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.put(deletedRecord);

      request.onsuccess = async () => {
        await addToQueue(storeName, id, 'delete', deletedRecord);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }
};

export const getRecordsByStatus = async <T>(
  storeName: StoreName,
  status: SyncStatus
): Promise<T[]> => {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index('syncStatus');
    const request = index.getAll(status);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Sync Queue Management
export const addToQueue = async (
  store: StoreName,
  recordId: string,
  operation: 'create' | 'update' | 'delete',
  data: any,
  priority: 'high' | 'normal' | 'low' = 'normal'
): Promise<void> => {
  const db = await getDB();
  
  const queueItem: SyncQueueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    store,
    recordId,
    operation,
    data,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    priority,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const queueStore = transaction.objectStore(STORES.SYNC_QUEUE);
    const request = queueStore.add(queueItem);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getQueueItems = async (): Promise<SyncQueueItem[]> => {
  const items = await getAllRecords<SyncQueueItem>(STORES.SYNC_QUEUE);
  // Sort by priority and timestamp
  return items.sort((a, b) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
};

export const removeFromQueue = async (id: string): Promise<void> => {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateQueueItem = async (item: SyncQueueItem): Promise<void> => {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Conflict Resolution
export const resolveConflict = <T extends SyncableRecord>(
  localRecord: T,
  serverRecord: T,
  strategy: ConflictStrategy
): T => {
  switch (strategy) {
    case 'client-wins':
      return { ...localRecord, version: serverRecord.version + 1 };
    
    case 'server-wins':
      return { ...serverRecord, localId: localRecord.localId };
    
    case 'merge':
      // Merge strategy: newer field values win
      const merged = { ...serverRecord };
      const localDate = new Date(localRecord.updatedAt);
      const serverDate = new Date(serverRecord.updatedAt);
      
      if (localDate > serverDate) {
        Object.keys(localRecord).forEach((key) => {
          if (key !== 'version' && key !== 'syncStatus') {
            (merged as any)[key] = (localRecord as any)[key];
          }
        });
      }
      merged.version = Math.max(localRecord.version, serverRecord.version) + 1;
      return merged as T;
    
    case 'manual':
    default:
      // Mark as conflict for manual resolution
      return { ...localRecord, syncStatus: 'conflict' as SyncStatus };
  }
};

// Online/Offline Status
export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const onOnlineStatusChange = (callback: (online: boolean) => void): () => void => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Storage Statistics
export interface StorageStats {
  totalRecords: number;
  pendingSync: number;
  conflicts: number;
  errors: number;
  queueSize: number;
  estimatedSize: string;
}

export const getStorageStats = async (): Promise<StorageStats> => {
  const stores = [STORES.INCIDENTS, STORES.OBSERVATIONS, STORES.JSA, STORES.INSPECTIONS];
  let totalRecords = 0;
  let pendingSync = 0;
  let conflicts = 0;
  let errors = 0;

  for (const store of stores) {
    const records = await getAllRecords<SyncableRecord>(store);
    totalRecords += records.length;
    pendingSync += records.filter(r => r.syncStatus === 'pending').length;
    conflicts += records.filter(r => r.syncStatus === 'conflict').length;
    errors += records.filter(r => r.syncStatus === 'error').length;
  }

  const queueItems = await getQueueItems();

  // Estimate storage size
  let estimatedSize = 'Unknown';
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage) {
        const sizeMB = estimate.usage / (1024 * 1024);
        estimatedSize = sizeMB < 1 ? `${(sizeMB * 1024).toFixed(1)} KB` : `${sizeMB.toFixed(2)} MB`;
      }
    } catch (e) {
      console.warn('Could not estimate storage:', e);
    }
  }

  return {
    totalRecords,
    pendingSync,
    conflicts,
    errors,
    queueSize: queueItems.length,
    estimatedSize,
  };
};

// Clear all offline data
export const clearOfflineData = async (): Promise<void> => {
  const db = await getDB();
  
  const stores = Object.values(STORES);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(stores, 'readwrite');
    
    stores.forEach(storeName => {
      transaction.objectStore(storeName).clear();
    });
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export default {
  initializeDB,
  getDB,
  saveRecord,
  getRecord,
  getAllRecords,
  deleteRecord,
  getRecordsByStatus,
  addToQueue,
  getQueueItems,
  removeFromQueue,
  resolveConflict,
  isOnline,
  onOnlineStatusChange,
  getStorageStats,
  clearOfflineData,
  STORES,
};
