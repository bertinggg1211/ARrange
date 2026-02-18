# Order Notification System - Complete Guide

## Overview
This document explains how order status notifications work in your AR E-commerce app. When a seller updates an order status (confirm, process, ship, deliver, cancel), the buyer receives an **automated notification in their chat**.

---

## 📊 Current System Flow

### 1. Order Status Lifecycle

```
Pending → Confirmed → Processing → Shipped → Delivered
    ↓                                            
Cancelled
```

### 2. Seller Actions & Notifications

| Seller Action | Order Status Changes | Notification Sent to Buyer |
|--------------|---------------------|---------------------------|
| **Confirm Order** | Pending → Confirmed | ✅ "Order confirmed and being prepared" |
| **Start Processing** | Confirmed → Processing | ✅ "Order being processed" |
| **Ship Order** | Processing → Shipped | ✅ "Order shipped with tracking number" |
| **Mark Delivered** | Shipped → Delivered | ✅ "Order delivered" + Review request |
| **Cancel Order** | Any → Cancelled | ✅ "Order cancelled" |

---

## 🔧 Technical Implementation

### Frontend (Seller Side): `src/screens/seller/Orders.jsx`

#### Confirm Order Function
```javascript
const confirmOrder = async (orderId) => {
  // 1. Update order status in database
  await orderApi.updateOrderStatus(orderId, { 
    status: 'confirmed',
    notes: 'Order confirmed by seller'
  });
  
  // 2. Send chat notification to buyer
  await sendOrderNotification(
    order.customer.id,      // Buyer ID
    order.orderNumber,      // Order number
    'confirmed',            // Status
    productData             // Product info
  );
  
  // 3. Update local state
  setOrders(prevOrders =>
    prevOrders.map(order =>
      order.id === orderId
        ? { ...order, status: 'Confirmed' }
        : order
    )
  );
};
```

#### Mark as Delivered Function
```javascript
const markAsDelivered = async (orderId) => {
  // 1. Update order status
  await orderApi.updateOrderStatus(orderId, { 
    status: 'delivered',
    notes: 'Order delivered successfully'
  });
  
  // 2. Send delivery notification
  await sendOrderNotification(
    order.customer.id,
    order.orderNumber,
    'delivered',
    productData
  );
  
  // 3. Send review request (after 2 seconds)
  setTimeout(async () => {
    await sendOrderNotification(
      order.customer.id,
      order.orderNumber,
      'review_request',
      productData
    );
  }, 2000);
};
```

#### Ship Order Function
```javascript
const shipOrder = async () => {
  // 1. Update order with tracking number
  await orderApi.updateOrderStatus(orderId, { 
    status: 'shipped',
    trackingNumber: trackingNumber.trim(),
    notes: `Order shipped with tracking: ${trackingNumber}`
  });
  
  // 2. Send notification WITH tracking number
  await sendOrderNotification(
    order.customer.id,
    order.orderNumber,
    'shipped',
    productData,
    trackingNumber.trim()  // ← Tracking number included
  );
};
```

---

### Frontend API: `src/api/chatApi.js`

```javascript
export const sendOrderNotification = async (
  buyerId, 
  orderNumber, 
  status, 
  productData = null, 
  trackingNumber = null
) => {
  const response = await fetch(`${BASE_URL}/api/chat/send-order-notification`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      buyerId,           // Buyer's user ID
      orderNumber,       // e.g., "ORD-12345"
      status,            // 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'review_request'
      productData,       // Product info (name, image, price, quantity)
      trackingNumber     // Optional - only for 'shipped' status
    })
  });
};
```

---

### Backend API: `server/routes/chatRoutes.js`

#### Endpoint: `POST /api/chat/send-order-notification`

