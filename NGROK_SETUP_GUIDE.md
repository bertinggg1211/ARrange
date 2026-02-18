# 🚀 ngrok Setup Guide for ARrange App

## 📦 Quick Start (From Your Project Folder)

### Step 1: Install ngrok in your project

```bash
# Navigate to server folder
cd D:\THESIS\ThesisFinal-1\ThesisFinal\server

# Install ngrok
npm install --save-dev ngrok
```

### Step 2: Authenticate ngrok (One-time setup)

1. Sign up at **https://ngrok.com** (FREE)
2. Get your authtoken from **https://dashboard.ngrok.com/get-started/your-authtoken**
3. Run this command in your terminal:

```bash
npx ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

Example:
```bash
npx ngrok config add-authtoken 2abc123def456ghi789jkl
```

### Step 3: Start Server + ngrok Together

```bash
# From server folder
node start-with-ngrok.js
```

This will:
- ✅ Start your Express server on port 5000
- ✅ Start ngrok tunnel automatically
- ✅ Show you the public URL
- ✅ Give you step-by-step instructions

---

## 🎯 Alternative: Run Separately

### Option A: Start server first, then ngrok

**Terminal 1 - Start Server:**
```bash
cd server
npm start
```

**Terminal 2 - Start ngrok:**
```bash
cd server
node start-ngrok.js
```

### Option B: Use npm scripts

**Add to `server/package.json`:**
```json
{
  "scripts": {
    "start": "node index.js",
    "ngrok": "node start-ngrok.js",
    "ngrok:full": "node start-with-ngrok.js"
  }
}
```

**Then run:**
```bash
# Start both at once
npm run ngrok:full

# Or start separately
npm start           # Terminal 1
npm run ngrok       # Terminal 2
```

---

## 📋 After ngrok Starts

You'll see something like:

```
╔════════════════════════════════════════════════════╗
║        ✅ SERVER & NGROK STARTED SUCCESSFULLY!     ║
╚════════════════════════════════════════════════════╝

📡 Public URL:  https://abc-123-def.ngrok-free.dev
🔌 Local URL:   http://localhost:5000
🌐 Web Interface: http://localhost:4040
```

### Copy the Public URL and update 2 files:

**File 1: `src/config/environment.js` (lines 27-29)**
```javascript
[ENVIRONMENTS.NGROK]: {
    API_BASE_URL: 'https://abc-123-def.ngrok-free.dev',      // ← Paste here
    SOCKET_URL: 'https://abc-123-def.ngrok-free.dev',        // ← Paste here
    IMAGE_BASE_URL: 'https://abc-123-def.ngrok-free.dev',    // ← Paste here
    DEBUG_MODE: true,
    APP_NAME: 'ARrange (Ngrok)',
},
```

**File 2: `src/config/serverConfig.js` (line 11)**
```javascript
NGROK_CURRENT: 'https://abc-123-def.ngrok-free.dev',         // ← Paste here
```

**File 3: Switch Environment in `src/config/environment.js` (line 49)**
```javascript
const CURRENT_ENVIRONMENT = ENVIRONMENTS.NGROK;  // ← Change from DEVELOPMENT
```

---

## 📱 Build APK

```bash
cd D:\THESIS\ThesisFinal-1\ThesisFinal\android
gradlew.bat assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🎬 Complete Workflow

### 1. Start ngrok
```bash
cd D:\THESIS\ThesisFinal-1\ThesisFinal\server
node start-with-ngrok.js
```

### 2. Copy the ngrok URL shown in terminal

### 3. Update config files with the URL

### 4. Build APK
```bash
cd ..\android
gradlew.bat assembleRelease
```

### 5. Share APK with testers

### 6. Keep ngrok running while they test!

---

## ⚠️ Important Notes

### Free ngrok Limitations:
- URL changes every time you restart ngrok
- 2-hour session timeout
- Shows "Visit Site" button (users just click it once)

### To keep the same URL forever:
Upgrade to ngrok paid plan ($8/month) and use:
```bash
ngrok http 5000 --subdomain=yourthesis
# URL will always be: https://yourthesis.ngrok.io
```

---

## 🐛 Troubleshooting

### "ngrok: command not found"
**Solution:** Run `npm install --save-dev ngrok` in server folder

### "ERR_NGROK_6022: Authentication failed"
**Solution:** Run `npx ngrok config add-authtoken YOUR_TOKEN`

### "Port 5000 already in use"
**Solution:** Close other terminals running the server

### App can't connect
**Solution:** 
1. Check ngrok is running
2. Check server is running
3. Verify URLs match in config files
4. Try opening ngrok URL in browser

---

## 📞 Need Help?

If you get stuck, check the ngrok web interface at:
**http://localhost:4040**

You can see all requests, responses, and debug issues there!

---

## ✅ Testing Checklist

- [ ] ngrok installed in server folder
- [ ] ngrok authenticated with authtoken
- [ ] Server + ngrok started successfully
- [ ] ngrok URL copied
- [ ] environment.js updated (2 places)
- [ ] serverConfig.js updated (1 place)
- [ ] Environment switched to NGROK
- [ ] APK built successfully
- [ ] APK tested on your device
- [ ] ngrok kept running during testing
