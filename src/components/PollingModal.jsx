import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const PollingModal = ({ visible, onCancel, progress = null }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // Debug logging
  console.log('🔍 PollingModal render:', { visible, progress });
  
  // Force visibility check
  if (visible) {
    console.log('🔍 PollingModal is VISIBLE - should be showing on screen');
  } else {
    console.log('🔍 PollingModal is NOT visible');
  }

  useEffect(() => {
    let interval;
    if (visible) {
      setTimeElapsed(0);
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [visible]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    Alert.alert(
      'Stop 3D Model Generation',
      'Are you sure you want to stop the 3D model generation? This action cannot be undone.',
      [
        { text: 'Continue Processing', style: 'cancel' },
        { 
          text: 'Stop', 
          style: 'destructive',
          onPress: () => {
            if (onCancel) {
              onCancel();
            }
          }
        }
      ]
    );
  };

  if (!visible) {
    console.log('🔍 PollingModal not visible, returning null');
    return null;
  }

  console.log('🔍 PollingModal rendering with visible=true');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.title}>Generating 3D Model</Text>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.message}>
              {progress?.message || 'Processing your photos...'}
            </Text>
            
            {progress?.delay && (
              <Text style={styles.delayText}>
                Next attempt in {Math.ceil(progress.delay / 1000)} seconds
              </Text>
            )}
            
            {progress && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(progress.attempts / progress.maxAttempts) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {progress.attempts} / {progress.maxAttempts} attempts
                </Text>
              </View>
            )}
            
            <View style={styles.timeContainer}>
              <Icon name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.timeText}>
                {formatTime(timeElapsed)}
              </Text>
            </View>
            
            {progress?.status && (
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                  Status: {progress.status}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.stopButton}
              onPress={handleStop}
            >
              <Icon name="stop" size={20} color="#FFFFFF" />
              <Text style={styles.stopButtonText}>STOP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Darker background for better visibility
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999, // Ensure it's on top
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 3, // Add bright border for testing
    borderColor: '#FF6B6B', // Bright red border for visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
    textAlign: 'center',
  },
  content: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  delayText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  statusContainer: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  footer: {
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default PollingModal;
