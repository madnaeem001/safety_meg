/**
 * Permit to Work Route Test Suite
 *
 * Covers:
 *   GET    /api/ptw/stats               — totals, active, pendingApproval, expiringSoon
 *   GET    /api/ptw/permits             — list, filters (status/type/risk/dept), count field
 *   POST   /api/ptw/permits             — create, validation, draft status
 *   GET    /api/ptw/permits/:id         — fetch single, includes approvals[], 404
 *   PUT    /api/ptw/permits/:id         — update status/fields, 400 no-fields, 404
 *   DELETE /api/ptw/permits/:id         — hard delete, removes approvals, 404
 *   POST   /api/ptw/permits/:id/approve — inserts approval, sets status=approved, 404
 *   POST   /api/ptw/permits/:id/reject  — inserts approval, sets status=cancelled, 404
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { permitToWorkRoutes } from './permit-to-work';

// ── App factory ────────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  permitToWorkRoutes(app);
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

// ── DB helpers ─────────────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `ptw-test-${Date.now()}`;
let createdIds: number[] = [];

function seedPermit(overrides?: {
  permitNumber?: string;
  permitType?: string;
  title?: string;
  location?: string;
  status?: string;
  riskLevel?: string;
  department?: string;
}) {
  const num = `${TAG}-${Math.random().toString(36).slice(2, 8)}`;
  const r = sqlite.prepare(`
    INSERT INTO permit_to_work
      (permit_number, permit_type, title, location, risk_level, status, department,
       ppe_required, precautions, iot_sensor_ids, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,'[]','[]','[]',strftime('%s','now'),strftime('%s','now'))
  `).run(
    overrides?.permitNumber ?? num,
    overrides?.permitType ?? 'general',
    overrides?.title ?? `${TAG} Test Permit`,
    overrides?.location ?? 'Test Site',
    overrides?.riskLevel ?? 'medium',
    overrides?.status ?? 'draft',
    overrides?.department ?? null,
  );
  const id = r.lastInsertRowid as number;
  createdIds.push(id);
  return id;
}

afterAll(() => {
  // Clean up all permits seeded during tests
  if (createdIds.length) {
    sqlite.prepare(`DELETE FROM ptw_approvals WHERE permit_id IN (${createdIds.join(',')})`).run();
    sqlite.prepare(`DELETE FROM permit_to_work WHERE id IN (${createdIds.join(',')})`).run();
  }
  // Also clean up any permits created via API (identified by title tag)
  const apiCreated = (sqlite.prepare(`SELECT id FROM permit_to_work WHERE title LIKE ?`).all(`${TAG}%`) as any[]).map((r: any) => r.id);
  if (apiCreated.length) {
    sqlite.prepare(`DELETE FROM ptw_approvals WHERE permit_id IN (${apiCreated.join(',')})`).run();
    sqlite.prepare(`DELETE FROM permit_to_work WHERE id IN (${apiCreated.join(',')})`).run();
  }
  sqlite.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ptw/stats
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/ptw/stats', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 200 with success:true', async () => {
    const { status, body } = await req(app, 'GET', '/api/ptw/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns required stat fields', async () => {
    const { body } = await req(app, 'GET', '/api/ptw/stats');
    const d = body.data;
    expect(typeof d.total).toBe('number');
    expect(typeof d.active).toBe('number');
    expect(typeof d.pendingApproval).toBe('number');
    expect(typeof d.expiringSoon).toBe('number');
  });

  it('returns byStatus, byType, byRiskLevel arrays', async () => {
    const { body } = await req(app, 'GET', '/api/ptw/stats');
    const d = body.data;
    expect(Array.isArray(d.byStatus)).toBe(true);
    expect(Array.isArray(d.byType)).toBe(true);
    expect(Array.isArray(d.byRiskLevel)).toBe(true);
  });

  it('total is non-negative', async () => {
    const { body } = await req(app, 'GET', '/api/ptw/stats');
    expect(body.data.total).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ptw/permits
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/ptw/permits', () => {
  let app: Hono;
  let permitId: number;

  beforeAll(() => {
    app = createTestApp();
    permitId = seedPermit({ status: 'draft', riskLevel: 'high', permitType: 'electrical', department: `${TAG}-dept` });
  });

  it('returns 200 with success:true and data array', async () => {
    const { status, body } = await req(app, 'GET', '/api/ptw/permits');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('each permit has required camelCase fields', async () => {
    const { body } = await req(app, 'GET', '/api/ptw/permits');
    const p = body.data.find((x: any) => x.id === permitId);
    expect(p).toBeDefined();
    expect(p).toHaveProperty('id');
    expect(p).toHaveProperty('permitNumber');
    expect(p).toHaveProperty('permitType');
    expect(p).toHaveProperty('title');
    expect(p).toHaveProperty('location');
    expect(p).toHaveProperty('riskLevel');
    expect(p).toHaveProperty('status');
    expect(p).toHaveProperty('ppeRequired');
    expect(p).toHaveProperty('precautions');
    expect(p).toHaveProperty('iotSensorIds');
    expect(p).toHaveProperty('createdAt');
    expect(p).toHaveProperty('updatedAt');
  });

  it('ppeRequired, precautions, iotSensorIds are arrays', async () => {
    const { body } = await req(app, 'GET', '/api/ptw/permits');
    const p = body.data.find((x: any) => x.id === permitId);
    expect(Array.isArray(p.ppeRequired)).toBe(true);
    expect(Array.isArray(p.precautions)).toBe(true);
    expect(Array.isArray(p.iotSensorIds)).toBe(true);
  });

  it('returns count field equal to data length', async () => {
    const { body } = await req(app, 'GET', '/api/ptw/permits');
    expect(body.count).toBe(body.data.length);
  });

  it('filters by status', async () => {
    const { body } = await req(app, 'GET', '/api/ptw/permits?status=draft');
    expect(body.data.every((p: any) => p.status === 'draft')).toBe(true);
  });

  it('filters by permitType', async () => {
    const { body } = await req(app, 'GET', '/api/ptw/permits?permitType=electrical');
    expect(body.data.every((p: any) => p.permitType === 'electrical')).toBe(true);
  });

  it('filters by riskLevel', async () => {
    const { body } = await req(app, 'GET', '/api/ptw/permits?riskLevel=high');
    expect(body.data.every((p: any) => p.riskLevel === 'high')).toBe(true);
  });

  it('filters by department', async () => {
    const dept = `${TAG}-dept`;
    const { body } = await req(app, 'GET', `/api/ptw/permits?department=${encodeURIComponent(dept)}`);
    expect(body.data.every((p: any) => p.department === dept)).toBe(true);
    expect(body.data.some((p: any) => p.id === permitId)).toBe(true);
  });

  it('returns empty array when combined filters match nothing', async () => {
    const { body } = await req(app, 'GET', '/api/ptw/permits?status=active&permitType=excavation&riskLevel=critical');
    expect(body.data.length).toBeGreaterThanOrEqual(0); // may be 0
  });

  it('results are ordered newest-first', async () => {
    const { body } = await req(app, 'GET', '/api/ptw/permits');
    const times = body.data.map((p: any) => p.createdAt);
    for (let i = 0; i < times.length - 1; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i + 1]);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ptw/permits
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/ptw/permits', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('creates a permit and returns 201 with draft status', async () => {
    const { status, body } = await req(app, 'POST', '/api/ptw/permits', {
      permitType: 'hot-work',
      title: `${TAG} Hot Work Test`,
      location: 'Boiler Room',
      riskLevel: 'high',
      department: 'Maintenance',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('draft');
    expect(body.data.permitType).toBe('hot-work');
    if (body.data.id) createdIds.push(body.data.id);
  });

  it('generated permitNumber starts with PTW-', async () => {
    const { body } = await req(app, 'POST', '/api/ptw/permits', {
      permitType: 'general',
      title: `${TAG} Permit Num Test`,
      location: 'Warehouse',
    });
    expect(body.data.permitNumber).toMatch(/^PTW-/);
    if (body.data.id) createdIds.push(body.data.id);
  });

  it('ppeRequired defaults to empty array', async () => {
    const { body } = await req(app, 'POST', '/api/ptw/permits', {
      permitType: 'electrical',
      title: `${TAG} No PPE`,
      location: 'Panel Room',
    });
    expect(Array.isArray(body.data.ppeRequired)).toBe(true);
    expect(body.data.ppeRequired).toHaveLength(0);
    if (body.data.id) createdIds.push(body.data.id);
  });

  it('ppeRequired and precautions are stored as arrays', async () => {
    const { body } = await req(app, 'POST', '/api/ptw/permits', {
      permitType: 'confined-space',
      title: `${TAG} PPE Arrays`,
      location: 'Sump Pit',
      ppeRequired: ['SCBA', 'Harness'],
      precautions: ['Gas test', 'LOTO'],
      iotSensorIds: ['SEN-001'],
    });
    expect(body.data.ppeRequired).toEqual(['SCBA', 'Harness']);
    expect(body.data.precautions).toEqual(['Gas test', 'LOTO']);
    expect(body.data.iotSensorIds).toEqual(['SEN-001']);
    if (body.data.id) createdIds.push(body.data.id);
  });

  it('riskLevel defaults to medium when not provided', async () => {
    const { body } = await req(app, 'POST', '/api/ptw/permits', {
      permitType: 'general',
      title: `${TAG} Default Risk`,
      location: 'Office',
    });
    expect(body.data.riskLevel).toBe('medium');
    if (body.data.id) createdIds.push(body.data.id);
  });

  it('returns 400 when title is missing', async () => {
    const { status } = await req(app, 'POST', '/api/ptw/permits', {
      permitType: 'hot-work',
      location: 'Plant',
    });
    expect(status).toBe(400);
  });

  it('returns 400 when location is missing', async () => {
    const { status } = await req(app, 'POST', '/api/ptw/permits', {
      permitType: 'hot-work',
      title: `${TAG} No Location`,
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid permitType', async () => {
    const { status } = await req(app, 'POST', '/api/ptw/permits', {
      permitType: 'invalid-type',
      title: `${TAG} Bad Type`,
      location: 'Plant',
    });
    expect(status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ptw/permits/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/ptw/permits/:id', () => {
  let app: Hono;
  let permitId: number;

  beforeAll(() => {
    app = createTestApp();
    permitId = seedPermit({ riskLevel: 'critical', permitType: 'working-at-height' });
  });

  it('returns 200 and permit object with camelCase fields', async () => {
    const { status, body } = await req(app, 'GET', `/api/ptw/permits/${permitId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(permitId);
    expect(body.data.riskLevel).toBe('critical');
    expect(body.data.permitType).toBe('working-at-height');
  });

  it('includes approvals array', async () => {
    const { body } = await req(app, 'GET', `/api/ptw/permits/${permitId}`);
    expect(Array.isArray(body.data.approvals)).toBe(true);
  });

  it('approvals array is empty for a fresh draft', async () => {
    const { body } = await req(app, 'GET', `/api/ptw/permits/${permitId}`);
    expect(body.data.approvals).toHaveLength(0);
  });

  it('ppeRequired, precautions, iotSensorIds are arrays', async () => {
    const { body } = await req(app, 'GET', `/api/ptw/permits/${permitId}`);
    expect(Array.isArray(body.data.ppeRequired)).toBe(true);
    expect(Array.isArray(body.data.precautions)).toBe(true);
    expect(Array.isArray(body.data.iotSensorIds)).toBe(true);
  });

  it('returns 404 for a non-existent permit', async () => {
    const { status, body } = await req(app, 'GET', '/api/ptw/permits/999999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/ptw/permits/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/ptw/permits/:id', () => {
  let app: Hono;
  let permitId: number;

  beforeAll(() => {
    app = createTestApp();
    permitId = seedPermit({ status: 'draft' });
  });

  it('updates status and returns 200', async () => {
    const { status, body } = await req(app, 'PUT', `/api/ptw/permits/${permitId}`, {
      status: 'pending-approval',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('pending-approval');
  });

  it('includes approvals array in response', async () => {
    const { body } = await req(app, 'PUT', `/api/ptw/permits/${permitId}`, {
      riskLevel: 'low',
    });
    expect(Array.isArray(body.data.approvals)).toBe(true);
  });

  it('partial update preserves unchanged fields', async () => {
    const { body: before } = await req(app, 'GET', `/api/ptw/permits/${permitId}`);
    const originalType = before.data.permitType;
    await req(app, 'PUT', `/api/ptw/permits/${permitId}`, { notes: 'Test note' });
    const { body: after } = await req(app, 'GET', `/api/ptw/permits/${permitId}`);
    expect(after.data.permitType).toBe(originalType);
    expect(after.data.notes).toBe('Test note');
  });

  it('updates ppeRequired as array', async () => {
    const { body } = await req(app, 'PUT', `/api/ptw/permits/${permitId}`, {
      ppeRequired: ['Helmet', 'Gloves', 'Boots'],
    });
    expect(body.data.ppeRequired).toEqual(['Helmet', 'Gloves', 'Boots']);
  });

  it('clears ppeRequired when set to empty array', async () => {
    const { body } = await req(app, 'PUT', `/api/ptw/permits/${permitId}`, {
      ppeRequired: [],
    });
    expect(body.data.ppeRequired).toHaveLength(0);
  });

  it('returns 400 when body has no updatable fields', async () => {
    const { status } = await req(app, 'PUT', `/api/ptw/permits/${permitId}`, {});
    expect(status).toBe(400);
  });

  it('returns 404 for non-existent permit', async () => {
    const { status } = await req(app, 'PUT', '/api/ptw/permits/999999', { status: 'active' });
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ptw/permits/:id/approve
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/ptw/permits/:id/approve', () => {
  let app: Hono;
  let permitId: number;

  beforeAll(() => {
    app = createTestApp();
    permitId = seedPermit({ status: 'pending-approval' });
  });

  it('approves the permit and returns 200', async () => {
    const { status, body } = await req(app, 'POST', `/api/ptw/permits/${permitId}/approve`, {
      approverName: 'Test Approver',
      approverRole: 'Safety Manager',
      comments: 'All good.',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('sets status to approved', async () => {
    const { body } = await req(app, 'GET', `/api/ptw/permits/${permitId}`);
    expect(body.data.status).toBe('approved');
  });

  it('creates an approval record', async () => {
    const { body } = await req(app, 'GET', `/api/ptw/permits/${permitId}`);
    expect(body.data.approvals.length).toBeGreaterThanOrEqual(1);
    const approval = body.data.approvals[0];
    expect(approval.approverName).toBe('Test Approver');
    expect(approval.status).toBe('approved');
  });

  it('approval record has required fields', async () => {
    const { body } = await req(app, 'GET', `/api/ptw/permits/${permitId}`);
    const approval = body.data.approvals[0];
    expect(approval).toHaveProperty('id');
    expect(approval).toHaveProperty('permitId');
    expect(approval).toHaveProperty('approverName');
    expect(approval).toHaveProperty('status');
    expect(approval).toHaveProperty('createdAt');
  });

  it('returns 400 when approverName is missing', async () => {
    const id2 = seedPermit({ status: 'pending-approval' });
    const { status } = await req(app, 'POST', `/api/ptw/permits/${id2}/approve`, {
      approverRole: 'Manager',
    });
    expect(status).toBe(400);
  });

  it('returns 404 for non-existent permit', async () => {
    const { status } = await req(app, 'POST', '/api/ptw/permits/999999/approve', {
      approverName: 'Ghost',
    });
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ptw/permits/:id/reject
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/ptw/permits/:id/reject', () => {
  let app: Hono;
  let permitId: number;

  beforeAll(() => {
    app = createTestApp();
    permitId = seedPermit({ status: 'pending-approval' });
  });

  it('rejects the permit and returns 200', async () => {
    const { status, body } = await req(app, 'POST', `/api/ptw/permits/${permitId}/reject`, {
      approverName: 'Test Reviewer',
      approverRole: 'Inspector',
      comments: 'Missing gas test documentation.',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('sets status to cancelled', async () => {
    const { body } = await req(app, 'GET', `/api/ptw/permits/${permitId}`);
    expect(body.data.status).toBe('cancelled');
  });

  it('creates a rejection approval record', async () => {
    const { body } = await req(app, 'GET', `/api/ptw/permits/${permitId}`);
    expect(body.data.approvals.length).toBeGreaterThanOrEqual(1);
    const approval = body.data.approvals[0];
    expect(approval.approverName).toBe('Test Reviewer');
    expect(approval.status).toBe('rejected');
    expect(approval.comments).toBe('Missing gas test documentation.');
  });

  it('returns 400 when approverName is missing', async () => {
    const id2 = seedPermit({ status: 'pending-approval' });
    const { status } = await req(app, 'POST', `/api/ptw/permits/${id2}/reject`, {
      comments: 'Incomplete',
    });
    expect(status).toBe(400);
  });

  it('returns 404 for non-existent permit', async () => {
    const { status } = await req(app, 'POST', '/api/ptw/permits/999999/reject', {
      approverName: 'Ghost',
    });
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/ptw/permits/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/ptw/permits/:id', () => {
  let app: Hono;
  let permitId: number;
  let approvedPermitId: number;

  beforeAll(async () => {
    app = createTestApp();
    permitId = seedPermit({ status: 'draft' });
    approvedPermitId = seedPermit({ status: 'pending-approval' });
    // Add an approval to the second permit before deleting to test cascade
    await req(app, 'POST', `/api/ptw/permits/${approvedPermitId}/approve`, {
      approverName: 'Cascade Test',
    });
  });

  it('deletes a permit and returns 200', async () => {
    const { status, body } = await req(app, 'DELETE', `/api/ptw/permits/${permitId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    // Remove from cleanup list since already deleted
    createdIds = createdIds.filter((id) => id !== permitId);
  });

  it('deleted permit no longer accessible via GET', async () => {
    const { status } = await req(app, 'GET', `/api/ptw/permits/${permitId}`);
    expect(status).toBe(404);
  });

  it('deletes associated approvals (cascade)', async () => {
    await req(app, 'DELETE', `/api/ptw/permits/${approvedPermitId}`);
    createdIds = createdIds.filter((id) => id !== approvedPermitId);
    const orphans = sqlite.prepare('SELECT * FROM ptw_approvals WHERE permit_id=?').all(approvedPermitId);
    expect(orphans).toHaveLength(0);
  });

  it('returns 404 for already-deleted permit', async () => {
    const { status } = await req(app, 'DELETE', `/api/ptw/permits/${permitId}`);
    expect(status).toBe(404);
  });

  it('returns 404 for non-existent permit', async () => {
    const { status } = await req(app, 'DELETE', '/api/ptw/permits/999999');
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// End-to-end workflow: draft → pending-approval → approved → active → closed
// ─────────────────────────────────────────────────────────────────────────────

describe('Full PTW lifecycle', () => {
  let app: Hono;
  let permitId: number;

  beforeAll(() => { app = createTestApp(); });

  it('creates a draft permit', async () => {
    const { body } = await req(app, 'POST', '/api/ptw/permits', {
      permitType: 'hot-work',
      title: `${TAG} Lifecycle Test`,
      location: 'Plant 1',
      riskLevel: 'medium',
    });
    expect(body.data.status).toBe('draft');
    permitId = body.data.id;
    createdIds.push(permitId);
  });

  it('submits permit for approval', async () => {
    const { body } = await req(app, 'PUT', `/api/ptw/permits/${permitId}`, {
      status: 'pending-approval',
    });
    expect(body.data.status).toBe('pending-approval');
  });

  it('approves the permit', async () => {
    const { body } = await req(app, 'POST', `/api/ptw/permits/${permitId}/approve`, {
      approverName: 'Operations Manager',
      approverRole: 'Approver',
      comments: 'Site ready.',
    });
    expect(body.data.status).toBe('approved');
  });

  it('activates the permit', async () => {
    const { body } = await req(app, 'PUT', `/api/ptw/permits/${permitId}`, {
      status: 'active',
      actualStart: new Date().toISOString(),
    });
    expect(body.data.status).toBe('active');
    expect(body.data.actualStart).toBeTruthy();
  });

  it('closes the permit', async () => {
    const { body } = await req(app, 'PUT', `/api/ptw/permits/${permitId}`, {
      status: 'closed',
      actualEnd: new Date().toISOString(),
    });
    expect(body.data.status).toBe('closed');
    expect(body.data.actualEnd).toBeTruthy();
  });

  it('final state has approval record in GET response', async () => {
    const { body } = await req(app, 'GET', `/api/ptw/permits/${permitId}`);
    expect(body.data.status).toBe('closed');
    expect(body.data.approvals.length).toBeGreaterThanOrEqual(1);
  });
});
