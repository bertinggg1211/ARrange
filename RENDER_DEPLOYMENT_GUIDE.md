# 🚀 Render Deployment Guide for ARrange Backend

## ✅ Your server is now ready for deployment!

---

## 📋 Step-by-Step Deployment Instructions

### **Step 1: Push Your Code to GitHub**

If you haven't already:

```bash
# Navigate to your project root
cd D:\THESIS\ThesisFinal-1\ThesisFinal

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare server for Render deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

### **Step 2: Sign Up on Render**

1. Go to **https://render.com**
2. Click **"Get Started"**
3. Sign up with **GitHub** (easiest option)
4. Authorize Render to access your repositories

---

### **Step 3: Create a New Web Service**

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:
   - If you don't see it, click "Configure account" to grant access
   - Search for your repository
   - Click "Connect"

---

### **Step 4: Configure Your Service**

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `arrange-backend` (or any name you like) |
| **Region** | Choose closest to you (e.g., Singapore/Oregon) |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | **Free** |

---

### **Step 5: Add Environment Variables**

Click **"Advanced"** → **"Add Environment Variable"**

Add these one by one:

#### **Required Variables:**

```
JWT_SECRET=your-secret-key-from-env-file
SUPABASE_URL=https://uqabqigsgrmtylcgheqg.supabase.co
SUPABASE_KEY=your-supabase-anon-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
NODE_ENV=production
PORT=5000
```

**📝 Find your values:**
- Open `server/.env` file
- Copy each value to Render

---

### **Step 6: Deploy!**

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Watch the logs for any errors

---

### **Step 7: Get Your URL**

Once deployed, you'll get a URL like:
```
https://arrange-backend.onrender.com
```

**Copy this URL!** You'll need it for your mobile app.

---

### **Step 8: Test Your Deployment**

Open in browser:
```
https://arrange-backend.onrender.com/health
```

You should see:
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "..."
}
```

---

### **Step 9: Update Your Mobile App**

#### **File 1: `src/config/environment.js`**

Update the PRODUCTION environment (around line 33):

```javascript
[ENVIRONMENTS.PRODUCTION]: {
    // UPDATE THIS WITH YOUR RENDER URL
    API_BASE_URL: 'https://arrange-backend.onrender.com',
    SOCKET_URL: 'https://arrange-backend.onrender.com',
    IMAGE_BASE_URL: 'https://arrange-backend.onrender.com',
    DEBUG_MODE: false,
    APP_NAME: 'ARrange',
},
```

#### **File 2: Switch Environment (line 49)**

```javascript
const CURRENT_ENVIRONMENT = ENVIRONMENTS.PRODUCTION;
```

---

### **Step 10: Build APK**

```bash
cd android
gradlew.bat assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🎉 **You're Done!**

Your server is now:
- ✅ **Online 24/7** - No need to keep your computer on
- ✅ **Fixed URL** - Never changes, build APK once
- ✅ **HTTPS** - Secure connections
- ✅ **FREE** - No costs
- ✅ **Professional** - Perfect for thesis defense

---

## 🔄 **Updating Your Server**

Whenever you make changes:

```bash
git add .
git commit -m "Update server"
git push
```

Render will **automatically redeploy** in 2-3 minutes!

---

## 📊 **Monitor Your Server**

In Render Dashboard you can:
- ✅ View live logs
- ✅ See deployment history
- ✅ Monitor usage
- ✅ Check health status
- ✅ View metrics

---

## ⚠️ **Important Notes**

### **Free Plan Limitations:**
- Server may sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- 750 hours/month free (enough for thesis)
- Great for demos and testing!

### **To Prevent Sleep:**
You can use a free service like **UptimeRobot** to ping your server every 5 minutes.

---

## 🐛 **Troubleshooting**

### **Deployment Failed?**

1. Check the build logs in Render dashboard
2. Make sure all environment variables are set
3. Verify `server` folder has `package.json` and `index.js`

### **Server Returns 503?**

- Server might be sleeping (free plan)
- Wait 30-60 seconds and try again
- Or set up UptimeRobot to keep it awake

### **Can't connect from app?**

1. Verify the URL is correct in `environment.js`
2. Check if HTTPS is used (not HTTP)
3. Test the URL in browser first
4. Make sure you switched to PRODUCTION environment
5. Rebuild the APK after changing config

---

## 💡 **Pro Tips**

### **Tip 1: Add Health Check Endpoint**

Already included in your server! The `/health` endpoint helps Render monitor your server.

### **Tip 2: Enable Automatic Deploys**

In Render settings, enable "Auto-Deploy" so every git push automatically updates your server.

### **Tip 3: View Logs**

In Render dashboard, click "Logs" to see real-time server activity. Great for debugging!

### **Tip 4: Custom Domain (Optional)**

You can add a custom domain like `api.yourapp.com` in Render settings (requires domain ownership).

---

## 📞 **Need Help?**

If you run into issues:
1. Check Render logs
2. Verify environment variables
3. Test `/health` endpoint
4. Check this guide again

---

## ✅ **Quick Checklist**

Before deploying:
- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Web Service created
- [ ] Environment variables added
- [ ] Service deployed successfully
- [ ] `/health` endpoint tested
- [ ] Mobile app config updated
- [ ] APK rebuilt with production URL
- [ ] APK tested on device

---

🎉 **Congratulations!** Your server is now live on the internet! Perfect for thesis demonstrations!
