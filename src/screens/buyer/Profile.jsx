import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Image,
  DeviceEventEmitter,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from "react-native-vector-icons/Ionicons";
import CustomAlert from "../../components/CustomAlert";
import AccountDeletedModal from "../../components/AccountDeletedModal";
import DeleteAccountModal from "../../components/DeleteAccountModal";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useLikes } from "../../context/LikesContext";
import styles from "./styles/Profile.style";
import { useIsFocused } from "@react-navigation/native";
import { getUserProfile, getUserStats, deleteUserAccount } from "../../api/userApi";
import { BASE_URL } from "../../api/api";

export default function Profile({ navigation }) {
  const { logout, user } = useAuth();
  const isFocused = useIsFocused();
  const [profile, setProfile] = useState(null);
  const [userStats, setUserStats] = useState({
    orders: 0,
    favorites: 0,
    reviews: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { clearCart } = useCart();
  const { removeFromLikes } = useLikes();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showDeleteAccountAlert, setShowDeleteAccountAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showAccountDeletedModal, setShowAccountDeletedModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleLogout = () => {
    console.log('🚪 Logout button pressed');
    setShowLogoutAlert(true);
  };

  const confirmLogout = async () => {
    console.log('🚪 Logout confirmed by user');
    setShowLogoutAlert(false);
    try {
      console.log('🚪 Starting logout process...');
      
      // Call the logout function from AuthContext (clears auth state and AsyncStorage)
      console.log('🔐 Calling AuthContext logout...');
      const result = await logout();
      console.log('🔐 Logout result:', result);
      
      console.log('✅ Logout completed successfully - app should navigate to auth');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      console.error('❌ Error details:', error.message);
      
      setShowErrorAlert(true);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        // Load profile data
        const profileResp = await getUserProfile();
        setProfile(profileResp.user);
        
        // Load user stats
        setIsLoadingStats(true);
        const statsResp = await getUserStats();
        if (statsResp.success) {
          setUserStats(statsResp.stats);
        }
      } catch (e) {
        console.error('Error loading profile data:', e);
        // Set default stats on error
        setUserStats({ orders: 0, favorites: 0, reviews: 0 });
      } finally {
        setIsLoadingStats(false);
      }
    };
    if (isFocused) load();
  }, [isFocused]);

  // Listen for order removal events to update stats
  useEffect(() => {
    const handleOrderRemoved = (eventData) => {
      console.log('📊 Buyer Profile: Order removed event received:', eventData);
      setUserStats(prevStats => ({
        ...prevStats,
        orders: eventData.remainingOrders
      }));
    };

    const subscription = DeviceEventEmitter.addListener('ORDER_REMOVED', handleOrderRemoved);
    
    return () => {
      subscription.remove();
    };
  }, []);

  // Pull to refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Buyer Profile: Pull to refresh triggered');
      
      // Reload profile data
      const profileResp = await getUserProfile();
      if (profileResp.success) {
        setProfile(profileResp.profile);
      }
      
      // Reload stats
      const statsResp = await getUserStats();
      if (statsResp.success) {
        setUserStats(statsResp.stats);
      }
      
      console.log('✅ Buyer Profile: Refresh completed');
    } catch (error) {
      console.error('❌ Buyer Profile: Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Delete account handler
  const handleDeleteAccount = () => {
    console.log('🗑️ Delete account button pressed');
    setShowDeleteAccountAlert(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteAccountAlert(false);
    }
  };

  const performDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      console.log('🗑️ Starting comprehensive account deletion process...');
      
      const result = await deleteUserAccount();
      console.log('✅ Account deletion result:', result);
      
      if (result.success) {
        console.log('✅ Account deleted successfully from server');
        
        // Close delete confirmation modal
        setShowDeleteAccountAlert(false);
        setIsDeleting(false);
        
        // Show custom success modal FIRST (before logout)
        setShowAccountDeletedModal(true);
      } else {
        console.error('❌ Failed to delete account:', result.message);
        setIsDeleting(false);
        setShowDeleteAccountAlert(false);
        Alert.alert('Error', result.message || 'Failed to delete account');
      }
      
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      setIsDeleting(false);
      setShowDeleteAccountAlert(false);
      
      Alert.alert(
        "❌ Deletion Error",
        `Failed to completely delete account: ${error.message}\n\n` +
        "Some data may still remain in the system. Please contact support if needed.",
        [{ text: "OK" }]
      );
    }
  };

  const handleAccountDeletedModalClose = async () => {
    console.log('🗑️ Account deleted modal closed, completing cleanup...');
    
    // Clear local storage - this will clear the auth token and all local data
    console.log('🗑️ Clearing local storage...');
    await AsyncStorage.clear();
    
    // Logout (clears auth state, and contexts will auto-clear due to useEffect watching user)
    await logout();
    
    // Close modal
    setShowAccountDeletedModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8B47" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
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
              {profile?.profileImage ? (
                <Image 
                  source={{ uri: `${BASE_URL}${profile.profileImage}` }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFE6D7' }]}>
                  <Icon name="person" size={36} color="#FF8B47" />
                </View>
              )}
            </View>
            <Text style={styles.name}>{profile?.fullName || user?.fullName || 'User'}</Text>
            <Text style={styles.email}>{profile?.email || user?.email || ''}</Text>
            <Text style={styles.memberSince}>
              {profile?.createdAt
                ? `Member since ${new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                : 'Member'}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {isLoadingStats ? '...' : userStats.orders}
            </Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {isLoadingStats ? '...' : userStats.favorites}
            </Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {isLoadingStats ? '...' : userStats.reviews}
            </Text>
            <Text style={styles.statLabel}>Reviews</Text>
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
                  {profile?.created_at ? 
                    new Date(profile.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Loading...'
                  }
                </Text>
                <Text style={styles.infoSubValue}>
                  {profile?.created_at ? 
                    `${new Date(profile.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })} • ${getTimeSinceCreation(profile.created_at)}` : ''
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
                  {profile?.updated_at ? 
                    new Date(profile.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Loading...'
                  }
                </Text>
                <Text style={styles.infoSubValue}>
                  {profile?.updated_at ? 
                    new Date(profile.updated_at).toLocaleTimeString('en-US', {
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
                  Active Buyer
                </Text>
                <Text style={styles.infoSubValue}>
                  Verified • {profile?.role || 'buyer'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="person-outline" size={22} color="#FF8B47" />
              </View>
              <Text style={styles.menuText}>Edit Profile</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.deleteAccountItem]}
              onPress={() => {
                console.log('🗑️ Delete Account button pressed - DEBUG');
                handleDeleteAccount();
              }}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="trash-outline" size={22} color="#FF3B30" />
              </View>
              <Text style={[styles.menuText, styles.deleteAccountText]}>Delete Account</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("Help")}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="help-circle-outline" size={22} color="#FF8B47" />
              </View>
              <Text style={styles.menuText}>Help Center</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("Contact")}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="mail-outline" size={22} color="#FF8B47" />
              </View>
              <Text style={styles.menuText}>Contact Us</Text>
              <Icon name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("About")}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="information-circle-outline" size={22} color="#FF8B47" />
              </View>
              <Text style={styles.menuText}>About</Text>
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
              onPress={() => navigation.navigate("Notifications")}
            >
              <View style={styles.menuIconContainer}>
                <Icon name="notifications-outline" size={22} color="#FF8B47" />
              </View>
              <Text style={styles.menuText}>Notifications</Text>
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
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      <CustomAlert
        visible={showLogoutAlert}
        title="Logout"
        message="Are you sure you want to logout?"
        type="warning"
        onClose={() => setShowLogoutAlert(false)}
        onConfirm={confirmLogout}
      />

      <CustomAlert
        visible={showErrorAlert}
        title="Logout Error"
        message="Failed to logout completely. Please try again."
        type="error"
        onClose={() => setShowErrorAlert(false)}
      />

      <DeleteAccountModal
        visible={showDeleteAccountAlert}
        onClose={handleCloseDeleteModal}
        onConfirm={performDeleteAccount}
        loading={isDeleting}
      />

      <AccountDeletedModal
        visible={showAccountDeletedModal}
        onClose={handleAccountDeletedModalClose}
      />
    </SafeAreaView>
  );
}
