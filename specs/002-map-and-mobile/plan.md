# Implementation Plan: Map Clustering + Dual Client

**Feature ID**: 002  
**Created**: 2026-01-10  
**Estimated Duration**: 8-10 hours (Web: 5-6h, Mobile: 3-4h)

---

## 1. Architecture & Package Choices (Web)

### Stack Decision: React-Leaflet + Supercluster

**Chosen Stack**:
- **React-Leaflet** (v4.2.1) - React wrapper for Leaflet
- **Leaflet** (v1.9.4) - Core map library
- **Supercluster** (v8.0.1) - Fast point clustering
- **OpenStreetMap tiles** (free, no API key)

**Why This Stack for Hackathon**:
1. **No API keys required**: OSM tiles are free, immediate start
2. **Lightweight**: Leaflet is 39KB vs Mapbox GL (200KB+)
3. **Simple setup**: React-Leaflet works with existing React setup (no WebGL complexity)
4. **Proven clustering**: Supercluster is battle-tested, used by Mapbox internally
5. **Fast iteration**: Minimal boilerplate, can ship map in 1-2 hours
6. **Mobile parity**: react-native-maps has similar API patterns

**Alternative (Not Chosen)**:
- **MapLibre GL + supercluster**: Better performance, smoother animations, BUT:
  - Requires WebGL understanding
  - More complex setup (style.json config)
  - Steeper learning curve for 3D transforms
  - Takes 3-4 hours vs 1-2 hours for Leaflet

**Verdict**: React-Leaflet wins for hackathon speed. Ship fast, iterate later.

---

### Component Architecture (Web)

```
Home Page
├─ TabSelector (Friends/Everyone)
├─ ViewToggle (Radar/Map/List)
├─ MapView
│  ├─ MapContainer (React-Leaflet)
│  ├─ TileLayer (OSM)
│  ├─ UserMarker (pulsing dot)
│  └─ ClusterLayer
│     ├─ MarkerClusterGroup (custom)
│     ├─ IndividualMarker (single person)
│     └─ ClusterMarker (2+ people, count badge)
├─ ClusterSheet (Radix Dialog/Sheet)
│  ├─ SheetHeader ("3 people nearby")
│  ├─ MemberList
│  │  └─ MemberCard (name, badge, distance)
│  └─ SheetClose
└─ NearbyList (existing, scope-filtered)

Settings Page
└─ ShowFriendsOnMapToggle (new)
```

#### Minimal Components

**1. MapView.tsx** (~150 lines)
```tsx
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import Supercluster from 'supercluster';

interface MapViewProps {
  nearby: NearbyFriend[];
  userLocation: UserLocation;
  onClusterClick: (members: NearbyFriend[]) => void;
}

// Features:
// - Initialize supercluster with nearby points
// - Render user marker (orange, pulsing CSS)
// - Render clusters (custom divIcon with count badge)
// - Render individual markers (color by distance category)
// - Click handler for clusters
// - Auto-center on user location (flyTo)
```

**2. ClusterSheet.tsx** (~80 lines)
```tsx
import { Dialog, Flex, Card, Text, Badge } from '@radix-ui/themes';

interface ClusterSheetProps {
  members: NearbyFriend[];
  isOpen: boolean;
  onClose: () => void;
}

// Features:
// - Radix Dialog as sheet (position: bottom on mobile)
// - Header with count ("3 people nearby")
// - Scrollable list of MemberCard components
// - Each card: displayName, friend badge if isFriend, distance + category
```

**3. TabSelector.tsx** (~40 lines)
```tsx
import { Tabs } from '@radix-ui/themes';

// Simple tabs component: Friends | Everyone
// Emits onChange('friends' | 'everyone')
```

**4. SettingsToggle.tsx** (update existing Settings.tsx) (~20 lines)
```tsx
// Add one toggle:
// "Show friends on map" (default: false)
// Stores in user.showFriendsOnMap
```

---

## 2. API Contract Updates (Minimal Backend Changes)

### Goal: Reuse existing /nearby endpoint, extend with scope parameter

### Changes Required

#### A) Add Query Parameter Support
**Endpoint**: `GET /nearby?scope=friends|everyone`

**File**: `backend/src/location/nearby-handler.ts`

