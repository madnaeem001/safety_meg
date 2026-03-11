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

function mapApp(row: any) {
  return {
    id: row.id,
    appName: row.app_name,
    status: row.status,
    elements: safeJson(row.elements, []),
    devicePreference: row.device_preference ?? 'mobile',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deployedAt: row.deployed_at ?? null,
  };
}

const AppElementSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  props: z.any().optional(),
});

const CreateAppSchema = z.object({
  appName: z.string().min(1),
  status: z.enum(['draft', 'deployed', 'archived']).optional().default('draft'),
  elements: z.array(AppElementSchema).optional().default([]),
  devicePreference: z.string().optional().default('mobile'),
});

const UpdateAppSchema = CreateAppSchema.partial();

// ── Keyword-based AI generator helper ────────────────────────────────────────
function generateElementsFromPrompt(prompt: string, appName: string) {
  const p = prompt.toLowerCase();
  const elements: any[] = [
    { id: 'gen-1', type: 'header', label: 'App Header', props: { title: appName } },
    { id: 'gen-2', type: 'text', label: 'Instructions', props: { content: `This app was generated for: ${prompt}` } },
  ];

  if (/forklift|vehicle|equipment|machinery|machine/.test(p)) {
    elements.push(
      { id: 'gen-3', type: 'checklist', label: 'Pre-Use Inspection', props: {} },
      { id: 'gen-4', type: 'input', label: 'Serial / Unit Number', props: {} },
      { id: 'gen-5', type: 'camera', label: 'Equipment Photo', props: {} },
      { id: 'gen-6', type: 'location', label: 'Location', props: {} },
      { id: 'gen-7', type: 'signature', label: 'Operator Sign-off', props: {} },
      { id: 'gen-8', type: 'button', label: 'Submit Inspection', props: {} },
    );
  } else if (/chemical|hazmat|hazardous|sds|msds/.test(p)) {
    elements.push(
      { id: 'gen-3', type: 'input', label: 'Chemical Name', props: {} },
      { id: 'gen-4', type: 'checklist', label: 'Handling Checklist', props: {} },
      { id: 'gen-5', type: 'camera', label: 'Label Photo', props: {} },
      { id: 'gen-6', type: 'location', label: 'Storage Location', props: {} },
      { id: 'gen-7', type: 'signature', label: 'Handler Signature', props: {} },
      { id: 'gen-8', type: 'button', label: 'Submit', props: {} },
    );
  } else if (/incident|accident|near.?miss|injury/.test(p)) {
    elements.push(
      { id: 'gen-3', type: 'input', label: 'Incident Description', props: {} },
      { id: 'gen-4', type: 'input', label: 'Person Involved', props: {} },
      { id: 'gen-5', type: 'camera', label: 'Photo Evidence', props: {} },
      { id: 'gen-6', type: 'location', label: 'Incident Location', props: {} },
      { id: 'gen-7', type: 'signature', label: 'Reporter Signature', props: {} },
      { id: 'gen-8', type: 'button', label: 'Submit Report', props: {} },
    );
  } else if (/audit|inspect|check|survey|assessment/.test(p)) {
    elements.push(
      { id: 'gen-3', type: 'checklist', label: 'Audit Checklist', props: {} },
      { id: 'gen-4', type: 'camera', label: 'Photo Evidence', props: {} },
      { id: 'gen-5', type: 'input', label: 'Auditor Name', props: {} },
      { id: 'gen-6', type: 'location', label: 'Audit Location', props: {} },
      { id: 'gen-7', type: 'signature', label: 'Auditor Sign-off', props: {} },
      { id: 'gen-8', type: 'button', label: 'Submit Audit', props: {} },
    );
  } else if (/fire|evacuation|emergency|drill|alarm/.test(p)) {
    elements.push(
      { id: 'gen-3', type: 'checklist', label: 'Emergency Checklist', props: {} },
      { id: 'gen-4', type: 'input', label: 'Drill Leader', props: {} },
      { id: 'gen-5', type: 'chart', label: 'Response Time Chart', props: {} },
      { id: 'gen-6', type: 'list', label: 'Evacuee Roll', props: {} },
      { id: 'gen-7', type: 'signature', label: 'Warden Sign-off', props: {} },
      { id: 'gen-8', type: 'button', label: 'Complete Drill', props: {} },
    );
  } else if (/training|induction|onboard|course|orient/.test(p)) {
    elements.push(
      { id: 'gen-3', type: 'text', label: 'Training Content', props: { content: 'Review the following training material before proceeding.' } },
      { id: 'gen-4', type: 'checklist', label: 'Competency Checklist', props: {} },
      { id: 'gen-5', type: 'input', label: 'Employee Name', props: {} },
      { id: 'gen-6', type: 'signature', label: 'Employee Acknowledgement', props: {} },
      { id: 'gen-7', type: 'button', label: 'Complete Training', props: {} },
    );
  } else {
    // Default safety app template
    elements.push(
      { id: 'gen-3', type: 'checklist', label: 'Safety Checklist', props: {} },
      { id: 'gen-4', type: 'camera', label: 'Photo Evidence', props: {} },
      { id: 'gen-5', type: 'location', label: 'Location', props: {} },
      { id: 'gen-6', type: 'signature', label: 'Sign-off', props: {} },
      { id: 'gen-7', type: 'button', label: 'Submit', props: {} },
    );
  }

  return elements;
}

