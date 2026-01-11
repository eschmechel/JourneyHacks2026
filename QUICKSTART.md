# Beepd - Quick Start Guide

## 🚀 Starting the App

### Option 1: Using Scripts (Recommended)
```bash
# Start backend (checks if already running)
./start-backend.sh

# Start frontend (checks if already running)
./start-frontend.sh
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd backend
npx tsx dev-server.ts

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📱 Testing the App

### Servers
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8787

### Single Browser Demo

1. Open http://localhost:5173
2. Click "Register Device" → Get friend code (e.g., `HD7DNWC7`)
3. **Settings**: Set display name to "Alice"
4. **Friends**: You'll see Bob, Charlie, Diana (test data)
5. **Home**: Toggle between **Radar View** 🎯 and **List View** 📋
   - Radar shows friends positioned by distance and direction
   - Color-coded: Gold (Very Close) → Yellow (Close) → Light Yellow (Nearby)
   - Pulsing center = You
   - Pulsing rings = New proximity alerts

### Two-Browser Test (Full Demo)

**Browser 1 - Alice:**
1. Open http://localhost:5173
2. Register → Note friend code
3. Allow location access
4. Settings → Name: "Alice"

**Browser 2 - Bob (Incognito):**
1. Open http://localhost:5173 in incognito/private mode
2. Register → Note friend code
3. Allow location access
4. Settings → Name: "Bob"
5. Friends → Enter Alice's code → Add

**Test Proximity:**
- Home page updates every 30 seconds
- Watch radar view for real-time positioning
- Friends appear as dots when within radius

## 🎯 Radar View Features

- **Distance Rings**: 4 rings at 25%, 50%, 75%, 100% of your radius
- **Cardinal Directions**: N, E markers for orientation
- **Friend Dots**: Color-coded by distance category
  - 🟡 Gold = Very Close (<500m)
  - 🟡 Yellow = Close (<1km)
  - 🟡 Light Yellow = Nearby (<2km)
- **New Alerts**: Pulsing animation + thick border
- **Your Position**: Orange dot at center with pulsing ring
- **Friend Labels**: Name + distance shown on hover
- **Toggle View**: Switch between radar 🎯 and list 📋 modes

## 🧪 Test Data

Pre-loaded friends for testing:
- **Bob** (BOBTEST1): ~200m north (Very Close)
- **Charlie** (CHARLIE1): ~800m northeast (Close)
- **Diana** (DIANA001): ~3km north (Outside 1500m radius - won't show)

## 🛠️ Troubleshooting

**Backend not starting?**
```bash
lsof -ti:8787 | xargs kill -9  # Kill existing process
./start-backend.sh
```

**Frontend not starting?**
```bash
lsof -ti:5173 | xargs kill -9  # Kill existing process
./start-frontend.sh
```

**Check backend health:**
```bash
curl http://localhost:8787/health
```

**View backend logs:**
```bash
tail -f tmp/server.log
```

## 📊 API Endpoints

- `POST /auth/register` - Register device
- `GET /me/settings` - Get user settings
- `PUT /me/settings` - Update settings
- `PUT /me/location` - Update location
- `GET /nearby` - Get nearby friends
- `GET /friends` - List friends
- `POST /friends/invite/accept` - Add friend by code

## 🎨 Color Scheme

- Background: `#FFFEF0` (cream)
- Primary: `#FFD700` (gold)
- Accent: `#FFB000` (amber)
- No gradients - clean flat design with Radix UI

## ⏱️ Location Updates

- Auto-updates every 30 seconds
- Manual refresh available
- Requires browser geolocation permission
- 24-hour location expiry
## 🗺️ Map View

The map view shows all nearby friends on an interactive map with clustering:

### Features
- **Scope Tabs**: Toggle between "Friends" and "Everyone" mode
- **User Marker**: Your location shown with blue pulsing dot
- **Individual Markers**: Friends shown as colored pins based on distance
  - 🟢 Green = Very Close (<100m)
  - 🟡 Amber = Close (<500m)
  - 🟠 Orange = Medium (<1km)
  - 🔴 Red = Far (>1km)
- **Clustering**: Multiple nearby users grouped into clusters with count badges
- **Cluster Details**: Click cluster to see list of people, distances, and friend status
- **Auto-center**: Map centers on your location on load

### Using the Map
1. Navigate to Home page
2. Select scope (Friends/Everyone) using tabs at top
3. Click individual markers to see user details
4. Click cluster markers to see grouped users
5. Pan and zoom to explore the area
6. Map updates every 30 seconds with new nearby users

## 📱 Mobile App

Beepd includes a native mobile app built with Expo/React Native.

### Setup

```bash
cd mobile
npm install
npx expo start
```

### Running the App

**iOS Simulator:**
```bash
npx expo start --ios
```

**Android Emulator:**
```bash
npx expo start --android
```

**Physical Device:**
1. Install Expo Go app from App Store/Play Store
2. Run `npx expo start`
3. Scan QR code with camera (iOS) or Expo Go app (Android)

### Solo Demo with Location Simulation

To demo the mobile app without needing multiple devices:

1. **Register**: App auto-registers on first launch
2. **Go to Settings** → Scroll to "Location Simulation"
3. **Enter Coordinates**: E.g., San Francisco: `37.7749, -122.4194`
4. **Enable Simulation**: Tap "Enable Simulation"
5. **Go to Home**: Map will show your simulated location
6. **Add Friends**: Use friend codes from web app to add friends
7. **Test Visibility**: Switch between "Friends" and "Everyone" scopes

The simulation persists across app restarts and overrides GPS until disabled.

### Features
- **Tab Navigation**: Home (map), Friends (management), Settings (profile + simulation)
- **Auto-registration**: No login required, instant start
- **Location Simulation**: Demo mode for testing without moving
- **Real-time Map**: Shows nearby users with clustering
- **Friend Management**: Add friends by code, accept/reject requests
- **Settings**: Update display name, visibility mode, radius