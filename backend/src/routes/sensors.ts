import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const nowMs = () => Date.now();

function safeJson(val: any) {
  if (!val) return undefined;
  try { return JSON.parse(val); } catch { return val; }
}

function mapSensorRow(r: any) {
  return {
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
    thresholds: safeJson(r.thresholds),
    positionX: r.position_x,
    positionY: r.position_y,
    mountedSince: r.mounted_since,
    calibrationDue: r.calibration_due,
    lastCalibrated: r.last_calibrated,
    manufacturer: r.manufacturer,
    modelNumber: r.model_number,
    serialNumber: r.serial_number,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapReadingRow(r: any) {
  return {
    id: r.id,
    sensorId: r.sensor_id,
    value: r.value,
    unit: r.unit,
    status: r.status,
    anomalyDetected: Boolean(r.anomaly_detected),
    notes: r.notes,
    recordedAt: r.recorded_at,
  };
}

function mapCalibrationRow(r: any) {
  return {
    id: r.id,
    sensorId: r.sensor_id,
    calibrationDate: r.calibration_date,
    calibratedBy: r.calibrated_by,
    certificateId: r.certificate_id,
    passedCalibration: Boolean(r.passed_calibration),
    deviationFound: r.deviation_found,
    correctionApplied: r.correction_applied,
    nextCalibrationDue: r.next_calibration_due,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

const CreateSensorSchema = z.object({
  sensorId: z.string().min(1),
  name: z.string().min(1),
  sensorType: z.string().min(1),
  location: z.string().min(1),
  zone: z.string().optional(),
  unit: z.string().optional(),
  minThreshold: z.number().optional(),
  maxThreshold: z.number().optional(),
  status: z.string().optional(),
  alertsEnabled: z.boolean().optional(),
  thresholds: z.any().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  mountedSince: z.string().optional(),
  calibrationDue: z.string().optional(),
  manufacturer: z.string().optional(),
  modelNumber: z.string().optional(),
  serialNumber: z.string().optional(),
});

const UpdateSensorSchema = CreateSensorSchema.partial().omit({ sensorId: true });

const CreateReadingSchema = z.object({
  sensorId: z.string().min(1),
  value: z.number(),
  unit: z.string().optional(),
  status: z.string().optional(),
  anomalyDetected: z.boolean().optional(),
  notes: z.string().optional(),
});

const CalibrateSchema = z.object({
  calibrationDate: z.string().min(1),
  calibratedBy: z.string().optional(),
  certificateId: z.string().optional(),
  passedCalibration: z.boolean().optional(),
  deviationFound: z.string().optional(),
  correctionApplied: z.string().optional(),
  nextCalibrationDue: z.string().optional(),
  notes: z.string().optional(),
});

export function sensorRoutes(app: Hono) {
  // GET /api/inspections/sensors — list all sensors with optional filters
  app.get('/api/inspections/sensors', (c) => {
    const db = getDb();
    try {
      const { type, zone, status } = c.req.query() as Record<string, string>;
      const conditions: string[] = [];
      const params: any[] = [];
      if (type) { conditions.push('sensor_type = ?'); params.push(type); }
      if (zone) { conditions.push('zone = ?'); params.push(zone); }
      if (status) { conditions.push('status = ?'); params.push(status); }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const rows = db.prepare(`SELECT * FROM sensor_configurations ${where} ORDER BY created_at DESC`).all(...params) as any[];
      return c.json(rows.map(mapSensorRow));
    } finally {
      db.close();
    }
  });

  // POST /api/inspections/sensors — create sensor configuration
  app.post('/api/inspections/sensors', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateSensorSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      }
      const d = parsed.data;

      // Check for duplicate sensorId
      const existing = db.prepare('SELECT id FROM sensor_configurations WHERE sensor_id = ?').get(d.sensorId);
      if (existing) {
        return c.json({ error: 'Sensor with this sensorId already exists' }, 409);
      }

      const ts = nowMs();
      const result = db.prepare(`
        INSERT INTO sensor_configurations
          (sensor_id, name, sensor_type, location, zone, unit,
           min_threshold, max_threshold, status, alerts_enabled, thresholds,
           position_x, position_y, mounted_since, calibration_due,
           manufacturer, model_number, serial_number,
           created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        d.sensorId, d.name, d.sensorType, d.location,
        d.zone ?? null, d.unit ?? null,
        d.minThreshold ?? null, d.maxThreshold ?? null,
        d.status ?? 'normal',
        d.alertsEnabled !== false ? 1 : 0,
        d.thresholds ? JSON.stringify(d.thresholds) : null,
        d.positionX ?? null, d.positionY ?? null,
        d.mountedSince ?? null, d.calibrationDue ?? null,
        d.manufacturer ?? null, d.modelNumber ?? null, d.serialNumber ?? null,
        ts, ts
      );

      const created = db.prepare('SELECT * FROM sensor_configurations WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json(mapSensorRow(created), 201);
    } finally {
      db.close();
    }
  });

  // GET /api/inspections/sensors/:sensorId — get single sensor by sensorId
  app.get('/api/inspections/sensors/:sensorId', (c) => {
    const db = getDb();
    try {
      const sensorId = c.req.param('sensorId');
      const row = db.prepare('SELECT * FROM sensor_configurations WHERE sensor_id = ?').get(sensorId) as any;
      if (!row) return c.json({ error: 'Sensor not found' }, 404);
      return c.json(mapSensorRow(row));
    } finally {
      db.close();
    }
  });

  // PUT /api/inspections/sensors/:sensorId — update sensor configuration
  app.put('/api/inspections/sensors/:sensorId', async (c) => {
    const db = getDb();
    try {
      const sensorId = c.req.param('sensorId');
      const existing = db.prepare('SELECT * FROM sensor_configurations WHERE sensor_id = ?').get(sensorId) as any;
      if (!existing) return c.json({ error: 'Sensor not found' }, 404);

      const body = await c.req.json();
      const parsed = UpdateSensorSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      }
      const d = parsed.data;
      const ts = nowMs();

      const fields: string[] = [];
      const values: any[] = [];

      if (d.name !== undefined) { fields.push('name = ?'); values.push(d.name); }
      if (d.sensorType !== undefined) { fields.push('sensor_type = ?'); values.push(d.sensorType); }
      if (d.location !== undefined) { fields.push('location = ?'); values.push(d.location); }
      if (d.zone !== undefined) { fields.push('zone = ?'); values.push(d.zone); }
      if (d.unit !== undefined) { fields.push('unit = ?'); values.push(d.unit); }
      if (d.minThreshold !== undefined) { fields.push('min_threshold = ?'); values.push(d.minThreshold); }
      if (d.maxThreshold !== undefined) { fields.push('max_threshold = ?'); values.push(d.maxThreshold); }
      if (d.status !== undefined) { fields.push('status = ?'); values.push(d.status); }
      if (d.alertsEnabled !== undefined) { fields.push('alerts_enabled = ?'); values.push(d.alertsEnabled ? 1 : 0); }
      if (d.thresholds !== undefined) { fields.push('thresholds = ?'); values.push(JSON.stringify(d.thresholds)); }
      if (d.positionX !== undefined) { fields.push('position_x = ?'); values.push(d.positionX); }
      if (d.positionY !== undefined) { fields.push('position_y = ?'); values.push(d.positionY); }
      if (d.mountedSince !== undefined) { fields.push('mounted_since = ?'); values.push(d.mountedSince); }
      if (d.calibrationDue !== undefined) { fields.push('calibration_due = ?'); values.push(d.calibrationDue); }
      if (d.manufacturer !== undefined) { fields.push('manufacturer = ?'); values.push(d.manufacturer); }
      if (d.modelNumber !== undefined) { fields.push('model_number = ?'); values.push(d.modelNumber); }
      if (d.serialNumber !== undefined) { fields.push('serial_number = ?'); values.push(d.serialNumber); }

      if (fields.length === 0) {
        return c.json(mapSensorRow(existing));
      }

      fields.push('updated_at = ?');
      values.push(ts);
      values.push(sensorId);

      db.prepare(`UPDATE sensor_configurations SET ${fields.join(', ')} WHERE sensor_id = ?`).run(...values);
      const updated = db.prepare('SELECT * FROM sensor_configurations WHERE sensor_id = ?').get(sensorId) as any;
      return c.json(mapSensorRow(updated));
    } finally {
      db.close();
    }
  });

  // DELETE /api/inspections/sensors/:sensorId — delete sensor
  app.delete('/api/inspections/sensors/:sensorId', (c) => {
    const db = getDb();
    try {
      const sensorId = c.req.param('sensorId');
      const existing = db.prepare('SELECT id FROM sensor_configurations WHERE sensor_id = ?').get(sensorId);
      if (!existing) return c.json({ error: 'Sensor not found' }, 404);
      db.prepare('DELETE FROM sensor_configurations WHERE sensor_id = ?').run(sensorId);
      return c.json({ deleted: true });
    } finally {
      db.close();
    }
  });

  // GET /api/inspections/readings — list sensor readings with optional filters
  app.get('/api/inspections/readings', (c) => {
    const db = getDb();
    try {
      const { sensorId, from, to, limit } = c.req.query() as Record<string, string>;
      const conditions: string[] = [];
      const params: any[] = [];
      if (sensorId) { conditions.push('sensor_id = ?'); params.push(sensorId); }
      if (from) { conditions.push('recorded_at >= ?'); params.push(Number(from)); }
      if (to) { conditions.push('recorded_at <= ?'); params.push(Number(to)); }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const limitClause = limit ? `LIMIT ${Math.max(1, Math.min(10000, Number(limit)))}` : 'LIMIT 500';
      const rows = db.prepare(`SELECT * FROM sensor_readings ${where} ORDER BY recorded_at DESC ${limitClause}`).all(...params) as any[];
      return c.json(rows.map(mapReadingRow));
    } finally {
      db.close();
    }
  });

  // POST /api/inspections/readings — add a sensor reading
  app.post('/api/inspections/readings', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateReadingSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      }
      const d = parsed.data;
      const ts = nowMs();

      const result = db.prepare(`
        INSERT INTO sensor_readings (sensor_id, value, unit, status, anomaly_detected, notes, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        d.sensorId, d.value,
        d.unit ?? null,
        d.status ?? 'normal',
        d.anomalyDetected ? 1 : 0,
        d.notes ?? null,
        ts
      );

      const created = db.prepare('SELECT * FROM sensor_readings WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json(mapReadingRow(created), 201);
    } finally {
      db.close();
    }
  });

  // POST /api/inspections/sensors/:sensorId/calibrate — record calibration
  app.post('/api/inspections/sensors/:sensorId/calibrate', async (c) => {
    const db = getDb();
    try {
      const sensorId = c.req.param('sensorId');
      const sensor = db.prepare('SELECT id FROM sensor_configurations WHERE sensor_id = ?').get(sensorId);
      if (!sensor) return c.json({ error: 'Sensor not found' }, 404);

      const body = await c.req.json();
      const parsed = CalibrateSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      }
      const d = parsed.data;
      const ts = nowMs();

      const result = db.prepare(`
        INSERT INTO sensor_calibrations
          (sensor_id, calibration_date, calibrated_by, certificate_id,
           passed_calibration, deviation_found, correction_applied,
           next_calibration_due, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sensorId, d.calibrationDate,
        d.calibratedBy ?? 'System', d.certificateId ?? null,
        d.passedCalibration !== false ? 1 : 0,
        d.deviationFound ?? null, d.correctionApplied ?? null,
        d.nextCalibrationDue ?? null, d.notes ?? null,
        ts
      );

      // Update last_calibrated on the sensor config
      db.prepare('UPDATE sensor_configurations SET last_calibrated = ?, updated_at = ? WHERE sensor_id = ?')
        .run(d.calibrationDate, ts, sensorId);

      const created = db.prepare('SELECT * FROM sensor_calibrations WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json(mapCalibrationRow(created), 201);
    } finally {
      db.close();
    }
  });

  // GET /api/inspections/sensors/:sensorId/calibrations — get calibration history
  app.get('/api/inspections/sensors/:sensorId/calibrations', (c) => {
    const db = getDb();
    try {
      const sensorId = c.req.param('sensorId');
      const sensor = db.prepare('SELECT id FROM sensor_configurations WHERE sensor_id = ?').get(sensorId);
      if (!sensor) return c.json({ error: 'Sensor not found' }, 404);
      const rows = db.prepare('SELECT * FROM sensor_calibrations WHERE sensor_id = ? ORDER BY created_at DESC').all(sensorId) as any[];
      return c.json(rows.map(mapCalibrationRow));
    } finally {
      db.close();
    }
  });
}
