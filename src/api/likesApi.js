import { BASE_URL, authApi } from './api';

// =============================================
// LIKES API INTEGRATION
// =============================================

const getAuthHeaders = async () => {
  const token = await authApi.getStoredToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Add product to likes
export const addLike = async (productId) => {
  try {
    const headers = await getAuthHeaders();
    
    console.log('❤️ Adding like for product:', productId);
    
    const response = await fetch(`${BASE_URL}/api/likes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ productId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to add like');
    }

    console.log('✅ Like added successfully');
    return data;

  } catch (error) {
    console.error('❌ Error adding like:', error);
    throw error;
  }
};

// Remove product from likes
export const removeLike = async (productId) => {
  try {
    const headers = await getAuthHeaders();
    
    console.log('💔 Removing like for product:', productId);
    
    const response = await fetch(`${BASE_URL}/api/likes/${productId}`, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove like');
    }

    console.log('✅ Like removed successfully');
    return data;

  } catch (error) {
    console.error('❌ Error removing like:', error);
    throw error;
  }
};

// Get user's liked products
export const getLikes = async () => {
  try {
    const headers = await getAuthHeaders();
    
    console.log('❤️ Fetching user likes...');
    
    const response = await fetch(`${BASE_URL}/api/likes`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch likes');
    }

    console.log('✅ Likes fetched successfully:', data.likes.length);
    return data;

  } catch (error) {
    console.error('❌ Error fetching likes:', error);
    throw error;
  }
};

// Check if product is liked
export const checkLikeStatus = async (productId) => {
  try {
    const headers = await getAuthHeaders();
    
    console.log('🔍 Checking like status for product:', productId);
    
    const response = await fetch(`${BASE_URL}/api/likes/check/${productId}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to check like status');
    }

    console.log('✅ Like status checked:', data.isLiked);
    return data;

  } catch (error) {
    console.error('❌ Error checking like status:', error);
    throw error;
  }
};

export default {
  addLike,
  removeLike,
  getLikes,
  checkLikeStatus
};
