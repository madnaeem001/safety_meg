import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Math.floor(Date.now() / 1000);

// ── Schema setup ──────────────────────────────────────────────────────────────
let _initialized = false;

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS permit_to_work (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permit_number TEXT UNIQUE NOT NULL,
      permit_type TEXT NOT NULL DEFAULT 'general',
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      work_area TEXT,
      description TEXT,
      risk_level TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'draft',
      requested_by TEXT,
      approved_by TEXT,
      start_date TEXT,
      end_date TEXT,
      actual_start TEXT,
      actual_end TEXT,
      ppe_required TEXT DEFAULT '[]',
      precautions TEXT DEFAULT '[]',
      emergency_procedure TEXT,
      iot_sensor_ids TEXT DEFAULT '[]',
      department TEXT,
      contractor_id INTEGER,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ptw_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permit_id INTEGER NOT NULL REFERENCES permit_to_work(id) ON DELETE CASCADE,
      approver_name TEXT NOT NULL,
      approver_role TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      comments TEXT,
      approved_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ptw_status ON permit_to_work(status);
    CREATE INDEX IF NOT EXISTS idx_ptw_type ON permit_to_work(permit_type);
    CREATE INDEX IF NOT EXISTS idx_ptw_dept ON permit_to_work(department);
    CREATE INDEX IF NOT EXISTS idx_ptw_app_id ON ptw_approvals(permit_id);
  `);
}

function seedData(db: Database.Database) {
  const ts = now();
  const seeds: { num: string; type: string; title: string; loc: string; risk: string; status: string; dept: string; reqBy: string; appBy?: string }[] = [
    { num: 'PTW-00001', type: 'hot-work', title: 'Hot Work - Welding Operations', loc: 'Plant 2 - Welding Bay', risk: 'high', status: 'active', dept: 'Maintenance', reqBy: 'John Doe' },
    { num: 'PTW-00002', type: 'confined-space', title: 'Confined Space Entry - Tank Cleaning', loc: 'Facility A - Storage Tank T-12', risk: 'critical', status: 'pending-approval', dept: 'Operations', reqBy: 'Jane Smith' },
    { num: 'PTW-00003', type: 'electrical', title: 'Electrical Panel Maintenance', loc: 'Main Distribution Board - MDB-01', risk: 'medium', status: 'approved', dept: 'Electrical', reqBy: 'Bob Johnson', appBy: 'Safety Manager' },
    { num: 'PTW-00004', type: 'working-at-height', title: 'Roof Inspection and Repair', loc: 'Block C - Third Floor', risk: 'low', status: 'draft', dept: 'Facilities', reqBy: 'Alice Brown' },
  ];
  for (const s of seeds) {
    db.prepare(`
      INSERT OR IGNORE INTO permit_to_work
        (permit_number, permit_type, title, location, risk_level, status, department,
         requested_by, approved_by, ppe_required, precautions, iot_sensor_ids, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,'[]','[]','[]',?,?)
    `).run(s.num, s.type, s.title, s.loc, s.risk, s.status, s.dept, s.reqBy, s.appBy ?? null, ts, ts);
  }
  const p3 = db.prepare("SELECT id FROM permit_to_work WHERE permit_number='PTW-00003'").get() as any;
  if (p3) {
    db.prepare(`
      INSERT INTO ptw_approvals (permit_id, approver_name, approver_role, status, comments, approved_at, created_at)
      SELECT ?,?,?,'approved',?,?,? WHERE NOT EXISTS (SELECT 1 FROM ptw_approvals WHERE permit_id=?)
    `).run(p3.id, 'Safety Manager', 'EHS Officer', 'Verified safe to proceed.', ts, ts, p3.id);
  }
}

function initOnce() {
  if (_initialized) return;
  const db = getDb();
  try { ensureSchema(db); seedData(db); _initialized = true; } finally { db.close(); }
}

// ── Mappers ───────────────────────────────────────────────────────────────────
function safeJson(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

function mapPermit(row: any) {
  return {
    id: row.id,
    permitNumber: row.permit_number,
    permitType: row.permit_type,
    title: row.title,
    location: row.location,
    workArea: row.work_area ?? null,
    description: row.description ?? null,
    riskLevel: row.risk_level,
    status: row.status,
    requestedBy: row.requested_by ?? null,
    approvedBy: row.approved_by ?? null,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    actualStart: row.actual_start ?? null,
    actualEnd: row.actual_end ?? null,
    ppeRequired: safeJson(row.ppe_required),
    precautions: safeJson(row.precautions),
    emergencyProcedure: row.emergency_procedure ?? null,
    iotSensorIds: safeJson(row.iot_sensor_ids),
    department: row.department ?? null,
    contractorId: row.contractor_id ?? null,
    notes: row.notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapApproval(row: any) {
  return {
    id: row.id,
    permitId: row.permit_id,
    approverName: row.approver_name,
    approverRole: row.approver_role ?? null,
    status: row.status,
    comments: row.comments ?? null,
    approvedAt: row.approved_at ?? null,
    createdAt: row.created_at,
  };
}

function pad(n: number, len = 5) {
  return String(n).padStart(len, '0');
}

function genPermitNumber(db: Database.Database): string {
  const row = db.prepare('SELECT MAX(id) as maxId FROM permit_to_work').get() as any;
  return `PTW-${pad((row?.maxId ?? 0) + 1)}`;
}

// ── Validation ────────────────────────────────────────────────────────────────
const CreatePTWSchema = z.object({
  permitType: z.enum(['hot-work', 'confined-space', 'working-at-height', 'electrical', 'excavation', 'general']),
  title: z.string().min(1),
  location: z.string().min(1),
  workArea: z.string().optional(),
  description: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  requestedBy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  ppeRequired: z.array(z.string()).optional(),
  precautions: z.array(z.string()).optional(),
  emergencyProcedure: z.string().optional(),
  iotSensorIds: z.array(z.string()).optional(),
  department: z.string().optional(),
  contractorId: z.number().optional(),
  notes: z.string().optional(),
});

const ApprovalSchema = z.object({
  approverName: z.string().min(1),
  approverRole: z.string().optional(),
  comments: z.string().optional(),
});

export function permitToWorkRoutes(app: Hono) {
  // GET /api/ptw/stats
  app.get('/api/ptw/stats', (c) => {
    initOnce();
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as n FROM permit_to_work').get() as any).n;
      const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM permit_to_work GROUP BY status').all();
      const byType = db.prepare('SELECT permit_type as permitType, COUNT(*) as count FROM permit_to_work GROUP BY permit_type').all();
      const byRiskLevel = db.prepare('SELECT risk_level as riskLevel, COUNT(*) as count FROM permit_to_work GROUP BY risk_level').all();
      const active = (db.prepare("SELECT COUNT(*) as n FROM permit_to_work WHERE status='active'").get() as any).n;
      const pendingApproval = (db.prepare("SELECT COUNT(*) as n FROM permit_to_work WHERE status='pending-approval'").get() as any).n;
      const expiringSoon = (db.prepare(`
        SELECT COUNT(*) as n FROM permit_to_work
        WHERE status='active' AND end_date IS NOT NULL
        AND date(end_date) <= date('now', '+1 day')
        AND date(end_date) >= date('now')
      `).get() as any).n;
      return c.json({ success: true, data: { total, active, pendingApproval, expiringSoon, byStatus, byType, byRiskLevel } });
    } finally { db.close(); }
  });

  // GET /api/ptw/permits [STATIC before /:id]
  app.get('/api/ptw/permits', (c) => {
    initOnce();
    const db = getDb();
    try {
      const { status, permitType, riskLevel, department, from, to } = c.req.query();
      let sql = 'SELECT * FROM permit_to_work WHERE 1=1';
      const params: any[] = [];
      if (status) { sql += ' AND status=?'; params.push(status); }
      if (permitType) { sql += ' AND permit_type=?'; params.push(permitType); }
      if (riskLevel) { sql += ' AND risk_level=?'; params.push(riskLevel); }
      if (department) { sql += ' AND department=?'; params.push(department); }
      if (from) { sql += ' AND created_at >= ?'; params.push(Number(from)); }
      if (to) { sql += ' AND created_at <= ?'; params.push(Number(to)); }
      sql += ' ORDER BY created_at DESC';
      const rows = db.prepare(sql).all(...params) as any[];
      const data = rows.map(mapPermit);
      return c.json({ success: true, data, count: data.length });
    } finally { db.close(); }
  });

  // POST /api/ptw/permits
  app.post('/api/ptw/permits', async (c) => {
    initOnce();
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreatePTWSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
      const d = parsed.data;
      const permitNumber = genPermitNumber(db);
      const ts = now();
      const result = db.prepare(`
        INSERT INTO permit_to_work
        (permit_number, permit_type, title, location, work_area, description, risk_level,
         status, requested_by, start_date, end_date, ppe_required, precautions,
         emergency_procedure, iot_sensor_ids, department, contractor_id, notes,
         created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        permitNumber, d.permitType, d.title, d.location,
        d.workArea ?? null, d.description ?? null, d.riskLevel ?? 'medium',
        'draft', d.requestedBy ?? null, d.startDate ?? null, d.endDate ?? null,
        JSON.stringify(d.ppeRequired ?? []),
        JSON.stringify(d.precautions ?? []),
        d.emergencyProcedure ?? null,
        JSON.stringify(d.iotSensorIds ?? []),
        d.department ?? null, d.contractorId ?? null, d.notes ?? null,
        ts, ts
      );
      const row = db.prepare('SELECT * FROM permit_to_work WHERE id=?').get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapPermit(row) }, 201);
    } finally { db.close(); }
  });

  // POST /api/ptw/permits/:id/approve [STATIC sub-route BEFORE /:id GET]
  app.post('/api/ptw/permits/:id/approve', async (c) => {
    initOnce();
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const permit = db.prepare('SELECT * FROM permit_to_work WHERE id=?').get(id) as any;
      if (!permit) return c.json({ success: false, error: 'Permit not found' }, 404);
      const body = await c.req.json().catch(() => ({}));
      const parsed = ApprovalSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
      const { approverName, approverRole, comments } = parsed.data;
      const ts = now();
      db.prepare(`
        INSERT INTO ptw_approvals (permit_id, approver_name, approver_role, status, comments, approved_at, created_at)
        VALUES (?,?,?,'approved',?,?,?)
      `).run(id, approverName, approverRole ?? null, comments ?? null, ts, ts);
      db.prepare("UPDATE permit_to_work SET status='approved', approved_by=?, updated_at=? WHERE id=?").run(approverName, ts, id);
      const updated = db.prepare('SELECT * FROM permit_to_work WHERE id=?').get(id) as any;
      const approvals = (db.prepare('SELECT * FROM ptw_approvals WHERE permit_id=? ORDER BY created_at DESC').all(id) as any[]).map(mapApproval);
      return c.json({ success: true, data: { ...mapPermit(updated), approvals } });
    } finally { db.close(); }
  });

  // POST /api/ptw/permits/:id/reject [STATIC sub-route BEFORE /:id GET]
  app.post('/api/ptw/permits/:id/reject', async (c) => {
    initOnce();
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const permit = db.prepare('SELECT * FROM permit_to_work WHERE id=?').get(id) as any;
      if (!permit) return c.json({ success: false, error: 'Permit not found' }, 404);
      const body = await c.req.json().catch(() => ({}));
      const parsed = ApprovalSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
      const { approverName, approverRole, comments } = parsed.data;
      const ts = now();
      db.prepare(`
        INSERT INTO ptw_approvals (permit_id, approver_name, approver_role, status, comments, approved_at, created_at)
        VALUES (?,?,?,'rejected',?,?,?)
      `).run(id, approverName, approverRole ?? null, comments ?? null, ts, ts);
      db.prepare("UPDATE permit_to_work SET status='cancelled', updated_at=? WHERE id=?").run(ts, id);
      const updated = db.prepare('SELECT * FROM permit_to_work WHERE id=?').get(id) as any;
      const approvals = (db.prepare('SELECT * FROM ptw_approvals WHERE permit_id=? ORDER BY created_at DESC').all(id) as any[]).map(mapApproval);
      return c.json({ success: true, data: { ...mapPermit(updated), approvals } });
    } finally { db.close(); }
  });

  // GET /api/ptw/permits/:id
  app.get('/api/ptw/permits/:id', (c) => {
    initOnce();
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const row = db.prepare('SELECT * FROM permit_to_work WHERE id=?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Permit not found' }, 404);
      const approvals = (db.prepare('SELECT * FROM ptw_approvals WHERE permit_id=? ORDER BY created_at DESC').all(id) as any[]).map(mapApproval);
      return c.json({ success: true, data: { ...mapPermit(row), approvals } });
    } finally { db.close(); }
  });

  // PUT /api/ptw/permits/:id
  app.put('/api/ptw/permits/:id', async (c) => {
    initOnce();
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const existing = db.prepare('SELECT * FROM permit_to_work WHERE id=?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Permit not found' }, 404);
      const body = await c.req.json();
      const ts = now();
      const fields: string[] = [];
      const vals: any[] = [];
      const allowed: [string, string][] = [
        ['permitType', 'permit_type'], ['title', 'title'], ['location', 'location'],
        ['workArea', 'work_area'], ['description', 'description'], ['riskLevel', 'risk_level'],
        ['status', 'status'], ['requestedBy', 'requested_by'], ['approvedBy', 'approved_by'],
        ['startDate', 'start_date'], ['endDate', 'end_date'],
        ['actualStart', 'actual_start'], ['actualEnd', 'actual_end'],
        ['emergencyProcedure', 'emergency_procedure'], ['department', 'department'],
        ['contractorId', 'contractor_id'], ['notes', 'notes'],
      ];
      for (const [camel, col] of allowed) {
        if (body[camel] !== undefined) { fields.push(`${col}=?`); vals.push(body[camel]); }
      }
      if (body.ppeRequired !== undefined) { fields.push('ppe_required=?'); vals.push(JSON.stringify(body.ppeRequired)); }
      if (body.precautions !== undefined) { fields.push('precautions=?'); vals.push(JSON.stringify(body.precautions)); }
      if (body.iotSensorIds !== undefined) { fields.push('iot_sensor_ids=?'); vals.push(JSON.stringify(body.iotSensorIds)); }
      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at=?'); vals.push(ts); vals.push(id);
      db.prepare(`UPDATE permit_to_work SET ${fields.join(', ')} WHERE id=?`).run(...vals);
      const updated = db.prepare('SELECT * FROM permit_to_work WHERE id=?').get(id) as any;
      const approvals = (db.prepare('SELECT * FROM ptw_approvals WHERE permit_id=? ORDER BY created_at DESC').all(id) as any[]).map(mapApproval);
      return c.json({ success: true, data: { ...mapPermit(updated), approvals } });
    } finally { db.close(); }
  });

  // DELETE /api/ptw/permits/:id
  app.delete('/api/ptw/permits/:id', (c) => {
    initOnce();
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const permit = db.prepare('SELECT * FROM permit_to_work WHERE id=?').get(id) as any;
      if (!permit) return c.json({ success: false, error: 'Permit not found' }, 404);
      db.prepare('DELETE FROM ptw_approvals WHERE permit_id=?').run(id);
      db.prepare('DELETE FROM permit_to_work WHERE id=?').run(id);
      return c.json({ success: true, message: 'Permit deleted' });
    } finally { db.close(); }
  });
}
