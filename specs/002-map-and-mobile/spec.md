# Feature Spec: Map Clustering + Dual Client (Web + Mobile)

**Feature ID**: 002  
**Feature Name**: Map Clustering + Dual Client (Web + Mobile)  
**Status**: Draft  
**Created**: 2026-01-10  
**Priority**: P1 (Hackathon scope)

---

## Overview

Extend the existing Proximity Radar MVP with:
1. **Real map UI** with tile-based map view, marker clustering, and scope separation (Friends vs Everyone)
2. **Mobile app** using Expo (React Native) that reuses the existing REST API

This builds on the working backend (Cloudflare Workers + D1) and web frontend (Vite + React) that already supports registration, settings, friends, proximity detection, nearby list, radar visualization, and simulation mode.

---

## Goals

### A) Real Map UI
- Replace or augment the radar view with a **real tile map** (e.g., Leaflet, Mapbox GL JS)
- **Marker clustering**: Multiple users in the same area appear as a single cluster marker with a count badge
- **Cluster interaction**: Clicking a cluster opens a list (modal/bottom sheet) showing all members inside with:
  - Display name only (never friend codes - those are invite secrets)
  - Friend badge indicator (if friend)
  - Distance band (VERY_CLOSE, CLOSE, NEARBY, FAR)
- **Dual scope system**:
  - **Friends tab**: Shows only friends who are nearby (if "Show friends on map" setting is enabled)
  - **Everyone tab**: Shows non-friends who are in Everyone mode (mutual opt-in required)
- **Privacy controls**:
  - Friends do NOT appear on map by default unless "Show friends on map" setting is enabled (default: OFF)
  - Everyone mode shows PUBLIC display names only (never friend codes)
  - Friend codes are never exposed in Everyone scope

### B) Dual Client Delivery
- **Web app**: Add map view with clustering to existing frontend
- **Mobile app**: Build Expo (React Native) app that:
  - Reuses the same REST API endpoints
  - Supports core flows: registration, sharing toggle/mode, radius, friends list/add friend, map view with clustering
  - Works with simulation mode or debug coordinate override (no second phone required for demo)

---

## Context & Constraints

### Existing System
- **Backend**: Cloudflare Workers, Hono, Drizzle ORM, D1 SQLite
- **Database**: users, locations, friendships, blocked_users, proximity_events tables
- **Auth**: UUID deviceSecret stored in localStorage, Bearer token authentication
- **Endpoints**: `/auth/register`, `/me/settings`, `/me/location`, `/nearby`, `/friends`, `/friends/invite/accept`
- **Frontend**: Vite + React, Radix UI, React Query, existing pages (Register, Home, Settings, Friends)
- **Features**: Proximity detection, radar visualization, friend management, simulation mode

### Constraints
- **Hackathon scope**: Ship web map + clustering first, mobile is "lite" port (must-haves only)
- **No calendar integration** in this spec
- **Reuse existing auth**: No JWT changes, keep deviceSecret approach
- **Privacy first**: Everyone mode requires mutual opt-in, no friend code exposure
- **Solo demo**: Mobile must work with simulation mode (no second device needed)

---

## User Stories

### US1: Real Map View (Web)
**As a** user  
**I want** to see nearby people on a real map with markers  
**So that** I can understand their location in a familiar geographic context

**Acceptance Criteria**:
- Map view tab/option is available on Home page
- Map centers on user's current location
- User's position is marked clearly (different color/icon)
- Nearby people appear as map markers at their actual lat/lng
- Map supports zoom/pan interactions
- Markers update when nearby data refreshes (30s polling)

### US2: Marker Clustering
**As a** user  
**I want** multiple people in the same area to cluster into a single marker  
**So that** the map doesn't get cluttered with overlapping markers

**Acceptance Criteria**:
- When 2+ people are within 50 meters (adjusts with zoom level), they appear as a single cluster marker
- Cluster marker shows a count badge (e.g., "3")
- Clicking a cluster marker opens a list showing all members
- Zooming in on a cluster splits it into individual markers when spread apart
- Clustering works for both Friends and Everyone scopes

### US3: Cluster Member List
**As a** user  
**I want** to see who is inside a cluster when I click it  
**So that** I can identify specific people in a crowded area

