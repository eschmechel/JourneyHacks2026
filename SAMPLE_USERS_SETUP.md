# Sample Users Setup Guide

## Overview

This project uses **fixed predetermined credentials** for sample test users to ensure consistency across development environments. This means:

- ✅ Device secrets are always the same
- ✅ Friend codes are always the same
- ✅ Frontend hardcoded demo data always works
- ✅ No need to update credentials after database resets

## Quick Start

### 1. Initialize Database with Sample Users (ONE TIME)

```bash
cd backend
./init-db-sample-users.sh
```

This script:
- Finds your local Wrangler D1 database
- Inserts 6 sample users with fixed UUIDs and friend codes
- Creates friendships between Alice, Bob, Charlie, and Dana
- Sets initial locations and settings

⚠️ **Important**: Run this ONCE after:
- First time setup
- After clearing/resetting the database
- After running migrations that wipe user data

### 2. Configure User Settings and Locations (ANYTIME)

```bash
./setup-sample-users.sh
```

This script:
- Updates display names and privacy settings
- Sets locations around Vancouver Convention Centre
- Updates friendships
- Outputs credentials to `sample_users_credentials.txt`

You can run this script multiple times safely - it just updates existing users.

## Sample User Credentials

These credentials are **FIXED** and never change:

| Name    | Device Secret                        | Friend Code | Status      |
|---------|--------------------------------------|-------------|-------------|
| Alice   | `847bdc04-f607-4774-9646-5cd2318a2e83` | `NR6M9ZZV`  | Your account |
| Bob     | `235c2116-b094-4675-8f1b-45241d4f15fd` | `TLPVAGUX`  | Friend      |
| Charlie | `b6d5fb61-c3b7-4ab8-8cf4-723fbf38d2ac` | `DHWX4QMR`  | Friend      |
| Dana    | `cabc75c8-1456-4eec-89a7-827249355da7` | `Y7PWTYGB`  | Friend      |
| Eve     | `44834541-b712-4c0d-8c27-bde8e63f831a` | `594GPN4H`  | Non-friend  |
| Frank   | `e52bcb99-c0c1-4ebc-9491-9aebf442c1b4` | `GF3DVJZD`  | Non-friend  |

### User Locations

All users are positioned around **Vancouver Convention Centre** (49.2891, -123.1112):

| User    | Distance from Alice | Latitude  | Longitude   |
|---------|-------------------|-----------|-------------|
| Alice   | 0m (base)         | 49.2891   | -123.1112   |
| Bob     | ~150m north       | 49.2905   | -123.1112   |
| Eve     | ~300m north       | 49.2918   | -123.1112   |
| Charlie | ~450m north       | 49.2932   | -123.1112   |
| Frank   | ~600m north       | 49.2945   | -123.1112   |
| Dana    | ~850m north       | 49.2968   | -123.1112   |

## Testing Workflow

### 1. Start Backend

```bash
cd backend
npm run dev
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

### 3. Login as Alice

1. Open http://localhost:5174
2. Paste Alice's device secret: `847bdc04-f607-4774-9646-5cd2318a2e83`
3. Click Login

### 4. Simulate Browser Location

**Chrome/Edge:**
1. Open DevTools (F12)
2. Press `Ctrl+Shift+P` → type "sensors" → Select "Show Sensors"
3. Location → Other → Set to: `49.2891, -123.1112`
4. Refresh the page

**Firefox:**
1. Install "Location Guard" extension
2. Set fixed location to: `49.2891, -123.1112`

### 5. Explore the App

- **Friends Tab**: See Bob, Charlie, Dana with accurate distances
- **Everyone Tab**: See all 5 users (Eve and Frank visible in EVERYONE mode)
- **Map View**: Click markers to see details and add friends
- **Radar View**: Circular radar visualization of nearby users

## Troubleshooting

### "Invalid device secret" error

**Problem**: Database doesn't have users with the fixed credentials.

**Solution**: Run the database initialization script:

```bash
cd backend
./init-db-sample-users.sh
```

### "Friend code not found" error

**Problem**: Users exist but aren't in the database yet.

**Solution**: Same as above - run `init-db-sample-users.sh`.

### Sample users have wrong locations/settings

**Problem**: Settings or locations are outdated.

**Solution**: Run the setup script:

```bash
./setup-sample-users.sh
```

### Database reset/migrations wiped data

After running database migrations or resetting the database:

```bash
cd backend
./init-db-sample-users.sh
cd ..
./setup-sample-users.sh
```

## Files Reference

- `backend/init-sample-users.sql` - SQL script with INSERT statements
- `backend/init-db-sample-users.sh` - Shell script to apply SQL to local D1 database
- `setup-sample-users.sh` - Shell script to configure existing users via API
- `sample_users_credentials.txt` - Generated credentials file (git-ignored)

## Development Notes

### Why Fixed Credentials?

The original approach used `/auth/register` which generates random device secrets. This caused problems:

1. ❌ Frontend hardcoded device secrets became invalid after each run
2. ❌ Friend codes changed every time
3. ❌ Had to manually update frontend code constantly

Fixed credentials solve this by:

1. ✅ Maintaining consistent device secrets across runs
2. ✅ Allowing frontend to use hardcoded values safely
3. ✅ Making testing and demos reproducible

### Modifying Sample Users

To change user data:

1. Edit `backend/init-sample-users.sql`
2. Update corresponding values in `setup-sample-users.sh`
3. Update hardcoded values in frontend (e.g., `frontend/src/pages/Home.tsx`)
4. Run both scripts to apply changes

### Adding More Sample Users

1. Generate a new UUID (use `uuidgen` command or online generator)
2. Generate an 8-character friend code (uppercase letters/numbers)
3. Add to `init-sample-users.sql` INSERT statement
4. Add to `setup-sample-users.sh` variable definitions
5. Re-run both scripts

## Production Considerations

⚠️ **These fixed credentials are for development only!**

In production:
- Users register with randomly generated device secrets
- Never expose or hardcode credentials
- Use environment variables for sensitive data
- Implement proper authentication flow

