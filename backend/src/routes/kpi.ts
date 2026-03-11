import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProdRoute ? '/data/local.sqlite' : resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Math.floor(Date.now() / 1000);

// ── Month abbreviation lookup ─────────────────────────────────────────────
const MONTH_ABBR: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

// ── Standard KPI seed definitions ────────────────────────────────────────
const KPI_SEEDS = [
  { kpiCode: 'safety_observations', name: 'Safety Observations',        description: 'Number of safety observations reported',            category: 'leading', unit: 'observations', target: 100, benchmark: null,   frequency: 'monthly'   },
  { kpiCode: 'near_miss_reports',   name: 'Near Miss Reports',          description: 'Proactive near miss reporting rate',                 category: 'leading', unit: 'reports',      target: 50,  benchmark: null,   frequency: 'monthly'   },
  { kpiCode: 'training_completion', name: 'Training Completion Rate',   description: 'Percentage of required training completed',          category: 'leading', unit: '%',            target: 100, benchmark: null,   frequency: 'quarterly' },
  { kpiCode: 'inspection_completion', name: 'Inspection Completion',   description: 'Scheduled inspections completed on time',            category: 'leading', unit: '%',            target: 100, benchmark: null,   frequency: 'monthly'   },
  { kpiCode: 'hazard_id',           name: 'Hazards Identified',        description: 'New hazards identified proactively',                 category: 'leading', unit: 'hazards',      target: 30,  benchmark: null,   frequency: 'monthly'   },
  { kpiCode: 'toolbox_talks',       name: 'Toolbox Talk Participation', description: 'Average attendance at daily toolbox talks',         category: 'leading', unit: '%',            target: 95,  benchmark: null,   frequency: 'monthly'   },
  { kpiCode: 'trir',                name: 'TRIR',                      description: 'OSHA recordable incidents per 200,000 hours',       category: 'lagging', unit: '',             target: 1.0, benchmark: 2.8,    frequency: 'monthly'   },
  { kpiCode: 'dart',                name: 'DART Rate',                 description: 'DART incidents per 200,000 hours worked',           category: 'lagging', unit: '',             target: 0.5, benchmark: 1.4,    frequency: 'monthly'   },
  { kpiCode: 'ltir',                name: 'LTIR',                      description: 'Lost time incidents per 200,000 hours',             category: 'lagging', unit: '',             target: 0.3, benchmark: 0.9,    frequency: 'monthly'   },
  { kpiCode: 'severity_rate',       name: 'Severity Rate',             description: 'Average days lost per recordable incident',         category: 'lagging', unit: 'days',         target: 5,   benchmark: 12,     frequency: 'monthly'   },
  { kpiCode: 'first_aid',           name: 'First Aid Cases',           description: 'Minor incidents requiring first aid only',          category: 'lagging', unit: 'cases',        target: 10,  benchmark: 20,     frequency: 'monthly'   },
  { kpiCode: 'days_without_incident', name: 'Days Without LTI',       description: 'Consecutive days since last lost time incident',   category: 'lagging', unit: 'days',         target: 365, benchmark: 90,     frequency: 'monthly'   },
];

const READING_SEEDS: Record<string, number[]> = {
  safety_observations:    [65, 72, 78, 82, 80, 87],
  near_miss_reports:      [28, 32, 35, 38, 40, 43],
  training_completion:    [85, 88, 90, 91, 92, 94],
  inspection_completion:  [88, 90, 92, 93, 95, 96],
  hazard_id:              [18, 20, 22, 24, 26, 28],
  toolbox_talks:          [82, 84, 86, 88, 89, 91],
  trir:                   [1.8, 1.6, 1.5, 1.4, 1.3, 1.2],
  dart:                   [1.2, 1.1, 1.0, 0.9, 0.85, 0.8],
  ltir:                   [0.7, 0.65, 0.55, 0.5, 0.45, 0.4],
  severity_rate:          [9.5, 9.0, 8.5, 8.0, 7.5, 7.2],
  first_aid:              [18, 16, 15, 14, 13, 12],
  days_without_incident:  [45, 76, 0, 30, 61, 127],
};

const SEED_PERIODS = ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01'];

const INCIDENT_BREAKDOWN_FALLBACK = [
  { name: 'Slips/Trips/Falls',  value: 28, color: '#ef4444' },
  { name: 'Struck By/Against',  value: 22, color: '#f97316' },
  { name: 'Caught In/Between',  value: 15, color: '#eab308' },
  { name: 'Overexertion',       value: 18, color: '#22c55e' },
  { name: 'Chemical Exposure',  value: 10, color: '#3b82f6' },
  { name: 'Other',              value: 7,  color: '#8b5cf6' },
];

