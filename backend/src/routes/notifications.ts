import { Hono } from "hono";
import Database from 'better-sqlite3';
import { z } from 'zod';
import type { Client } from "@sdk/server-types";
import { tables } from "@generated";
import { createLogger } from "../services/logger";

const sqlite = new Database('local.sqlite');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = OFF');

const logger = createLogger("Notifications");

// ============================================
// Email Validation Utilities
// ============================================

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  // RFC 5322 simplified regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate email list
 */
function isValidEmailList(emails: string | string[]): { valid: boolean; emails: string[]; error?: string } {
  if (!emails) {
    return { valid: false, emails: [], error: "Email list is required" };
  }

  const emailArray = Array.isArray(emails) ? emails : [emails];

  if (emailArray.length === 0) {
    return { valid: false, emails: [], error: "At least one email is required" };
  }

  const invalidEmails = emailArray.filter(e => !isValidEmail(e));
  if (invalidEmails.length > 0) {
    return { 
      valid: false, 
      emails: emailArray, 
      error: `Invalid email format: ${invalidEmails.join(', ')}` 
    };
  }

  return { valid: true, emails: emailArray };
}

/**
 * Validate subject line
 */
function isValidSubject(subject: string): { valid: boolean; error?: string } {
  if (!subject || typeof subject !== 'string') {
    return { valid: false, error: "Subject is required" };
  }

  const trimmed = subject.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: "Subject must be at least 3 characters" };
  }

  if (trimmed.length > 255) {
    return { valid: false, error: "Subject must not exceed 255 characters" };
  }

  return { valid: true };
}

/**
 * Validate email body/HTML
 */
function isValidBody(body: any): { valid: boolean; html: string; error?: string } {
  if (!body) {
    return { valid: false, html: '', error: "Email body is required" };
  }

  // Accept either htmlBody or plain text body
  const content = body;
  
  if (typeof content !== 'string') {
    return { valid: false, html: '', error: "Email body must be a string" };
  }

  const trimmed = content.trim();
  if (trimmed.length < 5) {
    return { valid: false, html: '', error: "Email body must be at least 5 characters" };
  }

  if (trimmed.length > 50000) {
    return { valid: false, html: '', error: "Email body must not exceed 50000 characters" };
  }

  return { valid: true, html: trimmed };
}

