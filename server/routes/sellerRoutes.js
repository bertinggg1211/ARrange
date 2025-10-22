const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const {
  getSellerProfile,
  updateSellerProfile,
  getSellerStats,
  updateBusinessInfo,
  deleteSellerProfileImage
} = require('../controllers/sellerControllerCloudinary');
const { createProduct } = require('../controllers/productController');
const { createSellerProfileUpload } = require('../services/cloudinaryStorage');

// All routes require authentication
router.use(auth);

// Get seller profile (enable caching for performance)
router.get('/profile', (req, res, next) => {
  res.set('Cache-Control', 'private, max-age=60'); // Cache for 1 minute
  res.set('Pragma', 'cache');
  res.set('Expires', new Date(Date.now() + 60000).toUTCString());
  next();
}, getSellerProfile);

// Cloudinary upload for seller profile images (banner, logo, avatar)
const profileUpload = createSellerProfileUpload();

// Update seller profile (supports Cloudinary file uploads)
router.put(
  '/profile',
  profileUpload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
    { name: 'shopLogo', maxCount: 1 },
    { name: 'shopBanner', maxCount: 1 },
  ]),
  updateSellerProfile
);

// Get seller dashboard stats (no caching for real-time updates)
router.get('/stats', (req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
}, getSellerStats);

// Get seller reviews and ratings
router.get('/reviews', async (req, res) => {
  try {
    const { supabase } = require('../db/supabase');
    const sellerId = req.user.id;

    // Get all reviews for this seller
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        buyer_id,
        product_id,
        products!inner(name),
        users!reviews_buyer_id_fkey(full_name, profile_image)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch reviews'
      });
    }

    // Calculate stats
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    // Calculate rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    // Format reviews for frontend
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      buyerName: review.users?.full_name || 'Anonymous',
      buyerAvatar: review.users?.profile_image,
      productName: review.products?.name
    }));

    res.json({
      success: true,
      reviews: formattedReviews,
      stats: {
        totalReviews,
        averageRating,
        ratingDistribution
      }
    });

  } catch (error) {
    console.error('Error in /reviews endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update business information
router.put('/business', updateBusinessInfo);

// Delete profile image (banner or logo)
router.delete('/profile/delete-image', deleteSellerProfileImage);

// Note: Product routes are now handled by productRoutesCloudinary.js

module.exports = router;
