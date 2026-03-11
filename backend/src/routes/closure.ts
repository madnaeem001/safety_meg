import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';

const sqlite = new Database('local.sqlite');
sqlite.pragma('journal_mode = WAL');

const logger = {
  info: (msg: string, meta?: object) => console.log(`[CLOSURE] ${msg}`, meta ?? ''),
  error: (msg: string, meta?: object) => console.error(`[CLOSURE ERROR] ${msg}`, meta ?? ''),
};

// ── AUTO-MIGRATE ──────────────────────────────────────────────────────────────

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS project_closures (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    name                 TEXT    NOT NULL,
    project_id           TEXT,
    status               TEXT    NOT NULL DEFAULT 'In Progress'
                           CHECK(status IN ('In Progress','Archived')),
    archived_at          INTEGER,
    report_generated_at  INTEGER,
    created_at           INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at           INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS closure_deliverables (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    closure_id  INTEGER NOT NULL REFERENCES project_closures(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'Pending'
                  CHECK(status IN ('Accepted','Pending','Rejected')),
    approver    TEXT    NOT NULL DEFAULT '',
    date        TEXT    NOT NULL DEFAULT '-',
    created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS closure_lessons (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    closure_id     INTEGER NOT NULL REFERENCES project_closures(id) ON DELETE CASCADE,
    category       TEXT    NOT NULL CHECK(category IN ('Process','Technology','People','Product')),
    description    TEXT    NOT NULL,
    impact         TEXT    NOT NULL CHECK(impact IN ('Positive','Negative')),
    recommendation TEXT    NOT NULL,
    created_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
`);

// Seed default data on first run
const closureCount = (sqlite.prepare('SELECT COUNT(*) AS n FROM project_closures').get() as any).n;
if (closureCount === 0) {
  logger.info('Seeding default closure data');
  const r = sqlite
    .prepare(`INSERT INTO project_closures (name, project_id) VALUES (?, ?)`)
    .run('Safety Management System V2', 'SMS-V2');
  const cid = r.lastInsertRowid as number;

  const insertDel = sqlite.prepare(
    `INSERT INTO closure_deliverables (closure_id, name, status, approver, date) VALUES (?, ?, ?, ?, ?)`
  );
  insertDel.run(cid, 'Safety Management System V2 Codebase', 'Accepted', 'CTO', '2026-02-01');
  insertDel.run(cid, 'User Documentation & Manuals', 'Accepted', 'Product Owner', '2026-02-03');
  insertDel.run(cid, 'Training Materials', 'Pending', 'HR Director', '-');
  insertDel.run(cid, 'Final Security Audit Report', 'Accepted', 'CISO', '2026-01-28');

  const insertLesson = sqlite.prepare(
    `INSERT INTO closure_lessons (closure_id, category, description, impact, recommendation) VALUES (?, ?, ?, ?, ?)`
  );
  insertLesson.run(cid, 'Process', 'Daily standups were too long', 'Negative', 'Strict 15min timebox');
  insertLesson.run(cid, 'Technology', 'React Query significantly improved data fetching', 'Positive', 'Adopt as standard');
  insertLesson.run(cid, 'People', 'QA team involved too late in sprint', 'Negative', 'Shift left testing');
}

// ── MAPPERS ───────────────────────────────────────────────────────────────────

const mapClosure = (row: any) => ({
  id: row.id as number,
  name: row.name as string,
  projectId: row.project_id as string | null,
  status: row.status as 'In Progress' | 'Archived',
  archivedAt: row.archived_at as number | null,
  reportGeneratedAt: row.report_generated_at as number | null,
  createdAt: row.created_at as number,
  updatedAt: row.updated_at as number,
});

const mapDeliverable = (row: any) => ({
  id: row.id as number,
  closureId: row.closure_id as number,
  name: row.name as string,
  status: row.status as 'Accepted' | 'Pending' | 'Rejected',
  approver: row.approver as string,
  date: row.date as string,
  createdAt: row.created_at as number,
});

const mapLesson = (row: any) => ({
  id: row.id as number,
  closureId: row.closure_id as number,
  category: row.category as 'Process' | 'Technology' | 'People' | 'Product',
  description: row.description as string,
  impact: row.impact as 'Positive' | 'Negative',
  recommendation: row.recommendation as string,
  createdAt: row.created_at as number,
});

// ── VALIDATION SCHEMAS ────────────────────────────────────────────────────────

const AddDeliverableSchema = z.object({
  name: z.string().min(1).max(200),
  status: z.enum(['Accepted', 'Pending', 'Rejected']).default('Pending'),
  approver: z.string().min(1).max(100),
  date: z.string().max(20).optional().default('-'),
});

const UpdateDeliverableSchema = z.object({
  status: z.enum(['Accepted', 'Pending', 'Rejected']).optional(),
  approver: z.string().min(1).max(100).optional(),
  date: z.string().max(20).optional(),
});

const AddLessonSchema = z.object({
  category: z.enum(['Process', 'Technology', 'People', 'Product']),
  description: z.string().min(1).max(500),
  impact: z.enum(['Positive', 'Negative']),
  recommendation: z.string().min(1).max(500),
});

// ── ROUTES ────────────────────────────────────────────────────────────────────

export const closureRoutes = (app: Hono) => {
  // GET /api/closures
  app.get('/api/closures', (c) => {
    try {
      const rows = sqlite.prepare('SELECT * FROM project_closures ORDER BY created_at DESC').all();
      return c.json(rows.map(mapClosure));
    } catch (err) {
      logger.error('getAll failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // GET /api/closures/:id
  app.get('/api/closures/:id', (c) => {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

      const closure = sqlite.prepare('SELECT * FROM project_closures WHERE id = ?').get(id);
      if (!closure) return c.json({ error: 'Not found' }, 404);

      const deliverables = sqlite
        .prepare('SELECT * FROM closure_deliverables WHERE closure_id = ? ORDER BY created_at')
        .all(id);
      const lessons = sqlite
        .prepare('SELECT * FROM closure_lessons WHERE closure_id = ? ORDER BY created_at')
        .all(id);

      return c.json({
        ...mapClosure(closure),
        deliverables: deliverables.map(mapDeliverable),
        lessons: lessons.map(mapLesson),
      });
    } catch (err) {
      logger.error('getById failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // POST /api/closures/:id/deliverables
  app.post('/api/closures/:id/deliverables', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

      const closure = sqlite.prepare('SELECT id FROM project_closures WHERE id = ?').get(id);
      if (!closure) return c.json({ error: 'Not found' }, 404);

      const body = await c.req.json();
      const v = AddDeliverableSchema.parse(body);

      const r = sqlite
        .prepare(
          `INSERT INTO closure_deliverables (closure_id, name, status, approver, date)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(id, v.name, v.status, v.approver, v.date);

      sqlite
        .prepare('UPDATE project_closures SET updated_at = (unixepoch() * 1000) WHERE id = ?')
        .run(id);

      const row = sqlite.prepare('SELECT * FROM closure_deliverables WHERE id = ?').get(r.lastInsertRowid);
      logger.info(`Added deliverable ${r.lastInsertRowid} to closure ${id}`);
      return c.json(mapDeliverable(row), 201);
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ error: err.issues }, 422);
      logger.error('addDeliverable failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // PATCH /api/closures/:id/deliverables/:did
  app.patch('/api/closures/:id/deliverables/:did', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      const did = Number(c.req.param('did'));
      if (isNaN(id) || isNaN(did)) return c.json({ error: 'Invalid id' }, 400);

      const existing = sqlite
        .prepare('SELECT * FROM closure_deliverables WHERE id = ? AND closure_id = ?')
        .get(did, id) as any;
      if (!existing) return c.json({ error: 'Not found' }, 404);

      const body = await c.req.json();
      const v = UpdateDeliverableSchema.parse(body);

      sqlite
        .prepare(
          `UPDATE closure_deliverables
           SET status = ?, approver = ?, date = ?
           WHERE id = ?`
        )
        .run(
          v.status ?? existing.status,
          v.approver ?? existing.approver,
          v.date ?? existing.date,
          did
        );

      sqlite
        .prepare('UPDATE project_closures SET updated_at = (unixepoch() * 1000) WHERE id = ?')
        .run(id);

      const row = sqlite.prepare('SELECT * FROM closure_deliverables WHERE id = ?').get(did);
      return c.json(mapDeliverable(row));
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ error: err.issues }, 422);
      logger.error('updateDeliverable failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // DELETE /api/closures/:id/deliverables/:did
  app.delete('/api/closures/:id/deliverables/:did', (c) => {
    try {
      const id = Number(c.req.param('id'));
      const did = Number(c.req.param('did'));
      if (isNaN(id) || isNaN(did)) return c.json({ error: 'Invalid id' }, 400);

      const r = sqlite
        .prepare('DELETE FROM closure_deliverables WHERE id = ? AND closure_id = ?')
        .run(did, id);
      if (r.changes === 0) return c.json({ error: 'Not found' }, 404);

      logger.info(`Deleted deliverable ${did} from closure ${id}`);
      return c.json({ success: true });
    } catch (err) {
      logger.error('deleteDeliverable failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // POST /api/closures/:id/lessons
  app.post('/api/closures/:id/lessons', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

      const closure = sqlite.prepare('SELECT id FROM project_closures WHERE id = ?').get(id);
      if (!closure) return c.json({ error: 'Not found' }, 404);

      const body = await c.req.json();
      const v = AddLessonSchema.parse(body);

      const r = sqlite
        .prepare(
          `INSERT INTO closure_lessons (closure_id, category, description, impact, recommendation)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(id, v.category, v.description, v.impact, v.recommendation);

      sqlite
        .prepare('UPDATE project_closures SET updated_at = (unixepoch() * 1000) WHERE id = ?')
        .run(id);

      const row = sqlite.prepare('SELECT * FROM closure_lessons WHERE id = ?').get(r.lastInsertRowid);
      logger.info(`Added lesson ${r.lastInsertRowid} to closure ${id}`);
      return c.json(mapLesson(row), 201);
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ error: err.issues }, 422);
      logger.error('addLesson failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // DELETE /api/closures/:id/lessons/:lid
  app.delete('/api/closures/:id/lessons/:lid', (c) => {
    try {
      const id = Number(c.req.param('id'));
      const lid = Number(c.req.param('lid'));
      if (isNaN(id) || isNaN(lid)) return c.json({ error: 'Invalid id' }, 400);

      const r = sqlite
        .prepare('DELETE FROM closure_lessons WHERE id = ? AND closure_id = ?')
        .run(lid, id);
      if (r.changes === 0) return c.json({ error: 'Not found' }, 404);

      logger.info(`Deleted lesson ${lid} from closure ${id}`);
      return c.json({ success: true });
    } catch (err) {
      logger.error('deleteLesson failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // POST /api/closures/:id/archive
  app.post('/api/closures/:id/archive', (c) => {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

      const closure = sqlite.prepare('SELECT id FROM project_closures WHERE id = ?').get(id);
      if (!closure) return c.json({ error: 'Not found' }, 404);

      sqlite
        .prepare(
          `UPDATE project_closures
           SET status = 'Archived', archived_at = (unixepoch() * 1000), updated_at = (unixepoch() * 1000)
           WHERE id = ?`
        )
        .run(id);

      const row = sqlite.prepare('SELECT * FROM project_closures WHERE id = ?').get(id);
      logger.info(`Archived closure ${id}`);
      return c.json(mapClosure(row));
    } catch (err) {
      logger.error('archive failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // POST /api/closures/:id/report  — generate final closure report
  app.post('/api/closures/:id/report', (c) => {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

      const closure = sqlite.prepare('SELECT * FROM project_closures WHERE id = ?').get(id);
      if (!closure) return c.json({ error: 'Not found' }, 404);

      sqlite
        .prepare(
          `UPDATE project_closures
           SET report_generated_at = (unixepoch() * 1000), updated_at = (unixepoch() * 1000)
           WHERE id = ?`
        )
        .run(id);

      const deliverables = sqlite
        .prepare('SELECT * FROM closure_deliverables WHERE closure_id = ?')
        .all(id) as any[];
      const lessons = sqlite
        .prepare('SELECT * FROM closure_lessons WHERE closure_id = ?')
        .all(id) as any[];

      const accepted = deliverables.filter((d) => d.status === 'Accepted').length;
      const pending   = deliverables.filter((d) => d.status === 'Pending').length;
      const rejected  = deliverables.filter((d) => d.status === 'Rejected').length;
      const positiveLessons = lessons.filter((l) => l.impact === 'Positive').length;
      const negativeLessons = lessons.filter((l) => l.impact === 'Negative').length;

      const updatedClosure = sqlite
        .prepare('SELECT * FROM project_closures WHERE id = ?')
        .get(id);

      logger.info(`Generated report for closure ${id}`);
      return c.json({
        closure: mapClosure(updatedClosure),
        summary: {
          totalDeliverables: deliverables.length,
          accepted,
          pending,
          rejected,
          acceptanceRate: deliverables.length > 0
            ? Math.round((accepted / deliverables.length) * 100)
            : 0,
          totalLessons: lessons.length,
          positiveLessons,
          negativeLessons,
        },
        deliverables: deliverables.map(mapDeliverable),
        lessons: lessons.map(mapLesson),
        generatedAt: Date.now(),
      });
    } catch (err) {
      logger.error('generateReport failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });
};
