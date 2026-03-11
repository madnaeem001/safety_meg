import { Hono } from 'hono';
import { z } from 'zod';
import Database from 'better-sqlite3';
import { logger } from '../services/logger';

const sqlite = new Database('local.sqlite');

// ==================== CONSTANTS ====================

const SEVERITY_LABELS: Record<number, string> = {
  1: 'Negligible',
  2: 'Minor',
  3: 'Moderate',
  4: 'Major',
  5: 'Catastrophic',
};

const LIKELIHOOD_LABELS: Record<number, string> = {
  1: 'Rare',
  2: 'Unlikely',
  3: 'Possible',
  4: 'Likely',
  5: 'Almost Certain',
};

function calcRiskLevel(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score <= 4) return 'Low';
  if (score <= 9) return 'Medium';
  if (score <= 16) return 'High';
  return 'Critical';
}

// ==================== VALIDATION SCHEMAS ====================

const CreateHazardTemplateSchema = z.object({
  hazardCode: z.string().min(1, 'Hazard code required'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  category: z.enum([
    'Physical', 'Chemical', 'Biological', 'Ergonomic', 'Psychosocial',
    'Mechanical', 'Electrical', 'Thermal', 'Radiation', 'Environmental',
  ]),
  description: z.string().optional(),
  typicalSeverity: z.number().int().min(1).max(5).default(3),
  typicalLikelihood: z.number().int().min(1).max(5).default(3),
  potentialConsequences: z.array(z.string()).optional(),
  regulatoryReferences: z.array(z.object({ standard: z.string(), citation: z.string() })).optional(),
  suggestedControls: z.array(z.object({
    type: z.enum(['Elimination', 'Substitution', 'Engineering', 'Administrative', 'PPE']),
    description: z.string(),
    effectiveness: z.enum(['High', 'Medium', 'Low']).default('Medium'),
    implemented: z.boolean().default(false),
  })).optional(),
  industries: z.array(z.string()).optional(),
});

const CreateAssessmentSchema = z.object({
  hazardTemplateId: z.number().int().positive().optional(),
  hazardName: z.string().min(3, 'Hazard name required'),
  hazardCategory: z.enum([
    'Physical', 'Chemical', 'Biological', 'Ergonomic', 'Psychosocial',
    'Mechanical', 'Electrical', 'Thermal', 'Radiation', 'Environmental',
  ]),
  location: z.string().min(1, 'Location required'),
  department: z.string().optional(),
  taskOrActivity: z.string().optional(),
  assessedBy: z.string().min(1, 'Assessor name required'),
  assessmentDate: z.string().min(1, 'Assessment date required'),
  reviewDate: z.string().optional(),
  severity: z.number().int().min(1).max(5),
  likelihood: z.number().int().min(1).max(5),
  controls: z.array(z.object({
    type: z.enum(['Elimination', 'Substitution', 'Engineering', 'Administrative', 'PPE']),
    description: z.string(),
    effectiveness: z.enum(['High', 'Medium', 'Low']).default('Medium'),
    implemented: z.boolean().default(false),
  })).optional(),
  residualSeverity: z.number().int().min(1).max(5).optional(),
  residualLikelihood: z.number().int().min(1).max(5).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['Draft', 'Active', 'Under Review', 'Archived']).default('Draft'),
});

const UpdateAssessmentSchema = z.object({
  severity: z.number().int().min(1).max(5).optional(),
  likelihood: z.number().int().min(1).max(5).optional(),
  controls: z.array(z.object({
    type: z.enum(['Elimination', 'Substitution', 'Engineering', 'Administrative', 'PPE']),
    description: z.string(),
    effectiveness: z.enum(['High', 'Medium', 'Low']),
    implemented: z.boolean(),
  })).optional(),
  residualSeverity: z.number().int().min(1).max(5).optional(),
  residualLikelihood: z.number().int().min(1).max(5).optional(),
  status: z.enum(['Draft', 'Active', 'Under Review', 'Archived']).optional(),
  reviewDate: z.string().optional(),
  notes: z.string().optional(),
  description: z.string().optional(),
});

