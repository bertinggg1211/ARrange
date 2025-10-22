// =============================================
// TEST ORDER INSERT DIRECTLY
// Run this to test order creation
// =============================================

const { supabase } = require('./db/supabase');

async function testOrderInsert() {
  try {
    console.log('🧪 Testing order insert...');
    
    const testOrderData = {
      buyer_id: '58ef0bea-742c-4ebc-b136-780fad2ffb07',
      seller_id: '18a0f468-82b5-4fb2-ab5a-6d5484f7bfbe',
      order_number: `TEST-${Date.now()}`,
      status: 'pending',
      total_amount: 890.00,
      shipping_address: JSON.stringify({
        fullAddress: 'test address',
        recipient: 'test user',
        phone: '123456789',
        notes: ''
      }),
      payment_method: 'Cash on Delivery',
      payment_status: 'pending',
      notes: 'test order'
    };
    
    console.log('📦 Test order data:', testOrderData);
    
    const { data, error } = await supabase
      .from('orders')
      .insert(testOrderData)
      .select();
      
    console.log('📥 Insert result:', { data, error });
    
    if (error) {
      console.error('❌ Insert failed:', error);
    } else {
      console.log('✅ Insert successful:', data);
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

// Run the test
testOrderInsert();
