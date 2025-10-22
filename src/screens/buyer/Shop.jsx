import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  ScrollView,
  StatusBar,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { getAllSellers } from "../../api/productApi";
import { BASE_URL } from "../../api/api";
import styles from "./styles/Shop.style";

export default function Shop({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  // Real shops data from API
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load shops from API
  useEffect(() => {
    const loadShops = async () => {
      try {
        console.log('🏪 Loading all shops for Shop.jsx...');
        setLoading(true);
        setError(null);
        
        const response = await getAllSellers();
        console.log('🏪 Shop.jsx API response:', response);
        
        if (response.sellers && response.sellers.length > 0) {
          // Transform API data to match component structure
          const transformedShops = response.sellers.map(seller => {
            console.log('🏪 Processing seller:', {
              id: seller.id,
              shopName: seller.shopName,
              fullName: seller.fullName,
              sellerProfile: seller.sellerProfile
            });
            
            // Get shop logo/profile image with proper URL handling
            let avatarUri = null;
            if (seller.sellerProfile?.shopLogo) {
              avatarUri = seller.sellerProfile.shopLogo.startsWith('http') 
                ? seller.sellerProfile.shopLogo 
                : `${BASE_URL}${seller.sellerProfile.shopLogo}`;
            } else if (seller.sellerProfile?.profileImage) {
              avatarUri = seller.sellerProfile.profileImage.startsWith('http') 
                ? seller.sellerProfile.profileImage 
                : `${BASE_URL}${seller.sellerProfile.profileImage}`;
            }
            
            console.log('🖼️ Shop avatar URI:', avatarUri);
            
            return {
              id: seller.id,
              name: seller.sellerProfile?.businessName || seller.shopName || seller.fullName || 'Shop',
              avatar: avatarUri ? { uri: avatarUri } : null,
              rating: seller.sellerProfile?.rating || 0,
              products: seller.productCount || 0,
              location: seller.sellerProfile?.businessAddress || "Philippines",
              verified: (seller.sellerProfile?.rating || 0) >= 4.5, // Consider shops with 4.5+ rating as verified
              description: seller.sellerProfile?.businessDescription || "Quality lighting solutions",
              sellerProfile: seller.sellerProfile,
              createdAt: seller.createdAt,
              isNewSeller: !seller.sellerProfile?.rating || seller.sellerProfile.rating === 0
            };
          });
          
          console.log('🏪 Transformed shops:', transformedShops);
          setShops(transformedShops);
        } else {
          console.log('🏪 No shops found');
          setShops([]);
        }
      } catch (err) {
        console.error('❌ Error loading shops:', err);
        setError(err.message);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    loadShops();
  }, []);

  const categories = ["All", "Verified", "Top Rated", "New", "Local"];

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shop.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shop.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" ||
                           (selectedCategory === "Verified" && shop.verified) ||
                           (selectedCategory === "Top Rated" && shop.rating >= 4.0) ||
                           (selectedCategory === "New" && shop.isNewSeller) ||
                           (selectedCategory === "Local" && shop.location.toLowerCase().includes("philippines"));
    
    return matchesSearch && matchesCategory;
  });

  const renderShopCard = ({ item }) => (
    <TouchableOpacity 
      style={[styles.shopCard, viewMode === 'list' && styles.shopCardList]}
      onPress={() => navigation.navigate('ShopViewer', { sellerId: item.id })}
    >
      <View style={styles.shopImageContainer}>
        {item.avatar ? (
          <Image 
            source={item.avatar} 
            style={styles.shopImage}
            onError={(error) => {
              console.log('❌ Shop image load error:', error.nativeEvent.error);
              console.log('❌ Failed URI:', item.avatar.uri);
            }}
            onLoad={() => console.log('✅ Shop image loaded successfully for:', item.name)}
          />
        ) : (
          <View style={[styles.shopImage, styles.shopImagePlaceholder]}>
            <Icon name="storefront" size={32} color="#FF8B47" />
          </View>
        )}
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Icon name="checkmark-circle" size={16} color="#4CAF50" />
          </View>
        )}
      </View>
      
      <View style={styles.shopInfo}>
        <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.shopDescription} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.shopMeta}>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>
              {item.rating > 0 ? item.rating.toFixed(1) : 'New'}
            </Text>
          </View>
          <Text style={styles.productCount}>{item.products} products</Text>
        </View>
        
        <View style={styles.locationContainer}>
          <Icon name="location-outline" size={14} color="#666666" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8B47" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>All Shops</Text>
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
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search-outline" size={20} color="#666666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search shops..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon name="close-circle" size={20} color="#666666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.activeCategoryButton
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.activeCategoryText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredShops.length} shop{filteredShops.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Shops List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8B47" />
          <Text style={styles.loadingText}>Loading shops...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={80} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Failed to load shops</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              // Trigger reload by calling the effect again
              const loadShops = async () => {
                try {
                  const response = await getAllSellers();
                  if (response.sellers && response.sellers.length > 0) {
                    const transformedShops = response.sellers.map(seller => {
                      // Get shop logo/profile image with proper URL handling
                      let avatarUri = null;
                      if (seller.sellerProfile?.shopLogo) {
                        avatarUri = seller.sellerProfile.shopLogo.startsWith('http') 
                          ? seller.sellerProfile.shopLogo 
                          : `${BASE_URL}${seller.sellerProfile.shopLogo}`;
                      } else if (seller.sellerProfile?.profileImage) {
                        avatarUri = seller.sellerProfile.profileImage.startsWith('http') 
                          ? seller.sellerProfile.profileImage 
                          : `${BASE_URL}${seller.sellerProfile.profileImage}`;
                      }
                      
                      return {
                        id: seller.id,
                        name: seller.sellerProfile?.businessName || seller.shopName || seller.fullName || 'Shop',
                        avatar: avatarUri ? { uri: avatarUri } : null,
                        rating: seller.sellerProfile?.rating || 0,
                        products: seller.productCount || 0,
                        location: seller.sellerProfile?.businessAddress || "Philippines",
                        verified: (seller.sellerProfile?.rating || 0) >= 4.5,
                        description: seller.sellerProfile?.businessDescription || "Quality lighting solutions",
                        sellerProfile: seller.sellerProfile,
                        createdAt: seller.createdAt,
                        isNewSeller: !seller.sellerProfile?.rating || seller.sellerProfile.rating === 0
                      };
                    });
                    setShops(transformedShops);
                  } else {
                    setShops([]);
                  }
                } catch (err) {
                  setError(err.message);
                  setShops([]);
                } finally {
                  setLoading(false);
                }
              };
              loadShops();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredShops}
          keyExtractor={(item) => item.id.toString()}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when view mode changes
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.shopsList}
          renderItem={renderShopCard}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="storefront-outline" size={80} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>No Shops Found</Text>
              <Text style={styles.emptySubtitle}>
                {shops.length === 0 
                  ? "No shops are available at the moment"
                  : "Try adjusting your search or category filters"
                }
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}