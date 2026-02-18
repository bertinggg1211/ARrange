-- Fix order notifications issue in chat
-- This adds missing columns to the messages table to support order notifications

-- 1. Add missing columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS product_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Update existing rows to have created_at from timestamp if null
UPDATE messages 
SET created_at = timestamp 
WHERE created_at IS NULL;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_buyer_seller ON messages(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- 4. Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- 5. Test query to see if order notifications are being stored
SELECT 
    id,
    buyer_id,
    seller_id,
    sender_id,
    message,
    product_data,
    created_at,
    is_read
FROM messages
WHERE product_data IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
