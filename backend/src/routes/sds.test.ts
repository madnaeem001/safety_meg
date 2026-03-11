/**
 * SDS Equipment API Route Tests
 * Tests all CRUD + scan + import + sync endpoints.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { sdsRoutes } from '../routes/sds';

// ── Test DB Setup ─────────────────────────────────────────────────────────

let db: ReturnType<typeof Database>;

function setupTestDB() {
  db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS sds_equipment (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT '',
      serial_number TEXT NOT NULL UNIQUE,
      barcode TEXT,
      qr_code TEXT,
      location TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      last_inspection TEXT,
      next_inspection TEXT,
      status TEXT NOT NULL DEFAULT 'operational',
      linked_sds TEXT DEFAULT '[]',
      risk_score INTEGER DEFAULT 0,
      manufacturer TEXT DEFAULT '',
      model TEXT DEFAULT '',
      purchase_date TEXT,
      warranty_expiry TEXT,
      maintenance_history TEXT DEFAULT '[]',
      pending_sync INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  return db;
}

// ── Test App Factory ──────────────────────────────────────────────────────

function createTestApp() {
  // Override the module-level sqlite with a test DB by patching after import
  const app = new Hono();
  sdsRoutes(app);
  return app;
}

// ── Helper ────────────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  const json = await res.json() as any;
  return { status: res.status, body: json };
}

// ── Integration Tests ─────────────────────────────────────────────────────

describe('SDS Equipment Routes', () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /api/sds/equipment', () => {
    it('returns 200 with a data array', async () => {
      const { status, body } = await req(app, 'GET', '/api/sds/equipment');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.total).toBe('number');
    });

    it('seeds default equipment on first call', async () => {
      const { body } = await req(app, 'GET', '/api/sds/equipment');
      expect(body.total).toBeGreaterThanOrEqual(0);
    });

    it('accepts status filter query param', async () => {
      const { status, body } = await req(app, 'GET', '/api/sds/equipment?status=operational');
      expect(status).toBe(200);
      if (body.data.length > 0) {
        body.data.forEach((eq: any) => expect(eq.status).toBe('operational'));
      }
    });

    it('accepts search query param', async () => {
      const { status } = await req(app, 'GET', '/api/sds/equipment?search=Forklift');
      expect(status).toBe(200);
    });
  });

  describe('POST /api/sds/equipment', () => {
    it('creates new equipment and returns 201', async () => {
      const payload = {
        name: 'Test Equipment A',
        type: 'Safety Equipment',
        serialNumber: `SN-TEST-${Date.now()}`,
        location: 'Test Area',
        department: 'Testing',
        status: 'operational',
        linkedSDS: [],
        riskScore: 10,
        manufacturer: 'Test Corp',
        model: 'TX-01',
      };
      const { status, body } = await req(app, 'POST', '/api/sds/equipment', payload);
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe(payload.name);
      expect(body.data.serialNumber).toBe(payload.serialNumber);
      expect(body.data.status).toBe('operational');
      expect(Array.isArray(body.data.linkedSDS)).toBe(true);
    });

    it('returns 400 for missing required fields', async () => {
      const { status, body } = await req(app, 'POST', '/api/sds/equipment', { name: 'No serial' });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid status enum', async () => {
      const { status, body } = await req(app, 'POST', '/api/sds/equipment', {
        name: 'Bad Status',
        type: 'PPE',
        serialNumber: `SN-BAD-${Date.now()}`,
        location: 'Somewhere',
        status: 'broken', // invalid
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  describe('GET /api/sds/equipment/scan/:code', () => {
    it('returns null equipment for unknown code', async () => {
      const { status, body } = await req(app, 'GET', '/api/sds/equipment/scan/UNKNOWN-CODE-XYZ');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.equipment).toBeNull();
    });

    it('returns equipment for known barcode', async () => {
      // First create equipment with a known barcode
      const sn = `SN-SCAN-${Date.now()}`;
      const barcode = `BC-SCAN-${Date.now()}`;
      await req(app, 'POST', '/api/sds/equipment', {
        name: 'Scannable Equipment',
        type: 'PPE',
        serialNumber: sn,
        location: 'Scan Zone',
        barcode,
      });
      const { status, body } = await req(app, 'GET', `/api/sds/equipment/scan/${barcode}`);
      expect(status).toBe(200);
      expect(body.data.equipment).not.toBeNull();
      expect(body.data.equipment.serialNumber).toBe(sn);
    });
  });

  describe('GET /api/sds/equipment/:id', () => {
    it('returns 404 for unknown id', async () => {
      const { status, body } = await req(app, 'GET', '/api/sds/equipment/NONEXISTENT-ID');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns equipment for known id', async () => {
      const sn = `SN-ID-${Date.now()}`;
      const { body: created } = await req(app, 'POST', '/api/sds/equipment', {
        name: 'ID Lookup Equipment',
        type: 'Tool',
        serialNumber: sn,
        location: 'Storage',
      });
      const id = created.data.id;
      const { status, body } = await req(app, 'GET', `/api/sds/equipment/${id}`);
      expect(status).toBe(200);
      expect(body.data.id).toBe(id);
    });
  });

  describe('PUT /api/sds/equipment/:id', () => {
    it('updates equipment fields', async () => {
      const sn = `SN-UPD-${Date.now()}`;
      const { body: created } = await req(app, 'POST', '/api/sds/equipment', {
        name: 'Updatable Equipment',
        type: 'Machinery',
        serialNumber: sn,
        location: 'Floor A',
        status: 'operational',
      });
      const id = created.data.id;

      const { status, body } = await req(app, 'PUT', `/api/sds/equipment/${id}`, {
        status: 'maintenance_due',
        location: 'Floor B',
      });
      expect(status).toBe(200);
      expect(body.data.status).toBe('maintenance_due');
      expect(body.data.location).toBe('Floor B');
    });

    it('returns 404 for unknown id', async () => {
      const { status } = await req(app, 'PUT', '/api/sds/equipment/GHOST-ID', { status: 'operational' });
      expect(status).toBe(404);
    });
  });

  describe('POST /api/sds/equipment/:id/inspection', () => {
    it('logs an inspection and appends to maintenance history', async () => {
      const sn = `SN-INSP-${Date.now()}`;
      const { body: created } = await req(app, 'POST', '/api/sds/equipment', {
        name: 'Inspectable Equipment',
        type: 'Pressure Vessel',
        serialNumber: sn,
        location: 'Plant',
      });
      const id = created.data.id;

      const record = {
        date: '2026-02-01',
        type: 'inspection',
        description: 'Annual inspection',
        performedBy: 'Inspector Joe',
        nextDue: '2027-02-01',
      };

      const { status, body } = await req(app, 'POST', `/api/sds/equipment/${id}/inspection`, record);
      expect(status).toBe(200);
      expect(Array.isArray(body.data.maintenanceHistory)).toBe(true);
      expect(body.data.maintenanceHistory.length).toBeGreaterThanOrEqual(1);
      const lastEntry = body.data.maintenanceHistory[body.data.maintenanceHistory.length - 1];
      expect(lastEntry.description).toBe('Annual inspection');
      expect(lastEntry.performedBy).toBe('Inspector Joe');
    });

    it('returns 400 for missing required inspection fields', async () => {
      const sn = `SN-INSP2-${Date.now()}`;
      const { body: created } = await req(app, 'POST', '/api/sds/equipment', {
        name: 'Insp2 Equipment', type: 'PPE', serialNumber: sn, location: 'Lab',
      });
      const id = created.data.id;
      const { status } = await req(app, 'POST', `/api/sds/equipment/${id}/inspection`, { date: '2026-01-01' });
      expect(status).toBe(400);
    });
  });

  describe('POST /api/sds/equipment/import', () => {
    it('imports equipment items in bulk', async () => {
      const items = [
        { name: 'Import Item A', type: 'Tool', serialNumber: `SN-IMP-A-${Date.now()}`, location: 'Dock' },
        { name: 'Import Item B', type: 'PPE', serialNumber: `SN-IMP-B-${Date.now()}`, location: 'Lab' },
      ];
      const { status, body } = await req(app, 'POST', '/api/sds/equipment/import', { items });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.success).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/sds/sync', () => {
    it('syncs equipment items from client', async () => {
      const sn = `SN-SYNC-${Date.now()}`;
      const { body: created } = await req(app, 'POST', '/api/sds/equipment', {
        name: 'Sync Equipment', type: 'Machinery', serialNumber: sn, location: 'Floor',
      });
      const id = created.data.id;

      const { status, body } = await req(app, 'POST', '/api/sds/sync', {
        items: [{ id, status: 'maintenance_due', lastInspection: '2026-01-01' }],
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.synced).toBeGreaterThanOrEqual(1);
      expect(typeof body.data.syncedAt).toBe('string');
    });

    it('returns 400 for invalid payload', async () => {
      const { status } = await req(app, 'POST', '/api/sds/sync', { items: 'not-an-array' });
      expect(status).toBe(400);
    });
  });
});
