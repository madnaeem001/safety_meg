/**
 * Hyper-Care Training Routes
 *
 * Three resource groups:
 *   /api/hypercare/stats          — aggregate KPIs
 *   /api/hypercare/demos          — Toolbox Talk Demo CRUD
 *   /api/hypercare/champions      — Safety Champion CRUD
 *   /api/hypercare/qr             — QR Code Deployment CRUD + scan increment
 */

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

function safeJson(val: any): any[] {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

// ── Table Bootstrap ───────────────────────────────────────────────────────────

function ensureTables(db: ReturnType<typeof getDb>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS hypercare_demos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      duration    TEXT    NOT NULL DEFAULT '5 min',
      audience    TEXT    NOT NULL DEFAULT 'All Workers',
      scheduled   TEXT    NOT NULL,
      site        TEXT    NOT NULL,
      attendees   INTEGER NOT NULL DEFAULT 0,
      status      TEXT    NOT NULL DEFAULT 'scheduled'
                          CHECK(status IN ('upcoming','completed','scheduled')),
      type        TEXT    NOT NULL DEFAULT 'live'
                          CHECK(type IN ('live','recorded')),
      created_at  INTEGER,
      updated_at  INTEGER
    );

    CREATE TABLE IF NOT EXISTS hypercare_champions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      site         TEXT    NOT NULL,
      role         TEXT    NOT NULL,
      trained      TEXT    NOT NULL,
      peers_helped INTEGER NOT NULL DEFAULT 0,
      rating       REAL    NOT NULL DEFAULT 5.0,
      specialties  TEXT    NOT NULL DEFAULT '[]',
      created_at   INTEGER,
      updated_at   INTEGER
    );

    CREATE TABLE IF NOT EXISTS hypercare_qr_deployments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      location    TEXT    NOT NULL,
      form        TEXT    NOT NULL,
      scans       INTEGER NOT NULL DEFAULT 0,
      last_scan   TEXT    NOT NULL DEFAULT 'never',
      status      TEXT    NOT NULL DEFAULT 'active'
                          CHECK(status IN ('active','inactive')),
      created_at  INTEGER,
      updated_at  INTEGER
    );
  `);
}

// ── Seed ──────────────────────────────────────────────────────────────────────

function seedIfEmpty(db: ReturnType<typeof getDb>) {
  const demoCount = (db.prepare('SELECT COUNT(*) as c FROM hypercare_demos').get() as any).c;
  if (demoCount === 0) {
    const ts = nowMs();
    const ins = db.prepare(`
      INSERT INTO hypercare_demos (title,duration,audience,scheduled,site,attendees,status,type,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `);
    const demos: any[][] = [
      ['Incident Reporting Walkthrough','5 min','All Workers','2026-02-20 07:00','Houston Refinery',28,'upcoming','live'],
      ['QR Code Inspection — How It Works','5 min','Technicians','2026-02-20 07:30','Denver Warehouse',15,'upcoming','live'],
      ['Voice Hazard Report Demo','3 min','Field Workers','2026-02-19 07:00','Houston Refinery',32,'completed','live'],
      ['Mobile App Offline Mode','4 min','All Workers','2026-02-18 07:00','Chicago Lab',12,'completed','recorded'],
      ['PPE Photo Documentation','5 min','Safety Team','2026-02-21 07:00','Denver Warehouse',0,'scheduled','live'],
    ];
    for (const d of demos) ins.run(...d, ts, ts);
  }

  const champCount = (db.prepare('SELECT COUNT(*) as c FROM hypercare_champions').get() as any).c;
  if (champCount === 0) {
    const ts = nowMs();
    const ins = db.prepare(`
      INSERT INTO hypercare_champions (name,site,role,trained,peers_helped,rating,specialties,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `);
    const champs: any[][] = [
      ['Maria Gonzalez','Houston Refinery','Lead Operator','2026-01-15',24,4.9,JSON.stringify(['Incident Reporting','Risk Assessment'])],
      ['David Kim','Denver Warehouse','Shift Supervisor','2026-01-18',18,4.7,JSON.stringify(['Inspections','QR Scanning'])],
      ['Rachel Adams','Chicago Lab','Safety Coordinator','2026-01-10',31,4.8,JSON.stringify(['Training','Compliance'])],
      ['Tom Nguyen','Houston Refinery','Maintenance Tech','2026-01-20',12,4.6,JSON.stringify(['Permit-to-Work','LOTO'])],
    ];
    for (const c of champs) ins.run(...c, ts, ts);
  }

  const qrCount = (db.prepare('SELECT COUNT(*) as c FROM hypercare_qr_deployments').get() as any).c;
  if (qrCount === 0) {
    const ts = nowMs();
    const ins = db.prepare(`
      INSERT INTO hypercare_qr_deployments (location,form,scans,last_scan,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?)
    `);
    const qrs: any[][] = [
      ['Warehouse Entrance - Bay A','Pre-Shift Safety Checklist',187,'3 min ago','active'],
      ['Forklift #FL-012','Forklift Daily Inspection',94,'1 hour ago','active'],
      ['Chemical Storage Room','SDS Verification Checklist',56,'4 hours ago','active'],
      ['Confined Space Entry - Tank 7','Confined Space Permit',23,'1 day ago','active'],
      ['Electrical Panel Room B','LOTO Verification',41,'6 hours ago','active'],
      ['Loading Dock 3','Truck Inspection Checklist',112,'30 min ago','active'],
    ];
    for (const q of qrs) ins.run(...q, ts, ts);
  }
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapDemo(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    duration: row.duration,
    audience: row.audience,
    scheduled: row.scheduled,
    site: row.site,
    attendees: row.attendees,
    status: row.status,
    type: row.type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapChampion(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    site: row.site,
    role: row.role,
    trained: row.trained,
    peersHelped: row.peers_helped,
    rating: row.rating,
    specialties: safeJson(row.specialties),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapQr(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    location: row.location,
    form: row.form,
    scans: row.scans,
    lastScan: row.last_scan,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Validation Schemas ────────────────────────────────────────────────────────

const DemoCreateSchema = z.object({
  title:     z.string().min(1, 'Title required'),
  duration:  z.string().default('5 min'),
  audience:  z.string().default('All Workers'),
  scheduled: z.string().min(1, 'Scheduled datetime required'),
  site:      z.string().min(1, 'Site required'),
  attendees: z.number().int().min(0).default(0),
  status:    z.enum(['upcoming','completed','scheduled']).default('scheduled'),
  type:      z.enum(['live','recorded']).default('live'),
});

const DemoUpdateSchema = z.object({
  title:     z.string().min(1).optional(),
  duration:  z.string().optional(),
  audience:  z.string().optional(),
  scheduled: z.string().optional(),
  site:      z.string().optional(),
  attendees: z.number().int().min(0).optional(),
  status:    z.enum(['upcoming','completed','scheduled']).optional(),
  type:      z.enum(['live','recorded']).optional(),
});

const ChampionCreateSchema = z.object({
  name:        z.string().min(1, 'Name required'),
  site:        z.string().min(1, 'Site required'),
  role:        z.string().min(1, 'Role required'),
  trained:     z.string().min(1, 'Trained date required'),
  peersHelped: z.number().int().min(0).default(0),
  rating:      z.number().min(0).max(5).default(5.0),
  specialties: z.array(z.string()).default([]),
});

const ChampionUpdateSchema = z.object({
  name:        z.string().min(1).optional(),
  site:        z.string().optional(),
  role:        z.string().optional(),
  trained:     z.string().optional(),
  peersHelped: z.number().int().min(0).optional(),
  rating:      z.number().min(0).max(5).optional(),
  specialties: z.array(z.string()).optional(),
});

const QrCreateSchema = z.object({
  location: z.string().min(1, 'Location required'),
  form:     z.string().min(1, 'Form name required'),
  scans:    z.number().int().min(0).default(0),
  lastScan: z.string().default('never'),
  status:   z.enum(['active','inactive']).default('active'),
});

const QrUpdateSchema = z.object({
  location: z.string().min(1).optional(),
  form:     z.string().optional(),
  scans:    z.number().int().min(0).optional(),
  lastScan: z.string().optional(),
  status:   z.enum(['active','inactive']).optional(),
});

// ── Route Handler ─────────────────────────────────────────────────────────────

export function hypercareRoutes(app: Hono) {
  const db = getDb();
  ensureTables(db);
  seedIfEmpty(db);

  // ── Stats ──────────────────────────────────────────────────────────────────
  app.get('/api/hypercare/stats', (c) => {
    const toolboxDemos   = (db.prepare('SELECT COUNT(*) as c FROM hypercare_demos').get() as any).c;
    const safetyChampions = (db.prepare('SELECT COUNT(*) as c FROM hypercare_champions').get() as any).c;
    const qrCodesDeployed = (db.prepare('SELECT COUNT(*) as c FROM hypercare_qr_deployments').get() as any).c;
    const workersTrained  = (db.prepare('SELECT COALESCE(SUM(attendees),0) as s FROM hypercare_demos').get() as any).s;
    const peerHelpSessions = (db.prepare('SELECT COALESCE(SUM(peers_helped),0) as s FROM hypercare_champions').get() as any).s;
    return c.json({
      success: true,
      data: { toolboxDemos, safetyChampions, qrCodesDeployed, workersTrained, peerHelpSessions, avgCompetency: '91%' },
    });
  });

  // ── Toolbox Talk Demos ─────────────────────────────────────────────────────
  app.get('/api/hypercare/demos', (c) => {
    const { status, site, search } = c.req.query();
    let sql = 'SELECT * FROM hypercare_demos WHERE 1=1';
    const params: any[] = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (site)   { sql += ' AND site = ?';   params.push(site); }
    if (search) { sql += ' AND title LIKE ?'; params.push(`%${search}%`); }
    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(...params);
    return c.json({ success: true, data: rows.map(mapDemo), total: rows.length });
  });

  app.get('/api/hypercare/demos/:id', (c) => {
    const id = Number(c.req.param('id'));
    const row = db.prepare('SELECT * FROM hypercare_demos WHERE id = ?').get(id);
    if (!row) return c.json({ success: false, error: 'Demo not found' }, 404);
    return c.json({ success: true, data: mapDemo(row) });
  });

  app.post('/api/hypercare/demos', async (c) => {
    const body = await c.req.json();
    const parsed = DemoCreateSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }, 400);
    const d = parsed.data;
    const ts = nowMs();
    const result = db.prepare(`
      INSERT INTO hypercare_demos (title,duration,audience,scheduled,site,attendees,status,type,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(d.title, d.duration, d.audience, d.scheduled, d.site, d.attendees, d.status, d.type, ts, ts);
    const row = db.prepare('SELECT * FROM hypercare_demos WHERE id = ?').get(result.lastInsertRowid);
    return c.json({ success: true, data: mapDemo(row) }, 201);
  });

  app.put('/api/hypercare/demos/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const existing = db.prepare('SELECT id FROM hypercare_demos WHERE id = ?').get(id);
    if (!existing) return c.json({ success: false, error: 'Demo not found' }, 404);
    const body = await c.req.json();
    const parsed = DemoUpdateSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }, 400);
    const d = parsed.data;
    const sets: string[] = [];
    const params: any[] = [];
    if (d.title     !== undefined) { sets.push('title = ?');     params.push(d.title); }
    if (d.duration  !== undefined) { sets.push('duration = ?');  params.push(d.duration); }
    if (d.audience  !== undefined) { sets.push('audience = ?');  params.push(d.audience); }
    if (d.scheduled !== undefined) { sets.push('scheduled = ?'); params.push(d.scheduled); }
    if (d.site      !== undefined) { sets.push('site = ?');      params.push(d.site); }
    if (d.attendees !== undefined) { sets.push('attendees = ?'); params.push(d.attendees); }
    if (d.status    !== undefined) { sets.push('status = ?');    params.push(d.status); }
    if (d.type      !== undefined) { sets.push('type = ?');      params.push(d.type); }
    sets.push('updated_at = ?'); params.push(nowMs()); params.push(id);
    db.prepare(`UPDATE hypercare_demos SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    const row = db.prepare('SELECT * FROM hypercare_demos WHERE id = ?').get(id);
    return c.json({ success: true, data: mapDemo(row) });
  });

  app.delete('/api/hypercare/demos/:id', (c) => {
    const id = Number(c.req.param('id'));
    const existing = db.prepare('SELECT id FROM hypercare_demos WHERE id = ?').get(id);
    if (!existing) return c.json({ success: false, error: 'Demo not found' }, 404);
    db.prepare('DELETE FROM hypercare_demos WHERE id = ?').run(id);
    return c.json({ success: true, message: 'Demo deleted' });
  });

  // ── Safety Champions ───────────────────────────────────────────────────────
  app.get('/api/hypercare/champions', (c) => {
    const { site, search } = c.req.query();
    let sql = 'SELECT * FROM hypercare_champions WHERE 1=1';
    const params: any[] = [];
    if (site)   { sql += ' AND site = ?';   params.push(site); }
    if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }
    sql += ' ORDER BY rating DESC';
    const rows = db.prepare(sql).all(...params);
    return c.json({ success: true, data: rows.map(mapChampion), total: rows.length });
  });

  app.get('/api/hypercare/champions/:id', (c) => {
    const id = Number(c.req.param('id'));
    const row = db.prepare('SELECT * FROM hypercare_champions WHERE id = ?').get(id);
    if (!row) return c.json({ success: false, error: 'Champion not found' }, 404);
    return c.json({ success: true, data: mapChampion(row) });
  });

  app.post('/api/hypercare/champions', async (c) => {
    const body = await c.req.json();
    const parsed = ChampionCreateSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }, 400);
    const d = parsed.data;
    const ts = nowMs();
    const result = db.prepare(`
      INSERT INTO hypercare_champions (name,site,role,trained,peers_helped,rating,specialties,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(d.name, d.site, d.role, d.trained, d.peersHelped, d.rating, JSON.stringify(d.specialties), ts, ts);
    const row = db.prepare('SELECT * FROM hypercare_champions WHERE id = ?').get(result.lastInsertRowid);
    return c.json({ success: true, data: mapChampion(row) }, 201);
  });

  app.put('/api/hypercare/champions/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const existing = db.prepare('SELECT id FROM hypercare_champions WHERE id = ?').get(id);
    if (!existing) return c.json({ success: false, error: 'Champion not found' }, 404);
    const body = await c.req.json();
    const parsed = ChampionUpdateSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }, 400);
    const d = parsed.data;
    const sets: string[] = [];
    const params: any[] = [];
    if (d.name        !== undefined) { sets.push('name = ?');         params.push(d.name); }
    if (d.site        !== undefined) { sets.push('site = ?');         params.push(d.site); }
    if (d.role        !== undefined) { sets.push('role = ?');         params.push(d.role); }
    if (d.trained     !== undefined) { sets.push('trained = ?');      params.push(d.trained); }
    if (d.peersHelped !== undefined) { sets.push('peers_helped = ?'); params.push(d.peersHelped); }
    if (d.rating      !== undefined) { sets.push('rating = ?');       params.push(d.rating); }
    if (d.specialties !== undefined) { sets.push('specialties = ?');  params.push(JSON.stringify(d.specialties)); }
    sets.push('updated_at = ?'); params.push(nowMs()); params.push(id);
    db.prepare(`UPDATE hypercare_champions SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    const row = db.prepare('SELECT * FROM hypercare_champions WHERE id = ?').get(id);
    return c.json({ success: true, data: mapChampion(row) });
  });

  app.delete('/api/hypercare/champions/:id', (c) => {
    const id = Number(c.req.param('id'));
    const existing = db.prepare('SELECT id FROM hypercare_champions WHERE id = ?').get(id);
    if (!existing) return c.json({ success: false, error: 'Champion not found' }, 404);
    db.prepare('DELETE FROM hypercare_champions WHERE id = ?').run(id);
    return c.json({ success: true, message: 'Champion deleted' });
  });

  // ── QR Code Deployments ────────────────────────────────────────────────────
  app.get('/api/hypercare/qr', (c) => {
    const { status, search } = c.req.query();
    let sql = 'SELECT * FROM hypercare_qr_deployments WHERE 1=1';
    const params: any[] = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (search) { sql += ' AND (location LIKE ? OR form LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY scans DESC';
    const rows = db.prepare(sql).all(...params);
    return c.json({ success: true, data: rows.map(mapQr), total: rows.length });
  });

  app.get('/api/hypercare/qr/:id', (c) => {
    const id = Number(c.req.param('id'));
    const row = db.prepare('SELECT * FROM hypercare_qr_deployments WHERE id = ?').get(id);
    if (!row) return c.json({ success: false, error: 'QR deployment not found' }, 404);
    return c.json({ success: true, data: mapQr(row) });
  });

  app.post('/api/hypercare/qr', async (c) => {
    const body = await c.req.json();
    const parsed = QrCreateSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }, 400);
    const d = parsed.data;
    const ts = nowMs();
    const result = db.prepare(`
      INSERT INTO hypercare_qr_deployments (location,form,scans,last_scan,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?)
    `).run(d.location, d.form, d.scans, d.lastScan, d.status, ts, ts);
    const row = db.prepare('SELECT * FROM hypercare_qr_deployments WHERE id = ?').get(result.lastInsertRowid);
    return c.json({ success: true, data: mapQr(row) }, 201);
  });

  app.put('/api/hypercare/qr/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const existing = db.prepare('SELECT id FROM hypercare_qr_deployments WHERE id = ?').get(id);
    if (!existing) return c.json({ success: false, error: 'QR deployment not found' }, 404);
    const body = await c.req.json();
    const parsed = QrUpdateSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }, 400);
    const d = parsed.data;
    const sets: string[] = [];
    const params: any[] = [];
    if (d.location !== undefined) { sets.push('location = ?');  params.push(d.location); }
    if (d.form     !== undefined) { sets.push('form = ?');      params.push(d.form); }
    if (d.scans    !== undefined) { sets.push('scans = ?');     params.push(d.scans); }
    if (d.lastScan !== undefined) { sets.push('last_scan = ?'); params.push(d.lastScan); }
    if (d.status   !== undefined) { sets.push('status = ?');    params.push(d.status); }
    sets.push('updated_at = ?'); params.push(nowMs()); params.push(id);
    db.prepare(`UPDATE hypercare_qr_deployments SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    const row = db.prepare('SELECT * FROM hypercare_qr_deployments WHERE id = ?').get(id);
    return c.json({ success: true, data: mapQr(row) });
  });

  app.delete('/api/hypercare/qr/:id', (c) => {
    const id = Number(c.req.param('id'));
    const existing = db.prepare('SELECT id FROM hypercare_qr_deployments WHERE id = ?').get(id);
    if (!existing) return c.json({ success: false, error: 'QR deployment not found' }, 404);
    db.prepare('DELETE FROM hypercare_qr_deployments WHERE id = ?').run(id);
    return c.json({ success: true, message: 'QR deployment deleted' });
  });

  // ── QR Scan Increment ──────────────────────────────────────────────────────
  app.post('/api/hypercare/qr/:id/scan', (c) => {
    const id = Number(c.req.param('id'));
    const existing = db.prepare('SELECT id FROM hypercare_qr_deployments WHERE id = ?').get(id);
    if (!existing) return c.json({ success: false, error: 'QR deployment not found' }, 404);
    db.prepare(`
      UPDATE hypercare_qr_deployments SET scans = scans + 1, last_scan = 'just now', updated_at = ? WHERE id = ?
    `).run(nowMs(), id);
    const row = db.prepare('SELECT * FROM hypercare_qr_deployments WHERE id = ?').get(id);
    return c.json({ success: true, data: mapQr(row) });
  });
}
