-- Fix Messages Table Schema
-- This script adds the missing columns to make the chat API work properly

-- Add created_at column (alias for timestamp)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
UPDATE messages SET created_at = timestamp WHERE created_at IS NULL;

-- Add sender_type column
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_type VARCHAR(10) CHECK (sender_type IN ('buyer', 'seller'));

-- Update sender_type based on sender_id relationship
UPDATE messages 
SET sender_type = 'buyer' 
WHERE sender_id = buyer_id;

UPDATE messages 
SET sender_type = 'seller' 
WHERE sender_id = seller_id;

-- Add product_data column for product-related messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_data JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_buyer_seller ON messages(buyer_id, seller_id);

-- Verify the schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;
