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
  
  // Camera zoom state - DISABLED
  // const [cameraZoom, setCameraZoom] = useState(1);
  // const [maxCameraZoom, setMaxCameraZoom] = useState(10);
  // const [cameraKey, setCameraKey] = useState(0);
  
  // Get device zoom range when device is available - DISABLED
  // useEffect(() => {
  //   if (device) {
  //     const maxZoom = device.maxZoom ?? 10;
  //     setMaxCameraZoom(Math.min(maxZoom, 10));
  //     console.log('🔍 Device max zoom:', maxZoom);
  //   }
  // }, [device]);

  // Force camera to re-render with new zoom (workaround for setZoom not working) - DISABLED
  // useEffect(() => {
  //   if (cameraZoom > 1) {
  //     console.log('🔍 Re-rendering camera with zoom:', cameraZoom);
  //     setCameraKey(prev => prev + 1);
  //   }
  // }, [cameraZoom]);
  
  // 3D Model state
  const [modelScale, setModelScale] = useState(1.0);
  const [modelRotation, setModelRotation] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [showOrientationHelp, setShowOrientationHelp] = useState(false);
  
  // Measurement overlay state
  const [showMeasurements, setShowMeasurements] = useState(false);

  // Get product dimensions from product data
  const productWidth = product?.width || 0;
  const productHeight = product?.height || 0;
  
  // Get model URL from product data - handle local, TRIPO, and KIRI models
  let modelUrl = null;
  let hasModel = false;
  
  const { getLocalModelPath } = require('../../utils/localModelLoader');
 
  // DEBUG: Log all product AR data
  console.log('🔍 ViewAR: Product AR data:', JSON.stringify({
    arModelSource: product?.arModelSource,
    arModel: product?.arModel,
    arScanData: product?.arScanData,
    hasAR: product?.hasAR
  }, null, 2));

  // Debug: Check if we have TEST4 local model available
  console.log('🔍 ViewAR: TEST4 path:', getLocalModelPath('TEST4'));
  
  if (product?.arModelSource === 'local') {
    // Use local TEST4.glb model
    console.log('🏠 ViewAR: Using local TEST4.glb model');
    modelUrl = getLocalModelPath('TEST4');
    hasModel = true;
  } else if (product?.arModel) {
    // PRIORITY 1: Check arModel field directly (TRIPO stores here)
    console.log('✅ ViewAR: Found arModel directly (TRIPO):', product.arModel);
    modelUrl = product.arModel;
    hasModel = true;
  } else if (product?.arScanData?.model_url || product?.arScanData?.glbUrl || product?.arScanData?.cloudinaryUrl || product?.arScanData?.modelUrl) {
    // PRIORITY 2: Check arScanData (KIRI Engine or TRIPO fallback)
    console.log('🎯 ViewAR: Checking arScanData (KIRI Engine or TRIPO)');
    modelUrl = product?.arScanData?.model_url ||
               product?.arScanData?.glbUrl || 
               product?.arScanData?.cloudinaryUrl || 
               product?.arScanData?.modelUrl;
    hasModel = !!modelUrl;
    
    if (hasModel) {
      console.log('✅ ViewAR: Found model in arScanData:', modelUrl);
    }
  } else {
    // DEBUG: No model found - use fallback for testing
    console.log('⚠️ ViewAR: No model URL found - using fallback');
    // Use a sample model from the web for testing
    modelUrl = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
    hasModel = true;
    console.log('🔄 ViewAR: Using fallback sample model:', modelUrl);
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
  console.log('📊 Model URL (camelCase):', product?.arScanData?.modelUrl);
  console.log('📊 Model URL (underscore):', product?.arScanData?.model_url);
  console.log('📊 AR Model field:', product?.arModel);
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

  // Camera zoom handlers - DISABLED
  // const handleCameraZoomIn = useCallback(() => {
  //   console.log('🔍 Zoom In button pressed, current zoom:', cameraZoom);
  //   const newZoom = Math.min(cameraZoom + 0.5, maxCameraZoom);
  //   console.log('🔍 Setting zoom to:', newZoom, '(max:', maxCameraZoom, ')');
  //   setCameraZoom(newZoom);
  //   console.log('🔍 Zoom state updated to:', newZoom);
  // }, [cameraZoom, maxCameraZoom]);

  // const handleCameraZoomOut = useCallback(() => {
  //   console.log('🔍 Zoom Out button pressed, current zoom:', cameraZoom);
  //   const newZoom = Math.max(cameraZoom - 0.5, 1);
  //   console.log('🔍 Setting zoom to:', newZoom);
  //   setCameraZoom(newZoom);
  //   console.log('🔍 Zoom state updated to:', newZoom);
  // }, [cameraZoom]);

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
          
          <TouchableOpacity 
            style={styles.measureToggleButton} 
            onPress={() => setShowMeasurements(!showMeasurements)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name={showMeasurements ? 'checkbox' : 'checkbox-outline'} size={20} color="#FFFFFF" />
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
            enableZoomGesture={true}
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
            onInitialized={() => {
              console.log('📸 Camera initialized successfully');
            }}
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
            {/* Orientation Indicator - Only show when AR model is present */}
            <View style={[styles.orientationIndicator, {
              position: 'absolute',
              top: 100,
              right: 20,
              zIndex: 30,
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.3)'
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: 10, 
                  textAlign: 'center',
                  fontWeight: '600',
                  flex: 1
                }}>
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowOrientationHelp(true)}
                  style={{ padding: 2 }}
                >
                  <Icon name="help-circle-outline" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              {/* X Axis (Red - Left/Right) */}
              <View style={styles.axisContainer}>
                <View style={[styles.axisLine, { backgroundColor: '#FF4444' }]} />
                <Text style={[styles.axisLabel, { color: '#FF4444' }]}>X</Text>
              </View>
              
              {/* Y Axis (Green - Up/Down) */}
              <View style={styles.axisContainer}>
                <View style={[styles.axisLine, { backgroundColor: '#44FF44' }]} />
                <Text style={[styles.axisLabel, { color: '#44FF44' }]}>Y</Text>
              </View>
              
              {/* Z Axis (Blue - Forward/Backward) */}
              <View style={styles.axisContainer}>
                <View style={[styles.axisLine, { backgroundColor: '#4444FF' }]} />
                <Text style={[styles.axisLabel, { color: '#4444FF' }]}>Z</Text>
              </View>
            </View>

            <WebView
              key={`model-${product?.id}-${finalModelUrl}`}
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                    <script type="importmap">
                      {
                        "imports": {
                          "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                          "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
                        }
                      }
                    </script>
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body { 
                        margin: 0; 
                        padding: 0; 
                        background: transparent; 
                        overflow: hidden;
                        touch-action: none;
                      }
                      #canvas-container {
                        width: 100vw;
                        height: 100vh;
                        position: absolute;
                        top: 0;
                        left: 0;
                      }
                      canvas {
                        display: block;
                        width: 100%;
                        height: 100%;
                      }
                      #loading {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: white;
                        font-size: 16px;
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                        text-align: center;
                        background: rgba(0,0,0,0.7);
                        padding: 20px 30px;
                        border-radius: 10px;
                      }
                      #gizmo-container {
                        position: absolute;
                        bottom: 80px;
                        left: 50%;
                        transform: translateX(-50%);
                        display: flex;
                        gap: 10px;
                        background: rgba(0,0,0,0.7);
                        padding: 10px 15px;
                        border-radius: 25px;
                      }
                      .gizmo-btn {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        border: 2px solid;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 14px;
                        font-family: sans-serif;
                        transition: transform 0.2s;
                      }
                      .gizmo-btn:hover { transform: scale(1.1); }
                      .gizmo-btn:active { transform: scale(0.95); }
                      .gizmo-btn.active { background: rgba(255,255,255,0.5) !important; }
                      #rotate-all { border-color: #FFFFFF; background: rgba(255,255,255,0.2); color: #FFFFFF; }
                      #rotate-x { border-color: #FF4444; background: rgba(255,68,68,0.3); color: #FF4444; }
                      #rotate-y { border-color: #44FF44; background: rgba(68,255,68,0.3); color: #44FF44; }
                      #rotate-z { border-color: #4444FF; background: rgba(68,68,255,0.3); color: #4444FF; }
                      #rotate-xyz { border-color: #FFFF44; background: rgba(255,255,68,0.3); color: #FFFF44; }
                      .model-hidden {
                        opacity: 0.3;
                      }
                    </style>
                  </head>
                  <body>
                    <div id="canvas-container"></div>
                    <div id="loading">Loading 3D Model...</div>
                    <div id="gizmo-container">
                      <button class="gizmo-btn active" id="rotate-all" title="Show All">All</button>
                      <button class="gizmo-btn" id="rotate-x" title="Rotate X">X</button>
                      <button class="gizmo-btn" id="rotate-y" title="Rotate Y">Y</button>
                      <button class="gizmo-btn" id="rotate-z" title="Rotate Z">Z</button>
                      <button class="gizmo-btn" id="rotate-xyz" title="Auto Rotate">⟳</button>
                    </div>
                    
                    <script type="module">
                      import * as THREE from 'three';
                      import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
                      import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
                      import { TransformControls } from 'three/addons/controls/TransformControls.js';
                      
                      console.log('Three.js ViewAR initialized');
                      console.log('Model URL:', '${finalModelUrl}');
                      
                      let scene, camera, renderer, controls, model, transformControls;
                      let isAutoRotating = false;
                      let autoRotateSpeed = 0.5;
                      let isDragging = false;
                      let showAllGizmos = true; // Show all XYZ gizmos together by default
                      
                      const container = document.getElementById('canvas-container');
                      const loading = document.getElementById('loading');
                      
                      // Initialize Three.js scene
                      function init() {
                        // Scene
                        scene = new THREE.Scene();
                        scene.background = null; // Transparent
                        
                        // Camera
                        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
                        camera.position.set(0, 1, 3);
                        
                        // Renderer with transparency
                        renderer = new THREE.WebGLRenderer({ 
                          antialias: true, 
                          alpha: true,
                          powerPreference: 'high-performance'
                        });
                        renderer.setSize(window.innerWidth, window.innerHeight);
                        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                        renderer.outputColorSpace = THREE.SRGBColorSpace;
                        renderer.toneMapping = THREE.ACESFilmicToneMapping;
                        renderer.toneMappingExposure = 1;
                        container.appendChild(renderer.domElement);
                        
                        // Lighting
                        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
                        scene.add(ambientLight);
                        
                        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                        directionalLight.position.set(5, 5, 5);
                        scene.add(directionalLight);
                        
                        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
                        directionalLight2.position.set(-5, 3, -5);
                        scene.add(directionalLight2);
                        
                        // Orbit Controls for camera
                        controls = new OrbitControls(camera, renderer.domElement);
                        controls.enableDamping = true; // Enable for smooth movement
                        controls.dampingFactor = 0.05;
                        controls.enablePan = true;
                        controls.enableZoom = true;
                        controls.autoRotate = false; // Disable auto-rotate
                        // Set distance range: 0.5 to 3 (maps to 25cm to 150cm virtual)
                        // So 100cm threshold = 2 units
                        controls.minDistance = 0.5;
                        controls.maxDistance = 3.0;
                        
                        // Set initial camera distance to ~50cm virtual (1 unit)
                        camera.position.set(0, 0.5, 1);
                        controls.update();
                        
                        // Stop any model movement when not interacting
                        controls.addEventListener('start', () => { isDragging = true; });
                        controls.addEventListener('end', () => { isDragging = false; });
                        
                        // Transform Controls for model rotation
                        transformControls = new TransformControls(camera, renderer.domElement);
                        transformControls.setMode('rotate');
                        transformControls.space = 'local';
                        scene.add(transformControls);
                        
                        // Set transform controls colors
                        transformControls.axisColors = {
                          X: 0xFF4444,
                          Y: 0x44FF44,
                          Z: 0x4444FF
                        };
                        
                        // Event listeners for gizmo buttons
                        function updateButtonStates() {
                          document.querySelectorAll('.gizmo-btn').forEach(btn => btn.classList.remove('active'));
                          if (isAutoRotating) {
                            document.getElementById('rotate-xyz').classList.add('active');
                          } else if (showAllGizmos) {
                            document.getElementById('rotate-all').classList.add('active');
                          }
                        }

                        document.getElementById('rotate-all').addEventListener('click', () => {
                          showAllGizmos = !showAllGizmos;
                          if (showAllGizmos) {
                            transformControls.showX = true;
                            transformControls.showY = true;
                            transformControls.showZ = true;
                            transformControls.attach(model);
                          }
                          updateButtonStates();
                        });
                        
                        document.getElementById('rotate-x').addEventListener('click', () => {
                          showAllGizmos = false;
                          transformControls.showX = !transformControls.showX;
                          transformControls.showY = false;
                          transformControls.showZ = false;
                          if (transformControls.showX) {
                            transformControls.attach(model);
                          } else {
                            transformControls.detach();
                          }
                          updateButtonStates();
                        });
                        
                        document.getElementById('rotate-y').addEventListener('click', () => {
                          showAllGizmos = false;
                          transformControls.showX = false;
                          transformControls.showY = !transformControls.showY;
                          transformControls.showZ = false;
                          if (transformControls.showY) {
                            transformControls.attach(model);
                          } else {
                            transformControls.detach();
                          }
                          updateButtonStates();
                        });
                        
                        document.getElementById('rotate-z').addEventListener('click', () => {
                          showAllGizmos = false;
                          transformControls.showX = false;
                          transformControls.showY = false;
                          transformControls.showZ = !transformControls.showZ;
                          if (transformControls.showZ) {
                            transformControls.attach(model);
                          } else {
                            transformControls.detach();
                          }
                          updateButtonStates();
                        });
                        
                        document.getElementById('rotate-xyz').addEventListener('click', () => {
                          isAutoRotating = !isAutoRotating;
                          if (isAutoRotating) {
                            transformControls.detach();
                            // Hide all gizmos when auto-rotating
                            transformControls.showX = false;
                            transformControls.showY = false;
                            transformControls.showZ = false;
                          } else {
                            // Show all gizmos when stopping auto-rotate
                            transformControls.showX = true;
                            transformControls.showY = true;
                            transformControls.showZ = true;
                            transformControls.attach(model);
                          }
                          updateButtonStates();
                        });
                        
                        // Disable orbit controls when using transform controls
                        transformControls.addEventListener('dragging-changed', function (event) {
                          controls.enabled = !event.value;
                          isDragging = event.value;
                        });
                        
                        // Track when user is interacting with orbit controls
                        renderer.domElement.addEventListener('pointerdown', () => { isDragging = true; });
                        renderer.domElement.addEventListener('pointerup', () => { isDragging = false; });
                        
                        // Load model
                        loadModel();
                        
                        // Animation loop
                        animate();
                        
                        // Handle resize
                        window.addEventListener('resize', onWindowResize);
                      }
                      
                      function toggleTransformMode(mode) {
                        transformControls.setMode(mode);
                        if (model) {
                          transformControls.attach(model);
                        }
                      }
                      
                      function loadModel() {
                        const loader = new GLTFLoader();
                        const modelUrl = '${finalModelUrl}';
                        
                        console.log('Loading model from:', modelUrl);
                        console.log('Model URL is empty?', !modelUrl);
                        
                        if (!modelUrl || modelUrl === 'null' || modelUrl === 'undefined') {
                          loading.textContent = 'No 3D model available for this product';
                          console.error('No model URL provided');
                          return;
                        }
                        
                        loader.load(
                          modelUrl,
                          (gltf) => {
                            model = gltf.scene;
                            
                            // Center and scale the model
                            const box = new THREE.Box3().setFromObject(model);
                            const center = box.getCenter(new THREE.Vector3());
                            const size = box.getSize(new THREE.Vector3());
                            
                            // Reset model position to center
                            model.position.sub(center);
                            
                            // Scale to fit
                            const maxDim = Math.max(size.x, size.y, size.z);
                            const scale = 1 / maxDim;
                            model.scale.setScalar(scale * 0.8);
                            
                            scene.add(model);
                            
                            // Attach transform controls
                            transformControls.attach(model);
                            
                            // Set OrbitControls target to model position
                            controls.target.copy(model.position);
                            
                            loading.style.display = 'none';
                            console.log('Model loaded successfully!');
                            
                            // Set initial gizmo state - show all XYZ
                            transformControls.showX = true;
                            transformControls.showY = true;
                            transformControls.showZ = true;
                            
                            // Send message to React Native
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'modelLoaded',
                              success: true
                            }));
                          },
                          (progress) => {
                            if (progress.lengthComputable) {
                              const percent = (progress.loaded / progress.total * 100).toFixed(0);
                              loading.textContent = 'Loading ' + percent + '%';
                            }
                          },
                          (error) => {
                            console.error('Error loading model:', error);
                            loading.textContent = 'Error loading 3D model';
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'modelError',
                              error: error.message
                            }));
                          }
                        );
                      }
                      
                      function onWindowResize() {
                        camera.aspect = window.innerWidth / window.innerHeight;
                        camera.updateProjectionMatrix();
                        renderer.setSize(window.innerWidth, window.innerHeight);
                      }
                      
                      function animate() {
                        requestAnimationFrame(animate);
                        
                        // Always update controls
                        controls.update();
                        
                        renderer.render(scene, camera);
                      }
                      
                      // Initialize
                      init();
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
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  console.log('📨 WebView message:', data);
                  
                  if (data.type === 'modelLoaded') {
                    setModelLoaded(true);
                    console.log('✅ Three.js model loaded successfully');
                  } else if (data.type === 'modelError') {
                    console.error('❌ Three.js model error:', data.error);
                  }
                } catch (e) {
                  console.log('📨 WebView text message:', event.nativeEvent.data);
                }
              }}
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
            
            {/* Measurement Overlay */}
            {showMeasurements && (
              <View style={styles.measurementOverlay}>
                {/* Horizontal Line (Width) */}
                <View style={[styles.measurementLine, styles.horizontalLine]} />
                
                {/* Vertical Line (Height) */}
                <View style={[styles.measurementLine, styles.verticalLine]} />
                
                {/* Width Label - on horizontal line */}
                <View style={[styles.measurementLabel, styles.widthLabel]}>
                  <Text style={styles.measurementLabelText}>
                    W: {productWidth ? `${productWidth} cm` : 'N/A'}
                  </Text>
                </View>
                
                {/* Height Label - on vertical line */}
                <View style={[styles.measurementLabel, styles.heightLabel]}>
                  <Text style={styles.measurementLabelText}>
                    H: {productHeight ? `${productHeight} cm` : 'N/A'}
                  </Text>
                </View>
                
                {/* Corner Indicators */}
                <View style={[styles.cornerIndicator, styles.cornerTopLeft]} />
                <View style={[styles.cornerIndicator, styles.cornerTopRight]} />
                <View style={[styles.cornerIndicator, styles.cornerBottomLeft]} />
                <View style={[styles.cornerIndicator, styles.cornerBottomRight]} />
              </View>
            )}
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

      {/* Orientation Help Modal */}
      <Modal
        visible={showOrientationHelp}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOrientationHelp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.instructionsModal}>
            <View style={styles.instructionsHeader}>
              <Text style={styles.instructionsTitle}>3D Object Orientation</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowOrientationHelp(false)}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.instructionsContent}>
              <Text style={[styles.instructionText, { 
                fontSize: 14, 
                marginBottom: 15,
                textAlign: 'center',
                fontWeight: '500'
              }]}>
                Understanding the 3D coordinate system:
              </Text>
              
              <View style={styles.instructionItem}>
                <View style={[styles.axisLine, { backgroundColor: '#FF4444', width: 24 }]} />
                <Text style={styles.instructionText}>
                  <Text style={{ fontWeight: 'bold', color: '#FF4444' }}>X-Axis (Red)</Text> - Left/Right orientation
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <View style={[styles.axisLine, { backgroundColor: '#44FF44', width: 24 }]} />
                <Text style={styles.instructionText}>
                  <Text style={{ fontWeight: 'bold', color: '#44FF44' }}>Y-Axis (Green)</Text> - Up/Down orientation
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <View style={[styles.axisLine, { backgroundColor: '#4444FF', width: 24 }]} />
                <Text style={styles.instructionText}>
                  <Text style={{ fontWeight: 'bold', color: '#4444FF' }}>Z-Axis (Blue)</Text> - Forward/Backward orientation
                </Text>
              </View>
              
              <Text style={[styles.instructionText, { 
                fontSize: 12, 
                marginTop: 15,
                textAlign: 'center',
                color: '#666',
                fontStyle: 'italic'
              }]}>
                This helps you understand how the 3D object is positioned in space relative to your device.
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.gotItButton}
              onPress={() => setShowOrientationHelp(false)}
            >
              <Text style={styles.gotItButtonText}>Understood!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
