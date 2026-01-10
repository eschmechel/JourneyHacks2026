# Data Model: Proximity Radar

**Date**: January 10, 2026  
**Feature**: [plan.md](./plan.md)  
**Database**: Cloudflare D1 (SQLite)  
**ORM**: Drizzle ORM

## Overview

This document defines the complete database schema for Proximity Radar, optimized for Cloudflare D1's edge-replicated SQLite architecture. All tables include explicit TTL fields where constitutional 24-hour retention applies.

---

## Entity Relationship Diagram

```
┌─────────────┐          ┌──────────────┐
│   users     │──────────│  locations   │
│             │ 1      1 │              │
│ id (PK)     │          │ user_id (FK) │
│ device_...  │          │ latitude     │
│ friend_code │          │ longitude    │
│ mode        │          │ expires_at   │
└──────┬──────┘          └──────────────┘
       │
       │ 1
       │
       │ N
┌──────┴───────┐         ┌───────────────────┐
│ friendships  │         │ proximity_events  │
│              │         │                   │
│ user_id (FK) │◄────────│ user_id (FK)      │
│ friend_id(FK)│         │ nearby_user_id(FK)│
│ status       │         │ state (IN/OUT)    │
└──────────────┘         │ expires_at        │
       │                 └───────────────────┘
       │
       │ 1
       │
       │ N
┌──────┴─────────────┐
│ calendar_tokens    │
│                    │
│ user_id (FK)       │
│ encrypted_token    │
│ calendar_settings  │
└────────────────────┘

┌───────────────────────┐
│ blocked_users         │
│                       │
│ blocker_id (FK)       │
│ blocked_id (FK)       │
└───────────────────────┘
```

---

## Table Definitions

### 1. users

Represents a registered device/user with authentication and settings.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique user identifier |
| device_secret_hash | TEXT | NOT NULL, UNIQUE | SHA-256 hash of device secret (for re-authentication) |
| friend_code | TEXT(8) | NOT NULL, UNIQUE | Shareable 8-character alphanumeric invite code |
| display_name | TEXT(50) | NULL | Optional user display name |
| mode | TEXT | NOT NULL, DEFAULT 'OFF' | Sharing mode: 'OFF', 'FRIENDS', 'EVERYONE' |
| radius_meters | INTEGER | NOT NULL, DEFAULT 500 | Proximity alert radius (100-5000m) |
| created_at | INTEGER | NOT NULL | Unix timestamp (milliseconds) |
| updated_at | INTEGER | NOT NULL | Unix timestamp (milliseconds) |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE on `device_secret_hash`
- UNIQUE on `friend_code`

**Validation**:
- mode: CHECK(mode IN ('OFF', 'FRIENDS', 'EVERYONE'))
- radius_meters: CHECK(radius_meters BETWEEN 100 AND 5000)
- friend_code: CHECK(LENGTH(friend_code) = 8)

**Drizzle Schema**:
```typescript
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deviceSecretHash: text('device_secret_hash').notNull().unique(),
  friendCode: text('friend_code', { length: 8 }).notNull().unique(),
  displayName: text('display_name', { length: 50 }),
  mode: text('mode', { enum: ['OFF', 'FRIENDS', 'EVERYONE'] })
    .notNull()
    .default('OFF'),
  radiusMeters: integer('radius_meters').notNull().default(500),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  modeCheck: check('mode_check', sql`${table.mode} IN ('OFF', 'FRIENDS', 'EVERYONE')`),
  radiusCheck: check('radius_check', sql`${table.radiusMeters} BETWEEN 100 AND 5000`),
  friendCodeLenCheck: check('friend_code_len', sql`LENGTH(${table.friendCode}) = 8`),
}));
```

---

### 2. locations

Stores the last known location for each user. **Constitutional requirement: 24-hour TTL**.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | INTEGER | PRIMARY KEY, FOREIGN KEY → users(id) | User owning this location |
| latitude | REAL | NOT NULL | Latitude (-90 to 90) |
| longitude | REAL | NOT NULL | Longitude (-180 to 180) |
| accuracy | REAL | NULL | Location accuracy in meters (from Geolocation API) |
| is_simulated | INTEGER | NOT NULL, DEFAULT 0 | 1 if manually set (demo mode), 0 if real GPS |
| updated_at | INTEGER | NOT NULL | Unix timestamp (milliseconds) of last location update |
| expires_at | INTEGER | NOT NULL | Unix timestamp (milliseconds) when record auto-expires |

