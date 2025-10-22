import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
  Alert,
  Switch,
  Dimensions,
  DeviceEventEmitter,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import styles from './styles/UploadItem.style';
import ImageCropPicker from 'react-native-image-crop-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { createProduct } from '../../api/productApi';
import { BASE_URL } from '../../api/api';
import { getLocalModelPath } from '../../utils/localModelLoader';

const { width } = Dimensions.get('window');

// Sample categories
const categories = [
  'Chandeliers', 'Pendant Lights', 'Ceiling Lights', 'Wall Lights',
  'Floor Lamps', 'Table Lamps', 'Outdoor Lights', 'Smart Lighting',
  'Track Lighting', 'Recessed Lighting', 'Strip Lights', 'Decorative Lights',
];

const installationTypes = [
  'Ceiling Mount', 'Wall Mount', 'Floor Standing', 'Table Top',
  'Pendant/Hanging', 'Recessed/Built-in', 'Track Mount', 'Plug-in',
];

const roomTypes = [
  'Living Room', 'Bedroom', 'Kitchen', 'Dining Room',
  'Bathroom', 'Office', 'Hallway', 'Outdoor', 'Commercial',
];
const availableColors = [
  'White', 'Black', 'Gold', 'Silver', 'Bronze',
  'Copper', 'Chrome', 'Brass', 'Clear', 'Multicolor',
];

