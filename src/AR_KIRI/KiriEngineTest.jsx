import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { kiriEngineApi, validateKiriApiKey, formatFileSize, KIRI_CONFIG, validateApiKeyFormat } from '../api/kiriEngineApi';

// Get KIRI API key from configuration
const KIRI_API_KEY = KIRI_CONFIG.API_KEY;

export default function KiriEngineTest({ navigation }) {
  const insets = useSafeAreaInsets();
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addTestResult = (type, message) => {
    setTestResults(prev => [...prev, { type, message, timestamp: Date.now() }]);
  };

  const testKiriAPI = async () => {
    setTesting(true);
    setTestResults([]);
    
    try {
      console.log('🚀 Testing KIRI Engine API...');
      
      // Test 1: Check API connectivity with different endpoints
      addTestResult('info', 'Testing API connectivity...');
      
      const endpoints = [
        { name: 'Credits (v1)', url: 'https://api.kiriengine.app/v1/account/credits' },
        { name: 'Credits (v2)', url: 'https://api.kiriengine.app/v2/account/credits' },
        { name: 'Status', url: 'https://api.kiriengine.app/v1/status' },
        { name: 'Health', url: 'https://api.kiriengine.app/health' },
        { name: 'Alternative Base', url: 'https://api.kiriengine.com/v1/account/credits' },
      ];
      
      for (const endpoint of endpoints) {
        try {
          addTestResult('info', `Testing ${endpoint.name}...`);
          
          const response = await fetch(endpoint.url, {
            headers: {
              'Authorization': `Bearer ${KIRI_API_KEY}`,
              'X-API-Key': KIRI_API_KEY, // Try both auth methods
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            addTestResult('success', `✅ ${endpoint.name} works! Response: ${JSON.stringify(data).substring(0, 100)}...`);
            break; // Found working endpoint
          } else {
            const errorText = await response.text().catch(() => 'Unknown error');
            addTestResult('warning', `⚠️ ${endpoint.name}: ${response.status} - ${errorText.substring(0, 100)}`);
          }
        } catch (error) {
          addTestResult('warning', `⚠️ ${endpoint.name}: ${error.message}`);
        }
      }

      // Test 2: Test API Key Validation
      addTestResult('info', 'Validating API key format...');
      
      const keyValidation = validateApiKeyFormat(KIRI_API_KEY);
      if (keyValidation.valid) {
        addTestResult('success', '✅ API key format looks correct');
      } else {
        addTestResult('error', '❌ API key format issues detected:');
        keyValidation.issues.forEach(issue => {
          addTestResult('error', `   - ${issue}`);
        });
      }
      
      addTestResult('info', `API Key: ${keyValidation.format}`);
      addTestResult('info', `API Key Length: ${keyValidation.length} characters`);
      addTestResult('info', `API Key Source: Direct Configuration (included in app)`);
      addTestResult('info', `Scan Type: ${KIRI_CONFIG.SCAN_TYPE}`);
      addTestResult('info', `Primary Endpoint: ${KIRI_CONFIG.API_BASE}`);
      
      // Add troubleshooting for 401 errors
      addTestResult('info', '💡 If you get 401 Unauthorized errors:');
      addTestResult('info', '   - Check if API key is valid and not expired');
      addTestResult('info', '   - Verify account has sufficient credits');
      addTestResult('info', '   - Ensure account is not suspended');
      addTestResult('info', '   - Check if API key has access to Photo Scan endpoint');
      
      // Test 3: Test different authentication methods
      addTestResult('info', 'Testing different auth methods...');
      
      const authMethods = [
        { name: 'Bearer Token', headers: { 'Authorization': `Bearer ${KIRI_API_KEY}` } },
        { name: 'X-API-Key Header', headers: { 'X-API-Key': KIRI_API_KEY } },
        { name: 'API-Key Header', headers: { 'API-Key': KIRI_API_KEY } },
        { name: 'X-Auth-Token', headers: { 'X-Auth-Token': KIRI_API_KEY } },
      ];
      
      for (const method of authMethods) {
        try {
          const response = await fetch('https://api.kiriengine.app/v1/account/credits', {
            headers: method.headers,
          });
          
          if (response.ok) {
            const data = await response.json();
            addTestResult('success', `✅ ${method.name} works! Credits: ${data.credits || 'Unknown'}`);
            break;
          } else {
            addTestResult('warning', `⚠️ ${method.name}: ${response.status}`);
          }
        } catch (error) {
          addTestResult('warning', `⚠️ ${method.name}: ${error.message}`);
        }
      }
      
      // Test 4: Test real KIRI Engine scan creation
      addTestResult('info', 'Testing real KIRI Engine scan creation...');
      
      const testImages = [
        { uri: 'https://via.placeholder.com/400x400/FF8B47/FFFFFF?text=Front', angle: 'Front View' },
        { uri: 'https://via.placeholder.com/400x400/2196F3/FFFFFF?text=Back', angle: 'Back View' },
      ];
      
      try {
        const scanResult = await kiriEngineApi.createScan(testImages, 'Test Product');
        
        if (scanResult && scanResult.scanId) {
          addTestResult('success', `✅ Real KIRI scan created! ID: ${scanResult.scanId}`);
          addTestResult('info', `GLB URL: ${scanResult.glbUrl}`);
          addTestResult('info', `Quality: ${scanResult.quality}`);
          addTestResult('info', `File Size: ${scanResult.fileSize}`);
          addTestResult('success', '✅ KIRI Engine API is working in production mode!');
        } else {
          addTestResult('error', 'Failed to create KIRI scan');
        }
      } catch (error) {
        addTestResult('error', `KIRI Engine error: ${error.message}`);
        addTestResult('warning', 'Check your KIRI Engine API key and credits');
      }

      // Test 5: File Format Utilities
      addTestResult('info', 'Testing utility functions...');
      try {
        const testSizes = [1024, 1048576, 2621440];
        const formattedSizes = testSizes.map(size => formatFileSize(size));
        addTestResult('success', `Size formatting: ${formattedSizes.join(', ')}`);
      } catch (error) {
        addTestResult('error', `Utility function error: ${error.message}`);
      }

    } catch (error) {
      console.error('Test error:', error);
      addTestResult('error', `General test error: ${error.message}`);
    }

    setTesting(false);
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle', color: '#10B981' };
      case 'error': return { name: 'close-circle', color: '#EF4444' };
      case 'warning': return { name: 'warning', color: '#F59E0B' };
      case 'info': return { name: 'information-circle', color: '#3B82F6' };
      default: return { name: 'help-circle', color: '#6B7280' };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>KIRI Engine Test</Text>
          <Text style={styles.headerSubtitle}>Integration Diagnostics</Text>
        </View>
        <TouchableOpacity 
          style={styles.helpButton} 
          onPress={() => {
            Alert.alert(
              'Test Information',
              'This tool tests the KIRI Engine integration:\n\n• API Key validation\n• Credits availability\n• Mock scanning workflow\n• Utility functions\n\nRun tests to verify everything is working correctly.'
            );
          }}
        >
          <Icon name="information-circle" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Test Controls */}
        <View style={styles.controlsSection}>
          <TouchableOpacity 
            style={[styles.testButton, testing && styles.testButtonDisabled].filter(Boolean)}
            onPress={testKiriAPI}
            disabled={testing}
          >
            <Icon 
              name={testing ? "hourglass" : "play"} 
              size={24} 
              color="#FFFFFF" 
            />
            <Text style={styles.testButtonText}>
              {testing ? 'Running Tests...' : 'Run KIRI Engine Tests'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Test Results */}
        {testResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            
            {testResults.map((result, index) => {
              const statusIcon = getStatusIcon(result.type);
              return (
                <View key={index} style={styles.testResult}>
                  <View style={styles.testResultHeader}>
                    <Icon 
                      name={statusIcon.name} 
                      size={20} 
                      color={statusIcon.color} 
                    />
                    <Text style={styles.testName}>{result.type.toUpperCase()}</Text>
                    <Text style={styles.testStatus}>{new Date(result.timestamp).toLocaleTimeString()}</Text>
                  </View>
                  <Text style={styles.testDetails}>{result.message}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* API Configuration Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>API Configuration</Text>
          
          <View style={styles.infoCard}>
            <Icon name="key-outline" size={32} color="#FF8B47" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>KIRI Engine API Key</Text>
              <Text style={styles.infoDescription}>
                API Key: {KIRI_API_KEY.substring(0, 15)}...{KIRI_API_KEY.substring(KIRI_API_KEY.length - 5)}
              </Text>
              <Text style={styles.infoDescription}>
                Source: Direct Configuration (included in app)
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Icon name="settings-outline" size={32} color="#10B981" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Scan Configuration</Text>
              <Text style={styles.infoDescription}>
                Type: {KIRI_CONFIG.SCAN_TYPE}
              </Text>
              <Text style={styles.infoDescription}>
                Endpoint: Photo Scan (No 3DGS, Featureless)
              </Text>
            </View>
          </View>
        </View>

        {/* Integration Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Integration Status</Text>
          
          <View style={styles.infoCard}>
            <Icon name="cube-outline" size={32} color="#FF8B47" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>KIRI Engine Scanner</Text>
              <Text style={styles.infoDescription}>
                Professional 3D scanning with photogrammetry technology
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Icon name="cloud-upload-outline" size={32} color="#10B981" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Cloudinary Storage</Text>
              <Text style={styles.infoDescription}>
                GLB files automatically stored in cloud storage
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Icon name="eye-outline" size={32} color="#3B82F6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>AR Preview</Text>
              <Text style={styles.infoDescription}>
                Immediate 3D model preview after scanning
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('KiriEngineScanner', {
              productName: 'Test Product',
              productId: null
            })}
          >
            <Icon name="camera" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Test Scanner</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('UploadScreen')}
          >
            <Icon name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Upload Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 139, 71, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  controlsSection: {
    paddingVertical: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8B47',
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  testButtonDisabled: {
    backgroundColor: '#64748B',
    shadowOpacity: 0.1,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  resultsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  testResult: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  testResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 10,
  },
  testStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  testDetails: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 5,
    lineHeight: 20,
  },
  infoSection: {
    marginBottom: 30,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  infoDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  actionsSection: {
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 139, 71, 0.2)',
    borderWidth: 1,
    borderColor: '#FF8B47',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },
};
