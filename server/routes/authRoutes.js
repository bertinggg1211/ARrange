const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Supabase users repository
const { supabase } = require('../db/supabase');
// Rate limiting middleware
const { authLimiter, signupLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_me';
const TOKEN_EXPIRES_IN = '7d';

function createToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, fullName: user.fullName, email: user.email },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

router.post('/signup', signupLimiter, async (req, res) => {
  try {
    const { role, fullName, email, password, address, phone, shopName } = req.body;

    if (!role || !fullName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const normalizedEmail = (email || '').trim().toLowerCase();
    
    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();
    
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Prepare seller profile for sellers
    let sellerProfile = {};
    if (role === 'seller') {
      sellerProfile = {
        businessName: shopName || '',
        businessDescription: '',
        businessAddress: address || '',
        businessPhone: phone || '',
        businessEmail: normalizedEmail,
        ownerName: fullName || '',
        profileImage: '',
        coverImage: '',
        shopLogo: '',
        shopBanner: '',
      };
    }

    // Prepare user data for insert - start with minimal required fields
    const userData = {
      email: normalizedEmail,
      password_hash: passwordHash,
      role,
      full_name: fullName
    };
    
    // Add optional fields only if they exist
    if (address) userData.address = address;
    if (phone) userData.phone = phone;
    if (shopName) userData.shop_name = shopName;
    if (role === 'seller' && sellerProfile) userData.seller_profile = sellerProfile;
    
    console.log('🔄 Attempting to insert user with data:', {
      email: userData.email,
      role: userData.role,
      full_name: userData.full_name,
      shop_name: userData.shop_name,
      hasSellerProfile: !!userData.seller_profile
    });

    // Insert user into Supabase - try without .select() first
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(userData);
      
    console.log('🔍 Raw insert result:', { insertData, insertError });
    
    if (insertError) {
      console.error('❌ Supabase insert error:', insertError);
      return res.status(500).json({ message: 'Failed to create user', error: insertError.message });
    }
    
    // Now fetch the created user
    const { data: fetchedUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();
      
    console.log('🔍 Fetch user result:', { 
      hasFetchedUser: !!fetchedUser, 
      fetchError: fetchError?.message 
    });
    
    const newUser = fetchedUser;
      
    console.log('🔍 Final result:', {
      hasData: !!newUser,
      hasInsertError: !!insertError,
      hasFetchError: !!fetchError
    });

    if (fetchError) {
      console.error('❌ Failed to fetch created user:', fetchError);
      return res.status(500).json({ message: 'Failed to fetch created user', error: fetchError.message });
    }

    if (!newUser) {
      console.error('❌ User creation failed: newUser is null');
      return res.status(500).json({ message: 'Failed to create user - no user returned' });
    }

    console.log('✅ User created successfully:', newUser.email);

    const token = createToken({
      id: newUser.id,
      role: newUser.role,
      fullName: newUser.full_name,
      email: newUser.email
    });
    
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        role: newUser.role,
        fullName: newUser.full_name,
        email: newUser.email,
        shopName: newUser.shop_name || '',
        sellerProfile: newUser.seller_profile || {},
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Find user in Supabase
    const { data: userDoc, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();
    
    if (error || !userDoc) {
      console.log('User not found:', normalizedEmail);
      return res.status(401).json({ message: 'Invalid email or password' }); 
    }

    console.log('🔍 Login attempt for:', normalizedEmail);
    console.log('🔍 User ID:', userDoc.id);
    console.log('🔍 Password hash exists:', !!userDoc.password_hash);
    console.log('🔍 Hash length:', userDoc.password_hash?.length);
    console.log('🔍 Hash preview:', userDoc.password_hash?.substring(0, 20) + '...');

    const valid = await bcrypt.compare(password, userDoc.password_hash);
    console.log('🔍 Password comparison result:', valid);
    
    if (!valid) {
      console.log('❌ Invalid password for user:', normalizedEmail);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createToken({
      id: userDoc.id,
      role: userDoc.role,
      fullName: userDoc.full_name,
      email: userDoc.email
    });
    console.log('✅ User logged in successfully:', normalizedEmail);
    
    res.json({
      token,
      user: {
        id: userDoc.id,
        role: userDoc.role,
        fullName: userDoc.full_name,
        email: userDoc.email,
        shopName: userDoc.shop_name || '',
        sellerProfile: userDoc.seller_profile || {},
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    
    // Check if it's a timeout error
    if (err.message && err.message.includes('timeout')) {
      return res.status(503).json({ 
        message: 'Request timeout. Please check your connection and try again.',
        error: 'TIMEOUT_ERROR'
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Me endpoint - get current user info
router.get('/me', auth, async (req, res) => {
  try {
    console.log('🔍 /me endpoint called with user:', req.user);
    const userId = req.user.id;
    console.log('🔍 Looking for user with ID:', userId);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      console.error('❌ User not found in database:', error?.message);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('✅ User found:', user.email);
    return res.json({ 
      user: { 
        id: user.id, 
        role: user.role, 
        fullName: user.full_name, 
        email: user.email, 
        shopName: user.shop_name || '', 
        sellerProfile: user.seller_profile || {} 
      } 
    });
  } catch (e) {
    console.error('❌ /me endpoint error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update password endpoint - for password reset flow
router.post('/update-password', async (req, res) => {
  try {
    const { userId, email, newPassword } = req.body;
    
    // Accept either userId or email - prefer email for password reset flow
    if ((!userId && !email) || !newPassword) {
      return res.status(400).json({ message: 'User identification (email or userId) and new password are required' });
    }

    console.log('🔐 Updating password for:', email || userId);
    console.log('🔐 New password length:', newPassword?.length);

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log('🔐 Generated hash length:', passwordHash?.length);
    console.log('🔐 Hash preview:', passwordHash?.substring(0, 20) + '...');
    
    // Update password_hash in users table - prioritize email lookup
    let query = supabase.from('users').update({ password_hash: passwordHash });
    
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      query = query.eq('email', normalizedEmail);
      console.log('🔐 Updating by email:', normalizedEmail);
    } else {
      query = query.eq('id', userId);
      console.log('🔐 Updating by user ID:', userId);
    }
    
    const { data, error } = await query.select();

    if (error) {
      console.error('❌ Error updating password:', error);
      return res.status(500).json({ message: 'Failed to update password', error: error.message });
    }

    if (!data || data.length === 0) {
      console.error('❌ User not found for password update');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Password updated successfully for user:', data[0].id);
    
    res.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });
  } catch (err) {
    console.error('❌ Password update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


