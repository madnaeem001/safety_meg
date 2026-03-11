/**
 * Custom Report Builder Routes Test Suite
 *
 * Covers:
 *   GET    /api/custom-reports/stats               — aggregate counts
 *   GET    /api/custom-reports                     — list with filters
 *   POST   /api/custom-reports                     — create
 *   GET    /api/custom-reports/:id                 — get by id
 *   PUT    /api/custom-reports/:id                 — partial update
 *   POST   /api/custom-reports/:id/publish         — publish
 *   DELETE /api/custom-reports/:id                 — delete
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { customReportsRoutes } from '../routes/custom-reports';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  customReportsRoutes(app);
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

// ── DB Seed / Cleanup ──────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `testcr-${Date.now()}`;

afterAll(() => {
  sqlite.prepare(`DELETE FROM custom_reports WHERE report_name LIKE '${TAG}%'`).run();
});

function seedReport(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO custom_reports (report_name, status, elements, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    overrides.report_name ?? `${TAG}-Report`,
    overrides.status      ?? 'draft',
    overrides.elements    ?? '[]',
    overrides.created_at  ?? ts,
    overrides.updated_at  ?? ts,
  );
  return Number(result.lastInsertRowid);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Custom Report Builder Routes', () => {
  let app: Hono;
  let draftId: number;
  let publishedId: number;
  let deleteId: number;

  beforeAll(() => {
    app = createTestApp();
    draftId = seedReport({ report_name: `${TAG}-Draft`, status: 'draft' });
    publishedId = seedReport({ report_name: `${TAG}-Published`, status: 'published' });
    deleteId = seedReport({ report_name: `${TAG}-ToDelete`, status: 'draft' });
  });

  // ── GET /api/custom-reports/stats ─────────────────────────────────────────

  describe('GET /api/custom-reports/stats', () => {
    it('returns stats with correct shape', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-reports/stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(typeof body.data.total).toBe('number');
      expect(typeof body.data.drafts).toBe('number');
      expect(typeof body.data.published).toBe('number');
      expect(typeof body.data.archived).toBe('number');
    });

    it('reflects seeded reports in counts', async () => {
      const { body } = await req(app, 'GET', '/api/custom-reports/stats');
      expect(body.data.total).toBeGreaterThanOrEqual(2);
      expect(body.data.drafts).toBeGreaterThanOrEqual(1);
      expect(body.data.published).toBeGreaterThanOrEqual(1);
    });
  });

  // ── GET /api/custom-reports ───────────────────────────────────────────────

  describe('GET /api/custom-reports', () => {
    it('returns list of reports', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-reports');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.total).toBeGreaterThanOrEqual(2);
    });

    it('filters by status=draft', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-reports?status=draft');
      expect(status).toBe(200);
      expect(body.data.every((r: any) => r.status === 'draft')).toBe(true);
    });

    it('filters by status=published', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-reports?status=published');
      expect(status).toBe(200);
      expect(body.data.every((r: any) => r.status === 'published')).toBe(true);
    });

    it('filters by search term', async () => {
      const { status, body } = await req(app, 'GET', `/api/custom-reports?search=${TAG}-Draft`);
      expect(status).toBe(200);
      expect(body.data.some((r: any) => r.reportName.includes(`${TAG}-Draft`))).toBe(true);
    });

    it('returns elements as array', async () => {
      const { body } = await req(app, 'GET', '/api/custom-reports');
      for (const r of body.data) {
        expect(Array.isArray(r.elements)).toBe(true);
      }
    });
  });

  // ── POST /api/custom-reports ──────────────────────────────────────────────

  describe('POST /api/custom-reports', () => {
    it('creates a report with valid data', async () => {
      const payload = {
        reportName: `${TAG}-Created`,
        status: 'draft',
        elements: [
          { id: 'e1', type: 'header', label: 'Section Header', required: false },
          { id: 'e2', type: 'text', label: 'Notes', required: true },
        ],
      };
      const { status, body } = await req(app, 'POST', '/api/custom-reports', payload);
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.reportName).toBe(`${TAG}-Created`);
      expect(body.data.id).toBeTruthy();
      expect(Array.isArray(body.data.elements)).toBe(true);
      expect(body.data.elements).toHaveLength(2);
    });

    it('returns 400 when reportName is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-reports', { status: 'draft' });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when reportName is empty string', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-reports', { reportName: '' });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('defaults status to draft when omitted', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-reports', { reportName: `${TAG}-DefaultStatus` });
      expect(status).toBe(201);
      expect(body.data.status).toBe('draft');
    });

    it('returns 400 for invalid element type', async () => {
      const payload = {
        reportName: `${TAG}-BadElement`,
        elements: [{ id: 'x', type: 'invalid-type', label: 'Bad', required: false }],
      };
      const { status, body } = await req(app, 'POST', '/api/custom-reports', payload);
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/custom-reports/:id ───────────────────────────────────────────

  describe('GET /api/custom-reports/:id', () => {
    it('returns a report by id', async () => {
      const { status, body } = await req(app, 'GET', `/api/custom-reports/${draftId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(draftId);
      expect(body.data.reportName).toBe(`${TAG}-Draft`);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-reports/9999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid id', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-reports/not-a-number');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── PUT /api/custom-reports/:id ───────────────────────────────────────────

  describe('PUT /api/custom-reports/:id', () => {
    it('updates reportName', async () => {
      const newName = `${TAG}-Updated`;
      const { status, body } = await req(app, 'PUT', `/api/custom-reports/${draftId}`, { reportName: newName });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.reportName).toBe(newName);
    });

    it('updates status to archived', async () => {
      const { status, body } = await req(app, 'PUT', `/api/custom-reports/${draftId}`, { status: 'archived' });
      expect(status).toBe(200);
      expect(body.data.status).toBe('archived');
    });

    it('updates elements array', async () => {
      const newEls = [{ id: 'u1', type: 'checkbox', label: 'Completed', required: true }];
      const { status, body } = await req(app, 'PUT', `/api/custom-reports/${draftId}`, { elements: newEls });
      expect(status).toBe(200);
      expect(body.data.elements[0].type).toBe('checkbox');
      expect(body.data.elements[0].required).toBe(true);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/custom-reports/9999999', { reportName: 'x' });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid status value', async () => {
      const { status, body } = await req(app, 'PUT', `/api/custom-reports/${publishedId}`, { status: 'bad-status' });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── POST /api/custom-reports/:id/publish ──────────────────────────────────

  describe('POST /api/custom-reports/:id/publish', () => {
    it('publishes a draft report successfully', async () => {
      const toPublish = seedReport({ report_name: `${TAG}-ToPublish`, status: 'draft' });
      const { status, body } = await req(app, 'POST', `/api/custom-reports/${toPublish}/publish`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('published');
    });

    it('re-publishes an already-published report', async () => {
      const { status, body } = await req(app, 'POST', `/api/custom-reports/${publishedId}/publish`);
      expect(status).toBe(200);
      expect(body.data.status).toBe('published');
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-reports/9999999/publish');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── DELETE /api/custom-reports/:id ────────────────────────────────────────

  describe('DELETE /api/custom-reports/:id', () => {
    it('deletes an existing report', async () => {
      const { status, body } = await req(app, 'DELETE', `/api/custom-reports/${deleteId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('confirms deletion — GET returns 404', async () => {
      const { status } = await req(app, 'GET', `/api/custom-reports/${deleteId}`);
      expect(status).toBe(404);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/custom-reports/9999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid id', async () => {
      const { status } = await req(app, 'DELETE', '/api/custom-reports/abc');
      expect(status).toBe(400);
    });
  });
});
