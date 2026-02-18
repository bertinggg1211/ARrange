const express = require('express');
const multer = require('multer');
const { startImageToModelTask } = require('../services/tripoClient');
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

module.exports = router;
