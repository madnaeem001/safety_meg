import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const DB_PATH = isProdRoute ? '/data/local.sqlite' : path.join(__dirname, '../../local.sqlite');

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF');
  return db;
}

function nowMs() { return Date.now(); }

function safeJson(val: any) {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

function mapReg(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    jurisdiction: row.jurisdiction,
    category: row.category,
    description: row.description,
    requirements: safeJson(row.requirements),
    applicableSectors: safeJson(row.applicable_sectors),
    effectiveDate: row.effective_date,
    lastUpdated: row.last_updated,
    source: row.source,
    isMandatory: row.is_mandatory === 1,
    createdAt: row.created_at,
  };
}

const CreateRegSchema = z.object({
  name: z.string().min(1),
  jurisdiction: z.enum(['federal','state','international','local']).optional(),
  category: z.enum(['safety','environmental','health','work-hours','fire']).optional(),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  applicableSectors: z.array(z.string()).optional(),
  effectiveDate: z.string().optional(),
  source: z.string().optional(),
  isMandatory: z.boolean().optional(),
});

export function regulationsRoutes(app: Hono) {
  // GET /api/regulations/search  (static, before /:id)
  app.get('/api/regulations/search', (c) => {
    const db = getDb();
    try {
      const { q, jurisdiction, category } = c.req.query() as Record<string, string>;
      if (!q || q.trim().length < 2) {
        return c.json({ error: 'Query parameter q is required (min 2 chars)' }, 400);
      }
      const like = `%${q}%`;
      let sql = `SELECT * FROM regulations WHERE (name LIKE ? OR description LIKE ?)`;
      const params: any[] = [like, like];
      if (jurisdiction) { sql += ' AND jurisdiction = ?'; params.push(jurisdiction); }
      if (category) { sql += ' AND category = ?'; params.push(category); }
      sql += ' ORDER BY name ASC LIMIT 50';
      const rows = db.prepare(sql).all(...params);
      return c.json({ success: true, data: rows.map(mapReg), total: rows.length });
    } finally { db.close(); }
  });

  // GET /api/regulations/stats
  app.get('/api/regulations/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) AS cnt FROM regulations').get() as any).cnt;
      const byJurisdiction = db.prepare(`
        SELECT jurisdiction, COUNT(*) AS count FROM regulations
        WHERE jurisdiction IS NOT NULL GROUP BY jurisdiction
      `).all();
      const byCategory = db.prepare(`
        SELECT category, COUNT(*) AS count FROM regulations
        WHERE category IS NOT NULL GROUP BY category
      `).all();
      const mandatory = (db.prepare('SELECT COUNT(*) AS cnt FROM regulations WHERE is_mandatory=1').get() as any).cnt;
      return c.json({ success: true, data: { total, mandatory, byJurisdiction, byCategory } });
    } finally { db.close(); }
  });

  // GET /api/regulations/list
  app.get('/api/regulations/list', (c) => {
    const db = getDb();
    try {
      const { jurisdiction, category, mandatory } = c.req.query() as Record<string, string>;
      let sql = 'SELECT * FROM regulations WHERE 1=1';
      const params: any[] = [];
      if (jurisdiction) { sql += ' AND jurisdiction = ?'; params.push(jurisdiction); }
      if (category) { sql += ' AND category = ?'; params.push(category); }
      if (mandatory !== undefined) { sql += ' AND is_mandatory = ?'; params.push(mandatory === 'true' ? 1 : 0); }
      sql += ' ORDER BY name ASC';
      const rows = db.prepare(sql).all(...params);
      return c.json({ success: true, data: rows.map(mapReg), total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/regulations
  app.post('/api/regulations', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateRegSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      const d = parsed.data;
      const now = nowMs();
      const result = db.prepare(`
        INSERT INTO regulations
          (name, jurisdiction, category, description, requirements, applicable_sectors, effective_date, last_updated, source, is_mandatory, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        d.name, d.jurisdiction ?? null, d.category ?? null, d.description ?? null,
        d.requirements ? JSON.stringify(d.requirements) : null,
        d.applicableSectors ? JSON.stringify(d.applicableSectors) : null,
        d.effectiveDate ?? null, now,
        d.source ?? null, d.isMandatory !== false ? 1 : 0, now
      );
      const row = db.prepare('SELECT * FROM regulations WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapReg(row) }, 201);
    } finally { db.close(); }
  });

  // GET /api/regulations/:id
  app.get('/api/regulations/:id', (c) => {
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM regulations WHERE id = ?').get(c.req.param('id'));
      if (!row) return c.json({ error: 'Regulation not found' }, 404);
      return c.json({ success: true, data: mapReg(row) });
    } finally { db.close(); }
  });

  // PUT /api/regulations/:id
  app.put('/api/regulations/:id', async (c) => {
    const db = getDb();
    try {
      const existing: any = db.prepare('SELECT * FROM regulations WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ error: 'Regulation not found' }, 404);
      const body = await c.req.json();
      const parsed = CreateRegSchema.partial().safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      const d = parsed.data;
      const now = nowMs();
      db.prepare(`
        UPDATE regulations SET
          name=?, jurisdiction=?, category=?, description=?, requirements=?,
          applicable_sectors=?, effective_date=?, last_updated=?, source=?, is_mandatory=?
        WHERE id=?
      `).run(
        d.name ?? existing.name, d.jurisdiction ?? existing.jurisdiction,
        d.category ?? existing.category, d.description ?? existing.description,
        d.requirements ? JSON.stringify(d.requirements) : existing.requirements,
        d.applicableSectors ? JSON.stringify(d.applicableSectors) : existing.applicable_sectors,
        d.effectiveDate ?? existing.effective_date, now,
        d.source ?? existing.source,
        d.isMandatory !== undefined ? (d.isMandatory ? 1 : 0) : existing.is_mandatory,
        c.req.param('id')
      );
      const row = db.prepare('SELECT * FROM regulations WHERE id = ?').get(c.req.param('id'));
      return c.json({ success: true, data: mapReg(row) });
    } finally { db.close(); }
  });

  // DELETE /api/regulations/:id
  app.delete('/api/regulations/:id', (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM regulations WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ error: 'Regulation not found' }, 404);
      db.prepare('DELETE FROM regulations WHERE id = ?').run(c.req.param('id'));
      return c.json({ success: true, message: 'Regulation deleted' });
    } finally { db.close(); }
  });
}
