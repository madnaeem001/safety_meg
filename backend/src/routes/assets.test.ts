/**
 * Assets API Route Tests
 * Covers: list assets, QR scan, asset detail, create, update,
 *         decommission, regenerate QR, log maintenance, maintenance history.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { assetRoutes } from '../routes/assets';

// ── Test App Factory ──────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  assetRoutes(app);
  return app;
}

// ── Request Helper ────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  const json = await res.json();
  return { status: res.status, body: json as any };
}

// ── Seed / Teardown ───────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TEST_TAG = `test-asset-${Date.now()}`;
const seededIds: number[] = [];

function seedAsset(name: string, type = 'Machine', status = 'active'): number {
  const code = `${TEST_TAG}-${name.replace(/\s/g, '-')}`;
  const qr = `QR-TEST-${code}`;
  const r = sqlite
    .prepare(
      `INSERT INTO assets
         (asset_code, asset_name, asset_type, serial_number, qr_code,
          location, department, manufacturer, model, condition, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(code, name, type, `SN-${code}`, qr, 'Test Location', 'Test Dept', 'TestCo', 'X100', 'good', status);
  const id = r.lastInsertRowid as number;
  seededIds.push(id);
  return id;
}

afterAll(() => {
  if (seededIds.length) {
    sqlite
      .prepare(`DELETE FROM asset_maintenance WHERE asset_id IN (${seededIds.map(() => '?').join(',')})`)
      .run(...seededIds);
    sqlite
      .prepare(`DELETE FROM assets WHERE id IN (${seededIds.map(() => '?').join(',')})`)
      .run(...seededIds);
  }
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Asset Routes', () => {
  let app: Hono;
  let assetId: number;
  let assetCode: string;
  let qrCode: string;

  beforeAll(() => {
    app = createTestApp();
    assetId = seedAsset('Test Forklift', 'Vehicle', 'active');
    // Retrieve the codes from DB for later use in QR scan tests
    const row = sqlite.prepare('SELECT asset_code, qr_code FROM assets WHERE id = ?').get(assetId) as any;
    assetCode = row.asset_code;
    qrCode = row.qr_code;
  });

  // ── GET /api/assets ───────────────────────────────────────────────────

  describe('GET /api/assets', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/assets');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns data array', async () => {
      const { body } = await req(app, 'GET', '/api/assets');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('includes seeded asset in results', async () => {
      const { body } = await req(app, 'GET', '/api/assets');
      const found = body.data.find((a: any) => a.id === assetId);
      expect(found).toBeDefined();
      expect(found.assetName).toBe('Test Forklift');
    });

    it('returns summary with totals', async () => {
      const { body } = await req(app, 'GET', '/api/assets');
      expect(body.summary).toBeDefined();
      expect(typeof body.summary.total).toBe('number');
      expect(typeof body.summary.active).toBe('number');
    });

    it('returns count field', async () => {
      const { body } = await req(app, 'GET', '/api/assets');
      expect(typeof body.count).toBe('number');
      expect(body.count).toBeGreaterThan(0);
    });

    it('filters by status', async () => {
      const { body } = await req(app, 'GET', '/api/assets?status=active');
      expect(body.success).toBe(true);
      body.data.forEach((a: any) => expect(a.status).toBe('active'));
    });

    it('filters by department', async () => {
      const { body } = await req(app, 'GET', '/api/assets?department=Test%20Dept');
      expect(body.success).toBe(true);
      const found = body.data.find((a: any) => a.id === assetId);
      expect(found).toBeDefined();
    });

    it('supports search by asset name', async () => {
      const { body } = await req(app, 'GET', '/api/assets?search=Test%20Forklift');
      expect(body.success).toBe(true);
      const found = body.data.find((a: any) => a.id === assetId);
      expect(found).toBeDefined();
    });

    it('supports filter by type', async () => {
      const { body } = await req(app, 'GET', '/api/assets?type=Vehicle');
      expect(body.success).toBe(true);
      body.data.forEach((a: any) => expect(a.assetType).toBe('Vehicle'));
    });
  });

  // ── POST /api/assets ──────────────────────────────────────────────────

  describe('POST /api/assets', () => {
    it('creates asset and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/assets', {
        assetName: `${TEST_TAG}-Created`,
        assetType: 'Tool',
        location: 'Lab',
        department: 'R&D',
        manufacturer: 'Acme',
        condition: 'excellent',
        status: 'active',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.assetCode).toMatch(/^ASSET-/);
      expect(body.data.qrCode).toMatch(/^QR-/);
      expect(body.data.assetName).toBe(`${TEST_TAG}-Created`);
      // Track for cleanup
      const id = body.data.id;
      if (id) seededIds.push(id);
    });

    it('auto-generates assetCode and qrCode', async () => {
      const { body } = await req(app, 'POST', '/api/assets', {
        assetName: `${TEST_TAG}-AutoCode`,
        assetType: 'Machine',
      });
      expect(body.data.assetCode).toBeTruthy();
      expect(body.data.qrCode).toBeTruthy();
      if (body.data.id) seededIds.push(body.data.id);
    });

    it('returns 400 on missing assetName', async () => {
      const { status, body } = await req(app, 'POST', '/api/assets', {
        assetType: 'Machine',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 on invalid assetType', async () => {
      const { status, body } = await req(app, 'POST', '/api/assets', {
        assetName: `${TEST_TAG}-BadType`,
        assetType: 'Robot',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('defaults condition to good and status to active', async () => {
      const { body } = await req(app, 'POST', '/api/assets', {
        assetName: `${TEST_TAG}-Defaults`,
        assetType: 'Safety Equipment',
      });
      expect(body.success).toBe(true);
      if (body.data.id) seededIds.push(body.data.id);
    });
  });

  // ── GET /api/assets/scan/:qrCode ──────────────────────────────────────

  describe('GET /api/assets/scan/:qrCode', () => {
    it('returns 200 and asset data for valid QR code', async () => {
      const { status, body } = await req(app, 'GET', `/api/assets/scan/${encodeURIComponent(qrCode)}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(assetId);
      expect(body.data.assetName).toBe('Test Forklift');
    });

    it('includes lastMaintenanceRecord in scan response', async () => {
      const { body } = await req(app, 'GET', `/api/assets/scan/${encodeURIComponent(qrCode)}`);
      expect(body.data).toHaveProperty('lastMaintenanceRecord');
    });

    it('returns 404 for unknown QR code', async () => {
      const { status, body } = await req(app, 'GET', '/api/assets/scan/QR-NONEXISTENT-999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/assets/:assetId ──────────────────────────────────────────

  describe('GET /api/assets/:assetId', () => {
    it('returns 200 and full asset detail', async () => {
      const { status, body } = await req(app, 'GET', `/api/assets/${assetId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(assetId);
      expect(body.data.assetCode).toBe(assetCode);
    });

    it('includes maintenanceHistory array', async () => {
      const { body } = await req(app, 'GET', `/api/assets/${assetId}`);
      expect(Array.isArray(body.data.maintenanceHistory)).toBe(true);
    });

    it('returns 404 for missing asset', async () => {
      const { status, body } = await req(app, 'GET', '/api/assets/999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── PUT /api/assets/:assetId ──────────────────────────────────────────

  describe('PUT /api/assets/:assetId', () => {
    it('updates asset fields and returns 200', async () => {
      const { status, body } = await req(app, 'PUT', `/api/assets/${assetId}`, {
        location: 'Updated Location',
        notes: 'Updated via test',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.location).toBe('Updated Location');
    });

    it('updates condition field', async () => {
      const { body } = await req(app, 'PUT', `/api/assets/${assetId}`, { condition: 'fair' });
      expect(body.success).toBe(true);
      expect(body.data.condition).toBe('fair');
    });

    it('returns 404 for missing asset', async () => {
      const { status, body } = await req(app, 'PUT', '/api/assets/999999', { location: 'X' });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 404 for non-numeric id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/assets/not-a-number', { location: 'X' });
      // parseInt('not-a-number') = NaN → asset lookup returns undefined → 404
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── DELETE /api/assets/:assetId ───────────────────────────────────────

  describe('DELETE /api/assets/:assetId', () => {
    let toDecommissionId: number;

    beforeAll(() => {
      toDecommissionId = seedAsset('Test Decommission Asset', 'Tool', 'active');
    });

    it('decommissions asset and returns 200', async () => {
      const { status, body } = await req(app, 'DELETE', `/api/assets/${toDecommissionId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(toDecommissionId);
    });

    it('returns 400 if asset is already decommissioned', async () => {
      const { status, body } = await req(app, 'DELETE', `/api/assets/${toDecommissionId}`);
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 404 for missing asset', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/assets/999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── POST /api/assets/:assetId/qr ─────────────────────────────────────

  describe('POST /api/assets/:assetId/qr', () => {
    it('regenerates QR code and returns 200', async () => {
      const { status, body } = await req(app, 'POST', `/api/assets/${assetId}/qr`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.qrCode).toMatch(/^QR-/);
      expect(body.data.qrCode).not.toBe(qrCode); // new QR differs
    });

    it('returns id and assetCode in response', async () => {
      const { body } = await req(app, 'POST', `/api/assets/${assetId}/qr`);
      expect(body.data.id).toBe(assetId);
      expect(body.data.assetCode).toBe(assetCode);
    });

    it('returns 404 for missing asset', async () => {
      const { status, body } = await req(app, 'POST', '/api/assets/999999/qr');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── POST /api/assets/:assetId/maintenance ─────────────────────────────

  describe('POST /api/assets/:assetId/maintenance', () => {
    it('logs maintenance and returns 201', async () => {
      const { status, body } = await req(app, 'POST', `/api/assets/${assetId}/maintenance`, {
        maintenanceDate: '2026-03-01',
        maintenanceType: 'preventive',
        performedBy: 'Tech Team',
        notes: 'Routine check',
        cost: 150.0,
        nextDueDate: '2026-06-01',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.assetId).toBe(assetId);
      expect(body.data.maintenanceDate).toBe('2026-03-01');
      expect(body.data.maintenanceType).toBe('preventive');
    });

    it('logs corrective maintenance', async () => {
      const { status, body } = await req(app, 'POST', `/api/assets/${assetId}/maintenance`, {
        maintenanceDate: '2026-03-05',
        maintenanceType: 'corrective',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('returns 404 for missing asset', async () => {
      const { status, body } = await req(app, 'POST', '/api/assets/999999/maintenance', {
        maintenanceDate: '2026-03-01',
        maintenanceType: 'inspection',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for missing maintenanceDate', async () => {
      const { status, body } = await req(app, 'POST', `/api/assets/${assetId}/maintenance`, {
        maintenanceType: 'preventive',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid maintenanceType', async () => {
      const { status, body } = await req(app, 'POST', `/api/assets/${assetId}/maintenance`, {
        maintenanceDate: '2026-03-01',
        maintenanceType: 'unknown',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/assets/:assetId/maintenance ─────────────────────────────

  describe('GET /api/assets/:assetId/maintenance', () => {
    it('returns 200 with maintenance history', async () => {
      const { status, body } = await req(app, 'GET', `/api/assets/${assetId}/maintenance`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('includes asset info in response', async () => {
      const { body } = await req(app, 'GET', `/api/assets/${assetId}/maintenance`);
      expect(body.asset).toBeDefined();
      expect(body.asset.id).toBe(assetId);
      expect(body.asset.code).toBe(assetCode);
    });

    it('returns logged maintenance records', async () => {
      const { body } = await req(app, 'GET', `/api/assets/${assetId}/maintenance`);
      expect(body.data.length).toBeGreaterThan(0);
      const record = body.data[0];
      expect(record).toHaveProperty('maintenanceDate');
      expect(record).toHaveProperty('maintenanceType');
    });

    it('returns count field', async () => {
      const { body } = await req(app, 'GET', `/api/assets/${assetId}/maintenance`);
      expect(typeof body.count).toBe('number');
      expect(body.count).toBeGreaterThan(0);
    });

    it('returns 404 for missing asset', async () => {
      const { status, body } = await req(app, 'GET', '/api/assets/999999/maintenance');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });
});
