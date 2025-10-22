import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Image,
  Switch,
  DeviceEventEmitter
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { getSellerProfile, updateSellerProfile } from '../../api/sellerApi';
import { BASE_URL } from '../../api/api';
import styles from './styles/ProfileEdit.styles';

export default function ProfileEdit({ navigation }) {
  const { updateUser } = useAuth();
  
  // Basic Profile Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  // Additional Profile Fields
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [socialMedia, setSocialMedia] = useState({
    facebook: "",
    instagram: "",
    twitter: ""
  });
  
  // Business Information
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [taxId, setTaxId] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  
  // Settings & Preferences
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  
  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Modal States - removed image modal states

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const resp = await getSellerProfile();
        const seller = resp.seller;
        const profile = seller?.sellerProfile || {};
        
        console.log('📋 Loading seller profile data:', seller);
        
        // Basic Profile Fields
        setName(seller.fullName || '');
        setEmail(seller.email || '');
        setPhone(seller.phone || '');
        setAddress(seller.address || '');
        
        // Additional Profile Fields
        setDateOfBirth(profile.dateOfBirth || '');
        setGender(profile.gender || '');
        setBio(profile.bio || '');
        setWebsite(profile.website || '');
        setSocialMedia({
          facebook: profile.facebook || '',
          instagram: profile.instagram || '',
          twitter: profile.twitter || ''
        });
        
        // Business Information
        setBusinessName(profile.businessName || '');
        setBusinessType(profile.businessType || '');
        setBusinessDescription(profile.businessDescription || '');
        setTaxId(profile.taxId || '');
        setBusinessAddress(profile.businessAddress || '');
        setBusinessPhone(profile.businessPhone || '');
        setBusinessEmail(profile.businessEmail || '');
        
        // Settings & Preferences
        setIsPublicProfile(profile.isPublicProfile !== false); // Default true
        setAllowMessages(profile.allowMessages !== false); // Default true
        setEmailNotifications(profile.emailNotifications !== false); // Default true
        setPushNotifications(profile.pushNotifications !== false); // Default true
        
        // Profile image handling removed - now handled in EditShopInfo.jsx
        
      } catch (e) {
        console.error('❌ Error loading profile:', e);
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Avatar state debugging removed

  // Permission handling removed - no longer needed for profile images

  // Avatar-related functions removed - profile images now handled in EditShopInfo.jsx

  // Simplified validation function - focus on image upload testing
  const validateProfile = () => {
    const errors = [];
    
    // Only require name for testing
    if (!name.trim()) errors.push('Full name is required');
    
    // Optional validations (only if fields have content)
    if (website.trim()) {
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlRegex.test(website)) {
        errors.push('Please enter a valid website URL');
      }
    }
    
    console.log('📝 Validation check - Name:', name.trim() ? '✅' : '❌');
    
    return errors;
  };

  const handleSave = async () => {
    const validationErrors = validateProfile();
    
    if (validationErrors.length > 0) {
      Alert.alert(
        'Validation Error', 
        `Please fix the following issues:\n\n• ${validationErrors.join('\n• ')}`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    try {
      setLoading(true);
      console.log('💾 Saving comprehensive profile data...');
      
      const payload = {
        // Basic profile data
        fullName: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        
        // Seller profile nested data
        sellerProfile: {
          dateOfBirth: dateOfBirth.trim(),
          gender: gender.trim(),
          bio: bio.trim(),
          website: website.trim(),
          facebook: socialMedia.facebook.trim(),
          instagram: socialMedia.instagram.trim(),
          twitter: socialMedia.twitter.trim(),
          businessName: businessName.trim(),
          businessType: businessType.trim(),
          businessDescription: businessDescription.trim(),
          taxId: taxId.trim(),
          businessAddress: businessAddress.trim(),
          businessPhone: businessPhone.trim(),
          businessEmail: businessEmail.trim(),
          isPublicProfile,
          allowMessages,
          emailNotifications,
          pushNotifications,
          updatedAt: new Date().toISOString()
        }
      };
      
      // Avatar handling removed - profile images now handled in EditShopInfo.jsx
      
      console.log('📦 Profile update payload:', {
        basicFields: Object.keys(payload).filter(k => k !== 'sellerProfile'),
        profileFields: Object.keys(payload.sellerProfile || {})
      });
      
      const resp = await updateSellerProfile(payload);
      console.log('✅ Profile updated successfully:', resp);
      console.log('📸 RESPONSE PROFILE IMAGE:', resp?.seller?.sellerProfile?.profileImage);
      
      if (resp?.seller && updateUser) {
        await updateUser({ 
          fullName: resp.seller.fullName, 
          phone: resp.seller.phone, 
          address: resp.seller.address
        });
        
        // Avatar handling removed - profile images now handled in EditShopInfo.jsx
      } else {
        console.log('❌ NO SELLER DATA IN RESPONSE');
      }
      
      // Emit profile update event
      DeviceEventEmitter.emit('SELLER_PROFILE_UPDATED', {
        seller: resp.seller
      });
      
      // Profile refresh removed - no longer needed for avatar handling
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => setIsEditing(false) }
      ]);
      
      setHasChanges(false);
      
    } catch (e) {
      console.error('❌ Profile update error:', e);
      Alert.alert(
        'Update Failed', 
        `Failed to update profile: ${e.message || 'Unknown error'}\n\nPlease check your connection and try again.`,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8B47" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Orange Background */}
        <View style={styles.header}>
          <View style={styles.headerBackground} />
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.profileSection}>
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.subtitle}>Update your personal information</Text>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputContainer, isEditing && styles.inputContainerActive]}>
                <View style={styles.inputIconContainer}>
                  <Icon name="person-outline" size={20} color="#FF8B47" />
                </View>
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full Name"
                  editable={isEditing}
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputContainer, isEditing && styles.inputContainerActive]}>
                <View style={styles.inputIconContainer}>
                  <Icon name="mail-outline" size={20} color="#FF8B47" />
                </View>
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email Address"
                  keyboardType="email-address"
                  editable={isEditing}
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputContainer, isEditing && styles.inputContainerActive]}>
                <View style={styles.inputIconContainer}>
                  <Icon name="call-outline" size={20} color="#FF8B47" />
                </View>
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  editable={isEditing}
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer, isEditing && styles.inputContainerActive]}>
                <View style={styles.inputIconContainer}>
                  <Icon name="location-outline" size={20} color="#FF8B47" />
                </View>
                <TextInput
                  style={[styles.input, styles.textArea, !isEditing && styles.inputDisabled]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Address"
                  multiline
                  numberOfLines={3}
                  editable={isEditing}
                  placeholderTextColor="#999"
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {isEditing ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.button, styles.editButton]}
                onPress={() => setIsEditing(true)}
              >
                <Icon name="create-outline" size={20} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Image modals removed - profile images now handled in EditShopInfo.jsx */}
    </SafeAreaView>
  );
}