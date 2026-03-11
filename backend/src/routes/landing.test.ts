/**
 * Landing Routes Test Suite
 *
 * Covers:
 *   GET   /api/landing/stats                — live platform statistics
 *   POST  /api/landing/demo-request         — create demo request (validation, 400)
 *   GET   /api/landing/demo-requests        — list demo requests (filter by status)
 *   PATCH /api/landing/demo-requests/:id    — update status (valid, 400, 404)
 *   Schema verification                     — demo_requests table auto-created
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { landingRoutes } from '../routes/landing';

// ── App Factory ─────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  landingRoutes(app);
  return app;
}

// ── Request Helper ──────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── Seed / Cleanup ───────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `landing-test-${Date.now()}`;

afterAll(() => {
  sqlite.prepare(`DELETE FROM demo_requests WHERE email LIKE '${TAG}%'`).run();
  sqlite.close();
});

function seedDemoRequest(overrides: Record<string, any> = {}): number {
  const ts = Math.floor(Date.now() / 1000);
  const r = sqlite.prepare(`
    INSERT INTO demo_requests (name, email, company, phone, message, source, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.name    ?? 'Test User',
    overrides.email   ?? `${TAG}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    overrides.company ?? 'Test Co',
    overrides.phone   ?? null,
    overrides.message ?? null,
    overrides.source  ?? 'landing',
    overrides.status  ?? 'new',
    ts,
  );
  return Number(r.lastInsertRowid);
}

// ── 1. Landing Stats ──────────────────────────────────────────────────────────

describe('GET /api/landing/stats', () => {
  it('returns success: true', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/landing/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns required numeric fields', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/landing/stats');
    const d = body.data;
    expect(typeof d.incidentReduction).toBe('number');
    expect(typeof d.hazardDetection).toBe('number');
    expect(typeof d.activeWorkers).toBe('number');
    expect(typeof d.customerSatisfaction).toBe('number');
    expect(typeof d.totalIncidents).toBe('number');
    expect(typeof d.nearMisses).toBe('number');
    expect(typeof d.totalDemoRequests).toBe('number');
  });

  it('incidentReduction is between 0 and 99', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/landing/stats');
    expect(body.data.incidentReduction).toBeGreaterThan(0);
    expect(body.data.incidentReduction).toBeLessThanOrEqual(99);
  });

  it('hazardDetection is between 0 and 99', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/landing/stats');
    expect(body.data.hazardDetection).toBeGreaterThan(0);
    expect(body.data.hazardDetection).toBeLessThanOrEqual(99);
  });

  it('activeWorkers is a positive number', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/landing/stats');
    expect(body.data.activeWorkers).toBeGreaterThan(0);
  });

  it('customerSatisfaction is 4.9', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/landing/stats');
    expect(body.data.customerSatisfaction).toBe(4.9);
  });

  it('totalIncidents and nearMisses are non-negative', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/landing/stats');
    expect(body.data.totalIncidents).toBeGreaterThanOrEqual(0);
    expect(body.data.nearMisses).toBeGreaterThanOrEqual(0);
  });

  it('totalDemoRequests increments after a new request is created', async () => {
    const app = createTestApp();
    const before = (await req(app, 'GET', '/api/landing/stats')).body.data.totalDemoRequests;

    await req(app, 'POST', '/api/landing/demo-request', {
      name: 'Counter Test',
      email: `${TAG}-counter@example.com`,
    });

    const after = (await req(app, 'GET', '/api/landing/stats')).body.data.totalDemoRequests;
    expect(after).toBeGreaterThan(before);
  });
});

// ── 2. Create Demo Request ────────────────────────────────────────────────────

describe('POST /api/landing/demo-request', () => {
  it('creates a request and returns 201 with id and message', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/landing/demo-request', {
      name: 'Jane Smith',
      email: `${TAG}-create@example.com`,
      company: 'Acme Corp',
      phone: '+1-555-0100',
      message: 'Interested in Enterprise plan',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(typeof body.data.id).toBe('number');
    expect(body.data.id).toBeGreaterThan(0);
    expect(typeof body.data.message).toBe('string');
    expect(body.data.message.length).toBeGreaterThan(5);
  });

  it('sets default status to new', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/landing/demo-request', {
      name: 'Status Check',
      email: `${TAG}-status@example.com`,
    });
    const row = sqlite.prepare('SELECT status FROM demo_requests WHERE id=?').get(body.data.id) as any;
    expect(row?.status).toBe('new');
  });

  it('stores source field', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/landing/demo-request', {
      name: 'Source Check',
      email: `${TAG}-source@example.com`,
      source: 'cta-section',
    });
    const row = sqlite.prepare('SELECT source FROM demo_requests WHERE id=?').get(body.data.id) as any;
    expect(row?.source).toBe('cta-section');
  });

  it('returns 400 when name is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/landing/demo-request', {
      email: `${TAG}-noname@example.com`,
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when email is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/landing/demo-request', {
      name: 'No Email',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when email is invalid', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/landing/demo-request', {
      name: 'Bad Email',
      email: 'not-an-email',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('accepts minimal payload with only name and email', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/landing/demo-request', {
      name: 'Minimal',
      email: `${TAG}-minimal@example.com`,
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('returns 400 for invalid JSON body', async () => {
    const app = createTestApp();
    const res = await app.request('/api/landing/demo-request', {
      method: 'POST',
      body: 'not-json-at-all',
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await res.json() as any;
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ── 3. List Demo Requests ─────────────────────────────────────────────────────

describe('GET /api/landing/demo-requests', () => {
  let seedId1: number;
  let seedId2: number;

  beforeAll(() => {
    seedId1 = seedDemoRequest({ email: `${TAG}-list1@example.com`, status: 'new' });
    seedId2 = seedDemoRequest({ email: `${TAG}-list2@example.com`, status: 'contacted' });
  });

  it('returns success: true with array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/landing/demo-requests');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('includes the seeded records', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/landing/demo-requests');
    const ids = body.data.map((r: any) => r.id);
    expect(ids).toContain(seedId1);
    expect(ids).toContain(seedId2);
  });

  it('filters by status=new', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/landing/demo-requests?status=new');
    expect(body.data.every((r: any) => r.status === 'new')).toBe(true);
  });

  it('filters by status=contacted', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/landing/demo-requests?status=contacted');
    expect(body.data.every((r: any) => r.status === 'contacted')).toBe(true);
  });

  it('returns total count', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/landing/demo-requests');
    expect(typeof body.total).toBe('number');
    expect(body.total).toBeGreaterThan(0);
  });

  it('respects limit query param', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/landing/demo-requests?limit=1');
    expect(body.data.length).toBeLessThanOrEqual(1);
  });

  it('each record has required fields', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/landing/demo-requests');
    if (body.data.length > 0) {
      const r = body.data[0];
      expect(r).toHaveProperty('id');
      expect(r).toHaveProperty('name');
      expect(r).toHaveProperty('email');
      expect(r).toHaveProperty('status');
      expect(r).toHaveProperty('created_at');
    }
  });
});

// ── 4. Update Demo Request Status ─────────────────────────────────────────────

describe('PATCH /api/landing/demo-requests/:id', () => {
  let updateId: number;

  beforeAll(() => {
    updateId = seedDemoRequest({ email: `${TAG}-update@example.com`, status: 'new' });
  });

  it('updates status to contacted', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', `/api/landing/demo-requests/${updateId}`, {
      status: 'contacted',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('contacted');

    const row = sqlite.prepare('SELECT status FROM demo_requests WHERE id=?').get(updateId) as any;
    expect(row?.status).toBe('contacted');
  });

  it('updates status to closed', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', `/api/landing/demo-requests/${updateId}`, {
      status: 'closed',
    });
    expect(status).toBe(200);
    expect(body.data.status).toBe('closed');
  });

  it('returns 400 for invalid status value', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', `/api/landing/demo-requests/${updateId}`, {
      status: 'archived',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when status is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', `/api/landing/demo-requests/${updateId}`, {});
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', '/api/landing/demo-requests/999999999', {
      status: 'contacted',
    });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ── 5. Schema Verification ────────────────────────────────────────────────────

describe('demo_requests schema verification', () => {
  it('demo_requests table exists after init', () => {
    const row = sqlite.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='demo_requests'"
    ).get();
    expect(row).toBeDefined();
  });

  it('table has all required columns', () => {
    const cols = sqlite.prepare('PRAGMA table_info(demo_requests)').all() as any[];
    const names = cols.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('name');
    expect(names).toContain('email');
    expect(names).toContain('company');
    expect(names).toContain('phone');
    expect(names).toContain('message');
    expect(names).toContain('source');
    expect(names).toContain('status');
    expect(names).toContain('created_at');
  });

  it('status defaults to new for new records', () => {
    const ts = Math.floor(Date.now() / 1000);
    const r = sqlite.prepare(
      `INSERT INTO demo_requests (name, email, source, created_at) VALUES ('Schema Test', '${TAG}-schema@example.com', 'test', ${ts})`
    ).run();
    const row = sqlite.prepare('SELECT status FROM demo_requests WHERE id=?').get(Number(r.lastInsertRowid)) as any;
    expect(row?.status).toBe('new');
  });
});
