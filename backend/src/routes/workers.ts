import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const sqlite = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');
sqlite.pragma('journal_mode = WAL');

const logger = {
  info: (msg: string, meta?: object) => console.log(`[WORKERS] ${msg}`, meta ?? ''),
  error: (msg: string, meta?: object) => console.error(`[WORKERS ERROR] ${msg}`, meta ?? ''),
};

// ── VALIDATION SCHEMAS ────────────────────────────────────────────────────

const CreateWorkerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(['worker', 'supervisor', 'manager', 'safety_officer', 'admin']).default('worker'),
  jobTitle: z.string().optional(),
  managerId: z.number().int().optional(),
  hireDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on_leave']).default('active'),
  certifications: z.array(z.string()).optional(),
});

const UpdateWorkerSchema = CreateWorkerSchema.partial();

const FeedbackSchema = z.object({
  content: z.string().min(1).max(2000),
  category: z.string().optional(),
  anonymous: z.boolean().default(false),
});

// ── HELPERS ───────────────────────────────────────────────────────────────

function generateEmployeeId(): string {
  const n = (sqlite.prepare('SELECT COUNT(*) as n FROM workers').get() as any).n + 1;
  return `EMP-${String(n).padStart(4, '0')}`;
}

function now(): number { return Date.now(); }

