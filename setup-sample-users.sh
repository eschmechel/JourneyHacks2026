#!/bin/bash

# Configure sample test users for Proximity Radar
# Uses FIXED predetermined credentials for consistent testing
# NOTE: Users must be manually registered ONCE or database pre-seeded with these credentials

API_BASE="http://localhost:8787"
OUTPUT_FILE="sample_users_credentials.txt"

# FIXED predetermined credentials - DO NOT CHANGE these values
# These match the hardcoded values in the frontend
ALICE_SECRET="847bdc04-f607-4774-9646-5cd2318a2e83"
ALICE_CODE="NR6M9ZZV"
ALICE_ID=1

BOB_SECRET="235c2116-b094-4675-8f1b-45241d4f15fd"
BOB_CODE="TLPVAGUX"
BOB_ID=2

CHARLIE_SECRET="b6d5fb61-c3b7-4ab8-8cf4-723fbf38d2ac"
CHARLIE_CODE="DHWX4QMR"
CHARLIE_ID=3

DANA_SECRET="cabc75c8-1456-4eec-89a7-827249355da7"
DANA_CODE="Y7PWTYGB"
DANA_ID=4

EVE_SECRET="44834541-b712-4c0d-8c27-bde8e63f831a"
EVE_CODE="594GPN4H"
EVE_ID=5

FRANK_SECRET="e52bcb99-c0c1-4ebc-9491-9aebf442c1b4"
FRANK_CODE="GF3DVJZD"
FRANK_ID=6

echo "🚀 Setting up sample test users with FIXED credentials..."
echo ""
echo "⚠️  IMPORTANT: This script assumes users already exist in the database."
echo "   If you get errors, you may need to register users manually first."
echo ""

# Clear previous credentials file
> "$OUTPUT_FILE"

# Write fixed credentials to file
echo "ALICE:" >> "$OUTPUT_FILE"
echo "  Device Secret: $ALICE_SECRET" >> "$OUTPUT_FILE"
echo "  Friend Code: $ALICE_CODE" >> "$OUTPUT_FILE"
echo "  User ID: $ALICE_ID" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "BOB:" >> "$OUTPUT_FILE"
echo "  Device Secret: $BOB_SECRET" >> "$OUTPUT_FILE"
echo "  Friend Code: $BOB_CODE" >> "$OUTPUT_FILE"
echo "  User ID: $BOB_ID" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "CHARLIE:" >> "$OUTPUT_FILE"
echo "  Device Secret: $CHARLIE_SECRET" >> "$OUTPUT_FILE"
echo "  Friend Code: $CHARLIE_CODE" >> "$OUTPUT_FILE"
echo "  User ID: $CHARLIE_ID" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "DANA:" >> "$OUTPUT_FILE"
echo "  Device Secret: $DANA_SECRET" >> "$OUTPUT_FILE"
echo "  Friend Code: $DANA_CODE" >> "$OUTPUT_FILE"
echo "  User ID: $DANA_ID" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "EVE:" >> "$OUTPUT_FILE"
echo "  Device Secret: $EVE_SECRET" >> "$OUTPUT_FILE"
echo "  Friend Code: $EVE_CODE" >> "$OUTPUT_FILE"
echo "  User ID: $EVE_ID" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "FRANK:" >> "$OUTPUT_FILE"
echo "  Device Secret: $FRANK_SECRET" >> "$OUTPUT_FILE"
echo "  Friend Code: $FRANK_CODE" >> "$OUTPUT_FILE"
echo "  User ID: $FRANK_ID" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "✅ Credentials saved to: $OUTPUT_FILE"
echo ""

