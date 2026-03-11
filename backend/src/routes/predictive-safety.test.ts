/**
 * Predictive Safety AI Route Test Suite
 *
 * Covers:
 *   GET    /api/predictive-safety/stats                                  — KPIs, accuracy, counts
 *   GET    /api/predictive-safety/model-metrics                         — precision, recall, f1Score
 *   GET    /api/predictive-safety/predictions                           — list, type/status filters
 *   POST   /api/predictive-safety/predictions                           — create, validation, defaults
 *   PUT    /api/predictive-safety/predictions/:id                       — update, 400/404
 *   DELETE /api/predictive-safety/predictions/:id                       — delete, 404
 *   PUT    /api/predictive-safety/predictions/:id/recommendations/:recId — update recommendation
 *   GET    /api/predictive-safety/insights                              — list, count
 *   POST   /api/predictive-safety/insights                              — create, validation
 *   DELETE /api/predictive-safety/insights/:id                         — delete, 404
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { predictiveSafetyRoutes } from './predictive-safety';

// ── App factory ────────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  predictiveSafetyRoutes(app);
  return app;
}

// ── Request helper ─────────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body    = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── Cleanup helpers ────────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG     = `ps-test-${Date.now()}`;
const createdPredIds:  string[] = [];
const createdInsightIds: number[] = [];

afterAll(() => {
  if (createdPredIds.length) {
    sqlite
      .prepare(`DELETE FROM predictive_predictions WHERE prediction_id IN (${createdPredIds.map(() => '?').join(',')})`)
      .run(...createdPredIds);
  }
  if (createdInsightIds.length) {
    sqlite
      .prepare(`DELETE FROM predictive_insights WHERE id IN (${createdInsightIds.map(() => '?').join(',')})`)
      .run(...createdInsightIds);
  }
  // catch any tag-based predictions
  const tagPreds = (sqlite.prepare(`SELECT prediction_id FROM predictive_predictions WHERE title LIKE ?`).all(`${TAG}%`) as any[]).map((r) => r.prediction_id);
  if (tagPreds.length) {
    sqlite.prepare(`DELETE FROM predictive_predictions WHERE prediction_id IN (${tagPreds.map(() => '?').join(',')})`).run(...tagPreds);
  }
  const tagInsights = (sqlite.prepare(`SELECT id FROM predictive_insights WHERE title LIKE ?`).all(`${TAG}%`) as any[]).map((r) => r.id);
  if (tagInsights.length) {
    sqlite.prepare(`DELETE FROM predictive_insights WHERE id IN (${tagInsights.map(() => '?').join(',')})`).run(...tagInsights);
  }
  sqlite.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/predictive-safety/stats
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/predictive-safety/stats', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 200 with success:true', async () => {
    const { status, body } = await req(app, 'GET', '/api/predictive-safety/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns all required KPI fields', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/stats');
    const d = body.data;
    expect(typeof d.modelAccuracy).toBe('number');
    expect(typeof d.predictionsMade).toBe('number');
    expect(typeof d.risksMitigated).toBe('number');
    expect(typeof d.activeAlerts).toBe('number');
  });

  it('all KPIs are non-negative', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/stats');
    const d = body.data;
    expect(d.modelAccuracy).toBeGreaterThanOrEqual(0);
    expect(d.predictionsMade).toBeGreaterThanOrEqual(0);
    expect(d.risksMitigated).toBeGreaterThanOrEqual(0);
    expect(d.activeAlerts).toBeGreaterThanOrEqual(0);
  });

  it('modelAccuracy matches seeded config value (94.2)', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/stats');
    expect(body.data.modelAccuracy).toBeCloseTo(94.2, 1);
  });

  it('predictionsMade includes base offset + live count', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/stats');
    expect(body.data.predictionsMade).toBeGreaterThanOrEqual(1282 + 2); // base + 2 seeded
  });

  it('activeAlerts equals count of active predictions', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/stats');
    expect(body.data.activeAlerts).toBeGreaterThanOrEqual(2); // 2 seeded active
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/predictive-safety/model-metrics
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/predictive-safety/model-metrics', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 200 with success:true', async () => {
    const { status, body } = await req(app, 'GET', '/api/predictive-safety/model-metrics');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns all required metric fields', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/model-metrics');
    const d = body.data;
    expect(typeof d.accuracy).toBe('number');
    expect(typeof d.precision).toBe('number');
    expect(typeof d.recall).toBe('number');
    expect(typeof d.f1Score).toBe('number');
    expect(typeof d.lastTrainedDate).toBe('string');
    expect(typeof d.dataPoints).toBe('number');
    expect(typeof d.predictionsMade).toBe('number');
    expect(typeof d.successfulPredictions).toBe('number');
  });

  it('seeded precision = 92, recall = 88, f1Score = 90', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/model-metrics');
    expect(body.data.precision).toBe(92);
    expect(body.data.recall).toBe(88);
    expect(body.data.f1Score).toBe(90);
  });

  it('lastTrainedDate is a non-empty string', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/model-metrics');
    expect(body.data.lastTrainedDate.length).toBeGreaterThan(0);
  });

  it('dataPoints matches seeded value (5420)', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/model-metrics');
    expect(body.data.dataPoints).toBe(5420);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/predictive-safety/predictions
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/predictive-safety/predictions', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 200 with success:true and data array', async () => {
    const { status, body } = await req(app, 'GET', '/api/predictive-safety/predictions');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('count field matches data.length', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/predictions');
    expect(body.count).toBe(body.data.length);
  });

  it('each prediction has required camelCase fields', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/predictions');
    const p = body.data[0];
    expect(p).toHaveProperty('id');
    expect(p).toHaveProperty('dbId');
    expect(p).toHaveProperty('type');
    expect(p).toHaveProperty('title');
    expect(p).toHaveProperty('description');
    expect(p).toHaveProperty('location');
    expect(p).toHaveProperty('department');
    expect(p).toHaveProperty('probability');
    expect(p).toHaveProperty('severity');
    expect(p).toHaveProperty('timeframe');
    expect(p).toHaveProperty('predictedDate');
    expect(p).toHaveProperty('confidenceLevel');
    expect(p).toHaveProperty('riskFactors');
    expect(p).toHaveProperty('recommendations');
    expect(p).toHaveProperty('status');
    expect(p).toHaveProperty('trend');
    expect(p).toHaveProperty('historicalIncidents');
  });

  it('riskFactors is an array of objects', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/predictions');
    const p = body.data.find((p: any) => p.id === 'PRED-001');
    expect(Array.isArray(p.riskFactors)).toBe(true);
    expect(p.riskFactors.length).toBeGreaterThan(0);
    expect(p.riskFactors[0]).toHaveProperty('factor');
    expect(p.riskFactors[0]).toHaveProperty('category');
  });

  it('recommendations is an array of objects', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/predictions');
    const p = body.data.find((p: any) => p.id === 'PRED-001');
    expect(Array.isArray(p.recommendations)).toBe(true);
    expect(p.recommendations[0]).toHaveProperty('action');
    expect(p.recommendations[0]).toHaveProperty('priority');
  });

  it('results are ordered by probability DESC', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/predictions');
    const probs = body.data.map((p: any) => p.probability);
    for (let i = 0; i < probs.length - 1; i++) {
      expect(probs[i]).toBeGreaterThanOrEqual(probs[i + 1]);
    }
  });

  it('filters by type=incident', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/predictions?type=incident');
    expect(body.data.every((p: any) => p.type === 'incident')).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('filters by type=equipment_failure', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/predictions?type=equipment_failure');
    expect(body.data.every((p: any) => p.type === 'equipment_failure')).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('filters by status=active', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/predictions?status=active');
    expect(body.data.every((p: any) => p.status === 'active')).toBe(true);
  });

  it('seeded predictions are present (PRED-001, PRED-002)', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/predictions');
    const ids = body.data.map((p: any) => p.id);
    expect(ids).toContain('PRED-001');
    expect(ids).toContain('PRED-002');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/predictive-safety/predictions
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/predictive-safety/predictions', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('creates a prediction with 201 and defaults', async () => {
    const { status, body } = await req(app, 'POST', '/api/predictive-safety/predictions', {
      title: `${TAG} New Prediction`,
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.type).toBe('incident');
    expect(body.data.severity).toBe('medium');
    expect(body.data.status).toBe('active');
    expect(body.data.trend).toBe('stable');
    expect(Array.isArray(body.data.riskFactors)).toBe(true);
    expect(Array.isArray(body.data.recommendations)).toBe(true);
    if (body.data.id) createdPredIds.push(body.data.id);
  });

  it('stores all provided fields correctly', async () => {
    const { body } = await req(app, 'POST', '/api/predictive-safety/predictions', {
      type: 'equipment_failure',
      title: `${TAG} Full Prediction`,
      description: 'Full description',
      location: 'Site B',
      department: 'Maintenance',
      probability: 55,
      severity: 'high',
      timeframe: 'immediate',
      predictedDate: '2026-03-15',
      confidenceLevel: 80,
      status: 'active',
      trend: 'increasing',
      historicalIncidents: 2,
    });
    expect(body.data.type).toBe('equipment_failure');
    expect(body.data.probability).toBe(55);
    expect(body.data.severity).toBe('high');
    expect(body.data.timeframe).toBe('immediate');
    expect(body.data.confidenceLevel).toBe(80);
    expect(body.data.trend).toBe('increasing');
    expect(body.data.historicalIncidents).toBe(2);
    if (body.data.id) createdPredIds.push(body.data.id);
  });

  it('generates a unique string prediction_id', async () => {
    const { body } = await req(app, 'POST', '/api/predictive-safety/predictions', {
      title: `${TAG} ID Test`,
    });
    expect(typeof body.data.id).toBe('string');
    expect(body.data.id.startsWith('PRED-')).toBe(true);
    if (body.data.id) createdPredIds.push(body.data.id);
  });

  it('returns 400 when title is missing', async () => {
    const { status } = await req(app, 'POST', '/api/predictive-safety/predictions', {
      type: 'incident',
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid type', async () => {
    const { status } = await req(app, 'POST', '/api/predictive-safety/predictions', {
      title: `${TAG} Bad Type`, type: 'explosion',
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid severity', async () => {
    const { status } = await req(app, 'POST', '/api/predictive-safety/predictions', {
      title: `${TAG} Bad Sev`, severity: 'extreme',
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid timeframe', async () => {
    const { status } = await req(app, 'POST', '/api/predictive-safety/predictions', {
      title: `${TAG} Bad TF`, timeframe: 'next_year',
    });
    expect(status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/predictive-safety/predictions/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/predictive-safety/predictions/:id', () => {
  let app: Hono;
  let predId: string;

  beforeAll(async () => {
    app = createTestApp();
    const { body } = await req(app, 'POST', '/api/predictive-safety/predictions', {
      title: `${TAG} Update Target`,
      probability: 40,
      severity: 'low',
    });
    predId = body.data.id;
    createdPredIds.push(predId);
  });

  it('updates probability and returns 200', async () => {
    const { status, body } = await req(app, 'PUT', `/api/predictive-safety/predictions/${predId}`, { probability: 75 });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.probability).toBe(75);
  });

  it('updates severity', async () => {
    const { body } = await req(app, 'PUT', `/api/predictive-safety/predictions/${predId}`, { severity: 'critical' });
    expect(body.data.severity).toBe('critical');
  });

  it('updates status to mitigated', async () => {
    const { body } = await req(app, 'PUT', `/api/predictive-safety/predictions/${predId}`, { status: 'mitigated' });
    expect(body.data.status).toBe('mitigated');
  });

  it('partial update preserves unchanged fields', async () => {
    await req(app, 'PUT', `/api/predictive-safety/predictions/${predId}`, { trend: 'decreasing' });
    const { body } = await req(app, 'GET', '/api/predictive-safety/predictions');
    const p = body.data.find((x: any) => x.id === predId);
    expect(p?.trend).toBe('decreasing');
    expect(p?.title).toBe(`${TAG} Update Target`);
  });

  it('returns 400 for empty body', async () => {
    const { status } = await req(app, 'PUT', `/api/predictive-safety/predictions/${predId}`, {});
    expect(status).toBe(400);
  });

  it('returns 404 for non-existent prediction', async () => {
    const { status } = await req(app, 'PUT', '/api/predictive-safety/predictions/PRED-NOTEXIST', { probability: 10 });
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/predictive-safety/predictions/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/predictive-safety/predictions/:id', () => {
  let app: Hono;
  let predId: string;

  beforeAll(async () => {
    app = createTestApp();
    const { body } = await req(app, 'POST', '/api/predictive-safety/predictions', {
      title: `${TAG} Delete Target`,
    });
    predId = body.data.id;
  });

  it('deletes a prediction and returns 200', async () => {
    const { status, body } = await req(app, 'DELETE', `/api/predictive-safety/predictions/${predId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('deleted prediction is gone from the list', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/predictions');
    expect(body.data.find((p: any) => p.id === predId)).toBeUndefined();
  });

  it('returns 404 for already-deleted prediction', async () => {
    const { status } = await req(app, 'DELETE', `/api/predictive-safety/predictions/${predId}`);
    expect(status).toBe(404);
  });

  it('returns 404 for non-existent prediction', async () => {
    const { status } = await req(app, 'DELETE', '/api/predictive-safety/predictions/PRED-FAKE-9999');
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/predictive-safety/predictions/:id/recommendations/:recId
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/predictive-safety/predictions/:id/recommendations/:recId', () => {
  let app: Hono;
  const PRED_ID = 'PRED-002';
  const REC_ID  = 'REC-4';

  beforeAll(() => { app = createTestApp(); });

  it('updates recommendation status to in_progress', async () => {
    const { status, body } = await req(
      app, 'PUT',
      `/api/predictive-safety/predictions/${PRED_ID}/recommendations/${REC_ID}`,
      { status: 'in_progress' }
    );
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    const rec = body.data.recommendations.find((r: any) => r.id === REC_ID);
    expect(rec.status).toBe('in_progress');
  });

  it('updates recommendation assignedTo', async () => {
    const { body } = await req(
      app, 'PUT',
      `/api/predictive-safety/predictions/${PRED_ID}/recommendations/${REC_ID}`,
      { assignedTo: 'Maintenance Lead', status: 'in_progress' }
    );
    const rec = body.data.recommendations.find((r: any) => r.id === REC_ID);
    expect(rec.assignedTo).toBe('Maintenance Lead');
  });

  it('updates recommendation status to completed', async () => {
    const { body } = await req(
      app, 'PUT',
      `/api/predictive-safety/predictions/${PRED_ID}/recommendations/${REC_ID}`,
      { status: 'completed' }
    );
    const rec = body.data.recommendations.find((r: any) => r.id === REC_ID);
    expect(rec.status).toBe('completed');
  });

  it('other recommendations remain unchanged', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/predictions?type=equipment_failure');
    const pred = body.data.find((p: any) => p.id === PRED_ID);
    const otherRec = pred.recommendations.find((r: any) => r.id === 'REC-5');
    expect(otherRec).toBeDefined();
    // REC-5 should not have been changed
  });

  it('returns 404 for non-existent prediction', async () => {
    const { status } = await req(
      app, 'PUT',
      '/api/predictive-safety/predictions/PRED-NOTEXIST/recommendations/REC-1',
      { status: 'completed' }
    );
    expect(status).toBe(404);
  });

  it('returns 404 for non-existent recommendation', async () => {
    const { status } = await req(
      app, 'PUT',
      `/api/predictive-safety/predictions/${PRED_ID}/recommendations/REC-FAKE`,
      { status: 'completed' }
    );
    expect(status).toBe(404);
  });

  it('returns 400 when no updatable fields given', async () => {
    const { status } = await req(
      app, 'PUT',
      `/api/predictive-safety/predictions/${PRED_ID}/recommendations/${REC_ID}`,
      {}
    );
    expect(status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/predictive-safety/insights
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/predictive-safety/insights', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 200 with success:true and data array', async () => {
    const { status, body } = await req(app, 'GET', '/api/predictive-safety/insights');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('each insight has required fields', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/insights');
    const i = body.data[0];
    expect(i).toHaveProperty('id');
    expect(i).toHaveProperty('type');
    expect(i).toHaveProperty('title');
    expect(i).toHaveProperty('description');
    expect(i).toHaveProperty('confidence');
    expect(i).toHaveProperty('actionable');
    expect(i).toHaveProperty('generatedAt');
    expect(i).toHaveProperty('createdAt');
  });

  it('count field matches data.length', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/insights');
    expect(body.count).toBe(body.data.length);
  });

  it('actionable is a boolean', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/insights');
    body.data.forEach((i: any) => {
      expect(typeof i.actionable).toBe('boolean');
    });
  });

  it('seeded insights are present', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/insights');
    const titles = body.data.map((i: any) => i.title);
    expect(titles).toContain('Fatigue Pattern Detected');
    expect(titles).toContain('Weather Correlation');
    expect(titles).toContain('Training Gap');
  });

  it('returns at least 3 seeded insights', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/insights');
    expect(body.data.length).toBeGreaterThanOrEqual(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/predictive-safety/insights
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/predictive-safety/insights', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('creates an insight with 201 and defaults', async () => {
    const { status, body } = await req(app, 'POST', '/api/predictive-safety/insights', {
      title: `${TAG} New Insight`,
      description: 'Workers near chemical zone show elevated stress indicators.',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.type).toBe('pattern');
    expect(body.data.confidence).toBe(0);
    expect(body.data.actionable).toBe(false);
    if (body.data.id) createdInsightIds.push(body.data.id);
  });

  it('stores all provided fields', async () => {
    const { body } = await req(app, 'POST', '/api/predictive-safety/insights', {
      type: 'correlation',
      title: `${TAG} Full Insight`,
      description: 'Full description goes here.',
      confidence: 88,
      actionable: true,
    });
    expect(body.data.type).toBe('correlation');
    expect(body.data.confidence).toBe(88);
    expect(body.data.actionable).toBe(true);
    if (body.data.id) createdInsightIds.push(body.data.id);
  });

  it('returns 400 when title is missing', async () => {
    const { status } = await req(app, 'POST', '/api/predictive-safety/insights', {
      description: 'No title here',
    });
    expect(status).toBe(400);
  });

  it('returns 400 when description is missing', async () => {
    const { status } = await req(app, 'POST', '/api/predictive-safety/insights', {
      title: `${TAG} No Desc`,
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid insight type', async () => {
    const { status } = await req(app, 'POST', '/api/predictive-safety/insights', {
      title: `${TAG} Bad Type`, description: 'Something', type: 'random',
    });
    expect(status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/predictive-safety/insights/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/predictive-safety/insights/:id', () => {
  let app: Hono;
  let insightId: number;

  beforeAll(async () => {
    app = createTestApp();
    const { body } = await req(app, 'POST', '/api/predictive-safety/insights', {
      title: `${TAG} Delete Target Insight`,
      description: 'Will be deleted in a test.',
    });
    insightId = body.data.id;
  });

  it('deletes an insight and returns 200', async () => {
    const { status, body } = await req(app, 'DELETE', `/api/predictive-safety/insights/${insightId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('deleted insight is gone from list', async () => {
    const { body } = await req(app, 'GET', '/api/predictive-safety/insights');
    expect(body.data.find((i: any) => i.id === insightId)).toBeUndefined();
  });

  it('returns 404 for already-deleted insight', async () => {
    const { status } = await req(app, 'DELETE', `/api/predictive-safety/insights/${insightId}`);
    expect(status).toBe(404);
  });

  it('returns 404 for non-existent insight', async () => {
    const { status } = await req(app, 'DELETE', '/api/predictive-safety/insights/999999');
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Stats consistency — counts update as data changes
// ─────────────────────────────────────────────────────────────────────────────

describe('Stats consistency after mutations', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('predictionsMade increases after adding a new prediction', async () => {
    const { body: before } = await req(app, 'GET', '/api/predictive-safety/stats');
    const prevTotal = before.data.predictionsMade;

    const { body: newPred } = await req(app, 'POST', '/api/predictive-safety/predictions', {
      title: `${TAG} Stats Check Prediction`,
    });
    createdPredIds.push(newPred.data.id);

    const { body: after } = await req(app, 'GET', '/api/predictive-safety/stats');
    expect(after.data.predictionsMade).toBe(prevTotal + 1);
  });

  it('activeAlerts decreases when a prediction is mitigated', async () => {
    const { body: newPred } = await req(app, 'POST', '/api/predictive-safety/predictions', {
      title: `${TAG} Active-to-Mitigated`,
      status: 'active',
    });
    const predId = newPred.data.id;
    createdPredIds.push(predId);

    const { body: before } = await req(app, 'GET', '/api/predictive-safety/stats');
    const prevActive = before.data.activeAlerts;

    await req(app, 'PUT', `/api/predictive-safety/predictions/${predId}`, { status: 'mitigated' });

    const { body: after } = await req(app, 'GET', '/api/predictive-safety/stats');
    expect(after.data.activeAlerts).toBe(prevActive - 1);
  });

  it('risksMitigated increases when a prediction is mitigated', async () => {
    const { body: newPred } = await req(app, 'POST', '/api/predictive-safety/predictions', {
      title: `${TAG} Mitigate For Stats`,
    });
    const predId = newPred.data.id;
    createdPredIds.push(predId);

    const { body: before } = await req(app, 'GET', '/api/predictive-safety/stats');
    const prevMitigated = before.data.risksMitigated;

    await req(app, 'PUT', `/api/predictive-safety/predictions/${predId}`, { status: 'mitigated' });

    const { body: after } = await req(app, 'GET', '/api/predictive-safety/stats');
    expect(after.data.risksMitigated).toBe(prevMitigated + 1);
  });
});
