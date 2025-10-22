import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Switch,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  DeviceEventEmitter,
  PermissionsAndroid
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import ImageCropPicker from 'react-native-image-crop-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { updateProduct, getSellerProductById } from '../../api/productApi';
import { getMainImageUri } from '../../utils/imageUtils';
import { BASE_URL } from '../../api/api';
import styles from './styles/EditProducts.style';

// Predefined options
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

export default function EditProducts({ route, navigation }) {
  const { product: initialProduct } = route.params || {};
  const insets = useSafeAreaInsets();
  
  // State to hold current product data (can be refreshed)
  const [currentProduct, setCurrentProduct] = useState(initialProduct);
  const product = currentProduct; // Use current product data
  
  // Debug logging for navigation
  console.log('🔍 EditProducts - Screen loaded successfully!');
  console.log('🔍 EditProducts - Route params:', route?.params);
  console.log('🔍 EditProducts - Navigation object:', !!navigation);
  
  // Debug logging for product data
  console.log('🔍 EditProducts - Product data received:', {
    hasProduct: !!product,
    productId: product?.id,
    productName: product?.name,
    productPrice: product?.price,
    productDescription: product?.description,
    productCategory: product?.category,
    productStock: product?.stock,
    imagesType: typeof product?.images,
    imagesIsArray: Array.isArray(product?.images),
    imagesLength: product?.images?.length,
    imagesData: product?.images,
    colorOptionsType: typeof product?.colorOptions,
    colorOptionsIsArray: Array.isArray(product?.colorOptions),
    colorOptionsData: product?.colorOptions,
    specificationsType: typeof product?.specifications,
    specificationsIsArray: Array.isArray(product?.specifications),
    specificationsData: product?.specifications,
    fullProduct: product
  });

  // FIXED: Form state - better initialization with product data
  const [name, setName] = useState(() => {
    console.log('🏷️ Initializing name with:', product?.name);
    return product?.name || '';
  });
  const [price, setPrice] = useState(() => {
    console.log('💰 Initializing price with:', product?.price);
    return product?.price?.toString() || '';
  });
  const [description, setDescription] = useState(() => {
    console.log('📝 Initializing description with:', product?.description);
    return product?.description || '';
  });
  const [category, setCategory] = useState(() => {
    console.log('📂 Initializing category with:', product?.category);
    return product?.category || '';
  });
  const [stock, setStock] = useState(() => {
    console.log('📦 Initializing stock with:', product?.stock);
    return product?.stock?.toString() || '1';
  });
  const [dimensions, setDimensions] = useState(() => {
    console.log('📏 Initializing dimensions with:', product?.dimensions);
    return product?.dimensions || '';
  });
  const [weight, setWeight] = useState(() => {
    console.log('⚖️ Initializing weight with:', product?.weight);
    return product?.weight || '';
  });
  const [material, setMaterial] = useState(() => {
    console.log('🔧 Initializing material with:', product?.material);
    return product?.material || '';
  });
  const [warranty, setWarranty] = useState(() => {
    console.log('🛡️ Initializing warranty with:', product?.warranty);
    return product?.warranty || '';
  });
  const [bulbType, setBulbType] = useState(() => {
    console.log('💡 Initializing bulbType with:', product?.bulbType);
    return product?.bulbType || '';
  });
  const [numberOfBulbs, setNumberOfBulbs] = useState(() => {
    console.log('🔢 Initializing numberOfBulbs with:', product?.numberOfBulbs);
    return product?.numberOfBulbs?.toString() || '';
  });
  const [voltage, setVoltage] = useState(() => {
    console.log('⚡ Initializing voltage with:', product?.voltage);
    return product?.voltage || '';
  });
  const [ledType, setLedType] = useState(() => {
    console.log('💡 Initializing ledType with:', product?.ledType);
    return product?.ledType || '';
  });
  const [lumens, setLumens] = useState(() => {
    console.log('🌟 Initializing lumens with:', product?.lumens);
    console.log('🌟 Lumens type:', typeof product?.lumens);
    console.log('🌟 Lumens toString:', product?.lumens?.toString());
    return product?.lumens?.toString() || '';
  });
  const [isDimmable, setIsDimmable] = useState(() => {
    console.log('🎛️ Initializing isDimmable with:', product?.isDimmable);
    return Boolean(product?.isDimmable);
  });
  const [brand, setBrand] = useState(() => {
    console.log('🏢 Initializing brand with:', product?.brand);
    return product?.brand || '';
  });
  const [model, setModel] = useState(() => {
    console.log('🏷️ Initializing model with:', product?.model);
    return product?.model || '';
  });
  
  // FIXED: Add useEffect to update form data when product changes
  useEffect(() => {
    console.log('🔄 EditProducts useEffect - Product data changed:', {
      hasProduct: !!product,
      productId: product?.id,
      productName: product?.name,
      productPrice: product?.price
    });
    
    if (product) {
      console.log('🔄 Updating form fields with product data...');
      
      // Update all form fields with product data
      setName(product.name || '');
      setPrice(product.price?.toString() || '');
      setDescription(product.description || '');
      setCategory(product.category || '');
      setStock(product.stock?.toString() || '1');
      setDimensions(product.dimensions || '');
      setWeight(product.weight || '');
      setMaterial(product.material || '');
      setWarranty(product.warranty || '');
      setBulbType(product.bulbType || '');
      setNumberOfBulbs(product.numberOfBulbs?.toString() || '');
      setVoltage(product.voltage || '');
      setLedType(product.ledType || '');
      console.log('🔄 Setting lumens from product data:', {
        lumens: product.lumens,
        lumensType: typeof product.lumens,
        lumensString: product.lumens?.toString()
      });
      setLumens(product.lumens?.toString() || '');
      setIsDimmable(Boolean(product.isDimmable));
      setBrand(product.brand || '');
      setModel(product.model || '');
      setInstallationType(product.installationType || '');
      setRoomType(product.roomType || '');
      setIsActive(product.status === 'active' || !product.status);
      
      // Update delivery and installation fields
      setDeliveryCharge(product.deliveryCharge?.toString() || '');
      setInstallationCost(product.installationCost?.toString() || '');
      setFreeDeliveryThreshold(product.freeDeliveryThreshold?.toString() || '');
      setInstallationIncluded(Boolean(product.installationIncluded));
      
      // Handle colorOptions
      if (Array.isArray(product.colorOptions)) {
        setColorOptions(product.colorOptions);
      } else if (typeof product.colorOptions === 'string') {
        try {
          const parsed = JSON.parse(product.colorOptions);
          setColorOptions(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.log('⚠️ Failed to parse colorOptions JSON:', product.colorOptions);
          setColorOptions([]);
        }
      } else {
        setColorOptions([]);
      }
      
      // Handle specifications
      if (Array.isArray(product.specifications)) {
        setSpecifications(product.specifications);
      } else if (typeof product.specifications === 'string') {
        try {
          const parsed = JSON.parse(product.specifications);
          setSpecifications(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.log('⚠️ Failed to parse specifications JSON:', product.specifications);
          setSpecifications([]);
        }
      } else {
        setSpecifications([]);
      }
      
      // Handle images
      if (Array.isArray(product.images)) {
        console.log('📸 Setting images from product data:', product.images.length, 'images');
        setImages(product.images);
      } else {
        console.log('📸 No images found in product data');
        setImages([]);
      }
      
      console.log('✅ Form fields updated with product data');
      
      // Debug: Log the actual form field values after setting them
      setTimeout(() => {
        console.log('🔍 Form field values after update:', {
          name: name,
          price: price,
          description: description,
          category: category,
          stock: stock,
          brand: brand,
          model: model,
          dimensions: dimensions,
          weight: weight,
          material: material,
          warranty: warranty,
          bulbType: bulbType,
          numberOfBulbs: numberOfBulbs,
          voltage: voltage,
          ledType: ledType,
          lumens: lumens,
          isDimmable: isDimmable,
          installationType: installationType,
          roomType: roomType,
          isActive: isActive,
          colorOptionsCount: colorOptions.length,
          specificationsCount: specifications.length,
          imagesCount: images.length
        });
      }, 100);
    }
  }, [product]);
  const [colorOptions, setColorOptions] = useState(() => {
    if (!product?.colorOptions) return [];
    if (Array.isArray(product.colorOptions)) return product.colorOptions;
    if (typeof product.colorOptions === 'string') {
      try {
        return JSON.parse(product.colorOptions);
      } catch (e) {
        console.log('⚠️ Failed to parse colorOptions JSON:', product.colorOptions);
        return [];
      }
    }
    return [];
  });
  const [installationType, setInstallationType] = useState(product?.installationType || '');
  const [roomType, setRoomType] = useState(product?.roomType || '');
  const [isActive, setIsActive] = useState(product?.status === 'active' || !product?.status);
  const [images, setImages] = useState(() => {
    if (!product?.images) return [];
    if (Array.isArray(product.images)) {
      console.log('📸 Initializing images from product data:', product.images);
      return product.images;
    }
    return [];
  });
  const [specifications, setSpecifications] = useState(() => {
    if (!product?.specifications) return [];
    if (Array.isArray(product.specifications)) return product.specifications;
    if (typeof product.specifications === 'string') {
      try {
        return JSON.parse(product.specifications);
      } catch (e) {
        console.log('⚠️ Failed to parse specifications JSON:', product.specifications);
        return [];
      }
    }
    return [];
  });
  
  // Additional product tracking fields
  const [sold, setSold] = useState(product?.sold || 0);
  const [views, setViews] = useState(product?.views || 0);
  const [rating, setRating] = useState(product?.rating || 0);

  // Debug: Log state after initialization
  useEffect(() => {
    console.log('🔍 EditProducts - State initialized:', {
      name: name,
      price: price,
      description: description,
      category: category,
      stock: stock,
      imagesLength: images.length,
      imagesData: images,
      colorOptionsLength: colorOptions.length,
      colorOptionsData: colorOptions,
      specificationsLength: specifications.length,
      specificationsData: specifications
    });
  }, []);
  const [reviewCount, setReviewCount] = useState(product?.reviewCount || 0);

  // AR scanning states - FIXED: Added missing AR functionality
  const [hasAR, setHasAR] = useState(() => {
    console.log('🎯 Initializing hasAR with:', product?.hasAR);
    return Boolean(product?.hasAR);
  });
  const [arScanData, setArScanData] = useState(() => {
    console.log('📱 Initializing arScanData with:', product?.arScanData);
    return product?.arScanData || null;
  });

  // Delivery and installation states
  const [deliveryCharge, setDeliveryCharge] = useState(() => {
    console.log('🚚 Initializing deliveryCharge with:', product?.deliveryCharge);
    return product?.deliveryCharge?.toString() || '';
  });
  const [installationCost, setInstallationCost] = useState(() => {
    console.log('🔧 Initializing installationCost with:', product?.installationCost);
    return product?.installationCost?.toString() || '';
  });
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(() => {
    console.log('🎁 Initializing freeDeliveryThreshold with:', product?.freeDeliveryThreshold);
    return product?.freeDeliveryThreshold?.toString() || '';
  });
  const [installationIncluded, setInstallationIncluded] = useState(() => {
    console.log('✅ Initializing installationIncluded with:', product?.installationIncluded);
    return Boolean(product?.installationIncluded);
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Function to refresh product data from server
  const refreshProductData = async () => {
    if (!product?.id) return;
    
    try {
      console.log('🔄 Refreshing product data for ID:', product.id);
      const response = await getSellerProductById(product.id);
      console.log('✅ Fresh product data received:', {
        lumens: response.product?.lumens,
        lumensType: typeof response.product?.lumens,
        numberOfBulbs: response.product?.numberOfBulbs,
        brand: response.product?.brand,
        fullProduct: response.product
      });
      
      if (response.product) {
        console.log('🔄 Setting current product with fresh data');
        setCurrentProduct(response.product);
      }
    } catch (error) {
      console.error('❌ Error refreshing product data:', error);
    }
  };
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showInstallationModal, setShowInstallationModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);

  // Listen for AR scan completion - FIXED: Updated event name and added state updates
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('AR_SCAN_COMPLETE', (data) => {
      console.log('🎉 AR scan completed for existing product:', data.scanData);
      
      // Update product with AR scan data
      if (data.scanData && data.productId === product.id) {
        setArScanData(data.scanData);
        setHasAR(true);
        setHasChanges(true);
        
        // Emit event to refresh product data
        DeviceEventEmitter.emit('SELLER_PRODUCT_UPDATED');
        
        Alert.alert(
          '✅ 3D Model Created!',
          `Your ${product.name || 'product'} now has a professional 3D model!\n\n📊 KIRI Engine Results:\n• GLB model generated\n• File size: ${data.scanData.fileSize || 'Processing...'}\n• Quality: ${data.scanData.quality || 'High Quality'}\n\n🎯 Customers can now view it in AR before purchasing!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    });

    return () => subscription.remove();
  }, [navigation, product.id, product.name]);

  // Refresh product data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 EditProducts screen focused, refreshing product data...');
      refreshProductData();
    }, [product?.id])
  );

  // Monitor lumens state changes
  useEffect(() => {
    console.log('🌟 Lumens state changed to:', {
      lumens: lumens,
      lumensType: typeof lumens,
      lumensLength: lumens?.length
    });
  }, [lumens]);

  // Track changes
  useEffect(() => {
    const currentData = {
      name, price, description, category, stock, dimensions, weight, material,
      warranty, bulbType, numberOfBulbs, voltage, ledType, lumens, isDimmable,
      brand, model, colorOptions, installationType, roomType, isActive, images, specifications,
      sold, views, rating, reviewCount
    };
    
    const originalData = {
      name: product?.name || '',
      price: product?.price?.toString() || '',
      description: product?.description || '',
      category: product?.category || '',
      stock: product?.stock?.toString() || '1',
      dimensions: product?.dimensions || '',
      weight: product?.weight || '',
      material: product?.material || '',
      warranty: product?.warranty || '',
      bulbType: product?.bulbType || '',
      numberOfBulbs: product?.numberOfBulbs || '',
      voltage: product?.voltage || '',
      ledType: product?.ledType || '',
      lumens: product?.lumens || '',
      isDimmable: product?.isDimmable || false,
      brand: product?.brand || '',
      model: product?.model || '',
      colorOptions: product?.colorOptions || [],
      installationType: product?.installationType || '',
      roomType: product?.roomType || '',
      isActive: product?.status === 'active' || !product?.status,
      images: product?.images || [],
      specifications: product?.specifications || [],
      sold: product?.sold || 0,
      views: product?.views || 0,
      rating: product?.rating || 0,
      reviewCount: product?.reviewCount || 0
    };

    const changed = JSON.stringify(currentData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [name, price, description, category, stock, dimensions, weight, material,
      warranty, bulbType, numberOfBulbs, voltage, ledType, lumens, isDimmable,
      brand, model, colorOptions, installationType, roomType, isActive, images, specifications,
      sold, views, rating, reviewCount]);

  // Comprehensive validation function
  const validateProduct = () => {
    const errors = [];
    
    if (!name?.trim()) errors.push('Product name is required');
    if (!price || parseFloat(price) <= 0) errors.push('Valid price is required');
    if (!description?.trim()) errors.push('Product description is required');
    if (!category) errors.push('Category selection is required');
    if (!stock || parseInt(stock) < 0) errors.push('Valid stock quantity is required');
    if (images.length === 0) errors.push('At least one product image is required');
    
    // Optional but recommended validations
    if (!brand?.trim()) errors.push('Brand name is recommended');
    if (!material?.trim()) errors.push('Material information is recommended');
    if (colorOptions.length === 0) errors.push('At least one color option is recommended');
    
    return errors;
  };

  const handleSave = async () => {
    const validationErrors = validateProduct();
    
    if (validationErrors.length > 0) {
      Alert.alert(
        'Validation Error', 
        `Please fix the following issues:\n\n• ${validationErrors.join('\n• ')}`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Updating product:', product.id);
      
      // Separate existing images from new images
      const existingImages = [];
      const newImages = [];
      const deletedImagePublicIds = [];
      
      images.forEach((img, index) => {
        if (img) {
          if (typeof img === 'string' || (img.publicId && !img.uri)) {
            // Existing image from server
            existingImages.push(img);
          } else if (img.uri && !img.publicId) {
            // New image from device
            newImages.push(img);
          } else if (img.publicId && img.uri) {
            // Existing image that might have been modified
            existingImages.push(img);
          }
        }
      });

      // Find deleted images by comparing with original product images
      if (product?.images) {
        product.images.forEach(originalImg => {
          const stillExists = existingImages.some(img => 
            (typeof img === 'string' && img === originalImg) ||
            (img.publicId && img.publicId === originalImg.publicId)
          );
          if (!stillExists && originalImg.publicId) {
            deletedImagePublicIds.push(originalImg.publicId);
          }
        });
      }

      const productData = {
        name, 
        price: parseFloat(price), 
        description, 
        category, 
        stock: parseInt(stock) || 0,
        dimensions, 
        weight, 
        material, 
        warranty, 
        bulbType, 
        numberOfBulbs, 
        voltage, 
        ledType, 
        lumens, 
        isDimmable, 
        brand, 
        model, 
        colorOptions,
        installationType, 
        roomType, 
        specifications,
        status: isActive ? 'active' : 'inactive',
        // Delivery and installation fields
        deliveryCharge: deliveryCharge ? parseFloat(deliveryCharge) : 0,
        installationCost: installationCost ? parseFloat(installationCost) : 0,
        freeDeliveryThreshold: freeDeliveryThreshold ? parseFloat(freeDeliveryThreshold) : null,
        installationIncluded,
        // Tracking fields (read-only, but preserve them)
        sold: parseInt(sold) || 0,
        views: parseInt(views) || 0,
        rating: parseFloat(rating) || 0,
        reviewCount: parseInt(reviewCount) || 0,
        // AR scanning data - FIXED: Added missing AR data to save
        hasAR,
        arScanData,
        // Timestamps
        updatedAt: new Date().toISOString(),
        // Preserve original creation data
        createdAt: product?.createdAt || new Date().toISOString(),
        sellerId: product?.sellerId, // Preserve seller ID
        // Image handling for backend
        existingImages,
        newImages,
        deletedImagePublicIds,
        reorderedImages: images, // Send full image order
      };

      console.log('📦 Product update payload:', {
        productId: product.id,
        existingImagesCount: existingImages.length,
        newImagesCount: newImages.length,
        deletedImagesCount: deletedImagePublicIds.length,
        totalSpecifications: specifications.length,
        colorOptions: colorOptions.length
      });

      const response = await updateProduct(product.id, productData);
      console.log('✅ Product updated successfully:', response);
      
      // Update current product data with the response
      if (response.product) {
        console.log('🔄 Updating current product data with response:', {
          lumens: response.product.lumens,
          numberOfBulbs: response.product.numberOfBulbs,
          brand: response.product.brand
        });
        setCurrentProduct(response.product);
      }
      
      // Emit update event for other screens
      DeviceEventEmitter.emit('SELLER_PRODUCT_UPDATED', {
        productId: product.id,
        updatedProduct: response.product
      });

      // Also emit general product list refresh
      DeviceEventEmitter.emit('SELLER_PRODUCTS_REFRESH');

      Alert.alert('Success', 'Product updated successfully!', [
        { text: 'Continue Editing', style: 'default' },
        { text: 'Go Back', onPress: () => navigation.goBack() }
      ]);
      
    } catch (error) {
      console.error('❌ Product update error:', error);
      Alert.alert(
        'Update Failed', 
        `Failed to update product: ${error.message || 'Unknown error'}\n\nPlease check your connection and try again.`,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
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

  const handleImageSelect = async (index) => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Cancel', style: 'cancel' },
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
      ]
    );
  };

  const selectFromGallery = async (index) => {
    try {
      const result = await ImageCropPicker.openPicker({
        mediaType: 'photo',
        multiple: false,
        includeBase64: false,
        maxWidth: 1200,
        maxHeight: 1200,
        compressImageQuality: 0.8,
      });

      if (result?.path) {
        const newImage = {
          uri: result.path,
          type: result.mime || 'image/jpeg',
          name: `product-${Date.now()}.jpg`,
          width: result.width,
          height: result.height,
          size: result.size
        };

        console.log('📸 New image created:', {
          uri: newImage.uri,
          type: newImage.type,
          name: newImage.name,
          size: newImage.size
        });

        setImages(prev => {
          const newImages = [...prev];
          if (index < newImages.length) {
            newImages[index] = newImage;
          } else {
            newImages.push(newImage);
          }
          console.log('📸 Images array updated:', newImages.length, 'images');
          return newImages;
        });
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

            setImages(prevImages => {
              const prevArray = Array.isArray(prevImages) ? prevImages : [];
              const newImages = [...prevArray];
              if (index < newImages.length) {
                newImages[index] = imageObj;
              } else {
                newImages.push(imageObj);
              }
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
      const result = await ImageCropPicker.openCamera({
        mediaType: 'photo',
        cropping: true,
        width: 1200,
        height: 1200,
        compressImageQuality: 0.8,
      });

      if (result?.path) {
        const newImage = {
          uri: result.path,
          type: result.mime || 'image/jpeg',
          name: `product-camera-${Date.now()}.jpg`,
          width: result.width,
          height: result.height,
          size: result.size
        };

        setImages(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          const newImages = [...prevArray];
          if (index < newImages.length) {
            newImages[index] = newImage;
          } else {
            newImages.push(newImage);
          }
          return newImages;
        });
      }
    } catch (error) {
      if (!error.message?.includes('cancel')) {
        console.error('Camera error:', error);
        Alert.alert('Error', 'Failed to take photo');
      }
    }
  };

  const removeImage = (index) => {
    console.log('🗑️ Removing image at index:', index);
    const imageToRemove = images[index];
    console.log('🗑️ Image to remove:', imageToRemove);
    
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      console.log('🗑️ Images after removal:', newImages.length);
      return newImages;
    });
    
    // Log for backend tracking
    if (imageToRemove?.publicId) {
      console.log('🗑️ Will delete from Cloudinary:', imageToRemove.publicId);
    }
  };

  const toggleColor = (color) => {
    setColorOptions(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return prevArray.includes(color) 
        ? prevArray.filter(c => c !== color)
        : [...prevArray, color];
    });
  };

  const addSpecification = () => {
    setSpecifications(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return [...prevArray, { name: '', value: '' }];
    });
  };

  const updateSpecification = (index, field, value) => {
    setSpecifications(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      const updated = [...prevArray];
      updated[index][field] = value;
      return updated;
    });
  };

  const removeSpecification = (index) => {
    setSpecifications(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return prevArray.filter((_, i) => i !== index);
    });
  };

  // Helper function to get proper image URI for rendering
  const getImageUri = (image) => {
    if (!image) return null;
    
    // Handle new images from device (have uri property)
    if (image.uri && !image.publicId) {
      console.log('📱 Rendering new device image:', image.uri);
      return image.uri;
    }
    
    // Handle existing Cloudinary images (have url or publicId)
    if (image.url) {
      console.log('☁️ Rendering existing Cloudinary image:', image.url);
      return image.url;
    }
    
    // Handle string URLs (legacy format)
    if (typeof image === 'string') {
      console.log('🔗 Rendering string URL:', image);
      return image.startsWith('http') ? image : `${BASE_URL}${image}`;
    }
    
    // Handle Cloudinary images with publicId
    if (image.publicId) {
      console.log('🏷️ Rendering Cloudinary publicId:', image.publicId);
      return `https://res.cloudinary.com/dv53n5nav/image/upload/${image.publicId}`;
    }
    
    console.warn('⚠️ Unknown image format:', image);
    return null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Product</Text>
        <TouchableOpacity 
          style={[styles.saveButton, (!hasChanges || loading) && styles.actionButtonDisabled]} 
          onPress={handleSave}
          disabled={!hasChanges || loading}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.scrollContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* Product Summary Section */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Product Summary</Text>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Product Name:</Text>
                <Text style={styles.summaryValue}>{name || 'Not set'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Price:</Text>
                <Text style={styles.summaryValue}>₱{price || '0'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Category:</Text>
                <Text style={styles.summaryValue}>{category || 'Not set'}</Text>
              </View>
              
              {/* Delivery & Installation Summary */}
              {(deliveryCharge || installationCost || freeDeliveryThreshold || installationIncluded) && (
                <View style={styles.deliverySummary}>
                  <Text style={styles.deliverySummaryTitle}>Delivery & Installation</Text>
                  {deliveryCharge && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Delivery Charge:</Text>
                      <Text style={styles.summaryValue}>₱{deliveryCharge}</Text>
                    </View>
                  )}
                  {installationCost && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Installation Cost:</Text>
                      <Text style={styles.summaryValue}>₱{installationCost}</Text>
                    </View>
                  )}
                  {freeDeliveryThreshold && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Free Delivery Threshold:</Text>
                      <Text style={styles.summaryValue}>₱{freeDeliveryThreshold}</Text>
                    </View>
                  )}
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Installation Included:</Text>
                    <Text style={[styles.summaryValue, { color: installationIncluded ? '#10B981' : '#6B7280' }]}>
                      {installationIncluded ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          
          {/* Images Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Product Images</Text>
            <View style={styles.imageGrid}>
              {Array.from({ length: 5 }, (_, index) => {
                const image = images[index];
                return (
                  <View key={index} style={styles.imageContainer}>
                    {image ? (
                      <>
                        {getImageUri(image) ? (
                          <Image 
                            source={{ uri: getImageUri(image) }} 
                            style={styles.productImage}
                            resizeMode="cover"
                            onError={(error) => {
                              console.error('❌ Image load failed:', error.nativeEvent.error);
                              console.error('❌ Attempted URI:', getImageUri(image));
                              console.error('❌ Image object:', image);
                            }}
                            onLoad={() => {
                              console.log('✅ Image loaded successfully:', getImageUri(image));
                            }}
                          />
                        ) : (
                          <View style={[styles.productImage, styles.imagePlaceholder]}>
                            <Icon name="image-outline" size={32} color="#94A3B8" />
                            <Text style={styles.imagePlaceholderText}>Invalid Image</Text>
                          </View>
                        )}
                        {index === 0 && (
                          <View style={styles.mainImageBadge}>
                            <Text style={styles.mainImageBadgeText}>MAIN</Text>
                          </View>
                        )}
                        <View style={styles.imageActions}>
                          <TouchableOpacity 
                            style={styles.imageActionButton}
                            onPress={() => handleImageSelect(index)}
                          >
                            <Icon name="create" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.imageActionButton}
                            onPress={() => removeImage(index)}
                          >
                            <Icon name="trash" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <TouchableOpacity 
                        style={styles.addImageContainer}
                        onPress={() => handleImageSelect(index)}
                      >
                        <Icon name="add" size={24} color="#94A3B8" />
                        <Text style={styles.addImageText}>Add Image</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Basic Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter product name"
                placeholderTextColor="#94A3B8"
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
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Stock</Text>
                <TextInput
                  style={styles.textInput}
                  value={stock}
                  onChangeText={setStock}
                  placeholder="Available quantity"
                  placeholderTextColor="#94A3B8"
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
                  {category || 'Select category'}
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
                placeholder="Describe your product..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Delivery & Installation Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Delivery & Installation</Text>
            
            <View style={styles.rowContainer}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Delivery Charge (₱)</Text>
                <TextInput
                  style={styles.textInput}
                  value={deliveryCharge}
                  onChangeText={setDeliveryCharge}
                  placeholder="e.g., 150"
                  placeholderTextColor="#94A3B8"
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
                  placeholderTextColor="#94A3B8"
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
                  placeholderTextColor="#94A3B8"
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
                  placeholder="Brand name"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Model</Text>
                <TextInput
                  style={styles.textInput}
                  value={model}
                  onChangeText={setModel}
                  placeholder="Model number"
                  placeholderTextColor="#94A3B8"
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
                  placeholder="L x W x H"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Weight</Text>
                <TextInput
                  style={styles.textInput}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Weight in kg"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Material</Text>
              <TextInput
                style={styles.textInput}
                value={material}
                onChangeText={setMaterial}
                placeholder="Materials used"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Warranty</Text>
              <TextInput
                style={styles.textInput}
                value={warranty}
                onChangeText={setWarranty}
                placeholder="Warranty period"
                placeholderTextColor="#94A3B8"
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
                  placeholder="LED, Halogen, etc."
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Number of Bulbs</Text>
                <TextInput
                  style={styles.textInput}
                  value={numberOfBulbs}
                  onChangeText={setNumberOfBulbs}
                  placeholder="1, 2, 3..."
                  placeholderTextColor="#94A3B8"
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
                  placeholder="220V, 12V, etc."
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Lumens</Text>
                <TextInput
                  style={styles.textInput}
                  value={lumens}
                  onChangeText={setLumens}
                  placeholder="Light output"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Dimmable</Text>
              <Switch
                value={isDimmable}
                onValueChange={setIsDimmable}
                trackColor={{ false: '#E2E8F0', true: '#FF8B47' }}
                thumbColor="#FFFFFF"
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
            <Text style={styles.sectionTitle}>Custom Specifications</Text>
            {specifications.map((spec, index) => (
              <View key={index} style={styles.specRow}>
                <View style={styles.specInput}>
                  <TextInput
                    style={styles.textInput}
                    value={spec.name}
                    onChangeText={(text) => updateSpecification(index, 'name', text)}
                    placeholder="Specification name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.specInput}>
                  <TextInput
                    style={styles.textInput}
                    value={spec.value}
                    onChangeText={(text) => updateSpecification(index, 'value', text)}
                    placeholder="Value"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <TouchableOpacity 
                  style={styles.removeSpecButton}
                  onPress={() => removeSpecification(index)}
                >
                  <Icon name="trash-outline" size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addSpecButton} onPress={addSpecification}>
              <Icon name="add" size={16} color="#0284C7" />
              <Text style={styles.addSpecText}>Add Specification</Text>
            </TouchableOpacity>
          </View>

          {/* AR Scanning Section - ADDED: Missing AR functionality */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>3D Model & AR</Text>
            <View style={styles.arScanContainer}>
              <View style={styles.arScanInfo}>
                <Icon name="cube-outline" size={24} color={hasAR ? "#10B981" : "#6B7280"} />
                <View style={styles.arScanTextContainer}>
                  <Text style={styles.arScanTitle}>
                    {hasAR ? "AR Model Available" : "Create 3D Model"}
                  </Text>
                  <Text style={styles.arScanDescription}>
                    {hasAR 
                      ? "Customers can view this product in AR"
                      : "Let customers see your product in 3D before buying"
                    }
                  </Text>
                  {hasAR && arScanData && (
                    <Text style={styles.arScanDetails}>
                      Quality: {arScanData.quality || "High"} • Size: {arScanData.fileSize || "Unknown"}
                    </Text>
                  )}
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.arScanButton, hasAR && styles.arScanButtonActive]}
                onPress={() => {
                  console.log('🎯 AR Scan button pressed for product:', product.id);
                  navigation.navigate('KiriEngineScanner', {
                    productId: product.id,
                    productName: product.name || 'Product'
                  });
                }}
              >
                <Icon 
                  name={hasAR ? "checkmark-circle" : "camera-outline"} 
                  size={20} 
                  color={hasAR ? "#FFFFFF" : "#FF8B47"} 
                />
                <Text style={[styles.arScanButtonText, hasAR && styles.arScanButtonTextActive]}>
                  {hasAR ? "Update 3D Model" : "Start 3D Scan"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Product Statistics */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Product Statistics</Text>
            <Text style={styles.sectionSubtitle}>Read-only performance metrics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Icon name="bag-check-outline" size={24} color="#10B981" />
                <Text style={styles.statValue}>{sold || 0}</Text>
                <Text style={styles.statLabel}>Sold</Text>
              </View>
              
              <View style={styles.statCard}>
                <Icon name="cube-outline" size={24} color="#3B82F6" />
                <Text style={styles.statValue}>{stock || 0}</Text>
                <Text style={styles.statLabel}>In Stock</Text>
              </View>
              
              <View style={styles.statCard}>
                <Icon name="eye-outline" size={24} color="#8B5CF6" />
                <Text style={styles.statValue}>{views || 0}</Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>
              
              <View style={styles.statCard}>
                <Icon name="star" size={24} color="#F59E0B" />
                <Text style={styles.statValue}>{rating ? rating.toFixed(1) : '0.0'}</Text>
                <Text style={styles.statLabel}>Rating ({reviewCount || 0})</Text>
              </View>
            </View>
            
            <View style={styles.stockAlert}>
              {parseInt(stock) === 0 ? (
                <View style={[styles.alertBadge, styles.alertDanger]}>
                  <Icon name="warning" size={16} color="#EF4444" />
                  <Text style={styles.alertText}>Out of Stock</Text>
                </View>
              ) : parseInt(stock) <= 5 ? (
                <View style={[styles.alertBadge, styles.alertWarning]}>
                  <Icon name="alert-circle" size={16} color="#F59E0B" />
                  <Text style={styles.alertText}>Low Stock Warning</Text>
                </View>
              ) : (
                <View style={[styles.alertBadge, styles.alertSuccess]}>
                  <Icon name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.alertText}>Stock Available</Text>
                </View>
              )}
            </View>
          </View>

          {/* Additional Features */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Additional Features</Text>
            
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <Icon 
                  name={(product?.hasAR || product?.arModel || product?.arScanData) ? "cube" : "scan-outline"} 
                  size={24} 
                  color={(product?.hasAR || product?.arModel || product?.arScanData) ? "#10B981" : "#94A3B8"} 
                />
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureLabel}>AR Model</Text>
                  <Text style={styles.featureDescription}>
                    {(product?.hasAR || product?.arModel || product?.arScanData)
                      ? '✅ AR scan uploaded - Customers can view in AR' 
                      : '❌ No AR scan - Upload 3D model for AR visualization'
                    }
                  </Text>
                </View>
              </View>
              <View style={styles.arStatusContainer}>
                {(product?.hasAR || product?.arModel || product?.arScanData) ? (
                  <View style={styles.arStatusBadge}>
                    <Icon name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.arStatusText}>AR Ready</Text>
                  </View>
                ) : (
                  <View style={[styles.arStatusBadge, styles.arStatusBadgeInactive]}>
                    <Icon name="close-circle" size={16} color="#EF4444" />
                    <Text style={[styles.arStatusText, styles.arStatusTextInactive]}>No AR Scan</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.featureButton, 
                    (product?.hasAR || product?.arModel || product?.arScanData) && styles.featureButtonSecondary
                  ]}
                  onPress={() => {
                    Alert.alert(
                      (product?.hasAR || product?.arModel || product?.arScanData) ? 'Update AR Model' : 'Upload AR Scan',
                      (product?.hasAR || product?.arModel || product?.arScanData)
                        ? 'Replace the current AR model with a new 3D scan. This will allow customers to visualize the updated product in their space using augmented reality.'
                        : 'Create a 3D scan of your product to enable AR visualization. Customers will be able to place and view your product in their own space before purchasing.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: (product?.hasAR || product?.arModel || product?.arScanData) ? 'Replace AR Model' : 'Start AR Scan', 
                          onPress: () => {
                            navigation.navigate('KiriEngineScanner', {
                              productId: product.id,
                              productName: product.name
                            });
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Icon 
                    name={(product?.hasAR || product?.arModel || product?.arScanData) ? "refresh" : "camera"} 
                    size={16} 
                    color={(product?.hasAR || product?.arModel || product?.arScanData) ? "#64748B" : "#FF8B47"} 
                  />
                  <Text style={[
                    styles.featureButtonText,
                    (product?.hasAR || product?.arModel || product?.arScanData) && styles.featureButtonTextSecondary
                  ]}>
                    {(product?.hasAR || product?.arModel || product?.arScanData) ? 'Replace Scan' : 'Start AR Scan'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <Icon name="eye-outline" size={24} color="#FF8B47" />
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureLabel}>Product Visibility</Text>
                  <Text style={styles.featureDescription}>
                    {isActive ? 'Product is visible to buyers' : 'Product is hidden from buyers'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#E2E8F0', true: '#4CAF50' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

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

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Icon name="refresh" size={32} color="#FF8B47" />
          <Text style={styles.loadingText}>Updating product...</Text>
        </View>
      )}
    </View>
  );
}