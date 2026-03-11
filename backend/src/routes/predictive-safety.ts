/**
 * Predictive Safety AI Routes
 *
 * Resource groups:
 *   /api/predictive-safety/stats                                    — aggregate KPIs
 *   /api/predictive-safety/model-metrics                           — ML model performance
 *   /api/predictive-safety/predictions                             — Safety prediction CRUD
 *   /api/predictive-safety/predictions/:id/recommendations/:recId  — Recommendation update
 *   /api/predictive-safety/insights                                — AI insight CRUD
 */

import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../../local.sqlite');

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF');
  return db;
}

function nowMs() { return Date.now(); }

function safeJson(val: any): any[] {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

// ── Schema ─────────────────────────────────────────────────────────────────────

function ensureSchema(db: ReturnType<typeof getDb>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS predictive_predictions (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      prediction_id        TEXT    NOT NULL UNIQUE,
      type                 TEXT    NOT NULL DEFAULT 'incident'
                                   CHECK(type IN ('incident','near_miss','hazard','equipment_failure','ergonomic','environmental')),
      title                TEXT    NOT NULL,
      description          TEXT    NOT NULL DEFAULT '',
      location             TEXT    NOT NULL DEFAULT '',
      department           TEXT    NOT NULL DEFAULT '',
      probability          INTEGER NOT NULL DEFAULT 0,
      severity             TEXT    NOT NULL DEFAULT 'medium'
                                   CHECK(severity IN ('low','medium','high','critical')),
      timeframe            TEXT    NOT NULL DEFAULT 'medium_term'
                                   CHECK(timeframe IN ('immediate','short_term','medium_term','long_term')),
      predicted_date       TEXT    NOT NULL DEFAULT '',
      confidence_level     INTEGER NOT NULL DEFAULT 0,
      risk_factors         TEXT    NOT NULL DEFAULT '[]',
      recommendations      TEXT    NOT NULL DEFAULT '[]',
      status               TEXT    NOT NULL DEFAULT 'active'
                                   CHECK(status IN ('active','mitigated','occurred','dismissed')),
      trend                TEXT    NOT NULL DEFAULT 'stable'
                                   CHECK(trend IN ('increasing','stable','decreasing')),
      historical_incidents INTEGER NOT NULL DEFAULT 0,
      last_updated         TEXT    NOT NULL DEFAULT '',
      created_at           INTEGER,
      updated_at           INTEGER
    );

    CREATE TABLE IF NOT EXISTS predictive_insights (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      type         TEXT    NOT NULL DEFAULT 'pattern'
                           CHECK(type IN ('pattern','anomaly','correlation','forecast','benchmark')),
      title        TEXT    NOT NULL,
      description  TEXT    NOT NULL DEFAULT '',
      confidence   INTEGER NOT NULL DEFAULT 0,
      actionable   INTEGER NOT NULL DEFAULT 1,
      generated_at TEXT    NOT NULL DEFAULT '',
      created_at   INTEGER,
      updated_at   INTEGER
    );

    CREATE TABLE IF NOT EXISTS predictive_config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_pred_safety_type   ON predictive_predictions(type);
    CREATE INDEX IF NOT EXISTS idx_pred_safety_status ON predictive_predictions(status);
  `);
}

function seedData(db: ReturnType<typeof getDb>) {
  // Config — model accuracy and baseline counters
  const configEntries: [string, string][] = [
    ['model_accuracy',         '94.2'],
    ['risks_mitigated_base',   '855'],
    ['predictions_made_base',  '1282'],
    ['precision',              '92'],
    ['recall',                 '88'],
    ['f1_score',               '90'],
    ['data_points',            '5420'],
    ['successful_predictions', '1209'],
    ['last_trained_date',      '2026-03-01'],
  ];
  const insertConfig = db.prepare(`INSERT OR IGNORE INTO predictive_config(key, value) VALUES (?, ?)`);
  for (const [key, value] of configEntries) insertConfig.run(key, value);

  // Seed predictions only if table is empty
  const existingPreds = (db.prepare('SELECT COUNT(*) as count FROM predictive_predictions').get() as any).count;
  if (existingPreds === 0) {
    const ins = db.prepare(`
      INSERT INTO predictive_predictions
        (prediction_id, type, title, description, location, department, probability, severity,
         timeframe, predicted_date, confidence_level, risk_factors, recommendations,
         status, trend, historical_incidents, last_updated, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    const now = nowMs();

    ins.run(
      'PRED-001', 'incident',
      'Elevated Fall Risk - Scaffolding Area',
      'AI analysis indicates a 78% probability of fall-related incident in the west wing scaffolding area within the next 14 days based on weather patterns, work intensity, and historical data. This violates OSHA 1926.451 and ISO 45001 Clause 8.1.',
      'West Wing - Scaffolding Zone B', 'Construction',
      78, 'critical', 'short_term', '2026-02-20', 85,
      JSON.stringify([
        { id: 'RF-1', factor: 'Weather forecast: high winds expected', weight: 35, category: 'environmental', dataSource: 'Weather API', currentValue: 28, threshold: 25 },
        { id: 'RF-2', factor: 'Increased overtime hours this week', weight: 25, category: 'human_factors', dataSource: 'Time Tracking', currentValue: 52, threshold: 45 },
        { id: 'RF-3', factor: 'Scaffolding last inspected 12 days ago', weight: 20, category: 'equipment', dataSource: 'Inspection Log', currentValue: 12, threshold: 7 },
        { id: 'RF-4', factor: 'New workers without site-specific training', weight: 20, category: 'procedural', dataSource: 'HR System', currentValue: 3, threshold: 0 },
      ]),
      JSON.stringify([
        { id: 'REC-1', action: 'Conduct emergency scaffolding inspection', priority: 'critical', expectedImpact: 30, cost: 'low', implementationTime: '2 hours', status: 'in_progress', assignedTo: 'Safety Team' },
        { id: 'REC-2', action: 'Suspend work during high wind periods (>25 mph)', priority: 'high', expectedImpact: 40, cost: 'medium', implementationTime: 'Immediate', status: 'pending' },
        { id: 'REC-3', action: 'Complete site-specific fall protection training for new workers', priority: 'high', expectedImpact: 25, cost: 'low', implementationTime: '4 hours', status: 'pending' },
      ]),
      'active', 'increasing', 3, '2026-02-07T02:15:00Z', now, now
    );

    ins.run(
      'PRED-002', 'equipment_failure',
      'Predictive Maintenance: Forklift #42',
      'Sensor data from Forklift #42 shows abnormal vibration patterns in the hydraulic lift system, suggesting a 62% chance of failure within 48 operating hours. Maintenance required per OSHA 1910.178 and ISO 9001 Clause 8.5.1.',
      'Main Warehouse', 'Logistics',
      62, 'medium', 'immediate', '2026-02-09', 92,
      JSON.stringify([
        { id: 'RF-5', factor: 'Hydraulic pressure fluctuations', weight: 45, category: 'equipment', dataSource: 'IoT Sensors', currentValue: 185, threshold: 160 },
        { id: 'RF-6', factor: 'Operating temperature above normal', weight: 30, category: 'equipment', dataSource: 'IoT Sensors', currentValue: 92, threshold: 85 },
        { id: 'RF-7', factor: 'Continuous usage > 6 hours', weight: 25, category: 'human_factors', dataSource: 'Fleet Mgmt', currentValue: 8.5, threshold: 6 },
      ]),
      JSON.stringify([
        { id: 'REC-4', action: 'Remove Forklift #42 from service for inspection', priority: 'high', expectedImpact: 95, cost: 'low', implementationTime: 'Immediate', status: 'pending' },
        { id: 'REC-5', action: 'Replace hydraulic seals and fluid', priority: 'medium', expectedImpact: 80, cost: 'medium', implementationTime: '3 hours', status: 'pending' },
      ]),
      'active', 'stable', 1, '2026-02-07T01:45:00Z', now, now
    );
  }

  // Seed insights only if table is empty
  const existingInsights = (db.prepare('SELECT COUNT(*) as count FROM predictive_insights').get() as any).count;
  if (existingInsights === 0) {
    const insIns = db.prepare(`
      INSERT INTO predictive_insights (type, title, description, confidence, actionable, generated_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = nowMs();
    insIns.run('pattern',     'Fatigue Pattern Detected', 'Increased near-misses correlate with overtime in Logistics.',          88, 1, '2026-03-10T00:00:00Z', now, now);
    insIns.run('correlation', 'Weather Correlation',      'Slip risks increase by 40% when humidity exceeds 85%.',              91, 1, '2026-03-10T00:00:00Z', now, now);
    insIns.run('anomaly',     'Training Gap',             'Area 4 incidents linked to 3 expired certifications.',               85, 1, '2026-03-10T00:00:00Z', now, now);
  }
}

let initialized = false;
function initOnce() {
  if (initialized) return;
  initialized = true;
  const db = getDb();
  try {
    ensureSchema(db);
    seedData(db);
  } finally {
    db.close();
  }
}

// ── Mappers ────────────────────────────────────────────────────────────────────

function mapPrediction(row: any) {
  return {
    id:                  row.prediction_id,
    dbId:                row.id,
    type:                row.type,
    title:               row.title,
    description:         row.description,
    location:            row.location,
    department:          row.department,
    probability:         row.probability,
    severity:            row.severity,
    timeframe:           row.timeframe,
    predictedDate:       row.predicted_date,
    confidenceLevel:     row.confidence_level,
    riskFactors:         safeJson(row.risk_factors),
    recommendations:     safeJson(row.recommendations),
    status:              row.status,
    trend:               row.trend,
    historicalIncidents: row.historical_incidents,
    lastUpdated:         row.last_updated,
    createdAt:           row.created_at,
    updatedAt:           row.updated_at,
  };
}

function mapInsight(row: any) {
  return {
    id:          row.id,
    type:        row.type,
    title:       row.title,
    description: row.description,
    confidence:  row.confidence,
    actionable:  row.actionable === 1,
    generatedAt: row.generated_at,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

// ── Validation Schemas ─────────────────────────────────────────────────────────

const RiskFactorSchema = z.object({
  id:           z.string(),
  factor:       z.string().min(1),
  weight:       z.number(),
  category:     z.enum(['behavioral', 'environmental', 'equipment', 'procedural', 'human_factors']),
  dataSource:   z.string(),
  currentValue: z.number(),
  threshold:    z.number(),
});

const RecommendationSchema = z.object({
  id:                 z.string(),
  action:             z.string().min(1),
  priority:           z.enum(['low', 'medium', 'high', 'critical']),
  expectedImpact:     z.number(),
  cost:               z.enum(['low', 'medium', 'high']),
  implementationTime: z.string(),
  status:             z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  assignedTo:         z.string().optional(),
});

const CreatePredictionSchema = z.object({
  type:               z.enum(['incident', 'near_miss', 'hazard', 'equipment_failure', 'ergonomic', 'environmental']).default('incident'),
  title:              z.string().min(1),
  description:        z.string().optional(),
  location:           z.string().optional(),
  department:         z.string().optional(),
  probability:        z.number().min(0).max(100).optional(),
  severity:           z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  timeframe:          z.enum(['immediate', 'short_term', 'medium_term', 'long_term']).default('medium_term'),
  predictedDate:      z.string().optional(),
  confidenceLevel:    z.number().min(0).max(100).optional(),
  riskFactors:        z.array(RiskFactorSchema).optional(),
  recommendations:    z.array(RecommendationSchema).optional(),
  status:             z.enum(['active', 'mitigated', 'occurred', 'dismissed']).default('active'),
  trend:              z.enum(['increasing', 'stable', 'decreasing']).default('stable'),
  historicalIncidents: z.number().optional(),
});

const UpdateRecommendationSchema = z.object({
  status:     z.enum(['pending', 'in_progress', 'completed']).optional(),
  assignedTo: z.string().optional(),
});

const CreateInsightSchema = z.object({
  type:        z.enum(['pattern', 'anomaly', 'correlation', 'forecast', 'benchmark']).default('pattern'),
  title:       z.string().min(1),
  description: z.string().min(1),
  confidence:  z.number().min(0).max(100).optional(),
  actionable:  z.boolean().optional(),
});

// ── Routes ─────────────────────────────────────────────────────────────────────

export function predictiveSafetyRoutes(app: Hono) {
  // GET /api/predictive-safety/stats
  app.get('/api/predictive-safety/stats', (c) => {
    initOnce();
    const db = getDb();
    try {
      const configs = db.prepare('SELECT key, value FROM predictive_config').all() as any[];
      const cfg: Record<string, string> = {};
      for (const row of configs) cfg[row.key] = row.value;

      const totalPreds  = (db.prepare('SELECT COUNT(*) as count FROM predictive_predictions').get() as any).count;
      const mitigated   = (db.prepare("SELECT COUNT(*) as count FROM predictive_predictions WHERE status = 'mitigated'").get() as any).count;
      const activeAlerts = (db.prepare("SELECT COUNT(*) as count FROM predictive_predictions WHERE status = 'active'").get() as any).count;

      return c.json({
        success: true,
        data: {
          modelAccuracy:   parseFloat(cfg['model_accuracy']        ?? '0'),
          predictionsMade: (parseInt(cfg['predictions_made_base']  ?? '0')) + totalPreds,
          risksMitigated:  (parseInt(cfg['risks_mitigated_base']   ?? '0')) + mitigated,
          activeAlerts,
        },
      });
    } finally {
      db.close();
    }
  });

  // GET /api/predictive-safety/model-metrics
  app.get('/api/predictive-safety/model-metrics', (c) => {
    initOnce();
    const db = getDb();
    try {
      const configs = db.prepare('SELECT key, value FROM predictive_config').all() as any[];
      const cfg: Record<string, string> = {};
      for (const row of configs) cfg[row.key] = row.value;

      const totalPreds = (db.prepare('SELECT COUNT(*) as count FROM predictive_predictions').get() as any).count;

      return c.json({
        success: true,
        data: {
          accuracy:               parseFloat(cfg['model_accuracy']        ?? '0'),
          precision:              parseInt(cfg['precision']              ?? '0'),
          recall:                 parseInt(cfg['recall']                 ?? '0'),
          f1Score:                parseInt(cfg['f1_score']               ?? '0'),
          lastTrainedDate:        cfg['last_trained_date']               ?? '',
          dataPoints:             parseInt(cfg['data_points']            ?? '0'),
          predictionsMade:        (parseInt(cfg['predictions_made_base'] ?? '0')) + totalPreds,
          successfulPredictions:  parseInt(cfg['successful_predictions'] ?? '0'),
        },
      });
    } finally {
      db.close();
    }
  });

  // GET /api/predictive-safety/predictions
  app.get('/api/predictive-safety/predictions', (c) => {
    initOnce();
    const type   = c.req.query('type');
    const status = c.req.query('status');
    const db = getDb();
    try {
      let sql = 'SELECT * FROM predictive_predictions';
      const conditions: string[] = [];
      const params: any[] = [];
      if (type)   { conditions.push('type = ?');   params.push(type); }
      if (status) { conditions.push('status = ?'); params.push(status); }
      if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
      sql += ' ORDER BY probability DESC, created_at DESC';

      const rows = db.prepare(sql).all(...params) as any[];
      const data = rows.map(mapPrediction);
      return c.json({ success: true, count: data.length, data });
    } finally {
      db.close();
    }
  });

  // POST /api/predictive-safety/predictions
  app.post('/api/predictive-safety/predictions', async (c) => {
    initOnce();
    const body   = await c.req.json().catch(() => null);
    const parsed = CreatePredictionSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }
    const d  = parsed.data;
    const db = getDb();
    try {
      const now          = nowMs();
      const predictionId = `PRED-${now}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const result = db.prepare(`
        INSERT INTO predictive_predictions
          (prediction_id, type, title, description, location, department, probability, severity,
           timeframe, predicted_date, confidence_level, risk_factors, recommendations,
           status, trend, historical_incidents, last_updated, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        predictionId, d.type, d.title,
        d.description ?? '', d.location ?? '', d.department ?? '',
        d.probability ?? 0, d.severity, d.timeframe,
        d.predictedDate ?? '', d.confidenceLevel ?? 0,
        JSON.stringify(d.riskFactors    ?? []),
        JSON.stringify(d.recommendations ?? []),
        d.status, d.trend, d.historicalIncidents ?? 0,
        new Date(now).toISOString(), now, now
      );
      const row = db.prepare('SELECT * FROM predictive_predictions WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapPrediction(row) }, 201);
    } finally {
      db.close();
    }
  });

  // PUT /api/predictive-safety/predictions/:id/recommendations/:recId  (more specific — registered BEFORE /:id)
  app.put('/api/predictive-safety/predictions/:id/recommendations/:recId', async (c) => {
    initOnce();
    const predId = c.req.param('id');
    const recId  = c.req.param('recId');
    const body   = await c.req.json().catch(() => null);
    const parsed = UpdateRecommendationSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }
    if (!parsed.data.status && parsed.data.assignedTo === undefined) {
      return c.json({ success: false, error: 'No updatable fields provided' }, 400);
    }
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM predictive_predictions WHERE prediction_id = ?').get(predId) as any;
      if (!row) return c.json({ success: false, error: 'Prediction not found' }, 404);
      const recs: any[] = safeJson(row.recommendations);
      const idx = recs.findIndex((r) => r.id === recId);
      if (idx === -1) return c.json({ success: false, error: 'Recommendation not found' }, 404);
      if (parsed.data.status !== undefined)     recs[idx].status     = parsed.data.status;
      if (parsed.data.assignedTo !== undefined) recs[idx].assignedTo = parsed.data.assignedTo;
      db.prepare('UPDATE predictive_predictions SET recommendations = ?, updated_at = ? WHERE prediction_id = ?')
        .run(JSON.stringify(recs), nowMs(), predId);
      const updated = db.prepare('SELECT * FROM predictive_predictions WHERE prediction_id = ?').get(predId) as any;
      return c.json({ success: true, data: mapPrediction(updated) });
    } finally {
      db.close();
    }
  });

  // PUT /api/predictive-safety/predictions/:id
  app.put('/api/predictive-safety/predictions/:id', async (c) => {
    initOnce();
    const predId = c.req.param('id');
    const body   = await c.req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }
    const db = getDb();
    try {
      const existing = db.prepare('SELECT * FROM predictive_predictions WHERE prediction_id = ?').get(predId) as any;
      if (!existing) return c.json({ success: false, error: 'Prediction not found' }, 404);

      const allowedCols = new Set([
        'type', 'title', 'description', 'location', 'department', 'probability', 'severity',
        'timeframe', 'predicted_date', 'confidence_level', 'risk_factors', 'recommendations',
        'status', 'trend', 'historical_incidents', 'last_updated',
      ]);
      const camelToSnake: Record<string, string> = {
        predictedDate: 'predicted_date', confidenceLevel: 'confidence_level',
        riskFactors: 'risk_factors', historicalIncidents: 'historical_incidents',
        lastUpdated: 'last_updated',
      };
      const jsonCols = new Set(['risk_factors', 'recommendations']);

      const sets: string[] = [];
      const vals: any[]    = [];
      for (const [k, v] of Object.entries(body)) {
        const col = camelToSnake[k] ?? k;
        if (!allowedCols.has(col)) continue;
        sets.push(`${col} = ?`);
        vals.push(jsonCols.has(col) ? JSON.stringify(v) : v);
      }
      if (sets.length === 0) return c.json({ success: false, error: 'No valid fields to update' }, 400);

      sets.push('updated_at = ?');
      vals.push(nowMs(), predId);
      db.prepare(`UPDATE predictive_predictions SET ${sets.join(', ')} WHERE prediction_id = ?`).run(...vals);
      const updated = db.prepare('SELECT * FROM predictive_predictions WHERE prediction_id = ?').get(predId) as any;
      return c.json({ success: true, data: mapPrediction(updated) });
    } finally {
      db.close();
    }
  });

  // DELETE /api/predictive-safety/predictions/:id
  app.delete('/api/predictive-safety/predictions/:id', (c) => {
    initOnce();
    const predId = c.req.param('id');
    const db = getDb();
    try {
      const existing = db.prepare('SELECT * FROM predictive_predictions WHERE prediction_id = ?').get(predId) as any;
      if (!existing) return c.json({ success: false, error: 'Prediction not found' }, 404);
      db.prepare('DELETE FROM predictive_predictions WHERE prediction_id = ?').run(predId);
      return c.json({ success: true, message: `Prediction ${predId} deleted` });
    } finally {
      db.close();
    }
  });

  // GET /api/predictive-safety/insights
  app.get('/api/predictive-safety/insights', (c) => {
    initOnce();
    const db = getDb();
    try {
      const rows = db.prepare('SELECT * FROM predictive_insights ORDER BY created_at DESC').all() as any[];
      const data = rows.map(mapInsight);
      return c.json({ success: true, count: data.length, data });
    } finally {
      db.close();
    }
  });

  // POST /api/predictive-safety/insights
  app.post('/api/predictive-safety/insights', async (c) => {
    initOnce();
    const body   = await c.req.json().catch(() => null);
    const parsed = CreateInsightSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }
    const d  = parsed.data;
    const db = getDb();
    try {
      const now    = nowMs();
      const result = db.prepare(`
        INSERT INTO predictive_insights (type, title, description, confidence, actionable, generated_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(d.type, d.title, d.description, d.confidence ?? 0, d.actionable ? 1 : 0, new Date(now).toISOString(), now, now);
      const row = db.prepare('SELECT * FROM predictive_insights WHERE id = ?').get(result.lastInsertRowid) as any;
      return c.json({ success: true, data: mapInsight(row) }, 201);
    } finally {
      db.close();
    }
  });

  // DELETE /api/predictive-safety/insights/:id
  app.delete('/api/predictive-safety/insights/:id', (c) => {
    initOnce();
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) return c.json({ success: false, error: 'Invalid id' }, 400);
    const db = getDb();
    try {
      const existing = db.prepare('SELECT * FROM predictive_insights WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Insight not found' }, 404);
      db.prepare('DELETE FROM predictive_insights WHERE id = ?').run(id);
      return c.json({ success: true, message: `Insight ${id} deleted` });
    } finally {
      db.close();
    }
  });
}
