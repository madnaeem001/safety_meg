/**
 * Pilot Program Route Test Suite
 *
 * Covers:
 *   GET    /api/pilot/stats                 — KPIs, changes, npsScore
 *   GET    /api/pilot/sites                 — list, filters, count field
 *   POST   /api/pilot/sites                 — create, validation, defaults
 *   PUT    /api/pilot/sites/:id             — update, 400 no fields, 404
 *   DELETE /api/pilot/sites/:id             — delete, 404
 *   GET    /api/pilot/shadowing             — list, filters
 *   POST   /api/pilot/shadowing             — create, validation
 *   PUT    /api/pilot/shadowing/:id         — update status, 404
 *   DELETE /api/pilot/shadowing/:id         — delete, 404
 *   GET    /api/pilot/feedback              — list, type filter
 *   POST   /api/pilot/feedback              — create, validation
 *   POST   /api/pilot/feedback/:id/vote     — increments votes, 404
 *   DELETE /api/pilot/feedback/:id          — delete, 404
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { pilotProgramRoutes } from './pilot-program';

// ── App factory ────────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  pilotProgramRoutes(app);
  return app;
}

// ── Request helper ─────────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── Cleanup helpers ────────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `pp-test-${Date.now()}`;
let createdSiteIds: number[] = [];
let createdSessionIds: number[] = [];
let createdFeedbackIds: number[] = [];

afterAll(() => {
  if (createdSiteIds.length) {
    sqlite.prepare(`DELETE FROM pilot_beta_sites WHERE id IN (${createdSiteIds.join(',')})`).run();
  }
  if (createdSessionIds.length) {
    sqlite.prepare(`DELETE FROM pilot_shadowing_sessions WHERE id IN (${createdSessionIds.join(',')})`).run();
  }
  if (createdFeedbackIds.length) {
    sqlite.prepare(`DELETE FROM pilot_feedback_items WHERE id IN (${createdFeedbackIds.join(',')})`).run();
  }
  // catch any API-created items by tag
  const tagSites = (sqlite.prepare(`SELECT id FROM pilot_beta_sites WHERE name LIKE ?`).all(`${TAG}%`) as any[]).map((r: any) => r.id);
  if (tagSites.length) sqlite.prepare(`DELETE FROM pilot_beta_sites WHERE id IN (${tagSites.join(',')})`).run();
  const tagSessions = (sqlite.prepare(`SELECT id FROM pilot_shadowing_sessions WHERE findings LIKE ?`).all(`${TAG}%`) as any[]).map((r: any) => r.id);
  if (tagSessions.length) sqlite.prepare(`DELETE FROM pilot_shadowing_sessions WHERE id IN (${tagSessions.join(',')})`).run();
  const tagFeedback = (sqlite.prepare(`SELECT id FROM pilot_feedback_items WHERE message LIKE ?`).all(`${TAG}%`) as any[]).map((r: any) => r.id);
  if (tagFeedback.length) sqlite.prepare(`DELETE FROM pilot_feedback_items WHERE id IN (${tagFeedback.join(',')})`).run();
  sqlite.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pilot/stats
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/pilot/stats', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 200 with success:true', async () => {
    const { status, body } = await req(app, 'GET', '/api/pilot/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns required numeric KPI fields', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/stats');
    const d = body.data;
    expect(typeof d.activePilots).toBe('number');
    expect(typeof d.totalEnrolled).toBe('number');
    expect(typeof d.feedbackItems).toBe('number');
    expect(typeof d.avgAdoption).toBe('number');
    expect(typeof d.uxIssuesFound).toBe('number');
    expect(typeof d.npsScore).toBe('number');
  });

  it('returns changes object with string values', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/stats');
    const ch = body.data.changes;
    expect(typeof ch.activePilots).toBe('string');
    expect(typeof ch.totalEnrolled).toBe('string');
    expect(typeof ch.feedbackItems).toBe('string');
    expect(typeof ch.avgAdoption).toBe('string');
    expect(typeof ch.uxIssuesFound).toBe('string');
    expect(typeof ch.npsScore).toBe('string');
  });

  it('activePilots matches seeded active sites count', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/stats');
    expect(body.data.activePilots).toBeGreaterThanOrEqual(2); // seeded 2 active
  });

  it('npsScore matches seeded config value', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/stats');
    expect(body.data.npsScore).toBe(72);
  });

  it('all numeric KPIs are non-negative', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/stats');
    const d = body.data;
    expect(d.activePilots).toBeGreaterThanOrEqual(0);
    expect(d.totalEnrolled).toBeGreaterThanOrEqual(0);
    expect(d.feedbackItems).toBeGreaterThanOrEqual(0);
    expect(d.avgAdoption).toBeGreaterThanOrEqual(0);
    expect(d.uxIssuesFound).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pilot/sites
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/pilot/sites', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 200 with success:true and data array', async () => {
    const { status, body } = await req(app, 'GET', '/api/pilot/sites');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('each site has required camelCase fields', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/sites');
    const s = body.data[0];
    expect(s).toHaveProperty('id');
    expect(s).toHaveProperty('name');
    expect(s).toHaveProperty('department');
    expect(s).toHaveProperty('status');
    expect(s).toHaveProperty('progress');
    expect(s).toHaveProperty('enrolled');
    expect(s).toHaveProperty('feedbackCount');
    expect(s).toHaveProperty('startDate');
    expect(s).toHaveProperty('daysLeft');
    expect(s).toHaveProperty('riskLevel');
    expect(s).toHaveProperty('createdAt');
    expect(s).toHaveProperty('updatedAt');
  });

  it('returns count field equal to data.length', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/sites');
    expect(body.count).toBe(body.data.length);
  });

  it('filters by status=active', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/sites?status=active');
    expect(body.data.every((s: any) => s.status === 'active')).toBe(true);
  });

  it('filters by status=completed', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/sites?status=completed');
    expect(body.data.every((s: any) => s.status === 'completed')).toBe(true);
  });

  it('filters by riskLevel=High', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/sites?riskLevel=High');
    expect(body.data.every((s: any) => s.riskLevel === 'High')).toBe(true);
  });

  it('seeded sites are present', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/sites');
    const names = body.data.map((s: any) => s.name);
    expect(names).toContain('Houston Refinery - Unit 4');
    expect(names).toContain('Denver Warehouse B');
    expect(names).toContain('Chicago Lab - Floor 3');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pilot/sites
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/pilot/sites', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('creates a site with 201 and defaults', async () => {
    const { status, body } = await req(app, 'POST', '/api/pilot/sites', {
      name: `${TAG} Refinery Test`,
      department: 'Operations',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('active');
    expect(body.data.progress).toBe(0);
    expect(body.data.riskLevel).toBe('Medium');
    if (body.data.id) createdSiteIds.push(body.data.id);
  });

  it('stores all provided fields correctly', async () => {
    const { body } = await req(app, 'POST', '/api/pilot/sites', {
      name: `${TAG} Full Site`,
      department: 'Logistics',
      status: 'paused',
      progress: 45,
      enrolled: 30,
      feedbackCount: 10,
      daysLeft: 7,
      riskLevel: 'High',
      notes: 'Pilot paused due to shutdown',
    });
    expect(body.data.department).toBe('Logistics');
    expect(body.data.status).toBe('paused');
    expect(body.data.progress).toBe(45);
    expect(body.data.enrolled).toBe(30);
    expect(body.data.feedbackCount).toBe(10);
    expect(body.data.daysLeft).toBe(7);
    expect(body.data.riskLevel).toBe('High');
    expect(body.data.notes).toBe('Pilot paused due to shutdown');
    if (body.data.id) createdSiteIds.push(body.data.id);
  });

  it('returns 400 when name is missing', async () => {
    const { status } = await req(app, 'POST', '/api/pilot/sites', { department: 'R&D' });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid status value', async () => {
    const { status } = await req(app, 'POST', '/api/pilot/sites', {
      name: `${TAG} Bad Status`, status: 'running',
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid riskLevel value', async () => {
    const { status } = await req(app, 'POST', '/api/pilot/sites', {
      name: `${TAG} Bad Risk`, riskLevel: 'Extreme',
    });
    expect(status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/pilot/sites/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/pilot/sites/:id', () => {
  let app: Hono;
  let siteId: number;

  beforeAll(async () => {
    app = createTestApp();
    const { body } = await req(app, 'POST', '/api/pilot/sites', {
      name: `${TAG} Update Target`,
      department: 'R&D',
      progress: 20,
    });
    siteId = body.data.id;
    createdSiteIds.push(siteId);
  });

  it('updates progress and returns 200', async () => {
    const { status, body } = await req(app, 'PUT', `/api/pilot/sites/${siteId}`, { progress: 75 });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.progress).toBe(75);
  });

  it('partial update preserves unchanged fields', async () => {
    await req(app, 'PUT', `/api/pilot/sites/${siteId}`, { notes: 'Phase 2 started' });
    const { body } = await req(app, 'GET', `/api/pilot/sites`);
    const updated = body.data.find((s: any) => s.id === siteId);
    expect(updated.department).toBe('R&D');
    expect(updated.notes).toBe('Phase 2 started');
  });

  it('marks site as completed', async () => {
    const { body } = await req(app, 'PUT', `/api/pilot/sites/${siteId}`, { status: 'completed', progress: 100 });
    expect(body.data.status).toBe('completed');
    expect(body.data.progress).toBe(100);
  });

  it('returns 400 when body has no updatable fields', async () => {
    const { status } = await req(app, 'PUT', `/api/pilot/sites/${siteId}`, {});
    expect(status).toBe(400);
  });

  it('returns 404 for non-existent site', async () => {
    const { status } = await req(app, 'PUT', '/api/pilot/sites/999999', { progress: 10 });
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/pilot/sites/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/pilot/sites/:id', () => {
  let app: Hono;
  let siteId: number;

  beforeAll(async () => {
    app = createTestApp();
    const { body } = await req(app, 'POST', '/api/pilot/sites', {
      name: `${TAG} Delete Target`,
    });
    siteId = body.data.id;
  });

  it('deletes a site and returns 200', async () => {
    const { status, body } = await req(app, 'DELETE', `/api/pilot/sites/${siteId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('deleted site is gone from list', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/sites');
    expect(body.data.find((s: any) => s.id === siteId)).toBeUndefined();
  });

  it('returns 404 for already-deleted site', async () => {
    const { status } = await req(app, 'DELETE', `/api/pilot/sites/${siteId}`);
    expect(status).toBe(404);
  });

  it('returns 404 for non-existent site', async () => {
    const { status } = await req(app, 'DELETE', '/api/pilot/sites/999999');
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pilot/shadowing
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/pilot/shadowing', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 200 with success:true and data array', async () => {
    const { status, body } = await req(app, 'GET', '/api/pilot/shadowing');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('each session has required fields', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/shadowing');
    const s = body.data[0];
    expect(s).toHaveProperty('id');
    expect(s).toHaveProperty('observer');
    expect(s).toHaveProperty('worker');
    expect(s).toHaveProperty('site');
    expect(s).toHaveProperty('date');
    expect(s).toHaveProperty('findings');
    expect(s).toHaveProperty('severity');
    expect(s).toHaveProperty('status');
    expect(s).toHaveProperty('createdAt');
  });

  it('returns count field equal to data.length', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/shadowing');
    expect(body.count).toBe(body.data.length);
  });

  it('filters by severity=high', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/shadowing?severity=high');
    expect(body.data.every((s: any) => s.severity === 'high')).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('filters by status=resolved', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/shadowing?status=resolved');
    expect(body.data.every((s: any) => s.status === 'resolved')).toBe(true);
  });

  it('filters by site (partial match)', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/shadowing?site=Houston');
    expect(body.data.every((s: any) => s.site.includes('Houston'))).toBe(true);
  });

  it('seeded sessions are present', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/shadowing');
    const findings = body.data.map((s: any) => s.findings);
    expect(findings).toContain('Button size too small for gloved hands');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pilot/shadowing
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/pilot/shadowing', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('creates a session with 201 and defaults', async () => {
    const { status, body } = await req(app, 'POST', '/api/pilot/shadowing', {
      observer: 'Test Observer',
      worker: 'Test Worker',
      site: 'Test Site',
      findings: `${TAG} Found something notable`,
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.severity).toBe('medium');
    expect(body.data.status).toBe('open');
    if (body.data.id) createdSessionIds.push(body.data.id);
  });

  it('stores severity and status when provided', async () => {
    const { body } = await req(app, 'POST', '/api/pilot/shadowing', {
      observer: 'Obs2',
      worker: 'Wkr2',
      site: 'Site2',
      findings: `${TAG} High severity finding`,
      severity: 'high',
      status: 'in-progress',
      date: '2026-03-01',
    });
    expect(body.data.severity).toBe('high');
    expect(body.data.status).toBe('in-progress');
    expect(body.data.date).toBe('2026-03-01');
    if (body.data.id) createdSessionIds.push(body.data.id);
  });

  it('returns 400 when observer is missing', async () => {
    const { status } = await req(app, 'POST', '/api/pilot/shadowing', {
      worker: 'Worker', site: 'Site', findings: 'Something',
    });
    expect(status).toBe(400);
  });

  it('returns 400 when findings is missing', async () => {
    const { status } = await req(app, 'POST', '/api/pilot/shadowing', {
      observer: 'Obs', worker: 'Wkr', site: 'Site',
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid severity', async () => {
    const { status } = await req(app, 'POST', '/api/pilot/shadowing', {
      observer: 'Obs', worker: 'Wkr', site: 'Site', findings: 'Something', severity: 'critical',
    });
    expect(status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/pilot/shadowing/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/pilot/shadowing/:id', () => {
  let app: Hono;
  let sessionId: number;

  beforeAll(async () => {
    app = createTestApp();
    const { body } = await req(app, 'POST', '/api/pilot/shadowing', {
      observer: 'Update Obs',
      worker: 'Update Wkr',
      site: 'Update Site',
      findings: `${TAG} Update target findings`,
    });
    sessionId = body.data.id;
    createdSessionIds.push(sessionId);
  });

  it('updates status to resolved', async () => {
    const { status, body } = await req(app, 'PUT', `/api/pilot/shadowing/${sessionId}`, { status: 'resolved' });
    expect(status).toBe(200);
    expect(body.data.status).toBe('resolved');
  });

  it('updates severity', async () => {
    const { body } = await req(app, 'PUT', `/api/pilot/shadowing/${sessionId}`, { severity: 'low' });
    expect(body.data.severity).toBe('low');
  });

  it('returns 400 for empty body', async () => {
    const { status } = await req(app, 'PUT', `/api/pilot/shadowing/${sessionId}`, {});
    expect(status).toBe(400);
  });

  it('returns 404 for non-existent session', async () => {
    const { status } = await req(app, 'PUT', '/api/pilot/shadowing/999999', { status: 'resolved' });
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/pilot/shadowing/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/pilot/shadowing/:id', () => {
  let app: Hono;
  let sessionId: number;

  beforeAll(async () => {
    app = createTestApp();
    const { body } = await req(app, 'POST', '/api/pilot/shadowing', {
      observer: 'Del Obs', worker: 'Del Wkr', site: 'Del Site',
      findings: `${TAG} Delete target session`,
    });
    sessionId = body.data.id;
  });

  it('deletes a session and returns 200', async () => {
    const { status, body } = await req(app, 'DELETE', `/api/pilot/shadowing/${sessionId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 404 for already-deleted session', async () => {
    const { status } = await req(app, 'DELETE', `/api/pilot/shadowing/${sessionId}`);
    expect(status).toBe(404);
  });

  it('returns 404 for non-existent session', async () => {
    const { status } = await req(app, 'DELETE', '/api/pilot/shadowing/999999');
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pilot/feedback
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/pilot/feedback', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 200 with success:true and data array', async () => {
    const { status, body } = await req(app, 'GET', '/api/pilot/feedback');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('each item has required fields', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/feedback');
    const item = body.data[0];
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('type');
    expect(item).toHaveProperty('message');
    expect(item).toHaveProperty('user');
    expect(item).toHaveProperty('votes');
    expect(item).toHaveProperty('date');
    expect(item).toHaveProperty('createdAt');
  });

  it('returns count field equal to data.length', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/feedback');
    expect(body.count).toBe(body.data.length);
  });

  it('filters by type=bug', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/feedback?type=bug');
    expect(body.data.every((f: any) => f.type === 'bug')).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('filters by type=idea', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/feedback?type=idea');
    expect(body.data.every((f: any) => f.type === 'idea')).toBe(true);
  });

  it('filters by type=praise', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/feedback?type=praise');
    expect(body.data.every((f: any) => f.type === 'praise')).toBe(true);
  });

  it('results are ordered by votes DESC', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/feedback');
    const votes = body.data.map((f: any) => f.votes);
    for (let i = 0; i < votes.length - 1; i++) {
      expect(votes[i]).toBeGreaterThanOrEqual(votes[i + 1]);
    }
  });

  it('seeded feedback items are present', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/feedback');
    const messages = body.data.map((f: any) => f.message);
    expect(messages).toContain('Camera freezes when switching from front to back');
    expect(messages).toContain('QR code scanner is incredibly fast');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pilot/feedback
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/pilot/feedback', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('creates feedback with 201 and 0 votes', async () => {
    const { status, body } = await req(app, 'POST', '/api/pilot/feedback', {
      type: 'idea',
      message: `${TAG} Great new feature idea`,
      user: 'Inspector',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.votes).toBe(0);
    expect(body.data.type).toBe('idea');
    if (body.data.id) createdFeedbackIds.push(body.data.id);
  });

  it('defaults user to Field Worker when omitted', async () => {
    const { body } = await req(app, 'POST', '/api/pilot/feedback', {
      type: 'bug',
      message: `${TAG} Bug without user`,
    });
    expect(body.data.user).toBe('Field Worker');
    if (body.data.id) createdFeedbackIds.push(body.data.id);
  });

  it('stores all feedback types correctly', async () => {
    for (const type of ['bug', 'idea', 'praise'] as const) {
      const { body } = await req(app, 'POST', '/api/pilot/feedback', {
        type,
        message: `${TAG} ${type} test`,
      });
      expect(body.data.type).toBe(type);
      if (body.data.id) createdFeedbackIds.push(body.data.id);
    }
  });

  it('returns 400 when message is missing', async () => {
    const { status } = await req(app, 'POST', '/api/pilot/feedback', { type: 'idea' });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid type', async () => {
    const { status } = await req(app, 'POST', '/api/pilot/feedback', {
      type: 'complaint', message: 'Something bad',
    });
    expect(status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pilot/feedback/:id/vote
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/pilot/feedback/:id/vote', () => {
  let app: Hono;
  let feedbackId: number;
  let initialVotes: number;

  beforeAll(async () => {
    app = createTestApp();
    const { body } = await req(app, 'POST', '/api/pilot/feedback', {
      type: 'praise',
      message: `${TAG} Vote test item`,
    });
    feedbackId = body.data.id;
    initialVotes = body.data.votes;
    createdFeedbackIds.push(feedbackId);
  });

  it('increments votes by 1 and returns 200', async () => {
    const { status, body } = await req(app, 'POST', `/api/pilot/feedback/${feedbackId}/vote`, {});
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.votes).toBe(initialVotes + 1);
  });

  it('increments votes again on second vote', async () => {
    const { body } = await req(app, 'POST', `/api/pilot/feedback/${feedbackId}/vote`, {});
    expect(body.data.votes).toBe(initialVotes + 2);
  });

  it('reflects updated votes in GET list', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/feedback');
    const item = body.data.find((f: any) => f.id === feedbackId);
    expect(item).toBeDefined();
    expect(item.votes).toBeGreaterThanOrEqual(initialVotes + 2);
  });

  it('returns 404 for non-existent feedback item', async () => {
    const { status } = await req(app, 'POST', '/api/pilot/feedback/999999/vote', {});
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/pilot/feedback/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/pilot/feedback/:id', () => {
  let app: Hono;
  let feedbackId: number;

  beforeAll(async () => {
    app = createTestApp();
    const { body } = await req(app, 'POST', '/api/pilot/feedback', {
      type: 'bug',
      message: `${TAG} Delete target bug`,
    });
    feedbackId = body.data.id;
  });

  it('deletes a feedback item and returns 200', async () => {
    const { status, body } = await req(app, 'DELETE', `/api/pilot/feedback/${feedbackId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('deleted item is gone from GET list', async () => {
    const { body } = await req(app, 'GET', '/api/pilot/feedback');
    expect(body.data.find((f: any) => f.id === feedbackId)).toBeUndefined();
  });

  it('returns 404 for already-deleted item', async () => {
    const { status } = await req(app, 'DELETE', `/api/pilot/feedback/${feedbackId}`);
    expect(status).toBe(404);
  });

  it('returns 404 for non-existent feedback item', async () => {
    const { status } = await req(app, 'DELETE', '/api/pilot/feedback/999999');
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Stats consistency — totals update as data changes
// ─────────────────────────────────────────────────────────────────────────────

describe('Stats consistency after mutations', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('totalEnrolled increases after adding an active site', async () => {
    const { body: before } = await req(app, 'GET', '/api/pilot/stats');
    const prevEnrolled = before.data.totalEnrolled;

    const { body: newSite } = await req(app, 'POST', '/api/pilot/sites', {
      name: `${TAG} Stats Check Site`,
      enrolled: 50,
      status: 'active',
    });
    createdSiteIds.push(newSite.data.id);

    const { body: after } = await req(app, 'GET', '/api/pilot/stats');
    expect(after.data.totalEnrolled).toBe(prevEnrolled + 50);
  });

  it('feedbackItems count increases after adding feedback', async () => {
    const { body: before } = await req(app, 'GET', '/api/pilot/stats');
    const prevCount = before.data.feedbackItems;

    const { body: newFb } = await req(app, 'POST', '/api/pilot/feedback', {
      type: 'idea', message: `${TAG} Stats feedback item`,
    });
    createdFeedbackIds.push(newFb.data.id);

    const { body: after } = await req(app, 'GET', '/api/pilot/stats');
    expect(after.data.feedbackItems).toBe(prevCount + 1);
  });

  it('activePilots decreases after completing a site', async () => {
    const { body: newSite } = await req(app, 'POST', '/api/pilot/sites', {
      name: `${TAG} Active-to-Complete Site`,
      status: 'active',
    });
    const siteId = newSite.data.id;
    createdSiteIds.push(siteId);

    const { body: before } = await req(app, 'GET', '/api/pilot/stats');
    const prevActive = before.data.activePilots;

    await req(app, 'PUT', `/api/pilot/sites/${siteId}`, { status: 'completed' });

    const { body: after } = await req(app, 'GET', '/api/pilot/stats');
    expect(after.data.activePilots).toBe(prevActive - 1);
  });
});
