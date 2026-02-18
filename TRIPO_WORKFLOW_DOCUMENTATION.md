# 🔄 TRIPO 3D Model Workflow - Complete Documentation

## 📋 **Overview**

This document maps the **complete TRIPO image-to-model workflow** in your ARrange app. This will serve as a reference before implementing multi-view functionality.

---

## 🎯 **Current System: Image-to-Model (TRIPO v2.5)**

### **Configuration:**
- **API:** TRIPO 3D AI v2
- **Model Version:** v2.5-20250123
- **Input:** Single product image (JPG/PNG)
- **Output:** GLB 3D model
- **Textures:** ✅ Enabled
- **PBR Materials:** ✅ Enabled
- **Quality:** High
- **Processing Time:** 5-15 minutes

---

## 🔄 **Complete Workflow - Step by Step**

### **PHASE 1: Seller Creates Product with 3D Model**

#### **Step 1: Seller Opens "Create Product" Screen**
- **File:** `src/screens/seller/UploadItem.jsx`
- **Navigation:** Seller Tab → Home → "+" button → UploadItem
- **State:** Product form with 5 steps (Photos, Basic Info, Details, Technical, Review)

#### **Step 2: Seller Clicks "Create 3D Model" Button**
- **Location:** `UploadItem.jsx` line 1539-1631
- **Button:** "Create 3D Model" (shows as "TRIPO 3D Model ✓" after completion)
- **Action:** 
  ```javascript
  navigation.navigate('TripoScanner', {
    productId: null,  // NEW product - no ID yet
    productName: name,
    isTemporary: true  // Flag for new products
  });
  ```

#### **Step 3: TripoScanner - Image Capture/Selection**
- **File:** `src/AR_KIRI/TripoScanner.jsx`
- **Options:**
  1. Take Photo (camera)
  2. Choose from Gallery
- **UI:** Shows selected image preview
- **Button:** "Generate 3D Model" (green button)

#### **Step 4: Start TRIPO Task**
- **Function:** `handleStartGeneration()` in TripoScanner.jsx (line 78)
- **API Call:** `startTripoImageToModel()` from `src/api/tripoApi.js`
- **Request:**
  ```javascript
  {
    productId: null,  // For new products
    imageUri: selectedImage.uri,
    fileName: 'product_image.jpg',
    fileType: 'image/jpeg'
  }
  ```

#### **Step 5: Backend Processes Image**
- **Endpoint:** `POST /api/ar/tripo/start`
- **File:** `server/routes/arWebhookTripo.js`
- **Process:**
  1. Receives image via FormData
  2. Uploads image to Cloudinary
  3. Sends Cloudinary URL to TRIPO API
  4. Creates image-to-model task
  5. Returns `task_id`

- **TRIPO API Request** (server/services/tripoClient.js):
  ```javascript
  {
    type: 'image_to_model',
    model_version: 'v2.5-20250123',
    file: {
      type: 'jpg',
      url: cloudinaryImageUrl
    },
    texture: true,
    pbr: true
  }
  ```

#### **Step 6: Event Emitted to UploadItem**
- **Event:** `TRIPO_SCAN_COMPLETE` (TripoScanner.jsx line 125)
- **Data Sent:**
  ```javascript
  {
    success: true,
    productId: null,
    productName: name,
    taskId: task_id,
    scanData: {
      task_id: task_id,
      status: 'processing',
      source: 'tripo',
      timestamp: Date.now(),
      isTemporary: true
    }
  }
  ```

#### **Step 7: UploadItem Stores AR Data**
- **Listener:** `UploadItem.jsx` line 189-201
- **State Updates:**
  ```javascript
  setArScanData(scanData);
  setHasAR(true);
  ```
- **Alert:** "3D Model Generation Started!"
- **Storage:** Data stored in component state (NOT in database yet)

#### **Step 8: Seller Completes Product Form**
- **Action:** Seller fills remaining fields and clicks "Create Product"
- **Function:** `handleSubmit()` in UploadItem.jsx (line 681)

#### **Step 9: Product Created with Pending AR Data**
- **API Call:** `createProduct(productData)` from `src/api/productApi.js`
- **Product Data Includes:**
  ```javascript
  {
    name, price, description, category, images, etc.,
    hasAR: true,
    arScanData: {
      task_id: 'tripo_task_xxx',
      status: 'processing',
      source: 'tripo'
    },
    arModelSource: 'tripo',
    arModelType: null,
    arModelUrl: null  // Not ready yet
  }
  ```

#### **Step 10: Backend Creates Product & Starts Polling**
- **Endpoint:** `POST /api/products`
- **File:** `server/routes/productRoutesSupabase.js`
- **Database Insert:**
  ```sql
  INSERT INTO products (
    name, price, description,
    has_ar: true,
    ar_build_status: 'processing',
    ar_scan_data: {...}
  )
  ```

#### **Step 11: Trigger Background TRIPO Polling**
- **Frontend:** `UploadItem.jsx` line 826-879
- **API Call:** `POST /api/ar/tripo/process`
- **Payload:**
  ```javascript
  {
    task_id: 'tripo_task_xxx',
    product_id: 'product_uuid'  // Actual product ID
  }
  ```

---

### **PHASE 2: Background TRIPO Processing**

#### **Step 12: Backend Polls TRIPO Task**
- **Function:** `handleTripoTaskCompletion()` in `server/routes/arWebhookTripo.js`
- **Process:**
  1. Updates product: `ar_build_status = 'processing'`
  2. Polls TRIPO every 5 seconds (max 60 attempts = 5 minutes)
  3. Checks task status

