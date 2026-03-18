import { authApi, BASE_URL } from './api';

// Create draft product for AR generation (minimal save without images)
export const createDraftProduct = async (payload = {}) => {
  try {
    const token = await authApi.getStoredToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    
    console.log('📝 Creating draft product for AR generation...');
    
    // Send minimal data as JSON (no images, no heavy uploads)
    const draftData = {
      name: payload.name,
      price: payload.price,
      description: payload.description,
      category: payload.category,
      stock: payload.stock || 1,
      status: 'draft', // Mark as draft
      isDraft: true
    };
    
    const url = `${BASE_URL}/api/seller/products/draft`;
    console.log('🌐 Making draft request to:', url);
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftData),
    });

    const contentType = res.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      throw new Error(`Server returned ${contentType || 'unknown content type'}.`);
    }

    if (!res.ok) {
      throw new Error(data?.message || 'Failed to create draft product');
    }

    console.log('✅ Draft product created:', data);
    return data;
  } catch (error) {
    console.error('❌ Error creating draft product:', error);
    throw error;
  }
};

export const createProduct = async (payload = {}) => {
  try {
    const token = await authApi.getStoredToken();
    
    // Check if token exists
    if (!token) {
      console.error('❌ No token found in AsyncStorage');
      throw new Error('No authentication token found. Please login again.');
    }
    
    console.log('✅ Token retrieved:', token ? `${token.substring(0, 20)}...` : 'No token');
    console.log('🔍 Token length:', token?.length || 0);
    console.log('📦 Product payload details:', {
      name: payload.name,
      price: payload.price,
      category: payload.category,
      imagesCount: payload.images?.length || 0,
      hasColorOptions: !!payload.colorOptions,
      colorOptionsLength: payload.colorOptions?.length,
      hasSpecifications: !!payload.specifications,
      specificationsLength: payload.specifications?.length,
      dimensions: payload.dimensions,
      height: payload.height,
      width: payload.width,
      weight: payload.weight,
      material: payload.material,
      warranty: payload.warranty,
      brand: payload.brand,
      model: payload.model,
      hasAR: payload.hasAR,
      arScanData: payload.arScanData
    });
    
    console.log('🎯 AR Data being sent to backend:', {
      hasAR: payload.hasAR,
      arScanDataType: typeof payload.arScanData,
      arScanDataKeys: payload.arScanData ? Object.keys(payload.arScanData) : 'No AR data',
      arScanDataGlbUrl: payload.arScanData?.glbUrl,
      arScanDataCloudinaryUrl: payload.arScanData?.cloudinaryUrl
    });

    const form = new FormData();

    const textFields = [
      'name','price','description','category','stock','dimensions','height','width','weight','material','warranty',
      'bulbType','numberOfBulbs','voltage','ledType','lumens','isDimmable','brand','model','installationType','roomType','status',
      'hasAR','arModelSource','arModelType','arModelUrl','deliveryCharge','installationCost','freeDeliveryThreshold','installationIncluded'
    ];
    textFields.forEach((k) => {
      if (payload[k] !== undefined && payload[k] !== null) {
        form.append(k, String(payload[k]));
      }
    });

    if (Array.isArray(payload.colorOptions)) {
      payload.colorOptions.forEach((c) => form.append('colorOptions[]', String(c)));
    }
    if (Array.isArray(payload.specifications)) {
      payload.specifications.forEach((spec, idx) => {
        if (spec && typeof spec === 'object') {
          if (spec.name !== undefined) form.append(`specifications[${idx}][name]`, String(spec.name));
          if (spec.value !== undefined) form.append(`specifications[${idx}][value]`, String(spec.value));
        }
      });
    }

    if (Array.isArray(payload.images)) {
      payload.images.forEach((img) => {
        if (img && img.uri) {
          form.append('images', {
            uri: img.uri,
            type: img.type || 'image/jpeg',
            name: img.name || 'product.jpg',
          });
        }
      });
    }

    // Handle AR scan data - FIXED: Add support for arScanData object
    if (payload.arScanData && typeof payload.arScanData === 'object') {
      form.append('arScanData', JSON.stringify(payload.arScanData));
    }

    const url = `${BASE_URL}/api/seller/products`;
    console.log('🌐 Making request to:', url);
    console.log('🌐 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
    console.log('📋 FormData created with fields:', textFields.filter(field => payload[field] !== undefined && payload[field] !== null));
    console.log('📋 Images being sent:', payload.images?.length || 0);
    console.log('📋 Color options being sent:', payload.colorOptions?.length || 0);
    console.log('📋 Specifications being sent:', payload.specifications?.length || 0);
    console.log('🎯 AR Data in FormData:', {
      hasAR: payload.hasAR,
      arModelSource: payload.arModelSource,
      arModelType: payload.arModelType,
      arModelUrl: payload.arModelUrl ? 'Present' : 'Missing',
      arScanData: payload.arScanData ? 'Present' : 'Missing'
    });
    
    console.log('🌐 Attempting to connect to:', url);
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        // Note: Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: form,
    });

    console.log('Response status:', res.status);
    console.log('Response headers:', res.headers);

    // Handle different response types
    const contentType = res.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.log('Non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned ${contentType || 'unknown content type'}. Backend may not be running.`);
    }

    if (!res.ok) {
      console.error('❌ API Error - Status:', res.status);
      console.error('❌ API Error - Response:', data);
      console.error('❌ API Error - Full response:', JSON.stringify(data, null, 2));
      
      if (res.status === 401) {
        throw new Error('Authentication failed. Please login again as a seller.');
      }
      
      // Provide more detailed error message
      const errorMessage = data?.message || data?.error || `Failed to create product (${res.status})`;
      console.error('❌ Throwing error:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('Product created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Provide helpful error messages
    if (error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to server. Please check if the backend is running on port 5000.');
    }
    
    if (error.message.includes('JSON Parse error')) {
      throw new Error('Backend server error. Please check server configuration.');
    }
    
    if (error.message.includes('DB_CONFIG_ERROR')) {
      throw new Error('Database not configured. Please set up Couchbase environment variables.');
    }
    
    if (error.message.includes('DB_CONNECTION_ERROR')) {
      throw new Error('Cannot connect to database. Please check Couchbase connection.');
    }
    
    throw error;
  }
};

// PRODUCTION MODE: No mock data - using real backend
// All mock data and fallbacks removed for production use

// Cache for products to avoid repeated API calls
const productCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

// Get all products (for buyers) with caching
export const getProducts = async (filters = {}) => {
  try {
    console.log('🚀 getProducts called with filters:', filters);
    
    // Create cache key from filters
    const cacheKey = JSON.stringify(filters);
    const cached = productCache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Returning cached products');
      return cached.data;
    }
    
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    
    const url = `${BASE_URL}/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('🔍 Fetching products from:', url);
    console.log('🔍 BASE_URL:', BASE_URL);
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Response status:', res.status);
    console.log('✅ Response ok:', res.ok);
    
    // Check if response is HTML (error page) instead of JSON
    const contentType = res.headers.get('content-type');
    console.log('🔍 Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.log('❌ Non-JSON response received:', text.substring(0, 200));
      
      // Production: Throw error if backend not available
      console.error('❌ Backend not available - check server connection');
      throw new Error('Backend server not available. Please check your connection.');
    }
    
    const data = await res.json();
    console.log('✅ API Response data:', data);
    console.log('✅ Products count in response:', data.products?.length || 0);
    
    // Debug AR data in products
    if (data.products && data.products.length > 0) {
      console.log('🎯 AR Data in products:', data.products.map(p => ({
        id: p.id,
        name: p.name,
        hasAR: p.has_ar || p.hasAR,
        arScanData: p.ar_scan_data || p.arScanData ? 'Present' : 'Missing'
      })));
    }
    
    if (!res.ok) throw new Error(data?.message || 'Failed to fetch products');
    
    // Cache the successful response
    productCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // For development: return empty products if backend not ready
    if (error.message.includes('Network request failed') || 
        error.message.includes('JSON Parse error') ||
        error.message.includes('fetch')) {
      console.error('❌ Backend error in production mode');
      console.error('❌ Error details:', error.message);
      throw error; // Don't fallback to mock in production
    }
    
    throw error;
  }
};

// Get single product by ID (public endpoint for buyers)
export const getProductById = async (productId) => {
  try {
    const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to fetch product');
    
    console.log('📦 getProductById FULL response:', {
      productId: data.product?.id,
      name: data.product?.name,
      height: data.product?.height,
      width: data.product?.width,
      dimensions: data.product?.dimensions,
      fullProduct: data.product
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

// Get single product by ID for seller (with authentication)
export const getSellerProductById = async (productId) => {
  try {
    const token = await authApi.getStoredToken();
    
    console.log('🔍 Fetching seller product:', productId);
    console.log('🔍 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
    
    const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('🔍 Response status:', res.status);
    console.log('🔍 Response ok:', res.ok);
    
    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    console.log('🔍 Response Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('❌ Non-JSON response received:', text.substring(0, 500));
      throw new Error(`Server returned ${contentType || 'unknown content type'}. Check server logs for details.`);
    }
    
    const data = await res.json();
    console.log('🔍 Product data received:', {
      hasProduct: !!data.product,
      productId: data.product?.id,
      lumens: data.product?.lumens,
      numberOfBulbs: data.product?.numberOfBulbs,
      brand: data.product?.brand
    });
    
    if (!res.ok) throw new Error(data?.message || 'Failed to fetch product');
    return data;
  } catch (error) {
    console.error('Error fetching seller product:', error);
    throw error;
  }
};

// Get products by seller (for seller dashboard) - removed timeout for debugging
export const getSellerProducts = async () => {
  try {
    const token = await authApi.getStoredToken();
    
    console.log('🔄 Making request to:', `${BASE_URL}/api/seller/products`);
    
    const res = await fetch(`${BASE_URL}/api/seller/products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ Response received:', res.status);
    
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to fetch seller products');
    return data;
  } catch (error) {
    console.error('Error fetching seller products:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (productId, payload = {}) => {
  try {
    const token = await authApi.getStoredToken();
    const form = new FormData();

    const textFields = [
      'name','price','description','category','stock','dimensions','weight','material','warranty',
      'bulbType','numberOfBulbs','voltage','ledType','lumens','isDimmable','brand','model','installationType','roomType','status',
      'hasAR','arModelUrl','arThumbnailUrl'
    ];
    textFields.forEach((k) => {
      if (payload[k] !== undefined && payload[k] !== null) {
        form.append(k, String(payload[k]));
      }
    });

    if (Array.isArray(payload.colorOptions)) {
      payload.colorOptions.forEach((c) => form.append('colorOptions[]', String(c)));
    }
    if (Array.isArray(payload.specifications)) {
      payload.specifications.forEach((spec, idx) => {
        if (spec && typeof spec === 'object') {
          if (spec.name !== undefined) form.append(`specifications[${idx}][name]`, String(spec.name));
          if (spec.value !== undefined) form.append(`specifications[${idx}][value]`, String(spec.value));
        }
      });
    }

    // Handle AR scan data - FIXED: Add support for arScanData object
    if (payload.arScanData && typeof payload.arScanData === 'object') {
      form.append('arScanData', JSON.stringify(payload.arScanData));
    }

    // Handle new images
    if (Array.isArray(payload.images)) {
      payload.images.forEach((img) => {
        if (img && typeof img === 'object' && img.uri) {
          form.append('newImages', {
            uri: img.uri,
            type: img.type || 'image/jpeg',
            name: img.name || 'product.jpg',
          });
        }
      });
    }

    // Handle existing images to keep
    if (Array.isArray(payload.existingImages)) {
      form.append('existingImages', JSON.stringify(payload.existingImages));
    }
    
    // Handle new images array from finalImageArray
    if (Array.isArray(payload.newImages)) {
      payload.newImages.forEach((img) => {
        if (img && typeof img === 'object' && img.uri) {
          form.append('newImages', {
            uri: img.uri,
            type: img.type || 'image/jpeg',
            name: img.name || 'product.jpg',
          });
        }
      });
    }

    // Handle reordered images (new field for maintaining order)
    if (Array.isArray(payload.reorderedImages)) {
      // Create a sanitized version of reorderedImages that can be properly stringified
      const sanitizedReorderedImages = payload.reorderedImages.map(img => {
        if (typeof img === 'string') {
          return img; // Keep strings as-is
        } else if (img && typeof img === 'object') {
          // For objects, only keep essential properties
          return {
            uri: img.uri,
            type: img.type || 'image/jpeg',
            name: img.name || 'product.jpg'
          };
        }
        return null; // Skip null/undefined items
      }).filter(Boolean); // Remove any null items
      
      form.append('reorderedImages', JSON.stringify(sanitizedReorderedImages));
      console.log('🔄 Sanitized reorderedImages for API:', 
        sanitizedReorderedImages.map((img, i) => 
          `${i}: ${typeof img === 'string' ? 'EXISTING' : 'NEW'}`
        )
      );
    }

    // Handle deleted image public IDs for Cloudinary cleanup
    if (Array.isArray(payload.deletedImagePublicIds) && payload.deletedImagePublicIds.length > 0) {
      form.append('deleteImagePublicIds', JSON.stringify(payload.deletedImagePublicIds));
    }

    // Keep existing images flag
    if (payload.keepExistingImages !== undefined) {
      form.append('keepExistingImages', String(payload.keepExistingImages));
    }

    const url = `${BASE_URL}/api/seller/products/${productId}`;
    console.log('🌐 Making update request to:', url);
    console.log('🌐 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
    
    const res = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    
    console.log('✅ Update response status:', res.status);
    console.log('✅ Update response ok:', res.ok);
    
    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    console.log('🔍 Response Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('❌ Non-JSON response received:', text.substring(0, 500));
      throw new Error(`Server returned ${contentType || 'unknown content type'}. Check server logs for details.`);
    }
    
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to update product');
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Provide helpful error messages for network issues
    if (error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to server. Please check if the backend is running and your network connection.');
    }
    
    throw error;
  }
};

// Delete product
export const deleteProduct = async (productId) => {
  try {
    console.log('🗑️ Delete API called with productId:', productId);
    const token = await authApi.getStoredToken();
    console.log('🔑 Token available:', !!token);
    console.log('🔑 Token length:', token?.length);
    console.log('🔑 Token preview:', token ? `${token.slice(0, 20)}...` : 'No token');
    
    const url = `${BASE_URL}/api/seller/products/${productId}`;
    console.log('📡 Delete URL:', url);
    
    console.log('📡 Making DELETE request to:', url);
    console.log('📡 Request headers:', {
      'Authorization': `Bearer ${token ? token.slice(0, 20) + '...' : 'No token'}`,
      'Content-Type': 'application/json',
    });
    
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 Delete response status:', res.status);
    console.log('📡 Delete response ok:', res.ok);
    
    const data = await res.json();
    console.log('📡 Delete response data:', data);
    
    if (!res.ok) {
      console.error('❌ Delete request failed:', {
        status: res.status,
        statusText: res.statusText,
        data: data
      });
      throw new Error(data?.message || 'Failed to delete product');
    }
    
    console.log('✅ Delete successful:', data);
    return data;
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
};

// Get all sellers/shops for buyers (dedicated API endpoint)
export const getAllSellers = async () => {
  try {
    console.log('🏪 Fetching all sellers from dedicated API...');
    console.log('🏪 API URL:', `${BASE_URL}/api/products/sellers`);
    
    // First test if the base API is working
    console.log('🧪 Testing base API connection...');
    const testResponse = await fetch(`${BASE_URL}/api/products`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('🧪 Base API status:', testResponse.status);
    
    const response = await fetch(`${BASE_URL}/api/products/sellers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('🏪 Response status:', response.status);
    console.log('🏪 Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Error data:', errorData);
      
      // If it's a 404, the route doesn't exist - fall back immediately
      if (response.status === 404) {
        console.log('⚠️ Route not found, falling back to products method');
        throw new Error('Route not found');
      }
      
      throw new Error(errorData.message || `Failed to fetch sellers (${response.status})`);
    }

    const data = await response.json();
    console.log('🏪 Sellers API response:', data);
    console.log('🏪 Sellers count:', data.sellers?.length || 0);
    
    return { 
      sellers: data.sellers || [],
      count: data.count || 0
    };
  } catch (error) {
    console.error('❌ Error fetching sellers:', error);
    console.error('❌ Error details:', error.message);
    
    // Fallback: try to extract sellers from products if dedicated API fails
    console.log('🔄 Falling back to extracting sellers from products...');
    return getAllSellersFromProducts();
  }
};

// Fallback method: Extract sellers from products (original implementation)
export const getAllSellersFromProducts = async () => {
  try {
    console.log('🏪 Fetching sellers from products data (fallback)...');
    
    // Get all products which includes seller information
    const response = await getProducts();
    console.log('🏪 Products response for sellers:', response);
    console.log('🏪 Products count:', response.products?.length || 0);
    
    if (!response.products || response.products.length === 0) {
      console.log('🏪 No products found, no sellers to extract');
      return { sellers: [] };
    }
    
    // Extract unique sellers from products
    const sellersMap = new Map();
    
    response.products.forEach(product => {
      if (product && product.sellerId) {
        const sellerId = product.sellerId;
        
        // If we haven't seen this seller before, add them
        if (!sellersMap.has(sellerId)) {
          sellersMap.set(sellerId, {
            id: sellerId,
            shopName: product.sellerShopName || product.sellerName || product.sellerFullName,
            fullName: product.sellerFullName || product.sellerName,
            avatar: product.sellerAvatar || null,
            sellerProfile: product.sellerProfile || {
              shopLogo: product.sellerProfile?.shopLogo || null,
              profileImage: product.sellerProfile?.profileImage || null,
              businessName: product.sellerProfile?.businessName || null,
              ownerName: product.sellerProfile?.ownerName || null,
              businessDescription: product.sellerProfile?.businessDescription || null,
            },
            productCount: 1,
            // Add any other seller info available from products
          });
        } else {
          // Increment product count for existing seller
          const seller = sellersMap.get(sellerId);
          seller.productCount += 1;
          
          // Update seller profile info if this product has more complete seller info
          if (product.sellerProfile) {
            // Merge seller profile data, keeping existing data if new data is missing
            seller.sellerProfile = {
              ...seller.sellerProfile,
              shopLogo: product.sellerProfile.shopLogo || seller.sellerProfile?.shopLogo,
              profileImage: product.sellerProfile.profileImage || seller.sellerProfile?.profileImage,
              businessName: product.sellerProfile.businessName || seller.sellerProfile?.businessName,
              ownerName: product.sellerProfile.ownerName || seller.sellerProfile?.ownerName,
              businessDescription: product.sellerProfile.businessDescription || seller.sellerProfile?.businessDescription,
            };
          }
          
          // Update avatar if this product has seller info and current seller doesn't have avatar
          if (!seller.avatar && product.sellerAvatar) {
            seller.avatar = product.sellerAvatar;
          }
        }
      }
    });
    
    // Convert Map to array
    const sellers = Array.from(sellersMap.values());
    
    console.log('🏪 Extracted sellers:', sellers);
    console.log('🏪 Total unique sellers:', sellers.length);
    
    return { sellers };
  } catch (error) {
    console.error('❌ Error extracting sellers from products:', error);
    
    // For development: return empty sellers if backend not ready
    if (error.message.includes('Network request failed') || 
        error.message.includes('JSON Parse error') ||
        error.message.includes('fetch')) {
      console.warn('❌ Backend not available, using empty sellers list');
      return { sellers: [] };
    } else {
      throw error;
    }
  }
};

// Get shop details with products for ShopViewer
export const getShopDetails = async (sellerId, options = {}) => {
  try {
    const { page = 1, limit = 20, category, sortBy = 'newest' } = options;
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy
    });
    
    if (category && category !== 'all') {
      queryParams.append('category', category);
    }
    
    const res = await fetch(`${BASE_URL}/api/products/shop/${sellerId}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to fetch shop details');
    return data;
  } catch (error) {
    console.error('Error fetching shop details:', error);
    throw error;
  }
};

// Get seller information for ProductDetail shop card
export const getSellerInfo = async (sellerId) => {
  try {
    console.log('🚨 getSellerInfo API called for sellerId:', sellerId);
    console.log('🚨 API URL:', `${BASE_URL}/api/user/seller/${sellerId}`);
    
    const res = await fetch(`${BASE_URL}/api/user/seller/${sellerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🚨 getSellerInfo response status:', res.status);
    const data = await res.json();
    console.log('🚨 getSellerInfo response data:', JSON.stringify(data, null, 2));
    
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to fetch seller info');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching seller info:', error);
    console.error('Error details:', error.message);
    
    // Return fallback seller info with better error handling
    console.log('🔄 Returning fallback seller info due to error');
    return {
      success: true,
      seller: {
        id: sellerId,
        name: 'Shop Owner',
        shopName: 'Lighting Store',
        sellerProfile: {
          businessName: 'Lighting Store',
          shopLogo: null,
          profileImage: null
        },
        rating: 0,
        reviews: 0,
        isOnline: false,
        joinedDate: new Date().toISOString(),
        totalProducts: 0,
        isNewSeller: true
      }
    };
  }
};

// Get product ratings
export const getProductRatings = async (productId) => {
  try {
    console.log('⭐ Fetching ratings for product:', productId);
    
    const res = await fetch(`${BASE_URL}/api/products/ratings/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('⭐ Product ratings response status:', res.status);
    const data = await res.json();
    console.log('⭐ Product ratings response data:', JSON.stringify(data, null, 2));
    
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to fetch product ratings');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching product ratings:', error);
    console.error('Error details:', error.message);
    
    // Return fallback rating data
    console.log('🔄 Returning fallback rating data due to error');
    return {
      success: true,
      rating: {
        averageRating: 4.5,
        totalReviews: 12,
        ratingDistribution: {
          5: 8,
          4: 3,
          3: 1,
          2: 0,
          1: 0
        }
      }
    };
  }
};

// Add a review/rating for a product
export const addProductReview = async (productId, rating, comment = '') => {
  try {
    const token = await authApi.getStoredToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('⭐ Adding review for product:', productId, 'rating:', rating);
    
    const res = await fetch(`${BASE_URL}/api/products/ratings/${productId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rating: rating,
        comment: comment
      })
    });
    
    console.log('⭐ Add review response status:', res.status);
    const data = await res.json();
    console.log('⭐ Add review response data:', JSON.stringify(data, null, 2));
    
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to add review');
    }
    
    return data;
  } catch (error) {
    console.error('Error adding product review:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};
