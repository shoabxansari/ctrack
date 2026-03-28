# Setup Guide

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for database to initialize

### Run Database Schema
1. Go to SQL Editor in Supabase dashboard
2. Copy entire content from `supabase-schema.sql`
3. Paste and click "Run"
4. Verify tables created in Table Editor

### Get API Credentials
1. Go to Settings → API
2. Copy "Project URL"
3. Copy "anon/public" key (starts with `eyJ...`)

### Configure Auth
1. Go to Authentication → Providers
2. Enable "Email" provider
3. Optional: Disable "Confirm email" for faster testing
4. Optional: Enable Google OAuth for social login

## 2. Environment Setup

Create `.env` file in project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 5. Test the App

1. Sign up with email/password
2. Start a ride (allow location access)
3. Walk/bike around to see GPS tracking
4. Stop ride and check dashboard
5. View ride details by clicking on a ride

## 6. Enable PWA (Mobile Install)

### On Mobile Browser:
1. Open app in Chrome/Safari
2. Tap "Add to Home Screen"
3. App installs like native app

### Generate Icons:
Create these files in `/public`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

Use a tool like [favicon.io](https://favicon.io) to generate.

## 7. Optional Features

### Disable Email Confirmation
Supabase → Authentication → Providers → Email → Turn OFF "Confirm email"

### Enable Realtime
Supabase → Database → Replication → Enable for tables you want realtime

### Add Custom Domain
Supabase → Settings → Custom Domains

## Troubleshooting

### "Invalid API key" error
- Check `.env` file exists
- Verify you're using the ANON key, not service role key
- Restart dev server after changing `.env`

### GPS not working
- Allow location permissions in browser
- Use HTTPS (required for geolocation)
- Test outdoors for better GPS signal

### Rides not saving
- Check browser console for errors
- Verify Supabase schema is correct
- Check RLS policies are enabled

### Offline mode not working
- Check browser supports localStorage
- Verify OfflineSync component is mounted
- Check browser console for sync errors

## Production Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Environment Variables
Add same `.env` variables in Vercel dashboard

### Custom Domain
Configure in Vercel settings

## Database Backup

Regular backups recommended:
1. Supabase → Database → Backups
2. Enable automatic backups
3. Download manual backup before major changes

## Security Checklist

- [ ] Row Level Security enabled on all tables
- [ ] API keys in environment variables (not committed)
- [ ] Email confirmation enabled (production)
- [ ] Rate limiting configured
- [ ] HTTPS enabled
- [ ] CORS configured properly

## Next Steps

- Add custom branding
- Configure email templates
- Set up analytics
- Add error monitoring (Sentry)
- Configure CDN for assets