export function customAppsRoutes(app: Hono) {

  // POST /api/custom-apps/generate  (MUST be before /:id routes)
  app.post('/api/custom-apps/generate', async (c) => {
    try {
      const body = await c.req.json();
      const prompt: string = body?.prompt ?? '';
      const appName: string = body?.appName ?? prompt;
      if (!prompt.trim()) {
        return c.json({ success: false, error: 'prompt is required' }, 400);
      }
      const elements = generateElementsFromPrompt(prompt, appName);
      return c.json({ success: true, data: { appName, elements } });
    } catch (err) {
      return c.json({ success: false, error: 'Generation failed' }, 500);
    }
  });

  // GET /api/custom-apps/stats
  app.get('/api/custom-apps/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as cnt FROM custom_apps').get() as any).cnt;
      const deployed = (db.prepare("SELECT COUNT(*) as cnt FROM custom_apps WHERE status='deployed'").get() as any).cnt;
      const drafts = (db.prepare("SELECT COUNT(*) as cnt FROM custom_apps WHERE status='draft'").get() as any).cnt;
      const archived = (db.prepare("SELECT COUNT(*) as cnt FROM custom_apps WHERE status='archived'").get() as any).cnt;
      return c.json({ success: true, data: { total, deployed, drafts, archived } });
    } finally { db.close(); }
  });

  // GET /api/custom-apps
  app.get('/api/custom-apps', (c) => {
    const db = getDb();
    try {
      const { status, search } = c.req.query();
      let sql = 'SELECT * FROM custom_apps WHERE 1=1';
      const params: any[] = [];
      if (status) { sql += ' AND status = ?'; params.push(status); }
      if (search) { sql += ' AND app_name LIKE ?'; params.push(`%${search}%`); }
      sql += ' ORDER BY updated_at DESC';
      const rows = db.prepare(sql).all(...params).map(mapApp);
      return c.json({ success: true, data: rows, total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/custom-apps
  app.post('/api/custom-apps', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateAppSchema.parse(body);
      const now = Date.now();
      const result = db.prepare(`
        INSERT INTO custom_apps (app_name, status, elements, device_preference, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        parsed.appName,
        parsed.status,
        JSON.stringify(parsed.elements),
        parsed.devicePreference,
        now,
        now,
      );
      const created = db.prepare('SELECT * FROM custom_apps WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapApp(created) }, 201);
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ success: false, error: 'Validation failed', details: err.errors }, 400);
      throw err;
    } finally { db.close(); }
  });

  // GET /api/custom-apps/:id
  app.get('/api/custom-apps/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const row = db.prepare('SELECT * FROM custom_apps WHERE id = ?').get(id);
      if (!row) return c.json({ success: false, error: 'App not found' }, 404);
      return c.json({ success: true, data: mapApp(row) });
    } finally { db.close(); }
  });

  // PUT /api/custom-apps/:id
  app.put('/api/custom-apps/:id', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const existing = db.prepare('SELECT id FROM custom_apps WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'App not found' }, 404);
      const body = await c.req.json();
      const parsed = UpdateAppSchema.parse(body);
      const now = Date.now();
      const fields: string[] = [];
      const params: any[] = [];
      if (parsed.appName !== undefined) { fields.push('app_name = ?'); params.push(parsed.appName); }
      if (parsed.status !== undefined) { fields.push('status = ?'); params.push(parsed.status); }
      if (parsed.elements !== undefined) { fields.push('elements = ?'); params.push(JSON.stringify(parsed.elements)); }
      if (parsed.devicePreference !== undefined) { fields.push('device_preference = ?'); params.push(parsed.devicePreference); }
      fields.push('updated_at = ?'); params.push(now);
      params.push(id);
      db.prepare(`UPDATE custom_apps SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM custom_apps WHERE id = ?').get(id);
      return c.json({ success: true, data: mapApp(updated) });
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ success: false, error: 'Validation failed', details: err.errors }, 400);
      throw err;
    } finally { db.close(); }
  });

  // POST /api/custom-apps/:id/deploy
  app.post('/api/custom-apps/:id/deploy', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const existing = db.prepare('SELECT id FROM custom_apps WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'App not found' }, 404);
      const now = Date.now();
      db.prepare(`UPDATE custom_apps SET status = 'deployed', deployed_at = ?, updated_at = ? WHERE id = ?`).run(now, now, id);
      const updated = db.prepare('SELECT * FROM custom_apps WHERE id = ?').get(id);
      return c.json({ success: true, data: mapApp(updated) });
    } finally { db.close(); }
  });

  // DELETE /api/custom-apps/:id
  app.delete('/api/custom-apps/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const existing = db.prepare('SELECT id FROM custom_apps WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'App not found' }, 404);
      db.prepare('DELETE FROM custom_apps WHERE id = ?').run(id);
      return c.json({ success: true, message: 'Deleted successfully' });
    } finally { db.close(); }
  });
}
