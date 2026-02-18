import { BASE_URL, authApi } from './api';

// Get messages between current user and a seller
export const getMessages = async (sellerId) => {
  try {
    const token = await authApi.getStoredToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('💬 Fetching messages with seller:', sellerId);
    
    const res = await fetch(`${BASE_URL}/api/chat/messages/${sellerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('💬 Messages response status:', res.status);
    const data = await res.json();
    console.log('💬 Messages response data:', JSON.stringify(data, null, 2));
    
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to fetch messages');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

// Send a message to a seller
export const sendMessage = async (sellerId, message, productData = null) => {
  try {
    const token = await authApi.getStoredToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('💬 Sending message to seller:', sellerId, 'message:', message, 'product:', productData?.name);
    
    const res = await fetch(`${BASE_URL}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sellerId: sellerId,
        message: message,
        productData: productData // Include product information
      })
    });
    
    console.log('💬 Send message response status:', res.status);
    const data = await res.json();
    console.log('💬 Send message response data:', JSON.stringify(data, null, 2));
    
    if (!res.ok) {
      // Check for specific database setup error
      if (data?.error === 'DATABASE_SETUP_REQUIRED') {
        throw new Error('Chat database not set up. Please contact support or try again later.');
      }
      throw new Error(data?.message || 'Failed to send message');
    }
    
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

// Get all conversations for current user
export const getConversations = async () => {
  try {
    const token = await authApi.getStoredToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('💬 Fetching conversations');
    
    const res = await fetch(`${BASE_URL}/api/chat/conversations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('💬 Conversations response status:', res.status);
    const data = await res.json();
    console.log('💬 Conversations response data:', JSON.stringify(data, null, 2));
    
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to fetch conversations');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (sellerId) => {
  try {
    const token = await authApi.getStoredToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('💬 Marking messages as read with seller:', sellerId);
    
    const res = await fetch(`${BASE_URL}/api/chat/mark-read/${sellerId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('💬 Mark read response status:', res.status);
    const data = await res.json();
    console.log('💬 Mark read response data:', JSON.stringify(data, null, 2));
    
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to mark messages as read');
    }
    
    return data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

// Delete entire chat conversation
export const deleteChat = async (partnerId) => {
  try {
    console.log('🗑️ Deleting chat conversation with partner:', partnerId);
    
    const token = await authApi.getStoredToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    
    const response = await fetch(`${BASE_URL}/api/chat/delete/${partnerId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('🗑️ Delete chat response status:', response.status);
    const data = await response.json();
    console.log('🗑️ Delete chat response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      throw new Error(data?.message || 'Failed to delete chat conversation');
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting chat conversation:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

// Send automated order status notification to buyer
export const sendOrderNotification = async (buyerId, orderNumber, status, productData = null, trackingNumber = null) => {
  try {
    console.log('🔔 Sending order notification:', { buyerId, orderNumber, status, productData, trackingNumber });
    
    const token = await authApi.getStoredToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    
    const response = await fetch(`${BASE_URL}/api/chat/send-order-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        buyerId,
        orderNumber,
        status,
        productData,
        trackingNumber
      })
    });
    
    console.log('🔔 Order notification response status:', response.status);
    const data = await response.json();
    console.log('🔔 Order notification response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      throw new Error(data?.message || 'Failed to send order notification');
    }
    
    return data;
  } catch (error) {
    console.error('Error sending order notification:', error);
    console.error('Error details:', error.message);
    // Don't throw error - notifications are not critical
    return { success: false, error: error.message };
  }
};

export default {
  getMessages,
  sendMessage,
  getConversations,
  markMessagesAsRead,
  deleteChat,
  sendOrderNotification
};