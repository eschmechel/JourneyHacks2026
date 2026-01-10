# Tasks: Proximity Radar

**Feature**: Proximity Radar - Location-based friend proximity detection with calendar integration  
**Branch**: `001-proximity-radar`  
**Input**: Design documents from `/specs/001-proximity-radar/`

**Implementation Strategy**: Build incrementally by user story. Each story delivers independent value and can be demoed separately. MVP = User Stories 1-3 only.

**Tests**: NO TEST TASKS INCLUDED - Tests not explicitly requested in specification. Manual browser testing via quickstart.md guide.

---

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Parallelizable (different files, no blocking dependencies)
- **[Story]**: User story label (US1, US2, US3, US4, US5, US6)
- File paths use `backend/` and `frontend/` prefixes per project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for Cloudflare stack

- [ ] T001 Create root project structure (backend/, frontend/, shared/ directories)
- [ ] T002 Initialize backend Cloudflare Workers project with wrangler, Hono, Drizzle dependencies in backend/package.json
- [ ] T003 [P] Initialize frontend Vite + React project with TanStack Query, Tailwind, Workbox in frontend/package.json
- [ ] T004 [P] Create shared TypeScript types package in shared/types/ for API contracts
- [ ] T005 Configure wrangler.toml for D1 database, KV namespace, and Workers environment variables in backend/wrangler.toml
- [ ] T006 [P] Configure Vite with PWA plugin and Tailwind setup in frontend/vite.config.ts
- [ ] T007 [P] Setup ESLint and Prettier for both backend and frontend with TypeScript rules

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Create D1 database schema migration 001_create_tables.sql with all 7 tables (users, locations, friendships, blocked_users, proximity_events, calendar_tokens, calendar_exclusions) in backend/migrations/
- [ ] T009 Define Drizzle ORM schema in backend/src/db/schema.ts matching data-model.md specifications
- [ ] T010 Create database connection utility in backend/src/db/client.ts for D1 + Drizzle setup
- [ ] T011 [P] Implement Haversine distance calculation utility in backend/src/utils/haversine.ts
- [ ] T012 [P] Implement rate limiter using KV in backend/src/utils/rate-limit.ts (1 req/10s for location updates)
- [ ] T013 [P] Implement JWT signing and verification utilities in backend/src/auth/jwt.ts using jose library
- [ ] T014 [P] Create authentication middleware in backend/src/auth/middleware.ts for JWT token validation
- [ ] T015 [P] Setup Hono router with CORS and error handling in backend/src/index.ts
- [ ] T016 [P] Create API client wrapper in frontend/src/services/api.ts with auth header injection
- [ ] T017 [P] Create auth context/store in frontend/src/store/auth.ts for token and user state management
- [ ] T018 [P] Create reusable UI components: Button, Input, Toggle in frontend/src/components/ui/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Proximity Sharing and Detection (Priority: P1) 🎯 MVP CORE

**Goal**: Enable users to share location, detect nearby friends, receive proximity alerts, and control sharing via OFF/FRIENDS modes

**Independent Test**: Per quickstart.md Step 1-9 - Register two users, add as friends, enable FRIENDS mode, simulate nearby locations, verify proximity alerts and nearby list display

### Implementation for User Story 1

