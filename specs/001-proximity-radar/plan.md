# Implementation Plan: Proximity Radar

**Branch**: `001-proximity-radar` | **Date**: January 10, 2026 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-proximity-radar/spec.md`

**Note**: This plan implements a ruthlessly scoped MVP focused on demo-ability within 12 hours using Cloudflare's edge platform.

## Summary

Build a location-sharing web app that alerts friends when they enter proximity. Core implementation: Cloudflare Workers REST API polling architecture (no websockets), D1 SQLite for persistence, browser Geolocation API with manual coordinate override for demo, device-based authentication (no email/SMS), Friends-only default privacy mode, 24-hour data retention, and optional Google Calendar mutual availability finder. Target: working two-browser-window demo in 12 hours.

## Technical Context

**Language/Version**: JavaScript (ES2022+) with TypeScript typings for Cloudflare Workers API  
**Primary Dependencies**: 
- Backend: Hono (lightweight Workers router), drizzle-orm (D1 ORM), jose (JWT tokens)
- Frontend: Vite 5, React 18, TanStack Query (polling), Tailwind CSS, Workbox (PWA)
**Storage**: Cloudflare D1 (SQLite) for all persistent data; KV for rate limiting only  
**Testing**: Vitest (unit tests), wrangler dev (local Workers environment), manual browser testing  
**Target Platform**: Cloudflare Workers (backend) + Cloudflare Pages (frontend); browser targets: Chrome 120+, Safari 17+  
**Project Type**: Web application (separate frontend + backend)  
**Performance Goals**: 
- API response time <50ms p95 (edge compute)
- Location update rate: 1 request per 10 seconds per user
- Proximity calculation: Haversine formula <1ms for 100 user comparisons
**Constraints**: 
- Workers CPU time <10ms per request (free tier)
- Location data TTL: 24 hours (constitutional requirement)
- No websockets (polling only for MVP)
- No background location tracking (only while app is open)
**Scale/Scope**: 
- Target: 100 concurrent demo users
- Max friends per user: 100
- Calendar lookahead: 7 days, 30-minute granularity

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Privacy-First Design ✅

- Location sharing defaults to OFF: **PASS** - confirmed in FR-002, FR-028
- Friends-only default when enabled: **PASS** - specified in user input
- Prominent visibility toggle: **PASS** - FR-003, big ON/OFF in UI requirements
- 24-hour data retention: **PASS** - specified in user input, enforced via TTL
- No background tracking: **PASS** - "only while app is open" requirement
- No location history: **PASS** - "store last location only" in FR design
- Panic stop capability: **PASS** - FR-028, FR-029 for immediate OFF + data clear
- No raw calendar storage: **PASS** - FreeBusy API returns only busy/free blocks

### Hackathon Speed Over Perfection ✅

- 12-hour delivery target: **PASS** - REST polling architecture, no websockets
- Minimal dependencies: **PASS** - Hono (5KB), Drizzle (lightweight ORM), React (standard)
- No admin panels/dashboards: **PASS** - not in scope
- REST only (no GraphQL): **PASS** - explicitly specified in user input
- Polling instead of websockets: **PASS** - "prefer simple polling" requirement
- Quickstart README: **PASS** - quickstart.md deliverable confirmed

### Minimal Viable Security ✅

- TLS enforced: **PASS** - Cloudflare default
- Signed tokens: **PASS** - JWT via jose library
- Rate limiting: **PASS** - 1 req/10s via KV check
- Input validation: **PASS** - lat/lng bounds, string limits to be enforced
- Block functionality: **PASS** - FR-016, FR-017, FR-018
- No password complexity/MFA: **PASS** - device-based auth, no email/SMS

### Cloudflare-Native Stack ✅

- Workers for backend: **PASS** - explicitly specified
- Pages for frontend: **PASS** - explicitly specified
- D1 for SQL storage: **PASS** - explicitly specified
- KV for rate limits only: **PASS** - "optional KV only if needed"
- No external databases: **PASS** - all on Cloudflare
- <50ms p95 response: **PASS** - target specified in performance goals
- <10ms CPU time: **PASS** - lightweight operations (Haversine, SQL lookups)

### UX Clarity ✅

- ≤4 screens: **PASS** - implied by "no map required", simple list view
- List-based proximity: **PASS** - "simple list of nearby matches with distance"
- No map required: **PASS** - explicitly deferred in scope
- Prominent sharing indicator: **PASS** - "UI must make sharing state obvious (big ON/OFF)"
- Settings expose key controls: **PASS** - mode toggle, radius config in FR
- ≤2 taps from home: **PASS** - minimal UI design

### Low-Cost Operations ✅

- Free tier compliance: **PASS** - polling reduces request volume
- Polling over websockets: **PASS** - explicitly specified
- 24-hour data purge: **PASS** - TTL-based cleanup
- No event detail storage: **PASS** - FreeBusy API only
- Minimal background jobs: **PASS** - TTL handles cleanup automatically
- Static frontend + edge cache: **PASS** - Cloudflare Pages default behavior

**GATE STATUS: ✅ PASSED** - All constitutional requirements satisfied. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-proximity-radar/
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0: Technology decisions and best practices
├── data-model.md        # Phase 1: D1 database schema
├── quickstart.md        # Phase 1: Demo setup and two-browser testing guide
├── contracts/           # Phase 1: OpenAPI REST endpoint specifications
│   └── api.openapi.yaml
└── tasks.md             # Phase 2: Implementation task breakdown (NOT YET CREATED)
```

