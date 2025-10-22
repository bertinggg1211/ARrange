const express = require('express');
const auth = require('../middleware/auth');
const { 
  createImageUpload,
  createARUpload,
  uploadMultipleImages,
  deleteFile,
  getResponsiveUrls,
  generateARThumbnail
} = require('../services/cloudinaryStorage');
const {
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
  getSellerARScans
} = require('../db/supabaseHelpers');
const router = express.Router();

// Test Supabase connection
router.get('/test-connection', async (req, res) => {
  try {
    console.log('🧪 Testing Supabase connection...');
    const { supabase } = require('../db/supabase');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase test failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Supabase connection failed',
        error: error.message
      });
    }
    
    console.log('✅ Supabase connection successful');
    res.json({
      success: true,
      message: 'Supabase connection working',
      data: data
    });
  } catch (error) {
    console.error('❌ Supabase test error:', error);
    res.status(500).json({
      success: false,
      message: 'Supabase test failed',
      error: error.message
    });
  }
});

// Test database schema (public endpoint)
router.get('/test-schema', async (req, res) => {
  try {
    console.log('🧪 Testing database schema...');
    const { supabase } = require('../db/supabase');
    
    // Test if products table has required columns
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, images, color_options, specifications, dimensions, weight, material, warranty, bulb_type, number_of_bulbs, voltage, led_type, lumens, is_dimmable, brand, model, installation_type, room_type, status')
      .limit(1);
    
    if (error) {
      console.error('❌ Schema test failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Database schema test failed',
        error: error.message,
        hint: 'You may need to run the schema migration: server/update-products-schema.sql'
      });
    }
    
    console.log('✅ Database schema test successful');
    res.json({
      success: true,
      message: 'Database schema is correct',
      columns: data.length > 0 ? Object.keys(data[0]) : 'No products found to test columns'
    });
  } catch (error) {
    console.error('❌ Schema test error:', error);
    res.status(500).json({
      success: false,
      message: 'Schema test failed',
      error: error.message
    });
  }
});

// Multer configurations for different file types
const imageUpload = createImageUpload();
const arUpload = createARUpload();
const { startReconstructionJob } = require('../services/kiriClient');

// Check if this is a seller route
const isSellerRoute = (req) => req.baseUrl.includes('/seller');

// Public routes for buyers (no auth required)

// Get all sellers/shops for buyers
router.get('/sellers', async (req, res) => {
  try {
    console.log('🏪 Fetching all sellers for shops section...');
    console.log('🏪 Request URL:', req.url);
    console.log('🏪 Request method:', req.method);
    
    const sellers = await getAllSellers();
    console.log('🏪 Sellers fetched successfully:', sellers?.length || 0);
    console.log('🏪 Sellers data:', JSON.stringify(sellers, null, 2));
    
    res.json({
      success: true,
      sellers: sellers.map(seller => {
        console.log('🏪 Mapping seller for API response:', {
          id: seller.id,
          shopName: seller.shop_name,
          sellerProfile: seller.seller_profile,
          hasShopLogo: !!seller.seller_profile?.shopLogo,
          hasProfileImage: !!seller.seller_profile?.profileImage
        });
        
        return {
          id: seller.id,
          shopName: seller.shop_name,
          fullName: seller.full_name,
          email: seller.email,
          sellerProfile: seller.seller_profile || {},
          productCount: seller.productCount || 0,
          createdAt: seller.created_at
        };
      })
    });
  } catch (error) {
    console.error('❌ Error fetching sellers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sellers',
      error: error.message
    });
  }
});

