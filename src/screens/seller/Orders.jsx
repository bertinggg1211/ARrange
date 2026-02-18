import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  DeviceEventEmitter
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles/Orders.style';
import orderApi from '../../api/orderApi';
import { getOrderStatusColors, getPaymentStatusColors } from '../../config/orderColors';
import { sendOrderNotification } from '../../api/chatApi';
import { sendReviewRequest } from '../../api/reviewApi';

const { width, height } = Dimensions.get('window');

// No hardcoded data - using real database orders only

export default function Orders({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentOrderDetails, setCurrentOrderDetails] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  
  // Auto-remove cancelled orders after 5 seconds
  const [cancelledOrderTimers, setCancelledOrderTimers] = useState(new Map());
  const [cancelledOrderCountdowns, setCancelledOrderCountdowns] = useState(new Map());
  
  // Helper function to validate and format image URLs
  const getValidImageSource = (imageUrl) => {
    console.log('🔧 getValidImageSource called with:', imageUrl);
    console.log('🔧 Image URL type:', typeof imageUrl);
    
    if (!imageUrl) {
      console.log('🔧 No image URL provided');
      return null;
    }
    
    // Handle different image formats
    if (typeof imageUrl === 'string') {
      console.log('🔧 Processing string image URL:', imageUrl);
      const trimmedUrl = imageUrl.trim();
      if (trimmedUrl === '' || trimmedUrl === 'null' || trimmedUrl === 'undefined') {
        console.log('🔧 Invalid string URL');
        return null;
      }
      
      // Check if it's already a full URL
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        console.log('🔧 Full URL detected');
        return { uri: trimmedUrl };
      }
      
      // If it's a relative path, make it absolute
      if (trimmedUrl.startsWith('/')) {
        console.log('🔧 Relative path detected');
        return { uri: `https://your-domain.com${trimmedUrl}` };
      }
      
      // If it's just a filename, construct the full path
      console.log('🔧 Filename detected');
      return { uri: `https://your-domain.com/uploads/products/${trimmedUrl}` };
    }
    
    // Handle object format (Cloudinary or other image objects)
    if (typeof imageUrl === 'object') {
      console.log('🔧 Processing object image URL:', imageUrl);
      console.log('🔧 Object keys:', Object.keys(imageUrl));
      console.log('🔧 Object values:', Object.values(imageUrl));
      
      // Priority: url (Cloudinary) > uri > path
      if (imageUrl.url) {
        console.log('🔧 Found url property:', imageUrl.url);
        return { uri: imageUrl.url };
      } else if (imageUrl.uri) {
        console.log('🔧 Found uri property:', imageUrl.uri);
        return { uri: imageUrl.uri };
      } else if (imageUrl.path) {
        console.log('🔧 Found path property:', imageUrl.path);
        return { uri: imageUrl.path };
      } else {
        console.log('🔧 No valid URL properties found in object');
      }
    }
    
    console.log('🔧 No valid image format found');
    return null;
  };
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getSellerOrders();
      const newOrders = response.orders || [];
      setOrders(newOrders);
      console.log('✅ Loaded', newOrders.length, 'seller orders');
      
      // Set up timers for cancelled orders
      setupCancelledOrderTimers(newOrders);
      
      // Debug: Log the first order structure to understand data format
      if (newOrders.length > 0) {
        console.log('🔍 First seller order structure:', {
          orderId: newOrders[0].id,
          orderNumber: newOrders[0].orderNumber,
          hasItems: !!newOrders[0].items,
          itemsLength: newOrders[0].items?.length,
          firstItem: newOrders[0].items?.[0],
          firstItemImage: newOrders[0].items?.[0]?.image,
          firstItemName: newOrders[0].items?.[0]?.name,
          orderKeys: Object.keys(newOrders[0])
        });
      }
    } catch (error) {
      console.error('❌ Error loading seller orders:', error);
      setOrders([]); // Show empty state on error
      Alert.alert('Error', 'Failed to load orders. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Set up timers for cancelled orders
  const setupCancelledOrderTimers = (ordersList) => {
    // Clear existing timers
    cancelledOrderTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    setCancelledOrderTimers(new Map());
    setCancelledOrderCountdowns(new Map());
    
    // Set up new timers for cancelled orders
    ordersList.forEach((order) => {
      if (order.status === 'Cancelled') {
        console.log('⏰ Setting up 5-second timer for cancelled seller order:', order.id);
        
        // Start countdown from 5
        setCancelledOrderCountdowns(prev => new Map(prev).set(order.id, 5));
        
        // Update countdown every second
        const countdownInterval = setInterval(() => {
          setCancelledOrderCountdowns(prev => {
            const newCountdowns = new Map(prev);
            const currentCount = newCountdowns.get(order.id) || 0;
            if (currentCount <= 1) {
              clearInterval(countdownInterval);
              newCountdowns.delete(order.id);
            } else {
              newCountdowns.set(order.id, currentCount - 1);
            }
            return newCountdowns;
          });
        }, 1000);
        
        // Remove order after 5 seconds
        const timer = setTimeout(() => {
          console.log('🗑️ Auto-removing cancelled seller order:', order.id);
          clearInterval(countdownInterval);
          removeCancelledOrder(order.id);
        }, 5000); // 5 seconds
        
        setCancelledOrderTimers(prev => new Map(prev).set(order.id, timer));
      }
    });
  };
  
  // Remove cancelled order from the list
  const removeCancelledOrder = (orderId) => {
    setOrders(prevOrders => {
      const updatedOrders = prevOrders.filter(order => order.id !== orderId);
      console.log('✅ Removed cancelled seller order:', orderId, 'Remaining orders:', updatedOrders.length);
      
      // Update local stats after removing cancelled order
      updateLocalStats(updatedOrders);
      
      // Emit event to update profile stats
      DeviceEventEmitter.emit('SELLER_ORDER_REMOVED', {
        orderId,
        remainingOrders: updatedOrders.length,
        updatedStats: {
          pending: updatedOrders.filter(order => order.status === 'Pending').length,
          confirmed: updatedOrders.filter(order => order.status === 'Confirmed').length,
          delivered: updatedOrders.filter(order => order.status === 'Delivered').length
        }
      });
      
      return updatedOrders;
    });
    
    // Clear the timer
    setCancelledOrderTimers(prev => {
      const newTimers = new Map(prev);
      const timer = newTimers.get(orderId);
      if (timer) {
        clearTimeout(timer);
        newTimers.delete(orderId);
      }
      return newTimers;
    });
  };
  
  // Update local stats based on current orders
  const updateLocalStats = (ordersList) => {
    const newStats = {
      pending: ordersList.filter(order => order.status === 'Pending').length,
      confirmed: ordersList.filter(order => order.status === 'Confirmed').length,
      delivered: ordersList.filter(order => order.status === 'Delivered').length
    };
    
    console.log('📊 Updated seller local stats:', newStats);
    // Note: Seller Orders screen doesn't have a stats state, but this function is ready for future use
  };

  useEffect(() => {
    // Load orders first
    loadOrders();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Cleanup timers when component unmounts
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up cancelled seller order timers');
      cancelledOrderTimers.forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, [cancelledOrderTimers]);

  // Order management functions
  const confirmOrder = async (orderId) => {
    Alert.alert(
      'Confirm Order',
      'Are you sure you want to confirm this order? This will notify the customer that their order is being processed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const order = orders.find(o => o.id === orderId);
              
              // Update order status
              await orderApi.updateOrderStatus(orderId, { 
                status: 'confirmed',
                notes: 'Order confirmed by seller'
              });
              
              setOrders(prevOrders =>
                prevOrders.map(order =>
                  order.id === orderId
                    ? { ...order, status: 'Confirmed' }
                    : order
                )
              );
              
              // Send chat notification with product details
              if (order?.customer?.id && order?.orderNumber) {
                const firstItem = order.items?.[0];
                
                // Debug: Check image structure
                console.log('🖼️ First item image structure:', {
                  image: firstItem?.image,
                  imageType: typeof firstItem?.image,
                  imageKeys: firstItem?.image && typeof firstItem.image === 'object' ? Object.keys(firstItem.image) : null
                });
                
                // Extract image URL properly
                let imageUrl = null;
                if (firstItem?.image) {
                  if (typeof firstItem.image === 'string') {
                    imageUrl = firstItem.image;
                  } else if (typeof firstItem.image === 'object') {
                    // Handle Cloudinary object
                    imageUrl = firstItem.image.url || firstItem.image.uri || firstItem.image.path || firstItem.image;
                  }
                }
                
                console.log('🖼️ Extracted image URL:', imageUrl);
                
                const productData = firstItem ? {
                  id: firstItem.product_id, // Use product_id, not order_items.id
                  name: firstItem.name,
                  image: imageUrl, // Use extracted URL string
                  price: firstItem.price,
                  quantity: firstItem.quantity
                } : null;
                
                console.log('🔔 Sending CONFIRM ORDER notification to buyer:', {
                  buyerId: order.customer.id,
                  orderNumber: order.orderNumber,
                  productData: productData
                });
                
                const result = await sendOrderNotification(
                  order.customer.id,
                  order.orderNumber,
                  'confirmed',
                  productData
                );
                
                if (result.success) {
                  console.log('✅ Confirm order notification sent successfully!');
                } else {
                  console.error('❌ Failed to send notification:', result.error);
                }
              }
              
              Alert.alert('Success', 'Order confirmed successfully! Customer has been notified.');
            } catch (error) {
              console.error('❌ Error confirming order:', error);
              Alert.alert('Error', 'Failed to confirm order. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Start processing order
  const startProcessing = async (orderId) => {
    try {
      const order = orders.find(o => o.id === orderId);
      
      // Update order status
      await orderApi.updateOrderStatus(orderId, { 
        status: 'processing',
        notes: 'Order processing started - preparing items'
      });
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: 'Processing' }
            : order
        )
      );
      
      // Send chat notification with product details
      if (order?.customer?.id && order?.orderNumber) {
        const firstItem = order.items?.[0];
        
        // Extract image URL properly
        let imageUrl = null;
        if (firstItem?.image) {
          if (typeof firstItem.image === 'string') {
            imageUrl = firstItem.image;
          } else if (typeof firstItem.image === 'object') {
            imageUrl = firstItem.image.url || firstItem.image.uri || firstItem.image.path || firstItem.image;
          }
        }
        
        const productData = firstItem ? {
          id: firstItem.product_id, // Use product_id, not order_items.id
          name: firstItem.name,
          image: imageUrl,
          price: firstItem.price,
          quantity: firstItem.quantity
        } : null;
        
        console.log('🔔 Sending START PROCESSING notification to buyer:', {
          buyerId: order.customer.id,
          orderNumber: order.orderNumber,
          productData: productData
        });
        
        const result = await sendOrderNotification(
          order.customer.id,
          order.orderNumber,
          'processing',
          productData
        );
        
        if (result.success) {
          console.log('✅ Processing notification sent successfully!');
        } else {
          console.error('❌ Failed to send processing notification:', result.error);
        }
      }
      
      Alert.alert('Success', 'Order is now being processed! Customer has been notified.');
    } catch (error) {
      console.error('❌ Error starting processing:', error);
      Alert.alert('Error', 'Failed to start processing. Please try again.');
    }
  };

  // Mark order as shipped
  const markAsShipped = (orderId) => {
    setCurrentOrderDetails(orders.find(order => order.id === orderId));
    setShowTrackingModal(true);
  };

  // Mark order as delivered
  const markAsDelivered = async (orderId) => {
    Alert.alert(
      'Mark as Delivered',
      'Are you sure this order has been delivered to the customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Delivered',
          onPress: async () => {
            try {
              const order = orders.find(o => o.id === orderId);
              
              // Update order status
              await orderApi.updateOrderStatus(orderId, { 
                status: 'delivered',
                notes: 'Order delivered successfully'
              });
              
              setOrders(prevOrders =>
                prevOrders.map(order =>
                  order.id === orderId
                    ? { ...order, status: 'Delivered' }
                    : order
                )
              );
              
              // Send chat notifications to buyer
              if (order?.customer?.id && order?.orderNumber) {
                const firstItem = order.items?.[0];
                
                // Extract image URL properly
                let imageUrl = null;
                if (firstItem?.image) {
                  if (typeof firstItem.image === 'string') {
                    imageUrl = firstItem.image;
                  } else if (typeof firstItem.image === 'object') {
                    imageUrl = firstItem.image.url || firstItem.image.uri || firstItem.image.path || firstItem.image;
                  }
                }
                
                const productData = firstItem ? {
                  id: firstItem.product_id, // Use product_id, not order_items.id
                  name: firstItem.name,
                  image: imageUrl,
                  price: firstItem.price,
                  quantity: firstItem.quantity
                } : null;
                
                // 1. Send delivery confirmation
                console.log('🔔 Sending DELIVERED notification to buyer:', {
                  buyerId: order.customer.id,
                  orderNumber: order.orderNumber,
                  productData: productData
                });
                
                const deliveryResult = await sendOrderNotification(
                  order.customer.id,
                  order.orderNumber,
                  'delivered',
                  productData
                );
                
                if (deliveryResult.success) {
                  console.log('✅ Delivery notification sent successfully!');
                } else {
                  console.error('❌ Failed to send delivery notification:', deliveryResult.error);
                }
                
                // 2. Send PRODUCT review request (after 2 seconds)
                setTimeout(async () => {
                  try {
                    console.log('⭐ Sending product review request to buyer');
                    await sendReviewRequest(
                      order.customer.id,
                      order.id, // Use order.id (UUID) instead of orderNumber
                      'product',
                      {
                        id: firstItem.product_id, // Use product_id, not order_items.id
                        name: firstItem.name,
                        image: imageUrl,
                        price: firstItem.price,
                        quantity: firstItem.quantity,
                        orderNumber: order.orderNumber // Include for display purposes
                      }
                    );
                    console.log('✅ Product review request sent successfully!');
                  } catch (error) {
                    console.error('❌ Error sending product review request:', error);
                  }
                }, 2000);
                
                // 3. Send SHOP review request (after 4 seconds)
                setTimeout(async () => {
                  try {
                    console.log('⭐ Sending shop review request to buyer');
                    // Get seller ID from order data (current user is the seller)
                    const sellerId = order.seller?.id || order.seller_id;
                    
                    await sendReviewRequest(
                      order.customer.id,
                      order.id, // Use order.id (UUID) instead of orderNumber
                      'shop',
                      {
                        shopId: sellerId,
                        shopName: order.seller?.shopName || order.seller?.name || 'Shop',
                        shopLogo: order.seller?.shopLogo || order.seller?.logo || null,
                        orderNumber: order.orderNumber // Include for display purposes
                      }
                    );
                    console.log('✅ Shop review request sent successfully!');
                  } catch (error) {
                    console.error('❌ Error sending shop review request:', error);
                  }
                }, 4000);
              }
              
              Alert.alert('Success', 'Order marked as delivered! Customer has been notified and review requests sent.');
            } catch (error) {
              console.error('❌ Error marking as delivered:', error);
              Alert.alert('Error', 'Failed to mark as delivered. Please try again.');
            }
          }
        }
      ]
    );
  };

  const shipOrder = async () => {
    if (!trackingNumber.trim()) {
      Alert.alert('Error', 'Please enter a tracking number');
      return;
    }

    try {
      // Update order status
      await orderApi.updateOrderStatus(currentOrderDetails.id, { 
        status: 'shipped',
        trackingNumber: trackingNumber.trim(),
        notes: `Order shipped with tracking number: ${trackingNumber.trim()}`
      });

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === currentOrderDetails.id
            ? { ...order, status: 'Shipped', trackingNumber: trackingNumber.trim() }
            : order
        )
      );
      
      // Send chat notification with product details and tracking number
      if (currentOrderDetails?.customer?.id && currentOrderDetails?.orderNumber) {
        const firstItem = currentOrderDetails.items?.[0];
        
        // Extract image URL properly
        let imageUrl = null;
        if (firstItem?.image) {
          if (typeof firstItem.image === 'string') {
            imageUrl = firstItem.image;
          } else if (typeof firstItem.image === 'object') {
            imageUrl = firstItem.image.url || firstItem.image.uri || firstItem.image.path || firstItem.image;
          }
        }
        
        const productData = firstItem ? {
          id: firstItem.product_id, // Use product_id, not order_items.id
          name: firstItem.name,
          image: imageUrl,
          price: firstItem.price,
          quantity: firstItem.quantity
        } : null;
        
        console.log('🔔 Sending SHIP ORDER notification to buyer:', {
          buyerId: currentOrderDetails.customer.id,
          orderNumber: currentOrderDetails.orderNumber,
          trackingNumber: trackingNumber.trim(),
          productData: productData
        });
        
        const result = await sendOrderNotification(
          currentOrderDetails.customer.id,
          currentOrderDetails.orderNumber,
          'shipped',
          productData,
          trackingNumber.trim()
        );
        
        if (result.success) {
          console.log('✅ Shipping notification sent successfully!');
        } else {
          console.error('❌ Failed to send shipping notification:', result.error);
        }
      }
      
      setShowTrackingModal(false);
      setTrackingNumber('');
      setCurrentOrderDetails(null);
      Alert.alert('Success', 'Order shipped successfully! Customer has been notified with tracking number.');
    } catch (error) {
      console.error('❌ Error shipping order:', error);
      Alert.alert('Error', 'Failed to ship order. Please try again.');
    }
  };

  const cancelOrder = async (orderId) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const order = orders.find(o => o.id === orderId);
              
              await orderApi.updateOrderStatus(orderId, { 
                status: 'cancelled',
                notes: 'Order cancelled by seller'
              });
              
              setOrders(prevOrders =>
                prevOrders.map(order =>
                  order.id === orderId
                    ? { ...order, status: 'Cancelled' }
                    : order
                )
              );
              
              Alert.alert('Order Cancelled', 'The order has been cancelled.');
            } catch (error) {
              console.error('❌ Error cancelling order:', error);
              Alert.alert('Error', 'Failed to cancel order. Please try again.');
            }
          }
        }
      ]
    );
  };

  const viewOrderDetails = (order) => {
    setCurrentOrderDetails(order);
    setShowOrderModal(true);
  };

  const contactCustomer = (order) => {
    Alert.alert(
      'Contact Customer',
      `Contact ${order.customer.name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Alert.alert('Calling', `Calling ${order.customer.phone}`) },
        { 
          text: 'Message', 
          onPress: () => {
            // Navigate to chat with proper chatData format
            navigation.navigate('ChatDetail', { 
              chatData: {
                id: `chat_${order.customer.id}`,
                partnerId: order.customer.id,
                shop: {
                  id: order.customer.id,
                  name: order.customer.name,
                  avatar: order.customer.avatar || null,
                  isOnline: false
                }
              }
            });
          }
        }
      ]
    );
  };

  // Filter orders based on active tab and search query
  const filteredOrders = orders.filter(order => {
    // Handle 'All' tab - show all orders
    const matchesTab = activeTab === 'All' || order.status === activeTab;
    
    // Handle search
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
                         order.orderNumber?.toLowerCase().includes(searchLower) ||
                         order.customer?.name?.toLowerCase().includes(searchLower) ||
                         (order.items && order.items.some(item => 
                           item?.name?.toLowerCase().includes(searchLower)
                         ));
    
    return matchesTab && matchesSearch;
  });

  // Debug logging
  console.log('Active Tab:', activeTab);
  console.log('Total Orders:', orders.length);
  console.log('Filtered Orders:', filteredOrders.length);
  console.log('Order Statuses:', orders.map(o => o.status));
  console.log('Filtered Orders Data:', filteredOrders.map(o => ({ id: o.id, status: o.status })));
  
  // Get counts for each tab
  const orderCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  
  // Add 'All' count
  orderCounts['All'] = orders.length;

  // Get pending orders count for badge
  const pendingCount = orders.filter(order => order.status === 'Pending').length;

  const renderOrderItem = ({ item, index }) => (
    <Animated.View 
      style={[
        styles.stunningOrderCard,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      {/* Beautiful Card Background */}
      <View 
        style={[
          styles.cardBackground,
          { backgroundColor: getOrderStatusColors(item.status)?.primary || '#FF8B47' }
        ]}
      >
        {/* Floating Status Indicator */}
        <View style={styles.floatingStatusContainer}>
          <View style={[styles.floatingStatus, 
            item.status === 'Pending' && styles.pendingGlow,
            item.status === 'Confirmed' && styles.confirmedGlow,
            item.status === 'Processing' && styles.processingGlow,
            item.status === 'Shipped' && styles.shippedGlow,
            item.status === 'Delivered' && styles.deliveredGlow
          ]}>
            <Icon 
              name={
                item.status === 'Pending' ? 'time-outline' :
                item.status === 'Confirmed' ? 'checkmark-circle' :
                item.status === 'Processing' ? 'refresh-circle' :
                item.status === 'Shipped' ? 'airplane' :
                item.status === 'Delivered' ? 'checkmark-done-circle' :
                'close-circle'
              } 
              size={16} 
              color="#FFFFFF" 
            />
            <Text style={styles.floatingStatusText}>
              {item.status}
              {item.status === 'Cancelled' && cancelledOrderCountdowns.has(item.id) && (
                <Text style={styles.countdownText}>
                  {' '}(Removing in {cancelledOrderCountdowns.get(item.id)}s)
                </Text>
              )}
            </Text>
          </View>
        </View>

        {/* Main Card Content */}
        <TouchableOpacity 
          style={styles.stunningCardContent}
          onPress={() => viewOrderDetails(item)}
          activeOpacity={0.9}
        >
          {/* Customer Section with Glass Effect */}
          <View style={styles.glassCustomerSection}>
            <View style={styles.customerAvatarContainer}>
              {item.customer?.avatar ? (
                <Image source={item.customer.avatar} style={styles.stunningCustomerAvatar} />
              ) : (
                <View style={[styles.stunningCustomerAvatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Icon name="person" size={16} color="#FFF" />
                </View>
              )}
              <View style={styles.avatarGlow} />
            </View>
            
            <View style={styles.customerInfoSection}>
              <Text style={styles.stunningCustomerName}>{item.customer?.name || 'Customer'}</Text>
              <View style={styles.orderMetaRow}>
                <Icon name="receipt-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.stunningOrderNumber}>{item.orderNumber || 'N/A'}</Text>
              </View>
              <View style={styles.orderMetaRow}>
                <Icon name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.stunningOrderDate}>{item.date || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.orderValueSection}>
              <Text style={styles.stunningOrderTotal}>{item.total || '₱0'}</Text>
              <Text style={styles.orderTotalLabel}>Total</Text>
            </View>
          </View>

          {/* Product Preview with Blur Effect */}
          <View style={styles.blurProductPreview}>
            <View style={styles.productImageStack}>
              {(() => {
                // Debug: Log the item structure for image rendering
                console.log('🖼️ Rendering product image for order:', item.id);
                console.log('🖼️ Item structure:', {
                  hasItems: !!item.items,
                  itemsLength: item.items?.length,
                  firstItem: item.items?.[0],
                  firstItemImage: item.items?.[0]?.image,
                  firstItemName: item.items?.[0]?.name
                });
                
                const firstItem = item.items?.[0];
                const imageUrl = firstItem?.image;
                const imageSource = getValidImageSource(imageUrl);
                
                console.log('🖼️ Final image URL:', imageUrl);
                console.log('🖼️ Image URL type:', typeof imageUrl);
                console.log('🖼️ Processed image source:', imageSource);
                
                // Debug the first item structure more deeply
                if (firstItem) {
                  console.log('🖼️ First item keys:', Object.keys(firstItem));
                  console.log('🖼️ First item values:', Object.values(firstItem));
                  if (firstItem.image) {
                    console.log('🖼️ Image property type:', typeof firstItem.image);
                    console.log('🖼️ Image property value:', firstItem.image);
                    if (typeof firstItem.image === 'object') {
                      console.log('🖼️ Image object keys:', Object.keys(firstItem.image));
                      console.log('🖼️ Image object values:', Object.values(firstItem.image));
                    }
                  }
                }
                
                return imageSource ? (
                  <Image 
                    source={imageSource} 
                    style={styles.stunningProductImage}
                    onError={(error) => console.log('❌ Seller order image load error:', error.nativeEvent.error)}
                    onLoad={() => console.log('✅ Seller order image loaded successfully:', imageUrl)}
                  />
                ) : (
                  <View style={[styles.stunningProductImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                    <Icon name="cube" size={18} color="rgba(255,255,255,0.8)" />
                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>No Image</Text>
                  </View>
                );
              })()}
              <View style={styles.productImageOverlay}>
                <Text style={styles.productCount}>
                  {item.items?.length || 0} {(item.items?.length || 0) > 1 ? 'Items' : 'Item'}
                </Text>
              </View>
            </View>
            
            <View style={styles.productInfoGlass}>
              <Text style={styles.stunningProductName} numberOfLines={1}>
                {item.items?.[0]?.name || 'Product'}
              </Text>
              <Text style={styles.productDetails}>
                {item.items && item.items.length > 1 ? `+${item.items.length - 1} more items` : `Qty: ${item.items?.[0]?.quantity || 1}`}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* EXACT ORDER FLOW BUTTONS - As Per Requirements */}
        <View style={styles.stunningQuickActions}>
          {/* PENDING STATUS - 3 Buttons: Contact, Cancel, Confirm */}
          {item.status === 'Pending' && (
            <>
              <TouchableOpacity 
                style={[styles.glassActionButton, styles.stunningContactButton]}
                onPress={() => contactCustomer(item)}
                activeOpacity={0.8}
              >
                <View style={styles.contactButtonBorder}>
                  <Icon name="chatbubble" size={18} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.stunningContactText}>Contact Customer</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.glassActionButton, styles.stunningDeclineButton]}
                onPress={() => cancelOrder(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.declineButtonBorder}>
                  <Icon name="close-circle" size={18} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.stunningDeclineText}>Cancel Order</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.glassActionButton, styles.stunningConfirmButton]}
                onPress={() => confirmOrder(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.confirmButtonContent}>
                  <Icon name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.stunningActionText}>Confirm Order</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
          
          {/* CONFIRMED STATUS - 3 Buttons: Contact, Cancel, Start Processing */}
          {item.status === 'Confirmed' && (
            <>
              <TouchableOpacity 
                style={[styles.glassActionButton, styles.stunningContactButton]}
                onPress={() => contactCustomer(item)}
                activeOpacity={0.8}
              >
                <View style={styles.contactButtonBorder}>
                  <Icon name="chatbubble" size={18} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.stunningContactText}>Contact Customer</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.glassActionButton, styles.stunningDeclineButton]}
                onPress={() => cancelOrder(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.declineButtonBorder}>
                  <Icon name="close-circle" size={18} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.stunningDeclineText}>Cancel Order</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.glassActionButton, styles.stunningProcessButton]}
                onPress={() => startProcessing(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.processButtonContent}>
                  <Icon name="refresh-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.stunningActionText}>Start Processing</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
          
          {/* PROCESSING STATUS - 2 Buttons: Contact, Ship Order */}
          {item.status === 'Processing' && (
            <>
              <TouchableOpacity 
                style={[styles.glassActionButton, styles.stunningContactButton]}
                onPress={() => contactCustomer(item)}
                activeOpacity={0.8}
              >
                <View style={styles.contactButtonBorder}>
                  <Icon name="chatbubble" size={18} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.stunningContactText}>Contact Customer</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.glassActionButton, styles.stunningShipButton]}
                onPress={() => markAsShipped(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.shipButtonContent}>
                  <Icon name="airplane" size={18} color="#FFFFFF" />
                  <Text style={styles.stunningActionText}>Ship Order</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
          
          {/* SHIPPED STATUS - 2 Buttons: Contact, Mark Delivered */}
          {item.status === 'Shipped' && (
            <>
              <TouchableOpacity 
                style={[styles.glassActionButton, styles.stunningContactButton]}
                onPress={() => contactCustomer(item)}
                activeOpacity={0.8}
              >
                <View style={styles.contactButtonBorder}>
                  <Icon name="chatbubble" size={18} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.stunningContactText}>Contact Customer</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.glassActionButton, styles.stunningDeliverButton]}
                onPress={() => markAsDelivered(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.deliverButtonContent}>
                  <Icon name="checkmark-done-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.stunningActionText}>Mark Delivered</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
          
          {/* DELIVERED STATUS - Show completion + Contact */}
          {item.status === 'Delivered' && (
            <>
              <View style={styles.stunningCompletedInfo}>
                <View style={styles.completedIconContainer}>
                  <Icon name="checkmark-done-circle" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.stunningCompletedText}>Order Completed</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.glassActionButton, styles.stunningContactButton]}
                onPress={() => contactCustomer(item)}
                activeOpacity={0.8}
              >
                <View style={styles.contactButtonBorder}>
                  <Icon name="chatbubble" size={18} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.stunningContactText}>Contact Customer</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
          
          {/* CANCELLED STATUS - Show cancellation + Contact */}
          {item.status === 'Cancelled' && (
            <>
              <View style={styles.stunningCancelledInfo}>
                <View style={styles.cancelledIconContainer}>
                  <Icon name="close-circle" size={20} color="#FF3B30" />
                </View>
                <Text style={styles.stunningCancelledText}>Order Cancelled</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.glassActionButton, styles.stunningContactButton]}
                onPress={() => contactCustomer(item)}
                activeOpacity={0.8}
              >
                <View style={styles.contactButtonBorder}>
                  <Icon name="chatbubble" size={18} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.stunningContactText}>Contact Customer</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.stunningContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Stunning Header */}
      <View style={styles.stunningHeader}>
        <Animated.View 
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.headerTopRow}>
            <TouchableOpacity 
              style={styles.backButtonGlass}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleSection}>
              <Text style={styles.stunningHeaderTitle}>Order Management</Text>
              <Text style={styles.headerSubtitle}>Manage your business orders</Text>
            </View>

            <TouchableOpacity style={styles.notificationButton}>
              <Icon name="notifications" size={24} color="#FFFFFF" />
              {pendingCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Glass Search Bar */}
          <View style={styles.glassSearchContainer}>
            <Icon name="search-outline" size={20} color="rgba(255,255,255,0.8)" />
            <TextInput
              style={styles.glassSearchInput}
              placeholder="Search orders, customers..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Floating Tab Container */}
      <Animated.View 
        style={[
          styles.floatingTabContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.floatingTab, activeTab === tab && styles.activeFloatingTab]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <View 
                style={[
                  styles.tabGradient,
                  activeTab === tab && styles.activeTabGradient
                ]}
              >
                <Text style={[styles.floatingTabText, activeTab === tab && styles.activeFloatingTabText]}>
                  {tab}
                </Text>
                {orderCounts[tab] > 0 && (
                  <View style={styles.floatingTabBadge}>
                    <Text style={styles.floatingTabBadgeText}>{orderCounts[tab]}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Orders List with Stunning Cards */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.stunningOrdersList}
          showsVerticalScrollIndicator={false}
          bounces={true}
          decelerationRate="fast"
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadOrders}
              tintColor="#FFFFFF"
              colors={['#FF8B47']}
            />
          }
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateIconContainer}>
            <Icon name="receipt-outline" size={80} color="#FF8B47" />
          </View>
          <Text style={styles.emptyStateTitle}>No Orders Yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            {activeTab === 'All' 
              ? 'You haven\'t received any orders yet.\nOrders will appear here once customers start purchasing.' 
              : `No ${activeTab.toLowerCase()} orders found.\nTry switching to a different tab.`
            }
          </Text>
          <View style={styles.emptyStateTip}>
            <Icon name="bulb-outline" size={20} color="#FFB74D" />
            <Text style={styles.emptyStateTipText}>
              Promote your products to get more orders!
            </Text>
          </View>
        </View>
      )}

      {/* Order Details Modal */}
      <Modal
        visible={showOrderModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" />
          
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowOrderModal(false)}
            >
              <Icon name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Order Details</Text>
            <View style={{ width: 40 }} />
          </View>

          {currentOrderDetails && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Order Summary */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Order Summary</Text>
                <View style={styles.orderSummaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Order Number:</Text>
                    <Text style={styles.summaryValue}>{currentOrderDetails.orderNumber || 'N/A'}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Order Date:</Text>
                    <Text style={styles.summaryValue}>{currentOrderDetails.orderDate || currentOrderDetails.date || 'N/A'}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Status:</Text>
                    <View style={[styles.modernStatusBadge, 
                      currentOrderDetails.status === 'Pending' ? styles.pendingBadge :
                      currentOrderDetails.status === 'Confirmed' ? styles.confirmedBadge :
                      currentOrderDetails.status === 'Processing' ? styles.processingBadge : 
                      currentOrderDetails.status === 'Shipped' ? styles.shippedBadge : 
                      currentOrderDetails.status === 'Delivered' ? styles.deliveredBadge : 
                      styles.cancelledBadge
                    ]}>
                      <Text style={styles.modernStatusText}>{currentOrderDetails.status || 'Unknown'}</Text>
                    </View>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Payment Status:</Text>
                    <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{currentOrderDetails.paymentStatus || 'N/A'}</Text>
                  </View>
                </View>
              </View>

              {/* Customer Information */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Customer Information</Text>
                <View style={styles.customerCard}>
                  {currentOrderDetails.customer?.avatar ? (
                    <Image source={currentOrderDetails.customer.avatar} style={styles.customerModalAvatar} />
                  ) : (
                    <View style={[styles.customerModalAvatar, { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' }]}>
                      <Icon name="person" size={24} color="#CCC" />
                    </View>
                  )}
                  <View style={styles.customerModalInfo}>
                    <Text style={styles.customerModalName}>{currentOrderDetails.customer?.name || 'Customer'}</Text>
                    <Text style={styles.customerModalContact}>{currentOrderDetails.customer?.phone || 'N/A'}</Text>
                    <Text style={styles.customerModalContact}>{currentOrderDetails.customer?.email || 'N/A'}</Text>
                  </View>
                </View>
              </View>

              {/* Items */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Items Ordered</Text>
                {currentOrderDetails.items?.map(item => {
                  console.log('🖼️ Modal item image:', {
                    itemId: item?.id,
                    itemName: item?.name,
                    itemImage: item?.image,
                    imageType: typeof item?.image
                  });
                  
                  return (
                    <View key={item?.id || Math.random()} style={styles.modalProductItem}>
                      {(() => {
                        const imageSource = getValidImageSource(item?.image);
                        return imageSource ? (
                          <Image 
                            source={imageSource} 
                            style={styles.modalProductImage}
                            onError={(error) => console.log('❌ Modal product image load error:', error.nativeEvent.error)}
                            onLoad={() => console.log('✅ Modal product image loaded successfully:', item?.image)}
                          />
                        ) : (
                          <View style={[styles.modalProductImage, { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' }]}>
                            <Icon name="image-outline" size={24} color="#CCC" />
                            <Text style={{ fontSize: 10, color: '#999' }}>No Image</Text>
                          </View>
                        );
                      })()}
                      <View style={styles.modalProductInfo}>
                        <Text style={styles.modalProductName}>{item?.name || 'Product'}</Text>
                        <Text style={styles.modalProductSku}>SKU: {item?.sku || 'N/A'}</Text>
                        <Text style={styles.modalProductPrice}>{item?.price || '₱0'} × {item?.quantity || 1}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Shipping Information */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Shipping Information</Text>
                <View style={styles.shippingCard}>
                  <Text style={styles.shippingRecipient}>{currentOrderDetails.shippingAddress?.recipient || 'N/A'}</Text>
                  <Text style={styles.shippingAddress}>{currentOrderDetails.shippingAddress?.fullAddress || 'No address provided'}</Text>
                  <Text style={styles.shippingPhone}>{currentOrderDetails.shippingAddress?.phone || 'N/A'}</Text>
                  {currentOrderDetails.shippingAddress?.notes && (
                    <Text style={styles.shippingNotes}>Note: {currentOrderDetails.shippingAddress.notes}</Text>
                  )}
                </View>
              </View>

              {/* Payment Information */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Payment Information</Text>
                <View style={styles.paymentCard}>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Subtotal:</Text>
                    <Text style={styles.paymentValue}>{currentOrderDetails.subtotal || '₱0'}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Shipping:</Text>
                    <Text style={styles.paymentValue}>{currentOrderDetails.shippingFee || '₱0'}</Text>
                  </View>
                  <View style={[styles.paymentRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>{currentOrderDetails.total || '₱0'}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Payment Method:</Text>
                    <Text style={styles.paymentValue}>{currentOrderDetails.paymentMethod || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Tracking Number Modal */}
      <Modal
        visible={showTrackingModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.trackingModalOverlay}>
          <View style={styles.trackingModalContent}>
            <Text style={styles.trackingModalTitle}>Ship Order</Text>
            <Text style={styles.trackingModalSubtitle}>Enter tracking number to ship this order</Text>
            
            <TextInput
              style={styles.trackingInput}
              placeholder="Enter tracking number"
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              autoFocus={true}
            />
            
            <View style={styles.trackingModalButtons}>
              <TouchableOpacity 
                style={styles.trackingCancelButton}
                onPress={() => {
                  setShowTrackingModal(false);
                  setTrackingNumber('');
                  setCurrentOrderDetails(null);
                }}
              >
                <Text style={styles.trackingCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.trackingConfirmButton}
                onPress={shipOrder}
              >
                <Text style={styles.trackingConfirmText}>Ship Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}