export function notificationRoutes(app: Hono, edgespark: Client<typeof tables>) {
  /**
   * POST /api/public/notifications/send-email
   * Sends an email notification using Resend API.
   * With strict validation and comprehensive error handling.
   */
  app.post('/api/public/notifications/send-email', async (c) => {
    let requestData: any = {};
    
    try {
      requestData = await c.req.json();
      const { to, subject, htmlBody, body } = requestData;

      logger.debug('Email send request', { to: Array.isArray(to) ? to.length + ' recipients' : '1 recipient', subject: subject?.substring(0, 30) });

      // ============================================
      // Step 1: Validate email recipients
      // ============================================
      const emailValidation = isValidEmailList(to);
      if (!emailValidation.valid) {
        logger.warn('Email validation failed', { error: emailValidation.error });
        return c.json({
          success: false,
          error: 'Invalid email recipient',
          message: emailValidation.error,
          status: 'validation_error'
        }, 400);
      }

      // ============================================
      // Step 2: Validate subject
      // ============================================
      const subjectValidation = isValidSubject(subject);
      if (!subjectValidation.valid) {
        logger.warn('Subject validation failed', { error: subjectValidation.error });
        return c.json({
          success: false,
          error: 'Invalid subject',
          message: subjectValidation.error,
          status: 'validation_error'
        }, 400);
      }

      // ============================================
      // Step 3: Validate body content
      // ============================================
      const bodyValidation = isValidBody(htmlBody || body);
      if (!bodyValidation.valid) {
        logger.warn('Body validation failed', { error: bodyValidation.error });
        return c.json({
          success: false,
          error: 'Invalid email body',
          message: bodyValidation.error,
          status: 'validation_error'
        }, 400);
      }

      // ============================================
      // Step 4: Check Resend API configuration
      // ============================================
      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) {
        logger.warn('Resend API key not configured, using mock response');
        return c.json({
          success: false,
          message: 'Email service not configured. Configure RESEND_API_KEY to enable.',
          status: 'service_unavailable',
          recipients: emailValidation.emails
        });
      }

      // ============================================
      // Step 5: Send email via Resend API
      // ============================================
      logger.info('Sending email via Resend API', { 
        recipients: emailValidation.emails.length,
        subject: subject.substring(0, 40),
        apiConfigured: !!resendKey
      });

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SafetyMEG <notifications@safetymeg.app>",
          to: emailValidation.emails,
          subject: subject.trim(),
          html: bodyValidation.html,
        }),
      });

      // ============================================
      // Step 6: Handle Resend API response
      // ============================================
      if (emailRes.ok) {
        const responseData = await emailRes.json() as { id?: string };
        logger.info('Email sent successfully', { 
          resendId: responseData.id,
          recipients: emailValidation.emails.length 
        });

        return c.json({
          success: true,
          message: 'Email sent successfully',
          resendId: responseData.id,
          recipients: emailValidation.emails.length,
          status: 'success'
        });
      } else {
        const errorData = await emailRes.text();
        logger.error('Resend API error', new Error(`HTTP ${emailRes.status}`), {
          statusCode: emailRes.status,
          errorData: errorData.substring(0, 200),
          recipients: emailValidation.emails.length
        });

        return c.json({
          success: false,
          error: 'Email service failed',
          message: `Email service returned error: ${emailRes.status}`,
          status: 'send_error'
        }, 500);
      }

    } catch (error) {
      logger.error('Email send request failed', error, { 
        subject: requestData.subject?.substring(0, 30),
        recipients: requestData.to ? (Array.isArray(requestData.to) ? requestData.to.length : 1) : 0
      });

      return c.json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error'
      }, 500);
    }
  });

  // ── NOTIFICATION SCHEMAS ───────────────────────────────────────────────

  const CreateNotifSchema = z.object({
    userId: z.string().optional(),
    type: z.enum(['incident', 'training', 'audit', 'inspection', 'capa', 'system', 'broadcast']),
    title: z.string().min(1).max(300),
    message: z.string().min(1).max(2000),
    severity: z.enum(['info', 'warning', 'critical', 'success']).default('info'),
    actionUrl: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  });

  const PreferencesSchema = z.object({
    userId: z.string().min(1),
    emailNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    inAppNotifications: z.boolean().optional(),
    preferences: z.record(z.string(), z.boolean()).optional(),
    quietHours: z.object({ start: z.string(), end: z.string() }).optional(),
    frequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
  });

  const BroadcastSchema = z.object({
    type: z.enum(['incident', 'training', 'audit', 'inspection', 'capa', 'system', 'broadcast']).default('broadcast'),
    title: z.string().min(1).max(300),
    message: z.string().min(1).max(2000),
    severity: z.enum(['info', 'warning', 'critical', 'success']).default('info'),
    department: z.string().optional(),         // optional: limit to a department
    actionUrl: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  });

  function nowMs() { return Date.now(); }

  function mapNotif(r: any) {
    return {
      id: r.id,
      userId: r.user_id,
      notificationType: r.type,
      title: r.title,
      message: r.message,
      severity: r.severity,
      isRead: Boolean(r.read_status),
      actionUrl: r.action_url,
      metadata: safeJson(r.metadata, null),
      createdAt: r.created_at,
    };
  }

  function safeJson(val: any, fallback: any) {
    if (!val) return fallback;
    try { return JSON.parse(val); } catch { return fallback; }
  }

  // ── NOTIFICATION SYSTEM ENDPOINTS ──────────────────────────────────────

  /**
   * GET /api/notifications
   * List notifications with optional filters
   */
  app.get('/api/notifications', (c) => {
    try {
      const userId = c.req.query('userId');
      const type = c.req.query('type');
      const severity = c.req.query('severity');
      const read = c.req.query('read');           // 'true' | 'false'
      const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10) || 50, 200);

      let query = 'SELECT * FROM notifications WHERE 1=1';
      const params: any[] = [];
      if (userId) { query += ' AND (user_id = ? OR user_id IS NULL)'; params.push(userId); }
      if (type) { query += ' AND type = ?'; params.push(type); }
      if (severity) { query += ' AND severity = ?'; params.push(severity); }
      if (read === 'false') { query += ' AND read_status = 0'; }
      if (read === 'true') { query += ' AND read_status = 1'; }
      query += ' ORDER BY created_at DESC LIMIT ?'; params.push(limit);

      const rows = sqlite.prepare(query).all(...params) as any[];
      const data = rows.map(mapNotif);
      const unreadCount = data.filter(n => !n.isRead).length;

      return c.json({ success: true, data, count: data.length, unreadCount }, 200);
    } catch (error) {
      logger.error('Error listing notifications', error);
      return c.json({ success: false, error: 'Failed to fetch notifications' }, 500);
    }
  });

  /**
   * GET /api/notifications/alerts
   * Active (unread) high-severity alerts
   * STATIC — must be before /:id
   */
  app.get('/api/notifications/alerts', (c) => {
    try {
      const userId = c.req.query('userId');
      const severity = c.req.query('severity') ?? 'warning';  // default: warning+critical

      let query = `SELECT * FROM notifications WHERE read_status = 0`;
      const params: any[] = [];
      if (severity === 'critical') {
        query += ' AND severity = ?'; params.push('critical');
      } else {
        query += " AND severity IN ('warning', 'critical')";
      }
      if (userId) { query += ' AND (user_id = ? OR user_id IS NULL)'; params.push(userId); }
      query += ' ORDER BY created_at DESC LIMIT 50';

      const rows = sqlite.prepare(query).all(...params) as any[];
      const data = rows.map(mapNotif);

      return c.json({ success: true, data, count: data.length, criticalCount: data.filter(n => n.severity === 'critical').length }, 200);
    } catch (error) {
      logger.error('Error fetching alerts', error);
      return c.json({ success: false, error: 'Failed to fetch alerts' }, 500);
    }
  });

  /**
   * GET /api/notifications/settings
   * Get notification settings/preferences for a user
   * STATIC — must be before /:id
   */
  app.get('/api/notifications/settings', (c) => {
    try {
      const userId = c.req.query('userId') ?? 'default';

      const prefs = sqlite.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(userId) as any;
      const templates = sqlite.prepare('SELECT * FROM notification_templates WHERE is_active = 1 ORDER BY type ASC').all() as any[];

      return c.json({
        success: true,
        data: {
          preferences: prefs ? {
            userId: prefs.user_id,
            emailNotifications: Boolean(prefs.email_notifications),
            smsNotifications: Boolean(prefs.sms_notifications),
            inAppNotifications: Boolean(prefs.in_app_notifications),
            preferences: safeJson(prefs.preferences, {}),
            quietHours: safeJson(prefs.quiet_hours, null),
            frequency: prefs.frequency,
            updatedAt: prefs.updated_at,
          } : null,
          templates: templates.map((t: any) => ({
            id: t.id, type: t.type, subject: t.subject,
            template: safeJson(t.template, {}), variables: safeJson(t.variables, []),
          })),
        }
      }, 200);
    } catch (error) {
      logger.error('Error fetching settings', error);
      return c.json({ success: false, error: 'Failed to fetch notification settings' }, 500);
    }
  });

  /**
   * PUT /api/notifications/settings
   * Update notification settings  
   * STATIC — must be before /:id
   */
  app.put('/api/notifications/settings', async (c) => {
    try {
      const body = await c.req.json();
      const v = PreferencesSchema.parse(body);

      const existing = sqlite.prepare('SELECT id FROM notification_preferences WHERE user_id = ?').get(v.userId);
      if (existing) {
        const fields: string[] = ['updated_at = ?'];
        const params: any[] = [nowMs()];
        if (v.emailNotifications !== undefined) { fields.push('email_notifications = ?'); params.push(v.emailNotifications ? 1 : 0); }
        if (v.smsNotifications !== undefined) { fields.push('sms_notifications = ?'); params.push(v.smsNotifications ? 1 : 0); }
        if (v.inAppNotifications !== undefined) { fields.push('in_app_notifications = ?'); params.push(v.inAppNotifications ? 1 : 0); }
        if (v.preferences !== undefined) { fields.push('preferences = ?'); params.push(JSON.stringify(v.preferences)); }
        if (v.quietHours !== undefined) { fields.push('quiet_hours = ?'); params.push(JSON.stringify(v.quietHours)); }
        if (v.frequency !== undefined) { fields.push('frequency = ?'); params.push(v.frequency); }
        params.push(v.userId);
        sqlite.prepare(`UPDATE notification_preferences SET ${fields.join(', ')} WHERE user_id = ?`).run(...params);
      } else {
        sqlite.prepare(`
          INSERT INTO notification_preferences (user_id, email_notifications, sms_notifications, in_app_notifications, preferences, quiet_hours, frequency, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          v.userId,
          v.emailNotifications !== undefined ? (v.emailNotifications ? 1 : 0) : 1,
          v.smsNotifications !== undefined ? (v.smsNotifications ? 1 : 0) : 0,
          v.inAppNotifications !== undefined ? (v.inAppNotifications ? 1 : 0) : 1,
          v.preferences ? JSON.stringify(v.preferences) : null,
          v.quietHours ? JSON.stringify(v.quietHours) : null,
          v.frequency ?? 'immediate',
          nowMs()
        );
      }

      const updated = sqlite.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(v.userId) as any;
      return c.json({ success: true, message: 'Settings updated', data: { userId: updated.user_id, frequency: updated.frequency } }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error updating settings', error);
      return c.json({ success: false, error: 'Failed to update notification settings' }, 500);
    }
  });

  /**
   * POST /api/notifications/preferences
   * Upsert preferences (alternate route per spec — same as PUT /settings)
   * STATIC — must be before /:id
   */
  app.post('/api/notifications/preferences', async (c) => {
    try {
      const body = await c.req.json();
      const v = PreferencesSchema.parse(body);

      const existing = sqlite.prepare('SELECT id FROM notification_preferences WHERE user_id = ?').get(v.userId);
      if (existing) {
        const fields: string[] = ['updated_at = ?'];
        const params: any[] = [nowMs()];
        if (v.emailNotifications !== undefined) { fields.push('email_notifications = ?'); params.push(v.emailNotifications ? 1 : 0); }
        if (v.smsNotifications !== undefined) { fields.push('sms_notifications = ?'); params.push(v.smsNotifications ? 1 : 0); }
        if (v.inAppNotifications !== undefined) { fields.push('in_app_notifications = ?'); params.push(v.inAppNotifications ? 1 : 0); }
        if (v.preferences !== undefined) { fields.push('preferences = ?'); params.push(JSON.stringify(v.preferences)); }
        if (v.quietHours !== undefined) { fields.push('quiet_hours = ?'); params.push(JSON.stringify(v.quietHours)); }
        if (v.frequency !== undefined) { fields.push('frequency = ?'); params.push(v.frequency); }
        params.push(v.userId);
        sqlite.prepare(`UPDATE notification_preferences SET ${fields.join(', ')} WHERE user_id = ?`).run(...params);
      } else {
        sqlite.prepare(`
          INSERT INTO notification_preferences (user_id, email_notifications, sms_notifications, in_app_notifications, preferences, quiet_hours, frequency, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          v.userId,
          v.emailNotifications !== undefined ? (v.emailNotifications ? 1 : 0) : 1,
          v.smsNotifications !== undefined ? (v.smsNotifications ? 1 : 0) : 0,
          v.inAppNotifications !== undefined ? (v.inAppNotifications ? 1 : 0) : 1,
          v.preferences ? JSON.stringify(v.preferences) : null,
          v.quietHours ? JSON.stringify(v.quietHours) : null,
          v.frequency ?? 'immediate',
          nowMs()
        );
      }

      const updated = sqlite.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(v.userId) as any;
      return c.json({ success: true, message: 'Preferences saved', data: { userId: updated.user_id, frequency: updated.frequency, emailNotifications: Boolean(updated.email_notifications), inAppNotifications: Boolean(updated.in_app_notifications) } }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error saving preferences', error);
      return c.json({ success: false, error: 'Failed to save preferences' }, 500);
    }
  });

  /**
   * POST /api/notifications/mark-read
   * Mark one or many notifications as read
   * STATIC — must be before /:id
   */
  app.post('/api/notifications/mark-read', async (c) => {
    try {
      const body = await c.req.json();
      const ids: number[] = body.ids ?? (body.id ? [body.id] : []);
      const userId: string | undefined = body.userId;
      const markAll: boolean = body.all === true;

      if (markAll) {
        let q = 'UPDATE notifications SET read_status = 1 WHERE read_status = 0';
        const params: any[] = [];
        if (userId) { q += ' AND (user_id = ? OR user_id IS NULL)'; params.push(userId); }
        const result = sqlite.prepare(q).run(...params);
        return c.json({ success: true, message: `Marked ${result.changes} notifications as read`, updated: result.changes }, 200);
      }

      if (!ids.length) return c.json({ success: false, error: 'Provide ids array or all=true' }, 400);
      const placeholders = ids.map(() => '?').join(',');
      const result = sqlite.prepare(`UPDATE notifications SET read_status = 1 WHERE id IN (${placeholders})`).run(...ids);
      return c.json({ success: true, message: `Marked ${result.changes} notifications as read`, updated: result.changes }, 200);
    } catch (error) {
      logger.error('Error marking read', error);
      return c.json({ success: false, error: 'Failed to mark notifications as read' }, 500);
    }
  });

  /**
   * POST /api/notifications/broadcast
   * Create a notification for all users (or a department)
   * STATIC — must be before /:id
   */
  app.post('/api/notifications/broadcast', async (c) => {
    try {
      const body = await c.req.json();
      const v = BroadcastSchema.parse(body);

      // If department specified, look up workers in that department to get user IDs
      let userIds: (string | null)[] = [null]; // null = broadcast to all
      if (v.department) {
        const workers = sqlite.prepare('SELECT id FROM workers WHERE department = ? AND status = ?').all(v.department, 'active') as any[];
        if (workers.length > 0) {
          userIds = workers.map((w: any) => String(w.id));
        }
      }

      const stmt = sqlite.prepare(`
        INSERT INTO notifications (user_id, type, title, message, severity, action_url, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const ts = nowMs();
      const meta = v.metadata ? JSON.stringify(v.metadata) : null;

      sqlite.transaction(() => {
        for (const uid of userIds) {
          stmt.run(uid, v.type, v.title, v.message, v.severity, v.actionUrl ?? null, meta, ts);
        }
      })();

      logger.info('Broadcast sent', { type: v.type, recipients: userIds.length, department: v.department ?? 'all' });
      return c.json({ success: true, message: 'Broadcast sent', data: { recipientCount: userIds.length, department: v.department ?? 'all' } }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error broadcasting', error);
      return c.json({ success: false, error: 'Failed to send broadcast' }, 500);
    }
  });

  /**
   * DELETE /api/notifications/:id
   * Delete a notification
   */
  app.delete('/api/notifications/:id', (c) => {
    try {
      const id = parseInt(c.req.param('id'), 10);
      const existing = sqlite.prepare('SELECT id FROM notifications WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Notification not found' }, 404);
      sqlite.prepare('DELETE FROM notifications WHERE id = ?').run(id);
      return c.json({ success: true, message: 'Notification deleted' }, 200);
    } catch (error) {
      logger.error('Error deleting notification', error);
      return c.json({ success: false, error: 'Failed to delete notification' }, 500);
    }
  });
}
