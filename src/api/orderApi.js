import { BASE_URL, authApi } from './api';
import { getOrderStatusColors } from '../config/orderColors';

// =============================================
// ORDER API INTEGRATION
// =============================================

const getAuthHeaders = async () => {
  const token = await authApi.getStoredToken();
  console.log('🔐 Token check:', token ? `${token.slice(0, 20)}...` : 'No token found');
  console.log('🔐 Token length:', token ? token.length : 0);
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  
  // Test if token looks like a JWT (has 3 parts separated by dots)
  const tokenParts = token.split('.');
  console.log('🔐 Token parts:', tokenParts.length, 'expected: 3');
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// =============================================
// BUYER ORDER FUNCTIONS
// =============================================

export const getBuyerOrders = async (filters = {}) => {
  try {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${BASE_URL}/api/orders${queryParams ? `?${queryParams}` : ''}`;
    
    console.log('🔄 Fetching buyer orders from:', url);
    console.log('📤 Request headers:', headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('📥 Response status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('📄 Response data:', data);

    if (!response.ok) {
      console.error('❌ API Error Response:', data);
      throw new Error(data.message || 'Failed to fetch orders');
    }

    console.log('✅ Buyer orders fetched successfully:', data.orders?.length || 0, 'orders');
    return data;

  } catch (error) {
    console.error('❌ Error fetching buyer orders:', error);
    throw error;
  }
};

export const getBuyerOrderStats = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/api/orders/stats/summary?role=buyer`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch order statistics');
    }

    console.log('✅ Buyer order stats fetched:', data.stats);
    return data.stats;

  } catch (error) {
    console.error('❌ Error fetching buyer order stats:', error);
    throw error;
  }
};

// =============================================
// SELLER ORDER FUNCTIONS
// =============================================

export const getSellerOrders = async (filters = {}) => {
  try {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    
    if (filters.status && filters.status !== 'All') {
      queryParams.append('status', filters.status);
    }
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);

    const url = `${BASE_URL}/api/orders/seller${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('🔄 Fetching seller orders from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch orders');
    }

    console.log('✅ Seller orders fetched successfully:', data.orders?.length || 0, 'orders');
    return data;

  } catch (error) {
    console.error('❌ Error fetching seller orders:', error);
    throw error;
  }
};

export const getSellerOrderStats = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/api/orders/stats/summary?role=seller`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch order statistics');
    }

    console.log('✅ Seller order stats fetched:', data.stats);
    return data.stats;

  } catch (error) {
    console.error('❌ Error fetching seller order stats:', error);
    throw error;
  }
};

// =============================================
// SHARED ORDER FUNCTIONS
// =============================================

export const getOrderDetails = async (orderId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch order details');
    }

    console.log('✅ Order details fetched for order:', orderId);
    return data.order;

  } catch (error) {
    console.error('❌ Error fetching order details:', error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const headers = await getAuthHeaders();
    console.log('🔄 Creating order with data:', orderData);

    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });

    console.log('📥 Order API response status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('📄 Order API response data:', data);

    if (!response.ok) {
      console.error('❌ Order API error response:', data);
      throw new Error(data.message || `Failed to create order (${response.status})`);
    }

    console.log('✅ Order created successfully:', data.orders?.length || 0, 'orders');
    return data;

  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, statusData) => {
  try {
    const headers = await getAuthHeaders();
    console.log('🔄 Updating order status:', orderId, statusData);

    const response = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(statusData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update order status');
    }

    console.log('✅ Order status updated successfully:', orderId);
    return data.order;

  } catch (error) {
    console.error('❌ Error updating order status:', error);
    throw error;
  }
};

export const cancelOrder = async (orderId) => {
  try {
    const headers = await getAuthHeaders();
    console.log('🔄 Cancelling order:', orderId);

    const response = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to cancel order');
    }

    console.log('✅ Order cancelled successfully:', orderId);
    return data;

  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    throw error;
  }
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

export const formatOrderStatus = (status) => {
  const colors = getOrderStatusColors(status);
  return {
    color: colors?.primary || '#FF8B47',
    icon: colors?.icon || 'help-circle',
    background: colors?.background || 'rgba(255, 139, 71, 0.1)',
    border: colors?.border || 'rgba(255, 139, 71, 0.3)',
    label: colors.label
  };
};

export const formatOrderDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Today';
  if (diffDays === 2) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
};

export const formatOrderPrice = (price) => {
  if (typeof price === 'string' && price.startsWith('₱')) {
    return price;
  }
  return `₱${parseFloat(price).toLocaleString()}`;
};

// =============================================
// ORDER VALIDATION
// =============================================

export const validateOrderData = (orderData) => {
  const errors = [];

  if (!orderData.cartItems || orderData.cartItems.length === 0) {
    errors.push('Cart items are required');
  }

  if (!orderData.shippingAddress) {
    errors.push('Shipping address is required');
  } else {
    if (!orderData.shippingAddress.street) errors.push('Street address is required');
    if (!orderData.shippingAddress.city) errors.push('City is required');
    if (!orderData.shippingAddress.province) errors.push('Province is required');
  }

  if (!orderData.paymentMethod) {
    errors.push('Payment method is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// =============================================
// EXPORT ALL FUNCTIONS
// =============================================

export default {
  // Buyer functions
  getBuyerOrders,
  getBuyerOrderStats,
  
  // Seller functions
  getSellerOrders,
  getSellerOrderStats,
  
  // Shared functions
  getOrderDetails,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  
  // Utility functions
  formatOrderStatus,
  formatOrderDate,
  formatOrderPrice,
  validateOrderData
};
