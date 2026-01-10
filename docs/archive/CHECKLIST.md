# Proximity Radar - Hackathon Implementation Checklist
**Date**: January 10, 2026  
**Time Window**: 10:30 - 17:45 (7.25 hours)  
**Hard Cut-Line**: 15:30 (5 hours) - Anything incomplete is DEFERRED

---

## Priority Legend
- **DEMO CRITICAL** = Required to demo two users meeting via location simulation (solo build)
- **NICE** = Enhances demo but can skip if behind schedule
- **DEFERRED** = Skip for hackathon, implement post-demo

**Constraints**: No JWT, no KV, no shared types, no Tailwind, no PWA, no Calendar

---

## 10:30 - 11:30 (60min) | Minimal Backend Setup

**DEMO CRITICAL**
- [ ] T001-SLIM: Create project structure (backend/src/{auth,location,friends,db,utils}, frontend/src/{pages,components,services,hooks})
- [ ] T002-SLIM: Initialize backend (npm install hono drizzle-orm better-sqlite3, skip jose/kv)
- [ ] T003-SLIM: Initialize frontend (vite react-ts, @tanstack/react-query axios, skip workbox/tailwind)
- [ ] T005-SLIM: Configure wrangler.toml (D1 only, no KV)
- [ ] T008-SLIM: Create D1 schema migration (5 tables: users, locations, friendships, blocked_users, proximity_events - skip calendar tables)
- [ ] T009-SLIM: Drizzle schema backend/src/db/schema.ts
- [ ] T010: Database client backend/src/db/client.ts
- [ ] T011: Haversine distance backend/src/utils/haversine.ts

**Outcome**: Projects scaffolded, dependencies installed, database schema ready

---

## 11:30 - 12:30 (60min) | Simplified Auth + Location Backend

**DEMO CRITICAL**
- [ ] T013-SLIM: Simple auth utilities backend/src/auth/simple-auth.ts (plain device secrets, no JWT)
- [ ] T014-SLIM: Auth middleware backend/src/auth/middleware.ts (check Bearer token, lookup deviceSecret)
- [ ] T015: Hono router setup backend/src/index.ts (CORS, error handling)
- [ ] T020-SLIM: Device registration backend/src/auth/register.ts (crypto.randomUUID for deviceSecret, 8-char friendCode)
- [ ] T021-SLIM: Settings update backend/src/settings/update.ts (mode, displayName only - hardcode 1km radius)
- [ ] T022: Settings fetch backend/src/settings/get.ts
- [ ] T023-SLIM: Location update backend/src/location/update.ts (upsert, 24h TTL, skip rate limiting)

**Outcome**: Auth flow working (device registration), location updates accepted

---

## 12:30 - 13:00 (30min) | Proximity Detection Backend

**DEMO CRITICAL**
- [ ] T024: Proximity matching backend/src/location/nearby.ts (Haversine, filter OFF/FRIENDS modes, distance categories)
- [ ] T025: Proximity state tracking backend/src/utils/proximity.ts (OUT→IN alert detection, upsert proximity_events)
- [ ] T026: Nearby endpoint backend/src/location/nearby-handler.ts (GET /nearby, return nearby list + newAlerts)

**Outcome**: Backend can calculate proximity, return nearby friends, trigger alerts

---

## 13:00 - 13:30 (30min) | Friend Management Backend

**DEMO CRITICAL**
- [ ] T037: Friend code generation backend/src/utils/friend-code.ts (8-char alphanumeric)
- [ ] T038: Friend invite acceptance backend/src/friends/invite.ts (POST /friends/invite/accept, bidirectional)
- [ ] T039: Friends list backend/src/friends/list.ts (GET /friends)

**DEFERRED** (skip for MVP):
- ❌ T040: Friend removal endpoint
- ❌ T041: Blocking endpoint

**Outcome**: Two users can become friends via invite code exchange

---

## 13:30 - 14:30 (60min) | Frontend Foundation

