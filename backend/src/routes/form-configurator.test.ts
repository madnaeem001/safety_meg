/**
 * Form Configurator Routes Test Suite
 *
 * Covers:
 *   GET    /api/form-configs                — auth, list, isolation
 *   POST   /api/form-configs                — create, validation
 *   GET    /api/form-configs/:id             — fetch, ownership, 404
 *   PUT    /api/form-configs/:id             — update, validation, 404
 *   DELETE /api/form-configs/:id             — delete, 404
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import Database from 'better-sqlite3';
import { formConfiguratorRoutes } from '../routes/form-configurator';

// ── App factory ────────────────────────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  formConfiguratorRoutes(app);
  return app;
}

// ── Request helper ─────────────────────────────────────────────────────────────

async function req(
  app: Hono,
  method: string,
  path: string,
  body?: unknown,
  token?: string,
) {
  const init: RequestInit = { method };
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  init.headers = headers;
  const res = await app.request(path, init);
  return { status: res.status, body: (await res.json()) as any };
}

// ── JWT helpers ────────────────────────────────────────────────────────────────

const JWT_SECRET = 'safetymeg-jwt-secret-2025-change-in-production';

async function makeToken(userId: number): Promise<string> {
  return sign(
    {
      userId,
      email: `fc-test-${userId}@example.com`,
      role: 'safety_officer',
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    JWT_SECRET,
  );
}

// ── Users ──────────────────────────────────────────────────────────────────────

const BASE_USER_ID = 770000 + (Date.now() % 9000);
const USER_A = BASE_USER_ID;
const USER_B = BASE_USER_ID + 1;

let tokenA: string;
let tokenB: string;

const sqlite = new Database('local.sqlite');

beforeAll(async () => {
  tokenA = await makeToken(USER_A);
  tokenB = await makeToken(USER_B);
});

afterAll(() => {
  sqlite.prepare('DELETE FROM form_configs WHERE user_id IN (?, ?)').run(USER_A, USER_B);
  // also clean up extra users created in tests
  sqlite
    .prepare('DELETE FROM form_configs WHERE user_id BETWEEN ? AND ?')
    .run(BASE_USER_ID, BASE_USER_ID + 50);
  sqlite.close();
});

// ── Minimal valid payload ──────────────────────────────────────────────────────

function minimalConfig(overrides: Record<string, unknown> = {}) {
  return {
    clientId: `FORM-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: 'Test Safety Inspection Form',
    description: 'A test form for safety inspections',
    category: 'inspection',
    fields: [],
    status: 'draft',
    ...overrides,
  };
}

const sampleField = {
  id: 'field-001',
  type: 'text',
  label: 'Inspector Name',
  placeholder: 'Enter name',
  required: true,
  helpText: 'Full legal name',
};

const selectField = {
  id: 'field-002',
  type: 'select',
  label: 'Area Type',
  required: true,
  options: ['Office', 'Warehouse', 'Construction Site'],
};

const checkboxField = {
  id: 'field-003',
  type: 'checkbox',
  label: 'Hazards Identified',
  required: false,
  options: ['Slip/Trip', 'Electrical', 'Fire'],
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/form-configs (list)
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/form-configs', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status, body } = await req(app, 'GET', '/api/form-configs');
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 401 for invalid token', async () => {
    const { status } = await req(app, 'GET', '/api/form-configs', undefined, 'invalid.token');
    expect(status).toBe(401);
  });

  it('returns 200 with empty array for fresh user', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 5);
    const { status, body } = await req(app, 'GET', '/api/form-configs', undefined, freshToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.count).toBe(0);
  });

  it('count field matches data array length', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 6);
    await req(app, 'POST', '/api/form-configs', minimalConfig(), freshToken);
    await req(app, 'POST', '/api/form-configs', minimalConfig(), freshToken);
    const { body } = await req(app, 'GET', '/api/form-configs', undefined, freshToken);
    expect(body.count).toBe(body.data.length);
    expect(body.count).toBe(2);
  });

  it('user A forms do not appear in user B list (cross-user isolation)', async () => {
    const freshA = await makeToken(BASE_USER_ID + 7);
    const freshB = await makeToken(BASE_USER_ID + 8);
    await req(app, 'POST', '/api/form-configs', minimalConfig({ name: 'User A Only' }), freshA);
    const { body } = await req(app, 'GET', '/api/form-configs', undefined, freshB);
    const names = body.data.map((f: any) => f.name);
    expect(names).not.toContain('User A Only');
  });

  it('returns forms sorted newest-first (by updatedAt)', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 9);
    await req(app, 'POST', '/api/form-configs', minimalConfig({ name: 'First Form' }), freshToken);
    await req(app, 'POST', '/api/form-configs', minimalConfig({ name: 'Second Form' }), freshToken);
    const { body } = await req(app, 'GET', '/api/form-configs', undefined, freshToken);
    expect(body.data[0].name).toBe('Second Form');
    expect(body.data[1].name).toBe('First Form');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/form-configs (create)
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/form-configs', () => {
  let app: Hono;
  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'POST', '/api/form-configs', minimalConfig());
    expect(status).toBe(401);
  });

  it('creates a form config and returns 201', async () => {
    const { status, body } = await req(app, 'POST', '/api/form-configs', minimalConfig(), tokenA);
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
  });

  it('returned data has all camelCase fields', async () => {
    const { body } = await req(app, 'POST', '/api/form-configs', minimalConfig(), tokenA);
    const d = body.data;
    expect(d).toHaveProperty('id');
    expect(d).toHaveProperty('clientId');
    expect(d).toHaveProperty('userId');
    expect(d).toHaveProperty('name');
    expect(d).toHaveProperty('description');
    expect(d).toHaveProperty('category');
    expect(d).toHaveProperty('fields');
    expect(d).toHaveProperty('status');
    expect(d).toHaveProperty('createdAt');
    expect(d).toHaveProperty('updatedAt');
  });

  it('does not expose snake_case keys', async () => {
    const { body } = await req(app, 'POST', '/api/form-configs', minimalConfig(), tokenA);
    expect(body.data).not.toHaveProperty('client_id');
    expect(body.data).not.toHaveProperty('user_id');
    expect(body.data).not.toHaveProperty('created_at');
    expect(body.data).not.toHaveProperty('updated_at');
  });

  it('persists clientId correctly', async () => {
    const customId = `FORM-PERSIST-${Date.now()}`;
    const { body } = await req(app, 'POST', '/api/form-configs', minimalConfig({ clientId: customId }), tokenA);
    expect(body.data.clientId).toBe(customId);
  });

  it('status defaults to draft when not provided', async () => {
    const payload = minimalConfig();
    delete (payload as any).status;
    const { body } = await req(app, 'POST', '/api/form-configs', payload, tokenA);
    expect(body.data.status).toBe('draft');
  });

  it('accepts published status', async () => {
    const { body } = await req(app, 'POST', '/api/form-configs', minimalConfig({ status: 'published' }), tokenA);
    expect(body.data.status).toBe('published');
  });

  it('accepts archived status', async () => {
    const { body } = await req(app, 'POST', '/api/form-configs', minimalConfig({ status: 'archived' }), tokenA);
    expect(body.data.status).toBe('archived');
  });

  it('fields array is parsed (not a JSON string)', async () => {
    const { body } = await req(app, 'POST', '/api/form-configs', minimalConfig({ fields: [] }), tokenA);
    expect(Array.isArray(body.data.fields)).toBe(true);
  });

  it('persists fields with full structure', async () => {
    const { body } = await req(
      app, 'POST', '/api/form-configs',
      minimalConfig({ fields: [sampleField, selectField] }),
      tokenA,
    );
    expect(body.data.fields).toHaveLength(2);
    expect(body.data.fields[0].id).toBe('field-001');
    expect(body.data.fields[0].label).toBe('Inspector Name');
    expect(body.data.fields[0].required).toBe(true);
  });

  it('persists select field with options array', async () => {
    const { body } = await req(
      app, 'POST', '/api/form-configs',
      minimalConfig({ fields: [selectField] }),
      tokenA,
    );
    expect(Array.isArray(body.data.fields[0].options)).toBe(true);
    expect(body.data.fields[0].options).toContain('Warehouse');
  });

  it('persists checkbox field with options array', async () => {
    const { body } = await req(
      app, 'POST', '/api/form-configs',
      minimalConfig({ fields: [checkboxField] }),
      tokenA,
    );
    expect(body.data.fields[0].options).toContain('Electrical');
  });

  it('persists all 13 field types', async () => {
    const allTypeFields = [
      'text', 'number', 'email', 'textarea', 'select', 'radio',
      'checkbox', 'date', 'time', 'file', 'signature', 'location', 'photo',
    ].map((t, i) => ({ id: `f-${i}`, type: t, label: `Field ${t}`, required: false }));
    const { body } = await req(
      app, 'POST', '/api/form-configs',
      minimalConfig({ fields: allTypeFields }),
      tokenA,
    );
    expect(body.data.fields).toHaveLength(13);
  });

  it('persists helpText on a field', async () => {
    const { body } = await req(
      app, 'POST', '/api/form-configs',
      minimalConfig({ fields: [sampleField] }),
      tokenA,
    );
    expect(body.data.fields[0].helpText).toBe('Full legal name');
  });

  it('returns 400 for missing name', async () => {
    const payload = minimalConfig();
    delete (payload as any).name;
    const { status } = await req(app, 'POST', '/api/form-configs', payload, tokenA);
    expect(status).toBe(400);
  });

  it('returns 400 for missing clientId', async () => {
    const payload = minimalConfig();
    delete (payload as any).clientId;
    const { status } = await req(app, 'POST', '/api/form-configs', payload, tokenA);
    expect(status).toBe(400);
  });

  it('returns 400 for invalid status value', async () => {
    const { status } = await req(app, 'POST', '/api/form-configs', minimalConfig({ status: 'active' }), tokenA);
    expect(status).toBe(400);
  });

  it('returns 400 for invalid field type', async () => {
    const { status } = await req(
      app, 'POST', '/api/form-configs',
      minimalConfig({ fields: [{ id: 'f1', type: 'unknown-type', label: 'Bad', required: false }] }),
      tokenA,
    );
    expect(status).toBe(400);
  });

  it('returns 400 for malformed JSON body', async () => {
    const res = await app.request('/api/form-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: '{ bad json }',
    });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/form-configs/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/form-configs/:id', () => {
  let app: Hono;
  let createdId: number;

  beforeAll(async () => {
    app = createTestApp();
    const { body } = await req(
      app, 'POST', '/api/form-configs',
      minimalConfig({ name: 'GetById Form', fields: [sampleField] }),
      tokenA,
    );
    createdId = body.data.id;
  });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'GET', `/api/form-configs/${createdId}`);
    expect(status).toBe(401);
  });

  it('returns 200 for own form', async () => {
    const { status, body } = await req(app, 'GET', `/api/form-configs/${createdId}`, undefined, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdId);
  });

  it('returned data has correct name', async () => {
    const { body } = await req(app, 'GET', `/api/form-configs/${createdId}`, undefined, tokenA);
    expect(body.data.name).toBe('GetById Form');
  });

  it('fields are parsed as an array (not string)', async () => {
    const { body } = await req(app, 'GET', `/api/form-configs/${createdId}`, undefined, tokenA);
    expect(Array.isArray(body.data.fields)).toBe(true);
    expect(body.data.fields).toHaveLength(1);
    expect(body.data.fields[0].id).toBe('field-001');
  });

  it('returns 404 for non-existent id', async () => {
    const { status, body } = await req(app, 'GET', '/api/form-configs/999999999', undefined, tokenA);
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 404 when user B tries to access user A form (ownership)', async () => {
    const { status } = await req(app, 'GET', `/api/form-configs/${createdId}`, undefined, tokenB);
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/form-configs/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/form-configs/:id', () => {
  let app: Hono;
  let formId: number;

  beforeAll(async () => {
    app = createTestApp();
    const { body } = await req(
      app, 'POST', '/api/form-configs',
      minimalConfig({ name: 'Original Name', category: 'general', fields: [sampleField] }),
      tokenA,
    );
    formId = body.data.id;
  });

  it('returns 401 with no token', async () => {
    const { status } = await req(app, 'PUT', `/api/form-configs/${formId}`, { name: 'Updated' });
    expect(status).toBe(401);
  });

  it('returns 200 on valid update', async () => {
    const { status, body } = await req(
      app, 'PUT', `/api/form-configs/${formId}`, { name: 'Updated Name' }, tokenA,
    );
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('updated name is reflected in response', async () => {
    const { body } = await req(
      app, 'PUT', `/api/form-configs/${formId}`, { name: 'Definitely Updated' }, tokenA,
    );
    expect(body.data.name).toBe('Definitely Updated');
  });

  it('updating status to published is reflected', async () => {
    const { body } = await req(
      app, 'PUT', `/api/form-configs/${formId}`, { status: 'published' }, tokenA,
    );
    expect(body.data.status).toBe('published');
  });

  it('updating category is reflected', async () => {
    const { body } = await req(
      app, 'PUT', `/api/form-configs/${formId}`, { category: 'audit' }, tokenA,
    );
    expect(body.data.category).toBe('audit');
  });

  it('updating fields replaces the array', async () => {
    const newFields = [selectField, checkboxField];
    const { body } = await req(
      app, 'PUT', `/api/form-configs/${formId}`, { fields: newFields }, tokenA,
    );
    expect(body.data.fields).toHaveLength(2);
    expect(body.data.fields[0].id).toBe('field-002');
  });

  it('updating description is reflected', async () => {
    const { body } = await req(
      app, 'PUT', `/api/form-configs/${formId}`, { description: 'Updated description text' }, tokenA,
    );
    expect(body.data.description).toBe('Updated description text');
  });

  it('response has camelCase keys (no snake_case)', async () => {
    const { body } = await req(
      app, 'PUT', `/api/form-configs/${formId}`, { name: 'CamelCase Check' }, tokenA,
    );
    expect(body.data).toHaveProperty('clientId');
    expect(body.data).not.toHaveProperty('client_id');
    expect(body.data).toHaveProperty('createdAt');
    expect(body.data).not.toHaveProperty('created_at');
  });

  it('returns 400 for invalid status value', async () => {
    const { status } = await req(
      app, 'PUT', `/api/form-configs/${formId}`, { status: 'badstatus' }, tokenA,
    );
    expect(status).toBe(400);
  });

  it('returns 400 when no valid fields provided', async () => {
    const { status, body } = await req(
      app, 'PUT', `/api/form-configs/${formId}`, { unknownKey: 'value' }, tokenA,
    );
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await app.request(`/api/form-configs/${formId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: 'not json',
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent id', async () => {
    const { status } = await req(
      app, 'PUT', '/api/form-configs/999999999', { name: 'Nope' }, tokenA,
    );
    expect(status).toBe(404);
  });

  it('returns 404 when user B tries to update user A form', async () => {
    const { status } = await req(
      app, 'PUT', `/api/form-configs/${formId}`, { name: 'Hack' }, tokenB,
    );
    expect(status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/form-configs/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/form-configs/:id', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('returns 401 with no token', async () => {
    const { body: created } = await req(app, 'POST', '/api/form-configs', minimalConfig(), tokenA);
    const { status } = await req(app, 'DELETE', `/api/form-configs/${created.data.id}`);
    expect(status).toBe(401);
  });

  it('returns 200 and success:true for own form', async () => {
    const { body: created } = await req(app, 'POST', '/api/form-configs', minimalConfig(), tokenA);
    const { status, body } = await req(app, 'DELETE', `/api/form-configs/${created.data.id}`, undefined, tokenA);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.message).toBe('string');
  });

  it('deleted form is no longer accessible via GET', async () => {
    const { body: created } = await req(app, 'POST', '/api/form-configs', minimalConfig(), tokenA);
    const id = created.data.id;
    await req(app, 'DELETE', `/api/form-configs/${id}`, undefined, tokenA);
    const { status } = await req(app, 'GET', `/api/form-configs/${id}`, undefined, tokenA);
    expect(status).toBe(404);
  });

  it('returns 404 for already-deleted form', async () => {
    const { body: created } = await req(app, 'POST', '/api/form-configs', minimalConfig(), tokenA);
    const id = created.data.id;
    await req(app, 'DELETE', `/api/form-configs/${id}`, undefined, tokenA);
    const { status } = await req(app, 'DELETE', `/api/form-configs/${id}`, undefined, tokenA);
    expect(status).toBe(404);
  });

  it('returns 404 for non-existent id', async () => {
    const { status } = await req(app, 'DELETE', '/api/form-configs/999999999', undefined, tokenA);
    expect(status).toBe(404);
  });

  it('returns 404 when user B tries to delete user A form', async () => {
    const { body: created } = await req(app, 'POST', '/api/form-configs', minimalConfig(), tokenA);
    const { status } = await req(app, 'DELETE', `/api/form-configs/${created.data.id}`, undefined, tokenB);
    expect(status).toBe(404);
  });

  it('does not delete other user forms when deleting own form', async () => {
    const { body: aForm } = await req(app, 'POST', '/api/form-configs', minimalConfig({ name: 'A Form' }), tokenA);
    const { body: bForm } = await req(app, 'POST', '/api/form-configs', minimalConfig({ name: 'B Form' }), tokenB);
    await req(app, 'DELETE', `/api/form-configs/${aForm.data.id}`, undefined, tokenA);
    const { status } = await req(app, 'GET', `/api/form-configs/${bForm.data.id}`, undefined, tokenB);
    expect(status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: full form lifecycle
// ─────────────────────────────────────────────────────────────────────────────

describe('Full form lifecycle', () => {
  let app: Hono;

  beforeAll(() => { app = createTestApp(); });

  it('create → read → update → list → delete round-trip', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 20);

    // Create
    const { body: created } = await req(
      app, 'POST', '/api/form-configs',
      minimalConfig({ name: 'Lifecycle Form', fields: [sampleField] }),
      freshToken,
    );
    expect(created.data.id).toBeGreaterThan(0);
    const id = created.data.id;

    // Read
    const { body: fetched } = await req(app, 'GET', `/api/form-configs/${id}`, undefined, freshToken);
    expect(fetched.data.name).toBe('Lifecycle Form');
    expect(fetched.data.fields).toHaveLength(1);

    // Update
    const { body: updated } = await req(
      app, 'PUT', `/api/form-configs/${id}`, { name: 'Updated Lifecycle', status: 'published' }, freshToken,
    );
    expect(updated.data.name).toBe('Updated Lifecycle');
    expect(updated.data.status).toBe('published');

    // List
    const { body: list } = await req(app, 'GET', '/api/form-configs', undefined, freshToken);
    const found = list.data.find((f: any) => f.id === id);
    expect(found).toBeDefined();
    expect(found.name).toBe('Updated Lifecycle');

    // Delete
    const { status: delStatus } = await req(app, 'DELETE', `/api/form-configs/${id}`, undefined, freshToken);
    expect(delStatus).toBe(200);

    // Confirm gone
    const { status: goneStatus } = await req(app, 'GET', `/api/form-configs/${id}`, undefined, freshToken);
    expect(goneStatus).toBe(404);
  });

  it('safety-inspection template fields round-trip', async () => {
    const freshToken = await makeToken(BASE_USER_ID + 21);
    const templateFields = [
      { id: 'tf-1', type: 'text',      label: 'Inspector Name',   required: true },
      { id: 'tf-2', type: 'date',      label: 'Inspection Date',  required: true },
      { id: 'tf-3', type: 'location',  label: 'Location',         required: true },
      { id: 'tf-4', type: 'select',    label: 'Area Type',        required: true, options: ['Office', 'Warehouse', 'Factory'] },
      { id: 'tf-5', type: 'radio',     label: 'Overall Condition',required: true, options: ['Satisfactory', 'Needs Improvement'] },
      { id: 'tf-6', type: 'checkbox',  label: 'Hazards',          required: false,options: ['Slip/Trip', 'Electrical'] },
      { id: 'tf-7', type: 'textarea',  label: 'Observations',     required: false },
      { id: 'tf-8', type: 'photo',     label: 'Photos',           required: false },
      { id: 'tf-9', type: 'signature', label: 'Signature',        required: true },
    ];

    const { body } = await req(app, 'POST', '/api/form-configs', {
      clientId: `FORM-TPL-${Date.now()}`,
      name: 'Safety Inspection',
      category: 'inspection',
      fields: templateFields,
      status: 'published',
    }, freshToken);

    expect(body.data.fields).toHaveLength(9);
    expect(body.data.fields[3].options).toContain('Factory');
    expect(body.data.fields[4].type).toBe('radio');
    expect(body.data.fields[8].type).toBe('signature');
    expect(body.data.status).toBe('published');
  });

  it('multiple users can create forms independently', async () => {
    const userC = await makeToken(BASE_USER_ID + 22);
    const userD = await makeToken(BASE_USER_ID + 23);
    await req(app, 'POST', '/api/form-configs', minimalConfig({ name: 'C Form' }), userC);
    await req(app, 'POST', '/api/form-configs', minimalConfig({ name: 'D Form' }), userD);

    const { body: cList } = await req(app, 'GET', '/api/form-configs', undefined, userC);
    const { body: dList } = await req(app, 'GET', '/api/form-configs', undefined, userD);

    expect(cList.count).toBe(1);
    expect(dList.count).toBe(1);
    expect(cList.data[0].name).toBe('C Form');
    expect(dList.data[0].name).toBe('D Form');
  });
});
