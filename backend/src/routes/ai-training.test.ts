/**
 * AI Training Modules API Route Tests
 * Tests training modules, learning paths, competency scores, and AI course generation endpoints.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { aiRoutes } from '../routes/ai';

// ── Test App Factory ──────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  aiRoutes(app, {} as any);
  return app;
}

// ── Helper ────────────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  const json = await res.json();
  return { status: res.status, body: json as any };
}

// ── Test Suite ────────────────────────────────────────────────────────────

describe('AI Training Modules Routes', () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  afterAll(() => {
    try {
      const db = new Database('local.sqlite');
      db.prepare(`DELETE FROM ai_generated_courses WHERE topic LIKE 'Test%' OR topic LIKE 'test%'`).run();
      db.close();
    } catch {
      // Ignore cleanup errors
    }
  });

  // ── GET /api/ai/training/modules ─────────────────────────────────────

  describe('GET /api/ai/training/modules', () => {
    it('returns 200 with an array of modules', async () => {
      const { status, body } = await req(app, 'GET', '/api/ai/training/modules');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns seeded modules (at least 6)', async () => {
      const { body } = await req(app, 'GET', '/api/ai/training/modules');
      expect(body.data.length).toBeGreaterThanOrEqual(6);
    });

    it('each module has required camelCase fields', async () => {
      const { body } = await req(app, 'GET', '/api/ai/training/modules');
      const mod = body.data[0];
      expect(mod).toHaveProperty('id');
      expect(mod).toHaveProperty('title');
      expect(mod).toHaveProperty('category');
      expect(mod).toHaveProperty('difficulty');
      expect(mod).toHaveProperty('duration');
      expect(mod).toHaveProperty('modules');
      expect(mod).toHaveProperty('completed');
      expect(mod).toHaveProperty('score');
      expect(mod).toHaveProperty('enrolled');
      expect(mod).toHaveProperty('color');
      expect(Array.isArray(mod.tags)).toBe(true);
    });

    it('returns count matching array length', async () => {
      const { body } = await req(app, 'GET', '/api/ai/training/modules');
      expect(body.count).toBe(body.data.length);
    });
  });

  // ── PATCH /api/ai/training/modules/:id/progress ───────────────────────

  describe('PATCH /api/ai/training/modules/:id/progress', () => {
    it('returns 200 when updating progress with valid completed count', async () => {
      const { body: listBody } = await req(app, 'GET', '/api/ai/training/modules');
      const mod = listBody.data[0];

      const { status, body } = await req(
        app,
        'PATCH',
        `/api/ai/training/modules/${mod.id}/progress`,
        { completed: 1 }
      );
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(mod.id);
      expect(body.data.completed).toBe(1);
    });

    it('returns 200 with completed equal to modules_count (full completion)', async () => {
      const { body: listBody } = await req(app, 'GET', '/api/ai/training/modules');
      const mod = listBody.data[0];

      const { status, body } = await req(
        app,
        'PATCH',
        `/api/ai/training/modules/${mod.id}/progress`,
        { completed: mod.modules }
      );
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 400 when completed exceeds modules_count', async () => {
      const { body: listBody } = await req(app, 'GET', '/api/ai/training/modules');
      const mod = listBody.data[0];

      const { status, body } = await req(
        app,
        'PATCH',
        `/api/ai/training/modules/${mod.id}/progress`,
        { completed: mod.modules + 100 }
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for negative completed value', async () => {
      const { body: listBody } = await req(app, 'GET', '/api/ai/training/modules');
      const mod = listBody.data[0];

      const { status, body } = await req(
        app,
        'PATCH',
        `/api/ai/training/modules/${mod.id}/progress`,
        { completed: -1 }
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for missing completed field', async () => {
      const { body: listBody } = await req(app, 'GET', '/api/ai/training/modules');
      const mod = listBody.data[0];

      const { status, body } = await req(
        app,
        'PATCH',
        `/api/ai/training/modules/${mod.id}/progress`,
        {}
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for non-integer completed value', async () => {
      const { body: listBody } = await req(app, 'GET', '/api/ai/training/modules');
      const mod = listBody.data[0];

      const { status, body } = await req(
        app,
        'PATCH',
        `/api/ai/training/modules/${mod.id}/progress`,
        { completed: 'two' }
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 404 for an unknown module id', async () => {
      const { status, body } = await req(
        app,
        'PATCH',
        '/api/ai/training/modules/nonexistent-id-xyz/progress',
        { completed: 1 }
      );
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/ai/training/paths ────────────────────────────────────────

  describe('GET /api/ai/training/paths', () => {
    it('returns 200 with an array of learning paths', async () => {
      const { status, body } = await req(app, 'GET', '/api/ai/training/paths');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns seeded paths (at least 4)', async () => {
      const { body } = await req(app, 'GET', '/api/ai/training/paths');
      expect(body.data.length).toBeGreaterThanOrEqual(4);
    });

    it('each path has required camelCase fields', async () => {
      const { body } = await req(app, 'GET', '/api/ai/training/paths');
      const path = body.data[0];
      expect(path).toHaveProperty('id');
      expect(path).toHaveProperty('name');
      expect(path).toHaveProperty('modules');
      expect(path).toHaveProperty('duration');
      expect(path).toHaveProperty('progress');
      expect(path).toHaveProperty('certified');
      expect(path).toHaveProperty('color');
    });

    it('progress values are between 0 and 100', async () => {
      const { body } = await req(app, 'GET', '/api/ai/training/paths');
      for (const p of body.data) {
        expect(p.progress).toBeGreaterThanOrEqual(0);
        expect(p.progress).toBeLessThanOrEqual(100);
      }
    });
  });

  // ── GET /api/ai/training/competency ───────────────────────────────────

  describe('GET /api/ai/training/competency', () => {
    it('returns 200 with an array of competency areas', async () => {
      const { status, body } = await req(app, 'GET', '/api/ai/training/competency');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns seeded competency areas (at least 6)', async () => {
      const { body } = await req(app, 'GET', '/api/ai/training/competency');
      expect(body.data.length).toBeGreaterThanOrEqual(6);
    });

    it('each area has required camelCase fields', async () => {
      const { body } = await req(app, 'GET', '/api/ai/training/competency');
      const area = body.data[0];
      expect(area).toHaveProperty('id');
      expect(area).toHaveProperty('area');
      expect(area).toHaveProperty('score');
      expect(area).toHaveProperty('trend');
      expect(area).toHaveProperty('benchmark');
    });

    it('scores are numeric values between 0 and 100', async () => {
      const { body } = await req(app, 'GET', '/api/ai/training/competency');
      for (const c of body.data) {
        expect(typeof c.score).toBe('number');
        expect(c.score).toBeGreaterThanOrEqual(0);
        expect(c.score).toBeLessThanOrEqual(100);
      }
    });
  });

  // ── POST /api/ai/training/generate ───────────────────────────────────

  describe('POST /api/ai/training/generate', () => {
    it('returns 201 with generated course using fallback when no API key', async () => {
      const prevKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      const { status, body } = await req(app, 'POST', '/api/ai/training/generate', {
        topic: 'Test Fall Protection',
        difficulty: 'Beginner',
        audience: 'All Workers',
        moduleCount: '5 modules (~30 min)',
      });

      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('description');
      expect(body.data.topic).toBe('Test Fall Protection');
      expect(body.data.difficulty).toBe('Beginner');
      expect(typeof body.data.description).toBe('string');
      expect(body.data.description.length).toBeGreaterThan(10);
      expect(body.data.source).toBe('fallback');

      if (prevKey) process.env.OPENROUTER_API_KEY = prevKey;
    });

    it('accepts all valid difficulty levels', async () => {
      const prevKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      for (const diff of ['Beginner', 'Intermediate', 'Advanced']) {
        const { status, body } = await req(app, 'POST', '/api/ai/training/generate', {
          topic: `Test ${diff} Safety`,
          difficulty: diff,
          audience: 'Supervisors',
          moduleCount: '10 modules (~60 min)',
        });
        expect(status).toBe(201);
        expect(body.data.difficulty).toBe(diff);
      }

      if (prevKey) process.env.OPENROUTER_API_KEY = prevKey;
    });

    it('returns 400 when topic is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/training/generate', {
        difficulty: 'Beginner',
        audience: 'All Workers',
        moduleCount: '5 modules (~30 min)',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when topic is too short (< 2 chars)', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/training/generate', {
        topic: 'X',
        difficulty: 'Beginner',
        audience: 'All Workers',
        moduleCount: '5 modules (~30 min)',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid difficulty value', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/training/generate', {
        topic: 'Test Fire Safety',
        difficulty: 'Expert',
        audience: 'All Workers',
        moduleCount: '5 modules (~30 min)',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when audience is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/training/generate', {
        topic: 'Test Chemical Safety',
        difficulty: 'Intermediate',
        moduleCount: '5 modules (~30 min)',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when moduleCount is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/training/generate', {
        topic: 'Test Ergonomics',
        difficulty: 'Intermediate',
        audience: 'All Workers',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('persists generated course to database', async () => {
      const prevKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      const { body: genBody } = await req(app, 'POST', '/api/ai/training/generate', {
        topic: 'Test Lockout Tagout',
        difficulty: 'Advanced',
        audience: 'Maintenance',
        moduleCount: '10 modules (~60 min)',
      });

      const generatedId = genBody.data.id;
      const { body: listBody } = await req(app, 'GET', '/api/ai/training/generated');
      const found = listBody.data.find((c: any) => c.id === generatedId);
      expect(found).toBeDefined();
      expect(found.topic).toBe('Test Lockout Tagout');

      if (prevKey) process.env.OPENROUTER_API_KEY = prevKey;
    });
  });

  // ── GET /api/ai/training/generated ───────────────────────────────────

  describe('GET /api/ai/training/generated', () => {
    it('returns 200 with an array', async () => {
      const { status, body } = await req(app, 'GET', '/api/ai/training/generated');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('each generated course has required fields', async () => {
      const prevKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      // Ensure at least one course exists
      await req(app, 'POST', '/api/ai/training/generate', {
        topic: 'Test Scaffolding Safety',
        difficulty: 'Intermediate',
        audience: 'Contractors',
        moduleCount: '5 modules (~30 min)',
      });

      const { body } = await req(app, 'GET', '/api/ai/training/generated');
      expect(body.data.length).toBeGreaterThan(0);
      const course = body.data[0];
      expect(course).toHaveProperty('id');
      expect(course).toHaveProperty('topic');
      expect(course).toHaveProperty('difficulty');
      expect(course).toHaveProperty('audience');
      expect(course).toHaveProperty('moduleCount');
      expect(course).toHaveProperty('description');
      expect(course).toHaveProperty('source');

      if (prevKey) process.env.OPENROUTER_API_KEY = prevKey;
    });

    it('respects the limit query parameter', async () => {
      const prevKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      // Generate a few courses to ensure there are enough rows
      for (let i = 0; i < 3; i++) {
        await req(app, 'POST', '/api/ai/training/generate', {
          topic: `test-limit-course-${i}`,
          difficulty: 'Beginner',
          audience: 'All Workers',
          moduleCount: '5 modules (~30 min)',
        });
      }

      const { body } = await req(app, 'GET', '/api/ai/training/generated?limit=2');
      expect(body.data.length).toBeLessThanOrEqual(2);

      if (prevKey) process.env.OPENROUTER_API_KEY = prevKey;
    });

    it('returns newest courses first (descending order)', async () => {
      const prevKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      const { body } = await req(app, 'GET', '/api/ai/training/generated');
      if (body.data.length >= 2) {
        const first = body.data[0].createdAt;
        const second = body.data[1].createdAt;
        expect(first).toBeGreaterThanOrEqual(second);
      }

      if (prevKey) process.env.OPENROUTER_API_KEY = prevKey;
    });

    it('returns count matching data length', async () => {
      const { body } = await req(app, 'GET', '/api/ai/training/generated');
      expect(body.count).toBe(body.data.length);
    });
  });
});
