# Alice Demo Mode

This document describes the Alice demo mode feature for easy testing without API calls or real location data.

## How to Use

1. Start the frontend: `./start-frontend.sh`
2. Navigate to the login page
3. Click "Use Alice Demo Account" button (or enter device secret: `847bdc04-f607-4774-9646-5cd2318a2e83`)
4. You're now logged in as Alice with mock data

## Demo Features

- **No API Calls**: All data stored in localStorage
- **Mock Friends**: Hardcoded friend data with specific locations
- **Settings Persistence**: Settings saved locally and persist across refreshes
- **Add/Remove Friends**: Test friend management without backend

## Available Friend Codes

You can add these friends using their friend codes:

| Friend Code | Display Name | Mode | Distance from Alice | Status |
|------------|--------------|------|---------------------|--------|
| `BOB123` | Bob | Friends Only | 150m (NW) | Default friend |
| `CHARLIE` | Charlie | Friends Only | 450m (NE) | Default friend |
| `DANA456` | Dana | Friends Only | 850m (E) | Default friend |
| `EVE789` | Eve | Everyone | 300m (S) | Not added by default |
| `FRANK01` | Frank | Everyone | 600m (W) | Not added by default |

### Mode Indicators

- **🟢 Everyone Mode**: User is visible to all nearby users
- **🟡 Friends Only**: User is visible only to their friends
- **⚫ Off**: User is not sharing location (not visible)

## Testing Friend Management

### Add a Friend
1. Go to Friends page
2. Enter a friend code (e.g., `EVE789` or `FRANK01`)
3. Click "Send Request"
4. Friend is added immediately (no approval needed in demo mode)

### Remove a Friend
1. Go to Friends page
2. Click "Remove" button next to any friend
3. Confirm the removal
4. Friend is removed and can be re-added using their friend code

### View Friends on Map/Radar
1. Go to Home page
2. Switch to "Friends" tab to see only friends
3. Switch to "Everyone" tab to see all nearby users
4. Friends appear in green, non-friends in blue
5. Adjust radius in Settings to filter visibility

## Location Data

Alice's location: Vancouver Convention Centre (49.2891, -123.1112)

Friend positions relative to Alice:
- **Bob**: 150m Northwest (350° bearing)
- **Charlie**: 450m Northeast (15° bearing)
- **Dana**: 850m East (85° bearing)
- **Eve**: 300m South (180° bearing)
- **Frank**: 600m West (270° bearing)

## Resetting Demo Data

To reset Alice's friends to defaults:
```bash
./setup-sample-users.sh
```

This script clears Alice's localStorage and resets:
- Friends list (Bob, Charlie, Dana)
- Settings to defaults
- Location data

## Demo Mode Limitations

- Cannot send real friend requests (no approval flow)
- Location doesn't update (always at Convention Centre)
- No real-time updates from other users
- Settings only persist in localStorage (cleared on reset)

## Exiting Demo Mode

Simply refresh the page and use a different login method, or clear localStorage:
```javascript
localStorage.clear();
```
