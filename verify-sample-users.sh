#!/bin/bash

# Quick verification script for sample users setup

DB_FILE="backend/.wrangler/state/v3/d1/proximity-radar-db/db.sqlite"

echo "================================"
echo "Sample Users Verification"
echo "================================"
echo ""

if [ ! -f "$DB_FILE" ]; then
    echo "❌ Database file not found: $DB_FILE"
    echo "   Run 'cd backend && npm run dev' first to create the database"
    exit 1
fi

echo "📊 Users in database:"
echo ""
sqlite3 "$DB_FILE" "SELECT id, friend_code, display_name, mode FROM users WHERE id IN (1,2,3,4,5,6) ORDER BY id;"

echo ""
echo "🤝 Friendships:"
echo ""
sqlite3 "$DB_FILE" "SELECT user_id || ' → ' || friend_id FROM friendships WHERE user_id IN (1,2,3,4,5,6) ORDER BY user_id, friend_id;"

echo ""
echo "📍 Locations:"
echo ""
sqlite3 "$DB_FILE" "SELECT user_id, printf('%.4f, %.4f', latitude, longitude) as coords FROM locations WHERE user_id IN (1,2,3,4,5,6) ORDER BY user_id;"

echo ""
echo "================================"
echo "✅ Verification Complete"
echo "================================"
