import { Hono, Context } from 'hono';
import { z } from 'zod';
import { verify } from 'hono/jwt';
import { getSharedDb } from '../db';
import { env } from '../config/env';

function getDb() { return getSharedDb(); }

const JWT_SECRET = env.JWT_SECRET;

// ── Schema init (once per process) ────────────────────────────────────────────

let initialized = false;
function initOnce() {
  if (initialized) return;
  initialized = true;
  const db = getDb();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS form_configs (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id  TEXT    NOT NULL,
        user_id    INTEGER NOT NULL,
        name       TEXT    NOT NULL DEFAULT 'New Safety Form',
        description TEXT   DEFAULT '',
        category   TEXT    DEFAULT 'general',
        fields     TEXT    DEFAULT '[]',
        status     TEXT    DEFAULT 'draft',
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
      CREATE INDEX IF NOT EXISTS idx_form_configs_user ON form_configs(user_id);
    `);
  } finally {
  }
}

// ── Auth helper ────────────────────────────────────────────────────────────────

async function requireAuth(c: Context): Promise<number | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const payload = await verify(authHeader.slice(7), JWT_SECRET);
    return Number((payload as any).userId);
  } catch {
    return null;
  }
}

// ── DB helper ──────────────────────────────────────────────────────────────────

function safeJson(val: any, fallback: any = []): any {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function mapRow(r: any) {
  return {
    id: r.id,
    clientId: r.client_id,
    userId: r.user_id,
    name: r.name,
    description: r.description ?? '',
    category: r.category ?? 'general',
    fields: safeJson(r.fields, []),
    status: r.status ?? 'draft',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ── Zod schemas ────────────────────────────────────────────────────────────────

const FormFieldSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'text', 'number', 'email', 'textarea', 'select', 'radio',
    'checkbox', 'date', 'time', 'file', 'signature', 'location', 'photo',
  ]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  helpText: z.string().optional(),
  conditional: z.object({
    dependsOn: z.string(),
    showWhen: z.string(),
  }).optional(),
});

const CreateFormConfigSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().default(''),
  category: z.string().optional().default('general'),
  fields: z.array(FormFieldSchema).optional().default([]),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
});

const UpdateFormConfigSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  fields: z.array(FormFieldSchema).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

// ── Routes ─────────────────────────────────────────────────────────────────────

export function formConfiguratorRoutes(app: Hono) {
  initOnce();

  // GET /api/form-configs — list current user's form configs
  app.get('/api/form-configs', async (c) => {
    const userId = await requireAuth(c);
    if (userId === null) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const db = getDb();
    try {
      const rows = db
        .prepare('SELECT * FROM form_configs WHERE user_id = ? ORDER BY updated_at DESC')
        .all(userId);
      const data = rows.map(mapRow);
      return c.json({ success: true, data, count: data.length });
    } catch (handlerErr_) { throw handlerErr_; }
  });

  // POST /api/form-configs — create new form config
  app.post('/api/form-configs', async (c) => {
    const userId = await requireAuth(c);
    if (userId === null) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const db = getDb();
    try {
      let body: any;
      try { body = await c.req.json(); } catch { return c.json({ success: false, error: 'Invalid JSON body' }, 400); }
      const parsed = CreateFormConfigSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);
      const d = parsed.data;
      const ts = Date.now();
      const result = db.prepare(`
        INSERT INTO form_configs (client_id, user_id, name, description, category, fields, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(d.clientId, userId, d.name, d.description, d.category, JSON.stringify(d.fields), d.status, ts, ts);
      const created = db.prepare('SELECT * FROM form_configs WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapRow(created) }, 201);
    } catch (handlerErr_) { throw handlerErr_; }
  });

  // GET /api/form-configs/:id — fetch single form config (ownership enforced)
  app.get('/api/form-configs/:id', async (c) => {
    const userId = await requireAuth(c);
    if (userId === null) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const db = getDb();
    try {
      const row = db
        .prepare('SELECT * FROM form_configs WHERE id = ? AND user_id = ?')
        .get(c.req.param('id'), userId) as any;
      if (!row) return c.json({ success: false, error: 'Form config not found' }, 404);
      return c.json({ success: true, data: mapRow(row) });
    } catch (handlerErr_) { throw handlerErr_; }
  });

  // PUT /api/form-configs/:id — update form config (ownership enforced)
  app.put('/api/form-configs/:id', async (c) => {
    const userId = await requireAuth(c);
    if (userId === null) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const db = getDb();
    try {
      const existing = db
        .prepare('SELECT id FROM form_configs WHERE id = ? AND user_id = ?')
        .get(c.req.param('id'), userId);
      if (!existing) return c.json({ success: false, error: 'Form config not found' }, 404);
      let body: any;
      try { body = await c.req.json(); } catch { return c.json({ success: false, error: 'Invalid JSON body' }, 400); }
      const parsed = UpdateFormConfigSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);
      const d = parsed.data;
      if (Object.keys(d).length === 0) {
        return c.json({ success: false, error: 'No valid fields provided' }, 400);
      }
      const setClauses: string[] = [];
      const params: any[] = [];
      if (d.name !== undefined) { setClauses.push('name = ?'); params.push(d.name); }
      if (d.description !== undefined) { setClauses.push('description = ?'); params.push(d.description); }
      if (d.category !== undefined) { setClauses.push('category = ?'); params.push(d.category); }
      if (d.fields !== undefined) { setClauses.push('fields = ?'); params.push(JSON.stringify(d.fields)); }
      if (d.status !== undefined) { setClauses.push('status = ?'); params.push(d.status); }
      setClauses.push('updated_at = ?');
      params.push(Date.now());
      params.push(c.req.param('id'));
      db.prepare(`UPDATE form_configs SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM form_configs WHERE id = ?').get(c.req.param('id')) as any;
      return c.json({ success: true, data: mapRow(updated) });
    } catch (handlerErr_) { throw handlerErr_; }
  });

  // DELETE /api/form-configs/:id — delete form config (ownership enforced)
  app.delete('/api/form-configs/:id', async (c) => {
    const userId = await requireAuth(c);
    if (userId === null) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const db = getDb();
    try {
      const existing = db
        .prepare('SELECT id FROM form_configs WHERE id = ? AND user_id = ?')
        .get(c.req.param('id'), userId);
      if (!existing) return c.json({ success: false, error: 'Form config not found' }, 404);
      db.prepare('DELETE FROM form_configs WHERE id = ?').run(c.req.param('id'));
      return c.json({ success: true, message: 'Form config deleted' });
    } catch (handlerErr_) { throw handlerErr_; }
  });
}
