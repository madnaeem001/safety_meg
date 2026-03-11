/**
 * Vehicle Incident Report Routes
 *
 * Standalone vehicle incident management with full driver/vehicle/conditions data.
 *
 * Routes:
 *   GET  /api/vehicle-incidents          - list all reports
 *   POST /api/vehicle-incidents          - create a report
 *   GET  /api/vehicle-incidents/stats    - aggregated stats
 *   GET  /api/vehicle-incidents/:id      - single report
 *   PUT  /api/vehicle-incidents/:id      - update report
 *   DELETE /api/vehicle-incidents/:id    - delete report
 */

import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Math.floor(Date.now() / 1000);

// ── Schema migration ──────────────────────────────────────────────────────────

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicle_incident_reports (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      report_number         TEXT    NOT NULL,
      status                TEXT    NOT NULL DEFAULT 'submitted',

      -- Incident info
      incident_date         TEXT    NOT NULL,
      incident_time         TEXT    NOT NULL DEFAULT '',
      location              TEXT    NOT NULL,
      incident_type         TEXT    NOT NULL DEFAULT '',
      damage_severity       TEXT    NOT NULL DEFAULT '',
      estimated_cost        TEXT    NOT NULL DEFAULT '',

      -- Driver info
      driver_name           TEXT    NOT NULL DEFAULT '',
      employee_id           TEXT    NOT NULL DEFAULT '',
      license_number        TEXT    NOT NULL DEFAULT '',

      -- Vehicle info
      vehicle_type          TEXT    NOT NULL DEFAULT '',
      vehicle_id            TEXT    NOT NULL DEFAULT '',
      vehicle_make          TEXT    NOT NULL DEFAULT '',
      vehicle_model         TEXT    NOT NULL DEFAULT '',
      vehicle_year          TEXT    NOT NULL DEFAULT '',
      license_plate         TEXT    NOT NULL DEFAULT '',
      odometer              TEXT    NOT NULL DEFAULT '',

      -- Conditions
      road_condition        TEXT    NOT NULL DEFAULT '',
      lighting              TEXT    NOT NULL DEFAULT '',
      speed_limit           TEXT    NOT NULL DEFAULT '',
      estimated_speed       TEXT    NOT NULL DEFAULT '',
      weather_condition     TEXT    NOT NULL DEFAULT '',

      -- Description
      description           TEXT    NOT NULL,
      other_vehicles        TEXT    NOT NULL DEFAULT '',
      witnesses             TEXT    NOT NULL DEFAULT '',

      -- Flags
      police_report         INTEGER NOT NULL DEFAULT 0,
      police_report_number  TEXT    NOT NULL DEFAULT '',
      dot_recordable        INTEGER NOT NULL DEFAULT 0,
      injuries              INTEGER NOT NULL DEFAULT 0,
      injury_description    TEXT    NOT NULL DEFAULT '',
      property_damage       TEXT    NOT NULL DEFAULT '',
      preventable           TEXT    NOT NULL DEFAULT '',

      -- Metadata
      reported_by           TEXT    NOT NULL DEFAULT '',
      created_at            INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      updated_at            INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    )
  `);
}

let _initialized = false;
function initOnce() {
  if (_initialized) return;
  _initialized = true;
  const db = getDb();
  try { ensureSchema(db); } finally { db.close(); }
}

// ── Report number generator ───────────────────────────────────────────────────

function genReportNumber(db: Database.Database): string {
  const row = db.prepare('SELECT MAX(id) as maxId FROM vehicle_incident_reports').get() as any;
  const n = (row?.maxId ?? 0) + 1;
  return `VEH-${String(n).padStart(5, '0')}`;
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const CreateSchema = z.object({
  incidentDate:       z.string().min(1, 'Incident date is required'),
  incidentTime:       z.string().optional().default(''),
  location:           z.string().min(1, 'Location is required'),
  incidentType:       z.string().optional().default(''),
  damageSeverity:     z.string().optional().default(''),
  estimatedCost:      z.string().optional().default(''),

  driverName:         z.string().min(1, 'Driver name is required'),
  employeeId:         z.string().optional().default(''),
  licenseNumber:      z.string().optional().default(''),

  vehicleType:        z.string().optional().default(''),
  vehicleId:          z.string().optional().default(''),
  vehicleMake:        z.string().optional().default(''),
  vehicleModel:       z.string().optional().default(''),
  vehicleYear:        z.string().optional().default(''),
  licensePlate:       z.string().optional().default(''),
  odometer:           z.string().optional().default(''),

  roadCondition:      z.string().optional().default(''),
  lighting:           z.string().optional().default(''),
  speedLimit:         z.string().optional().default(''),
  estimatedSpeed:     z.string().optional().default(''),
  weatherCondition:   z.string().optional().default(''),

  description:        z.string().min(1, 'Description is required'),
  otherVehicles:      z.string().optional().default(''),
  witnesses:          z.string().optional().default(''),

  policeReport:       z.boolean().optional().default(false),
  policeReportNumber: z.string().optional().default(''),
  dotRecordable:      z.boolean().optional().default(false),
  injuries:           z.boolean().optional().default(false),
  injuryDescription:  z.string().optional().default(''),
  propertyDamage:     z.string().optional().default(''),
  preventable:        z.string().optional().default(''),

  reportedBy:         z.string().optional().default(''),
});

const UpdateSchema = CreateSchema.partial();

// ── Row → response mapper ─────────────────────────────────────────────────────

function rowToReport(row: any) {
  return {
    id:                  row.id,
    reportNumber:        row.report_number,
    status:              row.status,
    incidentDate:        row.incident_date,
    incidentTime:        row.incident_time,
    location:            row.location,
    incidentType:        row.incident_type,
    damageSeverity:      row.damage_severity,
    estimatedCost:       row.estimated_cost,
    driverName:          row.driver_name,
    employeeId:          row.employee_id,
    licenseNumber:       row.license_number,
    vehicleType:         row.vehicle_type,
    vehicleId:           row.vehicle_id,
    vehicleMake:         row.vehicle_make,
    vehicleModel:        row.vehicle_model,
    vehicleYear:         row.vehicle_year,
    licensePlate:        row.license_plate,
    odometer:            row.odometer,
    roadCondition:       row.road_condition,
    lighting:            row.lighting,
    speedLimit:          row.speed_limit,
    estimatedSpeed:      row.estimated_speed,
    weatherCondition:    row.weather_condition,
    description:         row.description,
    otherVehicles:       row.other_vehicles,
    witnesses:           row.witnesses,
    policeReport:        Boolean(row.police_report),
    policeReportNumber:  row.police_report_number,
    dotRecordable:       Boolean(row.dot_recordable),
    injuries:            Boolean(row.injuries),
    injuryDescription:   row.injury_description,
    propertyDamage:      row.property_damage,
    preventable:         row.preventable,
    reportedBy:          row.reported_by,
    createdAt:           row.created_at,
    updatedAt:           row.updated_at,
  };
}

// ── Route registration ────────────────────────────────────────────────────────

export function vehicleIncidentsRoutes(app: Hono) {
  initOnce();

  // GET /api/vehicle-incidents/stats
  app.get('/api/vehicle-incidents/stats', (c) => {
    const db = getDb();
    try {
      const total     = (db.prepare('SELECT COUNT(*) as n FROM vehicle_incident_reports').get() as any).n;
      const dotCount  = (db.prepare("SELECT COUNT(*) as n FROM vehicle_incident_reports WHERE dot_recordable=1").get() as any).n;
      const injuries  = (db.prepare("SELECT COUNT(*) as n FROM vehicle_incident_reports WHERE injuries=1").get() as any).n;
      const byType    = db.prepare('SELECT incident_type, COUNT(*) as count FROM vehicle_incident_reports GROUP BY incident_type').all();
      const bySeverity= db.prepare('SELECT damage_severity, COUNT(*) as count FROM vehicle_incident_reports GROUP BY damage_severity').all();
      return c.json({ success: true, data: { total, dotRecordable: dotCount, withInjuries: injuries, byType, bySeverity } });
    } finally { db.close(); }
  });

  // GET /api/vehicle-incidents
  app.get('/api/vehicle-incidents', (c) => {
    const db = getDb();
    try {
      const { status, incidentType, from, to } = c.req.query();
      let sql = 'SELECT * FROM vehicle_incident_reports WHERE 1=1';
      const params: any[] = [];
      if (status)       { sql += ' AND status=?';        params.push(status); }
      if (incidentType) { sql += ' AND incident_type=?'; params.push(incidentType); }
      if (from)         { sql += ' AND created_at >= ?'; params.push(Number(from)); }
      if (to)           { sql += ' AND created_at <= ?'; params.push(Number(to)); }
      sql += ' ORDER BY created_at DESC';
      const rows = db.prepare(sql).all(...params);
      return c.json({ success: true, data: rows.map(rowToReport) });
    } finally { db.close(); }
  });

  // POST /api/vehicle-incidents
  app.post('/api/vehicle-incidents', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
      }
      const d = parsed.data;
      const reportNumber = genReportNumber(db);
      const ts = now();
      const result = db.prepare(`
        INSERT INTO vehicle_incident_reports (
          report_number, status,
          incident_date, incident_time, location, incident_type, damage_severity, estimated_cost,
          driver_name, employee_id, license_number,
          vehicle_type, vehicle_id, vehicle_make, vehicle_model, vehicle_year, license_plate, odometer,
          road_condition, lighting, speed_limit, estimated_speed, weather_condition,
          description, other_vehicles, witnesses,
          police_report, police_report_number, dot_recordable,
          injuries, injury_description, property_damage, preventable,
          reported_by, created_at, updated_at
        ) VALUES (
          ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
        )
      `).run(
        reportNumber, 'submitted',
        d.incidentDate, d.incidentTime, d.location, d.incidentType, d.damageSeverity, d.estimatedCost,
        d.driverName, d.employeeId, d.licenseNumber,
        d.vehicleType, d.vehicleId, d.vehicleMake, d.vehicleModel, d.vehicleYear, d.licensePlate, d.odometer,
        d.roadCondition, d.lighting, d.speedLimit, d.estimatedSpeed, d.weatherCondition,
        d.description, d.otherVehicles, d.witnesses,
        d.policeReport ? 1 : 0, d.policeReportNumber, d.dotRecordable ? 1 : 0,
        d.injuries ? 1 : 0, d.injuryDescription, d.propertyDamage, d.preventable,
        d.reportedBy, ts, ts,
      );
      const row = db.prepare('SELECT * FROM vehicle_incident_reports WHERE id=?').get(result.lastInsertRowid);
      return c.json({ success: true, data: rowToReport(row) }, 201);
    } finally { db.close(); }
  });

  // GET /api/vehicle-incidents/:id
  app.get('/api/vehicle-incidents/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const row = db.prepare('SELECT * FROM vehicle_incident_reports WHERE id=?').get(id);
      if (!row) return c.json({ success: false, error: 'Report not found' }, 404);
      return c.json({ success: true, data: rowToReport(row) });
    } finally { db.close(); }
  });

  // PUT /api/vehicle-incidents/:id
  app.put('/api/vehicle-incidents/:id', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const existing = db.prepare('SELECT * FROM vehicle_incident_reports WHERE id=?').get(id);
      if (!existing) return c.json({ success: false, error: 'Report not found' }, 404);

      const body = await c.req.json();
      const parsed = UpdateSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
      }
      const d = parsed.data;
      const colMap: Record<string, string> = {
        incidentDate: 'incident_date', incidentTime: 'incident_time', location: 'location',
        incidentType: 'incident_type', damageSeverity: 'damage_severity', estimatedCost: 'estimated_cost',
        driverName: 'driver_name', employeeId: 'employee_id', licenseNumber: 'license_number',
        vehicleType: 'vehicle_type', vehicleId: 'vehicle_id', vehicleMake: 'vehicle_make',
        vehicleModel: 'vehicle_model', vehicleYear: 'vehicle_year', licensePlate: 'license_plate',
        odometer: 'odometer', roadCondition: 'road_condition', lighting: 'lighting',
        speedLimit: 'speed_limit', estimatedSpeed: 'estimated_speed', weatherCondition: 'weather_condition',
        description: 'description', otherVehicles: 'other_vehicles', witnesses: 'witnesses',
        policeReport: 'police_report', policeReportNumber: 'police_report_number',
        dotRecordable: 'dot_recordable', injuries: 'injuries', injuryDescription: 'injury_description',
        propertyDamage: 'property_damage', preventable: 'preventable', reportedBy: 'reported_by',
        status: 'status',
      };
      const fields: string[] = [];
      const vals: any[] = [];
      for (const [key, col] of Object.entries(colMap)) {
        if (key in d) {
          fields.push(`${col}=?`);
          const val = (d as any)[key];
          vals.push(typeof val === 'boolean' ? (val ? 1 : 0) : val);
        }
      }
      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at=?');
      vals.push(now(), id);
      db.prepare(`UPDATE vehicle_incident_reports SET ${fields.join(', ')} WHERE id=?`).run(...vals);
      const updated = db.prepare('SELECT * FROM vehicle_incident_reports WHERE id=?').get(id);
      return c.json({ success: true, data: rowToReport(updated) });
    } finally { db.close(); }
  });

  // DELETE /api/vehicle-incidents/:id
  app.delete('/api/vehicle-incidents/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const existing = db.prepare('SELECT * FROM vehicle_incident_reports WHERE id=?').get(id);
      if (!existing) return c.json({ success: false, error: 'Report not found' }, 404);
      db.prepare('DELETE FROM vehicle_incident_reports WHERE id=?').run(id);
      return c.json({ success: true, data: { deleted: true } });
    } finally { db.close(); }
  });
}
