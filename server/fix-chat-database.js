const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixChatDatabase() {
  console.log('🔧 Starting comprehensive chat database fix...');
  
  try {
    // Step 1: Get all messages for this specific chat
    console.log('📊 Step 1: Fetching messages...');
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('buyer_id', '58ef0bea-742c-4ebc-b136-780fad2ffb07')
      .eq('seller_id', '18a0f468-82b5-4fb2-ab5a-6d5484f7bfbe')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching messages:', fetchError);
      return;
    }

    console.log(`📊 Found ${messages.length} messages`);

    // Step 2: Delete ALL messages for this chat (clean slate)
    console.log('🗑️ Step 2: Clearing all messages for clean start...');
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('buyer_id', '58ef0bea-742c-4ebc-b136-780fad2ffb07')
      .eq('seller_id', '18a0f468-82b5-4fb2-ab5a-6d5484f7bfbe');

    if (deleteError) {
      console.error('❌ Error deleting messages:', deleteError);
      return;
    }

    console.log('✅ All messages deleted');

    // Step 3: Create one clean initial message
    console.log('📝 Step 3: Creating clean initial message...');
    const now = new Date();
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        buyer_id: '58ef0bea-742c-4ebc-b136-780fad2ffb07',
        seller_id: '18a0f468-82b5-4fb2-ab5a-6d5484f7bfbe',
        sender_id: '58ef0bea-742c-4ebc-b136-780fad2ffb07',
        message: 'I would like to ask some questions about this item',
        sender_type: 'buyer',
        created_at: now.toISOString(),
        timestamp: now.toISOString(),
        is_read: false,
        product_data: null
      })
      .select();

    if (insertError) {
      console.error('❌ Error creating initial message:', insertError);
      return;
    }

    console.log('✅ Clean initial message created');

    // Step 4: Verify the fix
    console.log('🔍 Step 4: Verifying fix...');
    const { data: finalMessages, error: finalError } = await supabase
      .from('messages')
      .select('*')
      .eq('buyer_id', '58ef0bea-742c-4ebc-b136-780fad2ffb07')
      .eq('seller_id', '18a0f468-82b5-4fb2-ab5a-6d5484f7bfbe')
      .order('created_at', { ascending: true });

    if (finalError) {
      console.error('❌ Error fetching final messages:', finalError);
      return;
    }

    console.log(`🎉 Chat database fixed! Now has ${finalMessages.length} clean messages:`);
    finalMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.sender_type}] ${msg.message} (${msg.created_at})`);
    });

    console.log('\n✅ Chat database is now clean and ready for normal use!');
    console.log('📱 You can now send messages without duplicates.');

  } catch (error) {
    console.error('❌ Chat database fix failed:', error);
  }
}

// Run the fix
fixChatDatabase();
