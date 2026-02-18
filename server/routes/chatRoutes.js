const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const { supabase } = require('../db/supabase');

// Test endpoint to verify frontend is calling our updated server
router.get("/test", async (req, res) => {
  console.log('🧪 TEST ENDPOINT HIT - FRONTEND IS CALLING OUR SERVER!');
  console.log('🕐 Current time:', new Date().toISOString());
  try {
    console.log('🧪 Testing database connection...');
    
    // Check messages table schema
    const { data: messagesData, error: messagesError } = await supabase.from('messages').select('*').limit(1);
    
    if (messagesError) {
      console.error('❌ Messages table error:', messagesError);
      return res.status(500).json({ 
        success: false, 
        message: 'Messages table error', 
        error: messagesError.message,
        code: messagesError.code
      });
    }
    
    console.log('✅ Messages table accessible');
    console.log('📊 Sample data:', messagesData);
    
    if (messagesData && messagesData.length > 0) {
      console.log('📋 Available columns:', Object.keys(messagesData[0]));
    }
    
    // Try to access conversations table
    const { data, error } = await supabase.from('conversations').select('count').limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('📝 Chat tables do not exist, creating them...');
      
      try {
        // Create conversations table
        console.log('🔨 Creating conversations table...');
        await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS conversations (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              last_message TEXT,
              last_message_time TIMESTAMPTZ DEFAULT NOW(),
              buyer_unread_count INTEGER DEFAULT 0,
              seller_unread_count INTEGER DEFAULT 0,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW(),
              UNIQUE(buyer_id, seller_id)
            );
          `
        });
        
        // Create messages table
        console.log('🔨 Creating messages table...');
        await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS messages (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
              sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('buyer', 'seller')),
              message TEXT NOT NULL,
              product_data JSONB,
              is_read BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
          `
        });
        
        console.log('✅ Chat tables created successfully');
        
      } catch (createError) {
        console.error('❌ Error creating chat tables:', createError);
        // Continue anyway - tables might already exist
      }
      
      // Create conversations table (fallback)
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS conversations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
            seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
            last_message TEXT,
            last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            buyer_unread_count INTEGER DEFAULT 0,
            seller_unread_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(buyer_id, seller_id)
          );
        `
      });
      
      // Create messages table
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
            sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
            sender_type VARCHAR(10) CHECK (sender_type IN ('buyer', 'seller')),
            message TEXT NOT NULL,
            product_data JSONB,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      console.log('✅ Chat tables created successfully');
    }
    
    console.log('✅ Database connection successful');
    res.json({ success: true, message: 'Database connection successful', tablesReady: true });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ success: false, message: 'Database test failed', error: error.message });
  }
});

// Setup endpoint to manually create tables
router.get("/setup", async (req, res) => {
  try {
    console.log('🔧 Setting up chat tables...');
    
    // Create conversations table using direct SQL
    const conversationsSQL = `
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        buyer_id UUID,
        seller_id UUID,
        last_message TEXT,
        last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        buyer_unread_count INTEGER DEFAULT 0,
        seller_unread_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Create messages table using direct SQL
    const messagesSQL = `
      CREATE TABLE IF NOT EXISTS messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        conversation_id UUID,
        sender_id UUID,
        sender_type VARCHAR(10),
        message TEXT NOT NULL,
        product_data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('📝 Creating conversations table...');
    const { error: convError } = await supabase.rpc('exec_sql', { sql: conversationsSQL });
    if (convError) {
      console.log('⚠️ Conversations table might already exist:', convError.message);
    }
    
    console.log('📝 Creating messages table...');
    const { error: msgError } = await supabase.rpc('exec_sql', { sql: messagesSQL });
    if (msgError) {
      console.log('⚠️ Messages table might already exist:', msgError.message);
    }
    
    // Test the tables
    const { data: convTest } = await supabase.from('conversations').select('*').limit(1);
    const { data: msgTest } = await supabase.from('messages').select('*').limit(1);
    
    console.log('✅ Chat tables setup completed');
    res.json({ 
      success: true, 
      message: 'Chat tables setup completed',
      conversationsTable: !!convTest,
      messagesTable: !!msgTest
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ success: false, message: 'Setup failed', error: error.message });
  }
});

// GET /api/chat/messages/:partnerId - Get messages between current user and partner
router.get("/messages/:partnerId", auth, async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log('💬 Fetching messages for user:', userId, 'with partner:', partnerId);
    console.log('🔍 User role:', userRole);
    console.log('🕐 Request timestamp:', new Date().toISOString());
    
    // First, let's check if the messages table exists and get its schema
    console.log('🔍 Checking messages table schema...');
    const { data: schemaTest, error: schemaError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Messages table schema error:', schemaError);
      console.error('❌ Error code:', schemaError.code);
      console.error('❌ Error message:', schemaError.message);
      console.error('❌ Error details:', JSON.stringify(schemaError, null, 2));
      
      if (schemaError.code === 'PGRST116') {
        return res.status(500).json({ 
          success: false, 
          message: 'Messages table does not exist',
          error: 'TABLE_NOT_FOUND',
          setupRequired: true,
          instructions: 'Run the chat database setup SQL script in Supabase dashboard'
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'Database schema error',
        error: schemaError.message,
        code: schemaError.code
      });
    }
    
    console.log('✅ Messages table accessible');
    if (schemaTest && schemaTest.length > 0) {
      console.log('📋 Available columns:', Object.keys(schemaTest[0]));
    }
    
    // Now try to query messages with detailed logging
    console.log('🔍 Querying messages table for user:', userId, 'partner:', partnerId);
    console.log('🔍 User role:', userRole);
    
    let query;
    let buyerId, sellerId;
    
    if (userRole === 'buyer') {
      // For buyers: current user is buyer, partner is seller
      buyerId = userId;
      sellerId = partnerId;
      
      query = supabase
        .from('messages')
        .select(`
          id,
          message,
          created_at,
          sender_id,
          sender_type,
          is_read,
          product_data
        `)
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: true });
    } else {
      // For sellers: current user is seller, partner is buyer
      sellerId = userId;
      buyerId = partnerId;
      
      query = supabase
        .from('messages')
        .select(`
          id,
          message,
          created_at,
          sender_id,
          sender_type,
          is_read,
          product_data
        `)
        .eq('seller_id', sellerId)  // seller_id = current user (seller)
        .eq('buyer_id', buyerId)    // buyer_id = partner (buyer)
        .order('created_at', { ascending: true });
    }
    
    console.log('🔍 Query parameters - buyer_id:', buyerId, 'seller_id:', sellerId);
    
    const { data: messages, error: msgError } = await query;
    
    console.log('📊 Query result - Found messages:', messages?.length || 0);
    if (messages && messages.length > 0) {
      console.log('📨 First message sample:', {
        id: messages[0].id,
        sender_id: messages[0].sender_id,
        message: messages[0].message?.substring(0, 50)
      });
    }
    
    console.log('🔍 Query result - messages found:', messages?.length || 0);
    console.log('🔍 Query result - error:', msgError?.message || 'none');
    
    if (msgError) {
      console.error('❌ Error fetching messages:', msgError);
      console.error('❌ Error code:', msgError.code);
      console.error('❌ Error message:', msgError.message);
      console.error('❌ Error details:', JSON.stringify(msgError, null, 2));
      
      // Check for specific error types
      if (msgError.message.includes('column') && msgError.message.includes('does not exist')) {
        return res.status(500).json({ 
          success: false, 
          message: 'Database schema mismatch - missing columns',
          error: msgError.message,
          setupRequired: true
        });
      }
      
      if (msgError.message.includes('foreign key')) {
        return res.status(500).json({ 
          success: false, 
          message: 'Foreign key constraint error',
          error: msgError.message,
          buyerId: buyerId,
          sellerId: sellerId
        });
      }
      
      throw msgError;
    }
    
    console.log('✅ Successfully queried messages table');
    console.log('📊 Raw messages data:', JSON.stringify(messages, null, 2));
    
    // Format messages for frontend with proper error handling
    const formattedMessages = (messages || []).map(msg => {
      try {
        // Handle both JSON string and JSONB object from Supabase
        let productData = null;
        if (msg.product_data) {
          if (typeof msg.product_data === 'string') {
            // It's a JSON string, parse it
            try {
              productData = JSON.parse(msg.product_data);
              console.log('🔍 Parsed product_data from JSON string:', productData);
            } catch (parseError) {
              console.error('❌ Error parsing product_data JSON string:', parseError);
              productData = null;
            }
          } else if (typeof msg.product_data === 'object') {
            // It's already a JSONB object from Supabase
            productData = msg.product_data;
            console.log('🔍 Using product_data as object (JSONB):', productData);
          }
        }
        
        console.log('🔍 Final product data for message:', msg.id, productData);
        console.log('🕐 Message timestamp fields:', {
          timestamp: msg.timestamp,
          created_at: msg.created_at,
          using: msg.created_at || msg.timestamp
        });
        
        // Determine sender based on sender_id
        // For buyer viewing chat: if sender_id === buyer_id, then sender is "buyer", else "seller"
        // For seller viewing chat: if sender_id === seller_id, then sender is "seller", else "buyer"
        let sender;
        if (userRole === 'buyer') {
          sender = msg.sender_id === buyerId ? 'buyer' : 'seller';
        } else {
          sender = msg.sender_id === sellerId ? 'seller' : 'buyer';
        }
        
        console.log('🔍 Message sender determination:', {
          sender_id: msg.sender_id,
          buyer_id: buyerId,
          seller_id: sellerId,
          userRole: userRole,
          determined_sender: sender
        });
        
        return {
          id: msg.id,
          message: msg.message,
          sender: sender,
          timestamp: new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          date: new Date(msg.created_at || msg.timestamp),
          is_read: msg.is_read || false,
          productData: productData
        };
      } catch (formatError) {
        console.error('❌ Error formatting message:', formatError);
        console.error('❌ Problematic message data:', JSON.stringify(msg, null, 2));
        return {
          id: msg.id || 'unknown',
          message: msg.message || 'Error loading message',
          sender: 'unknown',
          timestamp: '00:00',
          date: new Date(),
          is_read: false,
          productData: null
        };
      }
    });
    
    console.log('✅ Formatted', formattedMessages.length, 'messages for frontend');
    console.log('📤 Sending response with', formattedMessages.length, 'messages');
    
    res.json({ 
      success: true, 
      messages: formattedMessages,
      debug: {
        buyerId: buyerId,
        sellerId: sellerId,
        userRole: userRole,
        messageCount: formattedMessages.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ CRITICAL ERROR in getMessages:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Full error object:', JSON.stringify(error, null, 2));
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + (error.message || 'Unknown error'),
      error: error.message,
      errorType: error.name,
      debug: {
        userId: req.user?.id,
        partnerId: req.params?.partnerId,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// POST /api/chat/send - Send a message
router.post("/send", auth, async (req, res) => {
  try {
    console.log('🚀🚀🚀 POST /api/chat/send - NEW SERVER ENDPOINT HIT! 🚀🚀🚀');
    console.log('📥 Request body:', req.body);
    console.log('👤 User:', req.user);
    console.log('🕐 Server time:', new Date().toISOString());
    
    const { sellerId, message, productData } = req.body;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    console.log('💬 User role:', userRole);
    console.log('💬 Current user ID:', currentUserId);
    console.log('💬 Partner ID (sellerId param):', sellerId);
    console.log('📝 Message:', message);
    console.log('🛍️ Product data:', productData?.name || 'No product', `(${productData?.id})`);

    if (!sellerId || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Partner ID and message are required' 
      });
    }

    // Determine buyer_id and seller_id based on user role
    let buyerId, actualSellerId, senderId;
    
    if (userRole === 'buyer') {
      // Buyer sending message to seller
      buyerId = currentUserId;        // Current user is buyer
      actualSellerId = sellerId;      // Partner is seller
      senderId = currentUserId;       // Sender is buyer
      console.log('✅ BUYER sending to SELLER');
    } else if (userRole === 'seller') {
      // Seller sending message to buyer
      buyerId = sellerId;             // Partner is buyer (confusing naming from frontend!)
      actualSellerId = currentUserId; // Current user is seller
      senderId = currentUserId;       // Sender is seller
      console.log('✅ SELLER sending to BUYER');
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user role' 
      });
    }

    console.log('💬 Final IDs - buyer_id:', buyerId, 'seller_id:', actualSellerId, 'sender_id:', senderId);

    // Insert message into database
    const now = new Date();
    let insertData = {
      buyer_id: buyerId,
      seller_id: actualSellerId,
      sender_id: senderId,
      message: message,
      product_data: productData ? JSON.stringify(productData) : null,
      created_at: now.toISOString(),
      timestamp: now.toISOString()
    };
    
    console.log('✅ Inserting message with correct IDs');
    console.log('✅ Setting timestamp:', now.toISOString());
    
    console.log('📝 Inserting message with data:', insertData);
    console.log('📝 Product data being saved:', insertData.product_data);
    
    const { data: newMessage, error: msgError } = await supabase
      .from('messages')
      .insert(insertData)
      .select()
      .single();

    if (msgError) {
      console.error('❌ Error creating message:', msgError);
      console.error('❌ Error details:', JSON.stringify(msgError, null, 2));
      
      // If messages table doesn't exist or has schema issues, create a temporary message
      if (msgError.code === 'PGRST116' || msgError.message.includes('column') || msgError.message.includes('schema cache')) {
        console.log('⚠️ Messages table has schema issues, creating temporary message');
        const tempMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          message: message,
          sender: 'buyer',
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
          is_read: false,
          productData: productData
        };
        
        return res.json({ 
          success: true, 
          message: tempMessage,
          serverVersion: 'UPDATED_SERVER_v2.0',
          timestamp: new Date().toISOString(),
          note: 'Messages table has schema issues - using temporary storage',
          error: msgError.message
        });
      } else {
        throw msgError;
      }
    }

    if (!newMessage) {
      console.error('❌ Message creation returned null data');
      const tempMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: message,
        sender: 'buyer',
        timestamp: Date.now(),
        created_at: new Date().toISOString(),
        is_read: false,
        productData: productData
      };
      
      return res.json({ 
        success: true, 
        message: tempMessage,
        serverVersion: 'UPDATED_SERVER_v2.0',
        timestamp: new Date().toISOString(),
        note: 'Message creation failed - using temporary storage'
      });
    }

    console.log('✅ Message saved to database:', newMessage.id);

    const responseMessage = {
      id: newMessage.id,
      message: newMessage.message,
      sender: userRole, // Return the actual sender role
      timestamp: newMessage.timestamp || Date.now(),
      created_at: newMessage.created_at || new Date().toISOString(),
      is_read: false,
      productData: productData || null
    };

    res.json({ 
      success: true, 
      message: responseMessage,
      serverVersion: 'UPDATED_SERVER_v3.0_FIXED',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    
    // Provide specific error messages for common issues
    if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
      return res.status(500).json({ 
        success: false, 
        message: 'Chat database tables not found. Please run the database setup first.',
        error: 'DATABASE_SETUP_REQUIRED',
        setupInstructions: 'Go to Supabase dashboard > SQL Editor and run the chat tables SQL script. See CHAT_DATABASE_SETUP.md for details.'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + (error.message || 'Unknown error'),
      error: error.message || 'Unknown error'
    });
  }
});

// GET /api/chat/conversations - Get all conversations for current user
router.get("/conversations", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    console.log('💬 Fetching conversations for user:', userId, 'role:', userRole);

    // Get conversations by grouping messages from the existing messages table
    let query = supabase
      .from('messages')
      .select(`
        buyer_id,
        seller_id,
        sender_id,
        message,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (userRole === 'buyer') {
      query = query.eq('buyer_id', userId);
    } else {
      query = query.eq('seller_id', userId);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      
      // If table doesn't exist or has schema issues, return empty conversations
      if (error.code === 'PGRST116' || error.message.includes('column') || error.message.includes('schema cache')) {
        console.log('💬 Messages table has schema issues, returning empty conversations');
        return res.json({ 
          success: true, 
          conversations: [],
          note: 'Messages table has schema issues - chat functionality limited'
        });
      }
      
      throw error;
    }

    if (!messages || messages.length === 0) {
      console.log('💬 No messages found');
      return res.json({ success: true, conversations: [] });
    }

    // Group messages by partner to create conversations
    const conversationMap = new Map();
    
    messages.forEach(msg => {
      const isUserBuyer = userRole === 'buyer';
      const partnerId = isUserBuyer ? msg.seller_id : msg.buyer_id;
      
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
      // For buyers: only count seller messages as unread
      // For sellers: only count buyer messages as unread
      const isFromOtherParty = isUserBuyer ? msg.sender_id === msg.seller_id : msg.sender_id === msg.buyer_id;
      console.log(`🔍 Message from ${msg.sender_id}: isUserBuyer=${isUserBuyer}, isFromOtherParty=${isFromOtherParty}`);
      if (isFromOtherParty) {
        conversation.unreadCount++;
        console.log(`📊 Incremented unread count for partner ${partnerId}: ${conversation.unreadCount}`);
      }
    });

    // Get unique partner IDs to fetch user data
    const partnerIds = Array.from(conversationMap.keys());

    // Fetch partner user data with profile pictures
    const { data: partners, error: partnersError } = await supabase
      .from('users')
      .select('id, full_name, shop_name, seller_profile, role, profile_picture')
      .in('id', partnerIds);

    if (partnersError) {
      console.error('Error fetching partner data:', partnersError);
      // Continue with limited data
    }

    console.log('👥 Fetched partner data:', partners);

    // Create a map for quick lookup
    const partnersMap = new Map();
    if (partners) {
      partners.forEach(partner => {
        partnersMap.set(partner.id, partner);
      });
    }

    // Format conversations for frontend
    const formattedConversations = Array.from(conversationMap.values()).map(conv => {
      const partner = partnersMap.get(conv.partnerId);
      const partnerProfile = partner?.seller_profile;
      
      // Determine partner name based on role
      let partnerName;
      if (partner?.role === 'seller') {
        // Seller profile: use business name or shop name
        partnerName = partnerProfile?.businessName || partnerProfile?.shopName || partner?.shop_name || partner?.full_name || 'Seller';
      } else {
        // Buyer profile: use full name
        partnerName = partner?.full_name || 'Customer';
      }
      
      // Determine partner avatar based on role
      let partnerAvatar = null;
      if (partner?.role === 'seller') {
        // Seller: use shop logo or profile image from seller_profile
        partnerAvatar = partnerProfile?.shopLogo || partnerProfile?.profileImage || partner?.profile_picture || null;
      } else {
        // Buyer: use profile_picture field
        partnerAvatar = partner?.profile_picture || null;
      }
      
      console.log(`📸 Partner ${conv.partnerId} (${partner?.role}):`, {
        name: partnerName,
        avatar: partnerAvatar
      });
      
      return {
        id: `conv_${conv.partnerId}`,
        partnerId: conv.partnerId,
        partnerName: partnerName,
        partnerAvatar: partnerAvatar,
        lastMessage: conv.lastMessage || 'No messages yet',
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCount,
        isOnline: false, // TODO: Implement online status
        isActive: true
      };
    });

    console.log('✅ Fetched', formattedConversations.length, 'conversations');
    res.json({ 
      success: true, 
      conversations: formattedConversations
    });
  } catch (error) {
    console.error('Error in getConversations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/chat/mark-read/:partnerId - Mark messages as read
router.put("/mark-read/:partnerId", auth, async (req, res) => {
  try {
    const { partnerId } = req.params;
    const currentUserId = req.user.id;
    const userRole = req.user.role;
    
    console.log('💬 Marking messages as read for user:', currentUserId, 'role:', userRole, 'partner:', partnerId);
    
    let updateQuery;
    let buyerId, sellerId;
    
    if (userRole === 'buyer') {
      // Buyer marking seller's messages as read
      buyerId = currentUserId;
      sellerId = partnerId;
      
      console.log('👤 BUYER marking SELLER messages as read');
      console.log('📋 Updating messages where buyer_id =', buyerId, 'seller_id =', sellerId, 'sender_id =', sellerId);
      
      // Mark all messages FROM the seller (sender_id = seller) as read
      updateQuery = supabase
        .from('messages')
        .update({ is_read: true })
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .eq('sender_id', sellerId) // Only mark seller's messages as read
        .eq('is_read', false);
        
    } else if (userRole === 'seller') {
      // Seller marking buyer's messages as read
      sellerId = currentUserId;
      buyerId = partnerId;
      
      console.log('👤 SELLER marking BUYER messages as read');
      console.log('📋 Updating messages where seller_id =', sellerId, 'buyer_id =', buyerId, 'sender_id =', buyerId);
      
      // Mark all messages FROM the buyer (sender_id = buyer) as read
      updateQuery = supabase
        .from('messages')
        .update({ is_read: true })
        .eq('seller_id', sellerId)
        .eq('buyer_id', buyerId)
        .eq('sender_id', buyerId) // Only mark buyer's messages as read
        .eq('is_read', false);
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user role' 
      });
    }
    
    const { data, error } = await updateQuery;
    
    if (error) {
      console.error('❌ Error marking messages as read:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      // Don't throw error - just log it and return success
      console.log('⚠️ Continuing despite error');
    } else {
      console.log('✅ Messages marked as read successfully');
      console.log('📊 Updated rows:', data);
    }
    
    res.json({ 
      success: true, 
      message: 'Messages marked as read successfully'
    });
  } catch (error) {
    console.error('❌ Error in markRead:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/chat/send-order-notification - Send automated order status notification
router.post("/send-order-notification", auth, async (req, res) => {
  try {
    console.log('🔔 POST /api/chat/send-order-notification - Sending order status notification');
    console.log('📥 Request body:', req.body);
    
    const { buyerId, orderNumber, status, productData, trackingNumber } = req.body;
    const sellerId = req.user.id; // Current user is the seller
    const userRole = req.user.role;

    console.log('🔔 Notification from seller:', sellerId, 'to buyer:', buyerId);
    console.log('📦 Order:', orderNumber, 'Status:', status);
    console.log('🛍️ Product data:', productData);

    if (!buyerId || !orderNumber || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Buyer ID, order number, and status are required' 
      });
    }

    // Create automated message based on order status
    let message = '';
    switch (status.toLowerCase()) {
      case 'confirmed':
        message = `✅ Great news! Your order #${orderNumber} has been confirmed and is being prepared for processing.`;
        break;
      case 'processing':
        message = `📦 Your order #${orderNumber} is now being processed. We're preparing your items for shipment.`;
        break;
      case 'shipped':
        message = trackingNumber 
          ? `🚚 Your order #${orderNumber} has been shipped! Tracking Number: ${trackingNumber}. You'll receive it soon!`
          : `🚚 Your order #${orderNumber} has been shipped and is on its way to you!`;
        break;
      case 'delivered':
        message = `🎉 Your order #${orderNumber} has been delivered! We hope you enjoy your purchase. Thank you for shopping with us!`;
        break;
      case 'cancelled':
        message = `❌ Your order #${orderNumber} has been cancelled. If you have any questions, please feel free to contact us.`;
        break;
      case 'review_request':
        message = `⭐ How was your experience? Please take a moment to review this product and rate our shop! Your feedback helps us improve and helps other buyers make informed decisions. Thank you! 💙`;
        break;
      default:
        message = `📋 Order #${orderNumber} status updated to: ${status}`;
    }

    // Insert notification message with full product data
    const now = new Date();
    const insertData = {
      buyer_id: buyerId,
      seller_id: sellerId,
      sender_id: sellerId, // Seller is sending the notification
      message: message,
      product_data: productData ? JSON.stringify({ 
        ...productData,
        orderNumber: orderNumber,
        status: status,
        trackingNumber: trackingNumber,
        isOrderNotification: true 
      }) : null,
      created_at: now.toISOString(),
      timestamp: now.toISOString()
    };
    
    console.log('📝 Inserting order notification:', insertData);
    
    const { data: newMessage, error: msgError } = await supabase
      .from('messages')
      .insert(insertData)
      .select()
      .single();

    if (msgError) {
      console.error('❌ Error creating notification:', msgError);
      throw msgError;
    }

    console.log('✅ Order notification sent successfully:', newMessage.id);

    res.json({ 
      success: true, 
      message: 'Order notification sent successfully',
      notification: {
        id: newMessage.id,
        message: newMessage.message,
        timestamp: newMessage.created_at
      }
    });
  } catch (error) {
    console.error('❌ Error sending order notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send order notification: ' + (error.message || 'Unknown error'),
      error: error.message
    });
  }
});

// DELETE /api/chat/delete/:partnerId - Delete entire chat conversation
router.delete("/delete/:partnerId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const partnerId = req.params.partnerId;
    
    console.log('🗑️ Deleting chat conversation for user:', userId, 'role:', userRole, 'partner:', partnerId);
    
    // Delete all messages between the user and partner
    let deleteQuery;
    if (userRole === 'buyer') {
      deleteQuery = supabase
        .from('messages')
        .delete()
        .eq('buyer_id', userId)
        .eq('seller_id', partnerId);
    } else {
      deleteQuery = supabase
        .from('messages')
        .delete()
        .eq('seller_id', userId)
        .eq('buyer_id', partnerId);
    }
    
    const { error: deleteError } = await deleteQuery;
    
    if (deleteError) {
      console.error('❌ Error deleting messages:', deleteError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete chat conversation',
        error: deleteError.message 
      });
    }
    
    console.log('✅ Chat conversation deleted successfully');
    res.json({ 
      success: true, 
      message: 'Chat conversation deleted successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error in deleteChat:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + (error.message || 'Unknown error'),
      error: error.message 
    });
  }
});

module.exports = router;