// Get all products for buyers
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Product route hit - isSellerRoute:', isSellerRoute(req));
    console.log('🔍 Request user:', req.user);
    
    // If this is a seller route, require auth and return seller's products
    if (isSellerRoute(req)) {
      const sellerId = req.user.id;
      console.log(`🏪 Fetching products for seller ${sellerId}...`);
      
      const products = await getSellerProducts(sellerId);
      console.log('✅ Seller products fetched:', products?.length || 0);
      
      res.json({
        success: true,
        products: products.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          category: product.category,
          images: product.images || [],
          stock: product.stock_quantity,
          status: product.status,
          hasAR: product.has_ar || false,
          arModel: product.ar_model,
          arScanData: product.ar_scan_data,
          createdAt: product.created_at,
          updatedAt: product.updated_at,
          // FIXED: Include ALL detailed product fields for proper editing
          dimensions: product.dimensions,
          weight: product.weight,
          material: product.material,
          warranty: product.warranty,
          bulbType: product.bulb_type,
          numberOfBulbs: product.number_of_bulbs,
          voltage: product.voltage,
          ledType: product.led_type,
          lumens: product.lumens,
          isDimmable: product.is_dimmable || false,
          brand: product.brand,
          model: product.model,
          installationType: product.installation_type,
          roomType: product.room_type,
          colorOptions: product.color_options || [],
          specifications: product.specifications || [],
          // AR fields that exist in schema
          arModelUrl: product.ar_model_url,
          arThumbnailUrl: product.ar_thumbnail_url
        }))
      });
    } else {
      // Public route for buyers
      const { category, minPrice, maxPrice, search, page = 1, limit = 20 } = req.query;
      
      console.log('🛍️ Fetching products for buyers...');
      
      const filters = {
        category,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        search
      };
      
      console.log('🔄 Calling getAllProducts with filters:', filters);
      const products = await getAllProducts(filters);
      console.log('✅ Buyer products fetched:', products?.length || 0);
      console.log('🔍 First product sample:', products?.[0] ? {
        id: products[0].id,
        name: products[0].name,
        seller_id: products[0].seller_id,
        hasSellerProfile: !!products[0].sellerProfile
      } : 'No products');
      
      res.json({
        success: true,
        products: products.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          category: product.category,
          images: product.images || [],
          stock: product.stock_quantity,
          hasAR: product.has_ar || false,
          arModel: product.ar_model,
          seller_id: product.seller_id,
          sellerProfile: product.sellerProfile,
          shopName: product.shopName,
          sellerName: product.sellerName,
          createdAt: product.created_at
        }))
      });
    }
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Check if it's a Supabase connection error
    if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
      console.error('❌ Supabase connection failed');
      return res.status(503).json({
        success: false,
        message: 'Database connection failed',
        error: 'Supabase connection error'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// Get shop details with products for ShopViewer (public route)
router.get('/shop/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 20, category, sortBy = 'newest' } = req.query;

    console.log(`🏪 Fetching shop details for seller ${sellerId}...`);

    // Get seller information
    const { supabase } = require('../db/supabase');
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('id, full_name, shop_name, seller_profile, created_at')
      .eq('id', sellerId)
      .eq('role', 'seller')
      .single();

    if (sellerError || !seller) {
      console.log('❌ Seller not found:', sellerError);
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Get seller's products with pagination and filtering
    let productsQuery = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('seller_id', sellerId)
      .eq('status', 'active')
      .order('created_at', { ascending: sortBy === 'newest' });

    if (category && category !== 'all') {
      productsQuery = productsQuery.eq('category', category);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    productsQuery = productsQuery.range(from, to);

    const { data: products, error: productsError, count } = await productsQuery;

    if (productsError) {
      console.error('❌ Error fetching shop products:', productsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch shop products'
      });
    }

    // Format seller info for frontend
    const shopInfo = {
      id: seller.id,
      name: seller.full_name,
      shopName: seller.shop_name,
      sellerProfile: seller.seller_profile || {},
      joinedDate: seller.created_at,
      isOnline: false,
      rating: seller.seller_profile?.rating || 0,
      reviews: seller.seller_profile?.reviewsCount || 0,
      totalProducts: count || 0,
      isNewSeller: !seller.seller_profile?.rating,
      // Add direct image properties for frontend compatibility
      shopBanner: seller.seller_profile?.shopBanner || null,
      shopLogo: seller.seller_profile?.shopLogo || null,
      profileImage: seller.seller_profile?.profileImage || null,
      ownerName: seller.seller_profile?.ownerName || seller.full_name,
      description: seller.seller_profile?.businessDescription || null,
      businessAddress: seller.seller_profile?.businessAddress || null,
      businessPhone: seller.seller_profile?.businessPhone || null,
      verified: (seller.seller_profile?.rating || 0) >= 4.5
    };

    // Format products for frontend
    const formattedProducts = (products || []).map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      images: product.images || [],
      stock: product.stock_quantity,
      status: product.status,
      hasAR: product.has_ar || false,
      arModel: product.ar_model,
      dimensions: product.dimensions,
      weight: product.weight,
      material: product.material,
      warranty: product.warranty,
      bulbType: product.bulb_type,
      numberOfBulbs: product.number_of_bulbs,
      voltage: product.voltage,
      ledType: product.led_type,
      lumens: product.lumens,
      isDimmable: product.is_dimmable,
      brand: product.brand,
      model: product.model,
      colorOptions: product.color_options || [],
      installationType: product.installation_type,
      roomType: product.room_type,
      specifications: product.specifications || [],
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      arScanData: product.ar_scan_data,
      arModelUrl: product.ar_model_url,
      arThumbnailUrl: product.ar_thumbnail_url
    }));

    console.log('✅ Shop details fetched successfully:', {
      sellerId,
      shopName: shopInfo.shopName,
      totalProducts: shopInfo.totalProducts,
      productsReturned: formattedProducts.length
    });

    res.json({
      success: true,
      shop: {
        ...shopInfo,
        products: formattedProducts,
        pagination: {
          currentPage: parseInt(page),
          totalItems: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNextPage: (count || 0) > page * limit,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching shop details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop details',
      error: error.message
    });
  }
});

