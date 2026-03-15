import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { createLogger } from '../services/logger';
import { DB_PATH } from '../config/env';

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');

const logger = createLogger('Assets');

// ── VALIDATION SCHEMAS ────────────────────────────────────────────────────

const CreateAssetSchema = z.object({
  assetName: z.string().min(1).max(200),
  assetType: z.enum(['Machine', 'Vehicle', 'Tool', 'Safety Equipment', 'Infrastructure']),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  department: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  purchaseDate: z.string().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'critical']).default('good'),
  status: z.enum(['active', 'maintenance', 'decommissioned']).default('active'),
  owner: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateAssetSchema = CreateAssetSchema.partial();

const MaintenanceSchema = z.object({
  maintenanceDate: z.string(),
  maintenanceType: z.enum(['preventive', 'corrective', 'emergency', 'inspection']),
  performedBy: z.string().optional(),
  notes: z.string().optional(),
  cost: z.number().optional(),
  nextDueDate: z.string().optional(),
});

// ── HELPERS ───────────────────────────────────────────────────────────────

function generateAssetCode(): string {
  const n = (sqlite.prepare('SELECT COUNT(*) as n FROM assets').get() as any).n + 1;
  return `ASSET-${String(n).padStart(5, '0')}`;
}

function now(): number { return Date.now(); }

