import { authApi, BASE_URL as ROOT_BASE } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = `${ROOT_BASE}/api/seller`;

// Helper function to get auth headers
const getAuthHeaders = async () => {
  try {
    const token = await authApi.getStoredToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw new Error('Authentication required');
  }
};

// Get seller profile (removed timeout for debugging)
export const getSellerProfile = async () => {
  try {
    const headers = await getAuthHeaders();
    
    console.log('🔄 Making request to:', `${BASE_URL}/profile`);
    
    const response = await fetch(`${BASE_URL}/profile`, {
      method: 'GET',
      headers
    });
    
    console.log('✅ Response received:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch seller profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    throw error;
  }
};

// Update seller profile
export const updateSellerProfile = async (profileData) => {
  try {
    const token = await authApi.getStoredToken();
    const form = new FormData();
    
    console.log('=== API: updateSellerProfile called ===');
    console.log('profileData received:', JSON.stringify(profileData, null, 2));
    
    // Append simple fields
    Object.entries(profileData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && typeof value !== 'object') {
        console.log(`Appending ${key}: ${value}`);
        form.append(key, String(value));
      }
    });
    // Append nested sellerProfile if provided
    if (profileData.sellerProfile && typeof profileData.sellerProfile === 'object') {
      console.log('Appending sellerProfile nested fields:');
      Object.entries(profileData.sellerProfile).forEach(([key, value]) => {
        if (value !== undefined && value !== null && typeof value !== 'object') {
          console.log(`  sellerProfile[${key}]: ${value}`);
          form.append(`sellerProfile[${key}]`, String(value));
        }
      });
    }
    // Append files if present
    if (profileData.avatar) {
      console.log('Appending avatar file:', profileData.avatar);
      form.append('avatar', profileData.avatar);
    }
    if (profileData.cover) {
      console.log('Appending cover file:', profileData.cover);
      form.append('cover', profileData.cover);
    }
    if (profileData.shopLogo) {
      console.log('✅ CLIENT: Appending shopLogo file:', JSON.stringify(profileData.shopLogo, null, 2));
      // React Native FormData requires this specific format
      form.append('shopLogo', {
        uri: profileData.shopLogo.uri,
        type: profileData.shopLogo.type || 'image/jpeg',
        name: profileData.shopLogo.name || 'shop-logo.jpg',
      });
    } else {
      console.log('❌ CLIENT: No shopLogo in profileData');
    }
    if (profileData.shopBanner) {
      console.log('✅ CLIENT: Appending shopBanner file:', JSON.stringify(profileData.shopBanner, null, 2));
      // React Native FormData requires this specific format
      form.append('shopBanner', {
        uri: profileData.shopBanner.uri,
        type: profileData.shopBanner.type || 'image/jpeg',
        name: profileData.shopBanner.name || 'shop-banner.jpg',
      });
    } else {
      console.log('❌ CLIENT: No shopBanner in profileData');
    }

    // Debug: Log FormData (React Native doesn't support entries())
    console.log('🔍 CLIENT: FormData created successfully');
    
    console.log('🚀 CLIENT: Sending FormData with headers');
    const response = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData - let the browser set it with boundary
      },
      body: form,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update seller profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating seller profile:', error);
    throw error;
  }
};

// Get seller stats (removed timeout for debugging)
export const getSellerStats = async () => {
  try {
    const headers = await getAuthHeaders();
    
    console.log('🔄 Making request to:', `${BASE_URL}/stats`);
    
    const response = await fetch(`${BASE_URL}/stats`, {
      method: 'GET',
      headers
    });
    
    console.log('✅ Response received:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch seller stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    throw error;
  }
};

// Update business information
export const updateBusinessInfo = async (businessData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/business`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(businessData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update business information');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating business info:', error);
    throw error;
  }
};

// Delete seller profile image
export const deleteSellerProfileImage = async (imageType) => {
  try {
    const headers = await getAuthHeaders();
    
    console.log('Deleting:', imageType);

    const response = await fetch(`${BASE_URL}/api/seller/profile/delete-image`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ imageType }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete image');
    }

    const result = await response.json();
    console.log('Success:', result);
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// All functions are already exported individually above
