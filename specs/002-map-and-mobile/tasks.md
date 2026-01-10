# Tasks: Map Clustering + Dual Client (Web + Mobile)

**Feature**: Map Clustering + Dual Client (Web + Mobile)  
**Branch**: `002-map-and-mobile`  
**Input**: Design documents from `/specs/002-map-and-mobile/`

**Implementation Strategy**: Build web map first (Phase A), then mobile (Phase B), then polish (Phase C). Each phase is independently demoable.

---

## Format: `- [ ] [ID] [P?] Description with file path`

- **[P]**: Parallelizable (different files, no blocking dependencies)
- File paths use `backend/` and `frontend/` prefixes

---

## Phase A: Web Map + Clustering (Demo-Ready in 5-6 hours)

**Purpose**: Add real map view with marker clustering and Friends/Everyone scope separation to existing web app

**Demo Criteria**: 
- Two browser windows can see each other on map (Everyone mode)
- Friends appear on separate tab (Friends mode)
- 3+ users in same area show as cluster with count badge
- Clicking cluster opens list of members

### Backend Updates (Minimal Diffs)

- [ ] T001 Create migration 002_add_show_friends_on_map.sql and update Drizzle schema to add showFriendsOnMap INTEGER column (default: 0) in backend/migrations/ and backend/src/db/schema.ts
- [ ] T002 Add scope parameter support to backend/src/location/nearby-handler.ts (?scope=friends|everyone) and implement Everyone filtering (mutual opt-in, exclude friends, exclude blocked, add isFriend boolean, remove friendCode for Everyone scope)
- [ ] T003 Update settings endpoint backend/src/settings/update.ts to validate and persist showFriendsOnMap boolean (convert to INTEGER for SQLite)

**Checkpoint**: Backend supports scope parameter, run migration, test with curl

### Web Frontend: Map Components

- [ ] T004 Install dependencies (leaflet, react-leaflet, supercluster) and import Leaflet CSS in frontend/src/index.css with marker styles (pulsing user, color-coded distance)
- [ ] T005 Create clustering utility frontend/src/utils/clustering.ts (supercluster setup with 50m base radius, getClusters function, types)
- [ ] T006 Create MapView component frontend/src/components/MapView.tsx (MapContainer, OSM tiles, user marker, cluster markers with count badges, click handlers)
- [ ] T007 Create ClusterSheet component frontend/src/components/ClusterSheet.tsx (Radix Dialog, member list with displayName, friend badge, distance + category)

### Web Frontend: Integration

- [ ] T008 Update Home page frontend/src/pages/Home.tsx to add TabSelector (Friends/Everyone), view toggle (Radar/Map/List), wire up scope to nearbyApi.get(?scope=)
- [ ] T009 Integrate MapView into Home page (pass filtered nearby data, handle cluster clicks, conditional rendering by viewMode and scope)
- [ ] T010 Add "Show friends on map" toggle to Settings page frontend/src/pages/Settings.tsx and update API client frontend/src/lib/api.ts to support scope parameter

### Testing & Validation (Phase A)

- [ ] T011 Test backend: run migration, test scope=friends and scope=everyone with curl (verify friendCode presence/absence, isFriend flag, bearing field 0-360°, mutual opt-in)
- [ ] T012 Test web map: verify OSM tiles load, user marker appears, nearby markers render, clustering works (3+ users → cluster with count)
- [ ] T013 Test scope tabs: switch Friends↔Everyone, verify filtering, verify friend codes hidden in Everyone tab, test "Show friends on map" setting

**Phase A Demo**: Two browsers in Everyone mode see each other on map; add as friends, switch to Friends tab with setting enabled

---

## Phase B: Mobile Expo App (Demo-Ready in 3-4 hours)

**Purpose**: Build React Native mobile app using Expo that reuses existing REST API, supports map view with clustering, and includes simulation mode for solo demo

**Demo Criteria**:
- Mobile app launches and registers device
- Map view shows nearby users with clustering
- Simulation mode allows entering test coordinates
- Can see web users from mobile (and vice versa)

### Mobile Setup & Services

- [ ] T014 Initialize Expo project (npx create-expo-app mobile --template blank-typescript), install dependencies (expo-router, react-native-maps, expo-location, axios, async-storage, supercluster), configure app.json
- [ ] T015 Setup Expo Router (create app/_layout.tsx root, app/(tabs)/_layout.tsx tab navigator) and configure react-native-maps in app.json
- [ ] T016 Create core services: storage wrapper (mobile/src/services/storage.ts), API client (mobile/src/services/api.ts with auth interceptor), AuthContext (mobile/src/contexts/AuthContext.tsx)
- [ ] T017 Create location service mobile/src/services/location.ts (check AsyncStorage @simulatedLocation first, fallback to expo-location, handle permissions)

### Mobile Components

