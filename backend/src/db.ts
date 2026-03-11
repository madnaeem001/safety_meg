// backend/src/db.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './__generated__/schema';

// Use Railway Volume path if DATABASE_URL is set, otherwise fallback to local
const dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace('file:', '')
  : 'local.sqlite';

export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Export db as edgespark client (local SQLite implementation)
export const edgespark = db;