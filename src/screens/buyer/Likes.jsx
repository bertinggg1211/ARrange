import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  StatusBar, 
  FlatList, 
  Animated,
  ScrollView 
} from "react-native";
import { useLikes } from "../../context/LikesContext";
import { getMainImageUri } from "../../utils/imageUtils";
import { getProductRatings } from "../../api/productApi";
import styles from "./styles/Likes.style";
import ThemeColors from '../../theme/colors';
const { Colors } = ThemeColors;
import Icon from "react-native-vector-icons/Ionicons";

export default function Likes({ navigation }) {
  const { likes, removeFromLikes } = useLikes();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [productRatings, setProductRatings] = useState({});
  const [loadingRatings, setLoadingRatings] = useState({});

  // Fetch ratings for a product
  const fetchProductRating = async (productId) => {
    if (productRatings[productId] || loadingRatings[productId]) {
      return; // Already fetched or loading
    }

    setLoadingRatings(prev => ({ ...prev, [productId]: true }));

    try {
      const response = await getProductRatings(productId);
      if (response.success && response.rating) {
        setProductRatings(prev => ({
          ...prev,
          [productId]: response.rating
        }));
      }
    } catch (error) {
      console.error('Error fetching product rating:', error);
    } finally {
      setLoadingRatings(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Fetch ratings for all liked products
  useEffect(() => {
    likes.forEach(item => {
      if (item.id && !productRatings[item.id] && !loadingRatings[item.id]) {
        fetchProductRating(item.id);
      }
    });
  }, [likes]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>YOUR LIKES</Text>
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>{likes.length}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Icon name="heart-outline" size={80} color="#E0E0E0" />
      </View>
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start exploring and add items to your favorites
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Icon name="home-outline" size={20} color="#FFFFFF" />
        <Text style={styles.browseButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }) => {
    const scale = new Animated.Value(1);

    const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start();

    // Get the main product image with proper URI handling
    const mainImageUri = getMainImageUri(item.images);
    const mainImage = mainImageUri ? { uri: mainImageUri } : null;

    // Format price
    const formattedPrice = typeof item.price === 'number' 
      ? `₱${item.price.toLocaleString()}` 
      : `₱${item.price}`;

    // Get rating data for this product
    const rating = productRatings[item.id];
    const isLoadingRating = loadingRatings[item.id];
    const averageRating = rating?.averageRating || 0;
    const totalReviews = rating?.totalReviews || 0;

    return (
      <Animated.View style={[styles.productCard, { transform: [{ scale }] }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate("ProductDetail", { product: item })}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.touchableCard}
          activeOpacity={0.9}
        >
          {mainImage ? (
            <Image 
              source={mainImage} 
              style={styles.productImg}
              onError={(error) => {
                console.error('❌ Favorites image load failed:', error.nativeEvent.error);
                console.error('❌ Image URI:', mainImageUri);
              }}
              onLoad={() => {
                console.log('✅ Favorites image loaded successfully:', mainImageUri);
              }}
            />
          ) : (
            <View style={[styles.productImg, { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' }]}>
              <Icon name="image-outline" size={40} color="#CCC" />
            </View>
          )}

          {/* Remove button */}
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeFromLikes(item.id)}
          >
            <Icon name="heart" size={18} color="#FF8B47" />
          </TouchableOpacity>

          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productPrice}>{formattedPrice}</Text>
            
            <View style={styles.ratingRow}>
              {isLoadingRating ? (
                <Text style={styles.ratingText}>Loading...</Text>
              ) : (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon 
                      key={i} 
                      name={i < Math.floor(averageRating) ? "star" : "star-outline"} 
                      size={12} 
                      color="#FFD700" 
                    />
                  ))}
                  <Text style={styles.ratingText}>
                    {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                    {totalReviews > 0 && ` (${totalReviews})`}
                  </Text>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8B47" />

      {/* Shaped Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>My Favorites</Text>
              <Text style={styles.headerSubtitle}>Items you love</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.viewModeButton}
                onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                <Icon 
                  name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Icon name="heart" size={24} color="#FF8B47" />
              <Text style={styles.statNumber}>{likes.length}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      {likes.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={likes}
          keyExtractor={(item) => String(item.id)}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when view mode changes
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productGrid}
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}