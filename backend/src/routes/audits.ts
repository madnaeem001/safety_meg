import { Hono } from 'hono';
import { z } from 'zod';
import Database from 'better-sqlite3';
import { logger } from '../services/logger';

const sqlite = new Database('local.sqlite');

// ==================== VALIDATION SCHEMAS ====================

const CreateTemplateSchema = z.object({
  name: z.string().min(3, 'Name required'),
  industry: z.string().optional(),
  auditType: z.enum(['Safety', 'Environmental', 'Quality', 'Compliance', 'Process']),
  description: z.string().optional(),
  categories: z.array(z.string()).optional(),
  checklistItems: z.array(z.object({
    category: z.string(),
    question: z.string(),
    required: z.boolean().default(true),
    regulatoryRef: z.string().optional(),
    helpText: z.string().optional(),
  })).optional(),
  complianceReferences: z.array(z.object({
    body: z.string(),
    code: z.string(),
    title: z.string(),
  })).optional(),
  version: z.string().default('1.0'),
});

const CreateAuditSchema = z.object({
  auditNumber: z.string().min(1, 'Audit number required (e.g. AUD-2026-001)'),
  templateId: z.number().int().positive().optional(),
  title: z.string().min(3, 'Title required'),
  auditType: z.enum(['Safety', 'Environmental', 'Quality', 'Compliance', 'Process']),
  location: z.string().min(1, 'Location required'),
  department: z.string().optional(),
  industry: z.string().optional(),
  scheduledDate: z.string().min(1, 'Scheduled date required'),
  dueDate: z.string().optional(),
  leadAuditor: z.string().min(1, 'Lead auditor required'),
  auditTeam: z.array(z.string()).optional(),
  auditee: z.string().optional(),
});

const CompleteAuditSchema = z.object({
  completedDate: z.string().min(1),
  overallScore: z.number().int().min(0).max(100).optional(),
  totalItems: z.number().int().min(0).optional(),
  passedItems: z.number().int().min(0).optional(),
  failedItems: z.number().int().min(0).optional(),
  naItems: z.number().int().min(0).optional(),
  summary: z.string().optional(),
  nextAuditDate: z.string().optional(),
});

const UpdateAuditSchema = z.object({
  status: z.enum(['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Overdue']).optional(),
  completedDate: z.string().optional(),
  overallScore: z.number().int().min(0).max(100).optional(),
  totalItems: z.number().int().min(0).optional(),
  passedItems: z.number().int().min(0).optional(),
  failedItems: z.number().int().min(0).optional(),
  naItems: z.number().int().min(0).optional(),
  summary: z.string().optional(),
  nextAuditDate: z.string().optional(),
});

const CreateFindingSchema = z.object({
  category: z.string().min(1, 'Category required'),
  finding: z.string().min(5, 'Finding description required'),
  severity: z.enum(['Critical', 'Major', 'Minor', 'Observation']),
  recommendation: z.string().optional(),
  responsiblePerson: z.string().optional(),
  dueDate: z.string().optional(),
  regulatoryRef: z.string().optional(),
});

const UpdateFindingSchema = z.object({
  status: z.enum(['Open', 'In Progress', 'Closed', 'Accepted Risk']).optional(),
  closedDate: z.string().optional(),
  closureNotes: z.string().optional(),
  responsiblePerson: z.string().optional(),
  dueDate: z.string().optional(),
  recommendation: z.string().optional(),
});

const CreateComplianceReqSchema = z.object({
  standardId: z.string().min(1, 'Standard ID required (e.g. ISO-45001)'),
  clauseId: z.string().min(1, 'Clause ID required (e.g. 6.1.2)'),
  requirement: z.string().min(5, 'Requirement description required'),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'partially_compliant', 'compliant', 'non_compliant']).default('not_started'),
  maturityLevel: z.enum(['none', 'initial', 'managed', 'defined', 'measured', 'optimized']).default('none'),
  evidence: z.array(z.string()).optional(),
  gaps: z.array(z.string()).optional(),
  actionItems: z.array(z.string()).optional(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateComplianceReqSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'partially_compliant', 'compliant', 'non_compliant']).optional(),
  maturityLevel: z.enum(['none', 'initial', 'managed', 'defined', 'measured', 'optimized']).optional(),
  evidence: z.array(z.string()).optional(),
  gaps: z.array(z.string()).optional(),
  actionItems: z.array(z.string()).optional(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
  lastAssessedDate: z.string().optional(),
  notes: z.string().optional(),
});