**Logic**:
```typescript
// Existing code returns friends + proximity logic
// New: Add scope filtering

const scope = c.req.query('scope') || 'friends'; // default: friends

if (scope === 'friends') {
  // EXISTING BEHAVIOR: Return friends who are nearby
  // Include: friendCode, displayName, all fields
} else if (scope === 'everyone') {
  // NEW BEHAVIOR: Return non-friends in Everyone mode
  // 1. Filter users where mode = 'EVERYONE'
  // 2. Filter requester mode = 'EVERYONE' (mutual opt-in)
  // 3. Exclude friends (anti-join on friendships table)
  // 4. Exclude blocked users (existing logic)
  // 5. Calculate distance (existing Haversine logic)
  // 6. REMOVE friendCode from response (map out)
  // 7. Add isFriend = false to each result
}
```

**Response Schema Update**:
```typescript
interface NearbyResponse {
  nearby: Array<{
    userId: number;
    displayName: string | null;
    friendCode?: string; // ONLY present in scope=friends
    isFriend: boolean; // NEW: true for friends, false for everyone
    distance: number;
    distanceCategory: 'VERY_CLOSE' | 'CLOSE' | 'NEARBY' | 'FAR';
    latitude: number;
    longitude: number;
    bearing: number; // NEW: calculated bearing from user to friend
    lastUpdated: string;
  }>;
  newAlerts: number[];
  userLocation: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
}
```

