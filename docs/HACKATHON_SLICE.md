# Hackathon Slice - Proximity Radar MVP

**Target**: Solo build, demoable by 17:45 (6.75 hours from 11:00)  
**Demo Method**: Two browser windows with location simulation  
**Scope**: Core proximity detection + friend management only

---

## Constraints & Simplifications

**SKIP** (deferred to post-hackathon):
- ❌ Calendar integration (US6) - 16 tasks
- ❌ JWT authentication - use simple device ID tokens
- ❌ KV rate limiter - use in-memory or skip
- ❌ Shared TypeScript types package - duplicate types in backend/frontend
- ❌ ESLint/Prettier setup - code quality can wait
- ❌ PWA offline support - just web app
- ❌ Privacy consent modals - just mode toggle
- ❌ Configurable radius - hardcode 1km
- ❌ Friend blocking - just add/remove
- ❌ Error boundaries - basic error handling
- ❌ Loading spinners - instant feedback only
- ❌ Deployment - local demo only

**KEEP** (essential for demo):
- ✅ Device registration (simplified)
- ✅ Location sharing with simulation
- ✅ Proximity detection and alerts
- ✅ Friend management (add via code)
- ✅ Basic UI with radar visualization

---

## MUST-DO Tasks (Finish by 17:45)

### Block 1: Minimal Backend Setup (11:00 - 12:00, 60min)

**T001-SLIM**: Create project structure
```bash
mkdir -p backend/src/{auth,location,friends,db,utils} frontend/src/{pages,components,services,hooks}
```

**T002-SLIM**: Initialize backend (simplified)
```bash
cd backend
npm init -y
npm install hono drizzle-orm better-sqlite3
npm install -D @cloudflare/workers-types wrangler typescript
# Skip: jose (JWT), @cloudflare/kv (rate limiter)
```

**T003-SLIM**: Initialize frontend (minimal)
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install @tanstack/react-query axios
# Skip: workbox (PWA), tailwindcss (use vanilla CSS)
```

**T005-SLIM**: Configure wrangler.toml (D1 only, no KV)
```toml
name = "proximity-radar"
main = "src/index.ts"
compatibility_date = "2026-01-10"

