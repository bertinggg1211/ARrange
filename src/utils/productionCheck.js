// Production Readiness Checker
import { BASE_URL } from '../api/api';

export const checkProductionReadiness = async () => {
  const results = {
    server: { status: 'checking', message: '', details: {} },
    database: { status: 'checking', message: '', details: {} },
    cloudinary: { status: 'checking', message: '', details: {} },
    kiri: { status: 'checking', message: '', details: {} }
  };

  console.log('🔍 PRODUCTION READINESS CHECK');
  console.log('================================');

  // 1. Check Server Connection
  try {
    console.log('🌐 Testing server connection...');
    const response = await fetch(`${BASE_URL}/api/products?limit=1`, {
      method: 'GET',
      timeout: 10000
    });

    if (response.ok) {
      const data = await response.json();
      results.server = {
        status: 'success',
        message: `✅ Server connected (${BASE_URL})`,
        details: {
          url: BASE_URL,
          responseTime: Date.now(),
          productsCount: data.products?.length || 0
        }
      };
      console.log('✅ Server: CONNECTED');
    } else {
      results.server = {
        status: 'error',
        message: `❌ Server error: ${response.status}`,
        details: { status: response.status, url: BASE_URL }
      };
      console.log('❌ Server: ERROR');
    }
  } catch (error) {
    results.server = {
      status: 'error',
      message: `❌ Server connection failed: ${error.message}`,
      details: { error: error.message, url: BASE_URL }
    };
    console.log('❌ Server: FAILED');
  }

  // 2. Check Database Connection
  try {
    console.log('🗄️ Testing database connection...');
    const response = await fetch(`${BASE_URL}/api/health/db`, {
      method: 'GET',
      timeout: 10000
    });

    if (response.ok) {
      const data = await response.json();
      results.database = {
        status: 'success',
        message: '✅ Database connected (Couchbase)',
        details: data
      };
      console.log('✅ Database: CONNECTED');
    } else {
      results.database = {
        status: 'error',
        message: `❌ Database error: ${response.status}`,
        details: { status: response.status }
      };
      console.log('❌ Database: ERROR');
    }
  } catch (error) {
    results.database = {
      status: 'error',
      message: `❌ Database connection failed: ${error.message}`,
      details: { error: error.message }
    };
    console.log('❌ Database: FAILED');
  }

  // 3. Check Cloudinary Configuration
  try {
    console.log('☁️ Testing Cloudinary connection...');
    const response = await fetch(`${BASE_URL}/api/health/cloudinary`, {
      method: 'GET',
      timeout: 10000
    });

    if (response.ok) {
      const data = await response.json();
      results.cloudinary = {
        status: 'success',
        message: '✅ Cloudinary configured',
        details: data
      };
      console.log('✅ Cloudinary: CONFIGURED');
    } else {
      results.cloudinary = {
        status: 'error',
        message: `❌ Cloudinary error: ${response.status}`,
        details: { status: response.status }
      };
      console.log('❌ Cloudinary: ERROR');
    }
  } catch (error) {
    results.cloudinary = {
      status: 'error',
      message: `❌ Cloudinary check failed: ${error.message}`,
      details: { error: error.message }
    };
    console.log('❌ Cloudinary: FAILED');
  }

  // 4. Check KIRI Engine API
  try {
    console.log('🎯 Testing KIRI Engine API...');
    const response = await fetch('https://api.kiriengine.app/v1/account/credits', {
      headers: {
        'Authorization': 'Bearer kiri_FxXDuVsTyt4Gwfs57HH_SFvpxR4ipEMNeHhodLXXVuQ'
      },
      timeout: 10000
    });

    if (response.ok) {
      const data = await response.json();
      results.kiri = {
        status: 'success',
        message: `✅ KIRI Engine connected (${data.credits || 'Unknown'} credits)`,
        details: data
      };
      console.log('✅ KIRI Engine: CONNECTED');
    } else {
      results.kiri = {
        status: 'error',
        message: `❌ KIRI Engine error: ${response.status}`,
        details: { status: response.status }
      };
      console.log('❌ KIRI Engine: ERROR');
    }
  } catch (error) {
    results.kiri = {
      status: 'error',
      message: `❌ KIRI Engine failed: ${error.message}`,
      details: { error: error.message }
    };
    console.log('❌ KIRI Engine: FAILED');
  }

  console.log('================================');
  console.log('📊 PRODUCTION CHECK COMPLETE');
  
  return results;
};

export const getProductionStatus = (results) => {
  const allSuccess = Object.values(results).every(r => r.status === 'success');
  const criticalErrors = Object.values(results).filter(r => r.status === 'error').length;
  
  if (allSuccess) {
    return {
      status: 'ready',
      message: '🚀 All systems ready for production!',
      color: '#10B981'
    };
  } else if (criticalErrors > 2) {
    return {
      status: 'not-ready',
      message: `❌ ${criticalErrors} critical issues found`,
      color: '#EF4444'
    };
  } else {
    return {
      status: 'partial',
      message: `⚠️ ${criticalErrors} issues need attention`,
      color: '#F59E0B'
    };
  }
};
