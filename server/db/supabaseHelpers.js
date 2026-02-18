const { createClient } = require('@supabase/supabase-js');
const { deleteFile } = require('../services/cloudinaryStorage');

// Initialize Supabase client with SERVICE KEY to bypass RLS
// This is needed because we use JWT authentication instead of Supabase Auth
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Simple in-memory cache for performance optimization
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
// Cache helper functions
function getCacheKey(prefix, params = {}) {
  return `${prefix}_${JSON.stringify(params)}`;
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`🚀 Cache HIT for ${key}`);
    return cached.data;
  }
  if (cached) {
    cache.delete(key); // Remove expired cache
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  console.log(`💾 Cached data for ${key}`);
}

function clearCache(pattern = null) {
  if (pattern) {
    // Clear specific cache entries matching pattern
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
        console.log(`🗑️ Cleared cache for ${key}`);
      }
    }
  } else {
    // Clear all cache
    cache.clear();
    console.log('🗑️ Cleared all cache');
  }
}

// Helper functions to replace Couchbase operations with Supabase equivalents

// Get all sellers/shops - OPTIMIZED VERSION WITH CACHING
async function getAllSellers() {
  try {
    const cacheKey = getCacheKey('sellers');
    
    // Check cache first
    const cachedSellers = getFromCache(cacheKey);
    if (cachedSellers) {
      return cachedSellers;
    }
    
    console.log('🏪 Fetching sellers from database with optimized query...');
    
    // Single optimized query using LEFT JOIN to get sellers with product counts
    const { data: sellersWithCounts, error } = await supabase
      .from('users')
      .select(`
        id,
        shop_name,
        full_name,
        email,
        seller_profile,
        created_at,
        products!left(id)
      `)
      .eq('role', 'seller');

    if (error) {
      console.error('❌ Error fetching sellers:', error);
      // If table doesn't exist or no sellers, return empty array
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('📝 Users table not found or no sellers, returning empty array');
        return [];
      }
      throw error;
    }

    console.log('🏪 Found sellers:', sellersWithCounts?.length || 0);

    if (!sellersWithCounts || sellersWithCounts.length === 0) {
      console.log('📝 No sellers found in database');
      return [];
    }

    // Process the joined data to count products per seller
    const sellersMap = new Map();
    
    sellersWithCounts.forEach(row => {
      const sellerId = row.id;
      
      if (!sellersMap.has(sellerId)) {
        sellersMap.set(sellerId, {
          id: row.id,
          shop_name: row.shop_name,
          full_name: row.full_name,
          email: row.email,
          seller_profile: row.seller_profile || {},
          created_at: row.created_at,
          productCount: 0
        });
      }
      
      // Count products (products array will contain product IDs or be empty)
      if (row.products && row.products.length > 0) {
        const seller = sellersMap.get(sellerId);
        seller.productCount = row.products.filter(p => p.id).length;
      }
    });

    const result = Array.from(sellersMap.values());
    console.log('🏪 Optimized sellers with counts:', result.length);
    console.log('🚀 Performance: Single query instead of N+1 queries');
    
    // Cache the result for future requests
    setCache(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('❌ Error in getAllSellers:', error);
    // Return empty array instead of throwing error
    console.log('📝 Returning empty sellers array due to error');
    return [];
  }
}

