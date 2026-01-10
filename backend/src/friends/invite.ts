import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, type AuthContext } from '../auth/middleware';
import { getDb } from '../db/client';
import { users, friendships, friendRequests } from '../db/schema';
import { eq, and, or } from 'drizzle-orm';

const inviteRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware
inviteRoutes.use('/*', authMiddleware);

/**
 * POST /friends/invite/send
 * Send a friend request using their friend code
 * Creates a pending friend request
 */
inviteRoutes.post('/send', async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const db = getDb(c.env);
    
    const body = await c.req.json();
    const { friendCode } = body;
    
    if (!friendCode || typeof friendCode !== 'string') {
      return c.json({ error: 'Friend code is required' }, 400);
    }
    
    const normalizedCode = friendCode.toUpperCase().trim();
    
    if (normalizedCode.length !== 8) {
      return c.json({ error: 'Friend code must be 8 characters' }, 400);
    }
    
    // Find user by friend code
    const [friend] = await db
      .select()
      .from(users)
      .where(eq(users.friendCode, normalizedCode))
      .limit(1);
    
    if (!friend) {
      return c.json({ error: 'Friend code not found' }, 404);
    }
    
    if (friend.id === user.id) {
      return c.json({ error: 'Cannot add yourself as a friend' }, 400);
    }
    
    // Check if already friends
    const existingFriendship = await db
      .select()
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
    
    // Check if request already exists
    const existingRequest = await db
      .select()
      .from(friendRequests)
      .where(
        or(
          and(
            eq(friendRequests.fromUserId, user.id),
            eq(friendRequests.toUserId, friend.id)
          ),
          and(
            eq(friendRequests.fromUserId, friend.id),
            eq(friendRequests.toUserId, user.id)
          )
        )
      )
      .limit(1);
    
    if (existingRequest.length > 0) {
      const request = existingRequest[0];
      if (request.status === 'PENDING') {
        return c.json({ error: 'Friend request already pending' }, 400);
      }
    }
    
    // Create friend request
    await db.insert(friendRequests).values({
      fromUserId: user.id,
      toUserId: friend.id,
      status: 'PENDING',
    });
    
    return c.json({
      success: true,
      message: 'Friend request sent',
      friend: {
        id: friend.id,
        displayName: friend.displayName,
        friendCode: friend.friendCode,
      },
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    return c.json({ error: 'Failed to send friend request' }, 500);
  }
});

/**
 * POST /friends/invite/accept
 * Accept a friend request (OLD - for backward compatibility + also accepts by friend code directly)
 */
inviteRoutes.post('/accept', async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const db = getDb(c.env);
    
    const body = await c.req.json();
    const { friendCode, requestId } = body;
    
    // If requestId provided, accept pending request
    if (requestId) {
      const [request] = await db
        .select()
        .from(friendRequests)
        .where(
          and(
            eq(friendRequests.id, requestId),
            eq(friendRequests.toUserId, user.id),
            eq(friendRequests.status, 'PENDING')
          )
        )
        .limit(1);
      
      if (!request) {
        return c.json({ error: 'Friend request not found' }, 404);
      }
      
      // Update request status
      await db
        .update(friendRequests)
        .set({ status: 'ACCEPTED', updatedAt: new Date() })
        .where(eq(friendRequests.id, requestId));
      
      // Create bidirectional friendship
      await db.insert(friendships).values([
        { userId: user.id, friendId: request.fromUserId },
        { userId: request.fromUserId, friendId: user.id },
      ]);
      
      // Get friend details
      const [friend] = await db
        .select()
        .from(users)
        .where(eq(users.id, request.fromUserId))
        .limit(1);
      
      return c.json({
        success: true,
        friend: {
          id: friend.id,
          displayName: friend.displayName,
          friendCode: friend.friendCode,
        },
      });
    }
    
    // Legacy: Direct friend code acceptance (auto-accept, no request needed)
    if (!friendCode || typeof friendCode !== 'string') {
      return c.json({ error: 'Friend code or request ID is required' }, 400);
    }
    
    const normalizedCode = friendCode.toUpperCase().trim();
    
    if (normalizedCode.length !== 8) {
      return c.json({ error: 'Friend code must be 8 characters' }, 400);
    }
    
    // Find user by friend code
    const [friend] = await db
      .select()
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
      .select()
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

/**
 * POST /friends/invite/reject
 * Reject a friend request
 */
inviteRoutes.post('/reject', async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const db = getDb(c.env);
    
    const body = await c.req.json();
    const { requestId } = body;
    
    if (!requestId) {
      return c.json({ error: 'Request ID is required' }, 400);
    }
    
    const [request] = await db
      .select()
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.id, requestId),
          eq(friendRequests.toUserId, user.id),
          eq(friendRequests.status, 'PENDING')
        )
      )
      .limit(1);
    
    if (!request) {
      return c.json({ error: 'Friend request not found' }, 404);
    }
    
    // Update request status
    await db
      .update(friendRequests)
      .set({ status: 'REJECTED', updatedAt: new Date() })
      .where(eq(friendRequests.id, requestId));
    
    return c.json({ success: true, message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    return c.json({ error: 'Failed to reject friend request' }, 500);
  }
});

/**
 * GET /friends/invite/pending
 * Get all pending friend requests (received)
 */
inviteRoutes.get('/pending', async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const db = getDb(c.env);
    
    const requests = await db
      .select()
      .from(friendRequests)
      .leftJoin(users, eq(friendRequests.fromUserId, users.id))
      .where(
        and(
          eq(friendRequests.toUserId, user.id),
          eq(friendRequests.status, 'PENDING')
        )
      );
    
    const formattedRequests = requests.map(row => ({
      id: row.friend_requests.id,
      fromUserId: row.friend_requests.fromUserId,
      displayName: row.users?.displayName || null,
      friendCode: row.users?.friendCode || '',
      createdAt: row.friend_requests.createdAt,
    }));
    
    return c.json({ requests: formattedRequests });
  } catch (error) {
    console.error('Get pending requests error:', error);
    return c.json({ error: 'Failed to fetch pending requests' }, 500);
  }
});

/**
 * DELETE /friends/invite/unfriend/:friendId
 * Remove a friend (unfriend)
 */
inviteRoutes.delete('/unfriend/:friendId', async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const db = getDb(c.env);
    const friendId = parseInt(c.req.param('friendId'));
    
    if (isNaN(friendId)) {
      return c.json({ error: 'Invalid friend ID' }, 400);
    }
    
    // Delete bidirectional friendship
    await db
      .delete(friendships)
      .where(
        or(
          and(
            eq(friendships.userId, user.id),
            eq(friendships.friendId, friendId)
          ),
          and(
            eq(friendships.userId, friendId),
            eq(friendships.friendId, user.id)
          )
        )
      );
    
    return c.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    console.error('Unfriend error:', error);
    return c.json({ error: 'Failed to remove friend' }, 500);
  }
});

export default inviteRoutes;
