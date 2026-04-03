/**
 * Worker process entrypoint.
 *
 * Run this as a separate process alongside the API server:
 *   tsx src/workers/start-workers.ts
 *
 * Required environment variables:
 *   REDIS_URL  — e.g. redis://localhost:6379  or  rediss://user:pass@host:6380
 *
 * Optional:
 *   AUDIT_SCHEDULER_INTERVAL_MS  — tick interval in ms (default: 60000)
 */

import 'dotenv/config';
import { initializeDatabase } from '../init-db';
import { AuditSchedulerWorker } from './audit-scheduler.worker';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error('[start-workers] ❌  REDIS_URL environment variable is required');
  process.exit(1);
}

// Ensure all DB tables (including audit_schedules / audit_instances) exist.
initializeDatabase();

const schedulerWorker = new AuditSchedulerWorker(REDIS_URL);

schedulerWorker.start().catch((err) => {
  console.error('[start-workers] ❌  Failed to start AuditSchedulerWorker:', err);
  process.exit(1);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  console.log(`[start-workers] ${signal} received — shutting down gracefully...`);
  try {
    await schedulerWorker.stop();
    process.exit(0);
  } catch (err) {
    console.error('[start-workers] Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
