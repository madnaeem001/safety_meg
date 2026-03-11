import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProdRoute ? '/data/local.sqlite' : resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Date.now();

function safeJson(val: any): any {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

function formatDateOnly(value?: string | null) {
  if (!value) return '';
  return value.split('T')[0];
}

function normalizeCalendarType(value?: string | null) {
  switch (value) {
    case 'audit':
      return 'audit';
    case 'inspection':
      return 'inspection';
    case 'training':
      return 'training';
    case 'certification':
      return 'certification';
    case 'renewal':
    case 'certification-renewal':
      return 'renewal';
    case 'regulatory':
    case 'regulation-deadline':
    case 'review':
    case 'reporting':
      return 'regulatory';
    default:
      return 'audit';
  }
}

function normalizeCalendarStatus(value?: string | null, dueDate?: string | null) {
  const dateOnly = formatDateOnly(dueDate);
  const today = new Date().toISOString().split('T')[0];
  if (value === 'completed') return 'completed';
  if (value === 'in-progress') return 'in-progress';
  if (value === 'overdue') return 'overdue';
  if (dateOnly && value !== 'cancelled' && dateOnly < today) return 'overdue';
  return 'upcoming';
}

function normalizeCalendarPriority(value?: string | null) {
  if (value === 'critical') return 'high';
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'medium';
}

function calculateDaysLeft(dueDate?: string | null) {
  const dateOnly = formatDateOnly(dueDate);
  if (!dateOnly) return undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateOnly}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function mapCalendarEvent(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    date: formatDateOnly(row.due_date),
    dueDate: formatDateOnly(row.due_date),
    type: normalizeCalendarType(row.event_type),
    eventType: row.event_type,
    status: normalizeCalendarStatus(row.status, row.due_date),
    priority: normalizeCalendarPriority(row.priority),
    assignee: row.assigned_to ?? '',
    assignedTo: row.assigned_to ?? '',
    department: row.department ?? '',
    description: row.description ?? '',
    regulation: row.regulation ?? row.related_item ?? '',
    relatedItem: row.related_item ?? '',
    daysLeft: calculateDaysLeft(row.due_date),
    completedAt: row.completed_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const STANDARD_ID_MAP: Record<string, string> = {
  ISO45001: 'iso-45001', ISO14001: 'iso-14001', ISO9001: 'iso-9001',
  OSHA: 'osha', EPA: 'epa', NFPA: 'nfpa', WHO: 'who', local: 'local',
};

function normalizeGapStatus(value?: string | null): 'open' | 'in_progress' | 'resolved' | 'accepted_risk' {
  switch (value) {
    case 'in-progress': case 'in_progress': return 'in_progress';
    case 'completed': case 'resolved': return 'resolved';
    case 'accepted-risk': case 'accepted_risk': return 'accepted_risk';
    default: return 'open';
  }
}

function toDbGapStatus(value?: string | null): string {
  switch (value) {
    case 'in_progress': return 'in-progress';
    case 'resolved': return 'completed';
    case 'accepted_risk': return 'accepted-risk';
    default: return 'draft';
  }
}

function normalizeGapSeverity(severity?: string | null, riskLevel?: string | null): 'critical' | 'major' | 'minor' | 'observation' {
  if (severity && ['critical', 'major', 'minor', 'observation'].includes(severity))
    return severity as 'critical' | 'major' | 'minor' | 'observation';
  switch (riskLevel) {
    case 'critical': return 'critical';
    case 'high': return 'major';
    case 'medium': return 'minor';
    case 'low': return 'observation';
    default: return 'minor';
  }
}

function normalizeGapEffort(effort?: string | null, riskLevel?: string | null): 'low' | 'medium' | 'high' {
  if (effort && ['low', 'medium', 'high'].includes(effort)) return effort as 'low' | 'medium' | 'high';
  if (riskLevel === 'critical' || riskLevel === 'high') return 'high';
  if (riskLevel === 'medium') return 'medium';
  return 'low';
}

function mapGapItem(row: any) {
  if (!row) return null;
  const rl = row.risk_level;
  return {
    id: row.id,
    standardId: row.standard_id || STANDARD_ID_MAP[row.standard] || row.standard || 'iso-45001',
    standard: row.standard ?? '',
    clauseId: row.clause_id || `gap-${row.id}`,
    clauseTitle: row.title,
    requirement: row.requirement ?? row.notes ?? '',
    currentState: row.current_state ?? 'Non-compliant',
    desiredState: row.desired_state ?? 'Fully compliant',
    gap: row.gap_description ?? row.notes ?? '',
    severity: normalizeGapSeverity(row.severity, rl),
    impact: row.impact ?? '',
    remediation: row.remediation ?? '',
    effort: normalizeGapEffort(row.effort, rl),
    priority: row.priority_order ?? (rl === 'critical' ? 1 : rl === 'high' ? 2 : rl === 'medium' ? 3 : 4),
    owner: row.owner ?? row.evaluated_by ?? '',
    targetDate: row.target_date ?? row.evaluation_date ?? '',
    status: normalizeGapStatus(row.status),
    notes: row.notes ?? '',
    riskLevel: rl ?? '',
    complianceRate: row.compliance_rate ?? null,
    evaluationDate: row.evaluation_date ?? '',
    evaluatedBy: row.evaluated_by ?? '',
    findings: safeJson(row.findings),
    actionItems: safeJson(row.action_items),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const CreateGapSchema = z.object({
  title: z.string().min(1),
  standardId: z.string().optional(),
  standard: z.enum(['ISO45001', 'OSHA', 'EPA', 'NFPA', 'WHO', 'ISO14001', 'ISO9001', 'local']).optional(),
  clauseId: z.string().optional(),
  requirement: z.string().optional(),
  currentState: z.string().optional(),
  desiredState: z.string().optional(),
  gapDescription: z.string().optional(),
  severity: z.enum(['critical', 'major', 'minor', 'observation']).optional(),
  impact: z.string().optional(),
  remediation: z.string().optional(),
  effort: z.enum(['low', 'medium', 'high']).optional(),
  priorityOrder: z.number().int().positive().optional(),
  owner: z.string().optional(),
  targetDate: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'accepted_risk', 'draft', 'in-progress', 'completed', 'accepted-risk']).optional().default('open'),
  evaluationDate: z.string().optional(),
  evaluatedBy: z.string().optional(),
  findings: z.array(z.any()).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  actionItems: z.array(z.any()).optional(),
  complianceRate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

const CreateCalSchema = z.object({
  title: z.string().min(1),
  eventType: z.enum(['audit', 'inspection', 'certification-renewal', 'certification', 'regulation-deadline', 'regulatory', 'renewal', 'review', 'training', 'reporting']),
  dueDate: z.string().min(1),
  assignedTo: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['upcoming', 'overdue', 'completed', 'cancelled', 'in-progress']).optional().default('upcoming'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  description: z.string().optional(),
  regulation: z.string().optional(),
  relatedItem: z.string().optional(),
});

export function complianceCalendarRoutes(app: Hono) {

  // ---- GAP ANALYSIS ----

  // GET /api/compliance/gap-analysis/stats
  app.get('/api/compliance/gap-analysis/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as cnt FROM gap_analysis_reports').get() as any).cnt;
      const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM gap_analysis_reports GROUP BY status').all();
      const byStandard = db.prepare('SELECT standard, COUNT(*) as count FROM gap_analysis_reports GROUP BY standard').all();
      const avgCompliance = (db.prepare(
        'SELECT AVG(compliance_rate) as avg FROM gap_analysis_reports WHERE compliance_rate IS NOT NULL'
      ).get() as any).avg;
      return c.json({ success: true, data: { total, byStatus, byStandard, avgComplianceRate: avgCompliance ?? 0 } });
    } finally { db.close(); }
  });

  // GET /api/compliance/gap-analysis — list
  app.get('/api/compliance/gap-analysis', (c) => {
    const db = getDb();
    try {
      const { status, standard } = c.req.query();
      let sql = 'SELECT * FROM gap_analysis_reports WHERE 1=1';
      const params: any[] = [];
      if (status) { sql += ' AND status = ?'; params.push(status); }
      if (standard) { sql += ' AND standard = ?'; params.push(standard); }
      sql += ' ORDER BY created_at DESC';
      const rows = db.prepare(sql).all(...params).map(mapGapItem);
      return c.json({ success: true, data: rows, total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/compliance/gap-analysis — create
  app.post('/api/compliance/gap-analysis', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateGapSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);
      const d = parsed.data;
      const ts = now();
      const dbStatus = toDbGapStatus(d.status);
      const result = db.prepare(`
        INSERT INTO gap_analysis_reports (
          title, standard_id, standard, clause_id, requirement, current_state, desired_state,
          gap_description, severity, impact, remediation, effort, priority_order, owner, target_date,
          evaluation_date, evaluated_by, findings, risk_level, status, action_items,
          compliance_rate, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        d.title, d.standardId ?? null, d.standard ?? null, d.clauseId ?? null,
        d.requirement ?? null, d.currentState ?? null, d.desiredState ?? null,
        d.gapDescription ?? null, d.severity ?? null, d.impact ?? null, d.remediation ?? null,
        d.effort ?? null, d.priorityOrder ?? null, d.owner ?? null, d.targetDate ?? null,
        d.evaluationDate ?? null, d.evaluatedBy ?? null,
        d.findings ? JSON.stringify(d.findings) : null,
        d.riskLevel ?? null, dbStatus,
        d.actionItems ? JSON.stringify(d.actionItems) : null,
        d.complianceRate ?? null, d.notes ?? null, ts, ts,
      );
      const created = db.prepare('SELECT * FROM gap_analysis_reports WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapGapItem(created) }, 201);
    } finally { db.close(); }
  });

  // GET /api/compliance/gap-analysis/:id
  app.get('/api/compliance/gap-analysis/:id', (c) => {
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM gap_analysis_reports WHERE id = ?').get(c.req.param('id')) as any;
      if (!row) return c.json({ success: false, error: 'Report not found' }, 404);
      return c.json({ success: true, data: mapGapItem(row) });
    } finally { db.close(); }
  });

  // PUT /api/compliance/gap-analysis/:id
  app.put('/api/compliance/gap-analysis/:id', async (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM gap_analysis_reports WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ success: false, error: 'Report not found' }, 404);
      const body = await c.req.json();
      const fields: string[] = [];
      const params: any[] = [];
      const colMap: Record<string, string> = {
        standardId: 'standard_id', clauseId: 'clause_id', currentState: 'current_state',
        desiredState: 'desired_state', gapDescription: 'gap_description', priorityOrder: 'priority_order',
        targetDate: 'target_date', evaluationDate: 'evaluation_date', evaluatedBy: 'evaluated_by',
        riskLevel: 'risk_level', actionItems: 'action_items', complianceRate: 'compliance_rate',
      };
      const allowed = [
        'title', 'standard_id', 'standard', 'clause_id', 'requirement', 'current_state', 'desired_state',
        'gap_description', 'severity', 'impact', 'remediation', 'effort', 'priority_order', 'owner',
        'target_date', 'evaluation_date', 'evaluated_by', 'findings', 'risk_level', 'status',
        'action_items', 'compliance_rate', 'notes',
      ];
      for (const [k, v] of Object.entries(body)) {
        const col = colMap[k] ?? k;
        let val: any = v;
        if (k === 'findings' || k === 'actionItems') val = JSON.stringify(v);
        if (k === 'status') val = toDbGapStatus(v as string);
        if (allowed.includes(col)) { fields.push(`${col} = ?`); params.push(val); }
      }
      if (!fields.length) return c.json({ success: false, error: 'No valid fields' }, 400);
      fields.push('updated_at = ?'); params.push(now()); params.push(c.req.param('id'));
      db.prepare(`UPDATE gap_analysis_reports SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM gap_analysis_reports WHERE id = ?').get(c.req.param('id')) as any;
      return c.json({ success: true, data: mapGapItem(updated) });
    } finally { db.close(); }
  });

  // DELETE /api/compliance/gap-analysis/:id
  app.delete('/api/compliance/gap-analysis/:id', (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM gap_analysis_reports WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ success: false, error: 'Report not found' }, 404);
      db.prepare('DELETE FROM gap_analysis_reports WHERE id = ?').run(c.req.param('id'));
      return c.json({ success: true, message: 'Report deleted' });
    } finally { db.close(); }
  });

  // ---- COMPLIANCE CALENDAR ----

  // GET /api/compliance/calendar/stats
  app.get('/api/compliance/calendar/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as cnt FROM compliance_calendar').get() as any).cnt;
      const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM compliance_calendar GROUP BY status').all();
      const byType = db.prepare('SELECT event_type, COUNT(*) as count FROM compliance_calendar GROUP BY event_type').all();
      const byPriority = db.prepare('SELECT priority, COUNT(*) as count FROM compliance_calendar GROUP BY priority').all();
      const todayStr = new Date().toISOString().split('T')[0];
      const overdue = (db.prepare(
        "SELECT COUNT(*) as cnt FROM compliance_calendar WHERE status='upcoming' AND due_date < ?"
      ).get(todayStr) as any).cnt;
      const upcoming7 = db.prepare(
        "SELECT * FROM compliance_calendar WHERE status='upcoming' AND due_date >= ? ORDER BY due_date ASC LIMIT 10"
      ).all(todayStr);
      return c.json({ success: true, data: { total, byStatus, byType, byPriority, overdue, upcoming7: upcoming7.map(mapCalendarEvent) } });
    } finally { db.close(); }
  });

  // GET /api/compliance/calendar — list
  app.get('/api/compliance/calendar', (c) => {
    const db = getDb();
    try {
      const { status, eventType, department, from, to, priority, year, month } = c.req.query();
      let sql = 'SELECT * FROM compliance_calendar WHERE 1=1';
      const params: any[] = [];
      if (status) { sql += ' AND status = ?'; params.push(status); }
      if (eventType) { sql += ' AND event_type = ?'; params.push(eventType); }
      if (department) { sql += ' AND department = ?'; params.push(department); }
      if (priority) { sql += ' AND priority = ?'; params.push(priority); }
      if (from) { sql += ' AND due_date >= ?'; params.push(from); }
      if (to) { sql += ' AND due_date <= ?'; params.push(to); }
      if (year && month) {
        const monthPadded = String(month).padStart(2, '0');
        sql += " AND substr(due_date, 1, 7) = ?";
        params.push(`${year}-${monthPadded}`);
      }
      sql += ' ORDER BY due_date ASC';
      const rows = db.prepare(sql).all(...params);
      return c.json({ success: true, data: rows.map(mapCalendarEvent), total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/compliance/calendar — create
  app.post('/api/compliance/calendar', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateCalSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);
      const d = parsed.data;
      const ts = now();
      const result = db.prepare(`
        INSERT INTO compliance_calendar (title, event_type, due_date, assigned_to, department,
          status, priority, description, regulation, related_item, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(d.title, d.eventType, d.dueDate, d.assignedTo ?? null, d.department ?? null,
        d.status, d.priority, d.description ?? null, d.regulation ?? null, d.relatedItem ?? null, ts, ts);
      const created = db.prepare('SELECT * FROM compliance_calendar WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapCalendarEvent(created) }, 201);
    } finally { db.close(); }
  });

  // GET /api/compliance/calendar/:id
  app.get('/api/compliance/calendar/:id', (c) => {
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM compliance_calendar WHERE id = ?').get(c.req.param('id'));
      if (!row) return c.json({ success: false, error: 'Event not found' }, 404);
      return c.json({ success: true, data: mapCalendarEvent(row) });
    } finally { db.close(); }
  });

  // PUT /api/compliance/calendar/:id
  app.put('/api/compliance/calendar/:id', async (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM compliance_calendar WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ success: false, error: 'Event not found' }, 404);
      const body = await c.req.json();
      const fields: string[] = [];
      const params: any[] = [];
      const map: Record<string, string> = { eventType: 'event_type', dueDate: 'due_date', assignedTo: 'assigned_to', regulation: 'regulation', relatedItem: 'related_item', completedAt: 'completed_at' };
      const allowed = ['title', 'event_type', 'due_date', 'assigned_to', 'department', 'status', 'priority', 'description', 'regulation', 'related_item', 'completed_at'];
      for (const [k, v] of Object.entries(body)) {
        const col = map[k] ?? k;
        if (allowed.includes(col)) { fields.push(`${col} = ?`); params.push(v); }
      }
      if (!fields.length) return c.json({ success: false, error: 'No valid fields' }, 400);
      // auto-set completedAt when marking completed
      if (body.status === 'completed' && !body.completedAt) { fields.push('completed_at = ?'); params.push(now()); }
      fields.push('updated_at = ?'); params.push(now()); params.push(c.req.param('id'));
      db.prepare(`UPDATE compliance_calendar SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM compliance_calendar WHERE id = ?').get(c.req.param('id'));
      return c.json({ success: true, data: mapCalendarEvent(updated) });
    } finally { db.close(); }
  });

  // DELETE /api/compliance/calendar/:id
  app.delete('/api/compliance/calendar/:id', (c) => {
    const db = getDb();
    try {
      const existing = db.prepare('SELECT id FROM compliance_calendar WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ success: false, error: 'Event not found' }, 404);
      db.prepare('DELETE FROM compliance_calendar WHERE id = ?').run(c.req.param('id'));
      return c.json({ success: true, message: 'Event deleted' });
    } finally { db.close(); }
  });
}
