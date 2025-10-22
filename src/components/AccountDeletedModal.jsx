import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const AccountDeletedModal = ({ visible, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.3));
  const [checkmarkAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Animate modal appearance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate checkmark after modal appears
      setTimeout(() => {
        Animated.spring(checkmarkAnim, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }, 400);
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      checkmarkAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.8)" barStyle="light-content" />
      
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable}
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Success Modal */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.modal}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.successCircle}>
              <Animated.View
                style={[
                  styles.checkmarkContainer,
                  {
                    transform: [{ scale: checkmarkAnim }]
                  }
                ]}
              >
                <Icon name="checkmark" size={48} color="#FFFFFF" />
              </Animated.View>
            </View>
          </View>

          {/* Success Message */}
          <Text style={styles.title}>Account Completely Deleted</Text>
          <Text style={styles.subtitle}>
            Your account and all associated data have been permanently removed
          </Text>

          {/* Deletion Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Icon name="checkmark-circle" size={20} color="#4ECDC4" />
              <Text style={styles.summaryText}>User account and profile</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Icon name="checkmark-circle" size={20} color="#4ECDC4" />
              <Text style={styles.summaryText}>All products and images</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Icon name="checkmark-circle" size={20} color="#4ECDC4" />
              <Text style={styles.summaryText}>Shop logos and banners</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Icon name="checkmark-circle" size={20} color="#4ECDC4" />
              <Text style={styles.summaryText}>Cart items and orders</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Icon name="checkmark-circle" size={20} color="#4ECDC4" />
              <Text style={styles.summaryText}>Messages and notifications</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Icon name="checkmark-circle" size={20} color="#4ECDC4" />
              <Text style={styles.summaryText}>Cloud storage files</Text>
            </View>
          </View>

          {/* Security Message */}
          <View style={styles.securityMessage}>
            <Icon name="shield-checkmark" size={24} color="#4ECDC4" />
            <Text style={styles.securityText}>
              All data has been permanently removed from our servers and cannot be recovered.
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>Continue to Login</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = {
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    maxWidth: width * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  
  // Success Icon Styles
  iconContainer: {
    marginBottom: 24,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Text Styles
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  
  // Summary Styles
  summaryContainer: {
    width: '100%',
    marginBottom: 24,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  summaryText: {
    fontSize: 15,
    color: '#1C1C1E',
    marginLeft: 12,
    fontWeight: '500',
  },
  
  // Security Message
  securityMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#B2F5EA',
  },
  securityText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  
  // Button Styles
  closeButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
};

export default AccountDeletedModal;