const CreateRegisterItemSchema = z.object({
  riskCode: z.string().min(1, 'Risk code required (e.g. R-001)'),
  hazard: z.string().min(3, 'Hazard description required'),
  consequence: z.string().min(3, 'Consequence required'),
  likelihood: z.number().int().min(1).max(5),
  severity: z.number().int().min(1).max(5),
  mitigation: z.string().optional(),
  controlType: z.enum(['Elimination', 'Substitution', 'Engineering', 'Administrative', 'PPE']).optional(),
  responsiblePerson: z.string().optional(),
  targetDate: z.string().optional(),
  assessmentId: z.number().int().positive().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
});

const UpdateRegisterItemSchema = z.object({
  status: z.enum(['Open', 'Mitigated', 'Closed', 'Monitoring']).optional(),
  mitigation: z.string().optional(),
  controlType: z.enum(['Elimination', 'Substitution', 'Engineering', 'Administrative', 'PPE']).optional(),
  responsiblePerson: z.string().optional(),
  targetDate: z.string().optional(),
  likelihood: z.number().int().min(1).max(5).optional(),
  severity: z.number().int().min(1).max(5).optional(),
});

// ==================== ROUTES ====================

export const riskRoutes = (app: Hono) => {

  // ── RISK MATRIX REFERENCE ────────────────────────────────────────────────

  /**
   * GET /api/risks/matrix
   * Returns the 5x5 risk matrix reference data
   */
  app.get('/api/risks/matrix', (c) => {
    const matrix: any[][] = [];
    for (let s = 5; s >= 1; s--) {
      const row = [];
      for (let l = 1; l <= 5; l++) {
        const score = s * l;
        row.push({ severity: s, likelihood: l, score, level: calcRiskLevel(score) });
      }
      matrix.push(row);
    }
    return c.json({
      success: true,
      data: {
        matrix,
        severityLevels: SEVERITY_LABELS,
        likelihoodLevels: LIKELIHOOD_LABELS,
        riskLevels: {
          Low: '1-4',
          Medium: '5-9',
          High: '10-16',
          Critical: '17-25',
        },
      },
    }, 200);
  });

  // ── RISK STATS ────────────────────────────────────────────────────────────

  /**
   * GET /api/risks/stats
   * Risk dashboard statistics
   */
  app.get('/api/risks/stats', (c) => {
    try {
      const assessmentStats = sqlite.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN risk_level = 'Critical' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN risk_level = 'Medium' THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN risk_level = 'Low' THEN 1 ELSE 0 END) as low
        FROM risk_assessments
      `).get() as any;

      const registerStats = sqlite.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
          SUM(CASE WHEN status = 'Mitigated' THEN 1 ELSE 0 END) as mitigated,
          SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed
        FROM risk_register
      `).get() as any;

      return c.json({
        success: true,
        data: {
          assessments: assessmentStats,
          register: registerStats,
        },
      }, 200);
    } catch (error) {
      logger.error('Error fetching risk stats', { error });
      return c.json({ success: false, error: 'Failed to fetch risk stats' }, 500);
    }
  });

  // ── HAZARD TEMPLATES ─────────────────────────────────────────────────────

  /**
   * GET /api/risks/hazards
   * List hazard templates
   */
  app.get('/api/risks/hazards', (c) => {
    try {
      const category = c.req.query('category');
      let query = 'SELECT * FROM hazard_templates WHERE is_active = 1';
      const params: any[] = [];
      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      query += ' ORDER BY category ASC, name ASC';
      const rows = sqlite.prepare(query).all(...params) as any[];

      const data = rows.map((r) => ({
        id: r.id,
        hazardCode: r.hazard_code,
        name: r.name,
        category: r.category,
        description: r.description,
        typicalSeverity: r.typical_severity,
        typicalLikelihood: r.typical_likelihood,
        typicalScore: r.typical_severity * r.typical_likelihood,
        typicalRiskLevel: calcRiskLevel(r.typical_severity * r.typical_likelihood),
        suggestedControls: r.suggested_controls ? JSON.parse(r.suggested_controls) : [],
        industries: r.industries ? JSON.parse(r.industries) : [],
      }));

      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error fetching hazard templates', { error });
      return c.json({ success: false, error: 'Failed to fetch hazard templates' }, 500);
    }
  });

  /**
   * POST /api/risks/hazards
   * Create a hazard template
   */
  app.post('/api/risks/hazards', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateHazardTemplateSchema.parse(body);

      const dup = sqlite.prepare('SELECT id FROM hazard_templates WHERE hazard_code = ?').get(v.hazardCode);
      if (dup) {
        return c.json({ success: false, error: 'Hazard code already exists' }, 409);
      }

      sqlite.prepare(`
        INSERT INTO hazard_templates (
          hazard_code, name, category, description,
          typical_severity, typical_likelihood,
          potential_consequences, regulatory_references,
          suggested_controls, industries
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        v.hazardCode, v.name, v.category, v.description || null,
        v.typicalSeverity, v.typicalLikelihood,
        v.potentialConsequences ? JSON.stringify(v.potentialConsequences) : null,
        v.regulatoryReferences ? JSON.stringify(v.regulatoryReferences) : null,
        v.suggestedControls ? JSON.stringify(v.suggestedControls) : null,
        v.industries ? JSON.stringify(v.industries) : null
      );

      const row = sqlite.prepare('SELECT * FROM hazard_templates WHERE hazard_code = ?').get(v.hazardCode) as any;
      logger.info('Hazard template created', { id: row.id, code: row.hazard_code });

      return c.json({
        success: true,
        data: {
          id: row.id,
          hazardCode: row.hazard_code,
          name: row.name,
          category: row.category,
          typicalSeverity: row.typical_severity,
          typicalLikelihood: row.typical_likelihood,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error creating hazard template', { error });
      return c.json({ success: false, error: 'Failed to create hazard template' }, 500);
    }
  });

  /**
   * GET /api/risks/hazards/:id
   * Get hazard template details
   */
  app.get('/api/risks/hazards/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid hazard ID' }, 400);

      const row = sqlite.prepare('SELECT * FROM hazard_templates WHERE id = ?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Hazard template not found' }, 404);

      return c.json({
        success: true,
        data: {
          id: row.id,
          hazardCode: row.hazard_code,
          name: row.name,
          category: row.category,
          description: row.description,
          typicalSeverity: row.typical_severity,
          typicalLikelihood: row.typical_likelihood,
          typicalScore: row.typical_severity * row.typical_likelihood,
          typicalRiskLevel: calcRiskLevel(row.typical_severity * row.typical_likelihood),
          potentialConsequences: row.potential_consequences ? JSON.parse(row.potential_consequences) : [],
          regulatoryReferences: row.regulatory_references ? JSON.parse(row.regulatory_references) : [],
          suggestedControls: row.suggested_controls ? JSON.parse(row.suggested_controls) : [],
          industries: row.industries ? JSON.parse(row.industries) : [],
        },
      }, 200);
    } catch (error) {
      logger.error('Error fetching hazard template', { error });
      return c.json({ success: false, error: 'Failed to fetch hazard template' }, 500);
    }
  });

  // ── RISK ASSESSMENTS ─────────────────────────────────────────────────────

  /**
   * GET /api/risks/assessments
   * List risk assessments
   */
  app.get('/api/risks/assessments', (c) => {
    try {
      const status = c.req.query('status');
      const riskLevel = c.req.query('riskLevel');
      const department = c.req.query('department');

      let query = 'SELECT * FROM risk_assessments WHERE 1=1';
      const params: any[] = [];

      if (status) { query += ' AND status = ?'; params.push(status); }
      if (riskLevel) { query += ' AND risk_level = ?'; params.push(riskLevel); }
      if (department) { query += ' AND department = ?'; params.push(department); }

      query += ' ORDER BY created_at DESC';

      const rows = sqlite.prepare(query).all(...params) as any[];

      const data = rows.map((r) => ({
        id: r.id,
        hazardName: r.hazard_name,
        hazardCategory: r.hazard_category,
        location: r.location,
        department: r.department,
        assessedBy: r.assessed_by,
        assessmentDate: r.assessment_date,
        severity: r.severity,
        likelihood: r.likelihood,
        riskScore: r.risk_score,
        riskLevel: r.risk_level,
        residualRisk: r.residual_risk,
        residualRiskLevel: r.residual_risk_level,
        status: r.status,
        reviewDate: r.review_date,
      }));

      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error listing risk assessments', { error });
      return c.json({ success: false, error: 'Failed to fetch risk assessments' }, 500);
    }
  });

  /**
   * POST /api/risks/assessments
   * Create a risk assessment
   */
  app.post('/api/risks/assessments', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateAssessmentSchema.parse(body);

      const riskScore = v.severity * v.likelihood;
      const riskLevel = calcRiskLevel(riskScore);

      let residualRisk: number | null = null;
      let residualRiskLevel: string | null = null;
      if (v.residualSeverity && v.residualLikelihood) {
        residualRisk = v.residualSeverity * v.residualLikelihood;
        residualRiskLevel = calcRiskLevel(residualRisk);
      }

      sqlite.prepare(`
        INSERT INTO risk_assessments (
          hazard_template_id, hazard_name, hazard_category,
          location, department, task_or_activity,
          assessed_by, assessment_date, review_date,
          severity, likelihood, risk_score, risk_level,
          controls,
          residual_severity, residual_likelihood, residual_risk, residual_risk_level,
          description, notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        v.hazardTemplateId || null,
        v.hazardName, v.hazardCategory,
        v.location, v.department || null, v.taskOrActivity || null,
        v.assessedBy, v.assessmentDate, v.reviewDate || null,
        v.severity, v.likelihood, riskScore, riskLevel,
        v.controls ? JSON.stringify(v.controls) : null,
        v.residualSeverity || null, v.residualLikelihood || null,
        residualRisk, residualRiskLevel,
        v.description || null, v.notes || null, v.status
      );

      const row = sqlite.prepare(`
        SELECT * FROM risk_assessments ORDER BY id DESC LIMIT 1
      `).get() as any;

      logger.info('Risk assessment created', { id: row.id, level: riskLevel, score: riskScore });

      return c.json({
        success: true,
        data: {
          id: row.id,
          hazardName: row.hazard_name,
          riskScore,
          riskLevel,
          residualRisk,
          residualRiskLevel,
          status: row.status,
          createdAt: row.created_at,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error creating risk assessment', { error });
      return c.json({ success: false, error: 'Failed to create risk assessment' }, 500);
    }
  });

  /**
   * GET /api/risks/assessments/:id
   * Get risk assessment details
   */
  app.get('/api/risks/assessments/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid assessment ID' }, 400);

      const row = sqlite.prepare('SELECT * FROM risk_assessments WHERE id = ?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Risk assessment not found' }, 404);

      // Get linked register items
      const registerItems = sqlite
        .prepare('SELECT id, risk_code, status, hazard FROM risk_register WHERE assessment_id = ?')
        .all(id) as any[];

      return c.json({
        success: true,
        data: {
          id: row.id,
          hazardName: row.hazard_name,
          hazardCategory: row.hazard_category,
          location: row.location,
          department: row.department,
          taskOrActivity: row.task_or_activity,
          assessedBy: row.assessed_by,
          assessmentDate: row.assessment_date,
          reviewDate: row.review_date,
          severity: row.severity,
          severityLabel: SEVERITY_LABELS[row.severity],
          likelihood: row.likelihood,
          likelihoodLabel: LIKELIHOOD_LABELS[row.likelihood],
          riskScore: row.risk_score,
          riskLevel: row.risk_level,
          controls: row.controls ? JSON.parse(row.controls) : [],
          residualSeverity: row.residual_severity,
          residualLikelihood: row.residual_likelihood,
          residualRisk: row.residual_risk,
          residualRiskLevel: row.residual_risk_level,
          description: row.description,
          notes: row.notes,
          status: row.status,
          linkedRegisterItems: registerItems,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      }, 200);
    } catch (error) {
      logger.error('Error fetching risk assessment', { error });
      return c.json({ success: false, error: 'Failed to fetch risk assessment' }, 500);
    }
  });

  /**
   * PUT /api/risks/assessments/:id
   * Update risk assessment
   */
  app.put('/api/risks/assessments/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid assessment ID' }, 400);

      const existing = sqlite.prepare('SELECT * FROM risk_assessments WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Risk assessment not found' }, 404);

      const body = await c.req.json();
      const v = UpdateAssessmentSchema.parse(body);

      const severity = v.severity ?? existing.severity;
      const likelihood = v.likelihood ?? existing.likelihood;
      const riskScore = severity * likelihood;
      const riskLevel = calcRiskLevel(riskScore);

      let residualRisk = existing.residual_risk;
      let residualRiskLevel = existing.residual_risk_level;
      if (v.residualSeverity && v.residualLikelihood) {
        residualRisk = v.residualSeverity * v.residualLikelihood;
        residualRiskLevel = calcRiskLevel(residualRisk);
      }

      sqlite.prepare(`
        UPDATE risk_assessments SET
          severity = ?, likelihood = ?, risk_score = ?, risk_level = ?,
          controls = ?,
          residual_severity = ?, residual_likelihood = ?,
          residual_risk = ?, residual_risk_level = ?,
          status = ?, review_date = ?, notes = ?, description = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        severity, likelihood, riskScore, riskLevel,
        v.controls ? JSON.stringify(v.controls) : existing.controls,
        v.residualSeverity ?? existing.residual_severity,
        v.residualLikelihood ?? existing.residual_likelihood,
        residualRisk, residualRiskLevel,
        v.status ?? existing.status,
        v.reviewDate ?? existing.review_date,
        v.notes ?? existing.notes,
        v.description ?? existing.description,
        Date.now(),
        id
      );

      logger.info('Risk assessment updated', { id, riskLevel });

      return c.json({
        success: true,
        data: { id, riskScore, riskLevel, residualRisk, residualRiskLevel, status: v.status ?? existing.status },
      }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error updating risk assessment', { error });
      return c.json({ success: false, error: 'Failed to update risk assessment' }, 500);
    }
  });

  // ── RISK REGISTER ─────────────────────────────────────────────────────────

  /**
   * GET /api/risks/register
   * Get risk register
   */
  app.get('/api/risks/register', (c) => {
    try {
      const status = c.req.query('status');
      const riskLevel = c.req.query('riskLevel');
      const department = c.req.query('department');

      let query = 'SELECT * FROM risk_register WHERE 1=1';
      const params: any[] = [];

      if (status) { query += ' AND status = ?'; params.push(status); }
      if (riskLevel) { query += ' AND risk_level = ?'; params.push(riskLevel); }
      if (department) { query += ' AND department = ?'; params.push(department); }

      query += ' ORDER BY risk_score DESC, created_at DESC';

      const rows = sqlite.prepare(query).all(...params) as any[];

      const data = rows.map((r) => ({
        id: r.id,
        riskCode: r.risk_code,
        hazard: r.hazard,
        consequence: r.consequence,
        likelihood: r.likelihood,
        severity: r.severity,
        riskScore: r.risk_score,
        riskLevel: r.risk_level,
        mitigation: r.mitigation,
        controlType: r.control_type,
        responsiblePerson: r.responsible_person,
        targetDate: r.target_date,
        status: r.status,
        department: r.department,
        location: r.location,
      }));

      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error fetching risk register', { error });
      return c.json({ success: false, error: 'Failed to fetch risk register' }, 500);
    }
  });

  /**
   * POST /api/risks/register
   * Add item to risk register
   */
  app.post('/api/risks/register', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateRegisterItemSchema.parse(body);

      const dup = sqlite.prepare('SELECT id FROM risk_register WHERE risk_code = ?').get(v.riskCode);
      if (dup) {
        return c.json({ success: false, error: 'Risk code already exists' }, 409);
      }

      const riskScore = v.likelihood * v.severity;
      const riskLevel = calcRiskLevel(riskScore);

      sqlite.prepare(`
        INSERT INTO risk_register (
          risk_code, hazard, consequence,
          likelihood, severity, risk_score, risk_level,
          mitigation, control_type, responsible_person, target_date,
          assessment_id, department, location
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        v.riskCode, v.hazard, v.consequence,
        v.likelihood, v.severity, riskScore, riskLevel,
        v.mitigation || null, v.controlType || null,
        v.responsiblePerson || null, v.targetDate || null,
        v.assessmentId || null, v.department || null, v.location || null
      );

      const row = sqlite.prepare('SELECT * FROM risk_register WHERE risk_code = ?').get(v.riskCode) as any;
      logger.info('Risk register item created', { id: row.id, code: v.riskCode, level: riskLevel });

      return c.json({
        success: true,
        data: {
          id: row.id,
          riskCode: row.risk_code,
          riskScore,
          riskLevel,
          status: row.status,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error creating risk register item', { error });
      return c.json({ success: false, error: 'Failed to create risk register item' }, 500);
    }
  });

  /**
   * GET /api/risks/register/:id
   * Get risk register item details
   */
  app.get('/api/risks/register/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid register item ID' }, 400);

      const row = sqlite.prepare('SELECT * FROM risk_register WHERE id = ?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Risk register item not found' }, 404);

      return c.json({
        success: true,
        data: {
          id: row.id,
          riskCode: row.risk_code,
          hazard: row.hazard,
          consequence: row.consequence,
          likelihood: row.likelihood,
          likelihoodLabel: LIKELIHOOD_LABELS[row.likelihood],
          severity: row.severity,
          severityLabel: SEVERITY_LABELS[row.severity],
          riskScore: row.risk_score,
          riskLevel: row.risk_level,
          mitigation: row.mitigation,
          controlType: row.control_type,
          responsiblePerson: row.responsible_person,
          targetDate: row.target_date,
          status: row.status,
          assessmentId: row.assessment_id,
          department: row.department,
          location: row.location,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      }, 200);
    } catch (error) {
      logger.error('Error fetching risk register item', { error });
      return c.json({ success: false, error: 'Failed to fetch risk register item' }, 500);
    }
  });

  /**
   * PUT /api/risks/register/:id
   * Update risk register item
   */
  app.put('/api/risks/register/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid register item ID' }, 400);

      const existing = sqlite.prepare('SELECT * FROM risk_register WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Risk register item not found' }, 404);

      const body = await c.req.json();
      const v = UpdateRegisterItemSchema.parse(body);

      const likelihood = v.likelihood ?? existing.likelihood;
      const severity = v.severity ?? existing.severity;
      const riskScore = likelihood * severity;
      const riskLevel = calcRiskLevel(riskScore);

      sqlite.prepare(`
        UPDATE risk_register SET
          status = ?, mitigation = ?, control_type = ?,
          responsible_person = ?, target_date = ?,
          likelihood = ?, severity = ?, risk_score = ?, risk_level = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        v.status ?? existing.status,
        v.mitigation ?? existing.mitigation,
        v.controlType ?? existing.control_type,
        v.responsiblePerson ?? existing.responsible_person,
        v.targetDate ?? existing.target_date,
        likelihood, severity, riskScore, riskLevel,
        Date.now(), id
      );

      logger.info('Risk register item updated', { id, status: v.status, riskLevel });

      return c.json({
        success: true,
        data: { id, riskScore, riskLevel, status: v.status ?? existing.status },
      }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error updating risk register item', { error });
      return c.json({ success: false, error: 'Failed to update risk register item' }, 500);
    }
  });
};
