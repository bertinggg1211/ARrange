// Load environment variables
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAllData() {
  try {
    console.log('🗑️ Starting to clear all data...');
    
    // Clear orders first (due to foreign key constraints)
    console.log('📦 Step 1: Deleting order status history...');
    await supabase.from('order_status_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Order status history cleared');
    
    console.log('🛒 Step 2: Deleting order items...');
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Order items cleared');
    
    console.log('📦 Step 3: Deleting orders...');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Orders cleared');
    
    // Clear products
    console.log('🛍️ Step 4: Deleting products...');
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Products cleared');
    
    // Clear cart items
    console.log('🛒 Step 5: Clearing cart items...');
    await supabase.from('carts').update({ total_amount: 0.00, items: '[]' });
    console.log('✅ Cart items cleared');
    
    console.log('🎉 All data cleared successfully!');
    console.log('📊 Summary:');
    console.log('   - Orders: Cleared');
    console.log('   - Products: Cleared');
    console.log('   - Cart items: Cleared');
    console.log('✅ Script completed successfully');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
}

clearAllData();
