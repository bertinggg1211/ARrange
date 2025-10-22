const express = require('express');
const router = express.Router();
const { supabase } = require('../db/supabase');
const authenticateToken = require('../middleware/auth');

// =============================================
// LIKES ROUTES FOR AR E-COMMERCE APP
// =============================================

// POST /api/likes - Add product to likes
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    console.log('❤️ Adding like for user:', userId, 'product:', productId);

    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID is required' 
      });
    }

    // Check if like already exists
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing like:', checkError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to check existing like' 
      });
    }

    if (existingLike) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product already liked' 
      });
    }

    // Add like
    const { data: like, error: insertError } = await supabase
      .from('likes')
      .insert({
        user_id: userId,
        product_id: productId
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error adding like:', insertError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to add like' 
      });
    }

    console.log('✅ Like added successfully:', like.id);
    
    res.json({
      success: true,
      message: 'Product added to favorites',
      like: like
    });

  } catch (error) {
    console.error('❌ Error in POST /api/likes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// DELETE /api/likes/:productId - Remove product from likes
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    console.log('💔 Removing like for user:', userId, 'product:', productId);

    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (deleteError) {
      console.error('❌ Error removing like:', deleteError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to remove like' 
      });
    }

    console.log('✅ Like removed successfully');
    
    res.json({
      success: true,
      message: 'Product removed from favorites'
    });

  } catch (error) {
    console.error('❌ Error in DELETE /api/likes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/likes - Get user's liked products
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('❤️ Fetching likes for user:', userId);

    const { data: likes, error } = await supabase
      .from('likes')
      .select(`
        *,
        products (
          id,
          name,
          price,
          images,
          category
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching likes:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch likes' 
      });
    }

    console.log(`✅ Fetched ${likes.length} likes for user ${userId}`);
    
    res.json({
      success: true,
      likes: likes,
      total: likes.length
    });

  } catch (error) {
    console.error('❌ Error in GET /api/likes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// GET /api/likes/check/:productId - Check if product is liked
router.get('/check/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    console.log('🔍 Checking like status for user:', userId, 'product:', productId);

    const { data: like, error } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error checking like status:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to check like status' 
      });
    }

    const isLiked = !!like;
    
    res.json({
      success: true,
      isLiked: isLiked
    });

  } catch (error) {
    console.error('❌ Error in GET /api/likes/check:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;
