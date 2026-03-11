import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const sqlite = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');
sqlite.pragma('journal_mode = WAL');

const logger = {
  info: (msg: string, meta?: object) => console.log(`[CHARTER] ${msg}`, meta ?? ''),
  error: (msg: string, meta?: object) => console.error(`[CHARTER ERROR] ${msg}`, meta ?? ''),
};

// ── AUTO-MIGRATE ──────────────────────────────────────────────────────────────

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS project_charters (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    vision        TEXT,
    mission       TEXT,
    budget        TEXT,
    sponsor       TEXT,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS charter_stakeholders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    charter_id  INTEGER NOT NULL REFERENCES project_charters(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    role        TEXT    NOT NULL,
    influence   TEXT    NOT NULL CHECK(influence IN ('High','Medium','Low')),
    interest    TEXT    NOT NULL CHECK(interest  IN ('High','Medium','Low')),
    created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS charter_goals (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    charter_id  INTEGER NOT NULL REFERENCES project_charters(id) ON DELETE CASCADE,
    description TEXT    NOT NULL,
    metric      TEXT    NOT NULL,
    priority    TEXT    NOT NULL CHECK(priority IN ('High','Medium','Low')),
    created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
`);

// Ensure at least one default charter exists (for single-charter projects)
const charterCount = (sqlite.prepare('SELECT COUNT(*) AS n FROM project_charters').get() as any).n;
if (charterCount === 0) {
  const r = sqlite.prepare(`
    INSERT INTO project_charters (name, vision, mission, budget, sponsor)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'Safety Management System V2',
    'To create the most comprehensive and user-friendly safety management platform in the industry, reducing workplace incidents by 50%.',
    'Empower safety officers with real-time data and AI-driven insights to proactively prevent accidents.',
    '$1.2M',
    'Executive Safety Committee',
  );
  const charterId = r.lastInsertRowid as number;

  // Seed stakeholders
  const insertStakeholder = sqlite.prepare(`
    INSERT INTO charter_stakeholders (charter_id, name, role, influence, interest)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertStakeholder.run(charterId, 'Sarah Chen', 'Product Owner', 'High', 'High');
  insertStakeholder.run(charterId, 'Mike Ross', 'Safety Director', 'High', 'High');
  insertStakeholder.run(charterId, 'IT Ops Team', 'Infrastructure', 'Medium', 'Low');

  // Seed goals
  const insertGoal = sqlite.prepare(`
    INSERT INTO charter_goals (charter_id, description, metric, priority)
    VALUES (?, ?, ?, ?)
  `);
  insertGoal.run(charterId, 'Reduce incident reporting time', '< 2 minutes', 'High');
  insertGoal.run(charterId, 'Increase mobile adoption', '80% of field workers', 'High');
  insertGoal.run(charterId, 'Automate compliance reporting', '100% automated', 'Medium');
}

// ── VALIDATION SCHEMAS ────────────────────────────────────────────────────────

const InfluenceInterest = z.enum(['High', 'Medium', 'Low']);
const Priority = z.enum(['High', 'Medium', 'Low']);

const UpdateCharterSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  vision: z.string().max(2000).optional(),
  mission: z.string().max(2000).optional(),
  budget: z.string().max(100).optional(),
  sponsor: z.string().max(200).optional(),
});

const CreateStakeholderSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  influence: InfluenceInterest,
  interest: InfluenceInterest,
});

const CreateGoalSchema = z.object({
  description: z.string().min(1).max(500),
  metric: z.string().min(1).max(200),
  priority: Priority,
});

// ── HELPERS ───────────────────────────────────────────────────────────────────

function now(): number { return Date.now(); }

function mapCharter(r: any) {
  return {
    id: r.id,
    name: r.name,
    vision: r.vision ?? '',
    mission: r.mission ?? '',
    budget: r.budget ?? '',
    sponsor: r.sponsor ?? '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapStakeholder(r: any) {
  return {
    id: r.id,
    charterId: r.charter_id,
    name: r.name,
    role: r.role,
    influence: r.influence as 'High' | 'Medium' | 'Low',
    interest: r.interest as 'High' | 'Medium' | 'Low',
    createdAt: r.created_at,
  };
}

function mapGoal(r: any) {
  return {
    id: r.id,
    charterId: r.charter_id,
    description: r.description,
    metric: r.metric,
    priority: r.priority as 'High' | 'Medium' | 'Low',
    createdAt: r.created_at,
  };
}

// ── ROUTES ────────────────────────────────────────────────────────────────────

export const charterRoutes = (app: Hono) => {

  /**
   * GET /api/charters
   * List all charters (usually just one per project deployment)
   */
  app.get('/api/charters', (c) => {
    try {
      const rows = sqlite.prepare('SELECT * FROM project_charters ORDER BY created_at DESC').all() as any[];
      return c.json({ success: true, data: rows.map(mapCharter), count: rows.length });
    } catch (error) {
      logger.error('List charters', { error });
      return c.json({ success: false, error: 'Failed to list charters' }, 500);
    }
  });

  /**
   * GET /api/charters/:id
   * Full charter detail with stakeholders + goals
   */
  app.get('/api/charters/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid id' }, 400);

      const charter = sqlite.prepare('SELECT * FROM project_charters WHERE id = ?').get(id) as any;
      if (!charter) return c.json({ success: false, error: 'Charter not found' }, 404);

      const stakeholders = sqlite.prepare('SELECT * FROM charter_stakeholders WHERE charter_id = ? ORDER BY id ASC').all(id) as any[];
      const goals = sqlite.prepare('SELECT * FROM charter_goals WHERE charter_id = ? ORDER BY id ASC').all(id) as any[];

      return c.json({
        success: true,
        data: {
          ...mapCharter(charter),
          stakeholders: stakeholders.map(mapStakeholder),
          goals: goals.map(mapGoal),
        },
      });
    } catch (error) {
      logger.error('Get charter', { error });
      return c.json({ success: false, error: 'Failed to get charter' }, 500);
    }
  });

  /**
   * PATCH /api/charters/:id
   * Update charter info (vision, mission, budget, sponsor, name)
   */
  app.patch('/api/charters/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid id' }, 400);

      const existing = sqlite.prepare('SELECT id FROM project_charters WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Charter not found' }, 404);

      const body = await c.req.json();
      const v = UpdateCharterSchema.parse(body);

      const fields: string[] = [];
      const params: any[] = [];
      if (v.name    !== undefined) { fields.push('name = ?');    params.push(v.name); }
      if (v.vision  !== undefined) { fields.push('vision = ?');  params.push(v.vision); }
      if (v.mission !== undefined) { fields.push('mission = ?'); params.push(v.mission); }
      if (v.budget  !== undefined) { fields.push('budget = ?');  params.push(v.budget); }
      if (v.sponsor !== undefined) { fields.push('sponsor = ?'); params.push(v.sponsor); }

      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);

      fields.push('updated_at = ?');
      params.push(now());
      params.push(id);

      sqlite.prepare(`UPDATE project_charters SET ${fields.join(', ')} WHERE id = ?`).run(...params);

      const updated = sqlite.prepare('SELECT * FROM project_charters WHERE id = ?').get(id) as any;
      logger.info('Charter updated', { id });
      return c.json({ success: true, data: mapCharter(updated) });
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Update charter', { error });
      return c.json({ success: false, error: 'Failed to update charter' }, 500);
    }
  });

  // ── Stakeholders ────────────────────────────────────────────────────────────

  /**
   * POST /api/charters/:id/stakeholders
   * Add stakeholder to a charter
   */
  app.post('/api/charters/:id/stakeholders', async (c) => {
    try {
      const charterId = parseInt(c.req.param('id'), 10);
      if (isNaN(charterId)) return c.json({ success: false, error: 'Invalid id' }, 400);

      const charter = sqlite.prepare('SELECT id FROM project_charters WHERE id = ?').get(charterId);
      if (!charter) return c.json({ success: false, error: 'Charter not found' }, 404);

      const body = await c.req.json();
      const v = CreateStakeholderSchema.parse(body);

      const result = sqlite.prepare(`
        INSERT INTO charter_stakeholders (charter_id, name, role, influence, interest)
        VALUES (?, ?, ?, ?, ?)
      `).run(charterId, v.name, v.role, v.influence, v.interest);

      const row = sqlite.prepare('SELECT * FROM charter_stakeholders WHERE id = ?').get(result.lastInsertRowid) as any;
      logger.info('Stakeholder added', { charterId, id: row.id });
      return c.json({ success: true, data: mapStakeholder(row) }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Add stakeholder', { error });
      return c.json({ success: false, error: 'Failed to add stakeholder' }, 500);
    }
  });

  /**
   * DELETE /api/charters/:id/stakeholders/:stakeholderId
   * Remove a stakeholder
   */
  app.delete('/api/charters/:id/stakeholders/:stakeholderId', (c) => {
    try {
      const charterId = parseInt(c.req.param('id'), 10);
      const stakeholderId = parseInt(c.req.param('stakeholderId'), 10);
      if (isNaN(charterId) || isNaN(stakeholderId)) return c.json({ success: false, error: 'Invalid id' }, 400);

      const exists = sqlite.prepare(
        'SELECT id FROM charter_stakeholders WHERE id = ? AND charter_id = ?'
      ).get(stakeholderId, charterId);
      if (!exists) return c.json({ success: false, error: 'Stakeholder not found' }, 404);

      sqlite.prepare('DELETE FROM charter_stakeholders WHERE id = ?').run(stakeholderId);
      logger.info('Stakeholder deleted', { charterId, stakeholderId });
      return c.json({ success: true, message: 'Stakeholder removed' });
    } catch (error) {
      logger.error('Delete stakeholder', { error });
      return c.json({ success: false, error: 'Failed to delete stakeholder' }, 500);
    }
  });

  // ── Goals ────────────────────────────────────────────────────────────────────

  /**
   * POST /api/charters/:id/goals
   * Add a strategic goal to a charter
   */
  app.post('/api/charters/:id/goals', async (c) => {
    try {
      const charterId = parseInt(c.req.param('id'), 10);
      if (isNaN(charterId)) return c.json({ success: false, error: 'Invalid id' }, 400);

      const charter = sqlite.prepare('SELECT id FROM project_charters WHERE id = ?').get(charterId);
      if (!charter) return c.json({ success: false, error: 'Charter not found' }, 404);

      const body = await c.req.json();
      const v = CreateGoalSchema.parse(body);

      const result = sqlite.prepare(`
        INSERT INTO charter_goals (charter_id, description, metric, priority)
        VALUES (?, ?, ?, ?)
      `).run(charterId, v.description, v.metric, v.priority);

      const row = sqlite.prepare('SELECT * FROM charter_goals WHERE id = ?').get(result.lastInsertRowid) as any;
      logger.info('Goal added', { charterId, id: row.id });
      return c.json({ success: true, data: mapGoal(row) }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Add goal', { error });
      return c.json({ success: false, error: 'Failed to add goal' }, 500);
    }
  });

  /**
   * DELETE /api/charters/:id/goals/:goalId
   * Remove a goal
   */
  app.delete('/api/charters/:id/goals/:goalId', (c) => {
    try {
      const charterId = parseInt(c.req.param('id'), 10);
      const goalId = parseInt(c.req.param('goalId'), 10);
      if (isNaN(charterId) || isNaN(goalId)) return c.json({ success: false, error: 'Invalid id' }, 400);

      const exists = sqlite.prepare(
        'SELECT id FROM charter_goals WHERE id = ? AND charter_id = ?'
      ).get(goalId, charterId);
      if (!exists) return c.json({ success: false, error: 'Goal not found' }, 404);

      sqlite.prepare('DELETE FROM charter_goals WHERE id = ?').run(goalId);
      logger.info('Goal deleted', { charterId, goalId });
      return c.json({ success: true, message: 'Goal removed' });
    } catch (error) {
      logger.error('Delete goal', { error });
      return c.json({ success: false, error: 'Failed to delete goal' }, 500);
    }
  });
};
