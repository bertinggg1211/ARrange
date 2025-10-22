import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { BASE_URL } from '../../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './styles/Reviews.style';

const { width } = Dimensions.get('window');

export default function Reviews({ navigation }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, 5-star, 4-star, 3-star, 2-star, 1-star
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  // Load reviews data
  const loadReviews = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      if (isRefresh) setRefreshing(true);

      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${BASE_URL}/api/seller/reviews`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReviews(data.reviews || []);
          setStats(data.stats || stats);
        }
      } else {
        Alert.alert('Error', 'Failed to load reviews');
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleRefresh = () => {
    loadReviews(true);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const getFilteredReviews = () => {
    if (filter === 'all') return reviews;
    const rating = parseInt(filter);
    return reviews.filter(review => review.rating === rating);
  };

  const renderRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Icon
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={16}
        color="#FFD700"
      />
    ));
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <View style={styles.reviewerAvatar}>
            {item.buyerAvatar ? (
              <Image 
                source={{ uri: item.buyerAvatar }} 
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Icon name="person" size={20} color="#666" />
            )}
          </View>
          <View style={styles.reviewerDetails}>
            <Text style={styles.reviewerName}>{item.buyerName}</Text>
            <View style={styles.ratingContainer}>
              {renderRatingStars(item.rating)}
              <Text style={styles.ratingText}>{item.rating}.0</Text>
            </View>
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.reviewText}>{item.comment}</Text>
      
      {item.productName && (
        <View style={styles.productInfo}>
          <Text style={styles.productLabel}>Product:</Text>
          <Text style={styles.productName}>{item.productName}</Text>
        </View>
      )}
    </View>
  );

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'all', label: 'All', count: stats.totalReviews },
          { key: '5', label: '5★', count: stats.ratingDistribution[5] },
          { key: '4', label: '4★', count: stats.ratingDistribution[4] },
          { key: '3', label: '3★', count: stats.ratingDistribution[3] },
          { key: '2', label: '2★', count: stats.ratingDistribution[2] },
          { key: '1', label: '1★', count: stats.ratingDistribution[1] }
        ].map((filterOption) => (
          <TouchableOpacity
            key={filterOption.key}
            style={[
              styles.filterChip,
              filter === filterOption.key && styles.activeFilterChip
            ]}
            onPress={() => handleFilterChange(filterOption.key)}
          >
            <Text style={[
              styles.filterChipText,
              filter === filterOption.key && styles.activeFilterChipText
            ]}>
              {filterOption.label} ({filterOption.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStatsHeader = () => (
    <View style={styles.statsHeader}>
      <View style={styles.ratingOverview}>
        <View style={styles.ratingDisplay}>
          <Text style={styles.averageRating}>{stats.averageRating.toFixed(1)}</Text>
          <View style={styles.ratingStars}>
            {renderRatingStars(Math.round(stats.averageRating))}
          </View>
          <Text style={styles.totalReviews}>{stats.totalReviews} reviews</Text>
        </View>
      </View>
      
      <View style={styles.ratingBreakdown}>
        {[5, 4, 3, 2, 1].map((rating) => (
          <View key={rating} style={styles.ratingBar}>
            <Text style={styles.ratingLabel}>{rating}★</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(stats.ratingDistribution[rating] / stats.totalReviews) * 100}%` 
                  }
                ]}
              />
            </View>
            <Text style={styles.ratingCount}>{stats.ratingDistribution[rating]}</Text>
          </View>
        ))}
      </View>
    </View>
  );

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
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews & Ratings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats Header */}
      {renderStatsHeader()}

      {/* Filter Chips */}
      {renderFilterChips()}

      {/* Reviews List */}
      <FlatList
        data={getFilteredReviews()}
        keyExtractor={(item) => item.id}
        renderItem={renderReviewItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF8B47']}
          />
        }
        contentContainerStyle={styles.reviewsList}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="star-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptySubtitle}>
              Reviews from customers will appear here
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
