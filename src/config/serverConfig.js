import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default server configurations
const SERVER_CONFIGS = {
  // Your development servers
  LOCAL_DEV: 'http://192.168.100.9:5000',
  LOCAL_EMULATOR: 'http://10.0.2.2:5000',
  
  // Production/Demo servers (update these with your actual URLs)
  PRODUCTION: 'https://arrange-wf18.onrender.com',
  
  // Backup servers (you can add more)
  BACKUP_1: 'https://your-backup-server.herokuapp.com',
  BACKUP_2: 'https://your-production-server.com',
};

// Server priority order for auto-detection (LOCAL ONLY)
const SERVER_PRIORITY = [
  SERVER_CONFIGS.LOCAL_DEV,        // 🔧 LOCAL DEVELOPMENT MODE (primary)
  SERVER_CONFIGS.LOCAL_EMULATOR,   // For Android emulator (fallback)
  // Removed external servers for local development
];

class ServerManager {
  constructor() {
    this.currentServer = null;
    this.isConnected = false;
    this.lastChecked = null;
  }

  // Test if a server is reachable with faster timeout
  async testServer(serverUrl, timeout = 2000) {
    try {
      console.log(`🧪 Testing server: ${serverUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Server reachable: ${serverUrl}`);
        return true;
      } else {
        console.log(`❌ Server error ${response.status}: ${serverUrl}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Server failed: ${serverUrl} - ${error.message}`);
      return false;
    }
  }

  // Find the first working server
  async findWorkingServer() {
    console.log('🔍 Searching for working server...');
    
    for (const serverUrl of SERVER_PRIORITY) {
      const isWorking = await this.testServer(serverUrl);
      if (isWorking) {
        this.currentServer = serverUrl;
        this.isConnected = true;
        this.lastChecked = Date.now();
        
        // Save the working server for future use
        await AsyncStorage.setItem('lastWorkingServer', serverUrl);
        
        console.log(`🎯 Found working server: ${serverUrl}`);
        return serverUrl;
      }
    }
    
    console.log('❌ No working server found');
    this.isConnected = false;
    return null;
  }

  // Get the current server URL
  async getServerUrl() {
    // If we have a recent successful connection, use it
    if (this.currentServer && this.isConnected && 
        this.lastChecked && (Date.now() - this.lastChecked) < 30000) {
      return this.currentServer;
    }

    // Try to get the last working server from storage
    try {
      const lastWorking = await AsyncStorage.getItem('lastWorkingServer');
      if (lastWorking) {
        const isStillWorking = await this.testServer(lastWorking);
        if (isStillWorking) {
          this.currentServer = lastWorking;
          this.isConnected = true;
          this.lastChecked = Date.now();
          return lastWorking;
        }
      }
    } catch (error) {
      console.log('⚠️ Could not check stored server:', error.message);
    }

    // Find a new working server
    const workingServer = await this.findWorkingServer();
    return workingServer;
  }

  // Allow user to manually set server URL
  async setCustomServer(serverUrl) {
    const isWorking = await this.testServer(serverUrl);
    if (isWorking) {
      this.currentServer = serverUrl;
      this.isConnected = true;
      this.lastChecked = Date.now();
      await AsyncStorage.setItem('lastWorkingServer', serverUrl);
      await AsyncStorage.setItem('customServer', serverUrl);
      return true;
    }
    return false;
  }

  // Get server status
  getStatus() {
    return {
      currentServer: this.currentServer,
      isConnected: this.isConnected,
      lastChecked: this.lastChecked,
    };
  }

  // Show server selection dialog
  async showServerSelectionDialog() {
    return new Promise((resolve) => {
      Alert.alert(
        '🌐 Server Connection',
        'Choose how to connect to the server:',
        [
          {
            text: 'Auto-detect',
            onPress: async () => {
              const server = await this.findWorkingServer();
              resolve(server);
            }
          },
          {
            text: 'Enter URL',
            onPress: () => {
              // This would need to be implemented with a TextInput modal
              // For now, we'll just auto-detect
              this.findWorkingServer().then(resolve);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null)
          }
        ]
      );
    });
  }
}

// Create singleton instance
const serverManager = new ServerManager();

// Export the main function to get BASE_URL
export const getBaseUrl = async () => {
  const serverUrl = await serverManager.getServerUrl();
  if (!serverUrl) {
    throw new Error('No server available. Please check your internet connection and try again.');
  }
  return serverUrl;
};

// Export server manager for advanced usage
export { serverManager, SERVER_CONFIGS };

// Export a function to get BASE_URL synchronously (for existing code compatibility)
export const BASE_URL_SYNC = SERVER_CONFIGS.LOCAL_DEV; // Use local development for immediate use

console.log('🌐 Server Manager initialized');
console.log('📋 Available servers:', Object.keys(SERVER_CONFIGS));
