/**
 * SDS (Safety Data Sheet) Database Service
 * Provides real-time SDS data with offline caching and sync capabilities
 */

import { ChemicalSDS, mockChemicalSDS } from '../data/mockChemicalSDS';
import { auditLogService } from './auditLogService';
import { encryptionService } from './encryptionService';

// Database configuration
const DB_NAME = 'safetyMEG_sds';
const DB_VERSION = 1;
const SDS_STORE = 'sds';
const EQUIPMENT_STORE = 'equipment';
const SYNC_QUEUE_STORE = 'sdsSync';

// Equipment with SDS
export interface EquipmentSDS {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  barcode: string;
  qrCode: string;
  location: string;
  department: string;
  lastInspection: string;
  nextInspection: string;
  status: 'operational' | 'maintenance_due' | 'out_of_service';
  linkedSDS: string[]; // SDS IDs
  riskScore: number;
  manufacturer: string;
  model: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  maintenanceHistory: MaintenanceRecord[];
  lastSyncedAt?: string;
  pendingSync: boolean;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'inspection' | 'repair' | 'calibration' | 'replacement';
  description: string;
  performedBy: string;
  nextDue: string;
  notes?: string;
}

// Sync status
export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingChanges: number;
  errorMessage?: string;
}

// Extended SDS with offline support
export interface SDSRecord extends ChemicalSDS {
  barcode?: string;
  qrCode?: string;
  localOnly?: boolean;
  lastSyncedAt?: string;
  pendingSync: boolean;
}

// Mock Equipment Database
const mockEquipment: EquipmentSDS[] = [
  {
    id: 'EQ001',
    name: 'Forklift FL-203',
    type: 'Material Handling',
    serialNumber: 'FL2023-0203',
    barcode: '847509123456',
    qrCode: 'QR-EQ001-FL203',
    location: 'Warehouse A',
    department: 'Logistics',
    lastInspection: '2026-01-15',
    nextInspection: '2026-02-15',
    status: 'operational',
    linkedSDS: [],
    riskScore: 32,
    manufacturer: 'Toyota',
    model: '8FGU25',
    purchaseDate: '2023-03-15',
    warrantyExpiry: '2026-03-15',
    maintenanceHistory: [
      { id: 'MH001', date: '2026-01-15', type: 'inspection', description: 'Monthly safety inspection', performedBy: 'John Smith', nextDue: '2026-02-15' }
    ],
    lastSyncedAt: new Date().toISOString(),
    pendingSync: false
  },
  {
    id: 'EQ002',
    name: 'Chemical Storage Cabinet CS-12',
    type: 'Storage',
    serialNumber: 'CS2022-0012',
    barcode: '847509234567',
    qrCode: 'QR-EQ002-CS12',
    location: 'Lab Area B',
    department: 'R&D',
    lastInspection: '2026-01-20',
    nextInspection: '2026-02-20',
    status: 'operational',
    linkedSDS: ['chem-001', 'chem-002', 'chem-003'],
    riskScore: 45,
    manufacturer: 'Justrite',
    model: '896020',
    purchaseDate: '2022-06-10',
    maintenanceHistory: [
      { id: 'MH002', date: '2026-01-20', type: 'inspection', description: 'Quarterly cabinet inspection', performedBy: 'Sarah Johnson', nextDue: '2026-04-20' }
    ],
    lastSyncedAt: new Date().toISOString(),
    pendingSync: false
  },
  {
    id: 'EQ003',
    name: 'Safety Harness SH-445',
    type: 'PPE',
    serialNumber: 'SH2024-0445',
    barcode: '847509345678',
    qrCode: 'QR-EQ003-SH445',
    location: 'Construction Site',
    department: 'Construction',
    lastInspection: '2026-01-08',
    nextInspection: '2026-02-08',
    status: 'maintenance_due',
    linkedSDS: [],
    riskScore: 68,
    manufacturer: '3M',
    model: 'DBI-SALA ExoFit',
    purchaseDate: '2024-05-20',
    maintenanceHistory: [
      { id: 'MH003', date: '2026-01-08', type: 'inspection', description: 'Monthly harness inspection - wear detected', performedBy: 'Mike Brown', nextDue: '2026-02-08', notes: 'Replace webbing before next use' }
    ],
    lastSyncedAt: new Date().toISOString(),
    pendingSync: false
  },
  {
    id: 'EQ004',
    name: 'Compressed Air System CAS-01',
    type: 'Pressure Vessel',
    serialNumber: 'CAS2021-0001',
    barcode: '847509456789',
    qrCode: 'QR-EQ004-CAS01',
    location: 'Manufacturing Floor',
    department: 'Production',
    lastInspection: '2026-01-10',
    nextInspection: '2026-07-10',
    status: 'operational',
    linkedSDS: [],
    riskScore: 55,
    manufacturer: 'Ingersoll Rand',
    model: 'UP6-15cTAS-125',
    purchaseDate: '2021-08-12',
    maintenanceHistory: [
      { id: 'MH004', date: '2026-01-10', type: 'inspection', description: 'Semi-annual pressure vessel inspection', performedBy: 'Tom Wilson', nextDue: '2026-07-10' }
    ],
    lastSyncedAt: new Date().toISOString(),
    pendingSync: false
  },
  {
    id: 'EQ005',
    name: 'Emergency Eye Wash Station EW-07',
    type: 'Safety Equipment',
    serialNumber: 'EW2023-0007',
    barcode: '847509567890',
    qrCode: 'QR-EQ005-EW07',
    location: 'Lab Area C',
    department: 'R&D',
    lastInspection: '2026-02-01',
    nextInspection: '2026-02-08',
    status: 'operational',
    linkedSDS: ['chem-001', 'chem-002'],
    riskScore: 28,
    manufacturer: 'Haws',
    model: '7500',
    purchaseDate: '2023-02-28',
    maintenanceHistory: [
      { id: 'MH005', date: '2026-02-01', type: 'inspection', description: 'Weekly eye wash inspection', performedBy: 'Lisa Chen', nextDue: '2026-02-08' }
    ],
    lastSyncedAt: new Date().toISOString(),
    pendingSync: false
  }
];

