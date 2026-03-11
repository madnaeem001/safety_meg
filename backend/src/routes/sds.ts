/**
 * SDS Equipment Routes
 * Handles QR/Barcode-scannable equipment with Safety Data Sheet linkage.
 * Backend for AdvancedTechnologyHub QR Scanner tab.
 */

import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';

const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const sqlite = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = OFF');

// ── SEED DATA ─────────────────────────────────────────────────────────────
const SEED_EQUIPMENT = [
  {
    id: 'EQ001', name: 'Forklift FL-203', type: 'Material Handling',
    serial_number: 'FL2023-0203', barcode: '847509123456', qr_code: 'QR-EQ001-FL203',
    location: 'Warehouse A', department: 'Logistics',
    last_inspection: '2026-01-15', next_inspection: '2026-02-15',
    status: 'operational', linked_sds: '[]', risk_score: 32,
    manufacturer: 'Toyota', model: '8FGU25', purchase_date: '2023-03-15',
    warranty_expiry: '2026-03-15',
    maintenance_history: JSON.stringify([
      { id: 'MH001', date: '2026-01-15', type: 'inspection', description: 'Monthly safety inspection', performedBy: 'John Smith', nextDue: '2026-02-15' }
    ]),
    pending_sync: 0,
  },
  {
    id: 'EQ002', name: 'Chemical Storage Cabinet CS-12', type: 'Storage',
    serial_number: 'CS2022-0012', barcode: '847509234567', qr_code: 'QR-EQ002-CS12',
    location: 'Lab Area B', department: 'R&D',
    last_inspection: '2026-01-20', next_inspection: '2026-02-20',
    status: 'operational', linked_sds: JSON.stringify(['chem-001', 'chem-002', 'chem-003']),
    risk_score: 45, manufacturer: 'Justrite', model: '896020', purchase_date: '2022-06-10',
    warranty_expiry: null,
    maintenance_history: JSON.stringify([
      { id: 'MH002', date: '2026-01-20', type: 'inspection', description: 'Quarterly cabinet inspection', performedBy: 'Sarah Johnson', nextDue: '2026-04-20' }
    ]),
    pending_sync: 0,
  },
  {
    id: 'EQ003', name: 'Safety Harness SH-445', type: 'PPE',
    serial_number: 'SH2024-0445', barcode: '847509345678', qr_code: 'QR-EQ003-SH445',
    location: 'Construction Site', department: 'Construction',
    last_inspection: '2026-01-08', next_inspection: '2026-02-08',
    status: 'maintenance_due', linked_sds: '[]', risk_score: 68,
    manufacturer: '3M', model: 'DBI-SALA ExoFit', purchase_date: '2024-05-20',
    warranty_expiry: null,
    maintenance_history: JSON.stringify([
      { id: 'MH003', date: '2026-01-08', type: 'inspection', description: 'Monthly harness inspection - wear detected', performedBy: 'Mike Brown', nextDue: '2026-02-08', notes: 'Replace webbing before next use' }
    ]),
    pending_sync: 0,
  },
  {
    id: 'EQ004', name: 'Compressed Air System CAS-01', type: 'Pressure Vessel',
    serial_number: 'CAS2021-0001', barcode: '847509456789', qr_code: 'QR-EQ004-CAS01',
    location: 'Manufacturing Floor', department: 'Production',
    last_inspection: '2026-01-10', next_inspection: '2026-07-10',
    status: 'operational', linked_sds: '[]', risk_score: 55,
    manufacturer: 'Ingersoll Rand', model: 'UP6-15cTAS-125', purchase_date: '2021-08-12',
    warranty_expiry: null,
    maintenance_history: JSON.stringify([
      { id: 'MH004', date: '2026-01-10', type: 'inspection', description: 'Semi-annual pressure vessel inspection', performedBy: 'Tom Wilson', nextDue: '2026-07-10' }
    ]),
    pending_sync: 0,
  },
  {
    id: 'EQ005', name: 'Emergency Eye Wash Station EW-07', type: 'Safety Equipment',
    serial_number: 'EW2023-0007', barcode: '847509567890', qr_code: 'QR-EQ005-EW07',
    location: 'Lab Area C', department: 'R&D',
    last_inspection: '2026-02-01', next_inspection: '2026-02-08',
    status: 'operational', linked_sds: JSON.stringify(['chem-001', 'chem-002']),
    risk_score: 28, manufacturer: 'Haws', model: '7500', purchase_date: '2023-02-28',
    warranty_expiry: null,
    maintenance_history: JSON.stringify([
      { id: 'MH005', date: '2026-02-01', type: 'inspection', description: 'Weekly eye wash inspection', performedBy: 'Lisa Chen', nextDue: '2026-02-08' }
    ]),
    pending_sync: 0,
  },
];

