/**
 * Near Miss Report Routes Test Suite
 *
 * Covers:
 *   GET  /api/near-miss-reports                                              — auth, list, isolation
 *   POST /api/near-miss-reports                                              — create, validation
 *   POST /api/near-miss-reports/ai-analysis                                  — generate analysis, validation
 *   GET  /api/near-miss-reports/:id                                          — fetch, ownership, 404
 *   PUT  /api/near-miss-reports/:id/corrective-actions/:actionId/status      — update CA, 404, validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import Database from 'better-sqlite3';
import { nearMissReportRoutes } from '../routes/near-miss-reports';

// ── App factory ───────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  nearMissReportRoutes(app);
  return app;
}

// ── Request helper ────────────────────────────────────────────────────────────

async function req(
  app: Hono,
  method: string,
  path: string,
  body?: unknown,
  token?: string,
) {
  const init: RequestInit = { method };
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  init.headers = headers;
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

const JWT_SECRET = 'safetymeg-jwt-secret-2025-change-in-production';

async function makeToken(userId: number): Promise<string> {
  return sign(
    { userId, email: `nm-test-${userId}@example.com`, role: 'safety_officer', exp: Math.floor(Date.now() / 1000) + 3600 },
    JWT_SECRET,
  );
}

// ── Users ─────────────────────────────────────────────────────────────────────

const BASE_USER_ID = 880000 + (Date.now() % 9000);
const USER_A = BASE_USER_ID;
const USER_B = BASE_USER_ID + 1;

let tokenA: string;
let tokenB: string;

const sqlite = new Database('local.sqlite');

beforeAll(async () => {
  tokenA = await makeToken(USER_A);
  tokenB = await makeToken(USER_B);
});

afterAll(() => {
  sqlite.prepare('DELETE FROM near_miss_reports WHERE user_id IN (?, ?)').run(USER_A, USER_B);
  sqlite.close();
});

// ── Minimal valid report payload ──────────────────────────────────────────────

function minimalReport(overrides: Record<string, unknown> = {}) {
  return {
    reportId: `NM-2026-TEST-${Date.now()}`,
    reportDate: '2026-03-10',
    reportTime: '09:30',
    reportedBy: 'John Doe',
    jobTitle: 'Safety Officer',
    department: 'Operations',
    location: 'Warehouse A',
    specificArea: 'Aisle 3',
    industrySector: 'Manufacturing',
    eventDate: '2026-03-10',
    eventTime: '08:15',
    category: 'Slip/Trip/Fall (no contact)',
    potentialSeverity: 'Serious',
    description: 'Worker nearly slipped on wet surface near loading dock.',
    immediateActions: 'Area cordoned off, wet floor sign placed.',
    witnessList: ['Jane Smith', 'Mike Brown'],
    oshaReferences: ['1904.39'],
    isoReferences: ['ISO-45001-10.2'],
    internationalReferences: ['EU-89/391/EEC'],
    contributingFactors: ['Poor Lighting', 'Housekeeping Issues'],
    rootCauseAnalysis: 'Spill not cleaned up promptly.',
    weatherCondition: 'Indoor (N/A)',
    ppeWorn: ['Hard Hat', 'Steel-Toe Boots'],
    equipmentInvolved: ['None / N/A'],
    correctiveActions: [],
    photos: [],
    aiAnalysis: '',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/near-miss-reports/ai-analysis
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/near-miss-reports/ai-analysis', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'POST', '/api/near-miss-reports/ai-analysis', {
      category: 'Electrical Hazard', potentialSeverity: 'Critical',
    });
    expect(status).toBe(401);
  });

  it('returns 401 for invalid/malformed token', async () => {
    const { status } = await req(app, 'POST', '/api/near-miss-reports/ai-analysis',
      { category: 'Electrical Hazard', potentialSeverity: 'Critical' }, 'bad.token.here');
    expect(status).toBe(401);
  });

  it('returns 400 for missing category', async () => {
    const { status } = await req(app, 'POST', '/api/near-miss-reports/ai-analysis',
      { potentialSeverity: 'Critical' }, tokenA);
    expect(status).toBe(400);
  });

  it('returns 400 for missing potentialSeverity', async () => {
    const { status } = await req(app, 'POST', '/api/near-miss-reports/ai-analysis',
      { category: 'Electrical Hazard' }, tokenA);
    expect(status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await app.request('/api/near-miss-reports/ai-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: '{ bad json }',
    });
    expect(res.status).toBe(400);
  });

  it('returns 200 with analysis string and source:fallback', async () => {
    const { status, body } = await req(app, 'POST', '/api/near-miss-reports/ai-analysis', {
      category: 'Electrical Hazard',
      potentialSeverity: 'Critical',
      industrySector: 'Manufacturing',
      location: 'Building B',
      specificArea: 'Panel Room 3',
      oshaReferences: ['1904.39'],
      isoReferences: ['ISO-45001-10.2'],
      contributingFactors: ['Fatigue/Alertness', 'Training Deficiency'],
    }, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.analysis).toBe('string');
    expect(body.analysis.length).toBeGreaterThan(50);
    expect(body.source).toBe('fallback');
  });

  it('analysis includes category name', async () => {
    const { body } = await req(app, 'POST', '/api/near-miss-reports/ai-analysis', {
      category: 'Fire/Explosion Risk',
      potentialSeverity: 'Critical',
    }, tokenA);
    expect(body.analysis).toContain('Fire/Explosion Risk');
  });

  it('analysis marks HIGH priority for Critical severity', async () => {
    const { body } = await req(app, 'POST', '/api/near-miss-reports/ai-analysis', {
      category: 'Working at Heights',
      potentialSeverity: 'Critical',
    }, tokenA);
    expect(body.analysis).toContain('HIGH');
  });

  it('analysis marks MODERATE priority for Minor severity', async () => {
    const { body } = await req(app, 'POST', '/api/near-miss-reports/ai-analysis', {
      category: 'Ergonomic Hazard',
      potentialSeverity: 'Minor',
    }, tokenA);
    expect(body.analysis).toContain('MODERATE');
  });

  it('analysis lists osha references when provided', async () => {
    const { body } = await req(app, 'POST', '/api/near-miss-reports/ai-analysis', {
      category: 'Process Safety Event',
      potentialSeverity: 'Serious',
      oshaReferences: ['1910.119', '1904.39'],
    }, tokenA);
    expect(body.analysis).toContain('1910.119');
  });

  it('analysis works with minimal payload (only required fields)', async () => {
    const { status, body } = await req(app, 'POST', '/api/near-miss-reports/ai-analysis', {
      category: 'Security Breach',
      potentialSeverity: 'Moderate',
    }, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/near-miss-reports (list)
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/near-miss-reports', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status, body } = await req(app, 'GET', '/api/near-miss-reports');
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 200 with empty array for fresh user', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 10);
    const { status, body } = await req(app, 'GET', '/api/near-miss-reports', undefined, freshToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.count).toBe(0);
  });

  it('returns reports specific to authenticated user', async () => {
    const freshAToken = await makeToken(BASE_USER_ID + 11);
    const freshBToken = await makeToken(BASE_USER_ID + 12);
    await req(app, 'POST', '/api/near-miss-reports', minimalReport({ reportedBy: 'UserA Only' }), freshAToken);
    const { body: listB } = await req(app, 'GET', '/api/near-miss-reports', undefined, freshBToken);
    const titles = listB.data.map((r: any) => r.reportedBy);
    expect(titles).not.toContain('UserA Only');
  });

  it('appears in list after creation', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 13);
    await req(app, 'POST', '/api/near-miss-reports', minimalReport({ reportedBy: 'ListTest User' }), freshToken);
    const { body } = await req(app, 'GET', '/api/near-miss-reports', undefined, freshToken);
    expect(body.count).toBe(1);
    expect(body.data[0].reportedBy).toBe('ListTest User');
  });

  it('count field matches data array length', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 14);
    await req(app, 'POST', '/api/near-miss-reports', minimalReport(), freshToken);
    await req(app, 'POST', '/api/near-miss-reports', minimalReport(), freshToken);
    const { body } = await req(app, 'GET', '/api/near-miss-reports', undefined, freshToken);
    expect(body.count).toBe(body.data.length);
    expect(body.count).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/near-miss-reports (create)
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/near-miss-reports', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'POST', '/api/near-miss-reports', minimalReport());
    expect(status).toBe(401);
  });

  it('creates a report and returns 201', async () => {
    const { status, body } = await req(app, 'POST', '/api/near-miss-reports', minimalReport(), tokenA);
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
  });

  it('returned report has all camelCase fields', async () => {
    const { body } = await req(app, 'POST', '/api/near-miss-reports', minimalReport(), tokenA);
    const r = body.data;
    expect(r).toHaveProperty('id');
    expect(r).toHaveProperty('reportId');
    expect(r).toHaveProperty('reportedBy');
    expect(r).toHaveProperty('jobTitle');
    expect(r).toHaveProperty('department');
    expect(r).toHaveProperty('reportDate');
    expect(r).toHaveProperty('eventDate');
    expect(r).toHaveProperty('location');
    expect(r).toHaveProperty('category');
    expect(r).toHaveProperty('potentialSeverity');
    expect(r).toHaveProperty('description');
    expect(r).toHaveProperty('witnessList');
    expect(r).toHaveProperty('oshaReferences');
    expect(r).toHaveProperty('isoReferences');
    expect(r).toHaveProperty('internationalReferences');
    expect(r).toHaveProperty('contributingFactors');
    expect(r).toHaveProperty('ppeWorn');
    expect(r).toHaveProperty('equipmentInvolved');
    expect(r).toHaveProperty('correctiveActions');
    expect(r).toHaveProperty('photos');
    expect(r).toHaveProperty('aiAnalysis');
    expect(r).toHaveProperty('status');
    expect(r).toHaveProperty('createdAt');
    expect(r).toHaveProperty('updatedAt');
  });

  it('array fields are parsed arrays (not strings)', async () => {
    const { body } = await req(app, 'POST', '/api/near-miss-reports', minimalReport(), tokenA);
    expect(Array.isArray(body.data.witnessList)).toBe(true);
    expect(Array.isArray(body.data.oshaReferences)).toBe(true);
    expect(Array.isArray(body.data.isoReferences)).toBe(true);
    expect(Array.isArray(body.data.internationalReferences)).toBe(true);
    expect(Array.isArray(body.data.contributingFactors)).toBe(true);
    expect(Array.isArray(body.data.ppeWorn)).toBe(true);
    expect(Array.isArray(body.data.equipmentInvolved)).toBe(true);
    expect(Array.isArray(body.data.correctiveActions)).toBe(true);
    expect(Array.isArray(body.data.photos)).toBe(true);
  });

  it('persists witnessList correctly', async () => {
    const { body } = await req(app, 'POST', '/api/near-miss-reports',
      minimalReport({ witnessList: ['Alice', 'Bob'] }), tokenA);
    expect(body.data.witnessList).toEqual(['Alice', 'Bob']);
  });

  it('persists oshaReferences correctly', async () => {
    const { body } = await req(app, 'POST', '/api/near-miss-reports',
      minimalReport({ oshaReferences: ['1904.39', '1910.119'] }), tokenA);
    expect(body.data.oshaReferences).toContain('1904.39');
    expect(body.data.oshaReferences).toContain('1910.119');
  });

  it('persists internationalReferences correctly', async () => {
    const { body } = await req(app, 'POST', '/api/near-miss-reports',
      minimalReport({ internationalReferences: ['EU-89/391/EEC', 'NEBOSH-NGC1-4'] }), tokenA);
    expect(body.data.internationalReferences).toContain('EU-89/391/EEC');
  });

  it('persists contributingFactors correctly', async () => {
    const { body } = await req(app, 'POST', '/api/near-miss-reports',
      minimalReport({ contributingFactors: ['Fatigue/Alertness', 'Noise Level'] }), tokenA);
    expect(body.data.contributingFactors).toContain('Fatigue/Alertness');
  });

  it('persists correctiveActions with full structure', async () => {
    const ca = {
      id: 'CA-001',
      action: 'Install additional lighting',
      assignedTo: 'Mike Johnson',
      assigneeEmail: 'mike@example.com',
      dueDate: '2026-04-01',
      priority: 'High',
      status: 'Open',
      sendEmailNotification: true,
    };
    const { body } = await req(app, 'POST', '/api/near-miss-reports',
      minimalReport({ correctiveActions: [ca] }), tokenA);
    expect(body.data.correctiveActions).toHaveLength(1);
    expect(body.data.correctiveActions[0].id).toBe('CA-001');
    expect(body.data.correctiveActions[0].priority).toBe('High');
    expect(body.data.correctiveActions[0].assignedTo).toBe('Mike Johnson');
  });

  it('status defaults to open', async () => {
    const { body } = await req(app, 'POST', '/api/near-miss-reports', minimalReport(), tokenA);
    expect(body.data.status).toBe('open');
  });

  it('persists aiAnalysis string', async () => {
    const { body } = await req(app, 'POST', '/api/near-miss-reports',
      minimalReport({ aiAnalysis: '**AI Analysis** — HIGH risk identified' }), tokenA);
    expect(body.data.aiAnalysis).toBe('**AI Analysis** — HIGH risk identified');
  });

  it('returns 400 for missing reportedBy', async () => {
    const payload = minimalReport();
    delete (payload as any).reportedBy;
    const { status } = await req(app, 'POST', '/api/near-miss-reports', payload, tokenA);
    expect(status).toBe(400);
  });

  it('returns 400 for missing category', async () => {
    const payload = minimalReport();
    delete (payload as any).category;
    const { status } = await req(app, 'POST', '/api/near-miss-reports', payload, tokenA);
    expect(status).toBe(400);
  });

  it('returns 400 for missing description', async () => {
    const payload = minimalReport();
    delete (payload as any).description;
    const { status } = await req(app, 'POST', '/api/near-miss-reports', payload, tokenA);
    expect(status).toBe(400);
  });

  it('returns 400 for missing location', async () => {
    const payload = minimalReport();
    delete (payload as any).location;
    const { status } = await req(app, 'POST', '/api/near-miss-reports', payload, tokenA);
    expect(status).toBe(400);
  });

  it('returns 400 for malformed JSON body', async () => {
    const res = await app.request('/api/near-miss-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: '{ bad: json }',
    });
    expect(res.status).toBe(400);
  });

  it('auto-assigns userId from JWT (cross-user isolation)', async () => {
    const freshTokenA2 = await makeToken(BASE_USER_ID + 20);
    const freshTokenB2 = await makeToken(BASE_USER_ID + 21);
    const { body: created } = await req(app, 'POST', '/api/near-miss-reports', minimalReport(), freshTokenA2);
    // B cannot see this report
    const { status } = await req(app, 'GET', `/api/near-miss-reports/${created.data.id}`, undefined, freshTokenB2);
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/near-miss-reports/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/near-miss-reports/:id', () => {
  let app: Hono;
  let createdId: number;

  beforeAll(async () => {
    app = createTestApp();
    const { body } = await req(app, 'POST', '/api/near-miss-reports',
      minimalReport({ reportedBy: 'Get-By-Id User', description: 'Unique desc for GET test' }),
      tokenA);
    createdId = body.data.id;
  });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'GET', `/api/near-miss-reports/${createdId}`);
    expect(status).toBe(401);
  });

  it('returns 200 for own report', async () => {
    const { status, body } = await req(app, 'GET', `/api/near-miss-reports/${createdId}`, undefined, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdId);
  });

  it('returned report has correct reportedBy', async () => {
    const { body } = await req(app, 'GET', `/api/near-miss-reports/${createdId}`, undefined, tokenA);
    expect(body.data.reportedBy).toBe('Get-By-Id User');
  });

  it('returned report has correct description', async () => {
    const { body } = await req(app, 'GET', `/api/near-miss-reports/${createdId}`, undefined, tokenA);
    expect(body.data.description).toBe('Unique desc for GET test');
  });

  it('returns 404 for non-existent id', async () => {
    const { status } = await req(app, 'GET', '/api/near-miss-reports/999999999', undefined, tokenA);
    expect(status).toBe(404);
  });

  it('returns 404 when user B tries to access user A report', async () => {
    const { status } = await req(app, 'GET', `/api/near-miss-reports/${createdId}`, undefined, tokenB);
    expect(status).toBe(404);
  });

  it('array fields remain as arrays in GET response', async () => {
    const { body } = await req(app, 'GET', `/api/near-miss-reports/${createdId}`, undefined, tokenA);
    expect(Array.isArray(body.data.witnessList)).toBe(true);
    expect(Array.isArray(body.data.oshaReferences)).toBe(true);
    expect(Array.isArray(body.data.ppeWorn)).toBe(true);
    expect(Array.isArray(body.data.correctiveActions)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/near-miss-reports/:id/corrective-actions/:actionId/status
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/near-miss-reports/:id/corrective-actions/:actionId/status', () => {
  let app: Hono;
  let reportId: number;

  const ca1 = {
    id: 'CA-T001',
    action: 'Fix the spill immediately',
    assignedTo: 'Alice',
    assigneeEmail: 'alice@co.com',
    dueDate: '2026-04-01',
    priority: 'High',
    status: 'Open',
    sendEmailNotification: true,
  };
  const ca2 = {
    id: 'CA-T002',
    action: 'Update housekeeping SOP',
    assignedTo: 'Bob',
    assigneeEmail: '',
    dueDate: '2026-05-01',
    priority: 'Medium',
    status: 'Open',
    sendEmailNotification: false,
  };

  beforeAll(async () => {
    app = createTestApp();
    const { body } = await req(app, 'POST', '/api/near-miss-reports',
      minimalReport({ correctiveActions: [ca1, ca2] }),
      tokenA);
    reportId = body.data.id;
  });

  it('returns 401 with no token', async () => {
    const { status } = await req(
      app, 'PUT', `/api/near-miss-reports/${reportId}/corrective-actions/CA-T001/status`,
      { status: 'Completed' },
    );
    expect(status).toBe(401);
  });

  it('updates CA-T001 to Completed, returns 200', async () => {
    const { status, body } = await req(
      app, 'PUT', `/api/near-miss-reports/${reportId}/corrective-actions/CA-T001/status`,
      { status: 'Completed' }, tokenA,
    );
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    const updated = body.data.correctiveActions.find((a: any) => a.id === 'CA-T001');
    expect(updated.status).toBe('Completed');
  });

  it('updates CA-T002 to In Progress', async () => {
    const { body } = await req(
      app, 'PUT', `/api/near-miss-reports/${reportId}/corrective-actions/CA-T002/status`,
      { status: 'In Progress' }, tokenA,
    );
    const updated = body.data.correctiveActions.find((a: any) => a.id === 'CA-T002');
    expect(updated.status).toBe('In Progress');
  });

  it('other corrective actions remain unchanged', async () => {
    await req(app, 'PUT', `/api/near-miss-reports/${reportId}/corrective-actions/CA-T001/status`,
      { status: 'Completed' }, tokenA);
    const { body } = await req(app, 'GET', `/api/near-miss-reports/${reportId}`, undefined, tokenA);
    // CA-T002's action text should not be modified
    const ca2check = body.data.correctiveActions.find((a: any) => a.id === 'CA-T002');
    expect(ca2check.action).toBe('Update housekeeping SOP');
  });

  it('persists completionNotes when provided', async () => {
    const { body } = await req(
      app, 'PUT', `/api/near-miss-reports/${reportId}/corrective-actions/CA-T001/status`,
      { status: 'Completed', completionNotes: 'Spill cleaned, drain installed' }, tokenA,
    );
    const updated = body.data.correctiveActions.find((a: any) => a.id === 'CA-T001');
    expect(updated.completionNotes).toBe('Spill cleaned, drain installed');
  });

  it('returns 400 for invalid status value', async () => {
    const { status } = await req(
      app, 'PUT', `/api/near-miss-reports/${reportId}/corrective-actions/CA-T001/status`,
      { status: 'InvalidStatus' }, tokenA,
    );
    expect(status).toBe(400);
  });

  it('returns 400 for malformed JSON body', async () => {
    const res = await app.request(
      `/api/near-miss-reports/${reportId}/corrective-actions/CA-T001/status`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
        body: 'bad_json',
      },
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent report id', async () => {
    const { status } = await req(
      app, 'PUT', '/api/near-miss-reports/999999999/corrective-actions/CA-T001/status',
      { status: 'Open' }, tokenA,
    );
    expect(status).toBe(404);
  });

  it('returns 404 for non-existent corrective action id', async () => {
    const { status } = await req(
      app, 'PUT', `/api/near-miss-reports/${reportId}/corrective-actions/CA-NONEXISTENT/status`,
      { status: 'Open' }, tokenA,
    );
    expect(status).toBe(404);
  });

  it('returns 404 when user B tries to update user A corrective action', async () => {
    const { status } = await req(
      app, 'PUT', `/api/near-miss-reports/${reportId}/corrective-actions/CA-T001/status`,
      { status: 'Completed' }, tokenB,
    );
    expect(status).toBe(404);
  });

  it('accepts Overdue as valid status', async () => {
    const { status, body } = await req(
      app, 'PUT', `/api/near-miss-reports/${reportId}/corrective-actions/CA-T002/status`,
      { status: 'Overdue' }, tokenA,
    );
    expect(status).toBe(200);
    const updated = body.data.correctiveActions.find((a: any) => a.id === 'CA-T002');
    expect(updated.status).toBe('Overdue');
  });

  it('accepts all four valid status values', async () => {
    // Create a fresh report with 4 CAs to test each status
    const caList = ['Open', 'In Progress', 'Completed', 'Overdue'].map((s, i) => ({
      id: `CA-TEST-${i}`,
      action: `Action ${i}`,
      assignedTo: `Owner ${i}`,
      assigneeEmail: '',
      dueDate: '2026-06-01',
      priority: 'Low',
      status: 'Open',
      sendEmailNotification: false,
    }));
    const { body: created } = await req(app, 'POST', '/api/near-miss-reports',
      minimalReport({ correctiveActions: caList }), tokenA);
    const rId = created.data.id;

    for (const [i, statusVal] of ['Open', 'In Progress', 'Completed', 'Overdue'].entries()) {
      const { status } = await req(
        app, 'PUT', `/api/near-miss-reports/${rId}/corrective-actions/CA-TEST-${i}/status`,
        { status: statusVal }, tokenA,
      );
      expect(status).toBe(200);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: full report round-trip
// ─────────────────────────────────────────────────────────────────────────────

describe('Full report round-trip', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('creates, fetches, and lists the same report', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 30);
    const payload = minimalReport({
      reportedBy: 'Sarah Connor',
      description: 'Round-trip test incident',
      oshaReferences: ['1910.119'],
      contributingFactors: ['Communication Failure'],
    });

    // Create
    const { status: createStatus, body: created } = await req(app, 'POST', '/api/near-miss-reports', payload, freshToken);
    expect(createStatus).toBe(201);
    expect(created.data.id).toBeGreaterThan(0);

    // Fetch by id
    const { body: fetched } = await req(app, 'GET', `/api/near-miss-reports/${created.data.id}`, undefined, freshToken);
    expect(fetched.data.reportedBy).toBe('Sarah Connor');
    expect(fetched.data.oshaReferences).toContain('1910.119');

    // List
    const { body: list } = await req(app, 'GET', '/api/near-miss-reports', undefined, freshToken);
    const found = list.data.find((r: any) => r.id === created.data.id);
    expect(found).toBeDefined();
    expect(found.description).toBe('Round-trip test incident');
  });

  it('ai-analysis → create → verify aiAnalysis persisted', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 31);

    // Generate AI analysis
    const { body: aiBody } = await req(app, 'POST', '/api/near-miss-reports/ai-analysis', {
      category: 'Chemical Exposure (potential)',
      potentialSeverity: 'Serious',
      industrySector: 'Oil & Gas',
    }, freshToken);
    const analysis = aiBody.analysis;

    // Submit the full report with aiAnalysis
    const { body: created } = await req(app, 'POST', '/api/near-miss-reports',
      minimalReport({ aiAnalysis: analysis, category: 'Chemical Exposure (potential)' }),
      freshToken);
    expect(created.data.aiAnalysis).toBe(analysis);
    expect(created.data.aiAnalysis).toContain('Chemical Exposure');
  });
});