// Convert mock SDS to SDSRecord format
const mockSDSRecords: SDSRecord[] = mockChemicalSDS.map(sds => ({
  ...sds,
  barcode: `SDS-${sds.id}`,
  qrCode: `QR-SDS-${sds.id}`,
  pendingSync: false,
  lastSyncedAt: new Date().toISOString()
}));

// Database instance
let dbInstance: IDBDatabase | null = null;

// Initialize IndexedDB for SDS
const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open SDS IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create SDS store
      if (!db.objectStoreNames.contains(SDS_STORE)) {
        const sdsStore = db.createObjectStore(SDS_STORE, { keyPath: 'id' });
        sdsStore.createIndex('barcode', 'barcode', { unique: true });
        sdsStore.createIndex('qrCode', 'qrCode', { unique: true });
        sdsStore.createIndex('name', 'name', { unique: false });
        sdsStore.createIndex('pendingSync', 'pendingSync', { unique: false });
      }

      // Create Equipment store
      if (!db.objectStoreNames.contains(EQUIPMENT_STORE)) {
        const equipmentStore = db.createObjectStore(EQUIPMENT_STORE, { keyPath: 'id' });
        equipmentStore.createIndex('barcode', 'barcode', { unique: true });
        equipmentStore.createIndex('qrCode', 'qrCode', { unique: true });
        equipmentStore.createIndex('serialNumber', 'serialNumber', { unique: true });
        equipmentStore.createIndex('location', 'location', { unique: false });
        equipmentStore.createIndex('status', 'status', { unique: false });
        equipmentStore.createIndex('pendingSync', 'pendingSync', { unique: false });
      }

      // Create Sync Queue store
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('operation', 'operation', { unique: false });
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

// SDS Database Service Class
class SDSDatabaseService {
  private syncState: SyncState = {
    status: 'online',
    lastSyncedAt: null,
    pendingChanges: 0
  };

  private listeners: Set<(state: SyncState) => void> = new Set();
  private initialized = false;

  // Initialize the database with mock data
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const db = await getDB();
      
      // Check if data exists
      const existingSDS = await this.getAllSDS();
      const existingEquipment = await this.getAllEquipment();