**Acceptance Criteria**:
- Clicking cluster opens a modal/bottom sheet
- List shows each member with:
  - Display name only (friend codes are never exposed in proximity UI)
  - Friend badge icon (if applicable)
  - Distance from user (e.g., "250m - VERY_CLOSE")
- List is scrollable for large clusters
- Closing list returns to map view
- Works for both Friends and Everyone clusters

### US4: Friends vs Everyone Scope Separation
**As a** user  
**I want** separate views for friends and everyone  
**So that** I can control who I see and who sees me

**Acceptance Criteria**:
- Map has tabs/segmented control: "Friends" and "Everyone"
- **Friends tab**:
  - Shows only friends who are nearby
  - Only visible if "Show friends on map" setting is enabled (default OFF)
  - Shows display names only (friend codes are never returned by /nearby endpoint)
- **Everyone tab**:
  - Shows only non-friends who are BOTH in Everyone mode
  - Shows public display names only (never friend codes)
  - Excludes friends (they belong in Friends tab)
- List view (existing nearby list) also respects scope separation
- Switching tabs updates map markers and list

### US5: Privacy Controls
**As a** user  
**I want** control over whether friends appear on my map  
**So that** I can protect friend privacy

**Acceptance Criteria**:
- Settings page has toggle: "Show friends on map" (default: OFF)
- When OFF: Friends tab is empty/disabled, only Everyone tab works
- When ON: Friends appear on Friends tab if they're nearby
- Everyone mode requires mutual opt-in: both users must be in Everyone mode to see each other
- Friend codes are NEVER returned in /nearby API responses (any scope - they are invite secrets)
- Display names are used for all proximity detection (map, list, clusters)

### US6: Mobile App (Expo)
**As a** user  
**I want** a mobile app with the same core features  
**So that** I can use proximity detection on my phone

**Acceptance Criteria**:
- Expo (React Native) app connects to same backend API
- Registration flow works (generates deviceSecret, stores in AsyncStorage)
- Sharing toggle/mode selector works (OFF/FRIENDS/EVERYONE)
- Radius setting works (100m - 5km)
- Friends list shows, add friend by code works
- Map view with clustering works
- Cluster list modal works
- Simulation mode or debug coordinate override allows solo demo

### US7: Mobile Simulation Mode
**As a** developer  
**I want** to test mobile app with fake coordinates  
**So that** I can demo without a second phone

**Acceptance Criteria**:
- Mobile app has debug setting to enable simulation mode
- When enabled, lat/lng input fields appear
- Entering coordinates overrides device location
- Location updates use simulated coordinates
- Works identically to web simulation mode

---

## Technical Design

### Frontend Changes (Web)

#### 1. Map Component
**File**: `frontend/src/components/MapView.tsx`

**Dependencies**:
- **React-Leaflet** (v4.2.1) - Lightweight, free OSM tiles, no API key required
- **Supercluster** (v8.0.1) - Fast point clustering (see plan.md for rationale)

**Props**:
```typescript
interface MapViewProps {
  nearby: NearbyFriend[];
  userLocation: { latitude: number; longitude: number } | null;
  scope: 'friends' | 'everyone';
  onClusterClick: (members: NearbyFriend[]) => void;
}
```

**Features**:
- Center map on `userLocation`
- Render user marker (orange, pulsing)
- Render nearby markers (color-coded by distance category)
- Apply clustering (distance threshold: ~50m)
- Handle cluster click to trigger modal

#### 2. Cluster List Modal
**File**: `frontend/src/components/ClusterListModal.tsx`

**Props**:
```typescript
interface ClusterListModalProps {
  members: NearbyFriend[];
  isOpen: boolean;
  onClose: () => void;
}
```

**UI**:
- Radix UI Dialog or Sheet component
- List with cards for each member
- Show: display name, friend badge, distance, distance category
- Scrollable for large clusters

#### 3. Scope Tabs
**File**: Update `frontend/src/pages/Home.tsx`

**UI**:
- Add Radix UI Tabs component: "Friends" and "Everyone"
- Friends tab: Map + List filtered to friends only
- Everyone tab: Map + List filtered to non-friends in Everyone mode
- Conditional rendering based on "Show friends on map" setting

