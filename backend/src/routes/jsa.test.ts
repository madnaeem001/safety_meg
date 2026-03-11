/**
 * JSA (Job Safety Analysis) Routes Test Suite
 *
 * Covers:
 *   GET    /api/jsa/stats        — aggregate KPIs
 *   GET    /api/jsa              — list with status / risk / department / search / limit filters
 *   GET    /api/jsa/:id          — get single, 404 on missing
 *   POST   /api/jsa              — create, validation, auto-id generation
 *   PUT    /api/jsa/:id          — partial update, field preservation, 404, validation
 *   DELETE /api/jsa/:id          — delete, 404 on re-delete, 404 on unknown
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { jsaRoutes } from '../routes/jsa';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  jsaRoutes(app);
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
const TAG = `testjsa-${Date.now()}`;

let seededId: string;

beforeAll(() => {
  const ts = Date.now();
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS jsa_records (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL,
      department    TEXT,
      location      TEXT,
      compliance    TEXT,
      steps         TEXT NOT NULL DEFAULT '[]',
      status        TEXT NOT NULL DEFAULT 'draft',
      overall_risk  TEXT NOT NULL DEFAULT 'low',
      hazard_count  INTEGER NOT NULL DEFAULT 0,
      control_count INTEGER NOT NULL DEFAULT 0,
      assignee      TEXT,
      created_date  TEXT,
      created_by    TEXT,
      created_at    INTEGER,
      updated_at    INTEGER
    )
  `);

  seededId = `${TAG}-jsa`;
  sqlite.prepare(`
    INSERT OR IGNORE INTO jsa_records
      (id, title, department, location, compliance, steps, status, overall_risk,
       hazard_count, control_count, assignee, created_date, created_by, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    seededId,
    `${TAG} Scaffold Erection`,
    'Construction',
    'Site Alpha',
    'OSHA 1926 Subpart Q',
    JSON.stringify([
      { id: 's1', stepNumber: 1, taskDescription: 'Inspect scaffold components', hazards: ['Falling objects', 'Pinch points'], riskLevel: 'high', controls: 'Wear hard hat and gloves. Inspect for damage.', ppeRequired: ['Hard Hat', 'Gloves'], images: [] },
    ]),
    'pending',
    'high',
    2,
    1,
    'Test Worker',
    '2026-01-10',
    'tester',
    ts,
    ts,
  );
});

afterAll(() => {
  sqlite.prepare(`DELETE FROM jsa_records WHERE id LIKE '${TAG}%'`).run();
  sqlite.close();
});

// ── Stats ──────────────────────────────────────────────────────────────────

describe('GET /api/jsa/stats', () => {
  it('returns success with all required stat fields', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/jsa/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      total: expect.any(Number),
      approved: expect.any(Number),
      pending: expect.any(Number),
      draft: expect.any(Number),
      rejected: expect.any(Number),
      critical: expect.any(Number),
      high: expect.any(Number),
      totalHazards: expect.any(Number),
      totalControls: expect.any(Number),
    });
  });

  it('total is at least 6 (seeded records)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/jsa/stats');
    expect(body.data.total).toBeGreaterThanOrEqual(6);
  });

  it('status counts sum to total', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/jsa/stats');
    const { total, approved, pending, draft, rejected } = body.data;
    expect(approved + pending + draft + rejected).toBe(total);
  });

  it('totalHazards and totalControls are non-negative integers', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/jsa/stats');
    expect(body.data.totalHazards).toBeGreaterThanOrEqual(0);
    expect(body.data.totalControls).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(body.data.totalHazards)).toBe(true);
    expect(Number.isInteger(body.data.totalControls)).toBe(true);
  });
});

// ── List ───────────────────────────────────────────────────────────────────

describe('GET /api/jsa', () => {
  it('returns success with array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/jsa');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  it('each record has required fields', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/jsa');
    const jsa = body.data[0];
    expect(jsa).toHaveProperty('id');
    expect(jsa).toHaveProperty('title');
    expect(jsa).toHaveProperty('status');
    expect(jsa).toHaveProperty('overallRisk');
    expect(jsa).toHaveProperty('hazardCount');
    expect(jsa).toHaveProperty('controlCount');
    expect(jsa).toHaveProperty('steps');
    expect(Array.isArray(jsa.steps)).toBe(true);
  });

  it('filters by status', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/jsa?status=approved');
    expect(body.success).toBe(true);
    expect(body.data.every((j: any) => j.status === 'approved')).toBe(true);
  });

  it('filters by risk', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/jsa?risk=high');
    expect(body.success).toBe(true);
    expect(body.data.every((j: any) => j.overallRisk === 'high')).toBe(true);
  });

  it('filters by department', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/jsa?department=Construction');
    expect(body.success).toBe(true);
    expect(body.data.every((j: any) => j.department === 'Construction')).toBe(true);
  });

  it('filters by search (title)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/jsa?search=${TAG}`);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.some((j: any) => j.id === seededId)).toBe(true);
  });

  it('respects limit parameter', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/jsa?limit=3');
    expect(body.success).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(3);
  });

  it('returns empty array for non-matching filter', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/jsa?department=__nonexistent_dept__');
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(0);
  });
});

// ── Get Single ─────────────────────────────────────────────────────────────

describe('GET /api/jsa/:id', () => {
  it('returns seeded JSA by id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', `/api/jsa/${seededId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(seededId);
    expect(body.data.department).toBe('Construction');
    expect(body.data.overallRisk).toBe('high');
    expect(body.data.hazardCount).toBe(2);
    expect(body.data.controlCount).toBe(1);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/jsa/__nonexistent__');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('steps field is an array', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/jsa/${seededId}`);
    expect(Array.isArray(body.data.steps)).toBe(true);
    expect(body.data.steps.length).toBe(1);
  });
});

// ── Create ─────────────────────────────────────────────────────────────────

describe('POST /api/jsa', () => {
  const createdIds: string[] = [];

  afterAll(() => {
    for (const id of createdIds) {
      sqlite.prepare('DELETE FROM jsa_records WHERE id = ?').run(id);
    }
  });

  it('creates a JSA with explicit id and returns 201', async () => {
    const app = createTestApp();
    const newId = `${TAG}-create-explicit`;
    const payload = {
      id: newId,
      title: `${TAG} Hot Work Safety`,
      department: 'Maintenance',
      location: 'Building A',
      compliance: 'OSHA 1910.252',
      steps: [
        { id: 'step1', stepNumber: 1, taskDescription: 'Inspect area', hazards: ['Fire', 'Explosion'], riskLevel: 'high', controls: 'Remove combustibles. Post fire watch.', ppeRequired: ['Welding Helmet'], images: [] },
      ],
      status: 'draft',
      overallRisk: 'high',
      assignee: 'Bob Tech',
      createdDate: '2026-03-01',
      createdBy: 'supervisor',
    };
    const { status, body } = await req(app, 'POST', '/api/jsa', payload);
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(newId);
    expect(body.data.title).toBe(`${TAG} Hot Work Safety`);
    expect(body.data.hazardCount).toBe(2);
    expect(body.data.controlCount).toBe(1);
    createdIds.push(newId);
  });

  it('auto-generates id when id not provided', async () => {
    const app = createTestApp();
    const payload = {
      title: `${TAG} Auto-ID JSA`,
      department: 'Electrical',
      steps: [],
      status: 'draft',
      overallRisk: 'low',
    };
    const { status, body } = await req(app, 'POST', '/api/jsa', payload);
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(typeof body.data.id).toBe('string');
    expect(body.data.id.length).toBeGreaterThan(0);
    createdIds.push(body.data.id);
  });

  it('computes hazardCount from steps array', async () => {
    const app = createTestApp();
    const newId = `${TAG}-create-counts`;
    const payload = {
      id: newId,
      title: `${TAG} Count Test`,
      steps: [
        { id: 's1', stepNumber: 1, taskDescription: 'Step A', hazards: ['H1', 'H2', 'H3'], riskLevel: 'medium', controls: 'Use PPE', ppeRequired: [], images: [] },
        { id: 's2', stepNumber: 2, taskDescription: 'Step B', hazards: ['H4'], riskLevel: 'low', controls: 'Inspect first', ppeRequired: [], images: [] },
      ],
      status: 'draft',
      overallRisk: 'medium',
    };
    const { body } = await req(app, 'POST', '/api/jsa', payload);
    expect(body.data.hazardCount).toBe(4);
    expect(body.data.controlCount).toBe(2);
    createdIds.push(newId);
  });

  it('returns 400 for missing title', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/jsa', { department: 'Test', steps: [] });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid status value', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/jsa', {
      title: 'Invalid Status',
      steps: [],
      status: 'approved_wrong',
      overallRisk: 'low',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid risk value', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/jsa', {
      title: 'Invalid Risk',
      steps: [],
      status: 'draft',
      overallRisk: 'super-critical',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ── Update ─────────────────────────────────────────────────────────────────

describe('PUT /api/jsa/:id', () => {
  it('updates status and risk', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/jsa/${seededId}`, {
      status: 'approved',
      overallRisk: 'medium',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('approved');
    expect(body.data.overallRisk).toBe('medium');
  });

  it('partial update preserves other fields', async () => {
    const app = createTestApp();
    const { body: before } = await req(app, 'GET', `/api/jsa/${seededId}`);
    await req(app, 'PUT', `/api/jsa/${seededId}`, { assignee: 'New Assignee' });
    const { body: after } = await req(app, 'GET', `/api/jsa/${seededId}`);
    expect(after.data.assignee).toBe('New Assignee');
    expect(after.data.department).toBe(before.data.department);
    expect(after.data.title).toBe(before.data.title);
  });

  it('recalculates hazardCount when steps updated', async () => {
    const app = createTestApp();
    const newSteps = [
      { id: 'u1', stepNumber: 1, taskDescription: 'Updated Step', hazards: ['A', 'B', 'C', 'D', 'E'], riskLevel: 'critical', controls: 'Strict controls required', ppeRequired: [], images: [] },
    ];
    const { body } = await req(app, 'PUT', `/api/jsa/${seededId}`, { steps: newSteps });
    expect(body.success).toBe(true);
    expect(body.data.hazardCount).toBe(5);
    expect(body.data.controlCount).toBe(1);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/jsa/__nonexistent__', { status: 'approved' });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid status in update', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/jsa/${seededId}`, { status: 'not-valid' });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ── Delete ─────────────────────────────────────────────────────────────────

describe('DELETE /api/jsa/:id', () => {
  const deleteId = `${TAG}-to-delete`;

  beforeAll(() => {
    const ts = Date.now();
    sqlite.prepare(`
      INSERT OR IGNORE INTO jsa_records
        (id, title, department, steps, status, overall_risk, hazard_count, control_count, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(deleteId, `${TAG} Delete Target`, 'Operations', '[]', 'draft', 'low', 0, 0, ts, ts);
  });

  it('deletes an existing JSA', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', `/api/jsa/${deleteId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('JSA deleted');
  });

  it('returns 404 after deletion', async () => {
    const app = createTestApp();
    const { status } = await req(app, 'GET', `/api/jsa/${deleteId}`);
    expect(status).toBe(404);
  });

  it('returns 404 on re-delete', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', `/api/jsa/${deleteId}`);
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', '/api/jsa/__nonexistent__');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});
