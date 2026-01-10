import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, type AuthContext } from '../auth/middleware';
import { getDb } from '../db/client';
import { users, friendships } from '../db/schema';
import { eq } from 'drizzle-orm';

const friendsRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware
friendsRoutes.use('/*', authMiddleware);

/**
 * GET /friends
 * Get list of all friends with their details
 */
friendsRoutes.get('/', async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const db = getDb(c.env);
    
    // Get all friendships and join with user details
    const friendList = await db
      .select()
      .from(friendships)
      .innerJoin(users, eq(friendships.friendId, users.id))
      .where(eq(friendships.userId, user.id));
    
    // Map to clean friend objects
    const friends = friendList.map(row => ({
      id: row.users.id,
      displayName: row.users.displayName,
      friendCode: row.users.friendCode,
      mode: row.users.mode,
      radiusMeters: row.users.radiusMeters,
    }));
    
    return c.json({
      friends,
      count: friends.length,
    });
    
  } catch (error) {
    console.error('Friends list error:', error);
    return c.json({ error: 'Failed to fetch friends' }, 500);
  }
});

export default friendsRoutes;
