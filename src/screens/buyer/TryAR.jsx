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
import RNFS from 'react-native-fs';
import { getLocalModelPath } from '../../utils/modelLoader';
import styles from './styles/TryAR.style';

const { width, height } = Dimensions.get('window');

export default function TryAR({ navigation }) {
  console.log('🎯 TryAR screen loaded with CustomCamera approach');
  
  const cameraRef = useRef(null);
  const webViewRef = useRef(null);
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
  const [modelPath, setModelPath] = useState(null);
  
  useEffect(() => {
    const loadModel = async () => {
      // Force reload to get the latest GLB file
      const path = await getLocalModelPath(true);
      console.log('🎯 TryAR: Model path being used (first 100 chars):', path.substring(0, 100));
      console.log('🎯 TryAR: Model data URL length:', path.length);
      setModelPath(path);
    };
    loadModel();
  }, []);

  // State for base64 model data
  const [modelData, setModelData] = useState(null);
  
  // Load model as base64 when component mounts
  useEffect(() => {
    const loadModelData = async () => {
      try {
        console.log('📦 Loading GLB file as base64 for WebView...');
        const base64 = await RNFS.readFileAssets('TEST1.glb', 'base64');
        console.log('✅ Base64 loaded, size:', Math.round(base64.length / 1024 / 1024 * 10) / 10, 'MB');
        console.log('✅ Setting modelData state - this will trigger WebView render');
        setModelData(base64);
      } catch (error) {
        console.error('❌ Error loading model data:', error);
        // Fallback to a sample model URL
        console.log('⚠️ Using fallback - setting modelData to "fallback"');
        setModelData('fallback');
      }
    };
    loadModelData();
  }, []);
  
  // Debug when modelData changes
  useEffect(() => {
    if (modelData) {
      console.log('🎨 modelData state updated, length:', modelData === 'fallback' ? 'fallback' : modelData.length);
    }
  }, [modelData]);
  
  // Function to send model data to WebView in chunks
  const sendModelChunks = useCallback(() => {
    if (!modelData || !webViewRef.current) {
      console.log('⚠️ Cannot send chunks - modelData or webViewRef missing');
      return;
    }
    
    console.log('📤 Starting to send model chunks to WebView...');
    
    const chunkSize = 500000; // 500KB chunks (smaller for reliability)
    const totalChunks = Math.ceil(modelData.length / chunkSize);
    
    console.log('📤 Total chunks to send:', totalChunks);
    
    // Send chunks one by one with a small delay
    let chunkIndex = 0;
    const sendNextChunk = () => {
      if (chunkIndex < totalChunks) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, modelData.length);
        const chunk = modelData.substring(start, end);
        
        const message = JSON.stringify({
          type: 'model_chunk',
          chunk: chunk,
          index: chunkIndex + 1,
          total: totalChunks
        });
        
        webViewRef.current.postMessage(message);
        console.log(`📤 Sent chunk ${chunkIndex + 1}/${totalChunks}`);
        
        chunkIndex++;
        setTimeout(sendNextChunk, 50); // 50ms delay between chunks
      } else {
        console.log('✅ All chunks sent!');
      }
    };
    
    sendNextChunk();
  }, [modelData]);
  
  // Memoize the WebView HTML to prevent infinite re-renders
  const webViewHTML = useMemo(() => {
    console.log('🎨 useMemo triggered - modelData:', modelData ? (modelData === 'fallback' ? 'fallback' : `${modelData.length} chars`) : 'null');
    
    if (!modelData) {
      console.log('⚠️ No modelData - showing loading screen');
      return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0; display:flex; align-items:center; justify-content:center; background:transparent;">
          <div style="color:white; font-size:18px;">Loading model...</div>
        </body>
        </html>
      `;
    }
    
    console.log('🧩 WebView HTML: Using postMessage to send base64 data');
    
    // Don't embed the base64 in HTML - it's too large
    // Instead, we'll send it via postMessage after the WebView loads
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
          }
          model-viewer { 
            width: 100vw; 
            height: 100vh; 
            background: transparent;
            touch-action: none;
          }
          #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 18px;
            z-index: 1000;
            background: rgba(0,0,0,0.7);
            padding: 20px;
            border-radius: 10px;
          }
        </style>
      </head>
      <body>
        <div id="loading">Waiting for model data...</div>
        <model-viewer 
          id="viewer"
          auto-rotate 
          touch-action="none"
          style="width: 100vw; height: 100vh; touch-action: none;"
          camera-orbit="auto"
          field-of-view="30deg"
          min-camera-orbit="auto auto 2m"
          max-camera-orbit="auto auto 10m"
          shadow-intensity="0.5"
          shadow-softness="0.3"
          exposure="1.0"
          tone-mapping="neutral"
        >
        </model-viewer>
        <script>
          console.log('WebView: JavaScript loaded');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'webview_ready',
            message: 'WebView is ready to receive model data'
          }));
          
          const modelViewer = document.getElementById('viewer');
          const loading = document.getElementById('loading');
          let base64Data = null;
          
          // Listen for base64 data from React Native
          document.addEventListener('message', function(event) {
            try {
              const data = JSON.parse(event.data);
              console.log('WebView: Received message type:', data.type);
              
              if (data.type === 'model_chunk') {
                if (!base64Data) base64Data = '';
                base64Data += data.chunk;
                loading.textContent = 'Loading... ' + data.index + '/' + data.total;
                console.log('WebView: Received chunk', data.index, '/', data.total);
                
                // If this is the last chunk, create the model
                if (data.index === data.total) {
                  console.log('WebView: All chunks received, creating model...');
                  loading.textContent = 'Creating 3D model...';
                  
                  const dataUrl = 'data:model/gltf-binary;base64,' + base64Data;
                  console.log('WebView: Data URL length:', dataUrl.length);
                  
                  modelViewer.src = dataUrl;
                  console.log('WebView: Model src set');
                }
              }
            } catch (error) {
              console.error('WebView: Error processing message:', error);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: error.message
              }));
            }
          });
          
          modelViewer.addEventListener('load', () => {
            console.log('WebView: Model loaded successfully!');
            loading.style.display = 'none';
            window.ReactNativeWebView.postMessage('modelLoaded');
          });
          
          modelViewer.addEventListener('error', (event) => {
            console.error('WebView: Model error:', event);
            loading.textContent = 'Failed to load model';
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'modelError',
              message: 'Failed to load model'
            }));
          });
        </script>
      </body>
      </html>
    `;
  }, [modelData]);

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
        {modelData && (
          <View style={styles.modelContainer}>
            {console.log('🎨 Rendering WebView container - modelData exists:', !!modelData)}
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
                      source={{ html: webViewHTML, baseUrl: 'file:///' }}
                      style={styles.modelViewer}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      startInLoadingState={true}
                      // Allow file access for local GLB files
                      originWhitelist={['*']}
                      allowFileAccess={true}
                      allowFileAccessFromFileURLs={true}
                      allowUniversalAccessFromFileURLs={true}
                      // Critical for large files - increase memory
                      setSupportMultipleWindows={false}
                      // Performance optimizations
                      androidLayerType="hardware"
                      androidHardwareAccelerationDisabled={false}
                      mixedContentMode="compatibility"
                      allowsInlineMediaPlayback={true}
                      mediaPlaybackRequiresUserAction={false}
                      // Cache settings
                      cacheEnabled={false}
                      incognito={true}
                      onMessage={(event) => {
                        const data = event.nativeEvent.data;
                        console.log('📨 TryAR: WebView message:', data);
                        
                        if (data === 'modelLoaded') {
                          handleModelLoad();
                        } else {
                          try {
                            const parsed = JSON.parse(data);
                            if (parsed.type === 'modelError') {
                              console.error('❌ Model error details:', parsed);
                              handleModelError(`Model loading failed: ${parsed.message}`);
                            } else if (parsed.type === 'webview_ready') {
                              console.log('✅ WebView is ready! Sending model chunks...');
                              sendModelChunks();
                            } else if (parsed.type === 'error') {
                              console.error('❌ WebView error:', parsed.message);
                            } else if (parsed.type === 'debug') {
                              console.log('🐛 WebView debug:', parsed.message);
                            }
                          } catch (e) {
                            // Not JSON, might be old format
                            if (data === 'modelError') {
                              handleModelError('Model loading failed');
                            }
                          }
                        }
                      }}
                      ref={(ref) => {
                        webViewRef.current = ref;
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