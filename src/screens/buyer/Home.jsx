import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  FlatList,
  Animated,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  DeviceEventEmitter,
  RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import styles from "../../screens/buyer/styles/Home.style";
import { useLikes } from "../../context/LikesContext";
import { useCart } from "../../context/CartContext";
import Filter from "./components/Filter";
import { getProducts, getAllSellers } from "../../api/productApi";
import { getMainImageUri } from "../../utils/imageUtils";
import { BASE_URL } from "../../api/api";
import { startTimer, endTimer, logPerformanceSummary } from "../../utils/performanceMonitor";

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Home({ navigation }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shops, setShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Banner carousel data
  const banners = [
    { id: '1', image: require('../../images/banner/chandelier_banner1.jpg') },
    { id: '2', image: require('../../images/banner/chandelier_banner2.jpg') },
    { id: '3', image: require('../../images/banner/chandelier_banner3.jpg') },
  ];
  const bannerRef = useRef(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerTimer = useRef(null);

  useEffect(() => {
    // auto-play banner with 2 second transition
    bannerTimer.current && clearInterval(bannerTimer.current);
    bannerTimer.current = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % banners.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 2000); // Changed to 2 seconds
    return () => {
      if (bannerTimer.current) clearInterval(bannerTimer.current);
    };
  }, [banners.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const idx = viewableItems[0].index ?? 0;
      setBannerIndex(idx);
    }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  // Load products from API with performance monitoring
  const loadProducts = async () => {
      try {
        startTimer('loadProducts');
        console.log('🚀 Starting to load products...');
        setLoading(true);
        setError(null);
        console.log('🔍 Calling getProducts with limit 6 for better home display');
        const response = await getProducts({ limit: 6 }); // Get 6 products for better home display
        console.log('🔍 Raw API response:', response);
        console.log('🔍 Products array:', response.products);
        console.log('🔍 Products count:', response.products?.length || 0);
        
        // Check for null/undefined products
        if (response.products) {
          response.products.forEach((product, index) => {
            if (!product) {
              console.warn(`⚠️ Null product at index ${index}`);
            } else if (!product.id) {
              console.warn(`⚠️ Product missing ID at index ${index}:`, product);
            } else if (!product.images || product.images.length === 0) {
              console.warn(`⚠️ Product ${product.id} has no images`);
            }
          });
        }
        
        // Filter out null products and products without images
        const productsWithImages = (response.products || []).filter(product => 
          product && product.id && product.images && product.images.length > 0
        );
        console.log('🔍 Products with images count:', productsWithImages.length);
        console.log('🔍 Filtered products:', productsWithImages);
        setProducts(productsWithImages);
        setFilteredProducts(productsWithImages);
        console.log('✅ Products state updated successfully');
        endTimer('loadProducts', { productsCount: productsWithImages.length });
      } catch (err) {
        console.error('Error loading products:', err);
        setError(err.message);
        setProducts([]);
        setFilteredProducts([]);
        endTimer('loadProducts', { error: err.message, productsCount: 0 });
      } finally {
        setLoading(false);
      }
    };

  // Pull-to-refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProducts();
      await loadShops();
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Load sellers/shops from API with performance monitoring
  const loadShops = useCallback(async () => {
    try {
      startTimer('loadShops');
      console.log('🏪 Loading shops for Home...');
      console.log('🏪 Current BASE_URL:', BASE_URL);
      setShopsLoading(true);
      
      const response = await getAllSellers();
      console.log('🏪 Shops API response:', response);
      console.log('🏪 Total shops count:', response.sellers?.length || 0);
      console.log('🏪 Response type:', typeof response);
      console.log('🏪 Response keys:', Object.keys(response || {}));
      
      // Debug seller profile data
      if (response.sellers && response.sellers.length > 0) {
        response.sellers.forEach((seller, index) => {
          console.log(`🏪 Seller ${index + 1}:`, {
            id: seller.id,
            shopName: seller.shopName,
            fullName: seller.fullName,
            hasSellerProfile: !!seller.sellerProfile,
            shopLogo: seller.sellerProfile?.shopLogo,
            profileImage: seller.sellerProfile?.profileImage,
            businessName: seller.sellerProfile?.businessName
          });
        });
      }
      
      // Filter sellers that have shop names and profile info
      const validShops = (response.sellers || []).filter(seller => 
        seller && seller.id && (seller.shopName || seller.fullName)
      );
      
      console.log('🏪 Valid shops count:', validShops.length);
      console.log('🏪 Shop descriptions debug:', validShops.map(shop => ({
        shopName: shop.shopName || shop.fullName,
        businessDescription: shop.sellerProfile?.businessDescription,
        hasDescription: !!shop.sellerProfile?.businessDescription
      })));
      setShops(validShops);
      endTimer('loadShops', { shopsCount: validShops.length });
    } catch (err) {
      console.error('❌ Error loading shops:', err);
      setShops([]); // Set empty array on error
      endTimer('loadShops', { error: err.message, shopsCount: 0 });
    } finally {
      setShopsLoading(false);
    }
  }, []);

  useEffect(() => {
    startTimer('homeScreenLoad');
    loadProducts();
    loadShops();
    
    // Log performance summary after initial load
    setTimeout(() => {
      endTimer('homeScreenLoad');
      logPerformanceSummary();
    }, 100);
  }, []); // Remove loadShops dependency to prevent re-renders

  // Listen for product creation/updates to refresh product list
  useEffect(() => {
    const handleProductCreated = () => {
      console.log('🏠 Home.jsx: Product created event received, refreshing products...');
      loadProducts();
    };

    const handleProductUpdated = () => {
      console.log('🏠 Home.jsx: Product updated event received, refreshing products...');
      loadProducts();
    };

    const productCreatedSubscription = DeviceEventEmitter.addListener('SELLER_PRODUCT_CREATED', handleProductCreated);
    const productUpdatedSubscription = DeviceEventEmitter.addListener('SELLER_PRODUCT_UPDATED', handleProductUpdated);

    return () => {
      productCreatedSubscription.remove();
      productUpdatedSubscription.remove();
    };
  }, []);

  // Filter products by search and applied filters
  useEffect(() => {
    let data = [...products];
    
    // Apply search filter
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      data = data.filter(p => 
        p && p.name && (
          p.name.toLowerCase().includes(q) || 
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
        )
      );
    }
    
    // Apply additional filters
    if (appliedFilters.category && appliedFilters.category !== 'All') {
      data = data.filter(p => p && p.category === appliedFilters.category);
    }
    
    if (appliedFilters.minPrice) {
      data = data.filter(p => p && p.price && parseFloat(p.price) >= parseFloat(appliedFilters.minPrice));
    }
    
    if (appliedFilters.maxPrice) {
      data = data.filter(p => p && p.price && parseFloat(p.price) <= parseFloat(appliedFilters.maxPrice));
    }
    
    setFilteredProducts(data);
  }, [search, products, appliedFilters]);

  const { likes, addToLikes, removeFromLikes } = useLikes();
  const { addToCart } = useCart();
  const scaleAnim = useRef({}).current;
  products.forEach((p) => { 
    if (p && p.id && !scaleAnim[p.id]) { 
      scaleAnim[p.id] = new Animated.Value(1); 
    } 
  });

  const toggleFavorite = (product) => {
    const isLiked = likes.some(item => item.id === product.id);
    if (isLiked) { removeFromLikes(product.id); } else { addToLikes(product); }
    Animated.sequence([
      Animated.timing(scaleAnim[product.id], { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim[product.id], { toValue: 1,   duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const renderProduct = ({ item }) => {
    // Only render products that have images - no placeholders
    if (!item.images || item.images.length === 0) {
      return null; // Don't render products without images
    }
    
    // Get the main product image with better URI handling
    const mainImageUri = getMainImageUri(item.images);
    if (!mainImageUri) {
      console.warn(`⚠️ No valid image for product ${item.id}:`, item.images);
      return null;
    }
    
    // Convert to proper format for Image component
    const mainImage = { uri: mainImageUri };
    
    // Format price
    const formattedPrice = typeof item.price === 'number' 
      ? `₱${item.price.toLocaleString()}` 
      : `₱${item.price}`;
    
    // Get seller shop name for display
    const shopName = item.sellerName || `Store ${item.sellerId?.slice(-4) || 'Unknown'}`;

    return (
      <View style={styles.productCard}>
        <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.favoriteBtn}>
          <Animated.View style={{ transform: [{ scale: scaleAnim[item.id] || new Animated.Value(1) }] }}>
            <Icon 
              name={likes.some(likedItem => likedItem.id === item.id) ? "heart" : "heart-outline"} 
              size={20} 
              color={likes.some(likedItem => likedItem.id === item.id) ? "#FF6B6B" : "#FFFFFF"} 
            />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addToCartBtn} 
          onPress={() => addToCart({ 
            id: item.id, 
            name: item.name, 
            price: item.price, // Use raw price for calculations
            image: mainImage, 
            quantity: 1,
            sellerId: item.sellerId,
            sellerName: shopName
          })} 
          activeOpacity={0.8}
        >
          <Icon name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("ProductDetail", { product: item })}>
          <Image 
            source={mainImage} 
            style={styles.productImg}
            onError={(error) => {
              console.error('❌ Product image load failed:', error.nativeEvent.error);
              console.error('❌ Image URI:', mainImageUri);
              console.error('❌ Original images array:', item.images);
            }}
            onLoad={() => {
              console.log('✅ Product image loaded successfully:', mainImageUri);
            }}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productPrice}>{formattedPrice}</Text>
            <Text style={styles.productSeller} numberOfLines={1}>by {shopName}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Memoized shop item renderer - Clean circular design with just image and name
  const renderShopItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.shopItem}
      onPress={() => navigation.navigate("ShopViewer", { sellerId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.shopAvatarContainer}>
        {(item.sellerProfile?.shopLogo || item.sellerProfile?.profileImage) ? (
          <Image 
            source={{ 
              uri: (item.sellerProfile.shopLogo || item.sellerProfile.profileImage).startsWith('http') 
                ? (item.sellerProfile.shopLogo || item.sellerProfile.profileImage)
                : `${BASE_URL}${item.sellerProfile.shopLogo || item.sellerProfile.profileImage}`
            }} 
            style={styles.shopAvatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.shopAvatarPlaceholder}>
            <Icon name="storefront" size={32} color="#FF8B47" />
          </View>
        )}
      </View>
      <Text style={styles.shopName} numberOfLines={1}>
        {item.shopName || item.sellerProfile?.businessName || item.fullName || 'Shop'}
      </Text>
    </TouchableOpacity>
  ), [navigation]);

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 6) + 60; // tab bar height approx

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8B47" />
      
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF8B47']} // Android
            tintColor="#FF8B47" // iOS
            title="Pull to refresh" // iOS
            titleColor="#666" // iOS
          />
        }
      >
        {/* Solid orange header background */}
        <View style={styles.topOrangeBg} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>ARANGE</Text>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate("Cart") }>
            <View style={styles.cartBackdrop}>
              <Icon name="cart-outline" size={20} color="#FFFFFF" />
            </View>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar with mic and external filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <TouchableOpacity 
            style={styles.searchBox}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.8}
          >
            <Icon name="search-outline" size={20} color="#666" />
            <Text style={styles.searchPlaceholder}>Search products...</Text>
            <TouchableOpacity style={styles.micBtn} activeOpacity={0.8}>
              <Icon name="mic-outline" size={20} color="#666" />
            </TouchableOpacity>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.filterBtn} 
            activeOpacity={0.85}
            onPress={() => setShowFilter(true)}
          >
            <Icon name="options-outline" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroShapes}>
          <View style={styles.heroCircleOne} />
          <View style={styles.heroCircleTwo} />
        </View>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Elevate your space</Text>
          <Text style={styles.heroSubtitle}>Premium lighting with AR preview</Text>
          <View style={styles.heroButtonsRow}>
            <TouchableOpacity style={styles.heroPrimaryBtn} activeOpacity={0.9} onPress={() => navigation.navigate('Shop')}>
              <Text style={styles.heroBtnText}>Shop now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroSecondaryBtn} activeOpacity={0.9} onPress={() => navigation.navigate('TryAR')}>
              <Text style={styles.heroBtnSecondaryText}>Try AR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Banner Carousel */}
      <View style={styles.bannerCarousel}>
        <FlatList
          ref={bannerRef}
          data={banners}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bannerContent}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewConfigRef.current}
          getItemLayout={(data, index) => ({ length: SCREEN_WIDTH - 32, offset: (SCREEN_WIDTH - 32) * index, index })}
          renderItem={({ item }) => (
            <View style={styles.bannerCard}>
              <Image source={item.image} style={styles.bannerImage} />
              <View style={styles.bannerOverlay} />
              <View style={styles.bannerCaptionWrap}>
                <Text style={styles.bannerCaptionTitle}>Discover lighting</Text>
                <Text style={styles.bannerCaptionSubtitle}>Style your home with AR</Text>
              </View>
            </View>
          )}
        />
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {banners.map((b, idx) => (
            <View key={b.id} style={[styles.dot, idx === bannerIndex && styles.dotActive]} />
          ))}
        </View>
      </View>

        {/* Shops Section */}
        <View style={styles.shopsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shops</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate("Shop")}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Icon name="chevron-forward-outline" size={16} color="#FF8B47" />
            </TouchableOpacity>
          </View>
          
          {shopsLoading ? (
            <View style={styles.shopsLoadingContainer}>
              <ActivityIndicator size="small" color="#FF8B47" />
              <Text style={styles.shopsLoadingText}>Loading shops...</Text>
            </View>
          ) : shops.length > 0 ? (
            <FlatList
              data={shops}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shopsRow}
              removeClippedSubviews={true}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
              windowSize={10}
              getItemLayout={(data, index) => ({ length: 100, offset: 100 * index, index })}
              updateCellsBatchingPeriod={50}
              disableVirtualization={false}
              renderItem={renderShopItem}
            />
          ) : (
            <View style={styles.noShopsContainer}>
              <Icon name="storefront-outline" size={32} color="#CCCCCC" />
              <Text style={styles.noShopsText}>No shops available</Text>
            </View>
          )}
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Products</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ViewProducts', {
              title: 'All Products',
              category: 'all',
              fromScreen: 'Home'
            })}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF8B47" />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle-outline" size={48} color="#FF6B6B" />
              <Text style={styles.errorText}>Failed to load products</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  const loadProducts = async () => {
                    try {
                      setLoading(true);
                      setError(null);
                      const response = await getProducts({ limit: 2 });
                      // Filter out null products and products without images
                      const productsWithImages = (response.products || []).filter(product => 
                        product && product.id && product.images && product.images.length > 0
                      );
                      setProducts(productsWithImages);
                      setFilteredProducts(productsWithImages);
                    } catch (err) {
                      setError(err.message);
                      setProducts([]);
                      setFilteredProducts([]);
                    } finally {
                      setLoading(false);
                    }
                  };
                  loadProducts();
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="cube-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubtext}>Check back later for new products!</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={filteredProducts.length > 1 ? styles.productRow : null}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                renderItem={renderProduct}
                onLayout={() => console.log('🔍 FlatList rendered successfully')}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Filter
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApplyFilters={(filters) => {
          setAppliedFilters(filters);
          // Here you can implement the actual filtering logic
          console.log('Applied filters:', filters);
        }}
      />
    </SafeAreaView>
  );
}


