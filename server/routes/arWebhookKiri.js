const express = require('express');
const { verifyWebhookSignature } = require('../services/kiriClient');
const { cloudinary, generateARThumbnail } = require('../services/cloudinaryStorage');

const router = express.Router();

// Capture raw body for signature verification
router.post('/kiri', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const signature = req.header('x-kiri-signature') || req.header('x-signature') || '';
    const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : '';

    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).send('invalid signature');
    }

    let payload = {};
    try { payload = JSON.parse(rawBody); } catch (_) {}

    const jobId = payload.jobId || payload.id || payload.taskId;
    const status = payload.status;
    const productId = payload.productId; // we passed this when creating the job

    console.log('KIRI webhook:', { jobId, status, productId });

    const { supabase } = require('../db/supabase');

    if (!productId) {
      return res.status(400).send('missing productId');
    }

    // Get the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Product not found:', productId);
      return res.status(404).send('product not found');
    }

    // Progress update
    if (status === 'progress') {
      const { error } = await supabase
        .from('products')
        .update({ 
          ar_build_status: 'processing', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', productId);
      
      if (error) console.error('Error updating product status:', error);
      return res.status(200).send('ok');
    }

    if (status === 'failed') {
      const { error } = await supabase
        .from('products')
        .update({ 
          ar_build_status: 'failed', 
          has_ar: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', productId);
      
      if (error) console.error('Error updating product status:', error);
      return res.status(200).send('ok');
    }

    if (status === 'completed') {
      // Expected result url(s)
      const resultUrl = payload.resultUrl || payload.outputUrl || (payload.outputs && payload.outputs.glb);
      if (!resultUrl) {
        const { error } = await supabase
          .from('products')
          .update({ 
            ar_build_status: 'failed', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', productId);
        
        if (error) console.error('Error updating product status:', error);
        return res.status(200).send('no result');
      }

      // Upload to Cloudinary as raw
      const publicId = `products/ar-models/${productId}/model_${Date.now()}`;
      const upload = await cloudinary.uploader.upload(resultUrl, {
        public_id: publicId,
        resource_type: 'raw',
        tags: [productId, 'ar-model'],
      });

      const arModelUrl = upload.secure_url;
      const thumbnailRes = await generateARThumbnail(upload.public_id);
      const arThumbnailUrl = thumbnailRes.success ? thumbnailRes.thumbnailUrl : null;

      // Update product with AR data
      const { error: updateError } = await supabase
        .from('products')
        .update({
          has_ar: true,
          ar_model: arModelUrl,
          ar_thumbnail: arThumbnailUrl,
          ar_build_status: 'completed',
          ar_scan_data: {
            frames: product?.ar_photo_batch?.count || 0,
            quality: 'high',
            modelSize: upload.bytes ? `${Math.round(upload.bytes / 1024 / 1024 * 10) / 10} MB` : undefined,
            vertices: payload.vertices || undefined,
            faces: payload.faces || undefined,
            timestamp: Date.now(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (updateError) {
        console.error('Error updating product with AR data:', updateError);
        return res.status(500).send('update failed');
      }

      return res.status(200).send('ok');
    }

    return res.status(200).send('ignored');
  } catch (error) {
    console.error('KIRI webhook error:', error);
    return res.status(500).send('error');
  }
});

module.exports = router;


