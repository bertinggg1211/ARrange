import { StyleSheet, Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  // Fixed Header Safe Area - Never scrolls
  headerSafeArea: {
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  
  fixedHeaderContainer: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 40,          // Increased padding to push content further down
    paddingHorizontal: 24,
    backgroundColor: '#F8F9FA',
    minHeight: 120,          // Increased minimum height for better spacing
  },
  
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '400',
  },
  
  // Role Selector Styles
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  roleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleTextActive: {
    color: '#FF9900',
    fontWeight: '700',
  },
  roleIcon: {
    marginBottom: 4,
  },
  
  // Form Section
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Input Container Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#E5E7EB',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputContainerFocused: {
    borderColor: '#FF9900',
    borderWidth: 2,
    shadowColor: '#FF9900',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.6,
  },
  inputText: {
    flex: 1,
    height: 54,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  
  // Verification Styles
  emailVerifyContainer: {
    marginBottom: 16,
  },
  getSMSButton: {
    backgroundColor: '#FF9900',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
    minWidth: 95,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9900',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  getSMSButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  getSMSButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  
  verificationContainer: {
    marginBottom: 16,
  },
  verificationCodeContainer: {
    backgroundColor: '#FFF5E6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9900',
  },
  verificationHintText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 18,
  },
  verifyButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  verifiedBadgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  
  // Checkbox Styles
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  linkText: {
    color: '#FF9900',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  
  // Button Styles
  signupButton: {
    backgroundColor: '#FF9900',
    paddingVertical: 18,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9900',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Login Link Styles
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  loginText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  loginHighlight: {
    fontSize: 15,
    color: '#FF9900',
    fontWeight: '700',
    marginLeft: 4,
  },
  
  // Status Indicators
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusPending: {
    backgroundColor: '#D1D5DB',
  },
  statusSuccess: {
    backgroundColor: '#10B981',
  },
  
  // Helper text
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 16,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 16,
  },
});