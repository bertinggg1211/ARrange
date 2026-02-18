-- Fix messages table to support product data and proper timestamps
-- Run this in your Supabase SQL Editor

-- Add missing columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS product_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to have created_at from timestamp if null
UPDATE messages 
SET created_at = timestamp 
WHERE created_at IS NULL;

-- Create index for better performance on created_at queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_buyer_seller ON messages(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
