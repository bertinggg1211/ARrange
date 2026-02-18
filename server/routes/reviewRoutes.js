const express = require('express');
const router = express.Router();
const { supabase } = require('../db/supabase');
const authenticateToken = require('../middleware/auth');

// =============================================
// REVIEW ROUTES FOR AR E-COMMERCE APP
// Product Reviews + Shop Reviews
// =============================================

// =============================================
// PRODUCT REVIEWS
// =============================================

// POST /api/reviews/product - Create product review
router.post('/product', authenticateToken, async (req, res) => {
  try {
    const { productId, orderId, rating, comment, reviewTitle, images } = req.body;
    const buyerId = req.user.id;

    console.log('⭐ Creating product review:', { productId, orderId, rating, buyerId });

    // Validation
    if (!productId || !orderId || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID, Order ID, and rating are required' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 1 and 5' 
      });
    }

    // Verify order exists and belongs to buyer
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, seller_id, buyer_id')
      .eq('id', orderId)
      .eq('buyer_id', buyerId)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or does not belong to you' 
      });
    }

    // Check order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only review delivered orders' 
      });
    }

    // Verify product is in this order
    const { data: orderItem, error: itemError } = await supabase
      .from('order_items')
      .select('product_id')
      .eq('order_id', orderId)
      .eq('product_id', productId)
      .single();

    if (itemError || !orderItem) {
      console.error('❌ Product not in order:', itemError);
      return res.status(400).json({ 
        success: false, 
        message: 'Product not found in this order' 
      });
    }

    // Check if review already exists for this product in this order
    const { data: existingReview, error: checkError } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('buyer_id', buyerId)
      .eq('order_id', orderId)
      .single();

    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reviewed this product for this order' 
      });
    }

    // Create review
    const reviewData = {
      product_id: productId,
      buyer_id: buyerId,
      seller_id: order.seller_id,
      order_id: orderId,
      rating: rating,
      comment: comment || null,
      review_title: reviewTitle || null,
      images: images ? JSON.stringify(images) : '[]',
      verified_purchase: true,
      status: 'active'
    };

    const { data: review, error: reviewError } = await supabase
      .from('product_reviews')
      .insert(reviewData)
      .select()
      .single();

    if (reviewError) {
      console.error('❌ Error creating review:', reviewError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create review',
        error: reviewError.message 
      });
    }

    console.log('✅ Product review created:', review.id);

    res.status(201).json({
      success: true,
      message: 'Product review submitted successfully',
      review: review
    });

  } catch (error) {
    console.error('❌ Error in POST /api/reviews/product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/reviews/product/:productId - Get all reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 20, offset = 0, sortBy = 'recent' } = req.query;

    console.log('📖 Fetching product reviews:', productId);

    // Build query
    let query = supabase
      .from('product_reviews')
      .select(`
        *,
        buyer:users!buyer_id (
          id,
          full_name
        )
      `)
      .eq('product_id', productId)
      .eq('status', 'active')
      .range(offset, offset + limit - 1);

    // Sort
    if (sortBy === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'helpful') {
      query = query.order('helpful_count', { ascending: false });
    } else if (sortBy === 'rating_high') {
      query = query.order('rating', { ascending: false });
    } else if (sortBy === 'rating_low') {
      query = query.order('rating', { ascending: true });
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error('❌ Error fetching reviews:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch reviews' 
      });
    }

    // Get average rating and stats
    const { data: stats } = await supabase
      .rpc('get_product_average_rating', { p_product_id: productId });

    console.log('✅ Fetched', reviews.length, 'product reviews');

    res.json({
      success: true,
      reviews: reviews,
      stats: stats && stats.length > 0 ? stats[0] : {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /api/reviews/product/:productId:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// PUT /api/reviews/product/:reviewId - Update product review
router.put('/product/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, reviewTitle, images } = req.body;
    const buyerId = req.user.id;

    console.log('✏️ Updating product review:', reviewId);

    // Verify review belongs to user
    const { data: review, error: checkError } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('id', reviewId)
      .eq('buyer_id', buyerId)
      .single();

    if (checkError || !review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found or does not belong to you' 
      });
    }

    // Update review
    const updateData = {};
    if (rating) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;
    if (reviewTitle !== undefined) updateData.review_title = reviewTitle;
    if (images) updateData.images = JSON.stringify(images);

    const { data: updatedReview, error: updateError } = await supabase
      .from('product_reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating review:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update review' 
      });
    }

    console.log('✅ Product review updated:', reviewId);

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: updatedReview
    });

  } catch (error) {
    console.error('❌ Error in PUT /api/reviews/product/:reviewId:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// DELETE /api/reviews/product/:reviewId - Delete product review
router.delete('/product/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const buyerId = req.user.id;

    console.log('🗑️ Deleting product review:', reviewId);

    // Soft delete - just update status
    const { data: review, error } = await supabase
      .from('product_reviews')
      .update({ status: 'deleted' })
      .eq('id', reviewId)
      .eq('buyer_id', buyerId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error deleting review:', error);
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found or does not belong to you' 
      });
    }

    console.log('✅ Product review deleted:', reviewId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error in DELETE /api/reviews/product/:reviewId:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// =============================================
// SHOP REVIEWS
// =============================================

// POST /api/reviews/shop - Create shop review
router.post('/shop', authenticateToken, async (req, res) => {
  try {
    const { 
      sellerId, 
      orderId, 
      overallRating, 
      communicationRating,
      shippingSpeedRating,
      productQualityRating,
      comment, 
      reviewTitle 
    } = req.body;
    const buyerId = req.user.id;

    console.log('⭐ Creating shop review:', { sellerId, orderId, overallRating, buyerId });

    // Validation
    if (!sellerId || !orderId || !overallRating) {
      return res.status(400).json({ 
        success: false, 
        message: 'Seller ID, Order ID, and overall rating are required' 
      });
    }

    if (overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Overall rating must be between 1 and 5' 
      });
    }

    // Verify order exists and belongs to buyer
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, seller_id, buyer_id')
      .eq('id', orderId)
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or does not belong to you' 
      });
    }

    // Check order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only review delivered orders' 
      });
    }

    // Check if shop review already exists for this order
    const { data: existingReview, error: checkError } = await supabase
      .from('shop_reviews')
      .select('id')
      .eq('seller_id', sellerId)
      .eq('buyer_id', buyerId)
      .eq('order_id', orderId)
      .single();

    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reviewed this shop for this order' 
      });
    }

    // Create shop review
    const reviewData = {
      seller_id: sellerId,
      buyer_id: buyerId,
      order_id: orderId,
      overall_rating: overallRating,
      communication_rating: communicationRating || null,
      shipping_speed_rating: shippingSpeedRating || null,
      product_quality_rating: productQualityRating || null,
      comment: comment || null,
      review_title: reviewTitle || null,
      verified_purchase: true,
      status: 'active'
    };

    const { data: review, error: reviewError } = await supabase
      .from('shop_reviews')
      .insert(reviewData)
      .select()
      .single();

    if (reviewError) {
      console.error('❌ Error creating shop review:', reviewError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create shop review',
        error: reviewError.message 
      });
    }

    console.log('✅ Shop review created:', review.id);

    res.status(201).json({
      success: true,
      message: 'Shop review submitted successfully',
      review: review
    });

  } catch (error) {
    console.error('❌ Error in POST /api/reviews/shop:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/reviews/shop/:sellerId - Get all reviews for a shop
router.get('/shop/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { limit = 20, offset = 0, sortBy = 'recent' } = req.query;

    console.log('📖 Fetching shop reviews:', sellerId);

    // Build query
    let query = supabase
      .from('shop_reviews')
      .select(`
        *,
        buyer:users!buyer_id (
          id,
          full_name
        )
      `)
      .eq('seller_id', sellerId)
      .eq('status', 'active')
      .range(offset, offset + limit - 1);

    // Sort
    if (sortBy === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'helpful') {
      query = query.order('helpful_count', { ascending: false });
    } else if (sortBy === 'rating_high') {
      query = query.order('overall_rating', { ascending: false });
    } else if (sortBy === 'rating_low') {
      query = query.order('overall_rating', { ascending: true });
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error('❌ Error fetching shop reviews:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch shop reviews' 
      });
    }

    // Get average ratings and stats
    const { data: stats } = await supabase
      .rpc('get_shop_average_rating', { p_seller_id: sellerId });

    console.log('✅ Fetched', reviews.length, 'shop reviews');

    res.json({
      success: true,
      reviews: reviews,
      stats: stats && stats.length > 0 ? stats[0] : {
        overall_rating: 0,
        communication_rating: 0,
        shipping_speed_rating: 0,
        product_quality_rating: 0,
        total_reviews: 0,
        rating_distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /api/reviews/shop/:sellerId:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// =============================================
// SELLER REVIEWS (Seller viewing their reviews)
// =============================================

// GET /api/seller/reviews - Get all reviews for current seller
router.get('/seller/all', authenticateToken, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    console.log('📖 Fetching all reviews for seller:', sellerId);

    // Get product reviews
    const { data: productReviews, error: productError } = await supabase
      .from('product_reviews')
      .select(`
        *,
        buyer:users!buyer_id (
          id,
          full_name
        ),
        product:products (
          id,
          name,
          images
        )
      `)
      .eq('seller_id', sellerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (productError) {
      console.error('❌ Error fetching product reviews:', productError);
    }

    // Get shop reviews
    const { data: shopReviews, error: shopError } = await supabase
      .from('shop_reviews')
      .select(`
        *,
        buyer:users!buyer_id (
          id,
          full_name
        )
      `)
      .eq('seller_id', sellerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (shopError) {
      console.error('❌ Error fetching shop reviews:', shopError);
    }

    // Get stats
    const { data: productStats } = await supabase
      .rpc('get_product_average_rating', { p_product_id: null });
    
    const { data: shopStats } = await supabase
      .rpc('get_shop_average_rating', { p_seller_id: sellerId });

    console.log('✅ Fetched reviews for seller');

    res.json({
      success: true,
      productReviews: productReviews || [],
      shopReviews: shopReviews || [],
      stats: {
        shop: shopStats && shopStats.length > 0 ? shopStats[0] : {
          overall_rating: 0,
          total_reviews: 0,
          rating_distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
        },
        totalProductReviews: productReviews ? productReviews.length : 0,
        totalShopReviews: shopReviews ? shopReviews.length : 0
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /api/seller/reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;
