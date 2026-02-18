// Reusable Shop Rating Badge Component
// Shows star rating for shops

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function ShopRatingBadge({ rating, reviewCount, size = 'small', style, showStars = false }) {
  // Show "New" badge if no rating
  if (!rating || rating === 0) {
    return (
      <View style={[styles.newBadge, style]}>
        <Icon name="flash" size={10} color="#FF8B47" />
        <Text style={styles.newText}>New</Text>
      </View>
    );
  }

  const isLarge = size === 'large';
  const starSize = isLarge ? 14 : 11;
  const fontSize = isLarge ? 13 : 10;

  return (
    <View style={[styles.container, isLarge && styles.containerLarge, style]}>
      {showStars && (
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Icon
              key={star}
              name={star <= Math.round(rating) ? 'star' : 'star-outline'}
              size={starSize}
              color={star <= Math.round(rating) ? '#FFD700' : '#E0E0E0'}
            />
          ))}
        </View>
      )}
      {!showStars && <Icon name="star" size={starSize} color="#FFD700" />}
      <Text style={[styles.ratingText, isLarge && styles.ratingTextLarge]}>
        {rating.toFixed(1)}
      </Text>
      {reviewCount > 0 && (
        <Text style={[styles.countText, isLarge && styles.countTextLarge]}>
          ({reviewCount})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  containerLarge: {
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  ratingTextLarge: {
    fontSize: 13,
  },
  countText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#666',
  },
  countTextLarge: {
    fontSize: 11,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8D9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  newText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FF8B47',
  },
});
