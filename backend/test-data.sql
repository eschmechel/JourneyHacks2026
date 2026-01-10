-- Create test users and friendships for proximity testing

-- User 2 already exists (deviceSecret: 93d80dc9-ab50-4915-9306-8d4ec11babb5, friendCode: J6RKRBVU)
-- Location: 40.7128, -74.0060 (NYC Times Square)

-- Create User 3 - Bob (Very Close: ~200m away)
INSERT INTO users (device_secret, friend_code, display_name, mode, radius_meters)
VALUES ('test-device-bob-001', 'BOBTEST1', 'Bob', 'FRIENDS', 1000);

-- Create User 4 - Charlie (Close: ~800m away)
INSERT INTO users (device_secret, friend_code, display_name, mode, radius_meters)
VALUES ('test-device-charlie-001', 'CHARLIE1', 'Charlie', 'FRIENDS', 1000);

-- Create User 5 - Diana (Far: ~3km away)
INSERT INTO users (device_secret, friend_code, display_name, mode, radius_meters)
VALUES ('test-device-diana-001', 'DIANA001', 'Diana', 'FRIENDS', 2000);

-- Create bidirectional friendships
-- User 2 <-> User 3 (Bob)
INSERT INTO friendships (user_id, friend_id) VALUES (2, 3);
INSERT INTO friendships (user_id, friend_id) VALUES (3, 2);

-- User 2 <-> User 4 (Charlie)
INSERT INTO friendships (user_id, friend_id) VALUES (2, 4);
INSERT INTO friendships (user_id, friend_id) VALUES (4, 2);

-- User 2 <-> User 5 (Diana)
INSERT INTO friendships (user_id, friend_id) VALUES (2, 5);
INSERT INTO friendships (user_id, friend_id) VALUES (5, 2);

-- Set locations for test users (24 hour expiry)
-- Bob: ~200m north (Very Close)
INSERT INTO locations (user_id, latitude, longitude, expires_at)
VALUES (3, 40.7146, -74.0060, unixepoch() + 86400);

-- Charlie: ~800m northeast (Close)
INSERT INTO locations (user_id, latitude, longitude, expires_at)
VALUES (4, 40.7200, -74.0000, unixepoch() + 86400);

-- Diana: ~3km north (Far - outside 1500m radius)
INSERT INTO locations (user_id, latitude, longitude, expires_at)
VALUES (5, 40.7400, -74.0060, unixepoch() + 86400);
