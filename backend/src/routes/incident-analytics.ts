/**
 * Incident Analytics Routes
 *
 * Aggregation endpoints that power the IncidentTrendAnalytics page.
 * All queries run against the live `incidents` table.
 *
 * Endpoints:
 *   GET /api/incident-analytics/kpis               — KPI summary (totals, TRIR, ratio, % change)
 *   GET /api/incident-analytics/monthly-trend       — monthly breakdown by type (last N months)
 *   GET /api/incident-analytics/weekly-trend        — week-of-month breakdown for given month
 *   GET /api/incident-analytics/by-type             — incident counts per canonical type bucket
 *   GET /api/incident-analytics/by-severity         — incident counts per severity label
 *   GET /api/incident-analytics/by-department       — per-department breakdown + trend direction
 *   GET /api/incident-analytics/by-day-of-week      — Mon–Sun count + average
 *   GET /api/incident-analytics/by-time-of-day      — 6-hour slot count + percentage
 *   GET /api/incident-analytics/root-causes         — keyword-matched root cause distribution
 *   GET /api/incident-analytics/leading-indicators  — computed leading KPIs from incident data
 */

import { Hono } from 'hono';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const DB_PATH = isProdRoute ? '/data/local.sqlite' : path.join(__dirname, '../../local.sqlite');

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF');
  return db;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  'Injuries': '#ef4444',
  'Near Misses': '#f59e0b',
  'Property Damage': '#3b82f6',
  'Environmental': '#22c55e',
  'Fire/Explosion': '#f97316',
  'Vehicle': '#8b5cf6',
  'Other': '#94a3b8',
};

