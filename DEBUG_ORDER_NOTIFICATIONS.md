# Debug Guide for Order Notifications

## What to Check When Testing

### Step 1: Restart the Server
```bash
cd server
npm start
```

### Step 2: Test Processing Notification

**As Seller:**
1. Go to Orders screen
2. Find a confirmed order
3. Click "Start Processing" button
4. Watch the **server console logs**

**Expected Server Logs:**
```
🔔 POST /api/chat/send-order-notification - Sending order status notification
📥 Request body: { buyerId: '...', orderNumber: 'ORD-...', status: 'processing', productData: {...} }
📝 Inserting order notification: {
  buyer_id: '...',
  seller_id: '...',
  sender_id: '...',
  message: '📦 Your order #ORD-... is now being processed. We\'re preparing your items for shipment.',
  product_data: '{"id":"...","name":"...","image":"...",...}',
  created_at: '...'
}
✅ Order notification sent successfully: [message-id]
```

**Key Things to Check:**
- ✅ Is `message` field populated with the full text?
- ✅ Is `product_data` a JSON string?
- ✅ Does the insert succeed?

### Step 3: Check Buyer's Chat Screen

**As Buyer:**
1. Open the app
2. Go to Chat screen
3. Open chat with the seller
4. Watch the **app console logs** (React Native debugger or Metro bundler)

**Expected App Logs:**
```
💬 Chat: Loading chat with shopId: [seller-id]
💬 ChatContext: Mapping message: [message-id]
💬 ChatContext: Raw message data: {
  "id": "...",
  "message": "📦 Your order #ORD-... is now being processed...",
  "sender": "seller",
  "timestamp": "10:30 AM",
  "productData": { "id": "...", "name": "...", ... }
}
💬 ChatContext: Message text: 📦 Your order #ORD-... is now being processed...
💬 ChatContext: Has productData: true
🔍 Rendering message: {
  id: '...',
  hasMessage: true,
  messageLength: 95,
  messagePreview: '📦 Your order #ORD-12345 is now being processed...',
  hasProductData: true,
  sender: 'seller'
}
```

**Key Things to Check:**
- ✅ Does `msg.message` have the full text?
- ✅ Is `messageLength` greater than 0?
- ✅ Does the message preview show correctly?

### Step 4: Identify the Problem

#### Problem A: Message is empty in server logs
**Symptom:** Server logs show `message: ''` or `message: null`
**Cause:** The switch/case in chatRoutes.js isn't matching the status
**Fix:** Check that the status being sent is exactly 'processing' (lowercase)

#### Problem B: Message is populated in server but empty in app
**Symptom:** Server logs show correct message, but app logs show `message: ''`
**Cause:** The message field isn't being returned from the database query
**Fix:** Check the SELECT query in chatRoutes.js line 280-290

#### Problem C: Message exists but shows as blank in UI
**Symptom:** App logs show `hasMessage: true` but UI shows blank orange box
**Cause:** CSS/styling issue hiding the text
**Fix:** Check Chat.style.js for msgText styles

#### Problem D: productData is null or undefined
**Symptom:** Server inserts product_data but app receives null
**Cause:** JSON parsing issue in chatRoutes.js
**Fix:** Already fixed in our previous update

## Quick Fix Commands

### Fix 1: Check Database Directly
Run this in Supabase SQL Editor:
```sql
SELECT 
  id,
  message,
  product_data,
  sender_id,
  created_at
FROM messages
WHERE product_data IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result:**
- ✅ `message` column should have full text
- ✅ `product_data` column should have JSON object
- ✅ Both should NOT be null

### Fix 2: Clear Cache and Restart
```bash
# Clear React Native cache
cd ThesisFinal
npx react-native start --reset-cache

# In another terminal, rebuild the app
npx react-native run-android
# or
npx react-native run-ios
```

### Fix 3: Check for Null Message in Database
If messages are stored but `message` field is null, update them:
```sql
-- Find messages with null message field
SELECT id, message, product_data
FROM messages
WHERE message IS NULL OR message = '';

-- If you find any, this means the insert is failing
-- Check server logs for errors during insert
```

## Common Issues and Solutions

### Issue 1: Orange Box with No Text
**Symptoms:**
- ✅ Product card shows correctly
- ❌ Message text is blank
- ❌ Orange bubble appears empty

**Root Cause:** `item.message` is undefined, null, or empty string

**Debug Steps:**
1. Check app console for: `messagePreview: '...'`
2. If preview is empty, check: `💬 ChatContext: Message text: ...`
3. If ChatContext shows empty, check server logs

**Solution:** The message isn't being set properly in the database insert

### Issue 2: No Messages Appear at All
**Symptoms:**
- ❌ No messages show up in chat
- ❌ Chat shows "No messages yet"

**Root Cause:** Query filter mismatch (buyer_id/seller_id)

**Solution:** Check server logs for query parameters

### Issue 3: Confirmed Works, Processing Doesn't
**Symptoms:**
- ✅ Confirmed notification appears with text
- ❌ Processing notification shows blank

**Root Cause:** Likely a timing issue or the message field is being overwritten

**Debug Steps:**
1. Compare the insert data for both status types in server logs
2. Check if both use the same code path
3. Verify both messages appear in database

## Live Debugging

Run these commands while testing:

**Terminal 1 - Server Logs:**
```bash
cd server
npm start
```
Watch for:
- `🔔 POST /api/chat/send-order-notification`
- `📝 Inserting order notification:`
- `✅ Order notification sent successfully`

**Terminal 2 - App Logs:**
```bash
cd ThesisFinal
npx react-native start
```
Watch for:
- `💬 ChatContext: Message text:`
- `🔍 Rendering message:`
- `messagePreview:`

**Terminal 3 - Database Query:**
```sql
-- Run this after each notification send
SELECT 
  message,
  LENGTH(message) as msg_length,
  created_at
FROM messages
ORDER BY created_at DESC
LIMIT 1;
```

## Expected vs Actual

### ✅ What Should Happen
1. Seller clicks "Start Processing"
2. Server receives notification request with status='processing'
3. Server creates message: "📦 Your order #... is now being processed..."
4. Message is inserted into database with full text
5. Buyer opens chat
6. Server queries messages and returns them
7. ChatContext maps messages correctly
8. Chat screen renders message with text

### ❌ What's Happening (Your Case)
1. ✅ Seller clicks "Start Processing" - WORKS
2. ✅ Server receives request - WORKS (you see toast notification)
3. ✅ Server creates message - NEED TO VERIFY
4. ❓ Message inserted - NEED TO VERIFY
5. ✅ Buyer opens chat - WORKS
6. ❓ Server returns messages - NEED TO CHECK LOGS
7. ❓ ChatContext maps correctly - NEED TO CHECK LOGS
8. ❌ Message shows as blank orange box - FAILS

## Next Steps

1. **Test with the new debugging logs** I just added
2. **Look for these specific logs:**
   - `💬 ChatContext: Message text: [should show full text]`
   - `messagePreview: [should show first 50 chars]`
   - `hasMessage: true`
   
3. **If message is empty in logs:**
   - Problem is in server or database
   - Check server INSERT logs
   - Check database directly with SQL
   
4. **If message exists in logs but blank in UI:**
   - Problem is in React Native rendering
   - Check styles (might be white text on white background)
   - Check if text is being cut off by CSS

5. **Share the console output** with me so I can pinpoint exactly where the message text is being lost
