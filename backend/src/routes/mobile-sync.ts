/**
 * Mobile Offline Sync Routes
 *
 * Manages the offline sync queue, conflict registry, and sync test run results.
 * All routes require a valid JWT.
 *
 * Routes:
 *   GET    /api/sync/queue              — list queue records for calling user
 *   POST   /api/sync/queue              — add a record to the sync queue
 *   PUT    /api/sync/queue/:id          — update a queue record (mark synced, conflicted, etc.)
 *   DELETE /api/sync/queue/:id          — remove a queue record
 *   POST   /api/sync/queue/reset        — reset queue to initial seed for calling user
 *
 *   GET    /api/sync/conflicts          — list conflict records for calling user
 *   POST   /api/sync/conflicts          — create a conflict record
 *   PUT    /api/sync/conflicts/:id      — resolve a conflict
 *   DELETE /api/sync/conflicts/:id      — remove a conflict record
 *
 *   GET    /api/sync/test-results       — list test run results for calling user
 *   POST   /api/sync/test-results       — save a full test suite run
 *   PUT    /api/sync/test-results/:id   — update individual test result status
 *
 *   GET    /api/sync/stats              — aggregated sync statistics for calling user
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

// ── Schema ────────────────────────────────────────────────────────────────────

function ensureSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id           TEXT    NOT NULL,
      user_id      INTEGER NOT NULL,
      entity       TEXT    NOT NULL,
      action       TEXT    NOT NULL DEFAULT 'create',
      timestamp    TEXT    NOT NULL,
      data         TEXT    NOT NULL DEFAULT '{}',
      synced       INTEGER NOT NULL DEFAULT 0,
      conflicted   INTEGER NOT NULL DEFAULT 0,
      version      INTEGER NOT NULL DEFAULT 1,
      created_at   INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      updated_at   INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      PRIMARY KEY (id, user_id)
    );

    CREATE TABLE IF NOT EXISTS sync_conflicts (
      id              TEXT    NOT NULL,
      user_id         INTEGER NOT NULL,
      title           TEXT    NOT NULL,
      description     TEXT    NOT NULL DEFAULT '',
      local_version   TEXT    NOT NULL DEFAULT '{}',
      server_version  TEXT    NOT NULL DEFAULT '{}',
      resolution      TEXT    NOT NULL DEFAULT 'pending',
      resolved        INTEGER NOT NULL DEFAULT 0,
      created_at      INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      updated_at      INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      PRIMARY KEY (id, user_id)
    );

    CREATE TABLE IF NOT EXISTS sync_test_runs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      results     TEXT    NOT NULL DEFAULT '[]',
      passed      INTEGER NOT NULL DEFAULT 0,
      failed      INTEGER NOT NULL DEFAULT 0,
      total       INTEGER NOT NULL DEFAULT 0,
      created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
  `);
}

let _initialized = false;
function initOnce() {
  if (_initialized) return;
  _initialized = true;
  const db = getDb();
  try { ensureSchema(db); } finally { db.close(); }
}

// ── Auth helper ───────────────────────────────────────────────────────────────

async function extractUserId(authHeader: string | undefined): Promise<number | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const payload: any = await verify(authHeader.slice(7), JWT_SECRET);
    return typeof payload?.userId === 'number' ? payload.userId : null;
  } catch {
    return null;
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

const QueueRecordSchema = z.object({
  id:         z.string().min(1),
  entity:     z.string().min(1),
  action:     z.enum(['create', 'update', 'delete']),
  timestamp:  z.string().min(1),
  data:       z.record(z.string(), z.any()).optional().default({}),
  synced:     z.boolean().optional().default(false),
  conflicted: z.boolean().optional().default(false),
  version:    z.number().int().min(1).optional().default(1),
});

const QueueUpdateSchema = z.object({
  synced:     z.boolean().optional(),
  conflicted: z.boolean().optional(),
  version:    z.number().int().min(1).optional(),
  data:       z.record(z.string(), z.any()).optional(),
});

const ConflictSchema = z.object({
  id:            z.string().min(1),
  title:         z.string().min(1),
  description:   z.string().optional().default(''),
  localVersion:  z.record(z.string(), z.any()),
  serverVersion: z.record(z.string(), z.any()),
  resolution:    z.enum(['local', 'server', 'merged', 'pending']).optional().default('pending'),
  resolved:      z.boolean().optional().default(false),
});

const ConflictResolveSchema = z.object({
  resolution: z.enum(['local', 'server', 'merged']),
});

const TestResultItemSchema = z.object({
  id:          z.string(),
  name:        z.string(),
  description: z.string().optional().default(''),
  status:      z.enum(['pending', 'running', 'passed', 'failed', 'skipped']),
  duration:    z.number().optional(),
  error:       z.string().optional().nullable(),
  category:    z.enum(['queue', 'conflict', 'network', 'integrity', 'performance']),
});

const TestRunSchema = z.object({
  results: z.array(TestResultItemSchema).min(1),
});

// ── Route helpers ─────────────────────────────────────────────────────────────

function parseBool(v: any): boolean { return v === 1 || v === true || v === 'true'; }
function parseJSON(s: string): any {
  try { return JSON.parse(s); } catch { return {}; }
}

// ── Route Registration ────────────────────────────────────────────────────────

export function mobileSyncRoutes(app: Hono) {
  initOnce();

  /* ===================================================================
     SYNC QUEUE
     =================================================================== */

  // GET /api/sync/queue
  app.get('/api/sync/queue', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const db = getDb();
    try {
      ensureSchema(db);
      const rows = db.prepare(
        'SELECT * FROM sync_queue WHERE user_id = ? ORDER BY created_at ASC'
      ).all(userId) as any[];

      return c.json({
        success: true,
        data: rows.map(r => ({
          id:         r.id,
          entity:     r.entity,
          action:     r.action,
          timestamp:  r.timestamp,
          data:       parseJSON(r.data),
          synced:     parseBool(r.synced),
          conflicted: parseBool(r.conflicted),
          version:    r.version,
        })),
      });
    } finally { db.close(); }
  });

  // POST /api/sync/queue
  app.post('/api/sync/queue', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    let raw: unknown;
    try { raw = await c.req.json(); }
    catch { return c.json({ success: false, error: 'Invalid JSON body' }, 400); }

    const parsed = QueueRecordSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }

    const d = parsed.data;
    const db = getDb();
    try {
      ensureSchema(db);
      // Upsert: if record with same id+user_id exists, update it
      db.prepare(`
        INSERT INTO sync_queue (id, user_id, entity, action, timestamp, data, synced, conflicted, version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id, user_id) DO UPDATE SET
          entity     = excluded.entity,
          action     = excluded.action,
          timestamp  = excluded.timestamp,
          data       = excluded.data,
          synced     = excluded.synced,
          conflicted = excluded.conflicted,
          version    = excluded.version,
          updated_at = excluded.updated_at
      `).run(
        d.id, userId, d.entity, d.action, d.timestamp,
        JSON.stringify(d.data), d.synced ? 1 : 0, d.conflicted ? 1 : 0, d.version,
        nowSec(), nowSec(),
      );

      return c.json({ success: true, data: { ...d, userId } }, 201);
    } finally { db.close(); }
  });

  // PUT /api/sync/queue/:id
  app.put('/api/sync/queue/:id', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const recordId = c.req.param('id');

    let raw: unknown;
    try { raw = await c.req.json(); }
    catch { return c.json({ success: false, error: 'Invalid JSON body' }, 400); }

    const parsed = QueueUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }

    const db = getDb();
    try {
      ensureSchema(db);
      const existing = db.prepare(
        'SELECT * FROM sync_queue WHERE id = ? AND user_id = ?'
      ).get(recordId, userId) as any;
      if (!existing) return c.json({ success: false, error: 'Record not found' }, 404);

      const upd = parsed.data;
      db.prepare(`
        UPDATE sync_queue SET
          synced     = COALESCE(?, synced),
          conflicted = COALESCE(?, conflicted),
          version    = COALESCE(?, version),
          data       = COALESCE(?, data),
          updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(
        upd.synced !== undefined ? (upd.synced ? 1 : 0) : null,
        upd.conflicted !== undefined ? (upd.conflicted ? 1 : 0) : null,
        upd.version ?? null,
        upd.data !== undefined ? JSON.stringify(upd.data) : null,
        nowSec(),
        recordId, userId,
      );

      const updated = db.prepare(
        'SELECT * FROM sync_queue WHERE id = ? AND user_id = ?'
      ).get(recordId, userId) as any;

      return c.json({
        success: true,
        data: {
          id:         updated.id,
          entity:     updated.entity,
          action:     updated.action,
          timestamp:  updated.timestamp,
          data:       parseJSON(updated.data),
          synced:     parseBool(updated.synced),
          conflicted: parseBool(updated.conflicted),
          version:    updated.version,
        },
      });
    } finally { db.close(); }
  });

  // DELETE /api/sync/queue/:id
  app.delete('/api/sync/queue/:id', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const recordId = c.req.param('id');
    const db = getDb();
    try {
      ensureSchema(db);
      const result = db.prepare(
        'DELETE FROM sync_queue WHERE id = ? AND user_id = ?'
      ).run(recordId, userId);

      if (result.changes === 0) return c.json({ success: false, error: 'Record not found' }, 404);
      return c.json({ success: true, message: 'Record deleted' });
    } finally { db.close(); }
  });

  // POST /api/sync/queue/reset  — clear and re-seed default queue for user
  app.post('/api/sync/queue/reset', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const db = getDb();
    try {
      ensureSchema(db);
      db.prepare('DELETE FROM sync_queue WHERE user_id = ?').run(userId);

      const seedRecords = [
        { id: 'sq-1', entity: 'Incident Report',     action: 'create', timestamp: '2026-02-21 01:20:00', data: { title: 'Slip hazard in warehouse B', severity: 'medium', location: 'Building B' }, synced: false, conflicted: false, version: 1 },
        { id: 'sq-2', entity: 'Safety Inspection',   action: 'update', timestamp: '2026-02-21 01:18:00', data: { inspectionId: 'INS-042', status: 'completed', score: 92 }, synced: false, conflicted: false, version: 3 },
        { id: 'sq-3', entity: 'Training Record',     action: 'update', timestamp: '2026-02-21 01:15:00', data: { courseId: 'PPE-101', completion: 100, passed: true }, synced: false, conflicted: false, version: 2 },
        { id: 'sq-4', entity: 'Hazard Assessment',   action: 'create', timestamp: '2026-02-21 01:10:00', data: { hazard: 'Chemical spill risk', riskLevel: 'high', area: 'Lab A' }, synced: false, conflicted: false, version: 1 },
        { id: 'sq-5', entity: 'Near Miss Report',    action: 'create', timestamp: '2026-02-21 01:05:00', data: { description: 'Forklift near-collision', category: 'vehicle', severity: 'low' }, synced: false, conflicted: false, version: 1 },
        { id: 'sq-6', entity: 'CAPA Action',         action: 'update', timestamp: '2026-02-21 01:00:00', data: { capaId: 'CA-2026-007', status: 'in_progress', progress: 65 }, synced: true,  conflicted: false, version: 4 },
        { id: 'sq-7', entity: 'Audit Finding',       action: 'update', timestamp: '2026-02-20 23:45:00', data: { findingId: 'AF-089', severity: 'critical', assigned: 'J. Martinez' }, synced: true,  conflicted: false, version: 2 },
      ];

      const stmt = db.prepare(`
        INSERT INTO sync_queue (id, user_id, entity, action, timestamp, data, synced, conflicted, version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const ts = nowSec();
      for (const r of seedRecords) {
        stmt.run(r.id, userId, r.entity, r.action, r.timestamp, JSON.stringify(r.data), r.synced ? 1 : 0, r.conflicted ? 1 : 0, r.version, ts, ts);
      }

      return c.json({ success: true, message: 'Queue reset to defaults', count: seedRecords.length });
    } finally { db.close(); }
  });

  /* ===================================================================
     SYNC CONFLICTS
     =================================================================== */

  // GET /api/sync/conflicts
  app.get('/api/sync/conflicts', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const db = getDb();
    try {
      ensureSchema(db);
      const rows = db.prepare(
        'SELECT * FROM sync_conflicts WHERE user_id = ? ORDER BY created_at ASC'
      ).all(userId) as any[];

      return c.json({
        success: true,
        data: rows.map(r => ({
          id:            r.id,
          title:         r.title,
          description:   r.description,
          localVersion:  parseJSON(r.local_version),
          serverVersion: parseJSON(r.server_version),
          resolution:    r.resolution,
          resolved:      parseBool(r.resolved),
        })),
      });
    } finally { db.close(); }
  });

  // POST /api/sync/conflicts
  app.post('/api/sync/conflicts', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    let raw: unknown;
    try { raw = await c.req.json(); }
    catch { return c.json({ success: false, error: 'Invalid JSON body' }, 400); }

    const parsed = ConflictSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }

    const d = parsed.data;
    const db = getDb();
    try {
      ensureSchema(db);
      const ts = nowSec();
      db.prepare(`
        INSERT INTO sync_conflicts (id, user_id, title, description, local_version, server_version, resolution, resolved, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id, user_id) DO UPDATE SET
          title          = excluded.title,
          description    = excluded.description,
          local_version  = excluded.local_version,
          server_version = excluded.server_version,
          resolution     = excluded.resolution,
          resolved       = excluded.resolved,
          updated_at     = excluded.updated_at
      `).run(
        d.id, userId, d.title, d.description,
        JSON.stringify(d.localVersion), JSON.stringify(d.serverVersion),
        d.resolution, d.resolved ? 1 : 0, ts, ts,
      );

      return c.json({ success: true, data: { ...d } }, 201);
    } finally { db.close(); }
  });

  // PUT /api/sync/conflicts/:id  — resolve conflict
  app.put('/api/sync/conflicts/:id', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const conflictId = c.req.param('id');

    let raw: unknown;
    try { raw = await c.req.json(); }
    catch { return c.json({ success: false, error: 'Invalid JSON body' }, 400); }

    const parsed = ConflictResolveSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }

    const db = getDb();
    try {
      ensureSchema(db);
      const existing = db.prepare(
        'SELECT * FROM sync_conflicts WHERE id = ? AND user_id = ?'
      ).get(conflictId, userId) as any;
      if (!existing) return c.json({ success: false, error: 'Conflict not found' }, 404);

      db.prepare(`
        UPDATE sync_conflicts SET resolution = ?, resolved = 1, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(parsed.data.resolution, nowSec(), conflictId, userId);

      const updated = db.prepare(
        'SELECT * FROM sync_conflicts WHERE id = ? AND user_id = ?'
      ).get(conflictId, userId) as any;

      return c.json({
        success: true,
        data: {
          id:            updated.id,
          title:         updated.title,
          description:   updated.description,
          localVersion:  parseJSON(updated.local_version),
          serverVersion: parseJSON(updated.server_version),
          resolution:    updated.resolution,
          resolved:      parseBool(updated.resolved),
        },
      });
    } finally { db.close(); }
  });

  // DELETE /api/sync/conflicts/:id
  app.delete('/api/sync/conflicts/:id', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const conflictId = c.req.param('id');
    const db = getDb();
    try {
      ensureSchema(db);
      const result = db.prepare(
        'DELETE FROM sync_conflicts WHERE id = ? AND user_id = ?'
      ).run(conflictId, userId);

      if (result.changes === 0) return c.json({ success: false, error: 'Conflict not found' }, 404);
      return c.json({ success: true, message: 'Conflict deleted' });
    } finally { db.close(); }
  });

  /* ===================================================================
     SYNC TEST RUNS
     =================================================================== */

  // GET /api/sync/test-results  — returns latest run
  app.get('/api/sync/test-results', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const db = getDb();
    try {
      ensureSchema(db);
      const row = db.prepare(
        'SELECT * FROM sync_test_runs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
      ).get(userId) as any;

      if (!row) {
        return c.json({ success: true, data: null });
      }

      return c.json({
        success: true,
        data: {
          id:        row.id,
          results:   parseJSON(row.results),
          passed:    row.passed,
          failed:    row.failed,
          total:     row.total,
          createdAt: row.created_at,
        },
      });
    } finally { db.close(); }
  });

  // POST /api/sync/test-results  — save a full run
  app.post('/api/sync/test-results', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    let raw: unknown;
    try { raw = await c.req.json(); }
    catch { return c.json({ success: false, error: 'Invalid JSON body' }, 400); }

    const parsed = TestRunSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }

    const results = parsed.data.results;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const total  = results.length;

    const db = getDb();
    try {
      ensureSchema(db);
      const res = db.prepare(`
        INSERT INTO sync_test_runs (user_id, results, passed, failed, total, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, JSON.stringify(results), passed, failed, total, nowSec());

      return c.json({ success: true, data: { id: res.lastInsertRowid, passed, failed, total } }, 201);
    } finally { db.close(); }
  });

  // PUT /api/sync/test-results/:id  — update individual test status in latest run
  app.put('/api/sync/test-results/:id', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const runId = parseInt(c.req.param('id'), 10);
    if (isNaN(runId)) return c.json({ success: false, error: 'Invalid run id' }, 400);

    let raw: unknown;
    try { raw = await c.req.json(); }
    catch { return c.json({ success: false, error: 'Invalid JSON body' }, 400); }

    const UpdateSchema = z.object({
      testId:   z.string(),
      status:   z.enum(['pending', 'running', 'passed', 'failed', 'skipped']),
      duration: z.number().optional(),
      error:    z.string().nullable().optional(),
    });

    const parsed = UpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }

    const db = getDb();
    try {
      ensureSchema(db);
      const row = db.prepare(
        'SELECT * FROM sync_test_runs WHERE id = ? AND user_id = ?'
      ).get(runId, userId) as any;
      if (!row) return c.json({ success: false, error: 'Test run not found' }, 404);

      const results: any[] = parseJSON(row.results);
      const idx = results.findIndex(r => r.id === parsed.data.testId);
      if (idx === -1) return c.json({ success: false, error: 'Test not found in run' }, 404);

      results[idx] = {
        ...results[idx],
        status:   parsed.data.status,
        duration: parsed.data.duration ?? results[idx].duration,
        error:    parsed.data.error !== undefined ? parsed.data.error : results[idx].error,
      };

      const passed = results.filter(r => r.status === 'passed').length;
      const failed = results.filter(r => r.status === 'failed').length;

      db.prepare(`
        UPDATE sync_test_runs SET results = ?, passed = ?, failed = ? WHERE id = ? AND user_id = ?
      `).run(JSON.stringify(results), passed, failed, runId, userId);

      return c.json({ success: true, data: { id: runId, passed, failed, total: results.length, results } });
    } finally { db.close(); }
  });

  /* ===================================================================
     STATS
     =================================================================== */

  // GET /api/sync/stats
  app.get('/api/sync/stats', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) return c.json({ success: false, error: 'Authorization required' }, 401);

    const db = getDb();
    try {
      ensureSchema(db);
      const total    = (db.prepare('SELECT COUNT(*) as n FROM sync_queue WHERE user_id = ?').get(userId) as any).n;
      const pending  = (db.prepare('SELECT COUNT(*) as n FROM sync_queue WHERE user_id = ? AND synced = 0').get(userId) as any).n;
      const synced   = (db.prepare('SELECT COUNT(*) as n FROM sync_queue WHERE user_id = ? AND synced = 1').get(userId) as any).n;
      const conflicts = (db.prepare('SELECT COUNT(*) as n FROM sync_conflicts WHERE user_id = ? AND resolved = 0').get(userId) as any).n;

      const latestRun = db.prepare(
        'SELECT passed, failed, total FROM sync_test_runs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
      ).get(userId) as any;

      return c.json({
        success: true,
        data: {
          queue:   { total, pending, synced },
          conflicts: { unresolved: conflicts },
          tests:   latestRun
            ? { passed: latestRun.passed, failed: latestRun.failed, total: latestRun.total }
            : { passed: 0, failed: 0, total: 0 },
        },
      });
    } finally { db.close(); }
  });
}
