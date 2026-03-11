/**
 * Geotag Offline Caching Service
 * Provides IndexedDB storage for geolocation data with offline sync capabilities
 */

// Database configuration
const DB_NAME = 'safetyMEG_geotag';
const DB_VERSION = 1;
const GEOTAG_STORE = 'geotags';
const PENDING_STORE = 'pendingGeotags';

// Geotag record interface
export interface GeotagRecord {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: string;
  capturedAt: string;
  address?: string;
  zone?: string;
  facilityArea?: string;
  recordType: 'incident' | 'observation' | 'inspection' | 'hazard' | 'near_miss' | 'manual';
  linkedRecordId?: string;
  linkedRecordType?: string;
  notes?: string;
  capturedBy: string;
  deviceInfo?: DeviceInfo;
  syncStatus: 'pending' | 'synced' | 'error';
  syncError?: string;
  lastSyncAttempt?: string;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  online: boolean;
}

// Cached zone configuration
export interface GeoZone {
  id: string;
  name: string;
  description: string;
  polygon: { lat: number; lng: number }[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  department: string;
  requiresPPE?: string[];
  hazardTypes?: string[];
}

// Service state
export interface GeotagServiceState {
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  totalCached: number;
  cacheSize: number; // in bytes (estimated)
  autoCapture: boolean;
}

// Mock zones for facility
const mockZones: GeoZone[] = [
  {
    id: 'ZONE-001',
    name: 'Warehouse A',
    description: 'Main storage warehouse with forklift operations',
    polygon: [
      { lat: 34.0520, lng: -118.2440 },
      { lat: 34.0525, lng: -118.2440 },
      { lat: 34.0525, lng: -118.2430 },
      { lat: 34.0520, lng: -118.2430 }
    ],
    riskLevel: 'medium',
    department: 'Logistics',
    requiresPPE: ['Safety Vest', 'Steel-toe Boots', 'Hard Hat'],
    hazardTypes: ['Forklift Traffic', 'Falling Objects']
  },
  {
    id: 'ZONE-002',
    name: 'Lab Area B',
    description: 'Chemical research laboratory',
    polygon: [
      { lat: 34.0515, lng: -118.2435 },
      { lat: 34.0518, lng: -118.2435 },
      { lat: 34.0518, lng: -118.2428 },
      { lat: 34.0515, lng: -118.2428 }
    ],
    riskLevel: 'high',
    department: 'R&D',
    requiresPPE: ['Lab Coat', 'Safety Goggles', 'Chemical Gloves'],
    hazardTypes: ['Chemical Exposure', 'Fire Risk']
  },
  {
    id: 'ZONE-003',
    name: 'Manufacturing Floor',
    description: 'Heavy machinery and assembly operations',
    polygon: [
      { lat: 34.0510, lng: -118.2445 },
      { lat: 34.0518, lng: -118.2445 },
      { lat: 34.0518, lng: -118.2435 },
      { lat: 34.0510, lng: -118.2435 }
    ],
    riskLevel: 'high',
    department: 'Production',
    requiresPPE: ['Hard Hat', 'Safety Glasses', 'Ear Protection', 'Steel-toe Boots'],
    hazardTypes: ['Moving Machinery', 'Noise Hazard', 'Pinch Points']
  },
  {
    id: 'ZONE-004',
    name: 'Office Building',
    description: 'Administrative offices',
    polygon: [
      { lat: 34.0528, lng: -118.2442 },
      { lat: 34.0532, lng: -118.2442 },
      { lat: 34.0532, lng: -118.2435 },
      { lat: 34.0528, lng: -118.2435 }
    ],
    riskLevel: 'low',
    department: 'Administration',
    hazardTypes: ['Ergonomic']
  },
  {
    id: 'ZONE-005',
    name: 'Parking Lot',
    description: 'Employee and visitor parking',
    polygon: [
      { lat: 34.0530, lng: -118.2450 },
      { lat: 34.0535, lng: -118.2450 },
      { lat: 34.0535, lng: -118.2442 },
      { lat: 34.0530, lng: -118.2442 }
    ],
    riskLevel: 'low',
    department: 'General',
    hazardTypes: ['Vehicle Traffic', 'Pedestrian Safety']
  }
];

// Database instance
let dbInstance: IDBDatabase | null = null;

// Initialize IndexedDB
const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open Geotag IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create geotag store
      if (!db.objectStoreNames.contains(GEOTAG_STORE)) {
        const geoStore = db.createObjectStore(GEOTAG_STORE, { keyPath: 'id' });
        geoStore.createIndex('timestamp', 'timestamp', { unique: false });
        geoStore.createIndex('recordType', 'recordType', { unique: false });
        geoStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        geoStore.createIndex('linkedRecordId', 'linkedRecordId', { unique: false });
        geoStore.createIndex('zone', 'zone', { unique: false });
      }

