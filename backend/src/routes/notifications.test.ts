/**
 * Notifications Route Test Suite
 *
 * Covers:
 *   GET    /api/notifications                      — list, filters (type/severity/read/limit/userId)
 *   GET    /api/notifications/alerts               — unread high-severity alerts
 *   GET    /api/notifications/settings             — preferences + templates
 *   PUT    /api/notifications/settings             — update preferences (upsert)
 *   POST   /api/notifications/preferences          — upsert preferences (alt route)
 *   POST   /api/notifications/mark-read            — mark by ids, mark all
 *   POST   /api/notifications/broadcast            — create broadcast to all / department
 *   DELETE /api/notifications/:id                  — delete existing, 404 for missing
 *
 * Field name expectations (mapNotif):
 *   notificationType  (not "type")
 *   isRead            (not "read")
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { notificationRoutes } from '../routes/notifications';

// ── App factory ────────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  // edgespark is not used inside any notification handler — pass null safely
  notificationRoutes(app, null as any);
  return app;
}

// ── Request helper ─────────────────────────────────────────────────────────────

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── DB seed helpers ────────────────────────────────────────────────────────────

const sqlite = new Database('local.sqlite');
const TAG = `notif-test-${Date.now()}`;

// Seed a single notification and return its id
function seedNotif(overrides: {
  userId?: string;
  type?: string;
  title?: string;
  message?: string;
  severity?: string;
  readStatus?: number;
}): number {
  const r = sqlite.prepare(`
    INSERT INTO notifications (user_id, type, title, message, severity, read_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.userId ?? null,
    overrides.type ?? 'incident',
    overrides.title ?? `${TAG} Test Notification`,
    overrides.message ?? 'Test notification message',
    overrides.severity ?? 'info',
    overrides.readStatus ?? 0,
    Date.now(),
  );
  return r.lastInsertRowid as number;
}

afterAll(() => {
  // Remove seeded test notifications
  sqlite.prepare(`DELETE FROM notifications WHERE title LIKE ?`).run(`${TAG}%`);
  // Remove seeded test notifications created via broadcast
  sqlite.prepare(`DELETE FROM notifications WHERE title LIKE ?`).run(`BRTEST-%`);
  // Remove seeded preferences and templates used in tests
  sqlite.prepare(`DELETE FROM notification_preferences WHERE user_id LIKE ?`).run(`notif-test-user-%`);
  sqlite.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/notifications', () => {
  let app: Hono;
  let notifId: number;
  let criticalId: number;
  let readId: number;
  const userId = `notif-test-user-get-${Date.now()}`;

  beforeAll(() => {
    app = createTestApp();
    notifId  = seedNotif({ userId, type: 'incident', severity: 'warning', readStatus: 0, title: `${TAG} unread incident` });
    criticalId = seedNotif({ userId, type: 'capa', severity: 'critical', readStatus: 0, title: `${TAG} critical capa` });
    readId   = seedNotif({ userId, type: 'training', severity: 'info', readStatus: 1, title: `${TAG} read training` });
  });

  it('returns 200 with success:true and data array', async () => {
    const { status, body } = await req(app, 'GET', '/api/notifications');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('count field matches data array length', async () => {
    const { body } = await req(app, 'GET', '/api/notifications');
    expect(body.count).toBe(body.data.length);
  });

  it('returns unreadCount field', async () => {
    const { body } = await req(app, 'GET', '/api/notifications');
    expect(typeof body.unreadCount).toBe('number');
  });

  it('each notification has notificationType (not type)', async () => {
    const { body } = await req(app, 'GET', `/api/notifications?userId=${userId}`);
    const notif = body.data.find((n: any) => n.id === notifId);
    expect(notif).toBeDefined();
    expect(notif).toHaveProperty('notificationType');
    expect(notif).not.toHaveProperty('type');
  });

  it('each notification has isRead (not read)', async () => {
    const { body } = await req(app, 'GET', `/api/notifications?userId=${userId}`);
    const notif = body.data.find((n: any) => n.id === notifId);
    expect(notif).toHaveProperty('isRead');
    expect(notif).not.toHaveProperty('read');
  });

  it('each notification has all required camelCase fields', async () => {
    const { body } = await req(app, 'GET', `/api/notifications?userId=${userId}`);
    const n = body.data.find((n: any) => n.id === notifId);
    expect(n).toHaveProperty('id');
    expect(n).toHaveProperty('notificationType');
    expect(n).toHaveProperty('isRead');
    expect(n).toHaveProperty('title');
    expect(n).toHaveProperty('message');
    expect(n).toHaveProperty('severity');
    expect(n).toHaveProperty('createdAt');
  });

  it('isRead is false for an unread notification', async () => {
    const { body } = await req(app, 'GET', `/api/notifications?userId=${userId}`);
    const notif = body.data.find((n: any) => n.id === notifId);
    expect(notif.isRead).toBe(false);
  });

  it('isRead is true for a read notification', async () => {
    const { body } = await req(app, 'GET', `/api/notifications?userId=${userId}`);
    const notif = body.data.find((n: any) => n.id === readId);
    expect(notif.isRead).toBe(true);
  });

  it('notificationType is correct string value', async () => {
    const { body } = await req(app, 'GET', `/api/notifications?userId=${userId}`);
    const notif = body.data.find((n: any) => n.id === notifId);
    expect(notif.notificationType).toBe('incident');
  });

  it('filters by type query param', async () => {
    const { body } = await req(app, 'GET', `/api/notifications?userId=${userId}&type=training`);
    expect(body.data.every((n: any) => n.notificationType === 'training')).toBe(true);
  });

  it('filters by severity query param', async () => {
    const { body } = await req(app, 'GET', `/api/notifications?userId=${userId}&severity=critical`);
    expect(body.data.every((n: any) => n.severity === 'critical')).toBe(true);
  });

  it('filters by read=false returns only unread', async () => {
    const { body } = await req(app, 'GET', `/api/notifications?userId=${userId}&read=false`);
    expect(body.data.every((n: any) => n.isRead === false)).toBe(true);
  });

  it('filters by read=true returns only read', async () => {
    const { body } = await req(app, 'GET', `/api/notifications?userId=${userId}&read=true`);
    expect(body.data.every((n: any) => n.isRead === true)).toBe(true);
  });

  it('respects limit query param', async () => {
    // Seed extra notifications
    for (let i = 0; i < 5; i++) seedNotif({ userId, title: `${TAG} limit-test-${i}` });
    const { body } = await req(app, 'GET', `/api/notifications?userId=${userId}&limit=2`);
    expect(body.data.length).toBeLessThanOrEqual(2);
  });

  it('returns sorted newest-first (createdAt DESC)', async () => {
    const { body } = await req(app, 'GET', `/api/notifications?userId=${userId}`);
    const times = body.data.map((n: any) => n.createdAt);
    for (let i = 0; i < times.length - 1; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i + 1]);
    }
  });

  it('filters by userId returns only that user\'s notifications', async () => {
    const anotherUser = `notif-test-user-other-${Date.now()}`;
    seedNotif({ userId: anotherUser, title: `${TAG} other user` });
    const { body } = await req(app, 'GET', `/api/notifications?userId=${userId}`);
    expect(body.data.every((n: any) => n.userId === userId || n.userId === null)).toBe(true);
    const anotherNotifs = body.data.filter((n: any) => n.userId === anotherUser);
    expect(anotherNotifs.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications/alerts
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/notifications/alerts', () => {
  let app: Hono;
  const userId = `notif-test-user-alerts-${Date.now()}`;

  beforeAll(() => {
    app = createTestApp();
    seedNotif({ userId, severity: 'critical', readStatus: 0, type: 'incident', title: `${TAG} alert-critical` });
    seedNotif({ userId, severity: 'warning', readStatus: 0, type: 'capa', title: `${TAG} alert-warning` });
    seedNotif({ userId, severity: 'info', readStatus: 0, type: 'system', title: `${TAG} alert-info` });
    seedNotif({ userId, severity: 'critical', readStatus: 1, type: 'training', title: `${TAG} alert-critical-read` });
  });

  it('returns 200 with success:true', async () => {
    const { status, body } = await req(app, 'GET', `/api/notifications/alerts?userId=${userId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('only returns unread alerts', async () => {
    const { body } = await req(app, 'GET', `/api/notifications/alerts?userId=${userId}`);
    expect(body.data.every((n: any) => n.isRead === false)).toBe(true);
  });

  it('includes warning and critical severities by default', async () => {
    const { body } = await req(app, 'GET', `/api/notifications/alerts?userId=${userId}`);
    const severities = new Set(body.data.map((n: any) => n.severity));
    expect(severities.has('warning') || severities.has('critical')).toBe(true);
  });

  it('does not include info severity', async () => {
    const { body } = await req(app, 'GET', `/api/notifications/alerts?userId=${userId}`);
    expect(body.data.every((n: any) => n.severity !== 'info')).toBe(true);
  });

  it('severity=critical filter returns only critical', async () => {
    const { body } = await req(app, 'GET', `/api/notifications/alerts?userId=${userId}&severity=critical`);
    expect(body.data.every((n: any) => n.severity === 'critical')).toBe(true);
  });

  it('criticalCount field is correct', async () => {
    const { body } = await req(app, 'GET', `/api/notifications/alerts?userId=${userId}`);
    const manualCount = body.data.filter((n: any) => n.severity === 'critical').length;
    expect(body.criticalCount).toBe(manualCount);
  });

  it('response notifications have notificationType field (not type)', async () => {
    const { body } = await req(app, 'GET', `/api/notifications/alerts?userId=${userId}`);
    if (body.data.length > 0) {
      expect(body.data[0]).toHaveProperty('notificationType');
      expect(body.data[0]).not.toHaveProperty('type');
    }
  });

  it('response notifications have isRead field (not read)', async () => {
    const { body } = await req(app, 'GET', `/api/notifications/alerts?userId=${userId}`);
    if (body.data.length > 0) {
      expect(body.data[0]).toHaveProperty('isRead');
      expect(body.data[0]).not.toHaveProperty('read');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notifications/mark-read
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/notifications/mark-read', () => {
  let app: Hono;
  const userId = `notif-test-user-mark-${Date.now()}`;

  beforeAll(() => { app = createTestApp(); });

  it('returns 200 and updated count when marking specific ids', async () => {
    const id1 = seedNotif({ userId, readStatus: 0, title: `${TAG} mark-one` });
    const { status, body } = await req(app, 'POST', '/api/notifications/mark-read', { ids: [id1] });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.updated).toBe(1);
  });

  it('marking specific ids sets read_status to 1', async () => {
    const id2 = seedNotif({ userId, readStatus: 0, title: `${TAG} mark-verify` });
    await req(app, 'POST', '/api/notifications/mark-read', { ids: [id2] });
    const row = sqlite.prepare('SELECT read_status FROM notifications WHERE id = ?').get(id2) as any;
    expect(row.read_status).toBe(1);
  });

  it('can mark multiple ids at once', async () => {
    const id3 = seedNotif({ userId, readStatus: 0, title: `${TAG} mark-multi-1` });
    const id4 = seedNotif({ userId, readStatus: 0, title: `${TAG} mark-multi-2` });
    const { body } = await req(app, 'POST', '/api/notifications/mark-read', { ids: [id3, id4] });
    expect(body.updated).toBe(2);
  });

  it('returns 400 when ids is empty and all is not set', async () => {
    const { status, body } = await req(app, 'POST', '/api/notifications/mark-read', { ids: [] });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('mark all=true marks all unread notifications', async () => {
    const id5 = seedNotif({ userId, readStatus: 0, title: `${TAG} mark-all-1` });
    const id6 = seedNotif({ userId, readStatus: 0, title: `${TAG} mark-all-2` });
    const { body } = await req(app, 'POST', '/api/notifications/mark-read', { all: true, userId });
    expect(body.success).toBe(true);
    expect(body.updated).toBeGreaterThanOrEqual(2);
    // Verify DB state
    const row5 = sqlite.prepare('SELECT read_status FROM notifications WHERE id = ?').get(id5) as any;
    const row6 = sqlite.prepare('SELECT read_status FROM notifications WHERE id = ?').get(id6) as any;
    expect(row5.read_status).toBe(1);
    expect(row6.read_status).toBe(1);
  });

  it('mark all=true returns success message string', async () => {
    const { body } = await req(app, 'POST', '/api/notifications/mark-read', { all: true });
    expect(typeof body.message).toBe('string');
    expect(body.message.length).toBeGreaterThan(0);
  });

  it('supports single id via id field (not ids array)', async () => {
    const id7 = seedNotif({ userId, readStatus: 0, title: `${TAG} mark-single-id` });
    const { body } = await req(app, 'POST', '/api/notifications/mark-read', { id: id7 });
    expect(body.success).toBe(true);
    expect(body.updated).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notifications/broadcast
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/notifications/broadcast', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('returns 201 and success:true for valid broadcast', async () => {
    const { status, body } = await req(app, 'POST', '/api/notifications/broadcast', {
      type: 'system',
      title: 'BRTEST-broadcast-1',
      message: 'System maintenance scheduled',
      severity: 'warning',
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('recipientCount is at least 1', async () => {
    const { body } = await req(app, 'POST', '/api/notifications/broadcast', {
      type: 'broadcast',
      title: 'BRTEST-broadcast-2',
      message: 'Company-wide announcement',
      severity: 'info',
    });
    expect(body.data.recipientCount).toBeGreaterThanOrEqual(1);
  });

  it('broadcast inserts a notification into the DB', async () => {
    const uniqueTitle = `BRTEST-db-verify-${Date.now()}`;
    await req(app, 'POST', '/api/notifications/broadcast', {
      type: 'incident',
      title: uniqueTitle,
      message: 'Incident reported in sector 4',
      severity: 'critical',
    });
    const row = sqlite.prepare('SELECT * FROM notifications WHERE title = ?').get(uniqueTitle);
    expect(row).not.toBeNull();
  });

  it('department field becomes available in data response', async () => {
    const { body } = await req(app, 'POST', '/api/notifications/broadcast', {
      type: 'training',
      title: 'BRTEST-dept',
      message: 'Training required',
      severity: 'info',
      department: 'Engineering',
    });
    expect(body.data).toHaveProperty('department');
  });

  it('returns 400 for missing title', async () => {
    const { status } = await req(app, 'POST', '/api/notifications/broadcast', {
      type: 'system',
      message: 'No title',
      severity: 'info',
    });
    expect(status).toBe(400);
  });

  it('returns 400 for missing message', async () => {
    const { status } = await req(app, 'POST', '/api/notifications/broadcast', {
      type: 'system',
      title: 'BRTEST-no-message',
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid severity value', async () => {
    const { status } = await req(app, 'POST', '/api/notifications/broadcast', {
      type: 'system',
      title: 'BRTEST-bad-severity',
      message: 'Test',
      severity: 'extreme',
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid type value', async () => {
    const { status } = await req(app, 'POST', '/api/notifications/broadcast', {
      type: 'unknown_type',
      title: 'BRTEST-bad-type',
      message: 'Test',
      severity: 'info',
    });
    expect(status).toBe(400);
  });

  it('defaults type to broadcast when not provided', async () => {
    const { status } = await req(app, 'POST', '/api/notifications/broadcast', {
      title: 'BRTEST-no-type',
      message: 'No type provided',
    });
    // Should succeed (defaults to 'broadcast')  
    expect(status).toBe(201);
  });

  it('defaults severity to info when not provided', async () => {
    const uniqueTitle = `BRTEST-default-sev-${Date.now()}`;
    await req(app, 'POST', '/api/notifications/broadcast', {
      type: 'system',
      title: uniqueTitle,
      message: 'No severity provided',
    });
    const row = sqlite.prepare('SELECT severity FROM notifications WHERE title = ?').get(uniqueTitle) as any;
    expect(row?.severity).toBe('info');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/notifications/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/notifications/:id', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('returns 200 and success:true for existing notification', async () => {
    const id = seedNotif({ title: `${TAG} delete-test` });
    const { status, body } = await req(app, 'DELETE', `/api/notifications/${id}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.message).toBe('string');
  });

  it('actually removes the row from the DB', async () => {
    const id = seedNotif({ title: `${TAG} delete-verify` });
    await req(app, 'DELETE', `/api/notifications/${id}`);
    const row = sqlite.prepare('SELECT id FROM notifications WHERE id = ?').get(id);
    expect(row).toBeUndefined();
  });

  it('returns 404 for non-existent id', async () => {
    const { status, body } = await req(app, 'DELETE', '/api/notifications/999999999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 404 on double-delete', async () => {
    const id = seedNotif({ title: `${TAG} double-delete` });
    await req(app, 'DELETE', `/api/notifications/${id}`);
    const { status } = await req(app, 'DELETE', `/api/notifications/${id}`);
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/notifications/settings + GET /api/notifications/settings
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/notifications/settings + GET /api/notifications/settings', () => {
  let app: Hono;
  const userId = `notif-test-user-settings-${Date.now()}`;

  beforeAll(() => { app = createTestApp(); });

  it('GET returns 200 with preferences and templates fields', async () => {
    const { status, body } = await req(app, 'GET', `/api/notifications/settings?userId=${userId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('preferences');
    expect(body.data).toHaveProperty('templates');
    expect(Array.isArray(body.data.templates)).toBe(true);
  });

  it('PUT creates new preferences when user has none', async () => {
    const { status, body } = await req(app, 'PUT', '/api/notifications/settings', {
      userId,
      emailNotifications: true,
      smsNotifications: false,
      inAppNotifications: true,
      frequency: 'daily',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('PUT updates existing preferences', async () => {
    await req(app, 'PUT', '/api/notifications/settings', {
      userId, emailNotifications: true, frequency: 'daily',
    });
    const { body } = await req(app, 'PUT', '/api/notifications/settings', {
      userId, frequency: 'weekly',
    });
    expect(body.data.frequency).toBe('weekly');
  });

  it('PUT returns 400 for missing userId', async () => {
    const { status } = await req(app, 'PUT', '/api/notifications/settings', {
      emailNotifications: true,
    });
    expect(status).toBe(400);
  });

  it('PUT returns 400 for invalid frequency value', async () => {
    const { status } = await req(app, 'PUT', '/api/notifications/settings', {
      userId, frequency: 'monthly',
    });
    expect(status).toBe(400);
  });

  it('PUT persists preferences to DB', async () => {
    const freshUserId = `notif-test-user-settings-persist-${Date.now()}`;
    await req(app, 'PUT', '/api/notifications/settings', {
      userId: freshUserId,
      emailNotifications: false,
      smsNotifications: true,
      frequency: 'immediate',
    });
    const prefs = sqlite.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(freshUserId) as any;
    expect(prefs).not.toBeNull();
    expect(prefs.email_notifications).toBe(0);
    expect(prefs.sms_notifications).toBe(1);
    expect(prefs.frequency).toBe('immediate');
    sqlite.prepare('DELETE FROM notification_preferences WHERE user_id = ?').run(freshUserId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notifications/preferences
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/notifications/preferences', () => {
  let app: Hono;
  const userId = `notif-test-user-prefs-${Date.now()}`;

  beforeAll(() => { app = createTestApp(); });

  it('returns 200 on valid upsert', async () => {
    const { status, body } = await req(app, 'POST', '/api/notifications/preferences', {
      userId,
      emailNotifications: true,
      smsNotifications: false,
      frequency: 'immediate',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('response includes userId and frequency', async () => {
    const { body } = await req(app, 'POST', '/api/notifications/preferences', {
      userId, frequency: 'weekly',
    });
    expect(body.data.userId).toBe(userId);
    expect(body.data.frequency).toBe('weekly');
  });

  it('response includes emailNotifications and inAppNotifications booleans', async () => {
    const { body } = await req(app, 'POST', '/api/notifications/preferences', {
      userId, emailNotifications: true, inAppNotifications: false,
    });
    expect(typeof body.data.emailNotifications).toBe('boolean');
    expect(typeof body.data.inAppNotifications).toBe('boolean');
  });

  it('returns 400 for missing userId', async () => {
    const { status } = await req(app, 'POST', '/api/notifications/preferences', {
      emailNotifications: true,
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid frequency', async () => {
    const { status } = await req(app, 'POST', '/api/notifications/preferences', {
      userId, frequency: 'never',
    });
    expect(status).toBe(400);
  });

  it('upserts on second call without creating duplicate', async () => {
    const freshUserId = `notif-test-user-prefs-upsert-${Date.now()}`;
    await req(app, 'POST', '/api/notifications/preferences', { userId: freshUserId, frequency: 'daily' });
    await req(app, 'POST', '/api/notifications/preferences', { userId: freshUserId, frequency: 'weekly' });
    const rows = sqlite.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').all(freshUserId);
    expect(rows.length).toBe(1);
    expect((rows[0] as any).frequency).toBe('weekly');
    sqlite.prepare('DELETE FROM notification_preferences WHERE user_id = ?').run(freshUserId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: full notification lifecycle
// ─────────────────────────────────────────────────────────────────────────────

describe('Full notification lifecycle', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('broadcast → list → mark-read → verify read', async () => {
    const uniqueTitle = `BRTEST-lifecycle-${Date.now()}`;

    // 1. Broadcast a notification
    const { body: bBody } = await req(app, 'POST', '/api/notifications/broadcast', {
      type: 'incident',
      title: uniqueTitle,
      message: 'Lifecycle test notification',
      severity: 'warning',
    });
    expect(bBody.success).toBe(true);

    // 2. List and find it
    const { body: listBody } = await req(app, 'GET', '/api/notifications');
    const notif = listBody.data.find((n: any) => n.title === uniqueTitle);
    expect(notif).toBeDefined();
    expect(notif.isRead).toBe(false);
    expect(notif.notificationType).toBe('incident');

    // 3. Mark it as read
    const { body: markBody } = await req(app, 'POST', '/api/notifications/mark-read', { ids: [notif.id] });
    expect(markBody.success).toBe(true);
    expect(markBody.updated).toBe(1);

    // 4. Verify isRead is now true
    const { body: afterMark } = await req(app, 'GET', '/api/notifications');
    const markedNotif = afterMark.data.find((n: any) => n.id === notif.id);
    expect(markedNotif.isRead).toBe(true);

    // 5. Delete it
    const { body: delBody } = await req(app, 'DELETE', `/api/notifications/${notif.id}`);
    expect(delBody.success).toBe(true);

    // 6. Confirm deleted (not in list)
    const { body: finalList } = await req(app, 'GET', '/api/notifications');
    const deleted = finalList.data.find((n: any) => n.id === notif.id);
    expect(deleted).toBeUndefined();
  });

  it('filters work correctly end-to-end', async () => {
    const userId = `notif-test-lifecycle-filter-${Date.now()}`;
    seedNotif({ userId, type: 'capa', severity: 'critical', readStatus: 0, title: `${TAG} e2e-capa` });
    seedNotif({ userId, type: 'training', severity: 'info', readStatus: 0, title: `${TAG} e2e-training` });

    // Filter by type=capa
    const { body: capaBody } = await req(app, 'GET', `/api/notifications?userId=${userId}&type=capa`);
    expect(capaBody.data.length).toBe(1);
    expect(capaBody.data[0].notificationType).toBe('capa');

    // Filter by severity=critical
    const { body: critBody } = await req(app, 'GET', `/api/notifications?userId=${userId}&severity=critical`);
    expect(critBody.data.every((n: any) => n.severity === 'critical')).toBe(true);

    // Mark all read, then read=false returns empty
    await req(app, 'POST', '/api/notifications/mark-read', { all: true, userId });
    const { body: unreadBody } = await req(app, 'GET', `/api/notifications?userId=${userId}&read=false`);
    expect(unreadBody.count).toBe(0);
  });
});
