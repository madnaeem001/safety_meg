/**
 * Compliance Reporting Routes Test Suite
 *
 * Covers:
 *   GET  /api/compliance/reporting/stats
 *   GET  /api/compliance/reporting/reports       (list, filtering, field mapping)
 *   POST /api/compliance/reporting/reports       (create, validation)
 *   GET  /api/compliance/reporting/reports/:id
 *   PUT  /api/compliance/reporting/reports/:id   (update, type normalization)
 *   DELETE /api/compliance/reporting/reports/:id
 *   GET  /api/compliance/reporting/metrics       (list, category filter)
 *   PUT  /api/compliance/reporting/metrics/:id   (update metric)
 *   GET  /api/compliance/reporting/requirements  (list, status filter)
 *   PUT  /api/compliance/reporting/requirements/:id
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { complianceReportingRoutes } from '../routes/compliance-reporting';

function createTestApp() {
  const app = new Hono();
  complianceReportingRoutes(app);
  return app;
}

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

const sqlite = new Database('local.sqlite');
const TAG = `testcr-${Date.now()}`;

beforeAll(() => {
  // DB is already initialized via local.sqlite; tables created in init-db.ts
});

afterAll(() => {
  sqlite.prepare(`DELETE FROM compliance_reports WHERE name LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM compliance_metrics WHERE name LIKE '${TAG}%'`).run();
  sqlite.close();
});

function seedReport(overrides: Record<string, any> = {}) {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO compliance_reports (name, type, frequency, last_generated, next_due, status, recipients, format, automation_enabled, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.name ?? `${TAG}-report`,
    overrides.type ?? 'internal',
    overrides.frequency ?? 'monthly',
    overrides.last_generated ?? '2026-01-01',
    overrides.next_due ?? '2026-02-01',
    overrides.status ?? 'current',
    overrides.recipients ?? JSON.stringify(['test@example.com']),
    overrides.format ?? 'pdf',
    overrides.automation_enabled ?? 0,
    overrides.description ?? 'Test report',
    ts, ts,
  );
  return result.lastInsertRowid as number;
}

function seedMetric(overrides: Record<string, any> = {}) {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO compliance_metrics (name, category, current_value, target_value, unit, trend, trend_value, status, last_updated, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.name ?? `${TAG}-metric`,
    overrides.category ?? 'Safety',
    overrides.current_value ?? 95,
    overrides.target_value ?? 100,
    overrides.unit ?? '%',
    overrides.trend ?? 'stable',
    overrides.trend_value ?? 0,
    overrides.status ?? 'compliant',
    overrides.last_updated ?? '2026-02-01',
    ts, ts,
  );
  return result.lastInsertRowid as number;
}

// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/compliance/reporting/stats', () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
    seedReport({ name: `${TAG}-stats-current`, status: 'current' });
    seedReport({ name: `${TAG}-stats-overdue`, status: 'overdue' });
    seedMetric({ name: `${TAG}-stats-metric`, status: 'compliant' });
  });

  it('returns 200 with success envelope', async () => {
    const { status, body } = await req(app, 'GET', '/api/compliance/reporting/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns stats object with expected keys', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/reporting/stats');
    expect(typeof body.data.total).toBe('number');
    expect(typeof body.data.current).toBe('number');
    expect(typeof body.data.dueSoon).toBe('number');
    expect(typeof body.data.overdue).toBe('number');
    expect(typeof body.data.automated).toBe('number');
    expect(typeof body.data.complianceRate).toBe('number');
    expect(typeof body.data.upcomingRequirements).toBe('number');
  });

  it('complianceRate is between 0 and 100', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/reporting/stats');
    expect(body.data.complianceRate).toBeGreaterThanOrEqual(0);
    expect(body.data.complianceRate).toBeLessThanOrEqual(100);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/compliance/reporting/reports', () => {
  let app: Hono;
  let reportId: number;

  beforeAll(() => {
    app = createTestApp();
    reportId = seedReport({ name: `${TAG}-list-reg`, type: 'regulatory', status: 'due_soon', automation_enabled: 1 });
    seedReport({ name: `${TAG}-list-int`, type: 'internal', status: 'current', automation_enabled: 0 });
  });

  it('returns 200 with array', async () => {
    const { status, body } = await req(app, 'GET', '/api/compliance/reporting/reports');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('maps DB fields to frontend shape', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/reporting/reports');
    const rpt = body.data.find((r: any) => r.id === String(reportId));
    expect(rpt).toBeTruthy();
    expect(rpt.name).toBe(`${TAG}-list-reg`);
    expect(rpt.type).toBe('regulatory');
    expect(rpt.status).toBe('due_soon');
    expect(rpt.automationEnabled).toBe(true);
    expect(Array.isArray(rpt.recipients)).toBe(true);
  });

  it('filters by type', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/reporting/reports?type=regulatory');
    expect(body.data.every((r: any) => r.type === 'regulatory')).toBe(true);
  });

  it('filters by status', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/reporting/reports?status=due_soon');
    const found = body.data.some((r: any) => r.name === `${TAG}-list-reg`);
    expect(found).toBe(true);
  });

  it('id is a string', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/reporting/reports');
    const rpt = body.data.find((r: any) => r.name === `${TAG}-list-reg`);
    expect(typeof rpt.id).toBe('string');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('POST /api/compliance/reporting/reports', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('creates a report and returns 201', async () => {
    const { status, body } = await req(app, 'POST', '/api/compliance/reporting/reports', {
      name: `${TAG}-post-new`,
      type: 'audit',
      frequency: 'annual',
      status: 'draft',
      recipients: ['audit@test.com'],
      format: 'pdf',
      automationEnabled: false,
      description: 'Created in test',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe(`${TAG}-post-new`);
    expect(body.data.type).toBe('audit');
    expect(body.data.status).toBe('draft');
  });

  it('returns 400 for missing required name', async () => {
    const { status, body } = await req(app, 'POST', '/api/compliance/reporting/reports', {
      type: 'internal',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('normalizes unknown type to internal', async () => {
    const { body } = await req(app, 'POST', '/api/compliance/reporting/reports', {
      name: `${TAG}-post-type-norm`,
      type: 'unknown_type',
    });
    expect(body.data.type).toBe('internal');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/compliance/reporting/reports/:id', () => {
  let app: Hono;
  let id: number;

  beforeAll(() => {
    app = createTestApp();
    id = seedReport({ name: `${TAG}-get-one` });
  });

  it('returns single report', async () => {
    const { status, body } = await req(app, 'GET', `/api/compliance/reporting/reports/${id}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe(`${TAG}-get-one`);
  });

  it('returns 404 for unknown id', async () => {
    const { status, body } = await req(app, 'GET', '/api/compliance/reporting/reports/9999999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('PUT /api/compliance/reporting/reports/:id', () => {
  let app: Hono;
  let id: number;

  beforeAll(() => {
    app = createTestApp();
    id = seedReport({ name: `${TAG}-put-report`, status: 'current' });
  });

  it('updates report status', async () => {
    const { status, body } = await req(app, 'PUT', `/api/compliance/reporting/reports/${id}`, {
      status: 'overdue',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('overdue');
  });

  it('updates automationEnabled', async () => {
    const { body } = await req(app, 'PUT', `/api/compliance/reporting/reports/${id}`, {
      automationEnabled: true,
    });
    expect(body.data.automationEnabled).toBe(true);
  });

  it('returns 404 for unknown id', async () => {
    const { status } = await req(app, 'PUT', '/api/compliance/reporting/reports/9999999', { status: 'draft' });
    expect(status).toBe(404);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/compliance/reporting/reports/:id', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('deletes an existing report', async () => {
    const id = seedReport({ name: `${TAG}-delete-me` });
    const { status, body } = await req(app, 'DELETE', `/api/compliance/reporting/reports/${id}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('record is gone after delete', async () => {
    const id = seedReport({ name: `${TAG}-delete-gone` });
    await req(app, 'DELETE', `/api/compliance/reporting/reports/${id}`);
    const { status } = await req(app, 'GET', `/api/compliance/reporting/reports/${id}`);
    expect(status).toBe(404);
  });

  it('returns 404 for already-deleted id', async () => {
    const id = seedReport({ name: `${TAG}-delete-twice` });
    await req(app, 'DELETE', `/api/compliance/reporting/reports/${id}`);
    const { status } = await req(app, 'DELETE', `/api/compliance/reporting/reports/${id}`);
    expect(status).toBe(404);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/compliance/reporting/metrics', () => {
  let app: Hono;
  let metricId: number;

  beforeAll(() => {
    app = createTestApp();
    metricId = seedMetric({ name: `${TAG}-metrics-list`, category: 'Quality', status: 'at_risk' });
    seedMetric({ name: `${TAG}-metrics-env`, category: 'Environmental', status: 'compliant' });
  });

  it('returns 200 with array', async () => {
    const { status, body } = await req(app, 'GET', '/api/compliance/reporting/metrics');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('maps metric fields correctly', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/reporting/metrics');
    const m = body.data.find((m: any) => m.id === String(metricId));
    expect(m).toBeTruthy();
    expect(m.name).toBe(`${TAG}-metrics-list`);
    expect(m.category).toBe('Quality');
    expect(m.status).toBe('at_risk');
    expect(typeof m.currentValue).toBe('number');
    expect(typeof m.targetValue).toBe('number');
    expect(typeof m.trendValue).toBe('number');
  });

  it('filters by category', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/reporting/metrics?category=Environmental');
    const found = body.data.some((m: any) => m.name === `${TAG}-metrics-env`);
    expect(found).toBe(true);
    expect(body.data.every((m: any) => m.category === 'Environmental')).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('PUT /api/compliance/reporting/metrics/:id', () => {
  let app: Hono;
  let metricId: number;

  beforeAll(() => {
    app = createTestApp();
    metricId = seedMetric({ name: `${TAG}-metric-put`, status: 'compliant', current_value: 80 });
  });

  it('updates metric values', async () => {
    const { status, body } = await req(app, 'PUT', `/api/compliance/reporting/metrics/${metricId}`, {
      currentValue: 72,
      status: 'at_risk',
      trend: 'down',
      trendValue: -8,
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.currentValue).toBe(72);
    expect(body.data.status).toBe('at_risk');
    expect(body.data.trend).toBe('down');
  });

  it('returns 404 for unknown metric', async () => {
    const { status } = await req(app, 'PUT', '/api/compliance/reporting/metrics/9999999', { currentValue: 50 });
    expect(status).toBe(404);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/compliance/reporting/requirements', () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  it('returns 200 with array', async () => {
    const { status, body } = await req(app, 'GET', '/api/compliance/reporting/requirements');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('maps requirement fields correctly', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/reporting/requirements');
    if (body.data.length > 0) {
      const r = body.data[0];
      expect(typeof r.id).toBe('string');
      expect(typeof r.requirement).toBe('string');
      expect(Array.isArray(r.evidence)).toBe(true);
    }
  });

  it('filters by status', async () => {
    // Insert a known compliant requirement
    const ts = Date.now();
    sqlite.prepare(`
      INSERT INTO compliance_requirements (standard_id, clause_id, requirement, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('test-std', '1.1', `${TAG}-req-compliant`, 'compliant', ts, ts);

    const { body } = await req(app, 'GET', '/api/compliance/reporting/requirements?status=compliant');
    const found = body.data.some((r: any) => r.requirement === `${TAG}-req-compliant`);
    expect(found).toBe(true);
    expect(body.data.every((r: any) => r.status === 'compliant')).toBe(true);

    // Cleanup
    sqlite.prepare(`DELETE FROM compliance_requirements WHERE requirement = '${TAG}-req-compliant'`).run();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('PUT /api/compliance/reporting/requirements/:id', () => {
  let app: Hono;
  let reqId: number;

  beforeAll(() => {
    app = createTestApp();
    const ts = Date.now();
    const res = sqlite.prepare(`
      INSERT INTO compliance_requirements (standard_id, clause_id, requirement, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('test-std', '2.1', `${TAG}-req-put`, 'upcoming', ts, ts);
    reqId = res.lastInsertRowid as number;
  });

  afterAll(() => {
    sqlite.prepare('DELETE FROM compliance_requirements WHERE id = ?').run(reqId);
  });

  it('updates requirement status', async () => {
    const { status, body } = await req(app, 'PUT', `/api/compliance/reporting/requirements/${reqId}`, {
      status: 'in_progress',
      regulation: 'OSHA 1910.134',
      agency: 'OSHA',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('in_progress');
    expect(body.data.regulation).toBe('OSHA 1910.134');
    expect(body.data.agency).toBe('OSHA');
  });

  it('returns 404 for unknown requirement', async () => {
    const { status } = await req(app, 'PUT', '/api/compliance/reporting/requirements/9999999', { status: 'compliant' });
    expect(status).toBe(404);
  });
});
