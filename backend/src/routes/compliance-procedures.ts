import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../../local.sqlite');

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF');
  return db;
}

function nowMs() { return Date.now(); }

function safeJson(val: any): any {
  if (!val) return null;
  try { return JSON.parse(val); } catch { return null; }
}

function mapProc(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    title: row.name,           // alias for frontend compat
    description: row.description,
    scope: row.description,    // alias for frontend compat
    category: row.category,
    regulation: row.regulation,
    industries: safeJson(row.industries) ?? [],
    isoClause: row.iso_clause ?? null,
    steps: safeJson(row.steps) ?? [],
    version: row.version,
    status: row.status,
    owner: row.owner,
    approvedBy: row.approved_by,
    effectiveDate: row.effective_date,
    reviewDate: row.review_date,
    lastUpdated: row.effective_date ?? new Date(row.updated_at ?? Date.now()).toISOString().split('T')[0],
    document: row.document,
    aiRisk: {
      score: row.ai_risk_score ?? 50,
      level: row.ai_risk_level ?? 'Medium',
      rationale: row.ai_risk_rationale ?? 'Pending analysis',
      lastAnalyzed: row.ai_risk_last_analyzed || new Date(row.updated_at ?? Date.now()).toISOString(),
      trending: row.ai_risk_trending ?? 'stable',
    },
    auditTrail: safeJson(row.audit_trail) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const CreateProcSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['safety','environmental','health','quality','regulatory']).optional(),
  regulation: z.string().optional(),
  version: z.string().optional(),
  status: z.enum(['active','draft','archived','under-review']).optional(),
  owner: z.string().optional(),
  approvedBy: z.string().optional(),
  effectiveDate: z.string().optional(),
  reviewDate: z.string().optional(),
  document: z.string().optional(),
  industries: z.array(z.string()).optional(),
  isoClause: z.string().optional(),
  steps: z.array(z.object({
    stepNumber: z.number(),
    title: z.string(),
    description: z.string(),
    criticalControl: z.boolean(),
  })).optional(),
  aiRiskScore: z.number().min(0).max(100).optional(),
  aiRiskLevel: z.enum(['Low','Medium','High','Critical']).optional(),
  aiRiskRationale: z.string().optional(),
  aiRiskLastAnalyzed: z.string().optional(),
  aiRiskTrending: z.enum(['improving','stable','worsening']).optional(),
  auditTrail: z.array(z.object({
    id: z.string(),
    timestamp: z.string(),
    action: z.string(),
    user: z.string(),
    details: z.string(),
  })).optional(),
});

const UpdateProcSchema = CreateProcSchema.partial();