function ensureSeedData() {
  try {
    const count = (sqlite.prepare('SELECT COUNT(*) as cnt FROM sds_equipment').get() as any)?.cnt ?? 0;
    if (count === 0) {
      const insert = sqlite.prepare(`
        INSERT OR IGNORE INTO sds_equipment
          (id, name, type, serial_number, barcode, qr_code, location, department,
           last_inspection, next_inspection, status, linked_sds, risk_score,
           manufacturer, model, purchase_date, warranty_expiry, maintenance_history, pending_sync)
        VALUES
          (@id, @name, @type, @serial_number, @barcode, @qr_code, @location, @department,
           @last_inspection, @next_inspection, @status, @linked_sds, @risk_score,
           @manufacturer, @model, @purchase_date, @warranty_expiry, @maintenance_history, @pending_sync)
      `);
      const insertMany = sqlite.transaction((rows: typeof SEED_EQUIPMENT) => {
        for (const row of rows) insert.run(row);
      });
      insertMany(SEED_EQUIPMENT);
    }
  } catch {
    // Table may not exist yet — init-db handles creation
  }
}

ensureSeedData();

// ── VALIDATION SCHEMAS ────────────────────────────────────────────────────

const CreateEquipmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  serialNumber: z.string().min(1).max(100),
  barcode: z.string().optional(),
  qrCode: z.string().optional(),
  location: z.string().min(1).max(200),
  department: z.string().default(''),
  lastInspection: z.string().optional(),
  nextInspection: z.string().optional(),
  status: z.enum(['operational', 'maintenance_due', 'out_of_service']).default('operational'),
  linkedSDS: z.array(z.string()).default([]),
  riskScore: z.number().int().min(0).max(100).default(0),
  manufacturer: z.string().default(''),
  model: z.string().default(''),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
});

const InspectionSchema = z.object({
  date: z.string().min(1),
  type: z.enum(['inspection', 'repair', 'calibration', 'replacement']),
  description: z.string().min(1),
  performedBy: z.string().min(1),
  nextDue: z.string().min(1),
  notes: z.string().optional(),
});

const SyncEquipmentSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    maintenanceHistory: z.array(z.any()).optional(),
    status: z.string().optional(),
    lastInspection: z.string().optional(),
    nextInspection: z.string().optional(),
  })),
});

// ── HELPERS ──────────────────────────────────────────────────────────────

function rowToEquipment(row: any) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    serialNumber: row.serial_number,
    barcode: row.barcode,
    qrCode: row.qr_code,
    location: row.location,
    department: row.department,
    lastInspection: row.last_inspection,
    nextInspection: row.next_inspection,
    status: row.status,
    linkedSDS: safeParseJSON(row.linked_sds, []),
    riskScore: row.risk_score ?? 0,
    manufacturer: row.manufacturer,
    model: row.model,
    purchaseDate: row.purchase_date,
    warrantyExpiry: row.warranty_expiry,
    maintenanceHistory: safeParseJSON(row.maintenance_history, []),
    pendingSync: row.pending_sync === 1,
    lastSyncedAt: new Date(row.updated_at * 1000).toISOString(),
  };
}

function safeParseJSON(val: any, fallback: any) {
  try { return JSON.parse(val ?? 'null') ?? fallback; } catch { return fallback; }
}

// ── ROUTES ────────────────────────────────────────────────────────────────

