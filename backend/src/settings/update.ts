import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, type AuthContext } from '../auth/middleware';
import { getDb } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const settingsRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all /me routes
settingsRoutes.use('/*', authMiddleware);

/**
 * PUT /me/settings
 * Update user settings (mode, displayName, radiusMeters)
 */
settingsRoutes.put('/settings', async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    // Validate input
    const updates: Partial<typeof users.$inferInsert> = {};
    
    if (body.mode !== undefined) {
      if (!['OFF', 'FRIENDS'].includes(body.mode)) {
        return c.json({ error: 'Invalid mode. Must be OFF or FRIENDS' }, 400);
      }
      updates.mode = body.mode;
    }
    
    if (body.displayName !== undefined) {
      if (typeof body.displayName !== 'string' || body.displayName.length > 100) {
        return c.json({ error: 'Invalid displayName. Must be string <= 100 chars' }, 400);
      }
      updates.displayName = body.displayName || null;
    }
    
    if (body.radiusMeters !== undefined) {
      const radius = parseInt(body.radiusMeters);
      if (isNaN(radius) || radius < 100 || radius > 5000) {
        return c.json({ error: 'Invalid radiusMeters. Must be 100-5000' }, 400);
      }
      updates.radiusMeters = radius;
    }
    
    if (Object.keys(updates).length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }
    
    const db = getDb(c.env);
    
    // Update user settings
    await db.update(users)
      .set(updates)
      .where(eq(users.id, user.id));
    
    // Fetch updated user
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    
    return c.json({
      id: updatedUser.id,
      displayName: updatedUser.displayName,
      mode: updatedUser.mode,
      radiusMeters: updatedUser.radiusMeters,
      friendCode: updatedUser.friendCode,
    });
    
  } catch (error) {
    console.error('Settings update error:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

/**
 * GET /me/settings
 * Fetch current user settings
 */
settingsRoutes.get('/settings', async (c: AuthContext) => {
  try {
    const user = c.get('user');
    
    return c.json({
      id: user.id,
      displayName: user.displayName,
      mode: user.mode,
      radiusMeters: user.radiusMeters,
      friendCode: user.friendCode,
    });
    
  } catch (error) {
    console.error('Settings fetch error:', error);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

export default settingsRoutes;
