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
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles/ViewAR.style';

const { width, height } = Dimensions.get('window');

export default function ViewAR({ route, navigation }) {
  const { product } = route.params;
  
  const cameraRef = useRef(null);
  const isMountedRef = useRef(true);
  const insets = useSafeAreaInsets();
  
  
  // Vision Camera setup (same as TryAR.jsx)
  const devices = useCameraDevices();
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraReady, setCameraReady] = useState(false);
  const [deviceReady, setDeviceReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  // 3D Model state
  const [modelScale, setModelScale] = useState(1.0);
  const [modelRotation, setModelRotation] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  
  // Get model URL from product data - handle local, TRIPO, and KIRI models
  let modelUrl = null;
  let hasModel = false;
  
  if (product?.arModelSource === 'local') {
    // Use local TEST4.glb model
    console.log('🏠 ViewAR: Using local TEST4.glb model');
    const { getLocalModelPath } = require('../../utils/localModelLoader');
    modelUrl = getLocalModelPath('TEST4');
    hasModel = true;
  } else {
    // PRIORITY 1: Check arModel field directly (TRIPO stores here)
    if (product?.arModel) {
      console.log('✅ ViewAR: Found arModel directly (TRIPO):', product.arModel);
      modelUrl = product.arModel;
      hasModel = true;
    } 
    // PRIORITY 2: Check arScanData (KIRI Engine or fallback)
    else {
      console.log('🎯 ViewAR: Checking arScanData (KIRI Engine)');
      modelUrl = product?.arScanData?.glbUrl || 
                 product?.arScanData?.cloudinaryUrl || 
                 product?.arScanData?.modelUrl;
      hasModel = !!modelUrl;
      
      if (hasModel) {
        console.log('✅ ViewAR: Found model in arScanData:', modelUrl);
      } else {
        console.log('⚠️ ViewAR: No model URL found in arModel or arScanData');
      }
    }
  }
  
  const finalModelUrl = modelUrl;
  const finalHasModel = hasModel;
  
  // Clear model state when product changes
  useEffect(() => {
    console.log('🔄 ViewAR: Product changed, clearing model state');
    setModelScale(1.0);
    setModelRotation(0);
    setModelLoaded(false);
  }, [product?.id]);

  // Debug logging for model detection
  console.log('🎯 ViewAR Debug for Product:', product?.name || 'Unknown');
  console.log('📊 Product ID:', product?.id);
  console.log('📊 Product data:', product);
  console.log('📊 Product arScanData:', product?.arScanData);
  console.log('📊 Product hasAR:', product?.hasAR);
  console.log('📊 Model URL found:', modelUrl);
  console.log('📊 Has model:', hasModel);
  console.log('📊 Final model URL:', finalModelUrl);
  console.log('📊 Final has model:', finalHasModel);
  console.log('📊 GLB URL:', product?.arScanData?.glbUrl);
  console.log('📊 Cloudinary URL:', product?.arScanData?.cloudinaryUrl);
  console.log('📊 Model URL:', product?.arScanData?.modelUrl);
  console.log('📊 Product keys:', Object.keys(product || {}));
  console.log('📊 ArScanData keys:', Object.keys(product?.arScanData || {}));
  
  // Find back camera with comprehensive detection (same as TryAR.jsx)
  let device = null;
  
  // Method 1: Direct access
  if (devices?.back) {
    device = devices.back;
  }
  // Method 2: Array access
  else if (devices?.devices && Array.isArray(devices.devices)) {
    device = devices.devices.find(d => d.position === 'back');
  }
  // Method 3: Object iteration
  else if (devices && typeof devices === 'object') {
    const deviceKeys = Object.keys(devices);
    
    for (const key of deviceKeys) {
      const deviceObj = devices[key];
      if (deviceObj && typeof deviceObj === 'object' && deviceObj.position === 'back') {
        device = deviceObj;
        break;
      }
    }
  }
  

  // Camera initialization with timeout and error handling
  useEffect(() => {
    if (device && hasPermission) {
      setDeviceReady(true);
      setCameraError(null);
      
      // Force camera initialization after a delay
      const initTimeout = setTimeout(() => {
        setCameraReady(true);
      }, 3000);
      
      return () => clearTimeout(initTimeout);
    } else {
      setDeviceReady(false);
      setCameraReady(false);
    }
  }, [device, hasPermission]);

  // Handle camera errors
  const handleCameraError = useCallback((error) => {
    setCameraError(error);
    setCameraReady(false);
  }, []);

  // Handle camera permission
  const handlePermission = useCallback(async () => {
    if (!hasPermission) {
      const permission = await requestPermission();
      return permission;
    }
    return true;
  }, [hasPermission, requestPermission]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    console.log('🔙 ViewAR: Back button pressed');
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback to specific navigation if goBack fails
      navigation.navigate('ProductDetail', { product });
    }
  }, [navigation, product]);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('🔙 ViewAR: Hardware back button pressed');
      handleBack();
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [handleBack]);

  // Placeholder functions for future 3D model
  const resetModelTransform = useCallback(() => {
    // Placeholder for future reset functionality
  }, []);

  // Placeholder for future 3D model functionality

  // Placeholder for future WebView message handling

  // Check for camera errors
  if (cameraError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.errorContainer}>
          <Icon name="camera-outline" size={64} color="#FF8B47" />
          <Text style={styles.errorTitle}>Camera Error</Text>
          <Text style={styles.errorMessage}>
            Camera failed to initialize. This may be due to another app using the camera.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Check if we have a device and permission
  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.errorContainer}>
          <Icon name="camera-outline" size={64} color="#FF8B47" />
          <Text style={styles.errorTitle}>Camera Not Available</Text>
          <Text style={styles.errorMessage}>
            No camera device found. Please ensure your device has a camera and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.errorContainer}>
          <Icon name="camera-outline" size={64} color="#FF8B47" />
          <Text style={styles.errorTitle}>Camera Permission Required</Text>
          <Text style={styles.errorMessage}>
            This feature requires camera access to show the product in AR.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handlePermission}>
            <Text style={styles.retryButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent={false} />
      
      {/* Header - CRITICAL: Must be above WebView with high z-index */}
      <View style={[styles.header, { 
        paddingTop: Math.max(insets.top, 10) + 5,
        zIndex: 100,  // Higher than WebView (zIndex: 10)
        elevation: 100, // For Android
        position: 'relative' // Ensure z-index works
      }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Larger touch area
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>View AR</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
              {product?.name || 'Product'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={resetModelTransform}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.helpButton} 
            onPress={() => setShowInstructions(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="help-circle-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {finalHasModel ? (
          <View style={[styles.modelIndicator, { 
            zIndex: 100, // Ensure it's above WebView
            elevation: 100 
          }]}>
            <Icon name="cube" size={16} color="#4CAF50" />
            <Text style={styles.modelText}>3D Model Ready</Text>
          </View>
        ) : (
          <View style={[styles.placeholderIndicator, { 
            zIndex: 100, 
            elevation: 100 
          }]}>
            <Text style={styles.placeholderText}>3D Model Coming Soon</Text>
          </View>
        )}
      </View>

      {/* Camera and Placeholder */}
      <View style={styles.cameraContainer}>
        {device && hasPermission && !cameraError && (
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={cameraReady}
            photo={false}
            video={false}
            audio={false}
            enableZoomGesture={false}
            enableFpsGraph={false}
            enablePortraitEffects={false}
            enableDepthData={false}
            enableHighQualityPhotos={false}
            enableHdr={false}
            enableNightMode={false}
            enableAutoFocus={true}
            enableFocus={true}
            orientation="portrait"
            pixelFormat="yuv"
            colorSpace="srgb"
            onError={handleCameraError}
          />
        )}
        
        {/* 3D Model or Placeholder */}
        {finalHasModel ? (
          <View style={[styles.modelContainer, { 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
            zIndex: 10
          }]}>
            <WebView
              key={`model-${product?.id}-${finalModelUrl}`}
              source={{
                html: `
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
                      }
                      model-viewer { 
                        width: 100vw; 
                        height: 100vh; 
                        background: transparent;
                        transform: scale(${modelScale}) rotate(${modelRotation}deg);
                      }
                    </style>
                  </head>
                  <body>
                    <model-viewer 
                      src="${finalModelUrl}" 
                      auto-rotate 
                      camera-controls 
                      touch-action="pan-y"
                      style="width: 100vw; height: 100vh;"
                      onload="console.log('Model loaded successfully')"
                      onerror="console.log('Model load error:', event)"
                    >
                    </model-viewer>
                    <script>
                      console.log('ViewAR WebView loaded');
                      console.log('Model URL:', '${finalModelUrl}');
                      console.log('Model scale:', ${modelScale});
                      console.log('Model rotation:', ${modelRotation});
                    </script>
                  </body>
                  </html>
                `
              }}
              style={[styles.modelWebView, {
                backgroundColor: 'transparent',
                flex: 1
              }]}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              onLoad={() => console.log('🎯 ViewAR WebView onLoad triggered')}
              onError={(error) => console.log('❌ ViewAR WebView error:', error)}
              renderLoading={() => (
                <View style={styles.modelLoadingContainer}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.modelLoadingText}>Loading 3D Model...</Text>
                </View>
              )}
            />
            
            {/* Model Controls */}
            <View style={[styles.modelControls, {
              position: 'absolute',
              bottom: 20,
              left: 20,
              right: 20,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 15,
              zIndex: 20
            }]}>
              <TouchableOpacity 
                style={[styles.controlButton, {
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  padding: 12,
                  borderRadius: 25,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)'
                }]}
                onPress={() => setModelScale(Math.max(0.5, modelScale - 0.1))}
              >
                <Icon name="remove" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, {
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  padding: 12,
                  borderRadius: 25,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)'
                }]}
                onPress={() => setModelScale(Math.min(2.0, modelScale + 0.1))}
              >
                <Icon name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, {
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  padding: 12,
                  borderRadius: 25,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)'
                }]}
                onPress={() => setModelRotation(modelRotation + 15)}
              >
                <Icon name="refresh" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <View style={styles.placeholderContent}>
              <Icon name="cube-outline" size={80} color="#FF8B47" />
              <Text style={styles.placeholderTitle}>3D Model Coming Soon</Text>
              <Text style={styles.placeholderDescription}>
                This product will have AR viewing capability once the seller uploads a 3D model.
              </Text>
              <View style={styles.placeholderFeatures}>
                <View style={styles.featureItem}>
                  <Icon name="eye-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.featureText}>360° View</Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="resize-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.featureText}>Zoom & Pan</Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="phone-portrait-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.featureText}>AR Placement</Text>
                </View>
              </View>
            </View>
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
        <View style={styles.modalOverlay}>
          <View style={styles.instructionsModal}>
            <View style={styles.instructionsHeader}>
              <Text style={styles.instructionsTitle}>AR Instructions</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowInstructions(false)}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.instructionsContent}>
              <View style={styles.instructionItem}>
                <Icon name="camera-outline" size={24} color="#FF8B47" />
                <Text style={styles.instructionText}>Camera is active for AR experience</Text>
              </View>
              
              <View style={styles.instructionItem}>
                <Icon name="cube-outline" size={24} color="#FF8B47" />
                <Text style={styles.instructionText}>3D model will appear here when available</Text>
              </View>
              
              <View style={styles.instructionItem}>
                <Icon name="hand-left-outline" size={24} color="#FF8B47" />
                <Text style={styles.instructionText}>Future: Pan to move the 3D model around</Text>
              </View>
              
              <View style={styles.instructionItem}>
                <Icon name="resize-outline" size={24} color="#FF8B47" />
                <Text style={styles.instructionText}>Future: Pinch to zoom in/out</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.gotItButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.gotItButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
