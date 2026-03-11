import { Hono } from 'hono';
import { z } from 'zod';
import Database from 'better-sqlite3';
import { logger } from '../services/logger';

const isProdRoute = process.env.NODE_ENV === 'production' || # Fix all non-test route files that still have hardcoded 'local.sqlite'process.env.RAILWAY_ENVIRONMENT;
const sqlite = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');

// ==================== VALIDATION SCHEMAS ====================

const CreateInspectionSchema = z.object({
  title: z.string().min(3, 'Title required'),
  inspectionType: z.enum(['swppp', 'stormwater', 'safety-audit', 'epa', 'sensor-check', 'permit']),
  description: z.string().optional(),
  zone: z.string().optional(),
  location: z.string().optional(),
  equipmentId: z.string().optional(),
  assignedTo: z.string().optional(),
  assigneeEmail: z.string().email().optional(),
  recurrence: z.enum(['once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annual']).default('once'),
  scheduledDate: z.string().min(1, 'Scheduled date required'),
  scheduledTime: z.string().optional(),
  duration: z.number().int().min(1).default(60),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  checklist: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const UpdateInspectionSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled']).optional(),
  assignedTo: z.string().optional(),
  assigneeEmail: z.string().email().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  notes: z.string().optional(),
});

const CompleteInspectionSchema = z.object({
  completedDate: z.string().min(1),
  completedTime: z.string().optional(),
  result: z.enum(['pass', 'fail', 'partial']),
  checklist: z.array(z.object({
    item: z.string(),
    completed: z.boolean(),
  })).optional(),
  findings: z.array(z.string()).optional(),
  notes: z.string().optional(),
  nextScheduledDate: z.string().optional(),
});

const CreateSensorSchema = z.object({
  sensorId: z.string().min(1, 'Sensor ID required (e.g. S001)'),
  name: z.string().min(1, 'Sensor name required'),
  sensorType: z.enum(['temperature', 'gas', 'humidity', 'noise', 'flame', 'motion']),
  location: z.string().min(1, 'Location required'),
  zone: z.string().optional(),
  unit: z.string().optional(),
  minThreshold: z.number().optional(),
  maxThreshold: z.number().optional(),
  alertsEnabled: z.boolean().default(true),
  thresholds: z.record(z.string(), z.any()).optional(),
  positionX: z.number().min(0).max(100).optional(),
  positionY: z.number().min(0).max(100).optional(),
  mountedSince: z.string().optional(),
  calibrationDue: z.string().optional(),
  manufacturer: z.string().optional(),
  modelNumber: z.string().optional(),
  serialNumber: z.string().optional(),
});

const UpdateSensorSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  zone: z.string().optional(),
  status: z.enum(['normal', 'warning', 'critical', 'offline', 'maintenance']).optional(),
  minThreshold: z.number().optional(),
  maxThreshold: z.number().optional(),
  alertsEnabled: z.boolean().optional(),
  thresholds: z.record(z.string(), z.any()).optional(),
  calibrationDue: z.string().optional(),
  positionX: z.number().min(0).max(100).optional(),
  positionY: z.number().min(0).max(100).optional(),
});

