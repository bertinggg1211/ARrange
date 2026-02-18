# 🎯 Multi-View to Model Implementation Plan

## 📋 **Key Requirements from TRIPO Documentation**

### **API Changes:**
- **Type:** `multiview_to_model` (instead of `image_to_model`)
- **Model Version:** v3.0-20250812 (or v2.5-20250123)
- **Files:** Exactly 4 images in order: `[front, left, back, right]`
  - Front image is REQUIRED
  - Other positions can be omitted (use empty `{}`)
  - Minimum: 2 images
  - Resolution: 20x20 to 6000x6000 (recommended 256x256+)

### **Request Format:**
```json
{
  "type": "multiview_to_model",
  "model_version": "v3.0-20250812",
  "files": [
    { "type": "jpg", "url": "cloudinary_url_front" },   // Front (REQUIRED)
    { "type": "jpg", "url": "cloudinary_url_left" },    // Left (optional)
    { "type": "jpg", "url": "cloudinary_url_back" },    // Back (optional)
    { "type": "jpg", "url": "cloudinary_url_right" }    // Right (optional)
  ],
  "texture": true,
  "pbr": true,
  "geometry_quality": "standard"  // or "detailed" for v3.0+
}
```

---

## 🔧 **Implementation Strategy**

### **Phase 1: Update TripoScanner (Frontend)**
**File:** `src/AR_KIRI/TripoScanner.jsx`

**Changes:**
1. ✅ Allow 4 image slots (front, left, back, right)
2. ✅ Label each position clearly
3. ✅ Front image is REQUIRED, others optional
4. ✅ Validate minimum 2 images
5. ✅ Show preview of all 4 positions
6. ✅ Send array of images to backend

---

### **Phase 2: Update API Client (Frontend)**
**File:** `src/api/tripoApi.js`

**Changes:**
1. ✅ Create new function: `startTripoMultiviewToModel()`
2. ✅ Keep existing `startTripoImageToModel()` for backward compatibility
3. ✅ Send multiple images in FormData

---

### **Phase 3: Update Backend Service**
**File:** `server/services/tripoClient.js`

**Changes:**
1. ✅ Create new function: `startMultiviewToModelTask()`
2. ✅ Keep existing `startImageToModelTask()` unchanged
3. ✅ Upload all images to Cloudinary
4. ✅ Build files array in correct order: [front, left, back, right]
5. ✅ Handle empty positions with `{}`
6. ✅ Use model_version: v3.0-20250812

---

### **Phase 4: Update Backend Routes**
**File:** `server/routes/arWebhookTripo.js`

**Changes:**
1. ✅ Add new endpoint: `POST /api/ar/tripo/start-multiview`
2. ✅ Keep existing `/start` endpoint unchanged
3. ✅ Accept multiple images in FormData
4. ✅ Call new multiview function

---

## ✅ **What Stays EXACTLY the Same:**

- ✅ Database schema (no changes!)
- ✅ `ViewAR.jsx` (buyer experience)
- ✅ `ProductDetail.jsx` (AR button)
- ✅ Supabase storage
- ✅ Background polling system
- ✅ Response format (still returns `task_id`)
- ✅ Model download & upload process
- ✅ Product update logic

---

## 📊 **New UI Design for TripoScanner**

```
┌─────────────────────────────────────────┐
│     TRIPO Multi-View Scanner            │
├─────────────────────────────────────────┤
│                                         │
│  Instructions:                          │
│  Take 4 photos from different angles   │
│  [Front] [Left] [Back] [Right]         │
│                                         │
│  ┌─────────┐  ┌─────────┐             │
│  │ FRONT * │  │  LEFT   │             │
│  │ [Image] │  │ [Empty] │             │
│  │   📷    │  │   📷    │             │
│  └─────────┘  └─────────┘             │
│                                         │
│  ┌─────────┐  ┌─────────┐             │
│  │  BACK   │  │  RIGHT  │             │
│  │ [Empty] │  │ [Image] │             │
│  │   📷    │  │   📷    │             │
│  └─────────┘  └─────────┘             │
│                                         │
│  * Front image is required              │
│  Minimum 2 images needed                │
│                                         │
│  [Generate 3D Model] (Green button)    │
└─────────────────────────────────────────┘
```

---

## 🎯 **User Flow:**

1. Seller clicks "Create 3D Model" in UploadItem
2. TripoScanner opens with 4 image slots
3. Seller captures/selects images:
   - Front (REQUIRED)
   - Left, Back, Right (Optional)
4. System validates (min 2 images)
5. Seller clicks "Generate 3D Model"
6. Backend uploads all images to Cloudinary
7. Backend calls TRIPO with multiview request
8. TRIPO processes and returns task_id
9. Same polling/download/update process as before
10. Buyer views AR model (no change!)

---

## 🔑 **Implementation Order:**

1. ✅ Update `TripoScanner.jsx` (4 image UI)
2. ✅ Update `tripoApi.js` (new function)
3. ✅ Update `tripoClient.js` (multiview API)
4. ✅ Update backend routes (new endpoint)
5. ✅ Test with real product
6. ✅ Verify buyer AR view works

---

**Ready to implement!** 🚀