- [ ] T019 [P] [US1] Create User model types in shared/types/models.ts (User, Location, SharingMode enums)
- [ ] T020 [P] [US1] Implement device registration endpoint POST /auth/register in backend/src/auth/register.ts (generate device secret, friend code, return JWT)
- [ ] T021 [P] [US1] Implement settings update endpoint PUT /me/settings in backend/src/settings/update.ts (mode, radiusMeters, displayName)
- [ ] T022 [P] [US1] Implement settings fetch endpoint GET /me/settings in backend/src/settings/get.ts
- [ ] T023 [US1] Implement location update endpoint PUT /me/location in backend/src/location/update.ts (upsert location with 24h TTL, enforce rate limiting)
- [ ] T024 [US1] Implement proximity matching logic in backend/src/location/nearby.ts (Haversine distance calc, filter by mode/friends/blocks, return distance categories)
- [ ] T025 [US1] Implement proximity state tracking in backend/src/utils/proximity.ts (check/upsert proximity_events for OUT→IN alert detection)
- [ ] T026 [US1] Implement nearby users endpoint GET /nearby in backend/src/location/nearby-handler.ts (call proximity matching, return nearby list + newAlerts)
- [ ] T027 [P] [US1] Create registration page in frontend/src/pages/Register.tsx (auto-register on first visit, store device secret in localStorage)
- [ ] T028 [P] [US1] Create Home page in frontend/src/pages/Home.tsx (nearby list, sharing toggle, last update timestamp)
- [ ] T029 [P] [US1] Create SharingToggle component in frontend/src/components/SharingToggle.tsx (big ON/OFF indicator with mode selector)
- [ ] T030 [P] [US1] Create NearbyList component in frontend/src/components/NearbyList.tsx (display nearby users with distance categories)
- [ ] T031 [P] [US1] Create Settings page in frontend/src/pages/Settings.tsx (mode selector, radius slider, display name input)
- [ ] T032 [US1] Implement useGeolocation hook in frontend/src/hooks/useGeolocation.ts (browser Geolocation API wrapper)
- [ ] T033 [US1] Implement useLocationSync hook in frontend/src/hooks/useLocationSync.ts (polling loop: PUT /me/location every 10s, GET /nearby, trigger alerts for newAlerts)
- [ ] T034 [US1] Add notification display logic in frontend/src/components/ProximityAlert.tsx (toast/banner for new proximity alerts)
- [ ] T035 [US1] Wire up TanStack Query polling in frontend/src/App.tsx (enable polling only when mode !== OFF)

**Checkpoint**: User Story 1 complete - Users can share location, see nearby friends, receive alerts, toggle modes

---

## Phase 4: User Story 2 - Friend Management (Priority: P1) 🎯 MVP CORE

**Goal**: Enable users to add friends via invite codes, view friend list, remove friends, and block users

**Independent Test**: Per quickstart.md Step 4 - Generate friend code, share with another user, accept invite, verify bidirectional friendship, test remove/block

### Implementation for User Story 2

