import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deviceSecret: text('device_secret').notNull().unique(),
  friendCode: text('friend_code').notNull().unique(),
  displayName: text('display_name'),
  mode: text('mode', { enum: ['OFF', 'FRIENDS'] }).notNull().default('OFF'),
  radiusMeters: integer('radius_meters').notNull().default(1000),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  deviceSecretIdx: index('idx_users_device_secret').on(table.deviceSecret),
  friendCodeIdx: index('idx_users_friend_code').on(table.friendCode),
}));

// Locations table
export const locations = sqliteTable('locations', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  accuracy: real('accuracy'),
  isSimulated: integer('is_simulated', { mode: 'boolean' }).notNull().default(false),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  expiresAtIdx: index('idx_locations_expires_at').on(table.expiresAt),
}));

// Friendships table
export const friendships = sqliteTable('friendships', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  friendId: integer('friend_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdIdx: index('idx_friendships_user_id').on(table.userId),
  friendIdIdx: index('idx_friendships_friend_id').on(table.friendId),
  uniqueFriendship: uniqueIndex('unique_friendship').on(table.userId, table.friendId),
}));

// Blocked users table
export const blockedUsers = sqliteTable('blocked_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  blockedUserId: integer('blocked_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdIdx: index('idx_blocked_users_user_id').on(table.userId),
  blockedUserIdIdx: index('idx_blocked_users_blocked_user_id').on(table.blockedUserId),
  uniqueBlock: uniqueIndex('unique_block').on(table.userId, table.blockedUserId),
}));

// Proximity events table
export const proximityEvents = sqliteTable('proximity_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  friendId: integer('friend_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: text('event_type', { enum: ['IN', 'OUT'] }).notNull(),
  distance: real('distance'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userFriendIdx: index('idx_proximity_events_user_friend').on(table.userId, table.friendId),
  expiresAtIdx: index('idx_proximity_events_expires_at').on(table.expiresAt),
}));

// TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;

export type BlockedUser = typeof blockedUsers.$inferSelect;
export type NewBlockedUser = typeof blockedUsers.$inferInsert;

export type ProximityEvent = typeof proximityEvents.$inferSelect;
export type NewProximityEvent = typeof proximityEvents.$inferInsert;