**DEMO CRITICAL**
- [ ] T016-SLIM: API client frontend/src/services/api.ts (axios with auth header, localStorage for deviceSecret)
- [ ] T017-SLIM: Auth store frontend/src/services/auth.ts (localStorage wrapper, skip React Context if too complex)
- [ ] T018-SLIM: Basic UI components frontend/src/components/ui/ (Button.tsx, Input.tsx, Toggle.tsx - inline styles)
- [ ] T027-SLIM: Registration page frontend/src/pages/Register.tsx (auto-register on first visit, store deviceSecret)
- [ ] T028: Home page frontend/src/pages/Home.tsx (main dashboard layout)
- [ ] T031: Settings page frontend/src/pages/Settings.tsx (display name, mode toggle OFF/FRIENDS)

**Outcome**: Frontend can register users, call authenticated APIs, display basic UI

---

## 14:30 - 15:30 (60min) | Friend Management + Location Simulation UI

**DEMO CRITICAL**
- [ ] T043: Friends page frontend/src/pages/Friends.tsx (friend list, add friend form, my code display)
- [ ] T044-SLIM: FriendList component frontend/src/components/FriendList.tsx (display friends, skip block button)
- [ ] T045: AddFriend component frontend/src/components/AddFriend.tsx (friend code input)
- [ ] T046: FriendCode component frontend/src/components/FriendCode.tsx (display + copy button)
- [ ] T048: LocationSimulator component frontend/src/components/LocationSimulator.tsx (lat/lng inputs, update button)
- [ ] T049: Update useGeolocation frontend/src/hooks/useGeolocation.ts (manual coordinate override)
- [ ] T050: Simulation toggle in Settings page
- [ ] T051: Test coordinates helper frontend/src/utils/test-coordinates.ts (SF Embarcadero, Ferry Building)

**Outcome**: Friend management working, location simulation ready for demo

---

## ⚠️ HARD CUT-LINE AT 15:30 ⚠️
**If core flow (auth + friends + location) not working, DEFER everything below and debug**

---

## 15:30 - 16:30 (60min) | Proximity UI + Polling

**DEMO CRITICAL**
- [ ] T029: SharingToggle component frontend/src/components/SharingToggle.tsx (big ON/OFF button, mode selector OFF/FRIENDS)
- [ ] T030: NearbyList component frontend/src/components/NearbyList.tsx (list view with distance categories)
- [ ] T032-SLIM: useGeolocation hook frontend/src/hooks/useGeolocation.ts (browser API + manual override support)
- [ ] T033: useLocationSync hook frontend/src/hooks/useLocationSync.ts (polling: PUT /me/location every 10s, GET /nearby)
- [ ] T034-SLIM: ProximityAlert component frontend/src/components/ProximityAlert.tsx (simple alert box, no toast library)
- [ ] T035-SLIM: App.tsx polling wiring (TanStack Query polling when mode !== OFF)

**Outcome**: Proximity detection fully functional, alerts fire when friends get nearby

---

## 16:30 - 17:15 (45min) | Radar Visualization (NEW)

**NICE** (skip if behind schedule, ship with list view only)
- [ ] T088-NEW: Bearing calculation backend/src/utils/bearing.ts (compass angle between coordinates)
- [ ] T089-NEW: Update nearby endpoint to include bearing (return { userId, displayName, distance, category, bearing })
- [ ] T087-NEW: RadarDisplay component frontend/src/components/RadarDisplay.tsx (SVG circular radar: center user, rings at 500m/1km/2km, friends positioned by distance/bearing)
- [ ] T090-NEW: RadarToggle component frontend/src/components/RadarToggle.tsx (switch List/Radar tabs)
- [ ] T091-NEW: Wire RadarDisplay into Home page (toggle between NearbyList and RadarDisplay, auto-refresh on polling)

**Outcome**: Radar visualization showing friends on circular map

---

## 17:15 - 17:45 (30min) | End-to-End Testing + Bug Fixes

