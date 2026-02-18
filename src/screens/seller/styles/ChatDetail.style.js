import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  moreButton: {
    padding: 4,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 4,
    maxWidth: '80%',
  },
  buyerMessageContainer: {
    alignSelf: 'flex-start',
  },
  sellerMessageContainer: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
  },
  buyerBubble: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sellerBubble: {
    backgroundColor: '#FF8B47',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  buyerMessageText: {
    color: '#333',
  },
  sellerMessageText: {
    color: '#FFF',
  },
  messageTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  readIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    marginHorizontal: 8,
  },
  sendButton: {
    backgroundColor: '#FF8B47',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#ccc',
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyMessagesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sellerContainer: {
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  buyerContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    marginBottom: 4,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '100%',
  },
  sellerMsg: {
    backgroundColor: '#FF8B47',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buyerMsg: {
    backgroundColor: '#f0f0f0',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  msgText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sellerText: {
    color: '#fff',
    fontSize: 16,
  },
  buyerText: {
    color: '#333',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  keyboardAvoidingView: {
    backgroundColor: '#fff',
  },
  productAttachment: {
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 250,
  },
  productInfo: {
    flex: 1,
    marginLeft: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 12,
    color: '#666',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  reviewRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewRequestButtonText: {
    color: '#FF8B47',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Order notification threading styles
  threadContainer: {
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
    paddingLeft: 20,
    paddingRight: 10,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8,
  },
  threadHeaderText: {
    fontSize: 12,
    color: '#FF8B47',
    fontWeight: '600',
    marginLeft: 6,
  },
  threadChildContainer: {
    width: '100%',
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF8B47',
    backgroundColor: 'rgba(255, 139, 71, 0.05)',
  },
  threadChildContent: {
    alignItems: 'flex-end',
    width: '100%',
    paddingVertical: 4,
  },
  threadChildBubble: {
    backgroundColor: '#FF8B47',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '90%',
    minWidth: 120,
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  threadChildText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  threadChildTimestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    marginRight: 8,
  },
});
