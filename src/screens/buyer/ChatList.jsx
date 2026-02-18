import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  StatusBar, 
  Image,
  Platform,
  ScrollView,
  Dimensions,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useChat } from "../../context/ChatContext";
import { BASE_URL } from "../../api/api";
import styles from "./styles/ChatList.style";

const { width } = Dimensions.get('window');

export default function ChatList({ navigation }) {
  const insets = useSafeAreaInsets();
  const { conversations, loading, loadConversations, error, markChatAsRead, deleteChat } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  
  // Refresh conversations when screen comes into focus
  // Only use useFocusEffect to avoid double loading
  useFocusEffect(
    React.useCallback(() => {
      console.log('💬 Buyer ChatList: Screen focused, loading conversations...');
      loadConversations();
    }, [loadConversations])
  );

  
  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
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

  // Format conversations for buyer view - useMemo to prevent recreating on every render
  const formattedChats = React.useMemo(() => {
    return conversations.map(conv => {
      // Handle avatar URL properly
      let avatarSource = null;
      if (conv.partnerAvatar) {
        const avatarUrl = conv.partnerAvatar.startsWith('http') 
          ? conv.partnerAvatar 
          : conv.partnerAvatar.startsWith('/') 
            ? `${BASE_URL}${conv.partnerAvatar}`
            : `${BASE_URL}/${conv.partnerAvatar}`;
        avatarSource = { uri: avatarUrl };
      }
      
      return {
        id: `chat_${conv.partnerId}`,
        partnerId: conv.partnerId,
        sellerName: conv.partnerName || 'Unknown Seller',
        avatar: avatarSource,
        lastMessage: conv.lastMessage || 'No messages yet',
        timestamp: formatTime(conv.lastMessageTime),
        unreadCount: conv.unreadCount || 0,
        isOnline: conv.isOnline || false,
        isActive: true,
        shop: {
          id: conv.partnerId,
          name: conv.partnerName,
          avatar: avatarSource,
          isOnline: conv.isOnline || false
        }
      };
    });
  }, [conversations]);
  
  // Filter chats based on search query - useMemo to prevent recalculating
  const filteredChats = React.useMemo(() => {
    if (!searchQuery.trim()) return formattedChats;
    
    return formattedChats.filter(chat => 
      chat.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [formattedChats, searchQuery]);
  
  // Handle chat navigation
  const handleChatPress = (item) => {
    try {
      console.log('💬 Opening chat with:', item.sellerName, 'unread count:', item.unreadCount);
      
      // Navigate to chat (marking as read happens in Chat.jsx when it loads)
      if (navigation.getParent) {
        const parentNav = navigation.getParent();
        if (parentNav) {
          parentNav.navigate("Chat", { chatData: item });
        } else {
          navigation.navigate("Chat", { chatData: item });
        }
      } else {
        navigation.navigate("Chat", { chatData: item });
      }
    } catch (error) {
      console.error('❌ ChatList: Error in handleChatPress:', error);
      Alert.alert('Navigation Error', 'Unable to open chat. Please try again.');
    }
  };

  const handleDeleteChat = async (item) => {
    try {
      Alert.alert(
        'Delete Chat',
        `Are you sure you want to delete this conversation with ${item.sellerName}? This action cannot be undone.`,
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
      console.error('❌ ChatList: Error in handleDeleteChat:', error);
      Alert.alert('Error', 'Unable to delete chat. Please try again.');
    }
  };

  // Render chat item
  const renderChatItem = ({ item }) => (
    <View style={styles.chatItemContainer}>
      <TouchableOpacity 
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={item.avatar} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Icon name="storefront" size={24} color="#999" />
            </View>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{item.sellerName}</Text>
            <Text style={styles.chatTime}>{item.timestamp}</Text>
          </View>
          <Text 
            style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]} 
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
        When you message sellers about their products, your conversations will appear here.
      </Text>
    </View>
  );
  
  // Show loading state
  if (loading && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        {/* Modern header with pill shape */}
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
