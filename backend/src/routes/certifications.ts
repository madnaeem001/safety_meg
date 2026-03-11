import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'local.sqlite');

function getDb() {
  return new Database(dbPath);
}

const now = () => Date.now();

const CreateCertSchema = z.object({
  workerName: z.string().min(1),
  workerId: z.number().optional(),
  certificationName: z.string().min(1),
  issuingBody: z.string().optional(),
  certificationNumber: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  renewalDate: z.string().optional(),
  status: z.enum(['active', 'expired', 'suspended', 'pending-renewal']).optional().default('active'),
  category: z.enum(['safety', 'health', 'environment', 'technical', 'first-aid']).optional(),
  attachmentUrl: z.string().optional(),
  notes: z.string().optional(),
});

export function certificationsRoutes(app: Hono) {

  // GET /api/certifications/stats — totals, expiring, byStatus, byCategory
  app.get('/api/certifications/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as cnt FROM certifications').get() as any).cnt;
      const active = (db.prepare("SELECT COUNT(*) as cnt FROM certifications WHERE status='active'").get() as any).cnt;
      const expired = (db.prepare("SELECT COUNT(*) as cnt FROM certifications WHERE status='expired'").get() as any).cnt;
      const pendingRenewal = (db.prepare("SELECT COUNT(*) as cnt FROM certifications WHERE status='pending-renewal'").get() as any).cnt;
      const thirtyDays = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const thirtyDaysStr = new Date(thirtyDays).toISOString().split('T')[0];
      const expiringSoon = (db.prepare(
        "SELECT COUNT(*) as cnt FROM certifications WHERE status='active' AND expiry_date IS NOT NULL AND expiry_date <= ?"
      ).get(thirtyDaysStr) as any).cnt;
      const byCategory = db.prepare(
        "SELECT category, COUNT(*) as count FROM certifications GROUP BY category"
      ).all();
      return c.json({ success: true, data: { total, active, expired, pendingRenewal, expiringSoon, byCategory } });
    } finally { db.close(); }
  });

  // GET /api/certifications — list with filters
  app.get('/api/certifications', (c) => {
    const db = getDb();
    try {
      const { status, category, workerId, search, expiringSoon } = c.req.query();
      let sql = 'SELECT * FROM certifications WHERE 1=1';
      const params: any[] = [];
      if (status) { sql += ' AND status = ?'; params.push(status); }
      if (category) { sql += ' AND category = ?'; params.push(category); }
      if (workerId) { sql += ' AND worker_id = ?'; params.push(Number(workerId)); }
      if (search) { sql += ' AND (certification_name LIKE ? OR worker_name LIKE ? OR issuing_body LIKE ?)'; const s = `%${search}%`; params.push(s, s, s); }
      if (expiringSoon === 'true') {
        const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        sql += " AND status='active' AND expiry_date IS NOT NULL AND expiry_date <= ?";
        params.push(d);
      }
      sql += ' ORDER BY expiry_date ASC';
      const rows = db.prepare(sql).all(...params);
      return c.json({ success: true, data: rows, total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/certifications — create
  app.post('/api/certifications', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateCertSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);
      const d = parsed.data;
      const ts = now();
      const result = db.prepare(`
        INSERT INTO certifications (worker_name, worker_id, certification_name, issuing_body, certification_number,
          issue_date, expiry_date, renewal_date, status, category, attachment_url, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(d.workerName, d.workerId ?? null, d.certificationName, d.issuingBody ?? null,
        d.certificationNumber ?? null, d.issueDate ?? null, d.expiryDate ?? null,
        d.renewalDate ?? null, d.status, d.category ?? null, d.attachmentUrl ?? null, d.notes ?? null, ts, ts);
      const created = db.prepare('SELECT * FROM certifications WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: created }, 201);
    } finally { db.close(); }
  });

  // GET /api/certifications/:id
  app.get('/api/certifications/:id', (c) => {
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM certifications WHERE id = ?').get(c.req.param('id'));
      if (!row) return c.json({ success: false, error: 'Certification not found' }, 404);
      return c.json({ success: true, data: row });
    } finally { db.close(); }
  });

  // PUT /api/certifications/:id
  app.put('/api/certifications/:id', async (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM certifications WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ success: false, error: 'Certification not found' }, 404);
      const body = await c.req.json();
      const fields: string[] = [];
      const params: any[] = [];
      const allowed = ['worker_name', 'worker_id', 'certification_name', 'issuing_body', 'certification_number',
        'issue_date', 'expiry_date', 'renewal_date', 'status', 'category', 'attachment_url', 'notes'];
      const camelToSnake: Record<string, string> = {
        workerName: 'worker_name', workerId: 'worker_id', certificationName: 'certification_name',
        issuingBody: 'issuing_body', certificationNumber: 'certification_number', issueDate: 'issue_date',
        expiryDate: 'expiry_date', renewalDate: 'renewal_date', attachmentUrl: 'attachment_url',
      };
      for (const [k, v] of Object.entries(body)) {
        const col = camelToSnake[k] ?? k;
        if (allowed.includes(col)) { fields.push(`${col} = ?`); params.push(v); }
      }
      if (!fields.length) return c.json({ success: false, error: 'No valid fields to update' }, 400);
      fields.push('updated_at = ?'); params.push(now()); params.push(c.req.param('id'));
      db.prepare(`UPDATE certifications SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM certifications WHERE id = ?').get(c.req.param('id'));
      return c.json({ success: true, data: updated });
    } finally { db.close(); }
  });

  // DELETE /api/certifications/:id
  app.delete('/api/certifications/:id', (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM certifications WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ success: false, error: 'Certification not found' }, 404);
      db.prepare('DELETE FROM certifications WHERE id = ?').run(c.req.param('id'));
      return c.json({ success: true, message: 'Certification deleted' });
    } finally { db.close(); }
  });
}
