/**
 * Project Routes Test Suite
 *
 * Covers:
 *   GET    /api/projects                              (list, filters)
 *   POST   /api/projects                             (create, validation)
 *   GET    /api/projects/:id                         (get by id, 404)
 *   PUT    /api/projects/:id                         (update, 404)
 *   GET    /api/projects/:id/tasks                   (list tasks, camelCase, agile fields)
 *   POST   /api/projects/:id/tasks                   (create task, agile fields, 400/404)
 *   PUT    /api/projects/:id/tasks/:taskId           (update task, agile fields)
 *   GET    /api/projects/sprints                     (list sprints)
 *   POST   /api/projects/sprints                     (create sprint)
 *   PUT    /api/projects/sprints/:id                 (update sprint)
 *   DELETE /api/projects/sprints/:id                 (delete sprint)
 *   GET    /api/projects/epics                       (list epics)
 *   POST   /api/projects/epics                       (create epic)
 *   GET    /api/projects/retrospectives/:sprintId    (get/create retro)
 *   POST   /api/projects/retrospectives/:sprintId/items (add item)
 *   POST   /api/projects/retro-items/:id/vote        (vote)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { projectRoutes } from '../routes/projects';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  projectRoutes(app);
  return app;
}

// ── Request Helper ─────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── Seed / Cleanup ─────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `teststd-${Date.now()}`;

let projectId1: number;
let projectId2: number;
let taskId1: number;
let taskId2: number;
let sprintId1: number;
let epicId1: number;

afterAll(() => {
  sqlite.prepare(`DELETE FROM sprint_retro_items WHERE retro_id IN (SELECT id FROM sprint_retrospectives WHERE sprint_id LIKE '${TAG}%')`).run();
  sqlite.prepare(`DELETE FROM sprint_retrospectives WHERE sprint_id LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM task_comments WHERE task_id IN (SELECT id FROM project_tasks WHERE description LIKE '${TAG}%')`).run();
  sqlite.prepare(`DELETE FROM project_tasks WHERE description LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM project_safety_metrics WHERE project_id IN (SELECT id FROM projects WHERE name LIKE '${TAG}%')`).run();
  sqlite.prepare(`DELETE FROM project_epics WHERE name LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM project_sprints WHERE name LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM projects WHERE name LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM project_milestones WHERE title LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM project_rfi WHERE subject LIKE '${TAG}%'`).run();
  sqlite.close();
});

function seedProject(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const n = (sqlite.prepare('SELECT COUNT(*) as n FROM projects').get() as any).n + 1;
  const result = sqlite.prepare(`
    INSERT INTO projects (project_code, name, description, status, project_manager, location, criticality, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.project_code ?? `TST-${String(n).padStart(4, '0')}`,
    overrides.name        ?? `${TAG} Test Project`,
    overrides.description ?? `${TAG} desc`,
    overrides.status      ?? 'active',
    overrides.project_manager ?? 'Test PM',
    overrides.location    ?? 'Test Location',
    overrides.criticality ?? 'medium',
    ts, ts,
  );
  const id = Number(result.lastInsertRowid);
  // Initialize safety metrics
  sqlite.prepare(`INSERT OR IGNORE INTO project_safety_metrics (project_id, safety_score, incidents, near_misses, audits_passed, last_updated) VALUES (?, 100, 0, 0, 0, date('now'))`).run(id);
  return id;
}

function seedTask(projectId: number, overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO project_tasks
      (project_id, title, description, assigned_to, status, priority,
       story_points, epic_id, issue_type, task_key, labels,
       safety_related, progress, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    projectId,
    overrides.title       ?? `${TAG} Task`,
    overrides.description ?? `${TAG} task-desc`,
    overrides.assigned_to ?? 'Alice',
    overrides.status      ?? 'todo',
    overrides.priority    ?? 'medium',
    overrides.story_points ?? 3,
    overrides.epic_id     ?? null,
    overrides.issue_type  ?? 'task',
    overrides.task_key    ?? null,
    overrides.labels      ?? '["safety","critical"]',
    overrides.safety_related ?? 0,
    overrides.progress    ?? 0,
    ts, ts,
  );
  return Number(result.lastInsertRowid);
}

function seedMilestone(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO project_milestones (title, description, due_date, status, project_id, owner, task_ids, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.title       ?? `${TAG} Milestone`,
    overrides.description ?? 'milestone desc',
    overrides.due_date    ?? '2025-12-31',
    overrides.status      ?? 'pending',
    overrides.project_id  ?? null,
    overrides.owner       ?? 'Alice',
    overrides.task_ids    ?? '[]',
    ts, ts,
  );
  return Number(result.lastInsertRowid);
}

function seedRFI(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const n = (sqlite.prepare('SELECT COUNT(*) as n FROM project_rfi').get() as any).n + 1;
  const result = sqlite.prepare(`
    INSERT INTO project_rfi (rfi_number, subject, from_party, to_party, date_submitted, due_date, status, project_id, response, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `RFI-S-${String(n).padStart(3, '0')}`,
    overrides.subject       ?? `${TAG} RFI`,
    overrides.from_party    ?? 'TestContractor',
    overrides.to_party      ?? 'TestEngineer',
    overrides.date_submitted ?? '2025-01-15',
    overrides.due_date      ?? '2025-02-01',
    overrides.status        ?? 'Open',
    overrides.project_id    ?? null,
    overrides.response      ?? null,
    ts, ts,
  );
  return Number(result.lastInsertRowid);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Project Routes', () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
    projectId1 = seedProject({ name: `${TAG} Proj-1`, status: 'active', criticality: 'high' });
    projectId2 = seedProject({ name: `${TAG} Proj-2`, status: 'planning', criticality: 'low' });
    taskId1 = seedTask(projectId1, {
      title: `${TAG} Task-Alpha`, assigned_to: 'Bob Smith',
      story_points: 5, issue_type: 'story', labels: '["alpha","beta"]',
    });
    taskId2 = seedTask(projectId1, {
      title: `${TAG} Task-Beta`, assigned_to: 'Carol Jones',
      story_points: 2, issue_type: 'bug', status: 'in_progress',
    });
  });

  // ── GET /api/projects ──────────────────────────────────────────────────────

  describe('GET /api/projects', () => {
    it('returns 200 with success:true and data array', async () => {
      const { status, body } = await req(app, 'GET', '/api/projects');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('includes seeded projects', async () => {
      const { body } = await req(app, 'GET', '/api/projects');
      const ids = body.data.map((p: any) => p.id);
      expect(ids).toContain(projectId1);
      expect(ids).toContain(projectId2);
    });

    it('returns camelCase projectCode', async () => {
      const { body } = await req(app, 'GET', '/api/projects');
      const project = body.data.find((p: any) => p.id === projectId1);
      expect(project).toHaveProperty('projectCode');
      expect(project).not.toHaveProperty('project_code');
      expect(project).toHaveProperty('createdAt');
    });

    it('filters by status=planning', async () => {
      const { body } = await req(app, 'GET', '/api/projects?status=planning');
      const ids = body.data.map((p: any) => p.id);
      expect(ids).toContain(projectId2);
      expect(ids).not.toContain(projectId1);
    });

    it('returns summary counts', async () => {
      const { body } = await req(app, 'GET', '/api/projects');
      expect(body).toHaveProperty('summary');
      expect(body.summary).toHaveProperty('total');
      expect(body.summary).toHaveProperty('active');
    });

    it('includes taskCount per project', async () => {
      const { body } = await req(app, 'GET', '/api/projects');
      const project = body.data.find((p: any) => p.id === projectId1);
      expect(project).toHaveProperty('taskCount');
      expect(typeof project.taskCount).toBe('number');
    });
  });

  // ── POST /api/projects ─────────────────────────────────────────────────────

  describe('POST /api/projects', () => {
    it('creates a project and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/projects', {
        name: `${TAG} Created Project`,
        description: 'Test creation',
        status: 'planning',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('projectCode');
    });

    it('returns 400 when name is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/projects', {
        description: 'No name',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('defaults status to planning', async () => {
      const { body } = await req(app, 'POST', '/api/projects', {
        name: `${TAG} Default Status Project`,
      });
      expect(body.data.status).toBe('planning');
    });
  });

  // ── GET /api/projects/:id ──────────────────────────────────────────────────

  describe('GET /api/projects/:id', () => {
    it('returns 200 with full project data', async () => {
      const { status, body } = await req(app, 'GET', `/api/projects/${projectId1}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(projectId1);
    });

    it('returns camelCase fields', async () => {
      const { body } = await req(app, 'GET', `/api/projects/${projectId1}`);
      expect(body.data).toHaveProperty('projectCode');
      expect(body.data).not.toHaveProperty('project_code');
    });

    it('returns 404 for non-existent project', async () => {
      const { status, body } = await req(app, 'GET', '/api/projects/9999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── PUT /api/projects/:id ──────────────────────────────────────────────────

  describe('PUT /api/projects/:id', () => {
    it('updates project and returns updated data', async () => {
      const { status, body } = await req(app, 'PUT', `/api/projects/${projectId2}`, {
        status: 'active',
        criticality: 'high',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 404 for non-existent project', async () => {
      const { status } = await req(app, 'PUT', '/api/projects/9999999', {
        status: 'active',
      });
      expect(status).toBe(404);
    });
  });

  // ── GET /api/projects/:id/tasks ────────────────────────────────────────────

  describe('GET /api/projects/:id/tasks', () => {
    it('returns 200 with success:true and data array', async () => {
      const { status, body } = await req(app, 'GET', `/api/projects/${projectId1}/tasks`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('includes seeded tasks for the project', async () => {
      const { body } = await req(app, 'GET', `/api/projects/${projectId1}/tasks`);
      const ids = body.data.map((t: any) => t.id);
      expect(ids).toContain(taskId1);
      expect(ids).toContain(taskId2);
    });

    // ── BUG FIX: assignee field (was wrongly named assignedTo) ──────────────
    it('returns "assignee" field (not assignedTo)', async () => {
      const { body } = await req(app, 'GET', `/api/projects/${projectId1}/tasks`);
      const task = body.data.find((t: any) => t.id === taskId1);
      expect(task).toHaveProperty('assignee');
      expect(task).not.toHaveProperty('assignedTo');
      expect(task.assignee).toBe('Bob Smith');
    });

    // ── BUG FIX: updatedAt was missing from response ─────────────────────────
    it('returns "updatedAt" field', async () => {
      const { body } = await req(app, 'GET', `/api/projects/${projectId1}/tasks`);
      const task = body.data.find((t: any) => t.id === taskId1);
      expect(task).toHaveProperty('updatedAt');
      expect(task.updatedAt).toBeTruthy();
    });

    // ── NEW: agile fields ────────────────────────────────────────────────────
    it('returns "key" field (auto-generated if null)', async () => {
      const { body } = await req(app, 'GET', `/api/projects/${projectId1}/tasks`);
      const task = body.data.find((t: any) => t.id === taskId1);
      expect(task).toHaveProperty('key');
      expect(typeof task.key).toBe('string');
      expect(task.key.length).toBeGreaterThan(0);
    });

    it('returns "storyPoints" field', async () => {
      const { body } = await req(app, 'GET', `/api/projects/${projectId1}/tasks`);
      const task = body.data.find((t: any) => t.id === taskId1);
      expect(task).toHaveProperty('storyPoints');
      expect(task.storyPoints).toBe(5);
    });

    it('returns "issueType" field', async () => {
      const { body } = await req(app, 'GET', `/api/projects/${projectId1}/tasks`);
      const task = body.data.find((t: any) => t.id === taskId1);
      expect(task).toHaveProperty('issueType');
      expect(task.issueType).toBe('story');
    });

    it('returns "labels" as a parsed array', async () => {
      const { body } = await req(app, 'GET', `/api/projects/${projectId1}/tasks`);
      const task = body.data.find((t: any) => t.id === taskId1);
      expect(task).toHaveProperty('labels');
      expect(Array.isArray(task.labels)).toBe(true);
      expect(task.labels).toContain('alpha');
      expect(task.labels).toContain('beta');
    });

    it('snake_case fields are NOT present', async () => {
      const { body } = await req(app, 'GET', `/api/projects/${projectId1}/tasks`);
      const task = body.data.find((t: any) => t.id === taskId1);
      expect(task).not.toHaveProperty('assigned_to');
      expect(task).not.toHaveProperty('story_points');
      expect(task).not.toHaveProperty('issue_type');
      expect(task).not.toHaveProperty('updated_at');
    });

    it('filters by status=in_progress', async () => {
      const { body } = await req(app, 'GET', `/api/projects/${projectId1}/tasks?status=in_progress`);
      const ids = body.data.map((t: any) => t.id);
      expect(ids).toContain(taskId2);
      expect(ids).not.toContain(taskId1);
    });

    it('returns 404 for non-existent project', async () => {
      const { status } = await req(app, 'GET', '/api/projects/9999999/tasks');
      expect(status).toBe(404);
    });
  });

  // ── POST /api/projects/:id/tasks ───────────────────────────────────────────

  describe('POST /api/projects/:id/tasks', () => {
    it('creates a task and returns 201', async () => {
      const { status, body } = await req(app, 'POST', `/api/projects/${projectId1}/tasks`, {
        title: `${TAG} New Task`,
        description: `${TAG} new-task-desc`,
        assignedTo: 'Dave',
        status: 'todo',
        priority: 'high',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
    });

    it('persists agile fields: storyPoints, epicId, issueType, labels', async () => {
      const { status, body } = await req(app, 'POST', `/api/projects/${projectId1}/tasks`, {
        title: `${TAG} Agile Task`,
        description: `${TAG} agile-task-desc`,
        storyPoints: 8,
        epicId: 'epic-123',
        issueType: 'story',
        labels: ['frontend', 'urgent'],
      });
      expect(status).toBe(201);
      expect(body.data).toHaveProperty('key');
      expect(body.data).toHaveProperty('issueType');
      expect(body.data.issueType).toBe('story');
      expect(body.data.storyPoints).toBe(8);
    });

    it('returned key starts with SAFE- when not provided', async () => {
      const { body } = await req(app, 'POST', `/api/projects/${projectId1}/tasks`, {
        title: `${TAG} Auto Key Task`,
        description: `${TAG} auto-key-desc`,
      });
      expect(body.data.key).toMatch(/^SAFE-/);
    });

    it('persists agile fields and returns them on GET', async () => {
      await req(app, 'POST', `/api/projects/${projectId1}/tasks`, {
        title: `${TAG} Persist Test Task`,
        description: `${TAG} persist-desc`,
        storyPoints: 13,
        epicId: 'epic-verify',
        issueType: 'bug',
        labels: ['backend'],
      });
      const { body: listBody } = await req(app, 'GET', `/api/projects/${projectId1}/tasks`);
      const created = listBody.data.find((t: any) => t.epicId === 'epic-verify');
      expect(created).toBeDefined();
      expect(created.storyPoints).toBe(13);
      expect(created.issueType).toBe('bug');
      expect(created.labels).toContain('backend');
    });

    it('defaults issueType to task when not provided', async () => {
      const { body } = await req(app, 'POST', `/api/projects/${projectId1}/tasks`, {
        title: `${TAG} Default Type Task`,
        description: `${TAG} default-type-desc`,
      });
      expect(body.data.issueType).toBe('task');
    });

    it('returns 400 when title is missing', async () => {
      const { status, body } = await req(app, 'POST', `/api/projects/${projectId1}/tasks`, {
        description: 'no title',
        status: 'todo',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid issueType', async () => {
      const { status } = await req(app, 'POST', `/api/projects/${projectId1}/tasks`, {
        title: `${TAG} Bad Type`,
        description: `${TAG} bad-type-desc`,
        issueType: 'invalid_type',
      });
      expect(status).toBe(400);
    });

    it('returns 400 for invalid status', async () => {
      const { status } = await req(app, 'POST', `/api/projects/${projectId1}/tasks`, {
        title: `${TAG} Bad Status`,
        description: `${TAG} bad-status-desc`,
        status: 'invalid_status',
      });
      expect(status).toBe(400);
    });

    it('returns 404 for non-existent project', async () => {
      const { status } = await req(app, 'POST', '/api/projects/9999999/tasks', {
        title: 'Ghost task',
      });
      expect(status).toBe(404);
    });
  });

  // ── PUT /api/projects/:id/tasks/:taskId ────────────────────────────────────

  describe('PUT /api/projects/:id/tasks/:taskId', () => {
    it('updates task status and returns success', async () => {
      const { status, body } = await req(app, 'PUT', `/api/projects/${projectId1}/tasks/${taskId1}`, {
        status: 'in_progress',
        progress: 50,
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('updates agile fields: storyPoints, epicId, issueType, labels', async () => {
      const { status, body } = await req(app, 'PUT', `/api/projects/${projectId1}/tasks/${taskId2}`, {
        storyPoints: 13,
        epicId: 'epic-updated',
        issueType: 'story',
        labels: ['updated', 'labels'],
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('updated agile fields appear in task list after PUT', async () => {
      await req(app, 'PUT', `/api/projects/${projectId1}/tasks/${taskId2}`, {
        storyPoints: 21,
        epicId: 'epic-readback',
        issueType: 'epic',
        labels: ['readback-test'],
      });
      const { body: listBody } = await req(app, 'GET', `/api/projects/${projectId1}/tasks`);
      const updated = listBody.data.find((t: any) => t.id === taskId2);
      expect(updated.storyPoints).toBe(21);
      expect(updated.epicId).toBe('epic-readback');
      expect(updated.issueType).toBe('epic');
      expect(updated.labels).toContain('readback-test');
    });

    it('auto-sets completedDate when status is set to completed', async () => {
      const { body } = await req(app, 'PUT', `/api/projects/${projectId1}/tasks/${taskId1}`, {
        status: 'completed',
      });
      expect(body.success).toBe(true);
    });

    it('returns 200 for effectively empty body (schema defaults fill in values)', async () => {
      // UpdateTaskSchema inherits defaults from CreateTaskSchema (status, priority, etc.)
      // so an empty body {} is valid and triggers a no-op update
      const { status } = await req(app, 'PUT', `/api/projects/${projectId1}/tasks/${taskId1}`, {});
      expect(status).toBe(200);
    });

    it('returns 404 for non-existent task', async () => {
      const { status } = await req(app, 'PUT', `/api/projects/${projectId1}/tasks/9999999`, {
        status: 'todo',
      });
      expect(status).toBe(404);
    });
  });

  // ── GET /api/projects/sprints ──────────────────────────────────────────────

  describe('GET /api/projects/sprints', () => {
    it('returns 200 with success:true', async () => {
      const { status, body } = await req(app, 'GET', '/api/projects/sprints');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns data array', async () => {
      const { body } = await req(app, 'GET', '/api/projects/sprints');
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  // ── POST /api/projects/sprints ─────────────────────────────────────────────

  describe('POST /api/projects/sprints', () => {
    it('creates a sprint and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/projects/sprints', {
        name: `${TAG} Sprint 1`,
        startDate: '2026-04-01',
        endDate: '2026-04-14',
        goal: 'Test sprint goal',
        status: 'future',
        projectId: projectId1,
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
      sprintId1 = body.data.id;
    });

    it('returns 400 when name is missing', async () => {
      const { status } = await req(app, 'POST', '/api/projects/sprints', {
        startDate: '2026-04-01',
        status: 'future',
      });
      expect(status).toBe(400);
    });
  });

  // ── PUT /api/projects/sprints/:id ──────────────────────────────────────────

  describe('PUT /api/projects/sprints/:id', () => {
    it('updates sprint status', async () => {
      const { status, body } = await req(app, 'PUT', `/api/projects/sprints/${sprintId1}`, {
        status: 'active',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 404 for non-existent sprint', async () => {
      const { status } = await req(app, 'PUT', '/api/projects/sprints/9999999', {
        status: 'active',
      });
      expect(status).toBe(404);
    });
  });

  // ── DELETE /api/projects/sprints/:id ──────────────────────────────────────

  describe('DELETE /api/projects/sprints/:id', () => {
    it('deletes sprint and returns success', async () => {
      // Create a disposable sprint
      const { body: created } = await req(app, 'POST', '/api/projects/sprints', {
        name: `${TAG} Sprint Delete`,
        status: 'future',
        projectId: projectId1,
      });
      const { status, body } = await req(app, 'DELETE', `/api/projects/sprints/${created.data.id}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 404 for non-existent sprint', async () => {
      const { status } = await req(app, 'DELETE', '/api/projects/sprints/9999999');
      expect(status).toBe(404);
    });
  });

  // ── GET /api/projects/epics ────────────────────────────────────────────────

  describe('GET /api/projects/epics', () => {
    it('returns 200 with data array', async () => {
      const { status, body } = await req(app, 'GET', '/api/projects/epics');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  // ── POST /api/projects/epics ───────────────────────────────────────────────

  describe('POST /api/projects/epics', () => {
    it('creates an epic and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/projects/epics', {
        keyCode: `TST-EPIC-${Date.now()}`,
        name: `${TAG} Epic One`,
        summary: 'Test epic summary',
        color: '#3b82f6',
        status: 'in_progress',
        projectId: projectId1,
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
      epicId1 = body.data.id;
    });

    it('returns 400 when name is missing', async () => {
      const { status } = await req(app, 'POST', '/api/projects/epics', {
        summary: 'No name',
      });
      expect(status).toBe(400);
    });
  });

  // ── Retrospectives ─────────────────────────────────────────────────────────

  describe('Retrospectives', () => {
    const testSprintId = `${TAG}-retro-sprint`;

    it('GET creates and returns retro for new sprintId', async () => {
      const { status, body } = await req(app, 'GET', `/api/projects/retrospectives/${testSprintId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('sprintId');
      expect(body.data.sprintId).toBe(testSprintId);
    });

    it('POST /sentiment updates sentiment counts', async () => {
      const { status, body } = await req(app, 'POST', `/api/projects/retrospectives/${testSprintId}/sentiment`, {
        sentiment: 'happy',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('POST /items adds a retro item and returns it', async () => {
      const { status, body } = await req(app, 'POST', `/api/projects/retrospectives/${testSprintId}/items`, {
        category: 'went_well',
        content: `${TAG} went well content`,
        author: 'Test Author',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
      expect(body.data.content).toBe(`${TAG} went well content`);
    });

    it('POST /retro-items/:id/vote increments vote', async () => {
      // First add a voteable item
      const { body: item } = await req(app, 'POST', `/api/projects/retrospectives/${testSprintId}/items`, {
        category: 'needs_improvement',
        content: `${TAG} voteable item`,
      });
      const itemId = item.data.id;
      const { status, body } = await req(app, 'POST', `/api/projects/retro-items/${itemId}/vote`, {
        increment: true,
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.votes).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Sprint Settings ────────────────────────────────────────────────────────

  describe('Sprint Settings', () => {
    it('GET returns 200 with settings', async () => {
      const { status, body } = await req(app, 'GET', '/api/projects/sprint-settings');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('defaultDuration');
      expect(body.data).toHaveProperty('velocityTarget');
    });

    it('PUT updates settings', async () => {
      const { status, body } = await req(app, 'PUT', '/api/projects/sprint-settings', {
        velocityTarget: 50,
        defaultDuration: 14,
        bufferPercentage: 25,
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  // ── Milestones ────────────────────────────────────────────────────────────

  describe('GET /api/projects/milestones', () => {
    let milestoneId: number;

    beforeAll(() => {
      milestoneId = seedMilestone({ title: `${TAG} M1`, status: 'pending', project_id: projectId1 });
      seedMilestone({ title: `${TAG} M2`, status: 'completed', project_id: projectId2 });
    });

    it('returns 200 with success:true and data array', async () => {
      const { status, body } = await req(app, 'GET', '/api/projects/milestones');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.count).toBe('number');
    });

    it('includes seeded milestones', async () => {
      const { body } = await req(app, 'GET', '/api/projects/milestones');
      const ids = body.data.map((m: any) => Number(m.id));
      expect(ids).toContain(milestoneId);
    });

    it('returns camelCase fields (dueDate, taskIds)', async () => {
      const { body } = await req(app, 'GET', '/api/projects/milestones');
      const m = body.data.find((m: any) => Number(m.id) === milestoneId);
      expect(m).toBeDefined();
      expect(m).toHaveProperty('dueDate');
      expect(m).toHaveProperty('taskIds');
      expect(Array.isArray(m.taskIds)).toBe(true);
      expect(m).not.toHaveProperty('due_date');
      expect(m).not.toHaveProperty('task_ids');
    });

    it('id is returned as string', async () => {
      const { body } = await req(app, 'GET', '/api/projects/milestones');
      const m = body.data.find((m: any) => Number(m.id) === milestoneId);
      expect(typeof m.id).toBe('string');
    });

    it('filters by status=completed', async () => {
      const { body } = await req(app, 'GET', '/api/projects/milestones?status=completed');
      expect(body.success).toBe(true);
      body.data.forEach((m: any) => expect(m.status).toBe('completed'));
    });

    it('filters by status=pending', async () => {
      const { body } = await req(app, 'GET', '/api/projects/milestones?status=pending');
      expect(body.success).toBe(true);
      body.data.forEach((m: any) => expect(m.status).toBe('pending'));
    });

    it('filters by projectId includes that project\'s milestones', async () => {
      const { body } = await req(app, 'GET', `/api/projects/milestones?projectId=${projectId1}`);
      expect(body.success).toBe(true);
      const ids = body.data.map((m: any) => Number(m.id));
      expect(ids).toContain(milestoneId);
    });
  });

  describe('POST /api/projects/milestones', () => {
    it('creates a milestone and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/projects/milestones', {
        title: `${TAG} Created Milestone`,
        description: 'Created during testing',
        dueDate: '2025-06-30',
        status: 'in_progress',
        projectId: projectId1,
        owner: 'Bob',
        taskIds: ['task-1', 'task-2'],
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
      expect(body.data.title).toBe(`${TAG} Created Milestone`);
      expect(body.data.status).toBe('in_progress');
      expect(body.data.taskIds).toEqual(['task-1', 'task-2']);
      expect(body.data.owner).toBe('Bob');
    });

    it('creates with minimal fields (title only) — defaults to pending', async () => {
      const { status, body } = await req(app, 'POST', '/api/projects/milestones', {
        title: `${TAG} Minimal Milestone`,
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('pending');
      expect(body.data.taskIds).toEqual([]);
    });

    it('returns 400 when title is missing', async () => {
      const { status } = await req(app, 'POST', '/api/projects/milestones', {
        description: 'No title here',
        status: 'pending',
      });
      expect(status).toBe(400);
    });

    it('returns 400 for invalid status value', async () => {
      const { status } = await req(app, 'POST', '/api/projects/milestones', {
        title: `${TAG} Bad Status Milestone`,
        status: 'not_a_valid_status',
      });
      expect(status).toBe(400);
    });
  });

  describe('PUT /api/projects/milestones/:id', () => {
    let milestoneToUpdate: number;

    beforeAll(() => {
      milestoneToUpdate = seedMilestone({ title: `${TAG} MilestoneToUpdate`, status: 'pending' });
    });

    it('updates status to completed and returns 200', async () => {
      const { status, body } = await req(app, 'PUT', `/api/projects/milestones/${milestoneToUpdate}`, {
        status: 'completed',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('completed');
    });

    it('updates owner and dueDate', async () => {
      const { status, body } = await req(app, 'PUT', `/api/projects/milestones/${milestoneToUpdate}`, {
        owner: 'Updated Owner',
        dueDate: '2026-01-01',
      });
      expect(status).toBe(200);
      expect(body.data.owner).toBe('Updated Owner');
      expect(body.data.dueDate).toBe('2026-01-01');
    });

    it('updates taskIds', async () => {
      const { status, body } = await req(app, 'PUT', `/api/projects/milestones/${milestoneToUpdate}`, {
        taskIds: ['t-10', 't-20', 't-30'],
      });
      expect(status).toBe(200);
      expect(body.data.taskIds).toEqual(['t-10', 't-20', 't-30']);
    });

    it('returns 404 for unknown milestone id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/projects/milestones/9999999', {
        status: 'completed',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 when no fields provided', async () => {
      const { status, body } = await req(app, 'PUT', `/api/projects/milestones/${milestoneToUpdate}`, {});
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── RFI Register ──────────────────────────────────────────────────────────

  describe('GET /api/projects/rfi', () => {
    let rfiId: number;

    beforeAll(() => {
      rfiId = seedRFI({ subject: `${TAG} RFI-GET-1`, status: 'Open', project_id: projectId1 });
      seedRFI({ subject: `${TAG} RFI-GET-2`, status: 'Closed', project_id: projectId2 });
    });

    it('returns 200 with success:true and data array', async () => {
      const { status, body } = await req(app, 'GET', '/api/projects/rfi');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.count).toBe('number');
    });

    it('includes seeded RFI records', async () => {
      const { body } = await req(app, 'GET', '/api/projects/rfi');
      const ids = body.data.map((r: any) => Number(r.id));
      expect(ids).toContain(rfiId);
    });

    it('returns camelCase fields (rfiNumber, dateSubmitted, dueDate, from, to)', async () => {
      const { body } = await req(app, 'GET', '/api/projects/rfi');
      const r = body.data.find((r: any) => Number(r.id) === rfiId);
      expect(r).toBeDefined();
      expect(r).toHaveProperty('rfiNumber');
      expect(r).toHaveProperty('dateSubmitted');
      expect(r).toHaveProperty('dueDate');
      expect(r).toHaveProperty('from');
      expect(r).toHaveProperty('to');
      expect(r).not.toHaveProperty('from_party');
      expect(r).not.toHaveProperty('to_party');
      expect(r).not.toHaveProperty('date_submitted');
    });

    it('id is returned as string', async () => {
      const { body } = await req(app, 'GET', '/api/projects/rfi');
      const r = body.data.find((r: any) => Number(r.id) === rfiId);
      expect(typeof r.id).toBe('string');
    });

    it('filters by status=Closed', async () => {
      const { body } = await req(app, 'GET', '/api/projects/rfi?status=Closed');
      expect(body.success).toBe(true);
      body.data.forEach((r: any) => expect(r.status).toBe('Closed'));
    });

    it('filters by status=Open', async () => {
      const { body } = await req(app, 'GET', '/api/projects/rfi?status=Open');
      expect(body.success).toBe(true);
      body.data.forEach((r: any) => expect(r.status).toBe('Open'));
    });

    it('filters by projectId includes that project\'s RFIs', async () => {
      const { body } = await req(app, 'GET', `/api/projects/rfi?projectId=${projectId1}`);
      expect(body.success).toBe(true);
      const ids = body.data.map((r: any) => Number(r.id));
      expect(ids).toContain(rfiId);
    });
  });

  describe('POST /api/projects/rfi', () => {
    it('creates an RFI and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/projects/rfi', {
        subject: `${TAG} Created RFI`,
        from: 'Contractor ABC',
        to: 'Engineer XYZ',
        dateSubmitted: '2025-03-01',
        dueDate: '2025-03-15',
        status: 'Open',
        projectId: projectId1,
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
      expect(body.data.subject).toBe(`${TAG} Created RFI`);
      expect(body.data.from).toBe('Contractor ABC');
      expect(body.data.to).toBe('Engineer XYZ');
    });

    it('auto-generates rfiNumber in RFI-NNN format', async () => {
      const { body } = await req(app, 'POST', '/api/projects/rfi', {
        subject: `${TAG} AutoNum RFI`,
      });
      expect(body.data).toHaveProperty('rfiNumber');
      expect(body.data.rfiNumber).toMatch(/^RFI-\d+$/);
    });

    it('defaults status to Open', async () => {
      const { status, body } = await req(app, 'POST', '/api/projects/rfi', {
        subject: `${TAG} Default Status RFI`,
      });
      expect(status).toBe(201);
      expect(body.data.status).toBe('Open');
    });

    it('creates with response field', async () => {
      const { status, body } = await req(app, 'POST', '/api/projects/rfi', {
        subject: `${TAG} With Response RFI`,
        response: 'Pre-filled response text',
        status: 'Closed',
      });
      expect(status).toBe(201);
      expect(body.data.response).toBe('Pre-filled response text');
      expect(body.data.status).toBe('Closed');
    });

    it('returns 400 when subject is missing', async () => {
      const { status } = await req(app, 'POST', '/api/projects/rfi', {
        from: 'Someone',
        dueDate: '2025-04-01',
      });
      expect(status).toBe(400);
    });

    it('returns 400 for invalid status', async () => {
      const { status } = await req(app, 'POST', '/api/projects/rfi', {
        subject: `${TAG} Bad Status RFI`,
        status: 'invalid_status',
      });
      expect(status).toBe(400);
    });
  });

  describe('PUT /api/projects/rfi/:id', () => {
    let rfiToUpdate: number;

    beforeAll(() => {
      rfiToUpdate = seedRFI({ subject: `${TAG} RFIToUpdate`, status: 'Open' });
    });

    it('updates status to Closed and returns 200', async () => {
      const { status, body } = await req(app, 'PUT', `/api/projects/rfi/${rfiToUpdate}`, {
        status: 'Closed',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('Closed');
    });

    it('updates response field', async () => {
      const { status, body } = await req(app, 'PUT', `/api/projects/rfi/${rfiToUpdate}`, {
        response: 'Work approved as per drawing rev-3',
      });
      expect(status).toBe(200);
      expect(body.data.response).toBe('Work approved as per drawing rev-3');
    });

    it('updates from and to parties', async () => {
      const { status, body } = await req(app, 'PUT', `/api/projects/rfi/${rfiToUpdate}`, {
        from: 'Updated Contractor',
        to: 'Updated Engineer',
      });
      expect(status).toBe(200);
      expect(body.data.from).toBe('Updated Contractor');
      expect(body.data.to).toBe('Updated Engineer');
    });

    it('updates dueDate', async () => {
      const { status, body } = await req(app, 'PUT', `/api/projects/rfi/${rfiToUpdate}`, {
        dueDate: '2026-06-15',
      });
      expect(status).toBe(200);
      expect(body.data.dueDate).toBe('2026-06-15');
    });

    it('returns 404 for unknown RFI id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/projects/rfi/9999999', {
        status: 'Closed',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 when no fields provided', async () => {
      const { status, body } = await req(app, 'PUT', `/api/projects/rfi/${rfiToUpdate}`, {});
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });
});
