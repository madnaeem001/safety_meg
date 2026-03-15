// backend/src/db.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './__generated__/schema';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { DB_PATH } from './config/env';

// Ensure the directory exists before opening the database
const dbDir = dirname(DB_PATH);
if (dbDir !== '.' && !existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

export const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
export const db = drizzle(sqlite, { schema });

// Export db as edgespark client (local SQLite implementation)
export const edgespark = db;

/**
 * Returns the shared singleton SQLite connection.
 * Route modules that previously called `new Database(dbPath)` inside handlers
 * should call this instead to avoid opening many file handles.
 */
export function getSharedDb(): Database.Database {
  return sqlite;
}