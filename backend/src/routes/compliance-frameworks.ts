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
      CREATE TABLE IF NOT EXISTS compliance_frameworks (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        short_name   TEXT NOT NULL,
        region       TEXT NOT NULL,
        category     TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'partial'
                       CHECK(status IN ('compliant','partial','non-compliant','not-applicable')),
        score        INTEGER NOT NULL DEFAULT 0,
        last_audit   TEXT,
        next_due     TEXT,
        requirements INTEGER NOT NULL DEFAULT 0,
        completed    INTEGER NOT NULL DEFAULT 0,
        created_at   INTEGER,
        updated_at   INTEGER
      )
    `);

    const count = (db.prepare('SELECT COUNT(*) as c FROM compliance_frameworks').get() as any).c;
    if (count === 0) {
      const insert = db.prepare(`
        INSERT INTO compliance_frameworks
          (id, name, short_name, region, category, status, score,
           last_audit, next_due, requirements, completed, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      `);
      const ts = now();
      const seed = [
        ['osha','OSHA General Industry Standards','OSHA','United States','Occupational Safety','compliant',96,'2026-01-15','2026-07-15',124,119],
        ['iso45001','ISO 45001:2018','ISO 45001','International','Management Systems','compliant',94,'2025-11-20','2026-11-20',87,82],
        ['iso14001','ISO 14001:2015','ISO 14001','International','Environmental','partial',82,'2025-10-01','2026-10-01',56,46],
        ['eu-reach','EU REACH Regulation','REACH','European Union','Chemical Safety','compliant',91,'2025-12-05','2026-12-05',43,39],
        ['gdpr','GDPR Data Protection','GDPR','European Union','Data Privacy','compliant',98,'2026-01-10','2027-01-10',32,31],
        ['china-whs','China Work Safety Law','China WHS','China','Occupational Safety','partial',78,'2025-09-15','2026-09-15',68,53],
        ['psm','OSHA Process Safety Management','PSM','United States','Process Safety','compliant',92,'2025-08-22','2026-02-22',14,13],
        ['seveso','EU Seveso III Directive','Seveso III','European Union','Major Hazards','non-compliant',65,'2025-07-10','2026-01-10',28,18],
        ['iso9001','ISO 9001:2015','ISO 9001','International','Quality Management','compliant',97,'2025-12-01','2026-12-01',45,44],
        ['nfpa','NFPA Fire Safety Standards','NFPA','United States','Fire Safety','partial',85,'2025-11-15','2026-05-15',52,44],
        ['ghs','GHS Chemical Classification','GHS','International','Chemical Safety','compliant',99,'2026-01-20','2027-01-20',18,18],
        ['epa-rmp','EPA Risk Management Plan (RMP)','EPA RMP','United States','Environmental','compliant',95,'2025-12-10','2026-12-10',45,43],
        ['niosh-pocket','NIOSH Pocket Guide to Chemical Hazards','NIOSH','United States','Occupational Health','compliant',97,'2026-01-05','2027-01-05',12,12],
        ['ncr-tracking','Non-Conformance Report (NCR) Tracking','NCR','Internal','Quality Management','partial',88,'2026-02-01','2026-03-01',24,21],
        ['sds-ghs','GHS Safety Data Sheet (SDS) Compliance','SDS','International','Chemical Safety','compliant',100,'2026-01-20','2027-01-20',16,16],
        ['asme-b30','ASME B30 Safety Standard for Cableways, Cranes, Derricks, Hoists, Hooks, Jacks, and Slings','ASME B30','United States','Technical & Engineering','compliant',94,'2025-12-05','2026-06-05',42,39],
        ['api-rp-54','API RP 54 Occupational Safety for Oil and Gas Well Drilling and Servicing Operations','API RP 54','United States','Sector-Specific','compliant',91,'2025-11-15','2026-05-15',38,35],
        ['brazil-nr','Brazil NR Regulatory Standards','Brazil NR','Brazil','Occupational Safety','partial',76,'2025-06-30','2026-06-30',36,27],
      ] as const;
      for (const row of seed) {
        insert.run(...row, ts, ts);
      }
    }
  } finally {
    db.close();
  }
}

// ── Validation ───────────────────────────────────────────────────────────────

const FrameworkStatusEnum = z.enum(['compliant', 'partial', 'non-compliant', 'not-applicable']);

const CreateFrameworkSchema = z.object({
  id: z.string().min(1).max(60),
  name: z.string().min(1).max(255),
  shortName: z.string().min(1).max(60),
  region: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  status: FrameworkStatusEnum.default('partial'),
  score: z.number().int().min(0).max(100).default(0),
  lastAudit: z.string().optional(),
  nextDue: z.string().optional(),
  requirements: z.number().int().min(0).default(0),
  completed: z.number().int().min(0).default(0),
});

const UpdateFrameworkSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  shortName: z.string().min(1).max(60).optional(),
  region: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(100).optional(),
  status: FrameworkStatusEnum.optional(),
  score: z.number().int().min(0).max(100).optional(),
  lastAudit: z.string().optional(),
  nextDue: z.string().optional(),
  requirements: z.number().int().min(0).optional(),
  completed: z.number().int().min(0).optional(),
});

// ── Mapper ───────────────────────────────────────────────────────────────────

function mapFramework(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name ?? '',
    shortName: row.short_name ?? '',
    region: row.region ?? '',
    category: row.category ?? '',
    status: row.status ?? 'partial',
    score: typeof row.score === 'number' ? row.score : Number(row.score ?? 0),
    lastAudit: row.last_audit ?? '',
    nextDue: row.next_due ?? '',
    requirements: typeof row.requirements === 'number' ? row.requirements : Number(row.requirements ?? 0),
    completed: typeof row.completed === 'number' ? row.completed : Number(row.completed ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Routes ───────────────────────────────────────────────────────────────────

export function complianceFrameworksRoutes(app: Hono) {
  ensureTable();

  // GET /api/compliance/frameworks/stats
  app.get('/api/compliance/frameworks/stats', (c) => {
    const db = getDb();
    try {
      const rows = db.prepare('SELECT status, score FROM compliance_frameworks').all() as any[];
      const total = rows.length;
      const compliant = rows.filter(r => r.status === 'compliant').length;
      const partial = rows.filter(r => r.status === 'partial').length;
      const nonCompliant = rows.filter(r => r.status === 'non-compliant').length;
      const notApplicable = rows.filter(r => r.status === 'not-applicable').length;
      const avgScore = total > 0
        ? Math.round(rows.reduce((sum, r) => sum + (Number(r.score) || 0), 0) / total)
        : 0;
      return c.json({ success: true, data: { total, compliant, partial, nonCompliant, notApplicable, avgScore } });
    } finally { db.close(); }
  });

  // GET /api/compliance/frameworks/export
  app.get('/api/compliance/frameworks/export', (c) => {
    const { region, category, status, search } = c.req.query() as Record<string, string | undefined>;
    const db = getDb();
    try {
      let sql = 'SELECT * FROM compliance_frameworks WHERE 1=1';
      const params: any[] = [];
      if (region && region !== 'All Regions') { sql += ' AND region = ?'; params.push(region); }
      if (category && category !== 'All Categories') { sql += ' AND category = ?'; params.push(category); }
      if (status && status !== 'All Status') { sql += ' AND status = ?'; params.push(status); }
      if (search) { sql += ' AND (name LIKE ? OR short_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
      sql += ' ORDER BY name ASC';
      const rows = db.prepare(sql).all(...params) as any[];
      return c.json({ success: true, data: rows.map(mapFramework), total: rows.length });
    } finally { db.close(); }
  });

  // GET /api/compliance/frameworks
  app.get('/api/compliance/frameworks', (c) => {
    const { region, category, status, search } = c.req.query() as Record<string, string | undefined>;
    const db = getDb();
    try {
      let sql = 'SELECT * FROM compliance_frameworks WHERE 1=1';
      const params: any[] = [];
      if (region && region !== 'All Regions') { sql += ' AND region = ?'; params.push(region); }
      if (category && category !== 'All Categories') { sql += ' AND category = ?'; params.push(category); }
      if (status && status !== 'All Status') { sql += ' AND status = ?'; params.push(status); }
      if (search) { sql += ' AND (name LIKE ? OR short_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
      sql += ' ORDER BY name ASC';
      const rows = db.prepare(sql).all(...params) as any[];
      return c.json({ success: true, data: rows.map(mapFramework), total: rows.length });
    } finally { db.close(); }
  });

  // GET /api/compliance/frameworks/:id
  app.get('/api/compliance/frameworks/:id', (c) => {
    const { id } = c.req.param();
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM compliance_frameworks WHERE id = ?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Not found' }, 404);
      return c.json({ success: true, data: mapFramework(row) });
    } finally { db.close(); }
  });

  // POST /api/compliance/frameworks
  app.post('/api/compliance/frameworks', async (c) => {
    const body = await c.req.json();
    const parsed = CreateFrameworkSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    const d = parsed.data;
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM compliance_frameworks WHERE id = ?').get(d.id);
      if (existing) return c.json({ success: false, error: 'Framework with this ID already exists' }, 409);
      const ts = now();
      db.prepare(`
        INSERT INTO compliance_frameworks
          (id, name, short_name, region, category, status, score,
           last_audit, next_due, requirements, completed, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        d.id, d.name, d.shortName, d.region, d.category, d.status, d.score,
        d.lastAudit ?? null, d.nextDue ?? null, d.requirements, d.completed, ts, ts,
      );
      const created = db.prepare('SELECT * FROM compliance_frameworks WHERE id = ?').get(d.id) as any;
      return c.json({ success: true, data: mapFramework(created) }, 201);
    } finally { db.close(); }
  });

  // PUT /api/compliance/frameworks/:id
  app.put('/api/compliance/frameworks/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();
    const parsed = UpdateFrameworkSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    const d = parsed.data;
    const db = getDb();
    try {
      const existing = db.prepare('SELECT * FROM compliance_frameworks WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Not found' }, 404);
      db.prepare(`
        UPDATE compliance_frameworks SET
          name = ?, short_name = ?, region = ?, category = ?, status = ?, score = ?,
          last_audit = ?, next_due = ?, requirements = ?, completed = ?, updated_at = ?
        WHERE id = ?
      `).run(
        d.name        !== undefined ? d.name        : existing.name,
        d.shortName   !== undefined ? d.shortName   : existing.short_name,
        d.region      !== undefined ? d.region      : existing.region,
        d.category    !== undefined ? d.category    : existing.category,
        d.status      !== undefined ? d.status      : existing.status,
        d.score       !== undefined ? d.score       : existing.score,
        d.lastAudit   !== undefined ? d.lastAudit   : existing.last_audit,
        d.nextDue     !== undefined ? d.nextDue     : existing.next_due,
        d.requirements !== undefined ? d.requirements : existing.requirements,
        d.completed   !== undefined ? d.completed   : existing.completed,
        now(),
        id,
      );
      const updated = db.prepare('SELECT * FROM compliance_frameworks WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: mapFramework(updated) });
    } finally { db.close(); }
  });

  // DELETE /api/compliance/frameworks/:id
  app.delete('/api/compliance/frameworks/:id', (c) => {
    const { id } = c.req.param();
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM compliance_frameworks WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Not found' }, 404);
      db.prepare('DELETE FROM compliance_frameworks WHERE id = ?').run(id);
      return c.json({ success: true, message: 'Framework deleted' });
    } finally { db.close(); }
  });
}
