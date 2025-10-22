import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import theme from '../theme/colors';
const { Colors, Theme } = theme;

const { width, height } = Dimensions.get('window');

const OrderSuccessModal = ({ visible, onClose, orderNumber }) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  console.log('🎭 OrderSuccessModal render:', { visible, orderNumber });

  React.useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Icon name="checkmark-circle" size={60} color={Colors.success} />
          </View>

          {/* Success Title */}
          <Text style={styles.title}>Order Placed Successfully!</Text>

          {/* Order Number */}
          {orderNumber && (
            <View style={styles.orderNumberContainer}>
              <Text style={styles.orderNumberLabel}>Order Number:</Text>
              <Text style={styles.orderNumber}>{orderNumber}</Text>
            </View>
          )}

          {/* Success Message */}
          <Text style={styles.message}>
            Your order has been confirmed and will be processed shortly. You can track your order in the Orders section.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                // Close modal and navigate to home
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Icon name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius.large,
    padding: Theme.spacing.xl,
    marginHorizontal: Theme.spacing.lg,
    maxWidth: width * 0.9,
    alignItems: 'center',
    ...Theme.shadow.large,
  },
  iconContainer: {
    marginBottom: Theme.spacing.lg,
  },
  title: {
    fontSize: Theme.fontSize.title,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  orderNumberContainer: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Theme.borderRadius.medium,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderNumberLabel: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xs,
  },
  orderNumber: {
    fontSize: Theme.fontSize.lg,
    fontWeight: '600',
    color: Colors.secondary,
    textAlign: 'center',
  },
  message: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Theme.spacing.xl,
  },
  buttonContainer: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: Colors.secondary,
    borderRadius: Theme.borderRadius.medium,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xl,
    alignItems: 'center',
    ...Theme.shadow.small,
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: Theme.fontSize.md,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: Theme.spacing.md,
    right: Theme.spacing.md,
    padding: Theme.spacing.sm,
  },
});

export default OrderSuccessModal;
