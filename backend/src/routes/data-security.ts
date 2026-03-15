import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { DB_PATH } from '../config/env';

function getDb() { return new Database(DB_PATH); }

function mapSsoProvider(row: any) {
  return {
    id: row.id,
    name: row.name,
    protocol: row.protocol,
    status: row.status as 'connected' | 'configured' | 'disconnected',
    icon: row.icon,
    connectedUsers: row.connected_users,
    lastSync: row.last_sync,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuditLog(row: any) {
  return {
    id: row.id,
    userName: row.user_name,
    action: row.action,
    resource: row.resource,
    fieldName: row.field_name ?? null,
    oldValue: row.old_value ?? null,
    newValue: row.new_value ?? null,
    ipAddress: row.ip_address,
    timestamp: row.timestamp,
    createdAt: row.created_at,
  };
}

// Static RBAC matrix — served from backend so it's easily extensible
const RBAC_MATRIX = {
  roles: ['Admin', 'Safety Manager', 'Supervisor', 'Worker', 'Contractor', 'HR'],
  resources: [
    { name: 'Incidents (All)',     admin: 'full', safetyMgr: 'full', supervisor: 'read', worker: 'own',  contractor: 'none', hr: 'read' },
    { name: 'Medical Records',     admin: 'full', safetyMgr: 'none', supervisor: 'none', worker: 'own',  contractor: 'none', hr: 'full' },
    { name: 'Confidential Reports',admin: 'full', safetyMgr: 'read', supervisor: 'none', worker: 'none', contractor: 'none', hr: 'full' },
    { name: 'Risk Assessments',    admin: 'full', safetyMgr: 'full', supervisor: 'full', worker: 'read', contractor: 'read', hr: 'none' },
    { name: 'Training Records',    admin: 'full', safetyMgr: 'full', supervisor: 'read', worker: 'own',  contractor: 'own',  hr: 'read' },
    { name: 'Audit Reports',       admin: 'full', safetyMgr: 'full', supervisor: 'read', worker: 'none', contractor: 'none', hr: 'read' },
    { name: 'Compliance Data',     admin: 'full', safetyMgr: 'full', supervisor: 'read', worker: 'none', contractor: 'none', hr: 'none' },
    { name: 'Contractor Permits',  admin: 'full', safetyMgr: 'full', supervisor: 'full', worker: 'read', contractor: 'own',  hr: 'none' },
    { name: 'User Management',     admin: 'full', safetyMgr: 'none', supervisor: 'none', worker: 'none', contractor: 'none', hr: 'read' },
    { name: 'System Settings',     admin: 'full', safetyMgr: 'none', supervisor: 'none', worker: 'none', contractor: 'none', hr: 'none' },
  ],
};

const UpdateSsoProviderSchema = z.object({
  status: z.enum(['connected', 'configured', 'disconnected']).optional(),
  connectedUsers: z.number().int().min(0).optional(),
  lastSync: z.string().optional(),
  config: z.any().optional(),
});

const CreateAuditLogSchema = z.object({
  userName: z.string().min(1),
  action: z.string().min(1),
  resource: z.string().min(1),
  fieldName: z.string().optional().nullable(),
  oldValue: z.string().optional().nullable(),
  newValue: z.string().optional().nullable(),
  ipAddress: z.string().optional().default(''),
  timestamp: z.string().optional(),
});

export function dataSecurityRoutes(app: Hono) {

  // GET /api/data-security/stats
  app.get('/api/data-security/stats', (c) => {
    const db = getDb();
    try {
      const totalProviders = (db.prepare('SELECT COUNT(*) as n FROM sso_providers').get() as any).n as number;
      const connectedProviders = (db.prepare("SELECT COUNT(*) as n FROM sso_providers WHERE status = 'connected'").get() as any).n as number;
      const ssoCoverage = totalProviders > 0
        ? `${Math.round((connectedProviders / totalProviders) * 100)}%`
        : '0%';

      const rbacPolicies = RBAC_MATRIX.roles.length * RBAC_MATRIX.resources.length;

      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 19).replace('T', ' ');
      const auditEvents24h = (db.prepare(
        "SELECT COUNT(*) as n FROM security_audit_logs WHERE timestamp >= ?"
      ).get(since24h) as any).n as number;

      const failedLogins24h = (db.prepare(
        "SELECT COUNT(*) as n FROM security_audit_logs WHERE action = 'Login Failed'"
      ).get() as any).n as number;

      return c.json({
        success: true,
        data: {
          ssoCoverage,
          rbacPolicies,
          auditEvents24h,
          failedLogins24h,
          dataEncrypted: '100%',
          iso45001Ready: 'Yes',
        },
      });
    } catch (error) {
      console.error('[API] Data Security stats error:', error);
      return c.json({ success: false, error: 'Failed to fetch security stats' }, 500);
    }
  });

  // GET /api/data-security/sso-providers
  app.get('/api/data-security/sso-providers', (c) => {
    const db = getDb();
    try {
      const rows = db.prepare('SELECT * FROM sso_providers ORDER BY id ASC').all();
      return c.json({ success: true, data: rows.map(mapSsoProvider) });
    } catch (error) {
      console.error('[API] SSO providers fetch error:', error);
      return c.json({ success: false, error: 'Failed to fetch SSO providers' }, 500);
    }
  });

  // PUT /api/data-security/sso-providers/:id
  app.put('/api/data-security/sso-providers/:id', async (c) => {
    const id = Number(c.req.param('id'));
    if (!id || isNaN(id)) return c.json({ success: false, error: 'Invalid id' }, 400);
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = UpdateSsoProviderSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ success: false, error: parsed.error.issues[0]?.message || 'Validation error' }, 400);
      }
      const d = parsed.data;
      const existing = db.prepare('SELECT id FROM sso_providers WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'SSO provider not found' }, 404);

      const updates: string[] = [];
      const vals: any[] = [];
      if (d.status !== undefined) { updates.push('status = ?'); vals.push(d.status); }
      if (d.connectedUsers !== undefined) { updates.push('connected_users = ?'); vals.push(d.connectedUsers); }
      if (d.lastSync !== undefined) { updates.push('last_sync = ?'); vals.push(d.lastSync); }
      if (d.config !== undefined) { updates.push('config = ?'); vals.push(JSON.stringify(d.config)); }

      if (updates.length === 0) {
        const row = db.prepare('SELECT * FROM sso_providers WHERE id = ?').get(id);
        return c.json({ success: true, data: mapSsoProvider(row) });
      }

      updates.push('updated_at = ?');
      vals.push(Date.now());
      vals.push(id);
      db.prepare(`UPDATE sso_providers SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
      const updated = db.prepare('SELECT * FROM sso_providers WHERE id = ?').get(id);
      return c.json({ success: true, data: mapSsoProvider(updated) });
    } catch (error) {
      console.error('[API] SSO provider update error:', error);
      return c.json({ success: false, error: 'Failed to update SSO provider' }, 500);
    }
  });

  // GET /api/data-security/audit-logs
  app.get('/api/data-security/audit-logs', (c) => {
    const db = getDb();
    try {
      const { search, action, limit: limitQ, offset: offsetQ } = c.req.query();
      const limit = Math.min(Number(limitQ) || 50, 200);
      const offset = Number(offsetQ) || 0;

      const conditions: string[] = [];
      const params: any[] = [];

      if (search) {
        conditions.push('(user_name LIKE ? OR resource LIKE ? OR action LIKE ?)');
        const like = `%${search}%`;
        params.push(like, like, like);
      }
      if (action) {
        conditions.push('action = ?');
        params.push(action);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sql = `SELECT * FROM security_audit_logs ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const rows = db.prepare(sql).all(...params);
      return c.json({ success: true, data: rows.map(mapAuditLog) });
    } catch (error) {
      console.error('[API] Audit logs fetch error:', error);
      return c.json({ success: false, error: 'Failed to fetch audit logs' }, 500);
    }
  });

  // POST /api/data-security/audit-logs
  app.post('/api/data-security/audit-logs', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateAuditLogSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ success: false, error: parsed.error.issues[0]?.message || 'Validation error' }, 400);
      }
      const d = parsed.data;
      const ts = d.timestamp ?? new Date().toISOString().slice(0, 19).replace('T', ' ');
      const now = Date.now();
      const result = db.prepare(`
        INSERT INTO security_audit_logs (user_name, action, resource, field_name, old_value, new_value, ip_address, timestamp, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        d.userName, d.action, d.resource,
        d.fieldName ?? null, d.oldValue ?? null, d.newValue ?? null,
        d.ipAddress, ts, now,
      );
      const row = db.prepare('SELECT * FROM security_audit_logs WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapAuditLog(row) }, 201);
    } catch (error) {
      console.error('[API] Audit log create error:', error);
      return c.json({ success: false, error: 'Failed to create audit log' }, 500);
    }
  });

  // GET /api/data-security/rbac
  app.get('/api/data-security/rbac', (c) => {
    return c.json({ success: true, data: RBAC_MATRIX });
  });
}
