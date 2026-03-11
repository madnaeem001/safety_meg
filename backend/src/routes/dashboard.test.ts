/**
 * Dashboard Routes Test Suite
 *
 * Covers:
 *   GET  /api/dashboard/overview            — recent incidents, alerts, kpis
 *   GET  /api/dashboard/incidents           — incident list
 *   GET  /api/dashboard/checklists          — checklist list
 *   GET  /api/dashboard/gamification        — gamification stats
 *   GET  /api/dashboard/kpi-data            — kpi metrics
 *   GET  /api/dashboard/compliance-alerts   — unresolved alerts
 *   POST /api/dashboard/checklist-complete  — mark item complete (validation)
 *   GET  /api/dashboard/live-stats          — comprehensive live stats
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { dashboardRoutes } from '../routes/dashboard';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  dashboardRoutes(app);
  return app;
}

// ── Request Helper ─────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Dashboard Routes', () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  // ── GET /api/dashboard/overview ──────────────────────────────────────────

  describe('GET /api/dashboard/overview', () => {
    it('returns 200 with success:true', async () => {
      const { status, body } = await req(app, 'GET', '/api/dashboard/overview');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('response.data contains incidents array', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/overview');
      expect(Array.isArray(body.data.incidents)).toBe(true);
    });

    it('response.data contains alerts array', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/overview');
      expect(Array.isArray(body.data.alerts)).toBe(true);
    });

    it('response.data contains kpis array', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/overview');
      expect(Array.isArray(body.data.kpis)).toBe(true);
    });

    it('response.data.summary has required fields', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/overview');
      const { summary } = body.data;
      expect(typeof summary.totalIncidents).toBe('number');
      expect(typeof summary.activeAlerts).toBe('number');
      expect(typeof summary.metricsCount).toBe('number');
      expect(typeof summary.timestamp).toBe('string');
    });
  });

  // ── GET /api/dashboard/incidents ─────────────────────────────────────────

  describe('GET /api/dashboard/incidents', () => {
    it('returns 200 with success:true', async () => {
      const { status, body } = await req(app, 'GET', '/api/dashboard/incidents');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data is an array', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/incidents');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('respects limit of 10', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/incidents');
      expect(body.data.length).toBeLessThanOrEqual(10);
    });
  });

  // ── GET /api/dashboard/checklists ────────────────────────────────────────

  describe('GET /api/dashboard/checklists', () => {
    it('returns 200 with success:true', async () => {
      const { status, body } = await req(app, 'GET', '/api/dashboard/checklists');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data is an array', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/checklists');
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  // ── GET /api/dashboard/gamification ──────────────────────────────────────

  describe('GET /api/dashboard/gamification', () => {
    it('returns 200 with success:true', async () => {
      const { status, body } = await req(app, 'GET', '/api/dashboard/gamification');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data is an array', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/gamification');
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  // ── GET /api/dashboard/kpi-data ──────────────────────────────────────────

  describe('GET /api/dashboard/kpi-data', () => {
    it('returns 200 with success:true', async () => {
      const { status, body } = await req(app, 'GET', '/api/dashboard/kpi-data');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data is an array', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/kpi-data');
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  // ── GET /api/dashboard/compliance-alerts ────────────────────────────────

  describe('GET /api/dashboard/compliance-alerts', () => {
    it('returns 200 with success:true', async () => {
      const { status, body } = await req(app, 'GET', '/api/dashboard/compliance-alerts');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('data is an array', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/compliance-alerts');
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  // ── POST /api/dashboard/checklist-complete ───────────────────────────────

  describe('POST /api/dashboard/checklist-complete', () => {
    it('returns 400 when body is empty', async () => {
      const { status, body } = await req(app, 'POST', '/api/dashboard/checklist-complete', {});
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when checklistId is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/dashboard/checklist-complete', { itemId: '1' });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when itemId is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/dashboard/checklist-complete', { checklistId: '1' });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 200 when both ids are provided', async () => {
      const { status, body } = await req(app, 'POST', '/api/dashboard/checklist-complete', {
        checklistId: '99',
        itemId: '99',
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  // ── GET /api/dashboard/live-stats ────────────────────────────────────────

  describe('GET /api/dashboard/live-stats', () => {
    it('returns 200 with success:true', async () => {
      const { status, body } = await req(app, 'GET', '/api/dashboard/live-stats');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('platformStats has all 4 stat keys', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      const ps = body.data.platformStats;
      expect(ps).toHaveProperty('activeSensors');
      expect(ps).toHaveProperty('aiPredictions');
      expect(ps).toHaveProperty('complianceRate');
      expect(ps).toHaveProperty('threatsBlocked');
    });

    it('each platformStat has value, change, trend', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      for (const key of ['activeSensors', 'aiPredictions', 'complianceRate', 'threatsBlocked']) {
        const stat = body.data.platformStats[key];
        expect(stat).toHaveProperty('value');
        expect(typeof stat.change).toBe('string');
        expect(['up', 'down', 'neutral']).toContain(stat.trend);
      }
    });

    it('incidentTrends is an array', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      expect(Array.isArray(body.data.incidentTrends)).toBe(true);
    });

    it('inspectionTrends is an array', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      expect(Array.isArray(body.data.inspectionTrends)).toBe(true);
    });

    it('severityBreakdown is an array', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      expect(Array.isArray(body.data.severityBreakdown)).toBe(true);
    });

    it('systemHealth has 6 services', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      expect(Array.isArray(body.data.systemHealth)).toBe(true);
      expect(body.data.systemHealth.length).toBe(6);
    });

    it('each systemHealth entry has name, status, uptime, latency, icon', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      for (const svc of body.data.systemHealth) {
        expect(typeof svc.name).toBe('string');
        expect(['healthy', 'degraded']).toContain(svc.status);
        expect(typeof svc.uptime).toBe('string');
        expect(typeof svc.latency).toBe('string');
        expect(typeof svc.icon).toBe('string');
      }
    });

    it('systemHealthSummary has healthyCount, degradedCount, total', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      const s = body.data.systemHealthSummary;
      expect(typeof s.healthyCount).toBe('number');
      expect(typeof s.degradedCount).toBe('number');
      expect(typeof s.total).toBe('number');
      expect(s.healthyCount + s.degradedCount).toBe(s.total);
    });

    it('businessMetrics has 4 entries', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      expect(Array.isArray(body.data.businessMetrics)).toBe(true);
      expect(body.data.businessMetrics.length).toBe(4);
    });

    it('each businessMetric has label, value, change, trend, icon, color, subtext', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      for (const m of body.data.businessMetrics) {
        expect(typeof m.label).toBe('string');
        expect(typeof m.value).toBe('string');
        expect(typeof m.change).toBe('string');
        expect(['up', 'down', 'neutral']).toContain(m.trend);
        expect(typeof m.icon).toBe('string');
        expect(typeof m.color).toBe('string');
        expect(typeof m.subtext).toBe('string');
      }
    });

    it('conversionFunnel has 5 stages', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      expect(Array.isArray(body.data.conversionFunnel)).toBe(true);
      expect(body.data.conversionFunnel.length).toBe(5);
    });

    it('each funnelStage has stage, value, pct, color', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      for (const stage of body.data.conversionFunnel) {
        expect(typeof stage.stage).toBe('string');
        expect(typeof stage.value).toBe('number');
        expect(typeof stage.pct).toBe('number');
        expect(typeof stage.color).toBe('string');
      }
    });

    it('first funnelStage is Total Workers at 100%', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      const first = body.data.conversionFunnel[0];
      expect(first.stage).toBe('Total Workers');
      expect(first.pct).toBe(100);
    });

    it('liveEvents is an array', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      expect(Array.isArray(body.data.liveEvents)).toBe(true);
    });

    it('meta has generatedAt, totalIncidents, totalWorkers, totalCourses', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      const { meta } = body.data;
      expect(typeof meta.generatedAt).toBe('string');
      expect(typeof meta.totalIncidents).toBe('number');
      expect(typeof meta.totalWorkers).toBe('number');
      expect(typeof meta.totalCourses).toBe('number');
    });

    it('checklistItems is array or null', async () => {
      const { body } = await req(app, 'GET', '/api/dashboard/live-stats');
      const ci = body.data.checklistItems;
      expect(ci === null || Array.isArray(ci)).toBe(true);
    });
  });
});