#### 4. Settings Addition
**File**: `frontend/src/pages/Settings.tsx`

**New setting**:
```typescript
{
  label: "Show friends on map",
  type: "toggle",
  default: false
}
```

Store in user settings table (add `showFriendsOnMap` boolean column).

### Backend Changes

#### 1. API Modifications
**File**: `backend/src/location/nearby-handler.ts`

**Changes**:
- Add query parameter: `?scope=friends|everyone`
- **Friends scope**:
  - Return only friends (existing behavior)
  - Return display names and friend badge indicators
  - NEVER include friend codes (they are invite secrets, not proximity data)
- **Everyone scope**:
  - Return only non-friends who are BOTH in Everyone mode
  - Filter: `mode = 'EVERYONE'` for both requester and nearby user
  - Exclude friends (check friendships table)
  - NEVER include `friendCode` in response
  - Return `displayName` or fallback to "User-{userId}" if null

**Example response (Everyone scope)**:
```json
{
  "nearby": [
    {
      "userId": 42,
      "displayName": "Alice",
      "distance": 350,
      "distanceCategory": "VERY_CLOSE",
      "latitude": 37.7955,
      "longitude": -122.3937,
      "lastUpdated": "2026-01-10T12:34:56Z"
    }
  ],
  "newAlerts": [],
  "userLocation": { ... }
}
```

**Privacy enforcement**:
```typescript
// Pseudocode
if (scope === 'everyone') {
  // Filter to users in Everyone mode
  nearbyUsers = nearbyUsers.filter(u => u.mode === 'EVERYONE');
  
  // Exclude friends
  const friendIds = await getFriendIds(userId);
  nearbyUsers = nearbyUsers.filter(u => !friendIds.includes(u.userId));
  
  // Note: friendCode should never be in nearbyUsers array in the first place
  // It's an invite secret, not proximity data
}
```

#### 2. Database Schema Update
**File**: `backend/migrations/002_add_show_friends_on_map.sql`

```sql
ALTER TABLE users ADD COLUMN showFriendsOnMap INTEGER DEFAULT 0;
```

#### 3. Settings Endpoint Update
**File**: `backend/src/settings/update.ts`

Add validation for `showFriendsOnMap` boolean (convert to INTEGER for SQLite).

### Mobile App (Expo)

#### Project Structure
```
mobile/
├── app.json
├── package.json
├── App.tsx
├── src/
│   ├── screens/
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── FriendsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   ├── components/
│   │   ├── MapView.tsx
│   │   ├── ClusterListModal.tsx
│   │   ├── NearbyList.tsx
│   ├── services/
│   │   ├── api.ts (same as web, adapted for fetch)
│   │   ├── location.ts (native geolocation wrapper)
│   │   ├── storage.ts (AsyncStorage wrapper)
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   ├── types/
│   │   ├── models.ts
```

#### Key Dependencies
```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "react": "18.2.0",
    "react-native": "0.74.0",
    "react-native-maps": "^1.14.0",
    "react-native-maps-clustering": "^3.0.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "expo-location": "~16.0.0",
    "axios": "^1.8.0",
    "@react-native-async-storage/async-storage": "^1.23.0"
  }
}
```

#### Core Screens

**1. HomeScreen**
- Tabs: Friends / Everyone
- MapView component with clustering
- NearbyList component
- Manual refresh button
- Location status indicator

**2. FriendsScreen**
- Friend list
- Add friend by code input
- My friend code display

**3. SettingsScreen**
- Display name input
- Mode selector (OFF/FRIENDS/EVERYONE)
- Radius slider
- "Show friends on map" toggle
- Simulation mode toggle (debug only)

**4. MapView Component (Mobile)**
```tsx
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapCluster from 'react-native-maps-clustering';

// Uses react-native-maps-clustering for automatic clustering
// onClusterPress opens ClusterListModal
```

#### Simulation Mode (Mobile)
**File**: `mobile/src/components/LocationSimulator.tsx`

- Text inputs for latitude/longitude
- Update button
- Stored in AsyncStorage: `@simulatedLocation`
- Location service checks for simulated coords before using device GPS

#### Authentication (Mobile)
**File**: `mobile/src/contexts/AuthContext.tsx`

