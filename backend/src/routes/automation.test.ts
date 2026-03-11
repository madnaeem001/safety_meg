/**
 * Automation Rules, Events & Trigger API Route Tests
 * Covers:
 *   - GET  /api/automation/rules
 *   - POST /api/automation/rules
 *   - PUT  /api/automation/rules/:id
 *   - DELETE /api/automation/rules/:id
 *   - POST /api/automation/trigger
 *   - GET  /api/automation/events
 *   - POST /api/automation/events
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { automationRoutes } from '../routes/automation';

// ── Test App Factory ──────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  automationRoutes(app);
  return app;
}

// ── Helper ────────────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  const json = await res.json();
  return { status: res.status, body: json as any };
}

// ── DB Handle & Cleanup ───────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `test-auto-${Date.now()}`;

afterAll(() => {
  sqlite.prepare(`DELETE FROM automation_events WHERE rule_name LIKE '${TAG}%'`).run();
  // Cascade ON DELETE will remove events, but events table also holds direct inserts
  sqlite
    .prepare(
      `DELETE FROM automation_events WHERE rule_id IN (
        SELECT id FROM automation_rules WHERE name LIKE '${TAG}%'
      )`
    )
    .run();
  sqlite.prepare(`DELETE FROM automation_rules WHERE name LIKE '${TAG}%'`).run();
});

// ── Helpers ───────────────────────────────────────────────────────────────

function seedRule(name: string, active = 1) {
  const result = sqlite
    .prepare(
      `INSERT INTO automation_rules
         (name, trigger_condition, action, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      name,
      JSON.stringify({ type: 'incident_created' }),
      JSON.stringify({ type: 'send_notification' }),
      active,
      Date.now(),
      Date.now()
    );
  return Number(result.lastInsertRowid);
}

// ── Test Suite ─────────────────────────────────────────────────────────────

describe('Automation Routes', () => {
  let app: Hono;
  let activeRuleId: number;
  let inactiveRuleId: number;

  beforeAll(() => {
    app = createTestApp();
    activeRuleId = seedRule(`${TAG}-active`, 1);
    inactiveRuleId = seedRule(`${TAG}-inactive`, 0);
  });

  // ── GET /api/automation/rules ────────────────────────────────────────────

  describe('GET /api/automation/rules', () => {
    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/automation/rules');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/automation/rules');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns both active and inactive rules when no filter', async () => {
      const { body } = await req(app, 'GET', '/api/automation/rules');
      const ids = body.data.map((r: any) => r.id);
      expect(ids).toContain(activeRuleId);
      expect(ids).toContain(inactiveRuleId);
    });

    it('filters to only active rules when ?active=1', async () => {
      const { status, body } = await req(app, 'GET', '/api/automation/rules?active=1');
      expect(status).toBe(200);
      const ids = body.data.map((r: any) => r.id);
      expect(ids).toContain(activeRuleId);
      expect(ids).not.toContain(inactiveRuleId);
    });

    it('filters to only inactive rules when ?active=0', async () => {
      const { status, body } = await req(app, 'GET', '/api/automation/rules?active=0');
      expect(status).toBe(200);
      const ids = body.data.map((r: any) => r.id);
      expect(ids).toContain(inactiveRuleId);
      expect(ids).not.toContain(activeRuleId);
    });

    it('maps active field to boolean true for active rules', async () => {
      const { body } = await req(app, 'GET', '/api/automation/rules?active=1');
      body.data
        .filter((r: any) => r.id === activeRuleId)
        .forEach((r: any) => expect(r.active).toBe(true));
    });

    it('maps active field to boolean false for inactive rules', async () => {
      const { body } = await req(app, 'GET', '/api/automation/rules?active=0');
      body.data
        .filter((r: any) => r.id === inactiveRuleId)
        .forEach((r: any) => expect(r.active).toBe(false));
    });

    it('returns total count', async () => {
      const { body } = await req(app, 'GET', '/api/automation/rules');
      expect(typeof body.total).toBe('number');
      expect(body.total).toBeGreaterThanOrEqual(2);
    });

    it('rule objects include expected fields', async () => {
      const { body } = await req(app, 'GET', '/api/automation/rules');
      const rule = body.data.find((r: any) => r.id === activeRuleId);
      expect(rule).toHaveProperty('id');
      expect(rule).toHaveProperty('name');
      expect(rule).toHaveProperty('triggerCondition');
      expect(rule).toHaveProperty('action');
      expect(rule).toHaveProperty('active');
      expect(rule).toHaveProperty('executionCount');
    });
  });

  // ── POST /api/automation/rules ───────────────────────────────────────────

  describe('POST /api/automation/rules', () => {
    it('creates a rule and returns 201 with id', async () => {
      const { status, body } = await req(app, 'POST', '/api/automation/rules', {
        name: `${TAG}-create-1`,
        triggerCondition: { type: 'incident_created', severity: ['high'] },
        action: { type: 'send_notification', channels: ['email'] },
        active: 1,
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(typeof body.data.id).toBe('number');
    });

    it('created rule has correct name', async () => {
      const ruleName = `${TAG}-create-name`;
      const { body } = await req(app, 'POST', '/api/automation/rules', {
        name: ruleName,
        triggerCondition: { type: 'capa_due' },
        action: { type: 'create_capa' },
      });
      expect(body.data.name).toBe(ruleName);
    });

    it('created rule defaults to active=true when active=1', async () => {
      const { body } = await req(app, 'POST', '/api/automation/rules', {
        name: `${TAG}-create-active`,
        triggerCondition: { type: 'schedule' },
        action: { type: 'generate_report' },
        active: 1,
      });
      expect(body.data.active).toBe(true);
    });

    it('created rule is active=false when active=0', async () => {
      const { body } = await req(app, 'POST', '/api/automation/rules', {
        name: `${TAG}-create-inactive`,
        triggerCondition: { type: 'schedule' },
        action: { type: 'generate_report' },
        active: 0,
      });
      expect(body.data.active).toBe(false);
    });

    it('returns 400 when name is missing', async () => {
      const { status } = await req(app, 'POST', '/api/automation/rules', {
        triggerCondition: { type: 'incident_created' },
        action: { type: 'send_notification' },
      });
      expect(status).toBe(400);
    });

    it('returns 400 when triggerCondition is missing', async () => {
      const { status } = await req(app, 'POST', '/api/automation/rules', {
        name: `${TAG}-bad-missing-trigger`,
        action: { type: 'send_notification' },
      });
      expect(status).toBe(400);
    });

    it('returns 400 when action is missing', async () => {
      const { status } = await req(app, 'POST', '/api/automation/rules', {
        name: `${TAG}-bad-missing-action`,
        triggerCondition: { type: 'incident_created' },
      });
      expect(status).toBe(400);
    });

    it('stores and returns triggerCondition as object', async () => {
      const tc = { type: 'inspection_completed', site: 'SiteA' };
      const { body } = await req(app, 'POST', '/api/automation/rules', {
        name: `${TAG}-create-tc`,
        triggerCondition: tc,
        action: { type: 'webhook' },
      });
      expect(body.data.triggerCondition).toMatchObject(tc);
    });
  });

  // ── PUT /api/automation/rules/:id ────────────────────────────────────────

  describe('PUT /api/automation/rules/:id', () => {
    let updateTargetId: number;

    beforeAll(() => {
      updateTargetId = seedRule(`${TAG}-update-target`, 1);
    });

    it('updates a rule name and returns 200', async () => {
      const newName = `${TAG}-update-renamed`;
      const { status, body } = await req(app, 'PUT', `/api/automation/rules/${updateTargetId}`, {
        name: newName,
        triggerCondition: { type: 'incident_created' },
        action: { type: 'send_notification' },
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe(newName);
    });

    it('toggles active from true to false', async () => {
      const { body } = await req(app, 'PUT', `/api/automation/rules/${updateTargetId}`, {
        name: `${TAG}-update-renamed`,
        triggerCondition: { type: 'incident_created' },
        action: { type: 'send_notification' },
        active: 0,
      });
      expect(body.data.active).toBe(false);
    });

    it('toggles active from false back to true', async () => {
      const { body } = await req(app, 'PUT', `/api/automation/rules/${updateTargetId}`, {
        name: `${TAG}-update-renamed`,
        triggerCondition: { type: 'incident_created' },
        action: { type: 'send_notification' },
        active: 1,
      });
      expect(body.data.active).toBe(true);
    });

    it('returns 404 for a non-existent rule id', async () => {
      const { status } = await req(app, 'PUT', '/api/automation/rules/99999999', {
        name: `${TAG}-no-such-rule`,
        triggerCondition: { type: 'incident_created' },
        action: { type: 'send_notification' },
      });
      expect(status).toBe(404);
    });

    it('returns 400 for a non-numeric id', async () => {
      const { status } = await req(app, 'PUT', '/api/automation/rules/abc', {
        name: `${TAG}-bad-id`,
        triggerCondition: { type: 'incident_created' },
        action: { type: 'send_notification' },
      });
      expect(status).toBe(400);
    });

    it('updates triggerCondition object', async () => {
      const newTc = { type: 'capa_due', daysAhead: 3 };
      const { body } = await req(app, 'PUT', `/api/automation/rules/${updateTargetId}`, {
        triggerCondition: newTc,
        action: { type: 'send_notification' },
      });
      expect(body.data.triggerCondition).toMatchObject(newTc);
    });
  });

  // ── DELETE /api/automation/rules/:id ─────────────────────────────────────

  describe('DELETE /api/automation/rules/:id', () => {
    it('deletes an existing rule and returns success', async () => {
      const idToDelete = seedRule(`${TAG}-to-delete`, 1);
      const { status, body } = await req(app, 'DELETE', `/api/automation/rules/${idToDelete}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('deleted rule is no longer returned by GET', async () => {
      const idToDelete = seedRule(`${TAG}-verify-delete`, 1);
      await req(app, 'DELETE', `/api/automation/rules/${idToDelete}`);
      const { body } = await req(app, 'GET', '/api/automation/rules');
      const ids = body.data.map((r: any) => r.id);
      expect(ids).not.toContain(idToDelete);
    });

    it('returns 404 for a non-existent rule id', async () => {
      const { status } = await req(app, 'DELETE', '/api/automation/rules/99999999');
      expect(status).toBe(404);
    });

    it('returns 400 for a non-numeric id', async () => {
      const { status } = await req(app, 'DELETE', '/api/automation/rules/abc');
      expect(status).toBe(400);
    });
  });

  // ── POST /api/automation/trigger ─────────────────────────────────────────

  describe('POST /api/automation/trigger', () => {
    it('triggers an active rule and returns 200', async () => {
      const { status, body } = await req(app, 'POST', '/api/automation/trigger', {
        ruleId: activeRuleId,
      });
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returned triggeredAt is a recent timestamp', async () => {
      const before = Date.now();
      const { body } = await req(app, 'POST', '/api/automation/trigger', {
        ruleId: activeRuleId,
      });
      const after = Date.now();
      expect(body.triggeredAt).toBeGreaterThanOrEqual(before);
      expect(body.triggeredAt).toBeLessThanOrEqual(after);
    });

    it('returns ruleId and action in response', async () => {
      const { body } = await req(app, 'POST', '/api/automation/trigger', {
        ruleId: activeRuleId,
      });
      expect(body.ruleId).toBe(activeRuleId);
      expect(typeof body.action).toBe('object');
    });

    it('increments executionCount after trigger', async () => {
      const countBefore = (sqlite.prepare(
        'SELECT execution_count FROM automation_rules WHERE id = ?'
      ).get(activeRuleId) as any).execution_count;

      await req(app, 'POST', '/api/automation/trigger', { ruleId: activeRuleId });

      const countAfter = (sqlite.prepare(
        'SELECT execution_count FROM automation_rules WHERE id = ?'
      ).get(activeRuleId) as any).execution_count;

      expect(countAfter).toBe(countBefore + 1);
    });

    it('records an event in automation_events after trigger', async () => {
      const eventsBefore = (sqlite.prepare(
        'SELECT COUNT(*) as n FROM automation_events WHERE rule_id = ?'
      ).get(activeRuleId) as any).n;

      await req(app, 'POST', '/api/automation/trigger', { ruleId: activeRuleId });

      const eventsAfter = (sqlite.prepare(
        'SELECT COUNT(*) as n FROM automation_events WHERE rule_id = ?'
      ).get(activeRuleId) as any).n;

      expect(eventsAfter).toBe(eventsBefore + 1);
    });

    it('returns 400 when triggering an inactive rule', async () => {
      const { status, body } = await req(app, 'POST', '/api/automation/trigger', {
        ruleId: inactiveRuleId,
      });
      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 404 for a non-existent ruleId', async () => {
      const { status } = await req(app, 'POST', '/api/automation/trigger', {
        ruleId: 99999999,
      });
      expect(status).toBe(404);
    });

    it('returns 400 when ruleId is missing', async () => {
      const { status } = await req(app, 'POST', '/api/automation/trigger', {});
      expect(status).toBe(400);
    });

    it('returns 400 when ruleId is a string', async () => {
      const { status } = await req(app, 'POST', '/api/automation/trigger', {
        ruleId: 'abc',
      });
      expect(status).toBe(400);
    });

    it('returns 400 when ruleId is zero', async () => {
      const { status } = await req(app, 'POST', '/api/automation/trigger', {
        ruleId: 0,
      });
      expect(status).toBe(400);
    });

    it('returns 400 when ruleId is negative', async () => {
      const { status } = await req(app, 'POST', '/api/automation/trigger', {
        ruleId: -1,
      });
      expect(status).toBe(400);
    });

    it('returns 400 when ruleId is a float', async () => {
      const { status } = await req(app, 'POST', '/api/automation/trigger', {
        ruleId: 1.5,
      });
      expect(status).toBe(400);
    });
  });

  // ── GET /api/automation/events ────────────────────────────────────────────

  describe('GET /api/automation/events', () => {
    beforeAll(async () => {
      // Seed a couple of events for the active rule
      const triggerApp = createTestApp();
      await req(triggerApp, 'POST', '/api/automation/trigger', { ruleId: activeRuleId });
      await req(triggerApp, 'POST', '/api/automation/trigger', { ruleId: activeRuleId });
    });

    it('returns 200 with success true', async () => {
      const { status, body } = await req(app, 'GET', '/api/automation/events');
      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns a data array', async () => {
      const { body } = await req(app, 'GET', '/api/automation/events');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('filters by ruleId when ?ruleId= is provided', async () => {
      const { body } = await req(
        app, 'GET', `/api/automation/events?ruleId=${activeRuleId}`
      );
      body.data.forEach((e: any) => expect(e.ruleId).toBe(activeRuleId));
    });

    it('respects the limit parameter', async () => {
      const { body } = await req(app, 'GET', '/api/automation/events?limit=1');
      expect(body.data.length).toBeLessThanOrEqual(1);
    });

    it('event objects contain expected fields', async () => {
      const { body } = await req(
        app, 'GET', `/api/automation/events?ruleId=${activeRuleId}&limit=1`
      );
      if (body.data.length > 0) {
        const evt = body.data[0];
        expect(evt).toHaveProperty('id');
        expect(evt).toHaveProperty('ruleId');
        expect(evt).toHaveProperty('ruleName');
        expect(evt).toHaveProperty('triggerType');
        expect(evt).toHaveProperty('status');
        expect(evt).toHaveProperty('createdAt');
      }
    });

    it('returns total count', async () => {
      const { body } = await req(app, 'GET', '/api/automation/events');
      expect(typeof body.total).toBe('number');
    });
  });

  // ── POST /api/automation/events ───────────────────────────────────────────

  describe('POST /api/automation/events', () => {
    it('creates an event and returns 201', async () => {
      const { status, body } = await req(app, 'POST', '/api/automation/events', {
        ruleId: activeRuleId,
        ruleName: `${TAG}-active`,
        triggerType: 'incident_created',
        status: 'success',
        details: 'Test event',
      });
      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(typeof body.data.id).toBe('number');
    });

    it('created event status defaults to success', async () => {
      const { body } = await req(app, 'POST', '/api/automation/events', {
        ruleId: activeRuleId,
        ruleName: `${TAG}-active`,
        triggerType: 'schedule',
      });
      expect(body.data.status).toBe('success');
    });

    it('accepts status=failed', async () => {
      const { status, body } = await req(app, 'POST', '/api/automation/events', {
        ruleId: activeRuleId,
        ruleName: `${TAG}-active`,
        triggerType: 'capa_due',
        status: 'failed',
      });
      expect(status).toBe(201);
      expect(body.data.status).toBe('failed');
    });

    it('returns 400 when ruleId is missing', async () => {
      const { status } = await req(app, 'POST', '/api/automation/events', {
        ruleName: `${TAG}-active`,
        triggerType: 'incident_created',
      });
      expect(status).toBe(400);
    });

    it('returns 400 when ruleName is missing', async () => {
      const { status } = await req(app, 'POST', '/api/automation/events', {
        ruleId: activeRuleId,
        triggerType: 'incident_created',
      });
      expect(status).toBe(400);
    });

    it('returns 400 when triggerType is missing', async () => {
      const { status } = await req(app, 'POST', '/api/automation/events', {
        ruleId: activeRuleId,
        ruleName: `${TAG}-active`,
      });
      expect(status).toBe(400);
    });

    it('returns 400 for invalid status value', async () => {
      const { status } = await req(app, 'POST', '/api/automation/events', {
        ruleId: activeRuleId,
        ruleName: `${TAG}-active`,
        triggerType: 'incident_created',
        status: 'unknown_status',
      });
      expect(status).toBe(400);
    });
  });
});
