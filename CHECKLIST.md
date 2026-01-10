# Proximity Radar - Implementation Checklist
**Date**: January 10, 2026  
**Time Window**: 11:00 - 18:00 (7 hours)  
**Hard Cut-Line**: 15:30 (4.5 hours) - Anything incomplete is DEFERRED

---

## Priority Legend
- **MUST**: Required for solo demo (two browser windows)
- **NICE**: Enhances demo quality but not blocking
- **STRETCH**: Optional polish/advanced features

**DEMO CRITICAL** = Required to demo two users meeting via location simulation

---

## 11:00 - 11:45 (45min) | Project Setup & Scaffolding

**MUST** - DEMO CRITICAL
- [ ] T001: Create root project structure (backend/, frontend/, shared/)
- [ ] T002: Initialize backend (wrangler, Hono, Drizzle dependencies)
- [ ] T003: Initialize frontend (Vite, React, TanStack Query, Tailwind)
- [ ] T004: Create shared/types/ for API contracts
- [ ] T005: Configure wrangler.toml (D1, KV, env vars)
- [ ] T006: Configure Vite (PWA plugin, Tailwind)

**Outcome**: Projects initialized, dependencies installed, configs ready

---

## 11:45 - 12:45 (60min) | Database & Core Infrastructure

**MUST** - DEMO CRITICAL
- [ ] T008: Create D1 schema migration (7 tables: users, locations, friendships, blocked_users, proximity_events, calendar_tokens, calendar_exclusions)
- [ ] T009: Define Drizzle ORM schema in backend/src/db/schema.ts
- [ ] T010: Create database connection utility (D1 + Drizzle)
- [ ] T011: Implement Haversine distance calculation utility
- [ ] T013: Implement JWT signing/verification utilities (jose)
- [ ] T014: Create authentication middleware
- [ ] T015: Setup Hono router with CORS and error handling

**Outcome**: Database ready, core auth working, API router scaffolded

---

## 12:45 - 13:15 (30min) | Frontend Foundation

**MUST** - DEMO CRITICAL
- [ ] T016: Create API client wrapper with auth headers
- [ ] T017: Create auth context/store for token management
- [ ] T018: Create reusable UI components (Button, Input, Toggle)

**NICE**
- [ ] T007: Setup ESLint and Prettier (can skip if time-constrained)
- [ ] T012: Implement KV rate limiter (defer if needed, use simple in-memory)

**Outcome**: Frontend can call authenticated API endpoints

---

## 13:15 - 13:45 (30min) | Lunch Break ☕

---

## 13:45 - 14:45 (60min) | User Registration & Settings [US1 Core]

**MUST** - DEMO CRITICAL
- [ ] T019: Create User model types (shared/types/models.ts)
- [ ] T020: Implement device registration endpoint POST /auth/register
- [ ] T021: Implement settings update endpoint PUT /me/settings
- [ ] T022: Implement settings fetch endpoint GET /me/settings
- [ ] T027: Create registration page (auto-register, store device secret)
- [ ] T028: Create Home page (nearby list, sharing toggle, timestamp)
- [ ] T029: Create SharingToggle component (ON/OFF indicator)
- [ ] T031: Create Settings page (mode selector, radius, display name)

**Outcome**: Two users can register in separate browsers, configure settings

---

## 14:45 - 15:30 (45min) | Location Sharing & Proximity Detection [US1 Core]

**MUST** - DEMO CRITICAL
- [ ] T023: Implement location update endpoint PUT /me/location (24h TTL, rate limit)
- [ ] T024: Implement proximity matching logic (Haversine, filter by mode/friends)
- [ ] T025: Implement proximity state tracking (OUT→IN alert detection)
- [ ] T026: Implement nearby users endpoint GET /nearby
- [ ] T032: Implement useGeolocation hook (browser API wrapper)
- [ ] T033: Implement useLocationSync hook (polling: PUT location every 10s, GET /nearby)
- [ ] T030: Create NearbyList component (display nearby users with distances)
- [ ] T034: Add notification display logic (ProximityAlert toast)
- [ ] T035: Wire up TanStack Query polling in App.tsx

**Outcome**: Proximity detection works end-to-end (alerts fire when nearby)

---

## ⚠️ HARD CUT-LINE AT 15:30 ⚠️
**If above not complete by 15:30, skip everything below and debug/finish core flow**

---

## 15:30 - 16:15 (45min) | Friend Management [US2]

