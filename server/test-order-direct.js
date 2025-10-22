// =============================================
// TEST ORDER CREATION DIRECTLY
// Run this to test the server order creation
// =============================================

const { supabase } = require('./db/supabase');

async function testOrderCreation() {
  try {
    console.log('🧪 Testing order creation directly...');
    
    const testOrderData = {
      buyer_id: '58ef0bea-742c-4ebc-b136-780fad2ffb07',
      seller_id: '18a0f468-82b5-4fb2-ab5a-6d5484f7bfbe',
      order_number: `TEST-SERVER-${Date.now()}`,
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
      notes: 'test order from server'
    };
    
    console.log('📦 Test order data:', JSON.stringify(testOrderData, null, 2));
    
    // Test insert without .single()
    const { data: orderArray, error: orderError } = await supabase
      .from('orders')
      .insert(testOrderData)
      .select();
      
    console.log('📥 Insert result:', { 
      data: orderArray, 
      error: orderError,
      errorMessage: orderError?.message,
      errorCode: orderError?.code,
      errorDetails: orderError?.details,
      errorHint: orderError?.hint,
      dataLength: orderArray?.length
    });
    
    if (error) {
      console.error('❌ Insert failed:', orderError);
    } else {
      console.log('✅ Insert successful:', orderArray);
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

// Run the test
testOrderCreation();
