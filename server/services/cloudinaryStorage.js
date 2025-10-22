const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🎯 Enhanced file type validation for high-quality AR models
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const allowedARTypes = [
  'model/gltf-binary', 
  'model/gltf+json', 
  'application/octet-stream',
  'model/gltf', // GLTF JSON format
  'model/glb',  // GLB binary format
  'application/json' // For GLTF JSON files
];

// Generate unique public ID
const generatePublicId = (productId, fileType, index = 0) => {
  const timestamp = Date.now();
  const prefix = index === 0 ? 'main' : `gallery_${index}`;
  return `products/${fileType}/${productId}/${prefix}_${timestamp}`;
};

// Cloudinary storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const productId = req.body.productId || `temp_${Date.now()}`;
    const fileIndex = req.files ? req.files.indexOf(file) : 0;
    
    return {
      folder: `products/images/${productId}`,
      public_id: `${fileIndex === 0 ? 'main' : 'gallery'}_${Date.now()}`,
      format: 'jpg', // Convert all images to JPG for consistency
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' }, // Max size limit
        { quality: 'auto:good' }, // Automatic quality optimization
        { fetch_format: 'auto' } // Automatic format selection (WebP, AVIF)
      ],
    };
  },
});

// 🎯 Enhanced Cloudinary storage for high-quality AR models
const arModelStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const productId = req.params.productId || `temp_${Date.now()}`;
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    const isKiriModel = req.body.source === 'kiri' || req.body.enhanced === 'true';
    
    return {
      folder: isKiriModel ? `products/ar-models/kiri/${productId}` : `products/ar-models/${productId}`,
      public_id: isKiriModel ? `enhanced_model_${Date.now()}` : `model_${Date.now()}`,
      resource_type: 'raw', // For non-image files like GLB, GLTF
      format: fileExtension, // Keep original format (glb, gltf, etc.)
      tags: isKiriModel ? ['kiri-engine', 'enhanced-quality', productId] : ['ar-model', productId],
      // 🎯 Enhanced settings for high-quality models
      quality_analysis: isKiriModel,
      access_mode: 'public'
    };
  },
});

// Cloudinary storage for user avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const userId = req.user?.id || `temp_${Date.now()}`;
    
    return {
      folder: `users/avatars`,
      public_id: `${userId}_${Date.now()}`,
      format: 'jpg',
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' }, // Square crop focused on face
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
    };
  },
});

// Cloudinary storage for seller profile images (shop logo and banner)
const sellerProfileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const userId = req.user?.id || `temp_${Date.now()}`;
    const isShopBanner = file.fieldname === 'shopBanner';
    const isShopLogo = file.fieldname === 'shopLogo';
    
    if (isShopBanner) {
      return {
        folder: `sellers/banners`,
        public_id: `banner_${userId}_${Date.now()}`,
        format: 'jpg',
        transformation: [
          { width: 1200, height: 400, crop: 'fill' }, // Banner dimensions
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
      };
    } else if (isShopLogo) {
      return {
        folder: `sellers/logos`,
        public_id: `logo_${userId}_${Date.now()}`,
        format: 'jpg',
        transformation: [
          { width: 300, height: 300, crop: 'fill' }, // Square logo
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
      };
    } else {
      // Default avatar handling
      return {
        folder: `sellers/avatars`,
        public_id: `avatar_${userId}_${Date.now()}`,
        format: 'jpg',
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
      };
    }
  },
});

// Multer configurations
const createImageUpload = () => {
  return multer({
    storage: imageStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit for images
      fieldSize: 10 * 1024 * 1024, // 10MB limit for field values (JSON data)
      fieldNameSize: 100, // 100 bytes for field names
      fields: 50, // Maximum number of non-file fields (increased for complex products)
      files: 10, // Maximum number of file fields
    },
    fileFilter: (req, file, cb) => {
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid image type. Allowed: ${allowedImageTypes.join(', ')}`), false);
      }
    },
  });
};

const createARUpload = () => {
  return multer({
    storage: arModelStorage,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit for AR models
      fieldSize: 10 * 1024 * 1024, // 10MB limit for field values (JSON data)
      fieldNameSize: 100, // 100 bytes for field names
      fields: 50, // Maximum number of non-file fields (increased for complex products)
      files: 10, // Maximum number of file fields
    },
    fileFilter: (req, file, cb) => {
      // Allow AR file types and check by extension as well
      const isValidMime = allowedARTypes.includes(file.mimetype);
      const isValidExt = /\.(glb|gltf|usd|usdz)$/i.test(file.originalname);
      
      if (isValidMime || isValidExt) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid AR model type. Allowed: GLB, GLTF, USD, USDZ`), false);
      }
    },
  });
};

