# Seller Chat System - Complete Overview

## 📋 Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Frontend Components](#frontend-components)
4. [Backend API Routes](#backend-api-routes)
5. [Context & State Management](#context--state-management)
6. [Key Features](#key-features)
7. [Data Flow](#data-flow)
8. [Message Types](#message-types)

---

## 🏗️ System Architecture

The seller chat system follows a **client-server architecture** with the following layers:

```
┌─────────────────────────────────────────────┐
│          Frontend (React Native)            │
│  ┌─────────────┐      ┌─────────────────┐  │
│  │ Chat.jsx    │      │ ChatDetail.jsx  │  │
│  │ (List View) │◄────►│ (Conversation)  │  │
│  └─────────────┘      └─────────────────┘  │
│         │                      │            │
│         └──────────┬───────────┘            │
│                    ▼                        │
│            ┌───────────────┐                │
│            │ ChatContext   │                │
│            └───────────────┘                │
│                    │                        │
│                    ▼                        │
│            ┌───────────────┐                │
│            │  chatApi.js   │                │
│            └───────────────┘                │
└────────────────────┼───────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────┐
│          Backend (Express/Node.js)          │
│            ┌───────────────┐                │
│            │ chatRoutes.js │                │
│            └───────────────┘                │
│                    │                        │
│                    ▼                        │
│            ┌───────────────┐                │
│            │   Supabase    │                │
│            │  PostgreSQL   │                │
│            └───────────────┘                │
└─────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Messages Table
The core table that stores all chat messages **WITHOUT** a conversation_id (direct buyer-seller relationship):

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id),      -- The buyer in the conversation
    seller_id UUID REFERENCES users(id),     -- The seller in the conversation
    sender_id UUID REFERENCES users(id),     -- Who sent this message
    message TEXT NOT NULL,                   -- The actual message content
    product_data JSONB DEFAULT NULL,         -- Product context (optional)
    is_read BOOLEAN DEFAULT FALSE,           -- Read status
    created_at TIMESTAMP WITH TIME ZONE,     -- When the message was created
    timestamp TIMESTAMP WITH TIME ZONE       -- Legacy timestamp field
);
```

**Key Indexes:**
- `idx_messages_buyer_seller_created` - For querying buyer-seller conversations
- `idx_messages_seller_buyer_created` - For querying seller-buyer conversations
- `idx_messages_sender` - For filtering by sender

### Product Data Structure (JSONB)
When a message includes product context:

```json
{
  "id": "product-uuid",
  "name": "Product Name",
  "price": "₱1,299.00",
  "image": "https://...",
  "orderNumber": "ORD-12345",           // For order notifications
  "status": "shipped",                   // For order status updates
  "trackingNumber": "TRK-12345",        // For shipment tracking
  "isOrderNotification": true            // Flags automated notifications
}
```

---

## 📱 Frontend Components

### 1. **Chat.jsx** - Conversation List Screen

**Location:** `src/screens/seller/Chat.jsx`

**Purpose:** Displays all active conversations for the seller

**Key Features:**
- 📋 Lists all conversations with buyers
- 🔍 Search functionality for filtering conversations
- 🔄 Pull-to-refresh to reload conversations
- 🔔 Unread message badges
- 🗑️ Swipe-to-delete chat functionality
- 👤 Displays buyer avatar and name

**Main Functions:**
```javascript
loadConversations()      // Load all conversations from backend
onRefresh()             // Pull-to-refresh handler
formatTime(timestamp)   // Format timestamps (e.g., "2h ago")
handleDeleteChat(item)  // Delete entire conversation with confirmation
renderChatItem({ item }) // Render individual chat item
```

**Navigation:**
```javascript
// Navigate to chat detail
navigation.getParent().navigate('ChatDetail', { 
  chatData: {
    id: item.id,
    partnerId: item.partnerId,
    shop: {
      id: item.partnerId,
      name: item.name,
      avatar: item.avatar,
      isOnline: false
    }
  }
})
```

**UI States:**
- ⏳ Loading state with spinner
- ❌ Error state with retry button
- 📭 Empty state when no conversations exist
- ✅ Active conversations list

---

### 2. **ChatDetail.jsx** - Conversation Detail Screen

**Location:** `src/screens/seller/ChatDetail.jsx`

**Purpose:** Shows individual conversation with a buyer and allows messaging

**Key Features:**
- 💬 Real-time message display
- 📤 Send text messages
- 📦 Display product attachments
- 🧵 Thread order notifications together
- ✅ Mark messages as read
- ⌨️ Keyboard-aware scrolling

**Main Functions:**
```javascript
loadMessages(showLoading)           // Load messages from backend
sendMessage()                       // Send new message
groupOrderNotifications(messages)   // Group order updates together
```

**Message Structure:**
```javascript
{
  id: "message-uuid",
  sender: "seller" | "buyer",
  message: "Message text",
  timestamp: "3:45 PM",
  date: Date object,
  isRead: boolean,
  productData: { ... },              // Optional product context
  orderNumber: "ORD-12345",          // For order notifications
  isOrderNotification: boolean,
  isThreadParent: boolean,           // First notification in thread
  threadChildren: [...]              // Subsequent notifications
}
```

**Order Notification Threading:**
Order status updates for the same order are grouped together to avoid clutter:
```javascript
groupOrderNotifications(messages) {
  // Groups messages by orderNumber
  // First notification = parent
  // Subsequent notifications = children
  // Returns: messages with threadChildren array
}
```

---

## 🌐 Backend API Routes

### Base URL: `/api/chat`

All routes require authentication via JWT token in Authorization header.

---

### 1. **GET /messages/:partnerId**
Get all messages between seller and a specific buyer

**Request:**
```http
GET /api/chat/messages/buyer-uuid-here
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg-uuid",
      "message": "Hello, I'm interested in this product",
      "sender": "buyer",
      "timestamp": "3:45 PM",
      "date": "2024-01-15T15:45:00Z",
      "is_read": false,
      "productData": {
        "id": "prod-123",
        "name": "Crystal Chandelier",
        "price": "₱5,999"
      }
    }
  ],
  "debug": {
    "buyerId": "buyer-uuid",
    "sellerId": "seller-uuid",
    "userRole": "seller",
    "messageCount": 15
  }
}
```

**Logic:**
```javascript
// Determine IDs based on user role
if (userRole === 'seller') {
  sellerId = userId;        // Current user is seller
  buyerId = partnerId;      // Partner is buyer
}

// Query messages
SELECT * FROM messages 
WHERE seller_id = :sellerId 
  AND buyer_id = :buyerId
ORDER BY created_at ASC
```

---

### 2. **POST /send**
Send a message to a buyer

**Request:**
```json
{
  "sellerId": "buyer-uuid",  // Actually the buyer ID (confusing naming!)
  "message": "Thank you for your order!",
  "productData": {           // Optional
    "id": "prod-123",
    "name": "Product Name",
    "price": "₱1,299"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "new-msg-uuid",
    "message": "Thank you for your order!",
    "sender": "seller",
    "timestamp": 1674567890000,
    "created_at": "2024-01-15T15:45:00Z",
    "is_read": false,
    "productData": { ... }
  },
  "serverVersion": "UPDATED_SERVER_v3.0_FIXED"
}
```

**Logic:**
```javascript
if (userRole === 'seller') {
  buyerId = sellerId;          // Partner is buyer
  actualSellerId = currentUserId;  // Current user is seller
  senderId = currentUserId;
}

// Insert into database
INSERT INTO messages (buyer_id, seller_id, sender_id, message, product_data)
VALUES (:buyerId, :actualSellerId, :senderId, :message, :productData)
```

---

### 3. **GET /conversations**
Get all conversations for the current seller

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conv_buyer-uuid",
      "partnerId": "buyer-uuid",
      "partnerName": "John Doe",
      "partnerAvatar": "https://...",
      "lastMessage": "Thank you!",
      "lastMessageTime": "2024-01-15T15:45:00Z",
      "unreadCount": 3,
      "isOnline": false,
      "isActive": true
    }
  ]
}
```

**Logic:**
```javascript
// 1. Get all messages for seller
SELECT * FROM messages WHERE seller_id = :userId

// 2. Group by buyer_id to create conversations
// 3. Count unread messages (sender_id = buyer_id AND is_read = false)
// 4. Get buyer information (name, avatar) from users table
// 5. Return formatted conversations
```

---

### 4. **PUT /mark-read/:partnerId**
Mark all messages from a buyer as read

**Request:**
```http
PUT /api/chat/mark-read/buyer-uuid
Authorization: Bearer <jwt-token>
```

**Logic:**
```javascript
// For sellers
UPDATE messages 
SET is_read = true
WHERE seller_id = :sellerId 
  AND buyer_id = :buyerId
  AND sender_id = :buyerId  // Only buyer's messages
  AND is_read = false
```

---

### 5. **POST /send-order-notification**
Send automated order status notification to buyer

**Request:**
```json
{
  "buyerId": "buyer-uuid",
  "orderNumber": "ORD-12345",
  "status": "shipped",
  "trackingNumber": "TRK-67890",
  "productData": {
    "id": "prod-123",
    "name": "Product Name",
    "price": "₱1,299",
    "image": "https://..."
  }
}
```

**Automated Messages by Status:**
- `confirmed`: "✅ Great news! Your order #ORD-12345 has been confirmed..."
- `processing`: "📦 Your order #ORD-12345 is now being processed..."
- `shipped`: "🚚 Your order #ORD-12345 has been shipped! Tracking: TRK-67890"
- `delivered`: "🎉 Your order #ORD-12345 has been delivered!"
- `cancelled`: "❌ Your order #ORD-12345 has been cancelled."
- `review_request`: "⭐ How was your experience? Please review this product!"

---

### 6. **DELETE /delete/:partnerId**
Delete entire conversation with a buyer

**Request:**
```http
DELETE /api/chat/delete/buyer-uuid
Authorization: Bearer <jwt-token>
```

**Logic:**
```javascript
DELETE FROM messages 
WHERE seller_id = :sellerId 
  AND buyer_id = :buyerId
```

---

## 🔄 Context & State Management

### ChatContext (`src/context/ChatContext.jsx`)

**Purpose:** Global state management for chat data across the app

**State Variables:**
```javascript
{
  chats: [],              // Local chat cache
  conversations: [],      // Active conversations from backend
  loading: boolean,       // Loading state
  error: string | null    // Error message
}
```

**Key Functions:**

#### 1. `loadConversations()`
Fetches all conversations from backend and updates state
```javascript
loadConversations() {
  // Call GET /api/chat/conversations
  // Update conversations state
  // Handle errors
}
```

#### 2. `getChatByShopId(shopId)`
Get messages for a specific conversation
```javascript
getChatByShopId(shopId) {
  // Call GET /api/chat/messages/:shopId
  // Format messages with sender, timestamp, productData
  // Return formatted chat object
}
```

#### 3. `createChatWithShop(shopId, message, productData)`
Create new conversation by sending first message
```javascript
createChatWithShop(shopId, initialMessage, productData) {
  // Send initial message with product context
  // Create local chat entry for immediate UX
  // Refresh conversations from backend
}
```

#### 4. `deleteChat(partnerId)`
Delete entire conversation
```javascript
deleteChat(partnerId) {
  // Call DELETE /api/chat/delete/:partnerId
  // Remove from local conversations state
  // Remove from chats state
}
```

#### 5. `markChatAsRead(chatId)`
Mark conversation as read
```javascript
markChatAsRead(chatId) {
  // Extract partnerId from chatId
  // Call PUT /api/chat/mark-read/:partnerId
  // Update local state
  // Refresh conversations
}
```

---

## 🎯 Key Features

### 1. **Unread Message Tracking**
- ✅ Backend tracks `is_read` status for each message
- ✅ Only counts messages FROM the buyer as unread (for sellers)
- ✅ Automatically marks as read when seller opens conversation
- ✅ Displays unread badge with count on chat list

### 2. **Product Context in Messages**
Messages can include product information:
```javascript
{
  message: "Is this still available?",
  productData: {
    id: "prod-123",
    name: "Crystal Chandelier",
    price: "₱5,999",
    image: "https://..."
  }
}
```

Displayed as attachment card in chat:
```
┌─────────────────────────────┐
│  Is this still available?   │
│                             │
│  ┌───────────────────────┐  │
│  │ Crystal Chandelier    │  │
│  │ ₱5,999          [IMG] │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### 3. **Order Status Notifications**
Automated messages sent when order status changes:
- Includes order number, status, tracking info
- Threaded together to avoid clutter
- Special formatting with emojis
- Can include product details

### 4. **Message Threading**
Order notifications for the same order are grouped:
```javascript
groupOrderNotifications(messages) {
  // First notification becomes parent
  // Subsequent notifications become children
  // Children displayed indented under parent
}
```

### 5. **Avatar & Profile Display**
- Shows buyer's profile picture in conversation list
- Displays buyer name (full_name from users table)
- Fallback to default avatar icon if no picture
- Shows "Customer" label in chat header

### 6. **Search Functionality**
Real-time filtering of conversations by:
- Buyer name
- Last message content

### 7. **Pull-to-Refresh**
Swipe down to reload conversations manually

### 8. **Delete Conversations**
- Trash icon next to each conversation
- Confirmation dialog before deletion
- Removes all messages between seller and buyer

---

## 📊 Data Flow

### Sending a Message (Seller → Buyer)

```
1. User types message in ChatDetail.jsx
   └─> input state updated

2. User presses send button
   └─> sendMessage() called

3. Frontend validates and sends API request
   └─> POST /api/chat/send
       {
         sellerId: buyerId,  // The buyer ID
         message: "Hello!"
       }

4. Backend receives request
   └─> Authenticates seller via JWT
   └─> Determines buyer_id and seller_id
   └─> Inserts into messages table
       INSERT INTO messages (buyer_id, seller_id, sender_id, message)

5. Backend returns new message
   └─> { id, message, sender, timestamp }

6. Frontend updates local state
   └─> setChatMessages([...prev, newMessage])
   └─> Scrolls to bottom
   └─> Clears input field

7. Backend notifications (optional)
   └─> Could trigger push notification to buyer
```

### Loading Conversations (Initial Load)

```
1. Seller opens Chat screen (Chat.jsx)
   └─> useEffect() triggers on mount

2. ChatContext.loadConversations() called
   └─> GET /api/chat/conversations

3. Backend queries database
   └─> SELECT * FROM messages WHERE seller_id = :userId
   └─> Groups by buyer_id
   └─> Counts unread messages (sender_id = buyer_id AND is_read = false)
   └─> Joins with users table for buyer info

4. Backend returns conversations array
   └─> [{ partnerId, partnerName, lastMessage, unreadCount, ... }]

5. Frontend updates state
   └─> setConversations(response.conversations)

6. UI renders conversation list
   └─> Maps conversations to chat items
   └─> Shows unread badges
   └─> Displays buyer avatars
```

### Marking Messages as Read

```
1. Seller opens conversation (ChatDetail.jsx)
   └─> useEffect() triggers on mount

2. markChatAsRead() called with chatId
   └─> PUT /api/chat/mark-read/:buyerId

3. Backend updates database
   └─> UPDATE messages 
       SET is_read = true
       WHERE seller_id = :sellerId
         AND buyer_id = :buyerId
         AND sender_id = :buyerId  -- Only buyer's messages
         AND is_read = false

4. Frontend refreshes conversations
   └─> Unread badge disappears
   └─> Unread count resets to 0
```

---

## 💬 Message Types

### 1. **Regular Text Message**
```javascript
{
  id: "msg-uuid",
  sender: "seller",
  message: "Hello! How can I help you?",
  timestamp: "3:45 PM",
  date: Date,
  isRead: false,
  productData: null
}
```

### 2. **Product Inquiry Message**
```javascript
{
  id: "msg-uuid",
  sender: "buyer",
  message: "Is this still available?",
  timestamp: "3:45 PM",
  date: Date,
  isRead: false,
  productData: {
    id: "prod-123",
    name: "Crystal Chandelier",
    price: "₱5,999",
    image: "https://..."
  }
}
```

### 3. **Order Status Notification**
```javascript
{
  id: "msg-uuid",
  sender: "seller",
  message: "🚚 Your order #ORD-12345 has been shipped!",
  timestamp: "3:45 PM",
  date: Date,
  isRead: false,
  productData: {
    id: "prod-123",
    name: "Product Name",
    price: "₱1,299",
    orderNumber: "ORD-12345",
    status: "shipped",
    trackingNumber: "TRK-67890",
    isOrderNotification: true
  },
  orderNumber: "ORD-12345",
  isOrderNotification: true
}
```

### 4. **Threaded Order Updates**
```javascript
{
  id: "msg-uuid-1",
  sender: "seller",
  message: "✅ Your order #ORD-12345 has been confirmed",
  isThreadParent: true,
  threadChildren: [
    {
      id: "msg-uuid-2",
      message: "📦 Your order #ORD-12345 is being processed",
      timestamp: "4:30 PM"
    },
    {
      id: "msg-uuid-3",
      message: "🚚 Your order #ORD-12345 has been shipped!",
      timestamp: "5:15 PM"
    }
  ]
}
```

---

## 🎨 UI/UX Styling

### Chat List (Chat.jsx)
- **Header:** Orange gradient with rounded bottom corners
- **Search Bar:** White card with shadow, floating effect
- **Chat Items:** White cards with orange left border, shadows
- **Delete Button:** Light red background with trash icon
- **Unread Badge:** Red circle with white text
- **Empty State:** Centered card with icon and descriptive text

### Chat Detail (ChatDetail.jsx)
- **Seller Messages:** Orange bubbles, white text, right-aligned
- **Buyer Messages:** Light gray bubbles, dark text, left-aligned
- **Product Attachments:** Gray card within message bubble
- **Thread Children:** Indented with blue left border
- **Input Box:** White background, rounded, with send button

---

## 🔐 Security & Authentication

### Authentication Flow
1. All API requests require JWT token in Authorization header
2. Backend middleware (`auth.js`) verifies token
3. Extracts `user.id` and `user.role` from token
4. Uses these for database queries and authorization

### Row-Level Security (RLS)
The database schema includes RLS policies:
```sql
-- Users can only view messages in their conversations
CREATE POLICY "Users can view messages" ON messages
  FOR SELECT USING (
    buyer_id = auth.uid() OR seller_id = auth.uid()
  );
```

### Data Privacy
- Sellers can only see messages where they are the seller
- Buyers can only see messages where they are the buyer
- Messages are soft-deleted (could be made permanent)

---

## 🐛 Common Issues & Debugging

### Issue: Messages not showing
**Check:**
1. Database schema matches expected structure
2. `buyer_id`, `seller_id`, `sender_id` are correctly set
3. JWT token is valid and contains correct user ID
4. Console logs in backend show correct query parameters

### Issue: Unread count incorrect
**Check:**
1. `is_read` field is properly updated
2. Only counting messages FROM the other party
3. `markChatAsRead` is called when opening conversation

### Issue: Product data not displaying
**Check:**
1. `product_data` column exists and is JSONB type
2. Data is being stringified before insertion
3. Parsing is handled correctly on retrieval
4. ProductData component is rendering correctly

---

## 📝 Code Examples

### Example: Sending a message with product context
```javascript
// In ChatDetail.jsx (buyer side)
const sendMessageWithProduct = async (message, product) => {
  const productData = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image_url
  };
  
  await sendMessage(sellerId, message, productData);
};
```

### Example: Sending order notification
```javascript
// In Orders.jsx (seller side)
import { sendOrderNotification } from '../../api/chatApi';

const updateOrderStatus = async (orderId, newStatus) => {
  // Update order in database
  await updateOrder(orderId, { status: newStatus });
  
  // Send notification to buyer
  await sendOrderNotification(
    order.buyer_id,
    order.order_number,
    newStatus,
    {
      id: order.product_id,
      name: order.product_name,
      price: order.total_amount,
      image: order.product_image
    },
    order.tracking_number
  );
};
```

---

## 📚 Related Files Reference

### Frontend
- `src/screens/seller/Chat.jsx` - Conversation list
- `src/screens/seller/ChatDetail.jsx` - Individual conversation
- `src/screens/seller/styles/Chat.style.js` - Chat list styles
- `src/screens/seller/styles/ChatDetail.style.js` - Chat detail styles
- `src/context/ChatContext.jsx` - Global state management
- `src/api/chatApi.js` - API client functions

### Backend
- `server/routes/chatRoutes.js` - All chat API endpoints
- `server/middleware/auth.js` - JWT authentication
- `server/sql/create_chat_tables.sql` - Database setup
- `server/sql/ensure_messages_schema.sql` - Schema verification
- `server/sql/fix_messages_table.sql` - Schema fixes

### Database
- `messages` table - Core message storage
- `users` table - User information (joined for profiles)

---

## 🚀 Future Enhancements

### Potential Improvements
1. **Real-time updates** via WebSocket or Supabase Realtime
2. **Image/file attachments** for messages
3. **Voice messages** support
4. **Message reactions** (like, heart, etc.)
5. **Typing indicators** to show when buyer is typing
6. **Online status** for real-time presence
7. **Message search** within conversation
8. **Export conversation** as PDF/text
9. **Bulk actions** (archive, delete multiple chats)
10. **Quick replies** / saved templates for sellers

---

## ✅ Summary

The seller chat system is a **comprehensive messaging solution** that allows sellers to:
- 💬 Communicate with buyers in real-time
- 📦 Send automated order status updates
- 🛍️ Share product information in messages
- 🔔 Track unread messages and notifications
- 🗑️ Manage conversations (delete, mark as read)
- 🔍 Search and filter conversations

The system uses:
- **Frontend:** React Native with Context API for state management
- **Backend:** Express.js with RESTful API
- **Database:** Supabase PostgreSQL with direct buyer-seller relationships
- **Authentication:** JWT tokens with role-based access

All messages are stored in a single `messages` table with `buyer_id`, `seller_id`, and `sender_id` to track conversations without a separate conversations table.

---

**Last Updated:** 2024-01-15
**Version:** 1.0
**Maintainer:** Development Team
