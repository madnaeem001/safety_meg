import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { createLogger } from '../services/logger';
import { DB_PATH } from '../config/env';

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');

// ── Ensure retrospective tables exist ────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sprint_retrospectives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sprint_id TEXT NOT NULL UNIQUE,
    facilitator TEXT,
    date TEXT,
    participants TEXT NOT NULL DEFAULT '[]',
    summary TEXT,
    sentiment_happy INTEGER NOT NULL DEFAULT 0,
    sentiment_neutral INTEGER NOT NULL DEFAULT 0,
    sentiment_sad INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE TABLE IF NOT EXISTS sprint_retro_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    retro_id INTEGER NOT NULL REFERENCES sprint_retrospectives(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'went_well',
    content TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Anonymous',
    votes INTEGER NOT NULL DEFAULT 0,
    is_actionable INTEGER NOT NULL DEFAULT 0,
    assignee TEXT,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE INDEX IF NOT EXISTS idx_sprint_retros_sprint ON sprint_retrospectives(sprint_id);
  CREATE INDEX IF NOT EXISTS idx_sprint_retro_items_retro ON sprint_retro_items(retro_id);
  CREATE TABLE IF NOT EXISTS sprint_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    default_duration INTEGER NOT NULL DEFAULT 14,
    working_days TEXT NOT NULL DEFAULT '["monday","tuesday","wednesday","thursday","friday"]',
    sprint_start_day TEXT NOT NULL DEFAULT 'monday',
    velocity_target INTEGER NOT NULL DEFAULT 40,
    max_capacity INTEGER NOT NULL DEFAULT 50,
    buffer_percentage INTEGER NOT NULL DEFAULT 20,
    auto_start_enabled INTEGER NOT NULL DEFAULT 1,
    notifications TEXT NOT NULL DEFAULT '{"sprintStart":true,"sprintEnd":true,"capacityWarning":true,"dailyStandup":false}',
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE INDEX IF NOT EXISTS idx_sprint_settings_project ON sprint_settings(project_id);
  CREATE TABLE IF NOT EXISTS task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    author TEXT NOT NULL DEFAULT 'Current User',
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
  CREATE TABLE IF NOT EXISTS sprint_velocity_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    sprint_label TEXT NOT NULL,
    committed INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    carryover INTEGER NOT NULL DEFAULT 0,
    recorded_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_velocity_history_project ON sprint_velocity_history(project_id);
`);

// ── Add agile/Jira-like columns to project_tasks (idempotent) ─────────────────
const _agileColumns: Array<[string, string]> = [
  ['story_points', 'INTEGER DEFAULT 1'],
  ['epic_id',      'TEXT'],
  ['issue_type',   "TEXT DEFAULT 'task'"],
  ['task_key',     'TEXT'],
  ['labels',       "TEXT DEFAULT '[]'"],
];
for (const [col, def] of _agileColumns) {
  try { sqlite.exec(`ALTER TABLE project_tasks ADD COLUMN ${col} ${def}`); } catch { /* already exists */ }
}

// ── Milestones + RFI tables (idempotent) ──────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS project_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    project_id INTEGER,
    owner TEXT,
    task_ids TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);
  CREATE TABLE IF NOT EXISTS project_rfi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rfi_number TEXT,
    subject TEXT NOT NULL,
    from_party TEXT,
    to_party TEXT,
    date_submitted TEXT,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'Open',
    project_id INTEGER,
    response TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE INDEX IF NOT EXISTS idx_project_rfi_project ON project_rfi(project_id);
`);

const logger = createLogger('Projects');

// ── VALIDATION SCHEMAS ────────────────────────────────────────────────────

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  projectManager: z.string().optional(),
  budget: z.number().optional(),
  safetyBudget: z.number().optional(),
  safetyOfficer: z.string().optional(),
  location: z.string().optional(),
  criticality: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

const UpdateProjectSchema = CreateProjectSchema.partial();

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'completed', 'blocked']).default('todo'),
  priority: z.enum(['highest', 'high', 'medium', 'low', 'lowest', 'critical']).default('medium'),
  safetyRelated: z.boolean().default(false),
  progress: z.number().int().min(0).max(100).default(0),
  // Agile/Jira fields
  storyPoints: z.number().int().min(0).optional(),
  epicId: z.string().optional(),
  issueType: z.enum(['epic', 'story', 'task', 'subtask', 'bug']).default('task'),
  taskKey: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  completedDate: z.string().optional(),
});

const SafetyCheckSchema = z.object({
  safetyScore: z.number().min(0).max(100),
  incidents: z.number().int().min(0).optional(),
  nearMisses: z.number().int().min(0).optional(),
  auditsPassed: z.number().int().min(0).optional(),
  trainingCompliancePercentage: z.number().min(0).max(100).optional(),
});

const SprintSettingsSchema = z.object({
  projectId: z.number().int().optional(),
  defaultDuration: z.number().int().min(1).max(90).optional(),
  workingDays: z.array(z.string()).optional(),
  sprintStartDay: z.string().optional(),
  velocityTarget: z.number().int().min(1).optional(),
  maxCapacity: z.number().int().min(1).optional(),
  bufferPercentage: z.number().int().min(0).max(100).optional(),
  autoStartEnabled: z.boolean().optional(),
  notifications: z.object({
    sprintStart: z.boolean(),
    sprintEnd: z.boolean(),
    capacityWarning: z.boolean(),
    dailyStandup: z.boolean(),
  }).optional(),
});

// ── HELPERS ───────────────────────────────────────────────────────────────

function generateProjectCode(): string {
  const n = (sqlite.prepare('SELECT COUNT(*) as n FROM projects').get() as any).n + 1;
  return `PRJ-${String(n).padStart(4, '0')}`;
}

function now(): number { return Date.now(); }

