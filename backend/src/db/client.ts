import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Database client for local development
const sqlite = new Database('.wrangler/state/v3/d1/proximity-radar-db/db.sqlite');
export const db = drizzle(sqlite, { schema });

// Type for Cloudflare Workers D1 binding
export interface Env {
  DB: D1Database | ReturnType<typeof drizzle>;
}

// Get database client (for Workers runtime or local dev)
export function getDb(env: Env) {
  // Check if it's a D1Database or already a drizzle instance
  if ('batch' in env.DB && 'prepare' in env.DB && typeof (env.DB as any).batch === 'function') {
    // It's a D1Database
    return drizzleD1(env.DB as D1Database, { schema });
  }
  // It's already a drizzle instance (local dev with better-sqlite3)
  return env.DB as ReturnType<typeof drizzle>;
}
