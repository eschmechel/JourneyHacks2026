import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, type AuthContext } from '../auth/middleware';
import { getDb } from '../db/client';
import { locations } from '../db/schema';
import { eq } from 'drizzle-orm';
import { findNearbyFriends, findNearbyEveryone } from './nearby';
import { trackProximityEvents } from '../utils/proximity';

const nearbyRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware
nearbyRoutes.use('/*', authMiddleware);

/**
 * GET /nearby?scope=friends|everyone
 * Get nearby people based on scope
 * - friends: Returns only friends who are nearby (requires friendship)
 * - everyone: Returns non-friends in Everyone mode (mutual opt-in, excludes friends)
 * Returns list with distances and identifies new alerts (OUT→IN transitions for friends scope)
 */
nearbyRoutes.get('/', async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const db = getDb(c.env);
    
    // Parse scope parameter (default: friends for backward compatibility)
    const scope = c.req.query('scope') || 'friends';
    
    if (scope !== 'friends' && scope !== 'everyone') {
      return c.json({ error: 'Invalid scope. Must be "friends" or "everyone"' }, 400);
    }
    
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
        message: 'Location expired. Update your location to see nearby people.',
      });
    }
    
    let nearbyPeople;
    let newAlertIds: number[] = [];
    
    if (scope === 'friends') {
      // Find nearby friends
      nearbyPeople = await findNearbyFriends(
        db,
        user.id,
        userLocation.latitude,
        userLocation.longitude,
        user.radiusMeters
      );
      
      // Track proximity events and identify new alerts (only for friends)
      newAlertIds = await trackProximityEvents(db, user.id, nearbyPeople);
    } else {
      // Find nearby everyone (non-friends in Everyone mode)
      nearbyPeople = await findNearbyEveryone(
        db,
        user.id,
        userLocation.latitude,
        userLocation.longitude,
        user.radiusMeters,
        user.mode
      );
      // No alerts for everyone scope
      newAlertIds = [];
    }
    
    // Return results
    return c.json({
      nearby: nearbyPeople,
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
    return c.json({ error: 'Failed to fetch nearby people' }, 500);
  }
});

export default nearbyRoutes;
