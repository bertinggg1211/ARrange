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
  StatusBar
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

  const loadMessages = async () => {
    try {
      setLoading(true);
      console.log('💬 Loading messages for partner:', chatData.partnerId);
      const response = await getMessages(chatData.partnerId);
      if (response.success) {
        const formattedMessages = response.messages.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          message: msg.message,
          timestamp: msg.timestamp, // Backend already formats this
          date: msg.date, // Backend already provides this
          isRead: msg.is_read,
          productData: msg.productData || null
        }));
        setChatMessages(formattedMessages);
        console.log('✅ Messages loaded:', formattedMessages.length);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !chatData || sending) return;
    
    const messageText = input.trim();
    setInput("");
    setSending(true);
    
    try {
      console.log('💬 Sending message to buyer:', chatData.partnerId);
      const response = await sendMessageApi(chatData.partnerId, messageText);
      
      if (response.success) {
        // Add message to local state
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
        
        console.log('✅ Message sent successfully');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setInput(messageText); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
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
            contentContainerStyle={styles.messageList}
            renderItem={({ item }) => (
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
                  <View
                    style={[
                      styles.message,
                      item.sender === "seller" ? styles.sellerMsg : styles.buyerMsg,
                    ]}
                  >
                    <Text style={[
                      styles.msgText,
                      item.sender === "seller" ? styles.sellerText : styles.buyerText
                    ]}>{item.message}</Text>
                    
                    {/* Product attachment for buyer messages */}
                    {item.sender === "buyer" && item.productData && (
                      <View style={styles.productAttachment}>
                        <View style={styles.productInfo}>
                          <Text style={styles.productName}>{item.productData.name}</Text>
                          <Text style={styles.productPrice}>${item.productData.price}</Text>
                        </View>
                        {item.productData.image && (
                          <Image 
                            source={{ uri: item.productData.image.url || item.productData.image }} 
                            style={styles.productImage}
                            resizeMode="cover"
                          />
                        )}
                      </View>
                    )}
                  </View>
                  <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>
              </View>
            )}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          style={styles.keyboardAvoidingView}
        >
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
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
    );
  }
