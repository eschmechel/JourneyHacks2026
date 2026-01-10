import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, type AuthContext } from '../auth/middleware';
import { getDb } from '../db/client';
import { locations } from '../db/schema';
import { eq } from 'drizzle-orm';

const locationRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all location routes
locationRoutes.use('/*', authMiddleware);

/**
 * PUT /me/location
 * Update user's current location with 24-hour TTL
 */
locationRoutes.put('/location', async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    // Validate latitude and longitude
    const latitude = parseFloat(body.latitude);
    const longitude = parseFloat(body.longitude);
    
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return c.json({ error: 'Invalid latitude. Must be -90 to 90' }, 400);
    }
    
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return c.json({ error: 'Invalid longitude. Must be -180 to 180' }, 400);
    }
    
    // Optional accuracy and isSimulated fields
    const accuracy = body.accuracy ? parseFloat(body.accuracy) : null;
    const isSimulated = body.isSimulated === true;
    
    const db = getDb(c.env);
    
    // Calculate expiry time (24 hours from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours from now
    
    // Upsert location (insert or update if userId already exists)
    await db.insert(locations)
      .values({
        userId: user.id,
        latitude,
        longitude,
        accuracy,
        isSimulated,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: locations.userId,
        set: {
          latitude,
          longitude,
          accuracy,
          isSimulated,
          expiresAt,
        },
      });
    
    return c.json({
      userId: user.id,
      latitude,
      longitude,
      accuracy,
      isSimulated,
      expiresAt: Math.floor(expiresAt.getTime() / 1000),
    });
    
  } catch (error) {
    console.error('Location update error:', error);
    return c.json({ error: 'Failed to update location' }, 500);
  }
});

export default locationRoutes;
