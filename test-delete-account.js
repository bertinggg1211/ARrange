const fetch = require('node-fetch');

const testDeleteAccount = async () => {
  try {
    console.log('🧪 Testing delete account endpoint...');
    
    // Test with a dummy token (this will fail auth but should show if endpoint exists)
    const response = await fetch('http://192.168.100.9:5000/api/user/delete-account', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer dummy-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    const data = await response.json();
    console.log('📡 Response data:', data);
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists but requires valid auth (expected)');
    } else if (response.status === 404) {
      console.log('❌ Endpoint not found');
    } else {
      console.log('🔍 Unexpected response');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testDeleteAccount();
