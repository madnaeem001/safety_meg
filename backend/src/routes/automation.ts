import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const sqlite = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = OFF');

// Ensure automation_events table exists (safe migration for existing DBs)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS automation_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id INTEGER NOT NULL,
    rule_name TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'success',
    details TEXT,
    recipient TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_automation_events_rule ON automation_events(rule_id);
  CREATE INDEX IF NOT EXISTS idx_automation_events_created ON automation_events(created_at);
`);

const nowMs = () => Date.now();

const RuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggerCondition: z.record(z.string(), z.unknown()),
  action: z.record(z.string(), z.unknown()),
  active: z.number().int().min(0).max(1).optional().default(1),
  createdBy: z.string().optional(),
});

const AutomationEventSchema = z.object({
  ruleId: z.number().int().positive(),
  ruleName: z.string().min(1),
  triggerType: z.string().min(1),
  status: z.enum(['success', 'failed', 'pending']).optional().default('success'),
  details: z.string().optional(),
  recipient: z.string().optional(),
});

const WebhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  active: z.number().int().min(0).max(1).optional().default(1),
  secret: z.string().optional(),
});

function mapRule(r: any) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    triggerCondition: safeJson(r.trigger_condition, {}),
    action: safeJson(r.action, {}),
    active: r.active === 1,
    createdBy: r.created_by,
    executionCount: r.execution_count,
    lastTriggered: r.last_triggered,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapWebhook(w: any) {
  return {
    id: w.id,
    name: w.name,
    url: w.url,
    events: safeJson(w.events, []),
    active: w.active === 1,
    secret: w.secret,
    lastDelivery: w.last_delivery,
    failureCount: w.failure_count,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

function safeJson(v: any, def: any) {
  try { return v ? JSON.parse(v) : def; } catch { return def; }
}

function mapEvent(e: any) {
  return {
    id: e.id,
    ruleId: e.rule_id,
    ruleName: e.rule_name,
    triggerType: e.trigger_type,
    status: e.status,
    details: e.details,
    recipient: e.recipient,
    createdAt: e.created_at,
  };
}

export function automationRoutes(app: Hono) {
  // GET /api/automation/rules
  app.get('/api/automation/rules', (c) => {
    const active = c.req.query('active');
    let query = 'SELECT * FROM automation_rules';
    const params: any[] = [];
    if (active !== undefined) {
      query += ' WHERE active = ?';
      params.push(Number(active));
    }
    query += ' ORDER BY created_at DESC';
    const rules = sqlite.prepare(query).all(...params);
    return c.json({ success: true, data: rules.map(mapRule), total: rules.length });
  });

  // POST /api/automation/rules
  app.post('/api/automation/rules', async (c) => {
    const body = await c.req.json();
    const parsed = RuleSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }
    const d = parsed.data;
    const result = sqlite.prepare(
      `INSERT INTO automation_rules (name, description, trigger_condition, action, active, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(d.name, d.description ?? null, JSON.stringify(d.triggerCondition), JSON.stringify(d.action), d.active, d.createdBy ?? null, nowMs(), nowMs());
    const rule = sqlite.prepare('SELECT * FROM automation_rules WHERE id = ?').get(result.lastInsertRowid);
    return c.json({ success: true, data: mapRule(rule) }, 201);
  });

  // PUT /api/automation/rules/:id
  app.put('/api/automation/rules/:id', async (c) => {
    const id = Number(c.req.param('id'));
    if (isNaN(id) || id <= 0) return c.json({ success: false, error: 'Invalid ID' }, 400);
    const existing = sqlite.prepare('SELECT * FROM automation_rules WHERE id = ?').get(id);
    if (!existing) return c.json({ success: false, error: 'Rule not found' }, 404);
    const body = await c.req.json();
    const parsed = RuleSchema.partial().safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }
    const d = parsed.data;
    sqlite.prepare(
      `UPDATE automation_rules SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        trigger_condition = COALESCE(?, trigger_condition),
        action = COALESCE(?, action),
        active = COALESCE(?, active),
        updated_at = ?
       WHERE id = ?`
    ).run(
      d.name ?? null,
      d.description ?? null,
      d.triggerCondition ? JSON.stringify(d.triggerCondition) : null,
      d.action ? JSON.stringify(d.action) : null,
      d.active ?? null,
      nowMs(),
      id
    );
    const rule = sqlite.prepare('SELECT * FROM automation_rules WHERE id = ?').get(id);
    return c.json({ success: true, data: mapRule(rule) });
  });

  // DELETE /api/automation/rules/:id
  app.delete('/api/automation/rules/:id', (c) => {
    const id = Number(c.req.param('id'));
    if (isNaN(id) || id <= 0) return c.json({ success: false, error: 'Invalid ID' }, 400);
    const existing = sqlite.prepare('SELECT * FROM automation_rules WHERE id = ?').get(id);
    if (!existing) return c.json({ success: false, error: 'Rule not found' }, 404);
    sqlite.prepare('DELETE FROM automation_rules WHERE id = ?').run(id);
    return c.json({ success: true, message: 'Rule deleted' });
  });

  // GET /api/automation/events
  app.get('/api/automation/events', (c) => {
    const ruleId = c.req.query('ruleId');
    const limit = Number(c.req.query('limit') ?? '100');
    let query = 'SELECT * FROM automation_events';
    const params: any[] = [];
    if (ruleId) {
      query += ' WHERE rule_id = ?';
      params.push(Number(ruleId));
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    const events = sqlite.prepare(query).all(...params);
    return c.json({ success: true, data: events.map(mapEvent), total: events.length });
  });

  // POST /api/automation/events
  app.post('/api/automation/events', async (c) => {
    const body = await c.req.json();
    const parsed = AutomationEventSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }
    const d = parsed.data;
    const result = sqlite.prepare(
      `INSERT INTO automation_events (rule_id, rule_name, trigger_type, status, details, recipient, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(d.ruleId, d.ruleName, d.triggerType, d.status, d.details ?? null, d.recipient ?? null, nowMs());
    const event = sqlite.prepare('SELECT * FROM automation_events WHERE id = ?').get(result.lastInsertRowid);
    return c.json({ success: true, data: mapEvent(event) }, 201);
  });

  // POST /api/automation/trigger
  app.post('/api/automation/trigger', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { ruleId, details, recipient } = body;
    if (!ruleId || !Number.isInteger(ruleId) || ruleId <= 0) {
      return c.json({ success: false, error: 'ruleId must be a positive integer' }, 400);
    }
    const rule: any = sqlite.prepare('SELECT * FROM automation_rules WHERE id = ?').get(ruleId);
    if (!rule) return c.json({ success: false, error: 'Rule not found' }, 404);
    if (!rule.active) return c.json({ success: false, error: 'Rule is inactive' }, 400);
    const triggeredAt = nowMs();
    sqlite.prepare(
      'UPDATE automation_rules SET execution_count = execution_count + 1, last_triggered = ? WHERE id = ?'
    ).run(triggeredAt, ruleId);
    const tc = safeJson(rule.trigger_condition, {});
    // Record event in history
    sqlite.prepare(
      `INSERT INTO automation_events (rule_id, rule_name, trigger_type, status, details, recipient, created_at)
       VALUES (?, ?, ?, 'success', ?, ?, ?)`
    ).run(ruleId, rule.name, tc.type ?? 'manual', details ?? 'Automated action triggered', recipient ?? 'System', triggeredAt);
    const action = safeJson(rule.action, {});
    return c.json({ success: true, message: 'Rule triggered', ruleId, action, triggeredAt });
  });

  // GET /api/webhooks
  app.get('/api/webhooks', (c) => {
    const hooks = sqlite.prepare('SELECT * FROM webhook_configs ORDER BY created_at DESC').all();
    return c.json({ success: true, data: hooks.map(mapWebhook), total: hooks.length });
  });

  // POST /api/webhooks
  app.post('/api/webhooks', async (c) => {
    const body = await c.req.json();
    const parsed = WebhookSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }
    const d = parsed.data;
    const result = sqlite.prepare(
      `INSERT INTO webhook_configs (name, url, events, active, secret, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(d.name, d.url, JSON.stringify(d.events), d.active, d.secret ?? null, nowMs(), nowMs());
    const hook = sqlite.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(result.lastInsertRowid);
    return c.json({ success: true, data: mapWebhook(hook) }, 201);
  });

  // PUT /api/webhooks/:id
  app.put('/api/webhooks/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const existing = sqlite.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(id);
    if (!existing) return c.json({ success: false, error: 'Webhook not found' }, 404);
    const body = await c.req.json();
    const parsed = WebhookSchema.partial().safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
    }
    const d = parsed.data;
    sqlite.prepare(
      `UPDATE webhook_configs SET
        name = COALESCE(?, name),
        url = COALESCE(?, url),
        events = COALESCE(?, events),
        active = COALESCE(?, active),
        secret = COALESCE(?, secret),
        updated_at = ?
       WHERE id = ?`
    ).run(
      d.name ?? null,
      d.url ?? null,
      d.events ? JSON.stringify(d.events) : null,
      d.active ?? null,
      d.secret ?? null,
      nowMs(),
      id
    );
    const hook = sqlite.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(id);
    return c.json({ success: true, data: mapWebhook(hook) });
  });

  // DELETE /api/webhooks/:id
  app.delete('/api/webhooks/:id', (c) => {
    const id = Number(c.req.param('id'));
    const existing = sqlite.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(id);
    if (!existing) return c.json({ success: false, error: 'Webhook not found' }, 404);
    sqlite.prepare('DELETE FROM webhook_configs WHERE id = ?').run(id);
    return c.json({ success: true, message: 'Webhook deleted' });
  });
}