- [ ] T018 Create MapView component mobile/src/components/MapView.tsx (react-native-maps, supercluster setup, user marker, cluster markers with count badges, individual markers, region change handler)
- [ ] T019 Create ClusterSheet component mobile/src/components/ClusterSheet.tsx (Modal, slide-up animation, ScrollView with member cards) and SimulationControls mobile/src/components/SimulationControls.tsx (Switch, lat/lng TextInputs, save to AsyncStorage)

### Mobile Screens

- [ ] T020 Create Register screen mobile/app/register.tsx (auto-register if no deviceSecret, redirect to tabs) and Home screen mobile/app/(tabs)/index.tsx (TabSelector, MapView, ClusterSheet, 30s polling)
- [ ] T021 Create Friends screen mobile/app/(tabs)/friends.tsx (FlatList, add friend input, my code display) and Settings screen mobile/app/(tabs)/settings.tsx (displayName, mode, radius, showFriendsOnMap, SimulationControls)

### Testing & Validation (Phase B)

- [ ] T022 Test mobile: registration flow, simulation mode (enter coords, verify API uses them, restart app to verify coords persist in AsyncStorage), map rendering, clustering (3+ users → cluster)
- [ ] T023 Test integration: web + mobile both in Everyone mode with simulation coords, verify mutual visibility and clustering

**Phase B Demo**: Mobile simulator + web browser see each other on map with clustering, simulation mode allows solo demo

---

## Phase C: Polish & Demo Prep (2-3 hours)

**Purpose**: Final touches, animations, error handling, documentation, demo rehearsal

**Demo Criteria**:
- Smooth animations on both web and mobile
- Error states handled gracefully
- QUICKSTART.md updated with map + mobile instructions
- Demo script ready for presentation

### Polish

- [ ] T024 [P] Add web polish: loading skeleton for map tiles, "Center on me" button, error handling for tile failures, cluster fade animations
- [ ] T025 [P] Add mobile polish: error handling for react-native-maps, ClusterSheet slide-up animation, backdrop blur, app icon and splash screen

### Documentation & Demo Prep

- [ ] T026 Update QUICKSTART.md: add "Map View" section (scope tabs, clustering, simulation mode) and "Mobile App" section (Expo setup, solo demo steps)
- [ ] T027 Create demo script (5-min flow: register, add friend, switch scopes, clustering, mobile interaction) and test full demo (two browsers + mobile)

**Phase C Demo**: Polished demo with smooth UX, comprehensive docs, rehearsed presentation

---

## Dependencies & Execution Strategy

### Dependency Graph

```
Phase A (Web Map)
├─ Backend: T001-T003 (migrations, scope support, settings)
│  └─ T004-T007 (Web frontend components)
│     └─ T008-T010 (Integration)
│        └─ T011-T013 (Testing)

Phase B (Mobile)
├─ T014-T017 (Setup, services)
│  └─ T018-T019 (Components)
│     └─ T020-T021 (Screens)
│        └─ T022-T023 (Testing)

Phase C (Polish)
└─ T024-T027 (All parallelizable)
```

### Critical Path

**Phase A** (6 hours): T001→T002 (backend) → T004→T006 (components) → T008→T009 (integration) → T013 (testing)

**Phase B** (4 hours): T014→T015 (setup) → T016→T017 (services) → T018→T020 (screens) → T023 (integration test)

**Phase C** (2 hours): All tasks parallelizable or optional

### Parallelization Opportunities

**After T003 (backend complete)**:
- T004 (deps + CSS) + T005 (clustering util) can start
- T006 (MapView) + T007 (ClusterSheet) can be built in parallel

**After T015 (mobile setup complete)**:
- T016 (services) + T017 (location) + T018 (components) can run in parallel

**Phase C**: All T024-T027 are parallelizable

---

## Validation Steps (Per Phase)

### Phase A Validation: Web Map Demo

**Setup**:
1. Run migration: `cd backend && npx drizzle-kit push`
2. Start backend: `./start-backend.sh`
3. Start frontend: `./start-frontend.sh`

**Test Case 1: Everyone Scope**
1. Browser 1 (Alice): Register, Settings → mode=EVERYONE, Home → Everyone tab
2. Browser 2 (Bob): Register, Settings → mode=EVERYONE, Home → Everyone tab
3. Both: Enable simulation mode, set coordinates 200m apart
4. Expected: Both see each other on map as individual markers (distance: ~200m)
5. Verify: No friend codes visible, displayName shown, isFriend=false

**Test Case 2: Friends Scope**
1. Alice: Friends → Add Bob's friend code
2. Bob: Friends → Add Alice's friend code
3. Alice: Settings → toggle "Show friends on map" ON
4. Alice: Home → Friends tab
5. Expected: Bob appears on map with friend badge
6. Verify: Friend code visible in list, isFriend=true

