import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';

export default function CameraWrapper({ 
  onPhotoCapture, 
  onError, 
  onCameraReady,
  style,
  children,
  fallbackToImagePicker = true 
}) {
  const [cameraReady, setCameraReady] = useState(false);
  const [useImagePicker, setUseImagePicker] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    // Check if we should use image picker as fallback
    if (Platform.OS === 'android') {
      // On Android, if we encounter camera issues, fallback to image picker
      const timer = setTimeout(() => {
        if (!cameraReady && fallbackToImagePicker) {
          console.log('📷 Camera not ready, switching to image picker fallback');
          setUseImagePicker(true);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [cameraReady, fallbackToImagePicker]);

  const captureWithImagePicker = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.9,
      includeBase64: false,
      maxWidth: 1920,
      maxHeight: 1920,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('📷 User cancelled image picker');
        return;
      }

      if (response.errorMessage) {
        console.error('📷 Image picker error:', response.errorMessage);
        onError?.(response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        console.log('📸 Photo captured via image picker:', asset.uri);
        onPhotoCapture?.({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          timestamp: Date.now()
        });
      }
    });
  };

  const captureWithCamera = async () => {
    if (!cameraRef.current) {
      console.warn('📷 Camera ref not available');
      return;
    }

    try {
      const options = {
        quality: 0.9,
        base64: false,
        skipProcessing: false,
        orientation: 'portrait',
        fixOrientation: true,
        forceUpOrientation: true
      };

      const data = await cameraRef.current.takePictureAsync(options);
      console.log('📸 Photo captured via camera:', data.uri);
      onPhotoCapture?.(data);
    } catch (error) {
      console.error('📷 Camera capture error:', error);
      onError?.(error.message);
      
      // Fallback to image picker if camera fails
      if (fallbackToImagePicker) {
        Alert.alert(
          'Camera Error',
          'Camera capture failed. Would you like to select a photo instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Select Photo', onPress: captureWithImagePicker }
          ]
        );
      }
    }
  };

  const handleCameraReady = () => {
    console.log('📷 Camera is ready');
    setCameraReady(true);
    onCameraReady?.();
  };

  const handleCameraError = (error) => {
    console.error('📷 Camera error:', error);
    onError?.(error);
    
    if (fallbackToImagePicker) {
      setUseImagePicker(true);
    }
  };

  // Expose capture method to parent
  React.useImperativeHandle(cameraRef, () => ({
    takePictureAsync: useImagePicker ? captureWithImagePicker : captureWithCamera
  }));

  if (useImagePicker) {
    return (
      <View style={[style, { backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' }]}>
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Icon name="camera-outline" size={80} color="#FF8B47" />
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginTop: 20, textAlign: 'center' }}>
            Camera Fallback Mode
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 20 }}>
            Using device camera picker for photo capture. Tap the capture button to take a photo.
          </Text>
        </View>
        {children}
      </View>
    );
  }

  return (
    <View style={style}>
      <RNCamera
        ref={cameraRef}
        style={{ flex: 1 }}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode.auto}
        captureAudio={false}
        androidCameraPermissionOptions={{
          title: 'Permission to use camera',
          message: 'We need your permission to use your camera',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}
        onCameraReady={handleCameraReady}
        onMountError={handleCameraError}
        onStatusChange={(status) => {
          console.log('📷 Camera status:', status);
          if (status.cameraStatus === 'READY') {
            handleCameraReady();
          }
        }}
      />
      {children}
    </View>
  );
}