const RecordReadingSchema = z.object({
  sensorId: z.string().min(1),
  value: z.number(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

const CalibrateSchema = z.object({
  calibrationDate: z.string().min(1),
  calibratedBy: z.string().min(1),
  certificateId: z.string().optional(),
  passedCalibration: z.boolean().default(true),
  deviationFound: z.string().optional(),
  correctionApplied: z.string().optional(),
  nextCalibrationDue: z.string().optional(),
  notes: z.string().optional(),
});

// ==================== HELPERS ====================

function calcSensorStatus(value: number, min: number | null, max: number | null): string {
  if (min === null || max === null) return 'normal';
  const range = max - min;
  const warningBuffer = range * 0.1; // within 10% of threshold = warning
  if (value > max || value < min) return 'critical';
  if (value > max - warningBuffer || value < min + warningBuffer) return 'warning';
  return 'normal';
}

function calcNextDate(scheduledDate: string, recurrence: string): string | null {
  if (recurrence === 'once') return null;
  const d = new Date(scheduledDate);
  switch (recurrence) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'biweekly': d.setDate(d.getDate() + 14); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'annual': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split('T')[0];
}

// ==================== ROUTES ====================

export const inspectionRoutes = (app: Hono) => {

  // ── INSPECTION STATS ──────────────────────────────────────────────────────

  /**
   * GET /api/inspections/stats
   * Dashboard overview
   */
  app.get('/api/inspections/stats', (c) => {
    try {
      const stats = sqlite.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN result = 'pass' THEN 1 ELSE 0 END) as passed,
          SUM(CASE WHEN result = 'fail' THEN 1 ELSE 0 END) as failed
        FROM inspection_schedule
      `).get() as any;

      const sensorStats = sqlite.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END) as normal,
          SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END) as warning,
          SUM(CASE WHEN status = 'critical' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline
        FROM sensor_configurations
      `).get() as any;

      const overdueCalibrations = sqlite.prepare(`
        SELECT COUNT(*) as count FROM sensor_configurations
        WHERE calibration_due IS NOT NULL AND calibration_due < date('now')
      `).get() as any;

      return c.json({
        success: true,
        data: {
          inspections: stats,
          sensors: { ...sensorStats, overdueCalibrations: overdueCalibrations.count },
        },
      }, 200);
    } catch (error) {
      logger.error('Error fetching inspection stats', { error });
      return c.json({ success: false, error: 'Failed to fetch inspection stats' }, 500);
    }
  });

  // ── INSPECTION SCHEDULE ───────────────────────────────────────────────────

  /**
   * GET /api/inspections/schedule
   * List inspections (filter: status, type, zone, priority)
   */
  app.get('/api/inspections/schedule', (c) => {
    try {
      const status = c.req.query('status');
      const inspectionType = c.req.query('type');
      const zone = c.req.query('zone');
      const priority = c.req.query('priority');

      let query = 'SELECT * FROM inspection_schedule WHERE 1=1';
      const params: any[] = [];

      if (status) { query += ' AND status = ?'; params.push(status); }
      if (inspectionType) { query += ' AND inspection_type = ?'; params.push(inspectionType); }
      if (zone) { query += ' AND zone = ?'; params.push(zone); }
      if (priority) { query += ' AND priority = ?'; params.push(priority); }
      query += ' ORDER BY scheduled_date ASC';

      const rows = sqlite.prepare(query).all(...params) as any[];

      const data = rows.map((r) => ({
        id: r.id,
        title: r.title,
        inspectionType: r.inspection_type,
        zone: r.zone,
        location: r.location,
        assignedTo: r.assigned_to,
        recurrence: r.recurrence,
        scheduledDate: r.scheduled_date,
        scheduledTime: r.scheduled_time,
        duration: r.duration,
        status: r.status,
        priority: r.priority,
        result: r.result,
        completedDate: r.completed_date,
        nextScheduledDate: r.next_scheduled_date,
      }));

      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error listing inspections', { error });
      return c.json({ success: false, error: 'Failed to fetch inspection schedule' }, 500);
    }
  });

  /**
   * POST /api/inspections/schedule
   * Schedule a new inspection
   */
  app.post('/api/inspections/schedule', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateInspectionSchema.parse(body);

      sqlite.prepare(`
        INSERT INTO inspection_schedule (
          title, inspection_type, description, zone, location, equipment_id,
          assigned_to, assignee_email, recurrence,
          scheduled_date, scheduled_time, duration, priority,
          checklist, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        v.title, v.inspectionType, v.description || null, v.zone || null,
        v.location || null, v.equipmentId || null,
        v.assignedTo || null, v.assigneeEmail || null, v.recurrence,
        v.scheduledDate, v.scheduledTime || null, v.duration, v.priority,
        v.checklist ? JSON.stringify(v.checklist.map(item => ({ item, completed: false }))) : null,
        v.notes || null
      );

      const row = sqlite.prepare('SELECT * FROM inspection_schedule ORDER BY id DESC LIMIT 1').get() as any;
      logger.info('Inspection scheduled', { id: row.id, title: row.title });

      return c.json({
        success: true,
        data: {
          id: row.id,
          title: row.title,
          status: row.status,
          scheduledDate: row.scheduled_date,
          priority: row.priority,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error scheduling inspection', { error });
      return c.json({ success: false, error: 'Failed to schedule inspection' }, 500);
    }
  });

  // ── SENSOR CONFIGURATION ──────────────────────────────────────────────────

  /**
   * GET /api/inspections/sensors
   * List sensors (filter: type, zone, status)
   */
  app.get('/api/inspections/sensors', (c) => {
    try {
      const sensorType = c.req.query('type');
      const zone = c.req.query('zone');
      const status = c.req.query('status');

      let query = 'SELECT * FROM sensor_configurations WHERE 1=1';
      const params: any[] = [];

      if (sensorType) { query += ' AND sensor_type = ?'; params.push(sensorType); }
      if (zone) { query += ' AND zone = ?'; params.push(zone); }
      if (status) { query += ' AND status = ?'; params.push(status); }
      query += ' ORDER BY sensor_id ASC';

      const rows = sqlite.prepare(query).all(...params) as any[];

      const data = rows.map((r) => ({
        id: r.id,
        sensorId: r.sensor_id,
        name: r.name,
        sensorType: r.sensor_type,
        location: r.location,
        zone: r.zone,
        unit: r.unit,
        minThreshold: r.min_threshold,
        maxThreshold: r.max_threshold,
        status: r.status,
        alertsEnabled: Boolean(r.alerts_enabled),
        calibrationDue: r.calibration_due,
        lastCalibrated: r.last_calibrated,
        positionX: r.position_x,
        positionY: r.position_y,
      }));

      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error listing sensors', { error });
      return c.json({ success: false, error: 'Failed to fetch sensors' }, 500);
    }
  });

  /**
   * POST /api/inspections/sensors
   * Register a new sensor
   */
  app.post('/api/inspections/sensors', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateSensorSchema.parse(body);

      const dup = sqlite.prepare('SELECT id FROM sensor_configurations WHERE sensor_id = ?').get(v.sensorId);
      if (dup) return c.json({ success: false, error: 'Sensor ID already exists' }, 409);

      sqlite.prepare(`
        INSERT INTO sensor_configurations (
          sensor_id, name, sensor_type, location, zone,
          unit, min_threshold, max_threshold, alerts_enabled, thresholds,
          position_x, position_y,
          mounted_since, calibration_due,
          manufacturer, model_number, serial_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        v.sensorId, v.name, v.sensorType, v.location, v.zone || null,
        v.unit || null, v.minThreshold ?? null, v.maxThreshold ?? null,
        v.alertsEnabled ? 1 : 0,
        v.thresholds ? JSON.stringify(v.thresholds) : null,
        v.positionX ?? null, v.positionY ?? null,
        v.mountedSince || null, v.calibrationDue || null,
        v.manufacturer || null, v.modelNumber || null, v.serialNumber || null
      );

      const row = sqlite.prepare('SELECT * FROM sensor_configurations WHERE sensor_id = ?').get(v.sensorId) as any;
      logger.info('Sensor registered', { sensorId: v.sensorId, type: v.sensorType });

      return c.json({
        success: true,
        data: {
          id: row.id,
          sensorId: row.sensor_id,
          name: row.name,
          sensorType: row.sensor_type,
          status: row.status,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error creating sensor', { error });
      return c.json({ success: false, error: 'Failed to register sensor' }, 500);
    }
  });

  /**
   * GET /api/inspections/sensors/:sensorId
   * Get sensor detail (by sensorId like S001)
   */
  app.get('/api/inspections/sensors/:sensorId', (c) => {
    try {
      const sensorId = c.req.param('sensorId');

      const row = sqlite.prepare('SELECT * FROM sensor_configurations WHERE sensor_id = ?').get(sensorId) as any;
      if (!row) return c.json({ success: false, error: 'Sensor not found' }, 404);

      // Get latest reading
      const lastReading = sqlite.prepare(
        'SELECT * FROM sensor_readings WHERE sensor_id = ? ORDER BY recorded_at DESC LIMIT 1'
      ).get(sensorId) as any;

      // Get latest calibration
      const lastCalibration = sqlite.prepare(
        'SELECT * FROM sensor_calibrations WHERE sensor_id = ? ORDER BY created_at DESC LIMIT 1'
      ).get(sensorId) as any;

      return c.json({
        success: true,
        data: {
          id: row.id,
          sensorId: row.sensor_id,
          name: row.name,
          sensorType: row.sensor_type,
          location: row.location,
          zone: row.zone,
          unit: row.unit,
          minThreshold: row.min_threshold,
          maxThreshold: row.max_threshold,
          status: row.status,
          alertsEnabled: Boolean(row.alerts_enabled),
          thresholds: row.thresholds ? JSON.parse(row.thresholds) : null,
          positionX: row.position_x,
          positionY: row.position_y,
          mountedSince: row.mounted_since,
          calibrationDue: row.calibration_due,
          lastCalibrated: row.last_calibrated,
          manufacturer: row.manufacturer,
          modelNumber: row.model_number,
          serialNumber: row.serial_number,
          lastReading: lastReading ? {
            value: lastReading.value,
            unit: lastReading.unit,
            status: lastReading.status,
            recordedAt: lastReading.recorded_at,
          } : null,
          lastCalibration: lastCalibration ? {
            date: lastCalibration.calibration_date,
            calibratedBy: lastCalibration.calibrated_by,
            passed: Boolean(lastCalibration.passed_calibration),
            nextDue: lastCalibration.next_calibration_due,
          } : null,
          createdAt: row.created_at,
        },
      }, 200);
    } catch (error) {
      logger.error('Error fetching sensor', { error });
      return c.json({ success: false, error: 'Failed to fetch sensor' }, 500);
    }
  });

  /**
   * PUT /api/inspections/sensors/:sensorId
   * Update sensor config
   */
  app.put('/api/inspections/sensors/:sensorId', async (c) => {
    try {
      const sensorId = c.req.param('sensorId');

      const existing = sqlite.prepare('SELECT * FROM sensor_configurations WHERE sensor_id = ?').get(sensorId) as any;
      if (!existing) return c.json({ success: false, error: 'Sensor not found' }, 404);

      const body = await c.req.json();
      const v = UpdateSensorSchema.parse(body);

      sqlite.prepare(`
        UPDATE sensor_configurations SET
          name = ?, location = ?, zone = ?, status = ?,
          min_threshold = ?, max_threshold = ?,
          alerts_enabled = ?, thresholds = ?,
          calibration_due = ?, position_x = ?, position_y = ?,
          updated_at = ?
        WHERE sensor_id = ?
      `).run(
        v.name ?? existing.name,
        v.location ?? existing.location,
        v.zone ?? existing.zone,
        v.status ?? existing.status,
        v.minThreshold ?? existing.min_threshold,
        v.maxThreshold ?? existing.max_threshold,
        v.alertsEnabled !== undefined ? (v.alertsEnabled ? 1 : 0) : existing.alerts_enabled,
        v.thresholds ? JSON.stringify(v.thresholds) : existing.thresholds,
        v.calibrationDue ?? existing.calibration_due,
        v.positionX ?? existing.position_x,
        v.positionY ?? existing.position_y,
        Date.now(), sensorId
      );

      logger.info('Sensor updated', { sensorId, status: v.status });
      return c.json({ success: true, data: { sensorId, status: v.status ?? existing.status } }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error updating sensor', { error });
      return c.json({ success: false, error: 'Failed to update sensor' }, 500);
    }
  });

  // ── SENSOR READINGS ───────────────────────────────────────────────────────

  /**
   * POST /api/inspections/readings
   * Record a sensor reading (auto-updates sensor status)
   */
  app.post('/api/inspections/readings', async (c) => {
    try {
      const body = await c.req.json();
      const v = RecordReadingSchema.parse(body);

      const sensor = sqlite.prepare('SELECT * FROM sensor_configurations WHERE sensor_id = ?').get(v.sensorId) as any;
      if (!sensor) return c.json({ success: false, error: 'Sensor not found' }, 404);

      const newStatus = calcSensorStatus(v.value, sensor.min_threshold, sensor.max_threshold);
      const anomalyDetected = newStatus !== 'normal' ? 1 : 0;

      sqlite.prepare(`
        INSERT INTO sensor_readings (sensor_id, value, unit, status, anomaly_detected, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(v.sensorId, v.value, v.unit ?? sensor.unit, newStatus, anomalyDetected, v.notes || null);

      // Update sensor status
      sqlite.prepare(`UPDATE sensor_configurations SET status = ?, updated_at = ? WHERE sensor_id = ?`)
        .run(newStatus, Date.now(), v.sensorId);

      const reading = sqlite.prepare(
        'SELECT * FROM sensor_readings WHERE sensor_id = ? ORDER BY id DESC LIMIT 1'
      ).get(v.sensorId) as any;

      logger.info('Sensor reading recorded', { sensorId: v.sensorId, value: v.value, status: newStatus });

      return c.json({
        success: true,
        data: {
          id: reading.id,
          sensorId: v.sensorId,
          value: v.value,
          status: newStatus,
          anomalyDetected: Boolean(anomalyDetected),
          recordedAt: reading.recorded_at,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error recording sensor reading', { error });
      return c.json({ success: false, error: 'Failed to record reading' }, 500);
    }
  });

  /**
   * GET /api/inspections/readings
   * Get sensor readings (filter: sensorId, limit)
   */
  app.get('/api/inspections/readings', (c) => {
    try {
      const sensorId = c.req.query('sensorId');
      const limit = parseInt(c.req.query('limit') || '50', 10);
      const anomalyOnly = c.req.query('anomaly') === 'true';

      let query = 'SELECT * FROM sensor_readings WHERE 1=1';
      const params: any[] = [];

      if (sensorId) { query += ' AND sensor_id = ?'; params.push(sensorId); }
      if (anomalyOnly) { query += ' AND anomaly_detected = 1'; }
      query += ` ORDER BY recorded_at DESC LIMIT ${Math.min(limit, 500)}`;

      const rows = sqlite.prepare(query).all(...params) as any[];

      const data = rows.map((r) => ({
        id: r.id,
        sensorId: r.sensor_id,
        value: r.value,
        unit: r.unit,
        status: r.status,
        anomalyDetected: Boolean(r.anomaly_detected),
        notes: r.notes,
        recordedAt: r.recorded_at,
      }));

      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error fetching sensor readings', { error });
      return c.json({ success: false, error: 'Failed to fetch readings' }, 500);
    }
  });

  // ── SENSOR CALIBRATION ────────────────────────────────────────────────────

  /**
   * POST /api/inspections/sensors/:sensorId/calibrate
   * Record sensor calibration
   */
  app.post('/api/inspections/sensors/:sensorId/calibrate', async (c) => {
    try {
      const sensorId = c.req.param('sensorId');

      const sensor = sqlite.prepare('SELECT * FROM sensor_configurations WHERE sensor_id = ?').get(sensorId) as any;
      if (!sensor) return c.json({ success: false, error: 'Sensor not found' }, 404);

      const body = await c.req.json();
      const v = CalibrateSchema.parse(body);

      sqlite.prepare(`
        INSERT INTO sensor_calibrations (
          sensor_id, calibration_date, calibrated_by, certificate_id,
          passed_calibration, deviation_found, correction_applied,
          next_calibration_due, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sensorId, v.calibrationDate, v.calibratedBy, v.certificateId || null,
        v.passedCalibration ? 1 : 0,
        v.deviationFound || null, v.correctionApplied || null,
        v.nextCalibrationDue || null, v.notes || null
      );

      // Update sensor calibration dates
      sqlite.prepare(`
        UPDATE sensor_configurations SET
          last_calibrated = ?, calibration_due = ?,
          status = ?, updated_at = ?
        WHERE sensor_id = ?
      `).run(
        v.calibrationDate,
        v.nextCalibrationDue ?? sensor.calibration_due,
        v.passedCalibration ? 'normal' : 'maintenance',
        Date.now(), sensorId
      );

      const cal = sqlite.prepare(
        'SELECT * FROM sensor_calibrations WHERE sensor_id = ? ORDER BY id DESC LIMIT 1'
      ).get(sensorId) as any;

      logger.info('Sensor calibrated', { sensorId, passed: v.passedCalibration });

      return c.json({
        success: true,
        data: {
          id: cal.id,
          sensorId,
          calibrationDate: v.calibrationDate,
          calibratedBy: v.calibratedBy,
          passedCalibration: v.passedCalibration,
          nextCalibrationDue: v.nextCalibrationDue,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error recording calibration', { error });
      return c.json({ success: false, error: 'Failed to record calibration' }, 500);
    }
  });

  /**
   * GET /api/inspections/sensors/:sensorId/calibrations
   * Get calibration history for a sensor
   */
  app.get('/api/inspections/sensors/:sensorId/calibrations', (c) => {
    try {
      const sensorId = c.req.param('sensorId');

      const rows = sqlite.prepare(
        'SELECT * FROM sensor_calibrations WHERE sensor_id = ? ORDER BY created_at DESC'
      ).all(sensorId) as any[];

      const data = rows.map((r) => ({
        id: r.id,
        calibrationDate: r.calibration_date,
        calibratedBy: r.calibrated_by,
        certificateId: r.certificate_id,
        passedCalibration: Boolean(r.passed_calibration),
        deviationFound: r.deviation_found,
        correctionApplied: r.correction_applied,
        nextCalibrationDue: r.next_calibration_due,
        notes: r.notes,
        createdAt: r.created_at,
      }));

      return c.json({ success: true, data, count: data.length }, 200);
    } catch (error) {
      logger.error('Error fetching calibrations', { error });
      return c.json({ success: false, error: 'Failed to fetch calibration history' }, 500);
    }
  });


  /**
   * GET /api/inspections/:id
   * Get inspection details
   */
  app.get('/api/inspections/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid inspection ID' }, 400);

      const row = sqlite.prepare('SELECT * FROM inspection_schedule WHERE id = ?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Inspection not found' }, 404);

      return c.json({
        success: true,
        data: {
          id: row.id,
          title: row.title,
          inspectionType: row.inspection_type,
          description: row.description,
          zone: row.zone,
          location: row.location,
          equipmentId: row.equipment_id,
          assignedTo: row.assigned_to,
          assigneeEmail: row.assignee_email,
          recurrence: row.recurrence,
          scheduledDate: row.scheduled_date,
          scheduledTime: row.scheduled_time,
          duration: row.duration,
          completedDate: row.completed_date,
          completedTime: row.completed_time,
          status: row.status,
          priority: row.priority,
          result: row.result,
          checklist: row.checklist ? JSON.parse(row.checklist) : [],
          findings: row.findings ? JSON.parse(row.findings) : [],
          notes: row.notes,
          nextScheduledDate: row.next_scheduled_date,
          notificationSent: Boolean(row.notification_sent),
          reminderSent: Boolean(row.reminder_sent),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      }, 200);
    } catch (error) {
      logger.error('Error fetching inspection', { error });
      return c.json({ success: false, error: 'Failed to fetch inspection' }, 500);
    }
  });

  /**
   * PUT /api/inspections/:id
   * Reschedule / update inspection
   */
  app.put('/api/inspections/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid inspection ID' }, 400);

      const existing = sqlite.prepare('SELECT * FROM inspection_schedule WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Inspection not found' }, 404);

      const body = await c.req.json();
      const v = UpdateInspectionSchema.parse(body);

      sqlite.prepare(`
        UPDATE inspection_schedule SET
          status = ?, assigned_to = ?, assignee_email = ?,
          scheduled_date = ?, scheduled_time = ?, priority = ?,
          notes = ?, updated_at = ?
        WHERE id = ?
      `).run(
        v.status ?? existing.status,
        v.assignedTo ?? existing.assigned_to,
        v.assigneeEmail ?? existing.assignee_email,
        v.scheduledDate ?? existing.scheduled_date,
        v.scheduledTime ?? existing.scheduled_time,
        v.priority ?? existing.priority,
        v.notes ?? existing.notes,
        Date.now(), id
      );

      logger.info('Inspection updated', { id, status: v.status });

      return c.json({
        success: true,
        data: { id, status: v.status ?? existing.status },
      }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error updating inspection', { error });
      return c.json({ success: false, error: 'Failed to update inspection' }, 500);
    }
  });

  /**
   * POST /api/inspections/:id/complete
   * Mark inspection as complete with results
   */
  app.post('/api/inspections/:id/complete', async (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid inspection ID' }, 400);

      const existing = sqlite.prepare('SELECT * FROM inspection_schedule WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Inspection not found' }, 404);

      const body = await c.req.json();
      const v = CompleteInspectionSchema.parse(body);

      const nextDate = v.nextScheduledDate ?? calcNextDate(existing.scheduled_date, existing.recurrence);

      sqlite.prepare(`
        UPDATE inspection_schedule SET
          status = 'completed', result = ?,
          completed_date = ?, completed_time = ?,
          checklist = ?, findings = ?,
          notes = ?, next_scheduled_date = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        v.result,
        v.completedDate, v.completedTime || null,
        v.checklist ? JSON.stringify(v.checklist) : existing.checklist,
        v.findings ? JSON.stringify(v.findings) : null,
        v.notes ?? existing.notes,
        nextDate,
        Date.now(), id
      );

      logger.info('Inspection completed', { id, result: v.result, nextDate });

      return c.json({
        success: true,
        data: { id, status: 'completed', result: v.result, nextScheduledDate: nextDate },
      }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error completing inspection', { error });
      return c.json({ success: false, error: 'Failed to complete inspection' }, 500);
    }
  });
};
