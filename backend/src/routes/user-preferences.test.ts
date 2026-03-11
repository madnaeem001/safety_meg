/**
 * User Preferences Routes Test Suite
 *
 * Covers:
 *   GET  /api/user-preferences  — returns saved language (or default 'en')
 *   PUT  /api/user-preferences  — upserts preference; validates language code
 *
 * Auth: all routes require a valid JWT Bearer token.
 * Test tokens are signed with the same JWT_SECRET used by the route.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import Database from 'better-sqlite3';
import { userPreferencesRoutes } from '../routes/user-preferences';

// ── App Factory ──────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  userPreferencesRoutes(app);
  return app;
}

// ── Request Helper ───────────────────────────────────────────────────────────

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

// ── JWT helpers ──────────────────────────────────────────────────────────────

const JWT_SECRET = 'safetymeg-jwt-secret-2025-change-in-production';

async function makeToken(userId: number): Promise<string> {
  return sign(
    { userId, email: `test-${userId}@example.com`, role: 'worker', exp: Math.floor(Date.now() / 1000) + 3600 },
    JWT_SECRET
  );
}

// ── Seed / Cleanup ───────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');

// Unique userId range for this test run so we don't clash with real users
const BASE_USER_ID = 900000 + (Date.now() % 10000);

afterAll(() => {
  sqlite.prepare(`DELETE FROM user_preferences WHERE user_id >= ? AND user_id < ?`)
    .run(BASE_USER_ID, BASE_USER_ID + 100);
  sqlite.close();
});

// ── 1. GET /api/user-preferences ─────────────────────────────────────────────

describe('GET /api/user-preferences', () => {
  it('returns 401 when no Authorization header', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/user-preferences');
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 401 for invalid token', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/user-preferences', undefined, 'bad.token.here');
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns default language "en" for a new user (no DB record)', async () => {
    const app = createTestApp();
    const token = await makeToken(BASE_USER_ID + 1);
    const { status, body } = await req(app, 'GET', '/api/user-preferences', undefined, token);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.preferredLanguage).toBe('en');
  });

  it('returns previously saved language after PUT', async () => {
    const app = createTestApp();
    const userId = BASE_USER_ID + 2;
    const token = await makeToken(userId);
    await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: 'fr' }, token);
    const { status, body } = await req(app, 'GET', '/api/user-preferences', undefined, token);
    expect(status).toBe(200);
    expect(body.data.preferredLanguage).toBe('fr');
  });

  it('response has success: true with data object', async () => {
    const app = createTestApp();
    const token = await makeToken(BASE_USER_ID + 3);
    const { body } = await req(app, 'GET', '/api/user-preferences', undefined, token);
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('preferredLanguage');
  });
});

// ── 2. PUT /api/user-preferences ─────────────────────────────────────────────

describe('PUT /api/user-preferences', () => {
  it('returns 401 when no Authorization header', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: 'es' });
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 401 for invalid token', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: 'es' }, 'not.valid.jwt');
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('saves "en" successfully', async () => {
    const app = createTestApp();
    const token = await makeToken(BASE_USER_ID + 10);
    const { status, body } = await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: 'en' }, token);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.preferredLanguage).toBe('en');
  });

  it('saves "es" successfully', async () => {
    const app = createTestApp();
    const token = await makeToken(BASE_USER_ID + 11);
    const { status, body } = await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: 'es' }, token);
    expect(status).toBe(200);
    expect(body.data.preferredLanguage).toBe('es');
  });

  it('saves "fr" successfully', async () => {
    const app = createTestApp();
    const token = await makeToken(BASE_USER_ID + 12);
    const { status, body } = await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: 'fr' }, token);
    expect(status).toBe(200);
    expect(body.data.preferredLanguage).toBe('fr');
  });

  it('upserts — second PUT overwrites the first', async () => {
    const app = createTestApp();
    const userId = BASE_USER_ID + 20;
    const token = await makeToken(userId);
    await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: 'en' }, token);
    await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: 'fr' }, token);
    const { body } = await req(app, 'GET', '/api/user-preferences', undefined, token);
    expect(body.data.preferredLanguage).toBe('fr');
  });

  it('persists to DB (verified via direct SQLite query)', async () => {
    const app = createTestApp();
    const userId = BASE_USER_ID + 21;
    const token = await makeToken(userId);
    await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: 'es' }, token);
    const row = sqlite.prepare(
      'SELECT preferred_language FROM user_preferences WHERE user_id = ?'
    ).get(userId) as any;
    expect(row?.preferred_language).toBe('es');
  });

  it('returns 400 for unsupported language code', async () => {
    const app = createTestApp();
    const token = await makeToken(BASE_USER_ID + 30);
    const { status, body } = await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: 'de' }, token);
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for empty language string', async () => {
    const app = createTestApp();
    const token = await makeToken(BASE_USER_ID + 31);
    const { status, body } = await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: '' }, token);
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when preferredLanguage field is missing', async () => {
    const app = createTestApp();
    const token = await makeToken(BASE_USER_ID + 32);
    const { status, body } = await req(app, 'PUT', '/api/user-preferences', {}, token);
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid JSON body', async () => {
    const app = createTestApp();
    const token = await makeToken(BASE_USER_ID + 33);
    const res = await app.request('/api/user-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: 'not-json',
    });
    const body = await res.json() as any;
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ── 3. Schema Verification ───────────────────────────────────────────────────

describe('user_preferences schema verification', () => {
  it('user_preferences table exists after init', () => {
    const row = sqlite.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='user_preferences'"
    ).get();
    expect(row).toBeDefined();
  });

  it('table has all required columns', () => {
    const cols = sqlite.prepare('PRAGMA table_info(user_preferences)').all() as any[];
    const names = cols.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('user_id');
    expect(names).toContain('preferred_language');
    expect(names).toContain('updated_at');
  });

  it('user_id column has UNIQUE constraint', () => {
    const indexes = sqlite.prepare(
      "SELECT * FROM sqlite_master WHERE type='index' AND tbl_name='user_preferences'"
    ).all() as any[];
    // Either UNIQUE on column or a unique index
    const cols = sqlite.prepare('PRAGMA table_info(user_preferences)').all() as any[];
    const userIdCol = cols.find((c: any) => c.name === 'user_id');
    // The UNIQUE constraint can be expressed via index; verify by trying a duplicate insert
    const userId = BASE_USER_ID + 50;
    const ts = Math.floor(Date.now() / 1000);
    sqlite.prepare('INSERT OR IGNORE INTO user_preferences (user_id, preferred_language, updated_at) VALUES (?, ?, ?)').run(userId, 'en', ts);
    expect(() => {
      sqlite.prepare('INSERT INTO user_preferences (user_id, preferred_language, updated_at) VALUES (?, ?, ?)').run(userId, 'fr', ts);
    }).toThrow();
  });

  it('preferred_language defaults to "en"', () => {
    const userId = BASE_USER_ID + 51;
    const ts = Math.floor(Date.now() / 1000);
    sqlite.prepare('INSERT INTO user_preferences (user_id, updated_at) VALUES (?, ?)').run(userId, ts);
    const row = sqlite.prepare('SELECT preferred_language FROM user_preferences WHERE user_id = ?').get(userId) as any;
    expect(row?.preferred_language).toBe('en');
  });
});

// ── 4. Round-trip integration ────────────────────────────────────────────────

describe('round-trip: save then load', () => {
  it('GET returns exactly what PUT saved — "es"', async () => {
    const app = createTestApp();
    const userId = BASE_USER_ID + 60;
    const token = await makeToken(userId);
    await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: 'es' }, token);
    const { body } = await req(app, 'GET', '/api/user-preferences', undefined, token);
    expect(body.data.preferredLanguage).toBe('es');
  });

  it('GET returns exactly what PUT saved — "fr"', async () => {
    const app = createTestApp();
    const userId = BASE_USER_ID + 61;
    const token = await makeToken(userId);
    await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: 'fr' }, token);
    const { body } = await req(app, 'GET', '/api/user-preferences', undefined, token);
    expect(body.data.preferredLanguage).toBe('fr');
  });

  it('different users have independent preferences', async () => {
    const app = createTestApp();
    const [t1, t2] = await Promise.all([makeToken(BASE_USER_ID + 62), makeToken(BASE_USER_ID + 63)]);
    await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: 'en' }, t1);
    await req(app, 'PUT', '/api/user-preferences', { preferredLanguage: 'fr' }, t2);
    const [r1, r2] = await Promise.all([
      req(app, 'GET', '/api/user-preferences', undefined, t1),
      req(app, 'GET', '/api/user-preferences', undefined, t2),
    ]);
    expect(r1.body.data.preferredLanguage).toBe('en');
    expect(r2.body.data.preferredLanguage).toBe('fr');
  });
});
