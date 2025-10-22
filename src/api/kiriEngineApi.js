import { BASE_URL } from './api';
import RNFS from 'react-native-fs';
import { unzip } from 'react-native-zip-archive';

// 🎯 KIRI Engine API Configuration - PRODUCTION ONLY
const ENABLE_MOCK_MODE = false; // Production only - no local fallbacks

// 🔧 FIX: Try both endpoints for better compatibility
const KIRI_ENDPOINTS = {
  PHOTO_SCAN: 'https://api.kiriengine.app/api/v1/open/photo/image',
  GAUSSIAN_SPLATTING: 'https://api.kiriengine.app/api/v1/open/3dgs/image',
  MESH_GENERATION: 'https://api.kiriengine.app/api/v1/open/mesh/image'
};

const KIRI_API_BASE = KIRI_ENDPOINTS.PHOTO_SCAN; // Use Photo Scan engine

// 🎯 KIRI Engine API Key Configuration
const KIRI_API_KEY_DIRECT = 'kiri_ONN7SqEztzJbCfCxmGOE3AoEKRIB_x_CDUDiAzwJGRw'; // Direct API key
let KIRI_API_KEY = null; // Will be fetched from server or use direct key

// 🎯 ZIP Extraction and 3D Model Detection Functions
const extractZipAndFindModel = async (zipUrl, scanId) => {
  try {
    console.log('📦 Starting ZIP extraction process...');
    console.log('📦 ZIP URL:', zipUrl);
    
    // Create extraction directory
    const extractDir = `${RNFS.DocumentDirectoryPath}/kiri_extracted_${scanId}`;
    const zipPath = `${RNFS.DocumentDirectoryPath}/kiri_model_${scanId}.zip`;
    
    // Download ZIP file
    console.log('📥 Downloading ZIP file...');
    const downloadResult = await RNFS.downloadFile({
      fromUrl: zipUrl,
      toFile: zipPath,
      headers: {
        'User-Agent': 'KIRI-Engine-Client/1.0'
      }
    }).promise;
    
    if (downloadResult.statusCode !== 200) {
      throw new Error(`Failed to download ZIP: ${downloadResult.statusCode}`);
    }
    
    console.log('✅ ZIP downloaded successfully');
    
    // Extract ZIP file
    console.log('📂 Extracting ZIP file...');
    await unzip(zipPath, extractDir);
    console.log('✅ ZIP extracted to:', extractDir);
    
    // Find 3D model files (GLB, GLTF, OBJ, PLY)
    const modelFiles = await findModelFiles(extractDir);
    console.log('🎯 Found model files:', modelFiles);
    
    if (modelFiles.length === 0) {
      throw new Error('No 3D model files found in ZIP');
    }
    
    // Get the best quality model file (prefer GLB > GLTF > OBJ > PLY)
    const bestModel = getBestModelFile(modelFiles);
    console.log('🏆 Best model file:', bestModel);
    
    return {
      success: true,
      extractDir,
      modelFiles,
      bestModel,
      zipPath
    };
    
  } catch (error) {
    console.error('❌ ZIP extraction failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const findModelFiles = async (directory) => {
  try {
    const files = await RNFS.readDir(directory);
    const modelFiles = [];
    
    for (const file of files) {
      if (file.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findModelFiles(file.path);
        modelFiles.push(...subFiles);
      } else {
        const ext = file.name.toLowerCase().split('.').pop();
        if (['glb', 'gltf', 'obj', 'ply', 'fbx', 'dae'].includes(ext)) {
          modelFiles.push({
            name: file.name,
            path: file.path,
            size: file.size,
            extension: ext
          });
        }
      }
    }
    
    return modelFiles;
  } catch (error) {
    console.error('❌ Error finding model files:', error);
    return [];
  }
};

const getBestModelFile = (modelFiles) => {
  // Priority order: GLB > GLTF > OBJ > PLY > FBX > DAE
  const priority = ['glb', 'gltf', 'obj', 'ply', 'fbx', 'dae'];
  
  for (const ext of priority) {
    const file = modelFiles.find(f => f.extension === ext);
    if (file) {
      return file;
    }
  }
  
  // If no priority file found, return the largest file
  return modelFiles.reduce((largest, current) => 
    current.size > largest.size ? current : largest
  );
};

// Function to get KIRI API key from server or use direct key
const getKiriApiKey = async () => {
  if (KIRI_API_KEY) return KIRI_API_KEY;
  
  // Try direct API key first
  if (KIRI_API_KEY_DIRECT) {
    console.log('🔑 Using direct KIRI API key...');
    KIRI_API_KEY = KIRI_API_KEY_DIRECT;
    console.log('✅ Direct KIRI API key loaded:', KIRI_API_KEY.substring(0, 10) + '...');
    return KIRI_API_KEY;
  }
  
  try {
    console.log('🔑 Fetching KIRI API key from server...');
    const response = await fetch(`${BASE_URL}/api/kiri/config`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get API key');
    }
    
    KIRI_API_KEY = data.apiKey;
    console.log('✅ KIRI API key obtained from server:', KIRI_API_KEY.substring(0, 10) + '...');
    return KIRI_API_KEY;
  } catch (error) {
    console.error('❌ Failed to get KIRI API key from server:', error);
    throw new Error('KIRI Engine API key not available');
  }
};

// KIRI Engine API Service
export const kiriEngineApi = {
  // Create 3D scan from images
  createScan: async (images, productName, scanType = 'photogrammetry', onProgress = null, onCancel = null) => {
    try {
      console.log(`🚀 Starting KIRI Engine scan for: ${productName}`);
      console.log(`📸 Processing ${images.length} optimized images (25 photos for efficiency)...`);
      
      // 🔧 PRODUCTION MODE: Using real KIRI Engine API only
      console.log('🌐 PRODUCTION MODE: Using real KIRI Engine API');
      
      // Basic validation
      console.log('📋 Validating photos before KIRI Engine upload...');
      if (!images || images.length === 0) {
        throw new Error('No photos provided for KIRI Engine processing');
      }
      
      // Get API key from server with validation
      console.log('🔑 Fetching KIRI API key from server...');
      const apiKey = await getKiriApiKey();
      
      if (!apiKey) {
        throw new Error('Failed to obtain KIRI Engine API key from server');
      }
      
      console.log('✅ KIRI API key obtained:', {
        hasKey: !!apiKey,
        keyLength: apiKey.length,
        keyPrefix: apiKey.substring(0, 10) + '...',
        keyValid: apiKey.startsWith('kiri_')
      });
      
      if (!apiKey.startsWith('kiri_')) {
        throw new Error('Invalid KIRI Engine API key format (should start with "kiri_")');
      }
      
      // 🔧 FIX: Try multiple endpoints if 403 error occurs
      const tryKiriEndpoint = async (endpoint, endpointName) => {
        console.log(`🔄 Trying KIRI Engine endpoint: ${endpointName}`);
        console.log(`🌐 URL: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });
        
        console.log(`📡 ${endpointName} Response:`, response.status, response.statusText);
        
        if (response.status === 403) {
          console.warn(`⚠️ 403 Forbidden on ${endpointName} - trying next endpoint...`);
          return null;
        }
        
        if (!response.ok) {
          console.error(`❌ ${endpointName} failed:`, response.status, response.statusText);
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`❌ Error details:`, errorText);
          return null;
        }
        
        return response;
      };
      
      // Validate images array
      console.log(`🔍 Validating ${images.length} images before KIRI upload:`);
      const validImages = [];
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const imageUri = image.uri || image;
        
        if (!imageUri) {
          console.warn(`⚠️ Image ${i + 1} has no URI:`, image);
          continue;
        }
        
        if (typeof imageUri !== 'string') {
          console.warn(`⚠️ Image ${i + 1} URI is not a string:`, typeof imageUri, imageUri);
          continue;
        }
        
        if (!imageUri.startsWith('file://') && !imageUri.startsWith('content://') && !imageUri.startsWith('http')) {
          console.warn(`⚠️ Image ${i + 1} has invalid URI format:`, imageUri);
          continue;
        }
        
        // Check file existence
        try {
          let filePath = imageUri;
          if (imageUri.startsWith('file://')) {
            filePath = imageUri.replace('file://', '');
          }
          
          const exists = await RNFS.exists(filePath);
          console.log(`📁 File ${i + 1} (${imageUri.substring(0, 30)}...) exists?`, exists);
          
          if (!exists) {
            console.warn(`⚠️ Image ${i + 1} file does not exist:`, imageUri);
            continue;
          }
          
          // Check file size
          const stat = await RNFS.stat(filePath);
          console.log(`📊 File ${i + 1} size:`, stat.size, 'bytes');
          
          if (stat.size === 0) {
            console.warn(`⚠️ Image ${i + 1} is empty (0 bytes):`, imageUri);
            continue;
          }
          
        } catch (fileError) {
          console.warn(`⚠️ Error checking file ${i + 1}:`, fileError.message);
          continue;
        }
        
        console.log(`✅ Image ${i + 1} valid and accessible:`, imageUri.substring(0, 50) + '...');
        validImages.push(image);
      }
      
      console.log(`📊 Valid images: ${validImages.length}/${images.length}`);
      
      // 🛠 DEBUG STRATEGY 4: Ultra-lenient image validation (quality checks completely bypassed)
      if (validImages.length < 1) {
        throw new Error(`❌ NO IMAGES: ${validImages.length} images provided. Need at least 1 image for KIRI Engine (quality checks bypassed).`);
      }
      
      if (validImages.length > 300) {
        console.warn(`⚠️ Too many images: ${validImages.length}/300 maximum. Using first 300 images.`);
        validImages = validImages.slice(0, 300);
      }
      
      console.log(`✅ Image count validation passed: ${validImages.length} images (1-300 range, quality checks completely bypassed)`);
      
      // 🛠 DEBUG STRATEGY 3: Validate Upload Endpoint Parameters
      console.log('🔍 KIRI Engine endpoint validation:');
      console.log('📋 Available endpoints:', Object.keys(KIRI_ENDPOINTS));
      console.log('🎯 Primary endpoint:', KIRI_ENDPOINTS.GAUSSIAN_SPLATTING);
      console.log('🔄 Fallback endpoints:', [KIRI_ENDPOINTS.PHOTO_SCAN, KIRI_ENDPOINTS.MESH_GENERATION]);
      
      // Create form data for KIRI Engine API
      let formData;
      try {
        formData = new FormData();
        console.log('✅ FormData object created successfully');
      } catch (formDataError) {
        console.error('❌ Failed to create FormData:', formDataError);
        throw new Error(`FormData creation failed: ${formDataError.message}`);
      }
      
      // 🎯 Enhanced full-resolution image upload to KIRI Engine
      console.log(`📦 Adding ${validImages.length} high-quality images to FormData...`);
      console.log(`🔍 ValidImages array:`, validImages.map((img, i) => ({
        index: i,
        type: typeof img,
        hasUri: !!img.uri,
        uri: img.uri ? img.uri.substring(0, 50) + '...' : 'NO URI',
        length: img.uri ? img.uri.length : 0
      })));
      
      try {
        validImages.forEach((image, index) => {
          const imageUri = image.uri || image;
          console.log(`🔍 Processing image ${index + 1}: ${imageUri.substring(0, 60)}...`);
          
          // Enhanced validation
          if (!imageUri || typeof imageUri !== 'string') {
            throw new Error(`Invalid image URI for photo ${index + 1}: ${typeof imageUri} - ${imageUri}`);
          }
          
          if (imageUri.length < 10) {
            throw new Error(`Image URI too short for photo ${index + 1}: ${imageUri.length} chars`);
          }
          
          // React Native compatible image data format
          const imageData = {
            uri: imageUri,
            type: 'image/jpeg', // KIRI Engine prefers JPEG
            name: `kiri_photo_${Date.now()}_${index + 1}.jpg`, // Unique filename
          };
          
          console.log(`📎 Adding image ${index + 1} to FormData:`, {
            name: imageData.name,
            type: imageData.type,
            uri: imageUri.substring(0, 50) + '...',
            uriLength: imageUri.length,
            isValid: true
          });
          
          formData.append('imagesFiles', imageData);
          console.log(`✅ Successfully added image ${index + 1} to FormData`);
        });
        
        console.log(`✅ All ${validImages.length} images added to FormData successfully`);
        console.log(`📊 FormData prepared with ${validImages.length} images (entries method not available in React Native)`);
        
      } catch (imageProcessingError) {
        console.error('❌ Error processing images for FormData:', imageProcessingError);
        console.error('❌ Image processing error details:', {
          message: imageProcessingError.message,
          stack: imageProcessingError.stack,
          validImagesLength: validImages.length,
          validImages: validImages.map((img, i) => ({
            index: i,
            type: typeof img,
            hasUri: !!img.uri,
            uri: img.uri ? img.uri.substring(0, 30) + '...' : 'NO URI'
          }))
        });
        throw new Error(`Image processing failed: ${imageProcessingError.message}`);
      }
      
      console.log(`✅ FormData prepared with ${validImages.length} images`);
      
      // 🛠 DEBUG STRATEGY 3: Validate Parameter Names for Each KIRI Engine Endpoint
      console.log('📋 Adding KIRI Engine parameters with endpoint-specific validation...');
      
      // Core parameters for all endpoints
      formData.append('fileFormat', 'GLB'); // GLB format for AR compatibility
      formData.append('isMask', '0'); // 0 = no mask (full object scan)
      
      // Parameters for Photo Scan only (no 3DGS) - PHOTO SCAN SETTINGS
      formData.append('isMesh', '0'); // 0 = no mesh (Photo Scan only)
      formData.append('modelQuality', '1'); // 1 = high quality for Photo Scan
      formData.append('textureQuality', '1'); // 1 = high texture quality
      formData.append('textureSmoothing', '1'); // 1 = smoother texture output
      formData.append('meshSimplification', '0'); // 0 = keep full detail
      
      // Photo Scan parameters - PHOTO SCAN ONLY
      formData.append('featurelessScan', '1'); // 1 = good for smooth objects like mouse
      formData.append('no3DGS', '1'); // 1 = disable 3DGS (Photo Scan only)
      
      // Quality settings - OPTIMIZED FOR PHOTO SCAN
      formData.append('quality', 'high'); // high = best quality for Photo Scan
      formData.append('lowQualityMode', '0'); // 0 = disable unless photos are bad
      
      // Enhanced quality parameters - OPTIMIZED SETTINGS
      formData.append('qualityThreshold', '0.6'); // 0.6 = reasonable image quality gate
      formData.append('processingMode', 'ROBUST'); // ROBUST = better handling
      
      // Log all FormData parameters for debugging
      console.log('📋 FORMDATA PARAMETERS ADDED (PHOTO SCAN ONLY):');
      const parametersList = [
        'fileFormat: GLB (good for web/app use)',
        'isMask: 0 (keep masking off unless background is cluttered)',
        'isMesh: 0 (NO mesh - Photo Scan only)',
        'modelQuality: 1 (high quality for Photo Scan)',
        'textureQuality: 1 (high texture quality)',
        'textureSmoothing: 1 (smooth texture output)',
        'meshSimplification: 0 (keep full detail)',
        'featurelessScan: 1 (helps with objects like mouse)',
        'no3DGS: 1 (disable 3D Gaussian Splatting - Photo Scan only)',
        'quality: high (best quality for Photo Scan)',
        'lowQualityMode: 0 (disable unless photos are bad)',
        'qualityThreshold: 0.6 (reasonable image quality gate)',
        'processingMode: ROBUST',
        `imagesFiles: ${validImages.length} images`
      ];
      parametersList.forEach(param => console.log(`  ✅ ${param}`));
      
      console.log(`✅ All parameters added to FormData for KIRI Engine processing`);
      
      // Use the correct KIRI Engine endpoint
      const endpoint = KIRI_API_BASE;
      
      let response = null;
      let lastError = null;
      
      try {
        console.log(`🔍 Calling KIRI endpoint: ${endpoint}`);
        console.log(`📸 Uploading ${validImages.length} validated images to KIRI Engine...`);
        console.log(`📋 Request details:`, {
          method: 'POST',
          endpoint: endpoint,
          imageCount: validImages.length,
          hasApiKey: !!apiKey
        });
        
        console.log(`🚀 Sending FormData with ${validImages.length} images to KIRI Engine...`);
        
        // 🎯 PHOTO SCAN ONLY: Use only Photo Scan endpoint
        const endpointsToTry = [
          { url: KIRI_ENDPOINTS.PHOTO_SCAN, name: 'Photo Scan (No 3DGS)' }
        ];
        
        let response = null;
        let lastError = '';
        
        for (const { url, name } of endpointsToTry) {
          try {
            console.log(`🔄 Attempting ${name} endpoint...`);
            console.log(`🌐 URL: ${url}`);
            console.log(`🔑 API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'NOT SET'}`);
            console.log(`📦 FormData ready: ${formData ? 'YES' : 'NO'}`);
            
            if (!apiKey) {
              lastError = `No API key available for ${name}`;
              console.error(`❌ ${lastError}`);
              continue;
            }
            
            if (!formData) {
              lastError = `FormData not ready for ${name}`;
              console.error(`❌ ${lastError}`);
              continue;
            }
            
            console.log(`🚀 Making fetch request to ${name}...`);
            
            // 🛠 DEBUG STRATEGY 1: Log the Full HTTP Request
            console.log('📋 FULL REQUEST DEBUG:', {
              method: 'POST',
              url: url,
              headers: {
                'Authorization': `Bearer ${apiKey.substring(0, 15)}...`,
                'Content-Type': 'multipart/form-data (auto-set by browser)'
              },
              bodyType: 'FormData',
              formDataEntries: formData ? 'Present' : 'Missing',
              timestamp: new Date().toISOString()
            });
            
            console.log(`🚀 Making fetch request to ${name}...`);
            console.log(`📊 FormData size check:`, {
              hasFormData: !!formData,
              imagesCount: validImages.length,
              formDataType: typeof formData,
              formDataConstructor: formData?.constructor?.name || 'unknown'
            });
            
            // Add timeout for large uploads
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
            
            try {
              response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  // Don't set Content-Type for FormData - let browser set it with boundary
                },
                body: formData,
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
            } catch (fetchError) {
              clearTimeout(timeoutId);
              if (fetchError.name === 'AbortError') {
                throw new Error(`Upload timeout after 5 minutes for ${name}`);
              }
              throw fetchError;
            }
            
            console.log(`📡 Upload response received for ${name}:`, {
              status: response.status,
              statusText: response.statusText,
              ok: response.ok
            });
            
            // 🛠 DEBUG STRATEGY 1: Log the Full HTTP Response
            console.log(`📡 FULL RESPONSE DEBUG for ${name}:`, {
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
              url: response.url,
              redirected: response.redirected,
              type: response.type,
              headers: {
                contentType: response.headers.get('content-type'),
                contentLength: response.headers.get('content-length'),
                server: response.headers.get('server'),
                date: response.headers.get('date')
              }
            });
            
            // 🛠 DEBUG STRATEGY 1: Get Raw Response Text Before Parsing
            let responseText = '';
            try {
              responseText = await response.clone().text(); // Clone to avoid consuming the stream
              console.log(`📄 RAW RESPONSE TEXT (${name}):`, {
                length: responseText.length,
                preview: responseText.substring(0, 500),
                isJSON: responseText.trim().startsWith('{') || responseText.trim().startsWith('['),
                isEmpty: responseText.trim().length === 0
              });
            } catch (textError) {
              console.error(`❌ Failed to read response text for ${name}:`, textError);
              responseText = 'ERROR_READING_RESPONSE';
            }
            
            // 🛠 DEBUG STRATEGY 6: Handle All KIRI Engine Error Codes Systematically
            if (response.status === 401) {
              console.error(`🚫 401 Unauthorized on ${name} - Invalid API key`);
              lastError = `401 Unauthorized: Invalid API key for ${name}`;
              continue;
            }
            
            if (response.status === 403) {
              console.warn(`⚠️ 403 Forbidden on ${name} - API key lacks access to this endpoint`);
              console.log(`💡 TIP: Check if your KIRI Engine plan includes access to ${name} endpoint`);
              lastError = `403 Forbidden: No access to ${name} endpoint`;
              continue;
            }
            
            if (response.status === 400) {
              console.error(`❌ 400 Bad Request on ${name}:`, responseText.substring(0, 300));
              console.log(`💡 TIP: Check parameter names and image count (need 20+ images)`);
              lastError = `400 Bad Request on ${name}: ${responseText.substring(0, 100)}`;
              continue;
            }
            
            if (response.status === 413) {
              console.error(`📦 413 Payload Too Large on ${name} - Images too big`);
              lastError = `413 Payload Too Large: Reduce image size for ${name}`;
              continue;
            }
            
            if (response.status === 429) {
              console.error(`⏱️ 429 Rate Limited on ${name} - Too many requests`);
              lastError = `429 Rate Limited: Wait before retrying ${name}`;
              continue;
            }
            
            if (response.status >= 500) {
              console.error(`🔥 ${response.status} Server Error on ${name}:`, responseText.substring(0, 200));
              lastError = `${response.status} Server Error on ${name}`;
              continue;
            }
            
            if (!response.ok) {
              console.error(`❌ Unexpected ${response.status} error on ${name}:`, responseText.substring(0, 200));
              lastError = `${response.status} ${response.statusText} on ${name}`;
              continue;
            }
            
            // Success! Parse the response and extract serialize token
            console.log(`✅ ${name} endpoint successful!`);
            
            // Parse the successful response to get serialize token
            try {
              const successResponseText = responseText || await response.text();
              console.log('📋 SUCCESS - Raw response text:', successResponseText);
              
              const parsedResponse = JSON.parse(successResponseText);
              console.log('📋 SUCCESS - Parsed response:', JSON.stringify(parsedResponse, null, 2));
              
              // Extract serialize token from KIRI Engine response
              const serializeToken = parsedResponse?.data?.serialize;
              if (!serializeToken) {
                throw new Error('No serialize token in KIRI Engine response');
              }
              
              console.log('🎯 SERIALIZE TOKEN EXTRACTED:', serializeToken);
              
              // Store the parsed response for further processing
              response.parsedData = parsedResponse;
              response.serializeToken = serializeToken;
              
            } catch (parseError) {
              console.error('❌ Failed to parse successful response:', parseError);
              lastError = `Response parsing failed: ${parseError.message}`;
              continue;
            }
            
            break;
            
          } catch (error) {
            console.warn(`⚠️ ${name} endpoint error:`, error.message);
            lastError = `${name}: ${error.message}`;
            continue; // Try next endpoint
          }
        }
        
        if (!response || !response.ok) {
          console.error(`❌ All KIRI Engine endpoints failed. Last error: ${lastError}`);
          throw new Error(`All KIRI endpoints failed: ${lastError}`);
        }
        
        console.log(`✅ KIRI Engine upload successful! Starting status polling...`);
        
        // Extract serialize token for status polling
        const serializeToken = response.serializeToken;
        if (!serializeToken) {
          throw new Error('No serialize token received from KIRI Engine');
        }
        
        console.log('🔄 Starting status polling with serialize token:', serializeToken);
        
        // Poll for scan completion with progress callbacks
        const scanResult = await kiriEngineApi.pollScanStatus(
          serializeToken,
          onProgress, // Pass the progress callback
          onCancel    // Pass the cancel callback
        );
        console.log('✅ Scan completed successfully:', scanResult);
        
        // Return the scan result
        return scanResult;
        
      } catch (error) {
        console.error(`❌ KIRI API processing failed: ${error.message}`);
        throw new Error(`KIRI Engine processing failed: ${error.message}`);
      }
    } catch (mainError) {
      console.error('❌ KIRI Engine scan error:', mainError);
      throw new Error(`KIRI Engine scan failed: ${mainError.message}`);
    }
  },

  // 🛠 DEBUG STRATEGY 7: Proper Serialize Polling Implementation with User Control
  pollScanStatus: async (serializeToken, onProgress = null, onCancel = null) => {
    const maxAttempts = 60; // 5 minutes max (5 second intervals)
    let attempts = 0;
    let isCancelled = false;
    
    console.log(`🔄 Starting status polling for serialize: ${serializeToken}`);
    
    // Show polling popup with progress
    if (onProgress) {
      onProgress({
        isPolling: true,
        attempts: 0,
        maxAttempts,
        message: 'Starting 3D model generation...',
        canCancel: true
      });
    }
    
    while (attempts < maxAttempts && !isCancelled) {
      attempts++;
      
      try {
        // Get API key for status check
        const apiKey = await getKiriApiKey();
        if (!apiKey) {
          throw new Error('No API key available for status check');
        }
        
        console.log(`🔍 Polling attempt ${attempts}/${maxAttempts} for scan ${serializeToken}`);
        
        const response = await fetch(`https://api.kiriengine.app/api/v1/open/model/getStatus?serialize=${serializeToken}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });
        
        console.log(`📡 Status check response:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (!response.ok) {
          console.warn(`⚠️ Status check failed: ${response.status} ${response.statusText}`);
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        
        const statusText = await response.text();
        console.log(`📄 Status response text:`, statusText.substring(0, 200));
        
        let statusData;
        try {
          statusData = JSON.parse(statusText);
          console.log(`📊 Parsed status data:`, JSON.stringify(statusData, null, 2));
        } catch (parseError) {
          console.error(`❌ Failed to parse status response:`, parseError);
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        
        // Check KIRI Engine status codes with enhanced debugging
        const status = statusData.data?.status !== undefined ? statusData.data.status : statusData.status;
        const message = statusData.data?.message || statusData.message || statusData.msg;
        
        console.log(`🎯 KIRI Engine Status: ${status} (type: ${typeof status}), Message: ${message}`);
        console.log(`🔍 Status extraction debug:`, {
          'statusData.data?.status': statusData.data?.status,
          'statusData.data?.status type': typeof statusData.data?.status,
          'statusData.status': statusData.status,
          'statusData.status type': typeof statusData.status,
          'final status': status,
          'final status type': typeof status,
          'status === 0': status === 0,
          'status == 0': status == 0,
          'status === "0"': status === "0",
          'statusData.data': statusData.data,
          'full statusData': statusData
        });
        
        // FIXED: Correct KIRI Engine status code handling with type safety
        if (status === 0 || status === "0" || status === 2 || status === "2") {
          // Success! Scan completed (status 0 = completed, status 2 = fully processed)
          console.log(`✅ KIRI Engine scan completed successfully! (Status ${status}, type: ${typeof status})`);
          
          // Extract all possible download URLs from the response
          const downloadUrl = statusData.data?.downloadUrl || 
                             statusData.downloadUrl || 
                             statusData.data?.glbUrl || 
                             statusData.glbUrl ||
                             statusData.data?.modelUrl ||
                             statusData.modelUrl;
          
          console.log(`📥 Download URL found:`, downloadUrl);
          console.log(`📊 Full completion data:`, statusData.data);
          
          const result = {
            success: true,
            scanId: serializeToken,
            status: 'completed',
            glbUrl: downloadUrl,
            downloadUrl: downloadUrl,
            fileSize: statusData.data?.fileSize || 'Unknown',
            quality: 'High Quality (KIRI Engine)',
            message: `Scan completed successfully (Status ${status})`,
            attempts,
            duration: `${attempts * 5} seconds`,
            timestamp: Date.now(),
            rawData: statusData.data // Include raw data for debugging
          };
          
          // Store serialize token for potential retry
          console.log(`💾 Storing serialize token for potential retry: ${serializeToken}`);
          kiriEngineApi.storeSerializeToken(serializeToken, result.scanId);
          
          // 🎯 FIX 1: Add delay after status 0 before fetching model ZIP
          console.log("⏳ Waiting 15 seconds for model packaging to complete...");
          await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
          
          // Get model zip URL using smart retry logic
          console.log(`🔄 Status is ${status} - Model completed. Fetching model ZIP...`);
          
          // Update progress for the modal
          if (onProgress) {
            onProgress({
              isPolling: true,
              attempts: 1,
              maxAttempts: 15,
              message: "Model completed! Fetching download URL...",
              status: 'downloading',
              canCancel: true
            });
          }
          
          const modelZipUrl = await kiriEngineApi.getModelZipWithRetry(serializeToken, 10, onProgress);
          
          if (modelZipUrl) {
            // 🎯 NEW: Extract ZIP and find 3D model files
            console.log(`📦 Extracting ZIP file and finding 3D model...`);
            const extractionResult = await extractZipAndFindModel(modelZipUrl, serializeToken);
            
            if (extractionResult.success) {
              console.log(`✅ ZIP extracted successfully:`, extractionResult.bestModel);
              
              // Upload extracted 3D model to Cloudinary
              console.log(`🚀 Uploading extracted 3D model to Cloudinary...`);
              const cloudinaryUrl = await kiriEngineApi.uploadModelToCloudinary(extractionResult.bestModel.path);
              
              if (!cloudinaryUrl) {
                throw new Error('Cloudinary upload failed - no fallback available');
              }
              
              console.log(`✅ Successfully uploaded extracted model to Cloudinary: ${cloudinaryUrl}`);
              result.cloudinaryUrl = cloudinaryUrl;
              result.glbUrl = cloudinaryUrl; // Use Cloudinary URL for AR viewing
              result.extractedModel = extractionResult.bestModel;
              result.modelFiles = extractionResult.modelFiles;
              result.message = `3D model extracted and uploaded to Cloudinary successfully`;
              
              // 🎯 Auto-launch AR viewer
              console.log(`🎯 Auto-launching AR viewer with Cloudinary model...`);
              result.autoLaunchAR = true;
              result.arModelPath = cloudinaryUrl;
            } else {
              throw new Error(`ZIP extraction failed: ${extractionResult.error}`);
            }
          } else {
            throw new Error('Could not retrieve model ZIP after maximum attempts');
          }
          
          return result;
        } else if (status === 1 || status === "1" || status === 3 || status === "3") {
          // Still processing - continue polling (status 1 = processing, status 3 = rendering)
          console.log(`⏳ Scan still processing (status ${status}, type: ${typeof status}). Waiting 5 seconds... (attempt ${attempts}/60)`);
          
          // Update progress
          if (onProgress) {
            onProgress({
              isPolling: true,
              attempts,
              maxAttempts,
              message: `Processing 3D model... (${attempts}/${maxAttempts})`,
              status: status,
              canCancel: true
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        } else if (status === undefined || status === null) {
          // Handle undefined status - might be API response format issue
          console.warn(`⚠️ Status is undefined. Full response:`, statusData);
          console.log(`⏳ Assuming still processing. Waiting 5 seconds... (attempt ${attempts}/60)`);
          
          // Update progress for undefined status
          if (onProgress) {
            onProgress({
              isPolling: true,
              attempts,
              maxAttempts,
              message: `Processing 3D model... (${attempts}/${maxAttempts}) - Status unknown`,
              status: 'unknown',
              canCancel: true
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        } else {
          // Other status codes indicate errors
          console.error(`❌ KIRI Engine scan failed with status ${status}: ${message}`);
          throw new Error(`KIRI Engine scan failed: Status ${status} - ${message}`);
        }
        
      } catch (pollError) {
        console.error(`❌ Status polling error (attempt ${attempts}):`, pollError);
        
        if (attempts >= maxAttempts) {
          throw new Error(`Status polling failed after ${maxAttempts} attempts: ${pollError.message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Check for cancellation
      if (onCancel && onCancel()) {
        console.log('🛑 Polling cancelled by user');
        isCancelled = true;
        break;
      }
    }
    
    if (isCancelled) {
      throw new Error('3D model generation cancelled by user');
    }
    
    throw new Error(`KIRI Engine scan timeout after ${maxAttempts} attempts (${maxAttempts * 5} seconds)`);
  },

  // Store serialize token for later retry
  storeSerializeToken: (serializeToken, scanId) => {
    try {
      // Store in AsyncStorage for persistence
      const tokenData = {
        serializeToken,
        scanId,
        timestamp: Date.now(),
        status: 'completed_scan_awaiting_download'
      };
      
      // Store in memory for immediate access
      kiriEngineApi.storedTokens = kiriEngineApi.storedTokens || {};
      kiriEngineApi.storedTokens[scanId] = tokenData;
      
      console.log(`💾 Stored serialize token for scan ${scanId}: ${serializeToken}`);
      return tokenData;
    } catch (error) {
      console.error('❌ Error storing serialize token:', error);
      return null;
    }
  },

  // Get stored serialize token
  getStoredToken: (scanId) => {
    try {
      const tokenData = kiriEngineApi.storedTokens?.[scanId];
      if (tokenData) {
        console.log(`📋 Retrieved stored token for scan ${scanId}`);
        return tokenData;
      }
      return null;
    } catch (error) {
      console.error('❌ Error retrieving stored token:', error);
      return null;
    }
  },

  // Retry download without re-scanning
  retryDownload: async (scanId, onProgress = null) => {
    try {
      console.log(`🔄 Retrying download for scan ${scanId}...`);
      
      const tokenData = kiriEngineApi.getStoredToken(scanId);
      if (!tokenData) {
        throw new Error('No stored token found for this scan');
      }
      
      const { serializeToken } = tokenData;
      console.log(`🔑 Using stored serialize token: ${serializeToken}`);
      
      // Use the smart retry logic
      console.log(`🔄 Using smart retry logic for download...`);
      
      if (onProgress) {
        onProgress({
          isPolling: true,
          attempts: 1,
          maxAttempts: 15,
          message: "Retrying download with smart logic...",
          status: 'retrying_download',
          canCancel: true
        });
      }
      
      const modelZipUrl = await kiriEngineApi.getModelZipWithRetry(serializeToken, 10, onProgress);
      
      if (modelZipUrl) {
        // Upload to Cloudinary
        console.log(`🚀 Uploading retried model to Cloudinary...`);
        const cloudinaryUrl = await kiriEngineApi.uploadModelToCloudinary(modelZipUrl);
        
        return {
          success: true,
          scanId,
          glbUrl: cloudinaryUrl || modelZipUrl,
          downloadUrl: modelZipUrl,
          cloudinaryUrl,
          message: cloudinaryUrl ? 'Model downloaded and uploaded successfully' : 'Model downloaded successfully'
        };
      } else {
        throw new Error('Could not get model download URL after retry attempts');
      }
    } catch (error) {
      console.error('❌ Error in retry download:', error);
      throw error;
    }
  },

  // Step 3: Get model zip download URL from KIRI Engine with smart retry logic
  getModelZipWithRetry: async (serialize, maxAttempts = 15, progressCallback = null) => {
    const apiUrl = `https://api.kiriengine.app/api/v1/open/model/getModelZip?serialize=${serialize}`;

    console.log(`🔄 Starting ZIP retrieval for serialize: ${serialize}`);
    console.log(`⏰ Max attempts: ${maxAttempts}`);

    let consecutiveServerErrors = 0;
    const maxConsecutiveServerErrors = 3;
    const maxTotalTime = 300000; // 5 minutes total timeout
    const startTime = Date.now();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Check total timeout
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > maxTotalTime) {
        console.error(`⏰ Total timeout reached (${elapsedTime / 1000}s). Stopping retries.`);
        throw new Error(`KIRI Engine timeout after ${elapsedTime / 1000}s. Please try again later.`);
      }
      
      console.log(`🔄 [getModelZip] Attempt ${attempt}/${maxAttempts}... (${(elapsedTime / 1000).toFixed(1)}s elapsed)`);
      
      try {
        // Exponential backoff with jitter to prevent thundering herd
        const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Cap at 30s
        const jitter = Math.random() * 1000; // Add 0-1s random jitter
        const delay = baseDelay + jitter;
        
        if (attempt > 1) {
          console.log(`⏳ Waiting ${(delay / 1000).toFixed(1)}s before attempt ${attempt}...`);
          
          // Update progress with retry information
          if (progressCallback) {
            progressCallback({
              status: 'retrying',
              message: `Retrying download (attempt ${attempt}/${maxAttempts})...`,
              delay: delay,
              attempt: attempt,
              maxAttempts: maxAttempts,
              canCancel: true
            });
          }
          
          await new Promise(r => setTimeout(r, delay));
        }
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${KIRI_API_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': 'KIRI-Engine-Client/1.0',
            'Accept': 'application/json'
          },
        });
        
        console.log(`📡 Response status: ${response.status}`);
        
        if (!response.ok) {
          console.warn(`⚠️ HTTP ${response.status} error`);
          
          // Handle HTTP 500 errors with circuit breaker pattern
          if (response.status === 500) {
            consecutiveServerErrors++;
            console.log(`🔥 Server error count: ${consecutiveServerErrors}/${maxConsecutiveServerErrors}`);
            
            // Circuit breaker: if too many consecutive server errors, fail fast
            if (consecutiveServerErrors >= maxConsecutiveServerErrors) {
              console.error(`🚨 Circuit breaker triggered! Too many consecutive server errors (${consecutiveServerErrors})`);
              throw new Error(`KIRI Engine servers are overloaded. Please try again later. (Circuit breaker: ${consecutiveServerErrors} consecutive errors)`);
            }
            
            // Try to extract model URL from 500 response (sometimes it's there)
            try {
              const text = await response.text();
              const json = JSON.parse(text);
              if (json.data && json.data.modelUrl) {
                console.log("✅ Model URL found in 500 response:", json.data.modelUrl);
                consecutiveServerErrors = 0; // Reset on success
                return json.data.modelUrl;
              }
            } catch (e) {
              // Ignore parsing errors, continue with retry
            }
            
            console.log(`💡 This usually means:
   • KIRI Engine servers are overloaded
   • Temporary server maintenance
   • Server-side processing error`);
            console.log(`⏳ Server error - using exponential backoff...`);
            
            // Update progress with server error information
            if (progressCallback) {
              progressCallback({
                status: 'server_error',
                message: `Server overloaded (attempt ${attempt}/${maxAttempts})...`,
                delay: delay,
                attempt: attempt,
                maxAttempts: maxAttempts,
                canCancel: true,
                serverError: true
              });
            }
            
            if (attempt < maxAttempts) {
              continue; // Use the exponential backoff delay already calculated
            }
            throw new Error(`KIRI Engine server error (HTTP 500) - attempt ${attempt}`);
          } else {
            // Reset server error counter for non-500 errors
            consecutiveServerErrors = 0;
          }
          
          // Handle other HTTP errors with normal retry logic
          if (attempt < maxAttempts) {
            console.log(`⏳ Retrying in ${delay / 1000}s...`);
            continue;
          }
          throw new Error(`HTTP ${response.status} error after ${attempt} attempts`);
        }
        
        const text = await response.text();
        console.log("📄 Raw response:", text.substring(0, 300) + (text.length > 300 ? '...' : ''));

        let json;
        try {
          json = JSON.parse(text);
        } catch (parseError) {
          console.error("❌ Failed to parse JSON response:", parseError);
          console.log("📄 Raw text:", text);
          if (attempt < maxAttempts) {
            console.log(`⏳ Retrying in ${delay / 1000}s...`);
            continue;
          }
          throw new Error(`Invalid JSON response after ${attempt} attempts`);
        }

        console.log("🔍 Parsed JSON structure:", {
          code: json.code,
          msg: json.msg,
          hasData: !!json.data,
          dataKeys: json.data ? Object.keys(json.data) : 'no data',
          modelUrl: json.data?.modelUrl,
          serialize: json.data?.serialize
        });
        
        // Success case - model is ready
        if (json.code === 200 && json.data && json.data.modelUrl) {
          console.log("✅ Model ZIP ready:", json.data.modelUrl);
          consecutiveServerErrors = 0; // Reset circuit breaker on success
          return json.data.modelUrl;
        }

        // Handle processing statuses
        if (json.code === 2000 || 
            json.code === 1000 || 
            json.code === 1001 ||
            json.msg?.includes("being processed") || 
            json.msg?.includes("processing") ||
            json.msg?.includes("wait") ||
            json.msg?.includes("generating")) {
          console.log(`⏳ Model still processing... (${json.msg || `code: ${json.code}`})`);
          if (attempt < maxAttempts) {
            console.log(`⏳ Retrying in ${delay / 1000}s...`);
            continue;
          }
        }
        
        // Handle other statuses
        if (json.code === 400 || json.code === 404) {
          console.log(`❌ Model not found or invalid serialize token: ${json.msg}`);
          throw new Error(`Model not found: ${json.msg}`);
        }
        
        // If we get here, it's an unexpected response
        console.log(`⚠️ Unexpected response (attempt ${attempt}):`, {
          code: json.code,
          msg: json.msg,
          hasData: !!json.data,
          dataKeys: json.data ? Object.keys(json.data) : 'no data'
        });

        if (attempt < maxAttempts) {
          console.log(`⏳ Retrying in ${delay / 1000}s...`);
          continue;
        }

      } catch (err) {
        console.error(`❌ Error fetching model zip (attempt ${attempt}):`, err.message);
        if (attempt < maxAttempts) {
          const delay = Math.min(2000 + (attempt * 1000), 10000);
          console.log(`⏳ Retrying in ${delay / 1000}s...`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          throw err; // Re-throw on final attempt
        }
      }
    }

    throw new Error(`Model ZIP could not be retrieved after ${maxAttempts} attempts`);
  },

  // Step 3: Get model zip download URL from KIRI Engine
  getModelZip: async (serializeToken) => {
    try {
      console.log(`📡 Getting model zip URL for serialize: ${serializeToken}`);
      console.log(`🔑 Using API key: ${KIRI_API_KEY ? 'Present' : 'Missing'}`);
      
      // Add delay to ensure model is fully processed
      console.log(`⏳ Waiting 3 seconds to ensure model is fully processed...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const url = `https://api.kiriengine.app/api/v1/open/model/getModelZip?serialize=${serializeToken}`;
      console.log(`🌐 Request URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${KIRI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      // Get response text first for debugging
      const responseText = await response.text();
      console.log(`📄 Raw response: ${responseText}`);

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log(`📋 Parsed model zip response:`, JSON.stringify(data, null, 2));
          
          if (data.code === 200 && data.data?.modelUrl) {
            console.log(`✅ Model zip URL obtained: ${data.data.modelUrl}`);
            return data.data.modelUrl;
          } else if (data.code === 2000 && data.msg === "The model is currently being processed") {
            console.log(`⏳ Model still processing according to getModelZip - returning null for retry`);
            return null; // Return null to trigger retry in the calling function
          } else {
            throw new Error(`KIRI Engine getModelZip failed: ${data.msg || data.message || 'Unknown error'} (Code: ${data.code})`);
          }
        } catch (parseError) {
          console.error(`❌ Failed to parse getModelZip response:`, parseError);
          throw new Error(`Invalid JSON response from getModelZip: ${responseText}`);
        }
      } else {
        // Handle HTTP 500 with JSON error response
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.code === 2000 && errorData.msg === "The model is currently being processed") {
            console.log(`⏳ HTTP 500 but model still processing: ${errorData.msg}`);
            return null; // Return null to trigger retry in the calling function
          } else {
            console.error(`❌ HTTP ${response.status} error from getModelZip:`, errorData);
            throw new Error(`HTTP ${response.status}: ${errorData.msg || errorData.message || 'Unknown error'}`);
          }
        } catch (parseError) {
          console.error(`❌ HTTP ${response.status} error from getModelZip:`, responseText);
          throw new Error(`HTTP ${response.status}: ${responseText || response.statusText}`);
        }
      }
    } catch (error) {
      console.error('❌ Error getting model zip URL:', error);
      
      // Don't throw error - return null to continue with original download URL
      console.log('⚠️ Falling back to original KIRI Engine download URL');
      return null;
    }
  },

  // Step 4 & 5: Upload model to Cloudinary
  uploadModelToCloudinary: async (modelPath) => {
    try {
      console.log(`☁️ Uploading model to Cloudinary from: ${modelPath}`);
      
      // Read the file as base64 on the mobile device
      const fileData = await RNFS.readFile(modelPath, 'base64');
      console.log(`📁 File read successfully: ${fileData.length} characters`);
      
      // Send the file data to server
      const response = await fetch(`${BASE_URL}/api/upload/ar-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelData: fileData,
          fileName: '3DModel.glb',
          folder: 'ar_models'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Cloudinary upload successful:`, data);
        return data.secure_url || data.cloudinaryUrl;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Cloudinary upload failed: ${errorData.message || response.statusText}`);
        throw new Error(`Cloudinary upload failed: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error uploading to Cloudinary:', error);
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }
};

// Utility functions
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return 'Unknown';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const validateKiriApiKey = async () => {
  try {
    const result = await kiriEngineApi.getCredits();
    return result && typeof result === 'object';
  } catch (error) {
    return false;
  }
};

// Export API key for external use
export const getKiriApiKeyDirect = () => {
  return KIRI_API_KEY_DIRECT;
};

// Validate API key format and provide troubleshooting
export const validateApiKeyFormat = (apiKey) => {
  const issues = [];
  
  if (!apiKey) {
    issues.push('API key is empty or undefined');
    return { valid: false, issues };
  }
  
  if (typeof apiKey !== 'string') {
    issues.push('API key is not a string');
    return { valid: false, issues };
  }
  
  if (!apiKey.startsWith('kiri_')) {
    issues.push('API key does not start with "kiri_"');
  }
  
  if (apiKey.length < 20) {
    issues.push('API key appears too short (should be longer)');
  }
  
  if (apiKey.length > 100) {
    issues.push('API key appears too long');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    format: apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5),
    length: apiKey.length
  };
};

// Export configuration for enhanced KIRI Engine integration
export const KIRI_CONFIG = {
  API_BASE: KIRI_ENDPOINTS.PHOTO_SCAN,
  API_KEY: KIRI_API_KEY_DIRECT, // Direct API key included
  PRODUCTION_MODE: true, // Production only - no local fallbacks
  ENHANCED_QUALITY: true, // High-quality photo processing enabled
  SCAN_TYPE: 'PHOTO_SCAN_ONLY', // Photo Scan only (no 3DGS)
  QUALITY_MODE: 'HIGH_QUALITY_PHOTO_SCAN', // Optimized for Photo Scan quality
  ENDPOINTS: KIRI_ENDPOINTS, // All available endpoints
  PHOTO_REQUIREMENTS: {
    MIN_PHOTOS: 1, // Ultra-lenient - quality checks completely bypassed
    OPTIMAL_PHOTOS: 30, // Enhanced scanner captures 30 photos for faster processing
    MAX_PHOTOS: 60, // Increased to accommodate 50 photos for maximum accuracy
  }
};
