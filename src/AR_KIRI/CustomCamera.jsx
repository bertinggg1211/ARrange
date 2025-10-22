import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  BackHandler,
  StatusBar,
  Platform,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Modal,
  DeviceEventEmitter,
} from 'react-native';
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const CustomCamera = ({ 
  navigation, 
  route, 
  onPhotoCaptured, 
  isAutoCapture = false,
  totalPhotos: propTotalPhotos,
  currentPhoto = 0,
  onScanComplete,
  isARMode = false,
  modelUrl,
  modelPath,
  productName: propProductName
}) => {
  console.log('📸 CustomCamera loaded with Vision Camera');
  console.log('📋 Route params:', route?.params);
  
  const { productId, productName } = route?.params || {};
  const cameraRef = useRef(null);
  const isMountedRef = useRef(true);
  
  // Vision Camera setup
  const devices = useCameraDevices();
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraReady, setCameraReady] = useState(false);
  const [deviceReady, setDeviceReady] = useState(false);
  
  
  // Find back camera with comprehensive detection
  let device = null;
  
  // Method 1: Direct access
  if (devices?.back) {
    device = devices.back;
    console.log('✅ Found device via devices.back');
  }
  // Method 2: Array access
  else if (devices?.devices && Array.isArray(devices.devices)) {
    device = devices.devices.find(d => d.position === 'back');
    console.log('✅ Found device via devices.devices array');
  }
  // Method 3: Object iteration
  else if (devices && typeof devices === 'object') {
    const deviceKeys = Object.keys(devices);
    console.log('🔍 Device keys to check:', deviceKeys);
    
    for (const key of deviceKeys) {
      const deviceObj = devices[key];
      if (deviceObj && typeof deviceObj === 'object' && deviceObj.position === 'back') {
        device = deviceObj;
        console.log('✅ Found device via key:', key);
        break;
      }
    }
  }
  
  console.log('📷 Final device:', device);
  console.log('📷 Device id:', device?.id);
  
  // Camera states
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [autoCaptureActive, setAutoCaptureActive] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showPhotoSelectionModal, setShowPhotoSelectionModal] = useState(false);
  const [showPhotoProcessingModal, setShowPhotoProcessingModal] = useState(false);
  const [showPhotoSuccessModal, setShowPhotoSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadingPhotosCount, setUploadingPhotosCount] = useState(0);
  const [showKiriModal, setShowKiriModal] = useState(false);
  const [kiriPhotosCount, setKiriPhotosCount] = useState(0);
  const [showKiriLoadingModal, setShowKiriLoadingModal] = useState(false);
  const [showKiriSuccessModal, setShowKiriSuccessModal] = useState(false);
  const [kiriEngineStatus, setKiriEngineStatus] = useState(0); // 0: not started, 1: uploading, 2: processing, 3: completed
  const [kiriEngineMessage, setKiriEngineMessage] = useState('');
  const [scanResult, setScanResult] = useState(null);
  
  // Handle KIRI Engine status changes
  useEffect(() => {
    if (kiriEngineStatus === 3) { // Completed
      setShowKiriLoadingModal(false);
      setShowKiriSuccessModal(true);
    }
  }, [kiriEngineStatus]);
  
  
  // 🎯 STEP 3: Configuration - KIRI Engine optimized with 30 photos
  const totalPhotos = propTotalPhotos || (isAutoCapture ? 30 : 1); // Optimized to 30 for faster processing
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const countdownAnimation = useRef(new Animated.Value(1)).current;
  
  // Initialize Vision Camera
  useEffect(() => {
    console.log('📸 Initializing Vision Camera...');
    console.log('📷 Device available:', !!device);
    console.log('📷 Permission:', hasPermission);
    console.log('📷 Camera ready:', cameraReady);
    console.log('📷 Device ready:', deviceReady);
    
    // Hide bottom navigation
    const unsubscribe = navigation.addListener('focus', () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' }
      });
    });
    
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Restore bottom navigation
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
      navigation.goBack();
      return true;
    });
    
    // Request permission if needed
    if (!hasPermission) {
      console.log('📷 Requesting camera permission...');
      requestPermission().then((granted) => {
        console.log('📷 Permission result:', granted);
      });
    }
    
    // Set device ready when device is found
    if (device && hasPermission) {
      console.log('📷 Device and permission ready, setting device ready');
      setDeviceReady(true);
      
      // Initialize camera after a short delay
      setTimeout(() => {
        console.log('📷 Setting camera ready');
        setCameraReady(true);
      }, 1000);
    }
    
    return () => {
      isMountedRef.current = false;
      backHandler.remove();
      unsubscribe();
      // Restore bottom navigation when leaving
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    };
  }, [navigation, device, hasPermission, requestPermission]);
  
  // 🎯 STEP 2: Enhanced auto-capture with stabilization and motion detection
  useEffect(() => {
    if (autoCaptureActive && capturedPhotos.length < totalPhotos) {
      // 🎯 STEP 2: Extended countdown for stabilization (2.5 seconds)
      setCaptureCountdown(3);
      
      const countdownInterval = setInterval(() => {
        setCaptureCountdown(prev => {
          console.log('⏰ Stabilization countdown:', prev);
          if (prev <= 1) {
            console.log('⏰ Stabilization period complete! Attempting to capture photo...');
            clearInterval(countdownInterval);
            if (isMountedRef.current && autoCaptureActive) {
              console.log('✅ Conditions met, calling capturePhoto() with stabilization');
              // 🎯 STEP 2: Additional 500ms delay for final stabilization
              setTimeout(() => {
                capturePhoto();
              }, 500); // Extended delay for motion stabilization
            } else {
              console.log('❌ Conditions not met:', {
                mounted: isMountedRef.current,
                autoCapture: autoCaptureActive
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    }
  }, [autoCaptureActive, capturedPhotos.length, totalPhotos]);
  
  // Update progress
  useEffect(() => {
    const progress = (capturedPhotos.length / totalPhotos) * 100;
    setScanProgress(progress);
  }, [capturedPhotos.length, totalPhotos]);
  
  const capturePhoto = async () => {
    console.log('🎯 Capture photo called');
    console.log('🎯 Camera ref:', !!cameraRef.current);
    console.log('🎯 Is capturing:', isCapturing);
    console.log('🎯 Is mounted:', isMountedRef.current);
    console.log('🎯 Device available:', !!device);
    console.log('🎯 Camera ready:', cameraReady);
    console.log('🎯 Has permission:', hasPermission);
    
    if (!cameraRef.current) {
      console.log('❌ Camera ref not available');
      Alert.alert('Camera Error', 'Camera is not ready. Please wait a moment and try again.');
      return;
    }
    
    if (isCapturing) {
      console.log('❌ Already capturing');
      return;
    }
    
    if (!isMountedRef.current) {
      console.log('❌ Component not mounted');
      return;
    }
    
    if (!device) {
      console.log('❌ No camera device');
      Alert.alert('Camera Error', 'No camera device found.');
      return;
    }
    
    if (!cameraReady) {
      console.log('❌ Camera not ready');
      Alert.alert('Camera Error', 'Camera is still initializing. Please wait a moment.');
      return;
    }
    
    if (!hasPermission) {
      console.log('❌ No camera permission');
      Alert.alert('Permission Error', 'Camera permission is required to take photos.');
      return;
    }
    
    try {
      setIsCapturing(true);
      console.log('📸 Capturing photo with Vision Camera...');
      
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality', // Quality over speed
        flash: 'off',
        enableAutoRedEye: false,
        enableAutoStabilization: true, // 🎯 STEP 1: Enable stabilization for sharp photos
        enableShutterSound: false,
        skipMetadata: false, // Keep EXIF data
        quality: 1.0, // Maximum quality (0.0 - 1.0)
        enableHighQualityPhotos: true, // iOS specific high quality
        enableDepthData: false, // Disable depth to focus on RGB
        photoCodec: 'jpeg', // Ensure JPEG format for compatibility
      });
      
      console.log('📸 Photo captured successfully!');
      console.log('📸 Photo path:', photo.path);
      console.log('📸 Photo details:', photo);
      
      // Convert path to proper format for React Native
      const photoUri = Platform.OS === 'android' ? `file://${photo.path}` : photo.path;
      console.log('📸 Photo URI:', photoUri);
      
      if (isMountedRef.current) {
        const newPhotos = [...capturedPhotos, photoUri];
        setCapturedPhotos(newPhotos);
        console.log('📸 Updated photos array length:', newPhotos.length);
        
        // 🎯 AUTO-TRIGGER: If we now have 30 photos via camera capture, automatically start processing
        if (newPhotos.length >= totalPhotos) {
          console.log('🚀 30 photos captured! Auto-triggering KIRI Engine processing...');
          
          // Stop auto capture if it's running
          if (isAutoCapture && autoCaptureActive) {
            stopAutoCapture();
          }
          
          // Show completion alert and auto-trigger processing
          setTimeout(() => {
            Alert.alert(
              '✅ 25 Photos Captured!',
              `Excellent! You've captured all ${newPhotos.length} photos.\n\nStarting automatic 3D model generation...`,
              [
                {
                  text: 'Start Processing',
                  onPress: () => {
                    handleUploadPhotos();
                  }
                }
              ]
            );
          }, 1000); // Small delay to let the UI update
        }
        
        // Notify parent component
        onPhotoCaptured?.(photoUri);
        
        // Show capture success animation
        Animated.sequence([
          Animated.timing(countdownAnimation, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(countdownAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Check if scan is complete
        if (newPhotos.length >= totalPhotos) {
          setAutoCaptureActive(false);
          scanAnimation.stopAnimation();
          console.log(`🎉 Scan complete! Captured ${newPhotos.length} photos`);
          
          // Navigate to PhotoViewer for review
          console.log('🔄 Navigating to PhotoViewer with photos...');
          navigation.navigate('PhotoViewer', {
            photos: newPhotos,
            productId: productId,
            productName: productName,
          });
        }
      }
    } catch (error) {
      console.error('❌ Photo capture error:', error);
      Alert.alert('Capture Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };
  
  const startAutoCapture = () => {
    console.log('🚀 Starting auto-capture...');
    setAutoCaptureActive(true);
    setCapturedPhotos([]);
    setScanProgress(0);
    
    // Start scan animation
    Animated.loop(
      Animated.timing(scanAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };
  
  const stopAutoCapture = () => {
    setAutoCaptureActive(false);
    scanAnimation.stopAnimation();
    
    // Show completion message
    Alert.alert(
      'Scan Stopped',
      `Captured ${capturedPhotos.length} photos. You can continue or review the current photos.`,
      [
        { text: 'Continue', onPress: () => setAutoCaptureActive(true) },
        { 
          text: 'Review Photos', 
          onPress: () => {
            navigation.navigate('PhotoViewer', {
              photos: capturedPhotos,
              productId: productId,
              productName: productName,
            });
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };


  // 📸 Image picker function for selecting photos from gallery
  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      quality: 1.0,
      selectionLimit: totalPhotos - capturedPhotos.length, // Allow selecting remaining photos needed
      includeBase64: false,
      maxWidth: 2048,
      maxHeight: 2048,
    };

    setShowPhotoSelectionModal(true);
  };

  // Handle photo selection from modal
  const handlePhotoSelection = () => {
    // Show loading modal immediately when user presses "Choose Photos"
    setShowPhotoProcessingModal(true);
    setUploadingPhotosCount(0); // Will be updated when photos are selected
    
    const options = {
      mediaType: 'photo',
      quality: 1.0,
      selectionLimit: totalPhotos - capturedPhotos.length,
      includeBase64: false,
      maxWidth: 2048,
      maxHeight: 2048,
    };

    launchImageLibrary(options, (response) => {
      setShowPhotoSelectionModal(false);
      
      if (response.didCancel || response.errorMessage) {
        // Hide processing modal after brief moment even if cancelled
        setTimeout(() => {
          setShowPhotoProcessingModal(false);
        }, 1000);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        // Set the uploading count for the modal
        setUploadingPhotosCount(response.assets.length);
        
        // Process photos immediately (no artificial delay)
        const newPhotos = response.assets.map(asset => asset.uri);
        const updatedPhotos = [...capturedPhotos, ...newPhotos];
        
        setCapturedPhotos(updatedPhotos);
        
        // Calculate upload time based on number of photos (more photos = longer upload time)
        const uploadTime = Math.max(3000, newPhotos.length * 200); // Minimum 3 seconds, +200ms per photo
        
        // Simulate upload process with dynamic duration
        setTimeout(() => {
          setShowPhotoProcessingModal(false);
          
          // Small delay before showing success modal
          setTimeout(() => {
            // 🎯 AUTO-TRIGGER: If we now have 30 photos, automatically start quality checking
            if (updatedPhotos.length >= totalPhotos) {
              // Show custom success modal for 30 photos complete
              setSuccessMessage(`Perfect! You now have ${updatedPhotos.length} photos.\n\nStarting automatic 3D model generation...`);
              setShowPhotoSuccessModal(true);
              
              // Auto-trigger processing after showing success
              setTimeout(() => {
                setShowPhotoSuccessModal(false);
                handleUploadPhotos(updatedPhotos);
              }, 3000);
            } else {
              // Show custom success modal for regular photo addition
              setSuccessMessage(`Great! Added ${newPhotos.length} photos from gallery.\n\nTotal: ${updatedPhotos.length}/${totalPhotos} photos\n\nNeed ${totalPhotos - updatedPhotos.length} more photos to start processing.\n\nTap "Add More Photos" to continue adding photos.`);
              setShowPhotoSuccessModal(true);
              
              // Don't auto-hide if not 30 photos yet - let user press Continue to add more
              // Only auto-hide if user has reached 30 photos
              if (updatedPhotos.length >= totalPhotos) {
                setTimeout(() => {
                  setShowPhotoSuccessModal(false);
                }, 3000);
              }
            }
          }, 300); // Small delay between processing and success
        }, uploadTime); // Dynamic upload time based on photo count
      } else {
        // No photos selected but user hit "done"
        // Hide processing modal after brief moment
        setTimeout(() => {
          setShowPhotoProcessingModal(false);
        }, 1500);
      }
    });
  };

  const handleUploadPhotos = async (photosToProcess = null) => {
    setShowCompletionDialog(false);
    
    
    // Use provided photos or fallback to state
    const photosToUse = photosToProcess || capturedPhotos;
    
    
    if (photosToUse.length === 0) {
      Alert.alert(
        '🔍 No Photos Found',
        `No photos detected for 3D scanning.\n\n💡 Take some photos or select from gallery.`,
        [
          { text: 'Retake Photos', onPress: handleRedoPhotos },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    
    // Show custom KIRI modal
    setKiriPhotosCount(photosToUse.length);
    setShowKiriModal(true);
  };

  const handleRedoPhotos = () => {
    setShowCompletionDialog(false);
    setCapturedPhotos([]);
    setScanProgress(0);
    setCaptureCountdown(0);
    console.log('🔄 Redoing photo capture');
  };

  if (!cameraReady || !device || !deviceReady) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Camera Loading...</Text>
            <Text style={styles.subtitle}>{productName || 'Product'}</Text>
          </View>
          
          <View style={styles.flashButton} />
        </View>
        
        <View style={styles.loadingContainer}>
          <Icon name="camera" size={60} color="rgba(255,255,255,0.7)" />
          <Text style={styles.loadingText}>Initializing Camera...</Text>
          <Text style={styles.loadingSubtext}>
            {!device ? 'Detecting camera device...' : !deviceReady ? 'Preparing camera...' : 'Please wait'}
          </Text>
          
          {/* Fallback button if camera fails to load */}
          <TouchableOpacity 
            style={styles.fallbackButton}
            onPress={() => {
              Alert.alert(
                'Camera Issue',
                'Camera is taking longer than expected to load. Would you like to try using the system camera instead?',
                [
                  { text: 'Wait', style: 'cancel' },
                  { 
                    text: 'Use System Camera', 
                    onPress: () => {
                      // Navigate back and use image picker fallback
                      navigation.goBack();
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.fallbackButtonText}>Having Issues?</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show permission error if no permission
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <View style={styles.errorContainer}>
          <Icon name="camera-off" size={60} color="rgba(255,255,255,0.7)" />
          <Text style={styles.errorText}>Camera permission required</Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // AR Overlay for AR mode
  const renderAROverlay = () => {
    if (!isARMode) return null;
    
    return (
      <View style={styles.arOverlay}>
        {/* 3D Model Placeholder */}
        <View style={[
          styles.modelPlaceholder,
          {
            top: height * 0.3,
            left: width * 0.3,
          }
        ]}>
          <Icon name="cube-outline" size={40} color="#4CAF50" />
          <Text style={styles.modelLabel}>{propProductName || productName || '3D Model'}</Text>
        </View>
        
        {/* AR Instructions - Hidden in AR Mode */}
        {!isARMode && (
        <View style={styles.arInstructions}>
          <Text style={styles.arInstructionText}>
            Point your camera at a flat surface
          </Text>
          <Text style={styles.arInstructionSubtext}>
            Tap to place the 3D model
          </Text>
        </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Vision Camera - Optimized for KIRI Engine Quality */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={cameraReady && hasPermission && !!device}
        photo={true}
        enableZoomGesture={false}
        enableFps={false}
        // Camera Configuration
        format={device?.formats?.find(f => 
          f.photoHeight >= 1080 && 
          f.photoWidth >= 1080 &&
          f.autoFocusSystem === 'contrast-detection'
        )}
        fps={30}
        photoHdr={false} // Disable HDR for consistent lighting
        videoHdr={false}
        lowLightBoost={false} // Disable for consistent exposure
        // 🎯 STEP 1: Enable autofocus for sharp photos
        autoFocus="on"
        onInitialized={() => {
          console.log('📸 Vision Camera initialized successfully');
          console.log('📸 Camera format:', device?.formats?.find(f => 
            f.photoHeight >= 1080 && 
            f.photoWidth >= 1080
          ));
        }}
        onError={(error) => {
          console.error('❌ Vision Camera error:', error);
          Alert.alert('Camera Error', `Camera failed to initialize: ${error.message}`);
        }}
      />
      
      {/* AR Overlay - Only show in AR mode */}
      {isARMode && renderAROverlay()}
      
      {/* Native iPhone-Style Camera UI */}
      <View style={styles.overlay}>
        {console.log('🎨 Rendering native camera UI overlay')}
        
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="close" size={28} color="white" />
          </TouchableOpacity>
          
          <View style={styles.topCenter}>
            <Text style={styles.modeText}>AR Mode</Text>
          </View>
          
          <TouchableOpacity style={styles.flashButton}>
            <Icon name="flash-off" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Center Area - Minimal UI */}
        <View style={styles.centerArea}>
          {/* Progress indicator - minimal */}
          {isAutoCapture && !autoCaptureActive && (
            <View style={[
              styles.progressIndicator,
              capturedPhotos.length >= totalPhotos * 0.8 && styles.progressIndicatorNearComplete
            ]}>
              <Text style={[
                styles.progressText,
                capturedPhotos.length >= totalPhotos && styles.progressTextComplete
              ]}>
                {capturedPhotos.length}/{totalPhotos}
                {capturedPhotos.length >= totalPhotos && ' ✅'}
              </Text>
            </View>
          )}
          
          {/* Countdown Timer - Center and Prominent */}
          {captureCountdown > 0 && autoCaptureActive && (
            <Animated.View 
              style={[
                styles.centerCountdownContainer,
                {
                  transform: [{
                    scale: countdownAnimation
                  }]
                }
              ]}
            >
              <Text style={styles.centerCountdownText}>{captureCountdown}</Text>
              <Text style={styles.centerCountdownLabel}>Next Photo</Text>
            </Animated.View>
          )}
        </View>
        
        {/* Bottom Controls - iPhone Style (Hidden in AR Mode) */}
        {!isARMode && (
        <View style={styles.bottomControls}>
          {/* Camera Mode Tabs */}
          <View style={styles.cameraModes}>
            <Text style={styles.modeTab}>Photo</Text>
            <Text style={[styles.modeTab, styles.activeModeTab]}>AR Mode</Text>
          </View>
          
          {/* Camera Controls */}
          <View style={styles.cameraControls}>
            {/* Gallery/Preview Button */}
            <TouchableOpacity 
              style={styles.galleryButton}
              onPress={() => {
                console.log('🖼️ Gallery button pressed');
                console.log('📊 Current photos:', capturedPhotos.length);
                if (capturedPhotos.length > 0) {
                  Alert.alert(
                    'Photos Captured',
                    `${capturedPhotos.length} photos captured so far.\n\nTarget: 30 photos\nKIRI minimum: 20 photos`,
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert(
                    'No Photos Captured',
                    'No photos captured yet. Please capture some photos before proceeding.',
                    [{ text: 'OK' }]
                  );
                }
              }}
            >
              <View style={styles.galleryPreview}>
                {capturedPhotos.length > 0 ? (
                  <>
                    {/* Latest photo preview */}
                    <Image
                      source={{ uri: capturedPhotos[capturedPhotos.length - 1] }}
                      style={styles.galleryThumbnail}
                      resizeMode="cover"
                    />
                    {/* Photo count badge */}
                    <View style={styles.galleryCountBadge}>
                      <Text style={styles.galleryCountText}>{capturedPhotos.length}</Text>
                    </View>
                  </>
                ) : (
                  <Icon name="images" size={20} color="white" />
                )}
              </View>
            </TouchableOpacity>
            
            {/* Main Capture Button */}
            <TouchableOpacity 
              style={styles.mainCaptureButton}
              onPress={() => {
                console.log('🎯 Capture button pressed!');
                console.log('🎯 isAutoCapture:', isAutoCapture);
                console.log('🎯 autoCaptureActive:', autoCaptureActive);
                
                if (isAutoCapture) {
                  if (autoCaptureActive) {
                    console.log('🎯 Stopping auto capture');
                    stopAutoCapture();
                  } else {
                    console.log('🎯 Starting auto capture');
                    startAutoCapture();
                  }
                } else {
                  console.log('🎯 Manual capture');
                  capturePhoto();
                }
              }}
              disabled={isCapturing}
            >
              <View style={styles.captureButtonOuter}>
                <View style={styles.captureButtonInner}>
                  {isAutoCapture && autoCaptureActive ? (
                    <View style={styles.stopIndicator} />
                  ) : (
                    <View style={styles.captureIndicator} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Image Picker Button */}
            <TouchableOpacity 
              style={styles.switchButton}
              onPress={handleImagePicker}
              disabled={capturedPhotos.length >= totalPhotos}
            >
              <Icon 
                name="folder-open" 
                size={24} 
                color={capturedPhotos.length >= totalPhotos ? "#666" : "white"} 
              />
            </TouchableOpacity>
            
            {/* Switch Camera Button */}
            <TouchableOpacity style={styles.switchButton}>
              <Icon name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        )}
        
        {/* 🎯 STEP 5: Enhanced Instructions with Stabilization Tips - Hidden in AR Mode */}
        {!isARMode && (
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {isAutoCapture 
              ? autoCaptureActive 
                ? captureCountdown <= 1 
                  ? `📸 HOLD STEADY! Capturing in ${captureCountdown}s... (Stabilizing)`
                  : `Move slowly around your ${productName || 'object'}. Stabilizing... ${captureCountdown}s`
                : `Position your ${productName || 'object'} in the frame. We'll capture 30 photos automatically.`
              : 'Position the object in the frame and tap the capture button.'
            }
          </Text>
          {isAutoCapture && autoCaptureActive && (
            <Text style={styles.tipsText}>
              💡 Tip: Keep phone VERY steady during countdown for sharp, blur-free photos
            </Text>
          )}
          {isAutoCapture && !autoCaptureActive && (
            <Text style={styles.tipsText}>
              🎯 Tips: Good lighting • Steady hands • Full object in frame • 30 photos for faster processing
            </Text>
          )}
        </View>
        )}
      </View>

      {/* Completion Dialog with Photo Review */}
      {showCompletionDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>📸 Scan Complete!</Text>
            <Text style={styles.dialogMessage}>
              Successfully captured {capturedPhotos.length} photos.{'\n'}
              Review and remove any blurry photos before uploading.
            </Text>
            
            {/* Photo Review Grid */}
            <ScrollView style={styles.photoGrid} showsVerticalScrollIndicator={false}>
              <View style={styles.photoGridContainer}>
                {capturedPhotos.map((photo, index) => (
                  <View key={index} style={styles.photoGridItem}>
                    <Image 
                      source={{ uri: photo.uri || photo }} 
                      style={styles.photoThumbnail}
                      resizeMode="cover"
                    />
                    <TouchableOpacity 
                      style={styles.deletePhotoButton}
                      onPress={() => {
                        const newPhotos = capturedPhotos.filter((_, i) => i !== index);
                        setCapturedPhotos(newPhotos);
                        if (newPhotos.length < 20) {
                          Alert.alert(
                            'Warning',
                            `Only ${newPhotos.length} photos left. You need at least 20 photos for KIRI Engine.\n\nContinue deleting or tap "Redo Photos" to retake.`
                          );
                        }
                      }}
                    >
                      <Icon name="close-circle" size={24} color="#FF4444" />
                    </TouchableOpacity>
                    <Text style={styles.photoNumber}>{index + 1}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            
            <Text style={styles.photoCountText}>
              {capturedPhotos.length >= 20 ? '✅' : '⚠️'} {capturedPhotos.length} photos (min. 20 required, 25+ optimal)
            </Text>
            
            <View style={styles.dialogButtons}>
              <TouchableOpacity 
                style={[styles.dialogButton, styles.uploadButton, capturedPhotos.length < 20 && styles.disabledButton].filter(Boolean)}
                onPress={handleUploadPhotos}
                disabled={capturedPhotos.length < 20}
              >
                <Text style={styles.uploadButtonText}>
                  {capturedPhotos.length >= 25 ? 'Upload Photos' : 
                   capturedPhotos.length >= 20 ? 'Upload Photos' : 'Need More Photos'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.dialogButton, styles.redoButton]}
                onPress={handleRedoPhotos}
              >
                <Text style={styles.redoButtonText}>Redo All Photos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}


      {/* Modern Photo Selection Modal */}
      <Modal
        visible={showPhotoSelectionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoSelectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Icon name="images" size={32} color="#4CAF50" />
              </View>
              <Text style={styles.modalTitle}>Add Photos</Text>
              <Text style={styles.modalSubtitle}>
                Select up to {totalPhotos - capturedPhotos.length} photos from your gallery
              </Text>
            </View>

            {/* Modal Content */}
            <View style={styles.modalContent}>
              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatNumber}>{capturedPhotos.length}</Text>
                  <Text style={styles.modalStatLabel}>Current</Text>
                </View>
                <View style={styles.modalStatDivider} />
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatNumber}>{totalPhotos}</Text>
                  <Text style={styles.modalStatLabel}>Target</Text>
                </View>
                <View style={styles.modalStatDivider} />
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatNumber}>{totalPhotos - capturedPhotos.length}</Text>
                  <Text style={styles.modalStatLabel}>Remaining</Text>
                </View>
              </View>

              <View style={styles.modalFeatures}>
                <View style={styles.modalFeatureItem}>
                  <Icon name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.modalFeatureText}>High quality photos</Text>
                </View>
                <View style={styles.modalFeatureItem}>
                  <Icon name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.modalFeatureText}>Multiple selection</Text>
                </View>
                <View style={styles.modalFeatureItem}>
                  <Icon name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.modalFeatureText}>Auto processing</Text>
                </View>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowPhotoSelectionModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSelectButton}
                onPress={handlePhotoSelection}
              >
                <Icon name="folder-open" size={20} color="white" />
                <Text style={styles.modalSelectButtonText}>Choose Photos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Processing Loading Modal */}
      <Modal
        visible={showPhotoProcessingModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            
            {/* Processing Icon */}
            <View style={styles.processingIconContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
            </View>
            
            {/* Processing Title */}
            <Text style={styles.processingTitle}>Uploading Photos</Text>
            <Text style={styles.processingSubtitle}>
              {uploadingPhotosCount > 0 
                ? `Uploading ${uploadingPhotosCount} photos to the cloud...`
                : 'Uploading your selected photos to the cloud...'
              }
            </Text>
            
            {/* Progress Steps */}
            <View style={styles.processingSteps}>
              <View style={styles.processingStep}>
                <View style={[styles.processingStepIcon, styles.processingStepCompleted]}>
                  <Icon name="checkmark" size={16} color="white" />
                </View>
                <Text style={styles.processingStepText}>Photos Selected</Text>
              </View>
              
              <View style={styles.processingStepLine} />
              
              <View style={styles.processingStep}>
                <View style={[styles.processingStepIcon, styles.processingStepActive]}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                </View>
                <Text style={styles.processingStepText}>Uploading to Cloud</Text>
              </View>
              
              <View style={styles.processingStepLine} />
              
              <View style={styles.processingStep}>
                <View style={[styles.processingStepIcon, styles.processingStepPending]}>
                  <Icon name="checkmark" size={16} color="#E0E0E0" />
                </View>
                <Text style={[styles.processingStepText, styles.processingStepTextPending]}>Upload Complete</Text>
              </View>
            </View>
            
            {/* Processing Info */}
            <View style={styles.processingInfo}>
              <Text style={styles.processingInfoText}>
                Please wait while your photos are being uploaded to the cloud
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Success Modal */}
      <Modal
        visible={showPhotoSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.successOverlay}>
          <View style={styles.successContainer}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <Icon name="checkmark-circle" size={60} color="#4CAF50" />
            </View>
            
            {/* Success Title */}
            <Text style={styles.successTitle}>Photos Added!</Text>
            <Text style={styles.successMessage}>
              {successMessage}
            </Text>
            
            {/* Success Actions */}
            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.successButton}
                onPress={() => {
                  setShowPhotoSuccessModal(false);
                  
                  // If not 30 photos yet, automatically show photo selection modal again
                  if (capturedPhotos.length < totalPhotos) {
                    setTimeout(() => {
                      setShowPhotoSelectionModal(true);
                    }, 500); // Small delay for smooth transition
                  }
                }}
              >
                <Text style={styles.successButtonText}>
                  {capturedPhotos.length < totalPhotos ? 'Add More Photos' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* KIRI Engine Modal */}
      <Modal
        visible={showKiriModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowKiriModal(false)}
      >
        <View style={styles.kiriOverlay}>
          <View style={styles.kiriContainer}>
            {/* Header */}
            <View style={styles.kiriHeader}>
              <View style={styles.kiriIconContainer}>
                <Icon name="cube" size={40} color="#4CAF50" />
              </View>
              <Text style={styles.kiriTitle}>Ready for 3D Generation!</Text>
              <Text style={styles.kiriSubtitle}>
                Your photos are ready for advanced AI processing
              </Text>
            </View>

            {/* Status Cards */}
            <View style={styles.kiriStatusContainer}>
              <View style={styles.kiriStatusCard}>
                <Icon name="camera" size={24} color="#4CAF50" />
                <View style={styles.kiriStatusInfo}>
                  <Text style={styles.kiriStatusNumber}>{kiriPhotosCount}/30</Text>
                  <Text style={styles.kiriStatusLabel}>Photos Captured</Text>
                </View>
              </View>
              
              <View style={styles.kiriStatusCard}>
                <Icon name="checkmark-circle" size={24} color="#4CAF50" />
                <View style={styles.kiriStatusInfo}>
                  <Text style={styles.kiriStatusNumber}>High</Text>
                  <Text style={styles.kiriStatusLabel}>Quality</Text>
                </View>
              </View>
              
              <View style={styles.kiriStatusCard}>
                <Icon name="sparkles" size={24} color="#4CAF50" />
                <View style={styles.kiriStatusInfo}>
                  <Text style={styles.kiriStatusNumber}>AI</Text>
                  <Text style={styles.kiriStatusLabel}>Processing</Text>
                </View>
              </View>
            </View>

            {/* Description */}
            <View style={styles.kiriDescription}>
              <Text style={styles.kiriDescriptionText}>
                Your photos are now ready for advanced 3D model generation using KIRI Engine's cutting-edge AI technology.
              </Text>
              <Text style={styles.kiriDescriptionSubtext}>
                This will create a photorealistic 3D model that you can view and interact with in Augmented Reality!
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.kiriActions}>
              <TouchableOpacity
                style={styles.kiriCancelButton}
                onPress={() => setShowKiriModal(false)}
              >
                <Text style={styles.kiriCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.kiriGenerateButton}
                onPress={async () => {
                  setShowKiriModal(false);
                  setShowKiriLoadingModal(true);
                  setKiriEngineStatus(1); // Starting upload
                  setKiriEngineMessage('Uploading photos to KIRI Engine...');
                  
                  try {
                    // Import KIRI Engine API
                    const { kiriEngineApi } = await import('../api/kiriEngineApi');
                    
                    console.log('🚀 Starting KIRI Engine processing...');
                    console.log(`📸 Processing ${capturedPhotos.length} photos...`);
                    
                    // Use your actual KIRI Engine logic with status tracking
                    const scanResult = await kiriEngineApi.createScan(
                      capturedPhotos.map(photo => photo.uri || photo),
                      propProductName || productName || '3D Model',
                      'photogrammetry',
                      (progress) => {
                        console.log('📊 KIRI Engine progress callback:', progress);
                        
                        // Update status based on actual KIRI Engine logs
                        if (progress.status === 0 || progress.status === 1) {
                          setKiriEngineStatus(1);
                          setKiriEngineMessage('Uploading photos to KIRI Engine...');
                        } else if (progress.status === 2) {
                          setKiriEngineStatus(2);
                          setKiriEngineMessage('Processing photos...');
                        }
                        // Don't set status 3 here - wait for actual completion
                      }
                    );
                    
                    console.log('✅ KIRI Engine processing completed:', scanResult);
                    
                    // Only trigger success popup when scanResult has success: true and status: 'completed'
                    if (scanResult && scanResult.success === true && scanResult.status === 'completed') {
                      // Store scan result for success popup
                      setScanResult(scanResult);
                      
                      // Update status to completed and trigger success popup
                      setKiriEngineStatus(3);
                      setKiriEngineMessage('3D model completed!');
                    } else {
                      // If not properly completed, show error
                      console.error('❌ KIRI Engine processing did not complete successfully:', scanResult);
                      setShowKiriLoadingModal(false);
                      setKiriEngineStatus(0);
                      Alert.alert(
                        '❌ 3D Model Generation Failed',
                        'KIRI Engine processing did not complete successfully. Please try again.',
                        [
                          { text: 'Try Again', onPress: () => setShowKiriModal(true) },
                          { text: 'Cancel', onPress: () => {} }
                        ]
                      );
                    }
                    
                  } catch (error) {
                    console.error('❌ KIRI Engine processing failed:', error);
                    setShowKiriLoadingModal(false);
                    setKiriEngineStatus(0);
                    Alert.alert(
                      '❌ 3D Model Generation Failed',
                      `KIRI Engine processing failed: ${error.message}\n\nPlease try again or check your internet connection.`,
                      [
                        { text: 'Try Again', onPress: () => setShowKiriModal(true) },
                        { text: 'Cancel', onPress: () => {} }
                      ]
                    );
                  }
                }}
              >
                <Icon name="rocket" size={20} color="white" />
                <Text style={styles.kiriGenerateButtonText}>Generate 3D Model</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* KIRI Loading Modal */}
      <Modal
        visible={showKiriLoadingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.kiriLoadingOverlay}>
          <View style={styles.kiriLoadingContainer}>
            {/* Header */}
            <View style={styles.kiriLoadingHeader}>
              <View style={styles.kiriLoadingIconContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
              </View>
              <Text style={styles.kiriLoadingTitle}>Generating 3D Model</Text>
            <Text style={styles.kiriLoadingSubtitle}>
              {kiriEngineMessage || 'KIRI Engine is processing your photos'}
            </Text>
            </View>

            {/* Progress Steps */}
            <View style={styles.kiriLoadingSteps}>
              <View style={styles.kiriLoadingStep}>
                <View style={styles.kiriLoadingStepIcon}>
                  <Icon 
                    name="checkmark-circle" 
                    size={20} 
                    color={kiriEngineStatus >= 1 ? "#4CAF50" : "#CCCCCC"} 
                  />
                </View>
                <Text style={[
                  styles.kiriLoadingStepText,
                  { color: kiriEngineStatus >= 1 ? "#4CAF50" : "#666666" }
                ]}>
                  Photos Uploaded
                </Text>
              </View>
              
              <View style={styles.kiriLoadingStep}>
                <View style={styles.kiriLoadingStepIcon}>
                  {kiriEngineStatus === 2 ? (
                    <ActivityIndicator size="small" color="#4CAF50" />
                  ) : (
                    <Icon 
                      name={kiriEngineStatus > 2 ? "checkmark-circle" : "time"} 
                      size={20} 
                      color={kiriEngineStatus >= 2 ? "#4CAF50" : "#CCCCCC"} 
                    />
                  )}
                </View>
                <Text style={[
                  styles.kiriLoadingStepText,
                  { color: kiriEngineStatus >= 2 ? "#4CAF50" : "#666666" }
                ]}>
                  Processing Photos
                </Text>
              </View>
              
              <View style={styles.kiriLoadingStep}>
                <View style={styles.kiriLoadingStepIcon}>
                  {kiriEngineStatus === 3 ? (
                    <Icon name="checkmark-circle" size={20} color="#4CAF50" />
                  ) : (
                    <Icon 
                      name="time" 
                      size={20} 
                      color={kiriEngineStatus >= 3 ? "#4CAF50" : "#CCCCCC"} 
                    />
                  )}
                </View>
                <Text style={[
                  styles.kiriLoadingStepText,
                  { color: kiriEngineStatus >= 3 ? "#4CAF50" : "#666666" }
                ]}>
                  {kiriEngineStatus === 3 ? "3D Model Completed" : "3D Model Creation"}
                </Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.kiriLoadingDescription}>
              <Text style={styles.kiriLoadingDescriptionText}>
                This may take a few minutes. KIRI Engine is analyzing your photos to create a detailed 3D model.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3D Model Success Modal */}
      <Modal
        visible={showKiriSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowKiriSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.kiriSuccessContainer}>
            {/* Header */}
            <View style={styles.kiriSuccessHeader}>
              <View style={styles.kiriSuccessIconContainer}>
                <Icon name="checkmark-circle" size={50} color="#4CAF50" />
              </View>
              <Text style={styles.kiriSuccessTitle}>🎉 3D Model Created!</Text>
              <Text style={styles.kiriSuccessSubtitle}>
                Your {propProductName || productName || 'product'} has been successfully converted to a 3D model!
              </Text>
            </View>

            {/* Success Details */}
            <View style={styles.kiriSuccessDetails}>
              <View style={styles.kiriSuccessDetailItem}>
                <Icon name="cube" size={20} color="#4CAF50" />
                <Text style={styles.kiriSuccessDetailText}>
                  Real GLB model generated from your photos
                </Text>
              </View>
              <View style={styles.kiriSuccessDetailItem}>
                <Icon name="star" size={20} color="#4CAF50" />
                <Text style={styles.kiriSuccessDetailText}>
                  Quality: {scanResult?.quality || 'High Quality (KIRI Engine)'}
                </Text>
              </View>
              <View style={styles.kiriSuccessDetailItem}>
                <Icon name="eye" size={20} color="#4CAF50" />
                <Text style={styles.kiriSuccessDetailText}>
                  Ready for AR viewing and interaction
                </Text>
              </View>
              {scanResult?.duration && (
                <View style={styles.kiriSuccessDetailItem}>
                  <Icon name="time" size={20} color="#4CAF50" />
                  <Text style={styles.kiriSuccessDetailText}>
                    Processing time: {scanResult.duration}
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            <View style={styles.kiriSuccessDescription}>
              <Text style={styles.kiriSuccessDescriptionText}>
                🎯 This is a real AR model created with KIRI Engine technology! You can now view and interact with it in Augmented Reality.
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.kiriSuccessButtons}>
              <TouchableOpacity
                style={styles.kiriSuccessCancelButton}
                onPress={() => setShowKiriSuccessModal(false)}
              >
                <Text style={styles.kiriSuccessCancelButtonText}>Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.kiriSuccessViewButton}
                onPress={() => {
                  console.log('🎯 ===== VIEW IN AR BUTTON PRESSED =====');
                  console.log('🎯 Button pressed at:', new Date().toISOString());
                  
                  // Debug navigation state
                  console.log('📊 Current navigation state:', JSON.stringify(navigation.getState(), null, 2));
                  console.log('📊 Available routes:', navigation.getState()?.routes?.map(r => r.name));
                  console.log('📊 Current route name:', navigation.getState()?.routes?.[navigation.getState()?.index]?.name);
                  
                  // Debug route params
                  console.log('📊 Route params:', JSON.stringify(route?.params, null, 2));
                  console.log('📊 Product ID:', route?.params?.productId);
                  console.log('📊 Product Name:', route?.params?.productName);
                  
                  // Debug scan result data
                  console.log('📊 Scan result data:', JSON.stringify(scanResult, null, 2));
                  console.log('📊 GLB URL:', scanResult?.glbUrl);
                  console.log('📊 Cloudinary URL:', scanResult?.cloudinaryUrl);
                  console.log('📊 Model URL (final):', scanResult?.glbUrl || scanResult?.cloudinaryUrl);
                  console.log('📊 Scan result keys:', Object.keys(scanResult || {}));
                  
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
                  
                  setShowKiriSuccessModal(false);
                  
                  // Navigate to ARViewer with the scan data
                  try {
                    console.log('🎯 ===== STARTING NAVIGATION TO ARVIEWER =====');
                    
                    const navigationParams = {
                      productId: route?.params?.productId,
                      productName: route?.params?.productName,
                      modelUrl: scanResult?.glbUrl || scanResult?.cloudinaryUrl,
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
                    
                    // Also emit the scan complete event for other components
                    console.log('📊 Emitting KIRI_SCAN_COMPLETE event...');
                    DeviceEventEmitter.emit('KIRI_SCAN_COMPLETE', {
                      scanData: scanResult,
                      productId: route?.params?.productId,
                      productName: route?.params?.productName,
                      isAutoCapture: true
                    });
                    console.log('✅ KIRI_SCAN_COMPLETE event emitted');
                    
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
                  
                  console.log('🎯 ===== VIEW IN AR BUTTON HANDLER COMPLETED =====');
                }}
              >
                <Icon name="eye" size={20} color="white" />
                <Text style={styles.kiriSuccessViewButtonText}>View in AR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  flashButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  cameraPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanGuide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: width * 0.8,
    height: width * 0.8,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4CAF50',
    borderWidth: 3,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    top: 'auto',
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  movementIndicator: {
    position: 'absolute',
    top: -50,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  movementText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  countdownContainer: {
    position: 'absolute',
    top: -100,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  countdownLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  processingIndicator: {
    position: 'absolute',
    bottom: -80,
    backgroundColor: 'rgba(255, 139, 71, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  autoControls: {
    alignItems: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  manualControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  tipsText: {
    fontSize: 12,
    color: '#FFD700',
    textAlign: 'center',
    paddingHorizontal: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  loadingSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 10,
  },
  retryText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 5,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fallbackButton: {
    backgroundColor: 'rgba(255, 139, 71, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 30,
  },
  fallbackButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Native iPhone-style camera UI styles
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  modeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressIndicator: {
    position: 'absolute',
    top: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  progressIndicatorNearComplete: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)', // Green when near completion
  },
  progressTextComplete: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  bottomControls: {
    paddingBottom: 40,
  },
  cameraModes: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  modeTab: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 20,
  },
  activeModeTab: {
    color: 'white',
    fontWeight: '600',
  },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  galleryCount: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  galleryThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  galleryCountBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B47',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  galleryCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mainCaptureButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  stopIndicator: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: 'red',
  },
  switchButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCountdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 80,
    width: 160,
    height: 160,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  centerCountdownText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centerCountdownLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  // Completion Dialog Styles
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  dialogButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#FF6B47',
  },
  redoButton: {
    backgroundColor: '#E5E5E5',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  redoButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  photoGrid: {
    maxHeight: 300,
    marginVertical: 15,
  },
  photoGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 5,
  },
  photoGridItem: {
    width: '23%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 2,
  },
  photoNumber: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    fontSize: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontWeight: 'bold',
  },
  photoCountText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#999',
  },
  // AR Overlay Styles
  arOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  modelPlaceholder: {
    position: 'absolute',
    width: 80,
    height: 80,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  modelLabel: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  arInstructions: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  arInstructionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  arInstructionSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },

  // Modern Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalContent: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  modalStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  modalFeatures: {
    gap: 12,
  },
  modalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalFeatureText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 30,
    paddingBottom: 30,
    gap: 15,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  modalSelectButton: {
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
  modalSelectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // Photo Processing Modal Styles
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  processingContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 350,
    paddingVertical: 30,
    paddingHorizontal: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  processingIconContainer: {
    marginBottom: 20,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  processingSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  processingSteps: {
    width: '100%',
    marginBottom: 25,
  },
  processingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  processingStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  processingStepCompleted: {
    backgroundColor: '#4CAF50',
  },
  processingStepActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  processingStepPending: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  processingStepText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
  },
  processingStepTextPending: {
    color: '#999999',
  },
  processingStepLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 15,
    marginBottom: 15,
  },
  processingInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    width: '100%',
  },
  processingInfoText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Photo Success Modal Styles
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    paddingVertical: 30,
    paddingHorizontal: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  successActions: {
    width: '100%',
  },
  successButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // KIRI Engine Modal Styles
  kiriOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  kiriContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  kiriHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  kiriIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  kiriTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  kiriSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  kiriStatusContainer: {
    flexDirection: 'row',
    paddingHorizontal: 30,
    marginBottom: 25,
    gap: 10,
  },
  kiriStatusCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  kiriStatusInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  kiriStatusNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  kiriStatusLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
  },
  kiriDescription: {
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  kiriDescriptionText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  kiriDescriptionSubtext: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    textAlign: 'center',
  },
  kiriActions: {
    flexDirection: 'row',
    paddingHorizontal: 30,
    paddingBottom: 30,
    gap: 15,
  },
  kiriCancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kiriCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  kiriGenerateButton: {
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
  kiriGenerateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // KIRI Loading Modal Styles
  kiriLoadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  kiriLoadingContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  kiriLoadingHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  kiriLoadingIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  kiriLoadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  kiriLoadingSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  kiriLoadingSteps: {
    paddingHorizontal: 30,
    marginBottom: 25,
  },
  kiriLoadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  kiriLoadingStepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  kiriLoadingStepText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  kiriLoadingDescription: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  kiriLoadingDescriptionText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    textAlign: 'center',
  },

  // 3D Model Success Modal Styles
  kiriSuccessContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  kiriSuccessHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  kiriSuccessIconContainer: {
    marginBottom: 16,
  },
  kiriSuccessTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  kiriSuccessSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  kiriSuccessDetails: {
    width: '100%',
    marginBottom: 24,
  },
  kiriSuccessDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  kiriSuccessDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  kiriSuccessDescription: {
    width: '100%',
    marginBottom: 24,
  },
  kiriSuccessDescriptionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  kiriSuccessButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  kiriSuccessCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  kiriSuccessCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  kiriSuccessViewButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  kiriSuccessViewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },


  // 3D Model Created Modal Styles
  modelCreatedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modelCreatedContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modelCreatedHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  modelCreatedIconContainer: {
    marginBottom: 20,
  },
  modelCreatedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modelCreatedSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  modelCreatedInfo: {
    paddingHorizontal: 30,
    marginBottom: 25,
  },
  modelCreatedInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  modelCreatedInfoContent: {
    marginLeft: 16,
    flex: 1,
  },
  modelCreatedInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  modelCreatedInfoSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  modelCreatedDescription: {
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  modelCreatedDescriptionText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    textAlign: 'center',
  },
  modelCreatedActions: {
    flexDirection: 'row',
    paddingHorizontal: 30,
    paddingBottom: 30,
    gap: 15,
  },
  modelCreatedCancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelCreatedCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  modelCreatedViewButton: {
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
  modelCreatedViewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default CustomCamera;