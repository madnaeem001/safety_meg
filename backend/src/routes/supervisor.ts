import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { createLogger } from '../services/logger';
import { DB_PATH } from '../config/env';

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');

const logger = createLogger('Supervisor');

// ── VALIDATION SCHEMAS ────────────────────────────────────────────────────

const CreateApprovalSchema = z.object({
  type: z.enum(['incident', 'training', 'permit', 'capa', 'leave', 'other']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  requestedBy: z.number().int().optional(),
  requestedByName: z.string().optional(),
  assignedTo: z.number().int().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  relatedId: z.number().int().optional(),
});

const ApprovalActionSchema = z.object({
  comment: z.string().optional(),
  approvedBy: z.number().int().optional(),
  approvedByName: z.string().optional(),
});

const DelegateSchema = z.object({
  workerId: z.number().int(),
  taskType: z.string().min(1),
  taskTitle: z.string().min(1).max(200),
  taskId: z.number().int().optional(),
  assignedBy: z.number().int().optional(),
  assignmentDate: z.string(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

const LeaderboardUpsertSchema = z.object({
  workerId: z.number().int(),
  workerName: z.string().optional(),
  department: z.string().optional(),
  safetyPoints: z.number().int().min(0).optional(),
  incidentsFreedays: z.number().int().min(0).optional(),
  trainingScore: z.number().min(0).max(100).optional(),
  certificationsCount: z.number().int().min(0).optional(),
  badges: z.array(z.string()).optional(),
  period: z.enum(['weekly', 'monthly', 'quarterly', 'annual']).default('monthly'),
});

// ── HELPERS ───────────────────────────────────────────────────────────────

function now(): number { return Date.now(); }

function mapApproval(r: any) {
  return {
    id: r.id, type: r.type, title: r.title, description: r.description,
    requestedBy: r.requested_by, requestedByName: r.requested_by_name,
    assignedTo: r.assigned_to, status: r.status,
    approvedBy: r.approved_by, approvedByName: r.approved_by_name,
    approvalDate: r.approval_date, comment: r.comment, priority: r.priority,
    relatedId: r.related_id, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function recalcRanks(period: string) {
  const rows = sqlite.prepare(
    `SELECT id FROM leaderboard WHERE period = ? ORDER BY safety_points DESC`
  ).all(period) as any[];
  const stmt = sqlite.prepare('UPDATE leaderboard SET rank = ? WHERE id = ?');
  rows.forEach((r: any, i: number) => stmt.run(i + 1, r.id));
}

export const supervisorRoutes = (app: Hono) => {

  /**
   * GET /api/supervisor/approvals
   * List pending (or filtered) approvals
   */
  app.get('/api/supervisor/approvals', (c) => {
    try {
      const status = c.req.query('status') ?? 'pending';
      const type = c.req.query('type');
      const priority = c.req.query('priority');
      const assignedTo = c.req.query('assignedTo');

      let query = 'SELECT * FROM approvals WHERE 1=1';
      const params: any[] = [];
      if (status !== 'all') { query += ' AND status = ?'; params.push(status); }
      if (type) { query += ' AND type = ?'; params.push(type); }
      if (priority) { query += ' AND priority = ?'; params.push(priority); }
      if (assignedTo) { query += ' AND assigned_to = ?'; params.push(parseInt(assignedTo, 10)); }
      query += ' ORDER BY created_at DESC';

      const rows = sqlite.prepare(query).all(...params) as any[];
      const data = rows.map(mapApproval);

      const summary = {
        pending: sqlite.prepare('SELECT COUNT(*) as n FROM approvals WHERE status = ?').get('pending') as any,
        approved: sqlite.prepare('SELECT COUNT(*) as n FROM approvals WHERE status = ?').get('approved') as any,
        rejected: sqlite.prepare('SELECT COUNT(*) as n FROM approvals WHERE status = ?').get('rejected') as any,
      };

      return c.json({
        success: true, data, count: data.length,
        summary: { pending: summary.pending.n, approved: summary.approved.n, rejected: summary.rejected.n },
      }, 200);
    } catch (error) {
      logger.error('Error listing approvals', { error });
      return c.json({ success: false, error: 'Failed to list approvals' }, 500);
    }
  });

  /**
   * POST /api/supervisor/approvals
   * Create a new approval request
   */
  app.post('/api/supervisor/approvals', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateApprovalSchema.parse(body);

      const result = sqlite.prepare(`
        INSERT INTO approvals (type, title, description, requested_by, requested_by_name,
          assigned_to, priority, related_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(v.type, v.title, v.description ?? null, v.requestedBy ?? null,
        v.requestedByName ?? null, v.assignedTo ?? null, v.priority, v.relatedId ?? null);

      logger.info('Approval request created', { id: result.lastInsertRowid });
      return c.json({ success: true, data: { id: result.lastInsertRowid, type: v.type, title: v.title, status: 'pending' } }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error creating approval', { error });
      return c.json({ success: false, error: 'Failed to create approval request' }, 500);
    }
  });

  /**
   * POST /api/supervisor/approvals/:id/approve
   * Approve a request
   */
  app.post('/api/supervisor/approvals/:id/approve', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const existing = sqlite.prepare('SELECT id, status FROM approvals WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Approval not found' }, 404);
      if (existing.status !== 'pending') return c.json({ success: false, error: `Cannot approve — current status: ${existing.status}` }, 400);

      const body = await c.req.json().catch(() => ({}));
      const v = ApprovalActionSchema.parse(body);
      const today = new Date().toISOString().slice(0, 10);

      sqlite.prepare(`
        UPDATE approvals SET status = 'approved', approved_by = ?, approved_by_name = ?,
          approval_date = ?, comment = ?, updated_at = ? WHERE id = ?
      `).run(v.approvedBy ?? null, v.approvedByName ?? null, today, v.comment ?? null, now(), id);

      logger.info('Approval approved', { id });
      return c.json({ success: true, data: { id, status: 'approved', approvalDate: today } }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error approving request', { error });
      return c.json({ success: false, error: 'Failed to approve request' }, 500);
    }
  });

  /**
   * POST /api/supervisor/approvals/:id/reject
   * Reject a request
   */
  app.post('/api/supervisor/approvals/:id/reject', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const existing = sqlite.prepare('SELECT id, status FROM approvals WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Approval not found' }, 404);
      if (existing.status !== 'pending') return c.json({ success: false, error: `Cannot reject — current status: ${existing.status}` }, 400);

      const body = await c.req.json().catch(() => ({}));
      const v = ApprovalActionSchema.parse(body);

      sqlite.prepare(`
        UPDATE approvals SET status = 'rejected', approved_by = ?, approved_by_name = ?,
          approval_date = ?, comment = ?, updated_at = ? WHERE id = ?
      `).run(v.approvedBy ?? null, v.approvedByName ?? null, new Date().toISOString().slice(0, 10), v.comment ?? null, now(), id);

      logger.info('Approval rejected', { id });
      return c.json({ success: true, data: { id, status: 'rejected' } }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error rejecting request', { error });
      return c.json({ success: false, error: 'Failed to reject request' }, 500);
    }
  });

  /**
   * GET /api/supervisor/leaderboard
   * Safety rankings with scores
   */
  app.get('/api/supervisor/leaderboard', (c) => {
    try {
      const period = c.req.query('period') ?? 'monthly';
      const department = c.req.query('department');
      const limit = parseInt(c.req.query('limit') ?? '20', 10);

      let query = `SELECT l.*, w.email, w.status as worker_status
        FROM leaderboard l
        LEFT JOIN workers w ON w.id = l.worker_id
        WHERE l.period = ?`;
      const params: any[] = [period];
      if (department) { query += ' AND l.department = ?'; params.push(department); }
      query += ' ORDER BY l.safety_points DESC LIMIT ?';
      params.push(limit);

      const rows = sqlite.prepare(query).all(...params) as any[];
      const data = rows.map((r: any) => ({
        rank: r.rank, workerId: r.worker_id, workerName: r.worker_name,
        department: r.department, safetyPoints: r.safety_points,
        incidentsFreedays: r.incidents_free_days, trainingScore: r.training_score,
        certificationsCount: r.certifications_count,
        badges: (() => { try { return JSON.parse(r.badges); } catch { return []; } })(),
        period: r.period, updatedAt: r.updated_at,
      }));

      return c.json({ success: true, data, count: data.length, period }, 200);
    } catch (error) {
      logger.error('Error fetching leaderboard', { error });
      return c.json({ success: false, error: 'Failed to fetch leaderboard' }, 500);
    }
  });

  /**
   * POST /api/supervisor/leaderboard
   * Upsert a worker's leaderboard entry (used by cron / admin)
   */
  app.post('/api/supervisor/leaderboard', async (c) => {
    try {
      const body = await c.req.json();
      const v = LeaderboardUpsertSchema.parse(body);

      const worker = sqlite.prepare('SELECT id, name, department FROM workers WHERE id = ?').get(v.workerId) as any;
      const workerName = v.workerName ?? worker?.name ?? '';
      const department = v.department ?? worker?.department ?? '';

      const existing = sqlite.prepare('SELECT id FROM leaderboard WHERE worker_id = ? AND period = ?').get(v.workerId, v.period);
      if (existing) {
        const fields: string[] = ['worker_name = ?', 'department = ?', 'updated_at = ?'];
        const params: any[] = [workerName, department, now()];
        if (v.safetyPoints !== undefined) { fields.push('safety_points = ?'); params.push(v.safetyPoints); }
        if (v.incidentsFreedays !== undefined) { fields.push('incidents_free_days = ?'); params.push(v.incidentsFreedays); }
        if (v.trainingScore !== undefined) { fields.push('training_score = ?'); params.push(v.trainingScore); }
        if (v.certificationsCount !== undefined) { fields.push('certifications_count = ?'); params.push(v.certificationsCount); }
        if (v.badges !== undefined) { fields.push('badges = ?'); params.push(JSON.stringify(v.badges)); }
        params.push(v.workerId, v.period);
        sqlite.prepare(`UPDATE leaderboard SET ${fields.join(', ')} WHERE worker_id = ? AND period = ?`).run(...params);
      } else {
        sqlite.prepare(`
          INSERT INTO leaderboard (worker_id, worker_name, department, safety_points,
            incidents_free_days, training_score, certifications_count, badges, period, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(v.workerId, workerName, department, v.safetyPoints ?? 0, v.incidentsFreedays ?? 0,
          v.trainingScore ?? 0, v.certificationsCount ?? 0, JSON.stringify(v.badges ?? []), v.period, now());
      }

      recalcRanks(v.period);
      logger.info('Leaderboard updated', { workerId: v.workerId });
      return c.json({ success: true, message: 'Leaderboard entry updated', data: { workerId: v.workerId, period: v.period } }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error updating leaderboard', { error });
      return c.json({ success: false, error: 'Failed to update leaderboard' }, 500);
    }
  });

  /**
   * GET /api/supervisor/team-metrics
   * Aggregate team performance (by department or supervisor)
   */
  app.get('/api/supervisor/team-metrics', (c) => {
    try {
      const department = c.req.query('department');
      const managerId = c.req.query('managerId');

      let workerFilter = 'WHERE 1=1';
      const wParams: any[] = [];
      if (department) { workerFilter += ' AND department = ?'; wParams.push(department); }
      if (managerId) { workerFilter += ' AND manager_id = ?'; wParams.push(parseInt(managerId, 10)); }

      const workers = sqlite.prepare(`SELECT id, name, department FROM workers ${workerFilter}`).all(...wParams) as any[];
      const workerIds = workers.map((w: any) => w.id);

      if (workerIds.length === 0) {
        return c.json({ success: true, data: { teamSize: 0, avgSafetyScore: 0, totalIncidents: 0, avgTrainingRate: 0, members: [] } }, 200);
      }

      const placeholders = workerIds.map(() => '?').join(',');
      const perfRows = sqlite.prepare(
        `SELECT * FROM worker_performance WHERE worker_id IN (${placeholders})`
      ).all(...workerIds) as any[];

      const perfMap: Record<number, any> = {};
      perfRows.forEach((p: any) => { perfMap[p.worker_id] = p; });

      const memberStats = workers.map((w: any) => {
        const p = perfMap[w.id];
        return {
          workerId: w.id, name: w.name, department: w.department,
          safetyScore: p?.safety_score ?? 100,
          trainingCompletionRate: p?.training_completion_rate ?? 0,
          incidentsReported: p?.incidents_reported ?? 0,
          incidentsFreedays: p?.incidents_free_days ?? 0,
        };
      });

      const avgSafetyScore = memberStats.reduce((s: number, m: any) => s + m.safetyScore, 0) / memberStats.length;
      const avgTrainingRate = memberStats.reduce((s: number, m: any) => s + m.trainingCompletionRate, 0) / memberStats.length;
      const totalIncidents = memberStats.reduce((s: number, m: any) => s + m.incidentsReported, 0);

      // Pending approvals for this team
      const pendingApprovals = managerId
        ? (sqlite.prepare('SELECT COUNT(*) as n FROM approvals WHERE assigned_to = ? AND status = ?').get(parseInt(managerId, 10), 'pending') as any).n
        : null;

      return c.json({
        success: true,
        data: {
          teamSize: workers.length,
          avgSafetyScore: Math.round(avgSafetyScore * 10) / 10,
          avgTrainingRate: Math.round(avgTrainingRate * 10) / 10,
          totalIncidents,
          pendingApprovals,
          members: memberStats,
          department: department ?? 'all',
        }
      }, 200);
    } catch (error) {
      logger.error('Error fetching team metrics', { error });
      return c.json({ success: false, error: 'Failed to fetch team metrics' }, 500);
    }
  });

  /**
   * POST /api/supervisor/delegation
   * Assign a task to a worker
   */
  app.post('/api/supervisor/delegation', async (c) => {
    try {
      const body = await c.req.json();
      const v = DelegateSchema.parse(body);

      const worker = sqlite.prepare('SELECT id, name FROM workers WHERE id = ?').get(v.workerId) as any;
      if (!worker) return c.json({ success: false, error: 'Worker not found' }, 404);

      const result = sqlite.prepare(`
        INSERT INTO worker_assignments (worker_id, task_type, task_id, task_title,
          assigned_by, assignment_date, due_date, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(v.workerId, v.taskType, v.taskId ?? null, v.taskTitle, v.assignedBy ?? null,
        v.assignmentDate, v.dueDate ?? null, v.notes ?? null);

      logger.info('Task delegated', { assignmentId: result.lastInsertRowid, workerId: v.workerId });
      return c.json({
        success: true,
        data: {
          id: result.lastInsertRowid,
          workerId: v.workerId,
          workerName: worker.name,
          taskTitle: v.taskTitle,
          taskType: v.taskType,
          status: 'pending',
        }
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error delegating task', { error });
      return c.json({ success: false, error: 'Failed to delegate task' }, 500);
    }
  });
};