const DEPT_COMPARISON_FALLBACK = [
  { dept: 'Operations',   leading: 92, lagging: 1.1 },
  { dept: 'Maintenance',  leading: 88, lagging: 1.4 },
  { dept: 'Construction', leading: 85, lagging: 1.8 },
  { dept: 'Warehouse',    leading: 90, lagging: 1.2 },
  { dept: 'Admin',        leading: 95, lagging: 0.5 },
];

// ── Schema migrations (idempotent) ────────────────────────────────────────
function ensureKpiSchema(db: any) {
  const alterations: [string, string][] = [
    ['kpi_code',    'TEXT'],
    ['description', 'TEXT'],
    ['benchmark',   'REAL'],
  ];
  for (const [col, def] of alterations) {
    try { db.exec(`ALTER TABLE kpi_definitions ADD COLUMN ${col} ${def}`); } catch {}
  }
}

// ── Seed standard KPI definitions + 6-month readings ─────────────────────
function seedKpiData(db: any) {
  const ts = now();
  for (const kpi of KPI_SEEDS) {
    const existing = db.prepare('SELECT id FROM kpi_definitions WHERE kpi_code=?').get(kpi.kpiCode) as any;
    let defId: number;
    if (!existing) {
      const r = db.prepare(`
        INSERT INTO kpi_definitions
          (kpi_code, name, description, category, unit, target, benchmark, frequency, is_active, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,1,?,?)
      `).run(
        kpi.kpiCode, kpi.name, kpi.description, kpi.category,
        kpi.unit, kpi.target, kpi.benchmark ?? null, kpi.frequency, ts, ts
      );
      defId = Number(r.lastInsertRowid);
    } else {
      defId = existing.id;
    }
    // Seed readings only if this KPI has none yet
    const count = (db.prepare('SELECT COUNT(*) as n FROM kpi_readings WHERE kpi_id=?').get(defId) as any).n;
    if (count === 0) {
      const vals = READING_SEEDS[kpi.kpiCode];
      if (vals) {
        for (let i = 0; i < SEED_PERIODS.length; i++) {
          db.prepare('INSERT INTO kpi_readings (kpi_id, value, period, created_at) VALUES (?,?,?,?)').run(
            defId, vals[i], SEED_PERIODS[i], ts - (SEED_PERIODS.length - i) * 86400 * 30
          );
        }
      }
    }
  }
}

let _kpiInitialized = false;
function initKpiOnce() {
  if (_kpiInitialized) return;
  _kpiInitialized = true;
  const db = getDb();
  try {
    ensureKpiSchema(db);
    seedKpiData(db);
  } finally { db.close(); }
}

const CreateKpiDefSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['leading', 'lagging']),
  unit: z.string().optional(),
  target: z.number().optional(),
  warningThreshold: z.number().optional(),
  criticalThreshold: z.number().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annual']).optional(),
  department: z.string().optional(),
});

const CreateReadingSchema = z.object({
  kpiId: z.number(),
  value: z.number(),
  period: z.string().min(1),
  recordedBy: z.string().optional(),
  notes: z.string().optional(),
});

