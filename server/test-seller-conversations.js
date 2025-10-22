const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testSellerConversations() {
  console.log('🧪 Testing seller conversations...');
  
  // Test with the seller ID from the database
  const sellerId = '18a0f468-82b5-4fb2-ab5a-6d5484f7bfbe';
  
  console.log('🔍 Testing conversations for seller:', sellerId);
  
  // Test the same query that the backend uses
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      buyer_id,
      seller_id,
      sender_id,
      message,
      created_at
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching messages:', error);
    return;
  }
  
  console.log('📊 Messages found for seller:', messages.length);
  console.log('📋 Messages data:', JSON.stringify(messages, null, 2));
  
  if (messages.length === 0) {
    console.log('❌ No messages found for seller');
    return;
  }
  
  // Test the conversation grouping logic
  const conversationMap = new Map();
  
  messages.forEach(msg => {
    const isUserBuyer = false; // This is a seller
    const partnerId = msg.buyer_id; // For seller, partner is buyer
    
    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        partnerId: partnerId,
        lastMessage: msg.message,
        lastMessageTime: msg.created_at,
        unreadCount: 0,
        isOnline: false
      });
    }
    
    // Update with latest message
    const conversation = conversationMap.get(partnerId);
    if (new Date(msg.created_at) > new Date(conversation.lastMessageTime)) {
      conversation.lastMessage = msg.message;
      conversation.lastMessageTime = msg.created_at;
    }
    
    // Count unread messages - only count messages from the other party as unread
    const isFromOtherParty = msg.sender_id === msg.buyer_id; // For seller, buyer messages are unread
    if (isFromOtherParty) {
      conversation.unreadCount++;
    }
  });
  
  console.log('📊 Conversation map:', conversationMap.size);
  console.log('📋 Conversations:', Array.from(conversationMap.values()));
  
  // Test user data fetching
  const partnerIds = Array.from(conversationMap.keys());
  console.log('👥 Partner IDs:', partnerIds);
  
  if (partnerIds.length > 0) {
    const { data: partners, error: partnersError } = await supabase
      .from('users')
      .select('id, full_name, shop_name, seller_profile')
      .in('id', partnerIds);
    
    if (partnersError) {
      console.error('❌ Error fetching partner data:', partnersError);
    } else {
      console.log('👥 Partner data:', partners);
    }
  }
}

testSellerConversations().catch(console.error);
