import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Date.now();

function safeJson(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

// ── Normalizers ──────────────────────────────────────────────────────────────

function normalizeReportType(value?: string | null) {
  const valid = ['regulatory', 'internal', 'audit', 'incident', 'training', 'environmental', 'safety'];
  return valid.includes(value ?? '') ? value! : 'internal';
}

function normalizeReportFrequency(value?: string | null) {
  const valid = ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'on_demand'];
  return valid.includes(value ?? '') ? value! : 'monthly';
}

function normalizeReportStatus(value?: string | null) {
  const valid = ['current', 'due_soon', 'overdue', 'draft'];
  return valid.includes(value ?? '') ? value! : 'current';
}

function normalizeMetricTrend(value?: string | null) {
  const valid = ['up', 'down', 'stable'];
  return valid.includes(value ?? '') ? value! : 'stable';
}

function normalizeMetricStatus(value?: string | null) {
  const valid = ['compliant', 'at_risk', 'non_compliant'];
  return valid.includes(value ?? '') ? value! : 'compliant';
}

function normalizeReqStatus(value?: string | null) {
  const valid = ['compliant', 'in_progress', 'non_compliant', 'upcoming'];
  return valid.includes(value ?? '') ? value! : 'upcoming';
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapComplianceReport(row: any) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name ?? '',
    type: normalizeReportType(row.type),
    frequency: normalizeReportFrequency(row.frequency),
    lastGenerated: row.last_generated ?? '',
    nextDue: row.next_due ?? '',
    status: normalizeReportStatus(row.status),
    recipients: safeJson(row.recipients),
    format: row.format ?? 'pdf',
    automationEnabled: row.automation_enabled === 1,
    description: row.description ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapComplianceMetric(row: any) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name ?? '',
    category: row.category ?? 'Safety',
    currentValue: typeof row.current_value === 'number' ? row.current_value : Number(row.current_value ?? 0),
    targetValue: typeof row.target_value === 'number' ? row.target_value : Number(row.target_value ?? 100),
    unit: row.unit ?? '',
    trend: normalizeMetricTrend(row.trend),
    trendValue: typeof row.trend_value === 'number' ? row.trend_value : Number(row.trend_value ?? 0),
    status: normalizeMetricStatus(row.status),
    lastUpdated: row.last_updated ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRegulatoryRequirement(row: any) {
  if (!row) return null;
  return {
    id: String(row.id),
    regulation: row.regulation ?? row.standard_id ?? '',
    requirement: row.requirement ?? '',
    agency: row.agency ?? '',
    frequency: row.frequency ?? '',
    dueDate: row.due_date ?? row.due_date_text ?? '',
    status: normalizeReqStatus(row.status),
    assignedTo: row.assigned_to ?? row.assignee ?? '',
    evidence: safeJson(row.evidence),
    lastReview: row.last_review ?? row.last_assessed_date ?? '',
    standardId: row.standard_id ?? '',
    clauseId: row.clause_id ?? '',
    description: row.description ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Validation Schemas ───────────────────────────────────────────────────────

const CreateReportSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  frequency: z.string().optional(),
  lastGenerated: z.string().optional(),
  nextDue: z.string().optional(),
  status: z.string().optional(),
  recipients: z.array(z.string()).optional(),
  format: z.string().optional(),
  automationEnabled: z.boolean().optional(),
  description: z.string().optional(),
});

const UpdateReportSchema = CreateReportSchema.partial();

const UpdateMetricSchema = z.object({
  currentValue: z.number().optional(),
  targetValue: z.number().optional(),
  unit: z.string().optional(),
  trend: z.enum(['up', 'down', 'stable']).optional(),
  trendValue: z.number().optional(),
  status: z.enum(['compliant', 'at_risk', 'non_compliant']).optional(),
  lastUpdated: z.string().optional(),
});

const UpdateRequirementSchema = z.object({
  regulation: z.string().optional(),
  agency: z.string().optional(),
  frequency: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['compliant', 'in_progress', 'non_compliant', 'upcoming']).optional(),
  assignedTo: z.string().optional(),
  evidence: z.array(z.string()).optional(),
  lastReview: z.string().optional(),
});

// ── Route Registration ───────────────────────────────────────────────────────

