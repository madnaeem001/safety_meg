/**
 * Compliance Calendar Routes Test Suite
 *
 * Covers:
 *   GET    /api/compliance/calendar/stats
 *   GET    /api/compliance/calendar
 *   POST   /api/compliance/calendar
 *   GET    /api/compliance/calendar/:id
 *   PUT    /api/compliance/calendar/:id
 *   DELETE /api/compliance/calendar/:id
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { complianceCalendarRoutes } from '../routes/compliance-calendar';

function createTestApp() {
  const app = new Hono();
  complianceCalendarRoutes(app);
  return app;
}

async function req(app: Hono, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

const sqlite = new Database('local.sqlite');
const TAG = `testcal-${Date.now()}`;

afterAll(() => {
  sqlite.prepare(`DELETE FROM compliance_calendar WHERE title LIKE '${TAG}%'`).run();
  sqlite.close();
});

function seedCalendarEvent(overrides: Record<string, any> = {}) {
  const ts = Date.now();
  const result = sqlite.prepare(`
    INSERT INTO compliance_calendar
      (title, event_type, due_date, assigned_to, department, status, priority, description, regulation, related_item, completed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overrides.title ?? `${TAG}-event`,
    overrides.event_type ?? 'audit',
    overrides.due_date ?? '2026-02-20',
    overrides.assigned_to ?? 'Sarah Chen',
    overrides.department ?? 'EHS',
    overrides.status ?? 'upcoming',
    overrides.priority ?? 'high',
    overrides.description ?? 'Scheduled compliance event',
    overrides.regulation ?? 'OSHA 1910',
    overrides.related_item ?? 'Permit 7A',
    overrides.completed_at ?? null,
    overrides.created_at ?? ts,
    overrides.updated_at ?? ts
  );
  return result.lastInsertRowid as number;
}

describe('GET /api/compliance/calendar/stats', () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
    seedCalendarEvent({ title: `${TAG}-stats-upcoming`, due_date: '2099-02-20', status: 'upcoming' });
  });

  it('returns 200 with success envelope', async () => {
    const { status, body } = await req(app, 'GET', '/api/compliance/calendar/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns aggregate sections', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/calendar/stats');
    expect(typeof body.data.total).toBe('number');
    expect(Array.isArray(body.data.byStatus)).toBe(true);
    expect(Array.isArray(body.data.byType)).toBe(true);
    expect(Array.isArray(body.data.byPriority)).toBe(true);
  });

  it('returns mapped upcoming7 entries', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/calendar/stats');
    if (body.data.upcoming7.length > 0) {
      expect(body.data.upcoming7[0]).toHaveProperty('date');
      expect(body.data.upcoming7[0]).toHaveProperty('type');
      expect(body.data.upcoming7[0]).toHaveProperty('assignee');
    }
  });
});

describe('GET /api/compliance/calendar', () => {
  let app: Hono;
  let renewalId: number;
  let regulatoryId: number;

  beforeAll(() => {
    app = createTestApp();
    renewalId = seedCalendarEvent({
      title: `${TAG}-renewal`,
      event_type: 'certification-renewal',
      due_date: '2026-02-25',
      regulation: 'EPA CWA',
      status: 'upcoming',
      priority: 'critical'
    });
    regulatoryId = seedCalendarEvent({
      title: `${TAG}-regulatory`,
      event_type: 'regulation-deadline',
      due_date: '2026-03-05',
      assigned_to: 'Emma Williams',
      status: 'upcoming',
      priority: 'medium'
    });
    seedCalendarEvent({
      title: `${TAG}-overdue`,
      event_type: 'training',
      due_date: '2020-01-01',
      status: 'upcoming',
      priority: 'low'
    });
  });

  it('returns 200 with data array', async () => {
    const { status, body } = await req(app, 'GET', '/api/compliance/calendar');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('returns total matching data length', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/calendar');
    expect(body.total).toBe(body.data.length);
  });

  it('maps due_date to date and dueDate', async () => {
    const { body } = await req(app, 'GET', `/api/compliance/calendar?year=2026&month=2`);
    const found = body.data.find((item: any) => item.id === renewalId);
    expect(found.date).toBe('2026-02-25');
    expect(found.dueDate).toBe('2026-02-25');
  });

  it('maps assigned_to to assignee', async () => {
    const { body } = await req(app, 'GET', `/api/compliance/calendar?year=2026&month=3`);
    const found = body.data.find((item: any) => item.id === regulatoryId);
    expect(found.assignee).toBe('Emma Williams');
    expect(found.assignedTo).toBe('Emma Williams');
  });

  it('maps certification-renewal to renewal type', async () => {
    const { body } = await req(app, 'GET', `/api/compliance/calendar?year=2026&month=2`);
    const found = body.data.find((item: any) => item.id === renewalId);
    expect(found.type).toBe('renewal');
    expect(found.eventType).toBe('certification-renewal');
  });

  it('maps regulation-deadline to regulatory type', async () => {
    const { body } = await req(app, 'GET', `/api/compliance/calendar?year=2026&month=3`);
    const found = body.data.find((item: any) => item.id === regulatoryId);
    expect(found.type).toBe('regulatory');
  });

  it('maps critical priority to high for UI compatibility', async () => {
    const { body } = await req(app, 'GET', `/api/compliance/calendar?year=2026&month=2`);
    const found = body.data.find((item: any) => item.id === renewalId);
    expect(found.priority).toBe('high');
  });

  it('derives overdue status from past due upcoming events', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/calendar');
    const found = body.data.find((item: any) => item.title === `${TAG}-overdue`);
    expect(found.status).toBe('overdue');
  });

  it('derives daysLeft as a number', async () => {
    const { body } = await req(app, 'GET', `/api/compliance/calendar?year=2026&month=2`);
    const found = body.data.find((item: any) => item.id === renewalId);
    expect(typeof found.daysLeft).toBe('number');
  });

  it('filters by year and month', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/calendar?year=2026&month=2');
    expect(body.data.some((item: any) => item.date.startsWith('2026-02'))).toBe(true);
    expect(body.data.some((item: any) => item.date.startsWith('2026-03'))).toBe(false);
  });

  it('filters by department', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/calendar?department=EHS');
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((item: any) => item.department === 'EHS')).toBe(true);
  });

  it('filters by priority using stored priority values', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/calendar?priority=critical');
    expect(body.data.some((item: any) => item.id === renewalId)).toBe(true);
  });

  it('orders results by due date ascending', async () => {
    const { body } = await req(app, 'GET', '/api/compliance/calendar');
    for (let index = 1; index < body.data.length; index += 1) {
      expect(body.data[index - 1].date <= body.data[index].date).toBe(true);
    }
  });
});

describe('POST /api/compliance/calendar', () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  it('creates an event and returns 201', async () => {
    const { status } = await req(app, 'POST', '/api/compliance/calendar', {
      title: `${TAG}-create`,
      eventType: 'regulatory',
      dueDate: '2026-04-10',
      assignedTo: 'QA Team',
      priority: 'medium',
      status: 'in-progress',
      regulation: 'ISO 45001'
    });
    expect(status).toBe(201);
  });

  it('returns normalized event fields', async () => {
    const { body } = await req(app, 'POST', '/api/compliance/calendar', {
      title: `${TAG}-create-fields`,
      eventType: 'regulatory',
      dueDate: '2026-04-12',
      assignedTo: 'Safety Officer',
      priority: 'critical',
      regulation: 'OSHA 1910.95'
    });
    expect(body.data.type).toBe('regulatory');
    expect(body.data.priority).toBe('high');
    expect(body.data.assignee).toBe('Safety Officer');
    expect(body.data.regulation).toBe('OSHA 1910.95');
  });

  it('returns 400 for missing title', async () => {
    const { status } = await req(app, 'POST', '/api/compliance/calendar', {
      eventType: 'audit',
      dueDate: '2026-04-20'
    });
    expect(status).toBe(400);
  });

  it('returns 400 for invalid eventType', async () => {
    const { status } = await req(app, 'POST', '/api/compliance/calendar', {
      title: `${TAG}-bad-type`,
      eventType: 'unknown',
      dueDate: '2026-04-20'
    });
    expect(status).toBe(400);
  });
});

describe('GET /api/compliance/calendar/:id', () => {
  let app: Hono;
  let eventId: number;

  beforeAll(() => {
    app = createTestApp();
    eventId = seedCalendarEvent({ title: `${TAG}-get-one`, event_type: 'inspection', due_date: '2026-05-02' });
  });

  it('returns a mapped event by id', async () => {
    const { status, body } = await req(app, 'GET', `/api/compliance/calendar/${eventId}`);
    expect(status).toBe(200);
    expect(body.data.id).toBe(eventId);
    expect(body.data.date).toBe('2026-05-02');
    expect(body.data.type).toBe('inspection');
  });

  it('returns 404 for missing id', async () => {
    const { status } = await req(app, 'GET', '/api/compliance/calendar/99999999');
    expect(status).toBe(404);
  });
});

describe('PUT /api/compliance/calendar/:id', () => {
  let app: Hono;
  let eventId: number;

  beforeAll(() => {
    app = createTestApp();
    eventId = seedCalendarEvent({ title: `${TAG}-put-one`, event_type: 'audit', due_date: '2026-06-01' });
  });

  it('updates event fields and returns normalized data', async () => {
    const { status, body } = await req(app, 'PUT', `/api/compliance/calendar/${eventId}`, {
      eventType: 'renewal',
      regulation: 'EPA CAA',
      assignedTo: 'Environmental Team',
      priority: 'critical'
    });
    expect(status).toBe(200);
    expect(body.data.type).toBe('renewal');
    expect(body.data.regulation).toBe('EPA CAA');
    expect(body.data.assignee).toBe('Environmental Team');
    expect(body.data.priority).toBe('high');
  });

  it('sets completedAt when marking an event completed', async () => {
    const { body } = await req(app, 'PUT', `/api/compliance/calendar/${eventId}`, {
      status: 'completed'
    });
    expect(body.data.status).toBe('completed');
    expect(typeof body.data.completedAt).toBe('number');
  });

  it('returns 404 for missing id', async () => {
    const { status } = await req(app, 'PUT', '/api/compliance/calendar/99999999', {
      title: 'ghost'
    });
    expect(status).toBe(404);
  });
});

describe('DELETE /api/compliance/calendar/:id', () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  it('deletes an event', async () => {
    const eventId = seedCalendarEvent({ title: `${TAG}-delete-one` });
    const { status } = await req(app, 'DELETE', `/api/compliance/calendar/${eventId}`);
    expect(status).toBe(200);
  });

  it('returns 404 after deletion on fetch', async () => {
    const eventId = seedCalendarEvent({ title: `${TAG}-delete-two` });
    await req(app, 'DELETE', `/api/compliance/calendar/${eventId}`);
    const { status } = await req(app, 'GET', `/api/compliance/calendar/${eventId}`);
    expect(status).toBe(404);
  });

  it('returns 404 for missing id', async () => {
    const { status } = await req(app, 'DELETE', '/api/compliance/calendar/99999999');
    expect(status).toBe(404);
  });
});