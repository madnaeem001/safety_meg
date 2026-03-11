import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Date.now();

function safeJson(val: any): any {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

// Map raw DB snake_case row → camelCase BBSObservation shape expected by frontend
function mapObs(r: any) {
  // Normalize backend status values to frontend vocabulary
  const statusMap: Record<string, string> = { closed: 'resolved', 'in-review': 'coached' };
  return {
    id: r.id,
    observationCode: `OBS-${r.id}`,
    observerName: r.observer_name,
    observerRole: r.observer_id ?? undefined,
    department: r.department ?? '',
    workArea: r.observed_area ?? '',
    observationDate: r.observation_date,
    observationType: r.behavior_type === 'safe' ? 'safe' : 'at-risk',
    category: r.category ?? '',
    behaviorObserved: r.description,
    feedback: r.notes ?? undefined,
    actionTaken: r.action_taken ?? undefined,
    acknowledged: false,
    followUpRequired: r.follow_up_required === 1,
    status: statusMap[r.status] ?? r.status,
    createdAt: r.created_at,
  };
}

const CreateObsSchema = z.object({
  observerName: z.string().min(1),
  observerId: z.string().optional(),
  observedEmployee: z.string().optional(),
  observedArea: z.string().optional(),
  department: z.string().optional(),
  observationDate: z.string().min(1),
  behaviorType: z.enum(['safe', 'at-risk', 'unsafe']),
  category: z.enum(['ppe', 'housekeeping', 'procedures', 'ergonomics', 'equipment', 'environmental', 'other']).optional(),
  description: z.string().min(1),
  actionTaken: z.string().optional(),
  followUpRequired: z.boolean().optional().default(false),
  followUpDate: z.string().optional(),
  status: z.enum(['open', 'closed', 'in-review']).optional().default('open'),
  safetyScore: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

const CreateSIFSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  precursorType: z.enum(['energized-equipment', 'fall-from-height', 'confined-space', 'struck-by', 'vehicle', 'chemical-exposure', 'explosion', 'other']).optional(),
  severity: z.enum(['potential-sif', 'critical', 'high', 'medium']).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'rarely']).optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  associatedHazards: z.array(z.string()).optional(),
  mitigationActions: z.array(z.string()).optional(),
  status: z.enum(['active', 'mitigated', 'monitoring']).optional().default('active'),
  alertTriggered: z.boolean().optional().default(false),
  lastReviewDate: z.string().optional(),
});

