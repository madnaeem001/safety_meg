import { Hono } from 'hono';
import { z } from 'zod';
import Database from 'better-sqlite3';
import { logger } from '../services/logger';

// Initialize database
const sqlite = new Database('local.sqlite');

// ==================== VALIDATION SCHEMAS ====================

// CAPA Creation Schema
const CreateCapaSchema = z.object({
  investigationId: z.number().int().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  capaType: z.enum(['Corrective', 'Preventive']),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  department: z.string().optional(),
  riskArea: z.string().optional(),
  problemStatement: z.string().optional(),
  rootCauseStatement: z.string().optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});

// CAPA Update Schema
const UpdateCapaSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.enum(['Open', 'In Progress', 'Completed', 'Verified', 'Closed']).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  completionDate: z.string().optional(),
});

// Safety Control Schema
const CreateControlSchema = z.object({
  name: z.string().min(3, 'Control name required'),
  description: z.string().optional(),
  controlType: z.enum(['elimination', 'substitution', 'engineering', 'administrative', 'ppe']),
  hazardDescription: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  designEffectiveness: z.number().min(0).max(100).optional(),
  department: z.string().optional(),
  owner: z.string().optional(),
  implementationDate: z.string().optional(),
});

// Control Update Schema
const UpdateControlSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'degraded', 'failed', 'archived']).optional(),
  actualEffectiveness: z.number().min(0).max(100).optional(),
  lastVerificationDate: z.string().optional(),
  nextVerificationDate: z.string().optional(),
});

// CAPA Verification Schema
const CapaVerificationSchema = z.object({
  capaId: z.number().int().positive().optional(),
  verificationDate: z.string(),
  verifiedBy: z.string().min(1),
  result: z.enum(['Effective', 'Partially Effective', 'Ineffective']),
  findings: z.string().optional(),
});

// ==================== ROUTES ====================

