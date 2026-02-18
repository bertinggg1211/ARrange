// Model loader utility for GLB files
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

// For WebView to load local GLB files, we need to write to a temporary location
// Large base64 strings cause WebView crashes, so we use file:// URLs instead

// Get the local model path by copying to cache directory
export const getLocalModelPath = async (forceReload = false) => {
  if (Platform.OS === 'android') {
    try {
      // Use cache directory for temporary file access
      const tempPath = `${RNFS.CachesDirectoryPath}/temp_model.glb`;
      
      console.log('📦 Copying GLB from Android assets to cache...');
      
      // Check if we need to copy
      const exists = await RNFS.exists(tempPath);
      
      if (!exists || forceReload) {
        // Copy from assets to cache directory
        await RNFS.copyFileAssets('TEST1.glb', tempPath);
        
        const stats = await RNFS.stat(tempPath);
        console.log('✅ GLB file copied to cache, size:', Math.round(stats.size / 1024 / 1024 * 100) / 100, 'MB');
      } else {
        console.log('✅ Using cached GLB file');
      }
      
      // Return file:// URL - WebView should be able to access cache directory
      const fileUrl = `file://${tempPath}`;
      console.log('✅ Model URL:', fileUrl);
      
      return fileUrl;
    } catch (error) {
      console.error('❌ Error setting up GLB file:', error);
      console.log('⚠️ Falling back to sample model');
      return getSampleModelPath();
    }
  }
  
  // For iOS or other platforms, use sample model
  return getSampleModelPath();
};

// Clear the cache (useful when updating the GLB file)
export const clearModelCache = () => {
  cachedBase64 = null;
  cacheTimestamp = null;
  console.log('🗑️ Model cache cleared');
};

// Alternative: Use a sample model that works on both platforms
export const getSampleModelPath = () => {
  return 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
};

// Legacy function for backward compatibility
export const getModelPath = async () => {
  return await getLocalModelPath();
};
