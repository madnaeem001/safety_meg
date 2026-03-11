/**
 * Compliance Procedures Routes Test Suite
 *
 * Covers:
 *   GET    /api/compliance/procedures/stats   — aggregate stats
 *   GET    /api/compliance/procedures         — list with filters
 *   POST   /api/compliance/procedures         — create (with all new fields)
 *   GET    /api/compliance/procedures/:id     — get by id
 *   PUT    /api/compliance/procedures/:id     — update (including new fields)
 *   DELETE /api/compliance/procedures/:id     — hard delete
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { complianceProceduresRoutes } from '../routes/compliance-procedures';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  complianceProceduresRoutes(app);
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

// ── Seed / Cleanup ─────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `testcp-${Date.now()}`;

afterAll(() => {
  sqlite.prepare(`DELETE FROM compliance_procedures WHERE name LIKE '${TAG}%'`).run();
  sqlite.close();
});

const SAMPLE_STEPS = JSON.stringify([
  { stepNumber: 1, title: 'Identify Hazards', description: 'Survey the area for potential hazards', criticalControl: false },
  { stepNumber: 2, title: 'Apply Controls', description: 'Implement required safety controls', criticalControl: true },
]);

const SAMPLE_AUDIT_TRAIL = JSON.stringify([
  { id: 'AT-T01', timestamp: '2026-01-01T09:00:00Z', action: 'Created', user: 'Test User', details: 'Initial creation' },
]);

const SAMPLE_INDUSTRIES = JSON.stringify(['Manufacturing', 'Oil & Gas']);

function seedProcedure(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO compliance_procedures
      (name, description, category, regulation, version, status, owner, approved_by,
       effective_date, review_date, document,
       industries, iso_clause, steps,
       ai_risk_score, ai_risk_level, ai_risk_rationale, ai_risk_last_analyzed, ai_risk_trending,
       audit_trail, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    overrides.name             ?? `${TAG}-loto`,
    overrides.description      ?? 'Lockout/Tagout safety procedure for equipment maintenance',
    overrides.category         ?? 'safety',
    overrides.regulation       ?? 'OSHA 29 CFR 1910.147',
    overrides.version          ?? '2.1',
    overrides.status           ?? 'active',
    overrides.owner            ?? 'HSE Manager',
    overrides.approved_by      ?? 'Site Director',
    overrides.effective_date   ?? '2026-01-01',
    overrides.review_date      ?? '2026-12-31',
    overrides.document         ?? null,
    overrides.industries       ?? SAMPLE_INDUSTRIES,
    overrides.iso_clause       ?? '8.5.1',
    overrides.steps            ?? SAMPLE_STEPS,
    overrides.ai_risk_score    ?? 72,
    overrides.ai_risk_level    ?? 'Medium',
    overrides.ai_risk_rationale ?? 'Recent near-miss requires monitoring',
    overrides.ai_risk_last_analyzed ?? '2026-01-05T14:30:00Z',
    overrides.ai_risk_trending  ?? 'stable',
    overrides.audit_trail      ?? SAMPLE_AUDIT_TRAIL,
    overrides.created_at       ?? ts,
    overrides.updated_at       ?? ts
  );
  return result.lastInsertRowid as number;
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('GET /api/compliance/procedures/stats', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 200 with success envelope', async () => {
    const { status, body } = await req(app, 'GET', '/api/compliance/procedures/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('response has total field', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures/stats');
    expect(typeof body.data.total).toBe('number');
    expect(body.data.total).toBeGreaterThanOrEqual(0);
  });

  it('response has byStatus array', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures/stats');
    expect(Array.isArray(body.data.byStatus)).toBe(true);
  });

  it('response has byCategory array', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures/stats');
    expect(Array.isArray(body.data.byCategory)).toBe(true);
  });

  it('response has recentlyUpdated array', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures/stats');
    expect(Array.isArray(body.data.recentlyUpdated)).toBe(true);
  });

  it('total increases after seeding', async () => {
    const { body: before } = await req(app, 'GET', '/api/compliance/procedures/stats');
    seedProcedure({ name: `${TAG}-stats-seed` });
    const { body: after } = await req(app, 'GET', '/api/compliance/procedures/stats');
    expect(after.data.total).toBeGreaterThan(before.data.total);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/compliance/procedures', () => {
  let app: Hono;
  let id1: number;
  let id2: number;

  beforeAll(() => {
    app = createTestApp();
    id1 = seedProcedure({ name: `${TAG}-list-loto`, status: 'active', category: 'safety' });
    id2 = seedProcedure({ name: `${TAG}-list-env`, status: 'draft', category: 'environmental' });
  });

  it('returns 200 with success:true', async () => {
    const { status, body } = await req(app, 'GET', '/api/compliance/procedures');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns array in data field', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures');
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('has total field matching data length', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures');
    expect(body.total).toBe(body.data.length);
  });

  it('mapped record has title alias for name', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures');
    const found = body.data.find((p: any) => p.id === id1);
    expect(found).toBeDefined();
    expect(found.title).toBe(found.name);
  });

  it('mapped record has scope alias for description', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures');
    const found = body.data.find((p: any) => p.id === id1);
    expect(found.scope).toBe(found.description);
  });

  it('mapped record has industries as parsed array', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures');
    const found = body.data.find((p: any) => p.id === id1);
    expect(Array.isArray(found.industries)).toBe(true);
    expect(found.industries).toContain('Manufacturing');
  });

  it('mapped record has steps as parsed array', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures');
    const found = body.data.find((p: any) => p.id === id1);
    expect(Array.isArray(found.steps)).toBe(true);
    expect(found.steps.length).toBe(2);
    expect(found.steps[0]).toHaveProperty('stepNumber');
    expect(found.steps[0]).toHaveProperty('criticalControl');
  });

  it('mapped record has isoClause', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures');
    const found = body.data.find((p: any) => p.id === id1);
    expect(found.isoClause).toBe('8.5.1');
  });

  it('mapped record has aiRisk nested object', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures');
    const found = body.data.find((p: any) => p.id === id1);
    expect(found.aiRisk).toBeDefined();
    expect(found.aiRisk.score).toBe(72);
    expect(found.aiRisk.level).toBe('Medium');
    expect(found.aiRisk.trending).toBe('stable');
    expect(found.aiRisk.rationale).toBeTruthy();
    expect(found.aiRisk.lastAnalyzed).toBeTruthy();
  });

  it('mapped record has auditTrail as parsed array', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures');
    const found = body.data.find((p: any) => p.id === id1);
    expect(Array.isArray(found.auditTrail)).toBe(true);
    expect(found.auditTrail[0]).toHaveProperty('id', 'AT-T01');
    expect(found.auditTrail[0]).toHaveProperty('action', 'Created');
  });

  it('mapped record has lastUpdated field', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures');
    const found = body.data.find((p: any) => p.id === id1);
    expect(found.lastUpdated).toBeTruthy();
  });

  it('filters by status', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures?status=draft');
    const names = body.data.map((p: any) => p.name);
    expect(names).toContain(`${TAG}-list-env`);
    expect(names).not.toContain(`${TAG}-list-loto`);
  });

  it('filters by category', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures?category=safety');
    const names = body.data.map((p: any) => p.name);
    expect(names).toContain(`${TAG}-list-loto`);
  });

  it('filters by search term (name match)', async () => {
    const { body } = await req(app, 'GET', `/api/compliance/procedures?search=${TAG}-list-loto`);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].name).toBe(`${TAG}-list-loto`);
  });

  it('results ordered by updated_at DESC', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/procedures');
    const timestamps = body.data.map((p: any) => p.updatedAt ?? p.updated_at ?? 0);
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/compliance/procedures', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 201 on valid create', async () => {
    const { status } = await req(app, 'POST', '/api/compliance/procedures', {
      name: `${TAG}-post-loto`,
      description: 'Created via POST test',
      category: 'safety',
      status: 'active',
    });
    expect(status).toBe(201);
  });

  it('returns success:true and data with id', async () => {
    const { body } = await req(app, 'POST', '/api/compliance/procedures', {
      name: `${TAG}-post-id`,
    });
    expect(body.success).toBe(true);
    expect(typeof body.data.id).toBe('number');
  });

  it('creates record with industries array', async () => {
    const { body } = await req(app, 'POST', '/api/compliance/procedures', {
      name: `${TAG}-post-ind`,
      industries: ['Construction', 'Healthcare'],
    });
    expect(Array.isArray(body.data.industries)).toBe(true);
    expect(body.data.industries).toContain('Construction');
    expect(body.data.industries).toContain('Healthcare');
  });

  it('creates record with steps array', async () => {
    const steps = [
      { stepNumber: 1, title: 'Step One', description: 'Do first thing', criticalControl: true },
      { stepNumber: 2, title: 'Step Two', description: 'Do second thing', criticalControl: false },
    ];
    const { body } = await req(app, 'POST', '/api/compliance/procedures', {
      name: `${TAG}-post-steps`,
      steps,
    });
    expect(Array.isArray(body.data.steps)).toBe(true);
    expect(body.data.steps).toHaveLength(2);
    expect(body.data.steps[0].title).toBe('Step One');
    expect(body.data.steps[0].criticalControl).toBe(true);
  });

  it('creates record with isoClause', async () => {
    const { body } = await req(app, 'POST', '/api/compliance/procedures', {
      name: `${TAG}-post-iso`,
      isoClause: '6.1',
    });
    expect(body.data.isoClause).toBe('6.1');
  });

  it('creates record with full aiRisk fields', async () => {
    const { body } = await req(app, 'POST', '/api/compliance/procedures', {
      name: `${TAG}-post-airisk`,
      aiRiskScore: 85,
      aiRiskLevel: 'High',
      aiRiskRationale: 'Multiple incidents in Q4',
      aiRiskLastAnalyzed: '2026-01-05T10:00:00Z',
      aiRiskTrending: 'worsening',
    });
    expect(body.data.aiRisk.score).toBe(85);
    expect(body.data.aiRisk.level).toBe('High');
    expect(body.data.aiRisk.rationale).toBe('Multiple incidents in Q4');
    expect(body.data.aiRisk.trending).toBe('worsening');
  });

  it('creates record with auditTrail array', async () => {
    const auditTrail = [
      { id: 'AT-P01', timestamp: '2026-01-01T09:00:00Z', action: 'Created', user: 'Admin', details: 'Test' }
    ];
    const { body } = await req(app, 'POST', '/api/compliance/procedures', {
      name: `${TAG}-post-audit`,
      auditTrail,
    });
    expect(Array.isArray(body.data.auditTrail)).toBe(true);
    expect(body.data.auditTrail[0].id).toBe('AT-P01');
  });

  it('defaults empty arrays when not provided', async () => {
    const { body } = await req(app, 'POST', '/api/compliance/procedures', {
      name: `${TAG}-post-defaults`,
    });
    expect(body.data.industries).toEqual([]);
    expect(body.data.steps).toEqual([]);
    expect(body.data.auditTrail).toEqual([]);
  });

  it('defaults aiRisk score to 50 and level to Medium', async () => {
    const { body } = await req(app, 'POST', '/api/compliance/procedures', {
      name: `${TAG}-post-defaults2`,
    });
    expect(body.data.aiRisk.score).toBe(50);
    expect(body.data.aiRisk.level).toBe('Medium');
    expect(body.data.aiRisk.trending).toBe('stable');
  });

  it('has title alias equal to name', async () => {
    const { body } = await req(app, 'POST', '/api/compliance/procedures', {
      name: `${TAG}-post-alias`,
    });
    expect(body.data.title).toBe(`${TAG}-post-alias`);
  });

  it('has scope alias equal to description', async () => {
    const { body } = await req(app, 'POST', '/api/compliance/procedures', {
      name: `${TAG}-post-scope`,
      description: 'Scope description here',
    });
    expect(body.data.scope).toBe('Scope description here');
  });

  it('returns 400 when name is missing', async () => {
    const { status } = await req(app, 'POST', '/api/compliance/procedures', {
      description: 'No name provided',
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid category enum', async () => {
    const { status } = await req(app, 'POST', '/api/compliance/procedures', {
      name: `${TAG}-post-invalid-cat`,
      category: 'unknown-category',
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid status enum', async () => {
    const { status } = await req(app, 'POST', '/api/compliance/procedures', {
      name: `${TAG}-post-invalid-status`,
      status: 'nonexistent',
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid aiRiskLevel enum', async () => {
    const { status } = await req(app, 'POST', '/api/compliance/procedures', {
      name: `${TAG}-post-invalid-level`,
      aiRiskLevel: 'SuperHigh',
    });
    expect(status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/compliance/procedures/:id', () => {
  let app: Hono;
  let id: number;

  beforeAll(() => {
    app = createTestApp();
    id = seedProcedure({ name: `${TAG}-getbyid` });
  });

  it('returns 200 with full record', async () => {
    const { status, body } = await req(app, 'GET', `/api/compliance/procedures/${id}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(id);
  });

  it('returned record has industries array', async () => {
    const { body } = await req(app, 'GET', `/api/compliance/procedures/${id}`);
    expect(Array.isArray(body.data.industries)).toBe(true);
  });

  it('returned record has steps array with criticalControl', async () => {
    const { body } = await req(app, 'GET', `/api/compliance/procedures/${id}`);
    expect(Array.isArray(body.data.steps)).toBe(true);
    const critical = body.data.steps.find((s: any) => s.criticalControl === true);
    expect(critical).toBeDefined();
  });

  it('returned record has nested aiRisk object', async () => {
    const { body } = await req(app, 'GET', `/api/compliance/procedures/${id}`);
    expect(body.data.aiRisk).toBeDefined();
    expect(body.data.aiRisk.score).toBe(72);
    expect(body.data.aiRisk.level).toBe('Medium');
    expect(body.data.aiRisk.lastAnalyzed).toBe('2026-01-05T14:30:00Z');
  });

  it('returned record has auditTrail array', async () => {
    const { body } = await req(app, 'GET', `/api/compliance/procedures/${id}`);
    expect(Array.isArray(body.data.auditTrail)).toBe(true);
    expect(body.data.auditTrail.length).toBeGreaterThan(0);
  });

  it('returned record has lastUpdated', async () => {
    const { body } = await req(app, 'GET', `/api/compliance/procedures/${id}`);
    expect(body.data.lastUpdated).toBeTruthy();
  });

  it('returns 404 for nonexistent id', async () => {
    const { status } = await req(app, 'GET', '/api/compliance/procedures/99999999');
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/compliance/procedures/:id', () => {
  let app: Hono;
  let id: number;

  beforeAll(() => {
    app = createTestApp();
    id = seedProcedure({ name: `${TAG}-put-base` });
  });

  it('returns 200 on valid update', async () => {
    const { status } = await req(app, 'PUT', `/api/compliance/procedures/${id}`, {
      name: `${TAG}-put-updated`,
    });
    expect(status).toBe(200);
  });

  it('updates name and reflects in response', async () => {
    const { body } = await req(app, 'PUT', `/api/compliance/procedures/${id}`, {
      name: `${TAG}-put-renamed`,
    });
    expect(body.data.name).toBe(`${TAG}-put-renamed`);
    expect(body.data.title).toBe(`${TAG}-put-renamed`);
  });

  it('updates industries and parses to array', async () => {
    const { body } = await req(app, 'PUT', `/api/compliance/procedures/${id}`, {
      industries: ['Healthcare', 'Transportation'],
    });
    expect(body.data.industries).toContain('Healthcare');
    expect(body.data.industries).toContain('Transportation');
  });

  it('updates steps array', async () => {
    const newSteps = [
      { stepNumber: 1, title: 'New Step', description: 'Updated step', criticalControl: true }
    ];
    const { body } = await req(app, 'PUT', `/api/compliance/procedures/${id}`, {
      steps: newSteps,
    });
    expect(body.data.steps).toHaveLength(1);
    expect(body.data.steps[0].title).toBe('New Step');
  });

  it('updates aiRisk score', async () => {
    const { body } = await req(app, 'PUT', `/api/compliance/procedures/${id}`, {
      aiRiskScore: 95,
      aiRiskLevel: 'Critical',
      aiRiskTrending: 'worsening',
    });
    expect(body.data.aiRisk.score).toBe(95);
    expect(body.data.aiRisk.level).toBe('Critical');
    expect(body.data.aiRisk.trending).toBe('worsening');
  });

  it('updates auditTrail', async () => {
    const trail = [
      { id: 'AT-U01', timestamp: '2026-02-01T10:00:00Z', action: 'Updated', user: 'Tester', details: 'PUT test update' }
    ];
    const { body } = await req(app, 'PUT', `/api/compliance/procedures/${id}`, {
      auditTrail: trail,
    });
    expect(body.data.auditTrail[0].id).toBe('AT-U01');
  });

  it('updates isoClause', async () => {
    const { body } = await req(app, 'PUT', `/api/compliance/procedures/${id}`, {
      isoClause: '10.2',
    });
    expect(body.data.isoClause).toBe('10.2');
  });

  it('preserves unchanged fields when only name is updated', async () => {
    const { body: before } = await req(app, 'GET', `/api/compliance/procedures/${id}`);
    const beforeCategory = before.data.category;
    await req(app, 'PUT', `/api/compliance/procedures/${id}`, { name: `${TAG}-put-preserve` });
    const { body: after } = await req(app, 'GET', `/api/compliance/procedures/${id}`);
    expect(after.data.category).toBe(beforeCategory);
  });

  it('returns 404 for nonexistent id', async () => {
    const { status } = await req(app, 'PUT', '/api/compliance/procedures/99999999', {
      name: 'ghost',
    });
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/compliance/procedures/:id', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('returns 200 on successful delete', async () => {
    const id = seedProcedure({ name: `${TAG}-delete-me` });
    const { status } = await req(app, 'DELETE', `/api/compliance/procedures/${id}`);
    expect(status).toBe(200);
  });

  it('responds with success:true and message', async () => {
    const id = seedProcedure({ name: `${TAG}-delete-msg` });
    const { body } = await req(app, 'DELETE', `/api/compliance/procedures/${id}`);
    expect(body.success).toBe(true);
    expect(typeof body.message).toBe('string');
  });

  it('record is truly deleted (404 on subsequent GET)', async () => {
    const id = seedProcedure({ name: `${TAG}-delete-verify` });
    await req(app, 'DELETE', `/api/compliance/procedures/${id}`);
    const { status } = await req(app, 'GET', `/api/compliance/procedures/${id}`);
    expect(status).toBe(404);
  });

  it('returns 404 for nonexistent id', async () => {
    const { status } = await req(app, 'DELETE', '/api/compliance/procedures/99999999');
    expect(status).toBe(404);
  });
});
