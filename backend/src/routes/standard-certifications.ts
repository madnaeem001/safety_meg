/**
 * Standard Certifications Routes
 *
 * Manages organisational ISO / regulatory standard certifications
 * (ISO 45001, ISO 27001, etc.) — distinct from individual worker certifications.
 *
 * Endpoints:
 *   GET  /api/standard-certifications/stats
 *   GET  /api/standard-certifications
 *   POST /api/standard-certifications
 *   GET  /api/standard-certifications/:id
 *   PUT  /api/standard-certifications/:id
 *   DELETE /api/standard-certifications/:id
 */

import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProdRoute ? '/data/local.sqlite' : resolve(process.cwd(), 'local.sqlite');

function getDb() {
  return new Database(dbPath);
}

const now = () => Date.now();

// ── Zod Schemas ────────────────────────────────────────────────────────────

const ClauseScoreSchema = z.object({
  clauseId: z.string().min(1),
  score: z.number().min(0).max(100),
  notes: z.string().default(''),
});

const NonConformitySchema = z.object({
  id: z.string().min(1),
  type: z.enum(['major', 'minor']),
  description: z.string().min(1),
  status: z.enum(['open', 'closed']),
});

const AuditHistorySchema = z.object({
  date: z.string().min(1),
  type: z.string().min(1),
  result: z.string().min(1),
  auditor: z.string().min(1),
});

const StatusEnum = z.enum(['not_certified', 'in_audit', 'certified', 'expired', 'suspended']);

const CreateSchema = z.object({
  standardId: z.string().min(1),
  standardCode: z.string().min(1),
  standardTitle: z.string().min(1),
  status: StatusEnum.optional().default('not_certified'),
  certificationBody: z.string().optional(),
  certificateNumber: z.string().optional(),
  initialCertDate: z.string().optional(),
  expiryDate: z.string().optional(),
  lastSurveillanceDate: z.string().optional(),
  nextSurveillanceDate: z.string().optional(),
  scope: z.array(z.string()).optional().default([]),
  locations: z.array(z.string()).optional().default([]),
  overallScore: z.number().min(0).max(100).optional(),
  clauseScores: z.array(ClauseScoreSchema).optional().default([]),
  nonConformities: z.array(NonConformitySchema).optional().default([]),
  auditHistory: z.array(AuditHistorySchema).optional().default([]),
});

const UpdateSchema = CreateSchema.partial().omit({ standardId: true, standardCode: true, standardTitle: true });

// ── Mapper ─────────────────────────────────────────────────────────────────

