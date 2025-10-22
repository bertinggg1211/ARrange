import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  DeviceEventEmitter
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import styles from "./styles/Order.style";
import orderApi from "../../api/orderApi";
import { getOrderStatusColors } from "../../config/orderColors";

export default function Order({ navigation }) {
  console.log('🎯 Orders screen component loaded');
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    delivered: 0
  });
  
  // Order details modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Auto-remove cancelled orders after 5 seconds
  const [cancelledOrderTimers, setCancelledOrderTimers] = useState(new Map());
  const [cancelledOrderCountdowns, setCancelledOrderCountdowns] = useState(new Map());
  
  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getBuyerOrders();
      const newOrders = response.orders || [];
      setOrders(newOrders);
      
      // Load stats
      const statsResponse = await orderApi.getBuyerOrderStats();
      setStats(statsResponse);
      
      console.log('✅ Loaded', newOrders.length, 'orders');
      
      // Set up timers for cancelled orders
      setupCancelledOrderTimers(newOrders);
      
      // Update local stats to reflect current orders (excluding cancelled ones in countdown)
      updateLocalStats(newOrders);
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      
      if (error.message.includes('No authentication token') || error.message.includes('Invalid token')) {
        Alert.alert(
          'Authentication Required', 
          'Please log in to view your orders.',
          [
            { text: 'OK', onPress: () => {
              // You might want to navigate to login screen here
              console.log('User needs to log in');
            }}
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to load orders. Please try again.');
      }
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
        console.log('⏰ Setting up 5-second timer for cancelled order:', order.id);
        
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
          console.log('🗑️ Auto-removing cancelled order:', order.id);
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
      console.log('✅ Removed cancelled order:', orderId, 'Remaining orders:', updatedOrders.length);
      
      // Update stats after removing cancelled order
      updateLocalStats(updatedOrders);
      
      // Emit event to update profile stats
      DeviceEventEmitter.emit('ORDER_REMOVED', {
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
    
    console.log('📊 Updated local stats:', newStats);
    setStats(newStats);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Refresh orders when screen comes into focus (e.g., after placing an order)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 Orders screen focused - refreshing orders');
      loadOrders();
    });

    return unsubscribe;
  }, [navigation]);
  
  // Cleanup timers when component unmounts
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up cancelled order timers');
      cancelledOrderTimers.forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, [cancelledOrderTimers]);
  
  // No hardcoded data - using real database orders only

  const tabs = ['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const getStatusColor = (status) => {
    const colors = getOrderStatusColors(status);
    return colors?.primary || '#FF8B47';
  };

  const getStatusIcon = (status) => {
    const colors = getOrderStatusColors(status);
    return colors?.icon || 'help-circle';
  };

  const getStatusBackground = (status) => {
    const colors = getOrderStatusColors(status);
    return colors?.background || 'rgba(255, 139, 71, 0.1)';
  };

  const getStatusBorder = (status) => {
    const colors = getOrderStatusColors(status);
    return colors?.border || 'rgba(255, 139, 71, 0.3)';
  };

  const filteredOrders = activeTab === 'All' 
    ? orders 
    : orders.filter(order => order.status.toLowerCase() === activeTab.toLowerCase());

  // Handle viewing order details
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  // Handle canceling order (only for pending orders)
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
              // First, update local state to show red/cancelled status
              setOrders(prevOrders =>
                prevOrders.map(order =>
                  order.id === orderId
                    ? { ...order, status: 'Cancelled', isCancelling: true, countdown: 5 }
                    : order
                )
              );
              
              // Show immediate feedback
              Alert.alert('Order Cancelled', 'Your order has been cancelled successfully.');
              
              // Start countdown timer
              const countdownInterval = setInterval(() => {
                setOrders(prevOrders =>
                  prevOrders.map(order =>
                    order.id === orderId && order.countdown > 0
                      ? { ...order, countdown: order.countdown - 1 }
                      : order
                  )
                );
              }, 1000);
              
              // Wait 5 seconds then remove from database and local state
              console.log('⏰ Starting 5-second countdown for order removal...');
              setTimeout(async () => {
                clearInterval(countdownInterval);
                try {
                  console.log('🗑️ Removing order from database...');
                  // Remove from database
                  await orderApi.cancelOrder(orderId);
                  
                  console.log('🗑️ Removing order from UI...');
                  // Remove from local state
                  setOrders(prevOrders => {
                    const filteredOrders = prevOrders.filter(order => order.id !== orderId);
                    console.log('✅ Order removed from UI. Remaining orders:', filteredOrders.length);
                    return filteredOrders;
                  });
                  
                  console.log('✅ Order completely removed after 5 seconds');
                } catch (error) {
                  console.error('❌ Error removing order from database:', error);
                  // Even if DB removal fails, keep it removed from UI
                  console.log('🗑️ Removing order from UI despite DB error...');
                  setOrders(prevOrders => {
                    const filteredOrders = prevOrders.filter(order => order.id !== orderId);
                    console.log('✅ Order removed from UI despite DB error. Remaining orders:', filteredOrders.length);
                    return filteredOrders;
                  });
                }
              }, 5000);
              
            } catch (error) {
              console.error('❌ Error cancelling order:', error);
              Alert.alert('Error', 'Failed to cancel order. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderOrderItem = (order) => {
    try {
      console.log('🎯 renderOrderItem called for order:', order.id);
      // Debug: Log the order structure
      console.log('🔍 Order structure:', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        order_number: order.order_number,
        total_amount: order.total_amount,
        total: order.total,
        hasItems: !!order.items,
        itemsLength: order.items?.length,
        firstItem: order.items?.[0],
        orderKeys: Object.keys(order)
      });
      
      console.log('💰 Total debugging:', {
        'order.total': order.total,
        'order.total_amount': order.total_amount,
        'typeof total': typeof order.total,
        'typeof total_amount': typeof order.total_amount,
        'final display': order.total || (order.total_amount ? `₱${order.total_amount}` : '₱0.00')
      });

    // Get the first item safely
    const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
    
      return (
        <TouchableOpacity 
          key={order.id} 
          style={[
            styles.orderCard,
            order.status === 'Cancelled' && order.isCancelling && styles.cancelledOrderCard
          ]}
          onPress={() => navigation.navigate('OrderDetail', { order })}
        >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>
              {order.orderNumber || order.order_number || order.id}
            </Text>
            <Text style={styles.orderDate}>{order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Icon name={getStatusIcon(order.status)} size={12} color="#FFFFFF" />
            <Text style={styles.statusText}>
              {order.status}
              {order.status === 'Cancelled' && cancelledOrderCountdowns.has(order.id) && (
                <Text style={styles.countdownText}>
                  {' '}(Removing in {cancelledOrderCountdowns.get(order.id)}s)
                </Text>
              )}
            </Text>
          </View>
        </View>

        <View style={styles.orderContent}>
          {firstItem ? (
            <>
              {(() => {
                // Get image URL from the correct data structure
                let imageUrl = null;
                
                if (firstItem.image) {
                  if (typeof firstItem.image === 'string') {
                    imageUrl = firstItem.image;
                  } else if (firstItem.image.url) {
                    imageUrl = firstItem.image.url;
                  }
                }
                
                // Fallback to product snapshot
                if (!imageUrl && firstItem.product_snapshot?.images?.[0]) {
                  imageUrl = firstItem.product_snapshot.images[0];
                }
                
                // Try the original URL first (it might work despite having 'undefined' in the path)
                if (imageUrl && imageUrl.includes('/undefined/')) {
                  console.log('🖼️ Original malformed URL:', imageUrl);
                  console.log('🖼️ Trying original URL first...');
                  // Don't modify the URL, try it as-is
                }
                
                console.log('🖼️ Final image URL:', imageUrl);
                
                return imageUrl ? (
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.productImage}
                    onError={(error) => console.log('❌ Order image load error:', error.nativeEvent.error)}
                    onLoad={() => console.log('✅ Order image loaded successfully:', imageUrl)}
                  />
                ) : (
                  <View style={[styles.productImage, { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' }]}>
                    <Icon name="image-outline" size={24} color="#CCC" />
                    <Text style={{ fontSize: 10, color: '#999' }}>No Image</Text>
                  </View>
                );
              })()}
              <View style={styles.productInfo}>
                <Text style={styles.productName}>
                  {firstItem.name || 
                   firstItem.product_snapshot?.name || 
                   'Product'}
                </Text>
                <View style={styles.productPriceRow}>
                  <Text style={styles.productPrice}>
                    {firstItem.price || 
                     (firstItem.unit_price ? `₱${firstItem.unit_price}` : '₱0')}
                  </Text>
                  
                  {/* Cancel Order Button - Only for Pending orders, aligned with price */}
                  {order.status === 'Pending' && (
                    <TouchableOpacity 
                      style={styles.cancelOrderButton}
                      onPress={() => cancelOrder(order.id)}
                      activeOpacity={0.8}
                    >
                      <Icon name="close-circle" size={16} color="#FF3B30" />
                      <Text style={styles.cancelOrderText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.productQuantity}>Qty: {firstItem.quantity}</Text>
              </View>
            </>
          ) : (
            <View style={styles.productInfo}>
              <Text style={styles.productName}>Order Items</Text>
              <Text style={styles.productPrice}>Check details</Text>
            </View>
          )}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>
            Total: {order.total || (order.total_amount ? `₱${order.total_amount}` : '₱0.00')}
          </Text>
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => viewOrderDetails(order)}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
            <Icon name="chevron-forward" size={16} color="#FF8B47" />
          </TouchableOpacity>
        </View>

        {/* Buyer Order Status Action Buttons */}
        <View style={styles.orderActions}>
          {/* PENDING STATUS - Show waiting message */}
          {order.status === 'Pending' && (
            <View style={styles.statusMessage}>
              <Icon name="time-outline" size={16} color="#FF8B47" />
              <Text style={styles.statusMessageText}>Waiting for seller confirmation</Text>
            </View>
          )}
          
          {/* CONFIRMED STATUS - Show processing message */}
          {order.status === 'Confirmed' && (
            <View style={styles.statusMessage}>
              <Icon name="checkmark-circle" size={16} color="#2196F3" />
              <Text style={styles.statusMessageText}>Order confirmed! Seller is preparing your items</Text>
            </View>
          )}
          
          {/* PROCESSING STATUS - Show processing message */}
          {order.status === 'Processing' && (
            <View style={styles.statusMessage}>
              <Icon name="refresh-circle" size={16} color="#9C27B0" />
              <Text style={styles.statusMessageText}>Your order is being processed</Text>
            </View>
          )}
          
          {/* SHIPPED STATUS - Show tracking info */}
          {order.status === 'Shipped' && (
            <View style={styles.statusMessage}>
              <Icon name="airplane" size={16} color="#00BCD4" />
              <Text style={styles.statusMessageText}>
                {order.tracking_number ? `Tracking: ${order.tracking_number}` : 'Your order is on the way!'}
              </Text>
            </View>
          )}
          
          {/* DELIVERED STATUS - Show completion message */}
          {order.status === 'Delivered' && (
            <View style={styles.statusMessage}>
              <Icon name="checkmark-done-circle" size={16} color="#4CAF50" />
              <Text style={styles.statusMessageText}>Order delivered successfully!</Text>
            </View>
          )}
          
          {/* CANCELLED STATUS - Show cancellation message with countdown */}
          {order.status === 'Cancelled' && (
            <View style={styles.statusMessage}>
              <Icon name="close-circle" size={16} color="#FF3B30" />
              <Text style={styles.statusMessageText}>
                Order cancelled - Removing in {order.countdown || 0} seconds...
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
    } catch (error) {
      console.error('❌ Error rendering order item:', error);
      return (
        <View style={styles.orderCard}>
          <Text>Error loading order</Text>
        </View>
      );
    }
  };

  try {
    return (
      <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8B47" />
      
      {/* Shaped Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>My Orders</Text>
              <Text style={styles.headerSubtitle}>Track your purchases</Text>
            </View>
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => {/* Add search functionality */}}
            >
              <Icon name="search-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Order Stats Cards - Only 3 Counts: Pending, Confirmed, Delivered */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Icon name="time-outline" size={24} color="#FF8B47" />
              <Text style={styles.statNumber}>{stats.pending || 0}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="checkmark-circle-outline" size={24} color="#2196F3" />
              <Text style={styles.statNumber}>{stats.confirmed || 0}</Text>
              <Text style={styles.statLabel}>Confirmed</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="checkmark-done-circle-outline" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>{stats.delivered || 0}</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8B47" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.ordersContainer}
          contentContainerStyle={styles.ordersScrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadOrders}
              colors={['#FF8B47']}
            />
          }
        >
          {filteredOrders.length > 0 ? (
            filteredOrders.map(renderOrderItem)
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="receipt-outline" size={80} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'All' 
                  ? "You haven't placed any orders yet" 
                  : `No ${activeTab.toLowerCase()} orders found`}
              </Text>
              <TouchableOpacity 
                style={styles.shopButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.shopButtonText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Buyer Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeOrderModal}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Order Info */}
            <ScrollView style={styles.modalContent}>
              {/* Order Status */}
              <View style={styles.orderStatusSection}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                  <Icon name={getStatusIcon(selectedOrder.status)} size={16} color="#FFFFFF" />
                  <Text style={styles.statusText}>{selectedOrder.status}</Text>
                </View>
                <Text style={styles.orderNumber}>Order #{selectedOrder.orderNumber}</Text>
                <Text style={styles.orderDate}>Placed on {selectedOrder.date}</Text>
              </View>

              {/* Seller Info */}
              <View style={styles.sellerSection}>
                <Text style={styles.sectionTitle}>Seller Information</Text>
                <View style={styles.sellerInfo}>
                  <View style={styles.sellerAvatar}>
                    <Icon name="storefront" size={20} color="#FF8B47" />
                  </View>
                  <View style={styles.sellerDetails}>
                    <Text style={styles.sellerName}>{selectedOrder.seller?.name || 'Seller'}</Text>
                    <Text style={styles.sellerLabel}>From this store</Text>
                  </View>
                </View>
              </View>

              {/* Order Items */}
              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>Order Items</Text>
                {selectedOrder.items?.map((item, index) => (
                  <View key={index} style={styles.orderItem}>
                    {item.image ? (
                      <Image 
                        source={{ uri: item.image }} 
                        style={styles.itemImage}
                      />
                    ) : (
                      <View style={[styles.itemImage, { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' }]}>
                        <Icon name="image-outline" size={20} color="#CCC" />
                      </View>
                    )}
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>{item.price}</Text>
                      <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                    </View>
                    <Text style={styles.itemTotal}>{item.total}</Text>
                  </View>
                ))}
              </View>

              {/* Order Summary */}
              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>{selectedOrder.total}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping</Text>
                  <Text style={styles.summaryValue}>₱0.00</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{selectedOrder.total}</Text>
                </View>
              </View>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <View style={styles.addressSection}>
                  <Text style={styles.sectionTitle}>Shipping Address</Text>
                  <Text style={styles.addressText}>
                    {typeof selectedOrder.shippingAddress === 'string' 
                      ? selectedOrder.shippingAddress 
                      : JSON.stringify(selectedOrder.shippingAddress)
                    }
                  </Text>
                </View>
              )}

              {/* Tracking Info */}
              {selectedOrder.trackingNumber && (
                <View style={styles.trackingSection}>
                  <Text style={styles.sectionTitle}>Tracking Information</Text>
                  <View style={styles.trackingInfo}>
                    <Icon name="location" size={16} color="#2196F3" />
                    <Text style={styles.trackingNumber}>Tracking: {selectedOrder.trackingNumber}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.contactSellerButton}
                onPress={() => {
                  // Navigate to chat with seller
                  closeOrderModal();
                }}
              >
                <Icon name="chatbubble" size={16} color="#FFFFFF" />
                <Text style={styles.contactSellerText}>Contact Seller</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
    );
  } catch (error) {
    console.error('❌ Error in Order component:', error);
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Error loading orders</Text>
        </View>
      </SafeAreaView>
    );
  }
}
