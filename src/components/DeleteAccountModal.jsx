import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
// import { BlurView } from '@react-native-community/blur'; // Optional - using regular View instead

const { width, height } = Dimensions.get('window');

const DeleteAccountModal = ({ visible, onClose, onConfirm, loading = false }) => {
  const [step, setStep] = useState(1); // 1: Warning, 2: Confirmation, 3: Processing
  const [confirmText, setConfirmText] = useState('');
  const [slideAnim] = useState(new Animated.Value(height));
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      setStep(1);
      setConfirmText('');
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    if (loading) return; // Prevent closing during deletion
    onClose();
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && confirmText.toLowerCase() === 'delete') {
      setStep(3);
      onConfirm();
    }
  };

  const isConfirmValid = confirmText.toLowerCase() === 'delete';

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.7)" barStyle="light-content" />
      
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable}
          onPress={handleClose}
          disabled={loading}
        />
      </Animated.View>

      {/* Modal Content */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -50}
        >
          <View style={styles.modal}>
            {/* Modern Header */}
            <View style={styles.modernHeader}>
              <View style={styles.headerIconContainer}>
                <View style={styles.modernDangerIcon}>
                  <Icon name="trash-outline" size={28} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.modernTitle}>
                {step === 1 ? 'Delete Account' : step === 2 ? 'Confirm Deletion' : 'Processing...'}
              </Text>
              <Text style={styles.modernSubtitle}>
                {step === 1 ? 'This action cannot be undone' : 
                 step === 2 ? 'Type DELETE to confirm' : 
                 'Removing all your data'}
              </Text>
              {!loading && (
                <TouchableOpacity style={styles.modernCloseButton} onPress={handleClose}>
                  <Icon name="close" size={20} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>

            {/* Scrollable Content */}
            <ScrollView 
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.content}>
            {step === 1 && (
              <>
                <View style={styles.modernWarningCard}>
                  <View style={styles.warningCardHeader}>
                    <Icon name="alert-triangle" size={24} color="#FF6B6B" />
                    <Text style={styles.warningCardTitle}>Data to be deleted</Text>
                  </View>
                  
                  <View style={styles.modernDeletionGrid}>
                    <View style={styles.deletionCard}>
                      <View style={styles.deletionCardIcon}>
                        <Icon name="person" size={18} color="#FF6B6B" />
                      </View>
                      <Text style={styles.deletionCardText}>Account & Profile</Text>
                    </View>
                    
                    <View style={styles.deletionCard}>
                      <View style={styles.deletionCardIcon}>
                        <Icon name="cube" size={18} color="#FF6B6B" />
                      </View>
                      <Text style={styles.deletionCardText}>Products & AR</Text>
                    </View>
                    
                    <View style={styles.deletionCard}>
                      <View style={styles.deletionCardIcon}>
                        <Icon name="images" size={18} color="#FF6B6B" />
                      </View>
                      <Text style={styles.deletionCardText}>All Images</Text>
                    </View>
                    
                    <View style={styles.deletionCard}>
                      <View style={styles.deletionCardIcon}>
                        <Icon name="storefront" size={18} color="#FF6B6B" />
                      </View>
                      <Text style={styles.deletionCardText}>Shop Branding</Text>
                    </View>
                    
                    <View style={styles.deletionCard}>
                      <View style={styles.deletionCardIcon}>
                        <Icon name="receipt" size={18} color="#FF6B6B" />
                      </View>
                      <Text style={styles.deletionCardText}>Orders & History</Text>
                    </View>
                    
                    <View style={styles.deletionCard}>
                      <View style={styles.deletionCardIcon}>
                        <Icon name="cloud" size={18} color="#FF6B6B" />
                      </View>
                      <Text style={styles.deletionCardText}>Cloud Storage</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modernInfoCard}>
                  <Icon name="shield-checkmark" size={20} color="#4ECDC4" />
                  <Text style={styles.infoCardText}>
                    Your data will be permanently removed from our servers within 24 hours.
                  </Text>
                </View>
              </>
            )}

            {step === 2 && (
              <>
                <View style={styles.modernConfirmCard}>
                  <View style={styles.confirmCardHeader}>
                    <Icon name="warning" size={32} color="#FF6B6B" />
                    <Text style={styles.confirmCardTitle}>Final Confirmation</Text>
                    <Text style={styles.confirmCardSubtitle}>
                      This will permanently delete your account and all data
                    </Text>
                  </View>
                  
                  <View style={styles.modernInputSection}>
                    <Text style={styles.modernInputLabel}>
                      Type <Text style={styles.deleteWordModern}>DELETE</Text> to confirm
                    </Text>
                    
                    <View style={styles.modernInputContainer}>
                      <TextInput
                        style={[
                          styles.modernConfirmInput,
                          isConfirmValid && styles.modernConfirmInputValid
                        ]}
                        value={confirmText}
                        onChangeText={setConfirmText}
                        placeholder="DELETE"
                        placeholderTextColor="#C7C7CC"
                        autoCapitalize="characters"
                        autoFocus
                        returnKeyType="done"
                        blurOnSubmit={true}
                        textAlign="center"
                      />
                      {isConfirmValid && (
                        <View style={styles.inputValidIcon}>
                          <Icon name="checkmark-circle" size={20} color="#4ECDC4" />
                        </View>
                      )}
                    </View>
                    
                    {confirmText && !isConfirmValid && (
                      <View style={styles.modernErrorContainer}>
                        <Icon name="close-circle" size={16} color="#FF6B6B" />
                        <Text style={styles.modernErrorText}>
                          Please type "DELETE" exactly as shown
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}

            {step === 3 && (
              <View style={styles.modernProcessingCard}>
                <View style={styles.processingIconContainer}>
                  <ActivityIndicator size="large" color="#FF6B6B" />
                </View>
                <Text style={styles.modernProcessingTitle}>
                  Deleting Account...
                </Text>
                <Text style={styles.modernProcessingSubtitle}>
                  Removing all your data from our servers
                </Text>
                <View style={styles.processingSteps}>
                  <Text style={styles.processingStep}>• Deleting profile and products</Text>
                  <Text style={styles.processingStep}>• Removing cloud storage files</Text>
                  <Text style={styles.processingStep}>• Clearing database records</Text>
                </View>
              </View>
            )}
              </View>
            </ScrollView>

            {/* Modern Footer */}
            {step !== 3 && (
              <View style={styles.modernFooter}>
                <TouchableOpacity 
                  style={styles.modernCancelButton} 
                  onPress={handleClose}
                  disabled={loading}
                >
                  <Text style={styles.modernCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.modernDeleteButton,
                    (step === 2 && !isConfirmValid) && styles.modernDeleteButtonDisabled
                  ]} 
                  onPress={handleNextStep}
                  disabled={loading || (step === 2 && !isConfirmValid)}
                >
                  <Icon 
                    name={step === 1 ? "arrow-forward" : "trash"} 
                    size={16} 
                    color="#FFFFFF" 
                    style={styles.modernButtonIcon}
                  />
                  <Text style={styles.modernDeleteButtonText}>
                    {step === 1 ? 'Continue' : 'Delete Forever'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = {
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: height * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  
  // Modern Header Styles
  modernHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    position: 'relative',
  },
  headerIconContainer: {
    marginBottom: 16,
  },
  modernDangerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modernTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  modernSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },
  modernCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Content Styles
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  
  // Modern Warning Card
  modernWarningCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE6E6',
  },
  warningCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 12,
  },
  
  // Modern Deletion Grid
  modernDeletionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  deletionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deletionCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE6E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  deletionCardText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  
  // Modern Info Card
  modernInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#B2F5EA',
  },
  infoCardText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  
  // Modern Confirm Card
  modernConfirmCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FFE6E6',
  },
  confirmCardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmCardSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Modern Input Section
  modernInputSection: {
    alignItems: 'center',
  },
  modernInputLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 16,
    fontWeight: '500',
  },
  deleteWordModern: {
    fontWeight: '700',
    color: '#FF6B6B',
    backgroundColor: '#FFE6E6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modernInputContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 200,
  },
  modernConfirmInput: {
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1C1C1E',
    backgroundColor: '#FFFFFF',
  },
  modernConfirmInputValid: {
    borderColor: '#4ECDC4',
    backgroundColor: '#F0FDFC',
  },
  inputValidIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -10,
  },
  modernErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  modernErrorText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // Modern Processing Card
  modernProcessingCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  processingIconContainer: {
    marginBottom: 24,
  },
  modernProcessingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  modernProcessingSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
    textAlign: 'center',
  },
  processingSteps: {
    alignItems: 'flex-start',
  },
  processingStep: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
  },
  
  // Modern Footer
  modernFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modernCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  modernDeleteButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modernDeleteButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
    elevation: 0,
  },
  modernDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modernButtonIcon: {
    marginRight: 4,
  },
  
  // Legacy styles (keeping for compatibility)
  dangerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE6E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    minHeight: 200, // Ensure minimum height for content
  },
  warningText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 24,
  },
  deletionList: {
    marginBottom: 24,
  },
  deletionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  deletionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  deletionText: {
    fontSize: 15,
    color: '#333333',
    marginLeft: 12,
    flex: 1,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E6',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8B47',
  },
  warningBoxText: {
    fontSize: 14,
    color: '#B8860B',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  confirmationText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  typeText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  deleteWord: {
    fontWeight: '700',
    color: '#FF3B30',
  },
  inputContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  confirmInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1A1A1A',
    marginBottom: 16,
    marginTop: 8,
    backgroundColor: '#FAFAFA',
  },
  confirmInputValid: {
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 20,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30, // Extra bottom padding for keyboard
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
    backgroundColor: '#FFFFFF', // Ensure footer has background
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonIcon: {
    marginRight: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
};

export default DeleteAccountModal;
