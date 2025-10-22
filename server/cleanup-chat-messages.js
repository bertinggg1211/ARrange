const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function cleanupChatMessages() {
  console.log('🧹 Starting chat messages cleanup...');
  
  try {
    // Get all messages for this specific chat
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

    console.log(`📊 Found ${messages.length} messages to clean up`);

    // Group messages by content to identify duplicates
    const messageGroups = {};
    messages.forEach(msg => {
      const key = msg.message;
      if (!messageGroups[key]) {
        messageGroups[key] = [];
      }
      messageGroups[key].push(msg);
    });

    console.log('📋 Message groups:');
    Object.keys(messageGroups).forEach(key => {
      console.log(`  "${key}": ${messageGroups[key].length} duplicates`);
    });

    // Keep only the first message from each group, delete the rest
    let deletedCount = 0;
    for (const [messageContent, messageList] of Object.entries(messageGroups)) {
      if (messageList.length > 1) {
        // Keep the first one, delete the rest
        const toDelete = messageList.slice(1);
        const deleteIds = toDelete.map(msg => msg.id);
        
        console.log(`🗑️ Deleting ${deleteIds.length} duplicates of: "${messageContent}"`);
        
        const { error: deleteError } = await supabase
          .from('messages')
          .delete()
          .in('id', deleteIds);

        if (deleteError) {
          console.error('❌ Error deleting messages:', deleteError);
        } else {
          deletedCount += deleteIds.length;
          console.log(`✅ Deleted ${deleteIds.length} duplicate messages`);
        }
      }
    }

    console.log(`🎉 Cleanup complete! Deleted ${deletedCount} duplicate messages`);

    // Show remaining messages
    const { data: remainingMessages, error: remainingError } = await supabase
      .from('messages')
      .select('*')
      .eq('buyer_id', '58ef0bea-742c-4ebc-b136-780fad2ffb07')
      .eq('seller_id', '18a0f468-82b5-4fb2-ab5a-6d5484f7bfbe')
      .order('created_at', { ascending: true });

    if (remainingError) {
      console.error('❌ Error fetching remaining messages:', remainingError);
      return;
    }

    console.log(`📊 Remaining messages: ${remainingMessages.length}`);
    remainingMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.sender}] ${msg.message} (${msg.created_at})`);
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run cleanup
cleanupChatMessages();
