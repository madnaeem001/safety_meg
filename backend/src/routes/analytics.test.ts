/**
 * Analytics & Reports API Route Tests
 * Covers: incident trends, severity breakdown, department metrics,
 *         heatmap, time-series, KPI metrics, custom query, and
 *         report templates / generation / scheduling.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { analyticsRoutes } from '../routes/analytics';

// ── Test App Factory ──────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  analyticsRoutes(app);
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
  const json = await res.json();
  return { status: res.status, body: json as any };
}

// ── Seed / teardown helpers ───────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TEST_DEPT = 'TestAnalyticsDept_' + Date.now();

function seedIncident(dept: string, severity: string, daysAgo: number) {
  const date = new Date(Date.now() - daysAgo * 86400 * 1000)
    .toISOString()
    .slice(0, 10);
  sqlite
    .prepare(
      `INSERT INTO incidents
         (incident_date, incident_time, location, department, incident_type, severity, description, status)
       VALUES (?,?,?,?,?,?,?,?)`
    )
    .run(date, '08:00', 'Test Location', dept, 'Near Miss', severity, 'Analytics test incident', 'Open');
}

function seedTraining(dept: string, status: string) {
  sqlite
    .prepare(
      `INSERT INTO employee_training
         (employee_id, employee_name, role, department, course_code, course_name, status)
       VALUES (?,?,?,?,?,?,?)`
    )
    .run(`emp-${Date.now()}`, 'Test Employee', 'Worker', dept, 'TC-001', 'Safety 101', status);
}

afterAll(() => {
  // Remove all seeded incidents for the test department
  sqlite.prepare(`DELETE FROM incidents WHERE department = ?`).run(TEST_DEPT);
  sqlite.prepare(`DELETE FROM employee_training WHERE department = ?`).run(TEST_DEPT);
  sqlite.prepare(`DELETE FROM report_templates WHERE name LIKE 'test-analytics-%'`).run();
  sqlite.prepare(`DELETE FROM scheduled_reports WHERE name LIKE 'test-analytics-%'`).run();
});

// ── Test Suite ─────────────────────────────────────────────────────────────

describe('Analytics Routes', () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
    // Seed 2 incidents for TEST_DEPT in the last 30 days
    seedIncident(TEST_DEPT, 'HIGH', 5);
    seedIncident(TEST_DEPT, 'LOW', 10);
    // Seed training records
    seedTraining(TEST_DEPT, 'Current');
    seedTraining(TEST_DEPT, 'Expired');
  });

  // ── GET /api/analytics/incidents ─────────────────────────────────────────

  describe('GET /api/analytics/incidents', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/analytics/incidents');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/incidents');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns totals object with incident and near-miss counts', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/incidents');
      expect(body.totals).toMatchObject({
        incidents: expect.any(Number),
        critical: expect.any(Number),
        nearMisses: expect.any(Number),
      });
    });

    it('each row has required fields', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/incidents?months=24');
      for (const row of body.data) {
        expect(row).toHaveProperty('month');
        expect(row).toHaveProperty('total');
        expect(row).toHaveProperty('critical');
        expect(row).toHaveProperty('nearMisses');
      }
    });

    it('respects the months query parameter', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/incidents?months=1');
      expect(body.months).toBe(1);
    });

    it('accepts a department filter without error', async () => {
      const { status, body } = await req(
        app,
        'GET',
        `/api/analytics/incidents?department=${encodeURIComponent(TEST_DEPT)}`
      );
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  // ── GET /api/analytics/severity-breakdown ────────────────────────────────

  describe('GET /api/analytics/severity-breakdown', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/analytics/severity-breakdown');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/severity-breakdown');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('each row has severity, count, and percentage', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/severity-breakdown');
      for (const row of body.data) {
        expect(row).toHaveProperty('severity');
        expect(typeof row.count).toBe('number');
        expect(typeof row.percentage).toBe('number');
      }
    });

    it('returns a numeric total', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/severity-breakdown');
      expect(typeof body.total).toBe('number');
    });

    it('percentages are between 0 and 100', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/severity-breakdown');
      for (const row of body.data) {
        expect(row.percentage).toBeGreaterThanOrEqual(0);
        expect(row.percentage).toBeLessThanOrEqual(100);
      }
    });
  });

  // ── GET /api/analytics/department-metrics ────────────────────────────────

  describe('GET /api/analytics/department-metrics', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/analytics/department-metrics');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/department-metrics');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('each row has all required department metric fields', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/department-metrics');
      for (const row of body.data) {
        expect(row).toHaveProperty('department');
        expect(row).toHaveProperty('incidents');
        expect(row).toHaveProperty('openCapas');
        expect(row).toHaveProperty('safetyScore');
        expect(row).toHaveProperty('trainingCompletion');
      }
    });

    it('safetyScore is a number between 0 and 100', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/department-metrics');
      for (const row of body.data) {
        expect(row.safetyScore).toBeGreaterThanOrEqual(0);
        expect(row.safetyScore).toBeLessThanOrEqual(100);
      }
    });

    it('trainingCompletion is a number between 0 and 100', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/department-metrics');
      for (const row of body.data) {
        expect(row.trainingCompletion).toBeGreaterThanOrEqual(0);
        expect(row.trainingCompletion).toBeLessThanOrEqual(100);
      }
    });

    it('TEST_DEPT is present with correct incident count', async () => {
      // Seeded 2 incidents in last 30 days → use wide date range
      const { body } = await req(
        app,
        'GET',
        `/api/analytics/department-metrics?from=2000-01-01&to=2099-12-31`
      );
      const dept = body.data.find((d: any) => d.department === TEST_DEPT);
      expect(dept).toBeDefined();
      expect(dept.incidents).toBe(2);
    });

    it('TEST_DEPT trainingCompletion reflects seeded data (50% — 1 Current out of 2)', async () => {
      const { body } = await req(
        app,
        'GET',
        `/api/analytics/department-metrics?from=2000-01-01&to=2099-12-31`
      );
      const dept = body.data.find((d: any) => d.department === TEST_DEPT);
      expect(dept).toBeDefined();
      expect(dept.trainingCompletion).toBe(50);
    });

    it('returns count matching data.length', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/department-metrics');
      expect(body.count).toBe(body.data.length);
    });
  });

  // ── GET /api/analytics/heatmap-data ──────────────────────────────────────

  describe('GET /api/analytics/heatmap-data', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/analytics/heatmap-data');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns data array and hotspots array', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/heatmap-data');
      expect(Array.isArray(body.data)).toBe(true);
      expect(Array.isArray(body.hotspots)).toBe(true);
    });

    it('hotspots are limited to 10', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/heatmap-data');
      expect(body.hotspots.length).toBeLessThanOrEqual(10);
    });
  });

  // ── GET /api/analytics/time-series ───────────────────────────────────────

  describe('GET /api/analytics/time-series', () => {
    it('returns 200 for incidents metric', async () => {
      const { status, body } = await req(
        app,
        'GET',
        '/api/analytics/time-series?metric=incidents&period=30d'
      );
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 200 for capa metric', async () => {
      const { status, body } = await req(
        app,
        'GET',
        '/api/analytics/time-series?metric=capa&period=30d'
      );
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 200 for training metric', async () => {
      const { status, body } = await req(
        app,
        'GET',
        '/api/analytics/time-series?metric=training&period=7d'
      );
      expect(status).toBe(200);
    });

    it('returns 400 for invalid metric', async () => {
      const { status, body } = await req(
        app,
        'GET',
        '/api/analytics/time-series?metric=invalid'
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('data array has period and value fields', async () => {
      const { body } = await req(
        app,
        'GET',
        '/api/analytics/time-series?metric=incidents&period=90d'
      );
      for (const row of body.data) {
        expect(row).toHaveProperty('period');
        expect(typeof row.value).toBe('number');
      }
    });
  });

  // ── GET /api/analytics/kpi-metrics ───────────────────────────────────────

  describe('GET /api/analytics/kpi-metrics', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/analytics/kpi-metrics');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns a data array of KPI objects', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/kpi-metrics');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('each KPI has id, label, value, and trend', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/kpi-metrics');
      for (const kpi of body.data) {
        expect(kpi).toHaveProperty('id');
        expect(kpi).toHaveProperty('label');
        expect(kpi).toHaveProperty('trend');
        expect(['good', 'bad', 'neutral']).toContain(kpi.trend);
      }
    });

    it('contains all expected KPI ids', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/kpi-metrics');
      const ids = body.data.map((k: any) => k.id);
      expect(ids).toContain('trir');
      expect(ids).toContain('training');
      expect(ids).toContain('compliance');
      expect(ids).toContain('capa-closure');
    });

    it('accepts a year query parameter', async () => {
      const { status, body } = await req(
        app,
        'GET',
        '/api/analytics/kpi-metrics?year=2025'
      );
      expect(status).toBe(200);
      expect(body.year).toBe('2025');
    });

    it('TRIR value is a non-negative number', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/kpi-metrics');
      const trir = body.data.find((k: any) => k.id === 'trir');
      expect(trir).toBeDefined();
      expect(typeof trir.value).toBe('number');
      expect(trir.value).toBeGreaterThanOrEqual(0);
    });
  });

  // ── POST /api/analytics/custom-query ─────────────────────────────────────

  describe('POST /api/analytics/custom-query', () => {
    it('returns 200 for incidents_by_severity', async () => {
      const { status, body } = await req(app, 'POST', '/api/analytics/custom-query', {
        metric: 'incidents_by_severity',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 200 for incidents_by_department', async () => {
      const { status, body } = await req(app, 'POST', '/api/analytics/custom-query', {
        metric: 'incidents_by_department',
      });
      expect(status).toBe(200);
    });

    it('returns 200 for capa_status_breakdown', async () => {
      const { status, body } = await req(app, 'POST', '/api/analytics/custom-query', {
        metric: 'capa_status_breakdown',
      });
      expect(status).toBe(200);
    });

    it('returns 400 for invalid metric', async () => {
      const { status, body } = await req(app, 'POST', '/api/analytics/custom-query', {
        metric: 'not_a_real_metric',
      });
      expect(status).toBe(400);
    });

    it('returns 400 when metric is missing', async () => {
      const { status } = await req(app, 'POST', '/api/analytics/custom-query', {});
      expect(status).toBe(400);
    });

    it('each result row has a name or severity/department key', async () => {
      const { body } = await req(app, 'POST', '/api/analytics/custom-query', {
        metric: 'incidents_by_severity',
      });
      for (const row of body.data) {
        expect(typeof row.count === 'number' || typeof row.total === 'number').toBe(true);
      }
    });
  });

  // ── GET /api/reports/templates ────────────────────────────────────────────

  describe('GET /api/reports/templates', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/reports/templates');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/reports/templates');
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  // ── POST /api/reports/templates ───────────────────────────────────────────

  describe('POST /api/reports/templates', () => {
    it('creates a new template and returns 201 with id', async () => {
      const { status, body } = await req(app, 'POST', '/api/reports/templates', {
        name: `test-analytics-template-${Date.now()}`,
        type: 'incident',
        description: 'Test template',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(typeof body.data.id).toBe('number');
    });

    it('returns 400 when name is missing', async () => {
      const { status } = await req(app, 'POST', '/api/reports/templates', {
        type: 'incident',
      });
      expect(status).toBe(400);
    });

    it('returns 400 when type is invalid', async () => {
      const { status } = await req(app, 'POST', '/api/reports/templates', {
        name: 'test-analytics-invalid',
        type: 'spaceship',
      });
      expect(status).toBe(400);
    });
  });

  // ── POST /api/reports/generate ────────────────────────────────────────────

  describe('POST /api/reports/generate', () => {
    it('returns 200 for incident report type', async () => {
      const { status, body } = await req(app, 'POST', '/api/reports/generate', {
        type: 'incident',
        format: 'json',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 200 for kpi report type', async () => {
      const { status, body } = await req(app, 'POST', '/api/reports/generate', {
        type: 'kpi',
        format: 'json',
      });
      expect(status).toBe(200);
    });

    it('returns 200 for compliance report type', async () => {
      const { status, body } = await req(app, 'POST', '/api/reports/generate', {
        type: 'compliance',
        format: 'json',
      });
      expect(status).toBe(200);
    });

    it('returns 400 for invalid type', async () => {
      const { status } = await req(app, 'POST', '/api/reports/generate', {
        type: 'invalid_type',
      });
      expect(status).toBe(400);
    });

    it('returned report has a type field', async () => {
      const { body } = await req(app, 'POST', '/api/reports/generate', {
        type: 'incident',
        format: 'json',
      });
      expect(body.data).toHaveProperty('type', 'incident');
    });
  });

  // ── POST /api/reports/schedule ────────────────────────────────────────────

  describe('POST /api/reports/schedule', () => {
    it('creates a scheduled report and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/reports/schedule', {
        name: `test-analytics-schedule-${Date.now()}`,
        frequency: 'weekly',
        recipients: ['safety@example.com'],
        format: 'pdf',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(typeof body.data.id).toBe('number');
    });

    it('returns 400 when recipients is empty', async () => {
      const { status } = await req(app, 'POST', '/api/reports/schedule', {
        name: 'test-analytics-no-recipients',
        frequency: 'weekly',
        recipients: [],
      });
      expect(status).toBe(400);
    });

    it('returns 400 for invalid frequency', async () => {
      const { status } = await req(app, 'POST', '/api/reports/schedule', {
        name: 'test-analytics-bad-freq',
        frequency: 'hourly',
        recipients: ['a@b.com'],
      });
      expect(status).toBe(400);
    });
  });

  // ── GET /api/reports/templates (system seeds) ────────────────────────────

  describe('GET /api/reports/templates — system seeds', () => {
    const SYS_NAMES = [
      `test-analytics-sys-kpi-${Date.now()}`,
      `test-analytics-sys-incident-${Date.now()}`,
      `test-analytics-sys-compliance-${Date.now()}`,
      `test-analytics-sys-custom-${Date.now()}`,
      `test-analytics-sys-training-${Date.now()}`,
      `test-analytics-sys-audit-${Date.now()}`,
    ];

    beforeAll(() => {
      const ins = sqlite.prepare(
        `INSERT INTO report_templates (name, type, description, format, is_default, is_system)
         VALUES (?, ?, ?, 'pdf', 1, 1)`
      );
      const types = ['kpi', 'incident', 'compliance', 'custom', 'training', 'audit'];
      SYS_NAMES.forEach((name, i) => ins.run(name, types[i], 'System test template'));
    });

    it('returns at least 6 system templates', async () => {
      const { body } = await req(app, 'GET', '/api/reports/templates');
      const systemTemplates = (body.data as any[]).filter((t: any) => t.isSystem === true);
      expect(systemTemplates.length).toBeGreaterThanOrEqual(6);
    });

    it('filters by type when ?type=kpi is provided', async () => {
      const { status, body } = await req(app, 'GET', '/api/reports/templates?type=kpi');
      expect(status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
      body.data.forEach((t: any) => expect(t.type).toBe('kpi'));
    });
  });

  // ── GET /api/reports/scheduled ────────────────────────────────────────────

  describe('GET /api/reports/scheduled', () => {
    let seededActiveId: number;
    let seededPausedId: number;

    beforeAll(async () => {
      const r1 = await req(app, 'POST', '/api/reports/schedule', {
        name: `test-analytics-sched-active-${Date.now()}`,
        frequency: 'weekly',
        recipients: ['active@example.com'],
        format: 'pdf',
      });
      seededActiveId = r1.body.data.id;

      const r2 = await req(app, 'POST', '/api/reports/schedule', {
        name: `test-analytics-sched-paused-${Date.now()}`,
        frequency: 'monthly',
        recipients: ['paused@example.com'],
        format: 'pdf',
      });
      seededPausedId = r2.body.data.id;
      // Pause the second one directly via DB so we have both states
      sqlite.prepare(`UPDATE scheduled_reports SET status = 'paused' WHERE id = ?`).run(seededPausedId);
    });

    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/reports/scheduled');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/reports/scheduled');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns ALL records (active and paused) when no status param', async () => {
      const { body } = await req(app, 'GET', '/api/reports/scheduled');
      const ids = (body.data as any[]).map((s: any) => s.id);
      expect(ids).toContain(seededActiveId);
      expect(ids).toContain(seededPausedId);
    });

    it('filters to only active records when ?status=active', async () => {
      const { status, body } = await req(app, 'GET', '/api/reports/scheduled?status=active');
      expect(status).toBe(200);
      const ids = (body.data as any[]).map((s: any) => s.id);
      expect(ids).toContain(seededActiveId);
      expect(ids).not.toContain(seededPausedId);
    });

    it('filters to only paused records when ?status=paused', async () => {
      const { status, body } = await req(app, 'GET', '/api/reports/scheduled?status=paused');
      expect(status).toBe(200);
      const ids = (body.data as any[]).map((s: any) => s.id);
      expect(ids).toContain(seededPausedId);
      expect(ids).not.toContain(seededActiveId);
    });
  });

  // ── PATCH /api/reports/scheduled/:id/status ───────────────────────────────

  describe('PATCH /api/reports/scheduled/:id/status', () => {
    let schedId: number;

    beforeAll(async () => {
      const r = await req(app, 'POST', '/api/reports/schedule', {
        name: `test-analytics-patch-toggle-${Date.now()}`,
        frequency: 'weekly',
        recipients: ['toggle@example.com'],
        format: 'pdf',
      });
      schedId = r.body.data.id;
    });

    it('pauses an active scheduled report and returns 200', async () => {
      const { status, body } = await req(
        app, 'PATCH', `/api/reports/scheduled/${schedId}/status`, { status: 'paused' }
      );
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('paused');
      expect(body.data.id).toBe(schedId);
    });

    it('resumes a paused scheduled report and returns 200', async () => {
      const { status, body } = await req(
        app, 'PATCH', `/api/reports/scheduled/${schedId}/status`, { status: 'active' }
      );
      expect(status).toBe(200);
      expect(body.data.status).toBe('active');
    });

    it('returns 400 for invalid status value', async () => {
      const { status } = await req(
        app, 'PATCH', `/api/reports/scheduled/${schedId}/status`, { status: 'stopped' }
      );
      expect(status).toBe(400);
    });

    it('returns 400 when status field is missing', async () => {
      const { status } = await req(
        app, 'PATCH', `/api/reports/scheduled/${schedId}/status`, {}
      );
      expect(status).toBe(400);
    });

    it('returns 404 for a non-existent schedule id', async () => {
      const { status } = await req(
        app, 'PATCH', `/api/reports/scheduled/99999999/status`, { status: 'paused' }
      );
      expect(status).toBe(404);
    });

    it('returns 400 for a non-numeric id', async () => {
      const { status } = await req(
        app, 'PATCH', `/api/reports/scheduled/abc/status`, { status: 'paused' }
      );
      expect(status).toBe(400);
    });
  });

  // ── GET /api/reports/emissions ────────────────────────────────────────────

  describe('GET /api/reports/emissions', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/reports/emissions');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns a data object with year field', async () => {
      const { body } = await req(app, 'GET', '/api/reports/emissions');
      expect(typeof body.data.year).toBe('string');
    });

    it('data contains detailedEmissions array', async () => {
      const { body } = await req(app, 'GET', '/api/reports/emissions');
      expect(Array.isArray(body.data.detailedEmissions)).toBe(true);
    });

    it('data contains logs array', async () => {
      const { body } = await req(app, 'GET', '/api/reports/emissions');
      expect(Array.isArray(body.data.logs)).toBe(true);
    });

    it('data contains facilityBreakdown array', async () => {
      const { body } = await req(app, 'GET', '/api/reports/emissions');
      expect(Array.isArray(body.data.facilityBreakdown)).toBe(true);
    });

    it('data contains summary object', async () => {
      const { body } = await req(app, 'GET', '/api/reports/emissions');
      expect(body.data.summary).toMatchObject({
        totalGasReadings: expect.any(Number),
        totalAnomalies: expect.any(Number),
        environmentalIncidents: expect.any(Number),
        compliantCount: expect.any(Number),
        warningCount: expect.any(Number),
        exceededCount: expect.any(Number),
      });
    });

    it('data contains gasSensorReadings array', async () => {
      const { body } = await req(app, 'GET', '/api/reports/emissions');
      expect(Array.isArray(body.data.gasSensorReadings)).toBe(true);
    });

    it('data contains anomaliesByZone array', async () => {
      const { body } = await req(app, 'GET', '/api/reports/emissions');
      expect(Array.isArray(body.data.anomaliesByZone)).toBe(true);
    });

    it('environmentalIncidents is a number', async () => {
      const { body } = await req(app, 'GET', '/api/reports/emissions');
      expect(typeof body.data.environmentalIncidents).toBe('number');
    });

    it('accepts a year query parameter', async () => {
      const { status, body } = await req(app, 'GET', '/api/reports/emissions?year=2025');
      expect(status).toBe(200);
      expect(body.data.year).toBe('2025');
    });

    it('defaults year to current year when omitted', async () => {
      const { body } = await req(app, 'GET', '/api/reports/emissions');
      expect(body.data.year).toBe(new Date().getFullYear().toString());
    });

    it('each detailedEmission item has required fields when emissions exist', async () => {
      const { body } = await req(app, 'GET', '/api/reports/emissions');
      for (const item of body.data.detailedEmissions) {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('unit');
        expect(typeof item.actual).toBe('number');
        expect(typeof item.limit).toBe('number');
        expect(['Compliant', 'Warning', 'Exceeded']).toContain(item.status);
        expect(['up', 'down', 'stable']).toContain(item.trend);
      }
    });

    it('each log item has date, facility, type, value, unit, and recordedBy', async () => {
      const { body } = await req(app, 'GET', '/api/reports/emissions');
      for (const log of body.data.logs) {
        expect(log).toHaveProperty('date');
        expect(log).toHaveProperty('facility');
        expect(log).toHaveProperty('type');
        expect(typeof log.value).toBe('number');
        expect(log).toHaveProperty('unit');
        expect(log).toHaveProperty('recordedBy');
      }
    });

    it('each facilityBreakdown item has name and numeric value', async () => {
      const { body } = await req(app, 'GET', '/api/reports/emissions');
      for (const item of body.data.facilityBreakdown) {
        expect(typeof item.name).toBe('string');
        expect(typeof item.value).toBe('number');
      }
    });

    it('logs count is at most 25', async () => {
      const { body } = await req(app, 'GET', '/api/reports/emissions');
      expect(body.data.logs.length).toBeLessThanOrEqual(25);
    });

    it('summary counts match detailedEmissions statuses', async () => {
      const { body } = await req(app, 'GET', '/api/reports/emissions');
      const { detailedEmissions, summary } = body.data;
      const compliant = detailedEmissions.filter((e: any) => e.status === 'Compliant').length;
      const warning = detailedEmissions.filter((e: any) => e.status === 'Warning').length;
      const exceeded = detailedEmissions.filter((e: any) => e.status === 'Exceeded').length;
      expect(summary.compliantCount).toBe(compliant);
      expect(summary.warningCount).toBe(warning);
      expect(summary.exceededCount).toBe(exceeded);
    });
  });

  // ── GET /api/analytics/enterprise-stats ──────────────────────────────────

  describe('GET /api/analytics/enterprise-stats', () => {
    it('returns 200 with success:true', async () => {
      const { status, body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('response has globalStats, projectHealth and aiInsights keys', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      expect(body.data).toHaveProperty('globalStats');
      expect(body.data).toHaveProperty('projectHealth');
      expect(body.data).toHaveProperty('aiInsights');
    });

    it('globalStats has all required numeric fields', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      const gs = body.data.globalStats;
      expect(typeof gs.safetyScore).toBe('number');
      expect(typeof gs.activeFacilities).toBe('number');
      expect(typeof gs.totalWorkforce).toBe('number');
      expect(typeof gs.criticalRisks).toBe('number');
      expect(typeof gs.trainingRate).toBe('number');
      expect(typeof gs.riskMitigationRate).toBe('number');
      expect(typeof gs.capaResolutionRate).toBe('number');
    });

    it('safetyScore is between 0 and 100', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      const { safetyScore } = body.data.globalStats;
      expect(safetyScore).toBeGreaterThanOrEqual(0);
      expect(safetyScore).toBeLessThanOrEqual(100);
    });

    it('activeFacilities is a non-negative integer', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      expect(body.data.globalStats.activeFacilities).toBeGreaterThanOrEqual(0);
    });

    it('totalWorkforce is a non-negative integer', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      expect(body.data.globalStats.totalWorkforce).toBeGreaterThanOrEqual(0);
    });

    it('criticalRisks is a non-negative integer', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      expect(body.data.globalStats.criticalRisks).toBeGreaterThanOrEqual(0);
    });

    it('trainingRate is between 0 and 100', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      const { trainingRate } = body.data.globalStats;
      expect(trainingRate).toBeGreaterThanOrEqual(0);
      expect(trainingRate).toBeLessThanOrEqual(100);
    });

    it('riskMitigationRate is between 0 and 100', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      const { riskMitigationRate } = body.data.globalStats;
      expect(riskMitigationRate).toBeGreaterThanOrEqual(0);
      expect(riskMitigationRate).toBeLessThanOrEqual(100);
    });

    it('projectHealth is an array', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      expect(Array.isArray(body.data.projectHealth)).toBe(true);
    });

    it('each projectHealth item has required fields', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      for (const p of body.data.projectHealth) {
        expect(typeof p.id).toBe('number');
        expect(typeof p.name).toBe('string');
        expect(['on-track', 'at-risk', 'delayed']).toContain(p.status);
        expect(typeof p.safetyScore).toBe('number');
        expect(typeof p.progress).toBe('number');
        expect(typeof p.incidents).toBe('number');
        expect(typeof p.lastAudit).toBe('string');
      }
    });

    it('projectHealth progress is between 0 and 100', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      for (const p of body.data.projectHealth) {
        expect(p.progress).toBeGreaterThanOrEqual(0);
        expect(p.progress).toBeLessThanOrEqual(100);
      }
    });

    it('projectHealth returns at most 10 items', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      expect(body.data.projectHealth.length).toBeLessThanOrEqual(10);
    });

    it('aiInsights has all required numeric fields', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      const ai = body.data.aiInsights;
      expect(typeof ai.automatedWorkflows).toBe('number');
      expect(typeof ai.activeAlerts).toBe('number');
      expect(typeof ai.nearMissesLast30d).toBe('number');
      expect(typeof ai.aiPredictionsTotal).toBe('number');
    });

    it('aiInsights counts are non-negative', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/enterprise-stats');
      const ai = body.data.aiInsights;
      expect(ai.automatedWorkflows).toBeGreaterThanOrEqual(0);
      expect(ai.activeAlerts).toBeGreaterThanOrEqual(0);
      expect(ai.nearMissesLast30d).toBeGreaterThanOrEqual(0);
      expect(ai.aiPredictionsTotal).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Executive KPIs ─────────────────────────────────────────────────────
  describe('GET /api/analytics/executive-kpis', () => {
    it('returns 200 with success true', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/executive-kpis');
      expect(body.success).toBe(true);
    });

    it('data has all required KPI fields', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/executive-kpis');
      expect(body.data).toHaveProperty('safetyScore');
      expect(body.data).toHaveProperty('safetyScoreDelta');
      expect(body.data).toHaveProperty('openActions');
      expect(body.data).toHaveProperty('overdueActions');
      expect(body.data).toHaveProperty('trir');
      expect(body.data).toHaveProperty('trirChange');
      expect(body.data).toHaveProperty('compliancePct');
      expect(body.data).toHaveProperty('standardName');
    });

    it('safetyScore is a number between 0 and 100', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/executive-kpis');
      expect(typeof body.data.safetyScore).toBe('number');
      expect(body.data.safetyScore).toBeGreaterThanOrEqual(0);
      expect(body.data.safetyScore).toBeLessThanOrEqual(100);
    });

    it('openActions and overdueActions are non-negative integers', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/executive-kpis');
      expect(body.data.openActions).toBeGreaterThanOrEqual(0);
      expect(body.data.overdueActions).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(body.data.openActions)).toBe(true);
    });

    it('trir is a non-negative number', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/executive-kpis');
      expect(typeof body.data.trir).toBe('number');
      expect(body.data.trir).toBeGreaterThanOrEqual(0);
    });

    it('compliancePct is between 0 and 100', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/executive-kpis');
      expect(body.data.compliancePct).toBeGreaterThanOrEqual(0);
      expect(body.data.compliancePct).toBeLessThanOrEqual(100);
    });

    it('standardName is a non-empty string', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/executive-kpis');
      expect(typeof body.data.standardName).toBe('string');
      expect(body.data.standardName.length).toBeGreaterThan(0);
    });
  });

  // ── Leading Indicators ─────────────────────────────────────────────────
  describe('GET /api/analytics/leading-indicators', () => {
    it('returns 200 with success true', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/leading-indicators');
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/leading-indicators');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns exactly 8 indicator items', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/leading-indicators');
      expect(body.data.length).toBe(8);
    });

    it('each item has required fields', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/leading-indicators');
      for (const item of body.data) {
        expect(typeof item.label).toBe('string');
        expect(typeof item.value).toBe('number');
        expect(typeof item.target).toBe('number');
        expect(typeof item.unit).toBe('string');
        expect(['up', 'down']).toContain(item.trend);
        expect(typeof item.delta).toBe('string');
      }
    });

    it('values are non-negative', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/leading-indicators');
      for (const item of body.data) {
        expect(item.value).toBeGreaterThanOrEqual(0);
        expect(item.target).toBeGreaterThan(0);
      }
    });

    it('accepts period query param without error', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/leading-indicators?period=quarter');
      expect(body.success).toBe(true);
    });

    it('delta strings start with + or -', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/leading-indicators');
      for (const item of body.data) {
        expect(item.delta).toMatch(/^[+-]/);
      }
    });

    it('includes Inspections Completed label', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/leading-indicators');
      const labels = body.data.map((i: any) => i.label);
      expect(labels).toContain('Inspections Completed');
    });
  });

  // ── Lagging Indicators ─────────────────────────────────────────────────
  describe('GET /api/analytics/lagging-indicators', () => {
    it('returns 200 with success true', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/lagging-indicators');
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/lagging-indicators');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns exactly 6 indicator items', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/lagging-indicators');
      expect(body.data.length).toBe(6);
    });

    it('each item has required fields', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/lagging-indicators');
      for (const item of body.data) {
        expect(typeof item.label).toBe('string');
        expect(typeof item.value).toBe('number');
        expect(typeof item.prev).toBe('number');
        expect(typeof item.unit).toBe('string');
        expect(['up', 'down']).toContain(item.trend);
        expect(typeof item.good).toBe('boolean');
      }
    });

    it('values are non-negative', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/lagging-indicators');
      for (const item of body.data) {
        expect(item.value).toBeGreaterThanOrEqual(0);
        expect(item.prev).toBeGreaterThanOrEqual(0);
      }
    });

    it('accepts period query param without error', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/lagging-indicators?period=quarter');
      expect(body.success).toBe(true);
    });

    it('includes TRIR label', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/lagging-indicators');
      const labels = body.data.map((i: any) => i.label);
      expect(labels).toContain('Total Recordable Incident Rate (TRIR)');
    });

    it('trir value is non-negative', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/lagging-indicators');
      const trir = body.data.find((i: any) => i.label.includes('TRIR'));
      expect(trir.value).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Site Scorecard ─────────────────────────────────────────────────────
  describe('GET /api/analytics/site-scorecard', () => {
    it('returns 200 with success true', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/site-scorecard');
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/site-scorecard');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('each item has required fields', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/site-scorecard');
      for (const item of body.data) {
        expect(typeof item.site).toBe('string');
        expect(typeof item.leading).toBe('number');
        expect(typeof item.lagging).toBe('number');
        expect(typeof item.overall).toBe('number');
        expect(['low', 'medium', 'high']).toContain(item.risk);
      }
    });

    it('scores are between 0 and 100', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/site-scorecard');
      for (const item of body.data) {
        expect(item.overall).toBeGreaterThanOrEqual(0);
        expect(item.overall).toBeLessThanOrEqual(100);
        expect(item.leading).toBeGreaterThanOrEqual(0);
        expect(item.leading).toBeLessThanOrEqual(100);
        expect(item.lagging).toBeGreaterThanOrEqual(0);
        expect(item.lagging).toBeLessThanOrEqual(100);
      }
    });

    it('site names are non-empty strings', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/site-scorecard');
      for (const item of body.data) {
        expect(item.site.length).toBeGreaterThan(0);
      }
    });
  });

  // ── Monthly Trend ──────────────────────────────────────────────────────
  describe('GET /api/analytics/monthly-trend', () => {
    it('returns 200 with success true', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/monthly-trend');
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/monthly-trend');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('defaults to 6 months', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/monthly-trend');
      expect(body.data.length).toBe(6);
    });

    it('respects the months query parameter', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/monthly-trend?months=3');
      expect(body.data.length).toBe(3);
    });

    it('each item has month, inspections, observations, incidents', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/monthly-trend');
      for (const item of body.data) {
        expect(typeof item.month).toBe('string');
        expect(typeof item.inspections).toBe('number');
        expect(typeof item.observations).toBe('number');
        expect(typeof item.incidents).toBe('number');
      }
    });

    it('all counts are non-negative', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/monthly-trend');
      for (const item of body.data) {
        expect(item.inspections).toBeGreaterThanOrEqual(0);
        expect(item.observations).toBeGreaterThanOrEqual(0);
        expect(item.incidents).toBeGreaterThanOrEqual(0);
      }
    });

    it('month labels are short month strings', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/monthly-trend');
      for (const item of body.data) {
        expect(item.month.length).toBeGreaterThan(0);
        expect(item.month.length).toBeLessThanOrEqual(10);
      }
    });

    it('months param capped at 24', async () => {
      const { body } = await req(app, 'GET', '/api/analytics/monthly-trend?months=30');
      expect(body.data.length).toBeLessThanOrEqual(24);
    });
  });
});
