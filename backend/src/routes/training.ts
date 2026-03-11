import { Hono } from 'hono';
import { z } from 'zod';
import Database from 'better-sqlite3';
import { logger } from '../services/logger';

// Initialize database
const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const sqlite = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');

// ==================== VALIDATION SCHEMAS ====================

const CreateCourseSchema = z.object({
  courseCode: z.string().min(1, 'Course code required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.enum([
    'OSHA Required', 'EPA Compliance', 'MSHA Required',
    'Industrial Hygiene', 'ISO Standards', 'Company Policy', 'Job Specific'
  ]),
  description: z.string().optional(),
  durationHours: z.number().int().positive().default(1),
  validityMonths: z.number().int().min(0).default(12),
  requiredForRoles: z.array(z.string()).optional(),
  regulatoryReference: z.string().optional(),
  hazardTypes: z.array(z.string()).optional(),
  deliveryMethod: z.enum(['Classroom', 'Online', 'OJT', 'Blended']).default('Classroom'),
  assessmentRequired: z.boolean().default(false),
  passingScore: z.number().int().min(0).max(100).default(80),
});

const RecordCompletionSchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  role: z.string().min(1),
  department: z.string().optional(),
  courseCode: z.string().min(1),
  courseName: z.string().min(1),
  completionDate: z.string().min(1),
  score: z.number().int().min(0).max(100).optional(),
  certificateId: z.string().optional(),
  evidenceType: z.enum(['Certificate', 'Sign-off Sheet', 'Test Score', 'Photo Evidence']).optional(),
  instructorName: z.string().optional(),
  trainingProvider: z.string().optional(),
  notes: z.string().optional(),
});

const AssignTrainingSchema = z.object({
  employeeId: z.string().min(1),
  courseCode: z.string().min(1),
  assignedBy: z.string().min(1),
  dueDate: z.string().optional(),
  priority: z.enum(['Low', 'Normal', 'High', 'Critical']).default('Normal'),
  reason: z.string().optional(),
});

// ==================== HELPER FUNCTIONS ====================

/** Calculate expiration date based on completion date + validity months */
function calcExpirationDate(completionDate: string, validityMonths: number): string | null {
  if (!validityMonths) return null;
  const d = new Date(completionDate);
  d.setMonth(d.getMonth() + validityMonths);
  return d.toISOString().split('T')[0];
}

/** Determine training status based on expiration date */
function getTrainingStatus(expirationDate: string | null): string {
  if (!expirationDate) return 'Current'; // one-time training
  const now = new Date();
  const exp = new Date(expirationDate);
  const diffDays = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Expired';
  if (diffDays <= 30) return 'Expiring Soon';
  return 'Current';
}

// ==================== ROUTES ====================