- Generate deviceSecret on first launch
- Store in AsyncStorage: `@deviceSecret`
- Same logic as web: add Bearer token to all API requests
- Register flow identical to web

---

## API Contract Changes

### New Query Parameter: `?scope=friends|everyone`

**Endpoint**: `GET /nearby?scope={scope}`

**Request**:
```
GET /nearby?scope=everyone
Authorization: Bearer {deviceSecret}
```

**Response (Everyone scope)**:
```json
{
  "nearby": [
    {
      "userId": 42,
      "displayName": "Alice",
      "distance": 350,
      "distanceCategory": "VERY_CLOSE",
      "latitude": 37.7955,
      "longitude": -122.3937,
      "lastUpdated": "2026-01-10T12:34:56Z"
    }
  ],
  "newAlerts": [],
  "userLocation": {
    "latitude": 37.7950,
    "longitude": -122.3945,
    "lastUpdated": "2026-01-10T12:35:00Z"
  }
}
```

**Response (Friends scope)**:
```json
{
  "nearby": [
    {
      "userId": 3,
      "displayName": "Bob",
      "isFriend": true,
      "distance": 200,
      "distanceCategory": "VERY_CLOSE",
      "latitude": 37.7955,
      "longitude": -122.3937,
      "bearing": 45,
      "lastUpdated": "2026-01-10T12:34:56Z"
    }
  ],
  "newAlerts": [3],
  "userLocation": { ... }
}
```

