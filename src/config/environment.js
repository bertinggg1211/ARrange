// Dynamic Environment Configuration
// This file automatically detects and configures the environment

// Environment detection
const isDevelopment = __DEV__;
const isProduction = !__DEV__;

// Environment types
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  NGROK: 'ngrok',
  PRODUCTION: 'production'
};

// Configuration for different environments
const ENVIRONMENT_CONFIGS = {
  [ENVIRONMENTS.DEVELOPMENT]: {
    API_BASE_URL: 'http://192.168.100.9:5000',
    SOCKET_URL: 'http://192.168.100.9:5000',
    IMAGE_BASE_URL: 'http://192.168.100.9:5000',
    DEBUG_MODE: true,
    APP_NAME: 'ARrange (Dev)',
  },
  
  [ENVIRONMENTS.NGROK]: {
    // 🔧 YOUR ACTUAL NGROK URL:
    API_BASE_URL: 'https://effortlessly-holey-qiana.ngrok-free.dev',
    SOCKET_URL: 'https://effortlessly-holey-qiana.ngrok-free.dev',
    IMAGE_BASE_URL: 'https://effortlessly-holey-qiana.ngrok-free.dev',
    DEBUG_MODE: true,
    APP_NAME: 'ARrange (Ngrok)',
  },
  
  [ENVIRONMENTS.PRODUCTION]: {
    // UPDATE THIS WITH YOUR PRODUCTION URL
    API_BASE_URL: 'https://your-production-url.com',
    SOCKET_URL: 'https://your-production-url.com',
    IMAGE_BASE_URL: 'https://your-production-url.com',
    DEBUG_MODE: false,
    APP_NAME: 'ARrange',
  }
};

// Current environment selection
// - ENVIRONMENTS.DEVELOPMENT (for local IP: 192.168.100.9:5000)
// - ENVIRONMENTS.NGROK (for ngrok testing)  
// - ENVIRONMENTS.PRODUCTION (for APK builds)

// 👇 CHANGE THIS LINE TO SWITCH:
const CURRENT_ENVIRONMENT = ENVIRONMENTS.DEVELOPMENT;

// Get current configuration
const getCurrentConfig = () => {
  const config = ENVIRONMENT_CONFIGS[CURRENT_ENVIRONMENT];
  
  if (!config) {
    console.warn(`⚠️ Unknown environment: ${CURRENT_ENVIRONMENT}, falling back to development`);
    return ENVIRONMENT_CONFIGS[ENVIRONMENTS.DEVELOPMENT];
  }
  
  console.log(`🌐 Environment: ${CURRENT_ENVIRONMENT}`);
  console.log(`🔗 API URL: ${config.API_BASE_URL}`);
  
  return config;
};

// Export configuration
export const CONFIG = getCurrentConfig();

// Supabase Configuration
// NOTE: These are PUBLIC keys that are safe to include in client-side code
export const SUPABASE_URL = 'https://uqabqigsgrmtylcgheqg.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxYWJxaWdzZ3JtdHlsY2doZXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Mzc1MDIsImV4cCI6MjA3NTQxMzUwMn0.sVS_RnQ5udaZkIyZskHq2tGrAeh693RMuaDl2c6jjvo';

// Export individual values for convenience
export const { 
  API_BASE_URL, 
  SOCKET_URL, 
  IMAGE_BASE_URL, 
  DEBUG_MODE, 
  APP_NAME 
} = CONFIG;

// Helper functions
export const isNgrokEnvironment = () => CURRENT_ENVIRONMENT === ENVIRONMENTS.NGROK;
export const isProductionEnvironment = () => CURRENT_ENVIRONMENT === ENVIRONMENTS.PRODUCTION;
export const isDevelopmentEnvironment = () => CURRENT_ENVIRONMENT === ENVIRONMENTS.DEVELOPMENT;

// Environment switching utility
export const switchEnvironment = (newEnvironment) => {
  console.log(`🔄 Switching from ${CURRENT_ENVIRONMENT} to ${newEnvironment}`);
  // Note: This requires app restart to take effect
  return ENVIRONMENT_CONFIGS[newEnvironment];
};

export default CONFIG;
