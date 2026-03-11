import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Math.floor(Date.now() / 1000);

function pad(n: number, len = 5) {
  return String(n).padStart(len, '0');
}

function genReportNumber(db: Database.Database): string {
  const row = db.prepare('SELECT MAX(id) as maxId FROM hazard_reports').get() as any;
  return `HAZ-${pad((row?.maxId ?? 0) + 1)}`;
}

const CreateHazardSchema = z.object({
  hazardType: z.enum(['slip-trip-fall', 'electrical', 'chemical', 'machinery', 'ergonomic', 'fire', 'confined-space', 'other']),
  location: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  reportedBy: z.string().optional(),
  voiceTranscript: z.string().optional(),
  department: z.string().optional(),
  incidentId: z.number().optional(),
});

export function hazardReportsRoutes(app: Hono) {
  // GET /api/hazards/stats [STATIC first]
  app.get('/api/hazards/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as n FROM hazard_reports').get() as any).n;
      const byType = db.prepare('SELECT hazard_type, COUNT(*) as count FROM hazard_reports GROUP BY hazard_type').all();
      const bySeverity = db.prepare('SELECT severity, COUNT(*) as count FROM hazard_reports GROUP BY severity').all();
      const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM hazard_reports GROUP BY status').all();
      const submitted = (db.prepare("SELECT COUNT(*) as n FROM hazard_reports WHERE status!='draft'").get() as any).n;
      const resolved = (db.prepare("SELECT COUNT(*) as n FROM hazard_reports WHERE status IN ('resolved','closed')").get() as any).n;
      const critical = (db.prepare("SELECT COUNT(*) as n FROM hazard_reports WHERE severity='critical' AND status NOT IN ('resolved','closed')").get() as any).n;
      return c.json({ success: true, data: { total, submitted, resolved, critical, byType, bySeverity, byStatus } });
    } finally { db.close(); }
  });

  // GET /api/hazards [STATIC before /:id]
  app.get('/api/hazards', (c) => {
    const db = getDb();
    try {
      const { hazardType, severity, status, department, from, to } = c.req.query();
      let sql = 'SELECT * FROM hazard_reports WHERE 1=1';
      const params: any[] = [];
      if (hazardType) { sql += ' AND hazard_type=?'; params.push(hazardType); }
      if (severity) { sql += ' AND severity=?'; params.push(severity); }
      if (status) { sql += ' AND status=?'; params.push(status); }
      if (department) { sql += ' AND department=?'; params.push(department); }
      if (from) { sql += ' AND created_at >= ?'; params.push(Number(from)); }
      if (to) { sql += ' AND created_at <= ?'; params.push(Number(to)); }
      sql += ' ORDER BY created_at DESC';
      const rows = db.prepare(sql).all(...params);
      return c.json({ success: true, data: rows });
    } finally { db.close(); }
  });

  // POST /api/hazards
  app.post('/api/hazards', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateHazardSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
      const d = parsed.data;
      const reportNumber = genReportNumber(db);
      const ts = now();
      const result = db.prepare(`
        INSERT INTO hazard_reports
        (report_number, hazard_type, location, description, severity, status,
         reported_by, voice_transcript, department, incident_id, created_at, updated_at)
        VALUES (?,?,?,?,?,'draft',?,?,?,?,?,?)
      `).run(
        reportNumber, d.hazardType, d.location, d.description, d.severity,
        d.reportedBy ?? null, d.voiceTranscript ?? null, d.department ?? null,
        d.incidentId ?? null, ts, ts
      );
      const report = db.prepare('SELECT * FROM hazard_reports WHERE id=?').get(result.lastInsertRowid);
      return c.json({ success: true, data: report }, 201);
    } finally { db.close(); }
  });

  // POST /api/hazards/:id/submit [STATIC sub-route BEFORE /:id GET]
  app.post('/api/hazards/:id/submit', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const report = db.prepare('SELECT * FROM hazard_reports WHERE id=?').get(id) as any;
      if (!report) return c.json({ success: false, error: 'Hazard report not found' }, 404);
      db.prepare("UPDATE hazard_reports SET status='submitted', updated_at=? WHERE id=?").run(now(), id);
      const updated = db.prepare('SELECT * FROM hazard_reports WHERE id=?').get(id);
      return c.json({ success: true, data: updated });
    } finally { db.close(); }
  });

  // GET /api/hazards/:id
  app.get('/api/hazards/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const report = db.prepare('SELECT * FROM hazard_reports WHERE id=?').get(id);
      if (!report) return c.json({ success: false, error: 'Hazard report not found' }, 404);
      return c.json({ success: true, data: report });
    } finally { db.close(); }
  });

  // PUT /api/hazards/:id
  app.put('/api/hazards/:id', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const report = db.prepare('SELECT * FROM hazard_reports WHERE id=?').get(id) as any;
      if (!report) return c.json({ success: false, error: 'Hazard report not found' }, 404);
      const body = await c.req.json();
      const ts = now();
      const fields: string[] = [];
      const vals: any[] = [];
      const colMap: Record<string, string> = {
        hazardType: 'hazard_type', location: 'location', description: 'description',
        severity: 'severity', status: 'status', reportedBy: 'reported_by',
        voiceTranscript: 'voice_transcript', department: 'department',
        incidentId: 'incident_id', resolutionNotes: 'resolution_notes',
      };
      for (const [camel, col] of Object.entries(colMap)) {
        if (body[camel] !== undefined) { fields.push(`${col}=?`); vals.push(body[camel]); }
      }
      if ((body.status === 'resolved' || body.status === 'closed') && !report.resolved_at) {
        fields.push('resolved_at=?'); vals.push(ts);
      }
      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at=?'); vals.push(ts); vals.push(id);
      db.prepare(`UPDATE hazard_reports SET ${fields.join(', ')} WHERE id=?`).run(...vals);
      const updated = db.prepare('SELECT * FROM hazard_reports WHERE id=?').get(id);
      return c.json({ success: true, data: updated });
    } finally { db.close(); }
  });
}
