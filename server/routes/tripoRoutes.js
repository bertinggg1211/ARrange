const express = require('express');
const multer = require('multer');
const { startImageToModelTask, startMultiviewToModelTask } = require('../services/tripoClient');
const { cloudinary } = require('../services/cloudinaryStorage');
const { handleTripoTaskCompletion } = require('./arWebhookTripo');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

/**
 * Start TRIPO image-to-model generation
 * POST /api/ar/tripo/start
 */
router.post('/start', upload.single('file'), async (req, res) => {
  try {
    const { productId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file provided' 
      });
    }

    // CRITICAL: Check if productId is valid (not the string "null")
    const isNewProduct = !productId || productId === 'null' || productId === null;
    
    console.log('📸 Received TRIPO start request for product:', productId);
    console.log('📋 Is new product (no ID yet):', isNewProduct);
    console.log('File:', file.originalname, file.mimetype, file.size, 'bytes');

    // Step 1: Upload image to Cloudinary for storage
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `products/tripo-input/${isNewProduct ? 'temp' : productId}`,
          resource_type: 'image',
          public_id: `input_${Date.now()}`,
          tags: [productId || 'temp', 'tripo-input'],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });

    const cloudinaryResult = await uploadPromise;
    const imageUrl = cloudinaryResult.secure_url;

    console.log('✅ Image uploaded to Cloudinary:', imageUrl);

    // Step 2: Start TRIPO task
    const tripoResult = await startImageToModelTask({
      productId: isNewProduct ? null : productId,
      imageUrl,
      modelVersion: 'v2.5-20250123',
    });

    console.log('✅ TRIPO task created:', tripoResult.task_id);

    // Step 3: Start background processing (polling) ONLY for existing products
    if (!isNewProduct) {
      console.log('🔄 Existing product - starting polling immediately');
      handleTripoTaskCompletion(tripoResult.task_id, productId).catch(error => {
        console.error('❌ Background TRIPO processing error:', error);
      });
    } else {
      console.log('📝 New product - polling will be triggered after product creation');
    }

    // Return success response
    res.json({
      success: true,
      task_id: tripoResult.task_id,
      product_id: productId,
      message: 'TRIPO 3D generation started successfully',
    });

  } catch (error) {
    console.error('❌ TRIPO start route error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start TRIPO generation',
    });
  }
});

/**
 * Start TRIPO multi-view-to-model generation
 * POST /api/ar/tripo/start-multiview
 */
router.post('/start-multiview', upload.fields([
  { name: 'front', maxCount: 1 },
  { name: 'left', maxCount: 1 },
  { name: 'back', maxCount: 1 },
  { name: 'right', maxCount: 1 }
]), async (req, res) => {
  try {
    const { productId } = req.body;
    const files = req.files;

    console.log('📸 Received TRIPO multi-view start request');
    console.log('📋 Product ID:', productId);
    console.log('📋 Files received:', {
      front: !!files?.front,
      left: !!files?.left,
      back: !!files?.back,
      right: !!files?.right
    });

    // Validate front image is present
    if (!files?.front || files.front.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Front image is required for multi-view generation'
      });
    }

    // Check if at least 2 images provided
    const imageCount = Object.keys(files).length;
    if (imageCount < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 images are required (front + one other angle)'
      });
    }

    const isNewProduct = !productId || productId === 'null' || productId === null;
    console.log('📋 Is new product (no ID yet):', isNewProduct);

    // Step 1: Upload all images to Cloudinary
    const imageUrls = {};
    const positions = ['front', 'left', 'back', 'right'];

    for (const position of positions) {
      if (files[position] && files[position][0]) {
        const file = files[position][0];
        console.log(`📤 Uploading ${position} image to Cloudinary...`);

        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `products/tripo-multiview/${isNewProduct ? 'temp' : productId}`,
              resource_type: 'image',
              public_id: `${position}_${Date.now()}`,
              tags: [productId || 'temp', 'tripo-multiview', position],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });

        const cloudinaryResult = await uploadPromise;
        imageUrls[position] = cloudinaryResult.secure_url;
        console.log(`✅ ${position} image uploaded:`, cloudinaryResult.secure_url);
      }
    }

    console.log('✅ All images uploaded to Cloudinary');
    console.log('📸 Image URLs:', imageUrls);

    // Step 2: Start TRIPO multi-view task
    const tripoResult = await startMultiviewToModelTask({
      productId: isNewProduct ? null : productId,
      imageUrls,
      modelVersion: 'v3.0-20250812', // Use latest multi-view model
    });

    console.log('✅ TRIPO multi-view task created:', tripoResult.task_id);

    // Step 3: Start background processing (polling) ONLY for existing products
    if (!isNewProduct) {
      console.log('🔄 Existing product - starting polling immediately');
      handleTripoTaskCompletion(tripoResult.task_id, productId).catch(error => {
        console.error('❌ Background TRIPO processing error:', error);
      });
    } else {
      console.log('📝 New product - polling will be triggered after product creation');
    }

    // Return success response
    res.json({
      success: true,
      task_id: tripoResult.task_id,
      product_id: productId,
      message: 'TRIPO multi-view 3D generation started successfully',
      images_uploaded: Object.keys(imageUrls).length
    });

  } catch (error) {
    console.error('❌ TRIPO multi-view start route error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start TRIPO multi-view generation',
    });
  }
});

module.exports = router;
