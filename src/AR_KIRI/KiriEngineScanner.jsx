import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  Animated,
  DeviceEventEmitter,
  Platform,
  PermissionsAndroid,
  BackHandler,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera } from 'react-native-image-picker';
import { kiriEngineApi } from '../api/kiriEngineApi';
import CustomCamera from './CustomCamera';
import PollingModal from '../components/PollingModal';
import styles from './styles/KiriEngineScanner.style';

export default function KiriEngineScanner({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { productId, productName } = route.params || {};
  
  // Debug logging
  console.log('🎯 KiriEngineScanner component loaded');
  console.log('📋 Route params:', { productId, productName });
  console.log('🧭 Navigation object:', navigation);
  
  // Camera and scanning states
  const [cameraPermission, setCameraPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningPhase, setScanningPhase] = useState('setup'); // setup, scanning, processing, complete
  const [capturedImages, setCapturedImages] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  
  // Polling modal states
  const [showPollingModal, setShowPollingModal] = useState(false);
  const [pollingProgress, setPollingProgress] = useState(null);
  const [isCancelled, setIsCancelled] = useState(false);
  
  // How to Scan modal state
  const [showHowToScanModal, setShowHowToScanModal] = useState(false);
  
  // Manual capture removed - auto-capture only
  
  // Animation refs
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Photo capture instructions for object scanning (Photo Scan + No 3DGS + Featureless - 30 photos)
  const photoInstructions = [
    // Essential 360° coverage (4 angles) - Core angles for 3D reconstruction
    { angle: 'Front View', description: 'Place object in center, capture straight on', icon: 'camera-outline' },
    { angle: 'Right Side', description: 'Move 45° to the right', icon: 'arrow-forward-outline' },
    { angle: 'Back View', description: 'Move to the back of the object', icon: 'arrow-back-outline' },
    { angle: 'Left Side', description: 'Move 45° to the left', icon: 'arrow-back-outline' },
    
    // Upper angles (4 shots) - Important for 3D depth
    { angle: 'Top-Front', description: 'Capture from above, front angle', icon: 'arrow-up-outline' },
    { angle: 'Top-Right', description: 'Capture from above, right angle', icon: 'arrow-up-outline' },
    { angle: 'Top-Back', description: 'Capture from above, back angle', icon: 'arrow-up-outline' },
    { angle: 'Top-Left', description: 'Capture from above, left angle', icon: 'arrow-up-outline' },
    
    // Lower angles (4 shots) - Important for base geometry
    { angle: 'Low-Front', description: 'Capture from below, front angle', icon: 'arrow-down-outline' },
    { angle: 'Low-Right', description: 'Capture from below, right angle', icon: 'arrow-down-outline' },
    { angle: 'Low-Back', description: 'Capture from below, back angle', icon: 'arrow-down-outline' },
    { angle: 'Low-Left', description: 'Capture from below, left angle', icon: 'arrow-down-outline' },
    
    // Additional angles for better coverage (9 shots) - Enhanced 3D reconstruction
    { angle: 'Front-Left', description: 'Capture from front-left diagonal', icon: 'arrow-forward-outline' },
    { angle: 'Front-Right', description: 'Capture from front-right diagonal', icon: 'arrow-forward-outline' },
    { angle: 'Back-Left', description: 'Capture from back-left diagonal', icon: 'arrow-back-outline' },
    { angle: 'Back-Right', description: 'Capture from back-right diagonal', icon: 'arrow-back-outline' },
    { angle: 'Mid-Height-Front', description: 'Capture at mid-height, front view', icon: 'camera-outline' },
    { angle: 'Mid-Height-Right', description: 'Capture at mid-height, right view', icon: 'arrow-forward-outline' },
    { angle: 'Mid-Height-Back', description: 'Capture at mid-height, back view', icon: 'arrow-back-outline' },
    { angle: 'Mid-Height-Left', description: 'Capture at mid-height, left view', icon: 'arrow-back-outline' },
    { angle: 'Close-Up', description: 'Capture close-up detail shot', icon: 'camera-outline' }
  ];

  useEffect(() => {
    checkCameraPermission();
    
    // Hide bottom navigation
    const unsubscribe = navigation.addListener('focus', () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' }
      });
    });

    return () => {
      // Restore bottom navigation
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
      unsubscribe();
    };
  }, [navigation]);

  // Camera initialization removed - auto-capture only

  const checkCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (hasPermission) {
          setCameraPermission(true);
          return;
        }

        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
          title: 'Camera Permission Required',
          message: 'KIRI Engine needs camera access to capture photos for 3D scanning.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });

        setCameraPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn('Camera permission error:', err);
        setCameraPermission(false);
      }
    } else {
      setCameraPermission(true);
    }
  };

  const navigateToAutoCapture = () => {
    try {
      console.log('🚀 Navigating to AutoCaptureScanner...');
      console.log('📋 Route params:', { productId, productName });
      
      navigation.navigate('AutoCaptureScanner', {
        productId: productId || 'default-product',
        productName: productName || 'Product'
      });
    } catch (error) {
      console.error('❌ Navigation error:', error);
      Alert.alert(
        'Navigation Error',
        'Failed to open auto-capture scanner. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const startKiriScan = async () => {
    console.log('🚀 startKiriScan called');
    console.log('📷 Camera permission:', cameraPermission);
    
    if (!cameraPermission) {
      console.log('❌ Camera permission not granted');
      Alert.alert('Camera Permission Required', 'Please grant camera permission to start 3D scanning.');
      return;
    }

    console.log('✅ Camera permission granted, navigating to auto-capture');
    // Go directly to auto-capture
    navigateToAutoCapture();
  };

  const startGuidedPhotoCapture = async () => {
    setScanningPhase('scanning');
    setCapturedImages([]);
    setCurrentPhotoIndex(0);
    setScanProgress(0);
    
    // Start the photo capture sequence
    captureNextPhoto();
  };

  const captureNextPhoto = async () => {
    if (currentPhotoIndex >= photoInstructions.length) {
      // All photos captured, process with KIRI Engine
      processWithKiriEngine(capturedImages);
      return;
    }

    const currentInstruction = photoInstructions[currentPhotoIndex];
    
    Alert.alert(
      `Photo ${currentPhotoIndex + 1} of ${photoInstructions.length}`,
      `${currentInstruction.angle}\n\n${currentInstruction.description}\n\nTap OK to open camera`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setScanningPhase('setup') },
        { text: 'Take Photo', onPress: () => launchCameraForPhoto() }
      ]
    );
  };

  const launchCameraForPhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      cameraType: 'back',
      presentationStyle: 'fullScreen',
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('📷 User cancelled photo capture');
        return;
      }

      if (response.errorMessage) {
        console.error('📷 Camera error:', response.errorMessage);
        Alert.alert('Camera Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const newImage = {
          uri: response.assets[0].uri,
          angle: photoInstructions[currentPhotoIndex]?.angle,
          timestamp: Date.now(),
          photoNumber: currentPhotoIndex + 1
        };

        const newImages = [...capturedImages, newImage];
        setCapturedImages(newImages);
        
        const newIndex = currentPhotoIndex + 1;
        setCurrentPhotoIndex(newIndex);
        setScanProgress((newIndex / photoInstructions.length) * 100);

        console.log(`✅ Photo ${newIndex}/${photoInstructions.length} captured: ${newImage.angle}`);

        // Automatically capture next photo after a short delay
        setTimeout(() => {
          captureNextPhoto();
        }, 1000);
      }
    });
  };

  // Manual capture removed - auto-capture only

  const processWithKiriEngine = async (images) => {
    try {
      console.log('🚀 Starting KIRI Engine processing...');
      setScanningPhase('processing');
      
      // Force modal to show immediately
      setShowPollingModal(true);
      setIsCancelled(false);
      
      // Set initial progress immediately
      const initialProgress = {
        isPolling: true,
        attempts: 0,
        maxAttempts: 60,
        message: 'Starting 3D model generation...',
        status: 'processing',
        canCancel: true
      };
      setPollingProgress(initialProgress);
      
      console.log('📊 Polling modal should be visible now');
      console.log('📊 Initial progress set:', initialProgress);
      
      // Force a re-render to ensure modal shows
      setTimeout(() => {
        console.log('🔍 Forcing modal visibility update...');
        setShowPollingModal(true);
        setPollingProgress({
          ...initialProgress,
          message: 'Initializing 3D model generation...'
        });
      }, 100);
      
      // Test modal visibility with a timeout
      setTimeout(() => {
        console.log('🔍 Modal state check after 1 second:', { showPollingModal, pollingProgress });
      }, 1000);
      
      // Start processing animation
      Animated.loop(
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Upload images to KIRI Engine API with progress callbacks
      const scanResult = await kiriEngineApi.createScan(
        images.map(img => img.uri || img),
        productName || 'Product',
        'photogrammetry', // Best for detailed objects
        (progress) => {
          // Progress callback - update polling modal
          console.log('📊 Processing progress:', progress);
          setPollingProgress(progress);
        },
        () => {
          // Cancel callback - user wants to stop
          console.log('🛑 User cancelled processing');
          setIsCancelled(true);
          return true;
        }
      );

      console.log('✅ KIRI Engine scan completed:', scanResult);
      
      // Stop animation and hide modal
      scanAnimation.stopAnimation();
      setShowPollingModal(false);
      
      setScanningPhase('complete');
      
      // Show appropriate completion message based on scan type
      showCompletionAlert(scanResult);
      
    } catch (error) {
      console.error('❌ KIRI Engine processing error:', error);
      scanAnimation.stopAnimation();
      setShowPollingModal(false);
      setScanningPhase('setup');
      
      // Check if this is a photo quality issue (Status 3)
      if (error.message.includes('Status 3') || error.message.includes('photo quality')) {
        Alert.alert(
          '📸 Photo Quality Issue - Credit Used',
          `KIRI Engine couldn't process your photos due to quality issues. 1 credit has been consumed.\n\n🔍 Common causes:\n• Blurry or out-of-focus photos\n• Poor lighting conditions\n• Reflective surfaces\n• Moving objects during capture\n• Insufficient feature overlap\n\n💡 Would you like to try again with better photos?`,
          [
            { 
              text: 'Photo Tips', 
              onPress: () => showPhotoTips() 
            },
            { 
              text: 'Try Again', 
              onPress: () => startKiriScan() 
            },
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => navigation.goBack() 
            }
          ]
        );
      } else if (error.message.includes('Circuit breaker') || error.message.includes('overloaded')) {
        Alert.alert(
          '🚨 KIRI Engine Servers Overloaded',
          `KIRI Engine servers are currently experiencing high traffic and are overloaded.\n\n⏰ This is a temporary issue that usually resolves within a few minutes.\n\n💡 Suggestions:\n• Wait 5-10 minutes and try again\n• Try during off-peak hours\n• Check KIRI Engine status page\n\nYour credit has not been consumed.`,
          [
            { 
              text: 'Try Again Later', 
              onPress: () => navigation.goBack(),
              style: 'default'
            },
            { 
              text: 'Retry Now', 
              onPress: () => startKiriScan(),
              style: 'cancel'
            }
          ]
        );
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        Alert.alert(
          '⏰ KIRI Engine Timeout',
          `KIRI Engine processing took too long and timed out.\n\nThis can happen when:\n• Servers are overloaded\n• Your photos need more processing time\n• Network connection is slow\n\n💡 Your credit has not been consumed.`,
          [
            { 
              text: 'Try Again', 
              onPress: () => startKiriScan() 
            },
            { 
              text: 'Cancel', 
              onPress: () => navigation.goBack() 
            }
          ]
        );
      } else {
        Alert.alert(
          '❌ KIRI Engine Error',
          `KIRI Engine encountered an error: ${error.message}\n\nPlease check your internet connection and try again.`,
          [
            { text: 'Retry', onPress: () => startKiriScan() },
            { text: 'Cancel', onPress: () => navigation.goBack() }
          ]
        );
      }
    }
  };

  const showCompletionAlert = (scanResult) => {
    // 🎯 NEW: Check if auto-launch AR is enabled
    if (scanResult.autoLaunchAR && scanResult.arModelPath) {
      console.log('🎯 Auto-launching AR viewer with extracted model...');
      
      // Save scan data first
      DeviceEventEmitter.emit('KIRI_SCAN_COMPLETE', {
        scanData: {
          ...scanResult,
          images: capturedImages,
          timestamp: Date.now(),
          scanType: 'kiri_photo_scan_no_3dgs_featureless'
        },
        productId,
        productName
      });
      
      // Auto-launch AR viewer
      setTimeout(() => {
        try {
          navigation.navigate('ARViewer', {
            productId: productId,
            productName: productName,
            modelUrl: scanResult.cloudinaryUrl || scanResult.glbUrl,
            modelPath: scanResult.arModelPath,
            scanData: scanResult,
            fromKiriScanner: true,
            autoLaunched: true
          });
        } catch (error) {
          console.error('❌ Failed to auto-launch AR viewer:', error);
          // Fallback to manual selection
          showManualCompletionAlert(scanResult);
        }
      }, 1000);
      
      return;
    }
    
    // Manual completion alert
    showManualCompletionAlert(scanResult);
  };

  const showManualCompletionAlert = (scanResult) => {
    Alert.alert(
      '🎉 KIRI Engine Success!',
      `Your ${productName || 'product'} has been successfully converted to a professional 3D model using KIRI Engine!\n\n📊 Scan Details:\n• ${capturedImages.length} photos processed\n• Real GLB model generated from your photos\n• File size: ${scanResult.fileSize}\n• Quality: ${scanResult.quality}\n• Processing time: ${scanResult.processingTime}\n• Credits used: 1\n• Engine: Photo Scan (No 3DGS, Featureless)\n\n🌟 This is a professional AR model created from your actual photos!\n\nWould you like to preview your 3D model now?`,
      [
        { 
          text: 'Save & Exit', 
          style: 'cancel',
          onPress: () => {
            // Emit completion event with scan data
            DeviceEventEmitter.emit('KIRI_SCAN_COMPLETE', {
              scanData: {
                ...scanResult,
                images: capturedImages,
                timestamp: Date.now(),
                scanType: 'kiri_photo_scan_no_3dgs_featureless'
              },
              productId,
              productName
            });
            navigation.goBack();
          }
        },
        { 
          text: 'Preview 3D Model', 
          onPress: () => {
            console.log('🎯 ===== KIRI ENGINE PREVIEW 3D MODEL BUTTON PRESSED =====');
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
            console.log('📊 Captured images count:', capturedImages.length);
            
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
            console.log('📊 Has ARViewer route:', hasARViewer);
            console.log('📊 All available routes:', availableRoutes);
            
            // Save scan data first
            console.log('📊 Emitting KIRI_SCAN_COMPLETE event...');
            DeviceEventEmitter.emit('KIRI_SCAN_COMPLETE', {
              scanData: {
                ...scanResult,
                images: capturedImages,
                timestamp: Date.now(),
                scanType: 'kiri_photo_scan_no_3dgs_featureless'
              },
              productId,
              productName
            });
            console.log('✅ KIRI_SCAN_COMPLETE event emitted');
            
            // Navigate to AR viewer
            console.log('🎯 ===== STARTING NAVIGATION TO ARVIEWER =====');
            setTimeout(() => {
              try {
                const navigationParams = {
                  productId: productId,
                  productName: productName,
                  modelUrl: scanResult.cloudinaryUrl || scanResult.glbUrl,
                  modelPath: scanResult.arModelPath,
                  scanData: scanResult,
                  fromKiriScanner: true
                };
                
                console.log('📊 Navigation params being sent:', JSON.stringify(navigationParams, null, 2));
                console.log('📊 Model URL being passed:', navigationParams.modelUrl);
                console.log('📊 Scan data being passed:', navigationParams.scanData);
                
                console.log('🎯 Calling navigation.navigate("ARViewer", params)...');
                const navResult = navigation.navigate('ARViewer', navigationParams);
                console.log('✅ Navigation result:', navResult);
                console.log('✅ Navigation to ARViewer completed successfully!');
                
                // Wait a moment then check if navigation worked
                setTimeout(() => {
                  console.log('📊 Post-navigation state:', JSON.stringify(navigation.getState(), null, 2));
                  console.log('📊 Current route after navigation:', navigation.getState()?.routes?.[navigation.getState()?.index]?.name);
                }, 1000);
                
              } catch (error) {
                console.error('❌ ===== NAVIGATION ERROR =====');
                console.error('❌ Error type:', typeof error);
                console.error('❌ Error message:', error.message);
                console.error('❌ Error stack:', error.stack);
                console.error('❌ Error details:', JSON.stringify(error, null, 2));
                
                // Try to get more info about the error
                console.error('❌ Navigation state during error:', JSON.stringify(navigation.getState(), null, 2));
                console.error('❌ Available routes during error:', navigation.getState()?.routes?.map(r => r.name));
                
                Alert.alert(
                  'Navigation Error', 
                  `Failed to open AR viewer.\n\nError: ${error.message}\n\nCheck console for details.`
                );
              }
            }, 500);
          }
        }
      ]
    );
  };

  const showPhotoTips = () => {
    Alert.alert(
      '📸 Photo Quality Tips',
      `For best KIRI Engine results:\n\n✅ LIGHTING:\n• Use natural daylight when possible\n• Avoid harsh shadows\n• Ensure even lighting on all sides\n\n✅ CAMERA TECHNIQUE:\n• Keep camera steady (use both hands)\n• Focus on the object before taking photo\n• Take photos from slightly different angles\n\n✅ OBJECT PREPARATION:\n• Place on non-reflective surface\n• Ensure object stays completely still\n• Avoid transparent or very shiny objects\n\n✅ PHOTO COMPOSITION:\n• Keep object centered in frame\n• Fill 60-80% of the frame with object\n• Ensure good overlap between photos`,
      [{ text: 'Got it!', style: 'default' }]
    );
  };

  // Manual capture functions removed - auto-capture only

  // Back handler removed - auto-capture only

  if (!cameraPermission) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        
        <View style={styles.permissionContainer}>
          <Icon name="camera-outline" size={80} color="#FF8B47" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            KIRI Engine needs camera access to capture photos for 3D scanning. Please grant camera permission to continue.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={checkCameraPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>KIRI Engine Scanner</Text>
          <Text style={styles.headerSubtitle}>{productName || 'Product'}</Text>
        </View>
        <TouchableOpacity style={styles.helpButton} onPress={() => setShowHowToScanModal(true)}>
          <Icon name="help-circle-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Guided Camera View */}
      {/* Manual capture removed - auto-capture only */}

      {/* Setup Screen */}
      {scanningPhase === 'setup' && (
        <View style={styles.setupContainer}>
          <View style={styles.setupContent}>
            <View style={styles.kiriLogo}>
              <Icon name="cube-outline" size={80} color="#FF8B47" />
              <Text style={styles.kiriTitle}>KIRI Engine</Text>
              <Text style={styles.kiriSubtitle}>Professional 3D Scanning</Text>
            </View>
            
            <View style={styles.setupInfo}>
              <Text style={styles.setupTitle}>Ready for Auto-Capture 3D Scan</Text>
              <Text style={styles.setupDescription}>
                Smart auto-capture will take 30 photos automatically as you move around your {productName || 'product'}. Just move slowly and let the system do the work!
              </Text>
              
              <View style={styles.featureList}>
                <View style={styles.feature}>
                  <Icon name="camera-outline" size={24} color="#10B981" />
                  <Text style={styles.featureText}>Smart auto-capture technology</Text>
                </View>
                <View style={styles.feature}>
                  <Icon name="cube-outline" size={24} color="#10B981" />
                  <Text style={styles.featureText}>Professional GLB output</Text>
                </View>
                <View style={styles.feature}>
                  <Icon name="flash-outline" size={24} color="#10B981" />
                  <Text style={styles.featureText}>Smart timing & quality</Text>
                </View>
                <View style={styles.feature}>
                  <Icon name="eye-outline" size={24} color="#10B981" />
                  <Text style={styles.featureText}>AR preview ready</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity style={styles.startButton} onPress={startKiriScan}>
              <Icon name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Auto-Capture Scan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Scanning Progress Screen */}
      {scanningPhase === 'scanning' && (
        <View style={styles.scanningContainer}>
          <View style={styles.scanningHeader}>
            <Text style={styles.scanningTitle}>Guided Photo Capture</Text>
            <Text style={styles.scanningSubtitle}>
              Photo {capturedImages.length} of {photoInstructions.length}
            </Text>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${scanProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(scanProgress)}%</Text>
            </View>
          </View>

          {/* Current Photo Instruction */}
          {currentPhotoIndex < photoInstructions.length && (
            <View style={styles.currentInstruction}>
              <Icon name="camera-outline" size={64} color="#FF8B47" />
              <Text style={styles.instructionTitle}>
                {photoInstructions[currentPhotoIndex]?.angle}
              </Text>
              <Text style={styles.instructionDescription}>
                {photoInstructions[currentPhotoIndex]?.description}
              </Text>
            </View>
          )}

          {/* Captured Photos Grid */}
          {capturedImages.length > 0 && (
            <View style={styles.capturedPhotosSection}>
              <Text style={styles.capturedPhotosTitle}>Captured Photos:</Text>
              <View style={styles.photosGrid}>
                {photoInstructions.map((instruction, index) => (
                  <View key={index} style={styles.photoSlot}>
                    {capturedImages[index] ? (
                      <View style={styles.capturedPhotoContainer}>
                        <Icon name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.photoNumber}>{index + 1}</Text>
                      </View>
                    ) : (
                      <View style={styles.emptyPhotoSlot}>
                        <Text style={styles.photoNumber}>{index + 1}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.scanningActions}>
            <TouchableOpacity 
              style={styles.cancelScanButton} 
              onPress={() => setScanningPhase('setup')}
            >
              <Text style={styles.cancelScanButtonText}>Cancel Scan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Processing Screen */}
      {scanningPhase === 'processing' && (
        <View style={styles.processingContainer}>
          <Animated.View 
            style={[
              styles.processingIcon,
              {
                transform: [{
                  rotate: scanAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                }]
              }
            ]}
          >
            <Icon name="cube-outline" size={80} color="#FF8B47" />
          </Animated.View>
          
          <Text style={styles.processingTitle}>Creating 3D Model</Text>
          <Text style={styles.processingDescription}>
            KIRI Engine is processing your {capturedImages.length} photos using advanced photogrammetry algorithms...
          </Text>
          
          <View style={styles.processingSteps}>
            <Text style={styles.processingStep}>✅ Photos uploaded</Text>
            <Text style={styles.processingStep}>🔄 Analyzing geometry</Text>
            <Text style={styles.processingStep}>⏳ Generating 3D mesh</Text>
            <Text style={styles.processingStep}>⏳ Creating GLB file</Text>
          </View>
        </View>
      )}

      {/* Auto-capture only - no manual camera view needed */}
      
      
      {/* How to Scan Modal */}
      <Modal
        visible={showHowToScanModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowHowToScanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How to Scan</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowHowToScanModal(false)}
              >
                <Icon name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* 5 Steps */}
            <View style={styles.stepsContainer}>
              {[
                { step: 1, text: 'Place your object on a clean surface' },
                { step: 2, text: 'Ensure good lighting' },
                { step: 3, text: 'Follow the 8-photo sequence' },
                { step: 4, text: 'Keep the object in frame' },
                { step: 5, text: 'Avoid shadows and reflections' }
              ].map((item, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{item.step}</Text>
                  </View>
                  <Text style={styles.stepText}>{item.text}</Text>
                </View>
              ))}
            </View>

            {/* Close Button */}
            <TouchableOpacity 
              style={styles.gotItButton}
              onPress={() => setShowHowToScanModal(false)}
            >
              <Text style={styles.gotItButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Polling Modal */}
      {console.log('🔍 KiriEngineScanner render - showPollingModal:', showPollingModal, 'pollingProgress:', pollingProgress)}
      <PollingModal
        visible={showPollingModal}
        progress={pollingProgress}
        onCancel={() => {
          console.log('🛑 PollingModal onCancel called');
          setShowPollingModal(false);
          setIsCancelled(true);
        }}
      />
    </View>
  );
}
