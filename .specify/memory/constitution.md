<!--
SYNC IMPACT REPORT - Constitution v1.0.0
═══════════════════════════════════════════════════════════════════════════════

VERSION CHANGE: NEW → 1.0.0
Rationale: Initial constitution for 12-hour hackathon MVP project

CREATED PRINCIPLES:
  1. Privacy-First Design (explicit consent, default OFF, data minimization)
  2. Hackathon Speed Over Perfection (working demo in 12h, avoid over-engineering)
  3. Minimal Viable Security (TLS, auth tokens, rate limiting, input validation)
  4. Cloudflare-Native Stack (Workers + Pages, edge computing constraints)
  5. UX Clarity (minimal screens, strong status indicators, list-based proximity)
  6. Low-Cost Operations (polling over websockets, 24h retention, minimal state)

ADDED SECTIONS:
  - Data Storage Constraints (strict schema, no feature creep)
  - Safety Features (block/report, panic stop)
  - Technology Constraints (Cloudflare Workers limitations)

TEMPLATES REQUIRING UPDATES:
  ✅ plan-template.md - Constitution Check section aligns with hackathon gates
  ✅ spec-template.md - User scenarios must validate privacy controls
  ✅ tasks-template.md - Task phases respect 12h timeline, privacy enforcement

FOLLOW-UP TODOS: None - all placeholders resolved

Generated: 2025-01-10
═══════════════════════════════════════════════════════════════════════════════
-->

# Proximity Radar Constitution

## Core Principles

### I. Privacy-First Design (NON-NEGOTIABLE)

**The Principle**: User privacy MUST be the foundation of every feature decision.

**Rules**:
- All location sharing features MUST default to OFF (explicit opt-in required)
- Sharing mode MUST default to "Friends-only" when first enabled
- Visibility toggle MUST be prominently displayed with clear ON/OFF state
- Location data retention MUST NOT exceed 24 hours from last update
- System MUST NOT implement background tracking in MVP scope
- System MUST NOT store or display location history
- User MUST be able to immediately delete their last location via "panic stop"
- System MUST NOT store raw calendar event details—only derived busy/free blocks

**Rationale**: A location-sharing app that loses user trust loses all value. Privacy violations are unrecoverable in hackathon demos and create legal exposure. Default-off + friends-only ensures users consciously choose exposure level.

---

### II. Hackathon Speed Over Perfection (NON-NEGOTIABLE)

**The Principle**: Ship a working demo in 12 hours; avoid over-engineering.

**Rules**:
- Features MUST demonstrate core value (proximity matching) within time box
- Architecture decisions MUST favor simplicity over theoretical scalability
- Prefer polling over websockets unless real-time updates are demo-critical
- Keep dependencies minimal—use Cloudflare native APIs when possible
- Do not build admin panels, analytics dashboards, or operational tooling
- Use REST APIs for all endpoints (no GraphQL, no gRPC)
- Defer all "nice-to-have" features that don't support core demo narrative
- Write a tiny README with quickstart checklist sufficient for demo setup

**Rationale**: 12 hours is 720 minutes. Every hour spent on infrastructure, tooling, or premature optimization reduces time for the core demo. Judges evaluate working software, not architecture astronautics.

---

### III. Minimal Viable Security (NON-NEGOTIABLE)

**The Principle**: Implement essential security without over-engineering.

**Rules**:
- ALL endpoints MUST use TLS (enforced by Cloudflare)
- Authentication MUST use signed tokens (JWT or Cloudflare Access)
- Rate limiting MUST be applied to location update endpoints (max 1 req/5s per user)
- Input validation MUST check lat/lng bounds, string lengths, user IDs
- Panic stop MUST immediately set mode=OFF and purge last location
- Block/report functionality MUST prevent blocked users from seeing blocker's location
- Do NOT implement: password hashing complexity, MFA, audit logs, encryption at rest (rely on Cloudflare)

**Rationale**: Security failures kill hackathon projects. Focus on obvious attack vectors (injection, rate abuse, unauthorized access) with minimal code. Cloudflare provides baseline protections; don't reinvent them.

---

### IV. Cloudflare-Native Stack

**The Principle**: Embrace Cloudflare Workers + Pages constraints and capabilities.

**Rules**:
- Backend MUST use Cloudflare Workers with Durable Objects or D1 for state
- Frontend MUST deploy via Cloudflare Pages (static + server-side rendering)
- All data storage MUST fit within Durable Objects (key-value) or D1 (SQL Lite)
- No external databases, no Redis, no traditional VMs
- Leverage Cloudflare KV for read-heavy data (friend lists, user profiles)
- Leverage Durable Objects for write-heavy + transactional data (location updates)
- API responses MUST complete within 50ms p95 (edge compute constraint)
- Workers MUST NOT exceed 10ms CPU time per request (platform limit)

**Rationale**: Cloudflare's edge platform enables global low-latency demos with near-zero cost. Violating platform constraints (CPU time, memory, storage model) breaks the demo. Design for the platform, not against it.

---

### V. UX Clarity

**The Principle**: Interface MUST be instantly understandable with minimal cognitive load.

