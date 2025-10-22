import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ScrollView, Image, StatusBar, Platform } from 'react-native';
import { useCart } from '../../context/CartContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { BASE_URL } from '../../api/api';
import styles from './styles/Cart.style';

const Cart = ({ navigation }) => {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const subtotal = cart.reduce((sum, item) => {
    const price = Number(item?.price || item?.product?.price) || 0;
    const qty = Number(item?.quantity) || 1;
    return sum + price * qty;
  }, 0);
  const total = subtotal;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    navigation.navigate('Checkout');
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      Alert.alert(
        'Remove Item',
        'Remove this item from cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', onPress: () => removeFromCart(itemId) }
        ]
      );
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleQuantityIncrease = (item) => {
    const currentQuantity = item.quantity;
    const stockQuantity = item.product?.stockQuantity || item.stockQuantity || 999; // fallback to 999 if no stock info
    
    if (currentQuantity >= stockQuantity) {
      Alert.alert(
        'Stock Limit Reached',
        `Only ${stockQuantity} item${stockQuantity === 1 ? '' : 's'} available in stock.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    handleQuantityChange(item.productId || item.id, currentQuantity + 1);
  };

  const getImageSource = (img) => {
    if (typeof img === 'string') return { uri: img };
    if (typeof img === 'number') return img; // local require
    return null;
  };

  const getColors = (it) => {
    if (Array.isArray(it?.colorOptions) && it.colorOptions.length > 0) {
      return it.colorOptions.slice(0, 4);
    }
    // fallback themed palette
    return ['#FF8B47', '#1A1A1A', '#E0E0E0'];
  };

  const renderCartItem = ({ item }) => {
    // Get the main product image - handle both backend and local cart formats
    const getProductImage = () => {
      // For backend cart items (has product.images array)
      if (item.product && item.product.images && item.product.images.length > 0) {
        const mainImage = item.product.images[0];
        
        if (typeof mainImage === 'string') {
          // Check if it's a relative URL and convert to full URL
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
          // Handle Cloudinary object format
          return { uri: mainImage.url };
        }
        return mainImage;
      }
      
      // For local cart items (has image directly)
      if (item.image) {
        return getImageSource(item.image);
      }
      
      return null;
    };

    const productImage = getProductImage();

    return (
      <View style={styles.modernCartItem}>
        {/* Product Image */}
        <View style={styles.modernImageContainer}>
          <Image 
            source={productImage || require('../../images/products/chandelier1.jpg')} 
            style={styles.modernItemImage}
            defaultSource={require('../../images/products/chandelier1.jpg')}
          />
        </View>

      {/* Product Info */}
      <View style={styles.modernItemInfo}>
        <Text style={styles.modernItemName} numberOfLines={2}>
          {item.product?.name || item.name}
        </Text>
        <Text style={styles.modernItemCategory}>
          {item.product?.category || item.category || 'Lighting'}
        </Text>
          {/* Color swatches */}
          <View style={styles.colorRow}>
            {getColors(item).map((c, idx) => (
              <View key={idx} style={[styles.colorDot, { backgroundColor: c }]} />
            ))}
          </View>
         <Text style={styles.modernItemPrice} numberOfLines={1}>
           ₱{(Number(item?.price || item.product?.price) || 0).toFixed(2)}
         </Text>
         
         {/* Stock Indicator */}
         <View style={styles.stockIndicator}>
           <Text style={styles.stockText}>
             Stock: {item.product?.stockQuantity || item.stockQuantity || 'N/A'}
           </Text>
         </View>
      </View>

      {/* Quantity Controls */}
      <View style={styles.modernQuantityContainer}>
        <TouchableOpacity 
          style={styles.modernQuantityBtn}
          onPress={() => handleQuantityChange(item.productId || item.id, item.quantity - 1)}
        >
          <Icon name="remove" size={16} color="#666" />
        </TouchableOpacity>
        
        <Text style={styles.modernQuantityText}>{item.quantity}</Text>
        
        <TouchableOpacity 
          style={[
            styles.modernQuantityBtn, 
            styles.modernQuantityBtnAdd,
            (item.quantity >= (item.product?.stockQuantity || item.stockQuantity || 999)) && styles.disabledButton
          ]}
          onPress={() => handleQuantityIncrease(item)}
          disabled={item.quantity >= (item.product?.stockQuantity || item.stockQuantity || 999)}
        >
          <Icon 
            name="add" 
            size={16} 
            color={item.quantity >= (item.product?.stockQuantity || item.stockQuantity || 999) ? "#999" : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </View>

      {/* Delete Button */}
      <TouchableOpacity 
        style={styles.modernDeleteBtn}
        onPress={() => {
          Alert.alert(
            'Remove Item',
            'Remove this item from cart?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', onPress: () => removeFromCart(item.productId || item.id) }
            ]
          );
        }}
      >
        <Icon name="trash-outline" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {/* Icon with glow effect */}
      <View style={styles.emptyIconWrapper}>
        <View style={styles.emptyIconGlow} />
        <View style={styles.emptyIconContainer}>
          <Icon name="bag-outline" size={80} color="#FF8B47" />
          <View style={styles.emptyIconBadge}>
            <Icon name="add" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.emptyContent}>
        <Text style={styles.premiumEmptyTitle}>Your cart is empty</Text>
        <Text style={styles.premiumEmptySubtitle}>
          Discover amazing lighting products and add them to your cart to get started!
        </Text>

        {/* Benefits list */}
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Icon name="flash" size={16} color="#FF8B47" />
            <Text style={styles.benefitText}>Fast & Free Delivery</Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="shield-checkmark" size={16} color="#FF8B47" />
            <Text style={styles.benefitText}>Quality Guaranteed</Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="card" size={16} color="#FF8B47" />
            <Text style={styles.benefitText}>Secure Payment</Text>
          </View>
        </View>
      </View>

      {/* Shop button */}
      <TouchableOpacity 
        style={styles.premiumShopButton}
        onPress={() => navigation.navigate('Home')}
      >
        <View style={styles.shopButtonGradient}>
          <Icon name="storefront" size={22} color="#FFFFFF" />
          <Text style={styles.premiumShopText}>Start Shopping</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderOrderSummary = () => (
    <View style={styles.modernSummary}>
      <View style={styles.modernSummaryRow}>
        <Text style={styles.modernSummaryLabel}>Subtotal ({cart.length} items)</Text>
        <Text style={styles.modernSummaryValue}>₱{subtotal.toFixed(2)}</Text>
      </View>
      
      
      <View style={[styles.modernSummaryRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' }]}>
        <Text style={styles.modernSummaryTotal}>Total</Text>
        <Text style={styles.modernSummaryTotalValue}>₱{total.toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.modernContainer, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <TouchableOpacity 
          style={styles.modernBackButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        
        <Text style={styles.modernHeaderTitle}>Shopping Cart</Text>
        
        <View style={styles.modernCartIcon}>
          {cart.length > 0 && (
            <View style={styles.cartCountContainer}>
              <Text style={styles.cartCountText}>{cart.length}</Text>
            </View>
          )}
        </View>
      </View>

      {cart.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView style={styles.modernContentContainer} showsVerticalScrollIndicator={false}>
          {/* Cart Items */}
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={item => item.id.toString()}
            style={styles.modernCartList}
            scrollEnabled={false}
          />

          {/* Discount Section */}
          <View style={styles.discountSection}>
            <Text style={styles.discountLabel}>Have a discount code?</Text>
            <TouchableOpacity style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>

          {/* Order Summary */}
          {renderOrderSummary()}
        </ScrollView>
      )}

      {/* Checkout Button */}
      {cart.length > 0 && (
        <View style={styles.checkoutContainer}>
          <TouchableOpacity 
            style={styles.modernCheckoutButton}
            onPress={handleCheckout}
          >
            <Icon name="card-outline" size={20} color="#FFFFFF" />
            <Text style={styles.modernCheckoutText}>
              Checkout • ₱{total.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};


export default Cart;