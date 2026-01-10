# Feature Specification: Proximity Radar

**Feature Branch**: `001-proximity-radar`  
**Created**: January 10, 2026  
**Status**: Draft  
**Input**: User description: "Build 'Proximity Radar', an app that helps friends bump into each other intentionally. Users can opt in to share their live location and get alerted when a friend enters a configurable radius. Core modes: OFF, Friends-only, Everyone. When ON, the app checks proximity continuously while open and alerts both parties when they newly enter the radius (avoid spamming). Users can add friends via a shareable friend code/invite link and can block/remove friends. The UI must make sharing state obvious (big ON/OFF). The app should work for a solo demo on a laptop: include a way to simulate location by manually setting coordinates for each 'user session' so I can demo two users in two browser windows. No map required for MVP; show a simple list of nearby matches with approximate distance (e.g., 'within 100m / 500m / 1km') and a timestamp of last update. Calendar feature (MVP-lite): Users can optionally connect a calendar and find mutual free time with a selected friend. The friend can choose to share full free/busy blocks or obfuscate to larger blocks (e.g., hour-granularity). Users can choose calendars to include/exclude (whitelist/blacklist concept) OR manually define recurring 'do not share' times. Output: show the next 7 days of mutual availability in 30-minute slots, plus a button to 'Create hold' on my own calendar (actual shared event creation can be optional). Include clear consent prompts and a safety warning: only share with trusted people; default to Friends-only and OFF."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Proximity Sharing and Detection (Priority: P1)

A user wants to enable location sharing so they can discover when friends are nearby, receive notifications when friends enter their radius, and see who is currently nearby.

**Why this priority**: This is the core value proposition of the app - enabling users to discover nearby friends. Without this, the app has no purpose.

**Independent Test**: Can be fully tested by enabling location sharing in Friends-only mode, simulating two users' locations within proximity range, and verifying both users receive alerts and see each other in their nearby list.

**Acceptance Scenarios**:

1. **Given** a user is logged in, **When** they toggle the sharing mode from OFF to Friends-only, **Then** the UI displays a prominent ON indicator and the app begins checking for nearby friends
2. **Given** sharing mode is ON in Friends-only mode, **When** a friend enters the configured radius for the first time, **Then** both users receive a one-time notification alerting them to proximity
3. **Given** sharing mode is ON, **When** a user views their app, **Then** they see a list of nearby friends with approximate distance (within 100m/500m/1km) and last update timestamp
4. **Given** two friends are within proximity, **When** they remain nearby, **Then** no additional notifications are sent (avoid spam)
5. **Given** sharing mode is ON, **When** user sets sharing mode to OFF, **Then** location sharing stops immediately and nearby list clears

---

### User Story 2 - Friend Management (Priority: P1)

A user wants to build their friend network by adding trusted contacts via friend codes or invite links, and manage their friend list by removing or blocking users.

**Why this priority**: Users must be able to add friends before proximity detection can work. This is a prerequisite for the core feature.

**Independent Test**: Can be fully tested by generating a friend code, sharing it with another user, having that user add via the code, and then removing/blocking the friend.

**Acceptance Scenarios**:

1. **Given** a user is logged in, **When** they generate a friend code or invite link, **Then** they can share it with others
2. **Given** a user receives a friend code/invite link, **When** they enter it in the app, **Then** they are added to the sender's friend list and vice versa
3. **Given** a user has friends, **When** they view their friend list, **Then** they see all added friends with status indicators
4. **Given** a user has a friend, **When** they remove that friend, **Then** both users stop appearing in each other's proximity detection
5. **Given** a user has a friend, **When** they block that friend, **Then** the blocked user cannot send friend requests again and both stop appearing in proximity detection

---

### User Story 3 - Location Simulation for Demo (Priority: P1)

A developer wants to demo the app on a single laptop by running multiple user sessions in different browser windows and manually setting coordinates for each session to simulate different locations.

**Why this priority**: This is essential for development, testing, and demonstration purposes. Without it, the app cannot be properly validated or demoed.

**Independent Test**: Can be fully tested by opening two browser windows, logging in as different users, manually setting different coordinates for each, and verifying proximity detection works based on simulated locations.

**Acceptance Scenarios**:

1. **Given** a user is in demo mode, **When** they manually enter latitude/longitude coordinates, **Then** the app uses those coordinates instead of device GPS
2. **Given** two browser windows with different user sessions, **When** coordinates are set within proximity range, **Then** both users detect each other as nearby
3. **Given** a user has manually set coordinates, **When** they update the coordinates, **Then** proximity calculations update immediately

---

### User Story 4 - Privacy and Sharing Modes (Priority: P2)

A user wants to control who can see their location by choosing between OFF, Friends-only, or Everyone modes, with clear consent prompts and safety warnings displayed before sharing begins.

**Why this priority**: Privacy controls are critical for user trust and safety. This enables users to feel comfortable using the app by controlling visibility.

**Independent Test**: Can be fully tested by switching between sharing modes and verifying that only appropriate users appear in proximity detection (friends vs everyone) with consent prompts shown at activation.

**Acceptance Scenarios**:

1. **Given** a new user, **When** they first attempt to enable sharing, **Then** they see a clear safety warning about only sharing with trusted people
2. **Given** a user is in OFF mode, **When** they switch to Friends-only, **Then** only friends who are also sharing can detect them
3. **Given** a user is in Friends-only mode, **When** they switch to Everyone mode, **Then** they see a consent prompt and any nearby users (regardless of friend status) who are in Everyone mode can detect them
4. **Given** a user, **When** they view the app, **Then** the current sharing state (OFF/Friends-only/Everyone) is prominently displayed

---

### User Story 5 - Configurable Proximity Radius (Priority: P2)

A user wants to customize the radius at which they are alerted about nearby friends to match their preferences (e.g., same building vs. same neighborhood).

**Why this priority**: Different users have different needs for proximity - some want alerts for very close proximity, others for broader areas. This enhances user experience but isn't blocking for basic functionality.

**Independent Test**: Can be fully tested by setting different radius values and verifying alerts trigger only when friends enter the configured distance.

**Acceptance Scenarios**:

1. **Given** a user is configuring settings, **When** they set a proximity radius (e.g., 100m, 500m, 1km), **Then** they only receive alerts when friends enter that specific radius
2. **Given** a user has set a radius, **When** a friend is beyond that radius, **Then** no alert is triggered even if sharing is ON
3. **Given** a user has set a small radius, **When** they increase it, **Then** existing nearby friends within the new radius trigger alerts

---

### User Story 6 - Mutual Calendar Availability (Priority: P3)

A user wants to connect their calendar and find mutual free time with a selected friend, with controls over which calendars to share and how much detail to reveal.

**Why this priority**: This is an additional convenience feature that enhances the app's value for coordinating meetups, but the core proximity detection works without it.

**Independent Test**: Can be fully tested by connecting a calendar, selecting a friend, choosing calendar sharing preferences, and viewing mutual availability in 30-minute slots over 7 days.

**Acceptance Scenarios**:

1. **Given** a user, **When** they connect their calendar, **Then** they can select which calendars to include or exclude from sharing
2. **Given** a user has connected their calendar, **When** they choose to share with a friend, **Then** they can choose between full free/busy detail or obfuscated hour-granularity blocks
3. **Given** both users have shared calendars, **When** one user views mutual availability with a friend, **Then** they see the next 7 days of mutual free time in 30-minute slots
4. **Given** a user is viewing mutual availability, **When** they select a time slot, **Then** they can create a calendar hold on their own calendar for that time
5. **Given** a user has calendar connected, **When** they define recurring "do not share" times, **Then** those time blocks do not appear as available to friends

---

### Edge Cases

- What happens when a user loses internet connection while sharing is ON? Location stops updating, and last known timestamp becomes stale. User should see a connection status indicator.
- How does the system handle two friends entering proximity simultaneously? Both receive alerts at approximately the same time.
- What happens when a user blocks someone who is currently nearby? The blocked user immediately disappears from their nearby list and vice versa.
- How does the system handle rapid location changes during demo (quickly updating coordinates)? Proximity recalculates immediately; duplicate alerts are suppressed within a cooldown period (e.g., 5 minutes).
- What happens when a user tries to add themselves via their own friend code? System rejects the request with an error message.
- How does calendar availability work if one friend shares full detail and the other shares obfuscated blocks? System shows availability at the coarsest granularity (obfuscated hour blocks).
- What happens when calendar permissions are revoked while viewing availability? System displays an error and prompts user to reconnect calendar.
- What happens if multiple browser windows are opened for the same user? System should maintain single session state or warn about conflicts.

