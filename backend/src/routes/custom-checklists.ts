/**
 * Custom Checklists Routes
 *
 * Manages user-created checklists from the ChecklistBuilder page.
 *
 * Endpoints:
 *   GET    /api/custom-checklists          — list, optional ?industry= filter
 *   POST   /api/custom-checklists          — create
 *   GET    /api/custom-checklists/:id      — get by id
 *   PUT    /api/custom-checklists/:id      — update
 *   DELETE /api/custom-checklists/:id      — delete
 */

import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'local.sqlite');

function getDb() {
  return new Database(dbPath);
}

const now = () => Date.now();

// ── Zod Schemas ────────────────────────────────────────────────────────────

const ChecklistItemSchema = z.object({
  id: z.string().min(1),
  question: z.string().default(''),
  category: z.string().min(1),
  required: z.boolean().default(false),
  helpText: z.string().default(''),
  regulatoryRef: z.string().default(''),
  aiSuggestion: z.string().optional(),
});

const IndustryEnum = z.enum([
  'Manufacturing', 'Construction', 'Healthcare', 'Oil & Gas',
  'Mining', 'Utilities', 'Transportation', 'Warehousing', 'Agriculture', 'Retail',
]);

const CreateChecklistSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  industry: IndustryEnum.default('Manufacturing'),
  categories: z.array(z.string()).default([]),
  items: z.array(ChecklistItemSchema).default([]),
});

const UpdateChecklistSchema = CreateChecklistSchema.partial();

// ── Mapper ─────────────────────────────────────────────────────────────────

function mapChecklist(r: any) {
  const parse = (v: any) => {
    try { return typeof v === 'string' ? JSON.parse(v) : (v ?? []); }
    catch { return []; }
  };
  return {
    id: String(r.id),
    name: r.name,
    description: r.description ?? '',
    industry: r.industry,
    categories: parse(r.categories),
    items: parse(r.items),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ── Route Registration ─────────────────────────────────────────────────────

export function customChecklistsRoutes(app: Hono) {

  // GET /api/custom-checklists
  app.get('/api/custom-checklists', (c) => {
    const db = getDb();
    try {
      const { industry, search } = c.req.query();
      let sql = 'SELECT * FROM custom_checklists WHERE 1=1';
      const params: any[] = [];

      if (industry) {
        sql += ' AND industry = ?';
        params.push(industry);
      }
      if (search) {
        sql += ' AND (name LIKE ? OR description LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s);
      }

      sql += ' ORDER BY updated_at DESC';
      const rows = db.prepare(sql).all(...params);
      const data = rows.map(mapChecklist);
      return c.json({ success: true, data, total: data.length });
    } finally { db.close(); }
  });

  // POST /api/custom-checklists
  app.post('/api/custom-checklists', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateChecklistSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);
      const d = parsed.data;
      const ts = now();
      const result = db.prepare(`
        INSERT INTO custom_checklists (name, description, industry, categories, items, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        d.name, d.description, d.industry,
        JSON.stringify(d.categories), JSON.stringify(d.items),
        ts, ts,
      );
      const created = db.prepare('SELECT * FROM custom_checklists WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapChecklist(created) }, 201);
    } finally { db.close(); }
  });

  // GET /api/custom-checklists/:id
  app.get('/api/custom-checklists/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id) || id <= 0) return c.json({ success: false, error: 'Invalid id' }, 400);
      const row = db.prepare('SELECT * FROM custom_checklists WHERE id = ?').get(id);
      if (!row) return c.json({ success: false, error: 'Checklist not found' }, 404);
      return c.json({ success: true, data: mapChecklist(row) });
    } finally { db.close(); }
  });

  // PUT /api/custom-checklists/:id
  app.put('/api/custom-checklists/:id', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id) || id <= 0) return c.json({ success: false, error: 'Invalid id' }, 400);
      const existing = db.prepare('SELECT id FROM custom_checklists WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Checklist not found' }, 404);

      const body = await c.req.json();
      const parsed = UpdateChecklistSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);

      const fields: string[] = [];
      const params: any[] = [];

      // Use raw body keys to determine what was actually sent
      if ('name' in body) { fields.push('name = ?'); params.push(body.name); }
      if ('description' in body) { fields.push('description = ?'); params.push(body.description ?? ''); }
      if ('industry' in body) { fields.push('industry = ?'); params.push(body.industry); }
      if ('categories' in body) { fields.push('categories = ?'); params.push(JSON.stringify(body.categories ?? [])); }
      if ('items' in body) { fields.push('items = ?'); params.push(JSON.stringify(body.items ?? [])); }

      if (!fields.length) return c.json({ success: false, error: 'No valid fields to update' }, 400);

      fields.push('updated_at = ?');
      params.push(now(), id);
      db.prepare(`UPDATE custom_checklists SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM custom_checklists WHERE id = ?').get(id);
      return c.json({ success: true, data: mapChecklist(updated) });
    } finally { db.close(); }
  });

  // DELETE /api/custom-checklists/:id
  app.delete('/api/custom-checklists/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id) || id <= 0) return c.json({ success: false, error: 'Invalid id' }, 400);
      const existing = db.prepare('SELECT id FROM custom_checklists WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Checklist not found' }, 404);
      db.prepare('DELETE FROM custom_checklists WHERE id = ?').run(id);
      return c.json({ success: true, message: 'Deleted' });
    } finally { db.close(); }
  });
}