      // Create pending store for offline queue
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        const pendingStore = db.createObjectStore(PENDING_STORE, { keyPath: 'id' });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        pendingStore.createIndex('recordType', 'recordType', { unique: false });
      }
    };
  });
};

// Get database instance
const getDB = async (): Promise<IDBDatabase> => {
  if (!dbInstance) {
    dbInstance = await initializeDB();
  }
  return dbInstance;
};

// Point-in-polygon algorithm for zone detection
const isPointInPolygon = (point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean => {
  let inside = false;
  const x = point.lng;
  const y = point.lat;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
};

// Geotag Caching Service Class
class GeotagCacheService {
  private state: GeotagServiceState = {
    isOnline: navigator.onLine,
    pendingCount: 0,
    lastSyncedAt: null,
    totalCached: 0,
    cacheSize: 0,
    autoCapture: true
  };

  private listeners: Set<(state: GeotagServiceState) => void> = new Set();
  private watchId: number | null = null;
  private zones: GeoZone[] = mockZones;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnlineStatusChange(true));
    window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
  }

  private handleOnlineStatusChange(isOnline: boolean): void {
    this.updateState({ isOnline });
    if (isOnline) {
      this.syncPending();
    }
  }

  // Subscribe to state changes
  subscribe(listener: (state: GeotagServiceState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private updateState(partial: Partial<GeotagServiceState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(listener => listener(this.state));
  }

  // Get current state
  getState(): GeotagServiceState {
    return this.state;
  }

  // Set auto-capture mode
  setAutoCapture(enabled: boolean): void {
    this.updateState({ autoCapture: enabled });
  }

  // Get current location with caching
  async getCurrentLocation(): Promise<GeotagRecord | null> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const geotag = await this.createGeotagFromPosition(position, 'manual');
          resolve(geotag);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  // Create geotag record from position
  private async createGeotagFromPosition(
    position: GeolocationPosition,
    recordType: GeotagRecord['recordType'],
    linkedRecordId?: string,
    linkedRecordType?: string
  ): Promise<GeotagRecord> {
    const now = new Date();
    const point = { lat: position.coords.latitude, lng: position.coords.longitude };
    
    // Detect zone
    const zone = this.detectZone(point);

    const geotag: GeotagRecord = {
      id: `GEO-${now.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: new Date(position.timestamp).toISOString(),
      capturedAt: now.toISOString(),
      zone: zone?.name,
      facilityArea: zone?.department,
      recordType,
      linkedRecordId,
      linkedRecordType,
      capturedBy: 'current_user', // Would be actual user ID in production
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        online: navigator.onLine
      },
      syncStatus: navigator.onLine ? 'synced' : 'pending'
    };

    // Simulate reverse geocoding
    geotag.address = `${geotag.latitude.toFixed(4)}°N, ${Math.abs(geotag.longitude).toFixed(4)}°W - ${zone?.name || 'Unknown Area'}`;

    // Save to cache
    await this.saveGeotag(geotag);

    return geotag;
  }

  // Detect which zone a point is in
  detectZone(point: { lat: number; lng: number }): GeoZone | null {
    for (const zone of this.zones) {
      if (isPointInPolygon(point, zone.polygon)) {
        return zone;
      }
    }
    return null;
  }

  // Get all zones
  getZones(): GeoZone[] {
    return this.zones;
  }

  // Get zone by ID
  getZoneById(id: string): GeoZone | null {
    return this.zones.find(z => z.id === id) || null;
  }

  // Save geotag to IndexedDB
  async saveGeotag(geotag: GeotagRecord): Promise<void> {
    const db = await getDB();

    // If online, try to save directly to backend and mark as synced
    if (navigator.onLine && geotag.syncStatus === 'pending') {
      try {
        const response = await fetch('/api/geotags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geotag),
        });
        if (response.ok) {
          geotag = { ...geotag, syncStatus: 'synced' };
        }
      } catch {
        // Network failure — keep as pending, will sync later
      }
    }

    return new Promise((resolve, reject) => {
      const storeName = geotag.syncStatus === 'pending' ? PENDING_STORE : GEOTAG_STORE;
      const transaction = db.transaction([storeName, GEOTAG_STORE], 'readwrite');
      const store = transaction.objectStore(storeName);
      const mainStore = transaction.objectStore(GEOTAG_STORE);

      // Always save to main store for history
      mainStore.put(geotag);

      // Also save to pending if needs sync
      if (geotag.syncStatus === 'pending') {
        store.put(geotag);
      }

      transaction.oncomplete = () => {
        this.updateCacheStats();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Capture geotag for a specific record (incident, observation, etc.)
  async captureForRecord(
    recordType: GeotagRecord['recordType'],
    linkedRecordId: string,
    linkedRecordType: string
  ): Promise<GeotagRecord | null> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const geotag = await this.createGeotagFromPosition(
            position,
            recordType,
            linkedRecordId,
            linkedRecordType
          );
          resolve(geotag);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  // Get all cached geotags
  async getAllGeotags(): Promise<GeotagRecord[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GEOTAG_STORE], 'readonly');
      const store = transaction.objectStore(GEOTAG_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get geotag by ID
  async getGeotagById(id: string): Promise<GeotagRecord | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GEOTAG_STORE], 'readonly');
      const store = transaction.objectStore(GEOTAG_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Get geotags for a specific linked record
  async getGeotagsForRecord(linkedRecordId: string): Promise<GeotagRecord[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GEOTAG_STORE], 'readonly');
      const store = transaction.objectStore(GEOTAG_STORE);
      const index = store.index('linkedRecordId');
      const request = index.getAll(linkedRecordId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get geotags by type
  async getGeotagsByType(recordType: GeotagRecord['recordType']): Promise<GeotagRecord[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GEOTAG_STORE], 'readonly');
      const store = transaction.objectStore(GEOTAG_STORE);
      const index = store.index('recordType');
      const request = index.getAll(recordType);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get recent geotags
  async getRecentGeotags(limit: number = 10): Promise<GeotagRecord[]> {
    const allGeotags = await this.getAllGeotags();
    return allGeotags
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      .slice(0, limit);
  }

  // Get pending geotags
  async getPendingGeotags(): Promise<GeotagRecord[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PENDING_STORE], 'readonly');
      const store = transaction.objectStore(PENDING_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Sync pending geotags
  async syncPending(): Promise<{ synced: number; failed: number }> {
    if (!navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    const pending = await this.getPendingGeotags();
    if (pending.length === 0) {
      return { synced: 0, failed: 0 };
    }

    const db = await getDB();
    let synced = 0;
    let failed = 0;

    try {
      // Batch sync to real backend
      const response = await fetch('/api/geotags/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geotags: pending }),
      });

      if (!response.ok) {
        throw new Error(`Server sync failed: ${response.status}`);
      }

      const result = await response.json();
      const serverResults: { id: string; status: string }[] = result?.data?.results ?? [];
      const serverSyncedIds = new Set(serverResults.filter(r => r.status === 'synced').map(r => r.id));

      for (const geotag of pending) {
        if (serverSyncedIds.has(geotag.id)) {
          const updatedGeotag: GeotagRecord = { ...geotag, syncStatus: 'synced' };
          const transaction = db.transaction([GEOTAG_STORE, PENDING_STORE], 'readwrite');
          transaction.objectStore(GEOTAG_STORE).put(updatedGeotag);
          transaction.objectStore(PENDING_STORE).delete(geotag.id);
          synced++;
        } else {
          const errorGeotag: GeotagRecord = {
            ...geotag,
            syncStatus: 'error',
            syncError: 'Server did not confirm sync',
            lastSyncAttempt: new Date().toISOString(),
          };
          const transaction = db.transaction([GEOTAG_STORE, PENDING_STORE], 'readwrite');
          transaction.objectStore(GEOTAG_STORE).put(errorGeotag);
          transaction.objectStore(PENDING_STORE).put(errorGeotag);
          failed++;
        }
      }
    } catch (error) {
      // Mark all as error on network failure
      for (const geotag of pending) {
        const errorGeotag: GeotagRecord = {
          ...geotag,
          syncStatus: 'error',
          syncError: error instanceof Error ? error.message : 'Unknown error',
          lastSyncAttempt: new Date().toISOString(),
        };
        const transaction = db.transaction([GEOTAG_STORE, PENDING_STORE], 'readwrite');
        transaction.objectStore(GEOTAG_STORE).put(errorGeotag);
        transaction.objectStore(PENDING_STORE).put(errorGeotag);
        failed++;
      }
    }

    this.updateCacheStats();
    this.updateState({ lastSyncedAt: new Date().toISOString() });

    return { synced, failed };
  }

  // Update cache statistics
  private async updateCacheStats(): Promise<void> {
    try {
      const allGeotags = await this.getAllGeotags();
      const pending = await this.getPendingGeotags();
      
      // Estimate cache size (rough calculation)
      const cacheSize = JSON.stringify(allGeotags).length;

      this.updateState({
        totalCached: allGeotags.length,
        pendingCount: pending.length,
        cacheSize
      });
    } catch (error) {
      console.error('Failed to update cache stats:', error);
    }
  }

  // Clear all cached geotags (use with caution)
  async clearCache(): Promise<void> {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GEOTAG_STORE, PENDING_STORE], 'readwrite');
      transaction.objectStore(GEOTAG_STORE).clear();
      transaction.objectStore(PENDING_STORE).clear();

      transaction.oncomplete = () => {
        this.updateState({
          totalCached: 0,
          pendingCount: 0,
          cacheSize: 0
        });
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Export geotags as JSON
  async exportGeotags(): Promise<string> {
    const geotags = await this.getAllGeotags();
    return JSON.stringify(geotags, null, 2);
  }

  // Export geotags as CSV
  async exportGeotagsCSV(): Promise<string> {
    const geotags = await this.getAllGeotags();
    
    if (geotags.length === 0) {
      return 'No data to export';
    }

    // CSV headers
    const headers = [
      'ID',
      'Latitude',
      'Longitude',
      'Accuracy (m)',
      'Altitude (m)',
      'Zone',
      'Facility Area',
      'Record Type',
      'Linked Record ID',
      'Address',
      'Captured At',
      'Captured By',
      'Sync Status',
      'Notes'
    ];

    // CSV rows
    const rows = geotags.map(geotag => [
      geotag.id,
      geotag.latitude.toFixed(6),
      geotag.longitude.toFixed(6),
      geotag.accuracy.toFixed(2),
      geotag.altitude?.toFixed(2) || '',
      geotag.zone || '',
      geotag.facilityArea || '',
      geotag.recordType,
      geotag.linkedRecordId || '',
      geotag.address || '',
      geotag.capturedAt,
      geotag.capturedBy,
      geotag.syncStatus,
      geotag.notes || ''
    ]);

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  // Download geotags as CSV file
  async downloadGeotagsCSV(): Promise<void> {
    const csv = await this.exportGeotagsCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `geotags-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}

// Export singleton instance
export const geotagCache = new GeotagCacheService();

// Export for direct use
export default geotagCache;