export const projectRoutes = (app: Hono) => {

  /**
   * GET /api/projects
   * List all projects with optional filters
   */
  app.get('/api/projects', (c) => {
    try {
      const status = c.req.query('status');
      const criticality = c.req.query('criticality');
      const location = c.req.query('location');
      const search = c.req.query('search');

      let query = 'SELECT * FROM projects WHERE 1=1';
      const params: any[] = [];
      if (status) { query += ' AND status = ?'; params.push(status); }
      if (criticality) { query += ' AND criticality = ?'; params.push(criticality); }
      if (location) { query += ' AND location LIKE ?'; params.push(`%${location}%`); }
      if (search) { query += ' AND (name LIKE ? OR project_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
      query += ' ORDER BY created_at DESC';

      const rows = sqlite.prepare(query).all(...params) as any[];

      // Attach task counts
      const data = rows.map((r: any) => {
        const taskStats = sqlite.prepare(
          `SELECT COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
           FROM project_tasks WHERE project_id = ?`
        ).get(r.id) as any;
        return {
          id: r.id,
          projectCode: r.project_code,
          name: r.name,
          description: r.description,
          status: r.status,
          startDate: r.start_date,
          endDate: r.end_date,
          projectManager: r.project_manager,
          budget: r.budget,
          safetyBudget: r.safety_budget,
          safetyOfficer: r.safety_officer,
          location: r.location,
          criticality: r.criticality,
          taskCount: taskStats.total,
          completedTasks: taskStats.completed,
          blockedTasks: taskStats.blocked,
          createdAt: r.created_at,
        };
      });

      const summary = {
        total: data.length,
        planning: data.filter((r: any) => r.status === 'planning').length,
        active: data.filter((r: any) => r.status === 'active').length,
        onHold: data.filter((r: any) => r.status === 'on_hold').length,
        completed: data.filter((r: any) => r.status === 'completed').length,
      };

      return c.json({ success: true, data, summary, count: data.length }, 200);
    } catch (error) {
      logger.error('Error listing projects', { error });
      return c.json({ success: false, error: 'Failed to list projects' }, 500);
    }
  });

  /**
   * POST /api/projects
   * Create a new project
   */
  app.post('/api/projects', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateProjectSchema.parse(body);
      const projectCode = generateProjectCode();

      const result = sqlite.prepare(`
        INSERT INTO projects (project_code, name, description, status, start_date, end_date,
          project_manager, budget, safety_budget, safety_officer, location, criticality)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        projectCode, v.name, v.description ?? null, v.status,
        v.startDate ?? null, v.endDate ?? null, v.projectManager ?? null,
        v.budget ?? null, v.safetyBudget ?? null, v.safetyOfficer ?? null,
        v.location ?? null, v.criticality
      );

      // Initialize safety metrics record
      sqlite.prepare(`
        INSERT INTO project_safety_metrics (project_id, safety_score, incidents, near_misses, audits_passed, last_updated)
        VALUES (?, 100, 0, 0, 0, date('now'))
      `).run(result.lastInsertRowid);

      const row = sqlite.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid) as any;
      logger.info('Project created', { id: result.lastInsertRowid, code: projectCode });

      return c.json({ success: true, data: { id: row.id, projectCode: row.project_code, name: row.name, status: row.status } }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error creating project', { error });
      return c.json({ success: false, error: 'Failed to create project' }, 500);
    }
  });

  // ── STATIC SUB-ROUTES: registered before /:id to prevent Hono route shadowing ──────

  /**
   * GET /api/projects/sprints
   * List all sprints (optionally filter by projectId or status)
   */
  app.get('/api/projects/sprints', (c) => {
    try {
      const status = c.req.query('status');
      const projectId = c.req.query('projectId');

      let query = 'SELECT * FROM project_sprints WHERE 1=1';
      const params: any[] = [];
      if (status) { query += ' AND status = ?'; params.push(status); }
      if (projectId) { query += ' AND (project_id = ? OR project_id IS NULL)'; params.push(parseInt(projectId, 10)); }
      query += ' ORDER BY start_date ASC, id ASC';

      const rows = sqlite.prepare(query).all(...params) as any[];
      const data = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        startDate: r.start_date,
        endDate: r.end_date,
        goal: r.goal,
        status: r.status,
        projectId: r.project_id,
        createdAt: r.created_at,
      }));

      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error listing sprints', { error });
      return c.json({ success: false, error: 'Failed to list sprints' }, 500);
    }
  });

  /**
   * GET /api/projects/epics
   * List all epics (optionally filter by projectId or status)
   */
  app.get('/api/projects/epics', (c) => {
    try {
      const status = c.req.query('status');
      const projectId = c.req.query('projectId');

      let query = 'SELECT * FROM project_epics WHERE 1=1';
      const params: any[] = [];
      if (status) { query += ' AND status = ?'; params.push(status); }
      if (projectId) { query += ' AND (project_id = ? OR project_id IS NULL)'; params.push(parseInt(projectId, 10)); }
      query += ' ORDER BY id ASC';

      const rows = sqlite.prepare(query).all(...params) as any[];
      const data = rows.map((r: any) => ({
        id: r.id,
        key: r.key_code,
        name: r.name,
        summary: r.summary,
        color: r.color ?? '#6366f1',
        status: r.status,
        projectId: r.project_id,
        createdAt: r.created_at,
      }));

      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error listing epics', { error });
      return c.json({ success: false, error: 'Failed to list epics' }, 500);
    }
  });

  /**
   * GET /api/projects/sprint-settings
   * Return sprint settings row, auto-creating defaults if none exist.
   */
  app.get('/api/projects/sprint-settings', (c) => {
    try {
      const projectId = c.req.query('projectId') ? parseInt(c.req.query('projectId')!, 10) : null;
      let row: any;
      if (projectId !== null) {
        row = sqlite.prepare('SELECT * FROM sprint_settings WHERE project_id = ?').get(projectId);
      } else {
        row = sqlite.prepare('SELECT * FROM sprint_settings WHERE project_id IS NULL LIMIT 1').get();
      }
      if (!row) {
        const result = sqlite.prepare('INSERT INTO sprint_settings (project_id) VALUES (?)').run(projectId);
        row = sqlite.prepare('SELECT * FROM sprint_settings WHERE id = ?').get(result.lastInsertRowid);
      }
      return c.json({ success: true, data: formatSettings(row) }, 200);
    } catch (error) {
      logger.error('Error getting sprint settings', { error });
      return c.json({ success: false, error: 'Failed to get sprint settings' }, 500);
    }
  });

  /**
   * PUT /api/projects/sprint-settings
   * Upsert sprint settings.
   */
  app.put('/api/projects/sprint-settings', async (c) => {
    try {
      const body = await c.req.json();
      const v = SprintSettingsSchema.parse(body);
      const projectId = v.projectId ?? null;

      let existing: any;
      if (projectId !== null) {
        existing = sqlite.prepare('SELECT id FROM sprint_settings WHERE project_id = ?').get(projectId);
      } else {
        existing = sqlite.prepare('SELECT id FROM sprint_settings WHERE project_id IS NULL LIMIT 1').get();
      }

      if (!existing) {
        sqlite.prepare(`
          INSERT INTO sprint_settings (project_id, default_duration, working_days, sprint_start_day, velocity_target, max_capacity, buffer_percentage, auto_start_enabled, notifications)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          projectId,
          v.defaultDuration ?? 14,
          JSON.stringify(v.workingDays ?? ['monday','tuesday','wednesday','thursday','friday']),
          v.sprintStartDay ?? 'monday',
          v.velocityTarget ?? 40,
          v.maxCapacity ?? 50,
          v.bufferPercentage ?? 20,
          v.autoStartEnabled !== undefined ? (v.autoStartEnabled ? 1 : 0) : 1,
          JSON.stringify(v.notifications ?? { sprintStart: true, sprintEnd: true, capacityWarning: true, dailyStandup: false })
        );
      } else {
        const fields: string[] = [];
        const params: any[] = [];
        if (v.defaultDuration !== undefined) { fields.push('default_duration = ?'); params.push(v.defaultDuration); }
        if (v.workingDays !== undefined) { fields.push('working_days = ?'); params.push(JSON.stringify(v.workingDays)); }
        if (v.sprintStartDay !== undefined) { fields.push('sprint_start_day = ?'); params.push(v.sprintStartDay); }
        if (v.velocityTarget !== undefined) { fields.push('velocity_target = ?'); params.push(v.velocityTarget); }
        if (v.maxCapacity !== undefined) { fields.push('max_capacity = ?'); params.push(v.maxCapacity); }
        if (v.bufferPercentage !== undefined) { fields.push('buffer_percentage = ?'); params.push(v.bufferPercentage); }
        if (v.autoStartEnabled !== undefined) { fields.push('auto_start_enabled = ?'); params.push(v.autoStartEnabled ? 1 : 0); }
        if (v.notifications !== undefined) { fields.push('notifications = ?'); params.push(JSON.stringify(v.notifications)); }
        if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
        fields.push('updated_at = ?'); params.push(now());
        params.push(existing.id);
        sqlite.prepare(`UPDATE sprint_settings SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      }

      let updated: any;
      if (projectId !== null) {
        updated = sqlite.prepare('SELECT * FROM sprint_settings WHERE project_id = ?').get(projectId);
      } else {
        updated = sqlite.prepare('SELECT * FROM sprint_settings WHERE project_id IS NULL LIMIT 1').get();
      }
      logger.info('Sprint settings saved');
      return c.json({ success: true, data: formatSettings(updated) }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error updating sprint settings', { error });
      return c.json({ success: false, error: 'Failed to update sprint settings' }, 500);
    }
  });

  /**
   * GET /api/projects/milestones
   * List all milestones (optionally filter by projectId or status)
   */
  app.get('/api/projects/milestones', (c) => {
    try {
      const status = c.req.query('status');
      const projectId = c.req.query('projectId');

      let query = 'SELECT * FROM project_milestones WHERE 1=1';
      const params: any[] = [];
      if (status) { query += ' AND status = ?'; params.push(status); }
      if (projectId) { query += ' AND (project_id = ? OR project_id IS NULL)'; params.push(parseInt(projectId, 10)); }
      query += ' ORDER BY due_date ASC, id ASC';

      const rows = sqlite.prepare(query).all(...params) as any[];
      return c.json({ success: true, data: rows.map(formatMilestone), count: rows.length }, 200);
    } catch (error) {
      logger.error('Error listing milestones', { error });
      return c.json({ success: false, error: 'Failed to list milestones' }, 500);
    }
  });

  /**
   * GET /api/projects/rfi
   * List all RFI records (optionally filter by projectId or status)
   */
  app.get('/api/projects/rfi', (c) => {
    try {
      const status = c.req.query('status');
      const projectId = c.req.query('projectId');

      let query = 'SELECT * FROM project_rfi WHERE 1=1';
      const params: any[] = [];
      if (status) { query += ' AND status = ?'; params.push(status); }
      if (projectId) { query += ' AND (project_id = ? OR project_id IS NULL)'; params.push(parseInt(projectId, 10)); }
      query += ' ORDER BY created_at DESC';

      const rows = sqlite.prepare(query).all(...params) as any[];
      return c.json({ success: true, data: rows.map(formatRFI), count: rows.length }, 200);
    } catch (error) {
      logger.error('Error listing RFI', { error });
      return c.json({ success: false, error: 'Failed to list RFI records' }, 500);
    }
  });

  // ── END STATIC SUB-ROUTES ─────────────────────────────────────────────────────────────

  /**
   * GET /api/projects/:id
   * Full project detail with tasks and safety metrics
   */
  app.get('/api/projects/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const project = sqlite.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
      if (!project) return c.json({ success: false, error: 'Project not found' }, 404);

      const tasks = sqlite.prepare('SELECT * FROM project_tasks WHERE project_id = ? ORDER BY due_date ASC').all(id) as any[];
      const metrics = sqlite.prepare('SELECT * FROM project_safety_metrics WHERE project_id = ?').get(id) as any;

      return c.json({
        success: true,
        data: {
          id: project.id,
          projectCode: project.project_code,
          name: project.name,
          description: project.description,
          status: project.status,
          startDate: project.start_date,
          endDate: project.end_date,
          projectManager: project.project_manager,
          budget: project.budget,
          safetyBudget: project.safety_budget,
          safetyOfficer: project.safety_officer,
          location: project.location,
          criticality: project.criticality,
          tasks: tasks.map((t: any) => ({
            id: t.id, title: t.title, description: t.description,
            assignedTo: t.assigned_to, startDate: t.start_date,
            dueDate: t.due_date, completedDate: t.completed_date,
            status: t.status, priority: t.priority,
            safetyRelated: Boolean(t.safety_related), progress: t.progress,
          })),
          safetyMetrics: metrics ? {
            safetyScore: metrics.safety_score,
            incidents: metrics.incidents,
            nearMisses: metrics.near_misses,
            auditsPassed: metrics.audits_passed,
            trainingCompliancePercentage: metrics.training_compliance_percentage,
            lastUpdated: metrics.last_updated,
          } : null,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
        }
      }, 200);
    } catch (error) {
      logger.error('Error fetching project', { error });
      return c.json({ success: false, error: 'Failed to fetch project' }, 500);
    }
  });

  /**
   * PUT /api/projects/:id
   * Update a project
   */
  app.put('/api/projects/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const existing = sqlite.prepare('SELECT id FROM projects WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Project not found' }, 404);

      const body = await c.req.json();
      const v = UpdateProjectSchema.parse(body);

      const fields: string[] = [];
      const params: any[] = [];
      if (v.name !== undefined) { fields.push('name = ?'); params.push(v.name); }
      if (v.description !== undefined) { fields.push('description = ?'); params.push(v.description); }
      if (v.status !== undefined) { fields.push('status = ?'); params.push(v.status); }
      if (v.startDate !== undefined) { fields.push('start_date = ?'); params.push(v.startDate); }
      if (v.endDate !== undefined) { fields.push('end_date = ?'); params.push(v.endDate); }
      if (v.projectManager !== undefined) { fields.push('project_manager = ?'); params.push(v.projectManager); }
      if (v.budget !== undefined) { fields.push('budget = ?'); params.push(v.budget); }
      if (v.safetyBudget !== undefined) { fields.push('safety_budget = ?'); params.push(v.safetyBudget); }
      if (v.safetyOfficer !== undefined) { fields.push('safety_officer = ?'); params.push(v.safetyOfficer); }
      if (v.location !== undefined) { fields.push('location = ?'); params.push(v.location); }
      if (v.criticality !== undefined) { fields.push('criticality = ?'); params.push(v.criticality); }

      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at = ?'); params.push(now());
      params.push(id);

      sqlite.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = sqlite.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;

      return c.json({ success: true, data: { id: updated.id, projectCode: updated.project_code, name: updated.name, status: updated.status } }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error updating project', { error });
      return c.json({ success: false, error: 'Failed to update project' }, 500);
    }
  });

  /**
   * GET /api/projects/:id/tasks
   * List tasks for a project
   */
  app.get('/api/projects/:id/tasks', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const project = sqlite.prepare('SELECT id, name, project_code FROM projects WHERE id = ?').get(id) as any;
      if (!project) return c.json({ success: false, error: 'Project not found' }, 404);

      const status = c.req.query('status');
      const priority = c.req.query('priority');

      let query = 'SELECT * FROM project_tasks WHERE project_id = ?';
      const params: any[] = [id];
      if (status) { query += ' AND status = ?'; params.push(status); }
      if (priority) { query += ' AND priority = ?'; params.push(priority); }
      query += ' ORDER BY due_date ASC, priority DESC';

      const rows = sqlite.prepare(query).all(...params) as any[];
      const data = rows.map((t: any) => ({
        id: t.id,
        key: t.task_key || `SAFE-${String(t.id).padStart(3, '0')}`,
        title: t.title,
        description: t.description,
        assignee: t.assigned_to,
        startDate: t.start_date,
        dueDate: t.due_date,
        completedDate: t.completed_date,
        status: t.status,
        priority: t.priority,
        safetyRelated: Boolean(t.safety_related),
        progress: t.progress,
        storyPoints: t.story_points ?? 1,
        epicId: t.epic_id ?? null,
        issueType: t.issue_type ?? 'task',
        labels: (() => { try { return JSON.parse(t.labels || '[]'); } catch { return []; } })(),
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      return c.json({ success: true, data, count: data.length, project: { id: project.id, name: project.name, code: project.project_code } }, 200);
    } catch (error) {
      logger.error('Error listing tasks', { error });
      return c.json({ success: false, error: 'Failed to list tasks' }, 500);
    }
  });

  /**
   * POST /api/projects/:id/tasks
   * Create a task within a project
   */
  app.post('/api/projects/:id/tasks', async (c) => {
    try {
      const projectId = parseInt(c.req.param('id'), 10);
      const project = sqlite.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
      if (!project) return c.json({ success: false, error: 'Project not found' }, 404);

      const body = await c.req.json();
      const v = CreateTaskSchema.parse(body);

      const result = sqlite.prepare(`
        INSERT INTO project_tasks (project_id, title, description, assigned_to, start_date, due_date,
          status, priority, safety_related, progress,
          story_points, epic_id, issue_type, task_key, labels)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        projectId, v.title, v.description ?? null, v.assignedTo ?? null,
        v.startDate ?? null, v.dueDate ?? null, v.status, v.priority,
        v.safetyRelated ? 1 : 0, v.progress,
        v.storyPoints ?? 1, v.epicId ?? null, v.issueType,
        v.taskKey ?? null, JSON.stringify(v.labels ?? [])
      );

      const row = sqlite.prepare('SELECT * FROM project_tasks WHERE id = ?').get(result.lastInsertRowid) as any;
      logger.info('Task created', { projectId, taskId: result.lastInsertRowid });

      return c.json({
        success: true,
        data: {
          id: row.id,
          key: row.task_key || `SAFE-${String(row.id).padStart(3, '0')}`,
          title: row.title, status: row.status, priority: row.priority,
          issueType: row.issue_type ?? 'task', storyPoints: row.story_points ?? 1,
          epicId: row.epic_id ?? null,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error creating task', { error });
      return c.json({ success: false, error: 'Failed to create task' }, 500);
    }
  });

  /**
   * PUT /api/projects/:id/tasks/:taskId
   * Update a task
   */
  app.put('/api/projects/:id/tasks/:taskId', async (c) => {
    try {
      const projectId = parseInt(c.req.param('id'), 10);
      const taskId = parseInt(c.req.param('taskId'), 10);

      const existing = sqlite.prepare('SELECT id FROM project_tasks WHERE id = ? AND project_id = ?').get(taskId, projectId);
      if (!existing) return c.json({ success: false, error: 'Task not found' }, 404);

      const body = await c.req.json();
      const v = UpdateTaskSchema.parse(body);

      const fields: string[] = [];
      const params: any[] = [];
      if (v.title !== undefined) { fields.push('title = ?'); params.push(v.title); }
      if (v.description !== undefined) { fields.push('description = ?'); params.push(v.description); }
      if (v.assignedTo !== undefined) { fields.push('assigned_to = ?'); params.push(v.assignedTo); }
      if (v.startDate !== undefined) { fields.push('start_date = ?'); params.push(v.startDate); }
      if (v.dueDate !== undefined) { fields.push('due_date = ?'); params.push(v.dueDate); }
      if (v.completedDate !== undefined) { fields.push('completed_date = ?'); params.push(v.completedDate); }
      if (v.status !== undefined) {
        fields.push('status = ?'); params.push(v.status);
        if (v.status === 'completed' && !v.completedDate) {
          fields.push('completed_date = ?'); params.push(new Date().toISOString().slice(0, 10));
        }
      }
      if (v.priority !== undefined) { fields.push('priority = ?'); params.push(v.priority); }
      if (v.safetyRelated !== undefined) { fields.push('safety_related = ?'); params.push(v.safetyRelated ? 1 : 0); }
      if (v.progress !== undefined) { fields.push('progress = ?'); params.push(v.progress); }
      if (v.storyPoints !== undefined) { fields.push('story_points = ?'); params.push(v.storyPoints); }
      if (v.epicId !== undefined) { fields.push('epic_id = ?'); params.push(v.epicId); }
      if (v.issueType !== undefined) { fields.push('issue_type = ?'); params.push(v.issueType); }
      if (v.taskKey !== undefined) { fields.push('task_key = ?'); params.push(v.taskKey); }
      if (v.labels !== undefined) { fields.push('labels = ?'); params.push(JSON.stringify(v.labels)); }

      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at = ?'); params.push(now());
      params.push(taskId);

      sqlite.prepare(`UPDATE project_tasks SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = sqlite.prepare('SELECT * FROM project_tasks WHERE id = ?').get(taskId) as any;

      return c.json({ success: true, data: { id: updated.id, title: updated.title, status: updated.status, progress: updated.progress } }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error updating task', { error });
      return c.json({ success: false, error: 'Failed to update task' }, 500);
    }
  });

  /**
   * GET /api/projects/:id/schedule
   * Gantt/timeline view — tasks ordered by start date with progress
   */
  app.get('/api/projects/:id/schedule', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const project = sqlite.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
      if (!project) return c.json({ success: false, error: 'Project not found' }, 404);

      const tasks = sqlite.prepare(
        `SELECT * FROM project_tasks WHERE project_id = ? ORDER BY start_date ASC, due_date ASC`
      ).all(id) as any[];

      const timeline = tasks.map((t: any) => ({
        id: t.id,
        task: t.title,
        assignedTo: t.assigned_to,
        startDate: t.start_date,
        endDate: t.due_date,
        completedDate: t.completed_date,
        progress: t.progress,
        status: t.status,
        priority: t.priority,
        safetyRelated: Boolean(t.safety_related),
      }));

      const overall = tasks.length > 0
        ? Math.round(tasks.reduce((s: number, t: any) => s + t.progress, 0) / tasks.length)
        : 0;

      return c.json({
        success: true,
        data: {
          project: { id: project.id, name: project.name, code: project.project_code, startDate: project.start_date, endDate: project.end_date },
          timeline,
          overallProgress: overall,
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
        }
      }, 200);
    } catch (error) {
      logger.error('Error fetching schedule', { error });
      return c.json({ success: false, error: 'Failed to fetch project schedule' }, 500);
    }
  });

  /**
   * POST /api/projects/:id/safety-check
   * Record / update safety metrics for a project
   */
  app.post('/api/projects/:id/safety-check', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const project = sqlite.prepare('SELECT id FROM projects WHERE id = ?').get(id);
      if (!project) return c.json({ success: false, error: 'Project not found' }, 404);

      const body = await c.req.json();
      const v = SafetyCheckSchema.parse(body);
      const today = new Date().toISOString().slice(0, 10);

      const existing = sqlite.prepare('SELECT id FROM project_safety_metrics WHERE project_id = ?').get(id);
      if (existing) {
        sqlite.prepare(`
          UPDATE project_safety_metrics
          SET safety_score = ?, incidents = ?, near_misses = ?, audits_passed = ?,
              training_compliance_percentage = ?, last_updated = ?, updated_at = ?
          WHERE project_id = ?
        `).run(
          v.safetyScore, v.incidents ?? 0, v.nearMisses ?? 0, v.auditsPassed ?? 0,
          v.trainingCompliancePercentage ?? null, today, now(), id
        );
      } else {
        sqlite.prepare(`
          INSERT INTO project_safety_metrics (project_id, safety_score, incidents, near_misses, audits_passed, training_compliance_percentage, last_updated)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, v.safetyScore, v.incidents ?? 0, v.nearMisses ?? 0, v.auditsPassed ?? 0, v.trainingCompliancePercentage ?? null, today);
      }

      logger.info('Safety check recorded', { projectId: id, score: v.safetyScore });

      return c.json({ success: true, data: { projectId: id, safetyScore: v.safetyScore, lastUpdated: today } }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error recording safety check', { error });
      return c.json({ success: false, error: 'Failed to record safety check' }, 500);
    }
  });

  // ── SPRINTS ─────────────────────────────────────────────────────────────

  const CreateSprintSchema = z.object({
    name: z.string().min(1).max(100),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    goal: z.string().optional(),
    status: z.enum(['future', 'active', 'completed']).default('future'),
    projectId: z.number().int().optional(),
  });

  /**
   * POST /api/projects/sprints
   * Create a new sprint
   */
  app.post('/api/projects/sprints', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateSprintSchema.parse(body);

      const result = sqlite.prepare(`
        INSERT INTO project_sprints (name, start_date, end_date, goal, status, project_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(v.name, v.startDate ?? null, v.endDate ?? null, v.goal ?? null, v.status, v.projectId ?? null);

      const row = sqlite.prepare('SELECT * FROM project_sprints WHERE id = ?').get(result.lastInsertRowid) as any;
      logger.info('Sprint created', { id: result.lastInsertRowid, name: v.name });

      return c.json({ success: true, data: { id: row.id, name: row.name, status: row.status } }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error creating sprint', { error });
      return c.json({ success: false, error: 'Failed to create sprint' }, 500);
    }
  });

  /**
   * PUT /api/projects/sprints/:id
   * Update a sprint
   */
  app.put('/api/projects/sprints/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const existing = sqlite.prepare('SELECT id FROM project_sprints WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Sprint not found' }, 404);

      const body = await c.req.json();
      const v = CreateSprintSchema.partial().parse(body);

      const fields: string[] = [];
      const params: any[] = [];
      if (v.name !== undefined) { fields.push('name = ?'); params.push(v.name); }
      if (v.startDate !== undefined) { fields.push('start_date = ?'); params.push(v.startDate); }
      if (v.endDate !== undefined) { fields.push('end_date = ?'); params.push(v.endDate); }
      if (v.goal !== undefined) { fields.push('goal = ?'); params.push(v.goal); }
      if (v.status !== undefined) { fields.push('status = ?'); params.push(v.status); }
      if (v.projectId !== undefined) { fields.push('project_id = ?'); params.push(v.projectId); }

      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at = ?'); params.push(now());
      params.push(id);

      sqlite.prepare(`UPDATE project_sprints SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = sqlite.prepare('SELECT * FROM project_sprints WHERE id = ?').get(id) as any;

      return c.json({ success: true, data: { id: updated.id, name: updated.name, status: updated.status } }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error updating sprint', { error });
      return c.json({ success: false, error: 'Failed to update sprint' }, 500);
    }
  });

  /**
   * DELETE /api/projects/sprints/:id
   * Delete a sprint.
   */
  app.delete('/api/projects/sprints/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const existing = sqlite.prepare('SELECT id FROM project_sprints WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Sprint not found' }, 404);
      sqlite.prepare('DELETE FROM project_sprints WHERE id = ?').run(id);
      logger.info('Sprint deleted', { id });
      return c.json({ success: true }, 200);
    } catch (error) {
      logger.error('Error deleting sprint', { error });
      return c.json({ success: false, error: 'Failed to delete sprint' }, 500);
    }
  });

  // ── EPICS ────────────────────────────────────────────────────────────────

  const CreateEpicSchema = z.object({
    keyCode: z.string().min(1).max(30),
    name: z.string().min(1).max(200),
    summary: z.string().optional(),
    color: z.string().optional(),
    status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'completed']).default('todo'),
    projectId: z.number().int().optional(),
  });

  /**
   * POST /api/projects/epics
   * Create a new epic
   */
  app.post('/api/projects/epics', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateEpicSchema.parse(body);

      const result = sqlite.prepare(`
        INSERT INTO project_epics (key_code, name, summary, color, status, project_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(v.keyCode, v.name, v.summary ?? null, v.color ?? '#6366f1', v.status, v.projectId ?? null);

      const row = sqlite.prepare('SELECT * FROM project_epics WHERE id = ?').get(result.lastInsertRowid) as any;
      logger.info('Epic created', { id: result.lastInsertRowid, name: v.name });

      return c.json({ success: true, data: { id: row.id, key: row.key_code, name: row.name, status: row.status } }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error creating epic', { error });
      return c.json({ success: false, error: 'Failed to create epic' }, 500);
    }
  });

  /**
   * PUT /api/projects/epics/:id
   * Update an epic
   */
  app.put('/api/projects/epics/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const existing = sqlite.prepare('SELECT id FROM project_epics WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Epic not found' }, 404);

      const body = await c.req.json();
      const v = CreateEpicSchema.partial().parse(body);

      const fields: string[] = [];
      const params: any[] = [];
      if (v.keyCode !== undefined) { fields.push('key_code = ?'); params.push(v.keyCode); }
      if (v.name !== undefined) { fields.push('name = ?'); params.push(v.name); }
      if (v.summary !== undefined) { fields.push('summary = ?'); params.push(v.summary); }
      if (v.color !== undefined) { fields.push('color = ?'); params.push(v.color); }
      if (v.status !== undefined) { fields.push('status = ?'); params.push(v.status); }
      if (v.projectId !== undefined) { fields.push('project_id = ?'); params.push(v.projectId); }

      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at = ?'); params.push(now());
      params.push(id);

      sqlite.prepare(`UPDATE project_epics SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = sqlite.prepare('SELECT * FROM project_epics WHERE id = ?').get(id) as any;

      return c.json({ success: true, data: { id: updated.id, key: updated.key_code, name: updated.name, status: updated.status } }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error updating epic', { error });
      return c.json({ success: false, error: 'Failed to update epic' }, 500);
    }
  });

  // ── RETROSPECTIVES ───────────────────────────────────────────────────────

  const AddRetroItemSchema = z.object({
    category: z.enum(['went_well', 'needs_improvement', 'action_items']),
    content: z.string().min(1).max(1000),
    author: z.string().min(1).max(100).default('Anonymous'),
    isActionable: z.boolean().default(false),
    assignee: z.string().optional(),
    dueDate: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  });

  const UpdateRetroItemSchema = z.object({
    status: z.enum(['pending', 'in_progress', 'completed']).optional(),
    votes: z.number().int().min(0).optional(),
    content: z.string().min(1).max(1000).optional(),
    assignee: z.string().optional(),
    dueDate: z.string().optional(),
  });

  /** Helper: get or create retro for a sprintId */
  function getOrCreateRetro(sprintId: string): any {
    let retro = sqlite.prepare('SELECT * FROM sprint_retrospectives WHERE sprint_id = ?').get(sprintId) as any;
    if (!retro) {
      sqlite.prepare(
        `INSERT INTO sprint_retrospectives (sprint_id, date) VALUES (?, ?)`
      ).run(sprintId, new Date().toISOString().split('T')[0]);
      retro = sqlite.prepare('SELECT * FROM sprint_retrospectives WHERE sprint_id = ?').get(sprintId) as any;
    }
    return retro;
  }

  /** Helper: format retro row to response shape */
  function formatRetro(retro: any, items: any[]): object {
    return {
      id: retro.id,
      sprintId: retro.sprint_id,
      facilitator: retro.facilitator ?? 'You',
      date: retro.date ?? '',
      participants: JSON.parse(retro.participants || '[]'),
      summary: retro.summary ?? '',
      teamSentiment: {
        happy: retro.sentiment_happy,
        neutral: retro.sentiment_neutral,
        sad: retro.sentiment_sad,
      },
      items: items.map(formatRetroItem),
      createdAt: retro.created_at,
      updatedAt: retro.updated_at,
    };
  }

  function formatRetroItem(item: any): object {
    return {
      id: item.id,
      retroId: item.retro_id,
      category: item.category,
      content: item.content,
      author: item.author,
      votes: item.votes,
      isActionable: item.is_actionable === 1,
      assignee: item.assignee ?? undefined,
      dueDate: item.due_date ?? undefined,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }

  /**
   * GET /api/projects/retrospectives/:sprintId
   * Get (or auto-create) the retrospective for a sprint, including all items.
   */
  app.get('/api/projects/retrospectives/:sprintId', (c) => {
    try {
      const sprintId = c.req.param('sprintId');
      const retro = getOrCreateRetro(sprintId);
      const items = sqlite.prepare('SELECT * FROM sprint_retro_items WHERE retro_id = ? ORDER BY votes DESC, created_at ASC').all(retro.id) as any[];
      return c.json({ success: true, data: formatRetro(retro, items) }, 200);
    } catch (error) {
      logger.error('Error fetching retrospective', { error });
      return c.json({ success: false, error: 'Failed to fetch retrospective' }, 500);
    }
  });

  /**
   * POST /api/projects/retrospectives/:sprintId/sentiment
   * Cast a team sentiment vote (happy | neutral | sad) for a sprint retro.
   */
  app.post('/api/projects/retrospectives/:sprintId/sentiment', async (c) => {
    try {
      const sprintId = c.req.param('sprintId');
      const body = await c.req.json();
      const { sentiment } = z.object({ sentiment: z.enum(['happy', 'neutral', 'sad']) }).parse(body);

      const retro = getOrCreateRetro(sprintId);
      const col = sentiment === 'happy' ? 'sentiment_happy' : sentiment === 'neutral' ? 'sentiment_neutral' : 'sentiment_sad';
      sqlite.prepare(`UPDATE sprint_retrospectives SET ${col} = ${col} + 1, updated_at = ? WHERE id = ?`).run(now(), retro.id);

      const updated = sqlite.prepare('SELECT * FROM sprint_retrospectives WHERE id = ?').get(retro.id) as any;
      const items = sqlite.prepare('SELECT * FROM sprint_retro_items WHERE retro_id = ? ORDER BY votes DESC, created_at ASC').all(retro.id) as any[];
      return c.json({ success: true, data: formatRetro(updated, items) }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error recording sentiment', { error });
      return c.json({ success: false, error: 'Failed to record sentiment' }, 500);
    }
  });

  /**
   * POST /api/projects/retrospectives/:sprintId/items
   * Add a new item to a sprint's retrospective.
   */
  app.post('/api/projects/retrospectives/:sprintId/items', async (c) => {
    try {
      const sprintId = c.req.param('sprintId');
      const body = await c.req.json();
      const v = AddRetroItemSchema.parse(body);

      const retro = getOrCreateRetro(sprintId);
      const result = sqlite.prepare(`
        INSERT INTO sprint_retro_items (retro_id, category, content, author, votes, is_actionable, assignee, due_date, status)
        VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)
      `).run(retro.id, v.category, v.content, v.author, v.isActionable ? 1 : 0, v.assignee ?? null, v.dueDate ?? null, v.status);

      const item = sqlite.prepare('SELECT * FROM sprint_retro_items WHERE id = ?').get(result.lastInsertRowid) as any;
      logger.info('Retro item added', { sprintId, category: v.category });
      return c.json({ success: true, data: formatRetroItem(item) }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error adding retro item', { error });
      return c.json({ success: false, error: 'Failed to add retro item' }, 500);
    }
  });

  /**
   * POST /api/projects/retro-items/:id/vote
   * Upvote a retro item.
   */
  app.post('/api/projects/retro-items/:id/vote', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const existing = sqlite.prepare('SELECT id FROM sprint_retro_items WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Item not found' }, 404);

      sqlite.prepare('UPDATE sprint_retro_items SET votes = votes + 1, updated_at = ? WHERE id = ?').run(now(), id);
      const item = sqlite.prepare('SELECT * FROM sprint_retro_items WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: formatRetroItem(item) }, 200);
    } catch (error) {
      logger.error('Error voting on retro item', { error });
      return c.json({ success: false, error: 'Failed to vote on item' }, 500);
    }
  });

  /**
   * PATCH /api/projects/retro-items/:id
   * Update a retro item (status, content, assignee, etc.).
   */
  app.patch('/api/projects/retro-items/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const existing = sqlite.prepare('SELECT id FROM sprint_retro_items WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Item not found' }, 404);

      const body = await c.req.json();
      const v = UpdateRetroItemSchema.parse(body);

      const fields: string[] = [];
      const params: any[] = [];
      if (v.status !== undefined) { fields.push('status = ?'); params.push(v.status); }
      if (v.votes !== undefined) { fields.push('votes = ?'); params.push(v.votes); }
      if (v.content !== undefined) { fields.push('content = ?'); params.push(v.content); }
      if (v.assignee !== undefined) { fields.push('assignee = ?'); params.push(v.assignee); }
      if (v.dueDate !== undefined) { fields.push('due_date = ?'); params.push(v.dueDate); }

      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at = ?'); params.push(now());
      params.push(id);

      sqlite.prepare(`UPDATE sprint_retro_items SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const item = sqlite.prepare('SELECT * FROM sprint_retro_items WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: formatRetroItem(item) }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error updating retro item', { error });
      return c.json({ success: false, error: 'Failed to update retro item' }, 500);
    }
  });

  /**
   * DELETE /api/projects/retro-items/:id
   * Delete a retro item.
   */
  app.delete('/api/projects/retro-items/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const existing = sqlite.prepare('SELECT id FROM sprint_retro_items WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Item not found' }, 404);

      sqlite.prepare('DELETE FROM sprint_retro_items WHERE id = ?').run(id);
      logger.info('Retro item deleted', { id });
      return c.json({ success: true }, 200);
    } catch (error) {
      logger.error('Error deleting retro item', { error });
      return c.json({ success: false, error: 'Failed to delete retro item' }, 500);
    }
  });

  // ── SPRINT SETTINGS ──────────────────────────────────────────────────────

  // SprintSettingsSchema is declared at module level

  function formatSettings(row: any) {
    return {
      id: row.id,
      projectId: row.project_id ?? undefined,
      defaultDuration: row.default_duration,
      workingDays: JSON.parse(row.working_days),
      sprintStartDay: row.sprint_start_day,
      velocityTarget: row.velocity_target,
      maxCapacity: row.max_capacity,
      bufferPercentage: row.buffer_percentage,
      autoStartEnabled: Boolean(row.auto_start_enabled),
      notifications: JSON.parse(row.notifications),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * GET /api/projects/sprint-settings
   * Return sprint settings row, auto-creating defaults if none exist.
   */
  app.get('/api/projects/sprint-settings', (c) => {
    try {
      const projectId = c.req.query('projectId') ? parseInt(c.req.query('projectId')!, 10) : null;
      let row: any;
      if (projectId !== null) {
        row = sqlite.prepare('SELECT * FROM sprint_settings WHERE project_id = ?').get(projectId);
      } else {
        row = sqlite.prepare('SELECT * FROM sprint_settings WHERE project_id IS NULL LIMIT 1').get();
      }
      if (!row) {
        const result = sqlite.prepare('INSERT INTO sprint_settings (project_id) VALUES (?)').run(projectId);
        row = sqlite.prepare('SELECT * FROM sprint_settings WHERE id = ?').get(result.lastInsertRowid);
      }
      return c.json({ success: true, data: formatSettings(row) }, 200);
    } catch (error) {
      logger.error('Error getting sprint settings', { error });
      return c.json({ success: false, error: 'Failed to get sprint settings' }, 500);
    }
  });

  /**
   * PUT /api/projects/sprint-settings
   * Upsert sprint settings.
   */
  app.put('/api/projects/sprint-settings', async (c) => {
    try {
      const body = await c.req.json();
      const v = SprintSettingsSchema.parse(body);
      const projectId = v.projectId ?? null;

      let existing: any;
      if (projectId !== null) {
        existing = sqlite.prepare('SELECT id FROM sprint_settings WHERE project_id = ?').get(projectId);
      } else {
        existing = sqlite.prepare('SELECT id FROM sprint_settings WHERE project_id IS NULL LIMIT 1').get();
      }

      if (!existing) {
        sqlite.prepare(`
          INSERT INTO sprint_settings (project_id, default_duration, working_days, sprint_start_day, velocity_target, max_capacity, buffer_percentage, auto_start_enabled, notifications)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          projectId,
          v.defaultDuration ?? 14,
          JSON.stringify(v.workingDays ?? ['monday','tuesday','wednesday','thursday','friday']),
          v.sprintStartDay ?? 'monday',
          v.velocityTarget ?? 40,
          v.maxCapacity ?? 50,
          v.bufferPercentage ?? 20,
          v.autoStartEnabled !== undefined ? (v.autoStartEnabled ? 1 : 0) : 1,
          JSON.stringify(v.notifications ?? { sprintStart: true, sprintEnd: true, capacityWarning: true, dailyStandup: false })
        );
      } else {
        const fields: string[] = [];
        const params: any[] = [];
        if (v.defaultDuration !== undefined) { fields.push('default_duration = ?'); params.push(v.defaultDuration); }
        if (v.workingDays !== undefined) { fields.push('working_days = ?'); params.push(JSON.stringify(v.workingDays)); }
        if (v.sprintStartDay !== undefined) { fields.push('sprint_start_day = ?'); params.push(v.sprintStartDay); }
        if (v.velocityTarget !== undefined) { fields.push('velocity_target = ?'); params.push(v.velocityTarget); }
        if (v.maxCapacity !== undefined) { fields.push('max_capacity = ?'); params.push(v.maxCapacity); }
        if (v.bufferPercentage !== undefined) { fields.push('buffer_percentage = ?'); params.push(v.bufferPercentage); }
        if (v.autoStartEnabled !== undefined) { fields.push('auto_start_enabled = ?'); params.push(v.autoStartEnabled ? 1 : 0); }
        if (v.notifications !== undefined) { fields.push('notifications = ?'); params.push(JSON.stringify(v.notifications)); }
        if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
        fields.push('updated_at = ?'); params.push(now());
        params.push(existing.id);
        sqlite.prepare(`UPDATE sprint_settings SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      }

      let updated: any;
      if (projectId !== null) {
        updated = sqlite.prepare('SELECT * FROM sprint_settings WHERE project_id = ?').get(projectId);
      } else {
        updated = sqlite.prepare('SELECT * FROM sprint_settings WHERE project_id IS NULL LIMIT 1').get();
      }
      logger.info('Sprint settings saved');
      return c.json({ success: true, data: formatSettings(updated) }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error updating sprint settings', { error });
      return c.json({ success: false, error: 'Failed to update sprint settings' }, 500);
    }
  });

  // ── TASK COMMENTS ────────────────────────────────────────────────────────

  const CreateCommentSchema = z.object({
    author: z.string().min(1).max(200).default('Current User'),
    content: z.string().min(1),
  });

  /**
   * GET /api/projects/:id/tasks/:taskId/comments
   * List all comments for a task
   */
  app.get('/api/projects/:id/tasks/:taskId/comments', (c) => {
    try {
      const taskId = parseInt(c.req.param('taskId'), 10);
      const projectId = parseInt(c.req.param('id'), 10);
      const task = sqlite.prepare('SELECT id FROM project_tasks WHERE id = ? AND project_id = ?').get(taskId, projectId);
      if (!task) return c.json({ success: false, error: 'Task not found' }, 404);

      const rows = sqlite.prepare(
        'SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC'
      ).all(taskId) as any[];

      const data = rows.map((r: any) => ({
        id: r.id,
        taskId: r.task_id,
        projectId: r.project_id,
        author: r.author,
        content: r.content,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error listing task comments', { error });
      return c.json({ success: false, error: 'Failed to list comments' }, 500);
    }
  });

  // ── VELOCITY HISTORY ─────────────────────────────────────────────────────

  const CreateVelocityHistorySchema = z.object({
    sprintLabel: z.string().min(1).max(100),
    committed: z.number().int().min(0).default(0),
    completed: z.number().int().min(0).default(0),
    carryover: z.number().int().min(0).default(0),
  });

  /**
   * GET /api/projects/:id/velocity-history
   * Return historical velocity entries for a project, ordered oldest first
   */
  app.get('/api/projects/:id/velocity-history', (c) => {
    try {
      const projectId = parseInt(c.req.param('id'), 10);
      if (isNaN(projectId)) return c.json({ success: false, error: 'Invalid project id' }, 400);
      const rows = sqlite.prepare(
        'SELECT * FROM sprint_velocity_history WHERE project_id = ? ORDER BY recorded_at ASC'
      ).all(projectId) as any[];
      const data = rows.map((r: any) => ({
        id: r.id,
        projectId: r.project_id,
        sprintLabel: r.sprint_label,
        committed: r.committed,
        completed: r.completed,
        carryover: r.carryover,
        recordedAt: r.recorded_at,
      }));
      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error fetching velocity history', { error });
      return c.json({ success: false, error: 'Failed to fetch velocity history' }, 500);
    }
  });

  /**
   * POST /api/projects/:id/velocity-history
   * Record a sprint\'s velocity data
   */
  app.post('/api/projects/:id/velocity-history', async (c) => {
    try {
      const projectId = parseInt(c.req.param('id'), 10);
      if (isNaN(projectId)) return c.json({ success: false, error: 'Invalid project id' }, 400);
      const body = await c.req.json();
      const v = CreateVelocityHistorySchema.parse(body);
      const result = sqlite.prepare(
        'INSERT INTO sprint_velocity_history (project_id, sprint_label, committed, completed, carryover) VALUES (?, ?, ?, ?, ?)'
      ).run(projectId, v.sprintLabel, v.committed, v.completed, v.carryover);
      const row = sqlite.prepare('SELECT * FROM sprint_velocity_history WHERE id = ?').get(result.lastInsertRowid) as any;
      logger.info('Velocity history recorded', { projectId, sprintLabel: v.sprintLabel });
      return c.json({
        success: true,
        data: {
          id: row.id,
          projectId: row.project_id,
          sprintLabel: row.sprint_label,
          committed: row.committed,
          completed: row.completed,
          carryover: row.carryover,
          recordedAt: row.recorded_at,
        }
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error recording velocity history', { error });
      return c.json({ success: false, error: 'Failed to record velocity history' }, 500);
    }
  });

  // ── MILESTONES ───────────────────────────────────────────────────────────

  const CreateMilestoneSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
    projectId: z.number().int().optional(),
    owner: z.string().optional(),
    taskIds: z.array(z.string()).optional(),
  });

  function formatMilestone(row: any): object {
    return {
      id: String(row.id),
      title: row.title,
      description: row.description ?? '',
      dueDate: row.due_date ?? '',
      status: row.status,
      projectId: row.project_id ?? undefined,
      owner: row.owner ?? '',
      taskIds: (() => { try { return JSON.parse(row.task_ids || '[]'); } catch { return []; } })(),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * POST /api/projects/milestones
   * Create a new milestone
   */
  app.post('/api/projects/milestones', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateMilestoneSchema.parse(body);
      const result = sqlite.prepare(`
        INSERT INTO project_milestones (title, description, due_date, status, project_id, owner, task_ids)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        v.title, v.description ?? null, v.dueDate ?? null, v.status,
        v.projectId ?? null, v.owner ?? null, JSON.stringify(v.taskIds ?? [])
      );
      const row = sqlite.prepare('SELECT * FROM project_milestones WHERE id = ?').get(result.lastInsertRowid) as any;
      logger.info('Milestone created', { id: result.lastInsertRowid });
      return c.json({ success: true, data: formatMilestone(row) }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error creating milestone', { error });
      return c.json({ success: false, error: 'Failed to create milestone' }, 500);
    }
  });

  /**
   * PUT /api/projects/milestones/:id
   * Update a milestone
   */
  app.put('/api/projects/milestones/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const existing = sqlite.prepare('SELECT id FROM project_milestones WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Milestone not found' }, 404);

      const body = await c.req.json();
      if (Object.keys(body).length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      const v = CreateMilestoneSchema.partial().parse(body);

      const fields: string[] = [];
      const params: any[] = [];
      if (v.title !== undefined) { fields.push('title = ?'); params.push(v.title); }
      if (v.description !== undefined) { fields.push('description = ?'); params.push(v.description); }
      if (v.dueDate !== undefined) { fields.push('due_date = ?'); params.push(v.dueDate); }
      if (v.status !== undefined) { fields.push('status = ?'); params.push(v.status); }
      if (v.owner !== undefined) { fields.push('owner = ?'); params.push(v.owner); }
      if (v.taskIds !== undefined) { fields.push('task_ids = ?'); params.push(JSON.stringify(v.taskIds)); }

      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at = ?'); params.push(now());
      params.push(id);

      sqlite.prepare(`UPDATE project_milestones SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = sqlite.prepare('SELECT * FROM project_milestones WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: formatMilestone(updated) }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error updating milestone', { error });
      return c.json({ success: false, error: 'Failed to update milestone' }, 500);
    }
  });

  // ── RFI REGISTER ─────────────────────────────────────────────────────────

  const CreateRFISchema = z.object({
    subject: z.string().min(1).max(400),
    from: z.string().optional(),
    to: z.string().optional(),
    dateSubmitted: z.string().optional(),
    dueDate: z.string().optional(),
    status: z.enum(['Open', 'Closed', 'Overdue']).default('Open'),
    projectId: z.number().int().optional(),
    response: z.string().optional(),
  });

  function generateRfiNumber(): string {
    const n = (sqlite.prepare('SELECT COUNT(*) as n FROM project_rfi').get() as any).n + 1;
    return `RFI-${String(n).padStart(3, '0')}`;
  }

  function formatRFI(row: any): object {
    return {
      id: String(row.id),
      rfiNumber: row.rfi_number ?? `RFI-${String(row.id).padStart(3, '0')}`,
      subject: row.subject,
      from: row.from_party ?? '',
      to: row.to_party ?? '',
      dateSubmitted: row.date_submitted ?? '',
      dueDate: row.due_date ?? '',
      status: row.status,
      projectId: row.project_id ?? undefined,
      response: row.response ?? '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * POST /api/projects/rfi
   * Create a new RFI record
   */
  app.post('/api/projects/rfi', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateRFISchema.parse(body);
      const rfiNumber = generateRfiNumber();
      const result = sqlite.prepare(`
        INSERT INTO project_rfi (rfi_number, subject, from_party, to_party, date_submitted, due_date, status, project_id, response)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        rfiNumber, v.subject, v.from ?? null, v.to ?? null,
        v.dateSubmitted ?? new Date().toISOString().split('T')[0],
        v.dueDate ?? null, v.status, v.projectId ?? null, v.response ?? null
      );
      const row = sqlite.prepare('SELECT * FROM project_rfi WHERE id = ?').get(result.lastInsertRowid) as any;
      logger.info('RFI created', { id: result.lastInsertRowid, number: rfiNumber });
      return c.json({ success: true, data: formatRFI(row) }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error creating RFI', { error });
      return c.json({ success: false, error: 'Failed to create RFI' }, 500);
    }
  });

  /**
   * PUT /api/projects/rfi/:id
   * Update an RFI record
   */
  app.put('/api/projects/rfi/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const existing = sqlite.prepare('SELECT id FROM project_rfi WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'RFI not found' }, 404);

      const body = await c.req.json();
      if (Object.keys(body).length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      const v = CreateRFISchema.partial().parse(body);

      const fields: string[] = [];
      const params: any[] = [];
      if (v.subject !== undefined) { fields.push('subject = ?'); params.push(v.subject); }
      if (v.from !== undefined) { fields.push('from_party = ?'); params.push(v.from); }
      if (v.to !== undefined) { fields.push('to_party = ?'); params.push(v.to); }
      if (v.dateSubmitted !== undefined) { fields.push('date_submitted = ?'); params.push(v.dateSubmitted); }
      if (v.dueDate !== undefined) { fields.push('due_date = ?'); params.push(v.dueDate); }
      if (v.status !== undefined) { fields.push('status = ?'); params.push(v.status); }
      if (v.response !== undefined) { fields.push('response = ?'); params.push(v.response); }

      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at = ?'); params.push(now());
      params.push(id);

      sqlite.prepare(`UPDATE project_rfi SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = sqlite.prepare('SELECT * FROM project_rfi WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: formatRFI(updated) }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error updating RFI', { error });
      return c.json({ success: false, error: 'Failed to update RFI' }, 500);
    }
  });

  /**
   * POST /api/projects/:id/tasks/:taskId/comments
   * Add a comment to a task
   */
  app.post('/api/projects/:id/tasks/:taskId/comments', async (c) => {
    try {
      const taskId = parseInt(c.req.param('taskId'), 10);
      const projectId = parseInt(c.req.param('id'), 10);
      const task = sqlite.prepare('SELECT id FROM project_tasks WHERE id = ? AND project_id = ?').get(taskId, projectId);
      if (!task) return c.json({ success: false, error: 'Task not found' }, 404);

      const body = await c.req.json();
      const v = CreateCommentSchema.parse(body);

      const result = sqlite.prepare(
        'INSERT INTO task_comments (task_id, project_id, author, content) VALUES (?, ?, ?, ?)'
      ).run(taskId, projectId, v.author, v.content);

      const row = sqlite.prepare('SELECT * FROM task_comments WHERE id = ?').get(result.lastInsertRowid) as any;
      logger.info('Task comment added', { taskId, commentId: result.lastInsertRowid });

      return c.json({
        success: true,
        data: {
          id: row.id,
          taskId: row.task_id,
          projectId: row.project_id,
          author: row.author,
          content: row.content,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error adding task comment', { error });
      return c.json({ success: false, error: 'Failed to add comment' }, 500);
    }
  });
};
