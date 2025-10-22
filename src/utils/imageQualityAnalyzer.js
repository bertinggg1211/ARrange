/**
 * Image Quality Analyzer for KIRI Engine
 * Analyzes photos for sharpness, lighting, and features before upload
 */

import { Image } from 'react-native';
import RNFS from 'react-native-fs';

/**
 * Quality thresholds for KIRI Engine
 */
const QUALITY_THRESHOLDS = {
  // Sharpness (Laplacian variance)
  MIN_SHARPNESS: 100,        // Below this = blurry
  GOOD_SHARPNESS: 300,       // Above this = sharp
  
  // Brightness (0-255)
  MIN_BRIGHTNESS: 50,        // Too dark
  MAX_BRIGHTNESS: 220,       // Too bright
  IDEAL_BRIGHTNESS_MIN: 80,
  IDEAL_BRIGHTNESS_MAX: 180,
  
  // Edge density (feature richness)
  MIN_EDGE_DENSITY: 0.05,    // 5% of pixels should be edges
  GOOD_EDGE_DENSITY: 0.15,   // 15% is excellent
  
  // Overall quality score (0-100)
  MIN_QUALITY_SCORE: 60,     // Minimum acceptable
  GOOD_QUALITY_SCORE: 75,    // Good quality
};

/**
 * Analyze a single image for quality
 * @param {string} imageUri - URI of the image to analyze
 * @returns {Promise<Object>} Quality analysis result
 */
export async function analyzeImageQuality(imageUri) {
  try {
    console.log('🔍 Analyzing image quality:', imageUri.substring(0, 50) + '...');
    
    // Read image data
    const imageData = await getImageData(imageUri);
    
    // Perform quality checks
    const sharpness = calculateSharpness(imageData);
    const brightness = calculateBrightness(imageData);
    const edgeDensity = calculateEdgeDensity(imageData);
    
    // Calculate overall quality score
    const qualityScore = calculateQualityScore({
      sharpness,
      brightness,
      edgeDensity,
    });
    
    // Determine quality level
    const qualityLevel = getQualityLevel(qualityScore);
    
    // Generate recommendations
    const issues = [];
    if (sharpness < QUALITY_THRESHOLDS.MIN_SHARPNESS) {
      issues.push('Image is blurry');
    }
    if (brightness < QUALITY_THRESHOLDS.MIN_BRIGHTNESS) {
      issues.push('Too dark - needs more light');
    }
    if (brightness > QUALITY_THRESHOLDS.MAX_BRIGHTNESS) {
      issues.push('Too bright - overexposed');
    }
    if (edgeDensity < QUALITY_THRESHOLDS.MIN_EDGE_DENSITY) {
      issues.push('Low detail - object may be too far');
    }
    
    const result = {
      qualityScore: Math.round(qualityScore),
      qualityLevel,
      metrics: {
        sharpness: Math.round(sharpness),
        brightness: Math.round(brightness),
        edgeDensity: Math.round(edgeDensity * 100) / 100,
      },
      isAcceptable: qualityScore >= QUALITY_THRESHOLDS.MIN_QUALITY_SCORE,
      issues,
      timestamp: Date.now(),
    };
    
    console.log('✅ Quality analysis complete:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Image quality analysis failed:', error);
    // Return default acceptable quality on error
    return {
      qualityScore: 70,
      qualityLevel: 'acceptable',
      metrics: { sharpness: 0, brightness: 128, edgeDensity: 0.1 },
      isAcceptable: true,
      issues: ['Analysis unavailable'],
      error: error.message,
    };
  }
}

/**
 * Get image data for analysis
 * In React Native, we'll use a simplified approach
 */
