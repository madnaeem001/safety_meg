/**
 * Pilot Program Routes
 *
 * Resource groups:
 *   /api/pilot/stats                        — aggregate KPIs
 *   /api/pilot/sites                        — beta deployment sites CRUD
 *   /api/pilot/shadowing                    — field shadowing sessions CRUD
 *   /api/pilot/feedback                     — user feedback items CRUD + vote
 */

import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProdRoute ? '/data/local.sqlite' : resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Math.floor(Date.now() / 1000);
const todayStr = () => new Date().toISOString().slice(0, 10);

// ── Schema ────────────────────────────────────────────────────────────────────

let _initialized = false;

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pilot_beta_sites (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      department    TEXT    NOT NULL DEFAULT '',
      status        TEXT    NOT NULL DEFAULT 'active'
                            CHECK(status IN ('active','completed','paused')),
      progress      INTEGER NOT NULL DEFAULT 0,
      enrolled      INTEGER NOT NULL DEFAULT 0,
      feedback_count INTEGER NOT NULL DEFAULT 0,
      start_date    TEXT    NOT NULL,
      days_left     INTEGER NOT NULL DEFAULT 0,
      risk_level    TEXT    NOT NULL DEFAULT 'Medium'
                            CHECK(risk_level IN ('Low','Medium','High','Critical')),
      notes         TEXT,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pilot_shadowing_sessions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      observer    TEXT    NOT NULL,
      worker      TEXT    NOT NULL,
      site        TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      findings    TEXT    NOT NULL,
      severity    TEXT    NOT NULL DEFAULT 'medium'
                          CHECK(severity IN ('low','medium','high')),
      status      TEXT    NOT NULL DEFAULT 'open'
                          CHECK(status IN ('open','in-progress','resolved')),
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pilot_feedback_items (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      type      TEXT    NOT NULL DEFAULT 'idea'
                        CHECK(type IN ('bug','idea','praise')),
      message   TEXT    NOT NULL,
      user_role TEXT    NOT NULL DEFAULT 'Field Worker',
      votes     INTEGER NOT NULL DEFAULT 0,
      date      TEXT    NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pilot_config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pilot_sites_status ON pilot_beta_sites(status);
    CREATE INDEX IF NOT EXISTS idx_pilot_sessions_site ON pilot_shadowing_sessions(site);
    CREATE INDEX IF NOT EXISTS idx_pilot_feedback_type ON pilot_feedback_items(type);
  `);
}

function seedData(db: Database.Database) {
  const ts = now();

  // Config (change values & NPS)
  const configSeeds: [string, string][] = [
    ['nps_score', '72'],
    ['nps_change', '+8'],
    ['active_pilots_change', '+1'],
    ['enrolled_change', '+12'],
    ['feedback_change', '+34'],
    ['adoption_change', '+6%'],
    ['ux_issues_change', '-3'],
  ];
  for (const [k, v] of configSeeds) {
    db.prepare(`INSERT OR IGNORE INTO pilot_config (key, value) VALUES (?,?)`).run(k, v);
  }

  // Beta sites
  const sites: { name: string; dept: string; status: string; progress: number; enrolled: number; fc: number; sd: string; dl: number; rl: string }[] = [
    { name: 'Houston Refinery - Unit 4', dept: 'Operations', status: 'active', progress: 72, enrolled: 45, fc: 128, sd: '2026-01-20', dl: 8, rl: 'High' },
    { name: 'Denver Warehouse B', dept: 'Logistics', status: 'active', progress: 58, enrolled: 23, fc: 67, sd: '2026-01-25', dl: 13, rl: 'Medium' },
    { name: 'Chicago Lab - Floor 3', dept: 'R&D', status: 'completed', progress: 100, enrolled: 12, fc: 41, sd: '2025-12-15', dl: 0, rl: 'Low' },
  ];
  for (const s of sites) {
    db.prepare(`
      INSERT OR IGNORE INTO pilot_beta_sites
        (name, department, status, progress, enrolled, feedback_count, start_date, days_left, risk_level, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).run(s.name, s.dept, s.status, s.progress, s.enrolled, s.fc, s.sd, s.dl, s.rl, ts, ts);
  }

  // Shadowing sessions
  const sessions: { obs: string; wkr: string; site: string; date: string; findings: string; sev: string; st: string }[] = [
    { obs: 'Sarah Chen', wkr: 'Mike Torres', site: 'Houston Refinery', date: '2026-02-18', findings: 'Button size too small for gloved hands', sev: 'high', st: 'open' },
    { obs: 'James Park', wkr: 'Lisa Wang', site: 'Denver Warehouse', date: '2026-02-17', findings: 'Photo upload timeout in low-signal areas', sev: 'medium', st: 'in-progress' },
    { obs: 'Sarah Chen', wkr: 'Carlos Ruiz', site: 'Houston Refinery', date: '2026-02-16', findings: 'Voice report works well with PPE on', sev: 'low', st: 'resolved' },
    { obs: 'James Park', wkr: 'Ahmed Hassan', site: 'Denver Warehouse', date: '2026-02-15', findings: 'Needs larger touch targets for inspection checkboxes', sev: 'high', st: 'open' },
    { obs: 'Maria Lopez', wkr: 'Tom Baker', site: 'Chicago Lab', date: '2026-02-14', findings: 'Offline mode sync was seamless', sev: 'low', st: 'resolved' },
  ];
  for (const s of sessions) {
    db.prepare(`
      INSERT OR IGNORE INTO pilot_shadowing_sessions
        (observer, worker, site, date, findings, severity, status, created_at, updated_at)
      SELECT ?,?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM pilot_shadowing_sessions WHERE observer=? AND date=? AND worker=?)
    `).run(s.obs, s.wkr, s.site, s.date, s.findings, s.sev, s.st, ts, ts, s.obs, s.date, s.wkr);
  }

  // Feedback items
  const feedback: { type: string; message: string; user: string; votes: number; date: string }[] = [
    { type: 'bug', message: 'Camera freezes when switching from front to back', user: 'Field Worker', votes: 14, date: '2026-02-19' },
    { type: 'idea', message: 'Add voice-to-text for incident descriptions', user: 'Supervisor', votes: 23, date: '2026-02-18' },
    { type: 'idea', message: 'Allow offline checklist completion', user: 'Field Worker', votes: 31, date: '2026-02-17' },
    { type: 'bug', message: 'PDF export cuts off long descriptions', user: 'Safety Manager', votes: 8, date: '2026-02-16' },
    { type: 'praise', message: 'QR code scanner is incredibly fast', user: 'Technician', votes: 19, date: '2026-02-15' },
  ];
  for (const f of feedback) {
    db.prepare(`
      INSERT OR IGNORE INTO pilot_feedback_items
        (type, message, user_role, votes, date, created_at, updated_at)
      SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM pilot_feedback_items WHERE message=?)
    `).run(f.type, f.message, f.user, f.votes, f.date, ts, ts, f.message);
  }
}

