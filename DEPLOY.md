# Beepd Deployment Guide

## Prerequisites
- Cloudflare account
- Custom domain: beepd.tech
- Wrangler CLI (already installed)

---

## Step 1: Login to Cloudflare

```bash
cd backend
npx wrangler login
```

This will open a browser window. Authorize Wrangler to access your Cloudflare account.

---

## Step 2: Create Production D1 Database

```bash
cd backend
npx wrangler d1 create beepd-db
```

Copy the database ID from the output. It will look like:
```toml
[[d1_databases]]
binding = "DB"
database_name = "beepd-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Update `backend/wrangler.toml` with this database_id.

---

## Step 3: Run Database Migrations

```bash
cd backend
npx wrangler d1 migrations apply beepd-db --remote
```

This will create all tables in the production database.

---

## Step 4: Deploy Backend to Cloudflare Workers

```bash
cd backend
npx wrangler deploy
```

After deployment, you'll get a Worker URL like:
`https://beepd-api.<your-subdomain>.workers.dev`

---

## Step 5: Set Up Custom Domain for API

1. Go to Cloudflare Dashboard → Workers & Pages → beepd-api
2. Click "Triggers" tab
3. Add Custom Domain: `api.beepd.tech`
4. Cloudflare will automatically provision SSL certificate

Your API will be available at: `https://api.beepd.tech`

---

## Step 6: Deploy Frontend to Cloudflare Pages

### Option A: Connect GitHub Repository (Recommended)

1. Go to Cloudflare Dashboard → Workers & Pages → Create Application
2. Select "Pages" → "Connect to Git"
3. Authorize GitHub and select your repository
4. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `/`
5. Add environment variable:
   - `VITE_API_URL` = `https://api.beepd.tech`
6. Click "Save and Deploy"

### Option B: Manual Deployment

```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=beepd-web
```

---

## Step 7: Set Up Custom Domain for Frontend

1. Go to Cloudflare Dashboard → Workers & Pages → beepd-web
2. Click "Custom domains" tab
3. Add Custom Domain: `beepd.tech` and `www.beepd.tech`
4. Cloudflare will automatically provision SSL certificates

Your app will be available at: `https://beepd.tech`

---

## Step 8: Update Mobile App API URL

Edit `mobile/src/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://172.16.132.178:8787'  // Local development
  : 'https://api.beepd.tech';      // Production
```

---

## Step 9: Commit and Push to Main Branch

```bash
git add .
git commit -m "Deploy Beepd to production"
git push origin main
```

---

## Step 10: Configure DNS (if not using Cloudflare DNS)

If beepd.tech DNS is not managed by Cloudflare:

1. Go to your DNS provider
2. Add CNAME records:
   - `beepd.tech` → `beepd-web.pages.dev`
   - `www.beepd.tech` → `beepd-web.pages.dev`
   - `api.beepd.tech` → `beepd-api.<your-subdomain>.workers.dev`

---

## Verification Steps

### Test Backend API
```bash
curl https://api.beepd.tech/health
```

### Test Frontend
Open browser: https://beepd.tech

### Test Mobile App
1. Update mobile API URL to production
2. Build app: `cd mobile && npx expo start`
3. Test registration and location features

---

## Quick Deploy Commands

### Deploy Backend Only
```bash
cd backend
npx wrangler deploy
```

### Deploy Frontend Only
```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=beepd-web
```

### Deploy Both
```bash
# Backend
cd backend && npx wrangler deploy && cd ..

# Frontend
cd frontend && npm run build && npx wrangler pages deploy dist --project-name=beepd-web
```

---

## Troubleshooting

### Backend deployment fails
- Check you're logged in: `npx wrangler whoami`
- Verify D1 database exists: `npx wrangler d1 list`
- Check migrations applied: `npx wrangler d1 migrations list beepd-db --remote`

### Frontend can't connect to API
- Verify API URL in browser DevTools Network tab
- Check CORS settings in backend `src/index.ts`
- Ensure custom domain DNS is propagated (may take up to 48 hours)

### Mobile app connection issues
- Verify API_BASE_URL in `mobile/src/services/api.ts`
- Test API endpoint: `curl https://api.beepd.tech/health`
- Check network connectivity on device

---

## Production URLs

After deployment, your app will be available at:

- **Web App**: https://beepd.tech
- **API**: https://api.beepd.tech
- **Mobile App**: Via Expo Go (development) or EAS Build (production)

---

## EAS Build (Optional - For Production Mobile App)

To create standalone iOS/Android apps:

```bash
cd mobile

# Configure EAS
npx eas build:configure

# Build for iOS
npx eas build --platform ios

# Build for Android  
npx eas build --platform android

# Submit to App Stores
npx eas submit
```

See https://docs.expo.dev/build/introduction/ for more details.