export default function UploadItem({ route, navigation }) {
  const insets = useSafeAreaInsets();
  
  // Tab bar hiding is now handled in CustomTabBar component
  const editMode = route.params?.product ? true : false;
  const initialProduct = route.params?.product || {};

  // Form state
  const [name, setName] = useState(initialProduct.name || '');
  const [price, setPrice] = useState(initialProduct.price || '');
  const [description, setDescription] = useState(initialProduct.description || '');
  const [category, setCategory] = useState(initialProduct.category || '');
  const [stock, setStock] = useState(initialProduct.stock?.toString() || '1');
  const [dimensions, setDimensions] = useState(initialProduct.dimensions || '');
  const [weight, setWeight] = useState(initialProduct.weight || '');
  const [material, setMaterial] = useState(initialProduct.material || '');
  const [warranty, setWarranty] = useState(initialProduct.warranty || '');
  const [bulbType, setBulbType] = useState(initialProduct.bulbType || '');
  const [numberOfBulbs, setNumberOfBulbs] = useState(initialProduct.numberOfBulbs || '');
  const [voltage, setVoltage] = useState(initialProduct.voltage || '');
  const [ledType, setLedType] = useState(initialProduct.ledType || '');
  const [lumens, setLumens] = useState(initialProduct.lumens || '');
  const [isDimmable, setIsDimmable] = useState(initialProduct.isDimmable || false);
  const [brand, setBrand] = useState(initialProduct.brand || '');
  const [model, setModel] = useState(initialProduct.model || '');
  const [colorOptions, setColorOptions] = useState(initialProduct.colorOptions || []);
  const [installationType, setInstallationType] = useState(initialProduct.installationType || '');
  const [roomType, setRoomType] = useState(initialProduct.roomType || '');
  const [isActive, setIsActive] = useState(initialProduct.status === 'active' || !initialProduct.status);
  const [images, setImages] = useState(initialProduct.images || []);
  const [specifications, setSpecifications] = useState(initialProduct.specifications || []);
  
  // Delivery and installation states
  const [deliveryCharge, setDeliveryCharge] = useState(editMode ? (initialProduct.deliveryCharge || '') : '');
  const [installationCost, setInstallationCost] = useState(editMode ? (initialProduct.installationCost || '') : '');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(editMode ? (initialProduct.freeDeliveryThreshold || '') : '');
  const [installationIncluded, setInstallationIncluded] = useState(editMode ? (initialProduct.installationIncluded || false) : false);
  
  // AR scanning states
  const [hasAR, setHasAR] = useState(editMode ? (initialProduct.hasAR || false) : false);
  const [arScanData, setArScanData] = useState(editMode ? (initialProduct.arScanData || null) : null);
  
  // Local model states
  const [useLocalModel, setUseLocalModel] = useState(false);
  const [selectedLocalModel, setSelectedLocalModel] = useState('TEST3');

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showInstallationModal, setShowInstallationModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  
  // Force re-render state
  const [imageRefresh, setImageRefresh] = useState(0);
  
  // Step-by-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  // Loading state for product creation
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationStep, setCreationStep] = useState('');
  
  // Ensure form is properly initialized for new products
  useEffect(() => {
    if (!editMode) {
      // Clear any residual data for new products
      setDeliveryCharge('');
      setInstallationCost('');
      setFreeDeliveryThreshold('');
      setInstallationIncluded(false);
      setHasAR(false);
      setArScanData(null);
      setUseLocalModel(false);
      setSelectedLocalModel('TEST3');
      console.log('🔄 Form initialized for new product');
    }
  }, [editMode]);
  
  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [createdProduct, setCreatedProduct] = useState(null);
  
  // Animated loading dots
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  // Animate loading dots
  useEffect(() => {
    if (isCreating) {
      const animateLoadingDots = () => {
        const animateDot = (dotAnim, delay) => {
          return Animated.loop(
            Animated.sequence([
              Animated.delay(delay),
              Animated.timing(dotAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(dotAnim, {
                toValue: 0.3,
                duration: 400,
                useNativeDriver: true,
              }),
            ])
          );
        };

        Animated.parallel([
          animateDot(dot1Anim, 0),
          animateDot(dot2Anim, 200),
          animateDot(dot3Anim, 400),
        ]).start();
      };

      animateLoadingDots();
    } else {
      // Reset dots when not loading
      dot1Anim.setValue(0.3);
      dot2Anim.setValue(0.3);
      dot3Anim.setValue(0.3);
    }
  }, [isCreating, dot1Anim, dot2Anim, dot3Anim]);

  // Listen for KIRI Engine scan completion
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('KIRI_SCAN_COMPLETE', (data) => {
      console.log('🎉 KIRI Engine scan completed:', data.scanData);
      setArScanData(data.scanData);
      setHasAR(true);
      Alert.alert(
        '✅ 3D Model Created!',
        `Your ${data.productName || 'product'} has been successfully converted to a professional 3D model using KIRI Engine!\n\n🎯 Ready for AR visualization\n📱 Customers can now view it in their space`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    });
    return () => subscription.remove();
  }, []);

  // Listen for AR model confirmation from ARViewer
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('AR_MODEL_CONFIRMED', (data) => {
      console.log('🎯 AR Model confirmed:', data);
      setHasAR(true);
      setArScanData(data.scanData);
      Alert.alert(
        '✅ AR Model Confirmed!',
        `AR model for "${data.productName}" has been successfully confirmed and is ready for use.`,
        [{ text: 'Great!', style: 'default' }]
      );
    });
    return () => subscription.remove();
  }, []);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear any pending operations
      setIsCreating(false);
      setCreationProgress(0);
      setCreationStep('');
    };
  }, []);

  // Step definitions
  const steps = [
    { id: 1, title: 'Photos', subtitle: 'Add product images', icon: 'camera' },
    { id: 2, title: 'Basic Info', subtitle: 'Name, price, category', icon: 'information-circle' },
    { id: 3, title: 'Details', subtitle: 'Brand, dimensions, specs', icon: 'list' },
    { id: 4, title: 'Technical', subtitle: 'Lighting specifications', icon: 'bulb' },
    { id: 5, title: 'Review', subtitle: 'Final check & publish', icon: 'checkmark-circle' }
  ];

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  // Request permissions for Android
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to camera to take photos of your products.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Camera permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: 'Storage Permission',
            message: 'This app needs access to your photos to select product images.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Storage permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  };

  const handleSelectImage = async (index) => {
    // Show selection options to user
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const hasPermission = await requestStoragePermission();
            if (hasPermission) {
              selectFromGallery(index);
            } else {
              Alert.alert('Permission Required', 'Please grant storage permission to select images from gallery.');
            }
          },
        },
        {
          text: 'Camera',
          onPress: async () => {
            const hasPermission = await requestCameraPermission();
            if (hasPermission) {
              selectFromCamera(index);
            } else {
              Alert.alert('Permission Required', 'Please grant camera permission to take photos.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const selectFromGallery = async (index) => {
    try {
      console.log('Opening gallery with ImageCropPicker...');
      
      // Use ImageCropPicker directly without cropping first
      const result = await ImageCropPicker.openPicker({
        mediaType: 'photo',
        multiple: false,
        includeBase64: false,
        maxWidth: 1200,
        maxHeight: 1200,
        compressImageQuality: 0.8,
      });
      
      console.log('ImageCropPicker result:', result);
      
      if (result && result.path) {
        const imageUri = result.path;
        console.log('Raw image URI:', imageUri);
        
        // Create image object
        const imageObj = {
          uri: imageUri,
          type: result.mime || 'image/jpeg',
          name: `product-${Date.now()}.jpg`,
          width: result.width,
          height: result.height,
          size: result.size
        };
        
        console.log('Creating image object:', imageObj);
        
        // Update images array
        setImages(prevImages => {
          const newImages = [...prevImages];
          newImages[index] = imageObj;
          console.log('New images array:', newImages);
          return newImages;
        });
        
        console.log('Image set successfully at index:', index);
      }
    } catch (error) {
      const msg = String(error?.message || '').toLowerCase();
      if (msg.includes('cancel')) {
        console.log('User cancelled image selection');
        return;
      }
      console.error('Gallery selection error:', error);
      
      // Try fallback with react-native-image-picker
      console.log('Trying fallback with react-native-image-picker...');
      try {
        const options = {
          mediaType: 'photo',
          includeBase64: false,
          maxHeight: 1200,
          maxWidth: 1200,
          quality: 0.8,
        };

        launchImageLibrary(options, (response) => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
            return;
          }
          
          if (response.errorMessage) {
            console.error('ImagePicker Error: ', response.errorMessage);
            Alert.alert('Error', 'Failed to select image. Please try again.');
            return;
          }

          if (response.assets && response.assets[0]) {
            const asset = response.assets[0];
            const imageObj = {
              uri: asset.uri,
              type: asset.type || 'image/jpeg',
              name: asset.fileName || `product-${Date.now()}.jpg`,
              width: asset.width,
              height: asset.height,
              size: asset.fileSize
            };

            console.log('Fallback image selected:', imageObj);
            
            setImages(prevImages => {
              const newImages = [...prevImages];
              newImages[index] = imageObj;
              return newImages;
            });
          }
        });
      } catch (fallbackError) {
        console.error('Fallback image picker error:', fallbackError);
        Alert.alert(
          'Image Selection Error', 
          'Failed to select image. Please check permissions and try again.'
        );
      }
    }
  };

  const selectFromCamera = async (index) => {
    try {
      console.log('Opening camera...');
      
      const result = await ImageCropPicker.openCamera({
        mediaType: 'photo',
        cropping: true,
        width: 1200,
        height: 1200,
        compressImageQuality: 0.85,
        forceJpg: true,
        includeBase64: false,
      });
      
      if (result?.path) {
        const uri = result.path;
        const mime = result?.mime || 'image/jpeg';
        const name = `product-camera-${Date.now()}.jpg`;
        const normalizedUri = uri.startsWith('file://') ? uri : `file://${uri}`;
        
        console.log('Setting image from camera:', normalizedUri);
        
        setImages((prev) => {
          const next = [...prev];
          next[index] = { 
            uri: normalizedUri, 
            type: mime, 
            name,
            path: uri,
            width: result?.width,
            height: result?.height,
            size: result?.size
          };
          return next;
        });
      }
    } catch (error) {
      const msg = String(error?.message || '').toLowerCase();
      if (msg.includes('cancel')) {
        console.log('User cancelled camera');
        return;
      }
      console.error('Camera error:', error);
      Alert.alert(
        'Camera Error', 
        `Failed to open camera: ${error.message || 'Unknown error'}. Please check camera permissions and try again.`
      );
    }
  };

  const tryImageCropPicker = async (index) => {
    try {
      console.log('Trying ImageCropPicker as fallback...');
      
      // Wait a bit for Activity to be ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const result = await ImageCropPicker.openPicker({
        mediaType: 'photo',
        cropping: true,
        width: 1200,
        height: 1200,
        compressImageQuality: 0.85,
        forceJpg: true,
        includeBase64: false,
      });
      
      if (result?.path) {
        const uri = result.path;
        const mime = result?.mime || 'image/jpeg';
        const name = `product-${Date.now()}.jpg`;
        const normalizedUri = uri.startsWith('file://') ? uri : `file://${uri}`;
        
        console.log('Setting image from ImageCropPicker:', normalizedUri);
        
        setImages((prev) => {
          const next = [...prev];
          next[index] = { 
            uri: normalizedUri, 
            type: mime, 
            name,
            path: uri,
            width: result?.width,
            height: result?.height,
            size: result?.size
          };
          return next;
        });
      }
    } catch (error) {
      const msg = String(error?.message || '').toLowerCase();
      if (msg.includes('cancel')) {
        console.log('User cancelled ImageCropPicker');
        return;
      }
      console.error('ImageCropPicker fallback error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again later.');
    }
  };

  const removeImage = (index) => {
    console.log('Removing image at index:', index);
    console.log('Current images before removal:', images);
    
    setImages((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      console.log('Images after removal:', next);
      return next;
    });
    
    // Force re-render
    setImageRefresh(prev => prev + 1);
    
    setTimeout(() => {
      console.log('Images state after removal timeout:', images);
    }, 100);
  };

  const updateSpecification = (index, field, value) => {
    const updatedSpecs = [...specifications];
    updatedSpecs[index][field] = value;
    setSpecifications(updatedSpecs);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { name: '', value: '' }]);
  };

  const removeSpecification = (index) => {
    const updatedSpecs = [...specifications];
    updatedSpecs.splice(index, 1);
    setSpecifications(updatedSpecs);
  };

  const toggleColor = (color) => {
    const updatedColors = colorOptions.includes(color)
      ? colorOptions.filter(c => c !== color)
      : [...colorOptions, color];
    setColorOptions(updatedColors);
  };

  const clearForm = () => {
    setName('');
    setPrice('');
    setStock('');
    setCategory('');
    setDescription('');
    setBrand('');
    setModel('');
    setDimensions('');
    setWeight('');
    setMaterial('');
    setWarranty('');
    setBulbType('');
    setNumberOfBulbs('');
    setVoltage('');
    setLedType('');
    setLumens('');
    setIsDimmable(false);
    setInstallationType('');
    setRoomType('');
    setColorOptions([]);
    setSpecifications([]);
    setIsActive(true);
    setImages([]);
    setImageRefresh(prev => prev + 1);
    // Clear delivery and installation fields
    setDeliveryCharge('');
    setInstallationCost('');
    setFreeDeliveryThreshold('');
    setInstallationIncluded(false);
    // Clear AR scanning data
    setHasAR(false);
    setArScanData(null);
    // Clear local model fields
    setUseLocalModel(false);
    setSelectedLocalModel('TEST4');
    console.log('✅ Form cleared - ready for new product');
  };

  const handleSubmit = async () => {
    if (!name || !price || !description || !category) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Price, Description, Category).');
      return;
    }

    // Start loading process
    setIsCreating(true);
    setCreationProgress(0);
    setCreationStep('Preparing product data...');

    try {
      // Step 1: Prepare images
      setCreationProgress(20);
      setCreationStep('Processing images...');
      
      // Optimize image processing to prevent memory issues
      const processedImages = images
        .filter(img => img !== null && img !== undefined)
        .map((img, index) => {
          if (index === 0 && img) {
            console.log('🎯 Setting first image as main image:', img.uri?.substring(0, 50));
            return { ...img, isMain: true };
          }
          return img;
        });

      console.log('📦 Creating product with images:', {
        totalImages: processedImages.length,
        mainImage: processedImages[0]?.uri?.substring(0, 50),
        allImages: processedImages.map((img, i) => `${i}: ${img.uri?.substring(0, 30)}`)
      });

      // Step 2: Prepare product data
      setCreationProgress(40);
      setCreationStep('Preparing product information...');

      // Check for stored AR data from ARViewer confirmation
      let finalHasAR = hasAR;
      let finalArScanData = arScanData;
      let finalArModelSource = 'kiri';
      let finalArModelType = null;
      let finalArModelUrl = null;
      
      if (useLocalModel) {
        // Use local model
        finalHasAR = true;
        finalArModelSource = 'local';
        finalArModelType = selectedLocalModel;
        finalArModelUrl = getLocalModelPath(selectedLocalModel);
        console.log('🏠 Using local model:', selectedLocalModel);
        console.log('🏠 Local model URL:', finalArModelUrl);
        console.log('🏠 Local model type:', finalArModelType);
        console.log('🏠 Local model source:', finalArModelSource);
      } else {
        // Use KIRI Engine or stored AR data
        try {
          const storedArData = await AsyncStorage.getItem('pending_ar_data');
          if (storedArData) {
            const parsedArData = JSON.parse(storedArData);
            console.log('💾 Retrieved stored AR data:', parsedArData);
            
            finalHasAR = true;
            finalArScanData = parsedArData.scanData;
            finalArModelSource = 'kiri';
            finalArModelUrl = parsedArData.modelUrl;
            
            // Clear the stored AR data after using it
            await AsyncStorage.removeItem('pending_ar_data');
            console.log('🗑️ Cleared stored AR data');
          }
        } catch (error) {
          console.error('❌ Error retrieving stored AR data:', error);
        }
      }

      const productData = {
        name, price, description, category, stock: parseInt(stock),
        dimensions, weight, material, warranty, bulbType, numberOfBulbs,
        voltage, ledType, lumens, isDimmable, brand, model, colorOptions,
        installationType, roomType, 
        images: processedImages,
        specifications,
        status: isActive ? 'active' : 'inactive',
        hasAR: finalHasAR,
        arScanData: finalArScanData,
        arModelSource: finalArModelSource,
        arModelType: finalArModelType,
        arModelUrl: finalArModelUrl,
        deliveryCharge,
        installationCost,
        freeDeliveryThreshold,
        installationIncluded,
      };

      // Debug: Log the product data being sent
      console.log('🔍 UploadItem Debug - Product Data:', {
        hasAR: finalHasAR,
        arModelSource: finalArModelSource,
        arModelType: finalArModelType,
        arModelUrl: finalArModelUrl,
        useLocalModel: useLocalModel,
        selectedLocalModel: selectedLocalModel
      });
      
      console.log('🔍 Final AR Model Values:', {
        finalHasAR,
        finalArModelSource,
        finalArModelType,
        finalArModelUrl: finalArModelUrl ? 'Present' : 'Missing'
      });

      // Step 3: Upload to server
      setCreationProgress(60);
      setCreationStep('Uploading to server...');
      
      const resp = await createProduct(productData);
      
      // Step 4: Finalizing
      setCreationProgress(80);
      setCreationStep('Finalizing product...');
      
      console.log('🚨 EMITTING SELLER_PRODUCT_CREATED EVENT FROM UPLOADITEM!');
      DeviceEventEmitter.emit('SELLER_PRODUCT_CREATED');
      
      // Step 5: Complete
      setCreationProgress(100);
      setCreationStep('Product created successfully!');
      
      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Hide loading overlay
      setIsCreating(false);
      
      // Store created product info - FIXED: Include all product fields for editing
      setCreatedProduct({
        id: resp.product?.id,
        name: resp.product?.name || name,
        price: resp.product?.price || price,
        category: resp.product?.category || category,
        images: resp.product?.images || processedImages,
        // Include all detailed fields for proper editing
        description: resp.product?.description || description,
        stock: resp.product?.stock || parseInt(stock),
        dimensions: resp.product?.dimensions || dimensions,
        weight: resp.product?.weight || weight,
        material: resp.product?.material || material,
        warranty: resp.product?.warranty || warranty,
        bulbType: resp.product?.bulbType || bulbType,
        numberOfBulbs: resp.product?.numberOfBulbs || numberOfBulbs,
        voltage: resp.product?.voltage || voltage,
        ledType: resp.product?.ledType || ledType,
        lumens: resp.product?.lumens || lumens,
        isDimmable: resp.product?.isDimmable || isDimmable,
        brand: resp.product?.brand || brand,
        model: resp.product?.model || model,
        colorOptions: resp.product?.colorOptions || colorOptions,
        installationType: resp.product?.installationType || installationType,
        roomType: resp.product?.roomType || roomType,
        specifications: resp.product?.specifications || specifications,
        status: resp.product?.status || (isActive ? 'active' : 'inactive'),
        hasAR: resp.product?.hasAR || hasAR,
        arScanData: resp.product?.arScanData || arScanData,
      });
      
      // Show success popup
      setShowSuccessPopup(true);
      
      // Clear form and reset to step 1 for new products (but don't navigate yet)
      if (!editMode) {
        clearForm();
        setCurrentStep(1);
        setCreationProgress(0);
        setCreationStep('');
      }
    } catch (e) {
      setIsCreating(false);
      setCreationProgress(0);
      setCreationStep('');
      Alert.alert('Error', e.message || 'Failed to create product');
    }
  };

  // Handle success popup actions
  const handleCreateAnother = () => {
    setShowSuccessPopup(false);
    setCreatedProduct(null);
    // Form is already cleared and reset to step 1
  };

  const handleViewProducts = () => {
    setShowSuccessPopup(false);
    setCreatedProduct(null);
    navigation.goBack();
  };

  const handleEditProduct = () => {
    setShowSuccessPopup(false);
    if (createdProduct?.id) {
      navigation.navigate('EditProducts', { product: createdProduct });
    }
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#FF8B47" />
      
      {/* Step-by-Step Header */}
      <View style={styles.wizardHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.wizardTitle}>Create Product</Text>
            <Text style={styles.wizardSubtitle}>Step {currentStep} of {totalSteps}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.progressText}>{Math.round((currentStep / totalSteps) * 100)}%</Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(currentStep / totalSteps) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Step Indicators */}
        <View style={styles.stepIndicators}>
          {steps.map((step, index) => (
            <TouchableOpacity 
              key={step.id}
              style={[
                styles.stepIndicator,
                currentStep >= step.id && styles.stepIndicatorActive,
                currentStep === step.id && styles.stepIndicatorCurrent
              ]}
              onPress={() => goToStep(step.id)}
            >
              <View style={[
                styles.stepCircle,
                currentStep >= step.id && styles.stepCircleActive,
                currentStep === step.id && styles.stepCircleCurrent
              ]}>
                {currentStep > step.id ? (
                  <Icon name="checkmark" size={24} color="#10B981" />
                ) : (
                  <Icon name={step.icon} size={22} color={currentStep >= step.id ? "#FF8B47" : "#64748B"} />
                )}
              </View>
              <Text style={[
                styles.stepLabel,
                currentStep >= step.id && styles.stepLabelActive
              ]}>
                {step.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Step Content */}
      <KeyboardAvoidingView 
        style={styles.stepContent} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
        {currentStep === 1 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepHeaderIcon}>
                <Icon name="camera" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Add Product Photos</Text>
                <Text style={styles.stepDescription}>Upload high-quality images to showcase your product</Text>
              </View>
              <View style={styles.photoCounter}>
                <Text style={styles.counterText}>{images.length}</Text>
                <Text style={styles.counterMax}>/5</Text>
              </View>
              
              {/* Debug Test Button */}
              <TouchableOpacity 
                style={{ 
                  position: 'absolute', 
                  top: 10, 
                  left: 10, 
                  backgroundColor: '#FF8B47', 
                  padding: 8, 
                  borderRadius: 4 
                }}
                onPress={() => {
                  Alert.alert('Debug', 'Image selection working! Check console for logs.');
                  console.log('🧪 Debug: Image selection button pressed');
                  console.log('🧪 Current images state:', images);
                }}
              >
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>TEST</Text>
              </TouchableOpacity>
            </View>

            {/* Featured Photo */}
            {images.length > 0 && images[0] ? (
              <View style={styles.featuredPhoto}>
                <Image 
                source={{ uri: images[0].uri }} 
                style={styles.featuredImage} 
                resizeMode="cover"
                onError={(error) => {
                  console.log('❌ Image load failed:', error.nativeEvent.error);
                  console.log('❌ Attempted URI:', images[0].uri);
                }}
                onLoad={() => {
                  console.log('✅ Image loaded successfully!');
                  console.log('✅ URI:', images[0].uri);
                }}
              />
              <TouchableOpacity 
                style={styles.imageEditOverlay}
                onPress={() => handleSelectImage(0)}
              >
                <Icon name="create" size={20} color="#FFF" />
              </TouchableOpacity>
              
              <View style={styles.featuredOverlay}>
                <View style={styles.featuredBadge}>
                  <Icon name="camera" size={18} color="#FFF" />
                  <Text style={styles.featuredBadgeText}>Main Photo</Text>
                </View>
                <TouchableOpacity 
                  style={styles.featuredRemove} 
                  onPress={(e) => {
                    e.stopPropagation();
                    removeImage(0);
                  }}
                >
                  <Icon name="trash" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.featuredPlaceholder} onPress={() => handleSelectImage(0)}>
              <View style={styles.uploadIcon}>
                <Icon name="cloud-upload" size={40} color="#FF8B47" />
              </View>
              <Text style={styles.uploadText}>Add your first photo</Text>
              <Text style={styles.uploadHint}>Tap to browse gallery</Text>
            </TouchableOpacity>
          )}

          {/* Photo Thumbnails */}
          <View style={styles.thumbnailRow}>
            {Array.from({ length: 4 }, (_, i) => i + 1).map((index) => {
              const image = images[index];
              return (
                <TouchableOpacity 
                  key={index} 
                  style={styles.thumbnail}
                  onPress={() => handleSelectImage(index)}
                >
                  {image ? (
                    <View style={styles.thumbnailContainer}>
                      <Image 
                        source={{ 
                          uri: typeof image === 'string' 
                            ? `${BASE_URL}${image}` 
                            : image?.uri || image?.path
                        }} 
                        style={styles.thumbnailImage} 
                        resizeMode="cover"
                        onError={(error) => {
                          console.log(`Thumbnail ${index} load error:`, error);
                        }}
                      />
                      <View style={styles.thumbnailOverlay}>
                        <TouchableOpacity 
                          style={styles.thumbnailRemove} 
                          onPress={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                        >
                          <Icon name="close" size={12} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.thumbnailEdit} 
                          onPress={(e) => {
                            e.stopPropagation();
                            handleSelectImage(index);
                          }}
                        >
                          <Icon name="create-outline" size={10} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.thumbnailBadge}>
                        <Text style={styles.thumbnailBadgeText}>{index + 1}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Icon name="add" size={24} color="#FF8B47" />
                      <Text style={styles.thumbnailPlaceholderText}>Photo {index + 1}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepHeaderIcon}>
                <Icon name="information-circle" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Basic Information</Text>
                <Text style={styles.stepDescription}>Enter essential product details</Text>
              </View>
            </View>

            {/* Basic Information */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Essential Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Crystal Chandelier"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.rowContainer}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Price *</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.currencySymbol}>₱</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={price}
                      onChangeText={setPrice}
                      placeholder="Enter price (e.g., 1500)"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Stock *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={stock}
                    onChangeText={setStock}
                    placeholder="Available stock (e.g., 10)"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category *</Text>
                <TouchableOpacity 
                  style={styles.selector}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Text style={category ? styles.selectedText : styles.placeholderText}>
                    {category || 'Choose category'}
                  </Text>
                  <Icon name="chevron-down" size={20} color="#FF8B47" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your product features, materials, and benefits..."
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Delivery and Installation Section */}
              <View style={styles.inputGroup}>
                <Text style={styles.sectionTitle}>Delivery & Installation</Text>
                
                <View style={styles.rowContainer}>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>Delivery Charge (₱)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={deliveryCharge}
                      onChangeText={setDeliveryCharge}
                      placeholder="e.g., 150"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>Installation Cost (₱)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={installationCost}
                      onChangeText={setInstallationCost}
                      placeholder="e.g., 300"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.rowContainer}>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>Free Delivery Threshold (₱)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={freeDeliveryThreshold}
                      onChangeText={setFreeDeliveryThreshold}
                      placeholder="e.g., 2000"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.halfInput}>
                    <View style={styles.switchContainer}>
                      <Text style={styles.inputLabel}>Installation Included</Text>
                      <Switch
                        value={installationIncluded}
                        onValueChange={setInstallationIncluded}
                        trackColor={{ false: '#E2E8F0', true: '#FF8B47' }}
                        thumbColor={installationIncluded ? '#FFFFFF' : '#FFFFFF'}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepHeaderIcon}>
                <Icon name="list" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Product Details</Text>
                <Text style={styles.stepDescription}>Add brand, dimensions, and specifications</Text>
              </View>
            </View>

        {/* Product Details */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          
          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Brand</Text>
              <TextInput
                style={styles.textInput}
                value={brand}
                onChangeText={setBrand}
                placeholder="Brand name (e.g., Philips, IKEA)"
                  placeholderTextColor="#64748B"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Model</Text>
              <TextInput
                style={styles.textInput}
                value={model}
                onChangeText={setModel}
                placeholder="Model number (e.g., CL-2024)"
                  placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Dimensions</Text>
              <TextInput
                style={styles.textInput}
                value={dimensions}
                onChangeText={setDimensions}
                placeholder="Dimensions (e.g., 30cm x 20cm x 15cm)"
                  placeholderTextColor="#64748B"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Weight</Text>
              <TextInput
                style={styles.textInput}
                value={weight}
                onChangeText={setWeight}
                placeholder="Weight in kg (e.g., 2.5)"
                  placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Material</Text>
            <TextInput
              style={styles.textInput}
              value={material}
              onChangeText={setMaterial}
              placeholder="Materials used (e.g., Crystal, Metal, Glass)"
                  placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Warranty</Text>
            <TextInput
              style={styles.textInput}
              value={warranty}
              onChangeText={setWarranty}
              placeholder="Warranty period (e.g., 1 Year Warranty)"
                  placeholderTextColor="#64748B"
            />
          </View>

          {/* Local 3D Model Switch */}
          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
            </View>
            <Switch
              value={useLocalModel}
              onValueChange={setUseLocalModel}
              trackColor={{ false: '#E2E8F0', true: '#10B981' }}
              thumbColor={useLocalModel ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Technical Specifications */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Technical Specifications</Text>
          
          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Bulb Type</Text>
              <TextInput
                style={styles.textInput}
                value={bulbType}
                onChangeText={setBulbType}
                placeholder="Bulb type (e.g., LED, Halogen)"
                  placeholderTextColor="#64748B"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Number of Bulbs</Text>
              <TextInput
                style={styles.textInput}
                value={numberOfBulbs}
                onChangeText={setNumberOfBulbs}
                placeholder="Number of bulbs (e.g., 6)"
                  placeholderTextColor="#64748B"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Voltage</Text>
              <TextInput
                style={styles.textInput}
                value={voltage}
                onChangeText={setVoltage}
                placeholder="Voltage (e.g., 220V)"
                  placeholderTextColor="#64748B"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>LED Type</Text>
              <TextInput
                style={styles.textInput}
                value={ledType}
                onChangeText={setLedType}
                placeholder="LED type (e.g., SMD, COB)"
                  placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Lumens</Text>
            <TextInput
              style={styles.textInput}
              value={lumens}
              onChangeText={setLumens}
              placeholder="Light output (e.g., 3000 lm)"
                  placeholderTextColor="#64748B"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Icon name="bulb-outline" size={24} color="#FF8B47" />
              <Text style={styles.featureLabel}>Dimmable</Text>
            </View>
            <Switch
              value={isDimmable}
              onValueChange={setIsDimmable}
              trackColor={{ false: '#E0E0E0', true: '#FF8B47' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
            />
          </View>
        </View>

        {/* Product Options */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Product Options</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Installation Type</Text>
            <TouchableOpacity 
              style={styles.selector}
              onPress={() => setShowInstallationModal(true)}
            >
              <Text style={installationType ? styles.selectedText : styles.placeholderText}>
                {installationType || 'Select installation type'}
              </Text>
              <Icon name="chevron-down" size={20} color="#FF8B47" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Suitable Room</Text>
            <TouchableOpacity 
              style={styles.selector}
              onPress={() => setShowRoomModal(true)}
            >
              <Text style={roomType ? styles.selectedText : styles.placeholderText}>
                {roomType || 'Select room type'}
              </Text>
              <Icon name="chevron-down" size={20} color="#FF8B47" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Available Colors</Text>
            <TouchableOpacity 
              style={styles.selector}
              onPress={() => setShowColorModal(true)}
            >
              <Text style={colorOptions.length > 0 ? styles.selectedText : styles.placeholderText}>
                {colorOptions.length > 0 ? `${colorOptions.length} colors selected` : 'Select colors'}
              </Text>
              <Icon name="chevron-down" size={20} color="#FF8B47" />
            </TouchableOpacity>
            {colorOptions.length > 0 && (
              <View style={styles.colorChipsContainer}>
                {colorOptions.map((color, index) => (
                  <View key={index} style={styles.colorChip}>
                    <Text style={styles.colorChipText}>{color}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Custom Specifications */}
        <View style={styles.formSection}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>Custom Specifications</Text>
            <TouchableOpacity style={styles.addSpecButton} onPress={addSpecification}>
              <Icon name="add" size={20} color="#FF8B47" />
            </TouchableOpacity>
          </View>
          
          {specifications.map((spec, index) => (
            <View key={index} style={styles.specRow}>
              <TextInput
                style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                value={spec.name}
                onChangeText={(text) => updateSpecification(index, 'name', text)}
                placeholder="Specification name (e.g., Color Temperature)"
                  placeholderTextColor="#64748B"
              />
              <TextInput
                style={[styles.textInput, { flex: 1, marginLeft: 8 }]}
                value={spec.value}
                onChangeText={(text) => updateSpecification(index, 'value', text)}
                placeholder="Value (e.g., 3000K)"
                  placeholderTextColor="#64748B"
              />
              <TouchableOpacity 
                style={styles.removeSpecButton}
                onPress={() => removeSpecification(index)}
              >
                <Icon name="trash-outline" size={18} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* AR & Status */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Additional Features</Text>
          
          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Icon name="scan-outline" size={24} color="#FF8B47" />
              <Text style={styles.featureLabel}>AR Model</Text>
            </View>
            <TouchableOpacity
              style={[styles.featureButton, { backgroundColor: '#FF8B47' }]}
              onPress={() => {
                console.log('🎯 CREATE 3D MODEL button pressed');
                console.log('📋 Product name:', name);
                console.log('🧭 Navigation object:', navigation);
                
                // Direct navigation for testing
                try {
                  console.log('🚀 Direct navigation to KiriEngineScanner...');
                  navigation.navigate('KiriEngineScanner', {
                    productId: null,
                    productName: name || 'New Product'
                  });
                  console.log('✅ Direct navigation successful');
                } catch (error) {
                  console.error('❌ Direct navigation failed:', error);
                  Alert.alert('Navigation Error', 'Failed to open KIRI Scanner. Please try again.');
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.featureButtonContent}>
                <Icon 
                  name={hasAR ? 'cube' : 'cube-outline'} 
                  size={20} 
                  color={hasAR ? '#10B981' : '#FFFFFF'} 
                />
                <Text style={[styles.featureButtonText, hasAR && styles.featureButtonTextSuccess]}>
                  {hasAR ? 'KIRI 3D Model ✓' : 'Create 3D Model'}
                </Text>
              </View>
              {hasAR && arScanData && (
                <View style={styles.arModelInfo}>
                  <Text style={styles.arModelInfoText}>
                    {arScanData.isMock ? '🧪 Test Model' : '🎯 Professional GLB'}
                  </Text>
                  <Text style={styles.arModelInfoText}>
                    {arScanData.fileSize || 'Processing...'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>


          {/* KIRI Engine Test Button - Development Only */}
          {__DEV__ && (
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <Icon name="flask-outline" size={24} color="#3B82F6" />
                <Text style={styles.featureLabel}>KIRI Test</Text>
              </View>
              <TouchableOpacity
                style={[styles.featureButton, { backgroundColor: '#3B82F6' }]}
                onPress={() => navigation.navigate('KiriEngineTest')}
              >
                <View style={styles.featureButtonContent}>
                  <Icon name="bug" size={20} color="#FFFFFF" />
                  <Text style={styles.featureButtonText}>Test KIRI Engine</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Icon name="eye-outline" size={24} color="#FF8B47" />
              <Text style={styles.featureLabel}>Visibility</Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#E0E0E0', true: '#FF8B47' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
            />
          </View>
        </View>

          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepHeaderIcon}>
                <Icon name="list" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Product Details</Text>
                <Text style={styles.stepDescription}>Add brand, dimensions, and specifications</Text>
              </View>
            </View>

            {/* Brand & Model */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Brand & Model</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Brand</Text>
                <TextInput
                  style={styles.textInput}
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="Enter brand name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Model</Text>
                <TextInput
                  style={styles.textInput}
                  value={model}
                  onChangeText={setModel}
                  placeholder="Enter model number"
                />
              </View>
            </View>

            {/* Physical Specifications */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Physical Specifications</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dimensions</Text>
                <TextInput
                  style={styles.textInput}
                  value={dimensions}
                  onChangeText={setDimensions}
                  placeholder="e.g., 30cm x 20cm x 15cm"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight</Text>
                <TextInput
                  style={styles.textInput}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="e.g., 2.5kg"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Material</Text>
                <TextInput
                  style={styles.textInput}
                  value={material}
                  onChangeText={setMaterial}
                  placeholder="e.g., Aluminum, Glass, Plastic"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Warranty</Text>
                <TextInput
                  style={styles.textInput}
                  value={warranty}
                  onChangeText={setWarranty}
                  placeholder="e.g., 2 years"
                />
              </View>
            </View>
          </View>
        )}

        {currentStep === 4 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepHeaderIcon}>
                <Icon name="bulb" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Technical Specifications</Text>
                <Text style={styles.stepDescription}>Configure lighting and electrical details</Text>
              </View>
            </View>

            {/* Lighting Specifications */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Lighting Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bulb Type</Text>
                <TextInput
                  style={styles.textInput}
                  value={bulbType}
                  onChangeText={setBulbType}
                  placeholder="e.g., LED, Halogen, Incandescent"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Number of Bulbs</Text>
                <TextInput
                  style={styles.textInput}
                  value={numberOfBulbs}
                  onChangeText={setNumberOfBulbs}
                  placeholder="e.g., 1, 3, 5"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Voltage</Text>
                <TextInput
                  style={styles.textInput}
                  value={voltage}
                  onChangeText={setVoltage}
                  placeholder="e.g., 220V, 12V"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>LED Type</Text>
                <TextInput
                  style={styles.textInput}
                  value={ledType}
                  onChangeText={setLedType}
                  placeholder="e.g., SMD, COB, Filament"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Lumens</Text>
                <TextInput
                  style={styles.textInput}
                  value={lumens}
                  onChangeText={setLumens}
                  placeholder="e.g., 800, 1200, 2000"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Advanced Features */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Features</Text>
              
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Dimmable</Text>
                <Switch
                  value={isDimmable}
                  onValueChange={setIsDimmable}
                  trackColor={{ false: '#E2E8F0', true: '#FF8B47' }}
                  thumbColor={isDimmable ? '#FFFFFF' : '#94A3B8'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Installation Type</Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => setShowInstallationModal(true)}
                >
                  <Text style={[styles.selectText, !installationType && styles.placeholderText]}>
                    {installationType || 'Select installation type'}
                  </Text>
                  <Icon name="chevron-down" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Room Type</Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => setShowRoomModal(true)}
                >
                  <Text style={[styles.selectText, !roomType && styles.placeholderText]}>
                    {roomType || 'Select room type'}
                  </Text>
                  <Icon name="chevron-down" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {currentStep === 5 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepHeaderIcon}>
                <Icon name="checkmark-circle" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Review & Publish</Text>
                <Text style={styles.stepDescription}>Final check before publishing your product</Text>
              </View>
            </View>

            {/* Product Summary */}
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Product Summary</Text>
              
              <View style={styles.reviewCard}>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Name:</Text>
                  <Text style={styles.reviewValue}>{name || 'Not set'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Price:</Text>
                  <Text style={styles.reviewValue}>{price ? `$${price}` : 'Not set'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Category:</Text>
                  <Text style={styles.reviewValue}>{category || 'Not set'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Stock:</Text>
                  <Text style={styles.reviewValue}>{stock || 'Not set'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Brand:</Text>
                  <Text style={styles.reviewValue}>{brand || 'Not set'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Images:</Text>
                  <Text style={styles.reviewValue}>{images.length} photo(s)</Text>
                </View>
              </View>
            </View>

            {/* Status Toggle */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Publication Status</Text>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Active Product</Text>
                  <Text style={styles.switchDescription}>
                    {isActive ? 'Product will be visible to buyers' : 'Product will be hidden from buyers'}
                  </Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                  thumbColor={isActive ? '#FFFFFF' : '#94A3B8'}
                />
              </View>
            </View>
          </View>
        )}
        
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
            <Icon name="chevron-back" size={24} color="#FF8B47" />
            <Text style={styles.prevButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.buttonSpacer} />
        {currentStep < totalSteps ? (
          <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Icon name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.submitButton, isCreating && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={isCreating}
          >
            <Text style={[styles.submitButtonText, isCreating && styles.submitButtonTextDisabled]}>
              {isCreating ? 'Creating...' : (editMode ? 'Update' : 'Create')}
            </Text>
            <Icon 
              name={isCreating ? "hourglass-outline" : "add-circle"} 
              size={24} 
              color={isCreating ? "#94A3B8" : "#FF8B47"} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* All Modals */}
      {/* Category Selection Modal */}
      {showCategoryModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categories.map((cat, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.categoryOption}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[styles.categoryOptionText, cat === category && styles.selectedCategoryText]}>
                    {cat}
                  </Text>
                  {cat === category && (
                    <Icon name="checkmark" size={20} color="#FF8B47" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Installation Type Modal */}
      {showInstallationModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Installation Type</Text>
              <TouchableOpacity onPress={() => setShowInstallationModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {installationTypes.map((type, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.categoryOption}
                  onPress={() => {
                    setInstallationType(type);
                    setShowInstallationModal(false);
                  }}
                >
                  <Text style={[styles.categoryOptionText, type === installationType && styles.selectedCategoryText]}>
                    {type}
                  </Text>
                  {type === installationType && (
                    <Icon name="checkmark" size={20} color="#FF8B47" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Room Type Modal */}
      {showRoomModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Room Type</Text>
              <TouchableOpacity onPress={() => setShowRoomModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {roomTypes.map((room, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.categoryOption}
                  onPress={() => {
                    setRoomType(room);
                    setShowRoomModal(false);
                  }}
                >
                  <Text style={[styles.categoryOptionText, room === roomType && styles.selectedCategoryText]}>
                    {room}
                  </Text>
                  {room === roomType && (
                    <Icon name="checkmark" size={20} color="#FF8B47" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Color Selection Modal */}
      {showColorModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Colors</Text>
              <TouchableOpacity onPress={() => setShowColorModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.modalSubtitle}>Select multiple colors available for this product:</Text>
              {availableColors.map((color, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.categoryOption}
                  onPress={() => toggleColor(color)}
                >
                  <Text style={[styles.categoryOptionText, colorOptions.includes(color) && styles.selectedCategoryText]}>
                    {color}
                  </Text>
                  {colorOptions.includes(color) && (
                    <Icon name="checkmark" size={20} color="#FF8B47" />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={styles.modalDoneButton}
                onPress={() => setShowColorModal(false)}
              >
                <Text style={styles.modalDoneText}>Done ({colorOptions.length} selected)</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Custom Loading Overlay */}
      {isCreating && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingHeader}>
              <Icon name="cloud-upload-outline" size={48} color="#FF8B47" />
              <Text style={styles.loadingTitle}>Creating Your Product</Text>
              <Text style={styles.loadingSubtitle}>Please wait while we process your product...</Text>
            </View>
            
            <View style={styles.progressSection}>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarTrack}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${creationProgress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{creationProgress}%</Text>
              </View>
              
              <Text style={styles.progressStepText}>{creationStep}</Text>
            </View>
            
            <View style={styles.loadingSteps}>
              <View style={[styles.stepItem, creationProgress >= 20 && styles.stepCompleted]}>
                <Icon name={creationProgress >= 20 ? "checkmark-circle" : "ellipse-outline"} size={20} color={creationProgress >= 20 ? "#10B981" : "#94A3B8"} />
                <Text style={[styles.stepText, creationProgress >= 20 && styles.stepTextCompleted]}>Processing Images</Text>
              </View>
              <View style={[styles.stepItem, creationProgress >= 40 && styles.stepCompleted]}>
                <Icon name={creationProgress >= 40 ? "checkmark-circle" : "ellipse-outline"} size={20} color={creationProgress >= 40 ? "#10B981" : "#94A3B8"} />
                <Text style={[styles.stepText, creationProgress >= 40 && styles.stepTextCompleted]}>Preparing Data</Text>
              </View>
              <View style={[styles.stepItem, creationProgress >= 60 && styles.stepCompleted]}>
                <Icon name={creationProgress >= 60 ? "checkmark-circle" : "ellipse-outline"} size={20} color={creationProgress >= 60 ? "#10B981" : "#94A3B8"} />
                <Text style={[styles.stepText, creationProgress >= 60 && styles.stepTextCompleted]}>Uploading to Server</Text>
              </View>
              <View style={[styles.stepItem, creationProgress >= 80 && styles.stepCompleted]}>
                <Icon name={creationProgress >= 80 ? "checkmark-circle" : "ellipse-outline"} size={20} color={creationProgress >= 80 ? "#10B981" : "#94A3B8"} />
                <Text style={[styles.stepText, creationProgress >= 80 && styles.stepTextCompleted]}>Finalizing</Text>
              </View>
              <View style={[styles.stepItem, creationProgress >= 100 && styles.stepCompleted]}>
                <Icon name={creationProgress >= 100 ? "checkmark-circle" : "ellipse-outline"} size={20} color={creationProgress >= 100 ? "#10B981" : "#94A3B8"} />
                <Text style={[styles.stepText, creationProgress >= 100 && styles.stepTextCompleted]}>Complete!</Text>
              </View>
            </View>
            
            {creationProgress < 100 && (
              <View style={styles.loadingAnimation}>
                <Animated.View style={[styles.loadingDot, { opacity: dot1Anim }]} />
                <Animated.View style={[styles.loadingDot, { opacity: dot2Anim }]} />
                <Animated.View style={[styles.loadingDot, { opacity: dot3Anim }]} />
              </View>
            )}
          </View>
        </View>
      )}

      {/* Custom Success Popup */}
      {showSuccessPopup && createdProduct && (
        <View style={styles.successOverlay}>
          <View style={styles.successContainer}>
            <View style={styles.successHeader}>
              <View style={styles.successIconContainer}>
                <Icon name="checkmark-circle" size={64} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>🎉 Product Created!</Text>
              <Text style={styles.successSubtitle}>Your product has been successfully uploaded and is now live!</Text>
            </View>
            
            <View style={styles.productSummary}>
              <Text style={styles.summaryTitle}>Product Summary</Text>
              
              <View style={styles.summaryCard}>
                {createdProduct.images && createdProduct.images.length > 0 && (
                  <Image 
                    source={{ uri: createdProduct.images[0]?.url || createdProduct.images[0] }} 
                    style={styles.summaryImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.summaryDetails}>
                  <Text style={styles.summaryProductName}>{createdProduct.name}</Text>
                  <Text style={styles.summaryProductPrice}>${createdProduct.price}</Text>
                  <Text style={styles.summaryProductCategory}>{createdProduct.category}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.successActions}>
              <TouchableOpacity 
                style={styles.primarySuccessButton}
                onPress={handleCreateAnother}
              >
                <Icon name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.primarySuccessButtonText}>Create Another</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondarySuccessButton}
                onPress={handleEditProduct}
              >
                <Icon name="create-outline" size={20} color="#FF8B47" />
                <Text style={styles.secondarySuccessButtonText}>Edit Product</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.tertiarySuccessButton}
                onPress={handleViewProducts}
              >
                <Icon name="storefront-outline" size={20} color="#6B7280" />
                <Text style={styles.tertiarySuccessButtonText}>View All Products</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      </View>
    </>
  );
}