const SEV_COLORS: Record<string, string> = {
  'Critical': '#dc2626',
  'High': '#f97316',
  'Medium': '#eab308',
  'Low': '#22c55e',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map raw incidentType text to a canonical chart bucket. */
function bucketType(type: string): 'injuries' | 'nearMisses' | 'propertyDamage' | 'environmental' | 'fire' | 'vehicle' | 'other' {
  const t = (type || '').toLowerCase().trim();
  if (t.includes('injury') || t === 'first aid' || t.includes('lost time') || t.includes('fatality') || t.includes('recordable')) return 'injuries';
  if (t === 'near miss') return 'nearMisses';
  if (t.includes('property')) return 'propertyDamage';
  if (t.includes('environmental') || t.includes('spill')) return 'environmental';
  if (t.includes('fire') || t.includes('explosion')) return 'fire';
  if (t.includes('vehicle') || t.includes('contractor incident') && t.includes('vehicle')) return 'vehicle';
  return 'other';
}

const BUCKET_LABEL: Record<string, string> = {
  injuries: 'Injuries',
  nearMisses: 'Near Misses',
  propertyDamage: 'Property Damage',
  environmental: 'Environmental',
  fire: 'Fire/Explosion',
  vehicle: 'Vehicle',
  other: 'Other',
};

/** Compute fromDate string for a given timeRange label. */
function fromDateForRange(range: string): string {
  const now = new Date();
  if (range === 'week') { now.setDate(now.getDate() - 7); }
  else if (range === 'month') { now.setMonth(now.getMonth() - 1); }
  else if (range === 'year') { now.setFullYear(now.getFullYear() - 1); }
  else { now.setMonth(now.getMonth() - 6); } // '6months' default
  return now.toISOString().split('T')[0];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** Shift a date string backward by `ms` milliseconds. */
function shiftDate(dateStr: string, ms: number): string {
  return new Date(new Date(dateStr).getTime() - ms).toISOString().split('T')[0];
}

// ── Route Factory ─────────────────────────────────────────────────────────────

export function incidentAnalyticsRoutes(app: Hono) {

  // ── GET /api/incident-analytics/kpis ────────────────────────────────────────
  app.get('/api/incident-analytics/kpis', (c) => {
    const db = getDb();
    try {
      const timeRange = c.req.query('timeRange') || '6months';
      const fromDate  = c.req.query('fromDate') || fromDateForRange(timeRange);
      const toDate    = c.req.query('toDate')   || todayStr();

      const durationMs = new Date(toDate).getTime() - new Date(fromDate).getTime();
      const prevFrom   = shiftDate(fromDate, durationMs);

      const INJURY_SQL = `LOWER(incident_type) LIKE '%injury%'
              OR LOWER(incident_type) LIKE '%fatal%'
              OR LOWER(incident_type) LIKE '%lost time%'
              OR incident_type = 'First Aid'
              OR LOWER(incident_type) LIKE '%recordable%'`;

      const cur = db.prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN ${INJURY_SQL} THEN 1 ELSE 0 END) AS injuries,
          SUM(CASE WHEN incident_type = 'Near Miss' THEN 1 ELSE 0 END) AS near_misses
        FROM incidents
        WHERE incident_date >= ? AND incident_date <= ?
      `).get(fromDate, toDate) as any;

      const prev = db.prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN ${INJURY_SQL} THEN 1 ELSE 0 END) AS injuries
        FROM incidents
        WHERE incident_date >= ? AND incident_date < ?
      `).get(prevFrom, fromDate) as any;

      const totalIncidents = cur.total   || 0;
      const totalInjuries  = cur.injuries || 0;
      const nearMisses     = cur.near_misses || 0;

      const nearMissRatio  = totalInjuries > 0
        ? parseFloat((nearMisses / totalInjuries).toFixed(1))
        : nearMisses;

      // TRIR = recordable injuries × 200,000 / total hours worked
      // Approximate: 200 employees × 40 hrs/wk × weeks-in-period
      const periodWeeks  = Math.max(1, durationMs / (7 * 24 * 60 * 60 * 1000));
      const assumedHours = 200 * 40 * periodWeeks;
      const trir = parseFloat(((totalInjuries * 200000) / assumedHours).toFixed(1));

      const prevTotal    = prev.total    || 0;
      const prevInjuries = prev.injuries || 0;

      const incidentChange = prevTotal > 0
        ? parseFloat(((totalIncidents - prevTotal) / prevTotal * 100).toFixed(1))
        : 0;
      const injuryChange = prevInjuries > 0
        ? parseFloat(((totalInjuries - prevInjuries) / prevInjuries * 100).toFixed(1))
        : 0;

      return c.json({
        success: true,
        data: {
          totalIncidents,
          totalInjuries,
          nearMissRatio,
          trir,
          trirChange: 0,   // would need historical TRIR storage to compute accurately
          incidentChange,
          injuryChange,
        }
      });
    } finally {
      db.close();
    }
  });

  // ── GET /api/incident-analytics/monthly-trend ────────────────────────────────
  app.get('/api/incident-analytics/monthly-trend', (c) => {
    const db = getDb();
    try {
      const months = Math.min(24, Math.max(1, parseInt(c.req.query('months') || '7')));

      const rows = db.prepare(`
        SELECT
          strftime('%Y-%m', incident_date) AS ym,
          incident_type
        FROM incidents
        WHERE incident_date >= date('now', ? || ' months')
        ORDER BY ym ASC
      `).all(`-${months}`) as Array<{ ym: string; incident_type: string }>;

      const map = new Map<string, Record<string, number>>();
      for (const row of rows) {
        if (!map.has(row.ym)) {
          map.set(row.ym, { injuries: 0, nearMisses: 0, propertyDamage: 0, environmental: 0, fire: 0, vehicle: 0, other: 0 });
        }
        const bucket = bucketType(row.incident_type);
        map.get(row.ym)![bucket]++;
      }

      const data = Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([ym, counts]) => {
          const [year, month] = ym.split('-');
          const label = new Date(parseInt(year), parseInt(month) - 1, 1)
            .toLocaleString('en-US', { month: 'short', year: 'numeric' });
          const total = Object.values(counts).reduce((s, v) => s + v, 0);
          return { month: label, ...counts, total };
        });

      return c.json({ success: true, data });
    } finally {
      db.close();
    }
  });

  // ── GET /api/incident-analytics/weekly-trend ─────────────────────────────────
  app.get('/api/incident-analytics/weekly-trend', (c) => {
    const db = getDb();
    try {
      const now   = new Date();
      const year  = c.req.query('year')  || now.getFullYear().toString();
      const month = (c.req.query('month') || (now.getMonth() + 1).toString()).padStart(2, '0');
      const ym    = `${year}-${month}`;

      const rows = db.prepare(`
        SELECT
          CAST(strftime('%d', incident_date) AS INTEGER) AS dom,
          incident_type
        FROM incidents
        WHERE strftime('%Y-%m', incident_date) = ?
        ORDER BY incident_date ASC
      `).all(ym) as Array<{ dom: number; incident_type: string }>;

      const weeks = [
        { week: 'Week 1', injuries: 0, nearMisses: 0, total: 0 },
        { week: 'Week 2', injuries: 0, nearMisses: 0, total: 0 },
        { week: 'Week 3', injuries: 0, nearMisses: 0, total: 0 },
        { week: 'Week 4', injuries: 0, nearMisses: 0, total: 0 },
      ];

      for (const row of rows) {
        const wi = Math.min(Math.floor((row.dom - 1) / 7), 3);
        weeks[wi].total++;
        const b = bucketType(row.incident_type);
        if (b === 'injuries')   weeks[wi].injuries++;
        if (b === 'nearMisses') weeks[wi].nearMisses++;
      }

      return c.json({ success: true, data: weeks });
    } finally {
      db.close();
    }
  });

  // ── GET /api/incident-analytics/by-type ──────────────────────────────────────
  app.get('/api/incident-analytics/by-type', (c) => {
    const db = getDb();
    try {
      const timeRange = c.req.query('timeRange') || '6months';
      const fromDate  = c.req.query('fromDate') || fromDateForRange(timeRange);
      const toDate    = c.req.query('toDate')   || todayStr();

      const rows = db.prepare(`
        SELECT incident_type, COUNT(*) AS cnt
        FROM incidents
        WHERE incident_date >= ? AND incident_date <= ?
        GROUP BY incident_type
        ORDER BY cnt DESC
      `).all(fromDate, toDate) as Array<{ incident_type: string; cnt: number }>;

      // Aggregate into canonical buckets
      const buckets: Record<string, number> = {
        injuries: 0, nearMisses: 0, propertyDamage: 0,
        environmental: 0, fire: 0, vehicle: 0, other: 0,
      };
      for (const r of rows) {
        buckets[bucketType(r.incident_type)] += r.cnt;
      }

      const data = Object.entries(buckets)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: BUCKET_LABEL[k], value: v, color: TYPE_COLORS[BUCKET_LABEL[k]] || '#94a3b8' }));

      return c.json({ success: true, data });
    } finally {
      db.close();
    }
  });

  // ── GET /api/incident-analytics/by-severity ──────────────────────────────────
  app.get('/api/incident-analytics/by-severity', (c) => {
    const db = getDb();
    try {
      const timeRange = c.req.query('timeRange') || '6months';
      const fromDate  = c.req.query('fromDate') || fromDateForRange(timeRange);
      const toDate    = c.req.query('toDate')   || todayStr();

      const rows = db.prepare(`
        SELECT severity, COUNT(*) AS cnt
        FROM incidents
        WHERE incident_date >= ? AND incident_date <= ?
        GROUP BY severity
        ORDER BY CASE severity
          WHEN 'Critical' THEN 1 WHEN 'High' THEN 2
          WHEN 'Medium'   THEN 3 WHEN 'Low'  THEN 4 ELSE 5
        END
      `).all(fromDate, toDate) as Array<{ severity: string; cnt: number }>;

      const data = rows.map(r => ({
        name: r.severity,
        value: r.cnt,
        color: SEV_COLORS[r.severity] || '#94a3b8',
      }));

      return c.json({ success: true, data });
    } finally {
      db.close();
    }
  });

  // ── GET /api/incident-analytics/by-department ────────────────────────────────
  app.get('/api/incident-analytics/by-department', (c) => {
    const db = getDb();
    try {
      const timeRange = c.req.query('timeRange') || '6months';
      const fromDate  = c.req.query('fromDate') || fromDateForRange(timeRange);
      const toDate    = c.req.query('toDate')   || todayStr();

      const durationMs = new Date(toDate).getTime() - new Date(fromDate).getTime();
      const prevFrom   = shiftDate(fromDate, durationMs);

      const INJURY_SQL = `LOWER(incident_type) LIKE '%injury%' OR incident_type = 'First Aid' OR LOWER(incident_type) LIKE '%recordable%'`;

      const current = db.prepare(`
        SELECT
          COALESCE(NULLIF(TRIM(department), ''), 'General') AS dept,
          COUNT(*) AS total,
          SUM(CASE WHEN ${INJURY_SQL} THEN 1 ELSE 0 END) AS injuries,
          SUM(CASE WHEN incident_type = 'Near Miss' THEN 1 ELSE 0 END) AS near_misses
        FROM incidents
        WHERE incident_date >= ? AND incident_date <= ?
        GROUP BY dept
        ORDER BY total DESC
      `).all(fromDate, toDate) as Array<{ dept: string; total: number; injuries: number; near_misses: number }>;

      const prev = db.prepare(`
        SELECT
          COALESCE(NULLIF(TRIM(department), ''), 'General') AS dept,
          COUNT(*) AS total
        FROM incidents
        WHERE incident_date >= ? AND incident_date < ?
        GROUP BY dept
      `).all(prevFrom, fromDate) as Array<{ dept: string; total: number }>;

      const prevMap = new Map(prev.map(r => [r.dept, r.total]));

      const data = current.map(r => {
        const p = prevMap.get(r.dept) || 0;
        const trend = p === 0 ? 'stable' : r.total > p ? 'up' : r.total < p ? 'down' : 'stable';
        return { department: r.dept, incidents: r.total, injuries: r.injuries, nearMisses: r.near_misses, trend };
      });

      return c.json({ success: true, data });
    } finally {
      db.close();
    }
  });

  // ── GET /api/incident-analytics/by-day-of-week ───────────────────────────────
  app.get('/api/incident-analytics/by-day-of-week', (c) => {
    const db = getDb();
    try {
      const timeRange = c.req.query('timeRange') || '6months';
      const fromDate  = c.req.query('fromDate') || fromDateForRange(timeRange);
      const toDate    = c.req.query('toDate')   || todayStr();

      const rows = db.prepare(`
        SELECT strftime('%w', incident_date) AS dow, COUNT(*) AS cnt
        FROM incidents
        WHERE incident_date >= ? AND incident_date <= ?
        GROUP BY dow
        ORDER BY CAST(dow AS INTEGER)
      `).all(fromDate, toDate) as Array<{ dow: string; cnt: number }>;

      const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dowMap    = new Map(rows.map(r => [r.dow, r.cnt]));
      const durationDays = Math.max(1, (new Date(toDate).getTime() - new Date(fromDate).getTime()) / (24 * 60 * 60 * 1000));
      const weeks = Math.max(1, durationDays / 7);

      const data = DAY_NAMES.map((day, idx) => {
        const incidents = dowMap.get(idx.toString()) || 0;
        return { day, incidents, average: parseFloat((incidents / weeks).toFixed(1)) };
      });

      return c.json({ success: true, data });
    } finally {
      db.close();
    }
  });

  // ── GET /api/incident-analytics/by-time-of-day ───────────────────────────────
  app.get('/api/incident-analytics/by-time-of-day', (c) => {
    const db = getDb();
    try {
      const timeRange = c.req.query('timeRange') || '6months';
      const fromDate  = c.req.query('fromDate') || fromDateForRange(timeRange);
      const toDate    = c.req.query('toDate')   || todayStr();

      const rows = db.prepare(`
        SELECT
          CAST(substr(incident_time, 1, 2) AS INTEGER) AS hr,
          COUNT(*) AS cnt
        FROM incidents
        WHERE incident_date >= ? AND incident_date <= ?
          AND incident_time IS NOT NULL AND TRIM(incident_time) != ''
        GROUP BY hr
        ORDER BY hr
      `).all(fromDate, toDate) as Array<{ hr: number; cnt: number }>;

      const SLOTS = [
        { time: '6-9 AM',   min: 6,  max: 8  },
        { time: '9-12 PM',  min: 9,  max: 11 },
        { time: '12-3 PM',  min: 12, max: 14 },
        { time: '3-6 PM',   min: 15, max: 17 },
        { time: '6-9 PM',   min: 18, max: 20 },
        { time: '9-12 AM',  min: 21, max: 23 },
      ];

      const slotCounts = SLOTS.map(s => ({
        time: s.time,
        incidents: rows.filter(r => r.hr >= s.min && r.hr <= s.max).reduce((sum, r) => sum + r.cnt, 0),
      }));

      const total = slotCounts.reduce((sum, s) => sum + s.incidents, 0);
      const data  = slotCounts.map(s => ({
        time: s.time,
        incidents: s.incidents,
        percentage: total > 0 ? parseFloat(((s.incidents / total) * 100).toFixed(1)) : 0,
      }));

      return c.json({ success: true, data });
    } finally {
      db.close();
    }
  });

  // ── GET /api/incident-analytics/root-causes ──────────────────────────────────
  app.get('/api/incident-analytics/root-causes', (c) => {
    const db = getDb();
    try {
      const timeRange = c.req.query('timeRange') || '6months';
      const fromDate  = c.req.query('fromDate') || fromDateForRange(timeRange);
      const toDate    = c.req.query('toDate')   || todayStr();

      const rows = db.prepare(`
        SELECT root_causes
        FROM incidents
        WHERE incident_date >= ? AND incident_date <= ?
          AND root_causes IS NOT NULL AND TRIM(root_causes) != ''
      `).all(fromDate, toDate) as Array<{ root_causes: string }>;

      const CATEGORIES = [
        { cause: 'Human Error',       kw: ['human', 'error', 'mistake', 'distraction', 'negligence', 'worker', 'behavior', 'fatigue'] },
        { cause: 'Equipment Failure', kw: ['equipment', 'failure', 'malfunction', 'breakdown', 'mechanical', 'defect', 'maintenance'] },
        { cause: 'Process Gap',       kw: ['process', 'procedure', 'gap', 'protocol', 'system', 'standard', 'communication'] },
        { cause: 'Environmental',     kw: ['weather', 'environment', 'slippery', 'wet', 'visibility', 'heat', 'cold', 'lighting', 'noise'] },
        { cause: 'Training Gap',      kw: ['training', 'untrained', 'awareness', 'knowledge', 'skill', 'competency', 'experience'] },
      ];

      const counts = CATEGORIES.map(cat => ({ cause: cat.cause, count: 0 }));
      let unmatched = 0;

      for (const row of rows) {
        const text = (row.root_causes || '').toLowerCase();
        let matched = false;
        CATEGORIES.forEach((cat, i) => {
          if (cat.kw.some(kw => text.includes(kw))) {
            counts[i].count++;
            matched = true;
          }
        });
        if (!matched) unmatched++;
      }

      if (unmatched > 0) counts.push({ cause: 'Other', count: unmatched });

      const nonZero = counts.filter(c => c.count > 0);
      const grand   = nonZero.reduce((s, c) => s + c.count, 0);
      const data    = nonZero.map(c => ({
        cause: c.cause,
        count: c.count,
        percentage: grand > 0 ? Math.round((c.count / grand) * 100) : 0,
      }));

      return c.json({ success: true, data });
    } finally {
      db.close();
    }
  });

  // ── GET /api/incident-analytics/leading-indicators ───────────────────────────
  app.get('/api/incident-analytics/leading-indicators', (c) => {
    const db = getDb();
    try {
      const timeRange = c.req.query('timeRange') || '6months';
      const fromDate  = c.req.query('fromDate') || fromDateForRange(timeRange);
      const toDate    = c.req.query('toDate')   || todayStr();

      const INJURY_SQL = `LOWER(incident_type) LIKE '%injury%' OR incident_type = 'First Aid' OR LOWER(incident_type) LIKE '%recordable%' OR LOWER(incident_type) LIKE '%fatal%' OR LOWER(incident_type) LIKE '%lost time%'`;

      const s = db.prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN ${INJURY_SQL} THEN 1 ELSE 0 END) AS injuries,
          SUM(CASE WHEN incident_type = 'Near Miss' THEN 1 ELSE 0 END) AS near_misses,
          SUM(CASE WHEN root_causes     IS NOT NULL AND TRIM(root_causes)     != '' THEN 1 ELSE 0 END) AS with_rc,
          SUM(CASE WHEN corrective_actions IS NOT NULL AND TRIM(corrective_actions) != '' THEN 1 ELSE 0 END) AS with_ca,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed_cnt
        FROM incidents
        WHERE incident_date >= ? AND incident_date <= ?
      `).get(fromDate, toDate) as any;

      const total      = s.total      || 0;
      const injuries   = s.injuries   || 0;
      const nearMisses = s.near_misses || 0;
      const rcCoverage = total > 0 ? Math.round((s.with_rc   / total) * 100) : 0;
      const cARate     = total > 0 ? Math.round((s.with_ca   / total) * 100) : 0;
      const closeRate  = total > 0 ? Math.round((s.closed_cnt / total) * 100) : 0;
      const nmRatio    = injuries > 0 ? parseFloat((nearMisses / injuries).toFixed(1)) : nearMisses;

      const trend = (v: number, target: number) =>
        v >= target ? 'up' : v >= target * 0.7 ? 'stable' : 'down';

      const data = [
        { name: 'Near Miss Ratio',       current: nmRatio,    target: 3.0, trend: trend(nmRatio, 3.0),    unit: 'per injury' },
        { name: 'Root Cause Coverage',   current: rcCoverage, target: 100, trend: trend(rcCoverage, 80),  unit: '%' },
        { name: 'Corrective Action Rate',current: cARate,     target: 95,  trend: trend(cARate, 85),      unit: '%' },
        { name: 'Hazard Close Rate',     current: closeRate,  target: 85,  trend: trend(closeRate, 85),   unit: '%' },
      ];

      return c.json({ success: true, data });
    } finally {
      db.close();
    }
  });
}