**Indexes**:
- PRIMARY KEY on `user_id` (1 location per user)
- INDEX on `expires_at` (for TTL cleanup query)

**Validation**:
- latitude: CHECK(latitude BETWEEN -90 AND 90)
- longitude: CHECK(longitude BETWEEN -180 AND 180)
- expires_at: Automatically set to `updated_at + 24 hours`

**Drizzle Schema**:
```typescript
export const locations = sqliteTable('locations', {
  userId: integer('user_id')
    .primaryKey()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  accuracy: real('accuracy'),
  isSimulated: integer('is_simulated', { mode: 'boolean' }).notNull().default(false),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  latCheck: check('lat_check', sql`${table.latitude} BETWEEN -90 AND 90`),
  lonCheck: check('lon_check', sql`${table.longitude} BETWEEN -180 AND 180`),
  expiresAtIdx: index('expires_at_idx').on(table.expiresAt),
}));
```

**TTL Cleanup Query** (run via Cron Trigger every hour):
```sql
DELETE FROM locations WHERE expires_at < ?;
-- Parameter: current timestamp in milliseconds
```

---

### 3. friendships

Bidirectional friend relationships established via invite code acceptance.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique friendship identifier |
| user_id | INTEGER | NOT NULL, FOREIGN KEY → users(id) | User who accepted invite or sent it |
| friend_id | INTEGER | NOT NULL, FOREIGN KEY → users(id) | The other user in the friendship |
| status | TEXT | NOT NULL, DEFAULT 'ACCEPTED' | 'PENDING' (unused for MVP), 'ACCEPTED' |
| created_at | INTEGER | NOT NULL | Unix timestamp (milliseconds) |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE constraint on `(user_id, friend_id)` to prevent duplicates
- INDEX on `user_id` (for fast friend list queries)
- INDEX on `friend_id` (for reverse lookups)

**Validation**:
- status: CHECK(status IN ('PENDING', 'ACCEPTED'))
- Self-friendship prevention: CHECK(user_id != friend_id)

**Drizzle Schema**:
```typescript
export const friendships = sqliteTable('friendships', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  friendId: integer('friend_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['PENDING', 'ACCEPTED'] })
    .notNull()
    .default('ACCEPTED'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  userFriendUnique: uniqueIndex('user_friend_unique').on(table.userId, table.friendId),
  userIdIdx: index('user_id_idx').on(table.userId),
  friendIdIdx: index('friend_id_idx').on(table.friendId),
  statusCheck: check('status_check', sql`${table.status} IN ('PENDING', 'ACCEPTED')`),
  noSelfFriend: check('no_self_friend', sql`${table.userId} != ${table.friendId}`),
}));
```

**Note**: Bidirectional means when User A accepts User B's invite, we create TWO rows:
- (user_id=A, friend_id=B)
- (user_id=B, friend_id=A)

This simplifies queries: `SELECT * FROM friendships WHERE user_id = ?` returns all friends.

---

### 4. blocked_users

