/**
 * Mobile Offline Sync Routes Test Suite
 *
 * Covers:
 *   GET    /api/sync/queue              — list queue, empty, auth
 *   POST   /api/sync/queue              — add record, upsert, validation
 *   PUT    /api/sync/queue/:id          — update record, 404, validation
 *   DELETE /api/sync/queue/:id          — delete record, 404
 *   POST   /api/sync/queue/reset        — reset to seed, re-seed count
 *
 *   GET    /api/sync/conflicts          — list conflicts, empty, auth
 *   POST   /api/sync/conflicts          — create, upsert, validation
 *   PUT    /api/sync/conflicts/:id      — resolve, 404, bad resolution
 *   DELETE /api/sync/conflicts/:id      — delete, 404
 *
 *   GET    /api/sync/test-results       — latest run, null when none, auth
 *   POST   /api/sync/test-results       — save run, count passed/failed
 *   PUT    /api/sync/test-results/:id   — update test status in run
 *
 *   GET    /api/sync/stats              — full stats object, post-seed values
 *
 * Auth: JWT required on all routes.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import Database from 'better-sqlite3';
import { mobileSyncRoutes } from '../routes/mobile-sync';

// ── App Factory ───────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  mobileSyncRoutes(app);
  return app;
}

// ── Request Helper ────────────────────────────────────────────────────────────

async function req(
  app: Hono,
  method: string,
  path: string,
  body?: unknown,
  token?: string
) {
  const init: RequestInit = { method };
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  init.headers = headers;
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── JWT Helpers ───────────────────────────────────────────────────────────────

const JWT_SECRET = 'safetymeg-jwt-secret-2025-change-in-production';

async function makeToken(userId: number): Promise<string> {
  return sign(
    { userId, email: `test-${userId}@example.com`, role: 'worker', exp: Math.floor(Date.now() / 1000) + 3600 },
    JWT_SECRET
  );
}

// ── Test IDs / User IDs ───────────────────────────────────────────────────────

const BASE_USER_ID = 910000 + (Date.now() % 9000);
const USER_A = BASE_USER_ID;
const USER_B = BASE_USER_ID + 1;

let tokenA: string;
let tokenB: string;

// Unique ID namespacing so parallel runs don't clash
const TAG = `msync-${Date.now()}`;

const sqlite = new Database('local.sqlite');

beforeAll(async () => {
  tokenA = await makeToken(USER_A);
  tokenB = await makeToken(USER_B);
});

afterAll(() => {
  sqlite.prepare(`DELETE FROM sync_queue WHERE user_id IN (?, ?)`).run(USER_A, USER_B);
  sqlite.prepare(`DELETE FROM sync_conflicts WHERE user_id IN (?, ?)`).run(USER_A, USER_B);
  sqlite.prepare(`DELETE FROM sync_test_runs WHERE user_id IN (?, ?)`).run(USER_A, USER_B);
  sqlite.close();
});

// ── Shared Queue + Conflict payloads ──────────────────────────────────────────

function makeQueueRecord(overrides: Record<string, any> = {}) {
  const id = `${TAG}-q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    entity: 'Incident Report',
    action: 'create',
    timestamp: '2026-02-21 10:00:00',
    data: { title: 'Test hazard', severity: 'low' },
    synced: false,
    conflicted: false,
    version: 1,
    ...overrides,
  };
}

function makeConflictRecord(overrides: Record<string, any> = {}) {
  const id = `${TAG}-c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    title: 'Test Conflict',
    description: 'Unit test conflict',
    localVersion: { field: 'local_value' },
    serverVersion: { field: 'server_value' },
    resolution: 'pending',
    resolved: false,
    ...overrides,
  };
}

function makeTestRun(statuses: Array<'passed' | 'failed' | 'pending'> = ['passed', 'passed', 'failed']) {
  return statuses.map((status, i) => ({
    id: `test-${i}`,
    name: `Test ${i}`,
    description: `Description ${i}`,
    status,
    duration: 100,
    error: status === 'failed' ? 'Assertion failed' : null,
    category: 'queue' as const,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC QUEUE
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/sync/queue', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no auth header', async () => {
    const { status, body } = await req(app, 'GET', '/api/sync/queue');
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 401 with invalid token', async () => {
    const { status, body } = await req(app, 'GET', '/api/sync/queue', undefined, 'bad.token.value');
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 200 and empty array for new user', async () => {
    const { status, body } = await req(app, 'GET', '/api/sync/queue', undefined, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('returns only records for the authenticated user', async () => {
    const appLocal = createTestApp();
    const recA = makeQueueRecord();
    // Post record for user A
    await req(appLocal, 'POST', '/api/sync/queue', recA, tokenA);
    // User B should not see user A's records
    const { body } = await req(appLocal, 'GET', '/api/sync/queue', undefined, tokenB);
    const ids = body.data.map((r: any) => r.id);
    expect(ids).not.toContain(recA.id);
  });

  it('returns records with expected camelCase fields', async () => {
    const appLocal = createTestApp();
    const rec = makeQueueRecord();
    await req(appLocal, 'POST', '/api/sync/queue', rec, tokenA);
    const { body } = await req(appLocal, 'GET', '/api/sync/queue', undefined, tokenA);
    const found = body.data.find((r: any) => r.id === rec.id);
    expect(found).toBeDefined();
    expect(found).toHaveProperty('id');
    expect(found).toHaveProperty('entity');
    expect(found).toHaveProperty('action');
    expect(found).toHaveProperty('timestamp');
    expect(found).toHaveProperty('data');
    expect(found).toHaveProperty('synced');
    expect(found).toHaveProperty('conflicted');
    expect(found).toHaveProperty('version');
  });
});

describe('POST /api/sync/queue', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'POST', '/api/sync/queue', makeQueueRecord());
    expect(status).toBe(401);
  });

  it('creates a queue record, returns 201', async () => {
    const rec = makeQueueRecord();
    const { status, body } = await req(app, 'POST', '/api/sync/queue', rec, tokenA);
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(rec.id);
  });

  it('upserts if record with same id already exists', async () => {
    const rec = makeQueueRecord({ entity: 'Original Entity' });
    await req(app, 'POST', '/api/sync/queue', rec, tokenA);
    const updated = { ...rec, entity: 'Updated Entity' };
    const { status, body } = await req(app, 'POST', '/api/sync/queue', updated, tokenA);
    expect(status).toBe(201);
    expect(body.data.entity).toBe('Updated Entity');
  });

  it('returns 400 when id is missing', async () => {
    const { id: _omit, ...noId } = makeQueueRecord();
    const { status, body } = await req(app, 'POST', '/api/sync/queue', noId, tokenA);
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid action value', async () => {
    const rec = makeQueueRecord({ action: 'invalid_action' });
    const { status, body } = await req(app, 'POST', '/api/sync/queue', rec, tokenA);
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for malformed JSON body', async () => {
    const res = await app.request('/api/sync/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: '{ not valid json {{',
    });
    expect(res.status).toBe(400);
  });

  it('stores nested data object correctly', async () => {
    const rec = makeQueueRecord({ data: { nested: { deep: true }, count: 5 } });
    await req(app, 'POST', '/api/sync/queue', rec, tokenA);
    const { body } = await req(app, 'GET', '/api/sync/queue', undefined, tokenA);
    const found = body.data.find((r: any) => r.id === rec.id);
    expect(found?.data?.nested?.deep).toBe(true);
    expect(found?.data?.count).toBe(5);
  });
});

describe('PUT /api/sync/queue/:id', () => {
  let app: Hono;
  let createdId: string;

  beforeAll(async () => {
    app = createTestApp();
    const rec = makeQueueRecord();
    createdId = rec.id;
    await req(app, 'POST', '/api/sync/queue', rec, tokenA);
  });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'PUT', `/api/sync/queue/${createdId}`, { synced: true });
    expect(status).toBe(401);
  });

  it('updates synced flag to true, returns 200', async () => {
    const { status, body } = await req(app, 'PUT', `/api/sync/queue/${createdId}`, { synced: true }, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.synced).toBe(true);
  });

  it('updates conflicted flag', async () => {
    const { body } = await req(app, 'PUT', `/api/sync/queue/${createdId}`, { conflicted: true }, tokenA);
    expect(body.data.conflicted).toBe(true);
  });

  it('updates version number', async () => {
    const { body } = await req(app, 'PUT', `/api/sync/queue/${createdId}`, { version: 7 }, tokenA);
    expect(body.data.version).toBe(7);
  });

  it('returns 404 for non-existent record', async () => {
    const { status, body } = await req(app, 'PUT', `/api/sync/queue/nonexistent-id-xyz`, { synced: true }, tokenA);
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 404 when accessing another user\'s record', async () => {
    // createdId belongs to tokenA; tokenB should get 404
    const { status } = await req(app, 'PUT', `/api/sync/queue/${createdId}`, { synced: true }, tokenB);
    expect(status).toBe(404);
  });
});

describe('DELETE /api/sync/queue/:id', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'DELETE', `/api/sync/queue/some-id`);
    expect(status).toBe(401);
  });

  it('deletes an existing record, returns 200', async () => {
    const rec = makeQueueRecord();
    await req(app, 'POST', '/api/sync/queue', rec, tokenA);
    const { status, body } = await req(app, 'DELETE', `/api/sync/queue/${rec.id}`, undefined, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 404 for already-deleted or non-existent id', async () => {
    const { status } = await req(app, 'DELETE', `/api/sync/queue/does-not-exist-xyz`, undefined, tokenA);
    expect(status).toBe(404);
  });

  it('does not delete another user\'s record', async () => {
    const rec = makeQueueRecord();
    await req(app, 'POST', '/api/sync/queue', rec, tokenA);
    const { status } = await req(app, 'DELETE', `/api/sync/queue/${rec.id}`, undefined, tokenB);
    expect(status).toBe(404);
    // Still accessible by owner
    const { body } = await req(app, 'GET', '/api/sync/queue', undefined, tokenA);
    const stillThere = body.data.find((r: any) => r.id === rec.id);
    expect(stillThere).toBeDefined();
  });
});

describe('POST /api/sync/queue/reset', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'POST', '/api/sync/queue/reset');
    expect(status).toBe(401);
  });

  it('returns 200 and seeds 7 default records', async () => {
    const { status, body } = await req(app, 'POST', '/api/sync/queue/reset', undefined, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.count).toBe(7);
  });

  it('queue contains exactly 7 records immediately after reset', async () => {
    await req(app, 'POST', '/api/sync/queue/reset', undefined, tokenA);
    const { body } = await req(app, 'GET', '/api/sync/queue', undefined, tokenA);
    expect(body.data.length).toBe(7);
  });

  it('reset for user A does not affect user B queue', async () => {
    // Seed a custom record for user B
    const recB = makeQueueRecord();
    await req(app, 'POST', '/api/sync/queue', recB, tokenB);
    // Reset user A
    await req(app, 'POST', '/api/sync/queue/reset', undefined, tokenA);
    // User B should still see their record
    const { body } = await req(app, 'GET', '/api/sync/queue', undefined, tokenB);
    const found = body.data.find((r: any) => r.id === recB.id);
    expect(found).toBeDefined();
  });

  it('seeded records include expected entities', async () => {
    await req(app, 'POST', '/api/sync/queue/reset', undefined, tokenA);
    const { body } = await req(app, 'GET', '/api/sync/queue', undefined, tokenA);
    const entities = body.data.map((r: any) => r.entity);
    expect(entities).toContain('Incident Report');
    expect(entities).toContain('Safety Inspection');
    expect(entities).toContain('Training Record');
    expect(entities).toContain('Hazard Assessment');
    expect(entities).toContain('Near Miss Report');
    expect(entities).toContain('CAPA Action');
    expect(entities).toContain('Audit Finding');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SYNC CONFLICTS
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/sync/conflicts', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no auth', async () => {
    const { status } = await req(app, 'GET', '/api/sync/conflicts');
    expect(status).toBe(401);
  });

  it('returns 200 and array for valid token', async () => {
    const { status, body } = await req(app, 'GET', '/api/sync/conflicts', undefined, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('does not cross-contaminate between users', async () => {
    const appLocal = createTestApp();
    const conflictA = makeConflictRecord({ title: 'Conflict for A only' });
    await req(appLocal, 'POST', '/api/sync/conflicts', conflictA, tokenA);
    const { body } = await req(appLocal, 'GET', '/api/sync/conflicts', undefined, tokenB);
    const ids = body.data.map((r: any) => r.id);
    expect(ids).not.toContain(conflictA.id);
  });

  it('response items have expected camelCase fields', async () => {
    const appLocal = createTestApp();
    const conf = makeConflictRecord();
    await req(appLocal, 'POST', '/api/sync/conflicts', conf, tokenA);
    const { body } = await req(appLocal, 'GET', '/api/sync/conflicts', undefined, tokenA);
    const found = body.data.find((r: any) => r.id === conf.id);
    expect(found).toBeDefined();
    expect(found).toHaveProperty('id');
    expect(found).toHaveProperty('title');
    expect(found).toHaveProperty('localVersion');
    expect(found).toHaveProperty('serverVersion');
    expect(found).toHaveProperty('resolution');
    expect(found).toHaveProperty('resolved');
  });
});

describe('POST /api/sync/conflicts', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'POST', '/api/sync/conflicts', makeConflictRecord());
    expect(status).toBe(401);
  });

  it('creates a conflict record, returns 201', async () => {
    const conf = makeConflictRecord();
    const { status, body } = await req(app, 'POST', '/api/sync/conflicts', conf, tokenA);
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(conf.id);
  });

  it('upserts when same id is POSTed twice', async () => {
    const conf = makeConflictRecord({ title: 'Original title' });
    await req(app, 'POST', '/api/sync/conflicts', conf, tokenA);
    const updated = { ...conf, title: 'Updated title' };
    const { body } = await req(app, 'POST', '/api/sync/conflicts', updated, tokenA);
    expect(body.data.title).toBe('Updated title');
  });

  it('returns 400 when title is missing', async () => {
    const { title: _omit, ...noTitle } = makeConflictRecord();
    const { status } = await req(app, 'POST', '/api/sync/conflicts', noTitle, tokenA);
    expect(status).toBe(400);
  });

  it('returns 400 when localVersion is missing', async () => {
    const { localVersion: _omit, ...noLV } = makeConflictRecord();
    const { status } = await req(app, 'POST', '/api/sync/conflicts', noLV, tokenA);
    expect(status).toBe(400);
  });

  it('returns 400 for malformed JSON body', async () => {
    const res = await app.request('/api/sync/conflicts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: 'broken { json',
    });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/sync/conflicts/:id', () => {
  let app: Hono;
  let conflictId: string;

  beforeAll(async () => {
    app = createTestApp();
    const conf = makeConflictRecord();
    conflictId = conf.id;
    await req(app, 'POST', '/api/sync/conflicts', conf, tokenA);
  });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'PUT', `/api/sync/conflicts/${conflictId}`, { resolution: 'local' });
    expect(status).toBe(401);
  });

  it('resolves conflict with "local", returns 200', async () => {
    const { status, body } = await req(app, 'PUT', `/api/sync/conflicts/${conflictId}`, { resolution: 'local' }, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.resolution).toBe('local');
    expect(body.data.resolved).toBe(true);
  });

  it('resolves conflict with "server"', async () => {
    const conf = makeConflictRecord();
    await req(app, 'POST', '/api/sync/conflicts', conf, tokenA);
    const { body } = await req(app, 'PUT', `/api/sync/conflicts/${conf.id}`, { resolution: 'server' }, tokenA);
    expect(body.data.resolution).toBe('server');
    expect(body.data.resolved).toBe(true);
  });

  it('resolves conflict with "merged"', async () => {
    const conf = makeConflictRecord();
    await req(app, 'POST', '/api/sync/conflicts', conf, tokenA);
    const { body } = await req(app, 'PUT', `/api/sync/conflicts/${conf.id}`, { resolution: 'merged' }, tokenA);
    expect(body.data.resolution).toBe('merged');
  });

  it('returns 400 for invalid resolution value', async () => {
    const conf = makeConflictRecord();
    await req(app, 'POST', '/api/sync/conflicts', conf, tokenA);
    const { status } = await req(app, 'PUT', `/api/sync/conflicts/${conf.id}`, { resolution: 'overwrite' }, tokenA);
    expect(status).toBe(400);
  });

  it('returns 404 for non-existent conflict', async () => {
    const { status } = await req(app, 'PUT', `/api/sync/conflicts/no-such-id`, { resolution: 'local' }, tokenA);
    expect(status).toBe(404);
  });

  it('returns 404 when another user tries to resolve', async () => {
    const { status } = await req(app, 'PUT', `/api/sync/conflicts/${conflictId}`, { resolution: 'local' }, tokenB);
    expect(status).toBe(404);
  });
});

describe('DELETE /api/sync/conflicts/:id', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'DELETE', '/api/sync/conflicts/any-id');
    expect(status).toBe(401);
  });

  it('deletes a conflict, returns 200', async () => {
    const conf = makeConflictRecord();
    await req(app, 'POST', '/api/sync/conflicts', conf, tokenA);
    const { status, body } = await req(app, 'DELETE', `/api/sync/conflicts/${conf.id}`, undefined, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 404 for already-deleted id', async () => {
    const { status } = await req(app, 'DELETE', `/api/sync/conflicts/non-existent-conf`, undefined, tokenA);
    expect(status).toBe(404);
  });

  it('does not allow deleting another user\'s conflict', async () => {
    const conf = makeConflictRecord();
    await req(app, 'POST', '/api/sync/conflicts', conf, tokenA);
    const { status } = await req(app, 'DELETE', `/api/sync/conflicts/${conf.id}`, undefined, tokenB);
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SYNC TEST RUNS
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/sync/test-results', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'GET', '/api/sync/test-results');
    expect(status).toBe(401);
  });

  it('returns null data when no runs exist for user', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 50);
    const { status, body } = await req(app, 'GET', '/api/sync/test-results', undefined, freshToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  it('returns latest run after a POST save', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 51);
    const results = makeTestRun(['passed', 'passed', 'failed']);
    await req(app, 'POST', '/api/sync/test-results', { results }, freshToken);
    const { body } = await req(app, 'GET', '/api/sync/test-results', undefined, freshToken);
    expect(body.success).toBe(true);
    expect(body.data).not.toBeNull();
    expect(body.data.passed).toBe(2);
    expect(body.data.failed).toBe(1);
    expect(body.data.total).toBe(3);
    expect(Array.isArray(body.data.results)).toBe(true);
  });
});

describe('POST /api/sync/test-results', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const results = makeTestRun();
    const { status } = await req(app, 'POST', '/api/sync/test-results', { results });
    expect(status).toBe(401);
  });

  it('saves a run, returns 201 with correct counts', async () => {
    const results = makeTestRun(['passed', 'passed', 'passed', 'failed']);
    const { status, body } = await req(app, 'POST', '/api/sync/test-results', { results }, tokenA);
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.passed).toBe(3);
    expect(body.data.failed).toBe(1);
    expect(body.data.total).toBe(4);
  });

  it('returns 400 when results array is empty', async () => {
    const { status } = await req(app, 'POST', '/api/sync/test-results', { results: [] }, tokenA);
    expect(status).toBe(400);
  });

  it('returns 400 when results is missing', async () => {
    const { status } = await req(app, 'POST', '/api/sync/test-results', {}, tokenA);
    expect(status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await app.request('/api/sync/test-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: '{{bad}}',
    });
    expect(res.status).toBe(400);
  });

  it('counts only passed/failed items correctly when all pending', async () => {
    const results = makeTestRun(['pending', 'pending', 'pending']);
    const { body } = await req(app, 'POST', '/api/sync/test-results', { results }, tokenA);
    expect(body.data.passed).toBe(0);
    expect(body.data.failed).toBe(0);
    expect(body.data.total).toBe(3);
  });
});

describe('PUT /api/sync/test-results/:id', () => {
  let app: Hono;
  let runId: number;

  beforeAll(async () => {
    app = createTestApp();
    const results = makeTestRun(['pending', 'pending', 'pending']);
    const { body } = await req(app, 'POST', '/api/sync/test-results', { results }, tokenA);
    runId = body.data.id;
  });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'PUT', `/api/sync/test-results/${runId}`, { testId: 'test-0', status: 'passed' });
    expect(status).toBe(401);
  });

  it('updates a test to passed, returns 200', async () => {
    const { status, body } = await req(app, 'PUT', `/api/sync/test-results/${runId}`,
      { testId: 'test-0', status: 'passed', duration: 120 }, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.passed).toBe(1);
  });

  it('updates a test to failed with error message', async () => {
    const { body } = await req(app, 'PUT', `/api/sync/test-results/${runId}`,
      { testId: 'test-1', status: 'failed', duration: 50, error: 'Timeout' }, tokenA);
    expect(body.data.failed).toBe(1);
    const failedTest = body.data.results.find((r: any) => r.id === 'test-1');
    expect(failedTest?.error).toBe('Timeout');
  });

  it('returns 400 for invalid run id (non-numeric)', async () => {
    const { status } = await req(app, 'PUT', `/api/sync/test-results/notanid`,
      { testId: 'test-0', status: 'passed' }, tokenA);
    expect(status).toBe(400);
  });

  it('returns 404 for non-existent run id', async () => {
    const { status } = await req(app, 'PUT', `/api/sync/test-results/99999999`,
      { testId: 'test-0', status: 'passed' }, tokenA);
    expect(status).toBe(404);
  });

  it('returns 404 when testId does not exist in the run', async () => {
    const { status } = await req(app, 'PUT', `/api/sync/test-results/${runId}`,
      { testId: 'test-999', status: 'passed' }, tokenA);
    expect(status).toBe(404);
  });

  it('returns 404 when another user tries to update', async () => {
    const { status } = await req(app, 'PUT', `/api/sync/test-results/${runId}`,
      { testId: 'test-0', status: 'passed' }, tokenB);
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/sync/stats', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'GET', '/api/sync/stats');
    expect(status).toBe(401);
  });

  it('returns stats object with queue, conflicts, tests keys', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 60);
    const { status, body } = await req(app, 'GET', '/api/sync/stats', undefined, freshToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('queue');
    expect(body.data).toHaveProperty('conflicts');
    expect(body.data).toHaveProperty('tests');
  });

  it('queue stats have total, pending, synced', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 61);
    const { body } = await req(app, 'GET', '/api/sync/stats', undefined, freshToken);
    expect(body.data.queue).toHaveProperty('total');
    expect(body.data.queue).toHaveProperty('pending');
    expect(body.data.queue).toHaveProperty('synced');
  });

  it('conflicts stats have unresolved', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 62);
    const { body } = await req(app, 'GET', '/api/sync/stats', undefined, freshToken);
    expect(body.data.conflicts).toHaveProperty('unresolved');
  });

  it('tests stats have passed, failed, total', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 63);
    const { body } = await req(app, 'GET', '/api/sync/stats', undefined, freshToken);
    expect(body.data.tests).toHaveProperty('passed');
    expect(body.data.tests).toHaveProperty('failed');
    expect(body.data.tests).toHaveProperty('total');
  });

  it('queue totals are accurate after adding records', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 64);
    const appLocal = createTestApp();
    // Add 2 synced, 1 pending
    await req(appLocal, 'POST', '/api/sync/queue', makeQueueRecord({ synced: true }),  freshToken);
    await req(appLocal, 'POST', '/api/sync/queue', makeQueueRecord({ synced: true }),  freshToken);
    await req(appLocal, 'POST', '/api/sync/queue', makeQueueRecord({ synced: false }), freshToken);

    const { body } = await req(appLocal, 'GET', '/api/sync/stats', undefined, freshToken);
    expect(body.data.queue.total).toBe(3);
    expect(body.data.queue.synced).toBe(2);
    expect(body.data.queue.pending).toBe(1);
  });

  it('conflict unresolved count decreases after resolution', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 65);
    const appLocal = createTestApp();
    const conf = makeConflictRecord();
    await req(appLocal, 'POST', '/api/sync/conflicts', conf, freshToken);

    const { body: before } = await req(appLocal, 'GET', '/api/sync/stats', undefined, freshToken);
    const unresolvedBefore = before.data.conflicts.unresolved;

    await req(appLocal, 'PUT', `/api/sync/conflicts/${conf.id}`, { resolution: 'local' }, freshToken);

    const { body: after } = await req(appLocal, 'GET', '/api/sync/stats', undefined, freshToken);
    expect(after.data.conflicts.unresolved).toBe(unresolvedBefore - 1);
  });

  it('tests stats reflect last saved run', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 66);
    const appLocal = createTestApp();
    const results = makeTestRun(['passed', 'passed', 'passed', 'failed', 'failed']);
    await req(appLocal, 'POST', '/api/sync/test-results', { results }, freshToken);

    const { body } = await req(appLocal, 'GET', '/api/sync/stats', undefined, freshToken);
    expect(body.data.tests.passed).toBe(3);
    expect(body.data.tests.failed).toBe(2);
    expect(body.data.tests.total).toBe(5);
  });
});
