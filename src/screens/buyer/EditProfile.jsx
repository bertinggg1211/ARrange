import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  StatusBar,
  Image 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import ImageCropPicker from 'react-native-image-crop-picker';
import { BASE_URL } from '../../api/api';
import CustomAlert from '../../components/CustomAlert';
import styles from "./styles/EditProfile.style";
import { getUserProfile, updateUserProfile } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';


export default function EditProfile({ navigation }) {
  const { updateUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [originalAvatar, setOriginalAvatar] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await getUserProfile();
        const u = resp.user;
        setName(u.fullName || '');
        setEmail(u.email || '');
        setPhone(u.phone || '');
        setAddress(u.address || '');
        const avatarData = u.profileImage ? { uri: `${BASE_URL}${u.profileImage}` } : null;
        setAvatar(avatarData);
        setOriginalAvatar(avatarData);
      } catch (e) {
        // ignore for now
      }
    };
    load();
  }, []);

  const showAlert = (title, message, type = 'success') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const hideAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImageCropPicker.openPicker({
        mediaType: 'photo',
        cropping: true,
        cropperCircleOverlay: true,
        width: 600,
        height: 600,
        compressImageQuality: 0.85,
        forceJpg: true,
      });
      const uri = result?.path;
      if (!uri) return;
      const mime = result?.mime || 'image/jpeg';
      const name = (uri.split('/').pop()) || 'avatar.jpg';
      const normalizedUri = (uri.startsWith('file:') || uri.startsWith('content:')) ? uri : `file://${uri}`;
      setAvatar({ uri: normalizedUri, type: mime, name });
    } catch (e) {
      const msg = String(e?.message || '').toLowerCase();
      if (msg.includes('cancel')) return;
      showAlert('Error', 'Failed to pick image from gallery.', 'error');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImageCropPicker.openCamera({
        mediaType: 'photo',
        cropping: true,
        cropperCircleOverlay: true,
        width: 600,
        height: 600,
        compressImageQuality: 0.85,
        forceJpg: true,
      });
      const uri = result?.path;
      if (!uri) return;
      const mime = result?.mime || 'image/jpeg';
      const name = (uri.split('/').pop()) || 'avatar.jpg';
      const normalizedUri = (uri.startsWith('file:') || uri.startsWith('content:')) ? uri : `file://${uri}`;
      setAvatar({ uri: normalizedUri, type: mime, name });
    } catch (e) {
      const msg = String(e?.message || '').toLowerCase();
      if (msg.includes('cancel')) return;
      showAlert('Error', 'Failed to capture photo from camera.', 'error');
    }
  };

  const handleAvatarSelect = () => {
    Alert.alert(
      "Change Profile Picture",
      "Choose how you'd like to update your profile picture",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Gallery", onPress: pickFromGallery }
      ]
    );
  };

  const handleSave = async () => {
    // Validate inputs
    if (!name.trim() || !email.trim() || !phone.trim()) {
      showAlert('Error', 'Please fill in all required fields', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Error', 'Please enter a valid email address', 'error');
      return;
    }

    // Phone validation
    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(phone)) {
      showAlert('Error', 'Please enter a valid 11-digit phone number', 'error');
      return;
    }

    try {
      const payload = { fullName: name, phone, address };
      
      // Include avatar if it's a new upload (not an existing http URL)
      if (avatar && avatar.uri && !avatar.uri.startsWith('http')) {
        payload.avatar = avatar;
      }
      
      const resp = await updateUserProfile(payload);
      if (resp?.user && updateUser) {
        await updateUser({ 
          fullName: resp.user.fullName, 
          phone: resp.user.phone, 
          address: resp.user.address,
          profileImage: resp.user.profileImage 
        });
        // Update local avatar to server URL
        if (resp.user.profileImage) {
          const newAvatarData = { uri: `${BASE_URL}${resp.user.profileImage}?t=${Date.now()}` };
          setAvatar(newAvatarData);
          setOriginalAvatar(newAvatarData);
        }
      }
      showAlert('Success', 'Profile updated successfully', 'success');
      setIsEditing(false);
    } catch (e) {
      showAlert('Error', e.message || 'Failed to update profile', 'error');
    }
  };

  const handleCancel = () => {
    // Reset avatar to original if user cancels
    setAvatar(originalAvatar);
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
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={isEditing ? handleAvatarSelect : null} disabled={!isEditing}>
                {avatar?.uri ? (
                  <Image source={{ uri: avatar.uri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFE6D7' }]}>
                    <Icon name="person" size={28} color="#FF8B47" />
                  </View>
                )}
              </TouchableOpacity>
              {isEditing && (
                <TouchableOpacity style={styles.editAvatarButton} onPress={handleAvatarSelect}>
                  <Icon name="camera" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
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

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}

//const [phone, setPhone] = useState("09123456789");