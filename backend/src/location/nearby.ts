import { eq, and, ne, gte, inArray } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { users, locations, friendships, blockedUsers } from '../db/schema';
import { calculateDistance, getDistanceCategory } from '../utils/haversine';

export interface NearbyFriend {
  userId: number;
  displayName: string | null;
  friendCode: string;
  distance: number;
  distanceCategory: 'VERY_CLOSE' | 'CLOSE' | 'NEARBY' | 'FAR';
  latitude: number;
  longitude: number;
  lastUpdated: Date;
}

/**
 * Find nearby friends within the user's radar radius
 * @param db - Drizzle database instance
 * @param userId - Current user's ID
 * @param userLat - Current user's latitude
 * @param userLng - Current user's longitude
 * @param userRadius - User's radar radius in meters
 * @returns List of nearby friends with distances
 */
export async function findNearbyFriends(
  db: DrizzleD1Database,
  userId: number,
  userLat: number,
  userLng: number,
  userRadius: number
): Promise<NearbyFriend[]> {
  const now = new Date();
  
  // Get all friendships for this user (bidirectional check)
  const myFriendships = await db
    .select({ friendId: friendships.friendId })
    .from(friendships)
    .where(eq(friendships.userId, userId));
  
  const friendIds = myFriendships.map((f: any) => f.friendId);
  
  if (friendIds.length === 0) {
    return []; // No friends to check
  }
  
  // Get blocked users (bidirectional)
  const blockedRelations = await db
    .select({
      blockerId: blockedUsers.userId,
      blockedId: blockedUsers.blockedUserId,
    })
    .from(blockedUsers)
    .where(
      and(
        // Either I blocked them or they blocked me
        eq(blockedUsers.userId, userId)
      )
    );
  
  const blockedIds = new Set([
    ...blockedRelations.map((b: any) => b.blockedId),
  ]);
  
  // Also check if anyone blocked me
  const whoBlockedMe = await db
    .select({ blockerId: blockedUsers.userId })
    .from(blockedUsers)
    .where(eq(blockedUsers.blockedUserId, userId));
  
  whoBlockedMe.forEach((b: any) => blockedIds.add(b.blockerId));
  
  // Filter out blocked users from friend list
  const visibleFriendIds = friendIds.filter((id: any) => !blockedIds.has(id));
  
  if (visibleFriendIds.length === 0) {
    return []; // All friends are blocked
  }
  
  // Get friend locations (not expired) and user details
  const friendLocations = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      friendCode: users.friendCode,
      mode: users.mode,
      latitude: locations.latitude,
      longitude: locations.longitude,
      updatedAt: locations.updatedAt,
      expiresAt: locations.expiresAt,
    })
    .from(users)
    .innerJoin(locations, eq(users.id, locations.userId))
    .where(
      and(
        // Must be a visible friend
        inArray(users.id, visibleFriendIds),
        // Location must not be expired
        gte(locations.expiresAt, now),
        // Friend must be in FRIENDS mode (not OFF)
        eq(users.mode, 'FRIENDS'),
        // Friend must not be the current user
        ne(users.id, userId)
      )
    );
  
  // Calculate distances and filter by radius
  const nearby: NearbyFriend[] = [];
  
  for (const friend of friendLocations) {
    const distance = calculateDistance(
      userLat,
      userLng,
      friend.latitude,
      friend.longitude
    );
    
    // Check if within user's radar radius
    if (distance <= userRadius) {
      nearby.push({
        userId: friend.userId,
        displayName: friend.displayName,
        friendCode: friend.friendCode,
        distance: Math.round(distance),
        distanceCategory: getDistanceCategory(distance) as 'VERY_CLOSE' | 'CLOSE' | 'NEARBY' | 'FAR',
        latitude: friend.latitude,
        longitude: friend.longitude,
        lastUpdated: friend.updatedAt instanceof Date ? friend.updatedAt : new Date(friend.updatedAt),
      });
    }
  }
  
  // Sort by distance (closest first)
  nearby.sort((a, b) => a.distance - b.distance);
  
  return nearby;
}
