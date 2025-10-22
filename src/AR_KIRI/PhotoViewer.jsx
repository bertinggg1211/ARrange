import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { kiriEngineApi } from '../api/kiriEngineApi';
import { analyzeMultipleImages, getQualityStatistics } from '../utils/imageQualityAnalyzer';
import styles from './styles/PhotoViewer.style';

const PhotoViewer = ({ route, navigation }) => {
  const { photos: initialPhotos, productId, productName } = route.params || {};
  
  const [photos, setPhotos] = useState(initialPhotos || []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [qualityAnalysis, setQualityAnalysis] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [qualityStats, setQualityStats] = useState(null);

  // Analyze photo quality on mount
  useEffect(() => {
    analyzePhotos();
  }, []);

  const analyzePhotos = async () => {
    console.log('🔍 Starting quality analysis for', photos.length, 'photos...');
    setIsAnalyzing(true);
    
    try {
      const results = await analyzeMultipleImages(
        photos,
        (current, total, analysis) => {
          console.log(`📊 Analyzed ${current}/${total}: Score ${analysis.qualityScore}`);
        }
      );
      
      setQualityAnalysis(results);
      
      const stats = getQualityStatistics(results);
      setQualityStats(stats);
      
      console.log('✅ Quality analysis complete:', stats);
      
      // Auto-remove poor quality photos if too many poor ones
      const poorPhotos = results.filter(r => r.qualityLevel === 'poor');
      if (poorPhotos.length > 0 && poorPhotos.length < 5) {
        Alert.alert(
          '⚠️ Poor Quality Photos Detected',
          `Found ${poorPhotos.length} low-quality photo(s) that may cause KIRI Engine errors.\n\nIssues found:\n${poorPhotos.map(p => `• Photo ${p.index + 1}: ${p.issues.join(', ')}`).join('\n')}\n\nWould you like to remove them automatically?`,
          [
            { text: 'Keep All', style: 'cancel' },
            {
              text: 'Remove Poor Quality',
              onPress: () => {
                const poorIndices = poorPhotos.map(p => p.index);
                const filteredPhotos = photos.filter((_, i) => !poorIndices.includes(i));
                setPhotos(filteredPhotos);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Quality analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPhotoQuality = (index) => {
    return qualityAnalysis?.find(a => a.index === index) || null;
  };

  const getQualityColor = (quality) => {
    if (!quality) return '#999';
    if (quality.qualityLevel === 'excellent') return '#10B981';
    if (quality.qualityLevel === 'good') return '#3B82F6';
    if (quality.qualityLevel === 'acceptable') return '#F59E0B';
    return '#EF4444';
  };

  const getQualityIcon = (quality) => {
    if (!quality) return 'help-circle';
    if (quality.qualityLevel === 'excellent') return 'checkmark-circle';
    if (quality.qualityLevel === 'good') return 'checkmark-circle-outline';
    if (quality.qualityLevel === 'acceptable') return 'warning-outline';
    return 'close-circle';
  };

  const handleDeletePhoto = (index) => {
    Alert.alert(
      'Delete Photo',
      `Remove photo ${index + 1}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newPhotos = photos.filter((_, i) => i !== index);
            setPhotos(newPhotos);
            
            if (newPhotos.length < 20) {
              Alert.alert(
                'Warning ⚠️',
                `Only ${newPhotos.length} photos remaining.\n\nKIRI Engine requires at least 20 photos for 3D reconstruction.\n\nYou need ${20 - newPhotos.length} more photo(s).`,
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleUploadToKiri = async () => {
    if (photos.length < 20) {
      Alert.alert(
        'Insufficient Photos',
        `You have ${photos.length} photos, but KIRI Engine requires at least 20 photos.\n\nPlease retake the scan or go back and capture more photos.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retake Scan', onPress: () => navigation.goBack() },
        ]
      );
      return;
    }

    Alert.alert(
      'Upload to KIRI Engine',
      `Ready to upload ${photos.length} photos to KIRI Engine for 3D model generation.\n\nThis will create a professional 3D model and upload it to Cloudinary.\n\nContinue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload & Process',
          onPress: async () => {
            setIsProcessing(true);
            
            try {
              console.log('🚀 Starting KIRI Engine processing from PhotoViewer...');
              console.log(`📸 Uploading ${photos.length} validated photos...`);
              
              const scanResult = await kiriEngineApi.createScan(
                photos.map(photo => photo.uri || photo),
                productName,
                'photogrammetry'
              );
              
              console.log('✅ KIRI Engine processing completed:', scanResult);
              
              Alert.alert(
                '🎉 3D Model Created!',
                `Your ${productName || 'product'} has been successfully converted to a 3D model!\n\n📊 Details:\n• ${photos.length} photos processed\n• GLB model generated\n• Uploaded to Cloudinary\n• File size: ${scanResult.fileSize || 'Unknown'}\n• Quality: Professional (Photo Scan + No 3DGS + Featureless)\n• Engine: Photo Scan (Featureless)\n\nWould you like to preview your 3D model?`,
                [
                  {
                    text: 'Done',
                    onPress: () => {
                      // Navigate back to seller screen with scan data
                      navigation.navigate('SellerRoot', {
                        screen: 'Home',
                        params: {
                          scanComplete: true,
                          scanData: scanResult,
                          productId,
                        },
                      });
                    },
                  },
                  {
                    text: 'Preview AR',
                    onPress: () => {
                      navigation.navigate('ARViewer', {
                        productId,
                        productName,
                        arModelUrl: scanResult.glbUrl,
                        scanData: scanResult,
                      });
                    },
                  },
                ]
              );
              
            } catch (error) {
              console.error('❌ KIRI Engine processing error:', error);
              
              Alert.alert(
                '❌ Upload Failed',
                `Failed to process photos with KIRI Engine:\n\n${error.message}\n\n💡 Common causes:\n• Poor photo quality\n• Blurry images\n• Insufficient lighting\n• Network connection issues\n\nPlease review your photos and try again.`,
                [
                  { text: 'OK' },
                  { text: 'Retake Photos', onPress: () => navigation.goBack() },
                ]
              );
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleViewPhoto = (photo, index) => {
    setSelectedPhoto({ photo, index });
  };

  const closePhotoView = () => {
    setSelectedPhoto(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Review Photos</Text>
          <Text style={styles.headerSubtitle}>{productName || 'Product'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Photo Count & Quality Banner */}
      <View style={[
        styles.photoBanner,
        photos.length >= 20 ? styles.photoBannerSuccess : styles.photoBannerWarning
      ]}>
        <Icon 
          name={photos.length >= 20 ? 'checkmark-circle' : 'warning'} 
          size={20} 
          color={photos.length >= 20 ? '#10B981' : '#F59E0B'} 
        />
        <Text style={styles.photoBannerText}>
          {photos.length} photos {photos.length >= 20 ? '(Ready to upload)' : `(Need ${20 - photos.length} more)`}
        </Text>
      </View>

      {/* Quality Analysis Results */}
      {isAnalyzing ? (
        <View style={styles.qualityBanner}>
          <ActivityIndicator size="small" color="#FF6B47" />
          <Text style={styles.qualityBannerText}>Analyzing photo quality...</Text>
        </View>
      ) : qualityStats ? (
        <View style={styles.qualityBanner}>
          <View style={styles.qualityStats}>
            <View style={styles.qualityStat}>
              <Icon name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.qualityStatText}>{qualityStats.excellent + qualityStats.good} Good</Text>
            </View>
            <View style={styles.qualityStat}>
              <Icon name="warning" size={16} color="#F59E0B" />
              <Text style={styles.qualityStatText}>{qualityStats.acceptable} OK</Text>
            </View>
            {qualityStats.poor > 0 && (
              <View style={styles.qualityStat}>
                <Icon name="close-circle" size={16} color="#EF4444" />
                <Text style={styles.qualityStatText}>{qualityStats.poor} Poor</Text>
              </View>
            )}
            <View style={styles.qualityStat}>
              <Text style={styles.avgScoreText}>Avg: {qualityStats.avgScore}/100</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📸 Review Your Photos</Text>
        <Text style={styles.instructionsText}>
          • Tap a photo to view it full size{'\n'}
          • Tap the ❌ icon to delete blurry photos{'\n'}
          • Keep at least 20 sharp, clear photos{'\n'}
          • Upload when ready to create 3D model
        </Text>
      </View>

      {/* Photo Grid */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => {
            const quality = getPhotoQuality(index);
            const qualityColor = getQualityColor(quality);
            const qualityIcon = getQualityIcon(quality);
            
            return (
              <View key={index} style={[
                styles.photoItem,
                quality && quality.qualityLevel === 'poor' && styles.photoItemPoor
              ].filter(Boolean)}>
                <TouchableOpacity 
                  onPress={() => handleViewPhoto(photo, index)}
                  style={styles.photoTouchable}
                >
                  <Image 
                    source={{ uri: photo.uri || photo }} 
                    style={styles.photoThumbnail}
                    resizeMode="cover"
                  />
                  
                  {/* Quality Overlay for Poor Photos */}
                  {quality && quality.qualityLevel === 'poor' && (
                    <View style={styles.poorQualityOverlay}>
                      <Icon name="warning" size={32} color="#FFF" />
                      <Text style={styles.poorQualityText}>Poor Quality</Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(index)}
                >
                  <Icon name="close-circle" size={28} color="#FF4444" />
                </TouchableOpacity>
                
                <View style={styles.photoNumberBadge}>
                  <Text style={styles.photoNumberText}>{index + 1}</Text>
                </View>
                
                {/* Quality Badge */}
                {quality && qualityColor && (
                  <View style={[styles.qualityBadge, { backgroundColor: qualityColor }].filter(Boolean)}>
                    <Icon name={qualityIcon} size={14} color="#FFF" />
                    <Text style={styles.qualityBadgeText}>{quality.qualityScore}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.retakeButton}
          onPress={() => {
            Alert.alert(
              'Retake All Photos',
              'This will discard all current photos. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Retake', style: 'destructive', onPress: () => navigation.goBack() },
              ]
            );
          }}
        >
          <Icon name="camera-outline" size={24} color="#666" />
          <Text style={styles.retakeButtonText}>Retake All</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.uploadButton,
            (photos.length < 20 || isProcessing) && styles.uploadButtonDisabled
          ]}
          onPress={handleUploadToKiri}
          disabled={photos.length < 20 || isProcessing}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.uploadButtonText}>Processing...</Text>
            </>
          ) : (
            <>
              <Icon name="cloud-upload-outline" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>
                Upload to KIRI Engine
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Full Photo View Modal */}
      {selectedPhoto && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={closePhotoView}
            >
              <Icon name="close" size={30} color="#fff" />
            </TouchableOpacity>
            
            <Image 
              source={{ uri: selectedPhoto.photo.uri || selectedPhoto.photo }} 
              style={styles.fullPhoto}
              resizeMode="contain"
            />
            
            <View style={styles.modalInfo}>
              <Text style={styles.modalPhotoNumber}>
                Photo {selectedPhoto.index + 1} of {photos.length}
              </Text>
              <TouchableOpacity 
                style={styles.modalDeleteButton}
                onPress={() => {
                  handleDeletePhoto(selectedPhoto.index);
                  closePhotoView();
                }}
              >
                <Icon name="trash-outline" size={20} color="#fff" />
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default PhotoViewer;

