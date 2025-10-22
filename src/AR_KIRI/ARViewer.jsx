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
    scanData     // Alternative parameter name
  } = route.params || {};
  
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
  
  // Get the actual product name from various sources
  const actualProductName = productName || 
                            scanData?.productName || 
                            route.params?.productName || 
                            '3D Model';

  // Camera setup - Enhanced device detection
  const devices = useCameraDevices();
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef(null);
  
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

  // Handle scale adjustment
  const handleScaleAdjust = (direction) => {
    const newScale = direction === 'up' ? modelScale * 1.1 : modelScale * 0.9;
    setModelScale(Math.max(0.1, Math.min(5.0, newScale)));
    console.log('🎯 Model scale adjusted:', newScale);
  };

  // Handle rotation adjustment
  const handleRotationAdjust = (direction) => {
    const newRotation = direction === 'left' ? modelRotation - 15 : modelRotation + 15;
    setModelRotation(newRotation);
    console.log('🎯 Model rotation adjusted:', newRotation);
  };


  // Toggle flash
  const toggleFlash = () => {
    setFlashMode(flashMode === 'off' ? 'on' : 'off');
  };

  // Switch camera
  const switchCamera = () => {
    setCameraPosition(cameraPosition === 'back' ? 'front' : 'back');
  };

  // Render AR overlay with 3D model
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

    return (
      <View style={styles.arOverlay}>
        {/* 3D Model WebView */}
        <WebView
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
                  src="${actualModelUrl}" 
                  auto-rotate 
                  camera-controls 
                  touch-action="pan-y"
                  style="width: 100vw; height: 100vh;"
                >
                </model-viewer>
              </body>
              </html>
            `
          }}
          style={styles.modelWebView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.modelLoadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.modelLoadingText}>Loading 3D Model...</Text>
            </View>
          )}
        />
      </View>
    );
  };

  // Render AR controls
  const renderARControls = () => {
    return (
      <View style={styles.arControls}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>AR Viewer</Text>
            <Text style={styles.subtitle}>{actualProductName}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setShowModelInfo(!showModelInfo)}
          >
            <Icon name="information-circle" size={24} color="white" />
          </TouchableOpacity>
        </View>


        {/* Bottom Controls - Horizontal Layout */}
        <View style={styles.bottomControls}>
          <View style={styles.horizontalControls}>
            {/* Camera Controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={toggleFlash}
              >
                <Icon name={flashMode === 'on' ? 'flash' : 'flash-off'} size={20} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={switchCamera}
              >
                <Icon name="camera-reverse" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* AR Interaction Controls */}
            {modelPlaced && (
              <View style={styles.interactionControls}>
                <TouchableOpacity 
                  style={styles.interactionButton}
                  onPress={() => handleScaleAdjust('down')}
                >
                  <Icon name="remove" size={20} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.interactionButton}
                  onPress={() => handleScaleAdjust('up')}
                >
                  <Icon name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}

          {/* AR Creation Confirmation Button */}
          {modelPlaced && (
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirmAR}
            >
              <Icon name="checkmark" size={20} color="white" />
              <Text style={styles.confirmButtonText}>Confirm AR</Text>
            </TouchableOpacity>
          )}
          </View>
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
    
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading Camera...</Text>
        <Text style={styles.loadingText}>Available devices: {Object.keys(devices || {}).join(', ')}</Text>
        <Text style={styles.loadingText}>Permission: {hasPermission ? 'Granted' : 'Denied'}</Text>
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
    backgroundColor: '#1a1a1a',
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
    backgroundColor: 'transparent',
  },
  modelWebView: {
    flex: 1,
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
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
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
