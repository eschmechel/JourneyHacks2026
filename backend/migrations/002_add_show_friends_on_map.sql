-- Migration: Add show_friends_on_map column to users table
-- Feature: 002-map-and-mobile
-- Purpose: Allow users to control whether friends appear on map view

ALTER TABLE users ADD COLUMN show_friends_on_map INTEGER DEFAULT 0;