export function behaviorSafetyRoutes(app: Hono) {

  // ==== BEHAVIOR-BASED SAFETY (BBS) ====

  // GET /api/bbs/stats
  app.get('/api/bbs/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as cnt FROM safety_observations').get() as any).cnt;
      const safe = (db.prepare("SELECT COUNT(*) as cnt FROM safety_observations WHERE behavior_type='safe'").get() as any).cnt;
      const atRisk = (db.prepare("SELECT COUNT(*) as cnt FROM safety_observations WHERE behavior_type='at-risk'").get() as any).cnt;
      const unsafe = (db.prepare("SELECT COUNT(*) as cnt FROM safety_observations WHERE behavior_type='unsafe'").get() as any).cnt;
      const byCategory = db.prepare('SELECT category, COUNT(*) as count FROM safety_observations GROUP BY category').all();
      const byDept = db.prepare('SELECT department, COUNT(*) as count FROM safety_observations GROUP BY department').all();
      const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM safety_observations GROUP BY status').all();
      const requireFollowUp = (db.prepare("SELECT COUNT(*) as cnt FROM safety_observations WHERE follow_up_required=1 AND status != 'closed'").get() as any).cnt;
      const avgScore = (db.prepare('SELECT AVG(safety_score) as avg FROM safety_observations WHERE safety_score IS NOT NULL').get() as any).avg;
      const safeRate = total > 0 ? Math.round((safe / total) * 100) : 0;
      return c.json({ success: true, data: { total, safe, atRisk, unsafe, safeRate, byCategory, byDept, byStatus, requireFollowUp, avgSafetyScore: avgScore ?? 0 } });
    } finally { db.close(); }
  });

  // GET /api/bbs/observations — list
  app.get('/api/bbs/observations', (c) => {
    const db = getDb();
    try {
      // Accept both `type` (frontend) and `behaviorType` (legacy) query params
      const raw = c.req.query();
      const typeParam = raw.type ?? raw.behaviorType;
      const { department, status, category, from, to } = raw;
      let sql = 'SELECT * FROM safety_observations WHERE 1=1';
      const params: any[] = [];
      if (typeParam) {
        // Normalize at_risk (underscore) → at-risk (hyphen) to match DB values
        const normalizedType = typeParam === 'at_risk' ? 'at-risk' : typeParam;
        sql += ' AND behavior_type = ?'; params.push(normalizedType);
      }
      if (department) { sql += ' AND department = ?'; params.push(department); }
      if (status) { sql += ' AND status = ?'; params.push(status); }
      if (category) { sql += ' AND category = ?'; params.push(category); }
      if (from) { sql += ' AND observation_date >= ?'; params.push(from); }
      if (to) { sql += ' AND observation_date <= ?'; params.push(to); }
      sql += ' ORDER BY created_at DESC';
      const rows = db.prepare(sql).all(...params).map(mapObs);
      return c.json({ success: true, data: rows, total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/bbs/observations
  app.post('/api/bbs/observations', async (c) => {
    const db = getDb();
    try {
      const rawBody = await c.req.json();
      // Normalize frontend BBSObservation field names to backend schema names
      const body = {
        observerName:    rawBody.observerName,
        observerId:      rawBody.observerId ?? rawBody.observerRole,
        observedEmployee: rawBody.observedEmployee,
        observedArea:    rawBody.workArea ?? rawBody.observedArea,
        department:      rawBody.department,
        observationDate: rawBody.observationDate,
        // observationType (frontend) or behaviorType (backend), normalize at_risk→at-risk
        behaviorType:    (() => {
          const raw = rawBody.observationType ?? rawBody.behaviorType ?? 'at-risk';
          return raw === 'at_risk' ? 'at-risk' : raw;
        })(),
        category:        rawBody.category,
        description:     rawBody.behaviorObserved ?? rawBody.description,
        actionTaken:     rawBody.actionTaken,
        notes:           rawBody.feedback ?? rawBody.notes,
        followUpRequired: rawBody.followUpRequired ?? false,
        followUpDate:    rawBody.followUpDate,
        // Normalize frontend status values back to backend values
        status: (() => {
          const s = rawBody.status;
          if (s === 'resolved') return 'closed';
          if (s === 'coached') return 'in-review';
          return s ?? 'open';
        })(),
        safetyScore:     rawBody.safetyScore,
      };
      const parsed = CreateObsSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);
      const d = parsed.data;
      const ts = now();
      const result = db.prepare(`
        INSERT INTO safety_observations (observer_name, observer_id, observed_employee, observed_area,
          department, observation_date, behavior_type, category, description, action_taken,
          follow_up_required, follow_up_date, status, safety_score, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(d.observerName, d.observerId ?? null, d.observedEmployee ?? null, d.observedArea ?? null,
        d.department ?? null, d.observationDate, d.behaviorType, d.category ?? null,
        d.description, d.actionTaken ?? null, d.followUpRequired ? 1 : 0,
        d.followUpDate ?? null, d.status, d.safetyScore ?? null, d.notes ?? null, ts, ts);
      const created = db.prepare('SELECT * FROM safety_observations WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapObs(created) }, 201);
    } finally { db.close(); }
  });

  // GET /api/bbs/observations/:id
  app.get('/api/bbs/observations/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id) || id <= 0) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const row = db.prepare('SELECT * FROM safety_observations WHERE id = ?').get(id);
      if (!row) return c.json({ success: false, error: 'Observation not found' }, 404);
      return c.json({ success: true, data: mapObs(row) });
    } finally { db.close(); }
  });

  // PUT /api/bbs/observations/:id
  app.put('/api/bbs/observations/:id', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id) || id <= 0) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const existing = db.prepare('SELECT id FROM safety_observations WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Observation not found' }, 404);
      const body = await c.req.json();
      const fields: string[] = [];
      const params: any[] = [];
      const map: Record<string, string> = { observerName: 'observer_name', observerId: 'observer_id', observedEmployee: 'observed_employee', observedArea: 'observed_area', observationDate: 'observation_date', behaviorType: 'behavior_type', actionTaken: 'action_taken', followUpRequired: 'follow_up_required', followUpDate: 'follow_up_date', safetyScore: 'safety_score' };
      const allowed = ['observer_name', 'observer_id', 'observed_employee', 'observed_area', 'department', 'observation_date', 'behavior_type', 'category', 'description', 'action_taken', 'follow_up_required', 'follow_up_date', 'status', 'safety_score', 'notes'];
      for (const [k, v] of Object.entries(body)) {
        const col = map[k] ?? k;
        const val = k === 'followUpRequired' ? (v ? 1 : 0) : v;
        if (allowed.includes(col)) { fields.push(`${col} = ?`); params.push(val); }
      }
      if (!fields.length) return c.json({ success: false, error: 'No valid fields' }, 400);
      fields.push('updated_at = ?'); params.push(now()); params.push(id);
      db.prepare(`UPDATE safety_observations SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM safety_observations WHERE id = ?').get(id);
      return c.json({ success: true, data: mapObs(updated) });
    } finally { db.close(); }
  });

  // ==== SIF PRECURSORS ====

  // GET /api/sif/stats
  app.get('/api/sif/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as cnt FROM sif_precursors').get() as any).cnt;
      const bySeverity = db.prepare('SELECT severity, COUNT(*) as count FROM sif_precursors GROUP BY severity').all();
      const byType = db.prepare('SELECT precursor_type, COUNT(*) as count FROM sif_precursors GROUP BY precursor_type').all();
      const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM sif_precursors GROUP BY status').all();
      const alertsTriggered = (db.prepare('SELECT COUNT(*) as cnt FROM sif_precursors WHERE alert_triggered=1').get() as any).cnt;
      const active = (db.prepare("SELECT COUNT(*) as cnt FROM sif_precursors WHERE status='active'").get() as any).cnt;
      const recent = db.prepare('SELECT * FROM sif_precursors ORDER BY created_at DESC LIMIT 5').all().map((r: any) => ({
        ...r, associatedHazards: safeJson(r.associated_hazards), mitigationActions: safeJson(r.mitigation_actions)
      }));
      return c.json({ success: true, data: { total, active, alertsTriggered, bySeverity, byType, byStatus, recentPrecursors: recent } });
    } finally { db.close(); }
  });

  // GET /api/sif/precursors — list
  app.get('/api/sif/precursors', (c) => {
    const db = getDb();
    try {
      const { severity, status, department, precursorType, alertTriggered } = c.req.query();
      let sql = 'SELECT * FROM sif_precursors WHERE 1=1';
      const params: any[] = [];
      if (severity) { sql += ' AND severity = ?'; params.push(severity); }
      if (status) { sql += ' AND status = ?'; params.push(status); }
      if (department) { sql += ' AND department = ?'; params.push(department); }
      if (precursorType) { sql += ' AND precursor_type = ?'; params.push(precursorType); }
      if (alertTriggered === 'true') { sql += ' AND alert_triggered = 1'; }
      sql += ' ORDER BY created_at DESC';
      const rows = db.prepare(sql).all(...params).map((r: any) => ({
        ...r,
        associatedHazards: safeJson(r.associated_hazards),
        mitigationActions: safeJson(r.mitigation_actions),
      }));
      return c.json({ success: true, data: rows, total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/sif/precursors
  app.post('/api/sif/precursors', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateSIFSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);
      const d = parsed.data;
      const ts = now();
      const result = db.prepare(`
        INSERT INTO sif_precursors (title, description, precursor_type, severity, frequency,
          department, location, associated_hazards, mitigation_actions, status, alert_triggered,
          last_review_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(d.title, d.description ?? null, d.precursorType ?? null, d.severity ?? null,
        d.frequency ?? null, d.department ?? null, d.location ?? null,
        d.associatedHazards ? JSON.stringify(d.associatedHazards) : null,
        d.mitigationActions ? JSON.stringify(d.mitigationActions) : null,
        d.status, d.alertTriggered ? 1 : 0, d.lastReviewDate ?? null, ts, ts);
      const created = db.prepare('SELECT * FROM sif_precursors WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: { ...created, associatedHazards: safeJson(created.associated_hazards), mitigationActions: safeJson(created.mitigation_actions) } }, 201);
    } finally { db.close(); }
  });

  // GET /api/sif/precursors/:id
  app.get('/api/sif/precursors/:id', (c) => {
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM sif_precursors WHERE id = ?').get(c.req.param('id')) as any;
      if (!row) return c.json({ success: false, error: 'SIF precursor not found' }, 404);
      return c.json({ success: true, data: { ...row, associatedHazards: safeJson(row.associated_hazards), mitigationActions: safeJson(row.mitigation_actions) } });
    } finally { db.close(); }
  });

  // PUT /api/sif/precursors/:id
  app.put('/api/sif/precursors/:id', async (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM sif_precursors WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ success: false, error: 'SIF precursor not found' }, 404);
      const body = await c.req.json();
      const fields: string[] = [];
      const params: any[] = [];
      const map: Record<string, string> = { precursorType: 'precursor_type', associatedHazards: 'associated_hazards', mitigationActions: 'mitigation_actions', alertTriggered: 'alert_triggered', lastReviewDate: 'last_review_date' };
      const allowed = ['title', 'description', 'precursor_type', 'severity', 'frequency', 'department', 'location', 'associated_hazards', 'mitigation_actions', 'status', 'alert_triggered', 'last_review_date'];
      for (const [k, v] of Object.entries(body)) {
        const col = map[k] ?? k;
        const val = (k === 'associatedHazards' || k === 'mitigationActions') ? JSON.stringify(v) : (k === 'alertTriggered' ? (v ? 1 : 0) : v);
        if (allowed.includes(col)) { fields.push(`${col} = ?`); params.push(val); }
      }
      if (!fields.length) return c.json({ success: false, error: 'No valid fields' }, 400);
      fields.push('updated_at = ?'); params.push(now()); params.push(c.req.param('id'));
      db.prepare(`UPDATE sif_precursors SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM sif_precursors WHERE id = ?').get(c.req.param('id')) as any;
      return c.json({ success: true, data: { ...updated, associatedHazards: safeJson(updated.associated_hazards), mitigationActions: safeJson(updated.mitigation_actions) } });
    } finally { db.close(); }
  });
}