- [ ] T036 [P] [US2] Create Friend model types in shared/types/models.ts (Friend, Friendship interfaces)
- [ ] T037 [P] [US2] Implement friend code generation in backend/src/utils/friend-code.ts (8-char alphanumeric, collision check)
- [ ] T038 [P] [US2] Implement friend invite acceptance POST /friends/invite/accept in backend/src/friends/invite.ts (lookup by friendCode, create bidirectional friendships)
- [ ] T039 [P] [US2] Implement friends list endpoint GET /friends in backend/src/friends/list.ts (return all friends with status)
- [ ] T040 [P] [US2] Implement friend removal DELETE /friends/:friendId in backend/src/friends/remove.ts (delete both directions)
- [ ] T041 [P] [US2] Implement blocking POST /friends/:friendId/block in backend/src/friends/block.ts (delete friendships, insert into blocked_users, symmetric blocking)
- [ ] T042 [P] [US2] Update nearby matching logic in backend/src/location/nearby.ts to filter out blocked users
- [ ] T043 [P] [US2] Create Friends page in frontend/src/pages/Friends.tsx (friend list display, add friend form, my friend code display)
- [ ] T044 [P] [US2] Create FriendList component in frontend/src/components/FriendList.tsx (render friends with remove/block buttons)
- [ ] T045 [P] [US2] Create AddFriend component in frontend/src/components/AddFriend.tsx (friend code input, submit to POST /friends/invite/accept)
- [ ] T046 [P] [US2] Create FriendCode component in frontend/src/components/FriendCode.tsx (display user's friend code with copy button)

**Checkpoint**: User Story 2 complete - Users can add/remove/block friends, friend management is fully functional

---

## Phase 5: User Story 3 - Location Simulation for Demo (Priority: P1) 🎯 MVP CORE

**Goal**: Enable manual coordinate entry for laptop demo (two browser windows simulating different locations)

**Independent Test**: Per quickstart.md Step 6 - Open two browser windows, manually set different lat/lng coordinates, verify proximity detection based on simulated locations

### Implementation for User Story 3

- [ ] T047 [P] [US3] Add isSimulated flag handling in PUT /me/location endpoint in backend/src/location/update.ts (store isSimulated boolean)
- [ ] T048 [P] [US3] Create LocationSimulator component in frontend/src/components/LocationSimulator.tsx (lat/lng input fields, update button, validation for bounds)
- [ ] T049 [P] [US3] Update useGeolocation hook in frontend/src/hooks/useGeolocation.ts to support manual coordinate override (check for simulated coords in localStorage first)
- [ ] T050 [US3] Add simulation mode toggle in frontend/src/pages/Settings.tsx (enable demo mode, show/hide LocationSimulator)
- [ ] T051 [US3] Add example coordinates helper in frontend/src/utils/test-coordinates.ts (SF Embarcadero, Ferry Building, etc. per quickstart.md)

**Checkpoint**: User Story 3 complete - Demo mode working, two-browser testing fully functional

---

## Phase 6: User Story 4 - Privacy and Sharing Modes (Priority: P2)

**Goal**: Add Everyone mode, privacy warnings, consent prompts for mode changes

**Independent Test**: Switch between OFF/FRIENDS/EVERYONE modes, verify consent prompts, test Everyone mode proximity detection with non-friends

### Implementation for User Story 4

- [ ] T052 [P] [US4] Update nearby matching logic in backend/src/location/nearby.ts to support EVERYONE mode (match any user in EVERYONE mode regardless of friendship)
- [ ] T053 [P] [US4] Create PrivacyWarning modal component in frontend/src/components/PrivacyWarning.tsx (safety warning: "Only share with trusted people", show on first sharing activation)
- [ ] T054 [P] [US4] Create EveryoneModeConsent modal in frontend/src/components/EveryoneModeConsent.tsx (explicit consent prompt when switching to EVERYONE)
- [ ] T055 [US4] Add privacy warning state tracking in frontend/src/store/auth.ts (track if warning shown, persist to localStorage)
- [ ] T056 [US4] Wire up consent flows in frontend/src/components/SharingToggle.tsx (show PrivacyWarning on first enable, show EveryoneModeConsent when selecting EVERYONE)
- [ ] T057 [US4] Add prominent sharing state indicator in frontend/src/pages/Home.tsx (color-coded: 🔴 OFF, 🟢 FRIENDS, 🟡 EVERYONE)

**Checkpoint**: User Story 4 complete - Privacy controls and Everyone mode functional

---

## Phase 7: User Story 5 - Configurable Proximity Radius (Priority: P2)

**Goal**: Allow users to customize proximity alert radius (100m - 5km)

**Independent Test**: Set different radius values, verify alerts only trigger within configured distance

### Implementation for User Story 5

- [ ] T058 [P] [US5] Update proximity matching in backend/src/location/nearby.ts to use min(requesterRadius, otherUserRadius) for matching
- [ ] T059 [P] [US5] Add radius configuration UI in frontend/src/pages/Settings.tsx (slider: 100m, 500m, 1km, 2km, 5km with visual feedback)
- [ ] T060 [US5] Update settings update to validate radiusMeters in backend/src/settings/update.ts (check 100 ≤ radius ≤ 5000)

**Checkpoint**: User Story 5 complete - Configurable radius working, distance filtering accurate

---

## Phase 8: User Story 6 - Mutual Calendar Availability (Priority: P3)

**Goal**: Connect Google Calendar, view mutual availability with friends, create calendar holds

**Independent Test**: Per quickstart.md Step 11-14 - Connect Google Calendar, configure sharing settings, view mutual availability, create hold

### Implementation for User Story 6

- [ ] T061 [P] [US6] Implement Google OAuth flow GET /calendar/google/connect in backend/src/calendar/oauth.ts (redirect to Google consent with state param)
- [ ] T062 [P] [US6] Implement OAuth callback GET /calendar/google/callback in backend/src/calendar/callback.ts (exchange code for tokens, encrypt refresh token, store in D1)
- [ ] T063 [P] [US6] Implement token encryption/decryption in backend/src/calendar/crypto.ts (AES-256-GCM using Workers secret)
- [ ] T064 [P] [US6] Implement calendar settings update PUT /calendar/settings in backend/src/calendar/settings.ts (selectedCalendarIds, obfuscationMode)
- [ ] T065 [P] [US6] Implement calendar disconnect POST /calendar/disconnect in backend/src/calendar/disconnect.ts (delete tokens from D1)
- [ ] T066 [P] [US6] Implement FreeBusy API wrapper in backend/src/calendar/freebusy.ts (refresh access token, call Google FreeBusy API)
- [ ] T067 [US6] Implement obfuscation logic in backend/src/calendar/obfuscate.ts (round busy blocks to hour boundaries if obfuscationMode=hourly)
- [ ] T068 [US6] Implement mutual availability endpoint GET /friends/:friendId/mutual-availability in backend/src/calendar/availability.ts (fetch both users' busy blocks, calculate free slots, apply obfuscation and exclusions)
- [ ] T069 [US6] Implement calendar hold creation POST /calendar/hold in backend/src/calendar/hold.ts (create personal Google Calendar event)
- [ ] T070 [US6] Implement recurring exclusions CRUD in backend/src/calendar/exclusions.ts (create/list/delete exclusion rules)
- [ ] T071 [P] [US6] Create Calendar page in frontend/src/pages/Calendar.tsx (connection status, OAuth flow trigger, settings)
- [ ] T072 [P] [US6] Create CalendarConnect component in frontend/src/components/CalendarConnect.tsx (button to initiate OAuth, handle callback redirect)
- [ ] T073 [P] [US6] Create CalendarSettings component in frontend/src/components/CalendarSettings.tsx (calendar selection, obfuscation toggle, exclusion rules)
- [ ] T074 [P] [US6] Create AvailabilityGrid component in frontend/src/components/AvailabilityGrid.tsx (7-day grid with 30-min slots, green=free, red=busy)
- [ ] T075 [P] [US6] Create CreateHold component in frontend/src/components/CreateHold.tsx (time slot selector, create hold button)
- [ ] T076 [US6] Wire up calendar flow in frontend/src/pages/Friends.tsx (add "View Availability" button per friend, navigate to availability view)

**Checkpoint**: User Story 6 complete - Calendar integration fully functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final touches, optimization, and demo readiness

- [ ] T077 [P] Implement TTL cleanup cron trigger in backend/src/cron/cleanup.ts (hourly: DELETE expired locations and proximity_events)
- [ ] T078 [P] Add PWA manifest and service worker in frontend/public/manifest.json and frontend/src/sw.js (offline fallback, install prompt)
- [ ] T079 [P] Add loading states to all frontend API calls in frontend/src/components/ (skeletons, spinners)
- [ ] T080 [P] Add error handling and user-friendly error messages in frontend/src/components/ErrorBoundary.tsx
- [ ] T081 [P] Implement connection status indicator in frontend/src/components/ConnectionStatus.tsx (show when offline or API unreachable)
- [ ] T082 [P] Add Tailwind styling polish: consistent spacing, colors, responsive design in frontend/src/styles/
- [ ] T083 [P] Create README.md in repository root with quickstart link and architecture overview
- [ ] T084 Perform end-to-end demo test using quickstart.md (verify all 14 steps work)
- [ ] T085 [P] Deploy backend to Cloudflare Workers (wrangler deploy)
- [ ] T086 [P] Deploy frontend to Cloudflare Pages (git push triggers Pages build)

---

## Dependencies & Execution Strategy

### Dependency Graph (User Story Completion Order)

```
Phase 1 (Setup) → Phase 2 (Foundation)
                        ↓
    ┌───────────────────┼───────────────────┐
    ↓                   ↓                   ↓
Phase 3 (US1)      Phase 4 (US2)      Phase 5 (US3)
Proximity          Friends             Demo Mode
    └───────────────────┴───────────────────┘
                        ↓
                Phase 6 (US4)
             Privacy Modes
                        ↓
                Phase 7 (US5)
            Configurable Radius
                        ↓
                Phase 8 (US6)
              Calendar (optional)
                        ↓
                Phase 9 (Polish)
```

**Critical Path**: Phase 1 → Phase 2 → (Phase 3 + Phase 4 + Phase 5) → Demo Ready

**MVP Scope**: Phases 1-5 only = Core proximity detection + demo mode  
**Enhanced MVP**: Phases 1-7 = Add privacy controls + radius config  
**Full Feature Set**: Phases 1-9 = All user stories + calendar

### Parallel Execution Opportunities

**During Phase 2 (Foundation)**:
- T011-T014 can run in parallel (all utility functions)
- T015-T018 can run in parallel (API setup + frontend setup)

**During Phase 3 (US1)**:
- Backend tasks T019-T026 can run in parallel with Frontend tasks T027-T031
- After T026 complete, T032-T035 depend on backend being functional

**During Phase 4 (US2)**:
- All US2 tasks (T036-T046) can run in parallel after Phase 3 complete

**During Phase 5 (US3)**:
- All US3 tasks (T047-T051) can run in parallel after Phase 3 complete

**During Phase 6-8**:
- Each user story phase can proceed once previous phase is complete
- Within each phase, [P] tasks can run in parallel

**During Phase 9 (Polish)**:
- All polish tasks (T077-T083) can run in parallel
- T084-T086 must run sequentially (test → deploy)

---

## Task Summary

| Phase | Task Count | Parallelizable | Estimated Hours |
|-------|-----------|----------------|-----------------|
| Phase 1: Setup | 7 | 4 [P] | 1.5h |
| Phase 2: Foundation | 11 | 8 [P] | 3h |
| Phase 3: US1 (Proximity) | 17 | 9 [P] | 4h |
| Phase 4: US2 (Friends) | 11 | 11 [P] | 1.5h |
| Phase 5: US3 (Demo) | 5 | 4 [P] | 0.5h |
| Phase 6: US4 (Privacy) | 6 | 3 [P] | 1h |
| Phase 7: US5 (Radius) | 3 | 2 [P] | 0.5h |
| Phase 8: US6 (Calendar) | 16 | 10 [P] | 3h (OPTIONAL) |
| Phase 9: Polish | 10 | 8 [P] | 1h |
| **Total** | **86** | **59 [P]** | **~12-16h** |

**MVP-Only** (Phases 1-5): 51 tasks, ~10.5 hours  
**Without Calendar** (Phases 1-7, 9): 70 tasks, ~12.5 hours

---

## Implementation Notes

### File Path Conventions

- **Backend**: All paths start with `backend/src/`
- **Frontend**: All paths start with `frontend/src/`
- **Shared**: All paths start with `shared/types/`
- **Database**: Migrations in `backend/migrations/`
- **Config**: `backend/wrangler.toml`, `frontend/vite.config.ts`

### Constitutional Compliance Checkpoints

- ✅ T023: Enforce 24h TTL on locations (constitutional requirement)
- ✅ T025: Implement OUT→IN alert detection (avoid spam, constitutional requirement)
- ✅ T041: Symmetric blocking (privacy requirement)
- ✅ T053: Privacy warning on first share (constitutional requirement)
- ✅ T063: Encrypt calendar tokens (security requirement)
- ✅ T077: TTL cleanup cron (data retention enforcement)

### Demo Readiness Checklist

After Phase 5 (MVP Core) complete:
- [ ] Two browser windows can register as different users
- [ ] Friend relationship established bidirectionally
- [ ] Proximity alert fires when simulated locations enter radius
- [ ] Alert suppression working (no spam when staying nearby)
- [ ] OFF mode deletes location immediately
- [ ] quickstart.md Steps 1-9 work end-to-end

After Phase 9 (Full) complete:
- [ ] All quickstart.md steps (1-14) work
- [ ] Calendar integration functional
- [ ] PWA installable on mobile
- [ ] Backend deployed to Workers
- [ ] Frontend deployed to Pages

---

**Status**: Task breakdown complete. 86 total tasks across 9 phases. MVP-ready after 51 tasks (~10.5h). Ready for implementation via `/speckit.implement` or manual execution.