// Get seller's products
router.get('/seller', auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    console.log(`🏪 Fetching products for seller ${sellerId}...`);

    const products = await getSellerProducts(sellerId);
    console.log('🔍 Raw products from database:', products.length, 'products found');
    if (products.length > 0) {
      console.log('🔍 First product sample:', {
        id: products[0].id,
        name: products[0].name,
        hasImages: !!products[0].images,
        imagesLength: products[0].images?.length,
        imagesData: products[0].images,
        firstImage: products[0].images?.[0],
        firstImageType: typeof products[0].images?.[0],
        hasColorOptions: !!products[0].color_options,
        colorOptionsLength: products[0].color_options?.length,
        hasSpecifications: !!products[0].specifications,
        specificationsLength: products[0].specifications?.length
      });
    }

    res.json({
      success: true,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        images: product.images || [],
        stock: product.stock_quantity || product.stock,
        status: product.status,
        hasAR: product.has_ar || false,
        arModel: product.ar_model,
        // Additional fields for editing
        dimensions: product.dimensions,
        weight: product.weight,
        material: product.material,
        warranty: product.warranty,
        bulbType: product.bulb_type,
        numberOfBulbs: product.number_of_bulbs,
        voltage: product.voltage,
        ledType: product.led_type,
        lumens: product.lumens,
        isDimmable: product.is_dimmable,
        brand: product.brand,
        model: product.model,
        colorOptions: product.color_options || [],
        installationType: product.installation_type,
        roomType: product.room_type,
        specifications: product.specifications || [],
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        // FIXED: Add missing AR fields that exist in database schema
        arScanData: product.ar_scan_data,
        arModelUrl: product.ar_model_url,
        arModelSource: product.ar_model_source,
        arModelType: product.ar_model_type,
        arThumbnailUrl: product.ar_thumbnail_url
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching seller products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// Create new product with Cloudinary image upload
router.post('/', auth, imageUpload.array('images', 5), async (req, res) => {
  try {
    console.log('🚀 Product creation request received');
    console.log('🚀 Request method:', req.method);
    console.log('🚀 Request URL:', req.url);
    console.log('🚀 Request headers:', req.headers);
    console.log('🚀 Request body keys:', Object.keys(req.body));
    console.log('🚀 Files received:', req.files?.length || 0);
    
    console.log('🔍 Auth user check:', {
      hasUser: !!req.user,
      userId: req.user?.id,
      userRole: req.user?.role
    });
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - user not found'
      });
    }
    
    const sellerId = req.user.id;
    const { name, price, description, category, stock, dimensions, weight, material, warranty, bulbType, numberOfBulbs, voltage, ledType, lumens, isDimmable, brand, model, installationType, roomType, deliveryCharge, installationCost, freeDeliveryThreshold, installationIncluded } = req.body;
    
    console.log('📝 Creating product with lumens data:', {
      lumens: lumens,
      lumensType: typeof lumens,
      numberOfBulbs: numberOfBulbs,
      numberOfBulbsType: typeof numberOfBulbs,
      brand: brand
    });
    
    // Handle array fields from FormData
    const colorOptions = req.body['colorOptions[]'] || req.body.colorOptions;
    const specifications = req.body['specifications[]'] || req.body.specifications;
    
    console.log(`📦 Creating new product: ${name} for seller ${sellerId}`);
    console.log('📋 Request body keys:', Object.keys(req.body));
    console.log('📋 Raw colorOptions from body:', req.body['colorOptions[]']);
    console.log('📋 Raw specifications from body:', req.body['specifications[]']);
    console.log('💰 Raw price from body:', req.body.price);
    console.log('💰 Raw name from body:', req.body.name);
    console.log('💰 Full request body:', JSON.stringify(req.body, null, 2));
    
    // Upload images to Cloudinary
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      console.log(`📸 Uploading ${req.files.length} images to Cloudinary...`);
      const uploadResult = await uploadMultipleImages(req.files);
      console.log('✅ Upload result:', uploadResult);
      imageUrls = uploadResult.images || [];
      console.log('✅ Images uploaded successfully:', imageUrls);
    }
    
    // Parse array fields from FormData
    let parsedColorOptions = [];
    if (colorOptions) {
      if (Array.isArray(colorOptions)) {
        parsedColorOptions = colorOptions;
      } else if (typeof colorOptions === 'string') {
        try {
          parsedColorOptions = JSON.parse(colorOptions);
        } catch (e) {
          console.log('ColorOptions is not JSON, treating as single value:', colorOptions);
          parsedColorOptions = [colorOptions];
        }
      }
    }
    
    let parsedSpecifications = [];
    if (specifications) {
      if (Array.isArray(specifications)) {
        parsedSpecifications = specifications;
      } else if (typeof specifications === 'string') {
        try {
          parsedSpecifications = JSON.parse(specifications);
        } catch (e) {
          console.log('Specifications is not JSON, treating as single value:', specifications);
          parsedSpecifications = [specifications];
        }
      }
    }
    
    console.log('📋 Parsed colorOptions:', parsedColorOptions);
    console.log('📋 Parsed specifications:', parsedSpecifications);
    console.log('📸 Image URLs to be saved:', imageUrls);
    console.log('📸 Image URLs length:', imageUrls.length);
    
    // Debug the price field
    console.log('💰 Raw price value:', price);
    console.log('💰 Price type:', typeof price);
    console.log('💰 Parsed price:', parseFloat(price));
    
    // Validate required fields
    if (!name || !price || price === 'undefined' || price === '') {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required fields',
        missing: {
          name: !name,
          price: !price || price === 'undefined' || price === ''
        },
        received: {
          name: name,
          price: price,
          priceType: typeof price
        }
      });
    }
    
    // Create product data
    console.log('🚨 CREATING PRODUCT WITH SELLER_ID:', sellerId);
    console.log('🚨 USER OBJECT:', { id: req.user.id, email: req.user.email, role: req.user.role });
    
    // Parse AR data if provided
    let arScanData = null;
    let hasAR = false;
    let arModelUrl = null;
    let arModelSource = 'kiri';
    let arModelType = null;
    
    if (req.body.arScanData) {
      try {
        arScanData = typeof req.body.arScanData === 'string' ? JSON.parse(req.body.arScanData) : req.body.arScanData;
        hasAR = req.body.hasAR === 'true' || req.body.hasAR === true;
        arModelUrl = arScanData?.glbUrl || arScanData?.cloudinaryUrl || arScanData?.modelUrl || null;
        
        console.log('🎯 AR Data parsed successfully:', {
          hasAR: hasAR,
          hasGlbUrl: !!arScanData?.glbUrl,
          hasCloudinaryUrl: !!arScanData?.cloudinaryUrl,
          hasModelUrl: !!arScanData?.modelUrl,
          arModelUrl: arModelUrl
        });
      } catch (e) {
        console.error('❌ Error parsing arScanData:', e);
        arScanData = null;
        hasAR = false;
        arModelUrl = null;
      }
    }
    
    // Handle local model data
    if (req.body.arModelSource === 'local') {
      arModelSource = 'local';
      arModelType = req.body.arModelType || 'TEST4';
      arModelUrl = req.body.arModelUrl;
      hasAR = true;
      console.log('🏠 Local model data:', {
        arModelSource,
        arModelType,
        arModelUrl,
        hasAR
      });
    }

    // Debug: Log all AR-related request body data
    console.log('🔍 Backend Debug - Request Body AR Data:', {
      hasAR: req.body.hasAR,
      arModelSource: req.body.arModelSource,
      arModelType: req.body.arModelType,
      arModelUrl: req.body.arModelUrl,
      arScanData: req.body.arScanData ? 'present' : 'null'
    });

    const productData = {
      seller_id: sellerId,
      name,
      price: parseFloat(price) || 0,
      description,
      category,
      stock_quantity: parseInt(stock) || 0,
      dimensions,
      weight,
      material,
      warranty,
      bulb_type: bulbType,
      number_of_bulbs: numberOfBulbs !== undefined && numberOfBulbs !== null && numberOfBulbs !== '' ? parseInt(numberOfBulbs) : null,
      voltage,
      led_type: ledType,
      lumens: lumens !== undefined && lumens !== null && lumens !== '' ? parseInt(lumens) : null,
      is_dimmable: isDimmable === 'true' || isDimmable === true,
      brand,
      model,
      color_options: parsedColorOptions,
      installation_type: installationType,
      room_type: roomType,
      specifications: parsedSpecifications,
      images: imageUrls,
      status: 'active',
      has_ar: hasAR,
      ar_scan_data: arScanData,
      ar_model_url: arModelUrl,
      ar_model_source: arModelSource,
      ar_model_type: arModelType,
      delivery_charge: deliveryCharge ? parseFloat(deliveryCharge) : 0.00,
      installation_cost: installationCost ? parseFloat(installationCost) : 0.00,
      free_delivery_threshold: freeDeliveryThreshold ? parseFloat(freeDeliveryThreshold) : null,
      installation_included: installationIncluded === 'true' || installationIncluded === true
    };
    
    console.log('💾 Product data to be saved:', {
      name: productData.name,
      price: productData.price,
      hasImages: !!productData.images,
      imagesLength: productData.images?.length,
      imagesData: productData.images,
      hasColorOptions: !!productData.color_options,
      colorOptionsLength: productData.color_options?.length,
      hasSpecifications: !!productData.specifications,
      specificationsLength: productData.specifications?.length,
      dimensions: productData.dimensions,
      weight: productData.weight,
      material: productData.material,
      warranty: productData.warranty,
      brand: productData.brand,
      model: productData.model
    });
    
    // Create product in Supabase
    const newProduct = await createProduct(productData, sellerId, 'seller');
    
    console.log('✅ Product created successfully:', newProduct.id);
    console.log('🔍 Created product lumens value:', {
      lumens: newProduct.lumens,
      lumensType: typeof newProduct.lumens,
      numberOfBulbs: newProduct.number_of_bulbs,
      brand: newProduct.brand
    });
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: {
        id: newProduct.id,
        name: newProduct.name,
        price: newProduct.price,
        description: newProduct.description,
        category: newProduct.category,
        images: newProduct.images,
        stock: newProduct.stock_quantity,
        status: newProduct.status,
        // Include ALL detailed fields for proper frontend updates
        dimensions: newProduct.dimensions,
        weight: newProduct.weight,
        material: newProduct.material,
        warranty: newProduct.warranty,
        bulbType: newProduct.bulb_type,
        numberOfBulbs: newProduct.number_of_bulbs,
        voltage: newProduct.voltage,
        ledType: newProduct.led_type,
        lumens: newProduct.lumens, // ✅ FIXED: Include lumens in create response
        isDimmable: newProduct.is_dimmable,
        brand: newProduct.brand,
        model: newProduct.model,
        colorOptions: newProduct.color_options,
        installationType: newProduct.installation_type,
        roomType: newProduct.room_type,
        specifications: newProduct.specifications,
        hasAR: newProduct.has_ar,
        arScanData: newProduct.ar_scan_data,
        arModelUrl: newProduct.ar_model_url,
        arModelSource: newProduct.ar_model_source,
        arModelType: newProduct.ar_model_type,
        arThumbnailUrl: newProduct.ar_thumbnail_url,
        createdAt: newProduct.created_at
      }
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// Update product
router.put('/:productId', auth, imageUpload.array('newImages', 5), async (req, res) => {
  // Declare variables at function level to ensure scope in catch block
  let productId, sellerId;
  
  try {
    productId = req.params.productId;
    sellerId = req.user.id;
    
    console.log(`📝 Updating product ${productId} for seller ${sellerId}`);
    
    // Get existing product
    const existingProduct = await getProduct(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check ownership
    if (existingProduct.seller_id !== sellerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own products'
      });
    }
    
    // Handle new image uploads
    let updatedImages = existingProduct.images || [];
    if (req.files && req.files.length > 0) {
      console.log(`📸 Uploading ${req.files.length} new images to Cloudinary...`);
      const uploadResult = await uploadMultipleImages(req.files, productId);
      console.log('✅ Upload result:', uploadResult);
      const newImageUrls = uploadResult.images || [];
      updatedImages = [...updatedImages, ...newImageUrls];
      console.log('✅ New images uploaded successfully');
    }
    
    // Parse JSON fields with error handling
    let colorOptions = existingProduct.color_options;
    let specifications = existingProduct.specifications;
    let arScanData = existingProduct.ar_scan_data;
    
    try {
      if (req.body.colorOptions) {
        colorOptions = JSON.parse(req.body.colorOptions);
      }
    } catch (e) {
      console.error('❌ Error parsing colorOptions JSON:', e.message);
      console.error('❌ colorOptions value:', req.body.colorOptions);
    }
    
    try {
      if (req.body.specifications) {
        specifications = JSON.parse(req.body.specifications);
      }
    } catch (e) {
      console.error('❌ Error parsing specifications JSON:', e.message);
      console.error('❌ specifications value:', req.body.specifications);
    }
    
    try {
      if (req.body.arScanData) {
        arScanData = JSON.parse(req.body.arScanData);
      }
    } catch (e) {
      console.error('❌ Error parsing arScanData JSON:', e.message);
      console.error('❌ arScanData value:', req.body.arScanData);
    }
    
    // Prepare update data
    const updateData = {
      name: req.body.name || existingProduct.name,
      price: req.body.price ? parseFloat(req.body.price) : existingProduct.price,
      description: req.body.description || existingProduct.description,
      category: req.body.category || existingProduct.category,
      stock_quantity: req.body.stock ? parseInt(req.body.stock) : existingProduct.stock_quantity,
      dimensions: req.body.dimensions || existingProduct.dimensions,
      weight: req.body.weight || existingProduct.weight,
      material: req.body.material || existingProduct.material,
      warranty: req.body.warranty || existingProduct.warranty,
      bulb_type: req.body.bulbType || existingProduct.bulb_type,
      number_of_bulbs: req.body.numberOfBulbs !== undefined && req.body.numberOfBulbs !== null && req.body.numberOfBulbs !== '' ? parseInt(req.body.numberOfBulbs) : existingProduct.number_of_bulbs,
      voltage: req.body.voltage || existingProduct.voltage,
      led_type: req.body.ledType || existingProduct.led_type,
      lumens: req.body.lumens !== undefined && req.body.lumens !== null && req.body.lumens !== '' ? parseInt(req.body.lumens) : existingProduct.lumens,
      is_dimmable: req.body.isDimmable === 'true',
      brand: req.body.brand || existingProduct.brand,
      model: req.body.model || existingProduct.model,
      color_options: colorOptions,
      installation_type: req.body.installationType || existingProduct.installation_type,
      room_type: req.body.roomType || existingProduct.room_type,
      specifications: specifications,
      images: updatedImages,
      updated_at: new Date().toISOString(),
      // FIXED: Add missing AR fields (only fields that exist in database schema)
      has_ar: req.body.hasAR === 'true' || req.body.hasAR === true || existingProduct.has_ar,
      ar_scan_data: arScanData,
      ar_model_url: req.body.arModelUrl || existingProduct.ar_model_url,
      ar_thumbnail_url: req.body.arThumbnailUrl || existingProduct.ar_thumbnail_url,
      // Delivery and installation fields
      delivery_charge: req.body.deliveryCharge ? parseFloat(req.body.deliveryCharge) : existingProduct.delivery_charge,
      installation_cost: req.body.installationCost ? parseFloat(req.body.installationCost) : existingProduct.installation_cost,
      free_delivery_threshold: req.body.freeDeliveryThreshold ? parseFloat(req.body.freeDeliveryThreshold) : existingProduct.free_delivery_threshold,
      installation_included: req.body.installationIncluded === 'true' || req.body.installationIncluded === true || existingProduct.installation_included
      // NOTE: Removed sold, views, rating, review_count as they don't exist in database schema
      // NOTE: created_at and seller_id should not be updated
    };
    
    console.log('📝 About to update product with data:', {
      productId,
      sellerId,
      updateDataKeys: Object.keys(updateData),
      criticalFields: {
        lumens: updateData.lumens,
        lumensType: typeof updateData.lumens,
        numberOfBulbs: updateData.number_of_bulbs,
        numberOfBulbsType: typeof updateData.number_of_bulbs,
        hasAR: updateData.has_ar,
        hasARType: typeof updateData.has_ar,
        arScanData: updateData.ar_scan_data ? 'present' : 'null'
      },
      requestBodyLumens: req.body.lumens,
      requestBodyLumensType: typeof req.body.lumens,
      existingProductLumens: existingProduct.lumens,
      existingProductLumensType: typeof existingProduct.lumens
    });
    
    // Update product
    const updatedProduct = await updateProduct(productId, updateData);
    
    console.log('✅ Product updated successfully');
    console.log('🔍 Updated product lumens value:', {
      lumens: updatedProduct.lumens,
      lumensType: typeof updatedProduct.lumens,
      allFields: {
        name: updatedProduct.name,
        price: updatedProduct.price,
        lumens: updatedProduct.lumens,
        numberOfBulbs: updatedProduct.number_of_bulbs,
        brand: updatedProduct.brand
      }
    });
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        price: updatedProduct.price,
        description: updatedProduct.description,
        category: updatedProduct.category,
        images: updatedProduct.images,
        stock: updatedProduct.stock_quantity,
        status: updatedProduct.status,
        // Include ALL detailed fields for proper frontend updates
        dimensions: updatedProduct.dimensions,
        weight: updatedProduct.weight,
        material: updatedProduct.material,
        warranty: updatedProduct.warranty,
        bulbType: updatedProduct.bulb_type,
        numberOfBulbs: updatedProduct.number_of_bulbs,
        voltage: updatedProduct.voltage,
        ledType: updatedProduct.led_type,
        lumens: updatedProduct.lumens, // ✅ FIXED: Include lumens in response
        isDimmable: updatedProduct.is_dimmable,
        brand: updatedProduct.brand,
        model: updatedProduct.model,
        colorOptions: updatedProduct.color_options,
        installationType: updatedProduct.installation_type,
        roomType: updatedProduct.room_type,
        specifications: updatedProduct.specifications,
        hasAR: updatedProduct.has_ar,
        arScanData: updatedProduct.ar_scan_data,
        arModelUrl: updatedProduct.ar_model_url,
        arThumbnailUrl: updatedProduct.ar_thumbnail_url,
        updatedAt: updatedProduct.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Error updating product:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      productId,
      sellerId
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
});

