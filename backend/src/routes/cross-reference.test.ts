/**
 * Cross-Reference Matrix Routes Test Suite
 *
 * Covers:
 *   GET    /api/cross-reference/stats                 — stats
 *   GET    /api/cross-reference/relationships          — list with filters
 *   POST   /api/cross-reference/relationships          — create
 *   GET    /api/cross-reference/relationships/:id      — get by id
 *   PUT    /api/cross-reference/relationships/:id      — partial update
 *   DELETE /api/cross-reference/relationships/:id      — delete
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { crossReferenceRoutes } from '../routes/cross-reference';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  crossReferenceRoutes(app);
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
  sqlite.prepare(`DELETE FROM standard_relationships WHERE source_standard_id LIKE '${TAG}%' OR target_standard_id LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM standard_relationships WHERE source_standard_id = ? AND target_standard_id = ?`).run(`${TAG}-src-a`, `${TAG}-tgt-a`);
});

const SAMPLE_CLAUSES = JSON.stringify([
  { sourceClauses: ['4.1', '4.2'], targetClauses: ['5.1'], description: 'Context alignment' },
]);
const SAMPLE_SYNERGIES = JSON.stringify(['Unified system', 'Reduced audit burden']);

function seedRelationship(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO standard_relationships
      (source_standard_id, target_standard_id, relationship_type, mapped_clauses, integration_notes, synergies, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.source_standard_id ?? `${TAG}-src-a`,
    overrides.target_standard_id ?? `${TAG}-tgt-a`,
    overrides.relationship_type  ?? 'compatible',
    overrides.mapped_clauses     ?? SAMPLE_CLAUSES,
    overrides.integration_notes  ?? 'Test integration notes',
    overrides.synergies          ?? SAMPLE_SYNERGIES,
    overrides.created_at         ?? ts,
    overrides.updated_at         ?? ts,
  );
  return Number(result.lastInsertRowid);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Cross-Reference Matrix Routes', () => {
  let app: Hono;
  let relId: number;
  let compatId: number;
  let integratedId: number;

  beforeAll(() => {
    app = createTestApp();
    relId       = seedRelationship({ source_standard_id: `${TAG}-src-a`, target_standard_id: `${TAG}-tgt-a`, relationship_type: 'compatible' });
    compatId    = seedRelationship({ source_standard_id: `${TAG}-src-b`, target_standard_id: `${TAG}-tgt-b`, relationship_type: 'complementary' });
    integratedId = seedRelationship({ source_standard_id: `${TAG}-src-c`, target_standard_id: `${TAG}-tgt-c`, relationship_type: 'integrated' });
  });

  // ── Stats ────────────────────────────────────────────────────────────────

  describe('GET /api/cross-reference/stats', () => {
    it('returns 200 with stats shape', async () => {
      const { status, body } = await req(app, 'GET', '/api/cross-reference/stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(typeof body.data.total).toBe('number');
      expect(typeof body.data.byType).toBe('object');
      expect(typeof body.data.uniqueStandards).toBe('number');
    });

    it('total includes seeded records', async () => {
      const { body } = await req(app, 'GET', '/api/cross-reference/stats');
      expect(body.data.total).toBeGreaterThanOrEqual(3);
    });

    it('byType includes compatible and complementary entries', async () => {
      const { body } = await req(app, 'GET', '/api/cross-reference/stats');
      expect(body.data.byType.compatible).toBeGreaterThanOrEqual(1);
      expect(body.data.byType.complementary).toBeGreaterThanOrEqual(1);
    });
  });

  // ── List / Filter ────────────────────────────────────────────────────────

  describe('GET /api/cross-reference/relationships', () => {
    it('returns 200 with array', async () => {
      const { status, body } = await req(app, 'GET', '/api/cross-reference/relationships');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns all seeded records in list', async () => {
      const { body } = await req(app, 'GET', '/api/cross-reference/relationships');
      const ids = body.data.map((r: any) => r.id);
      expect(ids).toContain(relId);
      expect(ids).toContain(compatId);
    });

    it('filters by type', async () => {
      const { body } = await req(app, 'GET', '/api/cross-reference/relationships?type=integrated');
      expect(body.success).toBe(true);
      for (const r of body.data) {
        expect(r.relationshipType).toBe('integrated');
      }
    });

    it('filters by sourceId', async () => {
      const { body } = await req(app, 'GET', `/api/cross-reference/relationships?sourceId=${TAG}-src-a`);
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      for (const r of body.data) {
        expect(r.sourceStandardId).toBe(`${TAG}-src-a`);
      }
    });

    it('filters by targetId', async () => {
      const { body } = await req(app, 'GET', `/api/cross-reference/relationships?targetId=${TAG}-tgt-b`);
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      for (const r of body.data) {
        expect(r.targetStandardId).toBe(`${TAG}-tgt-b`);
      }
    });

    it('maps JSON fields correctly', async () => {
      const { body } = await req(app, 'GET', `/api/cross-reference/relationships?sourceId=${TAG}-src-a`);
      const r = body.data[0];
      expect(Array.isArray(r.mappedClauses)).toBe(true);
      expect(Array.isArray(r.synergies)).toBe(true);
      expect(r.mappedClauses[0]).toHaveProperty('sourceClauses');
      expect(r.mappedClauses[0]).toHaveProperty('targetClauses');
      expect(r.mappedClauses[0]).toHaveProperty('description');
    });
  });

  // ── Create ───────────────────────────────────────────────────────────────

  describe('POST /api/cross-reference/relationships', () => {
    it('creates a new relationship', async () => {
      const payload = {
        sourceStandardId: `${TAG}-new-src`,
        targetStandardId: `${TAG}-new-tgt`,
        relationshipType: 'prerequisite',
        mappedClauses: [{ sourceClauses: ['7'], targetClauses: ['8'], description: 'Derived relationship' }],
        integrationNotes: 'New integration notes',
        synergies: ['Better coverage'],
      };
      const { status, body } = await req(app, 'POST', '/api/cross-reference/relationships', payload);
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.id).toBeDefined();
      expect(body.data.sourceStandardId).toBe(`${TAG}-new-src`);
      expect(body.data.relationshipType).toBe('prerequisite');
      expect(Array.isArray(body.data.synergies)).toBe(true);
    });

    it('returns 400 for missing required fields', async () => {
      const { status, body } = await req(app, 'POST', '/api/cross-reference/relationships', {
        sourceStandardId: `${TAG}-x`,
        // missing targetStandardId and relationshipType
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid relationship type', async () => {
      const { status, body } = await req(app, 'POST', '/api/cross-reference/relationships', {
        sourceStandardId: `${TAG}-x`,
        targetStandardId: `${TAG}-y`,
        relationshipType: 'invalid-type',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('allows empty mappedClauses and synergies', async () => {
      const payload = {
        sourceStandardId: `${TAG}-min-src`,
        targetStandardId: `${TAG}-min-tgt`,
        relationshipType: 'overlapping',
      };
      const { status, body } = await req(app, 'POST', '/api/cross-reference/relationships', payload);
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.mappedClauses).toEqual([]);
      expect(body.data.synergies).toEqual([]);
    });
  });

  // ── Get by ID ────────────────────────────────────────────────────────────

  describe('GET /api/cross-reference/relationships/:id', () => {
    it('returns the correct relationship by id', async () => {
      const { status, body } = await req(app, 'GET', `/api/cross-reference/relationships/${relId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(relId);
      expect(body.data.sourceStandardId).toBe(`${TAG}-src-a`);
      expect(body.data.targetStandardId).toBe(`${TAG}-tgt-a`);
      expect(body.data.relationshipType).toBe('compatible');
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'GET', '/api/cross-reference/relationships/999999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── Update ───────────────────────────────────────────────────────────────

  describe('PUT /api/cross-reference/relationships/:id', () => {
    it('updates relationship type', async () => {
      const { status, body } = await req(app, 'PUT', `/api/cross-reference/relationships/${compatId}`, {
        relationshipType: 'overlapping',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.relationshipType).toBe('overlapping');
    });

    it('updates integration notes', async () => {
      const { status, body } = await req(app, 'PUT', `/api/cross-reference/relationships/${compatId}`, {
        integrationNotes: 'Updated notes for testing',
      });
      expect(status).toBe(200);
      expect(body.data.integrationNotes).toBe('Updated notes for testing');
    });

    it('returns 404 for non-existent id on update', async () => {
      const { status, body } = await req(app, 'PUT', '/api/cross-reference/relationships/999999999', {
        relationshipType: 'compatible',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── Delete ───────────────────────────────────────────────────────────────

  describe('DELETE /api/cross-reference/relationships/:id', () => {
    it('deletes an existing relationship', async () => {
      const toDelete = seedRelationship({ source_standard_id: `${TAG}-del-src`, target_standard_id: `${TAG}-del-tgt` });
      const { status, body } = await req(app, 'DELETE', `/api/cross-reference/relationships/${toDelete}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('deleted record no longer accessible', async () => {
      const toDelete = seedRelationship({ source_standard_id: `${TAG}-del-src2`, target_standard_id: `${TAG}-del-tgt2` });
      await req(app, 'DELETE', `/api/cross-reference/relationships/${toDelete}`);
      const { status } = await req(app, 'GET', `/api/cross-reference/relationships/${toDelete}`);
      expect(status).toBe(404);
    });

    it('returns 404 for non-existent id on delete', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/cross-reference/relationships/999999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });
});
