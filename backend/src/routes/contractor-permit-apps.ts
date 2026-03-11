/**
 * Contractor Permit Applications Routes
 * Serves the ContractorPermitManagement.tsx page.
 *
 * Uses permit_to_work + ptw_approvals tables.
 * Returns data in the PermitApplication shape expected by the frontend.
 *
 * Routes:
 *   GET  /api/permit-apps/stats
 *   GET  /api/permit-apps             (status, type filters)
 *   POST /api/permit-apps
 *   GET  /api/permit-apps/:id
 *   PUT  /api/permit-apps/:id
 *   DELETE /api/permit-apps/:id
 *   POST /api/permit-apps/:id/approve
 *   POST /api/permit-apps/:id/reject
 */

import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProdRoute ? '/data/local.sqlite' : resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Math.floor(Date.now() / 1000);

function safeJson(v: any, def: any = []) {
  try { return v !== null && v !== undefined ? JSON.parse(v) : def; } catch { return def; }
}

// ── Normalizers ────────────────────────────────────────────────────────────────
const VALID_PERMIT_TYPES = ['hot_work', 'confined_space', 'working_at_height', 'excavation', 'electrical', 'lifting', 'general'] as const;
type PermitType = typeof VALID_PERMIT_TYPES[number];
function normalizePermitType(v?: string | null): PermitType {
  if (!v) return 'general';
  // handle both underscore and hyphen variants
  const normalized = v.replace(/-/g, '_').toLowerCase();
  if ((VALID_PERMIT_TYPES as readonly string[]).includes(normalized)) return normalized as PermitType;
  if (normalized === 'hot_work' || normalized === 'hotwork') return 'hot_work';
  if (normalized === 'confined_space') return 'confined_space';
  if (normalized === 'working_at_height') return 'working_at_height';
  if (normalized === 'electrical') return 'electrical';
  if (normalized === 'excavation') return 'excavation';
  if (normalized === 'lifting') return 'lifting';
  return 'general';
}

const VALID_STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'active', 'completed', 'expired', 'suspended'] as const;
type PermitStatus = typeof VALID_STATUSES[number];
function normalizeStatus(v?: string | null): PermitStatus {
  if (!v) return 'draft';
  if ((VALID_STATUSES as readonly string[]).includes(v)) return v as PermitStatus;
  if (v === 'pending-approval' || v === 'pending_approval') return 'under_review';
  if (v === 'cancelled') return 'rejected';
  return 'draft';
}

const VALID_RISK = ['low', 'medium', 'high', 'critical'] as const;
type RiskLevel = typeof VALID_RISK[number];
function normalizeRisk(v?: string | null): RiskLevel {
  if (v && (VALID_RISK as readonly string[]).includes(v)) return v as RiskLevel;
  return 'medium';
}

// ── Mappers ────────────────────────────────────────────────────────────────────
function mapApproval(a: any) {
  return {
    id: String(a.id),
    role: a.approver_role ?? 'Approver',
    approverName: a.approver_name ?? '',
    status: (a.status === 'approved' || a.status === 'rejected' || a.status === 'skipped') ? a.status : 'pending',
    timestamp: a.approved_at ? new Date(a.approved_at * 1000).toISOString() : undefined,
    comments: a.comments ?? undefined,
  };
}

function mapPermitApp(row: any, approvals: any[]) {
  return {
    id: String(row.id),
    permitNumber: row.permit_number ?? '',
    contractorId: String(row.contractor_id ?? ''),
    contractorName: row.contractor_name ?? '',
    permitType: normalizePermitType(row.permit_type),
    workDescription: row.description ?? '',
    location: row.location ?? '',
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    workersAssigned: safeJson(row.workers_assigned),
    riskLevel: normalizeRisk(row.risk_level),
    status: normalizeStatus(row.status),
    submittedAt: row.submitted_at ?? new Date((row.created_at ?? 0) * 1000).toISOString(),
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    approvalChain: approvals.map(mapApproval),
    attachments: safeJson(row.attachments),
    safetyChecklist: safeJson(row.safety_checklist),
    specialConditions: safeJson(row.special_conditions),
  };
}

// ── Schemas ────────────────────────────────────────────────────────────────────
const CreatePermitAppSchema = z.object({
  contractorId: z.union([z.number(), z.string()]).optional(),
  contractorName: z.string().optional(),
  permitType: z.string().optional(),
  workDescription: z.string().min(1),
  location: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  workersAssigned: z.array(z.string()).optional(),
  riskLevel: z.string().optional(),
  status: z.string().optional(),
  submittedAt: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  safetyChecklist: z.array(z.any()).optional(),
  specialConditions: z.array(z.string()).optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
});

const UpdatePermitAppSchema = CreatePermitAppSchema.partial();