// Get all products - OPTIMIZED WITH CACHING
async function getAllProducts(filters = {}) {
  try {
    console.log('🚨 getAllProducts called with filters:', filters);
    const cacheKey = getCacheKey('products', filters);
    
    // Check cache first
    const cachedProducts = getFromCache(cacheKey);
    if (cachedProducts) {
      console.log('📦 Returning cached products:', cachedProducts.length);
      console.log('🔍 Cache key:', cacheKey);
      return cachedProducts;
    }
    
    console.log('💾 Cache MISS - fetching fresh data from database');
    
    console.log('📦 Fetching products from database with filters:', filters);
    console.log('🚨 QUERYING ALL PRODUCTS FROM DATABASE');
    
    // Get products without foreign key relationships (to avoid schema issues)
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'active');

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    console.log('🚨 PRODUCTS QUERY RESULT:', {
      error: error,
      dataCount: data?.length || 0,
      hasData: !!data,
      firstProduct: data?.[0] ? { id: data[0].id, name: data[0].name, seller_id: data[0].seller_id } : null
    });
    
    // Debug AR data in products
    if (data && data.length > 0) {
      console.log('🎯 AR Data in database products:', data.map(p => ({
        id: p.id,
        name: p.name,
        has_ar: p.has_ar,
        ar_scan_data: p.ar_scan_data ? 'Present' : 'Missing',
        ar_model_url: p.ar_model_url
      })));
    }
    
    if (error) {
      console.error('❌ Supabase query error:', error);
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('📝 Products table not found, returning empty array');
        return [];
      }
      throw error;
    }
    
    let result = data || [];
    
    // If we have products, get seller information for each
    if (result.length > 0) {
      try {
        console.log('👥 Fetching seller information for products...');
        
        // Get unique seller IDs
        const sellerIds = [...new Set(result.map(p => p.seller_id).filter(Boolean))];
        console.log('👥 Unique seller IDs:', sellerIds);
        
        if (sellerIds.length > 0) {
          // Get seller information
          const { data: sellers, error: sellersError } = await supabase
            .from('users')
            .select('id, full_name, shop_name, seller_profile')
            .in('id', sellerIds);
          
          if (!sellersError && sellers) {
            console.log('👥 Sellers fetched:', sellers.length);
            
            // Add seller information to each product
            result = result.map(product => {
              const seller = sellers.find(s => s.id === product.seller_id);
              if (seller) {
                return {
                  ...product,
                  sellerProfile: seller.seller_profile,
                  shopName: seller.shop_name,
                  sellerName: seller.full_name
                };
              }
              return product;
            });
          } else {
            console.error('❌ Error fetching sellers:', sellersError);
            // Continue with products without seller info instead of failing
            console.log('⚠️ Continuing with products without seller information');
          }
        }
      } catch (sellerError) {
        console.error('❌ Error in seller info fetch:', sellerError);
        // Continue with products without seller info instead of failing
        console.log('⚠️ Continuing with products without seller information due to error');
      }
    }
    
    // Cache the result for future requests
    setCache(cacheKey, result);
    console.log('📦 Products with seller info fetched and cached:', result.length);
    
    return result;
  } catch (error) {
    console.error('❌ Error in getAllProducts:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Return empty array as fallback instead of throwing
    console.log('📝 Returning empty products array due to error');
    return [];
  }
}

// Get seller's products
async function getSellerProducts(sellerId) {
  try {
    console.log('🚨 QUERYING SELLER PRODUCTS FOR SELLER_ID:', sellerId);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    console.log('🚨 SELLER PRODUCTS QUERY RESULT:', {
      error: error,
      dataCount: data?.length || 0,
      hasData: !!data,
      products: data?.map(p => ({ id: p.id, name: p.name, seller_id: p.seller_id })) || []
    });

    if (error) {
      console.error('❌ Supabase query error in getSellerProducts:', error);
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('📝 Products table not found, returning empty array');
        return [];
      }
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Error in getSellerProducts:', error);
    // Return empty array as fallback
    return [];
  }
}