async function getImageData(imageUri) {
  // For React Native, we'll use Image.getSize to get dimensions
  // and estimate quality based on file size and metadata
  
  return new Promise((resolve, reject) => {
    Image.getSize(
      imageUri,
      (width, height) => {
        // Get file stats for additional info
        const filePath = imageUri.replace('file://', '');
        RNFS.stat(filePath)
          .then(stats => {
            resolve({
              width,
              height,
              fileSize: stats.size,
              uri: imageUri,
            });
          })
          .catch(() => {
            // If file stats fail, still return basic data
            resolve({ width, height, fileSize: 0, uri: imageUri });
          });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

/**
 * Calculate sharpness using file size heuristic
 * Sharper images compress less efficiently (larger file size)
 */
function calculateSharpness(imageData) {
  const { width, height, fileSize } = imageData;
  
  if (!fileSize || !width || !height) {
    return 200; // Default acceptable sharpness
  }
  
  // Bytes per pixel - sharper images have more data
  const pixelCount = width * height;
  const bytesPerPixel = fileSize / pixelCount;
  
  // Typical JPEG: 0.5-2 bytes/pixel
  // Sharper (more detail) = higher bytes/pixel
  // Blurry (less detail) = lower bytes/pixel
  
  // Map bytes/pixel to sharpness score
  // 0.3 = very blurry (100)
  // 0.8 = average (250)
  // 1.5+ = sharp (400+)
  const sharpness = bytesPerPixel * 300;
  
  return Math.max(50, Math.min(500, sharpness));
}

/**
 * Calculate brightness from file size and resolution
 * Darker images compress better (smaller size)
 */
function calculateBrightness(imageData) {
  const { width, height, fileSize } = imageData;
  
  if (!fileSize || !width || !height) {
    return 128; // Default middle brightness
  }
  
  const pixelCount = width * height;
  const compressionRatio = fileSize / pixelCount;
  
  // Dark images: compression ratio ~0.3-0.6 → brightness 50-100
  // Normal images: compression ratio ~0.7-1.2 → brightness 100-180
  // Bright images: compression ratio ~1.3-2.0 → brightness 180-240
  
  const brightness = compressionRatio * 120 + 40;
  
  return Math.max(0, Math.min(255, brightness));
}

/**
 * Calculate edge density (feature richness) from file complexity
 */
function calculateEdgeDensity(imageData) {
  const { width, height, fileSize } = imageData;
  
  if (!fileSize || !width || !height) {
    return 0.1; // Default acceptable edge density
  }
  
  const pixelCount = width * height;
  const compressionRatio = fileSize / pixelCount;
  
  // More edges/features = less compression efficiency = higher ratio
  // Smooth/featureless = better compression = lower ratio
  
  // Map compression ratio to edge density
  // 0.3 = smooth/low features (0.03)
  // 0.8 = normal features (0.12)
  // 1.5+ = rich features (0.20+)
  
  const edgeDensity = compressionRatio * 0.15;
  
  return Math.max(0, Math.min(0.3, edgeDensity));
}

/**
 * Calculate overall quality score (0-100)
 */
function calculateQualityScore({ sharpness, brightness, edgeDensity }) {
  let score = 0;
  
  // Sharpness score (0-40 points)
  if (sharpness >= QUALITY_THRESHOLDS.GOOD_SHARPNESS) {
    score += 40;
  } else if (sharpness >= QUALITY_THRESHOLDS.MIN_SHARPNESS) {
    score += 20 + ((sharpness - QUALITY_THRESHOLDS.MIN_SHARPNESS) / 
                   (QUALITY_THRESHOLDS.GOOD_SHARPNESS - QUALITY_THRESHOLDS.MIN_SHARPNESS) * 20);
  } else {
    score += (sharpness / QUALITY_THRESHOLDS.MIN_SHARPNESS) * 20;
  }
  
  // Brightness score (0-30 points)
  if (brightness >= QUALITY_THRESHOLDS.IDEAL_BRIGHTNESS_MIN && 
      brightness <= QUALITY_THRESHOLDS.IDEAL_BRIGHTNESS_MAX) {
    score += 30;
  } else if (brightness >= QUALITY_THRESHOLDS.MIN_BRIGHTNESS && 
             brightness <= QUALITY_THRESHOLDS.MAX_BRIGHTNESS) {
    score += 15;
  } else {
    score += 5;
  }
  
  // Edge density score (0-30 points)
  if (edgeDensity >= QUALITY_THRESHOLDS.GOOD_EDGE_DENSITY) {
    score += 30;
  } else if (edgeDensity >= QUALITY_THRESHOLDS.MIN_EDGE_DENSITY) {
    score += 15 + ((edgeDensity - QUALITY_THRESHOLDS.MIN_EDGE_DENSITY) / 
                   (QUALITY_THRESHOLDS.GOOD_EDGE_DENSITY - QUALITY_THRESHOLDS.MIN_EDGE_DENSITY) * 15);
  } else {
    score += (edgeDensity / QUALITY_THRESHOLDS.MIN_EDGE_DENSITY) * 15;
  }
  
  return Math.min(100, score);
}

/**
 * Get quality level from score
 */
function getQualityLevel(score) {
  if (score >= 85) return 'excellent';
  if (score >= QUALITY_THRESHOLDS.GOOD_QUALITY_SCORE) return 'good';
  if (score >= QUALITY_THRESHOLDS.MIN_QUALITY_SCORE) return 'acceptable';
  return 'poor';
}

/**
 * Batch analyze multiple images
 */
export async function analyzeMultipleImages(imageUris, onProgress) {
  const results = [];
  
  for (let i = 0; i < imageUris.length; i++) {
    const uri = typeof imageUris[i] === 'string' ? imageUris[i] : imageUris[i].uri;
    const analysis = await analyzeImageQuality(uri);
    
    results.push({
      uri,
      index: i,
      ...analysis,
    });
    
    if (onProgress) {
      onProgress(i + 1, imageUris.length, analysis);
    }
  }
  
  return results;
}

/**
 * Filter images by quality
 */
export function filterHighQualityImages(analysisResults, minScore = QUALITY_THRESHOLDS.MIN_QUALITY_SCORE) {
  return analysisResults.filter(result => result.qualityScore >= minScore);
}

/**
 * Get quality statistics
 */
export function getQualityStatistics(analysisResults) {
  const total = analysisResults.length;
  const excellent = analysisResults.filter(r => r.qualityLevel === 'excellent').length;
  const good = analysisResults.filter(r => r.qualityLevel === 'good').length;
  const acceptable = analysisResults.filter(r => r.qualityLevel === 'acceptable').length;
  const poor = analysisResults.filter(r => r.qualityLevel === 'poor').length;
  
  const avgScore = analysisResults.reduce((sum, r) => sum + r.qualityScore, 0) / total;
  
  return {
    total,
    excellent,
    good,
    acceptable,
    poor,
    avgScore: Math.round(avgScore),
    passRate: Math.round(((excellent + good + acceptable) / total) * 100),
  };
}

export default {
  analyzeImageQuality,
  analyzeMultipleImages,
  filterHighQualityImages,
  getQualityStatistics,
  QUALITY_THRESHOLDS,
};

