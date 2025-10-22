// src/screens/buyer/styles/ProductDetail.style.js
import { StyleSheet, Dimensions } from "react-native";
import ThemeColors from '../../../theme/colors';

const { Colors, Theme } = ThemeColors;

const { width } = Dimensions.get("window");

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mainScrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Space for bottom action bar
  },
  mainContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 35,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    minHeight: '100%',
  },
  imageSection: {
    paddingHorizontal: 10,
    marginBottom: 0,
  },
  overlayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E0E0',
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: "center",
    alignItems: "center",
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E0E0',
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 350,
    backgroundColor: '#F8F8F8',
    borderRadius: 30,
    overflow: 'hidden',
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productInfoOverlay: {
    position: "absolute",
    bottom: 20,
    left: 16,
    zIndex: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 12,
    lineHeight: 26,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginLeft: 4,
  },
  thumbnailContainer: {
    position: "absolute",
    right: 16,
    top: '50%',
    transform: [{ translateY: -90 }], // Adjusted to center better
    height: 180, // Height to show exactly 3 thumbnails (50px + 10px margin each = 60px * 3 = 180px)
    width: 56, // Slightly wider to accommodate borders
    zIndex: 5,
  },
  thumbnailScrollView: {
    flex: 1,
  },
  thumbnailScrollContent: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  scrollIndicatorTop: {
    position: 'absolute',
    top: -2,
    right: 0,
    left: 0,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  scrollIndicatorBottom: {
    position: 'absolute',
    bottom: -2,
    right: 0,
    left: 0,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  imageNavButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.primary + '80',
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    ...Theme.shadow.medium,
  },
  leftNavButton: {
    left: Theme.spacing.xl,
  },
  rightNavButton: {
    right: Theme.spacing.xl,
  },
  thumbnailScroll: {
    paddingHorizontal: Theme.spacing.xl,
    marginTop: Theme.spacing.md,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  activeThumbnail: {
    borderColor: "#FFFFFF",
    borderWidth: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoBox: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xl,
    backgroundColor: Colors.surface,
    marginTop: 0,
    marginHorizontal: 0,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Theme.spacing.xs,
    lineHeight: 26,
  },
  price: {
    fontSize: 16,
    color: Colors.secondary,
    fontWeight: "600",
    marginBottom: Theme.spacing.lg,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  ratingText: {
    marginLeft: Theme.spacing.xs, 
    color: Colors.textSecondary,
    fontSize: Theme.fontSize.sm,
  },
  reviewCount: {
    marginLeft: Theme.spacing.sm,
    color: Colors.textMuted,
    fontSize: Theme.fontSize.sm,
  },
  
  avatarRow: {
    flexDirection: "row",
    marginLeft: Theme.spacing.md,
  },
  
  reviewAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.xl,
    backgroundColor: Colors.surface,
    paddingVertical: Theme.spacing.xl,
    marginHorizontal: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.medium,
    ...Theme.shadow.medium,
  },
  quantityLabel: {
    fontSize: Theme.fontSize.md,
    fontWeight: "500",
    color: Colors.text,
    marginRight: Theme.spacing.xl,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.small,
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityValue: {
    fontSize: Theme.fontSize.md,
    fontWeight: "500",
    paddingHorizontal: Theme.spacing.xl,
    color: Colors.text,
  },
  tabContainer: {
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  tab: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    marginRight: Theme.spacing.xl,
  },
  
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.secondary,
  },
  
  tabText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  
  activeTabText: {
    color: Colors.secondary,
    fontWeight: "600",
  },
  
  descriptionContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Theme.spacing.lg,
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  
  specsList: {
    paddingHorizontal: Theme.spacing.lg,
  },
  
  specItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  specLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  
  specValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: Theme.spacing.lg,
  },
  
  quantitySection: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  
  quantityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#FF8B47',
    borderRadius: 6,
  },
  
  quantityButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  
  quantityValue: {
    paddingHorizontal: Theme.spacing.lg,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    minWidth: 40,
    textAlign: "center",
  },
  
  quantityInfo: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  specsContainer: {
    backgroundColor: Colors.surface,
    padding: Theme.spacing.xl,
    marginHorizontal: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.medium,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadow.medium,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  specLabel: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
  },
  specValue: {
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    fontWeight: "500",
  },
  commentBox: {
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    marginHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
    borderRadius: Theme.borderRadius.medium,
    ...Theme.shadow.small,
  },
  commentHeader: {
    flexDirection: "row",
    marginBottom: Theme.spacing.sm,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.full,
    marginRight: Theme.spacing.md,
  },
  commentUser: {
    fontSize: Theme.fontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  commentRating: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  commentDate: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginLeft: Theme.spacing.sm,
  },
  commentText: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Theme.spacing.xs,
  },
  // Content Section
  contentSection: {
    flex: 1,
    paddingHorizontal: 0,
  },
  // Product Info Card
  productInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  priceInfo: {
    flex: 1,
  },
  price: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FF8B47",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  reviewCount: {
    fontSize: 14,
    color: "#FF8B47",
    fontWeight: "500",
    marginBottom: 16,
  },
  
  // Shop Section Inline (below reviews)
  shopSectionInline: {
    marginTop: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  priceActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cartPillButton: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cartPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Features Section
  featuresSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    marginBottom: 10,
  },
  featureItem: {
    alignItems: "center",
    flex: 1,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF5F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    fontWeight: "500",
  },
  
  // Tab Section
  tabSection: {
    paddingVertical: 20,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: "#FF8B47",
  },
  tabText: {
    fontSize: 14,
    color: "#999999",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FF8B47",
    fontWeight: "700",
    fontSize: 15,
  },
  tabContent: {
    paddingHorizontal: 0,
  },
  // Description Section
  descriptionSection: {
    paddingVertical: 0,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 22,
  },
  // Materials Section
  materialsSection: {
    paddingVertical: 0,
  },
  materialItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  materialLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  materialValue: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "600",
  },
  // Reviews Section
  reviewsSection: {
    paddingVertical: 0,
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0E0E0",
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewText: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: "#999999",
    marginTop: 2,
  },
  noReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noReviewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginTop: 12,
  },
  noReviewsSubtitle: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Shop Section
  shopSection: {
    paddingHorizontal: 17,
    paddingVertical: 1,
    marginTop: 0,
    marginBottom: 8,
  },
  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    width: '100%',
  },
  shopAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  shopInfo: {
    alignItems: 'center',
    paddingTop: 2,
  },
  shopName: {
    fontSize: Theme.fontSize.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  shopRating: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    width: '100%',
  },
  shopRatingText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  shopStatus: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    textAlign: 'center',
  },
  newSellerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  newSellerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF8B47',
    marginLeft: 4,
  },
  shopButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
    width: '100%',
    justifyContent: 'center',
  },
  chatButton: {
    flex: 1,
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Theme.borderRadius.large,
    alignItems: "center",
  },
  chatButtonText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: "600",
    color: Colors.textInverse,
  },
  moreSellersButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Theme.borderRadius.large,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moreSellersButtonText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  
  // Specifications Row
  specificationsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    width: '100%',
    gap: 12,
  },
  specificationsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: '#333333',
    letterSpacing: 0.5,
  },
  viewButton: {
    backgroundColor: '#FF8B47',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  specSection: {
    marginBottom: 24,
  },
  specSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8B47',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5D6',
  },
  
  // Image Viewer Modal Styles
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullScreenImage: {
    width: '90%',
    height: '70%',
    borderRadius: 12,
  },
  imageViewerInfo: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  imageViewerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  imageViewerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // Animation styles
  addToCartAnimation: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  animationIcon: {
    fontSize: 16,
    color: Colors.textInverse,
  },
  
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 12,
  },
  viewARButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF5F0",
    borderWidth: 2,
    borderColor: "#FF8B47",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  viewARText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF8B47",
    marginLeft: 8,
  },
  reviewButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF5F0",
    borderWidth: 2,
    borderColor: "#FF8B47",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  reviewText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF8B47",
    marginLeft: 8,
  },
  buyNowButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FF8B47",
    justifyContent: "center",
    alignItems: "center",
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bottomContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  
  favoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.spacing.md,
  },
  
  addToBagBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Theme.spacing.lg,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addToBagText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  
  // Keep existing buy and AR buttons for additional functionality
  additionalButtons: {
    flexDirection: "row",
    marginTop: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  
  buyBtn: {
    flex: 1,
    backgroundColor: Colors.secondary,
    paddingVertical: Theme.spacing.md,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: Theme.spacing.xs,
  },
  arBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Theme.spacing.md,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  
  arBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: Theme.spacing.xs,
  },
  
  reviewsContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  
  reviewsHeader: {
    marginBottom: Theme.spacing.lg,
  },
  
  reviewStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Theme.spacing.sm,
  },
  
  overallRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  ratingNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: Theme.spacing.xs,
  },
  
  reviewsCount: {
    fontSize: 14,
    color: Colors.textMuted,
    marginLeft: Theme.spacing.xs,
  },
  
  reviewItem: {
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  commentInfo: {
    flex: 1,
  },
  
  // Shop Section Styles
  shopSection: {
    backgroundColor: Colors.surface,
    marginHorizontal: Theme.spacing.xl,
    marginVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.medium,
    padding: Theme.spacing.lg,
    ...Theme.shadow.small,
  },
  
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  shopInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  
  shopAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Theme.spacing.md,
  },
  
  shopDetails: {
    flex: 1,
  },
  
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  
  shopRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  
  shopRatingText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginLeft: 4,
    marginRight: 8,
  },
  
  shopLocation: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  
  shopDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  
  responseTime: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '500',
  },
  
  chatButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.medium,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
  },
  errorBackButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorRetryButton: {
    backgroundColor: '#FF8B47',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorRetryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Product Details Section
  productDetailsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },

  // Enhanced Specifications Modal Styles
  enhancedModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  enhancedModalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  enhancedModalContent: {
    minHeight: '60%',
    maxHeight: '90%',
  },
  enhancedModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: '60%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  enhancedModalHeader: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  enhancedDragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  enhancedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enhancedTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  enhancedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  enhancedModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 12,
  },
  enhancedCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedModalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Enhanced Overview Card
  enhancedOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  enhancedOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  enhancedOverviewInfo: {
    flex: 1,
    marginRight: 16,
  },
  enhancedOverviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 24,
  },
  enhancedOverviewCategory: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  enhancedPriceContainer: {
    alignItems: 'flex-end',
  },
  enhancedPriceBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  enhancedPriceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
  },
  enhancedOverviewStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  enhancedStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  enhancedStatText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginLeft: 6,
  },
  enhancedStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },

  // Enhanced Sections Container
  enhancedSectionsContainer: {
    gap: 20,
  },

  // Enhanced Section Styles
  enhancedSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  enhancedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  enhancedSectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  enhancedSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  enhancedSectionContent: {
    padding: 4,
  },

  // Enhanced Specification Items
  enhancedSpecItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginVertical: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  enhancedSpecIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  enhancedSpecContent: {
    flex: 1,
  },
  enhancedSpecLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  enhancedSpecValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Enhanced Footer
  enhancedModalFooter: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  enhancedFooterDivider: {
    width: 60,
    height: 1,
    backgroundColor: '#CBD5E1',
    marginBottom: 16,
  },
  enhancedFooterText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  enhancedFooterSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  specsModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  specsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '50%',
    maxHeight: '90%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  specsModalHeader: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  specsModalDragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  specsModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  specsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  specsModalCloseButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specsModalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Product Overview Card
  specsOverviewCard: {
    backgroundColor: '#FF8B47',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
  },
  specsOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  specsOverviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  specsOverviewPrice: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  specsOverviewPriceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  specsOverviewCategory: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Specifications Sections
  specsSection: {
    marginBottom: 24,
  },
  specsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  specsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  specsSectionContent: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
  },

  // Individual Specification Items
  specsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginVertical: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  specsItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  specsItemContent: {
    flex: 1,
  },
  specsItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 2,
  },
  specsItemValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // Modal Footer
  specsModalFooter: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  specsModalFooterText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Modern Product Card Styles
  modernProductCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  
  modernProductHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  
  productTitleSection: {
    flex: 1,
    marginRight: 16,
  },
  
  modernProductName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 30,
    marginBottom: 4,
  },
  
  productCategory: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  productMetaSection: {
    alignItems: 'flex-end',
    gap: 12,
  },
  
  modernRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  
  modernRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B8860B',
    marginLeft: 4,
  },
  
  newProductBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF8B47',
  },
  
  newProductText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8B47',
    marginLeft: 4,
  },
  
  wishlistButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  
  modernPriceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF8B47',
    marginRight: 2,
  },
  
  modernPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },

  // Delivery & Installation Section
  deliveryInstallationSection: {
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8B47',
  },

  deliveryInstallationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  deliveryInstallationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 8,
  },

  deliveryInstallationContent: {
    gap: 8,
  },

  costItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },

  costItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  costLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },

  costValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  
  stockStatusContainer: {
    alignItems: 'flex-end',
  },
  
  stockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  
  stockText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 6,
  },
  
  modernActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  
  modernAddToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8B47',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  modernAddToCartText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  
  modernCartViewButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF8B47',
  },
  
  quickInfoTags: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  
  infoTag: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  
  infoTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginLeft: 6,
    textAlign: 'center',
  },

  // Modern Shop Card Styles
  modernShopCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  
  shopCardHeader: {
    backgroundColor: '#FF8B47',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  shopHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  shopAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  
  modernShopAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  
  modernShopAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  
  shopHeaderInfo: {
    flex: 1,
  },
  
  modernShopName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  
  shopStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  modernShopStatus: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 6,
    fontWeight: '500',
  },
  
  shopStatsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  
  shopStat: {
    flex: 1,
    alignItems: 'center',
  },
  
  shopStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  
  shopStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 2,
  },
  
  shopStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  
  modernShopRating: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  
  ratingScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 6,
  },
  
  ratingCount: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  
  newSellerContainer: {
    alignItems: 'center',
  },
  
  modernNewSellerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF8B47',
    marginBottom: 8,
  },
  
  modernNewSellerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8B47',
    marginLeft: 4,
  },
  
  newSellerSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  
  modernShopButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  
  modernChatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8B47',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  
  modernChatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  
  modernViewShopButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF8B47',
  },
  
  modernViewShopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8B47',
    marginLeft: 6,
  },
  
  modernSpecsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
  },
  
  specsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  modernSpecsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  
  modernViewSpecsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  
  modernViewSpecsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8B47',
    marginRight: 4,
  },

  // Modern Tab Section Styles
  tabSectionContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  
  modernTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 4,
    marginBottom: 16,
    borderRadius: 16,
  },
  
  modernTabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modernActiveTabButton: {
    backgroundColor: '#FF8B47',
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  
  tabButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  modernTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  
  modernActiveTabText: {
    color: '#FFFFFF',
  },
  
  modernTabContent: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  
  // Description Section Styles
  modernDescriptionSection: {
    paddingTop: 8,
  },
  
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  
  descriptionHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  
  descriptionContent: {
    gap: 24,
  },
  
  modernDescriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4A4A4A',
    fontWeight: '400',
  },
  
  featuresSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
  },
  
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  
  featuresList: {
    gap: 12,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  featureText: {
    fontSize: 15,
    color: '#4A4A4A',
    fontWeight: '500',
    flex: 1,
  },
  
  // Reviews Section Styles
  modernReviewsSection: {
    paddingTop: 8,
  },
  
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  
  reviewsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  reviewsHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  
  reviewsSummary: {
    alignItems: 'center',
    gap: 8,
  },
  
  averageRating: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF8B47',
  },
  
  averageStars: {
    flexDirection: 'row',
    gap: 2,
  },
  
  reviewsList: {
    gap: 20,
  },
  
  modernReviewItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  
  modernReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  modernReviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF8B47',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  modernReviewAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  
  reviewerDetails: {
    flex: 1,
  },
  
  modernReviewUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  
  modernReviewDate: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  
  reviewRatingContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  
  modernReviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  
  ratingNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  
  reviewContent: {
    paddingLeft: 56,
  },
  
  modernReviewText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4A4A4A',
    fontWeight: '400',
  },
  
  // No Reviews State
  modernNoReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  
  noReviewsIcon: {
    marginBottom: 20,
  },
  
  modernNoReviewsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  modernNoReviewsSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FF8B47',
    gap: 8,
  },
  
  writeReviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8B47',
  },

});
