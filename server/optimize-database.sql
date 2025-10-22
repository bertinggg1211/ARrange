-- Database optimization for better performance
-- Run this in your Supabase SQL Editor

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_shop_name ON users(shop_name);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON products(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_products_seller_created ON products(seller_id, created_at);

-- Optimize seller profile queries
CREATE INDEX IF NOT EXISTS idx_users_seller_profile ON users USING GIN (seller_profile);

-- Add partial indexes for active products only
CREATE INDEX IF NOT EXISTS idx_products_active ON products(seller_id) WHERE status = 'active';

-- Analyze tables for better query planning
ANALYZE users;
ANALYZE products;
