# Beepd - 90-Second Demo Script

**Date**: January 10, 2026  
**Purpose**: Rapid demo showing two users meeting via location simulation  
**Method**: One laptop, two browser windows OR curl commands

---

## 🎬 90-Second Demo Script (Browser Method)

**Setup**: Open two browser windows (Chrome normal + Chrome incognito)

| Time | Window | Action | Expected Result |
|------|--------|--------|----------------|
| **0:00** | Both | Navigate to `http://localhost:5173` | Auto-registration, see User IDs + Friend Codes |
| **0:15** | Window 1 | Copy Friend Code (e.g., `ABC123XY`) | Code copied to clipboard |
| **0:20** | Window 2 | Friends → Add Friend → Paste code → Submit | "Alice added as friend" |
| **0:30** | Both | Home → Toggle "OFF" → "FRIENDS" mode | Big 🟢 ON indicator appears |
| **0:40** | Window 1 | Simulate Location: `37.7955, -122.3937` (SF Embarcadero) | "Location updated" confirmation |
| **0:50** | Window 2 | Simulate Location: `37.7955, -122.3940` (SF Ferry, ~300m away) | "Location updated" confirmation |
| **1:00** | Both | Wait 10 seconds for polling... | 🎉 Proximity alerts fire! |
| **1:10** | Both | Check "Nearby Friends" list | See each other: "Very Close (<500m)" |
| **1:30** | Demo End | Both users see proximity alerts and nearby list | ✅ Success! |

**Demo Punchline**: "Two friends can now bump into each other intentionally by sharing their real-time location. No more missed connections!"

---

## 🔧 API Method (Curl Commands)

Use this for testing without UI or for automated verification.

### 1. Register Two Users (15 seconds)

**Alice**:
```bash
curl -X POST http://localhost:8787/auth/register \
  | jq -r '{userId, token, friendCode, deviceSecret}'

# Save output:
# ALICE_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI..."
# ALICE_CODE="ABC123XY"
```

**Bob**:
```bash
curl -X POST http://localhost:8787/auth/register \
  | jq -r '{userId, token, friendCode, deviceSecret}'

# Save output:
# BOB_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI..."
# BOB_CODE="XYZ789AB"
```

---

### 2. Make Alice and Bob Friends (10 seconds)

**Bob adds Alice**:
```bash
curl -X POST http://localhost:8787/friends/invite/accept \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"friendCode": "ABC123XY"}'
```

**Expected Response**:
```json
{
  "success": true,
  "friendship": {
    "friendId": 1,
    "displayName": "User #1",
    "friendCode": "ABC123XY",
    "createdAt": "2026-01-10T11:00:00Z"
  }
}
```

---

### 3. Enable Location Sharing (10 seconds)

**Alice enables FRIENDS mode**:
```bash
curl -X PUT http://localhost:8787/me/settings \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "FRIENDS", "radiusMeters": 1000, "displayName": "Alice"}'
```

**Bob enables FRIENDS mode**:
```bash
curl -X PUT http://localhost:8787/me/settings \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "FRIENDS", "radiusMeters": 1000, "displayName": "Bob"}'
```

---

### 4. Force an Encounter (Update Locations) (20 seconds)

**Alice shares location (SF Embarcadero)**:
```bash
curl -X PUT http://localhost:8787/me/location \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7955,
    "longitude": -122.3937,
    "accuracy": 10,
    "isSimulated": true
  }'
```

**Bob shares location (SF Ferry Building, ~300m away)**:
```bash
curl -X PUT http://localhost:8787/me/location \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7955,
    "longitude": -122.3940,
    "accuracy": 10,
    "isSimulated": true
  }'
```

**Expected Response** (both):
```json
{
  "success": true,
  "location": {
    "latitude": 37.7955,
    "longitude": -122.3940,
    "updatedAt": "2026-01-10T11:01:00Z"
  }
}
```

---

### 5. Check Proximity Alerts (15 seconds)

