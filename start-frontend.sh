#!/bin/bash

# Start Frontend Server Script
# Checks if already running and starts if needed

FRONTEND_DIR="/home/Eragon/Repos/JourneyHacks2026/frontend"
PORT=5173

echo "🔍 Checking if frontend is already running on port $PORT..."

if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Frontend is already running on http://localhost:$PORT"
    PID=$(lsof -ti:$PORT)
    echo "   PID: $PID"
    echo ""
    echo "To stop: kill $PID"
    echo "Or visit: http://localhost:$PORT"
    exit 0
fi

echo "🚀 Starting frontend server..."

cd "$FRONTEND_DIR" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start frontend (this will run in foreground by default)
echo ""
echo "✅ Frontend starting on http://localhost:$PORT"
echo "   Press Ctrl+C to stop"
echo ""

npm run dev
