import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const AnimatedNotificationIcon = ({ 
  size = 24, 
  color = '#FFFFFF', 
  hasNotification = false, 
  notificationColor = '#FF8B47',
  animate = true,
  style 
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (hasNotification && animate) {
      // Pulsing animation for notification dot
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      // Subtle bell shake animation
      const shakeAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      shakeAnimation.start();

      return () => {
        pulseAnimation.stop();
        shakeAnimation.stop();
      };
    }
  }, [hasNotification, animate, pulseAnim, scaleAnim]);

  return (
    <Animated.View 
      style={[
        { 
          width: size, 
          height: size, 
          position: 'relative',
          transform: [{ scale: scaleAnim }] 
        }, 
        style
      ]}
    >
      {/* Bell icon */}
      <Icon 
        name="notifications-outline" 
        size={size} 
        color={color} 
      />
      
      {/* Animated notification dot */}
      {hasNotification && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: (size * 0.3) / 2,
            backgroundColor: notificationColor,
            borderWidth: 1,
            borderColor: '#1A1A1A',
            transform: [{ scale: pulseAnim }],
          }}
        />
      )}
    </Animated.View>
  );
};

export default AnimatedNotificationIcon;
