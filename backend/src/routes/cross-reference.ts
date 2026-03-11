import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }

function safeJson(val: any): any {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

function mapRelationship(row: any) {
  return {
    id: row.id,
    sourceStandardId: row.source_standard_id,
    targetStandardId: row.target_standard_id,
    relationshipType: row.relationship_type,
    mappedClauses: safeJson(row.mapped_clauses),
    integrationNotes: row.integration_notes ?? '',
    synergies: safeJson(row.synergies),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const CreateRelationshipSchema = z.object({
  sourceStandardId: z.string().min(1),
  targetStandardId: z.string().min(1),
  relationshipType: z.enum(['compatible', 'integrated', 'prerequisite', 'complementary', 'overlapping']),
  mappedClauses: z.array(z.object({
    sourceClauses: z.array(z.string()),
    targetClauses: z.array(z.string()),
    description: z.string(),
  })).optional().default([]),
  integrationNotes: z.string().optional().default(''),
  synergies: z.array(z.string()).optional().default([]),
});

const UpdateRelationshipSchema = CreateRelationshipSchema.partial();

export function crossReferenceRoutes(app: Hono) {

  // GET /api/cross-reference/stats
  app.get('/api/cross-reference/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) as cnt FROM standard_relationships').get() as any).cnt;
      const typeRows = db.prepare(
        'SELECT relationship_type, COUNT(*) as count FROM standard_relationships GROUP BY relationship_type'
      ).all() as Array<{ relationship_type: string; count: number }>;
      const byType: Record<string, number> = {};
      for (const r of typeRows) byType[r.relationship_type] = r.count;
      const standards = db.prepare(
        `SELECT DISTINCT source_standard_id AS sid FROM standard_relationships
         UNION SELECT DISTINCT target_standard_id FROM standard_relationships`
      ).all() as Array<{ sid: string }>;
      return c.json({
        success: true,
        data: { total, byType, uniqueStandards: standards.length },
      });
    } finally { db.close(); }
  });

  // GET /api/cross-reference/relationships
  app.get('/api/cross-reference/relationships', (c) => {
    const db = getDb();
    try {
      const { type, sourceId, targetId, search } = c.req.query();
      let sql = 'SELECT * FROM standard_relationships WHERE 1=1';
      const params: any[] = [];
      if (type) { sql += ' AND relationship_type = ?'; params.push(type); }
      if (sourceId) { sql += ' AND source_standard_id = ?'; params.push(sourceId); }
      if (targetId) { sql += ' AND target_standard_id = ?'; params.push(targetId); }
      if (search) {
        sql += ' AND (source_standard_id LIKE ? OR target_standard_id LIKE ? OR integration_notes LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
      }
      sql += ' ORDER BY id ASC';
      const rows = db.prepare(sql).all(...params).map(mapRelationship);
      return c.json({ success: true, data: rows, total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/cross-reference/relationships
  app.post('/api/cross-reference/relationships', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateRelationshipSchema.parse(body);
      const now = Date.now();
      const result = db.prepare(`
        INSERT INTO standard_relationships
          (source_standard_id, target_standard_id, relationship_type, mapped_clauses, integration_notes, synergies, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        parsed.sourceStandardId,
        parsed.targetStandardId,
        parsed.relationshipType,
        JSON.stringify(parsed.mappedClauses),
        parsed.integrationNotes,
        JSON.stringify(parsed.synergies),
        now,
        now,
      );
      const created = db.prepare('SELECT * FROM standard_relationships WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapRelationship(created) }, 201);
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ success: false, error: 'Validation failed', details: err.errors }, 400);
      throw err;
    } finally { db.close(); }
  });

  // GET /api/cross-reference/relationships/:id
  app.get('/api/cross-reference/relationships/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const row = db.prepare('SELECT * FROM standard_relationships WHERE id = ?').get(id);
      if (!row) return c.json({ success: false, error: 'Relationship not found' }, 404);
      return c.json({ success: true, data: mapRelationship(row) });
    } finally { db.close(); }
  });

  // PUT /api/cross-reference/relationships/:id
  app.put('/api/cross-reference/relationships/:id', async (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const existing = db.prepare('SELECT * FROM standard_relationships WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Relationship not found' }, 404);
      const body = await c.req.json();
      const parsed = UpdateRelationshipSchema.parse(body);
      const now = Date.now();
      const fields: string[] = [];
      const params: any[] = [];
      if (parsed.sourceStandardId !== undefined) { fields.push('source_standard_id = ?'); params.push(parsed.sourceStandardId); }
      if (parsed.targetStandardId !== undefined) { fields.push('target_standard_id = ?'); params.push(parsed.targetStandardId); }
      if (parsed.relationshipType !== undefined) { fields.push('relationship_type = ?'); params.push(parsed.relationshipType); }
      if (parsed.mappedClauses !== undefined) { fields.push('mapped_clauses = ?'); params.push(JSON.stringify(parsed.mappedClauses)); }
      if (parsed.integrationNotes !== undefined) { fields.push('integration_notes = ?'); params.push(parsed.integrationNotes); }
      if (parsed.synergies !== undefined) { fields.push('synergies = ?'); params.push(JSON.stringify(parsed.synergies)); }
      fields.push('updated_at = ?'); params.push(now);
      params.push(id);
      db.prepare(`UPDATE standard_relationships SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM standard_relationships WHERE id = ?').get(id);
      return c.json({ success: true, data: mapRelationship(updated) });
    } catch (err: any) {
      if (err?.name === 'ZodError') return c.json({ success: false, error: 'Validation failed', details: err.errors }, 400);
      throw err;
    } finally { db.close(); }
  });

  // DELETE /api/cross-reference/relationships/:id
  app.delete('/api/cross-reference/relationships/:id', (c) => {
    const db = getDb();
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);
      const existing = db.prepare('SELECT id FROM standard_relationships WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Relationship not found' }, 404);
      db.prepare('DELETE FROM standard_relationships WHERE id = ?').run(id);
      return c.json({ success: true, message: 'Deleted successfully' });
    } finally { db.close(); }
  });
}
