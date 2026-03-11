// backend/src/db.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './__generated__/schema';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

// LOGIC FIX: Explicitly point to the writable volume in Railway
const isProd = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProd ? '/data/local.sqlite' : 'local.sqlite';

// Ensure the directory exists before opening the database
const dbDir = dirname(dbPath);
if (dbDir !== '.' && !existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Export db as edgespark client (local SQLite implementation)
export const edgespark = db;