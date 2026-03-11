/**
 * Data Security Hub Routes Test Suite
 *
 * Covers:
 *   GET  /api/data-security/stats                 — aggregate KPIs
 *   GET  /api/data-security/sso-providers         — list all SSO providers
 *   PUT  /api/data-security/sso-providers/:id     — update status / sync
 *   GET  /api/data-security/audit-logs            — list with search / action filter
 *   POST /api/data-security/audit-logs            — create log entry
 *   GET  /api/data-security/rbac                  — RBAC matrix (static config)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { dataSecurityRoutes } from '../routes/data-security';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  dataSecurityRoutes(app);
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
const TAG = `testds-${Date.now()}`;

let seededSsoId: number;
let seededLogId: number;

beforeAll(() => {
  const ts = Date.now();

  // Seed an SSO provider
  const ssoResult = sqlite.prepare(`
    INSERT INTO sso_providers (name, protocol, status, icon, connected_users, last_sync, config, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(`${TAG}-Provider`, 'SAML 2.0', 'disconnected', '🔐', 0, 'N/A', '{}', ts, ts);
  seededSsoId = Number(ssoResult.lastInsertRowid);

  // Seed an audit log
  const logResult = sqlite.prepare(`
    INSERT INTO security_audit_logs (user_name, action, resource, field_name, old_value, new_value, ip_address, timestamp, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(`${TAG}-User`, 'Updated', `${TAG}-Resource`, 'severity', 'Low', 'High', '10.0.0.1', '2026-01-01 12:00:00', ts);
  seededLogId = Number(logResult.lastInsertRowid);

  // Seed a 'Login Failed' log for stats tests
  sqlite.prepare(`
    INSERT INTO security_audit_logs (user_name, action, resource, ip_address, timestamp, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(`${TAG}-FailUser`, 'Login Failed', 'Authentication', '192.168.1.99', '2026-01-01 11:00:00', ts);
});

afterAll(() => {
  sqlite.prepare(`DELETE FROM sso_providers WHERE name LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM security_audit_logs WHERE user_name LIKE '${TAG}%'`).run();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/data-security/stats', () => {
  it('returns success with all required KPI fields', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/data-security/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(typeof body.data.ssoCoverage).toBe('string');
    expect(body.data.ssoCoverage).toMatch(/\d+%/);
    expect(typeof body.data.rbacPolicies).toBe('number');
    expect(body.data.rbacPolicies).toBeGreaterThan(0);
    expect(typeof body.data.auditEvents24h).toBe('number');
    expect(typeof body.data.failedLogins24h).toBe('number');
    expect(body.data.dataEncrypted).toBe('100%');
    expect(body.data.iso45001Ready).toBe('Yes');
  });

  it('failedLogins24h counts Login Failed action rows', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/stats');
    // At least the seeded Login Failed record exists
    expect(body.data.failedLogins24h).toBeGreaterThanOrEqual(1);
  });

  it('rbacPolicies equals roles × resources (6 × 10 = 60)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/stats');
    expect(body.data.rbacPolicies).toBe(60);
  });
});

describe('GET /api/data-security/sso-providers', () => {
  it('returns success and an array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/data-security/sso-providers');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('contains the seeded provider', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/sso-providers');
    const found = body.data.find((p: any) => p.id === seededSsoId);
    expect(found).toBeDefined();
    expect(found.name).toBe(`${TAG}-Provider`);
    expect(found.protocol).toBe('SAML 2.0');
    expect(found.status).toBe('disconnected');
    expect(found.connectedUsers).toBe(0);
  });

  it('returns correctly mapped fields (camelCase)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/sso-providers');
    const found = body.data.find((p: any) => p.id === seededSsoId);
    expect(found).toHaveProperty('connectedUsers');
    expect(found).toHaveProperty('lastSync');
    expect(found).not.toHaveProperty('connected_users');
    expect(found).not.toHaveProperty('last_sync');
  });

  it('includes seed providers from init-db (Okta etc.)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/sso-providers');
    const names = body.data.map((p: any) => p.name);
    expect(names).toContain('Okta');
  });
});

describe('PUT /api/data-security/sso-providers/:id', () => {
  it('updates status to connected', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/data-security/sso-providers/${seededSsoId}`, {
      status: 'connected',
      lastSync: '1 min ago',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('connected');
    expect(body.data.lastSync).toBe('1 min ago');
  });

  it('reflects the update in subsequent GET', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/sso-providers');
    const found = body.data.find((p: any) => p.id === seededSsoId);
    expect(found.status).toBe('connected');
    expect(found.lastSync).toBe('1 min ago');
  });

  it('updates connectedUsers', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/data-security/sso-providers/${seededSsoId}`, {
      connectedUsers: 99,
    });
    expect(status).toBe(200);
    expect(body.data.connectedUsers).toBe(99);
  });

  it('returns 404 for non-existent id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/data-security/sso-providers/99999999', {
      status: 'connected',
    });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid id format', async () => {
    const app = createTestApp();
    const { status } = await req(app, 'PUT', '/api/data-security/sso-providers/abc', {
      status: 'connected',
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid status value', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/data-security/sso-providers/${seededSsoId}`, {
      status: 'active', // not a valid enum
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns current row when no fields are updated', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/data-security/sso-providers/${seededSsoId}`, {});
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(seededSsoId);
  });
});

describe('GET /api/data-security/audit-logs', () => {
  it('returns success and an array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/data-security/audit-logs');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('contains the seeded audit log', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/audit-logs');
    const found = body.data.find((l: any) => l.id === seededLogId);
    expect(found).toBeDefined();
    expect(found.userName).toBe(`${TAG}-User`);
    expect(found.action).toBe('Updated');
    expect(found.resource).toBe(`${TAG}-Resource`);
    expect(found.fieldName).toBe('severity');
    expect(found.oldValue).toBe('Low');
    expect(found.newValue).toBe('High');
    expect(found.ipAddress).toBe('10.0.0.1');
  });

  it('returns correctly mapped camelCase fields', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/audit-logs');
    const found = body.data.find((l: any) => l.id === seededLogId);
    expect(found).toHaveProperty('userName');
    expect(found).toHaveProperty('ipAddress');
    expect(found).toHaveProperty('fieldName');
    expect(found).not.toHaveProperty('user_name');
    expect(found).not.toHaveProperty('ip_address');
  });

  it('filters by search query matching userName', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/data-security/audit-logs?search=${TAG}-User`);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.every((l: any) =>
      l.userName.includes(`${TAG}-User`) ||
      l.resource.includes(`${TAG}-User`) ||
      l.action.includes(`${TAG}-User`)
    )).toBe(true);
  });

  it('filters by search query matching resource', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/data-security/audit-logs?search=${TAG}-Resource`);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    const found = body.data.find((l: any) => l.id === seededLogId);
    expect(found).toBeDefined();
  });

  it('filters by action', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/audit-logs?action=Login%20Failed');
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.every((l: any) => l.action === 'Login Failed')).toBe(true);
  });

  it('action filter excludes other records', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/audit-logs?action=Updated');
    const hasFailed = body.data.some((l: any) => l.action === 'Login Failed');
    expect(hasFailed).toBe(false);
  });

  it('respects limit param', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/audit-logs?limit=2');
    expect(body.data.length).toBeLessThanOrEqual(2);
  });

  it('caps limit at 200', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/audit-logs?limit=999');
    expect(body.data.length).toBeLessThanOrEqual(200);
  });

  it('returns empty array for search that matches nothing', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/audit-logs?search=zzz-no-match-xyz-12345');
    expect(body.data.length).toBe(0);
  });
});

describe('POST /api/data-security/audit-logs', () => {
  it('creates a new audit log entry', async () => {
    const app = createTestApp();
    const payload = {
      userName: `${TAG}-PostUser`,
      action: 'Viewed',
      resource: `${TAG}-PostResource`,
      ipAddress: '10.1.2.3',
    };
    const { status, body } = await req(app, 'POST', '/api/data-security/audit-logs', payload);
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.userName).toBe(`${TAG}-PostUser`);
    expect(body.data.action).toBe('Viewed');
    expect(body.data.resource).toBe(`${TAG}-PostResource`);
    expect(body.data.ipAddress).toBe('10.1.2.3');
    expect(body.data.id).toBeGreaterThan(0);
  });

  it('auto-sets timestamp when not provided', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/data-security/audit-logs', {
      userName: `${TAG}-TSUser`,
      action: 'Created',
      resource: 'test',
    });
    expect(body.data.timestamp).toBeTruthy();
    expect(typeof body.data.timestamp).toBe('string');
  });

  it('stores fieldName, oldValue, newValue when provided', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/data-security/audit-logs', {
      userName: `${TAG}-FieldUser`,
      action: 'Updated',
      resource: 'Risk #99',
      fieldName: 'priority',
      oldValue: 'low',
      newValue: 'critical',
    });
    expect(body.data.fieldName).toBe('priority');
    expect(body.data.oldValue).toBe('low');
    expect(body.data.newValue).toBe('critical');
  });

  it('returns 400 when userName is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/data-security/audit-logs', {
      action: 'Viewed',
      resource: 'test',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when action is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/data-security/audit-logs', {
      userName: `${TAG}-NoAction`,
      resource: 'test',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when resource is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/data-security/audit-logs', {
      userName: `${TAG}-NoResource`,
      action: 'Viewed',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('nulls optional fields that are not provided', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/data-security/audit-logs', {
      userName: `${TAG}-NullUser`,
      action: 'Exported',
      resource: 'Report',
    });
    expect(body.data.fieldName).toBeNull();
    expect(body.data.oldValue).toBeNull();
    expect(body.data.newValue).toBeNull();
  });
});

describe('GET /api/data-security/rbac', () => {
  it('returns success with roles and resources arrays', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/data-security/rbac');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.roles)).toBe(true);
    expect(Array.isArray(body.data.resources)).toBe(true);
  });

  it('has 6 roles', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/rbac');
    expect(body.data.roles).toHaveLength(6);
  });

  it('has 10 resources', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/rbac');
    expect(body.data.resources).toHaveLength(10);
  });

  it('includes expected role names', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/rbac');
    expect(body.data.roles).toContain('Admin');
    expect(body.data.roles).toContain('Safety Manager');
    expect(body.data.roles).toContain('Contractor');
  });

  it('each resource has all role permission fields', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/rbac');
    for (const resource of body.data.resources) {
      expect(resource).toHaveProperty('name');
      expect(resource).toHaveProperty('admin');
      expect(resource).toHaveProperty('safetyMgr');
      expect(resource).toHaveProperty('supervisor');
      expect(resource).toHaveProperty('worker');
      expect(resource).toHaveProperty('contractor');
      expect(resource).toHaveProperty('hr');
    }
  });

  it('contractor cannot access Medical Records (none)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/rbac');
    const medRecords = body.data.resources.find((r: any) => r.name === 'Medical Records');
    expect(medRecords).toBeDefined();
    expect(medRecords.contractor).toBe('none');
    expect(medRecords.hr).toBe('full');
  });

  it('admin has full access to all resources', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/data-security/rbac');
    for (const resource of body.data.resources) {
      expect(resource.admin).toBe('full');
    }
  });
});
