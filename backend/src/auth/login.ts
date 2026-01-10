import { Hono } from 'hono';
import type { Env } from '../types/env';
import { getDb } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const loginRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /auth/login
 * Re-authenticate with device secret
 * Used when user has an existing device secret (e.g., from sample users)
 */
loginRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { deviceSecret } = body;

    if (!deviceSecret || typeof deviceSecret !== 'string') {
      return c.json({ error: 'deviceSecret is required' }, 400);
    }

    const db = getDb(c.env);
    
    // Find user by device secret
    const result = await db
      .select()
      .from(users)
      .where(eq(users.deviceSecret, deviceSecret))
      .limit(1);

    if (result.length === 0) {
      return c.json({ error: 'Invalid device secret' }, 401);
    }

    const user = result[0];

    return c.json({
      userId: user.id,
      deviceSecret: user.deviceSecret,
      friendCode: user.friendCode,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

export default loginRoutes;
