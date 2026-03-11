/**
 * Custom Checklists Routes Test Suite
 *
 * Covers:
 *   GET    /api/custom-checklists          — list with filters
 *   POST   /api/custom-checklists          — create
 *   GET    /api/custom-checklists/:id      — get by id
 *   PUT    /api/custom-checklists/:id      — partial update
 *   DELETE /api/custom-checklists/:id      — delete
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { customChecklistsRoutes } from '../routes/custom-checklists';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  customChecklistsRoutes(app);
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
const TAG = `testcl-${Date.now()}`;

afterAll(() => {
  sqlite.prepare(`DELETE FROM custom_checklists WHERE name LIKE '${TAG}%'`).run();
});

const SAMPLE_ITEMS = JSON.stringify([
  { id: 'item-1', question: 'Is PPE worn?', category: 'Safety', required: true, helpText: '', regulatoryRef: 'OSHA 1926.102' },
  { id: 'item-2', question: 'Is area clean?', category: 'Housekeeping', required: false, helpText: '', regulatoryRef: '' },
]);

const SAMPLE_CATEGORIES = JSON.stringify(['Safety', 'Housekeeping']);

function seedChecklist(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO custom_checklists (name, description, industry, categories, items, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.name         ?? `${TAG}-checklist-1`,
    overrides.description  ?? 'A test checklist',
    overrides.industry     ?? 'Manufacturing',
    overrides.categories   ?? SAMPLE_CATEGORIES,
    overrides.items        ?? SAMPLE_ITEMS,
    overrides.created_at   ?? ts,
    overrides.updated_at   ?? ts,
  );
  return Number(result.lastInsertRowid);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Custom Checklists Routes', () => {
  let app: Hono;
  let checklistId: number;
  let constructionId: number;
  let healthcareId: number;

  beforeAll(() => {
    app = createTestApp();
    checklistId   = seedChecklist({ name: `${TAG}-manufacturing`, industry: 'Manufacturing' });
    constructionId = seedChecklist({ name: `${TAG}-construction`, industry: 'Construction', description: 'Construction checklist' });
    healthcareId  = seedChecklist({ name: `${TAG}-healthcare`, industry: 'Healthcare', description: 'Safety audit for hospitals' });
  });

  // ── GET /api/custom-checklists ─────────────────────────────────────────

  describe('GET /api/custom-checklists', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-checklists');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns total matching array length', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists');
      expect(body.total).toBe(body.data.length);
    });

    it('contains seeded manufacturing checklist', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists');
      const found = body.data.find((c: any) => c.id === String(checklistId));
      expect(found).toBeDefined();
    });

    it('id is returned as a string', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists');
      const item = body.data.find((c: any) => c.id === String(checklistId));
      expect(typeof item.id).toBe('string');
    });

    it('maps DB columns to camelCase fields', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists');
      const item = body.data.find((c: any) => c.id === String(checklistId));
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('industry');
      expect(item).toHaveProperty('categories');
      expect(item).toHaveProperty('items');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
    });

    it('categories is a parsed array', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists');
      const item = body.data.find((c: any) => c.id === String(checklistId));
      expect(Array.isArray(item.categories)).toBe(true);
      expect(item.categories.length).toBeGreaterThanOrEqual(1);
    });

    it('items is a parsed array', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists');
      const item = body.data.find((c: any) => c.id === String(checklistId));
      expect(Array.isArray(item.items)).toBe(true);
    });

    it('item objects have correct shape', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists');
      const checklist = body.data.find((c: any) => c.id === String(checklistId));
      const item = checklist.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('question');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('required');
    });

    it('createdAt and updatedAt are numbers', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists');
      const item = body.data.find((c: any) => c.id === String(checklistId));
      expect(typeof item.createdAt).toBe('number');
      expect(typeof item.updatedAt).toBe('number');
    });

    it('filters by industry=Manufacturing', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists?industry=Manufacturing');
      const ids = body.data.map((c: any) => c.id);
      expect(ids).toContain(String(checklistId));
      expect(ids).not.toContain(String(constructionId));
    });

    it('filters by industry=Construction', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists?industry=Construction');
      const ids = body.data.map((c: any) => c.id);
      expect(ids).toContain(String(constructionId));
      expect(ids).not.toContain(String(checklistId));
    });

    it('filters by industry=Healthcare', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists?industry=Healthcare');
      const ids = body.data.map((c: any) => c.id);
      expect(ids).toContain(String(healthcareId));
    });

    it('search filter matches by name', async () => {
      const { body } = await req(app, 'GET', `/api/custom-checklists?search=${TAG}-construction`);
      const ids = body.data.map((c: any) => c.id);
      expect(ids).toContain(String(constructionId));
    });

    it('search filter matches by description', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists?search=hospitals');
      const ids = body.data.map((c: any) => c.id);
      expect(ids).toContain(String(healthcareId));
    });

    it('search returns empty when no match', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists?search=NORESULTXYZ999');
      expect(body.data.length).toBe(0);
    });

    it('results are ordered by updated_at DESC (newest first)', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists');
      const ts: number[] = body.data.map((c: any) => c.updatedAt);
      for (let i = 1; i < ts.length; i++) {
        expect(ts[i - 1]).toBeGreaterThanOrEqual(ts[i]);
      }
    });

    it('can combine industry and search filters', async () => {
      const { body } = await req(app, 'GET', '/api/custom-checklists?industry=Construction&search=Construction');
      const ids = body.data.map((c: any) => c.id);
      expect(ids).toContain(String(constructionId));
    });
  });

  // ── POST /api/custom-checklists ────────────────────────────────────────

  describe('POST /api/custom-checklists', () => {
    it('returns 201 on valid create', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-checklists', {
        name: `${TAG}-new-checklist`,
        description: 'New checklist description',
        industry: 'Mining',
        categories: ['Hazards', 'PPE'],
        items: [{ id: 'i-1', question: 'Check area?', category: 'Hazards', required: true, helpText: '' }],
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      // cleanup
      if (body.data?.id) {
        sqlite.prepare('DELETE FROM custom_checklists WHERE id = ?').run(Number(body.data.id));
      }
    });

    it('returns created record in response', async () => {
      const { body } = await req(app, 'POST', '/api/custom-checklists', {
        name: `${TAG}-response-check`,
        industry: 'Utilities',
        categories: ['Electrical'],
        items: [],
      });
      expect(body.data).toHaveProperty('id');
      expect(body.data.name).toBe(`${TAG}-response-check`);
      expect(body.data.industry).toBe('Utilities');
      if (body.data?.id) {
        sqlite.prepare('DELETE FROM custom_checklists WHERE id = ?').run(Number(body.data.id));
      }
    });

    it('persists categories as array in response', async () => {
      const { body } = await req(app, 'POST', '/api/custom-checklists', {
        name: `${TAG}-cats`,
        industry: 'Agriculture',
        categories: ['Pesticides', 'Machinery'],
        items: [],
      });
      expect(Array.isArray(body.data.categories)).toBe(true);
      expect(body.data.categories).toContain('Pesticides');
      if (body.data?.id) {
        sqlite.prepare('DELETE FROM custom_checklists WHERE id = ?').run(Number(body.data.id));
      }
    });

    it('persists items as array in response', async () => {
      const { body } = await req(app, 'POST', '/api/custom-checklists', {
        name: `${TAG}-items-check`,
        industry: 'Retail',
        categories: ['Store'],
        items: [{ id: 'i-x', question: 'Exit clear?', category: 'Store', required: false, helpText: '' }],
      });
      expect(Array.isArray(body.data.items)).toBe(true);
      expect(body.data.items[0].question).toBe('Exit clear?');
      if (body.data?.id) {
        sqlite.prepare('DELETE FROM custom_checklists WHERE id = ?').run(Number(body.data.id));
      }
    });

    it('id is returned as string after create', async () => {
      const { body } = await req(app, 'POST', '/api/custom-checklists', {
        name: `${TAG}-id-type`,
        industry: 'Transportation',
        categories: [],
        items: [],
      });
      expect(typeof body.data.id).toBe('string');
      if (body.data?.id) {
        sqlite.prepare('DELETE FROM custom_checklists WHERE id = ?').run(Number(body.data.id));
      }
    });

    it('sets createdAt and updatedAt as numbers', async () => {
      const { body } = await req(app, 'POST', '/api/custom-checklists', {
        name: `${TAG}-timestamps`,
        industry: 'Warehousing',
        categories: [],
        items: [],
      });
      expect(typeof body.data.createdAt).toBe('number');
      expect(typeof body.data.updatedAt).toBe('number');
      if (body.data?.id) {
        sqlite.prepare('DELETE FROM custom_checklists WHERE id = ?').run(Number(body.data.id));
      }
    });

    it('uses Manufacturing as default industry', async () => {
      const { body } = await req(app, 'POST', '/api/custom-checklists', {
        name: `${TAG}-default-industry`,
        categories: [],
        items: [],
      });
      expect(body.data.industry).toBe('Manufacturing');
      if (body.data?.id) {
        sqlite.prepare('DELETE FROM custom_checklists WHERE id = ?').run(Number(body.data.id));
      }
    });

    it('returns 400 when name is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-checklists', {
        industry: 'Construction',
        categories: [],
        items: [],
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when name is empty string', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-checklists', {
        name: '',
        industry: 'Construction',
        categories: [],
        items: [],
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when industry is invalid', async () => {
      const { status, body } = await req(app, 'POST', '/api/custom-checklists', {
        name: `${TAG}-bad-industry`,
        industry: 'Space',
        categories: [],
        items: [],
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/custom-checklists/:id ─────────────────────────────────────

  describe('GET /api/custom-checklists/:id', () => {
    it('returns 200 for existing id', async () => {
      const { status, body } = await req(app, 'GET', `/api/custom-checklists/${checklistId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns the correct checklist', async () => {
      const { body } = await req(app, 'GET', `/api/custom-checklists/${checklistId}`);
      expect(body.data.id).toBe(String(checklistId));
    });

    it('has all expected fields', async () => {
      const { body } = await req(app, 'GET', `/api/custom-checklists/${checklistId}`);
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('name');
      expect(body.data).toHaveProperty('description');
      expect(body.data).toHaveProperty('industry');
      expect(body.data).toHaveProperty('categories');
      expect(body.data).toHaveProperty('items');
      expect(body.data).toHaveProperty('createdAt');
      expect(body.data).toHaveProperty('updatedAt');
    });

    it('categories is a parsed array', async () => {
      const { body } = await req(app, 'GET', `/api/custom-checklists/${checklistId}`);
      expect(Array.isArray(body.data.categories)).toBe(true);
    });

    it('items is a parsed array with correct shape', async () => {
      const { body } = await req(app, 'GET', `/api/custom-checklists/${checklistId}`);
      expect(Array.isArray(body.data.items)).toBe(true);
      expect(body.data.items[0]).toHaveProperty('id');
      expect(body.data.items[0]).toHaveProperty('question');
      expect(body.data.items[0]).toHaveProperty('required');
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-checklists/999999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for non-numeric id', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-checklists/abc');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for id = 0', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-checklists/0');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for negative id', async () => {
      const { status, body } = await req(app, 'GET', '/api/custom-checklists/-1');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── PUT /api/custom-checklists/:id ─────────────────────────────────────

  describe('PUT /api/custom-checklists/:id', () => {
    it('returns 200 on valid update', async () => {
      const { status, body } = await req(app, 'PUT', `/api/custom-checklists/${constructionId}`, {
        name: `${TAG}-construction-updated`,
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('updates the name field', async () => {
      const newName = `${TAG}-name-change`;
      await req(app, 'PUT', `/api/custom-checklists/${constructionId}`, { name: newName });
      const { body } = await req(app, 'GET', `/api/custom-checklists/${constructionId}`);
      expect(body.data.name).toBe(newName);
    });

    it('updates the description field', async () => {
      const { body } = await req(app, 'PUT', `/api/custom-checklists/${constructionId}`, {
        description: 'Updated description',
      });
      expect(body.data.description).toBe('Updated description');
    });

    it('updates industry field', async () => {
      const { body } = await req(app, 'PUT', `/api/custom-checklists/${constructionId}`, {
        industry: 'Oil & Gas',
      });
      expect(body.data.industry).toBe('Oil & Gas');
    });

    it('updates categories array', async () => {
      const { body } = await req(app, 'PUT', `/api/custom-checklists/${constructionId}`, {
        categories: ['Electrical', 'Mechanical', 'Civil'],
      });
      expect(body.data.categories).toContain('Electrical');
      expect(body.data.categories).toContain('Civil');
    });

    it('updates items array', async () => {
      const newItems = [
        { id: 'upd-1', question: 'Scaffold secure?', category: 'Structural', required: true, helpText: '' },
      ];
      const { body } = await req(app, 'PUT', `/api/custom-checklists/${constructionId}`, {
        items: newItems,
      });
      expect(Array.isArray(body.data.items)).toBe(true);
      expect(body.data.items[0].question).toBe('Scaffold secure?');
    });

    it('updates updatedAt timestamp', async () => {
      const before = Date.now();
      const { body } = await req(app, 'PUT', `/api/custom-checklists/${checklistId}`, {
        description: 'Timestamp update test',
      });
      expect(body.data.updatedAt).toBeGreaterThanOrEqual(before);
    });

    it('returns 400 when no fields are provided', async () => {
      const { status, body } = await req(app, 'PUT', `/api/custom-checklists/${checklistId}`, {});
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/custom-checklists/999999999', {
        name: 'Ghost checklist',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for non-numeric id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/custom-checklists/xyz', { name: 'test' });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('rejects invalid industry on update', async () => {
      const { status } = await req(app, 'PUT', `/api/custom-checklists/${checklistId}`, {
        industry: 'UnknownSector',
      });
      expect(status).toBe(400);
    });
  });

  // ── DELETE /api/custom-checklists/:id ──────────────────────────────────

  describe('DELETE /api/custom-checklists/:id', () => {
    it('returns 200 on successful delete', async () => {
      const toDelete = seedChecklist({ name: `${TAG}-to-delete`, industry: 'Mining' });
      const { status, body } = await req(app, 'DELETE', `/api/custom-checklists/${toDelete}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns success message on delete', async () => {
      const toDelete = seedChecklist({ name: `${TAG}-msg-delete`, industry: 'Mining' });
      const { body } = await req(app, 'DELETE', `/api/custom-checklists/${toDelete}`);
      expect(body.message).toBeDefined();
    });

    it('record no longer exists after delete', async () => {
      const toDelete = seedChecklist({ name: `${TAG}-gone`, industry: 'Retail' });
      await req(app, 'DELETE', `/api/custom-checklists/${toDelete}`);
      const { status } = await req(app, 'GET', `/api/custom-checklists/${toDelete}`);
      expect(status).toBe(404);
    });

    it('returns 404 for already-deleted id', async () => {
      const toDelete = seedChecklist({ name: `${TAG}-double-delete`, industry: 'Retail' });
      await req(app, 'DELETE', `/api/custom-checklists/${toDelete}`);
      const { status } = await req(app, 'DELETE', `/api/custom-checklists/${toDelete}`);
      expect(status).toBe(404);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/custom-checklists/999999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for non-numeric id', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/custom-checklists/abc');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for id = 0', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/custom-checklists/0');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });
});
