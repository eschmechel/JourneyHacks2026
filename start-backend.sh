#!/bin/bash

# Start Backend Server Script
# Checks if already running and starts if needed

BACKEND_DIR="/home/Eragon/Repos/JourneyHacks2026/backend"
LOG_FILE="/home/Eragon/Repos/JourneyHacks2026/tmp/server.log"
PORT=8787

echo "🔍 Checking if backend is already running on port $PORT..."

if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Backend is already running on port $PORT"
    PID=$(lsof -ti:$PORT)
    echo "   PID: $PID"
    echo ""
    echo "To stop: kill $PID"
    exit 0
fi

echo "🚀 Starting backend server..."

cd "$BACKEND_DIR" || exit 1

# Ensure tmp directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Start backend in background
npx tsx dev-server.ts > "$LOG_FILE" 2>&1 &
BACKEND_PID=$!

# Wait a moment for server to start
sleep 3

# Check if server started successfully
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Backend started successfully on http://localhost:$PORT"
    echo "   PID: $BACKEND_PID"
    echo "   Logs: $LOG_FILE"
    echo ""
    echo "To stop: kill $BACKEND_PID"
else
    echo "❌ Failed to start backend server"
    echo "Check logs: tail -f $LOG_FILE"
    exit 1
fi
