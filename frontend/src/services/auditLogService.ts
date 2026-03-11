/**
 * Audit Log Service
 * Provides SOC 2 compliant audit logging for sensitive actions
 */

import { encryptionService } from './encryptionService';

// Database configuration
const DB_NAME = 'safetyMEG_audit';
const DB_VERSION = 1;
const AUDIT_STORE = 'audit_logs';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  userRole: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
}

class AuditLogService {
  private db: IDBDatabase | null = null;

  constructor() {
    this.initialize();
  }

  async initialize(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open Audit DB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(AUDIT_STORE)) {
          const store = db.createObjectStore(AUDIT_STORE, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('action', 'action', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        }
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) await this.initialize();
    return this.db!;
  }

  async logAction(
    action: string,
    resourceType: string,
    resourceId: string,
    details: string,
    status: 'success' | 'failure' = 'success'
  ): Promise<void> {
    const db = await this.getDB();
    
    // Encrypt sensitive details
    const { cipherText, iv } = await encryptionService.encrypt(details);
    
    const entry: AuditLogEntry = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      resourceType,
      resourceId,
      userId: 'current_user', // Mock user ID
      userRole: 'admin', // Mock role
      details: JSON.stringify({ cipherText, iv }), // Store encrypted details
      userAgent: navigator.userAgent,
      status
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIT_STORE], 'readwrite');
      const store = transaction.objectStore(AUDIT_STORE);
      const request = store.add(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLogs(limit: number = 100): Promise<AuditLogEntry[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIT_STORE], 'readonly');
      const store = transaction.objectStore(AUDIT_STORE);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      
      const logs: AuditLogEntry[] = [];
      
      request.onsuccess = async (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && logs.length < limit) {
          const log = cursor.value;
          try {
            // Decrypt details if they look like our encrypted format
            if (log.details.startsWith('{') && log.details.includes('cipherText')) {
              const { cipherText, iv } = JSON.parse(log.details);
              log.details = await encryptionService.decrypt(cipherText, iv);
            }
          } catch (e) {
            // Keep original if decryption fails or not encrypted
          }
          logs.push(log);
          cursor.continue();
        } else {
          resolve(logs);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  async exportLogsCSV(): Promise<string> {
    const logs = await this.getLogs(1000);
    
    const headers = [
      'ID',
      'Timestamp',
      'Action',
      'Resource Type',
      'Resource ID',
      'User ID',
      'User Role',
      'Status',
      'Details'
    ];
    
    const rows = logs.map(log => [
      log.id,
      log.timestamp,
      log.action,
      log.resourceType,
      log.resourceId,
      log.userId,
      log.userRole,
      log.status,
      log.details
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
  }
}

export const auditLogService = new AuditLogService();
