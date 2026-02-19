# 🚀 Complete Deployment Guide - Render + APK

## Part 1: Deploy Server to Render

### Step 1: Prepare Your Code for Render

#### A. Make sure .gitignore is correct
Check that `server/.gitignore` has:
```
node_modules/
.env
uploads/
*.log
```

#### B. Verify package.json has start script
Your `server/package.json` should have:
```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

### Step 2: Push Code to GitHub

```bash
# Make sure you're in the project root
cd D:\THESIS\ThesisFinal-1\ThesisFinal

# Add all files
git add .

# Commit
git commit -m "Deploy admin system to production"

# Push to GitHub
git push origin main
```

### Step 3: Create Render Web Service

1. **Go to Render**: https://render.com
2. **Login/Signup** with GitHub
3. Click **"New +"** → **"Web Service"**
4. **Connect your GitHub repository**:
   - Select your repository
   - Click **"Connect"**

### Step 4: Configure Render Settings

Fill in these settings:

**Basic Settings:**
- **Name**: `thesisfinal-server` (or any name you want)
- **Region**: `Singapore` (closest to Philippines)
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`

**Instance Type:**
- Select **"Free"** (for testing) or **"Starter"** (for production)

### Step 5: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these from your `.env` file:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
NODE_ENV=production
```

⚠️ **Copy these from your current `server/.env` file!**

### Step 6: Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Wait 5-10 minutes for deployment to complete
4. You'll get a URL like: `https://thesisfinal-server.onrender.com`

### Step 7: Create Admin User on Render

After deployment is successful:

1. Go to your Render dashboard
2. Click on your service
3. Go to **"Shell"** tab (top right)
4. Run this command:
   ```bash
   node scripts/create-admin-user.js
   ```
5. You should see: "✅ Admin user created successfully!"

### Step 8: Test Your Server

Open your browser and go to:
```
https://your-app-name.onrender.com/health
```

You should see: `{"status":"ok","message":"Server is running"}`

---

## Part 2: Update Frontend to Use Render Server

### Step 1: Update Server Config

Edit `src/config/serverConfig.js`:

```javascript
const SERVER_CONFIGS = {
  LOCAL_DEV: 'http://192.168.100.9:5000',
  LOCAL_EMULATOR: 'http://10.0.2.2:5000',
  
  // ✅ UPDATE THIS WITH YOUR RENDER URL
  PRODUCTION: 'https://your-app-name.onrender.com',
};
```

### Step 2: Change to Production Mode

In the same file, change the priority to use PRODUCTION:

```javascript
const SERVER_PRIORITY = [
  SERVER_CONFIGS.PRODUCTION,       // 🚀 Use production server
  // SERVER_CONFIGS.LOCAL_DEV,     // Comment out local dev
];
```

---

## Part 3: Build APK

### Method 1: Build Release APK (Recommended)

#### Step 1: Update App Version (Optional)
Edit `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 2          // Increment this
    versionName "2.0"      // Update version name
}
```

#### Step 2: Clean Build
```bash
cd android
./gradlew clean
```

#### Step 3: Build Release APK
```bash
# Windows PowerShell
cd android
.\gradlew assembleRelease

# Or if you have bash
cd android
./gradlew assembleRelease
```

#### Step 4: Find Your APK
After build completes (5-10 minutes), find APK at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Method 2: Build Debug APK (Faster, for testing)

```bash
cd android
.\gradlew assembleDebug
```

APK location:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 5: Install APK on Android Device

**Option A: Via USB**
1. Enable **Developer Options** on your Android phone
2. Enable **USB Debugging**
3. Connect phone to computer
4. Run:
   ```bash
   cd android
   .\gradlew installRelease
   ```

**Option B: Transfer APK**
1. Copy `app-release.apk` to your phone
2. Open the APK file on your phone
3. Allow "Install from Unknown Sources" if prompted
4. Install the app

---

## Part 4: Test Everything

### Test Server:
```bash
# Test health
curl https://your-app.onrender.com/health

# Test products endpoint
curl https://your-app.onrender.com/api/products
```

### Test Admin Login in APK:
1. Open the app
2. Login with:
   - Email: `admin`
   - Password: `admin`
3. Verify you see the admin dashboard
4. Test all management screens

---

## 🔧 Troubleshooting

### If Render deployment fails:

**Check Logs:**
1. Go to Render dashboard
2. Click on your service
3. Click **"Logs"** tab
4. Look for errors

**Common Issues:**
- ❌ Missing environment variables → Add them in Render settings
- ❌ Wrong start command → Use `node index.js`
- ❌ Missing dependencies → Check `package.json`

### If APK build fails:

**Clean and Rebuild:**
```bash
cd android
.\gradlew clean
.\gradlew assembleRelease
```

**Check Node Version:**
```bash
node --version  # Should be v16 or higher
```

**Check Java Version:**
```bash
java -version  # Should be JDK 11 or higher
```

---

## 📱 App Distribution

### Share APK with Users:

**Option 1: Google Drive**
1. Upload `app-release.apk` to Google Drive
2. Share the link
3. Users download and install

**Option 2: Direct Transfer**
1. Use USB cable or Bluetooth
2. Transfer APK to phone
3. Install on device

**Option 3: Host on Server**
1. Upload APK to your server
2. Create download link
3. Share with users

---

## ⚠️ Important Notes

### Security:
1. **Change admin password** immediately after first login!
2. **Never commit** `.env` file to GitHub
3. **Use HTTPS** for production (Render provides this automatically)

### Render Free Tier Limitations:
- 🕐 Server spins down after 15 minutes of inactivity
- 🕐 First request after spindown takes 30-60 seconds
- 💾 750 hours/month free (enough for testing)

### For Production:
- Upgrade to Render **Starter** plan ($7/month) for:
  - No spindown
  - Better performance
  - More resources

---

## ✅ Final Checklist

### Server Deployment:
- [ ] Code pushed to GitHub
- [ ] Render web service created
- [ ] Environment variables added
- [ ] Server deployed successfully
- [ ] Admin user created on production
- [ ] Server URL tested and working

### APK Build:
- [ ] Server config updated with production URL
- [ ] APK built successfully
- [ ] APK installed on test device
- [ ] Admin login tested
- [ ] All features working

---

## 🎯 Quick Command Reference

```bash
# Deploy to Render (via GitHub)
git add .
git commit -m "Deploy to production"
git push origin main

# Build APK
cd android
.\gradlew clean
.\gradlew assembleRelease

# APK location
android/app/build/outputs/apk/release/app-release.apk

# Install on connected device
.\gradlew installRelease
```

---

## 📞 Support

If you encounter issues:
1. Check Render logs
2. Check Android build output
3. Test server endpoints with Postman
4. Verify environment variables are set

---

**Deployment Date**: 2026-02-19  
**Server**: Render  
**Build**: APK Release  
**Status**: ✅ READY

Good luck with deployment! 🚀
