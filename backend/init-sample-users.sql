-- Initialize database with sample test users using predetermined credentials
-- This ensures consistent device secrets for development and testing
-- Run this ONCE after creating the database schema

-- IMPORTANT: Only run this on a fresh database or after clearing the users table
-- DELETE FROM users WHERE id IN (1, 2, 3, 4, 5, 6);

-- Sample user credentials (MUST match setup-sample-users.sh and frontend code)
-- Note: Database CHECK constraint only allows 'OFF' or 'FRIENDS' mode (EVERYONE not yet in migration)
INSERT INTO users (id, device_secret, friend_code, display_name, mode, radius_meters, show_friends_on_map)
VALUES 
  -- Alice: Main demo user (will be visible to all via setup script)
  (1, '847bdc04-f607-4774-9646-5cd2318a2e83', 'NR6M9ZZV', 'Alice', 'FRIENDS', 1000, 1),
  
  -- Bob: Friend of Alice
  (2, '235c2116-b094-4675-8f1b-45241d4f15fd', 'TLPVAGUX', 'Bob', 'FRIENDS', 1000, 1),
  
  -- Charlie: Friend of Alice
  (3, 'b6d5fb61-c3b7-4ab8-8cf4-723fbf38d2ac', 'DHWX4QMR', 'Charlie', 'FRIENDS', 1000, 1),
  
  -- Dana: Friend of Alice
  (4, 'cabc75c8-1456-4eec-89a7-827249355da7', 'Y7PWTYGB', 'Dana', 'FRIENDS', 1000, 1),
  
  -- Eve: Non-friend (will be visible to all via setup script)
  (5, '44834541-b712-4c0d-8c27-bde8e63f831a', '594GPN4H', 'Eve', 'FRIENDS', 1000, 1),
  
  -- Frank: Non-friend (will be visible to all via setup script)
  (6, 'e52bcb99-c0c1-4ebc-9491-9aebf442c1b4', 'GF3DVJZD', 'Frank', 'FRIENDS', 1000, 1);

-- Insert initial locations (will expire in 24 hours)
INSERT OR REPLACE INTO locations (user_id, latitude, longitude, is_simulated, expires_at)
VALUES 
  (1, 49.2891, -123.1112, 1, unixepoch() + 86400),  -- Alice: base
  (2, 49.2905, -123.1112, 1, unixepoch() + 86400),  -- Bob: 150m north
  (3, 49.2932, -123.1112, 1, unixepoch() + 86400),  -- Charlie: 450m north
  (4, 49.2968, -123.1112, 1, unixepoch() + 86400),  -- Dana: 850m north
  (5, 49.2918, -123.1112, 1, unixepoch() + 86400),  -- Eve: 300m north
  (6, 49.2945, -123.1112, 1, unixepoch() + 86400);  -- Frank: 600m north

-- Create friendships (Alice with Bob, Charlie, Dana)
-- Note: friendships table doesn't have status column, just user_id and friend_id
INSERT OR IGNORE INTO friendships (user_id, friend_id)
VALUES 
  -- Alice → Bob
  (1, 2),
  -- Bob → Alice (bidirectional)
  (2, 1),
  
  -- Alice → Charlie
  (1, 3),
  -- Charlie → Alice (bidirectional)
  (3, 1),
  
  -- Alice → Dana
  (1, 4),
  -- Dana → Alice (bidirectional)
  (4, 1);

-- Verify the data
SELECT 
  id, 
  device_secret, 
  friend_code, 
  display_name, 
  mode
FROM users 
WHERE id IN (1, 2, 3, 4, 5, 6)
ORDER BY id;
