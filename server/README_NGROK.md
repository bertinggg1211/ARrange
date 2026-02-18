# 🚀 Easy ngrok Setup

## ✅ Everything is Ready!

You have 2 batch files that make it super easy:

---

## 🎯 How to Use:

### Step 1: Start the Server
**Double-click:** `start-server.bat`

OR in terminal:
```bash
cd D:\THESIS\ThesisFinal-1\ThesisFinal\server
start-server.bat
```

### Step 2: Start ngrok (in a new window)
**Double-click:** `start-ngrok.bat`

OR in terminal:
```bash
cd D:\THESIS\ThesisFinal-1\ThesisFinal\server
start-ngrok.bat
```

---

## 📋 You'll see ngrok URL like:

```
Forwarding    https://abc-123-def.ngrok-free.dev -> http://localhost:5000
```

### Copy that URL and update 2 files:

**File 1:** `src/config/environment.js` (lines 27-29)
```javascript
[ENVIRONMENTS.NGROK]: {
    API_BASE_URL: 'https://abc-123-def.ngrok-free.dev',     // ← PASTE HERE
    SOCKET_URL: 'https://abc-123-def.ngrok-free.dev',       // ← PASTE HERE
    IMAGE_BASE_URL: 'https://abc-123-def.ngrok-free.dev',   // ← PASTE HERE
```

**File 2:** `src/config/serverConfig.js` (line 11)
```javascript
NGROK_CURRENT: 'https://abc-123-def.ngrok-free.dev',        // ← PASTE HERE
```

**File 3:** Switch environment in `src/config/environment.js` (line 49)
```javascript
const CURRENT_ENVIRONMENT = ENVIRONMENTS.NGROK;  // ← Change from DEVELOPMENT
```

---

## 📱 Build APK:

```bash
cd D:\THESIS\ThesisFinal-1\ThesisFinal\android
gradlew.bat assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🛑 To Stop:

Just close both terminal windows or press `Ctrl+C` in each

---

## 💡 Alternative: Manual Commands

### Terminal 1:
```bash
cd D:\THESIS\ThesisFinal-1\ThesisFinal\server
npm start
```

### Terminal 2:
```bash
cd D:\THESIS\ThesisFinal-1\ThesisFinal\server
npx ngrok http 5000
```

---

That's it! Super simple! 🎉