function mapCert(r: any) {
  const parse = (v: any) => {
    try { return typeof v === 'string' ? JSON.parse(v) : (v ?? []); }
    catch { return []; }
  };
  return {
    id: String(r.id),
    standardId: r.standard_id,
    standardCode: r.standard_code,
    standardTitle: r.standard_title,
    status: r.status,
    certificationBody: r.certification_body ?? undefined,
    certificateNumber: r.certificate_number ?? undefined,
    initialCertDate: r.initial_cert_date ?? undefined,
    expiryDate: r.expiry_date ?? undefined,
    lastSurveillanceDate: r.last_surveillance_date ?? undefined,
    nextSurveillanceDate: r.next_surveillance_date ?? undefined,
    scope: parse(r.scope),
    locations: parse(r.locations),
    overallScore: r.overall_score ?? undefined,
    clauseScores: parse(r.clause_scores),
    nonConformities: parse(r.non_conformities),
    auditHistory: parse(r.audit_history),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ── Route Registration ─────────────────────────────────────────────────────

export function standardCertificationsRoutes(app: Hono) {

  // GET /api/standard-certifications/stats
  app.get('/api/standard-certifications/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as cnt FROM standard_certifications').get() as any).cnt;
      const certified = (db.prepare("SELECT COUNT(*) as cnt FROM standard_certifications WHERE status='certified'").get() as any).cnt;
      const inAudit = (db.prepare("SELECT COUNT(*) as cnt FROM standard_certifications WHERE status='in_audit'").get() as any).cnt;
      const expired = (db.prepare("SELECT COUNT(*) as cnt FROM standard_certifications WHERE status='expired'").get() as any).cnt;
      const suspended = (db.prepare("SELECT COUNT(*) as cnt FROM standard_certifications WHERE status='suspended'").get() as any).cnt;
      const notCertified = (db.prepare("SELECT COUNT(*) as cnt FROM standard_certifications WHERE status='not_certified'").get() as any).cnt;

      const threeMonthsStr = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const expiringSoon = (db.prepare(
        "SELECT COUNT(*) as cnt FROM standard_certifications WHERE status='certified' AND expiry_date IS NOT NULL AND expiry_date <= ?"
      ).get(threeMonthsStr) as any).cnt;

      // Average score across certs that have one
      const avgRow = db.prepare(
        'SELECT AVG(overall_score) as avg FROM standard_certifications WHERE overall_score IS NOT NULL'
      ).get() as any;
      const avgScore = avgRow?.avg ? Math.round(avgRow.avg) : 0;

      const byStatus = [
        { status: 'certified', count: certified },
        { status: 'in_audit', count: inAudit },
        { status: 'not_certified', count: notCertified },
        { status: 'expired', count: expired },
        { status: 'suspended', count: suspended },
      ];

      return c.json({
        success: true,
        data: { total, certified, inAudit, expired, suspended, notCertified, expiringSoon, avgScore, byStatus },
      });
    } finally { db.close(); }
  });

  // GET /api/standard-certifications
  app.get('/api/standard-certifications', (c) => {
    const db = getDb();
    try {
      const { status, search } = c.req.query();
      let sql = 'SELECT * FROM standard_certifications WHERE 1=1';
      const params: any[] = [];

      if (status && status !== 'all') {
        sql += ' AND status = ?';
        params.push(status);
      }
      if (search) {
        sql += ' AND (standard_code LIKE ? OR standard_title LIKE ? OR standard_id LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      sql += ' ORDER BY status ASC, standard_code ASC';
      const rows = db.prepare(sql).all(...params);
      const data = rows.map(mapCert);
      return c.json({ success: true, data, total: data.length });
    } finally { db.close(); }
  });

  // POST /api/standard-certifications
  app.post('/api/standard-certifications', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);
      const d = parsed.data;
      const ts = now();
      const result = db.prepare(`
        INSERT INTO standard_certifications
          (standard_id, standard_code, standard_title, status, certification_body, certificate_number,
           initial_cert_date, expiry_date, last_surveillance_date, next_surveillance_date,
           scope, locations, overall_score, clause_scores, non_conformities, audit_history, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        d.standardId, d.standardCode, d.standardTitle, d.status,
        d.certificationBody ?? null, d.certificateNumber ?? null,
        d.initialCertDate ?? null, d.expiryDate ?? null,
        d.lastSurveillanceDate ?? null, d.nextSurveillanceDate ?? null,
        JSON.stringify(d.scope), JSON.stringify(d.locations),
        d.overallScore ?? null,
        JSON.stringify(d.clauseScores), JSON.stringify(d.nonConformities), JSON.stringify(d.auditHistory),
        ts, ts,
      );
      const created = db.prepare('SELECT * FROM standard_certifications WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapCert(created) }, 201);
    } finally { db.close(); }
  });

  // GET /api/standard-certifications/:id
  app.get('/api/standard-certifications/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id) || id <= 0) return c.json({ success: false, error: 'Invalid id' }, 400);
      const row = db.prepare('SELECT * FROM standard_certifications WHERE id = ?').get(id);
      if (!row) return c.json({ success: false, error: 'Standard certification not found' }, 404);
      return c.json({ success: true, data: mapCert(row) });
    } finally { db.close(); }
  });

  // PUT /api/standard-certifications/:id
  app.put('/api/standard-certifications/:id', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id) || id <= 0) return c.json({ success: false, error: 'Invalid id' }, 400);
      const existing = db.prepare('SELECT id FROM standard_certifications WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Standard certification not found' }, 404);

      const body = await c.req.json();
      const parsed = UpdateSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);
      const d = parsed.data;

      const fields: string[] = [];
      const params: any[] = [];

      const fieldMap: Record<string, string> = {
        status: 'status',
        certificationBody: 'certification_body',
        certificateNumber: 'certificate_number',
        initialCertDate: 'initial_cert_date',
        expiryDate: 'expiry_date',
        lastSurveillanceDate: 'last_surveillance_date',
        nextSurveillanceDate: 'next_surveillance_date',
        overallScore: 'overall_score',
      };
      const jsonFields: Record<string, string> = {
        scope: 'scope',
        locations: 'locations',
        clauseScores: 'clause_scores',
        nonConformities: 'non_conformities',
        auditHistory: 'audit_history',
      };

      // Use raw body keys to determine which fields were actually sent
      for (const [key, col] of Object.entries(fieldMap)) {
        if (key in body) { fields.push(`${col} = ?`); params.push((d as any)[key] ?? null); }
      }
      for (const [key, col] of Object.entries(jsonFields)) {
        if (key in body) { fields.push(`${col} = ?`); params.push(JSON.stringify((d as any)[key])); }
      }

      if (!fields.length) return c.json({ success: false, error: 'No valid fields to update' }, 400);

      fields.push('updated_at = ?');
      params.push(now(), id);
      db.prepare(`UPDATE standard_certifications SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM standard_certifications WHERE id = ?').get(id);
      return c.json({ success: true, data: mapCert(updated) });
    } finally { db.close(); }
  });

  // DELETE /api/standard-certifications/:id
  app.delete('/api/standard-certifications/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id) || id <= 0) return c.json({ success: false, error: 'Invalid id' }, 400);
      const existing = db.prepare('SELECT id FROM standard_certifications WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Standard certification not found' }, 404);
      db.prepare('DELETE FROM standard_certifications WHERE id = ?').run(id);
      return c.json({ success: true, message: 'Deleted' });
    } finally { db.close(); }
  });
}
