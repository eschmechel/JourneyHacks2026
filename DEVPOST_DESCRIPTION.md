# Proximity Radar - Devpost Description

## 🎯 Inspiration

Living in Vancouver, I noticed a peculiar paradox: we're surrounded by friends, yet somehow always missing each other. The "Vancouver cold" isn't just about the weather—it's about people being distant despite being physically close. How many times have you grabbed coffee alone, only to later discover a friend was two blocks away?

I wanted to turn random run-ins into deliberate connections, transforming "I wish I'd known you were nearby!" into "Let's meet up now!" 

Apple's Find My iPhone showed location sharing was possible, but constant tracking felt invasive. **I wanted the serendipity without sacrificing privacy**—a way to share my location *only* when I'm open to meeting up, not 24/7 surveillance of my every move.

---

## 🚀 What It Does

**Proximity Radar** is a privacy-first friend discovery app that helps you connect IRL when it actually matters. 

- **Toggle Location Sharing**: Big ON/OFF switch—share your location only when you're ready to meet friends
- **Smart Proximity Detection**: Get notified when friends enter your customizable radius (100m, 500m, or 1km)
- **Privacy Modes**: Choose between OFF, Friends-only, or Everyone
- **Friend Codes**: Add trusted friends via shareable codes—no phone numbers, no social graphs
- **Live Map View**: See friends clustered on an interactive map with real-time updates
- **No Spam Notifications**: One-time alerts when friends newly enter your radius, not constant pings

---

## 🛠️ How We Built It

**Frontend**: React + TypeScript with Vite, using React Leaflet for interactive maps and Supercluster for efficient marker clustering. Radix UI and Tanstack Query power a smooth, responsive experience.

**Backend**: Cloudflare Workers with Hono framework for edge-deployed serverless APIs. Drizzle ORM with D1 (SQLite) for blazing-fast queries at the edge.

**Key Technical Decisions**:
- **Haversine distance formula** for accurate proximity calculations:
  $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\phi_2-\phi_1}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\lambda_2-\lambda_1}{2}\right)}\right)$$
- **Location simulation mode** for single-laptop demos—manually set coordinates per browser session
- **Token-based auth** with secure friend code generation for frictionless onboarding

---

## 🧗 Challenges We Ran Into

1. **Privacy vs. Functionality**: Balancing real-time location sharing with user privacy. Solved with explicit opt-in modes and temporary location storage.

2. **Demo on a Laptop**: Testing proximity features without multiple devices. Built a location simulator that lets you spoof coordinates per browser window—now I can demo two users side-by-side!

3. **Map Performance**: Rendering hundreds of markers crashed the browser. Implemented Supercluster for efficient clustering and viewport-based rendering.

4. **Accurate Distance Calculations**: Simple Euclidean distance doesn't work on a sphere! Implemented the Haversine formula for precise geospatial calculations.

5. **Notification Spam Prevention**: Friends shouldn't get pinged every second they're nearby. Built debouncing logic to trigger alerts only on *new* proximity entries.

---

## 📚 What We Learned

- **Edge computing** with Cloudflare Workers delivers sub-50ms API responses globally
- **Geospatial algorithms** are fascinating—the math behind mapping is deeper than expected
- **Privacy by design** isn't just a feature; it's a fundamental architectural decision
- **User psychology matters**: A big ON/OFF toggle provides peace of mind that "incognito mode" never could
- **Demo-ability drives development**: Building the location simulator made testing 10x easier and the project actually demostrable

---

## 🎨 What's Next for Proximity Radar

- **Calendar Integration**: Find mutual free time and schedule hangouts automatically
- **iOS/Android Apps**: Native mobile experience with background location updates
- **Event Mode**: Create temporary location-sharing groups for concerts, conferences, or festivals
- **Safety Features**: Panic button, trusted contacts, and time-limited sharing for added security
