import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { startTripoImageToModel } from '../api/tripoApi';

const TripoScanner = ({ route, navigation }) => {
  const { productId, productName, onScanComplete, isTemporary } = route.params || {};

  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  console.log('🎬 TripoScanner opened with params:', { 
    productId, 
    productName, 
    isTemporary,
    hasProductId: !!productId 
  });

  // Handle image selection from camera
  const handleTakePhoto = async () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      saveToPhotos: false,
      cameraType: 'back',
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        console.error('Camera Error:', response.errorMessage);
        Alert.alert('Error', 'Failed to open camera');
      } else if (response.assets && response.assets[0]) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  // Handle image selection from gallery
  const handleSelectFromGallery = async () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      selectionLimit: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.error('Image Picker Error:', response.errorMessage);
        Alert.alert('Error', 'Failed to open gallery');
      } else if (response.assets && response.assets[0]) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  // Start TRIPO 3D model generation
  const handleStartGeneration = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select or capture an image first');
      return;
    }

    // For NEW products (isTemporary=true), we don't need productId yet
    // For EXISTING products (edit mode), we need productId
    if (!isTemporary && !productId) {
      Alert.alert('Error', 'Product ID is missing for existing product');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('🚀 Starting TRIPO 3D generation...');
      console.log('📋 Mode:', isTemporary ? 'NEW product (no ID yet)' : 'EXISTING product');
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Start TRIPO image-to-model task
      // Pass productId only if available (existing products), otherwise pass null
      const result = await startTripoImageToModel({
        productId: productId || null, // null for new products
        imageUri: selectedImage.uri,
        fileName: selectedImage.fileName || 'product_image.jpg',
        fileType: selectedImage.type || 'image/jpeg',
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('✅ TRIPO task started:', result);
      console.log('🎯 Task ID:', result.task_id);

      // Emit event for UploadItem to listen
      // This stores the AR data temporarily until product is created
      DeviceEventEmitter.emit('TRIPO_SCAN_COMPLETE', {
        success: true,
        productId: productId || null, // null for new products
        productName,
        taskId: result.task_id,
        scanData: {
          task_id: result.task_id,
          status: 'processing',
          source: 'tripo',
          timestamp: Date.now(),
          isTemporary: isTemporary || false,
        },
      });

      // Show success message
      Alert.alert(
        '3D Model Generation Started! 🎉',
        `Your ${productName || 'product'} is being converted to a professional 3D model using TRIPO AI!\n\n🎯 Processing in progress\n📱 This will take a few minutes\n✅ ${isTemporary ? 'Complete your product details and click Create to save' : 'Your product will be updated when ready'}`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onScanComplete) {
                onScanComplete(result);
              }
              navigation.goBack();
            },
          },
        ]
      );

    } catch (error) {
      console.error('❌ TRIPO generation error:', error);
      
      Alert.alert(
        'Generation Failed',
        error.message || 'Failed to start 3D model generation. Please try again.',
        [{ text: 'OK' }]
      );

      // Emit failure event
      DeviceEventEmitter.emit('TRIPO_SCAN_COMPLETE', {
        success: false,
        productId: productId || null,
        error: error.message,
      });

    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>TRIPO 3D Scanner</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Icon name="information-circle" size={32} color="#FF8B47" />
          <Text style={styles.instructionsTitle}>Create 3D Model from Image</Text>
          <Text style={styles.instructionsText}>
            Take or select a clear photo of your product. TRIPO AI will convert it into a stunning 3D model!
          </Text>
        </View>

        {/* Image Preview */}
        {selectedImage ? (
          <View style={styles.previewContainer}>
            <Text style={styles.sectionTitle}>Selected Image</Text>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setSelectedImage(null)}
            >
              <Icon name="close-circle" size={24} color="#FF3B30" />
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Icon name="image-outline" size={80} color="#CCCCCC" />
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}

        {/* Action Buttons */}
        {!isUploading && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleTakePhoto}
            >
              <Icon name="camera" size={32} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.galleryButton]}
              onPress={handleSelectFromGallery}
            >
              <Icon name="images" size={32} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Generate Button */}
        {selectedImage && !isUploading && (
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleStartGeneration}
          >
            <Icon name="cube" size={24} color="#FFFFFF" />
            <Text style={styles.generateButtonText}>Generate 3D Model</Text>
          </TouchableOpacity>
        )}

        {/* Loading State */}
        {isUploading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF8B47" />
            <Text style={styles.loadingText}>
              Starting 3D generation...
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>📸 Tips for Best Results:</Text>
          <Text style={styles.tipText}>• Use good lighting</Text>
          <Text style={styles.tipText}>• Capture the entire product</Text>
          <Text style={styles.tipText}>• Avoid shadows and reflections</Text>
          <Text style={styles.tipText}>• Use a plain background</Text>
          <Text style={styles.tipText}>• Keep the product in focus</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  previewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  removeButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 6,
  },
  placeholderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 12,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#FF8B47',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  galleryButton: {
    backgroundColor: '#4A90E2',
    shadowColor: '#4A90E2',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  generateButton: {
    backgroundColor: '#34C759',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF8B47',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8B47',
  },
  tipsCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8B47',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default TripoScanner;
