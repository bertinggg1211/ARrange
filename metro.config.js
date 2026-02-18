const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Fix for Supabase URL polyfill compatibility
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json', 'cjs'],
    // Add GLB file support
    assetExts: ['glb', 'gltf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ttf', 'otf', 'mp4', 'mov', 'avi', 'webm'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
