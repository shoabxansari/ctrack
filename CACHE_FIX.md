# Fix Browser Cache Issue

## The Problem
Browser is caching old version of the app. Changes not showing up.

## Solutions (Try in order):

### 1. Hard Refresh Browser
**Chrome/Edge:**
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Firefox:**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### 2. Clear Browser Cache
**Chrome:**
1. Press `F12` to open DevTools
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Or:**
1. Settings → Privacy → Clear browsing data
2. Select "Cached images and files"
3. Click "Clear data"

### 3. Clear Service Worker
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Service Workers" in left sidebar
4. Click "Unregister" for localhost
5. Refresh page

### 4. Clear All Site Data
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Clear storage" in left sidebar
4. Click "Clear site data"
5. Refresh page

### 5. Incognito/Private Mode
Open in incognito/private window to test without cache

### 6. Different Browser
Try Chrome, Firefox, or Edge to see if issue persists

### 7. Nuclear Option
```bash
# Stop dev server
# Delete these folders:
Remove-Item -Path .next -Recurse -Force
Remove-Item -Path node_modules\.cache -Recurse -Force -ErrorAction SilentlyContinue

# Restart dev server
npm run dev
```

## After Fixing:
You should see:
- "Zyclist" branding (not "Cyclist")
- Sharp corners (no rounded edges)
- Orange/pink gradients
- Modern glassmorphism effects

## Still Not Working?
1. Check you're on http://localhost:3000 (not 3001)
2. Make sure dev server restarted after changes
3. Check browser console for errors (F12)
