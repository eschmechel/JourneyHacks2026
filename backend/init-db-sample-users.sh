#!/bin/bash

# Initialize D1 database with sample test users
# This script loads predetermined credentials into the database

echo "🚀 Initializing database with sample users..."
echo ""

# Path to the D1 database (adjust if needed)
DB_PATH=".wrangler/state/v3/d1/miniflare-D1DatabaseObject"

# Check if wrangler is running
if ! pgrep -f "wrangler dev" > /dev/null; then
    echo "⚠️  Warning: wrangler dev is not running"
    echo "   Start it with: npm run dev (from backend/)"
    echo ""
fi

# Check if we can find the database
if [ ! -d ".wrangler" ]; then
    echo "⚠️  .wrangler directory not found"
    echo "   Have you run 'npm run dev' at least once?"
    echo "   This creates the local D1 database."
    exit 1
fi

# Find the actual .sqlite file
SQLITE_FILES=$(find .wrangler/state -name "*.sqlite" 2>/dev/null)

if [ -z "$SQLITE_FILES" ]; then
    echo "⚠️  No .sqlite database files found"
    echo "   Run 'npm run dev' first to create the local database"
    exit 1
fi

# Use the first .sqlite file found
DB_FILE=$(echo "$SQLITE_FILES" | head -n1)

echo "📂 Database file: $DB_FILE"
echo ""

# Check if sqlite3 is available
if ! command -v sqlite3 &> /dev/null; then
    echo "❌ sqlite3 command not found"
    echo "   Install it with: sudo apt install sqlite3 (Ubuntu/Debian)"
    echo "   Or: brew install sqlite (macOS)"
    exit 1
fi

# Check if sample users already exist
EXISTING_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM users WHERE id IN (1,2,3,4,5,6);")

if [ "$EXISTING_COUNT" -gt 0 ]; then
    echo "⚠️  Found $EXISTING_COUNT existing sample users in database"
    echo ""
    read -p "   Delete and recreate them? (y/N): " confirm
    
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "   Aborted."
        exit 0
    fi
    
    echo ""
    echo "🗑️  Deleting existing sample users..."
    sqlite3 "$DB_FILE" "DELETE FROM friendships WHERE user_id IN (1,2,3,4,5,6) OR friend_id IN (1,2,3,4,5,6);"
    sqlite3 "$DB_FILE" "DELETE FROM locations WHERE user_id IN (1,2,3,4,5,6);"
    sqlite3 "$DB_FILE" "DELETE FROM users WHERE id IN (1,2,3,4,5,6);"
    echo "   ✓ Deleted"
fi

echo ""
echo "📝 Inserting sample users with fixed credentials..."

# Execute the SQL script
if sqlite3 "$DB_FILE" < init-sample-users.sql; then
    echo "   ✓ Success!"
else
    echo "   ✗ Failed to execute SQL"
    exit 1
fi

echo ""
echo "✅ Database initialized!"
echo ""
echo "📋 Sample users created:"
echo "   • Alice (ID: 1, Code: NR6M9ZZV)"
echo "   • Bob (ID: 2, Code: TLPVAGUX)"
echo "   • Charlie (ID: 3, Code: DHWX4QMR)"
echo "   • Dana (ID: 4, Code: Y7PWTYGB)"
echo "   • Eve (ID: 5, Code: 594GPN4H)"
echo "   • Frank (ID: 6, Code: GF3DVJZD)"
echo ""
echo "👥 Friendships created:"
echo "   • Alice ↔ Bob"
echo "   • Alice ↔ Charlie"
echo "   • Alice ↔ Dana"
echo ""
echo "🧪 Next steps:"
echo "   1. Restart wrangler dev if it's running (Ctrl+C, then npm run dev)"
echo "   2. Run ./setup-sample-users.sh to configure settings and locations"
echo "   3. Open http://localhost:5174 and login with Alice's device secret"
echo ""
