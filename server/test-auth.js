// Test Supabase Authentication Endpoints
require('dotenv').config();

async function testAuth() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🧪 Testing Supabase Authentication...\n');
  
  // Test 1: User Registration
  console.log('Test 1: User Registration');
  try {
    const signupData = {
      role: 'buyer',
      fullName: 'Test User',
      email: 'testuser@supabase.com',
      password: 'password123',
      address: '123 Test Street',
      phone: '1234567890'
    };
    
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Signup successful:', result.user.email);
      console.log('🔑 Token received:', result.token ? 'Yes' : 'No');
      
      // Store token for next test
      global.testToken = result.token;
      global.testUserId = result.user.id;
    } else {
      console.log('❌ Signup failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Signup error:', error.message);
  }
  
  // Test 2: User Login
  console.log('\nTest 2: User Login');
  try {
    const loginData = {
      email: 'testuser@supabase.com',
      password: 'password123'
    };
    
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful:', result.user.email);
      console.log('👤 User role:', result.user.role);
      console.log('🔑 Token received:', result.token ? 'Yes' : 'No');
    } else {
      console.log('❌ Login failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
  }
  
  // Test 3: Get User Profile (/me endpoint)
  if (global.testToken) {
    console.log('\nTest 3: Get User Profile');
    try {
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${global.testToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Profile retrieved:', result.user.email);
        console.log('📋 User data:', {
          id: result.user.id,
          role: result.user.role,
          fullName: result.user.fullName
        });
      } else {
        console.log('❌ Profile retrieval failed:', result.message);
      }
    } catch (error) {
      console.error('❌ Profile error:', error.message);
    }
  }
  
  // Test 4: Seller Registration
  console.log('\nTest 4: Seller Registration');
  try {
    const sellerData = {
      role: 'seller',
      fullName: 'Test Seller',
      email: 'testseller@supabase.com',
      password: 'password123',
      address: '456 Seller Street',
      phone: '0987654321',
      shopName: 'Test Shop'
    };
    
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sellerData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Seller signup successful:', result.user.email);
      console.log('🏪 Shop name:', result.user.shopName);
      console.log('👤 Role:', result.user.role);
    } else {
      console.log('❌ Seller signup failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Seller signup error:', error.message);
  }
  
  // Cleanup - Delete test users
  console.log('\nCleaning up test users...');
  try {
    const { supabase } = require('./db/supabase');
    
    await supabase
      .from('users')
      .delete()
      .eq('email', 'testuser@supabase.com');
    
    await supabase
      .from('users')
      .delete()
      .eq('email', 'testseller@supabase.com');
    
    console.log('✅ Test users cleaned up');
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
  
  console.log('\n🎉 Authentication tests completed!');
}

// Run tests
testAuth().catch(console.error);
