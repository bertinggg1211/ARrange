import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { getShopReviews } from '../../api/reviewApi';
import styles from './styles/ShopReviews.style';

export default function ShopReviews({ route, navigation }) {
  const { sellerId, shopName } = route.params;
  
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async (isRefresh = false, isLoadMore = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentPage = isRefresh ? 1 : isLoadMore ? page + 1 : 1;
      const response = await getShopReviews(sellerId, 20, (currentPage - 1) * 20, 'recent');

      if (response.success) {
        const newReviews = response.reviews || [];
        
        if (isRefresh) {
          setReviews(newReviews);
          setPage(1);
        } else if (isLoadMore) {
          setReviews([...reviews, ...newReviews]);
          setPage(currentPage);
        } else {
          setReviews(newReviews);
        }
        
        setStats(response.stats);
        setHasMore(newReviews.length === 20);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.statsContainer}>
        <View style={styles.overallRatingCard}>
          <Text style={styles.overallRatingValue}>
            {stats?.overall_rating ? stats.overall_rating.toFixed(1) : 'N/A'}
          </Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                name={star <= Math.round(stats?.overall_rating || 0) ? 'star' : 'star-outline'}
                size={20}
                color="#FFD700"
              />
            ))}
          </View>
          <Text style={styles.totalReviewsText}>
            {stats?.total_reviews || 0} {stats?.total_reviews === 1 ? 'Review' : 'Reviews'}
          </Text>
        </View>

        {stats && stats.overall_rating > 0 && (
          <View style={styles.detailedRatings}>
            <View style={styles.ratingRow}>
              <Icon name="chatbubbles" size={16} color="#4CAF50" />
              <Text style={styles.ratingLabel}>Communication</Text>
              <View style={styles.ratingBarContainer}>
                <View style={[styles.ratingBar, { width: `${(stats.communication_rating / 5) * 100}%` }]} />
              </View>
              <Text style={styles.ratingValue}>{stats.communication_rating?.toFixed(1) || 'N/A'}</Text>
            </View>

            <View style={styles.ratingRow}>
              <Icon name="rocket" size={16} color="#2196F3" />
              <Text style={styles.ratingLabel}>Shipping Speed</Text>
              <View style={styles.ratingBarContainer}>
                <View style={[styles.ratingBar, { width: `${(stats.shipping_speed_rating / 5) * 100}%` }]} />
              </View>
              <Text style={styles.ratingValue}>{stats.shipping_speed_rating?.toFixed(1) || 'N/A'}</Text>
            </View>

            <View style={styles.ratingRow}>
              <Icon name="ribbon" size={16} color="#FF8B47" />
              <Text style={styles.ratingLabel}>Product Quality</Text>
              <View style={styles.ratingBarContainer}>
                <View style={[styles.ratingBar, { width: `${(stats.product_quality_rating / 5) * 100}%` }]} />
              </View>
              <Text style={styles.ratingValue}>{stats.product_quality_rating?.toFixed(1) || 'N/A'}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.reviewsListHeader}>
        <Text style={styles.reviewsListTitle}>Customer Reviews</Text>
      </View>
    </View>
  );

  const renderReview = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <View style={styles.avatar}>
            {item.buyer?.profile_picture ? (
              <Image source={{ uri: item.buyer.profile_picture }} style={styles.avatarImage} />
            ) : (
              <Icon name="person" size={24} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.reviewerDetails}>
            <Text style={styles.reviewerName}>{item.buyer?.full_name || 'Anonymous'}</Text>
            <Text style={styles.reviewDate}>
              {new Date(item.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                name={star <= item.overall_rating ? 'star' : 'star-outline'}
                size={14}
                color="#FFD700"
              />
            ))}
          </View>
          <Text style={styles.ratingNumber}>{item.overall_rating}/5</Text>
        </View>
      </View>

      {item.review_title && (
        <Text style={styles.reviewTitle}>{item.review_title}</Text>
      )}

      {item.comment && (
        <Text style={styles.reviewComment}>{item.comment}</Text>
      )}

      {/* Show detailed ratings if available */}
      {(item.communication_rating || item.shipping_speed_rating || item.product_quality_rating) && (
        <View style={styles.detailedRatingsBadges}>
          {item.communication_rating && (
            <View style={styles.ratingBadge}>
              <Icon name="chatbubbles" size={12} color="#4CAF50" />
              <Text style={styles.ratingBadgeText}>Communication {item.communication_rating}/5</Text>
            </View>
          )}
          {item.shipping_speed_rating && (
            <View style={styles.ratingBadge}>
              <Icon name="rocket" size={12} color="#2196F3" />
              <Text style={styles.ratingBadgeText}>Shipping {item.shipping_speed_rating}/5</Text>
            </View>
          )}
          {item.product_quality_rating && (
            <View style={styles.ratingBadge}>
              <Icon name="ribbon" size={12} color="#FF8B47" />
              <Text style={styles.ratingBadgeText}>Quality {item.product_quality_rating}/5</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="chatbubble-ellipses-outline" size={64} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Reviews Yet</Text>
      <Text style={styles.emptySubtitle}>
        This shop hasn't received any reviews yet.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#FF8B47" />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8B47" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{shopName || 'Shop'} Reviews</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Reviews List */}
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadReviews(true)}
            colors={['#FF8B47']}
            tintColor="#FF8B47"
          />
        }
        onEndReached={() => {
          if (hasMore && !loadingMore) {
            loadReviews(false, true);
          }
        }}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
}