export const sdsRoutes = (app: Hono) => {
  /**
   * GET /api/sds/equipment
   * List all equipment, optional filters: status, location, department
   */
  app.get('/api/sds/equipment', (c) => {
    try {
      const status = c.req.query('status');
      const location = c.req.query('location');
      const department = c.req.query('department');
      const search = c.req.query('search');

      let query = 'SELECT * FROM sds_equipment WHERE 1=1';
      const params: any[] = [];

      if (status) { query += ' AND status = ?'; params.push(status); }
      if (location) { query += ' AND location LIKE ?'; params.push(`%${location}%`); }
      if (department) { query += ' AND department = ?'; params.push(department); }
      if (search) {
        query += ' AND (name LIKE ? OR location LIKE ? OR serial_number LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY name ASC';
      const rows = sqlite.prepare(query).all(...params) as any[];
      const equipment = rows.map(rowToEquipment);

      return c.json({ success: true, data: equipment, total: equipment.length }, 200);
    } catch (error) {
      console.error('[SDS] list error', error);
      return c.json({ success: false, error: 'Failed to fetch equipment' }, 500);
    }
  });

  /**
   * GET /api/sds/equipment/scan/:code
   * Look up equipment by barcode or QR code
   */
  app.get('/api/sds/equipment/scan/:code', (c) => {
    try {
      const code = c.req.param('code');

      const row = sqlite.prepare(
        'SELECT * FROM sds_equipment WHERE barcode = ? OR qr_code = ? LIMIT 1'
      ).get(code, code) as any;

      if (!row) {
        return c.json({ success: true, data: { equipment: null, linkedSDS: [] } }, 200);
      }

      const equipment = rowToEquipment(row);
      return c.json({ success: true, data: { equipment, linkedSDS: equipment.linkedSDS } }, 200);
    } catch (error) {
      console.error('[SDS] scan error', error);
      return c.json({ success: false, error: 'Failed to scan code' }, 500);
    }
  });

  /**
   * GET /api/sds/equipment/:id
   * Get single equipment by id
   */
  app.get('/api/sds/equipment/:id', (c) => {
    try {
      const id = c.req.param('id');
      const row = sqlite.prepare('SELECT * FROM sds_equipment WHERE id = ?').get(id) as any;
      if (!row) {
        return c.json({ success: false, error: 'Equipment not found' }, 404);
      }
      return c.json({ success: true, data: rowToEquipment(row) }, 200);
    } catch (error) {
      return c.json({ success: false, error: 'Failed to fetch equipment' }, 500);
    }
  });

  /**
   * POST /api/sds/equipment
   * Create new equipment
   */
  app.post('/api/sds/equipment', async (c) => {
    try {
      const body = await c.req.json();
      const data = CreateEquipmentSchema.parse(body);
      const id = data.id || `EQ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const now = Math.floor(Date.now() / 1000);

      sqlite.prepare(`
        INSERT INTO sds_equipment
          (id, name, type, serial_number, barcode, qr_code, location, department,
           last_inspection, next_inspection, status, linked_sds, risk_score,
           manufacturer, model, purchase_date, warranty_expiry, maintenance_history,
           pending_sync, created_at, updated_at)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `).run(
        id, data.name, data.type, data.serialNumber, data.barcode ?? null, data.qrCode ?? null,
        data.location, data.department, data.lastInspection ?? null, data.nextInspection ?? null,
        data.status, JSON.stringify(data.linkedSDS), data.riskScore,
        data.manufacturer, data.model, data.purchaseDate ?? null, data.warrantyExpiry ?? null,
        '[]', now, now
      );

      const row = sqlite.prepare('SELECT * FROM sds_equipment WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: rowToEquipment(row) }, 201);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return c.json({ success: false, error: 'Validation failed', issues: error.issues }, 400);
      }
      console.error('[SDS] create error', error);
      return c.json({ success: false, error: 'Failed to create equipment' }, 500);
    }
  });

  /**
   * PUT /api/sds/equipment/:id
   * Update equipment
   */
  app.put('/api/sds/equipment/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const now = Math.floor(Date.now() / 1000);

      const existing = sqlite.prepare('SELECT * FROM sds_equipment WHERE id = ?').get(id) as any;
      if (!existing) {
        return c.json({ success: false, error: 'Equipment not found' }, 404);
      }

      const allowed = ['name', 'type', 'serial_number', 'barcode', 'qr_code', 'location',
        'department', 'last_inspection', 'next_inspection', 'status', 'linked_sds',
        'risk_score', 'manufacturer', 'model', 'purchase_date', 'warranty_expiry'];

      const sets: string[] = ['updated_at = ?', 'pending_sync = 0'];
      const vals: any[] = [now];

      const fieldMap: Record<string, string> = {
        serialNumber: 'serial_number', barcode: 'barcode', qrCode: 'qr_code',
        lastInspection: 'last_inspection', nextInspection: 'next_inspection',
        linkedSDS: 'linked_sds', riskScore: 'risk_score',
        manufacturer: 'manufacturer', model: 'model',
        purchaseDate: 'purchase_date', warrantyExpiry: 'warranty_expiry',
      };

      for (const [jsKey, colName] of Object.entries(fieldMap)) {
        if (jsKey in body) {
          sets.push(`${colName} = ?`);
          vals.push(Array.isArray(body[jsKey]) ? JSON.stringify(body[jsKey]) : body[jsKey]);
        }
      }
      for (const col of ['name', 'type', 'location', 'department', 'status']) {
        if (col in body) { sets.push(`${col} = ?`); vals.push(body[col]); }
      }

      vals.push(id);
      sqlite.prepare(`UPDATE sds_equipment SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

      const row = sqlite.prepare('SELECT * FROM sds_equipment WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: rowToEquipment(row) }, 200);
    } catch (error) {
      return c.json({ success: false, error: 'Failed to update equipment' }, 500);
    }
  });

  /**
   * POST /api/sds/equipment/:id/inspection
   * Log a maintenance/inspection record for an equipment item
   */
  app.post('/api/sds/equipment/:id/inspection', async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const record = InspectionSchema.parse(body);

      const existing = sqlite.prepare('SELECT * FROM sds_equipment WHERE id = ?').get(id) as any;
      if (!existing) {
        return c.json({ success: false, error: 'Equipment not found' }, 404);
      }

      const history = safeParseJSON(existing.maintenance_history, []);
      history.push({ id: `MH-${Date.now()}`, ...record });

      const now = Math.floor(Date.now() / 1000);
      sqlite.prepare(`
        UPDATE sds_equipment
        SET maintenance_history = ?, last_inspection = ?, next_inspection = ?, updated_at = ?
        WHERE id = ?
      `).run(JSON.stringify(history), record.date, record.nextDue, now, id);

      const row = sqlite.prepare('SELECT * FROM sds_equipment WHERE id = ?').get(id) as any;
      return c.json({ success: true, data: rowToEquipment(row) }, 200);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return c.json({ success: false, error: 'Validation failed', issues: error.issues }, 400);
      }
      return c.json({ success: false, error: 'Failed to log inspection' }, 500);
    }
  });

  /**
   * POST /api/sds/equipment/import
   * Bulk-import equipment from parsed CSV data
   */
  app.post('/api/sds/equipment/import', async (c) => {
    try {
      const body = await c.req.json();
      const items: any[] = body.items ?? [];

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      const insert = sqlite.prepare(`
        INSERT OR IGNORE INTO sds_equipment
          (id, name, type, serial_number, barcode, qr_code, location, department,
           status, linked_sds, risk_score, manufacturer, model, maintenance_history,
           pending_sync, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', 0, ?, ?, '[]', 0, ?, ?)
      `);

      const now = Math.floor(Date.now() / 1000);
      const insertMany = sqlite.transaction((rows: any[]) => {
        for (const item of rows) {
          try {
            const id = item.id || `EQ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            insert.run(
              id, item.name, item.type, item.serialNumber,
              item.barcode ?? null, item.qrCode ?? null,
              item.location, item.department ?? '',
              item.status ?? 'operational',
              item.manufacturer ?? '', item.model ?? '',
              now, now
            );
            successCount++;
          } catch (err: any) {
            failedCount++;
            errors.push(err?.message ?? 'Unknown error');
          }
        }
      });

      insertMany(items);

      return c.json({ success: true, data: { success: successCount, failed: failedCount, errors } }, 200);
    } catch (error) {
      return c.json({ success: false, error: 'Import failed' }, 500);
    }
  });

  /**
   * POST /api/sds/sync
   * Receive pending equipment changes from clients (offline sync)
   */
  app.post('/api/sds/sync', async (c) => {
    try {
      const body = await c.req.json();
      const { items = [] } = SyncEquipmentSchema.parse(body);
      const now = Math.floor(Date.now() / 1000);
      let synced = 0;

      const update = sqlite.prepare(`
        UPDATE sds_equipment
        SET maintenance_history = COALESCE(?, maintenance_history),
            status = COALESCE(?, status),
            last_inspection = COALESCE(?, last_inspection),
            next_inspection = COALESCE(?, next_inspection),
            pending_sync = 0,
            updated_at = ?
        WHERE id = ?
      `);

      const syncMany = sqlite.transaction((rows: any[]) => {
        for (const item of rows) {
          const history = item.maintenanceHistory ? JSON.stringify(item.maintenanceHistory) : null;
          const result = update.run(
            history, item.status ?? null,
            item.lastInspection ?? null, item.nextInspection ?? null,
            now, item.id
          );
          if (result.changes > 0) synced++;
        }
      });

      syncMany(items);

      return c.json({ success: true, data: { synced, syncedAt: new Date().toISOString() } }, 200);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return c.json({ success: false, error: 'Validation failed', issues: error.issues }, 400);
      }
      return c.json({ success: false, error: 'Sync failed' }, 500);
    }
  });
};