// Delete product
router.delete('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user.id;
    
    console.log(`🗑️ DELETE /api/seller/products/${productId} - Seller: ${sellerId}`);
    console.log(`🔍 Product ID type: ${typeof productId}, value: ${productId}`);
    console.log(`🔍 Seller ID type: ${typeof sellerId}, value: ${sellerId}`);
    
    // Get existing product to check ownership
    console.log('🔍 Step 1: Getting existing product...');
    const existingProduct = await getProduct(productId);
    console.log('🔍 Step 1 result:', existingProduct ? 'Product found' : 'Product not found');
    
    if (!existingProduct) {
      console.log('❌ Product not found');
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check ownership
    console.log('🔍 Step 2: Checking ownership...');
    console.log(`🔍 Product seller_id: ${existingProduct.seller_id}`);
    console.log(`🔍 Current seller_id: ${sellerId}`);
    console.log(`🔍 Ownership match: ${existingProduct.seller_id === sellerId}`);
    
    if (existingProduct.seller_id !== sellerId) {
      console.log('❌ Ownership check failed');
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own products'
      });
    }
    
    // Delete product
    console.log('🔍 Step 3: Deleting product from database...');
    await deleteProduct(productId);
    console.log('✅ Step 3 completed: Product deleted from database');
    
    console.log('✅ Product deleted successfully');
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

