import { Hono } from 'hono';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getSharedDb } from '../db';
import { createLogger } from '../services/logger';
import { apiError } from '../index';

const logger = createLogger('audit-schedules');

// ==================== TYPES ====================

export interface AuditSchedule {
  id: string;
  title: string;
  site_id: number;
  rrule_string: string;
  last_run_at: number | null;
  next_run_at: number | null;
  is_active: boolean;
  created_by: number;
  created_at: number;
  updated_at: number;
}

// ==================== VALIDATION SCHEMAS ====================

const CreateAuditScheduleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  siteId: z.number().int().positive('site_id must be a positive integer'),
  rruleString: z
    .string()
    .min(1, 'rrule_string is required')
    .regex(/^FREQ=/, 'rrule_string must start with FREQ= (e.g. FREQ=MONTHLY;BYDAY=1MO)'),
  nextRunAt: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  createdBy: z.number().int().positive('created_by must be a valid user id'),
});

const UpdateAuditScheduleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  rruleString: z
    .string()
    .min(1)
    .regex(/^FREQ=/, 'rrule_string must start with FREQ=')
    .optional(),
  nextRunAt: z.number().int().positive().nullable().optional(),
  lastRunAt: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

// ─── AI Checklist Generation ──────────────────────────────────────────────────

const Severity = z.enum(['Low', 'Medium', 'High']);

const GenerateChecklistSchema = z.object({
  hazard_type: z.string().min(1, 'hazard_type is required').max(200),
  industry_standard: z.string().min(1, 'industry_standard is required').max(200),
});

export interface ChecklistItem {
  question: string;
  severity: 'Low' | 'Medium' | 'High';
}

export interface GeneratedChecklist {
  hazard_type: string;
  industry_standard: string;
  items: ChecklistItem[];
}

/** Severity type guard — keeps the mock data array concisely typed. */
const _s = (v: z.infer<typeof Severity>) => v;

// ==================== MAPPER ====================

