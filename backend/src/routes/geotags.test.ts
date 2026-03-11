/**
 * Geotag API Route Tests
 * Tests geotag save, list, sync, and zones endpoints.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { geotagRoutes } from '../routes/geotags';

// ── Test App Factory ──────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  geotagRoutes(app);
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

function makeGeotag(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    latitude: 37.775,
    longitude: -122.419,
    accuracy: 5.0,
    recordType: 'observation',
    notes: 'Test geotag',
    capturedBy: 'test-user',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('Geotag Routes', () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /api/geotags', () => {
    it('returns 200 with data array', async () => {
      const { status, body } = await req(app, 'GET', '/api/geotags');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.total).toBe('number');
    });

    it('accepts recordType filter', async () => {
      const { status } = await req(app, 'GET', '/api/geotags?recordType=incident');
      expect(status).toBe(200);
    });

    it('accepts limit and offset pagination', async () => {
      const { status, body } = await req(app, 'GET', '/api/geotags?limit=5&offset=0');
      expect(status).toBe(200);
      expect(body.limit).toBe(5);
      expect(body.offset).toBe(0);
    });
  });

  describe('POST /api/geotags', () => {
    it('saves a geotag and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/geotags', makeGeotag());
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.latitude).toBeCloseTo(37.775);
      expect(body.data.syncStatus).toBe('synced');
    });

    it('accepts all valid record types', async () => {
      const types = ['incident', 'observation', 'inspection', 'hazard', 'near_miss', 'manual'];
      for (const recordType of types) {
        const { status } = await req(app, 'POST', '/api/geotags', makeGeotag({ recordType }));
        expect(status).toBe(201);
      }
    });

    it('returns 400 for missing latitude', async () => {
      const { status, body } = await req(app, 'POST', '/api/geotags', {
        longitude: -122.419,
        recordType: 'manual',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid recordType', async () => {
      const { status } = await req(app, 'POST', '/api/geotags', makeGeotag({ recordType: 'unknown_type' }));
      expect(status).toBe(400);
    });

    it('returns 400 for out-of-range latitude', async () => {
      const { status } = await req(app, 'POST', '/api/geotags', makeGeotag({ latitude: 200 }));
      expect(status).toBe(400);
    });

    it('saves optional fields: zone, facilityArea, address, linkedRecordId', async () => {
      const gt = makeGeotag({
        zone: 'ZONE001',
        facilityArea: 'Warehouse A',
        address: '123 Main St',
        linkedRecordId: 'INC-001',
        linkedRecordType: 'incident',
      });
      const { status, body } = await req(app, 'POST', '/api/geotags', gt);
      expect(status).toBe(201);
      expect(body.data.zone).toBe('ZONE001');
      expect(body.data.facilityArea).toBe('Warehouse A');
      expect(body.data.linkedRecordId).toBe('INC-001');
    });
  });

  describe('POST /api/geotags/sync', () => {
    it('syncs a batch of geotags', async () => {
      const geotags = [
        makeGeotag({ id: `GT-SYNC-A-${Date.now()}`, recordType: 'inspection' }),
        makeGeotag({ id: `GT-SYNC-B-${Date.now()}`, recordType: 'hazard', latitude: 37.776 }),
      ];
      const { status, body } = await req(app, 'POST', '/api/geotags/sync', { geotags });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.synced).toBeGreaterThanOrEqual(1);
      expect(typeof body.data.syncedAt).toBe('string');
    });

    it('returns 400 for invalid payload', async () => {
      const { status } = await req(app, 'POST', '/api/geotags/sync', { geotags: 'not-array' });
      expect(status).toBe(400);
    });

    it('handles empty batch gracefully', async () => {
      const { status, body } = await req(app, 'POST', '/api/geotags/sync', { geotags: [] });
      expect(status).toBe(200);
      expect(body.data.synced).toBe(0);
    });

    it('is idempotent — syncing same id twice does not error', async () => {
      const id = `GT-IDEM-${Date.now()}`;
      const gt = makeGeotag({ id });
      await req(app, 'POST', '/api/geotags/sync', { geotags: [gt] });
      const { status } = await req(app, 'POST', '/api/geotags/sync', { geotags: [gt] });
      expect(status).toBe(200);
    });
  });

  describe('GET /api/geotags/zones', () => {
    it('returns 200 with zones array', async () => {
      const { status, body } = await req(app, 'GET', '/api/geotags/zones');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns zones with required fields', async () => {
      const { body } = await req(app, 'GET', '/api/geotags/zones');
      if (body.data.length > 0) {
        const zone = body.data[0];
        expect(typeof zone.id).toBe('string');
        expect(typeof zone.name).toBe('string');
        expect(Array.isArray(zone.polygon)).toBe(true);
        expect(['low', 'medium', 'high', 'critical']).toContain(zone.riskLevel);
        expect(Array.isArray(zone.requiresPPE)).toBe(true);
        expect(Array.isArray(zone.hazardTypes)).toBe(true);
      }
    });
  });
});
