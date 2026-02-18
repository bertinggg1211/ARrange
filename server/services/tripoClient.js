const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

function getEnv(name, fallback = undefined) {
  const v = process.env[name];
  if (v === undefined || v === null || v === '') return fallback;
  return v;
}

const TRIPO_API_KEY = getEnv('TRIPO_API_KEY');
const TRIPO_BASE_URL = getEnv('TRIPO_BASE_URL', 'https://api.tripo3d.ai/v2/openapi');

function requireEnv(vars) {
  const missing = vars.filter((n) => !getEnv(n));
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

/**
 * Use image URL directly (no upload needed for TRIPO)
 * @param {string} imageUrl - URL of the image on Cloudinary
 * @returns {Promise<{image_url: string}>}
 */
async function uploadImageToTripo(imageUrl) {
  console.log('📤 Using Cloudinary image URL for TRIPO:', imageUrl);
  
  // TRIPO can use URL directly - no need to upload
  return { image_url: imageUrl };
}

/**
 * Start an image-to-model task with TRIPO
 * @param {Object} params
 * @param {string} params.productId - Product ID for reference
 * @param {string} params.imageUrl - URL of the product image
 * @param {string} params.modelVersion - TRIPO model version (default: v2.5-20250123)
 * @returns {Promise<{task_id: string}>}
 */
async function startImageToModelTask({ productId, imageUrl, modelVersion = 'v2.5-20250123' }) {
  requireEnv(['TRIPO_API_KEY']);

  console.log('🚀 Starting TRIPO image-to-model task for product:', productId);

  // Step 1: Get image URL (already on Cloudinary)
  const { image_url } = await uploadImageToTripo(imageUrl);

  // Step 2: Create image-to-model task using URL
  const taskUrl = `${TRIPO_BASE_URL}/task`;
  const requestBody = {
    type: 'image_to_model',
    model_version: modelVersion,
    file: {
      type: 'jpg',
      url: image_url,  // Use URL instead of file_token
    },
    // Enable texture and PBR for better quality
    texture: true,
    pbr: true,
  };

  const taskResponse = await fetch(taskUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TRIPO_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  const taskText = await taskResponse.text();
  let taskData = {};
  try {
    taskData = taskText ? JSON.parse(taskText) : {};
  } catch (_) {
    console.error('Failed to parse TRIPO task response:', taskText);
  }

  if (!taskResponse.ok) {
    const message = taskData?.message || `TRIPO task creation failed (${taskResponse.status})`;
    const err = new Error(message);
    err.status = taskResponse.status;
    err.details = taskData;
    throw err;
  }

  console.log('✅ TRIPO task created:', taskData);
  return { ...taskData.data, productId }; // { task_id: "...", productId }
}

/**
 * Poll TRIPO task status with retry logic
 * @param {string} taskId - The TRIPO task ID
 * @param {number} retries - Number of retries on network errors (default: 3)
 * @returns {Promise<Object>} Task status object
 */
async function getTaskStatus(taskId, retries = 3) {
  requireEnv(['TRIPO_API_KEY']);

  const statusUrl = `${TRIPO_BASE_URL}/task/${taskId}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const statusResponse = await axios.get(statusUrl, {
        headers: {
          'Authorization': `Bearer ${TRIPO_API_KEY}`,
        },
        timeout: 60000, // Increased to 60 seconds
        // Add axios-specific options for better stability
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      });

      const statusData = statusResponse.data;

      if (statusResponse.status !== 200) {
        const message = statusData?.message || `TRIPO status check failed (${statusResponse.status})`;
        const err = new Error(message);
        err.status = statusResponse.status;
        err.details = statusData;
        throw err;
      }

      return statusData.data; // { task_id, type, status, output, progress, etc. }
      
    } catch (error) {
      // Check if it's a network/timeout error that we can retry
      const isNetworkError = error.code === 'ECONNRESET' || 
                            error.code === 'ETIMEDOUT' || 
                            error.code === 'ERR_BAD_RESPONSE' ||
                            error.message.includes('aborted') ||
                            error.message.includes('timeout');
      
      if (isNetworkError && attempt < retries) {
        console.log(`⚠️  Network error on attempt ${attempt}/${retries}, retrying in 2 seconds...`);
        console.log(`   Error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue; // Retry
      }
      
      // Non-retryable error or max retries reached
      throw error;
    }
  }
  
  throw new Error(`Failed to get task status after ${retries} retries`);
}

/**
 * Poll task until completion (with timeout and error resilience)
 * @param {string} taskId - The TRIPO task ID
 * @param {number} maxAttempts - Maximum polling attempts (default: 60)
 * @param {number} intervalMs - Polling interval in ms (default: 5000)
 * @returns {Promise<Object>} Final task status
 */
