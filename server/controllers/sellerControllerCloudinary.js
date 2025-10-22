const { supabase } = require('../db/supabase');
const { deleteFile } = require('../services/cloudinaryStorage');
const { clearCache } = require('../db/supabaseHelpers');

// Get seller profile
const getSellerProfile = async (req, res) => {
  const startTime = Date.now();
  try {
    const sellerId = req.user?.id;
    if (!sellerId) return res.status(400).json({ message: 'Missing user identity' });
    
    console.log('⏱️ [getSellerProfile] Starting request for seller:', sellerId);

    const { data: sellerDoc, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sellerId)
      .single();

    if (error || !sellerDoc) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (sellerDoc.role !== 'seller') {
      return res.status(403).json({ message: 'Access denied. Seller account required.' });
    }

    // Calculate seller stats
    const sellerStats = {
      products: 0, // Will be calculated from products collection later
      orders: sellerDoc.seller_profile?.totalOrders || 0,
      revenue: sellerDoc.seller_profile?.totalSales || 0,
      rating: sellerDoc.seller_profile?.rating || 0,
      isVerified: sellerDoc.seller_profile?.isVerified || false
    };

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('📤 [getSellerProfile] Returning seller data:');
    console.log('- shopName:', sellerDoc.shop_name);
    console.log('- sellerProfile exists:', !!sellerDoc.seller_profile);
    console.log(`⏱️ [getSellerProfile] Request completed in ${duration}ms`);

    res.json({
      success: true,
      seller: {
        id: sellerDoc.id,
        fullName: sellerDoc.full_name,
        email: sellerDoc.email,
        phone: sellerDoc.phone,
        address: sellerDoc.address,
        shopName: sellerDoc.shop_name,
        sellerProfile: sellerDoc.seller_profile,
        stats: sellerStats,
        createdAt: sellerDoc.created_at,
        updatedAt: sellerDoc.updated_at
      }
    });
  } catch (error) {
    console.error('Error getting seller profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update seller profile with Cloudinary support
const updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const updateData = req.body;

    // Debug incoming body and files
    console.log('[updateSellerProfile] body keys:', Object.keys(updateData || {}));
    console.log('[updateSellerProfile] files received:', req.files ? Object.keys(req.files) : 'No files');
    if (req.files) {
      Object.entries(req.files).forEach(([key, files]) => {
        console.log(`[updateSellerProfile] ${key}:`, files.map(f => ({ 
          filename: f.filename, 
          path: f.path, 
          size: f.size 
        })));
      });
    }

    // Normalize values that might arrive as arrays (multer behavior)
    const coerceValue = (v) => Array.isArray(v) ? v[0] : v;

    // Normalize nested fields coming from multipart form data
    const nestedSellerProfile = {};
    Object.keys(updateData || {}).forEach((key) => {
      const match = key.match(/^sellerProfile\[(.+)\]$/);
      if (match) {
        const nestedKey = match[1];
        nestedSellerProfile[nestedKey] = coerceValue(updateData[key]);
      }
    });

    // Support common alias keys
    const aliasMap = {
      description: 'businessDescription',
      businessDescription: 'businessDescription',
      shopDescription: 'businessDescription',
    };
    Object.entries(aliasMap).forEach(([incomingKey, normalizedKey]) => {
      if (updateData[incomingKey] !== undefined && nestedSellerProfile[normalizedKey] === undefined) {
        nestedSellerProfile[normalizedKey] = coerceValue(updateData[incomingKey]);
      }
    });

    if (Object.keys(nestedSellerProfile).length > 0) {
      updateData.sellerProfile = {
        ...(updateData.sellerProfile && typeof updateData.sellerProfile === 'object' ? updateData.sellerProfile : {}),
        ...nestedSellerProfile,
      };
      console.log('[updateSellerProfile] normalized sellerProfile:', updateData.sellerProfile);
    }

    // Validate that user is a seller
    const { data: sellerDoc, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sellerId)
      .single();

    if (error || !sellerDoc) {
      return res.status(403).json({ message: 'Access denied. Seller account required.' });
    }
    
    if (sellerDoc.role !== 'seller') {
      return res.status(403).json({ message: 'Access denied. Seller account required.' });
    }

    // Prepare update object
    const updateFields = {};
    
    // Update basic profile fields
    if (updateData.fullName) updateFields.full_name = updateData.fullName;
    if (updateData.phone) updateFields.phone = updateData.phone;
    if (updateData.address) updateFields.address = updateData.address;
    if (updateData.shopName) updateFields.shop_name = updateData.shopName;

    // Update seller profile fields
    if (updateData.sellerProfile) {
      const currentSellerProfile = sellerDoc.seller_profile && typeof sellerDoc.seller_profile === 'object' ? sellerDoc.seller_profile : {};
      const incomingSellerProfile = updateData.sellerProfile && typeof updateData.sellerProfile === 'object' ? updateData.sellerProfile : {};
      
      // Merge profiles but preserve existing image paths if incoming ones are empty
      updateFields.seller_profile = {
        ...currentSellerProfile,
        ...incomingSellerProfile,
        // Preserve existing image paths if incoming are empty strings
        profileImage: incomingSellerProfile.profileImage || currentSellerProfile.profileImage || '',
        coverImage: incomingSellerProfile.coverImage || currentSellerProfile.coverImage || '',
        shopLogo: incomingSellerProfile.shopLogo || currentSellerProfile.shopLogo || '',
        shopBanner: incomingSellerProfile.shopBanner || currentSellerProfile.shopBanner || '',
      };
      
      if (incomingSellerProfile.businessDescription !== undefined) {
        updateFields.seller_profile.businessDescription = incomingSellerProfile.businessDescription;
      }
      console.log('[updateSellerProfile] merged sellerProfile for save:', updateFields.seller_profile);
    }

    // Handle uploaded files with Cloudinary URLs
    console.log('🔍 [updateSellerProfile] Files check:');
    console.log('- req.files exists:', !!req.files);
    console.log('- req.files keys:', req.files ? Object.keys(req.files) : 'N/A');
    
    if (req.files && Object.keys(req.files).length > 0) {
      const removeOldCloudinaryFile = async (urlPath) => {
        try {
          if (!urlPath || typeof urlPath !== 'string') return;
          
          // Handle both old local files and Cloudinary URLs
          if (urlPath.startsWith('/uploads/')) {
            // Old local file - remove from filesystem
            const fs = require('fs');
            const path = require('path');
            const absPath = path.join(__dirname, '..', urlPath);
            if (fs.existsSync(absPath)) {
              fs.unlinkSync(absPath);
              console.log('🗑️ Deleted old local file:', urlPath);
            }
          } else if (urlPath.includes('cloudinary.com')) {
            // Cloudinary URL - extract public_id and delete from Cloudinary
            const urlParts = urlPath.split('/');
            const fileWithExt = urlParts[urlParts.length - 1];
            const publicId = fileWithExt.split('.')[0];
            
            // Find the folder structure in the URL
            const folderIndex = urlParts.findIndex(part => part === 'sellers');
            if (folderIndex !== -1 && folderIndex < urlParts.length - 2) {
              const folder = urlParts.slice(folderIndex, -1).join('/');
              const fullPublicId = `${folder}/${publicId}`;
              await deleteFile(fullPublicId, 'image');
              console.log('🗑️ Deleted old Cloudinary image:', fullPublicId);
            }
          }
        } catch (error) {
          console.warn('Failed to delete old file:', error.message);
        }
      };

      const nextSellerProfile = { ...sellerDoc.seller_profile };

      if (req.files.avatar?.[0]) {
        await removeOldCloudinaryFile(sellerDoc?.seller_profile?.profileImage);
        nextSellerProfile.profileImage = req.files.avatar[0].path; // Cloudinary URL
        console.log('✅ [updateSellerProfile] Set avatar to:', nextSellerProfile.profileImage);
      }
      if (req.files.cover?.[0]) {
        await removeOldCloudinaryFile(sellerDoc?.seller_profile?.coverImage);
        nextSellerProfile.coverImage = req.files.cover[0].path; // Cloudinary URL
        console.log('✅ [updateSellerProfile] Set cover to:', nextSellerProfile.coverImage);
      }
      if (req.files.shopLogo?.[0]) {
        console.log('✅ [updateSellerProfile] Processing shopLogo:', req.files.shopLogo[0].filename);
        await removeOldCloudinaryFile(sellerDoc?.seller_profile?.shopLogo);
        nextSellerProfile.shopLogo = req.files.shopLogo[0].path; // Cloudinary URL
        console.log('✅ [updateSellerProfile] Set shopLogo to:', nextSellerProfile.shopLogo);
      } else {
        console.log('❌ [updateSellerProfile] No shopLogo file found');
      }
      if (req.files.shopBanner?.[0]) {
        console.log('✅ [updateSellerProfile] Processing shopBanner:', req.files.shopBanner[0].filename);
        await removeOldCloudinaryFile(sellerDoc?.seller_profile?.shopBanner);
        nextSellerProfile.shopBanner = req.files.shopBanner[0].path; // Cloudinary URL
        console.log('✅ [updateSellerProfile] Set shopBanner to:', nextSellerProfile.shopBanner);
      } else {
        console.log('❌ [updateSellerProfile] No shopBanner file found');
      }

      // Merge file updates without clobbering textual updates like businessDescription
      updateFields.seller_profile = {
        ...updateFields.seller_profile,
        ...nextSellerProfile,
      };
      console.log('🔍 [updateSellerProfile] Final merged sellerProfile:', updateFields.seller_profile);
    } else {
      // If no files uploaded, preserve existing image paths
      console.log('[updateSellerProfile] No files uploaded, preserving existing images');
      if (updateFields.seller_profile) {
        const currentProfile = sellerDoc.seller_profile || {};
        updateFields.seller_profile = {
          ...currentProfile,
          ...updateFields.seller_profile,
          // Preserve existing images if not being updated
          profileImage: updateFields.seller_profile.profileImage || currentProfile.profileImage || '',
          coverImage: updateFields.seller_profile.coverImage || currentProfile.coverImage || '',
          shopLogo: updateFields.seller_profile.shopLogo || currentProfile.shopLogo || '',
          shopBanner: updateFields.seller_profile.shopBanner || currentProfile.shopBanner || '',
        };
      }
    }

    // Add updated timestamp
    updateFields.updated_at = new Date().toISOString();

    // Update in Supabase
    let { data: updatedDoc, error: updateError } = await supabase
      .from('users')
      .update(updateFields)
      .eq('id', sellerId)
      .select()
      .single();

    if (updateError) {
      console.error('[updateSellerProfile] Update error:', updateError);
      console.error('[updateSellerProfile] Update fields that failed:', JSON.stringify(updateFields, null, 2));
      throw updateError;
    }

    if (!updatedDoc) {
      console.error('[updateSellerProfile] No document returned after update');
      // Fetch the updated document manually
      const { data: fetchedDoc, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', sellerId)
        .single();
      
      if (fetchError || !fetchedDoc) {
        console.error('[updateSellerProfile] Failed to fetch updated document:', fetchError);
        throw new Error('Update completed but failed to retrieve updated data');
      }
      
      console.log('[updateSellerProfile] Manually fetched updated document');
      updatedDoc = fetchedDoc;
    }

    console.log('[updateSellerProfile] saved. New businessDescription:', updatedDoc?.seller_profile?.businessDescription);
    console.log('[updateSellerProfile] saved. New shopBanner:', updatedDoc?.seller_profile?.shopBanner);
    console.log('[updateSellerProfile] saved. New shopLogo:', updatedDoc?.seller_profile?.shopLogo);
    console.log('[updateSellerProfile] saved. New profileImage:', updatedDoc?.seller_profile?.profileImage);

    // Clear sellers cache so updated shop info appears in buyer feed immediately
    console.log('🗑️ Clearing sellers cache after profile update...');
    clearCache('sellers');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      seller: {
        id: updatedDoc.id,
        fullName: updatedDoc.full_name,
        email: updatedDoc.email,
        phone: updatedDoc.phone,
        address: updatedDoc.address,
        shopName: updatedDoc.shop_name,
        sellerProfile: updatedDoc.seller_profile,
        updatedAt: updatedDoc.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating seller profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get seller dashboard stats
const getSellerStats = async (req, res) => {
  const startTime = Date.now();
  console.log('🚨🚨🚨 STATS ENDPOINT HIT! 🚨🚨🚨');
  try {
    const sellerId = req.user.id;
    
    console.log('⏱️ [getSellerStats] Starting request for seller:', sellerId);
    console.log('🔍 [getSellerStats] User object:', { id: req.user.id, email: req.user.email, role: req.user.role });
    
    const { data: sellerDoc, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sellerId)
      .single();

    if (error || !sellerDoc) {
      return res.status(403).json({ message: 'Access denied. Seller account required.' });
    }
    
    if (sellerDoc.role !== 'seller') {
      return res.status(403).json({ message: 'Access denied. Seller account required.' });
    }

    // Calculate comprehensive stats from database
    console.log('📊 [getSellerStats] Calculating comprehensive stats...');
    
    const stats = {
      products: 0,
      totalSales: 0,
      orders: 0,
      rating: 0,
      followers: 0,
      revenue: 0,
      isVerified: sellerDoc.seller_profile?.isVerified || false,
      joinDate: sellerDoc.seller_profile?.joinDate || sellerDoc.created_at
    };

    // 1. Get product stats
    try {
      console.log(`🔍 [getSellerStats] Querying products for seller_id: ${sellerId}`);
      
      // First, let's see what products exist in the database
      const { data: allProducts, error: allProductsError } = await supabase
        .from('products')
        .select('id, seller_id, name')
        .limit(10);
      
      console.log(`🔍 [getSellerStats] All products in database:`, {
        error: allProductsError,
        count: allProducts?.length || 0,
        products: allProducts?.map(p => ({ id: p.id, seller_id: p.seller_id, name: p.name })) || []
      });
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, price, stock_quantity, seller_id')
        .eq('seller_id', sellerId);

      console.log(`🔍 [getSellerStats] Products query result:`, {
        error: productsError,
        productsFound: products?.length || 0,
        products: products?.map(p => ({ id: p.id, seller_id: p.seller_id })) || []
      });

      if (productsError) {
        console.error(`❌ [getSellerStats] Products query error:`, productsError);
      }

      if (!productsError && products) {
        stats.products = products.length;
        
        // Note: sold_count and rating columns don't exist in current schema
        // Using defaults for now
        stats.totalSales = 0; // Would need sold_count column
        stats.rating = 0; // Would need rating column or separate reviews table
        
        console.log(`📊 [getSellerStats] Final stats - Products: ${stats.products}, Sales: ${stats.totalSales}, Rating: ${stats.rating}`);
      } else {
        console.log(`⚠️ [getSellerStats] No products found or query failed`);
      }
    } catch (error) {
      console.log('⚠️ Error fetching products for stats:', error.message);
    }

    // 2. Get orders and revenue (if tables exist)
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, status')
        .eq('seller_id', sellerId)
        .neq('status', 'cancelled');

      if (!ordersError && orders) {
        stats.orders = orders.length;
        stats.revenue = orders
          .filter(order => order.status === 'completed' || order.status === 'delivered')
          .reduce((sum, order) => sum + (order.total_amount || 0), 0);
        
        console.log(`📊 Orders: ${stats.orders}, Revenue: ₱${stats.revenue}`);
      }
    } catch (error) {
      console.log('⚠️ Orders table not available, using defaults');
    }

    // 3. Get followers count (if table exists)
    try {
      const { data: followers, error: followersError } = await supabase
        .from('followers')
        .select('id')
        .eq('seller_id', sellerId);

      if (!followersError && followers) {
        stats.followers = followers.length;
        console.log(`📊 Followers: ${stats.followers}`);
      }
    } catch (error) {
      console.log('⚠️ Followers table not available, using default');
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ [getSellerStats] Request completed in ${duration}ms`);
    console.log('📊 Stats returned:', stats);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting seller stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update business information
const updateBusinessInfo = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const businessData = req.body;

    const { data: sellerDoc, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sellerId)
      .single();

    if (error || !sellerDoc) {
      return res.status(403).json({ message: 'Access denied. Seller account required.' });
    }
    
    if (sellerDoc.role !== 'seller') {
      return res.status(403).json({ message: 'Access denied. Seller account required.' });
    }

    const updatedSellerProfile = {
      ...sellerDoc.seller_profile,
      ...businessData,
      updatedAt: new Date().toISOString()
    };

    const { data: updatedDoc, error: updateError } = await supabase
      .from('users')
      .update({ 
        seller_profile: updatedSellerProfile,
        updated_at: new Date().toISOString() 
      })
      .eq('id', sellerId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Business information updated successfully',
      seller: {
        id: updatedDoc.id,
        sellerProfile: updatedDoc.seller_profile
      }
    });
  } catch (error) {
    console.error('Error updating business info:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete seller profile image with Cloudinary support
const deleteSellerProfileImage = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { imageType } = req.body; // 'shopBanner' or 'shopLogo'

    console.log('🗑️ Delete request - Image type:', imageType);

    const { data: sellerDoc, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sellerId)
      .single();

    if (error || !sellerDoc) {
      return res.status(403).json({ message: 'Access denied. Seller account required.' });
    }
    
    if (sellerDoc.role !== 'seller') {
      return res.status(403).json({ message: 'Access denied. Seller account required.' });
    }

    const currentProfile = sellerDoc.seller_profile || {};
    const imageUrl = currentProfile[imageType];

    if (imageUrl) {
      // Delete from Cloudinary
      if (imageUrl.includes('cloudinary.com')) {
        try {
          const urlParts = imageUrl.split('/');
          const fileWithExt = urlParts[urlParts.length - 1];
          const publicId = fileWithExt.split('.')[0];
          
          // Find the folder structure in the URL
          const folderIndex = urlParts.findIndex(part => part === 'sellers');
          if (folderIndex !== -1 && folderIndex < urlParts.length - 2) {
            const folder = urlParts.slice(folderIndex, -1).join('/');
            const fullPublicId = `${folder}/${publicId}`;
            await deleteFile(fullPublicId, 'image');
            console.log('🗑️ Deleted Cloudinary image:', fullPublicId);
          }
        } catch (error) {
          console.warn('Failed to delete from Cloudinary:', error.message);
        }
      } else if (imageUrl.startsWith('/uploads/')) {
        // Delete old local file
        try {
          const fs = require('fs');
          const path = require('path');
          const absPath = path.join(__dirname, '..', imageUrl);
          if (fs.existsSync(absPath)) {
            fs.unlinkSync(absPath);
            console.log('🗑️ Deleted local file:', imageUrl);
          }
        } catch (error) {
          console.warn('Failed to delete local file:', error.message);
        }
      }
    }

    // Update database
    const updatedProfile = { ...currentProfile };
    delete updatedProfile[imageType];

    const { data: updatedDoc, error: updateError } = await supabase
      .from('users')
      .update({ 
        seller_profile: updatedProfile,
        updated_at: new Date().toISOString() 
      })
      .eq('id', sellerId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: `${imageType} deleted successfully`,
      seller: {
        id: updatedDoc.id,
        sellerProfile: updatedDoc.seller_profile
      }
    });
  } catch (error) {
    console.error('Error deleting seller profile image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSellerProfile,
  updateSellerProfile,
  getSellerStats,
  updateBusinessInfo,
  deleteSellerProfileImage
};
