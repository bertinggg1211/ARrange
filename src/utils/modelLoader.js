// Model loader utility for GLB files
import { Platform } from 'react-native';

// Import the base64 encoded TEST3.glb file (changed from TEST2.glb)
import TEST3_GLB_DATA_URL from '../data/TEST3_GLB_BASE64.js';

// Get the local TEST3.glb model as base64 data URL
export const getLocalModelPath = () => {
  // Return the base64 data URL for the local TEST3.glb file
  return TEST3_GLB_DATA_URL;
};

// Alternative: Use a sample model that works on both platforms
export const getSampleModelPath = () => {
  return 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
};

// Legacy function for backward compatibility
export const getModelPath = () => {
  return getLocalModelPath();
};
