/**
 * Compliance Frameworks Routes Test Suite
 *
 * Covers:
 *   GET    /api/compliance/frameworks/stats    — aggregate KPIs
 *   GET    /api/compliance/frameworks/export   — export with filters
 *   GET    /api/compliance/frameworks           — list with search / region / category / status filters
 *   POST   /api/compliance/frameworks           — create, validation, duplicate ID rejection
 *   GET    /api/compliance/frameworks/:id       — get single, 404 on missing
 *   PUT    /api/compliance/frameworks/:id       — update, 404 on missing
 *   DELETE /api/compliance/frameworks/:id       — delete, 404 on missing
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { complianceFrameworksRoutes } from '../routes/compliance-frameworks';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  complianceFrameworksRoutes(app);
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

// ── DB Seed / Cleanup ──────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `testcf-${Date.now()}`;

let seededId: string;

beforeAll(() => {
  const ts = Date.now();
  // Ensure the table exists (may be bootstrapped by route registration above)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS compliance_frameworks (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      short_name   TEXT NOT NULL,
      region       TEXT NOT NULL,
      category     TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'partial',
      score        INTEGER NOT NULL DEFAULT 0,
      last_audit   TEXT,
      next_due     TEXT,
      requirements INTEGER NOT NULL DEFAULT 0,
      completed    INTEGER NOT NULL DEFAULT 0,
      created_at   INTEGER,
      updated_at   INTEGER
    )
  `);

  seededId = `${TAG}-framework`;
  sqlite.prepare(`
    INSERT OR IGNORE INTO compliance_frameworks
      (id, name, short_name, region, category, status, score,
       last_audit, next_due, requirements, completed, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    seededId,
    `${TAG} Test Framework`,
    `${TAG}-SHORT`,
    'United States',
    'Occupational Safety',
    'partial',
    75,
    '2025-06-01',
    '2026-06-01',
    20,
    15,
    ts,
    ts,
  );
});

afterAll(() => {
  sqlite.prepare(`DELETE FROM compliance_frameworks WHERE id LIKE '${TAG}%'`).run();
  sqlite.close();
});

// ── Stats ──────────────────────────────────────────────────────────────────

describe('GET /api/compliance/frameworks/stats', () => {
  it('returns success with all required stat fields', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/compliance/frameworks/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      total: expect.any(Number),
      compliant: expect.any(Number),
      partial: expect.any(Number),
      nonCompliant: expect.any(Number),
      notApplicable: expect.any(Number),
      avgScore: expect.any(Number),
    });
  });

  it('total is at least 18 (seeded frameworks)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/compliance/frameworks/stats');
    expect(body.data.total).toBeGreaterThanOrEqual(18);
  });

  it('compliant + partial + nonCompliant + notApplicable sums to total', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/compliance/frameworks/stats');
    const { total, compliant, partial, nonCompliant, notApplicable } = body.data;
    expect(compliant + partial + nonCompliant + notApplicable).toBe(total);
  });

  it('avgScore is in range 0-100', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/compliance/frameworks/stats');
    expect(body.data.avgScore).toBeGreaterThanOrEqual(0);
    expect(body.data.avgScore).toBeLessThanOrEqual(100);
  });
});

// ── List ───────────────────────────────────────────────────────────────────

describe('GET /api/compliance/frameworks', () => {
  it('returns success with array of frameworks', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/compliance/frameworks');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  it('each framework has required fields', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/compliance/frameworks');
    const fw = body.data[0];
    expect(fw).toHaveProperty('id');
    expect(fw).toHaveProperty('name');
    expect(fw).toHaveProperty('shortName');
    expect(fw).toHaveProperty('region');
    expect(fw).toHaveProperty('category');
    expect(fw).toHaveProperty('status');
    expect(fw).toHaveProperty('score');
    expect(fw).toHaveProperty('lastAudit');
    expect(fw).toHaveProperty('nextDue');
    expect(fw).toHaveProperty('requirements');
    expect(fw).toHaveProperty('completed');
  });

  it('filters by region', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/compliance/frameworks?region=United%20States');
    expect(body.success).toBe(true);
    expect(body.data.every((fw: any) => fw.region === 'United States')).toBe(true);
  });

  it('filters by category', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/compliance/frameworks?category=Environmental');
    expect(body.success).toBe(true);
    expect(body.data.every((fw: any) => fw.category === 'Environmental')).toBe(true);
  });

  it('filters by status', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/compliance/frameworks?status=compliant');
    expect(body.success).toBe(true);
    expect(body.data.every((fw: any) => fw.status === 'compliant')).toBe(true);
  });

  it('filters by search query (name)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/compliance/frameworks?search=OSHA');
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    const hasMatch = body.data.some(
      (fw: any) =>
        fw.name.toLowerCase().includes('osha') ||
        fw.shortName.toLowerCase().includes('osha'),
    );
    expect(hasMatch).toBe(true);
  });

  it('returns empty array when no results match filter', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/compliance/frameworks?region=Nonexistent%20Region');
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(0);
  });

  it('seeded test framework appears in list', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/compliance/frameworks?search=${TAG}`);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    const found = body.data.find((fw: any) => fw.id === seededId);
    expect(found).toBeDefined();
  });
});

// ── Export ─────────────────────────────────────────────────────────────────

describe('GET /api/compliance/frameworks/export', () => {
  it('returns success with array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/compliance/frameworks/export');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('supports region filter', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/compliance/frameworks/export?region=International');
    expect(body.data.every((fw: any) => fw.region === 'International')).toBe(true);
  });
});

// ── Get Single ─────────────────────────────────────────────────────────────

describe('GET /api/compliance/frameworks/:id', () => {
  it('returns seeded framework by id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', `/api/compliance/frameworks/${seededId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(seededId);
    expect(body.data.region).toBe('United States');
    expect(body.data.score).toBe(75);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/compliance/frameworks/__nonexistent__');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ── Create ─────────────────────────────────────────────────────────────────

describe('POST /api/compliance/frameworks', () => {
  const newId = `${TAG}-create-new`;

  afterAll(() => {
    sqlite.prepare('DELETE FROM compliance_frameworks WHERE id = ?').run(newId);
  });

  it('creates a new framework and returns 201', async () => {
    const app = createTestApp();
    const payload = {
      id: newId,
      name: `${TAG} New Framework`,
      shortName: `${TAG}-NEW`,
      region: 'Brazil',
      category: 'Environmental',
      status: 'non-compliant',
      score: 50,
      lastAudit: '2025-01-01',
      nextDue: '2026-01-01',
      requirements: 30,
      completed: 15,
    };
    const { status, body } = await req(app, 'POST', '/api/compliance/frameworks', payload);
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(newId);
    expect(body.data.status).toBe('non-compliant');
    expect(body.data.score).toBe(50);
  });

  it('returns 409 when id already exists', async () => {
    const app = createTestApp();
    const payload = {
      id: seededId,
      name: 'Duplicate',
      shortName: 'DUP',
      region: 'China',
      category: 'Fire Safety',
      status: 'compliant',
      score: 80,
      requirements: 10,
      completed: 10,
    };
    const { status, body } = await req(app, 'POST', '/api/compliance/frameworks', payload);
    expect(status).toBe(409);
    expect(body.success).toBe(false);
  });

  it('returns 400 for missing required fields', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/compliance/frameworks', { name: 'Missing id' });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid status value', async () => {
    const app = createTestApp();
    const payload = {
      id: `${TAG}-bad-status`,
      name: 'Bad Status Test',
      shortName: 'BST',
      region: 'International',
      category: 'Quality Management',
      status: 'invalid-status',
      score: 80,
      requirements: 10,
      completed: 8,
    };
    const { status, body } = await req(app, 'POST', '/api/compliance/frameworks', payload);
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ── Update ─────────────────────────────────────────────────────────────────

describe('PUT /api/compliance/frameworks/:id', () => {
  it('updates score and status', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/compliance/frameworks/${seededId}`, {
      score: 90,
      status: 'compliant',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.score).toBe(90);
    expect(body.data.status).toBe('compliant');
  });

  it('does partial update — untouched fields preserved', async () => {
    const app = createTestApp();
    const { body: before } = await req(app, 'GET', `/api/compliance/frameworks/${seededId}`);
    await req(app, 'PUT', `/api/compliance/frameworks/${seededId}`, { score: 88 });
    const { body: after } = await req(app, 'GET', `/api/compliance/frameworks/${seededId}`);
    expect(after.data.score).toBe(88);
    expect(after.data.region).toBe(before.data.region);
    expect(after.data.category).toBe(before.data.category);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/compliance/frameworks/__nonexistent__', { score: 50 });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid status in update', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/compliance/frameworks/${seededId}`, {
      status: 'not-a-real-status',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ── Delete ─────────────────────────────────────────────────────────────────

describe('DELETE /api/compliance/frameworks/:id', () => {
  const deleteId = `${TAG}-to-delete`;

  beforeAll(() => {
    const ts = Date.now();
    sqlite.prepare(`
      INSERT OR IGNORE INTO compliance_frameworks
        (id, name, short_name, region, category, status, score, requirements, completed, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).run(deleteId, `${TAG} Delete Target`, `${TAG}-DEL`, 'China', 'Fire Safety', 'partial', 60, 10, 6, ts, ts);
  });

  it('deletes an existing framework', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', `/api/compliance/frameworks/${deleteId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 404 after deletion', async () => {
    const app = createTestApp();
    const { status } = await req(app, 'GET', `/api/compliance/frameworks/${deleteId}`);
    expect(status).toBe(404);
  });

  it('returns 404 for already-deleted id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', `/api/compliance/frameworks/${deleteId}`);
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', '/api/compliance/frameworks/__nonexistent__');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});
