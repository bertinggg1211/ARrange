const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Test endpoint to verify cart routes are working
router.get('/test', (req, res) => {
  console.log('🧪 Cart test endpoint hit');
  res.json({ 
    success: true, 
    message: 'Cart routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Test authenticated endpoint
router.get('/test-auth', auth, (req, res) => {
  console.log('🧪 Cart auth test endpoint hit');
  console.log('🔑 User:', req.user);
  res.json({ 
    success: true, 
    message: 'Cart auth routes are working!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Fallback cart endpoint (no database required)
router.get('/fallback', auth, (req, res) => {
  console.log('🛒 Fallback cart endpoint for user:', req.user?.id);
  res.json({
    success: true,
    cart: {
      userId: req.user.id,
      items: [],
      updatedAt: new Date().toISOString(),
      fallback: true
    },
    message: 'Using fallback cart (no database)'
  });
});

// Get user's cart
router.get('/', auth, (req, res, next) => {
  // Disable caching for cart data since it changes frequently
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
}, async (req, res) => {
  try {
    console.log('🛒 Getting cart for user:', req.user?.id);
    const { supabase } = require('../db/supabase');
    
    // Get or create user's cart
    let { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    // If no cart exists, create one
    if (cartError && cartError.code === 'PGRST116') {
      console.log('📝 No cart found, creating new cart for user');
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({
          user_id: req.user.id,
          items: [],
          total_amount: 0.00
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating cart:', createError);
        throw createError;
      }
      cart = newCart;
    } else if (cartError) {
      console.error('❌ Cart fetch error:', cartError);
      throw cartError;
    }

    // Get cart items with product details
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        price,
        selected_color,
        created_at,
        products!inner(
          id,
          name,
          price,
          images,
          seller_id,
          stock_quantity,
          status,
          delivery_charge,
          installation_cost,
          free_delivery_threshold,
          installation_included
        )
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('❌ Cart items fetch error:', itemsError);
      throw itemsError;
    }

    // Get seller details for each product
    const sellerIds = [...new Set(cartItems.map(item => item.products.seller_id))];
    const { data: sellers, error: sellersError } = await supabase
      .from('users')
      .select('id, full_name, shop_name')
      .in('id', sellerIds);

    if (sellersError) {
      console.error('❌ Sellers fetch error:', sellersError);
      throw sellersError;
    }

    // Transform cart items to expected format
    const transformedItems = cartItems.map(item => {
      const product = item.products;
      const seller = sellers.find(s => s.id === product.seller_id);
      
      return {
        id: item.id,
        productId: product.id,
        quantity: item.quantity,
        price: item.price,
        selectedColor: item.selected_color,
        deliveryCharge: product.delivery_charge,
        installationCost: product.installation_cost,
        freeDeliveryThreshold: product.free_delivery_threshold,
        installationIncluded: product.installation_included,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          images: product.images || [],
          sellerId: product.seller_id,
          sellerName: seller?.shop_name || seller?.full_name || 'Unknown Seller',
          stockQuantity: product.stock_quantity,
          status: product.status,
          deliveryCharge: product.delivery_charge,
          installationCost: product.installation_cost,
          freeDeliveryThreshold: product.free_delivery_threshold,
          installationIncluded: product.installation_included
        }
      };
    });

    // Calculate total amount including delivery and installation costs
    const subtotal = transformedItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    
    // Calculate delivery and installation costs
    let totalDeliveryCharge = 0;
    let totalInstallationCost = 0;
    
    transformedItems.forEach(item => {
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

    res.json({
      success: true,
      cart: {
        id: cart.id,
        userId: req.user.id,
        items: transformedItems,
        subtotal: subtotal,
        totalDeliveryCharge: totalDeliveryCharge,
        totalInstallationCost: totalInstallationCost,
        totalAmount: totalAmount,
        itemCount: transformedItems.reduce((sum, item) => sum + item.quantity, 0),
        updatedAt: cart.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart',
      message: error.message
    });
  }
});

// Get cart summary (lightweight version for cart badge)
router.get('/summary', auth, (req, res, next) => {
  // Add caching headers for better performance
  res.set('Cache-Control', 'private, max-age=15'); // Cache for 15 seconds
  res.set('Pragma', 'cache');
  res.set('Expires', new Date(Date.now() + 15000).toUTCString());
  next();
}, async (req, res) => {
  try {
    console.log('🛒 Getting cart summary for user:', req.user?.id);
    const { supabase } = require('../db/supabase');
    
    // Get user's cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id, total_amount, updated_at')
      .eq('user_id', req.user.id)
      .single();

    if (cartError && cartError.code === 'PGRST116') {
      // No cart exists
      return res.json({
        success: true,
        summary: {
          itemCount: 0,
          totalAmount: 0.00,
          hasItems: false
        }
      });
    } else if (cartError) {
      console.error('❌ Cart summary fetch error:', cartError);
      throw cartError;
    }

    // Get item count and total including delivery and installation
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        quantity, 
        price,
        products!inner(
          delivery_charge,
          installation_cost,
          free_delivery_threshold,
          installation_included
        )
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('❌ Cart items summary error:', itemsError);
      throw itemsError;
    }

    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate delivery and installation costs
    let totalDeliveryCharge = 0;
    let totalInstallationCost = 0;
    
    cartItems.forEach(item => {
      const product = item.products;
      if (product.delivery_charge && product.delivery_charge > 0) {
        totalDeliveryCharge += parseFloat(product.delivery_charge);
      }
      if (product.installation_cost && product.installation_cost > 0) {
        totalInstallationCost += parseFloat(product.installation_cost);
      }
    });
    
    const totalAmount = subtotal + totalDeliveryCharge + totalInstallationCost;

    res.json({
      success: true,
      summary: {
        itemCount,
        subtotal,
        totalDeliveryCharge,
        totalInstallationCost,
        totalAmount,
        hasItems: itemCount > 0,
        updatedAt: cart.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Cart summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart summary',
      message: error.message
    });
  }
});

// Add item to cart
router.post('/add', auth, async (req, res) => {
  try {
    console.log('🛒 Cart add request received');
    console.log('🔑 User:', req.user?.id);
    console.log('📦 Request body:', req.body);
    
    const { productId, quantity = 1, selectedColor = null } = req.body;
    
    if (!productId) {
      console.error('❌ Missing product ID');
      return res.status(400).json({ 
        success: false,
        error: 'Product ID is required' 
      });
    }

    const { supabase } = require('../db/supabase');

    // Validate product exists and is available
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity, status, seller_id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('❌ Product not found:', productError);
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if product is available
    if (product.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Product is not available for purchase'
      });
    }

    // Check stock availability
    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.stock_quantity} items available in stock`
      });
    }

    // Get or create user's cart
    let { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (cartError && cartError.code === 'PGRST116') {
      // Create new cart
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({
          user_id: req.user.id,
          items: [],
          total_amount: 0.00
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating cart:', createError);
        throw createError;
      }
      cart = newCart;
    } else if (cartError) {
      console.error('❌ Cart fetch error:', cartError);
      throw cartError;
    }

    // Check if item already exists in cart
    const { data: existingItem, error: itemError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .eq('selected_color', selectedColor)
      .single();

    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + parseInt(quantity);
      
      // Check stock again for updated quantity
      if (product.stock_quantity < newQuantity) {
        return res.status(400).json({
          success: false,
          error: `Cannot add ${quantity} more items. Only ${product.stock_quantity - existingItem.quantity} available`
        });
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Cart item quantity updated successfully',
        cart: {
          userId: req.user.id,
          updatedAt: new Date().toISOString()
        }
      });
    } else {
      // Add new item to cart
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: productId,
          quantity: parseInt(quantity),
          price: product.price,
          selected_color: selectedColor
        })
        .select();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Item added to cart successfully',
        cart: {
          userId: req.user.id,
          updatedAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('❌ Cart add error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add item to cart',
      message: error.message 
    });
  }
});

// Update item quantity in cart
router.put('/update', auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || quantity === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'Product ID and quantity are required' 
      });
    }

    const { supabase } = require('../db/supabase');

    // Get user's cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (cartError) {
      console.error('Error fetching cart:', cartError);
      return res.status(404).json({ 
        success: false,
        error: 'Cart not found' 
      });
    }

    // Find cart item
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .single();

    if (itemError || !cartItem) {
      return res.status(404).json({ 
        success: false,
        error: 'Item not found in cart' 
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItem.id);

      if (deleteError) {
        console.error('Error removing cart item:', deleteError);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to remove item from cart' 
        });
      }

      res.json({
        success: true,
        message: 'Item removed from cart successfully',
        cart: {
          userId: req.user.id,
          updatedAt: new Date().toISOString()
        }
      });
    } else {
      // Validate stock availability
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      if (product.stock_quantity < quantity) {
        return res.status(400).json({
          success: false,
          error: `Only ${product.stock_quantity} items available in stock`
        });
      }

      // Update quantity
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ 
          quantity: quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartItem.id);

      if (updateError) {
        console.error('Error updating cart item:', updateError);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to update cart item' 
        });
      }

      res.json({
        success: true,
        message: 'Cart item updated successfully',
        cart: {
          userId: req.user.id,
          updatedAt: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cart',
      message: error.message
    });
  }
});

// Remove item from cart
router.delete('/remove/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('🗑️ Removing item from cart:', { productId, userId: req.user?.id });

    const { supabase } = require('../db/supabase');

    // Get user's cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (cartError) {
      console.error('Error fetching cart:', cartError);
      return res.status(404).json({ 
        success: false,
        error: 'Cart not found' 
      });
    }

    // Find and remove cart item by product_id
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .single();

    if (itemError) {
      console.error('Error finding cart item:', itemError);
      return res.status(404).json({ 
        success: false,
        error: 'Item not found in cart' 
      });
    }

    if (!cartItem) {
      return res.status(404).json({ 
        success: false,
        error: 'Item not found in cart' 
      });
    }

    // Remove the item
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItem.id);

    if (deleteError) {
      console.error('Error removing cart item:', deleteError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to remove item from cart' 
      });
    }

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      cart: {
        userId: req.user.id,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart',
      message: error.message
    });
  }
});

// Clear entire cart
router.delete('/clear', auth, async (req, res) => {
  try {
    console.log('🧹 Clearing cart for user:', req.user?.id);

    const { supabase } = require('../db/supabase');

    // Get user's cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (cartError) {
      console.error('Error fetching cart:', cartError);
      return res.status(404).json({ 
        success: false,
        error: 'Cart not found' 
      });
    }

    // Remove all cart items
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (deleteError) {
      console.error('Error clearing cart items:', deleteError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to clear cart' 
      });
    }

    // Update cart total
    const { error: updateError } = await supabase
      .from('carts')
      .update({
        total_amount: 0.00,
        updated_at: new Date().toISOString()
      })
      .eq('id', cart.id);

    if (updateError) {
      console.error('Error updating cart total:', updateError);
      // Don't fail the request for this
    }

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart: {
        userId: req.user.id,
        itemCount: 0,
        totalAmount: 0.00,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart',
      message: error.message
    });
  }
});

module.exports = router;
