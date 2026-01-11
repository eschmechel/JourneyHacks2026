/**
 * Cloudflare Workers environment bindings
 */
export interface Env {
  DB: D1Database;
  API_RATE_LIMITER: {
    limit: (options: { key: string }) => Promise<{ success: boolean }>;
  };
}