const createAvatarUpload = () => {
  return multer({
    storage: sellerProfileStorage, // Use seller profile storage for better organization
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
      fieldSize: 5 * 1024 * 1024, // 5MB limit for field values
      fieldNameSize: 100, // 100 bytes for field names
      fields: 10, // Maximum number of non-file fields
      files: 5, // Maximum number of file fields
    },
    fileFilter: (req, file, cb) => {
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid avatar type. Allowed: ${allowedImageTypes.join(', ')}`), false);
      }
    },
  });
};

const createSellerProfileUpload = () => {
  return multer({
    storage: sellerProfileStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit for seller profile images
      fieldSize: 5 * 1024 * 1024, // 5MB limit for field values
      fieldNameSize: 100, // 100 bytes for field names
      fields: 15, // Maximum number of non-file fields
      files: 5, // Maximum number of file fields
    },
    fileFilter: (req, file, cb) => {
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid image type. Allowed: ${allowedImageTypes.join(', ')}`), false);
      }
    },
  });
};

// Direct upload functions (for server-side processing)
const uploadImage = async (file, productId, imageType = 'gallery') => {
  try {
    const publicId = generatePublicId(productId, 'images', imageType === 'main' ? 0 : 1);
    
    const result = await cloudinary.uploader.upload(file.path || file.buffer, {
      public_id: publicId,
      folder: `products/images/${productId}`,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      tags: [productId, imageType, 'product-image'],
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('Cloudinary image upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

// 🎯 Enhanced AR model upload with quality optimization
const uploadARModel = async (file, productId, options = {}) => {
  try {
    const { isKiriModel = false, modelType = 'standard' } = options;
    const publicId = generatePublicId(productId, isKiriModel ? 'ar-models/kiri' : 'ar-models');
    
    const uploadOptions = {
      public_id: publicId,
      folder: isKiriModel ? `products/ar-models/kiri/${productId}` : `products/ar-models/${productId}`,
      resource_type: 'raw',
      tags: isKiriModel ? [productId, 'kiri-engine', 'enhanced-quality'] : [productId, 'ar-model'],
    };

    // 🎯 Enhanced settings for KIRI Engine models
    if (isKiriModel) {
      uploadOptions.quality_analysis = true;
      uploadOptions.access_mode = 'public';
      uploadOptions.metadata = {
        source: 'kiri-engine',
        quality: 'enhanced',
        generated_at: new Date().toISOString()
      };
    }

    const result = await cloudinary.uploader.upload(file.path || file.buffer, uploadOptions);

    console.log(`✅ ${isKiriModel ? 'Enhanced KIRI' : 'Standard'} AR model uploaded:`, result.secure_url);
    console.log(`📊 File size: ${(result.bytes / 1024 / 1024).toFixed(2)} MB`);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      fileSize: `${(result.bytes / 1024 / 1024).toFixed(2)} MB`,
      isEnhanced: isKiriModel,
      source: isKiriModel ? 'kiri-engine' : 'standard'
    };
  } catch (error) {
    console.error('Cloudinary AR model upload error:', error);
    throw new Error(`Failed to upload AR model: ${error.message}`);
  }
};

// Delete file from Cloudinary
const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    
    return { success: result.result === 'ok' };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

// Generate optimized URLs for different use cases
const generateOptimizedUrl = (publicId, options = {}) => {
  const {
    width = 'auto',
    height = 'auto',
    crop = 'limit',
    quality = 'auto:good',
    format = 'auto',
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: format,
    secure: true,
  });
};

// Batch upload multiple images
const uploadMultipleImages = async (files, productId) => {
  try {
    const uploadPromises = files.map((file, index) => {
      const imageType = index === 0 ? 'main' : 'gallery';
      return uploadImage(file, productId, imageType);
    });

    const results = await Promise.all(uploadPromises);
    
    return {
      success: true,
      images: results,
      count: results.length,
    };
  } catch (error) {
    console.error('Batch upload error:', error);
    throw new Error(`Failed to upload images: ${error.message}`);
  }
};

// Get image transformations for different screen sizes
const getResponsiveUrls = (publicId) => {
  return {
    thumbnail: generateOptimizedUrl(publicId, { width: 300, height: 300, crop: 'fill' }),
    medium: generateOptimizedUrl(publicId, { width: 600, height: 600, crop: 'limit' }),
    large: generateOptimizedUrl(publicId, { width: 1200, height: 1200, crop: 'limit' }),
    original: generateOptimizedUrl(publicId),
  };
};

// Generate AR model thumbnail (if supported)
const generateARThumbnail = async (publicId) => {
  try {
    // For GLB files, Cloudinary can generate thumbnails
    const thumbnailUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      width: 400,
      height: 400,
      crop: 'pad',
      background: 'white',
      format: 'jpg',
    });

    return { success: true, thumbnailUrl };
  } catch (error) {
    console.error('AR thumbnail generation error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  cloudinary,
  createImageUpload,
  createARUpload,
  createAvatarUpload,
  createSellerProfileUpload,
  uploadImage,
  uploadARModel,
  deleteFile,
  generateOptimizedUrl,
  uploadMultipleImages,
  getResponsiveUrls,
  generateARThumbnail,
};
