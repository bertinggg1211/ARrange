# 🔐 Create Admin User - Alternative Methods (No Payment Required)

Since Render Shell requires payment, here are FREE alternatives to create your admin user:

---

## ✅ Method 1: Use Supabase Dashboard (RECOMMENDED)

This is the easiest way!

### Steps:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com
   - Login to your project

2. **Open SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run This SQL**
   ```sql
   -- Create admin user
   INSERT INTO users (
     email,
     password_hash,
     role,
     full_name,
     created_at,
     updated_at
   ) VALUES (
     'admin',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'admin',
     'Administrator',
     NOW(),
     NOW()
   ) ON CONFLICT (email) DO UPDATE SET
     password_hash = EXCLUDED.password_hash,
     role = EXCLUDED.role,
     full_name = EXCLUDED.full_name;
   ```

4. **Click "Run"**
   - You should see: "Success. No rows returned"

5. **Done!** ✅
   - Admin user created
   - Email: `admin`
   - Password: `admin`

---

## ✅ Method 2: Use Your Local Script (Then Upload to Supabase)

### Steps:

1. **Run Script Locally**
   ```bash
   cd server
   node scripts/create-admin-user.js
   ```

2. **The script connects to Supabase**
   - Since your `.env` has Supabase credentials
   - It creates the user directly in your database
   - Works from anywhere!

3. **Done!** ✅
   - Admin user is now in your production database

---

## ✅ Method 3: Use API Endpoint (Create Signup Temporarily)

If you want to create admin via API:

### Step 1: Add Temporary Route (Optional)

Add this to `server/routes/authRoutes.js`:

```javascript
// TEMPORARY - Create admin user via API
router.post('/create-admin-temp', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('admin', 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: 'admin',
        password_hash: passwordHash,
        role: 'admin',
        full_name: 'Administrator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, message: 'Admin created!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Step 2: Deploy

```bash
git add .
git commit -m "Add temp admin creation endpoint"
git push origin main
```

### Step 3: Call the Endpoint

Use Postman or browser:
```
POST https://your-app.onrender.com/api/auth/create-admin-temp
```

### Step 4: Remove the Route (Important!)

After admin is created, remove this route for security!

---

## ✅ Method 4: Use Supabase Table Editor

### Steps:

1. **Go to Supabase Dashboard**
   - Visit your project
   - Click **Table Editor**

2. **Select "users" table**

3. **Click "Insert row"**

4. **Fill in the data:**
   - **email**: `admin`
   - **password_hash**: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`
   - **role**: `admin`
   - **full_name**: `Administrator`
   - **created_at**: (leave default or use NOW())
   - **updated_at**: (leave default or use NOW())

5. **Click "Save"**

6. **Done!** ✅

---

## 🎯 RECOMMENDED APPROACH

**Use Method 1 (Supabase SQL Editor) - It's the easiest!**

### Quick Copy-Paste:

```sql
INSERT INTO users (email, password_hash, role, full_name, created_at, updated_at) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', 'Administrator', NOW(), NOW()) 
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role;
```

---

## 🔐 The Password Hash Explained

The hash `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` is:
- Bcrypt hash of the password: **"admin"**
- Salt rounds: 10
- Safe to use in SQL

---

## ✅ Verify Admin User Created

### Test Login:

1. Open your app
2. Go to login screen
3. Enter:
   - Email: `admin`
   - Password: `admin`
4. You should be redirected to admin dashboard! ✅

---

## 🎉 You're Done!

No payment needed for any of these methods!

**Recommended order:**
1. Try Method 1 (Supabase SQL Editor) - Fastest
2. If that doesn't work, try Method 2 (Local script)
3. Method 3 & 4 are backups

---

**After admin is created, remember to CHANGE THE PASSWORD!** 🔒
