import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const PRODUCT_CARD_WIDTH = (width - 48) / 2; // 16px margin on each side + 16px gap between cards

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  
  // Enhanced Header Styles
  headerContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  
  headerSubtitle: {
    fontSize: 13,
    color: "#666666",
    fontWeight: "500",
  },
  
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FF8B47",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    elevation: 2,
    shadowColor: "#FF8B47",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  
  // Filter Bar Styles
  filterBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FAFAFA",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  
  filterChipActive: {
    backgroundColor: "#FF8B47",
    borderColor: "#FF8B47",
  },
  
  filterChipText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  
  filterChipTextActive: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  
  productsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  
  // Product Card Styles (Same as Home.jsx)
  productRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "relative",
  },
  
  favoriteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  
  addToCartBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF8B47",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
    shadowColor: "#FF8B47",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  productImg: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    marginBottom: 8,
  },
  
  productInfo: {
    paddingRight: 40, // Space for add to cart button
  },
  
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
    lineHeight: 18,
  },
  
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF8B47",
    marginBottom: 2,
  },
  
  productSeller: {
    fontSize: 12,
    color: "#666666",
    fontStyle: "italic",
  },
  
  // Enhanced Loading States
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  
  loadingSpinner: {
    marginBottom: 24,
  },
  
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  
  loadingSubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  
  // Enhanced Error States
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  
  errorIcon: {
    marginBottom: 24,
  },
  
  errorText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  
  errorSubtext: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF8B47",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    elevation: 2,
    shadowColor: "#FF8B47",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  retryIcon: {
    marginRight: 8,
  },
  
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  
  // Enhanced Empty States
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  
  emptyIcon: {
    marginBottom: 24,
  },
  
  emptyText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  
  emptySubtext: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  
  exploreButton: {
    backgroundColor: "#FF8B47",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    elevation: 2,
    shadowColor: "#FF8B47",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  
  // List Header Styles
  listHeader: {
    marginBottom: 16,
  },
  
  resultsInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  
  resultsText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
  },
  
  sortText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
    marginLeft: 4,
  },
});