// Get single product
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    console.log(`📦 Fetching product ${productId}...`);
    
    const product = await getProduct(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        images: product.images || [],
        stock: product.stock_quantity, // FIXED: Use correct field name
        dimensions: product.dimensions,
        weight: product.weight,
        material: product.material,
        warranty: product.warranty,
        bulbType: product.bulb_type,
        numberOfBulbs: product.number_of_bulbs,
        voltage: product.voltage,
        ledType: product.led_type,
        lumens: product.lumens,
        isDimmable: product.is_dimmable,
        brand: product.brand,
        model: product.model,
        colorOptions: product.color_options || [],
        installationType: product.installation_type,
        roomType: product.room_type,
        specifications: product.specifications || [],
        hasAR: product.has_ar || false,
        arModel: product.ar_model,
        arScanData: product.ar_scan_data, // FIXED: Add missing AR fields
        arModelUrl: product.ar_model_url,
        arModelSource: product.ar_model_source,
        arModelType: product.ar_model_type,
        arThumbnailUrl: product.ar_thumbnail_url,
        // Delivery and installation fields
        deliveryCharge: product.delivery_charge || 0,
        installationCost: product.installation_cost || 0,
        freeDeliveryThreshold: product.free_delivery_threshold || null,
        installationIncluded: product.installation_included || false,
        seller: product.users ? {
          id: product.users.id,
          shopName: product.users.shop_name,
          fullName: product.users.full_name,
          sellerProfile: product.users.seller_profile
        } : null,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

// Upload AR scan data for a product (Seller only)
router.post('/:productId/ar-scan', auth, arUpload.single('arModel'), async (req, res) => {
  try {
    if (!isSellerRoute(req)) {
      return res.status(403).json({
        success: false,
        message: 'AR scanning is only available for sellers'
      });
    }

    const { productId } = req.params;
    const { scanData } = req.body;
    const sellerId = req.user.id;

    console.log(`🔍 Processing AR scan for product ${productId}...`);

    // Verify product ownership
    const product = await getProduct(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only add AR scans to your own products'
      });
    }

    // Parse scan data
    let parsedScanData = {};
    try {
      parsedScanData = typeof scanData === 'string' ? JSON.parse(scanData) : scanData;
    } catch (e) {
      console.log('Using default scan data due to parse error:', e.message);
    }

    // Process AR model file if uploaded OR accept base64 payload for RN data URI
    let arModelUrl = null;
    let arThumbnailUrl = null;

    if (req.file) {
      arModelUrl = req.file.path;
      try {
        arThumbnailUrl = await generateARThumbnail(req.file.path);
      } catch (thumbError) {
        console.log('AR thumbnail generation failed:', thumbError.message);
      }
    } else if (req.body && req.body.arModelBase64) {
      try {
        const { arModelBase64, mimeType = 'model/gltf+json', fileName = `ar_model_${productId}.gltf` } = req.body;
        const dataUri = `data:${mimeType};base64,${arModelBase64}`;
        const { cloudinary } = require('../services/cloudinaryStorage');
        const publicId = `products/ar-models/${productId}/model_${Date.now()}`;
        const upload = await cloudinary.uploader.upload(dataUri, {
          public_id: publicId,
          resource_type: 'raw',
          filename_override: fileName,
          use_filename: true,
        });
        arModelUrl = upload.secure_url;
        try {
          arThumbnailUrl = (await generateARThumbnail(upload.public_id)).thumbnailUrl;
        } catch (_) {}
      } catch (e) {
        console.error('AR base64 upload failed:', e.message);
      }
    }

    // Create scan record
    const scanRecord = {
      product_id: productId,
      seller_id: sellerId,
      scan_data: {
        frames: parsedScanData.frames || 60,
        quality: parsedScanData.quality || 'high',
        modelSize: parsedScanData.modelSize || '2.4 MB',
        vertices: parsedScanData.vertices || 15420,
        faces: parsedScanData.faces || 8760,
        timestamp: parsedScanData.timestamp || Date.now()
      },
      ar_model_url: arModelUrl,
      ar_thumbnail_url: arThumbnailUrl,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save scan record
    const scan = await createARScan(scanRecord);

    // Update product with AR info
    await updateProduct(productId, {
      has_ar: true,
      ar_model: arModelUrl,
      updated_at: new Date().toISOString()
    });

    console.log('✅ AR scan uploaded successfully');

    res.json({
      success: true,
      message: 'AR scan uploaded successfully',
      scan: {
        id: scan.id,
        productId: scan.product_id,
        arModelUrl: scan.ar_model_url,
        arThumbnailUrl: scan.ar_thumbnail_url,
        scanData: scan.scan_data,
        status: scan.status,
        createdAt: scan.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error uploading AR scan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload AR scan',
      error: error.message
    });
  }
});

// Get AR scan data for a product
router.get('/:productId/ar-scan', async (req, res) => {
  try {
    const { productId } = req.params;
    
    console.log(`📱 Fetching AR scan data for product ${productId}...`);

    const scanData = await getARScanData(productId);
    
    if (!scanData) {
      return res.status(404).json({
        success: false,
        message: 'AR scan not found for this product'
      });
    }

    res.json({
      success: true,
      scan: {
        id: scanData.id,
        productId: scanData.product_id,
        arModelUrl: scanData.ar_model_url,
        arThumbnailUrl: scanData.ar_thumbnail_url,
        scanData: scanData.scan_data,
        status: scanData.status,
        createdAt: scanData.created_at
      }
    });
  } catch (error) {
    console.error('❌ Error fetching AR scan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AR scan',
      error: error.message
    });
  }
});

