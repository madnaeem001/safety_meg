/**
 * Inspection Routes API Tests
 * Covers:
 *   - GET  /api/inspections/stats
 *   - GET  /api/inspections/schedule
 *   - POST /api/inspections/schedule
 *   - GET  /api/inspections/:id
 *   - PUT  /api/inspections/:id
 *   - POST /api/inspections/:id/complete
 *   - GET  /api/inspections/sensors
 *   - POST /api/inspections/sensors
 *   - GET  /api/inspections/sensors/:sensorId
 *   - PUT  /api/inspections/sensors/:sensorId
 *   - POST /api/inspections/readings
 *   - GET  /api/inspections/readings
 *   - POST /api/inspections/sensors/:sensorId/calibrate
 *   - GET  /api/inspections/sensors/:sensorId/calibrations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { inspectionRoutes } from '../routes/inspections';

// ── Test App Factory ─────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  inspectionRoutes(app);
  return app;
}

// ── HTTP Helper ──────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  const json = await res.json();
  return { status: res.status, body: json as any };
}

// ── DB Handle & Cleanup ──────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `test-insp-${Date.now()}`;

afterAll(() => {
  sqlite.prepare(`DELETE FROM sensor_calibrations WHERE sensor_id LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM sensor_readings WHERE sensor_id LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM sensor_configurations WHERE sensor_id LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM inspection_schedule WHERE title LIKE '${TAG}%'`).run();
  sqlite.close();
});

// ── Shared Base Payloads ──────────────────────────────────────────────────

const baseInspection = {
  title: `${TAG} Scheduled SWPPP`,
  inspectionType: 'swppp' as const,
  scheduledDate: '2026-04-01',
  scheduledTime: '09:00',
  priority: 'medium' as const,
  recurrence: 'weekly' as const,
  duration: 60,
  zone: 'Zone-A',
  location: 'Building 1',
  assignedTo: 'Inspector Test',
  checklist: ['Check drainage', 'Inspect barriers'],
  notes: 'Test inspection notes',
};

const baseSensor = (suffix: string) => ({
  sensorId: `${TAG}-${suffix}`,
  name: `${TAG} ${suffix} Sensor`,
  sensorType: 'temperature' as const,
  location: 'Plant Room A',
  zone: 'Zone-A',
  unit: '°C',
  minThreshold: 15,
  maxThreshold: 35,
  alertsEnabled: true,
  calibrationDue: '2027-01-01',
});

// ── Suites ───────────────────────────────────────────────────────────────

describe('Inspection Routes', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  // ── GET /api/inspections/stats ─────────────────────────────────────────

  describe('GET /api/inspections/stats', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/inspections/stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data.inspections has required numeric fields', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/stats');
      const ins = body.data.inspections;
      expect(typeof ins.total).toBe('number');
      expect(typeof ins.scheduled).toBe('number');
      expect(typeof ins.inProgress).toBe('number');
      expect(typeof ins.completed).toBe('number');
      expect(typeof ins.overdue).toBe('number');
      expect(typeof ins.cancelled).toBe('number');
      expect(typeof ins.passed).toBe('number');
      expect(typeof ins.failed).toBe('number');
    });

    it('data.sensors has required numeric fields', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/stats');
      const sensors = body.data.sensors;
      expect(typeof sensors.total).toBe('number');
      expect(typeof sensors.normal).toBe('number');
      expect(typeof sensors.warning).toBe('number');
      expect(typeof sensors.critical).toBe('number');
      expect(typeof sensors.offline).toBe('number');
      expect(typeof sensors.overdueCalibrations).toBe('number');
    });

    it('all stat counts are non-negative numbers', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/stats');
      const ins = body.data.inspections;
      expect(ins.total).toBeGreaterThanOrEqual(0);
      expect(ins.scheduled).toBeGreaterThanOrEqual(0);
      expect(ins.completed).toBeGreaterThanOrEqual(0);
    });
  });

  // ── POST /api/inspections/schedule ────────────────────────────────────

  describe('POST /api/inspections/schedule', () => {
    it('creates a scheduled inspection and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/schedule', baseInspection);
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('response data has id, title, status, scheduledDate, priority', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/schedule', {
        ...baseInspection,
        title: `${TAG} create-shape`,
      });
      expect(typeof body.data.id).toBe('number');
      expect(body.data.title).toBe(`${TAG} create-shape`);
      expect(body.data.status).toBe('scheduled');
      expect(body.data.scheduledDate).toBe('2026-04-01');
      expect(body.data.priority).toBe('medium');
    });

    it('new inspection status defaults to scheduled', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/schedule', {
        ...baseInspection,
        title: `${TAG} status-default`,
      });
      expect(body.data.status).toBe('scheduled');
    });

    it('returns 400 if title is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/schedule', {
        ...baseInspection,
        title: '',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 if scheduledDate is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/schedule', {
        ...baseInspection,
        title: `${TAG} no-date`,
        scheduledDate: '',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid inspectionType', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/schedule', {
        ...baseInspection,
        title: `${TAG} bad-type`,
        inspectionType: 'invalid-type',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('creates an inspection with checklist serialized as completed:false items', async () => {
      const { body: createBody } = await req(app, 'POST', '/api/inspections/schedule', {
        ...baseInspection,
        title: `${TAG} checklist-test`,
        checklist: ['Item A', 'Item B'],
      });
      const id = createBody.data.id;
      const { body } = await req(app, 'GET', `/api/inspections/${id}`);
      expect(Array.isArray(body.data.checklist)).toBe(true);
      expect(body.data.checklist).toHaveLength(2);
      expect(body.data.checklist[0].item).toBe('Item A');
      expect(body.data.checklist[0].completed).toBe(false);
    });
  });

  // ── GET /api/inspections/schedule ────────────────────────────────────

  describe('GET /api/inspections/schedule', () => {
    let seededId: number;

    beforeAll(async () => {
      const { body } = await req(app, 'POST', '/api/inspections/schedule', {
        ...baseInspection,
        title: `${TAG} list-seed`,
        inspectionType: 'epa',
        priority: 'high',
        zone: `${TAG}-zone`,
      });
      seededId = body.data.id;
    });

    it('returns 200 with an array', async () => {
      const { status, body } = await req(app, 'GET', '/api/inspections/schedule');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('includes count field matching data length', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/schedule');
      expect(body.count).toBe(body.data.length);
    });

    it('each record has required fields', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/schedule');
      for (const item of body.data) {
        expect(typeof item.id).toBe('number');
        expect(typeof item.title).toBe('string');
        expect(typeof item.status).toBe('string');
        expect(typeof item.priority).toBe('string');
        expect(typeof item.scheduledDate).toBe('string');
      }
    });

    it('filter by status=scheduled returns only scheduled rows', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/schedule?status=scheduled');
      expect(body.success).toBe(true);
      for (const row of body.data) {
        expect(row.status).toBe('scheduled');
      }
    });

    it('filter by type=epa includes the seeded epa inspection', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/schedule?type=epa');
      expect(body.success).toBe(true);
      const found = body.data.find((r: any) => r.id === seededId);
      expect(found).toBeDefined();
      expect(found.inspectionType).toBe('epa');
    });

    it('filter by priority=high includes the seeded high priority inspection', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/schedule?priority=high');
      const found = body.data.find((r: any) => r.id === seededId);
      expect(found).toBeDefined();
    });

    it('filter by zone returns only matching zone rows', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/schedule?zone=${TAG}-zone`);
      expect(body.success).toBe(true);
      for (const row of body.data) {
        expect(row.zone).toBe(`${TAG}-zone`);
      }
    });
  });

  // ── GET /api/inspections/:id ──────────────────────────────────────────

  describe('GET /api/inspections/:id', () => {
    let detailId: number;

    beforeAll(async () => {
      const { body } = await req(app, 'POST', '/api/inspections/schedule', {
        ...baseInspection,
        title: `${TAG} detail-get`,
        inspectionType: 'safety-audit',
        zone: 'Zone-Detail',
      });
      detailId = body.data.id;
    });

    it('returns 200 with full detail for existing id', async () => {
      const { status, body } = await req(app, 'GET', `/api/inspections/${detailId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returned inspection matches seeded values', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/${detailId}`);
      expect(body.data.id).toBe(detailId);
      expect(body.data.title).toBe(`${TAG} detail-get`);
      expect(body.data.inspectionType).toBe('safety-audit');
      expect(body.data.zone).toBe('Zone-Detail');
    });

    it('has checklist and findings as arrays', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/${detailId}`);
      expect(Array.isArray(body.data.checklist)).toBe(true);
      expect(Array.isArray(body.data.findings)).toBe(true);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'GET', '/api/inspections/9999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for non-numeric id', async () => {
      const { status, body } = await req(app, 'GET', '/api/inspections/not-a-number');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── PUT /api/inspections/:id ──────────────────────────────────────────

  describe('PUT /api/inspections/:id', () => {
    let updateId: number;

    beforeAll(async () => {
      const { body } = await req(app, 'POST', '/api/inspections/schedule', {
        ...baseInspection,
        title: `${TAG} update-target`,
      });
      updateId = body.data.id;
    });

    it('returns 200 and updates status', async () => {
      const { status, body } = await req(app, 'PUT', `/api/inspections/${updateId}`, {
        status: 'in_progress',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('in_progress');
    });

    it('persists status change when fetched by id', async () => {
      await req(app, 'PUT', `/api/inspections/${updateId}`, { status: 'in_progress' });
      const { body } = await req(app, 'GET', `/api/inspections/${updateId}`);
      expect(body.data.status).toBe('in_progress');
    });

    it('returns 200 when updating assignedTo', async () => {
      const { status, body } = await req(app, 'PUT', `/api/inspections/${updateId}`, {
        assignedTo: 'Updated Inspector',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 400 for invalid status value', async () => {
      const { status, body } = await req(app, 'PUT', `/api/inspections/${updateId}`, {
        status: 'invalid-status',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for non-numeric id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/inspections/abc', { status: 'scheduled' });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/inspections/9999998', {
        status: 'cancelled',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── POST /api/inspections/:id/complete ───────────────────────────────

  describe('POST /api/inspections/:id/complete', () => {
    let completeId: number;

    beforeAll(async () => {
      const { body } = await req(app, 'POST', '/api/inspections/schedule', {
        ...baseInspection,
        title: `${TAG} complete-target`,
        recurrence: 'weekly',
      });
      completeId = body.data.id;
    });

    it('returns 200 and marks inspection as completed with pass result', async () => {
      const { status, body } = await req(app, 'POST', `/api/inspections/${completeId}/complete`, {
        completedDate: '2026-04-01',
        completedTime: '11:30',
        result: 'pass',
        checklist: [
          { item: 'Check drainage', completed: true },
          { item: 'Inspect barriers', completed: true },
        ],
        findings: [],
        notes: 'All items passed.',
        nextScheduledDate: '2026-04-08',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.result).toBe('pass');
      expect(body.data.status).toBe('completed');
    });

    it('persists completed status when fetched by id', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/${completeId}`);
      expect(body.data.status).toBe('completed');
      expect(body.data.result).toBe('pass');
    });

    it('nextScheduledDate is stored correctly', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/${completeId}`);
      expect(body.data.nextScheduledDate).toBe('2026-04-08');
    });

    it('complete with fail result stores findings', async () => {
      const { body: createBody } = await req(app, 'POST', '/api/inspections/schedule', {
        ...baseInspection,
        title: `${TAG} complete-fail`,
      });
      const { status, body } = await req(app, 'POST', `/api/inspections/${createBody.data.id}/complete`, {
        completedDate: '2026-04-01',
        result: 'fail',
        findings: ['Drainage blocked', 'Missing signage'],
      });
      expect(status).toBe(200);
      expect(body.data.result).toBe('fail');
      const detail = await req(app, 'GET', `/api/inspections/${createBody.data.id}`);
      expect(detail.body.data.findings).toContain('Drainage blocked');
    });

    it('returns 400 when completedDate is missing', async () => {
      const { body: createBody } = await req(app, 'POST', '/api/inspections/schedule', {
        ...baseInspection,
        title: `${TAG} complete-nodate`,
      });
      const { status, body } = await req(app, 'POST', `/api/inspections/${createBody.data.id}/complete`, {
        result: 'pass',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid result value', async () => {
      const { body: createBody } = await req(app, 'POST', '/api/inspections/schedule', {
        ...baseInspection,
        title: `${TAG} complete-badresult`,
      });
      const { status } = await req(app, 'POST', `/api/inspections/${createBody.data.id}/complete`, {
        completedDate: '2026-04-01',
        result: 'unknown',
      });
      expect(status).toBe(400);
    });

    it('returns 404 for non-existent inspection id', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/9999997/complete', {
        completedDate: '2026-04-01',
        result: 'pass',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('calcNextDate auto-computes nextScheduledDate for weekly recurrence when not provided', async () => {
      const { body: createBody } = await req(app, 'POST', '/api/inspections/schedule', {
        ...baseInspection,
        title: `${TAG} complete-autonext`,
        scheduledDate: '2026-04-01',
        recurrence: 'weekly',
      });
      await req(app, 'POST', `/api/inspections/${createBody.data.id}/complete`, {
        completedDate: '2026-04-01',
        result: 'partial',
      });
      const { body } = await req(app, 'GET', `/api/inspections/${createBody.data.id}`);
      expect(body.data.nextScheduledDate).toBe('2026-04-08');
    });
  });

  // ── POST /api/inspections/sensors ────────────────────────────────────

  describe('POST /api/inspections/sensors', () => {
    it('creates a sensor and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/sensors', baseSensor('S001'));
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('response data has id, sensorId, name, sensorType, status', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/sensors', baseSensor('S002'));
      expect(typeof body.data.id).toBe('number');
      expect(body.data.sensorId).toBe(`${TAG}-S002`);
      expect(typeof body.data.name).toBe('string');
      expect(typeof body.data.sensorType).toBe('string');
      expect(typeof body.data.status).toBe('string');
    });

    it('new sensor status defaults to normal', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/sensors', baseSensor('S003'));
      expect(body.data.status).toBe('normal');
    });

    it('returns 409 when sensor_id already exists', async () => {
      await req(app, 'POST', '/api/inspections/sensors', baseSensor('S004'));
      const { status, body } = await req(app, 'POST', '/api/inspections/sensors', baseSensor('S004'));
      expect(status).toBe(409);
      expect(body.success).toBe(false);
    });

    it('returns 400 when sensorId is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/sensors', {
        ...baseSensor('S005'),
        sensorId: '',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when sensorType is invalid', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/sensors', {
        ...baseSensor('S006'),
        sensorId: `${TAG}-S006`,
        sensorType: 'pressure',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when location is missing', async () => {
      const { status } = await req(app, 'POST', '/api/inspections/sensors', {
        ...baseSensor('S007'),
        sensorId: `${TAG}-S007`,
        location: '',
      });
      expect(status).toBe(400);
    });
  });

  // ── GET /api/inspections/sensors ─────────────────────────────────────

  describe('GET /api/inspections/sensors', () => {
    beforeAll(async () => {
      await req(app, 'POST', '/api/inspections/sensors', {
        ...baseSensor('S010'),
        zone: `${TAG}-zone2`,
      });
    });

    it('returns 200 with an array', async () => {
      const { status, body } = await req(app, 'GET', '/api/inspections/sensors');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('includes count field matching data length', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/sensors');
      expect(body.count).toBe(body.data.length);
    });

    it('each sensor record has required fields', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/sensors');
      for (const sensor of body.data) {
        expect(typeof sensor.id).toBe('number');
        expect(typeof sensor.sensorId).toBe('string');
        expect(typeof sensor.name).toBe('string');
        expect(typeof sensor.sensorType).toBe('string');
        expect(typeof sensor.status).toBe('string');
      }
    });

    it('filter by status=normal returns only normal sensors', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/sensors?status=normal');
      expect(body.success).toBe(true);
      for (const sensor of body.data) {
        expect(sensor.status).toBe('normal');
      }
    });

    it('filter by type=temperature returns only temperature sensors', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/sensors?type=temperature');
      expect(body.success).toBe(true);
      for (const sensor of body.data) {
        expect(sensor.sensorType).toBe('temperature');
      }
    });

    it('filter by zone returns only matching zone sensors', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors?zone=${TAG}-zone2`);
      expect(body.success).toBe(true);
      for (const sensor of body.data) {
        expect(sensor.zone).toBe(`${TAG}-zone2`);
      }
    });
  });

  // ── GET /api/inspections/sensors/:sensorId ───────────────────────────

  describe('GET /api/inspections/sensors/:sensorId', () => {
    beforeAll(async () => {
      await req(app, 'POST', '/api/inspections/sensors', baseSensor('S020'));
    });

    it('returns 200 with full detail for existing sensorId', async () => {
      const { status, body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S020`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returned sensor matches seeded values', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S020`);
      expect(body.data.sensorId).toBe(`${TAG}-S020`);
      expect(body.data.sensorType).toBe('temperature');
      expect(body.data.location).toBe('Plant Room A');
      expect(body.data.minThreshold).toBe(15);
      expect(body.data.maxThreshold).toBe(35);
    });

    it('lastReading is null when no readings have been recorded', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S020`);
      expect(body.data.lastReading).toBeNull();
    });

    it('lastCalibration is null when no calibrations have been recorded', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S020`);
      expect(body.data.lastCalibration).toBeNull();
    });

    it('returns 404 for non-existent sensorId', async () => {
      const { status, body } = await req(app, 'GET', '/api/inspections/sensors/NONEXISTENT-9999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── PUT /api/inspections/sensors/:sensorId ───────────────────────────

  describe('PUT /api/inspections/sensors/:sensorId', () => {
    beforeAll(async () => {
      await req(app, 'POST', '/api/inspections/sensors', baseSensor('S030'));
    });

    it('returns 200 and updates sensor status', async () => {
      const { status, body } = await req(app, 'PUT', `/api/inspections/sensors/${TAG}-S030`, {
        status: 'warning',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('warning');
    });

    it('persists status change when fetched by sensorId', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S030`);
      expect(body.data.status).toBe('warning');
    });

    it('returns 200 when updating location', async () => {
      const { status, body } = await req(app, 'PUT', `/api/inspections/sensors/${TAG}-S030`, {
        location: 'Updated Location',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 400 for invalid status value', async () => {
      const { status, body } = await req(app, 'PUT', `/api/inspections/sensors/${TAG}-S030`, {
        status: 'not-a-status',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 404 for non-existent sensorId', async () => {
      const { status, body } = await req(app, 'PUT', '/api/inspections/sensors/NONEXISTENT-9998', {
        status: 'offline',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── POST /api/inspections/readings ───────────────────────────────────

  describe('POST /api/inspections/readings', () => {
    beforeAll(async () => {
      await req(app, 'POST', '/api/inspections/sensors', baseSensor('S040'));
    });

    it('returns 201 when recording a normal reading', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: `${TAG}-S040`,
        value: 25,
        unit: '°C',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('response data has id, sensorId, value, status, recordedAt', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: `${TAG}-S040`,
        value: 22,
      });
      expect(typeof body.data.id).toBe('number');
      expect(body.data.sensorId).toBe(`${TAG}-S040`);
      expect(body.data.value).toBe(22);
      expect(typeof body.data.status).toBe('string');
      expect(body.data.recordedAt).toBeDefined();
    });

    it('value within threshold range returns normal status', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: `${TAG}-S040`,
        value: 25,
      });
      expect(body.data.status).toBe('normal');
    });

    it('value above maxThreshold returns critical status', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: `${TAG}-S040`,
        value: 50,
      });
      expect(body.data.status).toBe('critical');
    });

    it('value below minThreshold returns critical status', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: `${TAG}-S040`,
        value: 5,
      });
      expect(body.data.status).toBe('critical');
    });

    it('anomalyDetected is false for normal reading', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: `${TAG}-S040`,
        value: 25,
      });
      expect(body.data.anomalyDetected).toBe(false);
    });

    it('anomalyDetected is true for out-of-range reading', async () => {
      const { body } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: `${TAG}-S040`,
        value: 100,
      });
      expect(body.data.anomalyDetected).toBe(true);
    });

    it('sensor status is updated after out-of-range reading', async () => {
      await req(app, 'POST', '/api/inspections/sensors', baseSensor('S041'));
      await req(app, 'POST', '/api/inspections/readings', {
        sensorId: `${TAG}-S041`,
        value: 99,
      });
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S041`);
      expect(body.data.status).toBe('critical');
    });

    it('lastReading is populated after recording a reading', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S040`);
      expect(body.data.lastReading).not.toBeNull();
      expect(typeof body.data.lastReading.value).toBe('number');
    });

    it('returns 404 for non-existent sensorId', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: 'NONEXISTENT-9997',
        value: 25,
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 when value is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/readings', {
        sensorId: `${TAG}-S040`,
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when sensorId is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/inspections/readings', {
        value: 25,
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/inspections/readings ────────────────────────────────────

  describe('GET /api/inspections/readings', () => {
    beforeAll(async () => {
      await req(app, 'POST', '/api/inspections/sensors', baseSensor('S050'));
      await req(app, 'POST', '/api/inspections/readings', { sensorId: `${TAG}-S050`, value: 20 });
      await req(app, 'POST', '/api/inspections/readings', { sensorId: `${TAG}-S050`, value: 80 });
    });

    it('returns 200 with an array', async () => {
      const { status, body } = await req(app, 'GET', '/api/inspections/readings');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('includes count field matching data length', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/readings');
      expect(body.count).toBe(body.data.length);
    });

    it('filter by sensorId returns only readings for that sensor', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/readings?sensorId=${TAG}-S050`);
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(2);
      for (const reading of body.data) {
        expect(reading.sensorId).toBe(`${TAG}-S050`);
      }
    });

    it('filter anomaly=true returns only anomalous readings', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/readings?sensorId=${TAG}-S050&anomaly=true`);
      expect(body.success).toBe(true);
      for (const reading of body.data) {
        expect(reading.anomalyDetected).toBe(true);
      }
    });

    it('limit parameter restricts the number of results', async () => {
      const { body } = await req(app, 'GET', '/api/inspections/readings?limit=1');
      expect(body.data.length).toBeLessThanOrEqual(1);
    });

    it('each reading has required fields', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/readings?sensorId=${TAG}-S050`);
      for (const reading of body.data) {
        expect(typeof reading.id).toBe('number');
        expect(typeof reading.sensorId).toBe('string');
        expect(typeof reading.value).toBe('number');
        expect(typeof reading.status).toBe('string');
        expect(typeof reading.anomalyDetected).toBe('boolean');
      }
    });
  });

  // ── POST /api/inspections/sensors/:sensorId/calibrate ────────────────

  describe('POST /api/inspections/sensors/:sensorId/calibrate', () => {
    beforeAll(async () => {
      await req(app, 'POST', '/api/inspections/sensors', baseSensor('S060'));
    });

    it('returns 201 when recording a calibration', async () => {
      const { status, body } = await req(
        app, 'POST', `/api/inspections/sensors/${TAG}-S060/calibrate`, {
          calibrationDate: '2026-03-01',
          calibratedBy: 'Test Engineer',
          passedCalibration: true,
          nextCalibrationDue: '2027-03-01',
          certificateId: `CERT-${TAG}`,
        }
      );
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('response data has id, sensorId, calibrationDate, calibratedBy, passedCalibration', async () => {
      const { body } = await req(
        app, 'POST', `/api/inspections/sensors/${TAG}-S060/calibrate`, {
          calibrationDate: '2026-03-10',
          calibratedBy: 'QA Specialist',
          passedCalibration: true,
          nextCalibrationDue: '2027-03-10',
        }
      );
      expect(typeof body.data.id).toBe('number');
      expect(body.data.sensorId).toBe(`${TAG}-S060`);
      expect(body.data.calibrationDate).toBe('2026-03-10');
      expect(body.data.calibratedBy).toBe('QA Specialist');
      expect(body.data.passedCalibration).toBe(true);
      expect(body.data.nextCalibrationDue).toBe('2027-03-10');
    });

    it('passing calibration updates sensor status to normal', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S060`);
      expect(body.data.status).toBe('normal');
    });

    it('failed calibration updates sensor status to maintenance', async () => {
      await req(app, 'POST', '/api/inspections/sensors', baseSensor('S061'));
      await req(app, 'POST', `/api/inspections/sensors/${TAG}-S061/calibrate`, {
        calibrationDate: '2026-03-01',
        calibratedBy: 'Test Engineer',
        passedCalibration: false,
      });
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S061`);
      expect(body.data.status).toBe('maintenance');
    });

    it('updates lastCalibrated on the sensor', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S060`);
      expect(body.data.lastCalibrated).toBeDefined();
      expect(body.data.lastCalibrated).not.toBeNull();
    });

    it('lastCalibration is populated in sensor detail after calibration', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S060`);
      expect(body.data.lastCalibration).not.toBeNull();
      expect(typeof body.data.lastCalibration.calibratedBy).toBe('string');
      expect(body.data.lastCalibration.calibratedBy.length).toBeGreaterThan(0);
    });

    it('returns 400 when calibrationDate is missing', async () => {
      const { status, body } = await req(
        app, 'POST', `/api/inspections/sensors/${TAG}-S060/calibrate`, {
          calibratedBy: 'Test Engineer',
          passedCalibration: true,
        }
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when calibratedBy is missing', async () => {
      const { status, body } = await req(
        app, 'POST', `/api/inspections/sensors/${TAG}-S060/calibrate`, {
          calibrationDate: '2026-03-01',
          passedCalibration: true,
        }
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 404 for non-existent sensorId', async () => {
      const { status, body } = await req(
        app, 'POST', '/api/inspections/sensors/NONEXISTENT-9996/calibrate', {
          calibrationDate: '2026-03-01',
          calibratedBy: 'Engineer',
          passedCalibration: true,
        }
      );
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/inspections/sensors/:sensorId/calibrations ──────────────

  describe('GET /api/inspections/sensors/:sensorId/calibrations', () => {
    beforeAll(async () => {
      await req(app, 'POST', '/api/inspections/sensors', baseSensor('S070'));
      await req(app, 'POST', `/api/inspections/sensors/${TAG}-S070/calibrate`, {
        calibrationDate: '2026-01-01',
        calibratedBy: 'Engineer A',
        passedCalibration: true,
        nextCalibrationDue: '2027-01-01',
      });
      await req(app, 'POST', `/api/inspections/sensors/${TAG}-S070/calibrate`, {
        calibrationDate: '2026-02-01',
        calibratedBy: 'Engineer B',
        passedCalibration: false,
      });
    });

    it('returns 200 with an array of calibration records', async () => {
      const { status, body } = await req(
        app, 'GET', `/api/inspections/sensors/${TAG}-S070/calibrations`
      );
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('includes count field matching data length', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S070/calibrations`);
      expect(body.count).toBe(body.data.length);
    });

    it('returns both seeded calibration records', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S070/calibrations`);
      expect(body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('each calibration record has required fields', async () => {
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S070/calibrations`);
      for (const cal of body.data) {
        expect(typeof cal.id).toBe('number');
        expect(typeof cal.calibrationDate).toBe('string');
        expect(typeof cal.calibratedBy).toBe('string');
        expect(typeof cal.passedCalibration).toBe('boolean');
      }
    });

    it('returns empty array for sensor with no calibrations', async () => {
      await req(app, 'POST', '/api/inspections/sensors', baseSensor('S071'));
      const { body } = await req(app, 'GET', `/api/inspections/sensors/${TAG}-S071/calibrations`);
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(0);
    });
  });
});
