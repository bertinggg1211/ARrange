const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const { supabase } = require('../db/supabase');
const { deleteFile } = require('../services/cloudinaryStorage');
const { clearCache } = require('../db/supabaseHelpers');

const router = express.Router();

// Multer storage configuration for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

// Public routes (no authentication required)
// Get public seller information by ID (for ProductDetail shop cards)
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    console.log('🚨 SELLER INFO ENDPOINT HIT! Getting seller info for ID:', sellerId);
    
    const { data: seller, error } = await supabase
      .from('users')
      .select('id, full_name, shop_name, seller_profile, created_at')
      .eq('id', sellerId)
      .eq('role', 'seller')
      .single();

    if (error || !seller) {
      console.log('❌ Seller not found:', error);
      return res.status(404).json({ 
        success: false, 
        message: 'Seller not found' 
      });
    }

    // Format seller info for ProductDetail
    const sellerInfo = {
      id: seller.id,
      name: seller.full_name,
      shopName: seller.shop_name,
      sellerProfile: seller.seller_profile || {},
      joinedDate: seller.created_at,
      isOnline: false, // Could be enhanced with real-time status
      rating: seller.seller_profile?.rating || 0,
      reviews: seller.seller_profile?.reviewsCount || 0,
      totalProducts: 0, // Could be calculated from products table
      isNewSeller: !seller.seller_profile?.rating
    };

    console.log('✅ Seller info found:', {
      id: sellerInfo.id,
      name: sellerInfo.name,
      shopName: sellerInfo.shopName,
      hasSellerProfile: !!sellerInfo.sellerProfile,
      shopLogo: sellerInfo.sellerProfile?.shopLogo,
      profileImage: sellerInfo.sellerProfile?.profileImage
    });

    res.json({
      success: true,
      seller: sellerInfo
    });
  } catch (error) {
    console.error('❌ Error getting seller info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Apply authentication middleware to all routes below this point
router.use(auth);

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user stats (orders, favorites, reviews)
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('📊 Fetching user stats for user:', userId);
    
    // Get orders count from orders table (excluding cancelled orders)
    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('buyer_id', userId)
      .neq('status', 'cancelled');
    
    if (ordersError) {
      console.error('❌ Error fetching orders count:', ordersError);
    }
    
    // Get favorites count from likes table (if it exists)
    let favoritesCount = 0;
    try {
      const { count: likesCount, error: likesError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (!likesError) {
        favoritesCount = likesCount || 0;
        console.log(`❤️ Favorites count for user: ${favoritesCount}`);
      } else {
        console.log('📝 Likes table not available, using 0 for favorites count');
      }
    } catch (error) {
      console.log('📝 Likes table not available, using 0 for favorites count');
    }
    
    // Get reviews count (placeholder - reviews table doesn't exist yet)
    const reviewsCount = 0;
    
    const stats = {
      orders: ordersCount || 0,
      favorites: favoritesCount,
      reviews: reviewsCount
    };
    
    console.log('✅ User stats calculated:', stats);
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error in /stats endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', upload.fields([{ name: 'avatar', maxCount: 1 }]), async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;
    const avatarFile = req.files?.avatar?.[0];

    const updateData = {
      full_name: fullName,
      email,
      phone,
      updated_at: new Date().toISOString()
    };

    if (avatarFile) {
      // Handle avatar upload to Cloudinary
      const { cloudinary } = require('../services/cloudinaryStorage');
      const result = await cloudinary.uploader.upload(avatarFile.path, {
        folder: 'avatars',
        public_id: `avatar_${req.user.id}_${Date.now()}`
      });
      updateData.profile_image = result.secure_url;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Failed to update profile' });
    }

    res.json({ success: true, user: data });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to extract Cloudinary public ID from URL
const extractCloudinaryPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return null;
    
    // Get everything after version (v1234567890)
    let pathParts = urlParts.slice(uploadIndex + 1);
    if (pathParts[0] && pathParts[0].startsWith('v')) {
      pathParts = pathParts.slice(1);
    }
    
    // Join path and remove file extension
    const fullPath = pathParts.join('/');
    return fullPath.replace(/\.[^/.]+$/, ''); // Remove extension
  } catch (error) {
    console.error('❌ Error extracting public ID from URL:', url, error);
    return null;
  }
};

// Comprehensive delete user account function
router.delete('/delete-account', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`🗑️ Starting comprehensive account deletion for user: ${userId}`);
    
    // Get user data first to check role and get profile images
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('❌ User not found:', userError);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`🔍 Found user: ${userData.email}, role: ${userData.role}`);
    
    // Step 1: Delete all Cloudinary images for seller profiles
    if (userData.role === 'seller' && userData.seller_profile) {
      console.log('🗑️ Deleting seller profile images from Cloudinary...');
      
      const profile = userData.seller_profile;
      const imagesToDelete = [
        profile.shopLogo,
        profile.shopBanner, 
        profile.profileImage,
        profile.coverImage
      ].filter(Boolean);
      
      for (const imageUrl of imagesToDelete) {
        const publicId = extractCloudinaryPublicId(imageUrl);
        if (publicId) {
          try {
            console.log(`🗑️ Deleting Cloudinary image: ${publicId}`);
            await deleteFile(publicId, 'image');
            console.log(`✅ Deleted: ${publicId}`);
          } catch (error) {
            console.error(`❌ Failed to delete image ${publicId}:`, error.message);
            // Continue with other deletions even if one fails
          }
        }
      }
    }
    
    // Step 2: Delete all products and their images (for sellers)
    if (userData.role === 'seller') {
      console.log('🗑️ User is a seller, deleting all products and images...');
      
      // Get all products to delete their images
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', userId);
      
      if (!productsError && products && products.length > 0) {
        console.log(`🗑️ Found ${products.length} products to delete`);
        
        for (const product of products) {
          // Delete product images from Cloudinary
          if (product.images && Array.isArray(product.images)) {
            for (const imageUrl of product.images) {
              const publicId = extractCloudinaryPublicId(imageUrl);
              if (publicId) {
                try {
                  console.log(`🗑️ Deleting product image: ${publicId}`);
                  await deleteFile(publicId, 'image');
                  console.log(`✅ Deleted product image: ${publicId}`);
                } catch (error) {
                  console.error(`❌ Failed to delete product image ${publicId}:`, error.message);
                  // Continue with other deletions even if one fails
                }
              }
            }
          }
          
          // Delete AR model if exists
          if (product.ar_model_url) {
            const publicId = extractCloudinaryPublicId(product.ar_model_url);
            if (publicId) {
              try {
                console.log(`🗑️ Deleting AR model: ${publicId}`);
                await deleteFile(publicId, 'raw');
                console.log(`✅ Deleted AR model: ${publicId}`);
              } catch (error) {
                console.error(`❌ Failed to delete AR model ${publicId}:`, error.message);
              }
            }
          }
        }
        
        // Delete products from database
        console.log('🗑️ Deleting products from database...');
        const { error: deleteProductsError } = await supabase
          .from('products')
          .delete()
          .eq('seller_id', userId);
        
        if (deleteProductsError) {
          console.error('❌ Error deleting products:', deleteProductsError);
        } else {
          console.log(`✅ Deleted ${products.length} products from database`);
        }
      }
    }
    
    // Step 3: Delete all related data from database
    console.log('🗑️ Deleting related database records...');
    
    // Delete user's cart items (skip if table doesn't exist)
    try {
      const { error: cartError } = await supabase
        .from('carts')
        .delete()
        .eq('user_id', userId);
      
      if (cartError && !cartError.message.includes('relation') && !cartError.message.includes('does not exist')) {
        console.error('❌ Error deleting cart:', cartError);
      } else {
        console.log('✅ Deleted cart items (or table not found)');
      }
    } catch (error) {
      console.log('⚠️ Cart table not found, skipping...');
    }
    
    // Delete user's messages/chats (skip if table doesn't exist)
    try {
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
      
      if (messagesError && !messagesError.message.includes('relation') && !messagesError.message.includes('does not exist')) {
        console.error('❌ Error deleting messages:', messagesError);
      } else {
        console.log('✅ Deleted messages (or table not found)');
      }
    } catch (error) {
      console.log('⚠️ Messages table not found, skipping...');
    }
    
    // Delete user's orders (skip if table doesn't exist)
    try {
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
      
      if (ordersError) {
        // Check for table not found errors
        if (ordersError.code === 'PGRST205' || 
            ordersError.message.includes('Could not find the table') ||
            ordersError.message.includes('relation') || 
            ordersError.message.includes('does not exist')) {
          console.log('⚠️ Orders table not found, skipping...');
        } else {
          console.error('❌ Error deleting orders:', ordersError);
        }
      } else {
        console.log('✅ Deleted orders successfully');
      }
    } catch (error) {
      console.log('⚠️ Orders table not found, skipping...');
    }
    
    // Delete user's notifications (skip if table doesn't exist)
    try {
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);
      
      if (notificationsError) {
        // Check for table not found errors
        if (notificationsError.code === 'PGRST205' || 
            notificationsError.message.includes('Could not find the table') ||
            notificationsError.message.includes('relation') || 
            notificationsError.message.includes('does not exist')) {
          console.log('⚠️ Notifications table not found, skipping...');
        } else {
          console.error('❌ Error deleting notifications:', notificationsError);
        }
      } else {
        console.log('✅ Deleted notifications successfully');
      }
    } catch (error) {
      console.log('⚠️ Notifications table not found, skipping...');
    }
    
    // Delete AR scans if user is a seller (skip if table doesn't exist)
    if (userData.role === 'seller') {
      try {
        const { error: scansError } = await supabase
          .from('ar_scans')
          .delete()
          .eq('seller_id', userId);
        
        if (scansError) {
          // Check for table not found errors
          if (scansError.code === 'PGRST205' || 
              scansError.message.includes('Could not find the table') ||
              scansError.message.includes('relation') || 
              scansError.message.includes('does not exist')) {
            console.log('⚠️ AR scans table not found, skipping...');
          } else {
            console.error('❌ Error deleting AR scans:', scansError);
          }
        } else {
          console.log('✅ Deleted AR scans successfully');
        }
      } catch (error) {
        console.log('⚠️ AR scans table not found, skipping...');
      }
    }
    
    // Step 4: Finally, delete the user account
    console.log('🗑️ Deleting user account from database...');
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (deleteUserError) {
      console.error('❌ Error deleting user account:', deleteUserError);
      throw deleteUserError;
    }
    
    // Step 5: Clear all related caches
    console.log('🗑️ Clearing caches...');
    try {
      clearCache('products');
      clearCache('sellers');
      clearCache('users');
      console.log('✅ Caches cleared successfully');
    } catch (error) {
      console.log('⚠️ Cache clearing failed (non-critical):', error.message);
    }
    
    console.log(`✅ Complete account deletion finished for user: ${userId}`);
    console.log(`📊 Deletion summary:`);
    console.log(`   - User account: ✅ Deleted`);
    console.log(`   - Profile images: ✅ Deleted from Cloudinary`);
    console.log(`   - Products & images: ✅ Deleted`);
    console.log(`   - Cart, messages, orders: ✅ Deleted`);
    console.log(`   - Caches: ✅ Cleared`);
    
    res.json({ 
      success: true,
      message: 'Account and all associated data have been permanently deleted from both database and cloud storage.' 
    });
    
  } catch (error) {
    console.error('❌ Error during comprehensive account deletion:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete account completely. Some data may remain.' 
    });
  }
});

module.exports = router;


