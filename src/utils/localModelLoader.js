// Local model loader utility for GLB files
import { Platform } from 'react-native';

// Import the base64 encoded TEST3.glb file (smaller size - 1.95MB)
import TEST3_GLB_DATA_URL from '../data/TEST3_GLB_BASE64.js';

// Get the local TEST3.glb model as base64 data URL (smaller size - 1.95MB)
export const getLocalModelPath = (modelType = 'TEST3') => {
  switch (modelType) {
    case 'TEST3':
      return TEST3_GLB_DATA_URL;
    default:
      return TEST3_GLB_DATA_URL;
  }
};

// Get model info for display
export const getLocalModelInfo = (modelType = 'TEST3') => {
  const models = {
    'TEST3': {
      name: 'TEST3 Model',
      description: 'High-quality 3D model',
      size: '1.95MB',
      format: 'GLB'
    }
  };
  
  return models[modelType] || models['TEST3'];
};

// Get all available local models
export const getAvailableLocalModels = () => {
  return [
    {
      id: 'TEST3',
      name: 'TEST3 Model',
      description: 'High-quality 3D model',
      size: '1.95MB',
      format: 'GLB'
    }
  ];
};

// Alternative: Use a sample model that works on both platforms
export const getSampleModelPath = () => {
  return 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
};

// Legacy function for backward compatibility
export const getModelPath = () => {
  return getLocalModelPath();
};
