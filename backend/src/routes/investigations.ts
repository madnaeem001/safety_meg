import { Hono } from 'hono';
import { z } from 'zod';
import Database from 'better-sqlite3';
import { logger } from '../services/logger';

// Initialize database
const sqlite = new Database('local.sqlite');

// ==================== VALIDATION SCHEMAS ====================

// Investigation Creation Schema
const CreateInvestigationSchema = z.object({
  incidentId: z.number().int().positive('Incident ID must be a positive integer'),
  investigationDate: z.string().min(1, 'Investigation date is required'),
  investigator: z.string().min(1, 'Investigator name is required'),
  industry: z.string().optional(),
  findings: z.string().optional(),
});

// Investigation Update Schema
const UpdateInvestigationSchema = z.object({
  findings: z.string().optional(),
  status: z.enum(['Open', 'In Progress', 'Completed', 'Closed']).optional(),
  isoClause: z.string().optional(),
  regulatoryReportable: z.boolean().optional(),
});

// RCCA Creation Schema
const CreateRCCASchema = z.object({
  investigationId: z.number().int().positive('Investigation ID must be a positive integer'),
  rootCauses: z.array(z.string().min(1)).optional(),
  whyAnalysis: z.record(z.string(), z.string()).optional(),
  fishboneFactors: z.record(z.string(), z.array(z.string())).optional(),
  correctiveActions: z.array(
    z.object({
      action: z.string().min(1),
      assignedTo: z.string().min(1),
      dueDate: z.string().min(1),
      status: z.string().default('Open'),
    })
  ).optional(),
  preventiveMeasures: z.array(z.string()).optional(),
  lessonsLearned: z.object({
    whatHappened: z.string().optional(),
    whyMatters: z.string().optional(),
    keyTakeaways: z.string().optional(),
    recommendations: z.string().optional(),
  }).optional(),
});

// Barrier Schema
const BarrierSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(['engineering', 'administrative', 'ppe', 'procedural']),
  effectiveness: z.number().min(0).max(100),
  status: z.enum(['active', 'degraded', 'failed']),
});

// Threat Schema
const ThreatSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  preventiveBarriers: z.array(BarrierSchema).optional(),
});

// Consequence Schema
const ConsequenceSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  severity: z.enum(['minor', 'moderate', 'major', 'catastrophic']),
  mitigativeBarriers: z.array(BarrierSchema).optional(),
});

// Bow-Tie Scenario Schema
const CreateBowTieSchema = z.object({
  investigationId: z.number().int().positive().optional(),
  title: z.string().min(1, 'Title is required'),
  topEvent: z.string().min(1, 'Top event is required'),
  hazard: z.string().min(1, 'Hazard is required'),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  threats: z.array(ThreatSchema).optional(),
  consequences: z.array(ConsequenceSchema).optional(),
  owner: z.string().optional(),
});

// ==================== ROUTES ====================

