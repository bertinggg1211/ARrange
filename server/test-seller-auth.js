const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testSellerAuth() {
  console.log('🧪 Testing seller authentication...');
  
  // Test with the seller ID from the database
  const sellerId = '18a0f468-82b5-4fb2-ab5a-6d5484f7bfbe';
  
  console.log('🔍 Testing user data for seller:', sellerId);
  
  // Check if the seller exists in the users table
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, full_name, role, shop_name, seller_profile')
    .eq('id', sellerId)
    .single();
  
  if (userError) {
    console.error('❌ Error fetching user:', userError);
    return;
  }
  
  console.log('👤 User data:', user);
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  if (user.role !== 'seller') {
    console.log('❌ User role is not seller:', user.role);
    return;
  }
  
  console.log('✅ User is a seller');
  
  // Test the conversations API logic
  console.log('🔍 Testing conversations API logic...');
  
  const { data: messages, error: messagesError } = await supabase
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
  
  if (messagesError) {
    console.error('❌ Error fetching messages:', messagesError);
    return;
  }
  
  console.log('📊 Messages found:', messages.length);
  
  if (messages.length === 0) {
    console.log('❌ No messages found for seller');
    return;
  }
  
  // Test conversation grouping
  const conversationMap = new Map();
  
  messages.forEach(msg => {
    const partnerId = msg.buyer_id;
    
    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        partnerId: partnerId,
        lastMessage: msg.message,
        lastMessageTime: msg.created_at,
        unreadCount: 0,
        isOnline: false
      });
    }
    
    const conversation = conversationMap.get(partnerId);
    if (new Date(msg.created_at) > new Date(conversation.lastMessageTime)) {
      conversation.lastMessage = msg.message;
      conversation.lastMessageTime = msg.created_at;
    }
    
    const isFromOtherParty = msg.sender_id === msg.buyer_id;
    if (isFromOtherParty) {
      conversation.unreadCount++;
    }
  });
  
  console.log('📊 Conversations found:', conversationMap.size);
  
  // Get partner data
  const partnerIds = Array.from(conversationMap.keys());
  const { data: partners, error: partnersError } = await supabase
    .from('users')
    .select('id, full_name, shop_name, seller_profile')
    .in('id', partnerIds);
  
  if (partnersError) {
    console.error('❌ Error fetching partners:', partnersError);
    return;
  }
  
  console.log('👥 Partners found:', partners.length);
  
  // Format conversations like the backend does
  const formattedConversations = Array.from(conversationMap.values()).map(conv => {
    const partner = partners.find(p => p.id === conv.partnerId);
    return {
      partnerId: conv.partnerId,
      partnerName: partner?.full_name || 'Unknown User',
      partnerAvatar: null,
      lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      unreadCount: conv.unreadCount,
      isOnline: conv.isOnline
    };
  });
  
  console.log('📋 Formatted conversations:', JSON.stringify(formattedConversations, null, 2));
  
  console.log('✅ Seller authentication and conversations test completed');
}

testSellerAuth().catch(console.error);
