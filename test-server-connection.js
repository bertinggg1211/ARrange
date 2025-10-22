#!/usr/bin/env node

/**
 * Test script to verify server connectivity
 * Usage: node test-server-connection.js [server-url]
 */

const https = require('https');
const http = require('http');

const testUrl = process.argv[2] || 'http://192.168.100.9:5000';

console.log('🧪 Testing server connection...');
console.log('📍 URL:', testUrl);

const testEndpoint = `${testUrl}/api/products?limit=1`;

function testConnection(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          responseTime,
          data: data.substring(0, 200),
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTest() {
  try {
    console.log('⏳ Connecting...');
    const result = await testConnection(testEndpoint);
    
    console.log('\n✅ CONNECTION SUCCESSFUL!');
    console.log('📊 Results:');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response Time: ${result.responseTime}ms`);
    console.log(`   Content-Type: ${result.headers['content-type'] || 'N/A'}`);
    
    if (result.status === 200) {
      console.log('🎉 Server is ready for your React Native app!');
      console.log('\n📱 Your friend can use this URL in the app:');
      console.log(`   ${testUrl}`);
    } else {
      console.log(`⚠️  Server responded with status ${result.status}`);
      console.log('   This might still work, but check your server logs');
    }
    
  } catch (error) {
    console.log('\n❌ CONNECTION FAILED!');
    console.log('💡 Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure your server is running (npm start)');
    console.log('   2. Check if ngrok tunnel is active (ngrok http 5000)');
    console.log('   3. Verify the URL is correct');
    console.log('   4. Check firewall settings');
  }
}

runTest();
