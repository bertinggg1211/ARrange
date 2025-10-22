import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  ActivityIndicator,
  DeviceEventEmitter,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useAuth } from "../../context/AuthContext";
import { getSellerProfile, getSellerStats } from "../../api/sellerApi";
import { deleteUserAccount } from "../../api/userApi";
import { clearUserOrders } from "../../api/adminApi";
import DeleteAccountModal from "../../components/DeleteAccountModal";
import AccountDeletedModal from "../../components/AccountDeletedModal";
import ServerConnection from "../../components/ServerConnection";
import styles from "./styles/Profile.style";
import { useIsFocused } from "@react-navigation/native";
import { BASE_URL } from "../../api/api";

export default function Profile({ navigation }) {
  const { logout, user } = useAuth();
  const isFocused = useIsFocused();
  const [sellerProfile, setSellerProfile] = useState(null);
  const [sellerStats, setSellerStats] = useState({
    products: 0,
    rating: 0,
    orders: 0,
    revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showServerConnection, setShowServerConnection] = useState(false);

  // Helper function to calculate time since account creation
  const getTimeSinceCreation = (createdAt) => {
    if (!createdAt) return 'Unknown';
    
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMs = now - created;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);
    
    if (diffInYears > 0) {
      return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
    } else if (diffInMonths > 0) {
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return 'Today';
    }
  };

  // Helper function to get shop profile picture URI (from EditShopInfo.jsx)
  const getShopProfileImageUri = (sellerProfile) => {
    // Use shop logo first, then profile image as fallback (correct field names)
    const shopImage = sellerProfile?.seller_profile?.shopLogo || sellerProfile?.seller_profile?.profileImage;
    if (!shopImage) return null;
    
    let imageUrl;
    if (shopImage.startsWith('http')) {
      // Already a full URL
      imageUrl = shopImage;
    } else if (shopImage.startsWith('/')) {
      // Relative path from server
      imageUrl = `${BASE_URL}${shopImage}`;
    } else {
      // Just filename, construct full path
      imageUrl = `${BASE_URL}/uploads/profiles/${shopImage}`;
    }
    
    console.log('📸 SHOP PROFILE IMAGE URI:', imageUrl);
    console.log('📸 Using shopLogo:', !!sellerProfile?.seller_profile?.shopLogo, 'or profileImage:', !!sellerProfile?.seller_profile?.profileImage);
    return imageUrl;
  };

  // Fetch seller profile and stats on mount and when returning to screen
  useEffect(() => {
    if (isFocused) {
      fetchSellerData();
    }
  }, [isFocused]);

  // Listen for profile updates
  useEffect(() => {
    const profileUpdateListener = DeviceEventEmitter.addListener('PROFILE_IMAGE_UPDATED', () => {
      console.log('📸 Profile image updated, refreshing Profile.jsx');
      fetchSellerData();
    });

    const shopUpdateListener = DeviceEventEmitter.addListener('SHOP_PROFILE_UPDATED', () => {
      console.log('🏪 Shop profile updated, refreshing Profile.jsx');
      fetchSellerData();
    });

    return () => {
      profileUpdateListener.remove();
      shopUpdateListener.remove();
    };
  }, []);

  // Listen for product creation/deletion events to update stats
  useEffect(() => {
    const handleProductChange = () => {
      console.log('🚨 PRODUCT CHANGE EVENT RECEIVED IN PROFILE.JSX!');
      console.log('📦 Current product count before refresh:', sellerStats.products);
      console.log('📦 About to call fetchSellerData()...');
      fetchSellerData();
    };

    const handleProfileUpdate = () => {
      console.log('👤 Profile update event received in Profile, refreshing profile...');
      fetchSellerData();
    };

    const createSubscription = DeviceEventEmitter.addListener('SELLER_PRODUCT_CREATED', handleProductChange);
    const deleteSubscription = DeviceEventEmitter.addListener('SELLER_PRODUCT_DELETED', handleProductChange);
    const profileSubscription = DeviceEventEmitter.addListener('SELLER_PROFILE_UPDATED', handleProfileUpdate);
    
    return () => {
      createSubscription.remove();
      deleteSubscription.remove();
      profileSubscription.remove();
    };
  }, []);

  // Listen for seller order removal events to update stats
  useEffect(() => {
    const handleSellerOrderRemoved = (eventData) => {
      console.log('📊 Seller Profile: Order removed event received:', eventData);
      setSellerStats(prevStats => ({
        ...prevStats,
        orders: eventData.remainingOrders
      }));
    };

    const subscription = DeviceEventEmitter.addListener('SELLER_ORDER_REMOVED', handleSellerOrderRemoved);
    
    return () => {
      subscription.remove();
    };
  }, []);

  // Pull to refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Seller Profile: Pull to refresh triggered');
      
      // Reload seller profile
      const profileResp = await getSellerProfile();
      if (profileResp.success) {
        setSellerProfile(profileResp.profile);
      }
      
      // Reload seller stats
      await fetchSellerStatsFromBackend();
      
      console.log('✅ Seller Profile: Refresh completed');
    } catch (error) {
      console.error('❌ Seller Profile: Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Clear user orders function
  const handleClearOrders = () => {
    Alert.alert(
      'Clear Orders',
      'Are you sure you want to clear all your orders? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Clearing seller orders...');
              const result = await clearUserOrders(user?.id);
              
              if (result.success) {
                Alert.alert('Success', 'All orders cleared successfully!');
                // Refresh stats after clearing orders
                await fetchSellerStatsFromBackend();
              } else {
                Alert.alert('Error', result.error || 'Failed to clear orders');
              }
            } catch (error) {
              console.error('❌ Error clearing orders:', error);
              Alert.alert('Error', 'Failed to clear orders');
            }
          },
        },
      ]
    );
  };

  const fetchSellerStatsFromBackend = async () => {
    try {
      console.log('🚨 FETCHSELLERSTATS CALLED IN PROFILE.JSX!');
      console.log('🔄 Profile.jsx: Fetching seller stats from backend...');
      console.log('🔄 Profile.jsx: Current stats before fetch:', sellerStats);
      
      const token = await require('@react-native-async-storage/async-storage').default.getItem('authToken');
      
      const response = await fetch(`${BASE_URL}/api/seller/stats?t=${Date.now()}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      });
      
      console.log('🔄 Profile.jsx: Stats response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 Profile.jsx: Raw stats response:', JSON.stringify(data, null, 2));
        
        if (data.success && data.stats) {
          console.log('✅ Profile.jsx: Stats loaded successfully:', data.stats);
          console.log('📊 Profile.jsx: Setting stats - Products:', data.stats.products, 'Rating:', data.stats.rating);
          
          setSellerStats({
            products: data.stats.products || 0,
            rating: data.stats.rating || 0,
            orders: data.stats.orders || 0,
            revenue: data.stats.revenue || 0
          });
          
          console.log('📊 Profile.jsx: Stats state updated');
        } else {
          console.warn('⚠️ Profile.jsx: Invalid stats response structure:', data);
        }
      } else {
        console.warn('⚠️ Profile.jsx: Stats request failed:', response.status);
        const errorText = await response.text();
        console.warn('⚠️ Profile.jsx: Error response:', errorText);
        // Keep default stats
        setSellerStats({
          products: 0,
          rating: 0
        });
      }
    } catch (error) {
      console.error('❌ Profile.jsx: Error fetching stats:', error);
      // Keep default stats on error
      setSellerStats({
        products: 0,
        rating: 0
      });
    }
  };

  const fetchSellerData = async () => {
    try {
      setIsLoading(true);
      
      console.log('🚨 FETCHSELLERDATA CALLED IN PROFILE.JSX!');
      console.log('🔄 Profile.jsx: Using simple user profile API like buyer...');
      
      // Use the same simple API as buyer profile (which works!)
      const token = await require('@react-native-async-storage/async-storage').default.getItem('authToken');
      
      const response = await fetch(`${BASE_URL}/api/user/profile`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log('✅ Profile.jsx: Response received:', response.status);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Profile.jsx: Profile data loaded successfully');
      console.log('🔍 Profile.jsx: Available data:', {
        seller_profile: data.user?.seller_profile,
        shopLogo: data.user?.seller_profile?.shopLogo,
        profileImage: data.user?.seller_profile?.profileImage
      });
      
      if (data.success && data.user) {
        setSellerProfile(data.user);
        
        // Fetch real stats from backend
        await fetchSellerStatsFromBackend();
      }
    } catch (error) {
      console.error('❌ Profile.jsx: Error fetching seller data:', error);
      
      // Show a more user-friendly error message
      Alert.alert(
        'Connection Error', 
        'Unable to load profile data. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: fetchSellerData },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: async () => {
            try {
              // Clear auth; App.tsx will render AuthNavigator automatically
              await logout();
            } catch (error) {
              console.error('Seller logout error:', error);
              Alert.alert(
                'Logout Error', 
                'Failed to logout completely. Please try again.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
    }
  };

  const handleDeletedModalClose = () => {
    setShowDeletedModal(false);
    // Logout and redirect to login after showing success
    logout();
  };

  const performDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      console.log('🗑️ Starting comprehensive account deletion process...');
      
      const result = await deleteUserAccount();
      console.log('✅ Account deletion result:', result);
      
      // Success - close delete modal and show success modal
      setShowDeleteModal(false);
      setIsDeleting(false);
      setShowDeletedModal(true);
      
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      setIsDeleting(false);
      setShowDeleteModal(false);
      
      Alert.alert(
        "❌ Deletion Error",
        `Failed to completely delete account: ${error.message}\n\n` +
        "Some data may still remain in the system. Please contact support if needed.",
        [{ text: "OK" }]
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#FF8B47" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8B47" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8B47" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF8B47']}
            tintColor="#FF8B47"
            title="Pull to refresh"
            titleColor="#FF8B47"
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.headerBackground} />
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {(() => {
                const shopProfileImageUri = getShopProfileImageUri(sellerProfile);
                return shopProfileImageUri ? (
                  <Image
                    source={{ uri: shopProfileImageUri }}
                    style={styles.avatar}
                    resizeMode="cover"
                    onLoad={() => {
                      console.log('📸 SHOP PROFILE AVATAR LOADED SUCCESSFULLY:', shopProfileImageUri);
                    }}
                    onError={(error) => {
                      console.error('❌ SHOP PROFILE AVATAR LOAD FAILED:', error.nativeEvent.error);
                      console.error('❌ Attempted URI:', shopProfileImageUri);
                    }}
                  />
                ) : (
                  <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFE6D7' }]}>
                    <Icon name="storefront" size={36} color="#FF8B47" />
                  </View>
                );
              })()}
              <View style={styles.sellerBadge}>
                <Icon name="storefront" size={16} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.name}>
              {user?.fullName || sellerProfile?.fullName || 'Loading...'}
            </Text>
            <Text style={styles.email}>
              {user?.email || sellerProfile?.email || 'Loading...'}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber} numberOfLines={1}>{sellerStats.products}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber} numberOfLines={1}>{sellerStats.rating || '0.0'}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Rating</Text>
          </View>
        </View>


        {/* Account Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.menuContainer}>
            <View style={styles.infoItem}>
              <View style={styles.menuIconContainer}>
                <Icon name="calendar-outline" size={22} color="#FF8B47" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Account Created</Text>
                <Text style={styles.infoValue}>
                  {sellerProfile?.created_at ? 
                    new Date(sellerProfile.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Loading...'
                  }
                </Text>
                <Text style={styles.infoSubValue}>
                  {sellerProfile?.created_at ? 
                    `${new Date(sellerProfile.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })} • ${getTimeSinceCreation(sellerProfile.created_at)}` : ''
                  }
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.menuIconContainer}>
                <Icon name="time-outline" size={22} color="#FF8B47" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>
                  {sellerProfile?.updated_at ? 
                    new Date(sellerProfile.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Loading...'
                  }
                </Text>
                <Text style={styles.infoSubValue}>
                  {sellerProfile?.updated_at ? 
                    new Date(sellerProfile.updated_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) : ''
                  }
                </Text>
              </View>
            </View>

            <View style={[styles.infoItem, { borderBottomWidth: 0 }]}>
              <View style={styles.menuIconContainer}>
                <Icon name="shield-checkmark-outline" size={22} color="#FF8B47" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Account Status</Text>
                <Text style={[styles.infoValue, { color: '#4CAF50', fontWeight: '600' }]}>
                  Active Seller
                </Text>
                <Text style={styles.infoSubValue}>
                  Verified • {sellerProfile?.role || 'seller'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Store Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Management</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("ProfileEdit")}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="person-outline" size={22} color="#FF8B47" />
              </View>
              <Text style={styles.menuText}>Edit Profile</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("EditProfileInfo")}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="storefront-outline" size={22} color="#FF8B47" />
              </View>
              <Text style={styles.menuText}>Edit Shop Info</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.deleteItem]}
              onPress={handleDeleteAccount}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="trash-outline" size={22} color="#FF3B30" />
              </View>
              <Text style={[styles.menuText, styles.deleteText]}>Delete Account</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Developer Tools Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer Tools</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                console.log('🎯 Navigating to ARViewer from seller profile...');
                try {
                  // Navigate to parent navigator first, then to ARViewer
                  const parent = navigation.getParent();
                  if (parent) {
                    console.log('📊 Parent navigator found, navigating to ARViewer...');
                    parent.navigate("ARViewer", {
                      productId: 'test-product',
                      productName: 'Test 3D Model',
                      modelUrl: 'https://res.cloudinary.com/dv53n5nav/raw/upload/v1760825452/ar_models/kiri_model_1760825443969.glb',
                      scanData: {
                        glbUrl: 'https://res.cloudinary.com/dv53n5nav/raw/upload/v1760825452/ar_models/kiri_model_1760825443969.glb',
                        cloudinaryUrl: 'https://res.cloudinary.com/dv53n5nav/raw/upload/v1760825452/ar_models/kiri_model_1760825443969.glb',
                        success: true,
                        scanId: 'test-scan-id',
                        status: 'completed'
                      },
                      fromKiriScanner: true
                    });
                    console.log('✅ Navigation to ARViewer successful');
                  } else {
                    console.log('❌ No parent navigator found');
                    Alert.alert('Navigation Error', 'Cannot access AR Viewer from this screen');
                  }
                } catch (error) {
                  console.error('❌ Navigation error:', error);
                  Alert.alert('Navigation Error', `Failed to navigate to AR Viewer: ${error.message}`);
                }
              }}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="cube-outline" size={22} color="#FF8B47" />
              </View>
              <Text style={styles.menuText}>Test AR Viewer</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Analytics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("Analytics")}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="analytics-outline" size={22} color="#FF8B47" />
              </View>
              <Text style={styles.menuText}>Sales Analytics</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("Reports")}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="bar-chart-outline" size={22} color="#FF8B47" />
              </View>
              <Text style={styles.menuText}>Reports</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("Customers")}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="people-outline" size={22} color="#FF8B47" />
              </View>
              <Text style={styles.menuText}>Customers</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleClearOrders}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="trash-outline" size={22} color="#FF3B30" />
              </View>
              <Text style={[styles.menuText, { color: '#FF3B30' }]}>Clear Orders</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("StoreSettings")}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="storefront-outline" size={22} color="#FF8B47" />
              </View>
              <Text style={styles.menuText}>Store Settings</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("Notifications")}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="notifications-outline" size={22} color="#FF8B47" />
              </View>
              <Text style={styles.menuText}>Notifications</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowServerConnection(true)}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="server-outline" size={22} color="#FF8B47" />
              </View>
              <Text style={styles.menuText}>Server Connection</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="log-out-outline" size={22} color="#FF3B30" />
              </View>
              <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Seller Dashboard v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={performDeleteAccount}
        loading={isDeleting}
      />

      <ServerConnection
        visible={showServerConnection}
        onClose={() => setShowServerConnection(false)}
        onServerChanged={(serverUrl) => {
          console.log('🌐 Seller server changed to:', serverUrl);
          // Optionally refresh seller data or show success message
        }}
      />

      <AccountDeletedModal
        visible={showDeletedModal}
        onClose={handleDeletedModalClose}
      />
    </SafeAreaView>
  );
}