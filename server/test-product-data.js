const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testProductData() {
  console.log('🧪 Testing product data in messages...');
  
  try {
    // Get the latest message for this chat
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('buyer_id', '58ef0bea-742c-4ebc-b136-780fad2ffb07')
      .eq('seller_id', '18a0f468-82b5-4fb2-ab5a-6d5484f7bfbe')
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('❌ Error fetching messages:', fetchError);
      return;
    }

    if (messages && messages.length > 0) {
      const message = messages[0];
      console.log('📊 Latest message:', message);
      console.log('📊 Message content:', message.message);
      console.log('📊 Product data:', message.product_data);
      console.log('📊 Product data type:', typeof message.product_data);
      
      if (message.product_data) {
        console.log('📊 Product data parsed:', JSON.parse(message.product_data));
      } else {
        console.log('❌ No product data found in message');
      }
    } else {
      console.log('❌ No messages found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testProductData();
