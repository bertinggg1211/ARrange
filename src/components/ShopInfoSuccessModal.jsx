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

const ShopInfoSuccessModal = ({ visible, onClose, shopName }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.3));
  const [checkmarkAnim] = useState(new Animated.Value(0));
  const [confettiAnim] = useState(new Animated.Value(0));

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

      // Animate confetti effect
      setTimeout(() => {
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 600);
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      checkmarkAnim.setValue(0);
      confettiAnim.setValue(0);
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
          {/* Confetti Animation */}
          <Animated.View
            style={[
              styles.confettiContainer,
              {
                opacity: confettiAnim,
                transform: [{
                  translateY: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0]
                  })
                }]
              }
            ]}
          >
            {[...Array(8)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.confettiPiece,
                  {
                    backgroundColor: ['#FF8B47', '#4ECDC4', '#FFE66D', '#FF6B6B'][index % 4],
                    left: `${10 + (index * 10)}%`,
                    animationDelay: `${index * 100}ms`
                  }
                ]}
              />
            ))}
          </Animated.View>

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
          <Text style={styles.title}>Shop Info Updated!</Text>
          <Text style={styles.subtitle}>
            Your shop information has been successfully updated and is now live.
          </Text>

          {/* Shop Details */}
          <View style={styles.shopDetailsContainer}>
            <View style={styles.shopDetailItem}>
              <Icon name="storefront" size={20} color="#FF8B47" />
              <Text style={styles.shopDetailText}>
                {shopName || 'Your Shop'} is ready to shine!
              </Text>
            </View>
            
            <View style={styles.shopDetailItem}>
              <Icon name="globe-outline" size={20} color="#4ECDC4" />
              <Text style={styles.shopDetailText}>
                Visible to all customers
              </Text>
            </View>
            
            <View style={styles.shopDetailItem}>
              <Icon name="trending-up" size={20} color="#10B981" />
              <Text style={styles.shopDetailText}>
                Enhanced shop profile
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.viewShopButton}
              onPress={handleClose}
            >
              <Icon name="eye" size={18} color="#FFFFFF" />
              <Text style={styles.viewShopButtonText}>View Shop</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleClose}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
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
    position: 'relative',
    overflow: 'hidden',
  },
  
  // Confetti Animation
  confettiContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 1,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 0,
  },
  
  // Success Icon Styles
  iconContainer: {
    marginBottom: 24,
    zIndex: 2,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
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
  
  // Shop Details
  shopDetailsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  shopDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  shopDetailText: {
    fontSize: 15,
    color: '#1C1C1E',
    marginLeft: 12,
    fontWeight: '500',
    flex: 1,
  },
  
  // Button Styles
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  viewShopButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF8B47',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  viewShopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
};

export default ShopInfoSuccessModal;
