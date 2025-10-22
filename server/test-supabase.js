require('dotenv').config();
const { supabase, testConnection } = require('./db/supabase');

async function runTests() {
  console.log('🧪 Testing Supabase Connection...\n');
  
  // Test 1: Basic connection
  console.log('Test 1: Basic Connection');
  const isConnected = await testConnection();
  
  if (!isConnected) {
    console.log('❌ Connection failed. Please check your .env configuration.');
    return;
  }
  
  // Test 2: Check tables exist
  console.log('\nTest 2: Checking Tables');
  try {
    const tables = ['users', 'products', 'orders', 'chats', 'messages', 'carts', 'ar_scans', 'likes'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': OK`);
      }
    }
  } catch (error) {
    console.error('❌ Table check failed:', error.message);
  }
  
  // Test 3: Insert test user
  console.log('\nTest 3: Insert Test User');
  try {
    const testUser = {
      email: 'test@supabase.com',
      password_hash: 'hashed_password_123',
      role: 'buyer',
      full_name: 'Test User',
      phone: '1234567890'
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert(testUser)
      .select();
    
    if (error) {
      console.log('❌ Insert failed:', error.message);
    } else {
      console.log('✅ Test user inserted:', data[0].id);
      
      // Clean up - delete test user
      await supabase
        .from('users')
        .delete()
        .eq('email', 'test@supabase.com');
      console.log('✅ Test user cleaned up');
    }
  } catch (error) {
    console.error('❌ Insert test failed:', error.message);
  }
  
  console.log('\n🎉 Supabase tests completed!');
}

runTests().catch(console.error);
