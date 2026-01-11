import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import * as schema from './schema';

// Type for Cloudflare Workers D1 binding
export interface Env {
  DB: D1Database;
}

// Get database client for Workers runtime
export function getDb(env: Env) {
  return drizzleD1(env.DB, { schema });
}
