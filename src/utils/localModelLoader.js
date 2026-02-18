// Local model loader utility for GLB files
import { Platform } from 'react-native';

// Get the local model path from Android assets or fallback to remote
export const getLocalModelPath = (modelType = 'TEST1') => {
  // For Android, use the proper file:// URL for assets
  if (Platform.OS === 'android') {
    switch (modelType) {
      case 'TEST1':
        return 'file:///android_asset/TEST1.glb';
      default:
        return 'file:///android_asset/TEST1.glb';
    }
  }
  // For iOS or other platforms, fall back to sample model
  return getSampleModelPath();
};

// Get model info for display
export const getLocalModelInfo = (modelType = 'TEST1') => {
  const models = {
    'TEST1': {
      name: 'TEST1 Model',
      description: 'Local 3D model from Android assets',
      size: 'Unknown',
      format: 'GLB'
    }
  };
  
  return models[modelType] || models['TEST1'];
};

// Get all available local models
export const getAvailableLocalModels = () => {
  return [
    {
      id: 'TEST1',
      name: 'TEST1 Model',
      description: 'Local 3D model from Android assets',
      size: 'Unknown',
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