// ==================== HELPERS ====================

function scoreGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// ==================== ROUTES ====================

export const auditRoutes = (app: Hono) => {

  // ── AUDIT STATS ───────────────────────────────────────────────────────────

  /**
   * GET /api/audits/stats
   * Dashboard overview
   */
  app.get('/api/audits/stats', (c) => {
    try {
      const auditStats = sqlite.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as inProgress,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue,
          AVG(CASE WHEN overall_score IS NOT NULL THEN overall_score END) as avgScore
        FROM audits
      `).get() as any;

      const findingStats = sqlite.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
          SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN severity = 'Major' THEN 1 ELSE 0 END) as major
        FROM audit_findings
      `).get() as any;

      const complianceStats = sqlite.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'compliant' THEN 1 ELSE 0 END) as compliant,
          SUM(CASE WHEN status = 'non_compliant' THEN 1 ELSE 0 END) as nonCompliant,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress
        FROM compliance_requirements
      `).get() as any;

      return c.json({
        success: true,
        data: {
          audits: {
            ...auditStats,
            avgScore: auditStats.avgScore ? Math.round(auditStats.avgScore) : null,
          },
          findings: findingStats,
          compliance: {
            ...complianceStats,
            complianceRate: complianceStats.total > 0
              ? Math.round((complianceStats.compliant / complianceStats.total) * 100)
              : 0,
          },
        },
      }, 200);
    } catch (error) {
      logger.error('Error fetching audit stats', { error });
      return c.json({ success: false, error: 'Failed to fetch audit stats' }, 500);
    }
  });

  // ── AUDIT TEMPLATES ───────────────────────────────────────────────────────

  /**
   * GET /api/audits/templates
   * List audit templates
   */
  app.get('/api/audits/templates', (c) => {
    try {
      const auditType = c.req.query('type');
      const industry = c.req.query('industry');

      let query = 'SELECT * FROM audit_templates WHERE is_active = 1';
      const params: any[] = [];

      if (auditType) { query += ' AND audit_type = ?'; params.push(auditType); }
      if (industry) { query += ' AND industry = ?'; params.push(industry); }
      query += ' ORDER BY name ASC';

      const rows = sqlite.prepare(query).all(...params) as any[];

      const data = rows.map((r) => ({
        id: r.id,
        name: r.name,
        industry: r.industry,
        auditType: r.audit_type,
        description: r.description,
        version: r.version,
        categories: r.categories ? JSON.parse(r.categories) : [],
        itemCount: r.checklist_items ? JSON.parse(r.checklist_items).length : 0,
      }));

      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error fetching audit templates', { error });
      return c.json({ success: false, error: 'Failed to fetch audit templates' }, 500);
    }
  });

  /**
   * POST /api/audits/templates
   * Create audit template
   */
  app.post('/api/audits/templates', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateTemplateSchema.parse(body);

      sqlite.prepare(`
        INSERT INTO audit_templates (
          name, industry, audit_type, description,
          categories, checklist_items, compliance_references, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        v.name, v.industry || null, v.auditType, v.description || null,
        v.categories ? JSON.stringify(v.categories) : null,
        v.checklistItems ? JSON.stringify(v.checklistItems) : null,
        v.complianceReferences ? JSON.stringify(v.complianceReferences) : null,
        v.version
      );

      const row = sqlite.prepare('SELECT * FROM audit_templates ORDER BY id DESC LIMIT 1').get() as any;
      logger.info('Audit template created', { id: row.id, name: row.name });

      return c.json({
        success: true,
        data: {
          id: row.id,
          name: row.name,
          auditType: row.audit_type,
          industry: row.industry,
          itemCount: v.checklistItems?.length ?? 0,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error creating audit template', { error });
      return c.json({ success: false, error: 'Failed to create audit template' }, 500);
    }
  });

  /**
   * GET /api/audits/templates/:id
   * Get template details (including checklist items)
   */
  app.get('/api/audits/templates/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid template ID' }, 400);

      const row = sqlite.prepare('SELECT * FROM audit_templates WHERE id = ?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Template not found' }, 404);

      return c.json({
        success: true,
        data: {
          id: row.id,
          name: row.name,
          industry: row.industry,
          auditType: row.audit_type,
          description: row.description,
          version: row.version,
          categories: row.categories ? JSON.parse(row.categories) : [],
          checklistItems: row.checklist_items ? JSON.parse(row.checklist_items) : [],
          complianceReferences: row.compliance_references ? JSON.parse(row.compliance_references) : [],
          isActive: Boolean(row.is_active),
        },
      }, 200);
    } catch (error) {
      logger.error('Error fetching audit template', { error });
      return c.json({ success: false, error: 'Failed to fetch audit template' }, 500);
    }
  });

  // ── AUDITS ────────────────────────────────────────────────────────────────

  /**
   * GET /api/audits/list
   * List audits with filters
   */
  app.get('/api/audits/list', (c) => {
    try {
      const status = c.req.query('status');
      const auditType = c.req.query('type');
      const department = c.req.query('department');

      let query = 'SELECT * FROM audits WHERE 1=1';
      const params: any[] = [];

      if (status) { query += ' AND status = ?'; params.push(status); }
      if (auditType) { query += ' AND audit_type = ?'; params.push(auditType); }
      if (department) { query += ' AND department = ?'; params.push(department); }
      query += ' ORDER BY scheduled_date DESC';

      const rows = sqlite.prepare(query).all(...params) as any[];

      const data = rows.map((r) => ({
        id: r.id,
        auditNumber: r.audit_number,
        title: r.title,
        auditType: r.audit_type,
        location: r.location,
        department: r.department,
        scheduledDate: r.scheduled_date,
        completedDate: r.completed_date,
        leadAuditor: r.lead_auditor,
        status: r.status,
        overallScore: r.overall_score,
        grade: r.overall_score !== null ? scoreGrade(r.overall_score) : null,
        totalItems: r.total_items,
        failedItems: r.failed_items,
      }));

      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error listing audits', { error });
      return c.json({ success: false, error: 'Failed to fetch audits' }, 500);
    }
  });

  /**
   * POST /api/audits/create
   * Schedule a new audit
   */
  app.post('/api/audits/create', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateAuditSchema.parse(body);

      const dup = sqlite.prepare('SELECT id FROM audits WHERE audit_number = ?').get(v.auditNumber);
      if (dup) return c.json({ success: false, error: 'Audit number already exists' }, 409);

      sqlite.prepare(`
        INSERT INTO audits (
          audit_number, template_id, title, audit_type,
          location, department, industry,
          scheduled_date, due_date,
          lead_auditor, audit_team, auditee
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        v.auditNumber, v.templateId || null, v.title, v.auditType,
        v.location, v.department || null, v.industry || null,
        v.scheduledDate, v.dueDate || null,
        v.leadAuditor,
        v.auditTeam ? JSON.stringify(v.auditTeam) : null,
        v.auditee || null
      );

      const row = sqlite.prepare('SELECT * FROM audits WHERE audit_number = ?').get(v.auditNumber) as any;
      logger.info('Audit scheduled', { id: row.id, number: row.audit_number });

      return c.json({
        success: true,
        data: {
          id: row.id,
          auditNumber: row.audit_number,
          title: row.title,
          status: row.status,
          scheduledDate: row.scheduled_date,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error creating audit', { error });
      return c.json({ success: false, error: 'Failed to create audit' }, 500);
    }
  });

  /**
   * GET /api/audits/:id
   * Get full audit details with findings
   */
  app.get('/api/audits/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid audit ID' }, 400);

      const row = sqlite.prepare('SELECT * FROM audits WHERE id = ?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Audit not found' }, 404);

      const findings = sqlite
        .prepare('SELECT * FROM audit_findings WHERE audit_id = ? ORDER BY severity ASC')
        .all(id) as any[];

      return c.json({
        success: true,
        data: {
          id: row.id,
          auditNumber: row.audit_number,
          title: row.title,
          auditType: row.audit_type,
          location: row.location,
          department: row.department,
          industry: row.industry,
          scheduledDate: row.scheduled_date,
          completedDate: row.completed_date,
          dueDate: row.due_date,
          leadAuditor: row.lead_auditor,
          auditTeam: row.audit_team ? JSON.parse(row.audit_team) : [],
          auditee: row.auditee,
          status: row.status,
          overallScore: row.overall_score,
          grade: row.overall_score !== null ? scoreGrade(row.overall_score) : null,
          totalItems: row.total_items,
          passedItems: row.passed_items,
          failedItems: row.failed_items,
          naItems: row.na_items,
          summary: row.summary,
          nextAuditDate: row.next_audit_date,
          findings: findings.map((f) => ({
            id: f.id,
            category: f.category,
            finding: f.finding,
            severity: f.severity,
            recommendation: f.recommendation,
            responsiblePerson: f.responsible_person,
            dueDate: f.due_date,
            status: f.status,
            regulatoryRef: f.regulatory_ref,
          })),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      }, 200);
    } catch (error) {
      logger.error('Error fetching audit', { error });
      return c.json({ success: false, error: 'Failed to fetch audit' }, 500);
    }
  });

  /**
   * PUT /api/audits/:id
   * Update audit (status, scores, summary)
   */
  app.put('/api/audits/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid audit ID' }, 400);

      const existing = sqlite.prepare('SELECT * FROM audits WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Audit not found' }, 404);

      const body = await c.req.json();
      const v = UpdateAuditSchema.parse(body);

      sqlite.prepare(`
        UPDATE audits SET
          status = ?, completed_date = ?, overall_score = ?,
          total_items = ?, passed_items = ?, failed_items = ?, na_items = ?,
          summary = ?, next_audit_date = ?, updated_at = ?
        WHERE id = ?
      `).run(
        v.status ?? existing.status,
        v.completedDate ?? existing.completed_date,
        v.overallScore ?? existing.overall_score,
        v.totalItems ?? existing.total_items,
        v.passedItems ?? existing.passed_items,
        v.failedItems ?? existing.failed_items,
        v.naItems ?? existing.na_items,
        v.summary ?? existing.summary,
        v.nextAuditDate ?? existing.next_audit_date,
        Date.now(), id
      );

      logger.info('Audit updated', { id, status: v.status });

      return c.json({
        success: true,
        data: {
          id,
          status: v.status ?? existing.status,
          overallScore: v.overallScore ?? existing.overall_score,
          grade: (v.overallScore ?? existing.overall_score) !== null
            ? scoreGrade(v.overallScore ?? existing.overall_score)
            : null,
        },
      }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error updating audit', { error });
      return c.json({ success: false, error: 'Failed to update audit' }, 500);
    }
  });

  // ── AUDIT FINDINGS ────────────────────────────────────────────────────────

  /**
   * POST /api/audits/:id/findings
   * Add finding to audit
   */
  app.post('/api/audits/:auditId/findings', async (c) => {
    try {
      const auditId = parseInt(c.req.param('auditId'), 10);
      if (isNaN(auditId)) return c.json({ success: false, error: 'Invalid audit ID' }, 400);

      const audit = sqlite.prepare('SELECT id FROM audits WHERE id = ?').get(auditId);
      if (!audit) return c.json({ success: false, error: 'Audit not found' }, 404);

      const body = await c.req.json();
      const v = CreateFindingSchema.parse(body);

      sqlite.prepare(`
        INSERT INTO audit_findings (
          audit_id, category, finding, severity,
          recommendation, responsible_person, due_date, regulatory_ref
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        auditId, v.category, v.finding, v.severity,
        v.recommendation || null, v.responsiblePerson || null,
        v.dueDate || null, v.regulatoryRef || null
      );

      const finding = sqlite
        .prepare('SELECT * FROM audit_findings WHERE audit_id = ? ORDER BY id DESC LIMIT 1')
        .get(auditId) as any;

      logger.info('Audit finding added', { findingId: finding.id, auditId, severity: v.severity });

      return c.json({
        success: true,
        data: {
          id: finding.id,
          auditId,
          category: finding.category,
          severity: finding.severity,
          status: finding.status,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error adding audit finding', { error });
      return c.json({ success: false, error: 'Failed to add finding' }, 500);
    }
  });

  /**
   * PUT /api/audits/findings/:findingId
   * Update finding status / closure
   */
  app.put('/api/audits/findings/:findingId', async (c) => {
    try {
      const findingId = parseInt(c.req.param('findingId'), 10);
      if (isNaN(findingId)) return c.json({ success: false, error: 'Invalid finding ID' }, 400);

      const existing = sqlite.prepare('SELECT * FROM audit_findings WHERE id = ?').get(findingId) as any;
      if (!existing) return c.json({ success: false, error: 'Finding not found' }, 404);

      const body = await c.req.json();
      const v = UpdateFindingSchema.parse(body);

      sqlite.prepare(`
        UPDATE audit_findings SET
          status = ?, closed_date = ?, closure_notes = ?,
          responsible_person = ?, due_date = ?, recommendation = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        v.status ?? existing.status,
        v.closedDate ?? existing.closed_date,
        v.closureNotes ?? existing.closure_notes,
        v.responsiblePerson ?? existing.responsible_person,
        v.dueDate ?? existing.due_date,
        v.recommendation ?? existing.recommendation,
        Date.now(), findingId
      );

      logger.info('Audit finding updated', { findingId, status: v.status });

      return c.json({
        success: true,
        data: { id: findingId, status: v.status ?? existing.status },
      }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error updating audit finding', { error });
      return c.json({ success: false, error: 'Failed to update finding' }, 500);
    }
  });

  /**
   * GET /api/audits/findings/open
   * Get all open findings (across all audits) — static route before /:id
   */
  app.get('/api/audits/findings/open', (c) => {
    try {
      const severity = c.req.query('severity');
      let query = `
        SELECT af.*, a.audit_number, a.title as audit_title
        FROM audit_findings af
        JOIN audits a ON af.audit_id = a.id
        WHERE af.status IN ('Open', 'In Progress')
      `;
      const params: any[] = [];

      if (severity) { query += ' AND af.severity = ?'; params.push(severity); }
      query += ' ORDER BY CASE af.severity WHEN \'Critical\' THEN 1 WHEN \'Major\' THEN 2 WHEN \'Minor\' THEN 3 ELSE 4 END';

      const rows = sqlite.prepare(query).all(...params) as any[];

      const data = rows.map((r) => ({
        id: r.id,
        auditId: r.audit_id,
        auditNumber: r.audit_number,
        auditTitle: r.audit_title,
        category: r.category,
        finding: r.finding,
        severity: r.severity,
        recommendation: r.recommendation,
        responsiblePerson: r.responsible_person,
        dueDate: r.due_date,
        status: r.status,
        regulatoryRef: r.regulatory_ref,
      }));

      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error fetching open findings', { error });
      return c.json({ success: false, error: 'Failed to fetch open findings' }, 500);
    }
  });

  // ── COMPLIANCE REQUIREMENTS ───────────────────────────────────────────────

  /**
   * GET /api/compliance/requirements
   * List compliance requirements
   */
  app.get('/api/compliance/requirements', (c) => {
    try {
      const standardId = c.req.query('standard');
      const status = c.req.query('status');

      let query = 'SELECT * FROM compliance_requirements WHERE 1=1';
      const params: any[] = [];

      if (standardId) { query += ' AND standard_id = ?'; params.push(standardId); }
      if (status) { query += ' AND status = ?'; params.push(status); }
      query += ' ORDER BY standard_id ASC, clause_id ASC';

      const rows = sqlite.prepare(query).all(...params) as any[];

      const data = rows.map((r) => ({
        id: r.id,
        standardId: r.standard_id,
        clauseId: r.clause_id,
        requirement: r.requirement,
        status: r.status,
        maturityLevel: r.maturity_level,
        assignee: r.assignee,
        dueDate: r.due_date,
        lastAssessedDate: r.last_assessed_date,
        gapCount: r.gaps ? JSON.parse(r.gaps).length : 0,
        actionCount: r.action_items ? JSON.parse(r.action_items).length : 0,
      }));

      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error listing compliance requirements', { error });
      return c.json({ success: false, error: 'Failed to fetch compliance requirements' }, 500);
    }
  });

  /**
   * POST /api/compliance/requirements
   * Create compliance requirement
   */
  app.post('/api/compliance/requirements', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateComplianceReqSchema.parse(body);

      sqlite.prepare(`
        INSERT INTO compliance_requirements (
          standard_id, clause_id, requirement, description,
          status, maturity_level,
          evidence, gaps, action_items,
          assignee, due_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        v.standardId, v.clauseId, v.requirement, v.description || null,
        v.status, v.maturityLevel,
        v.evidence ? JSON.stringify(v.evidence) : null,
        v.gaps ? JSON.stringify(v.gaps) : null,
        v.actionItems ? JSON.stringify(v.actionItems) : null,
        v.assignee || null, v.dueDate || null, v.notes || null
      );

      const row = sqlite.prepare('SELECT * FROM compliance_requirements ORDER BY id DESC LIMIT 1').get() as any;
      logger.info('Compliance requirement created', { id: row.id, standard: v.standardId, clause: v.clauseId });

      return c.json({
        success: true,
        data: {
          id: row.id,
          standardId: row.standard_id,
          clauseId: row.clause_id,
          requirement: row.requirement,
          status: row.status,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error creating compliance requirement', { error });
      return c.json({ success: false, error: 'Failed to create compliance requirement' }, 500);
    }
  });

  /**
   * GET /api/compliance/requirements/:id
   * Get compliance requirement details
   */
  app.get('/api/compliance/requirements/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid requirement ID' }, 400);

      const row = sqlite.prepare('SELECT * FROM compliance_requirements WHERE id = ?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Compliance requirement not found' }, 404);

      return c.json({
        success: true,
        data: {
          id: row.id,
          standardId: row.standard_id,
          clauseId: row.clause_id,
          requirement: row.requirement,
          description: row.description,
          status: row.status,
          maturityLevel: row.maturity_level,
          evidence: row.evidence ? JSON.parse(row.evidence) : [],
          gaps: row.gaps ? JSON.parse(row.gaps) : [],
          actionItems: row.action_items ? JSON.parse(row.action_items) : [],
          assignee: row.assignee,
          dueDate: row.due_date,
          lastAssessedDate: row.last_assessed_date,
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      }, 200);
    } catch (error) {
      logger.error('Error fetching compliance requirement', { error });
      return c.json({ success: false, error: 'Failed to fetch compliance requirement' }, 500);
    }
  });

  /**
   * PUT /api/compliance/requirements/:id
   * Update compliance requirement status / gaps / evidence
   */
  app.put('/api/compliance/requirements/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid requirement ID' }, 400);

      const existing = sqlite.prepare('SELECT * FROM compliance_requirements WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Compliance requirement not found' }, 404);

      const body = await c.req.json();
      const v = UpdateComplianceReqSchema.parse(body);

      sqlite.prepare(`
        UPDATE compliance_requirements SET
          status = ?, maturity_level = ?,
          evidence = ?, gaps = ?, action_items = ?,
          assignee = ?, due_date = ?, last_assessed_date = ?,
          notes = ?, updated_at = ?
        WHERE id = ?
      `).run(
        v.status ?? existing.status,
        v.maturityLevel ?? existing.maturity_level,
        v.evidence ? JSON.stringify(v.evidence) : existing.evidence,
        v.gaps ? JSON.stringify(v.gaps) : existing.gaps,
        v.actionItems ? JSON.stringify(v.actionItems) : existing.action_items,
        v.assignee ?? existing.assignee,
        v.dueDate ?? existing.due_date,
        v.lastAssessedDate ?? existing.last_assessed_date,
        v.notes ?? existing.notes,
        Date.now(), id
      );

      logger.info('Compliance requirement updated', { id, status: v.status });

      return c.json({
        success: true,
        data: { id, status: v.status ?? existing.status, maturityLevel: v.maturityLevel ?? existing.maturity_level },
      }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error updating compliance requirement', { error });
      return c.json({ success: false, error: 'Failed to update compliance requirement' }, 500);
    }
  });

  /**
   * GET /api/compliance/gap-analysis
   * Compliance gap analysis by standard
   */
  app.get('/api/compliance/gap-analysis', (c) => {
    try {
      const standardId = c.req.query('standard');

      let query = 'SELECT * FROM compliance_requirements WHERE 1=1';
      const params: any[] = [];
      if (standardId) { query += ' AND standard_id = ?'; params.push(standardId); }

      const rows = sqlite.prepare(query).all(...params) as any[];

      // Group by standard
      const grouped: Record<string, any> = {};
      for (const r of rows) {
        if (!grouped[r.standard_id]) {
          grouped[r.standard_id] = {
            standardId: r.standard_id,
            total: 0,
            compliant: 0,
            partiallyCompliant: 0,
            nonCompliant: 0,
            notStarted: 0,
            inProgress: 0,
            gaps: [],
          };
        }
        const g = grouped[r.standard_id];
        g.total++;
        if (r.status === 'compliant') g.compliant++;
        else if (r.status === 'partially_compliant') g.partiallyCompliant++;
        else if (r.status === 'non_compliant') g.nonCompliant++;
        else if (r.status === 'not_started') g.notStarted++;
        else if (r.status === 'in_progress') g.inProgress++;

        if (r.gaps) {
          const parsed = JSON.parse(r.gaps);
          if (parsed.length > 0) {
            g.gaps.push({ clauseId: r.clause_id, requirement: r.requirement, gaps: parsed });
          }
        }
      }

      const result = Object.values(grouped).map((g: any) => ({
        ...g,
        complianceRate: g.total > 0 ? Math.round((g.compliant / g.total) * 100) : 0,
        gapCount: g.gaps.length,
      }));

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      logger.error('Error generating gap analysis', { error });
      return c.json({ success: false, error: 'Failed to generate gap analysis' }, 500);
    }
  });
};