[[d1_databases]]
binding = "DB"
database_name = "proximity-radar-db"
database_id = "local"
```

**T008-SLIM**: Create D1 schema (5 tables, skip calendar tables)
```sql
-- users, locations, friendships, blocked_users, proximity_events
-- Skip: calendar_tokens, calendar_exclusions
```

**T009-SLIM**: Drizzle schema (backend/src/db/schema.ts)

**T010**: Database client (backend/src/db/client.ts)

**T011**: Haversine distance (backend/src/utils/haversine.ts)

---

### Block 2: Simplified Auth + Location Backend (12:00 - 13:00, 60min)

**T013-SLIM**: Simple auth utilities (backend/src/auth/simple-auth.ts)
- Skip JWT - use plain device secrets (32-char random string)
- Verification: lookup deviceSecret in DB, return userId

**T014-SLIM**: Auth middleware (backend/src/auth/middleware.ts)
- Check `Authorization: Bearer <deviceSecret>` header
- Query DB for matching user

**T015**: Hono router setup (backend/src/index.ts)

**T020-SLIM**: Device registration (backend/src/auth/register.ts)
- Generate deviceSecret (crypto.randomUUID())
- Generate friendCode (8-char alphanumeric)
- Return: { userId, deviceSecret, friendCode }

**T021-SLIM**: Settings update (backend/src/settings/update.ts)
- Update mode, displayName only (skip radiusMeters - hardcode 1km)

**T022**: Settings fetch (backend/src/settings/get.ts)

**T023-SLIM**: Location update (backend/src/location/update.ts)
- Skip rate limiting (remove KV dependency)
- Upsert location with 24h TTL

---

### Block 3: Proximity Detection Backend (13:00 - 13:30, 30min)

**T024**: Proximity matching (backend/src/location/nearby.ts)
- Haversine distance calculation
- Filter by mode (OFF/FRIENDS only, skip EVERYONE)
- Return distance categories

**T025**: Proximity state tracking (backend/src/utils/proximity.ts)
- OUT→IN alert detection
- Upsert proximity_events

**T026**: Nearby endpoint (backend/src/location/nearby-handler.ts)
- GET /nearby
- Return nearby list + newAlerts

---

### Block 4: Friend Management Backend (13:30 - 14:00, 30min)

**T037**: Friend code generation (backend/src/utils/friend-code.ts)

**T038**: Friend invite acceptance (backend/src/friends/invite.ts)
- POST /friends/invite/accept
- Bidirectional friendship creation

**T039**: Friends list (backend/src/friends/list.ts)
- GET /friends

**T040-DEFER**: Friend removal (skip for MVP)

**T041-DEFER**: Blocking (skip for MVP)

---

### Block 5: Frontend Foundation (14:00 - 15:00, 60min)

**T016-SLIM**: API client (frontend/src/services/api.ts)
- Axios instance with auth header
- Store deviceSecret in localStorage

**T017-SLIM**: Auth store (frontend/src/services/auth.ts)
- localStorage wrapper for deviceSecret, userId, mode
- Skip complex state management - use React Context

**T018-SLIM**: Basic UI components (frontend/src/components/ui/)
- Button.tsx, Input.tsx, Toggle.tsx
- Inline styles (skip Tailwind)

**T027-SLIM**: Registration page (frontend/src/pages/Register.tsx)
- Auto-register on first visit
- Store deviceSecret in localStorage

**T028**: Home page (frontend/src/pages/Home.tsx)
- Main dashboard layout

**T031**: Settings page (frontend/src/pages/Settings.tsx)
- Display name input
- Mode toggle (OFF/FRIENDS)

---

### Block 6: Friend Management UI (15:00 - 15:30, 30min)

**T043**: Friends page (frontend/src/pages/Friends.tsx)

**T044-SLIM**: FriendList component (frontend/src/components/FriendList.tsx)
- Display friends, remove button only (skip block)

**T045**: AddFriend component (frontend/src/components/AddFriend.tsx)

**T046**: FriendCode component (frontend/src/components/FriendCode.tsx)

---

### Block 7: Location & Proximity UI (15:30 - 16:30, 60min)

**T029**: SharingToggle component (frontend/src/components/SharingToggle.tsx)
- Big ON/OFF button
- Mode selector (OFF/FRIENDS only)

**T030**: NearbyList component (frontend/src/components/NearbyList.tsx)
- List view with distance categories

**T032-SLIM**: useGeolocation hook (frontend/src/hooks/useGeolocation.ts)
- Browser Geolocation API wrapper
- Support manual override for simulation

**T033**: useLocationSync hook (frontend/src/hooks/useLocationSync.ts)
- Polling loop (PUT /me/location every 10s, GET /nearby)

**T034-SLIM**: ProximityAlert component (frontend/src/components/ProximityAlert.tsx)
- Simple alert box (skip toast library)

**T035-SLIM**: App.tsx polling wiring
- TanStack Query polling when mode !== OFF

**T048**: LocationSimulator component (frontend/src/components/LocationSimulator.tsx)
- Lat/lng input fields, update button

**T049**: Update useGeolocation for manual override

**T050**: Simulation toggle in Settings

**T051**: Test coordinates helper (frontend/src/utils/test-coordinates.ts)

---

### Block 8: **NEW - Radar Visualization** (16:30 - 17:15, 45min)

**T087-NEW**: Create RadarDisplay component (frontend/src/components/RadarDisplay.tsx)
- Circular radar view (SVG or Canvas)
- Center: current user (pulsing dot)
- Rings: 500m, 1km, 2km distance markers
- Friends: positioned by distance and bearing
- Color coding: VERY_CLOSE (green), CLOSE (yellow), NEARBY (orange)

**T088-NEW**: Add bearing calculation (backend/src/utils/bearing.ts)
- Calculate compass bearing between two coordinates
- Return angle in degrees (0° = North)

**T089-NEW**: Update nearby endpoint to include bearing
- Modify backend/src/location/nearby-handler.ts
- Return `{ userId, displayName, distance, category, bearing }`

**T090-NEW**: Create RadarToggle component (frontend/src/components/RadarToggle.tsx)
- Switch between List View and Radar View
- Tabs: "List" | "Radar"

**T091-NEW**: Wire RadarDisplay into Home page
- Toggle between NearbyList and RadarDisplay
- Auto-refresh radar on polling updates

---

### Block 9: Integration & Testing (17:15 - 17:45, 30min)

**T084-CRITICAL**: End-to-end demo test
- Two Chrome windows (normal + incognito)
- Register two users
- Exchange friend codes
- Enable FRIENDS mode
- Simulate nearby locations (SF coordinates)
- Verify proximity alerts fire
- Verify nearby list + radar display both users

**T092-NEW**: Quick bug fixes and polish
- Fix any critical issues found during testing
- Add minimal CSS for readability

---

## DEFER List (Post-Hackathon)

### Deferred Backend Tasks

- ❌ T004: Shared TypeScript types package (inline types instead)
- ❌ T007: ESLint/Prettier setup
- ❌ T012: KV rate limiter (use in-memory or skip)
- ❌ T013: JWT auth (use simple device secrets)
- ❌ T040: Friend removal endpoint
- ❌ T041: Blocking endpoint
- ❌ T042: Filter blocked users in nearby
- ❌ T052-T057: Privacy modes (US4 - Everyone mode, consent modals)
- ❌ T058-T060: Configurable radius (US5 - hardcode 1km)
- ❌ T061-T076: Calendar integration (US6 - all 16 tasks)
- ❌ T077: TTL cleanup cron trigger

### Deferred Frontend Tasks

- ❌ T006: Vite PWA plugin + Tailwind setup (use vanilla CSS)
- ❌ T078: PWA manifest and service worker
- ❌ T079: Loading spinners (use instant feedback)
- ❌ T080: Error boundaries (basic try/catch only)
- ❌ T081: Connection status indicator
- ❌ T082: Tailwind styling polish (vanilla CSS sufficient)
- ❌ T085: Deploy backend to Cloudflare Workers
- ❌ T086: Deploy frontend to Cloudflare Pages

### Deferred Documentation

- ❌ T083: README.md (add after demo works)

---

## Task Count Summary

| Category | Task Count | Time Estimate |
|----------|-----------|---------------|
| Backend Setup | 11 | 2.5h |
| Frontend Setup | 13 | 2.0h |
| **New Radar UI** | 5 | 0.75h |
| Testing & Fixes | 2 | 0.5h |
| **Total MUST-DO** | **31** | **5.75h** |
| **Buffer** | - | **1h** |
| **Deferred** | **55** | - |

**Target Completion**: 17:45 ✅  
**Actual Time Available**: 6.75h  
**Planned Work**: 5.75h  
**Contingency Buffer**: 1h

---

## Success Criteria (17:45 Demo)

**Backend**:
- ✅ Two users can register (get deviceSecret + friendCode)
- ✅ Friend relationship created via invite code
- ✅ Location updates accepted (with simulation flag)
- ✅ Proximity matching returns nearby friends with distance + bearing
- ✅ Alerts fire on OUT→IN transitions

**Frontend**:
- ✅ Registration auto-happens on first visit
- ✅ Friends page: add friend via code, display friend list
- ✅ Home page: toggle sharing ON/OFF, see nearby list
- ✅ Location simulator: manual lat/lng entry
- ✅ **Radar view**: circular visualization with friends positioned by distance/bearing
- ✅ Alerts display when friend enters radius

**Demo Flow** (90 seconds):
1. Open two browser windows
2. Register both users (auto)
3. Exchange friend codes
4. Enable FRIENDS mode
5. Simulate locations (SF Ferry Building, ~300m apart)
6. **Toggle to Radar view** - see friend on radar
7. Proximity alert fires
8. Toggle to List view - see friend in list

---

## File Structure (Simplified)

```
proximity-radar/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   │   ├── register.ts
│   │   │   ├── simple-auth.ts      # No JWT
│   │   │   └── middleware.ts
│   │   ├── location/
│   │   │   ├── update.ts           # No rate limiting
│   │   │   ├── nearby.ts
│   │   │   └── nearby-handler.ts
│   │   ├── friends/
│   │   │   ├── invite.ts
│   │   │   └── list.ts
│   │   ├── db/
│   │   │   ├── schema.ts           # 5 tables only
│   │   │   └── client.ts
│   │   ├── utils/
│   │   │   ├── haversine.ts
│   │   │   ├── bearing.ts          # NEW
│   │   │   └── friend-code.ts
│   │   └── index.ts                # Hono router
│   ├── migrations/
│   │   └── 001_create_tables.sql
│   ├── package.json
│   └── wrangler.toml
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Register.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── Friends.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── Toggle.tsx
│   │   │   ├── SharingToggle.tsx
│   │   │   ├── NearbyList.tsx
│   │   │   ├── RadarDisplay.tsx     # NEW
│   │   │   ├── RadarToggle.tsx      # NEW
│   │   │   ├── LocationSimulator.tsx
│   │   │   ├── ProximityAlert.tsx
│   │   │   ├── FriendList.tsx
│   │   │   ├── AddFriend.tsx
│   │   │   └── FriendCode.tsx
│   │   ├── services/
│   │   │   ├── api.ts              # Axios client
│   │   │   └── auth.ts             # localStorage wrapper
│   │   ├── hooks/
│   │   │   ├── useGeolocation.ts
│   │   │   └── useLocationSync.ts
│   │   ├── utils/
│   │   │   └── test-coordinates.ts
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── docs/
    ├── HACKATHON_SLICE.md           # This file
    └── DEMO.md