**Note**: Friend codes are NEVER returned by /nearby (any scope). They are invite secrets used only in:
- GET /friends endpoint (friend management)
- "My Friend Code" display (so user can share it)
- "Add Friend" input (to add new friends
```

### Settings Update Addition

**Endpoint**: `PUT /me/settings`

**New field**:
```json
{
  "displayName": "Alice",
  "mode": "EVERYONE",
  "radiusMeters": 1000,
  "showFriendsOnMap": true
}
```

---

## Privacy & Security

### Privacy Rules
1. **Everyone mode requires mutual opt-in**: Both users must have `mode = 'EVERYONE'` to see each other
2. **Friend codes are invite secrets**: NEVER returned by /nearby endpoint (any scope). Only visible in:
   - GET /friends endpoint (friend management page)
   - "My Friend Code" display (user's own code for sharing)
   - "Add Friend" input (to accept invitations)
3. **Friends excluded from Everyone tab**: Friends belong only in Friends scope
4. **Map visibility opt-in**: Friends only appear on map if "Show friends on map" setting is enabled
5. **Display names for proximity**: All proximity UI (map, list, clusters) shows display names only

### Security Considerations
- No changes to auth mechanism (deviceSecret remains)
- Backend validates scope parameter
- SQL queries enforce scope filtering
- Friend codes treated as invite secrets: never exposed in proximity detection (/nearby endpoint)
- Friend codes only accessible via /friends endpoint (requires authentication)

---

## Testing Strategy

### Web Testing
1. **Friends scope**:
   - Enable "Show friends on map" setting
   - Add test friend (Bob) at 200m
   - Verify Bob appears on Friends tab map
   - Verify Bob does NOT appear on Everyone tab
   - Click Bob's marker, verify friend badge shows

2. **Everyone scope**:
   - Set mode to EVERYONE
   - Create second test user (Charlie) in EVERYONE mode at 500m (not a friend)
   - Verify Charlie appears on Everyone tab
   - Verify Charlie does NOT appear on Friends tab
   - Verify friend code is NOT visible (never returned by /nearby)
   - Click Charlie's marker, verify distance shows, displayName shows, no friend code

3. **Clustering**:
   - Create 3+ test users at same location (within 50m)
   - Verify cluster marker appears with count badge
   - Click cluster, verify list modal shows all members
   - Zoom in, verify cluster splits

### Mobile Testing
1. **Registration**: Launch app, verify auto-register, verify deviceSecret stored
2. **Simulation mode**: Enable debug mode, enter test coordinates, verify location updates
3. **Map view**: Verify map renders, user marker appears, nearby markers appear
4. **Clustering**: Verify clusters work on mobile (react-native-maps-clustering)
5. **API compatibility**: Verify all API calls match web behavior

### Solo Demo (No Second Device)
1. Open web app in Browser 1 (Alice)
2. Open mobile app in simulator (Bob)
3. Both use simulation mode with coordinates 200m apart
4. Verify mutual visibility in appropriate scopes
5. Test cluster interaction on both platforms

---

## Implementation Phases

### Phase 1: Web Map UI (Priority: P1)
**Goal**: Ship map view with clustering on web

- [ ] Add React-Leaflet and Supercluster dependencies to web frontend
- [ ] Create MapView component with clustering
- [ ] Create ClusterListModal component
- [ ] Add scope tabs (Friends/Everyone) to Home page
- [ ] Update nearby API to support `?scope=` parameter
- [ ] Add backend filtering for Everyone scope (mutual opt-in, exclude friends, ensure friendCode never returned by /nearby)
- [ ] Add database migration for `showFriendsOnMap` column
- [ ] Add "Show friends on map" toggle to Settings page
- [ ] Wire up scope filtering in Home page
- [ ] Test Friends scope (with setting enabled, verify no friendCode in /nearby response)
- [ ] Test Everyone scope (mutual opt-in, no friend codes in /nearby)
- [ ] Test clustering (3+ users, cluster click, list modal)

**Demo-ready checkpoint**: Web app can show Friends and Everyone on map with clustering

### Phase 2: Mobile App (Priority: P1)
**Goal**: Ship mobile app with core features

- [ ] Initialize Expo project (`npx create-expo-app`)
- [ ] Install dependencies (react-native-maps, navigation, axios, AsyncStorage)
- [ ] Create API client (port from web, adapt for React Native)
- [ ] Create AuthContext (deviceSecret in AsyncStorage)
- [ ] Implement RegisterScreen (auto-register on first launch)
- [ ] Implement HomeScreen with map view
- [ ] Integrate react-native-maps-clustering
- [ ] Implement ClusterListModal (React Native modal)
- [ ] Implement FriendsScreen (list + add friend)
- [ ] Implement SettingsScreen (mode, radius, showFriendsOnMap, simulation toggle)
- [ ] Implement simulation mode (coordinate input, AsyncStorage storage)
- [ ] Implement native location service (expo-location wrapper)
- [ ] Wire up scope tabs (Friends/Everyone)
- [ ] Test on iOS simulator
- [ ] Test on Android emulator (optional)
- [ ] Test solo demo with web + mobile (both using simulation mode)

**Demo-ready checkpoint**: Mobile app fully functional, can demo alongside web app

### Phase 3: Polish (Priority: P2)
**Goal**: Final touches for demo

- [ ] Add loading skeletons to map view
- [ ] Add error handling for map tile failures
- [ ] Add zoom controls to map
- [ ] Add "Center on me" button to map
- [ ] Improve cluster styling (custom icons, colors)
- [ ] Add animations for marker appearance/disappearance
- [ ] Mobile: Add splash screen
- [ ] Mobile: Add app icon
- [ ] Update QUICKSTART.md with map + mobile instructions
- [ ] Record demo video (web + mobile)

---

## Open Questions

1. **Map provider**: ✅ **DECIDED - React-Leaflet** (see plan.md)
   - Rationale: No API key, simple setup, 1-2h vs 3-4h for MapLibre

2. **Clustering distance**: What radius defines a cluster?
   - **Recommendation**: 50-100 meters (configurable via map zoom level)

3. **Everyone mode default**: Should new users default to OFF or FRIENDS?
   - **Current**: Defaults to FRIENDS (from existing spec)

4. **Mobile platform priority**: iOS-first or Android-first?
   - **Recommendation**: iOS simulator for demo (easier setup), Android optional

5. **Map tile caching**: Cache tiles for offline support?
   - **Recommendation**: No for MVP (requires PWA/service worker setup)

---

## Success Metrics

### Demo Success Criteria
- [ ] Web: Friends tab shows friends on map (when setting enabled, displayName only)
- [ ] Web: Everyone tab shows non-friends in Everyone mode (displayName only)
- [ ] Web: Cluster marker appears for 3+ users
- [ ] Web: Clicking cluster opens list modal with all members
- [ ] Web: Friend codes never visible in any proximity UI (map, list, clusters)
- [ ] Mobile: App launches, registers, and shows map
- [ ] Mobile: Simulation mode allows solo demo
- [ ] Mobile: Clustering works on mobile
- [ ] Solo demo: Web + mobile can interact via simulation mode

### Technical Success Criteria
- [ ] Backend: `/nearby?scope=everyone` returns correct filtered data (no friendCode)
- [ ] Backend: `/nearby?scope=friends` returns correct filtered data (no friendCode)
- [ ] Backend: Friend codes excluded from ALL /nearby responses
- [ ] Frontend: Map renders smoothly (60fps)
- [ ] Frontend: Clustering updates in real-time (30s polling)
- [ ] Mobile: API compatibility 100% (same endpoints as web)
- [ ] Mobile: Works on iOS simulator without physical device

---

## Future Enhancements (Post-Hackathon)

1. **Real-time updates**: WebSocket/SSE for instant marker updates (no 30s polling)
2. **Offline support**: Cache map tiles for offline viewing
3. **Navigation**: Directions to nearby friend (integrate Google Maps/Apple Maps)
4. **Geofencing**: Push notifications when friend enters radius
5. **Heatmap mode**: Show density of Everyone mode users
6. **Place clustering**: Cluster by venue (e.g., "3 people at Starbucks")
7. **Mobile native features**: Background location, local notifications
8. **Cross-platform**: Flutter or native apps (instead of Expo)

---

## Acceptance Checklist

### Web App
- [ ] Map view renders with OSM tiles
- [ ] User marker appears at current location
- [ ] Nearby markers appear at correct lat/lng
- [ ] Markers color-coded by distance category
- [ ] Clustering works for 2+ users within 50m
- [ ] Cluster marker shows count badge
- [ ] Clicking cluster opens modal with member list
- [ ] Modal shows display name, friend badge, distance
- [ ] Friends tab shows friends only (when setting enabled)
- [ ] Everyone tab shows non-friends in Everyone mode only
- [ ] Friend codes never visible in any proximity UI (map/list/clusters - use displayName only)
- [ ] Scope tabs work (switching updates map + list)
- [ ] "Show friends on map" setting controls Friends tab visibility
- [ ] Map updates every 30s (polling)

### Mobile App
- [ ] Expo app builds and runs on iOS simulator
- [ ] Registration flow works (deviceSecret generated)
- [ ] Home screen shows map with markers
- [ ] Clustering works on mobile (react-native-maps-clustering)
- [ ] Clicking cluster opens modal
- [ ] Friends screen shows list + add friend
- [ ] Settings screen has all controls (mode, radius, showFriendsOnMap, simulation)
- [ ] Simulation mode allows coordinate input
- [ ] Location updates use simulated coords when enabled
- [ ] API calls use same endpoints as web
- [ ] Bearer token authentication works
- [ ] Scope tabs work (Friends/Everyone)

### Backend
- [ ] `/nearby?scope=friends` returns friends with isFriend=true (NO friend codes - they're invite secrets)
- [ ] `/nearby?scope=everyone` returns non-friends in Everyone mode
- [ ] Everyone scope excludes friends
- [ ] Everyone scope excludes users not in Everyone mode
- [ ] /nearby NEVER returns friend codes in any scope (use GET /friends for friend management)
- [ ] Mutual opt-in enforced (both users must be in Everyone mode)
- [ ] `showFriendsOnMap` setting persisted in database
- [ ] Settings endpoint validates new field

### Privacy
- [ ] Friend codes never appear in /nearby API responses (any scope - they're invite secrets)
- [ ] Friend codes only accessible via GET /friends endpoint (friend management)
- [ ] Friends excluded from Everyone tab/list
- [ ] Everyone mode requires both users in Everyone mode
- [ ] "Show friends on map" defaults to OFF
- [ ] Friends tab disabled when setting is OFF
- [ ] Proximity UI (map/list/clusters) shows display names only

### Demo
- [ ] Solo demo works with web + mobile (both using simulation)
- [ ] Two-browser demo works (one in Friends, one in Everyone)
- [ ] Clustering demo works (3+ users, cluster click, list)
- [ ] QUICKSTART.md updated with map + mobile instructions
