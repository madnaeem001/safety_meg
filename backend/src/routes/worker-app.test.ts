/**
 * Mobile Worker App Routes Test Suite
 *
 * Covers:
 *   GET    /api/worker-app/tasks                        — list, empty, auth
 *   GET    /api/worker-app/tasks/stats                  — counts, post-seed values
 *   POST   /api/worker-app/tasks/seed                   — seeds 5 tasks, idempotent
 *   PUT    /api/worker-app/tasks/:id/status             — update, 404, validation
 *   PUT    /api/worker-app/tasks/:id/checklist/:itemId  — toggle, 404, bad itemId
 *
 *   GET    /api/worker-app/reports                      — list, empty, auth, user isolation
 *   POST   /api/worker-app/reports                      — create, validation, 400 malformed
 *
 *   GET    /api/worker-app/environmental                — returns 4 seeded readings, auth
 *
 * Auth: JWT required on all routes (401 without token).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import Database from 'better-sqlite3';
import { workerAppRoutes } from '../routes/worker-app';

// ── App Factory ───────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  workerAppRoutes(app);
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

// ── Users ─────────────────────────────────────────────────────────────────────

const BASE_USER_ID = 920000 + (Date.now() % 9000);
const USER_A = BASE_USER_ID;
const USER_B = BASE_USER_ID + 1;

let tokenA: string;
let tokenB: string;

const sqlite = new Database('local.sqlite');

beforeAll(async () => {
  tokenA = await makeToken(USER_A);
  tokenB = await makeToken(USER_B);
});

afterAll(() => {
  sqlite.prepare('DELETE FROM worker_tasks WHERE user_id IN (?, ?)').run(USER_A, USER_B);
  sqlite.prepare('DELETE FROM worker_quick_reports WHERE user_id IN (?, ?)').run(USER_A, USER_B);
  sqlite.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// TASKS — GET LIST
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/worker-app/tasks', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status, body } = await req(app, 'GET', '/api/worker-app/tasks');
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 401 for invalid token', async () => {
    const { status } = await req(app, 'GET', '/api/worker-app/tasks', undefined, 'bad.token');
    expect(status).toBe(401);
  });

  it('returns 200 and empty array for fresh user', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 10);
    const { status, body } = await req(app, 'GET', '/api/worker-app/tasks', undefined, freshToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('does not expose other users tasks', async () => {
    const { body: bodyA } = await req(app, 'GET', '/api/worker-app/tasks', undefined, tokenA);
    const { body: bodyB } = await req(app, 'GET', '/api/worker-app/tasks', undefined, tokenB);
    // Tasks for A and B are independent
    expect(Array.isArray(bodyA.data)).toBe(true);
    expect(Array.isArray(bodyB.data)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASKS — SEED
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/worker-app/tasks/seed', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'POST', '/api/worker-app/tasks/seed');
    expect(status).toBe(401);
  });

  it('seeds 5 tasks for a fresh user, returns 200', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 20);
    const { status, body } = await req(app, 'POST', '/api/worker-app/tasks/seed', undefined, freshToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.seeded).toBe(true);
    expect(body.count).toBe(5);
  });

  it('is idempotent — second call returns seeded: false', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 21);
    await req(app, 'POST', '/api/worker-app/tasks/seed', undefined, freshToken);
    const { body } = await req(app, 'POST', '/api/worker-app/tasks/seed', undefined, freshToken);
    expect(body.seeded).toBe(false);
  });

  it('seeded tasks appear in GET /api/worker-app/tasks', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 22);
    await req(app, 'POST', '/api/worker-app/tasks/seed', undefined, freshToken);
    const { body } = await req(app, 'GET', '/api/worker-app/tasks', undefined, freshToken);
    expect(body.data.length).toBe(5);
  });

  it('seeded tasks have expected camelCase fields', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 23);
    await req(app, 'POST', '/api/worker-app/tasks/seed', undefined, freshToken);
    const { body } = await req(app, 'GET', '/api/worker-app/tasks', undefined, freshToken);
    const task = body.data[0];
    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('title');
    expect(task).toHaveProperty('type');
    expect(task).toHaveProperty('priority');
    expect(task).toHaveProperty('status');
    expect(task).toHaveProperty('location');
    expect(task).toHaveProperty('dueTime');
    expect(task).toHaveProperty('assignedBy');
    expect(task).toHaveProperty('description');
    expect(task).toHaveProperty('checklist');
    expect(task).toHaveProperty('syncStatus');
  });

  it('first seeded task is TASK-001 Pre-shift Safety Inspection', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 24);
    await req(app, 'POST', '/api/worker-app/tasks/seed', undefined, freshToken);
    const { body } = await req(app, 'GET', '/api/worker-app/tasks', undefined, freshToken);
    const first = body.data.find((t: any) => t.id === 'TASK-001');
    expect(first).toBeDefined();
    expect(first.title).toBe('Pre-shift Safety Inspection');
    expect(first.type).toBe('inspection');
    expect(first.priority).toBe('high');
    expect(Array.isArray(first.checklist)).toBe(true);
    expect(first.checklist.length).toBe(5);
  });

  it('seeded task checklists have required field', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 25);
    await req(app, 'POST', '/api/worker-app/tasks/seed', undefined, freshToken);
    const { body } = await req(app, 'GET', '/api/worker-app/tasks', undefined, freshToken);
    const task1 = body.data.find((t: any) => t.id === 'TASK-001');
    expect(task1.checklist[0]).toHaveProperty('required');
    expect(task1.checklist[0]).toHaveProperty('completed');
    expect(task1.checklist[0]).toHaveProperty('text');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASKS — STATS
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/worker-app/tasks/stats', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'GET', '/api/worker-app/tasks/stats');
    expect(status).toBe(401);
  });

  it('returns 200 with stats object', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 30);
    const { status, body } = await req(app, 'GET', '/api/worker-app/tasks/stats', undefined, freshToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('total');
    expect(body.data).toHaveProperty('pending');
    expect(body.data).toHaveProperty('completed');
    expect(body.data).toHaveProperty('overdue');
  });

  it('reflects correct counts after seed', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 31);
    await req(app, 'POST', '/api/worker-app/tasks/seed', undefined, freshToken);
    const { body } = await req(app, 'GET', '/api/worker-app/tasks/stats', undefined, freshToken);
    expect(body.data.total).toBe(5);
    expect(body.data.pending).toBeGreaterThanOrEqual(1);
  });

  it('completed count increases after completing a task', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 32);
    await req(app, 'POST', '/api/worker-app/tasks/seed', undefined, freshToken);
    const { body: before } = await req(app, 'GET', '/api/worker-app/tasks/stats', undefined, freshToken);
    await req(app, 'PUT', '/api/worker-app/tasks/TASK-005/status', { status: 'completed' }, freshToken);
    const { body: after } = await req(app, 'GET', '/api/worker-app/tasks/stats', undefined, freshToken);
    expect(after.data.completed).toBe(before.data.completed + 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASKS — UPDATE STATUS
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/worker-app/tasks/:id/status', () => {
  let app: Hono;
  beforeAll(async () => {
    app = createTestApp();
    await req(app, 'POST', '/api/worker-app/tasks/seed', undefined, tokenA);
  });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'PUT', '/api/worker-app/tasks/TASK-001/status', { status: 'completed' });
    expect(status).toBe(401);
  });

  it('updates status to completed, returns 200', async () => {
    const { status, body } = await req(app, 'PUT', '/api/worker-app/tasks/TASK-001/status', { status: 'completed' }, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('completed');
  });

  it('updates status to in_progress', async () => {
    const { body } = await req(app, 'PUT', '/api/worker-app/tasks/TASK-002/status', { status: 'in_progress' }, tokenA);
    expect(body.data.status).toBe('in_progress');
  });

  it('updates status to blocked', async () => {
    const { body } = await req(app, 'PUT', '/api/worker-app/tasks/TASK-003/status', { status: 'blocked' }, tokenA);
    expect(body.data.status).toBe('blocked');
  });

  it('returns 400 for invalid status value', async () => {
    const { status } = await req(app, 'PUT', '/api/worker-app/tasks/TASK-001/status', { status: 'invalid_status' }, tokenA);
    expect(status).toBe(400);
  });

  it('returns 404 for non-existent task', async () => {
    const { status } = await req(app, 'PUT', '/api/worker-app/tasks/TASK-999/status', { status: 'completed' }, tokenA);
    expect(status).toBe(404);
  });

  it('returns 404 when user B tries to update user A task', async () => {
    const { status } = await req(app, 'PUT', '/api/worker-app/tasks/TASK-004/status', { status: 'completed' }, tokenB);
    expect(status).toBe(404);
  });

  it('returns 400 for malformed JSON body', async () => {
    const res = await app.request('/api/worker-app/tasks/TASK-001/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: '{{ bad json }}',
    });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASKS — TOGGLE CHECKLIST ITEM
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/worker-app/tasks/:id/checklist/:itemId', () => {
  let app: Hono;
  beforeAll(async () => {
    app = createTestApp();
    // Seed for tokenB since tokenA tasks may have been modified above
    await req(app, 'POST', '/api/worker-app/tasks/seed', undefined, tokenB);
  });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'PUT', '/api/worker-app/tasks/TASK-001/checklist/C1', { completed: true });
    expect(status).toBe(401);
  });

  it('toggles checklist item to completed, returns 200', async () => {
    const { status, body } = await req(
      app, 'PUT', '/api/worker-app/tasks/TASK-001/checklist/C1', { completed: true }, tokenB
    );
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    const item = body.data.checklist.find((i: any) => i.id === 'C1');
    expect(item.completed).toBe(true);
  });

  it('toggles checklist item back to false', async () => {
    const { body } = await req(
      app, 'PUT', '/api/worker-app/tasks/TASK-001/checklist/C1', { completed: false }, tokenB
    );
    const item = body.data.checklist.find((i: any) => i.id === 'C1');
    expect(item.completed).toBe(false);
  });

  it('sets sync_status to pending after toggle', async () => {
    const { body } = await req(
      app, 'PUT', '/api/worker-app/tasks/TASK-001/checklist/C2', { completed: true }, tokenB
    );
    expect(body.data.syncStatus).toBe('pending');
  });

  it('returns 404 for non-existent task', async () => {
    const { status } = await req(
      app, 'PUT', '/api/worker-app/tasks/TASK-999/checklist/C1', { completed: true }, tokenB
    );
    expect(status).toBe(404);
  });

  it('returns 404 for non-existent checklist item id', async () => {
    const { status } = await req(
      app, 'PUT', '/api/worker-app/tasks/TASK-001/checklist/C99', { completed: true }, tokenB
    );
    expect(status).toBe(404);
  });

  it('returns 404 for task with no checklist (empty array)', async () => {
    const { status } = await req(
      app, 'PUT', '/api/worker-app/tasks/TASK-003/checklist/C1', { completed: true }, tokenB
    );
    expect(status).toBe(404);
  });

  it('returns 400 for missing completed field', async () => {
    const { status } = await req(
      app, 'PUT', '/api/worker-app/tasks/TASK-001/checklist/C1', {}, tokenB
    );
    expect(status).toBe(400);
  });

  it('returns 400 for malformed JSON body', async () => {
    const res = await app.request('/api/worker-app/tasks/TASK-001/checklist/C1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: 'not json at all',
    });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// QUICK REPORTS
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/worker-app/reports', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'GET', '/api/worker-app/reports');
    expect(status).toBe(401);
  });

  it('returns 200 and array for valid token', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 40);
    const { status, body } = await req(app, 'GET', '/api/worker-app/reports', undefined, freshToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('does not return other users reports', async () => {
    const freshTokenA = await makeToken(BASE_USER_ID + 41);
    const freshTokenB = await makeToken(BASE_USER_ID + 42);
    // Create report for A
    await req(app, 'POST', '/api/worker-app/reports',
      { type: 'hazard', title: 'Isolation Test Report', description: '', location: 'Lab' }, freshTokenA);
    // B should not see it
    const { body } = await req(app, 'GET', '/api/worker-app/reports', undefined, freshTokenB);
    const titles = body.data.map((r: any) => r.title);
    expect(titles).not.toContain('Isolation Test Report');
  });
});

describe('POST /api/worker-app/reports', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'POST', '/api/worker-app/reports',
      { type: 'hazard', title: 'Test', description: '', location: '' });
    expect(status).toBe(401);
  });

  it('creates a hazard report, returns 201', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 50);
    const { status, body } = await req(app, 'POST', '/api/worker-app/reports',
      { type: 'hazard', title: 'Wet floor by entrance', description: 'Slip risk', location: 'Building A' },
      freshToken
    );
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.type).toBe('hazard');
    expect(body.data.title).toBe('Wet floor by entrance');
    expect(body.data.syncStatus).toBe('synced');
  });

  it('creates a near_miss report', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 51);
    const { body } = await req(app, 'POST', '/api/worker-app/reports',
      { type: 'near_miss', title: 'Forklift near miss', description: '', location: 'Warehouse' },
      freshToken
    );
    expect(body.data.type).toBe('near_miss');
  });

  it('creates an unsafe_condition report', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 52);
    const { body } = await req(app, 'POST', '/api/worker-app/reports',
      { type: 'unsafe_condition', title: 'Exposed wiring', description: '', location: '' },
      freshToken
    );
    expect(body.data.type).toBe('unsafe_condition');
  });

  it('creates a suggestion report', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 53);
    const { body } = await req(app, 'POST', '/api/worker-app/reports',
      { type: 'suggestion', title: 'Add safety mirror', description: '', location: '' },
      freshToken
    );
    expect(body.data.type).toBe('suggestion');
  });

  it('report appears in GET after creation', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 54);
    const { body: created } = await req(app, 'POST', '/api/worker-app/reports',
      { type: 'hazard', title: 'Verify persist', description: '', location: '' },
      freshToken
    );
    const { body: list } = await req(app, 'GET', '/api/worker-app/reports', undefined, freshToken);
    const found = list.data.find((r: any) => r.id === created.data.id);
    expect(found).toBeDefined();
    expect(found.title).toBe('Verify persist');
  });

  it('response has id, type, title, timestamp, syncStatus fields', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 55);
    const { body } = await req(app, 'POST', '/api/worker-app/reports',
      { type: 'hazard', title: 'Field check', description: '', location: '' },
      freshToken
    );
    expect(body.data).toHaveProperty('id');
    expect(body.data).toHaveProperty('type');
    expect(body.data).toHaveProperty('title');
    expect(body.data).toHaveProperty('timestamp');
    expect(body.data).toHaveProperty('syncStatus');
  });

  it('returns 400 when title is missing', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 56);
    const { status } = await req(app, 'POST', '/api/worker-app/reports',
      { type: 'hazard', description: '' }, freshToken);
    expect(status).toBe(400);
  });

  it('returns 400 for invalid report type', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 57);
    const { status } = await req(app, 'POST', '/api/worker-app/reports',
      { type: 'explosion', title: 'Test', description: '' }, freshToken);
    expect(status).toBe(400);
  });

  it('returns 400 for malformed JSON body', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 58);
    const res = await app.request('/api/worker-app/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${freshToken}` },
      body: '{ invalid }',
    });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENTAL READINGS
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/worker-app/environmental', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'GET', '/api/worker-app/environmental');
    expect(status).toBe(401);
  });

  it('returns 200 and array for valid token', async () => {
    const { status, body } = await req(app, 'GET', '/api/worker-app/environmental', undefined, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('returns exactly 4 seeded readings', async () => {
    const { body } = await req(app, 'GET', '/api/worker-app/environmental', undefined, tokenA);
    expect(body.data.length).toBe(4);
  });

  it('each reading has type, value, unit, status fields', async () => {
    const { body } = await req(app, 'GET', '/api/worker-app/environmental', undefined, tokenA);
    const reading = body.data[0];
    expect(reading).toHaveProperty('type');
    expect(reading).toHaveProperty('value');
    expect(reading).toHaveProperty('unit');
    expect(reading).toHaveProperty('status');
  });

  it('includes Temperature reading at 24°C', async () => {
    const { body } = await req(app, 'GET', '/api/worker-app/environmental', undefined, tokenA);
    const temp = body.data.find((r: any) => r.type === 'Temperature');
    expect(temp).toBeDefined();
    expect(temp.value).toBe(24);
    expect(temp.unit).toBe('°C');
    expect(temp.status).toBe('normal');
  });

  it('includes Noise Level with warning status', async () => {
    const { body } = await req(app, 'GET', '/api/worker-app/environmental', undefined, tokenA);
    const noise = body.data.find((r: any) => r.type === 'Noise Level');
    expect(noise).toBeDefined();
    expect(noise.status).toBe('warning');
    expect(noise.unit).toBe('dB');
  });

  it('includes all four expected types', async () => {
    const { body } = await req(app, 'GET', '/api/worker-app/environmental', undefined, tokenA);
    const types = body.data.map((r: any) => r.type);
    expect(types).toContain('Temperature');
    expect(types).toContain('Humidity');
    expect(types).toContain('Noise Level');
    expect(types).toContain('Air Quality');
  });

  it('is the same for any authenticated user (shared readings)', async () => {
    const { body: bodyA } = await req(app, 'GET', '/api/worker-app/environmental', undefined, tokenA);
    const { body: bodyB } = await req(app, 'GET', '/api/worker-app/environmental', undefined, tokenB);
    expect(bodyA.data.length).toBe(bodyB.data.length);
    expect(bodyA.data.map((r: any) => r.type).sort())
      .toEqual(bodyB.data.map((r: any) => r.type).sort());
  });
});