async function pollTaskUntilComplete(taskId, maxAttempts = 60, intervalMs = 5000) {
  console.log(`🔄 Polling TRIPO task ${taskId}...`);
  console.log(`📋 Will check every ${intervalMs/1000}s for up to ${maxAttempts * intervalMs/1000/60} minutes`);

  let lastKnownStatus = null;
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 5; // Allow 5 consecutive network errors before giving up

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const status = await getTaskStatus(taskId);
      
      // Reset error counter on successful fetch
      consecutiveErrors = 0;
      lastKnownStatus = status;
      
      console.log(`📊 Attempt ${attempt}/${maxAttempts} - Status: ${status.status}, Progress: ${status.progress}%`);

      // Check if finalized
      if (status.status === 'success') {
        console.log('✅ TRIPO task completed successfully!');
        return status;
      }

      if (['failed', 'banned', 'expired', 'cancelled', 'unknown'].includes(status.status)) {
        throw new Error(`TRIPO task ${status.status}: ${taskId}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      
    } catch (error) {
      consecutiveErrors++;
      console.error(`❌ Error polling task (${consecutiveErrors}/${maxConsecutiveErrors}):`, error.message);
      
      // If we've had too many consecutive errors, give up
      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.error(`❌ Too many consecutive errors (${consecutiveErrors}), stopping polling`);
        throw new Error(`TRIPO polling failed after ${consecutiveErrors} consecutive errors: ${error.message}`);
      }
      
      // If it's a network error and we have a last known status, continue polling
      const isNetworkError = error.code === 'ECONNRESET' || 
                            error.code === 'ETIMEDOUT' || 
                            error.code === 'ERR_BAD_RESPONSE' ||
                            error.message.includes('aborted') ||
                            error.message.includes('timeout');
      
      if (isNetworkError && lastKnownStatus) {
        console.log(`⚠️  Network error but continuing - last known progress: ${lastKnownStatus.progress}%`);
        // Wait a bit longer after errors
        await new Promise(resolve => setTimeout(resolve, intervalMs * 2));
        continue;
      }
      
      // Non-network error - throw immediately
      throw error;
    }
  }

  throw new Error(`TRIPO task polling timeout after ${maxAttempts} attempts (${maxAttempts * intervalMs/1000/60} minutes)`);
}

/**
 * Start a multi-view-to-model task with TRIPO
 * @param {Object} params
 * @param {string} params.productId - Product ID for reference
 * @param {Object} params.imageUrls - Object with URLs: {front, left, back, right}
 * @param {string} params.modelVersion - TRIPO model version (default: v3.0-20250812)
 * @returns {Promise<{task_id: string}>}
 */
async function startMultiviewToModelTask({ productId, imageUrls, modelVersion = 'v3.0-20250812' }) {
  requireEnv(['TRIPO_API_KEY']);

  console.log('🚀 Starting TRIPO multi-view-to-model task for product:', productId);
  console.log('📸 Image URLs:', {
    front: !!imageUrls.front,
    left: !!imageUrls.left,
    back: !!imageUrls.back,
    right: !!imageUrls.right
  });

  // Build files array in order: [front, left, back, right]
  // Front is required, others can be empty {}
  const files = [
    // Front (REQUIRED)
    imageUrls.front ? {
      type: 'jpg',
      url: imageUrls.front
    } : null,
    // Left (optional)
    imageUrls.left ? {
      type: 'jpg',
      url: imageUrls.left
    } : {},
    // Back (optional)
    imageUrls.back ? {
      type: 'jpg',
      url: imageUrls.back
    } : {},
    // Right (optional)
    imageUrls.right ? {
      type: 'jpg',
      url: imageUrls.right
    } : {}
  ];

  if (!files[0]) {
    throw new Error('Front image is required for multi-view generation');
  }

  // Create multi-view-to-model task
  const taskUrl = `${TRIPO_BASE_URL}/task`;
  const requestBody = {
    type: 'multiview_to_model',
    model_version: modelVersion,
    files: files,
    texture: true,
    pbr: true,
    geometry_quality: 'standard' // or 'detailed' for v3.0+
  };

  console.log('📤 TRIPO multi-view request:', JSON.stringify(requestBody, null, 2));

  const taskResponse = await fetch(taskUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TRIPO_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  const taskText = await taskResponse.text();
  let taskData = {};
  try {
    taskData = taskText ? JSON.parse(taskText) : {};
  } catch (_) {
    console.error('Failed to parse TRIPO task response:', taskText);
  }

  if (!taskResponse.ok) {
    const message = taskData?.message || `TRIPO multi-view task creation failed (${taskResponse.status})`;
    const err = new Error(message);
    err.status = taskResponse.status;
    err.details = taskData;
    throw err;
  }

  console.log('✅ TRIPO multi-view task created:', taskData);
  return { ...taskData.data, productId }; // { task_id: "...", productId }
}

module.exports = {
  startImageToModelTask,
  startMultiviewToModelTask,
  getTaskStatus,
  pollTaskUntilComplete,
  uploadImageToTripo,
};
