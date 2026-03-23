import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Modal,
  Image,
  SafeAreaView,
  DeviceEventEmitter,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
const { width, height } = Dimensions.get('window');

const ARViewer = ({ route, navigation }) => {
  console.log('🎯 ARViewer component is loading...');
  console.log('📊 Route params:', route?.params);
  
  const { 
    productId,
    modelUrl, 
    modelPath, 
    productName,
    arModelUrl,  // Alternative parameter name
    scanData,     // Alternative parameter name
    productHeight, // Product height from database
    productWidth   // Product width from database
  } = route.params || {};
  
  // Debug height and width
  console.log('📏 ARViewer received - productHeight:', productHeight, 'productWidth:', productWidth);
  
  // Debug logging
  console.log('🎯 ARViewer loaded with params:', {
    productId,
    modelUrl,
    arModelUrl,
    productName,
    scanData: scanData ? {
      glbUrl: scanData.glbUrl,
      cloudinaryUrl: scanData.cloudinaryUrl,
      modelUrl: scanData.modelUrl
    } : null
  });
  
  // Get the actual model URL from various sources
  const actualModelUrl = modelUrl || 
                        arModelUrl || 
                        scanData?.glbUrl || 
                        scanData?.cloudinaryUrl || 
                        scanData?.modelUrl;
  
  // Log Supabase storage source
  console.log('📦 ARViewer Model Source: Supabase Storage');
  console.log('🔗 Model URL:', actualModelUrl);
  console.log('📋 Storage Type:', scanData?.storage || 'supabase');
  
  // Get the actual product name from various sources
  const actualProductName = productName || 
                            scanData?.productName || 
                            route.params?.productName || 
                            '3D Model';

  // Camera setup - Enhanced device detection
  const devices = useCameraDevices();
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef(null);
  const webViewRef = useRef(null);
  
  // Enhanced device detection (same as CustomCamera.jsx)
  let device = null;
  
  // Method 1: Direct access
  if (devices?.back) {
    device = devices.back;
    console.log('✅ ARViewer: Found device via devices.back');
  }
  // Method 2: Array access
  else if (devices?.devices && Array.isArray(devices.devices)) {
    device = devices.devices.find(d => d.position === 'back');
    console.log('✅ ARViewer: Found device via devices.devices array');
  }
  // Method 3: Object iteration
  else if (devices && typeof devices === 'object') {
    const deviceKeys = Object.keys(devices);
    console.log('🔍 ARViewer: Device keys to check:', deviceKeys);
    
    for (const key of deviceKeys) {
      const deviceObj = devices[key];
      if (deviceObj && typeof deviceObj === 'object' && deviceObj.position === 'back') {
        device = deviceObj;
        console.log('✅ ARViewer: Found device via key:', key);
        break;
      }
    }
  }
  
  // Fallback to any available device
  if (!device && devices) {
    const deviceKeys = Object.keys(devices);
    if (deviceKeys.length > 0) {
      device = devices[deviceKeys[0]];
      console.log('🔄 ARViewer: Using fallback device:', deviceKeys[0]);
    }
  }
  
  // State management
  const [isActive, setIsActive] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [flashMode, setFlashMode] = useState('off');
  const [cameraPosition, setCameraPosition] = useState('back');
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [modelPlaced, setModelPlaced] = useState(true);
  const [modelScale, setModelScale] = useState(1.0);
  const [modelRotation, setModelRotation] = useState(0);
  const [showGizmo, setShowGizmo] = useState(false);
  const [showMeasurement, setShowMeasurement] = useState(false);
  const [webViewLoaded, setWebViewLoaded] = useState(false);

  // Debug logging
  console.log('🎯 ARViewer loaded with params:', {
    modelUrl,
    arModelUrl,
    productName,
    scanData: scanData ? {
      glbUrl: scanData.glbUrl,
      cloudinaryUrl: scanData.cloudinaryUrl,
      modelUrl: scanData.modelUrl
    } : null,
    actualModelUrl,
    actualProductName
  });

  // Hide tab bar when component mounts - Option 2 approach
  useEffect(() => {
    const parent = navigation.getParent();
    console.log('🎯 ARViewer: Parent navigator found:', !!parent);
    console.log('🎯 Parent route names:', parent?.getState()?.routeNames);
    
    if (parent) {
      // Check if this parent contains the tab bar (has the 5 tab routes)
      const routeNames = parent.getState()?.routeNames || [];
      const hasTabBar = routeNames.includes('Home') && routeNames.includes('Profile');
      console.log('🎯 Has tab bar routes:', hasTabBar);
      
      if (hasTabBar) {
        console.log('🎯 Hiding tab bar via parent navigator');
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }
    }

    // Cleanup: restore tab bar when leaving
    return () => {
      if (parent) {
        const routeNames = parent.getState()?.routeNames || [];
        const hasTabBar = routeNames.includes('Home') && routeNames.includes('Profile');
        
        if (hasTabBar) {
          console.log('🎯 ARViewer: Restoring tab bar');
          parent.setOptions({
            tabBarStyle: { display: 'flex' },
          });
        }
      }
    };
  }, [navigation]);

  // Update measurements when model scale changes
  useEffect(() => {
    if (webViewRef.current && webViewLoaded && showMeasurement) {
      const measureScale = 0.05;
      const scaledHeight = (productHeight || modelScale) * measureScale;
      const scaledWidth = (productWidth || modelScale) * measureScale;
      
      // Update measurement lines in Three.js
      const jsCode = `
        if (window.measurementGroup) {
          // Update height line positions
          const heightLine = window.measurementGroup.children[0];
          if (heightLine) {
            const positions = heightLine.geometry.attributes.position.array;
            positions[1] = -${scaledHeight}/2;
            positions[4] = ${scaledHeight}/2;
            heightLine.geometry.attributes.position.needsUpdate = true;
          }
          // Update height caps
          const heightCap1 = window.measurementGroup.children[1];
          const heightCap2 = window.measurementGroup.children[2];
          if (heightCap1) {
            const cap1Pos = heightCap1.geometry.attributes.position.array;
            cap1Pos[1] = -${scaledHeight}/2;
            cap1Pos[4] = -${scaledHeight}/2;
            heightCap1.geometry.attributes.position.needsUpdate = true;
          }
          if (heightCap2) {
            const cap2Pos = heightCap2.geometry.attributes.position.array;
            cap2Pos[1] = ${scaledHeight}/2;
            cap2Pos[4] = ${scaledHeight}/2;
            heightCap2.geometry.attributes.position.needsUpdate = true;
          }
          
          // Update width line positions
          const widthLine = window.measurementGroup.children[3];
          if (widthLine) {
            const widthPos = widthLine.geometry.attributes.position.array;
            widthPos[0] = -${scaledWidth}/2;
            widthPos[3] = ${scaledWidth}/2;
            widthLine.geometry.attributes.position.needsUpdate = true;
          }
          console.log('Measurements updated to scale:', ${modelScale});
        }
      `;
      webViewRef.current.injectJavaScript(jsCode);
    }
  }, [modelScale, showMeasurement, webViewLoaded, productHeight, productWidth]);

  // Frame processor removed - not needed for basic AR functionality
  // Model is auto-placed (no tap to place required)

  // Handle AR confirmation
  const handleConfirmAR = () => {
    console.log('🎯 AR Confirmation requested');
    console.log('📊 Model URL:', actualModelUrl);
    console.log('📊 Product ID:', productId);
    console.log('📊 Product Name:', actualProductName);
    
    // Fallback productId if not provided
    const finalProductId = productId || 'temp-product-' + Date.now();
    
    Alert.alert(
      'AR Model Created',
      `AR model for "${actualProductName}" has been successfully created and is ready for use.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Confirm',
          onPress: () => {
            console.log('✅ AR Model confirmed for product:', finalProductId);
            
            // Store AR data temporarily in AsyncStorage for later linking
            const arData = {
              productId: finalProductId,
              productName: actualProductName,
              modelUrl: actualModelUrl,
              scanData: scanData,
              confirmed: true,
              timestamp: new Date().toISOString()
            };
            
            // Store in AsyncStorage for later retrieval
            AsyncStorage.setItem('pending_ar_data', JSON.stringify(arData))
              .then(() => {
                console.log('💾 AR data stored temporarily in AsyncStorage');
              })
              .catch((error) => {
                console.error('❌ Failed to store AR data:', error);
              });
            
            // Emit event to notify UploadItem.jsx that AR is confirmed
            DeviceEventEmitter.emit('AR_MODEL_CONFIRMED', arData);
            
            console.log('📡 AR confirmation event emitted');
            navigation.goBack();
          }
        }
      ]
    );
  };

  // Handle scale adjustment - reloads WebView with new scale
  const handleScaleAdjust = (direction) => {
    const newScale = direction === 'up' ? modelScale * 1.2 : modelScale * 0.8;
    const clampedScale = Math.max(0.2, Math.min(5.0, newScale));
    setModelScale(clampedScale);
    console.log('🎯 Model scale adjusted to:', clampedScale);
  };

  // Handle rotation adjustment - reloads WebView with new rotation  
  const handleRotationAdjust = (direction) => {
    const newRotation = direction === 'left' ? modelRotation - 30 : modelRotation + 30;
    setModelRotation(newRotation);
    console.log('🎯 Model rotation adjusted to:', newRotation);
  };


  // Toggle flash
  const toggleFlash = () => {
    setFlashMode(flashMode === 'off' ? 'on' : 'off');
  };

  // Switch camera
  const switchCamera = () => {
    setCameraPosition(cameraPosition === 'back' ? 'front' : 'back');
  };

  // Render AR overlay with 3D model using Three.js
  const renderAROverlay = () => {
    if (!actualModelUrl) {
      return (
        <View style={styles.noModelContainer}>
          <Icon name="cube-outline" size={60} color="rgba(255,255,255,0.5)" />
          <Text style={styles.noModelText}>No 3D Model Available</Text>
          <Text style={styles.noModelSubtext}>Model URL not found</Text>
        </View>
      );
    }

    // Generate Three.js HTML for 3D model viewer
    const generateThreeJSHTML = (modelUrl, scale, rotation, productHeight, productWidth) => {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      overflow: hidden; 
      background: transparent;
      touch-action: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    #container { width: 100vw; height: 100vh; touch-action: none; }
    canvas { display: block; touch-action: none; }
    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #FF8B47;
      font-size: 16px;
      text-align: center;
      background: rgba(0,0,0,0.7);
      padding: 20px;
      border-radius: 10;
    }
    #error {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #ff4444;
      font-size: 14px;
      text-align: center;
      background: rgba(0,0,0,0.7);
      padding: 20px;
      border-radius: 10;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="loading">Loading 3D Model...</div>
  <div id="error" style="display: none;"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

  <script>
    // Scene setup
    const container = document.getElementById('container');
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background for AR with camera

    // Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 3);

    // Renderer with transparency - no shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = false; // No shadows
    // Transparent when camera available, dark when not
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Controls - Enable pan for moving model
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 15;
    controls.enablePan = true;
    controls.panSpeed = 0.5;
    controls.enableZoom = true;
    controls.enableRotate = true;
    // Touch gestures
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    // Lights - Enhanced for better model visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(0, -5, -5);
    scene.add(backLight);

    // Create Rotating XYZ Orientation Gizmo - surrounds the model
    const gizmoGroup = new THREE.Group();
    const gizmoRadius = 1.5;
    
    // X ring (red) - rotates around X axis
    const xRingGeom = new THREE.TorusGeometry(gizmoRadius, 0.015, 8, 64);
    const xRingMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const xRing = new THREE.Mesh(xRingGeom, xRingMat);
    
    // Y ring (green) - rotates around Y axis
    const yRingGeom = new THREE.TorusGeometry(gizmoRadius, 0.015, 8, 64);
    const yRingMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yRing = new THREE.Mesh(yRingGeom, yRingMat);
    yRing.rotation.x = Math.PI / 2;
    
    // Z ring (blue) - rotates around Z axis
    const zRingGeom = new THREE.TorusGeometry(gizmoRadius, 0.015, 8, 64);
    const zRingMat = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const zRing = new THREE.Mesh(zRingGeom, zRingMat);
    zRing.rotation.y = Math.PI / 2;
    
    gizmoGroup.add(xRing);
    gizmoGroup.add(yRing);
    gizmoGroup.add(zRing);
    
    // Add axis labels
    function createLabel(text, color, position) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 32, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(position);
      sprite.scale.set(0.3, 0.3, 0.3);
      return sprite;
    }
    
    // Add X, Y, Z labels at the ends of each axis
    gizmoGroup.add(createLabel('X', '#ff0000', new THREE.Vector3(gizmoRadius + 0.3, 0, 0)));
    gizmoGroup.add(createLabel('Y', '#00ff00', new THREE.Vector3(0, gizmoRadius + 0.3, 0)));
    gizmoGroup.add(createLabel('Z', '#0000ff', new THREE.Vector3(0, 0, gizmoRadius + 0.3)));
    
    scene.add(gizmoGroup);

    // Store gizmo reference for rotation animation
    window.gizmo = gizmoGroup;
    
    // Initially hide gizmo
    gizmoGroup.visible = false;
    
    // ============================================
    // Create Measurement Visualization (Height & Width)
    // ============================================
    const measurementGroup = new THREE.Group();
    
    // Get product dimensions from passed data
    // These values come from React Native as parameters
    const passedHeight = '${productHeight}';
    const passedWidth = '${productWidth}';
    console.log('📏 Three.js received - passedHeight:', passedHeight, 'passedWidth:', passedWidth);
    // Scale down cm to Three.js units (divide by 20 to fit the model)
    const measureScale = 0.05; 
    const productHeight = ((passedHeight && passedHeight !== 'undefined' && passedHeight !== 'null') ? parseFloat(passedHeight) : ${modelScale}) * measureScale;
    const productWidth = ((passedWidth && passedWidth !== 'undefined' && passedWidth !== 'null') ? parseFloat(passedWidth) : ${modelScale}) * measureScale;
    console.log('📏 Three.js scaled - productHeight:', productHeight, 'productWidth:', productWidth);
    const displayHeight = productHeight; // Use scaled values
    const displayWidth = productWidth;
    
    // Height line (vertical dimension) - YELLOW - positioned around model center
    // Extend the line a bit beyond the model for visibility
    const heightPadding = 0.15;
    const heightLineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-displayWidth/2 - heightPadding, -displayHeight/2 - heightPadding, 0),
      new THREE.Vector3(-displayWidth/2 - heightPadding, displayHeight/2 + heightPadding, 0)
    ]);
    const heightLine = new THREE.Line(heightLineGeom, new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 2 }));
    
    // Height end caps - extended for visibility
    const heightCapPadding = 0.1;
    const heightCap1Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-displayWidth/2 - heightPadding - 0.1, -displayHeight/2 - heightPadding, 0),
      new THREE.Vector3(-displayWidth/2 - heightPadding + 0.1, -displayHeight/2 - heightPadding, 0)
    ]);
    const heightCap1 = new THREE.Line(heightCap1Geom, new THREE.LineBasicMaterial({ color: 0xFFFF00 }));
    
    const heightCap2Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-displayWidth/2 - heightPadding - 0.1, displayHeight/2 + heightPadding, 0),
      new THREE.Vector3(-displayWidth/2 - heightPadding + 0.1, displayHeight/2 + heightPadding, 0)
    ]);
    const heightCap2 = new THREE.Line(heightCap2Geom, new THREE.LineBasicMaterial({ color: 0xFFFF00 }));
    
    measurementGroup.add(heightLine);
    measurementGroup.add(heightCap1);
    measurementGroup.add(heightCap2);
    
    // Width line (horizontal dimension) - CYAN - extended for visibility
    const widthPadding = 0.15;
    const widthLineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-displayWidth/2 - widthPadding, -widthPadding, 0),
      new THREE.Vector3(displayWidth/2 + widthPadding, -widthPadding, 0)
    ]);
    const widthLine = new THREE.Line(widthLineGeom, new THREE.LineBasicMaterial({ color: 0x00FFFF, linewidth: 2 }));
    
    // Width end caps - extended
    const widthCap1Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-displayWidth/2 - widthPadding, -widthPadding - 0.05, 0),
      new THREE.Vector3(-displayWidth/2 - widthPadding, -widthPadding + 0.05, 0)
    ]);
    const widthCap1 = new THREE.Line(widthCap1Geom, new THREE.LineBasicMaterial({ color: 0x00FFFF }));
    
    const widthCap2Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(displayWidth/2 + widthPadding, -widthPadding - 0.05, 0),
      new THREE.Vector3(displayWidth/2 + widthPadding, -widthPadding + 0.05, 0)
    ]);
    const widthCap2 = new THREE.Line(widthCap2Geom, new THREE.LineBasicMaterial({ color: 0x00FFFF }));
    
    measurementGroup.add(widthLine);
    measurementGroup.add(widthCap1);
    measurementGroup.add(widthCap2);
    
    // Add measurement labels
    function createMeasurementLabel(text, color, position) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(position);
      sprite.scale.set(0.8, 0.4, 1);
      return sprite;
    }
    
    // Height label (yellow) - positioned at middle of height line, to the left
    const displayHeightCm = (${productHeight || modelScale} / measureScale).toFixed(1);
    const displayWidthCm = (${productWidth || modelScale} / measureScale).toFixed(1);
    measurementGroup.add(createMeasurementLabel('H: ' + displayHeightCm + 'cm', '#FFFF00', new THREE.Vector3(-displayWidth/2 - heightPadding - 0.25, 0, 0)));
    
    // Width label (cyan) - positioned below the width line
    measurementGroup.add(createMeasurementLabel('W: ' + displayWidthCm + 'cm', '#00FFFF', new THREE.Vector3(0, -widthPadding - 0.25, 0)));
    
    scene.add(measurementGroup);
    
    // Store measurement reference
    window.measurementGroup = measurementGroup;
    measurementGroup.visible = false;

    // NO ground plane or grid - floating model in space

    // Load model
    const modelUrl = '${modelUrl}';
    const modelScale = ${scale};
    const modelRotation = ${rotation};
    let currentModel = null;
    
    console.log('Loading model from:', modelUrl);
    console.log('Initial scale:', modelScale);
    console.log('Initial rotation:', modelRotation);
    
    if (modelUrl) {
      const loader = new THREE.GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          currentModel = model; // Store reference for updates
          
          // Center and scale model - float in space (no ground)
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          const maxDim = Math.max(size.x, size.y, size.z);
          const scaleFactor = (1.5 / maxDim) * modelScale;
          model.scale.setScalar(scaleFactor);
          
          // Center model and float it in space
          model.position.sub(center);
          model.position.y = 0; // Float at center, no ground
          
          // Apply rotation
          model.rotation.y = THREE.MathUtils.degToRad(modelRotation);
          
          // No shadows - floating model
          model.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = false;
              node.receiveShadow = false;
            }
          });
          
          scene.add(model);
          
          document.getElementById('loading').style.display = 'none';
          console.log('3D Model loaded successfully');
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'modelLoaded' }));
        },
        (progress) => {
          const percent = (progress.loaded / progress.total * 100).toFixed(0);
          document.getElementById('loading').textContent = 'Loading... ' + percent + '%';
        },
        (error) => {
          console.error('Error loading model:', error);
          document.getElementById('loading').style.display = 'none';
          document.getElementById('error').style.display = 'block';
          document.getElementById('error').textContent = 'Error loading 3D model';
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'modelError', error: error.message }));
        }
      );
    } else {
      document.getElementById('loading').textContent = 'No model URL provided';
    }

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      
      // Rotate the gizmo around the model to show orientation (only when visible)
      if (window.gizmo && window.gizmo.visible) {
        window.gizmo.rotation.y += 0.005; // Slow rotation around Y
        window.gizmo.rotation.x += 0.002; // Slight X rotation
      }
      
      renderer.render(scene, camera);
    }
    animate();
    console.log('Animation loop started');

    // Handle resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>
      `.trim();
    };

    return (
      <View style={styles.arOverlay}>
        {/* 3D Model WebView with Three.js */}
        <WebView
          ref={webViewRef}
          source={{
            html: generateThreeJSHTML(actualModelUrl, modelScale, modelRotation, productHeight, productWidth)
          }}
          style={styles.modelWebView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scrollEnabled={false}
          bounces={false}
          keyboardDisplayRequiresUserAction={false}
          hideKeyboardAccessoryView={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          originWhitelist={['*']}
          urlWhitelist={['*']}
          androidLayerType="hardware"
          overScrollMode="never"
          onLoadEnd={() => {
            console.log('✅ WebView loaded - Three.js should be running');
            setWebViewLoaded(true);
          }}
          onError={(error) => {
            console.error('❌ WebView error:', error);
          }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              console.log('Three.js WebView message:', data);
              if (data.type === 'modelLoaded') {
                console.log('✅ 3D Model loaded successfully');
              } else if (data.type === 'modelError') {
                console.error('❌ 3D Model error:', data.error);
              }
            } catch (e) {
              console.log('WebView message:', event.nativeEvent.data);
            }
          }}
        />
      </View>
    );
  };

  // Render AR controls
  const renderARControls = () => {
    return (
      <View style={styles.arControls}>
        {/* Top Controls */}
        <View style={[styles.topControls, { backgroundColor: 'transparent', paddingTop: 40 }]}>
          <TouchableOpacity 
            style={styles.controlButton}
            activeOpacity={0.7}
            onPressIn={() => console.log('Close button pressed IN')}
            onPress={() => {
              console.log('Close button pressed');
              navigation.goBack();
            }}
          >
            <Icon name="close" size={28} color="white" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{actualProductName}</Text>
          </View>
          
          {/* Gizmo Toggle Button */}
          <TouchableOpacity 
            style={[styles.controlButton, showGizmo && { backgroundColor: '#FF8B47' }]}
            activeOpacity={0.7}
            onPressIn={() => console.log('Gizmo button pressed IN')}
            onPress={() => {
              console.log('Gizmo button pressed, webViewLoaded:', webViewLoaded);
              const newShowGizmo = !showGizmo;
              setShowGizmo(newShowGizmo);
              
              if (webViewRef.current && webViewLoaded) {
                const jsCode = `if(window.gizmo){window.gizmo.visible=${newShowGizmo};console.log('Gizmo toggled to '+${newShowGizmo});}else{console.log('Gizmo not found');}true;`;
                console.log('Injecting JS:', jsCode);
                webViewRef.current.injectJavaScript(jsCode);
              } else {
                console.log('WebView not ready, gizmo state:', newShowGizmo);
              }
            }}
          >
            <Icon name="globe" size={24} color="white" />
          </TouchableOpacity>
          
          {/* Measurement Toggle Button */}
          <TouchableOpacity 
            style={[styles.controlButton, showMeasurement && { backgroundColor: '#FF8B47' }]}
            activeOpacity={0.7}
            onPressIn={() => console.log('Measurement button pressed IN')}
            onPress={() => {
              console.log('Measurement button pressed, webViewLoaded:', webViewLoaded);
              const newShowMeasurement = !showMeasurement;
              setShowMeasurement(newShowMeasurement);
              
              if (webViewRef.current && webViewLoaded) {
                const height = productHeight || 0;
                const width = productWidth || 0;
                const jsCode = `if(window.measurementGroup){window.measurementGroup.visible=${newShowMeasurement};console.log('Measurement toggled to '+${newShowMeasurement});}else{console.log('Measurement not found');}true;`;
                console.log('Injecting JS:', jsCode, 'height:', height, 'width:', width);
                webViewRef.current.injectJavaScript(jsCode);
              } else {
                console.log('WebView not ready, measurement state:', newShowMeasurement);
              }
            }}
          >
            <Icon name="speedometer" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Bottom Controls - Hidden - no buttons needed */}
        <View style={[styles.bottomControls, { opacity: 0 }]}>
          <View style={styles.horizontalControls} />
        </View>
      </View>
    );
  };

  // Render model info modal
  const renderModelInfo = () => {
    return (
      <Modal
        visible={showModelInfo}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModelInfo(false)}
      >
        <View style={styles.infoOverlay}>
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>3D Model Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{actualProductName}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Source:</Text>
              <Text style={styles.infoValue}>KIRI Engine</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Scale:</Text>
              <Text style={styles.infoValue}>{modelScale.toFixed(1)}x</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rotation:</Text>
              <Text style={styles.infoValue}>{modelRotation}°</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowModelInfo(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Debug camera setup
  console.log('🎯 ARViewer Camera Debug:');
  console.log('📊 Available devices:', devices);
  console.log('📊 Back device:', devices?.back);
  console.log('📊 Front device:', devices?.front);
  console.log('📊 Device keys:', Object.keys(devices || {}));
  console.log('📊 Selected device:', device);
  console.log('📊 Has permission:', hasPermission);

  if (!hasPermission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Requesting Camera Permission...</Text>
        <Text style={styles.loadingText}>Please allow camera access to use AR Viewer</Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    console.log('❌ ARViewer: No camera device available');
    console.log('📊 Available devices:', devices);
    console.log('📊 Device keys:', Object.keys(devices || {}));
    
    // Fallback: Show 3D model without camera
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        
        {/* No Camera - Just show 3D model */}
        <View style={styles.camera} />
        
        {/* AR Overlay with 3D Model */}
        {renderAROverlay()}
        
        {/* AR Controls */}
        {renderARControls()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Camera Feed */}
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={isActive}
        flash={flashMode}
        pointerEvents="none"
      />
      
      {/* AR Overlay with 3D Model */}
      {renderAROverlay()}
      
      {/* AR Controls */}
      {renderARControls()}
      
      {/* Model Info Modal */}
      {renderModelInfo()}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
  },
  arOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  modelWebView: {
    flex: 1,
    backgroundColor: 'transparent',
    pointerEvents: 'auto',
  },
  modelLoadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 10,
  },
  modelLoadingText: {
    color: 'white',
    fontSize: 14,
    marginTop: 10,
  },
  noModelContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 30,
    borderRadius: 15,
    width: 200,
  },
  noModelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  noModelSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  arControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  controlButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
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
  placementGuide: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -100 }],
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 30,
    width: 300,
  },
  placementText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
  },
  placementSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  horizontalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  cameraButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  interactionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  interactionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  confirmButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)',
    alignSelf: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  infoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 20,
    maxWidth: 400,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ARViewer;
