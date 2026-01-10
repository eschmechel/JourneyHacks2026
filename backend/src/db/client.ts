import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Database client for local development
const sqlite = new Database('.wrangler/state/v3/d1/proximity-radar-db/db.sqlite');
export const db = drizzle(sqlite, { schema });

// Type for Cloudflare Workers D1 binding
export interface Env {
  DB: D1Database;
}

// Get database client (for Workers runtime)
export function getDb(env: Env) {
  return drizzle(env.DB, { schema });
}
