/**
 * Bow Tie Analysis API Routes
 * Standalone scenarios (not nested under investigations).
 *
 * GET  /api/bowtie/stats
 * GET  /api/bowtie/scenarios
 * POST /api/bowtie/scenarios
 * GET  /api/bowtie/scenarios/:id
 * PUT  /api/bowtie/scenarios/:id
 */

import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProdRoute ? '/data/local.sqlite' : resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Date.now();

// ── Zod Schemas ────────────────────────────────────────────────────────────

const BarrierSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(['engineering', 'administrative', 'ppe', 'procedural']),
  effectiveness: z.number().min(0).max(100).default(80),
  status: z.enum(['active', 'degraded', 'failed']).default('active'),
});

const ThreatSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  preventiveBarriers: z.array(BarrierSchema).default([]),
});

const ConsequenceSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  severity: z.enum(['minor', 'moderate', 'major', 'catastrophic']),
  mitigativeBarriers: z.array(BarrierSchema).default([]),
});

const CreateScenarioSchema = z.object({
  title: z.string().min(1),
  topEvent: z.string().min(1),
  hazard: z.string().min(1),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  threats: z.array(ThreatSchema).default([]),
  consequences: z.array(ConsequenceSchema).default([]),
  status: z.enum(['draft', 'active', 'review', 'archived']).default('draft'),
  owner: z.string().optional(),
});

const UpdateScenarioSchema = z.object({
  title: z.string().min(1).optional(),
  topEvent: z.string().min(1).optional(),
  hazard: z.string().min(1).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  threats: z.array(ThreatSchema).optional(),
  consequences: z.array(ConsequenceSchema).optional(),
  status: z.enum(['draft', 'active', 'review', 'archived']).optional(),
  owner: z.string().optional(),
});

// ── Row Mapper ─────────────────────────────────────────────────────────────

function mapScenario(r: any) {
  const ts = r.updated_at;
  // updated_at is stored as epoch ms — convert to YYYY-MM-DD
  const lastUpdated = ts
    ? new Date(ts).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
  return {
    id: String(r.id),
    title: r.title,
    topEvent: r.top_event,
    hazard: r.hazard,
    riskLevel: r.risk_level as 'low' | 'medium' | 'high' | 'critical',
    threats: r.threats ? JSON.parse(r.threats) : [],
    consequences: r.consequences ? JSON.parse(r.consequences) : [],
    status: r.status as 'draft' | 'active' | 'review' | 'archived',
    owner: r.owner ?? '',
    lastUpdated,
    createdAt: r.created_at,
  };
}

// ── Routes ─────────────────────────────────────────────────────────────────

