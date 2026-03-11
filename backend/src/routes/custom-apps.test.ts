/**
 * Custom App Builder Routes Test Suite
 *
 * Covers:
 *   POST   /api/custom-apps/generate               — AI keyword generation
 *   GET    /api/custom-apps/stats                  — aggregate counts
 *   GET    /api/custom-apps                        — list with filters
 *   POST   /api/custom-apps                        — create
 *   GET    /api/custom-apps/:id                    — get by id
 *   PUT    /api/custom-apps/:id                    — partial update
 *   POST   /api/custom-apps/:id/deploy             — deploy
 *   DELETE /api/custom-apps/:id                    — delete
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { customAppsRoutes } from '../routes/custom-apps';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  customAppsRoutes(app);
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
const TAG = `testca-${Date.now()}`;

afterAll(() => {
  sqlite.prepare(`DELETE FROM custom_apps WHERE app_name LIKE '${TAG}%'`).run();
});

function seedApp(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO custom_apps (app_name, status, elements, device_preference, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    overrides.app_name         ?? `${TAG}-App`,
    overrides.status           ?? 'draft',
    overrides.elements         ?? '[]',
    overrides.device_preference ?? 'mobile',
    overrides.created_at       ?? ts,
    overrides.updated_at       ?? ts,
  );
  return Number(result.lastInsertRowid);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Custom App Builder Routes', () => {
  let app: Hono;
  let draftId: number;
  let deployedId: number;
  let deleteId: number;

  beforeAll(() => {
    app = createTestApp();
    draftId = seedApp({ app_name: `${TAG}-Draft`, status: 'draft' });
    deployedId = seedApp({ app_name: `${TAG}-Deployed`, status: 'deployed' });
    deleteId = seedApp({ app_name: `${TAG}-ToDelete`, status: 'draft' });
  });

  // ── POST /api/custom-apps/generate ───────────────────────────────────────

  describe('POST /api/custom-apps/generate', () => {
    it('returns 400 when prompt is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-apps/generate', {});
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when prompt is empty string', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-apps/generate', { prompt: '   ' });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('generates checklist/camera/location elements for inspection prompt', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-apps/generate', { prompt: 'Forklift Daily Inspection Checklist' });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.elements.length).toBeGreaterThanOrEqual(4);
      const types = body.data.elements.map((e: any) => e.type);
      expect(types).toContain('checklist');
      expect(types).toContain('camera');
      expect(types).toContain('signature');
    });

    it('generates incident-specific elements for incident prompt', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-apps/generate', { prompt: 'Incident Report Form' });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      const types = body.data.elements.map((e: any) => e.type);
      expect(types).toContain('input');
      expect(types).toContain('camera');
      expect(types).toContain('signature');
    });

    it('generates default safety template for unknown prompt', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-apps/generate', { prompt: 'General Safety App' });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.appName).toBe('General Safety App');
      expect(Array.isArray(body.data.elements)).toBe(true);
      expect(body.data.elements.length).toBeGreaterThanOrEqual(3);
    });

    it('returns appName matching prompt', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-apps/generate', { prompt: 'Fire Evacuation Drill' });
      expect(status).toBe(200);
      expect(body.data.appName).toBe('Fire Evacuation Drill');
    });
  });

  // ── GET /api/custom-apps/stats ───────────────────────────────────────────

  describe('GET /api/custom-apps/stats', () => {
    it('returns stats with correct shape', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-apps/stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(typeof body.data.total).toBe('number');
      expect(typeof body.data.deployed).toBe('number');
      expect(typeof body.data.drafts).toBe('number');
      expect(typeof body.data.archived).toBe('number');
    });

    it('reflects seeded apps in counts', async () => {
      const { body } = await req(app, 'GET', '/api/custom-apps/stats');
      expect(body.data.total).toBeGreaterThanOrEqual(2);
      expect(body.data.deployed).toBeGreaterThanOrEqual(1);
      expect(body.data.drafts).toBeGreaterThanOrEqual(1);
    });
  });

  // ── GET /api/custom-apps ─────────────────────────────────────────────────

  describe('GET /api/custom-apps', () => {
    it('returns a list of apps', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-apps');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.total).toBeGreaterThanOrEqual(2);
    });

    it('filters by status=draft', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-apps?status=draft');
      expect(status).toBe(200);
      expect(body.data.every((a: any) => a.status === 'draft')).toBe(true);
    });

    it('filters by status=deployed', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-apps?status=deployed');
      expect(status).toBe(200);
      expect(body.data.every((a: any) => a.status === 'deployed')).toBe(true);
    });

    it('filters by search term', async () => {
      const { status, body } = await req(app, 'GET', `/api/custom-apps?search=${TAG}-Draft`);
      expect(status).toBe(200);
      expect(body.data.some((a: any) => a.appName.includes(`${TAG}-Draft`))).toBe(true);
    });

    it('returns elements as array', async () => {
      const { body } = await req(app, 'GET', '/api/custom-apps');
      for (const a of body.data) {
        expect(Array.isArray(a.elements)).toBe(true);
      }
    });
  });

  // ── POST /api/custom-apps ────────────────────────────────────────────────

  describe('POST /api/custom-apps', () => {
    it('creates a new app with valid data', async () => {
      const payload = {
        appName: `${TAG}-Created`,
        status: 'draft',
        elements: [{ id: 'e1', type: 'header', label: 'Header', props: { title: 'Test' } }],
        devicePreference: 'mobile',
      };
      const { status, body } = await req(app, 'POST', '/api/custom-apps', payload);
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.appName).toBe(`${TAG}-Created`);
      expect(body.data.id).toBeTruthy();
      expect(Array.isArray(body.data.elements)).toBe(true);
      expect(body.data.elements[0].type).toBe('header');
    });

    it('returns 400 when appName is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-apps', { status: 'draft' });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when appName is empty string', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-apps', { appName: '' });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('defaults status to draft when omitted', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-apps', { appName: `${TAG}-DefaultStatus` });
      expect(status).toBe(201);
      expect(body.data.status).toBe('draft');
    });
  });

  // ── GET /api/custom-apps/:id ─────────────────────────────────────────────

  describe('GET /api/custom-apps/:id', () => {
    it('returns an app by id', async () => {
      const { status, body } = await req(app, 'GET', `/api/custom-apps/${draftId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(draftId);
      expect(body.data.appName).toBe(`${TAG}-Draft`);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-apps/9999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid id', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-apps/not-a-number');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── PUT /api/custom-apps/:id ─────────────────────────────────────────────

  describe('PUT /api/custom-apps/:id', () => {
    it('updates appName', async () => {
      const newName = `${TAG}-Updated`;
      const { status, body } = await req(app, 'PUT', `/api/custom-apps/${draftId}`, { appName: newName });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.appName).toBe(newName);
    });

    it('updates status to archived', async () => {
      const { status, body } = await req(app, 'PUT', `/api/custom-apps/${draftId}`, { status: 'archived' });
      expect(status).toBe(200);
      expect(body.data.status).toBe('archived');
    });

    it('updates elements array', async () => {
      const newEls = [{ id: 'x1', type: 'checklist', label: 'CL', props: {} }];
      const { status, body } = await req(app, 'PUT', `/api/custom-apps/${draftId}`, { elements: newEls });
      expect(status).toBe(200);
      expect(body.data.elements[0].type).toBe('checklist');
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/custom-apps/9999999', { appName: 'x' });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid status value', async () => {
      const { status, body } = await req(app, 'PUT', `/api/custom-apps/${draftId}`, { status: 'invalid-status' });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── POST /api/custom-apps/:id/deploy ─────────────────────────────────────

  describe('POST /api/custom-apps/:id/deploy', () => {
    it('deploys a draft app successfully', async () => {
      const appToDeployId = seedApp({ app_name: `${TAG}-ToDeploy`, status: 'draft' });
      const { status, body } = await req(app, 'POST', `/api/custom-apps/${appToDeployId}/deploy`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('deployed');
    });

    it('sets deployedAt timestamp on deploy', async () => {
      const appId = seedApp({ app_name: `${TAG}-DeployTimestamp`, status: 'draft' });
      const { body } = await req(app, 'POST', `/api/custom-apps/${appId}/deploy`);
      expect(body.data.deployedAt).toBeTruthy();
      expect(typeof body.data.deployedAt).toBe('number');
    });

    it('redeploys an already-deployed app', async () => {
      const { status, body } = await req(app, 'POST', `/api/custom-apps/${deployedId}/deploy`);
      expect(status).toBe(200);
      expect(body.data.status).toBe('deployed');
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-apps/9999999/deploy');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── DELETE /api/custom-apps/:id ──────────────────────────────────────────

  describe('DELETE /api/custom-apps/:id', () => {
    it('deletes an existing app', async () => {
      const { status, body } = await req(app, 'DELETE', `/api/custom-apps/${deleteId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('confirms deletion with GET returning 404', async () => {
      const { status } = await req(app, 'GET', `/api/custom-apps/${deleteId}`);
      expect(status).toBe(404);
    });

    it('returns 404 for already-deleted or non-existent id', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/custom-apps/9999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid id', async () => {
      const { status } = await req(app, 'DELETE', '/api/custom-apps/abc');
      expect(status).toBe(400);
    });
  });
});
