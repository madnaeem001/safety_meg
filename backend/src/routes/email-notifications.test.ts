/**
 * Email Notification System Routes Test Suite
 *
 * Covers:
 *   GET  /api/email-notifications/stats                — aggregate KPIs
 *   GET  /api/email-notifications/templates            — list with optional category filter
 *   PUT  /api/email-notifications/templates/:id        — update status / rates
 *   GET  /api/email-notifications/workflows            — list automation workflows
 *   PUT  /api/email-notifications/workflows/:id        — update workflow status
 *   POST /api/email-notifications/campaigns            — create campaign
 *   GET  /api/email-notifications/campaigns            — list campaigns
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { emailNotificationRoutes } from '../routes/email-notifications';

// ── App Factory ────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  emailNotificationRoutes(app);
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

// ── DB Seed / Cleanup ──────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `testen-${Date.now()}`;

let seededTemplateId: number;
let seededWorkflowId: number;

beforeAll(() => {
  const ts = Date.now();

  // Seed a template
  const tmplResult = sqlite.prepare(`
    INSERT INTO email_templates (name, category, status, subject, description, icon_name, color, open_rate, click_rate, sent_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(`${TAG}-Template`, 'Testing', 'active', `${TAG} Subject`, 'Test description', 'Mail', 'cyan', 55.5, 22.2, 100, ts, ts);
  seededTemplateId = Number(tmplResult.lastInsertRowid);

  // Seed a workflow
  const wfResult = sqlite.prepare(`
    INSERT INTO automation_workflows (name, trigger_event, emails_count, status, delivery_rate, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(`${TAG}-Workflow`, 'Test trigger', 3, 'testing', 97.5, ts, ts);
  seededWorkflowId = Number(wfResult.lastInsertRowid);
});

afterAll(() => {
  sqlite.prepare(`DELETE FROM email_templates WHERE name LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM automation_workflows WHERE name LIKE '${TAG}%'`).run();
  sqlite.prepare(`DELETE FROM email_campaigns WHERE name LIKE '${TAG}%'`).run();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/email-notifications/stats', () => {
  it('returns success with all required fields', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/email-notifications/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(typeof body.data.sentCount30d).toBe('number');
    expect(typeof body.data.avgOpenRate).toBe('string');
    expect(body.data.avgOpenRate).toMatch(/[\d.]+%/);
    expect(typeof body.data.avgClickRate).toBe('string');
    expect(body.data.avgClickRate).toMatch(/[\d.]+%/);
    expect(typeof body.data.deliveryRate).toBe('string');
    expect(body.data.deliveryRate).toMatch(/[\d.]+%/);
    expect(typeof body.data.activeWorkflows).toBe('number');
    expect(typeof body.data.subscriberCount).toBe('number');
  });

  it('sentCount30d is sum of all template sent_counts', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/stats');
    // Must be >= the seeded template's sent_count (100)
    expect(body.data.sentCount30d).toBeGreaterThanOrEqual(100);
  });

  it('activeWorkflows >= 1 (seed data has active workflows)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/stats');
    expect(body.data.activeWorkflows).toBeGreaterThanOrEqual(1);
  });

  it('subscriberCount equals Welcome Email sent_count (1420 from seeds)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/stats');
    // From seeded data: Welcome Email sent_count = 1420
    expect(body.data.subscriberCount).toBe(1420);
  });
});

describe('GET /api/email-notifications/templates', () => {
  it('returns success and an array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/email-notifications/templates');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('includes the seeded template', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/templates');
    const found = body.data.find((t: any) => t.id === seededTemplateId);
    expect(found).toBeDefined();
    expect(found.name).toBe(`${TAG}-Template`);
    expect(found.category).toBe('Testing');
    expect(found.status).toBe('active');
    expect(found.openRate).toBe(55.5);
    expect(found.clickRate).toBe(22.2);
    expect(found.sentCount).toBe(100);
  });

  it('returns camelCase mapped fields', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/templates');
    const found = body.data.find((t: any) => t.id === seededTemplateId);
    expect(found).toHaveProperty('iconName');
    expect(found).toHaveProperty('openRate');
    expect(found).toHaveProperty('clickRate');
    expect(found).toHaveProperty('sentCount');
    expect(found).not.toHaveProperty('open_rate');
    expect(found).not.toHaveProperty('sent_count');
  });

  it('includes seed templates from init-db (Welcome Email)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/templates');
    const names = body.data.map((t: any) => t.name);
    expect(names).toContain('Welcome Email');
    expect(names).toContain('Incident Alert');
  });

  it('filters by category=Onboarding', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/templates?category=Onboarding');
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.every((t: any) => t.category === 'Onboarding')).toBe(true);
  });

  it('filters by category=Alerts returns only Alerts', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/templates?category=Alerts');
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.every((t: any) => t.category === 'Alerts')).toBe(true);
  });

  it('category=All returns all templates', async () => {
    const appAll = createTestApp();
    const appFiltered = createTestApp();
    const { body: allBody } = await req(appAll, 'GET', '/api/email-notifications/templates?category=All');
    const { body: unfilteredBody } = await req(appFiltered, 'GET', '/api/email-notifications/templates');
    expect(allBody.data.length).toBe(unfilteredBody.data.length);
  });
});

describe('PUT /api/email-notifications/templates/:id', () => {
  it('updates status to paused', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/email-notifications/templates/${seededTemplateId}`, {
      status: 'paused',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('paused');
  });

  it('reflects update in subsequent GET', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/templates');
    const found = body.data.find((t: any) => t.id === seededTemplateId);
    expect(found.status).toBe('paused');
  });

  it('updates openRate and clickRate', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/email-notifications/templates/${seededTemplateId}`, {
      openRate: 72.5,
      clickRate: 33.0,
    });
    expect(status).toBe(200);
    expect(body.data.openRate).toBe(72.5);
    expect(body.data.clickRate).toBe(33.0);
  });

  it('updates sentCount', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'PUT', `/api/email-notifications/templates/${seededTemplateId}`, {
      sentCount: 250,
    });
    expect(body.data.sentCount).toBe(250);
  });

  it('returns 404 for non-existent id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/email-notifications/templates/99999999', {
      status: 'active',
    });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid id format', async () => {
    const app = createTestApp();
    const { status } = await req(app, 'PUT', '/api/email-notifications/templates/abc', {
      status: 'active',
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid status value', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/email-notifications/templates/${seededTemplateId}`, {
      status: 'deleted',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('no-op update returns current row', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/email-notifications/templates/${seededTemplateId}`, {});
    expect(status).toBe(200);
    expect(body.data.id).toBe(seededTemplateId);
  });
});

describe('GET /api/email-notifications/workflows', () => {
  it('returns success and an array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/email-notifications/workflows');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('includes the seeded workflow', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/workflows');
    const found = body.data.find((w: any) => w.id === seededWorkflowId);
    expect(found).toBeDefined();
    expect(found.name).toBe(`${TAG}-Workflow`);
    expect(found.triggerEvent).toBe('Test trigger');
    expect(found.emailsCount).toBe(3);
    expect(found.status).toBe('testing');
    expect(found.deliveryRate).toBe(97.5);
  });

  it('returns camelCase mapped fields', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/workflows');
    const found = body.data.find((w: any) => w.id === seededWorkflowId);
    expect(found).toHaveProperty('triggerEvent');
    expect(found).toHaveProperty('emailsCount');
    expect(found).toHaveProperty('deliveryRate');
    expect(found).not.toHaveProperty('trigger_event');
    expect(found).not.toHaveProperty('emails_count');
  });

  it('includes seeded workflows (New User Welcome Sequence)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/workflows');
    const names = body.data.map((w: any) => w.name);
    expect(names).toContain('New User Welcome Sequence');
  });
});

describe('PUT /api/email-notifications/workflows/:id', () => {
  it('updates status to active', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/email-notifications/workflows/${seededWorkflowId}`, {
      status: 'active',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('active');
  });

  it('reflects update in subsequent GET', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/workflows');
    const found = body.data.find((w: any) => w.id === seededWorkflowId);
    expect(found.status).toBe('active');
  });

  it('updates deliveryRate', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'PUT', `/api/email-notifications/workflows/${seededWorkflowId}`, {
      deliveryRate: 99.9,
    });
    expect(body.data.deliveryRate).toBe(99.9);
  });

  it('updates emailsCount', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'PUT', `/api/email-notifications/workflows/${seededWorkflowId}`, {
      emailsCount: 5,
    });
    expect(body.data.emailsCount).toBe(5);
  });

  it('returns 404 for non-existent id', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', '/api/email-notifications/workflows/99999999', {
      status: 'active',
    });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid id format', async () => {
    const app = createTestApp();
    const { status } = await req(app, 'PUT', '/api/email-notifications/workflows/xyz', {
      status: 'active',
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid status value', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'PUT', `/api/email-notifications/workflows/${seededWorkflowId}`, {
      status: 'live',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe('POST /api/email-notifications/campaigns', () => {
  it('creates a new campaign with status=sent', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/email-notifications/campaigns', {
      name: `${TAG}-Campaign1`,
      subject: `${TAG} Subject`,
      audienceSegment: 'All Users',
      body: 'Hello everyone!',
      status: 'sent',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe(`${TAG}-Campaign1`);
    expect(body.data.subject).toBe(`${TAG} Subject`);
    expect(body.data.audienceSegment).toBe('All Users');
    expect(body.data.status).toBe('sent');
    expect(body.data.sentAt).toBeGreaterThan(0);
    expect(typeof body.data.id).toBe('number');
  });

  it('creates a draft campaign (sentAt is null)', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/email-notifications/campaigns', {
      name: `${TAG}-DraftCampaign`,
      subject: 'Draft subject',
      status: 'draft',
    });
    expect(body.data.status).toBe('draft');
    expect(body.data.sentAt).toBeNull();
  });

  it('defaults audienceSegment to All Users', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/email-notifications/campaigns', {
      name: `${TAG}-DefaultSeg`,
      subject: 'test',
    });
    expect(body.data.audienceSegment).toBe('All Users');
  });

  it('defaults status to draft when not provided', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/email-notifications/campaigns', {
      name: `${TAG}-NoStatus`,
      subject: 'test subject',
    });
    expect(body.data.status).toBe('draft');
  });

  it('stores recipientCount when provided', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'POST', '/api/email-notifications/campaigns', {
      name: `${TAG}-WithCount`,
      subject: 'test',
      recipientCount: 500,
    });
    expect(body.data.recipientCount).toBe(500);
  });

  it('returns 400 when name is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/email-notifications/campaigns', {
      subject: 'Test subject',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when subject is missing', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/email-notifications/campaigns', {
      name: `${TAG}-NoSubject`,
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid status value', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'POST', '/api/email-notifications/campaigns', {
      name: `${TAG}-BadStatus`,
      subject: 'test',
      status: 'published',
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe('GET /api/email-notifications/campaigns', () => {
  it('returns success and an array', async () => {
    const app = createTestApp();
    const { status, body } = await req(app, 'GET', '/api/email-notifications/campaigns');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('contains the created campaign from POST tests', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/campaigns');
    const found = body.data.find((c: any) => c.name === `${TAG}-Campaign1`);
    expect(found).toBeDefined();
    expect(found.status).toBe('sent');
  });

  it('returns campaigns in descending created_at order', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/campaigns');
    if (body.data.length >= 2) {
      expect(body.data[0].createdAt).toBeGreaterThanOrEqual(body.data[1].createdAt);
    }
  });

  it('respects limit param', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/campaigns?limit=2');
    expect(body.data.length).toBeLessThanOrEqual(2);
  });

  it('caps limit at 200', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/campaigns?limit=999');
    expect(body.data.length).toBeLessThanOrEqual(200);
  });

  it('returns mapped camelCase fields', async () => {
    const app = createTestApp();
    const { body } = await req(app, 'GET', '/api/email-notifications/campaigns');
    if (body.data.length > 0) {
      const c = body.data[0];
      expect(c).toHaveProperty('audienceSegment');
      expect(c).not.toHaveProperty('audience_segment');
    }
  });
});