**MUST** - DEMO CRITICAL
- [ ] T036: Create Friend model types
- [ ] T037: Implement friend code generation (8-char alphanumeric)
- [ ] T038: Implement friend invite acceptance POST /friends/invite/accept
- [ ] T039: Implement friends list endpoint GET /friends
- [ ] T043: Create Friends page (friend list, add friend form, my code)
- [ ] T044: Create FriendList component
- [ ] T045: Create AddFriend component (friend code input)
- [ ] T046: Create FriendCode component (display + copy button)

**NICE**
- [ ] T040: Implement friend removal DELETE /friends/:friendId
- [ ] T041: Implement blocking POST /friends/:friendId/block
- [ ] T042: Update nearby matching to filter blocked users

**Outcome**: Two users can become friends via code exchange

---

## 16:15 - 16:45 (30min) | Location Simulation for Demo [US3]

**MUST** - DEMO CRITICAL
- [ ] T047: Add isSimulated flag handling in PUT /me/location
- [ ] T048: Create LocationSimulator component (lat/lng inputs)
- [ ] T049: Update useGeolocation hook to support manual coordinate override
- [ ] T050: Add simulation mode toggle in Settings page
- [ ] T051: Add example coordinates helper (SF Embarcadero, Ferry Building)

**Outcome**: Two browser windows can simulate different locations manually

---

## 16:45 - 17:15 (30min) | Polish & Demo Prep

**NICE**
- [ ] T079: Add loading states to all API calls (spinners)
- [ ] T080: Add error handling and user-friendly error messages
- [ ] T082: Tailwind styling polish (spacing, colors, responsive)
- [ ] T083: Create README.md with quickstart link

**STRETCH**
- [ ] T078: Add PWA manifest and service worker
- [ ] T081: Connection status indicator

**Outcome**: App looks polished, errors handled gracefully

---

## 17:15 - 17:45 (30min) | End-to-End Testing & Bug Fixes

**MUST** - DEMO CRITICAL
- [ ] T084: Perform end-to-end demo test per quickstart.md
  - Two browser windows (Chrome profiles)
  - Register both users
  - Exchange friend codes
  - Enable FRIENDS mode
  - Simulate nearby locations (37.7946, -122.3947 and 37.7945, -122.3946)
  - Verify proximity alert fires
  - Verify nearby list displays both users with "Very Close" distance

**Outcome**: Full demo flow works without errors

---

## 17:45 - 18:00 (15min) | Deploy & Final Checks

**NICE**
- [ ] T085: Deploy backend to Cloudflare Workers (wrangler deploy)
- [ ] T086: Deploy frontend to Cloudflare Pages

**STRETCH** (if extra time)
- [ ] Run D1 migrations on production database
- [ ] Test deployed URLs
- [ ] Share demo link

**Outcome**: Live demo URL ready (or run locally if deploy issues)

---

## DEFERRED (Beyond 18:00 or if behind schedule)

**US4: Privacy Modes** (T052-T057) - Everyone mode, privacy warnings, consent prompts  
**US5: Configurable Radius** (T058-T060) - Custom radius slider (100m-5km)  
**US6: Calendar Integration** (T061-T076) - Google Calendar availability (16 tasks)  
**Additional Polish** (T077) - TTL cleanup cron trigger

---

## Critical Path Summary

```
11:00  Setup (45m)
11:45  Database & Auth (60m)
12:45  Frontend Foundation (30m)
13:15  LUNCH (30m)
13:45  Registration & Settings (60m)
14:45  Proximity Detection (45m)
───────────────────────────────────
15:30  HARD CUT-LINE ⚠️
───────────────────────────────────
15:30  Friend Management (45m)
16:15  Location Simulation (30m)
16:45  Polish (30m)
17:15  Testing (30m)
17:45  Deploy (15m)
18:00  DONE ✓
```

**Minimum Viable Demo** (if behind at 15:30):
- T001-T026: Setup → Foundation → Basic Proximity (no friends, just location sharing)
- Skip friend management, use hardcoded friendship for demo
- Manually inject friend codes in database

**Success Criteria for Demo**:
✅ Two browser windows can register as separate users  
✅ Users can exchange friend codes and become friends  
✅ Location simulation works (manual lat/lng entry)  
✅ Proximity alert fires when simulated locations are < 1km apart  
✅ Nearby list displays both users with distance category  
✅ Sharing can be toggled ON/OFF  

**Demo Script** (2 minutes):
1. Window 1: Register as Alice, copy friend code
2. Window 2: Register as Bob, add Alice via code
3. Both: Enable FRIENDS mode
4. Alice: Simulate location at SF Ferry Building (37.7946, -122.3947)
5. Bob: Simulate location at SF Embarcadero (37.7945, -122.3946) [~100m apart]
6. Both: Wait 10s, see proximity alert "Alice is nearby!" / "Bob is nearby!"
7. Both: See each other in nearby list: "Very Close (<500m)"
