/**
 * Contractors Routes Test Suite
 *
 * Covers:
 *   GET    /api/contractors             — list with filters
 *   POST   /api/contractors             — create
 *   PUT    /api/contractors/:id         — update (new route)
 *   GET    /api/contractors/:id/permits — contractor permits list
 *   POST   /api/contractors/:id/permits — create contractor permit
 *   GET    /api/contractors/:id         — get by id
 *   DELETE /api/contractors/:id         — delete
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { contractorRoutes } from '../routes/contractors';

// ── App Factory ────────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  contractorRoutes(app);
  return app;
}

// ── Request Helper ─────────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── Seed / Cleanup ─────────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `testcontractor-${Date.now()}`;

function seedContractor(overrides: Record<string, unknown> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO contractors
      (name, company, email, phone, specialty, status, trade_type, contact_person,
       insured_until, safety_rating, workers_count, certifications, last_safety_audit,
       incident_history, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.name            ?? `${TAG}-worker`,
    overrides.company         ?? `${TAG}-Corp`,
    overrides.email           ?? `${TAG}@example.com`,
    overrides.phone           ?? '+1 555-9999',
    overrides.specialty       ?? 'Welding',
    overrides.status          ?? 'active',
    overrides.trade_type      ?? 'Welding & Fabrication',
    overrides.contact_person  ?? `${TAG}-contact`,
    overrides.insured_until   ?? '2027-01-01',
    overrides.safety_rating   ?? 4.5,
    overrides.workers_count   ?? 10,
    overrides.certifications  ?? '["OSHA 30","AWS Certified"]',
    overrides.last_safety_audit ?? '2026-01-01',
    overrides.incident_history ?? 0,
    overrides.created_at      ?? ts,
    overrides.updated_at      ?? ts,
  );
  return Number(result.lastInsertRowid);
}

let activeId: number;
let suspendedId: number;

afterAll(() => {
  // Cleanup contractor_permits first, then contractors
  const ids = (sqlite.prepare(`SELECT id FROM contractors WHERE company LIKE '${TAG}%'`).all() as any[]).map(r => r.id);
  if (ids.length > 0) {
    const ph = ids.map(() => '?').join(',');
    sqlite.prepare(`DELETE FROM contractor_permits WHERE contractor_id IN (${ph})`).run(...ids);
  }
  sqlite.prepare(`DELETE FROM contractors WHERE company LIKE '${TAG}%'`).run();
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Contractors Routes', () => {
  let app: Hono;
  let createdId: number;

  beforeAll(() => {
    app = createTestApp();
    activeId    = seedContractor({ company: `${TAG}-Corp-A`, status: 'active',    trade_type: 'Welding' });
    suspendedId = seedContractor({ company: `${TAG}-Corp-S`, status: 'suspended', trade_type: 'Electrical' });
  });

  // ── GET /api/contractors ───────────────────────────────────────────────────

  describe('GET /api/contractors', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/contractors');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns data array', async () => {
      const { body } = await req(app, 'GET', '/api/contractors');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('contains seeded active contractor', async () => {
      const { body } = await req(app, 'GET', '/api/contractors');
      const found = body.data.find((c: any) => c.id === activeId);
      expect(found).toBeDefined();
    });

    it('maps to expected frontend shape', async () => {
      const { body } = await req(app, 'GET', '/api/contractors');
      const item = body.data.find((c: any) => c.id === activeId);
      expect(item).toHaveProperty('companyName');
      expect(item).toHaveProperty('contactPerson');
      expect(item).toHaveProperty('tradeType');
      expect(item).toHaveProperty('insuranceExpiry');
      expect(item).toHaveProperty('safetyRating');
      expect(item).toHaveProperty('workersCount');
      expect(item).toHaveProperty('activePermits');
      expect(item).toHaveProperty('certifications');
      expect(item).toHaveProperty('incidentHistory');
    });

    it('certifications is parsed array', async () => {
      const { body } = await req(app, 'GET', '/api/contractors');
      const item = body.data.find((c: any) => c.id === activeId);
      expect(Array.isArray(item.certifications)).toBe(true);
      expect(item.certifications.length).toBeGreaterThan(0);
    });

    it('activePermits is numeric', async () => {
      const { body } = await req(app, 'GET', '/api/contractors');
      const item = body.data.find((c: any) => c.id === activeId);
      expect(typeof item.activePermits).toBe('number');
    });

    it('filters by status=active', async () => {
      const { body } = await req(app, 'GET', '/api/contractors?status=active');
      expect(body.data.every((c: any) => c.status === 'active')).toBe(true);
    });

    it('filters by status=suspended', async () => {
      const { body } = await req(app, 'GET', '/api/contractors?status=suspended');
      const found = body.data.find((c: any) => c.id === suspendedId);
      expect(found).toBeDefined();
    });

    it('returns total matching data.length', async () => {
      const { body } = await req(app, 'GET', '/api/contractors');
      expect(body.total).toBe(body.data.length);
    });
  });

  // ── POST /api/contractors ──────────────────────────────────────────────────

  describe('POST /api/contractors', () => {
    it('creates a contractor and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/contractors', {
        name: `${TAG}-new`,
        company: `${TAG}-NewCorp`,
        email: `${TAG}-new@test.com`,
        phone: '+1 555-1234',
        tradeType: 'Scaffolding',
        safetyRating: 4.2,
        workersCount: 15,
        certifications: ['SAIA', 'OSHA 10'],
        status: 'active',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      createdId = body.data.id;
      expect(createdId).toBeGreaterThan(0);
    });

    it('created contractor has correct tradeType', async () => {
      const { body } = await req(app, 'GET', `/api/contractors/${createdId}`);
      expect(body.data.tradeType).toBe('Scaffolding');
    });

    it('returns 400 when name missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/contractors', {
        company: `${TAG}-NoCo`,
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when company missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/contractors', {
        name: 'NoCompany Worker',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── PUT /api/contractors/:id ───────────────────────────────────────────────

  describe('PUT /api/contractors/:id', () => {
    it('updates contractor fields and returns 200', async () => {
      const { status, body } = await req(app, 'PUT', `/api/contractors/${activeId}`, {
        safetyRating: 5.0,
        workersCount: 20,
        status: 'active',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.safetyRating).toBe(5.0);
      expect(body.data.workersCount).toBe(20);
    });

    it('preserves unchanged fields after update', async () => {
      const { body } = await req(app, 'GET', `/api/contractors/${activeId}`);
      expect(body.data.companyName).toBeTruthy();
      expect(body.data.tradeType).toBeTruthy();
    });

    it('returns 404 for non-existent contractor', async () => {
      const { status, body } = await req(app, 'PUT', '/api/contractors/999999999', {
        status: 'active',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/contractors/:id ───────────────────────────────────────────────

  describe('GET /api/contractors/:id', () => {
    it('returns correct contractor by id', async () => {
      const { status, body } = await req(app, 'GET', `/api/contractors/${activeId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(activeId);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'GET', '/api/contractors/999999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/contractors/:id/permits ──────────────────────────────────────

  describe('GET /api/contractors/:id/permits', () => {
    it('returns 200 with permits array', async () => {
      const { status, body } = await req(app, 'GET', `/api/contractors/${activeId}/permits`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns 404 for non-existent contractor', async () => {
      const { status } = await req(app, 'GET', '/api/contractors/999999999/permits');
      expect(status).toBe(404);
    });
  });

  // ── POST /api/contractors/:id/permits ─────────────────────────────────────

  describe('POST /api/contractors/:id/permits', () => {
    it('creates a permit for contractor', async () => {
      const { status, body } = await req(app, 'POST', `/api/contractors/${activeId}/permits`, {
        permitType: 'hot-work',
        issuedBy: 'Safety Manager',
        conditions: ['Fire watch required'],
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.permitType).toBe('hot-work');
    });

    it('returns 400 for invalid permitType', async () => {
      const { status, body } = await req(app, 'POST', `/api/contractors/${activeId}/permits`, {
        permitType: 'invalid-type',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 404 for non-existent contractor', async () => {
      const { status } = await req(app, 'POST', '/api/contractors/999999999/permits', {
        permitType: 'general',
      });
      expect(status).toBe(404);
    });
  });

  // ── DELETE /api/contractors/:id ────────────────────────────────────────────

  describe('DELETE /api/contractors/:id', () => {
    it('deletes contractor and returns 200', async () => {
      const tmpId = seedContractor({ company: `${TAG}-ToDelete` });
      const { status, body } = await req(app, 'DELETE', `/api/contractors/${tmpId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('deleted contractor returns 404 on GET', async () => {
      const tmpId = seedContractor({ company: `${TAG}-ToDelete2` });
      await req(app, 'DELETE', `/api/contractors/${tmpId}`);
      const { status } = await req(app, 'GET', `/api/contractors/${tmpId}`);
      expect(status).toBe(404);
    });

    it('returns 404 for non-existent contractor', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/contractors/999999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });
});