**Alice checks nearby friends**:
```bash
curl -X GET http://localhost:8787/nearby \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

**Expected Response** (Alice sees Bob):
```json
{
  "nearby": [
    {
      "userId": 2,
      "displayName": "Bob",
      "distance": 333,
      "category": "VERY_CLOSE",
      "lastSeen": "2026-01-10T11:01:00Z"
    }
  ],
  "newAlerts": [
    {
      "userId": 2,
      "displayName": "Bob",
      "message": "Bob is nearby (within 500m)!",
      "triggeredAt": "2026-01-10T11:01:00Z"
    }
  ]
}
```

**Bob checks nearby friends**:
```bash
curl -X GET http://localhost:8787/nearby \
  -H "Authorization: Bearer $BOB_TOKEN"
```

**Expected Response** (Bob sees Alice):
```json
{
  "nearby": [
    {
      "userId": 1,
      "displayName": "Alice",
      "distance": 333,
      "category": "VERY_CLOSE",
      "lastSeen": "2026-01-10T11:01:00Z"
    }
  ],
  "newAlerts": [
    {
      "userId": 1,
      "displayName": "Alice",
      "message": "Alice is nearby (within 500m)!",
      "triggeredAt": "2026-01-10T11:01:00Z"
    }
  ]
}
```

---

## ✅ 5-Step Manual Verification Checklist

Use this to verify the demo worked correctly:

### Step 1: Registration & Authentication ✓
- [ ] Two users registered successfully
- [ ] Each user received unique `userId`, `token`, and `friendCode`
- [ ] JWTs are valid (not expired, can make authenticated requests)

**Verify**:
```bash
# Should return 200 with user settings
curl -X GET http://localhost:8787/me/settings \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

---

### Step 2: Friend Relationship Created ✓
- [ ] Bob successfully added Alice via friend code
- [ ] Friendship is bidirectional (both see each other in friend list)
- [ ] Friend codes are 8 characters and unique

**Verify**:
```bash
# Alice's friend list should include Bob
curl -X GET http://localhost:8787/friends \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.friends'

# Bob's friend list should include Alice
curl -X GET http://localhost:8787/friends \
  -H "Authorization: Bearer $BOB_TOKEN" | jq '.friends'
```

**Expected**: Both arrays contain 1 friend each (mutual).

---

### Step 3: Location Sharing Enabled ✓
- [ ] Both users set mode to "FRIENDS"
- [ ] Settings persisted in database
- [ ] Radius configured (default 1000m)

**Verify**:
```bash
# Check Alice's settings
curl -X GET http://localhost:8787/me/settings \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.mode'

# Should return: "FRIENDS"
```

---

### Step 4: Proximity Detection Working ✓
- [ ] Haversine distance calculated correctly (~333 meters between test coords)
- [ ] Both users appear in each other's "nearby" list
- [ ] Distance category is "VERY_CLOSE" (<500m)
- [ ] Proximity alert triggered (OUT→IN transition)

**Verify**:
```bash
# Check proximity matching
curl -X GET http://localhost:8787/nearby \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '{nearbyCount: .nearby | length, hasAlerts: (.newAlerts | length > 0)}'

# Expected: {"nearbyCount": 1, "hasAlerts": true}
```

**Manual Calculation** (Haversine):
- Alice: `37.7955, -122.3937`
- Bob: `37.7955, -122.3940`
- Distance: ~333 meters ✓

---

### Step 5: Alert Suppression (No Spam) ✓
- [ ] Proximity alert fires once on initial encounter
- [ ] Subsequent polling requests do NOT trigger new alerts (while staying nearby)
- [ ] `newAlerts` array is empty on second call

**Verify**:
```bash
# First call: newAlerts should have entries
curl -X GET http://localhost:8787/nearby \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.newAlerts | length'
# Expected: 1

# Wait 15 seconds, call again (without moving)
sleep 15
curl -X GET http://localhost:8787/nearby \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.newAlerts | length'
# Expected: 0 (alert suppression working)
```

---

## 🎯 Quick Test Scenarios

### Scenario A: Force Proximity Alert (On Demand)

**Goal**: Trigger a proximity alert between two users instantly.

