const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Test endpoint to verify notifications route is working
router.get('/test', (req, res) => {
  console.log('🧪 Notification test endpoint hit');
  res.json({
    success: true,
    message: 'Notification routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Get notifications for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    console.log('🔔 Getting notifications for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      console.error('❌ User not authenticated or missing ID');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { supabase } = require('../db/supabase');

    // For now, return empty notifications to prevent errors
    // TODO: Implement notifications table and logic
    console.log('📝 Returning empty notifications (not implemented yet)');
    return res.json({
      success: true,
      notifications: [],
      message: 'Notifications feature coming soon'
    });
    
    console.log('🔍 Executing query with userId:', req.user.id);
    const result = await cluster.query(query, { parameters: [req.user.id] });
    const notifications = result.rows.map(row => ({
      id: row.docId,
      ...row.n
    }));

    console.log('✅ Found', notifications.length, 'notifications for user:', req.user.id);
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    // Return empty notifications array instead of error to prevent app crash
    console.log('🔄 Returning empty notifications due to error');
    res.json({ success: true, notifications: [] });
  }
});

// Mark notification as read
router.put('/:notificationId/read', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    console.log('📝 Marking notification as read:', notificationId, 'for user:', req.user.id);
    
    const { supabase } = require('../db/supabase');

    // Update notification as read
    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Error updating notification:', error);
      return res.status(500).json({ success: false, message: 'Failed to update notification' });
    }

    console.log('✅ Notification marked as read:', notificationId);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification', error: error.message });
  }
});

// Delete notification
router.delete('/:notificationId', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    console.log('🗑️ Deleting notification:', notificationId, 'for user:', req.user.id);
    
    const { supabase } = require('../db/supabase');

    // Delete the notification (only if user owns it)
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }

    console.log('✅ Notification deleted:', notificationId);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    
    // If document doesn't exist, just return success (already deleted)
    if (error.message && error.message.includes('document not found')) {
      console.log('🗑️ Notification not found, treating as already deleted:', notificationId);
      return res.json({ success: true, message: 'Notification not found (already deleted)' });
    }
    
    res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const { supabase } = require('../db/supabase');

    // Update all notifications for this user to read
    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', req.user.id)
      .eq('read', false);

    if (error) {
      console.error('Error updating notifications:', error);
      return res.status(500).json({ success: false, message: 'Failed to update notifications' });
    }

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications', error: error.message });
  }
});

// Clear all notifications
router.delete('/clear-all', auth, async (req, res) => {
  try {
    const { supabase } = require('../db/supabase');

    // Delete all notifications for the user
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Error clearing notifications:', error);
      return res.status(500).json({ success: false, message: 'Failed to clear notifications' });
    }

    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to clear notifications', error: error.message });
  }
});

// AR test functionality removed for clean e-commerce setup

module.exports = router;
