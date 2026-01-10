import { eq, and, gte } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { proximityEvents } from '../db/schema';
import type { NearbyFriend } from '../location/nearby';

/**
 * Track proximity state changes and detect OUT→IN transitions (new alerts)
 * @param db - Drizzle database instance
 * @param userId - Current user's ID
 * @param nearbyFriends - List of currently nearby friends
 * @returns List of friend IDs that just entered proximity (new alerts)
 */
export async function trackProximityEvents(
  db: DrizzleD1Database,
  userId: number,
  nearbyFriends: NearbyFriend[]
): Promise<number[]> {
  const now = new Date();
  const alertThresholdMinutes = 30; // Suppress duplicate alerts for 30 minutes
  const thresholdTime = new Date(now.getTime() - alertThresholdMinutes * 60 * 1000);
  
  // Get recent proximity events (within threshold window)
  const recentEvents = await db
    .select({
      friendId: proximityEvents.friendId,
      detectedAt: proximityEvents.detectedAt,
    })
    .from(proximityEvents)
    .where(
      and(
        eq(proximityEvents.userId, userId),
        gte(proximityEvents.detectedAt, thresholdTime)
      )
    );
  
  // Build set of friends we've recently alerted about
  const recentlyAlertedFriends = new Set(
    recentEvents.map((e: any) => e.friendId)
  );
  
  // Determine which nearby friends are "new" (not recently alerted)
  const newAlerts: number[] = [];
  
  for (const friend of nearbyFriends) {
    if (!recentlyAlertedFriends.has(friend.userId)) {
      newAlerts.push(friend.userId);
      
      // Record this proximity event
      try {
        await db.insert(proximityEvents).values({
          userId,
          friendId: friend.userId,
          distance: friend.distance,
          detectedAt: now,
        });
      } catch (error) {
        console.error(`Failed to insert proximity event for friend ${friend.userId}:`, error);
        // Continue processing other alerts even if one fails
      }
    }
  }
  
  return newAlerts;
}
