import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { submitShopReview } from '../api/reviewApi';

export default function ShopReviewModal({ 
  visible, 
  onClose, 
  shopData, 
  orderId,
  onReviewSubmitted 
}) {
  const [overallRating, setOverallRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [shippingSpeedRating, setShippingSpeedRating] = useState(0);
  const [productQualityRating, setProductQualityRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert('Rating Required', 'Please select an overall rating for this shop.');
      return;
    }

    try {
      setSubmitting(true);
      console.log('📝 Submitting shop review:', { 
        sellerId: shopData.shopId, 
        orderId, 
        overallRating 
      });

      const response = await submitShopReview(
        shopData.shopId,
        orderId,
        overallRating,
        communicationRating || null,
        shippingSpeedRating || null,
        productQualityRating || null,
        comment.trim() || null,
        reviewTitle.trim() || null
      );

      if (response.success) {
        Alert.alert(
          'Review Submitted! ⭐',
          'Thank you for rating our shop! Your feedback helps us improve.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setOverallRating(0);
                setCommunicationRating(0);
                setShippingSpeedRating(0);
                setProductQualityRating(0);
                setReviewTitle('');
                setComment('');
                
                // Notify parent
                if (onReviewSubmitted) {
                  onReviewSubmitted(response.review);
                }
                
                // Close modal
                onClose();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error submitting shop review:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'Unable to submit review. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (currentRating, setRating, label, icon, color) => {
    return (
      <View style={styles.ratingRow}>
        <View style={styles.ratingLabelContainer}>
          <Icon name={icon} size={20} color={color} />
          <Text style={styles.ratingLabel}>{label}</Text>
        </View>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
              disabled={submitting}
            >
              <Icon
                name={star <= currentRating ? 'star' : 'star-outline'}
                size={24}
                color={star <= currentRating ? '#FFD700' : '#E0E0E0'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const getRatingText = (rating) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Icon name="storefront" size={24} color="#FF8B47" />
              <Text style={styles.headerTitle}>Rate Shop</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              disabled={submitting}
            >
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Shop Info */}
            <View style={styles.shopCard}>
              {shopData?.shopLogo ? (
                <Image 
                  source={{ uri: shopData.shopLogo }} 
                  style={styles.shopLogo}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.shopLogoPlaceholder}>
                  <Icon name="storefront" size={32} color="#FF8B47" />
                </View>
              )}
              <View style={styles.shopInfo}>
                <Text style={styles.shopName} numberOfLines={2}>
                  {shopData?.shopName || 'Shop'}
                </Text>
              </View>
            </View>

            {/* Overall Rating - REQUIRED */}
            <View style={styles.overallRatingSection}>
              <Text style={styles.sectionTitle}>
                Overall Rating <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.overallStarsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setOverallRating(star)}
                    style={styles.overallStarButton}
                    disabled={submitting}
                  >
                    <Icon
                      name={star <= overallRating ? 'star' : 'star-outline'}
                      size={40}
                      color={star <= overallRating ? '#FFD700' : '#E0E0E0'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingText}>
                {overallRating > 0 ? getRatingText(overallRating) : 'Tap to rate'}
              </Text>
            </View>

            {/* Detailed Ratings - OPTIONAL */}
            <View style={styles.detailedRatingsSection}>
              <Text style={styles.sectionTitle}>
                Detailed Ratings <Text style={styles.optional}>(Optional)</Text>
              </Text>
              
              {renderStars(
                communicationRating,
                setCommunicationRating,
                'Communication',
                'chatbubbles',
                '#4CAF50'
              )}
              
              {renderStars(
                shippingSpeedRating,
                setShippingSpeedRating,
                'Shipping Speed',
                'rocket',
                '#2196F3'
              )}
              
              {renderStars(
                productQualityRating,
                setProductQualityRating,
                'Product Quality',
                'ribbon',
                '#FF8B47'
              )}
            </View>

            {/* Review Title (Optional) */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                Review Title <Text style={styles.optional}>(Optional)</Text>
              </Text>
              <TextInput
                style={styles.titleInput}
                placeholder="e.g., Excellent service and quality!"
                value={reviewTitle}
                onChangeText={setReviewTitle}
                maxLength={100}
                editable={!submitting}
              />
            </View>

            {/* Comment Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                Your Review <Text style={styles.optional}>(Optional)</Text>
              </Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your experience with this shop..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={500}
                editable={!submitting}
              />
              <Text style={styles.characterCount}>
                {comment.length}/500
              </Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (overallRating === 0 || submitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={overallRating === 0 || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  shopCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  shopLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
  },
  shopLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFE8D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  overallRatingSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  required: {
    color: '#FF3B30',
  },
  optional: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999',
  },
  overallStarsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  overallStarButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8B47',
  },
  detailedRatingsSection: {
    marginBottom: 24,
  },
  ratingRow: {
    marginBottom: 16,
  },
  ratingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    padding: 4,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#FF8B47',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