```javascript
router.post("/send-order-notification", auth, async (req, res) => {
  const { buyerId, orderNumber, status, productData, trackingNumber } = req.body;
  const sellerId = req.user.id; // Current user is the seller
  
  // 1. Generate notification message based on status
  let message = '';
  switch (status.toLowerCase()) {
    case 'confirmed':
      message = `✅ Great news! Your order #${orderNumber} has been confirmed...`;
      break;
    case 'processing':
      message = `📦 Your order #${orderNumber} is now being processed...`;
      break;
    case 'shipped':
      message = trackingNumber 
        ? `🚚 Your order #${orderNumber} has been shipped! Tracking Number: ${trackingNumber}...`
        : `🚚 Your order #${orderNumber} has been shipped...`;
      break;
    case 'delivered':
      message = `🎉 Your order #${orderNumber} has been delivered!...`;
      break;
    case 'cancelled':
      message = `❌ Your order #${orderNumber} has been cancelled...`;
      break;
    case 'review_request':
      message = `⭐ How was your experience? Please review this product...`;
      break;
  }
  
  // 2. Insert notification message into messages table
  const insertData = {
    buyer_id: buyerId,
    seller_id: sellerId,
    sender_id: sellerId,     // Seller is sending the notification
    message: message,
    product_data: JSON.stringify({ 
      ...productData,
      orderNumber: orderNumber,
      status: status,
      trackingNumber: trackingNumber,
      isOrderNotification: true 
    }),
    created_at: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };
  
  await supabase.from('messages').insert(insertData);
});
```

---

## 📱 How Buyer Sees Notifications

### In Chat List
- New message badge appears on seller's chat
- Last message shows: "🚚 Your order #ORD-12345 has been shipped!"
- Unread count increases

### In Chat Screen
- Notification appears as a message FROM the seller
- Message includes:
  - ✅ Status emoji and text
  - 📦 Order number
  - 📸 Product image (if available)
  - 🔢 Tracking number (for shipped orders)

### Example Chat Message:
```
┌─────────────────────────────────┐
│ [Seller Avatar]                 │
│                                 │
│ 🚚 Your order #ORD-12345 has   │
│ been shipped! Tracking Number:  │
│ TN-987654321. You'll receive    │
│ it soon!                        │
│                                 │
│ [Product Image]                 │
│ Luxury Chandelier               │
│ ₱25,999                         │
│                                 │
│ 10:30 AM                        │
└─────────────────────────────────┘
```

---

## 🎯 Order Status Messages

### ✅ Confirmed
```
✅ Great news! Your order #ORD-12345 has been confirmed 
and is being prepared for processing.
```

### 📦 Processing
```
📦 Your order #ORD-12345 is now being processed. 
We're preparing your items for shipment.
```

### 🚚 Shipped (with tracking)
```
🚚 Your order #ORD-12345 has been shipped! 
Tracking Number: TN-987654321. You'll receive it soon!
```

### 🚚 Shipped (without tracking)
```
🚚 Your order #ORD-12345 has been shipped 
and is on its way to you!
```

### 🎉 Delivered
```
🎉 Your order #ORD-12345 has been delivered! 
We hope you enjoy your purchase. Thank you for shopping with us!
```

### ⭐ Review Request
```
⭐ How was your experience? Please take a moment to review 
this product and rate our shop! Your feedback helps us improve 
and helps other buyers make informed decisions. Thank you! 💙
```

### ❌ Cancelled
```
❌ Your order #ORD-12345 has been cancelled. 
If you have any questions, please feel free to contact us.
```

---

## 🔍 Key Data Flow

### 1. Product Data Structure
```javascript
const productData = {
  id: item.id,
  name: item.name,
  image: item.image,        // Product image URL
  price: item.price,        // Formatted price
  quantity: item.quantity   // Order quantity
};
```

### 2. Message Data Structure (in database)
```javascript
{
  buyer_id: "uuid-buyer",
  seller_id: "uuid-seller",
  sender_id: "uuid-seller",      // Always seller for notifications
  message: "🚚 Your order #...",
  product_data: {
    id: "product-id",
    name: "Product Name",
    image: "image-url",
    price: "₱25,999",
    quantity: 2,
    orderNumber: "ORD-12345",
    status: "shipped",
    trackingNumber: "TN-123",
    isOrderNotification: true    // Flag to identify notifications
  },
  is_read: false,
  created_at: "2024-01-15T10:30:00Z",
  timestamp: "2024-01-15T10:30:00Z"
}
```

---

## ✅ Current Features

| Feature | Status | Description |
|---------|--------|-------------|
| Confirm Order Notification | ✅ Working | Buyer notified when order confirmed |
| Processing Notification | ✅ Working | Buyer notified when processing starts |
| Shipping Notification | ✅ Working | Buyer notified with tracking number |
| Delivery Notification | ✅ Working | Buyer notified when delivered |
| Review Request | ✅ Working | Automatic review request after delivery |
| Cancellation Notification | ✅ Working | Buyer notified if order cancelled |
| Product Attachment | ✅ Working | Product image/info shown in chat |
| Unread Badge | ✅ Working | Badge shows unread notifications |
| Chat History | ✅ Working | All notifications saved in chat |

---

## 🛠️ Backend Order Status Update Endpoint

### `PUT /api/orders/:id/status`

**Request:**
```javascript
{
  "status": "shipped",
  "trackingNumber": "TN-123456",
  "notes": "Order shipped via FedEx"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Order status updated successfully",
  "order": { ...orderData }
}
```

**Important:** This endpoint:
- ✅ Updates order status in database
- ✅ Records status history
- ❌ **Does NOT** send chat notifications (done separately in frontend)

---

## 💡 How It All Works Together

### Complete Flow Example: Seller Ships Order

```
1. Seller clicks "Ship Order" button
   ↓