      // Seed with mock data if empty
      if (existingSDS.length === 0) {
        const transaction = db.transaction([SDS_STORE], 'readwrite');
        const store = transaction.objectStore(SDS_STORE);
        
        for (const sds of mockSDSRecords) {
          store.put(sds);
        }
      }

      if (existingEquipment.length === 0) {
        const transaction = db.transaction([EQUIPMENT_STORE], 'readwrite');
        const store = transaction.objectStore(EQUIPMENT_STORE);
        
        for (const equipment of mockEquipment) {
          store.put(equipment);
        }
      }

      this.initialized = true;
      this.updateSyncState({ status: 'online', lastSyncedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to initialize SDS database:', error);
      this.updateSyncState({ status: 'error', errorMessage: 'Database initialization failed' });
    }
  }

  // Subscribe to sync state changes
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    listener(this.syncState);
    return () => this.listeners.delete(listener);
  }

  private updateSyncState(partial: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...partial };
    this.listeners.forEach(listener => listener(this.syncState));
  }

  // Get current sync state
  getSyncState(): SyncState {
    return this.syncState;
  }

  // Get all SDS records
  async getAllSDS(): Promise<SDSRecord[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SDS_STORE], 'readonly');
      const store = transaction.objectStore(SDS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get SDS by ID
  async getSDSById(id: string): Promise<SDSRecord | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SDS_STORE], 'readonly');
      const store = transaction.objectStore(SDS_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Get SDS by barcode
  async getSDSByBarcode(barcode: string): Promise<SDSRecord | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SDS_STORE], 'readonly');
      const store = transaction.objectStore(SDS_STORE);
      const index = store.index('barcode');
      const request = index.get(barcode);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Get SDS by QR code
  async getSDSByQRCode(qrCode: string): Promise<SDSRecord | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SDS_STORE], 'readonly');
      const store = transaction.objectStore(SDS_STORE);
      const index = store.index('qrCode');
      const request = index.get(qrCode);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Search SDS by name
  async searchSDS(query: string): Promise<SDSRecord[]> {
    const allSDS = await this.getAllSDS();
    const searchLower = query.toLowerCase();
    return allSDS.filter(sds => 
      sds.name.toLowerCase().includes(searchLower) ||
      sds.manufacturer.toLowerCase().includes(searchLower) ||
      sds.location.toLowerCase().includes(searchLower)
    );
  }

  // Get all equipment
  async getAllEquipment(): Promise<EquipmentSDS[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EQUIPMENT_STORE], 'readonly');
      const store = transaction.objectStore(EQUIPMENT_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get equipment by ID
  async getEquipmentById(id: string): Promise<EquipmentSDS | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EQUIPMENT_STORE], 'readonly');
      const store = transaction.objectStore(EQUIPMENT_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Get equipment by barcode
  async getEquipmentByBarcode(barcode: string): Promise<EquipmentSDS | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EQUIPMENT_STORE], 'readonly');
      const store = transaction.objectStore(EQUIPMENT_STORE);
      const index = store.index('barcode');
      const request = index.get(barcode);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Get equipment by QR code
  async getEquipmentByQRCode(qrCode: string): Promise<EquipmentSDS | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EQUIPMENT_STORE], 'readonly');
      const store = transaction.objectStore(EQUIPMENT_STORE);
      const index = store.index('qrCode');
      const request = index.get(qrCode);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Scan code (barcode or QR) and return equipment with linked SDS
  async scanCode(code: string): Promise<{ equipment: EquipmentSDS | null; linkedSDS: SDSRecord[] }> {
    // Try barcode first
    let equipment = await this.getEquipmentByBarcode(code);
    
    // Try QR code if barcode not found
    if (!equipment) {
      equipment = await this.getEquipmentByQRCode(code);
    }

    // Get linked SDS if equipment found
    const linkedSDS: SDSRecord[] = [];
    if (equipment) {
      for (const sdsId of equipment.linkedSDS) {
        const sds = await this.getSDSById(sdsId);
        if (sds) linkedSDS.push(sds);
      }
    }

    return { equipment, linkedSDS };
  }

  // Log maintenance inspection
  async logInspection(equipmentId: string, record: Omit<MaintenanceRecord, 'id'>): Promise<EquipmentSDS | null> {
    const equipment = await this.getEquipmentById(equipmentId);
    if (!equipment) return null;

    const newRecord: MaintenanceRecord = {
      ...record,
      id: `MH-${Date.now()}`
    };

    const updatedEquipment: EquipmentSDS = {
      ...equipment,
      lastInspection: record.date,
      nextInspection: record.nextDue,
      maintenanceHistory: [...equipment.maintenanceHistory, newRecord],
      pendingSync: true
    };

    // Update in database
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EQUIPMENT_STORE, SYNC_QUEUE_STORE], 'readwrite');
      const equipmentStore = transaction.objectStore(EQUIPMENT_STORE);
      const syncStore = transaction.objectStore(SYNC_QUEUE_STORE);

      equipmentStore.put(updatedEquipment);
      
      // Add to sync queue
      syncStore.put({
        id: `SYNC-${Date.now()}`,
        operation: 'update',
        store: EQUIPMENT_STORE,
        recordId: equipmentId,
        data: updatedEquipment,
        timestamp: new Date().toISOString()
      });

      transaction.oncomplete = () => {
        this.updatePendingCount();
        resolve(updatedEquipment);
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Update equipment status
  async updateEquipmentStatus(equipmentId: string, status: EquipmentSDS['status']): Promise<EquipmentSDS | null> {
    const equipment = await this.getEquipmentById(equipmentId);
    if (!equipment) return null;

    const updatedEquipment: EquipmentSDS = {
      ...equipment,
      status,
      pendingSync: true
    };

    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EQUIPMENT_STORE, SYNC_QUEUE_STORE], 'readwrite');
      const equipmentStore = transaction.objectStore(EQUIPMENT_STORE);
      const syncStore = transaction.objectStore(SYNC_QUEUE_STORE);

      equipmentStore.put(updatedEquipment);
      
      syncStore.put({
        id: `SYNC-${Date.now()}`,
        operation: 'update',
        store: EQUIPMENT_STORE,
        recordId: equipmentId,
        data: updatedEquipment,
        timestamp: new Date().toISOString()
      });

      transaction.oncomplete = () => {
        this.updatePendingCount();
        resolve(updatedEquipment);
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get equipment with linked SDS details
  async getEquipmentWithSDS(equipmentId: string): Promise<{ equipment: EquipmentSDS; sdsRecords: SDSRecord[] } | null> {
    const equipment = await this.getEquipmentById(equipmentId);
    if (!equipment) return null;

    const sdsRecords: SDSRecord[] = [];
    for (const sdsId of equipment.linkedSDS) {
      const sds = await this.getSDSById(sdsId);
      if (sds) sdsRecords.push(sds);
    }

    return { equipment, sdsRecords };
  }

  // Update pending sync count
  private async updatePendingCount(): Promise<void> {
    const db = await getDB();
    
    return new Promise((resolve) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        this.updateSyncState({ pendingChanges: countRequest.result });
        resolve();
      };
      countRequest.onerror = () => {
        resolve();
      };
    });
  }

  // Simulate sync with server
  async sync(): Promise<void> {
    if (!navigator.onLine) {
      this.updateSyncState({ status: 'offline' });
      return;
    }

    this.updateSyncState({ status: 'syncing' });

    try {
      const db = await getDB();

      // Get all pending sync items
      const syncItems = await new Promise<any[]>((resolve, reject) => {
        const transaction = db.transaction([SYNC_QUEUE_STORE], 'readonly');
        const store = transaction.objectStore(SYNC_QUEUE_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (syncItems.length > 0) {
        // Resolve equipment data for each pending item
        const equipmentItems: any[] = [];
        for (const item of syncItems) {
          if (item.store === EQUIPMENT_STORE) {
            const eq = await this.getEquipmentById(item.recordId);
            if (eq) equipmentItems.push(eq);
          }
        }

        // POST to real backend
        const _apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';
        const response = await fetch(`${_apiBase}/sds/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: equipmentItems }),
        });

        if (!response.ok) {
          throw new Error(`Server sync failed: ${response.status}`);
        }

        // Clear sync queue after successful server sync
        const clearTransaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
        clearTransaction.objectStore(SYNC_QUEUE_STORE).clear();

        // Mark equipment as synced in IndexedDB
        const now = new Date().toISOString();
        const equipmentTransaction = db.transaction([EQUIPMENT_STORE], 'readwrite');
        const equipmentStore = equipmentTransaction.objectStore(EQUIPMENT_STORE);
        for (const item of syncItems) {
          if (item.store === EQUIPMENT_STORE) {
            const equipment = await this.getEquipmentById(item.recordId);
            if (equipment) {
              equipmentStore.put({ ...equipment, pendingSync: false, lastSyncedAt: now });
            }
          }
        }
      }

      this.updateSyncState({
        status: 'online',
        lastSyncedAt: new Date().toISOString(),
        pendingChanges: 0,
      });
    } catch (error) {
      console.error('Sync failed:', error);
      this.updateSyncState({
        status: 'error',
        errorMessage: 'Failed to sync with server',
      });
    }
  }
  // Import equipment from CSV
  async importEquipmentFromCSV(csvContent: string): Promise<{ success: number; failed: number; errors: string[] }> {
    const lines = csvContent.split('\n');
    if (lines.length < 2) {
      return { success: 0, failed: 0, errors: ['Empty or invalid CSV file'] };
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const requiredHeaders = ['name', 'type', 'serialNumber', 'location'];
    
    // Validate headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return { success: 0, failed: 0, errors: [`Missing required headers: ${missingHeaders.join(', ')}`] };
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    const db = await getDB();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Parse CSV line (handling quotes)
        const values: string[] = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (let char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());

        // Map values to object
        const equipment: any = {};
        headers.forEach((header, index) => {
          if (index < values.length) {
            equipment[header] = values[index].replace(/^"|"$/g, '');
          }
        });

        // Validate required fields
        if (!equipment.name || !equipment.type || !equipment.serialNumber) {
          throw new Error(`Row ${i + 1}: Missing required fields`);
        }

        // Create equipment object
        const newEquipment: EquipmentSDS = {
          id: equipment.id || `EQ-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: equipment.name,
          type: equipment.type,
          serialNumber: equipment.serialNumber,
          barcode: equipment.barcode || `BC-${Date.now()}`,
          qrCode: equipment.qrCode || `QR-${Date.now()}`,
          location: equipment.location || 'Unknown',
          department: equipment.department || 'General',
          lastInspection: equipment.lastInspection || new Date().toISOString().split('T')[0],
          nextInspection: equipment.nextInspection || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: (equipment.status as any) || 'operational',
          linkedSDS: [],
          riskScore: parseInt(equipment.riskScore) || 0,
          manufacturer: equipment.manufacturer || 'Unknown',
          model: equipment.model || 'Unknown',
          purchaseDate: equipment.purchaseDate || new Date().toISOString().split('T')[0],
          maintenanceHistory: [],
          lastSyncedAt: new Date().toISOString(),
          pendingSync: true
        };

        // Encrypt sensitive fields before storage (simulated for now by encrypting the whole object string)
        // In a real scenario, we'd encrypt specific fields or the whole value
        // For this demo, we'll store the object as is but log that we "would" encrypt it
        // To actually use encryptionService, we'd need to change the store to hold encrypted strings
        // For now, let's just log the encryption action to demonstrate intent
        
        // Save to DB
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction([EQUIPMENT_STORE], 'readwrite');
          const store = transaction.objectStore(EQUIPMENT_STORE);
          const request = store.put(newEquipment);
          
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });

        success++;
        
        // Log audit
        await auditLogService.logAction(
          'import_equipment',
          'equipment',
          newEquipment.id,
          `Imported equipment: ${newEquipment.name}`
        );

      } catch (error) {
        failed++;
        errors.push(error instanceof Error ? error.message : `Row ${i + 1}: Unknown error`);
      }
    }

    return { success, failed, errors };
  }
}

// Export singleton instance
export const sdsDatabase = new SDSDatabaseService();

// Export for direct use
export default sdsDatabase;