function mapWorker(r: any) {
  return {
    id: r.id,
    employeeId: r.employee_id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    department: r.department,
    role: r.role,
    jobTitle: r.job_title,
    managerId: r.manager_id,
    hireDate: r.hire_date,
    status: r.status,
    lastTrainingDate: r.last_training_date,
    certifications: safeJson(r.certifications, []),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function safeJson(val: any, fallback: any) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

export const workerRoutes = (app: Hono) => {

  /**
   * GET /api/workers
   * List all workers with optional filters
   */
  app.get('/api/workers', (c) => {
    try {
      const department = c.req.query('department');
      const role = c.req.query('role');
      const status = c.req.query('status');
      const search = c.req.query('search');

      let query = 'SELECT * FROM workers WHERE 1=1';
      const params: any[] = [];
      if (department) { query += ' AND department = ?'; params.push(department); }
      if (role) { query += ' AND role = ?'; params.push(role); }
      if (status) { query += ' AND status = ?'; params.push(status); }
      if (search) { query += ' AND (name LIKE ? OR email LIKE ? OR employee_id LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      query += ' ORDER BY name ASC';

      const rows = sqlite.prepare(query).all(...params) as any[];
      const data = rows.map(mapWorker);

      const summary = {
        total: data.length,
        active: data.filter((w: any) => w.status === 'active').length,
        inactive: data.filter((w: any) => w.status === 'inactive').length,
        onLeave: data.filter((w: any) => w.status === 'on_leave').length,
      };

      return c.json({ success: true, data, summary, count: data.length }, 200);
    } catch (error) {
      logger.error('Error listing workers', { error });
      return c.json({ success: false, error: 'Failed to list workers' }, 500);
    }
  });

  /**
   * POST /api/workers
   * Create a new worker / employee record
   */
  app.post('/api/workers', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateWorkerSchema.parse(body);
      const employeeId = generateEmployeeId();

      const result = sqlite.prepare(`
        INSERT INTO workers (employee_id, name, email, phone, department, role,
          job_title, manager_id, hire_date, status, certifications)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        employeeId, v.name, v.email ?? null, v.phone ?? null, v.department ?? null,
        v.role, v.jobTitle ?? null, v.managerId ?? null, v.hireDate ?? null, v.status,
        v.certifications ? JSON.stringify(v.certifications) : '[]'
      );

      // Initialize performance record
      sqlite.prepare(`
        INSERT INTO worker_performance (worker_id, safety_score, updated_at)
        VALUES (?, 100, ?)
      `).run(result.lastInsertRowid, now());

      logger.info('Worker created', { id: result.lastInsertRowid, employeeId });
      return c.json({ success: true, data: { id: result.lastInsertRowid, employeeId, name: v.name } }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      if ((error as any)?.message?.includes('UNIQUE')) return c.json({ success: false, error: 'Email already registered' }, 409);
      logger.error('Error creating worker', { error });
      return c.json({ success: false, error: 'Failed to create worker' }, 500);
    }
  });

  /**
   * GET /api/workers/:userId
   * Full worker profile
   */
  app.get('/api/workers/:userId', (c) => {
    try {
      const id = parseInt(c.req.param('userId'), 10);
      const worker = sqlite.prepare('SELECT * FROM workers WHERE id = ?').get(id) as any;
      if (!worker) return c.json({ success: false, error: 'Worker not found' }, 404);

      const performance = sqlite.prepare('SELECT * FROM worker_performance WHERE worker_id = ?').get(id) as any;
      const manager = worker.manager_id
        ? sqlite.prepare('SELECT id, name, job_title FROM workers WHERE id = ?').get(worker.manager_id) as any
        : null;

      return c.json({
        success: true,
        data: {
          ...mapWorker(worker),
          manager: manager ? { id: manager.id, name: manager.name, jobTitle: manager.job_title } : null,
          performance: performance ? {
            safetyScore: performance.safety_score,
            trainingCompletionRate: performance.training_completion_rate,
            incidentsReported: performance.incidents_reported,
            incidentsFreedays: performance.incidents_free_days,
            certificationsCount: performance.certifications_count,
            lastReviewDate: performance.last_review_date,
          } : null,
        }
      }, 200);
    } catch (error) {
      logger.error('Error fetching worker', { error });
      return c.json({ success: false, error: 'Failed to fetch worker' }, 500);
    }
  });

  /**
   * PUT /api/workers/:userId
   * Update worker info
   */
  app.put('/api/workers/:userId', async (c) => {
    try {
      const id = parseInt(c.req.param('userId'), 10);
      const existing = sqlite.prepare('SELECT id FROM workers WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Worker not found' }, 404);

      const body = await c.req.json();
      const v = UpdateWorkerSchema.parse(body);

      const fields: string[] = [];
      const params: any[] = [];
      if (v.name !== undefined) { fields.push('name = ?'); params.push(v.name); }
      if (v.email !== undefined) { fields.push('email = ?'); params.push(v.email); }
      if (v.phone !== undefined) { fields.push('phone = ?'); params.push(v.phone); }
      if (v.department !== undefined) { fields.push('department = ?'); params.push(v.department); }
      if (v.role !== undefined) { fields.push('role = ?'); params.push(v.role); }
      if (v.jobTitle !== undefined) { fields.push('job_title = ?'); params.push(v.jobTitle); }
      if (v.managerId !== undefined) { fields.push('manager_id = ?'); params.push(v.managerId); }
      if (v.hireDate !== undefined) { fields.push('hire_date = ?'); params.push(v.hireDate); }
      if (v.status !== undefined) { fields.push('status = ?'); params.push(v.status); }
      if (v.certifications !== undefined) { fields.push('certifications = ?'); params.push(JSON.stringify(v.certifications)); }

      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at = ?'); params.push(now());
      params.push(id);

      sqlite.prepare(`UPDATE workers SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = sqlite.prepare('SELECT * FROM workers WHERE id = ?').get(id) as any;

      return c.json({ success: true, data: mapWorker(updated) }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error updating worker', { error });
      return c.json({ success: false, error: 'Failed to update worker' }, 500);
    }
  });

  /**
   * GET /api/workers/:userId/assignments
   * Worker's task assignments (filter: status, task_type)
   */
  app.get('/api/workers/:userId/assignments', (c) => {
    try {
      const id = parseInt(c.req.param('userId'), 10);
      const worker = sqlite.prepare('SELECT id, name FROM workers WHERE id = ?').get(id) as any;
      if (!worker) return c.json({ success: false, error: 'Worker not found' }, 404);

      const status = c.req.query('status');
      const taskType = c.req.query('taskType');

      let query = 'SELECT * FROM worker_assignments WHERE worker_id = ?';
      const params: any[] = [id];
      if (status) { query += ' AND status = ?'; params.push(status); }
      if (taskType) { query += ' AND task_type = ?'; params.push(taskType); }
      query += ' ORDER BY due_date ASC, created_at DESC';

      const rows = sqlite.prepare(query).all(...params) as any[];
      const data = rows.map((r: any) => ({
        id: r.id, workerId: r.worker_id, taskType: r.task_type, taskId: r.task_id,
        taskTitle: r.task_title, assignedBy: r.assigned_by,
        assignmentDate: r.assignment_date, dueDate: r.due_date,
        completionDate: r.completion_date, status: r.status, notes: r.notes,
        createdAt: r.created_at,
      }));

      return c.json({ success: true, data, count: data.length, worker: { id: worker.id, name: worker.name } }, 200);
    } catch (error) {
      logger.error('Error fetching assignments', { error });
      return c.json({ success: false, error: 'Failed to fetch assignments' }, 500);
    }
  });

  /**
   * GET /api/workers/:userId/trainings
   * Worker's training history from employee_training table
   */
  app.get('/api/workers/:userId/trainings', (c) => {
    try {
      const id = parseInt(c.req.param('userId'), 10);
      const worker = sqlite.prepare('SELECT id, name FROM workers WHERE id = ?').get(id) as any;
      if (!worker) return c.json({ success: false, error: 'Worker not found' }, 404);

      // Pull from employee_training joined with training_courses
      const rows = sqlite.prepare(`
        SELECT et.*, tc.title as course_title, tc.category, tc.duration_hours
        FROM employee_training et
        LEFT JOIN training_courses tc ON tc.id = et.course_id
        WHERE et.employee_name = ? OR et.employee_id = ?
        ORDER BY et.completion_date DESC
      `).all(worker.name, String(id)) as any[];

      return c.json({
        success: true,
        data: rows.map((r: any) => ({
          id: r.id, courseId: r.course_id, courseTitle: r.course_title ?? r.course_name ?? r.course_id,
          category: r.category, durationHours: r.duration_hours,
          completionDate: r.completion_date,
          expiryDate: r.expiration_date, status: r.status, score: r.score,
          certificateIssued: Boolean(r.certificate_id),
        })),
        count: rows.length,
        worker: { id: worker.id, name: worker.name },
      }, 200);
    } catch (error) {
      logger.error('Error fetching trainings', { error });
      return c.json({ success: false, error: 'Failed to fetch training history' }, 500);
    }
  });

  /**
   * GET /api/workers/:userId/certifications
   * Active certifications for a worker
   */
  app.get('/api/workers/:userId/certifications', (c) => {
    try {
      const id = parseInt(c.req.param('userId'), 10);
      const worker = sqlite.prepare('SELECT id, name, certifications FROM workers WHERE id = ?').get(id) as any;
      if (!worker) return c.json({ success: false, error: 'Worker not found' }, 404);

      // Pull certifications from training records
      const rows = sqlite.prepare(`
        SELECT et.*, tc.title as course_title
        FROM employee_training et
        LEFT JOIN training_courses tc ON tc.id = et.course_id
        WHERE (et.employee_name = ? OR et.employee_id = ?)
          AND et.certificate_id IS NOT NULL
          AND (et.expiration_date IS NULL OR et.expiration_date >= date('now'))
        ORDER BY et.expiration_date ASC
      `).all(worker.name, String(id)) as any[];

      const inlineCerts = safeJson(worker.certifications, []);

      return c.json({
        success: true,
        data: {
          trainingCertifications: rows.map((r: any) => ({
            courseId: r.course_id, courseName: r.course_title ?? r.course_name ?? r.course_id,
            completionDate: r.completion_date, expiryDate: r.expiration_date,
            status: r.status,
          })),
          additionalCertifications: inlineCerts,
        },
        worker: { id: worker.id, name: worker.name },
      }, 200);
    } catch (error) {
      logger.error('Error fetching certifications', { error });
      return c.json({ success: false, error: 'Failed to fetch certifications' }, 500);
    }
  });

  /**
   * POST /api/workers/:userId/feedback
   * Submit feedback for a worker
   */
  app.post('/api/workers/:userId/feedback', async (c) => {
    try {
      const id = parseInt(c.req.param('userId'), 10);
      const worker = sqlite.prepare('SELECT id, name FROM workers WHERE id = ?').get(id) as any;
      if (!worker) return c.json({ success: false, error: 'Worker not found' }, 404);

      const body = await c.req.json();
      const v = FeedbackSchema.parse(body);

      // Store feedback as an approval record (type=other, pre-approved)
      sqlite.prepare(`
        INSERT INTO approvals (type, title, description, requested_by, requested_by_name, assigned_to, status, priority, created_at, updated_at)
        VALUES ('other', ?, ?, ?, ?, ?, 'approved', 'low', ?, ?)
      `).run(
        `Worker Feedback: ${worker.name}`,
        JSON.stringify({ content: v.content, category: v.category ?? 'general' }),
        v.anonymous ? 'anonymous' : 'submitter',
        v.anonymous ? 'Anonymous' : 'System',
        String(id),
        now(), now()
      );

      logger.info('Feedback submitted', { workerId: id });
      return c.json({ success: true, message: 'Feedback submitted successfully', data: { workerId: id, workerName: worker.name } }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error submitting feedback', { error });
      return c.json({ success: false, error: 'Failed to submit feedback' }, 500);
    }
  });

  /**
   * GET /api/workers/:userId/performance
   * Performance metrics for a worker
   */
  app.get('/api/workers/:userId/performance', (c) => {
    try {
      const id = parseInt(c.req.param('userId'), 10);
      const worker = sqlite.prepare('SELECT id, name, department FROM workers WHERE id = ?').get(id) as any;
      if (!worker) return c.json({ success: false, error: 'Worker not found' }, 404);

      const perf = sqlite.prepare('SELECT * FROM worker_performance WHERE worker_id = ?').get(id) as any;

      // Count incidents involving this worker
      const incidentCount = (sqlite.prepare(
        `SELECT COUNT(*) as n FROM incidents WHERE assigned_to = ? OR reported_by = ?`
      ).get(String(id), String(id)) as any)?.n ?? 0;

      // Training stats
      const trainingStats = sqlite.prepare(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN status = 'Current' THEN 1 ELSE 0 END) as current_count
        FROM employee_training WHERE employee_name = ? OR employee_id = ?
      `).get(worker.name, String(id)) as any;

      const trainingRate = trainingStats.total > 0
        ? Math.round((trainingStats.current_count / trainingStats.total) * 100)
        : 0;

      return c.json({
        success: true,
        data: {
          workerId: id,
          workerName: worker.name,
          department: worker.department,
          safetyScore: perf?.safety_score ?? 100,
          trainingCompletionRate: trainingRate,
          incidentsReported: incidentCount,
          incidentsFreedays: perf?.incidents_free_days ?? 0,
          certificationsCount: perf?.certifications_count ?? 0,
          lastReviewDate: perf?.last_review_date ?? null,
          trainingStats: { total: trainingStats.total, current: trainingStats.current_count },
        }
      }, 200);
    } catch (error) {
      logger.error('Error fetching performance', { error });
      return c.json({ success: false, error: 'Failed to fetch performance metrics' }, 500);
    }
  });
};
