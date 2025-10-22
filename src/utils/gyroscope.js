import { DeviceEventEmitter, NativeModules } from 'react-native';

class GyroscopeManager {
  constructor() {
    this.isListening = false;
    this.listeners = [];
    this.lastData = { x: 0, y: 0, z: 0 };
    this.movementThreshold = 0.1;
  }

  startListening() {
    if (this.isListening) return;
    
    this.isListening = true;
    console.log('🔄 Starting gyroscope monitoring for auto-capture...');
    
    // Simulate gyroscope data for testing (replace with real gyroscope when available)
    this.gyroInterval = setInterval(() => {
      const mockData = {
        x: (Math.random() - 0.5) * 0.2,
        y: (Math.random() - 0.5) * 0.2,
        z: (Math.random() - 0.5) * 0.2,
        timestamp: Date.now()
      };
      
      this.processGyroData(mockData);
    }, 100);
  }

  stopListening() {
    if (!this.isListening) return;
    
    this.isListening = false;
    console.log('⏹️ Stopping gyroscope monitoring...');
    
    if (this.gyroInterval) {
      clearInterval(this.gyroInterval);
      this.gyroInterval = null;
    }
  }

  processGyroData(data) {
    // Calculate movement difference
    const deltaX = Math.abs(data.x - this.lastData.x);
    const deltaY = Math.abs(data.y - this.lastData.y);
    const deltaZ = Math.abs(data.z - this.lastData.z);
    
    const totalMovement = deltaX + deltaY + deltaZ;
    const isMoving = totalMovement > this.movementThreshold;
    
    // Emit gyroscope data
    DeviceEventEmitter.emit('gyroscope', {
      ...data,
      isMoving,
      totalMovement,
      deltaX,
      deltaY,
      deltaZ
    });
    
    this.lastData = { ...data };
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  removeAllListeners() {
    this.listeners = [];
  }

  // Check if device is moving (for auto-capture timing)
  isDeviceMoving() {
    return this.lastData.totalMovement > this.movementThreshold;
  }

  // Get current gyroscope data
  getCurrentData() {
    return { ...this.lastData };
  }

  // Set movement sensitivity
  setMovementThreshold(threshold) {
    this.movementThreshold = threshold;
  }
}

// Create singleton instance
const gyroscopeManager = new GyroscopeManager();

export default gyroscopeManager;
