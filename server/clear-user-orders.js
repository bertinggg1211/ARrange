#!/usr/bin/env node

/**
 * Clear User Orders Script
 * This script clears orders for a specific user
 * Safer option than clearing all orders
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please check your .env file for SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearUserOrders(userId) {
  if (!userId) {
    console.error('❌ Please provide a user ID');
    console.error('Usage: node clear-user-orders.js <user-id>');
    process.exit(1);
  }

  console.log(`🗑️ Starting to clear orders for user: ${userId}`);
  
  try {
    // Step 1: Get user's orders
    console.log('📊 Step 1: Finding user orders...');
    const { data: userOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    
    if (ordersError) {
      console.error('❌ Error fetching user orders:', ordersError);
      throw ordersError;
    }

    if (!userOrders || userOrders.length === 0) {
      console.log('✅ No orders found for this user');
      return;
    }

    const orderIds = userOrders.map(order => order.id);
    console.log(`📦 Found ${orderIds.length} orders to delete`);

    // Step 2: Delete order status history
    console.log('📊 Step 2: Deleting order status history...');
    const { error: historyError } = await supabase
      .from('order_status_history')
      .delete()
      .in('order_id', orderIds);
    
    if (historyError) {
      console.warn('⚠️ Warning deleting order status history:', historyError.message);
    } else {
      console.log('✅ Order status history cleared');
    }

    // Step 3: Delete order items
    console.log('🛒 Step 3: Deleting order items...');
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .in('order_id', orderIds);
    
    if (itemsError) {
      console.warn('⚠️ Warning deleting order items:', itemsError.message);
    } else {
      console.log('✅ Order items cleared');
    }

    // Step 4: Delete orders
    console.log('📦 Step 4: Deleting orders...');
    const { error: deleteOrdersError } = await supabase
      .from('orders')
      .delete()
      .in('id', orderIds);
    
    if (deleteOrdersError) {
      console.error('❌ Error deleting orders:', deleteOrdersError);
      throw deleteOrdersError;
    } else {
      console.log('✅ Orders cleared');
    }

    // Step 5: Clear user's cart items
    console.log('🛍️ Step 5: Clearing user cart...');
    const { error: cartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
    
    if (cartError) {
      console.warn('⚠️ Warning clearing cart items:', cartError.message);
    } else {
      console.log('✅ Cart items cleared');
    }

    // Step 6: Reset user's cart total
    console.log('💰 Step 6: Resetting cart total...');
    const { error: cartResetError } = await supabase
      .from('carts')
      .update({
        total_amount: 0.00,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (cartResetError) {
      console.warn('⚠️ Warning resetting cart total:', cartResetError.message);
    } else {
      console.log('✅ Cart total reset');
    }

    console.log('🎉 User orders cleared successfully!');
    console.log(`📊 Summary for user ${userId}:`);
    console.log(`   - Orders deleted: ${orderIds.length}`);
    console.log('   - Order status history: Cleared');
    console.log('   - Order items: Cleared');
    console.log('   - Cart items: Cleared');
    console.log('   - Cart total: Reset');

  } catch (error) {
    console.error('❌ Error clearing user orders:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  const userId = process.argv[2];
  clearUserOrders(userId)
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { clearUserOrders };
