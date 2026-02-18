# Testing Order Notifications Guide

## Quick Test Steps

Follow these steps to verify that all order notifications are working correctly:

### Setup
1. Have two accounts ready:
   - **Buyer account** (logged in on one device/browser)
   - **Seller account** (logged in on another device/browser)

2. Create a test order:
   - As buyer: Add a product to cart
   - Complete checkout
   - Order status will be **Pending**

### Test Each Status Transition

#### ✅ Test 1: Confirm Order
**Seller Side:**
1. Go to **Orders** screen
2. Find the pending order
3. Click **"Confirm Order"** button
4. See success message: "Order confirmed successfully! Customer has been notified."

**Buyer Side:**
1. See notification toast appear (brief popup)
2. Go to **Chat** screen
3. Open chat with the seller
4. **VERIFY:** You should see a message like:
   ```
   ✅ Great news! Your order #ORD-12345 has been confirmed and is being prepared for processing.
   ```
5. **VERIFY:** Product image and details are attached to the message

#### 📦 Test 2: Start Processing
**Seller Side:**
1. Go to **Orders** screen
2. Find the confirmed order
3. Click **"Start Processing"** button
4. See success message: "Order is now being processed! Customer has been notified."

**Buyer Side:**
1. See notification toast appear
2. Go to **Chat** screen
3. Open chat with the seller
4. **VERIFY:** You should see a NEW message like:
   ```
   📦 Your order #ORD-12345 is now being processed. We're preparing your items for shipment.
   ```
5. **VERIFY:** Product image and details are attached

#### 🚚 Test 3: Ship Order
**Seller Side:**
1. Go to **Orders** screen
2. Find the processing order
3. Click **"Ship Order"** button
4. Enter tracking number (e.g., "TRACK123456")
5. Click "Confirm Shipment"
6. See success message: "Order shipped successfully! Customer has been notified."

**Buyer Side:**
1. See notification toast appear
2. Go to **Chat** screen
3. Open chat with the seller
4. **VERIFY:** You should see a NEW message like:
   ```
   🚚 Your order #ORD-12345 has been shipped! Tracking Number: TRACK123456. You'll receive it soon!
   ```
5. **VERIFY:** Product image and details are attached
6. **VERIFY:** Tracking number is visible in the message

#### 🎉 Test 4: Mark Delivered
**Seller Side:**
1. Go to **Orders** screen
2. Find the shipped order
3. Click **"Mark Delivered"** button
4. Confirm the delivery
5. See success message: "Order marked as delivered! Customer has been notified."

**Buyer Side:**
1. See notification toast appear
2. Go to **Chat** screen
3. Open chat with the seller
4. **VERIFY:** You should see TWO NEW messages:
   - **Delivery confirmation:**
     ```
     🎉 Your order #ORD-12345 has been delivered! We hope you enjoy your purchase. Thank you for shopping with us!
     ```
   - **Product Review request** (appears 2 seconds later):
     ```
     ⭐ How was your experience? Please take a moment to review this product...
     ```
   - **Shop Review request** (appears 4 seconds later):
     ```
     ⭐ How was your experience? Please rate our shop...
     ```
5. **VERIFY:** All three messages appear with product/shop details
6. **VERIFY:** Review request messages have a "Tap to Rate" button

#### ❌ Test 5: Cancel Order (Optional)
**Seller Side:**
1. Create a new pending order
2. Go to **Orders** screen
3. Click **"Cancel Order"** button
4. Confirm cancellation
5. See success message: "Order cancelled and customer has been notified."

**Buyer Side:**
1. See notification toast appear
2. Go to **Chat** screen
3. **VERIFY:** You should see a message like:
   ```
   ❌ Your order #ORD-12345 has been cancelled. If you have any questions, please feel free to contact us.
   ```

### Expected Results

For EACH status change, you should see:

1. **Seller Side:**
   - ✅ Success alert with confirmation message
   - ✅ Order status updated in the Orders list
   - ✅ Console logs showing "notification sent to buyer"

2. **Buyer Side:**
   - ✅ Toast notification appears briefly (3-5 seconds)
   - ✅ Chat screen shows the notification message
   - ✅ Message includes order number and status emoji
   - ✅ Product image and details are attached
   - ✅ Message appears as coming from the seller (left side)
   - ✅ Timestamp is correct

### Troubleshooting

#### Problem: No messages appear in chat
**Check:**
1. Server logs for errors
2. Database has `product_data` column in messages table
3. Both users are looking at the correct seller/buyer chat

#### Problem: Messages appear but no product images
**Check:**
1. Product has valid image URLs in database
2. Image URLs are accessible (not blocked by CORS)
3. Console logs for image loading errors

#### Problem: "Confirmed" works but "Processing" doesn't
**Solution:**
- This was the original bug - it's now fixed!
- Make sure you've restarted the server after applying the fix
- Clear any cached data in the app

### Server Logs to Watch

When testing, watch server console for these logs:

```bash
# When seller confirms order
🔔 POST /api/chat/send-order-notification - Sending order status notification
📥 Request body: { buyerId: '...', orderNumber: 'ORD-...', status: 'confirmed' }
📝 Inserting order notification: { buyer_id: '...', seller_id: '...', message: '✅ Great news!...' }
✅ Order notification sent successfully

# When buyer opens chat
💬 Fetching messages for user: [buyer-id] with partner: [seller-id]
🔍 Query result - Found messages: 3
🔍 Parsed product_data from JSON string: { id: '...', name: '...' }
✅ Successfully queried messages table
📤 Sending response with 3 messages
```

### Database Verification (Optional)

If you want to check the database directly:

```sql
-- Check if messages are being stored
SELECT 
  id,
  message,
  product_data,
  created_at
FROM messages
WHERE product_data IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- You should see rows with:
-- - Order confirmation messages
-- - product_data as JSONB with order info
-- - Correct buyer_id and seller_id
```

## Common Issues Fixed

### ✅ Issue 1: JSON.parse() Error
**Problem:** Supabase returns JSONB columns as objects, not strings  
**Fix:** Now handles both string and object formats

### ✅ Issue 2: Missing product_data Column
**Problem:** Database schema didn't have product_data column  
**Fix:** Run the SQL fix in `server/sql/fix_order_notifications.sql`

### ✅ Issue 3: Wrong Field Name
**Problem:** Code looked for `productData` but server sent `product_data`  
**Fix:** Server now properly parses and returns as `productData` in camelCase

## Success Indicators

You know it's working when:
- ✅ All 5 status transitions send notifications
- ✅ Notifications appear in chat with product images
- ✅ Messages are from "seller" (left-aligned)
- ✅ Timestamps are accurate
- ✅ No console errors
- ✅ Server logs show successful notification sends
- ✅ Database contains messages with product_data
