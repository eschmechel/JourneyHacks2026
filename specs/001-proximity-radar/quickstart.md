# Quickstart Guide: Proximity Radar Demo

**Purpose**: Step-by-step guide for demonstrating Proximity Radar using two browser windows on a single laptop.  
**Time**: 10-15 minutes  
**Prerequisites**: Backend deployed, frontend running

---

## Overview

This guide walks you through a complete demo showcasing:
1. Device registration for two users (Alice & Bob)
2. Friend connection via invite codes
3. Location simulation to trigger proximity alerts
4. Calendar mutual availability (optional)

**Demo Setup**: Two browser windows/profiles simulate two users in different physical locations.

---

## Prerequisites

### 1. Backend Running

Ensure Cloudflare Workers backend is deployed or running locally:

```bash
cd backend
npm install
wrangler dev
# Should output: ⚡ Listening on http://localhost:8787
```

### 2. Frontend Running

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
# Should output: Local: http://localhost:5173
```

### 3. Database Initialized

Run D1 migrations:

```bash
cd backend
wrangler d1 migrations apply proximity-radar-db
```

---

## Demo Script

### Step 1: Open Two Browser Windows

**Option A - Chrome Profiles** (Recommended):
1. Open Chrome normally (this will be "Alice")
2. Open Chrome Incognito window (`Cmd+Shift+N` / `Ctrl+Shift+N`) (this will be "Bob")

**Option B - Different Browsers**:
- Use Chrome for Alice, Firefox for Bob

**Why?**: Each browser/profile maintains separate localStorage, simulating two devices.

---

### Step 2: Register Alice (Window 1)

1. Navigate to `http://localhost:5173` in Window 1
2. Click **"Get Started"** or the app auto-registers
3. You should see:
   - **User ID**: e.g., `42`
   - **Friend Code**: e.g., `ABC123XY`
   - **Sharing Mode**: `OFF` (default)

4. **Optional**: Set display name to "Alice"
   - Go to Settings → Enter "Alice" → Save

5. **Copy Friend Code**: Save `ABC123XY` to share with Bob

---

### Step 3: Register Bob (Window 2)

1. Navigate to `http://localhost:5173` in Window 2 (Incognito)
2. Click **"Get Started"**
3. You should see:
   - **User ID**: e.g., `99` (different from Alice)
   - **Friend Code**: e.g., `XYZ789AB`
   - **Sharing Mode**: `OFF`

4. **Optional**: Set display name to "Bob"

---

### Step 4: Add Alice as Bob's Friend

