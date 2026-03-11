import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }

function mapTemplate(row: any) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    status: row.status as 'active' | 'paused',
    subject: row.subject,
    description: row.description,
    iconName: row.icon_name,
    color: row.color,
    openRate: row.open_rate,
    clickRate: row.click_rate,
    sentCount: row.sent_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkflow(row: any) {
  return {
    id: row.id,
    name: row.name,
    triggerEvent: row.trigger_event,
    emailsCount: row.emails_count,
    status: row.status as 'active' | 'testing' | 'paused',
    deliveryRate: row.delivery_rate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCampaign(row: any) {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    audienceSegment: row.audience_segment,
    body: row.body,
    status: row.status as 'draft' | 'sent' | 'scheduled',
    sentAt: row.sent_at ?? null,
    recipientCount: row.recipient_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const UpdateTemplateSchema = z.object({
  status: z.enum(['active', 'paused']).optional(),
  openRate: z.number().min(0).max(100).optional(),
  clickRate: z.number().min(0).max(100).optional(),
  sentCount: z.number().int().min(0).optional(),
});

const UpdateWorkflowSchema = z.object({
  status: z.enum(['active', 'testing', 'paused']).optional(),
  deliveryRate: z.number().min(0).max(100).optional(),
  emailsCount: z.number().int().min(1).optional(),
});

const CreateCampaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  audienceSegment: z.string().optional().default('All Users'),
  body: z.string().optional().default(''),
  status: z.enum(['draft', 'sent', 'scheduled']).optional().default('draft'),
  recipientCount: z.number().int().min(0).optional().default(0),
});

export function emailNotificationRoutes(app: Hono) {

  // GET /api/email-notifications/stats
  app.get('/api/email-notifications/stats', (c) => {
    const db = getDb();
    try {
      const totalSent = (db.prepare('SELECT COALESCE(SUM(sent_count), 0) as n FROM email_templates').get() as any).n as number;
      const avgOpen = (db.prepare('SELECT ROUND(AVG(open_rate), 1) as v FROM email_templates').get() as any).v as number;
      const avgClick = (db.prepare('SELECT ROUND(AVG(click_rate), 1) as v FROM email_templates').get() as any).v as number;
      const avgDelivery = (db.prepare('SELECT ROUND(AVG(delivery_rate), 1) as v FROM automation_workflows').get() as any).v as number;
      const activeWorkflows = (db.prepare("SELECT COUNT(*) as n FROM automation_workflows WHERE status = 'active'").get() as any).n as number;
      // Subscriber count = sent_count of welcome email (users who received it = subscriber base)
      const welcomeRow = db.prepare("SELECT sent_count FROM email_templates WHERE name = 'Welcome Email' LIMIT 1").get() as any;
      const subscriberCount = welcomeRow ? (welcomeRow.sent_count as number) : 0;

      return c.json({
        success: true,
        data: {
          sentCount30d: totalSent,
          avgOpenRate: `${avgOpen ?? 0}%`,
          avgClickRate: `${avgClick ?? 0}%`,
          deliveryRate: `${avgDelivery ?? 99.0}%`,
          activeWorkflows,
          subscriberCount,
        },
      });
    } catch (err) {
      return c.json({ success: false, error: 'Failed to fetch stats' }, 500);
    } finally {
      db.close();
    }
  });

  // GET /api/email-notifications/templates
  app.get('/api/email-notifications/templates', (c) => {
    const db = getDb();
    try {
      const category = c.req.query('category');
      let rows: any[];
      if (category && category !== 'All') {
        rows = db.prepare('SELECT * FROM email_templates WHERE category = ? ORDER BY id ASC').all(category);
      } else {
        rows = db.prepare('SELECT * FROM email_templates ORDER BY id ASC').all();
      }
      return c.json({ success: true, data: rows.map(mapTemplate) });
    } catch (err) {
      return c.json({ success: false, error: 'Failed to fetch templates' }, 500);
    } finally {
      db.close();
    }
  });

  // PUT /api/email-notifications/templates/:id
  app.put('/api/email-notifications/templates/:id', async (c) => {
    const db = getDb();
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid id' }, 400);

      const existing = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Template not found' }, 404);

      const body = await c.req.json();
      const parsed = UpdateTemplateSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.issues }, 400);

      const d = parsed.data;
      const now = Date.now();
      db.prepare(`
        UPDATE email_templates SET
          status = ?, open_rate = ?, click_rate = ?, sent_count = ?, updated_at = ?
        WHERE id = ?
      `).run(
        d.status      ?? existing.status,
        d.openRate    ?? existing.open_rate,
        d.clickRate   ?? existing.click_rate,
        d.sentCount   ?? existing.sent_count,
        now,
        id,
      );
      const updated = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(id);
      return c.json({ success: true, data: mapTemplate(updated) });
    } catch (err) {
      return c.json({ success: false, error: 'Failed to update template' }, 500);
    } finally {
      db.close();
    }
  });

  // GET /api/email-notifications/workflows
  app.get('/api/email-notifications/workflows', (c) => {
    const db = getDb();
    try {
      const rows = db.prepare('SELECT * FROM automation_workflows ORDER BY id ASC').all();
      return c.json({ success: true, data: rows.map(mapWorkflow) });
    } catch (err) {
      return c.json({ success: false, error: 'Failed to fetch workflows' }, 500);
    } finally {
      db.close();
    }
  });

  // PUT /api/email-notifications/workflows/:id
  app.put('/api/email-notifications/workflows/:id', async (c) => {
    const db = getDb();
    try {
      const id = parseInt(c.req.param('id'), 10);
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid id' }, 400);

      const existing = db.prepare('SELECT * FROM automation_workflows WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Workflow not found' }, 404);

      const body = await c.req.json();
      const parsed = UpdateWorkflowSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.issues }, 400);

      const d = parsed.data;
      const now = Date.now();
      db.prepare(`
        UPDATE automation_workflows SET
          status = ?, delivery_rate = ?, emails_count = ?, updated_at = ?
        WHERE id = ?
      `).run(
        d.status       ?? existing.status,
        d.deliveryRate ?? existing.delivery_rate,
        d.emailsCount  ?? existing.emails_count,
        now,
        id,
      );
      const updated = db.prepare('SELECT * FROM automation_workflows WHERE id = ?').get(id);
      return c.json({ success: true, data: mapWorkflow(updated) });
    } catch (err) {
      return c.json({ success: false, error: 'Failed to update workflow' }, 500);
    } finally {
      db.close();
    }
  });

  // POST /api/email-notifications/campaigns
  app.post('/api/email-notifications/campaigns', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateCampaignSchema.safeParse(body);
      if (!parsed.success) return c.json({ success: false, error: parsed.error.issues }, 400);

      const d = parsed.data;
      const now = Date.now();
      const sentAt = d.status === 'sent' ? now : null;
      const result = db.prepare(`
        INSERT INTO email_campaigns (name, subject, audience_segment, body, status, sent_at, recipient_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(d.name, d.subject, d.audienceSegment, d.body, d.status, sentAt, d.recipientCount, now, now);

      const created = db.prepare('SELECT * FROM email_campaigns WHERE id = ?').get(Number(result.lastInsertRowid));
      return c.json({ success: true, data: mapCampaign(created) }, 201);
    } catch (err) {
      return c.json({ success: false, error: 'Failed to create campaign' }, 500);
    } finally {
      db.close();
    }
  });

  // GET /api/email-notifications/campaigns
  app.get('/api/email-notifications/campaigns', (c) => {
    const db = getDb();
    try {
      const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10) || 50, 200);
      const rows = db.prepare('SELECT * FROM email_campaigns ORDER BY created_at DESC LIMIT ?').all(limit);
      return c.json({ success: true, data: rows.map(mapCampaign) });
    } catch (err) {
      return c.json({ success: false, error: 'Failed to fetch campaigns' }, 500);
    } finally {
      db.close();
    }
  });
}