export function complianceProceduresRoutes(app: Hono) {
  // GET /api/compliance/procedures/stats
  app.get('/api/compliance/procedures/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) AS cnt FROM compliance_procedures').get() as any).cnt;
      const byStatus = db.prepare(`
        SELECT status, COUNT(*) AS count FROM compliance_procedures GROUP BY status
      `).all();
      const byCategory = db.prepare(`
        SELECT category, COUNT(*) AS count FROM compliance_procedures
        WHERE category IS NOT NULL GROUP BY category
      `).all();
      const recentlyUpdated = db.prepare(`
        SELECT id, name, status, updated_at FROM compliance_procedures
        ORDER BY updated_at DESC LIMIT 5
      `).all();
      return c.json({ success: true, data: { total, byStatus, byCategory, recentlyUpdated } });
    } finally { db.close(); }
  });

  // GET /api/compliance/procedures
  app.get('/api/compliance/procedures', (c) => {
    const db = getDb();
    try {
      const { status, category, search } = c.req.query() as Record<string, string>;
      let sql = 'SELECT * FROM compliance_procedures WHERE 1=1';
      const params: any[] = [];
      if (status) { sql += ' AND status = ?'; params.push(status); }
      if (category) { sql += ' AND category = ?'; params.push(category); }
      if (search) { sql += ' AND (name LIKE ? OR regulation LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      sql += ' ORDER BY updated_at DESC';
      const rows = db.prepare(sql).all(...params);
      return c.json({ success: true, data: rows.map(mapProc), total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/compliance/procedures
  app.post('/api/compliance/procedures', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateProcSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      const d = parsed.data;
      const now = nowMs();
      const result = db.prepare(`
        INSERT INTO compliance_procedures
          (name, description, category, regulation, version, status, owner, approved_by,
           effective_date, review_date, document,
           industries, iso_clause, steps,
           ai_risk_score, ai_risk_level, ai_risk_rationale, ai_risk_last_analyzed, ai_risk_trending,
           audit_trail, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        d.name, d.description ?? null, d.category ?? null, d.regulation ?? null,
        d.version ?? '1.0', d.status ?? 'active', d.owner ?? null, d.approvedBy ?? null,
        d.effectiveDate ?? null, d.reviewDate ?? null, d.document ?? null,
        JSON.stringify(d.industries ?? []), d.isoClause ?? null, JSON.stringify(d.steps ?? []),
        d.aiRiskScore ?? 50, d.aiRiskLevel ?? 'Medium', d.aiRiskRationale ?? '', d.aiRiskLastAnalyzed ?? '', d.aiRiskTrending ?? 'stable',
        JSON.stringify(d.auditTrail ?? []), now, now
      );
      const row = db.prepare('SELECT * FROM compliance_procedures WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapProc(row) }, 201);
    } finally { db.close(); }
  });

  // GET /api/compliance/procedures/:id
  app.get('/api/compliance/procedures/:id', (c) => {
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM compliance_procedures WHERE id = ?').get(c.req.param('id'));
      if (!row) return c.json({ error: 'Procedure not found' }, 404);
      return c.json({ success: true, data: mapProc(row) });
    } finally { db.close(); }
  });

  // PUT /api/compliance/procedures/:id
  app.put('/api/compliance/procedures/:id', async (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT * FROM compliance_procedures WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ error: 'Procedure not found' }, 404);
      const body = await c.req.json();
      const parsed = UpdateProcSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      const d = parsed.data;
      const now = nowMs();
      const e = existing as any;
      db.prepare(`
        UPDATE compliance_procedures SET
          name=?, description=?, category=?, regulation=?, version=?, status=?,
          owner=?, approved_by=?, effective_date=?, review_date=?, document=?,
          industries=?, iso_clause=?, steps=?,
          ai_risk_score=?, ai_risk_level=?, ai_risk_rationale=?, ai_risk_last_analyzed=?, ai_risk_trending=?,
          audit_trail=?, updated_at=?
        WHERE id=?
      `).run(
        d.name ?? e.name, d.description ?? e.description, d.category ?? e.category,
        d.regulation ?? e.regulation, d.version ?? e.version, d.status ?? e.status,
        d.owner ?? e.owner, d.approvedBy ?? e.approved_by, d.effectiveDate ?? e.effective_date,
        d.reviewDate ?? e.review_date, d.document ?? e.document,
        d.industries !== undefined ? JSON.stringify(d.industries) : e.industries,
        d.isoClause !== undefined ? d.isoClause : e.iso_clause,
        d.steps !== undefined ? JSON.stringify(d.steps) : e.steps,
        d.aiRiskScore ?? e.ai_risk_score, d.aiRiskLevel ?? e.ai_risk_level,
        d.aiRiskRationale ?? e.ai_risk_rationale, d.aiRiskLastAnalyzed ?? e.ai_risk_last_analyzed,
        d.aiRiskTrending ?? e.ai_risk_trending,
        d.auditTrail !== undefined ? JSON.stringify(d.auditTrail) : e.audit_trail,
        now, c.req.param('id')
      );
      const row = db.prepare('SELECT * FROM compliance_procedures WHERE id = ?').get(c.req.param('id'));
      return c.json({ success: true, data: mapProc(row) });
    } finally { db.close(); }
  });

  // DELETE /api/compliance/procedures/:id
  app.delete('/api/compliance/procedures/:id', (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM compliance_procedures WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ error: 'Procedure not found' }, 404);
      db.prepare('DELETE FROM compliance_procedures WHERE id = ?').run(c.req.param('id'));
      return c.json({ success: true, message: 'Procedure deleted' });
    } finally { db.close(); }
  });
}
