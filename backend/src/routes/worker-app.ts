/**
 * Mobile Worker App Routes
 *
 * Manages worker tasks, quick hazard/near-miss reports, and environmental
 * readings for the mobile worker field app. All routes require a valid JWT.
 *
 * Routes:
 *   GET    /api/worker-app/tasks                        — list tasks for user
 *   GET    /api/worker-app/tasks/stats                  — pending/completed/overdue counts
 *   POST   /api/worker-app/tasks/seed                   — seed default 5 tasks (idempotent)
 *   PUT    /api/worker-app/tasks/:id/status             — update task status
 *   PUT    /api/worker-app/tasks/:id/checklist/:itemId  — toggle checklist item
 *
 *   GET    /api/worker-app/reports                      — list quick reports for user
 *   POST   /api/worker-app/reports                      — create a quick report
 *
 *   GET    /api/worker-app/environmental                — get environmental readings
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const nowSec = () => Math.floor(Date.now() / 1000);

const JWT_SECRET =
  process.env.JWT_SECRET || 'safetymeg-jwt-secret-2025-change-in-production';

// ── Schema ─────────────────────────────────────────────────────────────────────

function ensureSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS worker_tasks (
      id           TEXT    NOT NULL,
      user_id      INTEGER NOT NULL,
      title        TEXT    NOT NULL,
      type         TEXT    NOT NULL DEFAULT 'inspection',
      priority     TEXT    NOT NULL DEFAULT 'medium',
      status       TEXT    NOT NULL DEFAULT 'pending',
      location     TEXT    NOT NULL DEFAULT '',
      due_time     TEXT    NOT NULL DEFAULT '',
      assigned_by  TEXT    NOT NULL DEFAULT '',
      description  TEXT    NOT NULL DEFAULT '',
      checklist    TEXT    NOT NULL DEFAULT '[]',
      sync_status  TEXT    NOT NULL DEFAULT 'synced',
      created_at   INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      updated_at   INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      PRIMARY KEY (id, user_id)
    );

    CREATE TABLE IF NOT EXISTS worker_quick_reports (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      type        TEXT    NOT NULL DEFAULT 'hazard',
      title       TEXT    NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      location    TEXT    NOT NULL DEFAULT '',
      photo       TEXT,
      timestamp   TEXT    NOT NULL,
      sync_status TEXT    NOT NULL DEFAULT 'synced',
      created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS worker_environmental (
      type       TEXT    PRIMARY KEY,
      value      REAL    NOT NULL DEFAULT 0,
      unit       TEXT    NOT NULL DEFAULT '',
      status     TEXT    NOT NULL DEFAULT 'normal',
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
  `);

  // Seed environmental readings once
  const envCount = (db.prepare('SELECT COUNT(*) as n FROM worker_environmental').get() as any).n;
  if (envCount === 0) {
    const ins = db.prepare(
      'INSERT INTO worker_environmental (type, value, unit, status, updated_at) VALUES (?, ?, ?, ?, ?)'
    );
    const ts = nowSec();
    ins.run('Temperature', 24, '°C', 'normal', ts);
    ins.run('Humidity', 65, '%', 'normal', ts);
    ins.run('Noise Level', 78, 'dB', 'warning', ts);
    ins.run('Air Quality', 42, 'AQI', 'normal', ts);
  }
}

let _initialized = false;
function initOnce() {
  if (_initialized) return;
  _initialized = true;
  const db = getDb();
  try { ensureSchema(db); } finally { db.close(); }
}

// ── Auth helper ────────────────────────────────────────────────────────────────

async function extractUserId(authHeader: string | undefined): Promise<number | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const payload: any = await verify(authHeader.slice(7), JWT_SECRET);
    return typeof payload?.userId === 'number' ? payload.userId : null;
  } catch {
    return null;
  }
}

// ── Seed data ──────────────────────────────────────────────────────────────────

const DEFAULT_TASKS = [
  {
    id: 'TASK-001',
    title: 'Pre-shift Safety Inspection',
    type: 'inspection',
    priority: 'high',
    status: 'pending',
    location: 'Production Floor A',
    dueTime: '08:00 AM',
    assignedBy: 'Safety Manager',
    description: 'Complete daily pre-shift safety walkthrough',
    checklist: [
      { id: 'C1', text: 'Check emergency exits are clear', completed: false, required: true },
      { id: 'C2', text: 'Verify fire extinguishers are accessible', completed: false, required: true },
      { id: 'C3', text: 'Inspect PPE storage area', completed: false, required: true },
      { id: 'C4', text: 'Check first aid kit supplies', completed: false, required: false },
      { id: 'C5', text: 'Review safety board postings', completed: false, required: false },
    ],
    syncStatus: 'synced',
  },
  {
    id: 'TASK-002',
    title: 'Forklift Daily Inspection',
    type: 'maintenance',
    priority: 'high',
    status: 'pending',
    location: 'Warehouse B',
    dueTime: '08:30 AM',
    assignedBy: 'Maintenance Lead',
    description: 'Complete forklift FL-003 daily inspection checklist',
    checklist: [
      { id: 'C1', text: 'Check fluid levels', completed: false, required: true },
      { id: 'C2', text: 'Inspect tires and wheels', completed: false, required: true },
      { id: 'C3', text: 'Test horn and lights', completed: false, required: true },
      { id: 'C4', text: 'Check brake operation', completed: false, required: true },
      { id: 'C5', text: 'Inspect forks for damage', completed: false, required: true },
    ],
    syncStatus: 'synced',
  },
  {
    id: 'TASK-003',
    title: 'Hot Work Permit Verification',
    type: 'permit',
    priority: 'critical',
    status: 'in_progress',
    location: 'Welding Bay 2',
    dueTime: '09:00 AM',
    assignedBy: 'Safety Officer',
    description: 'Verify hot work permit conditions before welding begins',
    checklist: [],
    syncStatus: 'synced',
  },
  {
    id: 'TASK-004',
    title: 'Toolbox Talk - Fall Protection',
    type: 'training',
    priority: 'medium',
    status: 'pending',
    location: 'Break Room',
    dueTime: '10:00 AM',
    assignedBy: 'Training Coordinator',
    description: 'Conduct 15-minute toolbox talk on fall protection requirements',
    checklist: [],
    syncStatus: 'pending',
  },
  {
    id: 'TASK-005',
    title: 'Scaffolding Inspection',
    type: 'safety_check',
    priority: 'high',
    status: 'pending',
    location: 'West Wing Exterior',
    dueTime: '11:00 AM',
    assignedBy: 'Site Supervisor',
    description: 'Daily scaffolding inspection before work at height',
    checklist: [],
    syncStatus: 'synced',
  },
];

// ── Validation ─────────────────────────────────────────────────────────────────

const TaskStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked']),
});

const ChecklistToggleSchema = z.object({
  completed: z.boolean(),
});

const QuickReportSchema = z.object({
  type: z.enum(['hazard', 'near_miss', 'unsafe_condition', 'suggestion']),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  location: z.string().optional().default(''),
  photo: z.string().optional(),
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseJson<T>(s: string, fallback: T): T {
  try { return JSON.parse(s); } catch { return fallback; }
}

function mapTask(row: any) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    priority: row.priority,
    status: row.status,
    location: row.location,
    dueTime: row.due_time,
    assignedBy: row.assigned_by,
    description: row.description,
    checklist: parseJson(row.checklist, []),
    syncStatus: row.sync_status,
  };
}

// ── Route Registration ─────────────────────────────────────────────────────────

export function workerAppRoutes(app: Hono) {
  initOnce();

  /* ===================================================================
     TASKS
     =================================================================== */

  // GET /api/worker-app/tasks/stats  — static path must come before /:id
  app.get('/api/worker-app/tasks/stats', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const db = getDb();
    try {
      ensureSchema(db);
      const total     = (db.prepare("SELECT COUNT(*) as n FROM worker_tasks WHERE user_id=?").get(userId) as any).n;
      const pending   = (db.prepare("SELECT COUNT(*) as n FROM worker_tasks WHERE user_id=? AND status IN ('pending','in_progress')").get(userId) as any).n;
      const completed = (db.prepare("SELECT COUNT(*) as n FROM worker_tasks WHERE user_id=? AND status='completed'").get(userId) as any).n;
      const overdue   = (db.prepare("SELECT COUNT(*) as n FROM worker_tasks WHERE user_id=? AND status='blocked'").get(userId) as any).n;
      return c.json({ success: true, data: { total, pending, completed, overdue } });
    } finally { db.close(); }
  });

  // POST /api/worker-app/tasks/seed  — static path must come before /:id
  app.post('/api/worker-app/tasks/seed', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const db = getDb();
    try {
      ensureSchema(db);
      const existing = (db.prepare('SELECT COUNT(*) as n FROM worker_tasks WHERE user_id=?').get(userId) as any).n;
      if (existing > 0) {
        return c.json({ success: true, message: 'Tasks already exist', seeded: false, count: existing });
      }
      const stmt = db.prepare(`
        INSERT INTO worker_tasks
          (id, user_id, title, type, priority, status, location, due_time, assigned_by, description, checklist, sync_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const ts = nowSec();
      for (const t of DEFAULT_TASKS) {
        stmt.run(
          t.id, userId, t.title, t.type, t.priority, t.status,
          t.location, t.dueTime, t.assignedBy, t.description,
          JSON.stringify(t.checklist), t.syncStatus, ts, ts
        );
      }
      return c.json({ success: true, message: 'Tasks seeded', count: DEFAULT_TASKS.length, seeded: true });
    } finally { db.close(); }
  });

  // GET /api/worker-app/tasks
  app.get('/api/worker-app/tasks', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const db = getDb();
    try {
      ensureSchema(db);
      const rows = db.prepare('SELECT * FROM worker_tasks WHERE user_id=? ORDER BY created_at ASC').all(userId) as any[];
      return c.json({ success: true, data: rows.map(mapTask) });
    } finally { db.close(); }
  });

  // PUT /api/worker-app/tasks/:id/checklist/:itemId  — more specific, must come before /:id/status
  app.put('/api/worker-app/tasks/:id/checklist/:itemId', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const taskId = c.req.param('id');
    const itemId = c.req.param('itemId');

    let raw: unknown;
    try { raw = await c.req.json(); }
    catch { return c.json({ success: false, error: 'Invalid JSON body' }, 400); }

    const parsed = ChecklistToggleSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }

    const db = getDb();
    try {
      ensureSchema(db);
      const row = db.prepare('SELECT * FROM worker_tasks WHERE id=? AND user_id=?').get(taskId, userId) as any;
      if (!row) return c.json({ success: false, error: 'Task not found' }, 404);

      const checklist: any[] = parseJson(row.checklist, []);
      const idx = checklist.findIndex(i => i.id === itemId);
      if (idx === -1) return c.json({ success: false, error: 'Checklist item not found' }, 404);

      checklist[idx] = { ...checklist[idx], completed: parsed.data.completed };
      db.prepare('UPDATE worker_tasks SET checklist=?, sync_status=?, updated_at=? WHERE id=? AND user_id=?')
        .run(JSON.stringify(checklist), 'pending', nowSec(), taskId, userId);

      const updated = db.prepare('SELECT * FROM worker_tasks WHERE id=? AND user_id=?').get(taskId, userId) as any;
      return c.json({ success: true, data: mapTask(updated) });
    } finally { db.close(); }
  });

  // PUT /api/worker-app/tasks/:id/status
  app.put('/api/worker-app/tasks/:id/status', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const taskId = c.req.param('id');

    let raw: unknown;
    try { raw = await c.req.json(); }
    catch { return c.json({ success: false, error: 'Invalid JSON body' }, 400); }

    const parsed = TaskStatusSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }

    const db = getDb();
    try {
      ensureSchema(db);
      const existing = db.prepare('SELECT * FROM worker_tasks WHERE id=? AND user_id=?').get(taskId, userId);
      if (!existing) return c.json({ success: false, error: 'Task not found' }, 404);

      db.prepare('UPDATE worker_tasks SET status=?, sync_status=?, updated_at=? WHERE id=? AND user_id=?')
        .run(parsed.data.status, 'synced', nowSec(), taskId, userId);

      const updated = db.prepare('SELECT * FROM worker_tasks WHERE id=? AND user_id=?').get(taskId, userId) as any;
      return c.json({ success: true, data: mapTask(updated) });
    } finally { db.close(); }
  });

  /* ===================================================================
     QUICK REPORTS
     =================================================================== */

  // GET /api/worker-app/reports
  app.get('/api/worker-app/reports', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const db = getDb();
    try {
      ensureSchema(db);
      const rows = db.prepare(
        'SELECT * FROM worker_quick_reports WHERE user_id=? ORDER BY created_at DESC'
      ).all(userId) as any[];
      return c.json({
        success: true,
        data: rows.map(r => ({
          id:          String(r.id),
          type:        r.type,
          title:       r.title,
          description: r.description,
          location:    r.location,
          photo:       r.photo ?? undefined,
          timestamp:   r.timestamp,
          syncStatus:  r.sync_status,
        })),
      });
    } finally { db.close(); }
  });

  // POST /api/worker-app/reports
  app.post('/api/worker-app/reports', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    let raw: unknown;
    try { raw = await c.req.json(); }
    catch { return c.json({ success: false, error: 'Invalid JSON body' }, 400); }

    const parsed = QuickReportSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }

    const d = parsed.data;
    const db = getDb();
    try {
      ensureSchema(db);
      const timestamp = new Date().toISOString();
      const result = db.prepare(`
        INSERT INTO worker_quick_reports
          (user_id, type, title, description, location, photo, timestamp, sync_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?)
      `).run(userId, d.type, d.title, d.description, d.location, d.photo ?? null, timestamp, nowSec());

      return c.json({
        success: true,
        data: {
          id:          String(result.lastInsertRowid),
          type:        d.type,
          title:       d.title,
          description: d.description,
          location:    d.location,
          photo:       d.photo,
          timestamp,
          syncStatus:  'synced',
        },
      }, 201);
    } finally { db.close(); }
  });

  /* ===================================================================
     ENVIRONMENTAL READINGS
     =================================================================== */

  // GET /api/worker-app/environmental
  app.get('/api/worker-app/environmental', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const db = getDb();
    try {
      ensureSchema(db);
      const rows = db.prepare(
        'SELECT type, value, unit, status FROM worker_environmental ORDER BY type ASC'
      ).all() as any[];
      return c.json({
        success: true,
        data: rows.map(r => ({
          type:   r.type,
          value:  r.value,
          unit:   r.unit,
          status: r.status,
        })),
      });
    } finally { db.close(); }
  });
}
