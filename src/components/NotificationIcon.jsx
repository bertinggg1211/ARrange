import React from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const NotificationIcon = ({ 
  size = 24, 
  color = '#FFFFFF', 
  hasNotification = false, 
  notificationColor = '#FF8B47',
  style 
}) => {
  return (
    <View style={[{ width: size, height: size, position: 'relative' }, style]}>
      {/* Bell icon */}
      <Icon 
        name="notifications-outline" 
        size={size} 
        color={color} 
      />
      
      {/* Notification dot */}
      {hasNotification && (
        <View
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
          }}
        />
      )}
    </View>
  );
};

export default NotificationIcon;
