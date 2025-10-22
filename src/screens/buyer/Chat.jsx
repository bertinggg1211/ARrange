import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StatusBar, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useChat } from "../../context/ChatContext";
import { BASE_URL } from "../../api/api";
import styles from "./styles/Chat.style";

export default function Chat({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { chatData } = route.params || {};
  const { getChatByShopId, addMessage, getShop, markChatAsRead } = useChat();
  
  // Safe area styles - handle all edges including top
  const safeAreaStyle = {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: insets.top,       // Status bar and notch
    paddingBottom: insets.bottom, // Home indicator
    paddingLeft: insets.left,     // Left edge (landscape)
    paddingRight: insets.right,   // Right edge (landscape)
  };
  
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const flatListRef = useRef(null);
  
  useEffect(() => {
    // Load chat data from backend
    const loadChatData = async () => {
      if (chatData && (chatData.shop || chatData.partnerId)) {
        setLoading(true);
        
        // Handle case where shop object might not exist but partnerId does
        const shopId = chatData.shop?.id || chatData.partnerId;
        const shopName = chatData.shop?.name || chatData.sellerName || 'Shop';
        const shopAvatar = chatData.shop?.avatar || chatData.avatar;
        
        try {
          console.log('💬 Chat: Loading chat with shopId:', shopId);
          console.log('💬 Chat: Product data received:', chatData.productData);
          
          const chatInfo = await getChatByShopId(shopId);
          if (chatInfo && chatInfo.messages && chatInfo.messages.length > 0) {
            console.log('💬 Chat: Loading existing messages:', chatInfo.messages.length);
            setChatMessages(chatInfo.messages);
          } else {
            console.log('💬 Chat: No existing messages, showing empty chat');
            // Don't create any initial messages - let ProductDetail handle it
            setChatMessages([]);
          }
          
          // Set shop info with extracted values
          setShopInfo({
            id: shopId,
            name: shopName,
            avatar: shopAvatar
          });
          
          // Mark messages as read when opening chat
          await markChatAsRead(`chat_${shopId}`);
        } catch (error) {
          console.error('❌ Error loading chat data:', error);
          // Don't create any fallback messages - just show empty chat
          setChatMessages([]);
          setShopInfo({
            id: shopId,
            name: shopName,
            avatar: shopAvatar
          });
        } finally {
          setLoading(false);
        }
      } else {
        Alert.alert('Error', 'Unable to load chat. Please try again.');
      }
    };
    
    loadChatData();
  }, [chatData]);

  const sendMessage = async () => {
    if (!input.trim() || !chatData || sending) return;

    const messageText = input.trim();
    setInput("");
    setSending(true);

    const newMessage = { 
      id: `msg_${Date.now()}`,
      sender: "buyer", 
      message: messageText,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      date: new Date()
    };
    
    // Add to local state immediately for better UX
    setChatMessages((prev) => [...prev, newMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 100);

    try {
      const shopId = chatData.shop?.id || chatData.partnerId;
      
      // Send to backend
      await addMessage(chatData.id, newMessage);
      
      // Refresh messages from backend to get any server responses
      const chatInfo = await getChatByShopId(shopId);
      if (chatInfo) {
        setChatMessages(chatInfo.messages);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      
      // Remove the message from local state if sending failed
      setChatMessages((prev) => prev.filter(msg => msg.id !== newMessage.id));
    } finally {
      setSending(false);
    }
  };
  

  return (
    <SafeAreaView style={safeAreaStyle}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      
      <View style={styles.container}>
        {/* Chat header */}
        <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerProfile}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.loadingText}>Loading chat...</Text>
            </View>
          ) : shopInfo ? (
            <>
              <Image 
                source={shopInfo.avatar} 
                style={styles.avatar} 
              />
              <View>
                <Text style={styles.sellerName}>{shopInfo.name}</Text>
                <Text style={styles.statusText}>
                  {shopInfo.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Unable to load chat</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="call-outline" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Chat messages */}
      {loading ? (
        <View style={styles.loadingMessagesContainer}>
          <ActivityIndicator size="large" color="#FF8B47" />
          <Text style={styles.loadingMessagesText}>Loading messages...</Text>
        </View>
      ) : chatMessages.length === 0 ? (
        <View style={styles.emptyMessagesContainer}>
          <Icon name="chatbubbles-outline" size={48} color="#CCC" />
          <Text style={styles.emptyMessagesText}>No messages yet</Text>
          <Text style={styles.emptyMessagesSubtext}>Start a conversation with the seller</Text>
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
                item.sender === "buyer" ? styles.buyerContainer : styles.sellerContainer,
              ]}
            >
              {item.sender === "seller" && shopInfo && (
                <Image 
                  source={shopInfo.avatar} 
                  style={styles.messageAvatar} 
                />
              )}
              
              <View style={styles.messageContent}>
                {/* Product attachment (if exists) */}
                {(() => {
                  console.log('🔍 Rendering message item:', item);
                  console.log('🔍 Item has productData:', !!item.productData);
                  if (item.productData) {
                    console.log('🔍 ProductData content:', item.productData);
                    console.log('🔍 ProductData image:', item.productData.image);
                    console.log('🔍 ProductData image type:', typeof item.productData.image);
                  }
                  return null;
                })()}
                {item.productData && (
                  <View style={styles.productAttachment}>
                    <View style={styles.productAttachmentHeader}>
                      <Icon name="cube-outline" size={16} color="#FF8B47" />
                      <Text style={styles.productAttachmentTitle}>Product Inquiry</Text>
                    </View>
                    <View style={styles.productAttachmentContent}>
                      {(() => {
                        console.log('🖼️ Product image data:', item.productData.image);
                        console.log('🖼️ Image type:', typeof item.productData.image);
                        console.log('🖼️ Full product data:', item.productData);
                        
                        // Handle both string URLs and Cloudinary objects
                        let imageUri = null;
                        
                        if (item.productData.image) {
                          if (typeof item.productData.image === 'string') {
                            // Handle string URLs
                            if (item.productData.image.startsWith('http')) {
                              imageUri = item.productData.image;
                            } else if (item.productData.image.startsWith('/')) {
                              imageUri = `${BASE_URL}${item.productData.image}`;
                            } else {
                              imageUri = `${BASE_URL}/${item.productData.image}`;
                            }
                          } else if (typeof item.productData.image === 'object' && item.productData.image.url) {
                            // Handle Cloudinary objects with url property
                            imageUri = item.productData.image.url;
                            console.log('🖼️ Using Cloudinary URL from object:', imageUri);
                          }
                        }
                        
                        console.log('🖼️ Final image URI:', imageUri);
                        
                        if (imageUri) {
                          return (
                            <Image 
                              source={{ uri: imageUri }} 
                              style={styles.productAttachmentImage}
                              resizeMode="cover"
                              onError={(error) => {
                                console.log('🖼️ Image load error:', error);
                                console.log('🖼️ Failed URI:', imageUri);
                              }}
                              onLoad={() => console.log('🖼️ Image loaded successfully:', imageUri)}
                            />
                          );
                        } else {
                          console.log('🖼️ Using placeholder - no valid image URI');
                          console.log('🖼️ Image value:', item.productData.image);
                          console.log('🖼️ Image type:', typeof item.productData.image);
                          return (
                            <View style={[styles.productAttachmentImage, styles.productAttachmentImagePlaceholder]}>
                              <Icon name="image-outline" size={24} color="#ccc" />
                            </View>
                          );
                        }
                      })()}
                      <View style={styles.productAttachmentInfo}>
                        <Text style={styles.productAttachmentName} numberOfLines={2}>
                          {item.productData.name || 'Product Name'}
                        </Text>
                        <Text style={styles.productAttachmentPrice}>
                          {item.productData.price || 'Price not available'}
                        </Text>
                        {item.productData.category && (
                          <Text style={styles.productAttachmentCategory}>
                            {item.productData.category}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}
                
                {/* Message bubble */}
                <View
                  style={[
                    styles.message,
                    item.sender === "buyer" ? styles.buyerMsg : styles.sellerMsg,
                    item.productData && styles.messageWithAttachment
                  ]}
                >
                  <Text style={[
                    styles.msgText,
                    item.sender === "buyer" ? styles.buyerText : styles.sellerText
                  ]}>{item.message}</Text>
                </View>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Input box */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={[styles.keyboardAvoidingView, { paddingBottom: insets.bottom }]}
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
            editable={!sending}
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              (!input.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={20} color={input.trim() ? "#fff" : "#ccc"} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