export const assetRoutes = (app: Hono) => {

  /**
   * GET /api/assets
   * List all assets with optional filters
   */
  app.get('/api/assets', (c) => {
    try {
      const type = c.req.query('type');
      const location = c.req.query('location');
      const status = c.req.query('status');
      const department = c.req.query('department');
      const condition = c.req.query('condition');
      const search = c.req.query('search');

      let query = 'SELECT * FROM assets WHERE 1=1';
      const params: any[] = [];
      if (type) { query += ' AND asset_type = ?'; params.push(type); }
      if (location) { query += ' AND location LIKE ?'; params.push(`%${location}%`); }
      if (status) { query += ' AND status = ?'; params.push(status); }
      if (department) { query += ' AND department = ?'; params.push(department); }
      if (condition) { query += ' AND condition = ?'; params.push(condition); }
      if (search) { query += ' AND (asset_name LIKE ? OR asset_code LIKE ? OR serial_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      query += ' ORDER BY created_at DESC';

      const rows = sqlite.prepare(query).all(...params) as any[];
      const data = rows.map((r: any) => mapAsset(r));

      const summary = {
        total: data.length,
        active: data.filter((r: any) => r.status === 'active').length,
        maintenance: data.filter((r: any) => r.status === 'maintenance').length,
        decommissioned: data.filter((r: any) => r.status === 'decommissioned').length,
        dueForMaintenance: data.filter((r: any) => {
          if (!r.nextMaintenanceDue) return false;
          return new Date(r.nextMaintenanceDue) <= new Date();
        }).length,
      };

      return c.json({ success: true, data, summary, count: data.length }, 200);
    } catch (error) {
      logger.error('Error listing assets', { error });
      return c.json({ success: false, error: 'Failed to list assets' }, 500);
    }
  });

  /**
   * POST /api/assets
   * Register a new asset (auto-generates assetCode and qrCode)
   */
  app.post('/api/assets', async (c) => {
    try {
      const body = await c.req.json();
      const v = CreateAssetSchema.parse(body);
      const assetCode = generateAssetCode();
      const qrCode = `QR-${randomUUID()}`;

      const result = sqlite.prepare(`
        INSERT INTO assets (asset_code, asset_name, asset_type, serial_number, qr_code,
          location, department, manufacturer, model, purchase_date,
          condition, status, owner, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        assetCode, v.assetName, v.assetType, v.serialNumber ?? null, qrCode,
        v.location ?? null, v.department ?? null, v.manufacturer ?? null, v.model ?? null,
        v.purchaseDate ?? null, v.condition, v.status, v.owner ?? null, v.notes ?? null
      );

      logger.info('Asset registered', { id: result.lastInsertRowid, assetCode });
      return c.json({ success: true, data: { id: result.lastInsertRowid, assetCode, qrCode, assetName: v.assetName } }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error creating asset', { error });
      return c.json({ success: false, error: 'Failed to register asset' }, 500);
    }
  });

  /**
   * GET /api/assets/scan/:qrCode
   * Look up an asset by QR code — MUST be before /:assetId
   */
  app.get('/api/assets/scan/:qrCode', (c) => {
    try {
      const qrCode = c.req.param('qrCode');
      const asset = sqlite.prepare('SELECT * FROM assets WHERE qr_code = ?').get(qrCode) as any;
      if (!asset) return c.json({ success: false, error: 'Asset not found for this QR code' }, 404);

      const lastMaintenance = sqlite.prepare(
        'SELECT * FROM asset_maintenance WHERE asset_id = ? ORDER BY maintenance_date DESC LIMIT 1'
      ).get(asset.id) as any;

      return c.json({
        success: true,
        data: {
          ...mapAsset(asset),
          lastMaintenanceRecord: lastMaintenance ? mapMaintenance(lastMaintenance) : null,
        }
      }, 200);
    } catch (error) {
      logger.error('Error scanning QR code', { error });
      return c.json({ success: false, error: 'Failed to scan QR code' }, 500);
    }
  });

  /**
   * GET /api/assets/:assetId
   * Full asset detail with maintenance history
   */
  app.get('/api/assets/:assetId', (c) => {
    try {
      const id = parseInt(c.req.param('assetId'), 10);
      const asset = sqlite.prepare('SELECT * FROM assets WHERE id = ?').get(id) as any;
      if (!asset) return c.json({ success: false, error: 'Asset not found' }, 404);

      const maintenanceHistory = sqlite.prepare(
        'SELECT * FROM asset_maintenance WHERE asset_id = ? ORDER BY maintenance_date DESC LIMIT 5'
      ).all(id) as any[];

      return c.json({
        success: true,
        data: {
          ...mapAsset(asset),
          maintenanceHistory: maintenanceHistory.map(mapMaintenance),
        }
      }, 200);
    } catch (error) {
      logger.error('Error fetching asset', { error });
      return c.json({ success: false, error: 'Failed to fetch asset' }, 500);
    }
  });

  /**
   * PUT /api/assets/:assetId
   * Update an asset
   */
  app.put('/api/assets/:assetId', async (c) => {
    try {
      const id = parseInt(c.req.param('assetId'), 10);
      const existing = sqlite.prepare('SELECT id FROM assets WHERE id = ?').get(id);
      if (!existing) return c.json({ success: false, error: 'Asset not found' }, 404);

      const body = await c.req.json();
      const v = UpdateAssetSchema.parse(body);

      const fields: string[] = [];
      const params: any[] = [];
      if (v.assetName !== undefined) { fields.push('asset_name = ?'); params.push(v.assetName); }
      if (v.assetType !== undefined) { fields.push('asset_type = ?'); params.push(v.assetType); }
      if (v.serialNumber !== undefined) { fields.push('serial_number = ?'); params.push(v.serialNumber); }
      if (v.location !== undefined) { fields.push('location = ?'); params.push(v.location); }
      if (v.department !== undefined) { fields.push('department = ?'); params.push(v.department); }
      if (v.manufacturer !== undefined) { fields.push('manufacturer = ?'); params.push(v.manufacturer); }
      if (v.model !== undefined) { fields.push('model = ?'); params.push(v.model); }
      if (v.purchaseDate !== undefined) { fields.push('purchase_date = ?'); params.push(v.purchaseDate); }
      if (v.condition !== undefined) { fields.push('condition = ?'); params.push(v.condition); }
      if (v.status !== undefined) { fields.push('status = ?'); params.push(v.status); }
      if (v.owner !== undefined) { fields.push('owner = ?'); params.push(v.owner); }
      if (v.notes !== undefined) { fields.push('notes = ?'); params.push(v.notes); }

      if (fields.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400);
      fields.push('updated_at = ?'); params.push(now());
      params.push(id);

      sqlite.prepare(`UPDATE assets SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const updated = sqlite.prepare('SELECT * FROM assets WHERE id = ?').get(id) as any;

      return c.json({ success: true, data: mapAsset(updated) }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error updating asset', { error });
      return c.json({ success: false, error: 'Failed to update asset' }, 500);
    }
  });

  /**
   * DELETE /api/assets/:assetId
   * Soft-decommission an asset (sets status = 'decommissioned')
   */
  app.delete('/api/assets/:assetId', (c) => {
    try {
      const id = parseInt(c.req.param('assetId'), 10);
      const existing = sqlite.prepare('SELECT id, status FROM assets WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Asset not found' }, 404);
      if (existing.status === 'decommissioned') return c.json({ success: false, error: 'Asset is already decommissioned' }, 400);

      sqlite.prepare(`UPDATE assets SET status = 'decommissioned', updated_at = ? WHERE id = ?`).run(now(), id);
      logger.info('Asset decommissioned', { id });

      return c.json({ success: true, message: 'Asset decommissioned successfully', data: { id } }, 200);
    } catch (error) {
      logger.error('Error decommissioning asset', { error });
      return c.json({ success: false, error: 'Failed to decommission asset' }, 500);
    }
  });

  /**
   * POST /api/assets/:assetId/qr
   * Generate or regenerate QR code for an asset
   */
  app.post('/api/assets/:assetId/qr', (c) => {
    try {
      const id = parseInt(c.req.param('assetId'), 10);
      const existing = sqlite.prepare('SELECT id, asset_code FROM assets WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Asset not found' }, 404);

      const qrCode = `QR-${randomUUID()}`;
      sqlite.prepare('UPDATE assets SET qr_code = ?, updated_at = ? WHERE id = ?').run(qrCode, now(), id);

      logger.info('QR code regenerated', { id, qrCode });
      return c.json({ success: true, data: { id, assetCode: existing.asset_code, qrCode } }, 200);
    } catch (error) {
      logger.error('Error generating QR code', { error });
      return c.json({ success: false, error: 'Failed to generate QR code' }, 500);
    }
  });

  /**
   * POST /api/assets/:assetId/maintenance
   * Log a maintenance record and update asset maintenance dates
   */
  app.post('/api/assets/:assetId/maintenance', async (c) => {
    try {
      const assetId = parseInt(c.req.param('assetId'), 10);
      const asset = sqlite.prepare('SELECT id FROM assets WHERE id = ?').get(assetId);
      if (!asset) return c.json({ success: false, error: 'Asset not found' }, 404);

      const body = await c.req.json();
      const v = MaintenanceSchema.parse(body);

      const result = sqlite.prepare(`
        INSERT INTO asset_maintenance (asset_id, maintenance_date, maintenance_type, performed_by, notes, cost, next_due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(assetId, v.maintenanceDate, v.maintenanceType, v.performedBy ?? null, v.notes ?? null, v.cost ?? null, v.nextDueDate ?? null);

      // Update asset's maintenance dates
      sqlite.prepare(`
        UPDATE assets SET last_maintenance_date = ?, next_maintenance_due = ?, updated_at = ? WHERE id = ?
      `).run(v.maintenanceDate, v.nextDueDate ?? null, now(), assetId);

      logger.info('Maintenance logged', { assetId, id: result.lastInsertRowid });
      return c.json({
        success: true,
        data: {
          id: result.lastInsertRowid,
          assetId,
          maintenanceDate: v.maintenanceDate,
          maintenanceType: v.maintenanceType,
          nextDueDate: v.nextDueDate,
        }
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error logging maintenance', { error });
      return c.json({ success: false, error: 'Failed to log maintenance' }, 500);
    }
  });

  /**
   * GET /api/assets/:assetId/maintenance
   * Full maintenance history for an asset
   */
  app.get('/api/assets/:assetId/maintenance', (c) => {
    try {
      const assetId = parseInt(c.req.param('assetId'), 10);
      const asset = sqlite.prepare('SELECT id, asset_name, asset_code FROM assets WHERE id = ?').get(assetId) as any;
      if (!asset) return c.json({ success: false, error: 'Asset not found' }, 404);

      const rows = sqlite.prepare(
        'SELECT * FROM asset_maintenance WHERE asset_id = ? ORDER BY maintenance_date DESC'
      ).all(assetId) as any[];

      return c.json({
        success: true,
        data: rows.map(mapMaintenance),
        count: rows.length,
        asset: { id: asset.id, name: asset.asset_name, code: asset.asset_code },
      }, 200);
    } catch (error) {
      logger.error('Error fetching maintenance history', { error });
      return c.json({ success: false, error: 'Failed to fetch maintenance history' }, 500);
    }
  });
};

// ── MAPPERS ───────────────────────────────────────────────────────────────

function mapAsset(r: any) {
  return {
    id: r.id,
    assetCode: r.asset_code,
    assetName: r.asset_name,
    assetType: r.asset_type,
    serialNumber: r.serial_number,
    qrCode: r.qr_code,
    location: r.location,
    department: r.department,
    manufacturer: r.manufacturer,
    model: r.model,
    purchaseDate: r.purchase_date,
    lastMaintenanceDate: r.last_maintenance_date,
    nextMaintenanceDue: r.next_maintenance_due,
    condition: r.condition,
    status: r.status,
    owner: r.owner,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapMaintenance(r: any) {
  return {
    id: r.id,
    assetId: r.asset_id,
    maintenanceDate: r.maintenance_date,
    maintenanceType: r.maintenance_type,
    performedBy: r.performed_by,
    notes: r.notes,
    cost: r.cost,
    nextDueDate: r.next_due_date,
    createdAt: r.created_at,
  };
}
