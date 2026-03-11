/**
 * AI Audit Form API Route Tests
 * Tests POST /api/ai/audit-analysis, session CRUD, and custom-template CRUD endpoints.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { aiRoutes } from '../routes/ai';

// ── Test App Factory ──────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  aiRoutes(app, {} as any);
  return app;
}

// ── Helper ────────────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  const json = await res.json();
  return { status: res.status, body: json as any };
}

// ── Test Fixtures ─────────────────────────────────────────────────────────

const TEST_TEMPLATE_ID = `test-tpl-${Date.now()}`;
const TEST_TEMPLATE_ID_2 = `test-tpl2-${Date.now()}`;

function makeAnalysisPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    templateId: 'iso45001',
    templateName: 'ISO 45001 Workplace Safety Audit',
    standard: 'ISO 45001',
    complianceScore: 75,
    answers: {
      q1: { status: 'compliant', notes: 'PPE available and accessible' },
      q2: { status: 'non-compliant', notes: 'Safety signs missing in Zone B' },
      q3: { status: 'na', notes: '' },
    },
    questions: [
      {
        id: 'q1',
        text: 'Is PPE available at point of use?',
        standard: 'ISO 45001',
        clause: '8.1',
        category: 'PPE',
        riskWeight: 1,
      },
      {
        id: 'q2',
        text: 'Are safety signs posted in all work areas?',
        standard: 'ISO 45001',
        clause: '8.2',
        category: 'Signage',
        riskWeight: 2,
      },
    ],
    ...overrides,
  };
}

function makeSessionPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    templateId: 'osha-general-industry',
    templateName: 'OSHA General Industry Audit',
    templateStandard: 'OSHA 29 CFR 1910',
    complianceScore: 80,
    answers: {
      q1: { status: 'compliant', notes: '' },
      q2: { status: 'non-compliant', notes: 'Requires immediate repair' },
    },
    totalQuestions: 2,
    compliantCount: 1,
    nonCompliantCount: 1,
    naCount: 0,
    evidencePhotosCount: 2,
    isCustomTemplate: false,
    aiSummary: 'Test AI-generated audit summary.',
    ...overrides,
  };
}

function makeCustomTemplatePayload(id: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id,
    name: 'My Custom Audit Template',
    standard: 'Custom',
    version: '1.0',
    description: 'A custom template created for testing.',
    categories: ['PPE', 'Housekeeping'],
    questions: [
      {
        id: 'cq1',
        text: 'Is the work area clean and tidy?',
        standard: 'Custom',
        category: 'Housekeeping',
        riskWeight: 1,
        aiHint: 'Check floors and walkways',
      },
      {
        id: 'cq2',
        text: 'Are all PPE items in good condition?',
        standard: 'Custom',
        category: 'PPE',
        riskWeight: 2,
      },
    ],
    ...overrides,
  };
}

// ── Integration Tests ─────────────────────────────────────────────────────

describe('AI Audit Form Routes', () => {
  let app: Hono;
  let savedSessionId: number;

  beforeAll(() => {
    app = createTestApp();
  });

  afterAll(() => {
    // Clean up test rows written to local.sqlite so the DB stays tidy
    try {
      const db = new Database('local.sqlite');
      db.prepare(
        `DELETE FROM ai_audit_form_sessions
         WHERE template_id = 'osha-general-industry'
            OR template_id LIKE 'test-%'`
      ).run();
      db.prepare(
        `DELETE FROM ai_audit_custom_templates WHERE id LIKE 'test-%'`
      ).run();
      db.close();
    } catch {
      // Ignore cleanup errors — test suite output already captured
    }
  });

  // ── POST /api/ai/audit-analysis ──────────────────────────────────────

  describe('POST /api/ai/audit-analysis', () => {
    it('returns 200 with a summary using the fallback path when no API key set', async () => {
      const prevKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      const { status, body } = await req(app, 'POST', '/api/ai/audit-analysis', makeAnalysisPayload());

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(typeof body.summary).toBe('string');
      expect(body.summary.length).toBeGreaterThan(10);
      expect(body.source).toBe('fallback');

      if (prevKey) process.env.OPENROUTER_API_KEY = prevKey;
    });

    it('fallback summary mentions non-compliance when non-compliant findings exist', async () => {
      const prevKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      const { body } = await req(
        app,
        'POST',
        '/api/ai/audit-analysis',
        makeAnalysisPayload({ complianceScore: 50 })
      );

      expect(body.summary).toMatch(/non-compliance/i);

      if (prevKey) process.env.OPENROUTER_API_KEY = prevKey;
    });

    it('fallback summary says "high compliance" when all answers are compliant', async () => {
      const prevKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      const { status, body } = await req(
        app,
        'POST',
        '/api/ai/audit-analysis',
        makeAnalysisPayload({
          answers: {
            q1: { status: 'compliant', notes: '' },
            q2: { status: 'compliant', notes: '' },
          },
          complianceScore: 100,
        })
      );

      expect(status).toBe(200);
      expect(body.summary).toMatch(/high compliance/i);

      if (prevKey) process.env.OPENROUTER_API_KEY = prevKey;
    });

    it('returns 400 for payload missing required fields', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/audit-analysis', {
        templateId: 'only-id',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for invalid answer status enum value', async () => {
      const { status, body } = await req(
        app,
        'POST',
        '/api/ai/audit-analysis',
        makeAnalysisPayload({
          answers: { q1: { status: 'unknown-status', notes: '' } },
        })
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when complianceScore is out of range (> 100)', async () => {
      const { status, body } = await req(
        app,
        'POST',
        '/api/ai/audit-analysis',
        makeAnalysisPayload({ complianceScore: 150 })
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('handles empty answers object gracefully', async () => {
      const prevKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      const { status, body } = await req(
        app,
        'POST',
        '/api/ai/audit-analysis',
        makeAnalysisPayload({ answers: {}, complianceScore: 100 })
      );

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(typeof body.summary).toBe('string');

      if (prevKey) process.env.OPENROUTER_API_KEY = prevKey;
    });
  });

  // ── POST /api/ai/audit-form/sessions ────────────────────────────────

  describe('POST /api/ai/audit-form/sessions', () => {
    it('saves a session and returns 201 with a numeric id', async () => {
      const { status, body } = await req(
        app,
        'POST',
        '/api/ai/audit-form/sessions',
        makeSessionPayload()
      );
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(typeof body.data.id).toBe('number');
      expect(body.data.id).toBeGreaterThan(0);
      savedSessionId = body.data.id;
    });

    it('saves a session when aiSummary is null', async () => {
      const { status, body } = await req(
        app,
        'POST',
        '/api/ai/audit-form/sessions',
        makeSessionPayload({ aiSummary: null })
      );
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('saves a session marked as a custom template', async () => {
      const { status, body } = await req(
        app,
        'POST',
        '/api/ai/audit-form/sessions',
        makeSessionPayload({ isCustomTemplate: true })
      );
      expect(status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('returns 400 when templateName is missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/audit-form/sessions', {
        templateId: 'x',
        templateStandard: 'y',
        complianceScore: 0,
        answers: {},
        totalQuestions: 0,
        compliantCount: 0,
        nonCompliantCount: 0,
        naCount: 0,
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when complianceScore is above 100', async () => {
      const { status, body } = await req(
        app,
        'POST',
        '/api/ai/audit-form/sessions',
        makeSessionPayload({ complianceScore: 101 })
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when complianceScore is negative', async () => {
      const { status, body } = await req(
        app,
        'POST',
        '/api/ai/audit-form/sessions',
        makeSessionPayload({ complianceScore: -5 })
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/ai/audit-form/sessions ─────────────────────────────────

  describe('GET /api/ai/audit-form/sessions', () => {
    it('returns 200 with a data array and count', async () => {
      const { status, body } = await req(app, 'GET', '/api/ai/audit-form/sessions');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.count).toBe('number');
    });

    it('includes the session saved in the POST test above', async () => {
      const { body } = await req(app, 'GET', '/api/ai/audit-form/sessions');
      const found = body.data.find((s: any) => s.id === savedSessionId);
      expect(found).toBeDefined();
      expect(found.templateName).toBe('OSHA General Industry Audit');
      expect(found.complianceScore).toBe(80);
      expect(found.compliantCount).toBe(1);
      expect(found.nonCompliantCount).toBe(1);
    });

    it('returns sessions in newest-first order', async () => {
      const { body } = await req(app, 'GET', '/api/ai/audit-form/sessions');
      if (body.data.length >= 2) {
        expect(body.data[0].createdAt).toBeGreaterThanOrEqual(body.data[1].createdAt);
      }
    });

    it('respects the limit query parameter', async () => {
      const { body } = await req(app, 'GET', '/api/ai/audit-form/sessions?limit=1');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeLessThanOrEqual(1);
    });

    it('returns camelCase-shaped session objects with expected fields', async () => {
      const { body } = await req(app, 'GET', '/api/ai/audit-form/sessions');
      if (body.data.length > 0) {
        const s = body.data[0];
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('templateId');
        expect(s).toHaveProperty('templateName');
        expect(s).toHaveProperty('templateStandard');
        expect(s).toHaveProperty('answers');
        expect(s).toHaveProperty('complianceScore');
        expect(s).toHaveProperty('totalQuestions');
        expect(s).toHaveProperty('compliantCount');
        expect(s).toHaveProperty('nonCompliantCount');
        expect(s).toHaveProperty('naCount');
        expect(s).toHaveProperty('evidencePhotosCount');
        expect(typeof s.isCustomTemplate).toBe('boolean');
        expect(s).toHaveProperty('createdAt');
      }
    });

    it('answers field is parsed back to an object (not a JSON string)', async () => {
      const { body } = await req(app, 'GET', '/api/ai/audit-form/sessions');
      const found = body.data.find((s: any) => s.id === savedSessionId);
      if (found) {
        expect(typeof found.answers).toBe('object');
        expect(found.answers).not.toBeNull();
        expect(!Array.isArray(found.answers)).toBe(true);
      }
    });
  });

  // ── POST /api/ai/audit-form/custom-templates ─────────────────────────

  describe('POST /api/ai/audit-form/custom-templates', () => {
    it('saves a new custom template and returns 201 with id and name', async () => {
      const { status, body } = await req(
        app,
        'POST',
        '/api/ai/audit-form/custom-templates',
        makeCustomTemplatePayload(TEST_TEMPLATE_ID)
      );
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(TEST_TEMPLATE_ID);
      expect(body.data.name).toBe('My Custom Audit Template');
    });

    it('replaces an existing template with same id (INSERT OR REPLACE)', async () => {
      const { status, body } = await req(
        app,
        'POST',
        '/api/ai/audit-form/custom-templates',
        makeCustomTemplatePayload(TEST_TEMPLATE_ID, { name: 'Updated Custom Audit' })
      );
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Updated Custom Audit');
    });

    it('saves a second template with a different id', async () => {
      const { status, body } = await req(
        app,
        'POST',
        '/api/ai/audit-form/custom-templates',
        makeCustomTemplatePayload(TEST_TEMPLATE_ID_2, { name: 'Second Test Template' })
      );
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(TEST_TEMPLATE_ID_2);
    });

    it('returns 400 when template name is shorter than 2 characters', async () => {
      const { status, body } = await req(
        app,
        'POST',
        '/api/ai/audit-form/custom-templates',
        makeCustomTemplatePayload(`test-short-${Date.now()}`, { name: 'X' })
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when required fields (categories, questions) are missing', async () => {
      const { status, body } = await req(app, 'POST', '/api/ai/audit-form/custom-templates', {
        id: 'test-missing',
        name: 'Missing Fields Only',
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 when questions array contains invalid question objects', async () => {
      const { status, body } = await req(
        app,
        'POST',
        '/api/ai/audit-form/custom-templates',
        makeCustomTemplatePayload(`test-badq-${Date.now()}`, {
          questions: [{ id: 'bad' }], // missing text, standard, category, riskWeight
        })
      );
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  // ── GET /api/ai/audit-form/custom-templates ──────────────────────────

  describe('GET /api/ai/audit-form/custom-templates', () => {
    it('returns 200 with a data array and count', async () => {
      const { status, body } = await req(app, 'GET', '/api/ai/audit-form/custom-templates');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.count).toBe('number');
    });

    it('includes the saved custom template with updated name', async () => {
      const { body } = await req(app, 'GET', '/api/ai/audit-form/custom-templates');
      const found = body.data.find((t: any) => t.id === TEST_TEMPLATE_ID);
      expect(found).toBeDefined();
      expect(found.name).toBe('Updated Custom Audit');
    });

    it('returns templates with camelCase-shaped objects', async () => {
      const { body } = await req(app, 'GET', '/api/ai/audit-form/custom-templates');
      if (body.data.length > 0) {
        const t = body.data[0];
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('name');
        expect(t).toHaveProperty('standard');
        expect(t).toHaveProperty('version');
        expect(t).toHaveProperty('description');
        expect(t).toHaveProperty('categories');
        expect(t).toHaveProperty('questions');
        expect(t).toHaveProperty('createdAt');
      }
    });

    it('categories is parsed as a JavaScript array (not a JSON string)', async () => {
      const { body } = await req(app, 'GET', '/api/ai/audit-form/custom-templates');
      const found = body.data.find((t: any) => t.id === TEST_TEMPLATE_ID);
      if (found) {
        expect(Array.isArray(found.categories)).toBe(true);
        expect(found.categories).toContain('PPE');
        expect(found.categories).toContain('Housekeeping');
      }
    });

    it('questions is parsed as a JavaScript array with full question objects', async () => {
      const { body } = await req(app, 'GET', '/api/ai/audit-form/custom-templates');
      const found = body.data.find((t: any) => t.id === TEST_TEMPLATE_ID);
      if (found) {
        expect(Array.isArray(found.questions)).toBe(true);
        expect(found.questions).toHaveLength(2);
        expect(found.questions[0].id).toBe('cq1');
        expect(found.questions[1].id).toBe('cq2');
      }
    });

    it('lists both saved test templates', async () => {
      const { body } = await req(app, 'GET', '/api/ai/audit-form/custom-templates');
      const ids = body.data.map((t: any) => t.id);
      expect(ids).toContain(TEST_TEMPLATE_ID);
      expect(ids).toContain(TEST_TEMPLATE_ID_2);
    });
  });

  // ── DELETE /api/ai/audit-form/custom-templates/:id ───────────────────

  describe('DELETE /api/ai/audit-form/custom-templates/:id', () => {
    it('deletes an existing template and returns success: true', async () => {
      const { status, body } = await req(
        app,
        'DELETE',
        `/api/ai/audit-form/custom-templates/${TEST_TEMPLATE_ID}`
      );
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 404 when trying to delete the same template again', async () => {
      const { status, body } = await req(
        app,
        'DELETE',
        `/api/ai/audit-form/custom-templates/${TEST_TEMPLATE_ID}`
      );
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 404 for a completely unknown template id', async () => {
      const { status, body } = await req(
        app,
        'DELETE',
        '/api/ai/audit-form/custom-templates/nonexistent-id-xyz-999'
      );
      expect(status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('deleted template no longer appears in GET list', async () => {
      const { body } = await req(app, 'GET', '/api/ai/audit-form/custom-templates');
      const found = body.data.find((t: any) => t.id === TEST_TEMPLATE_ID);
      expect(found).toBeUndefined();
    });

    it('second template is still present after first was deleted', async () => {
      const { body } = await req(app, 'GET', '/api/ai/audit-form/custom-templates');
      const found = body.data.find((t: any) => t.id === TEST_TEMPLATE_ID_2);
      expect(found).toBeDefined();
      expect(found.name).toBe('Second Test Template');
    });
  });
});
