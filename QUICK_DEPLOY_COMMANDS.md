# ⚡ Quick Deploy Commands

## 🚀 Deploy Server to Render

### 1. Push to GitHub
```bash
# Navigate to project root
cd D:\THESIS\ThesisFinal-1\ThesisFinal

# Add all changes
git add .

# Commit
git commit -m "Deploy admin system"

# Push
git push origin main
```

### 2. On Render.com
1. Login → **New +** → **Web Service**
2. Connect GitHub repository
3. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Add Environment Variables (copy from `server/.env`)
5. Click **Create Web Service**

### 3. Create Admin User
After deployment, in Render Shell:
```bash
node scripts/create-admin-user.js
```

---

## 📱 Build APK

### 1. Update Server URL
Edit `src/config/serverConfig.js`:
```javascript
PRODUCTION: 'https://your-app.onrender.com',  // Your Render URL
```

Change priority:
```javascript
const SERVER_PRIORITY = [
  SERVER_CONFIGS.PRODUCTION,  // Use production
];
```

### 2. Build APK
```bash
# Clean
cd android
.\gradlew clean

# Build Release APK
.\gradlew assembleRelease
```

### 3. Get APK
APK location:
```
android\app\build\outputs\apk\release\app-release.apk
```

---

## ✅ That's It!

**Server**: Live on Render  
**APK**: Ready to distribute

**Test admin login:**
- Email: `admin`
- Password: `admin`

⚠️ **CHANGE ADMIN PASSWORD AFTER FIRST LOGIN!**
