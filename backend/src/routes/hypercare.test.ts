/**
 * Hyper-Care Training Routes Test Suite
 *
 * Covers:
 *   GET    /api/hypercare/stats               — aggregate KPIs
 *   GET    /api/hypercare/demos               — list + filter (status / site / search)
 *   GET    /api/hypercare/demos/:id           — single, 404 on missing
 *   POST   /api/hypercare/demos               — create, validation
 *   PUT    /api/hypercare/demos/:id           — partial update, 404, validation
 *   DELETE /api/hypercare/demos/:id           — delete, 404
 *   GET    /api/hypercare/champions           — list + filter (site / search)
 *   GET    /api/hypercare/champions/:id       — single, 404
 *   POST   /api/hypercare/champions           — create, validation
 *   PUT    /api/hypercare/champions/:id       — partial update, 404, specialties
 *   DELETE /api/hypercare/champions/:id       — delete, 404
 *   GET    /api/hypercare/qr                  — list + filter (status / search)
 *   GET    /api/hypercare/qr/:id              — single, 404
 *   POST   /api/hypercare/qr                  — create, validation
 *   PUT    /api/hypercare/qr/:id              — partial update, 404
 *   DELETE /api/hypercare/qr/:id              — delete, 404
 *   POST   /api/hypercare/qr/:id/scan         — increment scan count
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { hypercareRoutes } from '../routes/hypercare';

// ── App factory ───────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  hypercareRoutes(app);
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
const TAG = `testhypercare-${Date.now()}`;

let seededDemoId: number;
let seededChampionId: number;
let seededQrId: number;

beforeAll(() => {
  const ts = Date.now();

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS hypercare_demos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      duration    TEXT    NOT NULL DEFAULT '5 min',
      audience    TEXT    NOT NULL DEFAULT 'All Workers',
      scheduled   TEXT    NOT NULL,
      site        TEXT    NOT NULL,
      attendees   INTEGER NOT NULL DEFAULT 0,
      status      TEXT    NOT NULL DEFAULT 'scheduled',
      type        TEXT    NOT NULL DEFAULT 'live',
      created_at  INTEGER,
      updated_at  INTEGER
    );
    CREATE TABLE IF NOT EXISTS hypercare_champions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      site         TEXT    NOT NULL,
      role         TEXT    NOT NULL,
      trained      TEXT    NOT NULL,
      peers_helped INTEGER NOT NULL DEFAULT 0,
      rating       REAL    NOT NULL DEFAULT 5.0,
      specialties  TEXT    NOT NULL DEFAULT '[]',
      created_at   INTEGER,
      updated_at   INTEGER
    );
    CREATE TABLE IF NOT EXISTS hypercare_qr_deployments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      location    TEXT    NOT NULL,
      form        TEXT    NOT NULL,
      scans       INTEGER NOT NULL DEFAULT 0,
      last_scan   TEXT    NOT NULL DEFAULT 'never',
      status      TEXT    NOT NULL DEFAULT 'active',
      created_at  INTEGER,
      updated_at  INTEGER
    );
  `);

  const demoResult = sqlite.prepare(`
    INSERT INTO hypercare_demos (title,duration,audience,scheduled,site,attendees,status,type,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(`${TAG} Safety Orientation`, '5 min', 'All Workers', '2026-03-15 07:00', `${TAG}-Site`, 22, 'upcoming', 'live', ts, ts);
  seededDemoId = demoResult.lastInsertRowid as number;

  const champResult = sqlite.prepare(`
    INSERT INTO hypercare_champions (name,site,role,trained,peers_helped,rating,specialties,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(`${TAG} John Smith`, `${TAG}-Site`, 'Safety Lead', '2026-01-01', 10, 4.8, JSON.stringify(['LOTO','Inspections']), ts, ts);
  seededChampionId = champResult.lastInsertRowid as number;

  const qrResult = sqlite.prepare(`
    INSERT INTO hypercare_qr_deployments (location,form,scans,last_scan,status,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?)
  `).run(`${TAG} Main Entrance`, 'Daily Safety Check', 50, '10 min ago', 'active', ts, ts);
  seededQrId = qrResult.lastInsertRowid as number;
});

afterAll(() => {
  sqlite.prepare(`DELETE FROM hypercare_demos WHERE title LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM hypercare_champions WHERE name LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM hypercare_qr_deployments WHERE location LIKE '${TAG}%'`).run();
  sqlite.close();
});

// ── Stats ─────────────────────────────────────────────────────────────────────

describe('GET /api/hypercare/stats', () => {
  it('returns success with all required stat fields', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hypercare/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      toolboxDemos:    expect.any(Number),
      safetyChampions: expect.any(Number),
      qrCodesDeployed: expect.any(Number),
      workersTrained:  expect.any(Number),
      peerHelpSessions: expect.any(Number),
      avgCompetency:   expect.any(String),
    });
  });

  it('toolboxDemos count is at least 5 (seeded)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/stats');
    expect(body.data.toolboxDemos).toBeGreaterThanOrEqual(5);
  });

  it('safetyChampions count is at least 4 (seeded)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/stats');
    expect(body.data.safetyChampions).toBeGreaterThanOrEqual(4);
  });

  it('qrCodesDeployed is at least 6 (seeded)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/stats');
    expect(body.data.qrCodesDeployed).toBeGreaterThanOrEqual(6);
  });

  it('workersTrained and peerHelpSessions are non-negative integers', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/stats');
    expect(body.data.workersTrained).toBeGreaterThanOrEqual(0);
    expect(body.data.peerHelpSessions).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(body.data.workersTrained)).toBe(true);
    expect(Number.isInteger(body.data.peerHelpSessions)).toBe(true);
  });

  it('avgCompetency is 91%', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/stats');
    expect(body.data.avgCompetency).toBe('91%');
  });
});

// ── Toolbox Talk Demos ────────────────────────────────────────────────────────

describe('GET /api/hypercare/demos', () => {
  it('returns success with array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hypercare/demos');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  it('each record has required fields', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/demos');
    const demo = body.data[0];
    expect(demo).toHaveProperty('id');
    expect(demo).toHaveProperty('title');
    expect(demo).toHaveProperty('duration');
    expect(demo).toHaveProperty('audience');
    expect(demo).toHaveProperty('scheduled');
    expect(demo).toHaveProperty('site');
    expect(demo).toHaveProperty('attendees');
    expect(demo).toHaveProperty('status');
    expect(demo).toHaveProperty('type');
  });

  it('filters by status=upcoming', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/demos?status=upcoming');
    expect(body.success).toBe(true);
    expect(body.data.every((d: any) => d.status === 'upcoming')).toBe(true);
  });

  it('filters by status=completed', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/demos?status=completed');
    expect(body.success).toBe(true);
    expect(body.data.every((d: any) => d.status === 'completed')).toBe(true);
  });

  it('filters by site (tag site)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/hypercare/demos?site=${TAG}-Site`);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.every((d: any) => d.site === `${TAG}-Site`)).toBe(true);
  });

  it('filters by search (title keyword)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/hypercare/demos?search=${TAG}`);
    expect(body.success).toBe(true);
    expect(body.data.some((d: any) => d.id === seededDemoId)).toBe(true);
  });

  it('returns empty array for no-match filter', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/demos?site=__nonexistent_site__');
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(0);
  });
});

describe('GET /api/hypercare/demos/:id', () => {
  it('returns seeded demo by id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', `/api/hypercare/demos/${seededDemoId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(seededDemoId);
    expect(body.data.site).toBe(`${TAG}-Site`);
    expect(body.data.attendees).toBe(22);
    expect(body.data.status).toBe('upcoming');
    expect(body.data.type).toBe('live');
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hypercare/demos/999999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

describe('POST /api/hypercare/demos', () => {
  const createdDemoIds: number[] = [];

  afterAll(() => {
    for (const id of createdDemoIds) {
      sqlite.prepare('DELETE FROM hypercare_demos WHERE id = ?').run(id);
    }
  });

  it('creates a demo and returns 201', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hypercare/demos', {
      title: `${TAG} New Demo`,
      duration: '5 min',
      audience: 'Technicians',
      scheduled: '2026-04-01 07:00',
      site: 'Test Site',
      attendees: 10,
      status: 'scheduled',
      type: 'live',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe(`${TAG} New Demo`);
    expect(typeof body.data.id).toBe('number');
    createdDemoIds.push(body.data.id);
  });

  it('defaults status to scheduled and type to live', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/hypercare/demos', {
      title: `${TAG} Minimal Demo`,
      scheduled: '2026-04-02 07:00',
      site: 'Site B',
    });
    expect(body.data.status).toBe('scheduled');
    expect(body.data.type).toBe('live');
    createdDemoIds.push(body.data.id);
  });

  it('returns 400 for missing title', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hypercare/demos', {
      scheduled: '2026-04-01 07:00',
      site: 'Site',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for missing scheduled', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hypercare/demos', {
      title: 'No Schedule',
      site: 'Site',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid status value', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hypercare/demos', {
      title: 'Bad Status',
      scheduled: '2026-04-01 07:00',
      site: 'Site',
      status: 'invalid_status',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid type value', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hypercare/demos', {
      title: 'Bad Type',
      scheduled: '2026-04-01 07:00',
      site: 'Site',
      type: 'webinar',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe('PUT /api/hypercare/demos/:id', () => {
  it('updates status and attendees', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/hypercare/demos/${seededDemoId}`, {
      status: 'completed',
      attendees: 30,
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('completed');
    expect(body.data.attendees).toBe(30);
  });

  it('partial update preserves untouched fields', async () => {
    const app = createTestApp();
    const { body: before } = await req(app, 'GET', `/api/hypercare/demos/${seededDemoId}`);
    await req(app, 'PUT', `/api/hypercare/demos/${seededDemoId}`, { duration: '7 min' });
    const { body: after } = await req(app, 'GET', `/api/hypercare/demos/${seededDemoId}`);
    expect(after.data.duration).toBe('7 min');
    expect(after.data.title).toBe(before.data.title);
    expect(after.data.site).toBe(before.data.site);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/hypercare/demos/999999', { status: 'completed' });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid status in update', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/hypercare/demos/${seededDemoId}`, {
      status: 'not-valid',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe('DELETE /api/hypercare/demos/:id', () => {
  let deleteId: number;

  beforeAll(() => {
    const ts = Date.now();
    const r = sqlite.prepare(`
      INSERT INTO hypercare_demos (title,duration,audience,scheduled,site,attendees,status,type,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(`${TAG} DeleteTarget Demo`, '5 min', 'All', '2026-05-01 07:00', 'Test', 0, 'scheduled', 'live', ts, ts);
    deleteId = r.lastInsertRowid as number;
  });

  it('deletes successfully', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', `/api/hypercare/demos/${deleteId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Demo deleted');
  });

  it('returns 404 after deletion', async () => {
    const app = createTestApp();
    const { status } = await req(app, 'GET', `/api/hypercare/demos/${deleteId}`);
    expect(status).toBe(404);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', '/api/hypercare/demos/999999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ── Safety Champions ──────────────────────────────────────────────────────────

describe('GET /api/hypercare/champions', () => {
  it('returns success with array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hypercare/champions');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(4);
  });

  it('each record has required fields', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/champions');
    const champ = body.data[0];
    expect(champ).toHaveProperty('id');
    expect(champ).toHaveProperty('name');
    expect(champ).toHaveProperty('site');
    expect(champ).toHaveProperty('role');
    expect(champ).toHaveProperty('trained');
    expect(champ).toHaveProperty('peersHelped');
    expect(champ).toHaveProperty('rating');
    expect(champ).toHaveProperty('specialties');
    expect(Array.isArray(champ.specialties)).toBe(true);
  });

  it('filters by site', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/hypercare/champions?site=${TAG}-Site`);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.every((c: any) => c.site === `${TAG}-Site`)).toBe(true);
  });

  it('filters by search (name)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/hypercare/champions?search=${TAG}`);
    expect(body.success).toBe(true);
    expect(body.data.some((c: any) => c.id === seededChampionId)).toBe(true);
  });

  it('returns empty array for no-match filter', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/champions?site=__nonexistent__');
    expect(body.data.length).toBe(0);
  });
});

describe('GET /api/hypercare/champions/:id', () => {
  it('returns seeded champion by id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', `/api/hypercare/champions/${seededChampionId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(seededChampionId);
    expect(body.data.peersHelped).toBe(10);
    expect(body.data.rating).toBeCloseTo(4.8);
    expect(body.data.specialties).toContain('LOTO');
    expect(body.data.specialties).toContain('Inspections');
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hypercare/champions/999999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

describe('POST /api/hypercare/champions', () => {
  const createdChampIds: number[] = [];

  afterAll(() => {
    for (const id of createdChampIds) {
      sqlite.prepare('DELETE FROM hypercare_champions WHERE id = ?').run(id);
    }
  });

  it('creates a champion and returns 201', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hypercare/champions', {
      name: `${TAG} Jane Doe`,
      site: 'Test Plant',
      role: 'Safety Officer',
      trained: '2026-02-01',
      peersHelped: 5,
      rating: 4.5,
      specialties: ['PPE', 'Emergency Response'],
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe(`${TAG} Jane Doe`);
    expect(Array.isArray(body.data.specialties)).toBe(true);
    expect(body.data.specialties).toContain('PPE');
    createdChampIds.push(body.data.id);
  });

  it('defaults peersHelped to 0 and rating to 5', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/hypercare/champions', {
      name: `${TAG} Minimal Champ`,
      site: 'Site X',
      role: 'Worker',
      trained: '2026-01-01',
    });
    expect(body.data.peersHelped).toBe(0);
    expect(body.data.rating).toBe(5);
    createdChampIds.push(body.data.id);
  });

  it('returns 400 for missing name', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hypercare/champions', {
      site: 'Site',
      role: 'Worker',
      trained: '2026-01-01',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for rating > 5', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hypercare/champions', {
      name: 'Overrated Worker',
      site: 'Site',
      role: 'Worker',
      trained: '2026-01-01',
      rating: 6,
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe('PUT /api/hypercare/champions/:id', () => {
  it('updates peersHelped and rating', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/hypercare/champions/${seededChampionId}`, {
      peersHelped: 20,
      rating: 5.0,
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.peersHelped).toBe(20);
    expect(body.data.rating).toBe(5.0);
  });

  it('updates specialties array', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'PUT', `/api/hypercare/champions/${seededChampionId}`, {
      specialties: ['LOTO', 'Inspections', 'Risk Assessment'],
    });
    expect(body.success).toBe(true);
    expect(body.data.specialties).toHaveLength(3);
    expect(body.data.specialties).toContain('Risk Assessment');
  });

  it('partial update preserves untouched fields', async () => {
    const app = createTestApp();
    const { body: before } = await req(app, 'GET', `/api/hypercare/champions/${seededChampionId}`);
    await req(app, 'PUT', `/api/hypercare/champions/${seededChampionId}`, { role: 'Senior Lead' });
    const { body: after } = await req(app, 'GET', `/api/hypercare/champions/${seededChampionId}`);
    expect(after.data.role).toBe('Senior Lead');
    expect(after.data.name).toBe(before.data.name);
    expect(after.data.site).toBe(before.data.site);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/hypercare/champions/999999', { role: 'Guest' });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

describe('DELETE /api/hypercare/champions/:id', () => {
  let deleteId: number;

  beforeAll(() => {
    const ts = Date.now();
    const r = sqlite.prepare(`
      INSERT INTO hypercare_champions (name,site,role,trained,peers_helped,rating,specialties,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(`${TAG} DeleteTarget Champ`, 'Test', 'Worker', '2026-01-01', 0, 5.0, '[]', ts, ts);
    deleteId = r.lastInsertRowid as number;
  });

  it('deletes successfully', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', `/api/hypercare/champions/${deleteId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Champion deleted');
  });

  it('returns 404 after deletion', async () => {
    const app = createTestApp();
    const { status } = await req(app, 'GET', `/api/hypercare/champions/${deleteId}`);
    expect(status).toBe(404);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status } = await req(app, 'DELETE', '/api/hypercare/champions/999999');
    expect(status).toBe(404);
  });
});

// ── QR Code Deployments ───────────────────────────────────────────────────────

describe('GET /api/hypercare/qr', () => {
  it('returns success with array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hypercare/qr');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(6);
  });

  it('each record has required fields', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/qr');
    const qr = body.data[0];
    expect(qr).toHaveProperty('id');
    expect(qr).toHaveProperty('location');
    expect(qr).toHaveProperty('form');
    expect(qr).toHaveProperty('scans');
    expect(qr).toHaveProperty('lastScan');
    expect(qr).toHaveProperty('status');
  });

  it('filters by status=active', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/qr?status=active');
    expect(body.success).toBe(true);
    expect(body.data.every((q: any) => q.status === 'active')).toBe(true);
  });

  it('filters by status=inactive returns empty or matching', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/qr?status=inactive');
    expect(body.success).toBe(true);
    expect(body.data.every((q: any) => q.status === 'inactive')).toBe(true);
  });

  it('searches by location', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', `/api/hypercare/qr?search=${TAG}`);
    expect(body.success).toBe(true);
    expect(body.data.some((q: any) => q.id === seededQrId)).toBe(true);
  });

  it('searches by form name', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/hypercare/qr?search=Daily Safety Check');
    expect(body.success).toBe(true);
    expect(body.data.some((q: any) => q.id === seededQrId)).toBe(true);
  });
});

describe('GET /api/hypercare/qr/:id', () => {
  it('returns seeded QR deployment by id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', `/api/hypercare/qr/${seededQrId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(seededQrId);
    expect(body.data.scans).toBe(50);
    expect(body.data.status).toBe('active');
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/hypercare/qr/999999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

describe('POST /api/hypercare/qr', () => {
  const createdQrIds: number[] = [];

  afterAll(() => {
    for (const id of createdQrIds) {
      sqlite.prepare('DELETE FROM hypercare_qr_deployments WHERE id = ?').run(id);
    }
  });

  it('creates a QR deployment and returns 201', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hypercare/qr', {
      location: `${TAG} Tank Room`,
      form: 'Confined Space Entry Form',
      scans: 0,
      lastScan: 'never',
      status: 'active',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.location).toBe(`${TAG} Tank Room`);
    expect(typeof body.data.id).toBe('number');
    createdQrIds.push(body.data.id);
  });

  it('defaults scans to 0, lastScan to never, status to active', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/hypercare/qr', {
      location: `${TAG} Side Gate`,
      form: 'Gate Entry Check',
    });
    expect(body.data.scans).toBe(0);
    expect(body.data.lastScan).toBe('never');
    expect(body.data.status).toBe('active');
    createdQrIds.push(body.data.id);
  });

  it('returns 400 for missing location', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hypercare/qr', {
      form: 'Some Form',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for missing form', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hypercare/qr', {
      location: 'Some Location',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid status', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hypercare/qr', {
      location: `${TAG} Room`,
      form: 'Check Form',
      status: 'broken',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe('PUT /api/hypercare/qr/:id', () => {
  it('updates form and scans', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/hypercare/qr/${seededQrId}`, {
      form: 'Updated Safety Check',
      scans: 75,
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.form).toBe('Updated Safety Check');
    expect(body.data.scans).toBe(75);
  });

  it('partial update preserves untouched fields', async () => {
    const app = createTestApp();
    const { body: before } = await req(app, 'GET', `/api/hypercare/qr/${seededQrId}`);
    await req(app, 'PUT', `/api/hypercare/qr/${seededQrId}`, { lastScan: '5 min ago' });
    const { body: after } = await req(app, 'GET', `/api/hypercare/qr/${seededQrId}`);
    expect(after.data.lastScan).toBe('5 min ago');
    expect(after.data.location).toBe(before.data.location);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/hypercare/qr/999999', { scans: 1 });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid status in update', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/hypercare/qr/${seededQrId}`, {
      status: 'expired',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe('DELETE /api/hypercare/qr/:id', () => {
  let deleteId: number;

  beforeAll(() => {
    const ts = Date.now();
    const r = sqlite.prepare(`
      INSERT INTO hypercare_qr_deployments (location,form,scans,last_scan,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?)
    `).run(`${TAG} DeleteTarget QR`, 'Delete Form', 0, 'never', 'active', ts, ts);
    deleteId = r.lastInsertRowid as number;
  });

  it('deletes successfully', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'DELETE', `/api/hypercare/qr/${deleteId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('QR deployment deleted');
  });

  it('returns 404 after deletion', async () => {
    const app = createTestApp();
    const { status } = await req(app, 'GET', `/api/hypercare/qr/${deleteId}`);
    expect(status).toBe(404);
  });

  it('returns 404 for unknown id', async () => {
    const app = createTestApp();
    const { status } = await req(app, 'DELETE', '/api/hypercare/qr/999999');
    expect(status).toBe(404);
  });
});

// ── QR Scan Increment ─────────────────────────────────────────────────────────

describe('POST /api/hypercare/qr/:id/scan', () => {
  it('increments scan count by 1', async () => {
    const app = createTestApp();
    const { body: before } = await req(app, 'GET', `/api/hypercare/qr/${seededQrId}`);
    const { status, body } = await req(app, 'POST', `/api/hypercare/qr/${seededQrId}/scan`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.scans).toBe(before.data.scans + 1);
  });

  it('updates lastScan to "just now"', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', `/api/hypercare/qr/${seededQrId}/scan`);
    expect(body.data.lastScan).toBe('just now');
  });

  it('accumulates multiple scans', async () => {
    const app = createTestApp();
    const { body: before } = await req(app, 'GET', `/api/hypercare/qr/${seededQrId}`);
    await req(app, 'POST', `/api/hypercare/qr/${seededQrId}/scan`);
    await req(app, 'POST', `/api/hypercare/qr/${seededQrId}/scan`);
    await req(app, 'POST', `/api/hypercare/qr/${seededQrId}/scan`);
    const { body: after } = await req(app, 'GET', `/api/hypercare/qr/${seededQrId}`);
    expect(after.data.scans).toBe(before.data.scans + 3);
  });

  it('returns 404 for unknown QR id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/hypercare/qr/999999/scan');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});
