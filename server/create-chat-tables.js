// Simple script to create chat tables in Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createChatTables() {
  try {
    console.log('🔧 Creating chat tables...');
    
    // Try to create conversations table using INSERT (this will fail but show us the table structure)
    console.log('📝 Testing conversations table...');
    const { error: convTest } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (convTest) {
      console.log('❌ Conversations table does not exist:', convTest.message);
      console.log('');
      console.log('🔧 Please run this SQL in your Supabase SQL Editor:');
      console.log('');
      console.log(`-- Create conversations table
CREATE TABLE conversations (
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

-- Create messages table
CREATE TABLE messages (
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

-- Create indexes for better performance
CREATE INDEX idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);`);
      console.log('');
    } else {
      console.log('✅ Conversations table exists');
    }
    
    // Test messages table
    console.log('📝 Testing messages table...');
    const { error: msgTest } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (msgTest) {
      console.log('❌ Messages table does not exist:', msgTest.message);
    } else {
      console.log('✅ Messages table exists');
    }
    
    console.log('');
    console.log('📋 Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open the SQL Editor');
    console.log('3. Paste and run the SQL above');
    console.log('4. Test the chat system again');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createChatTables();
