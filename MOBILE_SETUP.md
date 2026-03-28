# Running Zyclist App on Your Phone

## Option 1: Install as PWA (Recommended - Works Offline!)

### Android (Chrome/Edge)

1. **Deploy your app online** (see deployment options below)

2. **Open in Chrome:**
   - Visit your deployed URL (e.g., `https://your-app.vercel.app`)
   - Chrome will show "Add to Home Screen" banner
   - OR tap the 3-dot menu → "Add to Home Screen"

3. **Install:**
   - Tap "Add" or "Install"
   - App icon appears on home screen
   - Opens like a native app!

### iOS (Safari)

1. **Open in Safari:**
   - Visit your deployed URL
   - Tap the Share button (square with arrow)
   - Scroll down and tap "Add to Home Screen"

2. **Install:**
   - Edit name if desired
   - Tap "Add"
   - App icon appears on home screen

### Features When Installed:
✅ Works offline (rides saved locally)
✅ Full-screen experience (no browser UI)
✅ App icon on home screen
✅ Push notifications (future feature)
✅ Background sync when online

---

## Option 2: Quick Deployment Options

### A. Vercel (Easiest - Free)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy:**
```bash
vercel
```

3. **Follow prompts:**
   - Login with GitHub/Email
   - Confirm project settings
   - Get your URL: `https://your-app.vercel.app`

4. **Add environment variables in Vercel dashboard:**
   - Go to project settings
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### B. Netlify (Also Free)

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Build and deploy:**
```bash
npm run build
netlify deploy --prod
```

3. **Add environment variables in Netlify dashboard**

### C. Local Network (For Testing)

1. **Find your computer's IP:**
   - Windows: `ipconfig` (look for IPv4)
   - Mac/Linux: `ifconfig` or `ip addr`

2. **Run dev server:**
```bash
npm run dev -- -H 0.0.0.0
```

3. **Access from phone:**
   - Connect phone to same WiFi
   - Open browser: `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`

4. **Note:** HTTPS required for GPS on production!

---

## Offline Features Explained

### What Works Offline:

✅ **View the app** - All pages cached
✅ **Track rides** - GPS works without internet
✅ **Save rides** - Stored in browser's local storage
✅ **View past rides** - If previously loaded
✅ **View analytics** - Based on cached data

### What Needs Internet:

❌ Login/Signup (first time)
❌ Syncing rides to cloud
❌ Loading new rides from server
❌ Social features
❌ Map tiles (first load)

### How Offline Sync Works:

1. **You go offline** → App continues working
2. **Track a ride** → Saved to local storage
3. **Come back online** → Yellow notification appears
4. **Click "Sync Now"** → Rides upload to Supabase
5. **Done!** → Rides now visible everywhere

---

## Testing Offline Mode

### Chrome DevTools:
1. Open DevTools (F12)
2. Go to "Network" tab
3. Change "Online" to "Offline"
4. App still works!

### On Phone:
1. Install app as PWA
2. Turn on Airplane mode
3. Open app - still works!
4. Track a ride
5. Turn off Airplane mode
6. Sync automatically

---

## Creating App Icons

You need icons for the app. Use one of these tools:

### Option 1: PWA Asset Generator
```bash
npx pwa-asset-generator logo.svg public --icon-only
```

### Option 2: Online Tools
- [Favicon.io](https://favicon.io) - Upload image, download all sizes
- [RealFaviconGenerator](https://realfavicongenerator.net)

### Required Sizes:
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

Place all in `/public` folder as:
- `icon-72.png`, `icon-96.png`, etc.

---

## Production Checklist

Before deploying:

- [ ] Environment variables set
- [ ] App icons created (all sizes)
- [ ] HTTPS enabled (required for GPS)
- [ ] Service worker registered
- [ ] Tested offline mode
- [ ] Tested on actual phone
- [ ] Location permissions work
- [ ] Supabase RLS policies enabled

---

## Troubleshooting

### "Add to Home Screen" not showing:
- Must be HTTPS (not http)
- Must have valid manifest.json
- Must have service worker
- Visit site at least twice

### GPS not working on phone:
- Must be HTTPS in production
- Check browser location permissions
- Try in Chrome (better GPS support)

### Offline mode not working:
- Check service worker registered (DevTools → Application)
- Clear cache and reload
- Check manifest.json is valid

### App not syncing:
- Check internet connection
- Check Supabase credentials
- Look for errors in console

---

## Performance Tips

### For Better Mobile Experience:

1. **Enable compression** (Vercel does this automatically)
2. **Use image optimization** (Next.js does this)
3. **Minimize bundle size** (already optimized)
4. **Cache map tiles** (OpenLayers does this)

### Battery Optimization:

- GPS tracking uses battery
- App pauses tracking when screen off (by design)
- Stop rides when done to save battery

---

## Next Steps

1. Deploy to Vercel/Netlify
2. Create app icons
3. Test on your phone
4. Install as PWA
5. Test offline mode
6. Share with friends!

---

## Support

If something doesn't work:
1. Check browser console for errors
2. Verify environment variables
3. Test in Chrome (best PWA support)
4. Check Supabase connection
5. Try clearing cache and reinstalling

Enjoy your cycling app! 🚴‍♂️
