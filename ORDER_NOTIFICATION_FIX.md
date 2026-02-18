# Order Notification Fix - Chat Not Showing Notifications

## Problem
When a seller confirms an order, a notification appears briefly in the app, but when the buyer navigates to the chat screen, the notification message doesn't appear.

## Root Cause
The `messages` table in your Supabase database is **missing two critical columns**:
1. `product_data` (JSONB) - Stores order and product information with the notification
2. `created_at` (TIMESTAMP) - Proper timestamp column for message ordering

The server code tries to insert order notifications with these columns, but if they don't exist in your database, the insert either fails silently or the data is lost.

## Solution

### Step 1: Run the SQL Fix in Supabase
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Run the SQL script located at: `server/sql/fix_order_notifications.sql`

Or copy and paste this:

```sql
-- Add missing columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS product_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to have created_at from timestamp if null
UPDATE messages 
SET created_at = timestamp 
WHERE created_at IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_buyer_seller ON messages(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
```

### Step 2: Verify the Fix
Run this query to check if the columns were added:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
```

You should see both `product_data` and `created_at` in the list.

### Step 3: Test the Flow
1. **As a seller**: Confirm a pending order
2. **Check server logs**: You should see "✅ Order confirmation notification sent to buyer"
3. **As a buyer**: 
   - You'll see a toast notification appear
   - Navigate to Chat screen
   - You should now see the order notification message in the chat

## How Order Notifications Work

### Flow Diagram
```
Seller Confirms Order
    ↓
Server: orderRoutes.js (line 273-323)
    ↓
Server: Calls sendOrderNotification() from chatApi
    ↓
Server: chatRoutes.js /send-order-notification (line 846-906)
    ↓
Database: Inserts into messages table with:
    - buyer_id
    - seller_id  
    - sender_id (seller)
    - message (confirmation text)
    - product_data (order info + product details)
    - created_at
    ↓
Buyer Opens Chat
    ↓
Client: Chat.jsx fetches messages
    ↓
Server: chatRoutes.js /messages/:partnerId
    ↓
Messages filtered by buyer_id and seller_id
    ↓
Buyer sees notification in chat!
```

### Message Format
Order notifications are stored with this structure:

```json
{
  "id": "uuid",
  "buyer_id": "buyer-uuid",
  "seller_id": "seller-uuid",
  "sender_id": "seller-uuid",
  "message": "✅ Great news! Your order #ORD-12345 has been confirmed...",
  "product_data": {
    "id": "product-uuid",
    "name": "Product Name",
    "image": "image-url",
    "price": "₱1,000",
    "quantity": 1,
    "orderNumber": "ORD-12345",
    "status": "confirmed",
    "isOrderNotification": true
  },
  "created_at": "2026-02-18T14:37:00Z",
  "is_read": false
}
```

## Troubleshooting

### Issue: Still not seeing messages after running SQL
**Solution**: Check if messages are being inserted:
```sql
SELECT * FROM messages 
WHERE product_data IS NOT NULL 
ORDER BY created_at DESC LIMIT 5;
```

### Issue: Error inserting messages
**Solution**: Check server logs for errors. Common issues:
- RLS (Row Level Security) policies blocking insert
- Missing foreign key references (buyer_id or seller_id don't exist)

### Issue: Messages appear but product_data is null
**Solution**: The column exists but data isn't being passed. Check:
1. Server logs show the product data being sent
2. The `sendOrderNotification` function in `chatApi.js` is being called with correct params

## Database Schema Reference

### Correct Messages Table Schema
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    product_data JSONB DEFAULT NULL,  -- ✅ REQUIRED for order notifications
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  -- ✅ REQUIRED for proper ordering
);
```

## Testing Checklist

- [ ] SQL script executed successfully in Supabase
- [ ] `product_data` column exists in messages table
- [ ] `created_at` column exists in messages table
- [ ] Seller can confirm an order without errors
- [ ] Server logs show "Order confirmation notification sent"
- [ ] Buyer sees toast notification
- [ ] Buyer can see the notification in Chat screen
- [ ] Message shows order details and product info
- [ ] Message timestamp is correct

## Next Steps After Fix

Once this is working, the same notification system handles:
- ✅ Order Confirmed
- 📦 Order Processing
- 🚚 Order Shipped (with tracking number)
- 🎉 Order Delivered
- ❌ Order Cancelled
- ⭐ Review Requests (after delivery)

All these use the same `sendOrderNotification` function and will work automatically once the database schema is fixed.
