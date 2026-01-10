# Sample Testing Guide

This guide shows you how to test Proximity Radar with pre-created sample users at fixed distances.

## Testing Approach

Since testing on a single device shows both users at the same location, use **Browser Location Simulation** to place users at different coordinates.

## Sample Test Users

### Test Setup: 3 Friends + 2 Strangers

**Base Location**: Vancouver Convention Centre  
📍 `49.2891° N, 123.1112° W`

| User | Role | Distance | Coordinates | Mode | Display Name |
|------|------|----------|-------------|------|--------------|
| **You** | Main User | 0m | `49.2891, -123.1112` | EVERYONE | Alice |
| User 2 | Friend | ~150m | `49.2905, -123.1112` | FRIENDS | Bob |
| User 3 | Friend | ~450m | `49.2932, -123.1112` | FRIENDS | Charlie |
| User 4 | Friend | ~850m | `49.2968, -123.1112` | FRIENDS | Dana |
| User 5 | Non-Friend | ~300m | `49.2918, -123.1112` | EVERYONE | Eve |
| User 6 | Non-Friend | ~600m | `49.2945, -123.1112` | EVERYONE | Frank |

### Coordinate Offsets (for manual testing)

**Latitude change = ~111m per 0.001°**  
**Longitude change at Vancouver = ~78m per 0.001°**

- **100m north**: Add 0.0009 to latitude
- **250m north**: Add 0.0022 to latitude
- **500m north**: Add 0.0045 to latitude
- **1000m north**: Add 0.0090 to latitude

## Quick Setup (Automated)

### Option 1: Auto-Register Script (Recommended)

```bash
# Make sure backend is running on port 8787
./setup-sample-users.sh
```

This script will:
- ✅ Register all 6 users (Alice, Bob, Charlie, Dana, Eve, Frank)
- ✅ Set display names and modes
- ✅ Set locations at fixed distances
- ✅ Create friendships between Alice and Bob/Charlie/Dana
- ✅ Save credentials to `sample_users_credentials.txt`

**Then just login:**

1. Open <http://localhost:5174>
2. Paste Alice's Device Secret (shown in script output)
3. Click "Login"
4. **IMPORTANT**: Simulate browser location to `49.2891, -123.1112` (see instructions below)
5. Done! View Friends/Everyone tabs to see all users

### Simulating Browser Location

The frontend uses `navigator.geolocation` to get your location. You MUST simulate your browser location to match Alice's coordinates:

#### Chrome/Edge:
1. Open DevTools (F12)
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "sensors" → Select "Show Sensors"
4. In the Sensors tab, find "Location"
5. Select "Other..." from dropdown
6. Enter Alice's coordinates:
   - **Latitude**: `49.2891`
   - **Longitude**: `-123.1112`
7. Refresh the page

#### Firefox:
1. Type `about:config` in address bar
2. Search for `geo.enabled` → Set to `true`
3. Install extension like "Location Guard" to set custom location
4. Set to: `49.2891, -123.1112`

After setting location, the Home page will show nearby users at their correct distances!

### Option 2: Manual Setup

If you prefer to set up manually:

## Step-by-Step Testing

### 1. Register Users (5 Browser Windows)

Open 5 browser windows in **Incognito/Private mode**:

```bash
# Window 1 - Alice (You)
http://localhost:5174

# Window 2 - Bob
http://localhost:5174

# Window 3 - Charlie  
http://localhost:5174

# Window 4 - Dana
http://localhost:5174

# Window 5 - Eve
http://localhost:5174
```

### 2. Configure Each User

**Window 1 - Alice (You)**
1. Click "Register"
2. Copy Friend Code (e.g., `A3K9F2M1`)
3. Settings → Display Name: `Alice`
4. Settings → Mode: `EVERYONE`
5. Settings → Show friends on map: `ON`
6. Settings → Radius: `1000m`
7. Click Browser Location button → Simulate Location
8. Enter: `49.2891, -123.1112`

**Window 2 - Bob**
1. Register → Copy Friend Code
2. Settings → Display Name: `Bob`
3. Settings → Mode: `FRIENDS`
4. Friends → Add Alice's friend code
5. Location → `49.2905, -123.1112` (150m north)

**Window 3 - Charlie**
1. Register → Copy Friend Code
2. Settings → Display Name: `Charlie`
3. Settings → Mode: `FRIENDS`
4. Friends → Add Alice's friend code
5. Location → `49.2932, -123.1112` (450m north)

**Window 4 - Dana**
1. Register → Copy Friend Code
2. Settings → Display Name: `Dana`
3. Settings → Mode: `FRIENDS`
4. Friends → Add Alice's friend code
5. Location → `49.2968, -123.1112` (850m north)

**Window 5 - Eve**
1. Register → Copy Friend Code
2. Settings → Display Name: `Eve`
3. Settings → Mode: `EVERYONE`
4. Settings → Show friends on map: `ON`
5. Location → `49.2918, -123.1112` (300m north)

**Don't forget**: Alice must also add Bob, Charlie, and Dana as friends!

### 3. Expected Results

#### Alice's View (Window 1)

**Friends Tab (Radar/Map/List)**
- ✅ Bob (150m) - Green marker
- ✅ Charlie (450m) - Green marker  
- ✅ Dana (850m) - Green marker

**Everyone Tab (Radar/Map/List)**
- 🟢 Bob (150m) - Green marker (friend)
- 🟢 Charlie (450m) - Green marker (friend)
- 🟢 Dana (850m) - Green marker (friend)
- 🔵 Eve (300m) - Blue marker (non-friend)

**Map View Clustering**
- If zoomed out: 4-5 people cluster → 🟠 Orange marker
- If zoomed in: Individual markers

#### Bob's View (Window 2)

**Friends Tab**
- ✅ Alice (150m away)
- Other friends not visible (different mode/out of range)

**Everyone Tab**
- Empty (Bob is in FRIENDS mode, not EVERYONE)

## Testing Checklist

- [ ] Friends appear in Friends tab with correct distances
- [ ] Friends have **green markers** on map
- [ ] Non-friends have **blue markers** on map  
- [ ] Clusters with 3+ people show **orange markers**
- [ ] Everyone tab includes both friends (green) and non-friends (blue)
- [ ] Distance displays correctly (exact or "1000+" if out of radius)
- [ ] Radar view shows bearings correctly
- [ ] Map clusters expand on click
- [ ] List view shows Friend badge for friends

## Common Issues

### Issue: Both users show at same location
**Solution**: Use browser location simulation with different coordinates

### Issue: Friends don't appear in Everyone tab
**Solution**: Check that both users have `mode=EVERYONE` and `showFriendsOnMap=true`

### Issue: Cluster markers are blue instead of orange
**Solution**: Zoom out to create clusters of 3+ people

### Issue: Can't add friend
**Solution**: Make sure to copy the EXACT friend code (case-sensitive)

## Quick Test Script

For rapid testing, use this curl script to create users:

```bash
# Register Alice
curl -X POST http://localhost:8787/auth/register

# Register Bob  
curl -X POST http://localhost:8787/auth/register

# Register Charlie
curl -X POST http://localhost:8787/auth/register

# Update Alice's location
curl -X PUT http://localhost:8787/me/location \
  -H "Authorization: Bearer <ALICE_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 49.2891, "longitude": -123.1112}'

# Update Bob's location (150m north)
curl -X PUT http://localhost:8787/me/location \
  -H "Authorization: Bearer <BOB_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 49.2905, "longitude": -123.1112}'
```

## Notes

- Simulated locations persist per browser window
- Real device locations will override simulated ones
- Refresh the page after updating settings
- Locations expire after 24 hours
