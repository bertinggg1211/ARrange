import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/Ionicons';
import { WebView } from 'react-native-webview';
import { PanGestureHandler, PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { getLocalModelPath } from '../../utils/modelLoader';
import styles from './styles/TryAR.style';

const { width, height } = Dimensions.get('window');

export default function TryAR({ navigation }) {
  console.log('🎯 TryAR screen loaded with CustomCamera approach');
  
  const cameraRef = useRef(null);
  const isMountedRef = useRef(true);
  const insets = useSafeAreaInsets();
  
  // Debug safe area insets
  useEffect(() => {
    console.log('📱 TryAR Safe Area Insets:', insets);
  }, [insets]);
  
  // Vision Camera setup (same as CustomCamera.jsx)
  const devices = useCameraDevices();
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraReady, setCameraReady] = useState(false);
  const [deviceReady, setDeviceReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Gesture state for 3D model scaling and positioning
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [lastScale, setLastScale] = useState(1);
  const [lastTranslateX, setLastTranslateX] = useState(0);
  const [lastTranslateY, setLastTranslateY] = useState(0);
  
  // Find back camera with comprehensive detection (same as CustomCamera.jsx)
  let device = null;
  
  // Method 1: Direct access
  if (devices?.back) {
    device = devices.back;
    console.log('✅ TryAR: Found device via devices.back');
  }
  // Method 2: Array access
  else if (devices?.devices && Array.isArray(devices.devices)) {
    device = devices.devices.find(d => d.position === 'back');
    console.log('✅ TryAR: Found device via devices.devices array');
  }
  // Method 3: Object iteration
  else if (devices && typeof devices === 'object') {
    const deviceKeys = Object.keys(devices);
    console.log('🔍 TryAR: Device keys to check:', deviceKeys);
    
    for (const key of deviceKeys) {
      const deviceObj = devices[key];
      if (deviceObj && typeof deviceObj === 'object' && deviceObj.position === 'back') {
        device = deviceObj;
        console.log('✅ TryAR: Found device via key:', key);
        break;
      }
    }
  }
  
  // Debug camera devices
  useEffect(() => {
    console.log('📷 TryAR Camera devices:', devices);
    console.log('📷 TryAR Back device:', device);
    console.log('📷 TryAR Has permission:', hasPermission);
    console.log('📷 TryAR Devices keys:', devices ? Object.keys(devices) : 'No devices object');
    console.log('📷 TryAR Devices type:', typeof devices);
    console.log('📷 TryAR Devices length:', devices ? Object.keys(devices).length : 'No devices');
    
    if (devices) {
      console.log('📷 TryAR Available devices:', Object.keys(devices));
      console.log('📷 TryAR Front device:', devices.front);
      console.log('📷 TryAR Back device:', devices.back);
    } else {
      console.log('❌ TryAR: Devices object is null/undefined');
    }
    
    if (devices && Object.keys(devices).length === 0) {
      console.log('❌ TryAR: No camera devices found');
    }
  }, [devices, device, hasPermission]);

  // Check camera permission on mount
  useEffect(() => {
    if (!hasPermission) {
      console.log('📷 TryAR: Requesting camera permission...');
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Camera ready effect
  useEffect(() => {
    if (device && hasPermission) {
      console.log('✅ TryAR: Camera device and permission ready');
      setDeviceReady(true);
      setCameraReady(true);
    }
  }, [device, hasPermission]);

  // Handle back button
  useEffect(() => {
    const backHandler = () => {
      const action = {
        type: 'NAVIGATE',
        payload: {
          name: 'BuyerTabs',
          params: {
            screen: 'Home'
          }
        }
      };
      
      console.log('🔙 TryAR: Hardware back button pressed - Dispatching action:', action);
      console.log('🔙 TryAR: Action type:', action.type);
      console.log('🔙 TryAR: Payload:', action.payload);
      
      navigation.dispatch(action);
      return true;
    };

    const unsubscribe = navigation.addListener('beforeRemove', backHandler);
    return unsubscribe;
  }, [navigation]);

  // Get the 3D model path
  const modelPath = getLocalModelPath();

  // Memoize the WebView HTML to prevent infinite re-renders
  const webViewHTML = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            background: transparent; 
            overflow: hidden;
            touch-action: none;
            /* Performance optimizations */
            will-change: transform;
          }
          model-viewer { 
            width: 100vw; 
            height: 100vh; 
            background: transparent;
            touch-action: none;
            /* Performance optimizations for 60fps */
            will-change: transform;
            /* GPU acceleration */
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
            /* Smooth rendering */
            image-rendering: optimizeSpeed;
            image-rendering: -webkit-optimize-contrast;
          }
        </style>
      </head>
      <body>
        <model-viewer 
          src="${modelPath}" 
          auto-rotate 
          touch-action="none"
          style="width: 100vw; height: 100vh; touch-action: none;"
          onload="window.ReactNativeWebView.postMessage('modelLoaded')"
          onerror="window.ReactNativeWebView.postMessage('modelError')"
          /* Performance attributes for 60fps */
          camera-orbit="auto"
          field-of-view="30deg"
          min-camera-orbit="auto auto 2m"
          max-camera-orbit="auto auto 10m"
          /* Optimize for performance */
          shadow-intensity="0.5"
          shadow-softness="0.3"
          exposure="1.0"
          tone-mapping="neutral"
        >
        </model-viewer>
      </body>
      </html>
    `;
  }, [modelPath]);

  const handleBack = () => {
    // Navigate to the buyer's Home screen via BuyerTabs
    const action = {
      type: 'NAVIGATE',
      payload: {
        name: 'BuyerTabs',
        params: {
          screen: 'Home'
        }
      }
    };
    
    console.log('🔙 TryAR: Back button pressed - Dispatching action:', action);
    console.log('🔙 TryAR: Action type:', action.type);
    console.log('🔙 TryAR: Payload:', action.payload);
    
    navigation.dispatch(action);
  };

  const handleInstructionsToggle = () => {
    setShowInstructions(!showInstructions);
  };

  // Gesture handlers for 3D model interaction (optimized for 60fps)
  const onPinchGestureEvent = useCallback((event) => {
    const newScale = Math.max(0.5, Math.min(3, lastScale * event.nativeEvent.scale));
    setScale(newScale);
    // Reduced logging for better performance
    if (Math.abs(newScale - scale) > 0.1) {
      console.log('🔍 TryAR: Pinch gesture - scale:', newScale);
    }
  }, [lastScale, scale]);

  const onPinchHandlerStateChange = useCallback((event) => {
    console.log('🔍 TryAR: Pinch state change:', event.nativeEvent.state, 'old state:', event.nativeEvent.oldState);
    if (event.nativeEvent.oldState === State.ACTIVE) {
      setLastScale(scale);
      console.log('🔍 TryAR: Pinch gesture ended, final scale:', scale);
    }
  }, [scale]);

  const onPanGestureEvent = useCallback((event) => {
    const newTranslateX = lastTranslateX + event.nativeEvent.translationX;
    const newTranslateY = lastTranslateY + event.nativeEvent.translationY;
    
    // Allow more freedom of movement - increased limits
    const maxTranslate = 400;
    setTranslateX(Math.max(-maxTranslate, Math.min(maxTranslate, newTranslateX)));
    setTranslateY(Math.max(-maxTranslate, Math.min(maxTranslate, newTranslateY)));
    // Reduced logging for better performance
    if (Math.abs(newTranslateX - translateX) > 10 || Math.abs(newTranslateY - translateY) > 10) {
      console.log('🔍 TryAR: Pan gesture - translateX:', newTranslateX, 'translateY:', newTranslateY);
    }
  }, [lastTranslateX, lastTranslateY, translateX, translateY]);

  const onPanHandlerStateChange = useCallback((event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      setLastTranslateX(translateX);
      setLastTranslateY(translateY);
    }
  }, [translateX, translateY]);

  const resetModelTransform = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    setLastScale(1);
    setLastTranslateX(0);
    setLastTranslateY(0);
  };

  const handleModelLoad = useCallback(() => {
    setModelLoaded(true);
    console.log('✅ TryAR: 3D Model loaded successfully');
  }, []);

  const handleModelError = useCallback((error) => {
    console.error('❌ TryAR: 3D Model failed to load:', error);
    Alert.alert(
      'Model Loading Error',
      'Failed to load the 3D model. Please try again.',
      [{ text: 'OK' }]
    );
  }, []);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!modelLoaded) {
        console.log('⏰ TryAR: Model loading timeout - forcing model loaded state');
        setModelLoaded(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [modelLoaded]);

  const handleCapture = () => {
    console.log('📸 TryAR: Capture AR photo');
    // Implement photo capture logic here
  };

  const handleShare = () => {
    console.log('📤 TryAR: Share AR experience');
    // Implement share logic here
  };

  // Show loading while camera is initializing
  if (!cameraReady && hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#FF8B47" />
          <Text style={styles.permissionTitle}>Initializing Camera...</Text>
          <Text style={styles.permissionSubtitle}>
            Setting up AR experience
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.permissionContainer}>
          <Icon name="camera-outline" size={80} color="#FF8B47" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionSubtitle}>
            We need camera access to show you the AR experience
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    console.log('❌ TryAR: No camera device available');
    console.log('📷 TryAR: Available devices:', devices);
    console.log('📷 TryAR: Devices object:', JSON.stringify(devices, null, 2));
    
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.permissionContainer}>
          <Icon name="camera-outline" size={80} color="#FF8B47" />
          <Text style={styles.permissionTitle}>Camera Not Available</Text>
          <Text style={styles.permissionSubtitle}>
            Camera is not available on this device or is being used by another app
          </Text>
          <Text style={styles.debugText}>
            Debug: Devices = {devices ? Object.keys(devices).length : 'null'} | Permission = {hasPermission ? 'Yes' : 'No'}
          </Text>
          
          {/* Fallback: Show 3D model without camera */}
          <TouchableOpacity 
            style={[styles.permissionButton, { backgroundColor: '#4CAF50', marginTop: 10 }]} 
            onPress={() => {
              console.log('🎯 TryAR: Showing 3D model without camera');
              setCameraReady(true);
            }}
          >
            <Text style={styles.permissionButtonText}>View 3D Model (No Camera)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.permissionButton} onPress={handleBack}>
            <Text style={styles.permissionButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      
      {/* Vision Camera */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={cameraReady && hasPermission && !!device}
        photo={true}
        enableZoomGesture={false}
        enableFps={false}
        format={device?.formats?.find(f => 
          f.photoHeight >= 1080 &&
          f.photoHeight <= 4096 &&
          f.photoWidth >= 1080 &&
          f.photoWidth <= 4096
        )}
        enableBufferCompression={false}
        enableDepthData={false}
        enablePortraitEffectsMatteDelivery={false}
        enableHighQualityPhotos={true}
        enableHdr={false}
        enableNightMode={false}
        enableAutoStabilization={false}
        enableAutoFocus={true}
        enableAutoExposure={true}
        enableAutoWhiteBalance={true}
        onInitialized={() => {
          console.log('📷 TryAR: Camera initialized');
          setCameraReady(true);
        }}
        onError={(error) => {
          console.error('📷 TryAR: Camera error:', error);
          Alert.alert('Camera Error', 'Failed to initialize camera. Please try again.');
        }}
      />

      {/* AR Overlay UI */}
      <View style={styles.overlay}>
        {/* Top Header with Safe Area */}
        <View style={[styles.topControls, { paddingTop: Math.max(insets.top, 20) + 15 }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Try AR</Text>
          </View>
          <View style={styles.scaleIndicator}>
            <Text style={styles.scaleText}>{scale.toFixed(1)}x</Text>
          </View>
          <TouchableOpacity style={styles.resetButton} onPress={resetModelTransform}>
            <Icon name="refresh-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpButton} onPress={handleInstructionsToggle}>
            <Icon name="information-circle-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 3D Model Viewer with Gesture Controls */}
        {modelPath && (
          <View style={styles.modelContainer}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <PinchGestureHandler
                onGestureEvent={onPinchGestureEvent}
                onHandlerStateChange={onPinchHandlerStateChange}
                minPointers={2}
                maxPointers={2}
                shouldCancelWhenOutside={false}
                simultaneousHandlers={[]}
              >
                <PanGestureHandler
                  onGestureEvent={onPanGestureEvent}
                  onHandlerStateChange={onPanHandlerStateChange}
                  minPointers={1}
                  maxPointers={1}
                  shouldCancelWhenOutside={false}
                  activeOffsetX={[-10, 10]}
                  activeOffsetY={[-10, 10]}
                  simultaneousHandlers={[]}
                >
                  <View style={[styles.modelViewer, {
                    transform: [
                      { scale: scale },
                      { translateX: translateX },
                      { translateY: translateY }
                    ]
                  }]}>
                    <WebView
                      source={{ html: webViewHTML }}
                      style={styles.modelViewer}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      startInLoadingState={true}
                      // Performance optimizations for 60fps
                      androidLayerType="hardware"
                      androidHardwareAccelerationDisabled={false}
                      androidRenderInWebView={true}
                      mixedContentMode="compatibility"
                      allowsInlineMediaPlayback={true}
                      mediaPlaybackRequiresUserAction={false}
                      // Reduce memory usage
                      cacheEnabled={true}
                      cacheMode="LOAD_CACHE_ELSE_NETWORK"
                      onMessage={(event) => {
                        if (event.nativeEvent.data === 'modelLoaded') {
                          handleModelLoad();
                        } else if (event.nativeEvent.data === 'modelError') {
                          handleModelError('Model loading failed');
                        }
                      }}
                      renderLoading={() => (
                        <View style={styles.modelLoadingContainer}>
                          <ActivityIndicator size="large" color="#FF8B47" />
                          <Text style={styles.modelLoadingText}>Loading 3D Model...</Text>
                        </View>
                      )}
                    />
                  </View>
                </PanGestureHandler>
              </PinchGestureHandler>
            </GestureHandlerRootView>
          </View>
        )}
      </View>

      {/* Instructions Modal */}
      <Modal
        visible={showInstructions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInstructions(false)}
      >
        <View style={styles.instructionsOverlay}>
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionsHeader}>
              <Text style={styles.instructionsTitle}>How to Use AR</Text>
              <TouchableOpacity onPress={() => setShowInstructions(false)} style={styles.instructionsCloseButton}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.instructionsContent}>
              <View style={styles.instructionItem}>
                <Icon name="finger-print-outline" size={24} color="#FF8B47" style={styles.instructionIcon} />
                <Text style={styles.instructionText}>
                  <Text style={styles.instructionHighlight}>Touch and drag</Text> to freely move the 3D model around the screen.
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="search-outline" size={24} color="#FF8B47" style={styles.instructionIcon} />
                <Text style={styles.instructionText}>
                  <Text style={styles.instructionHighlight}>Pinch to zoom</Text> in and out of the model (0.5x to 3x scale).
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="sync-outline" size={24} color="#FF8B47" style={styles.instructionIcon} />
                <Text style={styles.instructionText}>
                  The model will <Text style={styles.instructionHighlight}>auto-rotate</Text> for a dynamic view.
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="refresh-outline" size={24} color="#FF8B47" style={styles.instructionIcon} />
                <Text style={styles.instructionText}>
                  Tap the <Text style={styles.instructionHighlight}>reset button</Text> to return to original size and position.
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.gotItButton} onPress={() => setShowInstructions(false)}>
              <Text style={styles.gotItButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}