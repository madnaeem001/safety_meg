/**
 * Behavior-Based Safety (BBS) & SIF Precursors API Route Tests
 * Covers:
 *   - GET  /api/bbs/stats
 *   - GET  /api/bbs/observations          (filters, camelCase mapping)
 *   - POST /api/bbs/observations          (frontend + backend field names)
 *   - GET  /api/bbs/observations/:id
 *   - PUT  /api/bbs/observations/:id
 *   - GET  /api/sif/stats
 *   - GET  /api/sif/precursors
 *   - POST /api/sif/precursors
 *   - GET  /api/sif/precursors/:id
 *   - PUT  /api/sif/precursors/:id
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { behaviorSafetyRoutes } from '../routes/behavior-safety';

// ── App Factory ───────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  behaviorSafetyRoutes(app);
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
  const json = await res.json();
  return { status: res.status, body: json as any };
}

// ── Seed / Cleanup ────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `test-bbs-${Date.now()}`;

afterAll(() => {
  sqlite.prepare(`DELETE FROM safety_observations WHERE observer_name LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM sif_precursors WHERE title LIKE '${TAG}%'`).run();
});

function seedObs(overrides: Record<string, any> = {}) {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO safety_observations
      (observer_name, observed_area, department, observation_date, behavior_type, category, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.observer_name ?? `${TAG}-observer`,
    overrides.observed_area ?? 'Building A',
    overrides.department ?? 'Engineering',
    overrides.observation_date ?? '2026-03-01',
    overrides.behavior_type ?? 'safe',
    overrides.category ?? 'ppe',
    overrides.description ?? 'Test behavior description',
    overrides.status ?? 'open',
    ts, ts,
  );
  return Number(result.lastInsertRowid);
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('Behavior-Based Safety Routes', () => {
  let app: Hono;
  let safeObsId: number;
  let atRiskObsId: number;
  let closedObsId: number;
  let inReviewObsId: number;

  beforeAll(() => {
    app = createTestApp();
    safeObsId    = seedObs({ behavior_type: 'safe',    status: 'open',      observer_name: `${TAG}-safe` });
    atRiskObsId  = seedObs({ behavior_type: 'at-risk', status: 'open',      observer_name: `${TAG}-atrisk` });
    closedObsId  = seedObs({ behavior_type: 'safe',    status: 'closed',    observer_name: `${TAG}-closed` });
    inReviewObsId = seedObs({ behavior_type: 'at-risk', status: 'in-review', observer_name: `${TAG}-inreview` });
  });

  // ── GET /api/bbs/stats ──────────────────────────────────────────────────

  describe('GET /api/bbs/stats', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/bbs/stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns total, safe, atRisk, safeRate fields', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/stats');
      expect(typeof body.data.total).toBe('number');
      expect(typeof body.data.safe).toBe('number');
      expect(typeof body.data.atRisk).toBe('number');
      expect(typeof body.data.safeRate).toBe('number');
    });

    it('safeRate is between 0 and 100', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/stats');
      expect(body.data.safeRate).toBeGreaterThanOrEqual(0);
      expect(body.data.safeRate).toBeLessThanOrEqual(100);
    });

    it('returns byCategory and byDept arrays', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/stats');
      expect(Array.isArray(body.data.byCategory)).toBe(true);
      expect(Array.isArray(body.data.byDept)).toBe(true);
    });
  });

  // ── GET /api/bbs/observations ───────────────────────────────────────────

  describe('GET /api/bbs/observations', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/bbs/observations');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/observations');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('maps snake_case DB fields to camelCase frontend fields', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/observations');
      const obs = body.data.find((o: any) => o.id === safeObsId);
      expect(obs).toBeDefined();
      expect(obs).toHaveProperty('observerName');
      expect(obs).toHaveProperty('workArea');
      expect(obs).toHaveProperty('observationDate');
      expect(obs).toHaveProperty('observationType');
      expect(obs).toHaveProperty('behaviorObserved');
      expect(obs).toHaveProperty('observationCode');
    });

    it('observationCode is OBS-{id}', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/observations');
      const obs = body.data.find((o: any) => o.id === safeObsId);
      expect(obs.observationCode).toBe(`OBS-${safeObsId}`);
    });

    it('safe behavior_type maps to observationType="safe"', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/observations');
      const obs = body.data.find((o: any) => o.id === safeObsId);
      expect(obs.observationType).toBe('safe');
    });

    it('at-risk behavior_type maps to observationType="at-risk"', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/observations');
      const obs = body.data.find((o: any) => o.id === atRiskObsId);
      expect(obs.observationType).toBe('at-risk');
    });

    it('closed DB status maps to "resolved" in output', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/observations');
      const obs = body.data.find((o: any) => o.id === closedObsId);
      expect(obs.status).toBe('resolved');
    });

    it('in-review DB status maps to "coached" in output', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/observations');
      const obs = body.data.find((o: any) => o.id === inReviewObsId);
      expect(obs.status).toBe('coached');
    });

    it('open DB status stays "open" in output', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/observations');
      const obs = body.data.find((o: any) => o.id === safeObsId);
      expect(obs.status).toBe('open');
    });

    it('filters by ?type=safe (frontend param name)', async () => {
      const { status, body } = await req(app, 'GET', '/api/bbs/observations?type=safe');
      expect(status).toBe(200);
      const ids = body.data.map((o: any) => o.id);
      expect(ids).toContain(safeObsId);
      expect(ids).not.toContain(atRiskObsId);
    });

    it('filters by ?type=at-risk', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/observations?type=at-risk');
      const ids = body.data.map((o: any) => o.id);
      expect(ids).toContain(atRiskObsId);
      expect(ids).not.toContain(safeObsId);
    });

    it('filters by ?type=at_risk (underscore — frontend filter value)', async () => {
      const { status, body } = await req(app, 'GET', '/api/bbs/observations?type=at_risk');
      expect(status).toBe(200);
      const ids = body.data.map((o: any) => o.id);
      expect(ids).toContain(atRiskObsId);
      expect(ids).not.toContain(safeObsId);
    });

    it('filters by ?behaviorType=safe (legacy param)', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/observations?behaviorType=safe');
      const ids = body.data.map((o: any) => o.id);
      expect(ids).toContain(safeObsId);
    });

    it('filters by department', async () => {
      const deptId = seedObs({ observer_name: `${TAG}-dept`, department: `${TAG}-dept-test` });
      const { body } = await req(app, 'GET', `/api/bbs/observations?department=${TAG}-dept-test`);
      const ids = body.data.map((o: any) => o.id);
      expect(ids).toContain(deptId);
    });

    it('followUpRequired is boolean false when 0 in DB', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/observations');
      const obs = body.data.find((o: any) => o.id === safeObsId);
      expect(obs.followUpRequired).toBe(false);
    });

    it('returns total count', async () => {
      const { body } = await req(app, 'GET', '/api/bbs/observations');
      expect(typeof body.total).toBe('number');
      expect(body.total).toBeGreaterThanOrEqual(2);
    });
  });

  // ── POST /api/bbs/observations ──────────────────────────────────────────

  describe('POST /api/bbs/observations', () => {
    it('creates with frontend field names and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/bbs/observations', {
        observerName: `${TAG}-post-frontend`,
        workArea: 'Lab B',
        department: 'QA',
        observationDate: '2026-03-05',
        observationType: 'safe',
        category: 'ppe',
        behaviorObserved: 'Wore full PPE during chemical handling',
        feedback: 'Great work',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(typeof body.data.id).toBe('number');
    });

    it('returned object uses camelCase frontend field names', async () => {
      const { body } = await req(app, 'POST', '/api/bbs/observations', {
        observerName: `${TAG}-post-map`,
        workArea: 'Zone C',
        department: 'Ops',
        observationDate: '2026-03-05',
        observationType: 'at-risk',
        behaviorObserved: 'Not wearing gloves',
      });
      expect(body.data).toHaveProperty('observerName');
      expect(body.data).toHaveProperty('workArea');
      expect(body.data).toHaveProperty('observationDate');
      expect(body.data).toHaveProperty('observationType');
      expect(body.data).toHaveProperty('behaviorObserved');
      expect(body.data).toHaveProperty('observationCode');
    });

    it('creates with backend field names (legacy)', async () => {
      const { status, body } = await req(app, 'POST', '/api/bbs/observations', {
        observerName: `${TAG}-post-backend`,
        observedArea: 'Zone D',
        department: 'Maint',
        observationDate: '2026-03-05',
        behaviorType: 'safe',
        description: 'Used harness correctly',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('observationType=at_risk (underscore) normalizes to at-risk', async () => {
      const { body } = await req(app, 'POST', '/api/bbs/observations', {
        observerName: `${TAG}-post-atrisk`,
        workArea: 'Dock',
        observationDate: '2026-03-05',
        observationType: 'at_risk',
        behaviorObserved: 'No hardhat on loading dock',
      });
      expect(body.data.observationType).toBe('at-risk');
    });

    it('status=resolved stored as closed and returned as resolved', async () => {
      const { body } = await req(app, 'POST', '/api/bbs/observations', {
        observerName: `${TAG}-post-resolved`,
        workArea: 'Office',
        observationDate: '2026-03-05',
        observationType: 'safe',
        behaviorObserved: 'Properly closed incident',
        status: 'resolved',
      });
      expect(body.data.status).toBe('resolved');
    });

    it('status=coached stored as in-review and returned as coached', async () => {
      const { body } = await req(app, 'POST', '/api/bbs/observations', {
        observerName: `${TAG}-post-coached`,
        workArea: 'Plant',
        observationDate: '2026-03-05',
        observationType: 'at-risk',
        behaviorObserved: 'Coaching session conducted',
        status: 'coached',
      });
      expect(body.data.status).toBe('coached');
    });

    it('returns 400 when observerName is missing', async () => {
      const { status } = await req(app, 'POST', '/api/bbs/observations', {
        workArea: 'Lab',
        observationDate: '2026-03-05',
        observationType: 'safe',
        behaviorObserved: 'Test',
      });
      expect(status).toBe(400);
    });

    it('returns 400 when observationDate is missing', async () => {
      const { status } = await req(app, 'POST', '/api/bbs/observations', {
        observerName: `${TAG}-no-date`,
        observationType: 'safe',
        behaviorObserved: 'Test',
      });
      expect(status).toBe(400);
    });

    it('returns 400 when behaviorObserved/description is missing', async () => {
      const { status } = await req(app, 'POST', '/api/bbs/observations', {
        observerName: `${TAG}-no-desc`,
        observationDate: '2026-03-05',
        observationType: 'safe',
      });
      expect(status).toBe(400);
    });
  });

  // ── GET /api/bbs/observations/:id ───────────────────────────────────────

  describe('GET /api/bbs/observations/:id', () => {
    it('returns 200 and mapped observation for a valid id', async () => {
      const { status, body } = await req(app, 'GET', `/api/bbs/observations/${safeObsId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(safeObsId);
      expect(body.data).toHaveProperty('observerName');
      expect(body.data).toHaveProperty('observationType');
    });

    it('returns 404 for a non-existent id', async () => {
      const { status } = await req(app, 'GET', '/api/bbs/observations/99999999');
      expect(status).toBe(404);
    });

    it('returns 400 for a non-numeric id', async () => {
      const { status } = await req(app, 'GET', '/api/bbs/observations/abc');
      expect(status).toBe(400);
    });

    it('returns 400 for id=0', async () => {
      const { status } = await req(app, 'GET', '/api/bbs/observations/0');
      expect(status).toBe(400);
    });
  });

  // ── PUT /api/bbs/observations/:id ───────────────────────────────────────

  describe('PUT /api/bbs/observations/:id', () => {
    let updateId: number;

    beforeAll(() => {
      updateId = seedObs({ observer_name: `${TAG}-update`, status: 'open' });
    });

    it('updates status and returns 200 with mapped fields', async () => {
      const { status, body } = await req(app, 'PUT', `/api/bbs/observations/${updateId}`, {
        status: 'closed',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      // Mapped: closed → resolved
      expect(body.data.status).toBe('resolved');
    });

    it('updates notes (feedback) field', async () => {
      const { body } = await req(app, 'PUT', `/api/bbs/observations/${updateId}`, {
        notes: 'Updated coaching note',
      });
      expect(body.data.feedback).toBe('Updated coaching note');
    });

    it('returns 404 for a non-existent id', async () => {
      const { status } = await req(app, 'PUT', '/api/bbs/observations/99999999', {
        status: 'closed',
      });
      expect(status).toBe(404);
    });

    it('returns 400 for a non-numeric id', async () => {
      const { status } = await req(app, 'PUT', '/api/bbs/observations/abc', {
        status: 'closed',
      });
      expect(status).toBe(400);
    });

    it('returns 400 when body has no valid fields', async () => {
      const { status } = await req(app, 'PUT', `/api/bbs/observations/${updateId}`, {
        unknownField: 'value',
      });
      expect(status).toBe(400);
    });
  });

  // ── GET /api/sif/stats ──────────────────────────────────────────────────

  describe('GET /api/sif/stats', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/sif/stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns total, active, and alertsTriggered counts', async () => {
      const { body } = await req(app, 'GET', '/api/sif/stats');
      expect(typeof body.data.total).toBe('number');
      expect(typeof body.data.active).toBe('number');
      expect(typeof body.data.alertsTriggered).toBe('number');
    });

    it('returns recentPrecursors array', async () => {
      const { body } = await req(app, 'GET', '/api/sif/stats');
      expect(Array.isArray(body.data.recentPrecursors)).toBe(true);
    });
  });

  // ── GET /api/sif/precursors ─────────────────────────────────────────────

  describe('GET /api/sif/precursors', () => {
    let sifId: number;

    beforeAll(async () => {
      const r = await req(app, 'POST', '/api/sif/precursors', {
        title: `${TAG}-sif-get`,
        severity: 'critical',
        department: `${TAG}-sif-dept`,
        location: 'Zone X',
        associatedHazards: ['electrical', 'height'],
        mitigationActions: ['lock-out'],
        status: 'active',
      });
      sifId = r.body.data.id;
    });

    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/sif/precursors');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/sif/precursors');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('associatedHazards is an array (parsed from JSON)', async () => {
      const { body } = await req(app, 'GET', '/api/sif/precursors');
      const sif = body.data.find((s: any) => s.id === sifId);
      expect(Array.isArray(sif.associatedHazards)).toBe(true);
    });

    it('filters by severity', async () => {
      const { body } = await req(app, 'GET', '/api/sif/precursors?severity=critical');
      const ids = body.data.map((s: any) => s.id);
      expect(ids).toContain(sifId);
    });

    it('filters by department', async () => {
      const { body } = await req(app, 'GET', `/api/sif/precursors?department=${TAG}-sif-dept`);
      const ids = body.data.map((s: any) => s.id);
      expect(ids).toContain(sifId);
    });

    it('returns total count', async () => {
      const { body } = await req(app, 'GET', '/api/sif/precursors');
      expect(typeof body.total).toBe('number');
    });
  });

  // ── POST /api/sif/precursors ────────────────────────────────────────────

  describe('POST /api/sif/precursors', () => {
    it('creates and returns 201 with id', async () => {
      const { status, body } = await req(app, 'POST', '/api/sif/precursors', {
        title: `${TAG}-sif-create`,
        severity: 'high',
        location: 'Building C',
        associatedHazards: ['chemical'],
        mitigationActions: ['PPE required'],
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(typeof body.data.id).toBe('number');
    });

    it('returns associatedHazards as array', async () => {
      const { body } = await req(app, 'POST', '/api/sif/precursors', {
        title: `${TAG}-sif-arr`,
        location: 'Yard',
        associatedHazards: ['fall', 'impact'],
      });
      expect(Array.isArray(body.data.associatedHazards)).toBe(true);
      expect(body.data.associatedHazards).toContain('fall');
    });

    it('returns 400 when title is missing', async () => {
      const { status } = await req(app, 'POST', '/api/sif/precursors', {
        severity: 'high',
        location: 'Area',
      });
      expect(status).toBe(400);
    });

    it('returns 400 for invalid severity value', async () => {
      const { status } = await req(app, 'POST', '/api/sif/precursors', {
        title: `${TAG}-sif-bad-sev`,
        severity: 'extreme',
        location: 'Area',
      });
      expect(status).toBe(400);
    });

    it('status defaults to active', async () => {
      const { body } = await req(app, 'POST', '/api/sif/precursors', {
        title: `${TAG}-sif-default-status`,
        location: 'Area D',
      });
      expect(body.data.status).toBe('active');
    });
  });

  // ── GET /api/sif/precursors/:id ─────────────────────────────────────────

  describe('GET /api/sif/precursors/:id', () => {
    let sifId: number;

    beforeAll(async () => {
      const r = await req(app, 'POST', '/api/sif/precursors', {
        title: `${TAG}-sif-getid`,
        location: 'Shed',
        associatedHazards: ['heat'],
      });
      sifId = r.body.data.id;
    });

    it('returns 200 and the correct record', async () => {
      const { status, body } = await req(app, 'GET', `/api/sif/precursors/${sifId}`);
      expect(status).toBe(200);
      expect(body.data.id).toBe(sifId);
    });

    it('returned associatedHazards is array', async () => {
      const { body } = await req(app, 'GET', `/api/sif/precursors/${sifId}`);
      expect(Array.isArray(body.data.associatedHazards)).toBe(true);
    });

    it('returns 404 for a non-existent id', async () => {
      const { status } = await req(app, 'GET', '/api/sif/precursors/99999999');
      expect(status).toBe(404);
    });
  });

  // ── PUT /api/sif/precursors/:id ─────────────────────────────────────────

  describe('PUT /api/sif/precursors/:id', () => {
    let sifId: number;

    beforeAll(async () => {
      const r = await req(app, 'POST', '/api/sif/precursors', {
        title: `${TAG}-sif-put`,
        location: 'Rooftop',
        severity: 'medium',
      });
      sifId = r.body.data.id;
    });

    it('updates status and returns 200', async () => {
      const { status, body } = await req(app, 'PUT', `/api/sif/precursors/${sifId}`, {
        status: 'mitigated',
      });
      expect(status).toBe(200);
      expect(body.data.status).toBe('mitigated');
    });

    it('updates severity', async () => {
      const { body } = await req(app, 'PUT', `/api/sif/precursors/${sifId}`, {
        severity: 'high',
      });
      expect(body.data.severity).toBe('high');
    });

    it('returns 404 for a non-existent id', async () => {
      const { status } = await req(app, 'PUT', '/api/sif/precursors/99999999', {
        status: 'mitigated',
      });
      expect(status).toBe(404);
    });

    it('returns 400 when body has no valid fields', async () => {
      const { status } = await req(app, 'PUT', `/api/sif/precursors/${sifId}`, {
        unknownField: 'nope',
      });
      expect(status).toBe(400);
    });
  });
});
