# Chat Message Fix - Missing Database Columns

## Problem
Messages sent by buyers are not appearing for sellers (and vice versa) because the `messages` table is missing required columns that the server code expects.

## Root Cause
The server code (`server/routes/chatRoutes.js`) tries to insert messages with:
- `product_data` (JSONB) - for product inquiries
- `created_at` (TIMESTAMP) - for message timestamps

But your current database schema only has:
- `timestamp` (not `created_at`)
- No `product_data` column

## Solution

### Step 1: Run the SQL Migration
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Run the following SQL script (or use `server/sql/fix_messages_table.sql`):

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

### Step 2: Test the Chat
1. **As a Buyer:**
   - Go to a product
   - Click "Contact Seller" or send a message
   - Type a message and send it

2. **As a Seller:**
   - Check the chat list
   - Open the conversation with the buyer
   - You should now see the buyer's message
   - Reply to the message

3. **As a Buyer again:**
   - Check the chat
   - You should see the seller's reply

### Step 3: Verify
After running the migration, messages should flow bidirectionally:
- ✅ Buyer → Seller messages visible to seller
- ✅ Seller → Buyer messages visible to buyer
- ✅ Product inquiries with product data work
- ✅ Order notifications work

## Technical Details

The messages table now has the correct schema:
- `id` - UUID primary key
- `buyer_id` - UUID reference to buyer
- `seller_id` - UUID reference to seller
- `sender_id` - UUID reference to message sender
- `message` - Text content
- `product_data` - JSONB for product information (**NEW**)
- `is_read` - Boolean for read status
- `timestamp` - Original timestamp field
- `created_at` - Timestamp for message creation (**NEW**)

## Why This Happened
You have multiple schema files in your project:
1. `supabase-schema.sql` - Old schema with `chat_id` reference
2. `server/sql/create_chat_tables.sql` - New schema with `conversation_id`
3. `server/COMPLETE_SUPABASE_SCHEMA.sql` - Current schema with direct buyer/seller references

The server code was updated to use `product_data` and `created_at`, but the database wasn't migrated to match.