// Delete AR scan
router.delete('/:productId/ar-scan', auth, async (req, res) => {
  try {
    if (!isSellerRoute(req)) {
      return res.status(403).json({
        success: false,
        message: 'AR scan deletion is only available for sellers'
      });
    }

    const { productId } = req.params;
    const sellerId = req.user.id;

    console.log(`🗑️ Deleting AR scan for product ${productId}...`);

    // Verify product ownership
    const product = await getProduct(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete AR scans from your own products'
      });
    }

    // Delete AR scan
    await deleteARScan(productId);

    // Update product to remove AR info
    await updateProduct(productId, {
      has_ar: false,
      ar_model: null,
      updated_at: new Date().toISOString()
    });

    console.log('✅ AR scan deleted successfully');

    res.json({
      success: true,
      message: 'AR scan deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting AR scan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete AR scan',
      error: error.message
    });
  }
});

// Get seller's AR scans
router.get('/seller/:sellerId/ar-scans', async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    console.log(`📱 Fetching AR scans for seller ${sellerId}...`);

    const scans = await getSellerARScans(sellerId);

    res.json({
      success: true,
      scans: scans.map(scan => ({
        id: scan.id,
        productId: scan.product_id,
        productName: scan.products?.name,
        productImages: scan.products?.images || [],
        arModelUrl: scan.ar_model_url,
        arThumbnailUrl: scan.ar_thumbnail_url,
        scanData: scan.scan_data,
        status: scan.status,
        createdAt: scan.created_at
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching AR scans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AR scans',
      error: error.message
    });
  }
});

// 🎯 Upload GLB file to Cloudinary (for KIRI Engine enhanced models)
router.post('/cloudinary/upload-glb', async (req, res) => {
  try {
    console.log('📤 Uploading GLB model to Cloudinary...');
    const { glbUrl, productName } = req.body;
    
    if (!glbUrl || !productName) {
      return res.status(400).json({
        success: false,
        message: 'GLB URL and product name are required'
      });
    }
    
    // Upload GLB from URL to Cloudinary
    const { cloudinary } = require('../services/cloudinaryStorage');
    const publicId = `products/ar-models/kiri/${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    
    console.log(`🔄 Uploading GLB from URL: ${glbUrl.substring(0, 100)}...`);
    
    const result = await cloudinary.uploader.upload(glbUrl, {
      public_id: publicId,
      resource_type: 'raw',
      format: 'glb',
      tags: ['kiri-engine', 'enhanced-quality', productName],
      // 🎯 Enhanced settings for high-quality GLB files
      quality_analysis: true,
      access_mode: 'public'
    });
    
    console.log('✅ GLB model uploaded to Cloudinary:', result.secure_url);
    console.log(`📊 GLB file size: ${(result.bytes / 1024 / 1024).toFixed(2)} MB`);
    
    res.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
      bytes: result.bytes,
      format: result.format,
      fileSize: `${(result.bytes / 1024 / 1024).toFixed(2)} MB`
    });
    
  } catch (error) {
    console.error('❌ GLB upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload GLB to Cloudinary',
      error: error.message
    });
  }
});

// Upload GLTF file to Cloudinary (for local fallback models)
router.post('/cloudinary/upload-gltf', async (req, res) => {
  try {
    console.log('📤 Uploading local GLTF to Cloudinary...');
    const { gltfData, productName } = req.body;
    
    if (!gltfData || !productName) {
      return res.status(400).json({
        success: false,
        message: 'GLTF data and product name are required'
      });
    }
    
    // Create data URI for GLTF
    const dataUri = `data:model/gltf+json;base64,${Buffer.from(gltfData).toString('base64')}`;
    
    // Upload to Cloudinary
    const { cloudinary } = require('../services/cloudinaryStorage');
    const publicId = `products/ar-models/local/${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    
    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      resource_type: 'raw',
      format: 'gltf',
      tags: ['local-gltf', 'fallback', productName]
    });
    
    console.log('✅ Local GLTF uploaded to Cloudinary:', result.secure_url);
    
    res.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
      bytes: result.bytes,
      format: result.format
    });
    
  } catch (error) {
    console.error('❌ GLTF upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload GLTF to Cloudinary',
      error: error.message
    });
  }
});

