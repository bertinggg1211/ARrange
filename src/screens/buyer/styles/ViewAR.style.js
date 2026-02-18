import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// App theme colors
const Colors = {
  primary: '#1A1A1A',
  secondary: '#FF8B47',        // Warm Orange
  secondaryLight: '#FFB380',   // Light Orange
  background: '#FFFFFF',
  surface: '#FAFAFA',
  text: '#1A1A1A',
  textSecondary: '#666666',
  success: '#4CAF50',
  shadow: 'rgba(0, 0, 0, 0.08)',
};

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface, // Light background instead of black
  },
  
  // Camera Styles
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  // Model Container
  modelContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    // Performance optimizations for 60fps
    elevation: 0,
  },
  modelViewer: {
    flex: 1,
    backgroundColor: 'transparent',
    // Performance optimizations for 60fps
    elevation: 0,
    shadowOpacity: 0,
  },
  modelLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modelLoadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  
  // Overlay Styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  
  // Header Styles
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: Colors.background, // White background
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.secondary, // Orange border
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitleText: {
    color: Colors.text, // Dark text
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: Colors.textSecondary, // Gray text
    fontSize: 12,
    marginTop: 0,
    maxWidth: '100%',
    textAlign: 'center',
  },
  
  // Button Styles
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary, // Orange button
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondaryLight, // Light orange
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondaryLight, // Light orange
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Placeholder Indicator
  placeholderIndicator: {
    alignItems: 'center',
    marginTop: 10,
  },
  placeholderText: {
    color: Colors.background, // White text
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: Colors.secondary, // Orange background
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Camera Container
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  
  // Placeholder Container
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 139, 71, 0.3)',
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  placeholderDescription: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  placeholderFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Loading Container
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 5,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  
  // Error Container
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: Colors.surface, // Light background
  },
  errorTitle: {
    color: Colors.text, // Dark text
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    color: Colors.textSecondary, // Gray text
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: Colors.secondary, // Orange button
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  retryButtonText: {
    color: Colors.background, // White text
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Instructions Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    maxWidth: width * 0.9,
    maxHeight: height * 0.8,
  },
  instructionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContent: {
    marginBottom: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  instructionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 15,
    flex: 1,
  },
  gotItButton: {
    backgroundColor: Colors.secondary, // Orange button
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  gotItButtonText: {
    color: Colors.background, // White text
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Model Indicator (for when AR is ready)
  modelIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success, // Green background for ready state
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modelText: {
    color: Colors.background, // White text
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // Model Controls (zoom, rotate buttons)
  modelControls: {
    flexDirection: 'row',
    gap: 15,
  },
  controlButton: {
    backgroundColor: Colors.secondary, // Orange button
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // WebView for 3D model
  modelWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
