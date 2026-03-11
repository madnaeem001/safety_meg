/**
 * Sensor Routes Test Suite
 *
 * Covers:
 *   GET    /api/inspections/sensors          (list, filters)
 *   POST   /api/inspections/sensors          (create, validation, duplicate)
 *   GET    /api/inspections/sensors/:id      (get by sensorId, 404)
 *   PUT    /api/inspections/sensors/:id      (update, 404)
 *   DELETE /api/inspections/sensors/:id      (delete, 404)
 *   GET    /api/inspections/readings         (list, filters)
 *   POST   /api/inspections/readings         (create, validation)
 *   POST   /api/inspections/sensors/:id/calibrate   (calibrate, 404)
 *   GET    /api/inspections/sensors/:id/calibrations (history, 404)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { sensorRoutes } from '../routes/sensors';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  sensorRoutes(app);
  return app;
}

// ── Request Helper ─────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── Seed / Cleanup ─────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `teststd-${Date.now()}`;

let sensorRowId1: number;
let sensorRowId2: number;
let sensorRowId3: number;

const SENSOR_ID_1 = `${TAG}-sensor-001`;
const SENSOR_ID_2 = `${TAG}-sensor-002`;
const SENSOR_ID_3 = `${TAG}-sensor-003`;

afterAll(() => {
  sqlite.prepare(`DELETE FROM sensor_calibrations WHERE sensor_id LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM sensor_readings WHERE sensor_id LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM sensor_configurations WHERE sensor_id LIKE '${TAG}%'`).run();
  sqlite.close();
});

function seedSensor(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO sensor_configurations
      (sensor_id, name, sensor_type, location, zone, unit,
       min_threshold, max_threshold, status, alerts_enabled,
       created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.sensor_id   ?? `${TAG}-s-${ts}`,
    overrides.name        ?? 'Test Sensor',
    overrides.sensor_type ?? 'temperature',
    overrides.location    ?? 'Warehouse A',
    overrides.zone        ?? 'Zone-1',
    overrides.unit        ?? '°C',
    overrides.min_threshold ?? 10,
    overrides.max_threshold ?? 80,
    overrides.status      ?? 'normal',
    overrides.alerts_enabled ?? 1,
    ts, ts,
  );
  return Number(result.lastInsertRowid);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Sensor Routes', () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
    // Seed three sensor configs
    sensorRowId1 = seedSensor({ sensor_id: SENSOR_ID_1, sensor_type: 'temperature', zone: 'Zone-A', status: 'normal', name: `${TAG} Temp Sensor` });
    sensorRowId2 = seedSensor({ sensor_id: SENSOR_ID_2, sensor_type: 'gas',         zone: 'Zone-B', status: 'warning', name: `${TAG} Gas Sensor` });
    sensorRowId3 = seedSensor({ sensor_id: SENSOR_ID_3, sensor_type: 'humidity',    zone: 'Zone-A', status: 'normal', name: `${TAG} Humidity Sensor` });
  });

  // ── GET /api/inspections/sensors ──────────────────────────────────────────

  describe('GET /api/inspections/sensors', () => {
    it('returns 200 and an array', async () => {
      const { status, body } = await req(app, 'GET', '/api/inspections/sensors');
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });

    it('includes seeded sensors in results', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/sensors');
      const ids = body.map((s: any) => s.sensorId);
      expect(ids).toContain(SENSOR_ID_1);
      expect(ids).toContain(SENSOR_ID_2);
      expect(ids).toContain(SENSOR_ID_3);
    });

    it('returns camelCase fields (sensorId, sensorType, maxThreshold)', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/sensors');
      const sensor = body.find((s: any) => s.sensorId === SENSOR_ID_1);
      expect(sensor).toBeDefined();
      expect(sensor).toHaveProperty('sensorId');
      expect(sensor).toHaveProperty('sensorType');
      expect(sensor).toHaveProperty('maxThreshold');
      expect(sensor).toHaveProperty('minThreshold');
      expect(sensor).toHaveProperty('alertsEnabled');
      expect(sensor).toHaveProperty('createdAt');
      expect(sensor).toHaveProperty('updatedAt');
      // Must NOT include snake_case originals
      expect(sensor).not.toHaveProperty('sensor_id');
      expect(sensor).not.toHaveProperty('sensor_type');
      expect(sensor).not.toHaveProperty('max_threshold');
    });

    it('alertsEnabled is a boolean', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/sensors');
      const sensor = body.find((s: any) => s.sensorId === SENSOR_ID_1);
      expect(typeof sensor.alertsEnabled).toBe('boolean');
    });

    it('filters by type=gas', async () => {
      const { status, body } = await req(app, 'GET', '/api/inspections/sensors?type=gas');
      expect(status).toBe(200);
      const ids = body.map((s: any) => s.sensorId);
      expect(ids).toContain(SENSOR_ID_2);
      expect(ids).not.toContain(SENSOR_ID_1);
    });

    it('filters by zone=Zone-A', async () => {
      const { status, body } = await req(app, 'GET', '/api/inspections/sensors?zone=Zone-A');
      expect(status).toBe(200);
      const ids = body.map((s: any) => s.sensorId);
      expect(ids).toContain(SENSOR_ID_1);
      expect(ids).toContain(SENSOR_ID_3);
      expect(ids).not.toContain(SENSOR_ID_2);
    });

    it('filters by status=warning', async () => {
      const { status, body } = await req(app, 'GET', '/api/inspections/sensors?status=warning');
      expect(status).toBe(200);
      const ids = body.map((s: any) => s.sensorId);
      expect(ids).toContain(SENSOR_ID_2);
      expect(ids).not.toContain(SENSOR_ID_1);
    });

    it('combined filter: type + zone', async () => {
      const { status, body } = await req(app, 'GET', '/api/inspections/sensors?type=temperature&zone=Zone-A');
      expect(status).toBe(200);
      const ids = body.map((s: any) => s.sensorId);
      expect(ids).toContain(SENSOR_ID_1);
      expect(ids).not.toContain(SENSOR_ID_2);
      expect(ids).not.toContain(SENSOR_ID_3);
    });
  });

  // ── POST /api/inspections/sensors ─────────────────────────────────────────

  describe('POST /api/inspections/sensors', () => {
    it('creates a new sensor and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/sensors', {
        sensorId: `${TAG}-new-001`,
        name: 'Created Sensor',
        sensorType: 'flame',
        location: 'Boiler Room',
        zone: 'Zone-C',
        unit: 'binary',
        minThreshold: 0,
        maxThreshold: 1,
      });
      expect(status).toBe(201);
      expect(body.sensorId).toBe(`${TAG}-new-001`);
      expect(body.sensorType).toBe('flame');
      expect(body.location).toBe('Boiler Room');
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('createdAt');
    });

    it('returns 400 when sensorId is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/sensors', {
        name: 'No ID Sensor',
        sensorType: 'humidity',
        location: 'Lab',
      });
      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('returns 400 when name is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/sensors', {
        sensorId: `${TAG}-no-name`,
        sensorType: 'humidity',
        location: 'Lab',
      });
      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('returns 400 when location is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/sensors', {
        sensorId: `${TAG}-no-loc`,
        name: 'No Location',
        sensorType: 'gas',
      });
      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('returns 400 when sensorType is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/sensors', {
        sensorId: `${TAG}-no-type`,
        name: 'No Type',
        location: 'Lab',
      });
      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('returns 409 on duplicate sensorId', async () => {
      const { status } = await req(app, 'POST', '/api/inspections/sensors', {
        sensorId: SENSOR_ID_1,
        name: 'Duplicate',
        sensorType: 'temperature',
        location: 'Somewhere',
      });
      expect(status).toBe(409);
    });

    it('defaults status to normal when not provided', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/sensors', {
        sensorId: `${TAG}-default-status`,
        name: 'Default Status Sensor',
        sensorType: 'noise',
        location: 'Office',
      });
      expect(body.status).toBe('normal');
    });

    it('defaults alertsEnabled to true when not provided', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/sensors', {
        sensorId: `${TAG}-default-alerts`,
        name: 'Default Alerts Sensor',
        sensorType: 'motion',
        location: 'Entrance',
      });
      expect(body.alertsEnabled).toBe(true);
    });
  });

  // ── GET /api/inspections/sensors/:sensorId ────────────────────────────────

  describe('GET /api/inspections/sensors/:sensorId', () => {
    it('returns 200 with sensor data', async () => {
      const { status, body } = await req(app, 'GET', `/api/inspections/sensors/${SENSOR_ID_1}`);
      expect(status).toBe(200);
      expect(body.sensorId).toBe(SENSOR_ID_1);
    });

    it('returns all camelCase fields', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${SENSOR_ID_2}`);
      expect(body).toHaveProperty('sensorId');
      expect(body).toHaveProperty('sensorType');
      expect(body).toHaveProperty('minThreshold');
      expect(body).toHaveProperty('maxThreshold');
      expect(body).toHaveProperty('alertsEnabled');
      expect(typeof body.alertsEnabled).toBe('boolean');
    });

    it('returns 404 for non-existent sensorId', async () => {
      const { status, body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-nonexistent`);
      expect(status).toBe(404);
      expect(body).toHaveProperty('error');
    });
  });

  // ── PUT /api/inspections/sensors/:sensorId ────────────────────────────────

  describe('PUT /api/inspections/sensors/:sensorId', () => {
    it('updates sensor and returns updated record', async () => {
      const { status, body } = await req(app, 'PUT', `/api/inspections/sensors/${SENSOR_ID_1}`, {
        status: 'critical',
        maxThreshold: 90,
      });
      expect(status).toBe(200);
      expect(body.status).toBe('critical');
      expect(body.maxThreshold).toBe(90);
      expect(body.sensorId).toBe(SENSOR_ID_1);
    });

    it('can update name only', async () => {
      const { status, body } = await req(app, 'PUT', `/api/inspections/sensors/${SENSOR_ID_2}`, {
        name: 'Updated Gas Sensor',
      });
      expect(status).toBe(200);
      expect(body.name).toBe('Updated Gas Sensor');
    });

    it('can update alertsEnabled to false', async () => {
      const { status, body } = await req(app, 'PUT', `/api/inspections/sensors/${SENSOR_ID_3}`, {
        alertsEnabled: false,
      });
      expect(status).toBe(200);
      expect(body.alertsEnabled).toBe(false);
    });

    it('returns 404 for non-existent sensorId', async () => {
      const { status } = await req(app, 'PUT', `/api/inspections/sensors/${TAG}-ghost`, {
        name: 'Ghost Update',
      });
      expect(status).toBe(404);
    });

    it('returns 400 for invalid field values', async () => {
      const { status } = await req(app, 'PUT', `/api/inspections/sensors/${SENSOR_ID_1}`, {
        minThreshold: 'not-a-number',
      });
      expect(status).toBe(400);
    });

    it('no-op update (empty body) returns sensor unchanged', async () => {
      const before = await req(app, 'GET', `/api/inspections/sensors/${SENSOR_ID_2}`);
      const { status, body } = await req(app, 'PUT', `/api/inspections/sensors/${SENSOR_ID_2}`, {});
      expect(status).toBe(200);
      expect(body.sensorId).toBe(before.body.sensorId);
    });
  });

  // ── DELETE /api/inspections/sensors/:sensorId ─────────────────────────────

  describe('DELETE /api/inspections/sensors/:sensorId', () => {
    it('deletes sensor and returns { deleted: true }', async () => {
      // Create a disposable sensor
      const { body: created } = await req(app, 'POST', '/api/inspections/sensors', {
        sensorId: `${TAG}-del-001`,
        name: 'To Delete',
        sensorType: 'temperature',
        location: 'Delete Zone',
      });
      const { status, body } = await req(app, 'DELETE', `/api/inspections/sensors/${created.sensorId}`);
      expect(status).toBe(200);
      expect(body.deleted).toBe(true);
    });

    it('returns 404 for non-existent sensorId', async () => {
      const { status } = await req(app, 'DELETE', `/api/inspections/sensors/${TAG}-noexist`);
      expect(status).toBe(404);
    });

    it('returns 404 on second delete (already deleted)', async () => {
      const { body: created } = await req(app, 'POST', '/api/inspections/sensors', {
        sensorId: `${TAG}-del-002`,
        name: 'Delete Twice',
        sensorType: 'gas',
        location: 'Lab',
      });
      await req(app, 'DELETE', `/api/inspections/sensors/${created.sensorId}`);
      const { status } = await req(app, 'DELETE', `/api/inspections/sensors/${created.sensorId}`);
      expect(status).toBe(404);
    });

    it('sensor no longer appears in GET list after deletion', async () => {
      const { body: created } = await req(app, 'POST', '/api/inspections/sensors', {
        sensorId: `${TAG}-del-003`,
        name: 'Vanishing Sensor',
        sensorType: 'humidity',
        location: 'Storage',
      });
      await req(app, 'DELETE', `/api/inspections/sensors/${created.sensorId}`);
      const { body: list } = await req(app, 'GET', '/api/inspections/sensors');
      const ids = list.map((s: any) => s.sensorId);
      expect(ids).not.toContain(created.sensorId);
    });
  });

  // ── GET /api/inspections/readings ─────────────────────────────────────────

  describe('GET /api/inspections/readings', () => {
    beforeAll(() => {
      // Seed readings for SENSOR_ID_1
      const ts = Date.now();
      for (let i = 0; i < 5; i++) {
        sqlite.prepare(`
          INSERT INTO sensor_readings (sensor_id, value, unit, status, anomaly_detected, recorded_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(SENSOR_ID_1, 25 + i, '°C', 'normal', 0, ts - i * 1000);
      }
      // Seed one anomalous reading for SENSOR_ID_2
      sqlite.prepare(`
        INSERT INTO sensor_readings (sensor_id, value, unit, status, anomaly_detected, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(SENSOR_ID_2, 999, 'ppm', 'critical', 1, ts);
    });

    it('returns 200 and an array', async () => {
      const { status, body } = await req(app, 'GET', '/api/inspections/readings');
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });

    it('returns camelCase fields (sensorId, anomalyDetected, recordedAt)', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/readings?sensorId=${SENSOR_ID_1}`);
      expect(body.length).toBeGreaterThan(0);
      const r = body[0];
      expect(r).toHaveProperty('sensorId');
      expect(r).toHaveProperty('anomalyDetected');
      expect(r).toHaveProperty('recordedAt');
      expect(r).not.toHaveProperty('sensor_id');
      expect(r).not.toHaveProperty('anomaly_detected');
      expect(r).not.toHaveProperty('recorded_at');
    });

    it('anomalyDetected is a boolean', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/readings?sensorId=${SENSOR_ID_2}`);
      expect(body.length).toBeGreaterThan(0);
      expect(typeof body[0].anomalyDetected).toBe('boolean');
    });

    it('anomalyDetected is true for critical reading', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/readings?sensorId=${SENSOR_ID_2}`);
      const critical = body.find((r: any) => r.value === 999);
      expect(critical).toBeDefined();
      expect(critical.anomalyDetected).toBe(true);
    });

    it('filters by sensorId', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/readings?sensorId=${SENSOR_ID_1}`);
      expect(body.length).toBeGreaterThan(0);
      body.forEach((r: any) => expect(r.sensorId).toBe(SENSOR_ID_1));
    });

    it('respects limit parameter', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/readings?sensorId=${SENSOR_ID_1}&limit=2`);
      expect(body.length).toBeLessThanOrEqual(2);
    });

    it('results ordered by recordedAt DESC', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/readings?sensorId=${SENSOR_ID_1}`);
      if (body.length > 1) {
        expect(body[0].recordedAt).toBeGreaterThanOrEqual(body[1].recordedAt);
      }
    });
  });

  // ── POST /api/inspections/readings ────────────────────────────────────────

  describe('POST /api/inspections/readings', () => {
    it('creates a reading and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: SENSOR_ID_1,
        value: 42.5,
        unit: '°C',
      });
      expect(status).toBe(201);
      expect(body.sensorId).toBe(SENSOR_ID_1);
      expect(body.value).toBe(42.5);
      expect(body).toHaveProperty('recordedAt');
    });

    it('returns 400 when sensorId is missing', async () => {
      const { status } = await req(app, 'POST', '/api/inspections/readings', {
        value: 30,
      });
      expect(status).toBe(400);
    });

    it('returns 400 when value is missing', async () => {
      const { status } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: SENSOR_ID_1,
      });
      expect(status).toBe(400);
    });

    it('returns 400 when value is a string instead of number', async () => {
      const { status } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: SENSOR_ID_1,
        value: 'not-a-number',
      });
      expect(status).toBe(400);
    });

    it('correctly stores anomalyDetected=true', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: SENSOR_ID_2,
        value: 850,
        unit: 'ppm',
        anomalyDetected: true,
        status: 'critical',
      });
      expect(body.anomalyDetected).toBe(true);
      expect(body.status).toBe('critical');
    });

    it('defaults anomalyDetected to false', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: SENSOR_ID_3,
        value: 55.0,
      });
      expect(body.anomalyDetected).toBe(false);
    });

    it('defaults status to normal', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: SENSOR_ID_3,
        value: 60.0,
      });
      expect(body.status).toBe('normal');
    });
  });

  // ── POST /api/inspections/sensors/:sensorId/calibrate ─────────────────────

  describe('POST /api/inspections/sensors/:sensorId/calibrate', () => {
    it('records calibration and returns 201', async () => {
      const { status, body } = await req(app, 'POST', `/api/inspections/sensors/${SENSOR_ID_1}/calibrate`, {
        calibrationDate: '2025-06-01',
        calibratedBy: 'Inspector Bob',
        certificateId: 'CERT-001',
        passedCalibration: true,
        nextCalibrationDue: '2026-06-01',
      });
      expect(status).toBe(201);
      expect(body.sensorId).toBe(SENSOR_ID_1);
      expect(body.calibrationDate).toBe('2025-06-01');
      expect(body.calibratedBy).toBe('Inspector Bob');
      expect(body.certificateId).toBe('CERT-001');
      expect(body).toHaveProperty('createdAt');
    });

    it('returns camelCase fields (calibrationDate, calibratedBy, passedCalibration)', async () => {
      const { body } = await req(app, 'POST', `/api/inspections/sensors/${SENSOR_ID_2}/calibrate`, {
        calibrationDate: '2025-07-01',
      });
      expect(body).toHaveProperty('calibrationDate');
      expect(body).toHaveProperty('calibratedBy');
      expect(body).toHaveProperty('passedCalibration');
      expect(body).toHaveProperty('nextCalibrationDue');
      expect(body).not.toHaveProperty('calibration_date');
      expect(body).not.toHaveProperty('calibrated_by');
    });

    it('passedCalibration is a boolean', async () => {
      const { body } = await req(app, 'POST', `/api/inspections/sensors/${SENSOR_ID_3}/calibrate`, {
        calibrationDate: '2025-08-01',
        passedCalibration: false,
      });
      expect(body.passedCalibration).toBe(false);
    });

    it('defaults passedCalibration to true when not provided', async () => {
      const { body } = await req(app, 'POST', `/api/inspections/sensors/${SENSOR_ID_1}/calibrate`, {
        calibrationDate: '2025-09-15',
      });
      expect(body.passedCalibration).toBe(true);
    });

    it('returns 400 when calibrationDate is missing', async () => {
      const { status } = await req(app, 'POST', `/api/inspections/sensors/${SENSOR_ID_1}/calibrate`, {
        calibratedBy: 'Someone',
      });
      expect(status).toBe(400);
    });

    it('returns 404 for non-existent sensorId', async () => {
      const { status } = await req(app, 'POST', `/api/inspections/sensors/${TAG}-ghost/calibrate`, {
        calibrationDate: '2025-01-01',
      });
      expect(status).toBe(404);
    });

    it('updates last_calibrated on sensor config after calibration', async () => {
      const calDate = '2025-10-01';
      await req(app, 'POST', `/api/inspections/sensors/${SENSOR_ID_2}/calibrate`, {
        calibrationDate: calDate,
      });
      const { body: sensor } = await req(app, 'GET', `/api/inspections/sensors/${SENSOR_ID_2}`);
      expect(sensor.lastCalibrated).toBe(calDate);
    });
  });

  // ── GET /api/inspections/sensors/:sensorId/calibrations ───────────────────

  describe('GET /api/inspections/sensors/:sensorId/calibrations', () => {
    it('returns 200 and an array', async () => {
      const { status, body } = await req(app, 'GET', `/api/inspections/sensors/${SENSOR_ID_1}/calibrations`);
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });

    it('returns filled array for sensor with calibration history', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${SENSOR_ID_1}/calibrations`);
      expect(body.length).toBeGreaterThan(0);
    });

    it('each calibration has camelCase fields', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${SENSOR_ID_1}/calibrations`);
      const c = body[0];
      expect(c).toHaveProperty('sensorId');
      expect(c).toHaveProperty('calibrationDate');
      expect(c).toHaveProperty('calibratedBy');
      expect(c).toHaveProperty('passedCalibration');
      expect(c).toHaveProperty('nextCalibrationDue');
      expect(c).not.toHaveProperty('sensor_id');
      expect(c).not.toHaveProperty('calibration_date');
    });

    it('passedCalibration is a boolean in history', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${SENSOR_ID_1}/calibrations`);
      body.forEach((c: any) => expect(typeof c.passedCalibration).toBe('boolean'));
    });

    it('returns 404 for non-existent sensorId', async () => {
      const { status } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-ghost/calibrations`);
      expect(status).toBe(404);
    });

    it('returns empty array for sensor with no calibrations', async () => {
      // Create a fresh sensor with no calibration history
      const freshId = `${TAG}-nocal`;
      await req(app, 'POST', '/api/inspections/sensors', {
        sensorId: freshId,
        name: 'No Calibration Sensor',
        sensorType: 'temperature',
        location: 'Test Room',
      });
      const { status, body } = await req(app, 'GET', `/api/inspections/sensors/${freshId}/calibrations`);
      expect(status).toBe(200);
      expect(body).toEqual([]);
    });

    it('calibrations ordered by createdAt DESC', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${SENSOR_ID_1}/calibrations`);
      if (body.length > 1) {
        expect(body[0].createdAt).toBeGreaterThanOrEqual(body[1].createdAt);
      }
    });
  });
});
