# Fix Port 3000 Issue

## Problem
Port 3000 is already in use, causing errors.

## Solution

### Windows:
```bash
# Find process on port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Example:
taskkill /PID 12345 /F
```

### Alternative - Use Different Port:
```bash
# Run on port 3001 instead
npm run dev -- -p 3001
```

### Or add to package.json:
```json
"scripts": {
  "dev": "next dev -p 3001",
  "dev:3000": "next dev -p 3000"
}
```

## Quick Fix:
1. Close all terminals
2. Restart VS Code
3. Run `npm run dev` again

If still having issues, restart your computer to clear all processes.
