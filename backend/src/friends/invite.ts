import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, type AuthContext } from '../auth/middleware';
import { getDb } from '../db/client';
import { users, friendships } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const inviteRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware
inviteRoutes.use('/*', authMiddleware);

/**
 * POST /friends/invite/accept
 * Accept a friend invite using their friend code
 * Creates bidirectional friendship
 */
inviteRoutes.post('/accept', async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const db = getDb(c.env);
    
    const body = await c.req.json();
    const { friendCode } = body;
    
    if (!friendCode || typeof friendCode !== 'string') {
      return c.json({ error: 'Friend code is required' }, 400);
    }
    
    // Normalize friend code to uppercase
    const normalizedCode = friendCode.toUpperCase().trim();
    
    if (normalizedCode.length !== 8) {
      return c.json({ error: 'Friend code must be 8 characters' }, 400);
    }
    
    // Find user by friend code
    const [friend] = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        friendCode: users.friendCode,
        mode: users.mode,
      })
      .from(users)
      .where(eq(users.friendCode, normalizedCode))
      .limit(1);
    
    if (!friend) {
      return c.json({ error: 'Friend code not found' }, 404);
    }
    
    // Can't add yourself as a friend
    if (friend.id === user.id) {
      return c.json({ error: 'Cannot add yourself as a friend' }, 400);
    }
    
    // Check if friendship already exists
    const existingFriendship = await db
      .select({ id: friendships.id })
      .from(friendships)
      .where(
        and(
          eq(friendships.userId, user.id),
          eq(friendships.friendId, friend.id)
        )
      )
      .limit(1);
    
    if (existingFriendship.length > 0) {
      return c.json({ error: 'Already friends with this user' }, 400);
    }
    
    // Create bidirectional friendship
    await db.insert(friendships).values([
      { userId: user.id, friendId: friend.id },
      { userId: friend.id, friendId: user.id },
    ]);
    
    return c.json({
      success: true,
      friend: {
        id: friend.id,
        displayName: friend.displayName,
        friendCode: friend.friendCode,
        mode: friend.mode,
      },
      message: `You are now friends with ${friend.displayName || friend.friendCode}`,
    }, 201);
    
  } catch (error) {
    console.error('Friend invite error:', error);
    return c.json({ error: 'Failed to accept friend invite' }, 500);
  }
});

export default inviteRoutes;