export const capaRoutes = (app: Hono) => {
  /**
   * GET /api/capa/list
   * List all CAPA records with filters
   */
  app.get('/api/capa/list', (c) => {
    try {
      const status = c.req.query('status');
      const priority = c.req.query('priority');
      const capaType = c.req.query('type');

      logger.info('Fetching CAPA list', { status, priority, capaType });

      let query = 'SELECT * FROM capa_records WHERE 1=1';
      const params: any[] = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      if (priority) {
        query += ' AND priority = ?';
        params.push(priority);
      }
      if (capaType) {
        query += ' AND capa_type = ?';
        params.push(capaType);
      }

      query += ' ORDER BY priority DESC, due_date ASC, created_at DESC';

      const capas = sqlite.prepare(query).all(...params) as any[];

      const formatted = capas.map((capa) => ({
        id: capa.id,
        title: capa.title,
        capaType: capa.capa_type,
        priority: capa.priority,
        status: capa.status,
        assignedTo: capa.assigned_to,
        dueDate: capa.due_date,
        createdAt: capa.created_at,
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
      logger.error('Error fetching CAPA list', { error });
      return c.json(
        { success: false, error: 'Failed to fetch CAPA records' },
        500
      );
    }
  });

  /**
   * POST /api/capa/create
   * Create new CAPA record
   */
  app.post('/api/capa/create', async (c) => {
    try {
      const body = await c.req.json();
      const validated = CreateCapaSchema.parse(body);

      logger.info('Creating CAPA record', {
        capaType: validated.capaType,
        priority: validated.priority,
      });

      const stmt = sqlite.prepare(`
        INSERT INTO capa_records (
          investigation_id, title, description, capa_type, priority,
          department, risk_area, problem_statement, root_cause_statement,
          assigned_to, due_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open')
      `);

      stmt.run(
        validated.investigationId || null,
        validated.title,
        validated.description,
        validated.capaType,
        validated.priority,
        validated.department || null,
        validated.riskArea || null,
        validated.problemStatement || null,
        validated.rootCauseStatement || null,
        validated.assignedTo || null,
        validated.dueDate || null
      );

      const capa = sqlite
        .prepare('SELECT * FROM capa_records WHERE title = ? ORDER BY id DESC LIMIT 1')
        .get(validated.title) as any;

      logger.info('CAPA created successfully', { capaId: capa.id });

      return c.json(
        {
          success: true,
          data: {
            id: capa.id,
            title: capa.title,
            capaType: capa.capa_type,
            priority: capa.priority,
            status: capa.status,
            createdAt: capa.created_at,
          },
        },
        201
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation error in CAPA creation', {
          issues: error.issues,
        });
        return c.json(
          { success: false, error: 'Validation error', details: error.issues },
          400
        );
      }

      logger.error('Error creating CAPA', { error });
      return c.json(
        { success: false, error: 'Failed to create CAPA record' },
        500
      );
    }
  });

  /**
   * GET /api/capa/:id
   * Get CAPA details by ID
   */
  app.get('/api/capa/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);

      if (isNaN(id)) {
        return c.json(
          { success: false, error: 'Invalid CAPA ID' },
          400
        );
      }

      logger.info('Fetching CAPA', { id });

      const capa = sqlite
        .prepare('SELECT * FROM capa_records WHERE id = ?')
        .get(id) as any;

      if (!capa) {
        logger.warn('CAPA not found', { id });
        return c.json(
          { success: false, error: 'CAPA record not found' },
          404
        );
      }

      // Get linked controls
      const linkedControlIds = capa.linked_controls
        ? JSON.parse(capa.linked_controls)
        : [];

      return c.json(
        {
          success: true,
          data: {
            id: capa.id,
            investigationId: capa.investigation_id,
            title: capa.title,
            description: capa.description,
            capaType: capa.capa_type,
            priority: capa.priority,
            department: capa.department,
            riskArea: capa.risk_area,
            problemStatement: capa.problem_statement,
            rootCauseStatement: capa.root_cause_statement,
            assignedTo: capa.assigned_to,
            dueDate: capa.due_date,
            completionDate: capa.completion_date,
            linkedControlIds,
            status: capa.status,
            verificationDate: capa.verification_date,
            verificationResult: capa.verification_result,
            createdAt: capa.created_at,
            updatedAt: capa.updated_at,
          },
        },
        200
      );
    } catch (error) {
      logger.error('Error fetching CAPA', { error });
      return c.json(
        { success: false, error: 'Failed to fetch CAPA record' },
        500
      );
    }
  });

  /**
   * PUT /api/capa/:id
   * Update CAPA record
   */
  app.put('/api/capa/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) {
        return c.json(
          { success: false, error: 'Invalid CAPA ID' },
          400
        );
      }

      const body = await c.req.json();
      const validated = UpdateCapaSchema.parse(body);

      logger.info('Updating CAPA', { id });

      // Check CAPA exists
      const existing = sqlite
        .prepare('SELECT id FROM capa_records WHERE id = ?')
        .get(id);

      if (!existing) {
        logger.warn('CAPA not found for update', { id });
        return c.json(
          { success: false, error: 'CAPA record not found' },
          404
        );
      }

      // Build update query
      const updates: string[] = ['updated_at = ?'];
      const params: any[] = [Date.now()];

      if (validated.title !== undefined) {
        updates.push('title = ?');
        params.push(validated.title);
      }
      if (validated.description !== undefined) {
        updates.push('description = ?');
        params.push(validated.description);
      }
      if (validated.status !== undefined) {
        updates.push('status = ?');
        params.push(validated.status);
      }
      if (validated.priority !== undefined) {
        updates.push('priority = ?');
        params.push(validated.priority);
      }
      if (validated.assignedTo !== undefined) {
        updates.push('assigned_to = ?');
        params.push(validated.assignedTo);
      }
      if (validated.dueDate !== undefined) {
        updates.push('due_date = ?');
        params.push(validated.dueDate);
      }
      if (validated.completionDate !== undefined) {
        updates.push('completion_date = ?');
        params.push(validated.completionDate);
      }

      params.push(id);

      const updateStmt = sqlite.prepare(
        `UPDATE capa_records SET ${updates.join(', ')} WHERE id = ?`
      );
      updateStmt.run(...params);

      const updated = sqlite
        .prepare('SELECT * FROM capa_records WHERE id = ?')
        .get(id) as any;

      logger.info('CAPA updated successfully', { id });

      return c.json(
        {
          success: true,
          data: {
            id: updated.id,
            title: updated.title,
            status: updated.status,
            priority: updated.priority,
            updatedAt: updated.updated_at,
          },
        },
        200
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation error in CAPA update', {
          issues: error.issues,
        });
        return c.json(
          { success: false, error: 'Validation error', details: error.issues },
          400
        );
      }

      logger.error('Error updating CAPA', { error });
      return c.json(
        { success: false, error: 'Failed to update CAPA record' },
        500
      );
    }
  });

  /**
   * POST /api/capa/:id/verify
   * Verify CAPA effectiveness
   */
  app.post('/api/capa/:id/verify', async (c) => {
    try {
      const capaId = parseInt(c.req.param('id'), 10);
      if (isNaN(capaId)) {
        return c.json(
          { success: false, error: 'Invalid CAPA ID' },
          400
        );
      }

      const body = await c.req.json();
      const validated = CapaVerificationSchema.parse({
        capaId,
        verificationDate: body.verificationDate,
        verifiedBy: body.verifiedBy,
        result: body.result,
        findings: body.findings,
      });

      logger.info('Verifying CAPA', { capaId });

      // Check CAPA exists
      const capa = sqlite
        .prepare('SELECT id FROM capa_records WHERE id = ?')
        .get(capaId);

      if (!capa) {
        logger.warn('CAPA not found for verification', { capaId });
        return c.json(
          { success: false, error: 'CAPA record not found' },
          404
        );
      }

      // Create verification record
      const verfStmt = sqlite.prepare(`
        INSERT INTO capa_verifications (
          capa_id, verification_date, verified_by, result, findings
        ) VALUES (?, ?, ?, ?, ?)
      `);

      verfStmt.run(
        capaId,
        validated.verificationDate,
        validated.verifiedBy,
        validated.result,
        validated.findings || null
      );

      // Update CAPA verification details
      const updateStmt = sqlite.prepare(`
        UPDATE capa_records SET
          status = 'Verified',
          verification_date = ?,
          verification_result = ?,
          updated_at = ?
        WHERE id = ?
      `);

      updateStmt.run(
        validated.verificationDate,
        validated.result,
        Date.now(),
        capaId
      );

      logger.info('CAPA verified successfully', { capaId, result: validated.result });

      return c.json(
        {
          success: true,
          data: {
            capaId,
            verificationDate: validated.verificationDate,
            result: validated.result,
            status: 'Verified',
          },
        },
        201
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation error in CAPA verification', {
          issues: error.issues,
        });
        return c.json(
          { success: false, error: 'Validation error', details: error.issues },
          400
        );
      }

      logger.error('Error verifying CAPA', { error });
      return c.json(
        { success: false, error: 'Failed to verify CAPA' },
        500
      );
    }
  });

  /**
   * GET /api/capa/:id/risks
   * Get risks associated with CAPA
   */
  app.get('/api/capa/:id/risks', (c) => {
    try {
      const capaId = parseInt(c.req.param('id'), 10);

      if (isNaN(capaId)) {
        return c.json(
          { success: false, error: 'Invalid CAPA ID' },
          400
        );
      }

      logger.info('Fetching risks for CAPA', { capaId });

      // Get CAPA record first
      const capa = sqlite
        .prepare('SELECT * FROM capa_records WHERE id = ?')
        .get(capaId) as any;

      if (!capa) {
        logger.warn('CAPA not found', { capaId });
        return c.json(
          { success: false, error: 'CAPA record not found' },
          404
        );
      }

      // Get linked controls
      const linkedControlIds = capa.linked_controls
        ? JSON.parse(capa.linked_controls)
        : [];

      // Get risks associated with linked controls
      const risks = sqlite
        .prepare(`
          SELECT DISTINCT rcl.* FROM risk_control_links rcl
          WHERE rcl.control_id IN (${linkedControlIds.map(() => '?').join(',')})
        `)
        .all(...linkedControlIds) as any[];

      const formatted = risks.map((risk) => ({
        id: risk.id,
        hazardId: risk.hazard_id,
        riskDescription: risk.risk_description,
        relationshipType: risk.relationship_type,
        riskReductionPotential: risk.risk_reduction_potential,
      }));

      return c.json(
        {
          success: true,
          data: {
            capaId,
            linkedControlCount: linkedControlIds.length,
            associatedRisks: formatted,
          },
        },
        200
      );
    } catch (error) {
      logger.error('Error fetching CAPA risks', { error });
      return c.json(
        { success: false, error: 'Failed to fetch CAPA risks' },
        500
      );
    }
  });

  /**
   * GET /api/controls/hierarchy
   * Get hierarchy of controls per NIOSH
   */
  app.get('/api/controls/hierarchy', (c) => {
    try {
      logger.info('Fetching controls hierarchy');

      const hierarchy = [
        {
          level: 1,
          name: 'Elimination',
          description: 'Physically remove the hazard',
          effectiveness: 100,
          examples: [
            'Remove hazardous process',
            'Discontinue toxic chemicals',
            'Eliminate high-risk equipment',
          ],
          regulatoryReferences: [
            'NIOSH 2015-189',
            'ISO 45001:2018 §8.1.2',
            'OSHA 29 CFR 1910.132(d)',
          ],
        },
        {
          level: 2,
          name: 'Substitution',
          description: 'Replace with less hazardous alternative',
          effectiveness: 90,
          examples: [
            'Replace toxic solvent with water-based',
            'Use mechanical lifting instead of manual',
            'Substitute safer abrasive',
          ],
          regulatoryReferences: [
            'NIOSH 2015-189',
            'ISO 45001:2018 §8.1.2',
            'EPA 40 CFR 261.31',
          ],
        },
        {
          level: 3,
          name: 'Engineering Controls',
          description: 'Isolate workers through physical changes',
          effectiveness: 75,
          examples: [
            'Install ventilation systems (LEV)',
            'Machine guards and interlocks',
            'Noise barriers/enclosures',
            'Automated material handling',
          ],
          regulatoryReferences: [
            'OSHA 29 CFR 1910.212',
            'NIOSH 2003-136',
            'ISO 12100:2010',
          ],
        },
        {
          level: 4,
          name: 'Administrative Controls',
          description: 'Change work methods through policies',
          effectiveness: 50,
          examples: [
            'Job rotation to reduce exposure',
            'Safe work procedures (SWPs)',
            'Regular safety training',
            'Permit-to-work systems',
          ],
          regulatoryReferences: [
            'OSHA 29 CFR 1910.1200',
            'ISO 45001:2018 §7.2',
            'NIOSH 98-145',
          ],
        },
        {
          level: 5,
          name: 'Personal Protective Equipment',
          description: 'Protect workers as last line of defense',
          effectiveness: 30,
          examples: [
            'Safety glasses/face shields',
            'Hearing protection',
            'Respirators and masks',
            'Protective gloves/clothing',
          ],
          regulatoryReferences: [
            'OSHA 29 CFR 1910.132-138',
            'NIOSH 2004-101',
            'ISO 45001:2018 §8.1.2(e)',
          ],
        },
      ];

      return c.json(
        {
          success: true,
          data: hierarchy,
        },
        200
      );
    } catch (error) {
      logger.error('Error fetching hierarchy', { error });
      return c.json(
        { success: false, error: 'Failed to fetch hierarchy' },
        500
      );
    }
  });

  /**
   * GET /api/controls/list
   * List all controls with filters
   */
  app.get('/api/controls/list', (c) => {
    try {
      const status = c.req.query('status');
      const controlType = c.req.query('type');
      const riskLevel = c.req.query('riskLevel');

      logger.info('Fetching controls list', { status, controlType, riskLevel });

      let query = 'SELECT * FROM safety_controls WHERE 1=1';
      const params: any[] = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      if (controlType) {
        query += ' AND control_type = ?';
        params.push(controlType);
      }
      if (riskLevel) {
        query += ' AND risk_level = ?';
        params.push(riskLevel);
      }

      query += ' ORDER BY hierarchy_level ASC, design_effectiveness DESC';

      const controls = sqlite.prepare(query).all(...params) as any[];

      const formatted = controls.map((control) => ({
        id: control.id,
        name: control.name,
        controlType: control.control_type,
        hierarchyLevel: control.hierarchy_level,
        status: control.status,
        designEffectiveness: control.design_effectiveness,
        actualEffectiveness: control.actual_effectiveness,
        riskLevel: control.risk_level,
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
      logger.error('Error fetching controls list', { error });
      return c.json(
        { success: false, error: 'Failed to fetch controls' },
        500
      );
    }
  });

  /**
   * POST /api/controls/create
   * Create new safety control
   */
  app.post('/api/controls/create', async (c) => {
    try {
      const body = await c.req.json();
      const validated = CreateControlSchema.parse(body);

      logger.info('Creating control', {
        name: validated.name,
        controlType: validated.controlType,
      });

      // Determine hierarchy level based on control type
      const hierarchyMap: Record<string, number> = {
        elimination: 1,
        substitution: 2,
        engineering: 3,
        administrative: 4,
        ppe: 5,
      };

      const stmt = sqlite.prepare(`
        INSERT INTO safety_controls (
          name, description, control_type, hierarchy_level, hazard_id,
          hazard_description, risk_level, design_effectiveness,
          status, department, owner, implementation_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
      `);

      stmt.run(
        validated.name,
        validated.description || null,
        validated.controlType,
        hierarchyMap[validated.controlType],
        null,
        validated.hazardDescription || null,
        validated.riskLevel || null,
        validated.designEffectiveness || 80,
        validated.department || null,
        validated.owner || null,
        validated.implementationDate || null
      );

      const control = sqlite
        .prepare('SELECT * FROM safety_controls WHERE name = ? ORDER BY id DESC LIMIT 1')
        .get(validated.name) as any;

      logger.info('Control created successfully', { controlId: control.id });

      return c.json(
        {
          success: true,
          data: {
            id: control.id,
            name: control.name,
            controlType: control.control_type,
            hierarchyLevel: control.hierarchy_level,
            status: control.status,
            createdAt: control.created_at,
          },
        },
        201
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation error in control creation', {
          issues: error.issues,
        });
        return c.json(
          { success: false, error: 'Validation error', details: error.issues },
          400
        );
      }

      logger.error('Error creating control', { error });
      return c.json(
        { success: false, error: 'Failed to create control' },
        500
      );
    }
  });

  /**
   * GET /api/controls/:id
   * Get control details
   */
  app.get('/api/controls/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);

      if (isNaN(id)) {
        return c.json(
          { success: false, error: 'Invalid control ID' },
          400
        );
      }

      logger.info('Fetching control', { id });

      const control = sqlite
        .prepare('SELECT * FROM safety_controls WHERE id = ?')
        .get(id) as any;

      if (!control) {
        logger.warn('Control not found', { id });
        return c.json(
          { success: false, error: 'Control not found' },
          404
        );
      }

      // Get associated barriers
      const barriers = sqlite
        .prepare('SELECT * FROM control_barriers WHERE control_id = ?')
        .all(id) as any[];

      return c.json(
        {
          success: true,
          data: {
            id: control.id,
            name: control.name,
            description: control.description,
            controlType: control.control_type,
            hierarchyLevel: control.hierarchy_level,
            hazardDescription: control.hazard_description,
            riskLevel: control.risk_level,
            designEffectiveness: control.design_effectiveness,
            actualEffectiveness: control.actual_effectiveness,
            status: control.status,
            department: control.department,
            owner: control.owner,
            implementationDate: control.implementation_date,
            lastVerificationDate: control.last_verification_date,
            nextVerificationDate: control.next_verification_date,
            barriers: barriers.map((b) => ({
              id: b.id,
              name: b.name,
              type: b.type,
              effectiveness: b.effectiveness,
              status: b.status,
            })),
            createdAt: control.created_at,
            updatedAt: control.updated_at,
          },
        },
        200
      );
    } catch (error) {
      logger.error('Error fetching control', { error });
      return c.json(
        { success: false, error: 'Failed to fetch control' },
        500
      );
    }
  });

  /**
   * PUT /api/controls/:id
   * Update control
   */
  app.put('/api/controls/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) {
        return c.json(
          { success: false, error: 'Invalid control ID' },
          400
        );
      }

      const body = await c.req.json();
      const validated = UpdateControlSchema.parse(body);

      logger.info('Updating control', { id });

      // Check control exists
      const existing = sqlite
        .prepare('SELECT id FROM safety_controls WHERE id = ?')
        .get(id);

      if (!existing) {
        logger.warn('Control not found for update', { id });
        return c.json(
          { success: false, error: 'Control not found' },
          404
        );
      }

      // Build update query
      const updates: string[] = ['updated_at = ?'];
      const params: any[] = [Date.now()];

      if (validated.name !== undefined) {
        updates.push('name = ?');
        params.push(validated.name);
      }
      if (validated.description !== undefined) {
        updates.push('description = ?');
        params.push(validated.description);
      }
      if (validated.status !== undefined) {
        updates.push('status = ?');
        params.push(validated.status);
      }
      if (validated.actualEffectiveness !== undefined) {
        updates.push('actual_effectiveness = ?');
        params.push(validated.actualEffectiveness);
      }
      if (validated.lastVerificationDate !== undefined) {
        updates.push('last_verification_date = ?');
        params.push(validated.lastVerificationDate);
      }
      if (validated.nextVerificationDate !== undefined) {
        updates.push('next_verification_date = ?');
        params.push(validated.nextVerificationDate);
      }

      params.push(id);

      const updateStmt = sqlite.prepare(
        `UPDATE safety_controls SET ${updates.join(', ')} WHERE id = ?`
      );
      updateStmt.run(...params);

      const updated = sqlite
        .prepare('SELECT * FROM safety_controls WHERE id = ?')
        .get(id) as any;

      logger.info('Control updated successfully', { id });

      return c.json(
        {
          success: true,
          data: {
            id: updated.id,
            name: updated.name,
            status: updated.status,
            actualEffectiveness: updated.actual_effectiveness,
            updatedAt: updated.updated_at,
          },
        },
        200
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation error in control update', {
          issues: error.issues,
        });
        return c.json(
          { success: false, error: 'Validation error', details: error.issues },
          400
        );
      }

      logger.error('Error updating control', { error });
      return c.json(
        { success: false, error: 'Failed to update control' },
        500
      );
    }
  });
};
