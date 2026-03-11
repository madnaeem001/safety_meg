/**
 * Geotag Routes
 * Handles GPS-tagged safety records and facility zone management.
 * Backend for AdvancedTechnologyHub Geotag tab.
 */

import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';

const sqlite = new Database('local.sqlite');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = OFF');

// ── SEED DATA ─────────────────────────────────────────────────────────────
const SEED_ZONES = [
  {
    id: 'ZONE001',
    name: 'Warehouse A',
    description: 'Main warehouse storage area',
    polygon: JSON.stringify([
      { lat: 37.7750, lng: -122.4195 }, { lat: 37.7755, lng: -122.4195 },
      { lat: 37.7755, lng: -122.4185 }, { lat: 37.7750, lng: -122.4185 },
    ]),
    risk_level: 'medium',
    department: 'Logistics',
    requires_ppe: JSON.stringify(['hard hat', 'safety vest', 'steel-toed boots']),
    hazard_types: JSON.stringify(['forklift traffic', 'heavy machinery', 'falling objects']),
  },
  {
    id: 'ZONE002',
    name: 'Lab Area B',
    description: 'Chemical research and testing laboratory',
    polygon: JSON.stringify([
      { lat: 37.7760, lng: -122.4195 }, { lat: 37.7765, lng: -122.4195 },
      { lat: 37.7765, lng: -122.4185 }, { lat: 37.7760, lng: -122.4185 },
    ]),
    risk_level: 'high',
    department: 'R&D',
    requires_ppe: JSON.stringify(['lab coat', 'safety goggles', 'chemical gloves', 'face shield']),
    hazard_types: JSON.stringify(['chemical exposure', 'fire risk', 'biohazard']),
  },
  {
    id: 'ZONE003',
    name: 'Manufacturing Floor',
    description: 'Production and assembly area',
    polygon: JSON.stringify([
      { lat: 37.7740, lng: -122.4195 }, { lat: 37.7745, lng: -122.4195 },
      { lat: 37.7745, lng: -122.4185 }, { lat: 37.7740, lng: -122.4185 },
    ]),
    risk_level: 'high',
    department: 'Production',
    requires_ppe: JSON.stringify(['hard hat', 'safety vest', 'hearing protection', 'safety glasses']),
    hazard_types: JSON.stringify(['machinery', 'noise', 'electrical hazards', 'ergonomic risks']),
  },
  {
    id: 'ZONE004',
    name: 'Construction Site',
    description: 'Active construction and renovation zone',
    polygon: JSON.stringify([
      { lat: 37.7730, lng: -122.4195 }, { lat: 37.7735, lng: -122.4195 },
      { lat: 37.7735, lng: -122.4185 }, { lat: 37.7730, lng: -122.4185 },
    ]),
    risk_level: 'critical',
    department: 'Construction',
    requires_ppe: JSON.stringify(['hard hat', 'high-vis vest', 'safety harness', 'steel-toed boots', 'gloves']),
    hazard_types: JSON.stringify(['fall risk', 'struck by', 'electrical', 'excavation']),
  },
  {
    id: 'ZONE005',
    name: 'Office Area',
    description: 'Administrative offices and break room',
    polygon: JSON.stringify([
      { lat: 37.7770, lng: -122.4195 }, { lat: 37.7775, lng: -122.4195 },
      { lat: 37.7775, lng: -122.4185 }, { lat: 37.7770, lng: -122.4185 },
    ]),
    risk_level: 'low',
    department: 'Administration',
    requires_ppe: JSON.stringify([]),
    hazard_types: JSON.stringify(['ergonomic risks', 'slip and fall']),
  },
];

