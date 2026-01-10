import type { Context, Next } from 'hono';
import { verifyDeviceSecret } from './simple-auth';
import { getDb } from '../db/client';
import type { Env } from '../types/env';
import type { users } from '../db/schema';

// Extend Hono's context to include authenticated user
export type AuthContext = Context<{
  Bindings: Env;
  Variables: {
    user: typeof users.$inferSelect;
  };
}>;

/**
 * Authentication middleware
 * Checks Authorization: Bearer <deviceSecret> header
 * Verifies device secret and attaches user to context
 */
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authorization = c.req.header('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, 401);
  }

  const deviceSecret = authorization.substring(7); // Remove "Bearer " prefix

  if (!deviceSecret) {
    return c.json({ error: 'Unauthorized: Empty device secret' }, 401);
  }

  const db = getDb(c.env);
  const user = await verifyDeviceSecret(db, deviceSecret);

  if (!user) {
    return c.json({ error: 'Unauthorized: Invalid device secret' }, 401);
  }

  // Attach user to context for downstream handlers
  c.set('user', user);

  await next();
}
