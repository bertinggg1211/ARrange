import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles/Search.style';
import { useLikes } from '../../context/LikesContext';
import { useCart } from '../../context/CartContext';
import Filter from './components/Filter';
import { getProducts } from '../../api/productApi';
import { getMainImageUri } from '../../utils/imageUtils';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Search({ navigation }) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Search functionality with backend API
  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Searching for:', query);

      // Call the backend API with search parameter
      const response = await getProducts({ 
        search: query.trim(),
        ...appliedFilters // Include any applied filters
      });

      console.log('🔍 Search API response:', response);
      console.log('🔍 Found products:', response.products?.length || 0);

      // Filter out products without images
      const productsWithImages = (response.products || []).filter(product => 
        product && product.id && product.images && product.images.length > 0
      );

      setSearchResults(productsWithImages);
    } catch (err) {
      console.error('❌ Search error:', err);
      setError(err.message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search to avoid too many API calls
  const searchTimeoutRef = useRef(null);
  
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 500); // 500ms delay

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, appliedFilters]);

  const { likes, addToLikes, removeFromLikes } = useLikes();
  const { addToCart } = useCart();
  const scaleAnim = useRef({}).current;
  
  // Initialize animations for search results
  searchResults.forEach((p) => { 
    if (p && p.id && !scaleAnim[p.id]) { 
      scaleAnim[p.id] = new Animated.Value(1); 
    } 
  });

  // Bouncy animation for popular searches
  const suggestionAnimations = useRef({}).current;
  const floatingAnimations = useRef({}).current;
  const popularSearches = ['Chandelier', 'Pendant Light', 'Table Lamp', 'Wall Light', 'Ceiling Light'];
  
  useEffect(() => {
    // Initialize animations for popular searches
    popularSearches.forEach((tag, index) => {
      if (!suggestionAnimations[tag]) {
        suggestionAnimations[tag] = new Animated.Value(0);
      }
      if (!floatingAnimations[tag]) {
        floatingAnimations[tag] = new Animated.Value(0);
      }
    });

    // Staggered bouncy entrance animation
    const entranceAnimations = popularSearches.map((tag, index) => {
      return Animated.spring(suggestionAnimations[tag], {
        toValue: 1,
        tension: 100,
        friction: 8,
        delay: index * 100, // Stagger each animation by 100ms
        useNativeDriver: true,
      });
    });

    // Floating animation for each tag
    const floatingAnimationsList = popularSearches.map((tag, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnimations[tag], {
            toValue: 1,
            duration: 2000 + (index * 200), // Different timing for each tag
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnimations[tag], {
            toValue: 0,
            duration: 2000 + (index * 200),
            useNativeDriver: true,
          }),
        ])
      );
    });

    // Start entrance animations
    Animated.parallel(entranceAnimations).start(() => {
      // Start floating animations after entrance
      floatingAnimationsList.forEach(animation => animation.start());
    });
  }, []);

  const toggleFavorite = (product) => {
    const isLiked = likes.some(item => item.id === product.id);
    if (isLiked) { removeFromLikes(product.id); } else { addToLikes(product); }
    Animated.sequence([
      Animated.timing(scaleAnim[product.id], { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim[product.id], { toValue: 1,   duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handleSuggestionPress = (tag) => {
    // Bouncy animation when suggestion is pressed
    Animated.sequence([
      Animated.spring(suggestionAnimations[tag], {
        toValue: 0.8,
        tension: 300,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.spring(suggestionAnimations[tag], {
        toValue: 1,
        tension: 300,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSearchQuery(tag);
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
              console.error('❌ Search product image load failed:', error.nativeEvent.error);
            }}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productPrice}>{formattedPrice}</Text>
            <Text style={styles.productSeller} numberOfLines={1}>by {shopName}</Text>
            {item.description && (
              <Text style={styles.productSpecs} numberOfLines={2}>{item.description}</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 6) + 60;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8B47" />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
        {/* Solid orange header background */}
        <View style={styles.topOrangeBg} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>ARANGE</Text>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate("Cart")}>
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
            <View style={styles.searchBox}>
              <Icon name="search-outline" size={20} color="#666" />
              <TextInput
                placeholder="Search products..."
                placeholderTextColor="#666"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              <TouchableOpacity style={styles.micBtn} activeOpacity={0.8}>
                <Icon name="mic-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.filterBtn} 
              activeOpacity={0.85}
              onPress={() => setShowFilter(true)}
            >
              <Icon name="options-outline" size={20} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Results */}
        <View style={styles.resultsSection}>
          {searchQuery ? (
            <>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>
                  {loading ? 'Searching...' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`}
                </Text>
              </View>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FF8B47" />
                  <Text style={styles.loadingText}>Searching products...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle-outline" size={48} color="#FF6B6B" />
                  <Text style={styles.errorTitle}>Search Error</Text>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => performSearch(searchQuery)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={2}
                  columnWrapperStyle={searchResults.length > 1 ? styles.productRow : null}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                  renderItem={renderProduct}
                />
              ) : (
                <View style={styles.noResults}>
                  <Icon name="search-outline" size={48} color="#CCCCCC" />
                  <Text style={styles.noResultsTitle}>No results found</Text>
                  <Text style={styles.noResultsText}>Try searching with different keywords or check your spelling</Text>
                  <TouchableOpacity 
                    style={styles.clearSearchButton}
                    onPress={() => setSearchQuery('')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.clearSearchText}>Clear Search</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.searchSuggestions}>
              <Text style={styles.suggestionsTitle}>Popular Searches</Text>
              <View style={styles.suggestionTags}>
                {popularSearches.map((tag, index) => (
                  <Animated.View
                    key={index}
                    style={{
                      transform: [
                        { scale: suggestionAnimations[tag] || 0 },
                        { translateY: suggestionAnimations[tag] ? suggestionAnimations[tag].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0]
                        }) : 20 },
                        { translateY: floatingAnimations[tag] ? floatingAnimations[tag].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -8]
                        }) : 0 }
                      ],
                      opacity: suggestionAnimations[tag] || 0,
                    }}
                  >
                    <TouchableOpacity 
                      style={styles.suggestionTag}
                      onPress={() => handleSuggestionPress(tag)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionTagText}>{tag}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Filter
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApplyFilters={(filters) => {
          setAppliedFilters(filters);
          console.log('Applied filters:', filters);
        }}
      />
    </SafeAreaView>
  );
}
