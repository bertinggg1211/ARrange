const express = require('express');
const router = express.Router();

// Get KIRI Engine configuration
router.get('/config', (req, res) => {
  try {
    const apiKey = process.env.KIRI_ENGINE_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'KIRI Engine API key not configured'
      });
    }
    
    res.json({
      success: true,
      apiKey: apiKey,
      baseUrl: process.env.KIRI_ENGINE_API_BASE || 'https://api.kiriengine.app/api/v1'
    });
  } catch (error) {
    console.error('Error getting KIRI config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KIRI configuration'
    });
  }
});

// Test KIRI Engine API key and credits
router.get('/test', async (req, res) => {
  try {
    const apiKey = process.env.KIRI_ENGINE_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'KIRI Engine API key not configured'
      });
    }
    
    console.log('🧪 Testing KIRI Engine API key...');
    
    // Test API key by checking account balance
    const response = await fetch('https://api.kiriengine.app/api/v1/open/balance', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ KIRI API test failed:', response.status, errorText);
      return res.status(400).json({
        success: false,
        message: 'KIRI Engine API key test failed',
        status: response.status,
        error: errorText
      });
    }
    
    const data = await response.json();
    console.log('✅ KIRI Engine API test successful:', data);
    
    res.json({
      success: true,
      message: 'KIRI Engine API key is working',
      credits: data,
      apiKey: apiKey.substring(0, 10) + '...' // Show partial key for security
    });
    
  } catch (error) {
    console.error('❌ KIRI Engine test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test KIRI Engine API',
      error: error.message
    });
  }
});

module.exports = router;
