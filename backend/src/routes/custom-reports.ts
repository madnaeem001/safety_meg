import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProdRoute ? '/data/local.sqlite' : resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }

function safeJson(val: any, def: any = []): any {
  if (!val) return def;
  try { return JSON.parse(val); } catch { return def; }
}

function mapReport(row: any) {
  return {
    id: row.id,
    reportName: row.report_name,
    status: row.status,
    elements: safeJson(row.elements, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const ReportElementSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'checkbox', 'image', 'header']),
  label: z.string(),
  required: z.boolean().optional().default(false),
});

const CreateReportSchema = z.object({
  reportName: z.string().min(1),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
  elements: z.array(ReportElementSchema).optional().default([]),
});

const UpdateReportSchema = CreateReportSchema.partial();

export function customReportsRoutes(app: Hono) {

  // GET /api/custom-reports/stats
  app.get('/api/custom-reports/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as cnt FROM custom_reports').get() as any).cnt;
      const drafts = (db.prepare("SELECT COUNT(*) as cnt FROM custom_reports WHERE status='draft'").get() as any).cnt;
      const published = (db.prepare("SELECT COUNT(*) as cnt FROM custom_reports WHERE status='published'").get() as any).cnt;
      const archived = (db.prepare("SELECT COUNT(*) as cnt FROM custom_reports WHERE status='archived'").get() as any).cnt;
      return c.json({ success: true, data: { total, drafts, published, archived } });
    } finally { db.close(); }
  });

  // GET /api/custom-reports
  app.get('/api/custom-reports', (c) => {
    const db = getDb();
    try {
      const { status, search } = c.req.query();
      let sql = 'SELECT * FROM custom_reports WHERE 1=1';
      const params: any[] = [];
      if (status) { sql += ' AND status = ?'; params.push(status); }
      if (search) { sql += ' AND report_name LIKE ?'; params.push(`%${search}%`); }
      sql += ' ORDER BY updated_at DESC';
      const rows = db.prepare(sql).all(...params).map(mapReport);
      return c.json({ success: true, data: rows, total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/custom-reports
  app.post('/api/custom-reports', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateReportSchema.parse(body);
      const now = Date.now();
      const result = db.prepare(`
        INSERT INTO custom_reports (report_name, status, elements, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        parsed.reportName,
        parsed.status,
        JSON.stringify(parsed.elements),
        now,
        now,
      );
      const created = db.prepare('SELECT * FROM custom_reports WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapReport(created) }, 201);
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ success: false, error: 'Validation failed', details: err.errors }, 400);
      throw err;
    } finally { db.close(); }
  });

  // GET /api/custom-reports/:id
  app.get('/api/custom-reports/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const row = db.prepare('SELECT * FROM custom_reports WHERE id = ?').get(id);
      if (!row) return c.json({ success: false, error: 'Report not found' }, 404);
      return c.json({ success: true, data: mapReport(row) });
    } finally { db.close(); }
  });

  // PUT /api/custom-reports/:id
  app.put('/api/custom-reports/:id', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const existing = db.prepare('SELECT id FROM custom_reports WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Report not found' }, 404);
      const body = await c.req.json();
      const parsed = UpdateReportSchema.parse(body);
      const now = Date.now();
      const fields: string[] = [];
      const params: any[] = [];
      if (parsed.reportName !== undefined) { fields.push('report_name = ?'); params.push(parsed.reportName); }
      if (parsed.status !== undefined) { fields.push('status = ?'); params.push(parsed.status); }
      if (parsed.elements !== undefined) { fields.push('elements = ?'); params.push(JSON.stringify(parsed.elements)); }
      fields.push('updated_at = ?'); params.push(now);
      params.push(id);
      db.prepare(`UPDATE custom_reports SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM custom_reports WHERE id = ?').get(id);
      return c.json({ success: true, data: mapReport(updated) });
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ success: false, error: 'Validation failed', details: err.errors }, 400);
      throw err;
    } finally { db.close(); }
  });

  // POST /api/custom-reports/:id/publish
  app.post('/api/custom-reports/:id/publish', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const existing = db.prepare('SELECT id FROM custom_reports WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Report not found' }, 404);
      const now = Date.now();
      db.prepare(`UPDATE custom_reports SET status = 'published', updated_at = ? WHERE id = ?`).run(now, id);
      const updated = db.prepare('SELECT * FROM custom_reports WHERE id = ?').get(id);
      return c.json({ success: true, data: mapReport(updated) });
    } finally { db.close(); }
  });

  // DELETE /api/custom-reports/:id
  app.delete('/api/custom-reports/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const existing = db.prepare('SELECT id FROM custom_reports WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Report not found' }, 404);
      db.prepare('DELETE FROM custom_reports WHERE id = ?').run(id);
      return c.json({ success: true, message: 'Deleted successfully' });
    } finally { db.close(); }
  });
}
