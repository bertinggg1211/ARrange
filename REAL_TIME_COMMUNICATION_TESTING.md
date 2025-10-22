# Real-time Communication Testing

## Title
Real-time Communication

## Description
Users must be able to communicate through the chat system with real-time message delivery, message history persistence, and proper notification handling to ensure effective communication between buyers and sellers.

## Test Case Section Purpose

The purpose of this test case section is to validate the functionality and reliability of the ARrange Application's real-time communication and chat system features. It evaluates the core components of the chat mechanism, which enables users to initiate conversations, exchange messages in real-time, and maintain message history across sessions. The test cases also cover the Communication Workflow—ensuring the system accurately handles buyer-seller communication, delivers messages instantly, maintains separate conversation threads, and provides proper status indicators. Furthermore, the Chat Management module is tested to confirm that users can successfully manage multiple conversations, receive notifications for new messages, and maintain communication even during network interruptions. All test cases were executed successfully and marked as Passed, confirming that the system's real-time communication operations perform as expected and provide reliable user interaction.

---

## Real-time Communication Testing

| Test Case ID | Test Case Description | Test Steps | Expected Result | Actual Result | Passed/Failed |
|--------------|----------------------|------------|-----------------|---------------|---------------|
| **TC-CH-001** | Buyer-Seller Chat Initiation | 1. Login as buyer<br>2. View product details<br>3. Tap "Contact Seller" button<br>4. Send first message | Chat conversation is created successfully. Message is delivered to seller in real-time. | Chat conversation created successfully. Message delivered to seller instantly. | **PASSED** |
| **TC-CH-002** | Real-time Message Delivery | 1. Login as buyer and seller<br>2. Start chat conversation<br>3. Send message from buyer<br>4. Verify seller receives message | Message appears in seller's chat immediately. Real-time delivery is confirmed. | Message appeared in seller's chat instantly. Real-time delivery confirmed. | **PASSED** |
| **TC-CH-003** | Message History Persistence | 1. Start chat conversation<br>2. Send multiple messages<br>3. Close and reopen chat<br>4. Verify message history | All previous messages are displayed in chat history. No messages are lost. | All previous messages displayed correctly. No messages lost. | **PASSED** |
| **TC-CH-004** | Chat with Multiple Sellers | 1. Login as buyer<br>2. Contact different sellers<br>3. Send messages to each<br>4. Verify separate conversations | Each seller conversation is maintained separately. Messages are organized correctly. | Each seller conversation maintained separately. Messages organized correctly. | **PASSED** |
| **TC-CH-005** | Seller Chat Management | 1. Login as seller<br>2. Receive messages from buyers<br>3. Respond to multiple conversations<br>4. Verify conversation list | Seller can manage multiple buyer conversations. Conversation list is updated correctly. | Seller managed multiple conversations successfully. Conversation list updated correctly. | **PASSED** |
| **TC-CH-006** | Message Status Indicators | 1. Send message<br>2. Verify delivery status<br>3. Check read receipts<br>4. Verify status updates | Message status (sent, delivered, read) is displayed correctly. Status updates in real-time. | Message status displayed correctly. Real-time status updates working. | **PASSED** |
| **TC-CH-007** | Chat with Product Context | 1. View product details<br>2. Start chat about specific product<br>3. Send product-related message<br>4. Verify product context | Chat includes product context. Seller can see which product is being discussed. | Chat included product context. Seller could see product being discussed. | **PASSED** |
| **TC-CH-008** | Offline Message Handling | 1. Send message while recipient is offline<br>2. Recipient comes online<br>3. Verify message delivery<br>4. Check message timestamp | Offline messages are delivered when recipient comes online. Timestamps are accurate. | Offline messages delivered when recipient came online. Timestamps accurate. | **PASSED** |
| **TC-CH-009** | Chat Notification System | 1. Receive new message<br>2. Verify notification display<br>3. Check notification sound<br>4. Verify notification badge | New message notifications are displayed. Sound alerts work. Badge counts are updated. | New message notifications displayed. Sound alerts working. Badge counts updated. | **PASSED** |
| **TC-CH-010** | Chat with Network Interruption | 1. Start chat conversation<br>2. Simulate network interruption<br>3. Restore network connection<br>4. Verify message synchronization | Messages are queued during network issues. Messages sync when connection is restored. | Messages queued during network issues. Messages synced when connection restored. | **PASSED** |