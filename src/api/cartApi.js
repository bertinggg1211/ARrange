import { authApi, BASE_URL } from './api';

// Test cart API connection
export const testCartApi = async () => {
  try {
    console.log('🧪 Testing cart API connection...');
    const res = await fetch(`${BASE_URL}/api/cart/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    console.log('🧪 Cart API test result:', data);
    return data;
  } catch (error) {
    console.error('❌ Cart API test failed:', error);
    throw error;
  }
};

// Test cart API with authentication
export const testCartApiAuth = async () => {
  try {
    console.log('🧪 Testing cart API with auth...');
    const token = await authApi.getStoredToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const res = await fetch(`${BASE_URL}/api/cart/test-auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    console.log('🧪 Cart API auth test result:', data);
    return data;
  } catch (error) {
    console.error('❌ Cart API auth test failed:', error);
    throw error;
  }
};

// Get user's cart
export const getCart = async () => {
  try {
    const token = await authApi.getStoredToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    // Add cache-busting parameter to ensure fresh data
    const cartUrl = `${BASE_URL}/api/cart?t=${Date.now()}`;
    console.log('🛒 Fetching cart from:', cartUrl);
    console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');

    const res = await fetch(cartUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    });

    console.log('🛒 Get cart response status:', res.status);
    
    const contentType = res.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.error('❌ Non-JSON response from get cart:', text.substring(0, 200));
      throw new Error(`Server returned ${contentType || 'unknown content type'}. Backend may not be running.`);
    }
    
    console.log('🛒 Get cart response data:', data);
    
    if (!res.ok) {
      const errorMessage = data?.error || data?.message || `HTTP ${res.status}: Failed to fetch cart`;
      console.error('❌ Get cart API error:', data);
      throw new Error(errorMessage);
    }
    return data;
  } catch (error) {
    console.error('❌ Error fetching cart:', error);
    
    // Check for network errors
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please check if the backend is running on port 5000.');
    }
    
    throw error;
  }
};

// Get cart summary (lightweight version for cart badge)
export const getCartSummary = async () => {
  try {
    const token = await authApi.getStoredToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('🛒 Fetching cart summary from:', `${BASE_URL}/api/cart/summary`);

    const res = await fetch(`${BASE_URL}/api/cart/summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🛒 Get cart summary response status:', res.status);
    
    const contentType = res.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.error('❌ Non-JSON response from get cart summary:', text.substring(0, 200));
      throw new Error(`Server returned ${contentType || 'unknown content type'}. Backend may not be running.`);
    }
    
    console.log('🛒 Get cart summary response data:', data);
    
    if (!res.ok) {
      const errorMessage = data?.error || data?.message || `HTTP ${res.status}: Failed to fetch cart summary`;
      console.error('❌ Get cart summary API error:', data);
      throw new Error(errorMessage);
    }
    return data;
  } catch (error) {
    console.error('❌ Error fetching cart summary:', error);
    
    // Check for network errors
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please check if the backend is running on port 5000.');
    }
    
    throw error;
  }
};

// Add item to cart
export const addToCart = async (productId, quantity = 1, sellerName) => {
  try {
    console.log('🛒 Adding to cart:', { productId, quantity, sellerName });
    
    const token = await authApi.getStoredToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
    
    const url = `${BASE_URL}/api/cart/add`;
    console.log('🌐 Cart API URL:', url);
    
    const payload = {
      productId,
      quantity,
      sellerName
    };
    console.log('📦 Cart payload:', payload);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Add to cart response status:', res.status);
    console.log('Add to cart response headers:', res.headers);
    
    const contentType = res.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.error('Non-JSON response from cart API:', text);
      throw new Error(`Server returned ${contentType || 'unknown content type'}. Expected JSON.`);
    }
    
    console.log('Add to cart response data:', data);
    
    if (!res.ok) {
      const errorMessage = data?.error || data?.message || `HTTP ${res.status}: Failed to add item to cart`;
      console.error('Cart API error details:', data);
      throw new Error(errorMessage);
    }
    return data;
  } catch (error) {
    console.error('Error adding to cart:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

// Update item quantity in cart
export const updateCartItem = async (productId, quantity) => {
  try {
    const token = await authApi.getStoredToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const res = await fetch(`${BASE_URL}/api/cart/update`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        quantity
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to update cart item');
    return data;
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (productId) => {
  try {
    console.log('🗑️ Removing from cart:', { productId });
    
    const token = await authApi.getStoredToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
    
    const url = `${BASE_URL}/api/cart/remove/${productId}`;
    console.log('🌐 Remove from cart URL:', url);

    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🗑️ Remove from cart response status:', res.status);
    
    const contentType = res.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.error('❌ Non-JSON response from remove cart:', text.substring(0, 200));
      throw new Error(`Server returned ${contentType || 'unknown content type'}. Backend may not be running.`);
    }
    
    console.log('🗑️ Remove from cart response data:', data);
    
    if (!res.ok) {
      const errorMessage = data?.error || data?.message || `HTTP ${res.status}: Failed to remove item from cart`;
      console.error('❌ Remove from cart API error:', data);
      throw new Error(errorMessage);
    }
    return data;
  } catch (error) {
    console.error('❌ Error removing from cart:', error);
    
    // Check for network errors
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please check if the backend is running on port 5000.');
    }
    
    throw error;
  }
};

// Clear entire cart
export const clearCart = async () => {
  try {
    const token = await authApi.getStoredToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const res = await fetch(`${BASE_URL}/api/cart/clear`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to clear cart');
    return data;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

export default {
  testCartApi,
  testCartApiAuth,
  getCart,
  getCartSummary,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
