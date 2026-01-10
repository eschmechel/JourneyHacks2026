import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, type AuthContext } from '../auth/middleware';
import { getDb } from '../db/client';
import { locations } from '../db/schema';
import { eq } from 'drizzle-orm';
import { findNearbyFriends } from './nearby';
import { trackProximityEvents } from '../utils/proximity';

const nearbyRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware
nearbyRoutes.use('/*', authMiddleware);

/**
 * GET /nearby
 * Get all nearby friends within the user's radar radius
 * Returns list of friends with distances and identifies new alerts (OUT→IN transitions)
 */
nearbyRoutes.get('/', async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const db = getDb(c.env);
    
    // Get user's current location
    const [userLocation] = await db
      .select()
      .from(locations)
      .where(eq(locations.userId, user.id))
      .limit(1);
    
    if (!userLocation) {
      return c.json({
        nearby: [],
        newAlerts: [],
        message: 'No location data available. Update your location first.',
      });
    }
    
    // Check if location is expired
    const now = new Date();
    if (userLocation.expiresAt < now) {
      return c.json({
        nearby: [],
        newAlerts: [],
        message: 'Location expired. Update your location to see nearby friends.',
      });
    }
    
    // Find nearby friends
    const nearbyFriends = await findNearbyFriends(
      db,
      user.id,
      userLocation.latitude,
      userLocation.longitude,
      user.radiusMeters
    );
    
    // Track proximity events and identify new alerts
    const newAlertIds = await trackProximityEvents(db, user.id, nearbyFriends);
    
    // Return results
    return c.json({
      nearby: nearbyFriends,
      newAlerts: newAlertIds,
      userLocation: {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        lastUpdated: userLocation.updatedAt,
      },
      radiusMeters: user.radiusMeters,
    });
    
  } catch (error) {
    console.error('Nearby endpoint error:', error);
    return c.json({ error: 'Failed to fetch nearby friends' }, 500);
  }
});

export default nearbyRoutes;
