import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { getAdminStats } from '../../api/adminApi';

export default function AdminHome({ navigation }) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBuyers: 0,
    totalSellers: 0,
    totalOrders: 0,
    totalProducts: 0,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const fetchStats = async () => {
    try {
      const { getAdminStats } = require('../../api/adminApi');
      const response = await getAdminStats();
      if (response.success && response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const adminCards = [
    {
      id: 1,
      title: 'Manage Users',
      icon: 'people-outline',
      color: '#4CAF50',
      screen: 'UserManagement',
      description: 'View and manage all users',
    },
    {
      id: 2,
      title: 'Manage Orders',
      icon: 'receipt-outline',
      color: '#2196F3',
      screen: 'OrderManagement',
      description: 'View and manage all orders',
    },
    {
      id: 3,
      title: 'Manage Products',
      icon: 'cube-outline',
      color: '#FF9900',
      screen: 'ProductManagement',
      description: 'View and manage all products',
    },
    {
      id: 4,
      title: 'Analytics',
      icon: 'bar-chart-outline',
      color: '#9C27B0',
      screen: null,
      description: 'View system analytics',
    },
    {
      id: 5,
      title: 'Reports',
      icon: 'document-text-outline',
      color: '#FF5722',
      screen: null,
      description: 'Generate and view reports',
    },
    {
      id: 6,
      title: 'Settings',
      icon: 'settings-outline',
      color: '#607D8B',
      screen: null,
      description: 'System settings',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.adminName}>{user?.fullName || 'Administrator'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <Ionicons name="people" size={32} color="#4CAF50" />
            <Text style={styles.statsNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statsLabel}>Total Users</Text>
          </View>
          <View style={styles.statsCard}>
            <Ionicons name="cart" size={32} color="#2196F3" />
            <Text style={styles.statsNumber}>{stats.totalOrders}</Text>
            <Text style={styles.statsLabel}>Total Orders</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <Ionicons name="storefront" size={32} color="#FF9900" />
            <Text style={styles.statsNumber}>{stats.totalSellers}</Text>
            <Text style={styles.statsLabel}>Sellers</Text>
          </View>
          <View style={styles.statsCard}>
            <Ionicons name="cube" size={32} color="#9C27B0" />
            <Text style={styles.statsNumber}>{stats.totalProducts}</Text>
            <Text style={styles.statsLabel}>Products</Text>
          </View>
        </View>

        {/* Admin Functions */}
        <Text style={styles.sectionTitle}>Admin Functions</Text>
        <View style={styles.cardsContainer}>
          {adminCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.functionCard}
              onPress={() => {
                if (card.screen) {
                  navigation.navigate(card.screen);
                } else {
                  Alert.alert('Coming Soon', `${card.title} feature will be available soon!`);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: card.color + '20' }]}>
                <Ionicons name={card.icon} size={28} color={card.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  adminName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    gap: 15,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  functionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
  },
});
