import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useChat } from '../../context/ChatContext';
import { sendMessage as sendMessageApi, getMessages } from '../../api/chatApi';
import { BASE_URL } from '../../api/api';
import styles from './styles/ChatDetail.style';

export default function ChatDetail({ route, navigation }) {
  const { chatData } = route.params || {};
  const { markChatAsRead } = useChat();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (chatData && chatData.shop) {
      setShopInfo(chatData.shop);
      loadMessages();
      // Mark messages as read
      if (chatData.partnerId) {
        markChatAsRead(`chat_${chatData.partnerId}`);
      }
      
    }
  }, [chatData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (chatData && chatData.partnerId) {
        loadMessages(false);
      }
    });

    return unsubscribe;
  }, [navigation, chatData]);

  const loadMessages = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const response = await getMessages(chatData.partnerId);
      if (response.success) {
        console.log('📨 Seller ChatDetail: Received messages:', response.messages.length);
        response.messages.forEach((msg, idx) => {
          console.log(`📨 Message ${idx + 1}:`, {
            id: msg.id,
            message: msg.message?.substring(0, 50),
            sender: msg.sender,
            hasProductData: !!msg.productData
          });
        });
        
        const formattedMessages = response.messages.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          message: msg.message,
          timestamp: msg.timestamp,
          date: msg.date,
          isRead: msg.is_read,
          productData: msg.productData || null,
          orderNumber: msg.productData?.orderNumber || null,
          isOrderNotification: msg.productData?.isOrderNotification || false
        }));
        
        console.log('✅ Seller ChatDetail: Formatted messages:', formattedMessages.length);
        formattedMessages.forEach((msg, idx) => {
          console.log(`✅ Formatted ${idx + 1}:`, {
            id: msg.id,
            message: msg.message?.substring(0, 50),
            sender: msg.sender
          });
        });
        
        setChatMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      if (showLoading) {
        Alert.alert('Error', 'Failed to load messages. Please try again.');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMessages(false);
    } catch (error) {
      console.error('Error refreshing chat:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !chatData || sending) return;
    
    const messageText = input.trim();
    setInput("");
    setSending(true);
    
    try {
      const response = await sendMessageApi(chatData.partnerId, messageText);
      
      if (response.success) {
        const newMessage = {
          id: response.message.id,
          sender: "seller",
          message: messageText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(),
          isRead: false
        };
        setChatMessages((prev) => [...prev, newMessage]);
        
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setInput(messageText);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={{ flex: 1 }}
      >
      <View style={styles.container}>
        {/* Chat header */}
        <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerProfile}>
            {shopInfo && (
              <>
                {shopInfo.avatar ? (
                  <Image source={shopInfo.avatar} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Icon name="person" size={24} color="#999" />
                  </View>
                )}
                <View>
                  <Text style={styles.sellerName}>{shopInfo.name}</Text>
                  <Text style={styles.statusText}>
                    {shopInfo.isOnline ? 'Online' : 'Customer'}
                  </Text>
                </View>
              </>
            )}
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="call-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>
        {/* Chat messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF8B47" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ 
              paddingHorizontal: 16, 
              paddingVertical: 8,
              flexGrow: 0  // Don't stretch to fill space!
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FF8B47"
                colors={['#FF8B47']}
              />
            }
            renderItem={({ item }) => {
              console.log('🎨 Rendering message:', {
                id: item.id,
                message: item.message?.substring(0, 40),
                hasProductData: !!item.productData,
                sender: item.sender
              });
              
              return (
              <View
                style={[
                  styles.messageContainer,
                  item.sender === "seller" ? styles.sellerContainer : styles.buyerContainer,
                ]}
              >
                  {item.sender === "buyer" && (
                    shopInfo?.avatar ? (
                      <Image source={shopInfo.avatar} style={styles.messageAvatar} />
                    ) : (
                      <View style={[styles.messageAvatar, styles.avatarPlaceholder]}>
                        <Icon name="person" size={16} color="#999" />
                      </View>
                    )
                  )}
                  <View style={styles.messageContent}>
                    {/* Product attachment ABOVE message text (only show if NOT a review request) */}
                    {item.productData && !item.productData.isReviewRequest && (
                      <View style={styles.productAttachment}>
                        {item.productData.image && (
                          <Image 
                            source={{ uri: item.productData.image }} 
                            style={styles.productImage}
                            resizeMode="cover"
                            onError={(error) => {
                              console.log('❌ Seller ChatDetail: Image load error:', error.nativeEvent.error);
                              console.log('❌ Failed image URL:', item.productData.image);
                            }}
                            onLoad={() => console.log('✅ Seller ChatDetail: Image loaded successfully:', item.productData.image)}
                          />
                        )}
                        <View style={styles.productInfo}>
                          <Text style={styles.productName}>{item.productData.name}</Text>
                          <Text style={styles.productPrice}>{item.productData.price}</Text>
                        </View>
                      </View>
                    )}
                    
                    {/* Message text bubble */}
                    <View
                      style={[
                        styles.message,
                        item.sender === "seller" ? styles.sellerMsg : styles.buyerMsg,
                      ]}
                    >
                      <Text style={[
                        styles.msgText,
                        item.sender === "seller" ? styles.sellerText : styles.buyerText
                      ]}>
                        {item.message || '[No message text]'}
                      </Text>
                      
                      {/* Review Request Button INSIDE message bubble */}
                      {item.productData?.isReviewRequest && (
                        <TouchableOpacity 
                          style={styles.reviewRequestButton}
                          activeOpacity={0.8}
                        >
                          <Icon name="star" size={16} color="#FFD700" />
                          <Text style={styles.reviewRequestButtonText}>
                            {item.productData.reviewType === 'product' ? 'Rate Product' : 'Rate Shop'}
                          </Text>
                          <Icon name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.emptyMessages}>
                <Icon name="chatbubbles-outline" size={48} color="#ccc" />
                <Text style={styles.emptyMessagesText}>No messages yet</Text>
                <Text style={styles.emptyMessagesSubtext}>Start the conversation!</Text>
              </View>
            )}
          />
        )}
        {/* Input box */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Icon name="add-circle-outline" size={24} color="#777" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={20} color={input.trim() && !sending ? "#fff" : "#ccc"} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