export const investigationRoutes = (app: Hono) => {
  /**
   * GET /api/investigations/list
   * List all investigations with filters (MUST BE BEFORE :id ROUTES)
   */
  app.get('/api/investigations/list', (c) => {
    try {
      const status = c.req.query('status');
      const industry = c.req.query('industry');

      logger.info('Fetching investigations list', { status, industry });

      let query = 'SELECT * FROM investigations WHERE 1=1';
      const params: any[] = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      if (industry) {
        query += ' AND industry = ?';
        params.push(industry);
      }

      query += ' ORDER BY created_at DESC';

      const investigations = sqlite
        .prepare(query)
        .all(...params) as any[];

      const formatted = investigations.map((inv) => ({
        id: inv.id,
        incidentId: inv.incident_id,
        investigationDate: inv.investigation_date,
        investigator: inv.investigator,
        status: inv.status,
        industry: inv.industry,
        findings: inv.findings,
        isoClause: inv.iso_clause,
        regulatoryReportable: Boolean(inv.regulatory_reportable),
        createdAt: inv.created_at,
        updatedAt: inv.updated_at,
      }));

      return c.json(
        {
          success: true,
          data: formatted,
          count: formatted.length,
        },
        200
      );
    } catch (error) {
      logger.error('Error fetching investigations list', { error });
      return c.json(
        { success: false, error: 'Failed to fetch investigations' },
        500
      );
    }
  });

  /**
   * POST /api/investigations/assign
   * Assign investigator to incident (MUST BE BEFORE :id ROUTES)
   */
  app.post('/api/investigations/assign', async (c) => {
    try {
      const body = await c.req.json();

      const validated = z
        .object({
          incidentId: z.number().int().positive(),
          investigator: z.string().min(1),
        })
        .parse(body);

      logger.info('Assigning investigator', {
        incidentId: validated.incidentId,
        investigator: validated.investigator,
      });

      // Check investigation exists for incident
      const investigation = sqlite
        .prepare('SELECT id FROM investigations WHERE incident_id = ?')
        .get(validated.incidentId);

      if (!investigation) {
        logger.warn('Investigation not found', {
          incidentId: validated.incidentId,
        });
        return c.json(
          { success: false, error: 'Investigation not found' },
          404
        );
      }

      // Update investigator
      const updateStmt = sqlite.prepare(
        'UPDATE investigations SET investigator = ?, updated_at = ? WHERE incident_id = ?'
      );

      updateStmt.run(validated.investigator, Date.now(), validated.incidentId);

      // Return updated investigation
      const updated = sqlite
        .prepare('SELECT * FROM investigations WHERE incident_id = ?')
        .get(validated.incidentId) as any;

      logger.info('Investigator assigned successfully', {
        incidentId: validated.incidentId,
      });

      return c.json(
        {
          success: true,
          data: {
            incidentId: updated.incident_id,
            investigator: updated.investigator,
            status: updated.status,
            updatedAt: updated.updated_at,
          },
        },
        200
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation error in assign investigator', {
          issues: error.issues,
        });
        return c.json(
          { success: false, error: 'Validation error', details: error.issues },
          400
        );
      }

      logger.error('Error assigning investigator', { error });
      return c.json(
        { success: false, error: 'Failed to assign investigator' },
        500
      );
    }
  });

  /**
   * POST /api/investigations/create
   * Create a new investigation for an incident
   */
  app.post('/api/investigations/create', async (c) => {
    try {
      const body = await c.req.json();
      const validated = CreateInvestigationSchema.parse(body);

      logger.info('Creating investigation', {
        incidentId: validated.incidentId,
        investigator: validated.investigator,
      });

      // Verify incident exists
      const incidentCheck = sqlite
        .prepare('SELECT id FROM incidents WHERE id = ?')
        .get(validated.incidentId);

      if (!incidentCheck) {
        logger.warn('Incident not found for investigation', {
          incidentId: validated.incidentId,
        });
        return c.json(
          { success: false, error: 'Incident not found' },
          404
        );
      }

      // Create investigation
      const stmt = sqlite.prepare(`
        INSERT INTO investigations (
          incident_id, investigation_date, investigator, industry, findings, status
        ) VALUES (?, ?, ?, ?, ?, 'Open')
      `);

      stmt.run(
        validated.incidentId,
        validated.investigationDate,
        validated.investigator,
        validated.industry || null,
        validated.findings || null
      );

      // Get the created investigation
      const investigation = sqlite
        .prepare('SELECT * FROM investigations WHERE incident_id = ? ORDER BY id DESC LIMIT 1')
        .get(validated.incidentId) as any;

      logger.info('Investigation created successfully', {
        investigationId: investigation.id,
        incidentId: validated.incidentId,
      });

      return c.json(
        {
          success: true,
          data: {
            id: investigation.id,
            incidentId: investigation.incident_id,
            investigationDate: investigation.investigation_date,
            investigator: investigation.investigator,
            industry: investigation.industry,
            findings: investigation.findings,
            status: investigation.status,
            createdAt: investigation.created_at,
          },
        },
        201
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation error in investigation creation', {
          issues: error.issues,
        });
        return c.json(
          { success: false, error: 'Validation error', details: error.issues },
          400
        );
      }

      logger.error('Error creating investigation', { error });
      return c.json(
        { success: false, error: 'Failed to create investigation' },
        500
      );
    }
  });

  /**
   * GET /api/investigations/:incidentId
   * Get investigation by incident ID
   */
  app.get('/api/investigations/:incidentId', (c) => {
    try {
      const incidentId = parseInt(c.req.param('incidentId'), 10);

      if (isNaN(incidentId)) {
        return c.json(
          { success: false, error: 'Invalid incident ID' },
          400
        );
      }

      logger.info('Fetching investigation by incident ID', { incidentId });

      const investigation = sqlite
        .prepare('SELECT * FROM investigations WHERE incident_id = ?')
        .get(incidentId) as any;

      if (!investigation) {
        logger.warn('Investigation not found', { incidentId });
        return c.json(
          { success: false, error: 'Investigation not found' },
          404
        );
      }

      return c.json(
        {
          success: true,
          data: {
            id: investigation.id,
            incidentId: investigation.incident_id,
            investigationDate: investigation.investigation_date,
            investigator: investigation.investigator,
            industry: investigation.industry,
            findings: investigation.findings,
            rootCauseAnalysis: investigation.root_cause_analysis
              ? JSON.parse(investigation.root_cause_analysis)
              : [],
            contributingFactors: investigation.contributing_factors
              ? JSON.parse(investigation.contributing_factors)
              : [],
            status: investigation.status,
            isoClause: investigation.iso_clause,
            regulatoryReportable: investigation.regulatory_reportable,
            createdAt: investigation.created_at,
            updatedAt: investigation.updated_at,
          },
        },
        200
      );
    } catch (error) {
      logger.error('Error fetching investigation', { error });
      return c.json(
        { success: false, error: 'Failed to fetch investigation' },
        500
      );
    }
  });

  /**
   * GET /api/investigations/:id
   * Get investigation by ID
   */
  app.get('/api/investigations/id/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);

      if (isNaN(id)) {
        return c.json(
          { success: false, error: 'Invalid investigation ID' },
          400
        );
      }

      logger.info('Fetching investigation by ID', { id });

      const investigation = sqlite
        .prepare('SELECT * FROM investigations WHERE id = ?')
        .get(id) as any;

      if (!investigation) {
        logger.warn('Investigation not found', { id });
        return c.json(
          { success: false, error: 'Investigation not found' },
          404
        );
      }

      return c.json(
        {
          success: true,
          data: {
            id: investigation.id,
            incidentId: investigation.incident_id,
            investigationDate: investigation.investigation_date,
            investigator: investigation.investigator,
            industry: investigation.industry,
            findings: investigation.findings,
            rootCauseAnalysis: investigation.root_cause_analysis
              ? JSON.parse(investigation.root_cause_analysis)
              : [],
            contributingFactors: investigation.contributing_factors
              ? JSON.parse(investigation.contributing_factors)
              : [],
            status: investigation.status,
            isoClause: investigation.iso_clause,
            regulatoryReportable: investigation.regulatory_reportable,
            createdAt: investigation.created_at,
            updatedAt: investigation.updated_at,
          },
        },
        200
      );
    } catch (error) {
      logger.error('Error fetching investigation', { error });
      return c.json(
        { success: false, error: 'Failed to fetch investigation' },
        500
      );
    }
  });

  /**
   * PUT /api/investigations/:id
   * Update investigation
   */
  app.put('/api/investigations/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) {
        return c.json(
          { success: false, error: 'Invalid investigation ID' },
          400
        );
      }

      const body = await c.req.json();
      const validated = UpdateInvestigationSchema.parse(body);

      logger.info('Updating investigation', { id });

      // Check investigation exists
      const existing = sqlite
        .prepare('SELECT id FROM investigations WHERE id = ?')
        .get(id);

      if (!existing) {
        logger.warn('Investigation not found for update', { id });
        return c.json(
          { success: false, error: 'Investigation not found' },
          404
        );
      }

      // Build update query
      const updates: string[] = ['updated_at = ?'];
      const params: any[] = [Date.now()];

      if (validated.findings !== undefined) {
        updates.push('findings = ?');
        params.push(validated.findings);
      }
      if (validated.status !== undefined) {
        updates.push('status = ?');
        params.push(validated.status);
      }
      if (validated.isoClause !== undefined) {
        updates.push('iso_clause = ?');
        params.push(validated.isoClause);
      }
      if (validated.regulatoryReportable !== undefined) {
        updates.push('regulatory_reportable = ?');
        params.push(validated.regulatoryReportable ? 1 : 0);
      }

      params.push(id);

      const updateStmt = sqlite.prepare(
        `UPDATE investigations SET ${updates.join(', ')} WHERE id = ?`
      );
      updateStmt.run(...params);

      // Return updated investigation
      const updated = sqlite
        .prepare('SELECT * FROM investigations WHERE id = ?')
        .get(id) as any;

      logger.info('Investigation updated successfully', { id });

      return c.json(
        {
          success: true,
          data: {
            id: updated.id,
            incidentId: updated.incident_id,
            investigationDate: updated.investigation_date,
            investigator: updated.investigator,
            findings: updated.findings,
            status: updated.status,
            updatedAt: updated.updated_at,
          },
        },
        200
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation error in investigation update', {
          issues: error.issues,
        });
        return c.json(
          { success: false, error: 'Validation error', details: error.issues },
          400
        );
      }

      logger.error('Error updating investigation', { error });
      return c.json(
        { success: false, error: 'Failed to update investigation' },
        500
      );
    }
  });

  /**
   * POST /api/investigations/:id/rcca
   * Save Root Cause & Corrective Actions
   */
  app.post('/api/investigations/:id/rcca', async (c) => {
    try {
      const investigationId = parseInt(c.req.param('id'), 10);
      if (isNaN(investigationId)) {
        return c.json(
          { success: false, error: 'Invalid investigation ID' },
          400
        );
      }

      const body = await c.req.json();
      const validated = CreateRCCASchema.parse(body);

      logger.info('Saving RCCA', { investigationId });

      // Check investigation exists
      const investigation = sqlite
        .prepare('SELECT id FROM investigations WHERE id = ?')
        .get(investigationId);

      if (!investigation) {
        logger.warn('Investigation not found for RCCA', { investigationId });
        return c.json(
          { success: false, error: 'Investigation not found' },
          404
        );
      }

      // Check if RCCA already exists
      const existing = sqlite
        .prepare('SELECT id FROM rcca WHERE investigation_id = ?')
        .get(investigationId);

      const rootCausesJson = validated.rootCauses
        ? JSON.stringify(validated.rootCauses)
        : null;
      const whyAnalysisJson = validated.whyAnalysis
        ? JSON.stringify(validated.whyAnalysis)
        : null;
      const fishboneJson = validated.fishboneFactors
        ? JSON.stringify(validated.fishboneFactors)
        : null;
      const actionsJson = validated.correctiveActions
        ? JSON.stringify(validated.correctiveActions)
        : null;
      const measuresJson = validated.preventiveMeasures
        ? JSON.stringify(validated.preventiveMeasures)
        : null;
      const lessonsJson = validated.lessonsLearned
        ? JSON.stringify(validated.lessonsLearned)
        : null;

      if (existing) {
        // Update existing RCCA
        const updateStmt = sqlite.prepare(`
          UPDATE rcca SET
            root_causes = ?,
            why_analysis = ?,
            fishbone_factors = ?,
            corrective_actions = ?,
            preventive_measures = ?,
            lessons_learned = ?,
            updated_at = ?
          WHERE investigation_id = ?
        `);

        updateStmt.run(
          rootCausesJson,
          whyAnalysisJson,
          fishboneJson,
          actionsJson,
          measuresJson,
          lessonsJson,
          Date.now(),
          investigationId
        );

        logger.info('RCCA updated successfully', { investigationId });
      } else {
        // Create new RCCA
        const insertStmt = sqlite.prepare(`
          INSERT INTO rcca (
            investigation_id, root_causes, why_analysis, fishbone_factors,
            corrective_actions, preventive_measures, lessons_learned, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Open')
        `);

        insertStmt.run(
          investigationId,
          rootCausesJson,
          whyAnalysisJson,
          fishboneJson,
          actionsJson,
          measuresJson,
          lessonsJson
        );

        logger.info('RCCA created successfully', { investigationId });
      }

      const rcca = sqlite
        .prepare('SELECT * FROM rcca WHERE investigation_id = ?')
        .get(investigationId) as any;

      return c.json(
        {
          success: true,
          data: {
            id: rcca.id,
            investigationId: rcca.investigation_id,
            rootCauses: rcca.root_causes ? JSON.parse(rcca.root_causes) : [],
            whyAnalysis: rcca.why_analysis ? JSON.parse(rcca.why_analysis) : {},
            fishboneFactors: rcca.fishbone_factors
              ? JSON.parse(rcca.fishbone_factors)
              : {},
            correctiveActions: rcca.corrective_actions
              ? JSON.parse(rcca.corrective_actions)
              : [],
            preventiveMeasures: rcca.preventive_measures
              ? JSON.parse(rcca.preventive_measures)
              : [],
            lessonsLearned: rcca.lessons_learned
              ? JSON.parse(rcca.lessons_learned)
              : {},
            status: rcca.status,
          },
        },
        201
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation error in RCCA save', {
          issues: error.issues,
        });
        return c.json(
          { success: false, error: 'Validation error', details: error.issues },
          400
        );
      }

      logger.error('Error saving RCCA', { error });
      return c.json(
        { success: false, error: 'Failed to save RCCA' },
        500
      );
    }
  });

  /**
   * GET /api/investigations/:id/rcca
   * Get Root Cause & Corrective Actions
   */
  app.get('/api/investigations/:id/rcca', (c) => {
    try {
      const investigationId = parseInt(c.req.param('id'), 10);
      if (isNaN(investigationId)) {
        return c.json(
          { success: false, error: 'Invalid investigation ID' },
          400
        );
      }

      logger.info('Fetching RCCA', { investigationId });

      const rcca = sqlite
        .prepare('SELECT * FROM rcca WHERE investigation_id = ?')
        .get(investigationId) as any;

      if (!rcca) {
        logger.warn('RCCA not found', { investigationId });
        return c.json(
          { success: false, error: 'RCCA not found' },
          404
        );
      }

      return c.json(
        {
          success: true,
          data: {
            id: rcca.id,
            investigationId: rcca.investigation_id,
            rootCauses: rcca.root_causes ? JSON.parse(rcca.root_causes) : [],
            whyAnalysis: rcca.why_analysis ? JSON.parse(rcca.why_analysis) : {},
            fishboneFactors: rcca.fishbone_factors
              ? JSON.parse(rcca.fishbone_factors)
              : {},
            correctiveActions: rcca.corrective_actions
              ? JSON.parse(rcca.corrective_actions)
              : [],
            preventiveMeasures: rcca.preventive_measures
              ? JSON.parse(rcca.preventive_measures)
              : [],
            lessonsLearned: rcca.lessons_learned
              ? JSON.parse(rcca.lessons_learned)
              : {},
            status: rcca.status,
            createdAt: rcca.created_at,
            updatedAt: rcca.updated_at,
          },
        },
        200
      );
    } catch (error) {
      logger.error('Error fetching RCCA', { error });
      return c.json(
        { success: false, error: 'Failed to fetch RCCA' },
        500
      );
    }
  });

  /**
   * POST /api/investigations/:id/bowtie
   * Save Bow-Tie Analysis
   */
  app.post('/api/investigations/:id/bowtie', async (c) => {
    try {
      const investigationId = parseInt(c.req.param('id'), 10);
      if (isNaN(investigationId)) {
        return c.json(
          { success: false, error: 'Invalid investigation ID' },
          400
        );
      }

      const body = await c.req.json();
      const validated = CreateBowTieSchema.parse(body);

      logger.info('Saving Bow-Tie scenario', {
        investigationId,
        title: validated.title,
      });

      // Check investigation exists
      const investigationExists = sqlite
        .prepare('SELECT id FROM investigations WHERE id = ?')
        .get(investigationId);

      if (!investigationExists) {
        logger.warn('Investigation not found for Bow-Tie', { investigationId });
        return c.json({ success: false, error: 'Investigation not found' }, 404);
      }

      // Insert bow-tie scenario
      const insertStmt = sqlite.prepare(`
        INSERT INTO bowtie_scenarios (
          investigation_id, title, top_event, hazard, risk_level, threats, consequences, owner, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
      `);

      insertStmt.run(
        investigationId,
        validated.title,
        validated.topEvent,
        validated.hazard,
        validated.riskLevel,
        validated.threats ? JSON.stringify(validated.threats) : null,
        validated.consequences ? JSON.stringify(validated.consequences) : null,
        validated.owner || null
      );

      // Get created scenario
      const scenario = sqlite
        .prepare(
          'SELECT * FROM bowtie_scenarios WHERE investigation_id = ? ORDER BY id DESC LIMIT 1'
        )
        .get(investigationId) as any;

      logger.info('Bow-Tie scenario created successfully', {
        scenarioId: scenario.id,
      });

      return c.json(
        {
          success: true,
          data: {
            id: scenario.id,
            investigationId: scenario.investigation_id,
            title: scenario.title,
            topEvent: scenario.top_event,
            hazard: scenario.hazard,
            riskLevel: scenario.risk_level,
            threats: scenario.threats ? JSON.parse(scenario.threats) : [],
            consequences: scenario.consequences
              ? JSON.parse(scenario.consequences)
              : [],
            owner: scenario.owner,
            status: scenario.status,
            createdAt: scenario.created_at,
          },
        },
        201
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation error in Bow-Tie save', {
          issues: error.issues,
        });
        return c.json(
          { success: false, error: 'Validation error', details: error.issues },
          400
        );
      }

      logger.error('Error saving Bow-Tie', { error });
      return c.json(
        { success: false, error: 'Failed to save Bow-Tie analysis' },
        500
      );
    }
  });

  /**
   * GET /api/investigations/:id/bowtie
   * Get Bow-Tie Analysis
   */
  app.get('/api/investigations/:id/bowtie', (c) => {
    try {
      const investigationId = parseInt(c.req.param('id'), 10);
      if (isNaN(investigationId)) {
        return c.json(
          { success: false, error: 'Invalid investigation ID' },
          400
        );
      }

      logger.info('Fetching Bow-Tie scenarios', { investigationId });

      const scenarios = sqlite
        .prepare('SELECT * FROM bowtie_scenarios WHERE investigation_id = ?')
        .all(investigationId) as any[];

      if (scenarios.length === 0) {
        logger.warn('No Bow-Tie scenarios found', { investigationId });
        return c.json(
          { success: true, data: [] },
          200
        );
      }

      const formattedScenarios = scenarios.map((scenario) => ({
        id: scenario.id,
        investigationId: scenario.investigation_id,
        title: scenario.title,
        topEvent: scenario.top_event,
        hazard: scenario.hazard,
        riskLevel: scenario.risk_level,
        threats: scenario.threats ? JSON.parse(scenario.threats) : [],
        consequences: scenario.consequences
          ? JSON.parse(scenario.consequences)
          : [],
        owner: scenario.owner,
        status: scenario.status,
        createdAt: scenario.created_at,
        updatedAt: scenario.updated_at,
      }));

      return c.json(
        {
          success: true,
          data: formattedScenarios,
        },
        200
      );
    } catch (error) {
      logger.error('Error fetching Bow-Tie scenarios', { error });
      return c.json(
        { success: false, error: 'Failed to fetch Bow-Tie scenarios' },
        500
      );
    }
  });

};