2. Seller enters tracking number in modal
   ↓
3. Frontend calls orderApi.updateOrderStatus()
   ↓
4. Backend updates order status to 'shipped'
   ↓
5. Frontend receives success response
   ↓
6. Frontend calls sendOrderNotification()
   ↓
7. Backend creates chat message with notification
   ↓
8. Buyer's chat list updates with new message
   ↓
9. Buyer sees unread badge
   ↓
10. Buyer opens chat and reads notification
```

---

## 🐛 Important Notes

### Customer ID Requirement
The notification system requires `customer.id` (buyer ID) to work:
```javascript
// In Orders.jsx - customer object structure
{
  customer: {
    id: order.buyer.id,        // ← CRITICAL for notifications
    name: order.buyer.full_name,
    phone: order.buyer.phone,
    email: order.buyer.email
  }
}
```

### Product Data
Product data is extracted from the first item in the order:
```javascript
const firstItem = order.items?.[0];
const productData = firstItem ? {
  id: firstItem.id,
  name: firstItem.name,
  image: firstItem.image,
  price: firstItem.price,
  quantity: firstItem.quantity
} : null;
```

### Error Handling
- If notification fails, order status is still updated
- Errors are logged but don't block the status update
- User sees success message for status update even if notification fails

---

## 🔮 Future Enhancements

Possible improvements:
1. **Push Notifications**: Real-time mobile notifications
2. **Email Notifications**: Send email alongside chat notification
3. **SMS Notifications**: Text message for important updates
4. **Notification Templates**: Customizable message templates
5. **Multi-language**: Support for different languages
6. **Notification History**: Separate notification panel
7. **Rich Media**: Add images, videos to notifications
8. **Order Timeline**: Visual timeline of order status changes

---

## 🧪 Testing Order Notifications

### Test Checklist

#### As Seller:
- [ ] Confirm a pending order → Check buyer chat
- [ ] Start processing → Check buyer chat
- [ ] Ship order with tracking → Check buyer chat (tracking number visible)
- [ ] Mark as delivered → Check buyer chat (2 messages: delivery + review request)
- [ ] Cancel order → Check buyer chat

#### As Buyer:
- [ ] Receive confirmed notification → See ✅ message in chat
- [ ] Receive processing notification → See 📦 message
- [ ] Receive shipped notification → See 🚚 message with tracking
- [ ] Receive delivered notification → See 🎉 message
- [ ] Receive review request → See ⭐ message
- [ ] Receive cancellation → See ❌ message
- [ ] Click product attachment → Should show product details
- [ ] Unread badge updates correctly

---

## 📝 Code References

### Files Involved

**Frontend:**
- `src/screens/seller/Orders.jsx` - Seller order management
- `src/api/chatApi.js` - sendOrderNotification function
- `src/api/orderApi.js` - updateOrderStatus function
- `src/screens/buyer/Chat.jsx` - Buyer chat view
- `src/screens/buyer/ChatList.jsx` - Buyer chat list

**Backend:**
- `server/routes/chatRoutes.js` - Notification endpoint
- `server/routes/orderRoutes.js` - Order status update endpoint

**Database:**
- `messages` table - Stores notifications
- `orders` table - Stores order status
- `order_status_history` - Stores status change history

---

## 🎓 Summary

The order notification system is **fully functional** and works as follows:

1. ✅ Seller updates order status through UI
2. ✅ Frontend calls backend API to update database
3. ✅ Frontend sends notification to buyer via chat
4. ✅ Buyer receives notification as chat message
5. ✅ Notification includes order details, product info, and tracking (if applicable)
6. ✅ Buyer can view notification in chat list and chat screen
7. ✅ Unread badges work correctly

**Everything is working!** The system automatically notifies buyers about all order status changes through the chat system.
