const express = require('express');
const router = express.Router();
const { cloudinary } = require('../services/cloudinaryStorage');

// 🎯 Upload AR model to Cloudinary (for KIRI Engine extracted models)
router.post('/ar-model', async (req, res) => {
  try {
    console.log('📤 Uploading AR model to Cloudinary...');
    const { modelData, fileName = '3DModel.glb', folder = 'ar_models' } = req.body;
    
    if (!modelData) {
      return res.status(400).json({
        success: false,
        message: 'Model data is required'
      });
    }
    
    console.log(`🔄 Uploading model data: ${modelData.substring(0, 100)}...`);
    
    // Convert base64 to buffer
    const fileBuffer = Buffer.from(modelData, 'base64');
    console.log(`📁 File buffer created: ${fileBuffer.length} bytes`);
    
    // Upload model to Cloudinary
    const publicId = `${folder}/kiri_model_${Date.now()}`;
    
    const result = await cloudinary.uploader.upload(`data:model/gltf-binary;base64,${modelData}`, {
      public_id: publicId,
      resource_type: 'raw',
      format: 'glb',
      tags: ['kiri-engine', 'ar-model', 'extracted'],
      quality_analysis: true,
      access_mode: 'public'
    });
    
    console.log('✅ AR model uploaded to Cloudinary:', result.secure_url);
    console.log(`📊 Model file size: ${(result.bytes / 1024 / 1024).toFixed(2)} MB`);
    
    res.json({
      success: true,
      secure_url: result.secure_url,
      cloudinaryUrl: result.secure_url,
      public_id: result.public_id,
      bytes: result.bytes,
      format: result.format,
      fileSize: `${(result.bytes / 1024 / 1024).toFixed(2)} MB`
    });
    
  } catch (error) {
    console.error('❌ AR model upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload AR model to Cloudinary',
      error: error.message
    });
  }
});

module.exports = router;