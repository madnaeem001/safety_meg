/**
 * Organization Settings Route Test Suite
 *
 * Covers:
 *   GET    /api/organization                        — get org profile
 *   PUT    /api/organization                        — update org profile
 *   GET    /api/organization/members                — list members
 *   POST   /api/organization/members                — add member, 409 on duplicate email
 *   PUT    /api/organization/members/:id            — update member role
 *   DELETE /api/organization/members/:id            — soft-delete member
 *   GET    /api/organization/security-policies      — list policies
 *   PUT    /api/organization/security-policies      — toggle policies
 *   GET    /api/organization/audit-log              — paginated audit log
 *   POST   /api/organization/audit-log              — append audit entry
 *   GET    /api/organization/api-key                — get masked key
 *   POST   /api/organization/api-key/regenerate     — regenerate key
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { organizationSettingsRoutes } from './organization-settings';

// ── App factory ────────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  organizationSettingsRoutes(app);
  return app;
}

// ── Request helper ─────────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── DB helpers ─────────────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `org-test-${Date.now()}`;

function seedMember(name: string, email: string, role = 'user') {
  return sqlite
    .prepare(
      `INSERT INTO org_members (name, email, role, is_active, last_active)
       VALUES (?, ?, ?, 1, strftime('%s','now'))`
    )
    .run(name, email, role).lastInsertRowid as number;
}

function seedAuditEntry(action: string) {
  return sqlite
    .prepare(
      `INSERT INTO org_audit_log (action, performer) VALUES (?, 'Test Runner')`
    )
    .run(action).lastInsertRowid as number;
}

afterAll(() => {
  // Clean up members added during tests
  sqlite.prepare(`DELETE FROM org_members WHERE email LIKE ?`).run(`${TAG}%`);
  // Clean up audit entries added during tests
  sqlite.prepare(`DELETE FROM org_audit_log WHERE performer = ?`).run('Test Runner');
  sqlite.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/organization
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/organization', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 200 with success:true', async () => {
    const { status, body } = await req(app, 'GET', '/api/organization');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns profile object with required camelCase fields', async () => {
    const { body } = await req(app, 'GET', '/api/organization');
    const p = body.data;
    expect(p).toHaveProperty('id');
    expect(p).toHaveProperty('name');
    expect(p).toHaveProperty('plan');
    expect(p).toHaveProperty('usersCount');
    expect(p).toHaveProperty('facilities');
    expect(p).toHaveProperty('industries');
    expect(p).toHaveProperty('regions');
    expect(p).toHaveProperty('language');
    expect(p).toHaveProperty('timezone');
    expect(p).toHaveProperty('dateFormat');
    expect(p).toHaveProperty('units');
    expect(p).toHaveProperty('updatedAt');
  });

  it('industries and regions are arrays', async () => {
    const { body } = await req(app, 'GET', '/api/organization');
    expect(Array.isArray(body.data.industries)).toBe(true);
    expect(Array.isArray(body.data.regions)).toBe(true);
  });

  it('plan is one of starter|professional|enterprise', async () => {
    const { body } = await req(app, 'GET', '/api/organization');
    expect(['starter', 'professional', 'enterprise']).toContain(body.data.plan);
  });

  it('units is imperial or metric', async () => {
    const { body } = await req(app, 'GET', '/api/organization');
    expect(['imperial', 'metric']).toContain(body.data.units);
  });

  it('updatedAt is a number (Unix seconds)', async () => {
    const { body } = await req(app, 'GET', '/api/organization');
    expect(typeof body.data.updatedAt).toBe('number');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/organization
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/organization', () => {
  let app: Hono;
  let originalName: string;

  beforeAll(async () => {
    app = createTestApp();
    const { body } = await req(app, 'GET', '/api/organization');
    originalName = body.data.name;
  });

  afterAll(async () => {
    // Restore original name
    await req(app, 'PUT', '/api/organization', { name: originalName });
  });

  it('returns 200 with updated profile', async () => {
    const { status, body } = await req(app, 'PUT', '/api/organization', { name: 'Updated Corp' });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Updated Corp');
  });

  it('partial update preserves other fields', async () => {
    const { body: before } = await req(app, 'GET', '/api/organization');
    const originalLang = before.data.language;
    await req(app, 'PUT', '/api/organization', { name: 'Partial Update Test' });
    const { body: after } = await req(app, 'GET', '/api/organization');
    expect(after.data.language).toBe(originalLang);
  });

  it('can update language field', async () => {
    const { body } = await req(app, 'PUT', '/api/organization', { language: 'es' });
    expect(body.data.language).toBe('es');
    // restore
    await req(app, 'PUT', '/api/organization', { language: 'en' });
  });

  it('can update units to metric', async () => {
    const { body } = await req(app, 'PUT', '/api/organization', { units: 'metric' });
    expect(body.data.units).toBe('metric');
    // restore
    await req(app, 'PUT', '/api/organization', { units: 'imperial' });
  });

  it('can update industries array', async () => {
    const { body } = await req(app, 'PUT', '/api/organization', { industries: ['TestIndustry'] });
    expect(body.data.industries).toContain('TestIndustry');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/organization/members
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/organization/members', () => {
  let app: Hono;
  let memberId: number;

  beforeAll(() => {
    app = createTestApp();
    memberId = seedMember(`${TAG} Member Get`, `${TAG}get@example.com`, 'user');
  });

  it('returns 200 with success:true and data array', async () => {
    const { status, body } = await req(app, 'GET', '/api/organization/members');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('each member has required camelCase fields', async () => {
    const { body } = await req(app, 'GET', '/api/organization/members');
    const m = body.data.find((x: any) => x.id === memberId);
    expect(m).toBeDefined();
    expect(m).toHaveProperty('id');
    expect(m).toHaveProperty('name');
    expect(m).toHaveProperty('email');
    expect(m).toHaveProperty('role');
    expect(m).toHaveProperty('isActive');
    expect(m).toHaveProperty('lastActive');
    expect(m).toHaveProperty('createdAt');
  });

  it('active members have isActive:true', async () => {
    const { body } = await req(app, 'GET', '/api/organization/members');
    const m = body.data.find((x: any) => x.id === memberId);
    expect(m?.isActive).toBe(true);
  });

  it('only returns active members (is_active=1)', async () => {
    const { body } = await req(app, 'GET', '/api/organization/members');
    expect(body.data.every((m: any) => m.isActive === true)).toBe(true);
  });

  it('total field equals data length', async () => {
    const { body } = await req(app, 'GET', '/api/organization/members');
    expect(body.total).toBe(body.data.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/organization/members
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/organization/members', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('creates a new member and returns 201', async () => {
    const { status, body } = await req(app, 'POST', '/api/organization/members', {
      name: `${TAG} New Member`,
      email: `${TAG}new@example.com`,
      role: 'manager',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe(`${TAG} New Member`);
    expect(body.data.role).toBe('manager');
    expect(body.data.isActive).toBe(true);
  });

  it('defaults role to user when not provided', async () => {
    const { body } = await req(app, 'POST', '/api/organization/members', {
      name: `${TAG} Default Role`,
      email: `${TAG}default@example.com`,
    });
    expect(body.data.role).toBe('user');
  });

  it('returns 409 on duplicate email', async () => {
    const email = `${TAG}dup@example.com`;
    await req(app, 'POST', '/api/organization/members', { name: `${TAG} Dup1`, email });
    const { status, body } = await req(app, 'POST', '/api/organization/members', { name: `${TAG} Dup2`, email });
    expect(status).toBe(409);
    expect(body.error).toBeDefined();
  });

  it('returns 400 when name is missing', async () => {
    const { status } = await req(app, 'POST', '/api/organization/members', {
      email: `${TAG}noname@example.com`,
    });
    expect(status).toBe(400);
  });

  it('returns 400 when email is missing', async () => {
    const { status } = await req(app, 'POST', '/api/organization/members', {
      name: `${TAG} No Email`,
    });
    expect(status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/organization/members/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/organization/members/:id', () => {
  let app: Hono;
  let memberId: number;

  beforeAll(() => {
    app = createTestApp();
    memberId = seedMember(`${TAG} Update Member`, `${TAG}update@example.com`, 'user');
  });

  it('updates member role and returns 200', async () => {
    const { status, body } = await req(app, 'PUT', `/api/organization/members/${memberId}`, { role: 'admin' });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.role).toBe('admin');
  });

  it('returns 404 for non-existent member', async () => {
    const { status } = await req(app, 'PUT', '/api/organization/members/999999', { role: 'user' });
    expect(status).toBe(404);
  });

  it('updated member reflects in GET /members', async () => {
    await req(app, 'PUT', `/api/organization/members/${memberId}`, { role: 'viewer' });
    const { body } = await req(app, 'GET', '/api/organization/members');
    const m = body.data.find((x: any) => x.id === memberId);
    expect(m?.role).toBe('viewer');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/organization/members/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/organization/members/:id', () => {
  let app: Hono;
  let memberId: number;

  beforeAll(() => {
    app = createTestApp();
    memberId = seedMember(`${TAG} Delete Member`, `${TAG}delete@example.com`, 'user');
  });

  it('soft-deletes a member (sets is_active=0) and returns 200', async () => {
    const { status, body } = await req(app, 'DELETE', `/api/organization/members/${memberId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('soft-deleted member no longer appears in GET /members', async () => {
    const { body } = await req(app, 'GET', '/api/organization/members');
    const m = body.data.find((x: any) => x.id === memberId);
    expect(m).toBeUndefined();
  });

  it('returns 404 for non-existent member delete', async () => {
    const { status } = await req(app, 'DELETE', '/api/organization/members/999999');
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/organization/security-policies
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/organization/security-policies', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 200 with success:true and data array', async () => {
    const { status, body } = await req(app, 'GET', '/api/organization/security-policies');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('each policy has required camelCase fields', async () => {
    const { body } = await req(app, 'GET', '/api/organization/security-policies');
    const p = body.data[0];
    expect(p).toHaveProperty('id');
    expect(p).toHaveProperty('policyName');
    expect(p).toHaveProperty('label');
    expect(p).toHaveProperty('description');
    expect(p).toHaveProperty('enabled');
  });

  it('enabled field is boolean', async () => {
    const { body } = await req(app, 'GET', '/api/organization/security-policies');
    expect(typeof body.data[0].enabled).toBe('boolean');
  });

  it('returns at least 1 seeded policy', async () => {
    const { body } = await req(app, 'GET', '/api/organization/security-policies');
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/organization/security-policies
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/organization/security-policies', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('toggles a policy enabled state and returns 200', async () => {
    const { body: before } = await req(app, 'GET', '/api/organization/security-policies');
    const policy = before.data[0];
    const toggledState = !policy.enabled;

    const { status, body } = await req(app, 'PUT', '/api/organization/security-policies', {
      policies: [{ policyName: policy.policyName, enabled: toggledState }],
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);

    const updated = body.data.find((p: any) => p.policyName === policy.policyName);
    expect(updated.enabled).toBe(toggledState);

    // restore
    await req(app, 'PUT', '/api/organization/security-policies', {
      policies: [{ policyName: policy.policyName, enabled: policy.enabled }],
    });
  });

  it('can toggle multiple policies in one request', async () => {
    const { body: before } = await req(app, 'GET', '/api/organization/security-policies');
    if (before.data.length < 2) return; // skip if not enough policies
    const p1 = before.data[0];
    const p2 = before.data[1];
    const { body } = await req(app, 'PUT', '/api/organization/security-policies', {
      policies: [
        { policyName: p1.policyName, enabled: !p1.enabled },
        { policyName: p2.policyName, enabled: !p2.enabled },
      ],
    });
    const u1 = body.data.find((p: any) => p.policyName === p1.policyName);
    const u2 = body.data.find((p: any) => p.policyName === p2.policyName);
    expect(u1.enabled).toBe(!p1.enabled);
    expect(u2.enabled).toBe(!p2.enabled);
    // restore
    await req(app, 'PUT', '/api/organization/security-policies', {
      policies: [
        { policyName: p1.policyName, enabled: p1.enabled },
        { policyName: p2.policyName, enabled: p2.enabled },
      ],
    });
  });

  it('returns 400 when policies array is missing', async () => {
    const { status } = await req(app, 'PUT', '/api/organization/security-policies', {});
    expect(status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/organization/audit-log
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/organization/audit-log', () => {
  let app: Hono;
  let entryId: number;

  beforeAll(() => {
    app = createTestApp();
    entryId = seedAuditEntry(`${TAG} Test Action`);
  });

  it('returns 200 with success:true and data array', async () => {
    const { status, body } = await req(app, 'GET', '/api/organization/audit-log');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('each entry has required camelCase fields', async () => {
    const { body } = await req(app, 'GET', '/api/organization/audit-log');
    const entry = body.data.find((e: any) => e.id === entryId);
    expect(entry).toBeDefined();
    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('action');
    expect(entry).toHaveProperty('performer');
    expect(entry).toHaveProperty('createdAt');
  });

  it('respects limit query param', async () => {
    const { body } = await req(app, 'GET', '/api/organization/audit-log?limit=2');
    expect(body.data.length).toBeLessThanOrEqual(2);
  });

  it('respects offset query param', async () => {
    const { body: all } = await req(app, 'GET', '/api/organization/audit-log?limit=10000');
    const { body: offset } = await req(app, 'GET', '/api/organization/audit-log?offset=1&limit=10000');
    if (all.data.length >= 2) {
      expect(offset.data.length).toBe(all.data.length - 1);
    }
  });

  it('returns entries sorted newest-first', async () => {
    const { body } = await req(app, 'GET', '/api/organization/audit-log');
    const times = body.data.map((e: any) => e.createdAt);
    for (let i = 0; i < times.length - 1; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i + 1]);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/organization/audit-log
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/organization/audit-log', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('appends an audit log entry and returns 201', async () => {
    const { status, body } = await req(app, 'POST', '/api/organization/audit-log', {
      action: `${TAG} Manual Action`,
      performer: 'Test Runner',
      details: 'Created via test',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.action).toBe(`${TAG} Manual Action`);
    expect(body.data.performer).toBe('Test Runner');
    expect(body.data).toHaveProperty('id');
    expect(body.data).toHaveProperty('createdAt');
  });

  it('defaults performer to Admin when not provided', async () => {
    const { body } = await req(app, 'POST', '/api/organization/audit-log', {
      action: `${TAG} No Performer`,
    });
    expect(body.data.performer).toBe('Admin');
  });

  it('returns 400 when action is missing', async () => {
    const { status } = await req(app, 'POST', '/api/organization/audit-log', { performer: 'Test' });
    expect(status).toBe(400);
  });

  it('new entry is visible in GET /audit-log', async () => {
    const { body: created } = await req(app, 'POST', '/api/organization/audit-log', {
      action: `${TAG} Verify Visible`,
      performer: 'Test Runner',
    });
    const { body: list } = await req(app, 'GET', '/api/organization/audit-log?limit=50');
    const found = list.data.find((e: any) => e.id === created.data.id);
    expect(found).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/organization/api-key
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/organization/api-key', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 200 with success:true', async () => {
    const { status, body } = await req(app, 'GET', '/api/organization/api-key');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns maskedKey, id, createdAt, updatedAt', async () => {
    const { body } = await req(app, 'GET', '/api/organization/api-key');
    expect(body.data).toHaveProperty('id');
    expect(body.data).toHaveProperty('maskedKey');
    expect(body.data).toHaveProperty('createdAt');
    expect(body.data).toHaveProperty('updatedAt');
  });

  it('maskedKey starts with "sk-"', async () => {
    const { body } = await req(app, 'GET', '/api/organization/api-key');
    expect(body.data.maskedKey).toMatch(/^sk-/);
  });

  it('maskedKey does not expose the full raw key', async () => {
    const { body } = await req(app, 'GET', '/api/organization/api-key');
    // Masked key should contain bullet points (obfuscation)
    expect(body.data.maskedKey).toMatch(/•/);
  });

  it('createdAt is a number (Unix seconds)', async () => {
    const { body } = await req(app, 'GET', '/api/organization/api-key');
    expect(typeof body.data.createdAt).toBe('number');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/organization/api-key/regenerate
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/organization/api-key/regenerate', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 200 with success:true', async () => {
    const { status, body } = await req(app, 'POST', '/api/organization/api-key/regenerate');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns maskedKey and regeneratedKey', async () => {
    const { body } = await req(app, 'POST', '/api/organization/api-key/regenerate');
    expect(body.data).toHaveProperty('maskedKey');
    expect(body.data).toHaveProperty('regeneratedKey');
    expect(body.data).toHaveProperty('updatedAt');
  });

  it('regeneratedKey starts with "sk-" and is 35 chars', async () => {
    const { body } = await req(app, 'POST', '/api/organization/api-key/regenerate');
    expect(body.data.regeneratedKey).toMatch(/^sk-[A-Za-z0-9]{32}$/);
  });

  it('maskedKey starts with "sk-" and contains bullet points', async () => {
    const { body } = await req(app, 'POST', '/api/organization/api-key/regenerate');
    expect(body.data.maskedKey).toMatch(/^sk-/);
    expect(body.data.maskedKey).toMatch(/•/);
  });

  it('after regeneration, GET /api-key returns the new masked key', async () => {
    const { body: regen } = await req(app, 'POST', '/api/organization/api-key/regenerate');
    const { body: get } = await req(app, 'GET', '/api/organization/api-key');
    // Both maskedKeys should match (same underlying key)
    expect(get.data.maskedKey).toBe(regen.data.maskedKey);
  });

  it('each regeneration produces a different regeneratedKey', async () => {
    const { body: first } = await req(app, 'POST', '/api/organization/api-key/regenerate');
    const { body: second } = await req(app, 'POST', '/api/organization/api-key/regenerate');
    expect(first.data.regeneratedKey).not.toBe(second.data.regeneratedKey);
  });
});
