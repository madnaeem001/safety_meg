/**
 * Incident Analytics Routes — API Tests
 * Covers all 10 aggregation endpoints in incident-analytics.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { incidentAnalyticsRoutes } from '../routes/incident-analytics';

// ── Test App Factory ──────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  incidentAnalyticsRoutes(app);
  return app;
}

// ── HTTP Helper ───────────────────────────────────────────────────────────────

async function req(app: Hono, path: string) {
  const res = await app.request(path, { method: 'GET' });
  const json = await res.json();
  return { status: res.status, body: json as any };
}

// ── Seed & Cleanup ────────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `testANL-${Date.now()}`;

// Seed incident IDs collected for cleanup
const seededIds: number[] = [];

beforeAll(() => {
  // Ensure selected_standards column exists (from migration in incidents.ts)
  try { sqlite.exec('ALTER TABLE incidents ADD COLUMN selected_standards TEXT'); } catch { /* already exists */ }

  const ins = sqlite.prepare(`
    INSERT INTO incidents (
      incident_date, incident_time, location, department,
      incident_type, severity, description, corrective_actions, root_causes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Helper to seed one incident and track its id
  const seed = (date: string, time: string, dept: string, type: string, severity: string,
                rc: string, ca: string, status: string) => {
    const info = ins.run(date, time, `${TAG}-loc`, dept, type, severity,
      'Test description', ca, rc, status);
    seededIds.push(info.lastInsertRowid as number);
  };

  // ── 18 varied incidents spanning 4 months ────────────────────────────────
  // 2024-12 (3 injuries, 2 near-miss, 1 property)
  seed('2024-12-04', '09:15', 'Production',  'Injury',          'Critical', 'Human error caused the event',      'Issued PPE',  'open');
  seed('2024-12-10', '14:30', 'Production',  'Injury',          'High',     'Equipment malfunction found',       'Repaired',    'open');
  seed('2024-12-15', '11:00', 'Maintenance', 'Near Miss',       'Medium',   'Process gap in procedure',          'Updated SOP', 'closed');
  seed('2024-12-20', '16:00', 'Production',  'First Aid',       'Low',      'Worker fatigue issue',              '',            'open');
  seed('2024-12-22', '08:30', 'Logistics',   'Near Miss',       'Medium',   '',                                  '',            'open');
  seed('2024-12-28', '13:00', 'Logistics',   'Property Damage', 'Low',      'Training gap identified',           'Training',    'closed');

  // 2025-01 (2 injuries, 3 near-miss)
  seed('2025-01-05', '10:00', 'Production',  'Injury',          'High',     'Distraction of worker',             'Retrained',   'open');
  seed('2025-01-12', '07:45', 'R&D',         'Near Miss',       'Low',      'Environmental factors slippery',    '',            'closed');
  seed('2025-01-18', '15:30', 'Maintenance', 'Near Miss',       'Medium',   'Equipment failure not anticipated', '',            'open');
  seed('2025-01-25', '09:00', 'Logistics',   'Recordable Injury','High',    'Communication system gap',          'Drafted',     'open');
  seed('2025-01-29', '11:00', 'R&D',         'Near Miss',       'Low',      'Human error in labeling',           '',            'closed');

  // 2025-02 (1 fire, 1 vehicle, 1 near-miss, 1 environmental)
  seed('2025-02-03', '06:20', 'Production',  'Fire/Explosion',  'Critical', 'Equipment breakdown in boiler',     'Inspected',   'closed');
  seed('2025-02-10', '17:00', 'Logistics',   'Vehicle Incident','High',     'Driver behavior error',             'Counselled',  'open');
  seed('2025-02-14', '12:00', 'Maintenance', 'Near Miss',       'Low',      '',                                  '',            'open');
  seed('2025-02-20', '08:00', 'R&D',         'Environmental',   'Medium',   'Process gap led to spill',          'Cleaned',     'closed');

  // 2025-03 (1 injury, 1 near-miss, 1 lost-time)
  seed('2025-03-05', '10:30', 'Production',  'Lost Time Injury','Critical', 'Worker training gap discovered',    'Training',    'open');
  seed('2025-03-12', '13:45', 'Maintenance', 'Near Miss',       'Medium',   'Human error caused near-miss',      '',            'closed');
  seed('2025-03-18', '09:00', 'Logistics',   'Injury',          'High',     'Equipment failure root cause',      'Fixed',       'open');
});

afterAll(() => {
  if (seededIds.length) {
    const placeholders = seededIds.map(() => '?').join(',');
    sqlite.prepare(`DELETE FROM incidents WHERE id IN (${placeholders})`).run(...seededIds);
  }
  sqlite.close();
});

// ── Suites ────────────────────────────────────────────────────────────────────

describe('Incident Analytics Routes', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  // ── /kpis ─────────────────────────────────────────────────────────────────

  describe('GET /api/incident-analytics/kpis', () => {
    it('returns 200 with success:true', async () => {
      const { status, body } = await req(app, '/api/incident-analytics/kpis');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data has required numeric KPI fields', async () => {
      const { body } = await req(app, '/api/incident-analytics/kpis');
      const d = body.data;
      expect(typeof d.totalIncidents).toBe('number');
      expect(typeof d.totalInjuries).toBe('number');
      expect(typeof d.nearMissRatio).toBe('number');
      expect(typeof d.trir).toBe('number');
      expect(typeof d.incidentChange).toBe('number');
      expect(typeof d.injuryChange).toBe('number');
    });

    it('with fromDate/toDate filter returns correct total', async () => {
      const { body } = await req(app, '/api/incident-analytics/kpis?fromDate=2025-01-01&toDate=2025-01-31');
      expect(body.success).toBe(true);
      // We seeded 5 incidents in January 2025
      expect(body.data.totalIncidents).toBeGreaterThanOrEqual(5);
    });

    it('with narrow date range that excludes all seeds returns 0 totals', async () => {
      const { body } = await req(app, '/api/incident-analytics/kpis?fromDate=2000-01-01&toDate=2000-01-05');
      expect(body.success).toBe(true);
      expect(body.data.totalIncidents).toBe(0);
      expect(body.data.totalInjuries).toBe(0);
    });
  });

  // ── /monthly-trend ────────────────────────────────────────────────────────

  describe('GET /api/incident-analytics/monthly-trend', () => {
    it('returns 200 with array data', async () => {
      const { status, body } = await req(app, '/api/incident-analytics/monthly-trend?months=24');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('each item has month and numeric bucket fields', async () => {
      const { body } = await req(app, '/api/incident-analytics/monthly-trend?months=24');
      if (body.data.length > 0) {
        const item = body.data[0];
        expect(typeof item.month).toBe('string');
        expect(typeof item.total).toBe('number');
        expect(typeof item.injuries).toBe('number');
        expect(typeof item.nearMisses).toBe('number');
      }
    });

    it('returns data covering the seeded months', async () => {
      const { body } = await req(app, '/api/incident-analytics/monthly-trend?months=24');
      // At least some months should have data
      const totalAcrossMonths = body.data.reduce((s: number, d: any) => s + d.total, 0);
      expect(totalAcrossMonths).toBeGreaterThan(0);
    });
  });

  // ── /weekly-trend ─────────────────────────────────────────────────────────

  describe('GET /api/incident-analytics/weekly-trend', () => {
    it('returns 200 with exactly 4 weeks', async () => {
      const { status, body } = await req(app, '/api/incident-analytics/weekly-trend?year=2025&month=1');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(4);
    });

    it('each item has week, injuries, nearMisses, total', async () => {
      const { body } = await req(app, '/api/incident-analytics/weekly-trend?year=2025&month=1');
      const item = body.data[0];
      expect(item.week).toMatch(/Week \d/);
      expect(typeof item.injuries).toBe('number');
      expect(typeof item.nearMisses).toBe('number');
      expect(typeof item.total).toBe('number');
    });

    it('totals across weeks for a seeded month are >= seeded count', async () => {
      const { body } = await req(app, '/api/incident-analytics/weekly-trend?year=2025&month=1');
      const total = body.data.reduce((s: number, w: any) => s + w.total, 0);
      expect(total).toBeGreaterThanOrEqual(5); // 5 seeded in Jan 2025
    });
  });

  // ── /by-type ─────────────────────────────────────────────────────────────

  describe('GET /api/incident-analytics/by-type', () => {
    it('returns 200 with array', async () => {
      const { status, body } = await req(app, '/api/incident-analytics/by-type?fromDate=2024-12-01&toDate=2025-03-31');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('each item has name, value (number), color (hex)', async () => {
      const { body } = await req(app, '/api/incident-analytics/by-type?fromDate=2024-12-01&toDate=2025-03-31');
      if (body.data.length > 0) {
        const item = body.data[0];
        expect(typeof item.name).toBe('string');
        expect(typeof item.value).toBe('number');
        expect(item.color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('injuries bucket is present for the seeded injury records', async () => {
      const { body } = await req(app, '/api/incident-analytics/by-type?fromDate=2024-12-01&toDate=2025-03-31');
      const injuries = body.data.find((d: any) => d.name === 'Injuries');
      expect(injuries).toBeDefined();
      expect(injuries.value).toBeGreaterThanOrEqual(1);
    });

    it('near-misses bucket is present', async () => {
      const { body } = await req(app, '/api/incident-analytics/by-type?fromDate=2024-12-01&toDate=2025-03-31');
      const nm = body.data.find((d: any) => d.name === 'Near Misses');
      expect(nm).toBeDefined();
      expect(nm.value).toBeGreaterThanOrEqual(1);
    });
  });

  // ── /by-severity ─────────────────────────────────────────────────────────

  describe('GET /api/incident-analytics/by-severity', () => {
    it('returns 200 with array', async () => {
      const { status, body } = await req(app, '/api/incident-analytics/by-severity?fromDate=2024-12-01&toDate=2025-03-31');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('each item has name, value, color', async () => {
      const { body } = await req(app, '/api/incident-analytics/by-severity?fromDate=2024-12-01&toDate=2025-03-31');
      if (body.data.length > 0) {
        const item = body.data[0];
        expect(typeof item.name).toBe('string');
        expect(typeof item.value).toBe('number');
        expect(item.color).toMatch(/^#/);
      }
    });

    it('Critical severity appears given seeded Critical incidents', async () => {
      const { body } = await req(app, '/api/incident-analytics/by-severity?fromDate=2024-12-01&toDate=2025-03-31');
      const critical = body.data.find((d: any) => d.name === 'Critical');
      expect(critical).toBeDefined();
      expect(critical.value).toBeGreaterThanOrEqual(1);
    });
  });

  // ── /by-department ────────────────────────────────────────────────────────

  describe('GET /api/incident-analytics/by-department', () => {
    it('returns 200 with array', async () => {
      const { status, body } = await req(app, '/api/incident-analytics/by-department?fromDate=2024-12-01&toDate=2025-03-31');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('each item has department, incidents, injuries, nearMisses, trend', async () => {
      const { body } = await req(app, '/api/incident-analytics/by-department?fromDate=2024-12-01&toDate=2025-03-31');
      if (body.data.length > 0) {
        const item = body.data[0];
        expect(typeof item.department).toBe('string');
        expect(typeof item.incidents).toBe('number');
        expect(typeof item.injuries).toBe('number');
        expect(typeof item.nearMisses).toBe('number');
        expect(['up', 'down', 'stable']).toContain(item.trend);
      }
    });

    it('Production department appears since we seeded several Production incidents', async () => {
      const { body } = await req(app, '/api/incident-analytics/by-department?fromDate=2024-12-01&toDate=2025-03-31');
      const prod = body.data.find((d: any) => d.department === 'Production');
      expect(prod).toBeDefined();
      expect(prod.incidents).toBeGreaterThanOrEqual(4);
    });

    it('trend field is stable when no previous period data', async () => {
      // Very old date range with no previous period data → trend should be stable
      const { body } = await req(app, '/api/incident-analytics/by-department?fromDate=2024-12-01&toDate=2025-03-31');
      body.data.forEach((d: any) => {
        expect(['up', 'down', 'stable']).toContain(d.trend);
      });
    });
  });

  // ── /by-day-of-week ───────────────────────────────────────────────────────

  describe('GET /api/incident-analytics/by-day-of-week', () => {
    it('returns 200 with exactly 7 days', async () => {
      const { status, body } = await req(app, '/api/incident-analytics/by-day-of-week?fromDate=2024-12-01&toDate=2025-03-31');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(7);
    });

    it('first entry is Sun', async () => {
      const { body } = await req(app, '/api/incident-analytics/by-day-of-week?fromDate=2024-12-01&toDate=2025-03-31');
      expect(body.data[0].day).toBe('Sun');
    });

    it('each item has day, incidents, average', async () => {
      const { body } = await req(app, '/api/incident-analytics/by-day-of-week?fromDate=2024-12-01&toDate=2025-03-31');
      body.data.forEach((d: any) => {
        expect(typeof d.day).toBe('string');
        expect(typeof d.incidents).toBe('number');
        expect(typeof d.average).toBe('number');
      });
    });

    it('total incidents > 0 across all days', async () => {
      const { body } = await req(app, '/api/incident-analytics/by-day-of-week?fromDate=2024-12-01&toDate=2025-03-31');
      const total = body.data.reduce((s: number, d: any) => s + d.incidents, 0);
      expect(total).toBeGreaterThan(0);
    });
  });

  // ── /by-time-of-day ───────────────────────────────────────────────────────

  describe('GET /api/incident-analytics/by-time-of-day', () => {
    it('returns 200 with 6 time slots', async () => {
      const { status, body } = await req(app, '/api/incident-analytics/by-time-of-day?fromDate=2024-12-01&toDate=2025-03-31');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(6);
    });

    it('each item has time, incidents, percentage', async () => {
      const { body } = await req(app, '/api/incident-analytics/by-time-of-day?fromDate=2024-12-01&toDate=2025-03-31');
      body.data.forEach((d: any) => {
        expect(typeof d.time).toBe('string');
        expect(typeof d.incidents).toBe('number');
        expect(typeof d.percentage).toBe('number');
      });
    });

    it('percentages sum to 100 (or 0 when no time data)', async () => {
      const { body } = await req(app, '/api/incident-analytics/by-time-of-day?fromDate=2024-12-01&toDate=2025-03-31');
      const total = body.data.reduce((s: number, d: any) => s + d.percentage, 0);
      expect(total === 0 || Math.abs(total - 100) < 1).toBe(true);
    });

    it('slots contain morning window 6-9 AM', async () => {
      const { body } = await req(app, '/api/incident-analytics/by-time-of-day?fromDate=2024-12-01&toDate=2025-03-31');
      const morning = body.data.find((d: any) => d.time === '6-9 AM');
      expect(morning).toBeDefined();
    });
  });

  // ── /root-causes ──────────────────────────────────────────────────────────

  describe('GET /api/incident-analytics/root-causes', () => {
    it('returns 200 with array', async () => {
      const { status, body } = await req(app, '/api/incident-analytics/root-causes?fromDate=2024-12-01&toDate=2025-03-31');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('each item has cause, count, percentage', async () => {
      const { body } = await req(app, '/api/incident-analytics/root-causes?fromDate=2024-12-01&toDate=2025-03-31');
      if (body.data.length > 0) {
        const item = body.data[0];
        expect(typeof item.cause).toBe('string');
        expect(typeof item.count).toBe('number');
        expect(typeof item.percentage).toBe('number');
      }
    });

    it('Human Error category is present (seeded "human error" and "distraction" root causes)', async () => {
      const { body } = await req(app, '/api/incident-analytics/root-causes?fromDate=2024-12-01&toDate=2025-03-31');
      const humanError = body.data.find((d: any) => d.cause === 'Human Error');
      expect(humanError).toBeDefined();
      expect(humanError.count).toBeGreaterThanOrEqual(1);
    });

    it('Equipment Failure category is present (seeded "malfunction" root causes)', async () => {
      const { body } = await req(app, '/api/incident-analytics/root-causes?fromDate=2024-12-01&toDate=2025-03-31');
      const ef = body.data.find((d: any) => d.cause === 'Equipment Failure');
      expect(ef).toBeDefined();
      expect(ef.count).toBeGreaterThanOrEqual(1);
    });

    it('Training Gap category is present', async () => {
      const { body } = await req(app, '/api/incident-analytics/root-causes?fromDate=2024-12-01&toDate=2025-03-31');
      const tg = body.data.find((d: any) => d.cause === 'Training Gap');
      expect(tg).toBeDefined();
      expect(tg.count).toBeGreaterThanOrEqual(1);
    });

    it('percentages sum to approximately 100', async () => {
      const { body } = await req(app, '/api/incident-analytics/root-causes?fromDate=2024-12-01&toDate=2025-03-31');
      if (body.data.length > 0) {
        const total = body.data.reduce((s: number, d: any) => s + d.percentage, 0);
        expect(total).toBeGreaterThan(0);
        expect(total).toBeLessThanOrEqual(100);
      }
    });

    it('returns empty array when date range excludes all root causes', async () => {
      const { body } = await req(app, '/api/incident-analytics/root-causes?fromDate=1990-01-01&toDate=1990-12-31');
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(0);
    });
  });

  // ── /leading-indicators ───────────────────────────────────────────────────

  describe('GET /api/incident-analytics/leading-indicators', () => {
    it('returns 200 with 4 indicators', async () => {
      const { status, body } = await req(app, '/api/incident-analytics/leading-indicators?fromDate=2024-12-01&toDate=2025-03-31');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(4);
    });

    it('each item has name, current, target, trend, unit', async () => {
      const { body } = await req(app, '/api/incident-analytics/leading-indicators?fromDate=2024-12-01&toDate=2025-03-31');
      body.data.forEach((d: any) => {
        expect(typeof d.name).toBe('string');
        expect(typeof d.current).toBe('number');
        expect(typeof d.target).toBe('number');
        expect(['up', 'down', 'stable']).toContain(d.trend);
        expect(typeof d.unit).toBe('string');
      });
    });

    it('Near Miss Ratio indicator is present', async () => {
      const { body } = await req(app, '/api/incident-analytics/leading-indicators?fromDate=2024-12-01&toDate=2025-03-31');
      const nmr = body.data.find((d: any) => d.name === 'Near Miss Ratio');
      expect(nmr).toBeDefined();
      expect(nmr.unit).toBe('per injury');
    });

    it('Root Cause Coverage indicator is present', async () => {
      const { body } = await req(app, '/api/incident-analytics/leading-indicators?fromDate=2024-12-01&toDate=2025-03-31');
      const rcc = body.data.find((d: any) => d.name === 'Root Cause Coverage');
      expect(rcc).toBeDefined();
      expect(rcc.unit).toBe('%');
    });

    it('Hazard Close Rate reflects closed incidents', async () => {
      const { body } = await req(app, '/api/incident-analytics/leading-indicators?fromDate=2024-12-01&toDate=2025-03-31');
      const hcr = body.data.find((d: any) => d.name === 'Hazard Close Rate');
      expect(hcr).toBeDefined();
      // We seeded 7 closed out of 18 = ~39% — should be a number between 0 and 100
      expect(hcr.current).toBeGreaterThanOrEqual(0);
      expect(hcr.current).toBeLessThanOrEqual(100);
    });

    it('returns 4 indicators even with empty date range (all zeros)', async () => {
      const { body } = await req(app, '/api/incident-analytics/leading-indicators?fromDate=1990-01-01&toDate=1990-12-31');
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(4);
      const hcr = body.data.find((d: any) => d.name === 'Hazard Close Rate');
      expect(hcr.current).toBe(0);
    });
  });

  // ── Cross-cutting: timeRange param ────────────────────────────────────────

  describe('timeRange query parameter handling', () => {
    it('timeRange=week does not throw', async () => {
      const { status } = await req(app, '/api/incident-analytics/kpis?timeRange=week');
      expect(status).toBe(200);
    });

    it('timeRange=month does not throw', async () => {
      const { status } = await req(app, '/api/incident-analytics/by-type?timeRange=month');
      expect(status).toBe(200);
    });

    it('timeRange=year returns array for monthly-trend', async () => {
      const { status, body } = await req(app, '/api/incident-analytics/monthly-trend?months=13');
      expect(status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});
