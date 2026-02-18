import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Image,
  Alert,
  DeviceEventEmitter,
  StatusBar,
  RefreshControl,
  Animated
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './styles/Home.style';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../api/api';
import { getSellerStats, getSellerProfile } from '../../api/sellerApi';
import { getProducts, deleteProduct, getSellerProducts } from '../../api/productApi';
import { testConnection } from '../../api/api';
import { getMainImageUri } from '../../utils/imageUtils';
import Icon from 'react-native-vector-icons/Ionicons';
import DeleteConfirmation from '../../components/DeleteConfirmation';
import DeletionSuccess from '../../components/DeletionSuccess';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedNotificationIcon from '../../components/AnimatedNotificationIcon';
import * as notificationApi from '../../api/notificationApi';

const { width } = Dimensions.get('window');

export default function Home({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, rating: 0, totalSales: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  // Custom popup states
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [showDeletionSuccess, setShowDeletionSuccess] = useState(false);
  const [deletionResult, setDeletionResult] = useState(null);
  
  // Menu state for each product (using product ID as key)
  const [expandedMenus, setExpandedMenus] = useState({});
  const menuAnimations = useRef({});
  

  // Use sellerProfile state if available, otherwise fallback to user context
  const currentProfile = sellerProfile || user;

  // Listen for profile image updates
  useEffect(() => {
    loadNotificationCount();
    
    // Set up periodic refresh for new AR completions (every 2 minutes to reduce server load)
    const notificationRefreshInterval = setInterval(() => {
      loadNotificationCount();
    }, 120000);

    const profileUpdateListener = DeviceEventEmitter.addListener('PROFILE_IMAGE_UPDATED', () => {
      fetchSellerProfile();
    });

    const shopUpdateListener = DeviceEventEmitter.addListener('SHOP_PROFILE_UPDATED', () => {
      setSellerProfile(null);
      fetchSellerProfile();
    });

    const arNotificationListener = DeviceEventEmitter.addListener('KIRI_MODEL_READY', () => {
      loadNotificationCount();
    });

    const notificationUpdateListener = DeviceEventEmitter.addListener('NOTIFICATIONS_UPDATED', () => {
      loadNotificationCount();
    });

    return () => {
      clearInterval(notificationRefreshInterval);
      profileUpdateListener.remove();
      shopUpdateListener.remove();
      arNotificationListener.remove();
      notificationUpdateListener.remove();
    };
  }, []);
  // Shop name priority: shop_name from profile, then businessName from seller_profile, then user's full name, then fallback
  const shopName = currentProfile?.shop_name || 
                   currentProfile?.shopName || 
                   currentProfile?.seller_profile?.businessName || 
                   currentProfile?.full_name || 
                   currentProfile?.fullName || 
                   'Your Shop';
  
  // Owner name for greeting (user's actual name)
  const ownerName = currentProfile?.full_name || currentProfile?.fullName || 'Seller';
  
  // Shop description from seller profile
  const shopDescription = currentProfile?.seller_profile?.businessDescription || '';
  

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };


  // Function to load notification count with better error handling
  const loadNotificationCount = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setUnreadNotifications(0);
        return;
      }

      const result = await notificationApi.getNotifications(token);
      
      if (result.success) {
        const unreadCount = result.notifications.filter(n => !n.read).length;
        setUnreadNotifications(unreadCount);
      } else {
        // Fallback to local storage
        const stored = await AsyncStorage.getItem('seller_notifications');
        if (stored) {
          const notifications = JSON.parse(stored);
          const unreadCount = notifications.filter(n => !n.read).length;
          setUnreadNotifications(unreadCount);
        } else {
          setUnreadNotifications(0);
        }
      }
    } catch (error) {
      setUnreadNotifications(0);
    }
  };

  // Function to fetch seller stats from backend
  const fetchSellerStats = async () => {
    try {
      setLoadingStats(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch(`${BASE_URL}/api/seller/stats`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setStats({
            revenue: data.stats.revenue || 0,
            orders: data.stats.orders || 0,
            products: data.stats.products || 0,
            rating: data.stats.rating || 0,
            totalSales: data.stats.totalSales || 0
          });
        }
      } else {
        setStats({
          revenue: 0,
          orders: 0,
          products: sellerProducts.length,
          rating: 0,
          totalSales: 0
        });
      }
    } catch (error) {
      setStats({ 
        revenue: 0, 
        orders: 0, 
        products: sellerProducts.length, 
        rating: 0,
        totalSales: 0 
      });
    } finally {
      setLoadingStats(false);
    }
  };

  // Function to fetch seller profile using simple user API (like buyer)
  const fetchSellerProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch(`${BASE_URL}/api/user/profile?t=${Date.now()}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setSellerProfile(data.user);
        }
      }
    } catch (error) {
      // Keep existing profile or user data on error
    }
  };

  // Function to fetch seller products using simple direct fetch
  const fetchSellerProducts = async () => {
    try {
      setLoadingProducts(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch(`${BASE_URL}/api/seller/products`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const products = data.products || [];
          setSellerProducts(products);
        } else {
          setSellerProducts([]);
        }
      } else {
        setSellerProducts([]);
      }
    } catch (error) {
      setSellerProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle product actions
  const handleProductAction = (action, product) => {
    switch (action) {
      case 'edit':
        // Navigate immediately without any console logs or processing
        navigation.navigate('EditProducts', { product });
        break;
      case 'delete':
        // Show delete confirmation popup
        setProductToDelete(product);
        setShowDeleteConfirmation(true);
        break;
      case 'duplicate':
        // Handle duplicate action
        Alert.alert('Duplicate', 'Duplicate feature coming soon!');
        break;
      default:
        break;
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!productToDelete) {
      return;
    }
    
    try {
      setDeletionLoading(true);
      
      const response = await deleteProduct(productToDelete.id);
      
      // Remove from local state immediately for better UX
      setSellerProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      
      // Emit product deleted event for other screens
      DeviceEventEmitter.emit('SELLER_PRODUCT_DELETED');
      
      // Close confirmation and show success
      setShowDeleteConfirmation(false);
      setDeletionResult(response.deletionDetails);
      setShowDeletionSuccess(true);
      
      // Refresh products list to ensure consistency
      await fetchSellerProducts();
      
    } catch (error) {
      Alert.alert(
        'Deletion Failed', 
        `Failed to delete product: ${error.message || 'Unknown error'}\n\nPlease try again or contact support if the problem persists.`,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setDeletionLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
    setProductToDelete(null);
    setDeletionLoading(false);
  };

  const handleSuccessClose = () => {
    setShowDeletionSuccess(false);
    setDeletionResult(null);
    setProductToDelete(null);
  };

  // Update product count whenever sellerProducts changes
  useEffect(() => {
    setStats(prevStats => ({
      ...prevStats,
      products: sellerProducts.length
    }));
  }, [sellerProducts]);

  // Sequential loading function to prevent timeout issues
  const loadAllSellerData = async () => {
    if (!user?.id) {
      return;
    }
    
    try {
      // Load data sequentially with delays to prevent overwhelming the server
      await fetchSellerProfile();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await fetchSellerStats();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await fetchSellerProducts();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load notifications in background without blocking
      loadNotificationCount().catch(() => {});
    } catch (error) {
      // Silent error handling
    }
  };

  // Pull-to-refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAllSellerData();
    } catch (error) {
      // Silent error handling
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    if (mounted && user?.id) {
      loadAllSellerData();
    }
    
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Listen for product creation and update events
  useEffect(() => {
    const handleProductCreated = () => {
      fetchSellerProducts();
    };

    const handleProductUpdated = (eventData) => {
      // Immediately update the local state with the updated product
      if (eventData?.updatedProduct && eventData?.productId) {
        setSellerProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === eventData.productId 
              ? { ...product, ...eventData.updatedProduct }
              : product
          )
        );
      }
      
      // Also refresh from server to ensure consistency
      fetchSellerProducts();
    };

    const handleProfileUpdated = () => {
      // Clear current profile to force refresh
      setSellerProfile(null);
      fetchSellerProfile();
    };

    const productCreatedSubscription = DeviceEventEmitter.addListener('SELLER_PRODUCT_CREATED', handleProductCreated);
    const productUpdatedSubscription = DeviceEventEmitter.addListener('SELLER_PRODUCT_UPDATED', handleProductUpdated);
    const profileSubscription = DeviceEventEmitter.addListener('SELLER_PROFILE_UPDATED', handleProfileUpdated);
    
    return () => {
      productCreatedSubscription.remove();
      productUpdatedSubscription.remove();
      profileSubscription.remove();
    };
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from upload or edit screens)
  useFocusEffect(
    React.useCallback(() => {
      fetchSellerProfile();
      fetchSellerProducts();
      fetchSellerStats();
      loadNotificationCount();
    }, [user?.id])
  );
  // Render modern header
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.shopOwnerName}>{ownerName}</Text>
        </View>
      </View>
    </View>
  );

  // Render stats cards
  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.salesCard]}>
          <View style={styles.statIconContainer}>
            <Icon name="trending-up" size={24} color="#4CAF50" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>₱{Number(stats.revenue).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Sales</Text>
          </View>
        </View>
        
        <View style={[styles.statCard, styles.ordersCard]}>
          <View style={styles.statIconContainer}>
            <Icon name="receipt" size={24} color="#2196F3" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{stats.orders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.productsCard]}>
          <View style={styles.statIconContainer}>
            <Icon name="cube" size={24} color="#FF9800" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{stats.products}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.statCard, styles.ratingCard]}
          onPress={() => {
            // Reviews functionality removed
            Alert.alert('Reviews', 'Reviews feature has been removed from the navigation.');
          }}
          activeOpacity={0.7}
        >
          <View style={styles.statIconContainer}>
            <Icon name="star" size={24} color="#FFD700" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{stats.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render shop profile card
  const renderShopProfile = () => {
    return (
    <View style={styles.shopCard}>
      <View style={styles.shopHeader}>
        <View style={styles.shopImageContainer}>
          {currentProfile?.seller_profile?.shopBanner ? (
            <Image
              source={{ 
                uri: currentProfile.seller_profile.shopBanner.startsWith('http') 
                  ? `${currentProfile.seller_profile.shopBanner}?t=${currentProfile?.updated_at || Date.now()}` 
                  : `${BASE_URL}${currentProfile.seller_profile.shopBanner}?t=${currentProfile?.updated_at || Date.now()}`
              }}
              style={styles.shopBannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.shopBannerImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F0' }]}>
              <Icon name="image" size={28} color="#BBB" />
            </View>
          )}
          <View style={styles.shopLogoContainer}>
            {currentProfile?.seller_profile?.shopLogo ? (
              <Image
                source={{ 
                  uri: currentProfile.seller_profile.shopLogo.startsWith('http') 
                    ? `${currentProfile.seller_profile.shopLogo}?t=${currentProfile?.updated_at || Date.now()}` 
                    : `${BASE_URL}${currentProfile.seller_profile.shopLogo}?t=${currentProfile?.updated_at || Date.now()}`
                }}
                style={styles.shopLogo}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.shopLogo, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEE' }]}>
                <Icon name="storefront" size={30} color="#999" />
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.shopInfo}>
        <View style={styles.shopProfileRow}>
          <View style={styles.shopTextContainer}>
            <Text style={styles.shopName}>{shopName}</Text>
          </View>
        </View>
        <Text style={styles.shopDescription}>
          {shopDescription || `Welcome to ${shopName}! We offer quality products with excellent service. Browse our collection and discover amazing deals.`}
        </Text>
      </View>
    </View>
    );
  };

  // Render modern product item
  const renderProductItem = ({ item }) => {
    // Get or create menu animation value for this product
    if (!menuAnimations.current[item.id]) {
      menuAnimations.current[item.id] = new Animated.Value(0);
    }
    const menuAnimation = menuAnimations.current[item.id];
    const menuExpanded = expandedMenus[item.id] || false;
    
    // Get main product image using utility function (now always uses first image)
    const imageUri = getMainImageUri(item.images);
    
    // Add cache-busting parameter to force image refresh when product is updated
    const cacheBustingUri = imageUri ? `${imageUri}${imageUri.includes('?') ? '&' : '?'}t=${item.updatedAt || Date.now()}` : null;
    
    // Toggle menu with animation
    const toggleMenu = () => {
      const toValue = menuExpanded ? 0 : 1;
      setExpandedMenus(prev => ({
        ...prev,
        [item.id]: !menuExpanded
      }));
      
      Animated.spring(menuAnimation, {
        toValue,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };
    
    // Animated styles for action buttons
    const button1Style = {
      transform: [
        {
          translateX: menuAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -140],
          }),
        },
        {
          scale: menuAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
        },
      ],
      opacity: menuAnimation,
    };
    
    const button2Style = {
      transform: [
        {
          translateX: menuAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -95],
          }),
        },
        {
          scale: menuAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
        },
      ],
      opacity: menuAnimation,
    };
    
    const button3Style = {
      transform: [
        {
          translateX: menuAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -50],
          }),
        },
        {
          scale: menuAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
        },
      ],
      opacity: menuAnimation,
    };
    
    const menuButtonRotation = {
      transform: [
        {
          rotate: menuAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '90deg'],
          }),
        },
      ],
    };
    
    // Overlay opacity animation
    const overlayStyle = {
      opacity: menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.7],
      }),
    };

    return (
      <View style={styles.modernProductCard} key={`product-${item.id}-${item.updatedAt || 'initial'}`}>
        {/* Dim overlay when menu is expanded */}
        {menuExpanded && (
          <Animated.View style={[styles.menuOverlay, overlayStyle]} pointerEvents="none" />
        )}
        {/* Three-dot menu button - Top Right */}
        <View style={styles.menuButtonContainer}>
              {/* Animated Action Buttons (appear when menu is expanded) */}
              <Animated.View style={[styles.actionButton, button1Style, { position: 'absolute', right: 0 }]}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#E3F2FD', borderColor: '#90CAF9' }]}
                  onPress={() => {
                    // Close menu and navigate immediately
                    setExpandedMenus(prev => ({ ...prev, [item.id]: false }));
                    menuAnimation.setValue(0);
                    handleProductAction('edit', item);
                  }}
                  disabled={!menuExpanded}
                >
                  <Icon name="create-outline" size={18} color="#2196F3" />
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={[styles.actionButton, button2Style, { position: 'absolute', right: 0 }]}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#FFF3E0', borderColor: '#FFCC80' }]}
                  onPress={() => {
                    handleProductAction('duplicate', item);
                    // Close menu instantly
                    setExpandedMenus(prev => ({
                      ...prev,
                      [item.id]: false
                    }));
                    menuAnimation.setValue(0);
                  }}
                  disabled={!menuExpanded}
                >
                  <Icon name="copy-outline" size={18} color="#FF9800" />
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={[styles.actionButton, button3Style, { position: 'absolute', right: 0 }]}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => {
                    // Close menu and show delete confirmation
                    setExpandedMenus(prev => ({ ...prev, [item.id]: false }));
                    menuAnimation.setValue(0);
                    handleProductAction('delete', item);
                  }}
                  activeOpacity={0.7}
                  disabled={!menuExpanded}
                >
                  <Icon name="trash-outline" size={18} color="#F44336" />
                </TouchableOpacity>
              </Animated.View>
              
          {/* Three-dot menu button */}
          <Animated.View style={menuButtonRotation}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.menuButton]}
              onPress={toggleMenu}
              activeOpacity={0.7}
            >
              <Icon name="ellipsis-horizontal" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        {/* Top Row: Image + Product Name */}
        <View style={styles.productTopRow}>
          <View style={styles.productImageContainer}>
            {cacheBustingUri ? (
              <Image
                source={{ uri: cacheBustingUri }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.productImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F3F3' }]}>
                <Icon name="cube" size={28} color="#B0B0B0" />
              </View>
            )}
            <View style={styles.productBadge}>
              <Text style={styles.productBadgeText}>#{String(item.id || '').slice(-6) || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.productNameAndActions}>
            <Text style={styles.modernProductPrice}>₱{Number(item.price || 0).toLocaleString()}</Text>
            
            <View style={styles.productNameContainer}>
              <Text style={styles.modernProductName} numberOfLines={2} ellipsizeMode="tail">{item.name || 'Unnamed Product'}</Text>
            </View>
          </View>
        </View>
        
        {/* Bottom Row: Metrics */}
        <View style={styles.productBottomRow}>
          <View style={styles.modernProductInfo}>
            <View style={styles.productMetrics}>
              <View style={styles.metricItem}>
                <Icon name="bag" size={14} color="#4CAF50" />
                <Text style={styles.metricText}>{item.sold || 0} sold</Text>
              </View>
              <View style={styles.metricItem}>
                <Icon name="cube" size={14} color="#2196F3" />
                <Text style={styles.metricText}>{item.stock || 0} stock</Text>
              </View>
              <View style={styles.metricItem}>
                <Icon name="eye" size={14} color="#FF9800" />
                <Text style={styles.metricText}>{item.isActive ? 'active' : 'inactive'}</Text>
              </View>
              {/* AR Checkmark */}
              {item.hasAR && (
                <View style={styles.metricItem}>
                  <Icon name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={[styles.metricText, { color: '#10B981' }]}>AR Ready</Text>
                </View>
              )}
            </View>
          </View>
        </View>
    </View>
    );
  };



  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF8B47']} // Android
            tintColor="#FF8B47" // iOS
            title="Pull to refresh" // iOS
            titleColor="#666" // iOS
          />
        }
      >
        {/* Modern Header */}
        {renderHeader()}
        
        {/* Stats Cards */}
        {renderStatsCards()}
        
        {/* Shop Profile Card */}
        {renderShopProfile()}
        
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Upload')}
            >
              <View style={styles.quickActionIcon}>
                <Icon name="add-circle" size={28} color="#4CAF50" />
              </View>
              <Text style={styles.quickActionText}>Add Product</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Orders')}
            >
              <View style={styles.quickActionIcon}>
                <Icon name="receipt" size={28} color="#2196F3" />
              </View>
              <Text style={styles.quickActionText}>View Orders</Text>
            </TouchableOpacity>
            
            
          </View>
        </View>
        
        {/* Tab Navigation - Removed, showing only Products */}
        
        {/* Content List - Products Only */}
        <View style={styles.contentContainer}>
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.contentSectionTitle}>Your Products</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  backgroundColor: '#FFF5F0', 
                  paddingHorizontal: 12, 
                  paddingVertical: 6, 
                  borderRadius: 12,
                  marginRight: 12,
                  borderWidth: 1,
                  borderColor: '#FFE6D7'
                }}>
                  <Icon name="cube" size={16} color="#FF8B47" />
                  <Text style={{ 
                    color: '#FF8B47', 
                    fontSize: 14, 
                    fontWeight: '700',
                    marginLeft: 6 
                  }}>
                    {sellerProducts.length}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    setSellerProducts([]);
                    fetchSellerProducts();
                  }}
                  style={{ marginRight: 12 }}
                >
                  <Icon name="refresh" size={22} color="#4A90E2" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Upload')}>
                  <Text style={styles.viewAllLink}>Add Product</Text>
                </TouchableOpacity>
              </View>
            </View>
            {loadingProducts ? (
              <View style={[styles.modernProductCard, { alignItems: 'center', justifyContent: 'center' }]}>
                <Icon name="refresh" size={28} color="#B0B0B0" />
                <Text style={{ marginTop: 8, color: '#888' }}>Loading products...</Text>
              </View>
            ) : sellerProducts.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateIconContainer}>
                  <Icon name="storefront" size={40} color="#FF8B47" />
                </View>
                <Text style={styles.emptyStateTitle}>
                  Welcome to Your Store!
                </Text>
                <Text style={styles.emptyStateDescription}>
                  You haven't created any products yet. Start building your catalog and reach customers with your amazing products.
                </Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={() => navigation.navigate('Upload')}
                >
                  <Icon name="add-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyStateButtonText}>Create Your First Product</Text>
                </TouchableOpacity>
              </View>
            ) : (
              sellerProducts.map(item => (
                <View key={`product-${item.id}-${item.updatedAt || 'initial'}`}>
                  {renderProductItem({ item })}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Custom Delete Confirmation Popup */}
      <DeleteConfirmation
        visible={showDeleteConfirmation}
        product={productToDelete}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        loading={deletionLoading}
      />

      {/* Custom Deletion Success Popup */}
      <DeletionSuccess
        visible={showDeletionSuccess}
        deletionDetails={deletionResult}
        onClose={handleSuccessClose}
      />

    </View>
  );
}

