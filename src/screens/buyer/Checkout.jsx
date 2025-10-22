import React, { useMemo, useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, ScrollView, StatusBar, Platform, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from "../../context/CartContext";
import Icon from "react-native-vector-icons/Ionicons";
import { BASE_URL } from "../../api/api";
import { getUserProfile } from "../../api/userApi";
import { createOrder } from "../../api/orderApi";
import OrderSuccessModal from "../../components/OrderSuccessModal";
import styles from "./styles/Checkout.style";

export default function Checkout({ navigation, route }) {
  const { cart, clearCart } = useCart();
  const item = route.params?.item; // Single item from Buy Now
  const items = item ? [item] : cart; // Use item or cart
  
  // Debug: Log the received item data
  console.log('💳 Checkout received item:', {
    hasItem: !!item,
    itemId: item?.id,
    itemName: item?.name,
    itemImages: item?.images,
    hasImages: !!item?.images,
    imagesLength: item?.images?.length,
    firstImage: item?.images?.[0],
    itemsCount: items.length
  });
  
  const insets = useSafeAreaInsets();
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);

  // Fetch user profile to pre-fill address
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await getUserProfile();
        if (response.success) {
          setUserProfile(response.user);
          if (response.user?.address) {
            setAddress(response.user.address);
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Continue without pre-filling address
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, []);

  // Calculate subtotal (product prices only)
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item?.price || item.product?.price) || 0;
      const qty = Number(item?.quantity) || 1;
      return sum + price * qty;
    }, 0);
  }, [items]);

  // Calculate delivery and installation costs
  const deliveryAndInstallation = useMemo(() => {
    let totalDeliveryCharge = 0;
    let totalInstallationCost = 0;
    
    items.forEach(item => {
      // Add delivery charge for each unique product (not per quantity)
      if (item.deliveryCharge && item.deliveryCharge > 0) {
        totalDeliveryCharge += parseFloat(item.deliveryCharge);
      }
      
      // Add installation cost for each unique product (not per quantity)
      if (item.installationCost && item.installationCost > 0) {
        totalInstallationCost += parseFloat(item.installationCost);
      }
    });
    
    return {
      deliveryCharge: totalDeliveryCharge,
      installationCost: totalInstallationCost,
      total: totalDeliveryCharge + totalInstallationCost
    };
  }, [items]);

  // Calculate total including delivery and installation
  const total = subtotal + deliveryAndInstallation.total;

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert("Missing Information", "Please enter your delivery address");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Prepare order data (server expects 'cartItems' not 'items')
      const orderData = {
        cartItems: items.map(item => {
          const productId = item.id || item.product?.id;
          const sellerId = item.seller_id || item.sellerId || item.product?.seller_id || item.product?.sellerId;
          
          console.log('🔍 Item validation:', {
            itemId: item.id,
            productId: productId,
            sellerId: sellerId,
            hasProductId: !!productId,
            hasSellerId: !!sellerId,
            sellerIdType: typeof sellerId,
            // Debug all possible seller ID fields
            item_seller_id: item.seller_id,
            item_sellerId: item.sellerId,
            product_seller_id: item.product?.seller_id,
            product_sellerId: item.product?.sellerId,
            // Show all item keys
            itemKeys: Object.keys(item)
          });
          
          // Validate required UUIDs
          if (!productId) {
            throw new Error('Product ID is missing');
          }
          if (!sellerId) {
            throw new Error('Seller ID is missing');
          }
          
          return {
            productId: productId,
            sellerId: sellerId,
            quantity: item.quantity || 1,
            price: Number(item.price || item.product?.price || 0),
            deliveryCharge: item.deliveryCharge || item.product?.deliveryCharge || 0,
            installationCost: item.installationCost || item.product?.installationCost || 0,
            freeDeliveryThreshold: item.freeDeliveryThreshold || item.product?.freeDeliveryThreshold || null,
            installationIncluded: item.installationIncluded || item.product?.installationIncluded || false,
            productSnapshot: {
              name: item.name || item.product?.name,
              description: item.description || item.product?.description,
              images: item.images || item.product?.images || [],
              category: item.category || item.product?.category
            }
          };
        }),
        shippingAddress: {
          fullAddress: address.trim(),
          recipient: userProfile?.full_name || userProfile?.name || 'Customer',
          phone: userProfile?.phone || '',
          notes: ''
        },
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card',
        notes: '' // Add notes field that server expects
      };

      console.log('🛒 Creating order with data:', orderData);
      console.log('🛒 Cart items details:', orderData.cartItems.map(item => ({
        productId: item.productId,
        sellerId: item.sellerId,
        price: item.price,
        quantity: item.quantity
      })));
      
      // Create the order
      const response = await createOrder(orderData);
      
      console.log('✅ Order created successfully:', response);
      
      // Clear cart if not from Buy Now
      if (!item) {
        clearCart();
      }
      
      // Show custom success modal
      console.log('🎉 Order success - showing custom modal');
      console.log('📋 Response data:', response);
      console.log('📋 Order number:', response.orders?.[0]?.order_number);
      setOrderNumber(response.orders?.[0]?.order_number || 'N/A');
      setShowSuccessModal(true);
      console.log('🎉 Modal state set to true');
      console.log('🎭 Current modal state:', { showSuccessModal: true, orderNumber: response.orders?.[0]?.order_number || 'N/A' });
      
    } catch (error) {
      console.error('❌ Error creating order:', error);
      Alert.alert(
        "Order Failed", 
        "Sorry, we couldn't process your order. Please try again.",
        [
          { text: "Try Again", onPress: () => setIsProcessing(false) }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getImageSource = (item) => {
    console.log('🖼️ Getting image source for item:', {
      hasProduct: !!item.product,
      hasImages: !!item.images,
      hasImage: !!item.image,
      productImages: item.product?.images,
      directImages: item.images,
      directImage: item.image
    });

    // Handle direct images array (from BUY NOW)
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      const mainImage = item.images[0];
      console.log('🖼️ Using direct images array:', mainImage);
      
      if (typeof mainImage === 'string' && mainImage.trim() !== '') {
        let fullImageUrl;
        if (mainImage.startsWith('http')) {
          fullImageUrl = mainImage;
        } else if (mainImage.startsWith('/')) {
          fullImageUrl = `${BASE_URL}${mainImage}`;
        } else {
          fullImageUrl = `${BASE_URL}/${mainImage}`;
        }
        console.log('🖼️ Final image URL (string):', fullImageUrl);
        return { uri: fullImageUrl };
      } else if (mainImage && typeof mainImage === 'object') {
        // Handle Cloudinary object format with 'url' property
        const imageUrl = mainImage.uri || mainImage.url;
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
          console.log('🖼️ Using object URL/URI:', imageUrl);
          return { uri: imageUrl };
        }
      }
    }
    
    // Handle backend cart format (has product.images array)
    if (item.product && item.product.images && item.product.images.length > 0) {
      const mainImage = item.product.images[0];
      console.log('🖼️ Using product.images:', mainImage);
      
      if (typeof mainImage === 'string') {
        let fullImageUrl;
        if (mainImage.startsWith('http')) {
          fullImageUrl = mainImage;
        } else if (mainImage.startsWith('/')) {
          fullImageUrl = `${BASE_URL}${mainImage}`;
        } else {
          fullImageUrl = `${BASE_URL}/${mainImage}`;
        }
        return { uri: fullImageUrl };
      } else if (typeof mainImage === 'object' && mainImage.url) {
        return { uri: mainImage.url };
      }
      return { uri: mainImage };
    }
    
    // Handle single image (fallback)
    if (item.image) {
      console.log('🖼️ Using single image:', item.image);
      if (typeof item.image === 'string') return { uri: item.image };
      if (typeof item.image === 'number') return item.image;
    }
    
    console.log('🖼️ No image found, using placeholder');
    return null;
  };

  const renderOrderItem = ({ item }) => {
    const productImage = getImageSource(item);
    
    // Validate image source before rendering
    const isValidImageSource = productImage && 
      productImage.uri && 
      typeof productImage.uri === 'string' && 
      productImage.uri.trim() !== '';
    
    console.log('🖼️ Image validation:', { 
      hasImage: !!productImage, 
      hasUri: !!productImage?.uri, 
      uriType: typeof productImage?.uri,
      isValid: isValidImageSource,
      uri: productImage?.uri 
    });
    
    return (
      <View style={styles.orderItem}>
        <View style={styles.orderItemImageContainer}>
          {isValidImageSource ? (
            <Image 
              source={productImage} 
              style={styles.orderItemImage}
              onError={(error) => {
                console.log('🖼️ Image failed to load:', productImage, error.nativeEvent);
              }}
              onLoad={() => {
                console.log('🖼️ Image loaded successfully:', productImage);
              }}
            />
          ) : (
            <View style={[styles.orderItemImage, styles.placeholderImage]}>
              <Icon name="image-outline" size={20} color="#CCC" />
            </View>
          )}
        </View>
        
        <View style={styles.orderItemInfo}>
          <Text style={styles.orderItemName} numberOfLines={2}>
            {item.product?.name || item.name}
          </Text>
          <Text style={styles.orderItemCategory}>
            {item.product?.category || item.category || 'Lighting'}
          </Text>
          <View style={styles.orderItemPriceRow}>
            <Text style={styles.orderItemQuantity}>Qty: {item.quantity || 1}</Text>
            <Text style={styles.orderItemPrice}>
              ₱{(Number(item?.price || item.product?.price) || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const paymentOptions = [
    {
      id: 'cod',
      icon: 'cash-outline',
      title: 'Cash on Delivery',
      subtitle: 'Pay when you receive your order',
      color: '#4CAF50'
    },
    {
      id: 'card',
      icon: 'card-outline',
      title: 'Credit/Debit Card',
      subtitle: 'Visa, Mastercard, and more',
      color: '#2196F3'
    },
    {
      id: 'gcash',
      icon: 'wallet-outline',
      title: 'GCash',
      subtitle: 'Digital wallet payment',
      color: '#007CFF'
    }
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.backButtonInner}>
              <Icon name="chevron-back" size={20} color="#1A1A1A" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerRight}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 + Math.max(insets.bottom, 8) }}
        >
        {/* Order Summary Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="receipt-outline" size={20} color="#FF8B47" />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          
          <FlatList
            data={items}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={renderOrderItem}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
          
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="location-outline" size={20} color="#FF8B47" />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            {isLoadingProfile && (
              <View style={styles.loadingIndicator}>
                <Icon name="refresh" size={16} color="#FF8B47" />
              </View>
            )}
          </View>
          
          <View style={styles.addressInputContainer}>
            <TextInput
              style={styles.addressInput}
              placeholder={isLoadingProfile ? "Loading your address..." : "Enter your complete delivery address..."}
              placeholderTextColor="#999"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isLoadingProfile}
            />
            <TouchableOpacity style={styles.locationButton}>
              <Icon name="navigate-outline" size={16} color="#FF8B47" />
            </TouchableOpacity>
          </View>
          
          {address && !isLoadingProfile && (
            <Text style={styles.addressHint}>
              ✓ Address loaded from your profile. You can edit if needed.
            </Text>
          )}
          
          {!address && !isLoadingProfile && (
            <Text style={styles.addressHint}>
              Please provide a complete address including street, barangay, city, and postal code
            </Text>
          )}
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="card-outline" size={20} color="#FF8B47" />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          
          {paymentOptions.map((option) => (
            <TouchableOpacity 
              key={option.id}
              style={[
                styles.paymentOption, 
                paymentMethod === option.id && styles.selectedPayment
              ]}
              onPress={() => setPaymentMethod(option.id)}
            >
              <View style={[styles.paymentIcon, { backgroundColor: `${option.color}15` }]}>
                <Icon 
                  name={option.icon} 
                  size={24} 
                  color={paymentMethod === option.id ? option.color : "#666"} 
                />
              </View>
              
              <View style={styles.paymentInfo}>
                <Text style={[
                  styles.paymentTitle,
                  paymentMethod === option.id && styles.selectedPaymentTitle
                ]}>
                  {option.title}
                </Text>
                <Text style={styles.paymentSubtitle}>{option.subtitle}</Text>
              </View>
              
              <View style={[
                styles.radioButton,
                paymentMethod === option.id && styles.radioButtonSelected
              ]}>
                {paymentMethod === option.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Total Section */}
        <View style={styles.totalSection}>
          <View style={styles.sectionHeader}>
            <Icon name="calculator-outline" size={20} color="#FF8B47" />
            <Text style={styles.sectionTitle}>Order Total</Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal ({items.length} items)</Text>
            <Text style={styles.totalValue}>₱{subtotal.toFixed(2)}</Text>
          </View>
          
          {/* Delivery and Installation Costs */}
          {deliveryAndInstallation.deliveryCharge > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery Charge</Text>
              <Text style={styles.totalValue}>₱{deliveryAndInstallation.deliveryCharge.toFixed(2)}</Text>
            </View>
          )}
          
          {deliveryAndInstallation.installationCost > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Installation Cost</Text>
              <Text style={styles.totalValue}>₱{deliveryAndInstallation.installationCost.toFixed(2)}</Text>
            </View>
          )}
          
          <View style={styles.totalDivider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelBold}>Total Amount</Text>
            <Text style={styles.totalAmount}>₱{total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Order Benefits */}
        <View style={styles.benefitsSection}>
          <View style={styles.benefitItem}>
            <Icon name="shield-checkmark" size={16} color="#4CAF50" />
            <Text style={styles.benefitText}>Secure Payment</Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="flash" size={16} color="#FF8B47" />
            <Text style={styles.benefitText}>Fast Delivery</Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="refresh" size={16} color="#2196F3" />
            <Text style={styles.benefitText}>Easy Returns</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={[styles.checkoutContainer, { paddingBottom: 16 + Math.max(insets.bottom, 8) }]}>
        {!address.trim() && (
          <Text style={styles.addressWarning}>
            Please enter your delivery address to continue
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (!address.trim() || isProcessing) && { opacity: 0.6 }
          ]}
          activeOpacity={0.85}
          onPress={handlePlaceOrder}
          disabled={!address.trim() || isProcessing}
        >
          <Icon name="card-outline" size={20} color="#FFFFFF" />
          <Text style={styles.placeOrderText}>
            {isProcessing ? 'Processing...' : `Place Order • ₱${total.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>
      </View>

      {/* Custom Success Modal */}
      {console.log('🎭 Modal render state:', { showSuccessModal, orderNumber })}
      <OrderSuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          // Navigate back to BuyerTabs and then to Home tab
          navigation.navigate("BuyerTabs", { screen: "Home" });
        }}
        orderNumber={orderNumber}
      />
    </SafeAreaView>
  );
}
