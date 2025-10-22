require('dotenv').config();
const { supabase } = require('./db/supabase');

async function testDatabaseSchema() {
  console.log('🔍 Testing database schema...');
  
  try {
    // Test 1: Check if users table exists by trying to select from it
    console.log('\n1. Testing users table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError);
      if (usersError.code === 'PGRST116' || usersError.message.includes('relation') || usersError.message.includes('does not exist')) {
        console.log('💡 Users table does not exist. Need to create it.');
        return false;
      }
    } else {
      console.log('✅ Users table exists');
      console.log('📊 Current users count:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('📋 Sample user structure:', Object.keys(users[0]));
      }
    }
    
    // Test 2: Try a simple insert to see what happens
    console.log('\n2. Testing simple user insert...');
    const testUser = {
      email: 'test-schema@example.com',
      password_hash: 'test-hash',
      role: 'seller',
      full_name: 'Schema Test User'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select();
    
    if (insertError) {
      console.error('❌ Insert test error:', insertError);
      console.log('💡 Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Insert test successful');
      console.log('📄 Inserted user:', insertResult);
      
      // Clean up test user
      if (insertResult && insertResult[0]) {
        await supabase
          .from('users')
          .delete()
          .eq('id', insertResult[0].id);
        console.log('🗑️ Test user cleaned up');
      }
    }
    
    // Test 3: Check products table
    console.log('\n3. Testing products table access...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.error('❌ Products table error:', productsError);
    } else {
      console.log('✅ Products table exists');
      console.log('📊 Current products count:', products?.length || 0);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Database schema test failed:', error);
    return false;
  }
}

// Run the test
if (require.main === module) {
  (async () => {
    console.log('🚀 Starting database schema test...');
    
    const isHealthy = await testDatabaseSchema();
    
    if (isHealthy) {
      console.log('\n✅ Database schema test completed!');
    } else {
      console.log('\n❌ Database schema has issues that need to be resolved.');
      console.log('\n💡 Recommended actions:');
      console.log('1. Check if the users table exists in your Supabase dashboard');
      console.log('2. Run the database-optimization.sql script to create missing tables');
      console.log('3. Verify your Supabase connection settings');
    }
    
    process.exit(isHealthy ? 0 : 1);
  })();
}

module.exports = { testDatabaseSchema };
