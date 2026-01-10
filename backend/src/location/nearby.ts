import { eq, and, ne, gte, inArray, notInArray } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { users, locations, friendships, blockedUsers } from '../db/schema';
import { calculateDistance, calculateBearing, getDistanceCategory } from '../utils/haversine';

export interface NearbyFriend {
  userId: number;
  displayName: string | null;
  friendCode?: string; // Optional: only included for friends scope
  isFriend: boolean;
  distance: number;
  distanceCategory: 'VERY_CLOSE' | 'CLOSE' | 'NEARBY' | 'FAR';
  latitude: number;
  longitude: number;
  bearing: number;
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
  db: any,
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
  
  console.log('[DEBUG] friendIds:', friendIds);
  
  if (friendIds.length === 0) {
    console.log('[DEBUG] No friends, returning empty array');
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
  
  console.log('[DEBUG] visibleFriendIds:', visibleFriendIds);
  
  if (visibleFriendIds.length === 0) {
    console.log('[DEBUG] All friends blocked or no friends, returning empty array');
    return []; // All friends are blocked or no friends
  }
  
  console.log('[DEBUG] About to query friend locations...');
  
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
      const bearing = calculateBearing(
        userLat,
        userLng,
        friend.latitude,
        friend.longitude
      );
      
      nearby.push({
        userId: friend.userId,
        displayName: friend.displayName,
        friendCode: friend.friendCode,
        isFriend: true,
        distance: Math.round(distance),
        distanceCategory: getDistanceCategory(distance) as 'VERY_CLOSE' | 'CLOSE' | 'NEARBY' | 'FAR',
        latitude: friend.latitude,
        longitude: friend.longitude,
        bearing,
        lastUpdated: friend.updatedAt instanceof Date ? friend.updatedAt : new Date(friend.updatedAt),
      });
    }
  }
  
  // Sort by distance (closest first)
  nearby.sort((a, b) => a.distance - b.distance);
  
  return nearby;
}

/**
 * Find nearby non-friends in Everyone mode (mutual opt-in)
 * @param db - Drizzle database instance
 * @param userId - Current user's ID
 * @param userLat - Current user's latitude
 * @param userLng - Current user's longitude
 * @param userRadius - User's radar radius in meters
 * @param userMode - Current user's mode
 * @returns List of nearby non-friends in Everyone mode
 */
export async function findNearbyEveryone(
  db: any,
  userId: number,
  userLat: number,
  userLng: number,
  userRadius: number,
  userMode: string
): Promise<NearbyFriend[]> {
  // If user is not in Everyone mode, return empty array
  if (userMode !== 'EVERYONE') {
    return [];
  }
  
  const now = new Date();
  
  // Get all friendships to exclude friends from everyone scope
  const myFriendships = await db
    .select({ friendId: friendships.friendId })
    .from(friendships)
    .where(eq(friendships.userId, userId));
  
  const friendIds = myFriendships.map((f: any) => f.friendId);
  
  // Get blocked users (bidirectional)
  const blockedRelations = await db
    .select({
      blockerId: blockedUsers.userId,
      blockedId: blockedUsers.blockedUserId,
    })
    .from(blockedUsers)
    .where(eq(blockedUsers.userId, userId));
  
  const blockedIds = new Set([
    ...blockedRelations.map((b: any) => b.blockedId),
  ]);
  
  // Also check if anyone blocked me
  const whoBlockedMe = await db
    .select({ blockerId: blockedUsers.userId })
    .from(blockedUsers)
    .where(eq(blockedUsers.blockedUserId, userId));
  
  whoBlockedMe.forEach((b: any) => blockedIds.add(b.blockerId));
  
  // Get everyone in EVERYONE mode (excluding self, friends, and blocked users)
  const query = db
    .select({
      userId: users.id,
      displayName: users.displayName,
      latitude: locations.latitude,
      longitude: locations.longitude,
      updatedAt: locations.updatedAt,
      expiresAt: locations.expiresAt,
    })
    .from(users)
    .innerJoin(locations, eq(users.id, locations.userId))
    .where(
      and(
        // Must be in Everyone mode (mutual opt-in)
        eq(users.mode, 'EVERYONE'),
        // Location must not be expired
        gte(locations.expiresAt, now),
        // Must not be the current user
        ne(users.id, userId)
      )
    );
  
  const everyoneLocations = await query;
  
  // Filter out friends and blocked users, calculate distances
  const nearby: NearbyFriend[] = [];
  
  for (const person of everyoneLocations) {
    // Skip if this person is a friend or blocked
    if (friendIds.includes(person.userId) || blockedIds.has(person.userId)) {
      continue;
    }
    
    const distance = calculateDistance(
      userLat,
      userLng,
      person.latitude,
      person.longitude
    );
    
    // Check if within user's radar radius
    if (distance <= userRadius) {
      const bearing = calculateBearing(
        userLat,
        userLng,
        person.latitude,
        person.longitude
      );
      
      nearby.push({
        userId: person.userId,
        displayName: person.displayName,
        // NO friendCode for everyone scope (privacy rule)
        isFriend: false,
        distance: Math.round(distance),
        distanceCategory: getDistanceCategory(distance) as 'VERY_CLOSE' | 'CLOSE' | 'NEARBY' | 'FAR',
        latitude: person.latitude,
        longitude: person.longitude,
        bearing,
        lastUpdated: person.updatedAt instanceof Date ? person.updatedAt : new Date(person.updatedAt),
      });
    }
  }
  
  // Add friends to everyone list (with friendCode and isFriend=true)
  const friendsData = await findNearbyFriends(db, userId, userLat, userLng, userRadius);
  nearby.push(...friendsData);
  
  // Sort by distance (closest first)
  nearby.sort((a, b) => a.distance - b.distance);
  
  return nearby;
}
