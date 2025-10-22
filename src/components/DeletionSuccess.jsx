import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { StyleSheet } from 'react-native';

const DeletionSuccess = ({ 
  visible, 
  deletionDetails, 
  onClose 
}) => {
  if (!deletionDetails) return null;

  const hasWarnings = deletionDetails.failedImages > 0 || deletionDetails.failedARModel;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, hasWarnings && styles.warningIconContainer]}>
              <Icon 
                name={hasWarnings ? "checkmark-circle" : "checkmark-circle"} 
                size={40} 
                color={hasWarnings ? "#FF9800" : "#4CAF50"} 
              />
            </View>
            <Text style={styles.title}>
              {hasWarnings ? "Mostly Deleted" : "Successfully Deleted"}
            </Text>
            <Text style={styles.subtitle}>
              "{deletionDetails.productName}" has been removed
            </Text>
          </View>

          {/* Deletion Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Deletion Summary:</Text>
            
            {/* Database */}
            <View style={styles.summaryItem}>
              <Icon name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.summaryText}>Database record removed</Text>
            </View>

            {/* Images */}
            {deletionDetails.totalImages > 0 && (
              <View style={styles.summaryItem}>
                <Icon 
                  name={deletionDetails.failedImages > 0 ? "warning" : "checkmark-circle"} 
                  size={20} 
                  color={deletionDetails.failedImages > 0 ? "#FF9800" : "#4CAF50"} 
                />
                <Text style={styles.summaryText}>
                  Cloud storage: {deletionDetails.deletedImages}/{deletionDetails.totalImages} images
                  {deletionDetails.failedImages > 0 && ` (${deletionDetails.failedImages} failed)`}
                </Text>
              </View>
            )}

            {/* AR Model */}
            {deletionDetails.hasARModel && (
              <View style={styles.summaryItem}>
                <Icon 
                  name={deletionDetails.deletedARModel ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={deletionDetails.deletedARModel ? "#4CAF50" : "#FF3B30"} 
                />
                <Text style={styles.summaryText}>
                  AR model files {deletionDetails.deletedARModel ? "removed" : "failed to remove"}
                </Text>
              </View>
            )}
          </View>

          {/* Warning Message */}
          {hasWarnings && (
            <View style={styles.warningContainer}>
              <Icon name="information-circle" size={16} color="#FF9800" />
              <Text style={styles.warningText}>
                Some files may still exist in cloud storage. This won't affect your app's functionality.
              </Text>
            </View>
          )}

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, hasWarnings ? styles.warningButton : styles.successButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#C8E6C9',
  },
  warningIconContainer: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFCC02',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
  summaryContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    fontSize: 13,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  warningButton: {
    backgroundColor: '#FF8B47',
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DeletionSuccess;
