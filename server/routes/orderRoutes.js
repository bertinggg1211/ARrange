const express = require('express');
const router = express.Router();
const { supabase } = require('../db/supabase');
const authenticateToken = require('../middleware/auth');

// =============================================
// ORDER ROUTES FOR AR E-COMMERCE APP
// =============================================

// GET /api/orders - Get buyer's orders with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            id,
            name,
            images,
            price
          )
        ),
        seller:users!seller_id (
          id,
          full_name,
          seller_profile
        )
      `)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status && status !== 'All') {
      query = query.eq('status', status.toLowerCase());
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('❌ Error fetching orders:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch orders',
        error: error.message 
      });
    }

    // Transform data for frontend
    const transformedOrders = orders.map(order => {
      console.log('🔍 Order data for transformation:', {
        id: order.id,
        total_amount: order.total_amount,
        total_amount_type: typeof order.total_amount,
        total_amount_parsed: parseFloat(order.total_amount)
      });
      
      return {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        date: new Date(order.created_at).toLocaleDateString(),
        total: `₱${parseFloat(order.total_amount || 0).toLocaleString()}`,
        total_amount: order.total_amount, // Keep original for debugging
        paymentStatus: order.payment_status,
        trackingNumber: order.tracking_number,
      seller: {
        id: order.seller.id,
        name: order.seller.full_name,
        profile: order.seller.seller_profile
      },
      items: order.order_items.map(item => ({
        id: item.id,
        name: item.products.name,
        price: `₱${parseFloat(item.unit_price).toLocaleString()}`,
        quantity: item.quantity,
        image: item.products.images?.[0] || null,
        total: `₱${parseFloat(item.total_price).toLocaleString()}`
      })),
      shippingAddress: order.shipping_address,
      paymentMethod: order.payment_method,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at
      };
    });

    console.log(`✅ Fetched ${transformedOrders.length} orders for buyer ${userId}`);
    
    res.json({
      success: true,
      orders: transformedOrders,
      total: transformedOrders.length
    });

  } catch (error) {
    console.error('❌ Error in GET /api/orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/orders/seller - Get seller's orders
router.get('/seller', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const sellerId = req.user.id;

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            id,
            name,
            images,
            price
          )
        ),
        buyer:users!buyer_id (
          id,
          full_name,
          phone,
          email
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status && status !== 'All') {
      query = query.eq('status', status.toLowerCase());
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('❌ Error fetching seller orders:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch orders',
        error: error.message 
      });
    }

    // Transform data for seller frontend
    const transformedOrders = orders.map(order => ({
      id: order.id,
      seller_id: order.seller_id, // Add seller_id for shop reviews
      orderNumber: order.order_number,
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      date: new Date(order.created_at).toLocaleDateString(),
      orderDate: new Date(order.created_at).toLocaleString(),
      total: `₱${parseFloat(order.total_amount).toLocaleString()}`,
      subtotal: `₱${parseFloat(order.total_amount).toLocaleString()}`,
      shippingFee: '₱0',
      paymentStatus: order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1),
      trackingNumber: order.tracking_number,
      customer: {
        id: order.buyer.id, // CRITICAL: Buyer ID needed for chat notifications
        name: order.buyer.full_name,
        phone: order.buyer.phone || '+63 XXX XXX XXXX',
        email: order.buyer.email,
        avatar: null
      },
      items: order.order_items.map(item => ({
        id: item.id,
        product_id: item.product_id, // Add product_id for review requests
        name: item.products.name,
        price: `₱${parseFloat(item.unit_price).toLocaleString()}`,
        quantity: item.quantity,
        image: item.products.images?.[0] || null,
        sku: `SKU-${item.product_id.slice(-6).toUpperCase()}`
      })),
      shippingAddress: {
        fullAddress: order.shipping_address?.street + ', ' + order.shipping_address?.city + ', ' + order.shipping_address?.province,
        recipient: order.buyer.full_name,
        phone: order.buyer.phone || '+63 XXX XXX XXXX',
        notes: order.notes || 'No special instructions'
      },
      paymentMethod: order.payment_method || 'Credit Card',
      estimatedDelivery: order.status === 'delivered' ? 'Delivered' : '3-5 business days',
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }));

    console.log(`✅ Fetched ${transformedOrders.length} orders for seller ${sellerId}`);
    
    res.json({
      success: true,
      orders: transformedOrders,
      total: transformedOrders.length
    });

  } catch (error) {
    console.error('❌ Error in GET /api/orders/seller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/orders/:id - Get specific order details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const userId = req.user.id;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            id,
            name,
            images,
            price,
            description
          )
        ),
        buyer:users!buyer_id (
          id,
          full_name,
          phone,
          email
        ),
        seller:users!seller_id (
          id,
          full_name,
          seller_profile
        ),
        order_status_history (
          status,
          notes,
          created_at
        )
      `)
      .eq('id', orderId)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .single();

    if (error) {
      console.error('❌ Error fetching order details:', error);
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    console.log(`✅ Fetched order details for order ${orderId}`);
    
    res.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('❌ Error in GET /api/orders/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// POST /api/orders - Create new order from cart
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      cartItems, 
      shippingAddress, 
      paymentMethod, 
      notes 
    } = req.body;
    const buyerId = req.user.id;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cart items are required' 
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Shipping address is required' 
      });
    }

    // Group cart items by seller
    const ordersBySeller = {};
    for (const item of cartItems) {
      if (!ordersBySeller[item.sellerId]) {
        ordersBySeller[item.sellerId] = [];
      }
      ordersBySeller[item.sellerId].push(item);
    }

    const createdOrders = [];

    // Create separate orders for each seller
    for (const [sellerId, items] of Object.entries(ordersBySeller)) {
      // Calculate subtotal (product prices only)
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Calculate delivery and installation costs
      let totalDeliveryCharge = 0;
      let totalInstallationCost = 0;
      
      items.forEach(item => {
        // Add delivery charge for each unique product (not per quantity)
        if (item.deliveryCharge && item.deliveryCharge > 0) {
          totalDeliveryCharge += parseFloat(item.deliveryCharge);
        }
        
        // Add installation cost for each unique product (not per quantity)
        if (item.installationCost && item.installationCost > 0) {
          totalInstallationCost += parseFloat(item.installationCost);
        }
      });
      
      const totalAmount = subtotal + totalDeliveryCharge + totalInstallationCost;
      
      console.log('💰 Order total calculation:', {
        subtotal: subtotal,
        totalDeliveryCharge: totalDeliveryCharge,
        totalInstallationCost: totalInstallationCost,
        totalAmount: totalAmount,
        items: items.map(item => ({ 
          price: item.price, 
          quantity: item.quantity, 
          subtotal: item.price * item.quantity,
          deliveryCharge: item.deliveryCharge,
          installationCost: item.installationCost
        }))
      });

      // Generate order number with fallback
      let orderNumber;
      try {
        const { data: orderNumberResult, error: rpcError } = await supabase.rpc('generate_order_number');
        if (rpcError) {
          console.log('⚠️ RPC generate_order_number failed, using fallback:', rpcError.message);
          orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        } else {
          orderNumber = orderNumberResult || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
      } catch (error) {
        console.log('⚠️ RPC function not available, using fallback order number');
        orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      console.log('📋 Generated order number:', orderNumber);

      // Prepare order data for debugging - Fix data types
      const orderData = {
        buyer_id: buyerId,
        seller_id: sellerId,
        order_number: orderNumber,
        status: 'pending',
        total_amount: parseFloat(totalAmount), // Ensure it's a number
        shipping_address: JSON.stringify(shippingAddress), // Convert to JSON string
        payment_method: paymentMethod,
        payment_status: 'pending',
        notes: notes || ''
      };
      
      console.log('📦 Inserting order data:', orderData);

      // Debug: Test if we can access the orders table
      const { data: testData, error: testError } = await supabase
        .from('orders')
        .select('id')
        .limit(1);
      
      console.log('🔍 Test query result:', { testData, testError });

      // Create order with select - Use service role to bypass RLS
      console.log('🔍 Attempting insert with data:', JSON.stringify(orderData, null, 2));
      
      // Try insert without .single() first to see if that's the issue
      const { data: orderArray, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select();
        
      console.log('🔍 Insert result (without .single()):', { 
        data: orderArray, 
        error: orderError,
        errorMessage: orderError?.message,
        errorCode: orderError?.code,
        errorDetails: orderError?.details,
        errorHint: orderError?.hint,
        dataLength: orderArray?.length
      });
      
      // Get the first order if array is returned
      const order = orderArray && orderArray.length > 0 ? orderArray[0] : null;
        
      console.log('📥 Raw Supabase response:', { 
        data: orderArray, 
        error: orderError,
        dataType: typeof orderArray,
        isArray: Array.isArray(orderArray),
        arrayLength: orderArray ? orderArray.length : 'null'
      });
        
      // const order = orderArray; // Since we're using .single(), we get the object directly
        
      console.log('📥 Processed order:', order);

      if (orderError) {
        console.error('❌ Error creating order:', orderError);
        throw orderError;
      }

      if (!order) {
        console.error('❌ Order creation returned null - possible database schema issue');
        throw new Error('Order creation failed - no order returned from database');
      }

      console.log('✅ Order created successfully:', order);

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        product_snapshot: {
          name: item.name,
          images: item.images,
          description: item.description
        }
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Error creating order items:', itemsError);
        throw itemsError;
      }

      createdOrders.push(order);
    }

    console.log(`✅ Created ${createdOrders.length} orders for buyer ${buyerId}`);
    
    res.status(201).json({
      success: true,
      message: 'Orders created successfully',
      orders: createdOrders
    });

  } catch (error) {
    console.error('❌ Error in POST /api/orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create order',
      error: error.message 
    });
  }
});

