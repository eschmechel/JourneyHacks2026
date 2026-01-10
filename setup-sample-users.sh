#!/bin/bash

# Auto-register sample test users for Proximity Radar
# Creates 6 users with pre-configured settings and locations

API_BASE="http://localhost:8787"
OUTPUT_FILE="sample_users_credentials.txt"

echo "🚀 Registering sample test users..."
echo ""

# Clear previous credentials file
> "$OUTPUT_FILE"

# Function to register a user
register_user() {
    local name=$1
    echo "📝 Registering $name..."
    
    response=$(curl -s -X POST "$API_BASE/auth/register")
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to register $name"
        return 1
    fi
    
    device_secret=$(echo "$response" | grep -o '"deviceSecret":"[^"]*"' | cut -d'"' -f4)
    friend_code=$(echo "$response" | grep -o '"friendCode":"[^"]*"' | cut -d'"' -f4)
    user_id=$(echo "$response" | grep -o '"userId":[0-9]*' | cut -d':' -f2)
    
    if [ -z "$device_secret" ]; then
        echo "❌ Failed to extract credentials for $name"
        return 1
    fi
    
    echo "   ✓ ID: $user_id | Code: $friend_code"
    
    # Store in associative array style
    eval "${name}_SECRET=\"$device_secret\""
    eval "${name}_CODE=\"$friend_code\""
    eval "${name}_ID=\"$user_id\""
    
    # Save to file
    echo "$name:" >> "$OUTPUT_FILE"
    echo "  Device Secret: $device_secret" >> "$OUTPUT_FILE"
    echo "  Friend Code: $friend_code" >> "$OUTPUT_FILE"
    echo "  User ID: $user_id" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
}

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
    
    curl -s -X PUT "$API_BASE/me/settings" \
        -H "Authorization: Bearer $secret" \
        -H "Content-Type: application/json" \
        -d "{\"displayName\":\"$display_name\",\"mode\":\"$mode\",\"showFriendsOnMap\":$show_map,\"radiusMeters\":$radius}" > /dev/null
    
    echo "   ✓ Mode: $mode | Display: $display_name"
}

# Function to update location
update_location() {
    local name=$1
    local lat=$2
    local lon=$3
    
    secret_var="${name}_SECRET"
    secret="${!secret_var}"
    
    echo "📍 Setting $name location..."
    
    curl -s -X PUT "$API_BASE/me/location" \
        -H "Authorization: Bearer $secret" \
        -H "Content-Type: application/json" \
        -d "{\"latitude\":$lat,\"longitude\":$lon,\"isSimulated\":true}" > /dev/null
    
    echo "   ✓ Location: $lat, $lon"
}

# Function to add friend
add_friend() {
    local user_name=$1
    local friend_name=$2
    
    user_secret_var="${user_name}_SECRET"
    user_secret="${!user_secret_var}"
    
    friend_code_var="${friend_name}_CODE"
    friend_code="${!friend_code_var}"
    
    echo "👥 Adding $friend_name as friend of $user_name..."
    
    result=$(curl -s -X POST "$API_BASE/friends/invite/accept" \
        -H "Authorization: Bearer $user_secret" \
        -H "Content-Type: application/json" \
        -d "{\"friendCode\":\"$friend_code\"}")
    
    if echo "$result" | grep -q "error"; then
        echo "   ⚠️  Warning: $(echo "$result" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
    else
        echo "   ✓ Friendship created"
    fi
}

echo "=========================================="
echo "Step 1: Registering users"
echo "=========================================="
echo ""

# Register all users
register_user "ALICE"
register_user "BOB"
register_user "CHARLIE"
register_user "DANA"
register_user "EVE"
register_user "FRANK"

echo ""
echo "=========================================="
echo "Step 2: Configuring settings"
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
echo "Step 3: Setting locations"
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
echo "Step 4: Creating friendships"
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
