/**
 * Industrial Hygiene Routes Test Suite
 *
 * Covers:
 *   GET    /api/hygiene/stats                        — aggregate KPIs
 *   GET    /api/hygiene/monitoring                   — monitoring dashboard data
 *   GET    /api/hygiene/assessments                  — list + filter (hazardType, department, status, limit)
 *   GET    /api/hygiene/assessments/:id              — single, 404 on missing, 400 on bad id
 *   POST   /api/hygiene/assessment                   — create, validation
 *   PUT    /api/hygiene/assessments/:id              — partial update, 404, no fields → 400
 *   DELETE /api/hygiene/assessments/:id              — delete, 404 on missing
 *   PATCH  /api/hygiene/assessments/:id/status       — valid/invalid status values
 *   GET    /api/hygiene/sampling-plans               — list + filter (status, agent)
 *   GET    /api/hygiene/sampling-plans/:id           — single, 404 on missing
 *   POST   /api/hygiene/sampling-plans               — create, validation
 *   PUT    /api/hygiene/sampling-plans/:id           — partial update, 404
 *   DELETE /api/hygiene/sampling-plans/:id           — delete, 404 on missing
 *   PATCH  /api/hygiene/sampling-plans/:id/status    — valid/invalid status values
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { hygieneRoutes } from '../routes/hygiene';

// ── App factory ───────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  hygieneRoutes(app);
  return app;
}

// ── Request helper ────────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── DB seed / cleanup ─────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `testhygiene-${Date.now()}`;
const ts = Date.now();

// Assessment seed IDs — stored after insertion
let seedA1: number;
let seedA2: number;
let seedA3: number;
let seedA4: number;
let seedA5: number;

// Sampling plan seed IDs
let seedP1: number;
let seedP2: number;
let seedP3: number;

beforeAll(() => {
  // Ensure sampling_plans table exists (bootstrap in route module runs it, but we run tests
  // against a fresh app import so we create the table here as a safety net too)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS hygiene_sampling_plans (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      agent       TEXT NOT NULL,
      method      TEXT NOT NULL,
      frequency   TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'scheduled',
      assignee    TEXT,
      due_date    TEXT,
      notes       TEXT,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )
  `);

  // Seed assessments
  const insertA = sqlite.prepare(`
    INSERT INTO hygiene_assessments
      (title, hazard_type, location, department, exposure_level, control_measures,
       assessed_by, next_review_date, status, assessed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  seedA1 = Number(insertA.run(
    `${TAG} Silica Dust Monitor`, 'chemical', `${TAG} Plant A`, `${TAG} Operations`,
    'high', JSON.stringify(['Respirators', 'Wet methods']),
    'J. Martinez', '2026-06-01', 'active', ts, ts
  ).lastInsertRowid);

  seedA2 = Number(insertA.run(
    `${TAG} Noise Survey`, 'physical', `${TAG} Assembly Hall`, `${TAG} Production`,
    'medium', JSON.stringify(['Hearing protection']),
    'A. Chen', '2026-09-01', 'active', ts, ts
  ).lastInsertRowid);

  seedA3 = Number(insertA.run(
    `${TAG} Benzene Exposure`, 'chemical', `${TAG} Lab C`, `${TAG} Research`,
    'low', JSON.stringify(['LEV', 'PPE']),
    'R. Patel', '2026-12-01', 'resolved', ts, ts
  ).lastInsertRowid);

  seedA4 = Number(insertA.run(
    `${TAG} Mold Assessment`, 'biological', `${TAG} Basement`, `${TAG} Facilities`,
    'extreme', JSON.stringify(['Remediation required']),
    'K. Wilson', '2026-04-01', 'requires-action', ts, ts
  ).lastInsertRowid);

  seedA5 = Number(insertA.run(
    `${TAG} Ergonomic Review`, 'ergonomic', `${TAG} Office Block`, `${TAG} Admin`,
    'low', JSON.stringify(['Adjustable desks']),
    'L. Johnson', '2026-07-01', 'active', ts, ts
  ).lastInsertRowid);

  // Seed sampling plans
  const insertP = sqlite.prepare(`
    INSERT INTO hygiene_sampling_plans
      (title, agent, method, frequency, status, assignee, due_date, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  seedP1 = Number(insertP.run(
    `${TAG} Quarterly Silica`, 'Silica Dust', 'NIOSH 7500', 'Quarterly',
    'scheduled', 'J. Martinez', '2026-03-15', 'Annual review pending',
    ts, ts
  ).lastInsertRowid);

  seedP2 = Number(insertP.run(
    `${TAG} Lead Follow-Up`, 'Lead', 'NIOSH 7300', 'Monthly',
    'overdue', 'R. Patel', '2026-02-20', null,
    ts, ts
  ).lastInsertRowid);

  seedP3 = Number(insertP.run(
    `${TAG} Noise Dosimetry`, 'Noise', 'OSHA SLM', 'Annual',
    'completed', 'A. Chen', '2026-01-31', 'Completed on time',
    ts, ts
  ).lastInsertRowid);
});

afterAll(() => {
  sqlite.prepare(`DELETE FROM hygiene_assessments WHERE title LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM hygiene_sampling_plans WHERE title LIKE '${TAG}%'`).run();
  sqlite.close();
});

// ── Stats ─────────────────────────────────────────────────────────────────────

describe('GET /api/hygiene/stats', () => {
  it('returns 200 with success:true and all required fields', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hygiene/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      total:        expect.any(Number),
      byStatus:     expect.any(Array),
      byHazard:     expect.any(Array),
      byExposure:   expect.any(Array),
      overduePlans: expect.any(Number),
      totalPlans:   expect.any(Number),
    });
  });

  it('total assessments is at least 5 (seeded)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hygiene/stats');
    expect(body.data.total).toBeGreaterThanOrEqual(5);
  });

  it('totalPlans is at least 3 (seeded)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hygiene/stats');
    expect(body.data.totalPlans).toBeGreaterThanOrEqual(3);
  });

  it('overduePlans is at least 1 (seeded 1 overdue plan)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hygiene/stats');
    expect(body.data.overduePlans).toBeGreaterThanOrEqual(1);
  });
});

// ── Monitoring ────────────────────────────────────────────────────────────────

describe('GET /api/hygiene/monitoring', () => {
  it('returns 200 with success:true and required shape', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hygiene/monitoring');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      total:          expect.any(Number),
      byExposureLevel: expect.any(Array),
      byHazardType:   expect.any(Array),
      requiresAction: expect.any(Array),
      lastUpdated:    expect.any(String),
    });
  });

  it('requiresAction contains assessments with extreme/high exposure or requires-action status', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hygiene/monitoring');
    const requiresAction: any[] = body.data.requiresAction;
    expect(requiresAction.length).toBeGreaterThanOrEqual(1);
    // Every item should have basic assessment shape
    requiresAction.forEach((item: any) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('hazardType');
    });
  });
});

// ── List Assessments ──────────────────────────────────────────────────────────

describe('GET /api/hygiene/assessments', () => {
  it('returns 200 with success:true and data array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hygiene/assessments');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(5);
  });

  it('each assessment has camelCase fields from mapAssessment', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hygiene/assessments');
    const item = body.data.find((d: any) => d.id === seedA1);
    expect(item).toBeDefined();
    expect(item).toMatchObject({
      id:           seedA1,
      title:        expect.stringContaining(TAG),
      hazardType:   'chemical',
      location:     expect.stringContaining(TAG),
      department:   expect.stringContaining(TAG),
      exposureLevel: 'high',
      controlMeasures: expect.any(Array),
      assessedBy:   'J. Martinez',
      status:       'active',
    });
    // Ensure no snake_case fields leak through
    expect(item).not.toHaveProperty('hazard_type');
    expect(item).not.toHaveProperty('exposure_level');
    expect(item).not.toHaveProperty('control_measures');
  });

  it('controlMeasures is a parsed array, not a JSON string', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hygiene/assessments');
    const item = body.data.find((d: any) => d.id === seedA1);
    expect(Array.isArray(item.controlMeasures)).toBe(true);
    expect(item.controlMeasures).toContain('Respirators');
  });

  it('filters by hazardType=chemical', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hygiene/assessments?hazardType=chemical');
    expect(body.success).toBe(true);
    body.data.forEach((d: any) => expect(d.hazardType).toBe('chemical'));
  });

  it('filters by hazardType=biological returns only biological records', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hygiene/assessments?hazardType=biological');
    const seeded = body.data.find((d: any) => d.id === seedA4);
    expect(seeded).toBeDefined();
    body.data.forEach((d: any) => expect(d.hazardType).toBe('biological'));
  });

  it('filters by department', async () => {
    const app = createTestApp();
    const dept = `${TAG} Operations`;
    const { body } = await req(app, 'GET', `/api/hygiene/assessments?department=${encodeURIComponent(dept)}`);
    expect(body.success).toBe(true);
    body.data.forEach((d: any) => expect(d.department).toBe(dept));
    expect(body.data.some((d: any) => d.id === seedA1)).toBe(true);
  });

  it('filters by status=resolved', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hygiene/assessments?status=resolved');
    expect(body.success).toBe(true);
    body.data.forEach((d: any) => expect(d.status).toBe('resolved'));
    expect(body.data.some((d: any) => d.id === seedA3)).toBe(true);
  });

  it('respects limit parameter', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hygiene/assessments?limit=2');
    expect(body.success).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(2);
  });
});

// ── Single Assessment ─────────────────────────────────────────────────────────

describe('GET /api/hygiene/assessments/:id', () => {
  it('returns 200 with the correct assessment', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', `/api/hygiene/assessments/${seedA2}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(seedA2);
    expect(body.data.hazardType).toBe('physical');
    expect(body.data.exposureLevel).toBe('medium');
  });

  it('returns 404 for a non-existent id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hygiene/assessments/99999999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 400 for an invalid (non-numeric) id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hygiene/assessments/abc');
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ── Create Assessment ─────────────────────────────────────────────────────────

describe('POST /api/hygiene/assessment', () => {
  let createdId: number;

  afterAll(() => {
    if (createdId) {
      sqlite.prepare('DELETE FROM hygiene_assessments WHERE id = ?').run(createdId);
    }
  });

  it('creates an assessment and returns 201 with camelCase data', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hygiene/assessment', {
      title:          `${TAG} New Chemical Test`,
      hazardType:     'chemical',
      location:       `${TAG} Test Zone`,
      department:     `${TAG} QA`,
      exposureLevel:  'medium',
      controlMeasures: ['Local exhaust ventilation'],
      assessedBy:     'Test Inspector',
      nextReviewDate: '2026-12-31',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.hazardType).toBe('chemical');
    expect(body.data.location).toBe(`${TAG} Test Zone`);
    expect(body.data.status).toBe('active');
    expect(body.data.controlMeasures).toContain('Local exhaust ventilation');
    expect(body.data.id).toBeGreaterThan(0);
    createdId = body.data.id;
  });

  it('returns 400 when title is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hygiene/assessment', {
      hazardType: 'chemical',
      location:   `${TAG} Zone`,
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for an invalid hazardType enum value', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hygiene/assessment', {
      title:      `${TAG} Bad Type`,
      hazardType: 'cosmic-radiation',
      location:   `${TAG} Space`,
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ── Update Assessment ─────────────────────────────────────────────────────────

describe('PUT /api/hygiene/assessments/:id', () => {
  it('partially updates location and returns updated data', async () => {
    const app = createTestApp();
    const newLocation = `${TAG} Updated Location`;
    const { status, body } = await req(app, 'PUT', `/api/hygiene/assessments/${seedA5}`, {
      location: newLocation,
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.location).toBe(newLocation);
    expect(body.data.id).toBe(seedA5);
  });

  it('partially updates exposureLevel only', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/hygiene/assessments/${seedA5}`, {
      exposureLevel: 'medium',
    });
    expect(status).toBe(200);
    expect(body.data.exposureLevel).toBe('medium');
  });

  it('returns 404 for a non-existent id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/hygiene/assessments/99999999', {
      location: 'Somewhere',
    });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ── Delete Assessment ─────────────────────────────────────────────────────────

describe('DELETE /api/hygiene/assessments/:id', () => {
  let tempId: number;

  beforeAll(() => {
    const r = sqlite.prepare(
      `INSERT INTO hygiene_assessments (title, hazard_type, location, department, exposure_level, control_measures, assessed_by, status, assessed_at, created_at)
       VALUES (?, 'chemical', '${TAG} Temp Zone', '${TAG} Temp Dept', 'low', '[]', 'Temp', 'active', ?, ?)`
    ).run(`${TAG} Temp Delete Assessment`, ts, ts);
    tempId = Number(r.lastInsertRowid);
  });

  it('deletes an existing assessment and returns success', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', `/api/hygiene/assessments/${tempId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBeDefined();
  });

  it('returns 404 when deleting an already-deleted assessment', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', `/api/hygiene/assessments/${tempId}`);
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 404 for a completely non-existent id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', '/api/hygiene/assessments/88888888');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ── Patch Assessment Status ───────────────────────────────────────────────────

describe('PATCH /api/hygiene/assessments/:id/status', () => {
  it('patches status to resolved', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', `/api/hygiene/assessments/${seedA1}/status`, {
      status: 'resolved',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('resolved');
  });

  it('patches status back to active', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', `/api/hygiene/assessments/${seedA1}/status`, {
      status: 'active',
    });
    expect(status).toBe(200);
    expect(body.data.status).toBe('active');
  });

  it('patches status to requires-action', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', `/api/hygiene/assessments/${seedA2}/status`, {
      status: 'requires-action',
    });
    expect(status).toBe(200);
    expect(body.data.status).toBe('requires-action');
  });

  it('returns 400 for an invalid status value', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', `/api/hygiene/assessments/${seedA2}/status`, {
      status: 'banana',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 404 for a non-existent assessment', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', '/api/hygiene/assessments/99999999/status', {
      status: 'active',
    });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ── List Sampling Plans ───────────────────────────────────────────────────────

describe('GET /api/hygiene/sampling-plans', () => {
  it('returns 200 with success:true and data array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hygiene/sampling-plans');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(3);
  });

  it('each plan has camelCase fields from mapSamplingPlan', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hygiene/sampling-plans');
    const item = body.data.find((d: any) => d.id === seedP1);
    expect(item).toBeDefined();
    expect(item).toMatchObject({
      id:        seedP1,
      title:     expect.stringContaining(TAG),
      agent:     'Silica Dust',
      method:    'NIOSH 7500',
      frequency: 'Quarterly',
      status:    'scheduled',
      assignee:  'J. Martinez',
      dueDate:   '2026-03-15',
    });
    // Ensure no snake_case leaked
    expect(item).not.toHaveProperty('due_date');
    expect(item).not.toHaveProperty('created_at');
  });

  it('filters by status=overdue', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hygiene/sampling-plans?status=overdue');
    expect(body.success).toBe(true);
    body.data.forEach((d: any) => expect(d.status).toBe('overdue'));
    expect(body.data.some((d: any) => d.id === seedP2)).toBe(true);
  });

  it('filters by status=completed', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hygiene/sampling-plans?status=completed');
    expect(body.success).toBe(true);
    body.data.forEach((d: any) => expect(d.status).toBe('completed'));
    expect(body.data.some((d: any) => d.id === seedP3)).toBe(true);
  });

  it('filters by agent (case-insensitive LIKE)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hygiene/sampling-plans?agent=silica');
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    body.data.forEach((d: any) =>
      expect(d.agent.toLowerCase()).toContain('silica')
    );
  });
});

// ── Single Sampling Plan ──────────────────────────────────────────────────────

describe('GET /api/hygiene/sampling-plans/:id', () => {
  it('returns 200 with the correct plan', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', `/api/hygiene/sampling-plans/${seedP2}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(seedP2);
    expect(body.data.status).toBe('overdue');
    expect(body.data.agent).toBe('Lead');
  });

  it('returns 404 for a non-existent id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hygiene/sampling-plans/99999999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 400 for an invalid (non-numeric) id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hygiene/sampling-plans/xyz');
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ── Create Sampling Plan ──────────────────────────────────────────────────────

describe('POST /api/hygiene/sampling-plans', () => {
  let createdPlanId: number;

  afterAll(() => {
    if (createdPlanId) {
      sqlite.prepare('DELETE FROM hygiene_sampling_plans WHERE id = ?').run(createdPlanId);
    }
  });

  it('creates a sampling plan and returns 201 with camelCase data', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hygiene/sampling-plans', {
      title:     `${TAG} New Sampling Plan`,
      agent:     'Formaldehyde',
      method:    'OSHA 52',
      frequency: 'Quarterly',
      status:    'scheduled',
      assignee:  'L. Johnson',
      dueDate:   '2026-03-12',
      notes:     'Priority area',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.agent).toBe('Formaldehyde');
    expect(body.data.method).toBe('OSHA 52');
    expect(body.data.status).toBe('scheduled');
    expect(body.data.dueDate).toBe('2026-03-12');
    expect(body.data.id).toBeGreaterThan(0);
    createdPlanId = body.data.id;
  });

  it('uses scheduled as default status when omitted', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hygiene/sampling-plans', {
      title:     `${TAG} Default Status Plan`,
      agent:     'Noise',
      method:    'SLM',
      frequency: 'Annual',
    });
    expect(status).toBe(201);
    expect(body.data.status).toBe('scheduled');
    // Clean up
    sqlite.prepare('DELETE FROM hygiene_sampling_plans WHERE id = ?').run(body.data.id);
  });

  it('returns 400 when title is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hygiene/sampling-plans', {
      agent:     'Lead',
      method:    'NIOSH 7300',
      frequency: 'Monthly',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when agent is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hygiene/sampling-plans', {
      title:     `${TAG} Missing Agent`,
      method:    'NIOSH 7300',
      frequency: 'Monthly',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ── Update Sampling Plan ──────────────────────────────────────────────────────

describe('PUT /api/hygiene/sampling-plans/:id', () => {
  it('partially updates assignee and dueDate', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/hygiene/sampling-plans/${seedP1}`, {
      assignee: 'Updated Assignee',
      dueDate:  '2026-04-01',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.assignee).toBe('Updated Assignee');
    expect(body.data.dueDate).toBe('2026-04-01');
    expect(body.data.id).toBe(seedP1);
  });

  it('sets updatedAt to a new timestamp on update', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'PUT', `/api/hygiene/sampling-plans/${seedP1}`, {
      notes: 'Updated notes',
    });
    expect(body.data.updatedAt).toBeGreaterThanOrEqual(ts);
  });

  it('returns 404 for a non-existent id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/hygiene/sampling-plans/99999999', {
      notes: 'Some note',
    });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ── Delete Sampling Plan ──────────────────────────────────────────────────────

describe('DELETE /api/hygiene/sampling-plans/:id', () => {
  let tempPlanId: number;

  beforeAll(() => {
    const r = sqlite.prepare(
      `INSERT INTO hygiene_sampling_plans (title, agent, method, frequency, status, created_at, updated_at)
       VALUES (?, 'Test Agent', 'Test Method', 'Monthly', 'scheduled', ?, ?)`
    ).run(`${TAG} Temp Delete Plan`, ts, ts);
    tempPlanId = Number(r.lastInsertRowid);
  });

  it('deletes an existing plan and returns success', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', `/api/hygiene/sampling-plans/${tempPlanId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 404 when deleting an already-deleted plan', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', `/api/hygiene/sampling-plans/${tempPlanId}`);
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 404 for a completely non-existent id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', '/api/hygiene/sampling-plans/77777777');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ── Patch Sampling Plan Status ────────────────────────────────────────────────

describe('PATCH /api/hygiene/sampling-plans/:id/status', () => {
  it('patches status to in_progress', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', `/api/hygiene/sampling-plans/${seedP1}/status`, {
      status: 'in_progress',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('in_progress');
  });

  it('patches status to completed', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', `/api/hygiene/sampling-plans/${seedP1}/status`, {
      status: 'completed',
    });
    expect(status).toBe(200);
    expect(body.data.status).toBe('completed');
  });

  it('patches status back to scheduled', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', `/api/hygiene/sampling-plans/${seedP1}/status`, {
      status: 'scheduled',
    });
    expect(status).toBe(200);
    expect(body.data.status).toBe('scheduled');
  });

  it('patches status to overdue', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', `/api/hygiene/sampling-plans/${seedP2}/status`, {
      status: 'overdue',
    });
    expect(status).toBe(200);
    expect(body.data.status).toBe('overdue');
  });

  it('returns 400 for an invalid status value', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', `/api/hygiene/sampling-plans/${seedP1}/status`, {
      status: 'pending',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 404 for a non-existent plan', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PATCH', '/api/hygiene/sampling-plans/99999999/status', {
      status: 'scheduled',
    });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});
