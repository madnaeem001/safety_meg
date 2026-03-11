/**
 * Compliance Gap Analysis Routes Test Suite
 *
 * Covers:
 *   GET    /api/compliance/gap-analysis/stats
 *   GET    /api/compliance/gap-analysis  (list, filtering, field mapping)
 *   POST   /api/compliance/gap-analysis  (create, validation)
 *   GET    /api/compliance/gap-analysis/:id
 *   PUT    /api/compliance/gap-analysis/:id  (update, status normalization)
 *   DELETE /api/compliance/gap-analysis/:id
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { complianceCalendarRoutes } from '../routes/compliance-calendar';

function createTestApp() {
  const app = new Hono();
  complianceCalendarRoutes(app);
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
const TAG = `testgap-${Date.now()}`;

afterAll(() => {
  sqlite.prepare(`DELETE FROM gap_analysis_reports WHERE title LIKE '${TAG}%'`).run();
  sqlite.close();
});

function seedGapItem(overrides: Record<string, any> = {}) {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO gap_analysis_reports (
      title, standard_id, standard, clause_id, requirement, current_state, desired_state,
      gap_description, severity, impact, remediation, effort, priority_order, owner, target_date,
      evaluation_date, evaluated_by, findings, risk_level, status, action_items,
      compliance_rate, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.title ?? `${TAG}-item`,
    overrides.standard_id ?? 'iso-45001',
    overrides.standard ?? 'ISO45001',
    overrides.clause_id ?? '4.2',
    overrides.requirement ?? 'Document management system required',
    overrides.current_state ?? 'Partially implemented',
    overrides.desired_state ?? 'Fully compliant',
    overrides.gap_description ?? 'Missing document version control',
    overrides.severity ?? 'major',
    overrides.impact ?? 'High risk of non-conformity',
    overrides.remediation ?? 'Implement document control procedure',
    overrides.effort ?? 'medium',
    overrides.priority_order ?? 2,
    overrides.owner ?? 'Jane Smith',
    overrides.target_date ?? '2026-06-30',
    overrides.evaluation_date ?? '2026-01-15',
    overrides.evaluated_by ?? 'John Doe',
    overrides.findings ? JSON.stringify(overrides.findings) : null,
    overrides.risk_level ?? 'high',
    overrides.status ?? 'draft',
    overrides.action_items ? JSON.stringify(overrides.action_items) : null,
    overrides.compliance_rate ?? 65.0,
    overrides.notes ?? 'Requires urgent attention',
    overrides.created_at ?? ts,
    overrides.updated_at ?? ts,
  );
  return result.lastInsertRowid as number;
}

// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/compliance/gap-analysis/stats', () => {
  let app: Hono;
  let seedId: number;

  beforeAll(() => {
    app = createTestApp();
    seedId = seedGapItem({ title: `${TAG}-stats-item`, status: 'draft' });
  });

  it('returns 200 with success envelope', async () => {
    const { status, body } = await req(app, 'GET', '/api/compliance/gap-analysis/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns aggregate sections', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/gap-analysis/stats');
    expect(typeof body.data.total).toBe('number');
    expect(Array.isArray(body.data.byStatus)).toBe(true);
    expect(Array.isArray(body.data.byStandard)).toBe(true);
    expect(typeof body.data.avgComplianceRate).toBe('number');
  });

  it('total reflects seeded data', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/gap-analysis/stats');
    expect(body.data.total).toBeGreaterThanOrEqual(1);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/compliance/gap-analysis', () => {
  let app: Hono;
  let criticalId: number;
  let resolvedId: number;
  let iso14Id: number;

  beforeAll(() => {
    app = createTestApp();
    criticalId = seedGapItem({
      title: `${TAG}-critical`,
      severity: 'critical',
      risk_level: 'critical',
      status: 'draft',
      standard: 'ISO45001',
      standard_id: 'iso-45001',
    });
    resolvedId = seedGapItem({
      title: `${TAG}-resolved`,
      severity: 'minor',
      status: 'completed',
      standard: 'ISO14001',
      standard_id: 'iso-14001',
    });
    iso14Id = seedGapItem({
      title: `${TAG}-iso14`,
      standard: 'ISO14001',
      standard_id: 'iso-14001',
      status: 'in-progress',
    });
  });

  it('returns 200 with data array', async () => {
    const { status, body } = await req(app, 'GET', '/api/compliance/gap-analysis');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('total matches data length', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/gap-analysis');
    expect(body.total).toBe(body.data.length);
  });

  it('maps draft status to open', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/gap-analysis');
    const item = body.data.find((g: any) => g.id === criticalId);
    expect(item).toBeDefined();
    expect(item.status).toBe('open');
  });

  it('maps completed status to resolved', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/gap-analysis');
    const item = body.data.find((g: any) => g.id === resolvedId);
    expect(item).toBeDefined();
    expect(item.status).toBe('resolved');
  });

  it('maps in-progress status to in_progress', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/gap-analysis');
    const item = body.data.find((g: any) => g.id === iso14Id);
    expect(item).toBeDefined();
    expect(item.status).toBe('in_progress');
  });

  it('returns expected frontend fields', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/gap-analysis');
    const item = body.data.find((g: any) => g.id === criticalId);
    expect(item).toHaveProperty('standardId');
    expect(item).toHaveProperty('clauseId');
    expect(item).toHaveProperty('clauseTitle');
    expect(item).toHaveProperty('requirement');
    expect(item).toHaveProperty('currentState');
    expect(item).toHaveProperty('desiredState');
    expect(item).toHaveProperty('gap');
    expect(item).toHaveProperty('severity');
    expect(item).toHaveProperty('effort');
    expect(item).toHaveProperty('priority');
    expect(item).toHaveProperty('targetDate');
    expect(item).toHaveProperty('owner');
  });

  it('severity is passed through correctly', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/gap-analysis');
    const item = body.data.find((g: any) => g.id === criticalId);
    expect(item.severity).toBe('critical');
  });

  it('standardId is mapped from standard column', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/gap-analysis');
    const item = body.data.find((g: any) => g.id === iso14Id);
    expect(item.standardId).toBe('iso-14001');
  });

  it('filters by status=completed (DB value)', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/gap-analysis?status=completed');
    const allReturned = body.data.every((g: any) => g.status === 'resolved');
    expect(allReturned).toBe(true);
  });

  it('filters by standard', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/gap-analysis?standard=ISO14001');
    const ids = body.data.map((g: any) => g.id);
    expect(ids).toContain(resolvedId);
    expect(ids).toContain(iso14Id);
  });

  it('orders by created_at DESC (newest first)', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/gap-analysis');
    const tagItems = body.data.filter((g: any) =>
      typeof g.clauseTitle === 'string' && g.clauseTitle.startsWith(TAG)
    );
    if (tagItems.length >= 2) {
      expect(tagItems[0].createdAt).toBeGreaterThanOrEqual(tagItems[tagItems.length - 1].createdAt);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('POST /api/compliance/gap-analysis', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('creates a gap item and returns 201', async () => {
    const { status, body } = await req(app, 'POST', '/api/compliance/gap-analysis', {
      title: `${TAG}-post-basic`,
      standard: 'ISO45001',
      standardId: 'iso-45001',
      clauseId: '6.1.2',
      requirement: 'Hazard identification process required',
      currentState: 'Ad-hoc process only',
      desiredState: 'Systematic hazard register',
      gapDescription: 'No formal hazard identification procedure',
      severity: 'major',
      impact: 'Potential for unreported hazards',
      remediation: 'Develop hazard identification procedure',
      effort: 'high',
      priorityOrder: 1,
      owner: 'EHS Manager',
      targetDate: '2026-09-30',
      status: 'open',
      riskLevel: 'high',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeGreaterThan(0);
    expect(body.data.clauseTitle).toBe(`${TAG}-post-basic`);
    expect(body.data.severity).toBe('major');
    expect(body.data.status).toBe('open');
    expect(body.data.clauseId).toBe('6.1.2');
    expect(body.data.effort).toBe('high');
    expect(body.data.priority).toBe(1);
    sqlite.prepare("DELETE FROM gap_analysis_reports WHERE id = ?").run(body.data.id);
  });

  it('normalizes open status into DB as draft', async () => {
    const { body } = await req(app, 'POST', '/api/compliance/gap-analysis', {
      title: `${TAG}-post-status`,
      status: 'open',
    });
    expect(body.data.status).toBe('open');
    const raw = sqlite.prepare('SELECT status FROM gap_analysis_reports WHERE id = ?').get(body.data.id) as any;
    expect(raw.status).toBe('draft');
    sqlite.prepare("DELETE FROM gap_analysis_reports WHERE id = ?").run(body.data.id);
  });

  it('normalizes in_progress status into DB as in-progress', async () => {
    const { body } = await req(app, 'POST', '/api/compliance/gap-analysis', {
      title: `${TAG}-post-inprogress`,
      status: 'in_progress',
    });
    expect(body.data.status).toBe('in_progress');
    const raw = sqlite.prepare('SELECT status FROM gap_analysis_reports WHERE id = ?').get(body.data.id) as any;
    expect(raw.status).toBe('in-progress');
    sqlite.prepare("DELETE FROM gap_analysis_reports WHERE id = ?").run(body.data.id);
  });

  it('returns 400 for missing title', async () => {
    const { status, body } = await req(app, 'POST', '/api/compliance/gap-analysis', {
      standard: 'ISO45001',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid severity', async () => {
    const { status, body } = await req(app, 'POST', '/api/compliance/gap-analysis', {
      title: `${TAG}-bad-severity`,
      severity: 'blocker',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('stores and parses findings as JSON array', async () => {
    const { body } = await req(app, 'POST', '/api/compliance/gap-analysis', {
      title: `${TAG}-post-findings`,
      findings: [{ id: 1, description: 'Finding A' }],
    });
    expect(Array.isArray(body.data.findings)).toBe(true);
    expect(body.data.findings[0].description).toBe('Finding A');
    sqlite.prepare("DELETE FROM gap_analysis_reports WHERE id = ?").run(body.data.id);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/compliance/gap-analysis/:id', () => {
  let app: Hono;
  let itemId: number;

  beforeAll(() => {
    app = createTestApp();
    itemId = seedGapItem({
      title: `${TAG}-get-by-id`,
      severity: 'observation',
      effort: 'low',
      priority_order: 4,
    });
  });

  it('returns mapped item by id', async () => {
    const { status, body } = await req(app, 'GET', `/api/compliance/gap-analysis/${itemId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(itemId);
    expect(body.data.severity).toBe('observation');
    expect(body.data.effort).toBe('low');
    expect(body.data.priority).toBe(4);
    expect(body.data.clauseTitle).toBe(`${TAG}-get-by-id`);
    expect(body.data.standardId).toBe('iso-45001');
  });

  it('returns 404 for non-existent id', async () => {
    const { status, body } = await req(app, 'GET', '/api/compliance/gap-analysis/999999999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('PUT /api/compliance/gap-analysis/:id', () => {
  let app: Hono;
  let itemId: number;

  beforeAll(() => {
    app = createTestApp();
    itemId = seedGapItem({
      title: `${TAG}-put-item`,
      status: 'draft',
      severity: 'minor',
    });
  });

  it('updates allowed fields and returns mapped item', async () => {
    const { status, body } = await req(app, 'PUT', `/api/compliance/gap-analysis/${itemId}`, {
      severity: 'critical',
      effort: 'high',
      owner: 'Updated Owner',
      remediation: 'Updated remediation plan',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.severity).toBe('critical');
    expect(body.data.effort).toBe('high');
    expect(body.data.owner).toBe('Updated Owner');
    expect(body.data.remediation).toBe('Updated remediation plan');
  });

  it('normalizes status open→draft in DB on update', async () => {
    const { body } = await req(app, 'PUT', `/api/compliance/gap-analysis/${itemId}`, {
      status: 'in_progress',
    });
    expect(body.data.status).toBe('in_progress');
    const raw = sqlite.prepare('SELECT status FROM gap_analysis_reports WHERE id = ?').get(itemId) as any;
    expect(raw.status).toBe('in-progress');
  });

  it('normalizes resolved→completed in DB', async () => {
    const { body } = await req(app, 'PUT', `/api/compliance/gap-analysis/${itemId}`, {
      status: 'resolved',
    });
    expect(body.data.status).toBe('resolved');
    const raw = sqlite.prepare('SELECT status FROM gap_analysis_reports WHERE id = ?').get(itemId) as any;
    expect(raw.status).toBe('completed');
  });

  it('normalizes accepted_risk→accepted-risk in DB', async () => {
    const { body } = await req(app, 'PUT', `/api/compliance/gap-analysis/${itemId}`, {
      status: 'accepted_risk',
    });
    expect(body.data.status).toBe('accepted_risk');
    const raw = sqlite.prepare('SELECT status FROM gap_analysis_reports WHERE id = ?').get(itemId) as any;
    expect(raw.status).toBe('accepted-risk');
  });

  it('returns 400 when no valid fields provided', async () => {
    const { status, body } = await req(app, 'PUT', `/api/compliance/gap-analysis/${itemId}`, {
      unknownField: 'value',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 404 for non-existent id', async () => {
    const { status, body } = await req(app, 'PUT', '/api/compliance/gap-analysis/999999999', {
      severity: 'minor',
    });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/compliance/gap-analysis/:id', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('deletes existing item and returns 200', async () => {
    const idToDelete = seedGapItem({ title: `${TAG}-del-target` });
    const { status, body } = await req(app, 'DELETE', `/api/compliance/gap-analysis/${idToDelete}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('deleted');
  });

  it('returns 404 after item is deleted', async () => {
    const idToDelete = seedGapItem({ title: `${TAG}-del-confirm` });
    await req(app, 'DELETE', `/api/compliance/gap-analysis/${idToDelete}`);
    const { status, body } = await req(app, 'GET', `/api/compliance/gap-analysis/${idToDelete}`);
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 404 for non-existent id', async () => {
    const { status, body } = await req(app, 'DELETE', '/api/compliance/gap-analysis/999999999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});
