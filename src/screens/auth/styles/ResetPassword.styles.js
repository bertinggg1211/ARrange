import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },

  backButton: {
    marginTop: 16,        // Changed from absolute positioning to margin
    marginLeft: 16,
    marginBottom: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  iconContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 153, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 32,
  },

  formContainer: {
    width: '100%',
  },

  inputWrapper: {
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginLeft: 4,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },

  inputContainerFocused: {
    backgroundColor: '#FFF5E6',
    borderColor: '#FF9900',
  },

  inputIcon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },

  // Password Strength Styles
  strengthContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },

  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  strengthLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },

  strengthLevel: {
    fontSize: 14,
    fontWeight: '700',
  },

  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },

  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },

  criteriaContainer: {
    gap: 8,
  },

  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  criteriaText: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '400',
  },

  criteriaTextMet: {
    color: '#4CAF50',
    fontWeight: '500',
  },

  // Match Indicator
  matchIndicator: {
    marginTop: 8,
  },

  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  matchText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#FF9900',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#FF9900',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  disabledButton: {
    opacity: 0.6,
  },

  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Success Step Styles
  successContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },

  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  successText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },

  emailHighlight: {
    color: '#FF9900',
    fontWeight: '700',
  },
});