**Test Case 3: Clustering**
1. Create 3 test users (Charlie, Diana, Eve) at same location (sqlite INSERT)
2. Alice: Home → Everyone tab
3. Expected: 3 users appear as cluster marker with badge "3"
4. Alice: Click cluster marker
5. Expected: ClusterSheet opens with list of 3 members (names, distances)

### Phase B Validation: Mobile Demo

**Setup**:
1. Start backend (already running)
2. Start Expo: `cd mobile && npx expo start`
3. Open iOS Simulator (press 'i') or Android Emulator (press 'a')

**Test Case 1: Registration**
1. Launch app (first time)
2. Expected: Auto-register, deviceSecret stored, navigate to Home
3. Verify: Check AsyncStorage in Flipper/React Native Debugger

**Test Case 2: Simulation Mode**
1. Mobile: Settings → Enable "Simulation Mode"
2. Mobile: Enter lat=37.7749, lng=-122.4194 (SF coordinates)
3. Mobile: Tap "Update Location"
4. Mobile: Home → verify location updates to SF
5. Expected: Nearby users in SF area appear on map

**Test Case 3: Web + Mobile Integration**
1. Web (Alice): Set simulation coords to 37.7749, -122.4194
2. Mobile (Bob): Set simulation coords to 37.7760, -122.4194 (1km north)
3. Both: mode=EVERYONE
4. Expected: Alice sees Bob on web map, Bob sees Alice on mobile map
5. Expected: Distance shows ~1100m, distanceCategory=NEARBY

**Test Case 4: Mobile Clustering**
1. Create 3 test users at Bob's location (37.7760, -122.4194)
2. Mobile (Bob): Home → Everyone tab
3. Expected: 3 users appear as cluster marker with count "3"
4. Mobile: Tap cluster
5. Expected: Bottom sheet opens with 3 members listed

---

## Cut Lines & Fallbacks

### Must-Ship (Phase A)
- Backend scope support (T001-T003) ✅
- Web map with clustering (T004-T010) ✅
- Basic testing (T011-T013) ✅

### Ship If Time Allows (Phase B)
- Mobile app (T014-T023) ⚠️

### Cut If Needed (Phase C)
- All polish tasks (T024-T027) ❌

### Emergency Fallbacks

**If clustering breaks**:
- Fallback: Disable clustering, show all individual markers (remove supercluster, render raw nearby array)
- Impact: Map still works, just cluttered with 10+ users

**If mobile setup fails**:
- Fallback: Web-only demo (two browser windows)
- Impact: No cross-platform demo, but core feature still shown

**If react-native-maps issues**:
- Fallback: Skip mobile Phase B entirely, focus on web polish
- Impact: No mobile app, but web is production-ready

**If time runs out**:
- Priority 1: Ship Phase A (web map)
- Priority 2: Ship T027-T034 (mobile setup) for "future work" demo
- Priority 3: Skip Phase C (polish), ship functional but unpolished

---

## Time Estimates

### Phase A: Web Map + Clustering
- Backend (T001-T003): 2 hours
- Frontend components (T004-T007): 2.5 hours
- Integration (T008-T010): 1.5 hours
- Testing (T011-T013): 1 hour
- **Total**: 7 hours

### Phase B: Mobile Expo
- Setup & services (T014-T017): 2.5 hours
- Components (T018-T019): 2 hours
- Screens (T020-T021): 2 hours
- Testing (T022-T023): 1 hour
- **Total**: 7.5 hours

### Phase C: Polish
- Web & mobile polish (T024-T025): 1.5 hours
- Documentation & demo (T026-T027): 1 hour
- **Total**: 2.5 hours

### Grand Total: 17 hours (optimistic), 19-21 hours (realistic)

---

## Success Metrics

### Phase A Success Criteria (13 tasks)
- [ ] Backend: scope parameter works, mutual opt-in enforced, friendCode hidden in Everyone
- [ ] Web: map renders with OSM tiles, user + nearby markers appear
- [ ] Web: clustering works (3+ users → cluster with count badge)
- [ ] Web: clicking cluster opens modal with member list
- [ ] Web: scope tabs work (Friends/Everyone filtering correct)
- [ ] Web: "Show friends on map" setting controls Friends tab visibility

### Phase B Success Criteria (10 tasks)
- [ ] Mobile: app builds on iOS simulator, registration works
- [ ] Mobile: map renders, clustering works, simulation mode works
- [ ] Integration: web + mobile see each other (Everyone scope with simulation coords)

### Phase C Success Criteria (4 tasks)
- [ ] Polish: animations, error handling, app icon/splash
- [ ] Docs: QUICKSTART.md updated, demo script ready

---

## Task Checklist Summary

**Phase A**: T001-T013 (13 tasks)  
**Phase B**: T014-T023 (10 tasks)  
**Phase C**: T024-T027 (4 tasks)  
**Total**: 27 tasks ✅ (under 35 limit)

Actually, looking at the requirements again: "Keep total tasks <= 35". Let me revise to consolidate tasks.
