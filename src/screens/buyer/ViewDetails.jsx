// src/screens/buyer/ViewDetails.jsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export default function ViewDetails({ route, navigation }) {
  const { product } = route.params || {};
  
  // Debug: Log ALL product data received
  console.log('===========================================');
  console.log('📋 VIEW DETAILS SCREEN - RECEIVED PRODUCT');
  console.log('===========================================');
  console.log('Full product object:', JSON.stringify(product, null, 2));
  console.log('===========================================');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        bounces={true}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      >
        {/* Enhanced Product Overview Card */}
        <View style={styles.enhancedOverviewCard}>
          <View style={styles.enhancedOverviewHeader}>
            <View style={styles.enhancedOverviewInfo}>
              <Text style={styles.enhancedOverviewTitle}>
                {product?.name || "Product"}
              </Text>
              <Text style={styles.enhancedOverviewCategory}>
                {product?.category || "Lighting"}
              </Text>
            </View>
            <View style={styles.enhancedPriceContainer}>
              <View style={styles.enhancedPriceBadge}>
                <Text style={styles.enhancedPriceText}>
                  ₱
                  {typeof product?.price === "number"
                    ? product.price.toLocaleString()
                    : (product?.price || "0").toString().replace("₱", "")}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.enhancedOverviewStats}>
            <View style={styles.enhancedStatItem}>
              <Icon name="cube-outline" size={16} color="#10B981" />
              <Text style={styles.enhancedStatText}>
                {product?.stock ? `${product.stock} in stock` : "Contact seller"}
              </Text>
            </View>
            <View style={styles.enhancedStatDivider} />
            <View style={styles.enhancedStatItem}>
              <Icon name="shield-checkmark" size={16} color="#3B82F6" />
              <Text style={styles.enhancedStatText}>Warranty included</Text>
            </View>
          </View>
        </View>

        {/* Enhanced Specifications Sections */}
        <View style={styles.enhancedSectionsContainer}>
          {/* Basic Information Section */}
          <View style={styles.enhancedSection}>
            <View style={styles.enhancedSectionHeader}>
              <View style={styles.enhancedSectionIcon}>
                <Icon
                  name="information-circle-outline"
                  size={20}
                  color="#8B5CF6"
                />
              </View>
              <Text style={styles.enhancedSectionTitle}>
                Basic Information
              </Text>
            </View>
            <View style={styles.enhancedSectionContent}>
              <View style={styles.enhancedSpecItem}>
                <View style={styles.enhancedSpecIcon}>
                  <Icon name="pricetag" size={16} color="#10B981" />
                </View>
                <View style={styles.enhancedSpecContent}>
                  <Text style={styles.enhancedSpecLabel}>Stock Available</Text>
                  <Text style={styles.enhancedSpecValue}>
                    {product?.stock
                      ? `${product.stock} units`
                      : "Contact seller"}
                  </Text>
                </View>
              </View>

              <View style={styles.enhancedSpecItem}>
                <View style={styles.enhancedSpecIcon}>
                  <Icon name="shield-checkmark" size={16} color="#3B82F6" />
                </View>
                <View style={styles.enhancedSpecContent}>
                  <Text style={styles.enhancedSpecLabel}>Warranty</Text>
                  <Text style={styles.enhancedSpecValue}>
                    {product?.warranty || "Standard warranty"}
                  </Text>
                </View>
              </View>

              {product?.brand && (
                <View style={styles.enhancedSpecItem}>
                  <View style={styles.enhancedSpecIcon}>
                    <Icon name="business" size={16} color="#8B5CF6" />
                  </View>
                  <View style={styles.enhancedSpecContent}>
                    <Text style={styles.enhancedSpecLabel}>Brand</Text>
                    <Text style={styles.enhancedSpecValue}>
                      {product.brand}
                    </Text>
                  </View>
                </View>
              )}

              {product?.model && (
                <View style={styles.enhancedSpecItem}>
                  <View style={styles.enhancedSpecIcon}>
                    <Icon name="code-working" size={16} color="#F59E0B" />
                  </View>
                  <View style={styles.enhancedSpecContent}>
                    <Text style={styles.enhancedSpecLabel}>Model</Text>
                    <Text style={styles.enhancedSpecValue}>
                      {product.model}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Physical Properties Section */}
          <View style={styles.enhancedSection}>
            <View style={styles.enhancedSectionHeader}>
              <View style={styles.enhancedSectionIcon}>
                <Icon name="resize-outline" size={20} color="#06B6D4" />
              </View>
              <Text style={styles.enhancedSectionTitle}>
                Physical Properties
              </Text>
            </View>
            <View style={styles.enhancedSectionContent}>
              <View style={styles.enhancedSpecItem}>
                <View style={styles.enhancedSpecIcon}>
                  <Icon name="expand" size={16} color="#6B7280" />
                </View>
                <View style={styles.enhancedSpecContent}>
                  <Text style={styles.enhancedSpecLabel}>Dimensions</Text>
                  <Text style={styles.enhancedSpecValue}>
                    {(product?.height || product?.width) 
                      ? `${product.height ? product.height + ' cm' : '-'} x ${product.width ? product.width + ' cm' : '-'}` 
                      : (product?.dimensions || "Not specified")}
                  </Text>
                </View>
              </View>

              <View style={styles.enhancedSpecItem}>
                <View style={styles.enhancedSpecIcon}>
                  <Icon name="barbell" size={16} color="#92400E" />
                </View>
                <View style={styles.enhancedSpecContent}>
                  <Text style={styles.enhancedSpecLabel}>Weight</Text>
                  <Text style={styles.enhancedSpecValue}>
                    {product?.weight || "Contact seller"}
                  </Text>
                </View>
              </View>

              <View style={styles.enhancedSpecItem}>
                <View style={styles.enhancedSpecIcon}>
                  <Icon name="layers" size={16} color="#059669" />
                </View>
                <View style={styles.enhancedSpecContent}>
                  <Text style={styles.enhancedSpecLabel}>Material</Text>
                  <Text style={styles.enhancedSpecValue}>
                    {product?.material || "Premium materials"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Technical Specifications Section */}
          {(product?.bulbType ||
            product?.numberOfBulbs ||
            product?.voltage) && (
            <View style={styles.enhancedSection}>
              <View style={styles.enhancedSectionHeader}>
                <View style={styles.enhancedSectionIcon}>
                  <Icon name="flash-outline" size={20} color="#DC2626" />
                </View>
                <Text style={styles.enhancedSectionTitle}>
                  Technical Specifications
                </Text>
              </View>
              <View style={styles.enhancedSectionContent}>
                {product?.bulbType && (
                  <View style={styles.enhancedSpecItem}>
                    <View style={styles.enhancedSpecIcon}>
                      <Icon name="bulb" size={16} color="#F59E0B" />
                    </View>
                    <View style={styles.enhancedSpecContent}>
                      <Text style={styles.enhancedSpecLabel}>Bulb Type</Text>
                      <Text style={styles.enhancedSpecValue}>
                        {product.bulbType}
                      </Text>
                    </View>
                  </View>
                )}

                {product?.numberOfBulbs && (
                  <View style={styles.enhancedSpecItem}>
                    <View style={styles.enhancedSpecIcon}>
                      <Icon name="radio-button-on" size={16} color="#EF4444" />
                    </View>
                    <View style={styles.enhancedSpecContent}>
                      <Text style={styles.enhancedSpecLabel}>Number of Bulbs</Text>
                      <Text style={styles.enhancedSpecValue}>
                        {product.numberOfBulbs}
                      </Text>
                    </View>
                  </View>
                )}

                {product?.voltage && (
                  <View style={styles.enhancedSpecItem}>
                    <View style={styles.enhancedSpecIcon}>
                      <Icon
                        name="battery-charging"
                        size={16}
                        color="#10B981"
                      />
                    </View>
                    <View style={styles.enhancedSpecContent}>
                      <Text style={styles.enhancedSpecLabel}>Voltage</Text>
                      <Text style={styles.enhancedSpecValue}>
                        {product.voltage}
                      </Text>
                    </View>
                  </View>
                )}

                {product?.ledType && (
                  <View style={styles.enhancedSpecItem}>
                    <View style={styles.enhancedSpecIcon}>
                      <Icon name="sunny" size={16} color="#F59E0B" />
                    </View>
                    <View style={styles.enhancedSpecContent}>
                      <Text style={styles.enhancedSpecLabel}>LED Type</Text>
                      <Text style={styles.enhancedSpecValue}>
                        {product.ledType}
                      </Text>
                    </View>
                  </View>
                )}

                {product?.lumens && (
                  <View style={styles.enhancedSpecItem}>
                    <View style={styles.enhancedSpecIcon}>
                      <Icon name="flashlight" size={16} color="#EF4444" />
                    </View>
                    <View style={styles.enhancedSpecContent}>
                      <Text style={styles.enhancedSpecLabel}>Brightness</Text>
                      <Text style={styles.enhancedSpecValue}>
                        {product.lumens} lumens
                      </Text>
                    </View>
                  </View>
                )}

                {product?.installationType && (
                  <View style={styles.enhancedSpecItem}>
                    <View style={styles.enhancedSpecIcon}>
                      <Icon name="construct" size={16} color="#6B7280" />
                    </View>
                    <View style={styles.enhancedSpecContent}>
                      <Text style={styles.enhancedSpecLabel}>Installation</Text>
                      <Text style={styles.enhancedSpecValue}>
                        {product.installationType}
                      </Text>
                    </View>
                  </View>
                )}

                {product?.roomType && (
                  <View style={styles.enhancedSpecItem}>
                    <View style={styles.enhancedSpecIcon}>
                      <Icon name="home" size={16} color="#3B82F6" />
                    </View>
                    <View style={styles.enhancedSpecContent}>
                      <Text style={styles.enhancedSpecLabel}>Suitable for</Text>
                      <Text style={styles.enhancedSpecValue}>
                        {product.roomType}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Delivery & Installation Section */}
          {(product?.deliveryCharge || product?.installationCost) && (
            <View style={styles.enhancedSection}>
              <View style={styles.enhancedSectionHeader}>
                <View style={styles.enhancedSectionIcon}>
                  <Icon name="car-outline" size={20} color="#059669" />
                </View>
                <Text style={styles.enhancedSectionTitle}>
                  Delivery & Installation
                </Text>
              </View>
              <View style={styles.enhancedSectionContent}>
                {product?.deliveryCharge && product.deliveryCharge > 0 && (
                  <View style={styles.enhancedSpecItem}>
                    <View style={styles.enhancedSpecIcon}>
                      <Icon name="car" size={16} color="#6B7280" />
                    </View>
                    <View style={styles.enhancedSpecContent}>
                      <Text style={styles.enhancedSpecLabel}>
                        Delivery Charge
                      </Text>
                      <Text style={styles.enhancedSpecValue}>
                        ₱{product.deliveryCharge}
                      </Text>
                    </View>
                  </View>
                )}

                {product?.installationCost && product.installationCost > 0 && (
                  <View style={styles.enhancedSpecItem}>
                    <View style={styles.enhancedSpecIcon}>
                      <Icon name="construct" size={16} color="#6B7280" />
                    </View>
                    <View style={styles.enhancedSpecContent}>
                      <Text style={styles.enhancedSpecLabel}>
                        Installation Cost
                      </Text>
                      <Text style={styles.enhancedSpecValue}>
                        ₱{product.installationCost}
                      </Text>
                    </View>
                  </View>
                )}

                {product?.freeDeliveryThreshold &&
                  product.freeDeliveryThreshold > 0 && (
                    <View style={styles.enhancedSpecItem}>
                      <View style={styles.enhancedSpecIcon}>
                        <Icon name="gift" size={16} color="#6B7280" />
                      </View>
                      <View style={styles.enhancedSpecContent}>
                        <Text style={styles.enhancedSpecLabel}>
                          Free Delivery Threshold
                        </Text>
                        <Text style={styles.enhancedSpecValue}>
                          ₱{product.freeDeliveryThreshold}
                        </Text>
                      </View>
                    </View>
                  )}

                {product?.installationIncluded !== undefined && (
                  <View style={styles.enhancedSpecItem}>
                    <View style={styles.enhancedSpecIcon}>
                      <Icon name="checkmark-circle" size={16} color="#6B7280" />
                    </View>
                    <View style={styles.enhancedSpecContent}>
                      <Text style={styles.enhancedSpecLabel}>
                        Installation Included
                      </Text>
                      <Text style={styles.enhancedSpecValue}>
                        {product.installationIncluded ? "Yes" : "No"}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Custom Specifications Section */}
          {product?.specifications && product.specifications.length > 0 && (
            <View style={styles.enhancedSection}>
              <View style={styles.enhancedSectionHeader}>
                <View style={styles.enhancedSectionIcon}>
                  <Icon name="list-outline" size={20} color="#7C3AED" />
                </View>
                <Text style={styles.enhancedSectionTitle}>
                  Additional Specifications
                </Text>
              </View>
              <View style={styles.enhancedSectionContent}>
                {product.specifications.map(
                  (spec, index) =>
                    spec.name && spec.value ? (
                      <View key={index} style={styles.enhancedSpecItem}>
                        <View style={styles.enhancedSpecIcon}>
                          <Icon name="information" size={16} color="#6B7280" />
                        </View>
                        <View style={styles.enhancedSpecContent}>
                          <Text style={styles.enhancedSpecLabel}>
                            {spec.name}
                          </Text>
                          <Text style={styles.enhancedSpecValue}>
                            {spec.value}
                          </Text>
                        </View>
                      </View>
                    ) : null
                )}
              </View>
            </View>
          )}
        </View>

        {/* Enhanced Footer */}
        <View style={styles.enhancedModalFooter}>
          <View style={styles.enhancedFooterDivider} />
          <Text style={styles.enhancedFooterText}>
            All specifications are provided by the seller
          </Text>
          <Text style={styles.enhancedFooterSubtext}>
            For additional details, contact the seller directly
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  enhancedOverviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedOverviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  enhancedOverviewInfo: {
    flex: 1,
  },
  enhancedOverviewTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  enhancedOverviewCategory: {
    fontSize: 14,
    color: "#64748B",
  },
  enhancedPriceContainer: {
    alignItems: "flex-end",
  },
  enhancedPriceBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  enhancedPriceText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#92400E",
  },
  enhancedOverviewStats: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  enhancedStatItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  enhancedStatText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 6,
  },
  enhancedStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  enhancedSectionsContainer: {
    gap: 20,
    marginTop: 20,
  },
  enhancedSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  enhancedSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  enhancedSectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  enhancedSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  enhancedSectionContent: {
    padding: 16,
  },
  enhancedSpecItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  enhancedSpecIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  enhancedSpecContent: {
    flex: 1,
  },
  enhancedSpecLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 2,
  },
  enhancedSpecValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1E293B",
  },
  enhancedModalFooter: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  enhancedFooterDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginBottom: 16,
  },
  enhancedFooterText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 4,
  },
  enhancedFooterSubtext: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
});
