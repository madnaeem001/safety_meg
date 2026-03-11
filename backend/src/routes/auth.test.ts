/**
 * Auth Routes Test Suite
 *
 * Covers every endpoint that LoginPage.tsx + its authStore depend on:
 *
 *   POST  /api/auth/login            — credential validation, token issuance
 *   POST  /api/auth/register         — user creation, password rules, duplicate check
 *   POST  /api/auth/refresh          — token rotation, invalidation
 *   POST  /api/auth/logout           — refresh-token revocation
 *   GET   /api/auth/me               — fetch own profile (JWT-gated)
 *   PUT   /api/auth/me               — update own profile
 *   POST  /api/auth/change-password  — current password verify, hash rotation
 *   GET   /api/auth/users            — admin-only user list
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { authRoutes } from '../routes/auth';

// ── App factory ──────────────────────────────────────────────────────────────

function createApp() {
  const app = new Hono();
  authRoutes(app);
  return app;
}

// ── Request helper ───────────────────────────────────────────────────────────

async function req(
  app: Hono,
  method: string,
  path: string,
  body?: unknown,
  token?: string
) {
  const hdrs: Record<string, string> = {};
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    hdrs['Content-Type'] = 'application/json';
  }
  if (token) hdrs['Authorization'] = `Bearer ${token}`;
  init.headers = hdrs;
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── Cleanup ──────────────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `auth-test-${Date.now()}`;

function tagEmail(suffix: string) {
  return `${TAG}-${suffix}@example.com`;
}

afterAll(() => {
  // Delete all test-created users
  sqlite.prepare(`DELETE FROM auth_users WHERE email LIKE '${TAG}%'`).run();
  // Clean up refresh tokens orphaned by test users (CASCADE should handle it,
  // but just in case the app's shared sqlite closed first)
  sqlite.prepare(`
    DELETE FROM refresh_tokens WHERE user_id NOT IN (SELECT id FROM auth_users)
  `).run();
  sqlite.close();
});

// ── Shared login helper ──────────────────────────────────────────────────────

async function loginAdmin(app: Hono): Promise<{ accessToken: string; refreshToken: string }> {
  const { body } = await req(app, 'POST', '/api/auth/login', {
    email: 'admin@safetymeg.com',
    password: 'Admin@SafetyMEG2025',
  });
  return { accessToken: body.data.accessToken, refreshToken: body.data.refreshToken };
}

async function registerAndLogin(
  app: Hono,
  suffix: string,
  role?: string
): Promise<{ accessToken: string; refreshToken: string; userId: number }> {
  const { body } = await req(app, 'POST', '/api/auth/register', {
    email: tagEmail(suffix),
    password: 'TestPass1',
    fullName: `Test ${suffix}`,
    role: role ?? 'worker',
  });
  return {
    accessToken: body.data.accessToken,
    refreshToken: body.data.refreshToken,
    userId: body.data.user.id,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 1. POST /api/auth/login
// ════════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/login', () => {
  it('returns success + tokens with valid admin credentials', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/login', {
      email: 'admin@safetymeg.com',
      password: 'Admin@SafetyMEG2025',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.data.accessToken).toBe('string');
    expect(body.data.accessToken.length).toBeGreaterThan(20);
    expect(typeof body.data.refreshToken).toBe('string');
    expect(body.data.refreshToken.length).toBeGreaterThan(20);
  });

  it('returns correct user shape (id, email, fullName, role, isActive)', async () => {
    const app = createApp();
    const { body } = await req(app, 'POST', '/api/auth/login', {
      email: 'admin@safetymeg.com',
      password: 'Admin@SafetyMEG2025',
    });
    const u = body.data.user;
    expect(typeof u.id).toBe('number');
    expect(u.email).toBe('admin@safetymeg.com');
    expect(typeof u.fullName).toBe('string');
    expect(u.role).toBe('admin');
    expect(u.isActive).toBe(true);
  });

  it('response includes expiresIn and tokenType', async () => {
    const app = createApp();
    const { body } = await req(app, 'POST', '/api/auth/login', {
      email: 'admin@safetymeg.com',
      password: 'Admin@SafetyMEG2025',
    });
    expect(typeof body.data.expiresIn).toBe('number');
    expect(body.data.tokenType).toBe('Bearer');
  });

  it('returns 401 for wrong password', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/login', {
      email: 'admin@safetymeg.com',
      password: 'WrongPassword1',
    });
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 401 for non-existent email', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/login', {
      email: 'nobody@nowhere.com',
      password: 'SomePass1',
    });
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 400 for missing email (Zod validation)', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/login', {
      password: 'Admin@SafetyMEG2025',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for missing password', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/login', {
      email: 'admin@safetymeg.com',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid email format', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/login', {
      email: 'not-an-email',
      password: 'Admin@SafetyMEG2025',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for password shorter than 6 characters', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/login', {
      email: 'admin@safetymeg.com',
      password: 'abc',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('updates last_login in DB on successful login', async () => {
    const app = createApp();
    const beforeLogin = Date.now() - 5000;
    await req(app, 'POST', '/api/auth/login', {
      email: 'admin@safetymeg.com',
      password: 'Admin@SafetyMEG2025',
    });
    const row = sqlite.prepare('SELECT last_login FROM auth_users WHERE email = ?').get('admin@safetymeg.com') as any;
    expect(row.last_login).toBeGreaterThan(beforeLogin);
  });

  it('returns 400 for invalid JSON body', async () => {
    const app = createApp();
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    const body = await res.json() as any;
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. POST /api/auth/register
// ════════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/register', () => {
  it('creates a new user and returns 201 with access/refresh tokens', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/register', {
      email: tagEmail('register-ok'),
      password: 'TestPass1',
      fullName: 'Register OK',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(typeof body.data.accessToken).toBe('string');
    expect(typeof body.data.refreshToken).toBe('string');
    expect(body.data.user.email).toBe(tagEmail('register-ok'));
  });

  it('default role is "worker"', async () => {
    const app = createApp();
    const { body } = await req(app, 'POST', '/api/auth/register', {
      email: tagEmail('register-worker'),
      password: 'TestPass1',
      fullName: 'Worker User',
    });
    expect(body.data.user.role).toBe('worker');
  });

  it('custom role is stored correctly', async () => {
    const app = createApp();
    const { body } = await req(app, 'POST', '/api/auth/register', {
      email: tagEmail('register-manager'),
      password: 'TestPass1',
      fullName: 'Manager User',
      role: 'manager',
    });
    expect(body.data.user.role).toBe('manager');
  });

  it('returns 409 for duplicate email', async () => {
    const app = createApp();
    const email = tagEmail('register-dup');
    await req(app, 'POST', '/api/auth/register', {
      email,
      password: 'TestPass1',
      fullName: 'Dup User',
    });
    const { status, body } = await req(app, 'POST', '/api/auth/register', {
      email,
      password: 'TestPass1',
      fullName: 'Dup User 2',
    });
    expect(status).toBe(409);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid email', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/register', {
      email: 'bad-email',
      password: 'TestPass1',
      fullName: 'Bad Email',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 if password lacks uppercase letter', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/register', {
      email: tagEmail('register-noup'),
      password: 'testpass1',
      fullName: 'No Upper',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 if password lacks a number', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/register', {
      email: tagEmail('register-nonum'),
      password: 'TestPassNoNum',
      fullName: 'No Number',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 if password is shorter than 8 characters', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/register', {
      email: tagEmail('register-short'),
      password: 'T1',
      fullName: 'Short Pass',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for missing fullName', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/register', {
      email: tagEmail('register-noname'),
      password: 'TestPass1',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('persists user to DB', async () => {
    const app = createApp();
    const email = tagEmail('register-persist');
    await req(app, 'POST', '/api/auth/register', {
      email,
      password: 'TestPass1',
      fullName: 'Persisted',
    });
    const row = sqlite.prepare('SELECT email FROM auth_users WHERE email = ?').get(email) as any;
    expect(row?.email).toBe(email);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. POST /api/auth/refresh
// ════════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/refresh', () => {
  it('issues new tokens with a valid refresh token', async () => {
    const app = createApp();
    const { refreshToken } = await loginAdmin(app);
    const { status, body } = await req(app, 'POST', '/api/auth/refresh', { refreshToken });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.data.accessToken).toBe('string');
    expect(typeof body.data.refreshToken).toBe('string');
  });

  it('returns new user data in the refresh response', async () => {
    const app = createApp();
    const { refreshToken } = await loginAdmin(app);
    const { body } = await req(app, 'POST', '/api/auth/refresh', { refreshToken });
    expect(body.data.user.email).toBe('admin@safetymeg.com');
  });

  it('old refresh token is invalidated after rotation', async () => {
    const app = createApp();
    const { refreshToken: rt1 } = await registerAndLogin(app, 'refresh-rotate');
    await req(app, 'POST', '/api/auth/refresh', { refreshToken: rt1 });
    const { status, body } = await req(app, 'POST', '/api/auth/refresh', { refreshToken: rt1 });
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 401 for an invalid refresh token', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/refresh', {
      refreshToken: 'invalid-token-that-does-not-exist',
    });
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 400 for missing refresh token', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/refresh', {});
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. POST /api/auth/logout
// ════════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/logout', () => {
  it('returns success: true', async () => {
    const app = createApp();
    const { refreshToken } = await loginAdmin(app);
    const { status, body } = await req(app, 'POST', '/api/auth/logout', { refreshToken });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns success even without a refresh token in the body', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'POST', '/api/auth/logout', {});
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('invalidates the refresh token — subsequent refresh returns 401', async () => {
    const app = createApp();
    const { refreshToken } = await registerAndLogin(app, 'logout-invalidate');
    await req(app, 'POST', '/api/auth/logout', { refreshToken });
    const { status } = await req(app, 'POST', '/api/auth/refresh', { refreshToken });
    expect(status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. GET /api/auth/me
// ════════════════════════════════════════════════════════════════════════════

describe('GET /api/auth/me', () => {
  it('returns user data with a valid access token', async () => {
    const app = createApp();
    const { accessToken } = await loginAdmin(app);
    const { status, body } = await req(app, 'GET', '/api/auth/me', undefined, accessToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('admin@safetymeg.com');
  });

  it('returned user has all required fields', async () => {
    const app = createApp();
    const { accessToken } = await loginAdmin(app);
    const { body } = await req(app, 'GET', '/api/auth/me', undefined, accessToken);
    const u = body.data;
    expect(u).toHaveProperty('id');
    expect(u).toHaveProperty('email');
    expect(u).toHaveProperty('fullName');
    expect(u).toHaveProperty('role');
    expect(u).toHaveProperty('isActive');
  });

  it('returns 401 without Authorization header', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'GET', '/api/auth/me');
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 401 with an invalid token', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'GET', '/api/auth/me', undefined, 'bad.token.value');
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 401 when Authorization header is missing Bearer prefix', async () => {
    const app = createApp();
    const r = await app.request('/api/auth/me', {
      headers: { Authorization: 'admin@safetymeg.com' },
    });
    const { status } = { status: r.status };
    expect(status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. PUT /api/auth/me
// ════════════════════════════════════════════════════════════════════════════

describe('PUT /api/auth/me', () => {
  it('updates fullName successfully', async () => {
    const app = createApp();
    const { accessToken } = await registerAndLogin(app, 'update-me');
    const { status, body } = await req(
      app, 'PUT', '/api/auth/me',
      { fullName: 'Updated Name' },
      accessToken
    );
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.fullName).toBe('Updated Name');
  });

  it('updates department successfully', async () => {
    const app = createApp();
    const { accessToken } = await registerAndLogin(app, 'update-dept');
    const { body } = await req(
      app, 'PUT', '/api/auth/me',
      { department: 'EHS' },
      accessToken
    );
    expect(body.data.department).toBe('EHS');
  });

  it('persists update to DB', async () => {
    const app = createApp();
    const email = tagEmail('update-persist');
    await req(app, 'POST', '/api/auth/register', {
      email, password: 'TestPass1', fullName: 'Old Name',
    });
    const { accessToken } = await req(app, 'POST', '/api/auth/login', {
      email, password: 'TestPass1',
    }).then(r => r.body.data);
    await req(app, 'PUT', '/api/auth/me', { fullName: 'New Name' }, accessToken);
    const row = sqlite.prepare('SELECT full_name FROM auth_users WHERE email = ?').get(email) as any;
    expect(row?.full_name).toBe('New Name');
  });

  it('returns 401 without a token', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'PUT', '/api/auth/me', { fullName: 'No Auth' });
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid field types', async () => {
    const app = createApp();
    const { accessToken } = await loginAdmin(app);
    const { status, body } = await req(
      app, 'PUT', '/api/auth/me',
      { fullName: 'a' }, // too short (min 2)
      accessToken
    );
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. POST /api/auth/change-password
// ════════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/change-password', () => {
  it('changes password and returns success', async () => {
    const app = createApp();
    const email = tagEmail('chgpw-ok');
    await req(app, 'POST', '/api/auth/register', { email, password: 'OldPass1', fullName: 'Chg Ok' });
    const { accessToken } = await req(app, 'POST', '/api/auth/login', { email, password: 'OldPass1' })
      .then(r => r.body.data);
    const { status, body } = await req(
      app, 'POST', '/api/auth/change-password',
      { currentPassword: 'OldPass1', newPassword: 'NewPass2' },
      accessToken
    );
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('cannot login with old password after change', async () => {
    const app = createApp();
    const email = tagEmail('chgpw-old');
    await req(app, 'POST', '/api/auth/register', { email, password: 'OldPass1', fullName: 'Chg Old' });
    const { accessToken } = await req(app, 'POST', '/api/auth/login', { email, password: 'OldPass1' })
      .then(r => r.body.data);
    await req(app, 'POST', '/api/auth/change-password',
      { currentPassword: 'OldPass1', newPassword: 'NewPass2' }, accessToken);
    const { status } = await req(app, 'POST', '/api/auth/login', { email, password: 'OldPass1' });
    expect(status).toBe(401);
  });

  it('can login with new password after change', async () => {
    const app = createApp();
    const email = tagEmail('chgpw-new');
    await req(app, 'POST', '/api/auth/register', { email, password: 'OldPass1', fullName: 'Chg New' });
    const { accessToken } = await req(app, 'POST', '/api/auth/login', { email, password: 'OldPass1' })
      .then(r => r.body.data);
    await req(app, 'POST', '/api/auth/change-password',
      { currentPassword: 'OldPass1', newPassword: 'NewPass2' }, accessToken);
    const { status } = await req(app, 'POST', '/api/auth/login', { email, password: 'NewPass2' });
    expect(status).toBe(200);
  });

  it('returns 400 for wrong current password', async () => {
    const app = createApp();
    const { accessToken } = await loginAdmin(app);
    const { status, body } = await req(
      app, 'POST', '/api/auth/change-password',
      { currentPassword: 'WrongCurrent1', newPassword: 'NewPass2' },
      accessToken
    );
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 if new password has no uppercase', async () => {
    const app = createApp();
    const { accessToken } = await loginAdmin(app);
    const { status, body } = await req(
      app, 'POST', '/api/auth/change-password',
      { currentPassword: 'Admin@SafetyMEG2025', newPassword: 'nouppercase1' },
      accessToken
    );
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 if new password is too short', async () => {
    const app = createApp();
    const { accessToken } = await loginAdmin(app);
    const { status, body } = await req(
      app, 'POST', '/api/auth/change-password',
      { currentPassword: 'Admin@SafetyMEG2025', newPassword: 'T1' },
      accessToken
    );
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 401 without Authorization token', async () => {
    const app = createApp();
    const { status, body } = await req(
      app, 'POST', '/api/auth/change-password',
      { currentPassword: 'Admin@SafetyMEG2025', newPassword: 'NewPass2' }
    );
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('revokes all refresh tokens on password change', async () => {
    const app = createApp();
    const email = tagEmail('chgpw-revoke');
    await req(app, 'POST', '/api/auth/register', { email, password: 'OldPass1', fullName: 'Chg Revoke' });
    const { accessToken, refreshToken } = await req(app, 'POST', '/api/auth/login', { email, password: 'OldPass1' })
      .then(r => r.body.data);
    await req(app, 'POST', '/api/auth/change-password',
      { currentPassword: 'OldPass1', newPassword: 'NewPass2' }, accessToken);
    const { status } = await req(app, 'POST', '/api/auth/refresh', { refreshToken });
    expect(status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. GET /api/auth/users  (admin-only)
// ════════════════════════════════════════════════════════════════════════════

describe('GET /api/auth/users', () => {
  it('returns a user list for an admin token', async () => {
    const app = createApp();
    const { accessToken } = await loginAdmin(app);
    const { status, body } = await req(app, 'GET', '/api/auth/users', undefined, accessToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('includes a count field', async () => {
    const app = createApp();
    const { accessToken } = await loginAdmin(app);
    const { body } = await req(app, 'GET', '/api/auth/users', undefined, accessToken);
    expect(typeof body.count).toBe('number');
    expect(body.count).toBeGreaterThan(0);
  });

  it('contains admin@safetymeg.com in the returned list', async () => {
    const app = createApp();
    const { accessToken } = await loginAdmin(app);
    const { body } = await req(app, 'GET', '/api/auth/users', undefined, accessToken);
    const emails = body.data.map((u: any) => u.email);
    expect(emails).toContain('admin@safetymeg.com');
  });

  it('returns 403 for a non-admin (worker) token', async () => {
    const app = createApp();
    const { accessToken } = await registerAndLogin(app, 'worker-list', 'worker');
    const { status, body } = await req(app, 'GET', '/api/auth/users', undefined, accessToken);
    expect(status).toBe(403);
    expect(body.success).toBe(false);
  });

  it('returns 401 without Authorization header', async () => {
    const app = createApp();
    const { status, body } = await req(app, 'GET', '/api/auth/users');
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. Auth users table schema
// ════════════════════════════════════════════════════════════════════════════

describe('auth_users schema verification', () => {
  it('auth_users table exists', () => {
    const row = sqlite.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='auth_users'"
    ).get();
    expect(row).toBeDefined();
  });

  it('refresh_tokens table exists', () => {
    const row = sqlite.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='refresh_tokens'"
    ).get();
    expect(row).toBeDefined();
  });

  it('auth_users has all required columns', () => {
    const cols = sqlite.prepare('PRAGMA table_info(auth_users)').all() as any[];
    const names = cols.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('email');
    expect(names).toContain('password_hash');
    expect(names).toContain('salt');
    expect(names).toContain('full_name');
    expect(names).toContain('role');
    expect(names).toContain('is_active');
    expect(names).toContain('last_login');
    expect(names).toContain('created_at');
    expect(names).toContain('updated_at');
  });

  it('email column has a UNIQUE constraint', () => {
    expect(() => {
      sqlite.prepare(
        "INSERT INTO auth_users (email, password_hash, salt, full_name) VALUES ('admin@safetymeg.com', 'x', 'x', 'Dup')"
      ).run();
    }).toThrow();
  });

  it('default admin exists in database', () => {
    const row = sqlite.prepare('SELECT email, role FROM auth_users WHERE email = ?').get('admin@safetymeg.com') as any;
    expect(row).toBeDefined();
    expect(row.role).toBe('admin');
  });
});
