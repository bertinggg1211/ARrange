const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
}

// Create Supabase client with optimized settings for performance
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    }
  },
  // Disable realtime for better performance (we don't need it for this app)
  realtime: {
    disabled: true
  }
});

// Test connection function
async function testConnection() {
  try {
    console.log('🔄 Testing Supabase connection...');
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase Connected Successfully');
    console.log('🎉 CONNECTED TO SUPABASE! 🎉');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
}

// Connect function for compatibility with existing code
async function connect() {
  const isConnected = await testConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to Supabase');
  }
  return supabase;
}

module.exports = { 
  supabase, 
  connect, 
  testConnection 
};
