import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './styles/Notifications.style';
import { arScanApi } from '../../api/api';
import NotificationIcon from '../../components/NotificationIcon';
import * as notificationApi from '../../api/notificationApi';

export default function Notifications({ navigation }) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // Listen for AR scan completion events
    const arCompleteListener = DeviceEventEmitter.addListener('AR_SCAN_COMPLETE', (data) => {
      if (data.scanData.status === 'completed') {
        addARNotification(data);
      }
    });

    // Listen for KIRI processing updates
    const kiriUpdateListener = DeviceEventEmitter.addListener('KIRI_MODEL_READY', (data) => {
      addARNotification(data);
    });

    // Listen for AR processing progress updates
    const arProgressListener = DeviceEventEmitter.addListener('AR_PROCESSING_PROGRESS', (data) => {
      updateARProcessingNotification(data);
    });

    return () => {
      arCompleteListener.remove();
      kiriUpdateListener.remove();
      arProgressListener.remove();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token found, cannot load notifications');
        return;
      }

      const result = await notificationApi.getNotifications(token);
      if (result.success) {
        setNotifications(result.notifications.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        console.error('Failed to load notifications:', result.error);
        // Fallback to local storage for development
        const stored = await AsyncStorage.getItem('seller_notifications');
        if (stored) {
          const parsed = JSON.parse(stored);
          setNotifications(parsed.sort((a, b) => b.timestamp - a.timestamp));
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotifications = async (newNotifications) => {
    try {
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const addARNotification = async (data) => {
    const newNotification = {
      id: `ar_${data.productId}_${Date.now()}`,
      type: data.scanData?.status === 'processing' ? 'ar_processing' : 'ar_ready',
      title: data.scanData?.status === 'processing' ? '⚙️ Creating 3D Model...' : '🎉 AR Model Ready!',
      message: data.scanData?.status === 'processing' 
        ? `KIRI Engine is processing your 3D model for "${data.productName}". This usually takes 5-7 minutes.`
        : `Your 3D model for "${data.productName}" has been created successfully. Customers can now view it in AR!`,
      productId: data.productId,
      productName: data.productName,
      timestamp: Date.now(),
      read: false,
      actionable: data.scanData?.status !== 'processing',
      progress: data.scanData?.processingProgress || 0,
      timeElapsed: data.scanData?.timeElapsed || 0,
      estimatedTotal: 5, // 5 minutes estimated
    };

    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    await saveNotifications(updatedNotifications);
  };

  const updateARProcessingNotification = async (data) => {
    const updatedNotifications = notifications.map(notif => {
      if (notif.productId === data.productId && notif.type === 'ar_processing') {
        return {
          ...notif,
          progress: data.scanData?.processingProgress || notif.progress,
          timeElapsed: data.scanData?.timeElapsed || notif.timeElapsed,
          message: `KIRI Engine is processing your 3D model for "${data.productName}". ${Math.round(data.scanData?.processingProgress || 0)}% complete (${data.scanData?.timeElapsed || 0} min elapsed)`,
        };
      }
      return notif;
    });
    
    setNotifications(updatedNotifications);
    await saveNotifications(updatedNotifications);
  };


  const markAsRead = async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const result = await notificationApi.markNotificationAsRead(notificationId, token);
        if (result.success) {
          const updatedNotifications = notifications.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          );
          setNotifications(updatedNotifications);
          DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED');
        } else {
          console.error('Failed to mark notification as read:', result.error);
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const result = await notificationApi.markAllNotificationsAsRead(token);
        if (result.success) {
          const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
          setNotifications(updatedNotifications);
          DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED');
        } else {
          console.error('Failed to mark all notifications as read:', result.error);
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const result = await notificationApi.deleteNotification(notificationId, token);
        if (result.success) {
          const updatedNotifications = notifications.filter(notif => notif.id !== notificationId);
          setNotifications(updatedNotifications);
          DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED');
        } else {
          console.error('Failed to delete notification:', result.error);
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              if (token) {
                const result = await notificationApi.clearAllNotifications(token);
                if (result.success) {
                  setNotifications([]);
                  DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED');
                } else {
                  console.error('Failed to clear all notifications:', result.error);
                }
              }
            } catch (error) {
              console.error('Error clearing all notifications:', error);
            }
          }
        }
      ]
    );
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read
    await markAsRead(notification.id);

    // Handle different notification types
    if (notification.type === 'ar_ready' && notification.actionable) {
      Alert.alert(
        'AR Model Ready',
        `Your 3D model for "${notification.productName}" is ready! What would you like to do?`,
        [
          { text: 'View Product', onPress: () => {
            navigation.navigate('EditProducts', { 
              productId: notification.productId,
              productName: notification.productName 
            });
          }},
          { text: 'Test AR Model', onPress: () => {
            navigation.navigate('CameraARViewer', {
              productId: notification.productId,
              productName: notification.productName,
              fromNotification: true
            });
          }},
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ar_ready':
        return 'cube';
      case 'ar_processing':
        return 'sync';
      case 'order':
        return 'bag';
      case 'message':
        return 'chatbubble';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'ar_ready':
        return '#FF8B47';
      case 'ar_processing':
        return '#2196F3';
      case 'order':
        return '#4CAF50';
      case 'message':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const renderProgressBar = (notification) => {
    if (notification.type !== 'ar_processing') return null;
    
    const progress = notification.progress || 0;
    const timeElapsed = notification.timeElapsed || 0;
    const estimatedTotal = notification.estimatedTotal || 5;
    const timeRemaining = Math.max(0, estimatedTotal - timeElapsed);
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {Math.round(progress)}% complete
          </Text>
          <Text style={styles.timeText}>
            ~{timeRemaining} min remaining
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${Math.min(progress, 100)}%` }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  };

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.notificationIcon, { backgroundColor: getNotificationColor(item.type) }]}>
          <Icon name={getNotificationIcon(item.type)} size={20} color="#FFFFFF" />
        </View>
        
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          {renderProgressBar(item)}
          <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
        </View>

        <View style={styles.notificationActions}>
          {!item.read && <View style={styles.unreadDot} />}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteNotification(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={16} color="#999" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={markAllAsRead}
            >
              <Text style={styles.markAllText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllNotifications}
          >
            <Icon name="trash-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="notifications-outline" size={64} color="#666" />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyMessage}>
            You'll see AR model updates and other important notifications here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF8B47"
              colors={['#FF8B47']}
            />
          }
        />
      )}
    </View>
  );
}