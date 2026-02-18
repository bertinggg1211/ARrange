// Reusable Product Rating Badge Component
// Shows star rating for products in listings

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function ProductRatingBadge({ rating, reviewCount, size = 'small', style }) {
  // Don't show badge if no rating
  if (!rating || rating === 0) {
    return null;
  }

  const isLarge = size === 'large';
  const starSize = isLarge ? 16 : 12;
  const fontSize = isLarge ? 14 : 11;

  return (
    <View style={[styles.container, isLarge && styles.containerLarge, style]}>
      <Icon name="star" size={starSize} color="#FFD700" />
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  containerLarge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 3,
  },
  ratingTextLarge: {
    fontSize: 14,
    marginLeft: 4,
  },
  countText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
    marginLeft: 2,
  },
  countTextLarge: {
    fontSize: 12,
    marginLeft: 3,
  },
});