## Requirements *(mandatory)*

### Functional Requirements

**Location Sharing & Proximity Detection**

- **FR-001**: System MUST allow users to toggle between three sharing modes: OFF, Friends-only, and Everyone
- **FR-002**: System MUST default to OFF mode for new users
- **FR-003**: System MUST display a prominent visual indicator showing the current sharing mode (OFF/Friends-only/Everyone)
- **FR-004**: System MUST continuously check proximity while sharing mode is ON and app is open
- **FR-005**: System MUST calculate distance between users' locations to determine if they are within the configured radius
- **FR-006**: System MUST send a one-time alert to both users when they newly enter proximity range
- **FR-007**: System MUST suppress duplicate proximity alerts for the same pair of users until they exit and re-enter the radius
- **FR-008**: System MUST display a list of currently nearby users/friends with approximate distance categories (within 100m, 500m, or 1km)
- **FR-009**: System MUST show the last update timestamp for each nearby user's location
- **FR-010**: System MUST allow users to configure their proximity radius threshold

**Friend Management**

- **FR-011**: System MUST generate a unique friend code or shareable invite link for each user
- **FR-012**: System MUST allow users to add friends by entering a friend code or clicking an invite link
- **FR-013**: System MUST establish bidirectional friendship when a friend code is successfully used
- **FR-014**: System MUST allow users to view their complete friend list
- **FR-015**: System MUST allow users to remove friends from their friend list
- **FR-016**: System MUST allow users to block specific users
- **FR-017**: System MUST prevent blocked users from sending new friend requests
- **FR-018**: System MUST stop all proximity detection between users when friendship is removed or blocked

**Demo & Testing Features**

- **FR-019**: System MUST provide a location simulation mode for demo purposes
- **FR-020**: System MUST allow manual entry of latitude and longitude coordinates in simulation mode
- **FR-021**: System MUST use simulated coordinates instead of device GPS when simulation mode is active
- **FR-022**: System MUST support multiple concurrent user sessions in different browser windows
- **FR-023**: System MUST recalculate proximity immediately when simulated coordinates are updated

**Privacy & Security**

- **FR-024**: System MUST display a safety warning on first-time sharing activation: "Only share your location with trusted people"
- **FR-025**: System MUST display a consent prompt when users switch to Everyone mode
- **FR-026**: System MUST restrict proximity detection in Friends-only mode to confirmed friends only
- **FR-027**: System MUST allow any users in Everyone mode to detect each other regardless of friend status
- **FR-028**: System MUST immediately stop location sharing when user switches to OFF mode
- **FR-029**: System MUST clear the nearby users list when sharing is turned OFF

**Calendar Integration**

- **FR-030**: System MUST allow users to optionally connect their calendar
- **FR-031**: System MUST allow users to select specific calendars to include or exclude from sharing
- **FR-032**: System MUST allow users to choose between full free/busy detail or obfuscated hour-granularity sharing
- **FR-033**: System MUST allow users to define recurring "do not share" time blocks
- **FR-034**: System MUST display the next 7 days of mutual availability in 30-minute time slots when both users share calendars
- **FR-035**: System MUST provide a "Create hold" button that adds a calendar hold on the user's own calendar
- **FR-036**: System MUST calculate mutual availability at the coarsest granularity when users share different detail levels

### Key Entities

