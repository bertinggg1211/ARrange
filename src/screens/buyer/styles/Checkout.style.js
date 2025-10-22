import { StyleSheet, Platform, StatusBar, Dimensions } from "react-native";
import ThemeColors from '../../../theme/colors';

const { Colors, Theme } = ThemeColors;
const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cartBadge: {
    backgroundColor: '#FF8B47',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Section Styles
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },

  // Order Item Styles
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  orderItemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    overflow: 'hidden',
    marginRight: 16,
  },

  orderItemImage: {
    width: '100%',
    height: '100%',
  },

  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },

  orderItemInfo: {
    flex: 1,
  },

  orderItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },

  orderItemCategory: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },

  orderItemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  orderItemQuantity: {
    fontSize: 12,
    color: '#666',
  },

  orderItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF8B47',
  },

  // Address Input Styles
  addressInputContainer: {
    position: 'relative',
    marginBottom: 12,
  },

  addressInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    paddingRight: 50,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
    minHeight: 80,
    textAlignVertical: 'top',
  },

  locationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addressHint: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },

  // Payment Option Styles
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },

  selectedPayment: {
    borderColor: '#FF8B47',
    backgroundColor: '#FFF5F0',
  },

  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  paymentInfo: {
    flex: 1,
  },

  paymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },

  selectedPaymentTitle: {
    color: '#FF8B47',
  },

  paymentSubtitle: {
    fontSize: 12,
    color: '#999',
  },

  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  radioButtonSelected: {
    borderColor: '#FF8B47',
  },

  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF8B47',
  },

  // Total Section Styles
  totalSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  totalLabel: {
    fontSize: 14,
    color: '#666',
  },

  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  totalLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF8B47',
  },

  freeShippingNote: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    marginVertical: 8,
    fontWeight: '500',
  },

  totalDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },

  // Benefits Section
  benefitsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  benefitItem: {
    alignItems: 'center',
    flex: 1,
  },

  benefitText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },

  // Checkout Container
  checkoutContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  placeOrderButton: {
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

  placeOrderButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0.1,
  },

  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeOrderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeOrderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },

  // Sliding Button Styles
  addressWarning: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },

  slideContainer: {
    height: 60,
    backgroundColor: '#FF8B47',
    borderRadius: 30,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  slideContainerDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0.1,
  },

  slideTrack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  slideText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    zIndex: 2,
  },

  slideProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
  },

  slideButton: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 52,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 3,
  },

  slideButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },

  instructionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Legacy styles (kept for compatibility)
  title: { 
    fontSize: Theme.fontSize.title, 
    fontWeight: "bold", 
    marginBottom: Theme.spacing.xl,
    color: Colors.text,
    textAlign: "center",
    marginTop: Theme.spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: Theme.borderRadius.small,
    marginRight: Theme.spacing.md,
    backgroundColor: Colors.overlay,
  },
  itemName: { 
    fontSize: Theme.fontSize.md,
    fontWeight: "500",
    color: Colors.text,
  },
  itemQuantity: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  itemPrice: { 
    fontSize: Theme.fontSize.md, 
    fontWeight: "bold",
    color: Colors.secondary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.small,
    padding: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    backgroundColor: Colors.surface,
    minHeight: 80,
    textAlignVertical: "top",
    color: Colors.text,
  },
  paymentText: {
    fontSize: Theme.fontSize.md,
    marginLeft: Theme.spacing.md,
    flex: 1,
    color: Colors.text,
  },
  checkIcon: {
    marginLeft: Theme.spacing.sm,
  },
  placeOrderBtn: {
    backgroundColor: Colors.success,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.medium,
    alignItems: "center",
    marginTop: Theme.spacing.sm,
    ...Theme.shadow.large,
  },

  loadingIndicator: {
    marginLeft: 8,
    padding: 4,
  },
});
