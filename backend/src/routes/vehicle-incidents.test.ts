/**
 * Vehicle Incident Report Routes — Test Suite
 *
 * Covers:
 *   POST /api/vehicle-incidents         — create, validation
 *   GET  /api/vehicle-incidents         — list, filter
 *   GET  /api/vehicle-incidents/stats   — aggregated stats
 *   GET  /api/vehicle-incidents/:id     — fetch, 404
 *   PUT  /api/vehicle-incidents/:id     — update, validation, 404
 *   DELETE /api/vehicle-incidents/:id  — delete, 404
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { vehicleIncidentsRoutes } from '../routes/vehicle-incidents';

// ── App factory ───────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  vehicleIncidentsRoutes(app);
  return app;
}

// ── Request helper ────────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }
  init.headers = headers;
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── Minimal valid payload ─────────────────────────────────────────────────────

const VALID_PAYLOAD = {
  incidentDate: '2025-03-15',
  incidentTime: '14:30',
  location: 'Highway 101, Exit 45',
  incidentType: 'Collision',
  damageSeverity: 'Moderate ($500 - $5,000)',
  driverName: 'John Smith',
  employeeId: 'EMP-001',
  vehicleType: 'Company Vehicle',
  vehicleId: 'FLT-042',
  vehicleMake: 'Ford',
  vehicleModel: 'F-150',
  vehicleYear: '2022',
  licensePlate: 'ABC-1234',
  roadCondition: 'Wet',
  lighting: 'Daylight',
  description: 'Vehicle collided with another car at an intersection.',
  policeReport: true,
  policeReportNumber: 'PD-2025-001',
  dotRecordable: false,
  injuries: false,
};

// ── Cleanup helpers ───────────────────────────────────────────────────────────

const createdIds: number[] = [];

afterAll(() => {
  if (createdIds.length === 0) return;
  const db = new Database('local.sqlite');
  try {
    const placeholders = createdIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM vehicle_incident_reports WHERE id IN (${placeholders})`).run(...createdIds);
  } finally {
    db.close();
  }
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/vehicle-incidents', () => {
  it('creates a report with all required fields', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/vehicle-incidents', VALID_PAYLOAD);

    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeTypeOf('number');
    expect(body.data.reportNumber).toMatch(/^VEH-\d{5}$/);
    expect(body.data.status).toBe('submitted');
    expect(body.data.driverName).toBe('John Smith');
    expect(body.data.location).toBe('Highway 101, Exit 45');
    expect(body.data.description).toBe('Vehicle collided with another car at an intersection.');
    expect(body.data.policeReport).toBe(true);
    expect(body.data.dotRecordable).toBe(false);
    createdIds.push(body.data.id);
  });

  it('returns 400 when incidentDate is missing', async () => {
    const app = createTestApp();
    const { incidentDate, ...rest } = VALID_PAYLOAD;
    const { status, body } = await req(app, 'POST', '/api/vehicle-incidents', rest);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBeTruthy();
  });

  it('returns 400 when location is missing', async () => {
    const app = createTestApp();
    const { location, ...rest } = VALID_PAYLOAD;
    const { status, body } = await req(app, 'POST', '/api/vehicle-incidents', rest);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when driverName is missing', async () => {
    const app = createTestApp();
    const { driverName, ...rest } = VALID_PAYLOAD;
    const { status, body } = await req(app, 'POST', '/api/vehicle-incidents', rest);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when description is missing', async () => {
    const app = createTestApp();
    const { description, ...rest } = VALID_PAYLOAD;
    const { status, body } = await req(app, 'POST', '/api/vehicle-incidents', rest);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('stores boolean flags correctly', async () => {
    const app = createTestApp();
    const payload = { ...VALID_PAYLOAD, dotRecordable: true, injuries: true, injuryDescription: 'Driver cut on hand' };
    const { status, body } = await req(app, 'POST', '/api/vehicle-incidents', payload);

    expect(status).toBe(201);
    expect(body.data.dotRecordable).toBe(true);
    expect(body.data.injuries).toBe(true);
    expect(body.data.injuryDescription).toBe('Driver cut on hand');
    createdIds.push(body.data.id);
  });
});

describe('GET /api/vehicle-incidents', () => {
  let reportId: number;

  beforeAll(async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/vehicle-incidents', {
      ...VALID_PAYLOAD,
      location: 'Test Avenue for GET list',
      incidentType: 'Rollover',
    });
    reportId = body.data.id;
    createdIds.push(reportId);
  });

  it('returns an array of reports', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/vehicle-incidents');

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('returns proper report shape', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/vehicle-incidents');
    const report = body.data.find((r: any) => r.id === reportId);

    expect(report).toBeDefined();
    expect(report.location).toBe('Test Avenue for GET list');
    expect(report.incidentType).toBe('Rollover');
  });

  it('filters by incidentType', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/vehicle-incidents?incidentType=Rollover');

    expect(status).toBe(200);
    const all = body.data as any[];
    expect(all.every((r) => r.incidentType === 'Rollover')).toBe(true);
  });
});

describe('GET /api/vehicle-incidents/stats', () => {
  it('returns stats object with required fields', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/vehicle-incidents/stats');

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('total');
    expect(body.data).toHaveProperty('dotRecordable');
    expect(body.data).toHaveProperty('withInjuries');
    expect(body.data).toHaveProperty('byType');
    expect(body.data).toHaveProperty('bySeverity');
    expect(typeof body.data.total).toBe('number');
  });
});

describe('GET /api/vehicle-incidents/:id', () => {
  let reportId: number;

  beforeAll(async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/vehicle-incidents', {
      ...VALID_PAYLOAD,
      location: 'Location for GET by ID',
    });
    reportId = body.data.id;
    createdIds.push(reportId);
  });

  it('returns the report by id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', `/api/vehicle-incidents/${reportId}`);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(reportId);
    expect(body.data.location).toBe('Location for GET by ID');
  });

  it('returns 404 for non-existent id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/vehicle-incidents/999999991');

    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 400 for non-numeric id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/vehicle-incidents/abc');

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe('PUT /api/vehicle-incidents/:id', () => {
  let reportId: number;

  beforeAll(async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/vehicle-incidents', {
      ...VALID_PAYLOAD,
      location: 'Original Location for PUT',
    });
    reportId = body.data.id;
    createdIds.push(reportId);
  });

  it('updates specified fields', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/vehicle-incidents/${reportId}`, {
      location: 'Updated Location',
      damageSeverity: 'Major ($5,000 - $25,000)',
    });

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.location).toBe('Updated Location');
    expect(body.data.damageSeverity).toBe('Major ($5,000 - $25,000)');
  });

  it('returns 404 for non-existent id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/vehicle-incidents/999999992', {
      location: 'Won\'t be saved',
    });

    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 400 when updating with empty body', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/vehicle-incidents/${reportId}`, {});

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe('DELETE /api/vehicle-incidents/:id', () => {
  it('deletes an existing report', async () => {
    const app = createTestApp();

    // Create a temporary report to delete
    const { body: createBody } = await req(app, 'POST', '/api/vehicle-incidents', {
      ...VALID_PAYLOAD,
      location: 'Temp location for DELETE',
    });
    const tempId = createBody.data.id;

    const { status, body } = await req(app, 'DELETE', `/api/vehicle-incidents/${tempId}`);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(true);

    // Verify it is gone
    const { status: getStatus } = await req(app, 'GET', `/api/vehicle-incidents/${tempId}`);
    expect(getStatus).toBe(404);
  });

  it('returns 404 when deleting non-existent report', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', '/api/vehicle-incidents/999999993');

    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});
