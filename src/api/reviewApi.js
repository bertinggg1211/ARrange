import { BASE_URL, authApi } from './api';

// =============================================
// REVIEW API - Product & Shop Reviews
// =============================================

// =============================================
// PRODUCT REVIEWS
// =============================================

/**
 * Submit a product review
 * @param {string} productId - Product ID
 * @param {string} orderId - Order ID
 * @param {number} rating - Rating 1-5
 * @param {string} comment - Review comment (optional)
 * @param {string} reviewTitle - Review title (optional)
 * @param {array} images - Array of image URLs (optional)
 */
export const submitProductReview = async (productId, orderId, rating, comment = null, reviewTitle = null, images = []) => {
  try {
    const token = await authApi.getStoredToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('⭐ Submitting product review:', { productId, orderId, rating });

    const response = await fetch(`${BASE_URL}/api/reviews/product`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId,
        orderId,
        rating,
        comment,
        reviewTitle,
        images
      })
    });

    const data = await response.json();
    console.log('⭐ Product review response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit product review');
    }

    return data;
  } catch (error) {
    console.error('❌ Error submitting product review:', error);
    throw error;
  }
};

/**
 * Get all reviews for a product
 * @param {string} productId - Product ID
 * @param {number} limit - Number of reviews to fetch
 * @param {number} offset - Offset for pagination
 * @param {string} sortBy - Sort by (recent, helpful, rating_high, rating_low)
 */
export const getProductReviews = async (productId, limit = 20, offset = 0, sortBy = 'recent') => {
  try {
    console.log('📖 Fetching product reviews:', productId);

    const response = await fetch(
      `${BASE_URL}/api/reviews/product/${productId}?limit=${limit}&offset=${offset}&sortBy=${sortBy}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    console.log('📖 Product reviews response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch product reviews');
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetching product reviews:', error);
    throw error;
  }
};

/**
 * Update a product review
 * @param {string} reviewId - Review ID
 * @param {number} rating - Updated rating
 * @param {string} comment - Updated comment
 * @param {string} reviewTitle - Updated title
 * @param {array} images - Updated images
 */
export const updateProductReview = async (reviewId, rating, comment, reviewTitle, images) => {
  try {
    const token = await authApi.getStoredToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('✏️ Updating product review:', reviewId);

    const response = await fetch(`${BASE_URL}/api/reviews/product/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rating,
        comment,
        reviewTitle,
        images
      })
    });

    const data = await response.json();
    console.log('✏️ Update review response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update review');
    }

    return data;
  } catch (error) {
    console.error('❌ Error updating product review:', error);
    throw error;
  }
};

/**
 * Delete a product review
 * @param {string} reviewId - Review ID
 */
export const deleteProductReview = async (reviewId) => {
  try {
    const token = await authApi.getStoredToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('🗑️ Deleting product review:', reviewId);

    const response = await fetch(`${BASE_URL}/api/reviews/product/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('🗑️ Delete review response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete review');
    }

    return data;
  } catch (error) {
    console.error('❌ Error deleting product review:', error);
    throw error;
  }
};

// =============================================
// SHOP REVIEWS
// =============================================

/**
 * Submit a shop review
 * @param {string} sellerId - Seller/Shop ID
 * @param {string} orderId - Order ID
 * @param {number} overallRating - Overall rating 1-5 (REQUIRED)
 * @param {number} communicationRating - Communication rating 1-5 (optional)
 * @param {number} shippingSpeedRating - Shipping speed rating 1-5 (optional)
 * @param {number} productQualityRating - Product quality rating 1-5 (optional)
 * @param {string} comment - Review comment (optional)
 * @param {string} reviewTitle - Review title (optional)
 */
export const submitShopReview = async (
  sellerId, 
  orderId, 
  overallRating, 
  communicationRating = null,
  shippingSpeedRating = null,
  productQualityRating = null,
  comment = null, 
  reviewTitle = null
) => {
  try {
    const token = await authApi.getStoredToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('⭐ Submitting shop review:', { sellerId, orderId, overallRating });

    const response = await fetch(`${BASE_URL}/api/reviews/shop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sellerId,
        orderId,
        overallRating,
        communicationRating,
        shippingSpeedRating,
        productQualityRating,
        comment,
        reviewTitle
      })
    });

    const data = await response.json();
    console.log('⭐ Shop review response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit shop review');
    }

    return data;
  } catch (error) {
    console.error('❌ Error submitting shop review:', error);
    throw error;
  }
};

