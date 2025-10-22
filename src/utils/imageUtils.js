import { BASE_URL } from '../api/api';

/**
 * Utility function to get the correct image URI from different image formats
 * Supports both legacy local storage format and new Cloudinary format
 * 
 * @param {Array} images - Array of image objects/strings
 * @param {number} index - Index of image to get (default: 0 for first image)
 * @returns {string|null} - Image URI or null if no image found
 */
export const getImageUri = (images, index = 0) => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }
  if (index >= images.length) {
    return null;
  }
  
  const image = images[index];
  
  if (!image) {
    return null;
  }
  
  // Handle string format (legacy)
  if (typeof image === 'string') {
    if (image.startsWith('http')) {
      return image; // Already a full URL
    } else if (image.startsWith('/')) {
      return `${BASE_URL}${image}`; // Local path
    } else {
      return `${BASE_URL}/uploads/products/${image}`; // Filename only
    }
  }
  
  // Handle object format (new Cloudinary format)
  if (typeof image === 'object') {
    // Priority: url (Cloudinary) > uri > path
    if (image.url) {
      return image.url; // Direct Cloudinary URL
    } else if (image.uri) {
      return image.uri.startsWith('http') ? image.uri : `${BASE_URL}${image.uri}`;
    } else if (image.path) {
      return image.path.startsWith('http') ? image.path : `${BASE_URL}${image.path}`;
    }
  }
  
  return null;
};

/**
 * Get the main product image (first image in array - position determines main image)
 * 
 * @param {Array} images - Array of image objects/strings
 * @returns {string|null} - Main image URI or null if no image found
 */
export const getMainImageUri = (images) => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }
  
  // ALWAYS use the first image as main image (position-based, not property-based)
  // This ensures that when images are reordered, the first position is always the main image
  return getImageUri(images, 0);
};

/**
 * Get all image URIs from an images array
 * 
 * @param {Array} images - Array of image objects/strings
 * @returns {Array} - Array of image URIs
 */
export const getAllImageUris = (images) => {
  if (!images || !Array.isArray(images)) return [];
  
  return images
    .map((_, index) => getImageUri(images, index))
    .filter(uri => uri !== null);
};

/**
 * Get responsive image URL for Cloudinary images
 * 
 * @param {string} imageUrl - Cloudinary image URL
 * @param {Object} options - Transformation options
 * @returns {string} - Transformed image URL
 */
export const getResponsiveImageUrl = (imageUrl, options = {}) => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return imageUrl; // Return original if not Cloudinary
  }
  
  const {
    width = 'auto',
    height = 'auto',
    quality = 'auto:good',
    format = 'auto'
  } = options;
  
  // Insert transformations into Cloudinary URL
  const transformations = `w_${width},h_${height},q_${quality},f_${format}`;
  
  return imageUrl.replace('/upload/', `/upload/${transformations}/`);
};

/**
 * Check if an image is from Cloudinary
 * 
 * @param {string|Object} image - Image URL or image object
 * @returns {boolean} - True if Cloudinary image
 */
export const isCloudinaryImage = (image) => {
  if (typeof image === 'string') {
    return image.includes('cloudinary.com');
  }
  
  if (typeof image === 'object' && image.url) {
    return image.url.includes('cloudinary.com');
  }
  
  return false;
};
