// Script to convert GLB file to base64 for use in React Native
// This is a utility to help convert your TEST1.glb file

import { Platform } from 'react-native';

// For now, we'll use a sample model
// To use your TEST1.glb file, you would need to:
// 1. Convert it to base64
// 2. Store it as a constant
// 3. Use it in the WebView

export const convertGLBToBase64 = async (filePath) => {
  // This would convert your GLB file to base64
  // For now, returning a sample model URL
  return 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
};

// Sample GLB model that works
export const getWorkingModel = () => {
  return 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
};

// For your TEST1.glb file, you would need to:
// 1. Use a tool to convert GLB to base64
// 2. Store the base64 string as a constant
// 3. Use it in the model-viewer

// Example of how to use your local GLB file:
// const test1Model = 'data:model/gltf-binary;base64,YOUR_BASE64_STRING_HERE';

