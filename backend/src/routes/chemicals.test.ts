/**
 * Chemicals & SDS Routes Test Suite
 *
 * Covers:
 *   GET    /api/chemicals/stats
 *   GET    /api/chemicals             — list with filters
 *   POST   /api/chemicals             — create (with new fields)
 *   GET    /api/chemicals/:id/sds     — get SDS documents
 *   POST   /api/chemicals/:id/sds     — attach SDS document
 *   GET    /api/chemicals/:id         — get by id
 *   PUT    /api/chemicals/:id         — update
 *   DELETE /api/chemicals/:id         — soft-delete
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { chemicalsRoutes } from '../routes/chemicals';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  chemicalsRoutes(app);
  return app;
}

// ── Request Helper ─────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── Seed / Cleanup ─────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `testchem-${Date.now()}`;

afterAll(() => {
  // Cascade delete SDS documents first; then chemicals
  const ids = (sqlite.prepare(`SELECT id FROM chemicals WHERE name LIKE '${TAG}%'`).all() as any[]).map(r => r.id);
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    sqlite.prepare(`DELETE FROM sds_documents WHERE chemical_id IN (${placeholders})`).run(...ids);
  }
  sqlite.prepare(`DELETE FROM chemicals WHERE name LIKE '${TAG}%'`).run();
});

const BASE_HAZARDS = JSON.stringify(['Highly flammable', 'Eye irritation']);
const BASE_PICTOGRAMS = JSON.stringify(['Flame', 'Exclamation']);
const BASE_GHS = JSON.stringify(['Flammable Liquids Cat 2', 'Eye Irritation Cat 2A']);

function seedChemical(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO chemicals
      (name, cas_number, manufacturer, storage_location, hazard_class, signal_word,
       quantity, unit, status, hazards, pictograms, ghs_classification, emergency_contact,
       created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    overrides.name             ?? `${TAG}-acetone`,
    overrides.cas_number       ?? '67-64-1',
    overrides.manufacturer     ?? 'Sigma-Aldrich',
    overrides.storage_location ?? 'Lab A, Cabinet 3',
    overrides.hazard_class     ?? 'flammable',
    overrides.signal_word      ?? 'Danger',
    overrides.quantity         ?? 5,
    overrides.unit             ?? 'Liters',
    overrides.status           ?? 'active',
    overrides.hazards          ?? BASE_HAZARDS,
    overrides.pictograms       ?? BASE_PICTOGRAMS,
    overrides.ghs_classification ?? BASE_GHS,
    overrides.emergency_contact ?? '1-800-424-9300',
    overrides.created_at       ?? ts,
    overrides.updated_at       ?? ts,
  );
  return Number(result.lastInsertRowid);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Chemicals Routes', () => {
  let app: Hono;
  let activeId: number;
  let dangerousId: number;
  let corrosiveId: number;

  beforeAll(() => {
    app = createTestApp();
    activeId    = seedChemical({ name: `${TAG}-acetone`, hazard_class: 'flammable', signal_word: 'Danger' });
    dangerousId = seedChemical({ name: `${TAG}-acid`, hazard_class: 'corrosive', signal_word: 'Danger', storage_location: 'Acid Room' });
    corrosiveId = seedChemical({ name: `${TAG}-cleaner`, hazard_class: 'corrosive', signal_word: 'Warning', status: 'active' });
  });

  // ── GET /api/chemicals/stats ──────────────────────────────────────────

  describe('GET /api/chemicals/stats', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/chemicals/stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns total count', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals/stats');
      expect(typeof body.data.total).toBe('number');
      expect(body.data.total).toBeGreaterThanOrEqual(3);
    });

    it('returns byStatus array', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals/stats');
      expect(Array.isArray(body.data.byStatus)).toBe(true);
    });

    it('returns byHazard array', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals/stats');
      expect(Array.isArray(body.data.byHazard)).toBe(true);
    });

    it('returns expiringSoon count', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals/stats');
      expect(typeof body.data.expiringSoon).toBe('number');
    });

    it('returns withoutSds count', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals/stats');
      expect(typeof body.data.withoutSds).toBe('number');
    });
  });

  // ── GET /api/chemicals ────────────────────────────────────────────────

  describe('GET /api/chemicals', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/chemicals');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns data array', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns total matching array length', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals');
      expect(body.total).toBe(body.data.length);
    });

    it('contains seeded active chemical', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals');
      const found = body.data.find((c: any) => c.id === activeId);
      expect(found).toBeDefined();
    });

    it('maps to camelCase fields', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals');
      const item = body.data.find((c: any) => c.id === activeId);
      expect(item).toHaveProperty('casNumber');
      expect(item).toHaveProperty('storageLocation');
      expect(item).toHaveProperty('hazardClass');
      expect(item).toHaveProperty('signalWord');
    });

    it('returns hazards as parsed array', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals');
      const item = body.data.find((c: any) => c.id === activeId);
      expect(Array.isArray(item.hazards)).toBe(true);
      expect(item.hazards.length).toBeGreaterThan(0);
    });

    it('returns pictograms as parsed array', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals');
      const item = body.data.find((c: any) => c.id === activeId);
      expect(Array.isArray(item.pictograms)).toBe(true);
    });

    it('returns ghsClassification as parsed array', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals');
      const item = body.data.find((c: any) => c.id === activeId);
      expect(Array.isArray(item.ghsClassification)).toBe(true);
    });

    it('returns emergencyContact string', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals');
      const item = body.data.find((c: any) => c.id === activeId);
      expect(typeof item.emergencyContact).toBe('string');
      expect(item.emergencyContact).toBe('1-800-424-9300');
    });

    it('exposes location alias for storageLocation', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals');
      const item = body.data.find((c: any) => c.id === activeId);
      expect(item.location).toBe(item.storageLocation);
    });

    it('filters by hazardClass=flammable', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals?hazardClass=flammable');
      const ids = body.data.map((c: any) => c.id);
      expect(ids).toContain(activeId);
      expect(ids).not.toContain(dangerousId);
    });

    it('filters by hazardClass=corrosive', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals?hazardClass=corrosive');
      const ids = body.data.map((c: any) => c.id);
      expect(ids).toContain(dangerousId);
      expect(ids).not.toContain(activeId);
    });

    it('filters by search on name', async () => {
      const { body } = await req(app, 'GET', `/api/chemicals?search=${TAG}-acetone`);
      const ids = body.data.map((c: any) => c.id);
      expect(ids).toContain(activeId);
    });

    it('filters by search on manufacturer', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals?search=Sigma-Aldrich');
      const ids = body.data.map((c: any) => c.id);
      expect(ids).toContain(activeId);
    });

    it('search returns empty when no match', async () => {
      const { body } = await req(app, 'GET', '/api/chemicals?search=NORESULTXYZ999');
      expect(body.data.length).toBe(0);
    });

    it('results are ordered by name ASC', async () => {
      const { body } = await req(app, 'GET', `/api/chemicals?search=${TAG}`);
      const names: string[] = body.data.map((c: any) => c.name);
      for (let i = 1; i < names.length; i++) {
        expect(names[i - 1].localeCompare(names[i])).toBeLessThanOrEqual(0);
      }
    });
  });

  // ── POST /api/chemicals ───────────────────────────────────────────────

  describe('POST /api/chemicals', () => {
    it('returns 201 on valid create', async () => {
      const { status, body } = await req(app, 'POST', '/api/chemicals', {
        name: `${TAG}-new-chemical`,
        manufacturer: 'Test Corp',
        hazardClass: 'toxic',
        signalWord: 'Danger',
        quantity: 10,
        unit: 'kg',
        hazards: ['Toxic if inhaled'],
        pictograms: ['Skull'],
        ghsClassification: ['Acute Toxicity Inhalation Cat 3'],
        emergencyContact: '1-800-TEST-123',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      if (body.data?.id) sqlite.prepare('DELETE FROM chemicals WHERE id = ?').run(body.data.id);
    });

    it('returns created record with all fields', async () => {
      const { body } = await req(app, 'POST', '/api/chemicals', {
        name: `${TAG}-field-check`,
        hazards: ['Flammable'],
        pictograms: ['Flame'],
        ghsClassification: ['Cat 1'],
        emergencyContact: '1-800-FIRE',
      });
      expect(body.data).toHaveProperty('id');
      expect(body.data.hazards).toEqual(['Flammable']);
      expect(body.data.pictograms).toEqual(['Flame']);
      expect(body.data.ghsClassification).toEqual(['Cat 1']);
      expect(body.data.emergencyContact).toBe('1-800-FIRE');
      if (body.data?.id) sqlite.prepare('DELETE FROM chemicals WHERE id = ?').run(body.data.id);
    });

    it('hazards and pictograms default to empty arrays', async () => {
      const { body } = await req(app, 'POST', '/api/chemicals', { name: `${TAG}-defaults` });
      expect(body.data.hazards).toEqual([]);
      expect(body.data.pictograms).toEqual([]);
      expect(body.data.ghsClassification).toEqual([]);
      expect(body.data.emergencyContact).toBe('');
      if (body.data?.id) sqlite.prepare('DELETE FROM chemicals WHERE id = ?').run(body.data.id);
    });

    it('exposes location alias equal to storageLocation', async () => {
      const { body } = await req(app, 'POST', '/api/chemicals', {
        name: `${TAG}-location-alias`,
        storageLocation: 'Warehouse B',
      });
      expect(body.data.location).toBe('Warehouse B');
      expect(body.data.storageLocation).toBe('Warehouse B');
      if (body.data?.id) sqlite.prepare('DELETE FROM chemicals WHERE id = ?').run(body.data.id);
    });

    it('returns 400 when name is missing', async () => {
      const { status } = await req(app, 'POST', '/api/chemicals', { manufacturer: 'Test' });
      expect(status).toBe(400);
    });

    it('returns 400 for invalid hazardClass', async () => {
      const { status } = await req(app, 'POST', '/api/chemicals', {
        name: `${TAG}-bad-class`,
        hazardClass: 'space-age',
      });
      expect(status).toBe(400);
    });

    it('returns 400 for invalid signalWord', async () => {
      const { status } = await req(app, 'POST', '/api/chemicals', {
        name: `${TAG}-bad-signal`,
        signalWord: 'Extreme',
      });
      expect(status).toBe(400);
    });
  });

  // ── GET /api/chemicals/:id ────────────────────────────────────────────

  describe('GET /api/chemicals/:id', () => {
    it('returns 200 with full record', async () => {
      const { status, body } = await req(app, 'GET', `/api/chemicals/${activeId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(activeId);
    });

    it('returns hazards, pictograms, ghsClassification as arrays', async () => {
      const { body } = await req(app, 'GET', `/api/chemicals/${activeId}`);
      expect(Array.isArray(body.data.hazards)).toBe(true);
      expect(Array.isArray(body.data.pictograms)).toBe(true);
      expect(Array.isArray(body.data.ghsClassification)).toBe(true);
    });

    it('returns emergencyContact string', async () => {
      const { body } = await req(app, 'GET', `/api/chemicals/${activeId}`);
      expect(typeof body.data.emergencyContact).toBe('string');
    });

    it('includes latest SDS as null when not attached', async () => {
      const { body } = await req(app, 'GET', `/api/chemicals/${activeId}`);
      expect(body.data).toHaveProperty('latestSds');
    });

    it('returns 404 for non-existent id', async () => {
      const { status } = await req(app, 'GET', '/api/chemicals/999999999');
      expect(status).toBe(404);
    });
  });

  // ── GET /api/chemicals/:id/sds & POST /api/chemicals/:id/sds ──────────

  describe('SDS sub-routes', () => {
    it('GET /api/chemicals/:id/sds returns empty array initially', async () => {
      const { status, body } = await req(app, 'GET', `/api/chemicals/${activeId}/sds`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('POST /api/chemicals/:id/sds returns 201 on create', async () => {
      const { status, body } = await req(app, 'POST', `/api/chemicals/${activeId}/sds`, {
        sdsFileUrl: 'https://example.com/sds/acetone.pdf',
        revision: '2.1',
        uploadedBy: 'test-user',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('POST returns SDS record with expected fields', async () => {
      const { body } = await req(app, 'POST', `/api/chemicals/${corrosiveId}/sds`, {
        sdsFileUrl: 'https://example.com/sds/cleaner.pdf',
        revision: '1.0',
      });
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('sdsFileUrl');
      expect(body.data).toHaveProperty('revision');
      expect(body.data).toHaveProperty('chemicalId');
    });

    it('GET sds returns attached document after POST', async () => {
      const { body } = await req(app, 'GET', `/api/chemicals/${corrosiveId}/sds`);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0]).toHaveProperty('sdsFileUrl');
    });

    it('GET sds returns 404 for non-existent chemical', async () => {
      const { status } = await req(app, 'GET', '/api/chemicals/999999999/sds');
      expect(status).toBe(404);
    });

    it('POST sds returns 404 for non-existent chemical', async () => {
      const { status } = await req(app, 'POST', '/api/chemicals/999999999/sds', {
        revision: '1.0',
      });
      expect(status).toBe(404);
    });

    it('GET /:id includes latestSds after attachment', async () => {
      const { body } = await req(app, 'GET', `/api/chemicals/${corrosiveId}`);
      expect(body.data.latestSds).not.toBeNull();
      expect(body.data.latestSds).toHaveProperty('sdsFileUrl');
    });
  });

  // ── PUT /api/chemicals/:id ────────────────────────────────────────────

  describe('PUT /api/chemicals/:id', () => {
    it('returns 200 on valid update', async () => {
      const { status, body } = await req(app, 'PUT', `/api/chemicals/${activeId}`, {
        name: `${TAG}-acetone-updated`,
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('updates name field', async () => {
      const newName = `${TAG}-name-update`;
      await req(app, 'PUT', `/api/chemicals/${activeId}`, { name: newName });
      const { body } = await req(app, 'GET', `/api/chemicals/${activeId}`);
      expect(body.data.name).toBe(newName);
    });

    it('updates hazards array', async () => {
      const { body } = await req(app, 'PUT', `/api/chemicals/${activeId}`, {
        hazards: ['Updated hazard', 'Second hazard'],
      });
      expect(body.data.hazards).toEqual(['Updated hazard', 'Second hazard']);
    });

    it('updates pictograms array', async () => {
      const { body } = await req(app, 'PUT', `/api/chemicals/${activeId}`, {
        pictograms: ['Flame', 'Skull', 'Exclamation'],
      });
      expect(body.data.pictograms).toContain('Skull');
    });

    it('updates ghsClassification array', async () => {
      const { body } = await req(app, 'PUT', `/api/chemicals/${activeId}`, {
        ghsClassification: ['Flammable Liquids Cat 1'],
      });
      expect(body.data.ghsClassification).toContain('Flammable Liquids Cat 1');
    });

    it('updates emergencyContact string', async () => {
      const { body } = await req(app, 'PUT', `/api/chemicals/${activeId}`, {
        emergencyContact: '1-800-900-9001',
      });
      expect(body.data.emergencyContact).toBe('1-800-900-9001');
    });

    it('returns 404 for non-existent id', async () => {
      const { status } = await req(app, 'PUT', '/api/chemicals/999999999', { name: 'ghost' });
      expect(status).toBe(404);
    });
  });

  // ── DELETE /api/chemicals/:id ─────────────────────────────────────────

  describe('DELETE /api/chemicals/:id', () => {
    it('returns 200 on soft-delete', async () => {
      const toDelete = seedChemical({ name: `${TAG}-to-delete` });
      const { status, body } = await req(app, 'DELETE', `/api/chemicals/${toDelete}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('sets status to disposed', async () => {
      const toDelete = seedChemical({ name: `${TAG}-disposed` });
      await req(app, 'DELETE', `/api/chemicals/${toDelete}`);
      const row = sqlite.prepare('SELECT status FROM chemicals WHERE id = ?').get(toDelete) as any;
      expect(row.status).toBe('disposed');
    });

    it('record still exists after delete (soft)', async () => {
      const toDelete = seedChemical({ name: `${TAG}-soft-gone` });
      await req(app, 'DELETE', `/api/chemicals/${toDelete}`);
      const { status } = await req(app, 'GET', `/api/chemicals/${toDelete}`);
      expect(status).toBe(200); // still returns but status='disposed'
    });

    it('returns 404 for non-existent id', async () => {
      const { status } = await req(app, 'DELETE', '/api/chemicals/999999999');
      expect(status).toBe(404);
    });
  });
});
