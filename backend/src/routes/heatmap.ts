/**
 * Incident Heatmap Routes
 *
 * Provides persistent storage for facility incident heatmap data.
 *
 * Endpoints:
 *   GET    /api/heatmap/stats            — aggregate KPIs (total, critical, open, newToday)
 *   GET    /api/heatmap/incidents        — list with filters (timeRange, type, severity, department, search, limit)
 *   GET    /api/heatmap/incidents/:id    — single incident, 404 on missing
 *   POST   /api/heatmap/incidents        — create, returns 201
 *   PUT    /api/heatmap/incidents/:id    — partial update
 *   DELETE /api/heatmap/incidents/:id   — delete
 */

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

function nowMs() { return Date.now(); }

// ── Table Bootstrap ───────────────────────────────────────────────────────────

function ensureTable(db: ReturnType<typeof getDb>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS heatmap_incidents (
      id            TEXT    PRIMARY KEY,
      title         TEXT    NOT NULL,
      type          TEXT    NOT NULL DEFAULT 'near-miss'
                            CHECK(type IN ('injury','near-miss','property-damage','environmental','fire','vehicle')),
      severity      TEXT    NOT NULL DEFAULT 'low'
                            CHECK(severity IN ('low','medium','high','critical')),
      date          TEXT    NOT NULL,
      location      TEXT    NOT NULL,
      department    TEXT    NOT NULL,
      coord_x       REAL    NOT NULL DEFAULT 0,
      coord_y       REAL    NOT NULL DEFAULT 0,
      description   TEXT    NOT NULL DEFAULT '',
      status        TEXT    NOT NULL DEFAULT 'open'
                            CHECK(status IN ('open','investigating','closed')),
      reported_by   TEXT,
      is_new        INTEGER NOT NULL DEFAULT 0,
      timestamp     TEXT,
      created_at    INTEGER,
      updated_at    INTEGER
    );
  `);
}

// ── Seed ──────────────────────────────────────────────────────────────────────

function seedIfEmpty(db: ReturnType<typeof getDb>) {
  const count = (db.prepare('SELECT COUNT(*) as c FROM heatmap_incidents').get() as any).c;
  if (count > 0) return;

  const ts = nowMs();
  const ins = db.prepare(`
    INSERT OR IGNORE INTO heatmap_incidents
      (id,title,type,severity,date,location,department,coord_x,coord_y,description,status,reported_by,is_new,timestamp,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?)
  `);

  const rows: any[][] = [
    ['INC-001','Forklift Near Miss','near-miss','high','2026-02-05','Warehouse A - Aisle 3','Logistics',15,25,'Forklift nearly struck pedestrian in blind corner','investigating','Mike Johnson','2026-02-05T07:00:00Z'],
    ['INC-002','Slip and Fall','injury','medium','2026-02-04','Warehouse A - Loading Dock','Logistics',12,30,'Employee slipped on wet floor near loading dock','closed','Sarah Chen','2026-02-04T08:00:00Z'],
    ['INC-003','Pallet Collapse','property-damage','low','2026-02-03','Warehouse A - Rack B4','Logistics',18,22,'Improperly stacked pallet fell from rack','closed','Tom Wilson','2026-02-03T09:00:00Z'],
    ['INC-004','Hand Laceration','injury','medium','2026-02-01','Warehouse B - Packaging','Logistics',20,35,'Cut from box cutter during unpacking','closed','Anna Davis','2026-02-01T10:00:00Z'],
    ['INC-005','Pedestrian Near Miss','near-miss','medium','2026-01-28','Warehouse A - Aisle 5','Logistics',16,28,'Forklift backed up without checking mirror','closed','James Lee','2026-01-28T07:00:00Z'],
    ['INC-006','Machine Pinch Point','injury','high','2026-02-05','Manufacturing - Line 2','Production',45,40,'Finger caught in conveyor mechanism','investigating','Carlos Martinez','2026-02-05T09:00:00Z'],
    ['INC-007','Chemical Splash','injury','medium','2026-02-04','Manufacturing - Chemical Station','Production',50,55,'Cleaning solution splashed on arm','closed','Lisa Park','2026-02-04T11:00:00Z'],
    ['INC-008','Noise Exposure','near-miss','low','2026-02-03','Manufacturing - Press Area','Production',48,45,'Employee without hearing protection in high-noise area','closed','David Brown','2026-02-03T10:00:00Z'],
    ['INC-009','Electrical Arc Flash Near Miss','near-miss','critical','2026-02-02','Manufacturing - Panel E-4','Maintenance',55,50,'Near arc flash during panel inspection','investigating','Kevin White','2026-02-02T08:00:00Z'],
    ['INC-010','Robot Arm Malfunction','property-damage','high','2026-01-30','Manufacturing - Cell 7','Production',52,42,'Robot arm exceeded programmed boundaries','closed','Emily Taylor','2026-01-30T07:00:00Z'],
    ['INC-013','Chemical Spill','environmental','high','2026-02-04','Laboratory - Bay 2','R&D',75,20,'Solvent container tipped during transport','investigating','Dr. Rachel Kim','2026-02-04T13:00:00Z'],
    ['INC-014','Fume Hood Failure','near-miss','high','2026-01-31','Laboratory - Chemistry','R&D',78,25,'Fume hood ventilation stopped during experiment','closed','Dr. Mark Stevens','2026-01-31T11:00:00Z'],
    ['INC-021','Welding Flash','injury','medium','2026-02-05','Maintenance Shop','Maintenance',30,65,'Eye exposure to welding arc','investigating','Robert Garcia','2026-02-05T06:00:00Z'],
    ['INC-022','Grinder Kickback','near-miss','high','2026-01-29','Maintenance Shop','Maintenance',32,68,'Angle grinder caught and kicked back','closed','Jason Miller','2026-01-29T08:00:00Z'],
    ['INC-023','Fire - Welding Sparks','fire','critical','2026-01-15','Maintenance Shop','Maintenance',28,62,'Small fire from welding sparks on oily rags','closed','Michael Thompson','2026-01-15T14:00:00Z'],
  ];

  for (const row of rows) {
    ins.run(...row, ts, ts);
  }
}

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapIncident(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    severity: row.severity,
    date: row.date,
    location: row.location,
    department: row.department,
    coordinates: { x: row.coord_x, y: row.coord_y },
    description: row.description,
    status: row.status,
    reportedBy: row.reported_by,
    isNew: row.is_new === 1,
    timestamp: row.timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Validation ────────────────────────────────────────────────────────────────

const CreateSchema = z.object({
  id:          z.string().min(1, 'ID required'),
  title:       z.string().min(1, 'Title required'),
  type:        z.enum(['injury','near-miss','property-damage','environmental','fire','vehicle']),
  severity:    z.enum(['low','medium','high','critical']),
  date:        z.string().min(1, 'Date required'),
  location:    z.string().min(1, 'Location required'),
  department:  z.string().min(1, 'Department required'),
  coordX:      z.number().min(0).max(100),
  coordY:      z.number().min(0).max(100),
  description: z.string().default(''),
  status:      z.enum(['open','investigating','closed']).default('open'),
  reportedBy:  z.string().optional(),
  isNew:       z.boolean().default(false),
  timestamp:   z.string().optional(),
});

const UpdateSchema = z.object({
  title:       z.string().min(1).optional(),
  type:        z.enum(['injury','near-miss','property-damage','environmental','fire','vehicle']).optional(),
  severity:    z.enum(['low','medium','high','critical']).optional(),
  date:        z.string().optional(),
  location:    z.string().optional(),
  department:  z.string().optional(),
  coordX:      z.number().min(0).max(100).optional(),
  coordY:      z.number().min(0).max(100).optional(),
  description: z.string().optional(),
  status:      z.enum(['open','investigating','closed']).optional(),
  reportedBy:  z.string().optional(),
  isNew:       z.boolean().optional(),
  timestamp:   z.string().optional(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

export function heatmapRoutes(app: Hono) {
  const db = getDb();
  ensureTable(db);
  seedIfEmpty(db);

  // ── Stats ──────────────────────────────────────────────────────────────────
  app.get('/api/heatmap/stats', (c) => {
    const total    = (db.prepare('SELECT COUNT(*) as c FROM heatmap_incidents').get() as any).c;
    const critical = (db.prepare("SELECT COUNT(*) as c FROM heatmap_incidents WHERE severity = 'critical'").get() as any).c;
    const open     = (db.prepare("SELECT COUNT(*) as c FROM heatmap_incidents WHERE status != 'closed'").get() as any).c;

    // "new today" = incidents created within the last 24 hours
    const dayAgo   = Date.now() - 24 * 60 * 60 * 1000;
    const newToday = (db.prepare('SELECT COUNT(*) as c FROM heatmap_incidents WHERE created_at >= ?').get(dayAgo) as any).c;

    return c.json({ success: true, data: { total, critical, open, newToday } });
  });

  // ── List ───────────────────────────────────────────────────────────────────
  app.get('/api/heatmap/incidents', (c) => {
    const { timeRange, type, severity, department, search } = c.req.query();
    const limitParam = c.req.query('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 0;

    let sql = 'SELECT * FROM heatmap_incidents WHERE 1=1';
    const params: any[] = [];

    if (timeRange && timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      sql += ' AND date >= ?';
      params.push(cutoff);
    }

    if (type)       { sql += ' AND type = ?';       params.push(type); }
    if (severity)   { sql += ' AND severity = ?';   params.push(severity); }
    if (department) { sql += ' AND department = ?'; params.push(department); }
    if (search)     { sql += ' AND (title LIKE ? OR location LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    sql += ' ORDER BY created_at DESC';
    if (limit > 0) { sql += ' LIMIT ?'; params.push(limit); }

    const rows = db.prepare(sql).all(...params);
    const data = rows.map(mapIncident);
    return c.json({ success: true, data, total: rows.length });
  });

  // ── Get Single ─────────────────────────────────────────────────────────────
  app.get('/api/heatmap/incidents/:id', (c) => {
    const id = c.req.param('id');
    const row = db.prepare('SELECT * FROM heatmap_incidents WHERE id = ?').get(id);
    if (!row) return c.json({ success: false, error: 'Incident not found' }, 404);
    return c.json({ success: true, data: mapIncident(row) });
  });

  // ── Create ─────────────────────────────────────────────────────────────────
  app.post('/api/heatmap/incidents', async (c) => {
    const body = await c.req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }, 400);
    }
    const d = parsed.data;
    const ts = nowMs();

    // Check duplicate id
    const existing = db.prepare('SELECT id FROM heatmap_incidents WHERE id = ?').get(d.id);
    if (existing) return c.json({ success: false, error: 'Incident with this ID already exists' }, 409);

    db.prepare(`
      INSERT INTO heatmap_incidents
        (id,title,type,severity,date,location,department,coord_x,coord_y,description,status,reported_by,is_new,timestamp,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      d.id, d.title, d.type, d.severity, d.date, d.location, d.department,
      d.coordX, d.coordY, d.description, d.status, d.reportedBy ?? null,
      d.isNew ? 1 : 0, d.timestamp ?? null, ts, ts
    );

    const row = db.prepare('SELECT * FROM heatmap_incidents WHERE id = ?').get(d.id);
    return c.json({ success: true, data: mapIncident(row) }, 201);
  });

  // ── Update ─────────────────────────────────────────────────────────────────
  app.put('/api/heatmap/incidents/:id', async (c) => {
    const id = c.req.param('id');
    const existing = db.prepare('SELECT id FROM heatmap_incidents WHERE id = ?').get(id);
    if (!existing) return c.json({ success: false, error: 'Incident not found' }, 404);

    const body = await c.req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }, 400);
    }
    const d = parsed.data;
    const sets: string[] = [];
    const params: any[] = [];

    if (d.title       !== undefined) { sets.push('title = ?');       params.push(d.title); }
    if (d.type        !== undefined) { sets.push('type = ?');        params.push(d.type); }
    if (d.severity    !== undefined) { sets.push('severity = ?');    params.push(d.severity); }
    if (d.date        !== undefined) { sets.push('date = ?');        params.push(d.date); }
    if (d.location    !== undefined) { sets.push('location = ?');    params.push(d.location); }
    if (d.department  !== undefined) { sets.push('department = ?');  params.push(d.department); }
    if (d.coordX      !== undefined) { sets.push('coord_x = ?');     params.push(d.coordX); }
    if (d.coordY      !== undefined) { sets.push('coord_y = ?');     params.push(d.coordY); }
    if (d.description !== undefined) { sets.push('description = ?'); params.push(d.description); }
    if (d.status      !== undefined) { sets.push('status = ?');      params.push(d.status); }
    if (d.reportedBy  !== undefined) { sets.push('reported_by = ?'); params.push(d.reportedBy); }
    if (d.isNew       !== undefined) { sets.push('is_new = ?');      params.push(d.isNew ? 1 : 0); }
    if (d.timestamp   !== undefined) { sets.push('timestamp = ?');   params.push(d.timestamp); }

    if (sets.length === 0) {
      const row = db.prepare('SELECT * FROM heatmap_incidents WHERE id = ?').get(id);
      return c.json({ success: true, data: mapIncident(row) });
    }

    sets.push('updated_at = ?');
    params.push(nowMs(), id);
    db.prepare(`UPDATE heatmap_incidents SET ${sets.join(', ')} WHERE id = ?`).run(...params);

    const row = db.prepare('SELECT * FROM heatmap_incidents WHERE id = ?').get(id);
    return c.json({ success: true, data: mapIncident(row) });
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
  app.delete('/api/heatmap/incidents/:id', (c) => {
    const id = c.req.param('id');
    const existing = db.prepare('SELECT id FROM heatmap_incidents WHERE id = ?').get(id);
    if (!existing) return c.json({ success: false, error: 'Incident not found' }, 404);
    db.prepare('DELETE FROM heatmap_incidents WHERE id = ?').run(id);
    return c.json({ success: true, message: 'Incident deleted' });
  });
}
