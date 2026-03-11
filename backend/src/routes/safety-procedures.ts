import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProdRoute ? '/data/local.sqlite' : resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Math.floor(Date.now() / 1000);

function pad(n: number, len = 5) {
  return String(n).padStart(len, '0');
}

function genProcedureNumber(db: Database.Database): string {
  const row = db.prepare('SELECT MAX(id) as maxId FROM safety_procedures').get() as any;
  return `SOP-${pad((row?.maxId ?? 0) + 1)}`;
}

function safeJson(val: any): any {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

const CreateProcedureSchema = z.object({
  title: z.string().min(1),
  category: z.enum(['emergency', 'operational', 'maintenance', 'chemical', 'electrical', 'confined-space', 'ppe', 'fire', 'general']),
  description: z.string().optional(),
  steps: z.array(z.object({
    stepNumber: z.number(),
    title: z.string(),
    description: z.string(),
    warning: z.string().optional(),
  })).optional(),
  applicableRoles: z.array(z.string()).optional(),
  department: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  revision: z.string().optional(),
  approvedBy: z.string().optional(),
  effectiveDate: z.string().optional(),
  reviewDate: z.string().optional(),
});

export function safetyProceduresRoutes(app: Hono) {
  // GET /api/safety-procedures/stats [STATIC first]
  app.get('/api/safety-procedures/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as n FROM safety_procedures').get() as any).n;
      const active = (db.prepare("SELECT COUNT(*) as n FROM safety_procedures WHERE status='active'").get() as any).n;
      const byCategory = db.prepare('SELECT category, COUNT(*) as count FROM safety_procedures GROUP BY category').all();
      const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM safety_procedures GROUP BY status').all();
      const byRiskLevel = db.prepare('SELECT risk_level, COUNT(*) as count FROM safety_procedures GROUP BY risk_level').all();
      const reviewDue = (db.prepare(`
        SELECT COUNT(*) as n FROM safety_procedures
        WHERE review_date IS NOT NULL
        AND review_date <= date('now', '+30 days')
        AND status='active'
      `).get() as any).n;
      return c.json({ success: true, data: { total, active, reviewDue, byCategory, byStatus, byRiskLevel } });
    } finally { db.close(); }
  });

  // GET /api/safety-procedures [STATIC before /:id]
  app.get('/api/safety-procedures', (c) => {
    const db = getDb();
    try {
      const { category, status, riskLevel, department, search } = c.req.query();
      let sql = 'SELECT * FROM safety_procedures WHERE 1=1';
      const params: any[] = [];
      if (category) { sql += ' AND category=?'; params.push(category); }
      if (status) { sql += ' AND status=?'; params.push(status); }
      if (riskLevel) { sql += ' AND risk_level=?'; params.push(riskLevel); }
      if (department) { sql += ' AND department=?'; params.push(department); }
      if (search) { sql += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
      sql += ' ORDER BY created_at DESC';
      const rows = db.prepare(sql).all(...params);
      return c.json({ success: true, data: rows });
    } finally { db.close(); }
  });

  // POST /api/safety-procedures
  app.post('/api/safety-procedures', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateProcedureSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
      const d = parsed.data;
      const procedureNumber = genProcedureNumber(db);
      const ts = now();
      const result = db.prepare(`
        INSERT INTO safety_procedures
        (procedure_number, title, category, description, steps, applicable_roles,
         department, risk_level, revision, status, approved_by, effective_date,
         review_date, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        procedureNumber, d.title, d.category, d.description ?? null,
        d.steps ? JSON.stringify(d.steps) : null,
        d.applicableRoles ? JSON.stringify(d.applicableRoles) : null,
        d.department ?? null, d.riskLevel ?? 'medium', d.revision ?? '1.0',
        'active', d.approvedBy ?? null, d.effectiveDate ?? null,
        d.reviewDate ?? null, ts, ts
      );
      const proc = db.prepare('SELECT * FROM safety_procedures WHERE id=?').get(result.lastInsertRowid) as any;
      return c.json({
        success: true,
        data: { ...proc, steps: safeJson(proc.steps), applicableRoles: safeJson(proc.applicable_roles) },
      }, 201);
    } finally { db.close(); }
  });

  // GET /api/safety-procedures/:id
  app.get('/api/safety-procedures/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const proc = db.prepare('SELECT * FROM safety_procedures WHERE id=?').get(id) as any;
      if (!proc) return c.json({ success: false, error: 'Safety procedure not found' }, 404);
      return c.json({
        success: true,
        data: { ...proc, steps: safeJson(proc.steps), applicableRoles: safeJson(proc.applicable_roles) },
      });
    } finally { db.close(); }
  });

  // PUT /api/safety-procedures/:id
  app.put('/api/safety-procedures/:id', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const proc = db.prepare('SELECT * FROM safety_procedures WHERE id=?').get(id) as any;
      if (!proc) return c.json({ success: false, error: 'Safety procedure not found' }, 404);
      const body = await c.req.json();
      const ts = now();
      const fields: string[] = [];
      const vals: any[] = [];
      const colMap: Record<string, string> = {
        title: 'title', category: 'category', description: 'description',
        department: 'department', riskLevel: 'risk_level', revision: 'revision',
        status: 'status', approvedBy: 'approved_by', effectiveDate: 'effective_date',
        reviewDate: 'review_date',
      };
      for (const [camel, col] of Object.entries(colMap)) {
        if (body[camel] !== undefined) { fields.push(`${col}=?`); vals.push(body[camel]); }
      }
      if (body.steps !== undefined) { fields.push('steps=?'); vals.push(JSON.stringify(body.steps)); }
      if (body.applicableRoles !== undefined) { fields.push('applicable_roles=?'); vals.push(JSON.stringify(body.applicableRoles)); }
      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at=?'); vals.push(ts); vals.push(id);
      db.prepare(`UPDATE safety_procedures SET ${fields.join(', ')} WHERE id=?`).run(...vals);
      const updated = db.prepare('SELECT * FROM safety_procedures WHERE id=?').get(id) as any;
      return c.json({
        success: true,
        data: { ...updated, steps: safeJson(updated.steps), applicableRoles: safeJson(updated.applicable_roles) },
      });
    } finally { db.close(); }
  });

  // DELETE /api/safety-procedures/:id
  app.delete('/api/safety-procedures/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const proc = db.prepare('SELECT * FROM safety_procedures WHERE id=?').get(id);
      if (!proc) return c.json({ success: false, error: 'Safety procedure not found' }, 404);
      db.prepare('DELETE FROM safety_procedures WHERE id=?').run(id);
      return c.json({ success: true, message: 'Safety procedure deleted' });
    } finally { db.close(); }
  });
}