export function complianceReportingRoutes(app: Hono) {

  // ── Compliance Reports ─────────────────────────────────────────────────────

  // GET /api/compliance/reporting/stats
  app.get('/api/compliance/reporting/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as n FROM compliance_reports').get() as any).n as number;
      const current = (db.prepare("SELECT COUNT(*) as n FROM compliance_reports WHERE status = 'current'").get() as any).n as number;
      const dueSoon = (db.prepare("SELECT COUNT(*) as n FROM compliance_reports WHERE status = 'due_soon'").get() as any).n as number;
      const overdue = (db.prepare("SELECT COUNT(*) as n FROM compliance_reports WHERE status = 'overdue'").get() as any).n as number;
      const automated = (db.prepare('SELECT COUNT(*) as n FROM compliance_reports WHERE automation_enabled = 1').get() as any).n as number;
      const totalMetrics = (db.prepare('SELECT COUNT(*) as n FROM compliance_metrics').get() as any).n as number;
      const compliantMetrics = (db.prepare("SELECT COUNT(*) as n FROM compliance_metrics WHERE status = 'compliant'").get() as any).n as number;
      const complianceRate = totalMetrics > 0 ? Math.round((compliantMetrics / totalMetrics) * 100) : 0;
      const upcomingReqs = (db.prepare("SELECT COUNT(*) as n FROM compliance_requirements WHERE (status = 'upcoming' OR status = 'in_progress')").get() as any).n as number;
      return c.json({
        success: true,
        data: { total, current, dueSoon, overdue, automated, complianceRate, upcomingRequirements: upcomingReqs }
      });
    } finally { db.close(); }
  });

  // GET /api/compliance/reporting/reports
  app.get('/api/compliance/reporting/reports', (c) => {
    const type = c.req.query('type');
    const status = c.req.query('status');
    const db = getDb();
    try {
      let sql = 'SELECT * FROM compliance_reports WHERE 1=1';
      const params: string[] = [];
      if (type && type !== 'all') { sql += ' AND type = ?'; params.push(type); }
      if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
      sql += ' ORDER BY updated_at DESC';
      const rows = db.prepare(sql).all(...params) as any[];
      return c.json({ success: true, data: rows.map(mapComplianceReport) });
    } finally { db.close(); }
  });

  // POST /api/compliance/reporting/reports
  app.post('/api/compliance/reporting/reports', async (c) => {
    const body = await c.req.json();
    const parsed = CreateReportSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    const d = parsed.data;
    const db = getDb();
    try {
      const ts = now();
      const result = db.prepare(`
        INSERT INTO compliance_reports (name, type, frequency, last_generated, next_due, status, recipients, format, automation_enabled, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        d.name,
        normalizeReportType(d.type),
        normalizeReportFrequency(d.frequency),
        d.lastGenerated ?? null,
        d.nextDue ?? null,
        normalizeReportStatus(d.status),
        d.recipients ? JSON.stringify(d.recipients) : JSON.stringify([]),
        d.format ?? 'pdf',
        d.automationEnabled ? 1 : 0,
        d.description ?? null,
        ts, ts,
      );
      const row = db.prepare('SELECT * FROM compliance_reports WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapComplianceReport(row) }, 201);
    } finally { db.close(); }
  });

  // GET /api/compliance/reporting/reports/:id
  app.get('/api/compliance/reporting/reports/:id', (c) => {
    const id = Number(c.req.param('id'));
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM compliance_reports WHERE id = ?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Not found' }, 404);
      return c.json({ success: true, data: mapComplianceReport(row) });
    } finally { db.close(); }
  });

  // PUT /api/compliance/reporting/reports/:id
  app.put('/api/compliance/reporting/reports/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const parsed = UpdateReportSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    const d = parsed.data;
    const db = getDb();
    try {
      const existing = db.prepare('SELECT * FROM compliance_reports WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Not found' }, 404);
      db.prepare(`
        UPDATE compliance_reports SET
          name = ?, type = ?, frequency = ?, last_generated = ?, next_due = ?,
          status = ?, recipients = ?, format = ?, automation_enabled = ?, description = ?, updated_at = ?
        WHERE id = ?
      `).run(
        d.name ?? existing.name,
        normalizeReportType(d.type ?? existing.type),
        normalizeReportFrequency(d.frequency ?? existing.frequency),
        d.lastGenerated !== undefined ? d.lastGenerated : existing.last_generated,
        d.nextDue !== undefined ? d.nextDue : existing.next_due,
        normalizeReportStatus(d.status ?? existing.status),
        d.recipients !== undefined ? JSON.stringify(d.recipients) : existing.recipients,
        d.format ?? existing.format,
        d.automationEnabled !== undefined ? (d.automationEnabled ? 1 : 0) : existing.automation_enabled,
        d.description !== undefined ? d.description : existing.description,
        now(),
        id,
      );
      const updated = db.prepare('SELECT * FROM compliance_reports WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: mapComplianceReport(updated) });
    } finally { db.close(); }
  });

  // DELETE /api/compliance/reporting/reports/:id
  app.delete('/api/compliance/reporting/reports/:id', (c) => {
    const id = Number(c.req.param('id'));
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM compliance_reports WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Not found' }, 404);
      db.prepare('DELETE FROM compliance_reports WHERE id = ?').run(id);
      return c.json({ success: true, message: 'Deleted' });
    } finally { db.close(); }
  });

  // ── Compliance Metrics ─────────────────────────────────────────────────────

  // GET /api/compliance/reporting/metrics
  app.get('/api/compliance/reporting/metrics', (c) => {
    const category = c.req.query('category');
    const status = c.req.query('status');
    const db = getDb();
    try {
      let sql = 'SELECT * FROM compliance_metrics WHERE 1=1';
      const params: string[] = [];
      if (category) { sql += ' AND category = ?'; params.push(category); }
      if (status) { sql += ' AND status = ?'; params.push(status); }
      sql += ' ORDER BY category, name';
      const rows = db.prepare(sql).all(...params) as any[];
      return c.json({ success: true, data: rows.map(mapComplianceMetric) });
    } finally { db.close(); }
  });

  // PUT /api/compliance/reporting/metrics/:id
  app.put('/api/compliance/reporting/metrics/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const parsed = UpdateMetricSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    const d = parsed.data;
    const db = getDb();
    try {
      const existing = db.prepare('SELECT * FROM compliance_metrics WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Not found' }, 404);
      db.prepare(`
        UPDATE compliance_metrics SET
          current_value = ?, target_value = ?, unit = ?, trend = ?, trend_value = ?,
          status = ?, last_updated = ?, updated_at = ?
        WHERE id = ?
      `).run(
        d.currentValue !== undefined ? d.currentValue : existing.current_value,
        d.targetValue !== undefined ? d.targetValue : existing.target_value,
        d.unit !== undefined ? d.unit : existing.unit,
        normalizeMetricTrend(d.trend ?? existing.trend),
        d.trendValue !== undefined ? d.trendValue : existing.trend_value,
        normalizeMetricStatus(d.status ?? existing.status),
        d.lastUpdated !== undefined ? d.lastUpdated : existing.last_updated,
        now(),
        id,
      );
      const updated = db.prepare('SELECT * FROM compliance_metrics WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: mapComplianceMetric(updated) });
    } finally { db.close(); }
  });

  // ── Regulatory Requirements ────────────────────────────────────────────────

  // GET /api/compliance/reporting/requirements
  app.get('/api/compliance/reporting/requirements', (c) => {
    const status = c.req.query('status');
    const db = getDb();
    try {
      let sql = 'SELECT * FROM compliance_requirements WHERE 1=1';
      const params: string[] = [];
      if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
      sql += ' ORDER BY due_date ASC, updated_at DESC';
      const rows = db.prepare(sql).all(...params) as any[];
      return c.json({ success: true, data: rows.map(mapRegulatoryRequirement) });
    } finally { db.close(); }
  });

  // PUT /api/compliance/reporting/requirements/:id
  app.put('/api/compliance/reporting/requirements/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const parsed = UpdateRequirementSchema.safeParse(body);
    if (!parsed.success) return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    const d = parsed.data;
    const db = getDb();
    try {
      const existing = db.prepare('SELECT * FROM compliance_requirements WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Not found' }, 404);
      db.prepare(`
        UPDATE compliance_requirements SET
          regulation = ?, agency = ?, frequency = ?, due_date = ?, status = ?,
          assigned_to = ?, evidence = ?, last_review = ?, updated_at = ?
        WHERE id = ?
      `).run(
        d.regulation !== undefined ? d.regulation : (existing.regulation ?? null),
        d.agency !== undefined ? d.agency : (existing.agency ?? null),
        d.frequency !== undefined ? d.frequency : (existing.frequency ?? null),
        d.dueDate !== undefined ? d.dueDate : (existing.due_date ?? null),
        normalizeReqStatus(d.status ?? existing.status),
        d.assignedTo !== undefined ? d.assignedTo : (existing.assigned_to ?? existing.assignee ?? null),
        d.evidence !== undefined ? JSON.stringify(d.evidence) : (existing.evidence ?? null),
        d.lastReview !== undefined ? d.lastReview : (existing.last_review ?? existing.last_assessed_date ?? null),
        now(),
        id,
      );
      const updated = db.prepare('SELECT * FROM compliance_requirements WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: mapRegulatoryRequirement(updated) });
    } finally { db.close(); }
  });
}