/**
 * Get all reviews for a shop
 * @param {string} sellerId - Seller/Shop ID
 * @param {number} limit - Number of reviews to fetch
 * @param {number} offset - Offset for pagination
 * @param {string} sortBy - Sort by (recent, helpful, rating_high, rating_low)
 */
export const getShopReviews = async (sellerId, limit = 20, offset = 0, sortBy = 'recent') => {
  try {
    console.log('📖 Fetching shop reviews:', sellerId);

    const response = await fetch(
      `${BASE_URL}/api/reviews/shop/${sellerId}?limit=${limit}&offset=${offset}&sortBy=${sortBy}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    console.log('📖 Shop reviews response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch shop reviews');
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetching shop reviews:', error);
    throw error;
  }
};

// =============================================
// SELLER REVIEWS (Seller viewing their reviews)
// =============================================

/**
 * Get all reviews for current seller (both product and shop reviews)
 * @param {number} limit - Number of reviews to fetch
 * @param {number} offset - Offset for pagination
 */
export const getSellerReviews = async (limit = 20, offset = 0) => {
  try {
    const token = await authApi.getStoredToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('📖 Fetching seller reviews');

    const response = await fetch(
      `${BASE_URL}/api/reviews/seller/all?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    console.log('📖 Seller reviews response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch seller reviews');
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetching seller reviews:', error);
    throw error;
  }
};

// =============================================
// REVIEW REQUEST NOTIFICATIONS
// =============================================

/**
 * Send review request notification to buyer via chat
 * @param {string} buyerId - Buyer user ID
 * @param {string} orderId - Order ID (UUID)
 * @param {string} reviewType - 'product' or 'shop'
 * @param {object} data - Product or shop data
 */
export const sendReviewRequest = async (buyerId, orderId, reviewType, data) => {
  try {
    const token = await authApi.getStoredToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('📧 Sending review request:', { buyerId, orderId, reviewType });

    // Determine message based on review type
    let message = '';
    let productData = {};

    if (reviewType === 'product') {
      message = `⭐ How was your experience with ${data.name}? Please rate this product! Your feedback helps other buyers. Thank you! 💙`;
      productData = {
        ...data,
        orderId: orderId, // Use orderId (UUID) for review submission
        orderNumber: data.orderNumber, // Keep orderNumber for display
        isReviewRequest: true,
        reviewType: 'product'
      };
    } else if (reviewType === 'shop') {
      message = `⭐ How was your experience with ${data.shopName}? Please rate our shop! Your feedback on communication, shipping, and quality helps us serve you better. Thank you! 💙`;
      productData = {
        shopId: data.shopId,
        shopName: data.shopName,
        shopLogo: data.shopLogo,
        orderId: orderId, // Use orderId (UUID) for review submission
        orderNumber: data.orderNumber, // Keep orderNumber for display
        isReviewRequest: true,
        reviewType: 'shop'
      };
    }

    // Use the existing chat notification endpoint
    const response = await fetch(`${BASE_URL}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sellerId: buyerId, // For seller sending to buyer, we use this param
        message: message,
        productData: productData
      })
    });

    const responseData = await response.json();
    console.log('📧 Review request sent:', responseData);

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to send review request');
    }

    return responseData;
  } catch (error) {
    console.error('❌ Error sending review request:', error);
    throw error;
  }
};

export default {
  submitProductReview,
  getProductReviews,
  updateProductReview,
  deleteProductReview,
  submitShopReview,
  getShopReviews,
  getSellerReviews,
  sendReviewRequest
};
