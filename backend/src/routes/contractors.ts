import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProdRoute ? '/data/local.sqlite' : resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const nowMs = () => Date.now();

const ContractorSchema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  tradeType: z.string().optional(),
  contactPerson: z.string().optional(),
  insuredUntil: z.string().optional(),
  safetyRating: z.number().optional(),
  workersCount: z.number().int().optional(),
  certifications: z.array(z.string()).optional(),
  lastSafetyAudit: z.string().optional(),
  incidentHistory: z.number().int().optional(),
  status: z.string().optional().default('active'),
  contractStart: z.string().optional(),
  contractEnd: z.string().optional(),
});

const UpdateContractorSchema = ContractorSchema.partial().omit({ name: true, company: true }).extend({
  name: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
});

const PermitSchema = z.object({
  permitType: z.enum(['hot-work', 'confined-space', 'electrical', 'excavation', 'general', 'height-work']),
  issuedBy: z.string().optional(),
  expiresAt: z.number().optional(),
  conditions: z.array(z.string()).optional().default([]),
});

function safeJson(v: any, def: any = []) {
  try { return v ? JSON.parse(v) : def; } catch { return def; }
}

function mapPermit(p: any) {
  return {
    ...p,
    permitType: p.permit_type ?? p.permitType ?? '',
    conditions: safeJson(p.conditions, []),
  };
}

