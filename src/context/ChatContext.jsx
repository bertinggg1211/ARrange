import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getMessages, sendMessage, getConversations, markMessagesAsRead } from '../api/chatApi';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Load conversations on mount and when user changes
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      // Clear chat data when user logs out
      console.log('🧹 ChatContext: User logged out, clearing chat data');
      setChats([]);
      setConversations([]);
      setError(null);
    }
  }, [user]);

  // Load conversations from backend
  const loadConversations = async () => {
    try {
      setLoading(true);
      console.log('💬 ChatContext: Loading conversations for user:', user?.id, 'role:', user?.role);
      const response = await getConversations();
      console.log('💬 ChatContext: Conversations API response:', response);
      if (response.success) {
        setConversations(response.conversations);
        console.log('✅ Loaded conversations:', response.conversations.length);
        console.log('📊 Conversations data:', response.conversations);
      } else {
        console.log('❌ Conversations API failed:', response.message);
        setError(response.message || 'Failed to load conversations');
      }
    } catch (error) {
      console.error('❌ ChatContext: Error loading conversations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get shop info by ID (for backward compatibility)
  const getShop = (shopId) => {
    const conversation = conversations.find(conv => conv.partnerId === shopId);
    if (conversation) {
      return {
        id: conversation.partnerId,
        name: conversation.partnerName,
        avatar: conversation.partnerAvatar,
        isOnline: conversation.isOnline
      };
    }
    return null;
  };

  // Get chat by shop ID
  const getChatByShopId = async (shopId) => {
    try {
      console.log('💬 ChatContext: Getting chat for shop:', shopId);
      const response = await getMessages(shopId);
      console.log('💬 ChatContext: Response received:', response);
      if (response.success) {
        return {
          id: `chat_${shopId}`,
          shopId: shopId,
          messages: response.messages.map(msg => {
            console.log('💬 ChatContext: Mapping message:', msg.id, 'productData:', msg.productData);
            return {
              id: msg.id,
              sender: msg.sender,
              message: msg.message,
              timestamp: msg.timestamp, // Backend already formats this
              date: msg.date, // Backend already provides this
              isRead: msg.is_read,
              productData: msg.productData || null
            };
          }),
          lastMessage: response.messages[response.messages.length - 1]?.message || '',
          lastMessageTime: response.messages[response.messages.length - 1]?.date || Date.now(),
          unreadCount: response.messages.filter(msg => msg.sender === 'seller' && !msg.is_read).length,
          isActive: true
        };
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
    return null;
  };

  // Get all active chats
  const getActiveChats = () => {
    return conversations.filter(conv => conv.isActive);
  };

  // Add message to existing chat
  const addMessage = async (chatId, message) => {
    try {
      // Extract sellerId from chatId (format: chat_sellerId)
      const sellerId = chatId.replace('chat_', '');
      
      // Send message to backend
      const response = await sendMessage(sellerId, message.message);
      if (response.success) {
        // Update local state
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === chatId 
              ? {
                  ...chat,
                  messages: [...chat.messages, message],
                  lastMessage: message.message,
                  lastMessageTime: message.date,
                  unreadCount: message.sender === 'seller' ? chat.unreadCount + 1 : chat.unreadCount
                }
              : chat
          )
        );
        
        // Refresh conversations
        loadConversations();
      }
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  };

  // Create new chat with a shop (when user contacts shop for first time)
  const createChatWithShop = async (shopId, initialMessage, productData = null) => {
    try {
      console.log('💬 Creating chat with shop:', shopId, 'message:', initialMessage);
      console.log('💬 Product data received:', productData);
      
      // Send initial message to backend with product context
      const response = await sendMessage(shopId, initialMessage, productData);
      if (response.success) {
        console.log('✅ Initial message sent successfully');
        
        // Create local chat entry immediately for better UX
        const chatId = `chat_${shopId}`;
        const newChat = {
          id: chatId,
          partnerId: shopId,
          partnerName: 'Shop', // Will be updated when conversations load
          partnerAvatar: null,
          lastMessage: initialMessage,
          lastMessageTime: Date.now(),
          unreadCount: 0,
          isOnline: false,
          isActive: true
        };
        
        // Add to local conversations immediately
        setConversations(prevConversations => {
          // Check if conversation already exists
          const existingIndex = prevConversations.findIndex(conv => conv.partnerId === shopId);
          if (existingIndex >= 0) {
            // Update existing conversation
            const updated = [...prevConversations];
            updated[existingIndex] = {
              ...updated[existingIndex],
              lastMessage: initialMessage,
              lastMessageTime: Date.now(),
              unreadCount: 0
            };
            return updated;
          } else {
            // Add new conversation
            return [newChat, ...prevConversations];
          }
        });
        
        // Refresh conversations from backend to get complete data
        setTimeout(() => {
          loadConversations();
        }, 1000);
        
        // Return chat ID
        return chatId;
      }
    } catch (error) {
      console.error('Error creating chat with shop:', error);
      throw error;
    }
    return null;
  };

  // Mark chat as read
  const markChatAsRead = async (chatId) => {
    try {
      const sellerId = chatId.replace('chat_', '');
      await markMessagesAsRead(sellerId);
      
      // Update local state
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
        )
      );
      
      // Refresh conversations
      await loadConversations();
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  // Delete entire chat conversation
  const deleteChat = async (partnerId) => {
    try {
      console.log('🗑️ ChatContext: Deleting chat with partner:', partnerId);
      
      // Import deleteChat function dynamically to avoid circular dependency
      const { deleteChat: deleteChatApi } = await import('../api/chatApi');
      await deleteChatApi(partnerId);
      
      // Update local state - remove the chat from conversations
      setConversations(prevConversations =>
        prevConversations.filter(conv => conv.partnerId !== partnerId)
      );
      
      // Update local state - remove the chat from chats
      setChats(prevChats =>
        prevChats.filter(chat => chat.id !== `chat_${partnerId}`)
      );
      
      console.log('✅ ChatContext: Chat deleted successfully');
    } catch (error) {
      console.error('❌ ChatContext: Error deleting chat:', error);
      throw error;
    }
  };

  // Get formatted chat data for chat list
  const getFormattedChats = () => {
    return conversations.map(conversation => ({
      id: `chat_${conversation.partnerId}`,
      sellerName: conversation.partnerName,
      lastMessage: conversation.lastMessage,
      timestamp: formatTimestamp(new Date(conversation.lastMessageTime)),
      avatar: conversation.partnerAvatar,
      isOnline: conversation.isOnline,
      unreadCount: conversation.unreadCount,
      isActive: conversation.isActive,
      shop: {
        id: conversation.partnerId,
        name: conversation.partnerName,
        avatar: conversation.partnerAvatar,
        isOnline: conversation.isOnline
      },
    }));
  };

  // Format timestamp for display
  const formatTimestamp = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const value = {
    chats,
    conversations,
    loading,
    error,
    getShop,
    getChatByShopId,
    getActiveChats,
    addMessage,
    createChatWithShop,
    markChatAsRead,
    deleteChat,
    getFormattedChats,
    loadConversations,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};