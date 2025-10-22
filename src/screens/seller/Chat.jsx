import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useChat } from '../../context/ChatContext';
import { BASE_URL } from '../../api/api';
import styles from './styles/Chat.style';

export default function Chat({ navigation }) {
  const insets = useSafeAreaInsets();
  const { conversations, loading, loadConversations, error, deleteChat } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Load conversations on mount
  useEffect(() => {
    console.log('💬 Seller Chat: Loading conversations...');
    console.log('💬 Seller Chat: Navigation object:', navigation);
    console.log('💬 Seller Chat: ChatContext available:', { conversations, loading, error });
    loadConversations();
  }, []);
  
  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadConversations();
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  
  // Format conversations for seller view
  const formattedChats = conversations.map(conv => ({
    id: `chat_${conv.partnerId}`,
    partnerId: conv.partnerId,
    name: conv.partnerName || 'Unknown User',
    avatar: conv.partnerAvatar ? 
      (conv.partnerAvatar.startsWith('http') ? 
        { uri: conv.partnerAvatar } : 
        { uri: `${BASE_URL}${conv.partnerAvatar}` }
      ) : null,
    lastMessage: conv.lastMessage || 'No messages yet',
    time: formatTime(conv.lastMessageTime),
    unread: conv.unreadCount || 0,
  }));
  
  // Filter chats based on search query
  const filteredChats = formattedChats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteChat = async (item) => {
    try {
      Alert.alert(
        'Delete Chat',
        `Are you sure you want to delete this conversation with ${item.name}? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const partnerId = item.partnerId || item.id.replace('chat_', '');
                await deleteChat(partnerId);
                console.log('✅ Chat deleted successfully');
              } catch (error) {
                console.error('❌ Error deleting chat:', error);
                Alert.alert('Error', 'Failed to delete chat. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Seller Chat: Error in handleDeleteChat:', error);
      Alert.alert('Error', 'Unable to delete chat. Please try again.');
    }
  };
  
  // Render chat item
  const renderChatItem = ({ item }) => (
    <View style={styles.chatItemContainer}>
      <TouchableOpacity 
        style={styles.chatItem}
        onPress={() => navigation.getParent().navigate('ChatDetail', { 
          chatData: {
            id: item.id,
            partnerId: item.partnerId,
            shop: {
              id: item.partnerId,
              name: item.name,
              avatar: item.avatar,
              isOnline: false
            }
          }
        })}
      >
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={item.avatar} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Icon name="person" size={24} color="#999" />
            </View>
          )}
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{item.name}</Text>
            <Text style={styles.chatTime}>{item.time}</Text>
          </View>
          <Text 
            style={[styles.lastMessage, item.unread > 0 && styles.unreadMessage]} 
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteChat(item)}
        activeOpacity={0.7}
      >
        <Icon name="trash-outline" size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="chatbubbles-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No conversations yet</Text>
      <Text style={styles.emptyStateText}>
        When customers message you about your products, their conversations will appear here.
      </Text>
    </View>
  );
  
  // Show loading state
  if (loading && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerShape}>
              <Text style={styles.headerTitle}>MESSAGES</Text>
            </View>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF8B47" />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  console.log('💬 Seller Chat: Rendering chat screen...');
  console.log('💬 Seller Chat: Conversations count:', conversations.length);
  console.log('💬 Seller Chat: Loading state:', loading);
  console.log('💬 Seller Chat: Error state:', error);

  // Test if screen is rendering at all
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerShape}>
              <Text style={styles.headerTitle}>MESSAGES</Text>
            </View>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity onPress={loadConversations} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
      <View style={styles.container}>
        {/* Minimal header: only the pill-shaped title */}
        <View style={styles.header}>
          <View style={styles.headerShape}>
            <Text style={styles.headerTitle}>MESSAGES</Text>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Chat List */}
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          contentContainerStyle={filteredChats.length === 0 ? styles.emptyContainer : styles.chatList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF8B47']}
              tintColor="#FF8B47"
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </View>
    </SafeAreaView>
  );
}