export function kpiRoutes(app: Hono) {
  initKpiOnce();

  // GET /api/kpi/stats [STATIC first]
  app.get('/api/kpi/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as n FROM kpi_definitions').get() as any).n;
      const active = (db.prepare('SELECT COUNT(*) as n FROM kpi_definitions WHERE is_active=1').get() as any).n;
      const leading = (db.prepare("SELECT COUNT(*) as n FROM kpi_definitions WHERE category='leading'").get() as any).n;
      const lagging = (db.prepare("SELECT COUNT(*) as n FROM kpi_definitions WHERE category='lagging'").get() as any).n;
      const totalReadings = (db.prepare('SELECT COUNT(*) as n FROM kpi_readings').get() as any).n;
      const byDepartment = db.prepare('SELECT department, COUNT(*) as count FROM kpi_definitions WHERE department IS NOT NULL GROUP BY department').all();
      return c.json({ success: true, data: { total, active, leading, lagging, totalReadings, byDepartment } });
    } finally { db.close(); }
  });

  // GET /api/kpi/dashboard — enriched: kpiCode, description, changePct, history
  app.get('/api/kpi/dashboard', (c) => {
    const db = getDb();
    try {
      const { category, department } = c.req.query();
      let defSql = 'SELECT * FROM kpi_definitions WHERE is_active=1';
      const defParams: any[] = [];
      if (category) { defSql += ' AND category=?'; defParams.push(category); }
      if (department) { defSql += ' AND department=?'; defParams.push(department); }
      const defs = db.prepare(defSql).all(...defParams) as any[];

      const result = defs.map((def) => {
        const readings = db.prepare(
          'SELECT * FROM kpi_readings WHERE kpi_id=? ORDER BY period ASC, created_at ASC'
        ).all(def.id) as any[];
        const latest = readings[readings.length - 1] ?? null;
        const prev   = readings[readings.length - 2] ?? null;

        let statusVsTarget = 'no-data';
        let trendVsPrev: string | null = null;
        let changePct: string | null = null;

        if (latest) {
          if (def.target !== null) {
            if (def.category === 'lagging') {
              statusVsTarget = latest.value <= def.target ? 'on-target' :
                (def.warning_threshold && latest.value <= def.warning_threshold ? 'warning' : 'critical');
            } else {
              const ratio = latest.value / def.target;
              statusVsTarget = ratio >= 1 ? 'on-target' : (ratio >= 0.8 ? 'warning' : 'critical');
            }
          }
          if (prev && prev.value !== 0) {
            trendVsPrev = latest.value > prev.value ? 'up' : latest.value < prev.value ? 'down' : 'stable';
            const pct = ((latest.value - prev.value) / Math.abs(prev.value)) * 100;
            changePct = (pct >= 0 ? '+' : '') + pct.toFixed(0) + '%';
          }
        }

        // Last 6 readings for sparkline charts
        const history = readings.slice(-6).map((r: any) => ({
          month: MONTH_ABBR[(r.period as string).split('-')[1]] ?? r.period,
          value: r.value,
        }));

        return {
          id:            def.id,
          kpiCode:       def.kpi_code ?? null,
          name:          def.name,
          description:   def.description ?? null,
          category:      def.category,
          unit:          def.unit ?? '',
          target:        def.target,
          benchmark:     def.benchmark ?? null,
          frequency:     def.frequency,
          department:    def.department ?? null,
          isActive:      def.is_active === 1,
          latestValue:   latest?.value ?? null,
          latestPeriod:  latest?.period ?? null,
          statusVsTarget,
          trendVsPrev,
          changePct,
          history,
        };
      });
      return c.json({ success: true, data: result });
    } finally { db.close(); }
  });

  // GET /api/kpi/department-comparison
  app.get('/api/kpi/department-comparison', (c) => {
    const db = getDb();
    try {
      const depts = db.prepare(`
        SELECT department,
          COUNT(*) as incident_count,
          SUM(CASE WHEN severity IN ('Critical','High') THEN 1 ELSE 0 END) as severe_count
        FROM incidents
        WHERE department IS NOT NULL AND department != ''
        GROUP BY department
        ORDER BY incident_count DESC
        LIMIT 8
      `).all() as any[];

      if (depts.length > 0) {
        const maxInc = Math.max(...depts.map((d: any) => d.incident_count as number), 1);
        const data = depts.map((d: any) => ({
          dept:    d.department,
          leading: Math.round(Math.max(60, 100 - (d.incident_count / maxInc) * 35)),
          lagging: Math.round((d.severe_count / Math.max(d.incident_count, 1)) * 3 * 10) / 10,
        }));
        return c.json({ success: true, data });
      }
      return c.json({ success: true, data: DEPT_COMPARISON_FALLBACK });
    } finally { db.close(); }
  });

  // GET /api/kpi/incident-breakdown
  app.get('/api/kpi/incident-breakdown', (c) => {
    const db = getDb();
    try {
      const rows = db.prepare(`
        SELECT incident_type as name, COUNT(*) as value
        FROM incidents
        WHERE incident_type IS NOT NULL AND incident_type != ''
        GROUP BY incident_type
        ORDER BY value DESC
        LIMIT 7
      `).all() as any[];

      if (rows.length > 0) {
        const colors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899'];
        return c.json({ success: true, data: rows.map((r: any, i: number) => ({ ...r, color: colors[i] })) });
      }
      return c.json({ success: true, data: INCIDENT_BREAKDOWN_FALLBACK });
    } finally { db.close(); }
  });

  // GET /api/kpi/definitions [STATIC before /definitions/:id]
  app.get('/api/kpi/definitions', (c) => {
    const db = getDb();
    try {
      const { category, department, isActive } = c.req.query();
      let sql = 'SELECT * FROM kpi_definitions WHERE 1=1';
      const params: any[] = [];
      if (category) { sql += ' AND category=?'; params.push(category); }
      if (department) { sql += ' AND department=?'; params.push(department); }
      if (isActive !== undefined) { sql += ' AND is_active=?'; params.push(isActive === 'true' ? 1 : 0); }
      sql += ' ORDER BY created_at DESC';
      return c.json({ success: true, data: db.prepare(sql).all(...params) });
    } finally { db.close(); }
  });

  // POST /api/kpi/definitions
  app.post('/api/kpi/definitions', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateKpiDefSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
      const d = parsed.data;
      const ts = now();
      const result = db.prepare(`
        INSERT INTO kpi_definitions
        (name, description, category, unit, target, warning_threshold, critical_threshold,
         frequency, department, is_active, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,1,?,?)
      `).run(
        d.name, d.description ?? null, d.category, d.unit ?? null,
        d.target ?? null, d.warningThreshold ?? null, d.criticalThreshold ?? null,
        d.frequency ?? 'monthly', d.department ?? null, ts, ts
      );
      const def = db.prepare('SELECT * FROM kpi_definitions WHERE id=?').get(result.lastInsertRowid);
      return c.json({ success: true, data: def }, 201);
    } finally { db.close(); }
  });

  // GET /api/kpi/definitions/:id
  app.get('/api/kpi/definitions/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const def = db.prepare('SELECT * FROM kpi_definitions WHERE id=?').get(id) as any;
      if (!def) return c.json({ success: false, error: 'KPI definition not found' }, 404);
      const recentReadings = db.prepare('SELECT * FROM kpi_readings WHERE kpi_id=? ORDER BY created_at DESC LIMIT 12').all(id);
      return c.json({ success: true, data: { ...def, recentReadings } });
    } finally { db.close(); }
  });

  // PUT /api/kpi/definitions/:id
  app.put('/api/kpi/definitions/:id', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const def = db.prepare('SELECT * FROM kpi_definitions WHERE id=?').get(id) as any;
      if (!def) return c.json({ success: false, error: 'KPI definition not found' }, 404);
      const body = await c.req.json();
      const ts = now();
      const fields: string[] = [];
      const vals: any[] = [];
      const colMap: Record<string, string> = {
        name: 'name', description: 'description', category: 'category', unit: 'unit',
        target: 'target', warningThreshold: 'warning_threshold', criticalThreshold: 'critical_threshold',
        frequency: 'frequency', department: 'department', isActive: 'is_active',
      };
      for (const [camel, col] of Object.entries(colMap)) {
        if (body[camel] !== undefined) { fields.push(`${col}=?`); vals.push(body[camel]); }
      }
      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at=?'); vals.push(ts); vals.push(id);
      db.prepare(`UPDATE kpi_definitions SET ${fields.join(', ')} WHERE id=?`).run(...vals);
      const updated = db.prepare('SELECT * FROM kpi_definitions WHERE id=?').get(id);
      return c.json({ success: true, data: updated });
    } finally { db.close(); }
  });

  // DELETE /api/kpi/definitions/:id
  app.delete('/api/kpi/definitions/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      const def = db.prepare('SELECT * FROM kpi_definitions WHERE id=?').get(id) as any;
      if (!def) return c.json({ success: false, error: 'KPI definition not found' }, 404);
      db.prepare('DELETE FROM kpi_readings WHERE kpi_id=?').run(id);
      db.prepare('DELETE FROM kpi_definitions WHERE id=?').run(id);
      return c.json({ success: true, message: 'KPI definition deleted' });
    } finally { db.close(); }
  });

  // GET /api/kpi/readings — supports both kpiId and kpiCode filters
  app.get('/api/kpi/readings', (c) => {
    const db = getDb();
    try {
      const { kpiId, kpiCode, period, from, to } = c.req.query();
      let sql = `SELECT r.*, d.name as kpi_name, d.kpi_code, d.unit, d.category
                 FROM kpi_readings r JOIN kpi_definitions d ON r.kpi_id=d.id WHERE 1=1`;
      const params: any[] = [];
      if (kpiId)   { sql += ' AND r.kpi_id=?';   params.push(Number(kpiId)); }
      if (kpiCode) { sql += ' AND d.kpi_code=?'; params.push(kpiCode); }
      if (period)  { sql += ' AND r.period=?';   params.push(period); }
      if (from)    { sql += ' AND r.created_at >= ?'; params.push(Number(from)); }
      if (to)      { sql += ' AND r.created_at <= ?'; params.push(Number(to)); }
      sql += ' ORDER BY r.period ASC, r.created_at ASC';
      return c.json({ success: true, data: db.prepare(sql).all(...params) });
    } finally { db.close(); }
  });

  // POST /api/kpi/readings
  app.post('/api/kpi/readings', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateReadingSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
      const d = parsed.data;
      const def = db.prepare('SELECT * FROM kpi_definitions WHERE id=?').get(d.kpiId) as any;
      if (!def) return c.json({ success: false, error: 'KPI definition not found' }, 404);
      const ts = now();
      const result = db.prepare(`
        INSERT INTO kpi_readings (kpi_id, value, period, recorded_by, notes, created_at)
        VALUES (?,?,?,?,?,?)
      `).run(d.kpiId, d.value, d.period, d.recordedBy ?? null, d.notes ?? null, ts);
      const reading = db.prepare(`
        SELECT r.*, d.name as kpi_name, d.unit FROM kpi_readings r
        JOIN kpi_definitions d ON r.kpi_id=d.id WHERE r.id=?
      `).get(result.lastInsertRowid);
      return c.json({ success: true, data: reading }, 201);
    } finally { db.close(); }
  });
}
