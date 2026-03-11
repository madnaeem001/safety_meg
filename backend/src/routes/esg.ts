import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const sqlite = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = OFF');

const nowMs = () => Date.now();

const ESGMetricSchema = z.object({
  category: z.enum(['environmental', 'social', 'governance']),
  metric: z.string().min(1),
  value: z.number(),
  unit: z.string().optional(),
  period: z.string().optional(),
  notes: z.string().optional(),
  recordedBy: z.string().optional(),
});

const GoalSchema = z.object({
  category: z.enum(['carbon', 'water', 'waste', 'energy', 'diversity', 'safety']),
  goal: z.string().min(1),
  target: z.number(),
  current: z.number().optional().default(0),
  unit: z.string().optional(),
  deadline: z.string().optional(),
  status: z.enum(['active', 'achieved', 'missed', 'paused']).optional().default('active'),
});

export function esgRoutes(app: Hono) {
  // GET /api/esg/metrics
  app.get('/api/esg/metrics', (c) => {
    const { category, period, limit = '50' } = c.req.query() as any;
    let q = 'SELECT * FROM esg_metrics WHERE 1=1';
    const params: any[] = [];
    if (category) { q += ' AND category = ?'; params.push(category); }
    if (period) { q += ' AND period = ?'; params.push(period); }
    q += ` ORDER BY recorded_at DESC LIMIT ${Math.min(Number(limit), 200)}`;
    const rows = sqlite.prepare(q).all(...params);

    const summary: Record<string, any[]> = {};
    for (const row of rows) {
      const r = row as any;
      if (!summary[r.category]) summary[r.category] = [];
      summary[r.category].push({ metric: r.metric, value: r.value, unit: r.unit, period: r.period });
    }
    return c.json({ success: true, data: rows, summary, total: rows.length });
  });

  // POST /api/esg/metrics
  app.post('/api/esg/metrics', async (c) => {
    const body = await c.req.json();
    const parsed = ESGMetricSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }
    const d = parsed.data;
    const result = sqlite.prepare(
      `INSERT INTO esg_metrics (category, metric, value, unit, period, notes, recorded_by, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(d.category, d.metric, d.value, d.unit ?? null, d.period ?? null, d.notes ?? null, d.recordedBy ?? null, nowMs());
    const row = sqlite.prepare('SELECT * FROM esg_metrics WHERE id = ?').get(result.lastInsertRowid);
    return c.json({ success: true, data: row }, 201);
  });

  // POST /api/esg/report
  app.post('/api/esg/report', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { period, categories = ['environmental', 'social', 'governance'] } = body;

    const report: Record<string, any> = {};
    for (const cat of categories) {
      let q = 'SELECT metric, AVG(value) as avg, MIN(value) as min, MAX(value) as max, COUNT(*) as count FROM esg_metrics WHERE category = ?';
      const params: any[] = [cat];
      if (period) { q += ' AND period = ?'; params.push(period); }
      q += ' GROUP BY metric ORDER BY metric';
      report[cat] = sqlite.prepare(q).all(...params);
    }

    return c.json({
      success: true,
      period: period || 'all-time',
      generatedAt: new Date().toISOString(),
      report
    });
  });

  // GET /api/sustainability/metrics
  app.get('/api/sustainability/metrics', (c) => {
    const goals = sqlite.prepare('SELECT * FROM sustainability_goals ORDER BY created_at DESC').all();
    const metrics = sqlite.prepare("SELECT * FROM esg_metrics WHERE category = 'environmental' ORDER BY recorded_at DESC LIMIT 100").all();
    return c.json({ success: true, goals, recentMetrics: metrics, total: goals.length });
  });

  // GET /api/esg/environmental
  // Returns complianceRate plus key environmental ESG metrics for the EPA Reporting Dashboard.
  app.get('/api/esg/environmental', (c) => {
    try {
      const period = c.req.query('period') ?? null;

      // ── Compliance rate from inspection results ──────────────────────────
      const inspResult = sqlite.prepare(`
        SELECT
          SUM(CASE WHEN result = 'pass' THEN 1 ELSE 0 END) as passed,
          SUM(CASE WHEN result = 'fail' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN result IS NOT NULL AND result != '' THEN 1 ELSE 0 END) as total_with_result
        FROM inspection_schedule
        WHERE status = 'completed'
      `).get() as any;

      const totalWithResult = inspResult?.total_with_result ?? 0;
      const passedCount = inspResult?.passed ?? 0;
      const complianceRate = totalWithResult > 0
        ? Math.round((passedCount / totalWithResult) * 100 * 10) / 10
        : 100;

      // ── Environmental ESG metrics (latest values per metric) ────────────
      let query = `
        SELECT metric, value, unit, period, recorded_at
        FROM esg_metrics
        WHERE category = 'environmental'
      `;
      const params: any[] = [];
      if (period) { query += ' AND period = ?'; params.push(period); }
      query += ' ORDER BY metric, recorded_at DESC';

      const rawMetrics = sqlite.prepare(query).all(...params) as any[];

      // Keep only the most recent value per metric
      const metricMap: Record<string, any> = {};
      for (const row of rawMetrics) {
        if (!metricMap[row.metric]) metricMap[row.metric] = row;
      }

      const getMetricValue = (name: string, fallback = 0): number =>
        metricMap[name]?.value ?? fallback;

      // ── Sustainability goals progress ────────────────────────────────────
      const activeGoals = sqlite.prepare(
        `SELECT COUNT(*) as n FROM sustainability_goals WHERE status = 'active'`
      ).get() as any;
      const achievedGoals = sqlite.prepare(
        `SELECT COUNT(*) as n FROM sustainability_goals WHERE status = 'achieved'`
      ).get() as any;

      return c.json({
        success: true,
        data: {
          complianceRate,
          carbonEmissions: getMetricValue('carbon_emissions'),
          energyConsumption: getMetricValue('energy_consumption'),
          waterUsage: getMetricValue('water_usage'),
          wasteGenerated: getMetricValue('waste_generated'),
          wasteDiverted: getMetricValue('waste_diverted'),
          renewableEnergy: getMetricValue('renewable_energy'),
          scope1Emissions: getMetricValue('scope1_emissions'),
          scope2Emissions: getMetricValue('scope2_emissions'),
          activeGoals: activeGoals?.n ?? 0,
          achievedGoals: achievedGoals?.n ?? 0,
          period: period ?? 'all-time',
          inspectionCompliance: {
            passed: passedCount,
            failed: inspResult?.failed ?? 0,
            total: totalWithResult,
          },
        },
      }, 200);
    } catch (error) {
      return c.json({ success: false, error: 'Failed to fetch environmental metrics' }, 500);
    }
  });

  // POST /api/sustainability/goals
  app.post('/api/sustainability/goals', async (c) => {
    const body = await c.req.json();
    const parsed = GoalSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }
    const d = parsed.data;
    const result = sqlite.prepare(
      `INSERT INTO sustainability_goals (category, goal, target, current, unit, deadline, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(d.category, d.goal, d.target, d.current, d.unit ?? null, d.deadline ?? null, d.status, nowMs(), nowMs());
    const row = sqlite.prepare('SELECT * FROM sustainability_goals WHERE id = ?').get(result.lastInsertRowid);
    return c.json({ success: true, data: row }, 201);
  });

  /**
   * GET /api/esg/dashboard
   * Returns structured ESGMetrics object (environmental + social + governance + overallScore)
   * consumed by the ESGReporting page via useESGMetrics hook.
   */
  app.get('/api/esg/dashboard', (c) => {
    try {
      const period = c.req.query('period') ?? null;

      // Helper: fetch latest value for an esg_metric row
      const getMetric = (category: string, metric: string): number => {
        let q = `SELECT value FROM esg_metrics WHERE category = ? AND metric = ?`;
        const params: any[] = [category, metric];
        if (period) { q += ' AND period = ?'; params.push(period); }
        q += ' ORDER BY recorded_at DESC LIMIT 1';
        return (sqlite.prepare(q).get(...params) as any)?.value ?? 0;
      };

      // ── Environmental ─────────────────────────────────────────────────────
      const scope1  = getMetric('environmental', 'scope1_emissions');
      const scope2  = getMetric('environmental', 'scope2_emissions');
      const carbon  = getMetric('environmental', 'carbon_emissions') || (scope1 + scope2);
      const energy  = getMetric('environmental', 'energy_consumption');
      const water   = getMetric('environmental', 'water_usage');
      const wasteGen = getMetric('environmental', 'waste_generated');
      const wasteDivPct = getMetric('environmental', 'waste_diverted');
      const renewable = getMetric('environmental', 'renewable_energy');

      const environmental = {
        carbonEmissions: carbon,
        energyConsumption: energy,
        waterUsage: water,
        wasteGenerated: wasteGen,
        wasteDiverted: wasteDivPct,
        renewableEnergy: renewable,
        scope1Emissions: scope1,
        scope2Emissions: scope2,
      };

      // ── Social ────────────────────────────────────────────────────────────
      // TRIR: (recordable incidents × 200,000) / (workers × 2000 h/year)
      const totalWorkers = (sqlite.prepare(`SELECT COUNT(*) as n FROM workers`).get() as any)?.n ?? 1;
      const recordableIncidents = (sqlite.prepare(
        `SELECT COUNT(*) as n FROM incidents WHERE UPPER(severity) IN ('HIGH','CRITICAL','MEDIUM')`
      ).get() as any)?.n ?? 0;
      const trir = totalWorkers > 0
        ? Math.round(((recordableIncidents * 200000) / (totalWorkers * 2000)) * 100) / 100
        : 0;

      const lostTimeIncidents = (sqlite.prepare(
        `SELECT COUNT(*) as n FROM incidents WHERE UPPER(severity) = 'CRITICAL'`
      ).get() as any)?.n ?? 0;
      const nearMissReports = (sqlite.prepare(
        `SELECT COUNT(*) as n FROM near_misses`
      ).get() as any)?.n ?? 0;

      const completedTrainings = (sqlite.prepare(
        `SELECT COUNT(DISTINCT employee_id) as n FROM employee_training WHERE UPPER(status) IN ('CURRENT','COMPLETED')`
      ).get() as any)?.n ?? 0;
      const trainingHoursPerEmployee = totalWorkers > 0
        ? Math.round((completedTrainings / totalWorkers) * 40)
        : 0;

      const social = {
        trir,
        dartRate: getMetric('social', 'dart_rate'),
        lostTimeIncidents,
        nearMissReports,
        trainingHoursPerEmployee,
        employeeSatisfaction: getMetric('social', 'employee_satisfaction') || 75,
        diversityIndex: getMetric('social', 'diversity_index') || 30,
        volunteerHours: getMetric('social', 'volunteer_hours'),
        communityInvestment: getMetric('social', 'community_investment'),
      };

      // ── Governance ────────────────────────────────────────────────────────
      // Compliance score: inspection pass rate
      const inspResult = sqlite.prepare(`
        SELECT
          SUM(CASE WHEN result = 'pass' THEN 1 ELSE 0 END) as passed,
          SUM(CASE WHEN result IS NOT NULL AND result != '' THEN 1 ELSE 0 END) as total
        FROM inspection_schedule WHERE status = 'completed'
      `).get() as any;
      const complianceScore = (inspResult?.total ?? 0) > 0
        ? Math.round(((inspResult.passed ?? 0) / inspResult.total) * 100)
        : (getMetric('governance', 'compliance_score') || 90);

      const auditFindingsClosed = (sqlite.prepare(
        `SELECT COUNT(*) as n FROM capa_records WHERE UPPER(status) IN ('CLOSED','COMPLETED','RESOLVED')`
      ).get() as any)?.n ?? 0;

      const riskAssessmentsCompleted = (sqlite.prepare(
        `SELECT COUNT(*) as n FROM risk_register WHERE UPPER(status) IN ('MITIGATED','CLOSED','REVIEWED')`
      ).get() as any)?.n ?? 0;

      const governance = {
        complianceScore,
        auditFindingsClosed,
        policyReviewsCompleted: getMetric('governance', 'policy_reviews_completed') || 0,
        ethicsViolations: getMetric('governance', 'ethics_violations'),
        boardDiversity: getMetric('governance', 'board_diversity') || 35,
        riskAssessmentsCompleted,
      };

      // ── Overall Score ─────────────────────────────────────────────────────
      const envScore  = Math.min(100, 70 + (renewable * 0.15) + (wasteDivPct * 0.15));
      const socialScore = Math.min(100, Math.max(0, 100 - (trir * 5) + (trainingHoursPerEmployee * 0.2)));
      const govScore  = complianceScore;
      const overallScore = Math.round((envScore * 0.33 + socialScore * 0.33 + govScore * 0.34) * 10) / 10;

      return c.json({
        success: true,
        data: {
          period: period ?? 'quarter',
          environmental,
          social,
          governance,
          overallScore,
        },
      }, 200);
    } catch (error) {
      return c.json({ success: false, error: 'Failed to fetch ESG dashboard data' }, 500);
    }
  });
}
