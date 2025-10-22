import { BASE_URL } from './api';

/**
 * Admin API functions for order management
 */

// Clear all orders (Admin only)
export const clearAllOrders = async () => {
  try {
    console.log('🗑️ Clearing all orders...');
    
    const token = await require('@react-native-async-storage/async-storage').default.getItem('authToken');
    
    const response = await fetch(`${BASE_URL}/api/admin/orders/clear`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ All orders cleared successfully');
      return { success: true, data };
    } else {
      console.error('❌ Failed to clear orders:', data.message);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('❌ Error clearing orders:', error);
    return { success: false, error: error.message };
  }
};

// Clear user's orders
export const clearUserOrders = async (userId) => {
  try {
    console.log(`🗑️ Clearing orders for user: ${userId}`);
    
    const token = await require('@react-native-async-storage/async-storage').default.getItem('authToken');
    
    const response = await fetch(`${BASE_URL}/api/admin/orders/clear-user/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ User orders cleared successfully');
      return { success: true, data };
    } else {
      console.error('❌ Failed to clear user orders:', data.message);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('❌ Error clearing user orders:', error);
    return { success: false, error: error.message };
  }
};

export default {
  clearAllOrders,
  clearUserOrders
};