// PUT /api/orders/:id/status - Update order status (seller only)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { status, trackingNumber, notes } = req.body;
    const userId = req.user.id;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    // Update order
    const updateData = { 
      status,
      updated_at: new Date().toISOString() // Manual updated_at since triggers may not work
    };
    if (trackingNumber) updateData.tracking_number = trackingNumber;

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('seller_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating order status:', error);
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or unauthorized' 
      });
    }

    // Add status history entry
    if (notes) {
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: status,
          notes: notes
        });
    }

    console.log(`✅ Updated order ${orderId} status to ${status}`);
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: order
    });

  } catch (error) {
    console.error('❌ Error in PUT /api/orders/:id/status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/orders/stats - Get order statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.query; // 'buyer' or 'seller'

    const userField = role === 'seller' ? 'seller_id' : 'buyer_id';

    const { data: stats, error } = await supabase
      .from('orders')
      .select('status')
      .eq(userField, userId);

    if (error) {
      console.error('❌ Error fetching order stats:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch statistics' 
      });
    }

    // Count orders by status
    const statusCounts = stats.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    console.log(`✅ Fetched order statistics for ${role} ${userId}`);
    console.log('📊 Raw stats data:', stats);
    console.log('📊 Status counts:', statusCounts);
    
    const finalStats = {
      total: stats.length,
      pending: statusCounts.pending || 0,
      confirmed: statusCounts.confirmed || 0,
      delivered: statusCounts.delivered || 0
    };
    
    console.log('📊 Final stats:', finalStats);
    
    res.json({
      success: true,
      stats: finalStats
    });

  } catch (error) {
    console.error('❌ Error in GET /api/orders/stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// DELETE /api/orders/:id - Cancel order (buyer only, if pending)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const userId = req.user.id;

    // Check if order exists and is pending
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .eq('buyer_id', userId)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending orders can be cancelled' 
      });
    }

    // Update order status to cancelled
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    if (error) {
      console.error('❌ Error cancelling order:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to cancel order' 
      });
    }

    console.log(`✅ Cancelled order ${orderId}`);
    
    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('❌ Error in DELETE /api/orders/:id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;