**Rules**:
- Total screen count MUST NOT exceed 4 (login, home, settings, profile)
- Proximity results MUST show as a list with distance bands ("< 100m", "100-500m", "500m-1km")
- Map view is NOT required for MVP (list-first design)
- Sharing status indicator MUST use color + icon + text ("🟢 VISIBLE TO FRIENDS")
- Settings screen MUST expose: visibility toggle, sharing mode, panic stop button
- No tooltips, no onboarding carousels, no feature discovery flows
- All interactions MUST complete in ≤2 taps from home screen

**Rationale**: Hackathon demos fail when judges/users get confused. Minimal screens + strong visual indicators + list-based output = instant comprehension. Maps add complexity without adding core value in 12h.

---

### VI. Low-Cost Operations

**The Principle**: Optimize for near-zero operational costs post-hackathon.

**Rules**:
- Cloudflare Workers free tier MUST NOT be exceeded (100k reqs/day)
- Use polling (30-60s intervals) instead of websockets for location updates
- Location data MUST be purged after 24h (automatic via TTL or cron trigger)
- Calendar integrations MUST only store derived busy/free blocks (not event details)
- No background jobs except: TTL-based data expiry, panic stop cleanup
- Frontend MUST use static assets + edge caching (no dynamic rendering per request)
- Authentication MUST use Cloudflare Access (free) or lightweight JWT

**Rationale**: Hackathon projects that incur ongoing costs get shut down. Free-tier constraints force good design (polling, aggressive caching, minimal state). 24h retention + TTL = zero manual cleanup.

---

## Data Storage Constraints

**Scope**: These are the ONLY fields the system may persist. Any additional storage MUST be justified as a constitutional amendment.

**User Table**:
- `userId` (UUID, primary key)
- `displayName` (string, max 50 chars)
- `mode` (enum: OFF, FRIENDS, EVERYONE)
- `lastUpdatedAt` (ISO 8601 timestamp)

**Location Table**:
- `userId` (foreign key)
- `latitude` (float, -90 to 90)
- `longitude` (float, -180 to 180)
- `timestamp` (ISO 8601)
- `ttl` (24h from timestamp, auto-delete)

**Friend Links Table**:
- `userId` (foreign key)
- `friendId` (foreign key)
- `status` (enum: PENDING, ACCEPTED, BLOCKED)

**Calendar Sharing Table**:
- `userId` (foreign key)
- `busyBlocks` (JSON array of {start, end} timestamps, max 168h future)

**Rationale**: Explicit schema prevents feature creep. If a feature requires new fields, it triggers constitutional review. Data minimization reduces privacy risk and storage costs.

---

## Safety Features

**Block/Report**:
- User A blocks User B → User B MUST NOT see User A's location or status
- Block action MUST be instant (no confirmation dialog)
- Report functionality MUST log reporter ID + reported ID + timestamp (store 7 days max)

**Panic Stop**:
- Single button press MUST:
  1. Set `mode = OFF`
  2. Delete last location record immediately
  3. Clear calendar sharing settings
  4. Show confirmation: "You are now invisible"
- No undo, no confirmation dialog (instant action)

**Rationale**: Safety features build trust. Panic stop addresses emergency scenarios (abusive ex, stalking). Block prevents retaliation visibility. Both must be fast and obvious.

---

## Technology Constraints

**Cloudflare Workers Limits** (enforced by platform):
- Max CPU time: 10ms per request (50ms on paid plan—stay under 10ms for free tier)
- Max memory: 128 MB per invocation
- Max execution time: 30 seconds (but aim for <50ms p95)
- Max script size: 1 MB compressed

**Design Implications**:
- No heavy computation (distance calculations must be fast: Haversine formula only)
- No large dependency trees (trim unnecessary libraries)
- No blocking I/O (all DB calls must use async APIs)
- No synchronous external API calls in request path

**Rationale**: Platform constraints are hard limits. Violating them causes runtime errors during demos. Design within constraints from day one.

---

## Governance

**Amendment Process**:
1. Proposed change MUST identify which principle is violated or requires update
2. Proposer MUST justify why 12-hour timeline or core value requires the change
3. Amendment MUST update this document + increment version (see versioning rules)
4. All dependent templates (plan, spec, tasks) MUST be updated for consistency

**Version Semantics**:
- **MAJOR**: Principle removed, redefined, or core scope changed (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New principle added or existing principle significantly expanded (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Clarifications, typo fixes, wording improvements without semantic changes (e.g., 1.0.0 → 1.0.1)

**Compliance Enforcement**:
- Phase 0 (Research) MUST check: Cloudflare compatibility, 12h feasibility
- Phase 1 (Design) MUST check: Privacy controls in data model, security in contracts
- Phase 2 (Tasks) MUST check: Each task respects data storage constraints
- Pre-demo checklist MUST include: Panic stop works, default-off verified, README complete

**Violation Handling**:
- If a task violates a principle, implementer MUST either:
  1. Redesign the task to comply, OR
  2. Propose a constitutional amendment with justification
- Violations discovered post-implementation MUST be treated as critical bugs

**Rationale**: Constitution is the project's truth. All planning artifacts derive from it. Amendments are allowed but require conscious decision + propagation to dependent templates.

---

**Version**: 1.0.0 | **Ratified**: 2025-01-10 | **Last Amended**: 2025-01-10
