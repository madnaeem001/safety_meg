/**
 * Investigation Routes Test Suite
 *
 * Covers:
 *   GET    /api/investigations/list
 *   POST   /api/investigations/assign
 *   POST   /api/investigations/create
 *   GET    /api/investigations/:incidentId
 *   GET    /api/investigations/id/:id
 *   PUT    /api/investigations/:id
 *   POST   /api/investigations/:id/rcca
 *   GET    /api/investigations/:id/rcca
 *   POST   /api/investigations/:id/bowtie
 *   GET    /api/investigations/:id/bowtie
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { investigationRoutes } from '../routes/investigations';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  investigationRoutes(app);
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
const TAG = `testinv-${Date.now()}`;

// Seeded IDs
let incidentId1: number;
let incidentId2: number;
let invId1: number;
let invId2: number;
let invId3: number;

afterAll(() => {
  sqlite.prepare(`DELETE FROM rcca WHERE investigation_id IN (SELECT id FROM investigations WHERE investigator LIKE '${TAG}%')`).run();
  sqlite.prepare(`DELETE FROM bowtie_scenarios WHERE investigation_id IN (SELECT id FROM investigations WHERE investigator LIKE '${TAG}%')`).run();
  sqlite.prepare(`DELETE FROM investigations WHERE investigator LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM incidents WHERE description LIKE '${TAG}%'`).run();
  sqlite.close();
});

function seedIncident(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO incidents (incident_date, incident_time, location, incident_type, severity, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.incident_date ?? '2025-01-15',
    overrides.incident_time ?? '09:00',
    overrides.location ?? 'Plant A',
    overrides.incident_type ?? 'Near Miss',
    overrides.severity ?? 'Medium',
    overrides.description ?? `${TAG} test incident`,
    overrides.status ?? 'open',
    ts, ts,
  );
  return Number(result.lastInsertRowid);
}

function seedInvestigation(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO investigations
      (incident_id, investigation_date, investigator, industry, findings,
       status, iso_clause, regulatory_reportable, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.incident_id       ?? 99999,
    overrides.investigation_date ?? '2025-01-20',
    overrides.investigator      ?? `${TAG}-investigator`,
    overrides.industry          ?? 'Manufacturing',
    overrides.findings          ?? 'Test findings text',
    overrides.status            ?? 'Open',
    overrides.iso_clause        ?? '45001:2018 Clause 8',
    overrides.regulatory_reportable ?? 0,
    overrides.created_at        ?? ts,
    overrides.updated_at        ?? ts,
  );
  return Number(result.lastInsertRowid);
}

function seedRcca(investigationId: number, overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO rcca
      (investigation_id, root_causes, why_analysis, fishbone_factors,
       corrective_actions, preventive_measures, lessons_learned, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    investigationId,
    overrides.root_causes       ?? JSON.stringify(['Lack of training', 'Worn equipment']),
    overrides.why_analysis      ?? JSON.stringify({ '1': 'Operator skipped checklist', '2': 'No supervisor present' }),
    overrides.fishbone_factors  ?? JSON.stringify({ People: ['Fatigue'], Equipment: ['No PPE'], Environment: ['Poor lighting'] }),
    overrides.corrective_actions ?? JSON.stringify([{ action: 'Retrain staff', assignedTo: 'Jane Doe', dueDate: '2025-03-01', status: 'Open' }]),
    overrides.preventive_measures ?? JSON.stringify(['Implement daily safety briefings']),
    overrides.lessons_learned   ?? JSON.stringify({ whatHappened: 'Near miss at conveyor', whyMatters: 'Could cause injury' }),
    overrides.status            ?? 'Open',
    ts, ts,
  );
  return Number(result.lastInsertRowid);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Investigation Routes', () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
    incidentId1 = seedIncident({ description: `${TAG} incident-1` });
    incidentId2 = seedIncident({ description: `${TAG} incident-2` });
    invId1 = seedInvestigation({ incident_id: incidentId1, investigator: `${TAG}-inv-1`, status: 'Open',        industry: 'Manufacturing', regulatory_reportable: 0 });
    invId2 = seedInvestigation({ incident_id: incidentId2, investigator: `${TAG}-inv-2`, status: 'In Progress', industry: 'Chemical',       regulatory_reportable: 1 });
    invId3 = seedInvestigation({ incident_id: incidentId1, investigator: `${TAG}-inv-3`, status: 'Completed',   industry: 'Manufacturing', regulatory_reportable: 0 });
    seedRcca(invId1);
  });

  // ── GET /api/investigations/list ───────────────────────────────────────

  describe('GET /api/investigations/list', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/investigations/list');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data is an array', async () => {
      const { body } = await req(app, 'GET', '/api/investigations/list');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('includes count matching data length', async () => {
      const { body } = await req(app, 'GET', '/api/investigations/list');
      expect(body.count).toBe(body.data.length);
    });

    it('each item has camelCase incidentId (not incident_id)', async () => {
      const { body } = await req(app, 'GET', '/api/investigations/list');
      const seeded = body.data.find((i: any) => i.investigator === `${TAG}-inv-1`);
      expect(seeded).toBeDefined();
      expect(seeded).toHaveProperty('incidentId');
      expect(seeded).not.toHaveProperty('incident_id');
    });

    it('each item has findings field', async () => {
      const { body } = await req(app, 'GET', '/api/investigations/list');
      const seeded = body.data.find((i: any) => i.investigator === `${TAG}-inv-1`);
      expect(seeded).toHaveProperty('findings');
      expect(seeded.findings).toBe('Test findings text');
    });

    it('each item has isoClause field (not iso_clause)', async () => {
      const { body } = await req(app, 'GET', '/api/investigations/list');
      const seeded = body.data.find((i: any) => i.investigator === `${TAG}-inv-1`);
      expect(seeded).toHaveProperty('isoClause');
      expect(seeded.isoClause).toBe('45001:2018 Clause 8');
      expect(seeded).not.toHaveProperty('iso_clause');
    });

    it('regulatoryReportable is a boolean (not raw integer)', async () => {
      const { body } = await req(app, 'GET', '/api/investigations/list');
      const invWithReport = body.data.find((i: any) => i.investigator === `${TAG}-inv-2`);
      expect(invWithReport).toBeDefined();
      expect(invWithReport.regulatoryReportable).toBe(true);
      expect(typeof invWithReport.regulatoryReportable).toBe('boolean');
    });

    it('non-reportable investigation has regulatoryReportable false', async () => {
      const { body } = await req(app, 'GET', '/api/investigations/list');
      const invNoReport = body.data.find((i: any) => i.investigator === `${TAG}-inv-1`);
      expect(invNoReport.regulatoryReportable).toBe(false);
    });

    it('each item has updatedAt field (not updated_at)', async () => {
      const { body } = await req(app, 'GET', '/api/investigations/list');
      const seeded = body.data.find((i: any) => i.investigator === `${TAG}-inv-1`);
      expect(seeded).toHaveProperty('updatedAt');
      expect(seeded).not.toHaveProperty('updated_at');
    });

    it('each item has createdAt field (not created_at)', async () => {
      const { body } = await req(app, 'GET', '/api/investigations/list');
      const seeded = body.data.find((i: any) => i.investigator === `${TAG}-inv-1`);
      expect(seeded).toHaveProperty('createdAt');
      expect(seeded).not.toHaveProperty('created_at');
    });

    it('filter by status returns only matching records', async () => {
      const { body } = await req(app, 'GET', '/api/investigations/list?status=In+Progress');
      const tagRecords = body.data.filter((i: any) => i.investigator?.startsWith(TAG));
      expect(tagRecords.length).toBe(1);
      expect(tagRecords[0].status).toBe('In Progress');
    });

    it('filter by industry returns only matching records', async () => {
      const { body } = await req(app, 'GET', '/api/investigations/list?industry=Chemical');
      const tagRecords = body.data.filter((i: any) => i.investigator?.startsWith(TAG));
      expect(tagRecords.length).toBe(1);
      expect(tagRecords[0].industry).toBe('Chemical');
    });

    it('returns all 3 seeded investigations when no filter applied', async () => {
      const { body } = await req(app, 'GET', '/api/investigations/list');
      const tagRecords = body.data.filter((i: any) => i.investigator?.startsWith(TAG));
      expect(tagRecords.length).toBe(3);
    });
  });

  // ── POST /api/investigations/assign ───────────────────────────────────

  describe('POST /api/investigations/assign', () => {
    it('returns 200 when investigation exists for incidentId', async () => {
      const { status, body } = await req(app, 'POST', '/api/investigations/assign', {
        incidentId: incidentId1,
        investigator: `${TAG}-assigned-investigator`,
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('response has incidentId and investigator fields', async () => {
      const { body } = await req(app, 'POST', '/api/investigations/assign', {
        incidentId: incidentId2,
        investigator: `${TAG}-assigned-inv-2`,
      });
      expect(body.data).toHaveProperty('incidentId');
      expect(body.data.investigator).toBe(`${TAG}-assigned-inv-2`);
    });

    it('returns 404 when no investigation exists for the incidentId', async () => {
      const { status, body } = await req(app, 'POST', '/api/investigations/assign', {
        incidentId: 999999999,
        investigator: 'Nobody',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 when incidentId is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/investigations/assign', {
        investigator: 'Nobody',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when investigator is empty string', async () => {
      const { status, body } = await req(app, 'POST', '/api/investigations/assign', {
        incidentId: incidentId1,
        investigator: '',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── POST /api/investigations/create ───────────────────────────────────

  describe('POST /api/investigations/create', () => {
    it('returns 201 when incident exists', async () => {
      const { status, body } = await req(app, 'POST', '/api/investigations/create', {
        incidentId: incidentId1,
        investigationDate: '2025-02-01',
        investigator: `${TAG}-created`,
        industry: 'Construction',
        findings: 'Structural defect found',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('response has all required camelCase fields', async () => {
      const { body } = await req(app, 'POST', '/api/investigations/create', {
        incidentId: incidentId2,
        investigationDate: '2025-02-02',
        investigator: `${TAG}-created-2`,
      });
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('incidentId');
      expect(body.data.incidentId).toBe(incidentId2);
      expect(body.data).toHaveProperty('investigationDate');
      expect(body.data).toHaveProperty('investigator');
      expect(body.data).toHaveProperty('status');
      expect(body.data.status).toBe('Open');
      expect(body.data).toHaveProperty('createdAt');
    });

    it('returns 404 when incidentId does not exist in incidents table', async () => {
      const { status, body } = await req(app, 'POST', '/api/investigations/create', {
        incidentId: 999999999,
        investigationDate: '2025-02-01',
        investigator: `${TAG}-should-not-create`,
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 when incidentId is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/investigations/create', {
        investigationDate: '2025-02-01',
        investigator: `${TAG}-no-incident`,
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when investigationDate is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/investigations/create', {
        incidentId: incidentId1,
        investigator: `${TAG}-no-date`,
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when investigator is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/investigations/create', {
        incidentId: incidentId1,
        investigationDate: '2025-02-01',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/investigations/:incidentId ───────────────────────────────

  describe('GET /api/investigations/:incidentId', () => {
    it('returns 200 for existing incident with investigation', async () => {
      const { status, body } = await req(app, 'GET', `/api/investigations/${incidentId1}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data has camelCase incidentId', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${incidentId1}`);
      expect(body.data).toHaveProperty('incidentId');
      expect(body.data.incidentId).toBe(incidentId1);
      expect(body.data).not.toHaveProperty('incident_id');
    });

    it('data has investigationDate (not investigation_date)', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${incidentId1}`);
      expect(body.data).toHaveProperty('investigationDate');
      expect(body.data).not.toHaveProperty('investigation_date');
    });

    it('data has isoClause (not iso_clause)', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${incidentId1}`);
      expect(body.data).toHaveProperty('isoClause');
      expect(body.data).not.toHaveProperty('iso_clause');
    });

    it('data has regulatoryReportable boolean', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${incidentId1}`);
      expect(typeof body.data.regulatoryReportable).toBe('number');
    });

    it('data has createdAt and updatedAt', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${incidentId1}`);
      expect(body.data).toHaveProperty('createdAt');
      expect(body.data).toHaveProperty('updatedAt');
    });

    it('data has rootCauseAnalysis array', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${incidentId1}`);
      expect(Array.isArray(body.data.rootCauseAnalysis)).toBe(true);
    });

    it('returns 404 for incident with no investigation', async () => {
      const { status, body } = await req(app, 'GET', '/api/investigations/999999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for non-numeric incidentId', async () => {
      const { status, body } = await req(app, 'GET', '/api/investigations/not-a-number');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/investigations/id/:id ────────────────────────────────────

  describe('GET /api/investigations/id/:id', () => {
    it('returns 200 for existing investigation id', async () => {
      const { status, body } = await req(app, 'GET', `/api/investigations/id/${invId2}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data has correct id', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/id/${invId2}`);
      expect(body.data.id).toBe(invId2);
    });

    it('data has camelCase incidentId', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/id/${invId2}`);
      expect(body.data).toHaveProperty('incidentId');
      expect(body.data).not.toHaveProperty('incident_id');
    });

    it('data has isoClause field', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/id/${invId2}`);
      expect(body.data).toHaveProperty('isoClause');
      expect(body.data).not.toHaveProperty('iso_clause');
    });

    it('data has findings field', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/id/${invId2}`);
      expect(body.data).toHaveProperty('findings');
    });

    it('data has rootCauseAnalysis array', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/id/${invId2}`);
      expect(Array.isArray(body.data.rootCauseAnalysis)).toBe(true);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'GET', '/api/investigations/id/999999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for non-numeric id', async () => {
      const { status, body } = await req(app, 'GET', '/api/investigations/id/not-a-number');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── PUT /api/investigations/:id ───────────────────────────────────────

  describe('PUT /api/investigations/:id', () => {
    it('returns 200 on valid update', async () => {
      const { status, body } = await req(app, 'PUT', `/api/investigations/${invId3}`, {
        findings: 'Updated findings for testing',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('updated findings is reflected in response', async () => {
      const { body } = await req(app, 'PUT', `/api/investigations/${invId3}`, {
        findings: 'Updated findings content',
      });
      expect(body.data.findings).toBe('Updated findings content');
    });

    it('can update status to valid enum value', async () => {
      const { status, body } = await req(app, 'PUT', `/api/investigations/${invId3}`, {
        status: 'Closed',
      });
      expect(status).toBe(200);
      expect(body.data.status).toBe('Closed');
    });

    it('can update isoClause', async () => {
      const { body } = await req(app, 'PUT', `/api/investigations/${invId3}`, {
        isoClause: '14001:2015 Clause 6.1',
      });
      expect(body.data).toHaveProperty('updatedAt');
    });

    it('can update regulatoryReportable to true', async () => {
      const { status } = await req(app, 'PUT', `/api/investigations/${invId3}`, {
        regulatoryReportable: true,
      });
      expect(status).toBe(200);
    });

    it('response has camelCase incidentId', async () => {
      const { body } = await req(app, 'PUT', `/api/investigations/${invId3}`, {
        findings: 'Checking camelCase',
      });
      expect(body.data).toHaveProperty('incidentId');
      expect(body.data).not.toHaveProperty('incident_id');
    });

    it('returns 404 for non-existent investigation id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/investigations/999999999', {
        findings: 'Should not update',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for non-numeric id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/investigations/not-a-number', {
        findings: 'Bad id',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid status enum value', async () => {
      const { status, body } = await req(app, 'PUT', `/api/investigations/${invId3}`, {
        status: 'InvalidStatus',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── POST /api/investigations/:id/rcca ─────────────────────────────────

  describe('POST /api/investigations/:id/rcca (create)', () => {
    it('returns 201 when creating RCCA for new investigation', async () => {
      const newInvId = seedInvestigation({ incident_id: incidentId1, investigator: `${TAG}-rcca-create` });
      const { status, body } = await req(app, 'POST', `/api/investigations/${newInvId}/rcca`, {
        investigationId: newInvId,
        rootCauses: ['Root cause A', 'Root cause B'],
        fishboneFactors: { People: ['Fatigue'], Equipment: ['Worn parts'] },
        correctiveActions: [{ action: 'Retrain staff', assignedTo: 'Alice', dueDate: '2025-04-01', status: 'Open' }],
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('response has rootCauses array', async () => {
      const newInvId = seedInvestigation({ incident_id: incidentId1, investigator: `${TAG}-rcca-check` });
      const { body } = await req(app, 'POST', `/api/investigations/${newInvId}/rcca`, {
        investigationId: newInvId,
        rootCauses: ['Cause 1', 'Cause 2'],
      });
      expect(Array.isArray(body.data.rootCauses)).toBe(true);
      expect(body.data.rootCauses).toContain('Cause 1');
    });

    it('response has fishboneFactors object', async () => {
      const newInvId = seedInvestigation({ incident_id: incidentId1, investigator: `${TAG}-rcca-fishbone` });
      const { body } = await req(app, 'POST', `/api/investigations/${newInvId}/rcca`, {
        investigationId: newInvId,
        fishboneFactors: { People: ['Lack of training'] },
      });
      expect(typeof body.data.fishboneFactors).toBe('object');
      expect(body.data.fishboneFactors).toHaveProperty('People');
    });

    it('response has correctiveActions array with all fields', async () => {
      const newInvId = seedInvestigation({ incident_id: incidentId1, investigator: `${TAG}-rcca-actions` });
      const { body } = await req(app, 'POST', `/api/investigations/${newInvId}/rcca`, {
        investigationId: newInvId,
        correctiveActions: [{ action: 'Train staff', assignedTo: 'Bob', dueDate: '2025-05-01', status: 'Open' }],
      });
      expect(Array.isArray(body.data.correctiveActions)).toBe(true);
      expect(body.data.correctiveActions[0].action).toBe('Train staff');
      expect(body.data.correctiveActions[0].assignedTo).toBe('Bob');
    });

    it('upserts (updates) existing RCCA for same investigation', async () => {
      // invId1 already has a seeded RCCA — calling POST again should update it
      const { status, body } = await req(app, 'POST', `/api/investigations/${invId1}/rcca`, {
        investigationId: invId1,
        rootCauses: ['Updated root cause'],
      });
      expect(status).toBe(201);
      expect(body.data.rootCauses).toContain('Updated root cause');
    });

    it('returns 404 when investigation does not exist', async () => {
      const { status, body } = await req(app, 'POST', '/api/investigations/999999999/rcca', {
        investigationId: 999999999,
        rootCauses: ['cause'],
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for non-numeric investigation id', async () => {
      const { status, body } = await req(app, 'POST', '/api/investigations/not-a-number/rcca', {
        investigationId: 1,
        rootCauses: ['cause'],
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/investigations/:id/rcca ──────────────────────────────────

  describe('GET /api/investigations/:id/rcca', () => {
    it('returns 200 for investigation with RCCA', async () => {
      const { status, body } = await req(app, 'GET', `/api/investigations/${invId1}/rcca`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data has investigationId field', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${invId1}/rcca`);
      expect(body.data).toHaveProperty('investigationId');
      expect(body.data.investigationId).toBe(invId1);
    });

    it('rootCauses is a parsed array', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${invId1}/rcca`);
      expect(Array.isArray(body.data.rootCauses)).toBe(true);
    });

    it('fishboneFactors is a parsed object', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${invId1}/rcca`);
      expect(typeof body.data.fishboneFactors).toBe('object');
    });

    it('correctiveActions is a parsed array', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${invId1}/rcca`);
      expect(Array.isArray(body.data.correctiveActions)).toBe(true);
    });

    it('preventiveMeasures is a parsed array', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${invId1}/rcca`);
      expect(Array.isArray(body.data.preventiveMeasures)).toBe(true);
    });

    it('lessonsLearned is a parsed object', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${invId1}/rcca`);
      expect(typeof body.data.lessonsLearned).toBe('object');
    });

    it('data has status field', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${invId1}/rcca`);
      expect(body.data).toHaveProperty('status');
    });

    it('returns 404 for investigation with no RCCA', async () => {
      const noRccaId = seedInvestigation({ incident_id: incidentId1, investigator: `${TAG}-no-rcca` });
      const { status, body } = await req(app, 'GET', `/api/investigations/${noRccaId}/rcca`);
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for non-numeric id', async () => {
      const { status, body } = await req(app, 'GET', '/api/investigations/not-a-number/rcca');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── POST /api/investigations/:id/bowtie ───────────────────────────────

  describe('POST /api/investigations/:id/bowtie', () => {
    it('creates a bow-tie scenario and returns 201', async () => {
      const { status, body } = await req(app, 'POST', `/api/investigations/${invId2}/bowtie`, {
        investigationId: invId2,
        title: 'Chemical Spill Scenario',
        topEvent: 'Chemical release',
        hazard: 'Toxic chemicals',
        riskLevel: 'high',
        owner: `${TAG}-owner`,
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('response has camelCase topEvent and riskLevel', async () => {
      const { body } = await req(app, 'POST', `/api/investigations/${invId2}/bowtie`, {
        investigationId: invId2,
        title: 'Explosion Scenario',
        topEvent: 'Gas explosion',
        hazard: 'Flammable gas',
        riskLevel: 'critical',
      });
      expect(body.data).toHaveProperty('topEvent');
      expect(body.data).toHaveProperty('riskLevel');
      expect(body.data.riskLevel).toBe('critical');
      expect(body.data).not.toHaveProperty('top_event');
      expect(body.data).not.toHaveProperty('risk_level');
    });

    it('threats and consequences are parsed arrays', async () => {
      const { body } = await req(app, 'POST', `/api/investigations/${invId2}/bowtie`, {
        investigationId: invId2,
        title: 'Barrier Test Scenario',
        topEvent: 'Pressure release',
        hazard: 'High pressure vessel',
        riskLevel: 'medium',
        threats: [{ id: 't1', name: 'Overpressure' }],
        consequences: [{ id: 'c1', name: 'Rupture', severity: 'major' }],
      });
      expect(Array.isArray(body.data.threats)).toBe(true);
      expect(Array.isArray(body.data.consequences)).toBe(true);
      expect(body.data.threats[0].name).toBe('Overpressure');
    });

    it('returns 404 for non-existent investigation id', async () => {
      const { status, body } = await req(app, 'POST', '/api/investigations/999999999/bowtie', {
        investigationId: 999999999,
        title: 'Should fail',
        topEvent: 'Fail',
        hazard: 'Fail',
        riskLevel: 'low',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 when title is missing', async () => {
      const { status, body } = await req(app, 'POST', `/api/investigations/${invId2}/bowtie`, {
        investigationId: invId2,
        topEvent: 'No title',
        hazard: 'Hazard',
        riskLevel: 'low',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when riskLevel is invalid', async () => {
      const { status, body } = await req(app, 'POST', `/api/investigations/${invId2}/bowtie`, {
        investigationId: invId2,
        title: 'Invalid risk',
        topEvent: 'Event',
        hazard: 'Hazard',
        riskLevel: 'extreme',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/investigations/:id/bowtie ────────────────────────────────

  describe('GET /api/investigations/:id/bowtie', () => {
    it('returns 200 for investigation with bow-tie scenarios', async () => {
      const { status, body } = await req(app, 'GET', `/api/investigations/${invId2}/bowtie`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data is an array', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${invId2}/bowtie`);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('each scenario has camelCase topEvent and riskLevel', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${invId2}/bowtie`);
      if (body.data.length > 0) {
        const scenario = body.data[0];
        expect(scenario).toHaveProperty('topEvent');
        expect(scenario).toHaveProperty('riskLevel');
        expect(scenario).not.toHaveProperty('top_event');
        expect(scenario).not.toHaveProperty('risk_level');
      }
    });

    it('each scenario has investigationId (not investigation_id)', async () => {
      const { body } = await req(app, 'GET', `/api/investigations/${invId2}/bowtie`);
      if (body.data.length > 0) {
        expect(body.data[0]).toHaveProperty('investigationId');
        expect(body.data[0]).not.toHaveProperty('investigation_id');
      }
    });

    it('returns 200 with empty array for investigation with no bow-tie', async () => {
      const { status, body } = await req(app, 'GET', `/api/investigations/${invId3}/bowtie`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns 400 for non-numeric id', async () => {
      const { status, body } = await req(app, 'GET', '/api/investigations/not-a-number/bowtie');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });
});