### Source Code (repository root)

```text
proximity-radar/
├── backend/                      # Cloudflare Workers API
│   ├── src/
│   │   ├── index.ts             # Worker entry point (Hono router)
│   │   ├── auth/                # Device auth + JWT generation
│   │   │   ├── register.ts      # POST /auth/register
│   │   │   └── middleware.ts    # Token validation
│   │   ├── location/            # Location update + proximity matching
│   │   │   ├── update.ts        # PUT /me/location
│   │   │   ├── nearby.ts        # GET /nearby
│   │   │   └── haversine.ts     # Distance calculation utility
│   │   ├── friends/             # Friend management
│   │   │   ├── invite.ts        # POST /friends/invite/accept
│   │   │   ├── list.ts          # GET /friends
│   │   │   └── block.ts         # POST /friends/{id}/block
│   │   ├── settings/            # User settings
│   │   │   └── update.ts        # PUT /me/settings
│   │   ├── calendar/            # Google Calendar integration
│   │   │   ├── oauth.ts         # OAuth2 flow
│   │   │   ├── freebusy.ts      # FreeBusy API wrapper
│   │   │   └── availability.ts  # GET /friends/{id}/mutual-availability
│   │   ├── db/                  # Database layer
│   │   │   ├── schema.ts        # Drizzle D1 schema definitions
│   │   │   └── migrations/      # SQL migration files
│   │   └── utils/               # Shared utilities
│   │       ├── rate-limit.ts    # KV-based rate limiter
│   │       └── proximity.ts     # Proximity state tracking (OUT→IN detection)
│   ├── wrangler.toml            # Cloudflare Workers config
│   ├── migrations/              # D1 schema migrations
│   └── tests/
│       ├── unit/                # Vitest unit tests
│       └── integration/         # wrangler dev integration tests
│
├── frontend/                     # Cloudflare Pages PWA
│   ├── src/
│   │   ├── main.tsx             # Vite entry point
│   │   ├── App.tsx              # Root component with router
│   │   ├── pages/               # Screen components
│   │   │   ├── Home.tsx         # Main screen: nearby list + sharing toggle
│   │   │   ├── Settings.tsx     # Mode selection, radius config, panic stop
│   │   │   ├── Friends.tsx      # Friend list + invite code management
│   │   │   └── Calendar.tsx     # Mutual availability view
│   │   ├── components/          # Reusable UI components
│   │   │   ├── LocationSimulator.tsx  # Manual lat/lng override for demo
│   │   │   ├── NearbyList.tsx         # Proximity results display
│   │   │   ├── SharingToggle.tsx      # Big ON/OFF indicator
│   │   │   └── AvailabilityGrid.tsx   # 7-day calendar view
│   │   ├── services/            # API client layer
│   │   │   ├── api.ts           # Axios/fetch wrapper with auth headers
│   │   │   ├── location.ts      # Location update polling logic
│   │   │   └── auth.ts          # Device registration + token storage
│   │   ├── hooks/               # React hooks
│   │   │   ├── useGeolocation.ts      # Browser Geolocation API wrapper
│   │   │   ├── useLocationSync.ts     # Polling loop (every 10s)
│   │   │   └── useAuth.ts             # Device token management
│   │   ├── store/               # Client state (Zustand or Context)
│   │   │   └── user.ts          # Current user, sharing mode, settings
│   │   └── styles/              # Tailwind CSS
│   ├── public/
│   │   ├── manifest.json        # PWA manifest
│   │   └── sw.js                # Service worker (Workbox)
│   ├── index.html
│   ├── vite.config.ts
│   └── tests/
│       └── unit/                # Vitest component tests
│
├── shared/                       # Shared TypeScript types
│   └── types/
│       ├── api.ts               # Request/response interfaces
│       ├── models.ts            # User, Location, Friend entities
│       └── enums.ts             # SharingMode, DistanceCategory
│
└── README.md                     # Top-level project overview
```

**Structure Decision**: Web application (frontend + backend) architecture chosen because:

1. **Separate deployment targets**: Cloudflare Pages (static frontend) vs Cloudflare Workers (edge API)
2. **Independent scaling**: Frontend cached at edge, backend scales per-request
3. **Clear boundary**: REST API contract separates concerns cleanly
4. **Demo compatibility**: Two browser windows can run separate frontend instances against shared backend
5. **Shared types**: TypeScript interfaces in `/shared` ensure frontend-backend contract alignment

## Complexity Tracking

**Status**: No constitutional violations detected. This section intentionally left empty.
