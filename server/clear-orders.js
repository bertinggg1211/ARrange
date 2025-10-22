#!/usr/bin/env node

/**
 * Clear Orders Script
 * This script clears all orders from the database
 * Use with caution - this will delete ALL orders permanently
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

async function clearAllOrders() {
  console.log('🗑️ Starting to clear all orders...');
  
  try {
    // Step 1: Delete order status history
    console.log('📊 Step 1: Deleting order status history...');
    const { error: historyError } = await supabase
      .from('order_status_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (historyError) {
      console.warn('⚠️ Warning deleting order status history:', historyError.message);
    } else {
      console.log('✅ Order status history cleared');
    }

    // Step 2: Delete order items
    console.log('🛒 Step 2: Deleting order items...');
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (itemsError) {
      console.warn('⚠️ Warning deleting order items:', itemsError.message);
    } else {
      console.log('✅ Order items cleared');
    }

    // Step 3: Delete orders
    console.log('📦 Step 3: Deleting orders...');
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (ordersError) {
      console.error('❌ Error deleting orders:', ordersError);
      throw ordersError;
    } else {
      console.log('✅ Orders cleared');
    }

    // Step 4: Clear cart items (optional)
    console.log('🛍️ Step 4: Clearing cart items...');
    const { error: cartItemsError } = await supabase
      .from('cart_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (cartItemsError) {
      console.warn('⚠️ Warning clearing cart items:', cartItemsError.message);
    } else {
      console.log('✅ Cart items cleared');
    }

    // Step 5: Reset cart totals
    console.log('💰 Step 5: Resetting cart totals...');
    const { error: cartResetError } = await supabase
      .from('carts')
      .update({
        total_amount: 0.00,
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (cartResetError) {
      console.warn('⚠️ Warning resetting cart totals:', cartResetError.message);
    } else {
      console.log('✅ Cart totals reset');
    }

    console.log('🎉 All orders cleared successfully!');
    console.log('📊 Summary:');
    console.log('   - Order status history: Cleared');
    console.log('   - Order items: Cleared');
    console.log('   - Orders: Cleared');
    console.log('   - Cart items: Cleared');
    console.log('   - Cart totals: Reset');

  } catch (error) {
    console.error('❌ Error clearing orders:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  clearAllOrders()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { clearAllOrders };
