/**
 * AI Visual Audit API Route Tests
 * Tests POST/GET/DELETE results, voice notes, and stats endpoints.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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

// ── Fixtures ──────────────────────────────────────────────────────────────

const TEST_ID_1 = `test-visual-${Date.now()}-1`;
const TEST_ID_2 = `test-visual-${Date.now()}-2`;

function makeAuditPayload(id: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id,
    type: 'environment',
    mediaType: 'image',
    analysis: 'Test analysis: Trip hazard detected near loading bay.',
    suggestions: ['Mark the area with yellow paint.', 'Install warning signs.'],
    status: 'danger',
    hazards: [
      { x: 30, y: 40, label: 'Trip Hazard', severity: 'high', standard: 'OSHA 1910.22' },
    ],
    voiceNotes: [],
    standard: 'osha',
    ...overrides,
  };
}

// ── Test Suite ─────────────────────────────────────────────────────────────

describe('AI Visual Audit Routes', () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  afterAll(() => {
    try {
      const db = new Database('local.sqlite');
      db.prepare(`DELETE FROM visual_audit_results WHERE id LIKE 'test-visual-%'`).run();
      db.close();
    } catch {
      // Ignore cleanup errors
    }
  });

  // ── POST /api/ai/visual-audit/results ─────────────────────────────────

  describe('POST /api/ai/visual-audit/results', () => {
    it('returns 201 and saves a complete audit result', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/visual-audit/results', makeAuditPayload(TEST_ID_1));
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(TEST_ID_1);
    });

    it('returns 201 for an employee PPE scan with ppeInventory', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/visual-audit/results', makeAuditPayload(TEST_ID_2, {
        type: 'employee',
        mediaType: 'image',
        status: 'warning',
        ppeInventory: [
          { item: 'Hard Hat', status: 'detected' },
          { item: 'Eye Protection', status: 'missing' },
        ],
      }));
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('returns 201 for a video media type', async () => {
      const id = `test-visual-video-${Date.now()}`;
      const { status, body } = await req(app, 'POST', '/api/ai/visual-audit/results', makeAuditPayload(id, {
        mediaType: 'video',
        type: 'machine',
      }));
      expect(status).toBe(201);
      expect(body.data.id).toBe(id);
    });

    it('is idempotent — replacing an existing id updates rather than errors', async () => {
      const { status } = await req(app, 'POST', '/api/ai/visual-audit/results', makeAuditPayload(TEST_ID_1, {
        analysis: 'Updated analysis after re-scan.',
      }));
      expect(status).toBe(201);
    });

    it('returns 201 with GPS location fields', async () => {
      const id = `test-visual-gps-${Date.now()}`;
      const { status, body } = await req(app, 'POST', '/api/ai/visual-audit/results', makeAuditPayload(id, {
        locationLat: 37.7749,
        locationLng: -122.4194,
      }));
      expect(status).toBe(201);
      expect(body.data.id).toBe(id);
    });

    it('returns 400 when id is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/visual-audit/results', {
        type: 'environment',
        mediaType: 'image',
        analysis: 'Missing id payload.',
        suggestions: [],
        status: 'safe',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for an invalid audit type', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/visual-audit/results', makeAuditPayload(`test-visual-bad-type-${Date.now()}`, {
        type: 'invalid_type',
      }));
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for an invalid status value', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/visual-audit/results', makeAuditPayload(`test-visual-bad-status-${Date.now()}`, {
        status: 'critical',
      }));
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for an invalid mediaType', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/visual-audit/results', makeAuditPayload(`test-visual-bad-media-${Date.now()}`, {
        mediaType: 'gif',
      }));
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when analysis is an empty string', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/visual-audit/results', makeAuditPayload(`test-visual-empty-${Date.now()}`, {
        analysis: '',
      }));
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('accepts all valid audit types', async () => {
      for (const type of ['environment', 'employee', 'machine', 'hazard', 'comparison', 'robotics']) {
        const id = `test-visual-type-${type}-${Date.now()}`;
        const { status } = await req(app, 'POST', '/api/ai/visual-audit/results', makeAuditPayload(id, { type }));
        expect(status).toBe(201);
      }
    });
  });

  // ── GET /api/ai/visual-audit/results ──────────────────────────────────

  describe('GET /api/ai/visual-audit/results', () => {
    it('returns 200 with an array', async () => {
      const { status, body } = await req(app, 'GET', '/api/ai/visual-audit/results');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('includes previously saved test results', async () => {
      const { body } = await req(app, 'GET', '/api/ai/visual-audit/results');
      const found = body.data.find((r: any) => r.id === TEST_ID_1);
      expect(found).toBeDefined();
    });

    it('each result has required camelCase fields', async () => {
      const { body } = await req(app, 'GET', '/api/ai/visual-audit/results');
      const result = body.data.find((r: any) => r.id === TEST_ID_1);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('mediaType');
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('hazards');
      expect(result).toHaveProperty('voiceNotes');
      expect(result).toHaveProperty('standard');
      expect(result).toHaveProperty('createdAt');
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(Array.isArray(result.hazards)).toBe(true);
      expect(Array.isArray(result.voiceNotes)).toBe(true);
    });

    it('hazards are correctly deserialized', async () => {
      const { body } = await req(app, 'GET', '/api/ai/visual-audit/results');
      const result = body.data.find((r: any) => r.id === TEST_ID_1);
      expect(result.hazards.length).toBeGreaterThan(0);
      const h = result.hazards[0];
      expect(h).toHaveProperty('x');
      expect(h).toHaveProperty('y');
      expect(h).toHaveProperty('label');
      expect(h).toHaveProperty('severity');
    });

    it('ppeInventory is returned for employee scans', async () => {
      const { body } = await req(app, 'GET', '/api/ai/visual-audit/results');
      const result = body.data.find((r: any) => r.id === TEST_ID_2);
      expect(result?.ppeInventory).toBeDefined();
      expect(Array.isArray(result.ppeInventory)).toBe(true);
    });

    it('returns count matching array length', async () => {
      const { body } = await req(app, 'GET', '/api/ai/visual-audit/results');
      expect(body.count).toBe(body.data.length);
    });

    it('results are ordered newest first', async () => {
      const { body } = await req(app, 'GET', '/api/ai/visual-audit/results');
      if (body.data.length >= 2) {
        expect(body.data[0].createdAt).toBeGreaterThanOrEqual(body.data[1].createdAt);
      }
    });

    it('respects the limit query parameter', async () => {
      const { body } = await req(app, 'GET', '/api/ai/visual-audit/results?limit=1');
      expect(body.data.length).toBeLessThanOrEqual(1);
    });
  });

  // ── DELETE /api/ai/visual-audit/results/:id ───────────────────────────

  describe('DELETE /api/ai/visual-audit/results/:id', () => {
    it('returns 200 and deletes an existing result', async () => {
      // First create a result to delete
      const deleteId = `test-visual-del-${Date.now()}`;
      await req(app, 'POST', '/api/ai/visual-audit/results', makeAuditPayload(deleteId));

      const { status, body } = await req(app, 'DELETE', `/api/ai/visual-audit/results/${deleteId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('confirms the deleted result is gone from the list', async () => {
      const deleteId = `test-visual-del2-${Date.now()}`;
      await req(app, 'POST', '/api/ai/visual-audit/results', makeAuditPayload(deleteId));
      await req(app, 'DELETE', `/api/ai/visual-audit/results/${deleteId}`);

      const { body } = await req(app, 'GET', '/api/ai/visual-audit/results');
      const found = body.data.find((r: any) => r.id === deleteId);
      expect(found).toBeUndefined();
    });

    it('returns 404 for a non-existent id', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/ai/visual-audit/results/nonexistent-xyz-9999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── POST /api/ai/visual-audit/results/:id/voice-notes ─────────────────

  describe('POST /api/ai/visual-audit/results/:id/voice-notes', () => {
    it('returns 200 and appends a voice note', async () => {
      const { status, body } = await req(
        app, 'POST',
        `/api/ai/visual-audit/results/${TEST_ID_1}/voice-notes`,
        { note: 'Inspector confirmed trip hazard at 14:32.' }
      );
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.voiceNotes)).toBe(true);
      expect(body.data.voiceNotes.length).toBeGreaterThan(0);
      expect(body.data.voiceNotes).toContain('Inspector confirmed trip hazard at 14:32.');
    });

    it('accumulates multiple voice notes', async () => {
      await req(app, 'POST', `/api/ai/visual-audit/results/${TEST_ID_1}/voice-notes`, { note: 'Second note added.' });
      const { body } = await req(app, 'POST', `/api/ai/visual-audit/results/${TEST_ID_1}/voice-notes`, { note: 'Third note.' });
      expect(body.data.voiceNotes.length).toBeGreaterThanOrEqual(3);
    });

    it('voice notes are persisted and visible in GET results', async () => {
      const { body: listBody } = await req(app, 'GET', '/api/ai/visual-audit/results');
      const result = listBody.data.find((r: any) => r.id === TEST_ID_1);
      expect(result.voiceNotes.length).toBeGreaterThan(0);
    });

    it('returns 404 for a non-existent result id', async () => {
      const { status, body } = await req(
        app, 'POST',
        '/api/ai/visual-audit/results/no-such-id-xyz/voice-notes',
        { note: 'This should not work.' }
      );
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for an empty note', async () => {
      const { status, body } = await req(
        app, 'POST',
        `/api/ai/visual-audit/results/${TEST_ID_1}/voice-notes`,
        { note: '' }
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for missing note field', async () => {
      const { status, body } = await req(
        app, 'POST',
        `/api/ai/visual-audit/results/${TEST_ID_1}/voice-notes`,
        {}
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/ai/visual-audit/stats ────────────────────────────────────

  describe('GET /api/ai/visual-audit/stats', () => {
    it('returns 200 with aggregate stats', async () => {
      const { status, body } = await req(app, 'GET', '/api/ai/visual-audit/stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('total');
      expect(body.data).toHaveProperty('safe');
      expect(body.data).toHaveProperty('warning');
      expect(body.data).toHaveProperty('danger');
      expect(body.data).toHaveProperty('byType');
    });

    it('total is a non-negative number', async () => {
      const { body } = await req(app, 'GET', '/api/ai/visual-audit/stats');
      expect(typeof body.data.total).toBe('number');
      expect(body.data.total).toBeGreaterThanOrEqual(0);
    });

    it('safe + warning + danger equals total', async () => {
      const { body } = await req(app, 'GET', '/api/ai/visual-audit/stats');
      const { total, safe, warning, danger } = body.data;
      expect(safe + warning + danger).toBe(total);
    });

    it('byType is a plain object of type counts', async () => {
      const { body } = await req(app, 'GET', '/api/ai/visual-audit/stats');
      expect(typeof body.data.byType).toBe('object');
      expect(body.data.byType).not.toBeNull();
    });

    it('danger count is at least 1 (from seeded test data)', async () => {
      const { body } = await req(app, 'GET', '/api/ai/visual-audit/stats');
      expect(body.data.danger).toBeGreaterThanOrEqual(1);
    });

    it('byType includes environment key from seeded test data', async () => {
      const { body } = await req(app, 'GET', '/api/ai/visual-audit/stats');
      expect(body.data.byType).toHaveProperty('environment');
    });
  });
});
