import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './styles/KiriARViewer.style';

export default function KiriARViewer({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { productId, productName, arModelUrl, scanData, fromKiriScanner } = route.params || {};
  
  const [isLoading, setIsLoading] = useState(true);
  const [webViewError, setWebViewError] = useState(null);

  useEffect(() => {
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

  // Generate HTML content for AR viewer
  const generateARViewerHTML = () => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KIRI AR Viewer</title>
        <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
        <style>
            body {
                margin: 0;
                padding: 0;
                background: #1A1A1A;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                overflow: hidden;
            }
            
            model-viewer {
                width: 100%;
                height: 100vh;
                background-color: #1A1A1A;
            }
            
            .loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #1A1A1A;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                transition: opacity 0.3s ease;
            }
            
            .loading-overlay.hidden {
                opacity: 0;
                pointer-events: none;
            }
            
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid rgba(255, 139, 71, 0.3);
                border-top: 3px solid #FF8B47;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading-text {
                color: #FFFFFF;
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .loading-subtext {
                color: #94A3B8;
                font-size: 14px;
                text-align: center;
                max-width: 280px;
            }
            
            .error-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #1A1A1A;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 1001;
                padding: 40px;
                text-align: center;
            }
            
            .error-icon {
                font-size: 64px;
                color: #EF4444;
                margin-bottom: 20px;
            }
            
            .error-title {
                color: #FFFFFF;
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 10px;
            }
            
            .error-message {
                color: #94A3B8;
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 30px;
            }
            
            .ar-controls {
                position: absolute;
                bottom: 20px;
                left: 20px;
                right: 20px;
                display: flex;
                justify-content: center;
                gap: 15px;
                z-index: 100;
            }
            
            .ar-button {
                background: rgba(255, 139, 71, 0.9);
                border: none;
                border-radius: 25px;
                padding: 12px 20px;
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                backdrop-filter: blur(10px);
                transition: all 0.2s ease;
            }
            
            .ar-button:hover {
                background: rgba(255, 139, 71, 1);
                transform: translateY(-2px);
            }
            
            .ar-button:active {
                transform: translateY(0);
            }
            
            .model-info {
                position: absolute;
                top: 20px;
                left: 20px;
                right: 20px;
                background: rgba(26, 26, 26, 0.9);
                border-radius: 15px;
                padding: 15px;
                backdrop-filter: blur(10px);
                z-index: 100;
            }
            
            .model-title {
                color: #FFFFFF;
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 5px;
            }
            
            .model-details {
                color: #94A3B8;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="loading-overlay" id="loadingOverlay">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading 3D Model</div>
            <div class="loading-subtext">
                Preparing your KIRI Engine GLB model for AR visualization...
            </div>
        </div>
        
        <div class="model-info">
            <div class="model-title">${productName || 'KIRI 3D Model'}</div>
            <div class="model-details">
                ${scanData?.isMock ? '🧪 Test Model' : '🎯 Professional GLB'} • 
                ${scanData?.fileSize || 'Processing...'} • 
                ${scanData?.quality || 'High Quality'}
            </div>
        </div>
        
        <model-viewer
            src="${arModelUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'}"
            alt="KIRI Engine 3D Model"
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            touch-action="pan-y"
            auto-rotate
            auto-rotate-delay="3000"
            rotation-per-second="30deg"
            environment-image="neutral"
            shadow-intensity="1"
            exposure="1"
            tone-mapping="neutral"
        >
            <div class="ar-controls" slot="ar-button">
                <button class="ar-button" onclick="enterAR()">
                    📱 View in AR
                </button>
                <button class="ar-button" onclick="resetCamera()">
                    🔄 Reset View
                </button>
            </div>
        </model-viewer>
        
        <script>
            const modelViewer = document.querySelector('model-viewer');
            const loadingOverlay = document.getElementById('loadingOverlay');
            
            // Handle model loading
            modelViewer.addEventListener('load', () => {
                console.log('✅ KIRI GLB model loaded successfully');
                setTimeout(() => {
                    loadingOverlay.classList.add('hidden');
                }, 500);
                
                // Send success message to React Native
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'MODEL_LOADED',
                        success: true
                    }));
                }
            });
            
            modelViewer.addEventListener('error', (error) => {
                console.error('❌ Model loading error:', error);
                showError('Failed to load 3D model', 'The GLB file could not be loaded. Please check the file URL and try again.');
                
                // Send error message to React Native
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'MODEL_ERROR',
                        error: error.message || 'Unknown error'
                    }));
                }
            });
            
            // AR functions
            function enterAR() {
                if (modelViewer.canActivateAR) {
                    modelViewer.activateAR();
                } else {
                    alert('AR not supported on this device');
                }
            }
            
            function resetCamera() {
                modelViewer.resetTurntableRotation();
                modelViewer.jumpCameraToGoal();
            }
            
            function showError(title, message) {
                document.body.innerHTML += \`
                    <div class="error-overlay">
                        <div class="error-icon">⚠️</div>
                        <div class="error-title">\${title}</div>
                        <div class="error-message">\${message}</div>
                    </div>
                \`;
            }
            
            // Handle WebView messages
            window.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'RESET_VIEW':
                        resetCamera();
                        break;
                    case 'ENTER_AR':
                        enterAR();
                        break;
                }
            });
        </script>
    </body>
    </html>
    `;
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'MODEL_LOADED':
          setIsLoading(false);
          console.log('✅ KIRI GLB model loaded in AR viewer');
          break;
          
        case 'MODEL_ERROR':
          setIsLoading(false);
          setWebViewError(data.error);
          console.error('❌ AR viewer error:', data.error);
          break;
      }
    } catch (error) {
      console.error('WebView message parsing error:', error);
    }
  };

  const sendMessageToWebView = (message) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  };

  const webViewRef = React.useRef(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AR Preview</Text>
          <Text style={styles.headerSubtitle}>{productName || 'KIRI 3D Model'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => sendMessageToWebView({ type: 'RESET_VIEW' })}
        >
          <Icon name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* WebView AR Viewer */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: generateARViewerHTML() }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsCamera={true}
          allowsProtectedMedia={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ WebView error:', nativeEvent);
            setWebViewError('WebView failed to load');
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ WebView HTTP error:', nativeEvent);
            setWebViewError(`HTTP Error: ${nativeEvent.statusCode}`);
          }}
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FF8B47" />
            <Text style={styles.loadingText}>Loading AR Viewer</Text>
            <Text style={styles.loadingSubtext}>
              Preparing your KIRI Engine 3D model...
            </Text>
          </View>
        )}
        
        {/* Error Overlay */}
        {webViewError && (
          <View style={styles.errorOverlay}>
            <Icon name="warning" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>AR Viewer Error</Text>
            <Text style={styles.errorMessage}>{webViewError}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setWebViewError(null);
                setIsLoading(true);
                webViewRef.current?.reload();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {
            console.log('🎯 KiriARViewer: View in AR button pressed');
            console.log('📊 Navigation params:', {
              productId,
              productName,
              arModelUrl,
              scanData
            });
            
            try {
              console.log('🚀 Navigating to ARViewer from KiriARViewer...');
              navigation.navigate('ARViewer', {
                productId: productId,
                productName: productName,
                modelUrl: arModelUrl,
                scanData: scanData,
                fromKiriARViewer: true
              });
              console.log('✅ Navigation to ARViewer successful');
            } catch (error) {
              console.error('❌ Failed to navigate to ARViewer:', error);
              Alert.alert('Error', 'Failed to open AR viewer. Please try again.');
            }
          }}
        >
          <Icon name="scan" size={20} color="#FFFFFF" />
          <Text style={styles.controlButtonText}>View in AR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {
            Alert.alert(
              'Model Information',
              `Product: ${productName || 'KIRI 3D Model'}\n` +
              `Type: ${scanData?.isMock ? 'Test Model' : 'Professional GLB'}\n` +
              `File Size: ${scanData?.fileSize || 'Unknown'}\n` +
              `Quality: ${scanData?.quality || 'High'}\n` +
              `Source: KIRI Engine Photogrammetry`
            );
          }}
        >
          <Icon name="information-circle" size={20} color="#FFFFFF" />
          <Text style={styles.controlButtonText}>Info</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
