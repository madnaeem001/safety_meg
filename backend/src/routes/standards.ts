import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Date.now();

function safeJson(val: any): any {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

function mapStandardRow(r: any) {
  return {
    id: r.id,
    standardCode: r.standard_code,
    title: r.standard_name,
    issuingBody: r.issuer ?? null,
    category: r.category ?? null,
    description: r.description ?? null,
    scope: null,
    edition: r.version ?? null,
    publicationDate: r.valid_from ?? null,
    keyRequirements: [],
    applicableIndustries: safeJson(r.applicable_sectors),
    certificationRequired: Boolean(r.certification_required),
    clauses: safeJson(r.clauses),
    status: 'active',
    validFrom: r.valid_from ?? null,
    createdAt: r.last_updated ?? null,
  };
}

function mapNfpaRow(r: any) {
  return {
    id: r.id,
    codeNumber: r.code_number,
    title: r.title,
    edition: r.edition ?? null,
    category: r.category ?? null,
    hazardLevel: r.hazard_level ?? null,
    description: r.description ?? null,
    requirements: safeJson(r.requirements),
    applicableIndustries: safeJson(r.applicable_industries),
    effectiveDate: r.effective_date ?? null,
    lastUpdated: r.last_updated ?? null,
  };
}

const CreateStdSchema = z.object({
  standardCode: z.string().min(1),
  standardName: z.string().min(1),
  version: z.string().optional(),
  issuer: z.enum(['ISO', 'IEC', 'ANSI', 'BSI', 'AS', 'other']).optional(),
  category: z.enum(['health-safety', 'environment', 'quality', 'information-security', 'fire', 'other']).optional(),
  description: z.string().optional(),
  clauses: z.array(z.any()).optional(),
  applicableSectors: z.array(z.string()).optional(),
  certificationRequired: z.boolean().optional().default(false),
  validFrom: z.string().optional(),
});

const CreateNFPASchema = z.object({
  codeNumber: z.string().min(1),
  title: z.string().min(1),
  edition: z.string().optional(),
  category: z.enum(['electrical', 'fire-protection', 'life-safety', 'hazardous-materials', 'processes', 'other']).optional(),
  hazardLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  description: z.string().optional(),
  requirements: z.array(z.any()).optional(),
  applicableIndustries: z.array(z.string()).optional(),
  effectiveDate: z.string().optional(),
});

export function standardsRoutes(app: Hono) {

  // ==== INTERNATIONAL STANDARDS ====

  // GET /api/standards/international/stats
  app.get('/api/standards/international/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as cnt FROM international_standards').get() as any).cnt;
      const byCategory = db.prepare('SELECT category, COUNT(*) as count FROM international_standards GROUP BY category').all();
      const byIssuer = db.prepare('SELECT issuer, COUNT(*) as count FROM international_standards GROUP BY issuer').all();
      const requireCert = (db.prepare('SELECT COUNT(*) as cnt FROM international_standards WHERE certification_required=1').get() as any).cnt;
      return c.json({ success: true, data: { total, byCategory, byIssuer, requireCertification: requireCert } });
    } finally { db.close(); }
  });

  // GET /api/standards/international — list (STATIC before /:id)
  app.get('/api/standards/international', (c) => {
    const db = getDb();
    try {
      const { category, issuer, search, certRequired } = c.req.query();
      let sql = 'SELECT * FROM international_standards WHERE 1=1';
      const params: any[] = [];
      if (category) { sql += ' AND category = ?'; params.push(category); }
      if (issuer) { sql += ' AND issuer = ?'; params.push(issuer); }
      if (certRequired === 'true') { sql += ' AND certification_required = 1'; }
      if (search) { sql += ' AND (standard_code LIKE ? OR standard_name LIKE ?)'; const s = `%${search}%`; params.push(s, s); }
      sql += ' ORDER BY standard_code ASC';
      const rows = db.prepare(sql).all(...params).map(mapStandardRow);
      return c.json({ success: true, data: rows, total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/standards/international
  app.post('/api/standards/international', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateStdSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);
      const d = parsed.data;
      const ts = now();
      const result = db.prepare(`
        INSERT INTO international_standards (standard_code, standard_name, version, issuer, category,
          description, clauses, applicable_sectors, certification_required, valid_from, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(d.standardCode, d.standardName, d.version ?? null, d.issuer ?? null, d.category ?? null,
        d.description ?? null, d.clauses ? JSON.stringify(d.clauses) : null,
        d.applicableSectors ? JSON.stringify(d.applicableSectors) : null,
        d.certificationRequired ? 1 : 0, d.validFrom ?? null, ts);
      const created = db.prepare('SELECT * FROM international_standards WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapStandardRow(created) }, 201);
    } finally { db.close(); }
  });

  // GET /api/standards/:id
  app.get('/api/standards/:id', (c) => {
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM international_standards WHERE id = ?').get(c.req.param('id')) as any;
      if (!row) return c.json({ success: false, error: 'Standard not found' }, 404);
      return c.json({ success: true, data: mapStandardRow(row) });
    } finally { db.close(); }
  });

  // PUT /api/standards/:id
  app.put('/api/standards/:id', async (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM international_standards WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ success: false, error: 'Standard not found' }, 404);
      const body = await c.req.json();
      const fields: string[] = [];
      const params: any[] = [];
      const map: Record<string, string> = { standardCode: 'standard_code', standardName: 'standard_name', applicableSectors: 'applicable_sectors', certificationRequired: 'certification_required', validFrom: 'valid_from' };
      const allowed = ['standard_code', 'standard_name', 'version', 'issuer', 'category', 'description', 'clauses', 'applicable_sectors', 'certification_required', 'valid_from'];
      for (const [k, v] of Object.entries(body)) {
        const col = map[k] ?? k;
        const val = (k === 'clauses' || k === 'applicableSectors') ? JSON.stringify(v) : (k === 'certificationRequired' ? (v ? 1 : 0) : v);
        if (allowed.includes(col)) { fields.push(`${col} = ?`); params.push(val); }
      }
      if (!fields.length) return c.json({ success: false, error: 'No valid fields' }, 400);
      fields.push('last_updated = ?'); params.push(now()); params.push(c.req.param('id'));
      db.prepare(`UPDATE international_standards SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM international_standards WHERE id = ?').get(c.req.param('id')) as any;
      return c.json({ success: true, data: mapStandardRow(updated) });
    } finally { db.close(); }
  });

  // DELETE /api/standards/:id
  app.delete('/api/standards/:id', (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM international_standards WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ success: false, error: 'Standard not found' }, 404);
      db.prepare('DELETE FROM international_standards WHERE id = ?').run(c.req.param('id'));
      return c.json({ success: true, message: 'Standard deleted' });
    } finally { db.close(); }
  });

  // ==== NFPA CODES ====

  // GET /api/nfpa/stats
  app.get('/api/nfpa/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as cnt FROM nfpa_codes').get() as any).cnt;
      const byCategory = db.prepare('SELECT category, COUNT(*) as count FROM nfpa_codes GROUP BY category').all();
      const byHazard = db.prepare('SELECT hazard_level, COUNT(*) as count FROM nfpa_codes GROUP BY hazard_level').all();
      return c.json({ success: true, data: { total, byCategory, byHazardLevel: byHazard } });
    } finally { db.close(); }
  });

  // GET /api/nfpa/codes — list (STATIC before /codes/:id)
  app.get('/api/nfpa/codes', (c) => {
    const db = getDb();
    try {
      const { category, hazardLevel, search } = c.req.query();
      let sql = 'SELECT * FROM nfpa_codes WHERE 1=1';
      const params: any[] = [];
      if (category) { sql += ' AND category = ?'; params.push(category); }
      if (hazardLevel) { sql += ' AND hazard_level = ?'; params.push(hazardLevel); }
      if (search) { sql += ' AND (code_number LIKE ? OR title LIKE ?)'; const s = `%${search}%`; params.push(s, s); }
      sql += ' ORDER BY code_number ASC';
      const rows = db.prepare(sql).all(...params).map(mapNfpaRow);
      return c.json({ success: true, data: rows, total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/nfpa/codes
  app.post('/api/nfpa/codes', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateNFPASchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);
      const d = parsed.data;
      const ts = now();
      const result = db.prepare(`
        INSERT INTO nfpa_codes (code_number, title, edition, category, hazard_level,
          description, requirements, applicable_industries, effective_date, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(d.codeNumber, d.title, d.edition ?? null, d.category ?? null, d.hazardLevel ?? null,
        d.description ?? null, d.requirements ? JSON.stringify(d.requirements) : null,
        d.applicableIndustries ? JSON.stringify(d.applicableIndustries) : null,
        d.effectiveDate ?? null, ts);
      const created = db.prepare('SELECT * FROM nfpa_codes WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapNfpaRow(created) }, 201);
    } finally { db.close(); }
  });

  // GET /api/nfpa/codes/:id
  app.get('/api/nfpa/codes/:id', (c) => {
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM nfpa_codes WHERE id = ?').get(c.req.param('id')) as any;
      if (!row) return c.json({ success: false, error: 'NFPA code not found' }, 404);
      return c.json({ success: true, data: mapNfpaRow(row) });
    } finally { db.close(); }
  });

  // PUT /api/nfpa/codes/:id
  app.put('/api/nfpa/codes/:id', async (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM nfpa_codes WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ success: false, error: 'NFPA code not found' }, 404);
      const body = await c.req.json();
      const fields: string[] = [];
      const params: any[] = [];
      const map: Record<string, string> = { codeNumber: 'code_number', hazardLevel: 'hazard_level', applicableIndustries: 'applicable_industries', effectiveDate: 'effective_date' };
      const allowed = ['code_number', 'title', 'edition', 'category', 'hazard_level', 'description', 'requirements', 'applicable_industries', 'effective_date'];
      for (const [k, v] of Object.entries(body)) {
        const col = map[k] ?? k;
        const val = (k === 'requirements' || k === 'applicableIndustries') ? JSON.stringify(v) : v;
        if (allowed.includes(col)) { fields.push(`${col} = ?`); params.push(val); }
      }
      if (!fields.length) return c.json({ success: false, error: 'No valid fields' }, 400);
      fields.push('last_updated = ?'); params.push(now()); params.push(c.req.param('id'));
      db.prepare(`UPDATE nfpa_codes SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM nfpa_codes WHERE id = ?').get(c.req.param('id')) as any;
      return c.json({ success: true, data: mapNfpaRow(updated) });
    } finally { db.close(); }
  });

  // DELETE /api/nfpa/codes/:id
  app.delete('/api/nfpa/codes/:id', (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM nfpa_codes WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ success: false, error: 'NFPA code not found' }, 404);
      db.prepare('DELETE FROM nfpa_codes WHERE id = ?').run(c.req.param('id'));
      return c.json({ success: true, message: 'NFPA code deleted' });
    } finally { db.close(); }
  });
}