**In Window 2 (Bob's window)**:

1. Navigate to **Friends** tab/page
2. Click **"Add Friend"**
3. Paste Alice's friend code: `ABC123XY`
4. Click **"Send Invite"**

**Expected Result**:
- Bob's friend list shows "Alice" (or user ID 42)
- Alice's friend list automatically shows "Bob" (bidirectional)

**Verify in Window 1 (Alice)**:
- Refresh or navigate to Friends page
- Should see Bob in the list

---

### Step 5: Enable Location Sharing (Both Users)

**In Window 1 (Alice)**:
1. Go to **Home** screen
2. Toggle sharing mode: `OFF` → `FRIENDS`
3. **Important**: Accept the privacy warning if shown

**In Window 2 (Bob)**:
1. Go to **Home** screen
2. Toggle sharing mode: `OFF` → `FRIENDS`

**Expected Result**:
- Both windows show big **🟢 ON** indicator
- Mode badge shows "FRIENDS-ONLY"

---

### Step 6: Simulate Locations (Demo Mode)

**Key Concept**: Since you're on a laptop, use manual coordinate override to simulate different locations.

#### Set Alice's Location (Window 1)

1. Click **"📍 Simulate Location"** button (or similar control)
2. Enter coordinates for **San Francisco (Embarcadero)**:
   - **Latitude**: `37.7955`
   - **Longitude**: `-122.3937`
3. Click **"Update Location"**

**Expected Result**:
- Confirmation: "Location updated"
- Map marker or status shows "San Francisco"

#### Set Bob's Location (Window 2)

**Scenario 1: Bob is FAR from Alice** (no proximity match)

1. Enter coordinates for **New York (Times Square)**:
   - **Latitude**: `40.7580`
   - **Longitude**: `-73.9855`
2. Click **"Update Location"**

**Expected Result**:
- Both windows show **"No nearby friends"**
- No alerts triggered

**Scenario 2: Bob moves CLOSE to Alice** (proximity match!)

1. **In Window 2 (Bob)**, update location to **San Francisco (Ferry Building)** ~300m from Alice:
   - **Latitude**: `37.7955`
   - **Longitude**: `-122.3940`
2. Click **"Update Location"**

**Expected Result**:
- ✅ **Window 1 (Alice)**: Shows "Bob is nearby (within 500m)" + notification
- ✅ **Window 2 (Bob)**: Shows "Alice is nearby (within 500m)" + notification
- Both see each other in the **"Nearby Friends"** list

---

### Step 7: Test Proximity Alert Suppression

**Keep Bob's location the same** (stay near Alice):

1. **In Window 2 (Bob)**, wait 10 seconds (polling interval)
2. Location auto-updates via polling

**Expected Result**:
- ✅ **No new alerts** (spam prevention working)
- Both users still see each other in "Nearby" list
- Last update timestamp refreshes

---

### Step 8: Test "Leaving Radius" and Re-Entry

**Bob moves far away**:

1. **In Window 2 (Bob)**, update location to **Oakland** ~10km away:
   - **Latitude**: `37.8044`
   - **Longitude**: `-122.2712`
2. Click **"Update Location"**

**Expected Result**:
- ✅ Bob disappears from Alice's "Nearby" list
- ✅ Alice disappears from Bob's "Nearby" list
- No new alerts (exiting radius is silent)

**Bob returns to Alice**:

1. **In Window 2**, update location back to Ferry Building:
   - **Latitude**: `37.7955`
   - **Longitude**: `-122.3940`
2. Click **"Update Location"**

**Expected Result**:
- ✅ **NEW proximity alerts** fire again (OUT → IN transition detected)
- Both see each other in "Nearby" list

---

### Step 9: Test Sharing Mode Changes

**Alice switches to OFF** (panic stop):

1. **In Window 1 (Alice)**, toggle mode: `FRIENDS` → `OFF`

**Expected Result**:
- ✅ Alice's location deleted immediately from backend
- ✅ Bob's window shows "No nearby friends" (Alice disappeared)
- ✅ Alice's UI shows big **🔴 OFF** indicator

**Alice re-enables**:

1. Toggle mode: `OFF` → `FRIENDS`
2. **Important**: Must re-enter location (it was deleted)
3. Simulate Alice's location again: `37.7955, -122.3937`

**Expected Result**:
- Proximity match resumes if Bob is still nearby

---

### Step 10: Test Blocking (Optional)

**Alice blocks Bob**:

1. **In Window 1 (Alice)**, go to Friends list
2. Click on Bob → **"Block User"**

**Expected Result**:
- ✅ Bob removed from Alice's friend list
- ✅ Alice removed from Bob's friend list (symmetric)
- ✅ Bob disappears from Alice's "Nearby" list (even if he's still close)
- ✅ Alice disappears from Bob's "Nearby" list

---

## Calendar Demo (Optional)

**Prerequisites**: Google OAuth client credentials configured in backend.

### Step 11: Connect Calendar (Alice)

1. **In Window 1 (Alice)**, go to **Calendar** tab
2. Click **"Connect Google Calendar"**
3. Follow OAuth flow:
   - Sign in with Google
   - Accept calendar read permissions
4. Redirect back to app

**Expected Result**:
- Calendar status shows "Connected ✓"
- Can select which calendars to share

### Step 12: Configure Calendar Sharing

1. **Select calendars**: Check "Primary" calendar
2. **Obfuscation mode**: Choose "Full detail" or "Hourly blocks"
3. Click **"Save Settings"**

### Step 13: View Mutual Availability with Bob

**In Window 1 (Alice)**:

1. Go to Friends → Click on Bob
2. Click **"View Availability"**

**Expected Result** (if Bob also connected calendar):
- Shows next 7 days in a grid
- Green slots = both free
- Red/gray slots = one or both busy

**If Bob hasn't connected calendar**:
- Shows message: "Bob hasn't shared their calendar"

### Step 14: Create Calendar Hold

1. **In Window 1 (Alice)**, click on a green (free) time slot
2. Click **"Create Hold"**
3. Confirm

**Expected Result**:
- Personal calendar event created in Alice's Google Calendar
- Slot turns red (now busy)
- **Note**: Bob doesn't automatically get the event (MVP limitation)