// Get single product
async function getProduct(productId) {
  console.log('🔍 Getting product with ID:', productId);
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      users (
        id,
        full_name,
        shop_name,
        seller_profile
      )
    `)
    .eq('id', productId)
    .single();

  if (error) {
    console.error('❌ Error getting product:', error);
    throw error;
  }
  
  console.log('✅ Product found:', data ? 'Yes' : 'No');
  console.log('🔍 Product lumens value:', data?.lumens);
  console.log('🔍 Product seller info:', data?.users ? 'Present' : 'Missing');
  return data;
}

// Create product
async function createProduct(productData, userId, userRole) {
  // Using SERVICE KEY client - no need for RLS context
  console.log('💾 Creating product in database with data:', {
    name: productData.name,
    price: productData.price,
    seller_id: productData.seller_id,
    hasImages: !!productData.images,
    imagesLength: productData.images?.length,
    hasColorOptions: !!productData.color_options,
    colorOptionsLength: productData.color_options?.length,
    hasSpecifications: !!productData.specifications,
    specificationsLength: productData.specifications?.length
  });
  
  console.log('🔍 Full productData being inserted:', JSON.stringify(productData, null, 2));
  
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();

  console.log('🔍 Supabase insert result:', { data, error, hasData: !!data, hasError: !!error });

  if (error) {
    console.error('❌ Error creating product in database:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  if (data) {
    console.log('✅ Product successfully inserted with ID:', data.id);
    console.log('✅ Product seller_id:', data.seller_id);
    console.log('✅ Product name:', data.name);
    console.log('✅ Product status:', data.status);
  } else {
    console.warn('⚠️ Product insert returned no data');
  }

  if (!data) {
    console.error('❌ No data returned from product creation');
    console.error('❌ Insert was successful but returned null data');
    throw new Error('Product creation failed - no data returned');
  }
  
  console.log('✅ Product created in database successfully:', data.id);
  
  // CRITICAL: Clear ALL product-related cache entries to ensure buyers see new products immediately
  console.log('🧹 Clearing all product and seller caches...');
  clearCache('products');
  clearCache('sellers');
  console.log('✅ Cache cleared - buyers will now see updated product list');
  
  return data;
}

// Update product
async function updateProduct(productId, updateData) {
  console.log('🔄 updateProduct called with:', {
    productId,
    updateDataKeys: Object.keys(updateData),
    sampleData: {
      name: updateData.name,
      lumens: updateData.lumens,
      lumensType: typeof updateData.lumens,
      hasAR: updateData.has_ar,
      hasARType: typeof updateData.has_ar
    }
  });

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', productId)
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase update error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }
  
  // CRITICAL: Clear ALL cache entries so buyers see updated products
  console.log('🧹 Clearing all caches after product update...');
  clearCache('products');
  clearCache('sellers');
  console.log('✅ Cache cleared - product updates will be visible immediately');
  
  return data;
}

// Delete product with comprehensive cleanup
async function deleteProduct(productId) {
  console.log('🗑️ Starting comprehensive product deletion for ID:', productId);
  
  try {
    // Step 1: Get product data to identify files to delete
    console.log('📋 Step 1: Getting product data for cleanup...');
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching product for deletion:', fetchError);
      throw fetchError;
    }

    if (!product) {
      console.log('⚠️ Product not found, skipping deletion');
      return true;
    }

    console.log('📋 Product found:', {
      id: product.id,
      name: product.name,
      hasImages: !!product.images,
      imageCount: product.images?.length || 0,
      hasARModel: !!product.ar_model_url,
      arScanData: product.ar_scan_data
    });

    // Step 2: Delete Cloudinary images
    if (product.images && Array.isArray(product.images)) {
      console.log(`🖼️ Step 2: Deleting ${product.images.length} product images from Cloudinary...`);
      
      for (const imageUrl of product.images) {
        try {
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.includes('cloudinary.com')) {
            const publicId = extractCloudinaryPublicId(imageUrl);
            if (publicId) {
              console.log(`🗑️ Deleting Cloudinary image: ${publicId}`);
              await deleteFile(publicId, 'image');
            }
          }
        } catch (imageError) {
          console.warn(`⚠️ Failed to delete Cloudinary image ${imageUrl}:`, imageError.message);
          // Continue with other deletions even if one fails
        }
      }
      console.log('✅ Step 2 completed: Cloudinary images deleted');
    }

    // Step 3: Delete AR model files from both Cloudinary AND Supabase Storage
    if (product.ar_model_url || product.ar_model || product.ar_scan_data?.model_url) {
      console.log('🎯 Step 3: Deleting AR model files...');
      
      const arUrls = [
        product.ar_model_url,
        product.ar_model,
        product.ar_scan_data?.model_url,
        product.ar_scan_data?.glbUrl,
        product.ar_scan_data?.cloudinaryUrl
      ].filter(Boolean);

      for (const arUrl of arUrls) {
        try {
          // Delete from Cloudinary
          if (arUrl.includes('cloudinary.com')) {
            const publicId = extractCloudinaryPublicId(arUrl);
            if (publicId) {
              console.log(`🗑️ Deleting AR model from Cloudinary: ${publicId}`);
              await deleteFile(publicId, 'raw');
            }
          }
          
          // Delete from Supabase Storage
          if (arUrl.includes('supabase.co')) {
            const storagePath = extractSupabaseStoragePath(arUrl, productId);
            if (storagePath) {
              console.log(`🗑️ Deleting AR model from Supabase Storage: ${storagePath}`);
              const { error: storageError } = await supabase.storage
                .from('ar-models')
                .remove([storagePath]);
              
              if (storageError) {
                console.warn(`⚠️ Failed to delete from Supabase Storage:`, storageError.message);
              } else {
                console.log(`✅ Deleted from Supabase Storage: ${storagePath}`);
              }
            }
          }
        } catch (arError) {
          console.warn('⚠️ Failed to delete AR model:', arError.message);
        }
      }
      console.log('✅ Step 3 completed: AR model files deleted');
    }

    // Step 4: Delete AR scan records
    console.log('📊 Step 4: Deleting AR scan records...');
    try {
      const { error: scanError } = await supabase
        .from('ar_scans')
        .delete()
        .eq('product_id', productId);
      
      if (scanError && !scanError.message.includes('relation') && !scanError.message.includes('does not exist')) {
        console.warn('⚠️ Error deleting AR scans:', scanError.message);
      } else {
        console.log('✅ Step 4 completed: AR scan records deleted');
      }
    } catch (scanError) {
      console.warn('⚠️ Failed to delete AR scan records:', scanError.message);
    }

    // Step 5: Delete likes/favorites for this product
    console.log('❤️ Step 5: Deleting product likes/favorites...');
    try {
      const { error: likesError } = await supabase
        .from('likes')
        .delete()
        .eq('product_id', productId);
      
      if (likesError && !likesError.message.includes('relation') && !likesError.message.includes('does not exist')) {
        console.warn('⚠️ Error deleting likes:', likesError.message);
      } else {
        console.log('✅ Step 5 completed: Product likes deleted');
      }
    } catch (likesError) {
      console.warn('⚠️ Failed to delete likes:', likesError.message);
    }

    // Step 6: Delete from cart items
    console.log('🛒 Step 6: Removing from cart items...');
    try {
      const { error: cartError } = await supabase
        .from('carts')
        .update({
          items: supabase.raw(`
            CASE 
              WHEN items IS NULL THEN '[]'::jsonb
              ELSE (
                SELECT jsonb_agg(item)
                FROM jsonb_array_elements(items) AS item
                WHERE (item->>'productId')::text != '${productId}'
              )
            END
          `)
        })
        .neq('items', null);
      
      if (cartError && !cartError.message.includes('relation') && !cartError.message.includes('does not exist')) {
        console.warn('⚠️ Error updating cart items:', cartError.message);
      } else {
        console.log('✅ Step 6 completed: Product removed from carts');
      }
    } catch (cartError) {
      console.warn('⚠️ Failed to update cart items:', cartError.message);
    }

    // Step 7: Delete product reviews
    console.log('⭐ Step 7: Deleting product reviews...');
    try {
      const { error: reviewsError } = await supabase
        .from('product_reviews')
        .delete()
        .eq('product_id', productId);
      
      if (reviewsError && !reviewsError.message.includes('relation') && !reviewsError.message.includes('does not exist')) {
        console.warn('⚠️ Error deleting reviews:', reviewsError.message);
      } else {
        console.log('✅ Step 7 completed: Product reviews deleted');
      }
    } catch (reviewsError) {
      console.warn('⚠️ Failed to delete reviews:', reviewsError.message);
    }

    // Step 8: Delete the product record
    console.log('🗑️ Step 8: Deleting product from database...');
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('❌ Error deleting product from database:', deleteError);
      throw deleteError;
    }
    
    console.log('✅ Step 8 completed: Product deleted from database');

    // Step 9: Clear caches
    console.log('🧹 Step 9: Clearing caches...');
    clearCache('products');
    clearCache('sellers');
    console.log('✅ Step 9 completed: Caches cleared - product list updated for buyers');

    console.log('🎉 Product deletion completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error in comprehensive product deletion:', error);
    throw error;
  }
}

// Helper function to extract Supabase Storage path from URL
function extractSupabaseStoragePath(url, productId) {
  if (!url || !url.includes('supabase.co')) return null;
  
  try {
    // Extract path after 'ar-models/'
    const match = url.match(/ar-models\/(.+?)(?:\?|$)/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Fallback: try to construct path from productId
    return `products/${productId}/${productId}_*.glb`;
  } catch (error) {
    console.warn('⚠️ Failed to extract Supabase storage path from URL:', url, error.message);
    return null;
  }
}

// Helper function to extract Cloudinary public ID from URL
function extractCloudinaryPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return null;
    
    let pathParts = urlParts.slice(uploadIndex + 1);
    
    // Skip version if present (starts with 'v' followed by numbers)
    if (pathParts[0] && pathParts[0].match(/^v\d+$/)) {
      pathParts = pathParts.slice(1);
    }
    
    const fullPath = pathParts.join('/');
    // Remove file extension
    return fullPath.replace(/\.[^/.]+$/, '');
  } catch (error) {
    console.warn('⚠️ Failed to extract public ID from URL:', url, error.message);
    return null;
  }
}

// Get AR scan data
async function getARScanData(productId) {
  const { data, error } = await supabase
    .from('ar_scans')
    .select('*')
    .eq('product_id', productId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
}

// Create AR scan record
async function createARScan(scanData) {
  const { data, error } = await supabase
    .from('ar_scans')
    .insert([scanData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update AR scan record
async function updateARScan(productId, updateData) {
  const { data, error } = await supabase
    .from('ar_scans')
    .update(updateData)
    .eq('product_id', productId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete AR scan
async function deleteARScan(productId) {
  const { error } = await supabase
    .from('ar_scans')
    .delete()
    .eq('product_id', productId);

  if (error) throw error;
  return true;
}

// Get seller's AR scans
async function getSellerARScans(sellerId) {
  const { data, error } = await supabase
    .from('ar_scans')
    .select(`
      *,
      products!inner(id, name, images)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

module.exports = {
  getAllSellers,
  getAllProducts,
  getSellerProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getARScanData,
  createARScan,
  updateARScan,
  deleteARScan,
  getSellerARScans,
  clearCache
};
