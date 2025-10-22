import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  FlatList,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import styles from "./styles/ViewProducts.style";
import { useLikes } from "../../context/LikesContext";
import { useCart } from "../../context/CartContext";
import { getProducts } from "../../api/productApi";
import { getMainImageUri } from "../../utils/imageUtils";

export default function ViewProducts({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Get navigation parameters
  const { title = 'All Products', category = 'all', fromScreen = 'Unknown' } = route.params || {};

  // Load products from API
  const loadProducts = async (isRefresh = false) => {
    try {
      console.log('🚀 Loading all products for ViewProducts...');
      console.log('📋 Navigation params:', { title, category, fromScreen });
      if (!isRefresh) setLoading(true);
      setError(null);
      
      // Get all products (no limit)
      const response = await getProducts(); 
      console.log('🔍 ViewProducts API response:', response);
      console.log('🔍 Total products count:', response.products?.length || 0);
      
      // Filter out null products and products without images
      let productsWithImages = (response.products || []).filter(product => 
        product && product.id && product.images && product.images.length > 0
      );
      
      // Apply category filter if specified
      if (category && category !== 'all') {
        productsWithImages = productsWithImages.filter(product => 
          product.category && product.category.toLowerCase() === category.toLowerCase()
        );
        console.log(`🔍 Filtered by category "${category}":`, productsWithImages.length);
      }
      
      console.log('🔍 Final products count:', productsWithImages.length);
      setProducts(productsWithImages);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts(true);
  };

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
    // Only render products that have images
    if (!item.images || item.images.length === 0) {
      return null;
    }
    
    // Get the main product image
    const mainImageUri = getMainImageUri(item.images);
    if (!mainImageUri) {
      console.warn(`⚠️ No valid image for product ${item.id}:`, item.images);
      return null;
    }
    
    const mainImage = { uri: mainImageUri };
    
    // Format price
    const formattedPrice = typeof item.price === 'number' 
      ? `₱${item.price.toLocaleString()}` 
      : `₱${item.price}`;
    
    // Get seller shop name
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
            price: item.price,
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

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 6) + 60;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Enhanced Header with Gradient */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="chevron-back-outline" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>
              {loading ? 'Loading...' : `${products.length} products available`}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.searchBtn} 
              onPress={() => navigation.navigate("Search")}
              activeOpacity={0.8}
            >
              <Icon name="search-outline" size={20} color="#666666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cartBtn} 
              onPress={() => navigation.navigate("Cart")}
              activeOpacity={0.8}
            >
              <Icon name="cart-outline" size={22} color="#1A1A1A" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Category Filter Bar */}
        <View style={styles.filterBar}>
          <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}>
            <Text style={styles.filterChipTextActive}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip}>
            <Text style={styles.filterChipText}>Chandeliers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip}>
            <Text style={styles.filterChipText}>Pendant Lights</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip}>
            <Text style={styles.filterChipText}>Wall Lights</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Products List */}
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
              <ActivityIndicator size="large" color="#FF8B47" />
            </View>
            <Text style={styles.loadingText}>Discovering amazing products...</Text>
            <Text style={styles.loadingSubtext}>This won't take long</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <Icon name="alert-circle-outline" size={48} color="#FF6B6B" />
            </View>
            <Text style={styles.errorText}>Oops! Something went wrong</Text>
            <Text style={styles.errorSubtext}>We couldn't load the products right now</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => loadProducts()}
              activeOpacity={0.8}
            >
              <Icon name="refresh-outline" size={18} color="#FFFFFF" style={styles.retryIcon} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Icon name="storefront-outline" size={64} color="#CCCCCC" />
            </View>
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>Be the first to discover new arrivals!</Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => navigation.navigate("Shop")}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreButtonText}>Explore Categories</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Products Grid */}
            <FlatList
              data={products}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={products.length > 1 ? styles.productRow : null}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.productsContainer, { paddingBottom: bottomPadding }]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#FF8B47']}
                  tintColor="#FF8B47"
                  progressBackgroundColor="#FFFFFF"
                />
              }
              renderItem={renderProduct}
              ListHeaderComponent={
                <View style={styles.listHeader}>
                  <View style={styles.resultsInfo}>
                    <Text style={styles.resultsText}>
                      Showing {products.length} product{products.length !== 1 ? 's' : ''}
                    </Text>
                    <TouchableOpacity style={styles.sortBtn}>
                      <Icon name="swap-vertical-outline" size={16} color="#666666" />
                      <Text style={styles.sortText}>Sort</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              }
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}