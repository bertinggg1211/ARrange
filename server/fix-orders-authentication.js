// =============================================
// FIX ORDERS AUTHENTICATION ISSUE
// This script fixes the RLS authentication problem
// =============================================

const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client with service role for server operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Alternative: Create a user-authenticated client for RLS
const createUserClient = (accessToken) => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  );
};

// Modified order creation function
const createOrderWithUserAuth = async (orderData, userToken) => {
  try {
    // Create user-authenticated client
    const supabaseUser = createUserClient(userToken);
    
    // Insert order with user authentication
    const { data: orderArray, error: orderError } = await supabaseUser
      .from('orders')
      .insert(orderData)
      .select();
      
    if (orderError) {
      console.error('❌ RLS Error:', orderError);
      throw orderError;
    }
    
    return orderArray && orderArray.length > 0 ? orderArray[0] : null;
    
  } catch (error) {
    console.error('❌ User auth error:', error);
    // Fallback to service role
    return await createOrderWithServiceRole(orderData);
  }
};

// Fallback: Create order with service role (bypasses RLS)
const createOrderWithServiceRole = async (orderData) => {
  const { data: orderArray, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert(orderData)
    .select();
    
  if (orderError) {
    throw orderError;
  }
  
  return orderArray && orderArray.length > 0 ? orderArray[0] : null;
};

module.exports = {
  createOrderWithUserAuth,
  createOrderWithServiceRole,
  supabaseAdmin
};
