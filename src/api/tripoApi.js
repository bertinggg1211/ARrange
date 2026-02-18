import { BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Start TRIPO image-to-model generation
 * @param {Object} params
 * @param {string|null} params.productId - Product ID (null for new products, actual ID for existing products)
 * @param {string} params.imageUri - Local image URI
 * @param {string} params.fileName - Image file name
 * @param {string} params.fileType - Image MIME type
 * @returns {Promise<{success: boolean, task_id: string}>}
 */
export const startTripoImageToModel = async ({ productId, imageUri, fileName, fileType }) => {
  try {
    console.log('🚀 Starting TRIPO image-to-model generation...');
    console.log('Product ID:', productId || 'null (new product)');
    console.log('Image URI:', imageUri);

    // Get auth token
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: fileType || 'image/jpeg',
      name: fileName || 'product_image.jpg',
    });
    
    // Append productId (can be null for new products)
    // Backend will handle AR generation without product ID for new products
    if (productId) {
      formData.append('productId', productId);
    } else {
      formData.append('productId', 'null'); // Send as string for FormData
      console.log('📝 No productId - generating AR for new product');
    }

    // Send to backend
    const response = await fetch(`${BASE_URL}/api/ar/tripo/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let browser set it with boundary
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to start TRIPO generation');
    }

    console.log('✅ TRIPO task started:', data);
    return data;

  } catch (error) {
    console.error('❌ TRIPO API error:', error);
    throw error;
  }
};

/**
 * Check TRIPO task status
 * @param {string} taskId - TRIPO task ID
 * @returns {Promise<{success: boolean, status: string, progress: number}>}
 */
export const getTripoTaskStatus = async (taskId) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${BASE_URL}/api/ar/tripo/status/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get task status');
    }

    return data;

  } catch (error) {
    console.error('❌ TRIPO status check error:', error);
    throw error;
  }
};

/**
 * Check if product has completed AR model
 * @param {string} productId - Product ID
 * @returns {Promise<{success: boolean, has_ar: boolean, ar_model: string}>}
 */
export const checkProductARStatus = async (productId) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${BASE_URL}/api/products/${productId}/ar-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to check AR status');
    }

    return data;

  } catch (error) {
    console.error('❌ Product AR status check error:', error);
    throw error;
  }
};