function ensureZoneSeed() {
  try {
    const count = (sqlite.prepare('SELECT COUNT(*) as cnt FROM facility_zones').get() as any)?.cnt ?? 0;
    if (count === 0) {
      const now = Math.floor(Date.now() / 1000);
      const insert = sqlite.prepare(`
        INSERT OR IGNORE INTO facility_zones
          (id, name, description, polygon, risk_level, department, requires_ppe, hazard_types, created_at)
        VALUES (@id, @name, @description, @polygon, @risk_level, @department, @requires_ppe, @hazard_types, ${now})
      `);
      const insertMany = sqlite.transaction((rows: typeof SEED_ZONES) => {
        for (const row of rows) insert.run(row);
      });
      insertMany(SEED_ZONES);
    }
  } catch {
    // Table may not exist yet — init-db handles creation
  }
}

ensureZoneSeed();

// ── VALIDATION SCHEMAS ────────────────────────────────────────────────────

const GeotagSchema = z.object({
  id: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  altitude: z.number().optional(),
  zone: z.string().optional(),
  facilityArea: z.string().optional(),
  address: z.string().optional(),
  recordType: z.enum(['incident', 'observation', 'inspection', 'hazard', 'near_miss', 'manual']),
  linkedRecordId: z.string().optional(),
  linkedRecordType: z.string().optional(),
  notes: z.string().optional(),
  capturedBy: z.string().optional(),
  syncStatus: z.enum(['pending', 'synced', 'error']).default('synced'),
  timestamp: z.string().optional(),
});

const BatchSyncSchema = z.object({
  geotags: z.array(GeotagSchema),
});

// ── HELPERS ──────────────────────────────────────────────────────────────

function safeParseJSON(val: any, fallback: any) {
  try { return JSON.parse(val ?? 'null') ?? fallback; } catch { return fallback; }
}

function rowToGeotag(row: any) {
  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracy: row.accuracy,
    altitude: row.altitude,
    zone: row.zone,
    facilityArea: row.facility_area,
    address: row.address,
    recordType: row.record_type,
    linkedRecordId: row.linked_record_id,
    linkedRecordType: row.linked_record_type,
    notes: row.notes,
    capturedBy: row.captured_by,
    syncStatus: row.sync_status,
    timestamp: row.timestamp,
    capturedAt: row.captured_at ? new Date(row.captured_at * 1000).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at * 1000).toISOString() : null,
  };
}

function rowToZone(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    polygon: safeParseJSON(row.polygon, []),
    riskLevel: row.risk_level,
    department: row.department,
    requiresPPE: safeParseJSON(row.requires_ppe, []),
    hazardTypes: safeParseJSON(row.hazard_types, []),
    createdAt: row.created_at ? new Date(row.created_at * 1000).toISOString() : null,
  };
}

// ── ROUTES ────────────────────────────────────────────────────────────────