// Get product ratings
router.get('/ratings/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { supabase } = require('../db/supabase');
    
    console.log('⭐ Fetching real ratings for product:', productId);
    
    // Get all reviews for this product
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);
    
    if (error) {
      console.error('Error fetching product ratings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch product ratings'
      });
    }
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    
    // Calculate rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });
    
    const productRating = {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews,
      ratingDistribution
    };
    
    console.log('⭐ Product rating calculated:', productRating);
    
    res.json({
      success: true,
      rating: productRating
    });

  } catch (error) {
    console.error('Error in product ratings endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add a review/rating for a product
router.post('/ratings/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const buyerId = req.user.id;
    const { supabase } = require('../db/supabase');
    
    console.log('⭐ Adding review for product:', productId, 'by buyer:', buyerId);
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Get product to find seller_id
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', productId)
      .single();
    
    if (productError || !product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if user already reviewed this product
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('buyer_id', buyerId)
      .single();
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }
    
    // Add the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        buyer_id: buyerId,
        seller_id: product.seller_id,
        rating: rating,
        comment: comment || null
      })
      .select()
      .single();
    
    if (reviewError) {
      console.error('Error adding review:', reviewError);
      return res.status(500).json({
        success: false,
        message: 'Failed to add review'
      });
    }
    
    console.log('✅ Review added successfully:', review.id);
    
    res.json({
      success: true,
      review: review,
      message: 'Review added successfully'
    });

  } catch (error) {
    console.error('Error in add review endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