---

## Troubleshooting

### "No nearby friends" even when close

**Check**:
1. Both users have sharing mode ON (not OFF)
2. Both users are friends (check Friends list)
3. Coordinates are actually close (<500m by default)
4. Location updated in last 2 minutes (check timestamp)
5. No blocking between users

**Debug Command** (backend logs):
```bash
wrangler tail
# Watch for /nearby endpoint calls and distance calculations
```

### Alerts not firing

**Check**:
1. Proximity state might be cached as "IN" (wait 5 minutes for TTL expiry)
2. Move far away (>1km), wait 15 seconds, then move close again
3. Check browser console for polling errors

### Calendar not connecting

**Check**:
1. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set in wrangler.toml
2. OAuth redirect URI matches: `http://localhost:8787/calendar/google/callback`
3. Google Cloud Console: OAuth consent screen configured

---

## Demo Talking Points

Use these narratives when demonstrating:

### Privacy Focus
> "Notice the sharing mode defaults to OFF. Users must explicitly enable location sharing, and they can hit 'panic stop' anytime to delete their location immediately."

### Friend-First Design
> "In FRIENDS mode, only people you've explicitly added see your location. This isn't a public broadcast—it's intentional connection with trusted friends."

### No Spam Alerts
> "See how we only get one alert when Bob enters Alice's radius? The system tracks proximity state, so you won't get spammed with notifications while your friend grabs coffee nearby."

### Hackathon-Ready Architecture
> "This entire demo runs on Cloudflare's free tier—edge Workers for the API, D1 for data, Pages for the frontend. Zero server management, global low latency, and near-zero cost."

### Calendar Privacy
> "For calendar sharing, we only fetch busy/free blocks—never event titles or details. And users can choose hourly obfuscation if they want coarser granularity."

---

## Common Test Coordinates

For quick copy-paste during demos:

| Location | Latitude | Longitude | Distance from SF Embarcadero |
|----------|----------|-----------|------------------------------|
| SF Embarcadero | 37.7955 | -122.3937 | 0m (origin) |
| SF Ferry Building | 37.7955 | -122.3940 | ~300m |
| SF Chinatown | 37.7941 | -122.4078 | ~900m |
| SF Mission | 37.7599 | -122.4148 | ~3km (out of range) |
| Oakland Downtown | 37.8044 | -122.2712 | ~10km (far away) |
| NYC Times Square | 40.7580 | -73.9855 | ~4,000km (very far) |

**Tip**: Use SF Embarcadero ↔ SF Ferry Building for "nearby" tests (within 500m).

---

## Post-Demo Cleanup

**Reset Demo State**:

```bash
# Drop and recreate D1 database
cd backend
wrangler d1 execute proximity-radar-db --command="DROP TABLE users; DROP TABLE locations; DROP TABLE friendships; DROP TABLE blocked_users; DROP TABLE proximity_events; DROP TABLE calendar_tokens; DROP TABLE calendar_exclusions;"

# Re-run migrations
wrangler d1 migrations apply proximity-radar-db
```

**Clear Browser State**:
- Close all browser windows
- Open fresh windows for next demo

---

## Time Estimates

| Section | Time |
|---------|------|
| Setup (Steps 1-3) | 2 min |
| Friend connection (Step 4) | 1 min |
| Proximity demo (Steps 5-8) | 5 min |
| Mode changes & blocking (Steps 9-10) | 2 min |
| Calendar integration (Steps 11-14) | 3 min |
| **Total** | **~13 minutes** |

**Minimal Demo** (no calendar): ~8 minutes

---

## Success Checklist

- [ ] Two browser windows registered as different users
- [ ] Friend relationship established bidirectionally
- [ ] Proximity alert fired when users entered radius
- [ ] Alert suppression working (no spam when staying nearby)
- [ ] Re-entry alert fired after leaving and returning
- [ ] OFF mode deletes location immediately
- [ ] Blocking prevents proximity detection
- [ ] Calendar connection successful (optional)
- [ ] Mutual availability displayed (optional)

---

**Demo Tips**:
- Keep coordinate cheat sheet visible for quick updates
- Narrate privacy features ("notice the default is OFF")
- Show the big ON/OFF toggle prominently
- Emphasize the hackathon speed: "Built in 12 hours on Cloudflare"

**Ready to present!** 🚀
