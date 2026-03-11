/**
 * Standard Certifications Routes Test Suite
 *
 * Covers:
 *   GET    /api/standard-certifications/stats
 *   GET    /api/standard-certifications
 *   POST   /api/standard-certifications
 *   GET    /api/standard-certifications/:id
 *   PUT    /api/standard-certifications/:id
 *   DELETE /api/standard-certifications/:id
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { standardCertificationsRoutes } from '../routes/standard-certifications';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  standardCertificationsRoutes(app);
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
const TAG = `testsc-${Date.now()}`;

afterAll(() => {
  sqlite.prepare(`DELETE FROM standard_certifications WHERE standard_id LIKE '${TAG}%'`).run();
});

function seedCert(overrides: Record<string, any> = {}): number {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO standard_certifications
      (standard_id, standard_code, standard_title, status,
       certification_body, certificate_number, initial_cert_date,
       expiry_date, last_surveillance_date, next_surveillance_date,
       scope, locations, overall_score, clause_scores, non_conformities, audit_history,
       created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.standard_id      ?? `${TAG}-std-1`,
    overrides.standard_code    ?? `${TAG}-CODE`,
    overrides.standard_title   ?? 'Test Standard Title',
    overrides.status           ?? 'certified',
    overrides.certification_body ?? 'Bureau Veritas',
    overrides.certificate_number ?? 'CERT-001',
    overrides.initial_cert_date  ?? '2024-01-01',
    overrides.expiry_date        ?? '2027-01-01',
    overrides.last_surveillance_date  ?? '2025-01-01',
    overrides.next_surveillance_date  ?? '2026-01-01',
    overrides.scope            ?? JSON.stringify(['Scope A', 'Scope B']),
    overrides.locations        ?? JSON.stringify(['Plant - Chicago']),
    overrides.overall_score    ?? 88,
    overrides.clause_scores    ?? JSON.stringify([{ clauseId: 'cl-1', score: 88, notes: 'Good' }]),
    overrides.non_conformities ?? JSON.stringify([{ id: 'nc-1', type: 'minor', description: 'Issue', status: 'closed' }]),
    overrides.audit_history    ?? JSON.stringify([{ date: '2024-01-01', type: 'Initial', result: 'Certified', auditor: 'Alice' }]),
    ts, ts,
  );
  return Number(result.lastInsertRowid);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Standard Certifications Routes', () => {
  let app: Hono;
  let certifiedId: number;
  let auditId: number;
  let notCertId: number;

  beforeAll(() => {
    app = createTestApp();
    certifiedId = seedCert({ standard_id: `${TAG}-std-certified`, status: 'certified', overall_score: 92 });
    auditId     = seedCert({ standard_id: `${TAG}-std-audit`, status: 'in_audit', overall_score: null });
    notCertId   = seedCert({ standard_id: `${TAG}-std-notcert`, status: 'not_certified', overall_score: null });
  });

  // ── GET /api/standard-certifications/stats ─────────────────────────────

  describe('GET /api/standard-certifications/stats', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/standard-certifications/stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns required stat fields', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications/stats');
      expect(typeof body.data.total).toBe('number');
      expect(typeof body.data.certified).toBe('number');
      expect(typeof body.data.inAudit).toBe('number');
      expect(typeof body.data.expired).toBe('number');
      expect(typeof body.data.expiringSoon).toBe('number');
      expect(typeof body.data.avgScore).toBe('number');
    });

    it('total is at least 3 (seeded)', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications/stats');
      expect(body.data.total).toBeGreaterThanOrEqual(3);
    });

    it('certified count is at least 1', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications/stats');
      expect(body.data.certified).toBeGreaterThanOrEqual(1);
    });

    it('inAudit count is at least 1', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications/stats');
      expect(body.data.inAudit).toBeGreaterThanOrEqual(1);
    });

    it('returns byStatus array', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications/stats');
      expect(Array.isArray(body.data.byStatus)).toBe(true);
      expect(body.data.byStatus.length).toBeGreaterThan(0);
    });

    it('byStatus entries have status and count', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications/stats');
      for (const entry of body.data.byStatus) {
        expect(typeof entry.status).toBe('string');
        expect(typeof entry.count).toBe('number');
      }
    });
  });

  // ── GET /api/standard-certifications ──────────────────────────────────

  describe('GET /api/standard-certifications', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/standard-certifications');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns total count matching array length', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications');
      expect(body.total).toBe(body.data.length);
    });

    it('contains the seeded certified record', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications');
      const found = body.data.find((c: any) => c.id === String(certifiedId));
      expect(found).toBeDefined();
    });

    it('maps DB rows to camelCase frontend fields', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications');
      const item = body.data.find((c: any) => c.id === String(certifiedId));
      expect(item).toHaveProperty('standardId');
      expect(item).toHaveProperty('standardCode');
      expect(item).toHaveProperty('standardTitle');
      expect(item).toHaveProperty('certificationBody');
      expect(item).toHaveProperty('certificateNumber');
      expect(item).toHaveProperty('initialCertDate');
      expect(item).toHaveProperty('expiryDate');
      expect(item).toHaveProperty('lastSurveillanceDate');
      expect(item).toHaveProperty('nextSurveillanceDate');
    });

    it('id is a string', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications');
      const item = body.data.find((c: any) => c.id === String(certifiedId));
      expect(typeof item.id).toBe('string');
    });

    it('scope and locations are parsed arrays', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications');
      const item = body.data.find((c: any) => c.id === String(certifiedId));
      expect(Array.isArray(item.scope)).toBe(true);
      expect(Array.isArray(item.locations)).toBe(true);
    });

    it('clauseScores is a parsed array with clauseId/score/notes', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications');
      const item = body.data.find((c: any) => c.id === String(certifiedId));
      expect(Array.isArray(item.clauseScores)).toBe(true);
      expect(item.clauseScores[0]).toHaveProperty('clauseId');
      expect(item.clauseScores[0]).toHaveProperty('score');
    });

    it('nonConformities is a parsed array', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications');
      const item = body.data.find((c: any) => c.id === String(certifiedId));
      expect(Array.isArray(item.nonConformities)).toBe(true);
      expect(item.nonConformities[0]).toHaveProperty('type');
    });

    it('auditHistory is a parsed array', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications');
      const item = body.data.find((c: any) => c.id === String(certifiedId));
      expect(Array.isArray(item.auditHistory)).toBe(true);
      expect(item.auditHistory[0]).toHaveProperty('auditor');
    });

    it('filters by status=certified', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications?status=certified');
      const ids = body.data.map((c: any) => c.id);
      expect(ids).toContain(String(certifiedId));
      expect(ids).not.toContain(String(auditId));
    });

    it('filters by status=in_audit', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications?status=in_audit');
      const ids = body.data.map((c: any) => c.id);
      expect(ids).toContain(String(auditId));
      expect(ids).not.toContain(String(certifiedId));
    });

    it('filters by status=not_certified', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications?status=not_certified');
      const ids = body.data.map((c: any) => c.id);
      expect(ids).toContain(String(notCertId));
    });

    it('search by standard_code returns matching items', async () => {
      const code = `${TAG}-CODE`;
      const { body } = await req(app, 'GET', `/api/standard-certifications?search=${encodeURIComponent(code)}`);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      for (const item of body.data) {
        expect(item.standardCode).toContain(TAG);
      }
    });

    it('search by standard_title', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications?search=Test+Standard+Title');
      const ids = body.data.map((c: any) => c.id);
      expect(ids).toContain(String(certifiedId));
    });

    it('status=all returns all items (no filter)', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications?status=all');
      expect(body.data.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ── POST /api/standard-certifications ─────────────────────────────────

  describe('POST /api/standard-certifications', () => {
    const validPayload = {
      standardId: `${TAG}-post-std`,
      standardCode: `${TAG}-POST-CODE`,
      standardTitle: 'POST Test Standard',
      status: 'in_audit',
      certificationBody: 'SGS',
      scope: ['Operations'],
      locations: ['Site A'],
      clauseScores: [{ clauseId: 'cl-1', score: 80, notes: 'OK' }],
      nonConformities: [],
      auditHistory: [],
    };

    it('returns 201 and created record', async () => {
      const { status, body } = await req(app, 'POST', '/api/standard-certifications', validPayload);
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.id).toBeDefined();

      // cleanup
      sqlite.prepare('DELETE FROM standard_certifications WHERE id = ?').run(body.data.id);
    });

    it('response has camelCase field mapping', async () => {
      const { body } = await req(app, 'POST', '/api/standard-certifications', { ...validPayload, standardId: `${TAG}-post-camel` });
      expect(body.data).toHaveProperty('standardId');
      expect(body.data).toHaveProperty('standardCode');
      expect(body.data).toHaveProperty('standardTitle');
      expect(body.data.status).toBe('in_audit');
      sqlite.prepare('DELETE FROM standard_certifications WHERE id = ?').run(body.data.id);
    });

    it('scope and locations returned as arrays', async () => {
      const { body } = await req(app, 'POST', '/api/standard-certifications', { ...validPayload, standardId: `${TAG}-post-arrs` });
      expect(Array.isArray(body.data.scope)).toBe(true);
      expect(Array.isArray(body.data.locations)).toBe(true);
      sqlite.prepare('DELETE FROM standard_certifications WHERE id = ?').run(body.data.id);
    });

    it('clauseScores returned as array', async () => {
      const { body } = await req(app, 'POST', '/api/standard-certifications', { ...validPayload, standardId: `${TAG}-post-cs` });
      expect(Array.isArray(body.data.clauseScores)).toBe(true);
      sqlite.prepare('DELETE FROM standard_certifications WHERE id = ?').run(body.data.id);
    });

    it('defaults status to not_certified when omitted', async () => {
      const { body } = await req(app, 'POST', '/api/standard-certifications', {
        standardId: `${TAG}-post-default`,
        standardCode: `${TAG}-DEF`,
        standardTitle: 'Default Status Test',
      });
      expect(body.data.status).toBe('not_certified');
      sqlite.prepare('DELETE FROM standard_certifications WHERE id = ?').run(body.data.id);
    });

    it('returns 400 when standardId is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/standard-certifications', {
        standardCode: 'CODE', standardTitle: 'title',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when standardCode is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/standard-certifications', {
        standardId: `${TAG}-err`, standardTitle: 'title',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when standardTitle is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/standard-certifications', {
        standardId: `${TAG}-err`, standardCode: 'CODE',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid status enum', async () => {
      const { status, body } = await req(app, 'POST', '/api/standard-certifications', {
        ...validPayload, standardId: `${TAG}-badenm`, status: 'invalid_status',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid nonConformities type enum', async () => {
      const { status, body } = await req(app, 'POST', '/api/standard-certifications', {
        ...validPayload,
        standardId: `${TAG}-ncerr`,
        nonConformities: [{ id: 'nc-1', type: 'blocker', description: 'x', status: 'open' }],
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/standard-certifications/:id ──────────────────────────────

  describe('GET /api/standard-certifications/:id', () => {
    it('returns 200 with correct record', async () => {
      const { status, body } = await req(app, 'GET', `/api/standard-certifications/${certifiedId}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(String(certifiedId));
    });

    it('returns all camelCase fields', async () => {
      const { body } = await req(app, 'GET', `/api/standard-certifications/${certifiedId}`);
      expect(body.data).toHaveProperty('standardId');
      expect(body.data).toHaveProperty('standardCode');
      expect(body.data).toHaveProperty('standardTitle');
      expect(body.data).toHaveProperty('clauseScores');
      expect(body.data).toHaveProperty('nonConformities');
      expect(body.data).toHaveProperty('auditHistory');
    });

    it('returns 404 for nonexistent id', async () => {
      const { status, body } = await req(app, 'GET', '/api/standard-certifications/9999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for non-numeric id', async () => {
      const { status, body } = await req(app, 'GET', '/api/standard-certifications/abc');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for id=0', async () => {
      const { status, body } = await req(app, 'GET', '/api/standard-certifications/0');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── PUT /api/standard-certifications/:id ──────────────────────────────

  describe('PUT /api/standard-certifications/:id', () => {
    it('updates status successfully', async () => {
      const { body } = await req(app, 'PUT', `/api/standard-certifications/${auditId}`, { status: 'certified' });
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('certified');
      // restore
      await req(app, 'PUT', `/api/standard-certifications/${auditId}`, { status: 'in_audit' });
    });

    it('updates overallScore', async () => {
      const { body } = await req(app, 'PUT', `/api/standard-certifications/${certifiedId}`, { overallScore: 95 });
      expect(body.success).toBe(true);
      expect(body.data.overallScore).toBe(95);
    });

    it('updates certificationBody', async () => {
      const { body } = await req(app, 'PUT', `/api/standard-certifications/${certifiedId}`, { certificationBody: 'SGS' });
      expect(body.success).toBe(true);
      expect(body.data.certificationBody).toBe('SGS');
    });

    it('updates expiryDate', async () => {
      const { body } = await req(app, 'PUT', `/api/standard-certifications/${certifiedId}`, { expiryDate: '2028-12-31' });
      expect(body.success).toBe(true);
      expect(body.data.expiryDate).toBe('2028-12-31');
    });

    it('updates clauseScores (JSON array)', async () => {
      const newScores = [{ clauseId: 'cl-99', score: 99, notes: 'Excellent' }];
      const { body } = await req(app, 'PUT', `/api/standard-certifications/${certifiedId}`, { clauseScores: newScores });
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.clauseScores)).toBe(true);
      expect(body.data.clauseScores[0].clauseId).toBe('cl-99');
    });

    it('updates nonConformities (JSON array)', async () => {
      const ncs = [{ id: 'nc-X', type: 'major', description: 'Critical finding', status: 'open' }];
      const { body } = await req(app, 'PUT', `/api/standard-certifications/${certifiedId}`, { nonConformities: ncs });
      expect(body.success).toBe(true);
      expect(body.data.nonConformities[0].type).toBe('major');
    });

    it('updates auditHistory (JSON array)', async () => {
      const history = [{ date: '2026-01-01', type: 'Surveillance', result: 'Maintained', auditor: 'Bob' }];
      const { body } = await req(app, 'PUT', `/api/standard-certifications/${certifiedId}`, { auditHistory: history });
      expect(body.success).toBe(true);
      expect(body.data.auditHistory[0].auditor).toBe('Bob');
    });

    it('response has camelCase fields after update', async () => {
      const { body } = await req(app, 'PUT', `/api/standard-certifications/${certifiedId}`, { status: 'expired' });
      expect(body.data).toHaveProperty('standardId');
      expect(body.data).toHaveProperty('standardCode');
      // restore
      await req(app, 'PUT', `/api/standard-certifications/${certifiedId}`, { status: 'certified' });
    });

    it('returns 404 for nonexistent id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/standard-certifications/9999999', { status: 'expired' });
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for non-numeric id', async () => {
      const { status, body } = await req(app, 'PUT', '/api/standard-certifications/abc', { status: 'expired' });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when no valid fields sent', async () => {
      const { status, body } = await req(app, 'PUT', `/api/standard-certifications/${certifiedId}`, {});
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid status enum', async () => {
      const { status, body } = await req(app, 'PUT', `/api/standard-certifications/${certifiedId}`, { status: 'bad_value' });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── DELETE /api/standard-certifications/:id ────────────────────────────

  describe('DELETE /api/standard-certifications/:id', () => {
    it('deletes an existing record and returns 200', async () => {
      const idToDelete = seedCert({ standard_id: `${TAG}-del-1` });
      const { status, body } = await req(app, 'DELETE', `/api/standard-certifications/${idToDelete}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('confirms deleted record is gone', async () => {
      const idToDelete = seedCert({ standard_id: `${TAG}-del-2` });
      await req(app, 'DELETE', `/api/standard-certifications/${idToDelete}`);
      const { status } = await req(app, 'GET', `/api/standard-certifications/${idToDelete}`);
      expect(status).toBe(404);
    });

    it('returns 404 for nonexistent id', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/standard-certifications/9999999');
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 for non-numeric id', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/standard-certifications/notanid');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for id=0', async () => {
      const { status, body } = await req(app, 'DELETE', '/api/standard-certifications/0');
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── Stats accuracy with seed data ─────────────────────────────────────

  describe('Stats accuracy', () => {
    it('certified count matches actual certified rows in DB', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications/stats');
      const dbCount = (sqlite.prepare("SELECT COUNT(*) as cnt FROM standard_certifications WHERE status='certified'").get() as any).cnt;
      expect(body.data.certified).toBe(dbCount);
    });

    it('inAudit count matches actual in_audit rows', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications/stats');
      const dbCount = (sqlite.prepare("SELECT COUNT(*) as cnt FROM standard_certifications WHERE status='in_audit'").get() as any).cnt;
      expect(body.data.inAudit).toBe(dbCount);
    });

    it('total = sum of all status counts', async () => {
      const { body } = await req(app, 'GET', '/api/standard-certifications/stats');
      const d = body.data;
      expect(d.total).toBe(d.certified + d.inAudit + d.expired + d.suspended + d.notCertified);
    });
  });
});
