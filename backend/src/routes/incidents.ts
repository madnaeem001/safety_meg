import { Hono } from "hono";
import { db, sqlite } from "../db";
import { incidents, injuryReports, vehicleIncidents, propertyIncidents, nearMisses, users } from "../__generated__/schema";
import { eq, desc, like, and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { createLogger } from "../services/logger";

const logger = createLogger("Incidents");

// ── One-time schema migration ──────────────────────────────────────────────
// Add selected_standards column if it doesn't exist yet (existing DBs).
try {
  sqlite.exec('ALTER TABLE incidents ADD COLUMN selected_standards TEXT');
  logger.info('Added selected_standards column to incidents table');
} catch {
  // Column already exists — ignore
}

// ============================================
// VALIDATION SCHEMAS (Zod)
// ============================================

const CreateIncidentSchema = z.object({
  incidentDate: z.string(),
  incidentTime: z.string(),
  location: z.string().min(1, "Location is required"),
  department: z.string().optional(),
  industrySector: z.string().optional(),
  incidentType: z.string().optional(), // Optional - can be auto-set for specialty reports
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  description: z.string().min(10, "Description must be at least 10 characters"),
  immediateActions: z.string().optional(),
  witnesses: z.string().optional(),
  rootCauses: z.string().optional(),
  correctiveActions: z.string().optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  isoClause: z.string().optional(),
  regulatoryReportable: z.boolean().default(false),
  selectedStandards: z.array(z.string()).optional(),
});

const CreateInjuryReportSchema = z.object({
  incidentId: z.number().int(),
  bodyPart: z.string().min(1, "Body part is required"),
  injuryType: z.string().min(1, "Injury type is required"),
  treatmentRequired: z.boolean().default(false),
  medicalAttention: z.boolean().default(false),
  daysLost: z.number().int().min(0).default(0),
  injurySeverity: z.string().optional(),
});

const CreateVehicleIncidentSchema = z.object({
  incidentId: z.number().int(),
  vehicleId: z.string().optional(),
  driverName: z.string().optional(),
  vehicleType: z.string().optional(),
  damageLevel: z.enum(['minor', 'moderate', 'severe']).optional(),
  thirdPartyInvolved: z.boolean().default(false),
  insuranceClaim: z.boolean().default(false),
  claimNumber: z.string().optional(),
});

const CreatePropertyIncidentSchema = z.object({
  incidentId: z.number().int(),
  assetId: z.string().optional(),
  assetName: z.string().optional(),
  damageDescription: z.string().optional(),
  damageEstimate: z.number().int().optional(),
  repairRequired: z.boolean().default(false),
  estimatedRepairTime: z.string().optional(),
  environmentalImpact: z.boolean().default(false),
  businessInterruption: z.boolean().default(false),
});

const CreateNearMissSchema = z.object({
  incidentId: z.number().int(),
  potentialSeverity: z.string().optional(),
  potentialConsequence: z.string().optional(),
  preventativeMeasure: z.string().optional(),
  likelihood: z.string().optional(),
});

// ============================================
// INCIDENT ROUTES
// ============================================

export function incidentRoutes(app: Hono) {
  /**
   * POST /api/incidents/create
   * Create a generic incident
   */
  app.post('/api/incidents/create', async (c) => {
    try {
      const body = await c.req.json();
      
      // For generic create, incidentType is required
      if (!body.incidentType) {
        return c.json({
          success: false,
          error: 'Validation failed',
          issues: [{ message: 'incidentType is required for generic incident creation' }]
        }, 400);
      }

      const validation = CreateIncidentSchema.safeParse(body);

      if (!validation.success) {
        logger.warn('Incident creation validation failed', { errors: validation.error.issues });
        return c.json({
          success: false,
          error: 'Validation failed',
          issues: validation.error.issues
        }, 400);
      }

      const data = validation.data;
      logger.info('Creating new incident', { type: data.incidentType, severity: data.severity, location: data.location });

      const created = db.insert(incidents).values({
        incidentDate: data.incidentDate,
        incidentTime: data.incidentTime,
        location: data.location,
        department: data.department,
        industrySector: data.industrySector,
        incidentType: data.incidentType ?? 'General Incident',
        severity: data.severity,
        description: data.description,
        immediateActions: data.immediateActions,
        witnesses: data.witnesses,
        rootCauses: data.rootCauses,
        correctiveActions: data.correctiveActions,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate,
        isoClause: data.isoClause,
        regulatoryReportable: data.regulatoryReportable,
        selectedStandards: data.selectedStandards ? JSON.stringify(data.selectedStandards) : null,
        status: 'open',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).returning({ id: incidents.id }).get();

      logger.info('Incident created successfully', { id: created.id, location: data.location });

      return c.json({
        success: true,
        message: 'Incident created successfully',
        data: {
          id: created.id,
          ...data,
          selectedStandards: data.selectedStandards ?? [],
          status: 'open',
          createdAt: new Date().toISOString()
        }
      }, 201);

    } catch (error) {
      logger.error('Failed to create incident', error);
      return c.json({
        success: false,
        error: 'Failed to create incident',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * POST /api/incidents/injury
   * Create an injury report (incident + injury details)
   */
  app.post('/api/incidents/injury', async (c) => {
    try {
      const body = await c.req.json();
      const incidentValidation = CreateIncidentSchema.safeParse(body);

      if (!incidentValidation.success) {
        logger.warn('Injury report validation failed', { errors: incidentValidation.error.issues });
        return c.json({
          success: false,
          error: 'Validation failed',
          issues: incidentValidation.error.issues
        }, 400);
      }

      const incidentData = incidentValidation.data;
      logger.info('Creating injury report', { type: 'injury', bodyPart: body.bodyPart });

      // Create incident
      const incidentRow = db.insert(incidents).values({
        incidentDate: incidentData.incidentDate,
        incidentTime: incidentData.incidentTime,
        location: incidentData.location,
        department: incidentData.department,
        industrySector: incidentData.industrySector,
        incidentType: 'Recordable Injury',
        severity: incidentData.severity,
        description: incidentData.description,
        immediateActions: incidentData.immediateActions,
        witnesses: incidentData.witnesses,
        rootCauses: incidentData.rootCauses,
        correctiveActions: incidentData.correctiveActions,
        assignedTo: incidentData.assignedTo,
        dueDate: incidentData.dueDate,
        isoClause: incidentData.isoClause,
        regulatoryReportable: true, // Injuries are  mandatory reportable
        selectedStandards: incidentData.selectedStandards ? JSON.stringify(incidentData.selectedStandards) : null,
        status: 'open',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).returning({ id: incidents.id }).get();

      // Create injury report details
      const injuryValidation = CreateInjuryReportSchema.safeParse({
        ...body,
        incidentId: incidentRow.id
      });

      if (!injuryValidation.success) {
        logger.warn('Injury details validation failed', { errors: injuryValidation.error.issues });
        return c.json({ success: false, error: 'Validation failed', issues: injuryValidation.error.issues }, 400);
      }

      const injuryData = injuryValidation.data;
      db.insert(injuryReports).values({
        incidentId: injuryData.incidentId,
        bodyPart: injuryData.bodyPart,
        injuryType: injuryData.injuryType,
        treatmentRequired: injuryData.treatmentRequired,
        medicalAttention: injuryData.medicalAttention,
        daysLost: injuryData.daysLost,
        injurySeverity: injuryData.injurySeverity,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).run();

      logger.info('Injury report created successfully', { location: incidentData.location });

      return c.json({
        success: true,
        message: 'Injury report created successfully',
        data: {
          id: incidentRow.id,
          ...incidentData,
          ...injuryData,
          selectedStandards: incidentData.selectedStandards ?? [],
          status: 'open',
          incidentType: 'Recordable Injury'
        }
      }, 201);

    } catch (error) {
      logger.error('Failed to create injury report', error);
      return c.json({
        success: false,
        error: 'Failed to create injury report',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * POST /api/incidents/vehicle
   * Create a vehicle incident report
   */
  app.post('/api/incidents/vehicle', async (c) => {
    try {
      const body = await c.req.json();
      const incidentValidation = CreateIncidentSchema.safeParse(body);

      if (!incidentValidation.success) {
        return c.json({
          success: false,
          error: 'Validation failed',
          issues: incidentValidation.error.issues
        }, 400);
      }

      const incidentData = incidentValidation.data;
      logger.info('Creating vehicle incident', { vehicle: body.vehicleId || 'Unknown' });

      const incidentRow = db.insert(incidents).values({
        incidentDate: incidentData.incidentDate,
        incidentTime: incidentData.incidentTime,
        location: incidentData.location,
        department: incidentData.department,
        industrySector: incidentData.industrySector,
        incidentType: 'Vehicle Incident',
        severity: incidentData.severity,
        description: incidentData.description,
        immediateActions: incidentData.immediateActions,
        witnesses: incidentData.witnesses,
        rootCauses: incidentData.rootCauses,
        correctiveActions: incidentData.correctiveActions,
        assignedTo: incidentData.assignedTo,
        dueDate: incidentData.dueDate,
        isoClause: incidentData.isoClause,
        regulatoryReportable: incidentData.regulatoryReportable,
        selectedStandards: incidentData.selectedStandards ? JSON.stringify(incidentData.selectedStandards) : null,
        status: 'open',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).returning({ id: incidents.id }).get();

      const vehicleValidation = CreateVehicleIncidentSchema.safeParse({
        ...body,
        incidentId: incidentRow.id
      });

      if (!vehicleValidation.success) {
        return c.json({ success: false, error: 'Validation failed', issues: vehicleValidation.error.issues }, 400);
      }

      const vehicleData = vehicleValidation.data;
      db.insert(vehicleIncidents).values({
        incidentId: vehicleData.incidentId,
        vehicleId: vehicleData.vehicleId,
        driverName: vehicleData.driverName,
        vehicleType: vehicleData.vehicleType,
        damageLevel: vehicleData.damageLevel,
        thirdPartyInvolved: vehicleData.thirdPartyInvolved,
        insuranceClaim: vehicleData.insuranceClaim,
        claimNumber: vehicleData.claimNumber,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).run();

      logger.info('Vehicle incident created', { location: incidentData.location });

      return c.json({
        success: true,
        message: 'Vehicle incident created successfully',
        data: {
          id: incidentRow.id,
          ...incidentData,
          ...vehicleData,
          selectedStandards: incidentData.selectedStandards ?? [],
          status: 'open',
          incidentType: 'Vehicle Incident'
        }
      }, 201);

    } catch (error) {
      logger.error('Failed to create vehicle incident', error);
      return c.json({
        success: false,
        error: 'Failed to create vehicle incident'
      }, 500);
    }
  });

  /**
   * POST /api/incidents/property
   * Create a property incident report
   */
  app.post('/api/incidents/property', async (c) => {
    try {
      const body = await c.req.json();
      const incidentValidation = CreateIncidentSchema.safeParse(body);

      if (!incidentValidation.success) {
        return c.json({ success: false, error: 'Validation failed', issues: incidentValidation.error.issues }, 400);
      }

      const incidentData = incidentValidation.data;
      logger.info('Creating property incident', { asset: body.assetName || 'Unknown' });

      const incidentRow = db.insert(incidents).values({
        incidentDate: incidentData.incidentDate,
        incidentTime: incidentData.incidentTime,
        location: incidentData.location,
        department: incidentData.department,
        industrySector: incidentData.industrySector,
        incidentType: 'Property Damage',
        severity: incidentData.severity,
        description: incidentData.description,
        immediateActions: incidentData.immediateActions,
        witnesses: incidentData.witnesses,
        rootCauses: incidentData.rootCauses,
        correctiveActions: incidentData.correctiveActions,
        assignedTo: incidentData.assignedTo,
        dueDate: incidentData.dueDate,
        isoClause: incidentData.isoClause,
        regulatoryReportable: incidentData.regulatoryReportable,
        selectedStandards: incidentData.selectedStandards ? JSON.stringify(incidentData.selectedStandards) : null,
        status: 'open',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).returning({ id: incidents.id }).get();

      const propertyValidation = CreatePropertyIncidentSchema.safeParse({
        ...body,
        incidentId: incidentRow.id
      });

      if (!propertyValidation.success) {
        return c.json({ success: false, error: 'Validation failed', issues: propertyValidation.error.issues }, 400);
      }

      const propertyData = propertyValidation.data;
      db.insert(propertyIncidents).values({
        incidentId: propertyData.incidentId,
        assetId: propertyData.assetId,
        assetName: propertyData.assetName,
        damageDescription: propertyData.damageDescription,
        damageEstimate: propertyData.damageEstimate,
        repairRequired: propertyData.repairRequired,
        estimatedRepairTime: propertyData.estimatedRepairTime,
        environmentalImpact: propertyData.environmentalImpact,
        businessInterruption: propertyData.businessInterruption,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).run();

      logger.info('Property incident created', { asset: propertyData.assetName });

      return c.json({
        success: true,
        message: 'Property incident created successfully',
        data: {
          id: incidentRow.id,
          ...incidentData,
          ...propertyData,
          selectedStandards: incidentData.selectedStandards ?? [],
          status: 'open',
          incidentType: 'Property Damage'
        }
      }, 201);

    } catch (error) {
      logger.error('Failed to create property incident', error);
      return c.json({ success: false, error: 'Failed to create property incident' }, 500);
    }
  });

  /**
   * POST /api/incidents/near-miss
   * Create a near-miss report
   */
  app.post('/api/incidents/near-miss', async (c) => {
    try {
      const body = await c.req.json();
      const incidentValidation = CreateIncidentSchema.safeParse(body);

      if (!incidentValidation.success) {
        return c.json({ success: false, error: 'Validation failed', issues: incidentValidation.error.issues }, 400);
      }

      const incidentData = incidentValidation.data;
      logger.info('Creating near-miss report', { location: incidentData.location });

      const incidentRow = db.insert(incidents).values({
        incidentDate: incidentData.incidentDate,
        incidentTime: incidentData.incidentTime,
        location: incidentData.location,
        department: incidentData.department,
        industrySector: incidentData.industrySector,
        incidentType: 'Near Miss',
        severity: 'Low', // Near misses are typically low immediate severity
        description: incidentData.description,
        immediateActions: incidentData.immediateActions,
        witnesses: incidentData.witnesses,
        rootCauses: incidentData.rootCauses,
        correctiveActions: incidentData.correctiveActions,
        assignedTo: incidentData.assignedTo,
        dueDate: incidentData.dueDate,
        isoClause: incidentData.isoClause,
        regulatoryReportable: false,
        selectedStandards: incidentData.selectedStandards ? JSON.stringify(incidentData.selectedStandards) : null,
        status: 'open',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).returning({ id: incidents.id }).get();

      const nearMissValidation = CreateNearMissSchema.safeParse({
        ...body,
        incidentId: incidentRow.id
      });

      if (!nearMissValidation.success) {
        return c.json({ success: false, error: 'Validation failed', issues: nearMissValidation.error.issues }, 400);
      }

      const nearMissData = nearMissValidation.data;
      db.insert(nearMisses).values({
        incidentId: nearMissData.incidentId,
        potentialSeverity: nearMissData.potentialSeverity,
        potentialConsequence: nearMissData.potentialConsequence,
        preventativeMeasure: nearMissData.preventativeMeasure,
        likelihood: nearMissData.likelihood,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).run();

      logger.info('Near-miss report created', { location: incidentData.location });

      return c.json({
        success: true,
        message: 'Near-miss report created successfully',
        data: {
          id: incidentRow.id,
          ...incidentData,
          ...nearMissData,
          selectedStandards: incidentData.selectedStandards ?? [],
          status: 'open',
          incidentType: 'Near Miss'
        }
      }, 201);

    } catch (error) {
      logger.error('Failed to create near-miss', error);
      return c.json({ success: false, error: 'Failed to create near-miss' }, 500);
    }
  });

  /**
   * GET /api/incidents/stats
   * Aggregate KPIs for the InjuryReport page header cards
   */
  app.get('/api/incidents/stats', (c) => {
    try {
      const total = (sqlite.prepare('SELECT COUNT(*) AS c FROM incidents').get() as any).c as number;
      const byType = sqlite.prepare(
        'SELECT incident_type AS type, COUNT(*) AS count FROM incidents GROUP BY incident_type'
      ).all() as { type: string; count: number }[];
      const bySeverity = sqlite.prepare(
        'SELECT severity, COUNT(*) AS count FROM incidents GROUP BY severity'
      ).all() as { severity: string; count: number }[];
      const byStatus = sqlite.prepare(
        'SELECT status, COUNT(*) AS count FROM incidents GROUP BY status'
      ).all() as { status: string; count: number }[];

      // Dominant severity (highest present)
      const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];
      const sevMap: Record<string, number> = {};
      for (const row of bySeverity) sevMap[row.severity] = row.count;
      const dominantSeverity = priorityOrder.find(s => (sevMap[s] ?? 0) > 0) ?? 'Medium';

      return c.json({
        success: true,
        data: {
          total,
          distinctTypes: byType.length,
          byType,
          bySeverity,
          byStatus,
          dominantSeverity,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch incident stats', error);
      return c.json({ success: false, error: 'Failed to fetch incident stats' }, 500);
    }
  });

  /**
   * GET /api/incidents/:id
   * Get incident details by ID
   */
  app.get('/api/incidents/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      logger.debug('Fetching incident', { id });

      const incident = db.select().from(incidents).where(eq(incidents.id, id)).all();

      if (!incident || incident.length === 0) {
        return c.json({ success: false, error: 'Incident not found' }, 404);
      }

      return c.json({
        success: true,
        data: incident[0]
      });

    } catch (error) {
      logger.error('Failed to fetch incident', error);
      return c.json({ success: false, error: 'Failed to fetch incident' }, 500);
    }
  });

  /**
   * GET /api/incidents
   * Get all incidents with optional filtering
   */
  app.get('/api/incidents', async (c) => {
    try {
      const severity = c.req.query('severity');
      const status = c.req.query('status');
      const type = c.req.query('type');
      const location = c.req.query('location');
      const fromDate = c.req.query('fromDate');
      const toDate = c.req.query('toDate');
      const limit = parseInt(c.req.query('limit') || '50');

      logger.debug('Fetching incidents', { severity, status, type, location, fromDate, toDate });

      const conditions = [];

      if (severity) conditions.push(eq(incidents.severity, severity));
      if (status) conditions.push(eq(incidents.status, status));
      if (type) conditions.push(eq(incidents.incidentType, type));
      if (location) conditions.push(like(incidents.location, `%${location}%`));
      if (fromDate) conditions.push(gte(incidents.incidentDate, fromDate));
      if (toDate) conditions.push(lte(incidents.incidentDate, toDate));

      const query = conditions.length > 0
        ? db.select().from(incidents).where(and(...conditions))
        : db.select().from(incidents);

      const result = query.orderBy(desc(incidents.createdAt)).limit(limit).all();

      return c.json({
        success: true,
        data: result,
        count: result.length
      });

    } catch (error) {
      logger.error('Failed to fetch incidents', error);
      return c.json({ success: false, error: 'Failed to fetch incidents' }, 500);
    }
  });

  /**
   * PUT /api/incidents/:id
   * Update incident
   */
  app.put('/api/incidents/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();

      logger.info('Updating incident', { id });

      db.update(incidents)
        .set({ ...body, updatedAt: Date.now() })
        .where(eq(incidents.id, id))
        .run();

      logger.info('Incident updated successfully', { id });

      return c.json({
        success: true,
        message: 'Incident updated successfully'
      });

    } catch (error) {
      logger.error('Failed to update incident', error);
      return c.json({ success: false, error: 'Failed to update incident' }, 500);
    }
  });

  /**
   * POST /api/incidents/:id/close
   * Close an incident
   */
  app.post('/api/incidents/:id/close', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      logger.info('Closing incident', { id });

      db.update(incidents)
        .set({ status: 'closed', updatedAt: Date.now() })
        .where(eq(incidents.id, id))
        .run();

      return c.json({
        success: true,
        message: 'Incident closed successfully'
      });

    } catch (error) {
      logger.error('Failed to close incident', error);
      return c.json({ success: false, error: 'Failed to close incident' }, 500);
    }
  });

  /**
   * POST /api/incidents/:id/reopen
   * Reopen a closed incident
   */
  app.post('/api/incidents/:id/reopen', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      logger.info('Reopening incident', { id });

      db.update(incidents)
        .set({ status: 'open', updatedAt: Date.now() })
        .where(eq(incidents.id, id))
        .run();

      return c.json({
        success: true,
        message: 'Incident reopened successfully'
      });

    } catch (error) {
      logger.error('Failed to reopen incident', error);
      return c.json({ success: false, error: 'Failed to reopen incident' }, 500);
    }
  });

  /**
   * DELETE /api/incidents/:id
   * Permanently delete an incident and all linked sub-type records
   */
  app.delete('/api/incidents/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({ success: false, error: 'Invalid incident ID' }, 400);
      }

      logger.info('Deleting incident', { id });

      const existing = db.select({ id: incidents.id }).from(incidents).where(eq(incidents.id, id)).all();
      if (existing.length === 0) {
        return c.json({ success: false, error: 'Incident not found' }, 404);
      }

      // Delete linked sub-type records first (FK constraint safety)
      db.delete(injuryReports).where(eq(injuryReports.incidentId, id)).run();
      db.delete(vehicleIncidents).where(eq(vehicleIncidents.incidentId, id)).run();
      db.delete(propertyIncidents).where(eq(propertyIncidents.incidentId, id)).run();
      db.delete(nearMisses).where(eq(nearMisses.incidentId, id)).run();

      db.delete(incidents).where(eq(incidents.id, id)).run();

      logger.info('Incident deleted successfully', { id });

      return c.json({
        success: true,
        message: 'Incident deleted successfully'
      });

    } catch (error) {
      logger.error('Failed to delete incident', error);
      return c.json({ success: false, error: 'Failed to delete incident' }, 500);
    }
  });
}
