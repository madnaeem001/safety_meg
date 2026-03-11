/**
 * Incident Heatmap Routes Test Suite
 *
 * Covers:
 *   GET    /api/heatmap/stats              — aggregate KPIs
 *   GET    /api/heatmap/incidents          — list + filter (timeRange, type, severity, department, search, limit)
 *   GET    /api/heatmap/incidents/:id      — single, 404 on missing
 *   POST   /api/heatmap/incidents          — create, validation, duplicate id
 *   PUT    /api/heatmap/incidents/:id      — partial update, 404, no-op on empty body
 *   DELETE /api/heatmap/incidents/:id      — delete, 404 on missing
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { heatmapRoutes } from '../routes/heatmap';

// ── App factory ───────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  heatmapRoutes(app);
  return app;
}

// ── Request helper ────────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── DB seed / cleanup ─────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `testheatmap-${Date.now()}`;

const SEED_ID = `${TAG}-INC-001`;
const SEED_ID_2 = `${TAG}-INC-002`;

beforeAll(() => {
  const ts = Date.now();

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS heatmap_incidents (
      id            TEXT    PRIMARY KEY,
      title         TEXT    NOT NULL,
      type          TEXT    NOT NULL DEFAULT 'near-miss'
                            CHECK(type IN ('injury','near-miss','property-damage','environmental','fire','vehicle')),
      severity      TEXT    NOT NULL DEFAULT 'low'
                            CHECK(severity IN ('low','medium','high','critical')),
      date          TEXT    NOT NULL,
      location      TEXT    NOT NULL,
      department    TEXT    NOT NULL,
      coord_x       REAL    NOT NULL DEFAULT 0,
      coord_y       REAL    NOT NULL DEFAULT 0,
      description   TEXT    NOT NULL DEFAULT '',
      status        TEXT    NOT NULL DEFAULT 'open'
                            CHECK(status IN ('open','investigating','closed')),
      reported_by   TEXT,
      is_new        INTEGER NOT NULL DEFAULT 0,
      timestamp     TEXT,
      created_at    INTEGER,
      updated_at    INTEGER
    );
  `);

  sqlite.prepare(`
    INSERT OR IGNORE INTO heatmap_incidents
      (id,title,type,severity,date,location,department,coord_x,coord_y,description,status,reported_by,is_new,timestamp,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?)
  `).run(
    SEED_ID, `${TAG} Forklift Near Miss`, 'near-miss', 'high',
    '2026-02-05', `${TAG} Warehouse A`, `${TAG} Logistics`,
    15.0, 25.0, 'Forklift nearly struck pedestrian',
    'investigating', 'Mike Johnson', '2026-02-05T07:00:00Z', ts, ts
  );

  sqlite.prepare(`
    INSERT OR IGNORE INTO heatmap_incidents
      (id,title,type,severity,date,location,department,coord_x,coord_y,description,status,reported_by,is_new,timestamp,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?)
  `).run(
    SEED_ID_2, `${TAG} Chemical Spill`, 'environmental', 'critical',
    '2026-02-04', `${TAG} Laboratory`, `${TAG} R&D`,
    75.0, 20.0, 'Solvent container tipped during transport',
    'open', 'Dr. Rachel Kim', '2026-02-04T13:00:00Z', ts, ts
  );
});

afterAll(() => {
  sqlite.prepare(`DELETE FROM heatmap_incidents WHERE id LIKE '${TAG}%'`).run();
  sqlite.close();
});

// ── Stats ─────────────────────────────────────────────────────────────────────

describe('GET /api/heatmap/stats', () => {
  it('returns success with all required stat fields', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/heatmap/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      total:    expect.any(Number),
      critical: expect.any(Number),
      open:     expect.any(Number),
      newToday: expect.any(Number),
    });
  });

  it('total is at least 15 (seeded initial data)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/heatmap/stats');
    expect(body.data.total).toBeGreaterThanOrEqual(15);
  });

  it('critical count is non-negative integer', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/heatmap/stats');
    expect(body.data.critical).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(body.data.critical)).toBe(true);
  });

  it('open count is non-negative integer', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/heatmap/stats');
    expect(body.data.open).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(body.data.open)).toBe(true);
  });

  it('newToday is non-negative integer', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/heatmap/stats');
    expect(body.data.newToday).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(body.data.newToday)).toBe(true);
  });
});

// ── List ──────────────────────────────────────────────────────────────────────

describe('GET /api/heatmap/incidents', () => {
  it('returns success with array and total', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/heatmap/incidents');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(typeof body.total).toBe('number');
  });

  it('returns at least 15 incidents (seeded)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/heatmap/incidents');
    expect(body.data.length).toBeGreaterThanOrEqual(15);
  });

  it('each incident has coordinates object with x and y', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/heatmap/incidents');
    const seedIncident = body.data.find((i: any) => i.id === SEED_ID);
    expect(seedIncident).toBeDefined();
    expect(seedIncident.coordinates).toEqual({ x: 15, y: 25 });
  });

  it('filters by type', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/heatmap/incidents?type=near-miss');
    expect(body.success).toBe(true);
    const seedItem = body.data.find((i: any) => i.id === SEED_ID);
    expect(seedItem).toBeDefined();
    expect(seedItem.type).toBe('near-miss');
  });

  it('filters by severity', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/heatmap/incidents?severity=critical');
    expect(body.success).toBe(true);
    body.data.forEach((i: any) => expect(i.severity).toBe('critical'));
  });

  it('filters by department using TAG', async () => {
    const app = createTestApp();
    const dept = encodeURIComponent(`${TAG} Logistics`);
    const { body } = await req(app, 'GET', `/api/heatmap/incidents?department=${dept}`);
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(1);
    expect(body.data[0].id).toBe(SEED_ID);
  });

  it('filters by search (title keyword)', async () => {
    const app = createTestApp();
    const search = encodeURIComponent('Forklift Near Miss');
    const { body } = await req(app, 'GET', `/api/heatmap/incidents?search=${search}`);
    expect(body.success).toBe(true);
    const found = body.data.find((i: any) => i.id === SEED_ID);
    expect(found).toBeDefined();
  });

  it('respects limit parameter', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/heatmap/incidents?limit=3');
    expect(body.success).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(3);
  });

  it('filters by timeRange=7d (seed incident is within range)', async () => {
    const app = createTestApp();
    // Insert a fresh incident with today's date
    const todayId = `${TAG}-today`;
    const today = new Date().toISOString().split('T')[0];
    const ts = Date.now();
    sqlite.prepare(`
      INSERT OR IGNORE INTO heatmap_incidents
        (id,title,type,severity,date,location,department,coord_x,coord_y,description,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(todayId, `${TAG} Today Incident`, 'injury', 'low', today, 'Zone X', `${TAG} Dept`, 10, 10, 'desc', 'open', ts, ts);

    const { body } = await req(app, 'GET', '/api/heatmap/incidents?timeRange=7d');
    const found = body.data.find((i: any) => i.id === todayId);
    expect(found).toBeDefined();

    sqlite.prepare(`DELETE FROM heatmap_incidents WHERE id = ?`).run(todayId);
  });
});

// ── Get Single ────────────────────────────────────────────────────────────────

describe('GET /api/heatmap/incidents/:id', () => {
  it('returns seeded incident by id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', `/api/heatmap/incidents/${SEED_ID}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(SEED_ID);
    expect(body.data.title).toContain('Forklift Near Miss');
    expect(body.data.coordinates).toEqual({ x: 15, y: 25 });
  });

  it('returns 404 for non-existent id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/heatmap/incidents/DOES-NOT-EXIST-99');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('maps isNew boolean correctly (seeded as false)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/heatmap/incidents/${SEED_ID}`);
    expect(typeof body.data.isNew).toBe('boolean');
    expect(body.data.isNew).toBe(false);
  });
});

// ── Create ────────────────────────────────────────────────────────────────────

describe('POST /api/heatmap/incidents', () => {
  const newId = `${TAG}-CREATE`;

  afterAll(() => {
    sqlite.prepare(`DELETE FROM heatmap_incidents WHERE id = ?`).run(newId);
  });

  it('creates a new incident and returns 201', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/heatmap/incidents', {
      id: newId,
      title: `${TAG} Slip and Fall`,
      type: 'injury',
      severity: 'medium',
      date: '2026-02-06',
      location: `${TAG} Loading Dock`,
      department: `${TAG} Logistics`,
      coordX: 12.5,
      coordY: 30.0,
      description: 'Employee slipped on wet floor',
      status: 'open',
      reportedBy: 'Sarah Chen',
      isNew: true,
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(newId);
    expect(body.data.coordinates).toEqual({ x: 12.5, y: 30 });
    expect(body.data.isNew).toBe(true);
  });

  it('returns 409 when creating incident with duplicate id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/heatmap/incidents', {
      id: newId,
      title: 'Duplicate',
      type: 'injury',
      severity: 'low',
      date: '2026-02-06',
      location: 'Somewhere',
      department: 'Some Dept',
      coordX: 0,
      coordY: 0,
    });
    expect(status).toBe(409);
    expect(body.success).toBe(false);
  });

  it('returns 400 when title is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/heatmap/incidents', {
      id: `${TAG}-NOTITLE`,
      type: 'injury',
      severity: 'high',
      date: '2026-02-06',
      location: 'Zone A',
      department: 'EHS',
      coordX: 10,
      coordY: 10,
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(typeof body.error).toBe('string');
  });

  it('returns 400 for invalid type enum', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/heatmap/incidents', {
      id: `${TAG}-BADTYPE`,
      title: 'Bad Type',
      type: 'explosion',
      severity: 'high',
      date: '2026-02-06',
      location: 'Zone A',
      department: 'EHS',
      coordX: 10,
      coordY: 10,
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid severity enum', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/heatmap/incidents', {
      id: `${TAG}-BADSEV`,
      title: 'Bad Severity',
      type: 'injury',
      severity: 'catastrophic',
      date: '2026-02-06',
      location: 'Zone A',
      department: 'EHS',
      coordX: 10,
      coordY: 10,
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ── Update ────────────────────────────────────────────────────────────────────

describe('PUT /api/heatmap/incidents/:id', () => {
  it('updates status to investigating', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/heatmap/incidents/${SEED_ID}`, {
      status: 'investigating',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('investigating');
  });

  it('updates multiple fields at once', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'PUT', `/api/heatmap/incidents/${SEED_ID}`, {
      title: `${TAG} Updated Title`,
      severity: 'critical',
    });
    expect(body.success).toBe(true);
    expect(body.data.title).toBe(`${TAG} Updated Title`);
    expect(body.data.severity).toBe('critical');
  });

  it('returns 404 for non-existent id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/heatmap/incidents/DOES-NOT-EXIST-99', {
      status: 'closed',
    });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('no-op when body is empty object returns 200 with unchanged data', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/heatmap/incidents/${SEED_ID}`, {});
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(SEED_ID);
  });

  it('updates coordinates via coordX and coordY', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'PUT', `/api/heatmap/incidents/${SEED_ID}`, {
      coordX: 50.5,
      coordY: 60.5,
    });
    expect(body.success).toBe(true);
    expect(body.data.coordinates).toEqual({ x: 50.5, y: 60.5 });
  });
});

// ── Delete ────────────────────────────────────────────────────────────────────

describe('DELETE /api/heatmap/incidents/:id', () => {
  const deleteId = `${TAG}-DELETE`;

  beforeAll(() => {
    const ts = Date.now();
    sqlite.prepare(`
      INSERT OR IGNORE INTO heatmap_incidents
        (id,title,type,severity,date,location,department,coord_x,coord_y,description,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(deleteId, `${TAG} Deletable`, 'fire', 'low', '2026-01-01', 'Zone D', 'Maintenance', 5, 5, 'test', 'closed', ts, ts);
  });

  it('deletes an existing incident and returns success message', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', `/api/heatmap/incidents/${deleteId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.message).toBe('string');
  });

  it('returns 404 after incident is deleted', async () => {
    const app = createTestApp();
    const { status } = await req(app, 'GET', `/api/heatmap/incidents/${deleteId}`);
    expect(status).toBe(404);
  });

  it('returns 404 when deleting already-deleted incident', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', `/api/heatmap/incidents/${deleteId}`);
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});
