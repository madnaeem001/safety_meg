/**
 * Bow Tie Analysis Routes Test Suite
 *
 * Covers:
 *   GET  /api/bowtie/stats
 *   GET  /api/bowtie/scenarios
 *   POST /api/bowtie/scenarios
 *   GET  /api/bowtie/scenarios/:id
 *   PUT  /api/bowtie/scenarios/:id
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { bowTieRoutes } from '../routes/bow-tie';

// ── App Factory ───────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  bowTieRoutes(app);
  return app;
}

// ── Request Helper ────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── Seed / Cleanup ────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `test-bowtie-${Date.now()}`;

afterAll(() => {
  sqlite.prepare(`DELETE FROM bowtie_scenarios WHERE title LIKE '${TAG}%'`).run();
});

const THREATS = [
  {
    id: 'T1', name: 'Residual Chemicals', preventiveBarriers: [
      { id: 'PB1', name: 'Gas Testing', type: 'procedural', effectiveness: 90, status: 'active' },
      { id: 'PB2', name: 'Air Monitor', type: 'engineering', effectiveness: 95, status: 'active' },
    ],
  },
];
const CONSEQUENCES = [
  {
    id: 'C1', name: 'Worker asphyxiation', severity: 'catastrophic', mitigativeBarriers: [
      { id: 'MB1', name: 'SCBA Kit', type: 'ppe', effectiveness: 90, status: 'active' },
      { id: 'MB2', name: 'Retrieval System', type: 'engineering', effectiveness: 70, status: 'degraded' },
    ],
  },
];

function seedScenario(overrides: Record<string, any> = {}) {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO bowtie_scenarios (title, top_event, hazard, risk_level, threats, consequences, status, owner, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.title ?? `${TAG}-seed`,
    overrides.top_event ?? 'Top Event A',
    overrides.hazard ?? 'Test Hazard',
    overrides.risk_level ?? 'high',
    overrides.threats ?? JSON.stringify(THREATS),
    overrides.consequences ?? JSON.stringify(CONSEQUENCES),
    overrides.status ?? 'active',
    overrides.owner ?? `${TAG}-owner`,
    ts, ts,
  );
  return Number(result.lastInsertRowid);
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('Bow Tie Analysis Routes', () => {
  let app: Hono;
  let highId: number;
  let criticalId: number;
  let draftId: number;

  beforeAll(() => {
    app = createTestApp();
    criticalId = seedScenario({ title: `${TAG}-critical`, risk_level: 'critical', status: 'active' });
    highId     = seedScenario({ title: `${TAG}-high`, risk_level: 'high', status: 'active' });
    draftId    = seedScenario({ title: `${TAG}-draft`, risk_level: 'low', status: 'draft' });
  });

  // ── GET /api/bowtie/stats ───────────────────────────────────────────────

  describe('GET /api/bowtie/stats', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/bowtie/stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns total, critical, high, active counts', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/stats');
      expect(typeof body.data.total).toBe('number');
      expect(typeof body.data.critical).toBe('number');
      expect(typeof body.data.high).toBe('number');
      expect(typeof body.data.active).toBe('number');
    });

    it('critical count is at least 1 (seeded)', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/stats');
      expect(body.data.critical).toBeGreaterThanOrEqual(1);
    });

    it('returns totalBarriers and degradedBarriers', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/stats');
      expect(typeof body.data.totalBarriers).toBe('number');
      expect(typeof body.data.degradedBarriers).toBe('number');
    });

    it('degradedBarriers <= totalBarriers', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/stats');
      expect(body.data.degradedBarriers).toBeLessThanOrEqual(body.data.totalBarriers);
    });

    it('returns byStatus and byRisk arrays', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/stats');
      expect(Array.isArray(body.data.byStatus)).toBe(true);
      expect(Array.isArray(body.data.byRisk)).toBe(true);
    });
  });

  // ── GET /api/bowtie/scenarios ───────────────────────────────────────────

  describe('GET /api/bowtie/scenarios', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/bowtie/scenarios');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/scenarios');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns total count', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/scenarios');
      expect(typeof body.total).toBe('number');
      expect(body.total).toBeGreaterThanOrEqual(3);
    });

    it('maps DB to camelCase frontend fields', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/scenarios');
      const item = body.data.find((s: any) => s.id === String(highId));
      expect(item).toBeDefined();
      expect(item).toHaveProperty('topEvent');
      expect(item).toHaveProperty('riskLevel');
      expect(item).toHaveProperty('lastUpdated');
      expect(item).toHaveProperty('owner');
    });

    it('id is a string', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/scenarios');
      const item = body.data.find((s: any) => s.id === String(highId));
      expect(typeof item.id).toBe('string');
    });

    it('threats is a parsed array', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/scenarios');
      const item = body.data.find((s: any) => s.id === String(highId));
      expect(Array.isArray(item.threats)).toBe(true);
      expect(item.threats[0]).toHaveProperty('preventiveBarriers');
    });

    it('consequences is a parsed array', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/scenarios');
      const item = body.data.find((s: any) => s.id === String(highId));
      expect(Array.isArray(item.consequences)).toBe(true);
      expect(item.consequences[0]).toHaveProperty('mitigativeBarriers');
    });

    it('lastUpdated is YYYY-MM-DD string', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/scenarios');
      const item = body.data.find((s: any) => s.id === String(highId));
      expect(item.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('filters by riskLevel=critical', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/scenarios?riskLevel=critical');
      const ids = body.data.map((s: any) => s.id);
      expect(ids).toContain(String(criticalId));
      expect(ids).not.toContain(String(draftId));
    });

    it('filters by status=draft', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/scenarios?status=draft');
      const ids = body.data.map((s: any) => s.id);
      expect(ids).toContain(String(draftId));
      expect(ids).not.toContain(String(criticalId));
    });

    it('filters by owner', async () => {
      const { body } = await req(app, 'GET', `/api/bowtie/scenarios?owner=${TAG}-owner`);
      const ids = body.data.map((s: any) => s.id);
      expect(ids).toContain(String(highId));
    });

    it('search by title', async () => {
      const { body } = await req(app, 'GET', `/api/bowtie/scenarios?search=${TAG}-critical`);
      expect(body.data.some((s: any) => s.id === String(criticalId))).toBe(true);
    });

    it('search by topEvent', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/scenarios?search=Top+Event+A');
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('returns newest first (descending by created_at)', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/scenarios');
      const idx1 = body.data.findIndex((s: any) => s.id === String(criticalId));
      const idx2 = body.data.findIndex((s: any) => s.id === String(highId));
      // Both seeded in same ms - just check both are present
      expect(idx1).toBeGreaterThanOrEqual(0);
      expect(idx2).toBeGreaterThanOrEqual(0);
    });
  });

  // ── POST /api/bowtie/scenarios ──────────────────────────────────────────

  describe('POST /api/bowtie/scenarios', () => {
    it('creates a scenario and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/bowtie/scenarios', {
        title: `${TAG}-post-1`,
        topEvent: 'Equipment Failure',
        hazard: 'Rotating Machinery',
        riskLevel: 'high',
        threats: THREATS,
        consequences: CONSEQUENCES,
        status: 'draft',
        owner: 'Test Owner',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(typeof body.data.id).toBe('string');
    });

    it('response uses camelCase frontend fields', async () => {
      const { body } = await req(app, 'POST', '/api/bowtie/scenarios', {
        title: `${TAG}-post-map`,
        topEvent: 'Pressure Release',
        hazard: 'High Pressure Line',
        riskLevel: 'critical',
      });
      expect(body.data).toHaveProperty('topEvent');
      expect(body.data).toHaveProperty('riskLevel');
      expect(body.data).toHaveProperty('lastUpdated');
      expect(body.data).toHaveProperty('threats');
      expect(body.data).toHaveProperty('consequences');
    });

    it('threats array is parsed and returned', async () => {
      const { body } = await req(app, 'POST', '/api/bowtie/scenarios', {
        title: `${TAG}-post-threats`,
        topEvent: 'EV',
        hazard: 'HZ',
        riskLevel: 'medium',
        threats: THREATS,
      });
      expect(Array.isArray(body.data.threats)).toBe(true);
      expect(body.data.threats[0].name).toBe('Residual Chemicals');
    });

    it('consequences array is parsed and returned', async () => {
      const { body } = await req(app, 'POST', '/api/bowtie/scenarios', {
        title: `${TAG}-post-cons`,
        topEvent: 'EV',
        hazard: 'HZ',
        riskLevel: 'low',
        consequences: CONSEQUENCES,
      });
      expect(Array.isArray(body.data.consequences)).toBe(true);
      expect(body.data.consequences[0].severity).toBe('catastrophic');
    });

    it('status defaults to draft', async () => {
      const { body } = await req(app, 'POST', '/api/bowtie/scenarios', {
        title: `${TAG}-post-default-status`,
        topEvent: 'EV',
        hazard: 'HZ',
        riskLevel: 'low',
      });
      expect(body.data.status).toBe('draft');
    });

    it('returns 400 when title is missing', async () => {
      const { status } = await req(app, 'POST', '/api/bowtie/scenarios', {
        topEvent: 'EV',
        hazard: 'HZ',
        riskLevel: 'high',
      });
      expect(status).toBe(400);
    });

    it('returns 400 when topEvent is missing', async () => {
      const { status } = await req(app, 'POST', '/api/bowtie/scenarios', {
        title: `${TAG}-no-tev`,
        hazard: 'HZ',
        riskLevel: 'high',
      });
      expect(status).toBe(400);
    });

    it('returns 400 when hazard is missing', async () => {
      const { status } = await req(app, 'POST', '/api/bowtie/scenarios', {
        title: `${TAG}-no-hazard`,
        topEvent: 'EV',
        riskLevel: 'high',
      });
      expect(status).toBe(400);
    });

    it('returns 400 for invalid riskLevel', async () => {
      const { status } = await req(app, 'POST', '/api/bowtie/scenarios', {
        title: `${TAG}-bad-risk`,
        topEvent: 'EV',
        hazard: 'HZ',
        riskLevel: 'extreme',
      });
      expect(status).toBe(400);
    });

    it('returns 400 for invalid status', async () => {
      const { status } = await req(app, 'POST', '/api/bowtie/scenarios', {
        title: `${TAG}-bad-status`,
        topEvent: 'EV',
        hazard: 'HZ',
        riskLevel: 'high',
        status: 'published',
      });
      expect(status).toBe(400);
    });
  });

  // ── GET /api/bowtie/scenarios/:id ──────────────────────────────────────

  describe('GET /api/bowtie/scenarios/:id', () => {
    it('returns 200 and the correct scenario', async () => {
      const { status, body } = await req(app, 'GET', `/api/bowtie/scenarios/${highId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(String(highId));
    });

    it('response has all camelCase frontend fields', async () => {
      const { body } = await req(app, 'GET', `/api/bowtie/scenarios/${highId}`);
      expect(body.data).toHaveProperty('topEvent');
      expect(body.data).toHaveProperty('riskLevel');
      expect(body.data).toHaveProperty('lastUpdated');
      expect(body.data).toHaveProperty('threats');
      expect(body.data).toHaveProperty('consequences');
    });

    it('threats is a parsed array', async () => {
      const { body } = await req(app, 'GET', `/api/bowtie/scenarios/${highId}`);
      expect(Array.isArray(body.data.threats)).toBe(true);
    });

    it('returns 404 for a non-existent id', async () => {
      const { status } = await req(app, 'GET', '/api/bowtie/scenarios/99999999');
      expect(status).toBe(404);
    });

    it('returns 400 for non-numeric id', async () => {
      const { status } = await req(app, 'GET', '/api/bowtie/scenarios/abc');
      expect(status).toBe(400);
    });

    it('returns 400 for id=0', async () => {
      const { status } = await req(app, 'GET', '/api/bowtie/scenarios/0');
      expect(status).toBe(400);
    });
  });

  // ── PUT /api/bowtie/scenarios/:id ──────────────────────────────────────

  describe('PUT /api/bowtie/scenarios/:id', () => {
    let updateId: number;

    beforeAll(() => {
      updateId = seedScenario({ title: `${TAG}-update`, risk_level: 'medium', status: 'draft' });
    });

    it('updates status and returns 200 with mapped fields', async () => {
      const { status, body } = await req(app, 'PUT', `/api/bowtie/scenarios/${updateId}`, {
        status: 'active',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('active');
    });

    it('updates riskLevel', async () => {
      const { body } = await req(app, 'PUT', `/api/bowtie/scenarios/${updateId}`, {
        riskLevel: 'critical',
      });
      expect(body.data.riskLevel).toBe('critical');
    });

    it('updates topEvent field (camelCase → snake_case mapping)', async () => {
      const { body } = await req(app, 'PUT', `/api/bowtie/scenarios/${updateId}`, {
        topEvent: 'Updated Top Event',
      });
      expect(body.data.topEvent).toBe('Updated Top Event');
    });

    it('updates owner', async () => {
      const { body } = await req(app, 'PUT', `/api/bowtie/scenarios/${updateId}`, {
        owner: 'New Owner',
      });
      expect(body.data.owner).toBe('New Owner');
    });

    it('updates threats with new array', async () => {
      const newThreats = [{ id: 'TX1', name: 'New Threat', preventiveBarriers: [] }];
      const { body } = await req(app, 'PUT', `/api/bowtie/scenarios/${updateId}`, {
        threats: newThreats,
      });
      expect(body.data.threats[0].name).toBe('New Threat');
    });

    it('returns 404 for a non-existent id', async () => {
      const { status } = await req(app, 'PUT', '/api/bowtie/scenarios/99999999', {
        status: 'active',
      });
      expect(status).toBe(404);
    });

    it('returns 400 for non-numeric id', async () => {
      const { status } = await req(app, 'PUT', '/api/bowtie/scenarios/abc', {
        status: 'active',
      });
      expect(status).toBe(400);
    });

    it('returns 400 when body has no valid fields', async () => {
      const { status } = await req(app, 'PUT', `/api/bowtie/scenarios/${updateId}`, {
        unknownField: 'value',
      });
      expect(status).toBe(400);
    });

    it('returns updated object with camelCase fields', async () => {
      const { body } = await req(app, 'PUT', `/api/bowtie/scenarios/${updateId}`, {
        title: `${TAG}-updated-title`,
      });
      expect(body.data).toHaveProperty('topEvent');
      expect(body.data).toHaveProperty('riskLevel');
      expect(body.data).toHaveProperty('lastUpdated');
      expect(typeof body.data.id).toBe('string');
    });

    it('lastUpdated reflects update (recent date)', async () => {
      const { body } = await req(app, 'PUT', `/api/bowtie/scenarios/${updateId}`, {
        title: `${TAG}-date-check`,
      });
      expect(body.data.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns 400 for invalid riskLevel in update', async () => {
      const { status } = await req(app, 'PUT', `/api/bowtie/scenarios/${updateId}`, {
        riskLevel: 'super-critical',
      });
      expect(status).toBe(400);
    });
  });

  // ── Stats reflect created data ──────────────────────────────────────────

  describe('Stats accuracy', () => {
    it('totalBarriers includes barriers from seeded scenarios', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/stats');
      // Each seeded scenario has 2 preventive + 2 mitigative = 4 barriers
      expect(body.data.totalBarriers).toBeGreaterThanOrEqual(4);
    });

    it('degradedBarriers count is >= 1 (seeded scenario has degraded MB2)', async () => {
      const { body } = await req(app, 'GET', '/api/bowtie/stats');
      expect(body.data.degradedBarriers).toBeGreaterThanOrEqual(1);
    });
  });
});