#### **Step 13: TRIPO Completes 3D Model**
- **TRIPO Response:**
  ```javascript
  {
    status: 'success',
    progress: 100,
    output: {
      model: 'https://tripo.s3.amazonaws.com/model.glb',
      pbr_model: 'https://tripo.s3.amazonaws.com/model_pbr.glb'
    }
  }
  ```

#### **Step 14: Download and Upload to Supabase**
- **Function:** `uploadModelToSupabase()` in `server/services/supabaseStorage.js`
- **Process:**
  1. Downloads GLB from TRIPO URL
  2. Uploads to Supabase Storage bucket: `ar-models`
  3. Generates public URL
  4. Returns: `publicUrl`, `fileSizeMB`, `path`

#### **Step 15: Update Product with AR Model URL**
- **Database Update:**
  ```sql
  UPDATE products SET
    has_ar = true,
    ar_model = 'https://supabase.../ar-models/product_uuid.glb',
    ar_thumbnail = null,
    ar_build_status = 'completed',
    ar_model_source = 'tripo',
    ar_scan_data = {
      source: 'tripo',
      task_id: 'xxx',
      quality: 'high',
      modelSize: '2.5 MB',
      model_version: 'v2.5-20250123',
      storage: 'supabase'
    }
  WHERE id = product_uuid
  ```

---

### **PHASE 3: Buyer Views AR Model**

#### **Step 16: Buyer Opens Product Detail**
- **File:** `src/screens/buyer/ProductDetail.jsx`
- **Data Loaded:**
  ```javascript
  {
    id: 'product_uuid',
    name: 'Product Name',
    hasAR: true,
    arModel: 'https://supabase.../product_uuid.glb',
    arModelSource: 'tripo'
  }
  ```

#### **Step 17: Buyer Clicks "VIEW AR" Button**
- **Location:** `ProductDetail.jsx` line 1128-1156
- **Condition Check:**
  ```javascript
  if (product.hasAR) {
    // Check for different AR model sources
    if (arModelSource === 'local') {
      // Use local model
    } else if (arModel) {
      // Use TRIPO model (our case)
      navigation.navigate('ViewAR', { product });
    }
  }
  ```

#### **Step 18: ViewAR Screen Opens**
- **File:** `src/screens/buyer/ViewAR.jsx`
- **Model URL Retrieved:**
  ```javascript
  // Line 54-72
  if (product?.arModelSource === 'local') {
    modelUrl = getLocalModelPath('TEST4');
  } else if (product?.arModel) {
    modelUrl = product.arModel;  // TRIPO model URL
    hasModel = true;
  } else if (product?.arScanData?.modelUrl) {
    modelUrl = product.arScanData.modelUrl;  // KIRI fallback
    hasModel = true;
  }
  ```

#### **Step 19: 3D Model Displayed in AR**
- **Technology:** WebView with model-viewer
- **Component:** `ViewAR.jsx` line 379-409
- **HTML Template:**
  ```html
  <model-viewer
    src="${modelUrl}"
    ar
    camera-controls
    auto-rotate
  />
  ```
- **Features:**
  - Camera background (live AR view)
  - 3D model overlay
  - Touch controls (rotate, zoom, pan)
  - AR placement in real world

---

## 📊 **Database Schema for AR Data**

### **Products Table Columns:**
```sql
has_ar BOOLEAN DEFAULT false
ar_model TEXT  -- Supabase public URL
ar_thumbnail TEXT
ar_build_status TEXT  -- 'processing', 'completed', 'failed'
ar_model_source TEXT  -- 'tripo', 'kiri', 'local'
ar_scan_data JSONB  -- Metadata
```

### **Example ar_scan_data:**
```json
{
  "source": "tripo",
  "task_id": "tripo_abc123",
  "quality": "high",
  "modelSize": "2.5 MB",
  "progress": 100,
  "timestamp": 1737590400000,
  "model_version": "v2.5-20250123",
  "storage": "supabase",
  "storagePath": "ar-models/product_uuid.glb"
}
```

---

## 🔑 **Key Files Reference**

### **Frontend:**
1. `src/screens/seller/UploadItem.jsx` - Product creation form
2. `src/AR_KIRI/TripoScanner.jsx` - Image capture & TRIPO start
3. `src/api/tripoApi.js` - TRIPO API client
4. `src/screens/buyer/ProductDetail.jsx` - Product view & AR button
5. `src/screens/buyer/ViewAR.jsx` - AR viewer

### **Backend:**
1. `server/routes/arWebhookTripo.js` - TRIPO task handling
2. `server/services/tripoClient.js` - TRIPO API service
3. `server/services/supabaseStorage.js` - Model storage
4. `server/routes/productRoutesSupabase.js` - Product CRUD

---

## 🎯 **Critical Points for Multi-View Implementation**

### **What MUST Stay the Same:**
✅ Database schema (has_ar, ar_model, ar_scan_data, etc.)
✅ ViewAR.jsx (buyer AR viewing experience)
✅ ProductDetail.jsx AR button logic
✅ Supabase storage system
✅ Background polling system

### **What Will Change:**
🔄 `TripoScanner.jsx` → Accept multiple images
🔄 `src/api/tripoApi.js` → New multi-view endpoint
🔄 `server/services/tripoClient.js` → Multi-view API call
🔄 Task type: `'image_to_model'` → `'multiview_to_model'`

### **New Requirements for Multi-View:**
📸 Capture/select **4-12 images** from different angles
📐 Image validation (angles, quality)
🔄 Updated TRIPO API request format
📊 Progress tracking for multiple images

---

## ✅ **Ready for Multi-View Integration!**

This documentation provides the complete context needed to implement multi-view functionality **without breaking** the existing system.

**Next Step:** Wait for user to provide multi-view API documentation from TRIPO.

---

**Created:** 2026-02-18
**Purpose:** Reference for multi-view implementation
**Status:** ✅ Complete & Ready
