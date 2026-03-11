import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Date.now();

// ── Table bootstrap + seed ───────────────────────────────────────────────────

function ensureTable() {
  const db = getDb();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS jsa_records (
        id            TEXT PRIMARY KEY,
        title         TEXT NOT NULL,
        department    TEXT,
        location      TEXT,
        compliance    TEXT,
        steps         TEXT NOT NULL DEFAULT '[]',
        status        TEXT NOT NULL DEFAULT 'draft'
                        CHECK(status IN ('draft','pending','approved','rejected')),
        overall_risk  TEXT NOT NULL DEFAULT 'low'
                        CHECK(overall_risk IN ('low','medium','high','critical')),
        hazard_count  INTEGER NOT NULL DEFAULT 0,
        control_count INTEGER NOT NULL DEFAULT 0,
        assignee      TEXT,
        created_date  TEXT,
        created_by    TEXT,
        created_at    INTEGER,
        updated_at    INTEGER
      )
    `);

    const count = (db.prepare('SELECT COUNT(*) as c FROM jsa_records').get() as any).c;
    if (count === 0) {
      const insert = db.prepare(`
        INSERT INTO jsa_records
          (id, title, department, location, compliance, steps, status, overall_risk,
           hazard_count, control_count, assignee, created_date, created_by, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `);
      const ts = now();
      const seed = [
        ['JSA-001','Forklift Battery Change','Maintenance','Warehouse A','OSHA 1910.178','[]','approved','medium',4,12,'John Martinez','2026-02-05','admin'],
        ['JSA-002','Roof Inspection - Bldg B','Facilities','Building B Rooftop','OSHA 1926 Subpart M','[]','draft','high',7,18,'Sarah Chen','2026-02-04','admin'],
        ['JSA-003','Conveyor Belt Repair','Operations','Production Floor','ISO 45001','[]','pending','medium',5,14,'Mike Thompson','2026-02-03','admin'],
        ['JSA-004','Tank Confined Space Entry','Operations','Tank Farm','OSHA 1910.146','[]','approved','critical',9,24,'Emily Park','2026-02-01','admin'],
        ['JSA-005','Electrical Panel Upgrade','Electrical','Substation C','OSHA 1910.269','[]','pending','high',6,15,'Robert Kim','2026-01-30','admin'],
        ['JSA-006','Chemical Transfer - Lab 201','Laboratory','Lab 201','OSHA 1910.1450','[]','approved','medium',5,16,'Lisa Wang','2026-01-29','admin'],
      ];
      for (const row of seed) {
        insert.run(...row, ts, ts);
      }
    }
  } finally {
    db.close();
  }
}

// ── Validation ───────────────────────────────────────────────────────────────

const StatusEnum = z.enum(['draft', 'pending', 'approved', 'rejected']);
const RiskEnum = z.enum(['low', 'medium', 'high', 'critical']);

const CreateJsaSchema = z.object({
  id: z.string().min(1).max(60).optional(),
  title: z.string().min(1).max(255),
  department: z.string().max(100).optional(),
  location: z.string().max(255).optional(),
  compliance: z.string().max(255).optional(),
  steps: z.array(z.any()).default([]),
  status: StatusEnum.default('draft'),
  overallRisk: RiskEnum.default('low'),
  assignee: z.string().max(100).optional(),
  createdDate: z.string().optional(),
  createdBy: z.string().max(100).optional(),
});

const UpdateJsaSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  department: z.string().max(100).optional(),
  location: z.string().max(255).optional(),
  compliance: z.string().max(255).optional(),
  steps: z.array(z.any()).optional(),
  status: StatusEnum.optional(),
  overallRisk: RiskEnum.optional(),
  assignee: z.string().max(100).optional(),
  createdDate: z.string().optional(),
  createdBy: z.string().max(100).optional(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeJsonArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

function computeCounts(steps: any[]): { hazardCount: number; controlCount: number } {
  let hazardCount = 0;
  let controlCount = 0;
  for (const step of steps) {
    if (Array.isArray(step.hazards)) hazardCount += step.hazards.length;
    if (step.controls && String(step.controls).trim()) controlCount += 1;
  }
  return { hazardCount, controlCount };
}

function generateJsaId(): string {
  return `JSA-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;
}

// ── Mapper ───────────────────────────────────────────────────────────────────

function mapJsa(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title ?? '',
    department: row.department ?? '',
    location: row.location ?? '',
    compliance: row.compliance ?? '',
    steps: safeJsonArray(row.steps),
    status: row.status ?? 'draft',
    overallRisk: row.overall_risk ?? 'low',
    hazardCount: typeof row.hazard_count === 'number' ? row.hazard_count : Number(row.hazard_count ?? 0),
    controlCount: typeof row.control_count === 'number' ? row.control_count : Number(row.control_count ?? 0),
    assignee: row.assignee ?? '',
    createdDate: row.created_date ?? '',
    createdBy: row.created_by ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

export function jsaRoutes(app: Hono) {
  ensureTable();

  // GET /api/jsa/stats
  app.get('/api/jsa/stats', (c) => {
    const db = getDb();
    try {
      const rows = db.prepare('SELECT status, overall_risk, hazard_count, control_count FROM jsa_records').all() as any[];
      const total = rows.length;
      const approved = rows.filter(r => r.status === 'approved').length;
      const pending = rows.filter(r => r.status === 'pending').length;
      const draft = rows.filter(r => r.status === 'draft').length;
      const rejected = rows.filter(r => r.status === 'rejected').length;
      const critical = rows.filter(r => r.overall_risk === 'critical').length;
      const high = rows.filter(r => r.overall_risk === 'high').length;
      const totalHazards = rows.reduce((s, r) => s + (Number(r.hazard_count) || 0), 0);
      const totalControls = rows.reduce((s, r) => s + (Number(r.control_count) || 0), 0);
      return c.json({
        success: true,
        data: { total, approved, pending, draft, rejected, critical, high, totalHazards, totalControls },
      });
    } finally { db.close(); }
  });

  // GET /api/jsa
  app.get('/api/jsa', (c) => {
    const { status, risk, department, search, limit } = c.req.query() as Record<string, string | undefined>;
    const db = getDb();
    try {
      let sql = 'SELECT * FROM jsa_records WHERE 1=1';
      const params: any[] = [];
      if (status) { sql += ' AND status = ?'; params.push(status); }
      if (risk) { sql += ' AND overall_risk = ?'; params.push(risk); }
      if (department) { sql += ' AND department = ?'; params.push(department); }
      if (search) { sql += ' AND (title LIKE ? OR department LIKE ? OR assignee LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      sql += ' ORDER BY created_at DESC';
      if (limit) { sql += ' LIMIT ?'; params.push(Number(limit)); }
      const rows = db.prepare(sql).all(...params) as any[];
      return c.json({ success: true, data: rows.map(mapJsa), total: rows.length });
    } finally { db.close(); }
  });

  // GET /api/jsa/:id
  app.get('/api/jsa/:id', (c) => {
    const { id } = c.req.param();
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM jsa_records WHERE id = ?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Not found' }, 404);
      return c.json({ success: true, data: mapJsa(row) });
    } finally { db.close(); }
  });

  // POST /api/jsa
  app.post('/api/jsa', async (c) => {
    const body = await c.req.json();
    const parsed = CreateJsaSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    const d = parsed.data;
    const db = getDb();
    try {
      const id = d.id || generateJsaId();
      const existing = db.prepare('SELECT id FROM jsa_records WHERE id = ?').get(id);
      // If auto-generated id has collision, regenerate once
      const finalId = existing ? generateJsaId() : id;
      const { hazardCount, controlCount } = computeCounts(d.steps);
      const ts = now();
      db.prepare(`
        INSERT INTO jsa_records
          (id, title, department, location, compliance, steps, status, overall_risk,
           hazard_count, control_count, assignee, created_date, created_by, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        finalId, d.title, d.department ?? null, d.location ?? null, d.compliance ?? null,
        JSON.stringify(d.steps), d.status, d.overallRisk,
        hazardCount, controlCount, d.assignee ?? null,
        d.createdDate ?? new Date().toISOString().split('T')[0],
        d.createdBy ?? null, ts, ts,
      );
      const created = db.prepare('SELECT * FROM jsa_records WHERE id = ?').get(finalId) as any;
      return c.json({ success: true, data: mapJsa(created) }, 201);
    } finally { db.close(); }
  });

  // PUT /api/jsa/:id
  app.put('/api/jsa/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();
    const parsed = UpdateJsaSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    const d = parsed.data;
    const db = getDb();
    try {
      const existing = db.prepare('SELECT * FROM jsa_records WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Not found' }, 404);
      const newSteps = d.steps !== undefined ? d.steps : safeJsonArray(existing.steps);
      const { hazardCount, controlCount } = computeCounts(newSteps);
      db.prepare(`
        UPDATE jsa_records SET
          title = ?, department = ?, location = ?, compliance = ?, steps = ?,
          status = ?, overall_risk = ?, hazard_count = ?, control_count = ?,
          assignee = ?, created_date = ?, created_by = ?, updated_at = ?
        WHERE id = ?
      `).run(
        d.title        !== undefined ? d.title        : existing.title,
        d.department   !== undefined ? d.department   : existing.department,
        d.location     !== undefined ? d.location     : existing.location,
        d.compliance   !== undefined ? d.compliance   : existing.compliance,
        JSON.stringify(newSteps),
        d.status       !== undefined ? d.status       : existing.status,
        d.overallRisk  !== undefined ? d.overallRisk  : existing.overall_risk,
        hazardCount, controlCount,
        d.assignee     !== undefined ? d.assignee     : existing.assignee,
        d.createdDate  !== undefined ? d.createdDate  : existing.created_date,
        d.createdBy    !== undefined ? d.createdBy    : existing.created_by,
        now(), id,
      );
      const updated = db.prepare('SELECT * FROM jsa_records WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: mapJsa(updated) });
    } finally { db.close(); }
  });

  // DELETE /api/jsa/:id
  app.delete('/api/jsa/:id', (c) => {
    const { id } = c.req.param();
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM jsa_records WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Not found' }, 404);
      db.prepare('DELETE FROM jsa_records WHERE id = ?').run(id);
      return c.json({ success: true, message: 'JSA deleted' });
    } finally { db.close(); }
  });
}
