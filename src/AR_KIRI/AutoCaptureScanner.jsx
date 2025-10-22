import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  DeviceEventEmitter,
  Modal,
} from 'react-native';
import { kiriEngineApi } from '../api/kiriEngineApi';
import CustomCamera from './CustomCamera';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const AutoCaptureScanner = ({ navigation, route }) => {
  console.log('🎯 AutoCaptureScanner loaded');
  console.log('📋 Route params:', route.params);
  
  const { productId, productName } = route.params || {};
  const isMountedRef = useRef(true);
  
  const [capturedImages, setCapturedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCustomSuccessModal, setShowCustomSuccessModal] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  // 🎯 STEP 3: Auto-capture settings - KIRI Engine optimized with 30 photos
  const TOTAL_PHOTOS = 30; // Optimized to 30 for faster processing
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Additional safety check for navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      isMountedRef.current = false;
    });

    return unsubscribe;
  }, [navigation]);
  
  // Handle photo captured from CustomCamera
  const handlePhotoCaptured = (photoPath) => {
    if (!isMountedRef.current) return;
    
    console.log(`📸 Auto-captured photo ${capturedImages.length + 1}/${TOTAL_PHOTOS}`);
    
    const newImages = [...capturedImages, {
      uri: photoPath,
      timestamp: Date.now(),
      photoNumber: capturedImages.length + 1
    }];
    
    setCapturedImages(newImages);
    
    // Check if scan is complete
    if (newImages.length >= TOTAL_PHOTOS) {
      processScan(newImages);
    }
  };

  // Handle scan completion from CustomCamera
  const handleScanComplete = (photos) => {
    if (!isMountedRef.current) return;
    
    console.log('🎉 Auto-capture scan completed with', photos.length, 'photos');
    setCapturedImages(photos);
    
    // Only process if we haven't already processed (prevent duplicate processing)
    if (!scanResult) {
      processScan(photos);
    }
  };
  
  const processScan = async (images = capturedImages) => {
    setIsProcessing(true);
    
    try {
      console.log('🚀 Starting KIRI Engine auto-capture processing...');
      console.log(`📸 Processing ${images.length} auto-captured photos...`);
      
      const scanResult = await kiriEngineApi.createScan(
        images.map(img => img.uri || img),
        productName,
        'photogrammetry'
      );
      
      console.log('✅ Auto-capture scan completed:', scanResult);
      
      // Show custom success modal instead of default alert
      setShowCustomSuccessModal(true);
      setScanResult(scanResult);
      
    } catch (error) {
      console.error('❌ Auto-capture processing error:', error);
      Alert.alert(
        '❌ Auto-Capture Failed',
        `Auto-capture processing failed: ${error.message}\n\n🔧 This means the auto-captured photos couldn't be processed by KIRI Engine.\n\nPlease try manual capture or check your internet connection.`,
        [
          { text: 'Try Manual Capture', onPress: () => navigation.navigate('KiriEngineScanner', { productId, productName }) },
          { text: 'Cancel', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };
  
  const stopScanning = () => {
    setIsScanning(false);
    Alert.alert(
      '⏹️ Auto-Capture Stopped',
      `Captured ${capturedImages.length}/${TOTAL_PHOTOS} photos.\n\nWould you like to process the current photos or start over?`,
      [
        { text: 'Start Over', onPress: () => setCapturedImages([]) },
        { text: 'Process Current', onPress: () => processScan() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };
  
  return (
    <>
      <CustomCamera
        navigation={navigation}
        route={route}
        isAutoCapture={true}
        totalPhotos={TOTAL_PHOTOS}
        currentPhoto={capturedImages.length}
        onPhotoCaptured={handlePhotoCaptured}
        onScanComplete={handleScanComplete}
        isProcessing={isProcessing}
      />
      
      {/* Custom Success Modal */}
      <Modal
        visible={showCustomSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successContainer}>
            {/* Header */}
            <View style={styles.successHeader}>
              <View style={styles.successIconContainer}>
                <Icon name="checkmark-circle" size={50} color="#4CAF50" />
              </View>
              <Text style={styles.successTitle}>🎉 3D Model Created!</Text>
              <Text style={styles.successSubtitle}>
                Your {productName || 'product'} has been successfully converted to a 3D model!
              </Text>
            </View>

            {/* Success Details */}
            <View style={styles.successDetails}>
              <View style={styles.successDetailItem}>
                <Icon name="cube" size={20} color="#4CAF50" />
                <Text style={styles.successDetailText}>
                  Real GLB model generated from your photos
                </Text>
              </View>
              <View style={styles.successDetailItem}>
                <Icon name="star" size={20} color="#4CAF50" />
                <Text style={styles.successDetailText}>
                  Quality: {scanResult?.quality || 'High Quality (KIRI Engine)'}
                </Text>
              </View>
              <View style={styles.successDetailItem}>
                <Icon name="eye" size={20} color="#4CAF50" />
                <Text style={styles.successDetailText}>
                  Ready for AR viewing and interaction
                </Text>
              </View>
              {scanResult?.duration && (
                <View style={styles.successDetailItem}>
                  <Icon name="time" size={20} color="#4CAF50" />
                  <Text style={styles.successDetailText}>
                    Processing time: {scanResult.duration}
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            <View style={styles.successDescription}>
              <Text style={styles.successDescriptionText}>
                🎯 This is a real AR model created with KIRI Engine technology! You can now view and interact with it in Augmented Reality.
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.successButtons}>
              <TouchableOpacity
                style={styles.successCancelButton}
                onPress={() => {
                  setShowCustomSuccessModal(false);
                  DeviceEventEmitter.emit('KIRI_SCAN_COMPLETE', { 
                    scanData: scanResult, 
                    productId, 
                    productName,
                    isAutoCapture: true 
                  });
                  navigation.goBack();
                }}
              >
                <Text style={styles.successCancelButtonText}>Save & Exit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.successViewButton}
                onPress={() => {
                  console.log('🎯 ===== AUTO CAPTURE VIEW IN AR BUTTON PRESSED =====');
                  console.log('🎯 Button pressed at:', new Date().toISOString());
                  
                  // Debug navigation state
                  console.log('📊 Current navigation state:', JSON.stringify(navigation.getState(), null, 2));
                  console.log('📊 Available routes:', navigation.getState()?.routes?.map(r => r.name));
                  console.log('📊 Current route name:', navigation.getState()?.routes?.[navigation.getState()?.index]?.name);
                  
                  // Debug scan result data
                  console.log('📊 Scan result data:', JSON.stringify(scanResult, null, 2));
                  console.log('📊 GLB URL:', scanResult?.glbUrl);
                  console.log('📊 Cloudinary URL:', scanResult?.cloudinaryUrl);
                  console.log('📊 Model URL (final):', scanResult?.glbUrl || scanResult?.cloudinaryUrl);
                  console.log('📊 Scan result keys:', Object.keys(scanResult || {}));
                  
                  // Debug product info
                  console.log('📊 Product ID:', productId);
                  console.log('📊 Product Name:', productName);
                  
                  // Debug navigation object
                  console.log('📊 Navigation object:', {
                    canGoBack: navigation.canGoBack(),
                    getParent: !!navigation.getParent(),
                    navigate: typeof navigation.navigate,
                    goBack: typeof navigation.goBack
                  });
                  
                  // Check if ARViewer route exists
                  const availableRoutes = navigation.getState()?.routes?.map(r => r.name) || [];
                  const hasARViewer = availableRoutes.includes('ARViewer');
                  const hasKiriARViewer = availableRoutes.includes('KiriARViewer');
                  console.log('📊 Has ARViewer route:', hasARViewer);
                  console.log('📊 Has KiriARViewer route:', hasKiriARViewer);
                  console.log('📊 All available routes:', availableRoutes);
                  
                  console.log('🎯 ===== STARTING NAVIGATION TEST =====');
                  
                  // Simple navigation test first
                  try {
                    console.log('🧪 Testing simple navigation to KiriARViewer...');
                    console.log('📊 Navigation params:', {
                      productId: productId,
                      productName: productName,
                      arModelUrl: scanResult?.glbUrl || scanResult?.cloudinaryUrl,
                      scanData: scanResult,
                      fromAutoCapture: true
                    });
                    
                    const navResult = navigation.navigate('KiriARViewer', {
                      productId: productId,
                      productName: productName,
                      arModelUrl: scanResult?.glbUrl || scanResult?.cloudinaryUrl,
                      scanData: scanResult,
                      fromAutoCapture: true
                    });
                    
                    console.log('✅ Simple navigation successful:', navResult);
                    console.log('✅ Should see KiriARViewer now');
                    
                    // Wait a moment then check if navigation worked
                    setTimeout(() => {
                      console.log('📊 Post-navigation state:', JSON.stringify(navigation.getState(), null, 2));
                      console.log('📊 Current route after navigation:', navigation.getState()?.routes?.[navigation.getState()?.index]?.name);
                    }, 1000);
                    
                    return;
                  } catch (testError) {
                    console.error('❌ Simple navigation failed:', testError);
                    console.error('❌ Error details:', testError.message, testError.stack);
                  }
                  
                  setShowCustomSuccessModal(false);
                  DeviceEventEmitter.emit('KIRI_SCAN_COMPLETE', { 
                    scanData: scanResult, 
                    productId, 
                    productName,
                    isAutoCapture: true 
                  });
                  setTimeout(() => {
                    try {
                      console.log('🎯 Attempting to navigate to ARViewer with params:', {
                        productId: productId,
                        productName: productName,
                        modelUrl: scanResult?.glbUrl || scanResult?.cloudinaryUrl,
                        modelPath: scanResult?.arModelPath,
                        scanData: scanResult,
                        fromAutoCapture: true
                      });
                      
                      // Debug navigation state
                      console.log('🔍 Current navigation state:', navigation.getState());
                      console.log('🔍 Available routes:', navigation.getState()?.routes?.map(r => r.name));
                      console.log('🔍 Current route:', navigation.getState()?.routes?.[navigation.getState()?.index]?.name);
                      
                      // Try different navigation approaches
                      try {
                        console.log('🚀 Attempting navigation to ARViewer...');
                        console.log('📊 Navigation params:', {
                          productId,
                          productName,
                          modelUrl: scanResult?.glbUrl || scanResult?.cloudinaryUrl,
                          scanData: scanResult
                        });
                        
                        // First try: Direct navigation
                        console.log('🎯 About to call navigation.navigate("KiriARViewer")');
                        const navResult = navigation.navigate('KiriARViewer', {
                          productId: productId,
                          productName: productName,
                          arModelUrl: scanResult?.glbUrl || scanResult?.cloudinaryUrl,
                          scanData: scanResult,
                          fromAutoCapture: true
                        });
                        console.log('🎯 Navigation result:', navResult);
                        
                        console.log('✅ Direct navigation to KiriARViewer completed');
                      } catch (navError) {
                        console.log('⚠️ Direct navigation failed, trying parent navigation:', navError);
                        // Second try: Parent navigation
                        const parent = navigation.getParent();
                        if (parent) {
                          console.log('🔄 Trying parent navigation...');
                          parent.navigate('KiriARViewer', {
                            productId: productId,
                            productName: productName,
                            arModelUrl: scanResult?.glbUrl || scanResult?.cloudinaryUrl,
                            scanData: scanResult,
                            fromAutoCapture: true
                          });
                          console.log('✅ Parent navigation to KiriARViewer completed');
                        } else {
                          throw new Error('No parent navigation available');
                        }
                      }
                      
                      console.log('✅ Navigation to ARViewer successful');
                    } catch (error) {
                      console.error('❌ Failed to navigate to AR viewer:', error);
                      Alert.alert('Error', 'Failed to open AR viewer. Please try again.');
                    }
                  }, 500);
                }}
              >
                <Icon name="eye" size={20} color="white" />
                <Text style={styles.successViewButtonText}>View in AR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
  },
  instruction: {
    color: 'white',
    fontSize: 14,
    marginVertical: 2,
    textAlign: 'center',
  },
  movementIndicator: {
    alignItems: 'center',
    marginVertical: 10,
  },
  movementText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    alignItems: 'center',
    marginBottom: 50,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  processingContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  counterText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  // New styles for the updated UI
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  placeholder: {
    width: 60, // Same width as back button for centering
  },
  progressSection: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressPercent: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  instructionsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    marginVertical: 2,
    textAlign: 'left',
  },
  controls: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    width: '100%',
    alignItems: 'center',
  },
  stopButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewSection: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  previewTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  successIconContainer: {
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  successDetails: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    backgroundColor: '#F8F9FA',
  },
  successDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  successDetailText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 12,
    flex: 1,
  },
  successDescription: {
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  successDescriptionText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 24,
    textAlign: 'center',
  },
  successButtons: {
    flexDirection: 'row',
    paddingHorizontal: 30,
    paddingBottom: 30,
    gap: 15,
  },
  successCancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  successViewButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successViewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default AutoCaptureScanner;
