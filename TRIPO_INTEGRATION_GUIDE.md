# TRIPO 3D AI Integration Guide

## ✅ Migration Complete: KIRI Engine → TRIPO 3D AI

This document outlines the complete TRIPO 3D integration that replaces KIRI Engine for AI-powered 3D model generation from product images.

---

## 🎯 What Changed?

### **Before (KIRI Engine):**
- Required 10+ images of the product
- Used KiriEngineScanner for multi-image capture
- Sent images to KIRI API for 3D reconstruction

### **After (TRIPO 3D AI):**
- Requires only **1 image** of the product
- Uses TripoScanner for single image capture
- Sends image to TRIPO API for AI-powered 3D model generation

---

## 📦 Files Created

### **Backend:**
1. `server/services/tripoClient.js` - TRIPO API client
2. `server/routes/tripoRoutes.js` - Image upload and task creation endpoint
3. `server/routes/arWebhookTripo.js` - Task polling and completion handler

### **Frontend:**
1. `src/AR_KIRI/TripoScanner.jsx` - Single image capture screen
2. `src/api/tripoApi.js` - Frontend API client

### **Updated Files:**
1. `src/screens/seller/UploadItem.jsx` - Changed to use TRIPO
2. `server/services/cloudinaryStorage.js` - Added TRIPO source handling
3. `server/index.js` - Registered TRIPO routes
4. `src/navigation/SellerTabNavigator.jsx` - Added TripoScanner navigation

---

## 🔑 Environment Variables Required

Add these to your `.env` file in the `server/` directory:

```bash
# TRIPO 3D AI Configuration
TRIPO_API_KEY=your_tripo_api_key_here
TRIPO_BASE_URL=https://api.tripo3d.ai/v2/openapi

# Optional: Keep KIRI for backward compatibility
KIRI_API_KEY=your_kiri_api_key_here
KIRI_BASE_URL=https://api.kiriengine.app
```

---

## 🚀 How It Works

### **1. Seller Uploads Product (UploadItem.jsx)**
- Seller fills product details
- Clicks "Create 3D Model" button
- Navigates to `TripoScanner`

### **2. Image Capture (TripoScanner.jsx)**
- Seller takes 1 photo or selects from gallery
- Clicks "Generate 3D Model"
- Image uploaded to backend

### **3. Backend Processing (tripoRoutes.js)**
```javascript
POST /api/ar/tripo/start
- Uploads image to Cloudinary (for storage)
- Sends image URL to TRIPO API
- Gets task_id back
- Starts background polling
```

### **4. TRIPO Processing (tripoClient.js)**
```javascript
- uploadImageToTripo() - Upload image, get image_token
- startImageToModelTask() - Create 3D generation task
- pollTaskUntilComplete() - Poll every 5s until complete
```

### **5. Task Completion (arWebhookTripo.js)**
```javascript
- Downloads GLB model from TRIPO
- Uploads to Cloudinary (permanent storage)
- Updates product in Supabase:
  {
    has_ar: true,
    ar_model: "cloudinary_url",
    ar_model_source: "tripo",
    ar_scan_data: { ... }
  }
```

### **6. Buyer Views Product**
- Product shows "View AR" button
- Clicks button → ViewAR.jsx
- Loads GLB from Cloudinary
- Displays in AR viewer

---

## 📊 API Endpoints

### **Frontend to Backend:**
```
POST /api/ar/tripo/start
- Body: multipart/form-data with 'file' and 'productId'
- Returns: { task_id, product_id }

GET /api/ar/tripo/status/:taskId
- Returns: { status, progress, output }
```

### **Backend to TRIPO:**
```
POST https://api.tripo3d.ai/v2/openapi/upload/sts
- Uploads image, returns image_token

POST https://api.tripo3d.ai/v2/openapi/task
- Creates image-to-model task
- Body: { type: 'image_to_model', file: { file_token }, ... }
- Returns: { task_id }

GET https://api.tripo3d.ai/v2/openapi/task/:task_id
- Polls task status
- Returns: { status, progress, output: { model } }
```

---

## 🗄️ Database Schema

Products table includes:
```sql
has_ar: boolean
ar_model: text (Cloudinary GLB URL)
ar_thumbnail: text
ar_model_source: text ('tripo', 'kiri', 'local')
ar_build_status: text ('processing', 'completed', 'failed')
ar_scan_data: jsonb {
  source: 'tripo',
  task_id: string,
  quality: 'high',
  modelSize: string,
  timestamp: number
}
```

---

## 🧪 Testing the Integration

### **1. Get TRIPO API Key**
- Sign up at https://platform.tripo3d.ai
- Get your API key from dashboard
- Add to `.env` file

### **2. Start the Server**
```bash
cd server
npm install
npm start
```

### **3. Test Upload Flow**
1. Open seller app
2. Navigate to Upload Product
3. Fill product details
4. Click "Create 3D Model"
5. Take/select 1 product image
6. Click "Generate 3D Model"
7. Wait for processing (2-5 minutes)

### **4. Verify in Database**
```sql
SELECT id, name, has_ar, ar_model, ar_model_source, ar_build_status
FROM products
WHERE seller_id = 'your_seller_id'
ORDER BY created_at DESC;
```

### **5. Test Buyer View**
1. Open buyer app
2. Browse products
3. Find product with AR
4. Click "View AR"
5. Should load 3D model in AR viewer

---

## 🔍 Troubleshooting

### **Issue: "Missing TRIPO_API_KEY"**
- Add `TRIPO_API_KEY` to server/.env
- Restart server

### **Issue: "TRIPO task failed"**
- Check image quality (256x256 minimum)
- Check image format (JPG, PNG, WEBP)
- Check server logs for TRIPO API errors

### **Issue: "Model not showing in buyer app"**
- Check `ar_build_status` in database
- Verify `ar_model` URL is accessible
- Check Cloudinary uploads

### **Issue: "Navigation to TripoScanner failed"**
- Verify TripoScanner is imported in SellerTabNavigator
- Check navigation stack includes TripoScanner
- Restart the app

---

## 📝 Notes

### **Processing Time:**
- TRIPO typically takes 2-5 minutes per model
- Polling checks every 5 seconds
- Maximum 60 attempts (5 minutes timeout)

### **Image Requirements:**
- Resolution: 20x20 to 6000x6000 pixels
- Recommended: 256x256 or higher
- Format: JPG, PNG, WEBP
- Max size: 20MB

### **Model Output:**
- Format: GLB (with PBR textures)
- Includes: Geometry + Textures
- Storage: Cloudinary (permanent)

### **Backward Compatibility:**
- KIRI Engine code still present
- Can be removed later if desired
- Products with `ar_model_source: 'kiri'` still work

---

## 🎉 Benefits of TRIPO

✅ **Faster**: Only 1 image vs 10+ images
✅ **Easier**: Simpler for sellers to use
✅ **Better Quality**: AI-powered generation
✅ **Same Pipeline**: Cloudinary + Supabase unchanged
✅ **Buyer Experience**: No change for buyers

---

## 📚 Next Steps

1. ✅ Get TRIPO API key
2. ✅ Add to .env file
3. ✅ Test upload flow
4. ✅ Verify 3D model generation
5. ✅ Test buyer AR view
6. ✅ Deploy to production

---

## 🔗 Resources

- TRIPO Documentation: https://platform.tripo3d.ai/docs
- TRIPO Dashboard: https://platform.tripo3d.ai
- Support: Contact TRIPO support for API issues

---

**Integration completed by: Rovo Dev**
**Date: 2026-01-11**