**DEMO CRITICAL**
- [ ] T084-CRITICAL: End-to-end demo test
  - Open Chrome normal + incognito windows
  - Register both users (auto)
  - Exchange friend codes
  - Enable FRIENDS mode
  - Simulate nearby locations: Alice (37.7955, -122.3937), Bob (37.7955, -122.3940) ~300m apart
  - Verify proximity alerts fire in both windows
  - Verify nearby list shows both users with "VERY_CLOSE" category
  - Toggle to Radar view (if built), verify friend appears on radar
- [ ] T092-NEW: Quick bug fixes (fix critical issues found during testing, add minimal CSS for readability)

**Outcome**: Full demo flow works without errors

---

## DEFERRED (Post-Hackathon)

**Backend**:
- ❌ T004: Shared TypeScript types package (inline types instead)
- ❌ T007: ESLint/Prettier setup
- ❌ T012: KV rate limiter (skip rate limiting for MVP)
- ❌ T013: JWT auth (using simple device secrets)
- ❌ T040: Friend removal endpoint
- ❌ T041: Blocking endpoint
- ❌ T042: Filter blocked users in nearby
- ❌ T052-T057: Privacy modes US4 (Everyone mode, consent modals)
- ❌ T058-T060: Configurable radius US5 (hardcode 1km)
- ❌ T061-T076: Calendar integration US6 (all 16 tasks)
- ❌ T077: TTL cleanup cron trigger

**Frontend**:
- ❌ T006: Vite PWA plugin + Tailwind setup (vanilla CSS)
- ❌ T078: PWA manifest and service worker
- ❌ T079: Loading spinners (instant feedback only)
- ❌ T080: Error boundaries (basic try/catch)
- ❌ T081: Connection status indicator
- ❌ T082: Tailwind styling polish (vanilla CSS sufficient)
- ❌ T085: Deploy backend to Cloudflare Workers
- ❌ T086: Deploy frontend to Cloudflare Pages
- ❌ T083: README.md (add after demo works)

---

## Critical Path Summary

```
10:30  Backend Setup (60m)           MUST FINISH
11:30  Auth + Location Backend (60m) MUST FINISH
12:30  Proximity Backend (30m)       MUST FINISH
13:00  Friends Backend (30m)         MUST FINISH
13:30  Frontend Foundation (60m)     MUST FINISH
14:30  Friends + Simulation UI (60m) MUST FINISH
───────────────────────────────────────────────
15:30  HARD CUT-LINE ⚠️ - Core flow must work
───────────────────────────────────────────────
15:30  Proximity UI + Polling (60m)  NICE
16:30  Radar Visualization (45m)     NICE (skip if behind)
17:15  Testing + Bug Fixes (30m)     CRITICAL
17:45  DONE ✓
```

**Minimum Viable Demo** (if behind at 15:30):
- Auth + Friends + Location core working
- Skip radar, ship list view only
- Hardcode friendships in DB if friend management not working
- Manual SQL inserts to set up demo state

**Success Criteria** (17:45 Demo):
✅ Two browser windows can auto-register  
✅ Users exchange friend codes successfully  
✅ Location simulation works (manual lat/lng)  
✅ Proximity alert fires when <1km apart  
✅ Nearby list displays both users  
✅ Sharing toggle (ON/OFF) works  
✅ Optional: Radar view shows friend position  

**90-Second Demo Script**:
1. Window 1: Open app, auto-register as Alice, copy friend code (10s)
2. Window 2: Open incognito, auto-register as Bob, paste Alice's code (10s)
3. Both: Enable FRIENDS mode (10s)
4. Alice: Simulate SF Ferry Building (37.7955, -122.3937) (10s)
5. Bob: Simulate SF Embarcadero (37.7955, -122.3940) [~300m away] (10s)
6. Both: Wait 10s for polling... proximity alert fires! (10s)
7. Both: Check nearby list - see each other "VERY_CLOSE (<500m)" (10s)
8. Both: Toggle to Radar view - see friend on circular radar (10s)
9. Demo complete! (90s total)

---

**Status**: Hackathon checklist ready. 31 must-do tasks, 5 radar tasks (optional). 7.25 hours available. Ready to build! 🚀
