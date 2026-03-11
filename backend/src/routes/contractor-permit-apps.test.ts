/**
 * Contractor Permit Applications Routes Test Suite
 *
 * Covers:
 *   GET    /api/permit-apps/stats
 *   GET    /api/permit-apps              — list with filters
 *   POST   /api/permit-apps              — create
 *   GET    /api/permit-apps/:id          — get by id
 *   PUT    /api/permit-apps/:id          — update
 *   DELETE /api/permit-apps/:id          — delete
 *   POST   /api/permit-apps/:id/approve  — approve
 *   POST   /api/permit-apps/:id/reject   — reject
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { contractorPermitAppsRoutes } from '../routes/contractor-permit-apps';

// ── App Factory ────────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  contractorPermitAppsRoutes(app);
  return app;
}

// ── Request Helper ─────────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── Seed / Cleanup ─────────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `testpermitapp-${Date.now()}`;

let seedSeq = 0;
function seedPermit(overrides: Record<string, unknown> = {}): number {
  const ts = Math.floor(Date.now() / 1000);
  const uniq = `${Date.now()}-${++seedSeq}`;
  const result = sqlite.prepare(`
    INSERT INTO permit_to_work
      (permit_number, permit_type, title, location, description, risk_level, status,
       contractor_name, workers_assigned, start_date, end_date, submitted_at,
       attachments, safety_checklist, special_conditions, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.permit_number   ?? `PTW-TEST-${uniq}`,
    overrides.permit_type     ?? 'hot_work',
    overrides.title           ?? `${TAG}-title`,
    overrides.location        ?? 'Building A',
    overrides.description     ?? `${TAG}-desc`,
    overrides.risk_level      ?? 'high',
    overrides.status          ?? 'submitted',
    overrides.contractor_name ?? `${TAG}-contractor`,
    overrides.workers_assigned ?? '["Alice","Bob"]',
    overrides.start_date      ?? '2026-03-01',
    overrides.end_date        ?? '2026-03-02',
    overrides.submitted_at    ?? new Date().toISOString(),
    overrides.attachments     ?? '[]',
    overrides.safety_checklist ?? '[]',
    overrides.special_conditions ?? '[]',
    overrides.created_at      ?? ts,
    overrides.updated_at      ?? ts,
  );
  return Number(result.lastInsertRowid);
}

let submittedId: number;
let reviewId: number;
let activeId: number;
let hotWorkId: number;

afterAll(() => {
  // Cleanup all ptw_approvals referencing permits we created, then the permits
  const ids = (sqlite.prepare(`SELECT id FROM permit_to_work WHERE description LIKE '${TAG}%'`).all() as any[]).map(r => r.id);
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    sqlite.prepare(`DELETE FROM ptw_approvals WHERE permit_id IN (${placeholders})`).run(...ids);
  }
  sqlite.prepare(`DELETE FROM permit_to_work WHERE description LIKE '${TAG}%'`).run();
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Contractor Permit Apps Routes', () => {
  let app: Hono;
  let createdId: number;

  beforeAll(() => {
    app = createTestApp();
    submittedId = seedPermit({ description: `${TAG}-submitted`, status: 'submitted', permit_type: 'hot_work' });
    reviewId    = seedPermit({ description: `${TAG}-review`,    status: 'under_review', permit_type: 'confined_space' });
    activeId    = seedPermit({ description: `${TAG}-active`,    status: 'active',       permit_type: 'working_at_height' });
    hotWorkId   = seedPermit({ description: `${TAG}-hotwork`,   status: 'draft',        permit_type: 'hot_work' });
  });

  // ── GET /api/permit-apps/stats ─────────────────────────────────────────────

  describe('GET /api/permit-apps/stats', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/permit-apps/stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns numeric total', async () => {
      const { body } = await req(app, 'GET', '/api/permit-apps/stats');
      expect(typeof body.data.total).toBe('number');
      expect(body.data.total).toBeGreaterThanOrEqual(4);
    });

    it('returns all stat fields', async () => {
      const { body } = await req(app, 'GET', '/api/permit-apps/stats');
      const d = body.data;
      expect(typeof d.active).toBe('number');
      expect(typeof d.pending).toBe('number');
      expect(typeof d.rejected).toBe('number');
      expect(typeof d.completed).toBe('number');
      expect(typeof d.draft).toBe('number');
      expect(typeof d.totalContractors).toBe('number');
      expect(typeof d.activeContractors).toBe('number');
    });
  });

  // ── GET /api/permit-apps ───────────────────────────────────────────────────

  describe('GET /api/permit-apps', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/permit-apps');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns data array', async () => {
      const { body } = await req(app, 'GET', '/api/permit-apps');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('contains seeded submitted permit', async () => {
      const { body } = await req(app, 'GET', '/api/permit-apps');
      const found = body.data.find((p: any) => p.id === String(submittedId));
      expect(found).toBeDefined();
    });

    it('maps to camelCase PermitApplication shape', async () => {
      const { body } = await req(app, 'GET', '/api/permit-apps');
      const item = body.data.find((p: any) => p.id === String(submittedId));
      expect(item).toHaveProperty('permitNumber');
      expect(item).toHaveProperty('contractorName');
      expect(item).toHaveProperty('permitType');
      expect(item).toHaveProperty('workDescription');
      expect(item).toHaveProperty('riskLevel');
      expect(item).toHaveProperty('status');
      expect(item).toHaveProperty('approvalChain');
      expect(item).toHaveProperty('workersAssigned');
    });

    it('returns workersAssigned as array', async () => {
      const { body } = await req(app, 'GET', '/api/permit-apps');
      const item = body.data.find((p: any) => p.id === String(submittedId));
      expect(Array.isArray(item.workersAssigned)).toBe(true);
    });

    it('returns approvalChain as array', async () => {
      const { body } = await req(app, 'GET', '/api/permit-apps');
      const item = body.data.find((p: any) => p.id === String(submittedId));
      expect(Array.isArray(item.approvalChain)).toBe(true);
    });

    it('filters by status=active', async () => {
      const { body } = await req(app, 'GET', '/api/permit-apps?status=active');
      expect(body.data.every((p: any) => p.status === 'active')).toBe(true);
      const found = body.data.find((p: any) => p.id === String(activeId));
      expect(found).toBeDefined();
    });

    it('filters by type=hot_work', async () => {
      const { body } = await req(app, 'GET', '/api/permit-apps?type=hot_work');
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data.every((p: any) => p.permitType === 'hot_work')).toBe(true);
    });

    it('filters by search query', async () => {
      const { body } = await req(app, 'GET', `/api/permit-apps?search=${TAG}-submitted`);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── POST /api/permit-apps ──────────────────────────────────────────────────

  describe('POST /api/permit-apps', () => {
    it('creates a new permit and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/permit-apps', {
        workDescription: `${TAG}-new-permit`,
        location: 'Test Zone',
        permitType: 'electrical',
        riskLevel: 'high',
        contractorName: `${TAG}-co`,
        workersAssigned: ['Charlie', 'Dana'],
        startDate: '2026-04-01',
        endDate: '2026-04-02',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      createdId = Number(body.data.id);
      expect(createdId).toBeGreaterThan(0);
    });

    it('sets permitType correctly', async () => {
      const { body } = await req(app, 'GET', `/api/permit-apps/${createdId}`);
      expect(body.data.permitType).toBe('electrical');
    });

    it('returns 400 when workDescription missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/permit-apps', {
        location: 'Nowhere',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('auto-generates a permitNumber', async () => {
      const { body } = await req(app, 'GET', `/api/permit-apps/${createdId}`);
      expect(body.data.permitNumber).toMatch(/^PTW-\d{4}-\d{4}/);
    });
  });

  // ── GET /api/permit-apps/:id ───────────────────────────────────────────────

  describe('GET /api/permit-apps/:id', () => {
    it('returns 200 with correct data', async () => {
      const { status, body } = await req(app, 'GET', `/api/permit-apps/${submittedId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(String(submittedId));
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'GET', '/api/permit-apps/999999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── PUT /api/permit-apps/:id ───────────────────────────────────────────────

  describe('PUT /api/permit-apps/:id', () => {
    it('updates an existing permit', async () => {
      const { status, body } = await req(app, 'PUT', `/api/permit-apps/${submittedId}`, {
        location: 'Updated Zone B',
        riskLevel: 'critical',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.location).toBe('Updated Zone B');
      expect(body.data.riskLevel).toBe('critical');
    });

    it('preserves unchanged fields', async () => {
      const { body } = await req(app, 'GET', `/api/permit-apps/${submittedId}`);
      expect(body.data.permitType).toBe('hot_work');
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/permit-apps/999999999', {
        location: 'Ghost',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── POST /api/permit-apps/:id/approve ─────────────────────────────────────

  describe('POST /api/permit-apps/:id/approve', () => {
    it('approves a permit and returns updated data', async () => {
      const { status, body } = await req(app, 'POST', `/api/permit-apps/${reviewId}/approve`, {
        approverName: 'Jane Approver',
        approverRole: 'Safety Manager',
        comments: 'All checks passed',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('approved');
    });

    it('adds an approval record to approvalChain', async () => {
      const { body } = await req(app, 'GET', `/api/permit-apps/${reviewId}`);
      const approved = body.data.approvalChain.find((a: any) => a.status === 'approved');
      expect(approved).toBeDefined();
      expect(approved.approverName).toBe('Jane Approver');
    });

    it('returns 404 for non-existent id', async () => {
      const { status } = await req(app, 'POST', '/api/permit-apps/999999999/approve', {});
      expect(status).toBe(404);
    });
  });

  // ── POST /api/permit-apps/:id/reject ──────────────────────────────────────

  describe('POST /api/permit-apps/:id/reject', () => {
    it('rejects a permit and returns updated data', async () => {
      const { status, body } = await req(app, 'POST', `/api/permit-apps/${hotWorkId}/reject`, {
        approverName: 'Bob Reviewer',
        approverRole: 'Safety Officer',
        comments: 'Documentation incomplete',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('rejected');
    });

    it('adds a rejected record to approvalChain', async () => {
      const { body } = await req(app, 'GET', `/api/permit-apps/${hotWorkId}`);
      const rejected = body.data.approvalChain.find((a: any) => a.status === 'rejected');
      expect(rejected).toBeDefined();
      expect(rejected.comments).toBe('Documentation incomplete');
    });

    it('returns 404 for non-existent id', async () => {
      const { status } = await req(app, 'POST', '/api/permit-apps/999999999/reject', {});
      expect(status).toBe(404);
    });
  });

  // ── DELETE /api/permit-apps/:id ────────────────────────────────────────────

  describe('DELETE /api/permit-apps/:id', () => {
    it('deletes existing permit and returns 200', async () => {
      const { status, body } = await req(app, 'DELETE', `/api/permit-apps/${createdId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      // mark as cleaned up
      createdId = 0;
    });

    it('deleted permit is no longer retrievable (404)', async () => {
      // Use a freshly seeded permit so we can delete it cleanly
      const tmpId = seedPermit({ description: `${TAG}-todelete` });
      await req(app, 'DELETE', `/api/permit-apps/${tmpId}`);
      const { status } = await req(app, 'GET', `/api/permit-apps/${tmpId}`);
      expect(status).toBe(404);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/permit-apps/999999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });
});
