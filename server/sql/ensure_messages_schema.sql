-- Ensure messages table has all required columns for order notifications
-- Run this in your Supabase SQL Editor if you're experiencing issues with notifications

-- Check current schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Add product_data column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'product_data'
    ) THEN
        ALTER TABLE messages ADD COLUMN product_data JSONB DEFAULT NULL;
        RAISE NOTICE 'Added product_data column to messages table';
    ELSE
        RAISE NOTICE 'product_data column already exists';
    END IF;
END $$;

-- Add created_at column if it doesn't exist (in addition to timestamp)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE messages ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to messages table';
        
        -- Copy timestamp values to created_at for existing rows
        UPDATE messages SET created_at = timestamp WHERE created_at IS NULL;
    ELSE
        RAISE NOTICE 'created_at column already exists';
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_buyer_seller_created 
ON messages(buyer_id, seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_seller_buyer_created 
ON messages(seller_id, buyer_id, created_at DESC);

-- Verify final schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Test query to see messages grouped by conversation
SELECT 
    buyer_id,
    seller_id,
    COUNT(*) as message_count,
    MIN(created_at) as first_message,
    MAX(created_at) as last_message
FROM messages
GROUP BY buyer_id, seller_id
ORDER BY last_message DESC;
