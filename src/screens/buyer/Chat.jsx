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
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useChat } from "../../context/ChatContext";
import { BASE_URL } from "../../api/api";
import { markMessagesAsRead } from "../../api/chatApi";
import { submitProductReview, submitShopReview } from "../../api/reviewApi";
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
  
  // Inline rating state - track which message is being rated
  const [ratingStates, setRatingStates] = useState({});
  // Format: { messageId: { productRating: 0, shopRating: 0, comment: '', submitting: false } }
  
  const flatListRef = useRef(null);
  
  // Store chatData in a ref to avoid re-render triggers
  const chatDataRef = useRef(chatData);
  
  // Load chat data when component mounts - only run once
  useEffect(() => {
    const data = chatDataRef.current;
    if (data && (data.shop || data.partnerId)) {
      const shopId = data.shop?.id || data.partnerId;
      const shopName = data.shop?.name || data.sellerName || 'Shop';
      const shopAvatar = data.shop?.avatar || data.avatar;
      
      // Set shop info immediately
      setShopInfo({
        id: shopId,
        name: shopName,
        avatar: shopAvatar,
        isOnline: data.shop?.isOnline || data.isOnline || false
      });
    }
  }, []); // Empty dependency - only run on mount
  
  // Refresh messages whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      
      const loadMessages = async () => {
        const data = chatDataRef.current;
        if (!data || !(data.shop || data.partnerId)) {
          console.error('❌ Chat: Missing chatData or partnerId');
          Alert.alert('Error', 'Unable to load chat. Missing chat information.');
          navigation.goBack();
          return;
        }
        
        setLoading(true);
        const shopId = data.shop?.id || data.partnerId;
        
        try {
          console.log('💬 Buyer Chat: Loading messages for shopId:', shopId);
          
          const chatInfo = await getChatByShopId(shopId);
          
          if (!isActive) return; // Component unmounted
          
          // Check if there was an error loading the chat
          if (chatInfo && chatInfo.error) {
            console.warn('⚠️ Chat loaded with error:', chatInfo.error);
            setChatMessages([]);
            // Don't show alert for minor errors, just log it
          } else if (chatInfo && chatInfo.messages) {
            console.log('💬 Buyer Chat: Loaded messages:', chatInfo.messages.length);
            setChatMessages(chatInfo.messages);
          } else {
            console.log('💬 Buyer Chat: No messages found, initializing empty array');
            setChatMessages([]);
          }
          
          // Mark messages as read (only if we have messages)
          if (chatInfo && chatInfo.messages && chatInfo.messages.length > 0) {
            try {
              console.log('📖 Marking messages as read for seller:', shopId);
              await markMessagesAsRead(shopId);
              await markChatAsRead(`chat_${shopId}`);
              console.log('✅ Messages marked as read');
            } catch (error) {
              console.error('❌ Error marking messages as read:', error);
              // Non-critical error, continue
            }
          }
          
        } catch (error) {
          console.error('❌ Error loading chat messages:', error);
          if (isActive) {
            setChatMessages([]);
            // Only show alert for critical errors
            Alert.alert(
              'Error Loading Chat',
              error.message || 'Unable to load messages. Please try again.',
              [
                {
                  text: 'Go Back',
                  onPress: () => navigation.goBack()
                },
                {
                  text: 'Retry',
                  onPress: () => loadMessages()
                }
              ]
            );
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };
      
      loadMessages();
      
      return () => {
        isActive = false;
      };
    }, [getChatByShopId, markChatAsRead])
    // Removed chatData and navigation from dependencies to prevent re-renders
  );

  // Initialize rating states for all review request messages
  useEffect(() => {
    const reviewMessages = chatMessages.filter(msg => msg.productData?.isReviewRequest);
    
    if (reviewMessages.length > 0) {
      setRatingStates(prevStates => {
        const newStates = { ...prevStates };
        let hasChanges = false;
        
        reviewMessages.forEach(msg => {
          if (!newStates[msg.id]) {
            newStates[msg.id] = {
              rating: 0,
              comment: '',
              submitting: false,
              submitted: false
            };
            hasChanges = true;
          }
        });
        
        return hasChanges ? newStates : prevStates;
      });
    }
  }, [chatMessages]);

  // Update rating for a message
  const updateRating = (messageId, rating) => {
    setRatingStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        rating: rating
      }
    }));
  };

  // Update comment for a message
  const updateComment = (messageId, comment) => {
    setRatingStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        comment: comment
      }
    }));
  };

  // Submit inline review
  const submitInlineReview = async (messageId, productData) => {
    const state = ratingStates[messageId];
    
    if (!state || state.rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    // Try to get orderId from multiple possible fields
    const orderId = productData.orderId || productData.orderNumber || productData.order_id;
    
    console.log('🔍 Debug review submission:');
    console.log('  - Message ID:', messageId);
    console.log('  - Review Type:', productData.reviewType);
    console.log('  - Product Data:', JSON.stringify(productData, null, 2));
    console.log('  - Extracted orderId:', orderId);
    console.log('  - Rating:', state.rating);
    console.log('  - Comment:', state.comment);
    
    if (!orderId) {
      console.error('❌ Missing orderId! Available fields:', Object.keys(productData));
      Alert.alert(
        'Order Information Missing',
        'Unable to submit review. The order information is not available. Please try again or contact support.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate product/shop ID
    if (productData.reviewType === 'product' && !productData.id) {
      console.error('❌ Missing product ID for product review');
      Alert.alert('Error', 'Product information is missing. Unable to submit review.');
      return;
    }
    
    if (productData.reviewType === 'shop' && !productData.shopId) {
      console.error('❌ Missing shop ID for shop review');
      Alert.alert('Error', 'Shop information is missing. Unable to submit review.');
      return;
    }

    // Set submitting state
    setRatingStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        submitting: true
      }
    }));

    try {
      console.log('📝 Submitting inline review:', { 
        messageId,
        reviewType: productData.reviewType,
        rating: state.rating,
        orderId,
        productId: productData.id,
        shopId: productData.shopId
      });

      let response;
      if (productData.reviewType === 'product') {
        console.log('⭐ Submitting PRODUCT review with:', {
          productId: productData.id,
          orderId: orderId,
          rating: state.rating,
          comment: state.comment.trim() || null
        });
        
        response = await submitProductReview(
          productData.id,
          orderId,
          state.rating,
          state.comment.trim() || null,
          null, // reviewTitle
          [] // images
        );
      } else if (productData.reviewType === 'shop') {
        console.log('⭐ Submitting SHOP review with:', {
          shopId: productData.shopId,
          orderId: orderId,
          rating: state.rating,
          comment: state.comment.trim() || null
        });
        
        response = await submitShopReview(
          productData.shopId,
          orderId,
          state.rating,
          null, // communication rating
          null, // shipping speed rating
          null, // product quality rating
          state.comment.trim() || null,
          null // reviewTitle
        );
      }

      if (response.success) {
        Alert.alert(
          'Review Submitted! ⭐',
          'Thank you for your feedback!',
          [{ text: 'OK' }]
        );
        
        // Mark as submitted
        setRatingStates(prev => ({
          ...prev,
          [messageId]: {
            ...prev[messageId],
            submitting: false,
            submitted: true
          }
        }));
      }
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'Unable to submit review. Please try again.',
        [{ text: 'OK' }]
      );
      
      setRatingStates(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          submitting: false
        }
      }));
    }
  };

  const sendMessage = async () => {
    const data = chatDataRef.current;
    if (!input.trim() || !data || sending) return;

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
      const shopId = data.shop?.id || data.partnerId;
      
      // Send to backend
      await addMessage(data.id, newMessage);
      
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
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={{ flex: 1 }}
      >
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
              {shopInfo.avatar ? (
                <Image 
                  source={shopInfo.avatar} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Icon name="storefront" size={24} color="#999" />
                </View>
              )}
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
          renderItem={({ item }) => {
            // Get rating state (will be initialized by useEffect)
            const currentRating = ratingStates[item.id] || { rating: 0, comment: '', submitting: false, submitted: false };
            
            return (
            <View
              style={[
                styles.messageContainer,
                item.sender === "buyer" ? styles.buyerContainer : styles.sellerContainer,
              ]}
            >
              {item.sender === "seller" && shopInfo && (
                shopInfo.avatar ? (
                  <Image 
                    source={shopInfo.avatar} 
                    style={styles.messageAvatar} 
                  />
                ) : (
                  <View style={[styles.messageAvatar, styles.avatarPlaceholder]}>
                    <Icon name="storefront" size={16} color="#999" />
                  </View>
                )
              )}
              
              <View style={styles.messageContent}>
                {/* Product/Review attachment (if exists) */}
                {item.productData && (
                  <View style={styles.productAttachment}>
                    <View style={styles.productAttachmentHeader}>
                      <Icon 
                        name={item.productData.isReviewRequest ? "star" : "cube-outline"} 
                        size={16} 
                        color={item.productData.isReviewRequest ? "#FFD700" : "#FF8B47"} 
                      />
                      <Text style={styles.productAttachmentTitle}>
                        {item.productData.isReviewRequest 
                          ? (item.productData.reviewType === 'product' ? 'Rate Product' : 'Rate Shop')
                          : 'Product Inquiry'
                        }
                      </Text>
                    </View>
                    
                    {/* Show product details only for product reviews or product inquiries */}
                    {item.productData.reviewType !== 'shop' && (
                      <View style={styles.productAttachmentContent}>
                        {(() => {
                          // Handle both string URLs and Cloudinary objects
                          let imageUri = null;
                          
                          if (item.productData.image) {
                            if (typeof item.productData.image === 'string') {
                              if (item.productData.image.startsWith('http')) {
                                imageUri = item.productData.image;
                              } else if (item.productData.image.startsWith('/')) {
                                imageUri = `${BASE_URL}${item.productData.image}`;
                              } else {
                                imageUri = `${BASE_URL}/${item.productData.image}`;
                              }
                            } else if (typeof item.productData.image === 'object' && item.productData.image.url) {
                              imageUri = item.productData.image.url;
                            }
                          }
                          
                          if (imageUri) {
                            return (
                              <Image 
                                source={{ uri: imageUri }} 
                                style={styles.productAttachmentImage}
                                resizeMode="cover"
                              />
                            );
                          } else {
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
                    )}
                    
                    {/* INLINE RATING INTERFACE for Review Requests */}
                    {item.productData.isReviewRequest && !currentRating.submitted && (
                      <View style={styles.inlineRatingContainer}>
                        {/* Star Rating */}
                        <View style={styles.inlineStarsRow}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                              key={star}
                              onPress={() => updateRating(item.id, star)}
                              style={styles.inlineStarButton}
                              disabled={currentRating.submitting}
                            >
                              <Icon
                                name={star <= currentRating.rating ? 'star' : 'star-outline'}
                                size={32}
                                color={star <= currentRating.rating ? '#FFD700' : '#E0E0E0'}
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                        
                        {/* Rating Text */}
                        {currentRating.rating > 0 && (
                          <Text style={styles.inlineRatingText}>
                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][currentRating.rating]}
                          </Text>
                        )}
                        
                        {/* Optional Comment */}
                        <TextInput
                          style={styles.inlineCommentInput}
                          placeholder="Add a comment (optional)..."
                          value={currentRating.comment}
                          onChangeText={(text) => updateComment(item.id, text)}
                          multiline
                          numberOfLines={2}
                          maxLength={200}
                          editable={!currentRating.submitting}
                        />
                        
                        {/* Submit Button */}
                        <TouchableOpacity
                          style={[
                            styles.inlineSubmitButton,
                            (currentRating.rating === 0 || currentRating.submitting) && styles.inlineSubmitButtonDisabled
                          ]}
                          onPress={() => submitInlineReview(item.id, item.productData)}
                          disabled={currentRating.rating === 0 || currentRating.submitting}
                        >
                          {currentRating.submitting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Icon name="checkmark-circle" size={18} color="#FFFFFF" />
                              <Text style={styles.inlineSubmitButtonText}>Submit Review</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {/* Submitted State */}
                    {item.productData.isReviewRequest && currentRating.submitted && (
                      <View style={styles.reviewSubmittedContainer}>
                        <Icon name="checkmark-circle" size={24} color="#4CAF50" />
                        <Text style={styles.reviewSubmittedText}>Review Submitted!</Text>
                      </View>
                    )}
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
                  ]}>
                    {item.message || '[No message text]'}
                  </Text>
                </View>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
            </View>
            );
          }}
        />
      )}

      {/* Input box */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
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
      </View>
      </KeyboardAvoidingView>
      
    </SafeAreaView>
  );
}