# Function to update settings
update_settings() {
    local name=$1
    local display_name=$2
    local mode=$3
    local show_map=$4
    local radius=$5
    
    secret_var="${name}_SECRET"
    secret="${!secret_var}"
    
    echo "⚙️  Updating $name settings..."
    
    response=$(curl -s -w "\n%{http_code}" -X PUT "$API_BASE/me/settings" \
        -H "Authorization: Bearer $secret" \
        -H "Content-Type: application/json" \
        -d "{\"displayName\":\"$display_name\",\"mode\":\"$mode\",\"showFriendsOnMap\":$show_map,\"radiusMeters\":$radius}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "   ✓ Mode: $mode | Display: $display_name"
    else
        echo "   ✗ Failed (HTTP $http_code): $body"
        return 1
    fi
}

# Function to update location
update_location() {
    local name=$1
    local lat=$2
    local lon=$3
    
    secret_var="${name}_SECRET"
    secret="${!secret_var}"
    
    echo "📍 Setting $name location..."
    
    response=$(curl -s -w "\n%{http_code}" -X PUT "$API_BASE/me/location" \
        -H "Authorization: Bearer $secret" \
        -H "Content-Type: application/json" \
        -d "{\"latitude\":$lat,\"longitude\":$lon,\"isSimulated\":true}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "   ✓ Location: $lat, $lon"
    else
        echo "   ✗ Failed (HTTP $http_code): $body"
        return 1
    fi
}

# Function to add friend using direct friend code acceptance
add_friend() {
    local user_name=$1
    local friend_name=$2
    
    user_secret_var="${user_name}_SECRET"
    user_secret="${!user_secret_var}"
    
    friend_code_var="${friend_name}_CODE"
    friend_code="${!friend_code_var}"
    
    echo "👥 Adding $friend_name as friend of $user_name..."
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/friends/invite/accept" \
        -H "Authorization: Bearer $user_secret" \
        -H "Content-Type: application/json" \
        -d "{\"friendCode\":\"$friend_code\"}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "   ✓ Friendship created"
    else
        echo "   ⚠️  Warning (HTTP $http_code): $body"
    fi
}

echo "=========================================="
echo "Step 1: Configuring settings"
echo "=========================================="
echo ""

# Update settings for each user
update_settings "ALICE" "Alice" "EVERYONE" true 1000
update_settings "BOB" "Bob" "FRIENDS" true 1000
update_settings "CHARLIE" "Charlie" "FRIENDS" true 1000
update_settings "DANA" "Dana" "FRIENDS" true 1000
update_settings "EVE" "Eve" "EVERYONE" true 1000
update_settings "FRANK" "Frank" "EVERYONE" true 1000

echo ""
echo "=========================================="
echo "Step 2: Setting locations"
echo "=========================================="
echo ""

# Base: Vancouver Convention Centre (49.2891, -123.1112)
update_location "ALICE" 49.2891 -123.1112    # 0m (base)
update_location "BOB" 49.2905 -123.1112      # ~150m north
update_location "CHARLIE" 49.2932 -123.1112  # ~450m north
update_location "DANA" 49.2968 -123.1112     # ~850m north
update_location "EVE" 49.2918 -123.1112      # ~300m north
update_location "FRANK" 49.2945 -123.1112    # ~600m north

echo ""
echo "=========================================="
echo "Step 3: Creating friendships"
echo "=========================================="
echo ""

# Alice befriends Bob, Charlie, Dana
add_friend "ALICE" "BOB"
add_friend "ALICE" "CHARLIE"
add_friend "ALICE" "DANA"

# Reverse friendships (bidirectional)
add_friend "BOB" "ALICE"
add_friend "CHARLIE" "ALICE"
add_friend "DANA" "ALICE"

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Credentials saved to: $OUTPUT_FILE"
echo ""
echo "🔑 Quick Login Credentials:"
echo ""
echo "Alice (You - EVERYONE mode):"
echo "   Device Secret: $ALICE_SECRET"
echo "   Friend Code: $ALICE_CODE"
echo ""
echo "Bob (Friend - 150m north):"
echo "   Device Secret: $BOB_SECRET"
echo "   Friend Code: $BOB_CODE"
echo ""
echo "Charlie (Friend - 450m north):"
echo "   Device Secret: $CHARLIE_SECRET"
echo "   Friend Code: $CHARLIE_CODE"
echo ""
echo "Dana (Friend - 850m north):"
echo "   Device Secret: $DANA_SECRET"
echo "   Friend Code: $DANA_CODE"
echo ""
echo "Eve (Non-friend - 300m north):"
echo "   Device Secret: $EVE_SECRET"
echo "   Friend Code: $EVE_CODE"
echo ""
echo "Frank (Non-friend - 600m north):"
echo "   Device Secret: $FRANK_SECRET"
echo "   Friend Code: $FRANK_CODE"
echo ""
echo "=========================================="
echo "🧪 Testing Instructions"
echo "=========================================="
echo ""
echo "1. Open http://localhost:5174"
echo "2. Paste Alice's Device Secret above and click Login"
echo ""
echo "3. 🌍 IMPORTANT - Simulate Browser Location:"
echo "   Chrome/Edge:"
echo "     • Open DevTools (F12)"
echo "     • Press Ctrl+Shift+P → type 'sensors' → Show Sensors"
echo "     • Location → Other → Set to: 49.2891, -123.1112"
echo "     • Refresh page"
echo ""
echo "   Firefox:"
echo "     • Install 'Location Guard' extension"
echo "     • Set location to: 49.2891, -123.1112"
echo ""
echo "4. View Friends tab → See Bob, Charlie, Dana with distances"
echo "5. View Everyone tab → See all 5 users (green=friends, blue=others)"
echo "6. Switch to Map view → See clustering and color coding"
echo ""
echo "💡 To reset Alice's demo settings:"
echo "   Open browser console (F12) and run:"
echo "   localStorage.removeItem('alice-demo-settings')"
echo "   localStorage.removeItem('alice-demo-friends')"
echo "   Then refresh the page"
echo ""
echo "Why simulate location?"
echo "  The frontend uses navigator.geolocation to get YOUR location."
echo "  Without simulation, you'll show 0m from everyone."
echo ""
echo "To test as another user:"
echo "  - Open incognito window"
echo "  - Login with Bob/Charlie/Dana/Eve/Frank credentials above"
echo "  - Simulate their location from the table in SAMPLE_TESTING.md"
echo ""
echo "=========================================="
echo "⚠️  TROUBLESHOOTING"
echo "=========================================="
echo ""
echo "If you see 'Invalid device secret' errors:"
echo "  The database was likely reset. You need to manually register users"
echo "  with these exact device secrets. Contact the dev team for a"
echo "  database initialization script that pre-seeds these users."
echo ""