export const trainingRoutes = (app: Hono) => {
  /**
   * GET /api/training/courses
   * List all training courses
   */
  app.get('/api/training/courses', (c) => {
    try {
      const category = c.req.query('category');
      const role = c.req.query('role');
      const isActive = c.req.query('active');

      logger.info('Fetching training courses', { category, role });

      let query = 'SELECT * FROM training_courses WHERE 1=1';
      const params: any[] = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      if (isActive !== undefined) {
        query += ' AND is_active = ?';
        params.push(isActive === '1' || isActive === 'true' ? 1 : 0);
      }

      query += ' ORDER BY category ASC, title ASC';

      const courses = sqlite.prepare(query).all(...params) as any[];

      // Filter by role in memory (JSON array search)
      let filtered = courses;
      if (role) {
        filtered = courses.filter((c) => {
          const roles = c.required_for_roles ? JSON.parse(c.required_for_roles) : [];
          return roles.includes(role);
        });
      }

      const formatted = filtered.map((course) => ({
        id: course.id,
        courseCode: course.course_code,
        title: course.title,
        category: course.category,
        durationHours: course.duration_hours,
        validityMonths: course.validity_months,
        requiredForRoles: course.required_for_roles ? JSON.parse(course.required_for_roles) : [],
        regulatoryReference: course.regulatory_reference,
        deliveryMethod: course.delivery_method,
        isActive: Boolean(course.is_active),
      }));

      return c.json({ success: true, data: formatted, count: formatted.length }, 200);
    } catch (error) {
      logger.error('Error fetching training courses', { error });
      return c.json({ success: false, error: 'Failed to fetch training courses' }, 500);
    }
  });

  /**
   * POST /api/training/courses
   * Create new training course
   */
  app.post('/api/training/courses', async (c) => {
    try {
      const body = await c.req.json();
      const validated = CreateCourseSchema.parse(body);

      logger.info('Creating training course', { courseCode: validated.courseCode });

      // Check for duplicate course code
      const existing = sqlite
        .prepare('SELECT id FROM training_courses WHERE course_code = ?')
        .get(validated.courseCode);

      if (existing) {
        return c.json({ success: false, error: 'Course code already exists' }, 409);
      }

      const stmt = sqlite.prepare(`
        INSERT INTO training_courses (
          course_code, title, category, description, duration_hours,
          validity_months, required_for_roles, regulatory_reference,
          hazard_types, delivery_method, assessment_required, passing_score, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);

      stmt.run(
        validated.courseCode,
        validated.title,
        validated.category,
        validated.description || null,
        validated.durationHours,
        validated.validityMonths,
        validated.requiredForRoles ? JSON.stringify(validated.requiredForRoles) : null,
        validated.regulatoryReference || null,
        validated.hazardTypes ? JSON.stringify(validated.hazardTypes) : null,
        validated.deliveryMethod,
        validated.assessmentRequired ? 1 : 0,
        validated.passingScore
      );

      const course = sqlite
        .prepare('SELECT * FROM training_courses WHERE course_code = ?')
        .get(validated.courseCode) as any;

      logger.info('Training course created', { courseId: course.id });

      return c.json({
        success: true,
        data: {
          id: course.id,
          courseCode: course.course_code,
          title: course.title,
          category: course.category,
          durationHours: course.duration_hours,
          validityMonths: course.validity_months,
          createdAt: course.created_at,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error creating training course', { error });
      return c.json({ success: false, error: 'Failed to create training course' }, 500);
    }
  });

  /**
   * GET /api/training/courses/:id
   * Get course details by ID
   */
  app.get('/api/training/courses/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) {
        return c.json({ success: false, error: 'Invalid course ID' }, 400);
      }

      const course = sqlite.prepare('SELECT * FROM training_courses WHERE id = ?').get(id) as any;

      if (!course) {
        return c.json({ success: false, error: 'Training course not found' }, 404);
      }

      return c.json({
        success: true,
        data: {
          id: course.id,
          courseCode: course.course_code,
          title: course.title,
          category: course.category,
          description: course.description,
          durationHours: course.duration_hours,
          validityMonths: course.validity_months,
          requiredForRoles: course.required_for_roles ? JSON.parse(course.required_for_roles) : [],
          regulatoryReference: course.regulatory_reference,
          hazardTypes: course.hazard_types ? JSON.parse(course.hazard_types) : [],
          deliveryMethod: course.delivery_method,
          assessmentRequired: Boolean(course.assessment_required),
          passingScore: course.passing_score,
          isActive: Boolean(course.is_active),
          createdAt: course.created_at,
          updatedAt: course.updated_at,
        },
      }, 200);
    } catch (error) {
      logger.error('Error fetching training course', { error });
      return c.json({ success: false, error: 'Failed to fetch training course' }, 500);
    }
  });

  /**
   * POST /api/training/complete
   * Record training completion for an employee
   */
  app.post('/api/training/complete', async (c) => {
    try {
      const body = await c.req.json();
      const validated = RecordCompletionSchema.parse(body);

      logger.info('Recording training completion', {
        employeeId: validated.employeeId,
        courseCode: validated.courseCode,
      });

      // Look up course for validity months
      const course = sqlite
        .prepare('SELECT validity_months FROM training_courses WHERE course_code = ?')
        .get(validated.courseCode) as any;

      const validityMonths = course?.validity_months ?? 12;
      const expirationDate = calcExpirationDate(validated.completionDate, validityMonths);
      const status = expirationDate ? getTrainingStatus(expirationDate) : 'Current';

      // Upsert: if record exists for employee + course, update; else insert
      const existing = sqlite
        .prepare('SELECT id FROM employee_training WHERE employee_id = ? AND course_code = ?')
        .get(validated.employeeId, validated.courseCode) as any;

      if (existing) {
        const upd = sqlite.prepare(`
          UPDATE employee_training SET
            employee_name = ?, role = ?, department = ?,
            completion_date = ?, expiration_date = ?, status = ?,
            certificate_id = ?, evidence_type = ?, score = ?,
            instructor_name = ?, training_provider = ?, notes = ?,
            updated_at = ?
          WHERE id = ?
        `);

        upd.run(
          validated.employeeName, validated.role,
          validated.department || null, validated.completionDate,
          expirationDate, status,
          validated.certificateId || null, validated.evidenceType || null,
          validated.score ?? null, validated.instructorName || null,
          validated.trainingProvider || null, validated.notes || null,
          Date.now(), existing.id
        );

        // Mark any pending assignment as completed
        sqlite.prepare(`
          UPDATE training_assignments SET status = 'Completed', completed_date = ?
          WHERE employee_id = ? AND course_code = ? AND status != 'Completed'
        `).run(validated.completionDate, validated.employeeId, validated.courseCode);

        return c.json({
          success: true,
          message: 'Training record updated',
          data: { id: existing.id, status, expirationDate },
        }, 200);
      }

      const courseId = course?.id ?? null;

      const ins = sqlite.prepare(`
        INSERT INTO employee_training (
          employee_id, employee_name, role, department,
          course_id, course_code, course_name,
          completion_date, expiration_date, status,
          certificate_id, evidence_type, score,
          instructor_name, training_provider, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      ins.run(
        validated.employeeId, validated.employeeName, validated.role,
        validated.department || null, courseId, validated.courseCode,
        validated.courseName, validated.completionDate, expirationDate,
        status, validated.certificateId || null, validated.evidenceType || null,
        validated.score ?? null, validated.instructorName || null,
        validated.trainingProvider || null, validated.notes || null
      );

      const record = sqlite
        .prepare('SELECT * FROM employee_training WHERE employee_id = ? AND course_code = ? ORDER BY id DESC LIMIT 1')
        .get(validated.employeeId, validated.courseCode) as any;

      // Mark any pending assignment as completed
      sqlite.prepare(`
        UPDATE training_assignments SET status = 'Completed', completed_date = ?
        WHERE employee_id = ? AND course_code = ? AND status != 'Completed'
      `).run(validated.completionDate, validated.employeeId, validated.courseCode);

      logger.info('Training completion recorded', { recordId: record.id, status });

      return c.json({
        success: true,
        data: {
          id: record.id,
          employeeId: record.employee_id,
          courseCode: record.course_code,
          status,
          expirationDate,
          completionDate: validated.completionDate,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error recording training completion', { error });
      return c.json({ success: false, error: 'Failed to record training completion' }, 500);
    }
  });

  /**
   * GET /api/training/employee/:employeeId
   * Get all training records for an employee
   */
  app.get('/api/training/employee/:employeeId', (c) => {
    try {
      const employeeId = c.req.param('employeeId');
      logger.info('Fetching employee training', { employeeId });

      const records = sqlite
        .prepare('SELECT * FROM employee_training WHERE employee_id = ? ORDER BY expiration_date ASC')
        .all(employeeId) as any[];

      if (records.length === 0) {
        return c.json({ success: true, data: { employeeId, records: [], stats: null } }, 200);
      }

      const formatted = records.map((r) => ({
        id: r.id,
        courseCode: r.course_code,
        courseName: r.course_name,
        completionDate: r.completion_date,
        expirationDate: r.expiration_date,
        status: getTrainingStatus(r.expiration_date),
        score: r.score,
        certificateId: r.certificate_id,
        evidenceType: r.evidence_type,
      }));

      // Recalculate statuses
      const totalCourses = formatted.length;
      const current = formatted.filter((r) => r.status === 'Current').length;
      const expiringSoon = formatted.filter((r) => r.status === 'Expiring Soon').length;
      const expired = formatted.filter((r) => r.status === 'Expired').length;

      return c.json({
        success: true,
        data: {
          employeeId,
          employeeName: records[0].employee_name,
          role: records[0].role,
          department: records[0].department,
          records: formatted,
          stats: {
            total: totalCourses,
            current,
            expiringSoon,
            expired,
            complianceRate: totalCourses > 0 ? Math.round((current / totalCourses) * 100) : 0,
          },
        },
      }, 200);
    } catch (error) {
      logger.error('Error fetching employee training', { error });
      return c.json({ success: false, error: 'Failed to fetch employee training' }, 500);
    }
  });

  /**
   * POST /api/training/assign
   * Assign training to an employee
   */
  app.post('/api/training/assign', async (c) => {
    try {
      const body = await c.req.json();
      const validated = AssignTrainingSchema.parse(body);

      logger.info('Assigning training', {
        employeeId: validated.employeeId,
        courseCode: validated.courseCode,
      });

      // Check course exists
      const course = sqlite
        .prepare('SELECT id, title FROM training_courses WHERE course_code = ?')
        .get(validated.courseCode) as any;

      const stmt = sqlite.prepare(`
        INSERT INTO training_assignments (
          employee_id, course_id, course_code,
          assigned_by, assigned_date, due_date, priority, reason, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
      `);

      stmt.run(
        validated.employeeId,
        course?.id ?? null,
        validated.courseCode,
        validated.assignedBy,
        new Date().toISOString().split('T')[0],
        validated.dueDate || null,
        validated.priority,
        validated.reason || null
      );

      const assignment = sqlite
        .prepare('SELECT * FROM training_assignments WHERE employee_id = ? AND course_code = ? ORDER BY id DESC LIMIT 1')
        .get(validated.employeeId, validated.courseCode) as any;

      logger.info('Training assigned', { assignmentId: assignment.id });

      return c.json({
        success: true,
        data: {
          id: assignment.id,
          employeeId: assignment.employee_id,
          courseCode: assignment.course_code,
          dueDate: assignment.due_date,
          priority: assignment.priority,
          status: assignment.status,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error assigning training', { error });
      return c.json({ success: false, error: 'Failed to assign training' }, 500);
    }
  });

  /**
   * GET /api/training/compliance
   * Get training compliance statistics
   */
  app.get('/api/training/compliance', (c) => {
    try {
      const department = c.req.query('department');
      const role = c.req.query('role');

      logger.info('Fetching training compliance', { department, role });

      let query = 'SELECT * FROM employee_training WHERE 1=1';
      const params: any[] = [];

      if (department) {
        query += ' AND department = ?';
        params.push(department);
      }
      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }

      const records = sqlite.prepare(query).all(...params) as any[];

      // Recalculate current statuses
      const now = new Date();
      let current = 0, expiringSoon = 0, expired = 0, notStarted = 0;

      for (const r of records) {
        const s = getTrainingStatus(r.expiration_date);
        if (s === 'Current') current++;
        else if (s === 'Expiring Soon') expiringSoon++;
        else if (s === 'Expired') expired++;
        else notStarted++;
      }

      const total = records.length;
      const uniqueEmployees = new Set(records.map((r: any) => r.employee_id)).size;

      // Get overdue assignments
      const overdueAssignments = sqlite
        .prepare(`SELECT COUNT(*) as cnt FROM training_assignments WHERE status = 'Pending' AND due_date < date('now')`)
        .get() as any;

      return c.json({
        success: true,
        data: {
          totalRecords: total,
          uniqueEmployees,
          current,
          expiringSoon,
          expired,
          notStarted,
          complianceRate: total > 0 ? Math.round((current / total) * 100) : 0,
          overdueAssignments: overdueAssignments.cnt,
        },
      }, 200);
    } catch (error) {
      logger.error('Error fetching training compliance', { error });
      return c.json({ success: false, error: 'Failed to fetch compliance data' }, 500);
    }
  });

  /**
   * GET /api/training/matrix
   * Get training matrix for roles
   */
  app.get('/api/training/matrix', (c) => {
    try {
      const role = c.req.query('role');

      logger.info('Fetching training matrix', { role });

      let query = `
        SELECT tm.*, tc.title, tc.category, tc.duration_hours, tc.validity_months,
               tc.regulatory_reference
        FROM training_matrix tm
        LEFT JOIN training_courses tc ON tm.course_id = tc.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (role) {
        query += ' AND tm.role = ?';
        params.push(role);
      }

      query += ' ORDER BY tm.role ASC, tc.category ASC';

      const matrix = sqlite.prepare(query).all(...params) as any[];

      // Group by role if no role filter
      if (!role) {
        const grouped: Record<string, any[]> = {};
        for (const item of matrix) {
          if (!grouped[item.role]) grouped[item.role] = [];
          grouped[item.role].push({
            courseCode: item.course_code,
            title: item.title,
            category: item.category,
            isMandatory: Boolean(item.is_mandatory),
            daysToComplete: item.days_to_complete,
            durationHours: item.duration_hours,
            validityMonths: item.validity_months,
          });
        }
        return c.json({ success: true, data: grouped }, 200);
      }

      return c.json({
        success: true,
        data: matrix.map((m) => ({
          courseCode: m.course_code,
          title: m.title,
          category: m.category,
          isMandatory: Boolean(m.is_mandatory),
          daysToComplete: m.days_to_complete,
          durationHours: m.duration_hours,
          validityMonths: m.validity_months,
        })),
      }, 200);
    } catch (error) {
      logger.error('Error fetching training matrix', { error });
      return c.json({ success: false, error: 'Failed to fetch training matrix' }, 500);
    }
  });

  /**
   * POST /api/training/matrix
   * Add course to training matrix for a role
   */
  app.post('/api/training/matrix', async (c) => {
    try {
      const body = await c.req.json();
      const schema = z.object({
        role: z.string().min(1),
        courseCode: z.string().min(1),
        isMandatory: z.boolean().default(true),
        daysToComplete: z.number().int().positive().default(30),
      });
      const validated = schema.parse(body);

      const course = sqlite
        .prepare('SELECT id FROM training_courses WHERE course_code = ?')
        .get(validated.courseCode) as any;

      // Prevent duplicates
      const dup = sqlite
        .prepare('SELECT id FROM training_matrix WHERE role = ? AND course_code = ?')
        .get(validated.role, validated.courseCode);

      if (dup) {
        return c.json({ success: false, error: 'This course is already in the matrix for this role' }, 409);
      }

      const stmt = sqlite.prepare(`
        INSERT INTO training_matrix (role, course_id, course_code, is_mandatory, days_to_complete)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        validated.role,
        course?.id ?? null,
        validated.courseCode,
        validated.isMandatory ? 1 : 0,
        validated.daysToComplete
      );

      logger.info('Training matrix entry added', { role: validated.role, courseCode: validated.courseCode });

      return c.json({ success: true, data: { role: validated.role, courseCode: validated.courseCode } }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error adding to training matrix', { error });
      return c.json({ success: false, error: 'Failed to add to training matrix' }, 500);
    }
  });

  /**
   * GET /api/training/expiring
   * Get training records expiring within N days (default 30)
   */
  app.get('/api/training/expiring', (c) => {
    try {
      const daysParam = c.req.query('days');
      const days = daysParam ? parseInt(daysParam, 10) : 30;

      logger.info('Fetching expiring training', { days });

      const records = sqlite.prepare(`
        SELECT * FROM employee_training
        WHERE expiration_date IS NOT NULL
          AND expiration_date <= date('now', '+' || ? || ' days')
          AND expiration_date >= date('now')
        ORDER BY expiration_date ASC
      `).all(days) as any[];

      const formatted = records.map((r) => ({
        id: r.id,
        employeeId: r.employee_id,
        employeeName: r.employee_name,
        role: r.role,
        department: r.department,
        courseCode: r.course_code,
        courseName: r.course_name,
        expirationDate: r.expiration_date,
        daysUntilExpiration: Math.floor(
          (new Date(r.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      }));

      return c.json({
        success: true,
        data: formatted,
        count: formatted.length,
        threshold: days,
      }, 200);
    } catch (error) {
      logger.error('Error fetching expiring training', { error });
      return c.json({ success: false, error: 'Failed to fetch expiring training' }, 500);
    }
  });
};
