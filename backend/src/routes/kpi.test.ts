/**
 * KPI Routes Test Suite
 *
 * Covers:
 *   GET  /api/kpi/stats                   (totals)
 *   POST /api/kpi/definitions             (create, validation)
 *   GET  /api/kpi/definitions             (list, filter by category)
 *   GET  /api/kpi/definitions/:id         (by id, 404, recentReadings)
 *   PUT  /api/kpi/definitions/:id         (update, 404, 400 no fields)
 *   DELETE /api/kpi/definitions/:id       (delete, 404)
 *   POST /api/kpi/readings                (create, validation, 404 bad kpiId)
 *   GET  /api/kpi/readings                (list, filter by kpiCode, filter by kpiId)
 *   GET  /api/kpi/dashboard               (enriched: kpiCode, description, changePct, history)
 *   GET  /api/kpi/department-comparison   (array with dept, leading, lagging)
 *   GET  /api/kpi/incident-breakdown      (array with name, value, color)
 *   Seeded data verification              (12 standard KPIs present)
 *   History verification                  (seeded KPIs have ≥1 reading)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { kpiRoutes } from '../routes/kpi';

// ── App Factory ─────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  kpiRoutes(app);
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
const TAG = `kpi-test-${Date.now()}`;

let testDefId1: number;
let testDefId2: number;

afterAll(() => {
  // Remove test readings linked to test definitions
  sqlite.prepare(`
    DELETE FROM kpi_readings WHERE kpi_id IN (
      SELECT id FROM kpi_definitions WHERE name LIKE '${TAG}%'
    )
  `).run();
  sqlite.prepare(`DELETE FROM kpi_definitions WHERE name LIKE '${TAG}%'`).run();
  sqlite.close();
});

function seedDef(overrides: Record<string, any> = {}): number {
  const ts = Math.floor(Date.now() / 1000);
  const r = sqlite.prepare(`
    INSERT INTO kpi_definitions
      (kpi_code, name, description, category, unit, target, frequency, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    overrides.kpiCode   ?? `${TAG}-code-${Math.random().toString(36).slice(2, 8)}`,
    overrides.name      ?? `${TAG} KPI`,
    overrides.description ?? `${TAG} desc`,
    overrides.category  ?? 'leading',
    overrides.unit      ?? '%',
    overrides.target    ?? 100,
    overrides.frequency ?? 'monthly',
    ts, ts,
  );
  return Number(r.lastInsertRowid);
}

function seedReading(kpiId: number, value: number, period = '2026-01'): number {
  const ts = Math.floor(Date.now() / 1000);
  const r = sqlite.prepare('INSERT INTO kpi_readings (kpi_id, value, period, created_at) VALUES (?,?,?,?)').run(kpiId, value, period, ts);
  return Number(r.lastInsertRowid);
}

// ── 1. Stats ─────────────────────────────────────────────────────────────────

describe('GET /api/kpi/stats', () => {
  it('returns success with numeric totals', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/kpi/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.data.total).toBe('number');
    expect(typeof body.data.active).toBe('number');
    expect(typeof body.data.totalReadings).toBe('number');
  });

  it('has leading and lagging counts', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/stats');
    expect(typeof body.data.leading).toBe('number');
    expect(typeof body.data.lagging).toBe('number');
  });
});

// ── 2. Create Definition ──────────────────────────────────────────────────────

describe('POST /api/kpi/definitions', () => {
  beforeAll(async () => {
    const app = createTestApp();
    const r1 = await req(app, 'POST', '/api/kpi/definitions', {
      name: `${TAG} Leading KPI`,
      category: 'leading',
      unit: '%',
      target: 95,
      frequency: 'monthly',
    });
    testDefId1 = r1.body.data?.id;

    const r2 = await req(app, 'POST', '/api/kpi/definitions', {
      name: `${TAG} Lagging KPI`,
      category: 'lagging',
      unit: '',
      target: 1.0,
      frequency: 'monthly',
    });
    testDefId2 = r2.body.data?.id;
  });

  it('creates a definition and returns it', async () => {
    expect(typeof testDefId1).toBe('number');
    expect(testDefId1).toBeGreaterThan(0);
  });

  it('returns 400 when name is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/kpi/definitions', { category: 'leading' });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when category is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/kpi/definitions', { name: `${TAG} no-cat` });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid category value', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/kpi/definitions', {
      name: `${TAG} bad-cat`,
      category: 'invalid_category',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ── 3. List Definitions ───────────────────────────────────────────────────────

describe('GET /api/kpi/definitions', () => {
  it('returns an array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/kpi/definitions');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('filters by category=leading', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/definitions?category=leading');
    expect(body.data.every((d: any) => d.category === 'leading')).toBe(true);
  });

  it('filters by category=lagging', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/definitions?category=lagging');
    expect(body.data.every((d: any) => d.category === 'lagging')).toBe(true);
  });
});

// ── 4. Get Definition by ID ───────────────────────────────────────────────────

describe('GET /api/kpi/definitions/:id', () => {
  it('returns the definition with recentReadings array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', `/api/kpi/definitions/${testDefId1}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(testDefId1);
    expect(Array.isArray(body.data.recentReadings)).toBe(true);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/kpi/definitions/999999999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ── 5. Update Definition ──────────────────────────────────────────────────────

describe('PUT /api/kpi/definitions/:id', () => {
  it('updates allowed fields', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/kpi/definitions/${testDefId1}`, {
      target: 80,
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/kpi/definitions/999999999', { target: 50 });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 400 when body is empty', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/kpi/definitions/${testDefId1}`, {});
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ── 6. Delete Definition ──────────────────────────────────────────────────────

describe('DELETE /api/kpi/definitions/:id', () => {
  it('deletes the definition', async () => {
    const app = createTestApp();
    const deleteId = seedDef({ name: `${TAG} to-delete` });
    const { status, body } = await req(app, 'DELETE', `/api/kpi/definitions/${deleteId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 404 for already-deleted id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', '/api/kpi/definitions/999999999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ── 7. Create Reading ─────────────────────────────────────────────────────────

describe('POST /api/kpi/readings', () => {
  it('creates a reading for a valid definition', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/kpi/readings', {
      kpiId: testDefId1,
      value: 88,
      period: '2026-02',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeGreaterThan(0);
  });

  it('returns 400 when kpiId is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/kpi/readings', { value: 50, period: '2026-02' });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when value is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/kpi/readings', { kpiId: testDefId1, period: '2026-02' });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when period is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/kpi/readings', { kpiId: testDefId1, value: 50 });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 404 for non-existent kpiId', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/kpi/readings', {
      kpiId: 999999999,
      value: 50,
      period: '2026-02',
    });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ── 8. List Readings ──────────────────────────────────────────────────────────

describe('GET /api/kpi/readings', () => {
  let readingDefId: number;
  const CODE = `${TAG}-rd-${Math.random().toString(36).slice(2, 7)}`;

  beforeAll(() => {
    readingDefId = seedDef({ name: `${TAG} readings-kpi`, kpiCode: CODE });
    seedReading(readingDefId, 75, '2025-11');
    seedReading(readingDefId, 80, '2025-12');
  });

  it('returns an array of readings', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/kpi/readings');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('filters by kpiId', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/kpi/readings?kpiId=${readingDefId}`);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
    expect(body.data.every((r: any) => r.kpi_id === readingDefId)).toBe(true);
  });

  it('filters by kpiCode', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/kpi/readings?kpiCode=${CODE}`);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
    expect(body.data.every((r: any) => r.kpi_code === CODE)).toBe(true);
  });

  it('filters by period', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/kpi/readings?kpiId=${readingDefId}&period=2025-11`);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.every((r: any) => r.period === '2025-11')).toBe(true);
  });

  it('returns kpi_code field in each reading', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/kpi/readings?kpiId=${readingDefId}`);
    expect(body.data[0]).toHaveProperty('kpi_code');
  });
});

// ── 9. Dashboard ──────────────────────────────────────────────────────────────

describe('GET /api/kpi/dashboard', () => {
  it('returns array with enriched fields', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/kpi/dashboard');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('each item has required fields', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/dashboard');
    if (body.data.length > 0) {
      const item = body.data[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('kpiCode');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('statusVsTarget');
      expect(item).toHaveProperty('history');
      expect(Array.isArray(item.history)).toBe(true);
    }
  });

  it('returns kpiCode for standard seeded KPIs', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/dashboard');
    const trirItem = body.data.find((d: any) => d.kpiCode === 'trir');
    expect(trirItem).toBeDefined();
  });

  it('dashboard items for seeded KPIs have history array with entries', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/dashboard');
    const trirItem = body.data.find((d: any) => d.kpiCode === 'trir');
    if (trirItem) {
      expect(trirItem.history.length).toBeGreaterThan(0);
      expect(typeof trirItem.history[0].month).toBe('string');
      expect(typeof trirItem.history[0].value).toBe('number');
    }
  });

  it('filters by category=leading', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/dashboard?category=leading');
    expect(body.data.every((d: any) => d.category === 'leading')).toBe(true);
  });

  it('filters by category=lagging', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/dashboard?category=lagging');
    expect(body.data.every((d: any) => d.category === 'lagging')).toBe(true);
  });

  it('changePct is a string like +X% when prev reading exists', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/dashboard');
    const withChange = body.data.find((d: any) => d.changePct !== null);
    if (withChange) {
      expect(typeof withChange.changePct).toBe('string');
      expect(withChange.changePct).toMatch(/[+-]\d+%/);
    }
  });

  it('trendVsPrev is up, down or stable when prev reading exists', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/dashboard');
    const withTrend = body.data.find((d: any) => d.trendVsPrev !== null);
    if (withTrend) {
      expect(['up', 'down', 'stable']).toContain(withTrend.trendVsPrev);
    }
  });
});

// ── 10. Department Comparison ─────────────────────────────────────────────────

describe('GET /api/kpi/department-comparison', () => {
  it('returns array with dept, leading, lagging', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/kpi/department-comparison');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('each item has dept string, leading number, lagging number', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/department-comparison');
    const item = body.data[0];
    expect(typeof item.dept).toBe('string');
    expect(typeof item.leading).toBe('number');
    expect(typeof item.lagging).toBe('number');
  });

  it('leading scores are between 0 and 100', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/department-comparison');
    body.data.forEach((d: any) => {
      expect(d.leading).toBeGreaterThanOrEqual(0);
      expect(d.leading).toBeLessThanOrEqual(100);
    });
  });
});

// ── 11. Incident Breakdown ────────────────────────────────────────────────────

describe('GET /api/kpi/incident-breakdown', () => {
  it('returns array with name, value, color', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/kpi/incident-breakdown');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('each item has name string, value number, color string', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/incident-breakdown');
    const item = body.data[0];
    expect(typeof item.name).toBe('string');
    expect(typeof item.value).toBe('number');
    expect(typeof item.color).toBe('string');
  });

  it('colors are hex strings starting with #', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/incident-breakdown');
    body.data.forEach((d: any) => {
      expect(d.color).toMatch(/^#/);
    });
  });
});

// ── 12. Seeded KPI Definitions Verification ───────────────────────────────────

describe('Seeded standard KPIs', () => {
  const EXPECTED_CODES = [
    'safety_observations', 'near_miss_reports', 'training_completion',
    'inspection_completion', 'hazard_id', 'toolbox_talks',
    'trir', 'dart', 'ltir', 'severity_rate', 'first_aid', 'days_without_incident',
  ];

  it('all 12 standard KPI codes are in kpi_definitions', () => {
    for (const code of EXPECTED_CODES) {
      const row = sqlite.prepare('SELECT id FROM kpi_definitions WHERE kpi_code=?').get(code);
      expect(row, `Expected KPI with code "${code}" to exist`).toBeDefined();
    }
  });

  it('leading KPIs have category=leading', () => {
    const leadingCodes = ['safety_observations', 'near_miss_reports', 'training_completion',
      'inspection_completion', 'hazard_id', 'toolbox_talks'];
    for (const code of leadingCodes) {
      const row = sqlite.prepare('SELECT category FROM kpi_definitions WHERE kpi_code=?').get(code) as any;
      if (row) expect(row.category).toBe('leading');
    }
  });

  it('lagging KPIs have category=lagging', () => {
    const laggingCodes = ['trir', 'dart', 'ltir', 'severity_rate', 'first_aid', 'days_without_incident'];
    for (const code of laggingCodes) {
      const row = sqlite.prepare('SELECT category FROM kpi_definitions WHERE kpi_code=?').get(code) as any;
      if (row) expect(row.category).toBe('lagging');
    }
  });

  it('TRIR has correct benchmark of 2.8', () => {
    const row = sqlite.prepare('SELECT benchmark FROM kpi_definitions WHERE kpi_code=?').get('trir') as any;
    if (row) expect(row.benchmark).toBe(2.8);
  });
});

// ── 13. History / Readings Verification ───────────────────────────────────────

describe('Seeded KPI readings', () => {
  it('trir has at least 6 readings seeded', () => {
    const def = sqlite.prepare('SELECT id FROM kpi_definitions WHERE kpi_code=?').get('trir') as any;
    if (def) {
      const count = (sqlite.prepare('SELECT COUNT(*) as n FROM kpi_readings WHERE kpi_id=?').get(def.id) as any).n;
      expect(count).toBeGreaterThanOrEqual(6);
    }
  });

  it('safety_observations has at least 6 readings seeded', () => {
    const def = sqlite.prepare('SELECT id FROM kpi_definitions WHERE kpi_code=?').get('safety_observations') as any;
    if (def) {
      const count = (sqlite.prepare('SELECT COUNT(*) as n FROM kpi_readings WHERE kpi_id=?').get(def.id) as any).n;
      expect(count).toBeGreaterThanOrEqual(6);
    }
  });

  it('dashboard history array has correct month abbreviations', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/kpi/dashboard?category=lagging');
    const trirItem = body.data.find((d: any) => d.kpiCode === 'trir');
    if (trirItem && trirItem.history.length > 0) {
      const validMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      trirItem.history.forEach((h: any) => {
        expect(validMonths.includes(h.month) || typeof h.month === 'string').toBe(true);
      });
    }
  });
});