function initOnce() {
  if (_initialized) return;
  const db = getDb();
  try { ensureSchema(db); seedData(db); _initialized = true; } finally { db.close(); }
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapSite(row: any) {
  return {
    id: row.id,
    name: row.name,
    department: row.department,
    status: row.status,
    progress: row.progress,
    enrolled: row.enrolled,
    feedbackCount: row.feedback_count,
    startDate: row.start_date,
    daysLeft: row.days_left,
    riskLevel: row.risk_level,
    notes: row.notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSession(row: any) {
  return {
    id: row.id,
    observer: row.observer,
    worker: row.worker,
    site: row.site,
    date: row.date,
    findings: row.findings,
    severity: row.severity,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFeedback(row: any) {
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    user: row.user_role,
    votes: row.votes,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Validation ────────────────────────────────────────────────────────────────

const CreateSiteSchema = z.object({
  name: z.string().min(1),
  department: z.string().optional().default(''),
  status: z.enum(['active', 'completed', 'paused']).optional().default('active'),
  progress: z.number().int().min(0).max(100).optional().default(0),
  enrolled: z.number().int().min(0).optional().default(0),
  feedbackCount: z.number().int().min(0).optional().default(0),
  startDate: z.string().optional(),
  daysLeft: z.number().int().min(0).optional().default(0),
  riskLevel: z.enum(['Low', 'Medium', 'High', 'Critical']).optional().default('Medium'),
  notes: z.string().optional(),
});

const CreateSessionSchema = z.object({
  observer: z.string().min(1),
  worker: z.string().min(1),
  site: z.string().min(1),
  date: z.string().optional(),
  findings: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  status: z.enum(['open', 'in-progress', 'resolved']).optional().default('open'),
});

const CreateFeedbackSchema = z.object({
  type: z.enum(['bug', 'idea', 'praise']),
  message: z.string().min(1),
  user: z.string().optional().default('Field Worker'),
  date: z.string().optional(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

export function pilotProgramRoutes(app: Hono) {

  // GET /api/pilot/stats
  app.get('/api/pilot/stats', (c) => {
    initOnce();
    const db = getDb();
    try {
      const activePilots = (db.prepare(`SELECT COUNT(*) as n FROM pilot_beta_sites WHERE status='active'`).get() as any).n;
      const totalEnrolled = (db.prepare(`SELECT COALESCE(SUM(enrolled),0) as n FROM pilot_beta_sites`).get() as any).n;
      const feedbackItems = (db.prepare(`SELECT COUNT(*) as n FROM pilot_feedback_items`).get() as any).n;
      const avgAdoptionRow = db.prepare(`SELECT ROUND(AVG(progress),0) as n FROM pilot_beta_sites WHERE status='active'`).get() as any;
      const avgAdoption = avgAdoptionRow?.n ?? 0;
      const uxIssues = (db.prepare(`SELECT COUNT(*) as n FROM pilot_shadowing_sessions WHERE severity='high' AND status != 'resolved'`).get() as any).n;
      const bugCount = (db.prepare(`SELECT COUNT(*) as n FROM pilot_feedback_items WHERE type='bug'`).get() as any).n;
      const uxIssuesFound = uxIssues + bugCount;

      // Config-stored values
      const cfg = (rows: any[]) => Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
      const config = cfg(db.prepare(`SELECT key, value FROM pilot_config`).all() as any[]);

      return c.json({
        success: true,
        data: {
          activePilots,
          totalEnrolled,
          feedbackItems,
          avgAdoption,
          uxIssuesFound,
          npsScore: Number(config['nps_score'] ?? 0),
          changes: {
            activePilots: config['active_pilots_change'] ?? '+0',
            totalEnrolled: config['enrolled_change'] ?? '+0',
            feedbackItems: config['feedback_change'] ?? '+0',
            avgAdoption: config['adoption_change'] ?? '+0%',
            uxIssuesFound: config['ux_issues_change'] ?? '0',
            npsScore: config['nps_change'] ?? '+0',
          },
        },
      });
    } finally { db.close(); }
  });

  // GET /api/pilot/sites
  app.get('/api/pilot/sites', (c) => {
    initOnce();
    const db = getDb();
    try {
      const { status, riskLevel } = c.req.query();
      let sql = `SELECT * FROM pilot_beta_sites WHERE 1=1`;
      const params: any[] = [];
      if (status) { sql += ` AND status=?`; params.push(status); }
      if (riskLevel) { sql += ` AND risk_level=?`; params.push(riskLevel); }
      sql += ` ORDER BY created_at DESC`;
      const rows = (db.prepare(sql).all(...params) as any[]).map(mapSite);
      return c.json({ success: true, data: rows, count: rows.length });
    } finally { db.close(); }
  });

  // POST /api/pilot/sites
  app.post('/api/pilot/sites', async (c) => {
    initOnce();
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateSiteSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
      const d = parsed.data;
      const ts = now();
      const result = db.prepare(`
        INSERT INTO pilot_beta_sites
          (name, department, status, progress, enrolled, feedback_count, start_date, days_left, risk_level, notes, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(d.name, d.department, d.status, d.progress, d.enrolled, d.feedbackCount, d.startDate ?? todayStr(), d.daysLeft, d.riskLevel, d.notes ?? null, ts, ts);
      const row = db.prepare(`SELECT * FROM pilot_beta_sites WHERE id=?`).get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapSite(row) }, 201);
    } finally { db.close(); }
  });

  // PUT /api/pilot/sites/:id
  app.put('/api/pilot/sites/:id', async (c) => {
    initOnce();
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const existing = db.prepare(`SELECT * FROM pilot_beta_sites WHERE id=?`).get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Site not found' }, 404);
      const body = await c.req.json();
      const ts = now();
      const fields: string[] = [];
      const vals: any[] = [];
      const allowed: [string, string][] = [
        ['name', 'name'], ['department', 'department'], ['status', 'status'],
        ['progress', 'progress'], ['enrolled', 'enrolled'], ['feedbackCount', 'feedback_count'],
        ['startDate', 'start_date'], ['daysLeft', 'days_left'], ['riskLevel', 'risk_level'], ['notes', 'notes'],
      ];
      for (const [camel, col] of allowed) {
        if (body[camel] !== undefined) { fields.push(`${col}=?`); vals.push(body[camel]); }
      }
      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at=?'); vals.push(ts); vals.push(id);
      db.prepare(`UPDATE pilot_beta_sites SET ${fields.join(', ')} WHERE id=?`).run(...vals);
      const row = db.prepare(`SELECT * FROM pilot_beta_sites WHERE id=?`).get(id) as any;
      return c.json({ success: true, data: mapSite(row) });
    } finally { db.close(); }
  });

  // DELETE /api/pilot/sites/:id
  app.delete('/api/pilot/sites/:id', (c) => {
    initOnce();
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const existing = db.prepare(`SELECT id FROM pilot_beta_sites WHERE id=?`).get(id);
      if (!existing) return c.json({ success: false, error: 'Site not found' }, 404);
      db.prepare(`DELETE FROM pilot_beta_sites WHERE id=?`).run(id);
      return c.json({ success: true, message: 'Site deleted' });
    } finally { db.close(); }
  });

  // GET /api/pilot/shadowing
  app.get('/api/pilot/shadowing', (c) => {
    initOnce();
    const db = getDb();
    try {
      const { status, severity, site } = c.req.query();
      let sql = `SELECT * FROM pilot_shadowing_sessions WHERE 1=1`;
      const params: any[] = [];
      if (status) { sql += ` AND status=?`; params.push(status); }
      if (severity) { sql += ` AND severity=?`; params.push(severity); }
      if (site) { sql += ` AND site LIKE ?`; params.push(`%${site}%`); }
      sql += ` ORDER BY date DESC, created_at DESC`;
      const rows = (db.prepare(sql).all(...params) as any[]).map(mapSession);
      return c.json({ success: true, data: rows, count: rows.length });
    } finally { db.close(); }
  });

  // POST /api/pilot/shadowing
  app.post('/api/pilot/shadowing', async (c) => {
    initOnce();
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateSessionSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
      const d = parsed.data;
      const ts = now();
      const result = db.prepare(`
        INSERT INTO pilot_shadowing_sessions
          (observer, worker, site, date, findings, severity, status, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?)
      `).run(d.observer, d.worker, d.site, d.date ?? todayStr(), d.findings, d.severity, d.status, ts, ts);
      const row = db.prepare(`SELECT * FROM pilot_shadowing_sessions WHERE id=?`).get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapSession(row) }, 201);
    } finally { db.close(); }
  });

  // PUT /api/pilot/shadowing/:id
  app.put('/api/pilot/shadowing/:id', async (c) => {
    initOnce();
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const existing = db.prepare(`SELECT id FROM pilot_shadowing_sessions WHERE id=?`).get(id);
      if (!existing) return c.json({ success: false, error: 'Session not found' }, 404);
      const body = await c.req.json();
      const ts = now();
      const fields: string[] = [];
      const vals: any[] = [];
      const allowed: [string, string][] = [
        ['observer', 'observer'], ['worker', 'worker'], ['site', 'site'],
        ['date', 'date'], ['findings', 'findings'], ['severity', 'severity'], ['status', 'status'],
      ];
      for (const [camel, col] of allowed) {
        if (body[camel] !== undefined) { fields.push(`${col}=?`); vals.push(body[camel]); }
      }
      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at=?'); vals.push(ts); vals.push(id);
      db.prepare(`UPDATE pilot_shadowing_sessions SET ${fields.join(', ')} WHERE id=?`).run(...vals);
      const row = db.prepare(`SELECT * FROM pilot_shadowing_sessions WHERE id=?`).get(id) as any;
      return c.json({ success: true, data: mapSession(row) });
    } finally { db.close(); }
  });

  // DELETE /api/pilot/shadowing/:id
  app.delete('/api/pilot/shadowing/:id', (c) => {
    initOnce();
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const existing = db.prepare(`SELECT id FROM pilot_shadowing_sessions WHERE id=?`).get(id);
      if (!existing) return c.json({ success: false, error: 'Session not found' }, 404);
      db.prepare(`DELETE FROM pilot_shadowing_sessions WHERE id=?`).run(id);
      return c.json({ success: true, message: 'Session deleted' });
    } finally { db.close(); }
  });

  // GET /api/pilot/feedback
  app.get('/api/pilot/feedback', (c) => {
    initOnce();
    const db = getDb();
    try {
      const { type } = c.req.query();
      let sql = `SELECT * FROM pilot_feedback_items WHERE 1=1`;
      const params: any[] = [];
      if (type) { sql += ` AND type=?`; params.push(type); }
      sql += ` ORDER BY votes DESC, created_at DESC`;
      const rows = (db.prepare(sql).all(...params) as any[]).map(mapFeedback);
      return c.json({ success: true, data: rows, count: rows.length });
    } finally { db.close(); }
  });

  // POST /api/pilot/feedback
  app.post('/api/pilot/feedback', async (c) => {
    initOnce();
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateFeedbackSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
      const d = parsed.data;
      const ts = now();
      const result = db.prepare(`
        INSERT INTO pilot_feedback_items (type, message, user_role, votes, date, created_at, updated_at)
        VALUES (?,?,?,0,?,?,?)
      `).run(d.type, d.message, d.user, d.date ?? todayStr(), ts, ts);
      const row = db.prepare(`SELECT * FROM pilot_feedback_items WHERE id=?`).get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapFeedback(row) }, 201);
    } finally { db.close(); }
  });

  // POST /api/pilot/feedback/:id/vote  [BEFORE /:id DELETE]
  app.post('/api/pilot/feedback/:id/vote', (c) => {
    initOnce();
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const existing = db.prepare(`SELECT * FROM pilot_feedback_items WHERE id=?`).get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Feedback item not found' }, 404);
      const ts = now();
      db.prepare(`UPDATE pilot_feedback_items SET votes=votes+1, updated_at=? WHERE id=?`).run(ts, id);
      const row = db.prepare(`SELECT * FROM pilot_feedback_items WHERE id=?`).get(id) as any;
      return c.json({ success: true, data: mapFeedback(row) });
    } finally { db.close(); }
  });

  // DELETE /api/pilot/feedback/:id
  app.delete('/api/pilot/feedback/:id', (c) => {
    initOnce();
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const existing = db.prepare(`SELECT id FROM pilot_feedback_items WHERE id=?`).get(id);
      if (!existing) return c.json({ success: false, error: 'Feedback item not found' }, 404);
      db.prepare(`DELETE FROM pilot_feedback_items WHERE id=?`).run(id);
      return c.json({ success: true, message: 'Feedback item deleted' });
    } finally { db.close(); }
  });
}
