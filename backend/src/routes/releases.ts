import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const sqlite = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');
sqlite.pragma('journal_mode = WAL');

const logger = {
  info: (msg: string, meta?: object) => console.log(`[RELEASES] ${msg}`, meta ?? ''),
  error: (msg: string, meta?: object) => console.error(`[RELEASES ERROR] ${msg}`, meta ?? ''),
};

// ── AUTO-MIGRATE ──────────────────────────────────────────────────────────────

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS releases (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    version       TEXT    NOT NULL,
    name          TEXT    NOT NULL,
    description   TEXT    NOT NULL DEFAULT '',
    status        TEXT    NOT NULL DEFAULT 'planning'
                    CHECK(status IN ('planning','in_progress','released','archived')),
    release_date  TEXT    NOT NULL DEFAULT '',
    planned_date  TEXT    NOT NULL DEFAULT '',
    owner         TEXT    NOT NULL DEFAULT '',
    progress      INTEGER NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
    risk_level    TEXT    NOT NULL DEFAULT 'low'
                    CHECK(risk_level IN ('low','medium','high')),
    created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS release_epic_ids (
    release_id  INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    epic_id     TEXT    NOT NULL,
    PRIMARY KEY (release_id, epic_id)
  );

  CREATE TABLE IF NOT EXISTS release_features (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    release_id  INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    feature     TEXT    NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS release_dependencies (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    release_id  INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    dependency  TEXT    NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS release_changelog (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    release_id  INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    entry       TEXT    NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
`);

// ── SEED DEFAULT DATA ────────────────────────────────────────────────────────

const releaseCount = (sqlite.prepare('SELECT COUNT(*) AS n FROM releases').get() as any).n;
if (releaseCount === 0) {
  logger.info('Seeding default releases data');

  const insertRelease = sqlite.prepare(
    `INSERT INTO releases (version, name, description, status, release_date, planned_date, owner, progress, risk_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertFeature = sqlite.prepare(
    `INSERT INTO release_features (release_id, feature, sort_order) VALUES (?, ?, ?)`
  );
  const insertDep = sqlite.prepare(
    `INSERT INTO release_dependencies (release_id, dependency, sort_order) VALUES (?, ?, ?)`
  );
  const insertEpic = sqlite.prepare(
    `INSERT INTO release_epic_ids (release_id, epic_id) VALUES (?, ?)`
  );
  const insertChangelog = sqlite.prepare(
    `INSERT INTO release_changelog (release_id, entry, sort_order) VALUES (?, ?, ?)`
  );

  // v2.1.0
  const r1 = insertRelease.run(
    'v2.1.0', 'Safety Compliance Update',
    'Major update focusing on enhanced safety compliance features and EPA reporting improvements.',
    'in_progress', '', '2026-02-15', 'Sarah Johnson', 65, 'medium'
  );
  const id1 = r1.lastInsertRowid as number;
  ['Enhanced incident reporting workflow', 'Automated EPA report generation', 'Real-time compliance dashboard', 'Mobile offline audit support', 'QR code equipment scanning']
    .forEach((f, i) => insertFeature.run(id1, f, i));
  ['epic-1', 'epic-2'].forEach(e => insertEpic.run(id1, e));
  ['Database migration complete', 'API v2 deployed'].forEach((d, i) => insertDep.run(id1, d, i));

  // v2.2.0
  const r2 = insertRelease.run(
    'v2.2.0', 'Training & Analytics Release',
    'Comprehensive training management overhaul with advanced analytics and AI-driven insights.',
    'planning', '', '2026-03-15', 'Mike Davis', 15, 'low'
  );
  const id2 = r2.lastInsertRowid as number;
  ['AI-powered risk predictions', 'Interactive training modules', 'Certification tracking', 'Custom report builder', 'Integration with Power BI']
    .forEach((f, i) => insertFeature.run(id2, f, i));
  ['epic-3'].forEach(e => insertEpic.run(id2, e));
  ['v2.1.0 release', 'AI model training complete'].forEach((d, i) => insertDep.run(id2, d, i));

  // v2.0.0 (released)
  const r3 = insertRelease.run(
    'v2.0.0', 'Foundation Release',
    'Initial release with core EHS management capabilities.',
    'released', '2026-01-01', '2026-01-01', 'John Smith', 100, 'low'
  );
  const id3 = r3.lastInsertRowid as number;
  ['Incident reporting', 'Basic compliance tracking', 'User management', 'Document library', 'Email notifications']
    .forEach((f, i) => insertFeature.run(id3, f, i));
  ['Initial release of EHS management platform', 'Core incident reporting functionality', 'Basic user roles and permissions', 'Document upload and management']
    .forEach((e, i) => insertChangelog.run(id3, e, i));
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function assembleRelease(row: any): object {
  const features = sqlite
    .prepare('SELECT feature FROM release_features WHERE release_id = ? ORDER BY sort_order')
    .all(row.id) as any[];
  const dependencies = sqlite
    .prepare('SELECT dependency FROM release_dependencies WHERE release_id = ? ORDER BY sort_order')
    .all(row.id) as any[];
  const epicIds = sqlite
    .prepare('SELECT epic_id FROM release_epic_ids WHERE release_id = ?')
    .all(row.id) as any[];
  const changelog = sqlite
    .prepare('SELECT entry FROM release_changelog WHERE release_id = ? ORDER BY sort_order')
    .all(row.id) as any[];

  return {
    id: row.id as number,
    version: row.version as string,
    name: row.name as string,
    description: row.description as string,
    status: row.status as string,
    releaseDate: row.release_date as string,
    plannedDate: row.planned_date as string,
    owner: row.owner as string,
    progress: row.progress as number,
    riskLevel: row.risk_level as string,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
    features: features.map((f) => f.feature),
    dependencies: dependencies.map((d) => d.dependency),
    epicIds: epicIds.map((e) => e.epic_id),
    changelog: changelog.map((c) => c.entry),
  };
}

// ── VALIDATION ────────────────────────────────────────────────────────────────

const CreateReleaseSchema = z.object({
  version: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().default(''),
  plannedDate: z.string().max(20).optional().default(''),
  owner: z.string().max(100).optional().default(''),
  riskLevel: z.enum(['low', 'medium', 'high']).optional().default('low'),
});

const UpdateReleaseSchema = z.object({
  version: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  plannedDate: z.string().max(20).optional(),
  owner: z.string().max(100).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
});

const UpdateStatusSchema = z.object({
  status: z.enum(['planning', 'in_progress', 'released', 'archived']),
  releaseDate: z.string().max(20).optional(),
});

const AddFeatureSchema = z.object({
  feature: z.string().min(1).max(500),
});

const AddDependencySchema = z.object({
  dependency: z.string().min(1).max(500),
});

const AddChangelogEntrySchema = z.object({
  entry: z.string().min(1).max(1000),
});

const AddEpicSchema = z.object({
  epicId: z.string().min(1).max(50),
});

// ── ROUTES ────────────────────────────────────────────────────────────────────

export const releasesRoutes = (app: Hono) => {
  // GET /api/releases
  app.get('/api/releases', (c) => {
    try {
      const { status } = c.req.query() as { status?: string };
      const rows = status
        ? sqlite.prepare('SELECT * FROM releases WHERE status = ? ORDER BY created_at DESC').all(status)
        : sqlite.prepare('SELECT * FROM releases ORDER BY created_at DESC').all();
      return c.json(rows.map(assembleRelease));
    } catch (err) {
      logger.error('getAll failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // GET /api/releases/:id
  app.get('/api/releases/:id', (c) => {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

      const row = sqlite.prepare('SELECT * FROM releases WHERE id = ?').get(id);
      if (!row) return c.json({ error: 'Not found' }, 404);

      return c.json(assembleRelease(row));
    } catch (err) {
      logger.error('getById failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // POST /api/releases
  app.post('/api/releases', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateReleaseSchema.parse(body);

      const r = sqlite
        .prepare(
          `INSERT INTO releases (version, name, description, planned_date, owner, risk_level)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(v.version, v.name, v.description, v.plannedDate, v.owner, v.riskLevel);

      const row = sqlite.prepare('SELECT * FROM releases WHERE id = ?').get(r.lastInsertRowid);
      logger.info(`Created release ${r.lastInsertRowid} (${v.version})`);
      return c.json(assembleRelease(row), 201);
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ error: err.issues }, 422);
      logger.error('create failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // PATCH /api/releases/:id
  app.patch('/api/releases/:id', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

      const existing = sqlite.prepare('SELECT * FROM releases WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ error: 'Not found' }, 404);

      const body = await c.req.json();
      const v = UpdateReleaseSchema.parse(body);

      sqlite
        .prepare(
          `UPDATE releases
           SET version = ?, name = ?, description = ?, planned_date = ?,
               owner = ?, progress = ?, risk_level = ?,
               updated_at = (unixepoch() * 1000)
           WHERE id = ?`
        )
        .run(
          v.version ?? existing.version,
          v.name ?? existing.name,
          v.description ?? existing.description,
          v.plannedDate ?? existing.planned_date,
          v.owner ?? existing.owner,
          v.progress ?? existing.progress,
          v.riskLevel ?? existing.risk_level,
          id
        );

      const row = sqlite.prepare('SELECT * FROM releases WHERE id = ?').get(id);
      return c.json(assembleRelease(row));
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ error: err.issues }, 422);
      logger.error('update failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // PATCH /api/releases/:id/status
  app.patch('/api/releases/:id/status', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

      const existing = sqlite.prepare('SELECT * FROM releases WHERE id = ?').get(id);
      if (!existing) return c.json({ error: 'Not found' }, 404);

      const body = await c.req.json();
      const v = UpdateStatusSchema.parse(body);

      const releaseDate =
        v.status === 'released'
          ? (v.releaseDate ?? new Date().toISOString().split('T')[0])
          : (v.releaseDate ?? '');
      const progress = v.status === 'released' ? 100 : (existing as any).progress;

      sqlite
        .prepare(
          `UPDATE releases
           SET status = ?, release_date = ?, progress = ?, updated_at = (unixepoch() * 1000)
           WHERE id = ?`
        )
        .run(v.status, releaseDate, progress, id);

      const row = sqlite.prepare('SELECT * FROM releases WHERE id = ?').get(id);
      logger.info(`Updated release ${id} status → ${v.status}`);
      return c.json(assembleRelease(row));
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ error: err.issues }, 422);
      logger.error('updateStatus failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // DELETE /api/releases/:id
  app.delete('/api/releases/:id', (c) => {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

      const r = sqlite.prepare('DELETE FROM releases WHERE id = ?').run(id);
      if (r.changes === 0) return c.json({ error: 'Not found' }, 404);

      logger.info(`Deleted release ${id}`);
      return c.json({ success: true });
    } catch (err) {
      logger.error('delete failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // POST /api/releases/:id/features
  app.post('/api/releases/:id/features', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);
      if (!sqlite.prepare('SELECT id FROM releases WHERE id = ?').get(id)) return c.json({ error: 'Not found' }, 404);

      const body = await c.req.json();
      const v = AddFeatureSchema.parse(body);

      const maxOrder = (sqlite.prepare('SELECT MAX(sort_order) AS m FROM release_features WHERE release_id = ?').get(id) as any)?.m ?? -1;
      sqlite.prepare('INSERT INTO release_features (release_id, feature, sort_order) VALUES (?, ?, ?)').run(id, v.feature, maxOrder + 1);
      sqlite.prepare('UPDATE releases SET updated_at = (unixepoch() * 1000) WHERE id = ?').run(id);

      const row = sqlite.prepare('SELECT * FROM releases WHERE id = ?').get(id);
      return c.json(assembleRelease(row), 201);
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ error: err.issues }, 422);
      logger.error('addFeature failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // DELETE /api/releases/:id/features
  app.delete('/api/releases/:id/features', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

      const body = await c.req.json();
      const feature = body?.feature as string;
      if (!feature) return c.json({ error: 'feature required' }, 422);

      sqlite.prepare('DELETE FROM release_features WHERE release_id = ? AND feature = ?').run(id, feature);
      sqlite.prepare('UPDATE releases SET updated_at = (unixepoch() * 1000) WHERE id = ?').run(id);

      const row = sqlite.prepare('SELECT * FROM releases WHERE id = ?').get(id);
      if (!row) return c.json({ error: 'Not found' }, 404);
      return c.json(assembleRelease(row));
    } catch (err) {
      logger.error('deleteFeature failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // POST /api/releases/:id/dependencies
  app.post('/api/releases/:id/dependencies', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);
      if (!sqlite.prepare('SELECT id FROM releases WHERE id = ?').get(id)) return c.json({ error: 'Not found' }, 404);

      const body = await c.req.json();
      const v = AddDependencySchema.parse(body);

      const maxOrder = (sqlite.prepare('SELECT MAX(sort_order) AS m FROM release_dependencies WHERE release_id = ?').get(id) as any)?.m ?? -1;
      sqlite.prepare('INSERT INTO release_dependencies (release_id, dependency, sort_order) VALUES (?, ?, ?)').run(id, v.dependency, maxOrder + 1);
      sqlite.prepare('UPDATE releases SET updated_at = (unixepoch() * 1000) WHERE id = ?').run(id);

      const row = sqlite.prepare('SELECT * FROM releases WHERE id = ?').get(id);
      return c.json(assembleRelease(row), 201);
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ error: err.issues }, 422);
      logger.error('addDependency failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // POST /api/releases/:id/changelog
  app.post('/api/releases/:id/changelog', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);
      if (!sqlite.prepare('SELECT id FROM releases WHERE id = ?').get(id)) return c.json({ error: 'Not found' }, 404);

      const body = await c.req.json();
      const v = AddChangelogEntrySchema.parse(body);

      const maxOrder = (sqlite.prepare('SELECT MAX(sort_order) AS m FROM release_changelog WHERE release_id = ?').get(id) as any)?.m ?? -1;
      sqlite.prepare('INSERT INTO release_changelog (release_id, entry, sort_order) VALUES (?, ?, ?)').run(id, v.entry, maxOrder + 1);
      sqlite.prepare('UPDATE releases SET updated_at = (unixepoch() * 1000) WHERE id = ?').run(id);

      const row = sqlite.prepare('SELECT * FROM releases WHERE id = ?').get(id);
      return c.json(assembleRelease(row), 201);
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ error: err.issues }, 422);
      logger.error('addChangelog failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // POST /api/releases/:id/epics
  app.post('/api/releases/:id/epics', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);
      if (!sqlite.prepare('SELECT id FROM releases WHERE id = ?').get(id)) return c.json({ error: 'Not found' }, 404);

      const body = await c.req.json();
      const v = AddEpicSchema.parse(body);

      // Ignore duplicate (INSERT OR IGNORE)
      sqlite.prepare('INSERT OR IGNORE INTO release_epic_ids (release_id, epic_id) VALUES (?, ?)').run(id, v.epicId);
      sqlite.prepare('UPDATE releases SET updated_at = (unixepoch() * 1000) WHERE id = ?').run(id);

      const row = sqlite.prepare('SELECT * FROM releases WHERE id = ?').get(id);
      return c.json(assembleRelease(row));
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ error: err.issues }, 422);
      logger.error('addEpic failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // DELETE /api/releases/:id/epics/:epicId
  app.delete('/api/releases/:id/epics/:epicId', (c) => {
    try {
      const id = Number(c.req.param('id'));
      const epicId = c.req.param('epicId');
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

      sqlite.prepare('DELETE FROM release_epic_ids WHERE release_id = ? AND epic_id = ?').run(id, epicId);
      sqlite.prepare('UPDATE releases SET updated_at = (unixepoch() * 1000) WHERE id = ?').run(id);

      const row = sqlite.prepare('SELECT * FROM releases WHERE id = ?').get(id);
      if (!row) return c.json({ error: 'Not found' }, 404);
      return c.json(assembleRelease(row));
    } catch (err) {
      logger.error('removeEpic failed', { err });
      return c.json({ error: 'Internal server error' }, 500);
    }
  });
};
