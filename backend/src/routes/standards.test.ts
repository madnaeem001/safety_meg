/**
 * Standards Routes Test Suite
 *
 * Covers:
 *   GET    /api/standards/international/stats
 *   GET    /api/standards/international
 *   POST   /api/standards/international
 *   GET    /api/standards/:id
 *   PUT    /api/standards/:id
 *   DELETE /api/standards/:id
 *
 *   GET    /api/nfpa/stats
 *   GET    /api/nfpa/codes
 *   POST   /api/nfpa/codes
 *   GET    /api/nfpa/codes/:id
 *   PUT    /api/nfpa/codes/:id
 *   DELETE /api/nfpa/codes/:id
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { standardsRoutes } from '../routes/standards';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  standardsRoutes(app);
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

afterAll(() => {
  sqlite.prepare(`DELETE FROM international_standards WHERE standard_code LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM nfpa_codes WHERE code_number LIKE '${TAG}%'`).run();
  sqlite.close();
});

function seedStd(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO international_standards
      (standard_code, standard_name, version, issuer, category, description,
       clauses, applicable_sectors, certification_required, valid_from, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.standard_code      ?? `${TAG}-ISO-001`,
    overrides.standard_name      ?? 'Test Standard Name',
    overrides.version            ?? '2023',
    overrides.issuer             ?? 'ISO',
    overrides.category           ?? 'quality',
    overrides.description        ?? 'Test standard description',
    overrides.clauses            ?? JSON.stringify([{ id: 'cl-1', title: 'Clause 1' }]),
    overrides.applicable_sectors ?? JSON.stringify(['manufacturing', 'services']),
    overrides.certification_required ?? 0,
    overrides.valid_from         ?? '2023-01-01',
    overrides.last_updated       ?? ts,
  );
  return Number(result.lastInsertRowid);
}

function seedNfpa(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO nfpa_codes
      (code_number, title, edition, category, hazard_level, description,
       requirements, applicable_industries, effective_date, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.code_number           ?? `${TAG}-NFPA-001`,
    overrides.title                 ?? 'Test NFPA Code Title',
    overrides.edition               ?? '2021',
    overrides.category              ?? 'fire-protection',
    overrides.hazard_level          ?? 'high',
    overrides.description           ?? 'Test NFPA description',
    overrides.requirements          ?? JSON.stringify([{ id: 'req-1', text: 'Requirement text' }]),
    overrides.applicable_industries ?? JSON.stringify(['commercial', 'industrial']),
    overrides.effective_date        ?? '2021-01-01',
    overrides.last_updated          ?? ts,
  );
  return Number(result.lastInsertRowid);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Standards Routes', () => {
  let app: Hono;
  let stdId1: number;
  let stdId2: number;
  let certStdId: number;
  let nfpaId1: number;
  let nfpaId2: number;

  beforeAll(() => {
    app = createTestApp();
    stdId1    = seedStd({ standard_code: `${TAG}-ISO-001`, issuer: 'ISO',  category: 'quality',      certification_required: 0, standard_name: 'Quality Mgmt System' });
    stdId2    = seedStd({ standard_code: `${TAG}-IEC-002`, issuer: 'IEC',  category: 'health-safety', certification_required: 0, standard_name: 'EHS Standard' });
    certStdId = seedStd({ standard_code: `${TAG}-ANSI-003`, issuer: 'ANSI', category: 'fire',          certification_required: 1, standard_name: 'Fire Safety Standard' });
    nfpaId1   = seedNfpa({ code_number: `${TAG}-NFPA-001`, category: 'fire-protection', hazard_level: 'high',   title: 'NFPA Fire Code' });
    nfpaId2   = seedNfpa({ code_number: `${TAG}-NFPA-002`, category: 'electrical',      hazard_level: 'medium', title: 'NFPA Electrical Code' });
  });

  // ── GET /api/standards/international/stats ─────────────────────────────

  describe('GET /api/standards/international/stats', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/standards/international/stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data has total property as a number', async () => {
      const { body } = await req(app, 'GET', '/api/standards/international/stats');
      expect(typeof body.data.total).toBe('number');
      expect(body.data.total).toBeGreaterThanOrEqual(3);
    });

    it('data has byCategory array', async () => {
      const { body } = await req(app, 'GET', '/api/standards/international/stats');
      expect(Array.isArray(body.data.byCategory)).toBe(true);
    });

    it('data has byIssuer array', async () => {
      const { body } = await req(app, 'GET', '/api/standards/international/stats');
      expect(Array.isArray(body.data.byIssuer)).toBe(true);
    });

    it('data has requireCertification as a number', async () => {
      const { body } = await req(app, 'GET', '/api/standards/international/stats');
      expect(typeof body.data.requireCertification).toBe('number');
      expect(body.data.requireCertification).toBeGreaterThanOrEqual(1);
    });
  });

  // ── POST /api/standards/international ─────────────────────────────────

  describe('POST /api/standards/international', () => {
    it('creates a standard and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/standards/international', {
        standardCode: `${TAG}-NEW-001`,
        standardName: 'New Test Standard',
        issuer: 'ISO',
        category: 'quality',
        version: '2024',
        description: 'Created in test',
        certificationRequired: false,
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      // cleanup
      sqlite.prepare('DELETE FROM international_standards WHERE standard_code = ?').run(`${TAG}-NEW-001`);
    });

    it('returns camelCase standardCode in response', async () => {
      const code = `${TAG}-CAMCASE-001`;
      const { body } = await req(app, 'POST', '/api/standards/international', {
        standardCode: code,
        standardName: 'CamelCase Test',
      });
      expect(body.data.standardCode).toBe(code);
      expect(body.data).not.toHaveProperty('standard_code');
      sqlite.prepare('DELETE FROM international_standards WHERE standard_code = ?').run(code);
    });

    it('returns title (not standard_name) in response', async () => {
      const code = `${TAG}-TITLE-001`;
      const { body } = await req(app, 'POST', '/api/standards/international', {
        standardCode: code,
        standardName: 'Title Field Test',
      });
      expect(body.data.title).toBe('Title Field Test');
      expect(body.data).not.toHaveProperty('standard_name');
      sqlite.prepare('DELETE FROM international_standards WHERE standard_code = ?').run(code);
    });

    it('returns issuingBody (not issuer) in response', async () => {
      const code = `${TAG}-ISSUER-001`;
      const { body } = await req(app, 'POST', '/api/standards/international', {
        standardCode: code,
        standardName: 'Issuer Test',
        issuer: 'BSI',
      });
      expect(body.data.issuingBody).toBe('BSI');
      expect(body.data).not.toHaveProperty('issuer');
      sqlite.prepare('DELETE FROM international_standards WHERE standard_code = ?').run(code);
    });

    it('returns applicableIndustries array in response', async () => {
      const code = `${TAG}-SECTORS-001`;
      const { body } = await req(app, 'POST', '/api/standards/international', {
        standardCode: code,
        standardName: 'Sectors Test',
        applicableSectors: ['manufacturing', 'healthcare'],
      });
      expect(Array.isArray(body.data.applicableIndustries)).toBe(true);
      sqlite.prepare('DELETE FROM international_standards WHERE standard_code = ?').run(code);
    });

    it('returns 400 when standardCode is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/standards/international', {
        standardName: 'Missing Code',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when standardName is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/standards/international', {
        standardCode: `${TAG}-NONAME`,
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/standards/international ──────────────────────────────────

  describe('GET /api/standards/international', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/standards/international');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data is an array', async () => {
      const { body } = await req(app, 'GET', '/api/standards/international');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('includes total count', async () => {
      const { body } = await req(app, 'GET', '/api/standards/international');
      expect(typeof body.total).toBe('number');
      expect(body.total).toBeGreaterThanOrEqual(3);
    });

    it('each item has camelCase standardCode (not standard_code)', async () => {
      const { body } = await req(app, 'GET', '/api/standards/international');
      const seeded = body.data.find((s: any) => s.standardCode === `${TAG}-ISO-001`);
      expect(seeded).toBeDefined();
      expect(seeded).not.toHaveProperty('standard_code');
    });

    it('each item has title (not standard_name)', async () => {
      const { body } = await req(app, 'GET', '/api/standards/international');
      const seeded = body.data.find((s: any) => s.standardCode === `${TAG}-ISO-001`);
      expect(seeded?.title).toBe('Quality Mgmt System');
      expect(seeded).not.toHaveProperty('standard_name');
    });

    it('each item has issuingBody (not issuer)', async () => {
      const { body } = await req(app, 'GET', '/api/standards/international');
      const seeded = body.data.find((s: any) => s.standardCode === `${TAG}-ISO-001`);
      expect(seeded?.issuingBody).toBe('ISO');
      expect(seeded).not.toHaveProperty('issuer');
    });

    it('filter by category returns only matching records', async () => {
      const { body } = await req(app, 'GET', '/api/standards/international?category=quality');
      const tagRecords = body.data.filter((s: any) => s.standardCode?.startsWith(TAG));
      expect(tagRecords.length).toBe(1);
      expect(tagRecords[0].standardCode).toBe(`${TAG}-ISO-001`);
    });

    it('filter by issuer returns only matching records', async () => {
      const { body } = await req(app, 'GET', '/api/standards/international?issuer=IEC');
      const tagRecords = body.data.filter((s: any) => s.standardCode?.startsWith(TAG));
      expect(tagRecords.length).toBe(1);
      expect(tagRecords[0].issuingBody).toBe('IEC');
    });

    it('filter by search matches standard code', async () => {
      const { body } = await req(app, 'GET', `/api/standards/international?search=${TAG}-ISO`);
      const tagRecords = body.data.filter((s: any) => s.standardCode?.startsWith(TAG));
      expect(tagRecords.length).toBeGreaterThanOrEqual(1);
      expect(tagRecords[0].standardCode).toContain(`${TAG}-ISO`);
    });

    it('filter certRequired=true returns only certification-required records', async () => {
      const { body } = await req(app, 'GET', '/api/standards/international?certRequired=true');
      const tagRecords = body.data.filter((s: any) => s.standardCode?.startsWith(TAG));
      expect(tagRecords.every((s: any) => s.certificationRequired === true)).toBe(true);
    });
  });

  // ── GET /api/standards/:id ─────────────────────────────────────────────

  describe('GET /api/standards/:id', () => {
    it('returns 200 for existing standard', async () => {
      const { status, body } = await req(app, 'GET', `/api/standards/${stdId1}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data has camelCase standardCode', async () => {
      const { body } = await req(app, 'GET', `/api/standards/${stdId1}`);
      expect(body.data.standardCode).toBe(`${TAG}-ISO-001`);
      expect(body.data).not.toHaveProperty('standard_code');
    });

    it('data has title (not standard_name)', async () => {
      const { body } = await req(app, 'GET', `/api/standards/${stdId1}`);
      expect(body.data.title).toBe('Quality Mgmt System');
      expect(body.data).not.toHaveProperty('standard_name');
    });

    it('data has issuingBody (not issuer)', async () => {
      const { body } = await req(app, 'GET', `/api/standards/${stdId1}`);
      expect(body.data.issuingBody).toBe('ISO');
      expect(body.data).not.toHaveProperty('issuer');
    });

    it('data has applicableIndustries array', async () => {
      const { body } = await req(app, 'GET', `/api/standards/${stdId1}`);
      expect(Array.isArray(body.data.applicableIndustries)).toBe(true);
    });

    it('data has certificationRequired boolean', async () => {
      const { body } = await req(app, 'GET', `/api/standards/${certStdId}`);
      expect(body.data.certificationRequired).toBe(true);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'GET', '/api/standards/999999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── PUT /api/standards/:id ──────────────────────────────────────────────

  describe('PUT /api/standards/:id', () => {
    it('returns 200 on valid update', async () => {
      const { status, body } = await req(app, 'PUT', `/api/standards/${stdId2}`, {
        description: 'Updated description',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('updated field is reflected in response', async () => {
      const { body } = await req(app, 'PUT', `/api/standards/${stdId2}`, {
        description: 'Updated via PUT test',
      });
      expect(body.data.description).toBe('Updated via PUT test');
    });

    it('response has camelCase standardCode (not standard_code)', async () => {
      const { body } = await req(app, 'PUT', `/api/standards/${stdId2}`, {
        description: 'Check camelCase',
      });
      expect(body.data).toHaveProperty('standardCode');
      expect(body.data).not.toHaveProperty('standard_code');
    });

    it('response has title (not standard_name)', async () => {
      const { body } = await req(app, 'PUT', `/api/standards/${stdId2}`, {
        description: 'Check title field',
      });
      expect(body.data).toHaveProperty('title');
      expect(body.data).not.toHaveProperty('standard_name');
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/standards/999999999', {
        description: 'Should not update',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 when no valid fields provided', async () => {
      const { status, body } = await req(app, 'PUT', `/api/standards/${stdId2}`, {
        unknownField: 'value',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── DELETE /api/standards/:id ──────────────────────────────────────────

  describe('DELETE /api/standards/:id', () => {
    it('returns 200 and success for existing standard', async () => {
      const deleteId = seedStd({ standard_code: `${TAG}-DEL-001`, standard_name: 'Delete Me' });
      const { status, body } = await req(app, 'DELETE', `/api/standards/${deleteId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 404 after already deleted', async () => {
      const deleteId = seedStd({ standard_code: `${TAG}-DEL-002`, standard_name: 'Delete Me 2' });
      await req(app, 'DELETE', `/api/standards/${deleteId}`);
      const { status, body } = await req(app, 'DELETE', `/api/standards/${deleteId}`);
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/standards/999999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/nfpa/stats ────────────────────────────────────────────────

  describe('GET /api/nfpa/stats', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/nfpa/stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data has total as a number', async () => {
      const { body } = await req(app, 'GET', '/api/nfpa/stats');
      expect(typeof body.data.total).toBe('number');
      expect(body.data.total).toBeGreaterThanOrEqual(2);
    });

    it('data has byCategory array', async () => {
      const { body } = await req(app, 'GET', '/api/nfpa/stats');
      expect(Array.isArray(body.data.byCategory)).toBe(true);
    });

    it('data has byHazardLevel array', async () => {
      const { body } = await req(app, 'GET', '/api/nfpa/stats');
      expect(Array.isArray(body.data.byHazardLevel)).toBe(true);
    });
  });

  // ── POST /api/nfpa/codes ───────────────────────────────────────────────

  describe('POST /api/nfpa/codes', () => {
    it('creates an NFPA code and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/nfpa/codes', {
        codeNumber: `${TAG}-NFPA-NEW`,
        title: 'New NFPA Code',
        category: 'fire-protection',
        hazardLevel: 'high',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      sqlite.prepare('DELETE FROM nfpa_codes WHERE code_number = ?').run(`${TAG}-NFPA-NEW`);
    });

    it('returns camelCase codeNumber (not code_number) in response', async () => {
      const code = `${TAG}-NFPA-CC1`;
      const { body } = await req(app, 'POST', '/api/nfpa/codes', {
        codeNumber: code,
        title: 'CamelCase NFPA',
      });
      expect(body.data.codeNumber).toBe(code);
      expect(body.data).not.toHaveProperty('code_number');
      sqlite.prepare('DELETE FROM nfpa_codes WHERE code_number = ?').run(code);
    });

    it('returns hazardLevel (not hazard_level) in response', async () => {
      const code = `${TAG}-NFPA-HAZARD`;
      const { body } = await req(app, 'POST', '/api/nfpa/codes', {
        codeNumber: code,
        title: 'Hazard Level Test',
        hazardLevel: 'critical',
      });
      expect(body.data.hazardLevel).toBe('critical');
      expect(body.data).not.toHaveProperty('hazard_level');
      sqlite.prepare('DELETE FROM nfpa_codes WHERE code_number = ?').run(code);
    });

    it('requirements is a parsed JSON array in response', async () => {
      const code = `${TAG}-NFPA-REQ`;
      const { body } = await req(app, 'POST', '/api/nfpa/codes', {
        codeNumber: code,
        title: 'Requirements Test',
        requirements: [{ id: 'r1', text: 'Do this' }],
      });
      expect(Array.isArray(body.data.requirements)).toBe(true);
      expect(body.data.requirements[0].id).toBe('r1');
      sqlite.prepare('DELETE FROM nfpa_codes WHERE code_number = ?').run(code);
    });

    it('applicableIndustries is a parsed JSON array in response', async () => {
      const code = `${TAG}-NFPA-IND`;
      const { body } = await req(app, 'POST', '/api/nfpa/codes', {
        codeNumber: code,
        title: 'Industries Test',
        applicableIndustries: ['commercial', 'industrial'],
      });
      expect(Array.isArray(body.data.applicableIndustries)).toBe(true);
      expect(body.data.applicableIndustries).toContain('commercial');
      sqlite.prepare('DELETE FROM nfpa_codes WHERE code_number = ?').run(code);
    });

    it('returns 400 when codeNumber is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/nfpa/codes', {
        title: 'No Code Number',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when title is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/nfpa/codes', {
        codeNumber: `${TAG}-NFPA-NOTITLE`,
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/nfpa/codes ────────────────────────────────────────────────

  describe('GET /api/nfpa/codes', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/nfpa/codes');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data is an array', async () => {
      const { body } = await req(app, 'GET', '/api/nfpa/codes');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('includes total count', async () => {
      const { body } = await req(app, 'GET', '/api/nfpa/codes');
      expect(typeof body.total).toBe('number');
      expect(body.total).toBeGreaterThanOrEqual(2);
    });

    it('each item has codeNumber (not code_number)', async () => {
      const { body } = await req(app, 'GET', '/api/nfpa/codes');
      const seeded = body.data.find((n: any) => n.codeNumber === `${TAG}-NFPA-001`);
      expect(seeded).toBeDefined();
      expect(seeded).not.toHaveProperty('code_number');
    });

    it('each item has hazardLevel (not hazard_level)', async () => {
      const { body } = await req(app, 'GET', '/api/nfpa/codes');
      const seeded = body.data.find((n: any) => n.codeNumber === `${TAG}-NFPA-001`);
      expect(seeded?.hazardLevel).toBe('high');
      expect(seeded).not.toHaveProperty('hazard_level');
    });

    it('filter by category returns only matching records', async () => {
      const { body } = await req(app, 'GET', '/api/nfpa/codes?category=electrical');
      const tagRecords = body.data.filter((n: any) => n.codeNumber?.startsWith(TAG));
      expect(tagRecords.length).toBe(1);
      expect(tagRecords[0].category).toBe('electrical');
    });

    it('filter by hazardLevel returns only matching records', async () => {
      const { body } = await req(app, 'GET', '/api/nfpa/codes?hazardLevel=high');
      const tagRecords = body.data.filter((n: any) => n.codeNumber?.startsWith(TAG));
      expect(tagRecords.length).toBe(1);
      expect(tagRecords[0].hazardLevel).toBe('high');
    });

    it('filter by search matches code number', async () => {
      const { body } = await req(app, 'GET', `/api/nfpa/codes?search=${TAG}-NFPA-001`);
      const tagRecords = body.data.filter((n: any) => n.codeNumber?.startsWith(TAG));
      expect(tagRecords.length).toBeGreaterThanOrEqual(1);
      expect(tagRecords[0].codeNumber).toContain(`${TAG}-NFPA-001`);
    });
  });

  // ── GET /api/nfpa/codes/:id ────────────────────────────────────────────

  describe('GET /api/nfpa/codes/:id', () => {
    it('returns 200 for existing NFPA code', async () => {
      const { status, body } = await req(app, 'GET', `/api/nfpa/codes/${nfpaId1}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data has codeNumber (not code_number)', async () => {
      const { body } = await req(app, 'GET', `/api/nfpa/codes/${nfpaId1}`);
      expect(body.data.codeNumber).toBe(`${TAG}-NFPA-001`);
      expect(body.data).not.toHaveProperty('code_number');
    });

    it('data has hazardLevel (not hazard_level)', async () => {
      const { body } = await req(app, 'GET', `/api/nfpa/codes/${nfpaId1}`);
      expect(body.data.hazardLevel).toBe('high');
      expect(body.data).not.toHaveProperty('hazard_level');
    });

    it('data has requirements as parsed array', async () => {
      const { body } = await req(app, 'GET', `/api/nfpa/codes/${nfpaId1}`);
      expect(Array.isArray(body.data.requirements)).toBe(true);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'GET', '/api/nfpa/codes/999999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ── PUT /api/nfpa/codes/:id ────────────────────────────────────────────

  describe('PUT /api/nfpa/codes/:id', () => {
    it('returns 200 on valid update', async () => {
      const { status, body } = await req(app, 'PUT', `/api/nfpa/codes/${nfpaId2}`, {
        description: 'Updated NFPA description',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('updated field is reflected in response', async () => {
      const { body } = await req(app, 'PUT', `/api/nfpa/codes/${nfpaId2}`, {
        description: 'Updated via PUT NFPA test',
      });
      expect(body.data.description).toBe('Updated via PUT NFPA test');
    });

    it('response has codeNumber (not code_number)', async () => {
      const { body } = await req(app, 'PUT', `/api/nfpa/codes/${nfpaId2}`, {
        description: 'Check codeNumber camelCase',
      });
      expect(body.data).toHaveProperty('codeNumber');
      expect(body.data).not.toHaveProperty('code_number');
    });

    it('response has hazardLevel (not hazard_level)', async () => {
      const { body } = await req(app, 'PUT', `/api/nfpa/codes/${nfpaId2}`, {
        description: 'Check hazardLevel camelCase',
      });
      expect(body.data).toHaveProperty('hazardLevel');
      expect(body.data).not.toHaveProperty('hazard_level');
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/nfpa/codes/999999999', {
        description: 'Should not update',
      });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 when no valid fields provided', async () => {
      const { status, body } = await req(app, 'PUT', `/api/nfpa/codes/${nfpaId2}`, {
        unknownField: 'value',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── DELETE /api/nfpa/codes/:id ─────────────────────────────────────────

  describe('DELETE /api/nfpa/codes/:id', () => {
    it('returns 200 and success for existing NFPA code', async () => {
      const deleteId = seedNfpa({ code_number: `${TAG}-NFPA-DEL-001`, title: 'Delete Me NFPA' });
      const { status, body } = await req(app, 'DELETE', `/api/nfpa/codes/${deleteId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 404 after already deleted', async () => {
      const deleteId = seedNfpa({ code_number: `${TAG}-NFPA-DEL-002`, title: 'Delete Me NFPA 2' });
      await req(app, 'DELETE', `/api/nfpa/codes/${deleteId}`);
      const { status, body } = await req(app, 'DELETE', `/api/nfpa/codes/${deleteId}`);
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 404 for non-existent id', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/nfpa/codes/999999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });
  });
});
