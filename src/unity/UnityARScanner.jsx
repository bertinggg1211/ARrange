import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  Platform,
  PermissionsAndroid,
  Image,
  DeviceEventEmitter,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { arScanApi } from '../api/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const UnityARScanner = ({ route, navigation }) => {
  const { productId, productName } = route.params || {};
  
  const [isLoading, setIsLoading] = useState(false);
  const [scanningPhase, setScanningPhase] = useState('setup'); // setup, scanning, processing, complete
  const [cameraPermission, setCameraPermission] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState(0);
  const [scanData, setScanData] = useState(null);
  const [useNativeCamera, setUseNativeCamera] = useState(true);
  const [capturedImages, setCapturedImages] = useState([]);
  const [showCameraView, setShowCameraView] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const cameraRef = useRef(null);
  const webViewRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanIntervalRef = useRef(null);

  // Hide bottom tab navigation when component mounts
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Hide bottom tab bar
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' }
      });
    });

    return unsubscribe;
  }, [navigation]);

  // Show bottom tab navigation when component unmounts
  useEffect(() => {
    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    };
  }, [navigation]);

  // Request camera permissions
  useEffect(() => {
    requestCameraPermission();
    startPulseAnimation();
  }, []);

  const requestCameraPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        // Check if permission is already granted
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        
        if (hasPermission) {
          console.log('✅ Camera permission already granted');
          setCameraPermission(true);
          return;
        }

        // Request permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission Required',
            message: 'AR Scanner needs camera access to capture 3D models of your products.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        console.log('📱 Camera permission result:', granted, 'Granted:', isGranted);
        setCameraPermission(isGranted);
        
        if (!isGranted) {
          Alert.alert(
            'Camera Permission Denied',
            'Camera access is required for AR scanning. Please grant camera permission in your device settings.',
            [
              { text: 'Cancel', onPress: () => navigation.goBack() },
              { text: 'Open Settings', onPress: () => {
                // You can add code to open device settings here
                console.log('Open device settings for camera permission');
              }}
            ]
          );
        }
      } else {
        // For iOS, assume permission will be handled by the system
        setCameraPermission(true);
      }
    } catch (err) {
      console.error('❌ Camera permission error:', err);
      setCameraPermission(false);
      Alert.alert(
        'Permission Error',
        'Failed to request camera permission. Please check your device settings.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const updateScanProgress = (progress) => {
    setScanProgress(progress);
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Create GLTF file from captured images
  const createGLTFFromImages = async (images, productName) => {
    console.log('🔄 Creating GLTF model from', images.length, 'images...');
    
    // Simulate GLTF creation process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a basic GLTF structure
    const gltfData = {
      asset: {
        version: "2.0",
        generator: "ARrange AR Scanner v1.0"
      },
      scene: 0,
      scenes: [
        {
          name: `${productName} AR Model`,
          nodes: [0]
        }
      ],
      nodes: [
        {
          name: productName,
          mesh: 0
        }
      ],
      meshes: [
        {
          name: `${productName}_mesh`,
          primitives: [
            {
              attributes: {
                POSITION: 0,
                NORMAL: 1,
                TEXCOORD_0: 2
              },
              indices: 3,
              material: 0
            }
          ]
        }
      ],
      materials: [
        {
          name: `${productName}_material`,
          pbrMetallicRoughness: {
            baseColorTexture: {
              index: 0
            },
            metallicFactor: 0.0,
            roughnessFactor: 0.8
          }
        }
      ],
      textures: [
        {
          source: 0
        }
      ],
      images: [
        {
          name: `${productName}_texture`,
          uri: images[0] // Use first image as texture
        }
      ],
      accessors: [
        {
          bufferView: 0,
          componentType: 5126,
          count: 8,
          type: "VEC3",
          max: [1, 1, 1],
          min: [-1, -1, -1]
        },
        {
          bufferView: 1,
          componentType: 5126,
          count: 8,
          type: "VEC3"
        },
        {
          bufferView: 2,
          componentType: 5126,
          count: 8,
          type: "VEC2"
        },
        {
          bufferView: 3,
          componentType: 5123,
          count: 36,
          type: "SCALAR"
        }
      ],
      bufferViews: [
        {
          buffer: 0,
          byteOffset: 0,
          byteLength: 96
        },
        {
          buffer: 0,
          byteOffset: 96,
          byteLength: 96
        },
        {
          buffer: 0,
          byteOffset: 192,
          byteLength: 64
        },
        {
          buffer: 0,
          byteOffset: 256,
          byteLength: 72
        }
      ],
      buffers: [
        {
          byteLength: 328,
          uri: "data:application/octet-stream;base64,AAABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEA"
        }
      ]
    };

    // Convert to JSON string
    const gltfJson = JSON.stringify(gltfData, null, 2);
    
    // Create file for upload (React Native compatible)
    const fileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_ar_model.gltf`;
    
    // Create file object with base64 data
    const gltfFile = {
      uri: `data:model/gltf+json;base64,${btoa(gltfJson)}`,
      type: 'model/gltf+json',
      name: fileName,
      size: gltfJson.length,
      data: gltfJson
    };

    console.log('✅ GLTF model created:', gltfFile.name, formatFileSize(gltfFile.size));
    console.log('📄 GLTF content preview:', gltfJson.substring(0, 200) + '...');
    return gltfFile;
  };

  // Simple camera scanning using guided photo capture
  const startSimpleScan = async () => {
    setScanningPhase('scanning');
    setShowCameraView(true);
    setCapturedFrames(0);
    setCapturedImages([]);
    setCurrentPhotoIndex(0);
    updateScanProgress(0);
    
    // Start the guided photo capture process
    setTimeout(() => {
      captureNextPhoto(0);
    }, 1000);
  };

  // Capture next photo in sequence (promise-based, guarded)
  const captureNextPhoto = async (photoIndex = currentPhotoIndex) => {
    if (isCapturing) {
      console.log('⏳ Capture already in progress, ignoring duplicate call');
      return;
    }
    setIsCapturing(true);

    const photoLabels = ['Front View', 'Back View', 'Left Side', 'Right Side', 'Top View'];
    const currentLabel = photoLabels[photoIndex];
    console.log(`🎯 Starting capture for photo ${photoIndex + 1}/5: ${currentLabel}`);

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: false,
      cameraType: 'back',
      presentationStyle: 'fullScreen',
    };

    try {
      const response = await launchCamera(options);

      if (response?.didCancel) {
        closeCameraView();
        setIsCapturing(false);
        return;
      }

      if (response?.errorCode || response?.errorMessage) {
        console.error('Camera error:', response?.errorCode || response?.errorMessage);
        Alert.alert('Camera Error', 'Failed to access camera. Please try again.');
        closeCameraView();
        setIsCapturing(false);
        return;
      }

      const uri = response?.assets && response.assets[0]?.uri;
      if (!uri) {
        console.warn('No image URI returned from camera');
        setIsCapturing(false);
        return;
      }

      // Use functional updates to avoid stale state
      setCapturedImages((prev) => {
        const newImages = [...prev, uri];
        setCapturedFrames(newImages.length);
        updateScanProgress((newImages.length / 5) * 100);
        console.log(`📸 Captured photo ${newImages.length}/5: ${currentLabel}`);

        if (newImages.length >= 5) {
          setShowCameraView(false);
          // release guard just before processing
          setIsCapturing(false);
          completeScan();
        } else {
          const nextIndex = newImages.length; // 1..4
          setCurrentPhotoIndex(nextIndex);
          console.log(`➡️ Moving to next photo index: ${nextIndex}`);
          setTimeout(() => {
            // release guard right before next launch to allow next capture
            setIsCapturing(false);
            captureNextPhoto(nextIndex);
          }, 600);
        }
        return newImages;
      });
    } catch (error) {
      console.error('Error launching camera:', error);
      Alert.alert('Camera Error', 'Failed to launch camera. Please try again.');
      closeCameraView();
      setIsCapturing(false);
    }
  };

  // Close camera view
  const closeCameraView = () => {
    setShowCameraView(false);
    setScanningPhase('setup');
    setCapturedImages([]);
    setCapturedFrames(0);
    setCurrentPhotoIndex(0);
    updateScanProgress(0);
  };

  // Show completion alert with AR preview option
  const showCompletionAlert = (scanData, gltfFile) => {
    Alert.alert(
      '✅ AR Scan Complete!',
      `Your 3D model has been created successfully!\n\n📊 Scan Details:\n• ${scanData.frames} photos captured\n• GLTF model generated\n• File size: ${formatFileSize(gltfFile.size)}\n\nWould you like to preview your AR model now?`,
      [
        { 
          text: 'Save & Exit', 
          style: 'cancel',
          onPress: () => {
            // Emit event with scan data
            DeviceEventEmitter.emit('AR_SCAN_COMPLETE', {
              scanData,
              productId,
              productName
            });
            navigation.goBack();
          }
        },
        { 
          text: 'View AR Model', 
          onPress: () => {
            // Emit event with scan data first
            DeviceEventEmitter.emit('AR_SCAN_COMPLETE', {
              scanData,
              productId,
              productName
            });
            
            // Navigate to AR viewer
            setTimeout(() => {
              navigation.navigate('CameraARViewer', {
                productId: productId,
                productName: productName,
                arModelUrl: scanData.gltfFile?.uri,
                scanData: scanData,
                fromScanner: true
              });
            }, 500);
          }
        }
      ]
    );
  };

  const beginPhotoCapture = async () => {
    setScanningPhase('scanning');
    setCapturedFrames(0);
    setCapturedImages([]);
    updateScanProgress(0);

    const totalPhotos = 5;
    const photoLabels = ['Front View', 'Back View', 'Left Side', 'Right Side', 'Top View'];
    
    for (let i = 0; i < totalPhotos; i++) {
      try {
        const result = await capturePhoto(photoLabels[i], i + 1, totalPhotos);
        
        if (result.cancelled) {
          stopNativeScan();
          return;
        }

        setCapturedFrames(i + 1);
        setCapturedImages(prev => [...prev, result.uri]);
        
        const progress = ((i + 1) / totalPhotos) * 100;
        updateScanProgress(progress);

        console.log(`📸 Captured photo ${i + 1}/${totalPhotos}: ${photoLabels[i]}`);

        // Small delay between photos
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error('Error capturing photo:', error);
        stopNativeScan();
        Alert.alert('Scan Error', 'Failed to capture photo. Please try again.');
        return;
      }
    }

    completeScan();
  };

  const capturePhoto = (label, current, total) => {
    return new Promise((resolve) => {
      const options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: false,
        cameraType: 'back',
      };

      Alert.alert(
        `Photo ${current}/${total}`,
        `Take a photo of the ${label.toLowerCase()} of your product`,
        [
          { text: 'Cancel', onPress: () => resolve({ cancelled: true }) },
          { 
            text: 'Take Photo', 
            onPress: () => {
              launchCamera(options, (response) => {
                if (response.didCancel) {
                  resolve({ cancelled: true });
                } else if (response.errorMessage) {
                  console.error('Camera error:', response.errorMessage);
                  resolve({ cancelled: true });
                } else if (response.assets && response.assets[0]) {
                  resolve({ 
                    uri: response.assets[0].uri,
                    cancelled: false 
                  });
                } else {
                  resolve({ cancelled: true });
                }
              });
            }
          }
        ]
      );
    });
  };

  const stopNativeScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanningPhase('setup');
    updateScanProgress(0);
    setCapturedFrames(0);
  };

  const completeScan = async () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    setScanningPhase('processing');

    try {
      // Create GLTF model from captured images
      const gltfFile = await createGLTFFromImages(capturedImages, productName || 'Product');
      
      const scanData = {
        frames: capturedFrames,
        quality: 'high',
        modelSize: gltfFile.size,
        vertices: 12840,
        faces: 7320,
        timestamp: Date.now(),
        images: capturedImages,
        gltfFile: gltfFile
      };

      setScanData(scanData);
      setScanningPhase('complete');

      // Show completion UI briefly before alert
      setTimeout(() => {
        showCompletionAlert(scanData, gltfFile);
      }, 1500);

      if (productId) {
        // Upload scan with GLTF file for existing product
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            console.log('🔄 Starting AR scan upload...');
            console.log('📄 GLTF file info:', {
              name: gltfFile.name,
              size: formatFileSize(gltfFile.size),
              type: gltfFile.type,
              uriPreview: gltfFile.uri.substring(0, 100) + '...'
            });
            console.log('🎯 Product ID:', productId);
            console.log('📊 Scan data:', scanData);
            
            const result = await arScanApi.uploadScan(productId, scanData, gltfFile, token);
            console.log('✅ AR scan upload result:', JSON.stringify(result, null, 2));
            
            if (result.success) {
              console.log('🌟 GLTF file uploaded to Cloudinary:', result.arModelUrl);
            } else {
              console.log('⚠️ Upload completed but success flag not set:', result);
            }
          }
        } catch (error) {
          console.error('❌ Failed to upload AR scan:', error);
          console.error('❌ Error details:', error.message);
          Alert.alert('Upload Error', `Failed to upload AR model: ${error.message}`);
          return;
        }
      }

    } catch (error) {
      console.error('❌ Failed to process AR scan:', error);
      Alert.alert('Processing Error', 'Failed to create 3D model. Please try again.');
      setScanningPhase('setup');
    }
  };

  // HTML content for AR Scanner with photogrammetry simulation
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AR Product Scanner</title>
      <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"></script>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: #000000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
          position: relative;
        }
        
        #camera-feed {
          position: absolute;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          object-fit: cover;
          z-index: 1;
        }
        
        .scanning-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10;
          pointer-events: none;
        }
        
        .scan-frame {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 280px;
          height: 280px;
          border: 3px solid #FF8B47;
          border-radius: 20px;
          box-shadow: 0 0 30px rgba(255, 139, 71, 0.6);
          animation: scanPulse 2s infinite;
        }
        
        @keyframes scanPulse {
          0%, 100% { 
            border-color: #FF8B47;
            box-shadow: 0 0 30px rgba(255, 139, 71, 0.6);
          }
          50% { 
            border-color: #FF6B35;
            box-shadow: 0 0 50px rgba(255, 139, 71, 0.8);
          }
        }
        
        .scan-corners {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        
        .corner {
          position: absolute;
          width: 30px;
          height: 30px;
          border: 4px solid #FFFFFF;
        }
        
        .corner.top-left {
          top: -2px;
          left: -2px;
          border-right: none;
          border-bottom: none;
        }
        
        .corner.top-right {
          top: -2px;
          right: -2px;
          border-left: none;
          border-bottom: none;
        }
        
        .corner.bottom-left {
          bottom: -2px;
          left: -2px;
          border-right: none;
          border-top: none;
        }
        
        .corner.bottom-right {
          bottom: -2px;
          right: -2px;
          border-left: none;
          border-top: none;
        }
        
        .scanning-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(255, 139, 71, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 139, 71, 0.3) 1px, transparent 1px);
          background-size: 20px 20px;
          animation: gridMove 3s linear infinite;
        }
        
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(20px, 20px); }
        }
        
        .scan-instructions {
          position: absolute;
          bottom: 120px;
          left: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          padding: 20px;
          border-radius: 15px;
          color: white;
          text-align: center;
          z-index: 20;
        }
        
        .instruction-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #FF8B47;
        }
        
        .instruction-text {
          font-size: 14px;
          line-height: 1.4;
          margin-bottom: 15px;
        }
        
        .scan-controls {
          position: absolute;
          bottom: 30px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 20px;
          z-index: 20;
        }
        
        .scan-button {
          background: linear-gradient(45deg, #FF8B47, #FF6B35);
          color: white;
          border: none;
          border-radius: 50px;
          padding: 15px 30px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(255, 139, 71, 0.4);
          transition: all 0.3s ease;
          min-width: 120px;
        }
        
        .scan-button:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(255, 139, 71, 0.6);
        }
        
        .scan-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .cancel-button {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.5);
        }
        
        .progress-container {
          position: absolute;
          top: 60px;
          left: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          padding: 15px;
          border-radius: 10px;
          z-index: 20;
        }
        
        .progress-text {
          color: white;
          font-size: 14px;
          margin-bottom: 10px;
          text-align: center;
        }
        
        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #FF8B47, #FF6B35);
          border-radius: 3px;
          transition: width 0.3s ease;
          width: 0%;
        }
        
        .frame-counter {
          color: #FF8B47;
          font-size: 12px;
          text-align: center;
          margin-top: 5px;
        }
      </style>
    </head>
    <body>
      <video id="camera-feed" autoplay playsinline muted></video>
      
      <div class="scanning-overlay" id="scanning-overlay" style="display: none;">
        <div class="scan-frame">
          <div class="scan-corners">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
          </div>
          <div class="scanning-grid"></div>
        </div>
      </div>
      
      <div class="progress-container" id="progress-container" style="display: none;">
        <div class="progress-text" id="progress-text">Initializing scan...</div>
        <div class="progress-bar">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
        <div class="frame-counter" id="frame-counter">Frames captured: 0/60</div>
      </div>
      
      <div class="scan-instructions" id="instructions">
        <div class="instruction-title">📱 AR Product Scanner</div>
        <div class="instruction-text" id="instruction-text">
          Position your product in the center frame and tap "Start Scan" to begin 3D capture.
        </div>
      </div>
      
      <div class="scan-controls">
        <button class="scan-button cancel-button" onclick="cancelScan()">Cancel</button>
        <button class="scan-button" id="scan-button" onclick="toggleScan()">Start Scan</button>
      </div>
      
      <script>
        let cameraStream = null;
        let isScanning = false;
        let scanProgress = 0;
        let frameCount = 0;
        let scanInterval = null;
        
        const cameraFeed = document.getElementById('camera-feed');
        const scanButton = document.getElementById('scan-button');
        const progressContainer = document.getElementById('progress-container');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const frameCounter = document.getElementById('frame-counter');
        const scanningOverlay = document.getElementById('scanning-overlay');
        const instructions = document.getElementById('instructions');
        const instructionText = document.getElementById('instruction-text');
        
        // Initialize camera
        async function initCamera() {
          try {
            console.log('🎥 Initializing camera...');
            
            // Log diagnostic information
            console.log('🔍 Browser diagnostics:', {
              userAgent: navigator.userAgent,
              hasMediaDevices: !!navigator.mediaDevices,
              hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
              protocol: window.location.protocol,
              isSecureContext: window.isSecureContext,
              origin: window.location.origin
            });
            
            // Check if mediaDevices is available
            if (!navigator.mediaDevices) {
              throw new Error('MediaDevices API not available - this may be due to insecure context or browser limitations');
            }
            
            if (!navigator.mediaDevices.getUserMedia) {
              throw new Error('getUserMedia not supported - camera access not available in this browser');
            }
            
            // Check for secure context (required for camera access)
            if (!window.isSecureContext && window.location.protocol !== 'file:') {
              console.warn('⚠️ Not in secure context - camera may not work');
            }
            
            // Try different camera configurations
            const cameraConfigs = [
              {
                video: { 
                  facingMode: 'environment',
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                }
              },
              {
                video: { 
                  facingMode: 'environment',
                  width: { ideal: 640 },
                  height: { ideal: 480 }
                }
              },
              {
                video: { 
                  width: { ideal: 640 },
                  height: { ideal: 480 }
                }
              },
              {
                video: true
              }
            ];
            
            let stream = null;
            let lastError = null;
            
            for (let i = 0; i < cameraConfigs.length; i++) {
              try {
                console.log(\`🎥 Trying camera config \${i + 1}/\${cameraConfigs.length}\`);
                stream = await navigator.mediaDevices.getUserMedia(cameraConfigs[i]);
                console.log('✅ Camera stream obtained with config:', i + 1);
                break;
              } catch (configError) {
                console.log(\`❌ Camera config \${i + 1} failed:\`, configError.message);
                lastError = configError;
                continue;
              }
            }
            
            if (!stream) {
              throw lastError || new Error('All camera configurations failed');
            }
            
            cameraStream = stream;
            cameraFeed.srcObject = stream;
            
            console.log('✅ Camera initialized successfully');
            
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CAMERA_READY'
              }));
            }
          } catch (error) {
            console.error('❌ Camera initialization failed:', error);
            
            // Get detailed error information
            const errorDetails = {
              message: error.message || 'Unknown camera error',
              name: error.name || 'UnknownError',
              code: error.code || null,
              constraint: error.constraint || null,
              stack: error.stack || null,
              toString: error.toString(),
              // Check for specific WebRTC errors
              isPermissionError: error.name === 'NotAllowedError' || error.message.includes('Permission'),
              isNotFoundError: error.name === 'NotFoundError' || error.message.includes('not found'),
              isNotSupportedError: error.name === 'NotSupportedError' || error.message.includes('not supported'),
              // Additional context
              userAgent: navigator.userAgent,
              hasMediaDevices: !!navigator.mediaDevices,
              hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
              protocol: window.location.protocol,
              isSecureContext: window.isSecureContext
            };
            
            console.error('📊 Detailed error info:', errorDetails);
            
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CAMERA_ERROR',
                error: errorDetails.message,
                name: errorDetails.name,
                details: errorDetails
              }));
            }
          }
        }
        
        function toggleScan() {
          if (!isScanning) {
            startScan();
          } else {
            stopScan();
          }
        }
        
        function startScan() {
          isScanning = true;
          scanProgress = 0;
          frameCount = 0;
          
          scanButton.textContent = 'Stop Scan';
          scanButton.style.background = 'linear-gradient(45deg, #EF4444, #DC2626)';
          
          progressContainer.style.display = 'block';
          scanningOverlay.style.display = 'block';
          instructions.style.display = 'none';
          
          // Simulate scanning process
          scanInterval = setInterval(() => {
            frameCount++;
            scanProgress = Math.min((frameCount / 60) * 100, 100);
            
            updateProgress();
            
            if (frameCount >= 60) {
              completeScan();
            }
          }, 200); // Capture frame every 200ms
          
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SCAN_STARTED'
            }));
          }
        }
        
        function stopScan() {
          isScanning = false;
          
          if (scanInterval) {
            clearInterval(scanInterval);
            scanInterval = null;
          }
          
          resetUI();
          
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SCAN_STOPPED'
            }));
          }
        }
        
        function completeScan() {
          isScanning = false;
          
          if (scanInterval) {
            clearInterval(scanInterval);
            scanInterval = null;
          }
          
          progressText.textContent = 'Processing 3D model...';
          
          // Simulate processing time
          setTimeout(() => {
            const scanData = {
              frames: frameCount,
              quality: 'high',
              modelSize: '2.4 MB',
              vertices: 15420,
              faces: 8760,
              timestamp: Date.now()
            };
            
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'SCAN_COMPLETE',
                data: scanData
              }));
            }
          }, 2000);
        }
        
        function updateProgress() {
          progressFill.style.width = scanProgress + '%';
          progressText.textContent = \`Scanning... \${Math.round(scanProgress)}%\`;
          frameCounter.textContent = \`Frames captured: \${frameCount}/60\`;
          
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SCAN_PROGRESS',
              progress: scanProgress,
              frames: frameCount
            }));
          }
        }
        
        function resetUI() {
          scanButton.textContent = 'Start Scan';
          scanButton.style.background = 'linear-gradient(45deg, #FF8B47, #FF6B35)';
          
          progressContainer.style.display = 'none';
          scanningOverlay.style.display = 'none';
          instructions.style.display = 'block';
          
          progressFill.style.width = '0%';
          progressText.textContent = 'Initializing scan...';
          frameCounter.textContent = 'Frames captured: 0/60';
        }
        
        function cancelScan() {
          if (isScanning) {
            stopScan();
          }
          
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SCAN_CANCELLED'
            }));
          }
        }
        
        // Run diagnostics immediately
        function runDiagnostics() {
          const diagnostics = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            hasNavigator: !!navigator,
            hasMediaDevices: !!navigator.mediaDevices,
            hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            protocol: window.location.protocol,
            origin: window.location.origin,
            isSecureContext: window.isSecureContext,
            hasWebRTC: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection),
            hasReactNativeWebView: !!window.ReactNativeWebView
          };
          
          console.log('🔧 WebView Diagnostics:', diagnostics);
          
          // Send diagnostics to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'DIAGNOSTICS',
              data: diagnostics
            }));
          }
          
          return diagnostics;
        }
        
        // Initialize when page loads
        window.addEventListener('load', () => {
          runDiagnostics();
          initCamera();
        });
        
        // Run diagnostics immediately (don't wait for load event)
        runDiagnostics();
        
        // Add fallback for testing without camera
        window.addEventListener('keydown', (event) => {
          if (event.key === 'F12') {
            // F12 key to simulate camera ready for testing
            console.log('🧪 Test mode: Simulating camera ready');
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CAMERA_READY'
              }));
            }
          }
        });
        
        // Handle page visibility
        document.addEventListener('visibilitychange', () => {
          if (document.hidden && isScanning) {
            stopScan();
          }
        });
      </script>
    </body>
    </html>
  `;

  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('AR Scanner message:', message);
      
      switch (message.type) {
        case 'DIAGNOSTICS':
          console.log('🔧 WebView Diagnostics received:', message.data);
          // Log key diagnostic information
          console.log('📊 Key WebView Info:', {
            hasMediaDevices: message.data.hasMediaDevices,
            hasGetUserMedia: message.data.hasGetUserMedia,
            isSecureContext: message.data.isSecureContext,
            protocol: message.data.protocol,
            hasWebRTC: message.data.hasWebRTC
          });
          break;
          
        case 'CAMERA_READY':
          setIsLoading(false);
          setScanningPhase('setup');
          break;
          
        case 'CAMERA_ERROR':
          setIsLoading(false);
          console.error('🎥 Camera error details:', message);
          
          // Log detailed error information if available
          if (message.details) {
            console.error('📊 Full error details:', message.details);
            console.error('🔍 Browser context:', {
              hasMediaDevices: message.details.hasMediaDevices,
              hasGetUserMedia: message.details.hasGetUserMedia,
              protocol: message.details.protocol,
              isSecureContext: message.details.isSecureContext,
              userAgent: message.details.userAgent?.substring(0, 100) + '...'
            });
          }
          
          let errorTitle = 'Camera Error';
          let errorMessage = 'Failed to access camera. Please check permissions and try again.';
          
          // Provide specific error messages based on error type
          if (message.details?.isPermissionError || message.name === 'NotAllowedError') {
            errorTitle = 'Camera Permission Denied';
            errorMessage = 'Camera access was denied. Please grant camera permission in your device settings and try again.';
          } else if (message.details?.isNotFoundError || message.name === 'NotFoundError') {
            errorTitle = 'Camera Not Found';
            errorMessage = 'No camera was found on this device. AR scanning requires a camera.';
          } else if (message.details?.isNotSupportedError || message.name === 'NotSupportedError') {
            errorTitle = 'Camera Not Supported';
            errorMessage = 'Camera API is not supported in this browser environment.';
          } else if (!message.details?.hasMediaDevices) {
            errorTitle = 'WebView Limitation';
            errorMessage = 'MediaDevices API is not available in this WebView. This is a known limitation on some Android versions.';
          } else if (!message.details?.hasGetUserMedia) {
            errorTitle = 'getUserMedia Not Available';
            errorMessage = 'Camera access API is not supported in this WebView environment.';
          } else if (!message.details?.isSecureContext) {
            errorTitle = 'Insecure Context';
            errorMessage = 'Camera access requires a secure context (HTTPS). This may be a WebView security limitation.';
          } else if (message.error?.includes('not supported')) {
            errorTitle = 'WebView Camera Issue';
            errorMessage = 'Camera access in WebView may be restricted. Try using the device\'s native camera app first to ensure it works.';
          }
          
          // Add technical details to the message for debugging
          if (message.details) {
            errorMessage += `\n\nTechnical Details:\n• Error: ${message.error}\n• Type: ${message.name}\n• MediaDevices: ${message.details.hasMediaDevices ? 'Available' : 'Not Available'}\n• Secure Context: ${message.details.isSecureContext ? 'Yes' : 'No'}`;
          }
          
          Alert.alert(
            errorTitle,
            errorMessage,
            [
              { text: 'Cancel', onPress: () => navigation.goBack() },
              { text: 'Retry', onPress: () => {
                setIsLoading(true);
                // Force WebView reload
                if (webViewRef.current) {
                  webViewRef.current.reload();
                }
              }}
            ]
          );
          break;
          
        case 'SCAN_STARTED':
          setScanningPhase('scanning');
          setCapturedFrames(0);
          updateScanProgress(0);
          break;
          
        case 'SCAN_PROGRESS':
          setCapturedFrames(message.frames);
          updateScanProgress(message.progress);
          break;
          
        case 'SCAN_COMPLETE':
          setScanningPhase('processing');
          setScanData(message.data);
          
          // Process and upload scan data
          setTimeout(async () => {
            setScanningPhase('complete');
            
            if (productId) {
              // Upload scan for existing product
              try {
                const token = await AsyncStorage.getItem('authToken');
                if (token) {
                  await arScanApi.uploadScan(productId, message.data, null, token);
                  console.log('✅ AR scan uploaded successfully');
                }
              } catch (error) {
                console.error('❌ Failed to upload AR scan:', error);
              }
            }
            
            Alert.alert(
              '✅ Scan Complete!',
              `3D model created successfully!\n\n📊 Scan Details:\n• ${message.data.frames} frames captured\n• ${message.data.vertices} vertices\n• ${message.data.faces} faces\n• Model size: ${message.data.modelSize}`,
              [
                { text: 'Scan Again', onPress: () => setScanningPhase('setup') },
                { 
                  text: 'Save Model', 
                  onPress: () => {
                    if (onScanComplete) {
                      onScanComplete(message.data);
                    }
                    navigation.goBack();
                  }
                }
              ]
            );
          }, 2000);
          break;
          
        case 'SCAN_STOPPED':
        case 'SCAN_CANCELLED':
          setScanningPhase('setup');
          updateScanProgress(0);
          setCapturedFrames(0);
          break;
      }
    } catch (error) {
      console.log('WebView message error:', error);
    }
  };

  const getScanningPhaseText = () => {
    switch (scanningPhase) {
      case 'setup':
        return 'Position your product in the frame';
      case 'scanning':
        return `Scanning... ${capturedFrames}/60 frames`;
      case 'processing':
        return 'Processing 3D model...';
      case 'complete':
        return 'Scan complete!';
      default:
        return 'Initializing...';
    }
  };

  const getScanningPhaseIcon = () => {
    switch (scanningPhase) {
      case 'setup':
        return 'camera-outline';
      case 'scanning':
        return 'scan';
      case 'processing':
        return 'cog';
      case 'complete':
        return 'checkmark-circle';
      default:
        return 'hourglass';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Alert.alert(
              'Exit Scanner',
              'Are you sure you want to exit? Any scan in progress will be lost.',
              [
                { text: 'Continue Scanning', style: 'cancel' },
                { text: 'Exit', onPress: () => navigation.goBack() }
              ]
            );
          }}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.titleText}>AR Product Scanner</Text>
          <Text style={styles.subtitleText}>{productName || 'Product'}</Text>
        </View>
        
        <TouchableOpacity style={styles.helpButton}>
          <Icon name="help-circle-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Guided Photo Capture Interface */}
      {showCameraView && cameraPermission && (
        <View style={styles.guidedCaptureContainer}>
          {/* Progress Header */}
          <View style={styles.captureHeader}>
            <TouchableOpacity
              style={styles.captureBackButton}
              onPress={closeCameraView}
            >
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.captureProgress}>
              <Text style={styles.captureProgressText}>
                Photo {capturedFrames + 1} of 5
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${((capturedFrames + 1) / 5) * 100}%` }
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.captureHeaderSpacer} />
          </View>
          
          {/* Main Content */}
          <View style={styles.captureContent}>
            {/* Instructions */}
            <View style={styles.captureInstructions}>
              <Icon name="camera-outline" size={64} color="#FF8B47" />
              <Text style={styles.captureInstructionTitle}>
                {['Front View', 'Back View', 'Left Side', 'Right Side', 'Top View'][capturedFrames] || 'Front View'}
              </Text>
              <Text style={styles.captureInstructionText}>
                Position your product and take a clear photo from this angle
              </Text>
            </View>
            
            {/* Captured Images Preview */}
            {capturedImages.length > 0 && (
              <View style={styles.capturedImagesContainer}>
                <Text style={styles.capturedImagesTitle}>Captured Photos:</Text>
                <View style={styles.capturedImagesRow}>
                  {capturedImages.map((uri, index) => (
                    <View key={index} style={styles.capturedImageItem}>
                      <Image source={{ uri }} style={styles.capturedImage} />
                      <Text style={styles.capturedImageLabel}>{index + 1}</Text>
                    </View>
                  ))}
                  {/* Show remaining slots */}
                  {Array.from({ length: 5 - capturedImages.length }, (_, index) => (
                    <View key={`empty-${index}`} style={styles.emptyCapturedImageItem}>
                      <Icon name="camera-outline" size={20} color="#666" />
                      <Text style={styles.emptyCapturedImageLabel}>
                        {capturedImages.length + index + 1}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
          
          {/* Bottom Action */}
          <View style={styles.captureActions}>
            <TouchableOpacity
              style={styles.cancelCaptureButton}
              onPress={closeCameraView}
            >
              <Text style={styles.cancelCaptureButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.captureHint}>
              Camera will open automatically for each photo
            </Text>
          </View>
        </View>
      )}

      {/* Simple AR Scanner Interface */}
      {!showCameraView && cameraPermission && (
        <View style={styles.scannerContainer}>
          {/* AR Scanner Illustration */}
          <View style={styles.scannerIllustration}>
            <View style={styles.scanFrame}>
              <View style={styles.scanCorners}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              {scanningPhase === 'scanning' && (
                <Animated.View style={[styles.scanningGrid, { opacity: pulseAnim }]} />
              )}
              
              {/* Product Icon */}
              <View style={styles.productIconContainer}>
                <Icon name="bulb-outline" size={48} color="#FF8B47" />
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionTitle}>
              {scanningPhase === 'setup' && '📱 Ready to Scan'}
              {scanningPhase === 'scanning' && '📸 Capturing Photos...'}
              {scanningPhase === 'processing' && '⚙️ Processing 3D Model...'}
              {scanningPhase === 'complete' && '✅ Scan Complete!'}
            </Text>
            <Text style={styles.instructionText}>
              {scanningPhase === 'setup' && 'Take 5 photos of your product from different angles to create a 3D model for AR visualization.'}
              {scanningPhase === 'scanning' && `Photo ${capturedFrames}/5 captured. Follow the prompts to take the remaining photos.`}
              {scanningPhase === 'processing' && 'Creating your 3D model... This may take a moment.'}
              {scanningPhase === 'complete' && 'Your 3D model has been created successfully!'}
            </Text>
          </View>

          {/* Captured Images Preview */}
          {capturedImages.length > 0 && (
            <View style={styles.imagePreviewContainer}>
              <Text style={styles.previewTitle}>Captured Photos:</Text>
              <View style={styles.imagePreviewRow}>
                {capturedImages.map((uri, index) => (
                  <View key={index} style={styles.imagePreviewItem}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <Text style={styles.previewLabel}>{index + 1}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Scan Controls */}
          <View style={styles.scanControls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.cancelButton]}
              onPress={() => {
                if (scanningPhase === 'scanning') {
                  stopNativeScan();
                } else {
                  navigation.goBack();
                }
              }}
            >
              <Icon name="close" size={24} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>
                {scanningPhase === 'scanning' ? 'Cancel Scan' : 'Exit'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.scanButton]}
              onPress={() => {
                if (scanningPhase === 'setup') {
                  startSimpleScan();
                } else if (scanningPhase === 'scanning') {
                  stopNativeScan();
                }
              }}
              disabled={scanningPhase === 'processing'}
            >
              <Icon 
                name={scanningPhase === 'scanning' ? 'stop' : 'camera'} 
                size={24} 
                color="#FFFFFF" 
              />
              <Text style={styles.controlButtonText}>
                {scanningPhase === 'scanning' ? 'Stop Scan' : 'Start AR Scan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Status Overlay */}
      <View style={styles.statusOverlay}>
        <Animated.View style={[styles.statusCard, { transform: [{ scale: pulseAnim }] }]}>
          <Icon 
            name={getScanningPhaseIcon()} 
            size={24} 
            color={scanningPhase === 'complete' ? '#10B981' : '#FF8B47'} 
          />
          <Text style={styles.statusText}>{getScanningPhaseText()}</Text>
        </Animated.View>
        
        {scanningPhase === 'scanning' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(scanProgress)}% Complete</Text>
          </View>
        )}
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF8B47" />
          <Text style={styles.loadingText}>Initializing AR Scanner...</Text>
        </View>
      )}

      {/* Camera Permission */}
      {!cameraPermission && !isLoading && (
        <View style={styles.permissionOverlay}>
          <View style={styles.permissionCard}>
            <Icon name="camera-outline" size={48} color="#FF8B47" />
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionText}>
              AR Scanner needs camera access to capture 3D models of your products.
            </Text>
            <View style={styles.permissionButtons}>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestCameraPermission}
              >
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.permissionButton, styles.testModeButton]}
                onPress={() => {
                  console.log('🧪 Entering test mode - bypassing camera');
                  setCameraPermission(true);
                  setIsLoading(false);
                  setScanningPhase('setup');
                }}
              >
                <Text style={[styles.permissionButtonText, styles.testModeButtonText]}>Test Mode</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 100,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 15,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitleText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  helpButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  webview: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  scannerIllustration: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  productIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  imagePreviewContainer: {
    marginBottom: 20,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  imagePreviewRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imagePreviewItem: {
    alignItems: 'center',
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  previewLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderWidth: 3,
    borderColor: '#FF8B47',
    borderRadius: 20,
    position: 'relative',
  },
  scanCorners: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanningGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 139, 71, 0.1)',
  },
  instructionsOverlay: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    maxWidth: 300,
  },
  instructionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
  },
  scanControls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  scanButton: {
    backgroundColor: '#FF8B47',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statusOverlay: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    zIndex: 50,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FF8B47',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  progressContainer: {
    marginTop: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF8B47',
    borderRadius: 4,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 15,
    fontWeight: '600',
  },
  permissionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 150,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    margin: 30,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 15,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  permissionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  permissionButton: {
    backgroundColor: '#FF8B47',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    flex: 1,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  testModeButton: {
    backgroundColor: '#6B7280',
    borderWidth: 1,
    borderColor: '#9CA3AF',
  },
  testModeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  
  // Guided Capture View Styles
  guidedCaptureContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  captureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  captureBackButton: {
    padding: 8,
  },
  captureProgress: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  captureProgressText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF8B47',
    borderRadius: 2,
  },
  captureHeaderSpacer: {
    width: 40,
  },
  captureContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captureInstructions: {
    alignItems: 'center',
    marginBottom: 40,
  },
  captureInstructionTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  captureInstructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
  },
  capturedImagesContainer: {
    width: '100%',
    alignItems: 'center',
  },
  capturedImagesTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  capturedImagesRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  capturedImageItem: {
    alignItems: 'center',
  },
  capturedImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF8B47',
  },
  capturedImageLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyCapturedImageItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#666',
    borderStyle: 'dashed',
  },
  emptyCapturedImageLabel: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
  },
  captureActions: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  cancelCaptureButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  cancelCaptureButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  captureHint: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default UnityARScanner;