function mapContractor(row: any, activePermits = 0) {
  return {
    id: row.id,
    companyName: row.company ?? '',
    contactPerson: row.contact_person ?? row.name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    tradeType: row.trade_type ?? row.specialty ?? '',
    insuranceExpiry: row.insured_until ?? row.contract_end ?? '',
    safetyRating: row.safety_rating ?? 0,
    workersCount: row.workers_count ?? 0,
    activePermits,
    status: row.status ?? 'active',
    certifications: safeJson(row.certifications),
    lastSafetyAudit: row.last_safety_audit ?? '',
    incidentHistory: row.incident_history ?? 0,
    // legacy fields kept for backward compat
    name: row.name ?? '',
    company: row.company ?? '',
    specialty: row.specialty ?? '',
    contractStart: row.contract_start ?? '',
    contractEnd: row.contract_end ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function contractorRoutes(app: Hono) {
  // GET /api/contractors
  app.get('/api/contractors', (c) => {
    const { status, specialty, tradeType, limit = '50' } = c.req.query() as any;
    const db = getDb();
    try {
      let q = 'SELECT * FROM contractors WHERE 1=1';
      const params: any[] = [];
      if (status) { q += ' AND status = ?'; params.push(status); }
      if (specialty) { q += ' AND (specialty LIKE ? OR trade_type LIKE ?)'; params.push(`%${specialty}%`, `%${specialty}%`); }
      if (tradeType) { q += ' AND (trade_type LIKE ? OR specialty LIKE ?)'; params.push(`%${tradeType}%`, `%${tradeType}%`); }
      q += ` ORDER BY created_at DESC LIMIT ${Math.min(Number(limit), 200)}`;
      const rows = db.prepare(q).all(...params) as any[];
      const mapped = rows.map(row => {
        const ap = (db.prepare("SELECT COUNT(*) as n FROM permit_to_work WHERE contractor_id = ? AND status IN ('active','approved')").get(row.id) as any)?.n ?? 0;
        return mapContractor(row, ap);
      });
      return c.json({ success: true, data: mapped, total: mapped.length });
    } finally { db.close(); }
  });

  // POST /api/contractors
  app.post('/api/contractors', async (c) => {
    const body = await c.req.json();
    const parsed = ContractorSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }
    const d = parsed.data;
    const db = getDb();
    try {
      const result = db.prepare(
        `INSERT INTO contractors (name, company, email, phone, specialty, status, contract_start, contract_end,
          trade_type, contact_person, insured_until, safety_rating, workers_count, certifications, last_safety_audit, incident_history,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        d.name, d.company, d.email ?? null, d.phone ?? null,
        d.tradeType ?? d.specialty ?? null, d.status ?? 'active',
        d.contractStart ?? null, d.contractEnd ?? null,
        d.tradeType ?? d.specialty ?? null, d.contactPerson ?? d.name,
        d.insuredUntil ?? d.contractEnd ?? null,
        d.safetyRating ?? 0, d.workersCount ?? 0,
        d.certifications ? JSON.stringify(d.certifications) : '[]',
        d.lastSafetyAudit ?? null, d.incidentHistory ?? 0,
        nowMs(), nowMs()
      );
      const row = db.prepare('SELECT * FROM contractors WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapContractor(row) }, 201);
    } finally { db.close(); }
  });

  // PUT /api/contractors/:id
  app.put('/api/contractors/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const db = getDb();
    try {
      const existing = db.prepare('SELECT * FROM contractors WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Contractor not found' }, 404);
      const body = await c.req.json();
      const parsed = UpdateContractorSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
      const d = parsed.data;
      db.prepare(`UPDATE contractors SET
        name = ?, company = ?, email = ?, phone = ?, specialty = ?, status = ?,
        trade_type = ?, contact_person = ?, insured_until = ?, safety_rating = ?,
        workers_count = ?, certifications = ?, last_safety_audit = ?, incident_history = ?,
        updated_at = ?
        WHERE id = ?`).run(
        d.name ?? existing.name, d.company ?? existing.company,
        d.email ?? existing.email, d.phone ?? existing.phone,
        d.tradeType ?? d.specialty ?? existing.specialty,
        d.status ?? existing.status,
        d.tradeType ?? existing.trade_type,
        d.contactPerson ?? existing.contact_person,
        d.insuredUntil ?? existing.insured_until,
        d.safetyRating ?? existing.safety_rating,
        d.workersCount ?? existing.workers_count,
        d.certifications ? JSON.stringify(d.certifications) : existing.certifications,
        d.lastSafetyAudit ?? existing.last_safety_audit,
        d.incidentHistory ?? existing.incident_history,
        nowMs(), id
      );
      const updated = db.prepare('SELECT * FROM contractors WHERE id = ?').get(id) as any;
      const ap = (db.prepare("SELECT COUNT(*) as n FROM permit_to_work WHERE contractor_id = ? AND status IN ('active','approved')").get(id) as any)?.n ?? 0;
      return c.json({ success: true, data: mapContractor(updated, ap) });
    } finally { db.close(); }
  });

  // GET /api/contractors/:id/permits  (MUST be before /:id)
  app.get('/api/contractors/:id/permits', (c) => {
    const id = Number(c.req.param('id'));
    const db = getDb();
    try {
      const contractor = db.prepare('SELECT * FROM contractors WHERE id = ?').get(id);
      if (!contractor) return c.json({ success: false, error: 'Contractor not found' }, 404);
      const permits = db.prepare('SELECT * FROM contractor_permits WHERE contractor_id = ? ORDER BY issued_at DESC').all(id);
      return c.json({ success: true, data: permits.map(mapPermit), total: permits.length });
    } finally { db.close(); }
  });

  // POST /api/contractors/:id/permits
  app.post('/api/contractors/:id/permits', async (c) => {
    const id = Number(c.req.param('id'));
    const db = getDb();
    try {
      const contractor = db.prepare('SELECT * FROM contractors WHERE id = ?').get(id);
      if (!contractor) return c.json({ success: false, error: 'Contractor not found' }, 404);
      const body = await c.req.json();
      const parsed = PermitSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
      }
      const d = parsed.data;
      const result = db.prepare(
        `INSERT INTO contractor_permits (contractor_id, permit_type, issued_by, issued_at, expires_at, status, conditions, created_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
      ).run(id, d.permitType, d.issuedBy ?? null, nowMs(), d.expiresAt ?? null, JSON.stringify(d.conditions), nowMs());
      const permit = db.prepare('SELECT * FROM contractor_permits WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapPermit(permit) }, 201);
    } finally { db.close(); }
  });

  // GET /api/contractors/:id
  app.get('/api/contractors/:id', (c) => {
    const id = Number(c.req.param('id'));
    const db = getDb();
    try {
      const contractor = db.prepare('SELECT * FROM contractors WHERE id = ?').get(id) as any;
      if (!contractor) return c.json({ success: false, error: 'Contractor not found' }, 404);
      const permits = db.prepare('SELECT * FROM contractor_permits WHERE contractor_id = ? ORDER BY issued_at DESC').all(id);
      const ap = (db.prepare("SELECT COUNT(*) as n FROM permit_to_work WHERE contractor_id = ? AND status IN ('active','approved')").get(id) as any)?.n ?? 0;
      return c.json({ success: true, data: { ...mapContractor(contractor, ap), permits: permits.map(mapPermit) } });
    } finally { db.close(); }
  });

  // DELETE /api/contractors/:id
  app.delete('/api/contractors/:id', (c) => {
    const id = Number(c.req.param('id'));
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM contractors WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Contractor not found' }, 404);
      db.prepare('DELETE FROM contractor_permits WHERE contractor_id = ?').run(id);
      db.prepare('DELETE FROM contractors WHERE id = ?').run(id);
      return c.json({ success: true, message: 'Contractor deleted' });
    } finally { db.close(); }
  });
}
