# Beepd - 5-Minute Demo Script

## 🎯 Demo Overview
Show Beepd's core features: friend-based proximity awareness with radar visualization, map clustering, and mobile location simulation.

**Duration**: ~5 minutes  
**Requirements**: 2 browser windows, mobile device/simulator (optional)

---

## 📋 Prep Steps (2 minutes before demo)

1. **Start Services**:
   ```bash
   # Terminal 1 - Backend
   cd backend && npx tsx dev-server.ts
   
   # Terminal 2 - Frontend  
   cd frontend && npm run dev
   
   # Terminal 3 - Mobile (optional)
   cd mobile && npx expo start
   ```

2. **Open Browser Windows**:
   - Window 1: http://localhost:5173 (Alice)
   - Window 2: http://localhost:5173 incognito (Bob)

3. **Clear Test Data** (if needed):
   ```bash
   rm backend/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite*
   cd backend && npx tsx init-db.ts
   ```

---

## 🎬 Demo Flow

### Part 1: Registration & Setup (1 min)

**Browser 1 - Alice:**
1. Click "Register Device" → Auto-registers
2. Note friend code displayed (e.g., `HD7DNWC7`)
3. **Settings**: Set display name to "Alice"
4. **Settings**: Set radius to 5000m, mode "Everyone", check "Show friends on map"

**Browser 2 - Bob:**
1. Open incognito window → http://localhost:5173
2. Click "Register Device"
3. Note friend code
4. **Settings**: Set display name to "Bob"
5. **Friends**: Enter Alice's friend code → Click "Add Friend"
6. **Browser 1 (Alice)**: Accept Bob's friend request

### Part 2: Web Map View (1.5 min)

**Both Browsers:**
1. Navigate to **Home** page
2. Click **Map View** icon 🗺️
3. Allow location permission if prompted

**Show Features:**
- **Scope Toggle**: Switch between "Friends" and "Everyone" tabs
  - "Friends" = Only shows your friends
  - "Everyone" = Shows all users in radius
- **User Marker**: Your location (blue pulsing dot)
- **Nearby Users**: Colored pins based on distance
  - Green = Very close (<100m)
  - Amber = Close (<500m)
  - Orange = Medium (<1km)
  - Red = Far (>1km)
- **Clustering**: If users are near each other, they cluster with count badge
- **Click Cluster**: Opens sheet showing all users in that cluster
  - Names, distances, friend badges
  - Color-coded by distance

**Demo Clustering:**
- Zoom out → Multiple users cluster together
- Click cluster marker → See list of people
- Zoom in → Cluster expands to individual markers

### Part 3: Mobile App with Simulation (1.5 min)

**Mobile Device/Simulator:**
1. Scan QR code or launch in simulator
2. App auto-registers on first launch
3. Navigate through tabs: **Home** → **Friends** → **Settings**

**Settings - Location Simulation:**
1. Scroll to "Location Simulation" section
2. Enter coordinates:
   - **San Francisco**: `37.7749, -122.4194`
   - **New York**: `40.7128, -74.0060`
   - **Near Alice**: [use Alice's coordinates]
3. Tap "Enable Simulation"
4. Return to **Home** → Map shows simulated location

**Show Proximity:**
1. Mobile: Go to **Friends** → Enter Alice's friend code
2. Mobile: Home → Switch to "Friends" scope
3. Web (Alice): Refresh → See Bob appear on map
4. Mobile: Settings → Update simulation to coordinates near Alice
5. Mobile: Update location → Alice sees Bob move on her map
6. Demonstrate distance color changes as Bob "moves"

### Part 4: Radar View (1 min)

**Browser 1 (Alice):**
1. **Home** → Switch to **Radar View** 🎯
2. **Show Features**:
   - Center orange dot = Alice (pulsing ring)
   - Friend dots positioned by distance + direction
   - 4 distance rings (25%, 50%, 75%, 100% of radius)
   - Cardinal directions (N, E, S, W)
   - Color-coded dots (gold/yellow by distance)
   - Hover over dots → See name + distance
   - Toggle between Radar and List views

**Demonstrate Real-time Updates:**
1. Mobile (Bob): Settings → Change simulation coordinates
2. Wait ~30 seconds (or manually refresh)
3. Watch Bob's dot move on Alice's radar
4. New proximity alerts → Pulsing animation + thick border

---

## 🎤 Key Talking Points

### Problem
"It's hard to coordinate meetups with friends at large venues like conferences, concerts, or campus events. Texting 'where are you?' wastes time and battery."

### Solution
"Beepd shows nearby friends on a real-time map with radar visualization. See who's close, in what direction, and cluster groups together."

### Unique Features
1. **Dual Visualization**: Radar view (direction + distance) + Map view (geographic context)
2. **Clustering**: Handles crowds by grouping nearby users
3. **Friend Scopes**: Choose to be visible to friends only or everyone
4. **Location Simulation**: Demo without physically moving
5. **Privacy-First**: No permanent location storage, 24-hour expiry, friend-code based

### Tech Stack
- **Frontend**: React + TypeScript + Vite + Radix UI + Tailwind CSS
- **Backend**: Cloudflare Workers + D1 SQLite + TypeScript
- **Mobile**: Expo + React Native + react-native-maps + Supercluster
- **Clustering**: Supercluster algorithm (same on web + mobile)
- **Maps**: Leaflet (web), react-native-maps (mobile)

---

## 🛟 Troubleshooting

**Map not loading?**
- Check browser console for errors
- Verify `http://localhost:8787` is accessible
- Try disabling browser extensions

**Mobile app not connecting?**
- Update `API_URL` in `mobile/src/services/api.ts` to your local IP
- Ensure phone and computer are on same WiFi network
- Check firewall settings

**Clustering not working?**
- Zoom out to see clusters form
- Need 2+ users within ~60m to cluster
- Try adding more simulated locations

**Users not appearing?**
- Verify both users have updated locations recently
- Check scope setting (Friends vs Everyone)
- Verify friendship status if using Friends scope

---

## 📊 Demo Success Metrics

✅ Registered 2 users  
✅ Established friendship  
✅ Showed location updates  
✅ Demonstrated map clustering  
✅ Showed mobile simulation  
✅ Toggled radar/map views  
✅ Explained privacy model  

**Time**: 5 minutes  
**Impact**: Clear value proposition, working demo, technical depth
