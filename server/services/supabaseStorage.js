const { supabase } = require('../db/supabase');
const axios = require('axios');

/**
 * Upload 3D model (GLB file) to Supabase Storage
 * @param {string} modelUrl - URL of the GLB model from TRIPO
 * @param {string} productId - Product ID
 * @returns {Promise<{success: boolean, url: string, publicUrl: string}>}
 */
async function uploadModelToSupabase(modelUrl, productId) {
  try {
    console.log('📥 Downloading model from TRIPO:', modelUrl);

    // Download the GLB file
    const response = await axios.get(modelUrl, {
      responseType: 'arraybuffer',
      timeout: 120000, // 2 minute timeout for large files
    });

    const modelBuffer = Buffer.from(response.data);
    const fileSizeMB = (modelBuffer.length / 1024 / 1024).toFixed(2);
    
    console.log(`📊 Model size: ${fileSizeMB} MB`);

    // Generate unique file path
    const timestamp = Date.now();
    const fileName = `${productId}_${timestamp}.glb`;
    const filePath = `products/${productId}/${fileName}`;

    console.log('📤 Uploading to Supabase Storage:', filePath);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('ar-models')
      .upload(filePath, modelBuffer, {
        contentType: 'model/gltf-binary',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    console.log('✅ Model uploaded to Supabase:', data.path);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('ar-models')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    console.log('🌐 Public URL:', publicUrl);

    return {
      success: true,
      path: data.path,
      publicUrl: publicUrl,
      url: publicUrl, // For backward compatibility
      fileSizeMB: fileSizeMB,
      bucket: 'ar-models',
    };

  } catch (error) {
    console.error('❌ Error uploading model to Supabase:', error);
    throw error;
  }
}

/**
 * Delete 3D model from Supabase Storage
 * @param {string} filePath - The file path in storage (e.g., 'products/123/model.glb')
 * @returns {Promise<{success: boolean}>}
 */
async function deleteModelFromSupabase(filePath) {
  try {
    console.log('🗑️ Deleting model from Supabase:', filePath);

    const { error } = await supabase.storage
      .from('ar-models')
      .remove([filePath]);

    if (error) {
      console.error('❌ Supabase delete error:', error);
      throw new Error(`Failed to delete from Supabase: ${error.message}`);
    }

    console.log('✅ Model deleted from Supabase');

    return {
      success: true,
    };

  } catch (error) {
    console.error('❌ Error deleting model from Supabase:', error);
    throw error;
  }
}

/**
 * Generate thumbnail for AR model (optional)
 * For now, we'll return null and handle thumbnails separately
 * @param {string} modelPath - Path to the model in storage
 * @returns {Promise<{success: boolean, thumbnailUrl: string|null}>}
 */
async function generateModelThumbnail(modelPath) {
  // TODO: Implement thumbnail generation
  // For now, return null
  console.log('📸 Thumbnail generation not implemented yet');
  return {
    success: true,
    thumbnailUrl: null,
  };
}

module.exports = {
  uploadModelToSupabase,
  deleteModelFromSupabase,
  generateModelThumbnail,
};