**New Fields**:
1. **`isFriend`**: Boolean flag for UI (show friend badge)
2. **`bearing`**: Degrees from north (0-360) for radar positioning (already exists, ensure it's returned)

#### B) Database Schema Update
**File**: `backend/migrations/002_add_show_friends_on_map.sql`

```sql
-- Add setting to control friend visibility on map
ALTER TABLE users ADD COLUMN showFriendsOnMap INTEGER DEFAULT 0;
```

**File**: `backend/src/db/schema.ts`

```typescript
export const users = sqliteTable('users', {
  // ... existing fields
  showFriendsOnMap: integer('showFriendsOnMap').default(0), // NEW
});
```

#### C) Settings Endpoint Update
**File**: `backend/src/settings/update.ts`

```typescript
// Add validation for showFriendsOnMap
const updateSchema = z.object({
  displayName: z.string().optional(),
  mode: z.enum(['OFF', 'FRIENDS', 'EVERYONE']).optional(),
  radiusMeters: z.number().min(100).max(5000).optional(),
  showFriendsOnMap: z.boolean().optional(), // NEW
});

// Convert boolean to INTEGER for SQLite
const updates: any = {};
if (body.showFriendsOnMap !== undefined) {
  updates.showFriendsOnMap = body.showFriendsOnMap ? 1 : 0;
}
```

#### D) Privacy Enforcement Rules
**File**: `backend/src/location/nearby.ts`

```typescript
// Pseudocode for Everyone scope filtering

async function findNearbyEveryone(userId, latitude, longitude, radiusMeters) {
  // 1. Get requester's mode
  const requester = await getUserById(userId);
  if (requester.mode !== 'EVERYONE') {
    return []; // Requester not in Everyone mode, return empty
  }

  // 2. Get all friends (to exclude)
  const friendIds = await db
    .select({ friendId: friendships.friendId })
    .from(friendships)
    .where(eq(friendships.userId, userId));
  
  const friendIdList = friendIds.map(f => f.friendId);

  // 3. Get all locations within radius
  const nearbyLocations = await db
    .select()
    .from(locations)
    .innerJoin(users, eq(locations.userId, users.id))
    .where(
      and(
        ne(users.id, userId), // Not self
        eq(users.mode, 'EVERYONE'), // Must be in Everyone mode
        notInArray(users.id, friendIdList), // Not a friend
        // Distance filter via Haversine (existing logic)
      )
    );

  // 4. Calculate bearing and distance (existing logic)
  const results = nearbyLocations.map(loc => ({
    userId: loc.users.id,
    displayName: loc.users.displayName || `User-${loc.users.id}`,
    // NO friendCode
    isFriend: false,
    distance: calculateDistance(...),
    distanceCategory: getDistanceCategory(...),
    latitude: loc.locations.latitude,
    longitude: loc.locations.longitude,
    bearing: calculateBearing(...),
    lastUpdated: loc.locations.updatedAt,
  }));

  return results;
}
```

**Key Rules**:
1. **Mutual opt-in**: Both users must have `mode = 'EVERYONE'`
2. **Exclude friends**: Anti-join on friendships table
3. **Hide friendCode**: Never return in Everyone scope
4. **Fallback displayName**: If null, use `"User-{userId}"`

---

## 3. Mobile (Expo) Integration Plan

### Stack Decision: Expo + React Native Maps

**Chosen Stack**:
- **Expo SDK 51** (latest stable)
- **Expo Router** (file-based routing, simpler than React Navigation)
- **react-native-maps** (v1.14) - Native maps for iOS/Android
- **Supercluster** (v8.0.1) - Same clustering library as web
- **expo-location** (v16) - Native geolocation
- **AsyncStorage** (v1.23) - Persistent storage

**Why This Stack**:
1. **Expo Router**: Zero boilerplate, file-based routing like Next.js
2. **react-native-maps**: Native performance, free (uses Apple Maps on iOS, Google Maps on Android)
3. **Supercluster**: Reuse exact same clustering logic as web (share algorithm)
4. **expo-location**: Built-in geolocation, no native code needed

**Clustering Approach**:
- Use **supercluster** directly (same as web)
- Render clusters as custom `<Marker>` components with count badge
- No external clustering library needed (react-native-maps-clustering has bugs)

---

### Mobile App Architecture

```
mobile/
├── app/                    # Expo Router (file-based routing)
│   ├── _layout.tsx         # Root layout (AuthProvider)
│   ├── (tabs)/             # Tab navigator
│   │   ├── _layout.tsx     # Tab bar config
│   │   ├── index.tsx       # Home (Map + Nearby)
│   │   ├── friends.tsx     # Friends list
│   │   └── settings.tsx    # Settings
│   └── register.tsx        # Registration (redirect if no deviceSecret)
├── components/
│   ├── MapView.tsx         # Map with clustering
│   ├── ClusterMarker.tsx   # Cluster marker (count badge)
│   ├── UserMarker.tsx      # User position marker
│   ├── ClusterSheet.tsx    # Bottom sheet with member list
│   ├── NearbyList.tsx      # List view (non-map)
│   └── SimulationControls.tsx  # Debug coordinate input
├── services/
│   ├── api.ts              # Axios client (same as web)
│   ├── location.ts         # Geolocation wrapper
│   └── storage.ts          # AsyncStorage wrapper
├── contexts/
│   └── AuthContext.tsx     # deviceSecret + user state
├── utils/
│   ├── clustering.ts       # Supercluster setup
│   └── haversine.ts        # Distance/bearing calc
└── types/
    └── models.ts           # Shared types
```

### Key Components

**1. MapView.tsx** (~200 lines)
```tsx
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import Supercluster from 'supercluster';
import { useState, useEffect } from 'react';

// Features:
// - Initialize supercluster with nearby points
// - Track map region (lat, lng, zoom) via onRegionChangeComplete
// - Recalculate clusters on region change
// - Render user marker (custom pin)
// - Render cluster markers (custom view with count badge)
// - Render individual markers (color by distance category)
// - onPress handler for clusters → open ClusterSheet
```

**2. ClusterSheet.tsx** (~100 lines)
```tsx
import { Modal, ScrollView, View, Text, Pressable } from 'react-native';

// Features:
// - Modal with transparent background
// - Animated slide-up from bottom
// - Header with count ("3 people nearby")
// - ScrollView with member cards
// - Each card: name, friend badge, distance, distance category
// - Close button
```

**3. SimulationControls.tsx** (~80 lines)
```tsx
import { View, TextInput, Button, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Features:
// - Toggle: "Simulation Mode" (default: false)
// - When ON: Show lat/lng input fields
// - "Update Location" button
// - Store in AsyncStorage: @simulatedLocation
// - Used by location.ts service
```

**4. Location Service** (~60 lines)
```typescript
// services/location.ts
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getCurrentLocation() {
  // 1. Check if simulation mode enabled
  const simulated = await AsyncStorage.getItem('@simulatedLocation');
  if (simulated) {
    return JSON.parse(simulated); // { latitude, longitude }
  }

  // 2. Request permissions
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }

  // 3. Get device location
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
  };
}
```

---

### Mobile-Specific Features

#### Simulation Mode (Debug)
**Purpose**: Demo on one device without moving

**UI** (Settings screen):
```tsx
<Switch 
  value={simulationEnabled} 
  onValueChange={setSimulationEnabled}
/>

{simulationEnabled && (
  <View>
    <TextInput 
      placeholder="Latitude (e.g., 37.7749)"
      value={latitude}
      onChangeText={setLatitude}
      keyboardType="numeric"
    />
    <TextInput 
      placeholder="Longitude (e.g., -122.4194)"
      value={longitude}
      onChangeText={setLongitude}
      keyboardType="numeric"
    />
    <Button title="Update Location" onPress={saveSimulatedLocation} />
  </View>
)}
```

**Storage**:
```typescript
// Store in AsyncStorage
await AsyncStorage.setItem('@simulatedLocation', JSON.stringify({
  latitude: parseFloat(latitude),
  longitude: parseFloat(longitude),
}));
```

**Usage**:
- Location service checks `@simulatedLocation` first
- If present, use simulated coords instead of GPS
- API calls use simulated location
- Allows solo demo: web browser + mobile simulator with different coords

---

## 4. Execution Strategy

### Delivery Phases

#### Phase 1: Web Map UI (5-6 hours)
**Goal**: Ship map view with clustering on web, Friends/Everyone scopes

**Subtasks** (each ≤1 hour):

1. **Backend: Scope parameter support** (45 min)
   - Add `?scope=` query param to `/nearby` endpoint
   - Add Everyone scope filtering logic (mutual opt-in, exclude friends)
   - Remove friendCode from Everyone responses
   - Add `isFriend` boolean to all responses
   - Test with Postman/curl

2. **Backend: Database migration** (15 min)
   - Create `002_add_show_friends_on_map.sql`
   - Add `showFriendsOnMap` column
   - Update Drizzle schema
   - Run migration
   - Test settings endpoint

3. **Frontend: Install dependencies** (10 min)
   - `npm install react-leaflet leaflet supercluster`
   - `npm install -D @types/leaflet`
   - Import Leaflet CSS in `index.css`

4. **Frontend: MapView component** (90 min)
   - Create `MapView.tsx` with React-Leaflet
   - Set up Supercluster for clustering
   - Render user marker (orange, pulsing CSS)
   - Render clusters (custom divIcon with count badge)
   - Render individual markers (color by distance)
   - Handle cluster click events
   - Test with static data

5. **Frontend: ClusterSheet component** (45 min)
   - Create `ClusterSheet.tsx` with Radix Dialog
   - Render member list with cards
   - Show displayName, friend badge, distance
   - Add close handler
   - Style with yellow/white theme

6. **Frontend: Integrate into Home page** (60 min)
   - Add tab selector (Friends/Everyone)
   - Add view toggle (Radar/Map/List)
   - Wire up scope to API calls (`?scope=friends` or `?scope=everyone`)
   - Filter nearby data by scope
   - Pass filtered data to MapView
   - Handle cluster click → open ClusterSheet
   - Test scope switching

7. **Frontend: Settings toggle** (20 min)
   - Add "Show friends on map" toggle to Settings page
   - Wire up to PUT /me/settings
   - Store in user state
   - Conditionally hide Friends tab if OFF

8. **Testing & Polish** (45 min)
   - Test Friends scope (with setting ON)
   - Test Everyone scope (mutual opt-in)
   - Test clustering (3+ users, click cluster)
   - Verify friend codes hidden in Everyone scope
   - Fix bugs, adjust styling
   - Update QUICKSTART.md

**Checkpoint**: Web map fully functional, demo-ready

---

#### Phase 2: Mobile App (3-4 hours)
**Goal**: Ship mobile app with map, clustering, simulation mode

**Subtasks** (each ≤1 hour):

1. **Project setup** (30 min)
   - `npx create-expo-app mobile --template blank-typescript`
   - Install dependencies: `expo-router`, `react-native-maps`, `expo-location`, `axios`, `@react-native-async-storage/async-storage`, `supercluster`
   - Configure Expo Router (create `app/` directory)
   - Configure react-native-maps (add to `app.json`)

2. **API client + Auth** (45 min)
   - Port `services/api.ts` from web (adapt axios for RN)
   - Create `AuthContext.tsx` (deviceSecret in AsyncStorage)
   - Create `storage.ts` wrapper for AsyncStorage
   - Implement registration flow (auto-register on first launch)
   - Test auth flow in simulator

3. **Location service + Simulation** (45 min)
   - Create `services/location.ts` with expo-location
   - Implement simulation mode (check AsyncStorage first)
   - Create `SimulationControls.tsx` component
   - Add to Settings screen
   - Test: enter coords → verify API call uses simulated location

4. **MapView component** (90 min)
   - Create `MapView.tsx` with react-native-maps
   - Port clustering logic from web (supercluster)
   - Render user marker (custom image or SVG)
   - Render cluster markers (View with Text badge)
   - Render individual markers (colored by distance)
   - Handle region changes → recalculate clusters
   - Handle marker press → open ClusterSheet
   - Test clustering on simulator

5. **Screens** (60 min)
   - Create `app/(tabs)/index.tsx` (Home with map)
   - Create `app/(tabs)/friends.tsx` (friends list + add friend)
   - Create `app/(tabs)/settings.tsx` (mode, radius, showFriendsOnMap, simulation)
   - Add tab navigator with icons
   - Wire up scope switching (Friends/Everyone)
   - Style with yellow/white theme

6. **ClusterSheet + Polish** (30 min)
   - Create `ClusterSheet.tsx` modal
   - Render member cards
   - Add close button
   - Test modal animations
   - Fix styling issues

**Checkpoint**: Mobile app fully functional, solo demo works

---

### Cut-Lines & Risk Mitigations

#### Must-Have (Ship Phase 1)
- Web map view with clustering ✅
- Friends/Everyone scope separation ✅
- Friend codes hidden in Everyone scope ✅
- "Show friends on map" setting ✅

#### Nice-to-Have (Ship Phase 2 if time)
- Mobile app with map ⚠️
- Simulation mode on mobile ⚠️

#### Cut If Time Runs Out
- Mobile app entirely (web-only demo)
- Smooth animations on map
- Custom cluster icons (use default circle)
- Zoom controls (use default pinch-to-zoom)

#### Risk Mitigations

**Risk 1: Clustering performance issues**
- **Mitigation**: Supercluster is very fast (handles 100k points)
- **Fallback**: Disable clustering, show all markers (acceptable for demo with <20 users)

**Risk 2: react-native-maps setup issues**
- **Mitigation**: Use Expo's default maps provider (no API key needed)
- **Fallback**: Skip mobile entirely, web-only demo

**Risk 3: Scope filtering bugs**
- **Mitigation**: Write SQL query in isolation, test with sqlite3 CLI first
- **Fallback**: Single scope only (Friends or Everyone, not both)

**Risk 4: Mobile simulation mode broken**
- **Mitigation**: Test early, use AsyncStorage directly in demo if needed
- **Fallback**: Use two physical devices (or web + mobile with real GPS)

---

### Task Breakdown (Granular)

#### Backend Tasks (2 hours)
- [ ] **B1** (45m): Add scope parameter to /nearby endpoint, implement Everyone filtering logic
- [ ] **B2** (15m): Create migration 002_add_show_friends_on_map.sql, update schema
- [ ] **B3** (20m): Update settings endpoint to handle showFriendsOnMap
- [ ] **B4** (20m): Add isFriend boolean to nearby responses
- [ ] **B5** (20m): Test scope=friends and scope=everyone with curl

#### Frontend Web Tasks (4 hours)
- [ ] **W1** (10m): Install react-leaflet, leaflet, supercluster dependencies
- [ ] **W2** (90m): Create MapView.tsx with clustering, user marker, nearby markers
- [ ] **W3** (45m): Create ClusterSheet.tsx modal with member list
- [ ] **W4** (30m): Add TabSelector component (Friends/Everyone)
- [ ] **W5** (60m): Integrate map into Home page, wire up scope switching
- [ ] **W6** (20m): Add "Show friends on map" toggle to Settings
- [ ] **W7** (45m): Test all scope combinations, fix bugs, style polish

#### Frontend Mobile Tasks (3-4 hours)
- [ ] **M1** (30m): Create Expo project, install dependencies, configure routing
- [ ] **M2** (45m): Create API client, AuthContext, storage wrapper
- [ ] **M3** (45m): Create location service with simulation mode
- [ ] **M4** (90m): Create MapView component with react-native-maps + clustering
- [ ] **M5** (60m): Create all screens (Home, Friends, Settings)
- [ ] **M6** (30m): Create ClusterSheet modal, polish UI

---

### Testing Checklist

#### Web Testing
- [ ] Map renders with OSM tiles
- [ ] User marker appears at correct location
- [ ] Nearby markers appear (Friends scope)
- [ ] Nearby markers appear (Everyone scope, non-friends only)
- [ ] Clustering works (3+ users → cluster marker with count)
- [ ] Clicking cluster opens sheet with all members
- [ ] Friend badge shows in cluster sheet (Friends scope)
- [ ] Friend codes NEVER visible in Everyone scope
- [ ] Tab switching updates map (Friends ↔ Everyone)
- [ ] "Show friends on map" toggle controls Friends tab visibility
- [ ] Map updates on 30s polling interval

#### Mobile Testing
- [ ] App launches without errors
- [ ] Registration creates deviceSecret
- [ ] Map renders with native maps (Apple Maps on iOS)
- [ ] User marker appears
- [ ] Nearby markers appear
- [ ] Clustering works (react-native-maps)
- [ ] Clicking cluster opens bottom sheet
- [ ] Simulation mode: input coords → location updates
- [ ] Tab navigation works
- [ ] Settings save correctly
- [ ] Scope switching works (Friends/Everyone)

#### Integration Testing
- [ ] Web (Alice in Everyone mode) + Mobile (Bob in Everyone mode) see each other
- [ ] Web (Alice) + Mobile (Bob, friends) see each other in Friends scope
- [ ] Cluster with mixed Friends/Everyone members shows correct badges
- [ ] Solo demo works: Web + Mobile both using simulation mode

---

## 5. Timeline Estimate

### Optimistic (8 hours)
- Backend: 1.5 hours
- Web: 3.5 hours
- Mobile: 3 hours

### Realistic (10 hours)
- Backend: 2 hours (debugging scope filtering)
- Web: 4 hours (clustering edge cases, styling)
- Mobile: 4 hours (react-native-maps setup, clustering port)

### Pessimistic (12 hours)
- Backend: 2.5 hours (SQL query optimization)
- Web: 5 hours (Leaflet quirks, cluster animation)
- Mobile: 4.5 hours (iOS simulator issues, clustering bugs)

**Recommended Approach**: Ship Web Phase 1 first (6 hours), then assess if time allows for Mobile Phase 2.

---

## 6. Dependencies & Versions

### Web (Add to frontend/package.json)
```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "supercluster": "^8.0.1"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "@types/supercluster": "^7.1.3"
  }
}
```

### Mobile (Create mobile/package.json)
```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-maps": "1.14.0",
    "expo-location": "~16.0.0",
    "axios": "^1.8.0",
    "@react-native-async-storage/async-storage": "^1.23.0",
    "supercluster": "^8.0.1"
  }
}
```

---

## 7. Open Questions & Decisions

### Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Map library (web) | React-Leaflet | No API key, simple setup, 1-2h vs 3-4h for MapLibre |
| Map library (mobile) | react-native-maps | Native performance, free, Expo-compatible |
| Clustering | Supercluster | Fast, proven, share logic between web + mobile |
| Mobile routing | Expo Router | File-based, zero config, modern |
| Scope default | Friends | Safer default (explicit opt-in to Everyone) |
| showFriendsOnMap default | OFF | Privacy-first (friends don't appear unless enabled) |

### Open Questions
1. **Cluster radius**: 50m or 100m? → **50m** (more granular)
2. **Cluster zoom behavior**: Auto-zoom when clicking? → **No** (just show sheet)
3. **Mobile platform priority**: iOS or Android? → **iOS** (easier simulator setup)
4. **Offline maps**: Cache tiles? → **No** (out of scope, requires service worker)

---

## Success Criteria

### Demo-Ready Definition
- [ ] Web: Can switch between Friends/Everyone tabs
- [ ] Web: Map shows nearby users with correct scope filtering
- [ ] Web: Clicking cluster (3+ users) opens sheet with all members
- [ ] Web: Friend codes never visible in Everyone scope
- [ ] Mobile: App launches, registers, shows map
- [ ] Mobile: Simulation mode works (can demo with web + mobile)
- [ ] Integration: Web + Mobile can see each other (Everyone scope)

### Technical Success
- [ ] Backend: scope=friends|everyone works correctly
- [ ] Backend: Mutual opt-in enforced (both users in Everyone mode)
- [ ] Frontend: Clustering updates on 30s polling
- [ ] Frontend: No performance issues with 10+ markers
- [ ] Mobile: Works on iOS simulator without physical device

---

## Next Steps

1. **Immediate**: Start with Backend B1 (scope parameter support) - blocks everything else
2. **Parallel after B1**: Frontend W1 (install deps) + W2 (MapView) can start
3. **Phase 1 complete**: Web demo-ready (6 hours)
4. **Phase 2 start**: Mobile M1 (project setup) only if Phase 1 delivered on time
5. **Fallback**: If running late, skip mobile entirely, polish web demo
