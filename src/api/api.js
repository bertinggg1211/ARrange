import { Platform } from 'react-native';

// Base URL for API requests - Dynamic Environment Configuration
import { API_BASE_URL } from '../config/environment';

export const BASE_URL = API_BASE_URL;

// Dynamic BASE_URL getter (simplified to avoid timeout issues)
export const getDynamicBaseUrl = async () => {
  // Always return the working BASE_URL to avoid complex server detection
  console.log('🌐 Using fixed BASE_URL:', BASE_URL);
  return BASE_URL;
};



console.log('🌐 Using BASE_URL:', BASE_URL);
console.log('🌐 Platform:', Platform.OS);

// Enhanced request function with dynamic URL
async function requestDynamic(path, { method = 'GET', body, token } = {}) {
  const baseUrl = await getDynamicBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  
  // Check if response is HTML (error page) instead of JSON
  if (text.trim().startsWith('<') || text.trim().startsWith('<!DOCTYPE')) {
    console.error('❌ Server returned HTML instead of JSON:', text.substring(0, 200));
    throw new Error(`Server returned HTML instead of JSON. Status: ${res.status}. Check if server is running.`);
  }
  
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (parseError) {
    console.error('❌ JSON Parse Error:', parseError.message);
    console.error('❌ Response text:', text.substring(0, 200));
    throw new Error(`Invalid JSON response from server: ${parseError.message}`);
  }
  
  if (!res.ok) {
    const message = data?.message || 'Request failed';
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return data;
}

// Enhanced request function with timeout and retry logic (FIXED - removed aggressive timeout)
async function request(path, { method = 'GET', body, token, timeout = 60000, retries = 2 } = {}) {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Request attempt ${attempt + 1}/${retries + 1}: ${method} ${path}`);
      console.log(`🌐 Making request to: ${BASE_URL}${path}`);
      
      // Removed AbortController timeout that was causing "Aborted" errors
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      console.log(`✅ Response received: ${res.status}`);
      
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        const message = data?.message || 'Request failed';
        const error = new Error(message);
        error.status = res.status;
        throw error;
      }
      return data;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Request attempt ${attempt + 1} failed:`, error.message);
      
      // If this is the last attempt, don't retry
      if (attempt === retries) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All attempts failed, try fallback or throw error
  console.error('❌ All retry attempts failed:', lastError.message);
  console.error('❌ BASE_URL:', BASE_URL);
  console.error('❌ Path:', path);
  
  // If it's a network error, try the fallback URL
  if (lastError.message.includes('Network request failed') && BASE_URL_FALLBACK) {
    console.log('🔄 Trying fallback URL:', BASE_URL_FALLBACK);
    try {
      const res = await fetch(`${BASE_URL_FALLBACK}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        const message = data?.message || 'Request failed';
        const error = new Error(message);
        error.status = res.status;
        throw error;
      }
      return data;
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError.message);
      throw lastError; // Throw original error
    }
  }
  
  throw lastError;
}

export const authApi = {
  signup: (payload) => requestDynamic('/api/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => requestDynamic('/api/auth/login', { method: 'POST', body: payload }),
  me: (token) => requestDynamic('/api/auth/me', { method: 'GET', token }),
  getStoredToken: async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('authToken');
  },
};

// AR Scanning API
export const arScanApi = {
  // Upload AR scan for a product
  uploadScan: async (productId, scanData, arModelFile, token) => {
    console.log('🔄 Uploading AR scan for product:', productId);
    console.log('📄 GLTF file details:', arModelFile ? {
      name: arModelFile.name,
      type: arModelFile.type,
      size: arModelFile.size
    } : 'No file');

    const formData = new FormData();
    
    // Add scan data
    formData.append('scanData', JSON.stringify(scanData));
    
    // Add AR model file if provided
    if (arModelFile) {
      console.log('📎 Preparing GLTF file for upload:', arModelFile);
      const isDataUri = !!(arModelFile.uri && arModelFile.uri.startsWith('data:'));
      if (isDataUri) {
        try {
          const [meta, base64] = arModelFile.uri.split(',');
          const mimeMatch = meta.match(/^data:([^;]+);base64$/);
          const mimeType = (mimeMatch && mimeMatch[1]) || (arModelFile.type || 'model/gltf+json');
          const fileName = arModelFile.name || `ar_model_${productId}.gltf`;
          // Send base64 fields so server can upload to Cloudinary as raw
          formData.append('arModelBase64', base64);
          formData.append('mimeType', mimeType);
          formData.append('fileName', fileName);
          console.log('📦 Attached base64 model fields for server-side upload');
        } catch (e) {
          console.log('⚠️ Failed to parse data URI for base64 upload:', e.message);
        }
      } else if (arModelFile.uri) {
        // Regular file/content URI
        formData.append('arModel', {
          uri: arModelFile.uri,
          type: arModelFile.type || 'model/gltf+json',
          name: arModelFile.name || `ar_model_${productId}.gltf`,
        });
      } else {
        console.log('⚠️ arModelFile provided without uri; skipping attach');
      }
    } else {
      console.log('⚠️ No AR model file provided for upload');
    }

    const baseUrl = await getDynamicBaseUrl();
    const response = await fetch(`${baseUrl}/api/seller/products/${productId}/ar-scan`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData - let the browser set it
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const text = await response.text();
    console.log('📤 Upload response:', response.status, text.substring(0, 200));
    
    const data = text ? JSON.parse(text) : {};
    
    if (!response.ok) {
      const message = data?.message || 'AR scan upload failed';
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    
    console.log('✅ AR scan uploaded successfully');
    return data;
  },

  // Get AR scan data for a product
  getScan: (productId, token) => 
    requestDynamic(`/api/products/${productId}/ar-scan`, { method: 'GET', token }),

  // Delete AR scan for a product
  deleteScan: (productId, token) => 
    requestDynamic(`/api/seller/products/${productId}/ar-scan`, { method: 'DELETE', token }),

  // Get all AR scans for a seller
  getSellerScans: (token, page = 1, limit = 10) => 
    requestDynamic(`/api/seller/products/ar-scans?page=${page}&limit=${limit}`, { method: 'GET', token }),
};


