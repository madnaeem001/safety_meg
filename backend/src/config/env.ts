/**
 * Centralized Environment Configuration
 *
 * All environment variables are validated here at startup using Zod.
 * Routes must import from this module instead of reading process.env directly.
 * If a required variable is missing the process exits immediately.
 */

import { z } from 'zod';

const EnvSchema = z.object({
  // ── Runtime ──────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8787),

  // ── Auth ─────────────────────────────────────────────────────────────────
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security'),

  // ── AI ───────────────────────────────────────────────────────────────────
  OPENROUTER_API_KEY: z.string().optional(),

  // ── Email ────────────────────────────────────────────────────────────────
  RESEND_API_KEY: z.string().optional(),

  // ── Deployment ───────────────────────────────────────────────────────────
  RAILWAY_ENVIRONMENT: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(),
});

function loadEnv() {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(
      `\n[ENV] ❌ Environment validation failed — server cannot start safely:\n${issues}\n`
    );
    process.exit(1);
  }

  const data = result.data;

  // Warn in production if placeholder secrets are detected (allow in dev/test)
  if (data.NODE_ENV === 'production' || data.RAILWAY_ENVIRONMENT) {
    const PLACEHOLDER_PATTERNS = ['safetymeg-jwt-secret', 'change-in-production', 'placeholder'];
    if (PLACEHOLDER_PATTERNS.some((p) => data.JWT_SECRET.includes(p))) {
      console.error(
        '\n[ENV] ❌ CRITICAL: JWT_SECRET contains a placeholder value. ' +
          'Set a strong secret in your production environment variables.\n'
      );
      process.exit(1);
    }
  }

  return data;
}

export const env = loadEnv();

// Convenience derived values
export const isProd =
  env.NODE_ENV === 'production' || !!env.RAILWAY_ENVIRONMENT;

export const DB_PATH = isProd ? '/data/local.sqlite' : 'local.sqlite';
