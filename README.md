# Zyclist - Ride Tracking App

A modern cycling tracking app inspired by Strava, with AI-powered analytics, social features, and safety tools.

## Features

✅ GPS ride tracking with live stats (like Strava)
✅ Route replay on interactive maps
✅ Analytics dashboard (weekly/monthly stats)
✅ Social feed - share rides publicly
✅ Safety center - SOS alerts & live tracking
✅ Offline mode - rides sync automatically
✅ PWA - install on mobile devices

## Tech Stack

- Frontend: Next.js 14 (PWA)
- Backend: Supabase (Auth, DB, Realtime)
- Maps: OpenLayers + OpenStreetMap (100% free)
- State: Zustand
- Database: PostgreSQL + PostGIS

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create project at [supabase.com](https://supabase.com)
   - Run SQL from `supabase-schema.sql` in SQL Editor
   - Get your credentials from Settings → API

3. Create `.env` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

4. Run the app:
```bash
npm run dev
```

## Features Guide

### 🚴 Ride Tracking
- Start/stop rides with one tap
- Real-time GPS tracking
- Live stats: distance, duration, speed
- Works offline - syncs when online

### 📊 Analytics
- All-time stats
- Weekly/monthly summaries
- Longest ride & fastest speed records

### 🗺️ Route Replay
- Click any ride to see the route
- Interactive map with full path
- Detailed ride statistics

### 👥 Social Feed
- Share rides publicly
- See community rides
- Like and comment (coming soon)

### 🚨 Safety Center
- Emergency SOS button
- Add emergency contacts
- Live tracking share link
- Real-time location sharing

### 📴 Offline Mode
- Rides saved locally when offline
- Auto-sync when connection returns
- Never lose a ride!

## Project Structure

```
app/
  ├── page.tsx              # Main ride tracker
  ├── dashboard/            # Ride history
  ├── analytics/            # Stats & insights
  ├── social/               # Community feed
  ├── safety/               # Emergency features
  ├── ride/[id]/            # Route replay
  └── track/[token]/        # Live tracking view
components/
  ├── Map.tsx               # OpenLayers map
  ├── RideTracker.tsx       # Main tracking UI
  ├── AuthForm.tsx          # Login/signup
  └── OfflineSync.tsx       # Offline sync indicator
lib/
  ├── supabase.ts           # Supabase client
  ├── gps.ts                # GPS tracking logic
  └── offlineStorage.ts     # Local storage for offline
```

## Database Schema

See `supabase-schema.sql` for complete schema including:
- Profiles (user data)
- Rides & ride_points (GPS data)
- Social features (followers, likes, comments)
- Safety features (emergency contacts, live tracking)
- Offline sync support

## Next Steps

- [ ] Add AI insights (ride difficulty prediction)
- [ ] Add elevation tracking
- [ ] Add weather integration
- [ ] Add challenges & achievements
- [ ] Add group rides
- [ ] Add route plannings

## Contributing

This is a starter project. Feel free to extend it with your own features!

## License

MIT
