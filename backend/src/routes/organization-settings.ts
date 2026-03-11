/**
 * Organization Settings Routes
 *
 * Manages organization profile, team members, security policies,
 * audit log, and API key management.
 *
 * Routes:
 *   GET    /api/organization                  — get organization profile
 *   PUT    /api/organization                  — update organization profile
 *   GET    /api/organization/members          — list team members
 *   POST   /api/organization/members          — add / invite a member
 *   PUT    /api/organization/members/:id      — update member role
 *   DELETE /api/organization/members/:id      — remove a member
 *   GET    /api/organization/security-policies — list security policies
 *   PUT    /api/organization/security-policies — update security policies
 *   GET    /api/organization/audit-log        — paginated audit log
 *   POST   /api/organization/audit-log        — append an audit log entry
 *   GET    /api/organization/api-key          — get masked API key
 *   POST   /api/organization/api-key/regenerate — regenerate API key
 */

import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProdRoute ? '/data/local.sqlite' : resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Math.floor(Date.now() / 1000);

// ── Schema ────────────────────────────────────────────────────────────────────

function ensureSchema(db: ReturnType<typeof getDb>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS org_profile (
      org_id        TEXT    PRIMARY KEY DEFAULT 'default',
      name          TEXT    NOT NULL DEFAULT 'My Organization',
      plan          TEXT    NOT NULL DEFAULT 'enterprise',
      users_count   INTEGER NOT NULL DEFAULT 0,
      facilities    INTEGER NOT NULL DEFAULT 0,
      logo_url      TEXT,
      industries    TEXT    NOT NULL DEFAULT '[]',
      regions       TEXT    NOT NULL DEFAULT '[]',
      language      TEXT    NOT NULL DEFAULT 'en',
      timezone      TEXT    NOT NULL DEFAULT 'UTC',
      date_format   TEXT    NOT NULL DEFAULT 'MM/DD/YYYY',
      units         TEXT    NOT NULL DEFAULT 'imperial',
      updated_at    INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS org_members (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      role        TEXT    NOT NULL DEFAULT 'user',
      is_active   INTEGER NOT NULL DEFAULT 1,
      last_active INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS org_security_policies (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_name TEXT    NOT NULL UNIQUE,
      policy_label TEXT   NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      enabled     INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS org_audit_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      action     TEXT    NOT NULL,
      performer  TEXT    NOT NULL DEFAULT 'Admin',
      details    TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS org_api_keys (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id     TEXT    NOT NULL DEFAULT 'default',
      api_key    TEXT    NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
  `);

  // Seed default org profile if not present
  db.prepare(`
    INSERT OR IGNORE INTO org_profile (org_id, name, plan, users_count, facilities, industries, regions)
    VALUES ('default', 'Acme Industries', 'enterprise', 248, 45,
      '["Manufacturing","Construction","Logistics"]',
      '["North America","Europe","Asia Pacific"]')
  `).run();

  // Seed default security policies if empty
  const policyCount = (db.prepare('SELECT COUNT(*) as c FROM org_security_policies').get() as any).c;
  if (policyCount === 0) {
    const insert = db.prepare(`
      INSERT INTO org_security_policies (policy_name, policy_label, description, enabled)
      VALUES (?, ?, ?, ?)
    `);
    const seedPolicies = db.transaction(() => {
      insert.run('two_factor_auth', 'Two-Factor Authentication', 'Require 2FA for all users', 1);
      insert.run('session_timeout', 'Session Timeout', 'Auto-logout after inactivity', 1);
      insert.run('ip_allowlist', 'IP Allowlist', 'Restrict access to approved IPs', 0);
      insert.run('password_policy', 'Password Policy', 'Enforce strong passwords', 1);
    });
    seedPolicies();
  }

  // Seed default API key if none exists
  const keyCount = (db.prepare('SELECT COUNT(*) as c FROM org_api_keys WHERE org_id = ?').get('default') as any).c;
  if (keyCount === 0) {
    const generatedKey = generateApiKey();
    db.prepare(`
      INSERT INTO org_api_keys (org_id, api_key) VALUES ('default', ?)
    `).run(generatedKey);
  }

  // Seed default team members if empty
  const memberCount = (db.prepare('SELECT COUNT(*) as c FROM org_members').get() as any).c;
  if (memberCount === 0) {
    const ins = db.prepare(`
      INSERT INTO org_members (name, email, role, last_active) VALUES (?, ?, ?, ?)
    `);
    const seedMembers = db.transaction(() => {
      ins.run('Sarah Johnson', 'sarah.johnson@acme.com', 'owner', now());
      ins.run('Michael Chen', 'michael.chen@acme.com', 'admin', now() - 3600);
      ins.run('Emily Williams', 'emily.w@acme.com', 'manager', now() - 7200);
      ins.run('David Rodriguez', 'd.rodriguez@acme.com', 'manager', now() - 86400);
      ins.run('Lisa Thompson', 'l.thompson@acme.com', 'user', now() - 172800);
    });
    seedMembers();
  }
}

let _initialized = false;
function initOnce() {
  if (_initialized) return;
  _initialized = true;
  const db = getDb();
  try { ensureSchema(db); } finally { db.close(); }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'sk-';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 3) + '••••••••••••••••' + key.slice(-4);
}

function parseJson<T>(str: string, fallback: T): T {
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

function mapProfile(row: any) {
  return {
    id: 'ORG-001',
    name: row.name,
    plan: row.plan as 'starter' | 'professional' | 'enterprise',
    usersCount: row.users_count,
    facilities: row.facilities,
    logoUrl: row.logo_url ?? null,
    industries: parseJson<string[]>(row.industries, []),
    regions: parseJson<string[]>(row.regions, []),
    language: row.language,
    timezone: row.timezone,
    dateFormat: row.date_format,
    units: row.units,
    updatedAt: row.updated_at,
  };
}

function mapMember(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as 'owner' | 'admin' | 'manager' | 'user' | 'viewer',
    isActive: row.is_active === 1,
    lastActive: row.last_active,
    createdAt: row.created_at,
  };
}

function mapPolicy(row: any) {
  return {
    id: row.id,
    policyName: row.policy_name,
    label: row.policy_label,
    description: row.description,
    enabled: row.enabled === 1,
  };
}

function mapAuditEntry(row: any) {
  return {
    id: row.id,
    action: row.action,
    performer: row.performer,
    details: row.details ?? null,
    createdAt: row.created_at,
  };
}

// ── Validation Schemas ────────────────────────────────────────────────────────

const VALID_PLANS = ['starter', 'professional', 'enterprise'] as const;
const VALID_LANGUAGES = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'pt', 'ar'] as const;
const VALID_TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo'] as const;
const VALID_DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;
const VALID_UNITS = ['imperial', 'metric'] as const;
const VALID_ROLES = ['owner', 'admin', 'manager', 'user', 'viewer'] as const;

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  plan: z.enum(VALID_PLANS).optional(),
  usersCount: z.number().int().min(0).optional(),
  facilities: z.number().int().min(0).optional(),
  logoUrl: z.string().url().nullable().optional(),
  industries: z.array(z.string().min(1)).optional(),
  regions: z.array(z.string().min(1)).optional(),
  language: z.enum(VALID_LANGUAGES).optional(),
  timezone: z.enum(VALID_TIMEZONES).optional(),
  dateFormat: z.enum(VALID_DATE_FORMATS).optional(),
  units: z.enum(VALID_UNITS).optional(),
});

const AddMemberSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.enum(VALID_ROLES).default('user'),
});

const UpdateMemberSchema = z.object({
  role: z.enum(VALID_ROLES).optional(),
  isActive: z.boolean().optional(),
});

const UpdatePoliciesSchema = z.object({
  policies: z.array(z.object({
    policyName: z.string().min(1),
    enabled: z.boolean(),
  })).min(1),
});

const AddAuditLogSchema = z.object({
  action: z.string().min(1).max(500),
  performer: z.string().min(1).max(200).optional(),
  details: z.string().max(2000).optional(),
});

// ── Route Registration ────────────────────────────────────────────────────────

export function organizationSettingsRoutes(app: Hono) {
  initOnce();

  // ── GET /api/organization ───────────────────────────────────────────────

  app.get('/api/organization', (c) => {
    const db = getDb();
    try {
      ensureSchema(db);
      const row = db.prepare('SELECT * FROM org_profile WHERE org_id = ?').get('default') as any;
      if (!row) return c.json({ success: false, error: 'Organization not found' }, 404);
      return c.json({ success: true, data: mapProfile(row) });
    } catch (err: any) {
      return c.json({ success: false, error: 'Failed to fetch organization', message: err.message }, 500);
    } finally {
      db.close();
    }
  });

  // ── PUT /api/organization ───────────────────────────────────────────────

  app.put('/api/organization', async (c) => {
    let body: unknown;
    try { body = await c.req.json(); } catch {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    let v: z.infer<typeof UpdateProfileSchema>;
    try {
      v = UpdateProfileSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: err.issues }, 400);
      }
      throw err;
    }

    const db = getDb();
    try {
      ensureSchema(db);
      const fields: string[] = [];
      const params: any[] = [];

      if (v.name !== undefined)       { fields.push('name = ?');        params.push(v.name); }
      if (v.plan !== undefined)       { fields.push('plan = ?');        params.push(v.plan); }
      if (v.usersCount !== undefined) { fields.push('users_count = ?'); params.push(v.usersCount); }
      if (v.facilities !== undefined) { fields.push('facilities = ?');  params.push(v.facilities); }
      if (v.logoUrl !== undefined)    { fields.push('logo_url = ?');    params.push(v.logoUrl); }
      if (v.industries !== undefined) { fields.push('industries = ?');  params.push(JSON.stringify(v.industries)); }
      if (v.regions !== undefined)    { fields.push('regions = ?');     params.push(JSON.stringify(v.regions)); }
      if (v.language !== undefined)   { fields.push('language = ?');    params.push(v.language); }
      if (v.timezone !== undefined)   { fields.push('timezone = ?');    params.push(v.timezone); }
      if (v.dateFormat !== undefined) { fields.push('date_format = ?'); params.push(v.dateFormat); }
      if (v.units !== undefined)      { fields.push('units = ?');       params.push(v.units); }

      if (fields.length === 0) {
        return c.json({ success: false, error: 'No fields to update' }, 400);
      }

      fields.push('updated_at = ?');
      params.push(now());
      params.push('default');

      db.prepare(`UPDATE org_profile SET ${fields.join(', ')} WHERE org_id = ?`).run(...params);

      // Append to audit log
      db.prepare(`INSERT INTO org_audit_log (action, performer, details) VALUES (?, ?, ?)`)
        .run('Organization profile updated', 'Admin', `Fields: ${Object.keys(v).join(', ')}`);

      const updated = db.prepare('SELECT * FROM org_profile WHERE org_id = ?').get('default') as any;
      return c.json({ success: true, data: mapProfile(updated) });
    } catch (err: any) {
      return c.json({ success: false, error: 'Failed to update organization', message: err.message }, 500);
    } finally {
      db.close();
    }
  });

  // ── GET /api/organization/members ──────────────────────────────────────

  app.get('/api/organization/members', (c) => {
    const db = getDb();
    try {
      ensureSchema(db);
      const rows = db.prepare('SELECT * FROM org_members WHERE is_active = 1 ORDER BY created_at ASC').all() as any[];
      return c.json({ success: true, data: rows.map(mapMember), total: rows.length });
    } catch (err: any) {
      return c.json({ success: false, error: 'Failed to fetch members', message: err.message }, 500);
    } finally {
      db.close();
    }
  });

  // ── POST /api/organization/members ─────────────────────────────────────

  app.post('/api/organization/members', async (c) => {
    let body: unknown;
    try { body = await c.req.json(); } catch {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    let v: z.infer<typeof AddMemberSchema>;
    try {
      v = AddMemberSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: err.issues }, 400);
      }
      throw err;
    }

    const db = getDb();
    try {
      ensureSchema(db);
      // Check for duplicate email
      const existing = db.prepare('SELECT id FROM org_members WHERE email = ?').get(v.email);
      if (existing) {
        return c.json({ success: false, error: 'A member with this email already exists' }, 409);
      }

      const result = db.prepare(`
        INSERT INTO org_members (name, email, role, is_active, last_active)
        VALUES (?, ?, ?, 1, ?)
      `).run(v.name, v.email, v.role, now()) as any;

      db.prepare(`INSERT INTO org_audit_log (action, performer, details) VALUES (?, ?, ?)`)
        .run('Member invited', 'Admin', `${v.name} (${v.email}) invited as ${v.role}`);

      const member = db.prepare('SELECT * FROM org_members WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapMember(member) }, 201);
    } catch (err: any) {
      return c.json({ success: false, error: 'Failed to add member', message: err.message }, 500);
    } finally {
      db.close();
    }
  });

  // ── PUT /api/organization/members/:id ──────────────────────────────────

  app.put('/api/organization/members/:id', async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) return c.json({ success: false, error: 'Invalid member ID' }, 400);

    let body: unknown;
    try { body = await c.req.json(); } catch {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    let v: z.infer<typeof UpdateMemberSchema>;
    try {
      v = UpdateMemberSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: err.issues }, 400);
      }
      throw err;
    }

    const db = getDb();
    try {
      ensureSchema(db);
      const existing = db.prepare('SELECT * FROM org_members WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Member not found' }, 404);

      const fields: string[] = [];
      const params: any[] = [];
      if (v.role !== undefined)     { fields.push('role = ?');      params.push(v.role); }
      if (v.isActive !== undefined) { fields.push('is_active = ?'); params.push(v.isActive ? 1 : 0); }

      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      params.push(id);

      db.prepare(`UPDATE org_members SET ${fields.join(', ')} WHERE id = ?`).run(...params);

      db.prepare(`INSERT INTO org_audit_log (action, performer, details) VALUES (?, ?, ?)`)
        .run('Role changed', 'Admin', `${existing.name} role updated`);

      const updated = db.prepare('SELECT * FROM org_members WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: mapMember(updated) });
    } catch (err: any) {
      return c.json({ success: false, error: 'Failed to update member', message: err.message }, 500);
    } finally {
      db.close();
    }
  });

  // ── DELETE /api/organization/members/:id ───────────────────────────────

  app.delete('/api/organization/members/:id', (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) return c.json({ success: false, error: 'Invalid member ID' }, 400);

    const db = getDb();
    try {
      ensureSchema(db);
      const existing = db.prepare('SELECT * FROM org_members WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Member not found' }, 404);

      // Soft-delete: set is_active = 0
      db.prepare('UPDATE org_members SET is_active = 0 WHERE id = ?').run(id);

      db.prepare(`INSERT INTO org_audit_log (action, performer, details) VALUES (?, ?, ?)`)
        .run('Member removed', 'Admin', `${existing.name} (${existing.email}) removed`);

      return c.json({ success: true, message: 'Member removed successfully' });
    } catch (err: any) {
      return c.json({ success: false, error: 'Failed to remove member', message: err.message }, 500);
    } finally {
      db.close();
    }
  });

  // ── GET /api/organization/security-policies ────────────────────────────

  app.get('/api/organization/security-policies', (c) => {
    const db = getDb();
    try {
      ensureSchema(db);
      const rows = db.prepare('SELECT * FROM org_security_policies ORDER BY id ASC').all() as any[];
      return c.json({ success: true, data: rows.map(mapPolicy) });
    } catch (err: any) {
      return c.json({ success: false, error: 'Failed to fetch security policies', message: err.message }, 500);
    } finally {
      db.close();
    }
  });

  // ── PUT /api/organization/security-policies ────────────────────────────

  app.put('/api/organization/security-policies', async (c) => {
    let body: unknown;
    try { body = await c.req.json(); } catch {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    let v: z.infer<typeof UpdatePoliciesSchema>;
    try {
      v = UpdatePoliciesSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: err.issues }, 400);
      }
      throw err;
    }

    const db = getDb();
    try {
      ensureSchema(db);
      const update = db.prepare(`
        UPDATE org_security_policies SET enabled = ? WHERE policy_name = ?
      `);
      const applyUpdates = db.transaction(() => {
        for (const p of v.policies) {
          update.run(p.enabled ? 1 : 0, p.policyName);
        }
      });
      applyUpdates();

      db.prepare(`INSERT INTO org_audit_log (action, performer, details) VALUES (?, ?, ?)`)
        .run('Security policies updated', 'Admin',
          v.policies.map(p => `${p.policyName}=${p.enabled}`).join(', '));

      const rows = db.prepare('SELECT * FROM org_security_policies ORDER BY id ASC').all() as any[];
      return c.json({ success: true, data: rows.map(mapPolicy) });
    } catch (err: any) {
      return c.json({ success: false, error: 'Failed to update security policies', message: err.message }, 500);
    } finally {
      db.close();
    }
  });

  // ── GET /api/organization/audit-log ────────────────────────────────────

  app.get('/api/organization/audit-log', (c) => {
    const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 10_000);
    const offset = Math.max(parseInt(c.req.query('offset') ?? '0', 10), 0);

    const db = getDb();
    try {
      ensureSchema(db);
      const total = (db.prepare('SELECT COUNT(*) as c FROM org_audit_log').get() as any).c;
      const rows = db.prepare(
        'SELECT * FROM org_audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).all(limit, offset) as any[];
      return c.json({ success: true, data: rows.map(mapAuditEntry), total, limit, offset });
    } catch (err: any) {
      return c.json({ success: false, error: 'Failed to fetch audit log', message: err.message }, 500);
    } finally {
      db.close();
    }
  });

  // ── POST /api/organization/audit-log ───────────────────────────────────

  app.post('/api/organization/audit-log', async (c) => {
    let body: unknown;
    try { body = await c.req.json(); } catch {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    let v: z.infer<typeof AddAuditLogSchema>;
    try {
      v = AddAuditLogSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: err.issues }, 400);
      }
      throw err;
    }

    const db = getDb();
    try {
      ensureSchema(db);
      const result = db.prepare(`
        INSERT INTO org_audit_log (action, performer, details) VALUES (?, ?, ?)
      `).run(v.action, v.performer ?? 'Admin', v.details ?? null) as any;

      const entry = db.prepare('SELECT * FROM org_audit_log WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapAuditEntry(entry) }, 201);
    } catch (err: any) {
      return c.json({ success: false, error: 'Failed to add audit log entry', message: err.message }, 500);
    } finally {
      db.close();
    }
  });

  // ── GET /api/organization/api-key ──────────────────────────────────────

  app.get('/api/organization/api-key', (c) => {
    const db = getDb();
    try {
      ensureSchema(db);
      const row = db.prepare(
        "SELECT * FROM org_api_keys WHERE org_id = 'default' ORDER BY id DESC LIMIT 1"
      ).get() as any;
      if (!row) return c.json({ success: false, error: 'API key not found' }, 404);
      return c.json({
        success: true,
        data: {
          id: row.id,
          maskedKey: maskApiKey(row.api_key),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      });
    } catch (err: any) {
      return c.json({ success: false, error: 'Failed to fetch API key', message: err.message }, 500);
    } finally {
      db.close();
    }
  });

  // ── POST /api/organization/api-key/regenerate ─────────────────────────

  app.post('/api/organization/api-key/regenerate', (c) => {
    const db = getDb();
    try {
      ensureSchema(db);
      const newKey = generateApiKey();
      const ts = now();

      const existing = db.prepare("SELECT id FROM org_api_keys WHERE org_id = 'default'").get();
      if (existing) {
        db.prepare("UPDATE org_api_keys SET api_key = ?, updated_at = ? WHERE org_id = 'default'")
          .run(newKey, ts);
      } else {
        db.prepare("INSERT INTO org_api_keys (org_id, api_key, created_at, updated_at) VALUES ('default', ?, ?, ?)")
          .run(newKey, ts, ts);
      }

      db.prepare(`INSERT INTO org_audit_log (action, performer, details) VALUES (?, ?, ?)`)
        .run('API key regenerated', 'Admin', null);

      return c.json({
        success: true,
        data: {
          maskedKey: maskApiKey(newKey),
          regeneratedKey: newKey,   // returned once, store securely
          updatedAt: ts,
        },
        message: 'API key regenerated. Store the new key securely — it will not be shown again.',
      });
    } catch (err: any) {
      return c.json({ success: false, error: 'Failed to regenerate API key', message: err.message }, 500);
    } finally {
      db.close();
    }
  });
}
