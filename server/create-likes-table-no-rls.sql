-- Run this SQL in Supabase SQL Editor to create the likes table WITHOUT RLS

-- Create likes table for storing user's favorite products
CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id) -- Prevent duplicate likes
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_product_id ON likes(product_id);

-- NO RLS - Direct access for service role
-- This allows the backend API to work without authentication issues
