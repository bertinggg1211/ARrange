import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import theme from '../theme/colors';
const { Colors, Theme } = theme;

const { width, height } = Dimensions.get('window');

const AccountDeletedModal = ({ visible, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.3));
  const [checkmarkAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Entrance animation with bounce effect
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(1.3)),
          useNativeDriver: true,
        }),
      ]).start();

      // Animate checkmark after modal appears
      setTimeout(() => {
        Animated.spring(checkmarkAnim, {
          toValue: 1,
          tension: 80,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }, 300);
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
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 250,
        easing: Easing.in(Easing.ease),
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
                <Icon name="trash-outline" size={50} color="#FFFFFF" />
              </Animated.View>
            </View>
          </View>

          {/* Success Message */}
          <Text style={styles.title}>Account Deleted</Text>
          <Text style={styles.subtitle}>
            Your account and all associated data have been permanently removed from our system.
          </Text>

          {/* Deletion Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Icon name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.summaryText}>Personal profile & settings</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Icon name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.summaryText}>Shopping cart & favorites</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Icon name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.summaryText}>Order history & tracking</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Icon name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.summaryText}>Messages & conversations</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Icon name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.summaryText}>All uploaded content</Text>
            </View>
          </View>

          {/* Security Message */}
          <View style={styles.securityMessage}>
            <Icon name="shield-checkmark-outline" size={24} color={Colors.secondary} />
            <Text style={styles.securityText}>
              All your data has been securely deleted and cannot be recovered.
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Return to Login</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
  },
  modal: {
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius.large,
    paddingVertical: Theme.spacing.xxl,
    paddingHorizontal: Theme.spacing.xl,
    alignItems: 'center',
    maxWidth: width * 0.9,
    width: '100%',
    ...Theme.shadow.large,
  },
  
  // Success Icon Styles
  iconContainer: {
    marginBottom: Theme.spacing.xl,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Text Styles
  title: {
    fontSize: Theme.fontSize.title,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  subtitle: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
    lineHeight: 22,
    paddingHorizontal: Theme.spacing.sm,
  },
  
  // Summary Styles
  summaryContainer: {
    width: '100%',
    backgroundColor: Colors.surfaceLight,
    borderRadius: Theme.borderRadius.medium,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  summaryText: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
    marginLeft: Theme.spacing.md,
    fontWeight: '500',
    flex: 1,
  },
  
  // Security Message
  securityMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF5F0',
    borderRadius: Theme.borderRadius.medium,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: '#FFE6D7',
  },
  securityText: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Theme.spacing.md,
    flex: 1,
    lineHeight: 20,
  },
  
  // Button Styles
  closeButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xxl,
    borderRadius: Theme.borderRadius.medium,
    width: '100%',
    alignItems: 'center',
    ...Theme.shadow.small,
  },
  closeButtonText: {
    fontSize: Theme.fontSize.md,
    fontWeight: '600',
    color: Colors.textInverse,
  },
});

export default AccountDeletedModal;
