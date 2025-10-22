const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupRemainingOrders() {
  try {
    console.log('🧹 Checking for remaining orders...');
    
    // Get all remaining orders
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, created_at, buyer_id, status')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching orders:', fetchError);
      return;
    }
    
    console.log(`📋 Found ${orders.length} remaining orders:`);
    orders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.order_number || order.id} - Status: ${order.status} - Created: ${new Date(order.created_at).toLocaleString()}`);
    });
    
    if (orders.length === 0) {
      console.log('✅ No orders to clean up');
      return;
    }
    
    // Delete order items first
    console.log('\n🗑️ Deleting order items...');
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (itemsError) {
      console.error('❌ Error deleting order items:', itemsError);
      return;
    }
    
    console.log('✅ Order items deleted successfully');
    
    // Delete orders
    console.log('\n🗑️ Deleting orders...');
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (ordersError) {
      console.error('❌ Error deleting orders:', ordersError);
      return;
    }
    
    console.log('✅ Orders deleted successfully');
    
    // Verify cleanup
    const { data: remainingOrders, error: verifyError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError);
      return;
    }
    
    if (remainingOrders.length === 0) {
      console.log('\n🎉 All orders have been completely removed!');
    } else {
      console.log(`\n⚠️ Warning: ${remainingOrders.length} orders still remain`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupRemainingOrders();
