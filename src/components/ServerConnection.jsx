import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { serverManager, SERVER_CONFIGS } from '../config/serverConfig';

const ServerConnection = ({ visible, onClose, onServerChanged }) => {
  const [customUrl, setCustomUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    if (visible) {
      loadServerStatus();
    }
  }, [visible]);

  const loadServerStatus = async () => {
    const status = serverManager.getStatus();
    setServerStatus(status);
  };

  const testServer = async (serverUrl) => {
    setIsLoading(true);
    setTestResults(prev => ({ ...prev, [serverUrl]: 'testing' }));
    
    try {
      const isWorking = await serverManager.testServer(serverUrl);
      setTestResults(prev => ({ 
        ...prev, 
        [serverUrl]: isWorking ? 'success' : 'failed' 
      }));
      return isWorking;
    } catch (error) {
      setTestResults(prev => ({ ...prev, [serverUrl]: 'failed' }));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const selectServer = async (serverUrl) => {
    setIsLoading(true);
    try {
      const success = await serverManager.setCustomServer(serverUrl);
      if (success) {
        Alert.alert('✅ Success', `Connected to server:\n${serverUrl}`);
        onServerChanged && onServerChanged(serverUrl);
        onClose();
      } else {
        Alert.alert('❌ Connection Failed', `Could not connect to:\n${serverUrl}`);
      }
    } catch (error) {
      Alert.alert('❌ Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const autoDetectServer = async () => {
    setIsLoading(true);
    try {
      const workingServer = await serverManager.findWorkingServer();
      if (workingServer) {
        Alert.alert('✅ Server Found', `Auto-detected working server:\n${workingServer}`);
        onServerChanged && onServerChanged(workingServer);
        onClose();
      } else {
        Alert.alert('❌ No Server Found', 'Could not find any working server. Please check your internet connection or enter a custom URL.');
      }
    } catch (error) {
      Alert.alert('❌ Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomServer = async () => {
    if (!customUrl.trim()) {
      Alert.alert('⚠️ Invalid URL', 'Please enter a valid server URL');
      return;
    }

    let url = customUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    await selectServer(url);
  };

  const renderServerItem = (name, url) => {
    const status = testResults[url];
    const isCurrent = serverStatus?.currentServer === url;

    return (
      <View key={url} style={styles.serverItem}>
        <View style={styles.serverInfo}>
          <Text style={styles.serverName}>{name}</Text>
          <Text style={styles.serverUrl}>{url}</Text>
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>CURRENT</Text>
            </View>
          )}
        </View>
        
        <View style={styles.serverActions}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => testServer(url)}
            disabled={isLoading}
          >
            {status === 'testing' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon 
                name={status === 'success' ? 'checkmark-circle' : status === 'failed' ? 'close-circle' : 'refresh'} 
                size={20} 
                color="#FFFFFF" 
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.selectButton, status === 'success' && styles.selectButtonActive]}
            onPress={() => selectServer(url)}
            disabled={isLoading || status !== 'success'}
          >
            <Text style={styles.selectButtonText}>
              {status === 'success' ? 'SELECT' : 'TEST FIRST'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>🌐 Server Connection</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Current Status */}
          {serverStatus && (
            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>Current Status</Text>
              <View style={styles.statusCard}>
                <Icon 
                  name={serverStatus.isConnected ? 'checkmark-circle' : 'close-circle'} 
                  size={24} 
                  color={serverStatus.isConnected ? '#10B981' : '#EF4444'} 
                />
                <View style={styles.statusInfo}>
                  <Text style={styles.statusText}>
                    {serverStatus.isConnected ? 'Connected' : 'Disconnected'}
                  </Text>
                  <Text style={styles.statusUrl}>
                    {serverStatus.currentServer || 'No server selected'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Auto-detect */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.autoDetectButton} 
              onPress={autoDetectServer}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="search" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.autoDetectText}>Auto-Detect Server</Text>
            </TouchableOpacity>
          </View>

          {/* Predefined Servers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Servers</Text>
            {Object.entries(SERVER_CONFIGS).map(([name, url]) => 
              renderServerItem(name, url)
            )}
          </View>

          {/* Custom Server */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Server</Text>
            <View style={styles.customServerRow}>
              <TextInput
                style={styles.customInput}
                placeholder="Enter server URL (e.g., https://your-ngrok-url.ngrok.io)"
                value={customUrl}
                onChangeText={setCustomUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={addCustomServer}
                disabled={isLoading}
              >
                <Icon name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    maxHeight: 400,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  statusSection: {
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  statusInfo: {
    marginLeft: 15,
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusUrl: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  autoDetectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8B47',
    padding: 15,
    borderRadius: 10,
  },
  autoDetectText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 10,
  },
  serverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  serverInfo: {
    flex: 1,
  },
  serverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  serverUrl: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  serverActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#6B7280',
    padding: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  selectButton: {
    backgroundColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  selectButtonActive: {
    backgroundColor: '#10B981',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  customServerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#FF8B47',
    padding: 12,
    borderRadius: 10,
  },
});

export default ServerConnection;