Stores blocking relationships (blocker cannot see blocked user's location).

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique block record identifier |
| blocker_id | INTEGER | NOT NULL, FOREIGN KEY → users(id) | User who initiated block |
| blocked_id | INTEGER | NOT NULL, FOREIGN KEY → users(id) | User who is blocked |
| created_at | INTEGER | NOT NULL | Unix timestamp (milliseconds) |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE constraint on `(blocker_id, blocked_id)`
- INDEX on `blocker_id` (for checking "who have I blocked?")
- INDEX on `blocked_id` (for checking "who blocked me?")

**Validation**:
- Self-blocking prevention: CHECK(blocker_id != blocked_id)

**Drizzle Schema**:
```typescript
export const blockedUsers = sqliteTable('blocked_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  blockerId: integer('blocker_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  blockedId: integer('blocked_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  blockerBlockedUnique: uniqueIndex('blocker_blocked_unique')
    .on(table.blockerId, table.blockedId),
  blockerIdx: index('blocker_idx').on(table.blockerId),
  blockedIdx: index('blocked_idx').on(table.blockedId),
  noSelfBlock: check('no_self_block', sql`${table.blockerId} != ${table.blockedId}`),
}));
```

**Blocking Rules**:
- When User A blocks User B:
  1. Delete any friendship records between A and B
  2. Insert (blocker_id=A, blocked_id=B)
  3. User A will NOT see User B in proximity results
  4. User B will NOT see User A in proximity results (symmetric blocking)

---

### 5. proximity_events

Tracks proximity state (IN/OUT) between user pairs to detect new entries and suppress duplicate alerts. **TTL: 5 minutes**.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique event identifier |
| user_id | INTEGER | NOT NULL, FOREIGN KEY → users(id) | User checking proximity |
| nearby_user_id | INTEGER | NOT NULL, FOREIGN KEY → users(id) | User detected nearby |
| state | TEXT | NOT NULL | 'IN' (within radius) or 'OUT' (outside radius) |
| last_checked_at | INTEGER | NOT NULL | Unix timestamp (milliseconds) of last proximity check |
| expires_at | INTEGER | NOT NULL | Unix timestamp (milliseconds) when state expires |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE constraint on `(user_id, nearby_user_id)` (one state per pair)
- INDEX on `expires_at` (for TTL cleanup)

**Validation**:
- state: CHECK(state IN ('IN', 'OUT'))
- Self-proximity prevention: CHECK(user_id != nearby_user_id)

**Drizzle Schema**:
```typescript
export const proximityEvents = sqliteTable('proximity_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  nearbyUserId: integer('nearby_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  state: text('state', { enum: ['IN', 'OUT'] }).notNull(),
  lastCheckedAt: integer('last_checked_at', { mode: 'timestamp_ms' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  pairUnique: uniqueIndex('pair_unique').on(table.userId, table.nearbyUserId),
  expiresAtIdx: index('proximity_expires_at_idx').on(table.expiresAt),
  stateCheck: check('state_check', sql`${table.state} IN ('IN', 'OUT')`),
  noSelfProximity: check('no_self_proximity', sql`${table.userId} != ${table.nearbyUserId}`),
}));
```

**TTL Cleanup Query** (run via Cron Trigger every 15 minutes):
```sql
DELETE FROM proximity_events WHERE expires_at < ?;
```

**Alert Logic**:
- First proximity detection: No existing record → ALERT
- Re-entering radius: state='OUT' → state='IN' → ALERT
- Still nearby: state='IN' → state='IN' → NO ALERT (suppress duplicate)
- Expired state: Treated as new proximity → ALERT

---

### 6. calendar_tokens

Stores encrypted OAuth2 refresh tokens and calendar sharing preferences.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | INTEGER | PRIMARY KEY, FOREIGN KEY → users(id) | User who connected calendar |
| provider | TEXT | NOT NULL, DEFAULT 'google' | OAuth provider ('google' for MVP) |
| encrypted_refresh_token | TEXT | NOT NULL | Encrypted refresh token (AES-256-GCM) |
| token_nonce | TEXT | NOT NULL | Encryption nonce (stored separately) |
| selected_calendar_ids | TEXT | NULL | JSON array of calendar IDs to include/exclude |
| obfuscation_mode | TEXT | NOT NULL, DEFAULT 'full' | 'full' (exact busy blocks) or 'hourly' (rounded) |
| created_at | INTEGER | NOT NULL | Unix timestamp (milliseconds) |
| updated_at | INTEGER | NOT NULL | Unix timestamp (milliseconds) |

**Indexes**:
- PRIMARY KEY on `user_id` (1 calendar connection per user for MVP)

**Validation**:
- provider: CHECK(provider IN ('google'))
- obfuscation_mode: CHECK(obfuscation_mode IN ('full', 'hourly'))

**Drizzle Schema**:
```typescript
export const calendarTokens = sqliteTable('calendar_tokens', {
  userId: integer('user_id')
    .primaryKey()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: ['google'] }).notNull().default('google'),
  encryptedRefreshToken: text('encrypted_refresh_token').notNull(),
  tokenNonce: text('token_nonce').notNull(),
  selectedCalendarIds: text('selected_calendar_ids'), // JSON array
  obfuscationMode: text('obfuscation_mode', { enum: ['full', 'hourly'] })
    .notNull()
    .default('full'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  providerCheck: check('provider_check', sql`${table.provider} IN ('google')`),
  obfuscationCheck: check('obfuscation_check',
    sql`${table.obfuscationMode} IN ('full', 'hourly')`),
}));
```

**Security**:
- Refresh tokens encrypted using Workers secret as key
- Encryption algorithm: AES-256-GCM
- Nonce stored separately to prevent reuse attacks
- Access tokens (short-lived) never stored; generated on-demand from refresh token

---

### 7. calendar_exclusions

Stores recurring "do not share" time blocks for calendar privacy.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique exclusion identifier |
| user_id | INTEGER | NOT NULL, FOREIGN KEY → users(id) | User who defined exclusion |
| day_of_week | INTEGER | NOT NULL | 0 (Sunday) to 6 (Saturday) |
| start_time | TEXT | NOT NULL | Local time (HH:MM format, e.g., "09:00") |
| end_time | TEXT | NOT NULL | Local time (HH:MM format, e.g., "17:00") |
| created_at | INTEGER | NOT NULL | Unix timestamp (milliseconds) |

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `user_id` (for fetching all exclusions for a user)

**Validation**:
- day_of_week: CHECK(day_of_week BETWEEN 0 AND 6)
- start_time: CHECK(start_time LIKE '__:__')
- end_time: CHECK(end_time LIKE '__:__')

**Drizzle Schema**:
```typescript
export const calendarExclusions = sqliteTable('calendar_exclusions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: text('start_time').notNull(), // "HH:MM"
  endTime: text('end_time').notNull(),     // "HH:MM"
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  userIdIdx: index('exclusion_user_id_idx').on(table.userId),
  dayCheck: check('day_check', sql`${table.dayOfWeek} BETWEEN 0 AND 6`),
  startTimeFormat: check('start_time_format', sql`${table.startTime} LIKE '__:__'`),
  endTimeFormat: check('end_time_format', sql`${table.endTime} LIKE '__:__'`),
}));
```

**Usage**:
- Example: "Every Monday 9am-5pm, hide my calendar availability"
- When generating mutual availability, apply exclusions to filter out blocked time slots

---

## Migration Strategy

### Initial Migration (001_create_tables.sql)

```sql
-- Create users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_secret_hash TEXT NOT NULL UNIQUE,
  friend_code TEXT NOT NULL UNIQUE CHECK(LENGTH(friend_code) = 8),
  display_name TEXT,
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK(mode IN ('OFF', 'FRIENDS', 'EVERYONE')),
  radius_meters INTEGER NOT NULL DEFAULT 500 CHECK(radius_meters BETWEEN 100 AND 5000),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_users_device_secret ON users(device_secret_hash);
CREATE UNIQUE INDEX idx_users_friend_code ON users(friend_code);

-- Create locations table
CREATE TABLE locations (
  user_id INTEGER PRIMARY KEY NOT NULL,
  latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),
  accuracy REAL,
  is_simulated INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_locations_expires_at ON locations(expires_at);

-- Create friendships table
CREATE TABLE friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACCEPTED' CHECK(status IN ('PENDING', 'ACCEPTED')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK(user_id != friend_id)
);

CREATE UNIQUE INDEX idx_friendships_pair ON friendships(user_id, friend_id);
CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);

-- Create blocked_users table
CREATE TABLE blocked_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_id INTEGER NOT NULL,
  blocked_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK(blocker_id != blocked_id)
);

CREATE UNIQUE INDEX idx_blocked_pair ON blocked_users(blocker_id, blocked_id);
CREATE INDEX idx_blocked_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_blocked ON blocked_users(blocked_id);

-- Create proximity_events table
CREATE TABLE proximity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  nearby_user_id INTEGER NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('IN', 'OUT')),
  last_checked_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (nearby_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK(user_id != nearby_user_id)
);

CREATE UNIQUE INDEX idx_proximity_pair ON proximity_events(user_id, nearby_user_id);
CREATE INDEX idx_proximity_expires_at ON proximity_events(expires_at);

-- Create calendar_tokens table
CREATE TABLE calendar_tokens (
  user_id INTEGER PRIMARY KEY NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google' CHECK(provider IN ('google')),
  encrypted_refresh_token TEXT NOT NULL,
  token_nonce TEXT NOT NULL,
  selected_calendar_ids TEXT,
  obfuscation_mode TEXT NOT NULL DEFAULT 'full'
    CHECK(obfuscation_mode IN ('full', 'hourly')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create calendar_exclusions table
CREATE TABLE calendar_exclusions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL CHECK(start_time LIKE '__:__'),
  end_time TEXT NOT NULL CHECK(end_time LIKE '__:__'),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_exclusions_user ON calendar_exclusions(user_id);
```

---

## Query Patterns

### 1. Find Nearby Users (Friends-only Mode)

```sql
SELECT 
  u.id, u.display_name, 
  l.latitude, l.longitude, l.updated_at
FROM locations l
JOIN users u ON u.id = l.user_id
JOIN friendships f ON f.friend_id = l.user_id
WHERE 
  f.user_id = ? -- Current user
  AND u.mode IN ('FRIENDS', 'EVERYONE')
  AND l.expires_at > ? -- Current timestamp (exclude expired)
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users b
    WHERE (b.blocker_id = ? AND b.blocked_id = u.id)
       OR (b.blocker_id = u.id AND b.blocked_id = ?)
  );
```

### 2. Find Nearby Users (Everyone Mode)

```sql
SELECT 
  u.id, u.display_name,
  l.latitude, l.longitude, l.updated_at
FROM locations l
JOIN users u ON u.id = l.user_id
WHERE 
  u.mode = 'EVERYONE'
  AND u.id != ? -- Exclude self
  AND l.expires_at > ?
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users b
    WHERE (b.blocker_id = ? AND b.blocked_id = u.id)
       OR (b.blocker_id = u.id AND b.blocked_id = ?)
  );
```

### 3. Clean Up Expired Data (Cron Trigger)

```sql
-- Run every hour
DELETE FROM locations WHERE expires_at < ?;
DELETE FROM proximity_events WHERE expires_at < ?;
```

---

## Data Retention Policy

| Table | Retention | Enforcement |
|-------|-----------|-------------|
| users | Permanent (until account deletion) | N/A |
| locations | 24 hours from last update | TTL via `expires_at` + Cron cleanup |
| friendships | Permanent (until unfriended) | N/A |
| blocked_users | Permanent (until unblocked) | N/A |
| proximity_events | 5 minutes from last check | TTL via `expires_at` + Cron cleanup |
| calendar_tokens | Permanent (until disconnected) | N/A |
| calendar_exclusions | Permanent (until deleted) | N/A |

**Constitutional Compliance**: ✅  
- Location data auto-expires after 24 hours (FR-028, Privacy-First Design)
- Proximity state expires after 5 minutes (prevents indefinite tracking)
- No location history stored (only last known location)

---

## Storage Estimates

**Assumptions**:
- 100 concurrent users
- Average 50 friends per user
- Calendar connected for 30% of users

| Table | Rows | Bytes/Row | Total Storage |
|-------|------|-----------|---------------|
| users | 100 | ~200 | 20 KB |
| locations | 100 | ~100 | 10 KB |
| friendships | 5,000 | ~50 | 250 KB |
| blocked_users | 50 | ~50 | 2.5 KB |
| proximity_events | 500 | ~60 | 30 KB |
| calendar_tokens | 30 | ~300 | 9 KB |
| calendar_exclusions | 150 | ~80 | 12 KB |
| **Total** | | | **~334 KB** |

**Cloudflare D1 Limits** (Free Tier):
- Storage: 500 MB (we use <1 MB)
- Queries per day: 5M reads, 100K writes (MVP easily within limits)

---

## Indexes Summary

All indexes have been defined inline in table schemas above. Summary:

**Users**: device_secret_hash (UNIQUE), friend_code (UNIQUE)  
**Locations**: expires_at  
**Friendships**: (user_id, friend_id) UNIQUE, user_id, friend_id  
**Blocked Users**: (blocker_id, blocked_id) UNIQUE, blocker_id, blocked_id  
**Proximity Events**: (user_id, nearby_user_id) UNIQUE, expires_at  
**Calendar Exclusions**: user_id

**Performance**: All critical queries use indexed columns; expected latency <5ms on D1.

---

**Status**: Data model complete. Ready for contract generation (Phase 1 cont.).
