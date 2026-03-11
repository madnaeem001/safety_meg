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

const nowMs = () => Date.now();

// ── Bootstrap: sampling plans table ──────────────────────────────────────────
{
  const _db = getDb();
  try {
    _db.exec(`
      CREATE TABLE IF NOT EXISTS hygiene_sampling_plans (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        title       TEXT NOT NULL,
        agent       TEXT NOT NULL,
        method      TEXT NOT NULL,
        frequency   TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'scheduled',
        assignee    TEXT,
        due_date    TEXT,
        notes       TEXT,
        created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      )
    `);
  } finally {
    _db.close();
  }
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function safeJson(v: any, def: any) {
  try { return v ? JSON.parse(v) : def; } catch { return def; }
}

function mapAssessment(r: any) {
  return {
    id:              r.id,
    title:           r.title,
    hazardType:      r.hazard_type,
    location:        r.location,
    department:      r.department,
    exposureLevel:   r.exposure_level,
    controlMeasures: safeJson(r.control_measures, []),
    assessedBy:      r.assessed_by,
    assessedAt:      r.assessed_at,
    nextReviewDate:  r.next_review_date,
    status:          r.status,
    createdAt:       r.created_at,
  };
}

function mapSamplingPlan(r: any) {
  return {
    id:        r.id,
    title:     r.title,
    agent:     r.agent,
    method:    r.method,
    frequency: r.frequency,
    status:    r.status,
    assignee:  r.assignee,
    dueDate:   r.due_date,
    notes:     r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ── Validation Schemas ────────────────────────────────────────────────────────

const AssessmentSchema = z.object({
  title:          z.string().min(1),
  hazardType:     z.enum(['chemical', 'physical', 'biological', 'ergonomic', 'noise', 'radiation']),
  location:       z.string().min(1),
  department:     z.string().optional(),
  exposureLevel:  z.enum(['low', 'medium', 'high', 'extreme']).optional().default('low'),
  controlMeasures: z.array(z.string()).optional().default([]),
  assessedBy:     z.string().optional(),
  nextReviewDate: z.string().optional(),
});

const AssessmentUpdateSchema = AssessmentSchema.partial();

const SamplingPlanSchema = z.object({
  title:     z.string().min(1),
  agent:     z.string().min(1),
  method:    z.string().min(1),
  frequency: z.string().min(1),
  status:    z.enum(['scheduled', 'in_progress', 'completed', 'overdue']).optional().default('scheduled'),
  assignee:  z.string().optional(),
  dueDate:   z.string().optional(),
  notes:     z.string().optional(),
});

const SamplingPlanUpdateSchema = SamplingPlanSchema.partial();

// ── Route Factory ─────────────────────────────────────────────────────────────

export function hygieneRoutes(app: Hono) {

  // ── Stats ─────────────────────────────────────────────────────────────────
  app.get('/api/hygiene/stats', (c) => {
    const db = getDb();
    try {
      const total     = (db.prepare('SELECT COUNT(*) AS c FROM hygiene_assessments').get() as any).c;
      const byStatus  = db.prepare('SELECT status, COUNT(*) AS c FROM hygiene_assessments GROUP BY status').all();
      const byHazard  = db.prepare('SELECT hazard_type, COUNT(*) AS c FROM hygiene_assessments GROUP BY hazard_type').all();
      const byExposure = db.prepare('SELECT exposure_level, COUNT(*) AS c FROM hygiene_assessments GROUP BY exposure_level').all();
      const overduePlans = (db.prepare("SELECT COUNT(*) AS c FROM hygiene_sampling_plans WHERE status = 'overdue'").get() as any).c;
      const totalPlans   = (db.prepare('SELECT COUNT(*) AS c FROM hygiene_sampling_plans').get() as any).c;
      return c.json({ success: true, data: { total, byStatus, byHazard, byExposure, overduePlans, totalPlans } });
    } finally { db.close(); }
  });

  // ── Monitoring ────────────────────────────────────────────────────────────
  app.get('/api/hygiene/monitoring', (c) => {
    const db = getDb();
    try {
      const total      = (db.prepare('SELECT COUNT(*) AS c FROM hygiene_assessments').get() as any).c;
      const byExposure = db.prepare('SELECT exposure_level, COUNT(*) AS c FROM hygiene_assessments GROUP BY exposure_level').all();
      const byHazard   = db.prepare('SELECT hazard_type, COUNT(*) AS c FROM hygiene_assessments GROUP BY hazard_type').all();
      const requiresAction = db.prepare(
        "SELECT * FROM hygiene_assessments WHERE status = 'requires-action' OR exposure_level IN ('high','extreme') ORDER BY assessed_at DESC LIMIT 10"
      ).all().map(mapAssessment);
      return c.json({ success: true, data: { total, byExposureLevel: byExposure, byHazardType: byHazard, requiresAction, lastUpdated: new Date().toISOString() } });
    } finally { db.close(); }
  });

  // ── GET /api/hygiene/assessments ──────────────────────────────────────────
  app.get('/api/hygiene/assessments', (c) => {
    const db = getDb();
    try {
      const { hazardType, department, status, limit = '50' } = c.req.query() as any;
      let q = 'SELECT * FROM hygiene_assessments WHERE 1=1';
      const params: any[] = [];
      if (hazardType)  { q += ' AND hazard_type = ?';  params.push(hazardType); }
      if (department)  { q += ' AND department = ?';   params.push(department); }
      if (status)      { q += ' AND status = ?';       params.push(status); }
      q += ` ORDER BY assessed_at DESC LIMIT ${Math.min(Number(limit), 200)}`;
      const rows = db.prepare(q).all(...params);
      return c.json({ success: true, data: rows.map(mapAssessment), total: rows.length });
    } finally { db.close(); }
  });

  // ── GET /api/hygiene/assessments/:id ─────────────────────────────────────
  app.get('/api/hygiene/assessments/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (!Number.isFinite(id)) return c.json({ success: false, error: 'Invalid id' }, 400);
      const row = db.prepare('SELECT * FROM hygiene_assessments WHERE id = ?').get(id);
      if (!row) return c.json({ success: false, error: 'Assessment not found' }, 404);
      return c.json({ success: true, data: mapAssessment(row) });
    } finally { db.close(); }
  });

  // ── POST /api/hygiene/assessment (create) ────────────────────────────────
  app.post('/api/hygiene/assessment', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = AssessmentSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
      const d = parsed.data;
      const result = db.prepare(
        `INSERT INTO hygiene_assessments (title, hazard_type, location, department, exposure_level, control_measures, assessed_by, next_review_date, status, assessed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
      ).run(d.title, d.hazardType, d.location, d.department ?? null, d.exposureLevel, JSON.stringify(d.controlMeasures), d.assessedBy ?? null, d.nextReviewDate ?? null, nowMs(), nowMs());
      const row = db.prepare('SELECT * FROM hygiene_assessments WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapAssessment(row) }, 201);
    } finally { db.close(); }
  });

  // ── PUT /api/hygiene/assessments/:id ─────────────────────────────────────
  app.put('/api/hygiene/assessments/:id', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (!Number.isFinite(id)) return c.json({ success: false, error: 'Invalid id' }, 400);
      const existing = db.prepare('SELECT id FROM hygiene_assessments WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Assessment not found' }, 404);
      const body = await c.req.json();
      const parsed = AssessmentUpdateSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
      const d = parsed.data;
      const sets: string[] = [];
      const vals: any[] = [];
      if (d.title          !== undefined) { sets.push('title = ?');           vals.push(d.title); }
      if (d.hazardType     !== undefined) { sets.push('hazard_type = ?');     vals.push(d.hazardType); }
      if (d.location       !== undefined) { sets.push('location = ?');        vals.push(d.location); }
      if (d.department     !== undefined) { sets.push('department = ?');      vals.push(d.department); }
      if (d.exposureLevel  !== undefined) { sets.push('exposure_level = ?');  vals.push(d.exposureLevel); }
      if (d.controlMeasures !== undefined){ sets.push('control_measures = ?'); vals.push(JSON.stringify(d.controlMeasures)); }
      if (d.assessedBy     !== undefined) { sets.push('assessed_by = ?');     vals.push(d.assessedBy); }
      if (d.nextReviewDate !== undefined) { sets.push('next_review_date = ?'); vals.push(d.nextReviewDate); }
      if (sets.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      vals.push(id);
      db.prepare(`UPDATE hygiene_assessments SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
      const row = db.prepare('SELECT * FROM hygiene_assessments WHERE id = ?').get(id);
      return c.json({ success: true, data: mapAssessment(row) });
    } finally { db.close(); }
  });

  // ── DELETE /api/hygiene/assessments/:id ──────────────────────────────────
  app.delete('/api/hygiene/assessments/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (!Number.isFinite(id)) return c.json({ success: false, error: 'Invalid id' }, 400);
      const existing = db.prepare('SELECT id FROM hygiene_assessments WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Assessment not found' }, 404);
      db.prepare('DELETE FROM hygiene_assessments WHERE id = ?').run(id);
      return c.json({ success: true, message: 'Assessment deleted' });
    } finally { db.close(); }
  });

  // ── PATCH /api/hygiene/assessments/:id/status ─────────────────────────────
  app.patch('/api/hygiene/assessments/:id/status', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (!Number.isFinite(id)) return c.json({ success: false, error: 'Invalid id' }, 400);
      const existing = db.prepare('SELECT id FROM hygiene_assessments WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Assessment not found' }, 404);
      const { status } = await c.req.json();
      if (!['active', 'resolved', 'requires-action'].includes(status)) {
        return c.json({ success: false, error: 'Invalid status value' }, 400);
      }
      db.prepare('UPDATE hygiene_assessments SET status = ? WHERE id = ?').run(status, id);
      const row = db.prepare('SELECT * FROM hygiene_assessments WHERE id = ?').get(id);
      return c.json({ success: true, data: mapAssessment(row) });
    } finally { db.close(); }
  });

  // ── GET /api/hygiene/sampling-plans ──────────────────────────────────────
  app.get('/api/hygiene/sampling-plans', (c) => {
    const db = getDb();
    try {
      const { status, agent, limit = '100' } = c.req.query() as any;
      let q = 'SELECT * FROM hygiene_sampling_plans WHERE 1=1';
      const params: any[] = [];
      if (status) { q += ' AND status = ?'; params.push(status); }
      if (agent)  { q += ' AND LOWER(agent) LIKE ?'; params.push(`%${agent.toLowerCase()}%`); }
      q += ` ORDER BY due_date ASC LIMIT ${Math.min(Number(limit), 500)}`;
      const rows = db.prepare(q).all(...params);
      return c.json({ success: true, data: rows.map(mapSamplingPlan), total: rows.length });
    } finally { db.close(); }
  });

  // ── GET /api/hygiene/sampling-plans/:id ──────────────────────────────────
  app.get('/api/hygiene/sampling-plans/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (!Number.isFinite(id)) return c.json({ success: false, error: 'Invalid id' }, 400);
      const row = db.prepare('SELECT * FROM hygiene_sampling_plans WHERE id = ?').get(id);
      if (!row) return c.json({ success: false, error: 'Sampling plan not found' }, 404);
      return c.json({ success: true, data: mapSamplingPlan(row) });
    } finally { db.close(); }
  });

  // ── POST /api/hygiene/sampling-plans ─────────────────────────────────────
  app.post('/api/hygiene/sampling-plans', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = SamplingPlanSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
      const d = parsed.data;
      const result = db.prepare(
        `INSERT INTO hygiene_sampling_plans (title, agent, method, frequency, status, assignee, due_date, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(d.title, d.agent, d.method, d.frequency, d.status, d.assignee ?? null, d.dueDate ?? null, d.notes ?? null, nowMs(), nowMs());
      const row = db.prepare('SELECT * FROM hygiene_sampling_plans WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapSamplingPlan(row) }, 201);
    } finally { db.close(); }
  });

  // ── PUT /api/hygiene/sampling-plans/:id ──────────────────────────────────
  app.put('/api/hygiene/sampling-plans/:id', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (!Number.isFinite(id)) return c.json({ success: false, error: 'Invalid id' }, 400);
      const existing = db.prepare('SELECT id FROM hygiene_sampling_plans WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Sampling plan not found' }, 404);
      const body = await c.req.json();
      const parsed = SamplingPlanUpdateSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
      const d = parsed.data;
      const sets: string[] = [];
      const vals: any[] = [];
      if (d.title     !== undefined) { sets.push('title = ?');     vals.push(d.title); }
      if (d.agent     !== undefined) { sets.push('agent = ?');     vals.push(d.agent); }
      if (d.method    !== undefined) { sets.push('method = ?');    vals.push(d.method); }
      if (d.frequency !== undefined) { sets.push('frequency = ?'); vals.push(d.frequency); }
      if (d.status    !== undefined) { sets.push('status = ?');    vals.push(d.status); }
      if (d.assignee  !== undefined) { sets.push('assignee = ?');  vals.push(d.assignee); }
      if (d.dueDate   !== undefined) { sets.push('due_date = ?');  vals.push(d.dueDate); }
      if (d.notes     !== undefined) { sets.push('notes = ?');     vals.push(d.notes); }
      if (sets.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      sets.push('updated_at = ?'); vals.push(nowMs());
      vals.push(id);
      db.prepare(`UPDATE hygiene_sampling_plans SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
      const row = db.prepare('SELECT * FROM hygiene_sampling_plans WHERE id = ?').get(id);
      return c.json({ success: true, data: mapSamplingPlan(row) });
    } finally { db.close(); }
  });

  // ── DELETE /api/hygiene/sampling-plans/:id ───────────────────────────────
  app.delete('/api/hygiene/sampling-plans/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (!Number.isFinite(id)) return c.json({ success: false, error: 'Invalid id' }, 400);
      const existing = db.prepare('SELECT id FROM hygiene_sampling_plans WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Sampling plan not found' }, 404);
      db.prepare('DELETE FROM hygiene_sampling_plans WHERE id = ?').run(id);
      return c.json({ success: true, message: 'Sampling plan deleted' });
    } finally { db.close(); }
  });

  // ── PATCH /api/hygiene/sampling-plans/:id/status ─────────────────────────
  app.patch('/api/hygiene/sampling-plans/:id/status', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (!Number.isFinite(id)) return c.json({ success: false, error: 'Invalid id' }, 400);
      const existing = db.prepare('SELECT id FROM hygiene_sampling_plans WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Sampling plan not found' }, 404);
      const { status } = await c.req.json();
      if (!['scheduled', 'in_progress', 'completed', 'overdue'].includes(status)) {
        return c.json({ success: false, error: 'Invalid status value' }, 400);
      }
      db.prepare('UPDATE hygiene_sampling_plans SET status = ?, updated_at = ? WHERE id = ?').run(status, nowMs(), id);
      const row = db.prepare('SELECT * FROM hygiene_sampling_plans WHERE id = ?').get(id);
      return c.json({ success: true, data: mapSamplingPlan(row) });
    } finally { db.close(); }
  });
}

