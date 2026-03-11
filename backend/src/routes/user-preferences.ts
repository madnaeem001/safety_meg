/**
 * User Preferences Routes
 *
 * Stores per-user application preferences (currently: preferred language).
 * All routes require a valid JWT in the Authorization header.
 *
 * Routes:
 *   GET  /api/user-preferences  — return saved preferences for the calling user
 *   PUT  /api/user-preferences  — upsert preferences for the calling user
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { resolve } from 'path';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProdRoute ? '/data/local.sqlite' : resolve(process.cwd(), 'local.sqlite');
function getDb() { return new Database(dbPath); }
const now = () => Math.floor(Date.now() / 1000);

const JWT_SECRET = process.env.JWT_SECRET || 'safetymeg-jwt-secret-2025-change-in-production';

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr'] as const;

// ── Schema ────────────────────────────────────────────────────────────────────

function ensureSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id            INTEGER NOT NULL UNIQUE,
      preferred_language TEXT    NOT NULL DEFAULT 'en',
      updated_at         INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);
}

let _initialized = false;
function initOnce() {
  if (_initialized) return;
  _initialized = true;
  const db = getDb();
  try { ensureSchema(db); } finally { db.close(); }
}

// ── Validation ────────────────────────────────────────────────────────────────

const UpdateSchema = z.object({
  preferredLanguage: z.enum(SUPPORTED_LANGUAGES, {
    message: `preferredLanguage must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`,
  }),
});

// ── Auth helper ───────────────────────────────────────────────────────────────

async function extractUserId(authHeader: string | undefined): Promise<number | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const payload: any = await verify(authHeader.slice(7), JWT_SECRET);
    return typeof payload?.userId === 'number' ? payload.userId : null;
  } catch {
    return null;
  }
}

// ── Route Registration ────────────────────────────────────────────────────────

export function userPreferencesRoutes(app: Hono) {
  initOnce();

  /**
   * GET /api/user-preferences
   * Returns the calling user's saved preferences.
   * If no record exists yet, returns the defaults.
   */
  app.get('/api/user-preferences', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const db = getDb();
    try {
      ensureSchema(db);
      const row = db.prepare(
        'SELECT preferred_language FROM user_preferences WHERE user_id = ?'
      ).get(userId) as any;

      return c.json({
        success: true,
        data: {
          preferredLanguage: row?.preferred_language ?? 'en',
        },
      });
    } finally {
      db.close();
    }
  });

  /**
   * PUT /api/user-preferences
   * Upserts the calling user's preferences.
   * Body: { preferredLanguage: 'en' | 'es' | 'fr' }
   */
  app.put('/api/user-preferences', async (c) => {
    const userId = await extractUserId(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    let v: z.infer<typeof UpdateSchema>;
    try {
      v = UpdateSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: err.issues }, 400);
      }
      throw err;
    }

    const db = getDb();
    try {
      ensureSchema(db);
      db.prepare(`
        INSERT INTO user_preferences (user_id, preferred_language, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          preferred_language = excluded.preferred_language,
          updated_at         = excluded.updated_at
      `).run(userId, v.preferredLanguage, now());

      return c.json({
        success: true,
        data: { preferredLanguage: v.preferredLanguage },
      });
    } finally {
      db.close();
    }
  });
}