export const geotagRoutes = (app: Hono) => {
  /**
   * GET /api/geotags
   * List geotags with optional filters: recordType, zone, syncStatus, limit/offset
   */
  app.get('/api/geotags', (c) => {
    try {
      const recordType = c.req.query('recordType');
      const zone = c.req.query('zone');
      const syncStatus = c.req.query('syncStatus');
      const limit = Math.min(parseInt(c.req.query('limit') ?? '100'), 500);
      const offset = parseInt(c.req.query('offset') ?? '0');

      let query = 'SELECT * FROM geotags WHERE 1=1';
      const params: any[] = [];

      if (recordType) { query += ' AND record_type = ?'; params.push(recordType); }
      if (zone) { query += ' AND zone = ?'; params.push(zone); }
      if (syncStatus) { query += ' AND sync_status = ?'; params.push(syncStatus); }

      query += ' ORDER BY captured_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const rows = sqlite.prepare(query).all(...params) as any[];
      const geotags = rows.map(rowToGeotag);

      const total = (sqlite.prepare(
        'SELECT COUNT(*) as cnt FROM geotags WHERE 1=1' +
        (recordType ? ' AND record_type = ?' : '') +
        (zone ? ' AND zone = ?' : '') +
        (syncStatus ? ' AND sync_status = ?' : '')
      ).get(...params.slice(0, params.length - 2)) as any)?.cnt ?? 0;

      return c.json({ success: true, data: geotags, total, limit, offset }, 200);
    } catch (error) {
      console.error('[Geotag] list error', error);
      return c.json({ success: false, error: 'Failed to fetch geotags' }, 500);
    }
  });

  /**
   * POST /api/geotags
   * Save a single geotag
   */
  app.post('/api/geotags', async (c) => {
    try {
      const body = await c.req.json();
      const data = GeotagSchema.parse(body);
      const id = data.id || `GT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const nowTs = Math.floor(Date.now() / 1000);

      sqlite.prepare(`
        INSERT OR REPLACE INTO geotags
          (id, latitude, longitude, accuracy, altitude, zone, facility_area, address,
           record_type, linked_record_id, linked_record_type, notes, captured_by,
           sync_status, timestamp, captured_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)
      `).run(
        id, data.latitude, data.longitude, data.accuracy ?? null, data.altitude ?? null,
        data.zone ?? null, data.facilityArea ?? null, data.address ?? null,
        data.recordType,
        data.linkedRecordId ?? null, data.linkedRecordType ?? null,
        data.notes ?? null, data.capturedBy ?? null,
        data.timestamp ?? new Date().toISOString(), nowTs, nowTs
      );

      const row = sqlite.prepare('SELECT * FROM geotags WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: rowToGeotag(row) }, 201);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return c.json({ success: false, error: 'Validation failed', issues: error.issues }, 400);
      }
      console.error('[Geotag] save error', error);
      return c.json({ success: false, error: 'Failed to save geotag' }, 500);
    }
  });

  /**
   * POST /api/geotags/sync
   * Batch sync pending geotags from offline clients
   */
  app.post('/api/geotags/sync', async (c) => {
    try {
      const body = await c.req.json();
      const { geotags } = BatchSyncSchema.parse(body);

      const nowTs = Math.floor(Date.now() / 1000);
      const results: { id: string; status: string }[] = [];

      const upsert = sqlite.prepare(`
        INSERT OR REPLACE INTO geotags
          (id, latitude, longitude, accuracy, altitude, zone, facility_area, address,
           record_type, linked_record_id, linked_record_type, notes, captured_by,
           sync_status, timestamp, captured_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, COALESCE(
          (SELECT created_at FROM geotags WHERE id = ?), ?
        ))
      `);

      const syncAll = sqlite.transaction((items: typeof geotags) => {
        for (const gt of items) {
          const id = gt.id || `GT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          try {
            upsert.run(
              id, gt.latitude, gt.longitude, gt.accuracy ?? null, gt.altitude ?? null,
              gt.zone ?? null, gt.facilityArea ?? null, gt.address ?? null,
              gt.recordType,
              gt.linkedRecordId ?? null, gt.linkedRecordType ?? null,
              gt.notes ?? null, gt.capturedBy ?? null,
              gt.timestamp ?? new Date().toISOString(), nowTs,
              id, nowTs
            );
            results.push({ id, status: 'synced' });
          } catch (err) {
            results.push({ id, status: 'error' });
          }
        }
      });

      syncAll(geotags);

      const synced = results.filter(r => r.status === 'synced').length;
      const failed = results.filter(r => r.status === 'error').length;

      return c.json({ success: true, data: { synced, failed, results, syncedAt: new Date().toISOString() } }, 200);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return c.json({ success: false, error: 'Validation failed', issues: error.issues }, 400);
      }
      console.error('[Geotag] sync error', error);
      return c.json({ success: false, error: 'Sync failed' }, 500);
    }
  });

  /**
   * GET /api/geotags/zones
   * Return all facility zones
   */
  app.get('/api/geotags/zones', (c) => {
    try {
      const rows = sqlite.prepare('SELECT * FROM facility_zones ORDER BY name ASC').all() as any[];
      return c.json({ success: true, data: rows.map(rowToZone) }, 200);
    } catch (error) {
      console.error('[Geotag] zones error', error);
      return c.json({ success: false, error: 'Failed to fetch zones' }, 500);
    }
  });
};
