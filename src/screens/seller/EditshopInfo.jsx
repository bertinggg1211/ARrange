import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  DeviceEventEmitter,
  Modal,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { getSellerProfile, updateSellerProfile, deleteSellerProfileImage } from '../../api/sellerApi';
import { useAuth } from '../../context/AuthContext';
import ImageCropPicker from 'react-native-image-crop-picker';
import { BASE_URL } from '../../api/api';
import { useIsFocused } from '@react-navigation/native';
import ShopInfoSuccessModal from '../../components/ShopInfoSuccessModal';
import styles from './styles/Editshopinfo.stye';

// No hardcoded images; use icon placeholders in UI

export default function EditProfileInfo({ navigation }) {
  const { updateUser, user } = useAuth();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [imageModalType, setImageModalType] = useState(''); // 'banner' or 'profile'
  const [shopData, setShopData] = useState({
    name: '',
    image: null,
    banner: null,
    description: ''
  });

  useEffect(() => {
    if (isFocused) {
      const load = async () => {
        try {
          setIsLoading(true);
          const resp = await getSellerProfile();
          console.log('Loaded seller profile:', JSON.stringify(resp, null, 2));
          if (resp?.seller) {
            const s = resp.seller;
            
            // Construct image URIs
            const shopLogoUri = s.sellerProfile?.shopLogo 
              ? (s.sellerProfile.shopLogo.startsWith('http') ? s.sellerProfile.shopLogo : `${BASE_URL}${s.sellerProfile.shopLogo}`)
              : null;
            const profileImageUri = s.sellerProfile?.profileImage 
              ? (s.sellerProfile.profileImage.startsWith('http') ? s.sellerProfile.profileImage : `${BASE_URL}${s.sellerProfile.profileImage}`)
              : null;
            const bannerUri = s.sellerProfile?.shopBanner 
              ? (s.sellerProfile.shopBanner.startsWith('http') ? s.sellerProfile.shopBanner : `${BASE_URL}${s.sellerProfile.shopBanner}`)
              : null;
            
            setShopData({
              name: s.shopName || s.sellerProfile?.businessName || '',
              image: shopLogoUri ? { uri: shopLogoUri } : (profileImageUri ? { uri: profileImageUri } : null),
              banner: bannerUri ? { uri: bannerUri } : null,
              description: s.sellerProfile?.businessDescription || ''
            });
          }
        } catch (e) {
          console.error('Error loading profile:', e);
        } finally {
          setIsLoading(false);
        }
      };
      load();
    }
  }, [isFocused]);
  
  // Handle text input changes
  const handleChange = (field, value) => {
    console.log(`Field changed: ${field} = "${value}"`);
    setShopData({
      ...shopData,
      [field]: value
    });
    console.log('Updated shopData:', { ...shopData, [field]: value });
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };
  
  // Handle save button press
  const handleSave = async () => {
    try {
      setIsLoading(true);
      const payload = {
        shopName: shopData.name,
        sellerProfile: {
          businessName: shopData.name,
          businessDescription: shopData.description,
          // Don't include image fields here - they'll be handled separately as files
        },
      };
      
      // Attach files if the user selected new ones (normalized fields for API)
      if (shopData.image && shopData.image.uri && !shopData.image.uri.startsWith('http')) {
        payload.shopLogo = {
          uri: shopData.image.uri,
          type: shopData.image.type || 'image/jpeg',
          name: shopData.image.name || 'shop-logo.jpg',
        };
      }
      if (shopData.banner && shopData.banner.uri && !shopData.banner.uri.startsWith('http')) {
        payload.shopBanner = {
          uri: shopData.banner.uri,
          type: shopData.banner.type || 'image/jpeg',
          name: shopData.banner.name || 'shop-banner.jpg',
        };
      }
      const resp = await updateSellerProfile(payload);
      // Sync auth user for immediate UI update
      if (resp?.success && resp?.seller && updateUser) {
        await updateUser({
          fullName: resp.seller.fullName,
          address: resp.seller.address,
          phone: resp.seller.phone,
          shopName: resp.seller.shopName,
          sellerProfile: resp.seller.sellerProfile,
          seller_profile: resp.seller.sellerProfile, // Also set snake_case version for consistency
        });
        
        // Update local previews to server URLs to persist through reloads
        const sp = resp.seller.sellerProfile;
        setShopData((prev) => ({
          ...prev,
          name: resp.seller.shopName || prev.name,
          description: sp?.businessDescription || prev.description,
          image: sp?.shopLogo ? { uri: sp.shopLogo.startsWith('http') ? sp.shopLogo : `${BASE_URL}${sp.shopLogo}` } : prev.image,
          banner: sp?.shopBanner ? { uri: sp.shopBanner.startsWith('http') ? sp.shopBanner : `${BASE_URL}${sp.shopBanner}` } : prev.banner,
        }));
      }
      
      DeviceEventEmitter.emit('SELLER_PROFILE_UPDATED');
      DeviceEventEmitter.emit('SHOP_PROFILE_UPDATED');
      DeviceEventEmitter.emit('PROFILE_IMAGE_UPDATED');
      
      // Show custom success modal
      setShowSuccessModal(true);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle image selection with themed modal
  const handleImageSelect = (type) => {
    setImageModalType(type);
    setShowImageModal(true);
  };

  const selectFromGallery = async () => {
    try {
      setShowImageModal(false);
      const isBanner = imageModalType === 'banner';
      const isShopProfile = imageModalType === 'shopProfile';
      
      const result = await ImageCropPicker.openPicker({
        mediaType: 'photo',
        cropping: true,
        cropperCircleOverlay: !isBanner,
        width: isBanner ? 1200 : 600,
        height: isBanner ? 500 : 600,
        compressImageQuality: 0.85,
        forceJpg: true,
        includeBase64: false,
      });
      
      const uri = result?.path;
      if (!uri) return;
      
      const mime = result?.mime || 'image/jpeg';
      const name = (uri.split('/').pop()) || (isBanner ? 'shop-banner.jpg' : 'shop-profile.jpg');
      const normalizedUri = (uri.startsWith('file:') || uri.startsWith('content:')) ? uri : `file://${uri}`;
      
      if (isBanner) {
        setShopData((prev) => ({
          ...prev,
          banner: { uri: normalizedUri, type: mime, name }
        }));
      } else if (isShopProfile) {
        setShopData((prev) => ({
          ...prev,
          image: { uri: normalizedUri, type: mime, name }
        }));
      }
    } catch (e) {
      const msg = String(e?.message || '').toLowerCase();
      if (msg.includes('cancel')) return;
      console.error('Gallery selection error:', e);
      Alert.alert('Error', 'Failed to pick image from gallery.');
    }
  };

  const selectFromCamera = async () => {
    try {
      setShowImageModal(false);
      const isBanner = imageModalType === 'banner';
      const isShopProfile = imageModalType === 'shopProfile';
      
      const result = await ImageCropPicker.openCamera({
        mediaType: 'photo',
        cropping: true,
        cropperCircleOverlay: !isBanner,
        width: isBanner ? 1200 : 600,
        height: isBanner ? 500 : 600,
        compressImageQuality: 0.85,
        forceJpg: true,
        includeBase64: false,
      });
      
      const uri = result?.path;
      if (!uri) return;
      
      const mime = result?.mime || 'image/jpeg';
      const name = (uri.split('/').pop()) || (isBanner ? 'shop-banner.jpg' : 'shop-profile.jpg');
      const normalizedUri = (uri.startsWith('file:') || uri.startsWith('content:')) ? uri : `file://${uri}`;
      
      if (isBanner) {
        setShopData((prev) => ({
          ...prev,
          banner: { uri: normalizedUri, type: mime, name }
        }));
      } else if (isShopProfile) {
        setShopData((prev) => ({
          ...prev,
          image: { uri: normalizedUri, type: mime, name }
        }));
      }
    } catch (e) {
      const msg = String(e?.message || '').toLowerCase();
      if (msg.includes('cancel')) return;
      console.error('Camera selection error:', e);
      Alert.alert('Error', 'Failed to take photo with camera.');
    }
  };

  // Handle image deletion
  const handleImageDelete = async (type) => {
    const imageType = type === 'banner' ? 'Banner' : 'Shop Profile Picture';
    
    Alert.alert(
      `Delete ${imageType}`,
      `Are you sure you want to delete the ${imageType.toLowerCase()}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteImage(type),
        },
      ]
    );
  };

  const deleteImage = async (type) => {
    try {
      setIsLoading(true);
      
      const imageType = type === 'banner' ? 'shopBanner' : 'shopLogo';
      console.log('🗑️ Delete request - Image type:', imageType, 'for type:', type);
      
      // Call API to delete image from server and database
      const result = await deleteSellerProfileImage(imageType);
      console.log('🗑️ Image deleted successfully:', result);

      // Update local state
      if (type === 'banner') {
        setShopData(prev => ({ ...prev, banner: null }));
      } else {
        setShopData(prev => ({ ...prev, image: null }));
      }

      // Update auth context
      if (updateUser && result.seller) {
        await updateUser({
          fullName: result.seller.fullName,
          address: result.seller.address,
          phone: result.seller.phone,
          shopName: result.seller.shopName,
          sellerProfile: result.seller.sellerProfile,
        });
      }

      // Emit events to refresh profile across all screens
      DeviceEventEmitter.emit('SELLER_PROFILE_UPDATED');
      DeviceEventEmitter.emit('SHOP_PROFILE_UPDATED');
      DeviceEventEmitter.emit('PROFILE_IMAGE_UPDATED');

      Alert.alert('Success', `${type === 'banner' ? 'Banner' : 'Shop profile picture'} deleted successfully!`);
    } catch (error) {
      console.error('Error deleting image:', error);
      Alert.alert('Error', error.message || 'Failed to delete image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Shop Information</Text>
        <TouchableOpacity onPress={handleSave} style={[styles.saveButton, isLoading && { opacity: 0.7 }]} disabled={isLoading}>
          <Text style={styles.saveButtonText}>{isLoading ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
 
          {/* Banner Section */}
          <View style={styles.modernImageSection}>
            <View style={styles.modernSectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Icon name="image-outline" size={20} color="#FF8B47" />
                <Text style={styles.modernSectionTitle}>Shop Banner</Text>
              </View>
              {shopData.banner?.uri && (
                <TouchableOpacity 
                  style={styles.modernDeleteButton}
                  onPress={() => handleImageDelete('banner')}
                >
                  <Icon name="trash-outline" size={16} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.modernBannerContainer}
              onPress={() => handleImageSelect('banner')}
              activeOpacity={0.8}
            >
              {shopData.banner?.uri ? (
                <Image 
                  source={{ uri: shopData.banner.uri }} 
                  style={styles.modernBannerImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.modernBannerPlaceholder}>
                  <Icon name="image" size={32} color="#CCCCCC" />
                  <Text style={styles.placeholderText}>Add Shop Banner</Text>
                  <Text style={styles.placeholderSubtext}>Recommended: 1200x400px</Text>
                </View>
              )}
              
              <View style={styles.modernEditOverlay}>
                <View style={styles.editIconContainer}>
                  <Icon name="camera" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.modernEditText}>
                  {shopData.banner?.uri ? 'Change Banner' : 'Add Banner'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Profile Picture Section */}
          <View style={styles.modernImageSection}>
            <View style={styles.modernSectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Icon name="person-circle-outline" size={20} color="#FF8B47" />
                <Text style={styles.modernSectionTitle}>Shop Profile Picture</Text>
              </View>
              {shopData.image?.uri && (
                <TouchableOpacity 
                  style={styles.modernDeleteButton}
                  onPress={() => handleImageDelete('shopProfile')}
                >
                  <Icon name="trash-outline" size={16} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.profilePictureSection}>
              <TouchableOpacity 
                style={styles.modernProfileContainer}
                onPress={() => handleImageSelect('shopProfile')}
                activeOpacity={0.8}
              >
                {shopData.image?.uri ? (
                  <Image 
                    source={{ uri: shopData.image.uri }} 
                    style={styles.modernProfileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.modernProfilePlaceholder}>
                    <Icon name="storefront" size={32} color="#CCCCCC" />
                  </View>
                )}
                
                <View style={styles.modernProfileEditIcon}>
                  <Icon name="camera" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.profileTextSection}>
                <Text style={styles.profileTitle}>Shop Logo</Text>
                <Text style={styles.profileSubtitle}>
                  This will be your shop's profile picture across the platform
                </Text>
                <Text style={styles.profileRecommendation}>Recommended: Square image, 400x400px</Text>
              </View>
            </View>
          </View>
          
          {/* Shop Details Section */}
          <View style={styles.modernFormSection}>
            <View style={styles.modernSectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Icon name="information-circle-outline" size={20} color="#FF8B47" />
                <Text style={styles.modernSectionTitle}>Shop Details</Text>
              </View>
            </View>
            
            <View style={styles.modernInputGroup}>
              <Text style={styles.modernInputLabel}>Shop Name</Text>
              <View style={styles.modernInputContainer}>
                <Icon name="storefront-outline" size={18} color="#FF8B47" style={styles.inputIcon} />
                <TextInput
                  style={styles.modernTextInput}
                  value={shopData.name}
                  onChangeText={(text) => handleChange('name', text)}
                  placeholder="Enter your shop name"
                  placeholderTextColor="#AAAAAA"
                />
              </View>
            </View>
            
            
            <View style={styles.modernInputGroup}>
              <Text style={styles.modernInputLabel}>Shop Description</Text>
              <View style={[styles.modernInputContainer, styles.textAreaContainer]}>
                <Icon name="document-text-outline" size={18} color="#FF8B47" style={[styles.inputIcon, styles.textAreaIcon]} />
                <TextInput
                  style={[styles.modernTextInput, styles.modernTextArea]}
                  value={shopData.description}
                  onChangeText={(text) => handleChange('description', text)}
                  placeholder="Describe your shop and what makes it special..."
                  placeholderTextColor="#AAAAAA"
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
          
          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Selection Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modernModalOverlay}>
          <View style={styles.modernModalContent}>
            <View style={styles.modernModalHeader}>
              <View style={styles.modalTitleSection}>
                <View style={styles.modalIconContainer}>
                  <Icon 
                    name={imageModalType === 'banner' ? 'image' : 'person-circle'} 
                    size={24} 
                    color="#FF8B47" 
                  />
                </View>
                <View>
                  <Text style={styles.modernModalTitle}>
                    {imageModalType === 'banner' ? 'Add Banner Image' : 'Add Shop Profile Picture'}
                  </Text>
                  <Text style={styles.modernModalSubtitle}>
                    {imageModalType === 'banner' 
                      ? 'Choose a banner for your shop profile'
                      : 'Choose your shop logo and profile picture'
                    }
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.modernCloseButton}
                onPress={() => setShowImageModal(false)}
              >
                <Icon name="close" size={20} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modernModalOptions}>
              <TouchableOpacity 
                style={styles.modernModalOption}
                onPress={selectFromGallery}
                activeOpacity={0.7}
              >
                <View style={styles.modernModalOptionIcon}>
                  <Icon name="images" size={24} color="#FF8B47" />
                </View>
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modernModalOptionTitle}>Photo Gallery</Text>
                  <Text style={styles.modernModalOptionDesc}>Choose from your existing photos</Text>
                </View>
                <Icon name="chevron-forward" size={18} color="#CCCCCC" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modernModalOption}
                onPress={selectFromCamera}
                activeOpacity={0.7}
              >
                <View style={styles.modernModalOptionIcon}>
                  <Icon name="camera" size={24} color="#FF8B47" />
                </View>
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modernModalOptionTitle}>Take Photo</Text>
                  <Text style={styles.modernModalOptionDesc}>Capture a new photo with your camera</Text>
                </View>
                <Icon name="chevron-forward" size={18} color="#CCCCCC" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                {imageModalType === 'banner' 
                  ? 'Recommended size: 1200x400 pixels'
                  : 'Recommended size: 400x400 pixels (square)'
                }
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <ShopInfoSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        shopName={shopData.name}
      />
    </View>
  );
}

// Styles are imported from external file