function mapRow(row: any): AuditSchedule {
  return {
    id: row.id,
    title: row.title,
    site_id: row.site_id,
    rrule_string: row.rrule_string,
    last_run_at: row.last_run_at ?? null,
    next_run_at: row.next_run_at ?? null,
    is_active: row.is_active === 1,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ==================== ROUTES ====================

export function auditScheduleRoutes(app: Hono) {
  const db = getSharedDb();

  // GET /api/audit-schedules — list all (optionally filter by site or active state)
  app.get('/api/audit-schedules', (c) => {
    try {
      const siteId = c.req.query('siteId');
      const activeOnly = c.req.query('activeOnly');

      let sql = 'SELECT * FROM audit_schedules';
      const params: unknown[] = [];
      const conditions: string[] = [];

      if (siteId) {
        conditions.push('site_id = ?');
        params.push(Number(siteId));
      }
      if (activeOnly === 'true') {
        conditions.push('is_active = 1');
      }
      if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
      sql += ' ORDER BY next_run_at ASC';

      const rows = db.prepare(sql).all(...params) as any[];
      return c.json({ success: true, data: rows.map(mapRow) });
    } catch (err) {
      logger.error('audit-schedules GET list error', err);
      return apiError(c, 500, 'Failed to fetch audit schedules');
    }
  });

  // GET /api/audit-schedules/:id
  app.get('/api/audit-schedules/:id', (c) => {
    try {
      const id = c.req.param('id');
      const row = db.prepare('SELECT * FROM audit_schedules WHERE id = ?').get(id) as any;
      if (!row) return apiError(c, 404, 'Audit schedule not found');
      return c.json({ success: true, data: mapRow(row) });
    } catch (err) {
      logger.error('audit-schedules GET by id error', err);
      return apiError(c, 500, 'Failed to fetch audit schedule');
    }
  });

  // POST /api/audit-schedules
  app.post('/api/audit-schedules', async (c) => {
    try {
      const body = await c.req.json();
      const parsed = CreateAuditScheduleSchema.safeParse(body);
      if (!parsed.success) {
        return apiError(c, 400, 'Validation failed', parsed.error.flatten());
      }

      const { title, siteId, rruleString, nextRunAt, isActive, createdBy } = parsed.data;
      const id = randomUUID();
      const now = Date.now();

      db.prepare(`
        INSERT INTO audit_schedules
          (id, title, site_id, rrule_string, next_run_at, is_active, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, title, siteId, rruleString, nextRunAt ?? null, isActive ? 1 : 0, createdBy, now, now);

      const row = db.prepare('SELECT * FROM audit_schedules WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: mapRow(row) }, 201);
    } catch (err) {
      logger.error('audit-schedules POST error', err);
      return apiError(c, 500, 'Failed to create audit schedule');
    }
  });

  // PATCH /api/audit-schedules/:id
  app.patch('/api/audit-schedules/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const existing = db.prepare('SELECT * FROM audit_schedules WHERE id = ?').get(id);
      if (!existing) return apiError(c, 404, 'Audit schedule not found');

      const body = await c.req.json();
      const parsed = UpdateAuditScheduleSchema.safeParse(body);
      if (!parsed.success) {
        return apiError(c, 400, 'Validation failed', parsed.error.flatten());
      }

      const fields = parsed.data;
      const updates: string[] = [];
      const params: unknown[] = [];

      if (fields.title !== undefined)       { updates.push('title = ?');        params.push(fields.title); }
      if (fields.rruleString !== undefined)  { updates.push('rrule_string = ?'); params.push(fields.rruleString); }
      if ('nextRunAt' in fields)             { updates.push('next_run_at = ?');  params.push(fields.nextRunAt ?? null); }
      if ('lastRunAt' in fields)             { updates.push('last_run_at = ?');  params.push(fields.lastRunAt ?? null); }
      if (fields.isActive !== undefined)     { updates.push('is_active = ?');    params.push(fields.isActive ? 1 : 0); }

      if (!updates.length) return apiError(c, 400, 'No fields to update');

      updates.push('updated_at = ?');
      params.push(Date.now());
      params.push(id);

      db.prepare(`UPDATE audit_schedules SET ${updates.join(', ')} WHERE id = ?`).run(...params);

      const row = db.prepare('SELECT * FROM audit_schedules WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: mapRow(row) });
    } catch (err) {
      logger.error('audit-schedules PATCH error', err);
      return apiError(c, 500, 'Failed to update audit schedule');
    }
  });

  // DELETE /api/audit-schedules/:id
  app.delete('/api/audit-schedules/:id', (c) => {
    try {
      const id = c.req.param('id');
      const existing = db.prepare('SELECT id FROM audit_schedules WHERE id = ?').get(id);
      if (!existing) return apiError(c, 404, 'Audit schedule not found');

      db.prepare('DELETE FROM audit_schedules WHERE id = ?').run(id);
      return c.json({ success: true, message: 'Audit schedule deleted' });
    } catch (err) {
      logger.error('audit-schedules DELETE error', err);
      return apiError(c, 500, 'Failed to delete audit schedule');
    }
  });

  // ─── POST /api/audit-schedules/generate-checklist ────────────────────────
  // Accepts: { hazard_type: string, industry_standard: string }
  // Returns: a structured checklist with items containing question + severity.
  //
  // NOTE: This route must be registered BEFORE the /:id wildcard routes so that
  //       the literal segment "generate-checklist" is matched first.
  app.post('/api/audit-schedules/generate-checklist', async (c) => {
    try {
      const body = await c.req.json();
      const parsed = GenerateChecklistSchema.safeParse(body);

      if (!parsed.success) {
        return apiError(c, 400, 'Validation failed', parsed.error.flatten());
      }

      const { hazard_type, industry_standard } = parsed.data;

      logger.info('Generating audit checklist', { hazard_type, industry_standard });

      // ─────────────────────────────────────────────────────────────────────
      // TODO: Replace the mock below with a real AI SDK call.
      //
      //   Suggested approach (OpenRouter / OpenAI-compatible):
      //
      //   import { getAIClient } from '../services/aiService';
      //   const client = getAIClient();
      //   const completion = await client.chat.completions.create({
      //     model: 'openai/gpt-4o',           // or 'google/gemini-2.0-flash'
      //     response_format: { type: 'json_object' },
      //     messages: [
      //       {
      //         role: 'system',
      //         content:
      //           'You are a safety compliance expert. Return ONLY valid JSON ' +
      //           'matching: { "items": [{ "question": string, "severity": "Low"|"Medium"|"High" }] }',
      //       },
      //       {
      //         role: 'user',
      //         content:
      //           `Generate a safety audit checklist for hazard type "${hazard_type}" ` +
      //           `following the "${industry_standard}" standard. Include 10-15 items.`,
      //       },
      //     ],
      //   });
      //   const aiResult = JSON.parse(completion.choices[0].message.content ?? '{}');
      //   items = aiResult.items ?? [];
      //
      // ─────────────────────────────────────────────────────────────────────

      const mockItems: ChecklistItem[] = [
        { question: `Have all workers been briefed on "${hazard_type}" risks?`,                 severity: _s('High')   },
        { question: `Is a current risk assessment available for "${hazard_type}"?`,             severity: _s('High')   },
        { question: `Are PPE requirements defined and enforced for "${hazard_type}"?`,          severity: _s('High')   },
        { question: `Are emergency response procedures posted for "${hazard_type}" incidents?`, severity: _s('High')   },
        { question: `Has incident reporting been completed for prior "${hazard_type}" events?`, severity: _s('Medium') },
        { question: `Are control measures reviewed annually per "${industry_standard}"?`,       severity: _s('Medium') },
        { question: `Is training current and documented per "${industry_standard}"?`,           severity: _s('Medium') },
        { question: `Are inspection records retained for the period required by "${industry_standard}"?`, severity: _s('Medium') },
        { question: `Are near-miss events related to "${hazard_type}" tracked?`,                severity: _s('Medium') },
        { question: `Is equipment used in "${hazard_type}" areas correctly labelled?`,          severity: _s('Low')    },
        { question: `Are housekeeping standards maintained in "${hazard_type}" zones?`,         severity: _s('Low')    },
        { question: `Has the last audit finding from "${industry_standard}" been closed out?`,  severity: _s('Low')    },
      ];

      const result: GeneratedChecklist = {
        hazard_type,
        industry_standard,
        items: mockItems,
      };

      logger.info('Checklist generated (mock)', {
        hazard_type,
        industry_standard,
        itemCount: mockItems.length,
      });

      return c.json({ success: true, data: result });
    } catch (err) {
      logger.error('audit-schedules generate-checklist error', err);
      return apiError(c, 500, 'Failed to generate checklist');
    }
  });
}
