import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshControl
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
  const [activeTab, setActiveTab] = useState('Products');
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
  
  // No recent orders yet - placeholder data
  const recentOrders = [];

  // Use sellerProfile state if available, otherwise fallback to user context
  const currentProfile = sellerProfile || user;

  // Listen for profile image updates
  useEffect(() => {
    // Load initial notification count
    loadNotificationCount();
    
    // Set up periodic refresh for new AR completions (every 2 minutes to reduce server load)
    const notificationRefreshInterval = setInterval(() => {
      loadNotificationCount();
    }, 120000); // 2 minutes instead of 30 seconds

    const profileUpdateListener = DeviceEventEmitter.addListener('PROFILE_IMAGE_UPDATED', () => {
      console.log('📸 Profile image updated, refreshing Home.jsx');
      fetchSellerProfile();
    });

    const shopUpdateListener = DeviceEventEmitter.addListener('SHOP_PROFILE_UPDATED', () => {
      console.log('🏪 Shop profile updated, refreshing Home.jsx');
      console.log('🏪 Current profile before shop refresh:', currentProfile?.shop_name, currentProfile?.seller_profile?.businessDescription);
      // Clear current profile to force refresh
      setSellerProfile(null);
      fetchSellerProfile();
    });

    // Listen for new AR notifications
    const arNotificationListener = DeviceEventEmitter.addListener('KIRI_MODEL_READY', () => {
      console.log('🔔 New AR notification received');
      loadNotificationCount();
    });

    // Listen for notification updates (when user reads/deletes notifications)
    const notificationUpdateListener = DeviceEventEmitter.addListener('NOTIFICATIONS_UPDATED', () => {
      console.log('🔔 Notifications updated, refreshing count');
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

  // Debug logging to see what data we have
  React.useEffect(() => {
    if (currentProfile) {
      console.log('🏪 Shop Card Debug - Available data:');
      console.log('   - shop_name:', currentProfile?.shop_name);
      console.log('   - shopName:', currentProfile?.shopName);
      console.log('   - fullName:', currentProfile?.fullName);
      console.log('   - full_name:', currentProfile?.full_name);
      console.log('   - seller_profile:', currentProfile?.seller_profile);
      console.log('   - businessName:', currentProfile?.seller_profile?.businessName);
      console.log('   - ownerName:', currentProfile?.seller_profile?.ownerName);
      console.log('   - businessDescription:', currentProfile?.seller_profile?.businessDescription);
      console.log('   - shopLogo:', currentProfile?.seller_profile?.shopLogo);
      console.log('   - shopBanner:', currentProfile?.seller_profile?.shopBanner);
      console.log('🏪 Final values:');
      console.log('   - shopName:', shopName);
      console.log('   - ownerName:', ownerName);
    }
  }, [currentProfile, shopName, ownerName]);

  // Function to load notification count with better error handling
  const loadNotificationCount = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token found, cannot load notification count');
        setUnreadNotifications(0);
        return;
      }

      console.log('🔔 Loading notification count...');
      const result = await notificationApi.getNotifications(token);
      
      if (result.success) {
        const unreadCount = result.notifications.filter(n => !n.read).length;
        setUnreadNotifications(unreadCount);
        console.log('✅ Notification count loaded:', unreadCount);
      } else {
        console.error('Failed to load notifications:', result.error);
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
      // Set default value on error
      setUnreadNotifications(0);
    }
  };

  // Function to fetch seller stats from backend
  const fetchSellerStats = async () => {
    try {
      setLoadingStats(true);
      console.log('🔄 Fetching seller stats from backend...');
      
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch(`${BASE_URL}/api/seller/stats`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log('✅ Stats response received:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          console.log('✅ Seller stats loaded successfully:', data.stats);
          setStats({
            revenue: data.stats.revenue || 0,
            orders: data.stats.orders || 0,
            products: data.stats.products || 0,
            rating: data.stats.rating || 0,
            totalSales: data.stats.totalSales || 0
          });
        }
      } else {
        console.warn('⚠️ Stats request failed:', response.status);
        // Fallback to basic stats
        setStats({
          revenue: 0,
          orders: 0,
          products: sellerProducts.length,
          rating: 0,
          totalSales: 0
        });
      }
    } catch (error) {
      console.error('❌ Error fetching seller stats:', error);
      // Keep default stats on error
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
      console.log('🔄 Fetching seller profile using simple user API...');
      
      const token = await require('@react-native-async-storage/async-storage').default.getItem('authToken');
      
      const response = await fetch(`${BASE_URL}/api/user/profile?t=${Date.now()}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log('✅ Profile response received:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          console.log('✅ Seller profile loaded successfully');
          console.log('🔍 New profile data:', {
            shopName: data.user.shopName || data.user.shop_name,
            businessName: data.user.sellerProfile?.businessName,
            businessDescription: data.user.sellerProfile?.businessDescription,
            shopLogo: data.user.sellerProfile?.shopLogo,
            shopBanner: data.user.sellerProfile?.shopBanner
          });
          setSellerProfile(data.user);
        }
      } else {
        console.warn('⚠️ Profile request failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching seller profile:', error);
      // Keep existing profile or user data on error
    }
  };

  // Function to fetch seller products using simple direct fetch
  const fetchSellerProducts = async () => {
    try {
      setLoadingProducts(true);
      console.log('🔄 Fetching seller products using direct fetch...');
      
      const token = await require('@react-native-async-storage/async-storage').default.getItem('authToken');
      
      const response = await fetch(`${BASE_URL}/api/seller/products`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log('✅ Products response received:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const products = data.products || [];
          console.log('✅ Seller products loaded successfully:', products.length);
          setSellerProducts(products);
        } else {
          console.warn('⚠️ Products response not successful');
          setSellerProducts([]);
        }
      } else {
        console.warn('⚠️ Products request failed:', response.status);
        setSellerProducts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching seller products:', error);
      setSellerProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle product actions
  const handleProductAction = (action, product) => {
    console.log('🔧 Product action triggered:', { action, productId: product?.id, productName: product?.name });
    console.log('🔧 Navigation object:', !!navigation);
    console.log('🔧 Navigation navigate function:', typeof navigation.navigate);
    
    switch (action) {
      case 'edit':
        console.log('✏️ Attempting to navigate to EditProducts with product:', {
          id: product?.id,
          name: product?.name,
          price: product?.price,
          category: product?.category
        });
        
        // DEBUG: Log the full product object to see what data is available
        console.log('🔍 FULL PRODUCT OBJECT BEING PASSED:', {
          product: product,
          hasName: !!product?.name,
          hasPrice: !!product?.price,
          hasDescription: !!product?.description,
          hasCategory: !!product?.category,
          hasStock: !!product?.stock,
          hasBrand: !!product?.brand,
          hasModel: !!product?.model,
          hasDimensions: !!product?.dimensions,
          hasWeight: !!product?.weight,
          hasMaterial: !!product?.material,
          hasWarranty: !!product?.warranty,
          hasBulbType: !!product?.bulbType,
          hasNumberOfBulbs: !!product?.numberOfBulbs,
          hasVoltage: !!product?.voltage,
          hasLedType: !!product?.ledType,
          hasLumens: !!product?.lumens,
          hasIsDimmable: product?.isDimmable !== undefined,
          hasInstallationType: !!product?.installationType,
          hasRoomType: !!product?.roomType,
          hasColorOptions: !!product?.colorOptions,
          hasSpecifications: !!product?.specifications,
          hasImages: !!product?.images,
          imagesCount: product?.images?.length || 0,
          fullProductKeys: product ? Object.keys(product) : []
        });
        
        try {
          navigation.navigate('EditProducts', { product });
          console.log('✅ Navigation call completed');
        } catch (error) {
          console.error('❌ Navigation error:', error);
          Alert.alert('Navigation Error', 'Failed to open edit screen. Please try again.');
        }
        break;
      case 'delete':
        // Show delete confirmation popup
        console.log('🗑️ Triggering delete confirmation for product:', product?.id);
        setProductToDelete(product);
        setShowDeleteConfirmation(true);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!productToDelete) {
      console.log('❌ No product to delete');
      return;
    }
    
    try {
      setDeletionLoading(true);
      console.log('🗑️ Starting deletion process for product:', {
        id: productToDelete.id,
        name: productToDelete.name,
        sellerId: productToDelete.seller_id
      });
      
      // Call the delete API
      console.log('📡 Calling deleteProduct API...');
      console.log('📡 Product ID type:', typeof productToDelete.id);
      console.log('📡 Product ID value:', productToDelete.id);
      console.log('📡 Product ID stringified:', JSON.stringify(productToDelete.id));
      
      // Check authentication state
      console.log('🔐 Current user:', user);
      console.log('🔐 User ID:', user?.id);
      console.log('🔐 User role:', user?.role);
      
      const response = await deleteProduct(productToDelete.id);
      console.log('✅ Delete API response:', response);
      
      // Remove from local state immediately for better UX
      console.log('🔄 Updating local state...');
      setSellerProducts(prev => {
        const filtered = prev.filter(p => p.id !== productToDelete.id);
        console.log('📊 Products before deletion:', prev.length);
        console.log('📊 Products after deletion:', filtered.length);
        return filtered;
      });
      
      // Emit product deleted event for other screens
      console.log('📡 Emitting SELLER_PRODUCT_DELETED event...');
      DeviceEventEmitter.emit('SELLER_PRODUCT_DELETED');
      
      // Close confirmation and show success
      console.log('✅ Closing confirmation modal and showing success...');
      setShowDeleteConfirmation(false);
      setDeletionResult(response.deletionDetails);
      setShowDeletionSuccess(true);
      
      // Refresh products list to ensure consistency
      console.log('🔄 Refreshing products list...');
      await fetchSellerProducts();
      
      console.log('✅ Product deletion completed successfully');
      
    } catch (error) {
      console.error('❌ Delete product error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
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
      console.warn('⚠️ No user ID found, skipping data load');
      return;
    }

    console.log('🚀 Starting sequential seller data load...');
    
    try {
      // Load data sequentially with delays to prevent overwhelming the server
      console.log('📊 Step 1: Loading seller profile...');
      await fetchSellerProfile();
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('📊 Step 2: Loading seller stats...');
      await fetchSellerStats();
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('📊 Step 3: Loading seller products...');
      await fetchSellerProducts();
      
      // Small delay before notifications
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('📊 Step 4: Loading notifications (non-blocking)...');
      // Load notifications in background without blocking
      loadNotificationCount().catch(error => {
        console.warn('⚠️ Notification loading failed (non-critical):', error);
      });
      
      console.log('✅ All seller data loaded successfully');
    } catch (error) {
      console.error('❌ Error during sequential data loading:', error);
    }
  };

  // Pull-to-refresh function
  const onRefresh = async () => {
    console.log('🔄 Pull-to-refresh triggered');
    setRefreshing(true);
    
    try {
      // Reload all data
      await loadAllSellerData();
      console.log('✅ Pull-to-refresh completed successfully');
    } catch (error) {
      console.error('❌ Error during pull-to-refresh:', error);
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
      console.log('📦 Product created event received, refreshing products...');
      fetchSellerProducts();
    };

    const handleProductUpdated = (eventData) => {
      console.log('🔄 Product updated event received:', eventData?.productId);
      console.log('🖼️ Updated product images:', eventData?.updatedProduct?.images?.length || 0);
      console.log('🖼️ Updated product images data:', eventData?.updatedProduct?.images);
      
      // Immediately update the local state with the updated product
      if (eventData?.updatedProduct && eventData?.productId) {
        console.log('🔄 Updating local state for product:', eventData.productId);
        setSellerProducts(prevProducts => {
          const updated = prevProducts.map(product => {
            if (product.id === eventData.productId) {
              const updatedProduct = { ...product, ...eventData.updatedProduct };
              console.log('🔄 Updated product in state:', {
                id: updatedProduct.id,
                name: updatedProduct.name,
                imagesCount: updatedProduct.images?.length || 0,
                updatedAt: updatedProduct.updatedAt
              });
              return updatedProduct;
            }
            return product;
          });
          console.log('🔄 New products array length:', updated.length);
          return updated;
        });
      }
      
      // Also refresh from server to ensure consistency
      console.log('🔄 Fetching fresh data from server...');
      fetchSellerProducts();
    };

    const handleProfileUpdated = () => {
      console.log('👤 Profile updated event received, refreshing profile...');
      console.log('👤 Current profile before refresh:', currentProfile?.fullName, currentProfile?.shopName);
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
      console.log('🔄 Home screen focused, fetching data...');
      fetchSellerProfile();
      fetchSellerProducts();
      fetchSellerStats();
      loadNotificationCount(); // Load notification count when screen focuses
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
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <View style={{ position: 'relative' }}>
            {/* Dark notification icon for visibility on white background */}
            <Icon name="notifications-outline" size={28} color="#1A1A1A" />
            
            {/* Notification dot */}
            {unreadNotifications > 0 && (
              <View style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: '#FF8B47',
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }} />
            )}
            
            {/* Notification count badge */}
            {unreadNotifications > 0 && (
              <View style={styles.notificationCountBadge}>
                <Text style={styles.notificationCountText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
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
              onError={(error) => {
                console.log('❌ Shop banner load error:', error.nativeEvent.error);
                console.log('❌ Failed URI:', currentProfile.seller_profile.shopBanner);
              }}
              onLoad={() => console.log('✅ Shop banner loaded successfully')}
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
                onError={(error) => {
                  console.log('❌ Shop logo load error:', error.nativeEvent.error);
                  console.log('❌ Failed URI:', currentProfile.seller_profile.shopLogo);
                }}
                onLoad={() => console.log('✅ Shop logo loaded successfully')}
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
    // Debug logging for product structure
    console.log(`🖼️ Rendering product: ${item.name}`);
    console.log(`🖼️ Product images array:`, item.images);
    console.log(`🖼️ Images count: ${item.images?.length || 0}`);
    console.log(`🖼️ First image (should be main):`, item.images?.[0]);
    console.log(`🖼️ Second image:`, item.images?.[1]);
    console.log(`🖼️ Third image:`, item.images?.[2]);
    console.log(`🖼️ UpdatedAt: ${item.updatedAt}`);
    
    // Get main product image using utility function (now always uses first image)
    const imageUri = getMainImageUri(item.images);
    console.log(`🖼️ Main image URI from utility (first image):`, imageUri);
    console.log(`🖼️ Raw images array:`, item.images);
    console.log(`🖼️ Images array type:`, typeof item.images);
    console.log(`🖼️ Images array length:`, item.images?.length);
    if (item.images && item.images.length > 0) {
      console.log(`🖼️ First image item:`, item.images[0]);
      console.log(`🖼️ First image type:`, typeof item.images[0]);
      console.log(`🖼️ Image object keys:`, Object.keys(item.images[0]));
      console.log(`🖼️ Image object values:`, Object.values(item.images[0]));
    }
    
    // Add cache-busting parameter to force image refresh when product is updated
    const cacheBustingUri = imageUri ? `${imageUri}${imageUri.includes('?') ? '&' : '?'}t=${item.updatedAt || Date.now()}` : null;
    
    // Debug logging
    console.log('🖼️ Final cache-busting URI:', cacheBustingUri, 'for product:', item.name);
    if (item.images && item.images.length > 0) {
      console.log('🖼️ Image object structure:', item.images[0]);
    }

    return (
      <View style={styles.modernProductCard} key={`product-${item.id}-${item.updatedAt || 'initial'}`}>
        <View style={styles.productImageContainer}>
          {cacheBustingUri ? (
            <Image
              source={{ uri: cacheBustingUri }}
              style={styles.productImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('Image load error for', item.name, ':', error.nativeEvent.error);
                console.log('Failed URI:', cacheBustingUri);
              }}
              onLoad={() => console.log('Image loaded successfully for:', item.name)}
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
      
      <View style={styles.modernProductInfo}>
        <Text style={styles.modernProductName} numberOfLines={2}>{item.name || 'Unnamed Product'}</Text>
        <Text style={styles.modernProductPrice}>₱{Number(item.price || 0).toLocaleString()}</Text>
        
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
      
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            console.log('🔘 Edit button pressed for product:', {
              id: item.id,
              name: item.name,
              price: item.price
            });
            handleProductAction('edit', item);
          }}
        >
          <Icon name="create-outline" size={18} color="#2196F3" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleProductAction('duplicate', item)}
        >
          <Icon name="copy-outline" size={18} color="#FF9800" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => {
            console.log('🗑️ Delete button pressed for product:', {
              id: item.id,
              name: item.name
            });
            handleProductAction('delete', item);
          }}
          activeOpacity={0.7}
        >
          <Icon name="trash-outline" size={18} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  // Render modern order item
  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.modernOrderCard}
      onPress={() => navigation.navigate('Orders')}
    >
      <View style={styles.orderIconContainer}>
        <Icon name="receipt-outline" size={24} color="#FF8B47" />
      </View>
      
      <View style={styles.modernOrderInfo}>
        <View style={styles.orderTopRow}>
          <Text style={styles.modernOrderCustomer}>{item.customer}</Text>
          <Text style={styles.modernOrderAmount}>{item.amount}</Text>
        </View>
        
        <View style={styles.orderBottomRow}>
          <Text style={styles.modernOrderDate}>{item.date}</Text>
          <View style={[styles.modernOrderStatus, 
            item.status === 'Delivered' ? styles.statusDelivered : 
            item.status === 'Shipped' ? styles.statusShipped : 
            styles.statusProcessing]}>
            <Text style={styles.modernOrderStatusText}>{item.status}</Text>
          </View>
        </View>
      </View>
      
      <Icon name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  // Compute list props based on tab (avoid nested VirtualizedLists)
  const listConfig = useMemo(() => {
    if (activeTab === 'Products') {
      return {
        data: sellerProducts,
        renderItem: renderProductItem,
        keyExtractor: (item) => item.id,
        contentContainerStyle: styles.productList,
      };
    }
    return {
      data: recentOrders,
      renderItem: renderOrderItem,
      keyExtractor: (item) => item.id,
      contentContainerStyle: styles.orderList,
    };
  }, [activeTab]);

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
        
        {/* Tab Navigation */}
        <View style={styles.modernTabContainer}>
          {['Products', 'Orders'].map(tab => (
            <TouchableOpacity 
              key={tab}
              style={[styles.modernTab, activeTab === tab && styles.modernActiveTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.modernTabText, activeTab === tab && styles.modernActiveTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Content List */}
        <View style={styles.contentContainer}>
          {activeTab === 'Products' ? (
            <View>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.contentSectionTitle}>Your Products</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    onPress={async () => {
                      console.log('🧪 Testing network connections...');
                      const workingUrl = await testConnection();
                      if (workingUrl) {
                        Alert.alert('Connection Test', `Found working connection: ${workingUrl}`);
                      } else {
                        Alert.alert('Connection Test', 'No working connections found. Check if backend is running.');
                      }
                    }}
                    style={{ marginRight: 15, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#FF8B47', borderRadius: 4 }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>TEST</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('🔄 Manual refresh triggered');
                      setSellerProducts([]);
                      fetchSellerProducts();
                    }}
                    style={{ marginRight: 15 }}
                  >
                    <Icon name="refresh" size={20} color="#4A90E2" />
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
          ) : (
            <View>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.contentSectionTitle}>Recent Orders</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                  <Text style={styles.viewAllLink}>View All</Text>
                </TouchableOpacity>
              </View>
              {recentOrders.length === 0 ? (
                <View style={[styles.modernOrderCard, { alignItems: 'center' }]}>
                  <Icon name="receipt-outline" size={24} color="#FF8B47" />
                  <Text style={{ marginLeft: 12, color: '#888' }}>No recent orders</Text>
                </View>
              ) : (
                recentOrders.map(item => (
                  <View key={item.id}>
                    {renderOrderItem({ item })}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Delete Confirmation Popup */}
      {console.log('🔍 Delete modal state:', {
        visible: showDeleteConfirmation,
        hasProduct: !!productToDelete,
        productId: productToDelete?.id,
        loading: deletionLoading
      })}
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