function genPermitNumber(db: Database.Database): string {
  const row = db.prepare("SELECT permit_number FROM permit_to_work WHERE permit_number LIKE 'PTW-%' ORDER BY id DESC LIMIT 1").get() as any;
  if (row?.permit_number) {
    const parts = row.permit_number.split('-');
    const last = Number(parts[parts.length - 1]);
    if (!isNaN(last)) {
      const year = new Date().getFullYear();
      return `PTW-${year}-${String(last + 1).padStart(4, '0')}`;
    }
  }
  const year = new Date().getFullYear();
  const maxId = (db.prepare('SELECT MAX(id) as m FROM permit_to_work').get() as any)?.m ?? 0;
  return `PTW-${year}-${String(maxId + 1).padStart(4, '0')}`;
}

// ── Route Registration ─────────────────────────────────────────────────────────
export function contractorPermitAppsRoutes(app: Hono) {

  // GET /api/permit-apps/stats
  app.get('/api/permit-apps/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as n FROM permit_to_work').get() as any).n;
      const active = (db.prepare("SELECT COUNT(*) as n FROM permit_to_work WHERE status IN ('active','approved')").get() as any).n;
      const pending = (db.prepare("SELECT COUNT(*) as n FROM permit_to_work WHERE status IN ('under_review','submitted')").get() as any).n;
      const rejected = (db.prepare("SELECT COUNT(*) as n FROM permit_to_work WHERE status = 'rejected'").get() as any).n;
      const completed = (db.prepare("SELECT COUNT(*) as n FROM permit_to_work WHERE status = 'completed'").get() as any).n;
      const draft = (db.prepare("SELECT COUNT(*) as n FROM permit_to_work WHERE status = 'draft'").get() as any).n;
      const totalContractors = (db.prepare('SELECT COUNT(*) as n FROM contractors').get() as any).n;
      const activeContractors = (db.prepare("SELECT COUNT(*) as n FROM contractors WHERE status = 'active'").get() as any).n;
      return c.json({ success: true, data: { total, active, pending, rejected, completed, draft, totalContractors, activeContractors } });
    } finally { db.close(); }
  });

  // GET /api/permit-apps  (list, with filters)
  app.get('/api/permit-apps', (c) => {
    const { status, type, contractorId, search } = c.req.query();
    const db = getDb();
    try {
      let sql = 'SELECT * FROM permit_to_work WHERE 1=1';
      const params: any[] = [];
      if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
      if (type && type !== 'all') { sql += ' AND permit_type = ?'; params.push(type); }
      if (contractorId) { sql += ' AND contractor_id = ?'; params.push(Number(contractorId)); }
      if (search) { sql += ' AND (permit_number LIKE ? OR contractor_name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      sql += ' ORDER BY created_at DESC';
      const rows = db.prepare(sql).all(...params) as any[];
      const data = rows.map(row => {
        const approvals = db.prepare('SELECT * FROM ptw_approvals WHERE permit_id = ? ORDER BY id ASC').all(row.id) as any[];
        return mapPermitApp(row, approvals);
      });
      return c.json({ success: true, data });
    } finally { db.close(); }
  });

  // POST /api/permit-apps
  app.post('/api/permit-apps', async (c) => {
    const body = await c.req.json();
    const parsed = CreatePermitAppSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    const d = parsed.data;
    const db = getDb();
    try {
      const ts = now();
      const permitNumber = genPermitNumber(db);
      const result = db.prepare(`
        INSERT INTO permit_to_work (permit_number, permit_type, title, location, description, risk_level, status,
          contractor_id, contractor_name, workers_assigned, start_date, end_date, submitted_at,
          attachments, safety_checklist, special_conditions, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        permitNumber,
        normalizePermitType(d.permitType),
        d.workDescription,
        d.location,
        d.workDescription,
        normalizeRisk(d.riskLevel),
        normalizeStatus(d.status ?? 'draft'),
        d.contractorId ? Number(d.contractorId) : null,
        d.contractorName ?? null,
        JSON.stringify(d.workersAssigned ?? []),
        d.startDate ?? null,
        d.endDate ?? null,
        d.submittedAt ?? new Date().toISOString(),
        JSON.stringify(d.attachments ?? []),
        JSON.stringify(d.safetyChecklist ?? []),
        JSON.stringify(d.specialConditions ?? []),
        ts, ts,
      );
      const row = db.prepare('SELECT * FROM permit_to_work WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapPermitApp(row, []) }, 201);
    } finally { db.close(); }
  });

  // POST /api/permit-apps/:id/approve  — must be before /:id
  app.post('/api/permit-apps/:id/approve', async (c) => {
    const id = Number(c.req.param('id'));
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM permit_to_work WHERE id = ?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Not found' }, 404);
      const body = await c.req.json().catch(() => ({})) as any;
      const ts = now();
      db.prepare(`INSERT INTO ptw_approvals (permit_id, approver_name, approver_role, status, comments, approved_at, created_at)
        VALUES (?, ?, ?, 'approved', ?, ?, ?)`).run(id, body.approverName ?? 'Approver', body.approverRole ?? null, body.comments ?? null, ts, ts);
      db.prepare("UPDATE permit_to_work SET status = 'approved', approved_by = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ?")
        .run(body.approverName ?? 'Approver', body.approverName ?? 'Approver', new Date().toISOString(), ts, id);
      const updated = db.prepare('SELECT * FROM permit_to_work WHERE id = ?').get(id) as any;
      const approvals = db.prepare('SELECT * FROM ptw_approvals WHERE permit_id = ? ORDER BY id ASC').all(id) as any[];
      return c.json({ success: true, data: mapPermitApp(updated, approvals) });
    } finally { db.close(); }
  });

  // POST /api/permit-apps/:id/reject  — must be before /:id
  app.post('/api/permit-apps/:id/reject', async (c) => {
    const id = Number(c.req.param('id'));
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM permit_to_work WHERE id = ?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Not found' }, 404);
      const body = await c.req.json().catch(() => ({})) as any;
      const ts = now();
      db.prepare(`INSERT INTO ptw_approvals (permit_id, approver_name, approver_role, status, comments, approved_at, created_at)
        VALUES (?, ?, ?, 'rejected', ?, ?, ?)`).run(id, body.approverName ?? 'Reviewer', body.approverRole ?? null, body.comments ?? null, ts, ts);
      db.prepare("UPDATE permit_to_work SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ?")
        .run(body.approverName ?? 'Reviewer', new Date().toISOString(), ts, id);
      const updated = db.prepare('SELECT * FROM permit_to_work WHERE id = ?').get(id) as any;
      const approvals = db.prepare('SELECT * FROM ptw_approvals WHERE permit_id = ? ORDER BY id ASC').all(id) as any[];
      return c.json({ success: true, data: mapPermitApp(updated, approvals) });
    } finally { db.close(); }
  });

  // GET /api/permit-apps/:id
  app.get('/api/permit-apps/:id', (c) => {
    const id = Number(c.req.param('id'));
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM permit_to_work WHERE id = ?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Not found' }, 404);
      const approvals = db.prepare('SELECT * FROM ptw_approvals WHERE permit_id = ? ORDER BY id ASC').all(id) as any[];
      return c.json({ success: true, data: mapPermitApp(row, approvals) });
    } finally { db.close(); }
  });

  // PUT /api/permit-apps/:id
  app.put('/api/permit-apps/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const db = getDb();
    try {
      const existing = db.prepare('SELECT * FROM permit_to_work WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Not found' }, 404);
      const body = await c.req.json();
      const parsed = UpdatePermitAppSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
      const d = parsed.data;
      const ts = now();
      db.prepare(`UPDATE permit_to_work SET
        permit_type = ?, description = ?, title = ?, location = ?, risk_level = ?, status = ?,
        contractor_id = ?, contractor_name = ?, workers_assigned = ?,
        start_date = ?, end_date = ?, reviewed_by = ?, reviewed_at = ?,
        attachments = ?, safety_checklist = ?, special_conditions = ?, updated_at = ?
        WHERE id = ?`).run(
        d.permitType ? normalizePermitType(d.permitType) : existing.permit_type,
        d.workDescription ?? existing.description,
        d.workDescription ?? existing.title,
        d.location ?? existing.location,
        d.riskLevel ? normalizeRisk(d.riskLevel) : existing.risk_level,
        d.status ? normalizeStatus(d.status) : existing.status,
        d.contractorId !== undefined ? Number(d.contractorId) : existing.contractor_id,
        d.contractorName ?? existing.contractor_name,
        d.workersAssigned !== undefined ? JSON.stringify(d.workersAssigned) : existing.workers_assigned,
        d.startDate ?? existing.start_date,
        d.endDate ?? existing.end_date,
        d.reviewedBy ?? existing.reviewed_by,
        d.reviewedAt ?? existing.reviewed_at,
        d.attachments !== undefined ? JSON.stringify(d.attachments) : existing.attachments,
        d.safetyChecklist !== undefined ? JSON.stringify(d.safetyChecklist) : existing.safety_checklist,
        d.specialConditions !== undefined ? JSON.stringify(d.specialConditions) : existing.special_conditions,
        ts, id,
      );
      const updated = db.prepare('SELECT * FROM permit_to_work WHERE id = ?').get(id) as any;
      const approvals = db.prepare('SELECT * FROM ptw_approvals WHERE permit_id = ? ORDER BY id ASC').all(id) as any[];
      return c.json({ success: true, data: mapPermitApp(updated, approvals) });
    } finally { db.close(); }
  });

  // DELETE /api/permit-apps/:id
  app.delete('/api/permit-apps/:id', (c) => {
    const id = Number(c.req.param('id'));
    const db = getDb();
    try {
      const row = db.prepare('SELECT id FROM permit_to_work WHERE id = ?').get(id);
      if (!row) return c.json({ success: false, error: 'Not found' }, 404);
      db.prepare('DELETE FROM ptw_approvals WHERE permit_id = ?').run(id);
      db.prepare('DELETE FROM permit_to_work WHERE id = ?').run(id);
      return c.json({ success: true });
    } finally { db.close(); }
  });
}
