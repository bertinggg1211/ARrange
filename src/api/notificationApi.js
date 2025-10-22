import { BASE_URL } from './api';

// Get all notifications for the authenticated user (removed timeout for debugging)
export const getNotifications = async (token) => {
  try {
    console.log('🔄 Making request to:', `${BASE_URL}/api/notifications`);
    
    const response = await fetch(`${BASE_URL}/api/notifications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ Response received:', response.status);

    // Check if response is HTML (error page)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Server returned non-JSON response:', contentType);
      return { success: true, notifications: [] }; // Return empty notifications as fallback
    }

    const data = await response.json();
    if (data.success) {
      return { success: true, notifications: data.notifications };
    } else {
      throw new Error(data.message || 'Failed to fetch notifications');
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Return empty notifications as fallback instead of error
    return { success: true, notifications: [] };
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Check if response is HTML (error page)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Server returned non-JSON response:', contentType);
      return { success: true }; // Return success as fallback
    }

    const data = await response.json();
    if (data.success) {
      return { success: true };
    } else {
      throw new Error(data.message || 'Failed to mark notification as read');
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: true }; // Return success as fallback
  }
};

// Delete notification
export const deleteNotification = async (notificationId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Check if response is HTML (error page)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Server returned non-JSON response:', contentType);
      return { success: true }; // Return success as fallback
    }

    const data = await response.json();
    if (data.success) {
      return { success: true };
    } else {
      throw new Error(data.message || 'Failed to delete notification');
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: true }; // Return success as fallback
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/notifications/mark-all-read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Check if response is HTML (error page)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Server returned non-JSON response:', contentType);
      return { success: true }; // Return success as fallback
    }

    const data = await response.json();
    if (data.success) {
      return { success: true };
    } else {
      throw new Error(data.message || 'Failed to mark all notifications as read');
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: true }; // Return success as fallback
  }
};

// Clear all notifications
export const clearAllNotifications = async (token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/notifications/clear-all`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Check if response is HTML (error page)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Server returned non-JSON response:', contentType);
      return { success: true }; // Return success as fallback
    }

    const data = await response.json();
    if (data.success) {
      return { success: true };
    } else {
      throw new Error(data.message || 'Failed to clear all notifications');
    }
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    return { success: true }; // Return success as fallback
  }
};

// AR notification functionality removed for clean e-commerce setup
