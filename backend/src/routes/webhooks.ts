/**
 * Webhooks CRUD routes
 * Table: webhook_configs
 */

import { Hono } from "hono";
import { z } from "zod";
import { getSharedDb } from "../db";
import { createLogger } from "../services/logger";

const logger = createLogger("Webhooks");

const CreateWebhookSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  events: z.array(z.string().min(1)).min(1),
  active: z.union([z.boolean(), z.number()]).optional().default(1),
  secret: z.string().optional(),
});

function rowToRecord(r: any) {
  return {
    id: r.id,
    name: r.name,
    url: r.url,
    events: r.events ? JSON.parse(r.events) : [],
    active: Boolean(r.active),
    secret: r.secret ?? null,
    lastDelivery: r.last_delivery ?? null,
    failureCount: r.failure_count ?? 0,
    createdAt: r.created_at ?? null,
    updatedAt: r.updated_at ?? null,
  };
}

export function webhooksRoutes(app: Hono) {
  const db = getSharedDb();

  /** GET /api/webhooks — list all webhooks */
  app.get('/api/webhooks', (c) => {
    try {
      const rows = db.prepare(
        'SELECT * FROM webhook_configs ORDER BY created_at DESC'
      ).all();
      return c.json(rows.map(rowToRecord));
    } catch (error) {
      logger.error('Failed to list webhooks', error);
      return c.json({ success: false, error: 'Failed to fetch webhooks' }, 500);
    }
  });

  /** POST /api/webhooks — create a webhook */
  app.post('/api/webhooks', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateWebhookSchema.parse(body);

      const result = db.prepare(`
        INSERT INTO webhook_configs (name, url, events, active, secret)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        v.name,
        v.url,
        JSON.stringify(v.events),
        typeof v.active === 'boolean' ? (v.active ? 1 : 0) : Number(v.active),
        v.secret ?? null,
      );

      const row = db.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(result.lastInsertRowid);
      logger.info('Webhook created', { id: result.lastInsertRowid, name: v.name });
      return c.json(rowToRecord(row), 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Failed to create webhook', error);
      return c.json({ success: false, error: 'Failed to create webhook' }, 500);
    }
  });

  /** PUT /api/webhooks/:id — update a webhook */
  app.put('/api/webhooks/:id', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      const body = await c.req.json();

      const existing = db.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(id);
      if (!existing) {
        return c.json({ success: false, error: 'Webhook not found' }, 404);
      }

      const v = CreateWebhookSchema.partial().parse(body);
      const now = Date.now();

      db.prepare(`
        UPDATE webhook_configs
        SET name = COALESCE(?, name),
            url = COALESCE(?, url),
            events = COALESCE(?, events),
            active = COALESCE(?, active),
            secret = COALESCE(?, secret),
            updated_at = ?
        WHERE id = ?
      `).run(
        v.name ?? null,
        v.url ?? null,
        v.events ? JSON.stringify(v.events) : null,
        v.active !== undefined
          ? (typeof v.active === 'boolean' ? (v.active ? 1 : 0) : Number(v.active))
          : null,
        v.secret ?? null,
        now,
        id,
      );

      const updated = db.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(id);
      logger.info('Webhook updated', { id });
      return c.json(rowToRecord(updated));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Failed to update webhook', error);
      return c.json({ success: false, error: 'Failed to update webhook' }, 500);
    }
  });

  /** DELETE /api/webhooks/:id — delete a webhook */
  app.delete('/api/webhooks/:id', (c) => {
    try {
      const id = Number(c.req.param('id'));
      const result = db.prepare('DELETE FROM webhook_configs WHERE id = ?').run(id);
      if (result.changes === 0) {
        return c.json({ success: false, error: 'Webhook not found' }, 404);
      }
      logger.info('Webhook deleted', { id });
      return c.json({ message: 'Webhook deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete webhook', error);
      return c.json({ success: false, error: 'Failed to delete webhook' }, 500);
    }
  });
}
