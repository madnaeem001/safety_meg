import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const DB_PATH = isProdRoute ? '/data/local.sqlite' : path.join(__dirname, '../../local.sqlite');

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF');
  return db;
}

function nowMs() { return Date.now(); }

function safeJson(val: any) {
  if (!val) return null;
  try { return JSON.parse(val); } catch { return null; }
}

function mapChemical(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    casNumber: row.cas_number,
    manufacturer: row.manufacturer,
    storageLocation: row.storage_location,
    location: row.storage_location,     // alias for frontend compat
    hazardClass: row.hazard_class,
    signalWord: row.signal_word,
    quantity: row.quantity,
    unit: row.unit,
    expiryDate: row.expiry_date,
    sdsUploadDate: row.sds_upload_date,
    lastReviewed: row.last_reviewed,
    status: row.status,
    notes: row.notes,
    hazards: safeJson(row.hazards) ?? [],
    pictograms: safeJson(row.pictograms) ?? [],
    ghsClassification: safeJson(row.ghs_classification) ?? [],
    emergencyContact: row.emergency_contact ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSds(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    chemicalId: row.chemical_id,
    sdsFileUrl: row.sds_file_url,
    uploadDate: row.upload_date,
    revision: row.revision,
    hazardSummary: safeJson(row.hazard_summary),
    ppRequirements: row.pp_requirements,
    firstAidMeasures: row.first_aid_measures,
    storageHandling: row.storage_handling,
    disposalMethods: row.disposal_methods,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

const CreateChemicalSchema = z.object({
  name: z.string().min(1),
  casNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  storageLocation: z.string().optional(),
  hazardClass: z.enum(['flammable','toxic','corrosive','oxidizer','explosive','inert','radioactive']).optional(),
  signalWord: z.enum(['Danger','Warning']).optional(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
  hazards: z.array(z.string()).optional(),
  pictograms: z.array(z.string()).optional(),
  ghsClassification: z.array(z.string()).optional(),
  emergencyContact: z.string().optional(),
});

const CreateSdsSchema = z.object({
  sdsFileUrl: z.string().optional(),
  revision: z.string().optional(),
  hazardSummary: z.record(z.string(), z.string()).optional(),
  ppRequirements: z.string().optional(),
  firstAidMeasures: z.string().optional(),
  storageHandling: z.string().optional(),
  disposalMethods: z.string().optional(),
  uploadedBy: z.string().optional(),
});

export function chemicalsRoutes(app: Hono) {
  // GET /api/chemicals/stats
  app.get('/api/chemicals/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) AS cnt FROM chemicals').get() as any).cnt;
      const byStatus = db.prepare(`SELECT status, COUNT(*) AS count FROM chemicals GROUP BY status`).all();
      const byHazard = db.prepare(`
        SELECT hazard_class, COUNT(*) AS count FROM chemicals
        WHERE hazard_class IS NOT NULL GROUP BY hazard_class
      `).all();
      const now = Date.now();
      const expiringSoon = (db.prepare(`
        SELECT COUNT(*) AS cnt FROM chemicals
        WHERE expiry_date IS NOT NULL AND status='active'
          AND substr(expiry_date,1,10) <= date('now','+30 days')
          AND substr(expiry_date,1,10) >= date('now')
      `).get() as any).cnt;
      const withoutSds = (db.prepare(`
        SELECT COUNT(*) AS cnt FROM chemicals c
        LEFT JOIN sds_documents s ON s.chemical_id = c.id
        WHERE c.status='active' AND s.id IS NULL
      `).get() as any).cnt;
      return c.json({ success: true, data: { total, byStatus, byHazard, expiringSoon, withoutSds } });
    } finally { db.close(); }
  });

  // GET /api/chemicals
  app.get('/api/chemicals', (c) => {
    const db = getDb();
    try {
      const { status, hazardClass, search } = c.req.query() as Record<string, string>;
      let sql = 'SELECT * FROM chemicals WHERE 1=1';
      const params: any[] = [];
      if (status) { sql += ' AND status = ?'; params.push(status); }
      if (hazardClass) { sql += ' AND hazard_class = ?'; params.push(hazardClass); }
      if (search) { sql += ' AND (name LIKE ? OR cas_number LIKE ? OR manufacturer LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      sql += ' ORDER BY name ASC';
      const rows = db.prepare(sql).all(...params);
      return c.json({ success: true, data: rows.map(mapChemical), total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/chemicals
  app.post('/api/chemicals', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateChemicalSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      const d = parsed.data;
      const now = nowMs();
      const result = db.prepare(`
        INSERT INTO chemicals
          (name, cas_number, manufacturer, storage_location, hazard_class, signal_word,
           quantity, unit, expiry_date, notes, hazards, pictograms, ghs_classification,
           emergency_contact, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        d.name, d.casNumber ?? null, d.manufacturer ?? null, d.storageLocation ?? null,
        d.hazardClass ?? null, d.signalWord ?? null, d.quantity ?? null,
        d.unit ?? 'kg', d.expiryDate ?? null, d.notes ?? null,
        JSON.stringify(d.hazards ?? []),
        JSON.stringify(d.pictograms ?? []),
        JSON.stringify(d.ghsClassification ?? []),
        d.emergencyContact ?? '',
        now, now
      );
      const row = db.prepare('SELECT * FROM chemicals WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapChemical(row) }, 201);
    } finally { db.close(); }
  });

  // GET /api/chemicals/:id/sds  (STATIC sub-route, before /:id)
  app.get('/api/chemicals/:id/sds', (c) => {
    const db = getDb();
    try {
      const chem = db.prepare('SELECT id FROM chemicals WHERE id = ?').get(c.req.param('id'));
      if (!chem) return c.json({ error: 'Chemical not found' }, 404);
      const rows = db.prepare('SELECT * FROM sds_documents WHERE chemical_id = ? ORDER BY upload_date DESC').all(c.req.param('id'));
      return c.json({ success: true, data: rows.map(mapSds), total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/chemicals/:id/sds
  app.post('/api/chemicals/:id/sds', async (c) => {
    const db = getDb();
    try {
      const chem = db.prepare('SELECT id FROM chemicals WHERE id = ?').get(c.req.param('id'));
      if (!chem) return c.json({ error: 'Chemical not found' }, 404);
      const body = await c.req.json();
      const parsed = CreateSdsSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      const d = parsed.data;
      const now = nowMs();
      const result = db.prepare(`
        INSERT INTO sds_documents
          (chemical_id, sds_file_url, upload_date, revision, hazard_summary, pp_requirements, first_aid_measures, storage_handling, disposal_methods, uploaded_by, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        c.req.param('id'), d.sdsFileUrl ?? null, now,
        d.revision ?? '1',
        d.hazardSummary ? JSON.stringify(d.hazardSummary) : null,
        d.ppRequirements ?? null, d.firstAidMeasures ?? null,
        d.storageHandling ?? null, d.disposalMethods ?? null,
        d.uploadedBy ?? null, now
      );
      // Update sds_upload_date on chemical
      db.prepare('UPDATE chemicals SET sds_upload_date = ?, last_reviewed = ?, updated_at = ? WHERE id = ?').run(now, now, now, c.req.param('id'));
      const row = db.prepare('SELECT * FROM sds_documents WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapSds(row) }, 201);
    } finally { db.close(); }
  });

  // GET /api/chemicals/:id
  app.get('/api/chemicals/:id', (c) => {
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM chemicals WHERE id = ?').get(c.req.param('id'));
      if (!row) return c.json({ error: 'Chemical not found' }, 404);
      const sds = db.prepare('SELECT * FROM sds_documents WHERE chemical_id = ? ORDER BY upload_date DESC LIMIT 1').get(c.req.param('id'));
      return c.json({ success: true, data: { ...mapChemical(row), latestSds: sds ? mapSds(sds) : null } });
    } finally { db.close(); }
  });

  // PUT /api/chemicals/:id
  app.put('/api/chemicals/:id', async (c) => {
    const db = getDb();
    try {
      const existing: any = db.prepare('SELECT * FROM chemicals WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ error: 'Chemical not found' }, 404);
      const body = await c.req.json();
      const parsed = CreateChemicalSchema.partial().extend({ status: z.enum(['active','disposed','transferred']).optional() }).safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      const d = parsed.data;
      const now = nowMs();
      db.prepare(`
        UPDATE chemicals SET
          name=?, cas_number=?, manufacturer=?, storage_location=?, hazard_class=?,
          signal_word=?, quantity=?, unit=?, expiry_date=?, notes=?,
          hazards=?, pictograms=?, ghs_classification=?, emergency_contact=?,
          updated_at=?
        WHERE id=?
      `).run(
        d.name ?? existing.name, d.casNumber ?? existing.cas_number,
        d.manufacturer ?? existing.manufacturer, d.storageLocation ?? existing.storage_location,
        d.hazardClass ?? existing.hazard_class, d.signalWord ?? existing.signal_word,
        d.quantity ?? existing.quantity, d.unit ?? existing.unit,
        d.expiryDate ?? existing.expiry_date, d.notes ?? existing.notes,
        d.hazards !== undefined ? JSON.stringify(d.hazards) : (existing.hazards ?? '[]'),
        d.pictograms !== undefined ? JSON.stringify(d.pictograms) : (existing.pictograms ?? '[]'),
        d.ghsClassification !== undefined ? JSON.stringify(d.ghsClassification) : (existing.ghs_classification ?? '[]'),
        d.emergencyContact ?? (existing.emergency_contact ?? ''),
        now, c.req.param('id')
      );
      const row = db.prepare('SELECT * FROM chemicals WHERE id = ?').get(c.req.param('id'));
      return c.json({ success: true, data: mapChemical(row) });
    } finally { db.close(); }
  });

  // DELETE /api/chemicals/:id  (soft-delete → disposed)
  app.delete('/api/chemicals/:id', (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM chemicals WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ error: 'Chemical not found' }, 404);
      db.prepare('UPDATE chemicals SET status=?,updated_at=? WHERE id=?').run('disposed', nowMs(), c.req.param('id'));
      return c.json({ success: true, message: 'Chemical marked as disposed' });
    } finally { db.close(); }
  });
}
