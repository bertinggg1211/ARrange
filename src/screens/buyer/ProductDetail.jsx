// src/screens/buyer/ProductDetail.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Modal,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useCart } from "../../context/CartContext";
import { useLikes } from "../../context/LikesContext";
import { useChat } from "../../context/ChatContext";
import { getProductById, getSellerInfo } from "../../api/productApi";
import { sendMessage } from "../../api/chatApi";
import { BASE_URL } from "../../api/api";
import AddReviewModal from "../../components/AddReviewModal";
import { getProductReviews } from "../../api/reviewApi";
import styles from "./styles/ProductDetail.style";

const { height: screenHeight } = Dimensions.get('window');

export default function ProductDetail({ route, navigation }) {
  const { product: initialProduct } = route.params;
  const { addToCart } = useCart();
  const { likes, addToLikes, removeFromLikes, isLiked } = useLikes();
  const { createChatWithShop, getShop } = useChat();
  
  // Product state
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Debug: Log the initial product data
  console.log('📝 ProductDetail initial product data:', {
    productId: initialProduct?.id,
    productName: initialProduct?.name,
    hasSellerProfile: !!initialProduct?.sellerProfile,
    sellerProfileData: initialProduct?.sellerProfile,
    sellerId: initialProduct?.sellerId,
    seller_id: initialProduct?.seller_id, // Check both field names
    sellerName: initialProduct?.sellerName,
    allKeys: Object.keys(initialProduct || {})
  });
  
  // UI state
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isProductLiked, setIsProductLiked] = useState(false);
  const [productShopInfo, setProductShopInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('Description');
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [animationPosition, setAnimationPosition] = useState({ x: 0, y: 0 });
  const [showAnimation, setShowAnimation] = useState(false);
  const heartScale = new Animated.Value(1);
  const scrollY = new Animated.Value(0);
  const animationValue = new Animated.Value(0);
  const animationOpacity = new Animated.Value(1);
  
  // Product images from API using proper image utilities
  const productImages = product?.images && product.images.length > 0 
    ? product.images.map(img => {
        // Handle different image formats from seller uploads
        if (typeof img === 'string') {
          if (img.startsWith('http')) {
            return { uri: img }; // Already full URL
          } else if (img.startsWith('/')) {
            return { uri: `${BASE_URL}${img}` }; // Relative path
          } else {
            return { uri: `${BASE_URL}/uploads/products/${img}` }; // Just filename
          }
        } else if (img && img.url) {
          return { uri: img.url }; // Cloudinary URL
        }
        return { uri: `${BASE_URL}${img}` }; // Fallback
      })
    : [];
  
  // Thumbnails scroll indicators visibility (show only while scrolling)
  const [showThumbArrows, setShowThumbArrows] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const thumbScrollHideTimer = useRef(null);
  const handleThumbScrollStart = () => {
    if (thumbScrollHideTimer.current) {
      clearTimeout(thumbScrollHideTimer.current);
      thumbScrollHideTimer.current = null;
    }
    setShowThumbArrows(true);
  };
  const scheduleThumbArrowsHide = () => {
    if (thumbScrollHideTimer.current) clearTimeout(thumbScrollHideTimer.current);
    thumbScrollHideTimer.current = setTimeout(() => setShowThumbArrows(false), 700);
  };
  useEffect(() => {
    return () => {
      if (thumbScrollHideTimer.current) clearTimeout(thumbScrollHideTimer.current);
    };
  }, []);
  
  // Reviews state
  const [productReviews, setProductReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewStats, setReviewStats] = useState(null);
  
  // Calculate average rating and reviews count
  const hasReviews = productReviews.length > 0;
  const averageRating = reviewStats?.average_rating || 0;

  // Load full product details and seller information
  useEffect(() => {
    const loadProductDetails = async () => {
      console.log('🚨 ProductDetail useEffect triggered');
      console.log('🚨 Current product data:', product);
      
      // Always try to load seller information first from current product data
      const sellerId = product?.sellerId || product?.seller_id;
      if (sellerId) {
        console.log('🏪 Found seller ID in current product, loading seller info:', sellerId);
        await loadSellerInfo(sellerId);
      }
      
      // If we only have basic product info, fetch full details
      if (product && !product.specifications && product.id) {
        try {
          setLoading(true);
          console.log('🔄 Fetching full product details for ID:', product.id);
          const response = await getProductById(product.id);
          setProduct(response.product);
          
          // Load seller information if sellerId is available (check both field names)
          const newSellerId = response.product?.sellerId || response.product?.seller_id;
          if (newSellerId && newSellerId !== sellerId) {
            console.log('🏪 Found different seller ID in full product data:', newSellerId);
            await loadSellerInfo(newSellerId);
          } else if (!sellerId && !newSellerId) {
            console.log('⚠️ No seller ID found in either initial or full product data');
            console.log('⚠️ Full product data:', response.product);
          }
        } catch (err) {
          console.error('Error loading product details:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else if (!sellerId) {
        console.log('⚠️ No seller ID found and product has specifications, checking all fields...');
        console.log('⚠️ Product keys:', Object.keys(product || {}));
        console.log('⚠️ Product data:', product);
      }
    };

    const loadSellerInfo = async (sellerId) => {
      try {
        console.log('🏪 Fetching seller profile for ID:', sellerId);
        console.log('🏪 Seller ID type:', typeof sellerId, 'Value:', sellerId);
        
        if (!sellerId) {
          console.log('⚠️ No seller ID provided, skipping seller info fetch');
          return;
        }
        
        const response = await getSellerInfo(sellerId);
        
        if (response.success && response.seller) {
          // Debug: Log complete seller response
          console.log('🏪 Complete seller response:', JSON.stringify(response.seller, null, 2));
          console.log('🏪 Shop name from API:', response.seller.shopName);
          console.log('🏪 Business name from API:', response.seller.sellerProfile?.businessName);
          console.log('🏪 Full name from API:', response.seller.name);
          
          const sellerInfo = {
            id: response.seller.id,
            // Priority: shopName > businessName > full name > "Shop"
            name: response.seller.shopName || response.seller.sellerProfile?.businessName || response.seller.name || 'Shop',
            rating: response.seller.rating || response.seller.sellerProfile?.rating || 0,
            reviews: response.seller.reviews || 0,
            // Use shop logo first, then profile image, consistent with Home.jsx
            profileImage: response.seller.sellerProfile?.shopLogo || response.seller.sellerProfile?.profileImage || response.seller.profileImage,
            sellerProfile: response.seller.sellerProfile,
            isOnline: response.seller.isOnline || false,
            joinedDate: response.seller.joinedDate,
            totalProducts: response.seller.totalProducts || 0,
            businessType: response.seller.businessType,
            isNewSeller: response.seller.isNewSeller || response.seller.rating === 0
          };
          
          console.log('🏪 Seller info created with name:', sellerInfo.name);
          console.log('🏪 Complete seller info object:', JSON.stringify(sellerInfo, null, 2));
          setProductShopInfo(sellerInfo);
        } else {
          throw new Error('Invalid seller response');
        }
      } catch (err) {
        console.error('Error loading seller info:', err);
        console.error('Error message:', err.message);
        
        // Handle specific token errors
        if (err.message && err.message.includes('token')) {
          console.log('🔑 Token-related error detected, using fallback seller info');
        }
        
        // Set basic seller info even if API fails
        // Try to use product data as fallback
        const fallbackName = product?.sellerProfile?.businessName || 
                            product?.shopName || 
                            product?.sellerName || 
                            `Store ${sellerId?.slice(-4) || 'Unknown'}`;
        
        console.log('🔄 Using fallback seller info with name:', fallbackName);
        
        setProductShopInfo({
          id: sellerId,
          name: fallbackName,
          rating: 0,
          reviews: 0,
          profileImage: product?.sellerProfile?.shopLogo || product?.sellerProfile?.profileImage || null,
          sellerProfile: product?.sellerProfile || null,
          isOnline: false,
          joinedDate: new Date().toISOString(),
          totalProducts: 0,
          isNewSeller: true
        });
      }
    };

    loadProductDetails();
  }, [product?.id]);

  // Load product reviews
  useEffect(() => {
    const loadReviews = async () => {
      if (!product?.id) return;
      
      try {
        setLoadingReviews(true);
        console.log('📖 Loading reviews for product:', product.id);
        
        // Fetch product reviews
        const reviewsResponse = await getProductReviews(product.id, 10, 0, 'recent');
        
        if (reviewsResponse.success) {
          setProductReviews(reviewsResponse.reviews || []);
          setReviewStats(reviewsResponse.stats);
          console.log('✅ Product reviews loaded:', reviewsResponse.reviews?.length || 0);
        }
        
      } catch (error) {
        console.error('❌ Error loading reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };
    
    loadReviews();
  }, [product?.id]);

  useEffect(() => {
    if (product) {
      // Check if product is in likes
      const productIsLiked = likes.some(item => item.id === product.id);
      setIsProductLiked(productIsLiked);
      
      // Only set derived shop info if we don't have seller info from API yet
      // This prevents overriding the correct shop logo loaded from getSellerInfo API
      setProductShopInfo(prevShopInfo => {
        // If we already have shop info from API (loaded from loadSellerInfo), don't override it
        // Check if it has the API-loaded data by looking for joinedDate or isNewSeller (API-specific fields)
        if (prevShopInfo && (prevShopInfo.joinedDate || prevShopInfo.isNewSeller !== undefined)) {
          console.log('📝 Keeping existing shop info from API:', prevShopInfo);
          return prevShopInfo;
        }
        
        // Build shop info from product data as fallback
        const derivedShop = {
          id: product.sellerId || product.seller_id || null,
          name: product.sellerProfile?.businessName || product.shopName || 'Shop',
          // Use shop logo first, then profile image, consistent with Home.jsx
          profileImage: product.sellerProfile?.shopLogo || product.sellerProfile?.profileImage || null,
          sellerProfile: product.sellerProfile,
          rating: typeof product.sellerProfile?.rating === 'number' ? product.sellerProfile.rating : null,
          reviews: typeof product.sellerProfile?.reviewsCount === 'number' ? product.sellerProfile.reviewsCount : (Array.isArray(product.reviews) ? product.reviews.length : 0),
          isOnline: !!product.sellerProfile?.isOnline,
        };
        
        console.log('📝 ProductDetail derivedShop (fallback):', derivedShop);
        console.log('📝 ProductDetail product.sellerProfile:', product.sellerProfile);
        
        return derivedShop;
      });
    }
  }, [likes, product]);

  // Check if product is liked when component loads
  useEffect(() => {
    if (product) {
      const liked = isLiked(product.id);
      setIsProductLiked(liked);
    }
  }, [product, isLiked]);

  const handleLikePress = async () => {
    try {
      if (isProductLiked) {
        await removeFromLikes(product.id);
        setIsProductLiked(false);
      } else {
        await addToLikes(product);
        setIsProductLiked(true);
        // Animate heart when adding to likes
        Animated.sequence([
          Animated.timing(heartScale, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(heartScale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      // Revert the UI state if the operation failed
      setIsProductLiked(!isProductLiked);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing ${product.name} for ₱${product.price}!`,
        title: product.name,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddToCart = async (event) => {
    console.log('=== ADD TO CART PRESSED ===');
    console.log('Product:', product.name);
    console.log('Quantity:', quantity);
    console.log('Adding to cart - NOT going to checkout');
    
    try {
      // Get button position for animation (fix synthetic event issue)
      if (event?.nativeEvent) {
        // Use nativeEvent instead of target to avoid synthetic event pooling issues
        const { pageX, pageY } = event.nativeEvent;
        setAnimationPosition({ x: pageX, y: pageY });
        setShowAnimation(true);
        
        // Start animation
        Animated.parallel([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(animationOpacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          })
        ]).start(() => {
          setShowAnimation(false);
          animationValue.setValue(0);
          animationOpacity.setValue(1);
        });
      }
      
      // Prepare cart item with proper format for backend
      const cartItem = {
        id: product.id,
        name: product.name,
        price: typeof product.price === 'number' ? product.price : parseFloat(product.price.toString().replace('₱', '').replace(',', '')),
        image: productImages[0] || null,
        quantity: quantity,
        sellerId: product.sellerId,
        sellerName: productShopInfo?.name || product.sellerName || 'Unknown Store'
      };
      
      console.log('Cart item being added:', cartItem);
      await addToCart(cartItem);
      
      // Show success feedback
      console.log('✅ Item added to cart successfully');
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      // You could show an error toast/alert here
    }
  };

  const handleBuyNow = () => {
    console.log('=== BUY NOW PRESSED ===');
    console.log('Product:', product.name);
    console.log('Product price:', product.price, typeof product.price);
    console.log('Product seller_id:', product.seller_id);
    console.log('Initial product seller_id:', initialProduct.seller_id);
    console.log('Product keys:', Object.keys(product));
    console.log('Initial product keys:', Object.keys(initialProduct));
    console.log('Full product object:', product);
    console.log('Full initial product object:', initialProduct);
    console.log('Quantity:', quantity);
    console.log('NOT adding to cart - going directly to checkout');
    
    // Handle different price formats safely
    let cleanPrice = 0;
    let originalPrice = product.price;
    
    if (typeof product.price === 'string') {
      // If price is a string, remove currency symbols
      cleanPrice = parseFloat(product.price.replace('₱', '').replace(',', '')) || 0;
    } else if (typeof product.price === 'number') {
      // If price is already a number, use it directly
      cleanPrice = product.price;
      originalPrice = `₱${product.price.toFixed(2)}`;
    } else {
      // If price is undefined or other type, default to 0
      console.warn('⚠️ Product price is undefined or invalid:', product.price);
      cleanPrice = 0;
      originalPrice = '₱0.00';
    }
    
    const item = {
      ...product,
      quantity: quantity,
      price: cleanPrice,
      originalPrice: originalPrice,
      // Ensure seller_id is preserved - try multiple sources
      seller_id: product.seller_id || product.sellerId || initialProduct.seller_id || initialProduct.sellerId,
      sellerId: product.seller_id || product.sellerId || initialProduct.seller_id || initialProduct.sellerId
    };
    
    console.log('🛒 Navigating to Checkout with item:', {
      id: item.id,
      name: item.name,
      price: item.price,
      seller_id: item.seller_id,
      sellerId: item.sellerId,
      images: item.images,
      hasImages: !!item.images,
      imagesLength: item.images?.length,
      firstImage: item.images?.[0],
      // Show all keys to debug
      allKeys: Object.keys(item)
    });
    navigation.navigate("Checkout", { item });
  };
  
  const handleChatWithShop = async () => {
    // Get seller ID with multiple fallbacks
    const sellerId = productShopInfo?.id || product?.sellerId || product?.seller_id;
    
    if (!sellerId) {
      Alert.alert('Error', 'Unable to contact seller. Seller information is not available.');
      console.error('❌ No seller ID found:', { productShopInfo, product });
      return;
    }
    
    try {
      // Show loading state
      setLoading(true);
      
      // Prepare the automatic message with product name
      const initialMessage = `I would like to ask some questions about ${product.name}`;
      
      // Prepare product data to send with the message
      const productImage = product.images && product.images.length > 0 ? product.images[0] : null;
      console.log('🖼️ Raw product images:', product.images);
      console.log('🖼️ Selected image:', productImage);
      console.log('🖼️ Image type:', typeof productImage);
      console.log('🖼️ Image value:', productImage);
      
      const productData = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: productImage,
        category: product.category,
        subcategory: product.subcategory
      };
      
      console.log('🛍️ Final product data being sent:', productData);
      
      console.log('💬 Starting chat with seller:', sellerId, 'for product:', product.name);
      console.log('🛍️ Product data:', productData);
      console.log('🖼️ Image in product data:', productData.image);
      
      // Create chat with shop (this will send the initial message)
      const chatId = `chat_${sellerId}`;
      
      // Add to conversations using ChatContext (this handles the initial message)
      await createChatWithShop(sellerId, initialMessage, productData);
      
      // Navigate to the chat screen with proper shop info and product data
      navigation.navigate("Chat", { 
        chatData: { 
          id: chatId,
          partnerId: sellerId,
          shop: {
            id: sellerId,
            name: productShopInfo?.name || productShopInfo?.shopName || product?.sellerName || 'Shop',
            avatar: productShopInfo?.avatar || productShopInfo?.shopLogo ? 
              { uri: productShopInfo.avatar || productShopInfo.shopLogo } : null,
            isOnline: productShopInfo?.isOnline || false
          },
          sellerName: productShopInfo?.name || productShopInfo?.shopName || product?.sellerName || 'Shop',
          isOnline: productShopInfo?.isOnline || false,
          productData: productData // Pass product data to chat screen
        } 
      });
      
      console.log('✅ Chat initiated successfully with product attachment');
      
      // Show success feedback
      Alert.alert(
        '💬 Chat Started!', 
        'Your product inquiry has been sent to the seller with the product image attached.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Error starting chat:', error);
      Alert.alert(
        'Chat Error', 
        'Unable to start chat with seller. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewShop = () => {
    if (!productShopInfo) return;
    
    // Navigate to ShopViewer with seller information
    navigation.navigate("ShopViewer", { 
      sellerId: productShopInfo.id,
      sellerName: productShopInfo.name,
      sellerProfile: productShopInfo.sellerProfile
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#FF8B47" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (error || !product || !product.images || product.images.length === 0) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <TouchableOpacity 
          style={styles.errorBackButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Icon name="alert-circle-outline" size={64} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Product Not Available</Text>
        <Text style={styles.errorMessage}>
          {error || 'This product is not properly configured or does not have images.'}
        </Text>
        <TouchableOpacity 
          style={styles.errorRetryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorRetryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Fixed Safe Area Overlay - Prevents content from going under notch */}
      <View style={styles.safeAreaOverlay} />
      
      {/* Main Scrollable Container */}
      <ScrollView 
        style={styles.mainScrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Main White Container */}
        <View style={styles.mainContainer}>
          {/* Product Image Container */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              <TouchableOpacity
                onPress={() => setShowImageViewer(true)}
                activeOpacity={0.9}
              >
                <Image source={productImages[activeImageIndex]} style={styles.productImage} />
              </TouchableOpacity>

              {/* Image Thumbnails - Scrollable */}
              <View style={styles.thumbnailContainer}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailScrollContent}
                  style={styles.thumbnailScrollView}
                  snapToInterval={60}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  nestedScrollEnabled={false}
                  scrollEnabled={productImages.length > 3}
                  horizontal={false}
                  bounces={false}
                >
                  {productImages.map((img, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setActiveImageIndex(index)}
                      style={[styles.thumbnail, activeImageIndex === index && styles.activeThumbnail]}
                    >
                      <Image source={img} style={styles.thumbnailImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Scroll Indicators */}
                {productImages.length > 3 && showThumbArrows && (
                  <>
                    <View style={styles.scrollIndicatorTop}>
                      <Icon name="chevron-up" size={12} color="rgba(255, 255, 255, 0.8)" />
                    </View>
                    <View style={styles.scrollIndicatorBottom}>
                      <Icon name="chevron-down" size={12} color="rgba(255, 255, 255, 0.8)" />
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            {/* Enhanced Product Info Card */}
            <View style={styles.modernProductCard}>
              {/* Product Header Section */}
              <View style={styles.modernProductHeader}>
                <View style={styles.productTitleSection}>
                  <Text style={styles.modernProductName}>{product?.name || 'Product Name'}</Text>
                  <Text style={styles.productCategory}>{product?.category || 'Lighting'}</Text>
                </View>

                {/* Product Rating & Wishlist */}
                <View style={styles.productMetaSection}>
                  {hasReviews ? (
                    <View style={styles.modernRatingBadge}>
                      <Icon name="star" size={14} color="#FFD700" />
                      <Text style={styles.modernRatingText}>{averageRating.toFixed(1)}</Text>
                    </View>
                  ) : (
                    <View style={styles.newProductBadge}>
                      <Icon name="flash" size={12} color="#FF8B47" />
                      <Text style={styles.newProductText}>New</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.wishlistButton}
                    onPress={handleLikePress}
                  >
                    <Icon
                      name={isProductLiked ? "heart" : "heart-outline"}
                      size={20}
                      color={isProductLiked ? "#FF6B6B" : "#CCCCCC"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Price Section with Enhanced Design */}
              <View style={styles.modernPriceSection}>
                <View style={styles.priceContainer}>
                  <Text style={styles.currencySymbol}>₱</Text>
                  <Text style={styles.modernPrice}>
                    {typeof product?.price === 'number'
                      ? product.price.toLocaleString()
                      : (product?.price || '0').toString().replace('₱', '')}
                  </Text>
                </View>

                {/* Stock Status */}
                <View style={styles.stockStatusContainer}>
                  <View style={styles.stockIndicator}>
                    <Icon name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.stockText}>In Stock</Text>
                  </View>
                </View>
              </View>

              {/* Delivery & Installation Costs - Prominent Display */}
              {(product?.deliveryCharge || product?.installationCost || product?.freeDeliveryThreshold || product?.installationIncluded !== undefined) && (
                <View style={styles.deliveryInstallationSection}>
                  <View style={styles.deliveryInstallationHeader}>
                    <Icon name="car-outline" size={20} color="#FF8B47" />
                    <Text style={styles.deliveryInstallationTitle}>Delivery & Installation</Text>
                  </View>
                  
                  <View style={styles.deliveryInstallationContent}>
                    {product?.deliveryCharge && product.deliveryCharge > 0 && (
                      <View style={styles.costItem}>
                        <View style={styles.costItemLeft}>
                          <Icon name="car" size={16} color="#6B7280" />
                          <Text style={styles.costLabel}>Delivery Charge</Text>
                        </View>
                        <Text style={styles.costValue}>₱{product.deliveryCharge}</Text>
                      </View>
                    )}
                    
                    {product?.installationCost && product.installationCost > 0 && (
                      <View style={styles.costItem}>
                        <View style={styles.costItemLeft}>
                          <Icon name="construct" size={16} color="#6B7280" />
                          <Text style={styles.costLabel}>Installation Cost</Text>
                        </View>
                        <Text style={styles.costValue}>₱{product.installationCost}</Text>
                      </View>
                    )}
                    
                    {product?.freeDeliveryThreshold && product.freeDeliveryThreshold > 0 && (
                      <View style={styles.costItem}>
                        <View style={styles.costItemLeft}>
                          <Icon name="gift" size={16} color="#10B981" />
                          <Text style={styles.costLabel}>Free Delivery Threshold</Text>
                        </View>
                        <Text style={styles.costValue}>₱{product.freeDeliveryThreshold}</Text>
                      </View>
                    )}
                    
                    {product?.installationIncluded !== undefined && (
                      <View style={styles.costItem}>
                        <View style={styles.costItemLeft}>
                          <Icon name="checkmark-circle" size={16} color={product.installationIncluded ? "#10B981" : "#6B7280"} />
                          <Text style={styles.costLabel}>Installation Included</Text>
                        </View>
                        <Text style={[styles.costValue, { color: product.installationIncluded ? "#10B981" : "#6B7280" }]}>
                          {product.installationIncluded ? 'Yes' : 'No'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Action Buttons Section */}
              <View style={styles.modernActionButtons}>
                <TouchableOpacity
                  style={styles.modernAddToCartButton}
                  onPress={handleAddToCart}
                >
                  <Icon name="bag-add-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.modernAddToCartText}>Add to Cart</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modernCartViewButton}
                  onPress={() => navigation.navigate("Cart")}
                >
                  <Icon name="bag-outline" size={18} color="#FF8B47" />
                </TouchableOpacity>
              </View>

              {/* Quick Info Tags */}
              <View style={styles.quickInfoTags}>
                <View style={styles.infoTag}>
                  <Icon name="shield-checkmark-outline" size={14} color="#4CAF50" />
                  <Text style={styles.infoTagText}>Warranty</Text>
                </View>
                <View style={styles.infoTag}>
                  <Icon name="car-outline" size={14} color="#2196F3" />
                  <Text style={styles.infoTagText}>Free Delivery</Text>
                </View>
                <View style={styles.infoTag}>
                  <Icon name="return-up-back-outline" size={14} color="#9C27B0" />
                  <Text style={styles.infoTagText}>Easy Return</Text>
                </View>
              </View>
            </View>

            {/* Enhanced Shop Section */}
            <View style={styles.modernShopCard}>
              {/* Shop Header with gradient background */}
              <View style={styles.shopCardHeader}>
                <View style={styles.shopHeaderContent}>
                  <View style={styles.shopAvatarContainer}>
                    {(productShopInfo?.profileImage || productShopInfo?.sellerProfile?.shopLogo || productShopInfo?.sellerProfile?.profileImage) ? (
                      <Image
                        source={{
                          uri: (() => {
                            const imageUrl = productShopInfo?.profileImage || productShopInfo?.sellerProfile?.shopLogo || productShopInfo?.sellerProfile?.profileImage;
                            return imageUrl?.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
                          })()
                        }}
                        style={styles.modernShopAvatar}
                        resizeMode="cover"
                        onLoad={() => console.log('✅ Shop image loaded successfully')}
                        onError={(error) => console.log('❌ Shop image failed to load:', error.nativeEvent.error)}
                      />
                    ) : (
                      <View style={styles.modernShopAvatarPlaceholder}>
                        <Icon name="storefront" size={24} color="#FFFFFF" />
                      </View>
                    )}
                    {/* Online status indicator */}
                    <View style={[styles.onlineIndicator, { backgroundColor: productShopInfo?.isOnline ? '#4CAF50' : '#999' }]} />
                  </View>

                  <View style={styles.shopHeaderInfo}>
                    <Text style={styles.modernShopName}>
                      {productShopInfo?.name || productShopInfo?.sellerProfile?.businessName || product?.shopName || 'Shop'}
                    </Text>
                    <View style={styles.shopStatusRow}>
                      <Icon
                        name={productShopInfo?.isOnline ? "radio-button-on" : "radio-button-off"}
                        size={10}
                        color={productShopInfo?.isOnline ? "#4CAF50" : "#999"}
                      />
                      <Text style={styles.modernShopStatus}>
                        {productShopInfo?.isOnline ? 'Online now' : 'Offline'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Rating Section */}
              <View style={styles.modernShopRating}>
                {productShopInfo?.rating && productShopInfo.rating > 0 ? (
                  <View style={styles.ratingContainer}>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Icon
                          key={star}
                          name={star <= Math.round(productShopInfo.rating) ? "star" : "star-outline"}
                          size={14}
                          color={star <= Math.round(productShopInfo.rating) ? "#FFD700" : "#E0E0E0"}
                        />
                      ))}
                    </View>
                    <Text style={styles.ratingScore}>{productShopInfo.rating.toFixed(1)}</Text>
                  </View>
                ) : (
                  <View style={styles.newSellerContainer}>
                    <View style={styles.modernNewSellerBadge}>
                      <Icon name="sparkles" size={14} color="#FF8B47" />
                      <Text style={styles.modernNewSellerText}>New Seller</Text>
                    </View>
                    <Text style={styles.newSellerSubtext}>Be the first to review this shop!</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.modernShopButtons}>
                <TouchableOpacity style={styles.modernChatButton} onPress={handleChatWithShop}>
                  <Icon name="chatbubble-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.modernChatButtonText}>Chat Now</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modernViewShopButton}
                  onPress={handleViewShop}
                >
                  <Icon name="storefront-outline" size={18} color="#FF8B47" />
                  <Text style={styles.modernViewShopButtonText}>View Shop</Text>
                </TouchableOpacity>
              </View>

              {/* Specifications Section */}
              <View style={styles.modernSpecsSection}>
                <View style={styles.specsSectionHeader}>
                  <Icon name="information-circle-outline" size={20} color="#FF8B47" />
                  <Text style={styles.modernSpecsLabel}>Product Specifications</Text>
                </View>
                <TouchableOpacity
                  style={styles.modernViewSpecsButton}
                  onPress={() => {
                    console.log('===========================================');
                    console.log('📋 VIEW DETAILS BUTTON PRESSED');
                    console.log('===========================================');
                    console.log('📋 Current product state:', JSON.stringify({
                      name: product?.name,
                      height: product?.height,
                      width: product?.width,
                      dimensions: product?.dimensions,
                      weight: product?.weight
                    }, null, 2));
                    console.log('===========================================');
                    navigation.navigate('ViewDetails', { product });
                  }}
                >
                  <Text style={styles.modernViewSpecsText}>View Details</Text>
                  <Icon name="chevron-forward" size={16} color="#FF8B47" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Enhanced Description & Reviews Section */}
            <View style={styles.tabSectionContainer}>
              {/* Modern Tab Header */}
              <View style={styles.modernTabContainer}>
                {['Description', 'Reviews'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.modernTabButton, activeTab === tab && styles.modernActiveTabButton]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <View style={styles.tabButtonContent}>
                      <Icon
                        name={tab === 'Description' ? 'document-text-outline' : 'star-outline'}
                        size={18}
                        color={activeTab === tab ? '#FFFFFF' : '#666666'}
                      />
                      <Text style={[styles.modernTabText, activeTab === tab && styles.modernActiveTabText]}>
                        {tab === 'Reviews' ? `Reviews (${productReviews.length})` : tab}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Enhanced Tab Content */}
              <View style={styles.modernTabContent}>
                {activeTab === 'Description' && (
                  <View style={styles.modernDescriptionSection}>
                    {/* Description Header */}
                    <View style={styles.descriptionHeaderBox}>
                      <View style={styles.descriptionIconContainer}>
                        <Icon name="information-circle" size={24} color="#FF8B47" />
                      </View>
                      <Text style={styles.descriptionHeaderTitle}>About This Product</Text>
                    </View>

                    {/* Main Description */}
                    <View style={styles.descriptionCard}>
                      <Text style={styles.modernDescriptionText}>
                        {product?.description || 'This premium lighting fixture combines modern design with exceptional functionality. Crafted with high-quality materials and attention to detail, it provides excellent illumination while serving as a stunning centerpiece for any space.'}
                      </Text>
                    </View>

                  </View>
                )}

                {activeTab === 'Reviews' && (
                  <View style={styles.modernReviewsSection}>
                    {loadingReviews ? (
                      <View style={styles.loadingReviewsContainer}>
                        <ActivityIndicator size="small" color="#FF8B47" />
                        <Text style={styles.loadingReviewsText}>Loading reviews...</Text>
                      </View>
                    ) : hasReviews ? (
                      <>
                        <View style={styles.reviewsHeader}>
                          <View style={styles.reviewsHeaderLeft}>
                            <Icon name="star" size={24} color="#FFD700" />
                            <Text style={styles.reviewsHeaderTitle}>Product Reviews</Text>
                          </View>
                          <View style={styles.reviewsSummary}>
                            <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
                            <View style={styles.averageStars}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Icon
                                  key={star}
                                  name={star <= Math.round(averageRating) ? "star" : "star-outline"}
                                  size={14}
                                  color="#FFD700"
                                />
                              ))}
                            </View>
                            <Text style={styles.totalReviewsText}>({reviewStats?.total_reviews || 0})</Text>
                          </View>
                        </View>

                        <View style={styles.reviewsList}>
                          {productReviews.map((review, index) => (
                            <View key={review.id || index} style={styles.modernReviewItem}>
                              <View style={styles.modernReviewHeader}>
                                <View style={styles.reviewerInfo}>
                                  <View style={styles.modernReviewAvatar}>
                                    {review.buyer?.profile_picture ? (
                                      <Image source={{ uri: review.buyer.profile_picture }} style={styles.modernReviewAvatarImage} />
                                    ) : (
                                      <Icon name="person" size={20} color="#FFFFFF" />
                                    )}
                                  </View>
                                  <View style={styles.reviewerDetails}>
                                    <Text style={styles.modernReviewUser}>
                                      {review.buyer?.full_name || 'Anonymous User'}
                                    </Text>
                                    <Text style={styles.modernReviewDate}>
                                      {new Date(review.created_at).toLocaleDateString()}
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.reviewRatingContainer}>
                                  <View style={styles.modernReviewRating}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Icon
                                        key={star}
                                        name={star <= review.rating ? "star" : "star-outline"}
                                        size={14}
                                        color="#FFD700"
                                      />
                                    ))}
                                  </View>
                                  <Text style={styles.ratingNumber}>{review.rating}/5</Text>
                                </View>
                              </View>
                              {review.review_title && (
                                <Text style={styles.reviewTitle}>{review.review_title}</Text>
                              )}
                              <View style={styles.reviewContent}>
                                <Text style={styles.modernReviewText}>
                                  {review.comment || 'No comment provided'}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </>
                    ) : (
                      <View style={styles.modernNoReviewsContainer}>
                        <View style={styles.noReviewsIcon}>
                          <Icon name="chatbubble-ellipses-outline" size={64} color="#E0E0E0" />
                        </View>
                        <Text style={styles.modernNoReviewsTitle}>No Reviews Yet</Text>
                        <Text style={styles.modernNoReviewsSubtitle}>
                          This product hasn't been reviewed yet. Purchase this item to be the first to share your experience!
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={styles.viewARButton}
          onPress={() => {
            // Debug: Log product AR data
            console.log('🔍 ProductDetail AR Debug:', {
              hasAR: product.hasAR,
              arModelSource: product.arModelSource,
              arModelType: product.arModelType,
              arModel: product.arModel,           // Supabase URL
              arModelUrl: product.arModelUrl,
              arScanData: product.arScanData
            });
            
            // Check if product has AR and determine the source
            if (product.hasAR) {
              // Get model URL from Supabase (arModel field contains Supabase Storage URL)
              const modelUrl = product.arModel || 
                              product.arScanData?.glbUrl || 
                              product.arScanData?.modelUrl;
              
              console.log('🎯 ARViewer - Supabase Model URL:', modelUrl);
              
              if (!modelUrl) {
                Alert.alert('Error', '3D model URL not found');
                return;
              }
              
              // Navigate to ARViewer with camera + 3D model overlay
              navigation.navigate('ARViewer', {
                productId: product.id,
                modelUrl: modelUrl,
                productName: product.name,
                arModelUrl: modelUrl,
                productHeight: product.height_cm,
                productWidth: product.width_cm,
                scanData: product.arScanData || {
                  glbUrl: modelUrl,
                  modelUrl: modelUrl,
                  source: product.arModelSource || 'tripo',
                  storage: 'supabase'
                }
              });
            } else {
              console.log('❌ No AR Model - Product data:', {
                hasAR: product.hasAR,
                arModelSource: product.arModelSource,
                arModelType: product.arModelType
              });
              Alert.alert('No AR Model', 'This product does not have an AR model available.');
            }
          }}
        >
          <Icon name="cube-outline" size={20} color="#FF8B47" />
          <Text style={styles.viewARText}>VIEW AR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buyNowButton}
          onPress={handleBuyNow}
        >
          <Text style={styles.buyNowText}>BUY NOW</Text>
        </TouchableOpacity>
      </View>

      {/* Add to Cart Animation */}
      {showAnimation && (
        <Animated.View
          style={[
            styles.addToCartAnimation,
            {
              left: animationPosition.x - 15,
              top: animationPosition.y - 15,
              transform: [
                {
                  translateX: animationValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -animationPosition.x + 50], // Move to cart icon position
                  }),
                },
                {
                  translateY: animationValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -animationPosition.y + 100], // Move to cart icon position
                  }),
                },
                {
                  scale: animationValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.2, 0.3],
                  }),
                },
              ],
              opacity: animationOpacity,
            },
          ]}
        >
          <Icon name="add" size={16} color="#FFFFFF" />
        </Animated.View>
      )}

      {/* Image Viewer Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showImageViewer}
        onRequestClose={() => setShowImageViewer(false)}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity 
            style={styles.imageViewerCloseArea}
            onPress={() => setShowImageViewer(false)}
            activeOpacity={1}
          >
            <View style={styles.imageViewerContainer}>
              <TouchableOpacity 
                style={styles.imageViewerCloseButton}
                onPress={() => setShowImageViewer(false)}
              >
                <Icon name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              
              <Image 
                source={productImages[activeImageIndex]} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
              
              <View style={styles.imageViewerInfo}>
                <Text style={styles.imageViewerTitle}>{product.name}</Text>
                <Text style={styles.imageViewerSubtitle}>Tap anywhere to close</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Review Modal */}
      <AddReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        productId={product.id}
        onReviewAdded={() => {
          // Refresh ratings if needed
          console.log('Review added successfully');
        }}
      />
    </View>
  );
}
