const express = require('express');
const router = express.Router();
const { supabase } = require('../db/supabase');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();
    
    if (error || !user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying admin status'
    });
  }
};

// ==================== USER MANAGEMENT ====================

// Get all users with statistics
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at, profile_picture')
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // Get statistics for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      let stats = {};
      
      if (user.role === 'seller') {
        // Get seller stats
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('seller_id', user.id);
        
        const { data: orders } = await supabase
          .from('orders')
          .select('id, total_amount')
          .eq('seller_id', user.id);
        
        const { data: userInfo } = await supabase
          .from('users')
          .select('shop_name')
          .eq('id', user.id)
          .single();
        
        stats = {
          totalProducts: products?.length || 0,
          totalOrders: orders?.length || 0,
          totalRevenue: orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0,
          shopName: userInfo?.shop_name || 'N/A'
        };
      } else if (user.role === 'buyer') {
        // Get buyer stats
        const { data: orders } = await supabase
          .from('orders')
          .select('id, total_amount')
          .eq('buyer_id', user.id);
        
        stats = {
          totalOrders: orders?.length || 0,
          totalSpent: orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0
        };
      }
      
      return { ...user, stats };
    }));

    res.json({
      success: true,
      users: usersWithStats,
      total: usersWithStats.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get single user details
router.get('/users/:userId', auth, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password hash from response
    delete user.password_hash;

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// Update user
router.put('/users/:userId', auth, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, fullName, role } = req.body;
    
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (email) updateData.email = email.toLowerCase().trim();
    if (fullName) updateData.full_name = fullName;
    if (role) updateData.role = role;

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;

    delete user.password_hash;

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Delete user
router.delete('/users/:userId', auth, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete user's related data first
    // Delete orders, products, cart, etc.
    await supabase.from('cart_items').delete().eq('user_id', userId);
    await supabase.from('carts').delete().eq('user_id', userId);
    await supabase.from('products').delete().eq('seller_id', userId);
    await supabase.from('shop_info').delete().eq('user_id', userId);
    await supabase.from('likes').delete().eq('user_id', userId);
    
    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// ==================== ORDER MANAGEMENT ====================

// Get all orders
router.get('/orders', auth, isAdmin, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:users!orders_buyer_id_fkey(id, email, full_name),
        seller:users!orders_seller_id_fkey(id, email, full_name),
        items:order_items(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    res.json({
      success: true,
      orders,
      total: orders.length
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// Get single order details
router.get('/orders/:orderId', auth, isAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:users!orders_buyer_id_fkey(id, email, full_name),
        seller:users!orders_seller_id_fkey(id, email, full_name),
        items:order_items(*),
        history:order_status_history(*)
      `)
      .eq('id', orderId)
      .single();
    
    if (error) throw error;

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
});

// Update order status
router.put('/orders/:orderId/status', auth, isAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Update order status
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();
    
    if (updateError) throw updateError;

    // Add to status history
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status,
        changed_by: req.user.id,
        created_at: new Date().toISOString()
      });

    res.json({
      success: true,
      message: 'Order status updated',
      order
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: error.message
    });
  }
});

// Delete order
router.delete('/orders/:orderId', auth, isAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Delete related data
    await supabase.from('order_status_history').delete().eq('order_id', orderId);
    await supabase.from('order_items').delete().eq('order_id', orderId);
    
    // Delete order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    
    if (error) throw error;

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order',
      error: error.message
    });
  }
});

// ==================== PRODUCT MANAGEMENT ====================

// Get all products
router.get('/products', auth, isAdmin, async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users!products_seller_id_fkey(id, email, full_name, shop_name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    res.json({
      success: true,
      products,
      total: products.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// Get single product details
router.get('/products/:productId', auth, isAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users!products_seller_id_fkey(id, email, full_name, shop_name)
      `)
      .eq('id', productId)
      .single();
    
    if (error) throw error;

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// Update product
router.put('/products/:productId', auth, isAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price, stock_quantity, category } = req.body;
    
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity;
    if (category) updateData.category = category;

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();
    
    if (error) throw error;

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// Delete product
router.delete('/products/:productId', auth, isAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Delete related data
    await supabase.from('cart_items').delete().eq('product_id', productId);
    await supabase.from('order_items').delete().eq('product_id', productId);
    await supabase.from('likes').delete().eq('product_id', productId);
    
    // Delete product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) throw error;

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

// ==================== STATISTICS ====================

// Get admin dashboard statistics
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    // Get user counts
    const { data: users } = await supabase.from('users').select('role');
    const totalUsers = users?.length || 0;
    const totalBuyers = users?.filter(u => u.role === 'buyer').length || 0;
    const totalSellers = users?.filter(u => u.role === 'buyer').length || 0;

    // Get order counts
    const { data: orders } = await supabase.from('orders').select('total_amount, status');
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;

    // Get product count
    const { data: products } = await supabase.from('products').select('id');
    const totalProducts = products?.length || 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalBuyers,
        totalSellers,
        totalOrders,
        totalProducts,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;
