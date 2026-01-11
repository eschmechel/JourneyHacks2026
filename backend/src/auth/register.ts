import { Hono } from 'hono';
import type { Env } from '../types/env';
import { getDb } from '../db/client';
import { users } from '../db/schema';
import { generateDeviceSecret } from './simple-auth';

const authRoutes = new Hono<{ Bindings: Env }>();

/**
 * Generate a random 8-character alphanumeric friend code
 * Format: UPPERCASE letters and numbers (e.g., "A3K9F2M1")
 */
function generateFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars: 0, O, I, 1
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * POST /auth/register
 * Register a new device and create a user account
 * No input required - generates deviceSecret and friendCode automatically
 */
authRoutes.post('/register', async (c) => {
  try {
    const db = getDb(c.env);
    
    // Generate unique credentials
    const deviceSecret = generateDeviceSecret();
    let friendCode = generateFriendCode();
    
    // Ensure friendCode is unique (very unlikely collision, but check anyway)
    // TODO: In production, add retry logic with collision detection
    
    // Insert new user with default settings
    const result = await db.insert(users).values({
      deviceSecret,
      friendCode,
      displayName: null,
      mode: 'FRIENDS', // Default mode: visible to friends
      radiusMeters: 5000, // Default: 5km
    }).returning();
    
    const user = result[0];
    
    return c.json({
      userId: user.id,
      deviceSecret: user.deviceSecret,
      friendCode: user.friendCode,
      mode: user.mode,
      radiusMeters: user.radiusMeters,
    }, 201);
    
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Failed to register device' }, 500);
  }
});

export default authRoutes;