export function bowTieRoutes(app: Hono) {

  // GET /api/bowtie/stats
  app.get('/api/bowtie/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as cnt FROM bowtie_scenarios').get() as any).cnt;
      const critical = (db.prepare("SELECT COUNT(*) as cnt FROM bowtie_scenarios WHERE risk_level='critical'").get() as any).cnt;
      const high = (db.prepare("SELECT COUNT(*) as cnt FROM bowtie_scenarios WHERE risk_level='high'").get() as any).cnt;
      const active = (db.prepare("SELECT COUNT(*) as cnt FROM bowtie_scenarios WHERE status='active'").get() as any).cnt;
      const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM bowtie_scenarios GROUP BY status').all();
      const byRisk = db.prepare('SELECT risk_level, COUNT(*) as count FROM bowtie_scenarios GROUP BY risk_level').all();

      // Compute barrier totals from JSON stored in each scenario
      const rows = db.prepare('SELECT threats, consequences FROM bowtie_scenarios').all() as any[];
      let totalBarriers = 0;
      let degradedBarriers = 0;
      for (const s of rows) {
        const threats: any[] = s.threats ? JSON.parse(s.threats) : [];
        const consequences: any[] = s.consequences ? JSON.parse(s.consequences) : [];
        for (const t of threats) {
          for (const b of (t.preventiveBarriers ?? [])) {
            totalBarriers++;
            if (b.status === 'degraded' || b.status === 'failed') degradedBarriers++;
          }
        }
        for (const cons of consequences) {
          for (const b of (cons.mitigativeBarriers ?? [])) {
            totalBarriers++;
            if (b.status === 'degraded' || b.status === 'failed') degradedBarriers++;
          }
        }
      }

      return c.json({
        success: true,
        data: { total, critical, high, active, totalBarriers, degradedBarriers, byStatus, byRisk },
      });
    } finally { db.close(); }
  });

  // GET /api/bowtie/scenarios
  app.get('/api/bowtie/scenarios', (c) => {
    const db = getDb();
    try {
      const { status, riskLevel, search, owner } = c.req.query();
      let sql = 'SELECT * FROM bowtie_scenarios WHERE 1=1';
      const params: any[] = [];
      if (status) { sql += ' AND status = ?'; params.push(status); }
      if (riskLevel) { sql += ' AND risk_level = ?'; params.push(riskLevel); }
      if (owner) { sql += ' AND owner = ?'; params.push(owner); }
      if (search) {
        sql += ' AND (title LIKE ? OR top_event LIKE ? OR hazard LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      sql += ' ORDER BY created_at DESC';
      const rows = db.prepare(sql).all(...params).map(mapScenario);
      return c.json({ success: true, data: rows, total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/bowtie/scenarios
  app.post('/api/bowtie/scenarios', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateScenarioSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);
      const d = parsed.data;
      const ts = now();
      const result = db.prepare(`
        INSERT INTO bowtie_scenarios
          (title, top_event, hazard, risk_level, threats, consequences, status, owner, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        d.title, d.topEvent, d.hazard, d.riskLevel,
        JSON.stringify(d.threats), JSON.stringify(d.consequences),
        d.status, d.owner ?? null, ts, ts,
      );
      const created = db.prepare('SELECT * FROM bowtie_scenarios WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapScenario(created) }, 201);
    } finally { db.close(); }
  });

  // GET /api/bowtie/scenarios/:id
  app.get('/api/bowtie/scenarios/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id) || id <= 0) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const row = db.prepare('SELECT * FROM bowtie_scenarios WHERE id = ?').get(id);
      if (!row) return c.json({ success: false, error: 'Scenario not found' }, 404);
      return c.json({ success: true, data: mapScenario(row) });
    } finally { db.close(); }
  });

  // PUT /api/bowtie/scenarios/:id
  app.put('/api/bowtie/scenarios/:id', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id) || id <= 0) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const existing = db.prepare('SELECT id FROM bowtie_scenarios WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Scenario not found' }, 404);
      const body = await c.req.json();
      const parsed = UpdateScenarioSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.flatten() }, 400);
      const d = parsed.data;
      const fields: string[] = [];
      const params: any[] = [];
      if (d.title !== undefined) { fields.push('title = ?'); params.push(d.title); }
      if (d.topEvent !== undefined) { fields.push('top_event = ?'); params.push(d.topEvent); }
      if (d.hazard !== undefined) { fields.push('hazard = ?'); params.push(d.hazard); }
      if (d.riskLevel !== undefined) { fields.push('risk_level = ?'); params.push(d.riskLevel); }
      if (d.threats !== undefined) { fields.push('threats = ?'); params.push(JSON.stringify(d.threats)); }
      if (d.consequences !== undefined) { fields.push('consequences = ?'); params.push(JSON.stringify(d.consequences)); }
      if (d.status !== undefined) { fields.push('status = ?'); params.push(d.status); }
      if (d.owner !== undefined) { fields.push('owner = ?'); params.push(d.owner); }
      if (!fields.length) return c.json({ success: false, error: 'No valid fields to update' }, 400);
      fields.push('updated_at = ?');
      params.push(now(), id);
      db.prepare(`UPDATE bowtie_scenarios SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM bowtie_scenarios WHERE id = ?').get(id);
      return c.json({ success: true, data: mapScenario(updated) });
    } finally { db.close(); }
  });
}
