import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  FlatList,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles/ProductDetail.style';

// Sample product data
const productData = {
  id: '1',
  name: 'Crystal Chandelier',
  price: '₱12,500',
  description: 'Elegant crystal chandelier with 8 lights, perfect for dining rooms and entryways. Features high-quality crystal prisms that create beautiful light reflections.',
  images: [
    require('../../images/products/chandelier1.jpg'),
    require('../../images/products/chandelier2.jpg'),
    require('../../images/products/chandelier1.jpg'),
  ],
  rating: 4.8,
  reviews: 24,
  sold: 18,
  stock: 5,
  views: 245,
  category: 'Chandeliers',
  dimensions: '60cm x 60cm x 80cm',
  weight: '8.5 kg',
  material: 'Crystal, Metal',
  warranty: '1 Year',
  status: 'active',
  dateAdded: '10 Aug 2025',
  specifications: [
    { name: 'Bulb Type', value: 'E14' },
    { name: 'Number of Bulbs', value: '8' },
    { name: 'Voltage', value: '220-240V' },
    { name: 'Style', value: 'Modern' },
    { name: 'Installation', value: 'Professional recommended' },
  ]
};

// Sample order data
const recentOrders = [
  {
    id: 'order1',
    customer: 'John Doe',
    date: '15 Sep 2025',
    amount: '₱12,500',
    status: 'Shipped',
    address: 'Manila, Philippines'
  },
  {
    id: 'order2',
    customer: 'Jane Smith',
    date: '14 Sep 2025',
    amount: '₱12,500',
    status: 'Processing',
    address: 'Cebu City, Philippines'
  },
];

export default function ProductDetail({ route, navigation }) {
  // In a real app, you would get the product from route.params
  // const { product } = route.params;
  const product = productData; // Using sample data for now
  
  const [activeTab, setActiveTab] = useState('Details');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Render order item
  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => navigation.navigate('Orders')}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderCustomer}>{item.customer}</Text>
        <Text style={styles.orderDate}>{item.date}</Text>
      </View>
      <View style={styles.orderDetails}>
        <Text style={styles.orderAmount}>{item.amount}</Text>
        <View style={[styles.orderStatus, 
          item.status === 'Delivered' ? styles.statusDelivered : 
          item.status === 'Shipped' ? styles.statusShipped : 
          styles.statusProcessing]}>
          <Text style={styles.orderStatusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.orderAddress}>{item.address}</Text>
    </TouchableOpacity>
  );

  // Handle product status toggle
  const toggleProductStatus = () => {
    Alert.alert(
      'Change Product Status',
      `Are you sure you want to ${product.status === 'active' ? 'deactivate' : 'activate'} this product?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            // In a real app, you would update the product status in your database
            Alert.alert('Success', `Product ${product.status === 'active' ? 'deactivated' : 'activated'} successfully`);
          } 
        },
      ]
    );
  };

  // Handle product deletion
  const handleDeleteProduct = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // In a real app, you would delete the product from your database
            Alert.alert('Success', 'Product deleted successfully');
            navigation.goBack();
          } 
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => {
            Alert.alert(
              'Product Options',
              'Choose an action',
              [
                { text: 'Edit Product', onPress: () => navigation.navigate('Upload', { product }) },
                { text: `${product.status === 'active' ? 'Deactivate' : 'Activate'} Product`, onPress: toggleProductStatus },
                { text: 'Delete Product', onPress: handleDeleteProduct, style: 'destructive' },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
        >
          <Icon name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View style={styles.imageContainer}>
          <Image 
            source={product.images[activeImageIndex]} 
            style={styles.mainImage} 
            resizeMode="cover"
          />
          <View style={styles.imageIndicators}>
            {product.images.map((_, index) => (
              <TouchableOpacity 
                key={index}
                style={[styles.indicator, activeImageIndex === index && styles.activeIndicator]}
                onPress={() => setActiveImageIndex(index)}
              />
            ))}
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <View>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>{product.price}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {product.status === 'active' ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Product Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.statValue}>{product.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="cart-outline" size={16} color="#FF8B47" />
              <Text style={styles.statValue}>{product.sold}</Text>
              <Text style={styles.statLabel}>Sold</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="eye-outline" size={16} color="#666" />
              <Text style={styles.statValue}>{product.views}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="cube-outline" size={16} color="#4CAF50" />
              <Text style={styles.statValue}>{product.stock}</Text>
              <Text style={styles.statLabel}>In Stock</Text>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            {['Details', 'Specifications', 'Orders'].map(tab => (
              <TouchableOpacity 
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'Details' && (
              <View>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{product.description}</Text>
                
                <Text style={styles.sectionTitle}>Product Information</Text>
                <View style={styles.infoTable}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Category</Text>
                    <Text style={styles.infoValue}>{product.category}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Height</Text>
                    <Text style={styles.infoValue}>{product.height ? `${product.height} cm` : 'Not specified'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Width</Text>
                    <Text style={styles.infoValue}>{product.width ? `${product.width} cm` : 'Not specified'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Weight</Text>
                    <Text style={styles.infoValue}>{product.weight}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Material</Text>
                    <Text style={styles.infoValue}>{product.material}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Warranty</Text>
                    <Text style={styles.infoValue}>{product.warranty}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date Added</Text>
                    <Text style={styles.infoValue}>{product.dateAdded}</Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'Specifications' && (
              <View>
                <Text style={styles.sectionTitle}>Technical Specifications</Text>
                <View style={styles.infoTable}>
                  {product.specifications.map((spec, index) => (
                    <View key={index} style={styles.infoRow}>
                      <Text style={styles.infoLabel}>{spec.name}</Text>
                      <Text style={styles.infoValue}>{spec.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'Orders' && (
              <View>
                <Text style={styles.sectionTitle}>Recent Orders</Text>
                {recentOrders.length > 0 ? (
                  <FlatList
                    data={recentOrders}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                  />
                ) : (
                  <Text style={styles.noOrdersText}>No orders for this product yet.</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('Upload', { product })}
        >
          <Icon name="create-outline" size={20} color="#FFFFFF" />
          <Text style={styles.editButtonText}>Edit Product</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}