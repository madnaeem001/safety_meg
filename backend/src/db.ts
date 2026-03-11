// backend/src/db.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './__generated__/schema';

export const sqlite = new Database('local.sqlite');
export const db = drizzle(sqlite, { schema });

// Export db as edgespark client (local SQLite implementation)
export const edgespark = db;