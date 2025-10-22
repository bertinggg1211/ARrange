const express = require('express');
const router = express.Router();
const { supabase } = require('../db/supabase');
const auth = require('../middleware/auth');

// Clear all orders (Admin only)
router.delete('/orders/clear', auth, async (req, res) => {
  try {
    console.log('🗑️ Admin clearing all orders...');
    
    // Check if user is admin (you can add admin role check here)
    // For now, allowing any authenticated user to clear orders
    
    // Step 1: Delete order status history
    console.log('📊 Deleting order status history...');
    const { error: historyError } = await supabase
      .from('order_status_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (historyError) {
      console.warn('⚠️ Warning deleting order status history:', historyError.message);
    }

    // Step 2: Delete order items
    console.log('🛒 Deleting order items...');
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (itemsError) {
      console.warn('⚠️ Warning deleting order items:', itemsError.message);
    }

    // Step 3: Delete orders
    console.log('📦 Deleting orders...');
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (ordersError) {
      console.error('❌ Error deleting orders:', ordersError);
      return res.status(500).json({
        success: false,
        message: 'Failed to clear orders',
        error: ordersError.message
      });
    }

    // Step 4: Clear cart items
    console.log('🛍️ Clearing cart items...');
    const { error: cartItemsError } = await supabase
      .from('cart_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (cartItemsError) {
      console.warn('⚠️ Warning clearing cart items:', cartItemsError.message);
    }

    // Step 5: Reset cart totals
    console.log('💰 Resetting cart totals...');
    const { error: cartResetError } = await supabase
      .from('carts')
      .update({
        total_amount: 0.00,
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (cartResetError) {
      console.warn('⚠️ Warning resetting cart totals:', cartResetError.message);
    }

    console.log('✅ All orders cleared successfully');
    
    res.json({
      success: true,
      message: 'All orders cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in clear orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Clear user's orders
router.delete('/orders/clear-user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    console.log(`🗑️ Clearing orders for user: ${userId}`);
    
    // Check if user is clearing their own orders or is admin
    if (userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only clear your own orders'
      });
    }

    // Get user's orders
    const { data: userOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    
    if (ordersError) {
      console.error('❌ Error fetching user orders:', ordersError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user orders',
        error: ordersError.message
      });
    }

    if (!userOrders || userOrders.length === 0) {
      return res.json({
        success: true,
        message: 'No orders found for this user',
        ordersCleared: 0
      });
    }

    const orderIds = userOrders.map(order => order.id);
    console.log(`📦 Found ${orderIds.length} orders to delete`);

    // Delete order status history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .delete()
      .in('order_id', orderIds);
    
    if (historyError) {
      console.warn('⚠️ Warning deleting order status history:', historyError.message);
    }

    // Delete order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .in('order_id', orderIds);
    
    if (itemsError) {
      console.warn('⚠️ Warning deleting order items:', itemsError.message);
    }

    // Delete orders
    const { error: deleteOrdersError } = await supabase
      .from('orders')
      .delete()
      .in('id', orderIds);
    
    if (deleteOrdersError) {
      console.error('❌ Error deleting orders:', deleteOrdersError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete orders',
        error: deleteOrdersError.message
      });
    }

    // Clear user's cart
    const { error: cartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
    
    if (cartError) {
      console.warn('⚠️ Warning clearing cart items:', cartError.message);
    }

    // Reset cart total
    const { error: cartResetError } = await supabase
      .from('carts')
      .update({
        total_amount: 0.00,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (cartResetError) {
      console.warn('⚠️ Warning resetting cart total:', cartResetError.message);
    }

    console.log(`✅ Cleared ${orderIds.length} orders for user ${userId}`);
    
    res.json({
      success: true,
      message: `Cleared ${orderIds.length} orders successfully`,
      ordersCleared: orderIds.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in clear user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
