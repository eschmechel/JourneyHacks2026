-- Migration: 001_create_tables.sql
-- Created: 2026-01-10
-- Description: Create core tables for Proximity Radar (skip calendar tables)

-- Users table: stores device registrations and settings
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_secret TEXT NOT NULL UNIQUE,
  friend_code TEXT NOT NULL UNIQUE,
  display_name TEXT,
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK(mode IN ('OFF', 'FRIENDS')),
  radius_meters INTEGER NOT NULL DEFAULT 1000,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_users_device_secret ON users(device_secret);
CREATE INDEX idx_users_friend_code ON users(friend_code);

-- Locations table: stores user locations with TTL (24h)
CREATE TABLE IF NOT EXISTS locations (
  user_id INTEGER PRIMARY KEY,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL,
  is_simulated INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_locations_expires_at ON locations(expires_at);

-- Friendships table: bidirectional friend relationships
CREATE TABLE IF NOT EXISTS friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, friend_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);

-- Blocked users table: prevent visibility (symmetric blocking)
CREATE TABLE IF NOT EXISTS blocked_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  blocked_user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, blocked_user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX idx_blocked_users_blocked_user_id ON blocked_users(blocked_user_id);

-- Proximity events table: track OUT→IN transitions for alert suppression
CREATE TABLE IF NOT EXISTS proximity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('IN', 'OUT')),
  distance REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_proximity_events_user_friend ON proximity_events(user_id, friend_id);
CREATE INDEX idx_proximity_events_expires_at ON proximity_events(expires_at);
