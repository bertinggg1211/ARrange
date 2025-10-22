import { StyleSheet, Platform, StatusBar } from "react-native";
import ThemeColors from '../../../theme/colors';

const { Colors, Theme } = ThemeColors;

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Theme.shadow.small,
    position: 'absolute',
    left: 20,
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.full,
    marginRight: Theme.spacing.md,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  sellerName: {
    fontSize: Theme.fontSize.md,
    fontWeight: "bold",
    color: Colors.text,
  },
  statusText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.success,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Theme.shadow.small,
    position: 'absolute',
    right: 20,
  },
  messageList: {
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: Theme.spacing.xl,
    maxWidth: "80%",
  },
  buyerContainer: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  sellerContainer: {
    alignSelf: "flex-start",
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: Theme.borderRadius.full,
    marginRight: Theme.spacing.sm,
    alignSelf: "flex-end",
  },
  messageContent: {
    flexDirection: "column",
  },
  message: {
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.large,
    ...Theme.shadow.small,
  },
  buyerMsg: {
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: Theme.spacing.xs,
  },
  sellerMsg: {
    backgroundColor: Colors.overlay,
    borderBottomLeftRadius: Theme.spacing.xs,
  },
  msgText: {
    fontSize: Theme.fontSize.md,
    lineHeight: 20,
  },
  buyerText: {
    color: Colors.textInverse,
  },
  sellerText: {
    color: Colors.text,
  },
  timestamp: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Theme.spacing.xs,
    alignSelf: "flex-end",
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: "row",
    padding: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.surface,
    ...Theme.shadow.medium,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.sm,
    maxHeight: 100,
    backgroundColor: Colors.background,
    color: Colors.text,
  },
  sendButton: {
    marginLeft: Theme.spacing.md,
    backgroundColor: Colors.secondary,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Theme.borderRadius.full,
    ...Theme.shadow.small,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  
  // Loading states
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loadingMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingMessagesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  
  // Empty states
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyMessagesText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Error states
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  
  // Product attachment styles
  productAttachment: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  productAttachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productAttachmentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8B47',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  productAttachmentContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productAttachmentImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  productAttachmentImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  productAttachmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productAttachmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productAttachmentPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF8B47',
    marginBottom: 2,
  },
  productAttachmentCategory: {
    fontSize: 12,
    color: '#666',
  },
  messageWithAttachment: {
    marginTop: 0,
  },
});
