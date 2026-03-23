import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles/ViewAR.style';

const { width, height } = Dimensions.get('window');

// Get model URL from product data
const getModelUrl = (product) => {
  if (product?.arModel) {
    return product.arModel;
  } else if (product?.arScanData?.model_url || product?.arScanData?.glbUrl) {
    return product?.arScanData?.model_url || product?.arScanData?.glbUrl;
  } else if (product?.arModelSource === 'local') {
    return 'asset:///TEST1.glb';
  }
  return null;
};

// Generate HTML for Three.js 3D model viewer
const generateModelViewerHTML = (modelUrl, product) => {
  const productName = product?.name || 'Product';
  const productWidth = product?.width || 50;
  const productHeight = product?.height || 50;
  const productDepth = product?.depth || 50;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      overflow: hidden; 
      background-color: #1a1a1a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #container { width: 100vw; height: 100vh; }
    canvas { display: block; }
    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #FF8B47;
      font-size: 16px;
      text-align: center;
    }
    #info {
      position: absolute;
      bottom: 20px;
      left: 0;
      right: 0;
      text-align: center;
      color: #888;
      font-size: 12px;
    }
    #product-info {
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0,0,0,0.7);
      padding: 10px 15px;
      border-radius: 8px;
      color: #fff;
    }
    #product-info h3 {
      font-size: 14px;
      margin-bottom: 5px;
    }
    #product-info p {
      font-size: 11px;
      color: #aaa;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="loading">Loading 3D Model...</div>
  <div id="product-info">
    <h3>${productName}</h3>
    <p>${productWidth}cm x ${productHeight}cm x ${productDepth}cm</p>
  </div>
  <div id="info">Drag to rotate • Pinch to zoom</div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

  <script>
    // Scene setup
    const container = document.getElementById('container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 3);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 10;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    // Ground plane for reference
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x222222);
    gridHelper.position.y = -0.49;
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(1);
    scene.add(axesHelper);

    // Load model
    const modelUrl = '${modelUrl}';
    
    if (modelUrl) {
      const loader = new THREE.GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          
          // Center and scale model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1.5 / maxDim;
          model.scale.setScalar(scale);
          
          model.position.sub(center);
          model.position.y = 0;
          
          model.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });
          
          scene.add(model);
          
          document.getElementById('loading').style.display = 'none';
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'modelLoaded' }));
        },
        (progress) => {
          const percent = (progress.loaded / progress.total * 100).toFixed(0);
          document.getElementById('loading').textContent = 'Loading... ' + percent + '%';
        },
        (error) => {
          console.error('Error loading model:', error);
          document.getElementById('loading').textContent = 'Error loading model';
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'modelError', error: error.message }));
        }
      );
    } else {
      document.getElementById('loading').textContent = 'No model available';
    }

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Handle touch events for WebView communication
    container.addEventListener('touchstart', (e) => {
      e.preventDefault();
    }, { passive: false });
  </script>
</body>
</html>
  `.trim();
};

export default function ViewAR({ route, navigation }) {
  const { product } = route.params;
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState(null);

  const modelUrl = getModelUrl(product);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('ProductDetail', { product });
    }
  }, [navigation, product]);

  const handleWebViewMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', data);
      
      if (data.type === 'modelLoaded') {
        setModelLoaded(true);
        setIsLoading(false);
      } else if (data.type === 'modelError') {
        setError(data.error);
        setIsLoading(false);
      }
    } catch (e) {
      console.log('WebView text:', event.nativeEvent.data);
    }
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={[styles.header, { 
        paddingTop: Math.max(insets.top, 10) + 5,
        zIndex: 100,
      }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>3D View</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {product?.name || 'Product'}
            </Text>
          </View>
          
          <View style={styles.infoButton}>
            <Icon name="information-circle-outline" size={24} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* 3D Model Viewer WebView */}
      <View style={styles.webViewContainer}>
        {modelUrl ? (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: generateModelViewerHTML(modelUrl, product) }}
            style={styles.modelWebView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            onMessage={handleWebViewMessage}
            onLoadEnd={handleLoadEnd}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF8B47" />
                <Text style={styles.loadingText}>Loading 3D Model...</Text>
              </View>
            )}
            onError={(error) => {
              console.error('WebView error:', error);
              setError(error.description);
            }}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <View style={styles.placeholderContent}>
              <Icon name="cube-outline" size={80} color="#FF8B47" />
              <Text style={styles.placeholderTitle}>3D Model Coming Soon</Text>
              <Text style={styles.placeholderDescription}>
                This product will have 3D viewing capability once the seller uploads a 3D model.
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
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