- **User**: Represents an individual using the app with a unique identifier, friend code, friend list, block list, and current location (real or simulated)
- **Location**: Represents a geographical position with latitude, longitude, timestamp of last update, and whether it's simulated or real
- **Friendship**: Represents a bidirectional relationship between two users, established via friend code acceptance
- **Proximity Match**: Represents a detected proximity event between two users, including distance category, timestamp of detection, and alert status
- **Sharing Mode**: Represents the user's current privacy setting (OFF, Friends-only, Everyone) with associated visibility rules
- **Calendar Connection**: Represents a user's linked calendar with selected calendars to share, sharing detail level (full or obfuscated), and recurring exclusion blocks
- **Availability Slot**: Represents a 30-minute time block showing mutual free time between two users based on their calendar data

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can discover and receive alerts about nearby friends within 10 seconds of entering proximity range
- **SC-002**: Users can complete the friend-adding process (generate code, share, and confirm friendship) in under 2 minutes
- **SC-003**: Users can switch between sharing modes (OFF/Friends-only/Everyone) with immediate effect (within 2 seconds)
- **SC-004**: System displays current sharing state with 100% visibility (prominent ON/OFF indicator always visible on main screen)
- **SC-005**: Duplicate proximity alerts are suppressed with 100% accuracy (no spam alerts for users who remain nearby)
- **SC-006**: Demo mode allows successful demonstration of proximity detection with simulated locations for at least 2 concurrent users
- **SC-007**: Calendar mutual availability calculates and displays within 5 seconds for 7 days of data
- **SC-008**: 95% of users successfully understand the current sharing mode on first glance (via user testing)
- **SC-009**: Users can identify nearby friends and their approximate distance in under 5 seconds
- **SC-010**: Privacy warning is displayed to 100% of users before their first location sharing activation

## Assumptions

- Users have modern web browsers that support the necessary features for multi-window simulation
- Users understand basic concepts of GPS coordinates (latitude/longitude) for demo simulation mode
- Calendar integration will use standard calendar APIs (iCal format or similar industry-standard protocols)
- Network connectivity is reasonably stable for location updates (no offline mode required for MVP)
- Distance categories (100m, 500m, 1km) are sufficient granularity for MVP; exact distances not required
- "Friends-only" mode is the recommended default for most users balancing utility and privacy
- Alert suppression timeout (avoiding spam) uses a reasonable default of 5-10 minutes after initial alert
- Browser local storage or session storage is sufficient for demo mode to maintain multiple user sessions
- Users can be uniquely identified without complex authentication for MVP (simple user ID or session-based approach acceptable)
- Calendar "holds" are personal placeholders only; full shared event creation with the friend is deferred to post-MVP

## Scope Boundaries

### In Scope

- Three sharing modes: OFF, Friends-only, Everyone
- Friend management via codes/invite links with add, remove, and block capabilities
- Real-time proximity detection with configurable radius
- One-time alerts when friends enter proximity (no spam)
- Simple list view of nearby users with distance categories and timestamps
- Location simulation mode for demo purposes (manual coordinate entry)
- Calendar integration with mutual availability finder
- Calendar privacy controls (include/exclude calendars, full vs obfuscated detail, recurring exclusions)
- 7-day mutual availability view in 30-minute slots
- Personal calendar hold creation
- Safety warnings and consent prompts

### Out of Scope

- Map visualization (explicitly excluded from MVP)
- Exact distance calculations (approximate categories only)
- Full shared event creation with friends (only personal holds)
- Native mobile app (web-based for MVP)
- Offline functionality or location caching
- Background location tracking (only while app is open)
- Location history or past proximity events
- Group proximity detection (only 1-to-1)
- Chat or messaging features between nearby users
- Advanced calendar features beyond mutual availability
- Third-party calendar integration beyond standard protocols
- Complex authentication systems (basic user identification sufficient)

## Dependencies

- Access to user's location data (for non-demo mode, if implemented)
- Calendar API access for calendar integration feature
- Browser support for multiple concurrent sessions (separate windows/tabs)
- Network connectivity for proximity matching and notifications

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
| ---- | ------ | ---------- | ---------- |
| Privacy concerns about continuous location sharing | High | High | Clear warnings, default to OFF, prominent sharing state indicator, Friends-only recommended mode |
| Alert spam if proximity detection triggers repeatedly | Medium | Medium | Implement alert suppression with cooldown period after initial notification |
| Demo mode confusion (users don't understand coordinate simulation) | Low | Medium | Provide clear UI labeling for demo mode and example coordinates |
| Calendar permissions revoked during use | Medium | Low | Handle permission errors gracefully with re-connection prompts |
| Multiple browser windows for same user causing conflicts | Medium | Medium | Document single-session-per-user requirement or implement session conflict detection |
| Friend code sharing via insecure channels | Medium | High | Include warnings about sharing codes only with trusted individuals |
| Users accidentally enabling Everyone mode | High | Low | Require explicit consent prompt with clear explanation when switching to Everyone mode |