```bash
# 1. Register users (if not already)
ALICE_TOKEN=$(curl -s -X POST http://localhost:8787/auth/register | jq -r '.token')
BOB_TOKEN=$(curl -s -X POST http://localhost:8787/auth/register | jq -r '.token')

# 2. Make them friends (use Alice's friendCode from registration)
ALICE_CODE=$(curl -s -X POST http://localhost:8787/auth/register | jq -r '.friendCode')
curl -X POST http://localhost:8787/friends/invite/accept \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"friendCode\": \"$ALICE_CODE\"}"

# 3. Enable sharing
curl -X PUT http://localhost:8787/me/settings \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "FRIENDS"}'

curl -X PUT http://localhost:8787/me/settings \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "FRIENDS"}'

# 4. Place both users VERY close (same intersection)
curl -X PUT http://localhost:8787/me/location \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7955, "longitude": -122.3937, "isSimulated": true}'

curl -X PUT http://localhost:8787/me/location \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7955, "longitude": -122.3940, "isSimulated": true}'

# 5. Verify alert (should see newAlerts array with 1 entry)
curl -X GET http://localhost:8787/nearby \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.newAlerts'
```

---

### Scenario B: Test Different Distance Categories

**Distance Categories**:
- **VERY_CLOSE**: < 500m
- **CLOSE**: 500m - 1000m
- **NEARBY**: 1000m - 2000m
- **FAR**: > 2000m (no match if radius is 1km)

**Example Coordinates** (from SF Embarcadero):

| Location | Lat | Lng | Distance from Embarcadero |
|----------|-----|-----|---------------------------|
| Embarcadero (Base) | 37.7955 | -122.3937 | 0m |
| Ferry Building | 37.7955 | -122.3940 | ~300m (VERY_CLOSE) |
| Pier 39 | 37.8087 | -122.4098 | ~1.8km (NEARBY) |
| Golden Gate Bridge | 37.8199 | -122.4783 | ~9km (no match) |

**Test**:
```bash
# Alice at Embarcadero
curl -X PUT http://localhost:8787/me/location \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7955, "longitude": -122.3937, "isSimulated": true}'

# Bob at Pier 39 (~1.8km away)
curl -X PUT http://localhost:8787/me/location \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.8087, "longitude": -122.4098, "isSimulated": true}'

# Check Alice's nearby list
curl -X GET http://localhost:8787/nearby \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.nearby[0].category'
# Expected: "NEARBY"
```

---

### Scenario C: Test Alert Re-Triggering (OUT→IN)

**Goal**: Verify alert fires again when user leaves and returns.

```bash
# 1. Start nearby (alert fires)
curl -X PUT http://localhost:8787/me/location \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7955, "longitude": -122.3940, "isSimulated": true}'

curl -X GET http://localhost:8787/nearby \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.newAlerts | length'
# Expected: 1

# 2. Bob moves far away (OUT state)
curl -X PUT http://localhost:8787/me/location \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 40.7580, "longitude": -73.9855, "isSimulated": true}'

curl -X GET http://localhost:8787/nearby \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.nearby | length'
# Expected: 0 (Bob disappeared)

# 3. Bob returns (IN state again)
curl -X PUT http://localhost:8787/me/location \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7955, "longitude": -122.3940, "isSimulated": true}'

curl -X GET http://localhost:8787/nearby \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.newAlerts | length'
# Expected: 1 (NEW alert triggered!)
```

---

## 🐛 Troubleshooting

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| `401 Unauthorized` | Invalid or expired JWT | Re-register or login with device secret |
| `nearby` array is empty | Users not friends OR wrong mode OR too far | Verify friendship, check mode is "FRIENDS", reduce distance |
| `newAlerts` always empty | Alert already fired, need OUT→IN transition | Move Bob far away (>2km), then back close |
| Distance calculation wrong | Lat/lng swapped or wrong format | Verify latitude is ~37, longitude is ~-122 for SF |
| Backend not responding | Wrangler not running | Run `wrangler dev` in backend/ directory |

---

## 📊 Success Criteria

**Demo is successful if**:
- ✅ Two users registered in <15 seconds
- ✅ Friend relationship established via invite code
- ✅ Both users enabled location sharing
- ✅ Proximity alert fired when locations placed <1km apart
- ✅ `nearby` list shows both users with correct distance category
- ✅ Alert does NOT fire again when staying nearby (spam prevention)
- ✅ Alert DOES fire again after OUT→IN transition

**Time**: Total demo should complete in 90 seconds with practice.

---

**Demo Script End** - Ready for presentation! 🚀
