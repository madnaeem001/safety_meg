import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';

const sqlite = new Database('local.sqlite');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = OFF');

const nowMs = () => Date.now();

const NonConformitySchema = z.object({
  type: z.enum(['product', 'process', 'supplier', 'customer', 'internal']),
  description: z.string().min(1),
  severity: z.enum(['minor', 'major', 'critical']).optional().default('minor'),
  location: z.string().optional(),
  department: z.string().optional(),
  detectedBy: z.string().optional(),
  correctiveAction: z.string().optional(),
});

export function qualityRoutes(app: Hono) {
  // GET /api/quality/metrics
  app.get('/api/quality/metrics', (c) => {
    const total = (sqlite.prepare('SELECT COUNT(*) as count FROM quality_non_conformities').get() as any).count;
    const byStatus = sqlite.prepare('SELECT status, COUNT(*) as count FROM quality_non_conformities GROUP BY status').all();
    const bySeverity = sqlite.prepare('SELECT severity, COUNT(*) as count FROM quality_non_conformities GROUP BY severity').all();
    const byType = sqlite.prepare('SELECT type, COUNT(*) as count FROM quality_non_conformities GROUP BY type').all();
    const recent = sqlite.prepare('SELECT * FROM quality_non_conformities ORDER BY detected_at DESC LIMIT 5').all();
    return c.json({ success: true, data: { total, byStatus, bySeverity, byType, recent } });
  });

  // GET /api/quality/non-conformities (list)
  app.get('/api/quality/non-conformities', (c) => {
    const { status, severity, department, limit = '50' } = c.req.query() as any;
    let q = 'SELECT * FROM quality_non_conformities WHERE 1=1';
    const params: any[] = [];
    if (status) { q += ' AND status = ?'; params.push(status); }
    if (severity) { q += ' AND severity = ?'; params.push(severity); }
    if (department) { q += ' AND department = ?'; params.push(department); }
    q += ` ORDER BY detected_at DESC LIMIT ${Math.min(Number(limit), 200)}`;
    const rows = sqlite.prepare(q).all(...params);
    return c.json({ success: true, data: rows, total: rows.length });
  });

  // GET /api/quality/trends
  app.get('/api/quality/trends', (c) => {
    const rows = sqlite.prepare(
      `SELECT strftime('%Y-%m', datetime(detected_at/1000, 'unixepoch')) as month,
              COUNT(*) as total,
              SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
              SUM(CASE WHEN severity = 'major' THEN 1 ELSE 0 END) as major,
              SUM(CASE WHEN severity = 'minor' THEN 1 ELSE 0 END) as minor
       FROM quality_non_conformities
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`
    ).all();
    return c.json({ success: true, data: rows });
  });

  // POST /api/quality/non-conformity
  app.post('/api/quality/non-conformity', async (c) => {
    const body = await c.req.json();
    const parsed = NonConformitySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }
    const d = parsed.data;
    const result = sqlite.prepare(
      `INSERT INTO quality_non_conformities (type, description, severity, location, department, detected_by, corrective_action, status, detected_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`
    ).run(d.type, d.description, d.severity, d.location ?? null, d.department ?? null, d.detectedBy ?? null, d.correctiveAction ?? null, nowMs(), nowMs());
    const row = sqlite.prepare('SELECT * FROM quality_non_conformities WHERE id = ?').get(result.lastInsertRowid);
    return c.json({ success: true, data: row }, 201);
  });

  // PUT /api/quality/non-conformities/:id
  app.put('/api/quality/non-conformities/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const existing = sqlite.prepare('SELECT * FROM quality_non_conformities WHERE id = ?').get(id);
    if (!existing) return c.json({ success: false, error: 'Non-conformity not found' }, 404);
    const body = await c.req.json();
    const { status, correctiveAction, closedAt } = body;
    sqlite.prepare(
      `UPDATE quality_non_conformities SET
        status = COALESCE(?, status),
        corrective_action = COALESCE(?, corrective_action),
        closed_at = COALESCE(?, closed_at),
        updated_at = ?
       WHERE id = ?`
    ).run(status ?? null, correctiveAction ?? null, closedAt ?? null, nowMs(), id);
    const row = sqlite.prepare('SELECT * FROM quality_non_conformities WHERE id = ?').get(id);
    return c.json({ success: true, data: row });
  });
}
