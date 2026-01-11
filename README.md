# Beepd

Privacy-first friend discovery app that helps you connect IRL when it matters.

## 🚀 Quick Start

### Start Servers

```bash
# Backend (port 8787)
./start-backend.sh

# Frontend (port 5174)  
./start-frontend.sh
```

**Access**: Open http://localhost:5174

## 🎯 Key Features

- � **Easy Login**: Use device secret to login on any device
- �🟢 **Friends Tab**: See your friends nearby (green markers)
- 🔵 **Everyone Tab**: See everyone nearby (green=friends, blue=others)
- 🎯 **Radar View**: Directional proximity visualization
- 🗺️ **Map View**: Interactive Leaflet map with clustering
- 📋 **List View**: Sorted by distance
- 🟠 **Smart Clustering**: Orange markers for 3+ people
- 🔒 **Privacy First**: Location sharing only when mode is active

## 📋 Testing

See [SAMPLE_TESTING.md](SAMPLE_TESTING.md) for:
- Pre-configured test users at fixed distances
- Step-by-step testing guide
- Browser location simulation instructions

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Detailed setup and usage
- [DEMO.md](DEMO.md) - Demo script and talking points
- [DEVPOST_DESCRIPTION.md](DEVPOST_DESCRIPTION.md) - Project pitch
- [SAMPLE_TESTING.md](SAMPLE_TESTING.md) - Testing with sample data

## 🛠️ Tech Stack

**Frontend**: React + TypeScript + Vite + React Leaflet + Supercluster  
**Backend**: Hono + Cloudflare Workers + Drizzle ORM + D1 (SQLite)  
**Maps**: Leaflet + OpenStreetMap

## 🎨 Map Colors

- 🟢 **Green**: Friends (isFriend=true)
- 🔵 **Blue**: Non-friends in Everyone mode
- 🟠 **Orange**: Clusters with 3+ people
- 🟡 **Yellow**: User location (pulsing)

## 📁 Project Structure

```
proximity-radar/
├── backend/          # Hono API + Workers
├── frontend/         # React + Vite
├── docs/             # Additional documentation
├── specs/            # Feature specifications
└── start-*.sh        # Server start scripts
```

## 🔧 Development

**Backend Dev Server**:
- Uses `tsx` to run TypeScript directly
- SQLite database at `.wrangler/state/`
- Auto-initializes schema on first run

**Frontend Dev Server**:
- Vite hot reload
- Proxy to backend API

## 📝 Notes

- Simulated locations per browser window for testing
- Real device locations override simulations
- Locations expire after 24 hours
- Friend codes are 8-character alphanumeric (no O/0/I/1)
