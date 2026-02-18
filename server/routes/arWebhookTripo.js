const express = require('express');
const { pollTaskUntilComplete } = require('../services/tripoClient');
const { uploadModelToSupabase, generateModelThumbnail } = require('../services/supabaseStorage');

const router = express.Router();

/**
 * Start polling a TRIPO task and update product when complete
 * This is called as a background job after task creation
 */
async function handleTripoTaskCompletion(taskId, productId) {
  const { supabase } = require('../db/supabase');

  try {
    console.log(`🔄 Starting TRIPO task polling for product ${productId}, task ${taskId}`);

    // Update status to processing
    await supabase
      .from('products')
      .update({ 
        ar_build_status: 'processing',
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId);

    // Poll until complete (max 5 minutes = 60 attempts * 5s)
    const completedTask = await pollTaskUntilComplete(taskId, 60, 5000);

    // Check if we have the model URL
    const modelUrl = completedTask.output?.model || completedTask.output?.pbr_model;
    
    if (!modelUrl) {
      console.error('❌ No model URL in completed task:', completedTask);
      await supabase
        .from('products')
        .update({ 
          ar_build_status: 'failed',
          has_ar: false,
          updated_at: new Date().toISOString() 
        })
        .eq('id', productId);
      return;
    }

    console.log('📥 Downloading model from TRIPO:', modelUrl);

    // Upload GLB model to Supabase Storage for permanent storage
    const uploadResult = await uploadModelToSupabase(modelUrl, productId);
    const arModelUrl = uploadResult.publicUrl;
    const modelPath = uploadResult.path;
    
    console.log('✅ Model uploaded to Supabase:', arModelUrl);
    console.log('📊 Model size:', uploadResult.fileSizeMB, 'MB');

    // Generate thumbnail (optional, for now returns null)
    const thumbnailRes = await generateModelThumbnail(modelPath);
    const arThumbnailUrl = thumbnailRes.thumbnailUrl;

    // Get product for scan data
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    // Update product with AR data
    const { error: updateError } = await supabase
      .from('products')
      .update({
        has_ar: true,
        ar_model: arModelUrl,
        ar_thumbnail: arThumbnailUrl,
        ar_build_status: 'completed',
        ar_model_source: 'tripo',
        ar_scan_data: {
          source: 'tripo',
          task_id: taskId,
          quality: 'high',
          modelSize: `${uploadResult.fileSizeMB} MB`,
          progress: completedTask.progress,
          timestamp: Date.now(),
          model_version: completedTask.input?.model_version || 'v2.5-20250123',
          storage: 'supabase',
          storagePath: modelPath,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (updateError) {
      console.error('❌ Error updating product with AR data:', updateError);
      throw updateError;
    }

    console.log('🎉 Product successfully updated with TRIPO 3D model!');
    return { success: true, arModelUrl };

  } catch (error) {
    console.error('❌ TRIPO task handling error:', error);

    // Update product status to failed
    await supabase
      .from('products')
      .update({ 
        ar_build_status: 'failed',
        has_ar: false,
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId);

    throw error;
  }
}

/**
 * Endpoint to manually trigger TRIPO task processing
 * Called by frontend after starting a TRIPO task
 */
router.post('/process', express.json(), async (req, res) => {
  try {
    const { task_id, product_id } = req.body;

    if (!task_id || !product_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing task_id or product_id' 
      });
    }
    
    // CRITICAL: Validate that product_id is not the string "null"
    if (product_id === 'null' || product_id === null || product_id === undefined) {
      console.error('❌ Invalid product_id received:', product_id);
      return res.status(400).json({
        success: false,
        error: 'Invalid product_id - cannot be null. Product must be created first.'
      });
    }

    console.log(`📨 Received TRIPO task processing request: task=${task_id}, product=${product_id}`);

    // Start processing in background (don't wait for completion)
    handleTripoTaskCompletion(task_id, product_id).catch(error => {
      console.error('Background TRIPO task processing error:', error);
    });

    // Return immediately
    res.json({ 
      success: true, 
      message: 'TRIPO task processing started',
      task_id,
      product_id 
    });

  } catch (error) {
    console.error('TRIPO process endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Endpoint to check TRIPO task status
 */
router.get('/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { getTaskStatus } = require('../services/tripoClient');

    const status = await getTaskStatus(taskId);
    
    res.json({ 
      success: true, 
      status: status.status,
      progress: status.progress,
      output: status.output,
      data: status
    });

  } catch (error) {
    console.error('TRIPO status check error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
module.exports.handleTripoTaskCompletion = handleTripoTaskCompletion;
