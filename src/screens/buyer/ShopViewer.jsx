import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { getShopDetails } from "../../api/productApi";
import { BASE_URL } from "../../api/api";
import { useCart } from "../../context/CartContext";
import { useLikes } from "../../context/LikesContext";
import { getMainImageUri } from "../../utils/imageUtils";
import { getShopReviews } from "../../api/reviewApi";
import ProductRatingBadge from "../../components/ProductRatingBadge";
import styles from "./styles/ShopViewer.style";

// Theme colors
const Colors = {
  primary: '#1A1A1A',
  primaryLight: '#2D2D2D',
  secondary: '#FF8B47',
  secondaryLight: '#FFB380',
  secondaryDark: '#E6703D',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceLight: '#FAFAFA',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#999999',
  textInverse: '#FFFFFF',
  success: '#4CAF50',
  error: '#F44336',
  info: '#2196F3',
  border: '#E0E0E0',
  disabled: '#CCCCCC',
  shadow: 'rgba(0, 0, 0, 0.08)',
};

const { width } = Dimensions.get('window');

export default function ShopViewer({ route, navigation }) {
  const { sellerId } = route.params;
  const { addToCart } = useCart();
  const { likes, addToLikes, removeFromLikes } = useLikes();

  // State management
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  
  // Reviews state
  const [shopReviews, setShopReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  
  // Filter and pagination state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);

  // Load shop details
  const loadShopDetails = useCallback(async (page = 1, isRefresh = false, isLoadMore = false) => {
    try {
      if (!isRefresh && !isLoadMore) setLoading(true);
      if (isRefresh) setRefreshing(true);
      if (isLoadMore) setLoadingMore(true);
      
      setError(null);
      
      console.log(`🏪 Loading shop details for ${sellerId}, page ${page}`);
      
      const response = await getShopDetails(sellerId, {
        page,
        limit: 20,
        category: selectedCategory,
        sortBy
      });
      
      if (response.success && response.shop) {
        console.log('🏪 Shop data received:', {
          id: response.shop.id,
          name: response.shop.name,
          shopName: response.shop.shopName,
          hasShopBanner: !!response.shop.shopBanner,
          hasShopLogo: !!response.shop.shopLogo,
          hasProfileImage: !!response.shop.profileImage,
          shopBanner: response.shop.shopBanner,
          shopLogo: response.shop.shopLogo,
          profileImage: response.shop.profileImage,
          sellerProfile: response.shop.sellerProfile
        });
        
        if (page === 1 || isRefresh) {
          // First page or refresh - replace all data
          setShop(response.shop);
          setCurrentPage(1);
        } else {
          // Load more - append products
          setShop(prevShop => ({
            ...response.shop,
            products: [...(prevShop?.products || []), ...response.shop.products]
          }));
          setCurrentPage(page);
        }
        
        setHasMoreProducts(response.shop.pagination.hasNextPage);
        console.log(`✅ Shop loaded: ${response.shop.products.length} products`);
      } else {
        throw new Error('Invalid shop response');
      }
    } catch (err) {
      console.error('❌ Error loading shop:', err);
      setError(err.message);
      if (page === 1) {
        setShop(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [sellerId, selectedCategory, sortBy]);

  // Initial load
  useEffect(() => {
    loadShopDetails(1);
  }, [loadShopDetails]);

  // Handle refresh
  const handleRefresh = () => {
    loadShopDetails(1, true);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!loadingMore && hasMoreProducts && shop) {
      loadShopDetails(currentPage + 1, false, true);
    }
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    if (category !== selectedCategory) {
      setSelectedCategory(category);
      setCurrentPage(1);
      // loadShopDetails will be called automatically due to dependency change
    }
  };

  // Handle sort change
  const handleSortChange = (sort) => {
    if (sort !== sortBy) {
      setSortBy(sort);
      setCurrentPage(1);
      // loadShopDetails will be called automatically due to dependency change
    }
  };

  // Handle product like
  const handleLikeProduct = (product) => {
    const isLiked = likes.some(item => item.id === product.id);
    if (isLiked) {
      removeFromLikes(product.id);
    } else {
      addToLikes(product);
    }
  };

  // Handle add to cart
  const handleAddToCart = (product) => {
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || null,
      quantity: 1,
      sellerId: product.sellerId,
      sellerName: shop?.name || 'Shop'
    };
    
    addToCart(cartItem);
    Alert.alert('Success', `${product.name} added to cart!`);
  };

  // Handle image viewing
  const openImageViewer = (imageUri, imageType = 'banner') => {
    setViewingImage({ uri: imageUri, type: imageType });
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setViewingImage(null);
  };

  // Load shop reviews
  useEffect(() => {
    const loadReviews = async () => {
      if (!sellerId) return;
      
      try {
        setLoadingReviews(true);
        console.log('📖 Loading shop reviews for seller:', sellerId);
        
        const response = await getShopReviews(sellerId, 10, 0, 'recent');
        
        if (response.success) {
          setShopReviews(response.reviews || []);
          setReviewStats(response.stats);
          console.log('✅ Shop reviews loaded:', response.reviews?.length || 0);
        }
      } catch (error) {
        console.error('❌ Error loading shop reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };
    
    loadReviews();
  }, [sellerId]);

  // Render compact shop info section with rating from backend
  const renderShopInfo = () => (
    <View style={styles.shopInfoSection}>
      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Icon name="star" size={20} color="#FFD700" />
          </View>
          <Text style={styles.infoValue}>
            {reviewStats?.overall_rating > 0 ? reviewStats.overall_rating.toFixed(1) : 'New'}
          </Text>
          <Text style={styles.infoLabel}>Rating</Text>
        </View>
        
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Icon name="cube" size={20} color="#FF8B47" />
          </View>
          <Text style={styles.infoValue}>{shop?.totalProducts || 0}</Text>
          <Text style={styles.infoLabel}>Products</Text>
        </View>
        
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Icon name="chatbubble-ellipses" size={20} color="#2196F3" />
          </View>
          <Text style={styles.infoValue}>{reviewStats?.total_reviews || 0}</Text>
          <Text style={styles.infoLabel}>Reviews</Text>
          <TouchableOpacity 
            style={styles.viewAllReviewsButton}
            onPress={() => navigation.navigate('ShopReviews', { 
              sellerId, 
              shopName: shop?.name || shop?.shopName 
            })}
          >
            <Text style={styles.viewAllReviewsText}>View All</Text>
            <Icon name="chevron-forward" size={12} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render shop header with Facebook-style profile
  const renderShopHeader = () => (
    <View style={styles.shopHeader}>
      {/* Cover Banner */}
      <TouchableOpacity 
        style={styles.coverContainer}
        onPress={() => shop?.shopBanner && openImageViewer(
          shop.shopBanner.startsWith('http') 
            ? shop.shopBanner
            : `${BASE_URL}${shop.shopBanner}`,
          'banner'
        )}
        activeOpacity={0.9}
      >
        {shop?.shopBanner ? (
          <Image 
            source={{ 
              uri: shop.shopBanner.startsWith('http') 
                ? shop.shopBanner
                : `${BASE_URL}${shop.shopBanner}` 
            }} 
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <View style={styles.placeholderContent}>
              <View style={styles.placeholderIconContainer}>
                <Icon name="image" size={40} color="#FFFFFF" />
              </View>
              <Text style={styles.coverPlaceholderText}>Add Shop Banner</Text>
              <Text style={styles.coverPlaceholderSubtext}>Showcase your shop with a beautiful banner</Text>
            </View>
            <View style={styles.placeholderPattern}>
              <View style={styles.patternDot} />
              <View style={styles.patternDot} />
              <View style={styles.patternDot} />
              <View style={styles.patternDot} />
              <View style={styles.patternDot} />
              <View style={styles.patternDot} />
              <View style={styles.patternDot} />
              <View style={styles.patternDot} />
              <View style={styles.patternDot} />
              <View style={styles.patternDot} />
              <View style={styles.patternDot} />
              <View style={styles.patternDot} />
            </View>
          </View>
        )}
        
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={Colors.textInverse} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <Icon name="share-outline" size={24} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileInfo}>
          {/* Profile Picture */}
          <TouchableOpacity 
            style={styles.profilePictureContainer}
            onPress={() => (shop?.shopLogo || shop?.profileImage) && openImageViewer(
              (shop.shopLogo || shop.profileImage).startsWith('http') 
                ? (shop.shopLogo || shop.profileImage)
                : `${BASE_URL}${shop.shopLogo || shop.profileImage}`,
              'profile'
            )}
            activeOpacity={0.8}
          >
            {shop?.shopLogo || shop?.profileImage ? (
              <Image 
                source={{ 
                  uri: (shop.shopLogo || shop.profileImage).startsWith('http') 
                    ? (shop.shopLogo || shop.profileImage)
                    : `${BASE_URL}${shop.shopLogo || shop.profileImage}` 
                }} 
                style={styles.profilePicture}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Icon name="storefront-outline" size={40} color={Colors.textSecondary} />
              </View>
            )}
            {shop?.verified && (
              <View style={styles.verifiedBadge}>
                <Icon name="checkmark-circle" size={20} color={Colors.success} />
              </View>
            )}
          </TouchableOpacity>
          
          {/* Shop Details */}
          <View style={styles.shopDetails}>
            <View style={styles.shopDetailsCard}>
              <Text style={styles.shopName}>{shop?.shopName || 'Shop Name'}</Text>
              <View style={styles.shopDivider} />
              <View style={styles.ownerRow}>
                <Text style={styles.ownerLabel}>Owner: </Text>
                <Text style={styles.shopOwner}>{shop?.name || shop?.ownerName || 'Shop Owner'}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton}>
            <Icon name="chatbubble-outline" size={18} color={Colors.textInverse} />
            <Text style={styles.primaryButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Icon name="heart-outline" size={18} color={Colors.secondary} />
            <Text style={styles.secondaryButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>

        {/* Shop Description */}
        {shop?.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>{shop.description}</Text>
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.contactContainer}>
          {shop?.businessAddress && (
            <View style={styles.contactItem}>
              <Icon name="location" size={16} color={Colors.textSecondary} />
              <Text style={styles.contactText}>{shop.businessAddress}</Text>
            </View>
          )}
          {shop?.businessPhone && (
            <View style={styles.contactItem}>
              <Icon name="call" size={16} color={Colors.textSecondary} />
              <Text style={styles.contactText}>{shop.businessPhone}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // Render category filter
  const renderCategoryFilter = () => (
    <View style={styles.filterSection}>
      <View style={styles.productsHeader}>
        <Text style={styles.productsTitle}>Products ({shop?.totalProducts || 0})</Text>
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => {
            Alert.alert(
              'Sort Products',
              'Choose sorting option',
              [
                { text: 'Newest', onPress: () => handleSortChange('newest') },
                { text: 'Price: Low to High', onPress: () => handleSortChange('price_low') },
                { text: 'Price: High to Low', onPress: () => handleSortChange('price_high') },
                { text: 'Popular', onPress: () => handleSortChange('popular') },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
          <Text style={styles.sortButtonText}>Sort</Text>
          <Icon name="chevron-down" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {shop?.categories && shop.categories.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'all' && styles.activeCategoryChip
            ]}
            onPress={() => handleCategoryChange('all')}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === 'all' && styles.activeCategoryChipText
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {shop.categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.activeCategoryChip
              ]}
              onPress={() => handleCategoryChange(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.activeCategoryChipText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  // Render product item
  const renderProductItem = ({ item }) => {
    const isLiked = likes.some(likedItem => likedItem.id === item.id);
    
    // Get main product image using utility function (same as other screens)
    const mainImageUri = getMainImageUri(item.images);
    
    // Debug product image data
    console.log('🖼️ Product image debug:', {
      productId: item.id,
      productName: item.name,
      images: item.images,
      imagesLength: item.images?.length,
      firstImage: item.images?.[0],
      mainImageUri: mainImageUri,
      hasValidImage: !!mainImageUri
    });
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <View style={styles.productImageContainer}>
          {mainImageUri ? (
            <Image 
              source={{ uri: mainImageUri }} 
              style={styles.productImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('❌ Image load error for', item.name, ':', error.nativeEvent.error);
                console.log('❌ Failed URI:', mainImageUri);
              }}
              onLoad={() => console.log('✅ Image loaded successfully for:', item.name)}
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Icon name="image" size={32} color="#CCCCCC" />
            </View>
          )}
          
          {/* Like button */}
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => handleLikeProduct(item)}
          >
            <Icon 
              name={isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={isLiked ? "#FF6B6B" : "#666666"} 
            />
          </TouchableOpacity>
          
          {/* Product Rating Badge */}
          {item.rating > 0 && (
            <View style={{ position: 'absolute', bottom: 8, left: 8 }}>
              <ProductRatingBadge 
                rating={item.rating} 
                reviewCount={item.reviewCount}
                size="small"
              />
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.productBottom}>
            <Text style={styles.productPrice}>₱{item.price?.toLocaleString()}</Text>
            <TouchableOpacity 
              style={styles.addToCartButton}
              onPress={() => handleAddToCart(item)}
            >
              <Icon name="add" size={16} color={Colors.textInverse} />
            </TouchableOpacity>
          </View>
          {item.hasAR && (
            <View style={styles.arBadge}>
              <Text style={styles.arBadgeText}>AR</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && !shop) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#FF8B47" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>Loading shop...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !shop) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#FF8B47" />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={80} color={Colors.error} />
          <Text style={styles.errorTitle}>Failed to load shop</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadShopDetails(1)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8B47" />
      
      <FlatList
        data={shop?.products || []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.secondary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={() => (
          <View>
            {renderShopHeader()}
            {renderShopInfo()}
            {renderCategoryFilter()}
          </View>
        )}
        renderItem={renderProductItem}
        contentContainerStyle={styles.productsList}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="cube-outline" size={80} color={Colors.disabled} />
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>
              This shop doesn't have any products yet
            </Text>
          </View>
        )}
        ListFooterComponent={() => (
          <View>
            {loadingMore ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={Colors.secondary} />
                <Text style={styles.loadMoreText}>Loading more products...</Text>
              </View>
            ) : null}
          </View>
        )}
      />
      
      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerContainer}>
          <SafeAreaView style={styles.imageViewerSafeArea}>
            <View style={styles.imageViewerHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeImageViewer}
              >
                <Icon name="close" size={28} color={Colors.textInverse} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.imageViewerContent}>
              {viewingImage && (
                <Image
                  source={{ uri: viewingImage.uri }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}