```

---

## Implementation Notes

### Simplified Auth Flow

**No JWT** - use plain device secrets:
```typescript
// Registration
POST /auth/register
Response: { userId: 1, deviceSecret: "abc123...", friendCode: "XYZ789" }

// Subsequent requests
GET /nearby
Headers: { "Authorization": "Bearer abc123..." }

// Backend: lookup user by deviceSecret in DB
```

### Hardcoded Values

- **Radius**: 5000m (5km) - no configuration
- **Polling interval**: 10 seconds
- **Distance categories**: 
  - VERY_CLOSE: <500m
  - CLOSE: 500-1000m
  - NEARBY: 1000-2000m
- **Modes**: OFF, FRIENDS only (skip EVERYONE)

### Radar Visualization Details

**SVG Approach** (recommended):
```tsx
<svg width="400" height="400">
  {/* Rings */}
  <circle cx="200" cy="200" r="50" fill="none" stroke="#ddd" />  {/* 500m */}
  <circle cx="200" cy="200" r="100" fill="none" stroke="#ddd" /> {/* 1km */}
  
  {/* Current user (center) */}
  <circle cx="200" cy="200" r="10" fill="blue" className="pulse" />
  
  {/* Friend dots */}
  {nearbyFriends.map(friend => {
    const x = 200 + (friend.distance / 1000) * 100 * Math.cos(friend.bearing);
    const y = 200 + (friend.distance / 1000) * 100 * Math.sin(friend.bearing);
    return <circle key={friend.userId} cx={x} cy={y} r="8" fill={getColor(friend.category)} />;
  })}
</svg>
```

### Bearing Calculation

```typescript
// backend/src/utils/bearing.ts
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
```

---

## Risk Mitigation

**Potential Blockers**:
1. ❌ D1 database setup issues → **Mitigation**: Use better-sqlite3 locally first
2. ❌ CORS errors → **Mitigation**: Add permissive CORS in Hono setup
3. ❌ localStorage conflicts → **Mitigation**: Use unique keys per browser
4. ❌ Radar SVG math errors → **Mitigation**: Use pre-calculated test positions first

**Time Management**:
- If behind at 15:30 → Skip radar visualization, ship list view only
- If behind at 16:30 → Skip friend management, hardcode friendships in DB
- If behind at 17:15 → Skip testing, fix critical bugs only

---

**Status**: Hackathon slice defined. 31 must-do tasks, 5 new radar tasks added. Ready to build! 🚀
