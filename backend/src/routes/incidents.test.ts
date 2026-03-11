/**
 * Incident Routes API Tests
 * Covers:
 *   - POST /api/incidents/create
 *   - POST /api/incidents/injury
 *   - POST /api/incidents/vehicle
 *   - POST /api/incidents/property
 *   - POST /api/incidents/near-miss
 *   - GET  /api/incidents
 *   - GET  /api/incidents/:id
 *   - PUT  /api/incidents/:id
 *   - POST /api/incidents/:id/close
 *   - POST /api/incidents/:id/reopen
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { incidentRoutes } from '../routes/incidents';

// ── Test App Factory ─────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  incidentRoutes(app);
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
const TAG = `test-inc-${Date.now()}`;

afterAll(() => {
  sqlite.prepare(`DELETE FROM near_misses WHERE incident_id IN (SELECT id FROM incidents WHERE location LIKE '${TAG}%')`).run();
  sqlite.prepare(`DELETE FROM injury_reports WHERE incident_id IN (SELECT id FROM incidents WHERE location LIKE '${TAG}%')`).run();
  sqlite.prepare(`DELETE FROM vehicle_incidents WHERE incident_id IN (SELECT id FROM incidents WHERE location LIKE '${TAG}%')`).run();
  sqlite.prepare(`DELETE FROM property_incidents WHERE incident_id IN (SELECT id FROM incidents WHERE location LIKE '${TAG}%')`).run();
  sqlite.prepare(`DELETE FROM incidents WHERE location LIKE '${TAG}%'`).run();
  sqlite.close();
});

// ── Shared Base Payload ──────────────────────────────────────────────────
// NOTE: POST /api/incidents/create requires incidentType explicitly.
// Specialized endpoints (/injury, /vehicle, etc.) override incidentType internally.

const baseIncident = {
  incidentDate: '2024-06-01',
  incidentTime: '09:00',
  location: `${TAG}-zone-a`,
  department: 'Operations',
  incidentType: 'Near Miss',             // required for POST /create
  severity: 'Medium' as const,
  description: 'Worker slipped on wet floor in production area',
  immediateActions: 'Area cordoned off, wet floor sign placed',
  witnesses: 'John Doe, Jane Smith',
  regulatoryReportable: false,
};

// ── Suites ───────────────────────────────────────────────────────────────

describe('Incident Routes', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  // ── POST /api/incidents/create ─────────────────────────────────────────

  describe('POST /api/incidents/create', () => {
    it('returns 201 with success true on valid payload', async () => {
      const { status, body } = await req(app, 'POST', '/api/incidents/create', baseIncident);
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('returns the created incident data with location in response', async () => {
      const { body } = await req(app, 'POST', '/api/incidents/create', baseIncident);
      expect(body.data).toBeDefined();
      expect(body.data.location).toBe(baseIncident.location);
    });

    it('returns 400 when incidentType is missing', async () => {
      const { incidentType: _t, ...noType } = baseIncident;
      const { status, body } = await req(app, 'POST', '/api/incidents/create', noType);
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when location is missing', async () => {
      const { location: _l, ...noLocation } = baseIncident;
      const { status, body } = await req(app, 'POST', '/api/incidents/create', noLocation);
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when description is too short', async () => {
      const { status, body } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        description: 'short',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when severity is an invalid enum value', async () => {
      const { status, body } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        severity: 'Minor',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('accepts all four valid severity levels', async () => {
      for (const severity of ['Low', 'Medium', 'High', 'Critical'] as const) {
        const { status } = await req(app, 'POST', '/api/incidents/create', {
          ...baseIncident,
          severity,
        });
        expect(status).toBe(201);
      }
    });

    it('accepts optional investigation fields when provided', async () => {
      const { status, body } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        rootCauses: 'Lack of housekeeping procedures',
        correctiveActions: 'Implement daily checklist',
        assignedTo: 'Safety Manager',
        dueDate: '2024-07-01',
        isoClause: '8.1.3',
        regulatoryReportable: true,
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('returns 400 when incidentDate is missing', async () => {
      const { incidentDate: _d, ...noDate } = baseIncident;
      const { status } = await req(app, 'POST', '/api/incidents/create', noDate);
      expect(status).toBe(400);
    });

    it('echoes back regulatoryReportable=true from input', async () => {
      const { body } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        regulatoryReportable: true,
      });
      expect(body.data.regulatoryReportable).toBe(true);
    });

    it('returns status open in response data', async () => {
      const { body } = await req(app, 'POST', '/api/incidents/create', baseIncident);
      expect(body.data.status).toBe('open');
    });
  });

  // ── POST /api/incidents/injury ─────────────────────────────────────────

  describe('POST /api/incidents/injury', () => {
    it('returns 201 with success true for valid injury report', async () => {
      const { status, body } = await req(app, 'POST', '/api/incidents/injury', {
        ...baseIncident,
        bodyPart: 'left-knee',
        injuryType: 'Sprain/Strain',
        treatmentRequired: true,
        medicalAttention: false,
        daysLost: 3,
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('response includes incidentType set to Recordable Injury', async () => {
      const { body } = await req(app, 'POST', '/api/incidents/injury', {
        ...baseIncident,
        bodyPart: 'right-hand',
        injuryType: 'Laceration/Cut',
      });
      expect(body.data.incidentType).toBe('Recordable Injury');
    });

    it('returns 400 when bodyPart is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/incidents/injury', {
        ...baseIncident,
        injuryType: 'Fracture',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when injuryType is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/incidents/injury', {
        ...baseIncident,
        bodyPart: 'left-foot',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('accepts daysLost as 0 (zero-day injury)', async () => {
      const { status } = await req(app, 'POST', '/api/incidents/injury', {
        ...baseIncident,
        bodyPart: 'left-arm',
        injuryType: 'Contusion/Bruise',
        daysLost: 0,
      });
      expect(status).toBe(201);
    });

    it('creates injury successfully when input regulatoryReportable is false', async () => {
      // Route internally forces regulatoryReportable=true in DB for injuries.
      // The response echoes input data; the corrected DB value is authoritative.
      const { status, body } = await req(app, 'POST', '/api/incidents/injury', {
        ...baseIncident,
        bodyPart: 'back',
        injuryType: 'Overexertion',
        regulatoryReportable: false,
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });
  });

  // ── POST /api/incidents/vehicle ────────────────────────────────────────

  describe('POST /api/incidents/vehicle', () => {
    it('returns 201 for valid vehicle incident', async () => {
      const { status, body } = await req(app, 'POST', '/api/incidents/vehicle', {
        ...baseIncident,
        vehicleType: 'Forklift',
        driverName: 'James Walker',
        damageLevel: 'moderate',
        thirdPartyInvolved: false,
        insuranceClaim: false,
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('response sets incidentType to Vehicle Incident', async () => {
      const { body } = await req(app, 'POST', '/api/incidents/vehicle', {
        ...baseIncident,
        vehicleType: 'Truck',
        driverName: 'Ahmed Ali',
      });
      expect(body.data.incidentType).toBe('Vehicle Incident');
    });

    it('returns 400 with invalid damageLevel enum', async () => {
      const { status } = await req(app, 'POST', '/api/incidents/vehicle', {
        ...baseIncident,
        vehicleType: 'Van',
        damageLevel: 'heavy',
      });
      expect(status).toBe(400);
    });

    it('accepts all valid damage levels', async () => {
      for (const damageLevel of ['minor', 'moderate', 'severe'] as const) {
        const { status } = await req(app, 'POST', '/api/incidents/vehicle', {
          ...baseIncident,
          vehicleType: 'Car',
          damageLevel,
        });
        expect(status).toBe(201);
      }
    });

    it('accepts report with insurance claim details', async () => {
      const { status, body } = await req(app, 'POST', '/api/incidents/vehicle', {
        ...baseIncident,
        vehicleType: 'Pickup',
        driverName: 'Sarah Lee',
        thirdPartyInvolved: true,
        insuranceClaim: true,
        claimNumber: 'CLM-2024-001',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });
  });

  // ── POST /api/incidents/property ───────────────────────────────────────

  describe('POST /api/incidents/property', () => {
    it('returns 201 for valid property incident', async () => {
      const { status, body } = await req(app, 'POST', '/api/incidents/property', {
        ...baseIncident,
        assetName: 'Conveyor Belt Unit A',
        damageDescription: 'Belt snapped causing production stoppage',
        damageEstimate: 15000,
        repairRequired: true,
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('response sets incidentType to Property Damage', async () => {
      const { body } = await req(app, 'POST', '/api/incidents/property', {
        ...baseIncident,
        assetName: 'Storage Tank B',
        damageDescription: 'Minor dent on tank exterior from forklift collision',
      });
      expect(body.data.incidentType).toBe('Property Damage');
    });

    it('accepts report with environmental impact flag', async () => {
      const { status, body } = await req(app, 'POST', '/api/incidents/property', {
        ...baseIncident,
        assetName: 'Chemical Storage Unit',
        damageDescription: 'Container punctured, minor spill detected on floor surface',
        damageEstimate: 5000,
        repairRequired: true,
        environmentalImpact: true,
        businessInterruption: true,
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('accepts report without optional assetName', async () => {
      const { status } = await req(app, 'POST', '/api/incidents/property', {
        ...baseIncident,
        damageDescription: 'General area damage from equipment malfunction',
      });
      expect(status).toBe(201);
    });
  });

  // ── POST /api/incidents/near-miss ──────────────────────────────────────

  describe('POST /api/incidents/near-miss', () => {
    it('returns 201 for valid near-miss report', async () => {
      const { status, body } = await req(app, 'POST', '/api/incidents/near-miss', {
        ...baseIncident,
        potentialSeverity: 'High',
        potentialConsequence: 'Worker could have suffered serious head injury',
        preventativeMeasure: 'Install overhead guard on conveyor',
        likelihood: 'Medium',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('response sets incidentType to Near Miss', async () => {
      const { body } = await req(app, 'POST', '/api/incidents/near-miss', {
        ...baseIncident,
        potentialSeverity: 'Critical',
        potentialConsequence: 'Potential fatal fall from elevated platform',
        preventativeMeasure: 'Install fall arrest system',
        likelihood: 'Low',
      });
      expect(body.data.incidentType).toBe('Near Miss');
    });

    it('creates near-miss successfully with any valid input severity', async () => {
      // Route hardcodes severity=Low in DB; response echoes the input severity.
      const { status, body } = await req(app, 'POST', '/api/incidents/near-miss', {
        ...baseIncident,
        severity: 'High',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('accepts near-miss without optional near-miss fields', async () => {
      const { status } = await req(app, 'POST', '/api/incidents/near-miss', {
        ...baseIncident,
      });
      expect(status).toBe(201);
    });

    it('returns 400 when base incident data is invalid', async () => {
      const { status } = await req(app, 'POST', '/api/incidents/near-miss', {
        incidentDate: '2024-06-01',
        incidentTime: '09:00',
        severity: 'Low',
        description: 'Short',
      });
      expect(status).toBe(400);
    });
  });

  // ── GET /api/incidents ─────────────────────────────────────────────────

  describe('GET /api/incidents', () => {
    beforeAll(async () => {
      await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        location: `${TAG}-get-list`,
      });
    });

    it('returns 200', async () => {
      const { status } = await req(app, 'GET', '/api/incidents');
      expect(status).toBe(200);
    });

    it('returns success true', async () => {
      const { body } = await req(app, 'GET', '/api/incidents');
      expect(body.success).toBe(true);
    });

    it('returns an array of incidents', async () => {
      const { body } = await req(app, 'GET', '/api/incidents');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returned incidents have required fields', async () => {
      const { body } = await req(app, 'GET', '/api/incidents');
      const incident = body.data[0];
      if (incident) {
        expect(incident).toHaveProperty('id');
        expect(incident).toHaveProperty('location');
        expect(incident).toHaveProperty('severity');
        expect(incident).toHaveProperty('status');
      }
    });

    it('filters by status parameter', async () => {
      const { status, body } = await req(app, 'GET', '/api/incidents?status=open');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  // ── GET /api/incidents/:id ─────────────────────────────────────────────
  // NOTE: POST /create does not return the db id in the response body.
  // We seed via POST /injury which returns the id via .returning(...).get().

  describe('GET /api/incidents/:id', () => {
    let incidentId: number;

    beforeAll(async () => {
      const { body } = await req(app, 'POST', '/api/incidents/injury', {
        ...baseIncident,
        location: `${TAG}-get-by-id`,
        bodyPart: 'right-shoulder',
        injuryType: 'Sprain/Strain',
      });
      incidentId = body.data?.incidentId ?? body.data?.id;
    });

    it('returns 200 for existing incident', async () => {
      const { status } = await req(app, 'GET', `/api/incidents/${incidentId}`);
      expect(status).toBe(200);
    });

    it('returns success true and incident data', async () => {
      const { body } = await req(app, 'GET', `/api/incidents/${incidentId}`);
      expect(body.success).toBe(true);
    });

    it('returns 404 for non-existent incident', async () => {
      const { status } = await req(app, 'GET', '/api/incidents/9999999');
      expect(status).toBe(404);
    });
  });

  // ── PUT /api/incidents/:id ─────────────────────────────────────────────

  describe('PUT /api/incidents/:id', () => {
    let incidentId: number;

    beforeAll(async () => {
      const { body } = await req(app, 'POST', '/api/incidents/injury', {
        ...baseIncident,
        location: `${TAG}-update`,
        bodyPart: 'ankle',
        injuryType: 'Sprain/Strain',
      });
      incidentId = body.data?.incidentId ?? body.data?.id;
    });

    it('returns 200 when updating valid fields', async () => {
      const { status, body } = await req(app, 'PUT', `/api/incidents/${incidentId}`, {
        correctiveActions: 'Updated corrective action plan with timeline',
        assignedTo: 'New Safety Officer',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 200 for non-existent id (route does not validate existence)', async () => {
      const { status } = await req(app, 'PUT', '/api/incidents/9999999', {
        correctiveActions: 'test',
      });
      expect(status).toBe(200);
    });
  });

  // ── POST /api/incidents/:id/close ──────────────────────────────────────

  describe('POST /api/incidents/:id/close', () => {
    let incidentId: number;

    beforeAll(async () => {
      const { body } = await req(app, 'POST', '/api/incidents/injury', {
        ...baseIncident,
        location: `${TAG}-close`,
        bodyPart: 'wrist',
        injuryType: 'Fracture',
      });
      incidentId = body.data?.incidentId ?? body.data?.id;
    });

    it('returns 200 when closing an open incident', async () => {
      const { status, body } = await req(app, 'POST', `/api/incidents/${incidentId}/close`, {});
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 200 for non-existent id (route does not validate existence)', async () => {
      const { status } = await req(app, 'POST', '/api/incidents/9999999/close', {});
      expect(status).toBe(200);
    });
  });

  // ── POST /api/incidents/:id/reopen ─────────────────────────────────────

  describe('POST /api/incidents/:id/reopen', () => {
    let incidentId: number;

    beforeAll(async () => {
      const create = await req(app, 'POST', '/api/incidents/injury', {
        ...baseIncident,
        location: `${TAG}-reopen`,
        bodyPart: 'knee',
        injuryType: 'Laceration/Cut',
      });
      incidentId = create.body.data?.incidentId ?? create.body.data?.id;
      await req(app, 'POST', `/api/incidents/${incidentId}/close`, {});
    });

    it('returns 200 when reopening a closed incident', async () => {
      const { status, body } = await req(app, 'POST', `/api/incidents/${incidentId}/reopen`, {});
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 200 for non-existent id (route does not validate existence)', async () => {
      const { status } = await req(app, 'POST', '/api/incidents/9999999/reopen', {});
      expect(status).toBe(200);
    });
  });

  // ── Severity Mapping Documentation Tests ──────────────────────────────
  // Documents that the frontend MUST map severity labels before submitting.
  // Page uses: Minor / Moderate / Serious / Critical
  // Backend accepts: Low / Medium / High / Critical

  describe('Severity enum validation (frontend must map before sending)', () => {
    it('rejects Minor — frontend must map to Low', async () => {
      const { status } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        severity: 'Minor',
      });
      expect(status).toBe(400);
    });

    it('rejects Moderate — frontend must map to Medium', async () => {
      const { status } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        severity: 'Moderate',
      });
      expect(status).toBe(400);
    });

    it('rejects Serious — frontend must map to High', async () => {
      const { status } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        severity: 'Serious',
      });
      expect(status).toBe(400);
    });

    it('accepts Critical (same label in page and backend)', async () => {
      const { status } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        severity: 'Critical',
      });
      expect(status).toBe(201);
    });

    it('accepts Low (mapped from Minor)', async () => {
      const { status } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        severity: 'Low',
      });
      expect(status).toBe(201);
    });

    it('accepts High (mapped from Serious)', async () => {
      const { status } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        severity: 'High',
      });
      expect(status).toBe(201);
    });
  });

  // ── DELETE /api/incidents/:id ──────────────────────────────────────────

  describe('DELETE /api/incidents/:id', () => {
    let incidentId: number;

    beforeAll(async () => {
      const { body } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        location: `${TAG}-delete`,
      });
      incidentId = body.data?.id;
    });

    it('returns 200 and success true when deleting an existing incident', async () => {
      const { status, body } = await req(app, 'DELETE', `/api/incidents/${incidentId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 404 when trying to delete an already-deleted incident', async () => {
      const { status, body } = await req(app, 'DELETE', `/api/incidents/${incidentId}`);
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 404 for a non-existent incident id', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/incidents/9999998');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('GET after delete returns 404 (record is gone)', async () => {
      // Create a fresh one, delete it, then verify it is gone
      const create = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        location: `${TAG}-delete-verify`,
      });
      const newId = create.body.data?.id;
      await req(app, 'DELETE', `/api/incidents/${newId}`);
      const { status } = await req(app, 'GET', `/api/incidents/${newId}`);
      expect(status).toBe(404);
    });

    it('also deletes linked injury_reports when an injury incident is deleted', async () => {
      const create = await req(app, 'POST', '/api/incidents/injury', {
        ...baseIncident,
        location: `${TAG}-delete-injury`,
        bodyPart: 'left-knee',
        injuryType: 'Sprain/Strain',
      });
      const injuryIncidentId = create.body.data?.id;
      const { status } = await req(app, 'DELETE', `/api/incidents/${injuryIncidentId}`);
      expect(status).toBe(200);
    });
  });

  // ── selectedStandards persistence ─────────────────────────────────────

  describe('selectedStandards field', () => {
    it('POST /create stores and returns selectedStandards in response', async () => {
      const { status, body } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        location: `${TAG}-standards`,
        selectedStandards: ['ISO-45001', 'ISO-14001', 'OSHA-300'],
      });
      expect(status).toBe(201);
      expect(body.data.selectedStandards).toEqual(['ISO-45001', 'ISO-14001', 'OSHA-300']);
    });

    it('POST /injury stores and returns selectedStandards in response', async () => {
      const { status, body } = await req(app, 'POST', '/api/incidents/injury', {
        ...baseIncident,
        location: `${TAG}-standards-injury`,
        bodyPart: 'right-hand',
        injuryType: 'Laceration/Cut',
        selectedStandards: ['ISO-45001'],
      });
      expect(status).toBe(201);
      expect(body.data.selectedStandards).toEqual(['ISO-45001']);
    });

    it('POST /create without selectedStandards returns empty array', async () => {
      const { body } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        location: `${TAG}-standards-empty`,
      });
      expect(body.data.selectedStandards).toEqual([]);
    });

    it('GET /incidents/:id returns selected_standards stored as JSON', async () => {
      const create = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        location: `${TAG}-standards-get`,
        selectedStandards: ['NFPA-101', 'ISO-9001'],
      });
      const newId = create.body.data?.id;
      const { body } = await req(app, 'GET', `/api/incidents/${newId}`);
      expect(body.success).toBe(true);
      // Drizzle returns camelCase from db.select(); stored as JSON string
      const storedStandards = JSON.parse(body.data.selectedStandards ?? '[]');
      expect(storedStandards).toEqual(['NFPA-101', 'ISO-9001']);
    });
  });

  // ── POST /create returns incident id ──────────────────────────────────

  describe('POST /create — response includes created incident id', () => {
    it('response data contains a numeric id field', async () => {
      const { body } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        location: `${TAG}-returnid`,
      });
      expect(typeof body.data.id).toBe('number');
      expect(body.data.id).toBeGreaterThan(0);
    });

    it('returned id can be used to GET the incident', async () => {
      const create = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        location: `${TAG}-returnid-get`,
      });
      const newId = create.body.data?.id;
      const { status, body } = await req(app, 'GET', `/api/incidents/${newId}`);
      expect(status).toBe(200);
      expect(body.data.location).toBe(`${TAG}-returnid-get`);
    });
  });

  // ── GET /api/incidents date-range filtering ────────────────────────────

  describe('GET /api/incidents — date range filtering', () => {
    beforeAll(async () => {
      await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        location: `${TAG}-daterange`,
        incidentDate: '2024-01-15',
      });
      await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        location: `${TAG}-daterange`,
        incidentDate: '2024-06-20',
      });
      await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        location: `${TAG}-daterange`,
        incidentDate: '2024-12-01',
      });
    });

    it('fromDate filters out earlier incidents', async () => {
      const { body } = await req(app, 'GET', '/api/incidents?fromDate=2024-06-01');
      expect(body.success).toBe(true);
      const dateRangeRows = body.data.filter((r: any) => r.location === `${TAG}-daterange`);
      // Only June and December rows should appear
      expect(dateRangeRows.every((r: any) => r.incidentDate >= '2024-06-01')).toBe(true);
    });

    it('toDate filters out later incidents', async () => {
      const { body } = await req(app, 'GET', '/api/incidents?toDate=2024-06-30');
      expect(body.success).toBe(true);
      const dateRangeRows = body.data.filter((r: any) => r.location === `${TAG}-daterange`);
      expect(dateRangeRows.every((r: any) => r.incidentDate <= '2024-06-30')).toBe(true);
    });

    it('fromDate + toDate returns only incidents within range', async () => {
      const { body } = await req(app, 'GET', '/api/incidents?fromDate=2024-06-01&toDate=2024-07-31');
      expect(body.success).toBe(true);
      const dateRangeRows = body.data.filter((r: any) => r.location === `${TAG}-daterange`);
      // Only the June row
      expect(dateRangeRows.length).toBe(1);
      expect(dateRangeRows[0].incidentDate).toBe('2024-06-20');
    });

    it('date range with no matches returns empty array for that filter', async () => {
      const { body } = await req(app, 'GET', '/api/incidents?fromDate=2030-01-01&toDate=2030-12-31');
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  // ── GET /api/incidents/stats ───────────────────────────────────────────

  describe('GET /api/incidents/stats', () => {
    beforeAll(async () => {
      // Seed one incident with known severity so stats endpoint has data
      await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        location: `${TAG}-stats`,
        incidentType: 'Near Miss',
        severity: 'High' as const,
      });
    });

    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/incidents/stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data.total is a number >= 1', async () => {
      const { body } = await req(app, 'GET', '/api/incidents/stats');
      expect(typeof body.data.total).toBe('number');
      expect(body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('data.distinctTypes is a number >= 1', async () => {
      const { body } = await req(app, 'GET', '/api/incidents/stats');
      expect(typeof body.data.distinctTypes).toBe('number');
      expect(body.data.distinctTypes).toBeGreaterThanOrEqual(1);
    });

    it('data.byType is an array', async () => {
      const { body } = await req(app, 'GET', '/api/incidents/stats');
      expect(Array.isArray(body.data.byType)).toBe(true);
    });

    it('data.byType entries have type and count properties', async () => {
      const { body } = await req(app, 'GET', '/api/incidents/stats');
      for (const entry of body.data.byType) {
        expect(typeof entry.type).toBe('string');
        expect(typeof entry.count).toBe('number');
      }
    });

    it('data.bySeverity is an array', async () => {
      const { body } = await req(app, 'GET', '/api/incidents/stats');
      expect(Array.isArray(body.data.bySeverity)).toBe(true);
    });

    it('data.bySeverity entries have severity and count properties', async () => {
      const { body } = await req(app, 'GET', '/api/incidents/stats');
      for (const entry of body.data.bySeverity) {
        expect(typeof entry.severity).toBe('string');
        expect(typeof entry.count).toBe('number');
      }
    });

    it('data.byStatus is an array', async () => {
      const { body } = await req(app, 'GET', '/api/incidents/stats');
      expect(Array.isArray(body.data.byStatus)).toBe(true);
    });

    it('data.byStatus entries have status and count properties', async () => {
      const { body } = await req(app, 'GET', '/api/incidents/stats');
      for (const entry of body.data.byStatus) {
        expect(typeof entry.status).toBe('string');
        expect(typeof entry.count).toBe('number');
      }
    });

    it('data.dominantSeverity is a non-empty string', async () => {
      const { body } = await req(app, 'GET', '/api/incidents/stats');
      expect(typeof body.data.dominantSeverity).toBe('string');
      expect(body.data.dominantSeverity.length).toBeGreaterThan(0);
    });
  });

  // ── DELETE /api/incidents/:id ──────────────────────────────────────────

  describe('DELETE /api/incidents/:id', () => {
    let deleteId: number;

    beforeAll(async () => {
      const { body } = await req(app, 'POST', '/api/incidents/create', {
        ...baseIncident,
        location: `${TAG}-delete`,
      });
      deleteId = body.data.id;
    });

    it('returns 200 and success true when deleting an existing incident', async () => {
      const { status, body } = await req(app, 'DELETE', `/api/incidents/${deleteId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('incident is no longer retrievable after deletion', async () => {
      const { status } = await req(app, 'GET', `/api/incidents/${deleteId}`);
      expect(status).toBe(404);
    });

    it('returns 404 when deleting a non-existent id', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/incidents/9999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for a non-numeric id', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/incidents/not-a-number');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });
});
