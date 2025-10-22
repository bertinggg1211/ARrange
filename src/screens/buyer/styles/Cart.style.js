import { StyleSheet, Platform, StatusBar, Dimensions } from "react-native";
import ThemeColors from '../../../theme/colors';

const { Colors, Theme } = ThemeColors;
const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  // Premium Container
  premiumContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#FAFAFA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Space for the checkout button
  },
  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Cart Header
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cartHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  itemCount: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666',
  },
  editButton: {
    padding: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: '#FF8B47',
    fontWeight: '600',
  },
  cartList: {
    paddingBottom: 16,
  },
  
  // Cart Item Styles
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  checkboxContainer: {
    padding: 8,
    marginRight: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    borderColor: 'transparent',
    backgroundColor: '#FF8B47',
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    overflow: 'hidden',
    marginRight: 16,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 8,
  },
  itemVariant: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 4,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF5A5F',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  quantityBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnLeft: {
    backgroundColor: '#E0E0E0',
  },
  quantityBtnRight: {
    backgroundColor: '#1A1A1A',
  },
  quantityNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    minWidth: 30,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 4,
  },
  // Section Titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  
  // Coupon Section
  couponSection: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  couponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 52,
    marginRight: 12,
  },
  couponIcon: {
    marginRight: 10,
  },
  couponInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#1A1A1A',
    padding: 0,
  },
  applyButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 20,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  
  // Order Summary
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF8B47',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    width: '100%',
  },
  
  // Recommendations Section
  recommendationSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  recommendationList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  recommendationCard: {
    width: width * 0.6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recommendationImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F8F8F8',
  },
  recommendationHeart: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  recommendationInfo: {
    padding: 16,
  },
  recommendationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  recommendationPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8B47',
  },
  addToCartBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  
  recommendationImagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: '#E8E8E8',
  },
  
  recommendationHeart: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: "center",
    alignItems: "center",
  },
  
  totalSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: '#999',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: '#FF8B47',
  },
  checkoutContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  // Premium Header Styles
  premiumHeader: {
    backgroundColor: '#FF8B47',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  premiumHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  premiumBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  headerTitleSection: {
    flex: 1,
    alignItems: 'center',
  },
  premiumHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Selection Controls
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectAllChecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },

  // Cart List Styles
  cartScrollView: {
    flex: 1,
  },
  premiumCartList: {
    padding: 20,
    paddingBottom: 100,
  },

  // Premium Cart Item
  premiumCartItem: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  glassBackground: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    position: 'relative',
  },

  // Selection
  selectionContainer: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
  },

  // Premium Image Container
  premiumImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
    backgroundColor: '#F8F8F8',
  },
  premiumItemImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  floatingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Premium Item Info
  premiumItemInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  premiumItemName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 24,
    marginRight: 10,
  },
  premiumRemoveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumItemVariant: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },

  // Price and Quantity Row
  priceQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  priceSection: {
    flex: 1,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF8B47',
    marginBottom: 4,
  },

  // Premium Quantity Controls
  premiumQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8B47',
    borderRadius: 16,
    overflow: 'hidden',
  },
  quantityDisplay: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 20,
    textAlign: 'center',
  },

  // Features Row
  featuresRow: {
    flexDirection: 'row',
    gap: 12,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },

  // Premium Empty State
  premiumEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconWrapper: {
    position: 'relative',
    marginBottom: 40,
  },
  emptyIconGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF8B47',
    opacity: 0.1,
    top: -60,
    left: -60,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  emptyIconBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8B47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  premiumEmptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  premiumEmptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 12,
  },
  premiumShopButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  shopButtonGradient: {
    backgroundColor: '#FF8B47',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  premiumShopText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Premium Checkout Container
  premiumCheckoutContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    padding: 24,
    position: 'relative',
  },
  checkoutGlassBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
  },

  // Order Summary
  orderSummarySection: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  summaryValueFree: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4CAF50',
  },
  summaryDiscount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF8B47',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF8B47',
  },

  // Benefits Section
  benefitsSection: {
    marginBottom: 24,
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },

  // Premium Checkout Button
  premiumCheckoutButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  checkoutButtonGradient: {
    backgroundColor: '#FF8B47',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  checkoutButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkoutButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkoutButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutButtonPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Legacy styles (kept for compatibility)
  gradientButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Additional styles for the working UI
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FAFAFA',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 40,
  },
  shopNowButton: {
    width: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientButton: {
    backgroundColor: '#FF8B47',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopNowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cartCountContainer: {
    backgroundColor: '#FF8B47',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Modern Cart Styles
  modernContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  
  modernBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modernHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  
  modernCartIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modernContentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  modernCartList: {
    paddingBottom: 20,
  },
  
  modernCartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  modernImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    overflow: 'hidden',
    marginRight: 12,
  },
  
  modernItemImage: {
    width: '100%',
    height: '100%',
  },
  
  modernItemInfo: {
    flex: 1,
    marginRight: 8,
    minWidth: 0, // Allow flex to shrink
    flexShrink: 1, // Allow shrinking but prioritize content
  },
  
  modernItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  
  modernItemCategory: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  
  modernItemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
  
  modernQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  
  modernQuantityBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modernQuantityBtnAdd: {
    backgroundColor: '#FF8B47',
  },
  
  disabledButton: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
  },
  
  stockIndicator: {
    marginTop: 4,
  },
  
  stockText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  
  modernQuantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginHorizontal: 12,
    minWidth: 16,
    textAlign: 'center',
  },
  
  modernDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8B47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  discountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 20,
  },
  
  discountLabel: {
    fontSize: 14,
    color: '#999',
  },
  
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  
  applyButtonText: {
    fontSize: 14,
    color: '#FF8B47',
    fontWeight: '600',
  },
  
  modernSummary: {
    marginBottom: 24,
  },
  
  modernSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  modernSummaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  
  modernSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  
  modernSummaryDiscount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8B47',
  },
  
  modernSummaryTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  
  modernSummaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  
  modernCheckoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8B47',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  
  modernCheckoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },

  // Simple Cart Styles
  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginLeft: 20 
  },
  item: { 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  name: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  price: { 
    fontSize: 16, 
    color: '#FF8B47', 
    marginVertical: 5 
  },
  controls: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10 
  },
  btn: { 
    width: 30, 
    height: 30, 
    backgroundColor: '#f0f0f0', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 15 
  },
  btnText: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  qty: { 
    fontSize: 16, 
    marginHorizontal: 15 
  },
  remove: { 
    marginLeft: 20 
  },
  empty: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyText: { 
    fontSize: 18, 
    color: '#666' 
  },
  bottom: { 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#eee' 
  },
  total: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 15 
  },
  checkout: { 
    backgroundColor: '#FF8B47', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  checkoutText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});
