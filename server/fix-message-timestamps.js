const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixMessageTimestamps() {
  console.log('🕒 Fixing message timestamps...');
  
  try {
    // Get all messages with incorrect timestamps (1970-01-01)
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('buyer_id', '58ef0bea-742c-4ebc-b136-780fad2ffb07')
      .eq('seller_id', '18a0f468-82b5-4fb2-ab5a-6d5484f7bfbe')
      .lt('created_at', '2024-01-01') // Messages with old timestamps
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching messages:', fetchError);
      return;
    }

    console.log(`📊 Found ${messages.length} messages with incorrect timestamps`);

    // Fix timestamps by setting them to current time with small increments
    const now = new Date();
    let fixedCount = 0;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const newTimestamp = new Date(now.getTime() + (i * 1000)); // Add 1 second between each message
      
      const { error: updateError } = await supabase
        .from('messages')
        .update({ 
          created_at: newTimestamp.toISOString(),
          timestamp: newTimestamp.toISOString()
        })
        .eq('id', msg.id);

      if (updateError) {
        console.error(`❌ Error updating message ${msg.id}:`, updateError);
      } else {
        fixedCount++;
        console.log(`✅ Fixed timestamp for message: "${msg.message}"`);
      }
    }

    console.log(`🎉 Fixed ${fixedCount} message timestamps`);

    // Show updated messages
    const { data: updatedMessages, error: updatedError } = await supabase
      .from('messages')
      .select('*')
      .eq('buyer_id', '58ef0bea-742c-4ebc-b136-780fad2ffb07')
      .eq('seller_id', '18a0f468-82b5-4fb2-ab5a-6d5484f7bfbe')
      .order('created_at', { ascending: true });

    if (updatedError) {
      console.error('❌ Error fetching updated messages:', updatedError);
      return;
    }

    console.log(`📊 Updated messages: ${updatedMessages.length}`);
    updatedMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.sender}] ${msg.message} (${msg.created_at})`);
    });

  } catch (error) {
    console.error('❌ Timestamp fix failed:', error);
  }
}

// Run timestamp fix
fixMessageTimestamps();
