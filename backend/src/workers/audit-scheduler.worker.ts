/**
 * AuditSchedulerWorker
 *
 * A BullMQ worker that fires on a repeatable tick (default: every 60 s).
 * On each tick it:
 *  1. Queries the DB for every active AuditSchedule whose next_run_at <= now.
 *  2. Wraps each schedule in a SQLite transaction that:
 *       a. Inserts a new AuditInstance (status = 'pending').
 *       b. Parses the rrule_string to calculate the next recurrence.
 *       c. Updates last_run_at / next_run_at on the schedule.
 *     If the transaction throws, the schedule is left unchanged and will be
 *     retried on the next tick.
 *  3. Logs a summary of succeeded / failed schedules.
 *
 * Usage:
 *   const worker = new AuditSchedulerWorker(process.env.REDIS_URL!);
 *   await worker.start();
 */

import { Worker, Queue, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import type { RRule as RRuleType } from 'rrule';
import { getSharedDb } from '../db';
import { createLogger } from '../services/logger';

// ioredis requires maxRetriesPerRequest: null for BullMQ compatibility.
// Use createRequire so rrule's CJS build is loaded correctly in this ESM project.
const _require = createRequire(import.meta.url);
const { RRule } = _require('rrule') as { RRule: typeof RRuleType };

const log = createLogger('AuditSchedulerWorker');

// ─── Constants ───────────────────────────────────────────────────────────────

const QUEUE_NAME = 'audit-scheduler';

/** How often the repeatable tick fires (milliseconds). Override via env. */
const TICK_EVERY_MS = Number(process.env.AUDIT_SCHEDULER_INTERVAL_MS) || 60_000;

// ─── Internal types ───────────────────────────────────────────────────────────

interface DueSchedule {
  id: string;
  title: string;
  site_id: number;
  rrule_string: string;
  next_run_at: number;
  created_by: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse an rrule string and return the first occurrence strictly after `after`.
 * Returns null if the rule has no future occurrences or the string is malformed.
 */
function calcNextRunDate(rruleString: string, after: Date): Date | null {
  try {
    // RRule.fromString accepts "RRULE:FREQ=..." or bare "FREQ=..."
    const normalized = rruleString.startsWith('RRULE:')
      ? rruleString
      : `RRULE:${rruleString}`;
    const rule = RRule.fromString(normalized);
    return rule.after(after, false); // false = exclusive (strictly after)
  } catch (err) {
    log.error('Failed to parse rrule_string', err, { rruleString });
    return null;
  }
}

// ─── Job processor ───────────────────────────────────────────────────────────

/**
 * Processes a single scheduler tick.
 * Called by BullMQ — the `job` argument is provided but intentionally unused
 * because the work item is discovered from the DB, not the job payload.
 */
async function processAuditSchedulerTick(_job: Job): Promise<void> {
  const db = getSharedDb();
  const now = Date.now();

  // Fetch every active schedule that is due (next_run_at <= now).
  const dueSchedules = db
    .prepare<[number], DueSchedule>(
      `SELECT id, title, site_id, rrule_string, next_run_at, created_by
         FROM audit_schedules
        WHERE is_active = 1
          AND next_run_at IS NOT NULL
          AND next_run_at <= ?`
    )
    .all(now);

  if (dueSchedules.length === 0) {
    log.debug('No due audit schedules', { checkedAt: new Date(now).toISOString() });
    return;
  }

  log.info(`Found ${dueSchedules.length} due audit schedule(s)`);

  // Prepare statements once and reuse them inside the transaction.
  const insertInstance = db.prepare<[string, string, number, number, number]>(`
    INSERT INTO audit_instances (id, schedule_id, site_id, triggered_at, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `);

  const updateSchedule = db.prepare<[number, number | null, number, string]>(`
    UPDATE audit_schedules
       SET last_run_at = ?,
           next_run_at = ?,
           updated_at  = ?
     WHERE id = ?
  `);

  /**
   * Atomic unit of work for a single schedule.
   * SQLite rolls back both writes if an exception is thrown.
   */
  const runScheduleTx = db.transaction((schedule: DueSchedule) => {
    const instanceId = randomUUID();
    const triggeredAt = now;
    const nextDate = calcNextRunDate(schedule.rrule_string, new Date(schedule.next_run_at));

    insertInstance.run(instanceId, schedule.id, schedule.site_id, triggeredAt, now);
    updateSchedule.run(
      triggeredAt,                             // last_run_at
      nextDate ? nextDate.getTime() : null,    // next_run_at — null means no more occurrences
      now,                                     // updated_at
      schedule.id
    );

    return { instanceId, nextDate };
  });

  let succeeded = 0;
  let failed = 0;

  for (const schedule of dueSchedules) {
    try {
      const { instanceId, nextDate } = runScheduleTx(schedule) as {
        instanceId: string;
        nextDate: Date | null;
      };

      log.info('Audit instance created', {
        scheduleId: schedule.id,
        scheduleTitle: schedule.title,
        instanceId,
        nextRunAt: nextDate
          ? nextDate.toISOString()
          : 'no further occurrences — schedule will be deactivated by next review',
      });

      succeeded++;
    } catch (err) {
      // Transaction was rolled back — the schedule record is unchanged.
      // The next tick will pick it up again.
      log.error('Transaction failed — schedule unchanged', err, {
        scheduleId: schedule.id,
        scheduleTitle: schedule.title,
      });
      failed++;
    }
  }

  log.info('Audit scheduler tick complete', {
    succeeded,
    failed,
    total: dueSchedules.length,
    checkedAt: new Date(now).toISOString(),
  });
}

// ─── Worker class ─────────────────────────────────────────────────────────────

export class AuditSchedulerWorker {
  private readonly redis: IORedis;
  private readonly queue: Queue;
  private readonly worker: Worker;

  constructor(redisUrl: string) {
    this.redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: null, // required by BullMQ
      enableReadyCheck: false,
    });

    this.queue = new Queue(QUEUE_NAME, { connection: this.redis });

    this.worker = new Worker(QUEUE_NAME, processAuditSchedulerTick, {
      connection: this.redis,
      // concurrency=1 prevents two ticks running concurrently and double-firing
      // the same schedule row.
      concurrency: 1,
    });

    this.worker.on('completed', (job) => {
      log.info('Tick job completed', { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      log.error('Tick job failed', err, { jobId: job?.id });
    });

    this.worker.on('error', (err) => {
      log.error('Worker connection error', err);
    });
  }

  /**
   * Register the repeatable tick job and begin processing.
   *
   * BullMQ deduplicates repeatable jobs by their `jobId`, so calling
   * `start()` on multiple instances (e.g. after a restart) is safe.
   */
  async start(): Promise<void> {
    await this.queue.add(
      'tick',
      {},
      {
        repeat: { every: TICK_EVERY_MS },
        // Stable jobId prevents duplicate repeatable jobs accumulating in Redis.
        jobId: 'audit-scheduler-tick',
      }
    );

    log.info('AuditSchedulerWorker started', {
      queue: QUEUE_NAME,
      tickEveryMs: TICK_EVERY_MS,
    });
  }

  /** Drain in-flight jobs then cleanly close connections. */
  async stop(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    await this.redis.quit();
    log.info('AuditSchedulerWorker stopped');
  }
}
