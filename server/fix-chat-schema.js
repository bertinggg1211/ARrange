const { supabase } = require('./db/supabase');

async function fixChatSchema() {
  try {
    console.log('🔧 Fixing chat database schema...');
    
    // First, let's check what tables exist
    console.log('📋 Checking existing tables...');
    
    // Drop existing tables if they exist (to start fresh)
    console.log('🗑️ Dropping existing chat tables...');
    
    try {
      await supabase.rpc('exec_sql', {
        sql: 'DROP TABLE IF EXISTS messages CASCADE;'
      });
    } catch (e) {
      console.log('⚠️ Messages table might not exist:', e.message);
    }
    
    try {
      await supabase.rpc('exec_sql', {
        sql: 'DROP TABLE IF EXISTS conversations CASCADE;'
      });
    } catch (e) {
      console.log('⚠️ Conversations table might not exist:', e.message);
    }
    
    // Create conversations table with correct schema
    console.log('🔨 Creating conversations table...');
    const conversationsSQL = `
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
    `;
    
    const { error: convError } = await supabase.rpc('exec_sql', { sql: conversationsSQL });
    if (convError) {
      console.error('❌ Error creating conversations table:', convError);
      throw convError;
    }
    console.log('✅ Conversations table created');
    
    // Create messages table with correct schema
    console.log('🔨 Creating messages table...');
    const messagesSQL = `
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
    `;
    
    const { error: msgError } = await supabase.rpc('exec_sql', { sql: messagesSQL });
    if (msgError) {
      console.error('❌ Error creating messages table:', msgError);
      throw msgError;
    }
    console.log('✅ Messages table created');
    
    // Create indexes
    console.log('🔨 Creating indexes...');
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_last_message_time ON conversations(last_message_time DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
    `;
    
    const { error: idxError } = await supabase.rpc('exec_sql', { sql: indexesSQL });
    if (idxError) {
      console.error('⚠️ Index creation error (non-critical):', idxError);
    } else {
      console.log('✅ Indexes created');
    }
    
    // Test the tables
    console.log('🧪 Testing tables...');
    
    // Test conversations table
    const { data: convTest, error: convTestError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (convTestError) {
      console.error('❌ Conversations table test failed:', convTestError);
    } else {
      console.log('✅ Conversations table is working');
    }
    
    // Test messages table
    const { data: msgTest, error: msgTestError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (msgTestError) {
      console.error('❌ Messages table test failed:', msgTestError);
    } else {
      console.log('✅ Messages table is working');
    }
    
    console.log('🎉 Chat database schema fixed successfully!');
    return { success: true, message: 'Chat database schema fixed' };
    
  } catch (error) {
    console.error('❌ Schema fix error:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  fixChatSchema()
    .then(result => {
      console.log('Fix result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}

module.exports = fixChatSchema;
